const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/UserAuth");
const authenticateMerchant = require("../middleware/Auth");
const {
  getUserNotifications,
  markUserNotificationRead,
  getAdminNotifications,
  markAdminNotificationRead,
} = require("../controllers/NotificationController");

router.get("/api/notifications", authenticateUser, getUserNotifications);
router.put("/api/notifications/:id/read", authenticateUser, markUserNotificationRead);

router.get("/api/admin/notifications", authenticateMerchant, getAdminNotifications);
router.put("/api/admin/notifications/:id/read", authenticateMerchant, markAdminNotificationRead);

module.exports = router;
