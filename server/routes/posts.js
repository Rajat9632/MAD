// Posts Routes - Firestore post management

const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, updatePost, deletePost } = require('../services/postService');

// Create a new post
router.post('/create', async (req, res) => {
  try {
    const postData = req.body;
    const post = await createPost(postData);
    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all posts (feed)
router.get('/feed', async (req, res) => {
  try {
    const { limit = 20, lastDocId } = req.query;
    const posts = await getPosts(parseInt(limit), lastDocId);
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get post by ID
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await getPostById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update post
router.put('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const updateData = req.body;
    const post = await updatePost(postId, updateData);
    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete post
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    await deletePost(postId);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

