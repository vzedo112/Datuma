import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL,
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

export async function analyzeUpload(files, datasetNames, parentDashboardId) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  if (datasetNames && datasetNames.length > 0) {
    form.append("datasetNames", JSON.stringify(datasetNames));
  }
  if (parentDashboardId) {
    form.append("parentDashboardId", String(parentDashboardId));
  }
  const response = await api.post("/api/upload/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function generateDashboardFromUpload(uploadId, datasetNames) {
  const response = await api.post("/api/upload/generate", {
    uploadId,
    datasetNames,
  });
  return response.data;
}

export async function renameDashboard(id, name) {
  const response = await api.patch(`/api/dashboards/${id}`, { name });
  return response.data;
}

export async function deleteDashboard(id) {
  const response = await api.delete(`/api/dashboards/${id}`);
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

export async function startCheckout({ plan, interval }) {
  const response = await api.post("/api/billing/checkout", { plan, interval });
  return response.data; // { url }
}

export async function openBillingPortal() {
  const response = await api.post("/api/billing/portal");
  return response.data; // { url }
}

export async function setSpendCap(amountCents) {
  const response = await api.patch("/api/billing/spend-cap", { amountCents });
  return response.data; // { spendCapCents }
}

export async function resyncBilling() {
  const response = await api.post("/api/billing/resync");
  return response.data; // { plan, status, priceMatched, priceId }
}

export async function createShareLink(id) {
  const response = await api.post(`/api/dashboards/${id}/share`);
  return response.data; // { token }
}

export async function revokeShareLink(id) {
  const response = await api.delete(`/api/dashboards/${id}/share`);
  return response.data; // { ok: true }
}

export async function getSharedDashboard(token) {
  // Public endpoint — bypass the auth interceptor by using a bare axios call.
  const response = await axios.get(`${baseURL}/api/share/${token}`);
  return response.data;
}

// --- Folders ---

export async function listFolders() {
  const response = await api.get("/api/folders");
  return response.data; // { items, unfiled }
}

export async function createFolder(name) {
  const response = await api.post("/api/folders", { name });
  return response.data; // { folder }
}

export async function renameFolder(id, name) {
  const response = await api.patch(`/api/folders/${id}`, { name });
  return response.data;
}

export async function deleteFolder(id) {
  const response = await api.delete(`/api/folders/${id}`);
  return response.data;
}

export async function moveDashboardToFolder(dashboardId, folderId) {
  const response = await api.patch("/api/folders/move", {
    dashboardId,
    folderId,
  });
  return response.data;
}

export async function listDashboardsInFolder(folderId) {
  // folderId === null  → top-level only
  // folderId === undefined → all
  const params = {};
  if (folderId === null) params.folder = "none";
  else if (folderId !== undefined) params.folder = folderId;
  const response = await api.get("/api/dashboards", { params });
  return response.data.items ?? [];
}

// --- Chat (Pro/Team/Enterprise) ---

export async function listChatMessages(dashboardId) {
  const response = await api.get(`/api/dashboards/${dashboardId}/chat`);
  return response.data; // { messages, allowed, planKey }
}

export async function sendChatMessage(dashboardId, message) {
  const response = await api.post(`/api/dashboards/${dashboardId}/chat`, {
    message,
  });
  return response.data; // { userMessage, assistantMessage }
}

export async function clearChatThread(dashboardId) {
  const response = await api.delete(`/api/dashboards/${dashboardId}/chat`);
  return response.data;
}

// --- Connector demand tracking (Coming Soon teaser) ---

export async function recordConnectorInterest(source) {
  const response = await api.post("/api/connectors/interest", { source });
  return response.data;
}

// --- Team invites ---

export async function listTeamMembers() {
  const response = await api.get("/api/team/members");
  return response.data; // { allowed, planKey, seatLimit, invites }
}

export async function inviteTeammate(email) {
  const response = await api.post("/api/team/invite", { email });
  return response.data; // { invite }
}

export async function revokeTeamInvite(id) {
  const response = await api.delete(`/api/team/invite/${id}`);
  return response.data;
}

export default api;
