// backend/server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const si = require("systeminformation");
const { exec } = require("child_process");
const fs = require("fs");
const PDFDocument = require("pdfkit");

// ----------------------------------------------------
// EXPRESS APP
// ----------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// SAFE ROUTES IMPORT
// ----------------------------------------------------
function safeRoute(path) {
  try { return require(path); }
  catch { return null; }
}

const systemRoutes   = safeRoute("./routes/system");
const registryRoutes = safeRoute("./routes/registry");
const eventRoutes    = safeRoute("./routes/events");
const reportRoutes   = safeRoute("./routes/report");

if (systemRoutes)   app.use("/system", systemRoutes);
if (registryRoutes) app.use("/registry", registryRoutes);
if (eventRoutes)    app.use("/events", eventRoutes);
if (reportRoutes)   app.use("/report", reportRoutes);

// ----------------------------------------------------
// HTTP + WebSocket
// ----------------------------------------------------
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// ----------------------------------------------------
// PROCESS TREE BUILDER
// ----------------------------------------------------
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
      if (map[proc.ppid]) {
        map[proc.ppid].children.push(map[proc.pid]);
      } else {
        roots.push(map[proc.pid]);
      }
    });

    return roots;
  } catch (err) {
    console.error("Process tree error:", err);
    return [];
  }
}

// ----------------------------------------------------
// EMIT PROCESS TREE  (THIS WAS MISSING earlier)
// ----------------------------------------------------
async function emitProcessTree() {
  try {
    const tree = await buildProcessTree();
    io.emit("processTree", tree);
  } catch (err) {
    console.error("emitProcessTree error:", err);
  }
}

// ----------------------------------------------------
// EMIT CPU + RAM STATS
// ----------------------------------------------------
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
    handleAlerts(stats);
  } catch (err) {
    console.error("Stats error:", err);
  }
}

// ----------------------------------------------------
// EMIT DISK & NETWORK METRICS
// ----------------------------------------------------
async function emitDiskNetwork() {
  try {
    const diskIO = await si.disksIO();
    const fsSize = await si.fsSize();
    const network = await si.networkStats();

    io.emit("diskNetwork", {
      diskIO: {
        rIO: diskIO.rIO ?? 0,
        wIO: diskIO.wIO ?? 0,
        rBytes: diskIO.rBytes ?? 0,
        wBytes: diskIO.wBytes ?? 0
      },
      fsSize,
      network: network.map(n => ({
        iface: n.iface,
        tx_sec: n.tx_sec ?? 0,
        rx_sec: n.rx_sec ?? 0
      }))
    });
  } catch (err) {
    console.error("Disk/Network error:", err);
  }
}

// ----------------------------------------------------
// REAL EVENT LOGS (Windows: Get-WinEvent, Linux: syslog)
// ----------------------------------------------------
async function emitEventLogs() {
  try {
    if (process.platform === "win32") {
      const cmd =
        'powershell -NoProfile -Command "Get-WinEvent -MaxEvents 50 | ' +
        'Select-Object TimeCreated,ProviderName,Id,LevelDisplayName,Message | ' +
        'ConvertTo-Json -Compress"';

      exec(cmd, { maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
        if (err) return console.error("WinEvent error:", err.message);

        try {
          const parsed = stdout ? JSON.parse(stdout) : [];
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          io.emit("events", arr);
        } catch (e) {
          console.error("Event JSON parse error:", e.message);
        }
      });

    } else {
      const logfile = "/var/log/syslog";

      if (fs.existsSync(logfile)) {
        exec(`tail -n 100 ${logfile}`, (err, stdout) => {
          if (err) return;

          const lines = stdout
            .split("\n")
            .filter(Boolean)
            .map((line, i) => ({ time: null, Message: line }));

          io.emit("events", lines);
        });
      }
    }
  } catch (err) {
    console.error("emitEventLogs error:", err);
  }
}

// ----------------------------------------------------
// SOCKET CONNECTION
// ----------------------------------------------------
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

// ----------------------------------------------------
// ALERTING SYSTEM
// ----------------------------------------------------
const LIMITS = { cpu: 80, ram: 70, repeatCount: 3 };
let cpuHighCount = 0;

function handleAlerts(stats) {
  if (stats.cpu >= LIMITS.cpu) cpuHighCount++;
  else cpuHighCount = 0;

  if (cpuHighCount >= LIMITS.repeatCount) {
    io.emit("alert", {
      type: "cpu",
      message: `CPU above ${LIMITS.cpu}% for ${cpuHighCount * 2}s`
    });
  }

  if (stats.ram >= LIMITS.ram) {
    io.emit("alert", {
      type: "ram",
      message: `RAM above ${LIMITS.ram}%`
    });
  }
}

// ----------------------------------------------------
// PROCESS KILL ENDPOINT
// ----------------------------------------------------
app.post("/system/kill", (req, res) => {
  const { pid } = req.body;
  if (!pid) return res.status(400).json({ error: "PID required" });

  if (process.platform === "win32") {
    exec(`taskkill /PID ${pid} /F`, (err, out, stderr) => {
      if (err) return res.status(500).json({ error: stderr });
      return res.json({ ok: true });
    });
  } else {
    exec(`kill -9 ${pid}`, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ ok: true });
    });
  }
});

// ----------------------------------------------------
// PDF REPORT GENERATION
// ----------------------------------------------------
app.post("/report", (req, res) => {
  const {
    title = "System Report",
    statsSnapshot = {},
    chartImageBase64,
    processes = [],
    registry = [],
    events = []
  } = req.body;

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=system_report_${Date.now()}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(22).text(title, { underline: true });
  doc.moveDown();

  doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(14).text(`CPU: ${statsSnapshot.cpu}%`);
  doc.text(`RAM: ${statsSnapshot.ram}%`);
  doc.moveDown();

  if (chartImageBase64) {
    try {
      const img = chartImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(img, "base64");
      doc.image(buf, { fit: [480, 240] });
      doc.moveDown();
    } catch (e) {
      console.error("Chart image error:", e);
    }
  }

  doc.addPage().fontSize(14).text("Processes:");
  doc.fontSize(10);
  processes.slice(0, 100).forEach((p) =>
    doc.text(`${p.pid} - ${p.name} - CPU ${p.cpu ?? 0}%`)
  );

  doc.addPage().fontSize(14).text("Event Logs:");
  doc.fontSize(10);
  events.slice(0, 150).forEach((e) =>
    doc.text(e.Message || e.message || JSON.stringify(e))
  );

  doc.end();
});

// ----------------------------------------------------
// CRON: INTERVAL EMITTERS
// ----------------------------------------------------
setInterval(emitStats, 2000);
setInterval(emitDiskNetwork, 3000);
setInterval(emitProcessTree, 7000);
setInterval(emitEventLogs, 5000);

// initial emits
emitStats();
emitDiskNetwork();
emitProcessTree();
emitEventLogs();

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
