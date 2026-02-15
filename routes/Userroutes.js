const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateuser = require('../middleware/UserAuth');

const {
  CreateUser,
  loginUser,
  getsingleUser,
  getAllUsers,
  updateUser,
  deleteUser,
  logoutUser,
} = require("../controllers/UserController");

router.post("/api/register-user", upload.single('avatar'), CreateUser);
router.post("/api/user-login", loginUser);
router.post("/api/user-logout", logoutUser);
router.put('/api/update-user/:id', authenticateuser, upload.single('avatar'), updateUser);
router.get('/api/users', authenticateuser, getAllUsers);
router.get('/api/user/:id', authenticateuser, getsingleUser);
router.delete('/api/delete-user', authenticateuser, deleteUser);

module.exports = router;
