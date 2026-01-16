import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button, Screen, Card } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

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

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.buttonStack}>
          <Button
            title="Browse Mentors"
            onPress={() => router.push('/(tabs)/mentors')}
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
});
