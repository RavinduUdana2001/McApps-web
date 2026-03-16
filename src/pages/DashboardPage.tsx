import AppShell from "../components/layout/AppShell";
import TopHeader from "../components/layout/TopHeader";
import QuickAccessGrid from "../components/dashboard/QuickAccessGrid";
import DashboardHighlightCarousel from "../components/dashboard/DashboardHighlightCarousel";

export default function DashboardPage() {
  return (
    <AppShell desktopFitScreen hideDefaultHeader>
      <div className="grid grid-cols-1 gap-4 lg:h-full lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.82fr)] lg:overflow-hidden">
        <div className="flex min-h-0 flex-col gap-4 lg:overflow-hidden">
          <TopHeader compact />

          <div className="min-h-0 flex-1">
            <QuickAccessGrid mode="dashboard" />
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-rows-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:overflow-hidden">
          <div className="min-h-0">
            <DashboardHighlightCarousel type="alerts" />
          </div>

          <div className="min-h-0">
            <DashboardHighlightCarousel type="news" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}