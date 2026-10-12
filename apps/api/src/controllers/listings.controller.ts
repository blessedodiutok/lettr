// HTTP handlers for /api/listings

import type { Request, Response } from "express";
import * as listingsService from "../services/listings.service.js";

type SearchQuery = Parameters<typeof listingsService.searchListings>[0];

const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const id = (req: Request) => String(req.params.id);

export async function searchListings(req: Request, res: Response) {
  ok(res, await listingsService.searchListings(req.query as unknown as SearchQuery, req.user?.id));
}

export async function getMapListings(req: Request, res: Response) {
  ok(res, await listingsService.getMapListings(req.query as unknown as SearchQuery));
}

export async function getListing(req: Request, res: Response) {
  ok(res, await listingsService.getListing(id(req), req.user?.id, req.user?.role));
}

export async function createListing(req: Request, res: Response) {
  ok(res, await listingsService.createListing(req.body, req.user!.id), 201);
}

export async function updateListing(req: Request, res: Response) {
  ok(res, await listingsService.updateListing(id(req), req.body, req.user!.id));
}

export async function deleteListing(req: Request, res: Response) {
  ok(res, await listingsService.deleteListing(id(req), req.user!.id));
}

export async function publishListing(req: Request, res: Response) {
  ok(res, await listingsService.publishListing(id(req), req.user!.id));
}

export async function archiveListing(req: Request, res: Response) {
  ok(res, await listingsService.archiveListing(id(req), req.user!.id));
}

export async function saveListing(req: Request, res: Response) {
  ok(res, await listingsService.saveListing(id(req), req.user!.id), 201);
}

export async function unsaveListing(req: Request, res: Response) {
  ok(res, await listingsService.unsaveListing(id(req), req.user!.id));
}

export async function getSavedListings(req: Request, res: Response) {
  ok(res, await listingsService.getSavedListings(req.user!.id));
}

export async function getMyListings(req: Request, res: Response) {
  ok(res, await listingsService.getMyListings(req.user!.id));
}

export async function getMyListing(req: Request, res: Response) {
  ok(res, await listingsService.getMyListing(id(req), req.user!.id));
}
