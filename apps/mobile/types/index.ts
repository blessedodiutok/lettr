// File: apps/mobile/types/index.ts
// Shared type definitions for the mobile app

export interface Listing {
  id: string;
  annualRent: number;
  cautionFee: number;
  status: string;
  availableFrom: string;
  isSaved?: boolean;
  property: {
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
    parkingSpaces: number;
    isFurnished: boolean;
    isServiced: boolean;
    photos: Array<{ url: string; isCover: boolean; altText: string | null }>;
    amenities: Array<{ type: string }>;
  };
  landlord: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    landlordProfile: {
      verificationStatus: string;
      averageRating: number;
      totalReviews: number;
    } | null;
  };
}
