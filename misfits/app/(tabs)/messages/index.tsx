import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Avatar, LoadingSpinner, EmptyState, Screen } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { MessageThread } from '../../../types';
import { fetchThreads } from '../../../services/messages';
import { getOtherParticipantName } from '../../../data/mockMessages';
import { useAuth } from '../../../context/AuthContext';

export default function MessagesListScreen() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadThreads();
    } else {
      setThreads([]);
      setLoading(false);
    }
  }, [user]);

  const loadThreads = async () => {
    if (!user) return;
    try {
      const data = await fetchThreads(user.id);
      setThreads(data);
    } catch (error) {
      console.error('Failed to load threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderThread = ({ item }: { item: MessageThread }) => {
    const otherName = user ? getOtherParticipantName(item, user.id) : '';
    
    return (
      <TouchableOpacity
        style={styles.thread}
        onPress={() => router.push(`/(tabs)/messages/${item.id}`)}
        activeOpacity={0.7}
      >
        <Avatar name={otherName} size="medium" />
        <View style={styles.threadInfo}>
          <View style={styles.threadHeader}>
            <Text style={styles.name}>{otherName}</Text>
            <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (threads.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No Messages Yet"
          message="Start a conversation by messaging a mentor from their profile."
        />
      </Screen>
    );
  }

  return (
    <Screen padding="none" contentContainerStyle={styles.screenContent}>
      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  thread: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  threadInfo: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  preview: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
