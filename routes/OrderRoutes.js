const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/UserAuth");
const authenticateMerchant = require("../middleware/Auth");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/OrderController");

router.post("/api/orders", authenticateUser, createOrder);
router.get("/api/orders", authenticateUser, getMyOrders);
router.get("/api/orders/:id", authenticateUser, getOrderById);
router.get("/api/admin/orders", authenticateMerchant, getAllOrders);
router.put("/api/admin/orders/:id/status", authenticateMerchant, updateOrderStatus);

module.exports = router;
