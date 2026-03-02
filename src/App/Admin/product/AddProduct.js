import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCookie, getCookieJSON } from "../../../utils/cookies";
import { ADMIN_API_BASE_URL } from "../adminApi";

const CreateProduct = () => {
  const [producttitle, setproducttitle] = useState("");
  const [productdescp, setproductdescp] = useState("");
  const [productimages, setproductimages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]); // Preview state
  const [productprice, setproductprice] = useState("");
  const [productcurrency, setproductcurrency] = useState("");
  const [productbrand, setproductbrand] = useState("");
  const [productqty, setproductqty] = useState("");
  const [productminqty, setproductminqty] = useState("");
  const [productmaxqty, setproductmaxqty] = useState("");
  const [productdiscount, setproductdiscount] = useState("");
  const [productshippinglocations, setproductshippinglocations] = useState("");
  const [confirmAvailabilityBeforePayment, setConfirmAvailabilityBeforePayment] =
    useState(false);
  const [showStockQuantity, setShowStockQuantity] = useState(true);
  const [productType, setProductType] = useState("shop");
  const [categoryid, setCategoryid] = useState("");
  const [loading, setLoading] = useState(false);
  const [categorydata, setCategoryData] = useState([]);

  const merchant = getCookieJSON("merchant");
  const id = merchant?.id || merchant?._id || "";
  const navigate = useNavigate();

  const showToast = (message, type) => {
    toast[type](message);
  };

  // Handle multiple image selection and preview
  const handleImageChange = (e) => {
    const files = e.target.files;
    setproductimages(files);

    // Generate preview URLs
    const previews = Array.from(files).map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  }; 

  const handleEvent = async (e) => {
    e.preventDefault();

    if (!id) {
      showToast("Merchant not found. Please log in again.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", producttitle);
    if (productdescp) formData.append("descp", productdescp);
    if (productprice) formData.append("price", productprice);
    if (productcurrency) formData.append("currency", productcurrency);
    if (productbrand) formData.append("brand", productbrand);
    if (productqty) formData.append("quantity", productqty);
    if (productminqty) formData.append("min_qty", productminqty);
    if (productmaxqty) formData.append("max_qty", productmaxqty);
    if (productdiscount) formData.append("discount", productdiscount);
    if (productshippinglocations)
      formData.append("shipping_locations", productshippinglocations);
    formData.append(
      "confirm_availability_before_payment",
      String(confirmAvailabilityBeforePayment)
    );
    formData.append("show_stock_quantity", String(showStockQuantity));
    formData.append("product_type", productType);

    // Append multiple images properly
    if (productimages && productimages.length > 0) {
      Array.from(productimages).forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      setLoading(true);
      const token = getCookie("merchant_token") || getCookie("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(
        `${ADMIN_API_BASE_URL}/api/create-product/${id}/${categoryid}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
          headers,
        }
      );

      const body = await response.json();

      if (!response.ok) {
        showToast(body.message || "Failed to create product", "error");
        return;
      }

      showToast(body.message, "success");
      navigate("/getproduct");
    } catch (err) {
      console.error(err);
      showToast("An error occurred while creating the product.", "error");
    } finally {
      setLoading(false);
    }
  };

  const Fetchcategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/categories`, {
        credentials: "include",
      });
      const data = await response.json();
      setCategoryData(data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Fetchcategories();
  }, []);

  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-black relative py-10">
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

      <div className="max-w-4xl w-full bg-[#0f0f0f] border border-[#c9a93b]/20 shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-[#c9a93b] mb-6 text-center">
          Create Product
        </h2>
        <form onSubmit={handleEvent} className="grid grid-cols-2 gap-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Product Name
            </label>
            <input
              type="text"
              placeholder="Product Name"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              required
              value={producttitle}
              onChange={(e) => setproducttitle(e.target.value)}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Price
            </label>
            <input
              type="number"
              placeholder="Price"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productprice}
              onChange={(e) => setproductprice(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-300">
              Description
            </label>
            <textarea
              placeholder="Description"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productdescp}
              onChange={(e) => setproductdescp(e.target.value)}
            ></textarea>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Currency
            </label>
            <input
              type="text"
              placeholder="Currency"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productcurrency}
              onChange={(e) => setproductcurrency(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Product Category
            </label>
            <select
              value={categoryid}
              onChange={(e) => setCategoryid(e.target.value)}
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              required
            >
              <option value="">Select Category</option>
              {Array.isArray(categorydata) &&
                categorydata.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Product Type
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
            >
              <option value="shop">Shop</option>
              <option value="interior">Interior</option>
            </select>
          </div>

          {/* Optional Fields */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">Brand</label>
            <input
              type="text"
              placeholder="Brand"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productbrand}
              onChange={(e) => setproductbrand(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Discount (%)
            </label>
            <input
              type="number"
              placeholder="Discount"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productdiscount}
              onChange={(e) => setproductdiscount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Quantity
            </label>
            <input
              type="number"
              placeholder="Quantity"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productqty}
              onChange={(e) => setproductqty(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Min Order
            </label>
            <input
              type="number"
              placeholder="Min Order"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productminqty}
              onChange={(e) => setproductminqty(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Max Order
            </label>
            <input
              type="number"
              placeholder="Max Order"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productmaxqty}
              onChange={(e) => setproductmaxqty(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Shipping Locations
            </label>
            <input
              type="text"
              placeholder="Shipping Locations"
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#c9a93b]"
              value={productshippinglocations}
              onChange={(e) => setproductshippinglocations(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-[#c9a93b]/25 bg-black/20 p-3">
            <label className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={confirmAvailabilityBeforePayment}
                onChange={(e) => setConfirmAvailabilityBeforePayment(e.target.checked)}
              />
              Confirm Availability Before Payment
            </label>
            <p className="mt-2 text-xs text-zinc-400">
              Enable this when offline sales can change stock quickly.
            </p>
          </div>

          <div className="rounded-lg border border-[#c9a93b]/25 bg-black/20 p-3">
            <label className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={showStockQuantity}
                onChange={(e) => setShowStockQuantity(e.target.checked)}
              />
              Show Exact Stock Quantity
            </label>
            <p className="mt-2 text-xs text-zinc-400">
              If off, customers will not see exact stock unless low-stock alert is triggered.
            </p>
          </div>

          {/* Product Images */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-300">
              Product Images
            </label>
            <input
              type="file"
              multiple
              className="w-full rounded-lg border border-[#c9a93b]/35 bg-black/40 p-3 text-white"
              onChange={handleImageChange}
            />
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {imagePreviews.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt={`Preview ${index}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c9a93b] text-black p-3 rounded-lg hover:opacity-90 transition"
            >
              {loading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;





