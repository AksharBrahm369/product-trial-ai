import "./ProgressBar.css";

export default function ProgressBar({ progress, label }) {
  const value = Math.round(Math.min(100, Math.max(0, progress)));

  return (
    <div className="progress-wrap" role="status" aria-live="polite">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">{value}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
