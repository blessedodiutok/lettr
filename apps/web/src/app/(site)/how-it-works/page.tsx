import { RENTAL_RULES } from "@lettr/utils";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, Prose } from "../../../components/layout/ContentPage";
import { Button } from "../../../components/ui/button";

export const metadata: Metadata = {
  title: "How escrow works",
  description: "How Lettr holds your rent in escrow until you have the keys, and when the landlord is paid.",
};

const STAGES = [
  {
    title: "You talk to the landlord directly",
    body: "Message them from the listing, ask questions, and book an inspection. Nobody charges you for the conversation.",
  },
  {
    title: "The landlord makes you an offer",
    body: `When you're both happy, the landlord offers you the home. The offer stays open for ${RENTAL_RULES.offerValidDays} days.`,
  },
  {
    title: "You accept and the home is held for you",
    body: `Accepting takes the home off the market. You have ${RENTAL_RULES.paymentWindowHours} hours to pay, which leaves room for bank transfer limits on large amounts.`,
  },
  {
    title: "You pay into escrow through Paystack",
    body: "You pay by card, bank transfer or USSD. The money is held by Lettr, not the landlord. You see the full amount, including our 3% fee, before you pay.",
  },
  {
    title: "You both sign the agreement",
    body: `The tenancy agreement is generated from the listing's terms. Both of you sign on Lettr. If the landlord hasn't signed within ${RENTAL_RULES.landlordSignDays} days, you can cancel for a full refund.`,
  },
  {
    title: "You confirm you have the keys",
    body: `Once the landlord marks the handover, you confirm. That releases the rent to the landlord. If you neither confirm nor raise a problem within ${RENTAL_RULES.autoReleaseDays} days, it releases automatically.`,
  },
];

export default function HowItWorksPage() {
  return (
    <ContentPage
      eyebrow="For tenants"
      title="Your rent stays in escrow until you have the keys"
      intro="Paying a year's rent upfront to someone you've just met is the riskiest moment in renting. Escrow takes that risk away."
      aside={
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="font-semibold text-ink">If something goes wrong</p>
          <p className="mt-2 text-sm text-muted">
            Raise a dispute from your tenancy page at any point before the money is released. The payout pauses while our team reviews it, and we can refund you or release it based on what we find.
          </p>
          <Button asChild className="mt-4" block>
            <Link href="/listings">Find a home</Link>
          </Button>
        </div>
      }
    >
      <ol className="relative grid gap-8 border-l-2 border-line pl-8">
        {STAGES.map((stage, i) => (
          <li key={stage.title} className="relative">
            <span className="absolute -left-[45px] grid size-7 place-items-center rounded-full bg-navy text-[13px] font-bold text-on-navy">{i + 1}</span>
            <h2 className="text-lg font-semibold text-ink">{stage.title}</h2>
            <p className="mt-1 text-[15px] text-ink-2">{stage.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12">
        <Prose>
          <h2>What the fee covers</h2>
          <p>
            Lettr charges tenants 3% of the annual rent. It pays for escrow, payment processing, the tenancy agreement and dispute handling. Landlords list for free. A traditional agent typically charges 10–15% and offers none of these protections.
          </p>
          <h2>The caution fee</h2>
          <p>
            The caution fee is a refundable deposit. It&apos;s paid to the landlord with the rent when escrow is released, and the agreement says it must be returned within 30 days of the tenancy ending, less the documented cost of any damage beyond normal wear and tear.
          </p>
        </Prose>
      </div>
    </ContentPage>
  );
}
