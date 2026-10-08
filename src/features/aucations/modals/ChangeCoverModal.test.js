import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import { showErrorDialog } from "../../../helpers/toolsHelper";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { useAucationsStore } from "../states/aucationsStore";
import ChangeCoverModal from "./ChangeCoverModal.vue";

const aucation = { id: 3, cover: "img/aucations/cover/1.jpeg" };
const fileA = new File(["a"], "a.jpg", { type: "image/jpeg" });
const fileB = new File(["b"], "b.jpg", { type: "image/jpeg" });

const setup = async (props = { open: true, aucation }) => {
  const pinia = createMockPinia();
  const store = useAucationsStore(pinia);
  vi.spyOn(store, "changeCover").mockResolvedValue(true);

  const utils = await renderWithProviders(ChangeCoverModal, { pinia, props });
  return { ...utils, store };
};

const byId = (wrapper, id) => wrapper.get(`[data-testid="${id}"]`);

const selectFiles = async (wrapper, files) => {
  const input = byId(wrapper, "cover-input");
  Object.defineProperty(input.element, "files", {
    value: files,
    configurable: true,
  });
  await input.trigger("change");
};

const submit = async (wrapper) => {
  await wrapper.get("form").trigger("submit");
  await flushPromises();
};

describe("ChangeCoverModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:preview-1");
    URL.revokeObjectURL = vi.fn();
  });

  it("tidak merender apa pun saat tertutup", async () => {
    const { wrapper } = await setup({ open: false, aucation });

    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(
      false
    );
  });

  it("menampilkan cover saat ini jika belum ada file dipilih", async () => {
    const { wrapper } = await setup();

    const src = byId(wrapper, "cover-preview").attributes("src");
    expect(src.endsWith("/img/aucations/cover/1.jpeg")).toBe(true);
  });

  it("menampilkan placeholder jika tidak ada cover sama sekali", async () => {
    const { wrapper } = await setup({
      open: true,
      aucation: { id: 3, cover: null },
    });

    expect(wrapper.find('[data-testid="cover-placeholder"]').exists()).toBe(
      true
    );
    expect(wrapper.find('[data-testid="cover-preview"]').exists()).toBe(false);
  });

  it("menampilkan pratinjau live saat file dipilih", async () => {
    const { wrapper } = await setup();

    await selectFiles(wrapper, [fileA]);

    expect(URL.createObjectURL).toHaveBeenCalledWith(fileA);
    expect(byId(wrapper, "cover-preview").attributes("src")).toBe(
      "blob:preview-1"
    );
  });

  it("memilih file lain melepas pratinjau sebelumnya", async () => {
    const { wrapper } = await setup();
    URL.createObjectURL
      .mockReturnValueOnce("blob:preview-1")
      .mockReturnValueOnce("blob:preview-2");

    await selectFiles(wrapper, [fileA]);
    await selectFiles(wrapper, [fileB]);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
    expect(byId(wrapper, "cover-preview").attributes("src")).toBe(
      "blob:preview-2"
    );
  });

  it("membatalkan pilihan file mengembalikan tampilan cover saat ini", async () => {
    const { wrapper, store } = await setup();

    await selectFiles(wrapper, [fileA]);
    await selectFiles(wrapper, []);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
    expect(
      byId(wrapper, "cover-preview")
        .attributes("src")
        .endsWith("/img/aucations/cover/1.jpeg")
    ).toBe(true);

    await submit(wrapper);
    expect(showErrorDialog).toHaveBeenCalledWith("Pilih gambar terlebih dahulu");
    expect(store.changeCover).not.toHaveBeenCalled();
  });

  it("menolak submit jika belum ada file", async () => {
    const { wrapper, store } = await setup();

    await submit(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith("Pilih gambar terlebih dahulu");
    expect(store.changeCover).not.toHaveBeenCalled();
  });

  it("berhasil: mengunggah file, memberi tahu parent, lalu menutup", async () => {
    const { wrapper, store } = await setup();

    await selectFiles(wrapper, [fileA]);
    await submit(wrapper);

    expect(store.changeCover).toHaveBeenCalledWith(3, fileA);
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });

  it("gagal: modal tetap terbuka dan pratinjau dipertahankan", async () => {
    const { wrapper, store } = await setup();
    store.changeCover.mockResolvedValue(false);

    await selectFiles(wrapper, [fileA]);
    await submit(wrapper);

    expect(wrapper.emitted("saved")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();
    expect(byId(wrapper, "cover-preview").attributes("src")).toBe(
      "blob:preview-1"
    );
  });

  it.each(["cancel-button", "close-button", "modal-overlay"])(
    "%s menutup modal dan melepas pratinjau",
    async (id) => {
      const { wrapper } = await setup();

      await selectFiles(wrapper, [fileA]);
      await byId(wrapper, id).trigger("click");

      expect(wrapper.emitted("close")).toHaveLength(1);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
    }
  );

  it("menutup tanpa file dipilih tidak melepas apa pun", async () => {
    const { wrapper } = await setup();

    await byId(wrapper, "cancel-button").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("melepas pratinjau saat komponen dilepas", async () => {
    const { wrapper } = await setup();

    await selectFiles(wrapper, [fileA]);
    wrapper.unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });

  it("menampilkan status mengunggah", async () => {
    const { wrapper, store } = await setup();

    store.$patch({ isAucationChangeCover: true });
    await nextTick();

    const button = byId(wrapper, "save-button");
    expect(button.text()).toBe("Mengunggah...");
    expect(button.attributes("disabled")).toBeDefined();
  });
});