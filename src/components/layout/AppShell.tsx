import { useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import dashboardBg from "../../assets/123.jpeg";

type AppShellProps = {
  children: React.ReactNode | ((onMenuClick: () => void) => React.ReactNode);
  header?: React.ReactNode | ((onMenuClick: () => void) => React.ReactNode);
  desktopFitScreen?: boolean;
  hideDefaultHeader?: boolean;
  variant?: "default" | "immersive";
};

export default function AppShell({
  children,
  header,
  desktopFitScreen = false,
  hideDefaultHeader = false,
  variant = "immersive",
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMobileMenu = () => setMobileOpen(true);

  return (
    <div
      className={[
        "relative overflow-hidden px-2.5 py-2.5 sm:px-3 sm:py-3 md:px-4 md:py-4",
        desktopFitScreen
          ? "min-h-screen lg:h-screen lg:overflow-hidden"
          : "min-h-screen",
        variant === "immersive" ? "dashboard-immersive-shell" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute inset-0 ${
            variant === "immersive" ? "opacity-[0.82]" : "opacity-[0.62]"
          }`}
          style={{
            backgroundImage: `url(${dashboardBg})`,
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        />
        <div
          className={`absolute inset-0 ${
            variant === "immersive"
              ? "bg-[linear-gradient(180deg,rgba(3,14,34,0.14)_0%,rgba(5,24,56,0.08)_45%,rgba(8,36,81,0.16)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(3,14,34,0.24)_0%,rgba(5,24,56,0.16)_45%,rgba(6,31,69,0.22)_100%)]"
          }`}
        />
        {variant === "immersive" ? null : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(92,166,255,0.04),transparent_26%),radial-gradient(circle_at_18%_18%,rgba(94,162,255,0.06),transparent_22%),radial-gradient(circle_at_84%_12%,rgba(31,97,200,0.08),transparent_18%)]" />
            <div className="absolute left-[-120px] top-[18%] h-[320px] w-[320px] rounded-full bg-[#3f8fff]/10 blur-[110px]" />
            <div className="absolute bottom-[-140px] right-[-80px] h-[360px] w-[360px] rounded-full bg-[#2b67cf]/15 blur-[130px]" />
          </>
        )}
      </div>

      <div
        className={[
          "relative flex w-full min-w-0 gap-3 xl:gap-4",
          desktopFitScreen ? "lg:h-[calc(100dvh-2rem)]" : "",
        ].join(" ")}
      >
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

        <main
          className={[
            "min-w-0 flex-1",
            desktopFitScreen ? "lg:h-full lg:overflow-hidden" : "",
          ].join(" ")}
        >
          <div
            className={[
              "space-y-4",
              desktopFitScreen
                ? "lg:flex lg:h-full lg:flex-col lg:overflow-hidden"
                : "",
            ].join(" ")}
          >
            {!hideDefaultHeader
              ? typeof header === "function"
                ? header(openMobileMenu)
                : header ?? (
                    <TopHeader
                      compact={desktopFitScreen}
                      onMenuClick={openMobileMenu}
                    />
                  )
              : null}

            <div
              className={
                desktopFitScreen
                  ? "lg:min-h-0 lg:flex-1 lg:overflow-hidden"
                  : ""
              }
            >
              {typeof children === "function"
                ? children(openMobileMenu)
                : children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
