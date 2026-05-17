import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { DashboardProvider } from "../../context/DashboardContext";

export default function AppLayout() {
  return (
    <DashboardProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="w-full flex flex-1 flex-col min-w-0">
          <header className="h-16 border-b border-border">
            <TopNav />
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
