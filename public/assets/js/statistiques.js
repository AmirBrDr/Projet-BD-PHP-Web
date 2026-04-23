// ============================================================
// Fichier: public/assets/js/statistiques.js
// Logique de la page Statistiques (Animateur)
// ============================================================

const API_URL = '/api/modules/statistics/';

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

// --- Construit le taux de validation ---
function afficherValidation(validation) {
    const el = document.getElementById('chart-validation');
    el.innerHTML = '';

    if (!validation || validation.length === 0) {
        el.innerHTML = '<p style="color:var(--shell-muted);font-size:13px">Aucune donnée.</p>';
        return;
    }

    validation.forEach(item => {
        const total  = parseInt(item.nb_actions_total) || 0;
        const valide = parseInt(item.nb_actions_validees) || 0;
        const pct    = total > 0 ? Math.round((valide / total) * 100) : 0;

        const div = document.createElement('div');
        div.className = 'validation-item';
        div.innerHTML = `
            <div class="validation-nom">${item.nomdefi}</div>
            <div class="validation-pct">${pct}%</div>
            <div class="validation-bar-track">
                <div class="validation-bar-fill ${pct === 0 ? 'zero' : ''}" 
                     style="width: ${pct}%"></div>
            </div>
            <div class="validation-meta">
                <span>${valide} validée(s)</span>
                <span>${total} action(s) total</span>
            </div>
        `;
        el.appendChild(div);
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

        const { globales, par_defi, par_theme, validation } = json.data;

        remplirKpis(globales);
        afficherBarChart(par_defi);
        afficherThemes(par_theme);
        afficherValidation(validation);

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