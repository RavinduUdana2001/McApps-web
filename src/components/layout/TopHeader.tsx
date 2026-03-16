import { Search, LogOut } from "lucide-react";
import { clearSession, getSession } from "../../utils/session";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../common/UserAvatar";
import { useEffect, useState } from "react";

type TopHeaderProps = {
  onSearch?: (value: string) => void;
  compact?: boolean;
};

const LOGIN_VISIT_KEY = "mcapps_has_logged_in_before";

export default function TopHeader({
  onSearch,
  compact = false,
}: TopHeaderProps) {
  const navigate = useNavigate();
  const user = getSession();

  const [imageVersion, setImageVersion] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [welcomeText, setWelcomeText] = useState(() => {
    const hasLoggedBefore = localStorage.getItem(LOGIN_VISIT_KEY) === "true";
    return hasLoggedBefore ? "Welcome back" : "Welcome";
  });

  useEffect(() => {
    const onProfileUpdated = () => setImageVersion((prev) => prev + 1);

    window.addEventListener("mcapps-profile-image-updated", onProfileUpdated);

    return () =>
      window.removeEventListener(
        "mcapps-profile-image-updated",
        onProfileUpdated
      );
  }, []);

  useEffect(() => {
    if (localStorage.getItem(LOGIN_VISIT_KEY) !== "true") {
      localStorage.setItem(LOGIN_VISIT_KEY, "true");
    }
  }, []);

  const displayName =
    user?.displayname?.trim() ||
    user?.username?.trim() ||
    user?.mail?.trim() ||
    "Employee";

  const email = user?.mail || "";

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    onSearch?.(value);
  };

  return (
    <header
      className={[
        "glass rounded-[24px]",
        compact ? "px-4 py-3 md:px-5" : "px-4 py-4 md:px-5",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 hidden md:block">
            <p className="text-xs text-[#7a87a3]">{welcomeText}</p>
            <p className="truncate text-sm font-semibold text-[#1f2a44]">
              {displayName}
            </p>
          </div>

          <div
            className={[
              "flex h-10 items-center gap-3 rounded-full bg-white/85 px-4 shadow-sm",
              compact ? "max-w-[360px] xl:max-w-[420px]" : "max-w-[460px]",
            ].join(" ")}
          >
            <Search size={16} className="shrink-0 text-[#7b89a5]" />
            <input
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Search this page..."
              className="w-full bg-transparent text-sm text-[#1f2a44] outline-none placeholder:text-[#8e9ab2]"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white/85 px-2.5 py-2 shadow-sm sm:px-3">
            <UserAvatar
              email={email}
              displayName={displayName}
              size={compact ? 34 : 36}
              imageVersion={imageVersion}
              className="shrink-0"
            />

            <div className="hidden min-w-0 sm:block">
              <p className="text-xs text-[#7a87a3]">{welcomeText}</p>
              <p
                className={[
                  "truncate text-sm font-semibold text-[#1f2a44]",
                  compact ? "max-w-[120px]" : "max-w-[150px]",
                ].join(" ")}
              >
                {displayName}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[#52607d] shadow-sm transition hover:bg-white"
            title="Logout"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}