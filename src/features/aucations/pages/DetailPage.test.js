import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

const settle = async () => {
  for (let i = 0; i < 5; i++) await flushPromises();
};

// Modal dan viewer diganti stub agar Toast UI tidak ikut dimuat
vi.mock("../components/MarkdownViewer.vue", async () => {
  const { h } = await import("vue");
  return {
    default: {
      props: ["content"],
      render() {
        return h("div", { "data-testid": "markdown-viewer" }, this.content);
      },
    },
  };
});
vi.mock("../modals/ChangeModal.vue", async () => {
  const { h } = await import("vue");
  return {
    default: {
      props: ["open", "aucation"],
      emits: ["close", "saved"],
      render() {
        return this.open
          ? h("div", { "data-testid": "change-modal" }, [
              h("button", {
                "data-testid": "change-modal-saved",
                onClick: () => this.$emit("saved"),
              }),
              h("button", {
                "data-testid": "change-modal-close",
                onClick: () => this.$emit("close"),
              }),
            ])
          : null;
      },
    },
  };
});
vi.mock("../modals/ChangeCoverModal.vue", async () => {
  const { h } = await import("vue");
  return {
    default: {
      props: ["open", "aucation"],
      emits: ["close", "saved"],
      render() {
        return this.open
          ? h("div", { "data-testid": "cover-modal" }, [
              h("button", {
                "data-testid": "cover-modal-saved",
                onClick: () => this.$emit("saved"),
              }),
              h("button", {
                "data-testid": "cover-modal-close",
                onClick: () => this.$emit("close"),
              }),
            ])
          : null;
      },
    },
  };
});
vi.mock("../modals/BidModal.vue", async () => {
  const { h } = await import("vue");
  return {
    default: {
      props: ["open", "aucation"],
      emits: ["close", "saved"],
      render() {
        return this.open
          ? h("div", { "data-testid": "bid-modal" }, [
              h("button", {
                "data-testid": "bid-modal-saved",
                onClick: () => this.$emit("saved"),
              }),
              h("button", {
                "data-testid": "bid-modal-close",
                onClick: () => this.$emit("close"),
              }),
            ])
          : null;
      },
    },
  };
});
vi.mock("../../../helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal()),
  showConfirmDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import { showConfirmDialog } from "../../../helpers/toolsHelper";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { useAucationsStore } from "../states/aucationsStore";
import { useUsersStore } from "../../users/states/usersStore";
import DetailPage from "./DetailPage.vue";

const NOW = new Date(2026, 9, 8, 0, 0, 0);
const Empty = { render: () => null };
const routes = [
  { path: "/", component: Empty },
  { path: "/aucations/:aucationId", component: Empty },
];

const detail = {
  id: 3,
  user_id: 1,
  title: "Oculus Quest 2",
  cover: "img/aucations/cover/3.jpeg",
  description: "Oculus **mulus**",
  start_bid: 5000000,
  closed_at: "2026-10-10 12:00:00",
  author: { name: "Budi", photo: "img/profile/1.png" },
  bids: [
    { id: 1, bid: 6000000, created_at: "2026-10-05T08:44:12.000000Z" },
    { id: 2, bid: 7000000, created_at: "2026-10-06T08:44:12.000000Z" },
  ],
  my_bid: null,
};

const OWNER = { id: 1 };
const PARTICIPANT = { id: 2 };

const setup = async ({
  aucation = detail,
  profile = PARTICIPANT,
  id = "3",
  patch = {},
} = {}) => {
  const pinia = createMockPinia();
  const store = useAucationsStore(pinia);
  const usersStore = useUsersStore(pinia);
  vi.spyOn(store, "fetchAucation").mockResolvedValue(true);
  vi.spyOn(store, "deleteAucation").mockResolvedValue(true);
  vi.spyOn(store, "deleteBid").mockResolvedValue(true);
  store.$patch({ aucation, ...patch });
  usersStore.$patch({ profile });

  const utils = await renderWithProviders(DetailPage, {
    pinia,
    route: `/aucations/${id}`,
    routes,
  });
  return { ...utils, store };
};

const byId = (wrapper, id) => wrapper.get(`[data-testid="${id}"]`);
const exists = (wrapper, id) =>
  wrapper.find(`[data-testid="${id}"]`).exists();

describe("DetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("pemuatan data", () => {
    it("memuat lelang sesuai parameter URL", async () => {
      const { store } = await setup();

      expect(store.fetchAucation).toHaveBeenCalledTimes(1);
      expect(store.fetchAucation).toHaveBeenCalledWith("3");
    });

    it("memuat ulang saat parameter URL berubah", async () => {
      const { router, store } = await setup();

      await router.push("/aucations/4");
      await flushPromises();

      expect(store.fetchAucation).toHaveBeenLastCalledWith("4");
    });

    it("menampilkan status loading", async () => {
      const { wrapper } = await setup({ patch: { isAucation: true } });

      expect(exists(wrapper, "loading-state")).toBe(true);
      expect(exists(wrapper, "aucation-title")).toBe(false);
    });

    it("menampilkan pesan jika lelang tidak ditemukan", async () => {
      const { wrapper } = await setup({ aucation: null });

      expect(exists(wrapper, "not-found-state")).toBe(true);
      expect(exists(wrapper, "aucation-title")).toBe(false);
    });

    it("tidak menampilkan data lelang lain yang tersisa di store", async () => {
      const { wrapper } = await setup({ id: "9" });

      expect(exists(wrapper, "not-found-state")).toBe(true);
    });

    it("selalu menyediakan tautan kembali ke dashboard", async () => {
      const { wrapper } = await setup();

      expect(byId(wrapper, "back-link").attributes("href")).toBe("/");
    });
  });

  describe("informasi lelang", () => {
    it("menampilkan rincian lelang", async () => {
      const { wrapper } = await setup();

      expect(byId(wrapper, "aucation-title").text()).toBe("Oculus Quest 2");
      expect(byId(wrapper, "author-name").text()).toBe("Budi");
      expect(byId(wrapper, "markdown-viewer").text()).toBe("Oculus **mulus**");
      expect(byId(wrapper, "closed-at").text()).toContain("Oktober");
      expect(byId(wrapper, "closed-at").text()).toContain("2026");
      expect(byId(wrapper, "start-bid").text()).toMatch(/Rp\s?5\.000\.000/);
      expect(byId(wrapper, "highest-bid").text()).toMatch(/Rp\s?7\.000\.000/);
      expect(
        byId(wrapper, "cover-image").attributes("src").endsWith(
          "/img/aucations/cover/3.jpeg"
        )
      ).toBe(true);
    });

    it("menampilkan placeholder jika tidak ada cover", async () => {
      const { wrapper } = await setup({ aucation: { ...detail, cover: null } });

      expect(exists(wrapper, "cover-placeholder")).toBe(true);
      expect(exists(wrapper, "cover-image")).toBe(false);
    });

    it("status berlangsung menampilkan sisa waktu", async () => {
      const { wrapper } = await setup();

      expect(byId(wrapper, "status-badge").text()).toBe("Sisa 2 hari 12 jam");
    });

    it("status ditutup jika batas waktu sudah lewat", async () => {
      const { wrapper } = await setup({
        aucation: { ...detail, closed_at: "2026-10-01 10:00:00" },
      });

      expect(byId(wrapper, "status-badge").text()).toBe("Ditutup");
    });

    it("penawaran tertinggi 'Belum ada' jika belum ada bid", async () => {
      const { wrapper } = await setup({ aucation: { ...detail, bids: [] } });

      expect(byId(wrapper, "highest-bid").text()).toBe("Belum ada");
    });
  });

  describe("riwayat penawaran", () => {
    it("diurutkan dari tertinggi dan menandai penawaran tertinggi", async () => {
      const { wrapper } = await setup();

      const items = wrapper.findAll('[data-testid="bid-item"]');
      expect(items).toHaveLength(2);
      expect(items[0].text()).toMatch(/Rp\s?7\.000\.000/);
      expect(items[0].text()).toContain("Tertinggi");
      expect(items[1].text()).toMatch(/Rp\s?6\.000\.000/);
      expect(items[1].text()).not.toContain("Tertinggi");
      expect(items[0].text()).toContain("Oktober");
    });

    it("menandai penawaran milik pengguna", async () => {
      const { wrapper } = await setup({
        aucation: { ...detail, my_bid: { id: 1, bid: 6000000 } },
      });

      const items = wrapper.findAll('[data-testid="bid-item"]');
      expect(items[0].text()).not.toContain("Tawaran Anda");
      expect(items[1].text()).toContain("Tawaran Anda");
    });

    it("menampilkan pesan kosong jika belum ada penawaran", async () => {
      const { wrapper } = await setup({ aucation: { ...detail, bids: [] } });

      expect(exists(wrapper, "bid-empty")).toBe(true);
      expect(exists(wrapper, "bid-item")).toBe(false);
    });
  });

  describe("sebagai pemilik", () => {
    it("menampilkan aksi kelola dan menyembunyikan aksi penawaran", async () => {
      const { wrapper } = await setup({ profile: OWNER });

      expect(exists(wrapper, "owner-actions")).toBe(true);
      expect(exists(wrapper, "bid-actions")).toBe(false);
    });

    it("tombol Ubah membuka modal; tersimpan memuat ulang; bisa ditutup", async () => {
      const { wrapper, store } = await setup({ profile: OWNER });
      expect(exists(wrapper, "change-modal")).toBe(false);

      await byId(wrapper, "change-button").trigger("click");
      expect(exists(wrapper, "change-modal")).toBe(true);

      await byId(wrapper, "change-modal-saved").trigger("click");
      expect(store.fetchAucation).toHaveBeenCalledTimes(2);

      await byId(wrapper, "change-modal-close").trigger("click");
      await nextTick();
      expect(exists(wrapper, "change-modal")).toBe(false);
    });

    it("tombol Ganti cover membuka modal; tersimpan memuat ulang; bisa ditutup", async () => {
      const { wrapper, store } = await setup({ profile: OWNER });
      expect(exists(wrapper, "cover-modal")).toBe(false);

      await byId(wrapper, "cover-button").trigger("click");
      expect(exists(wrapper, "cover-modal")).toBe(true);

      await byId(wrapper, "cover-modal-saved").trigger("click");
      expect(store.fetchAucation).toHaveBeenCalledTimes(2);

      await byId(wrapper, "cover-modal-close").trigger("click");
      await nextTick();
      expect(exists(wrapper, "cover-modal")).toBe(false);
    });

    it("hapus dibatalkan: lelang tidak dihapus", async () => {
      const { wrapper, store, router } = await setup({ profile: OWNER });
      showConfirmDialog.mockResolvedValue(false);

      await byId(wrapper, "delete-button").trigger("click");
      await flushPromises();

      expect(showConfirmDialog).toHaveBeenCalledTimes(1);
      expect(store.deleteAucation).not.toHaveBeenCalled();
      expect(router.currentRoute.value.fullPath).toBe("/aucations/3");
    });

    it("hapus berhasil: kembali ke dashboard", async () => {
      const { wrapper, store, router } = await setup({ profile: OWNER });
      showConfirmDialog.mockResolvedValue(true);

      await byId(wrapper, "delete-button").trigger("click");
      await flushPromises();

      expect(store.deleteAucation).toHaveBeenCalledWith(3);
      expect(router.currentRoute.value.fullPath).toBe("/");
    });

    it("hapus gagal: tetap di halaman detail", async () => {
      const { wrapper, store, router } = await setup({ profile: OWNER });
      showConfirmDialog.mockResolvedValue(true);
      store.deleteAucation.mockResolvedValue(false);

      await byId(wrapper, "delete-button").trigger("click");
      await flushPromises();

      expect(router.currentRoute.value.fullPath).toBe("/aucations/3");
    });

    it("tombol hapus dinonaktifkan saat proses penghapusan", async () => {
      const { wrapper, store } = await setup({ profile: OWNER });

      store.$patch({ isAucationDelete: true });
      await nextTick();

      expect(
        byId(wrapper, "delete-button").attributes("disabled")
      ).toBeDefined();
    });
  });

  describe("sebagai peserta", () => {
    it("menyembunyikan aksi kelola", async () => {
      const { wrapper } = await setup();

      expect(exists(wrapper, "owner-actions")).toBe(false);
      expect(exists(wrapper, "bid-actions")).toBe(true);
    });

    it("profil belum dimuat dianggap peserta", async () => {
      const { wrapper } = await setup({ profile: null });

      expect(exists(wrapper, "owner-actions")).toBe(false);
      expect(exists(wrapper, "bid-button")).toBe(true);
    });

    it("belum menawar: tombol Ajukan membuka modal; tersimpan memuat ulang", async () => {
      const { wrapper, store } = await setup();
      expect(exists(wrapper, "bid-modal")).toBe(false);

      await byId(wrapper, "bid-button").trigger("click");
      expect(exists(wrapper, "bid-modal")).toBe(true);

      await byId(wrapper, "bid-modal-saved").trigger("click");
      expect(store.fetchAucation).toHaveBeenCalledTimes(2);

      await byId(wrapper, "bid-modal-close").trigger("click");
      await nextTick();
      expect(exists(wrapper, "bid-modal")).toBe(false);
    });

    it("lelang ditutup: tampil keterangan tanpa tombol penawaran", async () => {
      const { wrapper } = await setup({
        aucation: { ...detail, closed_at: "2026-10-01 10:00:00" },
      });

      expect(exists(wrapper, "closed-notice")).toBe(true);
      expect(exists(wrapper, "bid-button")).toBe(false);
      expect(exists(wrapper, "cancel-bid-button")).toBe(false);
    });

    describe("sudah menawar", () => {
      const withMyBid = {
        aucation: { ...detail, my_bid: { id: 1, bid: 6000000 } },
      };

      it("menampilkan nominal penawaran dan tombol batalkan", async () => {
        const { wrapper } = await setup(withMyBid);

        expect(byId(wrapper, "my-bid").text()).toMatch(/Rp\s?6\.000\.000/);
        expect(exists(wrapper, "cancel-bid-button")).toBe(true);
        expect(exists(wrapper, "bid-button")).toBe(false);
      });

      it("pembatalan ditolak: penawaran tidak dihapus", async () => {
        const { wrapper, store } = await setup(withMyBid);
        showConfirmDialog.mockResolvedValue(false);

        await byId(wrapper, "cancel-bid-button").trigger("click");
        await flushPromises();

        expect(store.deleteBid).not.toHaveBeenCalled();
      });

      it("pembatalan berhasil: memuat ulang data lelang", async () => {
        const { wrapper, store } = await setup(withMyBid);
        showConfirmDialog.mockResolvedValue(true);

        await byId(wrapper, "cancel-bid-button").trigger("click");
        await flushPromises();

        expect(store.deleteBid).toHaveBeenCalledWith(3);
        expect(store.fetchAucation).toHaveBeenCalledTimes(2);
      });

      it("pembatalan gagal: tidak memuat ulang", async () => {
        const { wrapper, store } = await setup(withMyBid);
        showConfirmDialog.mockResolvedValue(true);
        store.deleteBid.mockResolvedValue(false);

        await byId(wrapper, "cancel-bid-button").trigger("click");
        await flushPromises();

        expect(store.fetchAucation).toHaveBeenCalledTimes(1);
      });

      it("tombol batalkan dinonaktifkan saat proses berjalan", async () => {
        const { wrapper, store } = await setup(withMyBid);

        store.$patch({ isBidDelete: true });
        await nextTick();

        expect(
          byId(wrapper, "cancel-bid-button").attributes("disabled")
        ).toBeDefined();
      });
    });
  });
});