<script setup>
import { onMounted } from "vue";
import { Mail, Users } from "lucide-vue-next";
import { useUsersStore } from "../states/usersStore";
import { getAssetUrl } from "../../../helpers/apiHelper";
import { formatDate } from "../../../helpers/toolsHelper";

const usersStore = useUsersStore();

onMounted(() => {
  usersStore.fetchUsers();
});
</script>

<template>
  <div data-testid="users-page">
    <div class="mb-6 flex items-center gap-3">
      <span
        class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"
      >
        <Users class="h-6 w-6" />
      </span>
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">
          Direktori Pengguna
        </h1>
        <p class="text-sm text-slate-500" data-testid="users-count">
          {{ usersStore.users.length }} pengguna terdaftar
        </p>
      </div>
    </div>

    <p
      v-if="usersStore.isLoading"
      class="py-12 text-center text-slate-500"
      data-testid="users-loading"
    >
      Memuat pengguna...
    </p>

    <p
      v-else-if="usersStore.users.length === 0"
      class="py-12 text-center text-slate-500"
      data-testid="users-empty"
    >
      Belum ada pengguna terdaftar.
    </p>

    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="user in usersStore.users"
        :key="user.id"
        data-testid="user-card"
        class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <img
          :src="getAssetUrl(user.photo)"
          :alt="user.name"
          class="h-14 w-14 shrink-0 rounded-full bg-slate-100 object-cover"
        />
        <div class="min-w-0">
          <h2 class="truncate font-bold text-slate-900">{{ user.name }}</h2>
          <p class="flex items-center gap-1 truncate text-sm text-slate-500">
            <Mail class="h-4 w-4 shrink-0" />
            {{ user.email }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Bergabung {{ formatDate(user.created_at) }}
          </p>
        </div>
      </article>
    </div>
  </div>
</template>