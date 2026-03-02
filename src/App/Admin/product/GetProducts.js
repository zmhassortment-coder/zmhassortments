import React, { useCallback, useEffect, useState } from "react";
import ResponsiveTable from "./Table";
import { Link } from "react-router-dom";
import Sidebar from "../Sidebar";
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCookie, getCookieJSON } from "../../../utils/cookies";
import { ADMIN_API_BASE_URL } from "../adminApi";

const GetProduct = () => {
  const [ProductData, setProduct] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  // responsiveness sidebar
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

  // cookies (secure tokens not in localStorage)
  const merchant = getCookieJSON("merchant");
  const id = merchant?.id || merchant?._id || "";
  // fetch product
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/Products`, {
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        const errorMessage = await response.text();

        switch (response.status) {
          case 400:
            toast.error("Bad Request: Invalid data provided.", "error");
            break;

          case 401:
            toast.warning("Admin not logged in. Redirecting to login page...", "warning");
            navigate("/");
            break;

          case 403:
            toast.warning("Admin not logged in. Redirecting to login page...", "warning");
            navigate("/");
            break;

          case 500:
            toast.error("Server error. Please try again later.", "error");
            break;

          default:
            toast.error("Failed to add product to trending. Please try again.", "error");
        }

        // Log the error for debugging
        console.error(`HTTP Error: ${response.status}`, errorMessage);

        // Throw error to terminate further execution
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      setProduct(data.data);
    } catch (error) {
      if (error.message.includes("NetworkError")) {
        toast.error("Network error. Please check your connection and try again.", "error");
      } else {
        toast.error("Failed to fetch categories. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleDelete = async (item) => {
    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/delete-product/${item._id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        await response.text();

        switch (response.status) {
          case 401:
          case 403:
            toast.warning("Admin not logged in. Redirecting to login page...", "warning");
            navigate("/");
            break;

          case 500:
            toast.error("Server error. Please try again later.", "error");
            break;

          default:
            toast.error("Failed to add product to trending. Please try again.", "error");
        }

      }
      const body = await response.json();
      toast.success(body.message);
      fetchProduct();
    } catch (error) {
      console.error(error);
      toast.error("Error deleting Banner. Please try again.");
    }
  };

  const handleTrending = async (item) => {
    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/add_trending/${id}/${item._id}`, {
        method: "Put",
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        const errorMessage = await response.text();

        switch (response.status) {
          case 401:
          case 403:
            toast.warning("Admin not logged in. Redirecting to login page...", "warning");
            navigate("/");
            break;

          case 500:
            toast.error("Server error. Please try again later.", "error");
            break;

          default:
            toast.error("Failed to add product to trending. Please try again.", "error");
        }

        console.error(`HTTP Error: ${response.status}`, errorMessage);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Success handling
      toast.success("Product added to trending successfully.");
      fetchProduct();
    } catch (error) {
      console.error("Error adding product to trending:", error);
      toast("An unexpected error occurred. Please try again.");
    }
  };

  const handleFeatured = async (item) => {
    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/add_featured/${id}/${item._id}`, {
        method: "PUT",
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        const errorMessage = await response.text();

        switch (response.status) {
          case 401:
          case 403:
            toast.warning("Admin not logged in. Redirecting to login page...", "warning");
            navigate("/");
            break;

          case 500:
            toast.error("Server error. Please try again later.", "error");
            break;

          default:
            toast.error("Failed to add product to Featured. Please try again.", "error");
        }

        console.error(`HTTP Error: ${response.status}`, errorMessage);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Success handling
      toast.success("Product added to Featured successfully.");
      fetchProduct(); 
    } catch (error) {
      console.error("Error adding product to Featured:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const removefromtrending = async (item) => {
    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/remove_from_trending/${id}/${item._id}`, {
        method: "Put",
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        // Check for specific status codes
        if (response.status === 400) {
          toast.error("Bad Request: Invalid data provided.");
        } else if (response.status === 404) {
          toast.error("Product not found. Please check the product ID.");
        } else if (response.status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to add product to trending. Please try again.");
        }
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Success handling
      toast.success("Product removed from trending successfully.");
      fetchProduct(); 
    } catch (error) {
      console.error("Error adding product to trending:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const removefromfeatured = async (item) => {
  const productid = item._id
    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/remove_from_featured/${id}/${productid}`, {
        method: "Put",
        credentials: "include",
        headers,
      });
      if (!response.ok) {
        // Check for specific status codes
        if (response.status === 400) {
          toast.error("Bad Request: Invalid data provided.");
        } else if (response.status === 404) {
          toast.error("Product not found. Please check the product ID.");
        } else if (response.status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to add product to Featured. Please try again.");
        }
        throw new Error(`HTTP Error: ${response.status}`);
      }

      // Success handling
      toast.success("Product removed from Featured successfully.");
      fetchProduct(); 
    } catch (error) {
      console.error("Error adding product to Featured:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white">
       {/* Toast Notification Container */}
       <ToastContainer />
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
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
            if (!isSidebarOpen) {
              document.body.classList.add("overflow-hidden");
            } else {
              document.body.classList.remove("overflow-hidden");
            }
          }}
          className="fixed left-4 top-4 z-20 rounded border border-[#c9a93b]/30 bg-black p-2 text-[#c9a93b] xl:hidden"
        >
          {isSidebarOpen ? "Close Menu" : "Open Menu"}
        </button>

        <div className="min-h-screen rounded-2xl border border-[#c9a93b]/20 bg-[#0f0f0f] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c9a93b]/20 bg-black p-4">
            {/* Heading Section */}
            <div>
              <h1 className="mb-2 text-2xl font-bold text-[#c9a93b] xl:mb-0">Manage Products</h1>
            </div>

            {/* Action Section */}
            <div>
              <Link to={"/create-product"}>
                <button className="rounded-lg bg-[#c9a93b] px-4 py-2 font-medium text-black transition hover:opacity-90">
                  Add New
                </button>
              </Link>
            </div>
          </div>

          <div className="mt-5">
          <ResponsiveTable
            data={ProductData}
            onTrend={handleTrending}
            onFeatured={handleFeatured}
            onDelete={handleDelete}
            removefromfeatured={removefromfeatured}
            removefromtrending={removefromtrending}
          />
          </div>
          {loading && <p className="mt-4 text-zinc-300">Loading...</p>}
        </div>
      </div>
    </div>


  );
};

export default GetProduct;



