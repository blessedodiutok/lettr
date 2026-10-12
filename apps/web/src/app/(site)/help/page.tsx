import { RENTAL_RULES } from "@lettr/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "../../../components/layout/ContentPage";

export const metadata: Metadata = { title: "Help", description: "Answers to common questions from tenants and landlords on Lettr." };

const SECTIONS = [
  {
    id: "tenants",
    title: "For tenants",
    items: [
      ["Why can't I pay straight away?", "Payment opens once the landlord offers you the home and you accept. That stops two people paying for the same home and makes sure you've spoken to the landlord first."],
      ["What exactly do I pay?", "The annual rent, a refundable caution fee, any service or legal charge the landlord lists, and Lettr's 3% fee. The total is shown on the listing before you start."],
      ["When does the landlord get my money?", `When you confirm you have the keys, or automatically ${RENTAL_RULES.autoReleaseDays} days after the landlord marks the handover if you haven't raised a problem.`],
      ["What if the landlord doesn't sign?", `If they haven't signed within ${RENTAL_RULES.landlordSignDays} days of your payment, you can cancel from your tenancy page and get a full refund.`],
      ["How long do refunds take?", "Paystack refunds usually reach your bank within 5–10 working days."],
    ],
  },
  {
    id: "landlords",
    title: "For landlords",
    items: [
      ["Does it cost anything to list?", "No. Tenants pay Lettr's fee. You receive the rent, caution fee and any charges you listed."],
      ["Why do I need to verify my ID?", "Tenants are trusting you with a year's rent. A verified ID earns the badge on your listings, and you need to submit one before your first listing goes live."],
      ["When am I paid?", `As soon as the tenant confirms they have the keys, or ${RENTAL_RULES.autoReleaseDays} days after you mark the handover. Add your bank account under Payouts so it arrives without delay.`],
      ["Can I offer the home to more than one tenant?", "Yes. The first tenant to accept holds the home while they pay. If they don't pay in time, the home goes back on the market."],
    ],
  },
];

export default function HelpPage() {
  return (
    <ContentPage eyebrow="Help centre" title="How can we help?" intro={<>Can&apos;t find your answer? <Link href="/contact" className="font-semibold text-navy hover:underline">Contact us</Link> — we reply within one working day.</>}>
      <div className="grid gap-12">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="font-display text-2xl font-medium text-ink">{section.title}</h2>
            <div className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
              {section.items.map(([q, a]) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {q}
                      <span className="text-muted transition-transform group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-[15px] text-ink-2">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ContentPage>
  );
}
