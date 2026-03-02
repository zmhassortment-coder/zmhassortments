const Order = require("../models/OrderModel");
const Product = require("../models/ProductModel");

const createOrder = async (req, res) => {
  try {
    const {
      items,
      address,
      payment_method,
      notes,
      delivery_fee = 0,
      delivery_method,
      delivery_state,
      delivery_area,
      transport_station,
    } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    const normalizedItems = [];
    for (const item of items) {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      if (
        !item.product_id ||
        !item.title ||
        Number.isNaN(price) ||
        Number.isNaN(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Each item must include product_id, title, price, quantity",
        });
      }
      const total = price * quantity;
      normalizedItems.push({
        product_id: item.product_id,
        title: item.title,
        price,
        quantity,
        total,
        image: item.image || null,
        currency: item.currency || null,
      });
    }

    const itemsSubtotal = normalizedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const normalizedDeliveryFee = Number(delivery_fee);
    const safeDeliveryFee =
      Number.isFinite(normalizedDeliveryFee) && normalizedDeliveryFee > 0
        ? normalizedDeliveryFee
        : 0;
    const orderTotal = itemsSubtotal + safeDeliveryFee;

    const order = await new Order({
      user_id: req.user._id,
      items: normalizedItems,
      subtotal: itemsSubtotal,
      delivery_fee: safeDeliveryFee,
      delivery_method,
      delivery_state,
      delivery_area,
      transport_station,
      total: orderTotal,
      address,
      payment_method,
      notes,
    }).save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: err.message,
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({
      success: true,
      message: "My orders",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id, user_id: req.user._id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    res.json({
      success: true,
      message: "Order",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: err.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user_id", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "All orders",
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["pending", "paid", "shipped", "delivered", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (status === "paid" && !order.stock_deducted) {
      const productIds = order.items.map((item) => item.product_id);
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map((p) => [String(p._id), p]));

      for (const item of order.items) {
        const product = productMap.get(String(item.product_id));
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product ${item.product_id} no longer exists`,
          });
        }

        const requiresAvailabilityConfirmation =
          product.confirm_availability_before_payment === true;
        const currentStock = Number(product.quantity);

        if (
          !requiresAvailabilityConfirmation &&
          Number.isFinite(currentStock) &&
          currentStock >= 0 &&
          currentStock < Number(item.quantity)
        ) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.title}`,
          });
        }
      }

      for (const item of order.items) {
        const product = productMap.get(String(item.product_id));
        const currentStock = Number(product.quantity);
        if (!Number.isFinite(currentStock) || currentStock < 0) {
          continue;
        }

        const nextStock = Math.max(0, currentStock - Number(item.quantity));
        product.quantity = String(nextStock);
        await product.save();
      }

      order.stock_deducted = true;
    }

    order.status = status;
    await order.save();
    await order.populate("user_id", "fullName email phoneNumber");

    res.json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: err.message,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};
