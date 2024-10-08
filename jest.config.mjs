export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverage: true,  // Enables coverage collection
  collectCoverageFrom: ['app/api/schedule/view-own/route.js'],  // Specify the files for which you want to collect coverage
  coverageDirectory: 'coverage',  // Output folder for coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],  // Formats for the coverage report
};