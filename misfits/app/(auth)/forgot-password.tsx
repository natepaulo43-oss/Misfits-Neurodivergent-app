import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Screen, Card } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { sendPasswordReset } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.keyboard}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {success 
                ? 'Check your email for a link to reset your password.'
                : 'Enter your email address and we\'ll send you a link to reset your password.'
              }
            </Text>
          </View>

          {!success ? (
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={254}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Button
                title="Send Reset Link"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.button}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password?</Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.link}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successMessage}>
                Password reset email sent successfully!
              </Text>
              <Button
                title="Back to Login"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.button}
              />
            </View>
          )}
        </Card>
        </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  card: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  link: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success || colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successIconText: {
    fontSize: 48,
    color: colors.background,
    fontWeight: 'bold',
  },
  successMessage: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
