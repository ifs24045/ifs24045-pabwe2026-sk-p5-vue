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
import RegisterPage from "./RegisterPage.vue";

const setup = async () => {
  const utils = await renderWithProviders(RegisterPage, {
    route: "/auth/register",
  });
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

const validForm = {
  "name-input": "Budi",
  "email-input": "budi@mail.com",
  "password-input": "rahasia",
  "confirm-password-input": "rahasia",
};

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("menampilkan form registrasi dan tautan ke login", async () => {
    const { wrapper } = await setup();

    expect(wrapper.find('[data-testid="name-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="email-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="password-input"]').exists()).toBe(true);
    expect(
      wrapper.find('[data-testid="confirm-password-input"]').exists()
    ).toBe(true);
    expect(wrapper.get('[data-testid="register-button"]').text()).toBe(
      "Daftar"
    );
    expect(wrapper.get('[data-testid="login-link"]').attributes("href")).toBe(
      "/auth/login"
    );
  });

  it.each([
    ["nama kosong", {}],
    ["email kosong", { "name-input": "Budi" }],
    ["password kosong", { "name-input": "Budi", "email-input": "b@mail.com" }],
  ])("menolak submit jika %s", async (_label, values) => {
    const { wrapper, store } = await setup();
    const registerSpy = vi.spyOn(store, "register");

    await fill(wrapper, values);
    await submit(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith(
      "Nama, email, dan password wajib diisi"
    );
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("menolak submit jika konfirmasi password tidak cocok", async () => {
    const { wrapper, store } = await setup();
    const registerSpy = vi.spyOn(store, "register");

    await fill(wrapper, { ...validForm, "confirm-password-input": "beda" });
    await submit(wrapper);

    expect(showErrorDialog).toHaveBeenCalledWith(
      "Konfirmasi password tidak cocok"
    );
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it("registrasi berhasil: memanggil store lalu pindah ke login", async () => {
    const { wrapper, router, store } = await setup();
    const registerSpy = vi.spyOn(store, "register").mockResolvedValue(true);

    await fill(wrapper, validForm);
    await submit(wrapper);

    expect(registerSpy).toHaveBeenCalledWith({
      name: "Budi",
      email: "budi@mail.com",
      password: "rahasia",
    });
    expect(router.currentRoute.value.fullPath).toBe("/auth/login");
  });

  it("registrasi gagal: tetap di halaman registrasi", async () => {
    const { wrapper, router, store } = await setup();
    vi.spyOn(store, "register").mockResolvedValue(false);

    await fill(wrapper, validForm);
    await submit(wrapper);

    expect(router.currentRoute.value.fullPath).toBe("/auth/register");
  });

  it("menonaktifkan tombol saat loading", async () => {
    const { wrapper, store } = await setup();

    store.$patch({ isLoading: true });
    await nextTick();

    const button = wrapper.get('[data-testid="register-button"]');
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.text()).toBe("Memproses...");
  });
});