import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { useUsersStore } from "../../users/states/usersStore";
import { useAuthStore } from "../../auth/states/authStore";
import NavbarComponent from "./NavbarComponent.vue";

const profile = {
  id: 1,
  name: "Budi",
  email: "budi@mail.com",
  photo: "img/profile/1.png",
};

const setup = async (patch = { profile }) => {
  const pinia = createMockPinia();
  const usersStore = useUsersStore(pinia);
  const authStore = useAuthStore(pinia);
  vi.spyOn(usersStore, "fetchProfile").mockResolvedValue(true);
  vi.spyOn(authStore, "logout").mockResolvedValue(true);
  usersStore.$patch(patch);

  const utils = await renderWithProviders(NavbarComponent, {
    pinia,
    route: "/",
  });
  return { ...utils, usersStore, authStore };
};

describe("NavbarComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("menampilkan identitas akun aktif tanpa memuat ulang profil", async () => {
    const { wrapper, usersStore } = await setup();

    const info = wrapper.get('[data-testid="user-info"]');
    expect(info.text()).toContain("Budi");
    expect(info.text()).toContain("budi@mail.com");
    expect(
      info.get("img").attributes("src").endsWith("/img/profile/1.png")
    ).toBe(true);
    expect(wrapper.find('[data-testid="user-loading"]').exists()).toBe(false);
    expect(usersStore.fetchProfile).not.toHaveBeenCalled();
  });

  it("memuat profil dan menampilkan placeholder jika profil belum ada", async () => {
    const { wrapper, usersStore } = await setup({ profile: null });

    expect(usersStore.fetchProfile).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[data-testid="user-loading"]').text()).toBe(
      "Memuat..."
    );
    expect(wrapper.find('[data-testid="user-info"]').exists()).toBe(false);
  });

  it("tombol menu mengirim event toggle-sidebar", async () => {
    const { wrapper } = await setup();

    await wrapper.get('[data-testid="menu-button"]').trigger("click");

    expect(wrapper.emitted("toggle-sidebar")).toHaveLength(1);
  });

  it("logout berhasil: pindah ke halaman login", async () => {
    const { wrapper, router, authStore } = await setup();

    await wrapper.get('[data-testid="logout-button"]').trigger("click");
    await flushPromises();

    expect(authStore.logout).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });

  it("logout dibatalkan: tetap di halaman saat ini", async () => {
    const { wrapper, router, authStore } = await setup();
    authStore.logout.mockResolvedValue(false);

    await wrapper.get('[data-testid="logout-button"]').trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe("/");
  });
});