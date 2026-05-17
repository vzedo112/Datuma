import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001",
});

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export default api;
