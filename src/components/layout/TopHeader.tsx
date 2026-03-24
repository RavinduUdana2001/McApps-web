import {
  Cloud,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Menu,
  Sun,
} from "lucide-react";
import { getSession } from "../../utils/session";
import { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../common/UserAvatar";
import {
  getCurrentWeather,
  isWeatherConfigured,
  type WeatherSummary,
} from "../../services/weatherService";

type TopHeaderProps = {
  compact?: boolean;
  onMenuClick?: () => void;
  bare?: boolean;
  className?: string;
};

const CLOCK_REFRESH_MS = 60_000;
const WEATHER_REFRESH_MS = 10 * 60_000;

function getGreetingLabel(now: Date) {
  const hour = now.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getWeatherAppearance(
  weatherMain: string,
  iconCode?: string
): {
  icon: ComponentType<{ size?: number; className?: string }>;
  wrapClassName: string;
  iconClassName: string;
} {
  const tone = weatherMain.trim().toLowerCase();
  const isNight = iconCode?.includes("n");

  if (tone === "thunderstorm") {
    return {
      icon: CloudLightning,
      wrapClassName:
        "bg-[radial-gradient(circle_at_30%_30%,rgba(255,225,122,0.38)_0%,rgba(122,99,255,0.22)_60%,transparent_100%)] shadow-[0_10px_22px_rgba(93,72,190,0.22)]",
      iconClassName: "text-[#ffd85f]",
    };
  }

  if (tone === "drizzle" || tone === "rain") {
    return {
      icon: CloudRain,
      wrapClassName:
        "bg-[radial-gradient(circle_at_30%_30%,rgba(115,231,255,0.28)_0%,rgba(73,144,255,0.2)_62%,transparent_100%)] shadow-[0_10px_22px_rgba(42,120,214,0.2)]",
      iconClassName: "text-[#7ee6ff]",
    };
  }

  if (tone === "snow") {
    return {
      icon: CloudSnow,
      wrapClassName:
        "bg-[radial-gradient(circle_at_30%_30%,rgba(237,247,255,0.34)_0%,rgba(150,204,255,0.18)_64%,transparent_100%)] shadow-[0_10px_22px_rgba(106,154,214,0.18)]",
      iconClassName: "text-[#eef7ff]",
    };
  }

  if (tone === "clear") {
    return {
      icon: isNight ? CloudMoon : Sun,
      wrapClassName: isNight
        ? "bg-[radial-gradient(circle_at_30%_30%,rgba(193,188,255,0.28)_0%,rgba(98,128,255,0.18)_64%,transparent_100%)] shadow-[0_10px_22px_rgba(80,99,182,0.18)]"
        : "bg-[radial-gradient(circle_at_30%_30%,rgba(255,225,122,0.38)_0%,rgba(255,169,78,0.18)_62%,transparent_100%)] shadow-[0_10px_22px_rgba(214,132,42,0.22)]",
      iconClassName: isNight ? "text-[#d9d6ff]" : "text-[#ffd45f]",
    };
  }

  if (tone === "clouds") {
    return {
      icon: CloudSun,
      wrapClassName:
        "bg-[radial-gradient(circle_at_30%_30%,rgba(255,226,131,0.24)_0%,rgba(162,213,255,0.2)_62%,transparent_100%)] shadow-[0_10px_22px_rgba(74,126,196,0.18)]",
      iconClassName: "text-[#ffe18a]",
    };
  }

  return {
    icon: Cloud,
    wrapClassName:
      "bg-[radial-gradient(circle_at_30%_30%,rgba(204,225,255,0.26)_0%,rgba(113,170,255,0.16)_62%,transparent_100%)] shadow-[0_10px_22px_rgba(74,126,196,0.16)]",
    iconClassName: "text-[#dcecff]",
  };
}

export default function TopHeader({
  compact = false,
  onMenuClick,
  bare = false,
  className = "",
}: TopHeaderProps) {
  const navigate = useNavigate();
  const user = getSession();
  const [imageVersion, setImageVersion] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherSummary | null>(null);

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
    const tick = () => setNow(new Date());
    const intervalId = window.setInterval(tick, CLOCK_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let active = true;

    if (!isWeatherConfigured()) {
      setWeather(null);
      return;
    }

    const loadWeather = async () => {
      try {
        const data = await getCurrentWeather(user?.location);

        if (active) {
          setWeather(data);
        }
      } catch {
        if (active) {
          setWeather(null);
        }
      }
    };

    void loadWeather();

    const intervalId = window.setInterval(() => {
      void loadWeather();
    }, WEATHER_REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user?.location]);

  const displayName =
    user?.displayname?.trim() ||
    user?.username?.trim() ||
    user?.mail?.trim() ||
    "Employee";
  const email = user?.mail?.trim() || "";
  const greeting = getGreetingLabel(now);
  const weatherAppearance = getWeatherAppearance(
    weather?.weatherMain || "",
    weather?.iconCode
  );
  const WeatherIcon = weatherAppearance.icon;

  return (
    <header
      className={[
        bare
          ? compact
            ? "px-1 py-1"
            : "px-1 py-2"
          : [
              "rounded-[24px] border border-[rgba(133,177,255,0.18)] bg-[linear-gradient(180deg,rgba(7,24,54,0.52)_0%,rgba(9,31,69,0.34)_100%)] backdrop-blur-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
              compact
                ? "px-4 py-4 md:px-5 md:py-4.5 xl:px-6 xl:py-5"
                : "px-4 py-4 md:px-5",
            ].join(" "),
        className,
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 xl:gap-5">
        <div className="flex min-w-0 items-start gap-2.5 xl:gap-3">
          {onMenuClick ? (
            <button
              type="button"
              onClick={onMenuClick}
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] text-[#d6e6ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition active:scale-[0.98] sm:hidden",
                bare ? "" : "backdrop-blur-[12px]",
              ].join(" ")}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          ) : null}

          <div className="min-w-0">
            <p className="truncate text-[0.94rem] font-normal leading-tight tracking-[0.02em] text-[#c8d8f1] md:text-[1rem] xl:text-[1.08rem] 2xl:text-[1.14rem]">
              {greeting}
            </p>
            <p className="mt-1 truncate text-[1.18rem] font-extrabold leading-tight tracking-[-0.03em] text-white md:text-[1.3rem] xl:text-[1.46rem] 2xl:text-[1.58rem]">
              {displayName}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {weather ? (
            <div
              className={[
                "min-w-0 max-w-[240px] px-0.5 py-0.5",
                compact ? "sm:max-w-[270px]" : "sm:max-w-[250px]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${weatherAppearance.wrapClassName}`}
                >
                  <WeatherIcon
                    size={22}
                    className={weatherAppearance.iconClassName}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-sm font-semibold text-white md:text-[0.96rem]">
                      {weather.description}
                    </p>
                    <span className="shrink-0 text-[1rem] font-bold tracking-[-0.02em] text-[#ffe08a] md:text-[1.08rem]">
                      {weather.temperatureC}
                      {"\u00B0"}C
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.72rem] font-medium text-[#a9bfdc] md:text-[0.76rem]">
                    {weather.locationLabel}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => navigate("/profile")}
            aria-label="Open profile"
            className={[
              "flex shrink-0 items-center justify-center rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(94,162,255,0.06)_100%)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.11)_0%,rgba(94,162,255,0.08)_100%)]",
              bare ? "" : "backdrop-blur-[14px]",
            ].join(" ")}
          >
            <UserAvatar
              email={email}
              displayName={displayName}
              size={compact ? 50 : 46}
              imageVersion={imageVersion}
              className="shrink-0"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
