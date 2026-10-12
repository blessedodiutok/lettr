import type { Metadata } from "next";
import { ContentPage, Prose } from "../../../components/layout/ContentPage";

export const metadata: Metadata = { title: "About Lettr" };

export default function AboutPage() {
  return (
    <ContentPage eyebrow="About" title="Renting in Nigeria, without the middlemen" notice="Draft copy — review the company story and details before launch.">
      <Prose>
        <p>
          Finding a home in Lagos, Abuja or Port Harcourt usually means paying an agent 10–15% of a year&apos;s rent, an inspection fee for every viewing, and handing over a year&apos;s rent to someone you&apos;ve just met. Lettr exists to remove all three.
        </p>
        <h2>What we do</h2>
        <p>
          Lettr connects tenants directly with landlords who have verified their identity. Tenants pay into escrow through Paystack, both sides sign a tenancy agreement online, and the landlord is paid when the tenant confirms they have the keys.
        </p>
        <h2>How we make money</h2>
        <p>Tenants pay a 3% fee on the annual rent. Landlords list for free. We don&apos;t charge inspection fees and we don&apos;t take a cut of the caution fee.</p>
        <p>Lettr Technologies Ltd is based in Lagos, Nigeria.</p>
      </Prose>
    </ContentPage>
  );
}
