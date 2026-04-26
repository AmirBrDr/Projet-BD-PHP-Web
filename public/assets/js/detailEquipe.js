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

    function renderProgression(progression) {
        const host = document.querySelector('[data-challenge-progress]');
        if (!host) return;
        if (!progression.length) {
            host.innerHTML = '<div class="progression-empty">Aucun défi mensuel trouvé.</div>';
            return;
        }
        host.innerHTML = progression.map(item => {
            const p  = item.progress || {};
            const vn = p.validated_names || [];
            const pn = p.pending_names   || [];
            const pct = p.total_members
                ? Math.round((p.validated_members / p.total_members) * 100)
                : 0;
            const stateLabel = item.statut === 'completed' ? 'Terminé' : item.statut === 'locked' ? 'Bloqué' : 'En cours';
            return `
                <div class="prog-card ${item.statut}">
                    <div class="prog-head">
                        <div>
                            <div class="prog-order">Défi ${item.ordre}</div>
                            <div class="prog-title">${item.nom}</div>
                        </div>
                        <span class="prog-state">${stateLabel}</span>
                    </div>
                    <div class="prog-bar-wrap">
                        <div class="prog-bar-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="prog-meta">${p.validated_members || 0}/${p.total_members || 0} membres validés</div>
                    <div class="prog-members">
                        ${vn.map(n => `<span class="member-chip validated">✓ ${n}</span>`).join('')}
                        ${pn.map(n => `<span class="member-chip pending">⏳ ${n}</span>`).join('')}
                    </div>
                </div>`;
        }).join('');
    }

    function renderAchievements(succes) {
        const host = document.querySelector('[data-achievements-list]');
        if (!host) return;
        if (!succes.length) {
            host.innerHTML = '<li class="succes-item" style="color:var(--shell-muted)">Aucun succès récent.</li>';
            return;
        }
        host.innerHTML = succes.map(s => `
            <li class="succes-item">
                <div class="succes-name">${s.defi}</div>
                <div class="succes-meta">Par ${s.prenom} — ${new Date(s.date).toLocaleDateString('fr-FR')}</div>
                <span class="succes-pts">+${s.points} pts</span>
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
            const { equipe, membres, succes, progression } = data;

            setText('[data-team-rank]', `${equipe.rang}e du classement global`);
            setText('[data-team-name]', equipe.nom);

            renderStats(equipe, membres.length);
            renderMembers(membres);
            renderProgression(progression || []);
            renderAchievements(succes);
        } catch (err) {
            console.error('Erreur détail équipe:', err);
            setText('[data-team-name]', 'Erreur de chargement');
        }
    });
})();
