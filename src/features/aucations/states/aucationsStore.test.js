import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../api/aucationApi", () => ({
  getAucations: vi.fn(),
  getAucationById: vi.fn(),
  addAucation: vi.fn(),
  updateAucation: vi.fn(),
  updateCover: vi.fn(),
  deleteAucation: vi.fn(),
  addBid: vi.fn(),
  deleteBid: vi.fn(),
  deleteAllAucations: vi.fn(),
}));
vi.mock("../../../helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

import * as aucationApi from "../api/aucationApi";
import {
  showSuccessDialog,
  showErrorDialog,
} from "../../../helpers/toolsHelper";
import { useAucationsStore } from "./aucationsStore";

const failResponse = {
  status: "fail",
  message: "Data tidak valid",
  data: { field: ["Pesan validasi"] },
};
const failText = "Data tidak valid: Pesan validasi";
const file = new File(["x"], "cover.jpg");

const mutations = [
  {
    action: "addAucation",
    args: [{ title: "A" }],
    api: "addAucation",
    pending: "isAucationAdd",
    done: "isAucationAdded",
  },
  {
    action: "changeAucation",
    args: [1, { title: "B" }],
    api: "updateAucation",
    pending: "isAucationChange",
    done: "isAucationChanged",
  },
  {
    action: "changeCover",
    args: [1, file],
    api: "updateCover",
    pending: "isAucationChangeCover",
    done: "isAucationChangedCover",
  },
  {
    action: "deleteAucation",
    args: [1],
    api: "deleteAucation",
    pending: "isAucationDelete",
    done: "isAucationDeleted",
  },
  {
    action: "addBid",
    args: [1, 20000],
    api: "addBid",
    pending: "isBidAdd",
    done: "isBidAdded",
  },
  {
    action: "deleteBid",
    args: [1],
    api: "deleteBid",
    pending: "isBidDelete",
    done: "isBidDeleted",
  },
  {
    action: "deleteAllAucations",
    args: [],
    api: "deleteAllAucations",
    pending: "isAucationDeleteAll",
    done: "isAucationDeletedAll",
  },
];

describe("aucationsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("memiliki state awal yang benar", () => {
    const store = useAucationsStore();

    expect(store.aucations).toEqual([]);
    expect(store.aucation).toBeNull();
    expect(store.isAucation).toBe(false);

    mutations.forEach(({ pending, done }) => {
      expect(store[pending]).toBe(false);
      expect(store[done]).toBe(false);
    });
  });

  describe("fetchAucations", () => {
    it("berhasil: mengisi koleksi lelang dan meneruskan filter", async () => {
      aucationApi.getAucations.mockResolvedValue({
        status: "success",
        data: { aucations: [{ id: 1 }, { id: 2 }] },
      });
      const store = useAucationsStore();

      const result = await store.fetchAucations({ is_me: 1 });

      expect(result).toBe(true);
      expect(aucationApi.getAucations).toHaveBeenCalledWith({ is_me: 1 });
      expect(store.aucations).toEqual([{ id: 1 }, { id: 2 }]);
      expect(store.isAucation).toBe(false);
    });

    it("tanpa filter memakai objek kosong", async () => {
      aucationApi.getAucations.mockResolvedValue({
        status: "success",
        data: { aucations: [] },
      });
      const store = useAucationsStore();

      await store.fetchAucations();

      expect(aucationApi.getAucations).toHaveBeenCalledWith({});
    });

    it("gagal: menampilkan dialog error", async () => {
      aucationApi.getAucations.mockResolvedValue(failResponse);
      const store = useAucationsStore();

      const result = await store.fetchAucations();

      expect(result).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
      expect(store.aucations).toEqual([]);
      expect(store.isAucation).toBe(false);
    });
  });

  describe("fetchAucation", () => {
    it("berhasil: mengisi lelang aktif", async () => {
      aucationApi.getAucationById.mockResolvedValue({
        status: "success",
        data: { aucation: { id: 9, title: "Oculus" } },
      });
      const store = useAucationsStore();

      const result = await store.fetchAucation(9);

      expect(result).toBe(true);
      expect(aucationApi.getAucationById).toHaveBeenCalledWith(9);
      expect(store.aucation).toEqual({ id: 9, title: "Oculus" });
      expect(store.isAucation).toBe(false);
    });

    it("gagal: menampilkan dialog error", async () => {
      aucationApi.getAucationById.mockResolvedValue(failResponse);
      const store = useAucationsStore();

      const result = await store.fetchAucation(9);

      expect(result).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
      expect(store.aucation).toBeNull();
    });
  });

  describe.each(mutations)("$action", ({ action, args, api, pending, done }) => {
    it("berhasil: flag berjalan lalu berhasil, dialog sukses tampil", async () => {
      let resolveRequest;
      aucationApi[api].mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = resolve;
        })
      );
      const store = useAucationsStore();
      store[done] = true; // sisa status dari aksi sebelumnya

      const promise = store[action](...args);
      expect(store[pending]).toBe(true);
      expect(store[done]).toBe(false);

      resolveRequest({ status: "success", message: "Berhasil" });
      const result = await promise;

      expect(result).toBe(true);
      expect(aucationApi[api]).toHaveBeenCalledWith(...args);
      expect(store[pending]).toBe(false);
      expect(store[done]).toBe(true);
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil");
    });

    it("gagal: dialog error tampil dan tidak ditandai berhasil", async () => {
      aucationApi[api].mockResolvedValue(failResponse);
      const store = useAucationsStore();

      const result = await store[action](...args);

      expect(result).toBe(false);
      expect(store[pending]).toBe(false);
      expect(store[done]).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith(failText);
      expect(showSuccessDialog).not.toHaveBeenCalled();
    });
  });
});