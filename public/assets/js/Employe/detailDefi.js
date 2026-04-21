// Fichier: public/assets/js/Employe/detailDefi.js - Logique frontend et interactions.
(() => {
    const challenges = {
        "zero-voiture": {
            theme: "Mobilite douce",
            title: "Zero voiture",
            description:
                "Reduisez l'usage de la voiture individuelle en privilegient velo, marche et transports en commun.",
            points: 100,
            co2: 18,
            teamProgress: 64,
            options: [
                { id: "velo", title: "Venir a velo", subtitle: "Trajet complet ou partiel" },
                { id: "walk", title: "Venir a pied", subtitle: "Minimum 20 minutes" },
                { id: "bus", title: "Transport collectif", subtitle: "Bus, tram, metro" },
            ],
            forum: [
                { author: "Animateur DD", text: "Pensez a ajouter un commentaire precis pour la validation.", date: "Aujourd'hui" },
                { author: "Lea", text: "Qui part en velo depuis Toulouse centre demain matin ?", date: "Hier" },
            ],
            history: [
                { action: "Venir a velo", status: "Valide", date: "15/02" },
                { action: "Transport collectif", status: "En attente", date: "13/02" },
            ],
        },
    };

    let selectedActionId = "";

    function getChallengeFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id") || "zero-voiture";
        return challenges[id] || challenges["zero-voiture"];
    }

    function setText(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    }

    function renderHead(challenge) {
        setText("[data-challenge-theme]", `Thematique: ${challenge.theme}`);
        setText("[data-challenge-title]", `Defi: ${challenge.title}`);
        setText("[data-challenge-description]", challenge.description);
        setText("[data-challenge-points]", `+${challenge.points} pts`);
        setText("[data-challenge-co2]", `${challenge.co2} kg CO2`);
        setText("[data-challenge-progress]", `${challenge.teamProgress}% equipe`);
    }

    function renderActionOptions(challenge) {
        const host = document.querySelector("[data-action-options]");
        if (!host) return;

        selectedActionId = challenge.options[0]?.id || "";
        host.innerHTML = challenge.options
            .map((option, index) => {
                const selectedClass = index === 0 ? "is-selected" : "";
                return `
                <button class="option-card ${selectedClass}" type="button" data-action-id="${option.id}">
                    <h3>${option.title}</h3>
                    <p>${option.subtitle}</p>
                </button>`;
            })
            .join("");

        const buttons = Array.from(host.querySelectorAll("[data-action-id]"));
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                selectedActionId = btn.dataset.actionId || "";
                buttons.forEach((item) => item.classList.remove("is-selected"));
                btn.classList.add("is-selected");
            });
        });
    }

    function renderForum(challenge) {
        const host = document.querySelector("[data-forum-list]");
        if (!host) return;
        host.innerHTML = challenge.forum
            .map((msg) => {
                return `<li class="forum-item"><strong>${msg.author}</strong><br />${msg.text}<br /><small>${msg.date}</small></li>`;
            })
            .join("");
    }

    function renderHistory(challenge) {
        const host = document.querySelector("[data-history-list]");
        if (!host) return;
        host.innerHTML = challenge.history
            .map((item) => {
                return `<li class="history-item"><strong>${item.action}</strong> - ${item.status}<br /><small>${item.date}</small></li>`;
            })
            .join("");
    }

    function bindForm(challenge) {
        const form = document.querySelector("[data-submission-form]");
        const feedback = document.querySelector("[data-form-feedback]");
        if (!form || !feedback) return;

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const text = String(new FormData(form).get("proofText") || "").trim();

            if (!selectedActionId || !text) {
                feedback.className = "feedback-msg";
                feedback.textContent = "Selectionnez une action et ajoutez un commentaire de preuve.";
                return;
            }

            feedback.className = "feedback-msg is-success";
            feedback.textContent = `Soumission enregistree pour ${challenge.title}. Validation en attente.`;
            form.reset();
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const challenge = getChallengeFromQuery();
        renderHead(challenge);
        renderActionOptions(challenge);
        renderForum(challenge);
        renderHistory(challenge);
        bindForm(challenge);
    });
})();
