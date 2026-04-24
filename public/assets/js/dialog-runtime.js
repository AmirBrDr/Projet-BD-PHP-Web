(() => {
    if (typeof window.gpConfirm === "function" && typeof window.gpPrompt === "function") {
        return;
    }

    const state = {
        active: null,
        refs: null,
    };

    function ensureStyles() {
        if (document.getElementById("gp-runtime-dialog-style")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "gp-runtime-dialog-style";
        style.textContent = `
            .gp-runtime-overlay {
                position: fixed;
                inset: 0;
                z-index: 6000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                background: rgba(7, 9, 18, 0.58);
            }

            .gp-runtime-overlay[hidden] {
                display: none;
            }

            .gp-runtime-card {
                width: min(540px, 100%);
                border: 1px solid rgba(244, 166, 144, 0.45);
                border-radius: 18px;
                background: radial-gradient(circle at top left, #3d1f24 0%, #1e1418 60%, #120f12 100%);
                color: #fff1ea;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
                padding: 1.25rem;
            }

            .gp-runtime-title {
                margin: 0;
                font-size: 1.15rem;
                font-weight: 700;
            }

            .gp-runtime-message {
                margin: 0.75rem 0 0;
                line-height: 1.5;
                color: rgba(255, 241, 234, 0.92);
            }

            .gp-runtime-input-wrap {
                margin-top: 0.95rem;
            }

            .gp-runtime-input {
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

            .gp-runtime-input:focus-visible {
                outline: 2px solid #f1a393;
                outline-offset: 2px;
            }

            .gp-runtime-actions {
                margin-top: 1rem;
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
            }

            .gp-runtime-btn {
                min-width: 112px;
                border-radius: 999px;
                padding: 0.6rem 1rem;
                border: 1px solid transparent;
                font-weight: 700;
                cursor: pointer;
                transition: transform 0.14s ease, filter 0.14s ease;
            }

            .gp-runtime-btn:focus-visible {
                outline: 2px solid #f8d9cf;
                outline-offset: 2px;
            }

            .gp-runtime-btn:hover {
                transform: translateY(-1px);
                filter: brightness(1.06);
            }

            .gp-runtime-btn-cancel {
                background: rgba(124, 52, 35, 0.7);
                color: #ffe7df;
                border-color: rgba(255, 199, 182, 0.24);
            }

            .gp-runtime-btn-confirm {
                background: #f2b2a8;
                color: #3e1a17;
            }

            .gp-runtime-btn-confirm.is-success {
                background: #b9e7bb;
                color: #163921;
            }

            .gp-runtime-btn-confirm.is-danger {
                background: #f4a58d;
                color: #3f1515;
            }
        `;

        document.head.appendChild(style);
    }

    function finalize(value) {
        if (!state.active || !state.refs) {
            return;
        }

        const { refs } = state;
        const { resolve } = state.active;

        state.active = null;
        refs.overlay.hidden = true;
        refs.confirmBtn.classList.remove("is-success", "is-danger");
        refs.inputWrap.hidden = true;
        refs.input.value = "";

        resolve(value);
    }

    function ensureRefs() {
        if (state.refs) {
            return state.refs;
        }

        ensureStyles();

        const overlay = document.createElement("div");
        overlay.className = "gp-runtime-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <section class="gp-runtime-card" role="dialog" aria-modal="true" aria-labelledby="gp-runtime-title" aria-describedby="gp-runtime-message">
                <h2 id="gp-runtime-title" class="gp-runtime-title"></h2>
                <p id="gp-runtime-message" class="gp-runtime-message"></p>
                <label class="gp-runtime-input-wrap" id="gp-runtime-input-wrap" hidden>
                    <textarea id="gp-runtime-input" class="gp-runtime-input" rows="4"></textarea>
                </label>
                <div class="gp-runtime-actions">
                    <button id="gp-runtime-cancel" class="gp-runtime-btn gp-runtime-btn-cancel" type="button">Annuler</button>
                    <button id="gp-runtime-confirm" class="gp-runtime-btn gp-runtime-btn-confirm" type="button">OK</button>
                </div>
            </section>
        `;

        document.body.appendChild(overlay);

        const refs = {
            overlay,
            title: overlay.querySelector("#gp-runtime-title"),
            message: overlay.querySelector("#gp-runtime-message"),
            inputWrap: overlay.querySelector("#gp-runtime-input-wrap"),
            input: overlay.querySelector("#gp-runtime-input"),
            cancelBtn: overlay.querySelector("#gp-runtime-cancel"),
            confirmBtn: overlay.querySelector("#gp-runtime-confirm"),
        };

        const cancelActiveDialog = () => {
            if (!state.active) {
                return;
            }

            finalize(state.active.type === "confirm" ? false : null);
        };

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                cancelActiveDialog();
            }
        });

        refs.cancelBtn?.addEventListener("click", cancelActiveDialog);

        refs.confirmBtn?.addEventListener("click", () => {
            if (!state.active) {
                return;
            }

            if (state.active.type === "prompt") {
                finalize(refs.input?.value ?? "");
                return;
            }

            finalize(true);
        });

        document.addEventListener("keydown", (event) => {
            if (!state.active || refs.overlay.hidden) {
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                cancelActiveDialog();
            }
        });

        state.refs = refs;
        return refs;
    }

    function open(type, options = {}) {
        const refs = ensureRefs();

        if (state.active) {
            finalize(state.active.type === "confirm" ? false : null);
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
            state.active = { type, resolve };
        });
    }

    if (!window.GPDialog || typeof window.GPDialog !== "object") {
        window.GPDialog = {};
    }

    if (typeof window.GPDialog.confirm !== "function") {
        window.GPDialog.confirm = (options = {}) => open("confirm", options);
    }

    if (typeof window.GPDialog.prompt !== "function") {
        window.GPDialog.prompt = (options = {}) => open("prompt", options);
    }

    if (typeof window.gpConfirm !== "function") {
        window.gpConfirm = (message, options = {}) => open("confirm", { message, ...options });
    }

    if (typeof window.gpPrompt !== "function") {
        window.gpPrompt = (message, defaultValue = "", options = {}) => open("prompt", { message, defaultValue, ...options });
    }
})();
