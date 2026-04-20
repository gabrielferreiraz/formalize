import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

/**
 * Upload a file buffer to R2.
 * @param key  - Storage path, e.g. "artists/givago/logo.png"
 * @param body - File content as Buffer or Uint8Array
 * @param contentType - MIME type, e.g. "image/png"
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.length,
    })
  );

  return key;
}

/**
 * Delete a file from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}

/**
 * Generate a presigned URL for temporary read access (default: 1 hour).
 */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

/**
 * Build the public URL for a file (requires public bucket or custom domain).
 */
export function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    const base = R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL : `${R2_PUBLIC_URL}/`;
    return `${base}${key}`;
  }
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
}
