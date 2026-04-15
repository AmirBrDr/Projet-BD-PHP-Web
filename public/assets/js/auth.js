// Fichier: public/assets/js/auth.js - Logique frontend et interactions.
(() => {
  const API_BASE = "/api";

  // Gestion des onglets et panneaux
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));

  // Bascule l'onglet actif et affiche le panneau associé
  function setTab(name) {
    tabs.forEach((t) => {
      const active = t.dataset.tab === name;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach((p) => {
      p.classList.toggle("is-active", p.dataset.panel === name);
    });
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => setTab(t.dataset.tab));
  });

  document.querySelectorAll("[data-switch]").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.switch));
  });

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const resetRequestForm = document.getElementById("resetRequestForm");
  // Éléments du DOM et expressions régulières de validation
  const loginAlert = document.getElementById("loginAlert");
  const registerAlert = document.getElementById("registerAlert");
  const resetAlert = document.getElementById("resetAlert");
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  const ALLOWED_ROLES = new Set(["employe", "admin", "animateur"]);

  // Affiche un message d'alerte avec le type spécifié
  function setAlert(el, msg, type) {
    if (!msg) {
      el.className = "alert";
      el.textContent = "";
      return;
    }
    el.className = "alert is-show" + (type ? ` is-${type}` : "");
    el.textContent = msg;
  }

  function setHint(inputId, msg) {
    const hint = document.querySelector(`[data-hint-for=\"${inputId}\"]`);
    if (!hint) return;
    hint.textContent = msg || "";
    hint.classList.toggle("is-error", Boolean(msg));
  }

  // Sauvegarde le token et les données utilisateur en localStorage
  function storeSession(data) {
    if (data && data.token) {
      localStorage.setItem("gp_token", data.token);
    }
    if (data && data.user) {
      localStorage.setItem("gp_user", JSON.stringify(data.user));
    }
  }

  // Redirige l'utilisateur vers sa page en fonction de son rôle
  function redirectByRole(role) {
    const routes = {
      employe: "/pages/dashboardE.html",
      admin: "/pages/gestionUtilisateurs.html",
      animateur: "/pages/parametresAnimateur.html",
    };

    const target = routes[(role || "").toLowerCase()];
    if (target) {
      window.location.assign(target);
    }
  }

  function openResetPanel(email) {
    setTab("reset");
    const resetEmail = document.getElementById("resetEmail");
    if (resetEmail && email) {
      resetEmail.value = email;
    }
  }

  function clearHints(form) {
    form.querySelectorAll(".hint").forEach((h) => {
      h.textContent = "";
      h.classList.remove("is-error");
    });
  }

  function normalizeSpaces(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  function getValue(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return "";
    return typeof el.value === "string" ? el.value : "";
  }

  // Retourne les règles de validation pour chaque champ
  function validators() {
    return {
      loginEmail: () => {
        const email = normalizeSpaces(getValue("loginEmail"));
        if (!email) return "Email requis";
        if (!EMAIL_REGEX.test(email)) return "Format d'email invalide";
        return "";
      },
      loginPassword: () => {
        const value = getValue("loginPassword");
        if (!value) return "Mot de passe requis";
        return "";
      },
      regFullName: () => {
        const value = normalizeSpaces(getValue("regFullName"));
        if (!value) return "Nom complet requis";
        if (value.length < 3) return "Minimum 3 caractères";
        if (!/^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]+$/.test(value)) return "Caractères non autorisés";
        return "";
      },
      regEmail: () => {
        const email = normalizeSpaces(getValue("regEmail"));
        if (!email) return "Email requis";
        if (!EMAIL_REGEX.test(email)) return "Format d'email invalide";
        return "";
      },
      regEntreprise: () => {
        const value = normalizeSpaces(getValue("regEntreprise"));
        if (!value) return "Entreprise requise";
        if (value.length < 2) return "Minimum 2 caractères";
        return "";
      },
      regRole: () => {
        const value = getValue("regRole").toLowerCase();
        if (!value) return "Rôle requis";
        if (!ALLOWED_ROLES.has(value)) return "Rôle invalide";
        return "";
      },
      regPassword: () => {
        const value = getValue("regPassword");
        if (!value) return "Mot de passe requis";
        if (!PASSWORD_REGEX.test(value)) {
          return "8+ caractères, 1 majuscule, 1 minuscule, 1 chiffre";
        }
        return "";
      },
      regPassword2: () => {
        const value = getValue("regPassword2");
        const password = getValue("regPassword");
        if (!value) return "Confirmation requise";
        if (value !== password) return "Les mots de passe ne correspondent pas";
        return "";
      },
      resetEmail: () => {
        const email = normalizeSpaces(getValue("resetEmail"));
        if (!email) return "Email requis";
        if (!EMAIL_REGEX.test(email)) return "Format d'email invalide";
        return "";
      },
    };
  }

  // Valide un champ individuel et affiche l'erreur si nécessaire
  function validateField(inputId) {
    const rule = validators()[inputId];
    if (!rule) return true;
    const message = rule();
    setHint(inputId, message);
    return message === "";
  }

  // Valide plusieurs champs à la fois
  function validateFields(inputIds) {
    let valid = true;
    inputIds.forEach((inputId) => {
      if (!validateField(inputId)) {
        valid = false;
      }
    });
    return valid;
  }

  // Attache les événements de validation aux champs spécifiés
  function bindFieldValidation(inputIds) {
    inputIds.forEach((inputId) => {
      const el = document.getElementById(inputId);
      if (!el) return;
      el.addEventListener("blur", () => validateField(inputId));
      el.addEventListener("input", () => {
        const hint = document.querySelector(`[data-hint-for=\"${inputId}\"]`);
        if (hint && hint.classList.contains("is-error")) {
          validateField(inputId);
        }
      });
    });
  }

  // Effectue une requête POST vers l'API avec gestion des erreurs
  async function apiPost(path, payload) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  // Initialisation: liaison des validations aux champs
  bindFieldValidation(["loginEmail", "loginPassword"]);
  bindFieldValidation([
    "regFullName",
    "regEmail",
    "regEntreprise",
    "regRole",
    "regPassword",
    "regPassword2",
  ]);
  bindFieldValidation(["resetEmail"]);

  // Gestion du formulaire de connexion
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearHints(loginForm);
    setAlert(loginAlert, "", "");

    const email = normalizeSpaces(document.getElementById("loginEmail").value);
    const mdp = document.getElementById("loginPassword").value;

    if (!validateFields(["loginEmail", "loginPassword"])) return;

    try {
      const data = await apiPost("/auth/login.php", { email, mdp });
      storeSession(data);
      setAlert(loginAlert, "Connexion réussie.", "success");
      redirectByRole(data?.user?.role);
    } catch (err) {
      setAlert(loginAlert, err?.message || "Connexion impossible.", "error");
    }
  });

  // Gestion du formulaire d'inscription
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearHints(registerForm);
    setAlert(registerAlert, "", "");

    const fullName = normalizeSpaces(document.getElementById("regFullName").value);
    const email = normalizeSpaces(document.getElementById("regEmail").value);
    const entreprise = normalizeSpaces(document.getElementById("regEntreprise").value);
    const role = document.getElementById("regRole").value;
    const mdp = document.getElementById("regPassword").value;

    if (!validateFields(["regFullName", "regEmail", "regEntreprise", "regRole", "regPassword", "regPassword2"])) return;

    const parts = fullName.split(/\s+/).filter(Boolean);
    const prenomUser = parts.shift() || "";
    const nomUser = parts.join(" ") || prenomUser;

    try {
      const data = await apiPost("/auth/register.php", {
        nomUser,
        prenomUser,
        email,
        statutUser: "actif",
        mdp,
        inscriptionUser: new Date().toISOString(),
        pdpUser: null,
        nomEntreprise: entreprise,
        role,
      });

      storeSession(data);
      setAlert(registerAlert, "Inscription réussie.", "success");
      setTab("login");
    } catch (err) {
      setAlert(registerAlert, err?.message || "Inscription impossible.", "error");
    }
  });

  // Gestion du formulaire de demande de réinitialisation
  resetRequestForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearHints(resetRequestForm);
    setAlert(resetAlert, "", "");

    const email = normalizeSpaces(document.getElementById("resetEmail").value);
    if (!validateFields(["resetEmail"])) return;

    try {
      const data = await apiPost("/auth/forgot-password.php", { email });
      setAlert(resetAlert, data?.message || "Un email a été envoyé.", "success");
    } catch (err) {
      setAlert(resetAlert, err?.message || "Impossible d'envoyer le lien.", "error");
    }
  });

  // Lien "Mot de passe oublié" - ouvre le panneau de réinitialisation
  const forgotLink = document.getElementById("forgotLink");
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    openResetPanel(document.getElementById("loginEmail").value.trim());
  });
})();
