// Fichier: public/assets/js/dashboardRH.js - Logique frontend et interactions.
// dashboardRH JavaScript
// TODO: Add functionality for dashboardRH

const API_BASE = "/api";

document.addEventListener('DOMContentLoaded', function() {
    console.log('dashboardRH page loaded');
});

async function getCo2Tot() {
    const response = await fetch(API_BASE + "/modules/admin/dashboardRSE.php");
    const data = await response.json();
    return data.co2Tot;
}

async function getTauxParticipation() {
    const response = await fetch(API_BASE + "/modules/admin/dashboardRSE.php");
    const data = await response.json();
    return data.tauxParticipation;
}

async function getActionsValides() {
    const response = await fetch(API_BASE + "/modules/admin/dashboardRSE.php");
    const data = await response.json();
    return data.actionsValides;
}
