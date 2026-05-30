import "../loadEnv.js";
import express from "express";
import multer from "multer";
import {
  checkHealth,
  errorToStatus,
  formatApiError,
  runTryOn,
} from "../../shared/tryonCore.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function toFileRecord(file) {
  return {
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
  };
}

router.post(
  "/try-on",
  upload.fields([
    { name: "personImage", maxCount: 1 },
    { name: "clothImages", maxCount: 5 },
    { name: "clothImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const personFile = req.files?.personImage?.[0];
      const clothFiles = [
        ...(req.files?.clothImages || []),
        ...(req.files?.clothImage || []),
      ];

      if (!personFile) {
        return res.status(400).json({ error: "Please upload your photo." });
      }
      if (clothFiles.length === 0) {
        return res
          .status(400)
          .json({ error: "Please upload at least one clothing image." });
      }

      const result = await runTryOn(
        toFileRecord(personFile),
        clothFiles.map(toFileRecord)
      );
      res.json(result);
    } catch (err) {
      console.error("Try-on error:", err);
      const status = errorToStatus(err);
      const message = formatApiError(err);

      if (message.includes("OPENAI_API_KEY")) {
        return res.status(500).json({ error: message });
      }
      if (status === 401) {
        return res.status(401).json({
          error:
            "Invalid OpenAI API key. Check OPENAI_API_KEY in your .env file.",
        });
      }
      if (status === 429) {
        return res.status(429).json({
          error:
            "OpenAI rate limit or quota reached. Add billing credits at platform.openai.com or try again later.",
        });
      }

      res.status(status).json({ error: message });
    }
  }
);

router.get("/health", async (_req, res) => {
  res.json(await checkHealth());
});

export default router;
