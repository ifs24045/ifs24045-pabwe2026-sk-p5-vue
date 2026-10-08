import { defineStore } from "pinia";
import * as authApi from "../api/authApi";
import { useUsersStore } from "../../users/states/usersStore";
import { useAucationsStore } from "../../aucations/states/aucationsStore";
import {
  getAccessToken,
  putAccessToken,
  removeAccessToken,
  isSuccess,
  getErrorMessage,
} from "../../../helpers/apiHelper";
import {
  showSuccessDialog,
  showErrorDialog,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: getAccessToken(),
    isAuthLogin: Boolean(getAccessToken()),
    isAuthRegister: false,
    isAuthLogout: false,
    isLoading: false,
  }),

  actions: {
    async login(payload) {
      this.isLoading = true;
      const response = await authApi.login(payload);
      this.isLoading = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      const token = response.data.token;
      putAccessToken(token);
      this.token = token;
      this.isAuthLogin = true;
      this.isAuthLogout = false;
      return true;
    },

    async register(payload) {
      this.isLoading = true;
      const response = await authApi.register(payload);
      this.isLoading = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.isAuthRegister = true;
      showSuccessDialog(response.message);
      return true;
    },

    async logout() {
      const confirmed = await showConfirmDialog(
        "Anda akan keluar dari akun ini.",
        "Keluar?",
        "Ya, keluar"
      );

      if (!confirmed) return false;

      // Cabut token di server; sesi lokal tetap dibersihkan
      // walaupun server gagal (misalnya token sudah kedaluwarsa)
      await authApi.logout();

      removeAccessToken();
      this.token = null;
      this.isAuthLogin = false;
      this.isAuthLogout = true;
      useUsersStore().$reset();
      useAucationsStore().$reset();
      return true;
    },
  },
});