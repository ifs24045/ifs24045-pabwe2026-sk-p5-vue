<script setup>
import { RouterView } from "vue-router";
import { Gavel } from "lucide-vue-next";
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2" data-testid="auth-layout">
    <!-- Banner (hanya tampil di layar besar) -->
    <aside
      class="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex"
      data-testid="auth-banner"
    >
      <div class="flex items-center gap-3 text-xl font-extrabold">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"
        >
          <Gavel class="h-6 w-6" />
        </span>
        Delcom Auction
      </div>

      <div>
        <h1 class="text-4xl font-extrabold leading-tight">
          Temukan barang incaranmu, tawar sekarang.
        </h1>
        <p class="mt-4 max-w-md text-indigo-100">
          Pasang lelang barangmu sendiri atau ikut menawar barang dari
          pengguna lain, semuanya dalam satu tempat.
        </p>
      </div>

      <p class="text-sm text-indigo-200">&copy; Delcom Auction</p>
    </aside>

    <!-- Area formulir -->
    <main class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md">
        <div
          class="mb-8 flex items-center gap-2 text-lg font-extrabold text-indigo-600 lg:hidden"
        >
          <Gavel class="h-5 w-5" />
          Delcom Auction
        </div>

        <RouterView />
      </div>
    </main>
  </div>
</template>