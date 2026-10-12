// File: apps/web/src/app/error.tsx
"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-[var(--color-neutral-800)] mb-2">
          Something went wrong
        </h1>
        <p className="text-[var(--color-neutral-500)] mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
