import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

type NavItem = {
  label: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', route: '/(admin)' },
  { label: 'Curated Content', route: '/(admin)/curated-content' },
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
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const visibleNav = !isCompact || menuOpen;
  const showUserBadge = width >= 480;

  const handleNavPress = (route: string) => {
    router.replace(route);
    if (isCompact) {
      setMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('[admin] Failed to log out', error);
      Alert.alert('Logout failed', 'Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const activeLabel = useMemo(() => {
    const current = NAV_ITEMS.find(item => pathname?.startsWith(item.route));
    return current?.label ?? 'Dashboard';
  }, [pathname]);

  const userDisplayName = user?.name ?? user?.email ?? 'Admin user';
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const userRoleLabel =
    user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1).replace(/_/g, ' ') ?? '') || 'Admin';

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
          <View style={styles.topActions}>
            {showUserBadge ? (
              <View style={styles.userBadge}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{userInitial}</Text>
                </View>
                <View>
                  <Text style={styles.userName} numberOfLines={1}>
                    {userDisplayName}
                  </Text>
                  <Text style={styles.userRole}>{userRoleLabel}</Text>
                </View>
              </View>
            ) : null}
            <Pressable
              style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              disabled={isLoggingOut}
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={styles.logoutText}>{isLoggingOut ? 'Logging out…' : 'Logout'}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={menuOpen ? 'Close admin menu' : 'Open admin menu'}
              style={styles.menuButton}
              onPress={() => setMenuOpen(prev => !prev)}
            >
              <Ionicons name={menuOpen ? 'close' : 'menu'} size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 0,
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
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  userName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    maxWidth: 140,
  },
  userRole: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.error,
    backgroundColor: colors.surface,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },
});
