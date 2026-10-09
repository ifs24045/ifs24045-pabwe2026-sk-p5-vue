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
  parseApiDate,
  isAucationClosed,
  formatCountdown,
  getHighestBid,
} from "./toolsHelper";

describe("toolsHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseApiDate", () => {
    it("membaca format API sebagai waktu lokal", () => {
      const date = parseApiDate("2024-10-05 22:00:00");

      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(9);
      expect(date.getDate()).toBe(5);
      expect(date.getHours()).toBe(22);
    });
  });

  describe("isAucationClosed", () => {
    const now = new Date(2026, 9, 8, 12, 0, 0).getTime();

    it("true jika batas waktu sudah lewat atau tepat sekarang", () => {
      expect(isAucationClosed("2026-10-08 11:59:59", now)).toBe(true);
      expect(isAucationClosed("2026-10-08 12:00:00", now)).toBe(true);
    });

    it("false jika masih berlangsung", () => {
      expect(isAucationClosed("2026-10-08 12:00:01", now)).toBe(false);
    });

    it("memakai waktu sekarang sebagai default", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 8, 12, 0, 0));

      expect(isAucationClosed("2026-10-08 13:00:00")).toBe(false);
      expect(isAucationClosed("2026-10-08 11:00:00")).toBe(true);

      vi.useRealTimers();
    });
  });

  describe("formatCountdown", () => {
    const now = new Date(2026, 9, 8, 12, 0, 0).getTime();

    it("'Ditutup' jika batas waktu sudah lewat", () => {
      expect(formatCountdown("2026-10-08 12:00:00", now)).toBe("Ditutup");
      expect(formatCountdown("2026-10-01 10:00:00", now)).toBe("Ditutup");
    });

    it("menampilkan hari dan jam", () => {
      expect(formatCountdown("2026-10-10 15:30:00", now)).toBe("2 hari 3 jam");
    });

    it("menampilkan jam dan menit", () => {
      expect(formatCountdown("2026-10-08 17:30:00", now)).toBe("5 jam 30 menit");
    });

    it("menampilkan menit", () => {
      expect(formatCountdown("2026-10-08 12:45:00", now)).toBe("45 menit");
    });

    it("menampilkan 'Kurang dari 1 menit'", () => {
      expect(formatCountdown("2026-10-08 12:00:30", now)).toBe(
        "Kurang dari 1 menit"
      );
    });

    it("memakai waktu sekarang sebagai default", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 8, 12, 0, 0));

      expect(formatCountdown("2026-10-08 12:10:00")).toBe("10 menit");

      vi.useRealTimers();
    });
  });

  describe("getHighestBid", () => {
    it("0 jika tidak ada penawaran", () => {
      expect(getHighestBid([])).toBe(0);
    });

    it("mengabaikan elemen berupa ID", () => {
      expect(getHighestBid([2, 3])).toBe(0);
    });

    it("mengambil nominal tertinggi dari objek bid", () => {
      expect(
        getHighestBid([
          { id: 1, bid: 6000000 },
          { id: 2, bid: 7000000 },
        ])
      ).toBe(7000000);
    });
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

  it("showSuccessDialog dengan judul default dan custom", async () => {
    await showSuccessDialog("Data tersimpan");
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({
        icon: "success",
        title: "Berhasil",
        text: "Data tersimpan",
      })
    );

    await showSuccessDialog("Data tersimpan", "Sukses");
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Sukses" })
    );
  });

  it("showErrorDialog dengan judul default dan custom", async () => {
    await showErrorDialog("Terjadi kesalahan");
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan",
      })
    );

    await showErrorDialog("Terjadi kesalahan", "Oops");
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