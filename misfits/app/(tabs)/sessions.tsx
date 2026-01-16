import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getSessionsForUser } from '../../services/scheduling';
import { Session } from '../../types';
import { formatDateTimeForDisplay, isDateInPast } from '../../utils/scheduling';

type SessionFilter = 'pending' | 'upcoming' | 'past';

export default function SessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<SessionFilter>('pending');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const role = user.role === 'mentor' ? 'mentor' : 'student';
      const data = await getSessionsForUser(user.id, role);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const getFilteredSessions = (): Session[] => {
    const now = new Date();
    
    switch (filter) {
      case 'pending':
        return sessions.filter(s => 
          s.status === 'pending' || s.status === 'reschedule_proposed'
        );
      case 'upcoming':
        return sessions.filter(s => {
          if (s.status !== 'confirmed') return false;
          const sessionDate = new Date(s.confirmedStart || s.requestedStart);
          return sessionDate >= now;
        });
      case 'past':
        return sessions.filter(s => {
          if (s.status === 'completed' || s.status === 'declined' || s.status === 'cancelled') {
            return true;
          }
          if (s.status === 'confirmed') {
            const sessionDate = new Date(s.confirmedStart || s.requestedStart);
            return sessionDate < now;
          }
          return false;
        });
      default:
        return sessions;
    }
  };

  const getStatusBadge = (session: Session) => {
    const statusConfig = {
      pending: { label: 'Pending', color: '#F59E0B' },
      confirmed: { label: 'Confirmed', color: '#10B981' },
      declined: { label: 'Declined', color: '#EF4444' },
      reschedule_proposed: { label: 'Reschedule Proposed', color: '#8B5CF6' },
      cancelled: { label: 'Cancelled', color: '#6B7280' },
      completed: { label: 'Completed', color: '#3B82F6' },
    };

    const config = statusConfig[session.status];
    return (
      <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const handleSessionPress = (session: Session) => {
    router.push({
      pathname: '/(tabs)/session-detail',
      params: { sessionId: session.id },
    });
  };

  const filteredSessions = getFilteredSessions();

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sessions</Text>
          {user?.role === 'mentor' && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/availability-setup')}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsButtonText}>Availability</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
          >
            <Text
              style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}
            >
              Pending
            </Text>
            {sessions.filter(s => s.status === 'pending' || s.status === 'reschedule_proposed').length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {sessions.filter(s => s.status === 'pending' || s.status === 'reschedule_proposed').length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
            onPress={() => setFilter('upcoming')}
          >
            <Text
              style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
            onPress={() => setFilter('past')}
          >
            <Text
              style={[styles.filterText, filter === 'past' && styles.filterTextActive]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {filter} sessions</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'pending' && user?.role === 'student' && 'Book a session with a mentor to get started'}
                {filter === 'pending' && user?.role === 'mentor' && 'You have no pending session requests'}
                {filter === 'upcoming' && 'No upcoming sessions scheduled'}
                {filter === 'past' && 'No past sessions yet'}
              </Text>
            </View>
          ) : (
            filteredSessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => handleSessionPress(session)}
              >
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>
                      {user?.role === 'student' ? 'Session with Mentor' : 'Session with Student'}
                    </Text>
                    {getStatusBadge(session)}
                  </View>
                </View>

                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionDate}>
                    {formatDateTimeForDisplay(
                      new Date(session.confirmedStart || session.requestedStart)
                    )}
                  </Text>
                  
                  {session.studentNotes && (
                    <Text style={styles.sessionNotes} numberOfLines={2}>
                      {session.studentNotes}
                    </Text>
                  )}

                  {session.status === 'reschedule_proposed' && user?.role === 'student' && (
                    <View style={styles.actionBanner}>
                      <Text style={styles.actionBannerText}>
                        Mentor proposed new times - tap to review
                      </Text>
                    </View>
                  )}

                  {session.status === 'pending' && user?.role === 'mentor' && (
                    <View style={styles.actionBanner}>
                      <Text style={styles.actionBannerText}>
                        Tap to accept or decline
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  settingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#6366F1',
  },
  filterBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionHeader: {
    marginBottom: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    gap: 8,
  },
  sessionDate: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sessionNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionBanner: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  actionBannerText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
});
