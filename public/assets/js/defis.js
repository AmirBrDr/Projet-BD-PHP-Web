// ============================================================
// Fichier: public/assets/js/defis.js
// Logique de la page Défis du mois (Animateur)
// ============================================================

const API_URL = '/api/modules/challenges/?action=list_month';

// --- Éléments DOM ---
const parcoursEl  = document.getElementById('parcours-list');
const emptyEl     = document.getElementById('empty-state');
const filtreEl    = document.getElementById('filtreTheme');
const moisLabelEl = document.getElementById('mois-label');

let tousLesDefis = [];

// --- Affiche le mois courant dans le header ---
function afficherMois() {
    const now = new Date();
    const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (moisLabelEl) {
        moisLabelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    }
}

// --- Construit une carte défi ---
function creerCarteDefi(defi, index) {
    const card = document.createElement('div');
    card.className = `defi-card ${index === 0 ? 'actif' : ''}`;
    card.dataset.theme = defi.nomtheme || '';

    card.innerHTML = `
        <div class="defi-ordre">${defi.ordre}</div>
        <div class="defi-body">
            <span class="defi-theme-badge">
                <i class="fas fa-tag"></i> ${defi.nomtheme ?? 'Thématique'}
            </span>
            <h3 class="defi-nom">${defi.nomdefi}</h3>
            <p class="defi-desc">${defi.descriptiondefi ?? 'Aucune description.'}</p>
            <div class="defi-meta">
                <span><i class="fas fa-star"></i> ${defi.nbpointsdefi} pts</span>
                <span><i class="fas fa-leaf"></i> ${defi.nbco2defi} kg CO₂</span>
                <span><i class="fas fa-layer-group"></i> Niveau ${defi.niveaudefi}</span>
            </div>
        </div>
        <div class="defi-action">
            <a href="detailDefi.html?id=${defi.id_defi}" class="btn-detail">
                <i class="fas fa-arrow-right"></i> Voir le défi
            </a>
            <span class="participants-count">
                <i class="fas fa-users"></i> ${defi.nb_participants} participant(s)
            </span>
        </div>
    `;

    return card;
}

// --- Affiche les défis dans la page ---
function afficherDefis(defis) {
    parcoursEl.innerHTML = '';

    if (defis.length === 0) {
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    defis.forEach((defi, index) => {
        parcoursEl.appendChild(creerCarteDefi(defi, index));
    });
}

// --- Peuple le filtre thématique ---
function peuplerFiltreTheme(defis) {
    const themes = [...new Set(defis.map(d => d.nomtheme).filter(Boolean))];
    themes.forEach(theme => {
        const opt = document.createElement('option');
        opt.value = theme;
        opt.textContent = theme;
        filtreEl.appendChild(opt);
    });
}

// --- Filtre par thématique ---
filtreEl.addEventListener('change', () => {
    const val = filtreEl.value;
    if (val === 'all') {
        afficherDefis(tousLesDefis);
    } else {
        afficherDefis(tousLesDefis.filter(d => d.nomtheme === val));
    }
});

// --- Charge les défis depuis l'API ---
async function chargerDefis() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

        const json = await res.json();
        tousLesDefis = json.data ?? [];

        peuplerFiltreTheme(tousLesDefis);
        afficherDefis(tousLesDefis);

    } catch (err) {
        parcoursEl.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-exclamation-triangle"></i>
                Impossible de charger les défis : ${err.message}
            </div>
        `;
        console.error('Erreur chargement défis :', err);
    }
}

// --- Init ---
afficherMois();
chargerDefis();