// File: packages/types/src/index.ts
// All shared TypeScript interfaces and enums for the Lettr platform.
// These mirror the Prisma schema exactly so the API, web, and mobile
// all speak the same type language with zero duplication.

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export enum UserRole {
  LANDLORD = 'LANDLORD',
  TENANT   = 'TENANT',
  ADMIN    = 'ADMIN',
}

export enum PropertyType {
  SELF_CONTAINED = 'SELF_CONTAINED',
  MINI_FLAT      = 'MINI_FLAT',
  ONE_BEDROOM    = 'ONE_BEDROOM',
  TWO_BEDROOM    = 'TWO_BEDROOM',
  THREE_BEDROOM  = 'THREE_BEDROOM',
  FOUR_BEDROOM   = 'FOUR_BEDROOM',
  DUPLEX         = 'DUPLEX',
  BUNGALOW       = 'BUNGALOW',
  BOYS_QUARTERS  = 'BOYS_QUARTERS',
  MANSION        = 'MANSION',
  PENTHOUSE      = 'PENTHOUSE',
  STUDIO         = 'STUDIO',
  TERRACE        = 'TERRACE',
  SEMI_DETACHED  = 'SEMI_DETACHED',
  DETACHED       = 'DETACHED',
}

export enum ListingStatus {
  DRAFT       = 'DRAFT',
  ACTIVE      = 'ACTIVE',
  UNDER_OFFER = 'UNDER_OFFER',
  TAKEN       = 'TAKEN',
  SUSPENDED   = 'SUSPENDED',
  ARCHIVED    = 'ARCHIVED',
}

export enum PaymentStatus {
  PENDING             = 'PENDING',
  PROCESSING          = 'PROCESSING',
  IN_ESCROW           = 'IN_ESCROW',
  RELEASED            = 'RELEASED',
  FAILED              = 'FAILED',
  REFUNDED            = 'REFUNDED',
  PARTIALLY_REFUNDED  = 'PARTIALLY_REFUNDED',
}

export enum VerificationStatus {
  UNVERIFIED      = 'UNVERIFIED',
  PENDING_REVIEW  = 'PENDING_REVIEW',
  VERIFIED        = 'VERIFIED',
  REJECTED        = 'REJECTED',
}

export enum InquiryStatus {
  OPEN                   = 'OPEN',
  RESPONDED              = 'RESPONDED',
  INSPECTION_SCHEDULED   = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED   = 'INSPECTION_COMPLETED',
  OFFER_MADE             = 'OFFER_MADE',
  ACCEPTED               = 'ACCEPTED',
  DECLINED               = 'DECLINED',
  EXPIRED                = 'EXPIRED',
}

export enum MaintenanceStatus {
  OPEN         = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS  = 'IN_PROGRESS',
  RESOLVED     = 'RESOLVED',
  DISPUTED     = 'DISPUTED',
  CLOSED       = 'CLOSED',
}

export enum AmenityType {
  PREPAID_ELECTRICITY  = 'PREPAID_ELECTRICITY',
  POSTPAID_ELECTRICITY = 'POSTPAID_ELECTRICITY',
  CONSTANT_ELECTRICITY = 'CONSTANT_ELECTRICITY',
  WATER_SUPPLY         = 'WATER_SUPPLY',
  BOREHOLE             = 'BOREHOLE',
  INTERNET_FIBRE       = 'INTERNET_FIBRE',
  INTERNET_CABLE       = 'INTERNET_CABLE',
  SECURITY_GUARD       = 'SECURITY_GUARD',
  CCTV                 = 'CCTV',
  GATED_ESTATE         = 'GATED_ESTATE',
  INTERCOM             = 'INTERCOM',
  PARKING_SPACE        = 'PARKING_SPACE',
  SWIMMING_POOL        = 'SWIMMING_POOL',
  GYM                  = 'GYM',
  PLAYGROUND           = 'PLAYGROUND',
  GENERATOR_COMMON     = 'GENERATOR_COMMON',
  GENERATOR_PRIVATE    = 'GENERATOR_PRIVATE',
  GAS_COOKER           = 'GAS_COOKER',
  WASHING_MACHINE_POINT = 'WASHING_MACHINE_POINT',
  AIR_CONDITIONING     = 'AIR_CONDITIONING',
  CEILING_FAN          = 'CEILING_FAN',
  GARDEN               = 'GARDEN',
  BALCONY              = 'BALCONY',
  ROOFTOP_TERRACE      = 'ROOFTOP_TERRACE',
  SERVANTS_QUARTERS    = 'SERVANTS_QUARTERS',
}

export enum NotificationType {
  INQUIRY_RECEIVED       = 'INQUIRY_RECEIVED',
  INQUIRY_RESPONDED      = 'INQUIRY_RESPONDED',
  INSPECTION_SCHEDULED   = 'INSPECTION_SCHEDULED',
  INSPECTION_REMINDER    = 'INSPECTION_REMINDER',
  OFFER_MADE             = 'OFFER_MADE',
  PAYMENT_INITIATED      = 'PAYMENT_INITIATED',
  PAYMENT_CONFIRMED      = 'PAYMENT_CONFIRMED',
  FUNDS_IN_ESCROW        = 'FUNDS_IN_ESCROW',
  FUNDS_RELEASED         = 'FUNDS_RELEASED',
  PAYMENT_FAILED         = 'PAYMENT_FAILED',
  HANDOVER_CONFIRMED     = 'HANDOVER_CONFIRMED',
  AGREEMENT_READY        = 'AGREEMENT_READY',
  AGREEMENT_SIGNED       = 'AGREEMENT_SIGNED',
  MAINTENANCE_REQUEST    = 'MAINTENANCE_REQUEST',
  MAINTENANCE_UPDATE     = 'MAINTENANCE_UPDATE',
  VERIFICATION_APPROVED  = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED  = 'VERIFICATION_REJECTED',
  REVIEW_RECEIVED        = 'REVIEW_RECEIVED',
  SYSTEM                 = 'SYSTEM',
}

// ─────────────────────────────────────────────
// BASE
// ─────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO 8601 date string — dates are strings over the wire
  updatedAt: string;
}

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

export interface User extends BaseEntity {
  email: string;
  phone: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  landlordProfile?: LandlordProfile | null;
  tenantProfile?: TenantProfile | null;
}

/** Safe public view of a user — no sensitive fields */
export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
}

export interface LandlordProfile extends BaseEntity {
  userId: string;
  businessName: string | null;
  bio: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  totalListings: number;
  totalRentalsCompleted: number;
  averageRating: number;
  totalReviews: number;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankCode: string | null;
  paystackSubAccountCode: string | null;
}

export interface TenantProfile extends BaseEntity {
  userId: string;
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

// ─────────────────────────────────────────────
// PROPERTY
// ─────────────────────────────────────────────

export interface PropertyPhoto extends BaseEntity {
  propertyId: string;
  url: string;
  publicId: string;
  altText: string | null;
  isCover: boolean;
  displayOrder: number;
}

export interface Amenity extends BaseEntity {
  propertyId: string;
  type: AmenityType;
  notes: string | null;
}

export interface Property extends BaseEntity {
  landlordId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
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
  photos: PropertyPhoto[];
  amenities: Amenity[];
}

// ─────────────────────────────────────────────
// LISTING
// ─────────────────────────────────────────────

export interface Listing extends BaseEntity {
  propertyId: string;
  landlordId: string;
  status: ListingStatus;
  annualRent: number;
  cautionFee: number;
  agencyFee: number;
  serviceCharge: number;
  legalFee: number;
  availableFrom: string;
  minimumLeaseTerm: number;
  maximumOccupants: number | null;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  viewCount: number;
  publishedAt: string | null;
  takenAt: string | null;
  requiresEmployment: boolean;
  requiresGuarantor: boolean;
  additionalRequirements: string | null;
  property: Property;
  landlord: PublicUser & {
    landlordProfile: Pick<
      LandlordProfile,
      'verificationStatus' | 'averageRating' | 'totalReviews' | 'totalRentalsCompleted'
    > | null;
  };
  // Computed fields added by the API service layer
  agentFeeSaved?: number;
  platformFee?: number;
  savings?: number;
  isSaved?: boolean;
}

/** Minimal listing data returned for map pins */
export interface ListingMapPin {
  id: string;
  annualRent: number;
  property: {
    latitude: number | null;
    longitude: number | null;
    propertyType: PropertyType;
    neighbourhood: string;
    photos: Array<{ url: string }>;
  };
}

export interface ListingSearchParams {
  state?: string;
  lga?: string;
  neighbourhood?: string;
  propertyType?: PropertyType | string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  isFurnished?: boolean;
  isServiced?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'popular' | 'price_asc' | 'price_desc' | 'newest';
}

export interface PaginatedListings {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────────
// INQUIRY
// ─────────────────────────────────────────────

export interface InquiryMessage {
  id?: string;
  inquiryId?: string;
  senderId: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

export interface InspectionBooking extends BaseEntity {
  inquiryId: string;
  scheduledAt: string;
  notes: string | null;
  isConfirmed: boolean;
  isCompleted: boolean;
  cancellationReason: string | null;
}

export interface Inquiry extends BaseEntity {
  listingId: string;
  tenantId: string;
  landlordId: string;
  status: InquiryStatus;
  initialMessage: string;
  offerMadeAt: string | null;
  offerExpiresAt: string | null;
  offerNote: string | null;
  acceptedAt: string | null;
  paymentDueAt: string | null;
  closedAt: string | null;
  closedReason: string | null;
  messages: InquiryMessage[];
  listing?: Pick<Listing, 'id' | 'annualRent' | 'status'> & {
    property: Pick<Property, 'title' | 'neighbourhood' | 'state' | 'photos'>;
  };
  tenant?: PublicUser;
  landlord?: PublicUser;
  inspectionBooking?: InspectionBooking | null;
}

// ─────────────────────────────────────────────
// TENANCY
// ─────────────────────────────────────────────

export interface TenancyAgreement extends BaseEntity {
  listingId: string;
  tenantId: string;
  landlordId: string;
  agreementText: string;
  documentUrl: string | null;
  tenantSignedAt: string | null;
  landlordSignedAt: string | null;
  tenancyStartDate: string | null;
  tenancyEndDate: string | null;
  handoverConfirmedAt: string | null;
  isHandoverConfirmed: boolean;
  handoverMarkedAt: string | null;
  moveInConfirmedAt: string | null;
  autoReleaseAt: string | null;
  releaseMethod: 'TENANT_CONFIRMED' | 'AUTO' | 'ADMIN' | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  listing?: Pick<Listing, 'id' | 'annualRent'> & {
    property: Pick<Property, 'title' | 'address' | 'photos'>;
  };
  tenant?: PublicUser;
  landlord?: PublicUser;
}

// ─────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────

export interface Receipt extends BaseEntity {
  paymentId: string;
  receiptNumber: string;
  documentUrl: string | null;
  issuedAt: string;
}

export interface Payment extends BaseEntity {
  listingId: string;
  tenantId: string;
  tenancyAgreementId: string | null;
  inquiryId: string | null;
  status: PaymentStatus;
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  platformFee: number;
  agentFeeSaved: number;
  totalAmount: number;
  currency: string;
  paystackReference: string | null;
  paystackAccessCode: string | null;
  escrowReleasedAt: string | null;
  paystackTransferCode: string | null;
  transferReference: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  refundAmount: number | null;
  releaseError: string | null;
  receipt?: Receipt | null;
  listing?: Pick<Listing, 'id'> & {
    property: Pick<Property, 'title' | 'address' | 'photos'>;
  };
}

export interface PaymentBreakdown {
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  platformFee: number;
  agentFeeSaved: number;
  totalAmount: number;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  breakdown: PaymentBreakdown;
}

// ─────────────────────────────────────────────
// REVIEW
// ─────────────────────────────────────────────

export interface Review extends BaseEntity {
  listingId: string | null;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  reviewer?: PublicUser;
}

// ─────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  isRead: boolean;
  readAt: string | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ─────────────────────────────────────────────
// MAINTENANCE
// ─────────────────────────────────────────────

export interface MaintenanceRequest extends BaseEntity {
  tenantId: string;
  propertyAddress: string;
  category: string;
  description: string;
  photoUrls: string[];
  status: MaintenanceStatus;
  landlordNotes: string | null;
  resolvedAt: string | null;
}

// ─────────────────────────────────────────────
// VERIFICATION
// ─────────────────────────────────────────────

export interface VerificationDocument extends BaseEntity {
  userId: string;
  documentType: string;
  documentNumber: string | null;
  documentUrl: string;
  publicId: string;
  status: VerificationStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

// ─────────────────────────────────────────────
// API RESPONSE WRAPPERS
// ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export interface SignupResponse {
  userId: string;
  message: string;
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface PaymentDispute extends BaseEntity {
  paymentId: string;
  openedById: string;
  reason: string;
  status: DisputeStatus;
  resolution: string | null;
  outcome: 'REFUND_TENANT' | 'RELEASE_TO_LANDLORD' | 'NO_ACTION' | null;
  resolvedById: string | null;
  resolvedAt: string | null;
}

// ─────────────────────────────────────────────
// DOMAIN CONSTANTS
// Single source for labels and option lists used by the API, web and mobile.
// ─────────────────────────────────────────────

/** All 36 states plus the Federal Capital Territory, as stored on properties. */
export const NIGERIAN_STATES = [
  'Abia', 'Abuja (FCT)', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe',
  'Zamfara',
] as const;
export type NigerianState = (typeof NIGERIAN_STATES)[number];

/** States where Lettr is launching — shown first in pickers. */
export const LAUNCH_STATES: readonly NigerianState[] = ['Lagos', 'Abuja (FCT)', 'Rivers'];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  SELF_CONTAINED: 'Self-contained',
  MINI_FLAT: 'Mini flat',
  ONE_BEDROOM: '1-bedroom flat',
  TWO_BEDROOM: '2-bedroom flat',
  THREE_BEDROOM: '3-bedroom flat',
  FOUR_BEDROOM: '4-bedroom flat',
  DUPLEX: 'Duplex',
  BUNGALOW: 'Bungalow',
  BOYS_QUARTERS: "Boys' quarters",
  MANSION: 'Mansion',
  PENTHOUSE: 'Penthouse',
  STUDIO: 'Studio',
  TERRACE: 'Terrace',
  SEMI_DETACHED: 'Semi-detached house',
  DETACHED: 'Detached house',
};

export const AMENITY_GROUPS: ReadonlyArray<{ label: string; items: ReadonlyArray<{ type: AmenityType; label: string }> }> = [
  { label: 'Power and water', items: [
    { type: AmenityType.PREPAID_ELECTRICITY, label: 'Prepaid meter' },
    { type: AmenityType.POSTPAID_ELECTRICITY, label: 'Postpaid meter' },
    { type: AmenityType.CONSTANT_ELECTRICITY, label: '24-hour power' },
    { type: AmenityType.GENERATOR_COMMON, label: 'Estate generator' },
    { type: AmenityType.GENERATOR_PRIVATE, label: 'Private generator' },
    { type: AmenityType.WATER_SUPPLY, label: 'Running water' },
    { type: AmenityType.BOREHOLE, label: 'Borehole' },
  ] },
  { label: 'Security', items: [
    { type: AmenityType.SECURITY_GUARD, label: 'Security guard' },
    { type: AmenityType.CCTV, label: 'CCTV' },
    { type: AmenityType.GATED_ESTATE, label: 'Gated estate' },
    { type: AmenityType.INTERCOM, label: 'Intercom' },
  ] },
  { label: 'Facilities', items: [
    { type: AmenityType.PARKING_SPACE, label: 'Parking' },
    { type: AmenityType.SWIMMING_POOL, label: 'Swimming pool' },
    { type: AmenityType.GYM, label: 'Gym' },
    { type: AmenityType.PLAYGROUND, label: 'Playground' },
    { type: AmenityType.INTERNET_FIBRE, label: 'Fibre internet' },
    { type: AmenityType.INTERNET_CABLE, label: 'Cable internet' },
  ] },
  { label: 'Inside', items: [
    { type: AmenityType.AIR_CONDITIONING, label: 'Air conditioning' },
    { type: AmenityType.CEILING_FAN, label: 'Ceiling fans' },
    { type: AmenityType.GAS_COOKER, label: 'Gas cooker point' },
    { type: AmenityType.WASHING_MACHINE_POINT, label: 'Washing machine point' },
  ] },
  { label: 'Outside', items: [
    { type: AmenityType.BALCONY, label: 'Balcony' },
    { type: AmenityType.GARDEN, label: 'Garden' },
    { type: AmenityType.ROOFTOP_TERRACE, label: 'Rooftop terrace' },
    { type: AmenityType.SERVANTS_QUARTERS, label: "Servants' quarters" },
  ] },
];

export const AMENITY_LABELS = Object.fromEntries(
  AMENITY_GROUPS.flatMap((group) => group.items.map((item) => [item.type, item.label])),
) as Record<AmenityType, string>;

export const VERIFICATION_DOCUMENT_TYPES = [
  { value: 'NIN', label: 'National Identification Number (NIN) slip' },
  { value: 'PASSPORT', label: 'International passport' },
  { value: 'DRIVERS_LICENSE', label: "Driver's licence" },
  { value: 'CAC_CERT', label: 'CAC certificate (companies)' },
  { value: 'UTILITY_BILL', label: 'Utility bill for the property' },
] as const;
