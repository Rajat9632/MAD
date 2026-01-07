// Cloudinary Service - Free image and video storage
// Free tier: 25GB storage, 25GB bandwidth/month
// 
// Setup Instructions:
// 1. Sign up for free at https://cloudinary.com/users/register/free
// 2. Get your credentials from the Dashboard
// 3. Add to server/.env file:
//    CLOUDINARY_CLOUD_NAME=your_cloud_name
//    CLOUDINARY_API_KEY=your_api_key
//    CLOUDINARY_API_SECRET=your_api_secret

const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Convert base64 to buffer
 */
const base64ToBuffer = (base64String) => {
  // Remove data URL prefix if present
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  return Buffer.from(base64Data, 'base64');
};

/**
 * Upload image or video to Cloudinary
 * @param {Buffer|string} fileData - File buffer or base64 string
 * @param {string} userId - User ID
 * @param {string} folder - Folder path (e.g., 'posts', 'profile', 'videos')
 * @param {string} resourceType - 'image' or 'video'
 * @param {Object} options - Additional Cloudinary options
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadToCloudinary = async (fileData, userId, folder, resourceType = 'image', options = {}) => {
  try {
    // Convert base64 to buffer if needed
    const buffer = typeof fileData === 'string' ? base64ToBuffer(fileData) : fileData;
    
    // Create unique public ID
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const publicId = `${folder}/${userId}_${timestamp}_${randomId}`;
    
    // Default options
    const uploadOptions = {
      resource_type: resourceType,
      folder: folder,
      public_id: publicId,
      overwrite: false,
      invalidate: true,
      // Optimize images automatically
      ...(resourceType === 'image' && {
        quality: 'auto',
        fetch_format: 'auto',
      }),
      // Optimize videos
      ...(resourceType === 'video' && {
        quality: 'auto',
        format: 'mp4',
      }),
      ...options,
    };
    
    return new Promise((resolve, reject) => {
      // Create a readable stream from buffer
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
              resourceType: result.resource_type,
            });
          }
        }
      );
      
      // Write buffer to stream
      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);
      bufferStream.pipe(stream);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

/**
 * Upload image to Cloudinary
 */
const uploadImage = async (imageData, userId, folder = 'posts') => {
  return uploadToCloudinary(imageData, userId, folder, 'image');
};

/**
 * Upload video to Cloudinary
 */
const uploadVideo = async (videoData, userId, folder = 'videos') => {
  return uploadToCloudinary(videoData, userId, folder, 'video');
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID or URL
 */
const deleteFile = async (publicId) => {
  try {
    // Extract public_id from URL if full URL is provided
    let actualPublicId = publicId;
    if (publicId.includes('cloudinary.com')) {
      // Extract public_id from URL like: https://res.cloudinary.com/xxx/image/upload/v1234567/folder/file.jpg
      const urlParts = publicId.split('/upload/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        // Remove version number if present (v1234567)
        if (pathParts[0].startsWith('v')) {
          pathParts.shift();
        }
        // Remove file extension
        actualPublicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
      }
    }
    
    // Determine resource type from URL or default to image
    const resourceType = publicId.includes('/video/') ? 'video' : 'image';
    
    const result = await cloudinary.uploader.destroy(actualPublicId, {
      resource_type: resourceType,
    });
    
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

/**
 * Get file metadata from Cloudinary
 */
const getFileInfo = async (publicId) => {
  try {
    // Extract public_id from URL if needed
    let actualPublicId = publicId;
    if (publicId.includes('cloudinary.com')) {
      const urlParts = publicId.split('/upload/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        if (pathParts[0].startsWith('v')) {
          pathParts.shift();
        }
        actualPublicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
      }
    }
    
    const resourceType = publicId.includes('/video/') ? 'video' : 'image';
    
    const result = await cloudinary.api.resource(actualPublicId, {
      resource_type: resourceType,
    });
    
    return result;
  } catch (error) {
    console.error('Cloudinary get info error:', error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadToCloudinary,
  deleteFile,
  getFileInfo,
};

