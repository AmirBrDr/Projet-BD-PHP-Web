// ============================================================
// Fichier: public/assets/js/statistiques.js
// ============================================================

const API_URL = '/api/modules/statistics/';

const loadingEl   = document.getElementById('loading');
const contenuEl   = document.getElementById('contenu');
const erreurEl    = document.getElementById('erreur');
const erreurMsgEl = document.getElementById('erreur-msg');
const moisLabelEl = document.getElementById('mois-label');

function afficherMois() {
    const now = new Date();
    const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (moisLabelEl) {
        moisLabelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    }
}

function remplirKpis(globales, parTheme) {
    document.getElementById('kpi-defis').textContent        = globales.total_defis ?? 0;
    document.getElementById('kpi-participants').textContent = globales.total_validations ?? 0;
    document.getElementById('kpi-co2').textContent          = globales.total_co2 ?? 0;
    document.getElementById('kpi-themes').textContent       = parTheme && parTheme.length > 0 ? parTheme[0].nomtheme : '-';
}

function afficherBarChart(parDefi) {
    const el = document.getElementById('chart-defis');
    el.innerHTML = '';

    if (!parDefi || parDefi.length === 0) {
        el.innerHTML = '<p style="color:var(--shell-muted);font-size:13px">Aucune donnée.</p>';
        return;
    }

    const max = Math.max(...parDefi.map(d => parseInt(d.nb_validations))) || 1;

    parDefi.forEach(defi => {
        const pct = Math.round((parseInt(defi.nb_validations) / max) * 100);
        const item = document.createElement('div');
        item.className = 'bar-item';
        item.innerHTML = `
            <div class="bar-header">
                <span class="bar-label">${defi.nomdefi}</span>
                <div style="display:flex;gap:8px;align-items:center">
                    <span class="bar-theme-badge">${defi.nomtheme}</span>
                    <span class="bar-value">${defi.nb_validations} validation(s)</span>
                </div>
            </div>
            <div class="bar-track">
                <div class="bar-fill" style="width: ${pct}%"></div>
            </div>
        `;
        el.appendChild(item);
    });
}

function afficherThemes(parDefi) {
    const el = document.getElementById('chart-themes');
    el.innerHTML = '';

    if (!parDefi || parDefi.length === 0) {
        el.innerHTML = '<p style="color:var(--shell-muted);font-size:13px">Aucune donnée.</p>';
        return;
    }

    const maxVal = Math.max(...parDefi.map(d => parseInt(d.nb_validations))) || 1;

    parDefi.forEach((defi, index) => {
        const pct = Math.round((parseInt(defi.nb_validations) / maxVal) * 100);
        const item = document.createElement('div');
        item.className = 'theme-item';
        item.innerHTML = `
            <div>
                <div class="theme-name">${defi.nomdefi}</div>
                <div class="theme-meta">
                    <span><i class="fas fa-check-circle"></i> ${defi.nb_validations} validation(s)</span>
                    <span><i class="fas fa-star"></i> ${defi.points} pts</span>
                </div>
                <div style="margin-top:8px">
                    <div class="bar-track">
                        <div class="bar-fill" style="width:${pct}%"></div>
                    </div>
                </div>
            </div>
            <div class="theme-rank ${index === 0 ? 'top' : ''}">#${index + 1}</div>
        `;
        el.appendChild(item);
    });
}

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

function afficherErreur(msg) {
    loadingEl.classList.add('hidden');
    contenuEl.classList.add('hidden');
    erreurEl.classList.remove('hidden');
    erreurMsgEl.textContent = msg;
}

async function chargerStats() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.error ?? 'Erreur inconnue');

        const { globales, par_defi, par_theme, validation } = json.data;

        remplirKpis(globales, par_theme);
        afficherBarChart(par_defi);
        afficherThemes(par_defi);
        afficherValidation(validation);

        loadingEl.classList.add('hidden');
        contenuEl.classList.remove('hidden');

    } catch (err) {
        afficherErreur(`Impossible de charger les statistiques : ${err.message}`);
        console.error('Erreur stats :', err);
    }
}

afficherMois();
chargerStats();