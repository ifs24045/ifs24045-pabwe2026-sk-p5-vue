import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("@toast-ui/editor", () => ({
  default: class MockEditor {
    constructor(options) {
      this.markdown = options.initialValue;
    }
    getMarkdown() {
      return this.markdown;
    }
    setMarkdown(value) {
      this.markdown = value;
    }
    destroy() {}
  },
}));
vi.mock("@toast-ui/editor/dist/toastui-editor-viewer", () => ({
  default: class MockViewer {
    setMarkdown() {}
    destroy() {}
  },
}));
vi.mock("./helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal()),
  showConfirmDialog: vi.fn(),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import { showConfirmDialog } from "./helpers/toolsHelper";
import { createMockPinia } from "./test-utils";
import { useUsersStore } from "./features/users/states/usersStore";
import router from "./router";
import App from "./App.vue";

const profile = {
  id: 1,
  name: "Budi",
  email: "budi@mail.com",
  photo: "img/profile/1.png",
  created_at: "2024-02-29T23:46:32.000000Z",
};

const aucation = {
  id: 1,
  user_id: 2,
  title: "Keyboard Gaming RGB",
  cover: null,
  description: "Masih mulus",
  start_bid: 200000,
  closed_at: "2030-01-01 00:00:00",
  author: { name: "Sari", photo: "img/profile/2.png" },
  bids: [],
};

const baseApi = {
  "GET /users/me": { status: "success", data: { user: profile } },
  "GET /aucations": { status: "success", data: { aucations: [aucation] } },
};

// Palsukan fetch: respons dipilih berdasarkan "METHOD /path"
const stubApi = (extra = {}) => {
  const responses = { ...baseApi, ...extra };
  const fetchMock = vi.fn((url, options) => {
    const key = `${options.method} ${url.replace(DELCOM_BASEURL, "")}`;
    const body = responses[key] ?? {
      status: "fail",
      message: `Tidak ada mock untuk ${key}`,
      data: null,
    };
    return Promise.resolve({ json: () => Promise.resolve(body) });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

let wrapper;

const mountApp = async (path) => {
  await router.push(path);
  const pinia = createMockPinia();
  wrapper = mount(App, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return { wrapper, pinia };
};

const has = (testId) => wrapper.find(`[data-testid="${testId}"]`).exists();
const currentPath = () => router.currentRoute.value.fullPath;
const login = () => localStorage.setItem("accessToken", "token-uji");

describe("App (integrasi)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    stubApi();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.unstubAllGlobals();
  });

  describe("pengguna belum login", () => {
    it("dashboard dialihkan ke halaman login", async () => {
      await mountApp("/");

      expect(currentPath()).toBe("/auth/login");
      expect(has("auth-layout")).toBe(true);
      expect(has("login-page")).toBe(true);
    });

    it("halaman profil dialihkan ke halaman login", async () => {
      await mountApp("/profile");

      expect(currentPath()).toBe("/auth/login");
      expect(has("login-page")).toBe(true);
    });

    it("/auth dialihkan ke halaman login", async () => {
      await mountApp("/auth");

      expect(currentPath()).toBe("/auth/login");
      expect(has("login-page")).toBe(true);
    });

    it("halaman registrasi dapat diakses", async () => {
      await mountApp("/auth/register");

      expect(currentPath()).toBe("/auth/register");
      expect(has("register-page")).toBe(true);
    });

    it("alamat tidak dikenal menampilkan halaman 404", async () => {
      await mountApp("/tidak-ada");

      expect(currentPath()).toBe("/tidak-ada");
      expect(has("not-found-page")).toBe(true);
    });

    it("login berhasil membawa pengguna ke dashboard", async () => {
      const fetchMock = stubApi({
        "POST /auth/login": {
          status: "success",
          message: "Berhasil login",
          data: { token: "token-baru" },
        },
      });
      await mountApp("/auth/login");

      await wrapper.get('[data-testid="email-input"]').setValue("budi@mail.com");
      await wrapper.get('[data-testid="password-input"]').setValue("rahasia");
      await wrapper.get("form").trigger("submit");
      await vi.waitFor(() => expect(currentPath()).toBe("/"));
      await flushPromises();

      expect(localStorage.getItem("accessToken")).toBe("token-baru");
      expect(has("home-page")).toBe(true);

      const loginCall = fetchMock.mock.calls.find(([url]) =>
        url.endsWith("/auth/login")
      );
      expect(loginCall[1].headers.Authorization).toBeUndefined();
    });
  });

  describe("pengguna sudah login", () => {
    beforeEach(login);

    it("halaman login dialihkan ke dashboard", async () => {
      await mountApp("/auth/login");

      expect(currentPath()).toBe("/");
      expect(has("aucation-layout")).toBe(true);
      expect(has("home-page")).toBe(true);
    });

    it("dashboard menampilkan daftar lelang dan identitas akun", async () => {
      await mountApp("/");

      expect(wrapper.findAll('[data-testid="aucation-card"]')).toHaveLength(1);
      expect(wrapper.get('[data-testid="user-info"]').text()).toContain("Budi");
    });

    it("halaman detail lelang dapat diakses", async () => {
      stubApi({
        "GET /aucations/1": {
          status: "success",
          data: { aucation: { ...aucation, my_bid: null } },
        },
      });
      await mountApp("/aucations/1");

      expect(has("detail-page")).toBe(true);
      expect(wrapper.get('[data-testid="aucation-title"]').text()).toBe(
        "Keyboard Gaming RGB"
      );
    });

    it("halaman direktori pengguna dapat diakses", async () => {
      stubApi({
        "GET /users": {
          status: "success",
          data: { users: [profile] },
        },
      });
      await mountApp("/users");

      expect(has("users-page")).toBe(true);
      expect(wrapper.findAll('[data-testid="user-card"]')).toHaveLength(1);
    });

    it("halaman profil dapat diakses", async () => {
      await mountApp("/profile");

      expect(has("profile-page")).toBe(true);
      expect(wrapper.get('[data-testid="profile-name"]').text()).toBe("Budi");
    });

    it("alamat tidak dikenal menampilkan halaman 404", async () => {
      await mountApp("/tidak-ada");

      expect(has("not-found-page")).toBe(true);
    });

    it("logout membersihkan sesi dan kembali ke halaman login", async () => {
      stubApi({ "POST /auth/logout": { status: "success" } });
      showConfirmDialog.mockResolvedValue(true);
      const { pinia } = await mountApp("/");
      expect(useUsersStore(pinia).profile).not.toBeNull();

      await wrapper.get('[data-testid="logout-button"]').trigger("click");
      await flushPromises();

      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(currentPath()).toBe("/auth/login");
      expect(has("login-page")).toBe(true);
      expect(useUsersStore(pinia).profile).toBeNull();
    });
  });
});