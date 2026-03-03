import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { colors, spacing, typography } from '../constants/theme';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Failed to reload app:', error);
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.icon}>😕</Text>
            <Text style={styles.title}>Oops!</Text>
            <Text style={styles.message}>
              Something went wrong. We've logged the error and will fix it soon.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}
            <Button
              title="Restart App"
              onPress={this.handleRestart}
              style={styles.button}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    gap: spacing.lg,
  },
  icon: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    width: '100%',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    fontFamily: 'monospace',
  },
  button: {
    marginTop: spacing.lg,
    minWidth: 200,
  },
});
