import type { Metadata } from "next";
import { ListingEditor } from "../../../../../components/landlord/ListingEditor";
import { PageHeader } from "../../../../../components/ui/display";

export const metadata: Metadata = { title: "New listing" };

export default function NewListingPage() {
  return (
    <>
      <PageHeader title="List a home" description="Save the details as a draft, add photos, then publish. It takes about ten minutes." />
      <ListingEditor />
    </>
  );
}
