export type NewsItem = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  like_count: number;
  image_url: string | null;
  is_liked: number;
};

export type ToggleNewsLikeResponse = {
  success: boolean;
  post_id: number;
  is_liked: number;
  like_count: number;
};