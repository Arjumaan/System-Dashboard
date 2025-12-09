// frontend/src/components/Alerts.jsx
import React from "react";
import { useStats } from "../context/StatsContext";

export default function Alerts() {
  const { alerts } = useStats();

  if (!alerts || alerts.length === 0) return null;

  // show top 4 alerts
  const top = alerts.slice(0, 4);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {top.map((a, i) => (
        <div key={i} className="bg-red-600 text-white p-3 rounded shadow">
          <div className="font-semibold">{(a.type || "ALERT").toUpperCase()}</div>
          <div className="text-sm">{a.message}</div>
        </div>
      ))}
    </div>
  );
}
