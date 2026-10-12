// File: apps/web/src/components/layout/Navbar.tsx
"use client";

import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLogout } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../ui/button";

/* ── Nav links — single source of truth ───────────────────────────────────── */
const NAV_LINKS = [
  { href: "/listings", label: "Browse Listings" },
  { href: "/landlord/listings/new", label: "List a Property" },
  { href: "/#how-it-works", label: "How It Works" },
] as const;

/* ── Small helper: user initials avatar ───────────────────────────────────── */
function UserAvatar({ name }: { name?: string | null }) {
  const initials =
    name
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  return (
    <span
      aria-hidden="true"
      className="
        inline-flex items-center justify-center
        w-8 h-8 rounded-full
        bg-(--color-primary-100) text-(--color-primary-700)
        text-xs font-semibold select-none
      "
    >
      {initials}
    </span>
  );
}

/* ── Navbar ────────────────────────────────────────────────────────────────── */
export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const logout = useLogout();

  const dashboardHref =
    user?.role === "LANDLORD" ? "/landlord/dashboard" : "/dashboard";

  /* Scroll listener — elevate navbar after 8px */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* Prevent body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0]);

  return (
    <>
      <header
        className={`
          sticky top-0 z-(--z-sticky)
          bg-white/95 backdrop-blur-md
          border-b border-neutral-200
          transition-shadow duration-200
          ${scrolled ? "shadow-md" : "shadow-none"}
        `}
      >
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* ── Logo ─────────────────────────────────────────────────── */}
            <Link
              href="/"
              className="
                font-(family-name:--font-display)
                font-bold text-2xl tracking-tight
                text-brand-navy
                hover:text-(--color-primary-500)
                transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-ring focus-visible:ring-offset-2
                rounded-sm
              "
            >
              Lettr
            </Link>

            {/* ── Desktop nav ──────────────────────────────────────────── */}
            <nav
              aria-label="Primary navigation"
              className="hidden md:flex items-center gap-1"
            >
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`
                    relative px-3 py-2 rounded-md
                    text-sm font-medium
                    transition-colors duration-150
                    ${
                      isActive(href)
                        ? "text-brand-navy bg-(--color-primary-50)"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                    }
                  `}
                >
                  {label}
                  {/* Active underline dot */}
                  {isActive(href) && (
                    <span
                      aria-hidden="true"
                      className="
                        absolute bottom-0.5 left-1/2 -translate-x-1/2
                        w-1 h-1 rounded-full
                        bg-brand-gold
                      "
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* ── Desktop auth ─────────────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* Avatar + name */}
                  <div className="flex items-center gap-2 px-2">
                    <UserAvatar name={user?.name} />
                    <span className="text-sm font-medium text-neutral-700 max-w-30 truncate">
                      {user?.name?.split(" ")[0]}
                    </span>
                  </div>

                  <Link href={dashboardHref}>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <LayoutDashboard size={15} />
                      Dashboard
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-neutral-500 hover:text-(--color-danger-600)"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                  >
                    <LogOut size={15} />
                    {logout.isPending ? "Logging out…" : "Log out"}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button variant="primary" size="sm">
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile menu toggle ───────────────────────────────────── */}
            <button
              className="
                md:hidden p-2 -mr-1 rounded-md
                text-neutral-600
                hover:bg-neutral-100
                transition-colors duration-150
              "
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu backdrop ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={`
          fixed inset-0 z-[calc(var(--z-sticky)-1)]
          bg-black/20 backdrop-blur-[2px]
          md:hidden
          transition-opacity duration-200
          ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* ── Mobile menu panel ─────────────────────────────────────────────── */}
      <div
        id="mobile-menu"
        className={`
          fixed top-16 inset-x-0 z-(--z-sticky)
          md:hidden
          bg-white border-b border-neutral-200
          shadow-lg
          transition-all duration-200 ease-out
          overflow-hidden
          ${mobileOpen ? "max-h-150 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
        `}
      >
        <nav
          aria-label="Mobile navigation"
          className="page-container py-4 space-y-1"
        >
          {/* User greeting */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-(--color-primary-50)">
              <UserAvatar name={user?.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-(--color-primary-800) truncate">
                  {user?.name ?? "My Account"}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          )}

          {/* Nav links */}
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center px-3 py-2.5 rounded-md
                text-sm font-medium
                transition-colors duration-150
                ${
                  isActive(href)
                    ? "text-brand-navy bg-(--color-primary-50)"
                    : "text-neutral-700 hover:bg-neutral-100"
                }
              `}
            >
              {label}
            </Link>
          ))}

          {/* Auth actions */}
          <div className="pt-3 mt-3 border-t border-neutral-200 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardHref}
                  className="
                    flex items-center gap-2.5 px-3 py-2.5 rounded-md
                    text-sm font-medium text-neutral-700
                    hover:bg-neutral-100
                    transition-colors duration-150
                  "
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="
                    flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md
                    text-sm font-medium text-neutral-500
                    hover:bg-(--color-danger-50) hover:text-(--color-danger-600)
                    transition-colors duration-150
                    disabled:opacity-60
                  "
                >
                  <LogOut size={16} />
                  {logout.isPending ? "Logging out…" : "Log out"}
                </button>
              </>
            ) : (
              <div className="flex gap-2 pb-1">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="secondary" size="sm" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/signup" className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
