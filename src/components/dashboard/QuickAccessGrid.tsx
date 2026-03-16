import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { quickLinks } from "../../data/quickLinks";

type Props = {
  mode?: "dashboard" | "page";
};

export default function QuickAccessGrid({ mode = "dashboard" }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    if (mode === "dashboard") {
      return quickLinks.slice(0, 8);
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return quickLinks;
    }

    return quickLinks.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
  }, [mode, search]);

  const handleOpen = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      className={[
        "glass rounded-[30px]",
        mode === "dashboard" ? "h-full p-4 md:p-5" : "p-5 md:p-6",
      ].join(" ")}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2
            className={
              mode === "dashboard"
                ? "text-xl font-bold text-[#1c2740] xl:text-[1.8rem]"
                : "text-2xl font-bold text-[#1c2740] md:text-[2rem]"
            }
          >
            Quick Access
          </h2>
          <p className="mt-1 text-sm text-[#6d7c99]">
            Open frequently used internal tools quickly
          </p>
        </div>

        {mode === "dashboard" ? (
          <button
            onClick={() => navigate("/quick-access")}
            className="rounded-full bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#2d63c8] transition hover:bg-[#e4efff]"
          >
            View More
          </button>
        ) : null}
      </div>

      {mode === "page" ? (
        <div className="mb-5">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
            <Search size={18} className="text-[#7c8ba8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quick access items..."
              className="w-full bg-transparent text-sm text-[#1c2740] outline-none placeholder:text-[#94a0b7]"
            />
          </div>
        </div>
      ) : null}

      {mode === "page" && items.length === 0 ? (
        <div className="rounded-[24px] bg-white/70 p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-[#1c2740]">No items found</p>
          <p className="mt-2 text-sm text-[#7583a2]">
            Try searching with another name.
          </p>
        </div>
      ) : (
        <div
          className={
            mode === "dashboard"
              ? "grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
              : "grid grid-cols-2 gap-4 lg:grid-cols-4"
          }
        >
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleOpen(item.href)}
                className={`group rounded-[24px] bg-white/80 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-xl ${
                  mode === "dashboard"
                    ? "flex h-[132px] flex-col items-center justify-center p-3 text-center xl:h-[138px]"
                    : "flex h-[150px] flex-col items-center justify-center p-4 text-center"
                }`}
              >
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-md`}
                >
                  <Icon size={22} />
                </div>

                <p className="line-clamp-2 text-center text-sm font-semibold text-[#1c2740] sm:text-base">
                  {item.title}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}