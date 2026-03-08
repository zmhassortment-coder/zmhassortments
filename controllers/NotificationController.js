const Notification = require("../models/NotificationModel");

const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient_role: "user",
      recipient_id: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient_role: "user",
      recipient_id: req.user._id,
      is_read: false,
    });

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user notifications",
      error: err.message,
    });
  }
};

const markUserNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient_role: "user", recipient_id: req.user._id },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, data: notification });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: err.message,
    });
  }
};

const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient_role: "admin",
      $or: [{ recipient_id: { $exists: false } }, { recipient_id: null }, { recipient_id: req.merchant?._id }],
    })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient_role: "admin",
      is_read: false,
      $or: [{ recipient_id: { $exists: false } }, { recipient_id: null }, { recipient_id: req.merchant?._id }],
    });

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin notifications",
      error: err.message,
    });
  }
};

const markAdminNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient_role: "admin",
        $or: [{ recipient_id: { $exists: false } }, { recipient_id: null }, { recipient_id: req.merchant?._id }],
      },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, data: notification });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: err.message,
    });
  }
};

module.exports = {
  getUserNotifications,
  markUserNotificationRead,
  getAdminNotifications,
  markAdminNotificationRead,
};
