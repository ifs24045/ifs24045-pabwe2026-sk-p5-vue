<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  Camera,
  ImageIcon,
  Pencil,
  Trash2,
  Gavel,
} from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { useUsersStore } from "../../users/states/usersStore";
import { useNow } from "../../../hooks/useNow";
import { getAssetUrl } from "../../../helpers/apiHelper";
import {
  formatDate,
  formatRupiah,
  formatCountdown,
  getHighestBid,
  isAucationClosed,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import MarkdownViewer from "../components/MarkdownViewer.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import ChangeCoverModal from "../modals/ChangeCoverModal.vue";
import BidModal from "../modals/BidModal.vue";

const route = useRoute();
const router = useRouter();
const aucationsStore = useAucationsStore();
const usersStore = useUsersStore();
const now = useNow();

const isChangeOpen = ref(false);
const isCoverOpen = ref(false);
const isBidOpen = ref(false);

// Hanya tampilkan data yang cocok dengan URL (cegah data lelang lama muncul)
const aucation = computed(() => {
  const data = aucationsStore.aucation;
  return data && String(data.id) === String(route.params.aucationId)
    ? data
    : null;
});

const isOwner = computed(
  () => usersStore.profile?.id === aucation.value.user_id
);
const isClosed = computed(() =>
  isAucationClosed(aucation.value.closed_at, now.value)
);
const highestBid = computed(() => getHighestBid(aucation.value.bids));
const sortedBids = computed(() =>
  [...aucation.value.bids].sort((a, b) => b.bid - a.bid)
);
const myBidId = computed(() =>
  aucation.value.my_bid ? aucation.value.my_bid.id : null
);

const statusText = computed(() =>
  isClosed.value
    ? "Ditutup"
    : `Sisa ${formatCountdown(aucation.value.closed_at, now.value)}`
);

const loadAucation = () =>
  aucationsStore.fetchAucation(route.params.aucationId);

watch(() => route.params.aucationId, loadAucation, { immediate: true });

const handleDelete = async () => {
  const confirmed = await showConfirmDialog(
    "Lelang ini akan dihapus permanen beserta cover dan penawarannya.",
    "Hapus lelang?",
    "Ya, hapus"
  );

  if (!confirmed) return;

  const success = await aucationsStore.deleteAucation(aucation.value.id);
  if (success) {
    router.replace("/");
  }
};

const handleCancelBid = async () => {
  const confirmed = await showConfirmDialog(
    "Penawaran Anda pada lelang ini akan dibatalkan.",
    "Batalkan penawaran?",
    "Ya, batalkan"
  );

  if (!confirmed) return;

  const success = await aucationsStore.deleteBid(aucation.value.id);
  if (success) {
    loadAucation();
  }
};
</script>

<template>
  <div data-testid="detail-page">
    <RouterLink
      to="/"
      data-testid="back-link"
      class="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
    >
      <ArrowLeft class="h-4 w-4" />
      Kembali ke dashboard
    </RouterLink>

    <h1
      v-if="aucationsStore.isAucation"
      class="py-12 text-center text-slate-500"
      data-testid="loading-state"
    >
      Memuat lelang...
    </h1>

    <h1
      v-else-if="!aucation"
      class="py-12 text-center text-slate-500"
      data-testid="not-found-state"
    >
      Lelang tidak ditemukan.
    </h1>

    <div v-else>
      <div class="grid gap-8 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <img
            v-if="aucation.cover"
            :src="getAssetUrl(aucation.cover)"
            :alt="aucation.title"
            data-testid="cover-image"
            class="aspect-video w-full rounded-2xl bg-slate-100 object-cover"
          />
          <div
            v-else
            data-testid="cover-placeholder"
            class="flex aspect-video w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-400"
          >
            <ImageIcon class="h-16 w-16" />
          </div>

          <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1
              class="text-2xl font-extrabold text-slate-900"
              data-testid="aucation-title"
            >
              {{ aucation.title }}
            </h1>
            <div class="mt-4" data-testid="description">
              <MarkdownViewer :content="aucation.description" />
            </div>
          </section>

          <section
            class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            data-testid="bid-history"
          >
            <h2 class="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Gavel class="h-5 w-5 text-indigo-600" />
              Riwayat Penawaran
            </h2>

            <p
              v-if="sortedBids.length === 0"
              class="py-4 text-sm text-slate-500"
              data-testid="bid-empty"
            >
              Belum ada penawaran.
            </p>

            <ul v-else class="divide-y divide-slate-100">
              <li
                v-for="(bid, index) in sortedBids"
                :key="bid.id"
                data-testid="bid-item"
                class="flex items-center justify-between py-3"
              >
                <div>
                  <p class="font-bold text-slate-900">
                    {{ formatRupiah(bid.bid) }}
                  </p>
                  <p class="text-xs text-slate-500">
                    {{ formatDate(bid.created_at) }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <span
                    v-if="index === 0"
                    class="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
                  >
                    Tertinggi
                  </span>
                  <span
                    v-if="bid.id === myBidId"
                    class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"
                  >
                    Tawaran Anda
                  </span>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <aside class="space-y-6">
          <section
            class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <span
              data-testid="status-badge"
              :class="[
                'inline-block rounded-full px-3 py-1 text-xs font-bold',
                isClosed
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-emerald-50 text-emerald-700',
              ]"
            >
              {{ statusText }}
            </span>

            <div class="flex items-center gap-3">
              <img
                :src="getAssetUrl(aucation.author.photo)"
                :alt="aucation.author.name"
                class="h-10 w-10 rounded-full bg-slate-100 object-cover"
              />
              <div>
                <p class="text-xs text-slate-500">Dilelang oleh</p>
                <p class="text-sm font-bold text-slate-900" data-testid="author-name">
                  {{ aucation.author.name }}
                </p>
              </div>
            </div>

            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-slate-500">Ditutup pada</dt>
                <dd class="font-semibold" data-testid="closed-at">
                  {{ formatDate(aucation.closed_at) }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Harga awal</dt>
                <dd class="font-semibold" data-testid="start-bid">
                  {{ formatRupiah(aucation.start_bid) }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500">Penawaran tertinggi</dt>
                <dd class="text-lg font-extrabold text-indigo-600" data-testid="highest-bid">
                  {{ highestBid > 0 ? formatRupiah(highestBid) : "Belum ada" }}
                </dd>
              </div>
            </dl>
          </section>

          <section
            v-if="isOwner"
            class="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            data-testid="owner-actions"
          >
            <h2 class="text-sm font-bold text-slate-900">Kelola lelang</h2>
            <button
              type="button"
              data-testid="change-button"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              @click="isChangeOpen = true"
            >
              <Pencil class="h-4 w-4" />
              Ubah lelang
            </button>
            <button
              type="button"
              data-testid="cover-button"
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              @click="isCoverOpen = true"
            >
              <Camera class="h-4 w-4" />
              Ganti cover
            </button>
            <button
              type="button"
              data-testid="delete-button"
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="aucationsStore.isAucationDelete"
              @click="handleDelete"
            >
              <Trash2 class="h-4 w-4" />
              Hapus lelang
            </button>
          </section>

          <section
            v-else
            class="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            data-testid="bid-actions"
          >
            <p
              v-if="isClosed"
              class="text-sm text-slate-500"
              data-testid="closed-notice"
            >
              Lelang ini sudah ditutup, penawaran tidak dapat diajukan lagi.
            </p>

            <template v-else-if="aucation.my_bid">
              <p class="text-sm text-slate-500">Penawaran Anda</p>
              <p class="text-xl font-extrabold text-indigo-600" data-testid="my-bid">
                {{ formatRupiah(aucation.my_bid.bid) }}
              </p>
              <button
                type="button"
                data-testid="cancel-bid-button"
                class="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="aucationsStore.isBidDelete"
                @click="handleCancelBid"
              >
                Batalkan penawaran
              </button>
            </template>

            <button
              v-else
              type="button"
              data-testid="bid-button"
              class="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"
              @click="isBidOpen = true"
            >
              Ajukan penawaran
            </button>
          </section>
        </aside>
      </div>

      <ChangeModal
        :open="isChangeOpen"
        :aucation="aucation"
        @close="isChangeOpen = false"
        @saved="loadAucation"
      />
      <ChangeCoverModal
        :open="isCoverOpen"
        :aucation="aucation"
        @close="isCoverOpen = false"
        @saved="loadAucation"
      />
      <BidModal
        :open="isBidOpen"
        :aucation="aucation"
        @close="isBidOpen = false"
        @saved="loadAucation"
      />
    </div>
  </div>
</template>