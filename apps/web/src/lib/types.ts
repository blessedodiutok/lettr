// Shapes of API responses as the web app uses them.
// Enums and constants come from @lettr/types; these describe enriched payloads.

import type { MoveInCost } from "@lettr/utils";

export type Role = "LANDLORD" | "TENANT" | "ADMIN";
export type ListingStatus = "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "TAKEN" | "SUSPENDED" | "ARCHIVED";
export type InquiryStatus =
  | "OPEN"
  | "RESPONDED"
  | "INSPECTION_SCHEDULED"
  | "INSPECTION_COMPLETED"
  | "OFFER_MADE"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED";
export type PaymentStatus = "PENDING" | "PROCESSING" | "IN_ESCROW" | "RELEASED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type VerificationStatus = "UNVERIFIED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface LandlordProfile {
  businessName: string | null;
  bio: string | null;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  averageRating: number;
  totalReviews: number;
  totalRentalsCompleted: number;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankAccountVerifiedAt: string | null;
}

export interface TenantProfile {
  occupation: string | null;
  employerName: string | null;
  monthlyIncome: number | null;
  numberOfOccupants: number | null;
  hasPets: boolean;
  petDescription: string | null;
  smokingHousehold: boolean;
  previousAddress: string | null;
  reasonForMoving: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nextOfKinRelation: string | null;
  averageRating: number;
  totalReviews: number;
}

export interface Me extends Person {
  email: string;
  phone: string | null;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  landlordProfile: LandlordProfile | null;
  tenantProfile: TenantProfile | null;
}

export interface Photo {
  id: string;
  url: string;
  altText: string | null;
  isCover: boolean;
  displayOrder: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  address: string;
  neighbourhood: string;
  lga: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  parkingSpaces: number;
  sizeInSqm: number | null;
  isFurnished: boolean;
  isServiced: boolean;
  isNewBuild: boolean;
  yearBuilt: number | null;
  photos: Photo[];
  amenities: Array<{ type: string; notes: string | null }>;
}

export interface Listing {
  id: string;
  propertyId: string;
  landlordId: string;
  status: ListingStatus;
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  availableFrom: string;
  minimumLeaseTerm: number;
  maximumOccupants: number | null;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  requiresEmployment: boolean;
  requiresGuarantor: boolean;
  additionalRequirements: string | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  property: Property;
  landlord: Person & {
    createdAt: string;
    landlordProfile: Pick<LandlordProfile, "verificationStatus" | "averageRating" | "totalReviews" | "totalRentalsCompleted" | "businessName"> | null;
  };
  moveInCost: MoveInCost;
  isSaved: boolean;
  openInquiries?: number;
  savedCount?: number;
}

export interface Paginated<T> {
  pagination: { page: number; limit: number; total: number; totalPages: number };
  listings?: T[];
  items?: T[];
}

export interface ListingSummary {
  id: string;
  status: ListingStatus;
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  availableFrom: string;
  property: {
    id: string;
    title: string;
    neighbourhood: string;
    lga: string;
    state: string;
    propertyType: string;
    photos: Array<{ url: string }>;
  };
}

export interface InspectionBooking {
  scheduledAt: string;
  notes: string | null;
  isConfirmed: boolean;
  isCompleted: boolean;
  proposedById: string | null;
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

export interface InquiryListItem {
  id: string;
  listingId: string;
  tenantId: string;
  landlordId: string;
  status: InquiryStatus;
  updatedAt: string;
  createdAt: string;
  offerExpiresAt: string | null;
  paymentDueAt: string | null;
  listing: ListingSummary;
  tenant: Person;
  landlord: Person;
  inspectionBooking: Pick<InspectionBooking, "scheduledAt" | "isConfirmed" | "isCompleted"> | null;
  lastMessage: { senderId: string; body: string; createdAt: string } | null;
  payment: { id: string; status: PaymentStatus } | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface InquiryThread {
  id: string;
  listingId: string;
  tenantId: string;
  landlordId: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  offerMadeAt: string | null;
  offerExpiresAt: string | null;
  offerNote: string | null;
  acceptedAt: string | null;
  paymentDueAt: string | null;
  closedReason: string | null;
  listing: ListingSummary;
  tenant: Person;
  landlord: Person;
  inspectionBooking: InspectionBooking | null;
  messages: Message[];
  viewerRole: "TENANT" | "LANDLORD";
  payment: { id: string; status: PaymentStatus; totalAmount: number } | null;
  tenancy: {
    id: string;
    tenantSignedAt: string | null;
    landlordSignedAt: string | null;
    handoverMarkedAt: string | null;
    moveInConfirmedAt: string | null;
    isHandoverConfirmed: boolean;
    cancelledAt: string | null;
  } | null;
  availableActions: InquiryAction[];
}

export interface Dispute {
  id: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  reason: string;
  outcome: string | null;
  resolution?: string | null;
  createdAt: string;
}

export type TenancyAction = "sign" | "markHandover" | "confirmMoveIn" | "dispute" | "cancel";

export interface Tenancy {
  id: string;
  listingId: string;
  tenantId: string;
  landlordId: string;
  agreementText: string;
  tenantSignedAt: string | null;
  landlordSignedAt: string | null;
  tenancyStartDate: string | null;
  tenancyEndDate: string | null;
  handoverMarkedAt: string | null;
  moveInConfirmedAt: string | null;
  autoReleaseAt: string | null;
  isHandoverConfirmed: boolean;
  handoverConfirmedAt: string | null;
  releaseMethod: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  listing: {
    id: string;
    status: ListingStatus;
    annualRent: number;
    cautionFee: number;
    serviceCharge: number;
    minimumLeaseTerm: number;
    property: { title: string; address: string; neighbourhood: string; lga: string; state: string; propertyType: string; photos: Array<{ url: string }> };
  };
  tenant: Person & { email: string; phone: string | null };
  landlord: Person & { email: string; phone: string | null };
  payments: TenancyPayment[];
}

export interface TenancyPayment {
  id: string;
  status: PaymentStatus;
  totalAmount: number;
  platformFee: number;
  createdAt: string;
  escrowReleasedAt: string | null;
  releaseError: string | null;
  refundedAt: string | null;
  receipt: { receiptNumber: string } | null;
  disputes: Dispute[];
}

export interface TenancyDetail extends Tenancy {
  viewerRole: "TENANT" | "LANDLORD" | "ADMIN";
  payment: TenancyPayment | null;
  landlordSignDeadline: string | null;
  availableActions: TenancyAction[];
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  platformFee: number;
  agentFeeSaved: number;
  totalAmount: number;
  landlordPayout: number;
  createdAt: string;
  escrowReleasedAt: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  refundReason: string | null;
  releaseError: string | null;
  paystackReference: string | null;
  receipt: { receiptNumber: string; issuedAt: string } | null;
  tenancyAgreement: { id: string; tenantSignedAt: string | null; landlordSignedAt: string | null; isHandoverConfirmed: boolean; autoReleaseAt: string | null; cancelledAt: string | null } | null;
  disputes: Dispute[];
  tenant: { id: string; firstName: string; lastName: string };
  listing: { id: string; landlordId: string; property: { title: string; neighbourhood: string; state: string; photos: Array<{ url: string }> } };
}

export interface CheckoutSession {
  paymentId: string;
  authorizationUrl: string;
  reference: string;
  simulated: boolean;
  paymentDueAt: string | null;
  breakdown: MoveInCost;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: { link?: string } | null;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  createdAt: string;
  reviewer: { firstName: string; lastName: string; avatarUrl: string | null };
}

export interface PublicLandlord extends Person {
  createdAt: string;
  landlordProfile: Pick<LandlordProfile, "businessName" | "bio" | "verificationStatus" | "averageRating" | "totalReviews" | "totalRentalsCompleted"> | null;
  reviewsReceived: Review[];
  listings: Listing[];
}

export interface VerificationDocument {
  id: string;
  documentType: string;
  status: VerificationStatus;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface Bank {
  name: string;
  code: string;
}
