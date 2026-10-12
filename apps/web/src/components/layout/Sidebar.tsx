// File: apps/web/src/components/layout/Sidebar.tsx
// Dashboard sidebar — used on landlord and tenant dashboard pages

"use client";

import {
  Bell,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const TENANT_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: <LayoutDashboard size={16} />,
  },
  {
    href: "/dashboard/saved",
    label: "Saved listings",
    icon: <Home size={16} />,
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: <MessageSquare size={16} />,
  },
  {
    href: "/dashboard/tenancy",
    label: "My tenancy",
    icon: <FileText size={16} />,
  },
  {
    href: "/dashboard/payments",
    label: "Payments",
    icon: <CreditCard size={16} />,
  },
  { href: "/notifications", label: "Notifications", icon: <Bell size={16} /> },
  { href: "/settings", label: "Settings", icon: <Settings size={16} /> },
];

const LANDLORD_NAV: NavItem[] = [
  {
    href: "/landlord/dashboard",
    label: "Portfolio",
    icon: <LayoutDashboard size={16} />,
  },
  {
    href: "/landlord/listings/new",
    label: "New listing",
    icon: <PlusCircle size={16} />,
  },
  {
    href: "/landlord/inquiries",
    label: "Inquiries",
    icon: <MessageSquare size={16} />,
  },
  {
    href: "/landlord/tenancies",
    label: "Tenancies",
    icon: <FileText size={16} />,
  },
  {
    href: "/landlord/payments",
    label: "Payments",
    icon: <CreditCard size={16} />,
  },
  { href: "/landlord/tenants", label: "Tenants", icon: <Users size={16} /> },
  { href: "/notifications", label: "Notifications", icon: <Bell size={16} /> },
  { href: "/settings", label: "Settings", icon: <Settings size={16} /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const nav = user?.role === "LANDLORD" ? LANDLORD_NAV : TENANT_NAV;

  return (
    <aside className="w-60 shrink-0 hidden lg:block">
      <div className="sticky top-20">
        <nav aria-label="Dashboard navigation">
          <ul className="space-y-0.5">
            {nav.map(({ href, label, icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-(--radius-md)",
                      "text-sm font-medium",
                      "transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-(--color-primary-50) text-(--color-primary-700)"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0",
                        isActive ? "text-brand-navy" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    >
                      {icon}
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
