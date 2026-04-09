import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MessageCircle,
  Newspaper,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAlertsSnapshot,
  getCachedAlerts,
  subscribeToAlertComments,
  subscribeToAlertLikes,
  toggleAlertLike,
} from "../../services/alertsService";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { getNewsList, toggleNewsLike } from "../../services/newsService";
import { getSession } from "../../utils/session";
import { getAlertUserIdentity } from "../../utils/firebaseUser";
import { formatAlertDate } from "../../utils/alertsDate";
import { formatDate } from "../../utils/date";
import { getOfflineAwareMessage, OFFLINE_MESSAGE } from "../../utils/network";
import type { AlertComment, AlertItem } from "../../types/alerts";
import type { NewsItem } from "../../types/news";

type HighlightType = "alerts" | "news";

type Props = {
  type: HighlightType;
  className?: string;
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

const DASHBOARD_REFRESH_MS = 5 * 60 * 1000;
let cachedNewsItems: NewsItem[] = [];
const ALERTS_CARD_ERROR_MESSAGE =
  "Unable to load alerts right now. Please try again.";

export default function DashboardHighlightCarousel({
  type,
  className = "",
}: Props) {
  const navigate = useNavigate();
  const user = getSession();
  const userEmail = user?.mail ?? "";
  const { userId } = getAlertUserIdentity();
  const isOnline = useNetworkStatus();
  const initialAlertItems = getCachedAlerts().slice(0, 3);

  const [alertItems, setAlertItems] = useState<AlertItem[]>(initialAlertItems);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(cachedNewsItems);
  const [loading, setLoading] = useState(
    type === "alerts"
      ? initialAlertItems.length === 0
      : cachedNewsItems.length === 0
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [likingId, setLikingId] = useState<number | null>(null);
  const [alertLikingId, setAlertLikingId] = useState<string | null>(null);
  const [alertCounts, setAlertCounts] = useState<AlertCountsMap>({});
  const [errorText, setErrorText] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [type]);

  useEffect(() => {
    if (type !== "alerts") return;

    setAlertItems(getCachedAlerts().slice(0, 3));
  }, [type]);

  useEffect(() => {
    if (type === "alerts") {
      let cancelled = false;
      const cachedItems = getCachedAlerts().slice(0, 3);

      if (cachedItems.length > 0) {
        setAlertItems(cachedItems);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const loadAlerts = async ({ silent = false }: { silent?: boolean } = {}) => {
        try {
          if (!silent && cachedItems.length === 0) {
            setLoading(true);
          }

          const items = await getAlertsSnapshot();

          if (cancelled) return;

          const topItems = items.slice(0, 3);
          setAlertItems(topItems);
          setErrorText("");
        } catch (error) {
          console.error("Failed to load alerts:", error);

          if (!cancelled) {
            setErrorText(
              getOfflineAwareMessage(error, ALERTS_CARD_ERROR_MESSAGE)
            );
          }

          if (!cancelled && !silent && cachedItems.length === 0) {
            setAlertItems([]);
          }
        } finally {
          if (!cancelled && !silent) {
            setLoading(false);
          }
        }
      };

      if (!isOnline && cachedItems.length === 0) {
        setErrorText(OFFLINE_MESSAGE);
        setLoading(false);
      } else {
        if (isOnline) {
          setErrorText("");
        }

        void loadAlerts({
          silent: cachedItems.length > 0 && reloadKey === 0,
        });
      }

      const interval = isOnline
        ? window.setInterval(() => {
            void loadAlerts({ silent: true });
          }, DASHBOARD_REFRESH_MS)
        : null;

      return () => {
        cancelled = true;
        if (interval !== null) {
          window.clearInterval(interval);
        }
      };
    }

    let cancelled = false;

    const loadNews = async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        if (!silent && cachedNewsItems.length === 0) {
          setLoading(true);
        }

        if (!userEmail) {
          if (!cancelled) {
            cachedNewsItems = [];
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

        const topItems = sorted.slice(0, 3);
        cachedNewsItems = topItems;
        setNewsItems(topItems);
      } catch (error) {
        console.error("Failed to load news:", error);
        if (!cancelled && !silent) {
          cachedNewsItems = [];
          setNewsItems([]);
        }
      } finally {
        if (!cancelled && !silent) {
          setLoading(false);
        }
      }
    };

    void loadNews({ silent: cachedNewsItems.length > 0 });

    return () => {
      cancelled = true;
    };
  }, [type, userEmail, isOnline, reloadKey]);

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

  const handleAlertLike = async (item: AlertItem) => {
    if (!userId || alertLikingId === item.id) return;

    const current = alertCounts[item.id] ?? {
      likeCount: 0,
      iLiked: false,
      commentCount: 0,
    };

    try {
      setAlertLikingId(item.id);
      await toggleAlertLike({
        messageId: item.id,
        userId,
        iLiked: current.iLiked,
      });
    } catch (error) {
      console.error("Failed to toggle alert like:", error);
    } finally {
      setAlertLikingId(null);
    }
  };

  const title = type === "alerts" ? "McAlerts" : "News & Events";
  const Icon = type === "alerts" ? BellRing : Newspaper;
  const total = items.length;
  const shellClass =
    `dashboard-highlight-shell flex min-h-[228px] flex-col rounded-[28px] border border-[rgba(133,177,255,0.18)] bg-[linear-gradient(180deg,rgba(7,24,54,0.22)_0%,rgba(9,31,69,0.12)_100%)] p-2.5 backdrop-blur-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:min-h-[250px] sm:p-3 xl:h-full xl:min-h-0 xl:p-[0.95rem] 2xl:p-4 ${className}`;
  const loadingShellClass =
    `dashboard-highlight-shell flex min-h-[228px] items-center justify-center rounded-[28px] border border-[rgba(133,177,255,0.18)] bg-[linear-gradient(180deg,rgba(7,24,54,0.22)_0%,rgba(9,31,69,0.12)_100%)] p-2.5 backdrop-blur-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:min-h-[250px] sm:p-3 xl:h-full xl:min-h-[220px] xl:p-[0.95rem] 2xl:p-4 ${className}`;
  const emptyShellClass =
    `dashboard-highlight-shell flex min-h-[228px] flex-col rounded-[28px] border border-[rgba(133,177,255,0.18)] bg-[linear-gradient(180deg,rgba(7,24,54,0.22)_0%,rgba(9,31,69,0.12)_100%)] p-2.5 backdrop-blur-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:min-h-[250px] sm:p-3 xl:h-full xl:min-h-[220px] xl:p-[0.95rem] 2xl:p-4 ${className}`;

  if (loading) {
    return (
      <section className={loadingShellClass}>
        <Loader2 className="animate-spin text-[#8dbaff]" />
      </section>
    );
  }

  if (type === "alerts" && errorText && items.length === 0) {
    return (
      <section className={emptyShellClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="theme-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <BellRing size={13} />
              Live Notices
            </div>

            <h2 className="theme-page-title mt-2 text-lg font-bold">{title}</h2>
          </div>

          <button
            onClick={() => navigate("/alerts")}
            className="theme-button-secondary shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition sm:text-sm"
          >
            View More
          </button>
        </div>

        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-[24px] border border-[rgba(255,173,120,0.2)] bg-[linear-gradient(180deg,rgba(70,34,16,0.48)_0%,rgba(46,21,10,0.42)_100%)] px-4 py-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(255,184,120,0.12)] text-[#ffd7b0]">
            {errorText === OFFLINE_MESSAGE ? (
              <WifiOff size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>

          <p className="mt-3 text-sm font-semibold text-white">
            {errorText === OFFLINE_MESSAGE
              ? "No internet connection"
              : "Unable to load alerts"}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#f3d7bf]">
            {errorText}
          </p>

          <button
            type="button"
            onClick={() => setReloadKey((prev) => prev + 1)}
            className="theme-button-secondary mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={emptyShellClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="theme-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <Icon size={13} />
              {type === "alerts" ? "Live Notices" : "Fresh Updates"}
            </div>

            <h2 className="theme-page-title mt-2 text-lg font-bold">{title}</h2>
          </div>

          <button
            onClick={() => navigate(type === "alerts" ? "/alerts" : "/news")}
            className="theme-button-secondary shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition sm:text-sm"
          >
            View More
          </button>
        </div>

        <div className="theme-empty mt-4 flex flex-1 items-center justify-center rounded-[24px] px-4 text-center text-sm">
          No items available right now.
        </div>
      </section>
    );
  }

  return (
    <section className={shellClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="theme-page-title inline-flex items-center gap-2 text-[0.98rem] font-bold sm:text-[1.03rem] xl:text-[1.05rem] 2xl:text-lg">
            <Icon size={16} className="text-[#9fc5ff]" />
            {title}
          </h2>
        </div>

        <button
          onClick={() => navigate(type === "alerts" ? "/alerts" : "/news")}
          className="theme-button-secondary shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold transition sm:text-[11px] xl:px-3.5 2xl:px-4"
        >
          View More
        </button>
      </div>

      <div className="dashboard-highlight-body mt-3 flex min-h-[154px] flex-1 flex-col sm:mt-3.5 sm:min-h-[174px] xl:mt-4 xl:min-h-0">
        {type === "alerts" ? (
          (() => {
            const item = items[activeIndex] as AlertItem;
            const counts = alertCounts[item.id] ?? {
              likeCount: 0,
              iLiked: false,
              commentCount: 0,
            };

            return (
              <div className="dashboard-highlight-alert-main flex min-h-[154px] flex-1 flex-col justify-between p-0.5 sm:min-h-[174px] xl:h-full xl:min-h-0">
                <button
                  type="button"
                  onClick={() => navigate(`/alerts/${item.id}`)}
                  className="flex min-h-0 flex-1 text-left"
                >
                  <div className="flex w-full items-start gap-2.5 overflow-hidden sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1f61c8_0%,#5ca6ff_100%)] text-white shadow-[0_14px_26px_rgba(18,82,178,0.3)] sm:h-9 sm:w-9 xl:h-10 xl:w-10">
                      <BellRing size={16} />
                    </div>

                    <div className="dashboard-highlight-copy min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-[#8ea9d3]">
                          {formatAlertDate(item.timestamp)}
                        </p>

                        {activeIndex === 0 ? (
                          <span className="theme-warning shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold">
                            New
                          </span>
                        ) : null}
                      </div>

                      <h3 className="dashboard-highlight-alert-title text-[13px] font-semibold text-white sm:text-[14px] xl:text-[15px] 2xl:text-base">
                        {item.title}
                      </h3>

                      <p className="dashboard-highlight-alert-message text-[11.5px] leading-[1.1rem] text-[#bfd0ec] sm:text-[12.5px] sm:leading-[1.18rem] xl:text-[13px] xl:leading-5 2xl:text-sm">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="mt-2 shrink-0 flex flex-col gap-2 border-t border-white/8 pt-2 sm:mt-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:pt-2.5">
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleAlertLike(item)}
                      disabled={!userId || alertLikingId === item.id}
                      className={`flex w-full items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-semibold transition disabled:opacity-50 sm:w-auto sm:px-2.5 sm:py-1 sm:text-[11px] ${
                        counts.iLiked
                          ? "border border-[rgba(255,119,147,0.28)] bg-[linear-gradient(135deg,rgba(255,111,145,0.22)_0%,rgba(255,86,106,0.12)_100%)] text-[#ffe7ed] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "theme-button-secondary text-[#ffd7df]"
                      }`}
                    >
                      {alertLikingId === item.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Heart
                          size={12}
                          className={
                            counts.iLiked
                              ? "fill-current text-[#ff7d94] drop-shadow-[0_0_8px_rgba(255,125,148,0.28)]"
                              : "text-[#ff8da0]"
                          }
                        />
                      )}
                      {counts.likeCount}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/alerts/${item.id}`)}
                      className="theme-button-secondary flex w-full items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[10px] font-semibold transition sm:w-auto sm:px-2.5 sm:py-1 sm:text-[11px]"
                    >
                      <MessageCircle size={12} />
                      {counts.commentCount}
                    </button>
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
              <div className="dashboard-highlight-card flex min-h-[168px] flex-1 flex-col overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(12,33,72,0.18)_0%,rgba(15,45,92,0.08)_100%)] backdrop-blur-[10px] sm:min-h-[188px] xl:h-full xl:min-h-0">
                <div className="relative h-[clamp(102px,13.5vh,156px)] shrink-0 overflow-hidden bg-[linear-gradient(180deg,rgba(8,24,53,0.42)_0%,rgba(10,29,63,0.3)_100%)] 2xl:h-[clamp(112px,15vh,176px)]">
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover object-[center_32%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#04122a]/56 via-transparent to-transparent" />
                </div>

                <div className="dashboard-highlight-news-main flex min-h-0 flex-1 flex-col px-3 py-2.5 sm:px-3.5 xl:px-4 xl:py-3">
                  <div className="dashboard-highlight-copy min-h-0 flex-1 overflow-hidden">
                    <p className="text-xs text-[#8ea9d3]">
                      {formatDate(item.created_at)}
                    </p>

                    <h3
                      onClick={() => navigate(`/news/${item.id}`)}
                      className="dashboard-highlight-news-title cursor-pointer text-[13px] font-semibold text-white sm:text-[14px] xl:text-[15px] 2xl:text-base"
                    >
                      {item.title}
                    </h3>

                    {item.description ? (
                      <p className="dashboard-highlight-news-description text-[12px] leading-4.5 text-[#bfd0ec] 2xl:text-[13px] 2xl:leading-5">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-2 shrink-0 flex flex-wrap items-center justify-between gap-1.5 border-t border-white/8 pt-2 sm:mt-2.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/news/${item.id}`)}
                      className="theme-button-secondary rounded-full px-2.5 py-1 text-[10px] font-semibold transition sm:px-3 sm:text-[11px]"
                    >
                      Read more
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNewsLike(item)}
                      disabled={!userEmail || likingId === item.id}
                      className="theme-button-secondary flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold disabled:opacity-50 sm:px-2.5 sm:text-[11px]"
                    >
                      {likingId === item.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Heart
                          size={12}
                          className={
                            item.is_liked === 1
                              ? "fill-current text-[#ff8da0]"
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
    <div className="flex items-center gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onPrev}
        className="theme-button-secondary inline-flex h-6 w-6 items-center justify-center rounded-full transition sm:h-7 sm:w-7"
        aria-label="Previous"
      >
        <ChevronLeft size={12} />
      </button>

      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all sm:h-2 ${
            i === activeIndex ? "w-4 bg-[#74b0ff] sm:w-6" : "w-1.5 bg-white/22 sm:w-2"
          }`}
        />
      ))}

      <button
        type="button"
        onClick={onNext}
        className="theme-button-secondary inline-flex h-6 w-6 items-center justify-center rounded-full transition sm:h-7 sm:w-7"
        aria-label="Next"
      >
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
