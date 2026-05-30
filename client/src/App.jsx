import { useCallback, useEffect, useState } from "react";
import ImageUpload from "./components/ImageUpload.jsx";
import MultiClothUpload from "./components/MultiClothUpload.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import TryOnHistory from "./components/TryOnHistory.jsx";
import { useSimulatedProgress } from "./hooks/useSimulatedProgress.js";
import { useTryOnHistory } from "./hooks/useTryOnHistory.js";
import { apiUrl, parseJsonResponse } from "./api.js";
import { filesToPayload } from "./lib/uploadImages.js";
import "./App.css";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pollTryOnResult(jobId) {
  for (let i = 0; i < 90; i++) {
    await sleep(2000);
    const res = await fetch(apiUrl(`/api/try-on-status?jobId=${jobId}`));
    const data = await parseJsonResponse(res);
    if (data.status === "complete") return data;
    if (data.status === "error") {
      throw new Error(data.error || "Try-on failed");
    }
  }
  throw new Error("Timed out waiting for AI result. Try again with smaller images.");
}

export default function App() {
  const [personFile, setPersonFile] = useState(null);
  const [clothFiles, setClothFiles] = useState([]);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { progress, complete, reset } = useSimulatedProgress(loading);
  const { history, addToHistory, removeFromHistory, clearHistory } =
    useTryOnHistory();
  const [networkWarning, setNetworkWarning] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/health"))
      .then(async (r) => {
        const data = await parseJsonResponse(r);
        if (!data.hasApiKey) {
          setNetworkWarning(
            import.meta.env.PROD
              ? "OpenAI API key is missing. In Netlify: Site settings → Environment variables → add OPENAI_API_KEY, then redeploy."
              : "OpenAI API key is missing. Add OPENAI_API_KEY to your .env file and restart the server."
          );
        } else if (!data.canReachOpenAI) {
          setNetworkWarning(
            data.networkError ||
              "Cannot reach OpenAI servers. Check your internet, DNS, firewall, or VPN."
          );
        } else {
          setNetworkWarning("");
        }
      })
      .catch((err) => {
        setNetworkWarning(
          import.meta.env.PROD
            ? err.message
            : "Cannot reach the backend. Run npm run dev and open http://localhost:5173"
        );
      });
  }, []);

  const canSubmit = personFile && clothFiles.length > 0 && !loading;

  const handleTryOn = useCallback(async () => {
    if (!personFile || clothFiles.length === 0) return;

    setLoading(true);
    setError("");
    setResultImage(null);
    reset();

    try {
      const useNetlifyBackground =
        import.meta.env.PROD && !import.meta.env.VITE_API_URL;

      let imageResult;

      if (useNetlifyBackground) {
        const payload = await filesToPayload(personFile, clothFiles);
        const startRes = await fetch(apiUrl("/api/try-on-start"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const startData = await parseJsonResponse(startRes);
        if (!startRes.ok && startRes.status !== 202) {
          throw new Error(startData.error || `Request failed (${startRes.status})`);
        }
        const done = await pollTryOnResult(startData.jobId);
        imageResult = done.image;
      } else {
        const formData = new FormData();
        formData.append("personImage", personFile);
        clothFiles.forEach((file) => formData.append("clothImages", file));

        const res = await fetch(apiUrl("/api/try-on"), {
          method: "POST",
          body: formData,
        });
        const data = await parseJsonResponse(res);

        if (!res.ok) {
          if (data.useBackground && import.meta.env.PROD) {
            const payload = await filesToPayload(personFile, clothFiles);
            const startRes = await fetch(apiUrl("/api/try-on-start"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const startData = await parseJsonResponse(startRes);
            const done = await pollTryOnResult(startData.jobId);
            imageResult = done.image;
          } else {
            throw new Error(data.error || `Request failed (${res.status})`);
          }
        } else {
          imageResult = data.image;
        }
      }

      complete();
      setResultImage(imageResult);
      addToHistory({
        image: imageResult,
        clothCount: clothFiles.length,
      });
    } catch (err) {
      setError(err.message || "Failed to generate try-on.");
    } finally {
      setLoading(false);
    }
  }, [personFile, clothFiles, addToHistory, complete, reset]);

  const handleReset = () => {
    setPersonFile(null);
    setClothFiles([]);
    setResultImage(null);
    setError("");
    reset();
  };

  return (
    <div className="app">
      <header className="header">
        <p className="eyebrow">AI product trial</p>
        <h1 className="title">
          See yourself in <em>any outfit</em>
        </h1>
        <p className="subtitle">
          Upload your photo and one or more clothing images. OpenAI will
          generate a realistic virtual try-on.
        </p>
      </header>

      <main className="main">
        <section className="uploads">
          <ImageUpload
            id="person"
            label="Your photo"
            hint="Full-body or upper-body, good lighting"
            file={personFile}
            onFileChange={setPersonFile}
          />
          <MultiClothUpload files={clothFiles} onFilesChange={setClothFiles} />
        </section>

        {loading && (
          <ProgressBar
            progress={progress}
            label="AI is combining your photo with the outfit…"
          />
        )}

        <div className="actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canSubmit}
            onClick={handleTryOn}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden />
                Generating try-on…
              </>
            ) : (
              "Try on with AI"
            )}
          </button>
          {(personFile || clothFiles.length > 0 || resultImage) && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={loading}
              onClick={handleReset}
            >
              Start over
            </button>
          )}
        </div>

        {networkWarning && !loading && (
          <div className="alert alert-warning" role="status">
            {networkWarning}
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <section className="result-section" aria-live="polite">
          {resultImage ? (
            <div className="result-card">
              <h2 className="result-title">Your try-on result</h2>
              <img
                src={resultImage}
                alt="AI virtual try-on result"
                className="result-image"
              />
              <a
                href={resultImage}
                download="product-room-tryon.png"
                className="btn btn-secondary"
              >
                Download image
              </a>
            </div>
          ) : (
            <div className="result-placeholder">
              {loading ? (
                <p>Almost there — finishing your look…</p>
              ) : (
                <p>Your generated try-on will appear here.</p>
              )}
            </div>
          )}
        </section>

        <TryOnHistory
          history={history}
          onSelect={setResultImage}
          onRemove={removeFromHistory}
          onClear={clearHistory}
        />
      </main>

      <footer className="footer">
        <p>
          Powered by OpenAI image API. Add your key in{" "}
          <code>.env</code> — API usage is billed by OpenAI (trial credits may
          apply for new accounts).
        </p>
      </footer>
    </div>
  );
}
