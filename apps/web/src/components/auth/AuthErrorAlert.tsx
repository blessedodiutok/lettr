// File: apps/web/src/components/auth/AuthErrorAlert.tsx

export function AuthErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="
        flex items-start gap-3
        bg-(--color-danger-50)
        border border-(--color-danger-100)
        rounded-lg px-4 py-3
      "
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className="shrink-0 mt-0.5"
      >
        <circle cx="8" cy="8" r="7" fill="var(--color-danger-500)" />
        <path
          d="M8 5v4M8 11h.01"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm text-(--color-danger-700)">{message}</p>
    </div>
  );
}
