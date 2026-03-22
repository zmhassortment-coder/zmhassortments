const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: false,
    },
    selected_option: {
      type: String,
      required: false,
    },
    selected_colour: {
      type: String,
      required: false,
    },
    selected_image: {
      type: String,
      required: false,
    },
    currency: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: false,
    },
    delivery_fee: {
      type: Number,
      required: false,
      default: 0,
    },
    delivery_method: {
      type: String,
      enum: ["home_delivery", "pickup_station"],
      required: false,
    },
    delivery_state: {
      type: String,
      required: false,
    },
    delivery_area: {
      type: String,
      required: false,
    },
    transport_station: {
      type: String,
      required: false,
    },
    stock_deducted: {
      type: Boolean,
      required: false,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "shipped",
        "at_station",
        "rider_assigned",
        "ready_for_pickup",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    receipt_url: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    payment_method: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
