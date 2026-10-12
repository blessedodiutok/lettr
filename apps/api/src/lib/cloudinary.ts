// File: apps/api/src/lib/cloudinary.ts
// Configured Cloudinary v2 instance for uploading property photos
// and verification documents

import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/** Upload a file buffer to Cloudinary and return the result */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "raw" = "image",
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.CLOUDINARY_UPLOAD_FOLDER}/${folder}`,
        resource_type: resourceType,
        transformation:
          resourceType === "image"
            ? [
                { width: 1920, height: 1080, crop: "limit" },
                { quality: "auto:good" },
                { fetch_format: "auto" },
              ]
            : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );
    uploadStream.end(buffer);
  });
}

/** Delete an image from Cloudinary by its public_id */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
