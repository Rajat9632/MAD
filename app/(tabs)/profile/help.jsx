import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../assets/Colors';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const faqItems = [
    {
      question: 'How do I create a post?',
      answer: 'Go to the Post tab, select an image, add a caption, and tap Post. You can also use AI features to generate captions and stories.',
    },
    {
      question: 'How do I edit my profile?',
      answer: 'Go to your Profile tab, tap "Edit Profile", make your changes, and tap "Save Changes".',
    },
    {
      question: 'How do I change my role?',
      answer: 'Your role (Artist or Buyer) is set during initial registration. Contact support if you need to change it.',
    },
    {
      question: 'How do I share my artwork?',
      answer: 'After creating a post, you can share it to Instagram, Twitter, or Facebook using the social media buttons.',
    },
    {
      question: 'What are AI features?',
      answer: 'ArtConnect uses AI to help generate captions, stories, and enhance your artwork images automatically.',
    },
  ];

  const handleSendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    Alert.alert(
      'Message Sent',
      'Thank you for contacting us! We will get back to you soon.',
      [{ text: 'OK', onPress: () => setMessage('') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactCard}>
            <Ionicons name="mail-outline" size={24} color={Colors.bttn} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>support@artconnect.app</Text>
            </View>
          </View>

          <View style={styles.contactCard}>
            <Ionicons name="call-outline" size={24} color={Colors.bttn} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+1 (555) 123-4567</Text>
            </View>
          </View>
        </View>

        {/* Send Message Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message here..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>Send Message</Text>
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
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  contactInfo: {
    marginLeft: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#111811',
    fontWeight: '500',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111811',
    backgroundColor: '#fff',
    minHeight: 120,
    marginBottom: 16,
  },
  sendButton: {
    backgroundColor: Colors.bttn,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#111811',
    fontSize: 16,
    fontWeight: '600',
  },
});

