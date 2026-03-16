import { useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

type AppShellProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  desktopFitScreen?: boolean;
  hideDefaultHeader?: boolean;
};

export default function AppShell({
  children,
  header,
  desktopFitScreen = false,
  hideDefaultHeader = false,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={[
        "bg-[linear-gradient(180deg,#eff5ff_0%,#edf4ff_100%)] p-3 md:p-4",
        desktopFitScreen
          ? "min-h-screen lg:h-screen lg:overflow-hidden"
          : "min-h-screen",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex max-w-[1500px] gap-4",
          desktopFitScreen ? "lg:h-[calc(100vh-2rem)]" : "",
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
            {!hideDefaultHeader ? header ?? <TopHeader compact={desktopFitScreen} /> : null}

            <div
              className={
                desktopFitScreen
                  ? "lg:min-h-0 lg:flex-1 lg:overflow-hidden"
                  : ""
              }
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}