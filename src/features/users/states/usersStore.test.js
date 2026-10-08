import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../api/userApi", () => ({
  getUsers: vi.fn(),
  getUserById: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updatePhoto: vi.fn(),
  updatePassword: vi.fn(),
}));
vi.mock("../../../helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

import * as userApi from "../api/userApi";
import {
  showSuccessDialog,
  showErrorDialog,
} from "../../../helpers/toolsHelper";
import { useUsersStore } from "./usersStore";

const failResponse = {
  status: "fail",
  message: "Data tidak valid",
  data: { field: ["Pesan validasi"] },
};
const failText = "Data tidak valid: Pesan validasi";

describe("usersStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("memiliki state awal yang benar", () => {
    const store = useUsersStore();

    expect(store.users).toEqual([]);
    expect(store.user).toBeNull();
    expect(store.profile).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.isProfileChange).toBe(false);
    expect(store.isProfileChanged).toBe(false);
    expect(store.isPhotoChange).toBe(false);
    expect(store.isPhotoChanged).toBe(false);
    expect(store.isPasswordChange).toBe(false);
    expect(store.isPasswordChanged).toBe(false);
  });

  describe("fetchUsers", () => {
    it("berhasil: mengisi daftar pengguna", async () => {
      userApi.getUsers.mockResolvedValue({
        status: "success",
        data: { users: [{ id: 1 }, { id: 2 }] },
      });
      const store = useUsersStore();

      const result = await store.fetchUsers();

      expect(result).toBe(true);
      expect(store.users).toEqual([{ id: 1 }, { id: 2 }]);
      expect(store.isLoading).toBe(false);
    });

    it("gagal: menampilkan dialog error", async () => {
      userApi.getUsers.mockResolvedValue(failResponse);
      const store = useUsersStore();

      const result = await store.fetchUsers();

      expect(result).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
      expect(store.users).toEqual([]);
      expect(store.isLoading).toBe(false);
    });
  });

  describe("fetchUser", () => {
    it("berhasil: mengisi detail pengguna", async () => {
      userApi.getUserById.mockResolvedValue({
        status: "success",
        data: { user: { id: 7 } },
      });
      const store = useUsersStore();

      const result = await store.fetchUser(7);

      expect(result).toBe(true);
      expect(userApi.getUserById).toHaveBeenCalledWith(7);
      expect(store.user).toEqual({ id: 7 });
      expect(store.isLoading).toBe(false);
    });

    it("gagal: menampilkan dialog error", async () => {
      userApi.getUserById.mockResolvedValue(failResponse);
      const store = useUsersStore();

      const result = await store.fetchUser(7);

      expect(result).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
      expect(store.user).toBeNull();
    });
  });

  describe("fetchProfile", () => {
    it("berhasil: mengisi profil aktif", async () => {
      userApi.getProfile.mockResolvedValue({
        status: "success",
        data: { user: { id: 1, name: "Budi" } },
      });
      const store = useUsersStore();

      const result = await store.fetchProfile();

      expect(result).toBe(true);
      expect(store.profile).toEqual({ id: 1, name: "Budi" });
      expect(store.isLoading).toBe(false);
    });

    it("gagal: menampilkan dialog error", async () => {
      userApi.getProfile.mockResolvedValue(failResponse);
      const store = useUsersStore();

      const result = await store.fetchProfile();

      expect(result).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
      expect(store.profile).toBeNull();
    });
  });

  describe("changeProfile", () => {
    it("berhasil: memperbarui profil dan menandai berhasil", async () => {
      userApi.updateProfile.mockResolvedValue({
        status: "success",
        message: "Berhasil mengubah data",
        data: { user: { id: 1, name: "Baru" } },
      });
      const store = useUsersStore();

      const result = await store.changeProfile({ name: "Baru", email: "a@b" });

      expect(result).toBe(true);
      expect(store.profile).toEqual({ id: 1, name: "Baru" });
      expect(store.isProfileChange).toBe(false);
      expect(store.isProfileChanged).toBe(true);
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah data");
    });

    it("gagal: menampilkan dialog error", async () => {
      userApi.updateProfile.mockResolvedValue(failResponse);
      const store = useUsersStore();

      const result = await store.changeProfile({});

      expect(result).toBe(false);
      expect(store.isProfileChange).toBe(false);
      expect(store.isProfileChanged).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
    });
  });

  describe("changePhoto", () => {
    it("berhasil: menandai berhasil dan memuat ulang profil", async () => {
      userApi.updatePhoto.mockResolvedValue({
        status: "success",
        message: "Berhasil mengubah foto",
      });
      userApi.getProfile.mockResolvedValue({
        status: "success",
        data: { user: { id: 1, photo: "baru.png" } },
      });
      const store = useUsersStore();
      const file = new File(["x"], "baru.png");

      const result = await store.changePhoto(file);

      expect(result).toBe(true);
      expect(userApi.updatePhoto).toHaveBeenCalledWith(file);
      expect(store.isPhotoChange).toBe(false);
      expect(store.isPhotoChanged).toBe(true);
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah foto");
      expect(store.profile).toEqual({ id: 1, photo: "baru.png" });
    });

    it("gagal: menampilkan dialog error tanpa memuat ulang profil", async () => {
      userApi.updatePhoto.mockResolvedValue(failResponse);
      const store = useUsersStore();

      const result = await store.changePhoto(new File(["x"], "a.png"));

      expect(result).toBe(false);
      expect(store.isPhotoChange).toBe(false);
      expect(store.isPhotoChanged).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
      expect(userApi.getProfile).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("berhasil: menandai berhasil dan menampilkan dialog sukses", async () => {
      userApi.updatePassword.mockResolvedValue({
        status: "success",
        message: "Berhasil mengubah kata sandi",
      });
      const store = useUsersStore();

      const result = await store.changePassword({ password: "a" });

      expect(result).toBe(true);
      expect(userApi.updatePassword).toHaveBeenCalledWith({ password: "a" });
      expect(store.isPasswordChange).toBe(false);
      expect(store.isPasswordChanged).toBe(true);
      expect(showSuccessDialog).toHaveBeenCalledWith(
        "Berhasil mengubah kata sandi"
      );
    });

    it("gagal: menampilkan dialog error", async () => {
      userApi.updatePassword.mockResolvedValue(failResponse);
      const store = useUsersStore();

      const result = await store.changePassword({});

      expect(result).toBe(false);
      expect(store.isPasswordChange).toBe(false);
      expect(store.isPasswordChanged).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
    });
  });
});