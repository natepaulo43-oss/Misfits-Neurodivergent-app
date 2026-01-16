import {
  WeeklyAvailabilityBlock,
  AvailabilityException,
  MentorAvailability,
  Session,
  TimeSlot,
} from '../types';

export const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

export const formatTimeString = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const convertLocalTimeToUTC = (
  date: Date,
  timeStr: string,
  timezone: string,
): Date => {
  const { hours, minutes } = parseTimeString(timeStr);
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);
  
  const utcTimestamp = localDate.getTime();
  return new Date(utcTimestamp);
};

export const convertUTCToLocalTime = (utcDate: Date, timezone: string): Date => {
  return new Date(utcDate);
};

export const getWeeklyBlocksForDate = (
  date: Date,
  weeklyBlocks: WeeklyAvailabilityBlock[],
  exceptions: AvailabilityException[],
): WeeklyAvailabilityBlock[] => {
  const dayOfWeek = date.getDay();
  const dateStr = getDateString(date);
  
  const exception = exceptions.find(ex => ex.date === dateStr);
  
  if (exception) {
    if (exception.type === 'blocked') {
      return [];
    }
    if (exception.type === 'override' && exception.blocks) {
      return exception.blocks;
    }
  }
  
  return weeklyBlocks.filter(block => block.dayOfWeek === dayOfWeek);
};

export const doTimesOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 < end2 && start2 < end1;
};

export const generateTimeSlots = (
  availability: MentorAvailability,
  selectedDate: Date,
  durationMinutes: number,
  existingSessions: Session[],
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const dateStr = getDateString(selectedDate);
  
  const blocksForDay = getWeeklyBlocksForDate(
    selectedDate,
    availability.weeklyBlocks,
    availability.exceptions,
  );
  
  if (blocksForDay.length === 0) {
    return slots;
  }
  
  const reservedStatuses: Session['status'][] = ['pending', 'confirmed', 'reschedule_proposed'];
  const reservedSessions = existingSessions.filter(session => 
    reservedStatuses.includes(session.status) &&
    getDateString(new Date(session.requestedStart)) === dateStr
  );
  
  const sessionsOnDate = reservedSessions.length;
  if (availability.maxSessionsPerDay && sessionsOnDate >= availability.maxSessionsPerDay) {
    return slots;
  }
  
  for (const block of blocksForDay) {
    const blockStart = convertLocalTimeToUTC(selectedDate, block.startTime, availability.timezone);
    const blockEnd = convertLocalTimeToUTC(selectedDate, block.endTime, availability.timezone);
    
    let currentSlotStart = new Date(blockStart);
    
    while (currentSlotStart.getTime() + durationMinutes * 60000 <= blockEnd.getTime()) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60000);
      
      let isAvailable = true;
      
      for (const session of reservedSessions) {
        const sessionStart = new Date(session.requestedStart);
        const sessionEnd = new Date(session.requestedEnd);
        
        const bufferStart = new Date(sessionStart.getTime() - availability.bufferMinutes * 60000);
        const bufferEnd = new Date(sessionEnd.getTime() + availability.bufferMinutes * 60000);
        
        if (doTimesOverlap(currentSlotStart, currentSlotEnd, bufferStart, bufferEnd)) {
          isAvailable = false;
          break;
        }
      }
      
      slots.push({
        start: new Date(currentSlotStart),
        end: new Date(currentSlotEnd),
        available: isAvailable,
      });
      
      currentSlotStart = new Date(currentSlotEnd.getTime() + availability.bufferMinutes * 60000);
    }
  }
  
  return slots.filter(slot => slot.available);
};

export const formatTimeForDisplay = (date: Date, timezone?: string): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

export const formatDateForDisplay = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
};

export const formatDateTimeForDisplay = (date: Date, timezone?: string): string => {
  return `${formatDateForDisplay(date)} at ${formatTimeForDisplay(date, timezone)}`;
};

export const getDeviceTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
};

export const isDateInPast = (date: Date): boolean => {
  return date.getTime() < Date.now();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getNextNDays = (startDate: Date, n: number): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < n; i++) {
    dates.push(addDays(startDate, i));
  }
  return dates;
};

export const validateAvailability = (availability: Partial<MentorAvailability>): string[] => {
  const errors: string[] = [];
  
  if (!availability.timezone) {
    errors.push('Timezone is required');
  }
  
  if (!availability.weeklyBlocks || availability.weeklyBlocks.length === 0) {
    errors.push('At least one availability block is required');
  }
  
  if (availability.weeklyBlocks) {
    for (const block of availability.weeklyBlocks) {
      if (block.dayOfWeek < 0 || block.dayOfWeek > 6) {
        errors.push('Invalid day of week');
      }
      
      const start = parseTimeString(block.startTime);
      const end = parseTimeString(block.endTime);
      
      if (start.hours * 60 + start.minutes >= end.hours * 60 + end.minutes) {
        errors.push('End time must be after start time');
      }
    }
  }
  
  if (!availability.sessionDurations || availability.sessionDurations.length === 0) {
    errors.push('At least one session duration is required');
  }
  
  return errors;
};

export const getSessionDurationLabel = (minutes: number): string => {
  if (minutes === 30) return '30 minutes';
  if (minutes === 45) return '45 minutes';
  if (minutes === 60) return '1 hour';
  return `${minutes} minutes`;
};

export const getDayOfWeekLabel = (dayOfWeek: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || '';
};

export const getDayOfWeekShort = (dayOfWeek: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek] || '';
};
