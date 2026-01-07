// AI Service - Google Cloud Vision API integration
// Handles image analysis, captioning, and story generation

const axios = require('axios');
const { ImageAnnotatorClient } = require('@google-cloud/vision');

// Initialize Vision API client (optional - can use REST API with API key)
let visionClient = null;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    visionClient = new ImageAnnotatorClient();
  } catch (error) {
    console.warn('Vision client initialization failed, will use REST API:', error.message);
  }
}

/**
 * Convert image URI or base64 to format suitable for Vision API
 */
async function prepareImageForVision(imageUri, imageBase64) {
  if (imageBase64) {
    // Remove data URL prefix if present
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    return { content: base64Data };
  }
  
  if (imageUri) {
    // If it's a URL, use source
    if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      return { source: { imageUri } };
    }
    // If it's a local file path, we'd need to read it
    // For now, assume it's a URL or needs to be converted to base64 first
    return { source: { imageUri } };
  }
  
  throw new Error('Either imageUri or imageBase64 must be provided');
}

/**
 * Google Cloud Vision API for image analysis and enhancement
 */
async function enhanceImage(imageUri, imageBase64) {
  try {
    if (!process.env.GOOGLE_VISION_API_KEY && !visionClient) {
      console.warn('Vision API key not configured, returning mock data');
      return {
        labels: [
          { description: 'Handmade craft', confidence: 0.95 },
          { description: 'Artistic work', confidence: 0.88 },
          { description: 'Cultural artifact', confidence: 0.82 }
        ],
        objects: [],
        text: '',
        colors: [],
        enhanced: false
      };
    }

    const image = await prepareImageForVision(imageUri, imageBase64);
    
    // Use REST API with API key (simpler than service account)
    if (process.env.GOOGLE_VISION_API_KEY) {
      const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`;
      
      const requestBody = {
        requests: [{
          image: image,
          features: [
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            { type: 'TEXT_DETECTION' },
            { type: 'IMAGE_PROPERTIES' },
            { type: 'SAFE_SEARCH_DETECTION' }
          ]
        }]
      };

      console.log('Calling Vision API...', {
        hasImage: !!image,
        imageType: image.content ? 'base64' : 'uri',
        apiKeyPresent: !!process.env.GOOGLE_VISION_API_KEY
      });

      const response = await axios.post(VISION_API_URL, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      const result = response.data.responses[0];
      
      // Check for errors in response
      if (result.error) {
        console.error('Vision API returned error:', result.error);
        throw new Error(`Vision API error: ${result.error.message || 'Unknown error'}`);
      }
      
      console.log('Vision API success:', {
        labels: result.labelAnnotations?.length || 0,
        objects: result.localizedObjectAnnotations?.length || 0,
        hasText: !!result.textAnnotations?.[0]
      });
      
      return {
        labels: (result.labelAnnotations || []).map(l => ({
          description: l.description,
          confidence: l.score
        })),
        objects: (result.localizedObjectAnnotations || []).map(o => ({
          name: o.name,
          confidence: o.score,
          boundingPoly: o.boundingPoly
        })),
        text: result.textAnnotations?.[0]?.description || '',
        colors: result.imagePropertiesAnnotation?.dominantColors?.colors?.map(c => ({
          color: c.color,
          score: c.score,
          pixelFraction: c.pixelFraction
        })) || [],
        safeSearch: result.safeSearchAnnotation || {},
        enhanced: true
      };
    }
    
    // Fallback to client library if available
    if (visionClient) {
      const [result] = await visionClient.annotateImage({
        image: image,
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'TEXT_DETECTION' },
          { type: 'IMAGE_PROPERTIES' }
        ]
      });
      
      return {
        labels: (result.labelAnnotations || []).map(l => ({
          description: l.description,
          confidence: l.score
        })),
        objects: (result.localizedObjectAnnotations || []).map(o => ({
          name: o.name,
          confidence: o.score
        })),
        text: result.textAnnotations?.[0]?.description || '',
        colors: result.imagePropertiesAnnotation?.dominantColors?.colors?.map(c => ({
          color: c.color,
          score: c.score
        })) || [],
        enhanced: true
      };
    }
    
    throw new Error('Vision API not configured');
  } catch (error) {
    console.error('Vision API error:', error.response?.data || error.message);
    
    // Return mock data on error
    return {
      labels: [
        { description: 'Handmade craft', confidence: 0.95 },
        { description: 'Artistic work', confidence: 0.88 }
      ],
      objects: [],
      text: '',
      colors: [],
      enhanced: false,
      error: error.message
    };
  }
}

/**
 * Generate caption using Vision API analysis
 */
async function generateCaption(imageUri, imageBase64, context = '') {
  try {
    // First get image analysis from Vision API
    const imageAnalysis = await enhanceImage(imageUri, imageBase64);
    
    // Log what we detected for debugging
    console.log('Vision API Results:', {
      labels: imageAnalysis.labels?.length || 0,
      objects: imageAnalysis.objects?.length || 0,
      hasText: !!imageAnalysis.text,
      enhanced: imageAnalysis.enhanced
    });
    
    // Check if we got real Vision API results or mock data
    const isRealData = imageAnalysis.enhanced && imageAnalysis.labels && imageAnalysis.labels.length > 0;
    
    if (!isRealData) {
      console.warn('Vision API returned mock data or no results. Check API key configuration.');
    }
    
    // Get top labels (most confident)
    const topLabels = imageAnalysis.labels
      .filter(l => l.confidence > 0.5) // Only high confidence labels
      .slice(0, 3)
      .map(l => l.description);
    
    // Get detected objects
    const detectedObjects = imageAnalysis.objects
      .filter(o => o.confidence > 0.5)
      .map(o => o.name);
    
    // Get dominant colors
    const dominantColors = imageAnalysis.colors
      .slice(0, 2)
      .map(c => {
        const r = c.color?.red || 0;
        const g = c.color?.green || 0;
        const b = c.color?.blue || 0;
        // Convert RGB to color name (simplified)
        if (r > 200 && g < 100 && b < 100) return 'red';
        if (g > 200 && r < 100 && b < 100) return 'green';
        if (b > 200 && r < 100 && g < 100) return 'blue';
        if (r > 200 && g > 200 && b < 100) return 'yellow';
        if (r < 100 && g < 100 && b < 100) return 'dark';
        if (r > 200 && g > 200 && b > 200) return 'light';
        return null;
      })
      .filter(Boolean);
    
    // Build dynamic caption based on what we detected
    let caption = '';
    
    // Start with emoji and primary subject
    if (topLabels.length > 0) {
      const primarySubject = topLabels[0];
      caption = `✨ ${primarySubject.charAt(0).toUpperCase() + primarySubject.slice(1)}`;
      
      if (topLabels.length > 1) {
        caption += ` featuring ${topLabels.slice(1).join(', ')}`;
      }
      caption += '!';
    } else {
      caption = '✨ Beautiful artwork!';
    }
    
    // Add object details if detected
    if (detectedObjects.length > 0) {
      caption += ` This piece showcases ${detectedObjects.join(' and ')}.`;
    }
    
    // Add color description if available
    if (dominantColors.length > 0) {
      caption += ` The ${dominantColors.join(' and ')} tones add depth and character.`;
    }
    
    // Add more specific description based on detected labels
    if (topLabels.length > 0) {
      // Check for specific art/craft types
      const labelsLower = topLabels.map(l => l.toLowerCase()).join(' ');
      
      if (labelsLower.includes('pottery') || labelsLower.includes('ceramic')) {
        caption += ' Handcrafted with traditional techniques, this piece represents centuries of ceramic artistry.';
      } else if (labelsLower.includes('textile') || labelsLower.includes('fabric') || labelsLower.includes('cloth')) {
        caption += ' Woven with skill and precision, this textile art tells a story of cultural heritage.';
      } else if (labelsLower.includes('wood') || labelsLower.includes('wooden') || labelsLower.includes('carving')) {
        caption += ' Carved from fine wood, this piece demonstrates masterful craftsmanship.';
      } else if (labelsLower.includes('metal') || labelsLower.includes('bronze') || labelsLower.includes('copper')) {
        caption += ' Forged with traditional methods, this metalwork showcases timeless artistry.';
      } else if (labelsLower.includes('painting') || labelsLower.includes('art')) {
        caption += ' This artwork beautifully captures the essence of traditional artistic expression.';
      } else {
        // Generic but only if we have real data
        if (isRealData) {
          caption += ' This handcrafted piece showcases traditional artistry and cultural heritage.';
        }
      }
    } else if (isRealData) {
      // If we have real data but no specific labels, use generic
      caption += ' This piece represents traditional craftsmanship and cultural heritage.';
    }
    
    // Add detected text if present
    if (imageAnalysis.text && imageAnalysis.text.length > 0) {
      const cleanText = imageAnalysis.text.replace(/\n/g, ' ').substring(0, 150);
      caption += `\n\n"${cleanText}"`;
    }
    
    // Add context if provided
    if (context) {
      caption += `\n\n${context}`;
    }
    
    // Generate relevant hashtags from detected labels
    const hashtags = [];
    if (topLabels.length > 0) {
      topLabels.forEach(label => {
        const tag = label.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        if (tag.length > 2) {
          hashtags.push(`#${tag}`);
        }
      });
    }
    
    // Add default hashtags
    hashtags.push('#HandmadeArt', '#CulturalHeritage', '#TraditionalCraft');
    if (detectedObjects.length > 0) {
      detectedObjects.forEach(obj => {
        const tag = obj.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        if (tag.length > 2) {
          hashtags.push(`#${tag}`);
        }
      });
    }
    
    caption += `\n\n${hashtags.slice(0, 8).join(' ')}`;
    
    return caption.trim();
  } catch (error) {
    console.error('Caption generation error:', error);
    throw new Error('Failed to generate caption');
  }
}

/**
 * Generate story for artwork (using Vision API insights if image provided)
 */
async function generateStory({ title, materials, techniques, personalStory, language, region, imageUri, imageBase64 }) {
  try {
    let imageInsights = '';
    
    // If image provided, get insights from Vision API
    if (imageUri || imageBase64) {
      try {
        const analysis = await enhanceImage(imageUri, imageBase64);
        const topLabels = analysis.labels.slice(0, 3).map(l => l.description).join(', ');
        imageInsights = `\n\nVisual analysis reveals: ${topLabels}`;
      } catch (e) {
        console.log('Could not analyze image for story:', e.message);
      }
    }
    
    const story = `The ${title} represents a beautiful fusion of traditional craftsmanship and cultural heritage.${materials ? ` Crafted with ${materials},` : ''} this piece embodies the essence of ${region || 'regional'} artistry that has been passed down through generations.

${techniques ? `Using techniques like ${techniques}, the artisan has created a masterpiece that speaks to both the past and present.` : 'Each element has been carefully considered, from the choice of materials to the intricate details that make this artwork truly unique.'}${imageInsights}

${personalStory || 'This artwork carries with it the stories and traditions of its creators, connecting us to a rich cultural legacy. It serves as a reminder of the importance of preserving traditional crafts and honoring the skilled artisans who keep these traditions alive.'}

#CulturalHeritage #TraditionalCraft #${title.replace(/\s+/g, '')}`;

    return story;
  } catch (error) {
    console.error('Story generation error:', error);
    throw new Error('Failed to generate story');
  }
}

/**
 * Generate video script for cultural reels
 */
async function generateVideoScript(artworkData, language = 'en', region = '') {
  try {
    const { title, story, materials, techniques } = artworkData;
    
    const script = {
      intro: `Welcome to ArtConnect! Today, we're exploring the story behind this beautiful ${title}.`,
      main: story || `Crafted with ${materials || 'traditional materials'}, this piece showcases ${techniques || 'traditional techniques'} that have been preserved through generations.`,
      outro: `Discover more cultural artworks on ArtConnect - bridging artists and audiences worldwide.`,
      language,
      region,
      duration: '30-60 seconds',
      hashtags: ['#ArtConnect', '#CulturalArt', '#TraditionalCraft', `#${title.replace(/\s+/g, '')}`]
    };
    
    return script;
  } catch (error) {
    console.error('Video script generation error:', error);
    throw new Error('Failed to generate video script');
  }
}

module.exports = {
  enhanceImage,
  generateCaption,
  generateStory,
  generateVideoScript
};
