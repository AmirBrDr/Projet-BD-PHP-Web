(() => {
    const token = localStorage.getItem("gp_token") || "";
    const askPrompt = (message, defaultValue = "", options = {}) => {
        if (typeof window.gpPrompt === "function") {
            return window.gpPrompt(message, defaultValue, options);
        }

        if (window.GPDialog && typeof window.GPDialog.prompt === "function") {
            return window.GPDialog.prompt({ message, defaultValue, ...options });
        }

        throw new Error("Modal de saisie indisponible.");
    };

    const state = {
        challenges: [],
    };

    const elements = {
        pageAlert: document.getElementById("page-alert"),
        replyStatusFilter: document.getElementById("reply-status-filter"),
        replyChallengeFilter: document.getElementById("reply-challenge-filter"),
        replyList: document.getElementById("reply-list"),
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

    /**
     * Exécute une requête vers l'API d'animation.
     * @param {string} action - L'action (ex: 'challenges', 'replies', 'reply_decision')
     * @param {Object} options - Les options additionnelles
     * @returns {Promise<any>} Le JSON parsé de la réponse
     */
    async function apiRequest(action, options = {}) {
        const params = new URLSearchParams({ action, ...(options.params || {}) });
        const url = `/api/modules/animator/?${params.toString()}`;

        const requestOptions = {
            method: options.method || "GET",
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

    function statusLabel(status) {
        const map = {
            pending: "En attente",
            approved: "Approuvee",
            rejected: "Refusee",
        };
        return map[status] || status || "-";
    }

    function formatDate(isoString) {
        if (!isoString) {
            return "";
        }

        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }

    function isImageProof(value) {
        const text = String(value || "").trim();
        return /^\/image\//.test(text) || /\.(png|jpe?g|webp)$/i.test(text);
    }

    /**
     * Génère le markup HTML pour afficher la preuve (image ou texte simple).
     * @param {string} value - La chaîne de texte de la preuve (ou de l'URL de l'image)
     * @returns {string} Le code HTML formaté
     */
    function proofMarkup(value) {
        const text = String(value || "").trim();
        if (!text) {
            return "";
        }
        if (isImageProof(text)) {
            const safeSrc = escapeHtml(text);
            return `<div class="reply-proof"><img src="${safeSrc}" alt="Preuve" loading="lazy" /></div>`;
        }
        return `<p class="reply-text">${escapeHtml(text)}</p>`;
    }

    /**
     * Met à jour le menu déroulant de filtre avec la liste des défis récupérés de l'API.
     */
    function renderChallengeFilters() {
        if (!elements.replyChallengeFilter) {
            return;
        }

        const previousValue = elements.replyChallengeFilter.value;
        elements.replyChallengeFilter.innerHTML = '<option value="all">Tous les defis</option>';

        state.challenges.forEach((challenge) => {
            const option = document.createElement("option");
            option.value = String(challenge.id_defi);
            option.textContent = `${challenge.nomdefi} (${challenge.nomtheme || "Sans theme"})`;
            elements.replyChallengeFilter.appendChild(option);
        });

        if (previousValue) {
            elements.replyChallengeFilter.value = previousValue;
        }
    }

    /**
     * Charge la liste complète des défis depuis l'API et met à jour les filtres.
     * @returns {Promise<void>}
     */
    async function loadChallenges() {
        const response = await apiRequest("challenges");
        state.challenges = response?.data || [];
        renderChallengeFilters();
    }

    /**
     * Charge les réponses à modérer en appliquant les filtres sélectionnés (statut, défi).
     * Met à jour l'affichage de la liste des réponses.
     * @returns {Promise<void>}
     */
    async function loadReplies() {
        const status = elements.replyStatusFilter?.value || "all";
        const challengeFilter = elements.replyChallengeFilter?.value || "all";
        const params = { status };

        if (challengeFilter !== "all") {
            params.challenge_id = challengeFilter;
        }

        const response = await apiRequest("replies", { params });
        const replies = response?.data || [];

        if (!elements.replyList) {
            return;
        }

        if (!replies.length) {
            elements.replyList.innerHTML = '<div class="empty-state">Aucune reponse pour ce filtre.</div>';
            return;
        }

        elements.replyList.innerHTML = replies
            .map((reply) => {
                const employeeName = `${reply.prenomuser || ""} ${reply.nomuser || ""}`.trim() || "Employe";
                const statusClass = `status-${reply.statut_reponse}`;
                const actionChip = reply.nomaction
                    ? `<span class="chip">Action: ${escapeHtml(reply.nomaction)}</span>`
                    : "";
                const decisionButtons =
                    reply.statut_reponse === "pending"
                        ? `
                            <button class="small-btn approve" type="button" data-action="approve" data-id="${reply.id_reponse}">Approuver</button>
                            <button class="small-btn reject" type="button" data-action="reject" data-id="${reply.id_reponse}">Refuser</button>
                        `
                        : "";
                const proof = proofMarkup(reply.reponse_text);

                return `
                    <article class="reply-card">
                        <h3>${escapeHtml(reply.nomdefi || "Defi")}</h3>
                        <div class="reply-meta">
                            <span class="chip">Employe: ${escapeHtml(employeeName)}</span>
                            ${actionChip}
                            <span class="chip ${statusClass}">${escapeHtml(statusLabel(reply.statut_reponse))}</span>
                            <span class="chip">Envoye: ${escapeHtml(formatDate(reply.date_reponse))}</span>
                        </div>
                        ${proof}
                        ${reply.commentaire_animateur ? `<p class="comment-box">Commentaire animateur: ${escapeHtml(reply.commentaire_animateur)}</p>` : ""}
                        <div class="card-actions">
                            ${decisionButtons}
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    /**
     * Traite la décision de l'animateur (approbation ou refus) pour une réponse spécifique, 
     * en incluant une demande de commentaire avec une boîte de dialogue modale.
     * @param {number} replyId - L'ID de la réponse
     * @param {string} decision - 'approve' ou 'reject'
     * @returns {Promise<void>}
     */
    async function decideReply(replyId, decision) {
        const isReject = decision === "reject";
        const defaultComment = decision === "approve" ? "Validation acceptee." : "";
        const commentaire = await askPrompt(
            isReject
                ? "Commentaire animateur (obligatoire pour un refus):"
                : "Commentaire animateur (optionnel):",
            defaultComment,
            {
                title: decision === "approve" ? "Approuver la reponse" : "Refuser la reponse",
                confirmText: decision === "approve" ? "Approuver" : "Refuser",
                cancelText: "Annuler",
                placeholder: isReject
                    ? "Expliquez la raison du refus (obligatoire)"
                    : "Ajoutez un commentaire pour l'employe (optionnel)",
                inputLabel: "Commentaire animateur",
                tone: decision === "approve" ? "success" : "danger",
            });
        if (commentaire === null) {
            return;
        }

        const commentaireNettoye = commentaire.trim();
        if (isReject && commentaireNettoye === "") {
            setPageAlert("Un commentaire est obligatoire pour refuser une reponse.");
            return;
        }

        await apiRequest("reply_decision", {
            method: "POST",
            params: { id: String(replyId) },
            body: {
                decision,
                commentaire: commentaireNettoye,
            },
        });

        await Promise.all([loadChallenges(), loadReplies()]);
    }

    /**
     * Gère les clics sur les boutons d'action (Approuver, Refuser) dans la liste des réponses.
     * @param {Event} event - L'événement de clic
     */
    async function handleReplyListClick(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const action = target.dataset.action;
        const replyId = Number(target.dataset.id || 0);
        if (!action || replyId <= 0) {
            return;
        }

        try {
            if (action === "approve") {
                await decideReply(replyId, "approve");
            } else if (action === "reject") {
                await decideReply(replyId, "reject");
            }
            setPageAlert("");
        } catch (error) {
            setPageAlert(error?.message || "Decision impossible.");
        }
    }

    async function init() {
        if (!token) {
            setPageAlert("Session invalide. Merci de vous reconnecter.");
            return;
        }

        elements.replyList?.addEventListener("click", handleReplyListClick);
        elements.replyStatusFilter?.addEventListener("change", () => {
            loadReplies().catch((error) => setPageAlert(error?.message || "Chargement impossible."));
        });
        elements.replyChallengeFilter?.addEventListener("change", () => {
            loadReplies().catch((error) => setPageAlert(error?.message || "Chargement impossible."));
        });

        try {
            await loadChallenges();
            await loadReplies();
            setPageAlert("");
        } catch (error) {
            setPageAlert(error?.message || "Chargement initial impossible.");
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
