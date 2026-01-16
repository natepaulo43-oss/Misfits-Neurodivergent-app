import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Avatar, LoadingSpinner, EmptyState, Screen } from '../../../components';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { MessageThread, Session } from '../../../types';
import { fetchThreads } from '../../../services/messages';
import { getOtherParticipantName } from '../../../data/mockMessages';
import { getSessionsForUser } from '../../../services/scheduling';
import { formatDateTimeForDisplay } from '../../../utils/scheduling';
import { useAuth } from '../../../context/AuthContext';

type TabView = 'chats' | 'sessions';

export default function MessagesListScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabView>('chats');
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // Load threads and sessions separately to handle errors independently
      const threadsData = await fetchThreads(user.id);
      console.log('[Messages] Loaded threads:', threadsData.length, 'threads');
      console.log('[Messages] Thread details:', threadsData);
      setThreads(threadsData);
      
      // Try to load sessions, but don't fail if index is missing
      try {
        const sessionsData = await getSessionsForUser(user.id, user.role === 'mentor' ? 'mentor' : 'student');
        setSessions(sessionsData);
      } catch (sessionsError) {
        console.warn('[Messages] Sessions query failed (index may be missing):', sessionsError);
        setSessions([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        setLoading(true);
        loadData();
      }
    }, [user, loadData])
  );

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadData();
    } else {
      setThreads([]);
      setSessions([]);
      setLoading(false);
    }
  }, [user, loadData]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderThread = ({ item }: { item: MessageThread }) => {
    const otherName = user ? getOtherParticipantName(item, user.id) : '';
    console.log('[Messages] Rendering thread:', item.id, 'otherName:', otherName, 'lastMessage:', item.lastMessage);
    
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

  const getStatusBadge = (session: Session) => {
    const statusConfig = {
      pending: { label: 'Pending', color: '#F59E0B' },
      confirmed: { label: 'Confirmed', color: '#10B981' },
      declined: { label: 'Declined', color: '#EF4444' },
      reschedule_proposed: { label: 'Reschedule', color: '#8B5CF6' },
      cancelled: { label: 'Cancelled', color: '#6B7280' },
      completed: { label: 'Completed', color: '#3B82F6' },
    };
    const config = statusConfig[session.status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
        <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderSession = ({ item }: { item: Session }) => (
    <TouchableOpacity
      style={styles.thread}
      onPress={() => router.push(`/(tabs)/session-detail?sessionId=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionIcon}>
        <Text style={styles.sessionIconText}>📅</Text>
      </View>
      <View style={styles.threadInfo}>
        <View style={styles.threadHeader}>
          <Text style={styles.name}>
            {user?.role === 'student' ? 'Session with Mentor' : 'Session with Student'}
          </Text>
          {getStatusBadge(item)}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {formatDateTimeForDisplay(new Date(item.confirmedStart || item.requestedStart))}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const pendingCount = sessions.filter(s => s.status === 'pending' || s.status === 'reschedule_proposed').length;

  return (
    <Screen padding="none" contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'chats' && styles.segmentActive]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.segmentText, activeTab === 'chats' && styles.segmentTextActive]}>
            Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'sessions' && styles.segmentActive]}
          onPress={() => setActiveTab('sessions')}
        >
          <Text style={[styles.segmentText, activeTab === 'sessions' && styles.segmentTextActive]}>
            Sessions
          </Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'chats' ? (
        threads.length === 0 ? (
          <EmptyState
            title="No Messages Yet"
            message="Start a conversation by messaging a mentor from their profile."
          />
        ) : (
          <FlatList
            data={threads}
            renderItem={renderThread}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )
      ) : (
        <View style={styles.sessionsContainer}>
          {user?.role === 'student' && (
            <TouchableOpacity
              style={styles.bookSessionButton}
              onPress={() => router.push('/(tabs)/mentors')}
            >
              <Text style={styles.bookSessionText}>📚 Book a Session</Text>
              <Text style={styles.bookSessionSubtext}>Browse mentors to schedule a session</Text>
            </TouchableOpacity>
          )}
          {sessions.length === 0 ? (
            <EmptyState
              title="No Sessions Yet"
              message={user?.role === 'student' ? 'Book your first session with a mentor!' : 'No session requests yet.'}
            />
          ) : (
            <FlatList
              data={sessions}
              renderItem={renderSession}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
    flex: 1,
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
  sessionsContainer: {
    flex: 1,
  },
  bookSessionButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  bookSessionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  bookSessionSubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIconText: {
    fontSize: 24,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
