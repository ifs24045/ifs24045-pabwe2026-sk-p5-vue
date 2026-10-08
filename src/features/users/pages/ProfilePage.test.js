import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { nextTick } from "vue";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => ({
  ...(await importOriginal()),
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import { showErrorDialog } from "../../../helpers/toolsHelper";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { useUsersStore } from "../states/usersStore";
import ProfilePage from "./ProfilePage.vue";

const profile = {
  id: 1,
  name: "Budi",
  email: "budi@mail.com",
  photo: "img/profile/1.png",
  created_at: "2024-02-29T23:46:32.000000Z",
};

const setup = async (patch = { profile }) => {
  const pinia = createMockPinia();
  const store = useUsersStore(pinia);
  vi.spyOn(store, "fetchProfile").mockResolvedValue(true);
  vi.spyOn(store, "changeProfile").mockResolvedValue(true);
  vi.spyOn(store, "changePhoto").mockResolvedValue(true);
  vi.spyOn(store, "changePassword").mockResolvedValue(true);
  store.$patch(patch);

  const utils = await renderWithProviders(ProfilePage, {
    pinia,
    route: "/profile",
  });
  return { ...utils, store };
};

const byId = (wrapper, id) => wrapper.get(`[data-testid="${id}"]`);

const fill = async (wrapper, values) => {
  for (const [id, value] of Object.entries(values)) {
    await byId(wrapper, id).setValue(value);
  }
};

const submit = async (wrapper, formId) => {
  await byId(wrapper, formId).trigger("submit");
  await flushPromises();
};

const selectFiles = async (wrapper, files) => {
  const input = byId(wrapper, "photo-input");
  Object.defineProperty(input.element, "files", {
    value: files,
    configurable: true,
  });
  await input.trigger("change");
  await flushPromises();
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("pemuatan data", () => {
    it("menampilkan loading dan memuat profil saat dibuka", async () => {
      const { wrapper, store } = await setup({ profile: null });

      expect(store.fetchProfile).toHaveBeenCalledTimes(1);
      expect(wrapper.find('[data-testid="profile-loading"]').exists()).toBe(
        true
      );
      expect(wrapper.find('[data-testid="profile-card"]').exists()).toBe(false);
    });

    it("menampilkan data profil dan mengisi form", async () => {
      const { wrapper } = await setup();

      expect(byId(wrapper, "profile-name").text()).toBe("Budi");
      expect(byId(wrapper, "profile-email").text()).toBe("budi@mail.com");
      expect(
        byId(wrapper, "profile-photo").attributes("src").endsWith(
          "/img/profile/1.png"
        )
      ).toBe(true);
      expect(byId(wrapper, "name-input").element.value).toBe("Budi");
      expect(byId(wrapper, "email-input").element.value).toBe("budi@mail.com");
    });

    it("mengisi form saat profil baru selesai dimuat", async () => {
      const { wrapper, store } = await setup({ profile: null });

      store.$patch({ profile });
      await nextTick();

      expect(byId(wrapper, "name-input").element.value).toBe("Budi");
      expect(byId(wrapper, "email-input").element.value).toBe("budi@mail.com");
    });
  });

  describe("ubah profil", () => {
    it.each([
      ["nama kosong", { "name-input": "" }],
      ["email kosong", { "email-input": "" }],
    ])("menolak submit jika %s", async (_label, values) => {
      const { wrapper, store } = await setup();

      await fill(wrapper, values);
      await submit(wrapper, "profile-form");

      expect(showErrorDialog).toHaveBeenCalledWith("Nama dan email wajib diisi");
      expect(store.changeProfile).not.toHaveBeenCalled();
    });

    it("memanggil store dengan nama dan email baru", async () => {
      const { wrapper, store } = await setup();

      await fill(wrapper, {
        "name-input": "Budi Baru",
        "email-input": "baru@mail.com",
      });
      await submit(wrapper, "profile-form");

      expect(store.changeProfile).toHaveBeenCalledWith({
        name: "Budi Baru",
        email: "baru@mail.com",
      });
    });

    it("menampilkan teks tombol sesuai status penyimpanan", async () => {
      const { wrapper, store } = await setup();

      expect(byId(wrapper, "profile-button").text()).toBe("Simpan perubahan");

      store.$patch({ isProfileChange: true });
      await nextTick();

      const button = byId(wrapper, "profile-button");
      expect(button.text()).toBe("Menyimpan...");
      expect(button.attributes("disabled")).toBeDefined();
    });
  });

  describe("ganti foto", () => {
    it("mengunggah file yang dipilih", async () => {
      const { wrapper, store } = await setup();
      const file = new File(["isi"], "foto.png", { type: "image/png" });

      await selectFiles(wrapper, [file]);

      expect(store.changePhoto).toHaveBeenCalledWith(file);
    });

    it("tidak melakukan apa-apa jika tidak ada file dipilih", async () => {
      const { wrapper, store } = await setup();

      await selectFiles(wrapper, []);

      expect(store.changePhoto).not.toHaveBeenCalled();
    });

    it("menampilkan status mengunggah", async () => {
      const { wrapper, store } = await setup();

      expect(byId(wrapper, "photo-label").text()).toBe("Ganti foto");

      store.$patch({ isPhotoChange: true });
      await nextTick();

      expect(byId(wrapper, "photo-label").text()).toBe("Mengunggah...");
      expect(byId(wrapper, "photo-input").attributes("disabled")).toBeDefined();
    });
  });

  describe("ubah password", () => {
    it.each([
      [
        "password saat ini kosong",
        { "new-password-input": "baru", "confirm-new-password-input": "baru" },
      ],
      [
        "password baru kosong",
        {
          "current-password-input": "lama",
          "confirm-new-password-input": "baru",
        },
      ],
      [
        "konfirmasi kosong",
        { "current-password-input": "lama", "new-password-input": "baru" },
      ],
    ])("menolak submit jika %s", async (_label, values) => {
      const { wrapper, store } = await setup();

      await fill(wrapper, values);
      await submit(wrapper, "password-form");

      expect(showErrorDialog).toHaveBeenCalledWith(
        "Semua kolom password wajib diisi"
      );
      expect(store.changePassword).not.toHaveBeenCalled();
    });

    it("menolak submit jika konfirmasi tidak cocok", async () => {
      const { wrapper, store } = await setup();

      await fill(wrapper, {
        "current-password-input": "lama",
        "new-password-input": "baru123",
        "confirm-new-password-input": "beda123",
      });
      await submit(wrapper, "password-form");

      expect(showErrorDialog).toHaveBeenCalledWith(
        "Konfirmasi password baru tidak cocok"
      );
      expect(store.changePassword).not.toHaveBeenCalled();
    });

    it("berhasil: memanggil store lalu mengosongkan form", async () => {
      const { wrapper, store } = await setup();

      await fill(wrapper, {
        "current-password-input": "lama",
        "new-password-input": "baru123",
        "confirm-new-password-input": "baru123",
      });
      await submit(wrapper, "password-form");

      expect(store.changePassword).toHaveBeenCalledWith({
        password: "lama",
        newPassword: "baru123",
        newPasswordConfirmation: "baru123",
      });
      expect(byId(wrapper, "current-password-input").element.value).toBe("");
      expect(byId(wrapper, "new-password-input").element.value).toBe("");
      expect(byId(wrapper, "confirm-new-password-input").element.value).toBe(
        ""
      );
    });

    it("gagal: isi form dipertahankan", async () => {
      const { wrapper, store } = await setup();
      store.changePassword.mockResolvedValue(false);

      await fill(wrapper, {
        "current-password-input": "lama",
        "new-password-input": "baru123",
        "confirm-new-password-input": "baru123",
      });
      await submit(wrapper, "password-form");

      expect(byId(wrapper, "current-password-input").element.value).toBe(
        "lama"
      );
      expect(byId(wrapper, "new-password-input").element.value).toBe("baru123");
    });

    it("menampilkan teks tombol sesuai status penyimpanan", async () => {
      const { wrapper, store } = await setup();

      expect(byId(wrapper, "password-button").text()).toBe("Ubah password");

      store.$patch({ isPasswordChange: true });
      await nextTick();

      const button = byId(wrapper, "password-button");
      expect(button.text()).toBe("Mengubah...");
      expect(button.attributes("disabled")).toBeDefined();
    });
  });
});