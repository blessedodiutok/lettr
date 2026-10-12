import { RENTAL_RULES } from "@lettr/utils";
import type { Metadata } from "next";
import { ContentPage, Prose } from "../../../components/layout/ContentPage";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Terms of service"
      notice="Draft for legal review. These terms describe how the product works today; a qualified lawyer must review them before launch."
    >
      <Prose>
        <h2>1. The service</h2>
        <p>Lettr is a marketplace where landlords list homes and tenants rent them directly. Lettr is not a party to the tenancy itself, which is between the landlord and the tenant.</p>
        <h2>2. Accounts</h2>
        <p>You must give accurate information and keep your password secure. Landlords must verify their identity before publishing a listing and must have the right to let the property.</p>
        <h2>3. Listings</h2>
        <p>Listings must describe the property honestly, with real photos and all fees shown. We may suspend listings that are misleading or break these terms.</p>
        <h2>4. Offers, payment and escrow</h2>
        <ul>
          <li>A tenant can pay only after accepting the landlord&apos;s offer. Offers last {RENTAL_RULES.offerValidDays} days; after accepting, the tenant has {RENTAL_RULES.paymentWindowHours} hours to pay.</li>
          <li>Payments are processed by Paystack and held by Lettr until release.</li>
          <li>Funds are released when the tenant confirms move-in, or {RENTAL_RULES.autoReleaseDays} days after the landlord marks the handover if the tenant hasn&apos;t raised a dispute.</li>
          <li>If the landlord hasn&apos;t signed the agreement within {RENTAL_RULES.landlordSignDays} days of payment, the tenant may cancel for a full refund.</li>
        </ul>
        <h2>5. Fees</h2>
        <p>Tenants pay a fee of 3% of the annual rent, shown before payment. Listing is free for landlords.</p>
        <h2>6. Disputes</h2>
        <p>Either party may raise a dispute while funds are held. Lettr reviews the evidence and may refund the tenant, release the funds, or take no action. Our decision on escrowed funds is final, without affecting your legal rights.</p>
        <h2>7. Liability</h2>
        <p>Lettr is not responsible for the condition of a property or the conduct of landlords or tenants, except where the law says otherwise.</p>
        <h2>8. Governing law</h2>
        <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
      </Prose>
    </ContentPage>
  );
}
