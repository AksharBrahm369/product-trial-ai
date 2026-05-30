import { useCallback, useEffect, useState } from "react";
import ImageUpload from "./components/ImageUpload.jsx";
import MultiClothUpload from "./components/MultiClothUpload.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import TryOnHistory from "./components/TryOnHistory.jsx";
import { useSimulatedProgress } from "./hooks/useSimulatedProgress.js";
import { useTryOnHistory } from "./hooks/useTryOnHistory.js";
import { apiUrl, parseJsonResponse } from "./api.js";
import "./App.css";

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
              ? "OpenAI API key is missing. In Vercel/Netlify: add OPENAI_API_KEY in environment variables, then redeploy."
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
        if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
          setNetworkWarning(
            "VITE_API_URL is not set on Netlify. Add your Render API URL (e.g. https://your-app.onrender.com) in Netlify → Environment variables, then redeploy. See DEPLOY-FREE.md."
          );
        } else {
          setNetworkWarning(
            import.meta.env.PROD
              ? err.message
              : "Cannot reach the backend. Run npm run dev and open http://localhost:5173"
          );
        }
      });
  }, []);

  const canSubmit = personFile && clothFiles.length > 0 && !loading;

  const handleTryOn = useCallback(async () => {
    if (!personFile || clothFiles.length === 0) return;

    setLoading(true);
    setError("");
    setResultImage(null);
    reset();

    const formData = new FormData();
    formData.append("personImage", personFile);
    clothFiles.forEach((file) => formData.append("clothImages", file));

    try {
      const res = await fetch(apiUrl("/api/try-on"), {
        method: "POST",
        body: formData,
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      complete();
      setResultImage(data.image);
      addToHistory({
        image: data.image,
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
