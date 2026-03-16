import { useEffect, useState } from "react";
import { Heart, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNewsList, toggleNewsLike } from "../../services/newsService";
import { getSession } from "../../utils/session";
import { formatDate } from "../../utils/date";
import type { NewsItem } from "../../types/news";

export default function NewsSection() {
  const navigate = useNavigate();
  const user = getSession();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<number | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);

        const data = await getNewsList(user?.mail || undefined);

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setNews(sorted.slice(0, 3));
      } catch (error) {
        console.error("Failed to load news:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [user?.mail]);

  const handleToggleLike = async (item: NewsItem) => {
    if (!user?.mail) return;

    try {
      setLikingId(item.id);

      const result = await toggleNewsLike(item.id, user.mail);

      setNews((prev) =>
        prev.map((newsItem) =>
          newsItem.id === item.id
            ? {
                ...newsItem,
                is_liked: result.is_liked,
                like_count: result.like_count,
              }
            : newsItem
        )
      );
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setLikingId(null);
    }
  };

  return (
    <section className="glass rounded-[30px] p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#2f66cc]">
            <Sparkles size={14} />
            Fresh Updates
          </div>

          <h2 className="mt-3 text-2xl font-bold text-[#1c2740] md:text-[2rem]">
            News & Events
          </h2>

          <p className="mt-1 text-sm text-[#6d7c99]">
            Latest company highlights and internal stories
          </p>
        </div>

        <button
          onClick={() => navigate("/news")}
          className="rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2f66cc] transition hover:bg-[#e4efff]"
        >
          View More
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <Loader2 className="animate-spin text-[#2f66cc]" size={28} />
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-[24px] bg-white/60 p-6 text-center text-[#6d7c99]">
          No news available right now.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {news.map((item) => {
            const imageUrl =
              item.image_url ||
              `https://picsum.photos/seed/news-${item.id}/900/500`;

            const liked = item.is_liked === 1;
            const isProcessing = likingId === item.id;

            return (
              <article
                key={item.id}
                className="soft-card group overflow-hidden rounded-[24px] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(43,78,150,0.12)]"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={item.title}
                    onClick={() => navigate(`/news/${item.id}`)}
                    className="h-48 w-full cursor-pointer object-cover transition duration-300 group-hover:scale-[1.03]"
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#2f66cc] shadow-sm backdrop-blur-sm">
                      Latest
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs font-medium text-[#8ea0bf]">
                    {formatDate(item.created_at)}
                  </p>

                  <h3
                    onClick={() => navigate(`/news/${item.id}`)}
                    className="mt-2 line-clamp-2 cursor-pointer text-xl font-semibold text-[#1c2740] transition hover:text-[#2f66cc]"
                  >
                    {item.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6d7c99]">
                    {item.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() => navigate(`/news/${item.id}`)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-2 text-sm font-semibold text-[#2f66cc] transition hover:bg-[#e3efff]"
                    >
                      Read more
                    </button>

                    <button
                      onClick={() => handleToggleLike(item)}
                      disabled={isProcessing || !user?.mail}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                        liked
                          ? "bg-red-50 text-red-500"
                          : "bg-[#edf4ff] text-[#5d6f91]"
                      } ${!user?.mail ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {isProcessing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Heart
                          size={16}
                          className={liked ? "fill-red-500 text-red-500" : ""}
                        />
                      )}
                      {item.like_count}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}