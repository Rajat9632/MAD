// Storage Routes - Cloudinary (Free tier: 25GB storage, 25GB bandwidth/month)
// Handles large file uploads for photos and videos

const express = require('express');
const router = express.Router();
const { uploadImage, uploadVideo, deleteFile, getFileInfo } = require('../services/cloudinaryService');

/**
 * Upload image to Cloudinary
 * Accepts base64 image data
 */
router.post('/upload', async (req, res) => {
  try {
    const { imageBase64, videoBase64, userId, folder = 'posts' } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    // Check if we have file data
    const fileData = imageBase64 || videoBase64;
    if (!fileData) {
      return res.status(400).json({ 
        success: false, 
        message: 'File data (imageBase64 or videoBase64) is required' 
      });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        success: false, 
        message: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' 
      });
    }

    let result;
    if (videoBase64) {
      // Upload video
      result = await uploadVideo(videoBase64, userId, folder);
    } else {
      // Upload image
      result = await uploadImage(imageBase64, userId, folder);
    }

    res.json({ 
      success: true, 
      data: { 
        url: result.url,
        publicId: result.publicId,
        type: videoBase64 ? 'video' : 'image',
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        message: 'File uploaded successfully to Cloudinary'
      } 
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload media file' 
    });
  }
});

/**
 * Delete media file from Cloudinary
 */
router.delete('/:publicId(*)', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false, 
        message: 'publicId is required' 
      });
    }

    // Decode URL-encoded publicId
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await deleteFile(decodedPublicId);

    res.json({ 
      success: true, 
      data: result,
      message: 'File deleted successfully' 
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete file' 
    });
  }
});

/**
 * Get file metadata from Cloudinary
 */
router.get('/info/:publicId(*)', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false, 
        message: 'publicId is required' 
      });
    }

    // Decode URL-encoded publicId
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await getFileInfo(decodedPublicId);

    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get file metadata' 
    });
  }
});

module.exports = router;
