const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/CartController.js");
const authenticateUser = require('../middleware/UserAuth');



router.post("/add", authenticateUser, addToCart);
router.get("/", authenticateUser, getCart);
router.put("/update", authenticateUser, updateCartItem);
router.delete("/remove/:itemId", authenticateUser, removeFromCart);
router.delete("/clear", authenticateUser, clearCart);

module.exports = router;
