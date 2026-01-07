// Social Media Routes - Cross-platform posting (Instagram, Twitter, Facebook)

const express = require('express');
const router = express.Router();
const { postToSocialMedia } = require('../services/socialService');

// Post to multiple social media platforms
router.post('/publish', async (req, res) => {
  try {
    const { postData, platforms } = req.body;
    
    if (!postData) {
      return res.status(400).json({ success: false, message: 'Post data is required' });
    }

    const platformsToPost = platforms || ['instagram', 'twitter', 'facebook'];
    const results = await postToSocialMedia(postData, platformsToPost);
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Social media posting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Post to Instagram
router.post('/instagram', async (req, res) => {
  try {
    const { postData } = req.body;
    const result = await postToSocialMedia(postData, ['instagram']);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Instagram posting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Post to Twitter
router.post('/twitter', async (req, res) => {
  try {
    const { postData } = req.body;
    const result = await postToSocialMedia(postData, ['twitter']);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Twitter posting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Post to Facebook
router.post('/facebook', async (req, res) => {
  try {
    const { postData } = req.body;
    const result = await postToSocialMedia(postData, ['facebook']);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Facebook posting error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

