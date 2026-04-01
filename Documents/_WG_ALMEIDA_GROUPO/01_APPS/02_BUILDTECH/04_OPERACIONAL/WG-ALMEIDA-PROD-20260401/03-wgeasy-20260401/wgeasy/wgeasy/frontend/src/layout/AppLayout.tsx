import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex bg-gray-50 dark:bg-gray-950 min-h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Topbar />
        <main className="p-3 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
