import { IS_DEMO } from "../../lib/demo";
import Link from "next/link";
import { Logo, ThemeToggle } from "./brand";

const GROUPS = [
  {
    title: "Tenants",
    links: [
      { href: "/listings", label: "Browse homes" },
      { href: "/how-it-works", label: "How escrow works" },
      { href: "/help#tenants", label: "Tenant questions" },
    ],
  },
  {
    title: "Landlords",
    links: [
      { href: "/for-landlords", label: "List your property" },
      { href: "/landlord/listings/new", label: "Create a listing" },
      { href: "/help#landlords", label: "Landlord questions" },
    ],
  },
  {
    title: "Lettr",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-muted">Rent directly from landlords in Nigeria. Your rent stays in escrow until you have the keys.</p>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="eyebrow mb-3">{group.title}</h2>
            <ul className="flex flex-col gap-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-2 hover:text-navy">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="page flex flex-col gap-3 py-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{IS_DEMO ? "Lettr is a portfolio demo. Fictional homes, simulated payments." : `© ${new Date().getFullYear()} Lettr Technologies Ltd · Lagos, Nigeria · Payments by Paystack`}</p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
