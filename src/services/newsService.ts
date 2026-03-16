import { api } from "./api";
import type { NewsItem, ToggleNewsLikeResponse } from "../types/news";

export async function getNewsList(userEmail?: string): Promise<NewsItem[]> {
  const response = await api.get<NewsItem[]>("/get_news/news_list", {
    params: userEmail ? { user_email: userEmail } : {},
  });

  return response.data;
}

export async function toggleNewsLike(
  postId: number,
  userEmail: string
): Promise<ToggleNewsLikeResponse> {
  const body = new URLSearchParams();
  body.append("post_id", String(postId));
  body.append("user_email", userEmail);

  const response = await api.post<ToggleNewsLikeResponse>(
    "/toggle_news_like",
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}