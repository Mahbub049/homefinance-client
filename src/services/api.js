import axios from "axios";
import { getToken } from "./authStorage";

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  baseURL: "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;