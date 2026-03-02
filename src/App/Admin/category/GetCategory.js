import React, { useCallback, useEffect, useState } from "react";
import ResponsiveTable from "./Table";
import { Link } from "react-router-dom";
import Sidebar from "../Sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCookie } from "../../../utils/cookies";
import { ADMIN_API_BASE_URL } from "../adminApi";

const GetCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sidebar Responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1000) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);

    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/categories`, {
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        switch (response.status) {
          case 401:
          case 403:
            toast.warning("Admin not logged in. Redirecting to login page...");
            break;
          case 500:
            toast.error("Server error. Please try again later.");
            break;
          default:
            toast.error(`Error: ${errorMessage || "Failed to fetch categories."}`);
        }
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.data) {
        throw new Error("Invalid response structure from the server.");
      }

      setCategories(data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle Delete Category
  const handleDelete = async (item) => {
    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/delete-category/${item._id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast.success(`Category "${item.name}" has been deleted.`);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting category. Please try again.");
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
      {/* Toast Notification Container */}
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
        {/* Toggle Button for Mobile */}
        <button
          onClick={() => {
            setIsSidebarOpen(!isSidebarOpen);
            document.body.classList.toggle("overflow-hidden", !isSidebarOpen);
          }}
          className="fixed left-4 top-4 z-20 rounded border border-[#c9a93b]/30 bg-black p-2 text-[#c9a93b] xl:hidden"
        >
          {isSidebarOpen ? "Close Menu" : "Open Menu"}
        </button>

        <div className="min-h-screen rounded-2xl border border-[#c9a93b]/20 bg-[#0f0f0f] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c9a93b]/20 bg-black p-4">
            {/* Heading Section */}
            <h1 className="text-2xl font-bold text-[#c9a93b]">Manage Categories</h1>

            {/* Add New Button */}
            <Link to={"/create-categories"}>
              <button className="rounded-lg bg-[#c9a93b] px-4 py-2 font-medium text-black transition hover:opacity-90">
                Add New
              </button>
            </Link>
          </div>

          <div className="mt-5">
            <ResponsiveTable data={categories} onDelete={handleDelete} />
          </div>
          {loading && <p className="mt-4 text-zinc-300">Loading...</p>}
        </div>
      </div>
    </div>
  );
};

export default GetCategory;



