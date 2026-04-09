import { useMemo, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  FileText,
  Headphones,
  IdCard,
  Mail,
  Newspaper,
  Search,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { quickLinks } from "../../data/quickLinks";

type Props = {
  mode?: "dashboard" | "page";
  className?: string;
};

type DashboardTile = {
  id: string;
  title: string;
  icon: LucideIcon;
  gradient: string;
  href?: string;
  to?: string;
};

const dashboardTiles: DashboardTile[] = [
  {
    id: "webmail",
    title: "Webmail",
    icon: Mail,
    gradient: "from-[#4f91ff] to-[#1f61c8]",
    href: "https://outlook.cloud.microsoft/mail/",
  },
  {
    id: "hris",
    title: "HRIS",
    icon: IdCard,
    gradient: "from-[#719fff] to-[#2a73da]",
    href: "https://mhl.peopleshr.com/",
  },
  {
    id: "group-intranet",
    title: "Group Intranet",
    icon: Users,
    gradient: "from-[#5dafff] to-[#2d7edb]",
    href: "https://intranet.mclarens.lk",
  },
  {
    id: "work-hub",
    title: "Work Hub",
    icon: BriefcaseBusiness,
    gradient: "from-[#7fa7df] to-[#42679a]",
    href: "https://app.workhub24.com",
  },
  {
    id: "stationary-request",
    title: "Stationary Request",
    icon: FileText,
    gradient: "from-[#7cb6ff] to-[#336fcb]",
    href: "https://office.mclarens.lk/",
  },
  {
    id: "it-help-desk",
    title: "IT Help Desk",
    icon: Headphones,
    gradient: "from-[#5d95f0] to-[#244ea8]",
    href: "https://outlook.cloud.microsoft/mail/deeplink/compose?to=helpdesk@mclarens.lk",
  },
  {
    id: "lunch",
    title: "Lunch",
    icon: UtensilsCrossed,
    gradient: "from-[#6eb4ff] to-[#2d72d1]",
    to: "/lunch-orders",
  },
  {
    id: "alerts",
    title: "McAlerts",
    icon: Bell,
    gradient: "from-[#77a7ff] to-[#3569c7]",
    to: "/alerts",
  },
  {
    id: "news",
    title: "News & Events",
    icon: Newspaper,
    gradient: "from-[#89baff] to-[#3f7ad8]",
    to: "/news",
  },
];

export default function QuickAccessGrid({
  mode = "dashboard",
  className = "",
}: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    if (mode === "dashboard") {
      return dashboardTiles;
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return quickLinks;
    }

    return quickLinks.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  }, [mode, search]);

  const handleTileClick = (item: DashboardTile | (typeof quickLinks)[number]) => {
    if ("to" in item && item.to) {
      navigate(item.to);
      return;
    }

    if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section
      className={[
        mode === "dashboard"
          ? "relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(7,24,54,0.22)_0%,rgba(10,31,68,0.1)_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-[12px] sm:p-3.5 xl:h-full xl:p-4"
          : "app-page-surface quick-access-page-surface relative overflow-hidden rounded-[30px] p-4 sm:p-5 md:p-6 lg:h-full lg:min-h-0",
        className,
      ].join(" ")}
    >
      {mode === "page" ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,162,255,0.06),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(215,221,231,0.03),transparent_20%)]" />
      ) : null}

      <div
        className={
          mode === "dashboard"
            ? "relative flex flex-col xl:h-full"
            : "quick-access-page-scroll theme-scrollbar relative flex min-h-0 flex-col lg:h-full lg:overflow-y-auto lg:pr-1.5"
        }
      >
        <div
          className={[
            "mb-2.5 flex flex-col gap-2 md:flex-row md:justify-between xl:mb-4 xl:gap-3",
            mode === "dashboard" ? "md:items-center" : "md:items-end",
          ].join(" ")}
        >
          <div className="max-w-[760px]">
            <h2
              className={[
                "theme-page-title font-bold",
                mode === "dashboard"
                  ? "text-[1.05rem] sm:text-[1.16rem] md:text-[1.34rem] xl:text-[1.56rem]"
                  : "mt-3 text-[1.95rem] md:text-[2.3rem]",
              ].join(" ")}
            >
              {mode === "dashboard" ? "Dashboard" : "Quick Access"}
            </h2>
          </div>
          {mode === "dashboard" ? (
            <button
              onClick={() => navigate("/quick-access")}
              className="theme-button-secondary inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold transition sm:text-xs xl:px-4 xl:py-2"
            >
              View More
            </button>
          ) : mode === "page" ? (
            <div className="theme-input quick-access-page-search flex items-center gap-3 rounded-[22px] px-4 py-3 md:w-[320px] lg:w-[360px]">
              <Search size={18} className="text-[#8fb4ea]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quick access items..."
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </div>
          ) : null}
        </div>

        {mode === "page" && items.length === 0 ? (
          <div className="theme-empty rounded-[24px] p-8 text-center">
            <p className="text-lg font-semibold text-white">No items found</p>
            <p className="mt-2 text-sm">
              Try another keyword to find the tool you need.
            </p>
          </div>
        ) : (
          <div
            className={
              mode === "dashboard"
                ? "grid auto-rows-fr grid-cols-3 content-start gap-2 max-[340px]:grid-cols-2 sm:gap-3 xl:flex-1 xl:gap-[14px]"
                : "quick-access-page-grid grid min-h-0 content-start grid-cols-2 gap-3 pb-2 sm:gap-3.5 sm:pb-3 md:grid-cols-3 xl:grid-cols-4"
            }
          >
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTileClick(item)}
                  className={`relative ${
                    mode === "dashboard"
                      ? "dashboard-quick-access-tile rounded-[20px] flex min-h-[78px] flex-col items-center justify-center gap-1.5 px-1.5 py-2 text-center sm:min-h-[100px] sm:gap-2 sm:px-3 sm:py-3.5 xl:min-h-[112px] xl:gap-3 xl:py-4 2xl:min-h-[118px]"
                      : "app-page-card quick-access-page-card rounded-[24px] border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(12,33,72,0.16)_0%,rgba(15,45,92,0.06)_100%)] backdrop-blur-[10px] flex min-h-[124px] flex-col items-center justify-center gap-3 overflow-hidden px-4 py-4 text-center sm:min-h-[132px] xl:min-h-[140px] 2xl:min-h-[148px]"
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-center text-white ${
                      mode === "dashboard"
                        ? "h-[clamp(1.95rem,4.4vh,2.75rem)] w-[clamp(1.95rem,4.4vh,2.75rem)] sm:h-[clamp(2.5rem,5.8vh,3.8rem)] sm:w-[clamp(2.5rem,5.8vh,3.8rem)]"
                        : "h-[clamp(2rem,3vw,2.8rem)] w-[clamp(2rem,3vw,2.8rem)]"
                    }`}
                  >
                    <Icon
                      className="h-full w-full"
                      strokeWidth={1.9}
                    />
                  </div>

                  <div className="relative w-full">
                    <p className="line-clamp-2 text-[10px] font-semibold leading-3.5 text-white sm:text-[13px] sm:leading-5 xl:text-[15px]">
                      {item.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
