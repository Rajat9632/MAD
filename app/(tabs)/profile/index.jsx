import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../assets/Colors';
import { useAuth } from '../../../context/authContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';
import { useRouter, useFocusEffect } from 'expo-router';
import { usersAPI } from '../../../utils/api';
import ImageDisplay from '../../../components/ImageDisplay';
import { useCallback } from 'react';

export default function ProfileScreen() {
  const { user, logout, UpdateUserData } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Refresh data when screen comes into focus (e.g., after editing profile)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUserData();
      }
    }, [user])
  );

  const fetchUserData = async () => {
    try {
      if (!user) return;
      
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'USERS', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      // Fetch user posts count
      let postsCount = 0;
      try {
        const postsQuery = query(
          collection(db, 'POSTS'),
          where('userId', '==', user.uid)
        );
        const postsSnapshot = await getDocs(postsQuery);
        postsCount = postsSnapshot.size;
      } catch (err) {
        console.log('Error fetching posts:', err);
      }
      
      // Fetch user stats - try backend API first, fallback to Firestore
      try {
        const statsResponse = await usersAPI.getUserStats(user.uid);
        if (statsResponse.success) {
          setStats(statsResponse.data);
        } else {
          // Fallback to Firestore
          await fetchStatsFromFirestore(postsCount);
        }
      } catch (statsError) {
        console.log('Backend API not available - fetching stats from Firestore');
        // Fallback to Firestore directly
        await fetchStatsFromFirestore(postsCount);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsFromFirestore = async (postsCount) => {
    try {
      if (!user) return;
      
      // Fetch followers count
      let followersCount = 0;
      try {
        const followersDoc = await getDoc(doc(db, 'FOLLOWERS', user.uid));
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
        const followingDoc = await getDoc(doc(db, 'FOLLOWING', user.uid));
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
      setStats({ posts: postsCount || 0, followers: 0, following: 0 });
    }
  };

  const handleRoleSwitch = async () => {
    const currentRole = userData?.Role;
    const newRole = currentRole === 'Artist' ? 'Buyer' : 'Artist';
    
    Alert.alert(
      'Switch Role',
      `Are you sure you want to switch from ${currentRole} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              await UpdateUserData({
                Role: newRole,
                updatedAt: new Date().toISOString()
              });
              // Refresh user data
              fetchUserData();
              Alert.alert('Success', `Role switched to ${newRole}`);
            } catch (error) {
              console.error('Role switch error:', error);
              Alert.alert('Error', 'Failed to switch role. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#111811" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <ImageDisplay
            source={userData?.ProfileImage || require('../../../assets/images/avtar.png')}
            style={styles.avatar}
          />
          <Text style={styles.name}>{userData?.UserName || 'User'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userData?.Role === 'Artist' ? '🎨 Artist' : userData?.Role === 'Buyer' ? '🛍️ Buyer' : '👤 User'}
            </Text>
          </View>
          
          {/* Role Switch Button */}
          <TouchableOpacity
            style={styles.roleSwitchButton}
            onPress={handleRoleSwitch}
          >
            <Ionicons 
              name={userData?.Role === 'Artist' ? 'storefront-outline' : 'brush-outline'} 
              size={18} 
              color={Colors.bttn} 
            />
            <Text style={styles.roleSwitchText}>
              Switch to {userData?.Role === 'Artist' ? 'Buyer' : 'Artist'}
            </Text>
          </TouchableOpacity>
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
            onPress={() => user && router.push(`/(tabs)/profile/follow-list?userId=${user.uid}&type=followers`)}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => user && router.push(`/(tabs)/profile/follow-list?userId=${user.uid}&type=following`)}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* Purchase Requests - Show based on role */}
          {userData?.Role === 'Artist' && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/profile/purchase-requests')}
            >
              <Ionicons name="bag-outline" size={24} color="#111811" />
              <Text style={styles.menuText}>Purchase Requests</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          
          {userData?.Role === 'Buyer' && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/profile/my-purchases')}
            >
              <Ionicons name="receipt-outline" size={24} color="#111811" />
              <Text style={styles.menuText}>My Purchases</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/edit-profile')}
          >
            <Ionicons name="person-outline" size={24} color="#111811" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#111811" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/settings')}
          >
            <Ionicons name="notifications-outline" size={24} color="#111811" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/help')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#111811" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/profile/about')}
          >
            <Ionicons name="information-circle-outline" size={24} color="#111811" />
            <Text style={styles.menuText}>About ArtConnect</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
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
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
  },
  roleSwitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  roleSwitchText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.bttn,
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
  menuContainer: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#111811',
    marginLeft: 16,
  },
});
