import { apiFetch } from "../../../helpers/apiHelper";

// params: { is_me: 1, is_closed: 0 | 1 } (semua opsional)
export const getAucations = (params) => apiFetch("/aucations", { params });

export const getAucationById = (id) => apiFetch(`/aucations/${id}`);

export const addAucation = ({ title, description, startBid, closedAt }) =>
  apiFetch("/aucations", {
    method: "POST",
    body: {
      title,
      description,
      start_bid: Number(startBid),
      closed_at: closedAt,
    },
  });

export const updateAucation = (id, { title, description, startBid, closedAt }) =>
  apiFetch(`/aucations/${id}`, {
    method: "PUT",
    body: {
      title,
      description,
      start_bid: Number(startBid),
      closed_at: closedAt,
    },
  });

export const updateCover = (id, file) => {
  const formData = new FormData();
  formData.append("cover", file);

  return apiFetch(`/aucations/${id}/cover`, { method: "POST", body: formData });
};

export const deleteAucation = (id) =>
  apiFetch(`/aucations/${id}`, { method: "DELETE" });

export const addBid = (id, bid) =>
  apiFetch(`/aucations/${id}/bids`, {
    method: "POST",
    body: { bid: Number(bid) },
  });

export const deleteBid = (id) =>
  apiFetch(`/aucations/${id}/bids`, { method: "DELETE" });

export const deleteAllAucations = () =>
  apiFetch("/aucations", { method: "DELETE" });