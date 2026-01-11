import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner, Screen, EmptyState } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { Message, MessageThread, ThreadParticipantProfile } from '../../../types';
import { fetchMessages, fetchThreadById, sendMessage } from '../../../services/messages';
import { useAuth } from '../../../context/AuthContext';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<ThreadParticipantProfile | null>(null);
  const [otherUserId, setOtherUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadConversation();
  }, [id, user?.id]);

  useEffect(() => {
    if (!thread || !user?.id) {
      setOtherParticipant(null);
      setOtherUserId('');
      return;
    }

    const resolved = resolveOtherParticipant(thread, user.id);
    setOtherParticipant(resolved);
    setOtherUserId(resolved?.id ?? '');
  }, [thread, user?.id]);

  const resolveOtherParticipant = (threadData: MessageThread, currentUserId: string): ThreadParticipantProfile | null => {
    if (threadData.participants) {
      const other = Object.values(threadData.participants).find(participant => participant.id !== currentUserId);
      if (other) return other;
    }

    const otherId = threadData.participantIds.find(pid => pid !== currentUserId);
    const otherNameIndex = threadData.participantIds.findIndex(pid => pid === otherId);
    const fallbackName =
      otherNameIndex >= 0 ? threadData.participantNames[otherNameIndex] ?? 'Conversation' : 'Conversation';

    return otherId
      ? {
          id: otherId,
          name: fallbackName,
        }
      : null;
  };

  const loadConversation = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setLoading(true);
      const [threadData, threadMessages] = await Promise.all([fetchThreadById(id), fetchMessages(id)]);
      setThread(threadData);
      setMessages(threadMessages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || !id || sending) return;
    if (!otherUserId) {
      console.warn('No recipient found for this conversation.');
      return;
    }

    setSending(true);
    try {
      const newMessage = await sendMessage(id, user.id, otherUserId, inputText.trim());
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.fromUserId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
      ]}>
        <View style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  const conversationTitle = useMemo(() => {
    if (otherParticipant?.name) {
      return otherParticipant.name;
    }
    if (thread?.participantNames && user?.id) {
      const otherIndex = thread.participantIds.findIndex(pid => pid !== user.id);
      return thread.participantNames[otherIndex] || 'Conversation';
    }
    return 'Conversation';
  }, [otherParticipant?.name, thread?.participantNames, thread?.participantIds, user?.id]);

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner fullScreen />;
    }

    if (!thread) {
      return (
        <Screen>
          <EmptyState title="Conversation unavailable" message="We couldn’t find this chat thread." />
        </Screen>
      );
    }

    return (
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? colors.background : colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Screen padding="none">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{conversationTitle}</Text>
      </View>
      {renderContent()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  otherBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    ...typography.body,
  },
  ownMessageText: {
    color: colors.background,
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surface,
  },
});
