import formidable from "formidable";
import fs from "fs/promises";
import {
  errorToStatus,
  formatApiError,
  runTryOn,
} from "../shared/tryonCore.js";

export const config = {
  api: { bodyParser: false },
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: true,
      maxFileSize: 10 * 1024 * 1024,
      maxFiles: 7,
    });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function toFileRecord(file) {
  const buffer = await fs.readFile(file.filepath);
  return {
    buffer,
    mimetype: file.mimetype || "image/jpeg",
    originalname: file.originalFilename || file.newFilename || "image.jpg",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { files } = await parseForm(req);

    const personRaw = asArray(files.personImage)[0];
    const clothRaw = [
      ...asArray(files.clothImages),
      ...asArray(files.clothImage),
    ];

    if (!personRaw) {
      return res.status(400).json({ error: "Please upload your photo." });
    }
    if (clothRaw.length === 0) {
      return res
        .status(400)
        .json({ error: "Please upload at least one clothing image." });
    }

    const personFile = await toFileRecord(personRaw);
    const clothFiles = await Promise.all(clothRaw.map(toFileRecord));

    const result = await runTryOn(personFile, clothFiles);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Vercel try-on error:", err);
    const status = errorToStatus(err);
    const message = formatApiError(err);

    if (status === 401) {
      return res.status(401).json({
        error:
          "Invalid OpenAI API key. Set OPENAI_API_KEY in Vercel Project Settings → Environment Variables.",
      });
    }
    if (status === 429) {
      return res.status(429).json({
        error:
          "OpenAI rate limit or quota reached. Add billing credits at platform.openai.com.",
      });
    }

    return res.status(status).json({ error: message });
  }
}
