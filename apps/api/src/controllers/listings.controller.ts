import type { NextFunction, Request, Response } from "express";
import * as listingsService from "../services/listings.service.js";

type StringQuery = Record<string, string | undefined>;

export async function searchListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.searchListings(req.query as StringQuery, req.user?.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMapListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.getMapListings(req.query as StringQuery);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.getListing(String(req.params.id), req.user?.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.createListing(req.body, req.user!.id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.updateListing(String(req.params.id), req.body, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function deleteListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.deleteListing(String(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function publishListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.publishListing(String(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function archiveListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.archiveListing(String(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function saveListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.saveListing(String(req.params.id), req.user!.id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function unsaveListing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.unsaveListing(String(req.params.id), req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getSavedListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.getSavedListings(req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMyListings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listingsService.getMyListings(req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
