// Fichier: public/assets/js/gestionUtilisateurs.js - Logique frontend et interactions.
(() => {
    // Configuration de l'API et de la pagination
    const API_USERS = "/api/modules/users/user-management.php";
    const API_TEAMS = "/api/modules/teams/team-management.php";
    const PAGE_SIZE = 10;

    // État global de l'application
    const state = {
        users: [],
        teams: [],
        filteredUsers: [],
        page: 1,
        editingUser: null,
        importRows: null,
    };

    // Références aux éléments du DOM
    const els = {
        feedback: document.getElementById("feedback"),
        searchInput: document.getElementById("searchInput"),
        roleFilter: document.getElementById("roleFilter"),
        teamFilter: document.getElementById("teamFilter"),
        tableBody: document.getElementById("usersTableBody"),
        emptyState: document.getElementById("emptyState"),
        paginationText: document.getElementById("paginationText"),
        prevPageBtn: document.getElementById("prevPageBtn"),
        nextPageBtn: document.getElementById("nextPageBtn"),
        btnOpenUser: document.getElementById("btnOpenUser"),
        btnOpenTeam: document.getElementById("btnOpenTeam"),
        btnOpenImport: document.getElementById("btnOpenImport"),
        modalUser: document.getElementById("modalUser"),
        modalTeam: document.getElementById("modalTeam"),
        modalImport: document.getElementById("modalImport"),
        userModalTitle: document.getElementById("userModalTitle"),
        userForm: document.getElementById("userForm"),
        userIdField: document.getElementById("userIdField"),
        prenomField: document.getElementById("prenomField"),
        nomField: document.getElementById("nomField"),
        emailField: document.getElementById("emailField"),
        roleField: document.getElementById("roleField"),
        teamField: document.getElementById("teamField"),
        statusField: document.getElementById("statusField"),
        passwordField: document.getElementById("passwordField"),
        saveUserBtn: document.getElementById("saveUserBtn"),
        teamForm: document.getElementById("teamForm"),
        teamNameField: document.getElementById("teamNameField"),
        uploadZone: document.getElementById("uploadZone"),
        csvInput: document.getElementById("csvInput"),
        selectedFileName: document.getElementById("selectedFileName"),
        importBtn: document.getElementById("importBtn"),
    };

    // Récupère le token JWT de la session locale
    function getToken() {
        return localStorage.getItem("gp_token") || "";
    }

    // Effectue une requête API avec authentification
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

        const res = await fetch(url, {
            ...options,
            headers,
        });

        let payload = null;
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
            payload = await res.json();
        } else {
            payload = await res.text();
        }

        if (!res.ok) {
            const msg = payload && typeof payload === "object" && payload.message ? payload.message : "Erreur API";
            throw new Error(msg);
        }

        return payload;
    }

    // Affiche un message de rétroaction à l'utilisateur
    function showFeedback(message, type = "success") {
        if (!els.feedback) {
            return;
        }

        if (!message) {
            els.feedback.className = "feedback";
            els.feedback.textContent = "";
            return;
        }

        els.feedback.textContent = message;
        els.feedback.className = `feedback is-${type}`;
    }

    // Échappe les caractères HTML pour éviter les injections XSS
    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Retourne le libellé lisible d'un rôle
    function getRoleLabel(role) {
        const normalized = String(role || "").toLowerCase();
        if (normalized === "admin") return "Admin RH";
        if (normalized === "animateur") return "Animateur DD";
        return "Employé";
    }

    function initials(user) {
        const a = (user.prenomuser || user.prenomUser || "").trim();
        const b = (user.nomuser || user.nomUser || "").trim();
        return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase() || "??";
    }

    function teamDisplay(user) {
        const role = String(user.role || "").toLowerCase();
        if (role !== "employe") {
            return '<span class="text-muted">N/A (Gestionnaire)</span>';
        }
        if (user.nomequipe) {
            return escapeHtml(user.nomequipe);
        }
        return '<span class="text-muted">Sans équipe</span>';
    }

    // Filtre les utilisateurs selon la recherche et les sélecteurs
    function getFilteredUsers() {
        const q = (els.searchInput.value || "").trim().toLowerCase();
        const role = (els.roleFilter.value || "all").toLowerCase();
        const team = (els.teamFilter.value || "all").toLowerCase();

        return state.users.filter((u) => {
            const fullName = `${u.prenomuser || ""} ${u.nomuser || ""}`.toLowerCase();
            const email = String(u.email || "").toLowerCase();
            const roleOk = role === "all" || String(u.role || "").toLowerCase() === role;

            let teamOk = true;
            if (team !== "all") {
                if (team === "none") {
                    teamOk = !u.id_equipe;
                } else {
                    teamOk = String(u.id_equipe || "") === team;
                }
            }

            const searchOk = q === "" || fullName.includes(q) || email.includes(q);
            return roleOk && teamOk && searchOk;
        });
    }

    // Affiche le tableau des utilisateurs avec pagination
    function renderTable() {
        state.filteredUsers = getFilteredUsers();

        const total = state.filteredUsers.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        if (state.page > totalPages) state.page = totalPages;

        const start = (state.page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const currentPageItems = state.filteredUsers.slice(start, end);

        if (currentPageItems.length === 0) {
            els.tableBody.innerHTML = "";
            els.emptyState.classList.remove("hidden");
        } else {
            els.emptyState.classList.add("hidden");
            els.tableBody.innerHTML = currentPageItems
                .map((u) => {
                    const fullName = `${u.prenomuser || ""} ${u.nomuser || ""}`.trim();
                    const role = String(u.role || "employe").toLowerCase();
                    return `
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <div class="mini-avatar default">${escapeHtml(initials(u))}</div>
                                    <strong>${escapeHtml(fullName)}</strong>
                                </div>
                            </td>
                            <td>${escapeHtml(u.email || "")}</td>
                            <td><span class="badge-role ${escapeHtml(role)}">${escapeHtml(getRoleLabel(role))}</span></td>
                            <td>${teamDisplay(u)}</td>
                            <td class="action-cells">
                                <button class="btn-icon edit" data-action="edit" data-id="${u.id_user}" title="Modifier" aria-label="Modifier">
                                    <svg class="btn-icon__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l9.06-9.06.92.92L5.92 19.58zM20.71 7.04a1.003 1.003 0 0 0 0-1.42L18.37 3.29a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z"/>
                                    </svg>
                                </button>
                                <button class="btn-icon delete" data-action="delete" data-id="${u.id_user}" title="Supprimer" aria-label="Supprimer">
                                    <svg class="btn-icon__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path fill="currentColor" d="M6 7h12v2H6V7zm2 3h8l-1 10H9L8 10zm3-6h2l1 1h4v2H6V5h4l1-1z"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    `;
                })
                .join("");
        }

        const from = total === 0 ? 0 : start + 1;
        const to = Math.min(end, total);
        els.paginationText.textContent = `${from} - ${to} sur ${total} utilisateurs`;

        els.prevPageBtn.disabled = state.page <= 1;
        els.nextPageBtn.disabled = state.page >= totalPages;
    }

    // Remplit les sélecteurs d'équipes
    function fillTeamSelects() {
        const options = state.teams
            .map((t) => `<option value="${t.id_equipe}">${escapeHtml(t.nomequipe)}</option>`)
            .join("");

        els.teamFilter.innerHTML = `<option value="all">Toutes les équipes</option>${options}<option value="none">Sans équipe</option>`;
        els.teamField.innerHTML = `<option value="">-- Sans équipe --</option>${options}`;
    }

    // Ouvre une fenêtre modale
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = "flex";
        }
    }

    // Ferme une fenêtre modale
    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = "none";
        }
    }

    // Réinitialise le formulaire utilisateur
    function resetUserForm(isEdit = false) {
        els.userForm.reset();
        els.userIdField.value = "";
        state.editingUser = null;
        els.userModalTitle.textContent = isEdit ? "Modifier un Utilisateur" : "Créer un Utilisateur";
        els.saveUserBtn.textContent = isEdit ? "Mettre à jour" : "Enregistrer";
        toggleTeamFieldByRole();
    }

    // Active/désactive le champ équipe selon le rôle
    function toggleTeamFieldByRole() {
        const role = (els.roleField.value || "employe").toLowerCase();
        const disabled = role !== "employe";
        els.teamField.disabled = disabled;
        if (disabled) {
            els.teamField.value = "";
        }
    }

    // Charge les utilisateurs depuis l'API
    async function loadUsers() {
        const response = await apiRequest(API_USERS);
        state.users = Array.isArray(response.items) ? response.items : [];
        renderTable();
    }

    // Charge les équipes depuis l'API
    async function loadTeams() {
        const response = await apiRequest(API_TEAMS);
        state.teams = Array.isArray(response.items) ? response.items : [];
        fillTeamSelects();
    }

    // Extrait les données utilisateur du formulaire
    function userPayloadFromForm() {
        return {
            prenomUser: (els.prenomField.value || "").trim(),
            nomUser: (els.nomField.value || "").trim(),
            email: (els.emailField.value || "").trim(),
            role: (els.roleField.value || "").toLowerCase(),
            idEquipe: els.teamField.disabled ? "" : (els.teamField.value || ""),
            statutUser: (els.statusField.value || "actif").toLowerCase(),
            mdp: els.passwordField.value || "",
        };
    }

    // Valide les données utilisateur avant envoi
    function validateUserPayload(payload) {
        if (!payload.prenomUser || !payload.nomUser || !payload.email) {
            throw new Error("Prénom, nom et email sont obligatoires.");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            throw new Error("Format d'email invalide.");
        }
        if (payload.mdp && payload.mdp.length < 6) {
            throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        }
    }

    // Remplit le formulaire avec les données de l'utilisateur
    function hydrateUserForm(user) {
        els.userIdField.value = String(user.id_user || "");
        els.prenomField.value = user.prenomuser || "";
        els.nomField.value = user.nomuser || "";
        els.emailField.value = user.email || "";
        els.roleField.value = (user.role || "employe").toLowerCase();
        toggleTeamFieldByRole();
        els.teamField.value = user.id_equipe ? String(user.id_equipe) : "";
        els.statusField.value = (user.statutuser || "actif").toLowerCase();
        els.passwordField.value = "";
        els.userModalTitle.textContent = "Modifier un Utilisateur";
        els.saveUserBtn.textContent = "Mettre à jour";
        state.editingUser = user;
    }

    // Enregistre ou met à jour un utilisateur
    async function saveUser(event) {
        event.preventDefault();
        showFeedback("");

        try {
            const payload = userPayloadFromForm();
            validateUserPayload(payload);

            const userId = Number.parseInt(els.userIdField.value, 10);
            if (Number.isInteger(userId) && userId > 0) {
                await apiRequest(`${API_USERS}?id=${userId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                showFeedback("Utilisateur mis à jour avec succès.", "success");
            } else {
                await apiRequest(API_USERS, {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                showFeedback("Utilisateur créé avec succès.", "success");
            }

            closeModal("modalUser");
            resetUserForm(false);
            await Promise.all([loadUsers(), loadTeams()]);
        } catch (error) {
            showFeedback(error.message || "Impossible d'enregistrer l'utilisateur.", "error");
        }
    }

    // Supprime un utilisateur après confirmation
    async function deleteUser(userId) {
        if (!window.confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) {
            return;
        }

        showFeedback("");
        try {
            await apiRequest(`${API_USERS}?id=${userId}`, { method: "DELETE" });
            showFeedback("Utilisateur supprimé.", "success");
            await loadUsers();
        } catch (error) {
            showFeedback(error.message || "Suppression impossible.", "error");
        }
    }

    // Crée une nouvelle équipe
    async function createTeam(event) {
        event.preventDefault();
        showFeedback("");

        const name = (els.teamNameField.value || "").trim();
        if (!name) {
            showFeedback("Le nom d'équipe est requis.", "error");
            return;
        }

        try {
            await apiRequest(API_TEAMS, {
                method: "POST",
                body: JSON.stringify({ nomEquipe: name }),
            });
            showFeedback("Équipe créée avec succès.", "success");
            closeModal("modalTeam");
            els.teamForm.reset();
            await loadTeams();
        } catch (error) {
            showFeedback(error.message || "Création d'équipe impossible.", "error");
        }
    }

    // Parse un fichier CSV en tableau d'objets
    function parseCsvText(csvText) {
        const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
        if (lines.length < 2) {
            throw new Error("Le CSV doit contenir un en-tête et au moins une ligne.");
        }

        const headers = lines[0].split(",").map((h) => h.trim());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(",");
            const obj = {};
            headers.forEach((header, idx) => {
                obj[header] = (cells[idx] || "").trim();
            });
            rows.push(obj);
        }

        return rows;
    }

    // Lit un fichier CSV sélectionné
    async function readSelectedCsv(file) {
        const text = await file.text();
        state.importRows = parseCsvText(text);
        els.selectedFileName.textContent = `${file.name} (${state.importRows.length} lignes)`;
    }

    // Lance l'import des utilisateurs depuis le fichier CSV
    async function triggerImport() {
        if (!Array.isArray(state.importRows) || state.importRows.length === 0) {
            showFeedback("Sélectionnez un fichier CSV valide avant de lancer l'import.", "error");
            return;
        }

        showFeedback("");

        try {
            const result = await apiRequest(`${API_USERS}?action=import`, {
                method: "POST",
                body: JSON.stringify({ rows: state.importRows }),
            });

            const errors = Array.isArray(result.errors) ? result.errors : [];
            if (errors.length > 0) {
                showFeedback(`Import partiel: ${result.created || 0} créés, ${errors.length} en erreur.`, "warning");
            } else {
                showFeedback(`Import terminé: ${result.created || 0} utilisateurs créés.`, "success");
            }

            closeModal("modalImport");
            state.importRows = null;
            els.csvInput.value = "";
            els.selectedFileName.textContent = "Aucun fichier sélectionné";
            await Promise.all([loadUsers(), loadTeams()]);
        } catch (error) {
            showFeedback(error.message || "Import impossible.", "error");
        }
    }

    // Gère les clics sur les boutons du tableau
    function onTableClick(event) {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const id = Number.parseInt(button.dataset.id || "", 10);
        if (!Number.isInteger(id) || id <= 0) return;

        const action = button.dataset.action;
        if (action === "delete") {
            deleteUser(id);
            return;
        }

        if (action === "edit") {
            const user = state.users.find((u) => Number(u.id_user) === id);
            if (!user) return;
            hydrateUserForm(user);
            openModal("modalUser");
        }
    }

    // Attache les événements de fermeture des modales
    function bindModalCloseButtons() {
        document.querySelectorAll("[data-close-modal]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-close-modal");
                if (id) {
                    closeModal(id);
                }
            });
        });

        [els.modalUser, els.modalTeam, els.modalImport].forEach((modal) => {
            if (!modal) return;
            modal.addEventListener("click", (event) => {
                if (event.target === modal) {
                    modal.style.display = "none";
                }
            });
        });
    }

    // Attache tous les événements de l'interface
    function bindEvents() {
        els.searchInput.addEventListener("input", () => {
            state.page = 1;
            renderTable();
        });
        // Filtrage par rôle
        els.roleFilter.addEventListener("change", () => {
            state.page = 1;
            renderTable();
        });
        // Filtrage par équipe
        els.teamFilter.addEventListener("change", () => {
            state.page = 1;
            renderTable();
        });

        // Navigation de pagination
        els.prevPageBtn.addEventListener("click", () => {
            state.page = Math.max(1, state.page - 1);
            renderTable();
        });
        els.nextPageBtn.addEventListener("click", () => {
            const maxPage = Math.max(1, Math.ceil(state.filteredUsers.length / PAGE_SIZE));
            state.page = Math.min(maxPage, state.page + 1);
            renderTable();
        });

        // Ouverture des fenêtres modales
        els.btnOpenUser.addEventListener("click", () => {
            resetUserForm(false);
            openModal("modalUser");
        });
        els.btnOpenTeam.addEventListener("click", () => openModal("modalTeam"));
        els.btnOpenImport.addEventListener("click", () => openModal("modalImport"));

        // Soumission des formulaires
        els.roleField.addEventListener("change", toggleTeamFieldByRole);
        els.userForm.addEventListener("submit", saveUser);
        els.teamForm.addEventListener("submit", createTeam);
        els.importBtn.addEventListener("click", triggerImport);

        // Sélection du fichier CSV
        els.csvInput.addEventListener("change", async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) {
                state.importRows = null;
                els.selectedFileName.textContent = "Aucun fichier sélectionné";
                return;
            }

            try {
                await readSelectedCsv(file);
            } catch (error) {
                state.importRows = null;
                els.selectedFileName.textContent = "Aucun fichier sélectionné";
                showFeedback(error.message || "CSV invalide.", "error");
            }
        });

        // Feedback visuel du drag-and-drop
        els.uploadZone.addEventListener("dragover", (event) => {
            event.preventDefault();
            els.uploadZone.classList.add("is-dragover");
        });
        els.uploadZone.addEventListener("dragleave", () => {
            els.uploadZone.classList.remove("is-dragover");
        });
        // Gestion du drag-and-drop de fichiers CSV
        els.uploadZone.addEventListener("drop", async (event) => {
            event.preventDefault();
            els.uploadZone.classList.remove("is-dragover");

            const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith(".csv")) {
                showFeedback("Le fichier doit être au format .csv", "error");
                return;
            }

            try {
                await readSelectedCsv(file);
            } catch (error) {
                state.importRows = null;
                els.selectedFileName.textContent = "Aucun fichier sélectionné";
                showFeedback(error.message || "CSV invalide.", "error");
            }
        });

        // Gestion du tableau et des modales
        els.tableBody.addEventListener("click", onTableClick);
        bindModalCloseButtons();
    }

    // Initialisation de l'application
    async function init() {
        try {
            bindEvents();
            await Promise.all([loadTeams(), loadUsers()]);
        } catch (error) {
            showFeedback(error.message || "Impossible de charger les données.", "error");
        }
    }

    // Lance l'initialisation au chargement de la page
    document.addEventListener("DOMContentLoaded", init);
})();
