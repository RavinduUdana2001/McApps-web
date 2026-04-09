import { useEffect, useMemo, useRef, useState } from "react";
import { UserCircle2 } from "lucide-react";
import {
  buildProfileImageSrc,
  clearProfileImageCache,
  getProfileImage,
  getProfileImageCache,
  setProfileImageCache,
} from "../../services/profileService";

type Props = {
  email?: string;
  displayName?: string;
  size?: number;
  className?: string;
  imageVersion?: number;
};
export default function UserAvatar({
  email = "",
  displayName = "",
  size = 40,
  className = "",
  imageVersion = 0,
}: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cacheSeed, setCacheSeed] = useState(0);
  const reloadAttemptedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!email) {
        setImageUrl(null);
        setCacheSeed(0);
        return;
      }

      const cached = getProfileImageCache(email);

      if (cached) {
        if (mounted) {
          setImageUrl(cached.url);
          setCacheSeed(cached.savedAt);
        }
        return;
      }

      try {
        const res = await getProfileImage(email);

        if (res.success && res.image_url) {
          setProfileImageCache(email, res.image_url);
          if (mounted) {
            setImageUrl(res.image_url);
            setCacheSeed(Date.now());
          }
        } else {
          if (mounted) {
            setImageUrl(null);
            setCacheSeed(0);
          }
        }
      } catch {
        if (mounted) {
          setImageUrl(null);
          setCacheSeed(0);
        }
      }
    };

    reloadAttemptedRef.current = false;
    load();

    return () => {
      mounted = false;
    };
  }, [email, imageVersion]);

  const resolvedImageUrl =
    imageUrl && email
      ? buildProfileImageSrc(
          imageUrl,
          Math.max(cacheSeed, 0) + Math.max(imageVersion, 0)
        )
      : "";

  const handleImageError = () => {
    if (!email || reloadAttemptedRef.current) {
      setImageUrl(null);
      setCacheSeed(0);
      return;
    }

    reloadAttemptedRef.current = true;
    clearProfileImageCache(email);

    void getProfileImage(email)
      .then((res) => {
        if (res.success && res.image_url) {
          const nextSeed = Date.now();
          setProfileImageCache(email, res.image_url);
          setImageUrl(res.image_url);
          setCacheSeed(nextSeed);
          return;
        }

        setImageUrl(null);
        setCacheSeed(0);
      })
      .catch(() => {
        setImageUrl(null);
        setCacheSeed(0);
      });
  };

  const initials = useMemo(() => {
    const clean = displayName.trim();
    if (!clean) return "U";

    return clean
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("");
  }, [displayName]);

  if (resolvedImageUrl) {
    return (
      <img
        src={resolvedImageUrl}
        alt={displayName || "User"}
        onError={handleImageError}
        className={`rounded-full border border-white/14 object-cover shadow-[0_10px_22px_rgba(2,11,28,0.28)] ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border border-white/12 bg-[linear-gradient(135deg,rgba(94,162,255,0.24)_0%,rgba(215,221,231,0.14)_100%)] text-white shadow-[0_10px_22px_rgba(2,11,28,0.24)] ${className}`}
      style={{ width: size, height: size }}
    >
      {displayName ? (
        <span className="text-xs font-bold tracking-[0.08em]">{initials}</span>
      ) : (
        <UserCircle2 size={size * 0.55} />
      )}
    </div>
  );
}
