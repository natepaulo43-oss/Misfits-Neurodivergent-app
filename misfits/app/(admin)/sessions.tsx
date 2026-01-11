import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

import { AdminLayout, Card, Button, LoadingSpinner, EmptyState } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { SessionRecord, User } from '../../types';
import { fetchAllUsers, fetchSessions, updateSessionStatus } from '../../services/admin';

const SESSION_STATUSES: SessionRecord['status'][] = [
  'requested',
  'accepted',
  'declined',
  'completed',
  'canceled',
];

export default function SessionsOversightScreen() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const userLookup = useMemo(() => {
    return users.reduce<Record<string, User>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [users]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionData, userData] = await Promise.all([fetchSessions(), fetchAllUsers()]);
      setSessions(sessionData);
      setUsers(userData);
    } catch (error) {
      console.error('[admin] Failed to load sessions', error);
      Alert.alert('Error', 'Unable to load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (session: SessionRecord, status: SessionRecord['status']) => {
    setUpdatingId(session.id);
    try {
      await updateSessionStatus(session.id, status);
      await loadData();
    } catch (error) {
      console.error('[admin] Failed to update session', error);
      Alert.alert('Error', 'Unable to update session status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderSessionCard = (session: SessionRecord) => {
    const student = userLookup[session.studentId];
    const mentor = userLookup[session.mentorId];

    return (
      <Card key={session.id} style={styles.card}>
        <Text style={styles.cardTitle}>
          {student?.name || session.studentId} with {mentor?.name || session.mentorId}
        </Text>
        <Text style={styles.cardMeta}>
          Scheduled {new Date(session.scheduledFor).toLocaleString()} • Status: {session.status}
        </Text>
        {session.topic ? <Text style={styles.cardMeta}>Topic: {session.topic}</Text> : null}
        {session.notes ? <Text style={styles.cardNotes}>{session.notes}</Text> : null}
        <View style={styles.actionsRow}>
          {SESSION_STATUSES.map(status => (
            <Button
              key={status}
              title={status === session.status ? `Set ${status} ✓` : `Set ${status}`}
              variant={status === session.status ? 'secondary' : 'outline'}
              onPress={() => handleStatusChange(session, status)}
              loading={updatingId === session.id}
              style={styles.actionButton}
            />
          ))}
        </View>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <AdminLayout
      title="Session oversight"
      subtitle="Monitor upcoming sessions and intervene to keep mentees safe."
    >
      {sessions.length === 0 ? (
        <EmptyState title="No sessions" message="No sessions have been scheduled yet." />
      ) : (
        <View style={styles.list}>{sessions.map(renderSessionCard)}</View>
      )}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardNotes: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
    minWidth: 120,
  },
});
