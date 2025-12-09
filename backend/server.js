const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const si = require("systeminformation");

// Routes
const systemRoutes = require("./routes/system");
const registryRoutes = require("./routes/registry");
const eventRoutes = require("./routes/events");
const reportRoutes = require("./routes/report");

const app = express();
app.use(cors());
app.use(express.json());

// Register REST routes
app.use("/system", systemRoutes);
app.use("/registry", registryRoutes);
app.use("/events", eventRoutes);
app.use("/report", reportRoutes);

// Create full HTTP + WebSocket server
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// When frontend connects
io.on("connection", (socket) => {
  console.log("WS client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("WS client disconnected:", socket.id);
  });
});

// Emit CPU + RAM stats every 2 seconds
async function emitStats() {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();

    const stats = {
      cpu: Number(cpu.currentLoad.toFixed(2)),
      ram: Number(((mem.active / mem.total) * 100).toFixed(2)),
      time: new Date().toISOString(),
    };

    io.emit("stats", stats);
  } catch (err) {
    console.error("emitStats error:", err);
  }
}

setInterval(emitStats, 2000);
emitStats();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
