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
 * Generate caption using Vision API analysis + OpenAI GPT (if available) for enhanced creativity
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
      .slice(0, 5)
      .map(l => l.description);
    
    // Get detected objects
    const detectedObjects = imageAnalysis.objects
      .filter(o => o.confidence > 0.5)
      .map(o => o.name);
    
    // Get dominant colors with better color names
    const dominantColors = imageAnalysis.colors
      .slice(0, 3)
      .map(c => {
        const r = c.color?.red || 0;
        const g = c.color?.green || 0;
        const b = c.color?.blue || 0;
        // Better color detection
        if (r > 200 && g < 100 && b < 100) return 'vibrant red';
        if (g > 200 && r < 100 && b < 100) return 'lush green';
        if (b > 200 && r < 100 && g < 100) return 'deep blue';
        if (r > 200 && g > 200 && b < 100) return 'warm yellow';
        if (r > 150 && g < 100 && b > 150) return 'rich purple';
        if (r > 200 && g > 150 && b < 100) return 'golden';
        if (r < 100 && g < 100 && b < 100) return 'deep black';
        if (r > 200 && g > 200 && b > 200) return 'soft white';
        if (r > 150 && g > 150 && b > 150) return 'neutral gray';
        return null;
      })
      .filter(Boolean);
    
    // Try OpenAI GPT for enhanced caption if API key is available
    if (process.env.OPENAI_API_KEY && topLabels.length > 0) {
      try {
        const visionContext = {
          labels: topLabels.join(', '),
          objects: detectedObjects.join(', '),
          colors: dominantColors.join(', '),
          text: imageAnalysis.text?.substring(0, 200) || '',
          context: context || ''
        };
        
        const prompt = `You are a creative social media caption writer for an art and craft platform. Create an engaging, authentic caption for this artwork based on the following analysis:

Visual Elements Detected: ${visionContext.labels}
Objects: ${visionContext.objects || 'Various artistic elements'}
Color Palette: ${visionContext.colors || 'Rich and vibrant'}
${visionContext.text ? `Text in image: ${visionContext.text}` : ''}
${visionContext.context ? `Additional context: ${visionContext.context}` : ''}

Requirements:
- Write a captivating, authentic caption (2-4 sentences)
- Use natural, engaging language (not overly formal)
- Include relevant emojis (2-3 max)
- Add 5-7 relevant hashtags at the end
- Make it feel personal and genuine
- Focus on the artistry, craftsmanship, and cultural significance
- Keep it under 250 words

Format: Caption text followed by hashtags on a new line.`;

        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini', // Using mini for cost efficiency, can upgrade to gpt-4
            messages: [
              {
                role: 'system',
                content: 'You are an expert social media caption writer specializing in art and cultural heritage content.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 300,
            temperature: 0.8
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        
        const aiCaption = openaiResponse.data.choices[0]?.message?.content?.trim();
        if (aiCaption && aiCaption.length > 50) {
          console.log('Using OpenAI-generated caption');
          return aiCaption;
        }
      } catch (openaiError) {
        console.log('OpenAI API not available or failed, using enhanced template:', openaiError.message);
        // Fall through to enhanced template-based generation
      }
    }
    
    // Enhanced template-based caption generation (fallback or primary method)
    let caption = '';
    
    // Create engaging opening based on detected content
    if (topLabels.length > 0) {
      const primarySubject = topLabels[0];
      const subjectEmoji = getEmojiForSubject(primarySubject);
      caption = `${subjectEmoji} ${createEngagingOpening(primarySubject)}`;
      
      if (topLabels.length > 1) {
        const secondarySubjects = topLabels.slice(1, 3).join(' and ');
        caption += ` featuring ${secondarySubjects}`;
      }
      caption += '!';
    } else {
      caption = '✨ A beautiful piece of traditional artistry!';
    }
    
    // Add rich description
    if (detectedObjects.length > 0) {
      caption += ` This stunning work showcases ${detectedObjects.join(', ')} with incredible attention to detail.`;
    }
    
    // Add color description with more personality
    if (dominantColors.length > 0) {
      caption += ` The ${dominantColors.join(' and ')} palette creates a ${getMoodFromColors(dominantColors)} atmosphere.`;
    }
    
    // Add detailed, contextual description
    if (topLabels.length > 0) {
      const labelsLower = topLabels.map(l => l.toLowerCase()).join(' ');
      const craftDescription = getCraftDescription(labelsLower);
      if (craftDescription) {
        caption += ` ${craftDescription}`;
      }
    }
    
    // Add detected text if present and meaningful
    if (imageAnalysis.text && imageAnalysis.text.length > 0) {
      const meaningfulText = extractMeaningfulText(imageAnalysis.text);
      if (meaningfulText) {
        caption += `\n\n"${meaningfulText}"`;
      }
    }
    
    // Add context if provided
    if (context) {
      caption += `\n\n${context}`;
    }
    
    // Generate smart, relevant hashtags
    const hashtags = generateSmartHashtags(topLabels, detectedObjects, imageAnalysis);
    caption += `\n\n${hashtags.join(' ')}`;
    
    return caption.trim();
  } catch (error) {
    console.error('Caption generation error:', error);
    throw new Error('Failed to generate caption');
  }
}

// Helper function to extract meaningful text from Vision API results
function extractMeaningfulText(text) {
  if (!text || text.length < 3) return null;
  
  // Remove newlines and extra spaces
  let cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Check if text is mostly readable (has letters and spaces, not just symbols)
  const letterCount = (cleanText.match(/[a-zA-Z]/g) || []).length;
  const totalChars = cleanText.length;
  const letterRatio = letterCount / totalChars;
  
  // If less than 40% are letters, it's probably garbled
  if (letterRatio < 0.4) return null;
  
  // Check for minimum word count (at least 3 words)
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) return null;
  
  // Check if text has too many special characters (more than 30% special chars = garbled)
  const specialCharCount = (cleanText.match(/[^a-zA-Z0-9\s]/g) || []).length;
  const specialCharRatio = specialCharCount / totalChars;
  if (specialCharRatio > 0.3) return null;
  
  // Check for common garbled patterns
  const garbledPatterns = [
    /[ΩΟΦ]{2,}/, // Greek letters repeated
    /[A-Z]{10,}/, // Too many consecutive caps (likely OCR error)
    /[^a-zA-Z0-9\s]{5,}/, // Too many consecutive special chars
    /.{1,2}\s.{1,2}\s.{1,2}/, // Too many single/double char words (likely garbled)
  ];
  
  for (const pattern of garbledPatterns) {
    if (pattern.test(cleanText)) {
      return null; // Text appears garbled
    }
  }
  
  // Limit length and return cleaned text
  return cleanText.substring(0, 200).trim();
}

// Helper functions for enhanced caption generation
function getEmojiForSubject(subject) {
  const subjectLower = subject.toLowerCase();
  if (subjectLower.includes('pottery') || subjectLower.includes('ceramic')) return '🏺';
  if (subjectLower.includes('textile') || subjectLower.includes('fabric')) return '🧵';
  if (subjectLower.includes('wood') || subjectLower.includes('carving')) return '🪵';
  if (subjectLower.includes('metal') || subjectLower.includes('bronze')) return '⚒️';
  if (subjectLower.includes('painting') || subjectLower.includes('art')) return '🎨';
  if (subjectLower.includes('jewelry') || subjectLower.includes('jewellery')) return '💎';
  return '✨';
}

function createEngagingOpening(subject) {
  const openings = [
    `Discovering the beauty of ${subject}`,
    `Celebrating ${subject}`,
    `A masterpiece of ${subject}`,
    `The art of ${subject}`,
    `Exploring ${subject}`
  ];
  return openings[Math.floor(Math.random() * openings.length)];
}

function getMoodFromColors(colors) {
  const warmColors = ['red', 'yellow', 'golden', 'warm'];
  const coolColors = ['blue', 'green', 'purple'];
  const hasWarm = colors.some(c => warmColors.some(w => c.includes(w)));
  const hasCool = colors.some(c => coolColors.some(co => c.includes(co)));
  
  if (hasWarm && hasCool) return 'harmonious and balanced';
  if (hasWarm) return 'warm and inviting';
  if (hasCool) return 'calm and serene';
  return 'striking and vibrant';
}

function getCraftTypeFromLabels(labelsLower) {
  if (labelsLower.includes('pottery') || labelsLower.includes('ceramic')) {
    return 'ceramic artistry';
  } else if (labelsLower.includes('textile') || labelsLower.includes('fabric') || labelsLower.includes('cloth') || labelsLower.includes('weaving')) {
    return 'textile art';
  } else if (labelsLower.includes('wood') || labelsLower.includes('wooden') || labelsLower.includes('carving')) {
    return 'wood carving';
  } else if (labelsLower.includes('metal') || labelsLower.includes('bronze') || labelsLower.includes('copper') || labelsLower.includes('iron')) {
    return 'metalwork';
  } else if (labelsLower.includes('painting') || labelsLower.includes('art')) {
    return 'traditional painting';
  } else if (labelsLower.includes('jewelry') || labelsLower.includes('jewellery')) {
    return 'jewelry making';
  } else if (labelsLower.includes('embroidery') || labelsLower.includes('stitch')) {
    return 'embroidery';
  } else if (labelsLower.includes('basket') || labelsLower.includes('weaving')) {
    return 'basket weaving';
  }
  return null;
}

function getCraftDescription(labelsLower) {
  if (labelsLower.includes('pottery') || labelsLower.includes('ceramic')) {
    return `Handcrafted with time-honored techniques passed down through generations, this ceramic piece embodies centuries of artistic tradition.`;
  } else if (labelsLower.includes('textile') || labelsLower.includes('fabric') || labelsLower.includes('cloth')) {
    return `Woven with meticulous skill and precision, this textile art weaves together threads of cultural heritage and contemporary expression.`;
  } else if (labelsLower.includes('wood') || labelsLower.includes('wooden') || labelsLower.includes('carving')) {
    return `Carved from carefully selected wood, this piece demonstrates the artisan's deep connection with natural materials and traditional craftsmanship.`;
  } else if (labelsLower.includes('metal') || labelsLower.includes('bronze') || labelsLower.includes('copper')) {
    return `Forged with age-old methods, this metalwork showcases the timeless beauty that emerges when skill meets tradition.`;
  } else if (labelsLower.includes('painting') || labelsLower.includes('art')) {
    return `This artwork beautifully captures the essence of artistic expression, blending traditional techniques with personal creativity.`;
  } else if (labelsLower.includes('jewelry') || labelsLower.includes('jewellery')) {
    return `Meticulously crafted, this piece reflects the artisan's dedication to preserving traditional jewelry-making techniques.`;
  } else {
    return `This handcrafted piece showcases the rich tapestry of traditional artistry and cultural heritage.`;
  }
}

function generateSmartHashtags(topLabels, detectedObjects, imageAnalysis) {
  const hashtags = new Set();
  
  // Add hashtags from labels
  topLabels.forEach(label => {
    const words = label.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        hashtags.add(`#${word.charAt(0).toUpperCase() + word.slice(1).replace(/[^a-zA-Z0-9]/g, '')}`);
      }
    });
  });
  
  // Add craft-specific hashtags
  const labelsLower = topLabels.map(l => l.toLowerCase()).join(' ');
  if (labelsLower.includes('pottery') || labelsLower.includes('ceramic')) {
    hashtags.add('#PotteryArt');
    hashtags.add('#CeramicCraft');
  }
  if (labelsLower.includes('textile') || labelsLower.includes('fabric')) {
    hashtags.add('#TextileArt');
    hashtags.add('#Handwoven');
  }
  if (labelsLower.includes('wood') || labelsLower.includes('carving')) {
    hashtags.add('#WoodCarving');
    hashtags.add('#Handcrafted');
  }
  
  // Add default cultural hashtags
  hashtags.add('#HandmadeArt');
  hashtags.add('#CulturalHeritage');
  hashtags.add('#TraditionalCraft');
  hashtags.add('#ArtisanMade');
  hashtags.add('#SupportArtisans');
  
  // Add object-based hashtags
  if (detectedObjects.length > 0) {
    detectedObjects.slice(0, 2).forEach(obj => {
      const tag = obj.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
      if (tag.length > 3) {
        hashtags.add(`#${tag}`);
      }
    });
  }
  
  return Array.from(hashtags).slice(0, 10);
}

/**
 * Generate story for artwork (using Vision API insights + OpenAI GPT if available for enhanced storytelling)
 */
async function generateStory({ title, materials, techniques, personalStory, language, region, imageUri, imageBase64 }) {
  try {
    let imageInsights = '';
    let imageAnalysis = null;
    
    // If image provided, get insights from Vision API
    if (imageUri || imageBase64) {
      try {
        imageAnalysis = await enhanceImage(imageUri, imageBase64);
        const topLabels = imageAnalysis.labels.slice(0, 5).map(l => l.description).join(', ');
        const detectedObjects = imageAnalysis.objects.map(o => o.name).join(', ');
        imageInsights = `Visual elements: ${topLabels}${detectedObjects ? `. Objects: ${detectedObjects}` : ''}`;
      } catch (e) {
        console.log('Could not analyze image for story:', e.message);
      }
    }
    
    // Try OpenAI GPT for enhanced storytelling if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        // Build detailed image analysis for OpenAI
        const detailedImageAnalysis = imageAnalysis ? {
          labels: imageAnalysis.labels?.slice(0, 5).map(l => `${l.description} (${Math.round(l.confidence * 100)}% confidence)`).join(', ') || '',
          objects: imageAnalysis.objects?.map(o => o.name).join(', ') || '',
          colors: imageAnalysis.colors?.slice(0, 3).map(c => {
            const r = c.color?.red || 0;
            const g = c.color?.green || 0;
            const b = c.color?.blue || 0;
            return `RGB(${r},${g},${b})`;
          }).join(', ') || ''
        } : null;
        
        const storyPrompt = `You are a storyteller specializing in cultural heritage and traditional crafts. Create a UNIQUE, engaging, narrative-driven story (3-5 paragraphs) for this artwork. Make it specific to THIS artwork, not generic:

Title: ${title}
${materials ? `Materials Used: ${materials}` : ''}
${techniques ? `Techniques: ${techniques}` : ''}
${region ? `Region/Culture: ${region}` : ''}
${detailedImageAnalysis ? `
Visual Analysis from Image:
- Detected Elements: ${detailedImageAnalysis.labels || 'Various artistic elements'}
- Objects Present: ${detailedImageAnalysis.objects || 'Traditional craft elements'}
- Color Palette: ${detailedImageAnalysis.colors || 'Rich traditional colors'}
` : imageInsights ? `Visual Analysis: ${imageInsights}` : ''}
${personalStory ? `Artist's Personal Note: ${personalStory}` : ''}

IMPORTANT REQUIREMENTS:
- Write a UNIQUE story specific to THIS artwork - do NOT use generic templates
- Reference the specific visual elements, materials, and techniques mentioned above
- Connect the visual analysis details to the story (mention specific colors, elements, objects if relevant)
- Make it engaging and personal, as if telling a friend about this specific piece
- Include the cultural significance and traditional aspects
- Vary your language and structure - make each story different
- Add 5-7 relevant hashtags at the end
- Keep it between 200-400 words
- Use natural, flowing language

Format: Story text followed by hashtags on a new line.`;

        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert storyteller specializing in cultural heritage, traditional crafts, and art narratives. Your stories are engaging, authentic, and connect readers to the cultural significance of artworks.'
              },
              {
                role: 'user',
                content: storyPrompt
              }
            ],
            max_tokens: 500,
            temperature: 0.85
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );
        
        const aiStory = openaiResponse.data.choices[0]?.message?.content?.trim();
        if (aiStory && aiStory.length > 100) {
          console.log('Using OpenAI-generated story');
          return aiStory;
        }
      } catch (openaiError) {
        console.log('OpenAI API not available or failed, using enhanced template:', openaiError.message);
        // Fall through to enhanced template-based generation
      }
    }
    
    // Enhanced template-based story generation with image analysis
    let story = '';
    
    // Use image analysis to create unique story
    const topLabels = imageAnalysis?.labels?.slice(0, 5).map(l => l.description) || [];
    const detectedObjects = imageAnalysis?.objects?.map(o => o.name) || [];
    const dominantColors = imageAnalysis?.colors?.slice(0, 3).map(c => {
      const r = c.color?.red || 0;
      const g = c.color?.green || 0;
      const b = c.color?.blue || 0;
      if (r > 200 && g < 100 && b < 100) return 'vibrant red';
      if (g > 200 && r < 100 && b < 100) return 'lush green';
      if (b > 200 && r < 100 && g < 100) return 'deep blue';
      if (r > 200 && g > 200 && b < 100) return 'warm yellow';
      if (r > 150 && g < 100 && b > 150) return 'rich purple';
      if (r > 200 && g > 150 && b < 100) return 'golden';
      return null;
    }).filter(Boolean) || [];
    
    // Determine craft type from labels
    const labelsLower = topLabels.map(l => l.toLowerCase()).join(' ');
    const craftType = getCraftTypeFromLabels(labelsLower);
    
    // Opening paragraph - unique based on image analysis
    if (craftType) {
      story = `In the world of ${craftType}, ${title} stands as a remarkable example of traditional craftsmanship. `;
    } else if (topLabels.length > 0) {
      story = `This ${topLabels[0]} piece, titled "${title}", represents a beautiful fusion of artistry and tradition. `;
    } else {
      story = `Behind every piece of art lies a story, and ${title} is no exception. `;
    }
    
    // Add materials with context
    if (materials) {
      const materialList = materials.split(',').slice(0, 3).map(m => m.trim());
      if (materialList.length === 1) {
        story += `Crafted entirely from ${materialList[0]}, `;
      } else if (materialList.length === 2) {
        story += `Created using ${materialList[0]} and ${materialList[1]}, `;
      } else {
        story += `Made with ${materialList.slice(0, -1).join(', ')}, and ${materialList[materialList.length - 1]}, `;
      }
    }
    
    // Add regional context
    if (region) {
      story += `this piece embodies the distinctive ${region} style of craftsmanship. `;
    } else if (craftType) {
      story += `this artwork showcases the timeless beauty of ${craftType}. `;
    } else {
      story += `this artwork embodies rich cultural heritage. `;
    }
    
    // Add techniques with more detail
    if (techniques) {
      const techniqueList = techniques.split(',').slice(0, 2).map(t => t.trim());
      story += `The artisan has masterfully employed ${techniqueList.join(' and ')}, `;
      if (techniqueList.length > 1) {
        story += `techniques that work in harmony to create this stunning piece. `;
      } else {
        story += `a technique refined through generations of practice. `;
      }
    } else if (topLabels.length > 0) {
      story += `Each detail has been carefully crafted, reflecting the artisan's dedication to their craft. `;
    }
    
    // Middle paragraph - visual description based on image analysis
    story += `\n\n`;
    
    if (topLabels.length > 0 || detectedObjects.length > 0) {
      story += `What makes this piece particularly captivating is its visual composition. `;
      
      if (topLabels.length > 0) {
        const primaryFeatures = topLabels.slice(0, 3).join(', ');
        story += `The ${primaryFeatures} elements create a harmonious balance that draws the eye. `;
      }
      
      if (detectedObjects.length > 0) {
        story += `The presence of ${detectedObjects.slice(0, 2).join(' and ')} adds depth and character to the work. `;
      }
      
      if (dominantColors.length > 0) {
        story += `The ${dominantColors.join(' and ')} color palette evokes a sense of ${getMoodFromColors(dominantColors)}, `;
        story += `connecting the viewer to the emotional essence of the piece. `;
      }
    } else {
      story += `This piece represents more than just an object; it's a testament to the enduring spirit of traditional artistry. `;
    }
    
    story += `It speaks to the cultural identity and artistic traditions that have been preserved and passed down, `;
    story += `ensuring that these valuable skills continue to thrive in the modern world.`;
    
    // Personal story paragraph - more dynamic
    if (personalStory) {
      story += `\n\n${personalStory}`;
    } else {
      // Create unique closing based on craft type or labels
      if (craftType) {
        story += `\n\nThis ${craftType} piece carries with it the stories and traditions of its creators, `;
        story += `connecting us to a rich cultural legacy. It serves as a reminder of the importance of preserving `;
        story += `${craftType} techniques and honoring the skilled artisans who keep these traditions alive. `;
        story += `Each element tells a story not just of creation, but of culture, heritage, and the human connection to art.`;
      } else if (topLabels.length > 0) {
        story += `\n\nThis artwork carries with it the stories and traditions of its creators, `;
        story += `connecting us to a rich cultural legacy. The ${topLabels[0]} tradition it represents `;
        story += `has been shaped by countless artisans over generations, each adding their unique touch while `;
        story += `honoring the techniques of their predecessors.`;
      } else {
        story += `\n\nThis artwork carries with it the stories and traditions of its creators, `;
        story += `connecting us to a rich cultural legacy. It serves as a reminder of the importance of preserving `;
        story += `traditional crafts and honoring the skilled artisans who keep these traditions alive.`;
      }
    }
    
    // Add relevant hashtags - more specific
    const hashtags = [];
    if (craftType) {
      hashtags.push(`#${craftType.replace(/\s+/g, '')}`);
    }
    if (topLabels.length > 0) {
      topLabels.slice(0, 2).forEach(label => {
        const tag = label.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        if (tag.length > 3) hashtags.push(`#${tag}`);
      });
    }
    hashtags.push('#CulturalHeritage', '#TraditionalCraft');
    if (region) {
      hashtags.push(`#${region.replace(/\s+/g, '')}`);
    }
    if (materials) {
      const materialTags = materials.split(',').slice(0, 2).map(m => {
        const tag = m.trim().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        return tag.length > 3 ? `#${tag}` : null;
      }).filter(Boolean);
      hashtags.push(...materialTags);
    }
    hashtags.push('#HandmadeArt', '#ArtisanMade');
    
    story += `\n\n${hashtags.slice(0, 8).join(' ')}`;
    
    return story.trim();
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
    const { title, story, materials, techniques, imageUrl } = artworkData;
    
    // Enhanced script generation with AI if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const scriptPrompt = `Create an engaging video script for a short-form reel (30-60 seconds) about this artwork:

Title: ${title}
Story: ${story || 'Traditional craft piece'}
Materials: ${materials || 'Traditional materials'}
Techniques: ${techniques || 'Traditional techniques'}
Region: ${region || 'Cultural region'}

Create a script with:
1. Hook (5-10 seconds) - Attention-grabbing opening
2. Main content (20-40 seconds) - The story and details
3. Call to action (5-10 seconds) - Encourage engagement

Make it engaging, authentic, and suitable for social media. Include suggested visual transitions and key moments.`;

        const openaiResponse = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a video script writer specializing in short-form social media content about art and culture.'
              },
              {
                role: 'user',
                content: scriptPrompt
              }
            ],
            max_tokens: 400,
            temperature: 0.8
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        
        const aiScript = openaiResponse.data.choices[0]?.message?.content?.trim();
        if (aiScript && aiScript.length > 100) {
          return {
            script: aiScript,
            intro: `Welcome to ArtConnect! Today, we're exploring the story behind this beautiful ${title}.`,
            main: story || `Crafted with ${materials || 'traditional materials'}, this piece showcases ${techniques || 'traditional techniques'}.`,
            outro: `Discover more cultural artworks on ArtConnect - bridging artists and audiences worldwide.`,
            language,
            region,
            duration: '30-60 seconds',
            hashtags: ['#ArtConnect', '#CulturalArt', '#TraditionalCraft', `#${title.replace(/\s+/g, '')}`]
          };
        }
      } catch (openaiError) {
        console.log('OpenAI script generation failed, using template:', openaiError.message);
      }
    }
    
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

/**
 * Generate AI video reel from images and story
 * This creates a video composition that can be rendered using FFmpeg or video APIs
 */
async function generateVideoReel(artworkData, imageUrls = []) {
  try {
    const { title, story, materials, techniques, region } = artworkData;
    
    // Generate video script
    const script = await generateVideoScript(artworkData);
    
    // Create video composition data
    const videoComposition = {
      script: script,
      images: imageUrls,
      title: title,
      story: story,
      duration: 30, // seconds
      transitions: ['fade', 'zoom', 'pan'],
      music: 'cultural-heritage-ambient', // Suggested music style
      captions: [
        {
          text: script.intro,
          startTime: 0,
          duration: 5
        },
        {
          text: script.main,
          startTime: 5,
          duration: 20
        },
        {
          text: script.outro,
          startTime: 25,
          duration: 5
        }
      ],
      hashtags: script.hashtags,
      metadata: {
        materials,
        techniques,
        region,
        createdAt: new Date().toISOString()
      }
    };
    
    // Note: Actual video rendering would require FFmpeg or a video service
    // This returns the composition data that can be used to generate the video
    return {
      success: true,
      composition: videoComposition,
      instructions: 'Use FFmpeg or a video generation service to render this composition into a video file. The composition includes all necessary data for video creation.'
    };
  } catch (error) {
    console.error('Video reel generation error:', error);
    throw new Error('Failed to generate video reel');
  }
}

module.exports = {
  enhanceImage,
  generateCaption,
  generateStory,
  generateVideoScript,
  generateVideoReel
};
