/**
 * Slot Generation Debug Utility
 * 
 * This utility helps debug and validate the slot generation algorithm.
 * Use this in development to verify availability blocks produce correct slots.
 */

import {
  MentorAvailability,
  Session,
  TimeSlot,
  WeeklyAvailabilityBlock,
} from '../types';
import {
  generateTimeSlots,
  getDateString,
  formatTimeForDisplay,
  formatDateForDisplay,
  getDayOfWeekLabel,
} from './scheduling';

export interface SlotDebugResult {
  date: string;
  dayOfWeek: string;
  blocksForDay: WeeklyAvailabilityBlock[];
  totalSlotsGenerated: number;
  availableSlots: number;
  blockedSlots: number;
  conflictingSessions: Session[];
  slots: TimeSlot[];
}

/**
 * Debug slot generation for a specific date
 */
export function debugSlotsForDate(
  availability: MentorAvailability,
  date: Date,
  durationMinutes: number,
  existingSessions: Session[]
): SlotDebugResult {
  const dateStr = getDateString(date);
  const dayOfWeek = date.getDay();
  
  const blocksForDay = availability.weeklyBlocks.filter(
    block => block.dayOfWeek === dayOfWeek
  );
  
  const conflictingSessions = existingSessions.filter(session => {
    const sessionDate = getDateString(new Date(session.requestedStart));
    return sessionDate === dateStr && 
           ['pending', 'confirmed', 'reschedule_proposed'].includes(session.status);
  });
  
  const slots = generateTimeSlots(availability, date, durationMinutes, existingSessions);
  
  const availableSlots = slots.filter(s => s.available).length;
  const blockedSlots = slots.filter(s => !s.available).length;
  
  return {
    date: dateStr,
    dayOfWeek: getDayOfWeekLabel(dayOfWeek),
    blocksForDay,
    totalSlotsGenerated: slots.length,
    availableSlots,
    blockedSlots,
    conflictingSessions,
    slots,
  };
}

/**
 * Generate a human-readable debug report
 */
export function generateDebugReport(result: SlotDebugResult): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push(`SLOT GENERATION DEBUG REPORT`);
  lines.push('='.repeat(60));
  lines.push('');
  
  lines.push(`Date: ${result.date} (${result.dayOfWeek})`);
  lines.push('');
  
  lines.push('AVAILABILITY BLOCKS:');
  if (result.blocksForDay.length === 0) {
    lines.push('  ❌ No availability blocks for this day');
  } else {
    result.blocksForDay.forEach((block, i) => {
      lines.push(`  ${i + 1}. ${block.startTime} - ${block.endTime}`);
    });
  }
  lines.push('');
  
  lines.push('CONFLICTING SESSIONS:');
  if (result.conflictingSessions.length === 0) {
    lines.push('  ✓ No conflicting sessions');
  } else {
    result.conflictingSessions.forEach((session, i) => {
      const start = new Date(session.requestedStart);
      const end = new Date(session.requestedEnd);
      lines.push(`  ${i + 1}. ${formatTimeForDisplay(start)} - ${formatTimeForDisplay(end)} [${session.status}]`);
    });
  }
  lines.push('');
  
  lines.push('SLOT SUMMARY:');
  lines.push(`  Total Generated: ${result.totalSlotsGenerated}`);
  lines.push(`  Available: ${result.availableSlots} ✓`);
  lines.push(`  Blocked: ${result.blockedSlots} ✗`);
  lines.push('');
  
  if (result.availableSlots > 0) {
    lines.push('AVAILABLE SLOTS:');
    result.slots
      .filter(s => s.available)
      .forEach((slot, i) => {
        lines.push(`  ${i + 1}. ${formatTimeForDisplay(slot.start)} - ${formatTimeForDisplay(slot.end)}`);
      });
  }
  
  lines.push('');
  lines.push('='.repeat(60));
  
  return lines.join('\n');
}

/**
 * Test slot generation for next N days
 */
export function debugMultipleDays(
  availability: MentorAvailability,
  startDate: Date,
  numDays: number,
  durationMinutes: number,
  existingSessions: Session[]
): SlotDebugResult[] {
  const results: SlotDebugResult[] = [];
  
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const result = debugSlotsForDate(
      availability,
      date,
      durationMinutes,
      existingSessions
    );
    
    results.push(result);
  }
  
  return results;
}

/**
 * Validate availability configuration
 */
export function validateAvailabilityConfig(availability: MentorAvailability): string[] {
  const issues: string[] = [];
  
  if (!availability.timezone) {
    issues.push('❌ Timezone is missing');
  }
  
  if (!availability.weeklyBlocks || availability.weeklyBlocks.length === 0) {
    issues.push('❌ No weekly blocks defined');
  }
  
  if (!availability.sessionDurations || availability.sessionDurations.length === 0) {
    issues.push('❌ No session durations defined');
  }
  
  if (availability.bufferMinutes < 0) {
    issues.push('❌ Buffer minutes cannot be negative');
  }
  
  if (availability.maxSessionsPerDay && availability.maxSessionsPerDay < 1) {
    issues.push('❌ Max sessions per day must be at least 1');
  }
  
  availability.weeklyBlocks?.forEach((block, i) => {
    if (block.dayOfWeek < 0 || block.dayOfWeek > 6) {
      issues.push(`❌ Block ${i + 1}: Invalid day of week (${block.dayOfWeek})`);
    }
    
    const startParts = block.startTime.split(':');
    const endParts = block.endTime.split(':');
    
    if (startParts.length !== 2 || endParts.length !== 2) {
      issues.push(`❌ Block ${i + 1}: Invalid time format`);
      return;
    }
    
    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    
    if (startMinutes >= endMinutes) {
      issues.push(`❌ Block ${i + 1}: End time must be after start time`);
    }
    
    if (endMinutes - startMinutes < Math.min(...(availability.sessionDurations || [30]))) {
      issues.push(`⚠️ Block ${i + 1}: Duration too short for any session type`);
    }
  });
  
  if (issues.length === 0) {
    issues.push('✓ Availability configuration is valid');
  }
  
  return issues;
}

/**
 * Console-friendly output for debugging
 */
export function logSlotDebug(
  availability: MentorAvailability,
  date: Date,
  durationMinutes: number,
  existingSessions: Session[]
): void {
  console.log('\n' + '='.repeat(60));
  console.log('SLOT GENERATION DEBUG');
  console.log('='.repeat(60));
  
  const validation = validateAvailabilityConfig(availability);
  console.log('\nCONFIGURATION VALIDATION:');
  validation.forEach(issue => console.log(`  ${issue}`));
  
  const result = debugSlotsForDate(availability, date, durationMinutes, existingSessions);
  console.log('\n' + generateDebugReport(result));
}

/**
 * Export debug data as JSON for external analysis
 */
export function exportDebugData(
  availability: MentorAvailability,
  startDate: Date,
  numDays: number,
  durationMinutes: number,
  existingSessions: Session[]
): string {
  const results = debugMultipleDays(
    availability,
    startDate,
    numDays,
    durationMinutes,
    existingSessions
  );
  
  const exportData = {
    generatedAt: new Date().toISOString(),
    availability: {
      timezone: availability.timezone,
      sessionDurations: availability.sessionDurations,
      bufferMinutes: availability.bufferMinutes,
      maxSessionsPerDay: availability.maxSessionsPerDay,
      weeklyBlocksCount: availability.weeklyBlocks.length,
    },
    testParameters: {
      startDate: getDateString(startDate),
      numDays,
      durationMinutes,
      existingSessionsCount: existingSessions.length,
    },
    results: results.map(r => ({
      date: r.date,
      dayOfWeek: r.dayOfWeek,
      blocksCount: r.blocksForDay.length,
      totalSlots: r.totalSlotsGenerated,
      availableSlots: r.availableSlots,
      blockedSlots: r.blockedSlots,
      conflictingSessionsCount: r.conflictingSessions.length,
    })),
    validation: validateAvailabilityConfig(availability),
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Quick test function - call this from a screen to debug
 */
export async function quickSlotTest(
  mentorId: string,
  getMentorAvailability: (id: string) => Promise<any>,
  getSessionsForUser: (id: string, role: string) => Promise<any[]>
): Promise<void> {
  try {
    console.log('🔍 Running quick slot test...');
    
    const availability = await getMentorAvailability(mentorId);
    if (!availability) {
      console.error('❌ No availability found for mentor');
      return;
    }
    
    const sessions = await getSessionsForUser(mentorId, 'mentor');
    
    const today = new Date();
    logSlotDebug(availability, today, 30, sessions);
    
    console.log('\n📊 Exporting debug data...');
    const jsonData = exportDebugData(availability, today, 7, 30, sessions);
    console.log(jsonData);
    
    console.log('\n✅ Quick slot test complete!');
  } catch (error) {
    console.error('❌ Quick slot test failed:', error);
  }
}
