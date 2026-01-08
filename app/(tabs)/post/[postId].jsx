import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchPostDetails();
    }
  }, [postId]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch post data
      const postDoc = await getDoc(doc(db, 'POSTS', postId));
      if (!postDoc.exists()) {
        router.back();
        return;
      }

      const postData = postDoc.data();
      setPost({ id: postDoc.id, ...postData });

      // Fetch user data
      if (postData.userId) {
        const userDoc = await getDoc(doc(db, 'USERS', postData.userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
    } finally {
      setLoading(false);
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

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info */}
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => {
            if (!post.userId) return;
            
            // If it's the current user's profile, go to own profile tab
            if (post.userId === user?.uid) {
              router.push('/(tabs)/profile');
            } else {
              // Otherwise, go to the user's profile page
              router.push(`/(tabs)/profile/${post.userId}`);
            }
          }}
        >
          <ImageDisplay
            source={userData?.ProfileImage || require('../../../assets/images/avtar.png')}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userData?.UserName || 'User'}</Text>
            {userData?.Email && (
              <Text style={styles.userEmail}>{userData.Email}</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Post Image */}
        {post.imageUrl && (
          <View style={styles.imageContainer}>
            <ImageDisplay source={post.imageUrl} style={styles.postImage} />
          </View>
        )}

        {/* Post Content */}
        <View style={styles.postContent}>
          {post.title && (
            <Text style={styles.title}>{post.title}</Text>
          )}
          {(post.description || post.story || post.caption) && (
            <Text style={styles.description}>
              {post.description || post.story || post.caption}
            </Text>
          )}
          
          {post.materials && (
            <View style={styles.metaSection}>
              <Text style={styles.metaLabel}>Materials:</Text>
              <Text style={styles.metaValue}>{post.materials}</Text>
            </View>
          )}
          
          {post.techniques && (
            <View style={styles.metaSection}>
              <Text style={styles.metaLabel}>Techniques:</Text>
              <Text style={styles.metaValue}>{post.techniques}</Text>
            </View>
          )}

          {/* For Sale Badge */}
          {post.isForSale && post.price && (
            <View style={styles.priceContainer}>
              <View style={styles.saleBadge}>
                <Ionicons name="pricetag" size={16} color="#fff" />
                <Text style={styles.saleText}>For Sale</Text>
              </View>
              <Text style={styles.priceText}>₹{post.price.toLocaleString()}</Text>
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
  content: {
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#618961',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  postContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaSection: {
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#618961',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  saleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bttn,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  saleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111811',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111811',
  },
});
