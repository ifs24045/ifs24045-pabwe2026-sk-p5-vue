import { ref, onMounted, onBeforeUnmount } from "vue";

export function useNow(intervalMs = 30000) {
  const now = ref(Date.now());
  let timer = null;

  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now();
    }, intervalMs);
  });

  onBeforeUnmount(() => {
    clearInterval(timer);
  });

  return now;
}