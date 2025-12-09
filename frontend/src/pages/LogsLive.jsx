// frontend/src/pages/LogsLive.jsx
import React, { useState } from "react";
import { useStats } from "../context/StatsContext";

export default function LogsLive() {
  const { events } = useStats();
  const [filter, setFilter] = useState("");

  const filtered = (events || []).filter((e) => {
    const m = e.Message || e.message || JSON.stringify(e);
    return m.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Live Logs</h1>

      <input
        className="p-2 border rounded w-full mb-4 dark:bg-gray-900 dark:text-white"
        placeholder="Filter logs..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="space-y-2 max-h-[60vh] overflow-auto">
        {filtered.map((ev, i) => {
          const text = ev.Message || ev.message || JSON.stringify(ev);
          const time = ev.TimeCreated || ev.time || "";
          return (
            <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded shadow">
              <div className="text-sm text-gray-500 dark:text-gray-400">{time}</div>
              <div className="mt-1">{text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
