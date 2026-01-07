// AI Routes - Google Cloud Vertex AI & Vision API integration

const express = require('express');
const router = express.Router();
const { enhanceImage, generateCaption, generateStory, generateVideoScript } = require('../services/aiService');

// Image enhancement and captioning
router.post('/enhance-image', async (req, res) => {
  try {
    const { imageUri, imageBase64 } = req.body;
    
    if (!imageUri && !imageBase64) {
      return res.status(400).json({ success: false, message: 'Image URI or base64 required' });
    }

    const enhancedImage = await enhanceImage(imageUri, imageBase64);
    res.json({ success: true, data: enhancedImage });
  } catch (error) {
    console.error('Image enhancement error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate caption for image
router.post('/generate-caption', async (req, res) => {
  try {
    const { imageUri, imageBase64, context } = req.body;
    
    if (!imageUri && !imageBase64) {
      return res.status(400).json({ success: false, message: 'Image URI or base64 required' });
    }

    const caption = await generateCaption(imageUri, imageBase64, context);
    res.json({ success: true, data: { caption } });
  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate story for artwork
router.post('/generate-story', async (req, res) => {
  try {
    const { title, materials, techniques, personalStory, language, region } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const { imageUri: storyImageUri, imageBase64: storyImageBase64 } = req.body;
    
    const story = await generateStory({
      title,
      materials: materials || '',
      techniques: techniques || '',
      personalStory: personalStory || '',
      language: language || 'en',
      region: region || '',
      imageUri: storyImageUri,
      imageBase64: storyImageBase64
    });

    res.json({ success: true, data: { story } });
  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate video script for cultural reels
router.post('/generate-video-script', async (req, res) => {
  try {
    const { artworkData, language, region } = req.body;
    
    if (!artworkData) {
      return res.status(400).json({ success: false, message: 'Artwork data is required' });
    }

    const script = await generateVideoScript(artworkData, language || 'en', region || '');
    res.json({ success: true, data: { script } });
  } catch (error) {
    console.error('Video script generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

