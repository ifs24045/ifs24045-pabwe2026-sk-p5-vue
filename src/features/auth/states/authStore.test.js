import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../api/authApi", () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("../../../helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

import * as authApi from "../api/authApi";
import {
  showSuccessDialog,
  showErrorDialog,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import { getAccessToken, putAccessToken } from "../../../helpers/apiHelper";
import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("state awal belum login jika tidak ada token", () => {
    const store = useAuthStore();

    expect(store.token).toBeNull();
    expect(store.isAuthLogin).toBe(false);
    expect(store.isAuthRegister).toBe(false);
    expect(store.isAuthLogout).toBe(false);
    expect(store.isLoading).toBe(false);
  });

  it("state awal sudah login jika token tersimpan", () => {
    putAccessToken("token-lama");
    setActivePinia(createPinia());

    const store = useAuthStore();

    expect(store.token).toBe("token-lama");
    expect(store.isAuthLogin).toBe(true);
  });

  describe("login", () => {
    it("gagal: menampilkan dialog error dan tidak menyimpan token", async () => {
      authApi.login.mockResolvedValue({
        status: "fail",
        message: "Kredensial akun tidak ditemukan",
      });
      const store = useAuthStore();

      const result = await store.login({ email: "a", password: "b" });

      expect(result).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(
        "Kredensial akun tidak ditemukan"
      );
      expect(store.isAuthLogin).toBe(false);
      expect(store.isLoading).toBe(false);
      expect(getAccessToken()).toBeNull();
    });

    it("berhasil: menyimpan token dan menandai login", async () => {
      authApi.login.mockResolvedValue({
        status: "success",
        message: "Berhasil login",
        data: { token: "token-baru", user: { id: 1 } },
      });
      const store = useAuthStore();
      store.isAuthLogout = true;

      const result = await store.login({ email: "a", password: "b" });

      expect(result).toBe(true);
      expect(store.token).toBe("token-baru");
      expect(store.isAuthLogin).toBe(true);
      expect(store.isAuthLogout).toBe(false);
      expect(store.isLoading).toBe(false);
      expect(getAccessToken()).toBe("token-baru");
    });
  });

  describe("register", () => {
    it("gagal: menampilkan pesan beserta detail validasi", async () => {
      authApi.register.mockResolvedValue({
        status: "fail",
        message: "Data tidak valid",
        data: { email: ["Email sudah dipakai"] },
      });
      const store = useAuthStore();

      const result = await store.register({});

      expect(result).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(
        "Data tidak valid: Email sudah dipakai"
      );
      expect(store.isAuthRegister).toBe(false);
      expect(store.isLoading).toBe(false);
    });

    it("berhasil: menandai registrasi dan menampilkan dialog sukses", async () => {
      authApi.register.mockResolvedValue({
        status: "success",
        message: "Berhasil melakukan pendaftaran",
      });
      const store = useAuthStore();

      const result = await store.register({});

      expect(result).toBe(true);
      expect(store.isAuthRegister).toBe(true);
      expect(showSuccessDialog).toHaveBeenCalledWith(
        "Berhasil melakukan pendaftaran"
      );
    });
  });

  describe("logout", () => {
    it("dibatalkan: tetap login dan API tidak dipanggil", async () => {
      putAccessToken("token");
      setActivePinia(createPinia());
      showConfirmDialog.mockResolvedValue(false);
      const store = useAuthStore();

      const result = await store.logout();

      expect(result).toBe(false);
      expect(authApi.logout).not.toHaveBeenCalled();
      expect(store.isAuthLogin).toBe(true);
      expect(getAccessToken()).toBe("token");
    });

    it("dikonfirmasi: memanggil API, token dihapus, status logout", async () => {
      putAccessToken("token");
      setActivePinia(createPinia());
      showConfirmDialog.mockResolvedValue(true);
      authApi.logout.mockResolvedValue({ status: "success" });
      const store = useAuthStore();

      const result = await store.logout();

      expect(result).toBe(true);
      expect(authApi.logout).toHaveBeenCalledTimes(1);
      expect(store.token).toBeNull();
      expect(store.isAuthLogin).toBe(false);
      expect(store.isAuthLogout).toBe(true);
      expect(getAccessToken()).toBeNull();
    });
  });
});