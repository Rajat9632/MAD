// Post Service - Firestore post management

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
  } catch (error) {
    console.warn('Firebase Admin not initialized - using client SDK:', error.message);
  }
}

const db = admin.firestore ? admin.firestore() : null;

// Create a new post
async function createPost(postData) {
  try {
    const post = {
      ...postData,
      createdAt: admin.firestore?.FieldValue?.serverTimestamp() || new Date().toISOString(),
      updatedAt: admin.firestore?.FieldValue?.serverTimestamp() || new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      likedBy: [],
      commentsList: []
    };

    if (db) {
      const docRef = await db.collection('POSTS').add(post);
      return { id: docRef.id, ...post };
    } else {
      // Fallback: return mock data if Firestore not available
      return { id: `post_${Date.now()}`, ...post };
    }
  } catch (error) {
    console.error('Create post error:', error);
    throw new Error('Failed to create post');
  }
}

// Get all posts (feed)
async function getPosts(limit = 20, lastDocId = null) {
  try {
    if (db) {
      let query = db.collection('POSTS').orderBy('createdAt', 'desc').limit(limit);
      
      if (lastDocId) {
        const lastDoc = await db.collection('POSTS').doc(lastDocId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Fallback: return empty array
      return [];
    }
  } catch (error) {
    console.error('Get posts error:', error);
    throw new Error('Failed to fetch posts');
  }
}

// Get post by ID
async function getPostById(postId) {
  try {
    if (db) {
      const doc = await db.collection('POSTS').doc(postId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Get post error:', error);
    throw new Error('Failed to fetch post');
  }
}

// Update post
async function updatePost(postId, updateData) {
  try {
    if (db) {
      await db.collection('POSTS').doc(postId).update({
        ...updateData,
        updatedAt: admin.firestore?.FieldValue?.serverTimestamp() || new Date().toISOString()
      });
      return await getPostById(postId);
    } else {
      return { id: postId, ...updateData };
    }
  } catch (error) {
    console.error('Update post error:', error);
    throw new Error('Failed to update post');
  }
}

// Delete post
async function deletePost(postId) {
  try {
    if (db) {
      await db.collection('POSTS').doc(postId).delete();
      return true;
    } else {
      return true;
    }
  } catch (error) {
    console.error('Delete post error:', error);
    throw new Error('Failed to delete post');
  }
}

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
};

