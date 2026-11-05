// Realistic Nigerian sample data: 2 landlords, 3 tenants, an admin and 10 listings
// across Lagos, Abuja and Port Harcourt. Used by the development seed and the demo.
// IDs are fixed so links to a listing keep working after the demo resets.
//
// ⚠ Deletes everything first. Callers must check that this is allowed.

import {
  AmenityType,
  ListingStatus,
  type PrismaClient,
  PropertyType,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { samplePhotosFor } from "./samplePhotos.js";

export const SAMPLE_PASSWORD = "Lettr@2024!";

export const SAMPLE_IDS = {
  admin: "demo-admin",
  emeka: "demo-landlord-emeka",
  amaka: "demo-landlord-amaka",
  tunde: "demo-tenant-tunde",
  ngozi: "demo-tenant-ngozi",
  chidi: "demo-tenant-chidi",
} as const;

/** Stable ID for sample listing `index` (zero-based). */
export const sampleListingId = (index: number) => `demo-listing-${String(index + 1).padStart(2, "0")}`;

export async function seedSampleData(prisma: PrismaClient) {
  console.info("🌱 Starting Lettr database seed (this deletes ALL existing data)...");

  // Every other table depends on users, so this one statement empties them all at once.
  await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`;

  const defaultPassword = await bcrypt.hash(SAMPLE_PASSWORD, 12);

  await prisma.user.create({
    data: {
      id: SAMPLE_IDS.admin,
      email: "admin@lettr-test.com",
      passwordHash: defaultPassword,
      role: UserRole.ADMIN,
      firstName: "Lettr",
      lastName: "Admin",
      isEmailVerified: true,
    },
  });

  // ── Create Landlords ──────────────────────────────────────────────────────

  const landlord1 = await prisma.user.create({
    data: {
      id: SAMPLE_IDS.emeka,
      email: "emeka@lettr-test.com",
      phone: "+2348012345678",
      passwordHash: defaultPassword,
      role: UserRole.LANDLORD,
      firstName: "Emeka",
      lastName: "Okonkwo",
      isEmailVerified: true,
      isPhoneVerified: true,
      landlordProfile: {
        create: {
          bio: "Property developer based in Lagos with 12 years of experience managing residential properties across Lekki and Victoria Island.",
          verificationStatus: "VERIFIED",
          verifiedAt: new Date("2024-01-15"),
          totalListings: 6,
          totalRentalsCompleted: 18,
          averageRating: 4.8,
          totalReviews: 14,
          bankAccountName: "EMEKA OKONKWO",
          bankAccountNumber: "0123456789",
          bankCode: "044", // Access Bank
          bankName: "Access Bank",
          bankAccountVerifiedAt: new Date("2024-01-15"),
        },
      },
    },
  });
  console.info("✅ Created landlord: Emeka Okonkwo (emeka@lettr-test.com)");

  const landlord2 = await prisma.user.create({
    data: {
      id: SAMPLE_IDS.amaka,
      email: "amaka@lettr-test.com",
      phone: "+2348087654321",
      passwordHash: defaultPassword,
      role: UserRole.LANDLORD,
      firstName: "Amaka",
      lastName: "Eze",
      isEmailVerified: true,
      isPhoneVerified: true,
      landlordProfile: {
        create: {
          bio: "Retired civil servant turned property investor. I own flats in Abuja and Port Harcourt. I believe tenants deserve transparency and respect.",
          verificationStatus: "VERIFIED",
          verifiedAt: new Date("2024-02-03"),
          totalListings: 4,
          totalRentalsCompleted: 9,
          averageRating: 4.6,
          totalReviews: 8,
          bankAccountName: "AMAKA EZE",
          bankAccountNumber: "9876543210",
          bankCode: "058", // GTBank
          bankName: "Access Bank",
          bankAccountVerifiedAt: new Date("2024-01-15"),
        },
      },
    },
  });
  console.info("✅ Created landlord: Amaka Eze (amaka@lettr-test.com)");

  // ── Create Tenants ────────────────────────────────────────────────────────

  const tenant1 = await prisma.user.create({
    data: {
      id: SAMPLE_IDS.tunde,
      email: "tunde@lettr-test.com",
      phone: "+2348055512345",
      passwordHash: defaultPassword,
      role: UserRole.TENANT,
      firstName: "Tunde",
      lastName: "Bakare",
      isEmailVerified: true,
      tenantProfile: {
        create: {
          occupation: "Software Engineer",
          employerName: "Paystack",
          monthlyIncome: 850000,
          numberOfOccupants: 1,
          hasPets: false,
          smokingHousehold: false,
          previousAddress: "14 Admiralty Way, Lekki Phase 1, Lagos",
          reasonForMoving: "Relocating closer to work in VI",
          nextOfKinName: "Mrs Folake Bakare",
          nextOfKinPhone: "+2348011122233",
          nextOfKinRelation: "Mother",
        },
      },
    },
  });
  console.info("✅ Created tenant: Tunde Bakare (tunde@lettr-test.com)");

  const tenant2 = await prisma.user.create({
    data: {
      id: SAMPLE_IDS.ngozi,
      email: "ngozi@lettr-test.com",
      phone: "+2348066678901",
      passwordHash: defaultPassword,
      role: UserRole.TENANT,
      firstName: "Ngozi",
      lastName: "Adeyemi",
      isEmailVerified: true,
      tenantProfile: {
        create: {
          occupation: "Medical Doctor",
          employerName: "Lagos University Teaching Hospital",
          monthlyIncome: 1200000,
          numberOfOccupants: 3,
          hasPets: false,
          smokingHousehold: false,
          previousAddress: "7 Bode Thomas Street, Surulere, Lagos",
          reasonForMoving: "Upgrading to a larger flat for my family",
          nextOfKinName: "Dr Chukwuemeka Adeyemi",
          nextOfKinPhone: "+2348022233344",
          nextOfKinRelation: "Spouse",
        },
      },
    },
  });
  console.info("✅ Created tenant: Ngozi Adeyemi (ngozi@lettr-test.com)");

  await prisma.user.create({
    data: {
      id: SAMPLE_IDS.chidi,
      email: "chidi@lettr-test.com",
      phone: "+2348077789012",
      passwordHash: defaultPassword,
      role: UserRole.TENANT,
      firstName: "Chidi",
      lastName: "Nwosu",
      isEmailVerified: true,
      tenantProfile: {
        create: {
          occupation: "Investment Banker",
          employerName: "Stanbic IBTC",
          monthlyIncome: 2500000,
          numberOfOccupants: 2,
          hasPets: true,
          petDescription: "One small dog (Bichon Frise)",
          smokingHousehold: false,
          previousAddress: "22 Bourdillon Road, Ikoyi, Lagos",
          reasonForMoving: "Relocating to Abuja for new role",
          nextOfKinName: "Mrs Obiageli Nwosu",
          nextOfKinPhone: "+2348033344455",
          nextOfKinRelation: "Mother",
        },
      },
    },
  });
  console.info("✅ Created tenant: Chidi Nwosu (chidi@lettr-test.com)");

  // ── Create Properties and Listings ───────────────────────────────────────

  type ListingData = {
    landlordId: string;
    title: string;
    description: string;
    propertyType: PropertyType;
    address: string;
    neighbourhood: string;
    lga: string;
    state: string;
    latitude: number;
    longitude: number;
    bedrooms: number;
    bathrooms: number;
    toilets: number;
    parkingSpaces: number;
    sizeInSqm: number;
    isFurnished: boolean;
    isServiced: boolean;
    isNewBuild: boolean;
    amenities: AmenityType[];
    annualRent: number;
    cautionFee: number;
    serviceCharge: number;
  };

  const listingsData: ListingData[] = [
    // ── Lagos listings (Landlord 1 — Emeka) ──
    {
      landlordId: landlord1.id,
      title: "Spacious 3-Bedroom Flat in Lekki Phase 1",
      description:
        "A beautifully finished 3-bedroom flat in the heart of Lekki Phase 1. The property features an open-plan living and dining area, a modern kitchen with fitted cabinets, and a large master bedroom with en-suite bathroom. The estate has 24/7 security, CCTV, and a well-maintained garden. Walking distance to Lekki Conservation Centre and major supermarkets.",
      propertyType: PropertyType.THREE_BEDROOM,
      address: "15B Admiralty Way, Lekki Phase 1",
      neighbourhood: "Lekki Phase 1",
      lga: "Eti-Osa",
      state: "Lagos",
      latitude: 6.4281,
      longitude: 3.4219,
      bedrooms: 3,
      bathrooms: 3,
      toilets: 4,
      parkingSpaces: 2,
      sizeInSqm: 185,
      isFurnished: false,
      isServiced: true,
      isNewBuild: false,
      amenities: [
        AmenityType.CONSTANT_ELECTRICITY,
        AmenityType.WATER_SUPPLY,
        AmenityType.SECURITY_GUARD,
        AmenityType.CCTV,
        AmenityType.GATED_ESTATE,
        AmenityType.PARKING_SPACE,
        AmenityType.INTERNET_FIBRE,
        AmenityType.CEILING_FAN,
        AmenityType.BALCONY,
      ],
      annualRent: 4500000,
      cautionFee: 4500000,
      serviceCharge: 360000,
    },
    {
      landlordId: landlord1.id,
      title: "Modern 2-Bedroom Flat in Ikeja GRA",
      description:
        "A tastefully finished 2-bedroom flat in the prestigious Ikeja GRA. The property is in a quiet, secure estate with 24-hour power supply from a dedicated transformer. The kitchen is newly tiled with modern fittings. Both bedrooms have built-in wardrobes. There is ample parking and a communal garden.",
      propertyType: PropertyType.TWO_BEDROOM,
      address: "8 Mobolaji Bank-Anthony Way, Ikeja GRA",
      neighbourhood: "Ikeja GRA",
      lga: "Ikeja",
      state: "Lagos",
      latitude: 6.5833,
      longitude: 3.3333,
      bedrooms: 2,
      bathrooms: 2,
      toilets: 3,
      parkingSpaces: 1,
      sizeInSqm: 120,
      isFurnished: false,
      isServiced: false,
      isNewBuild: false,
      amenities: [
        AmenityType.CONSTANT_ELECTRICITY,
        AmenityType.WATER_SUPPLY,
        AmenityType.BOREHOLE,
        AmenityType.SECURITY_GUARD,
        AmenityType.GATED_ESTATE,
        AmenityType.PARKING_SPACE,
        AmenityType.CEILING_FAN,
      ],
      annualRent: 2800000,
      cautionFee: 2800000,
      serviceCharge: 0,
    },
    {
      landlordId: landlord1.id,
      title: "Self-Contained Studio in Yaba",
      description:
        "A clean, well-ventilated self-contained studio apartment in the heart of Yaba — perfect for a young professional or student. The unit has a private bathroom, a kitchenette area, and a large wardrobe. Located minutes from University of Lagos, UNILAG bus stop, and major tech hubs.",
      propertyType: PropertyType.SELF_CONTAINED,
      address: "4 Herbert Macaulay Way, Yaba",
      neighbourhood: "Yaba",
      lga: "Mainland",
      state: "Lagos",
      latitude: 6.5095,
      longitude: 3.3711,
      bedrooms: 0,
      bathrooms: 1,
      toilets: 1,
      parkingSpaces: 0,
      sizeInSqm: 35,
      isFurnished: false,
      isServiced: false,
      isNewBuild: false,
      amenities: [
        AmenityType.PREPAID_ELECTRICITY,
        AmenityType.WATER_SUPPLY,
        AmenityType.CEILING_FAN,
        AmenityType.INTERNET_CABLE,
      ],
      annualRent: 650000,
      cautionFee: 650000,
      serviceCharge: 0,
    },
    {
      landlordId: landlord1.id,
      title: "Luxury 4-Bedroom Duplex in Banana Island",
      description:
        "An exquisite 4-bedroom fully detached duplex on the exclusive Banana Island. The property features marble floors throughout, a chef's kitchen with island, a home theatre room, a private swimming pool, and a boys' quarters. Smart home system controls lighting, security, and climate. Available immediately.",
      propertyType: PropertyType.DUPLEX,
      address: "3 Bourdillon Close, Banana Island",
      neighbourhood: "Banana Island",
      lga: "Eti-Osa",
      state: "Lagos",
      latitude: 6.453,
      longitude: 3.4358,
      bedrooms: 4,
      bathrooms: 5,
      toilets: 6,
      parkingSpaces: 4,
      sizeInSqm: 540,
      isFurnished: true,
      isServiced: true,
      isNewBuild: true,
      amenities: [
        AmenityType.CONSTANT_ELECTRICITY,
        AmenityType.WATER_SUPPLY,
        AmenityType.BOREHOLE,
        AmenityType.SECURITY_GUARD,
        AmenityType.CCTV,
        AmenityType.GATED_ESTATE,
        AmenityType.INTERCOM,
        AmenityType.SWIMMING_POOL,
        AmenityType.GYM,
        AmenityType.PARKING_SPACE,
        AmenityType.INTERNET_FIBRE,
        AmenityType.AIR_CONDITIONING,
        AmenityType.GARDEN,
        AmenityType.BALCONY,
        AmenityType.SERVANTS_QUARTERS,
        AmenityType.GENERATOR_PRIVATE,
      ],
      annualRent: 35000000,
      cautionFee: 35000000,
      serviceCharge: 2400000,
    },
    {
      landlordId: landlord1.id,
      title: "Mini Flat in Surulere",
      description:
        "A comfortable mini flat on the 2nd floor of a 3-storey building in Surulere. The living room is airy with good cross-ventilation. The kitchen has a gas cooker point and tiled countertops. The bedroom is spacious with a ceiling fan. Close to National Stadium, major hospitals, and Tejuosho market.",
      propertyType: PropertyType.MINI_FLAT,
      address: "22 Adeniran Ogunsanya Street, Surulere",
      neighbourhood: "Surulere",
      lga: "Surulere",
      state: "Lagos",
      latitude: 6.4968,
      longitude: 3.3534,
      bedrooms: 1,
      bathrooms: 1,
      toilets: 1,
      parkingSpaces: 1,
      sizeInSqm: 65,
      isFurnished: false,
      isServiced: false,
      isNewBuild: false,
      amenities: [
        AmenityType.PREPAID_ELECTRICITY,
        AmenityType.WATER_SUPPLY,
        AmenityType.CEILING_FAN,
        AmenityType.GAS_COOKER,
        AmenityType.PARKING_SPACE,
      ],
      annualRent: 900000,
      cautionFee: 900000,
      serviceCharge: 0,
    },
    {
      landlordId: landlord1.id,
      title: "1-Bedroom Flat in Ajah",
      description:
        "A well-maintained 1-bedroom flat in the fast-growing Ajah corridor. The property is in a small, quiet compound with just 4 flats. The bedroom is large enough for a king bed and wardrobe. The bathroom is clean with constant water supply from a borehole. Close to Abraham Adesanya roundabout and major bus routes.",
      propertyType: PropertyType.ONE_BEDROOM,
      address: "5 Ado Road, Ajah",
      neighbourhood: "Ajah",
      lga: "Eti-Osa",
      state: "Lagos",
      latitude: 6.4714,
      longitude: 3.56,
      bedrooms: 1,
      bathrooms: 1,
      toilets: 1,
      parkingSpaces: 1,
      sizeInSqm: 75,
      isFurnished: false,
      isServiced: false,
      isNewBuild: false,
      amenities: [
        AmenityType.PREPAID_ELECTRICITY,
        AmenityType.BOREHOLE,
        AmenityType.CEILING_FAN,
        AmenityType.PARKING_SPACE,
      ],
      annualRent: 1100000,
      cautionFee: 1100000,
      serviceCharge: 0,
    },
    // ── Abuja listings (Landlord 2 — Amaka) ──
    {
      landlordId: landlord2.id,
      title: "3-Bedroom Flat in Maitama",
      description:
        "A premium 3-bedroom flat in Maitama, Abuja's most prestigious residential district. All three bedrooms are en-suite with American Standard fittings. The living area opens to a large terrace overlooking a well-manicured estate garden. Estate has 24/7 security, CCTV, and a backup generator. Steps from Transcorp Hilton.",
      propertyType: PropertyType.THREE_BEDROOM,
      address: "12 Aguiyi-Ironsi Street, Maitama",
      neighbourhood: "Maitama",
      lga: "Municipal Area Council",
      state: "Abuja (FCT)",
      latitude: 9.082,
      longitude: 7.4891,
      bedrooms: 3,
      bathrooms: 3,
      toilets: 4,
      parkingSpaces: 2,
      sizeInSqm: 210,
      isFurnished: false,
      isServiced: true,
      isNewBuild: false,
      amenities: [
        AmenityType.CONSTANT_ELECTRICITY,
        AmenityType.WATER_SUPPLY,
        AmenityType.SECURITY_GUARD,
        AmenityType.CCTV,
        AmenityType.GATED_ESTATE,
        AmenityType.INTERCOM,
        AmenityType.PARKING_SPACE,
        AmenityType.INTERNET_FIBRE,
        AmenityType.BALCONY,
        AmenityType.GENERATOR_COMMON,
      ],
      annualRent: 6500000,
      cautionFee: 6500000,
      serviceCharge: 480000,
    },
    {
      landlordId: landlord2.id,
      title: "2-Bedroom Flat in Wuse 2",
      description:
        "A neat and affordable 2-bedroom flat in the commercial heart of Wuse 2. The property is on the ground floor of a 4-storey building with a reliable borehole and prepaid meter. Both bedrooms are a good size with ceiling fans installed. Kitchen has tiled floors and a fitted cooker hood. Walking distance to Banex Plaza and Ceddi Plaza.",
      propertyType: PropertyType.TWO_BEDROOM,
      address: "7 Aminu Kano Crescent, Wuse 2",
      neighbourhood: "Wuse 2",
      lga: "Municipal Area Council",
      state: "Abuja (FCT)",
      latitude: 9.0579,
      longitude: 7.4951,
      bedrooms: 2,
      bathrooms: 2,
      toilets: 2,
      parkingSpaces: 1,
      sizeInSqm: 110,
      isFurnished: false,
      isServiced: false,
      isNewBuild: false,
      amenities: [
        AmenityType.PREPAID_ELECTRICITY,
        AmenityType.BOREHOLE,
        AmenityType.CEILING_FAN,
        AmenityType.PARKING_SPACE,
        AmenityType.SECURITY_GUARD,
      ],
      annualRent: 2200000,
      cautionFee: 2200000,
      serviceCharge: 0,
    },
    // ── Port Harcourt listings (Landlord 2 — Amaka) ──
    {
      landlordId: landlord2.id,
      title: "3-Bedroom Duplex in GRA Phase 2, Port Harcourt",
      description:
        "A well-finished 3-bedroom duplex in the serene GRA Phase 2, Port Harcourt. The duplex features a split-level living area, an expansive kitchen with island breakfast bar, and a master bedroom suite on the upper floor. The compound has a small garden and dedicated parking for 2 cars. Generator and borehole included.",
      propertyType: PropertyType.DUPLEX,
      address: "18 Peter Odili Road, GRA Phase 2",
      neighbourhood: "GRA Phase 2",
      lga: "Port Harcourt",
      state: "Rivers",
      latitude: 4.8156,
      longitude: 7.0498,
      bedrooms: 3,
      bathrooms: 3,
      toilets: 4,
      parkingSpaces: 2,
      sizeInSqm: 230,
      isFurnished: false,
      isServiced: false,
      isNewBuild: false,
      amenities: [
        AmenityType.CONSTANT_ELECTRICITY,
        AmenityType.BOREHOLE,
        AmenityType.WATER_SUPPLY,
        AmenityType.SECURITY_GUARD,
        AmenityType.PARKING_SPACE,
        AmenityType.GENERATOR_PRIVATE,
        AmenityType.CEILING_FAN,
        AmenityType.GARDEN,
      ],
      annualRent: 3800000,
      cautionFee: 3800000,
      serviceCharge: 0,
    },
    {
      landlordId: landlord2.id,
      title: "Self-Contained BQ in Rumuola, Port Harcourt",
      description:
        "A clean boys' quarters (BQ) apartment ideal for a single professional or student. Private entrance, private bathroom, and a kitchenette area. Located in a quiet residential street in Rumuola. Prepaid electricity meter in unit. Walking distance to University of Port Harcourt Teaching Hospital (UPTH).",
      propertyType: PropertyType.BOYS_QUARTERS,
      address: "3 Rumuola Road, Rumuola",
      neighbourhood: "Rumuola",
      lga: "Obio-Akpor",
      state: "Rivers",
      latitude: 4.8374,
      longitude: 7.01,
      bedrooms: 0,
      bathrooms: 1,
      toilets: 1,
      parkingSpaces: 0,
      sizeInSqm: 28,
      isFurnished: false,
      isServiced: false,
      isNewBuild: false,
      amenities: [
        AmenityType.PREPAID_ELECTRICITY,
        AmenityType.WATER_SUPPLY,
        AmenityType.CEILING_FAN,
      ],
      annualRent: 380000,
      cautionFee: 380000,
      serviceCharge: 0,
    },
  ];

  // Cloudinary placeholder photo URLs (realistic Cloudinary format)
  const photoSets: string[][] = listingsData.map((_, index) => samplePhotosFor(index, 4));

  for (let i = 0; i < listingsData.length; i++) {
    const data = listingsData[i];
    const photos = photoSets[i];

    const property = await prisma.property.create({
      data: {
        id: `demo-property-${String(i + 1).padStart(2, "0")}`,
        landlordId: data.landlordId,
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        address: data.address,
        neighbourhood: data.neighbourhood,
        lga: data.lga,
        state: data.state,
        latitude: data.latitude,
        longitude: data.longitude,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        toilets: data.toilets,
        parkingSpaces: data.parkingSpaces,
        sizeInSqm: data.sizeInSqm,
        isFurnished: data.isFurnished,
        isServiced: data.isServiced,
        isNewBuild: data.isNewBuild,
        photos: {
          create: photos.map((url, index) => ({
            url,
            publicId: `listings/${url.split("/").pop()?.split(".")[0] ?? `photo-${index}`}`,
            altText: `${data.title} — photo ${index + 1}`,
            isCover: index === 0,
            displayOrder: index,
          })),
        },
        amenities: {
          create: data.amenities.map((type) => ({ type })),
        },
      },
    });

    await prisma.listing.create({
      data: {
        id: sampleListingId(i),
        propertyId: property.id,
        landlordId: data.landlordId,
        status: ListingStatus.ACTIVE,
        annualRent: data.annualRent,
        cautionFee: data.cautionFee,
        agencyFee: 0,
        serviceCharge: data.serviceCharge,
        legalFee: 50000,
        availableFrom: new Date(),
        minimumLeaseTerm: 12,
        publishedAt: new Date(),
      },
    });

    console.info(`✅ Created listing ${i + 1}/10: ${data.title}`);
  }

  // ── Create sample reviews ──────────────────────────────────────────────

  {
    await prisma.review.create({
      data: {
        listingId: sampleListingId(5),
        reviewerId: tenant1.id,
        revieweeId: landlord1.id,
        rating: 5,
        title: "Excellent landlord — very responsive and transparent",
        body: "Mr Emeka was incredibly straightforward throughout the process. No hidden fees, no surprises. The property was exactly as described. I saved over ₦600,000 in agent fees by using Lettr. Highly recommended.",
        isVerified: false,
      },
    });

    await prisma.review.create({
      data: {
        listingId: sampleListingId(5),
        reviewerId: tenant2.id,
        revieweeId: landlord1.id,
        rating: 4,
        title: "Great property, minor maintenance delay",
        body: "The flat is beautiful and well-located. Landlord responded promptly to my inquiry. The only issue was a small delay in fixing a leaking tap but it was resolved within a week. Would rent again.",
        isVerified: false,
      },
    });
  }

  console.info("✅ Created sample reviews");
}
