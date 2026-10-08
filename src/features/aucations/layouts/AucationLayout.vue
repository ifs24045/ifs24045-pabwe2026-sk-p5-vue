<script setup>
import { ref } from "vue";
import { RouterView } from "vue-router";
import NavbarComponent from "../components/NavbarComponent.vue";
import SidebarComponent from "../components/SidebarComponent.vue";

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50" data-testid="aucation-layout">
    <SidebarComponent :open="isSidebarOpen" @close="closeSidebar" />

    <div class="lg:pl-64">
      <NavbarComponent @toggle-sidebar="toggleSidebar" />

      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>