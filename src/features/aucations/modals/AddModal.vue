<script setup>
import { X } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { useInput } from "../../../hooks/useInput";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import { showErrorDialog, toApiDateTime } from "../../../helpers/toolsHelper";

defineProps({
  open: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "saved"]);

const aucationsStore = useAucationsStore();

const [title, onTitleChange, resetTitle] = useInput("");
const [description, onDescriptionChange, resetDescription] = useInput("");
const [startBid, onStartBidChange, resetStartBid] = useInput("");
const [closedAt, onClosedAtChange, resetClosedAt] = useInput("");

const resetForm = () => {
  resetTitle();
  resetDescription();
  resetStartBid();
  resetClosedAt();
};

const close = () => {
  resetForm();
  emit("close");
};

const handleSubmit = async () => {
  if (!title.value || !description.value || !startBid.value || !closedAt.value) {
    showErrorDialog("Semua kolom wajib diisi");
    return;
  }

  if (Number(startBid.value) <= 0) {
    showErrorDialog("Harga awal harus lebih dari 0");
    return;
  }

  const success = await aucationsStore.addAucation({
    title: title.value,
    description: description.value,
    startBid: startBid.value,
    closedAt: toApiDateTime(closedAt.value),
  });

  if (success) {
    emit("saved");
    close();
  }
};
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    data-testid="add-modal"
  >
    <div
      class="absolute inset-0 bg-slate-900/50"
      data-testid="modal-overlay"
      @click="close"
    />

    <dialog
      open
      aria-modal="true"
      aria-labelledby="add-modal-title"
      class="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
    >
      <div class="mb-5 flex items-center justify-between">
        <h2 id="add-modal-title" class="text-xl font-extrabold text-slate-900">
          Tambah Lelang
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
        <div>
          <label for="add-title" class="mb-1.5 block text-sm font-semibold">
            Judul barang
          </label>
          <input
            id="add-title"
            type="text"
            data-testid="title-input"
            placeholder="Contoh: Keyboard Gaming RGB"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            :value="title"
            @input="onTitleChange"
          />
        </div>

        <div>
          <span class="mb-1.5 block text-sm font-semibold">Deskripsi</span>
          <MarkdownEditor
            :model-value="description"
            @update:model-value="onDescriptionChange"
          />
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="add-start-bid" class="mb-1.5 block text-sm font-semibold">
              Harga awal (Rp)
            </label>
            <input
              id="add-start-bid"
              type="number"
              min="1"
              data-testid="start-bid-input"
              placeholder="200000"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              :value="startBid"
              @input="onStartBidChange"
            />
          </div>

          <div>
            <label for="add-closed-at" class="mb-1.5 block text-sm font-semibold">
              Batas waktu lelang
            </label>
            <input
              id="add-closed-at"
              type="datetime-local"
              data-testid="closed-at-input"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              :value="closedAt"
              @input="onClosedAtChange"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
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
            :disabled="aucationsStore.isAucationAdd"
          >
            {{ aucationsStore.isAucationAdd ? "Menyimpan..." : "Simpan lelang" }}
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>