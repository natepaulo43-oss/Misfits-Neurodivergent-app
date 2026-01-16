import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import {
  getMentorAvailability,
  getAvailableSlots,
  createSessionRequest,
} from '../../services/scheduling';
import { ConnectionPreference, TimeSlot } from '../../types';
import {
  formatTimeForDisplay,
  formatDateForDisplay,
  getNextNDays,
  getDateString,
} from '../../utils/scheduling';

const CONNECTION_OPTIONS: { value: ConnectionPreference; label: string }[] = [
  { value: 'chat', label: 'In-app Chat' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'video', label: 'Video Call' },
  { value: 'other', label: 'Other' },
];

export default function BookSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const mentorId = params.mentorId as string;
  const mentorName = params.mentorName as string;

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [connectionPreference, setConnectionPreference] = useState<ConnectionPreference>('chat');
  const [studentNotes, setStudentNotes] = useState('');

  useEffect(() => {
    loadMentorAvailability();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedDate) {
        loadAvailableSlots();
      }
    }, [selectedDate, selectedDuration])
  );

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedDuration]);

  const loadMentorAvailability = async () => {
    try {
      const availability = await getMentorAvailability(mentorId);
      if (!availability) {
        Alert.alert('Error', 'This mentor has not set up their availability yet.');
        router.back();
        return;
      }

      const dates = getNextNDays(new Date(), 14);
      setAvailableDates(dates);
      setSelectedDate(dates[0]);

      if (availability.sessionDurations.length > 0) {
        setSelectedDuration(availability.sessionDurations[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load mentor availability');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const slots = await getAvailableSlots(mentorId, selectedDate, selectedDuration);
      setAvailableSlots(slots);
    } catch (error) {
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    setSubmitting(true);
    try {
      await createSessionRequest(
        mentorId,
        selectedSlot.start,
        selectedSlot.end,
        connectionPreference,
        studentNotes.trim() || undefined
      );

      Alert.alert(
        'Request Sent!',
        `Your session request has been sent to ${mentorName}. You'll be notified when they respond.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create session request');
    } finally {
      setSubmitting(false);
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
        <Text style={styles.title}>Book a Session</Text>
        <Text style={styles.subtitle}>with {mentorName}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {availableDates.map((date, index) => {
              const isSelected = selectedDate && getDateString(date) === getDateString(selectedDate);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateMonthSelected]}>
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Duration</Text>
          <View style={styles.chipContainer}>
            {[30, 45, 60].map(duration => (
              <TouchableOpacity
                key={duration}
                style={[styles.chip, selectedDuration === duration && styles.chipSelected]}
                onPress={() => setSelectedDuration(duration)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDuration === duration && styles.chipTextSelected,
                  ]}
                >
                  {duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Times</Text>
          {loadingSlots ? (
            <View style={styles.slotsLoading}>
              <ActivityIndicator color="#6366F1" />
              <Text style={styles.slotsLoadingText}>Loading available times...</Text>
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No available times</Text>
              <Text style={styles.emptySubtext}>Try selecting a different date or duration</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot, index) => {
                const isSelected = selectedSlot?.start.getTime() === slot.start.getTime();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                      {formatTimeForDisplay(slot.start)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {selectedSlot && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How would you like to connect?</Text>
              <View style={styles.chipContainer}>
                {CONNECTION_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      connectionPreference === option.value && styles.chipSelected,
                    ]}
                    onPress={() => setConnectionPreference(option.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        connectionPreference === option.value && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What would you like help with?</Text>
              <Text style={styles.helperText}>Optional - Let your mentor know what to prepare</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., I need help with my math homework"
                value={studentNotes}
                onChangeText={setStudentNotes}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Session Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate && formatDateForDisplay(selectedDate)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>
                  {formatTimeForDisplay(selectedSlot.start)} - {formatTimeForDisplay(selectedSlot.end)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{selectedDuration} minutes</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Connection:</Text>
                <Text style={styles.summaryValue}>
                  {CONNECTION_OPTIONS.find(o => o.value === connectionPreference)?.label}
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title={submitting ? 'Sending Request...' : 'Send Request'}
                onPress={handleSubmit}
                disabled={submitting}
              />
            </View>
          </>
        )}
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  dateScroll: {
    flexGrow: 0,
  },
  dateCard: {
    width: 70,
    padding: 12,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  dateDay: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateDaySelected: {
    color: '#6366F1',
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: '#6366F1',
  },
  dateMonth: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateMonthSelected: {
    color: '#6366F1',
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
  slotsLoading: {
    padding: 32,
    alignItems: 'center',
  },
  slotsLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
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
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  slotCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  slotTime: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  slotTimeSelected: {
    color: '#6366F1',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
  },
});
