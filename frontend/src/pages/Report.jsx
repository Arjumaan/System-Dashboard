import axios from "axios";
import { useState } from "react";

export default function Report() {
  const [loading, setLoading] = useState(false);

  const downloadReport = async () => {
    setLoading(true);

    window.open("http://localhost:5000/report", "_blank");

    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Generate Report</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow w-full md:w-1/2">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Click the button below to generate a detailed PDF report containing:
        </p>

        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4">
          <li>CPU & RAM statistics</li>
          <li>Running processes snapshot</li>
          <li>Registry info</li>
          <li>Event logs (latest 10)</li>
        </ul>

        <button
          onClick={downloadReport}
          className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Generating..." : "Download Report"}
        </button>
      </div>
    </div>
  );
}
