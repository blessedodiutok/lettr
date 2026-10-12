import { PlaceholderPage } from "../../../components/PlaceholderPage";

export default function DashboardMessagesPage() {
  return (
    <PlaceholderPage
      title="Messages"
      description="Inquiry conversations will live here. The API already supports message threads, and this route prevents dashboard navigation from falling through to 404."
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
