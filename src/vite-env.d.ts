/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_FISCAL_YEAR: string;
  readonly VITE_FISCAL_START_YEAR: string;
  readonly VITE_GRADUATION_GRADE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
