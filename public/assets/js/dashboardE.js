// Fichier: public/assets/js/Employe/dashboardE.js - Logique frontend et interactions.
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

    function renderList(selector, items, formatter) {
        const host = document.querySelector(selector);
        if (!host) return;
        host.innerHTML = items.length ? items.map(formatter).join('') :
            '<li style="color:var(--shell-muted);font-style:italic">Aucun élément.</li>';
    }

    function initChart(co2Mensuel) {
        const canvas = document.getElementById('co2Chart');
        if (!canvas || !window.Chart) return;
        new window.Chart(canvas, {
            type: 'line',
            data: {
                labels: co2Mensuel.map(r => r.mois),
                datasets: [{
                    label: 'kg CO₂ évités',
                    data: co2Mensuel.map(r => r.co2),
                    borderColor: '#94bb39',
                    backgroundColor: 'rgba(148, 187, 57, 0.15)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#94bb39',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.07)' },
                        ticks: { color: 'rgba(255,255,255,0.55)' },
                        beginAtZero: true,
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255,255,255,0.55)' },
                    }
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const data = await apiGet('/modules/employee/dashboard.php');

            setText('[data-stat-points]', data.stats.points.toLocaleString('fr-FR'));
            setText('[data-stat-co2]', data.stats.co2 + ' kg');
            setText('[data-stat-badges]', String(data.stats.badges));

            if (data.team) {
                setText('[data-team-name]', data.team.nom);
                setText('[data-team-rank]', `Classement : ${data.team.rang}e`);
                const detailLink = document.querySelector('a[href*="detailEquipe"]');
                if (detailLink) detailLink.href = `detailEquipe.html?id=${data.team.id}`;
            }

            renderList('[data-challenge-list]', data.challenges, (d) => {
                const icon = d.fait ? '✓' : '○';
                const cls  = d.fait ? 'task-item is-done' : 'task-item';
                return `<li class="${cls}">
                    <strong>${icon} ${d.nom}</strong>
                    <span style="float:right;color:#94bb39">${d.points} pts</span>
                </li>`;
            });

            renderList('[data-notification-list]', data.notifications, (n) => {
                return `<li class="feed-item">
                    <strong>${n.titre}</strong><br />
                    <small>${new Date(n.date).toLocaleDateString('fr-FR')}</small>
                </li>`;
            });

            initChart(data.co2_mensuel);
        } catch (err) {
            console.error('Erreur dashboard:', err);
        }
    });
})();
