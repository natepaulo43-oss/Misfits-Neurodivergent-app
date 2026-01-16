import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { Screen, Button } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function MentorSubmittedScreen() {
  const { logout } = useAuth();

  const handleRefreshStatus = () => {
    router.replace('/');
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Mentor access pending</Text>
          <Text style={styles.title}>Thank you for applying!</Text>
          <Text style={styles.body}>
            Your request to become a mentor was submitted successfully. We keep mentor and student data
            private to keep everyone safe. We’ll email you as soon as you’re approved.
          </Text>
          <Text style={styles.note}>
            You can close the app for now. Come back later or refresh to check your status.
          </Text>
        </View>

        <Button title="Check status" onPress={handleRefreshStatus} />
        <Button title="Sign out" variant="outline" onPress={handleSignOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  note: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
