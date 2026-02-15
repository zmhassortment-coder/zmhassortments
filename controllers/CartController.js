const Cart = require("../models/CartModel");
const Product = require("../models/ProductModel");

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1 } = req.body;

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const price = parseFloat(product.price) || 0; // ✅ handles both string & number

    let cart = await Cart.findOne({ user_id: userId });

    if (!cart) {
      cart = new Cart({ user_id: userId, items: [], subtotal: 0 });
    }

    const existingItem = cart.items.find(
      (item) => item.product_id.toString() === product_id
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
      existingItem.total = existingItem.quantity * price;
    } else {
      cart.items.push({
        product_id,
        quantity: Number(quantity),
        price,
        total: price * Number(quantity),
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

    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    item.quantity = Number(quantity);
    item.total = item.price * item.quantity;

    cart.subtotal = cart.items.reduce((sum, i) => sum + i.total, 0);
    await cart.save();

    return res.status(200).json({ success: true, message: "Cart updated", data: cart });
  } catch (err) {
    console.error("updateCartItem error:", err);
    return res.status(500).json({ success: false, message: "Error updating cart", error: err.message });
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
