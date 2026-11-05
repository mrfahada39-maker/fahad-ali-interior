process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test_mock:test_mock@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-at-least-32-characters-long-key';
process.env.NEXT_PUBLIC_CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+92 300 0000000';
process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923000000000';

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
    "^.+\\.[tj]sx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  testTimeout: 25000,
  transformIgnorePatterns: ["node_modules/(?!(@scure|@noble|otplib)/)"],
};

export default config;
