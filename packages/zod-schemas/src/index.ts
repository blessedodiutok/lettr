// File: packages/zod-schemas/src/index.ts
// All Zod 4 validation schemas for every API request body.
// Used by: API (middleware/validate.ts) and web/mobile (react-hook-form resolvers).
// Grouped by domain: auth, listings, payments, tenancy, reviews, inquiries, users.

import { z } from 'zod';

// ─────────────────────────────────────────────
// REUSABLE FIELD VALIDATORS
// ─────────────────────────────────────────────

const NigerianPhone = z
  .string()
  .regex(
    /^(\+234|0)(7|8|9)(0|1)\d{8}$/,
    'Enter a valid Nigerian phone number (e.g. +2348012345678)',
  )
  .optional();

const NairaAmount = z
  .number({ message: 'Must be a number' })
  .positive('Must be greater than zero')
  .finite('Must be a finite number');

const CuidId = z.string().min(1, 'ID is required');

const NigerianState = z.enum([
  'Lagos',
  'Abuja (FCT)',
  'Rivers',
  'Kano',
  'Oyo',
  'Delta',
  'Anambra',
  'Enugu',
  'Imo',
  'Kaduna',
  'Ogun',
  'Edo',
  'Kwara',
  'Cross River',
  'Akwa Ibom',
  'Borno',
  'Katsina',
  'Sokoto',
  'Niger',
  'Plateau',
  'Benue',
  'Nassarawa',
  'Zamfara',
  'Kebbi',
  'Jigawa',
  'Gombe',
  'Bauchi',
  'Yobe',
  'Adamawa',
  'Taraba',
  'Ebonyi',
  'Ekiti',
  'Ondo',
  'Osun',
  'Bayelsa',
]);

// ─────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────

export const SignupSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .trim(),
  role: z.enum(['LANDLORD', 'TENANT'], {
    message: 'Role must be LANDLORD or TENANT',
  }),
  phone: NigerianPhone,
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const VerifyOtpSchema = z.object({
  userId: CuidId,
  otp: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const FcmTokenSchema = z.object({
  token: z.string().min(1, 'FCM token is required'),
});

// ─────────────────────────────────────────────
// LISTING SCHEMAS
// ─────────────────────────────────────────────

const PropertyTypeEnum = z.enum([
  'SELF_CONTAINED',
  'MINI_FLAT',
  'ONE_BEDROOM',
  'TWO_BEDROOM',
  'THREE_BEDROOM',
  'FOUR_BEDROOM',
  'DUPLEX',
  'BUNGALOW',
  'BOYS_QUARTERS',
  'MANSION',
  'PENTHOUSE',
  'STUDIO',
  'TERRACE',
  'SEMI_DETACHED',
  'DETACHED',
]);

const PropertySchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(120, 'Title must be at most 120 characters')
    .trim(),
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be at most 2000 characters')
    .trim(),
  propertyType: PropertyTypeEnum,
  address: z.string().min(5, 'Address is required').trim(),
  neighbourhood: z.string().min(2, 'Neighbourhood is required').trim(),
  lga: z.string().min(2, 'LGA is required').trim(),
  state: NigerianState,
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
  yearBuilt: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  amenities: z
    .array(
      z.object({
        type: z.string(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

const ListingTermsSchema = z.object({
  annualRent: NairaAmount.min(100000, 'Annual rent must be at least ₦100,000'),
  cautionFee: NairaAmount,
  serviceCharge: z.number().min(0).default(0),
  legalFee: z.number().min(0).default(0),
  availableFrom: z.string().datetime({ message: 'availableFrom must be a valid ISO date' }),
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
  state: z.string().optional(),
  lga: z.string().optional(),
  neighbourhood: z.string().optional(),
  propertyType: PropertyTypeEnum.optional(),
  minRent: z
    .string()
    .regex(/^\d+$/, 'minRent must be a number')
    .transform(Number)
    .optional(),
  maxRent: z
    .string()
    .regex(/^\d+$/, 'maxRent must be a number')
    .transform(Number)
    .optional(),
  bedrooms: z
    .string()
    .regex(/^\d+$/, 'bedrooms must be a number')
    .transform(Number)
    .optional(),
  isFurnished: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  isServiced: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default(20),
  sortBy: z
    .enum(['popular', 'price_asc', 'price_desc', 'newest'])
    .default('popular'),
});

export type ListingSearchInput = z.infer<typeof ListingSearchSchema>;

// ─────────────────────────────────────────────
// INQUIRY SCHEMAS
// ─────────────────────────────────────────────

export const CreateInquirySchema = z.object({
  listingId: CuidId,
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must be at most 1000 characters')
    .trim(),
});

export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;

export const SendMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be at most 1000 characters')
    .trim(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const ScheduleInspectionSchema = z.object({
  scheduledAt: z
    .string()
    .datetime({ message: 'scheduledAt must be a valid ISO datetime' })
    .refine(
      (val) => new Date(val) > new Date(),
      'Inspection must be scheduled in the future',
    ),
  notes: z.string().max(500).optional(),
});

export type ScheduleInspectionInput = z.infer<typeof ScheduleInspectionSchema>;

export const UpdateInquiryStatusSchema = z.object({
  status: z.enum([
    'RESPONDED',
    'INSPECTION_SCHEDULED',
    'INSPECTION_COMPLETED',
    'OFFER_MADE',
    'ACCEPTED',
    'DECLINED',
  ]),
});

// ─────────────────────────────────────────────
// TENANCY SCHEMAS
// ─────────────────────────────────────────────

export const CreateTenancyAgreementSchema = z.object({
  listingId: CuidId,
  tenantId: CuidId,
  tenancyStartDate: z
    .string()
    .datetime({ message: 'tenancyStartDate must be a valid ISO datetime' }),
  paymentId: CuidId.optional(),
});

export type CreateTenancyAgreementInput = z.infer<
  typeof CreateTenancyAgreementSchema
>;

// ─────────────────────────────────────────────
// PAYMENT SCHEMAS
// ─────────────────────────────────────────────

export const InitiatePaymentSchema = z.object({
  listingId: CuidId,
});

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;

export const PaystackWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
    status: z.string(),
    amount: z.number(),
    currency: z.string(),
    metadata: z
      .object({
        paymentId: z.string().optional(),
      })
      .optional(),
  }),
});

// ─────────────────────────────────────────────
// REVIEW SCHEMAS
// ─────────────────────────────────────────────

export const CreateReviewSchema = z.object({
  listingId: CuidId.optional(),
  revieweeId: CuidId,
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters')
    .trim(),
  body: z
    .string()
    .min(20, 'Review must be at least 20 characters')
    .max(1000, 'Review must be at most 1000 characters')
    .trim(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ─────────────────────────────────────────────
// USER / PROFILE SCHEMAS
// ─────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim().optional(),
  phone: NigerianPhone,
  tenantProfile: z
    .object({
      occupation: z.string().max(100).optional(),
      employerName: z.string().max(100).optional(),
      monthlyIncome: z.number().positive().optional(),
      numberOfOccupants: z.number().int().positive().optional(),
      hasPets: z.boolean().optional(),
      petDescription: z.string().max(200).optional(),
      smokingHousehold: z.boolean().optional(),
      previousAddress: z.string().max(200).optional(),
      reasonForMoving: z.string().max(500).optional(),
      nextOfKinName: z.string().max(100).optional(),
      nextOfKinPhone: NigerianPhone,
      nextOfKinRelation: z.string().max(50).optional(),
    })
    .optional(),
  landlordProfile: z
    .object({
      businessName: z.string().max(100).optional(),
      bio: z.string().max(500).optional(),
      bankAccountName: z.string().max(100).optional(),
      bankAccountNumber: z
        .string()
        .regex(/^\d{10}$/, 'Bank account number must be exactly 10 digits')
        .optional(),
      bankCode: z.string().max(10).optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UploadVerificationDocumentSchema = z.object({
  documentType: z.enum([
    'NIN',
    'BVN',
    'PASSPORT',
    'DRIVERS_LICENSE',
    'CAC_CERT',
    'UTILITY_BILL',
  ]),
  documentNumber: z.string().min(5).max(50).optional(),
});

export type UploadVerificationDocumentInput = z.infer<
  typeof UploadVerificationDocumentSchema
>;

// ─────────────────────────────────────────────
// NOTIFICATION SCHEMAS
// ─────────────────────────────────────────────

export const MarkNotificationReadSchema = z.object({
  id: CuidId,
});

export const RefundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(10).max(500),
});

export const CreateDisputeSchema = z.object({
  reason: z.string().min(20).max(1000),
});

export const ResolveDisputeSchema = z.object({
  status: z.enum(['RESOLVED', 'REJECTED']),
  resolution: z.string().min(10).max(1000),
});

export const ReviewVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().min(10).max(500).optional(),
}).refine(
  (value) => value.status !== 'REJECTED' || Boolean(value.rejectionReason),
  { message: 'A rejection reason is required', path: ['rejectionReason'] },
);

export const ModerateListingSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  reason: z.string().min(10).max(500),
});

export const ModerateUserSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().min(10).max(500),
});
