import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center px-3">
      <div className="pointer-events-auto flex w-full max-w-[560px] items-center justify-center gap-2 rounded-2xl border border-[rgba(255,170,120,0.28)] bg-[linear-gradient(180deg,rgba(88,39,14,0.92)_0%,rgba(64,26,8,0.9)_100%)] px-4 py-3 text-center text-sm font-semibold text-[#ffe3c7] shadow-[0_18px_42px_rgba(23,9,3,0.34)] backdrop-blur-[16px]">
        <WifiOff size={16} className="shrink-0" />
        <span>No internet connection. Please check your network.</span>
      </div>
    </div>
  );
}
