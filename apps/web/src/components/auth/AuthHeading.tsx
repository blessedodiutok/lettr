export function AuthHeading({ title, description }: { title: string; description?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[32px] font-medium leading-tight text-ink">{title}</h1>
      {description && <p className="mt-2 text-[15px] text-muted">{description}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control border border-bad/30 bg-bad-soft px-3.5 py-2.5 text-sm font-medium text-bad">
      {message}
    </p>
  );
}
