// frontend/src/pages/Report.jsx
import { useStats } from "../context/StatsContext";
import html2canvas from "html2canvas";
import { useState } from "react";

export default function Report() {
  const { latest, processTree, events } = useStats();
  const [loading, setLoading] = useState(false);

  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const downloadReport = async () => {
    setLoading(true);

    let chartImageBase64 = null;

    try {
      const chartNode = document.getElementById("chart-root");
      if (chartNode) {
        const canvas = await html2canvas(chartNode, {
          backgroundColor: "#1f2937"
        });
        chartImageBase64 = canvas.toDataURL("image/png");
      }
    } catch (err) {
      console.warn("Chart capture failed:", err);
    }

    const topProcesses = [];
    const flatten = (nodes) => {
      nodes.forEach((n) => {
        topProcesses.push({ pid: n.pid, name: n.name, cpu: n.cpu });
        if (n.children) flatten(n.children);
      });
    };
    flatten(processTree);
    topProcesses.sort((a, b) => (b.cpu ?? 0) - (a.cpu ?? 0));

    const payload = {
      title: "System Report",
      statsSnapshot: latest,
      chartImageBase64,
      processes: topProcesses.slice(0, 20),
      registry: [],
      events: events.slice(0, 30)
    };

    try {
      const res = await fetch(`${backend}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      alert("Failed to generate report: " + err.message);
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Generate System Report</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow w-full md:w-1/2 border dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This tool generates a professional PDF containing:
        </p>

        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6">
          <li>CPU & RAM usage snapshot</li>
          <li>System chart (captured automatically)</li>
          <li>Top processes</li>
          <li>Recent event logs</li>
        </ul>

        <button
          onClick={downloadReport}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow"
        >
          {loading ? "Generating Report..." : "Download PDF Report"}
        </button>
      </div>
    </div>
  );
}
