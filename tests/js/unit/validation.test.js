/**
 * Tests pour les fonctions utilitaires (parsing, sanitization)
 */

const safeParseJSON = (jsonString) => {
    try {
        if (!jsonString || typeof jsonString !== 'string') return null;
        return JSON.parse(jsonString);
    } catch (e) {
        return null;
    }
};

const sanitizeHTML = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

describe('Utilitaires de Validation', () => {
    describe('safeParseJSON', () => {
        test('parse correctement un JSON valide', () => {
            const data = '{"key":"value","num":42}';
            const parsed = safeParseJSON(data);
            expect(parsed).toEqual({ key: 'value', num: 42 });
        });

        test('retourne null pour un JSON malformé', () => {
            expect(safeParseJSON('{bad json}')).toBeNull();
            expect(safeParseJSON('undefined')).toBeNull();
        });

        test('gère les valeurs vides ou nulles', () => {
            expect(safeParseJSON(null)).toBeNull();
            expect(safeParseJSON('')).toBeNull();
            expect(safeParseJSON(undefined)).toBeNull();
        });

        test('gère les types non-string', () => {
            expect(safeParseJSON({ object: true })).toBeNull(); // On attend un string
            expect(safeParseJSON(123)).toBeNull();
        });
    });

    describe('sanitizeHTML', () => {
        test('échappe les balises HTML dangereuses', () => {
            const danger = '<script>alert("XSS")</script>';
            const safe = sanitizeHTML(danger);
            expect(safe).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
        });

        test('gère les chaînes normales', () => {
            expect(sanitizeHTML('Hello World')).toBe('Hello World');
        });

        test('gère les valeurs falsy', () => {
            expect(sanitizeHTML(null)).toBe('');
            expect(sanitizeHTML(undefined)).toBe('');
            expect(sanitizeHTML('')).toBe('');
        });
    });
});
