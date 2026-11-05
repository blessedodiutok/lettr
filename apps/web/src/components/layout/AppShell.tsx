"use client";

// Signed-in layout: sidebar on desktop, top bar plus bottom tab bar on phones.
// Shows a skeleton while the session restores and sends anonymous visitors to login.

import {
  BadgeCheck,
  Banknote,
  Building2,
  ClipboardList,
  FileSignature,
  Gavel,
  Heart,
  Home,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUnreadMessages } from "../../hooks/useInquiries";
import { cn } from "../../lib/cn";
import type { Role } from "../../lib/types";
import { homeFor, useAuthStore } from "../../stores/authStore";
import { Skeleton } from "../ui/display";
import { Logo } from "./brand";
import { NotificationBell, UserMenu } from "./UserMenu";
import { IS_DEMO } from "../../lib/demo";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the phone tab bar (max five). */
  tab?: boolean;
  badge?: "messages";
}

const NAV: Record<Role, NavItem[]> = {
  TENANT: [
    { href: "/dashboard", label: "Home", icon: Home, tab: true },
    { href: "/listings", label: "Find a home", icon: Search, tab: true },
    { href: "/dashboard/saved", label: "Saved", icon: Heart, tab: true },
    { href: "/messages", label: "Messages", icon: MessageSquare, tab: true, badge: "messages" },
    { href: "/tenancies", label: "My rental", icon: FileSignature, tab: true },
    { href: "/dashboard/payments", label: "Payments", icon: Receipt },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  LANDLORD: [
    { href: "/landlord/dashboard", label: "Overview", icon: LayoutDashboard, tab: true },
    { href: "/landlord/listings", label: "Listings", icon: Building2, tab: true },
    { href: "/messages", label: "Inquiries", icon: MessageSquare, tab: true, badge: "messages" },
    { href: "/tenancies", label: "Tenancies", icon: FileSignature, tab: true },
    { href: "/landlord/payouts", label: "Payouts", icon: Banknote, tab: true },
    { href: "/landlord/verification", label: "Verification", icon: BadgeCheck },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, tab: true },
    { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck, tab: true },
    { href: "/admin/disputes", label: "Disputes", icon: Gavel, tab: true },
    { href: "/admin/payments", label: "Payments", icon: Receipt, tab: true },
    { href: "/admin/listings", label: "Listings", icon: ClipboardList },
    { href: "/admin/users", label: "Users", icon: Users, tab: true },
    { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  ],
};

// The demo's bar takes one 2.75rem line above the shell at desktop widths.
const SHELL_HEIGHT = IS_DEMO ? "min-h-svh lg:min-h-[calc(100svh-2.75rem)]" : "min-h-svh";
const SIDEBAR_HEIGHT = IS_DEMO ? "h-[calc(100svh-2.75rem)]" : "h-svh";

function isActive(pathname: string, href: string) {
  if (["/dashboard", "/admin", "/landlord/dashboard"].includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-brass px-1.5 text-[11px] font-bold leading-5 text-on-brass">{count > 99 ? "99+" : count}</span>;
}

export function AppShell({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { status, user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const unread = useUnreadMessages().data?.unreadCount ?? 0;

  useEffect(() => {
    if (status === "anonymous") router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authenticated" && user && roles && !roles.includes(user.role)) router.replace(homeFor(user.role));
  }, [status, user, roles, pathname, router]);

  if (status !== "authenticated" || !user || (roles && !roles.includes(user.role))) {
    return (
      <div className={cn("flex", SHELL_HEIGHT)}>
        <div className="hidden w-64 border-r border-line bg-surface p-5 lg:block">
          <Skeleton className="mb-8 h-7 w-24" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-3 h-8 w-full" />
          ))}
        </div>
        <div className="flex-1 p-6 lg:p-10">
          <Skeleton className="mb-4 h-9 w-64" />
          <Skeleton className="h-48 w-full max-w-4xl" />
        </div>
      </div>
    );
  }

  const nav = NAV[user.role];
  const tabs = nav.filter((item) => item.tab).slice(0, 5);

  return (
    <div className={cn("flex", SHELL_HEIGHT)}>
      <aside className={cn("sticky top-0 hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex", SIDEBAR_HEIGHT)}>
        <div className="px-6 pb-5 pt-6">
          <Logo href={homeFor(user.role)} />
        </div>
        <nav aria-label="Account" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          {nav.map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium",
                  active ? "bg-navy-soft text-navy" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden />
                {label}
                {badge === "messages" && <Badge count={unread} />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-4">
          <Link href="/" className="text-[13px] text-muted hover:text-navy">
            ← Back to the website
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <Logo href={homeFor(user.role)} className="text-xl lg:hidden" />
          <div className="ml-auto flex items-center gap-1.5">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main id="main" className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Account"
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-surface lg:hidden"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active ? "text-navy" : "text-muted")}
            >
              <Icon className="size-5" aria-hidden />
              {label}
              {badge === "messages" && unread > 0 && <span className="absolute right-[calc(50%-18px)] top-1.5 size-2 rounded-full bg-brass" aria-label={`${unread} unread`} />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
