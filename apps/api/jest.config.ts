/* eslint-disable */
export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@hbg/shared-types$': '<rootDir>/../../libs/shared/types/src/index.ts',
    '^@hbg/game-engine$': '<rootDir>/../../libs/shared/game-engine/src/index.ts',
  },
  coverageDirectory: '../../coverage/apps/api',
};
