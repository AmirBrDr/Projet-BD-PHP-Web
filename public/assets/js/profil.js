/**
 * File: public/assets/js/profil.js
 * Profile page management - handles user profile, security settings, and password changes
 */

const API_BASE = '/api';
const STORAGE_KEY = 'gp_token';

class ProfileManager {
    constructor() {
        this.userId = null;
        this.userRole = null;
        this.token = localStorage.getItem(STORAGE_KEY);
        this.init();
    }

    init() {
        if (!this.token) {
            this.redirect('/');
            return;
        }

        this.setupEventListeners();
        this.loadProfile();
        this.loadSecurityInfo();
        this.loadSessions();
    }

    setupEventListeners() {
        // Security parameters form
        const securityForm = document.getElementById('security-params-form');
        if (securityForm) {
            securityForm.addEventListener('submit', (e) => this.handleSecurityParamsSubmit(e));
        }

        // Profile picture upload
        const profilePicInput = document.getElementById('profile-pic-input');
        if (profilePicInput) {
            profilePicInput.addEventListener('change', (e) => this.handleProfilePictureUpload(e));
        }

        // 2FA toggle
        const toggle2FA = document.querySelector('[data-toggle-2fa]');
        if (toggle2FA) {
            toggle2FA.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleToggle2FA();
            });
        }

        // Logout button
        const logoutBtn = document.querySelector('[data-logout]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async loadProfile() {
        try {
            const response = await fetch(`${API_BASE}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.redirect('/');
                    return;
                }
                throw new Error('Erreur lors du chargement du profil');
            }

            const data = await response.json();
            const profile = data.profile;

            this.userId = profile.idUser;
            this.userRole = profile.role;

            // Populate profile info
            document.querySelector('[data-user-name]').textContent = `${profile.prenomUser} ${profile.nomUser}`;
            document.querySelector('[data-user-email]').textContent = profile.email;
            document.querySelector('[data-user-role]').textContent = this.formatRole(profile.role);
            document.querySelector('[data-user-role-display]').textContent = this.getRoleLabel(profile.role);
            document.querySelector('[data-user-department]').textContent = profile.departementEmploye || 'Non renseigné';

            // Populate form fields
            document.getElementById('display-name').value = `${profile.prenomUser} ${profile.nomUser}`;
            document.getElementById('recovery-email').value = profile.email;

            // Mettre à jour l'image de profil si elle existe
            if (profile.pdpUser) {
                const avatarImg = document.getElementById('avatar-img');
                if (avatarImg) {
                    avatarImg.src = profile.pdpUser + '?t=' + Date.now();
                    avatarImg.style.display = 'block';
                }
                // Masquer l'icône
                const avatarIcon = document.getElementById('avatar-icon');
                if (avatarIcon) {
                    avatarIcon.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification('Erreur lors du chargement du profil', 'error');
        }
    }

    async loadSecurityInfo() {
        try {
            const response = await fetch(`${API_BASE}/profile/security?action=info`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des infos de sécurité');
            }

            const data = await response.json();
            const security = data.security;

            // Update security info display
            const lastPwdEl = document.getElementById('last-pwd-change');
            if (lastPwdEl) {
                lastPwdEl.textContent = `Il y a ${security.daysSincePasswordChange} jours (Recommandé: tous les 90 jours)`;
            }

            const lastLoginEl = document.getElementById('last-login');
            if (lastLoginEl && security.lastLogin) {
                const date = new Date(security.lastLogin);
                lastLoginEl.textContent = `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`;
            }

            const twoFAEl = document.getElementById('twofa-status');
            if (twoFAEl) {
                if (security.twoFactorEnabled) {
                    twoFAEl.innerHTML = 'Activée - <a href="#" data-toggle-2fa>Désactiver</a>';
                } else {
                    twoFAEl.innerHTML = 'Désactivée - <a href="#" data-toggle-2fa>Configurer maintenant</a>';
                }
                const toggle2FABtn = document.querySelector('[data-toggle-2fa]');
                if (toggle2FABtn) {
                    toggle2FABtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.handleToggle2FA();
                    });
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async loadSessions() {
        try {
            const response = await fetch(`${API_BASE}/profile/security?action=sessions`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des sessions');
            }

            const data = await response.json();
            const sessions = data.sessions || [];

            const sessionsList = document.getElementById('sessions-list');
            if (sessionsList) {
                if (sessions.length === 0) {
                    sessionsList.innerHTML = '<p class="no-data">Aucune session active</p>';
                } else {
                    sessionsList.innerHTML = sessions.map(session => {
                        const date = new Date(session.derniere_activite);
                        return `
                            <div class="session-item">
                                <div class="session-info">
                                    <div class="session-device">
                                        <i class="fas fa-desktop"></i> ${this.parseUserAgent(session.user_agent)}
                                    </div>
                                    <div class="session-ip">IP: ${session.ip_address}</div>
                                    <div class="session-time">${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}</div>
                                </div>
                                <button type="button" class="btn btn-sm btn-danger" data-logout-session="${session.id_session}">
                                    Terminer
                                </button>
                            </div>
                        `;
                    }).join('');

                    // Add event listeners for logout buttons
                    sessionsList.querySelectorAll('[data-logout-session]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const sessionId = e.target.dataset.logoutSession;
                            this.handleLogoutSession(sessionId);
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    async handleSecurityParamsSubmit(e) {
        e.preventDefault();

        const displayName = document.getElementById('display-name').value.trim();
        const recoveryEmail = document.getElementById('recovery-email').value.trim();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validation
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
        }

        try {
            // Update profile info
            const nameParts = displayName.split(' ').filter(p => p.trim() !== '');
            let prenomUser = nameParts[0] || '';
            let nomUser = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const updateData = {
                prenomUser,
                nomUser,
                email: recoveryEmail,
            };

            // If password change requested, do it first before profile update
            if (newPassword) {
                const currentPassword = prompt('Veuillez entrer votre mot de passe actuel pour confirmer:');
                if (!currentPassword) {
                    this.showNotification('Changement de mot de passe annulé', 'info');
                    return;
                }

                console.log('Envoi changement mot de passe...');
                const pwdResponse = await fetch(`${API_BASE}/profile/security?action=change-password`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                });

                console.log('Réponse changement mot de passe:', pwdResponse.status, pwdResponse.statusText);
                
                if (!pwdResponse.ok) {
                    const errorData = await pwdResponse.json();
                    console.error('Erreur API:', errorData);
                    throw new Error(errorData.message || 'Erreur lors du changement de mot de passe');
                }
                
                console.log('Mot de passe changé avec succès!');

                // Clear password fields
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                
                this.showNotification('Mot de passe changé avec succès', 'success');
            }

            // Then update profile
            console.log('Envoi mise à jour profil...');
            const response = await fetch(`${API_BASE}/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            console.log('Réponse mise à jour profil:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API:', errorData);
                throw new Error(errorData.message || 'Erreur lors de la mise à jour');
            }

            console.log('Profil mis à jour avec succès!');
            this.showNotification('Profil mis à jour avec succès', 'success');
            this.loadProfile();
            this.loadSecurityInfo();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async handleToggle2FA() {
        if (!confirm('Êtes-vous sûr de vouloir ' + (document.getElementById('twofa-status').innerHTML.includes('Activée') ? 'désactiver' : 'activer') + ' l\'authentification à deux facteurs?')) {
            return;
        }

        try {
            const isCurrentlyEnabled = document.getElementById('twofa-status').innerHTML.includes('Activée');
            
            const response = await fetch(`${API_BASE}/profile/security?action=toggle-2fa`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enable: !isCurrentlyEnabled,
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la modification du 2FA');
            }

            const data = await response.json();
            
            if (data.secret_generated) {
                alert(`Secret généré: ${data.secret}\n\nScannez ce code avec votre application authenticator (Google Authenticator, Microsoft Authenticator, Authy, etc.)`);
            }

            this.showNotification('Authentification à deux facteurs mise à jour', 'success');
            this.loadSecurityInfo();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification(error.message, 'error');
        }
    }

    async handleLogoutSession(sessionId) {
        if (!confirm('Êtes-vous sûr de vouloir terminer cette session?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/profile/security?action=logout-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: parseInt(sessionId),
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la fermeture de la session');
            }

            this.showNotification('Session terminée avec succès', 'success');
            this.loadSessions();
        } catch (error) {
            console.error('Erreur:', error);
            this.showNotification(error.message, 'error');
        }
    }

    logout() {
        localStorage.removeItem(STORAGE_KEY);
        this.redirect('/');
    }

    redirect(path) {
        window.location.href = path;
    }

    showNotification(message, type = 'info') {
        const notificationsEl = document.getElementById('notifications');
        if (!notificationsEl) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${message}
            <button type="button" class="close-btn">&times;</button>
        `;

        notificationsEl.appendChild(notification);

        const closeBtn = notification.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => notification.remove());

        setTimeout(() => notification.remove(), 5000);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    formatRole(role) {
        const roles = {
            'admin': 'ADMIN',
            'employe': 'EMPLOYÉ',
            'animateur': 'ANIMATEUR',
        };
        return roles[role] || role.toUpperCase();
    }

    getRoleLabel(role) {
        const labels = {
            'admin': 'Administrateur RH',
            'employe': 'Employé',
            'animateur': 'Animateur',
        };
        return labels[role] || role;
    }

    parseUserAgent(userAgent) {
        // Simple UA parsing
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Navigateur inconnu';
    }

    async handleProfilePictureUpload(e) {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        // Vérifier que c'est une image
        if (!file.type.startsWith('image/')) {
            this.showNotification('❌ Veuillez sélectionner une image valide', 'error');
            e.target.value = '';
            return;
        }

        // Vérifier la taille (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('❌ L\'image doit faire moins de 5MB', 'error');
            e.target.value = '';
            return;
        }

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${API_BASE}/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'upload');
            }

            const data = await response.json();
            this.showNotification('✅ Photo de profil mise à jour avec succès', 'success');
            
            // Mettre à jour l'image affichée immédiatement
            const avatarImg = document.getElementById('avatar-img');
            if (avatarImg && data.avatar) {
                avatarImg.src = data.avatar + '?t=' + Date.now();
                avatarImg.style.display = 'block';
            }
            
            // Masquer l'icône
            const avatarIcon = document.getElementById('avatar-icon');
            if (avatarIcon) {
                avatarIcon.style.display = 'none';
            }
            
            // Réinitialiser l'input
            e.target.value = '';
            
            // Recharger le profil pour actualiser les données
            setTimeout(() => this.loadProfile(), 500);
        } catch (error) {
            console.error('Erreur upload:', error);
            this.showNotification('❌ Erreur lors de l\'upload: ' + error.message, 'error');
            e.target.value = '';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});
