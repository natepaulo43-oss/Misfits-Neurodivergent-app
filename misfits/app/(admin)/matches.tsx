import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

import { AdminLayout, Card, Button, Input, LoadingSpinner, EmptyState } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { MatchRecord, User } from '../../types';
import {
  createManualMatch,
  deleteMatch,
  fetchAllUsers,
  fetchMatches,
  toggleMentorMatching,
  updateMatchStatus,
} from '../../services/admin';

const MATCH_STATUSES = ['pending', 'active', 'ended'] as const;

export default function MatchesOversightScreen() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingMatchId, setUpdatingMatchId] = useState<string | null>(null);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [disablingMentorId, setDisablingMentorId] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentId: '',
    mentorId: '',
    notes: '',
  });

  const userLookup = useMemo(() => {
    return users.reduce<Record<string, User>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [users]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [matchData, userData] = await Promise.all([fetchMatches(), fetchAllUsers()]);
      setMatches(matchData);
      setUsers(userData);
    } catch (error) {
      console.error('[admin] Failed to load matches', error);
      Alert.alert('Error', 'Unable to load matches right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateMatch = async () => {
    if (!form.studentId || !form.mentorId) {
      Alert.alert('Missing info', 'Student ID and Mentor ID are required.');
      return;
    }

    setCreating(true);
    try {
      await createManualMatch({
        studentId: form.studentId.trim(),
        studentName: userLookup[form.studentId]?.name,
        mentorId: form.mentorId.trim(),
        mentorName: userLookup[form.mentorId]?.name,
        notes: form.notes.trim() || undefined,
      });
      setForm({ studentId: '', mentorId: '', notes: '' });
      await loadData();
    } catch (error) {
      console.error('[admin] Failed to create manual match', error);
      Alert.alert('Error', 'Unable to create manual match.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (matchId: string, status: MatchRecord['status']) => {
    setUpdatingMatchId(matchId);
    try {
      await updateMatchStatus(matchId, status);
      await loadData();
    } catch (error) {
      console.error('[admin] Failed to update match status', error);
      Alert.alert('Error', 'Unable to update match status.');
    } finally {
      setUpdatingMatchId(null);
    }
  };

  const handleDelete = async (matchId: string) => {
    setDeletingMatchId(matchId);
    try {
      await deleteMatch(matchId);
      await loadData();
    } catch (error) {
      console.error('[admin] Failed to delete match', error);
      Alert.alert('Error', 'Unable to remove match.');
    } finally {
      setDeletingMatchId(null);
    }
  };

  const handleDisableMentor = async (mentorId: string, disable: boolean) => {
    setDisablingMentorId(mentorId);
    try {
      await toggleMentorMatching(mentorId, disable);
      const refreshedUsers = await fetchAllUsers();
      setUsers(refreshedUsers);
    } catch (error) {
      console.error('[admin] Failed to toggle mentor matching', error);
      Alert.alert('Error', 'Unable to toggle mentor eligibility.');
    } finally {
      setDisablingMentorId(null);
    }
  };

  const renderMatchCard = (match: MatchRecord) => {
    const student = userLookup[match.studentId];
    const mentor = userLookup[match.mentorId];
    const mentorMatchingDisabled = mentor?.mentorMatchingDisabled ?? false;

    return (
      <Card key={match.id} style={styles.card}>
        <Text style={styles.cardTitle}>
          {student?.name || match.studentName || match.studentId} ↔{' '}
          {mentor?.name || match.mentorName || match.mentorId}
        </Text>
        <Text style={styles.cardMeta}>
          Created {new Date(match.createdAt).toLocaleString()} • Status: {match.status}
        </Text>
        {match.notes ? <Text style={styles.cardNotes}>{match.notes}</Text> : null}

        <View style={styles.actionsRow}>
          {MATCH_STATUSES.map(status => (
            <Button
              key={status}
              title={status === match.status ? `Set ${status} ✓` : `Set ${status}`}
              variant={status === match.status ? 'secondary' : 'outline'}
              loading={updatingMatchId === match.id}
              onPress={() => handleStatusUpdate(match.id, status)}
              style={styles.actionButton}
            />
          ))}
        </View>
        <View style={styles.actionsRow}>
          <Button
            title={mentorMatchingDisabled ? 'Allow mentor in matches' : 'Disable mentor in matches'}
            onPress={() => handleDisableMentor(match.mentorId, !mentorMatchingDisabled)}
            loading={disablingMentorId === match.mentorId}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Remove match"
            variant="danger"
            onPress={() => handleDelete(match.id)}
            loading={deletingMatchId === match.id}
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <AdminLayout
      title="Matching oversight"
      subtitle="Review active matches, intervene manually, and disable mentors who violate safety policies."
    >
      <Card style={styles.formCard}>
        <Text style={styles.formTitle}>Create manual match override</Text>
        <View style={styles.formRow}>
          <Input
            label="Student ID"
            value={form.studentId}
            onChangeText={text => setForm(prev => ({ ...prev, studentId: text }))}
            containerStyle={styles.formInput}
          />
          <Input
            label="Mentor ID"
            value={form.mentorId}
            onChangeText={text => setForm(prev => ({ ...prev, mentorId: text }))}
            containerStyle={styles.formInput}
          />
        </View>
        <Input
          label="Notes (optional, shown to admins)"
          value={form.notes}
          onChangeText={text => setForm(prev => ({ ...prev, notes: text }))}
          multiline
        />
        <Button title="Create match" onPress={handleCreateMatch} loading={creating} />
      </Card>

      {matches.length === 0 ? (
        <EmptyState title="No matches" message="No matches have been created yet." />
      ) : (
        <View style={styles.list}>{matches.map(renderMatchCard)}</View>
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
  formCard: {
    gap: spacing.sm,
  },
  formTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  formInput: {
    flex: 1,
    minWidth: 180,
  },
});
