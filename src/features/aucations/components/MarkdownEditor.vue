<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";

const props = defineProps({
  modelValue: { type: String, default: "" },
  height: { type: String, default: "300px" },
  placeholder: { type: String, default: "Tulis deskripsi..." },
});
const emit = defineEmits(["update:modelValue"]);

const root = ref(null);
let editor = null;

onMounted(() => {
  editor = new Editor({
    el: root.value,
    initialValue: props.modelValue,
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    height: props.height,
    placeholder: props.placeholder,
    usageStatistics: false,
    events: {
      change: () => emit("update:modelValue", editor.getMarkdown()),
    },
  });
});

// Sinkronkan jika nilai diubah dari luar (mis. form di-reset)
watch(
  () => props.modelValue,
  (value) => {
    if (value !== editor.getMarkdown()) {
      editor.setMarkdown(value);
    }
  }
);

onBeforeUnmount(() => {
  editor.destroy();
  editor = null;
});
</script>

<template>
  <div ref="root" data-testid="markdown-editor" />
</template>