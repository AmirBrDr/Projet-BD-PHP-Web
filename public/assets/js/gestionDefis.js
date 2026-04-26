(() => {
    const token = localStorage.getItem("gp_token") || "";
    const askConfirm = (message, options = {}) => {
        if (typeof window.gpConfirm === "function") {
            return window.gpConfirm(message, options);
        }

        if (window.GPDialog && typeof window.GPDialog.confirm === "function") {
            return window.GPDialog.confirm({ message, ...options });
        }

        throw new Error("Modal de confirmation indisponible.");
    };

    const state = {
        themes: [],
        challenges: [],
        editingId: null,
    };

    const elements = {
        pageAlert: document.getElementById("page-alert"),
        filtreTheme: document.getElementById("filtreTheme"),
        emptyState: document.getElementById("empty-state"),
        openCreateModalBtn: document.getElementById("open-create-modal-btn"),
        closeModalBtn: document.getElementById("close-modal-btn"),
        modalOverlay: document.getElementById("challenge-modal-overlay"),
        challengeForm: document.getElementById("challenge-form"),
        challengeFormTitle: document.getElementById("challenge-form-title"),
        challengeFormAlert: document.getElementById("challenge-form-alert"),
        cancelEditBtn: document.getElementById("cancel-edit-btn"),
        submitChallengeBtn: document.getElementById("submit-challenge-btn"),
        challengeName: document.getElementById("challenge-name"),
        challengeDescription: document.getElementById("challenge-description"),
        challengeTheme: document.getElementById("challenge-theme"),
        challengeMonth: document.getElementById("challenge-month"),
        challengeOrder: document.getElementById("challenge-order"),
        challengePoints: document.getElementById("challenge-points"),
        challengeCo2: document.getElementById("challenge-co2"),
        challengeLevel: document.getElementById("challenge-level"),
        challengeForumName: document.getElementById("challenge-forum-name"),
        challengeForumDescription: document.getElementById("challenge-forum-description"),
        actionsContainer: document.getElementById("actions-container"),
        addActionBtn: document.getElementById("add-action-btn"),
        challengeList: document.getElementById("challenge-list"),
        refreshChallengesBtn: document.getElementById("refresh-challenges-btn"),
    };

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function setPageAlert(message) {
        if (!elements.pageAlert) {
            return;
        }

        if (!message) {
            elements.pageAlert.hidden = true;
            elements.pageAlert.textContent = "";
            return;
        }

        elements.pageAlert.hidden = false;
        elements.pageAlert.textContent = message;
    }

    function setFormAlert(message, type) {
        if (!elements.challengeFormAlert) {
            return;
        }

        if (!message) {
            elements.challengeFormAlert.hidden = true;
            elements.challengeFormAlert.className = "inline-alert";
            elements.challengeFormAlert.textContent = "";
            return;
        }

        elements.challengeFormAlert.hidden = false;
        elements.challengeFormAlert.className = `inline-alert ${type || ""}`.trim();
        elements.challengeFormAlert.textContent = message;
    }

    function openModal() {
        if (!elements.modalOverlay) {
            return;
        }

        elements.modalOverlay.classList.remove("hidden");
        elements.modalOverlay.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        if (!elements.modalOverlay) {
            return;
        }

        elements.modalOverlay.classList.add("hidden");
        elements.modalOverlay.setAttribute("aria-hidden", "true");
    }

    async function apiRequest(action, options = {}) {
        const method = options.method || "GET";
        const params = new URLSearchParams({ action, ...(options.params || {}) });
        const url = `/api/modules/animator/?${params.toString()}`;

        const requestOptions = {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        if (options.body) {
            requestOptions.headers["Content-Type"] = "application/json";
            requestOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, requestOptions);

        let data = null;
        try {
            data = await response.json();
        } catch (_error) {
            data = null;
        }

        if (!response.ok) {
            throw new Error(data?.message || `Erreur HTTP ${response.status}`);
        }

        return data;
    }

    function getCurrentMonth() {
        const now = new Date();
        const month = `${now.getMonth() + 1}`.padStart(2, "0");
        return `${now.getFullYear()}-${month}`;
    }

    function formatThemeOptions() {
        if (!elements.filtreTheme) {
            return;
        }

        const currentValue = elements.filtreTheme.value || "all";
        const allThemes = [...new Set(state.challenges.map((item) => item.nomtheme).filter(Boolean))];

        elements.filtreTheme.innerHTML = '<option value="all">Toutes les thematiques</option>';
        allThemes.forEach((theme) => {
            const option = document.createElement("option");
            option.value = theme;
            option.textContent = theme;
            elements.filtreTheme.appendChild(option);
        });

        elements.filtreTheme.value = allThemes.includes(currentValue) ? currentValue : "all";
    }

    function createActionRow(action = {}) {
        const row = document.createElement("div");
        row.className = "action-row";

        row.innerHTML = `
            <div class="action-row-head">
                <div class="action-row-title">Action du defi</div>
                <button class="action-remove" type="button">Supprimer</button>
            </div>
            <label>
                <span>Nom de l'action</span>
                <input class="action-name" type="text" value="${escapeHtml(action.nomaction || action.nomAction || "")}" required />
            </label>
            <label>
                <span>Description de l'action</span>
                <textarea class="action-description" rows="2">${escapeHtml(action.descriptionaction || action.descriptionAction || "")}</textarea>
            </label>
        `;

        row.querySelector(".action-remove")?.addEventListener("click", () => {
            row.remove();
            if (elements.actionsContainer?.children.length === 0) {
                addActionRow();
            }
        });

        elements.actionsContainer?.appendChild(row);
    }

    function addActionRow(action) {
        createActionRow(action);
    }

    function getActionsPayload() {
        const rows = Array.from(elements.actionsContainer?.querySelectorAll(".action-row") || []);
        const actions = rows
            .map((row) => {
                const nomAction = row.querySelector(".action-name")?.value?.trim() || "";
                const descriptionAction = row.querySelector(".action-description")?.value?.trim() || "";
                return {
                    nomAction,
                    descriptionAction,
                };
            })
            .filter((item) => item.nomAction !== "");

        if (actions.length === 0) {
            throw new Error("Ajoutez au moins une action avec un nom.");
        }

        return actions;
    }

    function resetForm() {
        state.editingId = null;
        elements.challengeForm?.reset();
        elements.challengeMonth.value = getCurrentMonth();
        setDefaultOrderFromTheme();

        if (elements.actionsContainer) {
            elements.actionsContainer.innerHTML = "";
            addActionRow();
        }

        if (elements.challengeFormTitle) {
            elements.challengeFormTitle.textContent = "Creer un defi";
        }
        if (elements.submitChallengeBtn) {
            elements.submitChallengeBtn.textContent = "Creer le defi";
        }

        setFormAlert("", "");
    }

    function setDefaultOrderFromTheme() {
        const selectedThemeId = Number(elements.challengeTheme?.value || 0);
        const selectedTheme = state.themes.find((item) => Number(item.id_thematique) === selectedThemeId);
        if (selectedTheme && !state.editingId) {
            elements.challengeOrder.value = String(selectedTheme.next_ordre || 1);
        }
    }

    function buildChallengePayload() {
        const nomDefi = elements.challengeName?.value?.trim() || "";
        const descriptionDefi = elements.challengeDescription?.value?.trim() || "";
        const idThematique = Number(elements.challengeTheme?.value || 0);
        const mois = elements.challengeMonth?.value || "";
        const ordre = Number(elements.challengeOrder?.value || 0);
        const nbPointsDefi = Number(elements.challengePoints?.value || 0);
        const nbCO2Defi = Number(elements.challengeCo2?.value || 0);
        const niveauDefi = Number(elements.challengeLevel?.value || 0);
        const nomForum = elements.challengeForumName?.value?.trim() || "";
        const descriptionForum = elements.challengeForumDescription?.value?.trim() || "";

        if (!nomDefi) {
            throw new Error("Le nom du defi est obligatoire.");
        }
        if (idThematique <= 0) {
            throw new Error("Selectionnez une thematique.");
        }
        if (!mois) {
            throw new Error("Selectionnez le mois du defi.");
        }
        if (ordre <= 0 || nbPointsDefi <= 0 || nbCO2Defi < 0 || niveauDefi <= 0) {
            throw new Error("Les valeurs numeriques du defi sont invalides.");
        }

        return {
            nomDefi,
            descriptionDefi,
            idThematique,
            mois,
            ordre,
            nbPointsDefi,
            nbCO2Defi,
            niveauDefi,
            nomForum,
            descriptionForum,
            actions: getActionsPayload(),
        };
    }

    function renderChallenges() {
        if (!elements.challengeList) {
            return;
        }

        const selectedTheme = elements.filtreTheme?.value || "all";
        const visibleChallenges = selectedTheme === "all"
            ? state.challenges
            : state.challenges.filter((item) => item.nomtheme === selectedTheme);

        if (!visibleChallenges.length) {
            elements.challengeList.innerHTML = "";
            elements.emptyState?.classList.remove("hidden");
            return;
        }

        elements.emptyState?.classList.add("hidden");

        elements.challengeList.innerHTML = visibleChallenges
            .map(
                (challenge, index) => `
                    <article class="defi-card ${index === 0 ? "actif" : ""}" data-id="${challenge.id_defi}">
                        <div class="defi-ordre">${escapeHtml(challenge.ordre || "-")}</div>
                        <div class="defi-body">
                            <span class="defi-theme-badge">${escapeHtml(challenge.nomtheme || "Thematique")}</span>
                            <h3 class="defi-nom">${escapeHtml(challenge.nomdefi)}</h3>
                            <p class="defi-desc">${escapeHtml(challenge.descriptiondefi || "Aucune description")}</p>
                            <div class="defi-meta">
                                <span>${escapeHtml(challenge.nbpointsdefi || 0)} pts</span>
                                <span>${escapeHtml(challenge.nbco2defi || 0)} kg CO2</span>
                                <span>Niveau ${escapeHtml(challenge.niveaudefi || "-")}</span>
                                <span>Mois ${escapeHtml(challenge.mois || "-")}</span>
                            </div>
                        </div>
                        <div class="defi-action">
                            <a href="detailDefi.html?id=${challenge.id_defi}" class="btn-detail">Voir le defi</a>
                            <div class="manage-actions">
                                <button class="btn-manage" type="button" data-action="edit" data-id="${challenge.id_defi}">Modifier</button>
                                <button class="btn-manage danger" type="button" data-action="delete" data-id="${challenge.id_defi}">Supprimer</button>
                            </div>
                        </div>
                    </article>
                `
            )
            .join("");
    }

    async function loadThemes() {
        const response = await apiRequest("themes");
        state.themes = response?.data || [];

        if (elements.challengeTheme) {
            elements.challengeTheme.innerHTML = "";
            state.themes.forEach((theme) => {
                const option = document.createElement("option");
                option.value = String(theme.id_thematique);
                option.textContent = `${theme.nomtheme} (ordre conseille: ${theme.next_ordre})`;
                elements.challengeTheme.appendChild(option);
            });
        }

        setDefaultOrderFromTheme();
    }

    async function loadChallenges() {
        const response = await apiRequest("challenges");
        state.challenges = response?.data || [];
        formatThemeOptions();
        renderChallenges();
    }

    async function loadChallengeForEdit(challengeId) {
        const response = await apiRequest("challenge_detail", { params: { id: challengeId } });
        const challenge = response?.data?.challenge;
        const actions = response?.data?.actions || [];

        if (!challenge) {
            throw new Error("Defi introuvable pour modification.");
        }

        state.editingId = Number(challengeId);
        elements.challengeFormTitle.textContent = "Modifier le defi";
        elements.submitChallengeBtn.textContent = "Enregistrer les modifications";

        elements.challengeName.value = challenge.nomdefi || "";
        elements.challengeDescription.value = challenge.descriptiondefi || "";
        elements.challengeTheme.value = String(challenge.id_thematique || "");
        elements.challengeMonth.value = challenge.mois || getCurrentMonth();
        elements.challengeOrder.value = String(challenge.ordre || 1);
        elements.challengePoints.value = String(challenge.nbpointsdefi || 1);
        elements.challengeCo2.value = String(challenge.nbco2defi || 0);
        elements.challengeLevel.value = String(challenge.niveaudefi || 1);
        elements.challengeForumName.value = challenge.nomforum || "";
        elements.challengeForumDescription.value = challenge.descriptionforum || "";

        elements.actionsContainer.innerHTML = "";
        if (!actions.length) {
            addActionRow();
        } else {
            actions.forEach((action) => addActionRow(action));
        }

        openModal();
    }

    async function deleteChallenge(challengeId) {
        const confirmed = await askConfirm("Confirmer la suppression de ce defi ?", {
            title: "Suppression du defi",
            confirmText: "Supprimer",
            cancelText: "Annuler",
            tone: "danger",
        });
        if (!confirmed) {
            return;
        }

        await apiRequest("challenge_delete", {
            method: "POST",
            params: { id: String(challengeId) },
        });

        await Promise.all([loadThemes(), loadChallenges()]);
        setPageAlert("Defi supprime avec succes.");
    }

    async function submitChallengeForm(event) {
        event.preventDefault();
        setFormAlert("", "");
        setPageAlert("");

        try {
            const payload = buildChallengePayload();
            const isEditing = Boolean(state.editingId);

            if (isEditing) {
                await apiRequest("challenge_update", {
                    method: "POST",
                    params: { id: String(state.editingId) },
                    body: payload,
                });
                setFormAlert("Defi mis a jour avec succes.", "success");
            } else {
                await apiRequest("challenge_create", {
                    method: "POST",
                    body: payload,
                });
                setFormAlert("Defi cree avec succes.", "success");
            }

            await Promise.all([loadThemes(), loadChallenges()]);
            resetForm();
            closeModal();
            setPageAlert(isEditing ? "Defi mis a jour avec succes." : "Defi cree avec succes.");
        } catch (error) {
            setFormAlert(error?.message || "Operation impossible.", "error");
        }
    }

    async function handleChallengeListClick(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const action = target.dataset.action;
        const challengeId = Number(target.dataset.id || 0);
        if (!action || challengeId <= 0) {
            return;
        }

        try {
            if (action === "edit") {
                await loadChallengeForEdit(challengeId);
            } else if (action === "delete") {
                await deleteChallenge(challengeId);
            }
        } catch (error) {
            setPageAlert(error?.message || "Impossible de traiter cette action.");
        }
    }

    async function init() {
        if (!token) {
            setPageAlert("Session invalide. Merci de vous reconnecter.");
            return;
        }

        elements.challengeForm?.addEventListener("submit", submitChallengeForm);
        elements.addActionBtn?.addEventListener("click", () => addActionRow());
        elements.cancelEditBtn?.addEventListener("click", () => {
            resetForm();
            closeModal();
        });
        elements.openCreateModalBtn?.addEventListener("click", () => {
            resetForm();
            openModal();
        });
        elements.closeModalBtn?.addEventListener("click", () => {
            closeModal();
        });
        elements.modalOverlay?.addEventListener("click", (event) => {
            if (event.target === elements.modalOverlay) {
                closeModal();
            }
        });
        elements.challengeTheme?.addEventListener("change", setDefaultOrderFromTheme);
        elements.filtreTheme?.addEventListener("change", renderChallenges);
        elements.refreshChallengesBtn?.addEventListener("click", async () => {
            try {
                await loadChallenges();
                setPageAlert("");
            } catch (error) {
                setPageAlert(error?.message || "Actualisation impossible.");
            }
        });

        elements.challengeList?.addEventListener("click", handleChallengeListClick);

        try {
            await loadThemes();
            await loadChallenges();
            resetForm();
            closeModal();
            setPageAlert("");
        } catch (error) {
            setPageAlert(error?.message || "Chargement initial impossible.");
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
