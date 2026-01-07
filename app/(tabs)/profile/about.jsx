import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../assets/Colors';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  const openLink = (url) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About ArtConnect</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🎨</Text>
            <Text style={styles.appName}>ArtConnect</Text>
            <Text style={styles.tagline}>Celebrating Cultural Artistry</Text>
          </View>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>
            ArtConnect is a platform dedicated to preserving and celebrating cultural artistry from around the world. 
            Connect with artists, discover unique cultural artworks, and share your own creative expressions.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <FeatureItem icon="sparkles" text="AI-powered caption and story generation" />
          <FeatureItem icon="image" text="High-quality image enhancement" />
          <FeatureItem icon="share-social" text="Social media integration" />
          <FeatureItem icon="language" text="Multilingual support" />
          <FeatureItem icon="location" text="Geolocation-based content" />
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <LinkItem
            icon="globe-outline"
            text="Website"
            onPress={() => openLink('https://artconnect.app')}
          />
          <LinkItem
            icon="logo-twitter"
            text="Twitter"
            onPress={() => openLink('https://twitter.com/artconnect')}
          />
          <LinkItem
            icon="logo-instagram"
            text="Instagram"
            onPress={() => openLink('https://instagram.com/artconnect')}
          />
          <LinkItem
            icon="mail-outline"
            text="Email"
            onPress={() => openLink('mailto:support@artconnect.app')}
          />
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credits</Text>
          <Text style={styles.creditText}>
            Built with ❤️ by the ArtConnect Team{'\n'}
            © 2025 ArtConnect. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon} size={20} color={Colors.bttn} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const LinkItem = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.linkItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color="#111811" />
    <Text style={styles.linkText}>{text}</Text>
    <Ionicons name="chevron-forward" size={20} color="#999" />
  </TouchableOpacity>
);

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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#618961',
    fontStyle: 'italic',
  },
  version: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: '#111811',
    marginLeft: 16,
  },
  creditText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

