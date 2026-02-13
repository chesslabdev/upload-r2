import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Rota da API
    if (url.pathname === "/api/sign" && request.method === "POST") {
      const body = await request.json();
      const filename = (body.filename || "upload.bin").toString();
      const contentType = (body.contentType || "application/octet-stream").toString();

      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
      const key = `uploads/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;

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

    // Assets são servidos automaticamente pelo Wrangler
    return new Response("Not Found", { status: 404 });
  },
};
