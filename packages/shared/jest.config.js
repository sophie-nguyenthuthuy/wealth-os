/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.test\\.ts$',
  collectCoverageFrom: ['**/*.ts', '!**/*.test.ts', '!**/index.ts'],
  coverageDirectory: '../coverage',
};
