// Tenancy agreement text. One generator for every agreement Lettr issues.
// NOTE: template wording must be reviewed by a Nigerian property lawyer before launch.

import { formatCurrency, formatDate, formatPropertyType, RENTAL_RULES } from "@lettr/utils";

export interface AgreementParams {
  landlordName: string;
  tenantName: string;
  propertyType: string;
  address: string;
  neighbourhood: string;
  lga: string;
  state: string;
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  startDate: Date;
  endDate: Date;
  leaseMonths: number;
  petsAllowed: boolean;
  smokingAllowed: boolean;
}

export function generateAgreementText(p: AgreementParams): string {
  const clauses = [
    `TERM. The tenancy runs for ${p.leaseMonths} months, from ${formatDate(p.startDate)} to ${formatDate(p.endDate)}.`,
    `RENT. The rent is ${formatCurrency(p.annualRent)} per year, paid in advance through Lettr. It is held in escrow and released to the Landlord ${RENTAL_RULES.autoReleaseDays} days after handover, or earlier when the Tenant confirms they have the keys.`,
    `CAUTION FEE. The Tenant pays a refundable caution fee of ${formatCurrency(p.cautionFee)}. The Landlord returns it within 30 days of the tenancy ending, less the documented cost of any damage beyond fair wear and tear.`,
    p.serviceCharge > 0
      ? `SERVICE CHARGE. A service charge of ${formatCurrency(p.serviceCharge)} for the first year is included in the amount paid.`
      : null,
    "USE. The Tenant will use the property as a private home only and will not sublet it without the Landlord's written consent.",
    "REPAIRS. The Landlord keeps the structure, roof, plumbing and electrical installation in good repair. The Tenant keeps the interior clean and reports defects promptly.",
    `PETS AND SMOKING. Pets are ${p.petsAllowed ? "allowed" : "not allowed"}. Smoking inside the property is ${p.smokingAllowed ? "allowed" : "not allowed"}.`,
    "ACCESS. The Landlord gives at least 24 hours' notice before entering, except in an emergency.",
    "NOTICE. Either party may end the tenancy at the end of the term by giving written notice in line with the Lagos State Tenancy Law 2011 or the tenancy law of the state where the property is located.",
    "DISPUTES. Either party may raise a dispute through Lettr. Escrowed funds are paused until it is resolved.",
    "NO AGENT FEE. This tenancy was arranged directly between the parties through Lettr. No agency or commission fee was charged.",
  ].filter((clause): clause is string => Boolean(clause));

  return [
    "RESIDENTIAL TENANCY AGREEMENT",
    "",
    `LANDLORD: ${p.landlordName}`,
    `TENANT: ${p.tenantName}`,
    `PROPERTY: ${formatPropertyType(p.propertyType)} at ${p.address}, ${p.neighbourhood}, ${p.lga}, ${p.state}`,
    "",
    ...clauses.map((clause, index) => `${index + 1}. ${clause}`),
    "",
    "Both parties sign this agreement electronically on Lettr. Each signature is recorded with the date and time it was made.",
  ].join("\n");
}

export function tenancyPeriod(availableFrom: Date, leaseMonths: number, now = new Date()) {
  const start = availableFrom > now ? availableFrom : now;
  const end = new Date(start);
  end.setMonth(end.getMonth() + leaseMonths);
  end.setDate(end.getDate() - 1);
  return { start, end };
}
