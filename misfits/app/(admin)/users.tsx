import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

import { AdminLayout, Card, Button, Input, LoadingSpinner, EmptyState } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { User } from '../../types';
import {
  fetchAllUsers,
  toggleMentorMatching,
  toggleUserMessaging,
  updateUserSuspension,
} from '../../services/admin';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [messagingToggleId, setMessagingToggleId] = useState<string | null>(null);
  const [matchingToggleId, setMatchingToggleId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await fetchAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('[admin] Failed to load users', error);
      Alert.alert('Error', 'Unable to load users. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSuspension = async (user: User) => {
    setSuspendingId(user.id);
    try {
      await updateUserSuspension(user.id, !user.accountSuspended, user.suspensionReason || undefined);
      await loadUsers();
    } catch (error) {
      console.error('[admin] Failed to toggle suspension', error);
      Alert.alert('Error', 'Unable to update suspension. Please retry.');
    } finally {
      setSuspendingId(null);
    }
  };

  const handleMessagingToggle = async (user: User) => {
    setMessagingToggleId(user.id);
    try {
      await toggleUserMessaging(user.id, !user.messagingDisabled);
      await loadUsers();
    } catch (error) {
      console.error('[admin] Failed to toggle messaging', error);
      Alert.alert('Error', 'Unable to update messaging capability.');
    } finally {
      setMessagingToggleId(null);
    }
  };

  const handleMatchingToggle = async (user: User) => {
    setMatchingToggleId(user.id);
    try {
      await toggleMentorMatching(user.id, !user.mentorMatchingDisabled);
      await loadUsers();
    } catch (error) {
      console.error('[admin] Failed to toggle matching', error);
      Alert.alert('Error', 'Unable to update matching eligibility.');
    } finally {
      setMatchingToggleId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      user =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term),
    );
  }, [users, search]);

  const renderUserCard = (user: User) => {
    const status = user.accountSuspended ? 'Suspended' : 'Active';
    return (
      <Card key={user.id} style={styles.card}>
        <Text style={styles.cardTitle}>{user.name || 'Unnamed user'}</Text>
        <Text style={styles.cardMeta}>
          {user.email} • Role: {user.role ?? 'unset'}
        </Text>
        {user.pendingRole === 'mentor' && user.mentorApplicationStatus !== 'approved' ? (
          <Text style={styles.pendingBadge}>Approval status: {user.mentorApplicationStatus}</Text>
        ) : null}
        {user.mentorApplicationStatus === 'rejected' && user.mentorApplicationAppealText ? (
          <View style={styles.appealBox}>
            <Text style={styles.appealLabel}>Appeal statement:</Text>
            <Text style={styles.appealText}>{user.mentorApplicationAppealText}</Text>
          </View>
        ) : null}
        <Text style={styles.statusLine}>
          Status: <Text style={user.accountSuspended ? styles.statusSuspended : styles.statusActive}>{status}</Text>
        </Text>
        <Text style={styles.statusLine}>
          Messaging: <Text style={user.messagingDisabled ? styles.statusSuspended : styles.statusActive}>{user.messagingDisabled ? 'Disabled' : 'Enabled'}</Text>
        </Text>
        {user.role === 'mentor' ? (
          <Text style={styles.statusLine}>
            Appears in matching:{' '}
            <Text style={user.mentorMatchingDisabled ? styles.statusSuspended : styles.statusActive}>
              {user.mentorMatchingDisabled ? 'Disabled' : 'Enabled'}
            </Text>
          </Text>
        ) : null}
        <Button
          title={user.accountSuspended ? 'Reinstate user' : 'Suspend user'}
          variant={user.accountSuspended ? 'secondary' : 'outline'}
          loading={suspendingId === user.id}
          onPress={() => handleSuspension(user)}
        />
        <Button
          title={user.messagingDisabled ? 'Enable messaging' : 'Disable messaging'}
          onPress={() => handleMessagingToggle(user)}
          loading={messagingToggleId === user.id}
          variant="outline"
        />
        {user.role === 'mentor' ? (
          <Button
            title={user.mentorMatchingDisabled ? 'Allow matching' : 'Disable from matching'}
            onPress={() => handleMatchingToggle(user)}
            loading={matchingToggleId === user.id}
            variant="outline"
          />
        ) : null}
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <AdminLayout
      title="User management"
      subtitle="Suspend, reinstate, and oversee account safety from one place."
    >
      <Input
        placeholder="Search by name, email, or role"
        value={search}
        onChangeText={setSearch}
        containerStyle={styles.searchInput}
      />

      {filteredUsers.length === 0 ? (
        <EmptyState title="No users" message="No users match the current filter." />
      ) : (
        <View style={styles.list}>{filteredUsers.map(renderUserCard)}</View>
      )}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    marginBottom: spacing.lg,
  },
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
  pendingBadge: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  appealBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  appealLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  appealText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  statusLine: {
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
