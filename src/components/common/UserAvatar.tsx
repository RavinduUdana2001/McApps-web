import { useEffect, useMemo, useState } from "react";
import { UserCircle2 } from "lucide-react";
import { getProfileImage } from "../../services/profileService";

type Props = {
  email?: string;
  displayName?: string;
  size?: number;
  className?: string;
  imageVersion?: number;
};

const PROFILE_CACHE_PREFIX = "profile_image_url_";

export default function UserAvatar({
  email = "",
  displayName = "",
  size = 40,
  className = "",
  imageVersion = 0,
}: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!email) {
        setImageUrl(null);
        return;
      }

      const cacheKey = `${PROFILE_CACHE_PREFIX}${email}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        if (mounted) setImageUrl(cached);
        return;
      }

      try {
        const res = await getProfileImage(email);

        if (res.success && res.image_url) {
          localStorage.setItem(cacheKey, res.image_url);
          if (mounted) setImageUrl(res.image_url);
        } else {
          if (mounted) setImageUrl(null);
        }
      } catch {
        if (mounted) setImageUrl(null);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [email, imageVersion]);

  const initials = useMemo(() => {
    const clean = displayName.trim();
    if (!clean) return "U";

    return clean
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("");
  }, [displayName]);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={displayName || "User"}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#dce8ff_0%,#eef4ff_100%)] text-[#305fbc] ${className}`}
      style={{ width: size, height: size }}
    >
      {displayName ? (
        <span className="text-xs font-bold">{initials}</span>
      ) : (
        <UserCircle2 size={size * 0.55} />
      )}
    </div>
  );
}