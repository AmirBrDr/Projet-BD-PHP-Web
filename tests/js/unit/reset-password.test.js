/**
 * Tests pour la réinitialisation de mot de passe
 */

const isPasswordMatch = (password, confirmation) => {
    if (!password || !confirmation) return false;
    return password === confirmation;
};

describe('Réinitialisation Mot de passe', () => {
    test('valide deux mots de passe identiques', () => {
        expect(isPasswordMatch('Password123!', 'Password123!')).toBe(true);
    });

    test('rejette des mots de passe différents', () => {
        expect(isPasswordMatch('Password123!', 'Password123')).toBe(false);
        expect(isPasswordMatch('Password123!', 'different')).toBe(false);
    });

    test('prend en compte la casse (case sensitive)', () => {
        expect(isPasswordMatch('password123', 'Password123')).toBe(false);
    });

    test('rejette si un des champs est vide', () => {
        expect(isPasswordMatch('Password123!', '')).toBe(false);
        expect(isPasswordMatch('', 'Password123!')).toBe(false);
        expect(isPasswordMatch('', '')).toBe(false);
    });

    test('rejette les valeurs null/undefined', () => {
        expect(isPasswordMatch(null, 'Password123!')).toBe(false);
        expect(isPasswordMatch('Password123!', undefined)).toBe(false);
    });
});
