import Swal from "sweetalert2";

const PRIMARY_COLOR = "#4f46e5";

export const showSuccessDialog = (message, title = "Berhasil") =>
  Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonColor: PRIMARY_COLOR,
  });

export const showErrorDialog = (message, title = "Gagal") =>
  Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: PRIMARY_COLOR,
  });

export const showConfirmDialog = async (
  message,
  title = "Apakah Anda yakin?",
  confirmText = "Ya, lanjutkan"
) => {
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
  if (isNaN(date.getTime())) return "-";

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