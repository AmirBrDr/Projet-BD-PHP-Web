(() => {
    const API_BADGES = "/api/modules/animator/badges.php";
    const API_THEMES = "/api/modules/animator/?action=themes";
    const EMOJI_LIST = [
        "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫡","🤭","🤫","🤥","😶","😶‍🌫️","😐","😑","😬","🙄","😯","😦","😧","😮","😲","😴","🤤","😪","😵","😵‍💫","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","💀","👻","👽","🤖","💩",
        "👍","👎","👊","✊","🤛","🤜","👏","🙌","🫶","🤝","🙏","✋","🤚","🖐️","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","🫰","🫵","👈","👉","👆","👇","☝️","✍️","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦴","🦷","👀","👁️",
        "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🪿","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪲","🐞","🦋","🐌","🐛","🪱","🦟","🪳","🕷️","🦂","🐢","🐍","🦎","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🦦","🦥","🦨","🦘","🦬","🦣",
        "🌸","🌼","🌻","🌹","🥀","🌺","🌷","🌱","🌲","🌳","🌴","🌵","🌾","🌿","☘️","🍀","🍁","🍂","🍃","🍄","🌍","🌎","🌏","🌙","⭐","🌟","✨","⚡","🔥","💧","🌈","☀️","🌤️","⛅","🌧️","⛈️","❄️","☃️",
        "🍎","🍏","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🌽","🥕","🧄","🧅","🥔","🍠","🫛","🍞","🥖","🥨","🥯","🥞","🧇","🧀","🍗","🍖","🥩","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🥙","🍝","🍜","🍲","🥣","🍣","🍱","🍤","🍙","🍚","🍛","🍪","🎂","🍰","🧁","🍩","🍫","🍬","🍭","☕","🫖","🍵","🥤","🧃","🧉","🍺","🍷","🍸","🍹","🍾",
        "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🥅","🏒","🏑","🥍","🏏","⛳","🎯","🪀","🪁","🎣","🤿","🎽","🛹","🛼","🛷","⛷️","🏂","🏋️","🤼","🤸","⛹️","🤺","🤾","🚴","🚵","🏊","🤽","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️","🎟️","🎫","🎪","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻",
        "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️","🚲","🛴","🚨","✈️","🛫","🛬","🛩️","🚀","🛰️","🚁","🚤","⛵","🛶","🛳️","🚢","🚉","🚆","🚄","🚅","🚇","🚊","🚝","🚡","🚠","🚏","🗺️","🗿","🗽","🗼","🏰","🏯","🏟️","🏠","🏡","🏢","🏣","🏥","🏦","🏨","🏫","🏬","🏭","🏙️","🌆","🌇","🌉","🗾",
        "⌚","📱","💻","🖥️","🖨️","🧮","🎥","📷","📸","📹","📺","📻","🎙️","💡","🔦","🕯️","🪔","🔋","🔌","💾","💿","📀","🧭","⏰","⏳","📡","🔭","🔬","🧪","🧫","🧬","🔑","🔒","🔓","🔨","🪓","⛏️","🛠️","⚙️","🧰","🧲","🧯","📌","📍","✂️","📝","✏️","📚","📖","📎","🔖","📅","📊","📈","📉","💰","💳","🧾","🔔","📣","📯","🎁",
        "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","💖","💗","💓","💞","💕","💘","💝","✅","☑️","✔️","✖️","❌","⚠️","🚫","❗","❓","💯","🏳️","🏁","🏴","🏳️‍🌈"
    ];

    const state = {
        badges: [],
        editingBadgeId: null,
        themes: [],
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
        emojiPanel: document.querySelector("[data-emoji-panel]"),
        emojiGrid: document.querySelector("[data-emoji-grid]"),
        emojiToggle: document.querySelector("[data-emoji-toggle]"),
        emojiClose: document.querySelector("[data-emoji-close]"),
        emojiPreview: document.querySelector("[data-emoji-preview]"),
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

    function formatThemeLabel(name) {
        return `Défis "${name}"`;
    }

    function getDefaultConditionType() {
        if (state.themes.length > 0) {
            return formatThemeLabel(state.themes[0].nom);
        }
        return "Points Totaux (Global)";
    }

    function buildConditionOptions(selectedValue = "") {
        if (!els.badgeConditionType) return;

        const existingValues = new Set();
        els.badgeConditionType.innerHTML = "";

        state.themes.forEach((theme) => {
            const value = formatThemeLabel(theme.nom);
            existingValues.add(value);
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            if (value === selectedValue) option.selected = true;
            els.badgeConditionType.appendChild(option);
        });

        const pointsValue = "Points Totaux (Global)";
        existingValues.add(pointsValue);
        const pointsOption = document.createElement("option");
        pointsOption.value = pointsValue;
        pointsOption.textContent = pointsValue;
        if (pointsValue === selectedValue) pointsOption.selected = true;
        els.badgeConditionType.appendChild(pointsOption);

        if (selectedValue && !existingValues.has(selectedValue)) {
            const customOption = document.createElement("option");
            customOption.value = selectedValue;
            customOption.textContent = selectedValue;
            customOption.selected = true;
            els.badgeConditionType.appendChild(customOption);
        }
    }

    function parseConditionText(text) {
        const match = String(text || "").match(/^(.*)\s*>=\s*(\d+)$/);
        if (match) {
            return { conditionType: match[1].trim(), conditionValue: Number(match[2]) };
        }
        return { conditionType: getDefaultConditionType(), conditionValue: 1 };
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

            icon.textContent = badge.icone || "🏅";

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
            if (els.emojiPreview) {
                els.emojiPreview.textContent = badge.icone || "🏅";
            }
            const condition = parseConditionText(badge.description || "");
            buildConditionOptions(condition.conditionType);
            els.badgeConditionType.value = condition.conditionType;
            els.badgeConditionValue.value = condition.conditionValue;
        } else {
            els.badgeName.value = "";
            els.badgeIcon.value = "";
            if (els.emojiPreview) {
                els.emojiPreview.textContent = "🏅";
            }
            buildConditionOptions(getDefaultConditionType());
            els.badgeConditionType.value = getDefaultConditionType();
            els.badgeConditionValue.value = 1;
        }

        if (els.emojiPanel) {
            els.emojiPanel.hidden = true;
        }

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

    function buildEmojiGrid() {
        if (!els.emojiGrid) return;
        els.emojiGrid.innerHTML = "";

        EMOJI_LIST.forEach((emoji) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "emoji-btn";
            btn.textContent = emoji;
            btn.addEventListener("click", () => {
                els.badgeIcon.value = emoji;
                if (els.emojiPreview) {
                    els.emojiPreview.textContent = emoji;
                }
                if (els.emojiPanel) {
                    els.emojiPanel.hidden = true;
                }
            });
            els.emojiGrid.appendChild(btn);
        });
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

    async function loadThemes() {
        try {
            const response = await apiRequest(API_THEMES, { method: "GET" });
            state.themes = (response.data || []).map((t) => ({
                id: t.id_thematique,
                nom: t.nomtheme,
            }));
        } catch (error) {
            state.themes = [];
            showFeedback(error.message || "Impossible de charger les thematiques.", "error");
        }

        buildConditionOptions(getDefaultConditionType());
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
                if (els.emojiToggle) {
                    els.emojiToggle.addEventListener("click", () => {
                        if (!els.emojiPanel) return;
                        const willShow = els.emojiPanel.hidden;
                        els.emojiPanel.hidden = !willShow;
                        if (willShow) {
                            buildEmojiGrid();
                        }
                    });
                }

                if (els.emojiClose) {
                    els.emojiClose.addEventListener("click", () => {
                        if (els.emojiPanel) {
                            els.emojiPanel.hidden = true;
                        }
                    });
                }
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

    }

    async function initialize() {
        attachEvents();
        await loadThemes();
        await loadBadges();
    }

    initialize();
})();
