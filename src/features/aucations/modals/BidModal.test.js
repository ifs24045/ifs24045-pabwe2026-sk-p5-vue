import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import {
  showErrorDialog,
  formatRupiah,
} from "../../../helpers/toolsHelper";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { useAucationsStore } from "../states/aucationsStore";
import BidModal from "./BidModal.vue";

const withBids = {
  id: 3,
  start_bid: 5000000,
  bids: [
    { id: 1, bid: 6000000 },
    { id: 2, bid: 7000000 },
  ],
};
const withoutBids = { id: 4, start_bid: 5000000, bids: [] };

const setup = async (props = { open: true, aucation: withBids }) => {
  const pinia = createMockPinia();
  const store = useAucationsStore(pinia);
  vi.spyOn(store, "addBid").mockResolvedValue(true);

  const utils = await renderWithProviders(BidModal, { pinia, props });
  return { ...utils, store };
};

const byId = (wrapper, id) => wrapper.get(`[data-testid="${id}"]`);

const bidWith = async (wrapper, value) => {
  if (value !== "") await byId(wrapper, "bid-input").setValue(value);
  await wrapper.get("form").trigger("submit");
  await flushPromises();
};

describe("BidModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tidak merender apa pun saat tertutup", async () => {
    const { wrapper } = await setup({ open: false, aucation: withBids });

    expect(wrapper.find('[data-testid="bid-modal"]').exists()).toBe(false);
  });

  it("menampilkan penawaran tertinggi dan minimal jika sudah ada bid", async () => {
    const { wrapper } = await setup();

    expect(byId(wrapper, "start-bid").text()).toBe(formatRupiah(5000000));
    expect(byId(wrapper, "highest-bid").text()).toBe(formatRupiah(7000000));
    expect(byId(wrapper, "min-bid").text()).toBe(formatRupiah(7000001));
  });

  it("minimal sama dengan harga awal jika belum ada bid", async () => {
    const { wrapper } = await setup({ open: true, aucation: withoutBids });

    expect(byId(wrapper, "highest-bid").text()).toBe("Belum ada");
    expect(byId(wrapper, "min-bid").text()).toBe(formatRupiah(5000000));
  });

  it("menolak submit jika nominal kosong", async () => {
    const { wrapper, store } = await setup();

    await bidWith(wrapper, "");

    expect(showErrorDialog).toHaveBeenCalledWith(
      "Nominal penawaran wajib diisi"
    );
    expect(store.addBid).not.toHaveBeenCalled();
  });

  it("menolak nominal yang sama dengan penawaran tertinggi", async () => {
    const { wrapper, store } = await setup();

    await bidWith(wrapper, "7000000");

    expect(showErrorDialog).toHaveBeenCalledWith(
      `Penawaran minimal ${formatRupiah(7000001)}`
    );
    expect(store.addBid).not.toHaveBeenCalled();
  });

  it("menolak nominal di bawah harga awal jika belum ada bid", async () => {
    const { wrapper, store } = await setup({
      open: true,
      aucation: withoutBids,
    });

    await bidWith(wrapper, "4999999");

    expect(showErrorDialog).toHaveBeenCalledWith(
      `Penawaran minimal ${formatRupiah(5000000)}`
    );
    expect(store.addBid).not.toHaveBeenCalled();
  });

  it("menerima nominal sama dengan harga awal jika belum ada bid", async () => {
    const { wrapper, store } = await setup({
      open: true,
      aucation: withoutBids,
    });

    await bidWith(wrapper, "5000000");

    expect(store.addBid).toHaveBeenCalledWith(4, 5000000);
  });

  it("berhasil: mengirim bid, memberi tahu parent, dan mengosongkan input", async () => {
    const { wrapper, store } = await setup();

    await bidWith(wrapper, "7500000");

    expect(store.addBid).toHaveBeenCalledWith(3, 7500000);
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(byId(wrapper, "bid-input").element.value).toBe("");
  });

  it("gagal: modal tetap terbuka", async () => {
    const { wrapper, store } = await setup();
    store.addBid.mockResolvedValue(false);

    await bidWith(wrapper, "7500000");

    expect(wrapper.emitted("saved")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();
    expect(byId(wrapper, "bid-input").element.value).toBe("7500000");
  });

  it.each(["cancel-button", "close-button", "modal-overlay"])(
    "%s menutup modal dan mengosongkan input",
    async (id) => {
      const { wrapper } = await setup();

      await byId(wrapper, "bid-input").setValue("123");
      await byId(wrapper, id).trigger("click");

      expect(wrapper.emitted("close")).toHaveLength(1);
      expect(byId(wrapper, "bid-input").element.value).toBe("");
    }
  );

  it("menampilkan status mengirim", async () => {
    const { wrapper, store } = await setup();

    store.$patch({ isBidAdd: true });
    await nextTick();

    const button = byId(wrapper, "save-button");
    expect(button.text()).toBe("Mengirim...");
    expect(button.attributes("disabled")).toBeDefined();
  });
});