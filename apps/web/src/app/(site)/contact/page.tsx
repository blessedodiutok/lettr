import type { Metadata } from "next";
import { ContentPage } from "../../../components/layout/ContentPage";

export const metadata: Metadata = { title: "Contact" };

const CHANNELS = [
  { label: "Email", value: "hello@lettr.ng", note: "We reply within one working day" },
  { label: "Payments and disputes", value: "support@lettr.ng", note: "Include your receipt number (LTR-…)" },
  { label: "Phone", value: "+234 800 000 0000", note: "Monday to Friday, 9am–5pm WAT" },
];

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Talk to the Lettr team"
      intro="For anything about a payment or tenancy, raising it from the tenancy page is fastest — it pauses the payout and gives us the full history."
      notice="Sample contact details — replace the email addresses and phone number with real ones before launch."
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <div key={channel.label} className="rounded-card border border-line bg-surface p-5">
            <dt className="eyebrow">{channel.label}</dt>
            <dd className="mt-2 select-all text-lg font-semibold text-ink">{channel.value}</dd>
            <dd className="mt-1 text-sm text-muted">{channel.note}</dd>
          </div>
        ))}
        <div className="rounded-card border border-line bg-surface p-5">
          <dt className="eyebrow">Office</dt>
          <dd className="mt-2 text-[15px] text-ink">Lettr Technologies Ltd, Lagos, Nigeria</dd>
        </div>
      </dl>
    </ContentPage>
  );
}
