import { createContext, useContext, useState, useCallback } from "react";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [dashboardId, setDashboardId] = useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [datasets, setDatasets] = useState(null);
  const [filename, setFilename] = useState(null);
  const [rowCount, setRowCount] = useState(null);
  const [persistenceWarning, setPersistenceWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setResult = useCallback((result) => {
    setDashboard(result?.dashboard ?? null);
    setDashboardId(result?.id ?? null);
    setShareToken(result?.shareToken ?? null);
    setDatasets(result?.datasets ?? result?.dashboard?.datasets ?? null);
    setFilename(result?.filename ?? null);
    setRowCount(result?.rowCount ?? null);
    setPersistenceWarning(result?.persistenceWarning ?? null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setDashboard(null);
    setDashboardId(null);
    setShareToken(null);
    setDatasets(null);
    setFilename(null);
    setRowCount(null);
    setPersistenceWarning(null);
    setLoading(false);
    setError(null);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        dashboard,
        dashboardId,
        shareToken,
        setShareToken,
        datasets,
        filename,
        rowCount,
        persistenceWarning,
        setPersistenceWarning,
        loading,
        error,
        setLoading,
        setError,
        setResult,
        reset,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
