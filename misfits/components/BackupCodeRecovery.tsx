import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { redeemAndSignIn } from '../services/backupCodes';

interface BackupCodeRecoveryProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BackupCodeRecovery: React.FC<BackupCodeRecoveryProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { clearMfaResolver } = useAuth();

  // Format code as user types: AAAAA-BBBBB
  const handleCodeChange = (text: string) => {
    const stripped = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (stripped.length <= 5) {
      setCode(stripped);
    } else {
      setCode(`${stripped.slice(0, 5)}-${stripped.slice(5, 10)}`);
    }
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (trimmedCode.replace(/[^A-Z0-9]/g, '').length !== 10) {
      setError('Please enter a valid 10-character backup code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await redeemAndSignIn(trimmedEmail, trimmedCode);
      // Sign-in succeeded — clear the MFA resolver so the challenge UI is dismissed
      clearMfaResolver();
      onSuccess?.();
    } catch (err) {
      if (err instanceof Error) {
        // Translate Firebase function error codes into user-friendly messages
        const msg = err.message.toLowerCase();
        if (msg.includes('too-many-requests') || msg.includes('resource-exhausted')) {
          setError('Too many attempts. Please wait an hour before trying again.');
        } else if (msg.includes('not-found') || msg.includes('invalid-argument')) {
          setError('Email or backup code is incorrect.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outer}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Use a Backup Code</Text>
          <Text style={styles.subtitle}>
            Enter the email address for your account and one of your saved backup codes.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="your@email.com"
              placeholderTextColor={colors.textSecondary}
              maxLength={254}
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Backup Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={handleCodeChange}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="AAAAA-BBBBB"
              placeholderTextColor={colors.textSecondary}
              maxLength={11}
              editable={!loading}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : (
            <>
              <Button title="Sign In" onPress={handleSubmit} style={styles.button} />
              <Button
                title="Back"
                onPress={onCancel}
                variant="outline"
                style={styles.backButton}
              />
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
  },
  container: {
    width: '100%',
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  codeInput: {
    fontFamily: 'monospace',
    fontSize: 18,
    letterSpacing: 3,
    textAlign: 'center',
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  spinner: {
    marginVertical: spacing.md,
  },
  button: {},
  backButton: {},
});
