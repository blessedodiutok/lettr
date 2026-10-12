// API response shapes used by the app (mirrors apps/web/src/lib/types.ts).

import type { MoveInCost } from "@lettr/utils";

export type Role = "LANDLORD" | "TENANT" | "ADMIN";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface Me extends Person {
  email: string;
  phone: string | null;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string;
  landlordProfile: {
    verificationStatus: string;
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    bankAccountVerifiedAt: string | null;
  } | null;
  tenantProfile: { occupation: string | null; employerName: string | null } | null;
}

export interface Photo {
  id: string;
  url: string;
  altText: string | null;
  isCover: boolean;
  displayOrder: number;
}

export interface Listing {
  id: string;
  landlordId: string;
  status: string;
  annualRent: number;
  cautionFee: number;
  availableFrom: string;
  minimumLeaseTerm: number;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  viewCount: number;
  property: {
    id: string;
    title: string;
    description: string;
    propertyType: string;
    neighbourhood: string;
    lga: string;
    state: string;
    bedrooms: number;
    bathrooms: number;
    toilets: number;
    parkingSpaces: number;
    isFurnished: boolean;
    isServiced: boolean;
    photos: Photo[];
    amenities: Array<{ type: string }>;
  };
  landlord: Person & {
    landlordProfile: { verificationStatus: string; averageRating: number; totalReviews: number; totalRentalsCompleted: number } | null;
  };
  moveInCost: MoveInCost;
  isSaved: boolean;
  openInquiries?: number;
}

export type InquiryAction =
  | "message"
  | "scheduleInspection"
  | "confirmInspection"
  | "completeInspection"
  | "makeOffer"
  | "withdrawOffer"
  | "acceptOffer"
  | "declineOffer"
  | "close";

interface ListingSummary {
  id: string;
  status: string;
  annualRent: number;
  property: { title: string; neighbourhood: string; state: string; photos: Array<{ url: string }> };
}

export interface InquiryListItem {
  id: string;
  listingId: string;
  status: string;
  updatedAt: string;
  listing: ListingSummary;
  tenant: Person;
  landlord: Person;
  lastMessage: { senderId: string; body: string; createdAt: string } | null;
  unreadCount: number;
}

export interface InquiryThread {
  id: string;
  listingId: string;
  tenantId: string;
  status: string;
  createdAt: string;
  offerExpiresAt: string | null;
  offerNote: string | null;
  paymentDueAt: string | null;
  closedReason: string | null;
  listing: ListingSummary;
  tenant: Person;
  landlord: Person;
  inspectionBooking: { scheduledAt: string; notes: string | null; isConfirmed: boolean; isCompleted: boolean; proposedById: string | null } | null;
  messages: Array<{ id: string; senderId: string; body: string; createdAt: string; readAt: string | null }>;
  viewerRole: "TENANT" | "LANDLORD";
  payment: { id: string; status: string; totalAmount: number } | null;
  tenancy: { id: string; tenantSignedAt: string | null; landlordSignedAt: string | null; isHandoverConfirmed: boolean } | null;
  availableActions: InquiryAction[];
}

export interface TenancyPayment {
  id: string;
  status: string;
  totalAmount: number;
  platformFee: number;
  createdAt: string;
  receipt: { receiptNumber: string } | null;
  disputes: Array<{ id: string; status: string; reason: string }>;
}

export interface Tenancy {
  id: string;
  listingId: string;
  agreementText: string;
  tenantSignedAt: string | null;
  landlordSignedAt: string | null;
  tenancyStartDate: string | null;
  tenancyEndDate: string | null;
  handoverMarkedAt: string | null;
  moveInConfirmedAt: string | null;
  autoReleaseAt: string | null;
  isHandoverConfirmed: boolean;
  cancelledAt: string | null;
  createdAt: string;
  listing: { id: string; annualRent: number; property: { title: string; address: string; neighbourhood: string; state: string; photos: Array<{ url: string }> } };
  tenant: Person & { email: string; phone: string | null };
  landlord: Person & { email: string; phone: string | null };
  payments: TenancyPayment[];
}

export interface TenancyDetail extends Tenancy {
  viewerRole: "TENANT" | "LANDLORD" | "ADMIN";
  payment: TenancyPayment | null;
  landlordSignDeadline: string | null;
  availableActions: Array<"sign" | "markHandover" | "confirmMoveIn" | "dispute" | "cancel">;
}

export interface Payment {
  id: string;
  status: string;
  totalAmount: number;
  landlordPayout: number;
  createdAt: string;
  receipt: { receiptNumber: string } | null;
  tenancyAgreement: { id: string; autoReleaseAt: string | null } | null;
  tenant: { firstName: string; lastName: string };
  listing: { id: string; property: { title: string } };
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data: { link?: string } | null;
  isRead: boolean;
  createdAt: string;
}
