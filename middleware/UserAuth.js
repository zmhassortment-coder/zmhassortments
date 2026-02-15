const Users = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

    try {
      const user = await Users.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });
};

module.exports = authenticateUser;
