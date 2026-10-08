import { apiFetch } from "../../../helpers/apiHelper";

export const getUsers = () => apiFetch("/users");

export const getUserById = (id) => apiFetch(`/users/${id}`);

export const getProfile = () => apiFetch("/users/me");

export const updateProfile = ({ name, email }) =>
  apiFetch("/users/me", { method: "PUT", body: { name, email } });

export const updatePhoto = (file) => {
  const formData = new FormData();
  formData.append("photo", file);

  return apiFetch("/users/me/photo", { method: "POST", body: formData });
};

export const updatePassword = ({
  password,
  newPassword,
  newPasswordConfirmation,
}) =>
  apiFetch("/users/password", {
    method: "PUT",
    body: {
      password,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    },
  });