module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/src/lib/__tests__/helpers/setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/lib/__tests__/helpers/',
  ],
}
