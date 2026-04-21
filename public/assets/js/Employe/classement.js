// Fichier: public/assets/js/Employe/classement.js - Logique frontend et interactions.
(() => {
    const teams = [
        { id: "solar-punks", name: "Les Solar-Punks", members: 20, points: 156800, co2: 470, isSelf: false },
        { id: "green-warriors", name: "Green Warriors", members: 10, points: 133280, co2: 420, isSelf: false },
        { id: "eco-heros", name: "Les Eco-Heros", members: 24, points: 112896, co2: 350, isSelf: true },
        { id: "cyber-recycle", name: "Cyber-Recycle", members: 14, points: 98784, co2: 298, isSelf: false },
        { id: "bio-logistics", name: "Bio-Logistics", members: 12, points: 86240, co2: 264, isSelf: false },
    ];

    let currentMetric = "points";

    function sortedTeams() {
        return [...teams].sort((a, b) => b[currentMetric] - a[currentMetric]);
    }

    function formatMetric(team) {
        if (currentMetric === "co2") return `${team.co2.toLocaleString("fr-FR")} kg CO2`;
        return `${team.points.toLocaleString("fr-FR")} pts`;
    }

    function renderPodium() {
        const host = document.querySelector("[data-podium]");
        if (!host) return;
        const top3 = sortedTeams().slice(0, 3);
        host.innerHTML = top3
            .map((team, idx) => {
                const rank = idx + 1;
                return `
                <article class="podium-card is-rank-${rank}">
                    <div class="podium-rank">${rank}</div>
                    <div class="podium-name">${team.name}</div>
                    <div class="podium-score">${formatMetric(team)}</div>
                </article>`;
            })
            .join("");
    }

    function renderTeamList() {
        const host = document.querySelector("[data-team-list]");
        const count = document.querySelector("[data-teams-count]");
        if (!host || !count) return;

        const ordered = sortedTeams();
        count.textContent = `${ordered.length} equipes`;

        host.innerHTML = ordered
            .map((team, idx) => {
                const selfClass = team.isSelf ? "is-self" : "";
                return `
                <li>
                      <a class="team-row ${selfClass}" href="detailEquipe.html?id=${team.id}">
                        <span class="team-rank">${idx + 1}</span>
                        <span>
                            <span class="team-name">${team.name}${team.isSelf ? " (Votre equipe)" : ""}</span><br />
                            <span class="team-meta">${team.members} membres</span>
                        </span>
                        <span class="team-score">${formatMetric(team)}</span>
                    </a>
                </li>`;
            })
            .join("");
    }

    function bindFilters() {
        const buttons = Array.from(document.querySelectorAll("[data-metric]"));
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                currentMetric = btn.dataset.metric || "points";
                buttons.forEach((item) => item.classList.remove("is-active"));
                btn.classList.add("is-active");
                renderPodium();
                renderTeamList();
            });
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        bindFilters();
        renderPodium();
        renderTeamList();
    });
})();
