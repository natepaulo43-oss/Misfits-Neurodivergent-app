import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { AdminLayout, Card, Button } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

type AdminTile = {
  title: string;
  description: string;
  route: string;
};

const adminTiles: AdminTile[] = [
  {
    title: 'Mentor Applications',
    description: 'Approve or reject mentor requests, add admin notes, and audit appeals.',
    route: '/(admin)/mentor-applications',
  },
  {
    title: 'User Management',
    description: 'Suspend or restore accounts and review RBAC assignments.',
    route: '/(admin)/users',
  },
  {
    title: 'Matches Observatory',
    description: 'Run the matching engine for any student and review compatibility signals.',
    route: '/(admin)/matches',
  },
  {
    title: 'Conversations',
    description: 'View threads and messages to enforce community safety.',
    route: '/(admin)/conversations',
  },
];

export default function AdminHomeScreen() {
  return (
    <AdminLayout
      title="Admin Control Center"
      subtitle="Every action is logged per OWASP ASVS. Apply least privilege and document decisions."
    >
      <View style={styles.grid}>
        {adminTiles.map(tile => (
          <Card key={tile.route} style={styles.card}>
            <Text style={styles.cardTitle}>{tile.title}</Text>
            <Text style={styles.cardCopy}>{tile.description}</Text>
            <Button title="Open" onPress={() => router.push(tile.route)} style={styles.cardButton} />
          </Card>
        ))}
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  cardCopy: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cardButton: {
    marginTop: spacing.sm,
  },
});
