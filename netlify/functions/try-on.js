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

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
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

    const personFile = toFileRecord(personRaw);
    const clothFiles = clothRaw.map(toFileRecord);

    const result = await runTryOn(personFile, clothFiles);
    return json(200, result);
  } catch (err) {
    console.error("Netlify try-on error:", err);
    const status = errorToStatus(err);
    const message = formatApiError(err);

    if (status === 401) {
      return json(401, {
        error: "Invalid OpenAI API key. Set OPENAI_API_KEY in Netlify environment variables.",
      });
    }
    if (status === 429) {
      return json(429, {
        error:
          "OpenAI rate limit or quota reached. Add billing credits at platform.openai.com.",
      });
    }

    return json(status, { error: message });
  }
}
