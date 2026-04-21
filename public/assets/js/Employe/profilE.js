// Fichier: public/assets/js/Employe/profilE.js - Logique frontend et interactions.
(() => {
    const mockProfile = {
        team: "Les Eco-Heros",
        stats: [
            { label: "Points personnels", value: "1 250" },
            { label: "CO2 evite", value: "42 kg" },
            { label: "Classement individuel", value: "12e" },
        ],
        badges: [
            { name: "Cycliste Pro", date: "12/02/2026" },
            { name: "Zero goutte", date: "05/01/2026" },
            { name: "Eco mentor", date: "22/12/2025" },
        ],
        history: [
            { title: "Zero dechet au bureau", period: "Fevrier 2026" },
            { title: "Transports doux", period: "Janvier 2026" },
            { title: "Eteindre les veilles", period: "Decembre 2025" },
        ],
    };

    function getUser() {
        const raw = localStorage.getItem("gp_user");
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (_err) {
            return null;
        }
    }

    function setInitials() {
        const user = getUser();
        const host = document.querySelector("[data-user-initials]");
        if (!host) return;
        const first = (user?.prenomUser || "G").charAt(0).toUpperCase();
        const last = (user?.nomUser || "P").charAt(0).toUpperCase();
        host.textContent = `${first}${last}`;
    }

    function renderStats() {
        const host = document.querySelector("[data-profile-stats]");
        if (!host) return;
        host.innerHTML = mockProfile.stats
            .map((item) => {
                return `<article class="stat-card"><div class="stat-label">${item.label}</div><div class="stat-value">${item.value}</div></article>`;
            })
            .join("");
    }

    function renderBadges() {
        const host = document.querySelector("[data-badge-list]");
        if (!host) return;
        host.innerHTML = mockProfile.badges
            .map((item) => {
                return `<li class="badge-item"><strong>${item.name}</strong><small>${item.date}</small></li>`;
            })
            .join("");
    }

    function renderHistory() {
        const host = document.querySelector("[data-history-list]");
        if (!host) return;
        host.innerHTML = mockProfile.history
            .map((item) => {
                return `<li class="history-item"><strong>${item.title}</strong><br /><small>${item.period}</small></li>`;
            })
            .join("");
    }

    function bindPreferences() {
        const form = document.querySelector("[data-preference-form]");
        const feedback = document.querySelector("[data-pref-feedback]");
        if (!form || !feedback) return;

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            feedback.className = "feedback-msg is-success";
            feedback.textContent = "Preferences enregistrees localement.";
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const teamLabel = document.querySelector("[data-profile-team]");
        if (teamLabel) {
            teamLabel.textContent = mockProfile.team;
        }

        setInitials();
        renderStats();
        renderBadges();
        renderHistory();
        bindPreferences();
    });
})();
