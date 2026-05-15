/**
 * Tests pour la validation d'authentification
 */

// Simulation des fonctions frontend si elles ne sont pas exportées
const validateEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
    if (!password) return false;
    // Minimum 8 chars, au moins 1 majuscule, 1 minuscule, 1 chiffre
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
};

describe('Validation Auth', () => {
    describe('Validation Email', () => {
        test('accepte un email valide', () => {
            expect(validateEmail('user@greenpulse.fr')).toBe(true);
            expect(validateEmail('test.name@domaine.com')).toBe(true);
        });

        test('rejette un email sans @', () => {
            expect(validateEmail('invalidemail')).toBe(false);
        });

        test('rejette un email avec format incorrect', () => {
            expect(validateEmail('user@domaine')).toBe(false); // Pas de TLD
            expect(validateEmail('@domaine.com')).toBe(false); // Pas de local part
        });

        test('rejette les valeurs null et undefined', () => {
            expect(validateEmail(null)).toBe(false);
            expect(validateEmail(undefined)).toBe(false);
            expect(validateEmail('')).toBe(false);
        });
    });

    describe('Validation Mot de passe', () => {
        test('accepte un mot de passe robuste', () => {
            expect(validatePassword('StrongPass1')).toBe(true);
        });

        test('rejette un mot de passe trop court', () => {
            expect(validatePassword('Short1A')).toBe(false); // < 8
        });

        test('rejette un mot de passe sans chiffre', () => {
            expect(validatePassword('NoNumberHereA')).toBe(false);
        });

        test('rejette un mot de passe sans majuscule', () => {
            expect(validatePassword('nouppercase1')).toBe(false);
        });

        test('rejette les valeurs vides', () => {
            expect(validatePassword('')).toBe(false);
            expect(validatePassword(null)).toBe(false);
        });
    });
});
