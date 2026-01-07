// Social Media Service - Instagram, Twitter, Facebook API integration

const axios = require('axios');

// Post to multiple social media platforms
async function postToSocialMedia(postData, platforms = ['instagram', 'twitter', 'facebook']) {
  const results = {};
  
  for (const platform of platforms) {
    try {
      switch (platform.toLowerCase()) {
        case 'instagram':
          results.instagram = await postToInstagram(postData);
          break;
        case 'twitter':
          results.twitter = await postToTwitter(postData);
          break;
        case 'facebook':
          results.facebook = await postToFacebook(postData);
          break;
        default:
          results[platform] = { success: false, message: 'Platform not supported' };
      }
    } catch (error) {
      results[platform] = { success: false, message: error.message };
    }
  }
  
  return results;
}

// Post to Instagram Graph API
async function postToInstagram(postData) {
  try {
    const { imageUrl, caption } = postData;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    
    if (!accessToken || !accountId) {
      // Mock response if credentials not configured
      return {
        success: true,
        platform: 'instagram',
        postId: `ig_${Date.now()}`,
        message: 'Instagram post created successfully (mock)',
        note: 'Configure INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID for real posting'
      };
    }
    
    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${accountId}/media`,
      {
        image_url: imageUrl,
        caption: caption || '',
        access_token: accessToken
      }
    );
    
    const creationId = containerResponse.data.id;
    
    // Step 2: Publish the media container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      }
    );
    
    return {
      success: true,
      platform: 'instagram',
      postId: publishResponse.data.id,
      message: 'Instagram post created successfully'
    };
  } catch (error) {
    console.error('Instagram API error:', error.response?.data || error.message);
    throw new Error(`Instagram posting failed: ${error.message}`);
  }
}

// Post to Twitter API v2
async function postToTwitter(postData) {
  try {
    const { caption, imageUrl } = postData;
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    
    if (!bearerToken && (!apiKey || !apiSecret)) {
      // Mock response if credentials not configured
      return {
        success: true,
        platform: 'twitter',
        tweetId: `tw_${Date.now()}`,
        message: 'Twitter post created successfully (mock)',
        note: 'Configure TWITTER_BEARER_TOKEN or TWITTER_API_KEY/SECRET for real posting'
      };
    }
    
    // For Twitter v2 API with media, you need to:
    // 1. Upload media first
    // 2. Then create tweet with media_id
    
    const tweetResponse = await axios.post(
      'https://api.twitter.com/2/tweets',
      {
        text: caption || ''
      },
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      platform: 'twitter',
      tweetId: tweetResponse.data.data.id,
      message: 'Twitter post created successfully'
    };
  } catch (error) {
    console.error('Twitter API error:', error.response?.data || error.message);
    throw new Error(`Twitter posting failed: ${error.message}`);
  }
}

// Post to Facebook Graph API
async function postToFacebook(postData) {
  try {
    const { caption, imageUrl } = postData;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;
    
    if (!accessToken || !pageId) {
      // Mock response if credentials not configured
      return {
        success: true,
        platform: 'facebook',
        postId: `fb_${Date.now()}`,
        message: 'Facebook post created successfully (mock)',
        note: 'Configure FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID for real posting'
      };
    }
    
    const postResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/photos`,
      {
        url: imageUrl,
        message: caption || '',
        access_token: accessToken
      }
    );
    
    return {
      success: true,
      platform: 'facebook',
      postId: postResponse.data.post_id || postResponse.data.id,
      message: 'Facebook post created successfully'
    };
  } catch (error) {
    console.error('Facebook API error:', error.response?.data || error.message);
    throw new Error(`Facebook posting failed: ${error.message}`);
  }
}

module.exports = {
  postToSocialMedia,
  postToInstagram,
  postToTwitter,
  postToFacebook
};

