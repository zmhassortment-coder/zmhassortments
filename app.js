require('dotenv').config(); 
const express = require("express");
const port = process.env.PORT || 9000; 
const app = express();
const mongoose = require("mongoose");
const UserRoutes = require("./routes/Userroutes");
const ProductRoutes = require("./routes/ProductRoutes");
const MerchantRoutes = require("./routes/Merchantroutes");
const CategoryRoutes = require("./routes/Categoryroutes");
const ReviewRoutes = require("./routes/ReviewRoutes");
const BannerRoutes = require("./routes/BannerRoute");
const WishlistRoutes = require("./routes/WishlistRoutes");
const CartRoutes = require("./routes/CartRoute");
const OrderRoutes = require("./routes/OrderRoutes");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:3001",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));
app.options("/*", cors());
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

const dbUrl = process.env.DB_URL;


mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("Database connection established");
  })
  .catch((err) => {
    console.log(err.message);
  });

// Register API routes **before** serving the React app
app.use( UserRoutes);
app.use( ProductRoutes);
app.use( MerchantRoutes);
app.use( CategoryRoutes);
app.use( ReviewRoutes);
app.use( BannerRoutes);
app.use( WishlistRoutes);
app.use( CartRoutes);
app.use( OrderRoutes);
// Start server
app.listen(port, (err) => {
  if (err) {
    console.log("There was a problem starting the server");
  } else {
    console.log(`Server started on port: ${port}`);
  }
});
