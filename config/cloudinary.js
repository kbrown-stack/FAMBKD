const cloudinary = require('cloudinary').v2;

// process.env.NODE_TLS_REJECT_UNAUTHORISED = '0'; // This is for development while in office network

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;