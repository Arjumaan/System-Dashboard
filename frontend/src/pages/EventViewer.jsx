import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function EventViewer() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/events")
      .then((res) => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const badge = (type) => {
    const base = "px-3 py-1 rounded-full text-sm font-semibold";
    if (type === "Error") return base + " bg-red-600 text-white";
    if (type === "Warning") return base + " bg-yellow-400 text-black";
    return base + " bg-blue-600 text-white";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Event Viewer</h1>

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton height={80} />
          <LoadingSkeleton height={80} />
          <LoadingSkeleton height={80} />
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((e, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-5 shadow rounded-xl border dark:border-gray-700"
            >
              <span className={badge(e.EntryType)}>{e.EntryType}</span>
              <p className="mt-3 text-gray-700 dark:text-gray-300">
                {e.Message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
