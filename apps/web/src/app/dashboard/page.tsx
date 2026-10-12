// File: apps/web/src/app/dashboard/page.tsx
import type { Metadata } from "next";
import { TenantDashboard } from "../../components/dashboard/TenantDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function TenantDashboardPage() {
  return <TenantDashboard />;
}
