import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "product-room-tryon-history";
const MAX_ITEMS = 8;

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useTryOnHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addToHistory = useCallback((entry) => {
    setHistory((prev) => {
      const next = [
        {
          id: crypto.randomUUID(),
          image: entry.image,
          createdAt: Date.now(),
          clothCount: entry.clothCount ?? 1,
        },
        ...prev,
      ].slice(0, MAX_ITEMS);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        const trimmed = next.slice(0, Math.max(1, MAX_ITEMS - 2));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch {
          /* storage full */
        }
        return trimmed;
      }
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((id) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addToHistory, removeFromHistory, clearHistory };
}
