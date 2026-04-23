// ============================================================
// Fichier: public/assets/js/detailDefi.js
// Logique de la page Détail Défi (Animateur)
// ============================================================

// --- Récupère l'ID dans l'URL ---
const params  = new URLSearchParams(window.location.search);
const defiId  = params.get('id');

// --- Éléments DOM ---
const loadingEl     = document.getElementById('loading');
const contenuEl     = document.getElementById('contenu');
const erreurEl      = document.getElementById('erreur');
const erreurMsgEl   = document.getElementById('erreur-msg');

// Hero
const heroThemeEl       = document.getElementById('hero-theme');
const heroNomEl         = document.getElementById('hero-nom');
const heroDescEl        = document.getElementById('hero-desc');
const heroPtsEl         = document.getElementById('hero-pts');
const heroCo2El         = document.getElementById('hero-co2');
const heroNiveauEl      = document.getElementById('hero-niveau');
const heroParticipantsEl = document.getElementById('hero-participants');

// Listes
const actionsListEl     = document.getElementById('actions-list');
const forumMessagesEl   = document.getElementById('forum-messages');
const forumVideEl       = document.getElementById('forum-vide');

// --- Affiche une erreur ---
function afficherErreur(msg) {
    loadingEl.classList.add('hidden');
    contenuEl.classList.add('hidden');
    erreurEl.classList.remove('hidden');
    erreurMsgEl.textContent = msg;
}

// --- Remplit le hero ---
function remplirHero(defi) {
    heroThemeEl.innerHTML = `<i class="fas fa-tag"></i> ${defi.nomtheme ?? 'Thématique'}`;
    heroNomEl.textContent         = defi.nomdefi;
    heroDescEl.textContent        = defi.descriptiondefi ?? 'Aucune description.';
    heroPtsEl.textContent         = defi.nbpointsdefi;
    heroCo2El.textContent         = defi.nbco2defi;
    heroNiveauEl.textContent      = defi.niveaudefi;
    heroParticipantsEl.textContent = '0';
}

// --- Affiche les actions ---
function afficherActions(actions) {
    actionsListEl.innerHTML = '';

    if (!actions || actions.length === 0) {
        actionsListEl.innerHTML = `
            <div class="actions-vide">
                <i class="fas fa-info-circle"></i> Aucune action définie pour ce défi.
            </div>`;
        return;
    }

    actions.forEach(action => {
        const item = document.createElement('div');
        item.className = 'action-item';
        item.innerHTML = `
            <div class="action-icon">
                <i class="fas fa-check"></i>
            </div>
            <div class="action-body">
                <h4>${action.nomaction}</h4>
                <p>${action.descriptionaction ?? 'Aucune description.'}</p>
            </div>
        `;
        actionsListEl.appendChild(item);
    });
}

// --- Affiche les messages du forum ---
function afficherForum(messages) {
    forumMessagesEl.innerHTML = '';

    if (!messages || messages.length === 0) {
        forumVideEl.classList.remove('hidden');
        return;
    }

    forumVideEl.classList.add('hidden');

    messages.forEach(msg => {
        const item = document.createElement('div');
        item.className = 'message-item';

        const date = new Date(msg.datemessage).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        item.innerHTML = `
            <div class="message-header">
                <span class="message-auteur">
                    <i class="fas fa-user-circle"></i>
                    ${msg.prenomuser} ${msg.nomuser}
                </span>
                <span class="message-date">${date}</span>
            </div>
            <p class="message-contenu">${msg.contenumessage}</p>
        `;
        forumMessagesEl.appendChild(item);
    });
}

// --- Charge le détail du défi ---
async function chargerDetail() {
    if (!defiId) {
        afficherErreur('Aucun identifiant de défi fourni.');
        return;
    }

    try {
        const res = await fetch(`/api/modules/challenges/?action=detail&id=${defiId}`);
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.error ?? 'Erreur inconnue');

        const { defi, actions, messages } = json.data;

        remplirHero(defi);
        afficherActions(actions);
        afficherForum(messages);

        // Affiche le contenu
        loadingEl.classList.add('hidden');
        contenuEl.classList.remove('hidden');

    } catch (err) {
        afficherErreur(`Impossible de charger le défi : ${err.message}`);
        console.error('Erreur détail défi :', err);
    }
}

// --- Init ---
chargerDetail();