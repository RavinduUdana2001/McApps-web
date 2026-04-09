import { useEffect, useState } from "react";
import { BellRing, Heart, Loader2, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  subscribeToAlertComments,
  subscribeToAlertLikes,
  subscribeToAlerts,
} from "../../services/alertsService";
import { getAlertUserIdentity } from "../../utils/firebaseUser";
import { formatAlertDate } from "../../utils/alertsDate";
import type { AlertItem, AlertComment } from "../../types/alerts";

type CountsMap = Record<
  string,
  {
    likeCount: number;
    iLiked: boolean;
    commentCount: number;
  }
>;

export default function AlertsSection() {
  const navigate = useNavigate();
  const { userId } = getAlertUserIdentity();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<CountsMap>({});

  useEffect(() => {
    const unsubscribe = subscribeToAlerts(
      (items) => {
        setAlerts(items.slice(0, 3));
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load alerts:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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

  return (
    <section className="glass rounded-[30px] p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-1.5 text-xs font-semibold text-[#2f66cc]">
            <BellRing size={14} />
            Live Notices
          </div>

          <h2 className="mt-3 text-2xl font-bold text-[#1c2740] md:text-[2rem]">
            McAlerts
          </h2>

          <p className="mt-1 text-sm text-[#6d7c99]">
            Important live company notifications
          </p>
        </div>

        <button
          onClick={() => navigate("/alerts")}
          className="rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2f66cc] transition hover:bg-[#e4efff]"
        >
          View More
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <Loader2 className="animate-spin text-[#2f66cc]" size={28} />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-[24px] bg-white/60 p-6 text-center text-[#6d7c99]">
          No alerts available right now.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {alerts.map((item, index) => {
            const stats = counts[item.id] || {
              likeCount: 0,
              iLiked: false,
              commentCount: 0,
            };

            return (
              <article
                key={item.id}
                className="soft-card group rounded-[24px] p-5 transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(43,78,150,0.12)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2f66cc_0%,#5f89da_100%)] text-white shadow-md">
                    <BellRing size={22} />
                  </div>

                  {index === 0 ? (
                    <span className="rounded-full bg-[#fff4db] px-3 py-1 text-xs font-bold text-[#b7791f]">
                      New
                    </span>
                  ) : null}
                </div>

                <p className="text-xs font-medium text-[#8ea0bf]">
                  {formatAlertDate(item.timestamp)}
                </p>

                <h3
                  onClick={() => navigate(`/alerts/${item.id}`)}
                  className="mt-2 line-clamp-2 cursor-pointer text-xl font-semibold text-[#1c2740] transition hover:text-[#2f66cc]"
                >
                  {item.title}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6d7c99]">
                  {item.message}
                </p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigate(`/alerts/${item.id}`)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#eef4ff] px-3 py-2 text-sm font-semibold text-[#2f66cc]"
                  >
                    View details
                  </button>

                  <div className="flex items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold ${
                        stats.iLiked
                          ? "bg-[rgba(255,111,145,0.14)] text-[#ff6f91]"
                          : "bg-[rgba(255,141,160,0.12)] text-[#ff8da0]"
                      }`}
                    >
                      <Heart
                        size={14}
                        className={stats.iLiked ? "fill-current" : ""}
                      />
                      {stats.likeCount}
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full bg-[#edf4ff] px-3 py-2 text-xs font-semibold text-[#5d6f91]">
                      <MessageCircle size={14} />
                      {stats.commentCount}
                    </div>
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
