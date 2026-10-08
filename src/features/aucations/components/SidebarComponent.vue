<script setup>
import { RouterLink, useRoute } from "vue-router";
import { LayoutDashboard, Gavel, Users, User, X } from "lucide-vue-next";

defineProps({
  open: { type: Boolean, default: false },
});
defineEmits(["close"]);

const route = useRoute();

const items = [
  {
    label: "Dashboard Lelang",
    to: "/",
    icon: LayoutDashboard,
    match: (r) => r.path === "/" && r.query.filter !== "mine",
  },
  {
    label: "Lelang Saya",
    to: { path: "/", query: { filter: "mine" } },
    icon: Gavel,
    match: (r) => r.path === "/" && r.query.filter === "mine",
  },
  {
    label: "Daftar Pengguna",
    to: "/users",
    icon: Users,
    match: (r) => r.path === "/users",
  },
  {
    label: "Profil Saya",
    to: "/profile",
    icon: User,
    match: (r) => r.path === "/profile",
  },
];

const linkClass = (item) =>
  item.match(route)
    ? "bg-indigo-50 text-indigo-700"
    : "text-slate-600 hover:bg-slate-100";
</script>

<template>
  <div data-testid="sidebar-root">
    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
      data-testid="sidebar-overlay"
      @click="$emit('close')"
    />

    <aside
      data-testid="sidebar"
      aria-label="Sidebar aplikasi"
      :class="[
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white p-4 transition-transform lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="mb-6 flex items-center justify-between px-2">
        <div class="flex items-center gap-2 text-lg font-extrabold text-indigo-600">
          <Gavel class="h-5 w-5" />
          Delcom Auction
        </div>
        <button
          type="button"
          data-testid="close-button"
          class="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Tutup menu"
          @click="$emit('close')"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <nav class="space-y-1" aria-label="Navigasi utama">
        <RouterLink
          v-for="item in items"
          :key="item.label"
          :to="item.to"
          data-testid="sidebar-link"
          :class="[
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
            linkClass(item),
          ]"
          :aria-current="item.match(route) ? 'page' : null"
          @click="$emit('close')"
        >
          <component :is="item.icon" class="h-5 w-5" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>
  </div>
</template>