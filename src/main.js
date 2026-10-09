import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./index.css";

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  if (sessionStorage.getItem("chunk-reload") === "1") return;

  sessionStorage.setItem("chunk-reload", "1");
  window.location.reload();
});

createApp(App).use(createPinia()).use(router).mount("#app");

sessionStorage.removeItem("chunk-reload");