// File: apps/web/src/app/landlord/dashboard/page.tsx
import type { Metadata } from "next";
import { LandlordDashboard } from "../../../components/dashboard/LandlordDashboard";

export const metadata: Metadata = {
  title: "My Portfolio",
};

export default function LandlordDashboardPage() {
  return <LandlordDashboard />;
}
