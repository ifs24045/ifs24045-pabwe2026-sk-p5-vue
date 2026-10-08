import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import SidebarComponent from "./SidebarComponent.vue";

const setup = (route = "/", props = {}) =>
  renderWithProviders(SidebarComponent, { route, props });

const links = (wrapper) => wrapper.findAll('[data-testid="sidebar-link"]');

describe("SidebarComponent", () => {
  it("menampilkan empat menu dengan tujuan yang benar", async () => {
    const { wrapper } = await setup();

    const all = links(wrapper);
    expect(all.map((l) => l.text())).toEqual([
      "Dashboard Lelang",
      "Lelang Saya",
      "Daftar Pengguna",
      "Profil Saya",
    ]);
    expect(all.map((l) => l.attributes("href"))).toEqual([
      "/",
      "/?filter=mine",
      "/users",
      "/profile",
    ]);
  });

  it.each([
    ["/", 0],
    ["/?filter=mine", 1],
    ["/users", 2],
    ["/profile", 3],
  ])("menandai menu aktif untuk rute %s", async (route, activeIndex) => {
    const { wrapper } = await setup(route);

    links(wrapper).forEach((link, index) => {
      if (index === activeIndex) {
        expect(link.attributes("aria-current")).toBe("page");
        expect(link.classes()).toContain("text-indigo-700");
      } else {
        expect(link.attributes("aria-current")).toBeUndefined();
        expect(link.classes()).not.toContain("text-indigo-700");
      }
    });
  });

  it("tertutup: tanpa overlay dan sidebar bergeser keluar layar", async () => {
    const { wrapper } = await setup("/", { open: false });

    expect(wrapper.find('[data-testid="sidebar-overlay"]').exists()).toBe(
      false
    );
    const classes = wrapper.get('[data-testid="sidebar"]').classes();
    expect(classes).toContain("-translate-x-full");
    expect(classes).not.toContain("translate-x-0");
  });

  it("terbuka: overlay tampil dan sidebar masuk layar", async () => {
    const { wrapper } = await setup("/", { open: true });

    expect(wrapper.find('[data-testid="sidebar-overlay"]').exists()).toBe(true);
    const classes = wrapper.get('[data-testid="sidebar"]').classes();
    expect(classes).toContain("translate-x-0");
    expect(classes).not.toContain("-translate-x-full");
  });

  it("klik overlay mengirim event close", async () => {
    const { wrapper } = await setup("/", { open: true });

    await wrapper.get('[data-testid="sidebar-overlay"]').trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("klik tombol tutup mengirim event close", async () => {
    const { wrapper } = await setup();

    await wrapper.get('[data-testid="close-button"]').trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("klik menu mengirim event close agar drawer tertutup", async () => {
    const { wrapper } = await setup();

    await links(wrapper)[2].trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});