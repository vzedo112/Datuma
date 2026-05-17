import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import AppLayout from "./components/Layout/AppLayout";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";

function Placeholder({ title }) {
  return (
    <div className="max-w-2xl">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-3">
        Coming soon
      </span>
      <h1 className="font-display text-4xl tracking-tight mb-3">{title}</h1>
      <p className="text-muted-foreground">
        This screen isn't built yet — it'll arrive in the next milestone.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Upload />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="history" element={<Placeholder title="Upload history" />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
