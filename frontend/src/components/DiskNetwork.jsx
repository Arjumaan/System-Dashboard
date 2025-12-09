// frontend/src/components/DiskNetwork.jsx
import React from "react";
import { useStats } from "../context/StatsContext";

export default function DiskNetwork() {
  const { diskNetwork } = useStats() || {};
  const { diskIO = {}, fsSize = [], network = [] } = diskNetwork || {};

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 dark:text-white">Disk & Network</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold">Disk IO</h3>
          <p className="text-sm">Read: {diskIO.rIO ?? diskIO.rBytes ?? 0} / Write: {diskIO.wIO ?? diskIO.wBytes ?? 0}</p>

          <div className="mt-3">
            {fsSize.map((d) => (
              <div key={d.fs} className="mb-3">
                <div className="flex justify-between text-sm">
                  <div>{d.fs} ({d.mount})</div>
                  <div>{d.use}%</div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded mt-1">
                  <div style={{ width: `${d.use}%` }} className="bg-blue-600 h-2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h3 className="font-semibold">Network</h3>
          <div>
            {network.map((n, idx) => (
              <div key={idx} className="py-2 border-b dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <div>{n.iface}</div>
                  <div>TX/sec: {n.tx_sec?.toFixed?.(2) ?? n.tx_sec} - RX/sec: {n.rx_sec?.toFixed?.(2) ?? n.rx_sec}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
