import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { generateBackupCodes } from '../services/backupCodes';

interface BackupCodesProps {
  /** Called when the user dismisses the component after saving their codes. */
  onDone?: () => void;
}

type State = 'idle' | 'generating' | 'showing' | 'confirmed';

export const BackupCodes: React.FC<BackupCodesProps> = ({ onDone }) => {
  const [state, setState] = useState<State>('idle');
  const [codes, setCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setState('generating');
    try {
      const newCodes = await generateBackupCodes();
      setCodes(newCodes);
      setSaved(false);
      setState('showing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate backup codes.');
      setState('idle');
    }
  };

  const handleConfirm = () => {
    setState('confirmed');
    onDone?.();
  };

  if (state === 'idle') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Backup Codes</Text>
        <Text style={styles.body}>
          Backup codes let you sign in if you lose access to your phone. Each code works once.
          Keep them somewhere safe — they will only be shown once.
        </Text>
        <Text style={styles.warning}>
          Generating new codes immediately invalidates any previously generated codes.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Generate Backup Codes" onPress={handleGenerate} style={styles.button} />
      </View>
    );
  }

  if (state === 'generating') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generating codes…</Text>
      </View>
    );
  }

  if (state === 'showing') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Save Your Backup Codes</Text>
        <Text style={styles.body}>
          Store these somewhere secure — a password manager, printed paper, or encrypted notes.
          These codes will not be shown again.
        </Text>

        <View style={styles.codesGrid}>
          {codes.map((code, i) => (
            <View key={i} style={styles.codeRow}>
              <Text style={styles.codeIndex}>{i + 1}.</Text>
              <Text style={styles.codeText}>{code}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setSaved((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, saved && styles.checkboxChecked]}>
            {saved ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>I have saved these codes in a safe place</Text>
        </TouchableOpacity>

        <Button
          title="Done"
          onPress={handleConfirm}
          disabled={!saved}
          style={styles.button}
        />
      </ScrollView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  warning: {
    ...typography.bodySmall,
    color: colors.error,
    lineHeight: 20,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  codesGrid: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeIndex: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    width: 20,
    textAlign: 'right',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 2,
    color: colors.textPrimary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkLabel: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  button: {},
  error: {
    ...typography.bodySmall,
    color: colors.error,
  },
});
