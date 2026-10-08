<script setup>
import { computed } from "vue";
import { X } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { useInput } from "../../../hooks/useInput";
import { formatRupiah, showErrorDialog } from "../../../helpers/toolsHelper";

const props = defineProps({
  open: { type: Boolean, default: false },
  aucation: { type: Object, required: true },
});
const emit = defineEmits(["close", "saved"]);

const aucationsStore = useAucationsStore();

const [bid, onBidChange, resetBid] = useInput("");

// 0 jika belum ada penawaran
const highestBid = computed(() =>
  Math.max(0, ...props.aucation.bids.map((item) => item.bid))
);

// Sudah ada penawaran: harus lebih tinggi. Belum ada: minimal harga awal.
const minBid = computed(() =>
  highestBid.value > 0
    ? highestBid.value + 1
    : Number(props.aucation.start_bid)
);

const close = () => {
  resetBid();
  emit("close");
};

const handleSubmit = async () => {
  if (!bid.value) {
    showErrorDialog("Nominal penawaran wajib diisi");
    return;
  }

  if (Number(bid.value) < minBid.value) {
    showErrorDialog(`Penawaran minimal ${formatRupiah(minBid.value)}`);
    return;
  }

  const success = await aucationsStore.addBid(
    props.aucation.id,
    Number(bid.value)
  );

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
    data-testid="bid-modal"
  >
    <div
      class="absolute inset-0 bg-slate-900/50"
      data-testid="modal-overlay"
      @click="close"
    />

    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bid-modal-title"
      class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
    >
      <div class="mb-5 flex items-center justify-between">
        <h2 id="bid-modal-title" class="text-xl font-extrabold text-slate-900">
          Ajukan Penawaran
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

      <dl
        class="mb-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm"
        data-testid="bid-info"
      >
        <div class="flex justify-between">
          <dt class="text-slate-500">Harga awal</dt>
          <dd class="font-semibold" data-testid="start-bid">
            {{ formatRupiah(aucation.start_bid) }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Penawaran tertinggi</dt>
          <dd class="font-semibold" data-testid="highest-bid">
            {{ highestBid > 0 ? formatRupiah(highestBid) : "Belum ada" }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">Penawaran minimal</dt>
          <dd class="font-bold text-indigo-600" data-testid="min-bid">
            {{ formatRupiah(minBid) }}
          </dd>
        </div>
      </dl>

      <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
        <div>
          <label for="bid-amount" class="mb-1.5 block text-sm font-semibold">
            Nominal penawaran (Rp)
          </label>
          <input
            id="bid-amount"
            type="number"
            data-testid="bid-input"
            class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            :value="bid"
            @input="onBidChange"
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
            :disabled="aucationsStore.isBidAdd"
          >
            {{ aucationsStore.isBidAdd ? "Mengirim..." : "Kirim penawaran" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>