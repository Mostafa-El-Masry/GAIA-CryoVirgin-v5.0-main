import { NextResponse } from "next/server";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME_PREFIX = "image/";

type R2Config = {
  endpoint?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

function hasValidConfig(cfg: R2Config): cfg is Required<R2Config> {
  return Boolean(
    cfg.endpoint && cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey
  );
}

function createR2Client(cfg: Required<R2Config>) {
  return new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/avif") return ".avif";
  if (mime === "image/gif") return ".gif";
  return "";
}

function hashId(p: string) {
  let h = 0,
    i = 0;
  while (i < p.length) {
    h = ((h << 5) - h + p.charCodeAt(i++)) | 0;
  }
  return Math.abs(h).toString(36);
}

export async function POST(request: Request) {
  const cfg: R2Config = {
    endpoint: process.env.CLOUDFLARE_R2_S3_ENDPOINT,
    bucket: process.env.CLOUDFLARE_R2_BUCKET,
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  };

  if (!hasValidConfig(cfg)) {
    return NextResponse.json(
      { error: "R2 is not configured. Set CLOUDFLARE_R2_* env vars." },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const title = form.get("title");

  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: "file is required" },
      { status: 400 }
    );
  }

  if (file.type && !file.type.startsWith(ALLOWED_MIME_PREFIX)) {
    return NextResponse.json(
      { error: "Only image uploads are supported right now." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const originalName =
    (file as File)?.name || title?.toString() || "upload";
  const extFromName = path.extname(originalName) || "";
  const ext = extFromName || extFromMime(file.type || "") || ".jpg";

  const key = `media/uploads/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}${ext}`;

  const client = createR2Client(cfg);

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  const now = new Date().toISOString();
  const id = hashId(key);

  return NextResponse.json({
    ok: true,
    item: {
      id,
      slug: id,
      type: "image",
      title: title?.toString() || originalName.replace(ext, "") || "Image",
      description: "Uploaded via GAIA Gallery",
      tags: [],
      source: "r2_image",
      r2Path: key,
      createdAt: now,
      updatedAt: now,
    },
  });
}
