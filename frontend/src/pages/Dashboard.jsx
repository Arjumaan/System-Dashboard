import React from "react";
import UptimeBanner from "../components/UptimeBanner";
import { useStats } from "../context/StatsContext";
import Gauges from "../components/Gauges";
import SystemCharts from "../components/SystemCharts";

export default function Dashboard() {
  const { latest } = useStats();

  return (
    <div>
      <UptimeBanner />
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold dark:text-gray-200">
            CPU Usage
          </h3>
          <p className="text-4xl font-bold mt-3 dark:text-white">
            {latest.cpu}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold dark:text-gray-200">
            RAM Usage
          </h3>
          <p className="text-4xl font-bold mt-3 dark:text-white">
            {latest.ram}%
          </p>
        </div>
      </div>

      {/* Gauges */}
      <Gauges />

      {/* Charts */}
      <SystemCharts />
    </div>
  );
}
