<script setup>
import { RouterLink, useRouter } from "vue-router";
import { Mail, Lock } from "lucide-vue-next";
import { useAuthStore } from "../states/authStore";
import { useInput } from "../../../hooks/useInput";
import { showErrorDialog } from "../../../helpers/toolsHelper";

const router = useRouter();
const authStore = useAuthStore();

const [email, onEmailChange] = useInput("");
const [password, onPasswordChange] = useInput("");

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    showErrorDialog("Email dan password wajib diisi");
    return;
  }

  const success = await authStore.login({
    email: email.value,
    password: password.value,
  });

  if (success) {
    router.replace("/");
  }
};
</script>

<template>
  <div data-testid="login-page">
    <h2 class="text-3xl font-extrabold text-slate-900">
      Selamat datang kembali
    </h2>
    <p class="mt-2 text-sm text-slate-500">
      Masuk untuk mulai menawar barang lelang.
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <div class="relative">
          <Mail
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="email"
            type="email"
            data-testid="email-input"
            placeholder="nama@email.com"
            class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            :value="email"
            @input="onEmailChange"
          />
        </div>
      </div>

      <div>
        <label for="password" class="mb-1.5 block text-sm font-semibold">
          Password
        </label>
        <div class="relative">
          <Lock
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="password"
            type="password"
            data-testid="password-input"
            placeholder="Masukkan password"
            class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            :value="password"
            @input="onPasswordChange"
          />
        </div>
      </div>

      <button
        type="submit"
        data-testid="login-button"
        class="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="authStore.isLoading"
      >
        {{ authStore.isLoading ? "Memproses..." : "Masuk" }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      Belum punya akun?
      <RouterLink
        to="/auth/register"
        data-testid="register-link"
        class="font-semibold text-indigo-600 hover:underline"
      >
        Daftar sekarang
      </RouterLink>
    </p>
  </div>
</template>