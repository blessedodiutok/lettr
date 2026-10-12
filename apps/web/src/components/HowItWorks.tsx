// File: apps/web/src/components/HowItWorks.tsx
// Static — intentionally no "use client" (no interactivity needed)

const steps = [
  {
    number: "01",
    title: "Search",
    description:
      "Browse verified listings across Nigeria. Filter by state, LGA, property type, and budget.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Inquire directly",
    description:
      "Message the landlord directly. Book an inspection. No middlemen, no commission conversations.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Pay securely",
    description:
      "Pay through our escrow system. Funds release to the landlord only after you confirm handover.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Move in",
    description:
      "Sign your digital tenancy agreement and collect your keys. Welcome home.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
] as const;

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
      {steps.map((step, i) => (
        <div key={step.number} className="relative group">
          {/* Connector line between steps — desktop only */}
          {i < steps.length - 1 && (
            <div
              aria-hidden="true"
              className="
                hidden lg:block
                absolute top-[2.125rem] left-[calc(50%+2.5rem)] right-0
                h-px
                bg-gradient-to-r from-[var(--color-primary-200)] to-transparent
                z-0
              "
              style={{ width: "calc(100% - 5rem)" }}
            />
          )}

          <div
            className="
              relative z-10
              bg-white
              border border-[var(--color-neutral-200)]
              rounded-2xl p-6
              transition-all duration-200
              hover:shadow-[var(--shadow-card-hover)]
              hover:-translate-y-0.5
              hover:border-[var(--color-primary-100)]
            "
          >
            {/* Step number + icon row */}
            <div className="flex items-start justify-between mb-5">
              {/* Large serif number */}
              <span
                className="
                  font-[family-name:var(--font-display)]
                  text-5xl font-bold leading-none
                  text-[var(--color-primary-100)]
                  select-none
                "
              >
                {step.number}
              </span>

              {/* Icon bubble */}
              <div
                className="
                  flex items-center justify-center
                  w-11 h-11 rounded-xl
                  bg-[var(--color-primary-50)]
                  text-[var(--color-primary-600)]
                  transition-colors duration-200
                  group-hover:bg-[var(--color-primary-600)]
                  group-hover:text-white
                "
              >
                {step.icon}
              </div>
            </div>

            <h3 className="font-semibold text-base text-[var(--color-primary-800)] mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-[var(--color-neutral-500)] leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
