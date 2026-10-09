import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

const settle = async () => {
  for (let i = 0; i < 5; i++) await flushPromises();
};

// AddModal diganti stub agar Toast UI tidak ikut dimuat
vi.mock("../modals/AddModal.vue", async () => {
  const { h } = await import("vue");
  return {
    default: {
      props: ["open"],
      emits: ["close", "saved"],
      render() {
        return this.open
          ? h("div", { "data-testid": "add-modal" }, [
              h("button", {
                "data-testid": "modal-save",
                onClick: () => this.$emit("saved"),
              }),
              h("button", {
                "data-testid": "modal-close",
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
import HomePage from "./HomePage.vue";

const NOW = new Date(2026, 9, 8, 0, 0, 0);

const aucations = [
  {
    id: 1,
    user_id: 1,
    title: "Keyboard Gaming RGB",
    cover: "img/aucations/cover/1.jpeg",
    description: "Barang masih mulus",
    start_bid: 200000,
    closed_at: "2026-10-10 12:00:00",
    author: { name: "Budi" },
    bids: [],
  },
  {
    id: 2,
    user_id: 2,
    title: "Oculus Quest 2",
    cover: null,
    description: "Second mulus",
    start_bid: 5000000,
    closed_at: "2026-10-01 10:00:00",
    author: { name: "Sari" },
    bids: [2, 3],
  },
  {
    id: 3,
    user_id: 1,
    title: "Monitor",
    cover: "http://127.0.0.1:8000/img/aucations/cover/3.jpeg",
    description: "Layar lebar",
    start_bid: 1000000,
    closed_at: "2026-10-08 05:30:00",
    author: { name: "Budi" },
    bids: [
      { id: 1, bid: 1500000 },
      { id: 2, bid: 1700000 },
    ],
  },
];

const setup = async (route = "/", patch = { aucations }) => {
  const pinia = createMockPinia();
  const store = useAucationsStore(pinia);
  vi.spyOn(store, "fetchAucations").mockResolvedValue(true);
  vi.spyOn(store, "deleteAllAucations").mockResolvedValue(true);
  store.$patch(patch);

  const utils = await renderWithProviders(HomePage, { pinia, route });
  return { ...utils, store };
};

const byId = (wrapper, id) => wrapper.get(`[data-testid="${id}"]`);
const cards = (wrapper) => wrapper.findAll('[data-testid="aucation-card"]');
const titles = (wrapper) => cards(wrapper).map((card) => card.get("h2").text());

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("pemuatan data", () => {
    it("memuat semua lelang saat dibuka", async () => {
      const { store } = await setup();

      expect(store.fetchAucations).toHaveBeenCalledTimes(1);
      expect(store.fetchAucations).toHaveBeenCalledWith({});
    });

    it("memuat lelang milik sendiri pada tab Lelang Saya", async () => {
      const { store } = await setup("/?filter=mine");

      expect(store.fetchAucations).toHaveBeenCalledWith({ is_me: 1 });
    });

    it("menampilkan status loading", async () => {
      const { wrapper } = await setup("/", { aucations, isAucation: true });

      expect(wrapper.find('[data-testid="loading-state"]').exists()).toBe(true);
      expect(cards(wrapper)).toHaveLength(0);
    });

    it("menampilkan pesan kosong jika tidak ada lelang", async () => {
      const { wrapper } = await setup("/", { aucations: [] });

      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
      expect(byId(wrapper, "result-count").text()).toContain("0 lelang");
    });
  });

  describe("kartu lelang", () => {
    it("menampilkan satu kartu per lelang", async () => {
      const { wrapper } = await setup();

      expect(titles(wrapper)).toEqual([
        "Keyboard Gaming RGB",
        "Oculus Quest 2",
        "Monitor",
      ]);
      expect(byId(wrapper, "result-count").text()).toContain("3 lelang");
      expect(cards(wrapper)[0].text()).toContain("Budi");
      expect(cards(wrapper)[0].text()).toMatch(/Rp\s?200\.000/);
    });

    it("kartu menautkan ke halaman detail", async () => {
      const { wrapper } = await setup();

      expect(cards(wrapper).map((card) => card.attributes("href"))).toEqual([
        "/aucations/1",
        "/aucations/2",
        "/aucations/3",
      ]);
    });

    it("menampilkan status countdown atau ditutup", async () => {
      const { wrapper } = await setup();

      const badges = wrapper
        .findAll('[data-testid="status-badge"]')
        .map((badge) => badge.text());
      expect(badges).toEqual([
        "Sisa 2 hari 12 jam",
        "Ditutup",
        "Sisa 5 jam 30 menit",
      ]);
    });

    it("menampilkan ringkasan penawaran sesuai data yang tersedia", async () => {
      const { wrapper } = await setup();

      const texts = wrapper
        .findAll('[data-testid="bid-text"]')
        .map((el) => el.text());
      expect(texts[0]).toBe("Belum ada penawaran");
      expect(texts[1]).toBe("2 penawaran masuk");
      expect(texts[2]).toMatch(/Tertinggi\s+Rp\s?1\.700\.000/);
    });

    it("menampilkan cover atau placeholder", async () => {
      const { wrapper } = await setup();
      const all = cards(wrapper);

      expect(
        all[0].get("img").attributes("src").endsWith(
          "/img/aucations/cover/1.jpeg"
        )
      ).toBe(true);
      expect(all[1].find("img").exists()).toBe(false);
      expect(all[1].find('[data-testid="cover-placeholder"]').exists()).toBe(
        true
      );
      expect(all[2].get("img").attributes("src")).toBe(
        "http://127.0.0.1:8000/img/aucations/cover/3.jpeg"
      );
    });
  });

  describe("tab filter", () => {
    it("tab Semua aktif secara default", async () => {
      const { wrapper } = await setup();

      expect(byId(wrapper, "tab-all").attributes("aria-selected")).toBe("true");
      expect(byId(wrapper, "tab-mine").attributes("aria-selected")).toBe(
        "false"
      );
    });

    it("nilai filter yang tidak dikenal dianggap Semua", async () => {
      const { wrapper } = await setup("/?filter=asal");

      expect(byId(wrapper, "tab-all").attributes("aria-selected")).toBe("true");
      expect(cards(wrapper)).toHaveLength(3);
    });

    it("tab Berlangsung hanya menampilkan lelang yang belum ditutup", async () => {
      const { wrapper, router } = await setup();

      await byId(wrapper, "tab-open").trigger("click");
      await flushPromises();

      expect(router.currentRoute.value.fullPath).toBe("/?filter=open");
      expect(byId(wrapper, "tab-open").attributes("aria-selected")).toBe("true");
      expect(titles(wrapper)).toEqual(["Keyboard Gaming RGB", "Monitor"]);
    });

    it("tab Ditutup hanya menampilkan lelang yang sudah ditutup", async () => {
      const { wrapper, router } = await setup();

      await byId(wrapper, "tab-closed").trigger("click");
      await flushPromises();

      expect(router.currentRoute.value.fullPath).toBe("/?filter=closed");
      expect(titles(wrapper)).toEqual(["Oculus Quest 2"]);
    });

    it("pindah ke tab Lelang Saya memuat ulang dengan is_me", async () => {
      const { wrapper, store } = await setup();

      await byId(wrapper, "tab-mine").trigger("click");
      await flushPromises();

      expect(store.fetchAucations).toHaveBeenLastCalledWith({ is_me: 1 });
    });

    it("kembali ke tab Semua mengosongkan query dan memuat ulang", async () => {
      const { wrapper, router, store } = await setup("/?filter=mine");

      await byId(wrapper, "tab-all").trigger("click");
      await flushPromises();

      expect(router.currentRoute.value.fullPath).toBe("/");
      expect(store.fetchAucations).toHaveBeenLastCalledWith({});
    });

    it("pindah antar tab non-server tidak memuat ulang", async () => {
      const { wrapper, store } = await setup();

      await byId(wrapper, "tab-open").trigger("click");
      await flushPromises();

      expect(store.fetchAucations).toHaveBeenCalledTimes(1);
    });
  });

  describe("pencarian", () => {
    it("menyaring berdasarkan judul tanpa peduli huruf besar/kecil", async () => {
      const { wrapper } = await setup();

      await byId(wrapper, "search-input").setValue("KEYBOARD");

      expect(titles(wrapper)).toEqual(["Keyboard Gaming RGB"]);
      expect(byId(wrapper, "result-count").text()).toContain("1 lelang");
    });

    it("menyaring berdasarkan deskripsi", async () => {
      const { wrapper } = await setup();

      await byId(wrapper, "search-input").setValue("layar");

      expect(titles(wrapper)).toEqual(["Monitor"]);
    });

    it("menampilkan pesan kosong jika tidak ada yang cocok", async () => {
      const { wrapper } = await setup();

      await byId(wrapper, "search-input").setValue("tidak ada");

      expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
    });

    it("kata kunci berisi spasi saja dianggap kosong", async () => {
      const { wrapper } = await setup();

      await byId(wrapper, "search-input").setValue("   ");

      expect(cards(wrapper)).toHaveLength(3);
    });

    it("pencarian digabung dengan tab aktif", async () => {
      const { wrapper } = await setup("/?filter=open");

      await byId(wrapper, "search-input").setValue("oculus");

      expect(cards(wrapper)).toHaveLength(0);
    });
  });

  describe("hapus semua lelang", () => {
    it("tidak tampil di tab selain Lelang Saya", async () => {
      const { wrapper } = await setup();

      expect(wrapper.find('[data-testid="delete-all-button"]').exists()).toBe(
        false
      );
    });

    it("tidak tampil di tab Lelang Saya jika daftar kosong", async () => {
      const { wrapper } = await setup("/?filter=mine", { aucations: [] });

      expect(wrapper.find('[data-testid="delete-all-button"]').exists()).toBe(
        false
      );
    });

    it("dibatalkan: tidak menghapus apa pun", async () => {
      const { wrapper, store } = await setup("/?filter=mine");
      showConfirmDialog.mockResolvedValue(false);

      await byId(wrapper, "delete-all-button").trigger("click");
      await flushPromises();

      expect(showConfirmDialog).toHaveBeenCalledTimes(1);
      expect(store.deleteAllAucations).not.toHaveBeenCalled();
    });

    it("dikonfirmasi dan berhasil: menghapus lalu memuat ulang", async () => {
      const { wrapper, store } = await setup("/?filter=mine");
      showConfirmDialog.mockResolvedValue(true);

      await byId(wrapper, "delete-all-button").trigger("click");
      await flushPromises();

      expect(store.deleteAllAucations).toHaveBeenCalledTimes(1);
      expect(store.fetchAucations).toHaveBeenCalledTimes(2);
    });

    it("dikonfirmasi tetapi gagal: tidak memuat ulang", async () => {
      const { wrapper, store } = await setup("/?filter=mine");
      showConfirmDialog.mockResolvedValue(true);
      store.deleteAllAucations.mockResolvedValue(false);

      await byId(wrapper, "delete-all-button").trigger("click");
      await flushPromises();

      expect(store.fetchAucations).toHaveBeenCalledTimes(1);
    });
  });

  describe("tambah lelang", () => {
    it("tombol Tambah membuka modal dan modal bisa ditutup", async () => {
      const { wrapper } = await setup();
      expect(wrapper.find('[data-testid="add-modal"]').exists()).toBe(false);

      await byId(wrapper, "add-button").trigger("click");
      expect(wrapper.find('[data-testid="add-modal"]').exists()).toBe(true);

      await byId(wrapper, "modal-close").trigger("click");
      await nextTick();
      expect(wrapper.find('[data-testid="add-modal"]').exists()).toBe(false);
    });

    it("setelah lelang tersimpan, daftar dimuat ulang", async () => {
      const { wrapper, store } = await setup();

      await byId(wrapper, "add-button").trigger("click");
      await byId(wrapper, "modal-save").trigger("click");

      expect(store.fetchAucations).toHaveBeenCalledTimes(2);
    });
  });
});