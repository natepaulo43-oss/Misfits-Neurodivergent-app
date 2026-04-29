'use strict';

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          isolatedModules: true,
          strict: false,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
};
