import axios from "axios";

const BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default axios.create({
  baseURL: BASE,
  timeout: 15000,
});
