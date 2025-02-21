module.exports = {
  preset: '@metamask/snaps-jest',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  restoreMocks: true,
  resetMocks: true,
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
  testMatch: ['**/test/**/?(*.)+(spec|test).[tj]s?(x)'],
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**/*.ts',
    './src/index.ts',
    '!./src/**/*.d.ts',
    '!./src/**/index.ts',
    '!./src/**/type?(s).ts',
    '!./src/**/constant?(s).ts',
    '!./test/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'json-summary', 'text'],
  moduleNameMapper: {
    '^@metamask/7715-permissions-shared/utils$':
      '<rootDir>/../shared/src/utils',
    '^@metamask/7715-permissions-shared/types$':
      '<rootDir>/../shared/src/types',
    '^.+.(svg)$': 'jest-transform-stub',
  },
};
