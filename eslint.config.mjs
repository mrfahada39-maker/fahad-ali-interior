import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    // Ignore Backend (NestJS has its own eslint config), build outputs, and utility scripts
    ignores: [
      "Backend/**",
      "backend/**",
      "node_modules/**",
      ".next/**",
      "dist/**",
      "public/**",
      "scripts/**",
      "scratch/**",
      "tests/**",
      "playwright-report/**",
      "convert-svg-to-webp.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooksPlugin.configs.flat.recommended,
  nextPlugin.configs.recommended,
  {
    languageOptions: {
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        btoa: "readonly",
        atob: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        // Node globals
        process: "readonly",
        Buffer: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        // DOM types
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLFormElement: "readonly",
        HTMLSelectElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLSpanElement: "readonly",
        HTMLAnchorElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLImageElement: "readonly",
        HTMLCanvasElement: "readonly",
        HTMLVideoElement: "readonly",
        HTMLAudioElement: "readonly",
        // Web APIs
        FormData: "readonly",
        FileReader: "readonly",
        FileList: "readonly",
        File: "readonly",
        Blob: "readonly",
        crypto: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Headers: "readonly",
        HeadersInit: "readonly",
        Request: "readonly",
        RequestInit: "readonly",
        Response: "readonly",
        BodyInit: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        ServiceWorkerRegistration: "readonly",
        Notification: "readonly",
        BufferSource: "readonly",
        // Event types
        Element: "readonly",
        Node: "readonly",
        Event: "readonly",
        MouseEvent: "readonly",
        KeyboardEvent: "readonly",
        CustomEvent: "readonly",
        // React
        React: "readonly",
        // Test globals
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-undef": "error",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "@next/next/no-img-element": "off",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "prefer-const": "error",
    },
  },
  {
    files: [
      "src/components/dashboards/**/*.ts",
      "src/components/dashboards/**/*.tsx",
      "src/components/home-v2/**/*.ts",
      "src/components/home-v2/**/*.tsx",
      "src/hooks/**/*.ts",
      "src/hooks/**/*.tsx",
      "src/lib/**/*.ts",
      "src/proxy.ts",
      "src/app/orders/**/*.tsx",
      "src/app/sitemap.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // next.config.ts — allow unused vars (isDev used for conditional logic)
    files: ["next.config.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

