import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Screen } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { UserRole } from '../../types';

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { setUserRole } = useAuth();

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      await setUserRole(selectedRole);
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error('Failed to set role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you'd like to use Misfits
          </Text>
        </View>

        <View style={styles.options}>
          <TouchableOpacity
            style={[
              styles.option,
              selectedRole === 'student' && styles.optionSelected,
            ]}
            onPress={() => setSelectedRole('student')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.optionTitle,
              selectedRole === 'student' && styles.optionTitleSelected,
            ]}>
              Student
            </Text>
            <Text style={[
              styles.optionDescription,
              selectedRole === 'student' && styles.optionDescriptionSelected,
            ]}>
              Browse mentors, access books, and get support on your learning journey
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              selectedRole === 'mentor' && styles.optionSelected,
            ]}
            onPress={() => setSelectedRole('mentor')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.optionTitle,
              selectedRole === 'mentor' && styles.optionTitleSelected,
            ]}>
              Mentor
            </Text>
            <Text style={[
              styles.optionDescription,
              selectedRole === 'mentor' && styles.optionDescriptionSelected,
            ]}>
              Share your expertise and help neurodiverse students succeed
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedRole}
          loading={loading}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  options: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  option: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  optionDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  optionDescriptionSelected: {
    color: colors.textPrimary,
  },
  button: {
    marginTop: spacing.md,
  },
});
