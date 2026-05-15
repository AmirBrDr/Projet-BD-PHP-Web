// Fichier: public/assets/js/reset-password.js - Logique frontend et interactions.
(() => {
  const API_BASE = "/api";
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";
  const form = document.getElementById("newPasswordForm");
  const alertEl = document.getElementById("newPasswordAlert");

  /**
   * Affiche un message d'alerte contextualise.
   * @param {string} msg
   * @param {string} type
   */
  function setAlert(msg, type) {
    if (!msg) {
      alertEl.className = "alert";
      alertEl.textContent = "";
      return;
    }
    alertEl.className = "alert is-show" + (type ? ` is-${type}` : "");
    alertEl.textContent = msg;
  }

  /**
   * Affiche une aide de validation sous un champ.
   * @param {string} inputId
   * @param {string} msg
   */
  function setHint(inputId, msg) {
    const hint = document.querySelector(`[data-hint-for="${inputId}"]`);
    if (!hint) return;
    hint.textContent = msg || "";
    hint.classList.toggle("is-error", Boolean(msg));
  }

  /**
   * Envoie une requete POST vers l'API.
   * @param {string} path
   * @param {object} payload
   * @returns {Promise<any>}
   */
  async function apiPost(path, payload) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      const message = typeof data === "object" && data && data.message ? data.message : "Erreur";
      throw new Error(message);
    }

    return data;
  }

  // Token requis dans l'URL pour securiser la reinitialisation
  if (!token) {
    setAlert("Lien de réinitialisation manquant ou invalide.", "error");
    form.querySelectorAll("input, button").forEach((el) => {
      el.disabled = true;
    });
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert("", "");
    setHint("newPassword", "");
    setHint("newPassword2", "");

    const password = document.getElementById("newPassword").value;
    const password2 = document.getElementById("newPassword2").value;

    if (!password) {
      setHint("newPassword", "Mot de passe requis");
      return;
    }
    if (password.length < 6) {
      setHint("newPassword", "Minimum 6 caractères");
      return;
    }
    if (password !== password2) {
      setHint("newPassword2", "Les mots de passe ne correspondent pas");
      return;
    }

    try {
      // Appel API: /auth/reset-password.php
      const data = await apiPost("/auth/reset-password.php", { token, password });
      setAlert(data?.message || "Mot de passe mis à jour.", "success");
      setTimeout(() => window.location.replace("/auth.html"), 1500);
    } catch (err) {
      setAlert(err?.message || "Réinitialisation impossible.", "error");
    }
  });
})();