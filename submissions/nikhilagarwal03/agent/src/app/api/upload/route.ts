import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRESIGNED_URL_TTL_SECONDS = 60;

function getS3Config() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET_NAME;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("AWS S3 configuration is incomplete");
  }

  return { region, bucket, accessKeyId, secretAccessKey };
}

function safeFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() ?? "capture.jpg";
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized || "capture.jpg";
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { filename?: unknown }).filename !== "string" ||
    typeof (body as { contentType?: unknown }).contentType !== "string"
  ) {
    return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
  }

  try {
    const { region, bucket, accessKeyId, secretAccessKey } = getS3Config();
    const filename = safeFilename((body as { filename: string }).filename);
    const contentType = (body as { contentType: string }).contentType;
    const key = `captures/${Date.now()}-${filename}`;
    const client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
    const command = new PutObjectCommand({
      Bucket: bucket,
      ContentType: contentType,
      Key: key,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGNED_URL_TTL_SECONDS });
    const bucketUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL?.replace(/\/$/, "") ?? `https://${bucket}.s3.${region}.amazonaws.com`;

    return NextResponse.json({
      uploadUrl,
      finalImageUrl: `${bucketUrl}/${key.split("/").map(encodeURIComponent).join("/")}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create upload URL" },
      { status: 500 },
    );
  }
}