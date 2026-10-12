// Form controls. <Field> wires a label, hint and error to its control by id so
// screen readers announce them, and every control shares one look.

import * as React from "react";
import { cn } from "../../lib/cn";

const control =
  "w-full rounded-control border border-line-strong bg-surface text-ink placeholder:text-muted/80 " +
  "transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/25 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 aria-[invalid=true]:border-bad aria-[invalid=true]:focus:ring-bad/25";

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

export interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = React.useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-muted">(optional)</span>}
        </label>
        {children}
        {hint && !error && (
          <p id={hintId} className="text-[13px] text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-[13px] font-medium text-bad">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

function useFieldProps<T extends { id?: string; "aria-describedby"?: string; "aria-invalid"?: React.AriaAttributes["aria-invalid"] }>(props: T): T {
  const field = React.useContext(FieldContext);
  if (!field) return props;
  return {
    ...props,
    id: props.id ?? field.id,
    "aria-describedby": props["aria-describedby"] ?? field.describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
  };
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string }>(function Input(
  { className, prefix, ...props },
  ref,
) {
  const fieldProps = useFieldProps(props);
  if (prefix) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted">{prefix}</span>
        <input ref={ref} className={cn(control, "h-11 pl-8 pr-3 text-[15px]", className)} {...fieldProps} />
      </div>
    );
  }
  return <input ref={ref} className={cn(control, "h-11 px-3 text-[15px]", className)} {...fieldProps} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  const fieldProps = useFieldProps(props);
  return <textarea ref={ref} className={cn(control, "min-h-24 px-3 py-2.5 text-[15px] leading-relaxed", className)} {...fieldProps} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  const fieldProps = useFieldProps(props);
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "h-11 appearance-none pl-3 pr-9 text-[15px]", className)} {...fieldProps}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

export function Checkbox({ label, description, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; description?: string }) {
  const id = React.useId();
  return (
    <label htmlFor={props.id ?? id} className={cn("flex cursor-pointer items-start gap-3 rounded-control py-1", className)}>
      <input id={props.id ?? id} type="checkbox" className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[var(--navy)]" {...props} />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-[13px] text-muted">{description}</span>}
      </span>
    </label>
  );
}
