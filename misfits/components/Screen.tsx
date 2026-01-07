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
} from 'react-native';
import type { FlexAlignType } from 'react-native';
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
  const centeredContentWidth = Math.min(width - horizontalPadding * 2, maxWidth);

  const containerStyles: StyleProp<ViewStyle> = [
    styles.safeArea,
    align === 'center' ? styles.alignCenter : styles.alignStretch,
    align === 'left' ? { paddingHorizontal: horizontalPadding } : undefined,
    style,
  ];

  const baseContentStyle: StyleProp<ViewStyle> = [
    scroll ? styles.scrollContent : styles.staticContent,
    align === 'center'
      ? {
          paddingVertical: verticalPadding,
          paddingHorizontal: horizontalPadding,
          width: centeredContentWidth,
        }
      : {
          paddingVertical: verticalPadding,
          width: '100%',
        },
    centerContent ? styles.centerContent : undefined,
    contentContainerStyle,
  ];

  return (
    <SafeAreaView style={containerStyles}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={baseContentStyle}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
          {...(refreshControl ? { refreshControl } : {})}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={baseContentStyle}>{children}</View>
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
});
