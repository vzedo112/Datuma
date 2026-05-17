import { createContext, useContext, useState, useCallback } from "react";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [filename, setFilename] = useState(null);
  const [rowCount, setRowCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setResult = useCallback((result) => {
    setDashboard(result?.dashboard ?? null);
    setFilename(result?.filename ?? null);
    setRowCount(result?.rowCount ?? null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setDashboard(null);
    setFilename(null);
    setRowCount(null);
    setLoading(false);
    setError(null);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        dashboard,
        filename,
        rowCount,
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
