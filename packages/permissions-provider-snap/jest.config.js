module.exports = {
  preset: '@metamask/snaps-jest',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testMatch: ['**/test/**/*.test.ts'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
};
