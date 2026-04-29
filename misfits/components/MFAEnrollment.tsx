import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import type { TotpSecret } from 'firebase/auth';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import * as authApi from '../services/auth';

interface MFAEnrollmentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type Step = 'setup' | 'verify' | 'done';

export const MFAEnrollment: React.FC<MFAEnrollmentProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<Step>('setup');
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateSecret = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await authApi.startMfaEnrollment();
      setTotpSecret(result.secret);
      setQrCodeUrl(result.qrCodeUrl);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start enrollment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAuthenticator = () => {
    if (qrCodeUrl) {
      Linking.openURL(qrCodeUrl).catch(() => {
        setError('Could not open authenticator app. Copy the secret key below to add manually.');
      });
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    if (!totpSecret) {
      setError('Setup error. Please go back and try again.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.completeMfaEnrollment(totpSecret, code);
      setStep('done');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'setup') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Set Up Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          Use an authenticator app like Google Authenticator or Authy to generate one-time codes each time you sign in.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : (
          <>
            <Button title="Set Up Authenticator App" onPress={handleGenerateSecret} style={styles.button} />
            <Button title="Cancel" onPress={onCancel} variant="outline" style={styles.cancelButton} />
          </>
        )}
      </View>
    );
  }

  if (step === 'verify') {
    const secretKey = (totpSecret as any)?.secretKey ?? '';
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Scan with Authenticator App</Text>
        <Text style={styles.subtitle}>
          Open Google Authenticator or Authy, tap the + button, and choose "Scan a QR code" or "Enter a setup key".
        </Text>

        <TouchableOpacity onPress={handleOpenAuthenticator} style={styles.openAppButton} activeOpacity={0.8}>
          <Text style={styles.openAppButtonText}>Open Authenticator App</Text>
        </TouchableOpacity>

        <Text style={styles.orDivider}>— or enter this key manually —</Text>

        <View style={styles.secretBox}>
          <Text style={styles.secretLabel}>Account: Misfits</Text>
          <Text style={styles.secretKey} selectable>{secretKey}</Text>
          <Text style={styles.secretHint}>Type: Time-based (TOTP)</Text>
        </View>

        <Text style={styles.verifyLabel}>Enter the 6-digit code shown in your app:</Text>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          editable={!loading}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : (
          <>
            <Button title="Verify & Enable 2FA" onPress={handleVerifyCode} style={styles.button} />
            <Button
              title="Back"
              onPress={() => { setStep('setup'); setCode(''); setError(''); }}
              variant="outline"
              style={styles.cancelButton}
            />
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Two-Factor Authentication Enabled</Text>
      <Text style={styles.subtitle}>
        Your account is now protected with two-factor authentication. You will be asked for a code from your authenticator app each time you sign in.
      </Text>
      <Button title="Done" onPress={onSuccess} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.md,
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
  openAppButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  openAppButtonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  orDivider: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  secretBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
  },
  secretLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  secretKey: {
    ...typography.body,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  secretHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  verifyLabel: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  codeInput: {
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
    alignSelf: 'center',
    minWidth: 220,
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
  cancelButton: {},
});
