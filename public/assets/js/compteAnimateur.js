(() => {
    const API_BASE = "/api";
    const token = () => localStorage.getItem("gp_token") || "";

    async function parseApiResponse(res) {
        const contentType = (res.headers.get("content-type") || "").toLowerCase();
        const text = await res.text();
        if (!text) return null;
        if (!contentType.includes("application/json")) {
            throw new Error("Reponse API non JSON: " + text.slice(0, 120));
        }
        try {
            return JSON.parse(text);
        } catch (_error) {
            throw new Error("Format JSON invalide");
        }
    }

    /**
     * Effectue une requête GET vers l'API.
     * @param {string} path - Le chemin de l'endpoint
     * @returns {Promise<Object>} La réponse JSON
     */
    async function apiGet(path) {
        const res = await fetch(API_BASE + path, {
            headers: {
                Authorization: "Bearer " + token(),
            },
        });
        const data = await parseApiResponse(res);
        if (!res.ok) throw new Error(data?.message || "HTTP " + res.status);
        return data;
    }

    /**
     * Effectue une requête POST vers l'API avec un payload.
     * @param {string} path - Le chemin de l'endpoint
     * @param {Object} payload - Les données à envoyer
     * @returns {Promise<Object>} La réponse JSON
     */
    async function apiPost(path, payload) {
        const res = await fetch(API_BASE + path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token(),
            },
            body: JSON.stringify(payload),
        });
        const data = await parseApiResponse(res);
        if (!res.ok) throw new Error(data?.message || "HTTP " + res.status);
        return data;
    }

    function setText(selector, value) {
        document.querySelectorAll(selector).forEach((el) => {
            el.textContent = value || "";
        });
    }

    /**
     * Affiche un message de retour (succès ou erreur) dans l'interface.
     * @param {string} message - Le message à afficher
     * @param {string} type - "success" ou "error"
     */
    function setFeedback(message, type) {
        const el = document.querySelector("[data-profile-feedback]");
        if (!el) return;
        el.textContent = message || "";
        el.classList.toggle("is-error", type === "error");
        el.classList.toggle("is-success", type === "success");
    }

    function setInitials(prenom, nom) {
        const el = document.querySelector("[data-user-initials]");
        if (!el) return;
        el.textContent = ((prenom || "G").charAt(0) + (nom || "P").charAt(0)).toUpperCase();
    }

    /**
     * Affiche l'avatar de l'utilisateur ou ses initiales s'il n'a pas de photo.
     * @param {string|null} photoPath - Le chemin vers la photo
     * @param {string} prenom - Le prénom de l'utilisateur
     * @param {string} nom - Le nom de l'utilisateur
     */
    function renderAvatar(photoPath, prenom, nom) {
        const photoEl = document.querySelector("[data-avatar-photo]");
        const initialsEl = document.querySelector("[data-user-initials]");
        const modalPhotoEl = document.querySelector("[data-modal-avatar-photo]");
        const modalInitialsEl = document.querySelector("[data-modal-initials]");

        const initStr = ((prenom || "G").charAt(0) + (nom || "P").charAt(0)).toUpperCase();

        if (photoPath) {
            if (photoEl) {
                photoEl.src = photoPath;
                photoEl.classList.remove("hidden");
            }
            if (initialsEl) initialsEl.classList.add("hidden");
            if (modalPhotoEl) {
                modalPhotoEl.src = photoPath;
                modalPhotoEl.classList.remove("hidden");
            }
            if (modalInitialsEl) modalInitialsEl.classList.add("hidden");
        } else {
            if (photoEl) photoEl.classList.add("hidden");
            if (initialsEl) {
                initialsEl.classList.remove("hidden");
                setInitials(prenom, nom);
            }
            if (modalPhotoEl) modalPhotoEl.classList.add("hidden");
            if (modalInitialsEl) {
                modalInitialsEl.classList.remove("hidden");
                modalInitialsEl.textContent = initStr;
            }
        }
    }

    function formatDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(date);
    }

    function roleLabel(role) {
        const normalized = String(role || "").toLowerCase();
        if (normalized === "animateur") return "Animateur DD";
        if (normalized === "admin" || normalized === "rh") return "Admin RH";
        if (normalized === "employe") return "Employe";
        return role ? role.toUpperCase() : "Utilisateur";
    }

    /**
     * Synchronise les informations de l'utilisateur avec le localStorage.
     * @param {Object} user - Les données de l'utilisateur
     */
    function syncStoredUser(user) {
        let current = {};
        try {
            current = JSON.parse(localStorage.getItem("gp_user") || "{}");
        } catch (_error) {
            current = {};
        }
        localStorage.setItem(
            "gp_user",
            JSON.stringify({
                ...current,
                nomUser: user.nomUser ?? current.nomUser ?? "",
                prenomUser: user.prenomUser ?? current.prenomUser ?? "",
                email: user.email ?? current.email ?? "",
                role: user.role ?? current.role ?? "",
                pdpUser: user.pdpUser ?? current.pdpUser ?? null,
            })
        );
    }

    function openModal(id) {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === "modal-edit-password") {
            const inputs = el.querySelectorAll("input");
            inputs.forEach((input) => {
                input.value = "";
            });
            resetPasswordToggles(el);
        }
        el.classList.remove("hidden");
    }

    function resetPasswordToggles(scope) {
        if (!scope) return;
        scope.querySelectorAll("[data-toggle-password]").forEach((btn) => {
            const targetId = btn.getAttribute("data-toggle-password");
            const input = targetId ? document.getElementById(targetId) : null;
            if (input) {
                input.type = "password";
            }
            btn.classList.remove("is-active");
            const icon = btn.querySelector("i");
            if (icon) {
                icon.classList.add("fa-eye");
                icon.classList.remove("fa-eye-slash");
            }
            btn.setAttribute("aria-label", "Afficher le mot de passe");
        });
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
        resetPasswordToggles(el);
        el?.querySelectorAll(".feedback-msg").forEach((f) => {
            f.textContent = "";
            f.className = "feedback-msg";
        });
    }

    function bindModalTriggers() {
        document.querySelector("[data-open-edit-modal]")?.addEventListener("click", () => openModal("modal-edit-profile"));
        document.querySelector("[data-open-pwd-modal]")?.addEventListener("click", () => openModal("modal-edit-password"));

        document.querySelectorAll("[data-close-modal]").forEach((btn) => {
            btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
        });

        document.querySelectorAll(".modal-overlay").forEach((overlay) => {
            overlay.addEventListener("click", (event) => {
                if (event.target === overlay) closeModal(overlay.id);
            });
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                document.querySelectorAll(".modal-overlay:not(.hidden)").forEach((modal) => closeModal(modal.id));
            }
        });
    }

    function bindPhotoUpload() {
        const wrap = document.querySelector("[data-modal-avatar-wrap]");
        const input = document.querySelector("[data-modal-photo-input]");
        const feedback = document.querySelector("[data-photo-feedback]");
        if (!wrap || !input) return;

        wrap.addEventListener("click", () => input.click());

        input.addEventListener("change", async () => {
            if (!input.files || !input.files[0]) return;
            const fd = new FormData();
            fd.append("photo", input.files[0]);
            if (feedback) {
                feedback.className = "feedback-msg";
                feedback.textContent = "Upload en cours...";
            }

            try {
                const res = await fetch(API_BASE + "/auth/upload-photo.php", {
                    method: "POST",
                    headers: { Authorization: "Bearer " + token() },
                    body: fd,
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "HTTP " + res.status);

                renderAvatar(json.photo, null, null);
                if (feedback) {
                    feedback.className = "feedback-msg is-success";
                    feedback.textContent = "Photo mise a jour.";
                }
                let current = {};
                try {
                    current = JSON.parse(localStorage.getItem("gp_user") || "{}");
                } catch (_error) {
                    current = {};
                }
                localStorage.setItem("gp_user", JSON.stringify({ ...current, pdpUser: json.photo }));
            } catch (err) {
                if (feedback) {
                    feedback.className = "feedback-msg is-error";
                    feedback.textContent = err.message || "Erreur upload.";
                }
            }

            input.value = "";
        });
    }

    function bindPasswordToggles() {
        document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const targetId = btn.getAttribute("data-toggle-password");
                const input = targetId ? document.getElementById(targetId) : null;
                if (!input) return;

                const isHidden = input.type === "password";
                input.type = isHidden ? "text" : "password";
                btn.classList.toggle("is-active", isHidden);
                btn.setAttribute("aria-label", isHidden ? "Masquer le mot de passe" : "Afficher le mot de passe");

                const icon = btn.querySelector("i");
                if (icon) {
                    icon.classList.toggle("fa-eye", !isHidden);
                    icon.classList.toggle("fa-eye-slash", isHidden);
                }
            });
        });
    }

    function bindEditModal(initialUser) {
        const form = document.querySelector("[data-edit-profile-form]");
        const feedback = document.querySelector("[data-edit-profile-feedback]");
        if (!form || !feedback) return;

        if (initialUser) {
            const prenomInput = form.querySelector("[name=prenomUser]");
            const nomInput = form.querySelector("[name=nomUser]");
            const emailInput = form.querySelector("[name=email]");
            if (prenomInput) prenomInput.value = initialUser.prenomUser || "";
            if (nomInput) nomInput.value = initialUser.nomUser || "";
            if (emailInput) emailInput.value = initialUser.email || "";
        }

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            feedback.className = "feedback-msg";
            feedback.textContent = "";

            const fd = new FormData(form);
            const prenomUser = fd.get("prenomUser")?.trim() || "";
            const nomUser = fd.get("nomUser")?.trim() || "";
            const email = fd.get("email")?.trim() || "";

            if (!prenomUser || !nomUser) {
                feedback.className = "feedback-msg is-error";
                feedback.textContent = "Prenom et nom sont requis.";
                return;
            }

            const btn = form.querySelector("[type=submit]");
            if (btn) btn.disabled = true;

            try {
                const payload = { nomUser, prenomUser };
                if (email) payload.email = email;
                const result = await apiPost("/auth/update-profile.php", payload);
                const updated = result.user || {};

                syncStoredUser(updated);

                const finalPrenom = updated.prenomUser || prenomUser;
                const finalNom = updated.nomUser || nomUser;
                const finalEmail = updated.email || email;
                const finalRole = roleLabel(updated.role || "animateur");

                setText("[data-user-name]", `${finalPrenom} ${finalNom}`.trim());
                setText("[data-user-email]", finalEmail);
                setText("[data-user-role-label]", finalRole);
                setInitials(finalPrenom, finalNom);

                feedback.className = "feedback-msg is-success";
                feedback.textContent = result.message || "Profil mis a jour.";

                setTimeout(() => closeModal("modal-edit-profile"), 1400);
            } catch (err) {
                feedback.className = "feedback-msg is-error";
                feedback.textContent = err?.message || "Impossible de mettre a jour le profil.";
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }

    function bindPasswordModal() {
        const form = document.querySelector("[data-pwd-form]");
        const feedback = document.querySelector("[data-pwd-feedback]");
        if (!form || !feedback) return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            feedback.className = "feedback-msg";
            feedback.textContent = "";

            const fd = new FormData(form);
            const currentPassword = fd.get("current_password")?.trim() || "";
            const newPassword = fd.get("new_password")?.trim() || "";
            const confirmPassword = fd.get("confirm_password")?.trim() || "";

            if (!currentPassword || !newPassword) {
                feedback.className = "feedback-msg is-error";
                feedback.textContent = "Tous les champs sont requis.";
                return;
            }
            if (newPassword !== confirmPassword) {
                feedback.className = "feedback-msg is-error";
                feedback.textContent = "Les nouveaux mots de passe ne correspondent pas.";
                return;
            }
            if (newPassword.length < 8) {
                feedback.className = "feedback-msg is-error";
                feedback.textContent = "Le mot de passe doit contenir au moins 8 caracteres.";
                return;
            }

            const btn = form.querySelector("[type=submit]");
            if (btn) btn.disabled = true;

            try {
                const result = await apiPost("/auth/update-password.php", {
                    current_password: currentPassword,
                    new_password: newPassword,
                });
                feedback.className = "feedback-msg is-success";
                feedback.textContent = result.message || "Mot de passe mis a jour.";
                form.reset();
                setTimeout(() => closeModal("modal-edit-password"), 1400);
            } catch (err) {
                feedback.className = "feedback-msg is-error";
                feedback.textContent = err?.message || "Impossible de changer le mot de passe.";
            } finally {
                if (btn) btn.disabled = false;
            }
        });
    }

    const SECURITY_API = "/api/modules/profile/security.php";

    async function loadSecurityInfo() {
        try {
            const tk = token();
            const res = await fetch(`${SECURITY_API}?action=info`, {
                headers: { Authorization: `Bearer ${tk}` },
            });
            if (!res.ok) return;
            const json = await res.json();
            const info = json.data ?? {};

            const pwdEl = document.getElementById("last-pwd-change");
            const loginEl = document.getElementById("last-login");
            const twofaEl = document.getElementById("twofa-status");

            if (pwdEl) pwdEl.textContent = info.password_age ?? "Information indisponible";
            if (loginEl) loginEl.textContent = info.last_login ?? "Information indisponible";
            if (twofaEl) {
                twofaEl.textContent = info.twofa_enabled
                    ? "Activée"
                    : "Désactivée";
            }
        } catch (_) { /* silencieux */ }
    }

    function parseUserAgent(ua) {
        if (!ua) return "Navigateur inconnu";
        if (/Edg\//i.test(ua))    return "Microsoft Edge";
        if (/OPR\//i.test(ua))    return "Opera";
        if (/Chrome\//i.test(ua)) return "Chrome";
        if (/Firefox\//i.test(ua)) return "Firefox";
        if (/Safari\//i.test(ua)) return "Safari";
        return "Navigateur inconnu";
    }

    function formatDate(isoStr) {
        if (!isoStr) return "";
        try {
            return new Date(isoStr).toLocaleString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
            });
        } catch (_) { return isoStr; }
    }

    async function loadSessions() {
        const listEl = document.getElementById("sessions-list");
        if (!listEl) return;

        try {
            const tk = token();
            const res = await fetch(`${SECURITY_API}?action=sessions`, {
                headers: { Authorization: `Bearer ${tk}` },
            });
            if (!res.ok) { listEl.innerHTML = '<p class="sessions-loading">Indisponible.</p>'; return; }
            const json = await res.json();
            const sessions = json.sessions ?? [];

            if (sessions.length === 0) {
                listEl.innerHTML = '<p class="sessions-loading">Aucune session active.</p>';
                return;
            }

            listEl.innerHTML = sessions.map((s, index) => {
                const id       = s.id_session;
                const ip       = s.ip_address ?? "IP inconnue";
                const device   = parseUserAgent(s.user_agent ?? "");
                const lastSeen = formatDate(s.derniere_activite ?? s.date_creation);
                const isCurrent = index === 0;
                return `
                <div class="session-item">
                    <div class="session-info">
                        <span class="session-device">${device}</span>
                        <span class="session-meta">${ip} · ${lastSeen}</span>
                    </div>
                    ${isCurrent
                        ? '<span class="session-current">Session actuelle</span>'
                        : `<button class="session-revoke-btn" data-session-id="${id}">Terminer</button>`
                    }
                </div>`;
            }).join('');

            listEl.querySelectorAll("[data-session-id]").forEach(btn => {
                btn.addEventListener("click", async () => {
                    btn.disabled = true;
                    try {
                        const tk2 = token();
                        await fetch(`${SECURITY_API}?action=logout-session`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${tk2}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ sessionId: btn.dataset.sessionId }),
                        });
                        loadSessions();
                    } catch (_) { btn.disabled = false; }
                });
            });
        } catch (_) {
            listEl.innerHTML = '<p class="sessions-loading">Impossible de charger les sessions.</p>';
        }
    }

    document.addEventListener("DOMContentLoaded", async () => {
        bindModalTriggers();
        bindPasswordToggles();
        bindPasswordModal();

        if (!token()) {
            setFeedback("Session invalide. Merci de vous reconnecter.", "error");
            return;
        }

        try {
            const data = await apiGet("/auth/me.php");
            const user = data?.user || {};

            const prenom = user.prenomUser || "";
            const nom = user.nomUser || "";
            const email = user.email || "";
            const status = user.statutUser || "Actif";
            const roleText = roleLabel(user.role || "animateur");

            renderAvatar(user.pdpUser || null, prenom, nom);
            bindPhotoUpload();

            setText("[data-user-name]", `${prenom} ${nom}`.trim());
            setText("[data-user-email]", email);
            setText("[data-user-role-label]", roleText);
            setText("[data-user-status]", status);
            setText("[data-user-since]", formatDate(user.inscriptionUser) || "--");

            syncStoredUser(user);
            bindEditModal(user);
            setFeedback("", "");
        } catch (err) {
            setFeedback(err?.message || "Impossible de charger le profil.", "error");
        }

        loadSecurityInfo();
        loadSessions();
    });
})();
