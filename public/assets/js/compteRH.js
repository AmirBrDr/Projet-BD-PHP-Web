// CompteRH - Gestion du profil Admin RH

class CompteRHManager {
    constructor() {
        this.storageKeys = {
            profile: 'gp_user_profile',
            security: 'gp_user_security',
            sessions: 'gp_user_sessions',
            token: 'gp_session_token',
        };

        this.user = {
            prenom: 'Utilisateur',
            nom: 'Test',
            email: 'utilisateur@entreprise.fr',
            department: 'Ressources Humaines',
            role: 'admin',
            avatar: null,
        };

        this.securityInfo = {
            daysSincePasswordChange: 45,
            lastLogin: new Date().toISOString(),
            twoFactorEnabled: false,
        };

        this.sessions = [];

        this.loadStoredData();
        this.ensureSessions();
        this.setupEventListeners();
        this.updateProfileDisplay();
        this.updateSecurityDisplay();
        this.renderSessions();
    }

    loadStoredData() {
        const profileRaw = localStorage.getItem(this.storageKeys.profile);
        if (profileRaw) {
            try {
                this.user = { ...this.user, ...JSON.parse(profileRaw) };
            } catch (error) {
                console.error('Erreur parsing profile:', error);
            }
        }

        const securityRaw = localStorage.getItem(this.storageKeys.security);
        if (securityRaw) {
            try {
                this.securityInfo = { ...this.securityInfo, ...JSON.parse(securityRaw) };
            } catch (error) {
                console.error('Erreur parsing security:', error);
            }
        }

        const sessionsRaw = localStorage.getItem(this.storageKeys.sessions);
        if (sessionsRaw) {
            try {
                const parsed = JSON.parse(sessionsRaw);
                this.sessions = Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('Erreur parsing sessions:', error);
            }
        }
    }

    saveAll() {
        localStorage.setItem(this.storageKeys.profile, JSON.stringify(this.user));
        localStorage.setItem(this.storageKeys.security, JSON.stringify(this.securityInfo));
        localStorage.setItem(this.storageKeys.sessions, JSON.stringify(this.sessions));
    }

    ensureSessions() {
        if (this.sessions.length > 0) {
            return;
        }

        this.sessions = [
            {
                id: `sess_${Date.now()}`,
                current: true,
                userAgent: navigator.userAgent || 'Navigateur inconnu',
                ipAddress: 'Locale',
                lastActivity: new Date().toISOString(),
            },
        ];
    }

    setupEventListeners() {
        const securityForm = document.getElementById('security-params-form');
        if (securityForm) {
            securityForm.addEventListener('submit', (e) => this.handleSecurityParamsSubmit(e));
        }

        const avatarInput = document.getElementById('profile-pic-input');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleProfilePictureUpload(e));
        }

        const newPasswordInput = document.getElementById('new-password');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => this.validatePasswordStrength(e));
        }

        const confirmPasswordInput = document.getElementById('confirm-password');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', (e) => this.validatePasswordMatch(e));
        }

        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-toggle-2fa]')) {
                e.preventDefault();
                this.handleToggle2FA();
            }

            if (e.target.matches('[data-logout]')) {
                e.preventDefault();
                this.logout();
            }

            if (e.target.matches('[data-session-id]')) {
                e.preventDefault();
                this.handleTerminateSession(e);
            }
        });
    }

    updateProfileDisplay() {
        const fullName = `${this.user.prenom} ${this.user.nom}`.trim();

        const nameEl = document.querySelector('[data-user-name]');
        if (nameEl) {
            nameEl.textContent = fullName;
        }

        const emailEl = document.querySelector('[data-user-email]');
        if (emailEl) {
            emailEl.textContent = this.user.email;
        }

        const roleEl = document.querySelector('[data-user-role]');
        if (roleEl) {
            roleEl.textContent = this.formatRole(this.user.role);
        }

        const roleDisplayEl = document.querySelector('[data-user-role-display]');
        if (roleDisplayEl) {
            roleDisplayEl.textContent = this.getRoleLabel(this.user.role);
        }

        const departmentEl = document.querySelector('[data-user-department]');
        if (departmentEl) {
            departmentEl.textContent = this.user.department || 'Non renseigné';
        }

        const displayNameInput = document.getElementById('display-name');
        if (displayNameInput) {
            displayNameInput.value = fullName;
        }

        const recoveryEmailInput = document.getElementById('recovery-email');
        if (recoveryEmailInput) {
            recoveryEmailInput.value = this.user.email;
        }

        const avatarImg = document.getElementById('avatar-img');
        const avatarIcon = document.getElementById('avatar-icon');
        if (avatarImg) {
            if (this.user.avatar) {
                avatarImg.src = this.user.avatar;
                avatarImg.style.display = 'block';
                if (avatarIcon) {
                    avatarIcon.style.display = 'none';
                }
            } else {
                avatarImg.style.display = 'none';
                if (avatarIcon) {
                    avatarIcon.style.display = 'block';
                }
            }
        }
    }

    updateSecurityDisplay() {
        const lastPwdEl = document.getElementById('last-pwd-change');
        if (lastPwdEl) {
            const days = Number(this.securityInfo.daysSincePasswordChange || 0);
            lastPwdEl.textContent = `Il y a ${days} jours (Recommandé: tous les 90 jours)`;
        }

        const lastLoginEl = document.getElementById('last-login');
        if (lastLoginEl) {
            const lastLogin = new Date(this.securityInfo.lastLogin || Date.now());
            lastLoginEl.textContent = `${lastLogin.toLocaleDateString('fr-FR')} à ${lastLogin.toLocaleTimeString('fr-FR')}`;
        }

        const twoFAEl = document.getElementById('twofa-status');
        if (twoFAEl) {
            if (this.securityInfo.twoFactorEnabled) {
                twoFAEl.innerHTML = 'Activée - <a href="#" data-toggle-2fa>Désactiver</a>';
            } else {
                twoFAEl.innerHTML = 'Désactivée - <a href="#" data-toggle-2fa>Configurer maintenant</a>';
            }
        }
    }

    renderSessions() {
        const sessionsList = document.getElementById('sessions-list');
        if (!sessionsList) {
            return;
        }

        if (this.sessions.length === 0) {
            sessionsList.innerHTML = '<p class="no-data">Aucune session active</p>';
            return;
        }

        sessionsList.innerHTML = this.sessions.map((session) => {
            const ua = this.parseUserAgent(session.userAgent || 'Navigateur - OS');
            const icon = this.getDeviceIcon(session.userAgent || '');
            const dateText = new Date(session.lastActivity).toLocaleDateString('fr-FR');

            return `
                <div class="session-item">
                    <div class="session-info">
                        <div class="session-device">
                            <i class="fas fa-${icon}"></i> ${ua}
                        </div>
                        <div class="session-ip">IP: ${session.ipAddress || 'Inconnue'}</div>
                        <div class="session-time">${dateText}</div>
                    </div>
                    ${!session.current ? '<button type="button" class="btn btn-sm btn-danger" data-session-id="' + session.id + '">Terminer</button>' : '<span style="color: var(--shell-accent); font-weight: bold; font-size: 0.85rem;">Actuelle</span>'}
                </div>
            `;
        }).join('');
    }

    handleProfilePictureUpload(e) {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showNotification('Veuillez sélectionner une image valide', 'error');
            e.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('L\'image doit faire moins de 5MB', 'error');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            this.user.avatar = event.target.result;
            this.saveAll();
            this.updateProfileDisplay();
            this.showNotification('Photo de profil mise à jour', 'success');
        };
        reader.readAsDataURL(file);
    }

    validatePasswordStrength(e) {
        const password = e.target.value;
        const strength = this.calculatePasswordStrength(password);

        if (password.length === 0) {
            e.target.style.borderColor = '';
            return;
        }

        if (strength < 2) {
            e.target.style.borderColor = '#f59e0b';
            return;
        }

        e.target.style.borderColor = '#10b981';
    }

    calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        return strength;
    }

    validatePasswordMatch(e) {
        const newPassword = document.getElementById('new-password')?.value || '';
        const confirmPassword = e.target.value;

        if (confirmPassword && newPassword !== confirmPassword) {
            e.target.setCustomValidity('Les mots de passe ne correspondent pas');
            return;
        }

        e.target.setCustomValidity('');
    }

    handleSecurityParamsSubmit(e) {
        e.preventDefault();

        const displayName = document.getElementById('display-name')?.value.trim() || '';
        const recoveryEmail = document.getElementById('recovery-email')?.value.trim() || '';
        const newPassword = document.getElementById('new-password')?.value || '';
        const confirmPassword = document.getElementById('confirm-password')?.value || '';

        if (!displayName) {
            this.showNotification('Veuillez entrer un nom d\'affichage', 'error');
            return;
        }

        if (!recoveryEmail || !this.validateEmail(recoveryEmail)) {
            this.showNotification('Veuillez entrer un email valide', 'error');
            return;
        }

        if (newPassword || confirmPassword) {
            if (!newPassword || !confirmPassword) {
                this.showNotification('Veuillez confirmer le mot de passe', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showNotification('Les mots de passe ne correspondent pas', 'error');
                return;
            }

            if (newPassword.length < 8) {
                this.showNotification('Le mot de passe doit faire au moins 8 caractères', 'error');
                return;
            }

            if (this.calculatePasswordStrength(newPassword) < 2) {
                this.showNotification('Le mot de passe est trop faible', 'error');
                return;
            }

            this.securityInfo.daysSincePasswordChange = 0;
        }

        const nameParts = displayName.split(' ').filter(Boolean);
        this.user.prenom = nameParts[0] || this.user.prenom;
        this.user.nom = nameParts.slice(1).join(' ') || this.user.nom;
        this.user.email = recoveryEmail;
        this.securityInfo.lastLogin = new Date().toISOString();

        this.saveAll();
        this.updateProfileDisplay();
        this.updateSecurityDisplay();

        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';

        this.showNotification('Profil mis à jour avec succès !', 'success');
    }

    handleToggle2FA() {
        const current = Boolean(this.securityInfo.twoFactorEnabled);
        const action = current ? 'désactiver' : 'activer';

        if (!confirm(`Êtes-vous sûr de vouloir ${action} le 2FA ?`)) {
            return;
        }

        this.securityInfo.twoFactorEnabled = !current;
        this.saveAll();
        this.updateSecurityDisplay();
        this.showNotification('2FA mis à jour', 'success');
    }

    handleTerminateSession(e) {
        const sessionId = e.target.getAttribute('data-session-id');
        if (!sessionId) {
            return;
        }

        if (!confirm('Êtes-vous sûr de vouloir terminer cette session ?')) {
            return;
        }

        this.sessions = this.sessions.filter((s) => s.id !== sessionId);
        this.saveAll();
        this.renderSessions();
        this.showNotification('Session terminée', 'success');
    }

    logout() {
        if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            return;
        }

        localStorage.removeItem(this.storageKeys.token);
        this.showNotification('Déconnexion...', 'info');
        setTimeout(() => {
            window.location.href = '/auth.html';
        }, 700);
    }

    showNotification(message, type = 'info') {
        const notificationsEl = document.getElementById('notifications');
        if (!notificationsEl) {
            console.log(`[${type}] ${message}`);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `${message} <button type="button" class="close-btn">&times;</button>`;

        notificationsEl.appendChild(notification);

        const closeBtn = notification.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => notification.remove());
        }

        setTimeout(() => notification.remove(), 5000);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    getDeviceIcon(userAgent) {
        if (userAgent.includes('Mobile')) return 'mobile-alt';
        if (userAgent.includes('Tablet')) return 'tablet-alt';
        return 'desktop';
    }

    parseUserAgent(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        return 'Navigateur';
    }

    formatRole(role) {
        const roles = {
            admin: 'ADMIN',
            employe: 'EMPLOYÉ',
            animateur: 'ANIMATEUR',
        };
        return roles[role] || String(role || '').toUpperCase();
    }

    getRoleLabel(role) {
        const labels = {
            admin: 'Administrateur RH',
            employe: 'Employé',
            animateur: 'Animateur',
        };
        return labels[role] || role;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CompteRHManager();
});
