// SweetAlert2 dimuat hanya saat dialog pertama kali dibutuhkan, supaya tidak
// membengkakkan bundle awal (memperbaiki Performance / unused JavaScript).
const loadSwal = async () => (await import("sweetalert2")).default;

const PRIMARY_COLOR = "#4f46e5";

export const showSuccessDialog = async (message, title = "Berhasil") => {
  const Swal = await loadSwal();
  return Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonColor: PRIMARY_COLOR,
  });
};

export const showErrorDialog = async (message, title = "Gagal") => {
  const Swal = await loadSwal();
  return Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: PRIMARY_COLOR,
  });
};

export const showConfirmDialog = async (
  message,
  title = "Apakah Anda yakin?",
  confirmText = "Ya, lanjutkan"
) => {
  const Swal = await loadSwal();
  const result = await Swal.fire({
    icon: "warning",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Batal",
    confirmButtonColor: PRIMARY_COLOR,
    cancelButtonColor: "#94a3b8",
  });

  return result.isConfirmed;
};

export const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
};

// "2026-12-31T23:59" (input datetime-local) -> "2026-12-31 23:59:00" (API)
export const toApiDateTime = (value) => {
  const text = value.replace("T", " ");
  return text.length === 16 ? `${text}:00` : text;
};

// "2024-10-05 22:00:00" (API) -> "2024-10-05T22:00" (input datetime-local)
export const toInputDateTime = (value) =>
  value ? value.replace(" ", "T").slice(0, 16) : "";

// "2024-10-05 22:00:00" (API) -> Date, dibaca sebagai waktu lokal
export const parseApiDate = (value) => new Date(value.replace(" ", "T"));

export const isAucationClosed = (closedAt, now = Date.now()) =>
  parseApiDate(closedAt).getTime() <= now;

export const formatCountdown = (closedAt, now = Date.now()) => {
  const diff = parseApiDate(closedAt).getTime() - now;
  if (diff <= 0) return "Ditutup";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  if (minutes > 0) return `${minutes} menit`;
  return "Kurang dari 1 menit";
};

// Penawaran tertinggi dari array bids. Elemen berupa objek { bid } dihitung;
// elemen berupa ID (seperti di respons daftar lelang) diabaikan. 0 jika tidak ada.
export const getHighestBid = (bids) =>
  Math.max(
    0,
    ...bids.map((item) => (typeof item === "object" ? item.bid : 0))
  );