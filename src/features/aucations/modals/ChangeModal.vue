<script setup>
import { watch } from "vue";
import { X } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { useInput } from "../../../hooks/useInput";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import {
  showErrorDialog,
  toApiDateTime,
  toInputDateTime,
} from "../../../helpers/toolsHelper";

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, default: null },
});
const emit = defineEmits(["close", "saved"]);

const aucationsStore = useAucationsStore();

const [title, onTitleChange] = useInput("");
const [description, onDescriptionChange] = useInput("");
const [startBid, onStartBidChange] = useInput("");
const [closedAt, onClosedAtChange] = useInput("");

// Isi form dari data lelang setiap modal dibuka (perubahan yang dibatalkan dibuang)
watch(
  [() => props.open, () => props.aucation],
  ([isOpen, aucation]) => {
    if (isOpen && aucation) {
      title.value = aucation.title;
      description.value = aucation.description;
      startBid.value = String(aucation.start_bid);
      closedAt.value = toInputDateTime(aucation.closed_at);
    }
  },
  { immediate: true }
);

const close = () => emit("close");

const handleSubmit = async () => {
  if (!title.value || !description.value || !startBid.value || !closedAt.value) {
    showErrorDialog("Semua kolom wajib diisi");
    return;
  }

  if (Number(startBid.value) <= 0) {
    showErrorDialog("Harga awal harus lebih dari 0");
    return;
  }

  const success = await aucationsStore.changeAucation(props.aucation.id, {
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
    data-testid="change-modal"
  >
    <div
      class="absolute inset-0 bg-slate-900/50"
      data-testid="modal-overlay"
      @click="close"
    />

    <dialog
      open
      aria-modal="true"
      aria-labelledby="change-modal-title"
      class="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
    >
      <div class="mb-5 flex items-center justify-between">
        <h2
          id="change-modal-title"
          class="text-xl font-extrabold text-slate-900"
        >
          Ubah Lelang
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
          <label for="change-title" class="mb-1.5 block text-sm font-semibold">
            Judul barang
          </label>
          <input
            id="change-title"
            type="text"
            data-testid="title-input"
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
            <label
              for="change-start-bid"
              class="mb-1.5 block text-sm font-semibold"
            >
              Harga awal (Rp)
            </label>
            <input
              id="change-start-bid"
              type="number"
              min="1"
              data-testid="start-bid-input"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              :value="startBid"
              @input="onStartBidChange"
            />
          </div>

          <div>
            <label
              for="change-closed-at"
              class="mb-1.5 block text-sm font-semibold"
            >
              Batas waktu lelang
            </label>
            <input
              id="change-closed-at"
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
            :disabled="aucationsStore.isAucationChange"
          >
            {{
              aucationsStore.isAucationChange
                ? "Menyimpan..."
                : "Simpan perubahan"
            }}
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>