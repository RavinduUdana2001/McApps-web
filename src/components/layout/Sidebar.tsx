import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  House,
  Grid2x2,
  UtensilsCrossed,
  Newspaper,
  Bell,
  UserCircle2,
  X,
  ExternalLink,
} from "lucide-react";

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

const items = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/quick-access", label: "Quick Access", icon: Grid2x2 },
  { to: "/lunch-orders", label: "Lunch Orders", icon: UtensilsCrossed },
  { to: "/news", label: "News & Events", icon: Newspaper },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
];

const IT_HELPDESK_URL = "https://helpdesk.mclarens.lk/";

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const openHelpDesk = () => {
    window.open(IT_HELPDESK_URL, "_blank", "noopener,noreferrer");
    onClose?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#214c9f] to-[#5f8fe6] font-bold text-white shadow-md">
            M
          </div>

          <div>
            <p className="text-xl font-bold text-[#1c2740]">McApps</p>
            <p className="text-sm text-[#6a7898]">Employee Portal</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#5d6f91] transition hover:bg-[#e4efff] lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition",
                  isActive
                    ? "bg-gradient-to-r from-[#2d63c8] to-[#5f8fe6] text-white shadow-md"
                    : "text-[#44516f] hover:bg-white/75 hover:text-[#1c2740]",
                ].join(" ")
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-5">
        <div className="rounded-[24px] bg-white/75 p-4 shadow-sm">
          <p className="text-lg font-semibold text-[#1c2740]">Support</p>
          <p className="mt-1 text-sm text-[#6a7898]">IT Helpdesk available</p>

          <button
            type="button"
            onClick={openHelpDesk}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2d63c8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214c9f]"
          >
            Contact IT
            <ExternalLink size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      <aside className="glass sticky top-0 hidden h-[calc(100vh-2rem)] w-[238px] shrink-0 rounded-[28px] p-5 lg:flex lg:flex-col lg:overflow-hidden">
        <SidebarContent />
      </aside>

      <div
        className={`fixed inset-0 z-[80] lg:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu overlay"
          className={`absolute inset-0 bg-[#0f172a]/35 backdrop-blur-[2px] transition duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`glass absolute left-3 top-3 bottom-3 z-[81] flex w-[min(86vw,320px)] flex-col rounded-[28px] p-5 shadow-[0_25px_80px_rgba(35,64,120,0.18)] transition duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-[110%]"
          }`}
        >
          <SidebarContent onClose={onClose} />
        </aside>
      </div>
    </>
  );
}