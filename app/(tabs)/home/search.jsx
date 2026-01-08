import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../assets/Colors';
import { useAuth } from '../../../context/authContext';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';
import ImageDisplay from '../../../components/ImageDisplay';

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('posts'); // 'posts' or 'users'

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const queryLower = searchQuery.toLowerCase().trim();

      if (searchType === 'posts') {
        // Search in posts
        const postsQuery = query(
          collection(db, 'POSTS'),
          orderBy('createdAt', 'desc')
        );
        const postsSnapshot = await getDocs(postsQuery);
        const posts = postsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(post => {
            const title = (post.title || '').toLowerCase();
            const description = (post.description || '').toLowerCase();
            const story = (post.story || '').toLowerCase();
            const materials = (post.materials || '').toLowerCase();
            const techniques = (post.techniques || '').toLowerCase();
            return (
              title.includes(queryLower) ||
              description.includes(queryLower) ||
              story.includes(queryLower) ||
              materials.includes(queryLower) ||
              techniques.includes(queryLower)
            );
          });
        setSearchResults(posts);
      } else {
        // Search in users
        const usersQuery = query(collection(db, 'USERS'));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(userDoc => {
            const userName = (userDoc.UserName || '').toLowerCase();
            const email = (userDoc.Email || '').toLowerCase();
            return userName.includes(queryLower) || email.includes(queryLower);
          });
        setSearchResults(users);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (userId) => {
    if (userId === user?.uid) {
      router.push('/profile');
    } else {
      router.push(`/profile/${userId}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, artists..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, searchType === 'posts' && styles.toggleButtonActive]}
          onPress={() => setSearchType('posts')}
        >
          <Text style={[styles.toggleText, searchType === 'posts' && styles.toggleTextActive]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, searchType === 'users' && styles.toggleButtonActive]}
          onPress={() => setSearchType('users')}
        >
          <Text style={[styles.toggleText, searchType === 'users' && styles.toggleTextActive]}>
            Artists
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bttn} />
        </View>
      ) : searchQuery.trim().length <= 2 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Start typing to search...</Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          {searchType === 'posts' ? (
            searchResults.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                onPress={() => {
                  // Navigate to post detail or show in modal
                  router.push('/(tabs)/home');
                }}
              >
                <ImageDisplay
                  source={post.imageUrl || require('../../../assets/images/ppimg.png')}
                  style={styles.postImage}
                />
                <View style={styles.postInfo}>
                  <Text style={styles.postTitle} numberOfLines={1}>
                    {post.title || 'Untitled'}
                  </Text>
                  <Text style={styles.postDescription} numberOfLines={2}>
                    {post.description || post.story || ''}
                  </Text>
                  <Text style={styles.postAuthor}>
                    By {post.userName || 'Artist'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            searchResults.map((userDoc) => (
              <TouchableOpacity
                key={userDoc.id}
                style={styles.userCard}
                onPress={() => handleViewProfile(userDoc.id)}
              >
                <ImageDisplay
                  source={userDoc.ProfileImage || require('../../../assets/images/avtar.png')}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userDoc.UserName || 'User'}</Text>
                  <Text style={styles.userEmail}>{userDoc.Email || ''}</Text>
                  <Text style={styles.userRole}>
                    {userDoc.Role === 'Artist' ? '🎨 Artist' : userDoc.Role === 'Buyer' ? '🛍️ Buyer' : '👤 User'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111811',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.bttn,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  toggleTextActive: {
    color: '#111811',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  resultsContainer: {
    padding: 16,
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  postImage: {
    width: 100,
    height: 100,
  },
  postInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 4,
  },
  postDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 12,
    color: '#618961',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#618961',
  },
});
