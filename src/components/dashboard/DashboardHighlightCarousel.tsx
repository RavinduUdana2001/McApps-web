import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MessageCircle,
  Newspaper,
  ThumbsUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  subscribeToAlertComments,
  subscribeToAlertLikes,
  subscribeToAlerts,
} from "../../services/alertsService";
import { getNewsList, toggleNewsLike } from "../../services/newsService";
import { getSession } from "../../utils/session";
import { getAlertUserIdentity } from "../../utils/firebaseUser";
import { formatAlertDate } from "../../utils/alertsDate";
import { formatDate } from "../../utils/date";
import type { AlertComment, AlertItem } from "../../types/alerts";
import type { NewsItem } from "../../types/news";

type HighlightType = "alerts" | "news";

type Props = {
  type: HighlightType;
};

type AlertCountsMap = Record<
  string,
  {
    likeCount: number;
    iLiked: boolean;
    commentCount: number;
  }
>;

type CarouselFooterProps = {
  activeIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function DashboardHighlightCarousel({ type }: Props) {
  const navigate = useNavigate();
  const user = getSession();
  const userEmail = user?.mail ?? "";
  const { userId } = getAlertUserIdentity();

  const [alertItems, setAlertItems] = useState<AlertItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likingId, setLikingId] = useState<number | null>(null);
  const [alertCounts, setAlertCounts] = useState<AlertCountsMap>({});

  useEffect(() => {
    setActiveIndex(0);
    setLoading(true);
  }, [type]);

  useEffect(() => {
    if (type === "alerts") {
      const unsub = subscribeToAlerts(
        (items) => {
          setAlertItems(items.slice(0, 3));
          setLoading(false);
        },
        (error) => {
          console.error("Failed to load alerts:", error);
          setAlertItems([]);
          setLoading(false);
        }
      );

      return () => unsub();
    }

    let cancelled = false;

    const loadNews = async () => {
      try {
        if (!userEmail) {
          if (!cancelled) {
            setNewsItems([]);
            setLoading(false);
          }
          return;
        }

        const data = await getNewsList(userEmail);

        if (cancelled) return;

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        setNewsItems(sorted.slice(0, 3));
      } catch (error) {
        console.error("Failed to load news:", error);
        if (!cancelled) {
          setNewsItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadNews();

    return () => {
      cancelled = true;
    };
  }, [type, userEmail]);

  useEffect(() => {
    if (type !== "alerts" || alertItems.length === 0) return;

    const unsubscribers: Array<() => void> = [];

    alertItems.forEach((item) => {
      const likes = subscribeToAlertLikes(item.id, userId, (data) => {
        setAlertCounts((prev) => ({
          ...prev,
          [item.id]: {
            likeCount: data.likeCount,
            iLiked: data.iLiked,
            commentCount: prev[item.id]?.commentCount ?? 0,
          },
        }));
      });

      const comments = subscribeToAlertComments(
        item.id,
        (comments: AlertComment[]) => {
          setAlertCounts((prev) => ({
            ...prev,
            [item.id]: {
              likeCount: prev[item.id]?.likeCount ?? 0,
              iLiked: prev[item.id]?.iLiked ?? false,
              commentCount: comments.length,
            },
          }));
        }
      );

      unsubscribers.push(likes, comments);
    });

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [alertItems, type, userId]);

  const items = useMemo(
    () => (type === "alerts" ? alertItems : newsItems),
    [alertItems, newsItems, type]
  );

  useEffect(() => {
    if (items.length === 0) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items.length, activeIndex]);

  const goPrev = () => {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goNext = () => {
    if (items.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handleNewsLike = async (item: NewsItem) => {
    if (!userEmail || likingId === item.id) return;

    try {
      setLikingId(item.id);
      const result = await toggleNewsLike(item.id, userEmail);

      setNewsItems((prev) =>
        prev.map((newsItem) =>
          newsItem.id === item.id
            ? {
                ...newsItem,
                like_count:
                  typeof result?.like_count === "number"
                    ? result.like_count
                    : newsItem.like_count,
                is_liked:
                  typeof result?.is_liked === "number"
                    ? result.is_liked
                    : newsItem.is_liked,
              }
            : newsItem
        )
      );
    } catch (error) {
      console.error("Failed to toggle news like:", error);
    } finally {
      setLikingId(null);
    }
  };

  const title = type === "alerts" ? "McAlerts" : "News & Events";
  const subtitle =
    type === "alerts"
      ? "Important live company notifications"
      : "Latest company highlights";
  const Icon = type === "alerts" ? BellRing : Newspaper;
  const total = items.length;

  if (loading) {
    return (
      <section className="glass flex h-full min-h-[220px] items-center justify-center rounded-[28px] p-4">
        <Loader2 className="animate-spin text-[#2f66cc]" />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="glass flex h-full min-h-[220px] flex-col rounded-[28px] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2f66cc]">
              <Icon size={13} />
              {type === "alerts" ? "Live Notices" : "Fresh Updates"}
            </div>

            <h2 className="mt-3 text-xl font-bold text-[#1c2740]">{title}</h2>
            <p className="text-sm text-[#6d7c99]">{subtitle}</p>
          </div>

          <button
            onClick={() => navigate(type === "alerts" ? "/alerts" : "/news")}
            className="shrink-0 text-sm font-semibold text-[#2f66cc]"
          >
            View More
          </button>
        </div>

        <div className="mt-4 flex flex-1 items-center justify-center rounded-[20px] bg-white/70 text-sm text-[#6d7c99]">
          No items available right now.
        </div>
      </section>
    );
  }

  return (
    <section className="glass flex h-full min-h-0 flex-col rounded-[28px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2f66cc]">
            <Icon size={13} />
            {type === "alerts" ? "Live Notices" : "Fresh Updates"}
          </div>

          <h2 className="mt-3 text-xl font-bold text-[#1c2740]">{title}</h2>
          <p className="text-sm text-[#6d7c99]">{subtitle}</p>
        </div>

        <button
          onClick={() => navigate(type === "alerts" ? "/alerts" : "/news")}
          className="shrink-0 text-sm font-semibold text-[#2f66cc]"
        >
          View More
        </button>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {type === "alerts" ? (
          (() => {
            const item = items[activeIndex] as AlertItem;
            const counts = alertCounts[item.id] ?? {
              likeCount: 0,
              iLiked: false,
              commentCount: 0,
            };

            return (
              <div className="soft-card flex h-full min-h-0 flex-col justify-between rounded-[20px] p-4">
                <button
                  type="button"
                  onClick={() => navigate(`/alerts/${item.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f66cc] text-white">
                      <BellRing size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-[#8ea0bf]">
                          {formatAlertDate(item.timestamp)}
                        </p>

                        {activeIndex === 0 ? (
                          <span className="shrink-0 rounded-full bg-[#fff4db] px-2 py-1 text-[10px] font-semibold text-[#b7791f]">
                            New
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-1 line-clamp-1 font-semibold text-[#1c2740]">
                        {item.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm text-[#6d7c99]">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-[#4f5f7d]">
                      <ThumbsUp size={14} />
                      {counts.likeCount}
                    </span>

                    <span className="flex items-center gap-1 text-sm text-[#4f5f7d]">
                      <MessageCircle size={14} />
                      {counts.commentCount}
                    </span>
                  </div>

                  <CarouselFooter
                    activeIndex={activeIndex}
                    total={total}
                    onPrev={goPrev}
                    onNext={goNext}
                  />
                </div>
              </div>
            );
          })()
        ) : (
          (() => {
            const item = items[activeIndex] as NewsItem;
            const imageUrl =
              item.image_url ||
              `https://picsum.photos/seed/news-${item.id}/900/500`;

            return (
              <div className="soft-card flex h-full min-h-0 flex-col justify-between rounded-[20px] p-3">
                <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="h-[110px] w-[40%] shrink-0 rounded-lg object-cover sm:h-[118px]"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#8ea0bf]">
                      {formatDate(item.created_at)}
                    </p>

                    <h3
                      onClick={() => navigate(`/news/${item.id}`)}
                      className="mt-1 cursor-pointer line-clamp-2 font-semibold text-[#1c2740]"
                    >
                      {item.title}
                    </h3>

                    <p className="mt-1 line-clamp-3 text-sm text-[#6d7c99]">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/news/${item.id}`)}
                    className="text-sm font-semibold text-[#2f66cc]"
                  >
                    Read more
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNewsLike(item)}
                    disabled={!userEmail || likingId === item.id}
                    className="flex items-center gap-1 text-sm text-[#4f5f7d] disabled:opacity-50"
                  >
                    {likingId === item.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Heart
                        size={15}
                        className={
                          item.is_liked === 1
                            ? "fill-current text-red-500"
                            : ""
                        }
                      />
                    )}
                    {item.like_count}
                  </button>

                  <CarouselFooter
                    activeIndex={activeIndex}
                    total={total}
                    onPrev={goPrev}
                    onNext={goNext}
                  />
                </div>
              </div>
            );
          })()
        )}
      </div>
    </section>
  );
}

function CarouselFooter({
  activeIndex,
  total,
  onPrev,
  onNext,
}: CarouselFooterProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#5b6b88] transition hover:bg-[#eef4ff]"
        aria-label="Previous"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === activeIndex ? "w-5 bg-[#2f66cc]" : "w-2 bg-[#ccd9f1]"
          }`}
        />
      ))}

      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#5b6b88] transition hover:bg-[#eef4ff]"
        aria-label="Next"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}