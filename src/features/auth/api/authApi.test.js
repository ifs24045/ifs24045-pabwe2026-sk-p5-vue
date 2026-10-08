import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../helpers/apiHelper", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "../../../helpers/apiHelper";
import { login, register, logout } from "./authApi";

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({ status: "success" });
  });

  it("login memanggil POST /auth/login tanpa auth", async () => {
    const result = await login({ email: "a@b.com", password: "rahasia" });

    expect(result).toEqual({ status: "success" });
    expect(apiFetch).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "a@b.com", password: "rahasia" },
      auth: false,
    });
  });

  it("register memanggil POST /auth/register tanpa auth", async () => {
    const result = await register({
      name: "Budi",
      email: "a@b.com",
      password: "rahasia",
    });

    expect(result).toEqual({ status: "success" });
    expect(apiFetch).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: { name: "Budi", email: "a@b.com", password: "rahasia" },
      auth: false,
    });
  });

  it("logout memanggil POST /auth/logout dengan token", async () => {
    const result = await logout();

    expect(result).toEqual({ status: "success" });
    expect(apiFetch).toHaveBeenCalledWith("/auth/logout", { method: "POST" });
  });
});