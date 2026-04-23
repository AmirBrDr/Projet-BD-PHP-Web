// Fichier: public/assets/js/Employe/defis.js - Logique frontend et interactions.
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

    let allDefis = [];
    let currentFilter = 'all';

    function filtered() {
        if (currentFilter === 'all') return allDefis;
        return allDefis.filter(d => d.statut === currentFilter);
    }

    function bulletLabel(defi) {
        if (defi.statut === 'completed') return '✓';
        if (defi.statut === 'locked') return '🔒';
        return String(defi.ordre);
    }

    function actionButton(defi) {
        if (defi.statut === 'locked') {
            return '<button class="step-button" type="button" disabled>Débloqué après l\'étape précédente</button>';
        }
        const label = defi.statut === 'completed' ? 'Voir ma réussite' : 'Contribuer à mon équipe';
        return `<a class="step-link" href="detailDefi.html?id=${defi.id}">${label}</a>`;
    }

    function renderTimeline() {
        const host = document.querySelector('[data-timeline-list]');
        if (!host) return;
        const list = filtered();
        if (!list.length) {
            host.innerHTML = '<article class="challenge-step"><div class="step-card"><p>Aucun défi pour ce filtre.</p></div></article>';
            return;
        }
        host.innerHTML = list.map(d => `
            <article class="challenge-step ${d.statut}">
                <div class="step-bullet">${bulletLabel(d)}</div>
                <div class="step-card">
                    <div class="step-head">
                        <h2 class="step-title">${d.nom}</h2>
                        <span class="step-points">+${d.points} pts</span>
                    </div>
                    <p class="step-description">${d.description || ''}</p>
                    <p class="step-progress">Niveau ${d.niveau} · ${d.co2} kg CO₂</p>
                    ${actionButton(d)}
                </div>
            </article>`).join('');
    }

    function bindFilters() {
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.filter || 'all';
                document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                renderTimeline();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        bindFilters();
        try {
            const data = await apiGet('/modules/employee/challenges.php');

            if (data.theme) {
                const subtitle = document.querySelector('[data-theme-subtitle]');
                if (subtitle) subtitle.textContent = 'Thème du mois : ' + data.theme.nom;
            }

            allDefis = data.defis;
            renderTimeline();
        } catch (err) {
            console.error('Erreur défis:', err);
            const host = document.querySelector('[data-timeline-list]');
            if (host) host.innerHTML = '<article class="challenge-step is-loading">Impossible de charger les défis.</article>';
        }
    });
})();
