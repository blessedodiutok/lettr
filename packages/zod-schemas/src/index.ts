// File: packages/zod-schemas/src/index.ts
// Zod 4 validation schemas for every API request.
// Used by the API (middleware/validate.ts) and by web and mobile forms.

import { AmenityType, NIGERIAN_STATES, PropertyType } from '@lettr/types';
import { z } from 'zod';

// ─────────────────────────────────────────────
// REUSABLE FIELD VALIDATORS
// ─────────────────────────────────────────────

const NigerianPhone = z
  .string()
  .trim()
  .regex(/^(\+234|0)(7|8|9)(0|1)\d{8}$/, 'Enter a valid Nigerian phone number, e.g. 08012345678')
  .optional();

const NairaAmount = z
  .number({ message: 'Must be a number' })
  .positive('Must be greater than zero')
  .finite('Must be a finite number');

const CuidId = z.string().min(1, 'ID is required');

export const NigerianStateSchema = z.enum(NIGERIAN_STATES, { message: 'Choose a state' });

export const PasswordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

const Email = z.string().trim().toLowerCase().email('Enter a valid email address');

/** Query-string integer with bounds, e.g. ?page=2 */
const queryInt = (fallback: number, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .regex(/^\d+$/, 'Must be a whole number')
    .transform(Number)
    .pipe(z.number().int().min(0).max(max))
    .optional()
    .transform((value) => value ?? fallback);

/** Optional query-string integer — absent stays undefined. */
const queryIntOptional = (max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .regex(/^\d+$/, 'Must be a whole number')
    .transform(Number)
    .pipe(z.number().int().min(0).max(max))
    .optional();

const queryBool = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

export const PaginationQuerySchema = z.object({
  page: queryInt(1).transform((v) => Math.max(1, v)),
  limit: queryInt(20, 50).transform((v) => Math.max(1, v)),
});

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const SignupSchema = z.object({
  email: Email,
  password: PasswordSchema,
  firstName: z.string().trim().min(2, 'Enter at least 2 characters').max(50),
  lastName: z.string().trim().min(2, 'Enter at least 2 characters').max(50),
  role: z.enum(['LANDLORD', 'TENANT'], { message: 'Choose whether you are renting or letting' }),
  phone: NigerianPhone.or(z.literal('').transform(() => undefined)),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: Email,
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const VerifyOtpSchema = z.object({
  userId: CuidId,
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const ResendOtpSchema = z.object({ userId: CuidId });

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const ForgotPasswordSchema = z.object({ email: Email });

export const ResetPasswordSchema = z.object({
  token: z.string().min(20, 'This reset link is invalid'),
  password: PasswordSchema,
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: PasswordSchema,
});

export const FcmTokenSchema = z.object({
  token: z.string().min(1, 'A device token is required'),
});

// ─────────────────────────────────────────────
// LISTINGS
// ─────────────────────────────────────────────

export const PropertyTypeSchema = z.enum(PropertyType);
export const AmenityTypeSchema = z.enum(AmenityType);

const PropertySchema = z.object({
  title: z.string().trim().min(10, 'Use at least 10 characters').max(120, 'Use at most 120 characters'),
  description: z.string().trim().min(50, 'Describe the home in at least 50 characters').max(2000),
  propertyType: PropertyTypeSchema,
  address: z.string().trim().min(5, 'Enter the street address'),
  neighbourhood: z.string().trim().min(2, 'Enter the neighbourhood'),
  lga: z.string().trim().min(2, 'Enter the local government area'),
  state: NigerianStateSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(1).max(20),
  toilets: z.number().int().min(1).max(20),
  parkingSpaces: z.number().int().min(0).max(20).default(0),
  sizeInSqm: z.number().positive().optional(),
  isFurnished: z.boolean().default(false),
  isServiced: z.boolean().default(false),
  isNewBuild: z.boolean().default(false),
  yearBuilt: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  amenities: z
    .array(z.object({ type: AmenityTypeSchema, notes: z.string().max(120).optional() }))
    .max(40)
    .optional(),
});

const ListingTermsSchema = z.object({
  annualRent: NairaAmount.min(100000, 'Annual rent must be at least ₦100,000'),
  cautionFee: z.number().min(0, 'Must be zero or more'),
  serviceCharge: z.number().min(0).default(0),
  legalFee: z.number().min(0).default(0),
  availableFrom: z.string().datetime({ message: 'Choose the date the home is available' }),
  minimumLeaseTerm: z.number().int().min(1).max(36).default(12),
  maximumOccupants: z.number().int().positive().optional(),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  additionalRequirements: z.string().max(500).optional(),
  requiresEmployment: z.boolean().default(false),
  requiresGuarantor: z.boolean().default(false),
});

export const CreateListingSchema = z.object({
  property: PropertySchema,
  listing: ListingTermsSchema,
});
export type CreateListingInput = z.infer<typeof CreateListingSchema>;

export const UpdateListingSchema = z.object({
  property: PropertySchema.partial().optional(),
  listing: ListingTermsSchema.partial().optional(),
});
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;

export const ListingSearchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  state: z.string().max(40).optional(),
  lga: z.string().max(60).optional(),
  neighbourhood: z.string().max(60).optional(),
  propertyType: PropertyTypeSchema.optional(),
  minRent: queryIntOptional(),
  maxRent: queryIntOptional(),
  /** Minimum number of bedrooms. */
  bedrooms: queryIntOptional(20),
  isFurnished: queryBool,
  isServiced: queryBool,
  page: queryInt(1).transform((v) => Math.max(1, v)),
  limit: queryInt(20, 50).transform((v) => Math.max(1, v)),
  sortBy: z.enum(['popular', 'price_asc', 'price_desc', 'newest']).default('newest'),
});
export type ListingSearchInput = z.infer<typeof ListingSearchSchema>;

export const ReorderPhotosSchema = z.object({
  photoIds: z.array(CuidId).min(1).max(12),
});

// ─────────────────────────────────────────────
// INQUIRIES, INSPECTIONS AND OFFERS
// ─────────────────────────────────────────────

export const CreateInquirySchema = z.object({
  listingId: CuidId,
  message: z.string().trim().min(20, 'Write at least 20 characters so the landlord knows who you are').max(1000),
});
export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;

export const SendMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(1000, 'Keep messages under 1000 characters'),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const ScheduleInspectionSchema = z.object({
  scheduledAt: z
    .string()
    .datetime({ message: 'Choose a date and time' })
    .refine((val) => new Date(val) > new Date(), 'Choose a time in the future'),
  notes: z.string().max(500).optional(),
});
export type ScheduleInspectionInput = z.infer<typeof ScheduleInspectionSchema>;

export const MakeOfferSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export const CloseInquirySchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

// ─────────────────────────────────────────────
// TENANCY
// ─────────────────────────────────────────────

export const CancelTenancySchema = z.object({
  reason: z.string().trim().min(10, 'Tell us briefly why').max(500),
});

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

export const InitiatePaymentSchema = z.object({
  listingId: CuidId,
});
export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;

export const RefundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().trim().min(10).max(500),
});

export const CreateDisputeSchema = z.object({
  reason: z.string().trim().min(20, 'Describe the problem in at least 20 characters').max(1000),
});

export const ResolveDisputeSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  outcome: z.enum(['REFUND_TENANT', 'RELEASE_TO_LANDLORD', 'NO_ACTION']).default('NO_ACTION'),
  resolution: z.string().trim().min(10).max(1000),
});

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  listingId: CuidId.optional(),
  revieweeId: CuidId,
  rating: z.number().int().min(1, 'Choose a rating').max(5),
  title: z.string().trim().min(5, 'Use at least 5 characters').max(100),
  body: z.string().trim().min(20, 'Write at least 20 characters').max(1000),
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ─────────────────────────────────────────────
// USERS AND PROFILES
// ─────────────────────────────────────────────

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(50).optional(),
  lastName: z.string().trim().min(2).max(50).optional(),
  phone: NigerianPhone,
  tenantProfile: z
    .object({
      occupation: optionalText(100),
      employerName: optionalText(100),
      monthlyIncome: z.number().positive().optional(),
      numberOfOccupants: z.number().int().positive().max(20).optional(),
      hasPets: z.boolean().optional(),
      petDescription: optionalText(200),
      smokingHousehold: z.boolean().optional(),
      previousAddress: optionalText(200),
      reasonForMoving: optionalText(500),
      nextOfKinName: optionalText(100),
      nextOfKinPhone: NigerianPhone,
      nextOfKinRelation: optionalText(50),
    })
    .optional(),
  landlordProfile: z
    .object({
      businessName: optionalText(100),
      bio: optionalText(500),
    })
    .optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const BankAccountSchema = z.object({
  bankCode: z.string().trim().min(3, 'Choose your bank').max(10),
  accountNumber: z.string().regex(/^\d{10}$/, 'Account numbers have 10 digits'),
});

export const UploadVerificationDocumentSchema = z.object({
  documentType: z.enum(['NIN', 'PASSPORT', 'DRIVERS_LICENSE', 'CAC_CERT', 'UTILITY_BILL']),
  documentNumber: z.string().trim().min(5).max(50).optional(),
});
export type UploadVerificationDocumentInput = z.infer<typeof UploadVerificationDocumentSchema>;

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

export const AdminListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.string().max(40).optional(),
  page: queryInt(1).transform((v) => Math.max(1, v)),
  limit: queryInt(25, 100).transform((v) => Math.max(1, v)),
});

export const ReviewVerificationSchema = z
  .object({
    status: z.enum(['VERIFIED', 'REJECTED']),
    rejectionReason: z.string().trim().min(10).max(500).optional(),
  })
  .refine((value) => value.status !== 'REJECTED' || Boolean(value.rejectionReason), {
    message: 'A rejection reason is required',
    path: ['rejectionReason'],
  });

export const ModerateListingSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  reason: z.string().trim().min(10).max(500),
});

export const ModerateUserSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().trim().min(10).max(500),
});
