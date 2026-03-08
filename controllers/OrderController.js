const Order = require("../models/OrderModel");
const Product = require("../models/ProductModel");
const Cart = require("../models/CartModel");
const Notification = require("../models/NotificationModel");

const STATUS_ALIASES = {
  pending: "pending",
  process: "processing",
  processing: "processing",
  paid: "paid",
  payed: "paid",
  shipped: "shipped",
  shipping: "shipped",
  at_station: "at_station",
  atstation: "at_station",
  rider_assigned: "rider_assigned",
  riderassigned: "rider_assigned",
  ready_for_pickup: "ready_for_pickup",
  readyforpickup: "ready_for_pickup",
  delivered: "delivered",
  cancelled: "cancelled",
  canceled: "cancelled",
};

const STOCK_CONFIRMED_STATUSES = new Set([
  "processing",
  "paid",
  "shipped",
  "at_station",
  "rider_assigned",
  "ready_for_pickup",
  "delivered",
]);

const normalizeStatus = (value) => {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return STATUS_ALIASES[key] || null;
};

const STATUS_LABELS = {
  pending: "Verifying Payment",
  processing: "Processing",
  paid: "Paid",
  shipped: "Out For Shipping",
  at_station: "Arrived At Station",
  rider_assigned: "Rider Assigned",
  ready_for_pickup: "Ready For Pickup",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const parseItems = (rawItems) => {
  if (Array.isArray(rawItems)) return rawItems;
  if (typeof rawItems === "string") {
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

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

    const parsedItems = parseItems(items);
    if (!parsedItems || parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    const normalizedItems = [];
    const userCart = await Cart.findOne({ user_id: req.user._id });
    const cartItemsByProductId = new Map(
      (userCart?.items || []).map((ci) => [String(ci.product_id), ci])
    );

    for (const item of parsedItems) {
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

    // Enforce availability confirmation before checkout for products marked as required.
    for (const item of normalizedItems) {
      const product = await Product.findById(item.product_id).select(
        "_id title confirm_availability_before_payment"
      );
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found for ${item.title}`,
        });
      }

      if (product.confirm_availability_before_payment === true) {
        const cartItem = cartItemsByProductId.get(String(item.product_id));
        if (!cartItem || cartItem.availability_confirmed !== true) {
          return res.status(400).json({
            success: false,
            message: `Please confirm availability on WhatsApp for ${product.title} before checkout`,
          });
        }
      }
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
    const receiptUrl = req.file?.path || req.body?.receipt_url || "";
    const initialStatus =
      String(payment_method || "").toLowerCase() === "bank_transfer"
        ? "processing"
        : "pending";

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
      receipt_url: receiptUrl || undefined,
      status: initialStatus,
    }).save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });

    // Fire and forget notifications
    Notification.create({
      recipient_role: "admin",
      type: "order_created",
      title: "New Order Created",
      message: `A new order (${order._id}) was created by a customer.`,
      order_id: order._id,
    }).catch(() => {});

    if (String(payment_method || "").toLowerCase() === "bank_transfer") {
      Notification.create({
        recipient_role: "admin",
        type: "payment_submitted",
        title: "Payment Submitted",
        message: `Customer submitted payment for order (${order._id}).`,
        order_id: order._id,
      }).catch(() => {});
    }
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
    const status = normalizeStatus(req.body?.status);
    const allowed = [
      "pending",
      "processing",
      "paid",
      "shipped",
      "at_station",
      "rider_assigned",
      "ready_for_pickup",
      "delivered",
      "cancelled",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Allowed: pending, processing, paid, shipped, at_station, rider_assigned, ready_for_pickup, delivered, cancelled",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const stockWarnings = [];
    if (STOCK_CONFIRMED_STATUSES.has(status) && !order.stock_deducted) {
      const productIds = order.items.map((item) => item.product_id);
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map((p) => [String(p._id), p]));

      for (const item of order.items) {
        const product = productMap.get(String(item.product_id));
        if (!product) {
          stockWarnings.push(`Product ${item.product_id} no longer exists`);
          continue;
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
          stockWarnings.push(`Insufficient stock for ${product.title}; stock deduction skipped for this item`);
        }
      }

      for (const item of order.items) {
        const product = productMap.get(String(item.product_id));
        if (!product) continue;
        const requiresAvailabilityConfirmation =
          product.confirm_availability_before_payment === true;
        const currentStock = Number(product.quantity);
        if (!Number.isFinite(currentStock) || currentStock < 0) {
          continue;
        }
        if (
          !requiresAvailabilityConfirmation &&
          currentStock < Number(item.quantity)
        ) {
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
      warnings: stockWarnings,
    });

    Notification.create({
      recipient_role: "user",
      recipient_id: order.user_id?._id || order.user_id,
      type: "order_status_updated",
      title: "Order Status Updated",
      message: `Your order (${order._id}) is now ${STATUS_LABELS[status] || status}.`,
      order_id: order._id,
    }).catch(() => {});
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
