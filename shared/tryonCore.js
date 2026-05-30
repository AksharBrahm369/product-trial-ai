import OpenAI, { toFile } from "openai";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function buildTryOnPrompt(clothCount) {
  const clothingRefs =
    clothCount === 1
      ? "- Image 2: A clothing item the customer wants to wear."
      : `- Images 2 through ${clothCount + 1}: Clothing items the customer wants to wear (${clothCount} pieces).`;

  const task =
    clothCount === 1
      ? "Dress the person from image 1 in the exact clothing from image 2."
      : `Dress the person from image 1 in all clothing items from the reference images (images 2–${clothCount + 1}). Combine them into one coherent outfit (e.g. top, bottom, outerwear) with correct layering.`;

  return `Create a photorealistic virtual try-on image for an e-commerce product trial.

Reference images:
- Image 1: A real person (customer photo).
${clothingRefs}

Task: ${task} Preserve the person's face, identity, skin tone, hair, body proportions, and pose. Keep the original background and lighting style when possible. All garments must fit naturally with realistic fabric texture, folds, seams, and shadows. Do not change the person's identity. Output a single clean product-trial photo suitable for online shopping.`;
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey.includes("your-openai-api-key")) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it in .env (local) or Netlify Environment variables (production)."
    );
  }
  return new OpenAI({ apiKey });
}

export function getModel() {
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-1-mini";
}

export function formatApiError(err) {
  const cause = err.cause;
  const code = cause?.code || cause?.errno || err.code;

  if (code === "ENOTFOUND") {
    return "Cannot reach OpenAI (api.openai.com). Check your internet, DNS settings, firewall, or VPN.";
  }
  if (code === "ECONNREFUSED" || code === "ECONNRESET") {
    return "Connection to OpenAI failed. Your firewall or network may be blocking outbound HTTPS.";
  }
  if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT") {
    return "OpenAI request timed out. Try again.";
  }
  if (err.name === "APIConnectionError" || err.message === "Connection error.") {
    return "Network error while contacting OpenAI.";
  }

  return err.error?.message || err.message || "Failed to generate try-on image.";
}

export function validateImageFiles(files, label) {
  for (const file of files) {
    if (!ALLOWED.includes(file.mimetype)) {
      return `${label}: only JPEG, PNG, and WebP images are supported.`;
    }
  }
  return null;
}

export async function runTryOn(personFile, clothFiles) {
  const personErr = validateImageFiles([personFile], "Your photo");
  if (personErr) {
    const error = new Error(personErr);
    error.statusCode = 400;
    throw error;
  }

  const clothErr = validateImageFiles(clothFiles, "Clothing");
  if (clothErr) {
    const error = new Error(clothErr);
    error.statusCode = 400;
    throw error;
  }

  const client = getOpenAIClient();
  const model = getModel();

  const personUpload = await toFile(
    personFile.buffer,
    personFile.originalname || "person.jpg",
    { type: personFile.mimetype }
  );

  const clothUploads = await Promise.all(
    clothFiles.map((file, i) =>
      toFile(file.buffer, file.originalname || `cloth-${i + 1}.jpg`, {
        type: file.mimetype,
      })
    )
  );

  const result = await client.images.edit({
    model,
    image: [personUpload, ...clothUploads],
    prompt: buildTryOnPrompt(clothFiles.length),
    size: "1024x1024",
    quality: "medium",
    n: 1,
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    const error = new Error(
      "OpenAI did not return an image. Try a different model in OPENAI_IMAGE_MODEL."
    );
    error.statusCode = 502;
    throw error;
  }

  return {
    image: `data:image/png;base64,${b64}`,
    model,
    clothCount: clothFiles.length,
  };
}

export async function checkHealth() {
  const hasApiKey = Boolean(
    process.env.OPENAI_API_KEY?.trim() &&
      !process.env.OPENAI_API_KEY.includes("your-openai-api-key")
  );

  let canReachOpenAI = false;
  let networkError = null;

  if (hasApiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      canReachOpenAI =
        response.status === 200 ||
        response.status === 401 ||
        response.status === 403;
    } catch (err) {
      networkError = formatApiError(err);
    }
  }

  return {
    ok: hasApiKey && canReachOpenAI,
    hasApiKey,
    canReachOpenAI,
    networkError,
    model: getModel(),
  };
}

export function errorToStatus(err) {
  if (err.statusCode) return err.statusCode;
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 600) return status;

  const message = formatApiError(err);
  if (message.includes("OPENAI_API_KEY")) return 500;
  if (err.name === "APIConnectionError") return 503;
  if (
    ["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(
      err.cause?.code || err.code
    )
  ) {
    return 503;
  }
  return 500;
}
