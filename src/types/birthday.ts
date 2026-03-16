export type BirthdayItem = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  like_count: number;
  image_url: string | null;
  is_liked: number;
};

export type ToggleBirthdayLikeResponse = {
  bd_id: number;
  is_liked: number;
  like_count: number;
};