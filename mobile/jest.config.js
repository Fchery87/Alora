/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)"],
  collectCoverageFrom: [
    "data/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "config/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "app/_layout.tsx",
    "powersync/**/*.{ts,tsx}",
    "!**/__tests__/**",
  ],
};
