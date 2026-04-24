// Fichier: public/assets/js/dashboardRH.js - Logique frontend et interactions.

(() => {
    const API_BASE = "/api";
    

    async function apiGet(path) {  
        const res = await fetch(`${API_BASE}${path}`); 
        return await res.json(); 
    }

    async function getCo2Tot() {
        const data = await apiGet("/modules/admin/dashboardRH.php");
        return data.co2Tot;
    }

    async function getTauxParticipation() {
        const data = await apiGet("/modules/admin/dashboardRH.php");
        return data.tauxParticipation;
    }

    async function getActionsValides() {
        const data = await apiGet("/modules/admin/dashboardRH.php");
        return data.actionsValides;
    }


function exportCSV(data, co2ParCategorie, engagementParDept) {
    const rows = [];

    // Section KPIs globaux
    rows.push(["=== KPIs GLOBAUX ==="]);
    rows.push(["Métrique", "Valeur"]);
    rows.push(["CO2 Total Évité (kg)", data.co2Tot]);
    rows.push(["Taux de Participation", data.tauxParticipation]);
    rows.push(["Actions Validées", data.actionsValides]);

    rows.push([]); // ligne vide

    // Section répartition CO2 par catégorie
    rows.push(["=== RÉPARTITION DES RÉDUCTIONS CO2 ==="]);
    rows.push(["Catégorie", "CO2 (kg)", "Pourcentage"]);
    co2ParCategorie.forEach(item => {
        rows.push([item.categorie, item.co2, item.pourcentage + "%"]);
    });

    rows.push([]);

    // Section taux d'engagement par département
    rows.push(["=== TAUX D'ENGAGEMENT PAR DÉPARTEMENT ==="]);
    rows.push(["Département", "Taux d'engagement (%)"]);
    engagementParDept.forEach(item => {
        rows.push([item.departement, item.taux]);
    });

    // Génération du fichier
    const csvContent = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // \uFEFF = BOM pour Excel
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "dashboard-rh.csv";
    a.click();
    URL.revokeObjectURL(url);
}

// Exposer la fonction globalement
window.exportCSV = exportCSV;

document.addEventListener("DOMContentLoaded", async function() {
    console.log('dashboardRH page loaded');

    const co2Tot = await getCo2Tot();
    const tauxParticipation = await getTauxParticipation();
    const actionsValides = await getActionsValides();

    const co2ParCategorie = [
        { categorie: "Mobilité",     co2: 3.3, pourcentage: 55 },
        { categorie: "Énergie",      co2: 1.5, pourcentage: 25 },
        { categorie: "Déchets",      co2: 0.9, pourcentage: 15 },
        { categorie: "Alimentation", co2: 0.3, pourcentage: 5  },
    ];

    const engagementParDept = [
        { departement: "IT",         taux: 92 },
        { departement: "Marketing",  taux: 85 },
        { departement: "RH",         taux: 78 },
        { departement: "Compta",     taux: 65 },
        { departement: "Logistique", taux: 55 },
    ];

    // Rendre les variables accessibles globalement pour le bouton HTML
    window.dashboardData       = { co2Tot, tauxParticipation, actionsValides };
    window.co2ParCategorie     = co2ParCategorie;
    window.engagementParDept   = engagementParDept;

    document.getElementById("co2").textContent          = co2Tot;
    document.getElementById("participation").textContent = tauxParticipation;
    document.getElementById("actions").textContent       = actionsValides;
});

})(); // ← la fonction s'appelle elle-même ici