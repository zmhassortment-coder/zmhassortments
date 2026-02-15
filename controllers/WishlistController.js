const Wishlist = require("../models/WishlistModel")
const users = require("../models/UserModel")
const product = require("../models/ProductModel")
const CreateWishlist = async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const product_id = req.params.product_id;
    const authUserId = req.user?._id?.toString();
    const effectiveUserId = authUserId;

    if (!authUserId) {
      return res.status(401).json({
        success: false,
        message: "User not logged in",
      });
    }
    const check_user = await users.findById(effectiveUserId);
    if (!check_user) {
      return res.status(404).json({
        success: false,
        message: "User id does not exist",
      });
    }
    const check_product = await product.findById(product_id);
    if (!check_product) {
      return res.status(404).json({
        success: false,
        message: "Product does not exist",
      });
    }
    const existing = await Wishlist.findOne({ user_id: effectiveUserId, product_id });
    if (existing) {
      return res.json({
        success: true,
        message: "Product already in wishlist",
        data: existing,
      });
    }

    const savedWishlist = await new Wishlist({ user_id: effectiveUserId, product_id }).save();
    res.json({
      success: true,
      message: "Wishlist created Successfully",
      data: savedWishlist
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create Wishlist",
      error: err.message,
    })
  }
};

const getAllWishlist = (req, res) => {
  const authUserId = req.user?._id?.toString();

  if (!authUserId) {
    return res.status(401).json({
      success: false,
      message: "User not logged in",
    });
  }
  Wishlist.find({ user_id: authUserId }, {})
    .then(async (resp) => {
      const productIds = resp
        .map((item) => item.product_id)
        .filter(Boolean);

      const products = await product.find({ _id: { $in: productIds } });
      const productMap = new Map(
        products.map((p) => [p._id.toString(), p])
      );

      const merged = resp.map((item) => {
        const pid = item.product_id?.toString();
        return {
          ...item.toObject(),
          product: pid ? productMap.get(pid) || null : null,
        };
      });

      res.json({
        success: true,
        message: "All Wishlist",
        data: merged,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch Wishlist",
        error: err.massage,
      });
    });
};

const deleteWishlist = (req, res) => {
  const authUserId = req.user?._id?.toString();

  if (!authUserId) {
    return res.status(401).json({
      success: false,
      message: "User not logged in",
    });
  }
  const id = req.params.id;
  Wishlist.findOneAndDelete({ _id: id, user_id: authUserId })
    .then((deleted) => {
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Wishlist item not found",
        });
      }
      res.json({
        success: true,
        message: "Wishlist Deleted Successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Delete Wishlist",
        error: err.massage,
      });
    });
};

module.exports = {
  CreateWishlist,
  getAllWishlist,
  deleteWishlist
}; 
