import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

import { AdminLayout, Card, Button, Input, LoadingSpinner, EmptyState } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { User } from '../../types';
import {
  fetchPendingMentorApplications,
  reviewMentorApplication,
} from '../../services/admin';

export default function MentorApplicationsScreen() {
  const [applications, setApplications] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const pending = await fetchPendingMentorApplications();
      setApplications(pending);
    } catch (error) {
      console.error('[admin] Failed to load mentor applications', error);
      Alert.alert('Error', 'Unable to load mentor applications. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleDecision = async (userId: string, decision: 'approve' | 'reject') => {
    setActionId(userId);
    try {
      await reviewMentorApplication(userId, {
        decision,
        adminNotes: adminNotes[userId],
      });
      await loadApplications();
    } catch (error) {
      console.error('[admin] Failed to review mentor application', error);
      Alert.alert('Error', 'Unable to submit decision. Please retry.');
    } finally {
      setActionId(null);
    }
  };

  const renderApplicationCard = (user: User) => {
    const submittedAt = user.mentorApplicationSubmittedAt
      ? new Date(user.mentorApplicationSubmittedAt).toLocaleString()
      : 'Unknown';

    return (
      <Card key={user.id} style={styles.card}>
        <Text style={styles.eyebrow}>Approval status: pending</Text>
        <Text style={styles.cardTitle}>{user.name}</Text>
        <Text style={styles.cardMeta}>
          Submitted {submittedAt} • Email: {user.email}
        </Text>
        {user.mentorProfile ? (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Mentor profile snapshot</Text>
            <Text style={styles.profileField}>
              Role: {user.mentorProfile.currentRole || 'Unknown'}
            </Text>
            <Text style={styles.profileField}>
              Focus areas: {user.mentorProfile.focusAreas?.join(', ') || 'n/a'}
            </Text>
            <Text style={styles.profileField}>
              Expertise: {user.mentorProfile.expertiseAreas?.join(', ') || 'n/a'}
            </Text>
          </View>
        ) : (
          <Text style={styles.warning}>No mentor profile submitted.</Text>
        )}

        <Input
          label="Admin notes (stored alongside decision)"
          value={adminNotes[user.id] ?? ''}
          onChangeText={text => setAdminNotes(prev => ({ ...prev, [user.id]: text }))}
          multiline
          numberOfLines={3}
        />

        <View style={styles.actions}>
          <Button
            title="Reject"
            variant="outline"
            onPress={() => handleDecision(user.id, 'reject')}
            loading={actionId === user.id && applications.length > 0}
            style={styles.actionButton}
          />
          <Button
            title="Approve"
            onPress={() => handleDecision(user.id, 'approve')}
            loading={actionId === user.id && applications.length > 0}
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
      title="Mentor approvals"
      subtitle="Each decision is audited. Document rationale per OWASP ASVS before approving or rejecting."
    >
      {applications.length === 0 ? (
        <EmptyState
          title="No pending mentors"
          message="You’re all caught up. New mentor requests will appear here automatically."
        />
      ) : (
        <View style={styles.list}>{applications.map(renderApplicationCard)}</View>
      )}
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  profileSection: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileField: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  warning: {
    ...typography.bodySmall,
    color: colors.error,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
