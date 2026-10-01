export async function uploadToS3(file: File): Promise<string> {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Could not create S3 upload URL: ${details}`);
  }

  const { uploadUrl, finalImageUrl } = (await response.json()) as {
    uploadUrl?: string;
    finalImageUrl?: string;
  };

  if (!uploadUrl || !finalImageUrl) {
    throw new Error("Upload API returned an incomplete response");
  }

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!upload.ok) {
    throw new Error(`S3 upload failed with status ${upload.status}`);
  }

  return finalImageUrl;
}