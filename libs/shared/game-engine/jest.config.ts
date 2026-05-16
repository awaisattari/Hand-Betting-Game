/* eslint-disable */
export default {
  displayName: 'game-engine',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@hbg/shared-types$': '<rootDir>/../types/src/index.ts',
    '^@hbg/game-engine$': '<rootDir>/src/index.ts',
  },
  coverageDirectory: '../../../coverage/libs/shared/game-engine',
};
