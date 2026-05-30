import "./TryOnHistory.css";

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TryOnHistory({
  history,
  onSelect,
  onRemove,
  onClear,
}) {
  if (!history.length) return null;

  return (
    <section className="history-section">
      <div className="history-header">
        <h2 className="history-title">Recent try-ons</h2>
        <button type="button" className="btn-text" onClick={onClear}>
          Clear all
        </button>
      </div>

      <ul className="history-list">
        {history.map((item) => (
          <li key={item.id} className="history-item">
            <button
              type="button"
              className="history-thumb-btn"
              onClick={() => onSelect(item.image)}
              title="View this result"
            >
              <img src={item.image} alt="" />
            </button>
            <div className="history-meta">
              <span className="history-date">{formatDate(item.createdAt)}</span>
              <span className="history-count">
                {item.clothCount} item{item.clothCount !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              type="button"
              className="history-remove"
              onClick={() => onRemove(item.id)}
              aria-label="Remove from history"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
