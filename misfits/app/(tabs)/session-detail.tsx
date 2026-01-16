import React, { useState, useEffect } from 'react';
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
import { Screen, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import {
  getSessionById,
  acceptSessionRequest,
  declineSessionRequest,
  proposeReschedule,
  acceptRescheduleOption,
  cancelSession,
  markSessionComplete,
  saveSessionNote,
  getSessionNotes,
  getAvailableSlots,
} from '../../services/scheduling';
import { Session, SessionNote, TimeSlot, RescheduleOption } from '../../types';
import { formatDateTimeForDisplay, formatTimeForDisplay, addDays, getDateString } from '../../utils/scheduling';

const DECLINE_REASONS = [
  'Schedule conflict',
  'Not available',
  'Need more notice',
  'Other',
];

export default function SessionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleSlots, setRescheduleSlots] = useState<TimeSlot[]>([]);
  const [selectedRescheduleSlots, setSelectedRescheduleSlots] = useState<TimeSlot[]>([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [followUpsText, setFollowUpsText] = useState('');

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const data = await getSessionById(sessionId);
      if (!data) {
        Alert.alert('Error', 'Session not found');
        router.back();
        return;
      }
      setSession(data);

      if (user?.role === 'mentor') {
        const notes = await getSessionNotes(sessionId);
        setSessionNotes(notes);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load session');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    Alert.alert(
      'Accept Session',
      'Confirm this session request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setProcessing(true);
            try {
              await acceptSessionRequest(sessionId);
              Alert.alert('Success', 'Session confirmed!');
              loadSession();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept session');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      Alert.alert('Error', 'Please select or enter a reason');
      return;
    }

    setProcessing(true);
    try {
      await declineSessionRequest(sessionId, declineReason);
      Alert.alert('Session Declined', 'The student has been notified.');
      setShowDeclineModal(false);
      loadSession();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to decline session');
    } finally {
      setProcessing(false);
    }
  };

  const handleProposeReschedule = async () => {
    if (selectedRescheduleSlots.length === 0) {
      Alert.alert('Error', 'Please select at least one alternative time');
      return;
    }

    const options: RescheduleOption[] = selectedRescheduleSlots.map(slot => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
    }));

    setProcessing(true);
    try {
      await proposeReschedule(sessionId, options);
      Alert.alert('Success', 'Alternative times sent to student');
      setShowRescheduleModal(false);
      loadSession();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to propose reschedule');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptReschedule = async (index: number) => {
    Alert.alert(
      'Accept New Time',
      'Confirm this new session time?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setProcessing(true);
            try {
              await acceptRescheduleOption(sessionId, index);
              Alert.alert('Success', 'Session time updated!');
              loadSession();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept reschedule');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await cancelSession(sessionId);
              Alert.alert('Session Cancelled', 'The other party has been notified.');
              loadSession();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to cancel session');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkComplete = async () => {
    setProcessing(true);
    try {
      await markSessionComplete(sessionId);
      Alert.alert('Success', 'Session marked as complete');
      loadSession();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to mark complete');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    setProcessing(true);
    try {
      await saveSessionNote(sessionId, noteText.trim(), followUpsText.trim() || undefined);
      Alert.alert('Success', 'Note saved');
      setShowNotesModal(false);
      setNoteText('');
      setFollowUpsText('');
      loadSession();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save note');
    } finally {
      setProcessing(false);
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

  if (!session) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
        </View>
      </Screen>
    );
  }

  const isMentor = user?.role === 'mentor';
  const canAccept = isMentor && session.status === 'pending';
  const canDecline = isMentor && session.status === 'pending';
  const canProposeReschedule = isMentor && session.status === 'pending';
  const canAcceptReschedule = !isMentor && session.status === 'reschedule_proposed';
  const canCancel = session.status === 'pending' || session.status === 'confirmed';
  const canMarkComplete = isMentor && session.status === 'confirmed';
  const canAddNotes = isMentor && (session.status === 'confirmed' || session.status === 'completed');

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>{session.status.replace('_', ' ').toUpperCase()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>
              {formatDateTimeForDisplay(new Date(session.confirmedStart || session.requestedStart))}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Connection:</Text>
            <Text style={styles.detailValue}>{session.connectionPreference}</Text>
          </View>
          {session.studentNotes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Student Notes:</Text>
              <Text style={styles.detailValue}>{session.studentNotes}</Text>
            </View>
          )}
          {session.mentorResponseReason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mentor Response:</Text>
              <Text style={styles.detailValue}>{session.mentorResponseReason}</Text>
            </View>
          )}
        </View>

        {canAcceptReschedule && session.rescheduleOptions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proposed Alternative Times</Text>
            <Text style={styles.helperText}>Select one of these times to confirm the session</Text>
            {session.rescheduleOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.rescheduleOption}
                onPress={() => handleAcceptReschedule(index)}
              >
                <Text style={styles.rescheduleTime}>
                  {formatDateTimeForDisplay(new Date(option.start))}
                </Text>
                <Text style={styles.rescheduleAction}>Tap to accept</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {canAddNotes && sessionNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Notes (Private)</Text>
            {sessionNotes.map(note => (
              <View key={note.id} style={styles.noteCard}>
                <Text style={styles.noteText}>{note.note}</Text>
                {note.followUps && (
                  <View style={styles.followUpBox}>
                    <Text style={styles.followUpLabel}>Follow-ups:</Text>
                    <Text style={styles.followUpText}>{note.followUps}</Text>
                  </View>
                )}
                <Text style={styles.noteDate}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionContainer}>
          {canAccept && (
            <Button
              title="Accept Session"
              onPress={handleAccept}
              disabled={processing}
            />
          )}

          {canDecline && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowDeclineModal(true)}
              disabled={processing}
            >
              <Text style={styles.secondaryButtonText}>Decline</Text>
            </TouchableOpacity>
          )}

          {canProposeReschedule && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowRescheduleModal(true)}
              disabled={processing}
            >
              <Text style={styles.secondaryButtonText}>Suggest New Time</Text>
            </TouchableOpacity>
          )}

          {canMarkComplete && (
            <Button
              title="Mark as Complete"
              onPress={handleMarkComplete}
              disabled={processing}
            />
          )}

          {canAddNotes && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowNotesModal(true)}
              disabled={processing}
            >
              <Text style={styles.secondaryButtonText}>Add Private Note</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleCancel}
              disabled={processing}
            >
              <Text style={styles.dangerButtonText}>Cancel Session</Text>
            </TouchableOpacity>
          )}

          {session.chatId && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push(`/(tabs)/messages/${session.chatId}`)}
            >
              <Text style={styles.secondaryButtonText}>Open Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDeclineModal && (
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Decline Session</Text>
              <Text style={styles.modalSubtitle}>Please select a reason:</Text>
              {DECLINE_REASONS.map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    declineReason === reason && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setDeclineReason(reason)}
                >
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              ))}
              {declineReason === 'Other' && (
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter reason..."
                  value={declineReason === 'Other' ? '' : declineReason}
                  onChangeText={setDeclineReason}
                />
              )}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowDeclineModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleDecline}
                  disabled={processing}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    {processing ? 'Declining...' : 'Decline'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {showNotesModal && (
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Session Note</Text>
              <Text style={styles.modalSubtitle}>Private - only you can see this</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="Session notes..."
                value={noteText}
                onChangeText={setNoteText}
                multiline
                numberOfLines={4}
              />
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="Follow-up tasks (optional)..."
                value={followUpsText}
                onChangeText={setFollowUpsText}
                multiline
                numberOfLines={3}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowNotesModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleSaveNote}
                  disabled={processing}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    {processing ? 'Saving...' : 'Save Note'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusBanner: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
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
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  rescheduleOption: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  rescheduleTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  rescheduleAction: {
    fontSize: 14,
    color: '#6366F1',
  },
  noteCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  followUpBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  followUpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  followUpText: {
    fontSize: 14,
    color: '#1F2937',
  },
  noteDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionContainer: {
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dangerButton: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  reasonOption: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  reasonText: {
    fontSize: 14,
    color: '#1F2937',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 16,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#6366F1',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
