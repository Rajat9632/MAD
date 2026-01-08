import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../assets/Colors';
import ImageDisplay from '../../../components/ImageDisplay';
import { db } from '../../../FirebaseConfig';

export default function FollowListScreen() {
  const router = useRouter();
  const { userId, type } = useLocalSearchParams(); // type: 'followers' or 'following'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (userId && type) {
      fetchUserData();
      fetchFollowList();
    }
  }, [userId, type]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'USERS', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchFollowList = async () => {
    try {
      setLoading(true);
      let userIds = [];

      if (type === 'followers') {
        // Fetch followers list
        const followersDoc = await getDoc(doc(db, 'FOLLOWERS', userId));
        if (followersDoc.exists()) {
          userIds = followersDoc.data().followers || [];
        }
      } else if (type === 'following') {
        // Fetch following list
        const followingDoc = await getDoc(doc(db, 'FOLLOWING', userId));
        if (followingDoc.exists()) {
          userIds = followingDoc.data().following || [];
        }
      }

      // Fetch user data for each user ID
      const usersData = [];
      for (const uid of userIds) {
        try {
          const userDoc = await getDoc(doc(db, 'USERS', uid));
          if (userDoc.exists()) {
            usersData.push({
              id: uid,
              ...userDoc.data(),
            });
          }
        } catch (error) {
          console.error(`Error fetching user ${uid}:`, error);
        }
      }

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching follow list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (targetUserId) => {
    if (targetUserId === userId) {
      router.back();
    } else {
      router.push(`/(tabs)/profile/${targetUserId}`);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item.id)}
    >
      <ImageDisplay
        source={item.ProfileImage || require('../../../assets/images/avtar.png')}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.UserName || 'User'}</Text>
        <Text style={styles.userEmail}>{item.Email || ''}</Text>
        {item.Role && (
          <Text style={styles.userRole}>
            {item.Role === 'Artist' ? '🎨 Artist' : item.Role === 'Buyer' ? '🛍️ Buyer' : '👤 User'}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111811" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {type === 'followers' ? 'Followers' : 'Following'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bttn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'followers' ? 'Followers' : 'Following'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {userData && (
        <View style={styles.userHeader}>
          <ImageDisplay
            source={userData.ProfileImage || require('../../../assets/images/avtar.png')}
            style={styles.headerAvatar}
          />
          <Text style={styles.headerName}>{userData.UserName || 'User'}</Text>
        </View>
      )}

      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={type === 'followers' ? 'people-outline' : 'person-add-outline'}
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyText}>
            {type === 'followers'
              ? 'No followers yet'
              : 'Not following anyone yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
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
  userInfo: {
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
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
