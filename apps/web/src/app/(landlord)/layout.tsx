import { AppShell } from "../../components/layout/AppShell";

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return <AppShell roles={["LANDLORD"]}>{children}</AppShell>;
}
