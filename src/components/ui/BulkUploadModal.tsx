import React, { useState, useRef } from 'react';
import { X, Upload, Download, CheckCircle, AlertTriangle, Play, Loader } from 'lucide-react';
import { generateExcelTemplate, readExcelFile } from '@/lib/utils';
import { toast } from 'react-toastify';
import { isOvernightShift, constructDateTimeISO, calculateWorkingHours, getPreviousDateStr, parseTimeToMinutes } from '@/utils/attendanceUtils';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'employee' | 'attendance';
  onUploadConfirm: (parsedData: any[]) => Promise<void>;
  employeesList?: any[]; // for validation check
  existingAttendanceList?: any[]; // for save/update matching
}

export function BulkUploadModal({ isOpen, onClose, type, onUploadConfirm, employeesList = [], existingAttendanceList = [] }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<Array<{ row: number; column: string; message: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Template Configs
  const employeeTemplateHeaders = [
    "Employee Code", "Employee Name", "Gender", "Date of Birth (YYYY-MM-DD)", "Father/Husband Name",
    "Mobile Number", "Aadhaar Number", "Joining Date (YYYY-MM-DD)", "Department", "Designation", "Qualification", "Employee Type",
    "Employment Status", "Hostel / Family Quarters", "Hostel / Family Quarters Room No",
    "Prod. Incentive Applicable", "Prod. Incentive Amount",
    "Att. Incentive Applicable", "Att. Incentive Amount",
    "Food Allowance Applicable",
    "Salary Type", "Basic Salary", "HRA", "DA", "Medical Allowance", "TA", "OT Salary",
    "PF Applicable", "PF Number", "PF Joining Date (YYYY-MM-DD)", "PF Percent",
    "ESI Applicable", "ESI Number", "ESI Percent", "Weekly Off Day",
    "Total Working Hours", "Is Canteen", "Canteen Effective Date (YYYY-MM-DD)",
    "Bank Name", "Account Number", "IFSC Code", "Branch Name"
  ];

  const attendanceTemplateHeaders = [
    "Employee Code", "Employee Name", "Date (YYYY-MM-DD)", "Check-In (HH:MM)", "Check-Out (HH:MM)", "Status", "OT Check-In (HH:MM)", "OT Check-Out (HH:MM)"
  ];

  const handleDownloadTemplate = () => {
    try {
      if (type === 'employee') {
        generateExcelTemplate({
          headers: employeeTemplateHeaders,
          fileName: "Employee_Bulk_Import_Template",
          sheetName: "Employees",
          maxRows: 50,
          dropdowns: [
            { header: "Gender", values: ["Male", "Female", "Other"] },
            { header: "Employee Type", values: ["Permanent", "Contract", "Temporary"] },
            { header: "Employment Status", values: ["Active", "Relieved"] },
            { header: "Hostel / Family Quarters", values: ["Yes", "No"] },
            { header: "Prod. Incentive Applicable", values: ["Yes", "No"] },
            { header: "Att. Incentive Applicable", values: ["Yes", "No"] },
            { header: "Food Allowance Applicable", values: ["Yes", "No"] },
            { header: "Salary Type", values: ["Monthly", "Daily", "Hourly"] },
            { header: "PF Applicable", values: ["Yes", "No"] },
            { header: "ESI Applicable", values: ["Yes", "No"] },
            { header: "Is Canteen", values: ["Yes", "No"] },
            { header: "Weekly Off Day", values: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
            { header: "Department", values: ["Spinning", "Weaver", "Dyeing", "Finishing", "Quality Control", "Admin", "Planing", "Maintanance", "Electrical"] },
            { header: "Designation", values: ["GM", "DGM", "M-Planning", "AM-Warehouse", "Electrical Incharge", "Knotter", "Weaver", "Quality Supervisor", "Operator - C Unit", "Fabric Inspector", "Office Cleaning", "House Keeping", "Maintenance", "Electrical Assistant", "Group Fitter", "Warehouse Supervisor", "Warehouse Assistant", "Office Assistant", "Loadman", "Gaiter", "Incharge - C Unit", "Shed Incharge", "Shift Fitter", "Manpower + Grey Warehouse", "Shift Fitter Trainee", "Knotter Trainee", "Gaiter Trainee", "Pujari", "Electrical Helper", "Helper - C Unit", "Scavenger", "Trainee Knotter", "Loadman -C Unit", "Trainee Weaver", "Trainee Inspector", "Canteen - Helper", "Canteen - Master", "Canteen Helper", "Fitter", "Tsudakoma Incharge", "Scavanger", "Loom Cleaning"] }
          ]
        });
      } else {
        generateExcelTemplate({
          headers: attendanceTemplateHeaders,
          fileName: "Attendance_Bulk_Import_Template",
          sheetName: "Attendance",
          maxRows: 100,
          dropdowns: [
            { header: "Status", values: ["Present", "Absent", "Leave"] }
          ]
        });
      }
      toast.success("Template downloaded successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate template");
    }
  };

  // Helper Parsing Functions
  const parseExcelDate = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    
    // Check if it is a number or numeric string representing an Excel date serial
    const strVal = String(val).trim();
    if (!isNaN(Number(strVal)) && /^\d+(\.\d+)?$/.test(strVal)) {
      const num = Number(strVal);
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }

    if (typeof val === 'string') {
      const clean = val.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
      
      const dmy = clean.split(/[/-]/);
      if (dmy.length === 3) {
        if (dmy[0].length === 4) return clean; // already YYYY-MM-DD
        const d = dmy[0].padStart(2, '0');
        const m = dmy[1].padStart(2, '0');
        const y = dmy[2];
        return `${y}-${m}-${d}`;
      }
    }
    return String(val).trim();
  };

  const parseExcelTime = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    
    // Normalize to number if possible
    let numVal: number | null = null;
    if (typeof val === 'number') {
      numVal = val;
    } else if (typeof val === 'string') {
      const clean = val.trim();
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && /^\d*(\.\d+)?$/.test(clean)) {
        // If it's a string representation of a decimal/fraction
        numVal = parsed;
      }
    }

    if (numVal !== null) {
      // If it's a number, determine if it's a serial date/time or decimal time
      let fraction = 0;
      if (numVal >= 0 && numVal < 1.0) {
        // Pure time fraction
        fraction = numVal;
      } else if (numVal >= 24.0) {
        // Excel serial date-time (e.g. 45123.39583)
        fraction = numVal % 1;
      } else {
        // Decimal time representation like 9.30 (9:30) or 14.45 (14:45)
        const hours = Math.floor(numVal);
        const minutes = Math.round((numVal - hours) * 100);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      const totalSeconds = Math.round(fraction * 24 * 60 * 60);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    if (typeof val === 'string') {
      const clean = val.trim();
      
      // Match 12-hour format with AM/PM (e.g. 09:30:00 AM, 9:30pm, 10:00pm, 09:30 AM)
      const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)$/i);
      if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = parseInt(ampmMatch[2], 10);
        const meridian = ampmMatch[4].toLowerCase();
        
        if (meridian === 'pm' && hours < 12) {
          hours += 12;
        } else if (meridian === 'am' && hours === 12) {
          hours = 0;
        }
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      // Match 24-hour format (e.g. 14:30 or 14:30:00)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(clean)) {
        const parts = clean.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
    }
    
    return String(val).trim();
  };

  // 2. Parser and Validator
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);
    setParsedRows([]);
    
    try {
      const rawData = await readExcelFile<any>(selectedFile);
      if (!rawData || rawData.length === 0) {
        toast.error("No data found in the selected Excel file");
        setIsProcessing(false);
        return;
      }

      const tempErrors: Array<{ row: number; column: string; message: string }> = [];
      const tempRows: any[] = [];

      if (type === 'employee') {
        rawData.forEach((row, i) => {
          const rowNum = i + 2; // 1-based, accounts for header row
          
          // Map properties, trimming keys/values
          const getVal = (col: string) => {
            const matchKey = Object.keys(row).find(k => k.trim().toLowerCase() === col.trim().toLowerCase());
            return matchKey ? String(row[matchKey]).trim() : '';
          };

          const empName = getVal("Employee Name");
          const empCode = getVal("Employee Code") || `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
          let genderVal = getVal("Gender");
          if (genderVal) {
            const cleanGender = genderVal.trim().toLowerCase();
            if (cleanGender === 'male' || cleanGender === 'm') {
              genderVal = 'Male';
            } else if (cleanGender === 'female' || cleanGender === 'f') {
              genderVal = 'Female';
            } else if (cleanGender === 'other' || cleanGender === 'o') {
              genderVal = 'Other';
            } else {
              genderVal = genderVal.charAt(0).toUpperCase() + genderVal.slice(1).toLowerCase();
            }
          } else {
            genderVal = '';
          }
          const gender = genderVal as any;
          const dob = parseExcelDate(getVal("Date of Birth (YYYY-MM-DD)"));
          const fatherHusbandName = getVal("Father/Husband Name");
          const mobileNumber = getVal("Mobile Number");
          const aadhaarNumber = getVal("Aadhaar Number") || getVal("Aadhar Number");
          const joiningDate = parseExcelDate(getVal("Joining Date (YYYY-MM-DD)"));
          const department = getVal("Department");
          const designation = getVal("Designation");
          const empType = getVal("Employee Type") as any;
          const empStatus = getVal("Employment Status") || 'Active';

          const productionIncentiveApplicable = getVal("Prod. Incentive Applicable").toLowerCase() === 'yes';
          const productionIncentive = parseFloat(getVal("Prod. Incentive Amount")) || 0;
          const attendanceIncentiveApplicable = getVal("Att. Incentive Applicable").toLowerCase() === 'yes';
          const attendanceIncentive = parseFloat(getVal("Att. Incentive Amount")) || 0;
          const foodAllowanceApplicable = getVal("Food Allowance Applicable").toLowerCase() === 'yes';

          const salaryType = getVal("Salary Type") as any;
          const basicSalary = parseFloat(getVal("Basic Salary")) || 0;
          const hra = parseFloat(getVal("HRA")) || 0;
          const conveyanceAllowance = parseFloat(getVal("DA")) || 0;
          const medicalAllowance = parseFloat(getVal("Medical Allowance")) || 0;
          const specialAllowance = parseFloat(getVal("TA")) || 0;
          const otSalary = parseFloat(getVal("OT Salary")) || 0;

          const pfApplicable = getVal("PF Applicable").toLowerCase() === 'yes';
          const pfNumber = getVal("PF Number");
          const pfJoiningDate = parseExcelDate(getVal("PF Joining Date (YYYY-MM-DD)"));
          const pfPercent = parseFloat(getVal("PF Percent")) || 12; // default 12
          const esiApplicable = getVal("ESI Applicable").toLowerCase() === 'yes';
          const esiNumber = getVal("ESI Number");
          const esiPercent = parseFloat(getVal("ESI Percent")) || 0.75; // default 0.75
          const weeklyOffDay = getVal("Weekly Off Day") || null;
          const totalWorkingHours = parseFloat(getVal("Total Working Hours")) || 8;
          const isCanteen = getVal("Is Canteen").toLowerCase() === 'yes';
          const canteenEffectiveDate = parseExcelDate(getVal("Canteen Effective Date (YYYY-MM-DD)"));
          const bankName = getVal("Bank Name");
          const accountNumber = getVal("Account Number");
          const ifscCode = getVal("IFSC Code");
          const branchName = getVal("Branch Name");

          // Parse Shift and Break Times dynamically
          const shiftStartTime = parseExcelTime(getVal("Shift Start Time")) || '';
          const shiftEndTime = parseExcelTime(getVal("Shift End Time")) || '';
          const excelBreakStart = getVal("Break Start Time");
          const excelBreakEnd = getVal("Break End Time");
          let breakStartTime = parseExcelTime(excelBreakStart);
          let breakEndTime = parseExcelTime(excelBreakEnd);

          if (!breakStartTime && !breakEndTime) {
            const lunchBreakVal = getVal("Lunch Break");
            if (lunchBreakVal) {
              const minutesMatch = lunchBreakVal.match(/\d+/);
              if (minutesMatch) {
                const minutes = parseInt(minutesMatch[0], 10);
                breakStartTime = '13:00';
                const endHour = 13 + Math.floor(minutes / 60);
                const endMin = minutes % 60;
                breakEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
              }
            }
          }

          // Validation (Only validate actual mandatory fields)
          if (!empName) {
            tempErrors.push({ row: rowNum, column: "Employee Name", message: "Employee Name is required" });
          }

          tempRows.push({
            employeeCode: empCode,
            employeeName: empName,
            gender,
            dob,
            fatherHusbandName,
            mobileNumber,
            aadhaarNumber,
            pfApplicable,
            pfNumber,
            pfJoiningDate,
            pfPercent,
            esiApplicable,
            esiNumber,
            esiPercent,
            weeklyOffDay,
            productionIncentiveApplicable,
            productionIncentive,
            attendanceIncentiveApplicable,
            attendanceIncentive,
            foodAllowanceApplicable,
            employmentDetails: {
              department,
              designation,
              qualification: getVal("Qualification") || '',
              joiningDate,
              employeeType: empType,
              status: empStatus,
              hostelFamilyQuarters: getVal("Hostel / Family Quarters") || getVal("Hostel/Family Quarters") || '',
              hostelFamilyQuartersRoomNo: getVal("Hostel / Family Quarters Room No") || getVal("Hostel/Family Quarters Room No") || ''
            },
            salaryDetails: {
              salaryStructure: 'Standard',
              salaryType,
              basicSalary,
              hra,
              conveyanceAllowance,
              medicalAllowance,
              specialAllowance,
              incentive: attendanceIncentive,
              perHourSalary: salaryType === 'Hourly' ? basicSalary : 0,
              otRatePerHour: 0,
              otSalary,
              productionIncentive,
              isCanteen,
              effectiveDate: canteenEffectiveDate || joiningDate
            },
            shiftDetails: {
              shiftName: getVal("Shift Name") || (shiftStartTime ? 'General Shift' : ''),
              shiftStartTime: shiftStartTime || '',
              shiftEndTime: shiftEndTime || '',
              breakStartTime: breakStartTime || '',
              breakEndTime: breakEndTime || '',
              lunchBreak: getVal("Lunch Break") || '',
              totalWorkingHours: getVal("Total Working Hours") ? parseFloat(getVal("Total Working Hours")) : (shiftStartTime ? 8 : null),
              weeklyOffDay: getVal("Weekly Off Day") || null,
              overtimeAllowed: getVal("Overtime Allowed").toLowerCase() === 'yes' || (shiftStartTime ? true : false),
              lateEntryAllowedMinutes: getVal("Late Entry Allowed Minutes") || getVal("Late Entry Allowed (Mins)") ? parseInt(getVal("Late Entry Allowed Minutes") || getVal("Late Entry Allowed (Mins)"), 10) : (shiftStartTime ? 15 : 0),
              shiftEffectiveFrom: parseExcelDate(getVal("Shift Effective From Date")) || parseExcelDate(getVal("Effective From Date")) || joiningDate || '',
              noOfLeave: getVal("No of Leave") || getVal("NoOfLeave") ? parseFloat(getVal("No of Leave") || getVal("NoOfLeave")) : null
            },
            bankDetails: {
              bankName,
              accountNumber,
              ifscCode,
              branchName
            }
          });
        });
      } else {
        // Attendance parsing
        rawData.forEach((row, i) => {
          const rowNum = i + 2;
          const getVal = (col: string) => {
            const cleanCol = col.trim().toLowerCase();
            const matchKey = Object.keys(row).find(k => k.trim().toLowerCase() === cleanCol);
            if (matchKey) return String(row[matchKey]).trim();
            
            const isOtCol = cleanCol.includes("ot");
            const isCheckInCol = cleanCol.includes("check-in") || cleanCol.includes("check in");
            const isCheckOutCol = cleanCol.includes("check-out") || cleanCol.includes("check out");

            const fuzzyKey = Object.keys(row).find(k => {
              const cleanK = k.trim().toLowerCase();
              const isOtK = cleanK.includes("ot");
              const isCheckInK = cleanK.includes("check-in") || cleanK.includes("check in");
              const isCheckOutK = cleanK.includes("check-out") || cleanK.includes("check out");

              if (isOtCol) {
                if (!isOtK) return false;
                if (isCheckInCol && isCheckInK) return true;
                if (isCheckOutCol && isCheckOutK) return true;
                return cleanK.startsWith(cleanCol) || cleanCol.startsWith(cleanK);
              } else {
                if (isOtK) return false;
                if (isCheckInCol && isCheckInK) return true;
                if (isCheckOutCol && isCheckOutK) return true;
                if (cleanCol.includes("date") && cleanK.includes("date")) return true;
                return cleanK.startsWith(cleanCol) || cleanCol.startsWith(cleanK);
              }
            });
            return fuzzyKey ? String(row[fuzzyKey]).trim() : '';
          };

          const empCode = getVal("Employee Code");
          const date = parseExcelDate(getVal("Date (YYYY-MM-DD)"));
          const checkInTime = parseExcelTime(getVal("Check-In (HH:MM)") || getVal("Check-In") || getVal("Check In"));
          const checkOutTime = parseExcelTime(getVal("Check-Out (HH:MM)") || getVal("Check-Out") || getVal("Check Out"));
          const otCheckInTime = parseExcelTime(getVal("OT Check-In (HH:MM)") || getVal("OT Check-In") || getVal("OT Check In"));
          const otCheckOutTime = parseExcelTime(getVal("OT Check-Out (HH:MM)") || getVal("OT Check-Out") || getVal("OT Check Out"));

          const rawStatus = getVal("Status");
          let status = 'Present';
          if (rawStatus) {
            const clean = rawStatus.trim().toLowerCase();
            if (clean === 'absent') status = 'Absent';
            else if (clean === 'leave') status = 'Leave';
            else if (clean === 'present') status = 'Present';
            else status = rawStatus.trim();
          }

          if (!empCode) {
            tempErrors.push({ row: rowNum, column: "Employee Code", message: "Employee Code is required" });
          }
          if (!date) {
            tempErrors.push({ row: rowNum, column: "Date", message: "Date is required" });
          }

          // Check if employee code exists in active master list
          const masterEmp = employeesList.find(e => e.employeeCode?.trim().toLowerCase() === empCode?.trim().toLowerCase());
          if (!masterEmp && empCode) {
            tempErrors.push({ row: rowNum, column: "Employee Code", message: `Employee Code "${empCode}" not found in database` });
          }

          // If no check-in and check-out times are logged, auto convert status to Absent so it saves in backend
          if (!checkInTime && !checkOutTime) {
            status = 'Absent';
          }

          const getOtHoursVal = () => {
            const targetKeys = [
              'ot hours', 'ot (hours)', 'ot (hrs)', 'ot(hrs)', 'ot', 'overtime',
              'overtime hours', 'overtime hrs', 'overtime (hrs)', 'overtime(hrs)',
              'ot_hours', 'overtime_hours', 'overtimehours', 'othours'
            ];
            
            const exactKey = Object.keys(row).find(k => {
              const cleanK = k.trim().toLowerCase();
              if (targetKeys.includes(cleanK)) return true;
              if (cleanK === 'ot' || cleanK.startsWith('ot ') || cleanK.startsWith('ot(') || cleanK.startsWith('ot-') || cleanK.startsWith('ot_') || cleanK.includes('overtime')) return true;
              return false;
            });
            if (exactKey && row[exactKey] !== undefined && row[exactKey] !== null) {
              return row[exactKey];
            }

            const normalizedKey = Object.keys(row).find(k => {
              const alphaK = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
              return ['othours', 'othrs', 'ot', 'overtime', 'overtimehours', 'overtimehrs'].includes(alphaK);
            });
            if (normalizedKey && row[normalizedKey] !== undefined && row[normalizedKey] !== null) {
              return row[normalizedKey];
            }

            return '';
          };

          const parseOtHours = (val: any): string => {
            if (val === undefined || val === null || val === '') return '0';
            const strVal = String(val).trim();
            if (!strVal || strVal === '-' || strVal === '--') return '0';

            if (strVal.includes(':')) {
              const parts = strVal.split(':');
              const h = parseFloat(parts[0]) || 0;
              const m = parseFloat(parts[1]) || 0;
              const dec = h + (m / 60);
              return Number(dec.toFixed(2)).toString();
            }

            const num = parseFloat(strVal);
            if (!isNaN(num)) {
              return Number(num.toFixed(2)).toString();
            }

            return '0';
          };

          const existingRecord = (existingAttendanceList || []).find(att => {
            const matchesEmp = (masterEmp?.id && String(att.employeeId || att.employee_id) === String(masterEmp.id)) ||
                               (empCode && String(att.employeeCode || att.employee_code).trim().toUpperCase() === empCode.trim().toUpperCase());
            const attDate = att.date ? String(att.date).slice(0, 10) : '';
            return matchesEmp && attDate === date;
          });

          const resolvedCheckIn = checkInTime || (existingRecord?.checkIn ? (existingRecord.checkIn.includes('T') ? existingRecord.checkIn.split('T')[1].substring(0, 5) : parseExcelTime(existingRecord.checkIn)) : '');
          const resolvedCheckOut = checkOutTime || (existingRecord?.checkOut ? (existingRecord.checkOut.includes('T') ? existingRecord.checkOut.split('T')[1].substring(0, 5) : parseExcelTime(existingRecord.checkOut)) : '');

          const resolvedOtCheckIn = otCheckInTime || (existingRecord?.otCheckIn ? (existingRecord.otCheckIn.includes('T') ? existingRecord.otCheckIn.split('T')[1].substring(0, 5) : parseExcelTime(existingRecord.otCheckIn)) : '');
          const resolvedOtCheckOut = otCheckOutTime || (existingRecord?.otCheckOut ? (existingRecord.otCheckOut.includes('T') ? existingRecord.otCheckOut.split('T')[1].substring(0, 5) : parseExcelTime(existingRecord.otCheckOut)) : '');

          // Calculate OT hours from OT check-in and check-out
          let calculatedOt = '';
          if (resolvedOtCheckIn && resolvedOtCheckOut) {
            const inMins = parseTimeToMinutes(resolvedOtCheckIn);
            const outMins = parseTimeToMinutes(resolvedOtCheckOut);
            if (inMins !== null && outMins !== null) {
              let diff = outMins - inMins;
              if (diff < 0) diff += 24 * 60;
              const hours = diff / 60.0;
              calculatedOt = Number(hours.toFixed(2)).toString();
            }
          }

          // Fallback if legacy OT column was in excel or existing record has OT hours
          const rawOtHoursVal = getOtHoursVal();
          const parsedOtHours = parseOtHours(rawOtHoursVal);
          const finalOtHours = calculatedOt !== ''
            ? calculatedOt
            : (rawOtHoursVal !== ''
                ? parsedOtHours
                : (existingRecord?.overtimeHours ?? existingRecord?.overtime_hours ?? '0'));

          const isNight = isOvernightShift(null, resolvedCheckIn, resolvedCheckOut);
          const shiftName = getVal("Shift") || (isNight ? 'Night Shift' : 'First Shift');

          tempRows.push({
            employeeCode: empCode,
            id: existingRecord?.id,
            employeeId: masterEmp?.id || existingRecord?.employeeId || existingRecord?.employee_id,
            employeeName: masterEmp?.employeeName || getVal("Employee Name") || existingRecord?.employeeName,
            date,
            checkIn: resolvedCheckIn,
            checkOut: resolvedCheckOut,
            otCheckIn: resolvedOtCheckIn,
            otCheckOut: resolvedOtCheckOut,
            shiftName,
            isNightShift: isNight,
            status: (!checkInTime && !checkOutTime && existingRecord?.status) ? existingRecord.status : status,
            overtimeHours: finalOtHours,
            rawRow: rowNum
          });
        });
      }

      setParsedRows(tempRows);
      setErrors(tempErrors);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to parse Excel file: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 3. Confirm Submission
  const handleConfirm = async () => {
    if (parsedRows.length === 0) return;
    if (errors.length > 0) {
      toast.error("Please fix validation errors before uploading");
      return;
    }

    setIsProcessing(true);
    try {
      if (type === 'employee') {
        await onUploadConfirm(parsedRows);
      } else {
        // Parse attendance records with night-shift overnight timestamp calculations
        const attendancePayloads: any[] = [];

        parsedRows.forEach(row => {
          if (row.status !== 'Present') {
            const otVal = row.overtimeHours ? String(row.overtimeHours) : '0';
            attendancePayloads.push({
              ...(row.id ? { id: row.id } : {}),
              employee_id: row.employeeId,
              employee_code: row.employeeCode,
              employee_name: row.employeeName,
              date: row.date,
              status: row.status,
              overtimeHours: otVal,
              overtime_hours: otVal,
              ot_hours: otVal,
              otHours: otVal,
            });
            return;
          }

          const isOvernight = isOvernightShift(row.shiftInfo, row.checkIn, row.checkOut);
          let checkInISO = '';
          let checkOutISO = '';
          let otCheckInISO = '';
          let otCheckOutISO = '';

          if (row.checkIn) {
            checkInISO = constructDateTimeISO(row.date, row.checkIn, false);
          }
          if (row.checkOut) {
            checkOutISO = constructDateTimeISO(row.date, row.checkOut, isOvernight);
          }

          if (row.otCheckIn) {
            otCheckInISO = constructDateTimeISO(row.date, row.otCheckIn, false);
          }
          if (row.otCheckOut) {
            const isOtOvernight = row.otCheckIn && row.otCheckOut && row.otCheckOut < row.otCheckIn;
            otCheckOutISO = constructDateTimeISO(row.date, row.otCheckOut, isOtOvernight);
          }

          let workingHoursStr = '-';
          if (checkInISO && checkOutISO) {
            const { formatted } = calculateWorkingHours(checkInISO, checkOutISO);
            workingHoursStr = formatted;
          }

          const otVal = row.overtimeHours ? String(row.overtimeHours) : '0';
          attendancePayloads.push({
            ...(row.id ? { id: row.id } : {}),
            employee_id: row.employeeId,
            employee_code: row.employeeCode,
            employee_name: row.employeeName,
            date: row.date, // Shift start date
            shiftName: row.shiftName || (isOvernight ? 'Night Shift' : 'First Shift'),
            isNightShift: isOvernight,
            status: row.status,
            checkIn: checkInISO || undefined,
            checkOut: checkOutISO || undefined,
            otCheckIn: otCheckInISO || undefined,
            otCheckOut: otCheckOutISO || undefined,
            workingHours: workingHoursStr,
            time: checkInISO || checkOutISO,
            type: row.checkIn ? 1 : 0,
            overtimeHours: otVal,
            overtime_hours: otVal,
            ot_hours: otVal,
            otHours: otVal,
          });
        });

        if (attendancePayloads.length > 0) {
          await onUploadConfirm(attendancePayloads);
        }
      }
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to upload data: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-gray-900 bg-opacity-65 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-250">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Bulk Import {type === 'employee' ? 'Employees' : 'Attendance Logs'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload excel files (.xlsx) to perform rapid batch imports
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Instructions and Download Template */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
            <div className="flex gap-3">
              <Download className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Step 1: Download sample format sheet</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Get the standard structured layout template with predefined dropdown selectors to avoid validation mistakes.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0 ml-4"
            >
              Get Excel Template
            </button>
          </div>

          {/* File Upload Selector */}
          {!file && (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50/55' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <Upload className="text-slate-400 mb-3" size={40} />
              <p className="text-sm font-medium text-slate-700">Drag and drop your spreadsheet here, or browse files</p>
              <p className="text-xs text-slate-400 mt-1">Supports standard Excel (.xlsx) workbooks</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </div>
          )}

          {/* File Selected Banner */}
          {file && (
            <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-600" size={18} />
                <span className="text-sm font-medium text-slate-800">{file.name}</span>
                <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                onClick={() => { setFile(null); setParsedRows([]); setErrors([]); }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                Choose another file
              </button>
            </div>
          )}

          {/* Validation Warnings */}
          {errors.length > 0 && (
            <div className="border border-amber-200 bg-amber-50/55 rounded-xl p-4 space-y-2 max-h-[160px] overflow-y-auto">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <AlertTriangle size={18} />
                <span>Found {errors.length} formatting errors:</span>
              </div>
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-1 pl-1">
                {errors.map((err, idx) => (
                  <li key={idx}>
                    Row {err.row}, Column "{err.column}": <strong className="text-slate-700 font-medium">{err.message}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Preview Grid */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700">Preview Parsed Data ({parsedRows.length} rows)</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b sticky top-0 font-semibold text-slate-600">
                    {type === 'employee' ? (
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Dept</th>
                        <th className="p-2.5">Desig</th>
                        <th className="p-2.5">Salary Type</th>
                        <th className="p-2.5">Basic Salary</th>
                        <th className="p-2.5">PF</th>
                        <th className="p-2.5">ESI</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="p-2.5">Emp Code</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Check In</th>
                        <th className="p-2.5">Check Out</th>
                        <th className="p-2.5">OT Check-In</th>
                        <th className="p-2.5">OT Check-Out</th>
                        <th className="p-2.5">OT (Hrs)</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {type === 'employee'
                      ? parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-medium">{row.employeeCode}</td>
                            <td className="p-2.5">{row.employeeName}</td>
                            <td className="p-2.5">{row.employmentDetails.department}</td>
                            <td className="p-2.5">{row.employmentDetails.designation}</td>
                            <td className="p-2.5">{row.salaryDetails.salaryType}</td>
                            <td className="p-2.5">₹{row.salaryDetails.basicSalary.toFixed(2)}</td>
                            <td className="p-2.5">{row.pfApplicable ? 'Yes' : 'No'}</td>
                            <td className="p-2.5">{row.esiApplicable ? 'Yes' : 'No'}</td>
                          </tr>
                        ))
                      : parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-medium">{row.employeeCode}</td>
                            <td className="p-2.5">{row.employeeName || 'N/A'}</td>
                            <td className="p-2.5">{row.date}</td>
                            <td className="p-2.5">{row.checkIn || '-'}</td>
                            <td className="p-2.5">{row.checkOut || '-'}</td>
                            <td className="p-2.5">{row.otCheckIn || '-'}</td>
                            <td className="p-2.5">{row.otCheckOut || '-'}</td>
                            <td className="p-2.5 font-semibold text-blue-700">{row.overtimeHours || '0'}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                row.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                                row.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={parsedRows.length === 0 || errors.length > 0 || isProcessing}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader className="animate-spin" size={16} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Confirm Import</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
