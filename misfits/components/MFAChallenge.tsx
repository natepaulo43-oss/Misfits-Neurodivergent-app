import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { BackupCodeRecovery } from './BackupCodeRecovery';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface MFAChallengeProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MAX_ATTEMPTS = 5;

export const MFAChallenge: React.FC<MFAChallengeProps> = ({ onSuccess, onCancel }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const { mfaResolver, verifyMfaCode, clearMfaResolver } = useAuth();

  const handleVerifyCode = async () => {
    if (attempts >= MAX_ATTEMPTS) {
      setError('Too many failed attempts. Please cancel and try signing in again.');
      return;
    }

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyMfaCode(code);
      onSuccess?.();
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setError('Too many failed attempts. Please cancel and try signing in again.');
        clearMfaResolver();
        onCancel?.();
      } else if (err instanceof Error) {
        setError(`${err.message} (${MAX_ATTEMPTS - nextAttempts} attempt${MAX_ATTEMPTS - nextAttempts === 1 ? '' : 's'} remaining)`);
      } else {
        setError(`Invalid code. Please try again. (${MAX_ATTEMPTS - nextAttempts} attempts remaining)`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearMfaResolver();
    onCancel?.();
  };

  if (!mfaResolver) {
    return null;
  }

  if (showRecovery) {
    return (
      <BackupCodeRecovery
        onSuccess={onSuccess}
        onCancel={() => setShowRecovery(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          Open your authenticator app and enter the 6-digit code.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            editable={!loading}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Verify Code"
          onPress={handleVerifyCode}
          loading={loading}
          disabled={code.length !== 6}
          style={styles.button}
        />

        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          disabled={loading}
          style={styles.cancelButton}
        />

        <TouchableOpacity
          onPress={() => setShowRecovery(true)}
          style={styles.recoveryLink}
          disabled={loading}
        >
          <Text style={styles.recoveryLinkText}>Can't access your app? Use a backup code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
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
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    alignItems: 'center',
  },
  input: {
    ...typography.title,
    fontSize: 32,
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minWidth: 220,
  },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
  recoveryLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  recoveryLinkText: {
    ...typography.bodySmall,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
