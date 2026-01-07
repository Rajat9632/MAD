// Storage Utilities - Firebase Storage integration for image uploads

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../FirebaseConfig';

/**
 * Upload image to Firebase Storage
 * @param {string} uri - Local image URI
 * @param {string} userId - User ID
 * @param {string} folder - Folder path (e.g., 'posts', 'profile')
 * @returns {Promise<string>} Download URL
 */
export const uploadImage = async (uri, userId, folder = 'posts') => {
  try {
    // Check if storage is initialized
    if (!storage) {
      throw new Error('Firebase Storage is not initialized. Please check your Firebase configuration.');
    }

    // Convert URI to blob
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    
    // Create unique filename
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;
    const storageRef = ref(storage, `${folder}/${filename}`);
    
    // Upload image
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Image upload error:', error);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to upload images. Please check Firebase Storage rules.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Firebase Storage error. Please check your Firebase configuration and Storage rules.');
    } else if (error.message) {
      throw error;
    } else {
      throw new Error('Failed to upload image. Please try again.');
    }
  }
};

/**
 * Delete image from Firebase Storage
 * @param {string} url - Image URL to delete
 */
export const deleteImage = async (url) => {
  try {
    const imageRef = ref(storage, url);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Image deletion error:', error);
    // Don't throw error for deletion failures
  }
};

/**
 * Upload multiple images
 * @param {string[]} uris - Array of image URIs
 * @param {string} userId - User ID
 * @param {string} folder - Folder path
 * @returns {Promise<string[]>} Array of download URLs
 */
export const uploadMultipleImages = async (uris, userId, folder = 'posts') => {
  try {
    const uploadPromises = uris.map(uri => uploadImage(uri, userId, folder));
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('Multiple image upload error:', error);
    throw new Error('Failed to upload images');
  }
};

