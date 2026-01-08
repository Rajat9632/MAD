import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../assets/Colors';
import ImageDisplay from '../../../components/ImageDisplay';
import { useAuth } from '../../../context/authContext';
import { db } from '../../../FirebaseConfig';
import { usersAPI } from '../../../utils/api';

export default function UserProfileScreen() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      checkFollowStatus();
    }
  }, [userId, currentUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'USERS', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }
      
      // Fetch user posts
      const postsQuery = query(
        collection(db, 'POSTS'),
        where('userId', '==', userId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserPosts(posts);
      
      // Fetch user stats - try backend API first, fallback to Firestore
      try {
        const statsResponse = await usersAPI.getUserStats(userId);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        } else {
          // Fallback to Firestore
          await fetchStatsFromFirestore(posts.length);
        }
      } catch (statsError) {
        console.log('Backend API not available - fetching stats from Firestore');
        // Fallback to Firestore directly
        await fetchStatsFromFirestore(posts.length);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsFromFirestore = async (postsCount) => {
    try {
      // Fetch followers count
      let followersCount = 0;
      try {
        const followersDoc = await getDoc(doc(db, 'FOLLOWERS', userId));
        if (followersDoc.exists()) {
          const followersData = followersDoc.data();
          followersCount = followersData.followers?.length || 0;
        }
      } catch (err) {
        console.log('Error fetching followers:', err);
      }

      // Fetch following count
      let followingCount = 0;
      try {
        const followingDoc = await getDoc(doc(db, 'FOLLOWING', userId));
        if (followingDoc.exists()) {
          const followingData = followingDoc.data();
          followingCount = followingData.following?.length || 0;
        }
      } catch (err) {
        console.log('Error fetching following:', err);
      }

      setStats({
        posts: postsCount,
        followers: followersCount,
        following: followingCount
      });
    } catch (error) {
      console.error('Error fetching stats from Firestore:', error);
      setStats({ posts: postsCount, followers: 0, following: 0 });
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !userId || currentUser.uid === userId) return;
    
    try {
      const followingDoc = await getDoc(doc(db, 'FOLLOWING', currentUser.uid));
      if (followingDoc.exists()) {
        const followingList = followingDoc.data().following || [];
        setIsFollowing(followingList.includes(userId));
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to follow users');
      return;
    }

    if (currentUser.uid === userId) {
      Alert.alert('Error', 'You cannot follow yourself');
      return;
    }

    try {
      const { arrayUnion, arrayRemove, updateDoc, setDoc } = await import('firebase/firestore');
      
      const currentUserId = currentUser.uid;
      const targetUserId = userId;
      
      if (isFollowing) {
        // Unfollow
        // Remove from current user's following list
        const followingRef = doc(db, 'FOLLOWING', currentUserId);
        const followingDoc = await getDoc(followingRef);
        if (followingDoc.exists()) {
          await updateDoc(followingRef, {
            following: arrayRemove(targetUserId)
          });
        }
        
        // Remove from target user's followers list
        const followersRef = doc(db, 'FOLLOWERS', targetUserId);
        const followersDoc = await getDoc(followersRef);
        if (followersDoc.exists()) {
          await updateDoc(followersRef, {
            followers: arrayRemove(currentUserId)
          });
        } else {
          await setDoc(followersRef, {
            followers: []
          });
        }
        
        setIsFollowing(false);
        // Refresh stats from Firestore after unfollow
        await fetchStatsFromFirestore(userPosts.length);
      } else {
        // Follow
        // Add to current user's following list
        const followingRef = doc(db, 'FOLLOWING', currentUserId);
        const followingDoc = await getDoc(followingRef);
        if (followingDoc.exists()) {
          await updateDoc(followingRef, {
            following: arrayUnion(targetUserId)
          });
        } else {
          await setDoc(followingRef, {
            following: [targetUserId]
          });
        }
        
        // Add to target user's followers list
        const followersRef = doc(db, 'FOLLOWERS', targetUserId);
        const followersDoc = await getDoc(followersRef);
        if (followersDoc.exists()) {
          await updateDoc(followersRef, {
            followers: arrayUnion(currentUserId)
          });
        } else {
          await setDoc(followersRef, {
            followers: [currentUserId]
          });
        }
        
        setIsFollowing(true);
        // Refresh stats from Firestore after follow
        await fetchStatsFromFirestore(userPosts.length);
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bttn} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111811" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <ImageDisplay
            source={userData?.ProfileImage || require('../../../assets/images/avtar.png')}
            style={styles.avatar}
          />
          <Text style={styles.name}>{userData?.UserName || 'User'}</Text>
          <Text style={styles.email}>{userData?.Email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userData?.Role === 'Artist' ? '🎨 Artist' : userData?.Role === 'Buyer' ? '🛍️ Buyer' : '👤 User'}
            </Text>
          </View>
          
          {/* Follow Button */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.posts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push(`/(tabs)/profile/follow-list?userId=${userId}&type=followers`)}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push(`/(tabs)/profile/follow-list?userId=${userId}&type=following`)}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        <View style={styles.postsSection}>
          <Text style={styles.postsSectionTitle}>Posts</Text>
          {userPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyPostsText}>No posts yet</Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {userPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postThumbnail}
                  onPress={() => {
                    router.push(`/(tabs)/post/${post.id}`);
                  }}
                >
                  <ImageDisplay
                    source={post.imageUrl || require('../../../assets/images/ppimg.png')}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111811',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#618961',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: Colors.bttn,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
  },
  followButton: {
    backgroundColor: Colors.bttn,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
  },
  followingButtonText: {
    color: '#618961',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#618961',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  postsSection: {
    padding: 16,
  },
  postsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 16,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  postThumbnail: {
    width: '32%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  emptyPosts: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#999',
  },
});
