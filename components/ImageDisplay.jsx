import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
import { getImageFromFirestore } from '../utils/storage-alternative';

/**
 * ImageDisplay Component
 * Handles displaying images from various sources:
 * - HTTP/HTTPS URLs (Firebase Storage, CDN, etc.)
 * - Firestore base64 references (firestore://docId) - legacy support
 * - Local URIs (file://, data:image/)
 * - require() statements
 */
export default function ImageDisplay({ source, style, ...props }) {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadImage();
  }, [source]);

  const loadImage = async () => {
    if (!source) {
      setError(true);
      return;
    }

    // If source is a number (require() statement), use it directly
    if (typeof source === 'number') {
      setImageUri(null); // Will use require source directly
      setError(false);
      return;
    }

    // If it's already a valid URI (http, https, file, data)
    // Firebase Storage URLs are https://storage.googleapis.com/...
    if (typeof source === 'string' && (
      source.startsWith('http://') || 
      source.startsWith('https://') ||
      source.startsWith('file://') ||
      source.startsWith('data:image/')
    )) {
      setImageUri(source);
      setError(false);
      return;
    }

    // Legacy: If it's a Firestore base64 reference (for backward compatibility)
    if (typeof source === 'string' && source.startsWith('firestore://')) {
      setLoading(true);
      try {
        const base64 = await getImageFromFirestore(source);
        setImageUri(base64);
        setError(false);
      } catch (err) {
        console.error('Error loading image from Firestore:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    // If it's an object with uri property
    if (typeof source === 'object' && source.uri) {
      // Firebase Storage URLs or regular HTTP URLs
      if (source.uri.startsWith('http://') || source.uri.startsWith('https://')) {
        setImageUri(source.uri);
        setError(false);
        return;
      }
      
      // Legacy Firestore reference
      if (source.uri.startsWith('firestore://')) {
        setLoading(true);
        try {
          const base64 = await getImageFromFirestore(source.uri);
          setImageUri(base64);
          setError(false);
        } catch (err) {
          console.error('Error loading image from Firestore:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
        return;
      }
      
      // Local file or data URI
      setImageUri(source.uri);
      setError(false);
      return;
    }

    setError(true);
  };

  if (loading) {
    return (
      <View style={[style, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  }

  // If source is a number (require() statement), use it directly
  if (typeof source === 'number') {
    return (
      <Image
        source={source}
        style={style}
        {...props}
      />
    );
  }

  if (error || !imageUri) {
    return (
      <View style={[style, styles.errorContainer]}>
        <Image
          source={require('../assets/images/avtar.png')}
          style={style}
          {...props}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    backgroundColor: '#f0f0f0',
  },
});

