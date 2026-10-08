<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { X, ImageIcon } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { getAssetUrl } from "../../../helpers/apiHelper";
import { showErrorDialog } from "../../../helpers/toolsHelper";

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, required: true },
});
const emit = defineEmits(["close", "saved"]);

const aucationsStore = useAucationsStore();

const fileInput = ref(null);
const file = ref(null);
const previewUrl = ref("");

// Pratinjau file baru jika ada, jika tidak tampilkan cover saat ini
const currentSrc = computed(
  () => previewUrl.value || getAssetUrl(props.aucation.cover)
);

const revokePreview = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = "";
  }
};

const resetSelection = () => {
  revokePreview();
  file.value = null;
  fileInput.value.value = "";
};

const close = () => {
  resetSelection();
  emit("close");
};

const handleFileChange = (event) => {
  const selected = event.target.files[0];
  revokePreview();

  if (!selected) {
    file.value = null;
    return;
  }

  file.value = selected;
  previewUrl.value = URL.createObjectURL(selected);
};

const handleSubmit = async () => {
  if (!file.value) {
    showErrorDialog("Pilih gambar terlebih dahulu");
    return;
  }

  const success = await aucationsStore.changeCover(
    props.aucation.id,
    file.value
  );

  if (success) {
    emit("saved");
    close();
  }
};

onBeforeUnmount(revokePreview);
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    data-testid="change-cover-modal"
  >
    <div
      class="absolute inset-0 bg-slate-900/50"
      data-testid="modal-overlay"
      @click="close"
    />

    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-modal-title"
      class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
    >
      <div class="mb-5 flex items-center justify-between">
        <h2
          id="cover-modal-title"
          class="text-xl font-extrabold text-slate-900"
        >
          Ganti Cover
        </h2>
        <button
          type="button"
          data-testid="close-button"
          class="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          aria-label="Tutup"
          @click="close"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
        <img
          v-if="currentSrc"
          :src="currentSrc"
          alt="Cover barang lelang"
          data-testid="cover-preview"
          class="aspect-video w-full rounded-xl bg-slate-100 object-cover"
        />
        <div
          v-else
          data-testid="cover-placeholder"
          class="flex aspect-video w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400"
        >
          <ImageIcon class="h-10 w-10" />
        </div>

        <div>
          <label for="cover-file" class="mb-1.5 block text-sm font-semibold">
            Pilih gambar baru
          </label>
          <input
            id="cover-file"
            ref="fileInput"
            type="file"
            accept="image/*"
            data-testid="cover-input"
            class="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-600"
            @change="handleFileChange"
          />
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            data-testid="cancel-button"
            class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            @click="close"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="save-button"
            class="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="aucationsStore.isAucationChangeCover"
          >
            {{
              aucationsStore.isAucationChangeCover
                ? "Mengunggah..."
                : "Simpan cover"
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>