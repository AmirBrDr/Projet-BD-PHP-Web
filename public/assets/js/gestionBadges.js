(() => {
    const API_BADGES = "/api/modules/animator/badges.php";

    const state = {
        badges: [],
        editingBadgeId: null,
    };

    const els = {
        feedback: document.getElementById("badgeFeedback"),
        addBadgeBtn: document.getElementById("addBadgeBtn"),
        badgeList: document.getElementById("badgeList"),
        modalBadge: document.getElementById("modalBadge"),
        badgeName: document.getElementById("badgeName"),
        badgeIcon: document.getElementById("badgeIcon"),
        badgeConditionType: document.getElementById("badgeConditionType"),
        badgeConditionValue: document.getElementById("badgeConditionValue"),
    };

    function getToken() {
        return localStorage.getItem("gp_token") || "";
    }

    async function apiRequest(url, options = {}) {
        const token = getToken();
        const headers = {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        };

        if (options.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, { ...options, headers });
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
        customClass: { popup: 'swal2-toast-popup' }
    });

    let feedbackTimeout = null;

    function showToast(message, type = "success") {
        if (toast) {
            toast.fire({ icon: type, title: message });
            return;
        }
        showFeedback(message, type);
    }

    function showFeedback(message, type = "success") {
        if (!els.feedback) return;
        clearTimeout(feedbackTimeout);
        const icon = type === "error" ? "⚠️" : "✅";
        els.feedback.innerHTML = `<span class="feedback-icon">${icon}</span><span>${message}</span>`;
        els.feedback.className = `feedback visible ${type}`;
        feedbackTimeout = setTimeout(clearFeedback, 3200);
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
            return { conditionType: match[1].trim(), conditionValue: Number(match[2]) };
        }
        return { conditionType: 'Défis "Mobilité"', conditionValue: 1 };
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

            if (badge.icone && badge.icone.startsWith("data:")) {
                const img = document.createElement("img");
                img.src = badge.icone;
                img.alt = badge.nom || "Badge";
                img.style.cssText = "width:40px;height:40px;object-fit:contain;";
                icon.appendChild(img);
            } else {
                icon.textContent = badge.icone || "🏅";
            }

            const details = document.createElement("div");
            details.className = "badge-details";

            const titleRow = document.createElement("div");
            titleRow.style.cssText = "display:flex;justify-content:space-between;align-items:center;";

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
                saveBadges();
            });

            card.appendChild(icon);
            card.appendChild(details);
            card.appendChild(deleteButton);
            els.badgeList.appendChild(card);
        });

        if (els.badgeList.children.length === 0) {
            const empty = document.createElement("div");
            empty.className = "badge-empty-state";
            empty.textContent = "Aucun badge défini pour le moment. Cliquez sur + Nouveau Badge pour en créer un.";
            empty.style.cssText = "color:var(--text-muted);padding:1rem;";
            els.badgeList.appendChild(empty);
        }
    }

    function openBadgeModal(badgeId = null) {
        state.editingBadgeId = badgeId;
        const badge = badgeId ? state.badges.find((b) => b.id === badgeId) : null;

        if (badge) {
            els.badgeName.value = badge.nom || "";
            els.badgeIcon.value = badge.icone || "";
            const condition = parseConditionText(badge.description || "");
            els.badgeConditionType.value = condition.conditionType;
            els.badgeConditionValue.value = condition.conditionValue;
        } else {
            els.badgeName.value = "";
            els.badgeIcon.value = "";
            els.badgeConditionType.value = 'Défis "Mobilité"';
            els.badgeConditionValue.value = 1;
        }

        const fileInput = document.querySelector('#modalBadge input[type=file]');
        const previewContainer = document.querySelector('#modalBadge .icon-preview-container');
        const previewImg = document.getElementById('previewIcon');
        if (fileInput) fileInput.value = '';
        if (previewContainer) previewContainer.style.display = 'none';
        if (previewImg) previewImg.src = '';

        if (els.modalBadge) els.modalBadge.style.display = "flex";
    }

    function closeBadgeModal() {
        if (els.modalBadge) els.modalBadge.style.display = "none";
        state.editingBadgeId = null;
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
            const badge = state.badges.find((b) => b.id === state.editingBadgeId);
            if (badge) {
                badge.nom = name;
                badge.icone = icon;
                badge.description = conditionText;
                badge.deleted = false;
            }
        } else {
            state.badges.push({ id: null, nom: name, description: conditionText, icone: icon });
        }

        renderBadges();
        closeBadgeModal();
        saveBadges();
    }

    async function loadBadges() {
        try {
            clearFeedback();
            const response = await apiRequest(API_BADGES, { method: "GET" });
            state.badges = (response.badges || []).map((b) => ({
                id: b.id,
                nom: b.nom,
                description: b.description || "",
                icone: b.icone || "",
            }));
            renderBadges();
        } catch (error) {
            showFeedback(error.message || "Impossible de charger les badges.", "error");
        }
    }

    async function saveBadges() {
        try {
            const payload = {
                badges: state.badges.map((b) => ({
                    id: b.id,
                    nom: String(b.nom || "").trim(),
                    description: String(b.description || "").trim(),
                    icone: String(b.icone || "").trim(),
                    deleted: b.deleted ? true : false,
                })),
            };

            await apiRequest(API_BADGES, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            showToast("Badges enregistrés.", "success");
            await loadBadges();
        } catch (error) {
            showFeedback(error.message || "Impossible d'enregistrer les badges.", "error");
        }
    }

    function attachEvents() {
        if (els.addBadgeBtn) {
            els.addBadgeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                openBadgeModal(null);
            });
        }

        if (els.modalBadge) {
            els.modalBadge.addEventListener("click", (e) => {
                if (e.target === els.modalBadge) closeBadgeModal();
            });

            const cancelBtn = els.modalBadge.querySelector(".btn-cancel");
            const confirmBtn = els.modalBadge.querySelector(".btn-confirm");
            if (cancelBtn) cancelBtn.addEventListener("click", (e) => { e.preventDefault(); closeBadgeModal(); });
            if (confirmBtn) confirmBtn.addEventListener("click", (e) => { e.preventDefault(); saveBadgeFromModal(); });
        }

        const fileInput = document.querySelector('#modalBadge input[type=file]');
        const uploadZone = document.querySelector('#modalBadge .icon-upload-zone');
        const previewContainer = document.querySelector('#modalBadge .icon-preview-container');
        const previewImg = document.getElementById('previewIcon');

        if (fileInput && uploadZone) {
            fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.style.background = 'rgba(148, 187, 57, 0.1)';
            });
            uploadZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadZone.style.background = '';
            });
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.style.background = '';
                if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
            });

            function handleFileSelect(file) {
                if (file && (file.type === 'image/png' || file.type === 'image/svg+xml')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewImg.src = e.target.result;
                        if (previewContainer) previewContainer.style.display = 'flex';
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
        loadBadges();
    }

    initialize();
})();
