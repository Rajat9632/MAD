// API Utilities - Frontend API client for backend services

import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works fine
// For physical devices, use your computer's IP address
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('Using API URL from ENV:', envUrl);
    return envUrl;
  }
  
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    const url = 'http://10.0.2.2:5000';
    console.log('Android fallback URL:', url);
    return url;
  }
  // iOS simulator and web
  const url = 'http://localhost:5000';
  console.log('Fallback URL:', url);
  return url;
};

const API_BASE_URL = getApiBaseUrl();
console.log('🚀 FINAL API BASE URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased to 15 seconds for stability
});

// AI API calls
export const aiAPI = {
  enhanceImage: async (imageUri) => {
    const response = await api.post('/api/ai/enhance-image', { imageUri });
    return response.data;
  },
  
  generateCaption: async (imageUri, context = '', imageBase64 = null) => {
    const response = await api.post('/api/ai/generate-caption', { 
      imageUri: imageBase64 ? null : imageUri, 
      imageBase64,
      context 
    });
    return response.data;
  },
  
  generateStory: async ({ title, materials, techniques, personalStory, language, region }) => {
    const response = await api.post('/api/ai/generate-story', {
      title,
      materials,
      techniques,
      personalStory,
      language,
      region,
    });
    return response.data;
  },
  
  generateVideoScript: async (artworkData, language = 'en', region = '') => {
    const response = await api.post('/api/ai/generate-video-script', {
      artworkData,
      language,
      region,
    });
    return response.data;
  },
  
  generateVideoReel: async (artworkData, imageUrls = []) => {
    const response = await api.post('/api/ai/generate-video-reel', {
      artworkData,
      imageUrls,
    });
    return response.data;
  },
};

// Posts API calls
export const postsAPI = {
  createPost: async (postData) => {
    const response = await api.post('/api/posts/create', postData);
    return response.data;
  },
  
  getPosts: async (limit = 20, lastDocId = null) => {
    const response = await api.get('/api/posts/feed', {
      params: { limit, lastDocId },
    });
    return response.data;
  },
  
  getPostById: async (postId) => {
    const response = await api.get(`/api/posts/${postId}`);
    return response.data;
  },
  
  updatePost: async (postId, updateData) => {
    const response = await api.put(`/api/posts/${postId}`, updateData);
    return response.data;
  },
  
  deletePost: async (postId) => {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  },
};

// Social Media API calls
export const socialAPI = {
  publishToMultiple: async (postData, platforms = ['instagram', 'twitter', 'facebook']) => {
    const response = await api.post('/api/social/publish', { postData, platforms });
    return response.data;
  },
  
  publishToInstagram: async (postData) => {
    const response = await api.post('/api/social/instagram', { postData });
    return response.data;
  },
  
  publishToTwitter: async (postData) => {
    const response = await api.post('/api/social/twitter', { postData });
    return response.data;
  },
  
  publishToFacebook: async (postData) => {
    const response = await api.post('/api/social/facebook', { postData });
    return response.data;
  },
};

// Geolocation API calls
export const geolocationAPI = {
  detectRegion: async (latitude, longitude) => {
    const response = await api.post('/api/geolocation/detect-region', {
      latitude,
      longitude,
    });
    return response.data;
  },
  
  getRegionalLanguage: async (region, country) => {
    const response = await api.post('/api/geolocation/regional-language', {
      region,
      country,
    });
    return response.data;
  },
  
  translateContent: async (content, targetLanguage, sourceLanguage = 'en') => {
    const response = await api.post('/api/geolocation/translate', {
      content,
      targetLanguage,
      sourceLanguage,
    });
    return response.data;
  },
};

// Users API calls
export const usersAPI = {
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('getUserById error:', error.message);
      throw error;
    }
  },
  
  updateUser: async (userId, updateData) => {
    try {
      const response = await api.put(`/api/users/${userId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('updateUser error:', error.message);
      throw error;
    }
  },
  
  getUserStats: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      // Return default stats if backend is unavailable
      if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
        console.log('Backend server not available - returning default stats');
        return { success: true, data: { posts: 0, followers: 0, following: 0 } };
      }
      throw error;
    }
  },
  
  getUserPosts: async (userId, limit = 20, lastDocId = null) => {
    try {
      const response = await api.get(`/api/users/${userId}/posts`, {
        params: { limit, lastDocId },
      });
      return response.data;
    } catch (error) {
      console.error('getUserPosts error:', error.message);
      throw error;
    }
  },
  
  searchUsers: async (searchTerm, limit = 20) => {
    try {
      const response = await api.get(`/api/users/search/${searchTerm}`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('searchUsers error:', error.message);
      throw error;
    }
  },
};

export default api;
