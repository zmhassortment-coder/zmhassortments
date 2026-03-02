import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ADMIN_API_BASE_URL } from "../adminApi";

const EditProduct = ({ onCancel }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    category_id: "",
    title: "",
    descp: "",
    images: [],
    Productoption: [],
    colours: [],
    price: "",
    currency: "",
    brand: "",
    quantity: "",
    min_qty: "",
    max_qty: "",
    discount: "",
    shipping_locations: [],
    confirm_availability_before_payment: false,
    show_stock_quantity: true,
    product_type: "shop",
    is_trending: false,
    is_featured: false,
  });

const fetchProduct = useCallback(async () => {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/api/singleproduct/${id}`, {
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch product");

    const result = await response.json();
    console.log("Fetched product:", result); 

    // Fix: handle if API wraps data in { data: {...} }
    const productData = result.data || result;

    setFormData({
      category_id: productData.category_id || "",
      title: productData.title || "",
      descp: productData.descp || "",
      images: productData.images || [],
      Productoption: productData.Productoption || [],
      colours: productData.colours || [],
      price: productData.price || "",
      currency: productData.currency || "",
      brand: productData.brand || "",
      quantity: productData.quantity || "",
      min_qty: productData.min_qty || "",
      max_qty: productData.max_qty || "",
      discount: productData.discount || "",
      shipping_locations: productData.shipping_locations || [],
      confirm_availability_before_payment:
        productData.confirm_availability_before_payment || false,
      show_stock_quantity:
        productData.show_stock_quantity !== undefined
          ? productData.show_stock_quantity
          : true,
      product_type: productData.product_type || "shop",
      is_trending: productData.is_trending || false,
      is_featured: productData.is_featured || false,
    });
  } catch (err) {
    console.error("Error fetching product:", err);
  }
}, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);


  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle multiple array inputs (comma separated values)
  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.split(",").map((v) => v.trim()) });
  };

  // Handle multiple image uploads
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, images: files });
  };

  // Submit form data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    for (const key in formData) {
      if (Array.isArray(formData[key])) {
        formData[key].forEach((item) =>
          formDataToSend.append(`${key}[]`, item)
        );
      } else {
        formDataToSend.append(key, formData[key]);
      }
    }

    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/update-product/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {},
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        toast.error("Failed to update product. Please try again.");
        console.error(`HTTP Error: ${response.status}`, errorMessage);
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Product updated:", result);
      toast.success("Product updated successfully!");
      setTimeout(() => navigate("/getproduct"), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      </div>

      {/* Form */}
      <div className="flex flex-grow items-center justify-center">
        <div className="bg-[#0f0f0f] border border-[#c9a93b]/20 p-8 rounded-lg shadow-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
          <h2 className="text-2xl font-bold mb-6 text-[#c9a93b] text-center">
            Edit Product
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 my-6">
            {/* Category */}
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Description
              </label>
              <textarea
                name="descp"
                value={formData.descp}
                onChange={handleChange}
                rows={3}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Images
              </label>
              {Array.isArray(formData.images) &&
                formData.images.map((img, i) =>
                  typeof img === "string" ? (
                    <img
                      key={i}
                      src={img}
                      alt="product"
                      className="w-24 h-24 object-cover rounded-md mt-2"
                    />
                  ) : null
                )}
              <input
                type="file"
                name="images"
                multiple
                onChange={handleImageChange}
                className="w-full mt-2 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Product Options */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Product Options (comma separated)
              </label>
              <input
                type="text"
                name="Productoption"
                value={formData.Productoption.join(",")}
                onChange={handleArrayChange}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Colours */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Colours (comma separated)
              </label>
              <input
                type="text"
                name="colours"
                value={formData.colours.join(",")}
                onChange={handleArrayChange}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Price
              </label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Currency
              </label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Product Type
              </label>
              <select
                name="product_type"
                value={formData.product_type}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              >
                <option value="shop">Shop</option>
                <option value="interior">Interior</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Min Qty */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Minimum Quantity
              </label>
              <input
                type="number"
                name="min_qty"
                value={formData.min_qty}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Max Qty */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Maximum Quantity
              </label>
              <input
                type="number"
                name="max_qty"
                value={formData.max_qty}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Discount
              </label>
              <input
                type="text"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            {/* Shipping Locations */}
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Shipping Locations (comma separated)
              </label>
              <input
                type="text"
                name="shipping_locations"
                value={formData.shipping_locations.join(",")}
                onChange={handleArrayChange}
                className="w-full mt-1 rounded-md border border-[#c9a93b]/35 bg-black/40 p-2 text-white"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="confirm_availability_before_payment"
                checked={formData.confirm_availability_before_payment}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-zinc-200">
                Confirm Availability Before Payment
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="show_stock_quantity"
                checked={formData.show_stock_quantity}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-zinc-200">
                Show Exact Stock Quantity
              </label>
            </div>

            {/* Is Trending */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_trending"
                checked={formData.is_trending}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-zinc-200">
                Is Trending
              </label>
            </div>

            {/* Is Featured */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-zinc-200">
                Is Featured
              </label>
            </div>
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
    </div>
  )
}

export default EditProduct;




