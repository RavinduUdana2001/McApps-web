import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  House,
  Grid2x2,
  UtensilsCrossed,
  Newspaper,
  Bell,
  LogOut,
  UserCircle2,
  X,
} from "lucide-react";
import logo from "../../assets/new1.png";
import { clearSession } from "../../utils/session";

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
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const navItemClass = (isActive = false) =>
    [
      "sidebar-nav-item group flex w-full items-center rounded-[20px] font-medium transition active:scale-[0.99]",
      isActive
        ? "bg-[linear-gradient(135deg,rgba(31,97,200,0.96)_0%,rgba(92,166,255,0.94)_100%)] text-white shadow-[0_14px_28px_rgba(19,72,153,0.24)]"
        : "text-[#c7d7f4] hover:bg-white/8 hover:text-white",
    ].join(" ");

  const navIconClass =
    "sidebar-nav-icon inline-flex items-center justify-center rounded-2xl bg-white/8 text-inherit transition group-hover:bg-white/10";

  const handleProfileClick = () => {
    onClose?.();
    navigate("/profile");
  };

  useEffect(() => {
    if (!logoutConfirmOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [logoutConfirmOpen]);

  const handleLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
    onClose?.();
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="sidebar-content flex h-full flex-col">
        <div className="sidebar-logo-block relative flex justify-center">
          <div className="sidebar-logo flex items-center justify-center p-1.5">
            <img src={logo} alt="McApps Logo" className="h-full w-full object-contain" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="theme-button-secondary absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-xl transition lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav flex-1">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                onClick={() => onClose?.()}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <span className={navIconClass}>
                  <Icon className="sidebar-nav-glyph" strokeWidth={1.9} />
                </span>
                <span className="sidebar-nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer border-t border-white/10">
          <div className="sidebar-footer-actions">
            <button
              type="button"
              onClick={handleProfileClick}
              className={navItemClass(false)}
            >
              <span className={navIconClass}>
                <UserCircle2 className="sidebar-nav-glyph" strokeWidth={1.9} />
              </span>
              <span className="sidebar-nav-label">Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className={navItemClass(false)}
            >
              <span className={navIconClass}>
                <LogOut className="sidebar-nav-glyph" strokeWidth={1.9} />
              </span>
              <span className="sidebar-nav-label">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {logoutConfirmOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Close logout modal overlay"
                onClick={() => setLogoutConfirmOpen(false)}
                className="absolute inset-0 bg-[#020916]/76 backdrop-blur-[7px]"
              />

              <div className="glass relative z-[141] w-full max-w-[420px] overflow-hidden rounded-[28px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(255,205,96,0.18)] text-[#ffd27d] shadow-sm">
                    <AlertTriangle size={24} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setLogoutConfirmOpen(false)}
                    className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-xl transition"
                    aria-label="Close logout confirmation"
                  >
                    <X size={18} />
                  </button>
                </div>

                <h3 className="mt-5 text-2xl font-bold text-white">
                  Are you sure you want to log out?
                </h3>

                <p className="theme-muted mt-3 text-sm leading-7">
                  You will be signed out of McApps and need to log in again to continue.
                </p>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setLogoutConfirmOpen(false)}
                    className="theme-button-secondary rounded-full px-5 py-2.5 text-sm font-semibold transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleLogoutConfirm}
                    className="theme-button-primary rounded-full px-5 py-2.5 text-sm font-semibold transition"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
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
      <aside className="sidebar-shell-desktop glass sticky top-0 hidden shrink-0 overflow-hidden rounded-[28px] lg:flex lg:flex-col">
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
          className={`absolute inset-0 bg-[#020916]/72 backdrop-blur-[7px] transition duration-300 ease-out ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`glass absolute bottom-3 left-3 top-3 z-[81] flex w-[min(88vw,332px)] flex-col overflow-hidden rounded-[28px] p-4 shadow-[0_25px_80px_rgba(2,11,28,0.42)] transition duration-300 ease-out ${
            mobileOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-[110%] opacity-0"
          }`}
        >
          <SidebarContent onClose={onClose} />
        </aside>
      </div>
    </>
  );
}
