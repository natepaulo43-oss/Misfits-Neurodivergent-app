import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router, usePathname } from 'expo-router';

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

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Admin Portal</Text>
        {NAV_ITEMS.map(item => {
          const active = pathname?.startsWith(item.route);
          return (
            <Pressable
              key={item.route}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.replace(item.route)}
            >
              <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.main}>
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
});
