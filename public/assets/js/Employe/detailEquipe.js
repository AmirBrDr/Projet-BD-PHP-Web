// Fichier: public/assets/js/Employe/detailEquipe.js - Logique frontend et interactions.
(() => {
    const teams = {
        "eco-heros": {
            name: "Les Eco-Heros",
            rank: "3e du classement",
            motto: "Chaque geste quotidien compte.",
            score: 112896,
            stats: [
                { label: "Membres actifs", value: "24" },
                { label: "CO2 evite", value: "350 kg" },
                { label: "Defis equipes reussis", value: "31" },
            ],
            members: [
                { name: "Sophie Martin", meta: "Marketing", score: 12500 },
                { name: "Lucas Dubois", meta: "IT", score: 10200 },
                { name: "Emma Leroy", meta: "RH", score: 9800 },
            ],
            achievements: [
                { title: "Velotaf de printemps", context: "Valide par Lucas - il y a 2 jours", points: 200 },
                { title: "Bureau zero veille", context: "Valide par Sophie - il y a 5 jours", points: 150 },
            ],
        },
    };

    function getTeam() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id") || "eco-heros";
        return teams[id] || teams["eco-heros"];
    }

    function setText(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    }

    function renderStats(team) {
        const host = document.querySelector("[data-team-stats]");
        if (!host) return;
        host.innerHTML = team.stats
            .map((stat) => {
                return `<article class="stat-card"><div class="stat-label">${stat.label}</div><div class="stat-value">${stat.value}</div></article>`;
            })
            .join("");
    }

    function renderMembers(team) {
        const host = document.querySelector("[data-members-list]");
        if (!host) return;
        host.innerHTML = team.members
            .map((member, index) => {
                return `
                <li class="member-row">
                    <div>
                        <div class="member-name">${index + 1}. ${member.name}</div>
                        <div class="member-meta">${member.meta}</div>
                    </div>
                    <div class="member-score">${member.score.toLocaleString("fr-FR")} pts</div>
                </li>`;
            })
            .join("");
    }

    function renderAchievements(team) {
        const host = document.querySelector("[data-achievements-list]");
        if (!host) return;
        host.innerHTML = team.achievements
            .map((item) => {
                return `
                <li class="timeline-item">
                    <strong>${item.title}</strong><br />
                    <small>${item.context}</small><br />
                    <span class="timeline-points">+${item.points} pts</span>
                </li>`;
            })
            .join("");
    }

    document.addEventListener("DOMContentLoaded", () => {
        const team = getTeam();
        setText("[data-team-rank]", team.rank);
        setText("[data-team-name]", team.name);
        setText("[data-team-motto]", team.motto);
        setText("[data-team-score]", team.score.toLocaleString("fr-FR"));
        renderStats(team);
        renderMembers(team);
        renderAchievements(team);
    });
})();
