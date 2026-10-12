import Link from "next/link";
import { Logo } from "../components/layout/brand";
import { Button } from "../components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 font-display text-7xl text-line-strong">404</p>
      <h1 className="mt-2 font-display text-3xl font-medium text-ink">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-muted">It may have moved, or the home may no longer be listed.</p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/listings">Browse homes</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
