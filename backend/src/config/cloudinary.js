const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload buffer lên Cloudinary qua stream.
 * @param {Buffer} buffer   - Nội dung file
 * @param {object} options  - Cloudinary upload options (folder, resource_type, public_id, ...)
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    Readable.from(buffer).pipe(uploadStream);
  });

/**
 * Xóa resource trên Cloudinary theo public_id.
 * @param {string} publicId
 * @param {string} resourceType - 'image' | 'raw' | 'video'
 */
const deleteResource = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.warn('Cloudinary delete warning:', e.message);
  }
};

/**
 * Lấy public_id từ Cloudinary URL.
 * VD: https://res.cloudinary.com/demo/image/upload/v1/historyed/thumbs/abc123
 *  → historyed/thumbs/abc123
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    // Bỏ version segment (v123456/)
    const withoutVersion = parts[1].replace(/^v\d+\//, '');
    // Bỏ extension
    return withoutVersion.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

module.exports = { cloudinary, uploadBuffer, deleteResource, getPublicIdFromUrl };
