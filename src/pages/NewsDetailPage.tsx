import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, CalendarDays, Newspaper } from "lucide-react";
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
      <AppShell desktopFitScreen>
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#8dbaff]" />
        </div>
      </AppShell>
    );
  }

  if (!news) {
    return (
      <AppShell desktopFitScreen>
        <div className="app-page-surface rounded-[30px] p-8 text-center">
          <p className="text-lg font-semibold text-white">News not found</p>
          <p className="theme-muted mt-2 text-sm">
            The selected news item could not be loaded.
          </p>
          <button
            onClick={() => navigate("/news")}
            className="theme-button-secondary mt-5 rounded-full px-4 py-2 text-sm font-semibold transition"
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
    <AppShell desktopFitScreen>
      <section className="app-page-surface rounded-[30px] p-5 md:p-6 lg:flex lg:h-full lg:flex-col">
        <div className="theme-scrollbar lg:h-full lg:overflow-y-auto lg:pr-1.5">
          <div className="w-full">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
              <button
                onClick={() => navigate("/news")}
                className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                onClick={handleLike}
                disabled={liking || !user?.mail}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  liked
                    ? "border border-[rgba(255,86,106,0.24)] bg-[linear-gradient(135deg,rgba(255,86,106,0.18)_0%,rgba(255,86,106,0.08)_100%)] text-[#ffe6eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "theme-button-secondary"
                } ${!user?.mail ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {liking ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Heart
                    size={16}
                    className={
                      liked
                        ? "fill-current text-[#ff566a] drop-shadow-[0_0_10px_rgba(255,86,106,0.24)]"
                        : ""
                    }
                  />
                )}
                {news.like_count}
              </button>
            </div>

            <div className="app-page-card overflow-hidden rounded-[28px]">
              <div className="relative overflow-hidden border-b border-white/8">
                <img
                  src={imageUrl}
                  alt={news.title}
                  className="h-[240px] w-full object-cover object-center sm:h-[320px] md:h-[420px] lg:h-[460px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04122a]/82 via-[#04122a]/12 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="theme-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5">
                      <Newspaper size={15} />
                      <span>Company Update</span>
                    </div>

                    <div className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-1.5">
                      <CalendarDays size={15} />
                      <span>{formatDate(news.created_at)}</span>
                    </div>

                    <div className="rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(4,18,42,0.48)] px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-[10px]">
                      {news.like_count} likes
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-5 md:px-6 md:py-6">
                <h1 className="theme-page-title text-[1.8rem] font-bold leading-tight sm:text-[2.1rem] md:text-[2.5rem]">
                  {news.title}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleLike}
                    disabled={liking || !user?.mail}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      liked
                        ? "border border-[rgba(255,86,106,0.24)] bg-[linear-gradient(135deg,rgba(255,86,106,0.18)_0%,rgba(255,86,106,0.08)_100%)] text-[#ffe6eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        : "theme-button-secondary"
                    } ${!user?.mail ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {liking ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                      <Heart
                        size={16}
                        className={
                          liked
                            ? "fill-current text-[#ff566a] drop-shadow-[0_0_10px_rgba(255,86,106,0.24)]"
                          : ""
                        }
                      />
                    )}
                    {liked ? "Liked" : "Like"}
                  </button>
                </div>

                <div className="app-page-soft-panel mt-5 rounded-[24px] p-4 md:p-5">
                  <div className="whitespace-pre-line text-[15px] leading-7 text-[#d2def3] md:text-[16px] md:leading-8">
                    {news.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
