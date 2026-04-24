// Fichier: public/assets/js/app-shell.js - Logique frontend et interactions.
(() => {
  const dialogState = {
    active: null,
    refs: null,
  };

  function ensureDialogStyles() {
    if (document.getElementById("gp-dialog-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "gp-dialog-styles";
    style.textContent = `
      .gp-dialog-overlay {
        position: fixed;
        inset: 0;
        z-index: 5000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: rgba(7, 9, 18, 0.58);
      }

      .gp-dialog-overlay[hidden] {
        display: none;
      }

      .gp-dialog-card {
        width: min(540px, 100%);
        border: 1px solid rgba(244, 166, 144, 0.45);
        border-radius: 18px;
        background: radial-gradient(circle at top left, #3d1f24 0%, #1e1418 60%, #120f12 100%);
        color: #fff1ea;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
        padding: 1.25rem;
      }

      .gp-dialog-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
      }

      .gp-dialog-message {
        margin: 0.75rem 0 0;
        line-height: 1.5;
        color: rgba(255, 241, 234, 0.92);
      }

      .gp-dialog-input-wrap {
        margin-top: 0.95rem;
      }

      .gp-dialog-input {
        width: 100%;
        min-height: 88px;
        resize: vertical;
        border-radius: 12px;
        border: 1px solid rgba(244, 166, 144, 0.4);
        background: rgba(11, 11, 16, 0.45);
        color: #fff1ea;
        padding: 0.7rem 0.78rem;
        font: inherit;
      }

      .gp-dialog-input:focus-visible {
        outline: 2px solid #f1a393;
        outline-offset: 2px;
      }

      .gp-dialog-actions {
        margin-top: 1rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      .gp-dialog-btn {
        min-width: 112px;
        border-radius: 999px;
        padding: 0.6rem 1rem;
        border: 1px solid transparent;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.14s ease, filter 0.14s ease;
      }

      .gp-dialog-btn:focus-visible {
        outline: 2px solid #f8d9cf;
        outline-offset: 2px;
      }

      .gp-dialog-btn:hover {
        transform: translateY(-1px);
        filter: brightness(1.06);
      }

      .gp-dialog-btn-cancel {
        background: rgba(124, 52, 35, 0.7);
        color: #ffe7df;
        border-color: rgba(255, 199, 182, 0.24);
      }

      .gp-dialog-btn-confirm {
        background: #f2b2a8;
        color: #3e1a17;
      }

      .gp-dialog-btn-confirm.is-success {
        background: #b9e7bb;
        color: #163921;
      }

      .gp-dialog-btn-confirm.is-danger {
        background: #f4a58d;
        color: #3f1515;
      }
    `;

    document.head.appendChild(style);
  }

  function ensureDialogRefs() {
    if (dialogState.refs) {
      return dialogState.refs;
    }

    ensureDialogStyles();

    const overlay = document.createElement("div");
    overlay.id = "gp-dialog-overlay";
    overlay.className = "gp-dialog-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="gp-dialog-card" role="dialog" aria-modal="true" aria-labelledby="gp-dialog-title" aria-describedby="gp-dialog-message">
        <h2 id="gp-dialog-title" class="gp-dialog-title"></h2>
        <p id="gp-dialog-message" class="gp-dialog-message"></p>
        <label class="gp-dialog-input-wrap" id="gp-dialog-input-wrap" hidden>
          <textarea id="gp-dialog-input" class="gp-dialog-input" rows="4"></textarea>
        </label>
        <div class="gp-dialog-actions">
          <button id="gp-dialog-cancel" class="gp-dialog-btn gp-dialog-btn-cancel" type="button">Annuler</button>
          <button id="gp-dialog-confirm" class="gp-dialog-btn gp-dialog-btn-confirm" type="button">OK</button>
        </div>
      </section>
    `;

    document.body.appendChild(overlay);

    const refs = {
      overlay,
      title: overlay.querySelector("#gp-dialog-title"),
      message: overlay.querySelector("#gp-dialog-message"),
      inputWrap: overlay.querySelector("#gp-dialog-input-wrap"),
      input: overlay.querySelector("#gp-dialog-input"),
      cancelBtn: overlay.querySelector("#gp-dialog-cancel"),
      confirmBtn: overlay.querySelector("#gp-dialog-confirm"),
    };

    const closeWithCancelResult = () => {
      if (!dialogState.active) {
        return;
      }

      const cancelValue = dialogState.active.type === "confirm" ? false : null;
      finalizeDialog(cancelValue);
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeWithCancelResult();
      }
    });

    refs.cancelBtn?.addEventListener("click", closeWithCancelResult);

    refs.confirmBtn?.addEventListener("click", () => {
      if (!dialogState.active) {
        return;
      }

      if (dialogState.active.type === "prompt") {
        finalizeDialog(refs.input?.value ?? "");
        return;
      }

      finalizeDialog(true);
    });

    document.addEventListener("keydown", (event) => {
      if (!dialogState.active || refs.overlay.hidden) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeWithCancelResult();
      }
    });

    dialogState.refs = refs;
    return refs;
  }

  function finalizeDialog(value) {
    if (!dialogState.active || !dialogState.refs) {
      return;
    }

    const { refs } = dialogState;
    const resolve = dialogState.active.resolve;

    dialogState.active = null;
    refs.overlay.hidden = true;
    refs.confirmBtn.classList.remove("is-success", "is-danger");
    refs.inputWrap.hidden = true;
    refs.input.value = "";

    resolve(value);
  }

  function openDialog(type, options = {}) {
    const refs = ensureDialogRefs();

    if (dialogState.active) {
      const cancelValue = dialogState.active.type === "confirm" ? false : null;
      finalizeDialog(cancelValue);
    }

    refs.title.textContent = options.title || "Confirmation";
    refs.message.textContent = options.message || "";
    refs.cancelBtn.textContent = options.cancelText || "Annuler";
    refs.confirmBtn.textContent = options.confirmText || "OK";
    refs.confirmBtn.classList.remove("is-success", "is-danger");

    if (options.tone === "success") {
      refs.confirmBtn.classList.add("is-success");
    } else if (options.tone === "danger") {
      refs.confirmBtn.classList.add("is-danger");
    }

    if (type === "prompt") {
      refs.inputWrap.hidden = false;
      refs.input.placeholder = options.placeholder || "";
      refs.input.value = options.defaultValue || "";
      refs.input.setAttribute("aria-label", options.inputLabel || "Saisissez votre texte");
    } else {
      refs.inputWrap.hidden = true;
      refs.input.value = "";
      refs.input.placeholder = "";
    }

    refs.overlay.hidden = false;

    const focusTarget = type === "prompt" ? refs.input : refs.confirmBtn;
    requestAnimationFrame(() => {
      focusTarget?.focus();
    });

    return new Promise((resolve) => {
      dialogState.active = { type, resolve };
    });
  }

  window.GPDialog = {
    confirm(options = {}) {
      return openDialog("confirm", options);
    },
    prompt(options = {}) {
      return openDialog("prompt", options);
    },
  };

  window.gpConfirm = (message, options = {}) => {
    if (!window.GPDialog?.confirm) {
      return Promise.resolve(window.confirm(message));
    }

    return window.GPDialog.confirm({
      message,
      ...options,
    });
  };

  window.gpPrompt = (message, defaultValue = "", options = {}) => {
    if (!window.GPDialog?.prompt) {
      return Promise.resolve(window.prompt(message, defaultValue));
    }

    return window.GPDialog.prompt({
      message,
      defaultValue,
      ...options,
    });
  };

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
