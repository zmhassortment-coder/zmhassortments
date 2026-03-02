// CartCheckoutPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { getCookie } from "../api/client";
import {
  clearCart as clearCartApi,
  createOrder,
  getCart,
  getCheckoutProfile,
  getDeliverySettings,
  removeCartItem as removeCartItemApi,
  updateCartItem as updateCartItemApi,
  updateCheckoutProfile,
} from "../api/cartApi";
const DELIVERY_SETTINGS_FALLBACK = {
  free_delivery_state: "Lagos",
  free_delivery_areas: ["Ikeja", "Yaba", "Lekki Phase 1"],
  home_delivery_fee: 3000,
  transport_stations: ["Ojota", "Berger", "Jibowu"],
};

/**
 * CartCheckoutPage
 * - Full checkout UI (keeps your style)
 * - Centered modal on desktop, FULL SCREEN modal on mobile
 * - Bank transfer UI with 3-bank animated blocks (left, right, bottom)
 * - Upload receipt (only images: jpg/jpeg/png), preview & validate
 * - Prefill user shipping details if available from /me
 *
 * Everything is inside this single file per your instruction.
 */

export default function CartCheckoutPage() {
  const token = getCookie("token");
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);

  // Checkout states
  const [isCheckout, setIsCheckout] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // shipping form (prefills from profile if available)
  const [form, setForm] = useState({
    fullName: "",
    address: "",
    phone: "",
    state: "",
    area: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState("home_delivery");
  const [transportStation, setTransportStation] = useState("");
  const [deliverySettings, setDeliverySettings] = useState(DELIVERY_SETTINGS_FALLBACK);
  const [deliverySettingsSource, setDeliverySettingsSource] = useState("fallback");

  // receipt upload
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // bank details (dummy values; you can replace later)
  const banks = [
    { id: "M", name: "Money Point", accountNo: "0123456789", accountName: "ZMH Collections Ltd" },
    { id: "K", name: "Keystone Bank", accountNo: "1234567890", accountName: "ZMH Collections Ltd" },
    { id: "P", name: "Polaris Bank", accountNo: "2345678901", accountName: "ZMH Collections Ltd" },
  ];

  const fileInputRef = useRef(null);
  const freeDeliveryState = deliverySettings.free_delivery_state || "";
  const freeDeliveryAreas = Array.isArray(deliverySettings.free_delivery_areas)
    ? deliverySettings.free_delivery_areas
    : [];
  const homeDeliveryFeeValue = Number(deliverySettings.home_delivery_fee);
  const homeDeliveryFee =
    Number.isFinite(homeDeliveryFeeValue) && homeDeliveryFeeValue >= 0
      ? homeDeliveryFeeValue
      : 0;
  const transportStations = Array.isArray(deliverySettings.transport_stations)
    ? deliverySettings.transport_stations
    : [];
  const normalizedState = form.state.trim().toLowerCase();
  const normalizedArea = form.area.trim().toLowerCase();
  const hasFreeHomeDelivery =
    normalizedState === freeDeliveryState.toLowerCase() &&
    freeDeliveryAreas.some((area) => area.toLowerCase() === normalizedArea);
  const deliveryFee = deliveryMethod === "pickup_station"
    ? 0
    : hasFreeHomeDelivery
      ? 0
      : homeDeliveryFee;
  const payableTotal = Number(cart.subtotal || 0) + deliveryFee;

  // ====== Fetch cart & profile (prefill) ======
  useEffect(() => {
    if (!token) {
      setCart({ items: [], subtotal: 0 });
      setLoading(false);
      return;
    }
    fetchCart();
    fetchProfile();
    fetchDeliverySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCart() {
    if (!token) {
      setCart({ items: [], subtotal: 0 });
      setLoading(false);
      return;
    }
    try {
      const data = await getCart();
      if (data.success) setCart(data.data);
      else setCart({ items: [], subtotal: 0 });
    } catch (err) {
      console.error("fetchCart error:", err);
      setCart({ items: [], subtotal: 0 });
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile() {
    try {
      const data = await getCheckoutProfile();
      if (data?.success && data?.data) {
        const u = data.data;
        setForm({
          fullName: u.name || "",
          address: u.address || "",
          phone: u.phone || "",
          state: "",
          area: "",
        });
        setProfileLoaded(true);
      } else {
        setProfileLoaded(false);
      }
    } catch (err) {
      console.warn("fetchProfile failed, continuing with empty form or dummy data.", err);
      setProfileLoaded(false);
    }
  }

  async function fetchDeliverySettings() {
    try {
      const data = await getDeliverySettings();
      const payload = data?.data || {};
      setDeliverySettings({
        free_delivery_state:
          payload.free_delivery_state || DELIVERY_SETTINGS_FALLBACK.free_delivery_state,
        free_delivery_areas:
          Array.isArray(payload.free_delivery_areas) &&
          payload.free_delivery_areas.length > 0
            ? payload.free_delivery_areas
            : DELIVERY_SETTINGS_FALLBACK.free_delivery_areas,
        home_delivery_fee:
          payload.home_delivery_fee !== undefined
            ? payload.home_delivery_fee
            : DELIVERY_SETTINGS_FALLBACK.home_delivery_fee,
        transport_stations:
          Array.isArray(payload.transport_stations) &&
          payload.transport_stations.length > 0
            ? payload.transport_stations
            : DELIVERY_SETTINGS_FALLBACK.transport_stations,
      });
      setDeliverySettingsSource("live");
    } catch (err) {
      console.warn("fetchDeliverySettings failed. Using fallback settings.", err);
      setDeliverySettings(DELIVERY_SETTINGS_FALLBACK);
      setDeliverySettingsSource("fallback");
    }
  }

  // ====== Form change handler ======
  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const updateItemQuantity = async (itemId, nextQty, product) => {
    if (!token) {
      toast.error("Please log in to update your cart.");
      return;
    }
    if (nextQty < 1) return;
    const maxQty = Number(product?.quantity);
    const requiresAvailabilityConfirmation =
      product?.confirm_availability_before_payment === true;
    if (
      !requiresAvailabilityConfirmation &&
      Number.isFinite(maxQty) &&
      maxQty > 0 &&
      nextQty > maxQty
    ) {
      toast.info(`Only ${maxQty} in stock.`);
      return;
    }
    try {
      setUpdatingItemId(itemId);
      const data = await updateCartItemApi(itemId, nextQty);
      if (data?.success) {
        await fetchCart();
      } else {
        toast.error(data?.message || "Failed to update quantity.");
      }
    } catch (err) {
      console.error("updateItemQuantity error:", err);
      toast.error("Failed to update quantity. Try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeCartItem = async (itemId) => {
    if (!token) {
      toast.error("Please log in to update your cart.");
      return;
    }
    try {
      setRemovingItemId(itemId);
      const data = await removeCartItemApi(itemId);
      if (data?.success) {
        await fetchCart();
      } else {
        toast.error(data?.message || "Failed to remove item.");
      }
    } catch (err) {
      console.error("removeCartItem error:", err);
      toast.error("Failed to remove item. Try again.");
    } finally {
      setRemovingItemId(null);
    }
  };

  // ====== When user clicks Proceed to Checkout ======
  const beginCheckout = () => {
    if (!token) {
      toast.error("Please log in to proceed to checkout.");
      return;
    }
    // If profile exists and required fields filled, go straight to confirm step (isCheckout=true)
    // else present form for shipping (we already show shipping form, so just open)
    setIsCheckout(true);
    // Keep fetched profile (if any) and allow editing
  };

  // ====== Confirm Order (shipping form submission) ======
  const handleConfirmOrder = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.fullName || !form.address || !form.phone || !form.state || !form.area) {
      toast.error("Please fill all required shipping details.");
      return;
    }
    if (deliveryMethod === "pickup_station" && !transportStation) {
      toast.error("Please select a transport station for pickup.");
      return;
    }

    // Optionally update user profile on backend if token
    if (token && profileLoaded) {
      try {
        // best effort; don't block checkout
        await updateCheckoutProfile({ name: form.fullName, address: form.address, phone: form.phone });
      } catch (err) {
        console.warn("Could not auto-update profile:", err);
      }
    }

    // After shipping confirmed, open payment modal (bank details)
    setShowPaymentModal(true);
  };

  // ====== Receipt upload handlers ======
  const handleReceiptSelect = (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, JPEG or PNG receipts are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Receipt must be smaller than 5MB.");
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const onReceiptInput = (e) => {
    const file = e.target.files?.[0];
    handleReceiptSelect(file);
  };
  // ====== Finalize: create order ======
  const handleIHavePaid = async () => {
    if (!token) {
      toast.error("Please log in to complete order.");
      return;
    }

    if (!receiptFile) {
      toast.info("You can upload a receipt, or press 'I have paid' to proceed without receipt.");
    }

    try {
      setUploadingReceipt(true);

      if (!cart.items?.length) {
        toast.error("Your cart is empty.");
        return;
      }

      const items = cart.items.map((item) => {
        const product = item.product_id || {};
        return {
          product_id: product._id || product.id || item.product_id,
          title: product.title || "Product",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: product.images?.[0] || null,
          currency: product.currency || null,
        };
      });

      const data = await createOrder({
        items,
        address: form.address,
        payment_method: "bank_transfer",
        delivery_method: deliveryMethod,
        delivery_state: form.state,
        delivery_area: form.area,
        transport_station: deliveryMethod === "pickup_station" ? transportStation : "",
        delivery_fee: deliveryFee,
        notes: receiptFile
          ? `Bank: ${banks[0].name} | Delivery: ${deliveryMethod} | Receipt attached on client`
          : `Bank: ${banks[0].name} | Delivery: ${deliveryMethod}`,
      });

      if (data?.success) {
        toast.success("Order created successfully.");
        setShowPaymentModal(false);
        await clearCartApi();
        await fetchCart();
      } else {
        toast.error(data?.message || "Order creation failed.");
      }
    } catch (err) {
      console.error("Order creation error:", err);
      toast.error("Failed to create order. Try again.");
    } finally {
      setUploadingReceipt(false);
    }
  };
  // Remove receipt
  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ====== Modal close and reset ======
  const closeModal = () => {
    setShowPaymentModal(false);
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  // ====== Render ======
  return (
    <div className="w-full max-w-full py-6 bg-white overflow-x-hidden">
      <Navbar />
      <div className="w-full max-w-screen overflow-x-hidden">
        <ToastContainer />

        <div className="w-full py-28 min-h-screen bg-black text-white px-4 md:px-8 transition-all">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            {/* LEFT: Cart / Checkout form */}
            <div className="bg-[#111] border border-[#c9a93b]/30 p-6 md:p-8 rounded-2xl shadow-lg overflow-hidden">
              <AnimatePresence mode="wait">
                {!isCheckout ? (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35 }}
                  >
                    <h2 className="text-2xl font-bold mb-6 text-gold">Your Cart</h2>

                    {loading ? (
                      <div className="flex justify-center py-10">
                        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : cart.items.length === 0 ? (
                      !token ? (
                        <div className="space-y-3 rounded-xl border border-[#c9a93b]/20 bg-black/30 p-4">
                          <p className="text-sm text-gray-300">
                            Please log in or sign up to view and manage your cart.
                          </p>
                          <div className="flex gap-3">
                            <Link
                              to="/login"
                              className="rounded-full border border-[#c9a93b]/40 px-4 py-2 text-sm text-[#c9a93b] hover:bg-[#c9a93b]/10"
                            >
                              Login
                            </Link>
                            <Link
                              to="/signup"
                              className="rounded-full bg-[#c9a93b] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                            >
                              Sign Up
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">Your cart is empty.</p>
                      )
                    ) : (
                      <>
                        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                          {cart.items.map((item) => (
                            <div
                              key={item._id}
                              className="flex justify-between items-center border-b border-[#c9a93b]/20 pb-3"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.product_id?.images?.[0]}
                                  alt={item.product_id?.title}
                                  className="w-16 h-16 rounded-lg border border-[#c9a93b]/30 object-cover"
                                />
                                <div>
                                  <p className="font-semibold text-gold">
                                    {item.product_id?.title}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        updateItemQuantity(
                                          item._id,
                                          item.quantity - 1,
                                          item.product_id
                                        )
                                      }
                                      disabled={item.quantity <= 1 || updatingItemId === item._id}
                                      className="h-7 w-7 rounded-full border border-[#c9a93b]/40 text-gold hover:bg-[#c9a93b]/20 disabled:opacity-50"
                                      aria-label="Decrease quantity"
                                    >
                                      -
                                    </button>
                                    <span className="text-sm text-gray-300 min-w-[20px] text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateItemQuantity(
                                          item._id,
                                          item.quantity + 1,
                                          item.product_id
                                        )
                                      }
                                      disabled={
                                        updatingItemId === item._id ||
                                        (item.product_id?.confirm_availability_before_payment !== true &&
                                          Number.isFinite(Number(item.product_id?.quantity)) &&
                                          Number(item.product_id?.quantity) > 0 &&
                                          item.quantity >= Number(item.product_id?.quantity))
                                      }
                                      className="h-7 w-7 rounded-full border border-[#c9a93b]/40 text-gold hover:bg-[#c9a93b]/20 disabled:opacity-50"
                                      aria-label="Increase quantity"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => removeCartItem(item._id)}
                                      disabled={removingItemId === item._id}
                                      className="ml-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                                    >
                                      {removingItemId === item._id ? "Removing..." : "Remove"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-gold">
                                ₦{Number(item.total).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 border-t border-[#c9a93b]/20 pt-4 flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-gold">₦{Number(cart.subtotal).toLocaleString()}</span>
                        </div>

                        <button
                          onClick={beginCheckout}
                          className="w-full mt-6 bg-[#c9a93b] text-black font-semibold py-2 rounded-lg hover:bg-[#b8972d] transition"
                        >
                          Proceed to Checkout
                        </button>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="checkout"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                  >
                    <h2 className="text-2xl font-bold mb-6 text-gold">Shipping Details</h2>
                    <div className="mb-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs ${
                          deliverySettingsSource === "live"
                            ? "border-emerald-500/50 text-emerald-300"
                            : "border-amber-500/50 text-amber-300"
                        }`}
                      >
                        Delivery settings: {deliverySettingsSource === "live" ? "Live" : "Fallback"}
                      </span>
                    </div>

                    <form onSubmit={handleConfirmOrder} className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={form.fullName}
                          onChange={handleChange}
                          required
                          className="w-full bg-transparent border border-[#c9a93b]/40 rounded-lg p-2 text-white focus:ring-1 focus:ring-[#c9a93b]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Address</label>
                        <textarea
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          rows={3}
                          required
                          className="w-full bg-transparent border border-[#c9a93b]/40 rounded-lg p-2 text-white focus:ring-1 focus:ring-[#c9a93b]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          className="w-full bg-transparent border border-[#c9a93b]/40 rounded-lg p-2 text-white focus:ring-1 focus:ring-[#c9a93b]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={form.state}
                          onChange={handleChange}
                          required
                          className="w-full bg-transparent border border-[#c9a93b]/40 rounded-lg p-2 text-white focus:ring-1 focus:ring-[#c9a93b]"
                          placeholder="e.g. Lagos"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Area</label>
                        <input
                          type="text"
                          name="area"
                          value={form.area}
                          onChange={handleChange}
                          required
                          className="w-full bg-transparent border border-[#c9a93b]/40 rounded-lg p-2 text-white focus:ring-1 focus:ring-[#c9a93b]"
                          placeholder="e.g. Ikeja"
                        />
                        <p className="mt-1 text-xs text-zinc-500">
                          Free home delivery in {freeDeliveryState}: {freeDeliveryAreas.join(", ")}.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Delivery Method</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod("home_delivery")}
                            className={`rounded-full px-3 py-1 text-xs border ${
                              deliveryMethod === "home_delivery"
                                ? "border-[#c9a93b] bg-[#c9a93b] text-black"
                                : "border-[#c9a93b]/40 text-[#c9a93b]"
                            }`}
                          >
                            Home Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryMethod("pickup_station")}
                            className={`rounded-full px-3 py-1 text-xs border ${
                              deliveryMethod === "pickup_station"
                                ? "border-[#c9a93b] bg-[#c9a93b] text-black"
                                : "border-[#c9a93b]/40 text-[#c9a93b]"
                            }`}
                          >
                            Pick Up
                          </button>
                        </div>
                      </div>

                      {deliveryMethod === "pickup_station" && (
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Transport Station</label>
                          <select
                            value={transportStation}
                            onChange={(e) => setTransportStation(e.target.value)}
                            required
                            className="w-full bg-transparent border border-[#c9a93b]/40 rounded-lg p-2 text-white focus:ring-1 focus:ring-[#c9a93b]"
                          >
                            <option value="">Select station</option>
                            {transportStations.map((station) => (
                              <option key={station} value={station}>
                                {station}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="rounded-lg border border-[#c9a93b]/20 bg-black/30 p-3 text-sm">
                        <div className="flex justify-between text-zinc-300">
                          <span>Cart subtotal</span>
                          <span>NGN {Number(cart.subtotal).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 flex justify-between text-zinc-300">
                          <span>Delivery fee</span>
                          <span>{deliveryFee > 0 ? `NGN ${Number(deliveryFee).toLocaleString()}` : "Free"}</span>
                        </div>
                        <div className="mt-2 flex justify-between font-semibold text-gold">
                          <span>Total payable</span>
                          <span>NGN {Number(payableTotal).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => setIsCheckout(false)}
                          className="w-1/2 bg-transparent border border-[#c9a93b]/50 text-[#c9a93b] py-2 rounded-lg hover:bg-[#c9a93b]/10 transition"
                        >
                          Back to Cart
                        </button>
                        <button
                          type="submit"
                          className="w-1/2 bg-[#c9a93b] text-black font-semibold py-2 rounded-lg hover:bg-[#b8972d] transition"
                        >
                          Confirm Order
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT: Order Summary (always visible) */}
            <div className="bg-[#111] border border-[#c9a93b]/30 p-6 md:p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-gold">Order Summary</h2>

              {cart.items.length === 0 ? (
                !token ? (
                  <p className="text-gray-400 text-sm">
                    Log in to see your order summary.
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm">Your cart is empty.</p>
                )
              ) : (
                <>
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                    {cart.items.map((item) => (
                      <div
                        key={item._id}
                        className="flex justify-between items-center border-b border-[#c9a93b]/20 pb-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product_id?.images?.[0]}
                            alt={item.product_id?.title}
                            className="w-16 h-16 rounded-lg border border-[#c9a93b]/30 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-gold">{item.product_id?.title}</p>
                            <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gold">₦{Number(item.total).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-[#c9a93b]/20 pt-4 flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-gold">₦{Number(cart.subtotal).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===== PAYMENT MODAL (Centered desktop, fullscreen mobile) ===== */}
        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              key="payment-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              {/* backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black backdrop-blur-sm"
                onClick={closeModal}
              />

              {/* Modal card: centered on md+, fullscreen on small screens */}
              <motion.div
                initial={{ y: 40, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="relative mx-4 md:mx-auto mt-8 md:mt-12 max-w-3xl bg-neutral-950 rounded-2xl shadow-2xl overflow-hidden z-50"
                style={{
                  // full-screen on mobile
                  width: "calc(100% - 2rem)",
                  maxHeight: "calc(100vh - 3rem)",
                }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* LEFT: Banks visual (md:block) */}
                  <div className="md:w-1/2 p-6 flex flex-col gap-4 items-center justify-center bg-black/40">
                    <h3 className="text-lg font-bold text-gold mb-2">Bank Transfer</h3>
                    <p className="text-sm text-gray-300 text-center">
                      Transfer the total amount to any of the bank accounts below, then upload a receipt and click "I have paid".
                    </p>

                    {/* Animated bank blocks: left / right / bottom */}
                    <div className="w-full flex flex-col gap-3 mt-4">
                      {/* Bank A (left entrance) */}
                      <motion.div
                        initial={{ x: -80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.08, duration: 0.45 }}
                        className="p-4 rounded-xl border border-gold/20 bg-neutral-900 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-sm text-gray-300">Bank</div>
                          <div className="font-semibold text-gold">{banks[0].name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">Acct</div>
                          <div className="font-mono text-sm text-white">{banks[0].accountNo}</div>
                        </div>
                      </motion.div>

                      {/* Bank B (right entrance) */}
                      <motion.div
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.16, duration: 0.45 }}
                        className="p-4 rounded-xl border border-gold/20 bg-neutral-900 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-sm text-gray-300">Bank</div>
                          <div className="font-semibold text-gold">{banks[1].name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">Acct</div>
                          <div className="font-mono text-sm text-white">{banks[1].accountNo}</div>
                        </div>
                      </motion.div>

                      {/* Bank C (bottom entrance) */}
                      <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.24, duration: 0.45 }}
                        className="p-4 rounded-xl border border-gold/20 bg-neutral-900 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-sm text-gray-300">Bank</div>
                          <div className="font-semibold text-gold">{banks[2].name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-300">Acct</div>
                          <div className="font-mono text-sm text-white">{banks[2].accountNo}</div>
                        </div>
                      </motion.div>
                    </div>

                    {/* small note */}
                    <p className="text-xs text-gray-400 mt-4 text-center">
                      Use any of the accounts above. Keep the transfer screenshot handy for verification.
                    </p>
                  </div>

                  {/* RIGHT: Receipt upload + actions */}
                  <div className="md:w-1/2 p-6 bg-neutral-950">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gold">Confirm Payment</h3>
                        <p className="text-sm text-gray-300">Upload your bank transfer receipt (JPG/PNG only).</p>
                      </div>
                      <button
                        onClick={closeModal}
                        className="text-gray-400 hover:text-white ml-2"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm text-gray-300 mb-2">Upload Receipt</label>

                      <div className="flex flex-col gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={onReceiptInput}
                          className="block w-full text-sm text-gray-400 file:bg-gold file:border-0 file:text-black file:px-4 file:py-2 rounded"
                        />

                        {receiptPreview ? (
                          <div className="relative border border-[#c9a93b]/20 rounded p-2">
                            <img src={receiptPreview} alt="receipt preview" className="w-full h-48 object-contain rounded" />
                            <div className="flex gap-2 mt-2">
                              <button onClick={removeReceipt} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Remove</button>
                              <a href={receiptPreview} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-gold text-black text-sm">Open</a>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-[#c9a93b]/20 rounded p-4 text-center text-gray-400">
                            No receipt uploaded yet.
                          </div>
                        )}

                        <div className="flex gap-3 mt-2 items-center">
                          <button
                            onClick={handleIHavePaid}
                            disabled={uploadingReceipt}
                            className="flex-1 bg-gold text-black px-4 py-2 rounded-full font-semibold hover:opacity-90 transition disabled:opacity-60"
                          >
                            {uploadingReceipt ? "Submitting..." : "I Have Paid"}
                          </button>

                          <button
                            onClick={() => {
                              // open bank account copy actions (copy first bank's acct)
                              navigator.clipboard?.writeText(`${banks[0].accountNo}`).then(() => {
                                toast.success("Account number copied to clipboard");
                              }).catch(() => { });
                            }}
                            className="px-4 py-2 rounded-full border border-gold text-gold hover:bg-gold hover:text-black transition"
                          >
                            Copy Account
                          </button>
                        </div>

                        {/* small help / note */}
                        <p className="text-xs text-gray-400 mt-2">
                          After we receive your payment (and receipt if uploaded), admin will verify and update order status.
                        </p>
                      </div>
                    </div>

                    {/* Transaction summary (mobile-friendly) */}
                    <div className="mt-6 border-t border-[#c9a93b]/20 pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-400">Order total (with delivery)</div>
                          <div className="text-lg font-bold text-gold">NGN {Number(payableTotal).toLocaleString()}</div>
                        </div>
                        <div className="text-right text-sm text-gray-300">
                          <div>Items: {cart.items.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal bottom area for mobile spacing */}
                <div className="block md:hidden p-4 bg-neutral-950 text-center">
                  <button onClick={closeModal} className="text-sm text-gray-400">Close</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}

