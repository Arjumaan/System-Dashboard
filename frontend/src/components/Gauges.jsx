// frontend/src/components/Gauges.jsx
import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useStats } from '../context/StatsContext';

export default function Gauges() {
  const { latest } = useStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow flex items-center">
        <div style={{ width: 120, height: 120 }}>
          <CircularProgressbar
            value={latest.cpu}
            text={`${latest.cpu}%`}
            maxValue={100}
            styles={buildStyles({
              textColor: '#111827',
              pathColor: '#2563eb',
              trailColor: '#e5e7eb',
              textSize: '16px'
            })}
          />
        </div>
        <div className="ml-6">
          <h4 className="text-lg font-semibold dark:text-white">CPU</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Live CPU Usage</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow flex items-center">
        <div style={{ width: 120, height: 120 }}>
          <CircularProgressbar
            value={latest.ram}
            text={`${latest.ram}%`}
            maxValue={100}
            styles={buildStyles({
              textColor: '#111827',
              pathColor: '#16a34a',
              trailColor: '#e5e7eb',
              textSize: '16px'
            })}
          />
        </div>
        <div className="ml-6">
          <h4 className="text-lg font-semibold dark:text-white">RAM</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">Live RAM Usage</p>
        </div>
      </div>
    </div>
  );
}
