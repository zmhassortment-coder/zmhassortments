import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ADMIN_API_BASE_URL } from "./adminApi";
import { getCookie } from "../../utils/cookies";

const getAuthHeaders = () => {
  const token = getCookie("merchant_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const readResponseBody = async (response) => {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : { data: [] };
  } catch {
    return { data: [] };
  }
};

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    products: 0,
    categories: 0,
    banners: 0,
    orders: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1000;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();
        const req = async (path) => {
          const res = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
            credentials: "include",
            headers,
          });
          if (!res.ok) return { data: [] };
          return readResponseBody(res);
        };

        const [productsRes, categoriesRes, bannersRes, ordersRes] = await Promise.all([
          req("/api/Products"),
          req("/api/categories"),
          req("/api/banners"),
          req("/api/admin/orders"),
        ]);

        setCounts({
          products: Array.isArray(productsRes?.data) ? productsRes.data.length : 0,
          categories: Array.isArray(categoriesRes?.data) ? categoriesRes.data.length : 0,
          banners: Array.isArray(bannersRes?.data) ? bannersRes.data.length : 0,
          orders: Array.isArray(ordersRes?.data) ? ordersRes.data.length : 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = useMemo(
    () => [
      { title: "Products", value: counts.products, link: "/getproduct" },
      { title: "Categories", value: counts.categories, link: "/getcategories" },
      { title: "Banners", value: counts.banners, link: "/getbanners" },
      { title: "Orders", value: counts.orders, link: "/admin-orders" },
      { title: "Delivery", value: "Config", link: "/admin-delivery-settings" },
    ],
    [counts]
  );

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      {isMobile && isSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-10 bg-black/70"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-20 transform transition-transform duration-300 xl:relative xl:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={() => isMobile && setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-black via-[#101010] to-black p-6 md:p-8">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="mb-6 rounded-lg border border-[#c9a93b]/30 px-3 py-2 text-xs text-[#c9a93b] xl:hidden"
        >
          {isSidebarOpen ? "Close Menu" : "Open Menu"}
        </button>

        <header className="mb-8 rounded-2xl border border-[#c9a93b]/20 bg-[#0f0f0f] p-6">
          <h2 className="text-3xl font-semibold text-[#c9a93b]">Admin Overview</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Monitor products, categories, banners, and customer orders in one place.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="rounded-2xl border border-[#c9a93b]/20 bg-[#111] p-5 transition hover:border-[#c9a93b]/60"
            >
              <p className="text-sm text-zinc-400">{card.title}</p>
              <p className="mt-3 text-3xl font-bold text-[#c9a93b]">
                {loading ? "..." : card.value}
              </p>
              <p className="mt-2 text-xs text-zinc-500">Open {card.title.toLowerCase()}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-[#c9a93b]/20 bg-[#0f0f0f] p-5 md:p-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/create-product"
              className="rounded-full bg-[#c9a93b] px-5 py-2 text-sm font-semibold text-black"
            >
              Add Product
            </Link>
            <Link
              to="/create-categories"
              className="rounded-full border border-[#c9a93b]/40 px-5 py-2 text-sm text-[#c9a93b]"
            >
              Add Category
            </Link>
            <Link
              to="/create-banners"
              className="rounded-full border border-[#c9a93b]/40 px-5 py-2 text-sm text-[#c9a93b]"
            >
              Add Banner
            </Link>
            <Link
              to="/admin-orders"
              className="rounded-full border border-[#c9a93b]/40 px-5 py-2 text-sm text-[#c9a93b]"
            >
              View Orders
            </Link>
            <Link
              to="/admin-delivery-settings"
              className="rounded-full border border-[#c9a93b]/40 px-5 py-2 text-sm text-[#c9a93b]"
            >
              Delivery Settings
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;


