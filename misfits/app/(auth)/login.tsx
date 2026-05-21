import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Screen, Card, MFAChallenge } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { auth } from '../../services/firebase';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useAppleSignIn } from '../../hooks/useAppleSignIn';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const { login, loginWithGoogle, mfaRequired, pendingLinkEmail } = useAuth();
  const loginPendingRef = useRef(false);
  const googlePendingRef = useRef(false);

  const handleNativeGoogleSuccess = () => {
    const isReviewerAccount = auth.currentUser?.email === 'REDACTED';
    if (auth.currentUser && !auth.currentUser.emailVerified && !isReviewerAccount) {
      router.replace('/(auth)/verify-email');
      return;
    }
    router.replace('/');
  };

  const { signIn: nativeGoogleSignIn, loading: nativeGoogleLoading } = useGoogleSignIn(
    handleNativeGoogleSuccess,
    (errMsg) => setError(errMsg),
  );

  const { signIn: appleSignIn, loading: appleLoading } = useAppleSignIn(
    () => router.replace('/'),
    (errMsg) => setError(errMsg),
  );

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (pendingLinkEmail) {
      setEmail(pendingLinkEmail);
    }
  }, [pendingLinkEmail]);

  const handleLogin = async () => {
    if (loginPendingRef.current) {
      return;
    }

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);
    loginPendingRef.current = true;

    try {
      await login(email, password);

      const isReviewerAccount = auth.currentUser?.email === 'REDACTED';
      if (auth.currentUser && !auth.currentUser.emailVerified && !isReviewerAccount) {
        router.replace('/(auth)/verify-email');
        return;
      }
      
      router.replace('/');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message !== 'MFA verification required') {
          setError(err.message);
        }
      } else {
        setError('Unable to log in. Please try again.');
      }
    } finally {
      setLoading(false);
      loginPendingRef.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    if (googlePendingRef.current) {
      return;
    }

    setError('');
    setGoogleLoading(true);
    googlePendingRef.current = true;

    try {
      await loginWithGoogle();

      const isReviewerAccount = auth.currentUser?.email === 'REDACTED';
      if (auth.currentUser && !auth.currentUser.emailVerified && !isReviewerAccount) {
        router.replace('/(auth)/verify-email');
        return;
      }
      
      router.replace('/');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message !== 'MFA verification required') {
          setError(err.message);
        }
      } else {
        setError('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
      googlePendingRef.current = false;
    }
  };

  const handleMfaSuccess = () => {
    router.replace('/');
  };

  const handleMfaCancel = () => {
    setError('');
  };

  return (
    <Screen scroll centerContent keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
          {mfaRequired ? (
            <MFAChallenge onSuccess={handleMfaSuccess} onCancel={handleMfaCancel} />
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in to continue your journey with The Misfits Project.
                </Text>
              </View>

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

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  maxLength={128}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  title="Log In"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.button}
                />

                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/forgot-password')}
                  style={styles.forgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Button
                      title="Continue with Google"
                      onPress={handleGoogleLogin}
                      loading={googleLoading}
                      variant="outline"
                      style={styles.googleButton}
                    />
                  </>
                )}

                {Platform.OS !== 'web' && (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <Button
                      title="Continue with Google"
                      onPress={nativeGoogleSignIn}
                      loading={nativeGoogleLoading}
                      variant="outline"
                      style={styles.googleButton}
                    />

                    {appleAvailable && (
                      <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={8}
                        style={[styles.appleButton, appleLoading && styles.appleButtonDisabled]}
                        onPress={() => { if (!appleLoading) appleSignIn(); }}
                      />
                    )}
                  </>
                )}

                {pendingLinkEmail ? (
                  <View style={styles.linkNotice}>
                    <Text style={styles.linkNoticeText}>
                      An account already exists for {pendingLinkEmail}. Sign in with your password above to link your Google account.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                    <Text style={styles.link}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
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
    lineHeight: 22,
    marginTop: spacing.xs,
    textAlign: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  googleButton: {
    marginBottom: spacing.sm,
  },
  appleButton: {
    width: '100%',
    height: 48,
    marginBottom: spacing.sm,
  },
  appleButtonDisabled: {
    opacity: 0.5,
  },
  linkNotice: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  linkNoticeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
