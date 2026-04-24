// CompteRH - Gestion du profil Admin RH
console.log('✓ Script compteRH.js chargé');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM chargé');
    
    // Données utilisateur par défaut
    const defaultUser = {
        prenom: 'Utilisateur',
        nom: 'Test',
        email: 'utilisateur@entreprise.fr',
        department: 'Ressources Humaines',
        role: 'admin'
    };
    
    // Charger les données depuis localStorage ou utiliser les défauts
    let user = { ...defaultUser };
    const savedData = localStorage.getItem('gp_user_profile');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            user = { ...defaultUser, ...parsed };
            console.log('✓ Données utilisateur chargées:', user);
        } catch (e) {
            console.error('✗ Erreur parsing localStorage:', e);
        }
    }
    
    // Fonction pour mettre à jour l'affichage
    function updateDisplay() {
        const fullName = `${user.prenom} ${user.nom}`;
        
        // Mettre à jour le header du profil
        const nameElement = document.querySelector('[data-user-name]');
        if (nameElement) {
            nameElement.textContent = fullName;
            console.log('✓ Nom mis à jour:', fullName);
        }
        
        const emailElement = document.querySelector('[data-user-email]');
        if (emailElement) {
            emailElement.textContent = user.email;
            console.log('✓ Email mis à jour:', user.email);
        }
        
        // Mettre à jour les champs du formulaire
        const displayNameInput = document.getElementById('display-name');
        if (displayNameInput) {
            displayNameInput.value = fullName;
        }
        
        const recoveryEmailInput = document.getElementById('recovery-email');
        if (recoveryEmailInput) {
            recoveryEmailInput.value = user.email;
        }
    }
    
    // Appel initial pour afficher les données
    updateDisplay();
    
    // Gestion de la soumission du formulaire de sécurité
    const securityForm = document.getElementById('security-params-form');
    if (securityForm) {
        securityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📋 Formulaire soumis');
            
            // Récupérer les valeurs
            const displayNameInput = document.getElementById('display-name');
            const recoveryEmailInput = document.getElementById('recovery-email');
            
            const displayName = displayNameInput ? displayNameInput.value.trim() : '';
            const recoveryEmail = recoveryEmailInput ? recoveryEmailInput.value.trim() : '';
            
            // Valider
            if (!displayName || !recoveryEmail) {
                console.warn('⚠ Champs vides');
                alert('Veuillez remplir tous les champs');
                return;
            }
            
            // Mettre à jour l'objet utilisateur
            const nameParts = displayName.split(' ');
            user.prenom = nameParts[0];
            user.nom = nameParts.slice(1).join(' ') || '';
            user.email = recoveryEmail;
            
            console.log('📝 Nouvelles données:', user);
            
            // Sauvegarder dans localStorage
            localStorage.setItem('gp_user_profile', JSON.stringify(user));
            console.log('✓ Données sauvegardées');
            
            // Mettre à jour l'affichage immédiatement
            updateDisplay();
            console.log('✓ Affichage mis à jour');
            
            // Notification de succès
            alert('✅ Profil mis à jour avec succès !');
            
            // Vider les champs de mot de passe
            const newPasswordInput = document.getElementById('new-password');
            const confirmPasswordInput = document.getElementById('confirm-password');
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
        });
    }
    
    console.log('✅ Initialisation terminée');
});
                    </div>
                </div>
                ${!session.current ? `
                    <button type="button" class="btn btn-sm btn-danger" style="padding: 6px 12px; font-size: 0.75rem; background: #e74c3c; border: none; border-radius: 4px; color: white; cursor: pointer;">
                        Terminer
                    </button>
                ` : '<span style="color: var(--shell-accent); font-weight: bold; font-size: 0.85rem;">Actuelle</span>'}
            </div>
        `).join('');
    }

    /**
     * Gère l'upload de photo de profil
     */
    handleProfilePictureUpload(e) {
        const file = e.target.files[0];
        const fileNameDisplay = document.getElementById('file-name-display');

        if (!file) {
            this.resetFileUpload();
            return;
        }

        // Vérifier que c'est une image
        if (!file.type.startsWith('image/')) {
            this.showNotification('❌ Veuillez sélectionner une image valide', 'error');
            this.resetFileUpload();
            return;
        }

        // Vérifier la taille
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('❌ L\'image doit faire moins de 5MB', 'error');
            this.resetFileUpload();
            return;
        }

        // Afficher le nom du fichier
        if (fileNameDisplay) {
            fileNameDisplay.textContent = file.name;
            fileNameDisplay.classList.add('selected');
        }

        // Lire et afficher l'image
        const reader = new FileReader();
        reader.onload = (event) => {
            const avatarImg = document.getElementById('avatar-img');
            if (avatarImg) {
                avatarImg.src = event.target.result;
                avatarImg.style.display = 'block';
                const avatarIcon = document.getElementById('avatar-icon');
                if (avatarIcon) avatarIcon.style.display = 'none';
            }

            // Sauvegarder
            this.user.avatar = event.target.result;
            this.saveUserData();
            this.showNotification('✅ Photo de profil mise à jour', 'success');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Reset file upload display
     */
    resetFileUpload() {
        const fileInput = document.getElementById('profile-pic-input');
        const fileNameDisplay = document.getElementById('file-name-display');

        if (fileInput) fileInput.value = '';
        if (fileNameDisplay) {
            fileNameDisplay.textContent = 'Aucun fichier choisi';
            fileNameDisplay.classList.remove('selected');
        }
    }

    /**
     * Valide la force du mot de passe
     */
    validatePasswordStrength(e) {
        const password = e.target.value;
        const strength = this.calculatePasswordStrength(password);
        const hint = document.getElementById('password-requirements');

        if (!hint) return;

        if (password.length === 0) {
            hint.textContent = 'Minimum 8 caractères';
            hint.style.color = 'rgba(255, 255, 255, 0.6)';
        } else if (strength < 2) {
            hint.innerHTML = '⚠️ Mot de passe faible - Utilisez des majuscules, minuscules et chiffres';
            hint.style.color = 'var(--warning-color)';
        } else if (strength < 3) {
            hint.innerHTML = '✓ Mot de passe moyen';
            hint.style.color = 'var(--shell-accent)';
        } else {
            hint.innerHTML = '✓ Mot de passe fort';
            hint.style.color = 'var(--shell-accent)';
        }
    }

    /**
     * Calcule la force du mot de passe
     */
    calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        return strength;
    }

    /**
     * Valide la concordance des mots de passe
     */
    validatePasswordMatch(e) {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = e.target.value;

        if (confirmPassword && newPassword !== confirmPassword) {
            e.target.setCustomValidity('Les mots de passe ne correspondent pas');
            e.target.classList.add('invalid');
        } else {
            e.target.setCustomValidity('');
            e.target.classList.remove('invalid');
        }
    }

    /**
     * Gère la soumission du formulaire
     */
    handleSecurityParamsSubmit(e) {
        e.preventDefault();
        console.log('📋 Form submitted');

        const displayName = document.getElementById('display-name').value.trim();
        const recoveryEmail = document.getElementById('recovery-email').value.trim();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Validation
        if (!displayName) {
            this.showNotification('❌ Veuillez entrer un nom d\'affichage', 'error');
            return;
        }

        if (!recoveryEmail || !this.validateEmail(recoveryEmail)) {
            this.showNotification('❌ Veuillez entrer un email valide', 'error');
            return;
        }

        if (newPassword || confirmPassword) {
            if (!newPassword || !confirmPassword) {
                this.showNotification('❌ Veuillez confirmer le mot de passe', 'error');
                return;
            }
            if (newPassword !== confirmPassword) {
                this.showNotification('❌ Les mots de passe ne correspondent pas', 'error');
                return;
            }
            if (newPassword.length < 8) {
                this.showNotification('❌ Le mot de passe doit faire au moins 8 caractères', 'error');
                return;
            }

            const strength = this.calculatePasswordStrength(newPassword);
            if (strength < 2) {
                this.showNotification('❌ Le mot de passe est trop faible', 'error');
                return;
            }
        }

        // Mettre à jour les données
        const nameParts = displayName.split(' ');
        this.user.prenom = nameParts[0];
        this.user.nom = nameParts.slice(1).join(' ') || nameParts[0];
        this.user.email = recoveryEmail;

        if (newPassword) {
            this.securityInfo.daysSincePasswordChange = 0;
        }

        // Sauvegarder
        this.saveUserData();
        console.log('✅ Profile updated:', this.user);

        // Rafraîchir l'affichage
        this.updateProfileDisplay();
        this.updateSecurityDisplay();

        // Réinitialiser les champs
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';

        const hint = document.getElementById('password-requirements');
        if (hint) {
            hint.textContent = 'Minimum 8 caractères';
            hint.style.color = 'rgba(255, 255, 255, 0.6)';
        }

        this.showNotification('✅ Profil mis à jour avec succès !', 'success');
    }

    /**
     * Gère l'activation/désactivation du 2FA
     */
    handleToggle2FA() {
        const isCurrentlyEnabled = this.securityInfo?.twoFactorEnabled || false;

        if (!confirm('Êtes-vous sûr de vouloir ' + (isCurrentlyEnabled ? 'désactiver' : 'activer') + ' le 2FA?')) {
            return;
        }

        this.securityInfo.twoFactorEnabled = !isCurrentlyEnabled;
        this.updateSecurityDisplay();
        this.showNotification('✅ 2FA mis à jour', 'success');
    }

    /**
     * Déconnecte l'utilisateur
     */
    logout() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            localStorage.removeItem('gp_session_token');
            this.showNotification('🔄 Déconnexion...', 'info');
            setTimeout(() => {
                window.location.href = '/auth.html';
            }, 1000);
        }
    }

    /**
     * Affiche une notification
     */
    showNotification(message, type = 'info') {
        const notificationsEl = document.getElementById('notifications');
        if (!notificationsEl) {
            console.log('Notification:', message);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="close-btn">&times;</button>
        `;

        notificationsEl.appendChild(notification);

        const closeBtn = notification.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => notification.remove());

        setTimeout(() => notification.remove(), 5000);
    }

    /**
     * Valide un email
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Formate le rôle pour l'affichage
     */
    formatRole(role) {
        const roles = {
            'admin': 'ADMIN',
            'employe': 'EMPLOYÉ',
            'animateur': 'ANIMATEUR',
        };
        return roles[role] || role.toUpperCase();
    }

    /**
     * Retourne le label du rôle
     */
    getRoleLabel(role) {
        const labels = {
            'admin': 'Administrateur RH',
            'employe': 'Employé',
            'animateur': 'Animateur',
        };
        return labels[role] || role;
    }
}

// Initialize when DOM is ready
console.log('📄 Script compteRH.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 DOM Content Loaded');
    new CompteRHManager();
});/**
 * File: public/assets/js/compteRH.js
 * Page Compte RH - Gestion du profil Admin
 * Données sauvegardées localement et mises à jour immédiatement
 */

class CompteRHManager {
    constructor() {
        // Données par défaut
        this.user = {
            prenom: 'Claire',
            nom: 'Deschamps',
            email: 'c.deschamps@entreprise.fr',
            password: 'password123',
            department: 'Ressources Humaines',
            role: 'admin',
            avatar: null,
        };

        // Charger les données sauvegardées
        this.loadUserData();
        this.setupEventListeners();
        this.loadUserProfile();
    }

    loadUserData() {
        const savedData = localStorage.getItem('gp_user_profile');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.user = { ...this.user, ...data };
            } catch (e) {
                console.error('Erreur parsing user data:', e);
            }
        }
    }

    saveUserData() {
        localStorage.setItem('gp_user_profile', JSON.stringify(this.user));
    }

    /**
     * Configure les event listeners
     */
    setupEventListeners() {
        // Security parameters form
        const securityForm = document.getElementById('security-params-form');
        if (securityForm) {
            securityForm.addEventListener('submit', (e) => this.handleSecurityParamsSubmit(e));
        }

        // Avatar upload
        const avatarUpload = document.getElementById('avatar-upload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // 2FA toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-toggle-2fa]')) {
                e.preventDefault();
                this.handleToggle2FA();
            }
        });

        // Logout button
        const logoutBtn = document.querySelector('[data-logout]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    /**
     * Charge le profil utilisateur depuis l'API
     */
    async loadUserProfile() {
        try {
            // Charger les infos de profil
            const profileData = await this.apiCall('/profile/me');
            if (!profileData) {
                this.redirectToLogin();
                return;
            }

            this.user = profileData.user;

            // Charger les infos de sécurité
            const securityData = await this.apiCall('/profile/security?action=info');
            if (securityData) {
                this.securityInfo = securityData;
            }

            // Mettre à jour l'affichage
            this.updateProfileDisplay();
            this.updateSecurityDisplay();
            this.loadSessions();
        } catch (error) {
            console.error('Erreur loading profile:', error);
        }
    }

    /**
     * Met à jour l'affichage du profil
     */
    updateProfileDisplay() {
        if (!this.user) return;

        document.querySelector('[data-user-name]').textContent = `${this.user.prenom} ${this.user.nom}`;
        document.querySelector('[data-user-email]').textContent = this.user.email;
        document.querySelector('[data-user-role]').textContent = this.formatRole(this.user.role);
        document.querySelector('[data-user-role-display]').textContent = this.getRoleLabel(this.user.role);
        document.querySelector('[data-user-department]').textContent = this.user.department || 'Non renseigné';

        // Populate form fields
        document.getElementById('display-name').value = `${this.user.prenom} ${this.user.nom}`;
        document.getElementById('recovery-email').value = this.user.email;

        // Charger l'avatar s'il existe
        const avatarImg = document.getElementById('avatar-img');
        const avatarIcon = document.getElementById('avatar-icon');
        if (avatarImg && this.user.avatar) {
            avatarImg.src = this.user.avatar;
            avatarImg.style.display = 'block';
            avatarIcon.style.display = 'none';
        } else if (avatarImg) {
            avatarImg.style.display = 'none';
            avatarIcon.style.display = 'block';
        }
    }

    /**
     * Met à jour l'affichage de la sécurité
     */
    updateSecurityDisplay() {
        if (!this.securityInfo) return;

        // Dernier changement de mot de passe
        const lastPwdEl = document.getElementById('last-pwd-change');
        if (lastPwdEl) {
            const days = this.securityInfo.daysSincePasswordChange || 0;
            lastPwdEl.textContent = `Il y a ${days} jours (Recommandé: tous les 90 jours)`;
        }

        // Dernière connexion
        const lastLoginEl = document.getElementById('last-login');
        if (lastLoginEl) {
            const lastLogin = new Date(this.securityInfo.lastLogin);
            lastLoginEl.textContent = `${lastLogin.toLocaleDateString('fr-FR')} à ${lastLogin.toLocaleTimeString('fr-FR')}`;
        }

        // Statut 2FA
        const twoFAEl = document.getElementById('twofa-status');
        if (twoFAEl) {
            if (this.securityInfo.twoFactorEnabled) {
                twoFAEl.innerHTML = 'Activée - <a href="#" data-toggle-2fa>Désactiver</a>';
            } else {
                twoFAEl.innerHTML = 'Désactivée - <a href="#" data-toggle-2fa>Configurer maintenant</a>';
            }
        }
    }

    /**
     * Charge les sessions actives
     */
    async loadSessions() {
        const sessionsList = document.getElementById('sessions-list');
        if (!sessionsList) return;

        const sessions = await this.apiCall('/profile/security?action=sessions');
        if (!sessions || !sessions.data) {
            sessionsList.innerHTML = '<p class="no-data">Aucune session active</p>';
            return;
        }

        sessionsList.innerHTML = sessions.data.map(session => `
            <div class="session-item">
                <div class="session-info">
                    <div class="session-device">
                        <i class="fas fa-${this.getDeviceIcon(session.user_agent)}"></i> ${this.parseUserAgent(session.user_agent)}
                    </div>
                    <div class="session-ip">IP: ${session.ip_address}</div>
                    <div class="session-time">${new Date(session.derniere_activite).toLocaleDateString('fr-FR')}</div>
                </div>
                <button type="button" class="btn btn-sm btn-danger" data-session-id="${session.id_session}">
                    Terminer
                </button>
            </div>
        `).join('');

        // Ajouter les listeners pour terminer les sessions
        sessionsList.querySelectorAll('button[data-session-id]').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTerminateSession(e));
        });
    }

    /**
     * Retourne l'icône pour un user agent
     */
    getDeviceIcon(userAgent) {
        if (userAgent.includes('Mobile')) return 'mobile';
        if (userAgent.includes('Tablet')) return 'tablet';
        return 'desktop';
    }

    /**
     * Parse le user agent pour afficher le navigateur et OS
     */
    parseUserAgent(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome - Windows';
        if (userAgent.includes('Firefox')) return 'Firefox - ' + (userAgent.includes('Linux') ? 'Linux' : 'Windows');
        if (userAgent.includes('Safari')) return 'Safari - macOS';
        return 'Navigateur - OS';
    }

    /**
     * Gère l'upload d'avatar
     */
    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Vérifier que c'est une image
        if (!file.type.startsWith('image/')) {
            this.showNotification('Veuillez sélectionner une image valide', 'error');
            return;
        }

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('L\'image doit faire moins de 5MB', 'error');
            return;
        }

        // Créer FormData pour upload
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const headers = {
                'Authorization': `Bearer ${this.token}`,
            };

            const response = await fetch(`${this.apiBase}/profile/avatar`, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (response.status === 401) {
                this.redirectToLogin();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur upload');
            }

            // Mettre à jour l'avatar
            this.user.avatar = data.avatarUrl;
            this.updateProfileDisplay();
            this.showNotification('✅ Photo de profil mise à jour', 'success');
        } catch (error) {
            console.error('Erreur upload:', error);
            this.showNotification(error.message || 'Erreur lors du upload', 'error');
        }
    }

    /**
     * Gère la soumission du formulaire de sécurité
     */
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

        // Préparer les données
        const nameParts = displayName.split(' ');
        const payload = {
            prenom: nameParts[0],
            nom: nameParts.slice(1).join(' ') || nameParts[0],
            email: recoveryEmail,
        };

        if (newPassword) {
            payload.newPassword = newPassword;
        }

        // Envoyer à l'API
        const result = await this.apiCall('/profile/update', {
            method: 'POST',
            body: payload,
        });

        if (result) {
            // Mettre à jour les données locales
            this.user.prenom = payload.prenom;
            this.user.nom = payload.nom;
            this.user.email = payload.email;

            // Mettre à jour l'affichage
            this.updateProfileDisplay();

            // Réinitialiser les champs de mot de passe
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';

            this.showNotification('✅ Profil mis à jour avec succès !', 'success');
        }
    }

    /**
     * Gère l'activation/désactivation du 2FA
     */
    async handleToggle2FA() {
        const twoFAEl = document.getElementById('twofa-status');
        const isCurrentlyEnabled = this.securityInfo?.twoFactorEnabled || false;

        if (!confirm('Êtes-vous sûr de vouloir ' + (isCurrentlyEnabled ? 'désactiver' : 'activer') + ' l\'authentification à deux facteurs?')) {
            return;
        }

        const result = await this.apiCall('/profile/security?action=toggle-2fa', {
            method: 'POST',
            body: { enable: !isCurrentlyEnabled },
        });

        if (result) {
            this.securityInfo.twoFactorEnabled = !isCurrentlyEnabled;

            if (!isCurrentlyEnabled && result.secret) {
                // Afficher le secret QR
                this.showQRCodeModal(result.secret);
            }

            this.updateSecurityDisplay();
            this.showNotification('✅ Authentification à deux facteurs mise à jour', 'success');
        }
    }

    /**
     * Affiche le modal QR pour 2FA
     */
    showQRCodeModal(secret) {
        // À implémenter: afficher un QR code pour scanner
        alert(`Secret 2FA généré:\n${secret}\n\nScannez ce code avec votre application authenticator.`);
    }

    /**
     * Termine une session
     */
    async handleTerminateSession(e) {
        const sessionId = e.target.dataset.sessionId;
        if (!sessionId) return;

        if (!confirm('Êtes-vous sûr de vouloir terminer cette session?')) {
            return;
        }

        const result = await this.apiCall(`/profile/security?action=logout-session&session_id=${sessionId}`, {
            method: 'POST',
        });

        if (result) {
            this.showNotification('✅ Session terminée', 'success');
            this.loadSessions();
        }
    }

    /**
     * Déconnecte l'utilisateur
     */
    logout() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
            localStorage.removeItem('gp_session_token');
            this.showNotification('Déconnexion en cours...', 'info');
            setTimeout(() => {
                window.location.href = '/pages/auth.html';
            }, 1000);
        }
    }

    /**
     * Affiche une notification
     */
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

    /**
     * Valide un email
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Formate le rôle pour l'affichage
     */
    formatRole(role) {
        const roles = {
            'admin': 'ADMIN',
            'employe': 'EMPLOYÉ',
            'animateur': 'ANIMATEUR',
        };
        return roles[role] || role.toUpperCase();
    }

    /**
     * Retourne le label du rôle
     */
    getRoleLabel(role) {
        const labels = {
            'admin': 'Administrateur RH',
            'employe': 'Employé',
            'animateur': 'Animateur',
        };
        return labels[role] || role;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CompteRHManager();
});
