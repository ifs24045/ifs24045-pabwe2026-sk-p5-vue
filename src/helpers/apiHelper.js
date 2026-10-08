const ACCESS_TOKEN_KEY = "accessToken";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const putAccessToken = (token) =>
  localStorage.setItem(ACCESS_TOKEN_KEY, token);

export const removeAccessToken = () =>
  localStorage.removeItem(ACCESS_TOKEN_KEY);

// Respons Delcom: { status: "success" | "fail", message, data }
export const isSuccess = (response) => response.status === "success";

// Gabungkan message dengan detail validasi (data.field = ["pesan"]) jika ada
export const getErrorMessage = (response) => {
  const base = response.message || "Terjadi kesalahan";
  const details =
    response.data && typeof response.data === "object"
      ? Object.values(response.data).flat()
      : [];

  return details.length ? `${base}: ${details.join(", ")}` : base;
};

// Ubah object menjadi query string, abaikan nilai kosong
export const buildQuery = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

// Ubah path relatif dari server (mis. "img/profile/1.png") menjadi URL penuh.
// URL absolut dikembalikan apa adanya.
export const getAssetUrl = (path) => {
  if (!path) return ""; 
  if (/^https?:\/\//i.test(path)) return path;

  const origin = DELCOM_BASEURL.replace(/\/api\/v1\/?$/, "");
  return `${origin}/${path.replace(/^\//, "")}`;
};

export async function apiFetch(
  path,
  { method = "GET", body, params, auth = true } = {}
) {
  const headers = { Accept: "application/json" };
  const token = getAccessToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload;
  if (body instanceof FormData) {
    // Content-Type diatur otomatis oleh browser (multipart boundary)
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  try {
    const response = await fetch(
      `${DELCOM_BASEURL}${path}${buildQuery(params)}`,
      { method, headers, body: payload }
    );
    return await response.json();
  } catch {
    return {
      status: "fail",
      message: "Tidak dapat terhubung ke server",
      data: null,
    };
  }
}