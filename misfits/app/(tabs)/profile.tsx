import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button, Input } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [interests, setInterests] = useState(user?.interests?.join(', ') || '');
  const [learningDifferences, setLearningDifferences] = useState(
    user?.learningDifferences?.join(', ') || ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        interests: interests.split(',').map(i => i.trim()).filter(Boolean),
        learningDifferences: learningDifferences.split(',').map(l => l.trim()).filter(Boolean),
      });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar name={user?.name} size="large" />
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.role}>{getRoleDisplay(user?.role || 'student')}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!editing && (
              <Button
                title="Edit"
                variant="outline"
                size="small"
                onPress={() => setEditing(true)}
              />
            )}
          </View>

          {editing ? (
            <>
              <Input
                label="Interests"
                placeholder="e.g., Reading, Science, Art"
                value={interests}
                onChangeText={setInterests}
              />
              <Input
                label="Learning Differences"
                placeholder="e.g., ADHD, Dyslexia"
                value={learningDifferences}
                onChangeText={setLearningDifferences}
              />
              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setEditing(false);
                    setInterests(user?.interests?.join(', ') || '');
                    setLearningDifferences(user?.learningDifferences?.join(', ') || '');
                  }}
                  style={styles.editButton}
                />
                <Button
                  title="Save"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.editButton}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Interests</Text>
                <Text style={styles.fieldValue}>
                  {user?.interests?.length ? user.interests.join(', ') : 'Not set'}
                </Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Learning Differences</Text>
                <Text style={styles.fieldValue}>
                  {user?.learningDifferences?.length 
                    ? user.learningDifferences.join(', ') 
                    : 'Not set'}
                </Text>
              </View>
            </>
          )}
        </View>

        <Button
          title="Log Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
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
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  role: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  field: {
    marginBottom: spacing.md,
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
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  editButton: {
    flex: 1,
  },
  logoutButton: {
    marginTop: spacing.lg,
  },
});
