const WinReg = require('winreg');

exports.readRegistry = (req, res) => {
  const regKey = new WinReg({
    hive: WinReg.HKLM,
    key: '\\Software\\Microsoft\\Windows NT\\CurrentVersion'
  });

  regKey.values((err, items) => {
    if (err) return res.json({ error: err.message });
    res.json(items);
  });
};
