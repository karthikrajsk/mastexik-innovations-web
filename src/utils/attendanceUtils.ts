// src/utils/attendanceUtils.ts

export interface ShiftInfo {
  id?: string;
  shiftName?: string;
  startTime?: string; // "08:00" or "20:00" or "08:00 PM"
  endTime?: string;   // "14:00" or "08:00" or "08:00 AM"
  isNightShift?: boolean;
}

/**
 * Determines whether a shift or punch combination is a Night / Overnight shift.
 */
export function isOvernightShift(
  shiftInfo?: ShiftInfo | null,
  checkInTime?: string,
  checkOutTime?: string
): boolean {
  // 1. Explicit shift configuration
  if (shiftInfo?.isNightShift) return true;
  if (shiftInfo?.shiftName) {
    const sName = shiftInfo.shiftName.toLowerCase();
    if (sName.includes('night') || sName.includes('overnight') || sName.includes('third')) {
      return true;
    }
  }

  // 2. Check shift start & end times (e.g. start 20:00, end 08:00)
  if (shiftInfo?.startTime && shiftInfo?.endTime) {
    const startMins = parseTimeToMinutes(shiftInfo.startTime);
    const endMins = parseTimeToMinutes(shiftInfo.endTime);
    if (startMins !== null && endMins !== null && endMins <= startMins) {
      return true;
    }
  }

  // 3. Check actual check-in vs check-out times (e.g. checkIn 20:00 / 08:00 PM, checkOut 08:00 / 08:00 AM)
  if (checkInTime && checkOutTime) {
    const inMins = parseTimeToMinutes(checkInTime);
    const outMins = parseTimeToMinutes(checkOutTime);
    if (inMins !== null && outMins !== null) {
      // If check-in is in evening/night (>= 5 PM / 17:00) and check-out is next morning (< 12 PM / 12:00)
      if (inMins >= 17 * 60 && outMins < 12 * 60) return true;
      // Or if checkout time <= checkin time (e.g., 20:00 -> 08:00)
      if (outMins <= inMins) return true;
    }
  } else if (checkInTime) {
    // Only check-in time present: check if check-in is in evening/night (>= 5 PM / 17:00)
    const inMins = parseTimeToMinutes(checkInTime);
    if (inMins !== null && inMins >= 17 * 60) {
      return true;
    }
  }

  return false;
}

/**
 * Converts various time formats ("08:00", "08:00 PM", "20:00", "20:00:00") to total minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim();
  if (!clean) return null;

  // 12-hour AM/PM format
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const meridian = ampmMatch[4].toUpperCase();
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // 24-hour format
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Calculates working hours formatted as string ("12 hrs 00 mins" or "11 hrs 48 mins" or "6 hrs 05 mins")
 * and decimal value (e.g., 12.00, 11.80, 6.08).
 */
export function calculateWorkingHours(
  checkInISO: string | null | undefined,
  checkOutISO: string | null | undefined
): { formatted: string; decimal: number } {
  if (!checkInISO || !checkOutISO) {
    return { formatted: '-', decimal: 0 };
  }

  try {
    const start = new Date(checkInISO);
    const end = new Date(checkOutISO);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { formatted: '-', decimal: 0 };
    }

    let diffMs = end.getTime() - start.getTime();

    // If negative (checkout on next day with dummy same-day dates), adjust by +24 hrs
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const decimal = Number((totalMinutes / 60).toFixed(2));

    let formatted = '';
    if (hours > 0 && mins > 0) {
      formatted = `${hours} hrs ${String(mins).padStart(2, '0')} mins`;
    } else if (hours > 0) {
      formatted = `${hours} hrs`;
    } else {
      formatted = `${mins} mins`;
    }

    return { formatted, decimal };
  } catch (err) {
    return { formatted: '-', decimal: 0 };
  }
}

/**
 * Constructs a full ISO DateTime string given a base date (YYYY-MM-DD) and a time string (HH:MM / HH:MM AM/PM).
 * Optional isNextDay flag adds +1 day to the date.
 */
export function constructDateTimeISO(
  baseDate: string,
  timeStr: string,
  isNextDay: boolean = false
): string {
  if (!baseDate || !timeStr) return '';

  let dateObj = new Date(baseDate);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  if (isNextDay) {
    dateObj.setDate(dateObj.getDate() + 1);
  }

  const minsFromMidnight = parseTimeToMinutes(timeStr);
  if (minsFromMidnight === null) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${timeStr}:00.000`;
  }

  const hours = Math.floor(minsFromMidnight / 60);
  const minutes = minsFromMidnight % 60;

  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const minStr = String(minutes).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${minStr}:00.000`;
}

/**
 * Returns previous calendar date in YYYY-MM-DD format.
 */
export function getPreviousDateStr(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Core Shift-Based Attendance Processor.
 * Integrates single-entry & biometric multi-entry records cleanly into structured Attendance records.
 */
export function processShiftAttendance(
  existingAttendanceList: any[],
  newPunch: {
    employeeId: number | string;
    employeeCode?: string;
    employeeName?: string;
    date: string; // Punch date (YYYY-MM-DD)
    time?: string; // Time or ISO datetime
    checkIn?: string;
    checkOut?: string;
    status?: string;
    shiftInfo?: ShiftInfo;
  }
): { action: 'created' | 'updated'; record: any; updatedList: any[] } {
  const list = [...existingAttendanceList];
  const empIdStr = String(newPunch.employeeId);
  const status = newPunch.status || 'Present';
  const shiftInfo = newPunch.shiftInfo;

  // Non-present status (Absent/Leave)
  if (status !== 'Present') {
    const existingIndex = list.findIndex(
      a => String(a.employeeId || a.employee_id) === empIdStr && a.date === newPunch.date
    );

    const record = {
      id: existingIndex >= 0 ? list[existingIndex].id : Date.now() + Math.floor(Math.random() * 1000),
      date: newPunch.date,
      employeeId: newPunch.employeeId,
      employee_id: newPunch.employeeId,
      employee_code: newPunch.employeeCode,
      employee_name: newPunch.employeeName,
      checkIn: '',
      checkOut: '',
      workingHours: '-',
      status
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
      return { action: 'updated', record: list[existingIndex], updatedList: list };
    } else {
      list.unshift(record);
      return { action: 'created', record, updatedList: list };
    }
  }

  // Handle present punches
  const checkInTimeVal = newPunch.checkIn || (newPunch.time ? newPunch.time.split('T')[1]?.substring(0, 5) || newPunch.time : undefined);
  const checkOutTimeVal = newPunch.checkOut;

  // Single-row with BOTH Check-In and Check-Out specified
  if (checkInTimeVal && checkOutTimeVal) {
    const isOvernight = isOvernightShift(shiftInfo, checkInTimeVal, checkOutTimeVal);
    const checkInISO = constructDateTimeISO(newPunch.date, checkInTimeVal, false);
    const checkOutISO = constructDateTimeISO(newPunch.date, checkOutTimeVal, isOvernight);
    const { formatted: workingHours } = calculateWorkingHours(checkInISO, checkOutISO);

    // Attendance date is ALWAYS shift start date
    const attendanceDate = newPunch.date;
    const targetShiftName = shiftInfo?.shiftName || (isOvernight ? 'Night Shift' : 'First Shift');

    // Find existing record matching employee, date AND shift (or matching check-in time window)
    const existingIndex = list.findIndex(a => {
      if (String(a.employeeId || a.employee_id) !== empIdStr || a.date !== attendanceDate) {
        return false;
      }

      // Check shift match
      const existingShift = a.shiftName || (a.isNightShift ? 'Night Shift' : 'First Shift');
      if (existingShift === targetShiftName) return true;

      // Check if existing check-in matches check-in time window (e.g. morning vs evening)
      if (a.checkIn) {
        const inMinsExisting = parseTimeToMinutes(a.checkIn.includes('T') ? a.checkIn.split('T')[1] : a.checkIn);
        const inMinsNew = parseTimeToMinutes(checkInTimeVal);
        if (inMinsExisting !== null && inMinsNew !== null) {
          // Both in morning or both in evening
          const isMorningExisting = inMinsExisting < 17 * 60;
          const isMorningNew = inMinsNew < 17 * 60;
          return isMorningExisting === isMorningNew;
        }
      }

      return false;
    });

    const record = {
      id: existingIndex >= 0 ? list[existingIndex].id : Date.now() + Math.floor(Math.random() * 10000),
      date: attendanceDate,
      employeeId: newPunch.employeeId,
      employee_id: newPunch.employeeId,
      employee_code: newPunch.employeeCode,
      employee_name: newPunch.employeeName,
      shiftName: targetShiftName,
      isNightShift: isOvernight,
      checkIn: checkInISO,
      checkOut: checkOutISO,
      workingHours,
      status: 'Present'
    };

    if (existingIndex >= 0) {
      list[existingIndex] = record;
      return { action: 'updated', record, updatedList: list };
    } else {
      list.unshift(record);
      return { action: 'created', record, updatedList: list };
    }
  }

  // Handle single check-in punch
  if (checkInTimeVal && !checkOutTimeVal) {
    const isOvernight = isOvernightShift(shiftInfo, checkInTimeVal);
    const checkInISO = constructDateTimeISO(newPunch.date, checkInTimeVal, false);
    const attendanceDate = newPunch.date;

    const existingIndex = list.findIndex(
      a => String(a.employeeId || a.employee_id) === empIdStr && a.date === attendanceDate
    );

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const checkOutISO = existing.checkOut;
      const { formatted: workingHours } = calculateWorkingHours(checkInISO, checkOutISO);

      list[existingIndex] = {
        ...existing,
        checkIn: checkInISO,
        workingHours: checkOutISO ? workingHours : '-',
        isNightShift: isOvernight
      };
      return { action: 'updated', record: list[existingIndex], updatedList: list };
    } else {
      const record = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: attendanceDate,
        employeeId: newPunch.employeeId,
        employee_id: newPunch.employeeId,
        employee_code: newPunch.employeeCode,
        employee_name: newPunch.employeeName,
        shiftName: shiftInfo?.shiftName || (isOvernight ? 'Night Shift' : 'First Shift'),
        isNightShift: isOvernight,
        checkIn: checkInISO,
        checkOut: '',
        workingHours: '-',
        status: 'Present'
      };
      list.unshift(record);
      return { action: 'created', record, updatedList: list };
    }
  }

  // Handle single check-out punch
  if (checkOutTimeVal && !checkInTimeVal) {
    // 1. Check for open record on SAME calendar date (normal day shift)
    let openIndex = list.findIndex(
      a => String(a.employeeId || a.employee_id) === empIdStr && a.date === newPunch.date && !a.checkOut
    );

    let isOvernightMatch = false;
    let attendanceDate = newPunch.date;

    // 2. If no open record on same date, check PREVIOUS date for open night-shift record
    if (openIndex === -1) {
      const prevDate = getPreviousDateStr(newPunch.date);
      openIndex = list.findIndex(
        a => String(a.employeeId || a.employee_id) === empIdStr && a.date === prevDate && !a.checkOut
      );
      if (openIndex >= 0) {
        isOvernightMatch = true;
        attendanceDate = prevDate;
      }
    }

    if (openIndex >= 0) {
      const openRecord = list[openIndex];
      const checkInISO = openRecord.checkIn;
      const checkOutISO = constructDateTimeISO(newPunch.date, checkOutTimeVal, false);
      const { formatted: workingHours } = calculateWorkingHours(checkInISO, checkOutISO);

      list[openIndex] = {
        ...openRecord,
        checkOut: checkOutISO,
        workingHours,
        isNightShift: openRecord.isNightShift || isOvernightMatch
      };
      return { action: 'updated', record: list[openIndex], updatedList: list };
    } else {
      // If no open record found, update latest record of today or create record
      const checkOutISO = constructDateTimeISO(newPunch.date, checkOutTimeVal, false);
      const record = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: newPunch.date,
        employeeId: newPunch.employeeId,
        employee_id: newPunch.employeeId,
        employee_code: newPunch.employeeCode,
        employee_name: newPunch.employeeName,
        shiftName: shiftInfo?.shiftName || 'First Shift',
        checkIn: '',
        checkOut: checkOutISO,
        workingHours: '-',
        status: 'Present'
      };
      list.unshift(record);
      return { action: 'created', record, updatedList: list };
    }
  }

  return { action: 'created', record: null, updatedList: list };
}

/**
 * Aggregates attendance records for an employee across multiple shifts in a given month or date range.
 * Sums up working hours, OT hours, and present shift counts for daily/monthly salary calculations.
 */
export function aggregateEmployeeAttendance(
  attendanceRecords: any[],
  employeeId: string | number,
  period?: { month?: string; fromDate?: string; toDate?: string }
): {
  totalWorkingHours: number;
  totalOtHours: number;
  actualPresentDays: number;
  shiftsWorked: number;
} {
  const empIdStr = String(employeeId);
  const filtered = attendanceRecords.filter(a => {
    if (String(a.employeeId || a.employee_id) !== empIdStr) return false;
    if (a.status && a.status !== 'Present') return false;

    if (period?.month && a.date) {
      if (!a.date.startsWith(period.month)) return false;
    }
    if (period?.fromDate && period?.toDate && a.date) {
      if (a.date < period.fromDate || a.date > period.toDate) return false;
    }
    return true;
  });

  let totalWorkingHours = 0;
  let totalOtHours = 0;
  let shiftsWorked = filtered.length;

  filtered.forEach(rec => {
    if (rec.checkIn && rec.checkOut) {
      const { decimal } = calculateWorkingHours(rec.checkIn, rec.checkOut);
      totalWorkingHours += decimal;
    } else if (rec.workingHours && !isNaN(Number(rec.workingHours))) {
      totalWorkingHours += Number(rec.workingHours);
    }
    const otVal = rec.overtimeHours || rec.overtime_hours || rec.ot_hours;
    if (otVal) {
      totalOtHours += Number(otVal) || 0;
    }
  });

  const actualPresentDays = Number((totalWorkingHours / 8).toFixed(1));

  return {
    totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
    totalOtHours: Number(totalOtHours.toFixed(2)),
    actualPresentDays,
    shiftsWorked
  };
}

/**
 * Computes a business-unique key for an attendance record based on:
 * employeeIdentifier + date + shiftCategory ('NIGHT' vs 'DAY')
 */
export function getAttendanceKey(item: any): string {
  if (!item) return '';

  const empId = String(
    item.employeeCode || item.employee_code || item.employeeId || item.employee_id || ''
  ).trim().toUpperCase();

  const date = item.date || '';

  // Determine shift category: 'NIGHT' or 'DAY'
  let shiftCat = 'DAY';
  const shiftNameLower = String(item.shiftName || '').toLowerCase();

  if (
    item.isNightShift ||
    shiftNameLower.includes('night') ||
    shiftNameLower.includes('third') ||
    shiftNameLower.includes('overnight')
  ) {
    shiftCat = 'NIGHT';
  } else if (item.checkIn) {
    const timeStr = item.checkIn.includes('T') ? item.checkIn.split('T')[1] : item.checkIn;
    const inMins = parseTimeToMinutes(timeStr);
    if (inMins !== null && inMins >= 17 * 60) {
      shiftCat = 'NIGHT';
    }
  }

  return `${empId}_${date}_${shiftCat}`;
}

/**
 * Safely merges API attendance records with existing state records,
 * preventing duplicate records for the SAME shift while preserving
 * distinct multi-shift records (e.g. First Shift AND Night Shift) for the same employee on the same date.
 */
export function mergeShiftAttendances(existingList: any[], incomingApiData: any[]): any[] {
  const mergedMap = new Map<string, any>();

  const processItem = (item: any) => {
    if (!item) return;
    const key = getAttendanceKey(item);
    if (!key) return;

    if (!mergedMap.has(key)) {
      mergedMap.set(key, item);
    } else {
      const existing = mergedMap.get(key);
      
      const mergedCheckIn = (item.checkIn && item.checkIn.includes('T')) ? item.checkIn : (existing.checkIn || item.checkIn);
      const mergedCheckOut = (item.checkOut && item.checkOut.includes('T')) ? item.checkOut : (existing.checkOut || item.checkOut);
      const mergedWorkingHours = (item.workingHours && item.workingHours !== '-' && item.workingHours !== '0.00')
        ? item.workingHours
        : (existing.workingHours || item.workingHours);

      const merged = {
        ...existing,
        ...item,
        id: item.id || existing.id,
        checkIn: mergedCheckIn,
        checkOut: mergedCheckOut,
        workingHours: mergedWorkingHours,
        shiftName: item.shiftName || existing.shiftName,
        isNightShift: item.isNightShift !== undefined ? item.isNightShift : existing.isNightShift,
        workingDays: (item.workingDays !== undefined && item.workingDays !== null && item.workingDays !== 0)
          ? item.workingDays
          : (existing.workingDays || item.workingDays),
      };
      mergedMap.set(key, merged);
    }
  };

  (existingList || []).forEach(processItem);
  (incomingApiData || []).forEach(processItem);

  return Array.from(mergedMap.values());
}
