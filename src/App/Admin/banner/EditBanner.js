import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ADMIN_API_BASE_URL } from "../adminApi";
const EditBanner = ({ onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        banner_header: "",
        banner_descp: "",
        banner_img: "",
        banner_link: "",
    });

    // Load existing banner data
    useEffect(() => {
        const bannerData = JSON.parse(localStorage.getItem("bannerData"));
        if (bannerData && bannerData._id === id) {
            setFormData(bannerData);
        } else {
            console.log("Fetching banner data for ID:", id);
        }
    }, [id]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, banner_img: file });
    };

    // Submit form data
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formDataToSend = new FormData();
        formDataToSend.append("banner_header", formData.banner_header);
        formDataToSend.append("banner_descp", formData.banner_descp);
        formDataToSend.append("banner_link", formData.banner_link);
        // Only append the image if a new file is provided
        if (formData.banner_img instanceof File) {
            formDataToSend.append("banner_img", formData.banner_img);
        }
        try {
            setLoading(true);
            const response = await fetch(`${ADMIN_API_BASE_URL}/api/update-banner/${id}`, {
                method: "PUT",
                credentials: "include",
                headers: {},
                body: formDataToSend,
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
                        toast.error(`Error: ${errorMessage || "Failed to fetch categories."}`, "error");
                }

                console.error(`HTTP Error: ${response.status}`, errorMessage);
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const result = await response.json();
            toast.success("Banner updated:", result);
            setTimeout(() => navigate("/getbanners "), 1500);
        } catch (err) {
            setError("Failed to update banner. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-black">
            {/* Toast Notification Container */}
            <ToastContainer />
            <div className="bg-[#0f0f0f] border border-[#c9a93b]/20 p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-zinc-200">Edit Banner</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Header Field */}
                    <div>
                        <label
                            htmlFor="banner_header"
                            className="block text-sm font-medium text-zinc-200"
                        >
                            Banner Header
                        </label>
                        <input
                            type="text"
                            id="banner_header"
                            name="banner_header"
                            value={formData.banner_header}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-2 text-white focus:ring-1 focus:ring-[#c9a93b] focus:outline-none"
                            placeholder="Enter Banner Header"
                        />
                    </div>

                    {/* Description Field */}
                    <div>
                        <label
                            htmlFor="banner_descp"
                            className="block text-sm font-medium text-zinc-200"
                        >
                            Banner Description
                        </label>
                        <textarea
                            id="banner_descp"
                            name="banner_descp"
                            value={formData.banner_descp}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-2 text-white focus:ring-1 focus:ring-[#c9a93b] focus:outline-none"
                            placeholder="Enter Banner Description"
                        />
                    </div>

                    {/* Image Field */}
                    <div>
                        <label
                            htmlFor="banner_img"
                            className="block text-sm font-medium text-zinc-200"
                        >
                            Banner Image
                        </label>
                        {formData.banner_img && typeof formData.banner_img === "string" && (
                            <img
                                src={`${ADMIN_API_BASE_URL}/${formData.banner_img}`}
                                alt="Banner"
                                className="w-24 h-24 object-cover rounded-lg my-2"
                            />
                        )}
                        <input
                            type="file"
                            id="banner_img"
                            name="banner_img"
                            onChange={handleImageChange}
                            className="w-full mt-1 p-2 border rounded-lg focus:ring-[#c9a93b] focus:outline-none"
                        />
                    </div>

                    {/* Link Field */}
                    <div>
                        <label
                            htmlFor="banner_link"
                            className="block text-sm font-medium text-zinc-200"
                        >
                            Banner Link
                        </label>
                        <input
                            type="text"
                            id="banner_link"
                            name="banner_link"
                            value={formData.banner_link}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 rounded-lg border border-[#c9a93b]/35 bg-black/40 p-2 text-white focus:ring-1 focus:ring-[#c9a93b] focus:outline-none"
                            placeholder="Enter Banner Link"
                        />
                    </div>

                    {/* Error Message */}
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {/* Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="rounded-lg border border-[#c9a93b]/40 px-4 py-2 text-[#c9a93b] hover:bg-[#c9a93b]/10"
                            onClick={() => window.history.back()}
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

export default EditBanner;




