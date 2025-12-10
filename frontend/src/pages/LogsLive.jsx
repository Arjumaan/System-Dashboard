// frontend/src/pages/LogsLive.jsx
import React, { useEffect, useRef, useState } from "react";
import { useStats } from "../context/StatsContext";

export default function LogsLive() {
  const { events } = useStats();
  const [filter, setFilter] = useState("");
  const scrollRef = useRef();

  const filtered = (events || []).filter((e) => {
    const m = e.Message || e.message || JSON.stringify(e);
    return m.toLowerCase().includes(filter.toLowerCase());
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered]);

  const levelColor = (e) => {
    const msg = e.LevelDisplayName || e.EntryType || "";
    if (/error/i.test(msg)) return "text-red-500 font-semibold";
    if (/warn/i.test(msg)) return "text-yellow-500 font-semibold";
    return "text-blue-500 font-semibold";
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Live Logs</h1>

      <input
        className="p-3 border rounded w-full mb-4 dark:bg-gray-900 dark:text-white"
        placeholder="Search logs…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div
        ref={scrollRef}
        className="space-y-3 max-h-[65vh] overflow-y-auto pr-2"
      >
        {filtered.map((ev, i) => {
          const text = ev.Message || ev.message || JSON.stringify(ev);
          const time =
            ev.TimeCreated || ev.time || new Date().toLocaleTimeString();

          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border dark:border-gray-700"
            >
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {time}
                </span>
                <span className={levelColor(ev)}>
                  {ev.LevelDisplayName || ev.EntryType || "Info"}
                </span>
              </div>
              <div className="mt-2 dark:text-gray-200">{text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
