(() => {
    const API_SETTINGS = "/api/modules/settings/index.php";

    const state = {
        thematiques: [],
        badges: [],
        editingBadgeId: null,
        notifications: {
            active: true,
            frequency: 'biweekly',
        },
    };

    const els = {
        feedback: document.getElementById("settingsFeedback"),
        categoryList: document.getElementById("categoryList"),
        addCategoryBtn: document.getElementById("addCategoryBtn"),
        addBadgeBtn: document.getElementById("addBadgeBtn"),
        badgeList: document.getElementById("badgeList"),
        saveSettingsBtn: document.getElementById("saveSettingsBtn"),
        modalBadge: document.getElementById("modalBadge"),
        badgeName: document.getElementById("badgeName"),
        badgeIcon: document.getElementById("badgeIcon"),
        badgeConditionType: document.getElementById("badgeConditionType"),
        badgeConditionValue: document.getElementById("badgeConditionValue"),
        modalThematique: document.getElementById("modalThematique"),
        thematiqueNom: document.getElementById("thematiqueNom"),
        thematiqueDesc: document.getElementById("thematiqueDesc"),
        thematiquDefis: document.getElementById("thematiquDefis"),
        remindersToggle: document.getElementById("remindersToggle"),
        reminderFrequency: document.getElementById("reminderFrequency"),
    };

    function getToken() {
        return localStorage.getItem("gp_token") || "";
    }

    async function apiRequest(url, options = {}) {
        const token = getToken();
        const headers = {
            Accept: "application/json",
            ...(options.headers || {}),
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (options.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        const contentType = response.headers.get("content-type") || "";
        const payload = contentType.includes("application/json") ? await response.json() : await response.text();

        if (!response.ok) {
            const message = payload && typeof payload === "object" && payload.message ? payload.message : "Erreur API";
            throw new Error(message);
        }

        return payload;
    }

    const toast = window.Swal?.mixin?.({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
        background: '#1f3a3f',
        color: '#f8fafc',
        customClass: {
            popup: 'swal2-toast-popup'
        }
    });

    let feedbackTimeout = null;

    function showToast(message, type = "success") {
        if (toast) {
            toast.fire({
                icon: type,
                title: message,
            });
            return;
        }

        showFeedback(message, type);
    }

    function showFeedback(message, type = "success") {
        if (!els.feedback) return;
        clearTimeout(feedbackTimeout);

        const icon = type === "error" ? "⚠️" : "✅";
        els.feedback.innerHTML = `<span class=\"feedback-icon\">${icon}</span><span>${message}</span>`;
        els.feedback.className = `feedback visible ${type}`;

        feedbackTimeout = setTimeout(() => {
            clearFeedback();
        }, 3200);
    }

    function clearFeedback() {
        if (!els.feedback) return;
        clearTimeout(feedbackTimeout);
        els.feedback.innerHTML = "";
        els.feedback.className = "feedback";
    }

    function parseConditionText(text) {
        const match = String(text || "").match(/^(.*)\s*>=\s*(\d+)$/);
        if (match) {
            return {
                conditionType: match[1].trim(),
                conditionValue: Number(match[2]),
            };
        }

        return {
            conditionType: "Défis \"Mobilité\"",
            conditionValue: 1,
        };
    }

    function renderCategories() {
        if (!els.categoryList) return;
        els.categoryList.innerHTML = "";

        state.thematiques.forEach((theme, index) => {
            const li = document.createElement("li");
            li.className = "category-item";

            const infoDiv = document.createElement("div");
            infoDiv.style.flex = "1";
            infoDiv.style.cursor = "pointer";
            infoDiv.addEventListener("click", () => {
                openThematiqueModal(theme.id, index);
            });

            const input = document.createElement("input");
            input.type = "text";
            input.value = theme.nom || "";
            input.className = "inline-edit";
            input.placeholder = "Nom de la catégorie";
            input.style.cursor = "pointer";
            input.addEventListener("input", (event) => {
                state.thematiques[index].nom = event.target.value;
                scheduleSave();
            });
            input.addEventListener("blur", () => {
                if (String(state.thematiques[index].nom || "").trim() !== "") {
                    scheduleSave();
                }
            });

            infoDiv.appendChild(input);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn-icon delete";
            deleteButton.innerHTML = "<i class='fas fa-trash'></i>";
            deleteButton.addEventListener("click", () => {
                state.thematiques.splice(index, 1);
                renderCategories();
                scheduleSave();
            });

            li.appendChild(infoDiv);
            li.appendChild(deleteButton);
            els.categoryList.appendChild(li);
        });

        if (state.thematiques.length === 0) {
            const placeholder = document.createElement("li");
            placeholder.className = "category-placeholder";
            placeholder.textContent = "Aucune catégorie définie. Cliquez sur + Ajouter une catégorie pour en créer.";
            placeholder.style.color = "var(--text-muted)";
            placeholder.style.padding = "1rem";
            els.categoryList.appendChild(placeholder);
        }
    }

    function renderBadges() {
        if (!els.badgeList) return;
        els.badgeList.innerHTML = "";

        state.badges.forEach((badge, index) => {
            if (badge.deleted) return;

            const card = document.createElement("div");
            card.className = "badge-config-item";

            const icon = document.createElement("div");
            icon.className = "badge-icon preview-green";
            
            // Vérifier si c'est du base64 (data URL) ou du texte/emoji
            if (badge.icone && badge.icone.startsWith("data:")) {
                const img = document.createElement("img");
                img.src = badge.icone;
                img.alt = badge.nom || "Badge";
                img.style.width = "40px";
                img.style.height = "40px";
                img.style.objectFit = "contain";
                icon.appendChild(img);
            } else {
                icon.textContent = badge.icone || "🏅";
            }

            const details = document.createElement("div");
            details.className = "badge-details";

            const titleRow = document.createElement("div");
            titleRow.style.display = "flex";
            titleRow.style.justifyContent = "space-between";
            titleRow.style.alignItems = "center";

            const name = document.createElement("strong");
            name.textContent = badge.nom || "Badge sans nom";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "btn-icon";
            editBtn.innerHTML = "<i class='fas fa-pen'></i>";
            editBtn.title = "Modifier";
            editBtn.addEventListener("click", () => openBadgeModal(badge.id));

            titleRow.appendChild(name);
            titleRow.appendChild(editBtn);

            const condition = document.createElement("div");
            condition.className = "badge-conditions";
            condition.textContent = badge.description || "Condition non définie";

            details.appendChild(titleRow);
            details.appendChild(condition);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn-icon delete";
            deleteButton.innerHTML = "<i class='fas fa-trash'></i>";
            deleteButton.title = "Supprimer";
            deleteButton.addEventListener("click", () => {
                if (badge.id) {
                    state.badges[index].deleted = true;
                } else {
                    state.badges.splice(index, 1);
                }
                renderBadges();
            });

            card.appendChild(icon);
            card.appendChild(details);
            card.appendChild(deleteButton);
            els.badgeList.appendChild(card);
        });

        if (els.badgeList.children.length === 0) {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "badge-empty-state";
            emptyMessage.textContent = "Aucun badge défini pour le moment. Cliquez sur + Nouveau Badge pour en créer un.";
            emptyMessage.style.color = "var(--text-muted)";
            emptyMessage.style.padding = "1rem";
            els.badgeList.appendChild(emptyMessage);
        }
    }

    function openBadgeModal(badgeId = null) {
        state.editingBadgeId = badgeId;
        const badge = badgeId ? state.badges.find((item) => item.id === badgeId) : null;

        if (badge) {
            els.badgeName.value = badge.nom || "";
            els.badgeIcon.value = badge.icone || "";
            const condition = parseConditionText(badge.description || "");
            els.badgeConditionType.value = condition.conditionType;
            els.badgeConditionValue.value = condition.conditionValue;
        } else {
            els.badgeName.value = "";
            els.badgeIcon.value = "";
            els.badgeConditionType.value = "Défis \"Mobilité\"";
            els.badgeConditionValue.value = 1;
        }

        // Réinitialiser le preview et l'input file
        const fileInput = document.querySelector('#modalBadge input[type=file]');
        const previewContainer = document.querySelector('#modalBadge .icon-preview-container');
        const previewImg = document.getElementById('previewIcon');
        
        if (fileInput) {
            fileInput.value = '';
        }
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        if (previewImg) {
            previewImg.src = '';
        }

        if (els.modalBadge) {
            els.modalBadge.style.display = "flex";
        }
    }

    function closeBadgeModal() {
        if (els.modalBadge) {
            els.modalBadge.style.display = "none";
        }
        state.editingBadgeId = null;
    }

    let editingThematiqueIndex = null;

    async function openThematiqueModal(thematiqueId, index) {
        editingThematiqueIndex = index;
        const theme = state.thematiques[index];

        if (els.thematiqueNom) {
            els.thematiqueNom.value = theme.nom || "";
        }
        if (els.thematiqueDesc) {
            els.thematiqueDesc.value = theme.description || "";
        }

        // Charger les défis associés
        if (thematiqueId && els.thematiquDefis) {
            try {
                const response = await apiRequest(`/api/modules/challenges/index.php?thematique_id=${thematiqueId}`, {
                    method: "GET"
                });
                const defis = response.defis || [];
                els.thematiquDefis.innerHTML = defis.length > 0
                    ? defis.map(d => `<div style="padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05);">${d.nomDefi}</div>`).join("")
                    : "<div style=\"padding: 8px; color: var(--text-muted);\">Aucun défi associé</div>";
            } catch (error) {
                if (els.thematiquDefis) {
                    els.thematiquDefis.innerHTML = `<div style="padding: 8px; color: var(--text-muted);\">Erreur de chargement</div>`;
                }
            }
        } else if (els.thematiquDefis) {
            els.thematiquDefis.innerHTML = "<div style=\"padding: 8px; color: var(--text-muted);\">Nouvelle catégorie (pas de défis)</div>";
        }

        if (els.modalThematique) {
            els.modalThematique.style.display = "flex";
        }
    }

    function closeThematiqueModal() {
        if (els.modalThematique) {
            els.modalThematique.style.display = "none";
        }
        editingThematiqueIndex = null;
    }

    function saveThematiqueModal() {
        if (editingThematiqueIndex === null) return;

        const nom = els.thematiqueNom?.value.trim() || "";
        const desc = els.thematiqueDesc?.value.trim() || "";

        if (!nom) {
            showFeedback("Le nom de la catégorie est requis.", "error");
            return;
        }

        state.thematiques[editingThematiqueIndex].nom = nom;
        state.thematiques[editingThematiqueIndex].description = desc;

        closeThematiqueModal();
        renderCategories();
        scheduleSave();
    }

    function saveBadgeFromModal() {
        const name = els.badgeName.value.trim();
        const icon = els.badgeIcon.value.trim();
        const conditionText = `${els.badgeConditionType.value} >= ${Number(els.badgeConditionValue.value || 1)}`;

        if (!name) {
            showFeedback("Le nom du badge est requis.", "error");
            return;
        }

        if (state.editingBadgeId) {
            const badge = state.badges.find((item) => item.id === state.editingBadgeId);
            if (badge) {
                badge.nom = name;
                badge.icone = icon;
                badge.description = conditionText;
                badge.deleted = false;
            }
        } else {
            state.badges.push({
                id: null,
                nom: name,
                description: conditionText,
                icone: icon,
            });
        }

        renderBadges();
        closeBadgeModal();
        clearFeedback();
    }

    async function loadSettings() {
        try {
            clearFeedback();
            const response = await apiRequest(API_SETTINGS, { method: "GET" });
            state.thematiques = (response.settings.thematiques || []).map((theme) => ({
                id: theme.id,
                nom: theme.nom,
                description: theme.description || "",
            }));
            state.badges = (response.settings.badges || []).map((badge) => ({
                id: badge.id,
                nom: badge.nom,
                description: badge.description || "",
                icone: badge.icone || "",
            }));
            state.notifications = {
                active: Boolean(response.settings.notifications?.active ?? true),
                frequency: String(response.settings.notifications?.frequency ?? 'biweekly'),
            };

            if (els.remindersToggle) {
                els.remindersToggle.checked = state.notifications.active;
            }
            if (els.reminderFrequency) {
                els.reminderFrequency.value = state.notifications.frequency;
            }

            renderCategories();
            renderBadges();
        } catch (error) {
            showFeedback(error.message || "Impossible de charger les paramètres.", "error");
        }
    }

    let saveTimeout = null;

    function scheduleSave() {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveTimeout = setTimeout(() => {
            saveSettings().catch(() => {
                // silence errors on background save, feedback already handled by saveSettings
            });
        }, 700);
    }

    async function saveSettings() {
        try {
            clearFeedback();
            const notificationPayload = {
                active: els.remindersToggle ? Boolean(els.remindersToggle.checked) : state.notifications.active,
                frequency: els.reminderFrequency ? String(els.reminderFrequency.value) : state.notifications.frequency,
            };

            const payload = {
                thematiques: state.thematiques
                    .filter((theme) => String(theme.nom || "").trim() !== "")
                    .map((theme) => ({
                        id: theme.id,
                        nom: String(theme.nom || "").trim(),
                        description: String(theme.description || "").trim(),
                    })),
                badges: state.badges.map((badge) => ({
                    id: badge.id,
                    nom: String(badge.nom || "").trim(),
                    description: String(badge.description || "").trim(),
                    icone: String(badge.icone || "").trim(),
                    deleted: badge.deleted ? true : false,
                })),
                notifications: notificationPayload,
            };

            const response = await apiRequest(API_SETTINGS, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            const sentCount = Number(response.emailsSent ?? 0);
            const emailMessage = sentCount > 0 ? ` ${sentCount} email(s) de relance envoyée(s).` : "";
            showToast(`Paramètres enregistrés.${emailMessage}`, "success");
            await loadSettings();
        } catch (error) {
            showFeedback(error.message || "Impossible d'enregistrer les paramètres.", "error");
        }
    }

    function attachEvents() {
        if (els.addCategoryBtn) {
            els.addCategoryBtn.addEventListener("click", (event) => {
                event.preventDefault();
                state.thematiques.push({ id: null, nom: "", description: "" });
                renderCategories();
            });
        }

        if (els.addBadgeBtn) {
            els.addBadgeBtn.addEventListener("click", (event) => {
                event.preventDefault();
                openBadgeModal(null);
            });
        }

        if (els.saveSettingsBtn) {
            els.saveSettingsBtn.addEventListener("click", (event) => {
                event.preventDefault();
                saveSettings();
            });
        }

        if (els.remindersToggle) {
            els.remindersToggle.addEventListener("change", () => {
                state.notifications.active = Boolean(els.remindersToggle.checked);
                scheduleSave();
            });
        }

        if (els.reminderFrequency) {
            els.reminderFrequency.addEventListener("change", () => {
                state.notifications.frequency = String(els.reminderFrequency.value);
                scheduleSave();
            });
        }

        if (els.modalBadge) {
            els.modalBadge.addEventListener("click", (event) => {
                if (event.target === els.modalBadge) {
                    closeBadgeModal();
                }
            });

            const cancelBtn = els.modalBadge.querySelector(".btn-cancel");
            const confirmBtn = els.modalBadge.querySelector(".btn-confirm");
            if (cancelBtn) {
                cancelBtn.addEventListener("click", (event) => {
                    event.preventDefault();
                    closeBadgeModal();
                });
            }
            if (confirmBtn) {
                confirmBtn.addEventListener("click", (event) => {
                    event.preventDefault();
                    saveBadgeFromModal();
                });
            }
        }

        if (els.modalThematique) {
            els.modalThematique.addEventListener("click", (event) => {
                if (event.target === els.modalThematique) {
                    closeThematiqueModal();
                }
            });

            const cancelBtn = els.modalThematique.querySelector(".btn-cancel");
            const confirmBtn = els.modalThematique.querySelector(".btn-confirm");
            if (cancelBtn) {
                cancelBtn.addEventListener("click", (event) => {
                    event.preventDefault();
                    closeThematiqueModal();
                });
            }
            if (confirmBtn) {
                confirmBtn.addEventListener("click", (event) => {
                    event.preventDefault();
                    saveThematiqueModal();
                });
            }
        }

        // Gestion du fichier d'icône
        const fileInput = document.querySelector('#modalBadge input[type=file]');
        const uploadZone = document.querySelector('#modalBadge .icon-upload-zone');
        const previewContainer = document.querySelector('#modalBadge .icon-preview-container');
        const previewImg = document.getElementById('previewIcon');

        if (fileInput && uploadZone) {
            // Click sur la zone de chargement
            fileInput.addEventListener('change', function(e) {
                handleFileSelect(e.target.files[0]);
            });

            // Drag & drop
            uploadZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadZone.style.background = 'rgba(148, 187, 57, 0.1)';
            });

            uploadZone.addEventListener('dragleave', function(e) {
                e.preventDefault();
                uploadZone.style.background = '';
            });

            uploadZone.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadZone.style.background = '';
                if (e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                }
            });

            function handleFileSelect(file) {
                if (file && (file.type === 'image/png' || file.type === 'image/svg+xml')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewImg.src = e.target.result;
                        if (previewContainer) {
                            previewContainer.style.display = 'flex';
                        }
                        // Stocker le data URL dans badgeIcon pour l'envoyer au serveur
                        els.badgeIcon.value = e.target.result;
                    };
                    reader.readAsDataURL(file);
                } else {
                    showFeedback('Veuillez sélectionner une image PNG ou SVG', 'error');
                }
            }
        }
    }

    function initialize() {
        attachEvents();
        loadSettings();
    }

    initialize();
})();
