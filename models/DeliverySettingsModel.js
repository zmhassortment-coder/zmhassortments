const mongoose = require("mongoose");

const deliverySettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },
    free_delivery_state: {
      type: String,
      required: false,
      default: "Lagos",
      trim: true,
    },
    free_delivery_areas: {
      type: [String],
      required: false,
      default: ["Ikeja", "Yaba", "Lekki Phase 1"],
    },
    home_delivery_fee: {
      type: Number,
      required: false,
      default: 3000,
      min: 0,
    },
    transport_stations: {
      type: [String],
      required: false,
      default: ["Ojota", "Berger", "Jibowu"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliverySettings", deliverySettingsSchema);
