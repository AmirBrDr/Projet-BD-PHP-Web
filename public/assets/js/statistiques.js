// ============================================================
// Fichier: public/assets/js/statistiques.js
// Logique de la page Statistiques (Animateur)
// ============================================================

const API_URL = '/api/modules/statistics/index.php';

let validationChart = null;

// --- Éléments DOM ---
const loadingEl  = document.getElementById('loading');
const contenuEl  = document.getElementById('contenu');
const erreurEl   = document.getElementById('erreur');
const erreurMsgEl = document.getElementById('erreur-msg');
const moisLabelEl = document.getElementById('mois-label');

// --- Affiche le mois courant ---
function afficherMois() {
    const now = new Date();
    const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (moisLabelEl) {
        moisLabelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    }
}

// --- Remplit les KPIs globaux ---
function remplirKpis(globales) {
    document.getElementById('kpi-defis').textContent        = globales.total_defis ?? 0;
    document.getElementById('kpi-participants').textContent = globales.total_participants ?? 0;
    document.getElementById('kpi-co2').textContent          = globales.total_co2 ?? 0;
    document.getElementById('kpi-themes').textContent       = globales.total_themes ?? 0;
}

// --- Construit le bar chart participants par défi ---
function afficherBarChart(parDefi) {
    const el = document.getElementById('chart-defis');
    el.innerHTML = '';

    if (!parDefi || parDefi.length === 0) {
        el.innerHTML = '<p style="color:var(--shell-muted);font-size:13px">Aucune donnée.</p>';
        return;
    }

    const max = Math.max(...parDefi.map(d => parseInt(d.nb_participants))) || 1;

    parDefi.forEach(defi => {
        const pct = Math.round((parseInt(defi.nb_participants) / max) * 100);
        const item = document.createElement('div');
        item.className = 'bar-item';
        item.innerHTML = `
            <div class="bar-header">
                <span class="bar-label">${defi.nomdefi}</span>
                <div style="display:flex;gap:8px;align-items:center">
                    <span class="bar-theme-badge">${defi.nomtheme}</span>
                    <span class="bar-value">${defi.nb_participants} participant(s)</span>
                </div>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${pct}%"></div>
            </div>
        `;
        el.appendChild(item);
    });
}

// --- Construit la liste par thématique ---
function afficherThemes(parTheme) {
    const el = document.getElementById('chart-themes');
    el.innerHTML = '';

    if (!parTheme || parTheme.length === 0) {
        el.innerHTML = '<p style="color:var(--shell-muted);font-size:13px">Aucune donnée.</p>';
        return;
    }

    parTheme.forEach((theme, index) => {
        const item = document.createElement('div');
        item.className = 'theme-item';
        item.innerHTML = `
            <div>
                <div class="theme-name">${theme.nomtheme}</div>
                <div class="theme-meta">
                    <span><i class="fas fa-trophy"></i> ${theme.nb_defis} défi(s)</span>
                    <span><i class="fas fa-users"></i> ${theme.nb_participants} participant(s)</span>
                    <span><i class="fas fa-leaf"></i> ${theme.co2_total} kg CO₂</span>
                </div>
            </div>
            <div class="theme-rank ${index === 0 ? 'top' : ''}">#${index + 1}</div>
        `;
        el.appendChild(item);
    });
}

// --- Construit le graphique Chart.js de validation des défis du mois ---
function afficherValidation(validationMonth) {
    const canvas = document.getElementById('chart-validation');

    if (validationChart) {
        validationChart.destroy();
        validationChart = null;
    }

    if (!validationMonth || validationMonth.length === 0) {
        const wrapper = canvas.parentElement;
        wrapper.innerHTML = '<p style="color:var(--shell-muted);font-size:13px">Aucune donnée pour ce mois.</p>';
        return;
    }

    const labels  = validationMonth.map(d => d.nomdefi ?? d.nomDefi ?? '');
    const valides = validationMonth.map(d => parseInt(d.nb_employes_valides) || 0);
    const totaux  = validationMonth.map(d => parseInt(d.total_employes_equipes) || 0);
    const pcts    = valides.map((v, i) => totaux[i] > 0 ? Math.round((v / totaux[i]) * 100) : 0);

    validationChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Taux de validation',
                data: pcts,
                backgroundColor: 'rgba(43, 212, 124, 0.25)',
                borderColor: '#2bd47c',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const i = ctx.dataIndex;
                            return ` ${valides[i]} validé(s) sur ${totaux[i]} employé(s) — ${pcts[i]}%`;
                        },
                    },
                    backgroundColor: 'rgba(10, 24, 48, 0.92)',
                    titleColor: '#2bd47c',
                    bodyColor: 'rgba(255,255,255,0.8)',
                    borderColor: 'rgba(43,212,124,0.3)',
                    borderWidth: 1,
                    padding: 12,
                },
            },
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        callback: (v) => `${v}%`,
                        font: { size: 11 },
                    },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                },
                y: {
                    ticks: {
                        color: 'rgba(255,255,255,0.8)',
                        font: { size: 12, weight: '600' },
                    },
                    grid: { display: false },
                },
            },
        },
    });
}

// --- Affiche une erreur ---
function afficherErreur(msg) {
    loadingEl.classList.add('hidden');
    contenuEl.classList.add('hidden');
    erreurEl.classList.remove('hidden');
    erreurMsgEl.textContent = msg;
}

// --- Charge les stats ---
async function chargerStats() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.error ?? 'Erreur inconnue');

        const { globales, par_defi, par_theme, validation_month } = json.data;

        remplirKpis(globales);
        afficherBarChart(par_defi);
        afficherThemes(par_theme);
        afficherValidation(validation_month);

        loadingEl.classList.add('hidden');
        contenuEl.classList.remove('hidden');

    } catch (err) {
        afficherErreur(`Impossible de charger les statistiques : ${err.message}`);
        console.error('Erreur stats :', err);
    }
}

// --- Init ---
afficherMois();
chargerStats();