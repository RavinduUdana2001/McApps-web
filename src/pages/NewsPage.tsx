import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Heart,
  Loader2,
  Newspaper,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { getNewsList, toggleNewsLike } from "../services/newsService";
import { getSession } from "../utils/session";
import { formatDate } from "../utils/date";
import {
  getOfflineAwareMessage,
  OFFLINE_MESSAGE,
  withTimeout,
} from "../utils/network";
import type { NewsItem } from "../types/news";

const NEWS_PAGE_ERROR_MESSAGE =
  "Unable to load news right now. Please try again.";

export default function NewsPage() {
  const navigate = useNavigate();
  const user = getSession();
  const isOnline = useNetworkStatus();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<number | null>(null);
  const [errorText, setErrorText] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadNews = async () => {
      try {
        setLoading(true);
        setErrorText("");

        if (!isOnline) {
          throw new Error(OFFLINE_MESSAGE);
        }

        const data = await withTimeout(
          getNewsList(user?.mail || undefined),
          10000,
          OFFLINE_MESSAGE
        );

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        if (!active) return;
        setNews(sorted);
      } catch (error) {
        if (!active) return;
        console.error("Failed to load news:", error);
        setNews([]);
        setErrorText(getOfflineAwareMessage(error, NEWS_PAGE_ERROR_MESSAGE));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadNews();

    return () => {
      active = false;
    };
  }, [isOnline, reloadKey, user?.mail]);

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
    <AppShell desktopFitScreen>
      <section className="app-page-surface rounded-[30px] p-4 md:p-5 lg:flex lg:h-full lg:flex-col">
        <div className="theme-scrollbar relative lg:h-full lg:overflow-y-auto lg:pr-1.5">
          <div className="mb-4 flex flex-col gap-3 border-b border-white/8 pb-4 lg:mb-3.5 lg:gap-2.5 lg:pb-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#1f61c8_0%,#5ca6ff_100%)] text-white shadow-[0_14px_28px_rgba(18,82,178,0.2)]">
                <Newspaper size={20} />
              </div>

              <div className="min-w-0">
                <h1 className="theme-page-title text-[1.45rem] font-bold md:text-[1.7rem]">
                  News & Events
                </h1>
                <p className="theme-muted mt-1.5 max-w-[640px] text-sm leading-5">
                  Company highlights, stories, and event updates from across McLarens Group.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="animate-spin text-[#8dbaff]" size={30} />
            </div>
          ) : errorText ? (
            <div className="rounded-[26px] border border-[rgba(255,173,120,0.2)] bg-[linear-gradient(180deg,rgba(70,34,16,0.48)_0%,rgba(46,21,10,0.42)_100%)] p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(255,184,120,0.12)] text-[#ffd7b0]">
                {errorText === OFFLINE_MESSAGE ? (
                  <WifiOff size={24} />
                ) : (
                  <AlertTriangle size={24} />
                )}
              </div>

              <h2 className="mt-4 text-lg font-semibold text-white">
                {errorText === OFFLINE_MESSAGE
                  ? "No internet connection"
                  : "Unable to load news"}
              </h2>

              <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-[#f3d7bf]">
                {errorText}
              </p>

              <button
                onClick={() => setReloadKey((prev) => prev + 1)}
                className="theme-button-secondary mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          ) : news.length === 0 ? (
            <div className="theme-empty rounded-[24px] p-6 text-center">
              No news available right now.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {news.map((item, index) => {
                const imageUrl =
                  item.image_url ||
                  `https://picsum.photos/seed/news-${item.id}/900/500`;

                const liked = item.is_liked === 1;
                const isProcessing = likingId === item.id;

                return (
                  <article
                    key={item.id}
                    onClick={() => navigate(`/news/${item.id}`)}
                    className="app-page-card flex h-full cursor-pointer flex-col overflow-hidden rounded-[26px] transition duration-200 hover:border-[rgba(133,177,255,0.18)]"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="h-36 w-full cursor-pointer object-cover object-center transition duration-300 hover:scale-[1.02] md:h-32 xl:h-36"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#04122a]/50 via-transparent to-transparent" />
                      {index === 0 ? (
                        <div className="absolute left-4 top-4">
                          <span className="theme-pill rounded-full px-3 py-1 text-xs font-semibold">
                            Featured
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-medium text-[#8ea9d3]">
                          {formatDate(item.created_at)}
                        </p>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(item);
                          }}
                          disabled={isProcessing || !user?.mail}
                          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                            liked
                              ? "border border-[rgba(255,86,106,0.24)] bg-[linear-gradient(135deg,rgba(255,86,106,0.18)_0%,rgba(255,86,106,0.08)_100%)] text-[#ffe6eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                              : "theme-button-secondary"
                          } ${!user?.mail ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          {isProcessing ? (
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
                          {item.like_count}
                        </button>
                      </div>

                      <h3
                        className="mt-2.5 line-clamp-2 cursor-pointer text-[1.02rem] font-semibold leading-6 text-white"
                      >
                        {item.title}
                      </h3>

                      <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-[#bfd0ec]">
                        {item.description}
                      </p>

                      <div className="mt-3 pt-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/news/${item.id}`);
                          }}
                          className="theme-button-secondary rounded-full px-4 py-1.5 text-sm font-semibold transition"
                        >
                          Read more
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
