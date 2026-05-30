import { useEffect, useState } from "react";

export function useSimulatedProgress(active) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    setProgress(8);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return 92;
        const step = p < 50 ? 6 : p < 80 ? 3 : 1.5;
        return Math.min(92, p + step);
      });
    }, 350);

    return () => clearInterval(interval);
  }, [active]);

  const complete = () => setProgress(100);
  const reset = () => setProgress(0);

  return { progress, complete, reset };
}
