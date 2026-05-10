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

    function statusLabel(status) {
        const map = {
            pending: 'En attente',
            approved: 'Approuvee',
            rejected: 'Refusee',
        };
        return map[status] || status || '';
    }

    function isImageProof(value) {
        const text = String(value || '').trim();
        return /^\/image\//.test(text) || /\.(png|jpe?g|webp)$/i.test(text);
    }

    function renderProof(value) {
        const text = String(value || '').trim();
        if (!text) {
            return '';
        }
        if (isImageProof(text)) {
            return `<div class="proof-media"><img src="${text}" alt="Preuve soumise" loading="lazy" /></div>`;
        }
        return `<p class="proof-text">${text}</p>`;
    }

    let selectedActionId = 0;
    let defiId = 0;
    let isBlocked = false;
    let hasPendingSubmission = false;
    let actionState = new Map();

    function setBlockedState(blocked, reason, date) {
        isBlocked = Boolean(blocked);
        if (!isBlocked) {
            return;
        }

        const reasonText = reason ? ` Motif : ${reason}` : '';
        const dateText = date ? ` (bloque le ${new Date(date).toLocaleDateString('fr-FR')})` : '';
        const message = `Vous etes bloque pour ce defi.${reasonText}${dateText}`;

        const formFeedback = document.querySelector('[data-form-feedback]');
        if (formFeedback) {
            formFeedback.className = 'feedback-msg is-warning';
            formFeedback.textContent = message;
        }

        const forumFeedback = document.querySelector('[data-forum-feedback]');
        if (forumFeedback) {
            forumFeedback.className = 'feedback-msg is-warning';
            forumFeedback.textContent = message;
        }

        const submissionForm = document.querySelector('[data-submission-form]');
        submissionForm?.querySelectorAll('input, textarea, button').forEach((el) => {
            el.disabled = true;
        });

        const forumForm = document.querySelector('[data-forum-form]');
        forumForm?.querySelectorAll('input, textarea, button').forEach((el) => {
            el.disabled = true;
        });
    }

    function setPendingState(pending) {
        hasPendingSubmission = Boolean(pending);
        if (isBlocked) {
            return;
        }

        const submissionForm = document.querySelector('[data-submission-form]');
        const formFeedback = document.querySelector('[data-form-feedback]');
        if (!submissionForm) {
            return;
        }

        submissionForm.querySelectorAll('input, textarea, button').forEach((el) => {
            el.disabled = hasPendingSubmission;
        });

        if (formFeedback && hasPendingSubmission && !formFeedback.classList.contains('is-success')) {
            formFeedback.className = 'feedback-msg is-warning';
            formFeedback.textContent = 'Une soumission est deja en attente de validation.';
        }
    }

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

        actionState = new Map(actions.map((a) => [a.id, a]));

        if (alreadyDone) {
            selectedActionId = 0;
            host.innerHTML = '<p style="color:var(--shell-muted)">Ce défi a déjà été validé ce mois-ci. ✓</p>';
            return;
        }

        const selectable = actions.filter((a) => !a.valide && a.reply_status !== 'pending');
        const firstSelectable = selectable[0];

        if (!isBlocked && !hasPendingSubmission) {
            selectedActionId = firstSelectable ? firstSelectable.id : 0;
        } else {
            selectedActionId = 0;
        }

        host.innerHTML = actions.map((a) => {
            const isPending = a.reply_status === 'pending';
            const isRejected = a.reply_status === 'rejected';
            const isDone = a.valide;
            const statusText = isDone ? '✓ Validee' : isPending ? 'En attente' : isRejected ? 'Refusee' : '';
            const statusClass = isDone ? 'is-approved' : isPending ? 'is-pending' : isRejected ? 'is-rejected' : '';
            const disabled = isBlocked || hasPendingSubmission || isDone || isPending;
            const selectedClass = a.id === selectedActionId ? ' is-selected' : '';
            const cardClass = `${isDone ? ' is-done' : ''}${statusClass ? ' ' + statusClass : ''}${selectedClass}`;
            const statusBadge = statusText ? `<small class="action-status ${statusClass}">${statusText}</small>` : '';

            return `
            <button class="option-card${cardClass}"
                    type="button"
                    data-action-id="${a.id}"
                    ${disabled ? 'disabled' : ''}>
                <h3>${a.nom}</h3>
                <p>${a.description || ''}</p>
                ${statusBadge}
            </button>`;
        }).join('');

        if (!isBlocked && !hasPendingSubmission) {
            host.querySelectorAll('[data-action-id]:not([disabled])').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedActionId = parseInt(btn.dataset.actionId, 10);
                    host.querySelectorAll('[data-action-id]').forEach(b => b.classList.remove('is-selected'));
                    btn.classList.add('is-selected');
                });
            });
        }
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

    function renderHistory(reponses, historique = []) {
        const host = document.querySelector('[data-history-list]');
        if (!host) return;

        const list = Array.isArray(reponses) && reponses.length
            ? reponses.map((r) => ({
                action: r.action || 'Action',
                statut: r.statut,
                date: r.date,
                date_traitement: r.date_traitement,
                reponse: r.reponse,
                commentaire: r.commentaire,
            }))
            : historique.map((h) => ({
                action: h.action,
                statut: 'approved',
                date: h.date,
                reponse: h.preuve,
                commentaire: null,
                date_traitement: null,
            }));

        if (!list.length) {
            host.innerHTML = '<li class="history-item" style="color:var(--shell-muted)">Aucune soumission encore.</li>';
            return;
        }

        host.innerHTML = list.map((item) => {
            const statusClass = item.statut ? `status-${item.statut}` : '';
            const statusChip = item.statut ? `<span class="status-chip ${statusClass}">${statusLabel(item.statut)}</span>` : '';
            const sentDate = item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '';
            const treatedDate = item.date_traitement ? new Date(item.date_traitement).toLocaleDateString('fr-FR') : '';
            const sentLine = sentDate ? `<small>Envoye: ${sentDate}</small>` : '';
            const treatedLine = treatedDate ? `${sentDate ? '<br />' : ''}<small>Traite: ${treatedDate}</small>` : '';
            const proofLine = renderProof(item.reponse);
            const commentLine = item.commentaire ? `<p class="comment-box">Commentaire animateur: ${item.commentaire}</p>` : '';

            return `
            <li class="history-item">
                <div class="history-head">
                    <strong>${item.action}</strong>
                    ${statusChip}
                </div>
                ${sentLine}
                ${treatedLine}
                ${proofLine}
                ${commentLine}
            </li>`;
        }).join('');
    }

    function applyChallengeData(data) {
        renderHead(data.defi);
        setBlockedState(Boolean(data.blocked), data.blocked_reason, data.blocked_at);

        hasPendingSubmission = Boolean(data.has_pending) || (data.reponses || []).some((r) => r.statut === 'pending');
        renderActions(data.actions || [], data.deja_valide);
        setPendingState(hasPendingSubmission);
        renderForum(data.messages || []);
        renderHistory(data.reponses || [], data.historique || []);

        if (data.deja_valide) {
            setText('[data-challenge-progress]', 'Deja valide ✓');
        } else if (hasPendingSubmission) {
            setText('[data-challenge-progress]', 'En attente de validation');
        }
    }

    function bindSubmissionForm() {
        const form = document.querySelector('[data-submission-form]');
        const feedback = document.querySelector('[data-form-feedback]');
        if (!form || !feedback) return;

        const fileInput = form.querySelector('#proofPhoto');
        const clearBtn = form.querySelector('[data-clear-proof]');
        const updateClearState = () => {
            const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
            if (clearBtn) {
                clearBtn.classList.toggle('is-visible', Boolean(hasFile));
            }
        };
        fileInput?.addEventListener('change', updateClearState);
        clearBtn?.addEventListener('click', () => {
            if (!fileInput) return;
            fileInput.value = '';
            fileInput.dispatchEvent(new Event('change'));
        });
        form.addEventListener('reset', () => {
            requestAnimationFrame(updateClearState);
        });
        updateClearState();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            feedback.className = 'feedback-msg';
            feedback.textContent = '';

            if (isBlocked) {
                feedback.className = 'feedback-msg is-warning';
                feedback.textContent = 'Vous etes bloque pour ce defi.';
                return;
            }

            if (hasPendingSubmission) {
                feedback.className = 'feedback-msg is-warning';
                feedback.textContent = 'Une soumission est deja en attente de validation.';
                return;
            }

            if (!selectedActionId) {
                feedback.textContent = 'Sélectionnez une action.';
                return;
            }

            const selectedAction = actionState.get(selectedActionId);
            if (!selectedAction) {
                feedback.textContent = 'Sélectionnez une action.';
                return;
            }
            if (selectedAction.reply_status === 'pending') {
                feedback.className = 'feedback-msg is-warning';
                feedback.textContent = 'Cette action est deja en attente de validation.';
                return;
            }
            if (selectedAction.valide) {
                feedback.className = 'feedback-msg is-warning';
                feedback.textContent = 'Cette action est deja validee.';
                return;
            }

            const fd = new FormData(form);
            const hasPhoto = fd.get('preuvePhoto') && fd.get('preuvePhoto').size > 0;
            const hasText = String(fd.get('proofText') || '').trim().length > 0;
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
                feedback.textContent = 'Soumission envoyee. En attente de validation.';
                form.reset();
                submitBtn.disabled = false;
                const data = await apiGet('/modules/employee/challenge-detail.php?id=' + defiId);
                applyChallengeData(data);
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

            if (isBlocked) {
                feedback.className = 'feedback-msg is-warning';
                feedback.textContent = 'Vous etes bloque pour ce defi.';
                return;
            }
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
            applyChallengeData(data);
        } catch (err) {
            console.error('Erreur détail défi:', err);
            setText('[data-challenge-title]', 'Erreur de chargement');
        }
    });
})();
