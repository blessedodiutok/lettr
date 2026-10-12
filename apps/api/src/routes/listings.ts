// Base: /api/listings
// Static path segments (/map, /tenant/saved, /landlord/mine) come before /:id.

import { CreateListingSchema, ListingSearchSchema, UpdateListingSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as controller from "../controllers/listings.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
const landlord = [authenticate, requireRole("LANDLORD")];
const tenant = [authenticate, requireRole("TENANT")];

router.get("/", optionalAuthenticate, validate({ query: ListingSearchSchema }), controller.searchListings);
router.get("/map", validate({ query: ListingSearchSchema }), controller.getMapListings);
router.get("/tenant/saved", ...tenant, controller.getSavedListings);
router.get("/landlord/mine", ...landlord, controller.getMyListings);
router.get("/landlord/mine/:id", ...landlord, controller.getMyListing);

router.post("/", ...landlord, validate({ body: CreateListingSchema }), controller.createListing);
router.get("/:id", optionalAuthenticate, controller.getListing);
router.put("/:id", ...landlord, validate({ body: UpdateListingSchema }), controller.updateListing);
router.delete("/:id", ...landlord, controller.deleteListing);
router.patch("/:id/publish", ...landlord, controller.publishListing);
router.patch("/:id/archive", ...landlord, controller.archiveListing);

router.post("/:id/save", ...tenant, controller.saveListing);
router.delete("/:id/save", ...tenant, controller.unsaveListing);

export default router;
