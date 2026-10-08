import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const mocks = vi.hoisted(() => ({ instances: [] }));

vi.mock("@toast-ui/editor", () => ({
  default: class MockEditor {
    constructor(options) {
      this.options = options;
      this.markdown = options.initialValue;
      this.getMarkdown = vi.fn(() => this.markdown);
      this.setMarkdown = vi.fn((value) => {
        this.markdown = value;
      });
      this.destroy = vi.fn();
      mocks.instances.push(this);
    }
  },
}));

import MarkdownEditor from "./MarkdownEditor.vue";

describe("MarkdownEditor", () => {
  beforeEach(() => {
    mocks.instances.length = 0;
  });

  it("membuat editor pada elemen miliknya dengan opsi default", () => {
    const wrapper = mount(MarkdownEditor, { props: { modelValue: "Halo" } });

    expect(mocks.instances).toHaveLength(1);
    const { options } = mocks.instances[0];
    expect(options.el).toBe(wrapper.element);
    expect(options.initialValue).toBe("Halo");
    expect(options.height).toBe("300px");
    expect(options.placeholder).toBe("Tulis deskripsi...");
    expect(options.usageStatistics).toBe(false);
  });

  it("memakai height dan placeholder dari props", () => {
    mount(MarkdownEditor, {
      props: { modelValue: "", height: "500px", placeholder: "Isi di sini" },
    });

    const { options } = mocks.instances[0];
    expect(options.height).toBe("500px");
    expect(options.placeholder).toBe("Isi di sini");
  });

  it("mengirim update:modelValue saat isi editor berubah", () => {
    const wrapper = mount(MarkdownEditor, { props: { modelValue: "Halo" } });
    const instance = mocks.instances[0];

    instance.markdown = "Halo dunia";
    instance.options.events.change();

    expect(wrapper.emitted("update:modelValue")).toEqual([["Halo dunia"]]);
  });

  it("menyinkronkan editor saat nilai berubah dari luar", async () => {
    const wrapper = mount(MarkdownEditor, { props: { modelValue: "Halo" } });
    const instance = mocks.instances[0];

    await wrapper.setProps({ modelValue: "Dari luar" });

    expect(instance.setMarkdown).toHaveBeenCalledWith("Dari luar");
  });

  it("tidak menimpa editor jika nilainya sudah sama", async () => {
    const wrapper = mount(MarkdownEditor, { props: { modelValue: "Halo" } });
    const instance = mocks.instances[0];

    // pengguna mengetik di editor, lalu parent meneruskan nilai yang sama
    instance.markdown = "Diketik";
    await wrapper.setProps({ modelValue: "Diketik" });

    expect(instance.setMarkdown).not.toHaveBeenCalled();
  });

  it("menghancurkan editor saat komponen dilepas", () => {
    const wrapper = mount(MarkdownEditor);
    const instance = mocks.instances[0];

    wrapper.unmount();

    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });
});