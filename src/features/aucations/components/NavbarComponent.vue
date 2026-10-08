<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { Menu, LogOut } from "lucide-vue-next";
import { useUsersStore } from "../../users/states/usersStore";
import { useAuthStore } from "../../auth/states/authStore";
import { getAssetUrl } from "../../../helpers/apiHelper";

defineEmits(["toggle-sidebar"]);

const router = useRouter();
const usersStore = useUsersStore();
const authStore = useAuthStore();

onMounted(() => {
  if (!usersStore.profile) {
    usersStore.fetchProfile();
  }
});

const handleLogout = async () => {
  const success = await authStore.logout();

  if (success) {
    router.replace("/auth/login");
  }
};
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6"
    data-testid="navbar"
  >
    <button
      type="button"
      data-testid="menu-button"
      class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      aria-label="Buka menu"
      @click="$emit('toggle-sidebar')"
    >
      <Menu class="h-6 w-6" />
    </button>

    <div class="ml-auto flex items-center gap-4">
      <div
        v-if="usersStore.profile"
        class="flex items-center gap-3"
        data-testid="user-info"
      >
        <img
          :src="getAssetUrl(usersStore.profile.photo)"
          :alt="usersStore.profile.name"
          class="h-9 w-9 rounded-full bg-slate-100 object-cover"
        />
        <div class="hidden text-left sm:block">
          <p class="text-sm font-bold leading-tight text-slate-900">
            {{ usersStore.profile.name }}
          </p>
          <p class="text-xs text-slate-500">{{ usersStore.profile.email }}</p>
        </div>
      </div>
      <span v-else class="text-sm text-slate-500" data-testid="user-loading">
        Memuat...
      </span>

      <button
        type="button"
        data-testid="logout-button"
        class="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        @click="handleLogout"
      >
        <LogOut class="h-4 w-4" />
        <span class="hidden sm:inline">Keluar</span>
      </button>
    </div>
  </header>
</template>