import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, CalendarDays } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { getNewsList, toggleNewsLike } from "../services/newsService";
import { getSession } from "../utils/session";
import { formatDate } from "../utils/date";
import type { NewsItem } from "../types/news";

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getSession();

  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);

        const data = await getNewsList(user?.mail || undefined);
        const matchedItem =
          data.find((item) => String(item.id) === String(id)) || null;

        setNews(matchedItem);
      } catch (error) {
        console.error("Failed to load news detail:", error);
        setNews(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadNews();
    } else {
      setLoading(false);
      setNews(null);
    }
  }, [id, user?.mail]);

  const handleLike = async () => {
    if (!news || !user?.mail) return;

    try {
      setLiking(true);

      const result = await toggleNewsLike(Number(news.id), user.mail);

      setNews({
        ...news,
        like_count: result.like_count,
        is_liked: result.is_liked,
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setLiking(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#2f66cc]" />
        </div>
      </AppShell>
    );
  }

  if (!news) {
    return (
      <AppShell>
        <div className="glass rounded-[30px] p-8 text-center">
          <p className="text-lg font-semibold text-[#1c2740]">News not found</p>
          <p className="mt-2 text-sm text-[#6d7c99]">
            The selected news item could not be loaded.
          </p>
          <button
            onClick={() => navigate("/news")}
            className="mt-5 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2f66cc]"
          >
            Back to News
          </button>
        </div>
      </AppShell>
    );
  }

  const imageUrl =
    news.image_url || `https://picsum.photos/seed/news-${news.id}/1200/700`;

  const liked = news.is_liked === 1;

  return (
    <AppShell>
      <div className="glass rounded-[30px] p-5 md:p-7">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/news")}
              className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2f66cc] transition hover:bg-[#e4efff]"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <button
              onClick={handleLike}
              disabled={liking || !user?.mail}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                liked
                  ? "bg-red-50 text-red-500"
                  : "bg-[#edf4ff] text-[#5d6f91]"
              } ${!user?.mail ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {liking ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Heart
                  size={16}
                  className={liked ? "fill-red-500 text-red-500" : ""}
                />
              )}
              {news.like_count}
            </button>
          </div>

          <div className="mb-6 overflow-hidden rounded-[26px]">
            <img
              src={imageUrl}
              alt={news.title}
              className="h-[220px] w-full object-cover sm:h-[280px] md:h-[360px]"
            />
          </div>

          <div className="mx-auto max-w-[820px]">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[#7e91b2]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-3 py-1.5">
                <CalendarDays size={15} />
                <span>{formatDate(news.created_at)}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[#f4f7ff] px-3 py-1.5 text-[#5d6f91]">
                <Heart
                  size={14}
                  className={liked ? "fill-red-500 text-red-500" : ""}
                />
                <span>{news.like_count} likes</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-[#1c2740] sm:text-3xl md:text-[2.2rem]">
              {news.title}
            </h1>

            <div className="mt-6 rounded-[24px] bg-white/55 p-5 md:p-6">
              <div className="whitespace-pre-line text-[15px] leading-8 text-[#5d6f91] md:text-[16px]">
                {news.description}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleLike}
                disabled={liking || !user?.mail}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  liked
                    ? "bg-red-50 text-red-500"
                    : "bg-[#edf4ff] text-[#5d6f91]"
                } ${!user?.mail ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {liking ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Heart
                    size={16}
                    className={liked ? "fill-red-500 text-red-500" : ""}
                  />
                )}
                {liked ? "Liked" : "Like"} • {news.like_count}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}