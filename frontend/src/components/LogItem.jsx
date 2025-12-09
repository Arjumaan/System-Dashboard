// frontend/src/components/LogItem.jsx
export default function LogItem({ ev }) {
  const level = (ev.LevelDisplayName || "").toLowerCase();
  const color = level.includes("error") ? "bg-red-600 text-white"
              : level.includes("warning") ? "bg-yellow-400 text-black"
              : "bg-blue-600 text-white";

  const time = ev.TimeCreated || ev.time || "";
  const message = ev.Message || ev.message || ev;

  return (
    <div className="p-3 rounded shadow bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className={`px-2 py-1 rounded text-sm ${color}`}>{(ev.LevelDisplayName || "INFO").toUpperCase()}</div>
        <div className="text-xs text-gray-500">{time}</div>
      </div>
      <div className="mt-2 text-sm">{message}</div>
    </div>
  );
}
