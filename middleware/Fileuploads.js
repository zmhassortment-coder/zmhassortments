const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/Cloudnary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // check file type
    if (file.mimetype.startsWith("video/")) {
      return {
        folder: "ZMH/videos",
        resource_type: "video", // 👈 important for videos
        allowed_formats: ["mp4", "avi", "mkv", "mov"],
      };
    } else {
      return {
        folder: "ZMH/images",
        resource_type: "image", // 👈 keep for images
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [{ width: 500, height: 500, crop: "limit" }], 
      };
    }
  },
});

const uploads = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
      "image/avif",
      "video/mp4",
      "video/avi",
      "video/mkv",
      "video/mov",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported"), false);
    }
  },
});

module.exports = uploads;