import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../assets/Colors';
import { useAuth } from '../../../context/authContext';
import { useRouter } from 'expo-router';
import { usersAPI } from '../../../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../../utils/mediaStorage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';

export default function EditProfileScreen() {
  const { user, UpdateUserData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    UserName: '',
    Email: '',
    Bio: '',
    Location: '',
    Website: '',
  });
  const [avatarUri, setAvatarUri] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Try backend API first
      try {
        const response = await usersAPI.getUserById(user.uid);
        if (response.success) {
          setUserData({
            UserName: response.data.UserName || '',
            Email: response.data.Email || user.email || '',
            Bio: response.data.Bio || '',
            Location: response.data.Location || '',
            Website: response.data.Website || '',
          });
          if (response.data.ProfileImage) {
            setAvatarUri(response.data.ProfileImage);
          }
          return;
        }
      } catch (apiError) {
        // Backend not available, load from Firestore directly
        console.log('Backend API not available, loading from Firestore');
      }

      // Fallback: Load from Firestore directly
      const userDoc = await getDoc(doc(db, 'USERS', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          UserName: data.UserName || '',
          Email: data.Email || user.email || '',
          Bio: data.Bio || '',
          Location: data.Location || '',
          Website: data.Website || '',
        });
        if (data.ProfileImage) {
          setAvatarUri(data.ProfileImage);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set default values if all fails
      setUserData({
        UserName: '',
        Email: user.email || '',
        Bio: '',
        Location: '',
        Website: '',
      });
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      // Use new MediaType API (expo-image-picker v17+)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images ?? ImagePicker.MediaTypeOptions?.Images ?? 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!userData.UserName.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    setLoading(true);
    try {
      let profileImageUrl = avatarUri;

      // Upload new profile image if changed
      // Using Cloudinary (free tier) for proper large file handling
      if (avatarUri && !avatarUri.startsWith('http') && !avatarUri.startsWith('https') && !avatarUri.startsWith('data:')) {
        try {
          console.log('Uploading profile image to Cloudinary...');
          profileImageUrl = await uploadImage(avatarUri, user.uid, 'profile');
          console.log('Profile image uploaded successfully:', profileImageUrl);
          
          // Validate we got a proper Cloudinary URL
          if (!profileImageUrl || !profileImageUrl.startsWith('http')) {
            throw new Error('Upload failed - invalid URL returned. Please check your Cloudinary configuration.');
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          const errorMsg = uploadError.message || 'Unknown error';
          
          // Check for specific error types
          let alertTitle = 'Upload Failed';
          let alertMessage = errorMsg;
          
          if (errorMsg.includes('Cannot connect to server')) {
            alertTitle = 'Server Not Running';
            alertMessage = 'Please start your server: cd server && npm start';
          } else if (errorMsg.includes('Cloudinary is not configured')) {
            alertTitle = 'Cloudinary Not Configured';
            alertMessage = 'Please add Cloudinary credentials to server/.env file:\n\nCLOUDINARY_CLOUD_NAME=your_cloud_name\nCLOUDINARY_API_KEY=your_api_key\nCLOUDINARY_API_SECRET=your_api_secret';
          }
          
          Alert.alert(
            alertTitle,
            alertMessage,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
              { 
                text: 'Continue Without Image', 
                onPress: async () => {
                  // Continue without image update - keep existing image
                  profileImageUrl = null; // Don't update image
                }
              }
            ]
          );
          return;
        }
      } else if (avatarUri && (avatarUri.startsWith('http') || avatarUri.startsWith('https'))) {
        // Already uploaded to Cloudinary or external URL, use as is
        profileImageUrl = avatarUri;
      } else if (avatarUri && avatarUri.startsWith('firestore://')) {
        // Legacy Firestore reference - will be migrated on next upload
        // For now, keep it but user should re-upload to migrate to Cloudinary
        profileImageUrl = avatarUri;
      }

      const updateData = {
        UserName: userData.UserName.trim(),
        Bio: userData.Bio.trim(),
        Location: userData.Location.trim(),
        Website: userData.Website.trim(),
        ...(profileImageUrl && { ProfileImage: profileImageUrl }),
      };

      // Update via backend API
      try {
        await usersAPI.updateUser(user.uid, updateData);
      } catch (apiError) {
        console.log('Backend API not available, updating via Firestore');
      }

      // Also update via Firestore directly
      await UpdateUserData(updateData);

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.message || 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change profile photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={userData.UserName}
              onChangeText={(text) => setUserData({ ...userData, UserName: text })}
              placeholder="Enter username"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={userData.Email}
              editable={false}
              placeholderTextColor="#999"
            />
            <Text style={styles.hint}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={userData.Bio}
              onChangeText={(text) => setUserData({ ...userData, Bio: text })}
              placeholder="Tell us about yourself"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={userData.Location}
              onChangeText={(text) => setUserData({ ...userData, Location: text })}
              placeholder="City, Country"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={userData.Website}
              onChangeText={(text) => setUserData({ ...userData, Website: text })}
              placeholder="https://yourwebsite.com"
              placeholderTextColor="#999"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bttn,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  formSection: {
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111811',
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: Colors.bttn,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#111811',
    fontSize: 16,
    fontWeight: '600',
  },
});

