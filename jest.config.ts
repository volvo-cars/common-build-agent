module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "tests",
  setupFilesAfterEnv: ['./jest.setup.ts'],
  coverageDirectory: "../build/coverage"
}
