import React, { ReactNode, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
  RefreshControlProps,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, spacing } from '../constants/theme';

type PaddingOption = 'none' | 'sm' | 'md' | 'lg';

const paddingValues: Record<PaddingOption, number> = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padding?: PaddingOption | number;
  maxWidth?: number;
  align?: 'left' | 'center';
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  centerContent?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
  keyboardVerticalOffset?: number;
  /**
   * When true, Screen will not wrap content in a KeyboardAvoidingView.
   * Use this when the consumer manages its own keyboard avoidance to
   * avoid double-padding from nested KeyboardAvoidingViews.
   */
  disableKeyboardAvoidance?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  padding = 'lg',
  maxWidth = 600,
  align = 'center',
  contentContainerStyle,
  style,
  centerContent = false,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
  keyboardVerticalOffset = 0,
  disableKeyboardAvoidance = false,
  refreshControl,
}) => {
  const { width } = useWindowDimensions();
  const resolvedPadding = useMemo(() => {
    const basePadding = typeof padding === 'number'
      ? padding
      : paddingValues[padding];
    const isCompact = width < 380;
    return isCompact ? Math.min(basePadding, spacing.md) : basePadding;
  }, [padding, width]);

  const horizontalPadding = Math.min(resolvedPadding, Math.max(12, width * 0.06));
  const verticalPadding = Math.min(resolvedPadding, 32);

  // Cap the inner content area to `maxWidth` so the layout stays
  // consistent across iPhone SE, iPhone Pro Max, and iPad portrait.
  // On phones this resolves to the full screen width; on iPad the
  // content sits centered with whitespace on either side, matching
  // the iPhone visual proportions for brand consistency.
  const contentAreaWidth = Math.min(width, maxWidth + horizontalPadding * 2);

  // Always center the content area horizontally within the SafeAreaView.
  // The `align` prop now only controls how children align *within* the
  // centered content area (stretch for forms, center for cards/auth).
  const containerStyles: StyleProp<ViewStyle> = [
    styles.safeArea,
    styles.alignCenter,
    style,
  ];

  const baseContentStyle: StyleProp<ViewStyle> = [
    scroll ? styles.scrollContent : styles.staticContent,
    {
      paddingVertical: verticalPadding,
      paddingHorizontal: horizontalPadding,
      width: contentAreaWidth,
    },
    // Note: we intentionally do NOT set alignItems here. Children default
    // to flex-stretch within the content area, matching the historical
    // Screen behavior (chat header, form fields, list rows fill the
    // width). Screens that need a narrower child centered (e.g. auth
    // Cards) should use `alignSelf: 'center'` on the child itself.
    centerContent ? styles.centerContent : undefined,
    contentContainerStyle,
  ];

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={baseContentStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      showsVerticalScrollIndicator={false}
      {...(refreshControl ? { refreshControl } : {})}
    >
      {children}
    </ScrollView>
  ) : Platform.OS === 'web' ? (
    <View style={[styles.flex, baseContentStyle]}>{children}</View>
  ) : (
    // Tap outside any text input to dismiss the keyboard. accessible={false}
    // prevents the wrapper from intercepting screen-reader focus.
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <View style={[styles.flex, baseContentStyle]}>{children}</View>
    </TouchableWithoutFeedback>
  );

  const avoidanceEnabled = !disableKeyboardAvoidance && Platform.OS !== 'web';

  return (
    <SafeAreaView style={containerStyles}>
      {avoidanceEnabled ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignStretch: {
    alignItems: 'stretch',
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
});
