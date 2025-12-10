// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { StatsProvider } from "./context/StatsContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StatsProvider>
      <App />
    </StatsProvider>
  </React.StrictMode>
);
