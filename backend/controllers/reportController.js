// backend/controllers/reportController.js
const PDFDocument = require("pdfkit");

/**
 * GET /report
 * Quick on-demand report generator (server-side). Accepts no body for GET;
 * creates a small report using fresh system data. This complements POST /report
 * which accepts a payload (chart image, etc.).
 */
const si = require("systeminformation");

async function generateReport(req, res) {
  try {
    const cpuLoad = await si.currentLoad();
    const mem = await si.mem();
    const procs = await si.processes();
    const events = []; // not fetching events here (heavy). Client-side POST /report sends events.

    const statsSnapshot = {
      cpu: Number(cpuLoad.currentLoad.toFixed(2)),
      ram: Number(((mem.active / mem.total) * 100).toFixed(2)),
      time: new Date().toISOString(),
    };

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=system_report_${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text("System Snapshot Report", { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text(`CPU: ${statsSnapshot.cpu}%`);
    doc.text(`RAM: ${statsSnapshot.ram}%`);
    doc.moveDown();

    doc.fontSize(14).text("Top Processes:");
    doc.fontSize(10);
    const list = (procs && procs.list) || [];
    list
      .sort((a, b) => (b.cpu || 0) - (a.cpu || 0))
      .slice(0, 50)
      .forEach((p) => {
        doc.text(`${p.pid} - ${p.name} - CPU: ${p.cpu || 0}% - Mem: ${p.mem || 0}%`);
      });

    doc.end();
  } catch (err) {
    console.error("generateReport error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  generateReport,
};
