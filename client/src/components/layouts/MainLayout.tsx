import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const menuToggle = document.getElementById("menu-toggle");
      
      if (
        isMobile &&
        sidebarOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        event.target !== menuToggle
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isMobile, sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} isMobile={isMobile} />

      {/* Main content */}
      <main className={`flex-1 ${!isMobile ? "ml-64" : ""} transition-all duration-300 ease-in-out relative`}>
        {/* Mobile header */}
        {isMobile && (
          <div className="bg-white shadow md:hidden flex items-center justify-between p-4">
            <button
              id="menu-toggle"
              className="text-gray-500 focus:outline-none"
              onClick={toggleSidebar}
            >
              <span className="material-icons">menu</span>
            </button>
            <div className="flex items-center">
              <div className="bg-primary p-1 rounded mr-2">
                <div className="belt black-belt w-6 h-6 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
              </div>
              <h1 className="font-montserrat font-bold text-lg">SenseiSystem</h1>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="font-bold text-white text-xs">JS</span>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
