import { api, ensureSuccess } from "./api";
import type { BirthdayItem, NewsItem } from "../types";

export async function getNewsList(userEmail?: string) {
  const res = await api.get("/get_news/news_list", {
    params: userEmail ? { user_email: userEmail } : {},
  });
  return res.data as NewsItem[];
}

export async function getBirthdayList(userEmail?: string) {
  const res = await api.get("/get_birthday/get_birthday", {
    params: userEmail ? { user_email: userEmail } : {},
  });
  return res.data as BirthdayItem[];
}

export async function toggleNewsLike(postId: number, userEmail: string) {
  const body = new URLSearchParams({
    post_id: String(postId),
    user_email: userEmail,
  });

  const res = await api.post("/toggle_news_like", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return ensureSuccess<{ post_id: number; is_liked: number; like_count: number }>(res.data);
}

export async function toggleBirthdayLike(bdId: number, userEmail: string) {
  const body = new URLSearchParams({
    bd_id: String(bdId),
    user_email: userEmail,
  });

  const res = await api.post("/toggle_birthday_like", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return ensureSuccess<{ bd_id: number; is_liked: number; like_count: number }>(res.data);
}