// frontend/src/pages/ProcessTree.jsx
import { useState } from "react";
import { useStats } from "../context/StatsContext";
import axios from "axios";
import { motion } from "framer-motion";
import ConfirmModal from "../components/ConfirmModal";

export default function ProcessTree() {
  const { processTree } = useStats();
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toKill, setToKill] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const killProcess = async (pid) => {
    await axios.post(`${backend}/system/kill`, { pid });
  };

  const filtered = (tree) => {
    if (!query) return tree;
    const q = query.toLowerCase();
    return tree.filter((node) =>
      node.name?.toLowerCase().includes(q) || String(node.pid).includes(query)
    );
  };

  const openContextMenu = (e, pid) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, pid });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div onClick={closeContextMenu}>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Process Tree</h1>

      <input
        placeholder="Search processes..."
        className="p-3 border rounded-lg mb-4 w-full md:w-1/3 dark:bg-gray-900 dark:text-white"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        {filtered(processTree).length === 0 ? (
          <p className="text-gray-500">No process data available.</p>
        ) : (
          filtered(processTree).map((node) => (
            <Node
              key={node.pid}
              node={node}
              onKill={(pid) => {
                setToKill(pid);
                setConfirmOpen(true);
              }}
              openContextMenu={openContextMenu}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-700 border shadow-lg rounded py-2 text-sm z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
            onClick={() => {
              setToKill(contextMenu.pid);
              setConfirmOpen(true);
              closeContextMenu();
            }}
          >
            Kill Process
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Terminate Process"
        message={`Kill process ${toKill}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await killProcess(toKill);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}

function Node({ node, onKill, openContextMenu }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pl-4">
      <div
        className="flex items-center justify-between py-1 cursor-pointer"
        onContextMenu={(e) => openContextMenu(e, node.pid)}
      >
        <div className="flex items-center gap-2">
          {node.children?.length > 0 && (
            <button onClick={() => setOpen(!open)}>{open ? "▾" : "▸"}</button>
          )}

          <div>
            <div className="font-semibold dark:text-white">
              {node.name} <span className="text-xs text-gray-500">({node.pid})</span>
            </div>
            <div className="text-xs text-gray-500">{node.user}</div>
          </div>
        </div>

        <button
          onClick={() => onKill(node.pid)}
          className="px-2 py-1 bg-red-600 text-white rounded text-sm"
        >
          Kill
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ overflow: "hidden" }}
      >
        <div className="ml-5 border-l pl-3">
          {node.children?.map((c) => (
            <Node
              key={c.pid}
              node={c}
              onKill={onKill}
              openContextMenu={openContextMenu}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
