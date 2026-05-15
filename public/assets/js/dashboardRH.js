// Fichier: public/assets/js/dashboardRH.js - Logique frontend et interactions.

(() => {
    const API_BASE = "/api";

    /**
     * Effectue une requête GET vers l'API.
     * @param {string} path - Le chemin de l'endpoint API
     * @returns {Promise<Object>} La réponse JSON de l'API
     */
    async function apiGet(path) {
        const res = await fetch(`${API_BASE}${path}`);
        return await res.json();
    }

    /**
     * Récupère les données du tableau de bord depuis l'API.
     * @returns {Promise<Object>} Les données du tableau de bord
     */
    async function getDashboardData() {
        return await apiGet("/modules/admin/dashboardRH.php");
    }

    /**
     * Exporte les données du tableau de bord au format CSV.
     * @param {Object} data - Données globales (CO2 total, participation, actions)
     * @param {Array} co2ParCategorie - Répartition du CO2 par catégorie
     * @param {Array} engagementParDept - Taux d'engagement par département
     */
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
            rows.push([item.departement, item.engagementParDept]);
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

    function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b]
        .map(x => x.toString(16).padStart(2, "0"))
        .join("");
}

// mélange avec blanc (éclaircir) ou noir (assombrir)
function mix(color, target, amount) {
    const c1 = hexToRgb(color);
    const c2 = hexToRgb(target);

    const r = Math.round(c1.r + (c2.r - c1.r) * amount);
    const g = Math.round(c1.g + (c2.g - c1.g) * amount);
    const b = Math.round(c1.b + (c2.b - c1.b) * amount);

    return rgbToHex(r, g, b);
}

function generateGroupedPalette(baseColors, count) {
    const colors = [];
    const variationsPerColor = Math.ceil(count / baseColors.length);

    for (let i = 0; i < variationsPerColor; i++) {
        for (let base of baseColors) {
            if (colors.length >= count) break;

            let color = base;

            if (i > 0) {
                const t = i / variationsPerColor;

                // 🔥 alterne clair / foncé autour de la couleur de base
                if (i % 2 === 0) {
                    color = mix(base, "#ffffff", t * 0.4); // éclaircir
                } else {
                    color = mix(base, "#000000", t * 0.3); // assombrir
                }
            }

            colors.push(color);
        }
    }

    return colors;
}

    /**
     * Génère et affiche les graphiques (Doughnut et Bar) en utilisant Chart.js.
     * @param {Array} co2ParCategorie - Données de CO2 par catégorie pour le graphique circulaire
     * @param {Array} engagementParDept - Données d'engagement par département pour le graphique en barres
     */
    function renderCharts(co2ParCategorie, engagementParDept) {
         const colors = generateGroupedPalette( ["#94BB39", "#2A997F", "#298E77"] ,co2ParCategorie.length);
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
                        backgroundColor: colors,
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

    // Fonction à appeler sur votre bouton "Rapport PDF"
    /**
     * Génère un rapport PDF à partir du contenu HTML de la page entière en utilisant html2canvas et jsPDF.
     * Gère la capture en plusieurs pages si nécessaire.
     */
    async function genererRapportPDF() {
        const { jsPDF } = window.jspdf;

        // L'élément à capturer (toute la page ou un div spécifique)
        const element = document.body; // ou document.getElementById('mon-contenu')

        // Capture d'écran de l'élément
        const canvas = await html2canvas(element, {
            scale: 2,           // Meilleure résolution
            useCORS: true,      // Pour les images externes
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();   // 297mm en landscape
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm en landscape

        const canvasRatio = canvas.height / canvas.width;
        const imgHeightInPdf = pdfWidth * canvasRatio; // hauteur réelle de l'image dans le PDF

        let positionY = 0;

        while (positionY < imgHeightInPdf) {
        pdf.addImage(imgData, 'PNG', 0, -positionY, pdfWidth, imgHeightInPdf);
        positionY += pdfHeight;
        if (positionY < imgHeightInPdf) pdf.addPage();
        }

        pdf.save('rapport.pdf');
    }
    
    /**
     * Attache les écouteurs d'événements pour les boutons d'export PDF et CSV.
     */
    function bindActions() {
        const pdfBtn = document.getElementById("btn-export-pdf");
        if (pdfBtn) {
            pdfBtn.addEventListener("click", () => {
                genererRapportPDF();
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
