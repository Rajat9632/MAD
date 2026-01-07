// Users Routes - User profile and management

const express = require('express');
const router = express.Router();
const { getUserById, updateUser, getUserStats, getUserPosts, searchUsers } = require('../services/userService');

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated via API
    delete updateData.UUID;
    delete updateData.createdAt;
    
    const user = await updateUser(userId, updateData);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user stats (posts, followers, following)
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await getUserStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user posts
router.get('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, lastDocId } = req.query;
    const posts = await getUserPosts(userId, parseInt(limit), lastDocId);
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search users
router.get('/search/:searchTerm', async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const { limit = 20 } = req.query;
    const users = await searchUsers(searchTerm, parseInt(limit));
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

