"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";
import { IS_DEMO } from "../../lib/demo";
import { homeFor, useAuthStore } from "../../stores/authStore";
import { Button } from "../ui/button";
import { Logo } from "./brand";
import { NotificationBell, UserMenu } from "./UserMenu";

const LINKS = [
  { href: "/listings", label: "Rent a home" },
  { href: "/for-landlords", label: "List your property" },
  { href: "/how-it-works", label: "How escrow works" },
  { href: "/help", label: "Help" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { status, user } = useAuthStore();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="page flex h-16 items-center gap-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname.startsWith(link.href) ? "page" : undefined}
              className={cn(
                "rounded-control px-3 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink",
                pathname.startsWith(link.href) && "text-navy",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {status === "authenticated" && user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href={homeFor(user.role)}>{user.role === "LANDLORD" ? "Overview" : user.role === "ADMIN" ? "Admin" : "My home"}</Link>
              </Button>
              <NotificationBell />
              <UserMenu />
            </>
          ) : status === "anonymous" ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={IS_DEMO ? "/demo" : "/auth/signup"}>{IS_DEMO ? "Try the demo" : "Create account"}</Link>
              </Button>
            </>
          ) : (
            <span className="h-8 w-28" aria-hidden />
          )}
          <button
            type="button"
            className="grid size-10 place-items-center rounded-control text-ink-2 hover:bg-surface-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line bg-surface md:hidden">
          <div className="page flex flex-col py-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-control px-2 py-3 text-[15px] font-medium text-ink hover:bg-surface-2">
                {link.label}
              </Link>
            ))}
            {status === "anonymous" && (
              <Link href="/auth/login" className="rounded-control px-2 py-3 text-[15px] font-medium text-navy hover:bg-surface-2">
                Log in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
