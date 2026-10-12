// File: apps/api/src/routes/listings.ts
// Base: /api/listings
// IMPORTANT: All static path segments (/map, /tenant/saved, /landlord/mine)
// must be defined BEFORE the dynamic /:id route.

import {
  CreateListingSchema,
  ListingSearchSchema,
  UpdateListingSchema,
} from "@lettr/zod-schemas";
import { Router } from "express";
import * as listingsController from "../controllers/listings.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

// ── Static routes — MUST be before /:id ──────────────────────────────────

// Public — search and map
router.get(
  "/",
  validate({ query: ListingSearchSchema }),
  listingsController.searchListings,
);
router.get(
  "/map",
  validate({ query: ListingSearchSchema }),
  listingsController.getMapListings,
);

// Tenant — saved listings (static path: /tenant/saved)
router.get(
  "/tenant/saved",
  authenticate,
  requireRole("TENANT"),
  listingsController.getSavedListings,
);

// Landlord — own listings (static path: /landlord/mine)
router.get(
  "/landlord/mine",
  authenticate,
  requireRole("LANDLORD"),
  listingsController.getMyListings,
);

// ── Dynamic routes — /:id MUST be after all static routes ────────────────

// Public — single listing detail
router.get("/:id", optionalAuthenticate, listingsController.getListing);

// Landlord — manage a specific listing
router.post(
  "/",
  authenticate,
  requireRole("LANDLORD"),
  validate({ body: CreateListingSchema }),
  listingsController.createListing,
);
router.put(
  "/:id",
  authenticate,
  requireRole("LANDLORD"),
  validate({ body: UpdateListingSchema }),
  listingsController.updateListing,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("LANDLORD"),
  listingsController.deleteListing,
);
router.patch(
  "/:id/publish",
  authenticate,
  requireRole("LANDLORD"),
  listingsController.publishListing,
);
router.patch(
  "/:id/archive",
  authenticate,
  requireRole("LANDLORD"),
  listingsController.archiveListing,
);

// Tenant — save/unsave a specific listing
router.post(
  "/:id/save",
  authenticate,
  requireRole("TENANT"),
  listingsController.saveListing,
);
router.delete(
  "/:id/save",
  authenticate,
  requireRole("TENANT"),
  listingsController.unsaveListing,
);

export default router;
