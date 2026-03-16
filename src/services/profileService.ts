import { api } from "./api";

export type GetProfileImageResponse = {
  success: boolean;
  image_url: string | null;
  message: string;
};

export type UpdateProfileImageResponse = {
  success: boolean;
  message: string;
  image_url: string | null;
};

export type EmployeeUpdatePayload = {
  username: string;
  mail: string;
  department?: string;
  company?: string;
  title?: string;
  displayname?: string;
  phoneNumber?: string;
  user_note?: string;
};

export type EmployeeUpdateResponse = {
  status: "success" | "error";
  message: string;
  data: { id: number } | null;
};

const PROFILE_CACHE_PREFIX = "profile_image_url_";

export async function getProfileImage(email: string) {
  const body = new URLSearchParams();
  body.append("email", email);

  const response = await api.post<GetProfileImageResponse>(
    "/get_profile_image",
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

export async function uploadProfileImage(email: string, file: File) {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("image", file);

  const response = await api.post<UpdateProfileImageResponse>(
    "/update_employee_image",
    formData
    // Don't set Content-Type manually here.
    // Browser will set correct multipart boundary.
  );

  return response.data;
}

export async function submitEmployeeUpdate(payload: EmployeeUpdatePayload) {
  const response = await api.post<EmployeeUpdateResponse>(
    "/update_employee",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

export function setProfileImageCache(email: string, imageUrl: string) {
  localStorage.setItem(`${PROFILE_CACHE_PREFIX}${email}`, imageUrl);
}

export function clearProfileImageCache(email?: string) {
  if (!email) return;
  localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${email}`);
}