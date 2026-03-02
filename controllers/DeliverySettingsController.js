const DeliverySettings = require("../models/DeliverySettingsModel");

const SETTINGS_KEY = "default";

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const getOrCreateSettings = async () => {
  let settings = await DeliverySettings.findOne({ key: SETTINGS_KEY });

  if (!settings) {
    settings = await new DeliverySettings({ key: SETTINGS_KEY }).save();
  }

  return settings;
};

const getPublicDeliverySettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({
      success: true,
      message: "Delivery settings",
      data: settings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery settings",
      error: err.message,
    });
  }
};

const getAdminDeliverySettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({
      success: true,
      message: "Delivery settings",
      data: settings,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery settings",
      error: err.message,
    });
  }
};

const updateAdminDeliverySettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    if (req.body.free_delivery_state !== undefined) {
      settings.free_delivery_state = String(req.body.free_delivery_state || "").trim();
    }

    if (req.body.free_delivery_areas !== undefined) {
      settings.free_delivery_areas = toStringArray(req.body.free_delivery_areas);
    }

    if (req.body.transport_stations !== undefined) {
      settings.transport_stations = toStringArray(req.body.transport_stations);
    }

    if (req.body.home_delivery_fee !== undefined) {
      const fee = Number(req.body.home_delivery_fee);
      if (!Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({
          success: false,
          message: "home_delivery_fee must be a non-negative number",
        });
      }
      settings.home_delivery_fee = fee;
    }

    const updated = await settings.save();

    return res.status(200).json({
      success: true,
      message: "Delivery settings updated",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update delivery settings",
      error: err.message,
    });
  }
};

module.exports = {
  getPublicDeliverySettings,
  getAdminDeliverySettings,
  updateAdminDeliverySettings,
};
