export default function ReportButton() {
  const download = () => {
    window.open("http://localhost:5000/report", "_blank");
  };

  return (
    <button onClick={download} style={{ padding: "10px", cursor: "pointer" }}>
      Download PDF Report
    </button>
  );
}
