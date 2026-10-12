// File: apps/web/src/components/ImageGallery.tsx
// Lightbox photo gallery with thumbnail strip and keyboard navigation

"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../lib/utils";

interface GalleryPhoto {
  url: string;
  altText?: string | null;
}

interface ImageGalleryProps {
  photos: GalleryPhoto[];
  title?: string;
  className?: string;
}

export function ImageGallery({ photos, title, className }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxOpen, prev, next]);

  // Body scroll lock when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  if (!photos.length) return null;

  const active = photos[activeIndex];

  return (
    <>
      {/* Main gallery */}
      <div className={cn("space-y-2", className)}>
        {/* Hero image */}
        <div
          className="relative aspect-videorounded-[var(--radius-xl)] overflow-hidden bg-muted group cursor-pointer"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={active.url}
            alt={active.altText ?? title ?? "Property photo"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority={activeIndex === 0}
          />
          {/* Zoom hint */}
          <div
            className="
            absolute top-3 right-3 p-2 rounded-(--radius-md)
            bg-black/40 text-white
            opacity-0 group-hover:opacity-100
            transition-opacity duration-150
          "
          >
            <ZoomIn size={16} aria-hidden="true" />
          </div>
          {/* Nav arrows — show only if multiple photos */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous photo"
                className="
                  absolute left-3 top-1/2 -translate-y-1/2
                  p-2 rounded-full
                  bg-black/40 hover:bg-black/60
                  text-white transition-colors duration-150
                "
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next photo"
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  p-2 rounded-full
                  bg-black/40 hover:bg-black/60
                  text-white transition-colors duration-150
                "
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
              {/* Counter */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
                {activeIndex + 1} / {photos.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`View photo ${i + 1}`}
                className={cn(
                  "relative shrink-0 w-16 h-12 rounded-(--radius-md) overflow-hidden",
                  "border-2 transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  i === activeIndex
                    ? "border-(--color-primary-500)"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={photo.url}
                  alt={photo.altText ?? `Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-(--z-modal) bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
            className="
              absolute top-4 right-4 z-10
              p-2 rounded-full
              bg-white/10 hover:bg-white/20
              text-white transition-colors duration-150
            "
          >
            <X size={20} aria-hidden="true" />
          </button>

          {/* Image */}
          <div
            className="relative w-full max-w-5xl max-h-[90svh] mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ aspectRatio: "16/9" }}
          >
            <Image
              src={active.url}
              alt={active.altText ?? "Property photo"}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Lightbox nav */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous"
                className="
                  absolute left-4 top-1/2 -translate-y-1/2
                  p-3 rounded-full bg-white/10 hover:bg-white/20
                  text-white transition-colors duration-150
                "
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next"
                className="
                  absolute right-4 top-1/2 -translate-y-1/2
                  p-3 rounded-full bg-white/10 hover:bg-white/20
                  text-white transition-colors duration-150
                "
              >
                <ChevronRight size={22} aria-hidden="true" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm">
                {activeIndex + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
