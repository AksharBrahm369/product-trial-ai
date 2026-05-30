import { getStore } from "@netlify/blobs";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  const jobId = event.queryStringParameters?.jobId;

  if (!jobId) {
    return json(400, { error: "Missing jobId" });
  }

  try {
    const store = getStore("tryon-jobs");
    const job = await store.get(jobId, { type: "json" });

    if (!job) {
      return json(404, { error: "Job not found" });
    }

    if (job.status === "complete") {
      return json(200, {
        status: "complete",
        image: job.image,
        model: job.model,
      });
    }

    if (job.status === "error") {
      return json(200, {
        status: "error",
        error: job.error || "Try-on failed",
      });
    }

    return json(200, { status: job.status || "pending" });
  } catch (err) {
    console.error("try-on-status error:", err);
    return json(500, { error: err.message || "Failed to get status" });
  }
}
