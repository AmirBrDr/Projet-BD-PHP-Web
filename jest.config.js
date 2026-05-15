module.exports = {
  // Les tests chercheront les fichiers avec .test.js
  testMatch: [
    '**/tests/js/**/*.test.js',
    '**/tests/js/**/*.spec.js'
  ],
  // Environnement simulé DOM (utile pour JS Front)
  testEnvironment: 'jsdom',
  // Fichier exécuté avant chaque test
  setupFilesAfterEnv: ['<rootDir>/tests/js/setup.js'],
  // Dossiers ignorés
  testPathIgnorePatterns: ['/node_modules/'],
  // Couverture de code
  collectCoverageFrom: [
    'public/assets/js/**/*.js',
    '!public/assets/js/**/*.min.js',
    '!public/assets/js/vendor/**'
  ],
  coverageDirectory: 'coverage/js',
};
