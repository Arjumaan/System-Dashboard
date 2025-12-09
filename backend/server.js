// backend/server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const si = require("systeminformation");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

// optional existing route modules (if missing, create simple routers)
let systemRoutes = null, registryRoutes = null, eventRoutes = null, reportRoutes = null;
try { systemRoutes = require("./routes/system"); } catch(e){ systemRoutes = null; }
try { registryRoutes = require("./routes/registry"); } catch(e){ registryRoutes = null; }
try { eventRoutes = require("./routes/events"); } catch(e){ eventRoutes = null; }
try { reportRoutes = require("./routes/report"); } catch(e){ reportRoutes = null; }

const app = express();
app.use(cors());
app.use(express.json());

// Register existing REST routers if present
if (systemRoutes) app.use("/system", systemRoutes);
if (registryRoutes) app.use("/registry", registryRoutes);
if (eventRoutes) app.use("/events", eventRoutes);
if (reportRoutes) app.use("/report", reportRoutes);

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// --- SOCKET.IO connection ---
io.on("connection", (socket) => {
  console.log("WS client connected:", socket.id);

  socket.on("requestProcessTree", async () => {
    const tree = await buildProcessTree();
    socket.emit("processTree", tree);
  });

  socket.on("disconnect", () => {
    console.log("WS client disconnected:", socket.id);
  });
});

// --- UTIL: build hierarchical process tree ---
async function buildProcessTree() {
  try {
    const p = await si.processes();
    const list = p.list || [];
    const map = {};
    list.forEach(proc => {
      map[proc.pid] = { ...proc, children: [] };
    });
    const roots = [];
    list.forEach(proc => {
      const parent = map[proc.ppid];
      if (parent) parent.children.push(map[proc.pid]);
      else roots.push(map[proc.pid]);
    });
    return roots;
  } catch (err) {
    console.error("buildProcessTree error", err);
    return [];
  }
}

// --- EMITTERS ---
// Emit CPU + RAM stats
async function emitStats() {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const stats = {
      cpu: Number(cpu.currentLoad.toFixed(2)),
      ram: Number(((mem.active / mem.total) * 100).toFixed(2)),
      time: new Date().toISOString()
    };
    io.emit("stats", stats);
    checkThresholdsAndEmitAlerts(stats);
  } catch (err) {
    console.error("emitStats error:", err);
  }
}

// Emit process tree
async function emitProcessTree() {
  try {
    const tree = await buildProcessTree();
    io.emit("processTree", tree);
  } catch (err) {
    console.error("emitProcessTree error:", err);
  }
}

// Emit disk I/O / drives / network stats
async function emitDiskNetwork() {
  try {
    const diskIO = await si.disksIO();
    const fsSize = await si.fsSize();
    const network = await si.networkStats();
    io.emit("diskNetwork", { diskIO, fsSize, network });
  } catch (err) {
    console.error("emitDiskNetwork error:", err);
  }
}

// Emit live event logs (Windows: Get-WinEvent; Linux: tail syslog)
async function emitEventLogs() {
  try {
    if (process.platform === "win32") {
      // PowerShell Get-WinEvent to JSON
      const cmd = 'powershell -NoProfile -Command "Get-WinEvent -MaxEvents 50 | Select-Object TimeCreated,ProviderName,Id,LevelDisplayName,Message | ConvertTo-Json -Compress"';
      exec(cmd, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          console.error("Get-WinEvent error:", err.message);
          return;
        }
        try {
          const events = stdout ? JSON.parse(stdout) : [];
          // ensure array
          const arr = Array.isArray(events) ? events : [events];
          io.emit("events", arr);
        } catch (e) {
          console.error("parse events error:", e.message);
        }
      });
    } else {
      // Linux fallback: last 100 lines of syslog or journalctl
      const logfile = "/var/log/syslog";
      if (fs.existsSync(logfile)) {
        exec(`tail -n 100 ${logfile}`, (err, stdout) => {
          if (err) return;
          const lines = stdout.split("\n").filter(Boolean).map((l, i) => ({ time: null, message: l }));
          io.emit("events", lines);
        });
      } else {
        // try journalctl if available
        exec(`journalctl -n 100 --no-pager`, (err, stdout) => {
          if (err) return;
          const lines = stdout.split("\n").filter(Boolean).map((l, i) => ({ time: null, message: l }));
          io.emit("events", lines);
        });
      }
    }
  } catch (err) {
    console.error("emitEventLogs error:", err);
  }
}

// Emit "liveLogs" (alias) — here we reuse events
async function emitLiveLogs() {
  await emitEventLogs();
}

// --- ALERTS (threshold driven) ---
const ALERT_CONFIG = { cpu: 80, ram: 70, consecutiveCpuCountThreshold: 3 };
let cpuHighCount = 0;

function checkThresholdsAndEmitAlerts(stats) {
  if (!stats) return;
  if (stats.cpu >= ALERT_CONFIG.cpu) cpuHighCount++;
  else cpuHighCount = 0;

  if (cpuHighCount >= ALERT_CONFIG.consecutiveCpuCountThreshold) {
    io.emit("alert", { type: "cpu", message: `CPU >= ${ALERT_CONFIG.cpu}% for ${cpuHighCount * 2}s`, stats });
  }
  if (stats.ram >= ALERT_CONFIG.ram) {
    io.emit("alert", { type: "ram", message: `RAM >= ${ALERT_CONFIG.ram}%`, stats });
  }
}

// --- ENDPOINT: kill process (POST /system/kill) ---
app.post("/system/kill", (req, res) => {
  const { pid } = req.body;
  if (!pid) return res.status(400).json({ error: "pid required" });

  try {
    if (process.platform === "win32") {
      exec(`taskkill /PID ${pid} /F`, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ ok: false, error: stderr || err.message });
        return res.json({ ok: true, stdout });
      });
    } else {
      try {
        process.kill(pid, "SIGKILL");
        return res.json({ ok: true });
      } catch (err) {
        // fallback to system kill
        exec(`kill -9 ${pid}`, (e, out, st) => {
          if (e) return res.status(500).json({ ok: false, error: st || e.message });
          return res.json({ ok: true, stdout: out });
        });
      }
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --- ENDPOINT: generate PDF report (POST /report) ---
app.post("/report", (req, res) => {
  const { title = "System Report", statsSnapshot = {}, chartImageBase64, processes = [], registry = [], events = [] } = req.body;

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=system_report_${Date.now()}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text(title, { underline: true });
  doc.moveDown();

  doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(14).text(`CPU: ${statsSnapshot.cpu ?? "N/A"}%`);
  doc.text(`RAM: ${statsSnapshot.ram ?? "N/A"}%`);
  doc.moveDown();

  if (chartImageBase64) {
    try {
      const data = chartImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imgBuf = Buffer.from(data, "base64");
      doc.image(imgBuf, { fit: [480, 240] });
      doc.moveDown();
    } catch (err) {
      console.error("PDF image error", err);
    }
  }

  doc.fontSize(14).text("Top Processes:");
  doc.fontSize(10);
  processes.slice(0, 50).forEach(p => doc.text(`${p.pid} - ${p.name} ${p.cpu ? `(${p.cpu}%)` : ""}`));

  doc.addPage();
  doc.fontSize(14).text("Registry:");
  doc.fontSize(10);
  (registry || []).forEach(r => doc.text(`${r.name}: ${r.value}`));

  doc.addPage();
  doc.fontSize(14).text("Event Logs:");
  doc.fontSize(10);
  (events || []).slice(0, 200).forEach(e => doc.text(e.Message ?? e.message ?? JSON.stringify(e)));

  doc.end();
});

// --- Schedule periodic emits ---
const EMIT_INTERVAL_MS = 2000;
setInterval(emitStats, EMIT_INTERVAL_MS);
setInterval(emitProcessTree, 10000);
setInterval(emitEventLogs, 5000);
setInterval(emitDiskNetwork, 3000);
// and also a compact combined poll every EMIT_INTERVAL_MS which updates quickly:
setInterval(async () => {
  await emitStats();
  // keep process tree and disk/network less frequent above
}, EMIT_INTERVAL_MS);

// quick initial emit
emitStats();
emitProcessTree();
emitEventLogs();
emitDiskNetwork();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
