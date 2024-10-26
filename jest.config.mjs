export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['<rootDir>/app/**/*.test.js'],  // Adjust this if needed based on your test file structure
  collectCoverage: false,  // Enables coverage collection
  collectCoverageFrom: ['app/**/*.js'],  // Specify the files for which you want to collect coverage
  coverageDirectory: 'coverage',  // Output folder for coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],  // Formats for the coverage report
};