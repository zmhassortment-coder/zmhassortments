const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient_role: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
