// File: apps/web/src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p
          className="text-8xl font-bold text-[var(--color-primary-100)] mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          404
        </p>
        <h1 className="text-2xl font-bold text-[var(--color-primary-600)] mb-2">
          Page not found
        </h1>
        <p className="text-[var(--color-neutral-500)] mb-8">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center h-11 px-6 bg-[var(--color-primary-600)] text-white font-semibold rounded-lg hover:bg-[var(--color-primary-700)] transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
