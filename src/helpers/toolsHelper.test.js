import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

import Swal from "sweetalert2";
import {
  showSuccessDialog,
  showErrorDialog,
  showConfirmDialog,
  formatRupiah,
  formatDate,
  toApiDateTime,
  toInputDateTime,
} from "./toolsHelper";

describe("toolsHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toApiDateTime", () => {
    it("mengubah format input menjadi format API dengan detik", () => {
      expect(toApiDateTime("2026-12-31T23:59")).toBe("2026-12-31 23:59:00");
    });

    it("mempertahankan detik jika sudah ada", () => {
      expect(toApiDateTime("2026-12-31T23:59:30")).toBe("2026-12-31 23:59:30");
    });
  });

  describe("toInputDateTime", () => {
    it("mengembalikan string kosong untuk nilai kosong", () => {
      expect(toInputDateTime("")).toBe("");
      expect(toInputDateTime(null)).toBe("");
    });

    it("mengubah format API menjadi format input", () => {
      expect(toInputDateTime("2024-10-05 22:00:00")).toBe("2024-10-05T22:00");
    });
  });  

  it("showSuccessDialog dengan judul default dan custom", () => {
    showSuccessDialog("Data tersimpan");
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Berhasil",
        text: "Data tersimpan",
      })
    );

    showSuccessDialog("Data tersimpan", "Sukses");
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Sukses" })
    );
  });

  it("showErrorDialog dengan judul default dan custom", () => {
    showErrorDialog("Terjadi kesalahan");
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan",
      })
    );

    showErrorDialog("Terjadi kesalahan", "Oops");
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Oops" })
    );
  });

  it("showConfirmDialog mengembalikan true jika dikonfirmasi", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true });

    const result = await showConfirmDialog("Hapus lelang?");

    expect(result).toBe(true);
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: "warning",
        title: "Apakah Anda yakin?",
        text: "Hapus lelang?",
        confirmButtonText: "Ya, lanjutkan",
        showCancelButton: true,
      })
    );
  });

  it("showConfirmDialog mengembalikan false jika dibatalkan", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: false });

    const result = await showConfirmDialog("Hapus?", "Konfirmasi", "Hapus");

    expect(result).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Konfirmasi",
        confirmButtonText: "Hapus",
      })
    );
  });

  describe("formatRupiah", () => {
    it("memformat angka dan string numerik", () => {
      expect(formatRupiah(1500000)).toMatch(/Rp\s?1\.500\.000/);
      expect(formatRupiah("250000")).toMatch(/Rp\s?250\.000/);
    });

    it("menganggap nilai tidak valid sebagai 0", () => {
      expect(formatRupiah("abc")).toMatch(/Rp\s?0/);
      expect(formatRupiah(null)).toMatch(/Rp\s?0/);
    });
  });

  describe("formatDate", () => {
    it("mengembalikan '-' untuk nilai kosong", () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate("")).toBe("-");
    });

    it("mengembalikan '-' untuk tanggal tidak valid", () => {
      expect(formatDate("bukan-tanggal")).toBe("-");
    });

    it("memformat tanggal valid ke bahasa Indonesia", () => {
      const result = formatDate(new Date(2026, 9, 8, 7, 58));

      expect(result).toContain("Oktober");
      expect(result).toContain("2026");
    });
  });
});