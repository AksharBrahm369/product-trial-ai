import { useEffect, useRef, useState } from "react";
import "./MultiClothUpload.css";

const MAX_ITEMS = 5;

export default function MultiClothUpload({ files, onFilesChange }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const addFiles = (incoming) => {
    const images = [...incoming].filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;

    const merged = [...files, ...images].slice(0, MAX_ITEMS);
    onFilesChange(merged);
  };

  const handleChange = (e) => {
    addFiles(e.target.files || []);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files || []);
  };

  const removeAt = (index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const canAddMore = files.length < MAX_ITEMS;

  return (
    <div className="upload-card multi-cloth">
      <label className="upload-label">Clothing items</label>
      <p className="upload-hint">
        Add up to {MAX_ITEMS} pieces (shirt, pants, jacket, etc.)
      </p>

      <div
        className="cloth-grid"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {files.map((file, i) => (
          <div key={`${file.name}-${i}`} className="cloth-thumb">
            <img src={previews[i]} alt="" />
            <button
              type="button"
              className="cloth-remove"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${file.name}`}
            >
              ×
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            className="cloth-add"
            onClick={() => inputRef.current?.click()}
          >
            <span className="upload-icon" aria-hidden>
              +
            </span>
            <span>Add clothing</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="upload-input"
        onChange={handleChange}
      />

      {files.length > 0 && (
        <p className="upload-filename">
          {files.length} item{files.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
