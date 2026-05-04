// Fichier: public/assets/js/Employe/profilE.js - Logique frontend et interactions.
(() => {
    const API_BASE = '/api';
    const token = () => localStorage.getItem('gp_token');

    async function parseApiResponse(res) {
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        const text = await res.text();
        if (!text) return null;
        if (!contentType.includes('application/json')) {
            throw new Error('Réponse API non JSON: ' + text.slice(0, 120));
        }
        try {
            return JSON.parse(text);
        } catch (_) {
            throw new Error('Format JSON invalide');
        }
    }

    async function apiGet(path) {
        const res = await fetch(API_BASE + path, {
            headers: { 'Authorization': 'Bearer ' + token() }
        });
        const data = await parseApiResponse(res);
        if (!res.ok) throw new Error(data?.message || 'HTTP ' + res.status);
        return data;
    }

    async function apiPost(path, payload) {
        const res = await fetch(API_BASE + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
            body: JSON.stringify(payload),
        });
        const data = await parseApiResponse(res);
        if (!res.ok) throw new Error(data?.message || 'HTTP ' + res.status);
        return data;
    }

    // ── Helpers ──

    function setInitials(prenom, nom) {
        const el = document.querySelector('[data-user-initials]');
        if (!el) return;
        el.textContent = ((prenom || 'G').charAt(0) + (nom || 'P').charAt(0)).toUpperCase();
    }

    function renderAvatar(photoPath, prenom, nom) {
        // Avatar principal (page)
        const photoEl    = document.querySelector('[data-avatar-photo]');
        const initialsEl = document.querySelector('[data-user-initials]');
        // Avatar dans la modale
        const modalPhotoEl    = document.querySelector('[data-modal-avatar-photo]');
        const modalInitialsEl = document.querySelector('[data-modal-initials]');

        const initStr = ((prenom || 'G').charAt(0) + (nom || 'P').charAt(0)).toUpperCase();

        if (photoPath) {
            if (photoEl)    { photoEl.src = photoPath; photoEl.classList.remove('hidden'); }
            if (initialsEl)      initialsEl.classList.add('hidden');
            if (modalPhotoEl)    { modalPhotoEl.src = photoPath; modalPhotoEl.classList.remove('hidden'); }
            if (modalInitialsEl) modalInitialsEl.classList.add('hidden');
        } else {
            if (photoEl)    photoEl.classList.add('hidden');
            if (initialsEl) { initialsEl.classList.remove('hidden'); setInitials(prenom, nom); }
            if (modalPhotoEl)    modalPhotoEl.classList.add('hidden');
            if (modalInitialsEl) { modalInitialsEl.classList.remove('hidden'); modalInitialsEl.textContent = initStr; }
        }
    }

    function bindPhotoUpload() {
        const wrap     = document.querySelector('[data-modal-avatar-wrap]');
        const input    = document.querySelector('[data-modal-photo-input]');
        const feedback = document.querySelector('[data-photo-feedback]');
        if (!wrap || !input) return;

        wrap.addEventListener('click', () => input.click());

        input.addEventListener('change', async () => {
            if (!input.files || !input.files[0]) return;
            const fd = new FormData();
            fd.append('photo', input.files[0]);
            if (feedback) { feedback.className = 'feedback-msg'; feedback.textContent = 'Upload en cours...'; }
            try {
                const res = await fetch(API_BASE + '/auth/upload-photo.php', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token() },
                    body: fd,
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || 'HTTP ' + res.status);
                renderAvatar(json.photo, null, null);
                if (feedback) { feedback.className = 'feedback-msg is-success'; feedback.textContent = 'Photo mise à jour.'; }
                let current = {};
                try { current = JSON.parse(localStorage.getItem('gp_user') || '{}'); } catch (_) {}
                localStorage.setItem('gp_user', JSON.stringify({ ...current, pdpUser: json.photo }));
            } catch (err) {
                if (feedback) { feedback.className = 'feedback-msg is-error'; feedback.textContent = err.message || 'Erreur upload.'; }
            }
            input.value = '';
        });
    }

    function renderStats(stats) {
        const host = document.querySelector('[data-profile-stats]');
        if (!host) return;
        const items = [
            { label: 'Points personnels', value: (stats.points || 0).toLocaleString('fr-FR') },
            { label: 'CO₂ évité', value: (stats.co2 || 0) + ' kg' },
            { label: 'Classement individuel', value: (stats.rang_perso || 0) + 'e' },
        ];
        host.innerHTML = items.map(item => `
            <article class="stat-card panel">
                <div class="stat-label">${item.label}</div>
                <div class="stat-value">${item.value}</div>
            </article>`).join('');
    }

    function renderBadges(badges) {
        const host = document.querySelector('[data-badge-list]');
        if (!host) return;
        if (!badges.length) {
            host.innerHTML = '<li class="badge-item" style="color:var(--shell-muted)">Aucun badge encore. Complétez des défis !</li>';
            return;
        }
        host.innerHTML = badges.map(b => `
            <li class="badge-item">
                <span class="badge-icon">${b.icone || ''}</span>
                <strong>${b.nom}</strong>
                <small>${new Date(b.date).toLocaleDateString('fr-FR')}</small>
            </li>`).join('');
    }

    function renderHistory(history) {
        const host = document.querySelector('[data-history-list]');
        if (!host) return;
        if (!history.length) {
            host.innerHTML = '<li class="history-item" style="color:var(--shell-muted)">Aucun défi terminé pour l\'instant.</li>';
            return;
        }
        host.innerHTML = history.map(h => `
            <li class="history-item">
                <strong>${h.nom}</strong><br />
                <small>${new Date(h.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</small>
            </li>`).join('');
    }

    function syncStoredUser(user) {
        let current = {};
        try { current = JSON.parse(localStorage.getItem('gp_user') || '{}'); } catch (_) {}
        localStorage.setItem('gp_user', JSON.stringify({
            ...current,
            nomUser:    user.nomUser    || current.nomUser    || '',
            prenomUser: user.prenomUser || current.prenomUser || '',
            email:      user.email      || current.email      || '',
            role:       user.role       || current.role       || '',
            pdpUser:    user.pdpUser    ?? current.pdpUser    ?? null,
        }));
    }

    // ── Modal helpers ──

    function openModal(id) {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'modal-edit-password') {
            const inputs = el.querySelectorAll('input');
            inputs.forEach((input) => {
                input.value = '';
            });
            resetPasswordToggles(el);
        }
        el.classList.remove('hidden');
    }

    function resetPasswordToggles(scope) {
        if (!scope) return;
        scope.querySelectorAll('[data-toggle-password]').forEach((btn) => {
            const targetId = btn.getAttribute('data-toggle-password');
            const input = targetId ? document.getElementById(targetId) : null;
            if (input) {
                input.type = 'password';
            }
            btn.classList.remove('is-active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.add('fa-eye');
                icon.classList.remove('fa-eye-slash');
            }
            btn.setAttribute('aria-label', 'Afficher le mot de passe');
        });
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
        resetPasswordToggles(el);
        // Clear feedbacks on close
        el?.querySelectorAll('.feedback-msg').forEach(f => { f.textContent = ''; f.className = 'feedback-msg'; });
    }

    function bindModalTriggers() {
        document.querySelector('[data-open-edit-modal]')?.addEventListener('click', () => openModal('modal-edit-profile'));
        document.querySelector('[data-open-pwd-modal]')?.addEventListener('click', () => openModal('modal-edit-password'));

        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
        });

        // Close on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(overlay.id);
            });
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => closeModal(m.id));
            }
        });
    }

    function bindPasswordToggles() {
        document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-toggle-password');
                const input = targetId ? document.getElementById(targetId) : null;
                if (!input) return;

                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                btn.classList.toggle('is-active', isHidden);
                btn.setAttribute('aria-label', isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe');

                const icon = btn.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye', !isHidden);
                    icon.classList.toggle('fa-eye-slash', isHidden);
                }
            });
        });
    }

    // ── Edit profile modal ──

    function bindEditModal(initialUser) {
        const form     = document.querySelector('[data-edit-profile-form]');
        const feedback = document.querySelector('[data-edit-profile-feedback]');
        if (!form || !feedback) return;

        if (initialUser) {
            const prenomInput = form.querySelector('[name=prenomUser]');
            const nomInput    = form.querySelector('[name=nomUser]');
            const emailInput  = form.querySelector('[name=email]');
            if (prenomInput) prenomInput.value = initialUser.prenom || '';
            if (nomInput)    nomInput.value    = initialUser.nom    || '';
            if (emailInput)  emailInput.value  = initialUser.email  || '';
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            feedback.className = 'feedback-msg';
            feedback.textContent = '';

            const fd        = new FormData(form);
            const prenomUser = fd.get('prenomUser')?.trim() || '';
            const nomUser    = fd.get('nomUser')?.trim()    || '';
            const email      = fd.get('email')?.trim()      || '';

            if (!prenomUser || !nomUser) {
                feedback.className = 'feedback-msg is-error';
                feedback.textContent = 'Prénom et nom sont requis.';
                return;
            }

            const btn = form.querySelector('[type=submit]');
            btn.disabled = true;
            try {
                const payload = { nomUser, prenomUser };
                if (email) payload.email = email;
                const result = await apiPost('/auth/update-profile.php', payload);
                const updated = result.user || {};

                syncStoredUser(updated);

                const finalPrenom = updated.prenomUser || prenomUser;
                const finalNom    = updated.nomUser    || nomUser;
                const finalEmail  = updated.email      || email;

                const nameEl  = document.querySelector('[data-user-name]');
                const emailEl = document.querySelector('[data-user-email]');
                if (nameEl)  nameEl.textContent  = `${finalPrenom} ${finalNom}`.trim();
                if (emailEl) emailEl.textContent = finalEmail;
                setInitials(finalPrenom, finalNom);

                feedback.className = 'feedback-msg is-success';
                feedback.textContent = result.message || 'Profil mis à jour.';

                setTimeout(() => closeModal('modal-edit-profile'), 1400);
            } catch (err) {
                feedback.className = 'feedback-msg is-error';
                feedback.textContent = err?.message || 'Impossible de mettre à jour le profil.';
            } finally {
                btn.disabled = false;
            }
        });
    }

    // ── Change password modal ──

    function bindPasswordModal() {
        const form     = document.querySelector('[data-pwd-form]');
        const feedback = document.querySelector('[data-pwd-feedback]');
        if (!form || !feedback) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            feedback.className = 'feedback-msg';
            feedback.textContent = '';

            const fd              = new FormData(form);
            const currentPassword = fd.get('current_password')?.trim() || '';
            const newPassword     = fd.get('new_password')?.trim()     || '';
            const confirmPassword = fd.get('confirm_password')?.trim() || '';

            if (!currentPassword || !newPassword) {
                feedback.className = 'feedback-msg is-error';
                feedback.textContent = 'Tous les champs sont requis.';
                return;
            }
            if (newPassword !== confirmPassword) {
                feedback.className = 'feedback-msg is-error';
                feedback.textContent = 'Les nouveaux mots de passe ne correspondent pas.';
                return;
            }
            if (newPassword.length < 8) {
                feedback.className = 'feedback-msg is-error';
                feedback.textContent = 'Le mot de passe doit contenir au moins 8 caractères.';
                return;
            }

            const btn = form.querySelector('[type=submit]');
            btn.disabled = true;
            try {
                const result = await apiPost('/auth/update-password.php', { current_password: currentPassword, new_password: newPassword });
                feedback.className = 'feedback-msg is-success';
                feedback.textContent = result.message || 'Mot de passe mis à jour.';
                form.reset();
                setTimeout(() => closeModal('modal-edit-password'), 1400);
            } catch (err) {
                feedback.className = 'feedback-msg is-error';
                feedback.textContent = err?.message || 'Impossible de changer le mot de passe.';
            } finally {
                btn.disabled = false;
            }
        });
    }

    // ── Preferences ──

    function bindPreferences() {
        const form     = document.querySelector('[data-preference-form]');
        const feedback = document.querySelector('[data-pref-feedback]');
        if (!form || !feedback) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            feedback.className = 'feedback-msg is-success';
            feedback.textContent = 'Préférences enregistrées.';
        });
    }

    // ── Init ──

    document.addEventListener('DOMContentLoaded', async () => {
        bindModalTriggers();
        bindPasswordToggles();
        bindPasswordModal();
        bindPreferences();

        try {
            const data = await apiGet('/modules/employee/profile.php');

            renderAvatar(data.user.photo, data.user.prenom, data.user.nom);
            bindPhotoUpload();

            const nameEl  = document.querySelector('[data-user-name]');
            const emailEl = document.querySelector('[data-user-email]');
            const teamEl  = document.querySelector('[data-profile-team]');
            if (nameEl)  nameEl.textContent  = `${data.user.prenom} ${data.user.nom}`;
            if (emailEl) emailEl.textContent = data.user.email;
            if (teamEl)  teamEl.textContent  = data.equipe ? data.equipe.nom : 'Sans équipe';

            bindEditModal(data.user);
            renderStats(data.stats);
            renderBadges(data.badges);
            renderHistory(data.historique);
        } catch (err) {
            console.error('Erreur profil:', err);
            const message = String(err?.message || 'Erreur profil');
            if (message.includes('404') || message.includes('introuvable')) {
                document.querySelector('[data-user-name]').textContent = 'Profil non trouvé';
            }
        }
    });
})();
