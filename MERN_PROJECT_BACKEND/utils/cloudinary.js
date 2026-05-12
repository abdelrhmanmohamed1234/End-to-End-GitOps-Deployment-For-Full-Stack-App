const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Wrap the upload function to always include current timestamp
const originalUpload = cloudinary.uploader.upload;

cloudinary.uploader.upload = function(filePath, options = {}) {
  // Always add current timestamp to avoid stale request errors
  options.timestamp = Math.floor(Date.now() / 1000);
  console.log(`Uploading to Cloudinary with timestamp: ${options.timestamp}`);
  return originalUpload.call(this, filePath, options);
};

module.exports = cloudinary;
