import axios from "axios";
import { getToken } from "./authStorage";

const api = axios.create({
  baseURL: "https://homefinance-server.vercel.app",
  // baseURL: "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;