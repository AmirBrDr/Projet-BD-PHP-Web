// Fichier: public/assets/js/dashboardRH.js - Logique frontend et interactions.

(() => {
    const API_BASE = "/api";

    async function apiGet(path) {
        const res = await fetch(`${API_BASE}${path}`);
        return await res.json();
    }

    async function getDashboardData() {
        return await apiGet("/modules/admin/dashboardRH.php");
    }

    function exportCSV(data, co2ParCategorie, engagementParDept) {
        const rows = [];

        rows.push(["=== KPIs GLOBAUX ==="]);
        rows.push(["Métrique", "Valeur"]);
        rows.push(["CO2 Total Évité (kg)", data.co2Tot]);
        rows.push(["Taux de Participation", data.tauxParticipation]);
        rows.push(["Actions Validées", data.actionsValides]);

        rows.push([]);

        rows.push(["=== RÉPARTITION DES RÉDUCTIONS CO2 ==="]);
        rows.push(["Catégorie", "CO2 (kg)", "Pourcentage"]);
        co2ParCategorie.forEach((item) => {
            rows.push([item.categorie, item.co2, item.pourcentage + "%"]);
        });

        rows.push([]);

        rows.push(["=== TAUX D'ENGAGEMENT PAR DÉPARTEMENT ==="]);
        rows.push(["Département", "Taux d'engagement (%)"]);
        engagementParDept.forEach((item) => {
            rows.push([item.departement, item.taux]);
        });

        const csvContent = rows.map((r) => r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "dashboard-rh.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    window.exportCSV = exportCSV;

    function renderCharts(co2ParCategorie, engagementParDept) {
        if (typeof window.Chart !== "function") {
            console.warn("Chart.js n'est pas disponible (CSP ou chargement script)");
            return;
        }

        const co2Canvas = document.getElementById("co2Chart");
        const engagementCanvas = document.getElementById("engagementChart");

        if (co2Canvas) {
            const ctxCo2 = co2Canvas.getContext("2d");
            new Chart(ctxCo2, {
                type: "doughnut",
                data: {
                    labels: co2ParCategorie.map((item) => `${item.categorie} (${item.pourcentage}%)`),
                    datasets: [{
                        data: co2ParCategorie.map((item) => item.co2),
                        backgroundColor: ["#94BB39", "#2A997F", "#298E77", "#1B2D31"],
                        borderColor: "#1B2D31",
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "right", labels: { color: "#ffffff", font: { size: 13 } } }
                    }
                }
            });
        }

        if (engagementCanvas) {
            const ctxEngagement = engagementCanvas.getContext("2d");
            new Chart(ctxEngagement, {
                type: "bar",
                data: {
                    labels: engagementParDept.map((item) => item.departement),
                    datasets: [{
                        label: "Taux de participation (%)",
                        data: engagementParDept.map((item) => item.engagementParDept),
                        backgroundColor: "rgba(148, 187, 57, 0.8)",
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: "rgba(255,255,255,0.1)" },
                            ticks: { color: "#a0b1b5" }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: "#a0b1b5" }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    function bindActions() {
        const pdfBtn = document.getElementById("btn-export-pdf");
        if (pdfBtn) {
            pdfBtn.addEventListener("click", () => {
                alert("Génération du rapport PDF en cours...");
            });
        }

        const csvBtn = document.getElementById("btn-export-csv");
        if (csvBtn) {
            csvBtn.addEventListener("click", () => {
                exportCSV(window.dashboardData, window.co2ParCategorie, window.engagementParDept);
            });
        }
    }

    document.addEventListener("DOMContentLoaded", async function() {
        console.log("dashboardRH page loaded");

        const data = await getDashboardData();
        const co2Tot = data?.co2Tot ?? 0;
        const tauxParticipation = data?.tauxParticipation ?? "0%";
        const actionsValides = data?.actionsValides ?? 0;

        const co2ParCategorie = Array.isArray(data?.engagementParDept)
            ? data.co2ParCategorie.map(d => ({
            categorie: d.categorie,
            co2: Number(d.co2), 
            pourcentage: Number(d.pourcentage)
         }))
        : [];

        const engagementParDept = Array.isArray(data?.engagementParDept)
            ? data.engagementParDept.map(d => ({
            departement: d.departement,
            engagementParDept: Number(d.engagementpardept)
         }))
        : [];

        window.dashboardData = { co2Tot, tauxParticipation, actionsValides };
        window.co2ParCategorie = co2ParCategorie;
        window.engagementParDept = engagementParDept;

        const co2El = document.getElementById("co2");
        const participationEl = document.getElementById("participation");
        const actionsEl = document.getElementById("actions");

        if (co2El) co2El.textContent = co2Tot;
        if (participationEl) participationEl.textContent = tauxParticipation;
        if (actionsEl) actionsEl.textContent = actionsValides;

        renderCharts(co2ParCategorie, engagementParDept);
        bindActions();
    });
})();
