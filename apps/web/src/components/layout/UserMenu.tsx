"use client";

import { Bell, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { useLogout } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useAccount";
import { homeFor, useAuthStore } from "../../stores/authStore";
import { Avatar } from "../ui/display";

export function NotificationBell() {
  const { data } = useNotifications();
  const unread = data?.unreadCount ?? 0;
  return (
    <Link href="/notifications" className="relative grid size-10 place-items-center rounded-control text-ink-2 hover:bg-surface-2" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-brass px-1 text-[10px] font-bold leading-4 text-on-brass">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  if (!user) return null;
  const item = "flex cursor-pointer items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-sm text-ink outline-none data-[highlighted]:bg-surface-2";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="rounded-full outline-offset-2" aria-label="Account menu">
        <Avatar person={user} size={36} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-60 rounded-card border border-line bg-surface p-1.5 shadow-3">
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold text-ink">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild className={item}>
            <Link href={homeFor(user.role)}>
              <LayoutDashboard className="size-4 text-muted" /> {user.role === "LANDLORD" ? "Overview" : user.role === "ADMIN" ? "Admin console" : "My home"}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={item}>
            <Link href="/notifications">
              <Bell className="size-4 text-muted" /> Notifications
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className={item}>
            <Link href="/settings">
              <Settings className="size-4 text-muted" /> Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item className={item} onSelect={() => logout.mutate()}>
            <LogOut className="size-4 text-muted" /> Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
