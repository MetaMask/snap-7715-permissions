module.exports = {
  prettierPath: null,
  preset: '@metamask/snaps-jest',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
    '^.+\\.svg$': '<rootDir>/svg-transformer.js',
  },
  restoreMocks: true,
  resetMocks: true,
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
  testMatch: ['**/test/**/?(*.)+(spec|test).[tj]s?(x)'],
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**/*.[tj]s?(x)',
    '!./src/**/*.d.ts',
    '!./src/**/index.[tj]s?(x)',
    '!./src/**/type?(s).ts',
    '!./src/**/constant?(s).ts',
    '!./test/**',
  ],
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'json-summary', 'text'],
  // workaround for serialization of bigints in jest v29
  // https://github.com/jestjs/jest/issues/11617
  // this is resolved in jest v30.0.0-alpha.6
  maxWorkers: 1,
};
