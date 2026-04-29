import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Alert,
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
import { fetchThreadById, reportMessage, sendMessage, subscribeToMessages } from '../../../services/messages';
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
  const [isOffline, setIsOffline] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

  // Main effect: fetch thread metadata then start real-time message subscription.
  // Cleans up the onSnapshot listener when the component unmounts or id/user changes.
  useEffect(() => {
    if (!id || typeof id !== 'string' || !user?.id) return;

    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      try {
        setLoading(true);
        const threadData = await fetchThreadById(id);

        if (!threadData) {
          setLoading(false);
          return;
        }

        // Client-side participant guard (defence-in-depth alongside Firestore rules).
        // If the Firestore rules are working correctly this branch is never reached,
        // but it prevents stale deep-links from rendering foreign conversations.
        if (!threadData.participantIds.includes(user.id)) {
          console.error('[Chat] Access denied: user is not a participant in thread', id);
          setIsUnauthorized(true);
          setLoading(false);
          return;
        }

        setThread(threadData);

        // Subscribe to real-time messages. onSnapshot fires immediately with the
        // current data, so we set loading=false inside the first callback.
        unsubscribe = subscribeToMessages(
          id,
          (msgs) => {
            setMessages(msgs);
            setIsOffline(false);
            setLoading(false);
          },
          (error) => {
            console.error('[Chat] Message subscription failed:', error);
            // Permission errors mean we should not retry silently.
            if ((error as any)?.code === 'permission-denied') {
              setIsUnauthorized(true);
            } else {
              setIsOffline(true);
            }
            setLoading(false);
          },
        );
      } catch (error) {
        console.error('[Chat] Failed to load conversation:', error);
        setLoading(false);
      }
    };

    setup();

    return () => {
      unsubscribe?.();
    };
  }, [id, user?.id]);

  const resolveOtherParticipant = (threadData: MessageThread, currentUserId: string): ThreadParticipantProfile | null => {
    if (threadData.participants) {
      const other = Object.values(threadData.participants).find(participant => participant.id !== currentUserId);
      if (other) return other;
    }

    const otherId = threadData.participantIds.find(pid => pid !== currentUserId);
    const otherNameIndex = threadData.participantIds.findIndex(pid => pid === otherId);
    const fallbackName =
      otherNameIndex >= 0 ? threadData.participantNames[otherNameIndex] ?? 'Conversation' : 'Conversation';

    return otherId ? { id: otherId, name: fallbackName } : null;
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || !id || sending) return;
    if (!otherUserId) {
      console.warn('[Chat] No recipient found for this conversation.');
      return;
    }

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');
    try {
      // onSnapshot will pick up the new message automatically — no manual state push needed.
      await sendMessage(id, user.id, otherUserId, textToSend);
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleLongPress = (item: Message, isOwnMessage: boolean) => {
    if (isOwnMessage || !user || !id) return;
    Alert.alert(
      'Report Message',
      'Report this message to our moderation team for review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportMessage(id, item.id, user.id, 'Inappropriate content');
              Alert.alert('Reported', 'Thank you. Our team will review this message.');
            } catch {
              Alert.alert('Error', 'Unable to submit report. Please try again.');
            }
          },
        },
      ],
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.fromUserId === user?.id;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
        onLongPress={() => handleLongPress(item, isOwnMessage)}
        delayLongPress={400}
        activeOpacity={0.85}
      >
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
      </TouchableOpacity>
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

    if (isUnauthorized) {
      return (
        <Screen>
          <EmptyState
            title="Access denied"
            message="You don't have permission to view this conversation."
          />
        </Screen>
      );
    }

    if (!thread) {
      return (
        <Screen>
          <EmptyState title="Conversation unavailable" message="We couldn't find this chat thread." />
        </Screen>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={14} color={colors.background} />
            <Text style={styles.offlineBannerText}>Reconnecting…</Text>
          </View>
        )}

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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: '#6B7280',
  },
  offlineBannerText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
});
