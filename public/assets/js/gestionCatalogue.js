(() => {
    const token = localStorage.getItem('gp_token') || '';
    const API = '/api/modules/animator/';

    let allThemes = [];

    function escapeHtml(v) {
        return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    async function apiReq(action, options = {}) {
        const method = options.method || 'GET';
        const params = new URLSearchParams({ action, ...(options.params || {}) });
        const url = `/api/modules/animator/?${params}`;
        const opts = { method, headers: { Authorization: `Bearer ${token}` } };
        if (options.body) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(options.body);
        }
        const res = await fetch(url, opts);
        let data = null;
        try { data = await res.json(); } catch (_) {}
        if (!res.ok) throw new Error(data?.message || `Erreur ${res.status}`);
        return data;
    }

    function setPageAlert(msg) {
        const el = document.getElementById('page-alert');
        if (!el) return;
        if (!msg) { el.hidden = true; el.textContent = ''; return; }
        el.hidden = false;
        el.textContent = msg;
    }

    function setFormAlert(id, msg, type) {
        const el = document.getElementById(id);
        if (!el) return;
        if (!msg) { el.hidden = true; el.textContent = ''; return; }
        el.hidden = false;
        el.className = `inline-alert${type === 'success' ? ' success' : ''}`;
        el.textContent = msg;
    }

    // ── Accordion ──────────────────────────────────────────────────────────────

    function renderCatalogue(themes) {
        const container = document.getElementById('catalogue-list');
        if (!container) return;

        if (!themes.length) {
            container.innerHTML = '<p class="loading-state">Aucune thematique. Creez-en une pour commencer.</p>';
            return;
        }

        container.innerHTML = themes.map(t => `
            <div class="theme-accordion" data-theme-id="${t.id_thematique}">
                <div class="theme-accordion-header">
                    <div class="theme-title-row">
                        <span class="theme-name">${escapeHtml(t.nomtheme)}</span>
                        <span class="theme-count">${t.nb_defis} defi(s)</span>
                    </div>
                    <div class="theme-header-actions">
                        <button class="ghost-btn add-defi-btn" type="button" data-open-defi="${t.id_thematique}" title="Ajouter un defi">
                            <i class="fas fa-plus"></i> Defi
                        </button>
                        <i class="fas fa-chevron-down chevron"></i>
                    </div>
                </div>
                <div class="theme-accordion-body">
                    ${t.descriptiontheme ? `<p class="theme-desc">${escapeHtml(t.descriptiontheme)}</p>` : ''}
                    <div class="defi-list-wrapper" data-defis-for="${t.id_thematique}">
                        <div class="loading-state" style="padding:8px 0;font-size:13px">Chargement...</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Bind accordion toggles
        container.querySelectorAll('.theme-accordion-header').forEach(header => {
            header.addEventListener('click', e => {
                if (e.target.closest('button')) return;
                const accordion = header.closest('.theme-accordion');
                const isOpen = accordion.classList.toggle('open');
                if (isOpen) {
                    const themeId = parseInt(accordion.dataset.themeId, 10);
                    loadDefisForTheme(themeId, accordion.querySelector('[data-defis-for]'));
                }
            });
        });

        // Bind "add defi" buttons
        container.querySelectorAll('[data-open-defi]').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeId = parseInt(btn.dataset.openDefi, 10);
                openDefiModal([themeId]);
            });
        });
    }

    async function loadDefisForTheme(themeId, wrapper) {
        if (!wrapper || wrapper.dataset.loaded === 'true') return;
        try {
            const res = await apiReq('catalogue_defis_by_theme', { params: { theme_id: themeId } });
            const defis = res?.data || [];
            wrapper.dataset.loaded = 'true';
            if (!defis.length) {
                wrapper.innerHTML = '<p class="empty-theme">Aucun defi dans cette thematique.</p>';
                return;
            }
            wrapper.innerHTML = `<ul class="defi-list-catalogue">${defis.map(d => `
                <li class="defi-catalogue-item">
                    <span class="defi-nom">${escapeHtml(d.nomdefi)}</span>
                    <div class="defi-meta">
                        <span class="meta-chip">${d.nbpointsdefi} pts</span>
                        <span class="meta-chip">${d.nbco2defi} kg CO2</span>
                        <span class="meta-chip">Niv. ${d.niveaudefi}</span>
                    </div>
                    ${d.is_scheduled ? '<span class="badge-scheduled">Planifie</span>' : '<span class="badge-available">Disponible</span>'}
                </li>`).join('')}</ul>`;
        } catch (err) {
            wrapper.innerHTML = `<p class="empty-theme">Erreur: ${escapeHtml(err.message)}</p>`;
        }
    }

    async function loadCatalogue() {
        try {
            const res = await apiReq('catalogue_themes');
            allThemes = res?.data || [];
            renderCatalogue(allThemes);
        } catch (err) {
            setPageAlert(err.message || 'Chargement impossible.');
        }
    }

    // ── Modal thématique ───────────────────────────────────────────────────────

    function openOverlay(id) {
        const el = document.getElementById(id);
        if (el) { el.classList.remove('hidden'); el.setAttribute('aria-hidden', 'false'); }
    }
    function closeOverlay(id) {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.setAttribute('aria-hidden', 'true'); }
    }

    async function submitThemeForm(e) {
        e.preventDefault();
        setFormAlert('theme-form-alert', '');
        const nom = (document.getElementById('theme-name')?.value || '').trim();
        const desc = (document.getElementById('theme-description')?.value || '').trim();
        if (!nom) { setFormAlert('theme-form-alert', 'Le nom est requis.'); return; }
        try {
            await apiReq('catalogue_theme_create', { method: 'POST', body: { nomTheme: nom, descriptionTheme: desc } });
            setFormAlert('theme-form-alert', 'Thematique creee !', 'success');
            document.getElementById('theme-form')?.reset();
            setTimeout(() => closeOverlay('theme-modal-overlay'), 800);
            await loadCatalogue();
        } catch (err) {
            setFormAlert('theme-form-alert', err.message || 'Erreur.');
        }
    }

    // ── Modal défi ─────────────────────────────────────────────────────────────

    function createActionRow() {
        const row = document.createElement('div');
        row.className = 'action-row';
        row.innerHTML = `
            <div class="action-row-head">
                <span class="action-row-title">Action</span>
                <button class="action-remove" type="button">Supprimer</button>
            </div>
            <label class="action-name">
                <span>Nom de l'action</span>
                <input class="action-name-input" type="text" required />
            </label>
            <label>
                <span>Description (optionnel)</span>
                <textarea class="action-desc-input" rows="2"></textarea>
            </label>`;
        row.querySelector('.action-remove').addEventListener('click', () => {
            row.remove();
            const c = document.getElementById('defi-actions-container');
            if (c && c.children.length === 0) createActionRow();
        });
        document.getElementById('defi-actions-container')?.appendChild(row);
    }

    function openDefiModal(preselectedThemeIds = []) {
        const container = document.getElementById('defi-themes-checkboxes');
        if (container) {
            container.innerHTML = allThemes.map(t => `
                <label class="checkbox-item">
                    <input type="checkbox" value="${t.id_thematique}"${preselectedThemeIds.includes(t.id_thematique) ? ' checked' : ''} />
                    ${escapeHtml(t.nomtheme)}
                </label>`).join('');
        }
        const actContainer = document.getElementById('defi-actions-container');
        if (actContainer) { actContainer.innerHTML = ''; createActionRow(); }
        document.getElementById('defi-form')?.reset();
        setFormAlert('defi-form-alert', '');
        openOverlay('defi-modal-overlay');
    }

    async function submitDefiForm(e) {
        e.preventDefault();
        setFormAlert('defi-form-alert', '');

        const nom = (document.getElementById('defi-name')?.value || '').trim();
        const desc = (document.getElementById('defi-description')?.value || '').trim();
        const pts = parseInt(document.getElementById('defi-points')?.value || '0', 10);
        const co2 = parseInt(document.getElementById('defi-co2')?.value || '0', 10);
        const niv = parseInt(document.getElementById('defi-level')?.value || '0', 10);

        const themeIds = Array.from(
            document.querySelectorAll('#defi-themes-checkboxes input[type=checkbox]:checked')
        ).map(cb => parseInt(cb.value, 10));

        const actions = Array.from(
            document.querySelectorAll('#defi-actions-container .action-row')
        ).map(row => ({
            nomAction: (row.querySelector('.action-name-input')?.value || '').trim(),
            descriptionAction: (row.querySelector('.action-desc-input')?.value || '').trim(),
        })).filter(a => a.nomAction !== '');

        if (!nom) { setFormAlert('defi-form-alert', 'Le nom est requis.'); return; }
        if (pts <= 0 || niv <= 0) { setFormAlert('defi-form-alert', 'Points et niveau doivent etre positifs.'); return; }
        if (co2 < 0) { setFormAlert('defi-form-alert', 'Le CO2 doit etre positif ou nul.'); return; }
        if (!themeIds.length) { setFormAlert('defi-form-alert', 'Selectionnez au moins une thematique.'); return; }
        if (!actions.length) { setFormAlert('defi-form-alert', 'Ajoutez au moins une action.'); return; }

        try {
            await apiReq('catalogue_defi_create', {
                method: 'POST',
                body: { nomDefi: nom, descriptionDefi: desc, nbPointsDefi: pts, nbCO2Defi: co2, niveauDefi: niv, themeIds, actions },
            });
            setFormAlert('defi-form-alert', 'Defi cree !', 'success');
            setTimeout(() => closeOverlay('defi-modal-overlay'), 800);
            await loadCatalogue();
        } catch (err) {
            setFormAlert('defi-form-alert', err.message || 'Erreur.');
        }
    }

    // ── Init ───────────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('open-theme-modal-btn')?.addEventListener('click', () => {
            document.getElementById('theme-form')?.reset();
            setFormAlert('theme-form-alert', '');
            openOverlay('theme-modal-overlay');
        });
        document.getElementById('theme-form')?.addEventListener('submit', submitThemeForm);
        document.getElementById('defi-form')?.addEventListener('submit', submitDefiForm);
        document.getElementById('add-action-btn')?.addEventListener('click', createActionRow);

        document.querySelectorAll('[data-close-overlay]').forEach(btn => {
            btn.addEventListener('click', () => closeOverlay(btn.dataset.closeOverlay));
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) closeOverlay(overlay.id);
            });
        });

        loadCatalogue();
    });
})();
