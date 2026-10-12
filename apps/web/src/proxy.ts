// Route guard. Uses the `lettr_role` hint cookie set by the API at login to
// redirect early; the API still authorises every request itself.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Role = "tenant" | "landlord" | "admin";

const HOME: Record<Role, string> = { tenant: "/dashboard", landlord: "/landlord/dashboard", admin: "/admin" };

/** Areas only one role may use; anything else listed in `matcher` needs any signed-in user. */
const ROLE_AREAS: Array<{ prefix: string; role: Role }> = [
  { prefix: "/dashboard", role: "tenant" },
  { prefix: "/pay", role: "tenant" },
  { prefix: "/landlord", role: "landlord" },
  { prefix: "/admin", role: "admin" },
];

const AUTH_PAGES = ["/auth/login", "/auth/signup"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const role = request.cookies.get("lettr_role")?.value as Role | undefined;

  if (AUTH_PAGES.includes(pathname)) {
    return role && HOME[role] ? NextResponse.redirect(new URL(HOME[role], request.url)) : NextResponse.next();
  }

  if (!role || !HOME[role]) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  const area = ROLE_AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  if (area && area.role !== role) return NextResponse.redirect(new URL(HOME[role], request.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/landlord/:path*",
    "/admin/:path*",
    "/messages/:path*",
    "/tenancies/:path*",
    "/notifications",
    "/settings/:path*",
    "/pay/:path*",
    "/auth/login",
    "/auth/signup",
  ],
};
