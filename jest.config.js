module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/.venv", "<rootDir>/node_modules"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  transform: { "^.+\\.tsx?$": "ts-jest" },
};
