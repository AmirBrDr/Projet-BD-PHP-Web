// Fichier: public/assets/js/Employe/profilE.js - Logique frontend et interactions.
(() => {
    const API_BASE = '/api';
    const token = () => localStorage.getItem('gp_token');

    async function apiGet(path) {
        const res = await fetch(API_BASE + path, {
            headers: { 'Authorization': 'Bearer ' + token() }
        });
        if (!res.ok) throw new Error((await res.json()).message || res.status);
        return res.json();
    }

    function setInitials(prenom, nom) {
        const el = document.querySelector('[data-user-initials]');
        if (!el) return;
        el.textContent = (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
    }

    function renderStats(stats) {
        const host = document.querySelector('[data-profile-stats]');
        if (!host) return;
        const items = [
            { label: 'Points personnels', value: stats.points.toLocaleString('fr-FR') },
            { label: 'CO₂ évité', value: stats.co2 + ' kg' },
            { label: 'Classement individuel', value: stats.rang_perso + 'e' },
        ];
        host.innerHTML = items.map(item => `
            <article class="stat-card panel">
                <div class="stat-label">${item.label}</div>
                <div class="stat-value">${item.value}</div>
            </article>`).join('');
    }

    function renderBadges(badges) {
        const host = document.querySelector('[data-badge-list]');
        if (!host) return;
        if (!badges.length) {
            host.innerHTML = '<li class="badge-item" style="color:var(--shell-muted)">Aucun badge encore. Complétez des défis !</li>';
            return;
        }
        host.innerHTML = badges.map(b => `
            <li class="badge-item">
                <strong>${b.nom}</strong>
                <small>${new Date(b.date).toLocaleDateString('fr-FR')}</small>
            </li>`).join('');
    }

    function renderHistory(history) {
        const host = document.querySelector('[data-history-list]');
        if (!host) return;
        if (!history.length) {
            host.innerHTML = '<li class="history-item" style="color:var(--shell-muted)">Aucun défi terminé pour l\'instant.</li>';
            return;
        }
        host.innerHTML = history.map(h => `
            <li class="history-item">
                <strong>${h.nom}</strong><br />
                <small>${new Date(h.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</small>
            </li>`).join('');
    }

    function bindPreferences() {
        const form = document.querySelector('[data-preference-form]');
        const feedback = document.querySelector('[data-pref-feedback]');
        if (!form || !feedback) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            feedback.className = 'feedback-msg is-success';
            feedback.textContent = 'Préférences enregistrées.';
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        bindPreferences();
        try {
            const data = await apiGet('/modules/employee/profile.php');

            setInitials(data.user.prenom, data.user.nom);

            const teamEl = document.querySelector('[data-profile-team]');
            if (teamEl) teamEl.textContent = data.equipe ? data.equipe.nom : 'Sans équipe';

            renderStats(data.stats);
            renderBadges(data.badges);
            renderHistory(data.historique);
        } catch (err) {
            console.error('Erreur profil:', err);
        }
    });
})();
