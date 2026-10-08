import { defineStore } from "pinia";
import * as userApi from "../api/userApi";
import { isSuccess, getErrorMessage } from "../../../helpers/apiHelper";
import {
  showSuccessDialog,
  showErrorDialog,
} from "../../../helpers/toolsHelper";

export const useUsersStore = defineStore("users", {
  state: () => ({
    users: [],
    user: null,
    profile: null,
    isLoading: false,
    isProfileChange: false,
    isProfileChanged: false,
    isPhotoChange: false,
    isPhotoChanged: false,
    isPasswordChange: false,
    isPasswordChanged: false,
  }),

  actions: {
    async fetchUsers() {
      this.isLoading = true;
      const response = await userApi.getUsers();
      this.isLoading = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.users = response.data.users;
      return true;
    },

    async fetchUser(id) {
      this.isLoading = true;
      const response = await userApi.getUserById(id);
      this.isLoading = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.user = response.data.user;
      return true;
    },

    async fetchProfile() {
      this.isLoading = true;
      const response = await userApi.getProfile();
      this.isLoading = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.profile = response.data.user;
      return true;
    },

    async changeProfile(payload) {
      this.isProfileChange = true;
      this.isProfileChanged = false;
      const response = await userApi.updateProfile(payload);
      this.isProfileChange = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.profile = response.data.user;
      this.isProfileChanged = true;
      showSuccessDialog(response.message);
      return true;
    },

    async changePhoto(file) {
      this.isPhotoChange = true;
      this.isPhotoChanged = false;
      const response = await userApi.updatePhoto(file);
      this.isPhotoChange = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.isPhotoChanged = true;
      showSuccessDialog(response.message);
      // Respons ganti foto tidak membawa data user, jadi muat ulang profil
      await this.fetchProfile();
      return true;
    },

    async changePassword(payload) {
      this.isPasswordChange = true;
      this.isPasswordChanged = false;
      const response = await userApi.updatePassword(payload);
      this.isPasswordChange = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.isPasswordChanged = true;
      showSuccessDialog(response.message);
      return true;
    },
  },
});