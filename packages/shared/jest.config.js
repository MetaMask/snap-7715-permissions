module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  restoreMocks: true,
  resetMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**/*.ts',
    '!./src/**/*.d.ts',
    '!./src/**/index.ts',
    '!./src/**/type?(s).ts',
    '!./src/**/constant?(s).ts',
    '!./test/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'json-summary', 'text'],
};
