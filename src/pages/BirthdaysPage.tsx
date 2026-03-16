import { useEffect, useMemo, useState } from "react";
import { Cake, Heart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

export default function BirthdaysPage() {
  const navigate = useNavigate();
  const user = getSession();

  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<number | null>(null);

  useEffect(() => {
    const loadBirthdays = async () => {
      try {
        setLoading(true);

        const data = await getBirthdayList(user?.mail || undefined);

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setBirthdays(sorted);
      } catch (error) {
        console.error("Failed to load birthdays:", error);
        setBirthdays([]);
      } finally {
        setLoading(false);
      }
    };

    loadBirthdays();
  }, [user?.mail]);

  const filteredBirthdays = useMemo(() => {
    const todayKey = getLocalDateKey(new Date());

    const todayItems = birthdays.filter(
      (item) => getLocalDateKey(item.created_at) === todayKey
    );

    if (todayItems.length > 0) {
      return todayItems;
    }

    return birthdays.slice(0, 12);
  }, [birthdays]);

  const handleToggleLike = async (item: BirthdayItem) => {
    if (!user?.mail) return;

    try {
      setLikingId(item.id);

      const result = await toggleBirthdayLike(item.id, user.mail);

      setBirthdays((prev) =>
        prev.map((birthday) =>
          birthday.id === item.id
            ? {
                ...birthday,
                is_liked: result.is_liked,
                like_count: result.like_count,
              }
            : birthday
        )
      );
    } catch (error) {
      console.error("Failed to toggle birthday like:", error);
    } finally {
      setLikingId(null);
    }
  };

  return (
    <AppShell>
      <div className="glass rounded-[30px] p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1c2740]">Birthdays</h1>
          <p className="mt-2 text-[#6d7c99]">
            {filteredBirthdays.length > 0
              ? "Birthday celebrations relevant to today."
              : "No birthday posts available right now."}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="animate-spin text-[#2f66cc]" size={30} />
          </div>
        ) : filteredBirthdays.length === 0 ? (
          <div className="rounded-[24px] bg-white/60 p-6 text-center text-[#6d7c99]">
            No birthday posts available right now.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredBirthdays.map((item) => {
              const liked = item.is_liked === 1;
              const isProcessing = likingId === item.id;

              return (
                <article
                  key={item.id}
                  className="soft-card overflow-hidden rounded-[24px]"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/birthdays/${item.id}`)}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center bg-[linear-gradient(135deg,#fff0d9_0%,#fff7ea_100%)] text-[#d8891d]">
                        <Cake size={42} />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-medium text-[#8ea0bf]">
                      {formatDate(item.created_at)}
                    </p>

                    <h3
                      onClick={() => navigate(`/birthdays/${item.id}`)}
                      className="mt-2 line-clamp-2 cursor-pointer text-xl font-semibold text-[#1c2740]"
                    >
                      {item.title}
                    </h3>

                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#6d7c99]">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        onClick={() => navigate(`/birthdays/${item.id}`)}
                        className="text-sm font-semibold text-[#2f66cc]"
                      >
                        View details
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
      </div>
    </AppShell>
  );
}