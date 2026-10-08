import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";

const mocks = vi.hoisted(() => ({ instances: [] }));

vi.mock("@toast-ui/editor/dist/toastui-editor-viewer", () => ({
  default: class MockViewer {
    constructor(options) {
      this.options = options;
      this.setMarkdown = vi.fn();
      this.destroy = vi.fn();
      mocks.instances.push(this);
    }
  },
}));

import MarkdownViewer from "./MarkdownViewer.vue";

describe("MarkdownViewer", () => {
  beforeEach(() => {
    mocks.instances.length = 0;
  });

  it("membuat viewer dengan konten awal", () => {
    const wrapper = mount(MarkdownViewer, { props: { content: "**tebal**" } });

    expect(mocks.instances).toHaveLength(1);
    const { options } = mocks.instances[0];
    expect(options.el).toBe(wrapper.element);
    expect(options.initialValue).toBe("**tebal**");
    expect(options.usageStatistics).toBe(false);
  });

  it("memakai konten kosong sebagai default", () => {
    mount(MarkdownViewer);

    expect(mocks.instances[0].options.initialValue).toBe("");
  });

  it("memperbarui tampilan saat konten berubah", async () => {
    const wrapper = mount(MarkdownViewer, { props: { content: "Lama" } });

    await wrapper.setProps({ content: "Baru" });

    expect(mocks.instances[0].setMarkdown).toHaveBeenCalledWith("Baru");
  });

  it("menghancurkan viewer saat komponen dilepas", () => {
    const wrapper = mount(MarkdownViewer);

    wrapper.unmount();

    expect(mocks.instances[0].destroy).toHaveBeenCalledTimes(1);
  });
});