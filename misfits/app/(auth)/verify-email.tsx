import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button, Screen, Card } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';

export default function VerifyEmailScreen() {
  const { user: appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resendPendingRef = useRef(false);
  const checkPendingRef = useRef(false);

  const user = auth.currentUser;
  const userEmail = user?.email || 'your email';

  useEffect(() => {
    if (lastResendTime) {
      const elapsed = Math.floor((Date.now() - lastResendTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      
      if (remaining > 0) {
        setResendCooldown(remaining);
      }
    }
  }, [lastResendTime]);

  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setResendCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendPendingRef.current || resendCooldown > 0) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No user found. Please sign up again.');
      router.replace('/(auth)/signup');
      return;
    }

    setLoading(true);
    resendPendingRef.current = true;

    try {
      await sendEmailVerification(user);
      
      const now = Date.now();
      setLastResendTime(now);
      setResendCooldown(60);
      
      Alert.alert(
        'Email Sent',
        'A new verification email has been sent. Please check your inbox and spam folder.'
      );
    } catch (error: any) {
      console.error('Failed to resend verification email:', error instanceof Error ? error.message : 'Unknown error');
      
      if (error?.code === 'auth/too-many-requests') {
        Alert.alert(
          'Too Many Requests',
          'Please wait a few minutes before requesting another verification email.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to send verification email. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
      resendPendingRef.current = false;
    }
  };

  const handleCheckVerification = async () => {
    if (checkPendingRef.current) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'No user found. Please sign up again.');
      router.replace('/(auth)/signup');
      return;
    }

    setCheckingStatus(true);
    checkPendingRef.current = true;

    try {
      await user.reload();
      
      // Reviewer test account bypass (for App Store review)
      const isReviewerAccount = user.email === 'REDACTED';
      const isVerified = user.emailVerified || isReviewerAccount;
      
      if (isVerified) {
        // Determine the correct route based on user's role status
        let nextRoute = '/';
        
        if (appUser) {
          if (!appUser.role) {
            // User hasn't selected a role yet
            if (appUser.pendingRole === 'mentor') {
              if (appUser.mentorApplicationStatus === 'submitted') {
                nextRoute = '/(onboarding)/mentor-submitted';
              } else {
                nextRoute = '/(onboarding)/mentor';
              }
            } else {
              nextRoute = '/(auth)/role-selection';
            }
          } else if (appUser.role === 'admin') {
            nextRoute = '/(admin)';
          } else if (!appUser.onboardingCompleted && appUser.role === 'student') {
            nextRoute = '/(onboarding)/student';
          } else {
            nextRoute = '/(tabs)/home';
          }
        }
        
        Alert.alert(
          'Email Verified!',
          'Your email has been verified successfully. You can now continue.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace(nextRoute),
            },
          ]
        );
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Your email has not been verified yet. Please check your inbox and click the verification link.'
        );
      }
    } catch (error) {
      console.error('Failed to check verification status:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert(
        'Error',
        'Failed to check verification status. Please try again.'
      );
    } finally {
      setCheckingStatus(false);
      checkPendingRef.current = false;
    }
  };

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  return (
    <Screen centerContent>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>📧</Text>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification email to:
          </Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            1. Check your inbox (and spam folder)
          </Text>
          <Text style={styles.instructionText}>
            2. Click the verification link in the email
          </Text>
          <Text style={styles.instructionText}>
            3. Return here and click "Check Verification Status"
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Check Verification Status"
            onPress={handleCheckVerification}
            loading={checkingStatus}
            style={styles.button}
          />

          <Button
            title={
              resendCooldown > 0
                ? `Resend Email (${resendCooldown}s)`
                : 'Resend Verification Email'
            }
            onPress={handleResendEmail}
            loading={loading}
            disabled={resendCooldown > 0}
            variant="outline"
            style={styles.button}
          />

          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Didn't receive the email? Check your spam folder or try resending.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.sm,
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
    marginTop: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  instructions: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  instructionText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    width: '100%',
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
