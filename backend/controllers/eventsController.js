// backend/controllers/eventsController.js
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * GET /events
 * Windows: runs PowerShell Get-WinEvent and returns parsed JSON array
 * Linux: returns last lines of /var/log/syslog or `journalctl -n`
 */
function readEvents(req, res) {
  try {
    if (process.platform === "win32") {
      // Get 200 latest events (both System and Application)
      const cmd =
        'powershell -NoProfile -Command "Get-WinEvent -MaxEvents 200 | Select-Object TimeCreated,ProviderName,Id,LevelDisplayName,Message | ConvertTo-Json -Compress"';
      exec(cmd, { maxBuffer: 30 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          console.error("Get-WinEvent error:", err);
          return res.status(500).json({ error: stderr || err.message });
        }
        try {
          const parsed = stdout ? JSON.parse(stdout) : [];
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          return res.json(arr);
        } catch (e) {
          console.error("parse Get-WinEvent JSON:", e);
          return res.status(500).json({ error: e.message });
        }
      });
    } else {
      // Linux / macOS fallback
      const syslog = "/var/log/syslog";
      if (fs.existsSync(syslog)) {
        exec(`tail -n 200 ${syslog}`, (err, stdout) => {
          if (err) {
            console.error("tail syslog error:", err);
            return res.status(500).json({ error: err.message });
          }
          const lines = stdout
            .split("\n")
            .filter(Boolean)
            .map((l) => ({ time: null, Message: l }));
          return res.json(lines);
        });
      } else {
        // try journalctl
        exec("journalctl -n 200 --no-pager --output=short", (err, stdout) => {
          if (err) {
            console.error("journalctl error:", err);
            return res.status(500).json({ error: err.message });
          }
          const lines = stdout
            .split("\n")
            .filter(Boolean)
            .map((l) => ({ time: null, Message: l }));
          return res.json(lines);
        });
      }
    }
  } catch (err) {
    console.error("readEvents error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  readEvents,
};
