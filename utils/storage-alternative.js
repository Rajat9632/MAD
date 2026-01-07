// Alternative Storage Utilities - For when Firebase Storage is not available
// Stores images as base64 in Firestore (suitable for small images)

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../FirebaseConfig';
import { usersAPI } from './api';

/**
 * Simple base64 encoder for React Native
 */
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

/**
 * Convert image URI to base64 (React Native compatible)
 * @param {string} uri - Image URI
 * @returns {Promise<string>} Base64 data URL
 */
const uriToBase64 = async (uri) => {
  try {
    // For React Native, fetch works for both local and remote URIs
    const response = await fetch(uri);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get response as arrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64 using our custom encoder
    const base64 = base64Encode(bytes);
    
    // Determine MIME type from response headers or URI
    let contentType = 'image/jpeg';
    const contentTypeHeader = response.headers.get('content-type');
    if (contentTypeHeader) {
      contentType = contentTypeHeader;
    } else if (uri.toLowerCase().includes('.png')) {
      contentType = 'image/png';
    } else if (uri.toLowerCase().includes('.gif')) {
      contentType = 'image/gif';
    } else if (uri.toLowerCase().includes('.webp')) {
      contentType = 'image/webp';
    }
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Base64 conversion error:', error);
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
};

/**
 * Upload image as base64 to Firestore (alternative to Firebase Storage)
 * @param {string} uri - Local image URI
 * @param {string} userId - User ID
 * @param {string} folder - Folder path (e.g., 'posts', 'profile')
 * @returns {Promise<string>} Document ID (can be used as reference)
 */
export const uploadImageToFirestore = async (uri, userId, folder = 'posts') => {
  try {
    // Convert to base64
    const base64 = await uriToBase64(uri);
    
    // Create document ID
    const timestamp = Date.now();
    const docId = `${folder}_${userId}_${timestamp}`;
    
    // Store in Firestore STORAGE collection
    await setDoc(doc(db, 'STORAGE', docId), {
      userId,
      folder,
      imageBase64: base64,
      createdAt: new Date().toISOString(),
    });
    
    // Return a reference that can be stored in user/post documents
    return `firestore://${docId}`;
  } catch (error) {
    console.error('Firestore image upload error:', error);
    throw new Error('Failed to upload image to Firestore');
  }
};

/**
 * Get image from Firestore by doc ID
 * @param {string} docId - Document ID
 * @returns {Promise<string>} Base64 data URL
 */
export const getImageFromFirestore = async (docId) => {
  try {
    // Remove firestore:// prefix if present
    const cleanDocId = docId.replace('firestore://', '');
    
    const docRef = doc(db, 'STORAGE', cleanDocId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Image not found');
    }
    
    return docSnap.data().imageBase64;
  } catch (error) {
    console.error('Get image from Firestore error:', error);
    throw new Error('Failed to retrieve image');
  }
};

/**
 * Upload image using backend API (if available) or Firestore fallback
 * @param {string} uri - Local image URI
 * @param {string} userId - User ID
 * @param {string} folder - Folder path
 * @returns {Promise<string>} Image URL or reference
 */
export const uploadImage = async (uri, userId, folder = 'posts') => {
  try {
    // Try backend API first (if it supports base64)
    try {
      const base64 = await uriToBase64(uri);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/storage/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, userId, folder }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data.url;
        }
      }
    } catch (apiError) {
      console.log('Backend API not available, using Firestore directly');
    }
    
    // Fallback to Firestore
    return await uploadImageToFirestore(uri, userId, folder);
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

