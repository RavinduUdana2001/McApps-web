import { api, ensureSuccess } from "./api";
import type { BirthdayItem, ToggleBirthdayLikeResponse } from "../types/birthday";

export async function getBirthdayList(userEmail?: string): Promise<BirthdayItem[]> {
  const response = await api.get<BirthdayItem[]>("/get_birthday/get_birthday", {
    params: userEmail ? { user_email: userEmail } : {},
  });

  return response.data;
}

export async function toggleBirthdayLike(
  bdId: number,
  userEmail: string
): Promise<ToggleBirthdayLikeResponse> {
  const body = new URLSearchParams();
  body.append("bd_id", String(bdId));
  body.append("user_email", userEmail);

  const response = await api.post("/toggle_birthday_like", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return ensureSuccess<ToggleBirthdayLikeResponse>(response.data);
}