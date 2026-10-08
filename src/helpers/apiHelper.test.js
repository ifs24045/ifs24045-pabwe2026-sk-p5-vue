import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getAccessToken,
  putAccessToken,
  removeAccessToken,
  isSuccess,
  getErrorMessage,
  buildQuery,
  apiFetch,
  getAssetUrl,
} from "./apiHelper";

describe("apiHelper", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("token", () => {
    it("menyimpan, mengambil, dan menghapus token", () => {
      expect(getAccessToken()).toBeNull();

      putAccessToken("abc123");
      expect(getAccessToken()).toBe("abc123");

      removeAccessToken();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe("isSuccess", () => {
    it("true hanya jika status === 'success'", () => {
      expect(isSuccess({ status: "success" })).toBe(true);
      expect(isSuccess({ status: "fail" })).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    it("memakai pesan default jika message kosong", () => {
      expect(getErrorMessage({})).toBe("Terjadi kesalahan");
    });

    it("mengembalikan message saja jika tidak ada detail", () => {
      expect(getErrorMessage({ message: "Gagal", data: null })).toBe("Gagal");
      expect(getErrorMessage({ message: "Gagal", data: "teks" })).toBe("Gagal");
      expect(getErrorMessage({ message: "Gagal", data: {} })).toBe("Gagal");
    });

    it("menggabungkan message dengan detail validasi", () => {
      const response = {
        message: "Data tidak valid",
        data: { email: ["Email sudah dipakai"], password: ["Terlalu pendek"] },
      };

      expect(getErrorMessage(response)).toBe(
        "Data tidak valid: Email sudah dipakai, Terlalu pendek"
      );
    });
  });

  describe("buildQuery", () => {
    it("mengembalikan string kosong tanpa parameter", () => {
      expect(buildQuery()).toBe("");
      expect(buildQuery({})).toBe("");
    });

    it("mengabaikan nilai kosong, null, dan undefined", () => {
      expect(buildQuery({ a: "", b: null, c: undefined })).toBe("");
    });

    it("membangun query string dari parameter valid", () => {
      expect(buildQuery({ is_me: 1, is_closed: 0, q: "" })).toBe(
        "?is_me=1&is_closed=0"
      );
    });
  });

    describe("getAssetUrl", () => {
    it("mengembalikan string kosong untuk path kosong", () => {
      expect(getAssetUrl("")).toBe("");
      expect(getAssetUrl(null)).toBe("");
    });

    it("mengembalikan URL absolut apa adanya", () => {
      expect(getAssetUrl("https://cdn.example.com/a.png")).toBe(
        "https://cdn.example.com/a.png"
      );
    });

    it("mengubah path relatif menjadi URL penuh", () => {
      const url = getAssetUrl("img/profile/1.png");

      expect(url).toMatch(/^https?:\/\//);
      expect(url.endsWith("/img/profile/1.png")).toBe(true);
      expect(url).not.toContain("/api/v1");
      expect(getAssetUrl("/img/profile/1.png")).toBe(url);
    });
  });

  describe("apiFetch", () => {
    const mockResponse = (data) =>
      fetch.mockResolvedValue({ json: () => Promise.resolve(data) });

    it("GET dengan token dan query params", async () => {
      putAccessToken("token-xyz");
      mockResponse({ status: "success", data: [] });

      const result = await apiFetch("/aucations", { params: { is_me: 1 } });

      expect(result).toEqual({ status: "success", data: [] });
      expect(fetch).toHaveBeenCalledWith(
        `${DELCOM_BASEURL}/aucations?is_me=1`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer token-xyz",
          },
          body: undefined,
        }
      );
    });

    it("GET tanpa opsi dan tanpa token", async () => {
      mockResponse({ status: "success" });

      await apiFetch("/aucations");

      expect(fetch).toHaveBeenCalledWith(`${DELCOM_BASEURL}/aucations`, {
        method: "GET",
        headers: { Accept: "application/json" },
        body: undefined,
      });
    });

    it("mengirim body JSON dengan Content-Type", async () => {
      mockResponse({ status: "success" });

      await apiFetch("/auth/login", {
        method: "POST",
        body: { email: "a@b.com" },
        auth: false,
      });

      expect(fetch).toHaveBeenCalledWith(`${DELCOM_BASEURL}/auth/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "a@b.com" }),
      });
    });

    it("tidak mengirim Authorization jika auth = false", async () => {
      putAccessToken("token-xyz");
      mockResponse({ status: "success" });

      await apiFetch("/auth/login", { auth: false });

      expect(fetch.mock.calls[0][1].headers).toEqual({
        Accept: "application/json",
      });
    });

    it("mengirim FormData tanpa Content-Type", async () => {
      mockResponse({ status: "success" });
      const formData = new FormData();
      formData.append("cover", "file");

      await apiFetch("/aucations/1/cover", { method: "POST", body: formData });

      const options = fetch.mock.calls[0][1];
      expect(options.body).toBe(formData);
      expect(options.headers["Content-Type"]).toBeUndefined();
    });

    it("mengembalikan status fail saat fetch error", async () => {
      fetch.mockRejectedValue(new Error("network"));

      const result = await apiFetch("/aucations");

      expect(result).toEqual({
        status: "fail",
        message: "Tidak dapat terhubung ke server",
        data: null,
      });
    });

    it("mengembalikan status fail saat respons bukan JSON", async () => {
      fetch.mockResolvedValue({ json: () => Promise.reject(new Error("bad")) });

      const result = await apiFetch("/aucations");

      expect(result.status).toBe("fail");
    });
  });
});