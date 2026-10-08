import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

vi.mock("../components/MarkdownEditor.vue", async () => {
  const { h } = await import("vue");
  return {
    default: {
      props: ["modelValue"],
      emits: ["update:modelValue"],
      render() {
        return h("textarea", {
          "data-testid": "markdown-editor",
          value: this.modelValue,
          onInput: (event) =>
            this.$emit("update:modelValue", event.target.value),
        });
      },
    },
  };
});
vi.mock("../../../helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import { showErrorDialog } from "../../../helpers/toolsHelper";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { useAucationsStore } from "../states/aucationsStore";
import ChangeModal from "./ChangeModal.vue";

const aucation = {
  id: 3,
  title: "Oculus Quest 2",
  description: "Second mulus",
  start_bid: 5000000,
  closed_at: "2024-10-05 22:00:00",
};

const fields = [
  "title-input",
  "markdown-editor",
  "start-bid-input",
  "closed-at-input",
];

const setup = async (props = { open: true, aucation }) => {
  const pinia = createMockPinia();
  const store = useAucationsStore(pinia);
  vi.spyOn(store, "changeAucation").mockResolvedValue(true);

  const utils = await renderWithProviders(ChangeModal, { pinia, props });
  return { ...utils, store };
};

const byId = (wrapper, id) => wrapper.get(`[data-testid="${id}"]`);

const submit = async (wrapper) => {
  await wrapper.get("form").trigger("submit");
  await flushPromises();
};

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tidak merender apa pun saat tertutup", async () => {
    const { wrapper } = await setup({ open: false, aucation });

    expect(wrapper.find('[data-testid="change-modal"]').exists()).toBe(false);
  });

  it("mengisi form dari data lelang saat terbuka", async () => {
    const { wrapper } = await setup();

    expect(byId(wrapper, "title-input").element.value).toBe("Oculus Quest 2");
    expect(byId(wrapper, "markdown-editor").element.value).toBe("Second mulus");
    expect(byId(wrapper, "start-bid-input").element.value).toBe("5000000");
    expect(byId(wrapper, "closed-at-input").element.value).toBe(
      "2024-10-05T22:00"
    );
    expect(byId(wrapper, "save-button").text()).toBe("Simpan perubahan");
  });

  it("mengisi form saat modal dibuka belakangan", async () => {
    const { wrapper } = await setup({ open: false, aucation });

    await wrapper.setProps({ open: true });

    expect(byId(wrapper, "title-input").element.value).toBe("Oculus Quest 2");
  });

  it("tidak mengisi form jika data lelang belum tersedia", async () => {
    const { wrapper } = await setup({ open: true, aucation: null });

    expect(byId(wrapper, "title-input").element.value).toBe("");
  });

  it("membuang perubahan yang dibatalkan saat dibuka ulang", async () => {
    const { wrapper } = await setup();

    await byId(wrapper, "title-input").setValue("Judul diubah");
    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });

    expect(byId(wrapper, "title-input").element.value).toBe("Oculus Quest 2");
  });

  it.each(fields)("menolak submit jika %s dikosongkan", async (field) => {
    const { wrapper, store } = await setup();

    await byId(wrapper, field).setValue("");
    await submit(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith("Semua kolom wajib diisi");
    expect(store.changeAucation).not.toHaveBeenCalled();
  });

  it("menolak harga awal 0", async () => {
    const { wrapper, store } = await setup();

    await byId(wrapper, "start-bid-input").setValue("0");
    await submit(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith(
      "Harga awal harus lebih dari 0"
    );
    expect(store.changeAucation).not.toHaveBeenCalled();
  });

  it("berhasil: mengirim perubahan lalu menutup modal", async () => {
    const { wrapper, store } = await setup();

    await byId(wrapper, "title-input").setValue("Oculus Quest 3");
    await submit(wrapper);

    expect(store.changeAucation).toHaveBeenCalledWith(3, {
      title: "Oculus Quest 3",
      description: "Second mulus",
      startBid: "5000000",
      closedAt: "2024-10-05 22:00:00",
    });
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("gagal: modal tetap terbuka", async () => {
    const { wrapper, store } = await setup();
    store.changeAucation.mockResolvedValue(false);

    await submit(wrapper);

    expect(wrapper.emitted("saved")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it.each(["cancel-button", "close-button", "modal-overlay"])(
    "%s menutup modal",
    async (id) => {
      const { wrapper } = await setup();

      await byId(wrapper, id).trigger("click");

      expect(wrapper.emitted("close")).toHaveLength(1);
    }
  );

  it("menampilkan status menyimpan", async () => {
    const { wrapper, store } = await setup();

    store.$patch({ isAucationChange: true });
    await nextTick();

    const button = byId(wrapper, "save-button");
    expect(button.text()).toBe("Menyimpan...");
    expect(button.attributes("disabled")).toBeDefined();
  });
});