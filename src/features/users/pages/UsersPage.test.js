import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { useUsersStore } from "../states/usersStore";
import UsersPage from "./UsersPage.vue";

const users = [
  {
    id: 1,
    name: "Budi",
    email: "budi@mail.com",
    photo: "http://127.0.0.1:8000/default/img/user.png",
    created_at: "2024-10-05T03:26:57.000000Z",
  },
  {
    id: 2,
    name: "Sari",
    email: "sari@mail.com",
    photo: "img/profile/2.png",
    created_at: "2024-10-06T03:26:57.000000Z",
  },
];

const setup = async (patch = {}) => {
  const pinia = createMockPinia();
  const store = useUsersStore(pinia);
  vi.spyOn(store, "fetchUsers").mockResolvedValue(true);
  store.$patch(patch);

  const utils = await renderWithProviders(UsersPage, {
    pinia,
    route: "/users",
  });
  return { ...utils, store };
};

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("memuat daftar pengguna saat halaman dibuka", async () => {
    const { store } = await setup();

    expect(store.fetchUsers).toHaveBeenCalledTimes(1);
  });

  it("menampilkan status loading", async () => {
    const { wrapper } = await setup({ isLoading: true });

    expect(wrapper.find('[data-testid="users-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="user-card"]').exists()).toBe(false);
  });

  it("menampilkan pesan kosong jika belum ada pengguna", async () => {
    const { wrapper } = await setup({ users: [] });

    expect(wrapper.find('[data-testid="users-empty"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="users-count"]').text()).toContain("0");
  });

  it("menampilkan kartu setiap pengguna", async () => {
    const { wrapper } = await setup({ users });

    const cards = wrapper.findAll('[data-testid="user-card"]');
    expect(cards).toHaveLength(2);
    expect(wrapper.get('[data-testid="users-count"]').text()).toContain("2");

    expect(cards[0].text()).toContain("Budi");
    expect(cards[0].text()).toContain("budi@mail.com");
    expect(cards[0].text()).toContain("2024");
    expect(cards[1].text()).toContain("Sari");
    expect(cards[1].text()).toContain("sari@mail.com");
  });

  it("memakai URL foto absolut apa adanya dan melengkapi path relatif", async () => {
    const { wrapper } = await setup({ users });

    const images = wrapper.findAll("img");
    expect(images[0].attributes("src")).toBe(
      "http://127.0.0.1:8000/default/img/user.png"
    );
    expect(images[1].attributes("src")).toMatch(/^https?:\/\//);
    expect(images[1].attributes("src").endsWith("/img/profile/2.png")).toBe(
      true
    );
  });
});