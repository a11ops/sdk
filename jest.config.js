module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.d.ts'
  ],
  testMatch: [
    '<rootDir>/test/**/*.test.js'
  ],
  moduleDirectories: ['node_modules', 'src'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};