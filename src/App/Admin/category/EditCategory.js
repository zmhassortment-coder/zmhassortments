import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ADMIN_API_BASE_URL } from "../adminApi";

const EditCategoryPage = ({ onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryname, setcategoryname] = useState("");
  const [categoryicon, setcategoryicon] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();  

  const [formData, setFormData] = useState({
    name: "",  
    icon: "",   
  });
 
  // Show Toast Messages
  const showToast = (message, type) => {
    toast[type](message); // 'success', 'error', 'warning', 'info'
  };
  
  useEffect(() => {
    const categoryData = JSON.parse(localStorage.getItem("categoryData"));
    if (categoryData && categoryData._id === id) {
      setFormData(categoryData);  
      setcategoryname(categoryData.name);
      setcategoryicon(categoryData.icon);
    } else {
      console.log("Fetching data for category ID:", id);
    }
  }, [id]);  

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("icon", categoryicon);
    formData.append("name", categoryname);

    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/update-category/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {},
        body: formData,
      });

      if (!response.ok) {
        await response.text();
        switch (response.status) {
          case 401:
          case 403:
            showToast("Admin not logged in. Redirecting to login page...", "warning");
            navigate("/");
            break;
          case 500:
            showToast("Server error. Please try again later.", "error");
            break;
          default:
            showToast("Failed to update category. Please try again.", "error");
        }
        throw new Error(`HTTP Error: ${response.status}`);
      }

      await response.json();
      showToast("Category updated successfully!", "success");
      setTimeout(() => navigate("/getcategories"), 1500);
      } catch (err) {
      setError("Failed to update category. Please try again.");
      showToast("Failed to update category. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      {/* Toast Notification Container */}
      <ToastContainer />
      
      {/* Back Button */}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      </div>
      <div className="bg-[#0f0f0f] border border-[#c9a93b]/20 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-zinc-200">Edit Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4 my-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-200">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={categoryname}
              onChange={(e) => setcategoryname(e.target.value)} 
              required 
              className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-2 text-white focus:ring-1 focus:ring-[#c9a93b] focus:outline-none"
              placeholder="Enter category name"
            />
          </div>
          
          {/* Image Field */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-zinc-200">Image</label>
            {formData.icon && typeof formData.icon === "string" && (
              <img
                src={`${ADMIN_API_BASE_URL}/${formData.icon}`}
                alt="Category"
                className="w-24 h-24 object-cover rounded-lg my-2"
              />
            )}
            <input
              type="file"
              id="image"
              name="image"
              onChange={(e) => setcategoryicon(e.target.files[0])}
              className="w-full mt-1 p-2 border rounded-lg focus:ring-[#c9a93b] focus:outline-none"
            />
          </div>
          
          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-[#c9a93b]/40 px-4 py-2 text-[#c9a93b] hover:bg-[#c9a93b]/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#c9a93b] text-black px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryPage;




