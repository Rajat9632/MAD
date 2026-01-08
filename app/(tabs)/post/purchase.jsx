import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../assets/Colors';
import { useAuth } from '../../../context/authContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';
import ImageDisplay from '../../../components/ImageDisplay';

export default function PurchaseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { postId, price, artistName } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Buyer details
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerState, setBuyerState] = useState('');
  const [buyerPincode, setBuyerPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, online

  useEffect(() => {
    fetchPostDetails();
    // Pre-fill buyer details from user data
    if (user) {
      setBuyerEmail(user.email || '');
      fetchUserDetails();
    }
  }, [postId, user]);

  const fetchPostDetails = async () => {
    try {
      const postDoc = await getDoc(doc(db, 'POSTS', postId));
      if (postDoc.exists()) {
        setPost({ id: postDoc.id, ...postDoc.data() });
      } else {
        Alert.alert('Error', 'Post not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Error', 'Failed to load post details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'USERS', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setBuyerName(userData.UserName || '');
        // You can add more fields if stored in user profile
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handlePurchase = async () => {
    // Validation
    if (!buyerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!buyerEmail.trim() || !buyerEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    if (!buyerPhone.trim() || buyerPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (!buyerAddress.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }
    if (!buyerCity.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return;
    }
    if (!buyerState.trim()) {
      Alert.alert('Error', 'Please enter your state');
      return;
    }
    if (!buyerPincode.trim() || buyerPincode.length < 6) {
      Alert.alert('Error', 'Please enter a valid pincode');
      return;
    }

    try {
      setSubmitting(true);

      // Create purchase order in Firestore
      const { collection, addDoc } = await import('firebase/firestore');
      const purchaseData = {
        postId: postId,
        artworkTitle: post?.title || 'Untitled',
        artworkImage: post?.imageUrl || '',
        artistId: post?.userId || '',
        artistName: artistName || post?.userName || 'Artist',
        artistEmail: post?.userEmail || '',
        buyerId: user.uid,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerAddress: buyerAddress.trim(),
        buyerCity: buyerCity.trim(),
        buyerState: buyerState.trim(),
        buyerPincode: buyerPincode.trim(),
        price: parseFloat(price) || 0,
        paymentMethod: paymentMethod,
        status: 'pending', // pending, confirmed, shipped, delivered, cancelled
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create purchase order in Firestore and get the document reference
      const purchaseRef = await addDoc(collection(db, 'PURCHASES'), purchaseData);
      
      // Send email notifications
      try {
        const { default: api } = await import('../../../utils/api');
        await api.post('/api/purchases/send-notification', {
          purchaseId: purchaseRef.id,
          artistEmail: post?.userEmail || purchaseData.artistEmail || '',
          buyerEmail: buyerEmail.trim(),
          artworkTitle: purchaseData.artworkTitle,
          artistName: purchaseData.artistName,
          buyerName: purchaseData.buyerName,
          price: purchaseData.price,
          buyerPhone: purchaseData.buyerPhone,
        });
      } catch (emailError) {
        console.log('Email notification failed (non-critical):', emailError);
        // Don't block the purchase if email fails
      }

      Alert.alert(
        'Success!',
        'Your purchase request has been submitted. The artist will contact you soon.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to submit purchase request. Please try again.');
    } finally {
      setSubmitting(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111811" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Purchase Artwork</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Artwork Preview */}
        <View style={styles.artworkPreview}>
          {post?.imageUrl && (
            <ImageDisplay
              source={post.imageUrl}
              style={styles.artworkImage}
            />
          )}
          <View style={styles.artworkInfo}>
            <Text style={styles.artworkTitle}>{post?.title || 'Untitled'}</Text>
            <Text style={styles.artistName}>By {artistName || post?.userName || 'Artist'}</Text>
            <Text style={styles.price}>₹{parseFloat(price || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Buyer Details Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Your Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={buyerName}
              onChangeText={setBuyerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={buyerEmail}
              onChangeText={setBuyerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={buyerPhone}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setBuyerPhone(numericValue);
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your complete address"
              value={buyerAddress}
              onChangeText={setBuyerAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={buyerCity}
                onChangeText={setBuyerCity}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={buyerState}
                onChangeText={setBuyerState}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pincode *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pincode"
              value={buyerPincode}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setBuyerPincode(numericValue);
              }}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method *</Text>
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'cash' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('cash')}
              >
                <Ionicons
                  name={paymentMethod === 'cash' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={paymentMethod === 'cash' ? Colors.bttn : '#999'}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentMethod === 'cash' && styles.paymentOptionTextActive,
                  ]}
                >
                  Cash on Delivery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === 'online' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('online')}
              >
                <Ionicons
                  name={paymentMethod === 'online' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={paymentMethod === 'online' ? Colors.bttn : '#999'}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    paymentMethod === 'online' && styles.paymentOptionTextActive,
                  ]}
                >
                  Online Payment
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Artwork Price:</Text>
            <Text style={styles.summaryValue}>₹{parseFloat(price || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>To be calculated</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total:</Text>
            <Text style={styles.summaryTotalValue}>₹{parseFloat(price || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handlePurchase}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Confirm Purchase</Text>
            </>
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
  artworkPreview: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  artworkImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  artworkInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  artworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#618961',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.bttn,
  },
  formSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6e0db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111811',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  paymentOptions: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6e0db',
    borderRadius: 8,
    gap: 8,
  },
  paymentOptionActive: {
    borderColor: Colors.bttn,
    backgroundColor: '#f0f4f0',
  },
  paymentOptionText: {
    fontSize: 16,
    color: '#111811',
  },
  paymentOptionTextActive: {
    fontWeight: '600',
    color: Colors.bttn,
  },
  summarySection: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#618961',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e6e0db',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111811',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.bttn,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bttn,
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111811',
  },
});
