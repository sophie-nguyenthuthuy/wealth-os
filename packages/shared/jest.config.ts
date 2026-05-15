import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.test\\.ts$',
  collectCoverageFrom: ['**/*.ts', '!**/*.test.ts', '!**/index.ts'],
  coverageDirectory: '../coverage',
};

export default config;
