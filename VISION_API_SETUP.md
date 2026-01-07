# Google Vision API Setup Guide

## Overview
This project uses Google Cloud Vision API for image analysis, captioning, and story generation. The Vision API is integrated with free translation alternatives (MyMemory API) for multilingual support.

## Prerequisites
- Google Cloud account (free tier available)
- Vision API enabled in your Google Cloud project

## Setup Steps

### 1. Get Your Vision API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Vision API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"

4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
   - (Optional) Restrict the key to Vision API only for security

### 2. Add API Key to Server

Add your Vision API key to `server/.env`:

```env
GOOGLE_VISION_API_KEY=your_api_key_here
```

### 3. Restart Server

```bash
cd server
npm start
```

## How to Use Vision API

### 1. Image Enhancement & Analysis

**Endpoint:** `POST /api/ai/enhance-image`

**Request Body:**
```json
{
  "imageUri": "https://example.com/image.jpg",
  // OR
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "labels": [
      { "description": "Handmade craft", "confidence": 0.95 },
      { "description": "Artistic work", "confidence": 0.88 }
    ],
    "objects": [
      { "name": "Pottery", "confidence": 0.92 }
    ],
    "text": "Any text found in the image",
    "colors": [
      { "color": { "red": 255, "green": 200, "blue": 100 }, "score": 0.8 }
    ],
    "enhanced": true
  }
}
```

### 2. Generate Caption

**Endpoint:** `POST /api/ai/generate-caption`

**Request Body:**
```json
{
  "imageUri": "https://example.com/image.jpg",
  // OR
  "imageBase64": "data:image/jpeg;base64,...",
  "context": "Optional context about the image"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "caption": "✨ Beautiful handmade craft, artistic work! This handcrafted piece showcases traditional artistry..."
  }
}
```

### 3. Generate Story

**Endpoint:** `POST /api/ai/generate-story`

**Request Body:**
```json
{
  "title": "Rajasthani Pottery",
  "materials": "Terracotta clay",
  "techniques": "Hand-throwing, glazing",
  "personalStory": "Passed down through generations",
  "language": "en",
  "region": "Rajasthan",
  "imageUri": "https://example.com/image.jpg" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "story": "The Rajasthani Pottery represents a beautiful fusion..."
  }
}
```

## Free Translation Alternative

The project uses **MyMemory Translation API** (free, no API key required) instead of Google Translate API.

### Features:
- ✅ Free (10,000 characters per day)
- ✅ No API key required
- ✅ Supports 100+ languages
- ✅ Automatic chunking for long texts

### Usage:

**Endpoint:** `POST /api/geolocation/translate`

**Request Body:**
```json
{
  "content": "Hello, this is a beautiful artwork",
  "targetLanguage": "hi",  // Hindi
  "sourceLanguage": "en"   // English
}
```

**Supported Languages:**
- `mr` - Marathi
- `hi` - Hindi
- `gu` - Gujarati
- `ta` - Tamil
- `kn` - Kannada
- `bn` - Bengali
- `te` - Telugu
- `ml` - Malayalam
- `pa` - Punjabi
- `or` - Odia
- `as` - Assamese
- And 100+ more languages

## Testing

### Test Vision API:

```bash
# Using curl
curl -X POST http://localhost:5000/api/ai/enhance-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUri": "https://example.com/test-image.jpg"
  }'
```

### Test Translation:

```bash
curl -X POST http://localhost:5000/api/geolocation/translate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, this is beautiful artwork",
    "targetLanguage": "hi",
    "sourceLanguage": "en"
  }'
```

## Troubleshooting

### Vision API Not Working?

1. **Check API Key:**
   - Verify `GOOGLE_VISION_API_KEY` is set in `server/.env`
   - Make sure there are no extra spaces

2. **Check API Quota:**
   - Free tier: 1,000 requests/month
   - Check quota in Google Cloud Console

3. **Check Image Format:**
   - Supported: JPEG, PNG, GIF, BMP, WEBP
   - Max size: 20MB
   - Base64 images should include data URL prefix

4. **Check Server Logs:**
   ```bash
   cd server
   npm start
   # Look for Vision API errors
   ```

### Translation Not Working?

1. **Check Language Codes:**
   - Use ISO 639-1 language codes (e.g., 'hi', 'mr', 'en')
   - See `server/services/geolocationService.js` for supported codes

2. **Check Content Length:**
   - MyMemory works best with texts under 500 characters
   - Long texts are automatically chunked

3. **Rate Limits:**
   - MyMemory: 10,000 characters/day (free)
   - If exceeded, wait 24 hours or use alternative

## Cost Information

### Google Vision API (Free Tier):
- **Free:** First 1,000 requests/month
- **After:** $1.50 per 1,000 requests
- **Text Detection:** Included
- **Label Detection:** Included
- **Object Detection:** Included

### Translation (MyMemory):
- **Free:** 10,000 characters/day
- **No credit card required**
- **No API key needed**

## Next Steps

1. ✅ Add your Vision API key to `server/.env`
2. ✅ Restart your server
3. ✅ Test with a sample image
4. ✅ Start using in your app!

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify API key is correct
3. Test with a simple image first
4. Check Google Cloud Console for quota/usage

