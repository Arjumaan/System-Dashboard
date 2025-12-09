import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function TaskManager() {
  const [proc, setProc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/system/processes")
      .then((res) => {
        setProc(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = proc.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Task Manager</h1>

      <input
        placeholder="Search process..."
        className="p-3 border rounded-lg mb-4 w-full md:w-1/3 dark:bg-gray-900 dark:text-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <>
          <LoadingSkeleton height={40} width="60%" />
          <div className="mt-4">
            <LoadingSkeleton height={300} width="100%" />
          </div>
        </>
      ) : (
        <table className="w-full bg-white dark:bg-gray-800 shadow rounded-xl">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="p-3 text-left">Process</th>
              <th className="p-3 text-left">CPU</th>
              <th className="p-3 text-left">Memory</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr key={p.pid} className="border-b dark:border-gray-700">
                <td className="p-3">{p.name}</td>

                <td className="p-3 font-semibold">
                  <span
                    className={
                      p.cpu > 50
                        ? "text-red-600"
                        : p.cpu > 20
                        ? "text-yellow-500"
                        : "text-green-600"
                    }
                  >
                    {p.cpu.toFixed(2)}%
                  </span>
                </td>

                <td className="p-3 font-semibold">{p.mem.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
