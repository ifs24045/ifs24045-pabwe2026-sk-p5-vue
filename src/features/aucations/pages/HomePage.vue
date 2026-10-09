<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { Plus, Search, Trash2, ImageIcon } from "lucide-vue-next";
import { useAucationsStore } from "../states/aucationsStore";
import { useInput } from "../../../hooks/useInput";
import { useNow } from "../../../hooks/useNow";
import { getAssetUrl } from "../../../helpers/apiHelper";
import { computed, defineAsyncComponent, ref, watch } from "vue";
import {
  formatRupiah,
  formatCountdown,
  getHighestBid,
  isAucationClosed,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import AddModal from "../modals/AddModal.vue";

const AddModal = defineAsyncComponent(() =>
  import("../modals/AddModal.vue").then((m) => m.default)
);
const isAddLoaded = ref(false);

const isAddOpen = ref(false);
watch(isAddOpen, (open) => {
  if (open) isAddLoaded.value = true;
});

const TABS = [
  { key: "all", label: "Semua Lelang" },
  { key: "mine", label: "Lelang Saya" },
  { key: "open", label: "Lelang Berlangsung" },
  { key: "closed", label: "Lelang Ditutup" },
];

const route = useRoute();
const router = useRouter();
const aucationsStore = useAucationsStore();
const now = useNow();

const [search, onSearchChange] = useInput("");
const isAddOpen = ref(false);

// Tab aktif mengikuti query ?filter=, nilai tak dikenal dianggap "all"
const activeTab = computed(() => {
  const filter = route.query.filter;
  return TABS.some((tab) => tab.key === filter) ? filter : "all";
});
const isMine = computed(() => activeTab.value === "mine");

const isClosed = (aucation) => isAucationClosed(aucation.closed_at, now.value);

const visibleAucations = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  return aucationsStore.aucations.filter((aucation) => {
    if (activeTab.value === "open" && isClosed(aucation)) return false;
    if (activeTab.value === "closed" && !isClosed(aucation)) return false;
    if (!keyword) return true;

    return (
      aucation.title.toLowerCase().includes(keyword) ||
      aucation.description.toLowerCase().includes(keyword)
    );
  });
});

const statusText = (aucation) =>
  isClosed(aucation)
    ? "Ditutup"
    : `Sisa ${formatCountdown(aucation.closed_at, now.value)}`;

const bidText = (aucation) => {
  const highest = getHighestBid(aucation.bids);
  if (highest > 0) return `Tertinggi ${formatRupiah(highest)}`;

  return aucation.bids.length > 0
    ? `${aucation.bids.length} penawaran masuk`
    : "Belum ada penawaran";
};

const loadAucations = () =>
  aucationsStore.fetchAucations(isMine.value ? { is_me: 1 } : {});

// Hanya filter is_me yang berasal dari server; tab lain disaring di klien
watch(isMine, loadAucations, { immediate: true });

const selectTab = (key) => {
  router.push({ path: "/", query: key === "all" ? {} : { filter: key } });
};

const handleDeleteAll = async () => {
  const confirmed = await showConfirmDialog(
    "Semua lelang milik Anda akan dihapus permanen beserta cover dan penawarannya.",
    "Hapus semua lelang?",
    "Ya, hapus semua"
  );

  if (!confirmed) return;

  const success = await aucationsStore.deleteAllAucations();
  if (success) {
    loadAucations();
  }
};
</script>

<template>
  <div data-testid="home-page">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Dashboard Lelang</h1>
        <p class="text-sm text-slate-500" data-testid="result-count">
          {{ visibleAucations.length }} lelang ditemukan
        </p>
      </div>

      <div class="flex gap-3">
        <button
          v-if="isMine && aucationsStore.aucations.length > 0"
          type="button"
          data-testid="delete-all-button"
          class="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          @click="handleDeleteAll"
        >
          <Trash2 class="h-4 w-4" />
          Hapus semua
        </button>
        <button
          type="button"
          data-testid="add-button"
          class="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          @click="isAddOpen = true"
        >
          <Plus class="h-4 w-4" />
          Tambah Lelang
        </button>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2" role="tablist">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        role="tab"
        :data-testid="`tab-${tab.key}`"
        :aria-selected="activeTab === tab.key ? 'true' : 'false'"
        :class="[
          'rounded-full px-4 py-2 text-sm font-semibold transition',
          activeTab === tab.key
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100',
        ]"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="relative mb-6">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
      />
      <input
        id="search-lelang"
        name="search"
        type="search"
        data-testid="search-input"
        placeholder="Cari judul atau deskripsi..."
        aria-label="Cari lelang"
        class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        :value="search"
        @input="onSearchChange"
      />
    </div>

    <p
      v-if="aucationsStore.isAucation"
      class="py-12 text-center text-slate-500"
      data-testid="loading-state"
    >
      Memuat lelang...
    </p>

    <p
      v-else-if="visibleAucations.length === 0"
      class="py-12 text-center text-slate-500"
      data-testid="empty-state"
    >
      Tidak ada lelang yang cocok.
    </p>

    <div v-else class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="aucation in visibleAucations"
        :key="aucation.id"
        :to="`/aucations/${aucation.id}`"
        data-testid="aucation-card"
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
      >
        <img
          v-if="aucation.cover"
          :src="getAssetUrl(aucation.cover)"
          alt=""
          class="aspect-video w-full bg-slate-100 object-cover"
        />
        <div
          v-else
          data-testid="cover-placeholder"
          class="flex aspect-video w-full items-center justify-center bg-slate-100 text-slate-400"
        >
          <ImageIcon class="h-10 w-10" />
        </div>

        <div class="space-y-2 p-4">
          <span
            data-testid="status-badge"
            :class="[
              'inline-block rounded-full px-3 py-1 text-xs font-bold',
              isClosed(aucation)
                ? 'bg-slate-100 text-slate-600'
                : 'bg-emerald-50 text-emerald-700',
            ]"
          >
            {{ statusText(aucation) }}
          </span>

          <h2 class="truncate text-lg font-bold text-slate-900">
            {{ aucation.title }}
          </h2>
          <p class="text-xs text-slate-500">oleh {{ aucation.author.name }}</p>

          <div class="flex items-end justify-between pt-1 text-sm">
            <div>
              <p class="text-xs text-slate-500">Harga awal</p>
              <p class="font-bold text-indigo-600">
                {{ formatRupiah(aucation.start_bid) }}
              </p>
            </div>
            <p class="text-xs text-slate-500" data-testid="bid-text">
              {{ bidText(aucation) }}
            </p>
          </div>
        </div>
      </RouterLink>
    </div>

    <AddModal
      :open="isAddOpen"
      @close="isAddOpen = false"
      @saved="loadAucations"
    />
  </div>
</template>