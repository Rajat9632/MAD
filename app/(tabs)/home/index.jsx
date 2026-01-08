import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../../assets/Colors';
import CommentModal from '../../../components/CommentModal';
import ImageDisplay from '../../../components/ImageDisplay';
import { useAuth } from '../../../context/authContext';
import { deletePost, getPosts, likePost } from '../../../utils/firestore';

const Icon = ({ name, size = 24, color = Colors.bttn }) => {
  const iconMap = {
    heart: 'heart-outline',
    'heart-filled': 'heart',
    chat: 'chatbubble-outline',
    share: 'share-outline',
    menu: 'menu',
    search: 'search',
  };
  
  return (
    <Ionicons 
      name={iconMap[name] || name} 
      size={size} 
      color={color || '#111811'} 
    />
  );
};
const ArtisanPost = ({
  id,
  profileImage,
  name,
  username,
  postImage,
  description,
  likes = 0,
  comments = 0,
  shares = 0,
  likedBy = [],
  userId,
  postUserId,
  onLike,
  onComment,
  onShare,
  onDelete,
  onViewProfile,
  onBuy,
  isForSale = false,
  price = null,
  currentUserId,
}) => {
  const isLiked = likedBy?.includes(userId);
  
  return (
    <View style={styles.postContainer}>
      <View style={styles.profileRow}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
          onPress={() => onViewProfile && onViewProfile(postUserId)}
        >
          <ImageDisplay
            source={profileImage || require('../../../assets/images/avtar.png')}
            style={styles.profileImage}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.profileName}>{name || 'Artist'}</Text>
            <Text style={styles.profileUsername}>{username || '@artist'}</Text>
          </View>
        </TouchableOpacity>
        {currentUserId === postUserId && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.postImageContainer}>
        {postImage ? (
          <ImageDisplay
            source={postImage}
            style={styles.postImage}
          />
        ) : (
          <View style={[styles.postImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#999' }}>No image</Text>
          </View>
        )}
      </View>
      <Text style={styles.postDescription}>{description || ''}</Text>
      
      {/* For Sale Badge and Price */}
      {isForSale && price && (
        <View style={styles.saleContainer}>
          <View style={styles.saleBadge}>
            <Ionicons name="pricetag" size={16} color="#fff" />
            <Text style={styles.saleText}>For Sale</Text>
          </View>
          <Text style={styles.priceText}>₹{price.toLocaleString()}</Text>
        </View>
      )}
      
      <View style={styles.interactionRow}>
        <TouchableOpacity 
          style={styles.interactionItem}
          onPress={() => onLike && onLike(id)}
        >
          <Icon name={isLiked ? 'heart-filled' : 'heart'} color={isLiked ? '#e74c3c' : Colors.bttn} />
          <Text style={styles.interactionText}>{likes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.interactionItem}
          onPress={() => onComment && onComment(id)}
        >
          <Icon name="chat" />
          <Text style={styles.interactionText}>{comments || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.interactionItem}
          onPress={() => onShare && onShare(id)}
        >
          <Icon name="share" />
          <Text style={styles.interactionText}>{shares || 0}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Buy Button - Only show if for sale and not the owner */}
      {isForSale && price && currentUserId !== postUserId && (
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => onBuy && onBuy(id, price, name)}
        >
          <Ionicons name="cart" size={20} color="#fff" />
          <Text style={styles.buyButtonText}>Buy Now - ₹{price.toLocaleString()}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
};
export default function ArtConnectApp() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const handleViewProfile = (userId) => {
    if (userId && userId !== user?.uid) {
      router.push(`/profile/${userId}`);
    } else if (userId === user?.uid) {
      router.push('/profile');
    }
  };

  const handleBuy = (postId, price, artistName) => {
    router.push({
      pathname: '/post/purchase',
      params: {
        postId,
        price: price.toString(),
        artistName,
      },
    });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await getPosts(20);
      
      // Enhance posts with user profile data if missing
      const enhancedPosts = await Promise.all(
        (fetchedPosts || []).map(async (post) => {
          // If post doesn't have profileImage, try to fetch from user document
          if (!post.profileImage && !post.ProfileImage && post.userId) {
            try {
              const { doc, getDoc } = await import('firebase/firestore');
              const { db } = await import('../../../FirebaseConfig');
              const userDoc = await getDoc(doc(db, 'USERS', post.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...post,
                  profileImage: userData.ProfileImage || post.profileImage,
                  userName: userData.UserName || post.userName,
                  userEmail: userData.Email || post.userEmail,
                };
              }
            } catch (error) {
              console.log('Error fetching user data for post:', error);
            }
          }
          // Ensure counts are numbers, not undefined
          return {
            ...post,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            likedBy: post.likedBy || [],
            commentsList: post.commentsList || [],
          };
        })
      );
      
      setPosts(enhancedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Fallback to empty array if error
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleLike = async (postId) => {
    if (!user) return;
    
    try {
      // Optimistically update UI first
      const currentPost = posts.find(p => p.id === postId);
      const isLiked = currentPost?.likedBy?.includes(user.uid);
      
      // Update local state immediately for better UX
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isLiked ? Math.max(0, (post.likes || 1) - 1) : (post.likes || 0) + 1,
            likedBy: isLiked
              ? (post.likedBy || []).filter(id => id !== user.uid)
              : [...(post.likedBy || []), user.uid],
          };
        }
        return post;
      }));

      // Then update in Firestore
      await likePost(postId, user.uid);
      
      // Refresh posts to get accurate counts from Firestore
      setTimeout(() => {
        fetchPosts();
      }, 500);
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update on error
      fetchPosts();
    }
  };

  const handleComment = async (postId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }
    setSelectedPostId(postId);
    setCommentModalVisible(true);
  };

  const handleCommentAdded = () => {
    // Refresh posts to get updated comment count
    setTimeout(() => {
      fetchPosts();
    }, 300);
  };

  const handleShare = async (postId) => {
    if (!user) return;
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Share using React Native Share API
      const shareContent = {
        message: `${post.title || 'Check out this artwork'}\n\n${post.description || post.story || ''}\n\nShared from ArtConnect`,
        url: post.imageUrl || '',
      };

      const result = await Share.share(shareContent);

      // Only increment share count if share was successful
      if (result.action === Share.sharedAction) {
        try {
          // Optimistically update UI
          setPosts(posts.map(p => 
            p.id === postId 
              ? { ...p, shares: (p.shares || 0) + 1 }
              : p
          ));

          const { sharePost } = await import('../../../utils/firestore');
          await sharePost(postId);
          
          // Refresh posts to get accurate counts
          setTimeout(() => {
            fetchPosts();
          }, 500);
        } catch (error) {
          console.error('Error updating share count:', error);
          // Revert on error
          fetchPosts();
        }
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      // Don't show error for user cancellation
      if (error.message !== 'User did not share') {
        Alert.alert('Error', 'Failed to share post');
      }
    }
  };

  const handleDelete = async (postId) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Only allow deletion of own posts
    if (post.userId !== user.uid) {
      Alert.alert('Error', 'You can only delete your own posts');
      return;
    }

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              // Remove from local state
              setPosts(posts.filter(p => p.id !== postId));
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => {
            Alert.alert(
              'Menu',
              'Choose an option',
              [
                { text: 'Profile', onPress: () => router.push('/profile') },
                { text: 'Settings', onPress: () => router.push('/profile/settings') },
                { text: 'Help', onPress: () => router.push('/profile/help') },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Icon name="menu" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ARTCONNECT</Text>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.push('/(tabs)/home/search')}
        >
          <Icon name="search" size={24} color="#111811" />
        </TouchableOpacity>
      </View>
      {/* Scrollable content */}
      {loading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bttn} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Be the first to share your artwork!</Text>
            </View>
          ) : (
            posts.map((post) => (
              <ArtisanPost
                key={post.id}
                id={post.id}
                profileImage={post.profileImage || post.ProfileImage}
                name={post.userName || post.artistName || 'Artist'}
                username={post.username || post.userEmail || `@${(post.userName || 'artist').toLowerCase().replace(/\s+/g, '_')}`}
                postImage={post.imageUrl}
                description={post.description || post.caption || post.story}
                likes={post.likes || 0}
                comments={post.comments || 0}
                shares={post.shares || 0}
                likedBy={post.likedBy || []}
                userId={user?.uid}
                postUserId={post.userId}
                currentUserId={user?.uid}
                onLike={handleLike}
                onComment={() => handleComment(post.id)}
                onShare={() => handleShare(post.id)}
                onDelete={handleDelete}
                onViewProfile={handleViewProfile}
                onBuy={handleBuy}
                isForSale={post.isForSale || false}
                price={post.price || null}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Comment Modal */}
      <CommentModal
        visible={commentModalVisible}
        onClose={() => {
          setCommentModalVisible(false);
          setSelectedPostId(null);
        }}
        postId={selectedPostId}
        onCommentAdded={handleCommentAdded}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    fontFamily: 'Be Vietnam Pro, Noto Sans, sans-serif', // Note: React Native doesn't support web fonts directly
  },
  header: {
    marginTop: 25,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomColor: '#f0f4f0',
    borderBottomWidth: 1,
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111811',
    flex: 1,
    textAlign: 'center',
  },
  postContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eee',
  },
  deleteButton: {
    padding: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
  },
  profileUsername: {
    fontSize: 14,
    color: '#618961',
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 3 / 2,
    backgroundColor: '#ddd',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  postDescription: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111811',
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopColor: '#f0f4f0',
    borderTopWidth: 1,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#618961',
  },
  visualPreviewContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  visualPreviewButton: {
    backgroundColor: '#618961',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  visualPreviewText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopColor: '#f0f4f0',
    borderTopWidth: 1,
    backgroundColor: '#fff',
    paddingVertical: 8,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#618961',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#618961',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#618961',
    textAlign: 'center',
  },
  saleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bttn,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  saleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111811',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111811',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bttn,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
    gap: 8,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
  },
});
