(() => {
    const token = localStorage.getItem('gp_token') || '';

    const askConfirm = (message, options = {}) => {
        if (typeof window.gpConfirm === 'function') return window.gpConfirm(message, options);
        if (window.GPDialog?.confirm) return window.GPDialog.confirm({ message, ...options });
        throw new Error('Modal de confirmation indisponible.');
    };

    const state = {
        challenges: [],
        availableDefis: [],
        selectedThemeId: 0,
        currentThemeId: 0,
        currentThemeName: '',
        baseOrder: 1,
    };

    const el = {
        pageAlert: document.getElementById('page-alert'),
        filtreTheme: document.getElementById('filtreTheme'),
        emptyState: document.getElementById('empty-state'),
        challengeList: document.getElementById('challenge-list'),
        refreshBtn: document.getElementById('refresh-challenges-btn'),
        openMonthModalBtn: document.getElementById('open-month-modal-btn'),
        modalMonthLabel: document.getElementById('modal-month-label'),
        modalThemeFreeRow: document.getElementById('modal-theme-free-row'),
        modalThemeSelect: document.getElementById('modal-theme-select'),
        modalThemeLockedRow: document.getElementById('modal-theme-locked-row'),
        modalThemeLockedName: document.getElementById('modal-theme-locked-name'),
        modalSlots: document.getElementById('modal-slots'),
        modalAddSlotBtn: document.getElementById('modal-add-slot-btn'),
        modalAlert: document.getElementById('month-modal-alert'),
        modalSaveBtn: document.getElementById('modal-save-btn'),
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

    function setModalAlert(msg, type) {
        if (!el.modalAlert) return;
        if (!msg) { el.modalAlert.hidden = true; el.modalAlert.textContent = ''; return; }
        el.modalAlert.hidden = false;
        el.modalAlert.className = `inline-alert${type === 'success' ? ' success' : ''}`;
        el.modalAlert.textContent = msg;
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

    function formatMonthLabel(ym) {
        const [year, month] = ym.split('-');
        const names = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
        return `${names[parseInt(month, 10) - 1]} ${year}`;
    }

    // ── Affichage de la liste des défis ────────────────────────────────────────

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
        state.challenges = allChallenges.filter(c => c.mois?.startsWith(currentMonth));
        return state.challenges;
    }

    // ── Modal ajout défis du mois ──────────────────────────────────────────────

    function openOverlay(id) {
        const overlay = document.getElementById(id);
        if (overlay) { overlay.classList.remove('hidden'); overlay.setAttribute('aria-hidden', 'false'); }
    }
    function closeOverlay(id) {
        const overlay = document.getElementById(id);
        if (overlay) { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden', 'true'); }
    }

    function getSlotCount() {
        return el.modalSlots?.querySelectorAll('.slot-row').length || 0;
    }

    function syncSaveBtn() {
        const hasSelection = Array.from(
            el.modalSlots?.querySelectorAll('.slot-select') || []
        ).some(s => s.value !== '');
        if (el.modalSaveBtn) el.modalSaveBtn.classList.toggle('hidden', !hasSelection);
    }

    // Rebuild options for one select, excluding values picked by other selects
    function buildSlotOptions(selectEl) {
        const picked = Array.from(
            el.modalSlots?.querySelectorAll('.slot-select') || []
        ).filter(s => s !== selectEl).map(s => s.value).filter(Boolean);

        const currentVal = selectEl.value;
        selectEl.innerHTML = '<option value="">-- Choisir un defi --</option>' +
            state.availableDefis
                .filter(d => !picked.includes(String(d.id_defi)))
                .map(d => `<option value="${d.id_defi}">${escapeHtml(d.nomdefi)} (${d.nbpointsdefi} pts)</option>`)
                .join('');
        if (currentVal && selectEl.querySelector(`option[value="${currentVal}"]`)) {
            selectEl.value = currentVal;
        }
    }

    function refreshAllSlots() {
        el.modalSlots?.querySelectorAll('.slot-select').forEach(s => buildSlotOptions(s));
        syncSaveBtn();
    }

    function addDefiSlot() {
        if (!el.modalSlots) return;
        const orderNum = state.baseOrder + getSlotCount();

        const wrapper = document.createElement('div');
        wrapper.className = 'slot-row';

        const label = document.createElement('span');
        label.className = 'slot-order-label';
        label.textContent = `Ordre ${orderNum}`;

        const select = document.createElement('select');
        select.className = 'slot-select';
        buildSlotOptions(select);
        select.addEventListener('change', refreshAllSlots);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'ghost-btn slot-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            wrapper.remove();
            el.modalSlots?.querySelectorAll('.slot-row').forEach((row, i) => {
                const lbl = row.querySelector('.slot-order-label');
                if (lbl) lbl.textContent = `Ordre ${state.baseOrder + i}`;
            });
            refreshAllSlots();
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        wrapper.appendChild(removeBtn);
        el.modalSlots.appendChild(wrapper);
        syncSaveBtn();
    }

    async function loadAvailableDefis(themeId) {
        const res = await apiReq('catalogue_defis_available', { params: { theme_id: themeId } });
        state.availableDefis = res?.data || [];
    }

    async function openMonthModal() {
        setModalAlert('');
        if (el.modalSlots) el.modalSlots.innerHTML = '';
        if (el.modalSaveBtn) el.modalSaveBtn.classList.add('hidden');
        if (el.modalAddSlotBtn) el.modalAddSlotBtn.classList.add('hidden');

        const currentMonth = getCurrentMonth();
        if (el.modalMonthLabel) el.modalMonthLabel.textContent = formatMonthLabel(currentMonth);

        if (state.currentThemeId > 0) {
            // Theme already set this month — lock it, start from next order
            el.modalThemeFreeRow?.classList.add('hidden');
            el.modalThemeLockedRow?.classList.remove('hidden');
            if (el.modalThemeLockedName) el.modalThemeLockedName.textContent = state.currentThemeName;
            state.selectedThemeId = state.currentThemeId;
            const maxOrdre = state.challenges.length
                ? Math.max(...state.challenges.map(c => parseInt(c.ordre, 10) || 0))
                : 0;
            state.baseOrder = maxOrdre + 1;

            try {
                await loadAvailableDefis(state.currentThemeId);
                if (!state.availableDefis.length) {
                    setModalAlert('Tous les defis de cette thematique sont deja planifies.');
                } else {
                    el.modalAddSlotBtn?.classList.remove('hidden');
                    addDefiSlot();
                }
            } catch (err) {
                setModalAlert(err.message || 'Erreur lors du chargement des defis.');
            }
        } else {
            // No theme set yet — show selector
            el.modalThemeLockedRow?.classList.add('hidden');
            el.modalThemeFreeRow?.classList.remove('hidden');
            if (el.modalThemeSelect) el.modalThemeSelect.value = '';
            state.selectedThemeId = 0;
            state.baseOrder = 1;

            try {
                const res = await apiReq('catalogue_themes');
                const themes = res?.data || [];
                if (el.modalThemeSelect) {
                    el.modalThemeSelect.innerHTML = '<option value="">-- Choisir une thematique --</option>' +
                        themes.map(t => `<option value="${t.id_thematique}">${escapeHtml(t.nomtheme)} (${t.nb_defis} defi(s))</option>`).join('');
                }
            } catch (err) {
                setModalAlert(err.message || 'Erreur lors du chargement des thematiques.');
            }
        }

        openOverlay('month-modal-overlay');
    }

    async function onModalThemeChange() {
        const themeId = parseInt(el.modalThemeSelect?.value || '0', 10);
        state.selectedThemeId = themeId;
        state.availableDefis = [];
        if (el.modalSlots) el.modalSlots.innerHTML = '';
        if (el.modalSaveBtn) el.modalSaveBtn.classList.add('hidden');
        if (el.modalAddSlotBtn) el.modalAddSlotBtn.classList.add('hidden');
        setModalAlert('');
        if (!themeId) return;

        try {
            await loadAvailableDefis(themeId);
            if (!state.availableDefis.length) {
                setModalAlert('Aucun defi disponible pour cette thematique. Creez-en depuis le Catalogue.');
                return;
            }
            el.modalAddSlotBtn?.classList.remove('hidden');
            addDefiSlot();
        } catch (err) {
            setModalAlert(err.message || 'Erreur.');
        }
    }

    async function saveMonthDefis() {
        setModalAlert('');
        if (!state.selectedThemeId) { setModalAlert('Choisissez une thematique.'); return; }

        const newIds = Array.from(
            el.modalSlots?.querySelectorAll('.slot-select') || []
        ).map(s => parseInt(s.value, 10)).filter(v => v > 0);

        if (!newIds.length) { setModalAlert('Selectionnez au moins un defi.'); return; }

        // Check for duplicates among new selections
        if (new Set(newIds).size !== newIds.length) {
            setModalAlert('Chaque defi ne peut etre selectionne qu\'une seule fois.');
            return;
        }

        // Merge existing (sorted by ordre) with new selections
        const existingIds = [...state.challenges]
            .sort((a, b) => (parseInt(a.ordre, 10) || 0) - (parseInt(b.ordre, 10) || 0))
            .map(c => c.id_defi);

        const allIds = [...existingIds, ...newIds];

        try {
            await apiReq('defis_month_save', {
                method: 'POST',
                body: {
                    thematique_id: state.selectedThemeId,
                    defi_ids: allIds,
                    mois: getCurrentMonth(),
                },
            });
            setModalAlert('Defis sauvegardes !', 'success');
            setTimeout(() => {
                closeOverlay('month-modal-overlay');
                init();
            }, 700);
        } catch (err) {
            setModalAlert(err.message || 'Sauvegarde impossible.');
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
            await loadCurrentMonthChallenges();

            if (state.challenges.length > 0) {
                state.currentThemeId = parseInt(state.challenges[0].id_thematique, 10) || 0;
                state.currentThemeName = state.challenges[0].nomtheme || '';
                el.emptyState?.classList.add('hidden');
            } else {
                state.currentThemeId = 0;
                state.currentThemeName = '';
                el.challengeList && (el.challengeList.innerHTML = '');
                el.emptyState?.classList.remove('hidden');
            }

            renderChallenges();
        } catch (err) {
            setPageAlert(err.message || 'Chargement impossible.');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        el.filtreTheme?.addEventListener('change', renderChallenges);
        el.refreshBtn?.addEventListener('click', async () => { setPageAlert(''); await init(); });
        el.openMonthModalBtn?.addEventListener('click', openMonthModal);
        el.modalThemeSelect?.addEventListener('change', onModalThemeChange);
        el.modalAddSlotBtn?.addEventListener('click', addDefiSlot);
        el.modalSaveBtn?.addEventListener('click', saveMonthDefis);

        document.querySelectorAll('[data-close-overlay]').forEach(btn => {
            btn.addEventListener('click', () => closeOverlay(btn.dataset.closeOverlay));
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) closeOverlay(overlay.id);
            });
        });

        el.challengeList?.addEventListener('click', async e => {
            const btn = e.target.closest('[data-action]');
            if (!btn || btn.tagName === 'A') return;
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
