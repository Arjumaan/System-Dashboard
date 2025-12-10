// frontend/src/layout/Topbar.jsx
import DarkModeToggle from "../components/DarkModeToggle";
import { useStats } from "../context/StatsContext";

export default function Topbar() {
  const { alerts } = useStats();

  const alertCount = alerts.length;
  const latestAlert = alerts[0];

  const isCritical =
    latestAlert?.type === "cpu" ||
    latestAlert?.type === "ram" ||
    latestAlert?.level === "Error";

  return (
    <div className="w-full bg-white dark:bg-gray-900 shadow px-10 py-4 flex justify-between items-center border-b dark:border-gray-800 transition-all">
      {/* Page Title */}
      <h2 className="text-xl font-semibold dark:text-white">
        System Analytics Overview
      </h2>

      {/* Right-side Controls */}
      <div className="flex items-center gap-6">
        
        {/* Alerts Badge */}
        <div
          className={`px-4 py-1 rounded-full text-sm font-semibold shadow transition
            ${
              alertCount === 0
                ? "bg-gray-200 dark:bg-gray-700 dark:text-gray-300 text-gray-700"
                : isCritical
                ? "bg-red-600 text-white animate-pulse"
                : "bg-yellow-500 text-black"
            }
          `}
        >
          Alerts: {alertCount}
        </div>

        {/* Dark Mode Toggle */}
        <DarkModeToggle />
      </div>
    </div>
  );
}
