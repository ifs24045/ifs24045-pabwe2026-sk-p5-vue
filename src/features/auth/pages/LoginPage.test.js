import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

vi.mock("../../../helpers/toolsHelper", () => ({
  showSuccessDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showConfirmDialog: vi.fn(),
}));

import { showErrorDialog } from "../../../helpers/toolsHelper";
import { renderWithProviders } from "../../../test-utils";
import { useAuthStore } from "../states/authStore";
import LoginPage from "./LoginPage.vue";

const setup = async () => {
  const utils = await renderWithProviders(LoginPage, { route: "/auth/login" });
  const store = useAuthStore(utils.pinia);
  return { ...utils, store };
};

const fill = async (wrapper, values) => {
  for (const [testId, value] of Object.entries(values)) {
    await wrapper.get(`[data-testid="${testId}"]`).setValue(value);
  }
};

const submit = async (wrapper) => {
  await wrapper.get("form").trigger("submit");
  await flushPromises();
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("menampilkan form login dan tautan ke registrasi", async () => {
    const { wrapper } = await setup();

    expect(wrapper.find('[data-testid="email-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="password-input"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="login-button"]').text()).toBe("Masuk");
    expect(wrapper.get('[data-testid="register-link"]').attributes("href")).toBe(
      "/auth/register"
    );
  });

  it.each([
    ["email kosong", {}],
    ["password kosong", { "email-input": "a@b.com" }],
  ])("menolak submit jika %s", async (_label, values) => {
    const { wrapper, store } = await setup();
    const loginSpy = vi.spyOn(store, "login");

    await fill(wrapper, values);
    await submit(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith(
      "Email dan password wajib diisi"
    );
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("login berhasil: memanggil store lalu pindah ke beranda", async () => {
    const { wrapper, router, store } = await setup();
    const loginSpy = vi.spyOn(store, "login").mockResolvedValue(true);

    await fill(wrapper, {
      "email-input": "a@b.com",
      "password-input": "rahasia",
    });
    await submit(wrapper);

    expect(loginSpy).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "rahasia",
    });
    expect(router.currentRoute.value.fullPath).toBe("/");
  });

  it("login gagal: tetap di halaman login", async () => {
    const { wrapper, router, store } = await setup();
    vi.spyOn(store, "login").mockResolvedValue(false);

    await fill(wrapper, {
      "email-input": "a@b.com",
      "password-input": "salah",
    });
    await submit(wrapper);

    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });

  it("menonaktifkan tombol saat loading", async () => {
    const { wrapper, store } = await setup();

    store.$patch({ isLoading: true });
    await nextTick();

    const button = wrapper.get('[data-testid="login-button"]');
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.text()).toBe("Memproses...");
  });
});