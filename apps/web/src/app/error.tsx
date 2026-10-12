"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="flex min-h-[70svh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl font-medium text-ink">Something went wrong on this page</h1>
      <p className="mt-2 max-w-md text-muted">Try again. If it keeps happening, contact us{error.digest ? ` and quote reference ${error.digest}` : ""}.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
