// File: apps/web/src/components/layout/Footer.tsx

import Link from "next/link";

const FOOTER_LINKS = {
  Tenants: [
    { label: "Browse listings", href: "/listings" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Savings calculator", href: "/#calculator" },
  ],

  Landlords: [
    { label: "List your property", href: "/landlord/listings/new" },
    { label: "Landlord dashboard", href: "/landlord/dashboard" },
    { label: "Verification", href: "/landlord/verify" },
  ],

  Company: [
    { label: "About Lettr", href: "/about" },
    { label: "Contact us", href: "/contact" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-(--color-primary-900) text-neutral-300">
      <div className="page-container py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand Column */}

          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="font-(family-name:--font-display) font-bold text-xl text-white"
            >
              Lettr
            </Link>

            <p className="mt-3 text-sm leading-relaxed text-neutral-400 max-w-50">
              Nigeria's first agent-free rental platform. Find your home, cut
              the agent.
            </p>

            <div className="flex gap-3 mt-5">
              <a
                href="https://twitter.com/lettr_ng"
                aria-label="Lettr on Twitter"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                href="https://instagram.com/lettr_ng"
                aria-label="Lettr on Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8A4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
                {category}
              </p>

              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-neutral-400 hover:text-white transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Lettr Technologies Ltd · Lagos, Nigeria
          </p>

          <p className="text-xs text-neutral-600">
            All transactions are secured by Paystack · No agent fees. Ever.
          </p>
        </div>
      </div>
    </footer>
  );
}
