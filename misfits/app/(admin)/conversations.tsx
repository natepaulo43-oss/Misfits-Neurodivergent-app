import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ViewStyle } from 'react-native';

import { AdminLayout, Card, Button, LoadingSpinner, EmptyState } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { Message, MessageThread, User } from '../../types';
import {
  fetchAllThreadsForAudit,
  fetchAllUsers,
  fetchThreadMessagesForAudit,
  markMessageReviewed,
  toggleUserMessaging,
} from '../../services/admin';

export default function MessagingModerationScreen() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionMessageId, setActionMessageId] = useState<string | null>(null);
  const [messagingToggleId, setMessagingToggleId] = useState<string | null>(null);

  const userLookup = useMemo(() => {
    return users.reduce<Record<string, User>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [users]);

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const [threadResults, userResults] = await Promise.all([
        fetchAllThreadsForAudit(),
        fetchAllUsers(),
      ]);
      setThreads(threadResults);
      setUsers(userResults);
    } catch (error) {
      console.error('[admin] Failed to load conversation threads', error);
      Alert.alert('Error', 'Unable to load conversations right now.');
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (thread: MessageThread) => {
    setSelectedThread(thread);
    setMessages([]);
    setMessagesLoading(true);
    try {
      const result = await fetchThreadMessagesForAudit(thread.id);
      setMessages(result);
    } catch (error) {
      console.error('[admin] Failed to load messages', error);
      Alert.alert('Error', 'Unable to load messages for this thread.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleMarkReviewed = async (message: Message) => {
    if (!selectedThread) return;
    setActionMessageId(message.id);
    try {
      await markMessageReviewed(selectedThread.id, message.id, 'admin');
      await loadMessages(selectedThread);
    } catch (error) {
      console.error('[admin] Failed to mark message reviewed', error);
      Alert.alert('Error', 'Unable to mark this message as reviewed.');
    } finally {
      setActionMessageId(null);
    }
  };

  const handleToggleMessaging = async (userId: string, disable: boolean) => {
    setMessagingToggleId(userId);
    try {
      await toggleUserMessaging(userId, disable);
      const refreshedUsers = await fetchAllUsers();
      setUsers(refreshedUsers);
    } catch (error) {
      console.error('[admin] Failed to toggle messaging for user', error);
      Alert.alert('Error', 'Unable to toggle messaging for this user.');
    } finally {
      setMessagingToggleId(null);
    }
  };

  const renderThreadCard = (thread: MessageThread) => {
    const participants = thread.participantIds
      .map(id => userLookup[id]?.name || thread.participants?.[id]?.name || id)
      .join(' • ');

    const cardStyle = StyleSheet.flatten([
      styles.card,
      selectedThread?.id === thread.id ? styles.cardSelected : null,
    ]);

    return (
      <Card
        key={thread.id}
        style={cardStyle}
      >
        <Text style={styles.cardTitle}>{participants}</Text>
        <Text style={styles.cardMeta}>{thread.lastMessage}</Text>
        <Button
          title="View messages"
          variant="outline"
          onPress={() => loadMessages(thread)}
          style={styles.cardButton}
        />
      </Card>
    );
  };

  const renderMessage = (message: Message) => {
    const flagged = message.flaggedKeywords && message.flaggedKeywords.length > 0;
    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          flagged && styles.flaggedMessage,
          message.flaggedReviewed && styles.reviewedMessage,
        ]}
      >
        <Text style={styles.messageMeta}>
          {message.fromUserId} → {message.toUserId} • {new Date(message.timestamp).toLocaleString()}
        </Text>
        <Text style={styles.messageText}>{message.text}</Text>
        {flagged ? (
          <Text style={styles.flaggedKeywords}>Flagged terms: {message.flaggedKeywords?.join(', ')}</Text>
        ) : null}
        {flagged && !message.flaggedReviewed ? (
          <Button
            title="Mark reviewed"
            onPress={() => handleMarkReviewed(message)}
            loading={actionMessageId === message.id}
            style={styles.messageButton}
          />
        ) : null}
      </View>
    );
  };

  const renderParticipantControls = () => {
    if (!selectedThread) return null;
    return (
      <View style={styles.participantControls}>
        {selectedThread.participantIds.map(participantId => {
          const participantUser = userLookup[participantId];
          const disabled = participantUser?.messagingDisabled ?? false;
          return (
            <Card key={participantId} style={styles.participantCard}>
              <Text style={styles.participantName}>{participantUser?.name || participantId}</Text>
              <Text style={styles.participantEmail}>{participantUser?.email}</Text>
              <Text style={styles.participantStatus}>
                Messaging: <Text style={disabled ? styles.statusSuspended : styles.statusActive}>{disabled ? 'Disabled' : 'Enabled'}</Text>
              </Text>
              <Button
                title={disabled ? 'Enable messaging' : 'Disable messaging'}
                onPress={() => handleToggleMessaging(participantId, !disabled)}
                loading={messagingToggleId === participantId}
              />
            </Card>
          );
        })}
      </View>
    );
  };

  if (threadsLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <AdminLayout
      title="Messaging moderation"
      subtitle="Review conversations, flag content, and disable messaging to protect minors."
    >
      {threads.length === 0 ? (
        <EmptyState title="No conversations" message="No message threads were found." />
      ) : (
        <View style={styles.layout}>
          <View style={styles.threadColumn}>
            <Text style={styles.columnTitle}>Threads</Text>
            <ScrollView contentContainerStyle={styles.threadList}>{threads.map(renderThreadCard)}</ScrollView>
          </View>
          <View style={styles.detailColumn}>
            {!selectedThread ? (
              <EmptyState title="Select a thread" message="Choose a conversation to review messages." />
            ) : messagesLoading ? (
              <LoadingSpinner />
            ) : (
              <View style={styles.messagesSection}>
                <Text style={styles.columnTitle}>Messages</Text>
                <ScrollView contentContainerStyle={styles.messagesList}>{messages.map(renderMessage)}</ScrollView>
                {renderParticipantControls()}
              </View>
            )}
          </View>
        </View>
      )}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  threadColumn: {
    width: 320,
  },
  detailColumn: {
    flex: 1,
    minHeight: 400,
  },
  columnTitle: {
    ...typography.bodySmall,
    textTransform: 'uppercase',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  threadList: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.xs,
    borderRadius: borderRadius.md,
  },
  cardSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cardTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardButton: {
    alignSelf: 'flex-start',
  },
  messagesSection: {
    gap: spacing.md,
  },
  messagesList: {
    gap: spacing.sm,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  flaggedMessage: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: '#FDECEC',
  },
  reviewedMessage: {
    opacity: 0.8,
  },
  messageMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messageText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  flaggedKeywords: {
    ...typography.caption,
    color: colors.error,
  },
  messageButton: {
    alignSelf: 'flex-start',
  },
  participantControls: {
    gap: spacing.sm,
  },
  participantCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  participantName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  participantEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  participantStatus: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  statusActive: {
    color: colors.success,
    fontWeight: '600',
  },
  statusSuspended: {
    color: colors.error,
    fontWeight: '600',
  },
});
