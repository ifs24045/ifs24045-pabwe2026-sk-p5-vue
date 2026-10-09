import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./index.css";

// Jika file halaman (lazy chunk) gagal diunduh, muat ulang paling banyak
// sekali dalam 30 detik supaya tidak terjadi reload berulang.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  const lastReload = Number(sessionStorage.getItem("chunk-reload-at") || 0);
  if (Date.now() - lastReload < 30000) return;

  sessionStorage.setItem("chunk-reload-at", String(Date.now()));
  window.location.reload();
});

const app = createApp(App).use(createPinia()).use(router);

// Tunggu halaman pertama selesai dimuat sebelum mount, supaya kerangka di
// index.html tetap tampil dan halaman tidak pernah kosong di tengah jalan.
router
  .isReady()
  .catch(() => {})
  .then(() => app.mount("#app"));