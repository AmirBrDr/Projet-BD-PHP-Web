// Fichier: public/assets/js/Employe/classement.js - Logique frontend et interactions.
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

    let allTeams = [];
    let myTeamId = 0;
    let currentMetric = 'points';

    function sorted() {
        return [...allTeams].sort((a, b) => b[currentMetric] - a[currentMetric]);
    }

    function formatMetric(team) {
        if (currentMetric === 'co2') return `${team.co2.toLocaleString('fr-FR')} kg CO₂`;
        return `${team.points.toLocaleString('fr-FR')} pts`;
    }

    function renderPodium() {
        const host = document.querySelector('[data-podium]');
        if (!host) return;
        const top3 = sorted().slice(0, 3);
        const order = [1, 0, 2]; // display: 2nd left, 1st centre, 3rd right
        const medals = ['🥇', '🥈', '🥉'];
        host.innerHTML = order.map(i => {
            const team = top3[i];
            if (!team) return '';
            const rank = i + 1;
            return `
            <article class="podium-card is-rank-${rank}">
                <div class="podium-medal">${medals[i]}</div>
                <div class="podium-rank">${rank}</div>
                <div class="podium-name">${team.nom}</div>
                <div class="podium-score">${formatMetric(team)}</div>
                <div class="podium-members">${team.membres} membre${team.membres > 1 ? 's' : ''}</div>
            </article>`;
        }).join('');
    }

    function renderTeamList() {
        const host = document.querySelector('[data-team-list]');
        const count = document.querySelector('[data-teams-count]');
        if (!host) return;
        const ordered = sorted();
        if (count) count.textContent = `${ordered.length} équipe${ordered.length > 1 ? 's' : ''}`;

        host.innerHTML = ordered.map((team, idx) => {
            const isSelf = team.id === myTeamId;
            return `
            <li>
                <a class="team-row${isSelf ? ' is-self' : ''}" href="detailEquipe.html?id=${team.id}">
                    <span class="team-rank">${idx + 1}</span>
                    <span>
                        <span class="team-name">${team.nom}${isSelf ? ' (Votre équipe)' : ''}</span><br />
                        <span class="team-meta">${team.membres} membre${team.membres > 1 ? 's' : ''}</span>
                    </span>
                    <span class="team-score">${formatMetric(team)}</span>
                </a>
            </li>`;
        }).join('');
    }

    function bindFilters() {
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentMetric = btn.dataset.metric || 'points';
                document.querySelectorAll('[data-metric]').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                renderPodium();
                renderTeamList();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        bindFilters();
        try {
            const data = await apiGet('/modules/employee/rankings.php');
            allTeams  = data.classement;
            myTeamId  = data.mon_equipe_id;
            renderPodium();
            renderTeamList();
        } catch (err) {
            console.error('Erreur classement:', err);
            const host = document.querySelector('[data-team-list]');
            if (host) host.innerHTML = '<li class="team-row is-loading">Impossible de charger le classement.</li>';
        }
    });
})();
