import type { Metadata } from "next";
import { ContentPage, Prose } from "../../../components/layout/ContentPage";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy policy"
      notice="Draft for legal review. Written to follow the Nigeria Data Protection Act 2023; a qualified lawyer must review it, and the company details and Data Protection Officer contact must be completed, before launch."
    >
      <Prose>
        <p>
          This policy explains what personal data Lettr Technologies Ltd (&ldquo;Lettr&rdquo;) collects, why, and the rights you have under the Nigeria Data Protection Act 2023.
        </p>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details</strong>: name, email address, phone number and password (stored only as a secure hash).</li>
          <li><strong>Tenant profile</strong>: occupation, employer, income range, household details and next of kin, if you choose to provide them.</li>
          <li><strong>Landlord verification</strong>: a government ID document and its number, and your bank account for payouts.</li>
          <li><strong>Activity</strong>: listings, messages, inspection bookings, agreements, payments and reviews.</li>
          <li><strong>Technical data</strong>: device and browser information and IP address, used for security.</li>
        </ul>
        <h2>Why we use it</h2>
        <ul>
          <li>To provide the service you signed up for (contract).</li>
          <li>To verify identities, prevent fraud and keep escrowed money safe (legitimate interest and legal obligation).</li>
          <li>To meet record-keeping duties for payments (legal obligation).</li>
          <li>To send service messages about your rental. Marketing messages are sent only with your consent.</li>
        </ul>
        <h2>Who we share it with</h2>
        <p>
          The other party to your rental sees the details needed to complete it. We use Paystack for payments, Cloudinary for file storage, and email and push providers to send messages. Each processes data only on our instructions. We never sell personal data.
        </p>
        <h2>Identity documents</h2>
        <p>Verification documents are stored privately, can only be opened by authorised staff through time-limited links, and every access is logged.</p>
        <h2>How long we keep it</h2>
        <p>We keep account data while your account is open. Payment and tenancy records are kept for six years to meet financial record-keeping obligations, then deleted or anonymised.</p>
        <h2>Your rights</h2>
        <p>
          You can ask to access, correct or delete your data, object to processing, or ask us to restrict it. You can also complain to the Nigeria Data Protection Commission. To exercise a right, email privacy@lettr.ng.
        </p>
      </Prose>
    </ContentPage>
  );
}
