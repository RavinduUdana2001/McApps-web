import { useEffect, useMemo, useState } from "react";
import { Cake, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../common/GlassCard";
import LunchStatusCard from "./LunchStatusCard";
import { getBirthdayList } from "../../services/birthdayService";
import { getSession } from "../../utils/session";
import { formatDate } from "../../utils/date";
import type { BirthdayItem } from "../../types/birthday";

function getLocalDateParts(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (Number.isNaN(date.getTime())) {
    return { month: -1, day: -1 };
  }

  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function isSameMonthDay(dateInput: string | Date, compareDate: Date) {
  const a = getLocalDateParts(dateInput);
  const b = getLocalDateParts(compareDate);

  return a.month === b.month && a.day === b.day;
}

export default function RightColumn() {
  const navigate = useNavigate();
  const user = getSession();

  const [birthdayPosts, setBirthdayPosts] = useState<BirthdayItem[]>([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(true);

  useEffect(() => {
    const loadBirthdays = async () => {
      try {
        setLoadingBirthdays(true);

        const data = await getBirthdayList(user?.mail || undefined);

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setBirthdayPosts(sorted);
      } catch (error) {
        console.error("Failed to load birthdays:", error);
        setBirthdayPosts([]);
      } finally {
        setLoadingBirthdays(false);
      }
    };

    loadBirthdays();
  }, [user?.mail]);

  const todayBirthdays = useMemo(() => {
    const today = new Date();

    return birthdayPosts.filter((item) => isSameMonthDay(item.created_at, today));
  }, [birthdayPosts]);

  const mainBirthday = todayBirthdays[0] || null;

  const summaryText = useMemo(() => {
    if (todayBirthdays.length === 0) return "No birthdays today";
    if (todayBirthdays.length === 1) return "1 birthday celebration today";
    return `${todayBirthdays.length} birthday celebrations today`;
  }, [todayBirthdays]);

  const handleCardClick = () => {
    if (!mainBirthday) return;
    navigate(`/birthdays/${mainBirthday.id}`);
  };

  return (
    <aside className="space-y-5">
      <LunchStatusCard />

      <GlassCard className="p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#1c2740]">Birthdays</h3>

          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fff0d7_0%,#fff8ea_100%)] text-[#db8b1f] shadow-sm">
            <Cake size={20} />
          </div>
        </div>

        {loadingBirthdays ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Loader2 className="animate-spin text-[#2f66cc]" size={24} />
          </div>
        ) : !mainBirthday ? (
          <div className="rounded-[24px] bg-white/75 p-5 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fff0d7_0%,#fff8ea_100%)] text-[#db8b1f]">
              <Cake size={24} />
            </div>
            <p className="mt-4 text-base font-semibold text-[#1c2740]">
              No birthdays today
            </p>
            <p className="mt-1 text-sm text-[#7583a2]">
              Birthday posts for today will appear here.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCardClick}
            className="w-full rounded-[24px] bg-white/75 p-4 text-left shadow-sm transition hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9aa7bf]">
                  Today
                </p>

                <h4 className="mt-2 text-lg font-bold leading-7 text-[#1c2740]">
                  {summaryText}
                </h4>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#7583a2]">
                  {mainBirthday.description}
                </p>

                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#edf4ff] px-3 py-1.5 text-xs font-semibold text-[#2f66cc]">
                  <span>{formatDate(mainBirthday.created_at)}</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              {mainBirthday.image_url ? (
                <img
                  src={mainBirthday.image_url}
                  alt={mainBirthday.title}
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fff0d7_0%,#fff8ea_100%)] text-[#db8b1f]">
                  <Cake size={24} />
                </div>
              )}
            </div>
          </button>
        )}
      </GlassCard>
    </aside>
  );
}