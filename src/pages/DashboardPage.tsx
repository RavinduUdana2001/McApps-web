import AppShell from "../components/layout/AppShell";
import TopHeader from "../components/layout/TopHeader";
import QuickAccessGrid from "../components/dashboard/QuickAccessGrid";
import DashboardHighlightCarousel from "../components/dashboard/DashboardHighlightCarousel";

export default function DashboardPage() {
  return (
    <AppShell desktopFitScreen hideDefaultHeader variant="immersive">
      {(onMenuClick) => (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 xl:h-full xl:grid-cols-[minmax(0,1.34fr)_minmax(360px,0.92fr)] 2xl:grid-cols-[minmax(0,1.42fr)_minmax(390px,0.84fr)] xl:overflow-hidden">
          <div className="flex min-h-0 flex-col gap-2.5 sm:gap-3 xl:overflow-hidden">
            <TopHeader
              compact
              onMenuClick={onMenuClick}
              className="dashboard-surface"
            />

            <div className="min-h-0 flex-1 xl:overflow-hidden">
              <QuickAccessGrid
                mode="dashboard"
                className="dashboard-surface"
              />
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-1 gap-2.5 sm:gap-3 xl:grid-rows-[minmax(220px,0.74fr)_minmax(0,1.26fr)] 2xl:grid-rows-[minmax(242px,0.8fr)_minmax(0,1.2fr)] xl:overflow-hidden">
            <div className="min-h-0">
              <DashboardHighlightCarousel
                type="alerts"
                className="dashboard-surface"
              />
            </div>

            <div className="min-h-0">
              <DashboardHighlightCarousel
                type="news"
                className="dashboard-surface"
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
