import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { Colors } from '../../../assets/Colors';
import { useAuth } from '../../../context/authContext';
import { aiAPI } from '../../../utils/api';

export default function VideosScreen() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiContent, setAiContent] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      // In real app, fetch from Firestore
      // For now, using mock data
      setVideos([
        {
          id: '1',
          title: 'Rajasthani Pottery Making',
          description: 'Watch the traditional art of pottery making',
          thumbnail: require('../../../assets/images/ppimg.png'),
          videoUrl: null,
          script: null,
        },
      ]);

      // Generate AI content for Rajasthani Pottery
      if (!aiContent) {
        generateAIContent();
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateAIContent = async () => {
    try {
      setGenerating(true);
      const artworkData = {
        title: 'Rajasthani Pottery Making',
        story: 'Traditional pottery making in Rajasthan is an ancient craft passed down through generations. Artisans use locally sourced clay and traditional techniques to create beautiful, functional pottery pieces.',
        materials: 'Terracotta clay, natural pigments, traditional potter\'s wheel',
        techniques: 'Hand-throwing, coiling, glazing with natural materials',
      };

      const response = await aiAPI.generateVideoScript(artworkData, 'en', 'Rajasthan');
      
      if (response.success && response.data) {
        setAiContent(response.data);
      } else {
        // Fallback content if AI fails
        setAiContent({
          intro: 'Welcome to ArtConnect! Today, we\'re exploring the story behind Rajasthani Pottery Making.',
          main: 'Traditional pottery making in Rajasthan is an ancient craft passed down through generations. Artisans use locally sourced terracotta clay and traditional techniques like hand-throwing and coiling to create beautiful, functional pottery pieces. Each piece tells a story of cultural heritage and artistic mastery.',
          outro: 'Discover more cultural artworks on ArtConnect - bridging artists and audiences worldwide.',
          hashtags: ['#ArtConnect', '#RajasthaniPottery', '#TraditionalCraft', '#CulturalHeritage'],
        });
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      // Fallback content
      setAiContent({
        intro: 'Welcome to ArtConnect! Today, we\'re exploring the story behind Rajasthani Pottery Making.',
        main: 'Traditional pottery making in Rajasthan is an ancient craft passed down through generations. Artisans use locally sourced terracotta clay and traditional techniques like hand-throwing and coiling to create beautiful, functional pottery pieces. Each piece tells a story of cultural heritage and artistic mastery.',
        outro: 'Discover more cultural artworks on ArtConnect - bridging artists and audiences worldwide.',
        hashtags: ['#ArtConnect', '#RajasthaniPottery', '#TraditionalCraft', '#CulturalHeritage'],
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateVideo = async (artworkData) => {
    try {
      setGenerating(true);
      
      const response = await aiAPI.generateVideoScript(artworkData, 'en', 'Maharashtra');
      
      if (response.success) {
        Alert.alert('Success', 'Video script generated! Video generation coming soon.');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      Alert.alert('Error', 'Failed to generate video script');
    } finally {
      setGenerating(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cultural Reels</Text>
        <Text style={styles.headerSubtitle}>AI-generated cultural stories</Text>
      </View>

      {loading && videos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.bttn} />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {videos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No videos yet</Text>
              <Text style={styles.emptySubtext}>
                Cultural reels will appear here once generated
              </Text>
            </View>
          ) : (
            videos.map((video) => (
              <View key={video.id} style={styles.videoCard}>
                <View style={styles.thumbnailContainer}>
                  {video.thumbnail ? (
                    <Image source={video.thumbnail} style={styles.thumbnail} />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons name="videocam-outline" size={48} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={32} color="#fff" />
                  </View>
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <Text style={styles.videoDescription}>{video.description}</Text>
                  
                  {/* AI Generated Content */}
                  {aiContent && (
                    <View style={styles.aiContentContainer}>
                      <View style={styles.aiBadge}>
                        <Ionicons name="sparkles" size={16} color={Colors.bttn} />
                        <Text style={styles.aiBadgeText}>AI Generated Content</Text>
                      </View>
                      <Text style={styles.aiContentTitle}>Story:</Text>
                      <Text style={styles.aiContentText}>{aiContent.main || aiContent.story}</Text>
                      {aiContent.hashtags && (
                        <View style={styles.hashtagsContainer}>
                          {aiContent.hashtags.map((tag, index) => (
                            <Text key={index} style={styles.hashtag}>{tag}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {generating && (
                    <View style={styles.generatingContainer}>
                      <ActivityIndicator size="small" color={Colors.bttn} />
                      <Text style={styles.generatingText}>Generating AI content...</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.watchButton}>
                    <Ionicons name="play-circle" size={20} color={Colors.bttn} />
                    <Text style={styles.watchButtonText}>Watch Video</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.bttn} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>AI Video Generation</Text>
              <Text style={styles.infoText}>
                Cultural reels are automatically generated from artwork posts using AI.
                They include artist stories and cultural heritage information.
              </Text>
            </View>
          </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111811',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#618961',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#618961',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111811',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#618961',
    textAlign: 'center',
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: '#618961',
    marginBottom: 12,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  watchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.bttn,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f4f0',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#618961',
    lineHeight: 20,
  },
  aiContentContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.bttn,
  },
  aiContentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 4,
  },
  aiContentText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 8,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hashtag: {
    fontSize: 12,
    color: Colors.bttn,
    fontWeight: '500',
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  generatingText: {
    fontSize: 12,
    color: '#618961',
  },
});
