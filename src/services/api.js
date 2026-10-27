import axios from "axios";
import { getToken } from "./authStorage";

// Local Vite runs should use the local backend by default, instead of silently
// reading or writing records in the deployed production database.
// Set VITE_API_BASE_URL explicitly to override this in either environment.
// VITE_API_URL remains supported for existing production deployments.
const apiBaseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000"
    : import.meta.env.VITE_API_URL || "https://homefinance-server.vercel.app");

const api = axios.create({ baseURL: apiBaseURL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
