import { Grid2x2 } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import QuickAccessGrid from "../components/dashboard/QuickAccessGrid";

export default function QuickAccessPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="glass rounded-[30px] p-6 md:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2f66cc_0%,#5f89da_100%)] text-white shadow-md">
              <Grid2x2 size={26} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-[#1c2740]">
                Quick Access
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d7c99]">
                Open company tools, work portals, support systems, and internal
                shortcuts from one place.
              </p>
            </div>
          </div>
        </section>

        <QuickAccessGrid />
      </div>
    </AppShell>
  );
}