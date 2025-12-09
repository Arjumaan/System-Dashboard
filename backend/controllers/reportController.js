const si = require('systeminformation');
const WinReg = require('winreg');
const { exec } = require('child_process');
const pdfGenerator = require('../utils/pdfGenerator');

exports.generateReport = async (req, res) => {
  const cpu = await si.currentLoad();
  const mem = await si.mem();
  const processes = (await si.processes()).list.slice(0, 10);

  const regKey = new WinReg({
    hive: WinReg.HKLM,
    key: '\\Software\\Microsoft\\Windows NT\\CurrentVersion'
  });

  regKey.values((err, registry) => {
    exec('powershell "Get-EventLog -LogName System -Newest 10 | ConvertTo-Json"', 
      (e, stdout) => {
        const events = JSON.parse(stdout || "[]");

        const pdf = pdfGenerator({
          cpu: cpu.currentLoad.toFixed(2),
          ram: ((mem.active / mem.total) * 100).toFixed(2),
          processes,
          registry,
          events
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=system_report.pdf");
        pdf.pipe(res);
      });
  });
};
