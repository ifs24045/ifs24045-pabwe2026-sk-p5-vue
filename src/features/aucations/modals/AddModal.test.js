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
import AddModal from "./AddModal.vue";

const validForm = {
  "title-input": "Keyboard",
  "markdown-editor": "Masih mulus",
  "start-bid-input": "200000",
  "closed-at-input": "2026-12-31T23:59",
};

const setup = async (props = { open: true }) => {
  const pinia = createMockPinia();
  const store = useAucationsStore(pinia);
  vi.spyOn(store, "addAucation").mockResolvedValue(true);

  const utils = await renderWithProviders(AddModal, { pinia, props });
  return { ...utils, store };
};

const byId = (wrapper, id) => wrapper.get(`[data-testid="${id}"]`);

const fill = async (wrapper, values) => {
  for (const [id, value] of Object.entries(values)) {
    await byId(wrapper, id).setValue(value);
  }
};

const submit = async (wrapper) => {
  await wrapper.get("form").trigger("submit");
  await flushPromises();
};

describe("AddModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tidak merender apa pun saat tertutup", async () => {
    const { wrapper } = await setup({ open: false });

    expect(wrapper.find('[data-testid="add-modal"]').exists()).toBe(false);
  });

  it("menampilkan semua kolom saat terbuka", async () => {
    const { wrapper } = await setup();

    Object.keys(validForm).forEach((id) => {
      expect(wrapper.find(`[data-testid="${id}"]`).exists()).toBe(true);
    });
    expect(byId(wrapper, "save-button").text()).toBe("Simpan lelang");
  });

  it.each(Object.keys(validForm))(
    "menolak submit jika %s kosong",
    async (missing) => {
      const { wrapper, store } = await setup();
      const values = { ...validForm };
      delete values[missing];

      await fill(wrapper, values);
      await submit(wrapper);

      expect(showErrorDialog).toHaveBeenCalledWith("Semua kolom wajib diisi");
      expect(store.addAucation).not.toHaveBeenCalled();
    }
  );

  it("menolak harga awal 0", async () => {
    const { wrapper, store } = await setup();

    await fill(wrapper, { ...validForm, "start-bid-input": "0" });
    await submit(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith(
      "Harga awal harus lebih dari 0"
    );
    expect(store.addAucation).not.toHaveBeenCalled();
  });

  it("berhasil: mengirim data, memberi tahu parent, dan mengosongkan form", async () => {
    const { wrapper, store } = await setup();

    await fill(wrapper, validForm);
    await submit(wrapper);

    expect(store.addAucation).toHaveBeenCalledWith({
      title: "Keyboard",
      description: "Masih mulus",
      startBid: "200000",
      closedAt: "2026-12-31 23:59:00",
    });
    expect(wrapper.emitted("saved")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(byId(wrapper, "title-input").element.value).toBe("");
    expect(byId(wrapper, "markdown-editor").element.value).toBe("");
    expect(byId(wrapper, "start-bid-input").element.value).toBe("");
    expect(byId(wrapper, "closed-at-input").element.value).toBe("");
  });

  it("gagal: modal tetap terbuka dan isi form dipertahankan", async () => {
    const { wrapper, store } = await setup();
    store.addAucation.mockResolvedValue(false);

    await fill(wrapper, validForm);
    await submit(wrapper);

    expect(wrapper.emitted("saved")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();
    expect(byId(wrapper, "title-input").element.value).toBe("Keyboard");
  });

  it.each(["cancel-button", "close-button", "modal-overlay"])(
    "%s menutup modal dan mengosongkan form",
    async (id) => {
      const { wrapper } = await setup();

      await byId(wrapper, "title-input").setValue("Draft");
      await byId(wrapper, id).trigger("click");

      expect(wrapper.emitted("close")).toHaveLength(1);
      expect(byId(wrapper, "title-input").element.value).toBe("");
    }
  );

  it("menampilkan status menyimpan", async () => {
    const { wrapper, store } = await setup();

    store.$patch({ isAucationAdd: true });
    await nextTick();

    const button = byId(wrapper, "save-button");
    expect(button.text()).toBe("Menyimpan...");
    expect(button.attributes("disabled")).toBeDefined();
  });
});