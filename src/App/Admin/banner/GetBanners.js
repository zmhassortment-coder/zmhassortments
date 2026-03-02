import React, { useCallback, useEffect, useState } from "react";
import ResponsiveTable from "./Table";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ADMIN_API_BASE_URL } from "../adminApi";
import { getCookie } from "../../../utils/cookies";

const GetBanner = () => {
  const [BannerData, setBanner] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const getAuthHeaders = () => {
    const token = getCookie("merchant_token") || getCookie("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Handle sidebar responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1000);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch banners from API
  const fetchBanner = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/banners`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        switch (response.status) {
          case 401:
          case 403:
            toast.error("Admin not logged in. Redirecting to login page...", "warning");
            navigate("/");
            break;
          case 500:
            toast.error("Server error. Please try again later.", "error");
            break;
          default:
            toast.error(`Error: ${errorMessage || "Failed to fetch banners."}`, "error");
        }
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.data) throw new Error("Invalid response structure from the server.");

      setBanner(data.data);
    } catch (error) {
      toast.error("Error fetching Banners. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  // Handle banner deletion
  const handleDelete = async (item) => {
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/delete-banner/${item._id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to delete Banner");

      toast.success(`Banner has been deleted.`, "success");
      fetchBanner();
    } catch (error) {
      toast.error("Error deleting Banner. Please try again.", "error");
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      <ToastContainer />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } z-10 transition-transform duration-300 ease-in-out xl:relative xl:translate-x-0`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto bg-gradient-to-br from-black via-[#101010] to-black p-6">
        {/* Sidebar Toggle Button for Mobile */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed left-4 top-4 z-20 rounded border border-[#c9a93b]/30 bg-black p-2 text-[#c9a93b] xl:hidden"
        >
          {isSidebarOpen ? "Close Menu" : "Open Menu"}
        </button>

        <div className="min-h-screen rounded-2xl border border-[#c9a93b]/20 bg-[#0f0f0f] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c9a93b]/20 bg-black p-4">
            {/* Page Title */}
            <h1 className="mb-2 text-2xl font-bold text-[#c9a93b] md:mb-0">Manage Banners</h1>

            {/* Add New Button */}
            <Link to={"/create-banners"}>
              <button className="rounded-lg bg-[#c9a93b] px-4 py-2 font-medium text-black transition hover:opacity-90">
                Add New
              </button>
            </Link>
          </div>

          {/* Banners Table */}
          <div className="mt-5">
            <ResponsiveTable data={BannerData} onDelete={handleDelete} />
          </div>
          
          {/* Loading Indicator */}
          {loading && <p className="mt-4 text-zinc-300">Loading...</p>}
        </div>
      </div>
    </div>
  );
};

export default GetBanner;



