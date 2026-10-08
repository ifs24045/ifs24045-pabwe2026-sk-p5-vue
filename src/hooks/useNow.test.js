import { describe, it, expect, vi, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { useNow } from "./useNow";

const START = new Date(2026, 9, 8, 0, 0, 0).getTime();

const makeProbe = (interval) =>
  defineComponent({
    setup() {
      const now = useNow(interval);
      return () => h("span", String(now.value));
    },
  });

describe("useNow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("memperbarui waktu setiap 30 detik secara default", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    const wrapper = mount(makeProbe());

    expect(wrapper.text()).toBe(String(START));

    vi.advanceTimersByTime(29999);
    await nextTick();
    expect(wrapper.text()).toBe(String(START));

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(wrapper.text()).toBe(String(START + 30000));

    wrapper.unmount();
  });

  it("memakai interval custom", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    const wrapper = mount(makeProbe(1000));

    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(wrapper.text()).toBe(String(START + 1000));
    wrapper.unmount();
  });

  it("menghentikan timer saat komponen dilepas", () => {
    vi.useFakeTimers();
    const wrapper = mount(makeProbe());
    expect(vi.getTimerCount()).toBe(1);

    wrapper.unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});