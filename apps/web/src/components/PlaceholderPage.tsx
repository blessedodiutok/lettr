import Link from "next/link";
import { Button } from "./ui/button";

interface PlaceholderPageProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}

export function PlaceholderPage({
  title,
  description,
  backHref = "/",
  backLabel = "Back to home",
}: PlaceholderPageProps) {
  return (
    <main className="min-h-[70vh] bg-[var(--color-neutral-50)]">
      <section className="page-container py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary-600)]">
            Lettr
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--color-primary-700)]">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--color-neutral-600)]">
            {description}
          </p>
          <div className="mt-8">
            <Link href={backHref}>
              <Button variant="primary">{backLabel}</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
