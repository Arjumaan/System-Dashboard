import { useEffect, useState } from "react";

export default function UptimeBanner() {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setUptime(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="w-full bg-blue-50 dark:bg-blue-900 p-3 px-6 rounded-lg shadow mb-6 border border-blue-200 dark:border-blue-700">
      <p className="font-medium text-blue-700 dark:text-blue-200">
        System Dashboard Uptime: <span className="font-bold">{formatTime(uptime)}</span>
      </p>
    </div>
  );
}
