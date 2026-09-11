process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test_mock:test_mock@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-at-least-32-characters-long-key';
process.env.INTERNAL_PROXY_KEY = process.env.INTERNAL_PROXY_KEY || 'test-internal-proxy-key-1234567890';

/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/src"],
  testMatch: ["<rootDir>/src/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/BACKEND/", "/.next/", "/dist/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
};

export default config;
