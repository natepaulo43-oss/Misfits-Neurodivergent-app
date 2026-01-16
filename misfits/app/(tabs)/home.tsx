import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button, Screen, Card } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { getMentorAvailability } from '../../services/scheduling';
import { MentorAvailability } from '../../types';

export default function HomeScreen() {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const [availability, setAvailability] = useState<MentorAvailability | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    if (isMentor && user) {
      checkAvailability();
    }
  }, [isMentor, user]);

  const checkAvailability = async () => {
    if (!user) return;
    setLoadingAvailability(true);
    try {
      const data = await getMentorAvailability(user.id);
      setAvailability(data);
    } catch (error) {
      console.error('Failed to check availability', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const needsAvailabilitySetup = isMentor && (!availability || !availability.weeklyBlocks || availability.weeklyBlocks.length === 0);

  const primaryAction = {
    title: isMentor ? 'Requests' : 'Browse Mentors',
    route: isMentor ? '/(tabs)/messages' : '/(tabs)/mentors',
  };

  return (
    <Screen scroll align="left">
      <Card style={styles.heroCard}>
        <Text style={styles.welcome}>Welcome{user?.name ? `, ${user.name}` : ''}!</Text>
        <Text style={styles.description}>
          {isMentor
            ? "Thanks for offering your time and insight. Check incoming introductions and reply when you're ready."
            : 'Misfits connects neurodiverse students with mentors who understand their learning journey. Browse mentors or explore our curated book collection.'}
        </Text>
      </Card>

      {isMentor && loadingAvailability && (
        <Card style={styles.availabilityCard}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Checking availability...</Text>
        </Card>
      )}

      {isMentor && !loadingAvailability && needsAvailabilitySetup && (
        <Card style={styles.availabilityPromptCard}>
          <Text style={styles.promptTitle}>📅 Set Your Availability</Text>
          <Text style={styles.promptDescription}>
            You haven't set up your availability yet. Students need to see when you're available to book sessions with you.
          </Text>
          <Button
            title="Set Up Availability Now"
            onPress={() => router.push('/(tabs)/availability-setup')}
            style={styles.promptButton}
          />
        </Card>
      )}

      {isMentor && !loadingAvailability && !needsAvailabilitySetup && availability && (
        <Card style={styles.availabilityStatusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusIcon}>✓</Text>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Availability Set</Text>
              <Text style={styles.statusDescription}>
                {availability.weeklyBlocks.length} time {availability.weeklyBlocks.length === 1 ? 'block' : 'blocks'} configured
              </Text>
            </View>
          </View>
          <Button
            title="Edit Availability"
            onPress={() => router.push('/(tabs)/availability-setup')}
            variant="outline"
            size="small"
            style={styles.editButton}
          />
        </Card>
      )}

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.buttonStack}>
          <Button
            title={primaryAction.title}
            onPress={() => router.push(primaryAction.route)}
            size="large"
            style={styles.button}
          />
          <Button
            title={isMentor ? 'Messages' : 'Browse Books'}
            onPress={() => router.push(isMentor ? '/(tabs)/messages' : '/(tabs)/books')}
            size="large"
            variant="secondary"
            style={styles.button}
          />
          <Button
            title="Curated Content Library"
            onPress={() => router.push('/(tabs)/curated')}
            size="large"
            variant="outline"
            style={styles.button}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  welcome: {
    ...typography.title,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    marginTop: spacing.xl,
  },
  buttonStack: {
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  availabilityPromptCard: {
    marginBottom: spacing.lg,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  promptTitle: {
    ...typography.subtitle,
    color: '#92400E',
    marginBottom: spacing.xs,
  },
  promptDescription: {
    ...typography.body,
    color: '#78350F',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  promptButton: {
    backgroundColor: '#F59E0B',
  },
  availabilityStatusCard: {
    marginBottom: spacing.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusIcon: {
    fontSize: 24,
    color: '#10B981',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    ...typography.body,
    fontWeight: '600',
    color: '#065F46',
  },
  statusDescription: {
    ...typography.caption,
    color: '#047857',
  },
  editButton: {
    borderColor: '#10B981',
  },
});
