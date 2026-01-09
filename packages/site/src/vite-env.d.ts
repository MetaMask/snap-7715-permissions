/* eslint-disable import-x/unambiguous, @typescript-eslint/naming-convention */
// / <reference types="vite/client" />

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMetaEnv {
  readonly VITE_BUNDLER_RPC_URL?: string;
  readonly VITE_SUPPORTED_CHAINS?: string;
  readonly VITE_KERNEL_SNAP_ORIGIN?: string;
  readonly VITE_GATOR_SNAP_ORIGIN?: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
