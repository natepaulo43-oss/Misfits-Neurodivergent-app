import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button, Screen } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value ?? 'Not set'}</Text>
  </View>
);

const getRoleLabel = (role?: string | null) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Not set';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const onboardingCompleted = Boolean(user?.onboardingCompleted);
  const statusLabel = onboardingCompleted ? 'Active' : 'Incomplete information';
  const statusDescription = onboardingCompleted
    ? 'Your profile is ready to be shown to matches. Keep your info up to date so we can connect you quickly.'
    : 'To be shown and matched, finish filling in the remaining profile details. We need a complete profile to introduce you.';

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
});
