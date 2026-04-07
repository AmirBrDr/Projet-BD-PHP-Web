(() => {
  const API_BASE = "/api";

  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".panel"));

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
  const loginAlert = document.getElementById("loginAlert");
  const registerAlert = document.getElementById("registerAlert");

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

  function clearHints(form) {
    form.querySelectorAll(".hint").forEach((h) => {
      h.textContent = "";
      h.classList.remove("is-error");
    });
  }

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

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearHints(loginForm);
    setAlert(loginAlert, "", "");

    const email = document.getElementById("loginEmail").value.trim();
    const mdp = document.getElementById("loginPassword").value;

    let hasError = false;
    if (!email) {
      setHint("loginEmail", "Email requis");
      hasError = true;
    }
    if (!mdp) {
      setHint("loginPassword", "Mot de passe requis");
      hasError = true;
    }
    if (hasError) return;

    try {
      const data = await apiPost("/auth/login.php", { email, mdp });
      if (data && data.token) {
        localStorage.setItem("gp_token", data.token);
      }
      setAlert(loginAlert, "Connexion réussie.", "success");
    } catch (err) {
      setAlert(loginAlert, err?.message || "Connexion impossible.", "error");
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearHints(registerForm);
    setAlert(registerAlert, "", "");

    const fullName = document.getElementById("regFullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const entreprise = document.getElementById("regEntreprise").value.trim();
    const mdp = document.getElementById("regPassword").value;
    const mdp2 = document.getElementById("regPassword2").value;

    let hasError = false;
    if (!fullName) {
      setHint("regFullName", "Nom complet requis");
      hasError = true;
    }
    if (!email) {
      setHint("regEmail", "Email requis");
      hasError = true;
    }
    if (!entreprise) {
      setHint("regEntreprise", "Entreprise requise");
      hasError = true;
    }
    if (!mdp) {
      setHint("regPassword", "Mot de passe requis");
      hasError = true;
    }
    if (mdp && mdp.length < 6) {
      setHint("regPassword", "Minimum 6 caractères");
      hasError = true;
    }
    if (mdp !== mdp2) {
      setHint("regPassword2", "Les mots de passe ne correspondent pas");
      hasError = true;
    }
    if (hasError) return;

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
      });

      if (data && data.token) {
        localStorage.setItem("gp_token", data.token);
      }
      setAlert(registerAlert, "Inscription réussie.", "success");
      setTab("login");
    } catch (err) {
      setAlert(registerAlert, err?.message || "Inscription impossible.", "error");
    }
  });

  const forgotLink = document.getElementById("forgotLink");
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    setAlert(loginAlert, "Fonctionnalité non disponible pour le moment.", "error");
  });
})();
