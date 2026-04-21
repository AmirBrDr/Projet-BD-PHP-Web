// Fichier: public/assets/js/Employe/dashboardE.js - Logique frontend et interactions.
(() => {
    const mockDashboard = {
        stats: { points: 1250, co2: 42, badges: 5 },
        team: { name: "Les Eco-Heros", rank: 3 },
        challenges: [
            { title: "Zero voiture", progress: "8/10 actions" },
            { title: "Pause sans plastique", progress: "4/6 actions" },
            { title: "Bureau zero veille", progress: "Termine" },
        ],
        notifications: [
            { title: "Action validee", body: "+50 pts pour votre trajet velo." },
            { title: "Badge debloque", body: "Vous avez gagne le badge Mobilite active." },
            { title: "Info equipe", body: "Votre equipe passe 3e du classement global." },
        ],
    };

    function setText(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    }

    function renderList(selector, items, formatter) {
        const host = document.querySelector(selector);
        if (!host) return;
        host.innerHTML = items.map(formatter).join("");
    }

    document.addEventListener("DOMContentLoaded", () => {
        setText("[data-stat-points]", String(mockDashboard.stats.points));
        setText("[data-stat-co2]", `${mockDashboard.stats.co2} kg`);
        setText("[data-stat-badges]", String(mockDashboard.stats.badges));
        setText("[data-team-name]", mockDashboard.team.name);
        setText("[data-team-rank]", `Classement: ${mockDashboard.team.rank}e`);

        renderList("[data-challenge-list]", mockDashboard.challenges, (item) => {
            return `<li class="task-item"><strong>${item.title}</strong><br />${item.progress}</li>`;
        });

        renderList("[data-notification-list]", mockDashboard.notifications, (item) => {
            return `<li class="feed-item"><strong>${item.title}</strong><br />${item.body}</li>`;
        });
    });
})();
