"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useDeletePhoto, useReorderPhotos, useUploadPhotos } from "../../hooks/useListings";
import { errorMessage } from "../../lib/api";
import type { Photo } from "../../lib/types";
import { toast } from "../../stores/toastStore";
import { Button } from "../ui/button";

const MAX = 12;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoManager({ propertyId, photos }: { propertyId: string; photos: Photo[] }) {
  const upload = useUploadPhotos(propertyId);
  const reorder = useReorderPhotos(propertyId);
  const remove = useDeletePhoto();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const ordered = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const busy = upload.isPending || reorder.isPending || remove.isPending;

  const add = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const rejected = files.filter((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES);
    const accepted = files.filter((f) => !rejected.includes(f)).slice(0, MAX - ordered.length);
    if (rejected.length) toast.error(`${rejected.length} file${rejected.length > 1 ? "s were" : " was"} skipped — use JPG, PNG or WebP under 5 MB.`);
    if (!accepted.length) return;
    setProgress(0);
    upload.mutate(
      { files: accepted, onProgress: setProgress },
      {
        onSuccess: () => toast.success(`${accepted.length} photo${accepted.length > 1 ? "s" : ""} added`),
        onError: (error) => toast.error(errorMessage(error)),
        onSettled: () => setProgress(null),
      },
    );
  };

  const move = (index: number, delta: number) => {
    const ids = ordered.map((p) => p.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    reorder.mutate(ids);
  };

  const makeCover = (index: number) => {
    const ids = ordered.map((p) => p.id);
    const [moved] = ids.splice(index, 1);
    reorder.mutate([moved, ...ids], { onSuccess: () => toast.success("Cover photo updated") });
  };

  return (
    <div className="grid gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center rounded-card border-2 border-dashed px-6 py-8 text-center transition-colors ${dragging ? "border-navy bg-navy-soft" : "border-line-strong bg-bg"}`}
      >
        <ImagePlus className="size-8 text-muted" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-ink">Drag photos here, or choose them</p>
        <p className="mt-1 text-[13px] text-muted">
          Up to {MAX} photos · JPG, PNG or WebP · 5 MB each · {ordered.length}/{MAX} added
        </p>
        <input ref={input} type="file" accept={TYPES.join(",")} multiple className="sr-only" onChange={(e) => e.target.files && add(e.target.files)} />
        <Button className="mt-4" variant="secondary" disabled={ordered.length >= MAX || busy} onClick={() => input.current?.click()}>
          Choose photos
        </Button>
        {progress !== null && (
          <div className="mt-4 w-full max-w-xs" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-navy transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{progress < 100 ? `Uploading… ${progress}%` : "Processing…"}</p>
          </div>
        )}
      </div>

      {ordered.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ordered.map((photo, i) => (
            <li key={photo.id} className="overflow-hidden rounded-card border border-line bg-surface">
              <div className="relative aspect-[4/3] bg-surface-2">
                <Image src={photo.url} alt={photo.altText ?? `Photo ${i + 1}`} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-navy px-2 py-0.5 text-[11px] font-bold text-on-navy">Cover</span>}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex">
                  <button type="button" disabled={i === 0 || busy} onClick={() => move(i, -1)} className="rounded-[6px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30" aria-label="Move earlier">
                    <ArrowLeft className="size-4" />
                  </button>
                  <button type="button" disabled={i === ordered.length - 1 || busy} onClick={() => move(i, 1)} className="rounded-[6px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30" aria-label="Move later">
                    <ArrowRight className="size-4" />
                  </button>
                  {i > 0 && (
                    <button type="button" disabled={busy} onClick={() => makeCover(i)} className="rounded-[6px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Make cover photo" title="Make cover photo">
                      <Star className="size-4" />
                    </button>
                  )}
                </div>
                <button type="button" disabled={busy} onClick={() => remove.mutate(photo.id)} className="rounded-[6px] p-1.5 text-muted hover:bg-bad-soft hover:text-bad" aria-label="Delete photo">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
