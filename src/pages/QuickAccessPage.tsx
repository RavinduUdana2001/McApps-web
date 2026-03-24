import AppShell from "../components/layout/AppShell";
import QuickAccessGrid from "../components/dashboard/QuickAccessGrid";

export default function QuickAccessPage() {
  return (
    <AppShell desktopFitScreen>
      <div className="flex h-full min-h-0 flex-col">
        <QuickAccessGrid mode="page" className="flex-1 min-h-0" />
      </div>
    </AppShell>
  );
}
