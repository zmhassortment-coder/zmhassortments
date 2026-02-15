const Product = require("../models/ProductModel");
const Merchant = require("../models/MerchantModel");
const Category = require("../models/CategoryModel");

const CreateProduct = async (req, res) => {
  try {
    const merchantId = (req.merchant && req.merchant._id) || req.params.merchant_id;
    const categoryId = req.params.category_id || req.body.category_id;

    if (!merchantId || !categoryId) {
      return res.status(400).json({ error: "merchant_id and category_id are required" });
    }

    const checkIfMerchant = await Merchant.findById(merchantId);
    const checkIfCategoryExists = await Category.findById(categoryId);

    if (!checkIfMerchant || !checkIfCategoryExists) {
      return res.status(400).json({ error: 'Invalid merchant or category' });
    }

    // Handle multiple images
    let imagesPaths = [];
    if (req.files && req.files.length > 0) {
      imagesPaths = req.files.map((file) => file.path);
    }

    const normalizedType =
      req.body.product_type === "interior" ? "interior" : "shop";

    const newProduct = new Product({
      merchant_id: checkIfMerchant._id,
      category_id: checkIfCategoryExists._id,
      title: req.body.title,
      descp: req.body.descp,
      images: imagesPaths, // <-- array of image paths
      price: req.body.price,
      currency: req.body.currency,
      brand: req.body.brand,
      quantity: req.body.quantity,
      min_qty: req.body.min_qty,
      max_qty: req.body.max_qty,
      discount: req.body.discount,
      shipping_locations: req.body.shipping_locations,
      product_type: normalizedType,
    });

    const savedProduct = await newProduct.save();

    res.json({
      success: true,
      message: "Product Created Successfully",
      data: savedProduct,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to Create Product",
      error: err.message,
    });
  }
};


const GetAllproduct = async (req, res) => {
  try {
    const { category, brand, colour, minPrice, maxPrice, trending, featured, product_type } = req.query;

    let filter = {};

    if (category) filter.category_id = category;
    if (brand) filter.brand = { $regex: new RegExp(brand, "i") }; // case-insensitive
    if (colour) filter.colours = { $regex: new RegExp(colour, "i") };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (trending === "true") filter.is_trending = true;
    if (featured === "true") filter.is_featured = true;
    if (product_type && ["shop", "interior"].includes(product_type)) {
      filter.product_type = product_type;
    }

    const resp = await Product.find(filter);

    return res.json({
      success: true,
      message: "Filtered Products",
      data: resp,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to Fetch Products",
      error: err.message,
    });
  }
};

const GetSingleproduct = async (req, res) => {
  try {
    const id = req.params.id;
    const resp = await Product.findById(id);

    if (!resp) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product Found",
      data: resp,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Fetch Single Product",
      error: err.message,
    });
  }
};

const updateproduct = async (req, res) => {
  try {
    const id = req.params.id;

    // Find existing product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // --- Handle Remove Images ---
    if (req.body.removeImages) {
      let toRemove = [];
      if (Array.isArray(req.body.removeImages)) {
        toRemove = req.body.removeImages;
      } else {
        toRemove = req.body.removeImages.split(",").map((v) => v.trim());
      }
      // Filter out removed images
      product.images = product.images.filter(
        (img) => !toRemove.includes(img)
      );
    }

    // --- Handle New Images Upload ---
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      product.images = [...product.images, ...newImages];
    }

    // --- Replace Entire Images Array (if sent) ---
    if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        product.images = req.body.images;
      } else {
        product.images = req.body.images.split(",").map((v) => v.trim());
      }
    }

    // --- Update only provided fields ---
    Object.keys(req.body).forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        if (["Productoption", "colours", "shipping_locations"].includes(field)) {
          product[field] = Array.isArray(req.body[field])
            ? req.body[field]
            : req.body[field]
                .split(",")
                .map((v) => v.trim())
                .filter((v) => v.length > 0);
        } else if (["is_trending", "is_featured"].includes(field)) {
          product[field] =
            req.body[field] === "true" || req.body[field] === true;
        } else if (!["images", "removeImages"].includes(field)) {
          // avoid overwriting images handling
          product[field] = req.body[field];
        }
      }
    });

    // Save updates
    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: err.message,
    });
  }
};

const TrendingProduct = async (req, res) => {
  try {
    const Merchantid = req.params.id;
    const productid = req.params.productid;
    // Check if the merchant exists
    const check_merchant = await Merchant.findById(Merchantid);
    if (!check_merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
  
    if (check_merchant.is_verified !== true) { 
      return res.status(403).json({
        success: false,
        message: "Merchant not authorized",
      });
    }

  
    // Update the product's trending status
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      { is_trending: true },
      { new: true } 
    );
  
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  
    // Success response
    return res.status(200).json({
      success: true,
      message: "Product added to trending successfully",
      product: updatedProduct,
    });
  } catch (err) {
    // Catch and json error details
    return res.status(500).json({
      success: false,
      message: `An error has occurred: ${err.message}`,
    });
  }
  
  
};

const featuredProduct = async (req, res) => {
  try {
    const Merchantid = req.params.id;
    const productid = req.params.productid;
  
    // Check if the merchant exists
    const check_merchant = await Merchant.findById(Merchantid);
    if (!check_merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
  
    // Check if the merchant is verified (ensure proper Boolean comparison)
    if (check_merchant.is_verified !== true) {  // If it's a Boolean field
      return res.status(403).json({
        success: false,
        message: "Merchant not authorized",
      });
    }
  
    // Update the product's featured status
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      { is_featured: true },
      { new: true } // Returns the updated document
    );
  
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  
    // Success response
    return res.status(200).json({
      success: true,
      message: "Product added to Featured successfully",
      product: updatedProduct,
    });
  } catch (err) {
    // Catch and json error details
    return res.status(500).json({
      success: false,
      message: `An error has occurred: ${err.message}`,
    });
  }
  
  
};

const RemovefromTrending = async (req, res) => {
  try {
    const Merchantid = req.params.id;
    const productid = req.params.productid;
  
    // Check if the merchant exists
    const check_merchant = await Merchant.findById(Merchantid);
    if (!check_merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
  
    // Check if the merchant is verified
    if (check_merchant.is_verified !== true) {  
      return res.status(403).json({
        success: false,
        message: "Merchant not authorized",
      });
    }
  
    // Update the product's featured status
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      { is_trending: false },
      { new: true } 
    );
  
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  
    // Success response
    return res.status(200).json({
      success: true,
      message: "Product Removed from trending successfully",
      product: updatedProduct,
    });
  } catch (err) {
    // Catch and json error details
    return res.status(500).json({
      success: false,
      message: `An error has occurred: ${err.message}`,
    });
  }
  
  
};

const RemovefromFeatured = async (req, res) => {
  try {
    const Merchantid = req.params.id;
    const productid = req.params.productid;
  
    // Check if the merchant exists
    const check_merchant = await Merchant.findById(Merchantid);
    if (!check_merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
  
    // Check if the merchant is verified
    if (check_merchant.is_verified !== true) {  
      return res.status(403).json({
        success: false,
        message: "Merchant not authorized",
      });
    }
  
    // Update the product's featured status
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      { is_featured: false },
      { new: true } 
    );
  
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  
    // Success response
    return res.status(200).json({
      success: true,
      message: "Product removed from Featured successfully",
      product: updatedProduct,
    });
  } catch (err) {
    // Catch and json error details
    return res.status(500).json({
      success: false,
      message: `An error has occurred: ${err.message}`,
    });
  }
  
  
};


const deleteProduct = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  Product.findByIdAndDelete(id)
    .then((deletedProduct) => {
      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: "Failed to delete Product",
        error: err.message,
      });
    });
};



module.exports = {
  CreateProduct,
  GetAllproduct,
  GetSingleproduct,
  updateproduct,
  TrendingProduct,
  featuredProduct,
  RemovefromTrending,
  RemovefromFeatured,
  deleteProduct
}
