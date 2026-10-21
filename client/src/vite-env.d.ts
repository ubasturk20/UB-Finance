/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' shows bank sync (Plaid, SimpleFIN, Enable Banking); see utils/features.ts */
  readonly VITE_BANK_SYNC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __API_BASE__?: string;
}
