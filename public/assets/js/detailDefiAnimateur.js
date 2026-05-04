// Fichier: public/assets/js/detailDefiAnimateur.js
// Logique de la page Détail Défi (Animateur)
(() => {
    const API_BASE = "/api";
    const token = () => localStorage.getItem("gp_token") || "";

    const params = new URLSearchParams(window.location.search);
    const defiId = Number.parseInt(params.get("id") || "0", 10);

    const loadingEl = document.getElementById("loading");
    const contenuEl = document.getElementById("contenu");
    const erreurEl = document.getElementById("erreur");
    const erreurMsgEl = document.getElementById("erreur-msg");

    const heroThemeEl = document.getElementById("hero-theme");
    const heroNomEl = document.getElementById("hero-nom");
    const heroDescEl = document.getElementById("hero-desc");
    const heroPtsEl = document.getElementById("hero-pts");
    const heroCo2El = document.getElementById("hero-co2");
    const heroNiveauEl = document.getElementById("hero-niveau");
    const heroParticipantsEl = document.getElementById("hero-participants");

    const actionsListEl = document.getElementById("actions-list");
    const forumMessagesEl = document.getElementById("forum-messages");
    const forumVideEl = document.getElementById("forum-vide");

    let lastMessages = [];
    let blockedEmployees = new Set();

    async function apiGet(path) {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: token() ? { Authorization: `Bearer ${token()}` } : {},
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || json.error || `Erreur HTTP ${response.status}`);
        }
        return json;
    }

    async function apiPost(path, body) {
        const response = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
            },
            body: JSON.stringify(body),
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || json.error || `Erreur HTTP ${response.status}`);
        }
        return json;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function setHidden(element, hidden) {
        if (!element) {
            return;
        }

        element.classList.toggle("hidden", hidden);
    }

    function afficherErreur(message) {
        setHidden(loadingEl, true);
        setHidden(contenuEl, true);
        setHidden(erreurEl, false);

        if (erreurMsgEl) {
            erreurMsgEl.textContent = message;
        }
    }

    function renderHero(defi) {
        if (heroThemeEl) {
            heroThemeEl.innerHTML = `<i class="fas fa-tag"></i> ${escapeHtml(defi.nomTheme || defi.nomtheme || "Thématique")}`;
        }

        if (heroNomEl) {
            heroNomEl.textContent = defi.nomDefi || defi.nomdefi || "Défi";
        }

        if (heroDescEl) {
            heroDescEl.textContent = defi.descriptionDefi || defi.descriptiondefi || "Aucune description.";
        }

        if (heroPtsEl) {
            heroPtsEl.textContent = defi.nbPointsDefi ?? defi.nbpointsdefi ?? 0;
        }

        if (heroCo2El) {
            heroCo2El.textContent = defi.nbCO2Defi ?? defi.nbco2defi ?? 0;
        }

        if (heroNiveauEl) {
            heroNiveauEl.textContent = defi.niveauDefi ?? defi.niveaudefi ?? "-";
        }

        if (heroParticipantsEl) {
            heroParticipantsEl.textContent = defi.nbParticipants ?? defi.nb_participants ?? 0;
        }

        document.title = `GreenPulse - ${defi.nomDefi || defi.nomdefi || "Détail du défi"}`;
    }

    function renderActions(actions) {
        if (!actionsListEl) {
            return;
        }

        actionsListEl.innerHTML = "";

        if (!Array.isArray(actions) || actions.length === 0) {
            actionsListEl.innerHTML = `
                <div class="actions-vide">
                    <i class="fas fa-info-circle"></i>
                    Aucune action définie pour ce défi.
                </div>`;
            return;
        }

        actions.forEach((action, index) => {
            const item = document.createElement("article");
            item.className = "action-item";
            item.innerHTML = `
                <div class="action-icon">
                    <i class="fas fa-check"></i>
                </div>
                <div class="action-body">
                    <h4>${escapeHtml(action.nomAction || action.nomaction || `Action ${index + 1}`)}</h4>
                    <p>${escapeHtml(action.descriptionAction || action.descriptionaction || "Aucune description.")}</p>
                </div>
            `;
            actionsListEl.appendChild(item);
        });
    }

    function renderForum(messages) {
        if (!forumMessagesEl || !forumVideEl) {
            return;
        }

        forumMessagesEl.innerHTML = "";

        if (!Array.isArray(messages) || messages.length === 0) {
            setHidden(forumVideEl, false);
            return;
        }

        setHidden(forumVideEl, true);

        messages.forEach((message) => {
            const item = document.createElement("article");
            item.className = "message-item";

            const rawDate = message.dateMessage || message.datemessage || message.date || "";
            const parsedDate = rawDate ? new Date(rawDate) : null;
            const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : "Date inconnue";

            const roleKey = String(message.roleUtilisateur || message.roleutilisateur || "employe").toLowerCase();
            const roleLabel = {
                employe: "Employé",
                animateur: "Animateur",
                admin: "Administrateur",
            }[roleKey] || "Utilisateur";

            const authorName = `${message.prenomUser || message.prenomuser || ""} ${message.nomUser || message.nomuser || ""}`.trim() || "Utilisateur";
            const employeId = Number(message.idEmploye || message.idemploye || message.id_employe || 0);
            const isEmploye = roleKey === "employe";
            const isBlocked = isEmploye && employeId > 0 && blockedEmployees.has(employeId);
            const messageContent = message.contenuMessage || message.contenumessage || "";

            const actionButton = isEmploye && employeId > 0
                ? `<button class="${isBlocked ? "btn-unblock" : "btn-block"}" type="button" data-action="${isBlocked ? "unblock" : "block"}" data-employe-id="${employeId}">
                        ${isBlocked ? "Debloquer" : "Bloquer"}
                   </button>`
                : "";

            item.innerHTML = `
                <div class="message-header">
                    <div class="message-author-block">
                        <span class="message-auteur">
                            <i class="fas fa-user-circle"></i>
                            ${escapeHtml(authorName)}
                        </span>
                        <span class="message-role role-${escapeHtml(roleKey)}">${escapeHtml(roleLabel)}</span>
                    </div>
                    <span class="message-date">${escapeHtml(dateLabel)}</span>
                </div>
                <p class="message-contenu">${escapeHtml(messageContent)}</p>
                ${actionButton}
            `;

            forumMessagesEl.appendChild(item);
        });
    }

    async function loadBlockedEmployees() {
        if (!defiId) {
            return;
        }

        const json = await apiGet(`/modules/animator/?action=blocked_employees&defi_id=${defiId}`);
        const rows = json.data || [];
        blockedEmployees = new Set(
            rows
                .map((row) => Number(row.id_employe || row.idemploye || row.idEmploye || 0))
                .filter((value) => Number.isFinite(value) && value > 0)
        );
    }

    async function blockEmployee(employeId) {
        await apiPost("/modules/animator/?action=block_employee", {
            defi_id: defiId,
            employe_id: employeId,
        });
        blockedEmployees.add(employeId);
        renderForum(lastMessages);
    }

    async function unblockEmployee(employeId) {
        await apiPost("/modules/animator/?action=unblock_employee", {
            defi_id: defiId,
            employe_id: employeId,
        });
        blockedEmployees.delete(employeId);
        renderForum(lastMessages);
    }

    function bindForumActions() {
        if (!forumMessagesEl) {
            return;
        }

        forumMessagesEl.addEventListener("click", async (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            const button = target.closest("button[data-action]");
            if (!button) {
                return;
            }

            const action = button.dataset.action || "";
            const employeId = Number(button.dataset.employeId || 0);
            if (!employeId) {
                return;
            }

            try {
                if (action === "block") {
                    if (!window.confirm("Bloquer cet employe pour ce defi ?")) {
                        return;
                    }
                    await blockEmployee(employeId);
                } else if (action === "unblock") {
                    await unblockEmployee(employeId);
                }
            } catch (error) {
                console.error("Erreur blocage employe:", error);
                afficherErreur(error?.message || "Impossible de modifier le blocage.");
            }
        });
    }

    async function chargerDetail() {
        if (!defiId) {
            afficherErreur("Aucun identifiant de défi fourni.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/modules/challenges/?action=detail&id=${defiId}`, {
                headers: token() ? { Authorization: `Bearer ${token()}` } : {},
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.error || json.message || `Erreur HTTP ${response.status}`);
            }

            if (json.status !== "success") {
                throw new Error(json.error || json.message || "Erreur inconnue");
            }

            const data = json.data || {};
            const defi = data.defi || {};

            try {
                await loadBlockedEmployees();
            } catch (error) {
                console.warn("Impossible de charger les blocages:", error);
            }

            renderHero(defi);
            renderActions(data.actions || []);
            lastMessages = Array.isArray(data.messages) ? data.messages : [];
            renderForum(lastMessages);

            setHidden(loadingEl, true);
            setHidden(contenuEl, false);
        } catch (error) {
            console.error("Erreur détail défi animateur :", error);
            afficherErreur(`Impossible de charger le défi : ${error.message || "Erreur inconnue"}`);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        bindForumActions();
        chargerDetail();
    });
})();