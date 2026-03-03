import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import * as authApi from '../services/auth';

interface MFAChallengeProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MFAChallenge: React.FC<MFAChallengeProps> = ({ onSuccess, onCancel }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const { mfaResolver, verifyMfaCode, clearMfaResolver } = useAuth();

  useEffect(() => {
    if (mfaResolver && !verificationId) {
      sendSmsCode();
    }
  }, [mfaResolver]);

  const sendSmsCode = async () => {
    if (!mfaResolver) return;

    setSendingCode(true);
    setError('');

    try {
      const vid = await authApi.sendMfaSmsCode(mfaResolver);
      setVerificationId(vid);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!verificationId) {
      setError('No verification ID available. Please try again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyMfaCode(verificationId, code);
      onSuccess?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid verification code. Please try again.');
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

  const phoneHint = mfaResolver.hints[0]?.displayName || 'your phone';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          {sendingCode
            ? 'Sending verification code...'
            : `Enter the 6-digit code sent to ${phoneHint}`}
        </Text>
      </View>

      {sendingCode ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
        </View>
      )}

      <View id="recaptcha-container" style={styles.recaptchaContainer} />
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
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
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
  recaptchaContainer: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
});
