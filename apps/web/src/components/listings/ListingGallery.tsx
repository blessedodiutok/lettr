"use client";

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import Image from "next/image";
import { Dialog as RadixDialog } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../../lib/cn";
import type { Photo } from "../../lib/types";

/** Mosaic of up to five photos with a full-screen viewer (keyboard and swipe friendly). */
export function ListingGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const ordered = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const step = useCallback((delta: number) => setIndex((i) => (i + delta + ordered.length) % ordered.length), [ordered.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  if (!ordered.length) {
    return <div className="grid aspect-[16/9] place-items-center rounded-media bg-surface-2 text-sm text-muted">No photos yet</div>;
  }

  // Layout adapts to how many photos there are, so there's never an empty block.
  const tiles = ordered.slice(0, ordered.length >= 5 ? 5 : ordered.length >= 3 ? 3 : ordered.length);
  const layout = tiles.length >= 5 ? "sm:grid-cols-4 sm:grid-rows-2" : tiles.length === 3 ? "sm:grid-cols-3 sm:grid-rows-2" : tiles.length === 2 ? "sm:grid-cols-2" : "";
  const mainSpan = tiles.length >= 5 ? "sm:col-span-2 sm:row-span-2" : tiles.length === 3 ? "sm:col-span-2 sm:row-span-2" : "";
  return (
    <>
      <div className={cn("relative grid gap-1.5 overflow-hidden rounded-media", layout)}>
        {tiles.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => show(i)}
            className={cn(
              "relative overflow-hidden bg-surface-2",
              i === 0 ? cn("aspect-[4/3] sm:aspect-auto sm:min-h-[420px]", mainSpan) : tiles.length === 2 ? "hidden sm:block sm:min-h-[420px]" : "hidden aspect-[4/3] sm:block sm:aspect-auto",
            )}
            aria-label={`Open photo ${i + 1} of ${ordered.length}`}
          >
            <Image src={photo.url} alt={photo.altText ?? `${title} — photo ${i + 1}`} fill priority={i === 0} sizes={i === 0 ? "(max-width: 640px) 100vw, 60vw" : "30vw"} className="object-cover transition-transform duration-300 hover:scale-[1.02]" />
          </button>
        ))}
        {ordered.length > 1 && (
          <button
            type="button"
            onClick={() => show(0)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-control bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-[#0F1C2B] shadow-1"
          >
            <Images className="size-4" aria-hidden /> All {ordered.length} photos
          </button>
        )}
      </div>

      <RadixDialog.Root open={open} onOpenChange={setOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
          <RadixDialog.Content className="fixed inset-0 z-50 flex flex-col outline-none" aria-describedby={undefined}>
            <RadixDialog.Title className="sr-only">{title} photos</RadixDialog.Title>
            <div className="flex items-center justify-between p-4 text-white">
              <span className="tnum text-sm">
                {index + 1} / {ordered.length}
              </span>
              <RadixDialog.Close className="rounded-full p-2 hover:bg-white/10" aria-label="Close photos">
                <X className="size-6" />
              </RadixDialog.Close>
            </div>
            <div
              className="relative flex-1"
              onTouchStart={(e) => ((e.currentTarget as HTMLDivElement).dataset.x = String(e.touches[0].clientX))}
              onTouchEnd={(e) => {
                const start = Number((e.currentTarget as HTMLDivElement).dataset.x);
                const delta = e.changedTouches[0].clientX - start;
                if (Math.abs(delta) > 40) step(delta < 0 ? 1 : -1);
              }}
            >
              <Image src={ordered[index].url} alt={ordered[index].altText ?? title} fill sizes="100vw" className="object-contain" />
            </div>
            {ordered.length > 1 && (
              <div className="flex justify-center gap-3 p-4">
                <button type="button" onClick={() => step(-1)} className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Previous photo">
                  <ChevronLeft className="size-6" />
                </button>
                <button type="button" onClick={() => step(1)} className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Next photo">
                  <ChevronRight className="size-6" />
                </button>
              </div>
            )}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </>
  );
}
