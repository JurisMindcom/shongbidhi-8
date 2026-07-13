import { useEffect, useRef, useState } from "react";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  /** true for above-the-fold images (eager + high priority) */
  priority?: boolean;
  width?: number;
  height?: number;
};

/**
 * Reliable image loader:
 * - Reserves dimensions (no CLS)
 * - Skeleton shimmer until loaded
 * - Auto-retries transient failures (up to 3 times, exponential backoff)
 * - Renders fallback when image is missing or permanently failed
 * - Uses native lazy loading below the fold, eager + fetchpriority=high above
 */
export function SmartImage({
  src,
  alt,
  className,
  fallback,
  priority = false,
  width,
  height,
}: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error",
  );
  const [attempt, setAttempt] = useState(0);
  const retryRef = useRef<number | null>(null);

  useEffect(() => {
    setAttempt(0);
    setStatus(src ? "loading" : "error");
    return () => {
      if (retryRef.current) window.clearTimeout(retryRef.current);
    };
  }, [src]);

  const handleError = () => {
    if (attempt < 3) {
      const delay = 300 * Math.pow(2, attempt);
      retryRef.current = window.setTimeout(() => {
        setAttempt((a) => a + 1);
        setStatus("loading");
      }, delay);
    } else {
      setStatus("error");
    }
  };

  if (!src || status === "error") {
    return <>{fallback}</>;
  }

  // Cache-busting only on retries so the first load hits the CDN cache normally.
  const url = attempt > 0 ? `${src}${src.includes("?") ? "&" : "?"}r=${attempt}` : src;

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted/60" aria-hidden />
      )}
      <img
        key={attempt}
        src={url}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        // @ts-expect-error - fetchpriority is valid but not yet in React types on this version
        fetchpriority={priority ? "high" : "auto"}
        draggable={false}
        onLoad={() => setStatus("loaded")}
        onError={handleError}
        className={className}
        style={{ opacity: status === "loaded" ? 1 : 0, transition: "opacity 200ms ease" }}
      />
    </>
  );
}