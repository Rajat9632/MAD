// Geolocation Routes - Geo-localized language and content

const express = require('express');
const router = express.Router();
const { detectRegion, getRegionalLanguage, translateContent } = require('../services/geolocationService');

// Detect user's region based on coordinates
router.post('/detect-region', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    const region = await detectRegion(latitude, longitude);
    res.json({ success: true, data: region });
  } catch (error) {
    console.error('Region detection error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get regional language
router.post('/regional-language', async (req, res) => {
  try {
    const { region, country } = req.body;
    
    if (!region && !country) {
      return res.status(400).json({ success: false, message: 'Region or country required' });
    }

    const language = await getRegionalLanguage(region, country);
    res.json({ success: true, data: { language } });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Translate content to regional language
router.post('/translate', async (req, res) => {
  try {
    const { content, targetLanguage, sourceLanguage } = req.body;
    
    if (!content || !targetLanguage) {
      return res.status(400).json({ success: false, message: 'Content and target language required' });
    }

    const translated = await translateContent(content, targetLanguage, sourceLanguage);
    res.json({ success: true, data: { translated } });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

