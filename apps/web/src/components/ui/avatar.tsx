// File: apps/web/src/components/ui/avatar.tsx
// User avatar with image fallback to initials

import Image from "next/image";
import * as React from "react";
import { cn } from "../../lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { container: "w-6 h-6", text: "text-[10px]" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-12 h-12", text: "text-base" },
  xl: { container: "w-16 h-16", text: "text-lg" },
};

export function Avatar({
  src,
  alt = "User avatar",
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const { container, text } = sizeMap[size];

  const initials = fallback
    ? fallback
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div
      className={cn(
        container,
        "relative rounded-full overflow-hidden shrink-0",
        "bg-(--color-primary-100) text-(--color-primary-700)",
        "flex items-center justify-center",
        "border border-border",
        "select-none",
        className,
      )}
    >
      {src && !imgError ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="64px"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={cn("font-semibold", text)} aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
}
