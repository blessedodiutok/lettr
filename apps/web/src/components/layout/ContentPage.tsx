// Layout for editorial pages: a title block and a readable prose column.

import { cn } from "../../lib/cn";

export function ContentPage({
  eyebrow,
  title,
  intro,
  children,
  aside,
  notice,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  aside?: React.ReactNode;
  notice?: React.ReactNode;
}) {
  return (
    <div className="page py-10 sm:py-14">
      <header className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-[34px] font-medium leading-tight text-ink sm:text-[44px]">{title}</h1>
        {intro && <p className="mt-4 text-lg text-ink-2">{intro}</p>}
        {notice && <div className="mt-6 rounded-card border border-dashed border-warn/60 bg-warn-soft px-4 py-3 text-sm text-warn">{notice}</div>}
      </header>
      <div className={cn("mt-10 grid gap-12", aside && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
        <div className="prose-lettr min-w-0 max-w-3xl">{children}</div>
        {aside && <aside className="lg:sticky lg:top-24 lg:self-start">{aside}</aside>}
      </div>
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 text-[16px] leading-relaxed text-ink-2 [&_a]:font-semibold [&_a]:text-navy [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">{children}</div>;
}
