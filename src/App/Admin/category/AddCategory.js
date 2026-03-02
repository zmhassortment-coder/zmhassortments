import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCookie, getCookieJSON } from "../../../utils/cookies";
import { ADMIN_API_BASE_URL } from "../adminApi";

const CategoryManagement = () => {
  const [categoryname, setcategoryname] = useState("");
  const [categoryicon, setcategoryicon] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const merchant = getCookieJSON("merchant");
  const id = merchant?.id || merchant?._id || "";


  
  const handleEvent = async (e) => {
    e.preventDefault();

    if (!id) {
      toast.error("Merchant not found. Please log in again.");
      return;
    }

    const formData = new FormData();
  
    formData.append("name", categoryname);
    formData.append("icon", categoryicon);
  
   console.log(formData)
    
  
    try {
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/create-category/${id}`, {
        method: "POST",
        credentials: "include",
        headers,
        body: formData,
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
  
        switch (response.status) {
          case 401:
          case 403:
            toast.warning("Admin not logged in. Redirecting to login page...");
            navigate("/")
            break;
          case 500:
            toast.error("Server error. Please try again later.");
            break;
          default:
            toast.error("Failed to create category. Please try again.");
        }
        console.error(`HTTP Error: ${response.status}`, errorMessage);
        throw new Error(`HTTP Error: ${response.status}`);
      }
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success(data.message || "Category created successfully!");
        setTimeout(() => navigate("/getcategories"), 1500); // Redirect after 1.5 seconds 
      } else {
        toast.error("Failed to create category.");
      }
    } catch (err) {
      console.error("Error creating category:", err);
      setError(true);
      toast.error("Failed to create category.");
    }
  };
  
  

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      {/* Toast Container */}
      <ToastContainer />
      <div className="absolute top-4 left-4">
        <button
          className="text-[#c9a93b] hover:text-[#f3d77c] font-medium flex items-center"
          onClick={() => window.history.back()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 mr-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>
      <div className="max-w-4xl w-full mx-auto bg-[#0f0f0f] border border-[#c9a93b]/20 shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Add Categories</h2>
        <form onSubmit={handleEvent} className="space-y-6 my-6">
          {/* Category Name */}
          <div>
            <label htmlFor="categoryname" className="block text-sm font-medium text-zinc-200">
              Category Name
            </label>
            <input
              type="text"
              id="categoryname"
              placeholder="Enter category name"
              className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={categoryname}
              onChange={(e) => setcategoryname(e.target.value)}
            />
          </div>

          {/* Banner Image */}
          <div>
            <label htmlFor="categoryicon" className="block text-sm font-medium text-zinc-200">
              Banner Image
            </label>
            <input
              type="file"
              id="categoryicon"
              className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              onChange={(e) => setcategoryicon(e.target.files[0])}
            />
            {/* Error Message */}
            {error === true && !categoryicon && (
              <p className="text-red-500 text-sm mt-2">Please upload an avatar</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#c9a93b] text-black py-3 rounded-lg font-medium hover:bg-[#c9a93b] focus:outline-none focus:ring focus:ring-[#c9a93b]"
          >
            Add Category
          </button>
        </form>
      </div>
    </div>
  );
};

export default CategoryManagement;





