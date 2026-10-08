import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../helpers/apiHelper", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "../../../helpers/apiHelper";
import {
  getAucations,
  getAucationById,
  addAucation,
  updateAucation,
  updateCover,
  deleteAucation,
  addBid,
  deleteBid,
  deleteAllAucations,
} from "./aucationApi";

const payload = {
  title: "Keyboard",
  description: "Masih mulus",
  startBid: "200000",
  closedAt: "2026-12-31 23:59:59",
};

const expectedBody = {
  title: "Keyboard",
  description: "Masih mulus",
  start_bid: 200000,
  closed_at: "2026-12-31 23:59:59",
};

describe("aucationApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({ status: "success" });
  });

  it("getAucations meneruskan query params", async () => {
    const result = await getAucations({ is_me: 1, is_closed: 0 });

    expect(result).toEqual({ status: "success" });
    expect(apiFetch).toHaveBeenCalledWith("/aucations", {
      params: { is_me: 1, is_closed: 0 },
    });
  });

  it("getAucations tanpa parameter", async () => {
    await getAucations();

    expect(apiFetch).toHaveBeenCalledWith("/aucations", { params: undefined });
  });

  it("getAucationById memanggil GET /aucations/:id", async () => {
    await getAucationById(3);

    expect(apiFetch).toHaveBeenCalledWith("/aucations/3");
  });

  it("addAucation memanggil POST dan mengubah start_bid menjadi angka", async () => {
    await addAucation(payload);

    expect(apiFetch).toHaveBeenCalledWith("/aucations", {
      method: "POST",
      body: expectedBody,
    });
  });

  it("updateAucation memanggil PUT /aucations/:id", async () => {
    await updateAucation(3, payload);

    expect(apiFetch).toHaveBeenCalledWith("/aucations/3", {
      method: "PUT",
      body: expectedBody,
    });
  });

  it("updateCover mengirim FormData berisi field cover", async () => {
    const file = new File(["isi"], "cover.jpg", { type: "image/jpeg" });

    await updateCover(3, file);

    const [path, options] = apiFetch.mock.calls[0];
    expect(path).toBe("/aucations/3/cover");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("cover").name).toBe("cover.jpg");
  });

  it("deleteAucation memanggil DELETE /aucations/:id", async () => {
    await deleteAucation(3);

    expect(apiFetch).toHaveBeenCalledWith("/aucations/3", { method: "DELETE" });
  });

  it("addBid memanggil POST /aucations/:id/bids dengan bid angka", async () => {
    await addBid(3, "7000000");

    expect(apiFetch).toHaveBeenCalledWith("/aucations/3/bids", {
      method: "POST",
      body: { bid: 7000000 },
    });
  });

  it("deleteBid memanggil DELETE /aucations/:id/bids", async () => {
    await deleteBid(3);

    expect(apiFetch).toHaveBeenCalledWith("/aucations/3/bids", {
      method: "DELETE",
    });
  });

  it("deleteAllAucations memanggil DELETE /aucations", async () => {
    await deleteAllAucations();

    expect(apiFetch).toHaveBeenCalledWith("/aucations", { method: "DELETE" });
  });
});