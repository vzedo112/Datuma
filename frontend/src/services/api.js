import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001",
});

let getTokenFn = null;

export function setTokenGetter(fn) {
  getTokenFn = fn;
}

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token unavailable — let the request go through and 401 if required.
    }
  }
  return config;
});

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function listDashboards() {
  const response = await api.get("/api/dashboards");
  return response.data.items ?? [];
}

export async function getDashboardById(id) {
  const response = await api.get(`/api/dashboards/${id}`);
  return response.data;
}

export async function getUsage() {
  const response = await api.get("/api/dashboards/usage");
  return response.data;
}

export default api;
