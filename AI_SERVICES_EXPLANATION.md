# AI Services Used for Caption and Story Generation

## Overview
The caption and story generation system uses a **two-tier approach**:

1. **Primary: Google Cloud Vision API** - For image analysis
2. **Secondary (Optional): OpenAI GPT-4** - For enhanced, creative text generation

## How It Works

### 1. Image Analysis (Always Used)
- **Service**: Google Cloud Vision API
- **Purpose**: Analyzes the image to extract:
  - Labels (what's in the image)
  - Objects (specific items detected)
  - Text (any text found in the image)
  - Colors (dominant color palette)
  - Properties (image characteristics)

### 2. Caption Generation

**Option A: With OpenAI API Key (Recommended)**
- Uses **OpenAI GPT-4o-mini** to generate creative, engaging captions
- Takes Vision API analysis as input
- Creates unique, contextual captions based on the image

**Option B: Without OpenAI API Key (Fallback)**
- Uses **Enhanced Template-Based Generation**
- Still uses Vision API analysis
- Creates captions based on detected labels, objects, and colors
- More structured but still contextual

### 3. Story Generation

**Option A: With OpenAI API Key (Recommended)**
- Uses **OpenAI GPT-4o-mini** to generate unique, narrative-driven stories
- Takes Vision API analysis + artwork details as input
- Creates engaging, personalized stories for each artwork
- Each story is unique and tailored to the specific artwork

**Option B: Without OpenAI API Key (Fallback)**
- Uses **Enhanced Template-Based Generation**
- Uses Vision API analysis to create unique stories
- Incorporates detected elements, colors, objects, and craft types
- More dynamic than before, but less creative than AI-generated

## Current Issues Fixed

### Issue 1: Garbled Text in Captions ✅
**Problem**: Vision API was detecting partial/garbled text and including it in captions
**Solution**: 
- Added `extractMeaningfulText()` function
- Filters out garbled text based on:
  - Letter ratio (must be >40% letters)
  - Word count (minimum 3 words)
  - Special character ratio (<30%)
  - Pattern detection (garbled patterns)
- Only includes meaningful, readable text

### Issue 2: Repetitive Stories ✅
**Problem**: Stories were too generic and repeated for all artworks
**Solution**:
- Enhanced template to use more image analysis data
- Creates unique stories based on:
  - Detected craft type (ceramic, textile, wood, etc.)
  - Specific labels and objects
  - Color palette and mood
  - Materials and techniques
- Each story is now more unique to the artwork

## API Services Summary

| Service | Purpose | Required? | Cost |
|---------|---------|-----------|------|
| **Google Cloud Vision API** | Image analysis (labels, objects, text, colors) | ✅ Yes | Pay-per-use |
| **OpenAI GPT-4o-mini** | Enhanced caption/story generation | ⚠️ Optional | Pay-per-token |

## Setup

### Required
1. **Google Cloud Vision API Key**
   - Set `GOOGLE_VISION_API_KEY` in `server/.env`
   - Get from: https://console.cloud.google.com/apis/credentials

### Optional (Recommended)
2. **OpenAI API Key**
   - Set `OPENAI_API_KEY` in `server/.env`
   - Get from: https://platform.openai.com/api-keys
   - Enables more creative, unique captions and stories

## How to Get Better Results

1. **Add OpenAI API Key**: This will make captions and stories much more creative and unique
2. **Provide Context**: When generating, include materials, techniques, and region info
3. **Use Good Quality Images**: Better images = better Vision API analysis = better results

## Technical Details

### Text Filtering Logic
The `extractMeaningfulText()` function:
- Checks if text is mostly readable (letter ratio)
- Ensures minimum word count
- Filters out garbled patterns
- Removes text with too many special characters

### Story Uniqueness
Stories are now unique because they:
- Use detected craft type (ceramic, textile, wood, etc.)
- Reference specific visual elements from image analysis
- Incorporate color palette and mood
- Vary based on materials and techniques provided
- Use different opening/closing based on detected content
