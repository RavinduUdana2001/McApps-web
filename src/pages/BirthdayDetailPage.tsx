import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Cake, CalendarDays, Heart, Loader2 } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { getBirthdayList, toggleBirthdayLike } from "../services/birthdayService";
import { getSession } from "../utils/session";
import { formatDate } from "../utils/date";
import type { BirthdayItem } from "../types/birthday";

function getLocalDateKey(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function BirthdayDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getSession();

  const [allBirthdays, setAllBirthdays] = useState<BirthdayItem[]>([]);
  const [birthday, setBirthday] = useState<BirthdayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const loadBirthdays = async () => {
      try {
        setLoading(true);

        const data = await getBirthdayList(user?.mail || undefined);

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setAllBirthdays(sorted);

        const matchedItem =
          sorted.find((item) => String(item.id) === String(id)) || null;

        setBirthday(matchedItem);
      } catch (error) {
        console.error("Failed to load birthday detail:", error);
        setBirthday(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBirthdays();
    } else {
      setLoading(false);
      setBirthday(null);
    }
  }, [id, user?.mail]);

  const relatedBirthdays = useMemo(() => {
    if (!birthday) return [];

    const birthdayDateKey = getLocalDateKey(birthday.created_at);

    return allBirthdays
      .filter(
        (item) =>
          getLocalDateKey(item.created_at) === birthdayDateKey &&
          item.id !== birthday.id
      )
      .slice(0, 6);
  }, [allBirthdays, birthday]);

  const handleLike = async () => {
    if (!birthday || !user?.mail) return;

    try {
      setLiking(true);

      const result = await toggleBirthdayLike(Number(birthday.id), user.mail);

      setBirthday({
        ...birthday,
        like_count: result.like_count,
        is_liked: result.is_liked,
      });

      setAllBirthdays((prev) =>
        prev.map((item) =>
          item.id === birthday.id
            ? {
                ...item,
                like_count: result.like_count,
                is_liked: result.is_liked,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Failed to toggle birthday like:", error);
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

  if (!birthday) {
    return (
      <AppShell>
        <div className="glass rounded-[30px] p-8 text-center">
          <p className="text-lg font-semibold text-[#1c2740]">
            Birthday post not found
          </p>
          <p className="mt-2 text-sm text-[#6d7c99]">
            The selected birthday item could not be loaded.
          </p>
          <button
            onClick={() => navigate("/birthdays")}
            className="mt-5 rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2f66cc]"
          >
            Back to Birthdays
          </button>
        </div>
      </AppShell>
    );
  }

  const liked = birthday.is_liked === 1;

  return (
    <AppShell>
      <div className="glass rounded-[30px] p-5 md:p-7">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/birthdays")}
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
              {birthday.like_count}
            </button>
          </div>

          <div className="mb-6 overflow-hidden rounded-[26px]">
            {birthday.image_url ? (
              <img
                src={birthday.image_url}
                alt={birthday.title}
                className="h-[220px] w-full object-cover sm:h-[280px] md:h-[360px]"
              />
            ) : (
              <div className="flex h-[220px] w-full items-center justify-center bg-[linear-gradient(135deg,#fff0d9_0%,#fff7ea_100%)] text-[#d8891d] sm:h-[280px] md:h-[360px]">
                <Cake size={64} />
              </div>
            )}
          </div>

          <div className="mx-auto max-w-[820px]">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[#7e91b2]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-3 py-1.5">
                <CalendarDays size={15} />
                <span>{formatDate(birthday.created_at)}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4e6] px-3 py-1.5 text-[#c97d12]">
                <Cake size={14} />
                <span>Birthday celebration</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[#f4f7ff] px-3 py-1.5 text-[#5d6f91]">
                <Heart
                  size={14}
                  className={liked ? "fill-red-500 text-red-500" : ""}
                />
                <span>{birthday.like_count} likes</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-[#1c2740] sm:text-3xl md:text-[2.2rem]">
              {birthday.title}
            </h1>

            <div className="mt-6 rounded-[24px] bg-white/55 p-5 md:p-6">
              <div className="whitespace-pre-line text-[15px] leading-8 text-[#5d6f91] md:text-[16px]">
                {birthday.description}
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
                {liked ? "Liked" : "Like"} • {birthday.like_count}
              </button>
            </div>

            {relatedBirthdays.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-[#1c2740]">
                  Other birthdays on this date
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {relatedBirthdays.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/birthdays/${item.id}`)}
                      className="rounded-[22px] bg-white/65 p-4 text-left transition hover:bg-white"
                    >
                      <p className="line-clamp-1 font-semibold text-[#1c2740]">
                        {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6d7c99]">
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}