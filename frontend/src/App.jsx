// frontend/src/App.jsx
import { useState } from "react";
import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";

import Dashboard from "./pages/Dashboard";
import TaskManager from "./pages/TaskManager";
import Registry from "./pages/Registry";
import EventViewer from "./pages/EventViewer";
import Report from "./pages/Report";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const [selected, setSelected] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const renderPage = () => {
    switch (selected) {
      case "Dashboard": return <Dashboard />;
      case "Task Manager": return <TaskManager />;
      case "Registry": return <Registry />;
      case "Event Viewer": return <EventViewer />;
      case "Report": return <Report />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar selected={selected} setSelected={setSelected} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ marginLeft: collapsed ? 80 : 256 }} className="transition-all">
        <Topbar />
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
