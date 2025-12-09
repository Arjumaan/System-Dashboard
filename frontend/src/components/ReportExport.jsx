// frontend/src/components/ReportExport.jsx
import html2canvas from "html2canvas";
import axios from "axios";
import { useStats } from "../context/StatsContext";

export default function ReportExport() {
  const { latest, history, events } = useStats();

  const generatePdf = async () => {
    let imgData = null;
    const el = document.getElementById("chart-root");
    if (el) {
      try {
        const canvas = await html2canvas(el, { scale: 2 });
        imgData = canvas.toDataURL("image/png");
      } catch (err) {
        console.error("html2canvas error", err);
      }
    }

    const payload = {
      title: "System Report",
      statsSnapshot: latest || {},
      chartImageBase64: imgData,
      processes: [], // optionally include fetched via REST
      registry: [], // optionally include fetched
      events: events || [],
    };

    try {
      const res = await axios.post("http://localhost:5000/report", payload, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `system_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Report generation error", err);
      alert("Failed to generate report: " + (err.message || JSON.stringify(err)));
    }
  };

  return (
    <div>
      <button onClick={generatePdf} className="px-4 py-2 bg-blue-600 text-white rounded">
        Generate PDF Report
      </button>
    </div>
  );
}
