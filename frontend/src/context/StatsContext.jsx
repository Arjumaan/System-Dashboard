// frontend/src/context/StatsContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const StatsContext = createContext();

export function StatsProvider({ children }) {
  const socketRef = useRef(null);

  const [latest, setLatest] = useState({ cpu: 0, ram: 0, time: null });
  const [history, setHistory] = useState([]); // rolling {time,cpu,ram}
  const [processTree, setProcessTree] = useState([]);
  const [events, setEvents] = useState([]); // raw event objects
  const [diskNetwork, setDiskNetwork] = useState({ diskIO: {}, fsSize: [], network: [] });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // change URL if your backend is remote (use env var)
    const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    socketRef.current = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    const s = socketRef.current;

    s.on("connect", () => console.log("socket connected", s.id));

    s.on("stats", (st) => {
      if (!st) return;
      setLatest(st);
      setHistory(prev => {
        const next = [...prev.slice(-119), { time: new Date(st.time).toLocaleTimeString(), cpu: st.cpu, ram: st.ram }];
        return next;
      });
    });

    s.on("processTree", (tree) => {
      setProcessTree(Array.isArray(tree) ? tree : (tree ? [tree] : []));
    });

    s.on("events", (ev) => {
      // normalize to array
      const arr = Array.isArray(ev) ? ev : [ev];
      setEvents(prev => {
        const combined = [...arr.reverse(), ...prev].slice(0, 1000); // newest first
        return combined;
      });
    });

    s.on("diskNetwork", (dn) => {
      setDiskNetwork(dn || {});
    });

    s.on("liveLogs", (l) => {
      setEvents(prev => [l, ...prev].slice(0, 1000));
    });

    s.on("alert", (a) => {
      if (!a) return;
      setAlerts(prev => [a, ...prev].slice(0, 50));
      // optional: prune alerts older than N
    });

    s.on("disconnect", () => console.log("socket disconnected"));

    return () => {
      try { s.disconnect(); } catch(e){}
    };
  }, []);

  return (
    <StatsContext.Provider value={{ latest, history, processTree, events, diskNetwork, alerts }}>
      {children}
    </StatsContext.Provider>
  );
}

export const useStats = () => useContext(StatsContext);
