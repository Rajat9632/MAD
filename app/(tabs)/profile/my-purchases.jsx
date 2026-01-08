import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../assets/Colors';
import { useAuth } from '../../../context/authContext';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';
import ImageDisplay from '../../../components/ImageDisplay';
import { Alert } from 'react-native';

export default function MyPurchasesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, shipped, delivery_confirmation_pending, delivered

  useEffect(() => {
    fetchMyPurchases();
  }, [filter]);

  const fetchMyPurchases = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'PURCHASES'),
        where('buyerId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      let allPurchases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by status
      if (filter !== 'all') {
        allPurchases = allPurchases.filter(purchase => purchase.status === filter);
      }

      setPurchases(allPurchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#2196f3';
      case 'shipped': return '#9c27b0';
      case 'delivery_confirmation_pending': return '#ff9800'; // Orange - awaiting buyer confirmation
      case 'delivered': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'shipped': return 'car-outline';
      case 'delivery_confirmation_pending': return 'hourglass-outline';
      case 'delivered': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'delivery_confirmation_pending': return 'Confirmation Pending';
      default: return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  };

  const handleConfirmDelivery = async (purchaseId) => {
    Alert.alert(
      'Confirm Delivery',
      'Did you receive the artwork? Please confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'PURCHASES', purchaseId), {
                status: 'delivered',
                updatedAt: new Date().toISOString(),
                deliveredAt: new Date().toISOString(),
              });
              
              // Refresh the list
              fetchMyPurchases();
              
              // Send email notification
              try {
                const purchase = purchases.find(p => p.id === purchaseId);
                if (purchase) {
                  const { default: api } = await import('../../../utils/api');
                  await api.post('/api/purchases/send-status-update', {
                    email: purchase.artistEmail,
                    name: purchase.artistName,
                    artworkTitle: purchase.artworkTitle,
                    status: 'delivered',
                  });
                }
              } catch (emailError) {
                console.log('Email notification failed (non-critical):', emailError);
              }
              
              Alert.alert('Success', 'Delivery confirmed successfully!');
            } catch (error) {
              console.error('Error confirming delivery:', error);
              Alert.alert('Error', 'Failed to confirm delivery. Please try again.');
            }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Purchases</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filter === status && styles.filterTabActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Purchases List */}
      {purchases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No purchases yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.purchasesContainer}>
          {purchases.map((purchase) => (
            <View key={purchase.id} style={styles.purchaseCard}>
              <View style={styles.purchaseHeader}>
                <View style={styles.artworkPreview}>
                  <ImageDisplay
                    source={purchase.artworkImage || require('../../../assets/images/ppimg.png')}
                    style={styles.artworkThumbnail}
                  />
                  <View style={styles.artworkDetails}>
                    <Text style={styles.artworkTitle}>{purchase.artworkTitle}</Text>
                    <Text style={styles.artistName}>By {purchase.artistName}</Text>
                    <Text style={styles.price}>₹{purchase.price?.toLocaleString() || 0}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statusContainer}>
                <Ionicons
                  name={getStatusIcon(purchase.status)}
                  size={20}
                  color={getStatusColor(purchase.status)}
                />
                <Text style={[styles.statusText, { color: getStatusColor(purchase.status) }]}>
                  {getStatusLabel(purchase.status)}
                </Text>
              </View>

              {purchase.status === 'delivery_confirmation_pending' && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => handleConfirmDelivery(purchase.id)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>Confirm Delivery</Text>
                </TouchableOpacity>
              )}

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>{purchase.id.substring(0, 8)}...</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment:</Text>
                  <Text style={styles.detailValue}>
                    {purchase.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Shipping Address:</Text>
                  <Text style={styles.detailValue}>
                    {purchase.buyerAddress}, {purchase.buyerCity}, {purchase.buyerState} - {purchase.buyerPincode}
                  </Text>
                </View>
              </View>
            </View>
          ))}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: Colors.bttn,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  filterTextActive: {
    color: '#111811',
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
  purchasesContainer: {
    padding: 16,
  },
  purchaseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  purchaseHeader: {
    marginBottom: 12,
  },
  artworkPreview: {
    flexDirection: 'row',
  },
  artworkThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  artworkDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  artworkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#618961',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.bttn,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
    flex: 2,
    textAlign: 'right',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
