import parser from "lambda-multipart-parser";
import {
  errorToStatus,
  formatApiError,
  runTryOn,
} from "../../shared/tryonCore.js";

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function toFileRecord(file) {
  const buffer = Buffer.isBuffer(file.content)
    ? file.content
    : Buffer.from(file.content);
  return {
    buffer,
    mimetype: file.contentType || file.mimetype || "image/jpeg",
    originalname: file.filename || file.name || "image.jpg",
  };
}

/** Fast path: direct try-on (may timeout on free plan after 10s) */
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"] || "";

    let personFile;
    let clothFiles;

    if (contentType.includes("application/json")) {
      const body = JSON.parse(event.body || "{}");
      if (!body.personImage?.data || !body.clothImages?.length) {
        return json(400, { error: "Missing images in request body." });
      }
      personFile = {
        buffer: Buffer.from(body.personImage.data, "base64"),
        mimetype: body.personImage.mimeType || "image/jpeg",
        originalname: body.personImage.name || "person.jpg",
      };
      clothFiles = body.clothImages.map((img, i) => ({
        buffer: Buffer.from(img.data, "base64"),
        mimetype: img.mimeType || "image/jpeg",
        originalname: img.name || `cloth-${i + 1}.jpg`,
      }));
    } else {
      const form = await parser.parse(event);
      const files = form.files || [];
      const personRaw = files.find((f) => f.fieldname === "personImage");
      const clothRaw = files.filter(
        (f) => f.fieldname === "clothImages" || f.fieldname === "clothImage"
      );
      if (!personRaw) {
        return json(400, { error: "Please upload your photo." });
      }
      if (clothRaw.length === 0) {
        return json(400, { error: "Please upload at least one clothing image." });
      }
      personFile = toFileRecord(personRaw);
      clothFiles = clothRaw.map(toFileRecord);
    }

    const result = await runTryOn(personFile, clothFiles);
    return json(200, result);
  } catch (err) {
    console.error("Netlify try-on error:", err);
    const status = errorToStatus(err);
    const message = formatApiError(err);

    if (message.includes("timeout") || message.includes("Task timed out")) {
      return json(504, {
        error:
          "Request timed out (Netlify free limit is 10s). The app will retry using background processing.",
        useBackground: true,
      });
    }

    return json(status, { error: message });
  }
}
