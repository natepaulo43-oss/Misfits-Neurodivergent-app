import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcome}>
            Welcome{user?.name ? `, ${user.name}` : ''}!
          </Text>
          <Text style={styles.description}>
            Misfits connects neurodiverse students with mentors who understand 
            their unique learning journey. Browse our community of mentors or 
            explore our curated book collection.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Browse Mentors"
            onPress={() => router.push('/(tabs)/mentors')}
            size="large"
            style={styles.button}
          />
          <Button
            title="Browse Books"
            onPress={() => router.push('/(tabs)/books')}
            size="large"
            variant="outline"
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xxl,
  },
  welcome: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
});
