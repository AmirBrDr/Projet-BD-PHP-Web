(() => {
    const token = localStorage.getItem("gp_token") || "";

    const elements = {
        kpiTotalReplies: document.getElementById("kpi-total-replies"),
        kpiPendingReplies: document.getElementById("kpi-pending-replies"),
        kpiApprovedReplies: document.getElementById("kpi-approved-replies"),
        replyForm: document.getElementById("reply-form"),
        replyChallenge: document.getElementById("reply-challenge"),
        replyText: document.getElementById("reply-text"),
        replyFormAlert: document.getElementById("reply-form-alert"),
        approvedRepliesList: document.getElementById("approved-replies-list"),
        allRepliesList: document.getElementById("all-replies-list"),
        dashboardAlert: document.getElementById("dashboard-employee-alert"),
    };

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function setFormAlert(message, type) {
        if (!elements.replyFormAlert) {
            return;
        }

        if (!message) {
            elements.replyFormAlert.hidden = true;
            elements.replyFormAlert.className = "inline-alert";
            elements.replyFormAlert.textContent = "";
            return;
        }

        elements.replyFormAlert.hidden = false;
        elements.replyFormAlert.className = `inline-alert ${type || ""}`.trim();
        elements.replyFormAlert.textContent = message;
    }

    function setDashboardAlert(message) {
        if (!elements.dashboardAlert) {
            return;
        }

        if (!message) {
            elements.dashboardAlert.textContent = "";
            elements.dashboardAlert.classList.remove("error");
            return;
        }

        elements.dashboardAlert.textContent = message;
        elements.dashboardAlert.classList.add("error");
    }

    async function apiRequest(action, options = {}) {
        const params = new URLSearchParams({ action, ...(options.params || {}) });
        const url = `/api/modules/employee/?${params.toString()}`;
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
        const labels = {
            pending: "En attente",
            approved: "Approuvee",
            rejected: "Refusee",
        };
        return labels[status] || status || "-";
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

    function renderChallenges(challenges) {
        if (!elements.replyChallenge) {
            return;
        }

        elements.replyChallenge.innerHTML = "";

        if (!challenges || challenges.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Aucun defi disponible";
            elements.replyChallenge.appendChild(option);
            return;
        }

        challenges.forEach((challenge) => {
            const option = document.createElement("option");
            option.value = String(challenge.id_defi);
            option.textContent = `${challenge.nomdefi} - ${challenge.nomtheme || "Sans theme"}`;
            elements.replyChallenge.appendChild(option);
        });
    }

    function renderReplies(listElement, replies, emptyMessage) {
        if (!listElement) {
            return;
        }

        if (!replies || replies.length === 0) {
            listElement.innerHTML = `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
            return;
        }

        listElement.innerHTML = replies
            .map((reply) => {
                const statusClass = `status-${reply.statut_reponse || "pending"}`;
                return `
                    <article class="reply-card">
                        <h3>${escapeHtml(reply.nomdefi || "Defi")}</h3>
                        <div class="reply-meta">
                            <span class="chip">Theme: ${escapeHtml(reply.nomtheme || "-")}</span>
                            <span class="chip ${statusClass}">${escapeHtml(statusLabel(reply.statut_reponse))}</span>
                            <span class="chip">Date: ${escapeHtml(formatDate(reply.date_reponse))}</span>
                        </div>
                        <p class="reply-content">${escapeHtml(reply.reponse_text || "")}</p>
                        ${reply.commentaire_animateur ? `<p class="comment-content">Commentaire animateur: ${escapeHtml(reply.commentaire_animateur)}</p>` : ""}
                    </article>
                `;
            })
            .join("");
    }

    async function loadChallenges() {
        const response = await apiRequest("challenges");
        renderChallenges(response?.data || []);
    }

    async function loadRepliesAndSummary() {
        const [summaryRes, repliesRes] = await Promise.all([
            apiRequest("dashboard_summary"),
            apiRequest("my_replies"),
        ]);

        const summary = summaryRes?.data?.summary || {};
        const approvedFromSummary = summaryRes?.data?.approved || [];
        const allReplies = repliesRes?.data || [];

        if (elements.kpiTotalReplies) {
            elements.kpiTotalReplies.textContent = String(summary.total_replies ?? 0);
        }
        if (elements.kpiPendingReplies) {
            elements.kpiPendingReplies.textContent = String(summary.pending_count ?? 0);
        }
        if (elements.kpiApprovedReplies) {
            elements.kpiApprovedReplies.textContent = String(summary.approved_count ?? 0);
        }

        const approvedWithStatus = approvedFromSummary.map((item) => ({
            ...item,
            statut_reponse: "approved",
            nomtheme: item.nomtheme || "-",
        }));

        renderReplies(elements.approvedRepliesList, approvedWithStatus, "Aucune reponse approuvee pour le moment.");
        renderReplies(elements.allRepliesList, allReplies, "Aucune reponse envoyee.");
    }

    async function submitReply(event) {
        event.preventDefault();
        setFormAlert("", "");
        setDashboardAlert("");

        const idDefi = Number(elements.replyChallenge?.value || 0);
        const reponse = elements.replyText?.value?.trim() || "";

        if (idDefi <= 0) {
            setFormAlert("Selectionnez un defi.", "error");
            return;
        }
        if (!reponse) {
            setFormAlert("Votre reponse est obligatoire.", "error");
            return;
        }

        try {
            await apiRequest("reply_create", {
                method: "POST",
                body: {
                    idDefi,
                    reponse,
                },
            });

            if (elements.replyText) {
                elements.replyText.value = "";
            }

            setFormAlert("Reponse envoyee a l'animateur avec succes.", "success");
            await loadRepliesAndSummary();
        } catch (error) {
            setFormAlert(error?.message || "Envoi impossible.", "error");
        }
    }

    async function init() {
        if (!token) {
            setDashboardAlert("Session invalide. Merci de vous reconnecter.");
            return;
        }

        elements.replyForm?.addEventListener("submit", submitReply);

        try {
            await loadChallenges();
            await loadRepliesAndSummary();
            setDashboardAlert("");
        } catch (error) {
            setDashboardAlert(error?.message || "Impossible de charger le dashboard employe.");
        }
    }

    document.addEventListener("DOMContentLoaded", init);
})();
