import { getStore } from "@netlify/blobs";
import { randomUUID } from "crypto";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { personImage, clothImages } = body;

    if (!personImage?.data || !clothImages?.length) {
      return json(400, { error: "Missing person or clothing images." });
    }

    const jobId = randomUUID();
    const store = getStore("tryon-jobs");

    await store.setJSON(jobId, {
      status: "pending",
      personImage,
      clothImages,
      createdAt: Date.now(),
    });

    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "";
    if (siteUrl) {
      fetch(`${siteUrl}/.netlify/functions/try-on-background`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      }).catch((err) => console.error("Background trigger failed:", err));
    }

    return json(202, { jobId, status: "pending" });
  } catch (err) {
    console.error("try-on-start error:", err);
    return json(500, { error: err.message || "Failed to start try-on." });
  }
}
