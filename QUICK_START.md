# Quick Start Guide - Vision API & Translation

## ✅ What's Been Set Up

1. **Google Vision API** - For image analysis and captioning
2. **MyMemory Translation API** - Free alternative to Google Translate (no billing required)
3. **All services integrated** and ready to use

## 🚀 Quick Setup (2 Steps)

### Step 1: Add Vision API Key

Add to `server/.env`:
```env
GOOGLE_VISION_API_KEY=your_vision_api_key_here
```

### Step 2: Restart Server
```bash
cd server
npm start
```

That's it! Everything else is already configured.

## 📖 How to Use

### In Your App (React Native)

#### 1. Generate Caption from Image
```javascript
import { aiAPI } from '../utils/api';

// When user picks an image
const response = await aiAPI.generateCaption(imageUri);
const caption = response.data.caption;
```

#### 2. Analyze Image
```javascript
const response = await aiAPI.enhanceImage(imageUri);
const labels = response.data.labels; // Array of detected labels
const objects = response.data.objects; // Detected objects
```

#### 3. Translate Content
```javascript
import { geolocationAPI } from '../utils/api';

const response = await geolocationAPI.translateContent(
  "Hello, this is beautiful artwork",
  "hi", // Target: Hindi
  "en"  // Source: English
);
const translated = response.data.translated;
```

## 🎯 Features Available

### Vision API Features:
- ✅ Label Detection (what's in the image)
- ✅ Object Detection (specific objects)
- ✅ Text Detection (OCR)
- ✅ Color Analysis
- ✅ Safe Search Detection
- ✅ Automatic Caption Generation

### Translation Features:
- ✅ Free (MyMemory API)
- ✅ 100+ languages supported
- ✅ Automatic chunking for long texts
- ✅ Regional language detection
- ✅ No API key needed

## 📝 Example Usage in Post Creation

The Vision API is already integrated in your post creation flow:

1. User picks an image
2. App calls `/api/ai/generate-caption` with the image
3. Vision API analyzes the image
4. Caption is auto-generated
5. User can edit and publish

## 🔍 Testing

Test Vision API:
```bash
curl -X POST http://localhost:5000/api/ai/enhance-image \
  -H "Content-Type: application/json" \
  -d '{"imageUri": "https://example.com/image.jpg"}'
```

Test Translation:
```bash
curl -X POST http://localhost:5000/api/geolocation/translate \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello", "targetLanguage": "hi", "sourceLanguage": "en"}'
```

## 💰 Costs

- **Vision API**: Free tier = 1,000 requests/month
- **Translation**: Completely free (MyMemory API)

## 📚 Full Documentation

See `VISION_API_SETUP.md` for detailed documentation.

