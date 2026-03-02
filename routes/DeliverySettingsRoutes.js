const express = require("express");
const router = express.Router();
const authenticateMerchant = require("../middleware/Auth");
const {
  getPublicDeliverySettings,
  getAdminDeliverySettings,
  updateAdminDeliverySettings,
} = require("../controllers/DeliverySettingsController");

router.get("/api/delivery-settings", getPublicDeliverySettings);
router.get(
  "/api/admin/delivery-settings",
  authenticateMerchant,
  getAdminDeliverySettings
);
router.put(
  "/api/admin/delivery-settings",
  authenticateMerchant,
  updateAdminDeliverySettings
);

module.exports = router;
