import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button, Input, Screen } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value ?? 'Not set'}</Text>
  </View>
);

const getRoleLabel = (role?: string | null) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Not set';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const role = user?.role;
  const onboardingCompleted = Boolean(user?.onboardingCompleted);
  const statusLabel = onboardingCompleted ? 'Active' : 'Incomplete information';
  const statusDescription = onboardingCompleted
    ? 'Your profile is ready to be shown to matches. Keep your info up to date so we can connect you quickly.'
    : 'To be shown and matched, finish filling in the remaining profile details. We need a complete profile to introduce you.';

  const [appealText, setAppealText] = useState(user?.mentorApplicationAppealText ?? '');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  useEffect(() => {
    setAppealText(user?.mentorApplicationAppealText ?? '');
  }, [user?.mentorApplicationAppealText]);

  const mentorStatus = user?.mentorApplicationStatus;
  const showMentorStatus =
    user?.pendingRole === 'mentor' ||
    mentorStatus === 'submitted' ||
    mentorStatus === 'rejected' ||
    mentorStatus === 'draft';

  const mentorStatusCopy = useMemo(() => {
    switch (mentorStatus) {
      case 'submitted':
        return 'Your mentor application is under review. Our admins verify every adult who works with minors.';
      case 'draft':
        return 'Finish the mentor onboarding steps to submit your application for review.';
      case 'rejected':
        return 'Your mentor application was not approved. You can submit an appeal for the admin team to review.';
      default:
        return 'Mentor request pending. We will notify you once a decision is made.';
    }
  }, [mentorStatus]);

  const mentorAdminNotes = user?.mentorApplicationAdminNotes;

  const handleAppealSubmit = async () => {
    const trimmed = appealText.trim();
    if (!trimmed) {
      Alert.alert('Add details', 'Please explain why you are appealing the decision.');
      return;
    }

    setAppealSubmitting(true);
    try {
      await updateProfile({
        mentorApplicationAppealText: trimmed,
        mentorApplicationAppealSubmittedAt: new Date().toISOString(),
      });
      Alert.alert('Appeal submitted', 'An admin will review your statement and follow up.');
    } catch (error) {
      Alert.alert('Unable to submit appeal', 'Please try again in a few minutes.');
    } finally {
      setAppealSubmitting(false);
    }
  };

  const performLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' ? window.confirm('Are you sure you want to log out?') : true;
      if (confirmed) performLogout();
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  };

  const handleEditOnboarding = () => {
    if (role === 'mentor') {
      router.push('/(onboarding)/mentor');
      return;
    }
    if (role === 'student') {
      router.push('/(onboarding)/student');
      return;
    }
    router.push('/(auth)/role-selection');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar name={user?.name} size="large" />
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.role}>{role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile overview</Text>
          <View
            style={[
              styles.statusPill,
              onboardingCompleted ? styles.statusPillComplete : styles.statusPillPending,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                onboardingCompleted ? styles.statusPillTextComplete : styles.statusPillTextPending,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.statusDescription}>{statusDescription}</Text>
          <InfoRow label="Account name" value={user?.name} />
          <InfoRow label="Role" value={getRoleLabel(role)} />
          <InfoRow label="Status" value={onboardingCompleted ? 'Active' : 'Needs attention'} />
        </View>

        {showMentorStatus && (
          <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <Text style={styles.statusCardTitle}>Mentor approval status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {mentorStatus ? mentorStatus.replace('_', ' ') : 'pending'}
                </Text>
              </View>
            </View>
            <Text style={styles.statusCardCopy}>{mentorStatusCopy}</Text>
            {mentorAdminNotes ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Admin notes</Text>
                <Text style={styles.noteText}>{mentorAdminNotes}</Text>
              </View>
            ) : null}
            {mentorStatus === 'rejected' ? (
              <View style={styles.appealSection}>
                <Text style={styles.appealTitle}>Submit an appeal</Text>
                <Input
                  placeholder="Explain any additional context for the review team."
                  value={appealText}
                  onChangeText={setAppealText}
                  multiline
                  numberOfLines={4}
                  containerStyle={styles.appealInput}
                />
                <Button
                  title="Send appeal to admin team"
                  onPress={handleAppealSubmit}
                  loading={appealSubmitting}
                />
              </View>
            ) : null}
          </View>
        )}

        {!onboardingCompleted && (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Complete your profile</Text>
            <Text style={styles.noticeBody}>
              The more we know about you, the faster we can find the right match. Add any missing
              details before requesting or accepting introductions.
            </Text>
          </View>
        )}

        <Button
          title={onboardingCompleted ? 'Edit full profile' : 'Complete profile information'}
          onPress={handleEditOnboarding}
          style={styles.actionButton}
        />

        <Button
          title="Log Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
  },
  role: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  statusPillComplete: {
    backgroundColor: '#E7F8EE',
  },
  statusPillPending: {
    backgroundColor: '#FFF6EC',
  },
  statusPillText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  statusPillTextComplete: {
    color: colors.success,
  },
  statusPillTextPending: {
    color: '#B26100',
  },
  statusDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  noticeCard: {
    backgroundColor: '#F4F7FB',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  noticeTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  noticeBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  actionButton: {
    marginTop: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusCardTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: '#F4F7FB',
  },
  statusBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusCardCopy: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  noteBox: {
    backgroundColor: '#FFF6EC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  noteLabel: {
    ...typography.caption,
    color: '#B26100',
    textTransform: 'uppercase',
  },
  noteText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  appealSection: {
    gap: spacing.sm,
  },
  appealTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  appealInput: {
    marginBottom: 0,
  },
});
