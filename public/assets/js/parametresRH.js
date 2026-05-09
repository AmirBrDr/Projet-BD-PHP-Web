(() => {
    const API_SETTINGS = "/api/modules/settings/index.php";

    const state = {
        notifications: {
            active: true,
            frequency: 'biweekly',
        },
    };

    const els = {
        feedback: document.getElementById("settingsFeedback"),
        saveSettingsBtn: document.getElementById("saveSettingsBtn"),
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

    async function loadSettings() {
        try {
            clearFeedback();
            const response = await apiRequest(API_SETTINGS, { method: "GET" });
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
        } catch (error) {
            showFeedback(error.message || "Impossible de charger les paramètres.", "error");
        }
    }

    async function saveSettings() {
        try {
            clearFeedback();
            const notificationPayload = {
                active: els.remindersToggle ? Boolean(els.remindersToggle.checked) : state.notifications.active,
                frequency: els.reminderFrequency ? String(els.reminderFrequency.value) : state.notifications.frequency,
            };

            const payload = {
                thematiques: [],
                badges: [],
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
        if (els.saveSettingsBtn) {
            els.saveSettingsBtn.addEventListener("click", (event) => {
                event.preventDefault();
                saveSettings();
            });
        }

        if (els.remindersToggle) {
            els.remindersToggle.addEventListener("change", () => {
                state.notifications.active = Boolean(els.remindersToggle.checked);
            });
        }

        if (els.reminderFrequency) {
            els.reminderFrequency.addEventListener("change", () => {
                state.notifications.frequency = String(els.reminderFrequency.value);
            });
        }
    }

    function initialize() {
        attachEvents();
        loadSettings();
    }

    initialize();
})();
