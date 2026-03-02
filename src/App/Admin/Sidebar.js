import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaBox,
  FaClipboardList,
  FaImage,
  FaSignOutAlt,
  FaTags,
  FaTachometerAlt,
  FaTruck,
} from "react-icons/fa";

const navItems = [
  { to: "/admin-dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { to: "/getproduct", label: "Products", icon: FaBox },
  { to: "/getcategories", label: "Categories", icon: FaTags },
  { to: "/getbanners", label: "Banners", icon: FaImage },
  { to: "/admin-orders", label: "Orders", icon: FaClipboardList },
  { to: "/admin-delivery-settings", label: "Delivery", icon: FaTruck },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
    isActive
      ? "bg-[#c9a93b] text-black"
      : "text-zinc-300 hover:bg-zinc-800 hover:text-[#c9a93b]"
  }`;

const Sidebar = ({ onNavigate }) => {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-[#c9a93b]/20 bg-black/95 backdrop-blur">
      <div className="border-b border-[#c9a93b]/20 px-6 py-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[#c9a93b]/80">ZMH</p>
        <h1 className="mt-2 text-xl font-semibold text-white">Admin Panel</h1>
      </div>

      <nav className="px-4 py-5">
        <ul className="space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={linkClass} onClick={onNavigate}>
                <Icon className="text-base" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto px-4 pb-6">
        <NavLink to="/zmh" className={linkClass} onClick={onNavigate}>
          <FaSignOutAlt className="text-base" />
          <span>Logout</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;


