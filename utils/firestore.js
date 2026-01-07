// Firestore Utilities - Direct Firestore operations for posts

import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  startAfter,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';

/**
 * Create a new post in Firestore
 */
export const createPost = async (postData) => {
  try {
    const post = {
      ...postData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      likedBy: [],
      commentsList: [],
    };
    
    const docRef = await addDoc(collection(db, 'POSTS'), post);
    return { id: docRef.id, ...post };
  } catch (error) {
    console.error('Create post error:', error);
    throw new Error('Failed to create post');
  }
};

/**
 * Get posts feed from Firestore
 */
export const getPosts = async (postsLimit = 20, lastDoc = null) => {
  try {
    let q = query(
      collection(db, 'POSTS'),
      orderBy('createdAt', 'desc'),
      limit(postsLimit)
    );
    
    if (lastDoc) {
      const lastDocSnap = await getDoc(doc(db, 'POSTS', lastDoc));
      if (lastDocSnap.exists()) {
        q = query(q, startAfter(lastDocSnap));
      }
    }
    
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    return posts;
  } catch (error) {
    console.error('Get posts error:', error);
    throw new Error('Failed to fetch posts');
  }
};

/**
 * Get post by ID
 */
export const getPostById = async (postId) => {
  try {
    const docRef = doc(db, 'POSTS', postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Get post error:', error);
    throw new Error('Failed to fetch post');
  }
};

/**
 * Update post
 */
export const updatePost = async (postId, updateData) => {
  try {
    const docRef = doc(db, 'POSTS', postId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    
    return await getPostById(postId);
  } catch (error) {
    console.error('Update post error:', error);
    throw new Error('Failed to update post');
  }
};

/**
 * Delete post
 */
export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, 'POSTS', postId));
    return true;
  } catch (error) {
    console.error('Delete post error:', error);
    throw new Error('Failed to delete post');
  }
};

/**
 * Like a post
 */
export const likePost = async (postId, userId) => {
  try {
    const docRef = doc(db, 'POSTS', postId);
    const post = await getPostById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    const isLiked = post.likedBy?.includes(userId);
    
    await updateDoc(docRef, {
      likes: isLiked ? increment(-1) : increment(1),
      likedBy: isLiked
        ? arrayRemove(userId)
        : arrayUnion(userId),
    });
    
    return !isLiked;
  } catch (error) {
    console.error('Like post error:', error);
    throw new Error('Failed to like post');
  }
};

/**
 * Add comment to a post
 */
export const addComment = async (postId, userId, userName, commentText) => {
  try {
    const docRef = doc(db, 'POSTS', postId);
    const comment = {
      id: Date.now().toString(),
      userId,
      userName,
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    
    await updateDoc(docRef, {
      comments: increment(1),
      commentsList: arrayUnion(comment),
    });
    
    return comment;
  } catch (error) {
    console.error('Add comment error:', error);
    throw new Error('Failed to add comment');
  }
};

/**
 * Share a post
 */
export const sharePost = async (postId) => {
  try {
    const docRef = doc(db, 'POSTS', postId);
    await updateDoc(docRef, {
      shares: increment(1),
    });
    
    return true;
  } catch (error) {
    console.error('Share post error:', error);
    throw new Error('Failed to share post');
  }
};
