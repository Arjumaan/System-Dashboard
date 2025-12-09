// frontend/src/context/StatsContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const StatsContext = createContext();

export function StatsProvider({ children }) {
  const [latest, setLatest] = useState({ cpu: 0, ram: 0, time: null });
  const [history, setHistory] = useState([]); // keep rolling history
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('connected to stats socket', socketRef.current.id);
    });

    socketRef.current.on('stats', (s) => {
      setLatest(s);
      setHistory(prev => {
        const next = [...prev.slice(-59), { time: new Date(s.time).toLocaleTimeString(), cpu: s.cpu, ram: s.ram }];
        return next;
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('socket disconnected');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <StatsContext.Provider value={{ latest, history }}>
      {children}
    </StatsContext.Provider>
  );
}

export const useStats = () => useContext(StatsContext);
