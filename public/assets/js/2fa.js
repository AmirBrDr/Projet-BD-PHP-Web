// Fichier: public/assets/js/2fa.js - Logique frontend 2FA.
(() => {
    const section = document.getElementById("twoFactorSection");
    if (!section) return;

    const statusEl = document.getElementById("twoFactorStatus");
    const btnToggle = document.getElementById("btnToggle2FA");
    const otpForm = document.getElementById("twoFactorOtpForm");
    const otpInput = document.getElementById("twoFactorOtpInput");
    const btnConfirm = document.getElementById("btnConfirm2FA");
    const btnCancel = document.getElementById("btnCancel2FA");
    const feedback = document.getElementById("twoFactorFeedback");

    let isEnabled = false;

    /**
     * Recupere l'etat 2FA depuis l'API securisee.
     * @returns {Promise<void>}
     */
    async function fetchStatus() {
        try {
            const token = localStorage.getItem("gp_token");
            if (!token) return;

            const res = await fetch("/api/modules/profile/2fa.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ action: "status" })
            });

            if (!res.ok) throw new Error("Erreur de récupération");
            const data = await res.json();
            isEnabled = data.two_factor_enabled;
            updateUI();
        } catch (err) {
            statusEl.textContent = "Erreur de chargement";
        }
    }

    /**
     * Met a jour l'interface selon l'etat 2FA.
     */
    function updateUI() {
        statusEl.textContent = "Statut : " + (isEnabled ? "Activé" : "Désactivé");
        statusEl.style.color = isEnabled ? "var(--gp-success, #2bd47c)" : "inherit";
        btnToggle.textContent = isEnabled ? "Désactiver" : "Activer";
        btnToggle.style.display = "";
        otpForm.style.display = "none";
        otpInput.value = "";
        feedback.textContent = "";
    }

    btnToggle.addEventListener("click", async () => {
        const token = localStorage.getItem("gp_token");
        if (!token) return;
        feedback.textContent = "";

        if (isEnabled) {
            // Disable
            if (!confirm("Voulez-vous vraiment désactiver la 2FA ?")) return;
            try {
            // Appel API: desactivation 2FA
                const res = await fetch("/api/modules/profile/2fa.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ action: "disable" })
                });
                if (!res.ok) throw new Error("Erreur serveur");
                isEnabled = false;
                updateUI();
                feedback.textContent = "2FA désactivée avec succès.";
                feedback.style.color = "var(--gp-success, #2bd47c)";
            } catch (err) {
                feedback.textContent = "Erreur lors de la désactivation.";
                feedback.style.color = "var(--gp-error, #ff4c4c)";
            }
        } else {
            // Enable flow
            btnToggle.disabled = true;
            try {
            // Appel API: demande d'OTP par email
                const res = await fetch("/api/modules/profile/2fa.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ action: "request-enable" })
                });
                
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Erreur serveur");
                
                btnToggle.style.display = "none";
                otpForm.style.display = "block";
                feedback.textContent = "Un code a été envoyé à votre email.";
                feedback.style.color = "var(--gp-text, #fff)";
            } catch (err) {
                feedback.textContent = err.message || "Erreur d'activation.";
                feedback.style.color = "var(--gp-error, #ff4c4c)";
            } finally {
                btnToggle.disabled = false;
            }
        }
    });

    btnCancel.addEventListener("click", () => {
        updateUI();
    });

    btnConfirm.addEventListener("click", async () => {
        const otp = otpInput.value.trim();
        if (!otp) {
            feedback.textContent = "Veuillez entrer le code.";
            feedback.style.color = "var(--gp-error, #ff4c4c)";
            return;
        }

        const token = localStorage.getItem("gp_token");
        btnConfirm.disabled = true;
        try {
            // Appel API: confirmation d'activation 2FA
            const res = await fetch("/api/modules/profile/2fa.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ action: "confirm-enable", otp })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Code invalide.");
            
            isEnabled = true;
            updateUI();
            feedback.textContent = "2FA activée avec succès.";
            feedback.style.color = "var(--gp-success, #2bd47c)";
        } catch (err) {
            feedback.textContent = err.message || "Erreur lors de la confirmation.";
            feedback.style.color = "var(--gp-error, #ff4c4c)";
        } finally {
            btnConfirm.disabled = false;
        }
    });

    fetchStatus();
})();
