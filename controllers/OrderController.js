const Order = require("../models/OrderModel");

const createOrder = async (req, res) => {
  try {
    const { items, address, payment_method, notes } = req.body;
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

    const orderTotal = normalizedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const order = await new Order({
      user_id: req.user._id,
      items: normalizedItems,
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

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("user_id", "fullName email phoneNumber");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

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
