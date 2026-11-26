// Birim testleri yapılandırması (uygulama derlemesinden bağımsızdır). Çalıştırma: npx vitest run
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    setupFiles: ["src/testler/kurulum.ts"],
    include: ["src/testler/**/*.test.ts"],
  },
});
