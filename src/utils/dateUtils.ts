// src/utils/dateUtils.ts

/**
 * Format date string to mm-dd-yyyy format
 * @param dateString - ISO date string or any valid date string
 * @returns Formatted date string in mm-dd-yyyy format or original string if invalid
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    if (dateString.includes('/')) {
      // Parse "5/29/2025" format directly
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const day = parts[1].padStart(2, '0');
        const month = parts[0].padStart(2, '0');
        const year = parts[2];
        return `${day}-${month}-${year}`;
      }
    }
    
    // Fallback to Date object for other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    return dateString;
  }
};
  
  /**
   * Format date to yyyy-mm-dd format (for input type="date")
   */
  export const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };
  
  /**
   * Get current date in mm-dd-yyyy format
   */
  export const getCurrentDateFormatted = (): string => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}-${day}-${year}`;
  };

  /**
   * Format date time string to "DD MMM YYYY, HH:MM AM/PM" format
   * @param dateString - ISO date string or any valid date string
   * @returns Formatted date time string
   */
  export const formatDateTime = (dateString: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const strHours = String(hours).padStart(2, '0');
      
      return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Format date time string to "HH:MM am/pm"
   * Preserves exact local hours and minutes (e.g. 08:00 -> 08:00 am, 14:00 -> 02:00 pm, 20:00 -> 08:00 pm)
   * @param dateString - ISO date string or formatted time string
   * @returns Formatted time string
   */
  export const formatTimeIST = (dateString: string): string => {
    if (!dateString || dateString === '-') return '-';
    
    try {
      const clean = dateString.trim();

      // Case 1: Already formatted 12-hour string (e.g. "08:00 AM" or "08:00 am")
      if (/^(0?[1-9]|1[0-2]):[0-5][0-9](\s*:\s*[0-5][0-9])?\s*(AM|PM)$/i.test(clean)) {
        return clean;
      }

      // Case 2: ISO string containing 'T' (e.g. "2026-09-01T08:00:00.000")
      if (clean.includes('T')) {
        const timePart = clean.split('T')[1];
        if (timePart) {
          const timeSub = timePart.split('.')[0]; // "08:00:00" or "20:00:00"
          const parts = timeSub.split(':');
          let hours = parseInt(parts[0], 10);
          const minutes = parseInt(parts[1], 10);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const strHours = String(hours).padStart(2, '0');
            const strMins = String(minutes).padStart(2, '0');
            return `${strHours}:${strMins} ${ampm}`;
          }
        }
      }

      // Case 3: 24-hour time string (e.g. "08:00", "14:00", "20:00")
      const time24Match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (time24Match) {
        let hours = parseInt(time24Match[1], 10);
        const minutes = parseInt(time24Match[2], 10);
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strHours = String(hours).padStart(2, '0');
        const strMins = String(minutes).padStart(2, '0');
        return `${strHours}:${strMins} ${ampm}`;
      }

      // Case 4: Standard Date parsing fallback
      const date = new Date(clean);
      if (isNaN(date.getTime())) return dateString;

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (error) {
      return dateString;
    }
  };