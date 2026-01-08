import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../assets/Colors';
import { useAuth } from '../../../context/authContext';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';
import ImageDisplay from '../../../components/ImageDisplay';

export default function PurchaseRequestsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, shipped, delivered

  useEffect(() => {
    fetchPurchaseRequests();
  }, [filter]);

  const fetchPurchaseRequests = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'PURCHASES'),
        where('artistId', '==', user?.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      let allRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by status
      if (filter !== 'all') {
        allRequests = allRequests.filter(req => req.status === filter);
      }

      setRequests(allRequests);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      Alert.alert('Error', 'Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      await updateDoc(doc(db, 'PURCHASES', requestId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
      // Send email notification to buyer
      try {
        const { default: api } = await import('../../../utils/api');
        await api.post('/api/purchases/send-status-update', {
          email: request.buyerEmail,
          name: request.buyerName,
          artworkTitle: request.artworkTitle,
          status: newStatus,
        });
      } catch (emailError) {
        console.log('Email notification failed (non-critical):', emailError);
      }
      
      fetchPurchaseRequests();
      Alert.alert('Success', `Request ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  const handleStatusUpdate = (requestId, currentStatus) => {
    const statusOptions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled'],
      shipped: ['delivery_confirmation_pending'], // Changed: seller marks as delivered, waiting for buyer confirmation
    };

    const options = statusOptions[currentStatus] || [];
    if (options.length === 0) return;

    Alert.alert(
      'Update Status',
      currentStatus === 'shipped' 
        ? 'Mark as delivered? This will wait for buyer confirmation.'
        : 'Select new status',
      options.map(option => ({
        text: option === 'delivery_confirmation_pending' 
          ? 'Mark as Delivered' 
          : option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' '),
        onPress: () => updateRequestStatus(requestId, option),
      })).concat([{ text: 'Cancel', style: 'cancel' }])
    );
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'delivery_confirmation_pending': return 'Confirmation Pending';
      default: return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Requests</Text>
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

      {/* Requests List */}
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No purchase requests</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.requestsContainer}>
          {requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.artworkPreview}>
                  <ImageDisplay
                    source={request.artworkImage || require('../../../assets/images/ppimg.png')}
                    style={styles.artworkThumbnail}
                  />
                  <View style={styles.artworkDetails}>
                    <Text style={styles.artworkTitle}>{request.artworkTitle}</Text>
                    <Text style={styles.price}>₹{request.price?.toLocaleString() || 0}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {getStatusLabel(request.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.buyerInfo}>
                <Text style={styles.sectionTitle}>Buyer Details</Text>
                <Text style={styles.detailText}>Name: {request.buyerName}</Text>
                <Text style={styles.detailText}>Email: {request.buyerEmail}</Text>
                <Text style={styles.detailText}>Phone: {request.buyerPhone}</Text>
                <Text style={styles.detailText}>
                  Address: {request.buyerAddress}, {request.buyerCity}, {request.buyerState} - {request.buyerPincode}
                </Text>
                <Text style={styles.detailText}>Payment: {request.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}</Text>
              </View>

              <Text style={styles.dateText}>
                Requested on: {new Date(request.createdAt).toLocaleDateString()}
              </Text>

              {request.status !== 'delivered' && request.status !== 'cancelled' && request.status !== 'delivery_confirmation_pending' && (
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => handleStatusUpdate(request.id, request.status)}
                >
                  <Text style={styles.updateButtonText}>Update Status</Text>
                </TouchableOpacity>
              )}
              {request.status === 'delivery_confirmation_pending' && (
                <View style={styles.waitingConfirmationContainer}>
                  <Text style={styles.waitingConfirmationText}>
                    ⏳ Waiting for buyer to confirm delivery
                  </Text>
                </View>
              )}
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
  requestsContainer: {
    padding: 16,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  artworkPreview: {
    flexDirection: 'row',
    flex: 1,
  },
  artworkThumbnail: {
    width: 80,
    height: 80,
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
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.bttn,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buyerInfo: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  updateButton: {
    backgroundColor: Colors.bttn,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
  },
  waitingConfirmationContainer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  waitingConfirmationText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
});
