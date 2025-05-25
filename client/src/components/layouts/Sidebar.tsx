import React from "react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isMobile }) => {
  const [location] = useLocation();

  // Determine if a link is active
  const isActive = (path: string) => {
    return location === path;
  };

  const linkClass = (path: string) => {
    return `flex items-center px-4 py-3 ${
      isActive(path)
        ? "text-white bg-primary-light"
        : "text-gray-300 hover:bg-primary-light hover:text-white"
    }`;
  };

  return (
    <aside
      id="sidebar"
      className={`sidebar bg-primary text-white w-64 fixed h-full z-10 ${
        isMobile ? (isOpen ? "open" : "") : ""
      }`}
      style={{
        transform: isMobile && !isOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <div className="p-4 flex items-center border-b border-primary-light">
        <div className="bg-white p-1 rounded mr-3">
          <div className="belt black-belt w-8 h-8 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
        </div>
        <h1 className="font-montserrat font-bold text-xl">SenseiSystem</h1>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-primary-light">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mr-3">
            <span className="font-bold text-white">JS</span>
          </div>
          <div>
            <p className="font-medium">John Sensei</p>
            <p className="text-xs text-gray-300">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="mt-4">
        <div className="px-4 py-2 text-xs text-gray-400 uppercase">Main</div>
        <Link href="/dashboard">
          <a className={linkClass("/dashboard")}>
            <span className="material-icons mr-3">dashboard</span>
            <span>Dashboard</span>
          </a>
        </Link>
        <Link href="/students">
          <a className={linkClass("/students")}>
            <span className="material-icons mr-3">people</span>
            <span>Students</span>
          </a>
        </Link>
        <Link href="/attendance">
          <a className={linkClass("/attendance")}>
            <span className="material-icons mr-3">fact_check</span>
            <span>Attendance</span>
          </a>
        </Link>
        <Link href="/classes">
          <a className={linkClass("/classes")}>
            <span className="material-icons mr-3">event</span>
            <span>Classes</span>
          </a>
        </Link>
        <Link href="/payments">
          <a className={linkClass("/payments")}>
            <span className="material-icons mr-3">payments</span>
            <span>Payments</span>
          </a>
        </Link>
        <Link href="/reports">
          <a className={linkClass("/reports")}>
            <span className="material-icons mr-3">bar_chart</span>
            <span>Reports</span>
          </a>
        </Link>

        <div className="px-4 py-2 mt-4 text-xs text-gray-400 uppercase">
          Settings
        </div>
        <Link href="/profile">
          <a className={linkClass("/profile")}>
            <span className="material-icons mr-3">person</span>
            <span>Profile</span>
          </a>
        </Link>
        <Link href="/settings">
          <a className={linkClass("/settings")}>
            <span className="material-icons mr-3">settings</span>
            <span>Settings</span>
          </a>
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
