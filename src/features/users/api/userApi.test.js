import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../helpers/apiHelper", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "../../../helpers/apiHelper";
import {
  getUsers,
  getUserById,
  getProfile,
  updateProfile,
  updatePhoto,
  updatePassword,
} from "./userApi";

describe("userApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({ status: "success" });
  });

  it("getUsers memanggil GET /users", async () => {
    const result = await getUsers();

    expect(result).toEqual({ status: "success" });
    expect(apiFetch).toHaveBeenCalledWith("/users");
  });

  it("getUserById memanggil GET /users/:id", async () => {
    await getUserById(5);

    expect(apiFetch).toHaveBeenCalledWith("/users/5");
  });

  it("getProfile memanggil GET /users/me", async () => {
    await getProfile();

    expect(apiFetch).toHaveBeenCalledWith("/users/me");
  });

  it("updateProfile memanggil PUT /users/me dengan name dan email", async () => {
    await updateProfile({ name: "Budi", email: "b@mail.com", extra: "x" });

    expect(apiFetch).toHaveBeenCalledWith("/users/me", {
      method: "PUT",
      body: { name: "Budi", email: "b@mail.com" },
    });
  });

  it("updatePhoto mengirim FormData berisi field photo", async () => {
    const file = new File(["isi"], "foto.png", { type: "image/png" });

    await updatePhoto(file);

    const [path, options] = apiFetch.mock.calls[0];
    expect(path).toBe("/users/me/photo");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("photo").name).toBe("foto.png");
  });

  it("updatePassword memetakan field ke format snake_case API", async () => {
    await updatePassword({
      password: "lama",
      newPassword: "baru",
      newPasswordConfirmation: "baru",
    });

    expect(apiFetch).toHaveBeenCalledWith("/users/password", {
      method: "PUT",
      body: {
        password: "lama",
        new_password: "baru",
        new_password_confirmation: "baru",
      },
    });
  });
});