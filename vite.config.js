import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import process from "process";

// Menyisipkan CSS utama langsung ke index.html saat build produksi agar tidak
// ada permintaan CSS yang memblokir render (audit "Render blocking requests").
const inlineEntryCss = () => ({
  name: "inline-entry-css",
  apply: "build",
  enforce: "post",
  generateBundle(_, bundle) {
    const html = bundle["index.html"];
    if (!html || typeof html.source !== "string") return;

    html.source = html.source.replace(
      /<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g,
      (tag, file) => {
        const css = bundle[file];
        if (!css || typeof css.source !== "string") return tag;
        delete bundle[file];
        return `<style>${css.source}</style>`;
      }
    );
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Build produksi (Vercel) memakai proxy same-origin agar tidak terkena
  // peringatan CORS; dev dan test tetap langsung ke server Delcom.
  const defaultBaseUrl =
    mode === "production"
      ? "/api/v1"
      : "https://open-api.delcom.org/api/v1";

  return {
    plugins: [vue(), tailwindcss(), inlineEntryCss()],
    server: {
      port: Number(env.APP_PORT) || 3000, allowedHosts: true ,
    },
    preview: {
      port: Number(env.APP_PORT) || 3000, allowedHosts: true,
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(env.VITE_DELCOM_BASEURL || defaultBaseUrl),
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        include: ["src/**/*.{js,vue}"],
        exclude: [
          "src/main.js",
          "src/setupTests.js",
          "src/test-utils.js",
          "**/*.test.{js,jsx}",
          "node_modules/**",
          ".docs/**",
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  };
});