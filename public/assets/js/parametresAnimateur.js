(() => {
    const token = localStorage.getItem("gp_token") || "";

    const kpiDefisEl = document.getElementById("kpi-defis");
    const kpiThemesEl = document.getElementById("kpi-themes");
    const kpiPendingEl = document.getElementById("kpi-pending");
    const pendingPreviewEl = document.getElementById("pending-preview");
    const dashboardAlertEl = document.getElementById("dashboard-alert");

    function setAlert(message, type) {
        if (!dashboardAlertEl) {
            return;
        }

        dashboardAlertEl.textContent = message || "";
        dashboardAlertEl.classList.toggle("error", type === "error");
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }

    async function apiGet(action, params = {}) {
        const searchParams = new URLSearchParams({ action, ...params });
        const response = await fetch(`/api/modules/animator/?${searchParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

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

    function renderPendingPreview(items) {
        if (!pendingPreviewEl) {
            return;
        }

        if (!items || items.length === 0) {
            pendingPreviewEl.innerHTML = '<div class="pending-empty">Aucune reponse en attente.</div>';
            return;
        }

        pendingPreviewEl.innerHTML = items
            .map((item) => {
                const name = `${item.prenomuser || ""} ${item.nomuser || ""}`.trim() || "Employe";
                return `
                    <article class="pending-item">
                        <div class="pending-title">${escapeHtml(item.nomdefi || "Defi")}</div>
                        <div class="pending-meta">
                            ${escapeHtml(name)} · ${escapeHtml(formatDate(item.date_reponse))}
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    async function loadDashboard() {
        if (!token) {
            setAlert("Session invalide. Merci de vous reconnecter.", "error");
            return;
        }

        try {
            const [summaryRes, pendingRes] = await Promise.all([
                apiGet("dashboard_summary"),
                apiGet("replies", { status: "pending", limit: "5" }),
            ]);

            const kpis = summaryRes?.data?.kpis || {};
            const moderation = summaryRes?.data?.moderation || {};

            if (kpiDefisEl) {
                kpiDefisEl.textContent = String(kpis.total_defis ?? 0);
            }
            if (kpiThemesEl) {
                kpiThemesEl.textContent = String(kpis.total_thematiques ?? 0);
            }
            if (kpiPendingEl) {
                kpiPendingEl.textContent = String(moderation.pending_count ?? 0);
            }

            renderPendingPreview(pendingRes?.data || []);
            setAlert("", "");
        } catch (error) {
            renderPendingPreview([]);
            setAlert(error?.message || "Impossible de charger le dashboard animateur.", "error");
        }
    }

    document.addEventListener("DOMContentLoaded", loadDashboard);
})();
