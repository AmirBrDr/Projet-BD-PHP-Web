/**
 * Tests pour la gestion du storage (Tokens, cache)
 */

const tokenStorage = {
    setToken: (token) => {
        if (!token) return false;
        localStorage.setItem('gp_token', token);
        return true;
    },
    getToken: () => {
        return localStorage.getItem('gp_token');
    },
    clearToken: () => {
        localStorage.removeItem('gp_token');
    }
};

describe('Storage Management', () => {
    beforeEach(() => {
        // Nettoyage avant chaque test
        localStorage.clear();
    });

    test('stocke correctement le token', () => {
        const result = tokenStorage.setToken('fake-jwt-token');
        expect(result).toBe(true);
        expect(localStorage.getItem('gp_token')).toBe('fake-jwt-token');
    });

    test('refuse de stocker un token vide', () => {
        const result = tokenStorage.setToken('');
        expect(result).toBe(false);
        expect(localStorage.getItem('gp_token')).toBeNull();
    });

    test('récupère le token stocké', () => {
        localStorage.setItem('gp_token', 'stored-token');
        expect(tokenStorage.getToken()).toBe('stored-token');
    });

    test('retourne null si aucun token n\'est stocké', () => {
        expect(tokenStorage.getToken()).toBeNull();
    });

    test('supprime le token correctement', () => {
        localStorage.setItem('gp_token', 'token-to-delete');
        tokenStorage.clearToken();
        expect(localStorage.getItem('gp_token')).toBeNull();
    });
});
