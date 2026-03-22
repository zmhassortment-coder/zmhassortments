const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
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
      min_qty: {
        type: Number,
        required: false,
        default: 1,
      },
      availability_confirmed: {
        type: Boolean,
        default: false,
      },
      availability_confirmed_at: {
        type: Date,
      },
    },
  ],
  subtotal: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
