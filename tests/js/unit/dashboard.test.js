/**
 * Tests pour les calculs du Dashboard
 */

const calculateProgress = (current, total) => {
    if (total <= 0 || !total) return 0;
    if (current < 0) current = 0;
    if (current > total) current = total;
    return Math.round((current / total) * 100);
};

const formatTimeRemaining = (endDateStr) => {
    if (!endDateStr) return 'Date invalide';
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) return 'Date invalide';
    
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return 'Terminé';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} jours restants` : 'Se termine aujourd\'hui';
};

describe('Dashboard Calculs', () => {
    describe('Progression (%)', () => {
        test('calcule le pourcentage correct', () => {
            expect(calculateProgress(50, 100)).toBe(50);
            expect(calculateProgress(1, 3)).toBe(33); // Arrondi
        });

        test('plafonne à 100% si current > total', () => {
            expect(calculateProgress(150, 100)).toBe(100);
        });

        test('retourne 0% si current est négatif', () => {
            expect(calculateProgress(-10, 100)).toBe(0);
        });

        test('évite la division par zéro', () => {
            expect(calculateProgress(50, 0)).toBe(0);
            expect(calculateProgress(50, -10)).toBe(0);
        });

        test('gère les valeurs invalides', () => {
            expect(calculateProgress(null, 100)).toBe(0);
            expect(calculateProgress(50, undefined)).toBe(0);
        });
    });

    describe('Temps Restant', () => {
        test('formate correctement les jours restants', () => {
            const future = new Date();
            future.setDate(future.getDate() + 5);
            expect(formatTimeRemaining(future.toISOString())).toBe('5 jours restants'); // Note: peut varier de qqs ms
        });

        test('affiche "Terminé" si la date est passée', () => {
            const past = new Date();
            past.setDate(past.getDate() - 2);
            expect(formatTimeRemaining(past.toISOString())).toBe('Terminé');
        });

        test('gère les dates invalides', () => {
            expect(formatTimeRemaining('not-a-date')).toBe('Date invalide');
            expect(formatTimeRemaining('')).toBe('Date invalide');
            expect(formatTimeRemaining(null)).toBe('Date invalide');
        });
    });
});
