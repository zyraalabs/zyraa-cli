import axios from "axios";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_FILE = join(homedir(), ".zyra", "config");

const axiosInstance = axios.create({
  baseURL: process.env.CLI_BACKEND_URL || "http://localhost:4000",
  timeout: 300000,
});

axiosInstance.interceptors.request.use((config) => {
  if (existsSync(CONFIG_FILE)) {
    try {
      const token = readFileSync(CONFIG_FILE, "utf-8").trim();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

export default axiosInstance;
