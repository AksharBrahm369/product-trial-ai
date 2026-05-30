import { useEffect, useRef, useState } from "react";
import "./ImageUpload.css";

export default function ImageUpload({ id, label, hint, file, onFileChange }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) onFileChange(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type.startsWith("image/")) onFileChange(dropped);
  };

  return (
    <div className="upload-card">
      <label htmlFor={id} className="upload-label">
        {label}
      </label>
      <p className="upload-hint">{hint}</p>

      <div
        className={`upload-zone ${preview ? "has-preview" : ""}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="upload-input"
          onChange={handleChange}
        />

        {preview ? (
          <img src={preview} alt="" className="upload-preview" />
        ) : (
          <div className="upload-empty">
            <span className="upload-icon" aria-hidden>
              ↑
            </span>
            <span>Click or drag image</span>
          </div>
        )}
      </div>

      {file && (
        <p className="upload-filename" title={file.name}>
          {file.name}
        </p>
      )}
    </div>
  );
}
