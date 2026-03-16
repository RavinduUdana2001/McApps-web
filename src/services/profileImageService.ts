import { api } from "./api";

type GetProfileImageResponse = {
  success: boolean;
  image_url: string | null;
  message: string;
};

const PROFILE_CACHE_PREFIX = "profile_image_url_";

export async function getProfileImageUrl(email: string): Promise<string | null> {
  if (!email) return null;

  const cacheKey = `${PROFILE_CACHE_PREFIX}${email}`;
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    return cached;
  }

  try {
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

    const data = response.data;

    if (data?.success && data.image_url) {
      localStorage.setItem(cacheKey, data.image_url);
      return data.image_url;
    }

    return null;
  } catch (error) {
    console.error("Failed to load profile image:", error);
    return null;
  }
}

export function clearProfileImageCache(email?: string) {
  if (!email) return;
  localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${email}`);
}