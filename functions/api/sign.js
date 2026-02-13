import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const filename = (body.filename || "upload.bin").toString();
  const contentType = (body.contentType || "application/octet-stream").toString();

  // key seguro (evita sobrescrever)
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;

  // (opcional) trava de acesso simples
  // const token = request.headers.get("authorization") || "";
  // if (token !== `Bearer ${env.UPLOAD_TOKEN}`) return new Response("Unauthorized", { status: 401 });

  const s3 = new S3Client({
    region: "auto",
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 600 });
  const publicUrl = `${env.PUBLIC_BASE_URL}/${key}`;

  return Response.json({ key, uploadUrl, publicUrl });
}
