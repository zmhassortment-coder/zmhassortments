import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { addToCart } from "../api/cartApi";
import { getCookie } from "../api/client";
import { addToWishlist, getWishlist } from "../api/wishlistApi";

export default function ProductModal({ product, onClose }) {
  const navigate = useNavigate();
  const token = getCookie("token");
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [wishloading, setWishloading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);
  const stockQty = Number(product?.quantity);
  const hasStock = Number.isFinite(stockQty) && stockQty > 0;
  const requiresAvailabilityConfirmation =
    product?.confirm_availability_before_payment === true;
  const showExactStock = product?.show_stock_quantity !== false;
  const shouldShowLowStockAlert = hasStock && stockQty <= 10;

  useEffect(() => {
    if (!token || !product?._id) return;
    const checkWishlist = async () => {
      try {
        setCheckingWishlist(true);
        const items = await getWishlist();
        const found = Array.isArray(items)
          ? items.some((it) => {
              const p = it.product || it.product_id || it;
              return p?._id === product._id;
            })
          : false;
        setWishlisted(found);
      } catch (err) {
        // ignore
      } finally {
        setCheckingWishlist(false);
      }
    };
    checkWishlist();
  }, [token, product?._id]);

  const handleAddToCart = async () => {
    if (!hasStock) return;
    if (!token) {
      toast.error("Please log in to add items to your cart.");
      return;
    }
    try {
      setAddingToCart(true);
      const payload = {
        product_id: product._id,
        quantity,
      };

      const data = await addToCart(payload);

      if (data?.success) {
        toast.success("Added to cart.");
        navigate("/cart");
      } else {
        toast.error(data?.message || "Failed to add to cart.");
      }
    } catch (err) {
      console.error("addToCart error:", err);
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!token) {
      toast.error("Please log in to add to wishlist.");
      return;
    }
    if (wishlisted) {
      toast.info("This item is already in your wishlist.");
      return;
    }
    try {
      setWishloading(true);
      const data = await addToWishlist(product._id);
      if (data?.success === false) {
        toast.error(data?.message || "Failed to add to wishlist.");
      } else {
        setWishlisted(true);
        toast.success("Added to wishlist.");
      }
    } catch (err) {
      console.error("wishlist error:", err);
      toast.error("Failed to add to wishlist.");
    } finally {
      setWishloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <ToastContainer />
      <div className="bg-neutral-950 rounded-2xl shadow-lg max-w-5xl w-full relative overflow-hidden transform scale-95 opacity-0 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gold hover:text-white text-2xl z-10"
        >
          x
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image Slider */}
          <div className="md:w-1/2 w-full">
            <Swiper
              modules={[Navigation]}
              navigation
              loop={(product.images?.length || 0) > 1}
              className="w-full h-80 md:h-full"
            >
              {product.images?.map((img, i) => (
                <SwiperSlide key={i}>
                  <img
                    src={img}
                    alt={`${product.title}-${i}`}
                    className="w-full h-80 md:h-full object-cover"
                  />
                </SwiperSlide>
              ))}

            </Swiper>
          </div>

          {/* Product Details */}
          <div className="md:w-1/2 w-full p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gold">{product.title}</h2>
              <button
                onClick={handleWishlist}
                disabled={wishloading || checkingWishlist}
                className="mt-2 inline-flex items-center gap-2 text-sm"
                aria-label="Add to wishlist"
                title="Add to wishlist"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-6 w-6 transition ${
                    wishlisted ? "text-red-500" : "text-gray-300 hover:text-red-400"
                  }`}
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className={wishlisted ? "text-red-400" : "text-gray-300"}>
                  {wishlisted ? "Wishlisted" : "Add to wishlist"}
                </span>
              </button>
              {product.descp && (
                <p className="text-white mt-4">{product.descp}</p>
              )}

              <div className="mt-4 space-y-2 text-white text-sm">
                {product.brand && (
                  <p>
                    <span className="font-semibold text-gold">Brand:</span>{" "}
                    {product.brand}
                  </p>
                )}
                {product.category_id && (
                  <p>
                    <span className="font-semibold text-gold">Category ID:</span>{" "}
                    {product.category_id}
                  </p>
                )}
                {showExactStock ? (
                  <p>
                    <span className="font-semibold text-gold">Stock:</span>{" "}
                    {hasStock ? `${stockQty} available` : "Out of stock"}
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold text-gold">Stock:</span>{" "}
                    {hasStock ? "Available" : "Out of stock"}
                  </p>
                )}

                {requiresAvailabilityConfirmation && (
                  <p className="rounded-md border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-amber-200">
                    Availability for this product is confirmed before payment.
                  </p>
                )}

                {shouldShowLowStockAlert && (
                  <p className="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-red-200">
                    Low stock alert: only {stockQty} left.
                  </p>
                )}

                {/* Options */}
                {product.Productoption?.length > 0 && (
                  <p>
                    <span className="font-semibold text-gold">Options:</span>{" "}
                    {product.Productoption.join(", ")}
                  </p>
                )}

                {/* Colours */}
                {product.colours?.length > 0 && (
                  <p>
                    <span className="font-semibold text-gold">Colours:</span>{" "}
                    {product.colours.join(", ")}
                  </p>
                )}

                {/* Discount */}
                {product.discount && (
                  <p>
                    <span className="font-semibold text-gold">Discount:</span>{" "}
                    {product.discount}%
                  </p>
                )}

                {/* Shipping */}
                {product.shipping_locations && (
                  <p>
                    <span className="font-semibold text-gold">Ships To:</span>{" "}
                    {product.shipping_locations}
                  </p>
                )}
              </div>

              <p className="text-gold text-2xl font-semibold mt-6">
                {product.currency} {product.price}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-9 w-9 rounded-full border border-[#c9a93b]/40 text-gold hover:bg-[#c9a93b]/20 disabled:opacity-50"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="text-white min-w-[24px] text-center">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity((q) => {
                    const maxQty =
                      hasStock && !requiresAvailabilityConfirmation
                        ? stockQty
                        : q + 1;
                    return Math.min(maxQty, q + 1);
                  })
                }
                disabled={
                  hasStock &&
                  !requiresAvailabilityConfirmation &&
                  quantity >= stockQty
                }
                className="h-9 w-9 rounded-full border border-[#c9a93b]/40 text-gold hover:bg-[#c9a93b]/20 disabled:opacity-50"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!hasStock || addingToCart}
              className={`mt-6 px-6 py-3 rounded-full font-semibold transition ${hasStock
                  ? "bg-gold text-black hover:bg-white hover:text-black"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
                }`}
            >
              {hasStock
                ? addingToCart
                  ? "Adding..."
                  : "Add to Cart"
                : "Out of Stock"}
            </button>
          </div>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease forwards;
        }
        @keyframes fadeIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        :global(.swiper-button-next),
        :global(.swiper-button-prev) {
          color: #d4af37;
        }
      `}</style>
    </div>
  );
}

