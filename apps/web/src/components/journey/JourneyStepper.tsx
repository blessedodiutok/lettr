import { getJourneySteps, type JourneyInput } from "@lettr/utils";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

/** The six steps from first message to moving in. Horizontal on wide screens, vertical on phones. */
export function JourneyStepper({ input, className }: { input: JourneyInput; className?: string }) {
  const steps = getJourneySteps(input);
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-6 sm:gap-0", className)} aria-label="Rental progress">
      {steps.map((step, i) => (
        <li key={step.key} className="relative flex items-center gap-3 sm:block sm:pr-2 sm:pt-8" aria-current={step.state === "current" ? "step" : undefined}>
          {i > 0 && (
            <span aria-hidden className={cn("absolute -top-3 left-[9px] h-3 w-0.5 sm:left-0 sm:right-0 sm:top-[10px] sm:h-0.5 sm:w-auto", step.state === "upcoming" ? "bg-line" : "bg-navy")} />
          )}
          <span
            aria-hidden
            className={cn(
              "relative z-[1] grid size-5 shrink-0 place-items-center rounded-full border-2 sm:absolute sm:left-0 sm:top-0.5",
              step.state === "done" && "border-navy bg-navy text-on-navy",
              step.state === "current" && "border-brass bg-brass-soft ring-4 ring-brass-soft",
              step.state === "upcoming" && "border-line-strong bg-surface",
            )}
          >
            {step.state === "done" && <Check className="size-3" strokeWidth={3} />}
          </span>
          <span className={cn("text-[13px] font-semibold", step.state === "upcoming" ? "text-muted" : "text-ink")}>
            {step.label}
            <span className="sr-only"> — {step.state === "done" ? "done" : step.state === "current" ? "current step" : "not started"}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
