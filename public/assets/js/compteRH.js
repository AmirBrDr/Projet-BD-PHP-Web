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

    async loadProfile() {
        try {
            const token = localStorage.getItem('gp_token') || '';
            const response = await fetch('/api/modules/profile/index.php', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement du profil');
            }

            const data = await response.json();
            const profile = data.profile || {};

            this.user.prenom = profile.prenomUser || this.user.prenom;
            this.user.nom = profile.nomUser || this.user.nom;
            this.user.email = profile.email || this.user.email;
            this.user.department = profile.departementEmploye || this.user.department;
            this.user.role = profile.role || this.user.role;
            this.user.avatar = profile.pdpUser || this.user.avatar;
        } catch (error) {
            console.error('Erreur lors du chargement du profil:', error);
        }
    }

    async loadSecurityInfo() {
        try {
            const token = localStorage.getItem('gp_token') || '';
            const [securityResponse, sessionsResponse] = await Promise.all([
                fetch('/api/modules/profile/security.php?action=info', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
                fetch('/api/modules/profile/security.php?action=sessions', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
            ]);

            if (!securityResponse.ok) {
                throw new Error('Erreur lors du chargement des infos de sécurité');
            }
            if (!sessionsResponse.ok) {
                throw new Error('Erreur lors du chargement des sessions');
            }

            const securityData = await securityResponse.json();
            const sessionsData = await sessionsResponse.json();

            if (securityData.security) {
                this.securityInfo = {
                    lastPasswordChange: securityData.security.lastPasswordChange || new Date().toISOString(),
                    daysSincePasswordChange: Number(securityData.security.daysSincePasswordChange || 0),
                    lastLogin: securityData.security.lastLogin || new Date().toISOString(),
                    twoFactorEnabled: Boolean(securityData.security.twoFactorEnabled),
                };
            }

            if (sessionsData.sessions && Array.isArray(sessionsData.sessions)) {
                this.sessions = sessionsData.sessions.map((session, index) => ({
                    id: session.id_session,
                    current: index === 0,
                    userAgent: session.user_agent || 'Navigateur inconnu',
                    ipAddress: session.ip_address || 'Inconnue',
                    lastActivity: session.derniere_activite || session.date_creation || new Date().toISOString(),
                }));
            }
        } catch (error) {
            console.error('Erreur lors du chargement de security info:', error);
        }
    }

    async refreshData() {
        await this.loadProfile();
        await this.loadSecurityInfo();
        this.ensureSessions();
        this.updateProfileDisplay();
        this.updateSecurityDisplay();
        this.renderSessions();
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

            if (e.target.closest('[data-logout]')) {
                e.preventDefault();
                this.logout();
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
        this.clearTwoFAQr();

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

    showTwoFAQr(secret, uri) {
        const container = document.getElementById('twofa-qr-container');
        if (!container) {
            return;
        }

        const qrImageUrl = uri ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri)}` : '';
        const qrImage = uri ? `<img src="${qrImageUrl}" alt="QR Code 2FA" style="display:block; margin-bottom:0.75rem; max-width:100%;"/>` : '';
        const secretText = secret ? `<div style="color:#fff; font-size:0.9rem; word-break:break-all;"><strong>Secret :</strong> ${secret}</div>` : '';

        container.innerHTML = `
            <div class="twofa-qr-content" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 1rem; border-radius: 0.5rem;">
                ${qrImage}
                ${secretText}
                <p style="margin:0.75rem 0 0; font-size:0.9rem; color: rgba(255,255,255,0.75);">Scannez ce QR code avec votre application Authenticator.</p>
            </div>
        `;
        container.style.display = 'block';
    }

    clearTwoFAQr() {
        const container = document.getElementById('twofa-qr-container');
        if (!container) {
            return;
        }
        container.style.display = 'none';
        container.innerHTML = '';
    }

    buildTotpUri(secret) {
        const account = encodeURIComponent(this.user.email || 'utilisateur@example.com');
        const issuer = encodeURIComponent('GreenPulse');
        return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
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
                    <span style="color: var(--shell-accent); font-weight: bold; font-size: 0.85rem;">${session.current ? 'Actuelle' : 'Autre session'}</span>
                </div>
            `;
        }).join('');
    }

    async handleProfilePictureUpload(e) {
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

        const token = localStorage.getItem('gp_token') || '';
        if (!token) {
            this.showNotification('Session invalide, veuillez vous reconnecter', 'error');
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/modules/profile/index.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'upload de la photo');
            }

            const data = await response.json();
            if (data.avatar) {
                this.user.avatar = data.avatar;
                this.saveAll();
                this.updateProfileDisplay();
                this.showNotification('Photo de profil sauvegardée', 'success');
            } else {
                throw new Error('Aucune photo renvoyée par le serveur');
            }
        } catch (error) {
            console.error('Erreur upload avatar:', error);
            this.showNotification(error.message || 'Impossible de sauvegarder la photo', 'error');
            e.target.value = '';
        }

        e.target.setCustomValidity('');
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

    async handleSecurityParamsSubmit(e) {
        e.preventDefault();

        const displayName = document.getElementById('display-name')?.value.trim() || '';
        const recoveryEmail = document.getElementById('recovery-email')?.value.trim() || '';
        const currentPassword = document.getElementById('current-password')?.value || '';
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

        const token = localStorage.getItem('gp_token') || '';
        if (!token) {
            this.showNotification('Session invalide, veuillez vous reconnecter', 'error');
            return;
        }

        try {
            if (newPassword || confirmPassword) {
                if (!currentPassword) {
                    this.showNotification('Veuillez entrer votre mot de passe actuel', 'error');
                    return;
                }

                if (!newPassword || !confirmPassword) {
                    this.showNotification('Veuillez confirmer le nouveau mot de passe', 'error');
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

                if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
                    this.showNotification('Le mot de passe doit contenir au moins une majuscule et un chiffre', 'error');
                    return;
                }

                if (this.calculatePasswordStrength(newPassword) < 2) {
                    this.showNotification('Le mot de passe est trop faible', 'error');
                    return;
                }

                const passwordResponse = await fetch('/api/modules/profile/security.php?action=change-password', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                });

                if (!passwordResponse.ok) {
                    const errorData = await passwordResponse.json();
                    throw new Error(errorData.message || 'Erreur lors du changement de mot de passe');
                }

                this.securityInfo.daysSincePasswordChange = 0;
                this.securityInfo.lastPasswordChange = new Date().toISOString();
            }

            const nameParts = displayName.split(' ').filter(Boolean);
            const prenomUser = nameParts[0] || this.user.prenom;
            const nomUser = nameParts.slice(1).join(' ') || this.user.nom;

            const profileResponse = await fetch('/api/modules/profile/index.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prenomUser,
                    nomUser,
                    email: recoveryEmail,
                }),
            });

            if (!profileResponse.ok) {
                const errorData = await profileResponse.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour du profil');
            }

            this.user.prenom = prenomUser;
            this.user.nom = nomUser;
            this.user.email = recoveryEmail;
            this.securityInfo.lastLogin = new Date().toISOString();
            this.saveAll();
            this.updateProfileDisplay();
            this.updateSecurityDisplay();

            const currentPasswordInput = document.getElementById('current-password');
            const newPasswordInput = document.getElementById('new-password');
            const confirmPasswordInput = document.getElementById('confirm-password');
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';

            this.showNotification('Profil mis à jour avec succès', 'success');
        } catch (error) {
            console.error(error);
            this.showNotification(error.message || 'Erreur lors de la mise à jour', 'error');
        }
    }

    async handleToggle2FA() {
        const current = Boolean(this.securityInfo.twoFactorEnabled);
        const action = current ? 'désactiver' : 'activer';

        if (!confirm(`Êtes-vous sûr de vouloir ${action} l'authentification à deux facteurs ?`)) {
            return;
        }

        const token = localStorage.getItem('gp_token') || '';
        if (!token) {
            this.showNotification('Session invalide, veuillez vous reconnecter', 'error');
            return;
        }

        try {
            const response = await fetch('/api/modules/profile/security.php?action=toggle-2fa', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enable: !current,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la modification du 2FA');
            }

            const data = await response.json();
            if (!data) {
                throw new Error('Réponse invalide du serveur');
            }

            this.securityInfo.twoFactorEnabled = !current;
            this.saveAll();
            this.updateSecurityDisplay();

            if (data.secret || data.otpauth_uri) {
                const uri = data.otpauth_uri || this.buildTotpUri(data.secret);
                const secret = data.secret || '';
                this.showTwoFAQr(secret, uri);
            }

            this.showNotification('Authentification à deux facteurs mise à jour', 'success');
        } catch (error) {
            console.error('Erreur 2FA:', error);
            this.showNotification(error.message || 'Erreur lors de la mise à jour du 2FA', 'error');
        }
    }

    handleTerminateSession(buttonOrEvent) {
        const sessionButton = buttonOrEvent.closest ? buttonOrEvent : buttonOrEvent.target?.closest('[data-session-id]');
        if (!sessionButton) {
            return;
        }

        const sessionId = sessionButton.getAttribute('data-session-id');
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
        const ua = (userAgent || '').toLowerCase();
        if (/ipad|tablet|kindle|silk/.test(ua)) return 'tablet-alt';
        if (/mobile|iphone|ipod|android|blackberry|iemobile|opera mini/.test(ua)) return 'mobile-alt';
        return 'desktop';
    }

    parseUserAgent(userAgent) {
        const ua = (userAgent || '').toLowerCase();

        if (/edg\//.test(ua) || ua.includes('edge')) return 'Microsoft Edge';
        if (/opr\//.test(ua) || ua.includes('opera')) return 'Opera';
        if (ua.includes('chrome') && !ua.includes('edg/') && !ua.includes('opr/') && !ua.includes('chromium')) return 'Chrome';
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')) return 'Safari';
        if (ua.includes('brave')) return 'Brave';
        if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer';

        return 'Navigateur inconnu';
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

document.addEventListener('DOMContentLoaded', async () => {
    const manager = new CompteRHManager();
    await manager.refreshData();
});