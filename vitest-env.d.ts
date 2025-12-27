/// <reference types="vitest/globals" />
/// <reference types="vite/client" />

interface ImportMeta {
  glob: (pattern: string) => Record<string, () => Promise<unknown>>;
}
