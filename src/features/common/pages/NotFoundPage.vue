<script setup>
import { RouterLink } from "vue-router";
import { Gavel } from "lucide-vue-next";
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    data-testid="not-found-page"
  >
    <span
      class="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600"
    >
      <Gavel class="h-10 w-10" />
    </span>

    <p class="mt-6 text-7xl font-extrabold text-indigo-600">404</p>
    <h1 class="mt-2 text-2xl font-bold text-slate-900">
      Halaman tidak ditemukan
    </h1>
    <p class="mt-2 max-w-md text-sm text-slate-500">
      Alamat yang kamu tuju tidak ada atau sudah dipindahkan. Periksa kembali
      URL-nya atau kembali ke beranda.
    </p>

    <RouterLink
      to="/"
      data-testid="home-link"
      class="mt-8 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
    >
      Kembali ke beranda
    </RouterLink>
  </div>
</template>