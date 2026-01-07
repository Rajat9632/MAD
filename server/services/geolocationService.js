// Geolocation Service - Regional language detection and translation
// Uses free translation APIs (MyMemory) as alternative to Google Translate

const axios = require('axios');

// Regional language mappings
const REGION_LANGUAGES = {
  'Maharashtra': 'mr', // Marathi
  'Gujarat': 'gu', // Gujarati
  'Tamil Nadu': 'ta', // Tamil
  'Karnataka': 'kn', // Kannada
  'West Bengal': 'bn', // Bengali
  'Andhra Pradesh': 'te', // Telugu
  'Kerala': 'ml', // Malayalam
  'Punjab': 'pa', // Punjabi
  'Rajasthan': 'hi', // Hindi
  'Odisha': 'or', // Odia
  'Assam': 'as', // Assamese
  'default': 'en' // English
};

// Language code mappings for translation APIs
const LANGUAGE_CODES = {
  'mr': 'mr', 'gu': 'gu', 'ta': 'ta', 'kn': 'kn', 'bn': 'bn',
  'te': 'te', 'ml': 'ml', 'pa': 'pa', 'hi': 'hi', 'or': 'or',
  'as': 'as', 'en': 'en', 'zh': 'zh', 'ja': 'ja', 'es': 'es',
  'fr': 'fr', 'de': 'de', 'pt': 'pt', 'ru': 'ru', 'ar': 'ar'
};

/**
 * Detect user's region based on coordinates (using reverse geocoding)
 */
async function detectRegion(latitude, longitude) {
  try {
    // Using OpenStreetMap Nominatim API for reverse geocoding (free)
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ArtConnect-App/1.0'
        },
        timeout: 5000
      }
    );

    const address = response.data.address;
    const region = address?.state || address?.region || address?.country || 'Unknown';
    const country = address?.country || 'Unknown';
    const city = address?.city || address?.town || address?.village || '';
    
    return {
      region,
      country,
      city,
      latitude,
      longitude,
      language: getRegionalLanguage(region, country)
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    // Fallback: return default region
    return {
      region: 'Unknown',
      country: 'Unknown',
      city: '',
      latitude,
      longitude,
      language: 'en'
    };
  }
}

/**
 * Get regional language code
 */
function getRegionalLanguage(region, country = '') {
  if (!region) return 'en';
  
  // Check exact region match
  if (REGION_LANGUAGES[region]) {
    return REGION_LANGUAGES[region];
  }
  
  // Check for partial matches
  const regionLower = region.toLowerCase();
  for (const [key, lang] of Object.entries(REGION_LANGUAGES)) {
    if (key.toLowerCase().includes(regionLower) || regionLower.includes(key.toLowerCase())) {
      return lang;
    }
  }
  
  // Country-based fallback
  if (country) {
    const countryLower = country.toLowerCase();
    if (countryLower.includes('india')) return 'hi'; // Hindi for India
    if (countryLower.includes('china')) return 'zh'; // Chinese
    if (countryLower.includes('japan')) return 'ja'; // Japanese
    if (countryLower.includes('spain')) return 'es'; // Spanish
    if (countryLower.includes('france')) return 'fr'; // French
    if (countryLower.includes('germany')) return 'de'; // German
  }
  
  return REGION_LANGUAGES.default;
}

/**
 * Translate content using free MyMemory Translation API
 * Alternative to Google Translate (no billing required)
 */
async function translateContent(content, targetLanguage, sourceLanguage = 'en') {
  try {
    if (!content || !content.trim()) return '';
    if (targetLanguage === sourceLanguage || targetLanguage === 'en' && sourceLanguage === 'en') {
      return content; // No translation needed
    }
    
    // Validate language codes
    const sourceLang = LANGUAGE_CODES[sourceLanguage] || 'en';
    const targetLang = LANGUAGE_CODES[targetLanguage] || 'en';
    
    if (sourceLang === targetLang) {
      return content;
    }
    
    // Use MyMemory Translation API (free, no API key required)
    // Limit: 10,000 characters per day, 100 words per request
    const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';
    
    // Split long content into chunks if needed
    const maxLength = 500; // MyMemory works best with shorter texts
    if (content.length > maxLength) {
      // For long content, translate in chunks
      const chunks = [];
      const words = content.split(' ');
      let currentChunk = [];
      let currentLength = 0;
      
      for (const word of words) {
        if (currentLength + word.length + 1 > maxLength && currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [word];
          currentLength = word.length;
        } else {
          currentChunk.push(word);
          currentLength += word.length + 1;
        }
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
      }
      
      // Translate each chunk
      const translatedChunks = await Promise.all(
        chunks.map(chunk => translateChunk(chunk, sourceLang, targetLang))
      );
      
      return translatedChunks.join(' ');
    }
    
    return await translateChunk(content, sourceLang, targetLang);
    
  } catch (error) {
    console.error('Translation error:', error.message);
    // Return original content on error
    return content;
  }
}

/**
 * Translate a single chunk of text using MyMemory API
 */
async function translateChunk(text, sourceLang, targetLang) {
  try {
    const response = await axios.get(MYMEMORY_API_URL, {
      params: {
        q: text,
        langpair: `${sourceLang}|${targetLang}`
      },
      timeout: 10000
    });
    
    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    }
    
    // Fallback: return original text
    return text;
  } catch (error) {
    console.error('MyMemory translation chunk error:', error.message);
    return text;
  }
}

/**
 * Get regional language name
 */
function getRegionalLanguageName(languageCode) {
  const languageNames = {
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'ta': 'Tamil',
    'kn': 'Kannada',
    'bn': 'Bengali',
    'te': 'Telugu',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'hi': 'Hindi',
    'or': 'Odia',
    'as': 'Assamese',
    'en': 'English',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German'
  };
  
  return languageNames[languageCode] || 'English';
}

module.exports = {
  detectRegion,
  getRegionalLanguage,
  translateContent,
  getRegionalLanguageName
};
