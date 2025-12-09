const si = require('systeminformation');

exports.getSystemStats = async (req, res) => {
  const cpu = await si.currentLoad();
  const mem = await si.mem();

  res.json({
    cpu: cpu.currentLoad.toFixed(2),
    ram: ((mem.active / mem.total) * 100).toFixed(2)
  });
};

exports.getProcesses = async (req, res) => {
  const proc = await si.processes();
  res.json(proc.list.slice(0, 20));
};
