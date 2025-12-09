const PDFDocument = require('pdfkit');

module.exports = (data) => {
  const doc = new PDFDocument();
  doc.fontSize(20).text("System Report", { underline: true });

  doc.fontSize(12).text(`CPU Usage: ${data.cpu}%`);
  doc.text(`RAM Usage: ${data.ram}%`);
  doc.text("\nProcesses:");
  data.processes.forEach(p => doc.text(`- ${p.name} (${p.cpu.toFixed(2)}%)`));

  doc.text("\nRegistry Data:");
  data.registry.forEach(r => doc.text(`${r.name}: ${r.value}`));

  doc.text("\nEvent Logs:");
  data.events.forEach(e => doc.text(`${e.EntryType} - ${e.Message}`));

  doc.end();
  return doc;
};
