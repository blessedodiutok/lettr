// File storage. Cloudinary when configured; local disk otherwise (development only).
// The demo stores nothing: photos become sample images and documents a sample
// placeholder, so visitors can't publish their own files or leave real IDs here.
//  - Public images (property photos, avatars) get a public URL.
//  - Private files (identity documents) are stored as authenticated Cloudinary
//    assets or outside the public folder, and are only readable through
//    short-lived signed URLs or an admin-only route.

import { v2 as cloudinary } from "cloudinary";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env, isDemo, isProduction } from "../config/env.js";
import { DEMO_DOCUMENT_ID, randomSamplePhoto } from "../demo/samplePhotos.js";

export const useCloudinary = !isDemo && Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else if (!isProduction && !isDemo) {
  console.warn("⚠️  Cloudinary not configured — files are stored on local disk (development only)");
}

/** Root of local uploads; public files are served at /api/media. */
export const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), ".uploads");
const PUBLIC_DIR = path.join(LOCAL_UPLOAD_ROOT, "public");
const PRIVATE_DIR = path.join(LOCAL_UPLOAD_ROOT, "private");
export const LOCAL_PUBLIC_DIR = PUBLIC_DIR;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export interface StoredFile {
  url: string;
  publicId: string;
}

function uploadToCloudinary(buffer: Buffer, folder: string, options: { private?: boolean; image?: boolean }) {
  return new Promise<StoredFile>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.CLOUDINARY_UPLOAD_FOLDER}/${folder}`,
        resource_type: "image",
        type: options.private ? "authenticated" : "upload",
        transformation: options.image ? [{ width: 2400, height: 2400, crop: "limit" }, { quality: "auto:good" }] : undefined,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary returned no result"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

async function saveLocally(buffer: Buffer, folder: string, mimeType: string, isPrivate: boolean): Promise<StoredFile> {
  const dir = path.join(isPrivate ? PRIVATE_DIR : PUBLIC_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${EXTENSIONS[mimeType] ?? "bin"}`;
  await fs.writeFile(path.join(dir, name), buffer);
  const publicId = `local:${isPrivate ? "private" : "public"}/${folder}/${name}`;
  return { publicId, url: isPrivate ? publicId : `/api/media/${folder}/${name}` };
}

/** Check the file's leading bytes — the MIME type a client sends can be spoofed. */
function assertSignature(buffer: Buffer, mimeType: string) {
  const startsWith = (bytes: number[], offset = 0) => bytes.every((byte, i) => buffer[offset + i] === byte);
  const valid =
    (mimeType === "image/jpeg" && startsWith([0xff, 0xd8, 0xff])) ||
    (mimeType === "image/png" && startsWith([0x89, 0x50, 0x4e, 0x47])) ||
    (mimeType === "image/webp" && startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) ||
    (mimeType === "application/pdf" && startsWith([0x25, 0x50, 0x44, 0x46]));
  if (!valid) throw Object.assign(new Error("That file isn't a valid image or PDF."), { statusCode: 400 });
}

export async function storePublicImage(buffer: Buffer, folder: string, mimeType: string): Promise<StoredFile> {
  if (isDemo) return { url: randomSamplePhoto(), publicId: `demo:photo/${crypto.randomUUID()}` };
  assertSignature(buffer, mimeType);
  if (useCloudinary) return uploadToCloudinary(buffer, folder, { image: true });
  if (isProduction) throw new Error("File storage is not configured");
  return saveLocally(buffer, folder, mimeType, false);
}

export async function storePrivateFile(buffer: Buffer, folder: string, mimeType: string): Promise<StoredFile> {
  if (isDemo) return { url: DEMO_DOCUMENT_ID, publicId: DEMO_DOCUMENT_ID };
  assertSignature(buffer, mimeType);
  if (useCloudinary) return uploadToCloudinary(buffer, folder, { private: true });
  if (isProduction) throw new Error("File storage is not configured");
  return saveLocally(buffer, folder, mimeType, true);
}

export async function deleteStoredFile(publicId: string): Promise<void> {
  if (publicId.startsWith("demo:")) return;
  if (publicId.startsWith("local:")) {
    await fs.rm(path.join(LOCAL_UPLOAD_ROOT, publicId.slice("local:".length)), { force: true });
    return;
  }
  if (useCloudinary) await cloudinary.uploader.destroy(publicId).catch(() => undefined);
}

/** A link to a private file that expires after `ttlSeconds` (Cloudinary), or the local path for the admin route. */
export function privateFileAccess(publicId: string, ttlSeconds = 600): { kind: "url"; url: string } | { kind: "local"; filePath: string } | { kind: "demo" } {
  if (publicId === DEMO_DOCUMENT_ID) return { kind: "demo" };
  if (publicId.startsWith("local:")) {
    return { kind: "local", filePath: path.join(LOCAL_UPLOAD_ROOT, publicId.slice("local:".length)) };
  }
  const url = cloudinary.url(publicId, {
    type: "authenticated",
    resource_type: "image",
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
  return { kind: "url", url };
}
