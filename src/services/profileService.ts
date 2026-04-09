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
type ProfileImageCacheEntry = {
  url: string;
  savedAt: number;
};

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

export function getProfileImageCache(email: string): ProfileImageCacheEntry | null {
  const raw = localStorage.getItem(`${PROFILE_CACHE_PREFIX}${email}`);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ProfileImageCacheEntry>;

    if (typeof parsed?.url === "string" && parsed.url.trim()) {
      return {
        url: parsed.url,
        savedAt:
          typeof parsed.savedAt === "number" && Number.isFinite(parsed.savedAt)
            ? parsed.savedAt
            : 0,
      };
    }
  } catch {
    if (raw.trim()) {
      return {
        url: raw,
        savedAt: 0,
      };
    }
  }

  return null;
}

export function setProfileImageCache(email: string, imageUrl: string) {
  const payload: ProfileImageCacheEntry = {
    url: imageUrl,
    savedAt: Date.now(),
  };

  localStorage.setItem(`${PROFILE_CACHE_PREFIX}${email}`, JSON.stringify(payload));
}

export function buildProfileImageSrc(imageUrl: string, versionSeed?: number) {
  if (!imageUrl) return "";

  const version = versionSeed && Number.isFinite(versionSeed) ? String(versionSeed) : "";

  if (!version) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl, window.location.origin);
    url.searchParams.set("v", version);
    return url.toString();
  } catch {
    const joiner = imageUrl.includes("?") ? "&" : "?";
    return `${imageUrl}${joiner}v=${encodeURIComponent(version)}`;
  }
}

export function clearProfileImageCache(email?: string) {
  if (!email) return;
  localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${email}`);
}
