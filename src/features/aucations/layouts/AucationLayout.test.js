import { describe, it, expect } from "vitest";
import { h } from "vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { useUsersStore } from "../../users/states/usersStore";
import AucationLayout from "./AucationLayout.vue";

const ChildPage = {
  render: () => h("div", { "data-testid": "child" }, "Isi Halaman"),
};

const setup = async () => {
  const pinia = createMockPinia();
  // Profil sudah ada, jadi NavbarComponent tidak memanggil API
  useUsersStore(pinia).$patch({
    profile: { id: 1, name: "Budi", email: "b@mail.com", photo: "x.png" },
  });

  return renderWithProviders(AucationLayout, {
    pinia,
    route: "/",
    routes: [{ path: "/", component: ChildPage }],
  });
};

const overlay = (wrapper) => wrapper.find('[data-testid="sidebar-overlay"]');

describe("AucationLayout", () => {
  it("menampilkan navbar, sidebar, dan halaman anak", async () => {
    const { wrapper } = await setup();

    expect(wrapper.find('[data-testid="aucation-layout"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="navbar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="sidebar"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="child"]').text()).toBe("Isi Halaman");
  });

  it("tombol menu membuka lalu menutup sidebar", async () => {
    const { wrapper } = await setup();
    const menuButton = wrapper.get('[data-testid="menu-button"]');

    expect(overlay(wrapper).exists()).toBe(false);

    await menuButton.trigger("click");
    expect(overlay(wrapper).exists()).toBe(true);

    await menuButton.trigger("click");
    expect(overlay(wrapper).exists()).toBe(false);
  });

  it("klik overlay menutup sidebar", async () => {
    const { wrapper } = await setup();

    await wrapper.get('[data-testid="menu-button"]').trigger("click");
    await overlay(wrapper).trigger("click");

    expect(overlay(wrapper).exists()).toBe(false);
  });
});