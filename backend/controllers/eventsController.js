const { exec } = require('child_process');

exports.readEvents = (req, res) => {
  exec('powershell "Get-EventLog -LogName System -Newest 20 | ConvertTo-Json"', 
    (err, stdout) => {
      if (err) return res.json({ error: err.message });

      try {
        res.json(JSON.parse(stdout));
      } catch (e) {
        res.json([]);
      }
  });
};
