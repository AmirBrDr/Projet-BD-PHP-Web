// Fichier: public/assets/js/Employe/detailDefi.js - Logique frontend et interactions.
(() => {
    const API_BASE = '/api';
    const token = () => localStorage.getItem('gp_token');

    async function apiGet(path) {
        const res = await fetch(API_BASE + path, {
            headers: { 'Authorization': 'Bearer ' + token() }
        });
        if (!res.ok) throw new Error((await res.json()).message || res.status);
        return res.json();
    }

    async function apiPost(path, body) {
        const res = await fetch(API_BASE + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
            body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || res.status);
        return json;
    }

    function setText(selector, value) {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    }

    let selectedActionId = 0;
    let defiId = 0;

    function renderHead(defi) {
        setText('[data-challenge-theme]', 'Thématique : ' + defi.theme);
        setText('[data-challenge-title]', defi.nom);
        setText('[data-challenge-description]', defi.description || '');
        setText('[data-challenge-points]', '+' + defi.points + ' pts');
        setText('[data-challenge-co2]', defi.co2 + ' kg CO₂');
        document.title = 'GreenPulse - ' + defi.nom;
    }

    function renderActions(actions, alreadyDone) {
        const host = document.querySelector('[data-action-options]');
        if (!host) return;

        const available = actions.filter(a => !a.valide);
        if (alreadyDone && !available.length) {
            host.innerHTML = '<p style="color:var(--shell-muted)">Toutes les actions de ce défi ont été validées.</p>';
            return;
        }

        const firstAvailable = available[0];
        selectedActionId = firstAvailable ? firstAvailable.id : 0;

        host.innerHTML = actions.map(a => `
            <button class="option-card${a.valide ? ' is-done' : (a.id === selectedActionId ? ' is-selected' : '')}"
                    type="button"
                    data-action-id="${a.id}"
                    ${a.valide ? 'disabled' : ''}>
                <h3>${a.nom}</h3>
                <p>${a.description || ''}</p>
                ${a.valide ? '<small style="color:#94bb39">✓ Validée</small>' : ''}
            </button>`).join('');

        host.querySelectorAll('[data-action-id]:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedActionId = parseInt(btn.dataset.actionId, 10);
                host.querySelectorAll('[data-action-id]').forEach(b => b.classList.remove('is-selected'));
                btn.classList.add('is-selected');
            });
        });
    }

    function formatDateTime(dateStr) {
        const d = new Date(dateStr);
        const date = d.toLocaleDateString('fr-FR');
        const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return `${date} à ${time}`;
    }

    function renderForum(messages) {
        const host = document.querySelector('[data-forum-list]');
        if (!host) return;
        if (!messages.length) {
            host.innerHTML = '<li class="forum-item" style="color:var(--shell-muted)">Aucun message pour le moment.</li>';
            return;
        }
        host.innerHTML = messages.map(m => `
            <li class="forum-item">
                <strong>${m.auteur}</strong><br />
                ${m.texte}<br />
                <small>${formatDateTime(m.date)}</small>
            </li>`).join('');
    }

    function renderHistory(historique) {
        const host = document.querySelector('[data-history-list]');
        if (!host) return;
        if (!historique.length) {
            host.innerHTML = '<li class="history-item" style="color:var(--shell-muted)">Aucune soumission encore.</li>';
            return;
        }
        host.innerHTML = historique.map(h => `
            <li class="history-item">
                <strong>${h.action}</strong><br />
                <small>${new Date(h.date).toLocaleDateString('fr-FR')}</small>
                ${h.preuve ? `<br /><span style="color:var(--shell-muted);font-size:12px">${h.preuve}</span>` : ''}
            </li>`).join('');
    }

    function bindSubmissionForm() {
        const form = document.querySelector('[data-submission-form]');
        const feedback = document.querySelector('[data-form-feedback]');
        if (!form || !feedback) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            feedback.className = 'feedback-msg';
            feedback.textContent = '';

            if (!selectedActionId) {
                feedback.textContent = 'Sélectionnez une action.';
                return;
            }

            const fd = new FormData(form);
            const hasPhoto = fd.get('preuvePhoto') && fd.get('preuvePhoto').size > 0;
            const hasText  = String(fd.get('proofText') || '').trim().length > 0;
            if (!hasPhoto && !hasText) {
                feedback.textContent = 'Ajoutez une photo ou un commentaire de preuve.';
                return;
            }

            fd.set('defi_id', defiId);
            fd.set('action_id', selectedActionId);

            const submitBtn = form.querySelector('[type=submit]');
            submitBtn.disabled = true;
            try {
                const res = await fetch(API_BASE + '/modules/employee/submit-action.php', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token() },
                    body: fd,
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || 'HTTP ' + res.status);
                feedback.className = 'feedback-msg is-success';
                feedback.textContent = 'Action validée avec succès ! Vos points ont été crédités.';
                form.reset();
                const data = await apiGet('/modules/employee/challenge-detail.php?id=' + defiId);
                renderActions(data.actions, data.deja_valide);
                renderHistory(data.historique);
            } catch (err) {
                feedback.textContent = err.message || 'Erreur lors de la soumission.';
                submitBtn.disabled = false;
            }
        });
    }

    function bindForumForm() {
        const form = document.querySelector('[data-forum-form]');
        const feedback = document.querySelector('[data-forum-feedback]');
        if (!form || !feedback) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = String(new FormData(form).get('message') || '').trim();
            if (!message) return;

            const btn = form.querySelector('[type=submit]');
            btn.disabled = true;
            try {
                await apiPost('/modules/employee/forum-message.php', { defi_id: defiId, message });
                form.reset();
                feedback.className = 'feedback-msg is-success';
                feedback.textContent = 'Message publié.';
                // Refresh forum
                const data = await apiGet('/modules/employee/challenge-detail.php?id=' + defiId);
                renderForum(data.messages);
            } catch (err) {
                feedback.textContent = err.message || 'Erreur.';
            }
            btn.disabled = false;
        });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const params = new URLSearchParams(window.location.search);
        defiId = parseInt(params.get('id') || '0', 10);

        if (!defiId) {
            setText('[data-challenge-title]', 'Défi introuvable');
            return;
        }

        bindSubmissionForm();
        bindForumForm();

        try {
            const data = await apiGet('/modules/employee/challenge-detail.php?id=' + defiId);
            renderHead(data.defi);
            renderActions(data.actions, data.deja_valide);
            renderForum(data.messages);
            renderHistory(data.historique);

            if (data.deja_valide) {
                setText('[data-challenge-progress]', 'Déjà validé ✓');
            }
        } catch (err) {
            console.error('Erreur détail défi:', err);
            setText('[data-challenge-title]', 'Erreur de chargement');
        }
    });
})();
