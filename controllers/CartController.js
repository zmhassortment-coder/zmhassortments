const Cart = require("../models/CartModel");
const Product = require("../models/ProductModel");

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      product_id,
      quantity = 1,
      selected_option = "",
      selected_colour = "",
      selected_image = "",
    } = req.body;
    const normalizedQty = Number(quantity);

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    const price = parseFloat(product.price) || 0;
    const productStock = Number(product.quantity);
    const minQty = Math.max(1, Number(product.min_qty) || 1);
    const requiresAvailabilityConfirmation =
      product.confirm_availability_before_payment === true;

    let cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      cart = new Cart({ user_id: userId, items: [], subtotal: 0 });
    }

    if (normalizedQty < minQty) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for this product is ${minQty}`,
      });
    }

    const existingItem = cart.items.find((item) =>
      item.product_id.toString() === product_id &&
      String(item.selected_option || "") === String(selected_option || "") &&
      String(item.selected_colour || "") === String(selected_colour || "") &&
      String(item.selected_image || "") === String(selected_image || "")
    );

    if (existingItem) {
      const nextQty = existingItem.quantity + normalizedQty;
      if (
        !requiresAvailabilityConfirmation &&
        Number.isFinite(productStock) &&
        productStock >= 0 &&
        nextQty > productStock
      ) {
        return res.status(400).json({
          success: false,
          message: `Only ${productStock} in stock`,
        });
      }

      existingItem.quantity = nextQty;
      existingItem.total = existingItem.quantity * price;
      if (requiresAvailabilityConfirmation) {
        existingItem.availability_confirmed = false;
        existingItem.availability_confirmed_at = undefined;
      }
    } else {
      if (
        !requiresAvailabilityConfirmation &&
        Number.isFinite(productStock) &&
        productStock >= 0 &&
        normalizedQty > productStock
      ) {
        return res.status(400).json({
          success: false,
          message: `Only ${productStock} in stock`,
        });
      }

      cart.items.push({
        product_id,
        quantity: normalizedQty,
        price,
        total: price * normalizedQty,
        selected_option: selected_option || "",
        selected_colour: selected_colour || "",
        selected_image: selected_image || "",
        min_qty: minQty,
        availability_confirmed: !requiresAvailabilityConfirmation,
        availability_confirmed_at: !requiresAvailabilityConfirmation ? new Date() : undefined,
      });
    }

    cart.subtotal = cart.items.reduce((sum, i) => sum + i.total, 0);
    await cart.save();

    return res.status(200).json({ success: true, message: "Product added to cart", data: cart });
  } catch (err) {
    console.error("addToCart error:", err);
    return res.status(500).json({ success: false, message: "Error adding to cart", error: err.message });
  }
};

// Get cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user_id: userId }).populate("items.product_id");

    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [], subtotal: 0 } });
    }

    return res.status(200).json({ success: true, data: cart });
  } catch (err) {
    console.error("getCart error:", err);
    return res.status(500).json({ success: false, message: "Error fetching cart", error: err.message });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity } = req.body;
    const normalizedQty = Number(quantity);

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    const product = await Product.findById(item.product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const productStock = Number(product.quantity);
    const minQty = Math.max(1, Number(product.min_qty) || Number(item.min_qty) || 1);
    const requiresAvailabilityConfirmation =
      product.confirm_availability_before_payment === true;

    if (normalizedQty < minQty) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for this product is ${minQty}`,
      });
    }

    if (
      !requiresAvailabilityConfirmation &&
      Number.isFinite(productStock) &&
      productStock >= 0 &&
      normalizedQty > productStock
    ) {
      return res.status(400).json({
        success: false,
        message: `Only ${productStock} in stock`,
      });
    }

    item.quantity = normalizedQty;
    item.total = item.price * item.quantity;
    item.min_qty = minQty;
    if (requiresAvailabilityConfirmation) {
      item.availability_confirmed = false;
      item.availability_confirmed_at = undefined;
    }

    cart.subtotal = cart.items.reduce((sum, i) => sum + i.total, 0);
    await cart.save();

    return res.status(200).json({ success: true, message: "Cart updated", data: cart });
  } catch (err) {
    console.error("updateCartItem error:", err);
    return res.status(500).json({ success: false, message: "Error updating cart", error: err.message });
  }
};

// Confirm availability for a cart item (after user confirms via WhatsApp)
exports.confirmAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    const cart = await Cart.findOne({ user_id: userId }).populate("items.product_id");
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const requiresAvailabilityConfirmation =
      item?.product_id?.confirm_availability_before_payment === true;

    if (!requiresAvailabilityConfirmation) {
      item.availability_confirmed = true;
      item.availability_confirmed_at = new Date();
      await cart.save();
      return res.status(200).json({
        success: true,
        message: "Availability confirmation is not required for this product",
        data: cart,
      });
    }

    item.availability_confirmed = true;
    item.availability_confirmed_at = new Date();
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Availability confirmed",
      data: cart,
    });
  } catch (err) {
    console.error("confirmAvailability error:", err);
    return res.status(500).json({
      success: false,
      message: "Error confirming availability",
      error: err.message,
    });
  }
};

// Remove item
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.total, 0);
    await cart.save();

    return res.status(200).json({ success: true, message: "Item removed", data: cart });
  } catch (err) {
    console.error("removeFromCart error:", err);
    return res.status(500).json({ success: false, message: "Error removing item", error: err.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user_id: userId });

    if (!cart)
      return res.status(200).json({
        success: true,
        message: "Cart already empty",
        data: { items: [], subtotal: 0 },
      });

    cart.items = [];
    cart.subtotal = 0;
    await cart.save();

    return res.status(200).json({ success: true, message: "Cart cleared", data: cart });
  } catch (err) {
    console.error("clearCart error:", err);
    return res.status(500).json({ success: false, message: "Error clearing cart", error: err.message });
  }
};
