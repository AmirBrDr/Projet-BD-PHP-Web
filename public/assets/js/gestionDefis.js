(() => {
    const token = localStorage.getItem('gp_token') || '';

    const askConfirm = (message, options = {}) => {
        if (typeof window.gpConfirm === 'function') return window.gpConfirm(message, options);
        if (window.GPDialog?.confirm) return window.GPDialog.confirm({ message, ...options });
        throw new Error('Modal de confirmation indisponible.');
    };

    const state = {
        challenges: [],
        setupThemes: [],
        availableDefis: [],
        selectedThemeId: 0,
        selectedDefiIds: [],
    };

    const el = {
        pageAlert: document.getElementById('page-alert'),
        filtreTheme: document.getElementById('filtreTheme'),
        emptyState: document.getElementById('empty-state'),
        challengeList: document.getElementById('challenge-list'),
        refreshBtn: document.getElementById('refresh-challenges-btn'),
        monthSetup: document.getElementById('month-setup'),
        setupThemeSelect: document.getElementById('setup-theme-select'),
        defiSlots: document.getElementById('defi-slots'),
        saveMonthBtn: document.getElementById('save-month-btn'),
    };

    function escapeHtml(v) {
        return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function setPageAlert(msg) {
        if (!el.pageAlert) return;
        if (!msg) { el.pageAlert.hidden = true; el.pageAlert.textContent = ''; return; }
        el.pageAlert.hidden = false;
        el.pageAlert.textContent = msg;
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

    function getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // ── Affichage de la liste des défis existants ──────────────────────────────

    function renderChallenges() {
        const selectedTheme = el.filtreTheme?.value || 'all';
        const visible = selectedTheme === 'all'
            ? state.challenges
            : state.challenges.filter(c => c.nomtheme === selectedTheme);

        if (!visible.length) {
            el.challengeList.innerHTML = '';
            el.emptyState?.classList.remove('hidden');
            return;
        }
        el.emptyState?.classList.add('hidden');

        // Alimenter le filtre thématique
        const themes = [...new Set(state.challenges.map(c => c.nomtheme).filter(Boolean))];
        const currentFilter = el.filtreTheme?.value || 'all';
        if (el.filtreTheme) {
            el.filtreTheme.innerHTML = '<option value="all">Toutes les thematiques</option>' +
                themes.map(t => `<option value="${escapeHtml(t)}"${t === currentFilter ? ' selected' : ''}>${escapeHtml(t)}</option>`).join('');
        }

        el.challengeList.innerHTML = visible.map((c, i) => `
            <article class="defi-card ${i === 0 ? 'actif' : ''}" data-id="${c.id_defi}">
                <div class="defi-ordre">${escapeHtml(c.ordre ?? '-')}</div>
                <div class="defi-body">
                    <span class="defi-theme-badge">${escapeHtml(c.nomtheme || 'Thematique')}</span>
                    <h3 class="defi-nom">${escapeHtml(c.nomdefi)}</h3>
                    <p class="defi-desc">${escapeHtml(c.descriptiondefi || 'Aucune description')}</p>
                    <div class="defi-meta">
                        <span>${escapeHtml(c.nbpointsdefi || 0)} pts</span>
                        <span>${escapeHtml(c.nbco2defi || 0)} kg CO2</span>
                        <span>Niveau ${escapeHtml(c.niveaudefi || '-')}</span>
                        <span>Mois ${escapeHtml(c.mois || '-')}</span>
                    </div>
                </div>
                <div class="defi-action">
                    <a href="detailDefiAnimateur.html?id=${c.id_defi}" class="btn-detail">Voir le defi</a>
                    <div class="manage-actions">
                        <button class="btn-manage danger" type="button" data-action="delete" data-id="${c.id_defi}">Supprimer</button>
                    </div>
                </div>
            </article>`).join('');
    }

    async function loadCurrentMonthChallenges() {
        const res = await apiReq('challenges');
        const allChallenges = res?.data || [];
        const currentMonth = getCurrentMonth();
        state.challenges = allChallenges.filter(c => c.mois === currentMonth);
        return state.challenges;
    }

    // ── Setup mensuel ──────────────────────────────────────────────────────────

    async function loadSetupThemes() {
        const res = await apiReq('catalogue_themes');
        state.setupThemes = res?.data || [];
        if (!el.setupThemeSelect) return;
        el.setupThemeSelect.innerHTML = '<option value="">-- Choisir une thematique --</option>' +
            state.setupThemes.map(t => `<option value="${t.id_thematique}">${escapeHtml(t.nomtheme)} (${t.nb_defis} defi(s))</option>`).join('');
    }

    function buildSlot(defis, selectedDefiId = 0) {
        const select = document.createElement('select');
        select.className = 'slot-select';
        select.innerHTML = '<option value="">-- Choisir un defi --</option>' +
            defis.map(d => `<option value="${d.id_defi}"${d.id_defi === selectedDefiId ? ' selected' : ''}>${escapeHtml(d.nomdefi)} (${d.nbpointsdefi}pts)</option>`).join('');
        select.addEventListener('change', syncSelectedDefiIds);
        return select;
    }

    function syncSelectedDefiIds() {
        state.selectedDefiIds = Array.from(
            el.defiSlots?.querySelectorAll('.slot-select') || []
        ).map(s => parseInt(s.value, 10)).filter(v => v > 0);
        if (el.saveMonthBtn) {
            el.saveMonthBtn.classList.toggle('hidden', state.selectedDefiIds.length === 0);
        }
    }

    function addDefiSlot() {
        if (!el.defiSlots) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'slot-row';
        const select = buildSlot(state.availableDefis);
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'ghost-btn slot-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => { wrapper.remove(); syncSelectedDefiIds(); });
        wrapper.appendChild(select);
        wrapper.appendChild(removeBtn);
        // Insérer avant le bouton "+"
        const addBtn = el.defiSlots.querySelector('.add-slot-btn');
        if (addBtn) el.defiSlots.insertBefore(wrapper, addBtn);
        else el.defiSlots.appendChild(wrapper);
        syncSelectedDefiIds();
    }

    async function onThemeChange() {
        const themeId = parseInt(el.setupThemeSelect?.value || '0', 10);
        state.selectedThemeId = themeId;
        state.availableDefis = [];
        state.selectedDefiIds = [];
        if (!el.defiSlots) return;
        el.defiSlots.innerHTML = '';
        if (el.saveMonthBtn) el.saveMonthBtn.classList.add('hidden');

        if (!themeId) return;

        try {
            const res = await apiReq(`catalogue_defis_available&theme_id=${themeId}`);
            state.availableDefis = res?.data || [];
            if (!state.availableDefis.length) {
                el.defiSlots.innerHTML = '<p class="setup-empty">Aucun defi disponible pour cette thematique. <a href="gestionCatalogue.html">Creez-en dans le catalogue</a>.</p>';
                return;
            }
            // Bouton "+" pour ajouter un slot
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'ghost-btn add-slot-btn';
            addBtn.textContent = '+ Ajouter un defi';
            addBtn.addEventListener('click', addDefiSlot);
            el.defiSlots.appendChild(addBtn);
            addDefiSlot();
        } catch (err) {
            el.defiSlots.innerHTML = `<p class="setup-empty">Erreur: ${escapeHtml(err.message)}</p>`;
        }
    }

    async function saveMonthDefis() {
        syncSelectedDefiIds();
        const defiIds = state.selectedDefiIds;
        if (!defiIds.length) { setPageAlert('Selectionnez au moins un defi.'); return; }
        if (!state.selectedThemeId) { setPageAlert('Choisissez une thematique.'); return; }

        try {
            await apiReq('defis_month_save', {
                method: 'POST',
                body: { thematique_id: state.selectedThemeId, defi_ids: defiIds, mois: getCurrentMonth() },
            });
            setPageAlert('Defis du mois sauvegardes !');
            await init();
        } catch (err) {
            setPageAlert(err.message || 'Sauvegarde impossible.');
        }
    }

    // ── Suppression ────────────────────────────────────────────────────────────

    async function deleteChallenge(challengeId) {
        const confirmed = await askConfirm('Confirmer la suppression de ce defi ?', {
            title: 'Suppression', confirmText: 'Supprimer', cancelText: 'Annuler', tone: 'danger',
        });
        if (!confirmed) return;
        try {
            await apiReq('challenge_delete', { method: 'POST', params: { id: String(challengeId) } });
            setPageAlert('Defi supprime.');
            await init();
        } catch (err) {
            setPageAlert(err.message || 'Suppression impossible.');
        }
    }

    // ── Init ───────────────────────────────────────────────────────────────────

    async function init() {
        try {
            const challenges = await loadCurrentMonthChallenges();

            if (challenges.length > 0) {
                // Des défis existent pour ce mois → afficher la liste
                el.monthSetup?.classList.add('hidden');
                el.challengeList && (el.challengeList.innerHTML = '');
                renderChallenges();
            } else {
                // Aucun défi ce mois → afficher le setup
                el.challengeList && (el.challengeList.innerHTML = '');
                el.emptyState?.classList.add('hidden');
                el.monthSetup?.classList.remove('hidden');
                el.defiSlots && (el.defiSlots.innerHTML = '');
                el.saveMonthBtn?.classList.add('hidden');
                await loadSetupThemes();
            }
        } catch (err) {
            setPageAlert(err.message || 'Chargement impossible.');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        el.filtreTheme?.addEventListener('change', renderChallenges);
        el.refreshBtn?.addEventListener('click', async () => { setPageAlert(''); await init(); });
        el.setupThemeSelect?.addEventListener('change', onThemeChange);
        el.saveMonthBtn?.addEventListener('click', saveMonthDefis);

        el.challengeList?.addEventListener('click', async e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            if (btn.tagName === 'A') return;
            const action = btn.dataset.action;
            const id = parseInt(btn.dataset.id || '0', 10);
            if (!id) return;
            try {
                if (action === 'delete') await deleteChallenge(id);
            } catch (err) {
                setPageAlert(err.message || 'Erreur.');
            }
        });

        if (!token) { setPageAlert('Session invalide.'); return; }
        init();
    });
})();
