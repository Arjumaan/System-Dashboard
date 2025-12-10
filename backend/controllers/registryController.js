// backend/controllers/registryController.js
const { exec } = require("child_process");

/**
 * GET /registry
 * Reads real Windows registry values from:
 * HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion
 *
 * Returns an array:
 * [
 *   { name: "ProductName", value: "Windows 10 Pro" },
 *   { name: "ReleaseId", value: "2009" },
 *   { name: "CurrentBuild", value: "26000" },
 *   { name: "CurrentBuildNumber", value: "26000" }
 * ]
 */
function readRegistry(req, res) {
  try {
    if (process.platform !== "win32") {
      return res.json([]);
    }

    // Your original structure — kept same, but improved and safer
    const psCmd = `
      $k = Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion' -ErrorAction SilentlyContinue;

      $out = [ordered]@{};
      $out.ProductName = $k.ProductName;

      # ReleaseId is missing on Windows 11 → fallback to DisplayVersion
      if ($k.ReleaseId) {
        $out.ReleaseId = $k.ReleaseId;
      } elseif ($k.DisplayVersion) {
        $out.ReleaseId = $k.DisplayVersion;
      } else {
        $out.ReleaseId = "Unknown";
      }

      $out.CurrentBuild = $k.CurrentBuild;
      $out.CurrentBuildNumber = $k.CurrentBuildNumber;

      # JSON output
      ($out | ConvertTo-Json -Compress)
    `;

    // Remove newlines for safe PowerShell execution
    const safeCmd = psCmd.replace(/\n/g, " ").replace(/\s\s+/g, " ");

    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -Command "${safeCmd}"`,
      { maxBuffer: 5 * 1024 * 1024 },
      (err, stdout) => {
        if (err) {
          console.error("readRegistry error:", err);
          return res.status(500).json({ error: err.message });
        }

        try {
          const parsed = stdout ? JSON.parse(stdout) : {};

          // Convert to [{name, value}]
          const result = Object.keys(parsed).map((k) => ({
            name: k,
            value: parsed[k],
          }));

          return res.json(result);
        } catch (e) {
          console.error("parse registry JSON:", e);
          return res.status(500).json({ error: e.message });
        }
      }
    );
  } catch (err) {
    console.error("readRegistry error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  readRegistry,
};
