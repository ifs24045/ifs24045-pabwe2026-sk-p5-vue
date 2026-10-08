import { describe, it, expect } from "vitest";
import { h } from "vue";
import { renderWithProviders } from "../../../test-utils";
import AuthLayout from "./AuthLayout.vue";

const ChildPage = { render: () => h("div", { "data-testid": "child" }, "Isi Halaman") };

describe("AuthLayout", () => {
  it("menampilkan banner dan merender halaman anak lewat RouterView", async () => {
    const { wrapper } = await renderWithProviders(AuthLayout, {
      route: "/auth/login",
      routes: [{ path: "/auth/login", component: ChildPage }],
    });

    expect(wrapper.find('[data-testid="auth-layout"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="auth-banner"]').text()).toContain(
      "Delcom Auction"
    );
    expect(wrapper.get('[data-testid="child"]').text()).toBe("Isi Halaman");
  });
});