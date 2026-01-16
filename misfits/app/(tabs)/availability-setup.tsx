import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { getMentorAvailability, saveMentorAvailability } from '../../services/scheduling';
import { WeeklyAvailabilityBlock, AvailabilityException } from '../../types';
import {
  getDeviceTimezone,
  getDayOfWeekLabel,
  formatTimeString,
  parseTimeString,
  validateAvailability,
} from '../../utils/scheduling';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const SESSION_DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
];

export default function AvailabilitySetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState(getDeviceTimezone());
  const [weeklyBlocks, setWeeklyBlocks] = useState<WeeklyAvailabilityBlock[]>([]);
  const [sessionDurations, setSessionDurations] = useState<number[]>([30]);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState<number | undefined>(3);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);

  useEffect(() => {
    loadExistingAvailability();
  }, []);

  const loadExistingAvailability = async () => {
    if (!user) return;

    try {
      const existing = await getMentorAvailability(user.id);
      if (existing) {
        setTimezone(existing.timezone);
        setWeeklyBlocks(existing.weeklyBlocks);
        setSessionDurations(existing.sessionDurations);
        setBufferMinutes(existing.bufferMinutes);
        setMaxSessionsPerDay(existing.maxSessionsPerDay);
        setExceptions(existing.exceptions);
      }
    } catch (error) {
      console.error('Failed to load availability', error);
    } finally {
      setLoading(false);
    }
  };

  const addTimeBlock = () => {
    const newBlock: WeeklyAvailabilityBlock = {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
    };
    setWeeklyBlocks([...weeklyBlocks, newBlock]);
  };

  const updateBlock = (index: number, updates: Partial<WeeklyAvailabilityBlock>) => {
    const updated = [...weeklyBlocks];
    updated[index] = { ...updated[index], ...updates };
    setWeeklyBlocks(updated);
  };

  const removeBlock = (index: number) => {
    setWeeklyBlocks(weeklyBlocks.filter((_, i) => i !== index));
  };

  const copyBlockToOtherDays = (index: number) => {
    const block = weeklyBlocks[index];
    const newBlocks = [...weeklyBlocks];
    
    DAYS_OF_WEEK.forEach(day => {
      if (day.value !== block.dayOfWeek) {
        const exists = newBlocks.some(b => b.dayOfWeek === day.value);
        if (!exists) {
          newBlocks.push({
            dayOfWeek: day.value,
            startTime: block.startTime,
            endTime: block.endTime,
          });
        }
      }
    });
    
    setWeeklyBlocks(newBlocks.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  };

  const handleSave = async () => {
    if (!user) return;

    const availability = {
      timezone,
      weeklyBlocks,
      sessionDurations,
      bufferMinutes,
      maxSessionsPerDay,
      exceptions,
    };

    const errors = validateAvailability(availability);
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      await saveMentorAvailability(user.id, availability);
      Alert.alert('Success', 'Your availability has been saved!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

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
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Set Your Availability</Text>
        <Text style={styles.subtitle}>
          Students will only be able to book sessions during your available times.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timezone</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{timezone}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Duration Options</Text>
          <View style={styles.chipContainer}>
            {SESSION_DURATIONS.map(duration => (
              <TouchableOpacity
                key={duration.value}
                style={[
                  styles.chip,
                  sessionDurations.includes(duration.value) && styles.chipSelected,
                ]}
                onPress={() => {
                  if (sessionDurations.includes(duration.value)) {
                    setSessionDurations(sessionDurations.filter(d => d !== duration.value));
                  } else {
                    setSessionDurations([...sessionDurations, duration.value]);
                  }
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    sessionDurations.includes(duration.value) && styles.chipTextSelected,
                  ]}
                >
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buffer Time Between Sessions</Text>
          <Text style={styles.helperText}>Time to rest between sessions</Text>
          <View style={styles.chipContainer}>
            {[5, 10, 15, 30].map(minutes => (
              <TouchableOpacity
                key={minutes}
                style={[styles.chip, bufferMinutes === minutes && styles.chipSelected]}
                onPress={() => setBufferMinutes(minutes)}
              >
                <Text
                  style={[
                    styles.chipText,
                    bufferMinutes === minutes && styles.chipTextSelected,
                  ]}
                >
                  {minutes} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Max Sessions Per Day</Text>
          <View style={styles.chipContainer}>
            {[1, 2, 3, 4, 5].map(count => (
              <TouchableOpacity
                key={count}
                style={[styles.chip, maxSessionsPerDay === count && styles.chipSelected]}
                onPress={() => setMaxSessionsPerDay(count)}
              >
                <Text
                  style={[
                    styles.chipText,
                    maxSessionsPerDay === count && styles.chipTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Availability</Text>
            <TouchableOpacity onPress={addTimeBlock} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Block</Text>
            </TouchableOpacity>
          </View>

          {weeklyBlocks.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No availability blocks yet</Text>
              <Text style={styles.emptySubtext}>Add your first time block to get started</Text>
            </View>
          )}

          {weeklyBlocks.map((block, index) => (
            <View key={index} style={styles.blockCard}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>{getDayOfWeekLabel(block.dayOfWeek)}</Text>
                <TouchableOpacity onPress={() => removeBlock(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>From:</Text>
                <Text style={styles.timeValue}>{block.startTime}</Text>
                <Text style={styles.timeLabel}>To:</Text>
                <Text style={styles.timeValue}>{block.endTime}</Text>
              </View>

              <TouchableOpacity
                onPress={() => copyBlockToOtherDays(index)}
                style={styles.copyButton}
              >
                <Text style={styles.copyButtonText}>Copy to other days</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={saving ? 'Saving...' : 'Save Availability'}
            onPress={handleSave}
            disabled={saving || weeklyBlocks.length === 0}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#6366F1',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  blockCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  removeText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 16,
  },
});
