// frontend/src/pages/TaskManager.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ConfirmModal from "../components/ConfirmModal";

export default function TaskManager() {
  const [proc, setProc] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toKill, setToKill] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);

  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const loadProcesses = () => {
    axios
      .get(`${backend}/system/processes`)
      .then((res) => {
        setProc(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(loadProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = proc.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(p.pid).includes(search)
  );

  const toggleSelection = (pid) => {
    const next = new Set(selected);
    next.has(pid) ? next.delete(pid) : next.add(pid);
    setSelected(next);
  };

  const killProcess = async (pid) => {
    try {
      const res = await axios.post(`${backend}/system/kill`, { pid });
      alert(`Kill requested for PID ${pid}`);
    } catch (err) {
      alert("Kill failed: " + (err.response?.data?.error || err.message));
    } finally {
      loadProcesses();
    }
  };

  const killBulk = async () => {
    try {
      for (const pid of toKill) {
        await killProcess(pid);
      }
      alert(`Kill requested for ${toKill.length} processes`);
    } catch (err) {
      alert("Bulk kill error: " + err.message);
    } finally {
      loadProcesses();
      setSelected(new Set());
    }
  };

  const openContextMenu = (e, pid) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, pid });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div onClick={closeContextMenu}>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Task Manager</h1>

      <input
        placeholder="Search process…"
        className="p-3 border rounded-lg mb-4 w-full md:w-1/3 dark:bg-gray-900 dark:text-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {selected.size > 0 && (
        <button
          onClick={() => {
            setToKill(Array.from(selected));
            setConfirmOpen(true);
          }}
          className="mb-4 px-4 py-2 bg-red-600 text-white rounded"
        >
          Kill Selected ({selected.size})
        </button>
      )}

      {loading ? (
        <>
          <LoadingSkeleton height={40} width="60%" />
          <LoadingSkeleton height={300} width="100%" className="mt-4" />
        </>
      ) : (
        <table className="w-full bg-white dark:bg-gray-800 shadow rounded-xl">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="p-3">Select</th>
              <th className="p-3 text-left">Process</th>
              <th className="p-3 text-left">PID</th>
              <th className="p-3 text-left">CPU</th>
              <th className="p-3 text-left">Memory</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.pid}
                className="border-b dark:border-gray-700 cursor-pointer"
                onContextMenu={(e) => openContextMenu(e, p.pid)}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.pid)}
                    onChange={() => toggleSelection(p.pid)}
                  />
                </td>

                <td className="p-3">{p.name}</td>

                <td className="p-3">{p.pid}</td>

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

                <td className="p-3">
                  <button
                    onClick={() => {
                      setToKill([p.pid]);
                      setConfirmOpen(true);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Kill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-700 border shadow-lg rounded py-2 text-sm z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
            onClick={() => {
              setToKill([contextMenu.pid]);
              setConfirmOpen(true);
              closeContextMenu();
            }}
          >
            Kill Process
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Terminate Process"
        message={
          Array.isArray(toKill)
            ? `Kill ${toKill.length} process(es)?`
            : `Kill process ${toKill}?`
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          if (Array.isArray(toKill)) await killBulk();
          else await killProcess(toKill);
        }}
      />
    </div>
  );
}
