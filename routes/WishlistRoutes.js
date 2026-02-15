const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateuser = require('../middleware/UserAuth');

const {
  CreateWishlist,
  deleteWishlist,
  getAllWishlist,
} = require("../controllers/WishlistController");

router.post(
  "/api/wishlist/:user_id/:product_id",
  authenticateuser,
  CreateWishlist
);
router.get("/api/wishlist", authenticateuser, getAllWishlist);
router.delete("/api/wishlist/:id", authenticateuser, deleteWishlist);

module.exports = router;
