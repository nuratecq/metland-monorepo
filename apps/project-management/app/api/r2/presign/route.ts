import { NextRequest, NextResponse } from "next/server";
import { r2PresignSchema } from "@metland/validators";
import { r2KeyFor, validateFile } from "@metland/r2";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = r2PresignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { filename, mime, size, entity, entityId } = parsed.data;
  try {
    validateFile({ mime, size, filename });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }

  const key = r2KeyFor({
    app: "project-management",
    entity: entity as never,
    entityId,
    filename,
  });

  // If R2 env missing, return key for dev (file fallback) without presign
  if (!process.env.R2_ENDPOINT) {
    return NextResponse.json({ key, url: null, note: "R2 not configured — use local upload" });
  }

  const { presignPut } = await import("@metland/r2");
  const bucket = process.env.R2_PM_BUCKET ?? process.env.R2_BUCKET ?? "metland-pm-dev";
  const url = await presignPut({ bucket, key, mime });
  return NextResponse.json({ key, url, bucket });
}
