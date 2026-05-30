import "./loadEnv.js";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import tryOnRouter from "./routes/tryon.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/api", tryOnRouter);

const clientDist = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`OpenAI API key: ${hasKey ? "loaded" : "MISSING — check .env in project root"}`);
});
