import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ADMIN_API_BASE_URL } from "../adminApi";

const BannerManagement = () => {
  const [bannerheader, setbannerheader] = useState("");
  const [bannerimg, setbannerimg] = useState("");
  const [bannerdescp, setbannerdescp] = useState("");
  const [bannerlink, setbannerlink] = useState("");
  const [error, setError] = useState(false);

  const navigate = useNavigate();



  const handleEvent = async (e) => {
    e.preventDefault();

    if (!bannerheader || !bannerdescp || !bannerimg || !bannerlink) {
      setError(true);
      toast.warning("Please fill all  fields!", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("banner_img", bannerimg);
    formData.append("banner_header", bannerheader);
    formData.append("banner_descp", bannerdescp);
    formData.append("banner_link", bannerlink);

    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/create-banner`, {
        method: "POST",
        credentials: "include",
        headers: {},
        body: formData,
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
            toast.error("Failed to create banner. Please try again.", "error");
        }

        console.error(`HTTP Error: ${response.status}`, errorMessage);
        return;
      }

      await response.json();
      toast.success("Banner created successfully!", "success");
      setTimeout(() => navigate("/getbanners"), 1500);
    } catch (err) {
      console.error("Error creating banner:", err);
      toast.error("Failed to create banner. Please check your network.", "error");
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <ToastContainer /> {/* Add ToastContainer for notifications */}

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl w-full mx-auto bg-[#0f0f0f] border border-[#c9a93b]/20 shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Add Banners</h2>
        <form onSubmit={handleEvent} className="space-y-6">
          {/* Banner Title */}
          <div>
            <label htmlFor="bannerheader" className="block text-sm font-medium text-zinc-200">
              Banner Title
            </label>
            <input
              type="text"
              id="bannerheader"
              placeholder="Enter banner title"
              className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={bannerheader}
              onChange={(e) => setbannerheader(e.target.value)}

            />
            {error && !bannerheader && <p className="text-red-500 text-sm mt-2">Please enter a banner title</p>}
          </div>

          {/* Banner Description */}
          <div>
            <label htmlFor="bannerdescp" className="block text-sm font-medium text-zinc-200">
              Banner Description
            </label>
            <input
              type="text"
              id="bannerdescp"
              placeholder="Enter banner description"
              className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={bannerdescp}
              onChange={(e) => setbannerdescp(e.target.value)}

            />
            {error && !bannerdescp && <p className="text-red-500 text-sm mt-2">Please enter a banner description</p>}
          </div>

          {/* Banner Image */}
          <div>
            <label htmlFor="bannerimg" className="block text-sm font-medium text-zinc-200">
              Banner Image
            </label>
            <input
              type="file"
              id="bannerimg"
              className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              onChange={(e) => setbannerimg(e.target.files[0])}

            />
            {error && !bannerimg && <p className="text-red-500 text-sm mt-2">Please upload a banner image</p>}
          </div>

          {/* Redirect Link */}
          <div>
            <label htmlFor="bannerlink" className="block text-sm font-medium text-zinc-200">
              Redirect Link
            </label>
            <input
              type="url"
              id="bannerlink"
              placeholder="Enter redirect link"
              className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={bannerlink}
              onChange={(e) => setbannerlink(e.target.value)}

            />
            {error && !bannerlink && <p className="text-red-500 text-sm mt-2">Please enter a redirect link</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#c9a93b] text-black py-3 rounded-lg font-medium hover:bg-[#c9a93b] focus:outline-none focus:ring focus:ring-[#c9a93b]"
          >
            Add Banner
          </button>
        </form>
      </div>
    </div>
  );
};

export default BannerManagement;





