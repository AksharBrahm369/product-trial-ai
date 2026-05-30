import { getStore } from "@netlify/blobs";
import { runTryOn } from "../../shared/tryonCore.js";

function bufferFromBase64(data, mimeType) {
  return {
    buffer: Buffer.from(data, "base64"),
    mimetype: mimeType || "image/jpeg",
    originalname: "image.jpg",
  };
}

export async function handler(event) {
  const { jobId } = JSON.parse(event.body || "{}");
  const store = getStore("tryon-jobs");

  if (!jobId) {
    return { statusCode: 400, body: "Missing jobId" };
  }

  try {
    const job = await store.get(jobId, { type: "json" });
    if (!job) {
      return { statusCode: 404, body: "Job not found" };
    }

    await store.setJSON(jobId, { ...job, status: "processing" });

    const personFile = bufferFromBase64(
      job.personImage.data,
      job.personImage.mimeType
    );
    const clothFiles = job.clothImages.map((img) =>
      bufferFromBase64(img.data, img.mimeType)
    );

    const result = await runTryOn(personFile, clothFiles);

    await store.setJSON(jobId, {
      status: "complete",
      image: result.image,
      model: result.model,
      completedAt: Date.now(),
    });
  } catch (err) {
    console.error("try-on-background error:", err);
    await store.setJSON(jobId, {
      status: "error",
      error: err.message || "Try-on failed",
      completedAt: Date.now(),
    });
  }

  return { statusCode: 202, body: "" };
}
