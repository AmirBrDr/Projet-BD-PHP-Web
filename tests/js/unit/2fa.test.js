/**
 * Tests pour la validation 2FA
 */

const validate2FACode = (code) => {
    if (!code) return false;
    const re = /^\d{6}$/;
    return re.test(String(code));
};

describe('Validation 2FA', () => {
    test('accepte un code à 6 chiffres valide', () => {
        expect(validate2FACode('123456')).toBe(true);
        expect(validate2FACode('000000')).toBe(true);
    });

    test('rejette un code contenant des lettres', () => {
        expect(validate2FACode('12a456')).toBe(false);
        expect(validate2FACode('abcdef')).toBe(false);
    });

    test('rejette un code trop court ou trop long', () => {
        expect(validate2FACode('12345')).toBe(false);
        expect(validate2FACode('1234567')).toBe(false);
    });

    test('rejette les valeurs vides ou nulles', () => {
        expect(validate2FACode('')).toBe(false);
        expect(validate2FACode(null)).toBe(false);
        expect(validate2FACode(undefined)).toBe(false);
    });

    test('accepte les nombres convertis en string', () => {
        expect(validate2FACode(123456)).toBe(true);
    });
});
