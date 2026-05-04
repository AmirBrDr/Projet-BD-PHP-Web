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
            return '<button class="step-button" type="button" disabled>Bloqué par l\'équipe</button>';
        }
        const label = defi.statut === 'completed' ? 'Voir le défi' : 'Contribuer à mon équipe';
        return `<a class="step-link" href="detailDefi.html?id=${defi.id}">${label}</a>`;
    }

    function renderTeamProgress(data) {
        const host = document.querySelector('[data-team-progress]');
        if (!host) return;
        const team = data.team;
        const progress = data.progress || { completed: 0, total: 0 };
        if (!team) {
            host.innerHTML = '<span class="progress-pill">Aucune équipe détectée</span>';
            return;
        }

        const completion = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
        host.innerHTML = `
            <div class="progress-card">
                <strong>${team.nom}</strong>
                <span>${progress.completed}/${progress.total} défis terminés</span>
            </div>
            <div class="progress-card">
                <strong>${team.membres} membres</strong>
                <span>${completion}% du mois complété</span>
            </div>`;
    }

    function renderMemberChips(progress) {
        const validated = progress.validated_names || [];
        const pending   = progress.pending_names   || [];
        if (!validated.length && !pending.length) return '';
        return `<div class="step-members">
            ${validated.map(n => `<span class="member-chip validated">✓ ${n}</span>`).join('')}
            ${pending.map(n => `<span class="member-chip pending">⏳ ${n}</span>`).join('')}
        </div>`;
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
                    <p class="step-progress">Niveau ${d.niveau} · ${d.co2} kg CO₂ · ${d.progress.validated_members}/${d.progress.total_members} membres validés</p>
                    <div class="step-meta">
                        <span class="theme-tag">${d.theme?.nom || 'Thème du mois'}</span>
                        <span class="step-status">${d.statut === 'completed' ? 'Validé par l\'équipe' : d.statut === 'locked' ? 'Verrouillé' : 'Disponible'}</span>
                    </div>
                    ${renderMemberChips(d.progress)}
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
                if (subtitle) subtitle.textContent = `Thème du mois : ${data.theme.nom}`;
                const desc = document.querySelector('[data-theme-desc]');
                if (desc) desc.textContent = data.theme.description || '';
            } else if (Array.isArray(data.themes) && data.themes.length) {
                const subtitle = document.querySelector('[data-theme-subtitle]');
                const names = data.themes.map(t => t.nom).filter(Boolean).join(', ');
                if (subtitle) subtitle.textContent = names ? `Thèmes du mois : ${names}` : 'Thèmes du mois';
                const desc = document.querySelector('[data-theme-desc]');
                if (desc) desc.textContent = 'Plusieurs thématiques sont actives ce mois-ci.';
            }

            allDefis = data.defis;
            renderTeamProgress(data);
            renderTimeline();
        } catch (err) {
            console.error('Erreur défis:', err);
            const host = document.querySelector('[data-timeline-list]');
            if (host) host.innerHTML = '<article class="challenge-step is-loading">Impossible de charger les défis.</article>';
        }
    });
})();
