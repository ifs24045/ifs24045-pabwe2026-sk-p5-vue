<script setup>
import { RouterLink, useRouter } from "vue-router";
import { User, Mail, Lock } from "lucide-vue-next";
import { useAuthStore } from "../states/authStore";
import { useInput } from "../../../hooks/useInput";
import { showErrorDialog } from "../../../helpers/toolsHelper";

const router = useRouter();
const authStore = useAuthStore();

const [name, onNameChange] = useInput("");
const [email, onEmailChange] = useInput("");
const [password, onPasswordChange] = useInput("");
const [confirmPassword, onConfirmPasswordChange] = useInput("");

const handleSubmit = async () => {
  if (!name.value || !email.value || !password.value) {
    showErrorDialog("Nama, email, dan password wajib diisi");
    return;
  }

  if (password.value !== confirmPassword.value) {
    showErrorDialog("Konfirmasi password tidak cocok");
    return;
  }

  const success = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value,
  });

  if (success) {
    router.replace("/auth/login");
  }
};
</script>

<template>
  <div data-testid="register-page">
    <h2 class="text-3xl font-extrabold text-slate-900">Buat akun baru</h2>
    <p class="mt-2 text-sm text-slate-500">
      Daftar gratis dan mulai ikut lelang hari ini.
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="name" class="mb-1.5 block text-sm font-semibold">
          Nama lengkap
        </label>
        <div class="relative">
          <User
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="name"
            type="text"
            data-testid="name-input"
            placeholder="Nama kamu"
            class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            :value="name"
            @input="onNameChange"
          />
        </div>
      </div>

      <div>
        <label label for="login-email-input" class="mb-1.5 block text-sm font-semibold">
          Email
        </label>
        <div class="relative">
          <Mail
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="login-email-input"
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
        <label for="login-password-input" class="mb-1.5 block text-sm font-semibold">
          Password
        </label>
        <div class="relative">
          <Lock
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="login-password-input"
            type="password"
            data-testid="password-input"
            placeholder="Buat password"
            class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            :value="password"
            @input="onPasswordChange"
          />
        </div>
      </div>

      <div>
        <label for="confirm-password" class="mb-1.5 block text-sm font-semibold">
          Konfirmasi password
        </label>
        <div class="relative">
          <Lock
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="confirm-password"
            type="password"
            data-testid="confirm-password-input"
            placeholder="Ulangi password"
            class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            :value="confirmPassword"
            @input="onConfirmPasswordChange"
          />
        </div>
      </div>

      <button
        id="login-submit-button"
        type="submit"
        data-testid="login-button"
        class="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="authStore.isLoading"
      >
        {{ authStore.isLoading ? "Memproses..." : "Daftar" }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-slate-500">
      Sudah punya akun?
      <RouterLink
        to="/auth/login"
        data-testid="login-link"
        class="font-semibold text-indigo-600 hover:underline"
      >
        Masuk
      </RouterLink>
    </p>
  </div>
</template>