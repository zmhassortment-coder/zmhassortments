const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const Users = require("../models/UserModel")
const SECRET_KEY = process.env.SECRET_KEY || process.env.JWT_SECRET;

const CreateUser = async(req, res) => {
    try {
      const {fullName,email,phoneNumber,password,gender,address } = req.body;
        const check_user = await Users.findOne({email});
        if(check_user){
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }
        const avatarPath = req.file ? req.file.path : null;
        const encrypt_password = await bcrypt.hash(password, 12);
        const New_member = {fullName,email,phoneNumber,gender,address,password: encrypt_password, avatar:avatarPath };
        const New_user = await new Users(New_member).save();
        res.status(201).json({
            success: true,
            message: "User created Successfully",
            data: New_user
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to create user",
            error: err.message,
        })
    }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!SECRET_KEY) {
      return res.status(500).json({
        message: "Server auth is not configured",
      });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET_KEY,
      { expiresIn: "3d" }
    );

    const safeUser = {
      id: user._id,
      fullName: user.fullName,
    };

    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN; // e.g. ".yourdomain.com" (no protocol)
    const cookieOptionsToken = {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };
    const cookieOptionsUser = {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };

    res
      .cookie("token", token, cookieOptionsToken)
      .cookie("user", JSON.stringify(safeUser), cookieOptionsUser)
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        user: safeUser,
        data: {
          token,
          user: safeUser,
        },
      });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

const getAllUsers = (req, res) => {
  
  Users.find({}, {password: 0, __v: 0})
    .then((resp) => {
      res.json({
        success: true,
        message: "All Users",
        data: resp,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch users",
        error: err.massage,
      });
    });
};

const getsingleUser = (req, res) => {
 
  const id = req.params.user_id;
  Users.findOne(id,{}, {password: 0, __v: 0})
    .then((resp) => {
      res.json({
        success: true,
        message: "All Users",
        data: resp,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch users",
        error: err.massage,
      });
    });
};

const updateUser = async (req, res) => {
 
 try {
  const id = req.params.id;
  const updatePayload = {};

  // Only update fields provided in the request body.
  if (req.body.fullName !== undefined) updatePayload.fullName = req.body.fullName;
  if (req.body.gender !== undefined) updatePayload.gender = req.body.gender;
  if (req.body.phoneNumber !== undefined) updatePayload.phoneNumber = req.body.phoneNumber;
  if (req.body.address !== undefined) updatePayload.address = req.body.address;
  if (req.body.email !== undefined) updatePayload.email = req.body.email;

  // Preserve existing avatar unless a new file is uploaded.
  if (req.file?.path) {
    updatePayload.avatar = req.file.path;
  }

  const resp = await Users.findByIdAndUpdate(id, updatePayload, { new: true });
  res.json({
    success: true,
    message: "User Updated Successfully",
    data: resp,
  });
 } catch (err) {
  res.status(500).json({
    success: false,
    message: "Failed to Update user",
    error: err.message,
  });
 }
    
   
   
};

const deleteUser = (res, req) => {
  
  const id = req.params.id;
  Users.findByIdAndDelete(id)
    .then(() => {
      res.json({
        success: true,
        message: "User Deleted Successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Delete user",
        error: err.massage,
      });
    });
};

const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
  };

  res
    .clearCookie("token", cookieOptions)
    .clearCookie("user", cookieOptions)
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  CreateUser,
  loginUser,
  getAllUsers,
  updateUser,
  getsingleUser,
  deleteUser,
  logoutUser
};
