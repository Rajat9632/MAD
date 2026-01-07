// Media Storage Utilities - Cloudinary (Free tier) for photos and videos
// Handles large file uploads with proper error handling and retry logic

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Get API base URL - same logic as utils/api.js
 */
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    // For physical device, use your computer's IP address
    return 'http://10.0.2.2:5000';
  }
  // iOS simulator and web
  return 'http://localhost:5000';
};

/**
 * Convert URI to base64 for upload (React Native compatible)
 * Uses expo-file-system for local files, fetch for remote URLs
 */
const uriToBase64 = async (uri) => {
  try {
    // Check if it's a local file URI (file://, content://, or starts with /)
    const isLocalFile = uri.startsWith('file://') || 
                       uri.startsWith('content://') || 
                       uri.startsWith('/') ||
                       uri.startsWith('ph://') ||
                       uri.startsWith('assets-library://');
    
    if (isLocalFile) {
      // Use expo-file-system for local files
      try {
        // Read file as base64 - try different API formats
        let base64String;
        
        // Try with string 'base64' first (most common in newer versions)
        try {
          base64String = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
          });
        } catch (e1) {
          // Try with enum if available (older versions)
          if (FileSystem.EncodingType && FileSystem.EncodingType.Base64) {
            try {
              base64String = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
            } catch (e2) {
              throw new Error(`Failed to read file: ${e1.message || e2.message}`);
            }
          } else {
            throw e1;
          }
        }
        
        // Determine MIME type from URI
        let mimeType = 'image/jpeg'; // default
        const uriLower = uri.toLowerCase();
        if (uriLower.includes('.png')) {
          mimeType = 'image/png';
        } else if (uriLower.includes('.gif')) {
          mimeType = 'image/gif';
        } else if (uriLower.includes('.webp')) {
          mimeType = 'image/webp';
        } else if (uriLower.includes('.mp4')) {
          mimeType = 'video/mp4';
        } else if (uriLower.includes('.mov')) {
          mimeType = 'video/quicktime';
        } else if (uriLower.includes('.avi')) {
          mimeType = 'video/x-msvideo';
        } else if (uriLower.includes('.jpg') || uriLower.includes('.jpeg')) {
          mimeType = 'image/jpeg';
        }
        
        return `data:${mimeType};base64,${base64String}`;
      } catch (fileSystemError) {
        console.error('FileSystem read error:', fileSystemError);
        throw new Error(`Failed to read local file: ${fileSystemError.message}`);
      }
    } else {
      // Remote URL - use fetch
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        // Use FileReader if available (web)
        if (typeof FileReader !== 'undefined') {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        } else {
          // React Native fallback: convert blob to arrayBuffer then to base64
          blob.arrayBuffer().then(buffer => {
            const bytes = new Uint8Array(buffer);
            // Use base64 encoding helper
            const base64Encode = (bytes) => {
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
              let result = '';
              let i = 0;
              while (i < bytes.length) {
                const a = bytes[i++];
                const b = i < bytes.length ? bytes[i++] : 0;
                const c = i < bytes.length ? bytes[i++] : 0;
                const bitmap = (a << 16) | (b << 8) | c;
                result += chars.charAt((bitmap >> 18) & 63);
                result += chars.charAt((bitmap >> 12) & 63);
                result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
                result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '=';
              }
              return result;
            };
            const base64String = base64Encode(bytes);
            const mimeType = blob.type || 'image/jpeg';
            resolve(`data:${mimeType};base64,${base64String}`);
          }).catch(reject);
        }
      });
    }
  } catch (error) {
    console.error('Base64 conversion error:', error);
    throw new Error(`Failed to convert file to base64: ${error.message}`);
  }
};

/**
 * Upload media file (photo or video) to Cloudinary via server API
 * @param {string} uri - Local file URI
 * @param {string} userId - User ID
 * @param {string} folder - Folder path (e.g., 'posts', 'profile', 'videos')
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<string>} Download URL
 */
export const uploadMedia = async (uri, userId, folder = 'posts', onProgress = null, maxRetries = 3) => {
  const apiUrl = getApiBaseUrl();
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Convert URI to base64
      if (onProgress) onProgress(10);
      const base64 = await uriToBase64(uri);
      if (onProgress) onProgress(50);
      
      // Determine if it's a video based on MIME type or file extension
      const isVideo = uri.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/) || 
                      base64.includes('data:video/');
      
      // Prepare request body
      const body = {
        userId,
        folder,
        [isVideo ? 'videoBase64' : 'imageBase64']: base64,
      };
      
      if (onProgress) onProgress(70);
      
      // Upload to server (which uploads to Cloudinary)
      let response;
      try {
        response = await fetch(`${apiUrl}/api/storage/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } catch (fetchError) {
        // Network error - server might not be running
        throw new Error(`Cannot connect to server at ${apiUrl}. Please make sure your server is running and Cloudinary is configured.`);
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `Server error: ${response.statusText}`;
        
        // Check for Cloudinary configuration errors
        if (errorMsg.includes('Cloudinary is not configured') || errorMsg.includes('CLOUDINARY')) {
          throw new Error('Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your server/.env file.');
        }
        
        throw new Error(errorMsg);
      }
      
      if (onProgress) onProgress(90);
      
      const result = await response.json();
      
      if (!result.success || !result.data?.url) {
        throw new Error(result.message || 'Upload failed - no URL returned');
      }
      
      if (onProgress) onProgress(100);
      
      return result.data.url;
    } catch (error) {
      lastError = error;
      console.error(`Upload attempt ${attempt}/${maxRetries} failed:`, error);
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  // All retries failed
  const errorMessage = lastError?.message || 'Failed to upload media after multiple attempts';
  
  // Provide specific error messages
  if (errorMessage.includes('Cloudinary is not configured')) {
    throw new Error('Storage service is not configured. Please contact support.');
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    throw new Error('Network error. Please check your connection and try again.');
  } else {
    throw new Error(errorMessage);
  }
};

/**
 * Upload image to Cloudinary
 * @param {string} uri - Local image URI
 * @param {string} userId - User ID
 * @param {string} folder - Folder path (e.g., 'posts', 'profile')
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<string>} Download URL
 */
export const uploadImage = async (uri, userId, folder = 'posts', onProgress = null) => {
  return uploadMedia(uri, userId, folder, onProgress);
};

/**
 * Upload video to Cloudinary
 * @param {string} uri - Local video URI
 * @param {string} userId - User ID
 * @param {string} folder - Folder path (e.g., 'videos', 'posts')
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<string>} Download URL
 */
export const uploadVideo = async (uri, userId, folder = 'videos', onProgress = null) => {
  return uploadMedia(uri, userId, folder, onProgress);
};

/**
 * Upload multiple media files
 * @param {string[]} uris - Array of file URIs
 * @param {string} userId - User ID
 * @param {string} folder - Folder path
 * @param {Function} onProgress - Optional progress callback for all files
 * @returns {Promise<string[]>} Array of download URLs
 */
export const uploadMultipleMedia = async (uris, userId, folder = 'posts', onProgress = null) => {
  try {
    const totalFiles = uris.length;
    let completedFiles = 0;
    
    const uploadPromises = uris.map(async (uri, index) => {
      const fileProgress = (progress) => {
        if (onProgress) {
          const overallProgress = ((completedFiles + progress / 100) / totalFiles) * 100;
          onProgress(overallProgress);
        }
      };
      
      try {
        const url = await uploadMedia(uri, userId, folder, fileProgress);
        completedFiles++;
        return url;
      } catch (error) {
        completedFiles++;
        throw error;
      }
    });
    
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('Multiple media upload error:', error);
    throw new Error('Failed to upload some files. Please try again.');
  }
};

/**
 * Delete media file from Cloudinary
 * @param {string} url - File URL to delete
 */
export const deleteMedia = async (url) => {
  try {
    const apiUrl = getApiBaseUrl();
    
    // Extract publicId from URL
    let publicId = url;
    if (url.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      const urlParts = url.split('/upload/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        // Remove version number if present
        if (pathParts[0].startsWith('v')) {
          pathParts.shift();
        }
        // Remove file extension
        publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
      }
    }
    
    const response = await fetch(`${apiUrl}/api/storage/${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      console.warn('Failed to delete media:', response.statusText);
    }
  } catch (error) {
    console.error('Media deletion error:', error);
    // Don't throw - deletion failures shouldn't break the app
  }
};

/**
 * Get file metadata from Cloudinary
 * @param {string} url - File URL
 * @returns {Promise<Object>} File metadata
 */
export const getMediaMetadata = async (url) => {
  try {
    const apiUrl = getApiBaseUrl();
    
    // Extract publicId from URL
    let publicId = url;
    if (url.includes('cloudinary.com')) {
      const urlParts = url.split('/upload/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        if (pathParts[0].startsWith('v')) {
          pathParts.shift();
        }
        publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
      }
    }
    
    const response = await fetch(`${apiUrl}/api/storage/info/${encodeURIComponent(publicId)}`);
    
    if (!response.ok) {
      throw new Error('Failed to get metadata');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Get metadata error:', error);
    throw new Error('Failed to get file metadata');
  }
};
