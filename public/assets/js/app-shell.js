// Fichier: public/assets/js/app-shell.js - Logique frontend et interactions.
(() => {
  const token = localStorage.getItem("gp_token");
  const rawUser = localStorage.getItem("gp_user");
  let user = null;

  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch (error) {
      user = null;
    }
  }
  const requiredRole = (document.body.dataset.requiredRole || "").toLowerCase();

  if (!token || !user) {
    window.location.replace("/auth.html");
    return;
  }

  if (requiredRole && (user.role || "").toLowerCase() !== requiredRole) {
    const roleRoutes = {
      employe: "/pages/dashboardE.html",
      admin: "/pages/gestionUtilisateurs.html",
      animateur: "/pages/parametresAnimateur.html",
    };

    window.location.replace(roleRoutes[(user.role || "").toLowerCase()] || "/auth.html");
    return;
  }

  document.querySelectorAll("[data-user-name]").forEach((el) => {
    el.textContent = `${user.prenomUser || ""} ${user.nomUser || ""}`.trim() || "Utilisateur";
  });

  document.querySelectorAll("[data-user-email]").forEach((el) => {
    el.textContent = user.email || "";
  });

  document.querySelectorAll("[data-user-role]").forEach((el) => {
    el.textContent = (user.role || requiredRole || "").toUpperCase();
  });

  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem("gp_token");
      localStorage.removeItem("gp_user");
      window.location.replace("/auth.html");
    });
  });

  const dateTarget = document.querySelector("[data-today]");
  if (dateTarget) {
    dateTarget.textContent = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }
})();
