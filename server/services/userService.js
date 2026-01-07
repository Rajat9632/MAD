// User Service - Firestore user management

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

// Get user by ID
async function getUserById(userId) {
  try {
    if (db) {
      const userDoc = await db.collection('USERS').doc(userId).get();
      if (!userDoc.exists) {
        return null;
      }
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Get user error:', error);
    throw new Error('Failed to fetch user');
  }
}

// Update user data
async function updateUser(userId, updateData) {
  try {
    if (db) {
      await db.collection('USERS').doc(userId).update({
        ...updateData,
        updatedAt: admin.firestore?.FieldValue?.serverTimestamp() || new Date().toISOString()
      });
      return await getUserById(userId);
    } else {
      return { id: userId, ...updateData };
    }
  } catch (error) {
    console.error('Update user error:', error);
    throw new Error('Failed to update user');
  }
}

// Get user stats (posts count, followers, following)
async function getUserStats(userId) {
  try {
    if (db) {
      // Get posts count
      const postsSnapshot = await db.collection('POSTS')
        .where('userId', '==', userId)
        .get();
      const postsCount = postsSnapshot.size;

      // Get followers count (if you have a FOLLOWERS collection)
      let followersCount = 0;
      try {
        const followersDoc = await db.collection('FOLLOWERS').doc(userId).get();
        if (followersDoc.exists) {
          const followersData = followersDoc.data();
          followersCount = followersData.followers?.length || 0;
        }
      } catch (err) {
        // Followers collection might not exist yet
        console.log('Followers collection not found, defaulting to 0');
      }

      // Get following count
      let followingCount = 0;
      try {
        const followingDoc = await db.collection('FOLLOWING').doc(userId).get();
        if (followingDoc.exists) {
          const followingData = followingDoc.data();
          followingCount = followingData.following?.length || 0;
        }
      } catch (err) {
        // Following collection might not exist yet
        console.log('Following collection not found, defaulting to 0');
      }

      return {
        posts: postsCount,
        followers: followersCount,
        following: followingCount
      };
    } else {
      return {
        posts: 0,
        followers: 0,
        following: 0
      };
    }
  } catch (error) {
    console.error('Get user stats error:', error);
    throw new Error('Failed to fetch user stats');
  }
}

// Get user posts
async function getUserPosts(userId, limit = 20, lastDocId = null) {
  try {
    if (db) {
      let query = db.collection('POSTS')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      if (lastDocId) {
        const lastDoc = await db.collection('POSTS').doc(lastDocId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Get user posts error:', error);
    throw new Error('Failed to fetch user posts');
  }
}

// Search users by username or email
async function searchUsers(searchTerm, limit = 20) {
  try {
    if (db) {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic prefix search on UserName field
      const usersSnapshot = await db.collection('USERS')
        .where('UserName', '>=', searchTerm)
        .where('UserName', '<=', searchTerm + '\uf8ff')
        .limit(limit)
        .get();
      
      return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Search users error:', error);
    throw new Error('Failed to search users');
  }
}

module.exports = {
  getUserById,
  updateUser,
  getUserStats,
  getUserPosts,
  searchUsers
};

