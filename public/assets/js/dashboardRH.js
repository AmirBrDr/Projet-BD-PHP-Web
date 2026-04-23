// Fichier: public/assets/js/dashboardRH.js - Logique frontend et interactions.

(() => {
    const API_BASE = "/api";

    // Fonction générique pour appeler l'API
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

    document.addEventListener("DOMContentLoaded", async function() {
        console.log('dashboardRH page loaded');

        const co2Tot = await getCo2Tot();
        const tauxParticipation = await getTauxParticipation();
        const actionsValides = await getActionsValides();

        document.getElementById("co2").textContent = co2Tot;
        document.getElementById("participation").textContent = tauxParticipation;
        document.getElementById("actions").textContent = actionsValides;
    });

})(); // ← la fonction s'appelle elle-même ici