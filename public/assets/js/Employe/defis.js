// Fichier: public/assets/js/Employe/defis.js - Logique frontend et interactions.
(() => {
    const mockChallenges = [
        {
            id: "eveil-pieton",
            rank: 1,
            title: "L'eveil du pieton",
            points: 50,
            description: "Marchez 15 minutes pour un trajet du quotidien.",
            progressText: "12/15 equipes l'ont valide",
            status: "completed",
        },
        {
            id: "zero-voiture",
            rank: 2,
            title: "Zero voiture",
            points: 100,
            description: "Utilisez un transport doux sur plusieurs trajets domicile-travail.",
            progressText: "5/15 equipes sont en progression",
            status: "active",
        },
        {
            id: "covoit-party",
            rank: 3,
            title: "Covoit party",
            points: 200,
            description: "Organisez un covoiturage avec vos collegues.",
            progressText: "Deblocage apres l'etape 2",
            status: "locked",
        },
    ];

    let currentFilter = "all";

    function getFilteredChallenges() {
        if (currentFilter === "all") return mockChallenges;
        return mockChallenges.filter((item) => item.status === currentFilter);
    }

    function statusBulletLabel(item) {
        if (item.status === "completed") return "OK";
        if (item.status === "active") return String(item.rank);
        return "X";
    }

    function statusButton(item) {
        if (item.status === "locked") {
            return '<button class="step-button" type="button" disabled>Bientot disponible</button>';
        }
        const buttonText = item.status === "completed" ? "Voir ma reussite" : "Contribuer a mon equipe";
        return `<a class="step-link" href="detailDefi.html?id=${item.id}">${buttonText}</a>`;
    }

    function renderTimeline() {
        const host = document.querySelector("[data-timeline-list]");
        if (!host) return;

        const filtered = getFilteredChallenges();
        if (!filtered.length) {
            host.innerHTML = '<article class="challenge-step"><p>Aucun defi pour ce filtre.</p></article>';
            return;
        }

        host.innerHTML = filtered
            .map((item) => {
                return `
                <article class="challenge-step ${item.status}">
                    <div class="step-bullet">${statusBulletLabel(item)}</div>
                    <div class="step-card">
                        <div class="step-head">
                            <h2 class="step-title">${item.title}</h2>
                            <span class="step-points">+${item.points} pts</span>
                        </div>
                        <p class="step-description">${item.description}</p>
                        <p class="step-progress">${item.progressText}</p>
                        ${statusButton(item)}
                    </div>
                </article>`;
            })
            .join("");
    }

    function bindFilters() {
        const buttons = Array.from(document.querySelectorAll("[data-filter]"));
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                currentFilter = btn.dataset.filter || "all";
                buttons.forEach((item) => item.classList.remove("is-active"));
                btn.classList.add("is-active");
                renderTimeline();
            });
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        bindFilters();
        renderTimeline();
    });
})();
