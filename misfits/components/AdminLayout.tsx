import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../constants/theme';

type NavItem = {
  label: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/(admin)' },
  { label: 'Mentor Applications', route: '/(admin)/mentor-applications' },
  { label: 'User Management', route: '/(admin)/users' },
  { label: 'Messaging Moderation', route: '/(admin)/conversations' },
  { label: 'Matches', route: '/(admin)/matches' },
  { label: 'Sessions', route: '/(admin)/sessions' },
];

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleNav = !isCompact || menuOpen;

  const handleNavPress = (route: string) => {
    router.replace(route);
    if (isCompact) {
      setMenuOpen(false);
    }
  };

  const activeLabel = useMemo(() => {
    const current = NAV_ITEMS.find(item => pathname?.startsWith(item.route));
    return current?.label ?? 'Dashboard';
  }, [pathname]);

  return (
    <View style={styles.root}>
      {visibleNav ? (
        <View style={[styles.sidebar, isCompact && styles.sidebarFloating]}>
          <Pressable style={styles.logo} onPress={() => handleNavPress('/(admin)')}>
            <View style={styles.logoMark} />
            <View>
              <Text style={styles.logoTitle}>Misfits</Text>
              <Text style={styles.logoSubtitle}>Admin Portal</Text>
            </View>
          </Pressable>
          {NAV_ITEMS.map(item => {
            const active = pathname?.startsWith(item.route);
            return (
              <Pressable
                key={item.route}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => handleNavPress(item.route)}
              >
                <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {isCompact && menuOpen && <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)} />}

      <View style={styles.main}>
        <View style={styles.topBar}>
          <Pressable style={styles.topLogo} onPress={() => handleNavPress('/(admin)')}>
            <View style={styles.logoMarkSmall} />
            <Text style={styles.topLogoText}>{activeLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={menuOpen ? 'Close admin menu' : 'Open admin menu'}
            style={styles.menuButton}
            onPress={() => setMenuOpen(prev => !prev)}
          >
            <Ionicons name={menuOpen ? 'close' : 'menu'} size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {actions ? <View style={styles.actions}>{actions}</View> : null}
          </View>
          {children}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    position: 'relative',
  },
  sidebar: {
    width: 220,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sidebarTitle: {
    ...typography.subtitle,
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },
  navItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  navItemActive: {
    backgroundColor: colors.primaryLight,
  },
  navText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  main: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 24,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sidebarFloating: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.xl * 2,
    zIndex: 3,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: borderRadius.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    zIndex: 2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topLogoText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMarkSmall: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  logoTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  logoSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
