// AI ChatBot Component - Artist-User collaboration bot

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../assets/Colors';

export default function ChatBot({ onGenerateRequest }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm ArtConnect AI. I can help you collaborate with artists, visualize your ideas, and create custom artwork requests. What would you like to create today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response (in real app, call Vertex AI)
    setTimeout(() => {
      const botResponse = generateBotResponse(inputText);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);

      // If user wants to create something, trigger callback
      if (inputText.toLowerCase().includes('create') || inputText.toLowerCase().includes('design')) {
        onGenerateRequest?.(inputText);
      }
    }, 1000);
  };

  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('help') || input.includes('what can')) {
      return "I can help you:\n• Visualize your artwork ideas\n• Connect with artists\n• Generate artwork descriptions\n• Create custom requests\n\nWhat would you like to do?";
    }
    
    if (input.includes('design') || input.includes('create') || input.includes('make')) {
      return "Great! I can help you create a custom artwork. Let me guide you through the process:\n\n1. What type of artwork are you looking for? (e.g., pottery, textiles, paintings)\n2. What style or theme? (traditional, modern, cultural)\n3. Any specific requirements or inspiration?\n\nI'll help you craft the perfect request for our artists!";
    }
    
    if (input.includes('artist') || input.includes('collaborate')) {
      return "Our platform connects you with talented artists from around the world! I can help you:\n• Find the right artist for your project\n• Create detailed collaboration requests\n• Visualize your ideas\n\nTell me what you're looking for!";
    }
    
    return "That sounds interesting! I can help you with that. Can you provide more details about what you're looking for?";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubbles" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>ArtConnect AI Assistant</Text>
            <Text style={styles.headerSubtitle}>I'm here to help you collaborate</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.sender === 'user' ? styles.userMessage : styles.botMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.sender === 'user' ? styles.userMessageText : styles.botMessageText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <Text style={styles.typingIndicator}>Typing...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bttn,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111811',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#618961',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.bttn,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f4f0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#111811',
  },
  botMessageText: {
    color: '#111811',
  },
  typingIndicator: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
    fontSize: 14,
    color: '#111811',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bttn,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

