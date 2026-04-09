import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import {
  getAlertsSnapshot,
  getCachedAlerts,
  subscribeToAlertComments,
  subscribeToAlertLikes,
  subscribeToAlerts,
  toggleAlertLike,
} from "../services/alertsService";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { getAlertUserIdentity } from "../utils/firebaseUser";
import { formatAlertDate } from "../utils/alertsDate";
import { getOfflineAwareMessage, OFFLINE_MESSAGE } from "../utils/network";
import type { AlertItem, AlertComment } from "../types/alerts";

type CountsMap = Record<
  string,
  {
    likeCount: number;
    iLiked: boolean;
    commentCount: number;
  }
>;

const ALERTS_PAGE_ERROR_MESSAGE =
  "Unable to load alerts right now. Please try again.";

export default function AlertsPage() {
  const navigate = useNavigate();
  const { userId } = getAlertUserIdentity();
  const isOnline = useNetworkStatus();
  const initialAlerts = isOnline ? getCachedAlerts() : [];

  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [loading, setLoading] = useState(initialAlerts.length === 0);
  const [errorText, setErrorText] = useState("");
  const [counts, setCounts] = useState<CountsMap>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const cachedItems = isOnline ? getCachedAlerts() : [];

    if (!isOnline) {
      setAlerts([]);
      setErrorText(OFFLINE_MESSAGE);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    if (cachedItems.length > 0) {
      setAlerts(cachedItems);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const unsubscribe = subscribeToAlerts(
      (items) => {
        if (!active) return;
        setAlerts(items);
        setErrorText("");
        setLoading(false);
      },
      (error) => {
        if (!active) return;
        console.error("Failed to load alerts:", error);
        setAlerts([]);
        setErrorText(
          getOfflineAwareMessage(error, ALERTS_PAGE_ERROR_MESSAGE)
        );
        setLoading(false);
      }
    );

    setErrorText("");

    void getAlertsSnapshot()
      .then((items) => {
        if (!active) return;
        setAlerts(items);
        setErrorText("");
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load alerts:", error);
        setAlerts([]);
        setErrorText(
          getOfflineAwareMessage(error, ALERTS_PAGE_ERROR_MESSAGE)
        );
        setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isOnline, reloadKey]);

  useEffect(() => {
    if (!alerts.length) return;

    const unsubscribers: Array<() => void> = [];

    alerts.forEach((item) => {
      const unsubLikes = subscribeToAlertLikes(
        item.id,
        userId,
        ({ likeCount, iLiked }) => {
          setCounts((prev) => ({
            ...prev,
            [item.id]: {
              likeCount,
              iLiked,
              commentCount: prev[item.id]?.commentCount ?? 0,
            },
          }));
        }
      );

      const unsubComments = subscribeToAlertComments(
        item.id,
        (comments: AlertComment[]) => {
          setCounts((prev) => ({
            ...prev,
            [item.id]: {
              likeCount: prev[item.id]?.likeCount ?? 0,
              iLiked: prev[item.id]?.iLiked ?? false,
              commentCount: comments.length,
            },
          }));
        }
      );

      unsubscribers.push(unsubLikes, unsubComments);
    });

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [alerts, userId]);

  const handleToggleLike = async (messageId: string) => {
    if (!userId) return;

    const current = counts[messageId] || {
      likeCount: 0,
      iLiked: false,
      commentCount: 0,
    };

    try {
      setTogglingId(messageId);
      await toggleAlertLike({
        messageId,
        userId,
        iLiked: current.iLiked,
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AppShell desktopFitScreen>
      <section className="app-page-surface rounded-[30px] p-4 md:p-5 lg:flex lg:h-full lg:flex-col">
        <div className="theme-scrollbar relative lg:h-full lg:overflow-y-auto lg:pr-1.5">
          <div className="mb-4 flex flex-col gap-3 border-b border-white/8 pb-4 lg:mb-3.5 lg:gap-2.5 lg:pb-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#1f61c8_0%,#5ca6ff_100%)] text-white shadow-[0_14px_28px_rgba(18,82,178,0.2)]">
                <BellRing size={20} />
              </div>

              <div className="min-w-0">
                <h1 className="theme-page-title text-[1.45rem] font-bold md:text-[1.7rem]">
                  McAlerts
                </h1>
                <p className="theme-muted mt-1.5 max-w-[640px] text-sm leading-5">
                  Real-time internal notices, reactions, and team comments in one place.
                </p>
              </div>
            </div>
          </div>

          {errorText && alerts.length > 0 ? (
            <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-[rgba(255,173,120,0.2)] bg-[linear-gradient(180deg,rgba(70,34,16,0.48)_0%,rgba(46,21,10,0.42)_100%)] p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,184,120,0.12)] text-[#ffd7b0]">
                  {errorText === OFFLINE_MESSAGE ? (
                    <WifiOff size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {errorText === OFFLINE_MESSAGE
                      ? "No internet connection"
                      : "Alert updates are unavailable"}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#f3d7bf]">
                    {errorText}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReloadKey((prev) => prev + 1)}
                className="theme-button-secondary inline-flex items-center justify-center gap-2 self-start rounded-full px-4 py-2 text-sm font-semibold transition md:self-auto"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          ) : null}

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
                  : "Unable to load alerts"}
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
          ) : alerts.length === 0 ? (
            <div className="theme-empty rounded-[24px] p-6 text-center">
              No alerts available right now.
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((item, index) => {
                const stats = counts[item.id] || {
                  likeCount: 0,
                  iLiked: false,
                  commentCount: 0,
                };

                const processing = togglingId === item.id;

                return (
                  <article
                    key={item.id}
                    onClick={() => navigate(`/alerts/${item.id}`)}
                    className="app-page-card cursor-pointer overflow-hidden rounded-[26px] transition duration-200 hover:border-[rgba(133,177,255,0.18)]"
                  >
                    <div className="flex flex-col gap-3.5 p-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#1f61c8_0%,#5ca6ff_100%)] text-white shadow-[0_12px_24px_rgba(18,82,178,0.16)]">
                          <BellRing size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            {index === 0 ? (
                              <span className="theme-warning rounded-full px-2.5 py-1 text-[11px] font-bold">
                                New
                              </span>
                            ) : null}

                            <span className="text-xs font-medium text-[#8ea9d3]">
                              {formatAlertDate(item.timestamp)}
                            </span>
                          </div>

                          <h3
                            className="cursor-pointer text-[0.98rem] font-semibold leading-6 text-white transition hover:text-[#bdddff] md:text-[1.02rem]"
                          >
                            {item.title}
                          </h3>

                          <p className="mt-1.5 max-w-[900px] text-sm leading-5 text-[#bfd0ec]">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      <div className="grid w-full shrink-0 grid-cols-3 gap-2 pt-1 md:flex md:w-auto md:flex-wrap md:items-center md:justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(item.id);
                          }}
                          disabled={!userId || processing}
                          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition md:w-auto md:px-3 md:py-1.5 ${
                            stats.iLiked
                              ? "border border-[rgba(255,119,147,0.28)] bg-[linear-gradient(135deg,rgba(255,111,145,0.22)_0%,rgba(255,86,106,0.12)_100%)] text-[#ffe7ed] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                              : "theme-button-secondary text-[#ffd7df]"
                          } ${!userId ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          {processing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Heart
                              size={14}
                              className={
                                stats.iLiked
                                  ? "fill-current text-[#ff7d94] drop-shadow-[0_0_8px_rgba(255,125,148,0.28)]"
                                  : "text-[#ff8da0]"
                              }
                            />
                          )}
                          {stats.likeCount}
                        </button>

                        <div className="theme-button-secondary inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold md:w-auto md:px-3 md:py-1.5">
                          <MessageCircle size={14} />
                          {stats.commentCount}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/alerts/${item.id}`);
                          }}
                          className="theme-button-secondary inline-flex w-full items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold transition md:w-auto md:py-1.5"
                        >
                          Open
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
