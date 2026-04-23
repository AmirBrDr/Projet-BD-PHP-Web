// Fichier: public/assets/js/Employe/detailEquipe.js - Logique frontend et interactions.
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

    function setText(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    }

    function renderChallengeProgress(progression) {
        const host = document.querySelector('[data-challenge-progress]');
        if (!host) return;
        if (!progression.length) {
            host.innerHTML = '<div class="progress-empty">Aucun défi mensuel trouvé.</div>';
            return;
        }

        host.innerHTML = progression.map((item) => {
            const validated = item.progress?.validated_names || [];
            const pending = item.progress?.pending_names || [];
            return `
                <article class="progress-card ${item.statut}">
                    <div class="progress-head">
                        <div>
                            <div class="progress-order">Défi ${item.ordre}</div>
                            <h3 class="progress-title">${item.nom}</h3>
                        </div>
                        <span class="progress-state">${item.statut === 'completed' ? 'Terminé' : item.statut === 'locked' ? 'Bloqué' : 'En cours'}</span>
                    </div>
                    <p class="progress-copy">${item.description || ''}</p>
                    <div class="progress-bar">
                        <span style="width:${item.progress?.total_members ? Math.round((item.progress.validated_members / item.progress.total_members) * 100) : 0}%"></span>
                    </div>
                    <div class="progress-meta">${item.progress?.validated_members || 0}/${item.progress?.total_members || 0} membres validés</div>
                    <div class="progress-lists">
                        <div><strong>Validés</strong><br />${validated.length ? validated.join(', ') : 'Personne encore'}</div>
                        <div><strong>En attente</strong><br />${pending.length ? pending.join(', ') : 'Toute l’équipe a validé'}</div>
                    </div>
                </article>`;
        }).join('');
    }

    function renderStats(equipe, nbMembres) {
        const host = document.querySelector('[data-team-stats]');
        if (!host) return;
        const items = [
            { label: 'Membres', value: String(nbMembres) },
            { label: 'CO₂ évité', value: equipe.co2 + ' kg' },
            { label: 'Points cumulés', value: equipe.points.toLocaleString('fr-FR') },
        ];
        host.innerHTML = items.map(s => `
            <article class="stat-card">
                <div class="stat-label">${s.label}</div>
                <div class="stat-value">${s.value}</div>
            </article>`).join('');
    }

    function renderMembers(membres) {
        const host = document.querySelector('[data-members-list]');
        if (!host) return;
        if (!membres.length) {
            host.innerHTML = '<li class="member-row" style="color:var(--shell-muted)">Aucun membre.</li>';
            return;
        }
        host.innerHTML = membres.map((m, i) => `
            <li class="member-row">
                <div>
                    <div class="member-name">${i + 1}. ${m.prenom} ${m.nom}</div>
                    <div class="member-meta">${m.departement || 'Non renseigné'}</div>
                </div>
                <div class="member-score">${m.points.toLocaleString('fr-FR')} pts</div>
            </li>`).join('');
    }

    function renderAchievements(succes) {
        const host = document.querySelector('[data-achievements-list]');
        if (!host) return;
        if (!succes.length) {
            host.innerHTML = '<li class="timeline-item" style="color:var(--shell-muted)">Aucun succès récent.</li>';
            return;
        }
        host.innerHTML = succes.map(s => `
            <li class="timeline-item">
                <strong>${s.defi}</strong><br />
                <small>Par ${s.prenom} — ${new Date(s.date).toLocaleDateString('fr-FR')}</small><br />
                <span class="timeline-points">+${s.points} pts</span>
            </li>`).join('');
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const params = new URLSearchParams(window.location.search);
        let teamId = params.get('id') || 'current';

        try {
            if (teamId === 'current' || teamId === '') {
                const dashboard = await apiGet('/modules/employee/dashboard.php');
                teamId = dashboard.team ? String(dashboard.team.id) : '';
            }
        } catch (_err) {
            teamId = '';
        }

        if (!teamId) {
            setText('[data-team-name]', 'Équipe introuvable');
            return;
        }

        try {
            const data = await apiGet('/modules/employee/team-detail.php?id=' + teamId);
            const { equipe, membres, succes } = data;

            setText('[data-team-rank]', `${equipe.rang}e du classement global`);
            setText('[data-team-name]', equipe.nom);
            setText('[data-team-score]', equipe.points.toLocaleString('fr-FR'));

            const mottoEl = document.querySelector('[data-team-motto]');
            if (mottoEl) mottoEl.textContent = '';

            renderStats(equipe, membres.length);
            renderMembers(membres);
            renderChallengeProgress(data.progression || []);
            renderAchievements(succes);
        } catch (err) {
            console.error('Erreur détail équipe:', err);
            setText('[data-team-name]', 'Erreur de chargement');
        }
    });
})();
