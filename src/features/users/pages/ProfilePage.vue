<script setup>
import { onMounted, watch } from "vue";
import { Camera, Mail, User, Lock } from "lucide-vue-next";
import { useUsersStore } from "../states/usersStore";
import { useInput } from "../../../hooks/useInput";
import { getAssetUrl } from "../../../helpers/apiHelper";
import { formatDate, showErrorDialog } from "../../../helpers/toolsHelper";

const usersStore = useUsersStore();

const [name, onNameChange] = useInput("");
const [email, onEmailChange] = useInput("");
const [password, onPasswordChange, resetPassword] = useInput("");
const [newPassword, onNewPasswordChange, resetNewPassword] = useInput("");
const [
  newPasswordConfirmation,
  onNewPasswordConfirmationChange,
  resetNewPasswordConfirmation,
] = useInput("");

// Isi form profil begitu data profil tersedia atau berubah
watch(
  () => usersStore.profile,
  (profile) => {
    if (profile) {
      name.value = profile.name;
      email.value = profile.email;
    }
  },
  { immediate: true }
);

onMounted(() => {
  usersStore.fetchProfile();
});

const handleProfileSubmit = async () => {
  if (!name.value || !email.value) {
    showErrorDialog("Nama dan email wajib diisi");
    return;
  }

  await usersStore.changeProfile({ name: name.value, email: email.value });
};

const handlePhotoChange = async (event) => {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;

  await usersStore.changePhoto(file);
  input.value = ""; // agar file yang sama bisa dipilih ulang
};

const handlePasswordSubmit = async () => {
  if (!password.value || !newPassword.value || !newPasswordConfirmation.value) {
    showErrorDialog("Semua kolom password wajib diisi");
    return;
  }

  if (newPassword.value !== newPasswordConfirmation.value) {
    showErrorDialog("Konfirmasi password baru tidak cocok");
    return;
  }

  const success = await usersStore.changePassword({
    password: password.value,
    newPassword: newPassword.value,
    newPasswordConfirmation: newPasswordConfirmation.value,
  });

  if (success) {
    resetPassword();
    resetNewPassword();
    resetNewPasswordConfirmation();
  }
};
</script>

<template>
  <div data-testid="profile-page">
    <h1 class="mb-6 text-2xl font-extrabold text-slate-900">Profil Saya</h1>

    <p
      v-if="!usersStore.profile"
      class="py-12 text-center text-slate-500"
      data-testid="profile-loading"
    >
      Memuat profil...
    </p>

    <div v-else class="grid gap-6 lg:grid-cols-3">
      <!-- Kartu profil + foto -->
      <section
        class="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
        data-testid="profile-card"
      >
        <img
          :src="getAssetUrl(usersStore.profile.photo)"
          alt="Foto profil"
          data-testid="profile-photo"
          class="mx-auto h-28 w-28 rounded-full bg-slate-100 object-cover"
        />
        <h2
          class="mt-4 text-lg font-bold text-slate-900"
          data-testid="profile-name"
        >
          {{ usersStore.profile.name }}
        </h2>
        <p class="text-sm text-slate-500" data-testid="profile-email">
          {{ usersStore.profile.email }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          Bergabung {{ formatDate(usersStore.profile.created_at) }}
        </p>

        <label
          for="photo"
          data-testid="photo-label"
          class="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
        >
          <Camera class="h-4 w-4" />
          {{ usersStore.isPhotoChange ? "Mengunggah..." : "Ganti foto" }}
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          class="hidden"
          data-testid="photo-input"
          :disabled="usersStore.isPhotoChange"
          @change="handlePhotoChange"
        />
      </section>

      <div class="space-y-6 lg:col-span-2">
        <!-- Form ubah profil -->
        <form
          class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="profile-form"
          novalidate
          @submit.prevent="handleProfileSubmit"
        >
          <h2 class="text-lg font-bold text-slate-900">Ubah Profil</h2>

          <div>
            <label for="profile-name" class="mb-1.5 block text-sm font-semibold">
              Nama
            </label>
            <div class="relative">
              <User
                class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                id="profile-name"
                type="text"
                data-testid="name-input"
                class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                :value="name"
                @input="onNameChange"
              />
            </div>
          </div>

          <div>
            <label for="profile-email" class="mb-1.5 block text-sm font-semibold">
              Email
            </label>
            <div class="relative">
              <Mail
                class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                id="profile-email"
                type="email"
                data-testid="email-input"
                class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                :value="email"
                @input="onEmailChange"
              />
            </div>
          </div>

          <button
            type="submit"
            data-testid="profile-button"
            class="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="usersStore.isProfileChange"
          >
            {{ usersStore.isProfileChange ? "Menyimpan..." : "Simpan perubahan" }}
          </button>
        </form>

        <!-- Form ubah password -->
        <form
          class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="password-form"
          novalidate
          @submit.prevent="handlePasswordSubmit"
        >
          <h2 class="text-lg font-bold text-slate-900">Ubah Password</h2>

          <div>
            <label
              for="current-password"
              class="mb-1.5 block text-sm font-semibold"
            >
              Password saat ini
            </label>
            <div class="relative">
              <Lock
                class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                id="current-password"
                type="password"
                data-testid="current-password-input"
                class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                :value="password"
                @input="onPasswordChange"
              />
            </div>
          </div>

          <div>
            <label for="new-password" class="mb-1.5 block text-sm font-semibold">
              Password baru
            </label>
            <div class="relative">
              <Lock
                class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                id="new-password"
                type="password"
                data-testid="new-password-input"
                class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                :value="newPassword"
                @input="onNewPasswordChange"
              />
            </div>
          </div>

          <div>
            <label
              for="confirm-new-password"
              class="mb-1.5 block text-sm font-semibold"
            >
              Konfirmasi password baru
            </label>
            <div class="relative">
              <Lock
                class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                id="confirm-new-password"
                type="password"
                data-testid="confirm-new-password-input"
                class="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                :value="newPasswordConfirmation"
                @input="onNewPasswordConfirmationChange"
              />
            </div>
          </div>

          <button
            type="submit"
            data-testid="password-button"
            class="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="usersStore.isPasswordChange"
          >
            {{ usersStore.isPasswordChange ? "Mengubah..." : "Ubah password" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>