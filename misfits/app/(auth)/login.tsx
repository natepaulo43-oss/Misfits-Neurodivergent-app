import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Screen, Card, MFAChallenge } from '../../components';
import { colors, spacing, typography } from '../../constants/theme';
import { auth } from '../../services/firebase';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
    <Screen scroll centerContent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
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
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  card: {
    width: '100%',
    maxWidth: 420,
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
