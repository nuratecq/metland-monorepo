import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// lazy - use eval to avoid turbopack static resolution when not installed
async function getSignedUrl(client: S3Client, cmd: unknown, opts: { expiresIn: number }): Promise<string> {
  const dynImport = (0, eval)("import");
  try {
    const mod = (await dynImport("@aws-sdk/s3-presigner")) as { getSignedUrl: (c: S3Client, cmd: unknown, o: { expiresIn: number }) => Promise<string> };
    return mod.getSignedUrl(client, cmd as never, opts);
  } catch {
    throw new Error("@aws-sdk/s3-presigner not installed — install it in packages/r2 to enable presign");
  }
}

export function createR2Client() {
  const endpoint = process.env.R2_ENDPOINT; // https://<account>.r2.cloudflarestorage.com
  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
  if (!endpoint) throw new Error("R2_ENDPOINT missing");
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function r2KeyFor(opts: {
  app: "project-management" | "ai-catalogue";
  entity: string;
  entityId: string;
  subdir?: string;
  filename: string;
}): string {
  // docs/PRD.md:1202 — use UUID randomized key, not filename as identifier
  const ext = opts.filename.includes(".") ? "." + opts.filename.split(".").pop() : "";
  const uuid = randomUUID();
  const safe = sanitizeFilename(opts.filename);
  // keep original name for display but key is randomized
  const base = `${opts.app}/${opts.entity}/${opts.entityId}/${opts.subdir ?? "documents"}/${uuid}${ext}`;
  void safe;
  return base;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

// Allowed MIME + size (docs/PRD.md:1280)
export const ALLOWED_MIME = new Set([
  "image/jpeg","image/png","image/webp","application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
]);
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default, excel 20MB override via param

export function validateFile(opts: { mime: string; size: number; filename: string }) {
  if (!ALLOWED_MIME.has(opts.mime)) throw new Error(`MIME not allowed: ${opts.mime}`);
  if (opts.size > MAX_FILE_SIZE) throw new Error(`File too large: ${opts.size}`);
  if (!opts.filename || opts.filename.length > 255) throw new Error("Invalid filename");
}

export async function presignPut(opts: {
  bucket: string;
  key: string;
  mime: string;
  expiresSec?: number;
}) {
  const client = createR2Client();
  const cmd = new PutObjectCommand({ Bucket: opts.bucket, Key: opts.key, ContentType: opts.mime });
  return getSignedUrl(client, cmd, { expiresIn: opts.expiresSec ?? 900 }); // 15m
}

export async function presignGet(opts: { bucket: string; key: string; expiresSec?: number }) {
  const client = createR2Client();
  const cmd = new GetObjectCommand({ Bucket: opts.bucket, Key: opts.key });
  return getSignedUrl(client, cmd, { expiresIn: opts.expiresSec ?? 900 });
}

export async function deleteObject(opts: { bucket: string; key: string }) {
  const client = createR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: opts.bucket, Key: opts.key }));
}
