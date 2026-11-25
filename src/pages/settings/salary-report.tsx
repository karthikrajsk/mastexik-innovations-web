// salary report 

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getSalaryReport, updateSalaryReport, updateReportItem, createSalaryReport, updateSalaryReportRecord, checkSalaryReportExists, bulkUpsertSalaryReport } from '@/state/salarySlice';
import { getAllEmployees, type Employee } from '@/state/employeeSlice';
import { getAllAllowanceAdvance } from '@/state/allowanceAdvanceSlice';
import { getAllSubCategories } from '@/state/subCategorySlice';
import { fetchHolidays } from '@/state/holidaySlice';
import { fetchCanteenDeductionsByMonth } from '@/state/canteenDeductionSlice';
import { fetchIncentivesByMonth } from '@/state/attendanceIncentiveSlice';
import { fetchProductionIncentivesByMonth } from '@/state/productionIncentiveSlice';
import { getAllAttendances } from '@/state/attendanceSlice';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-toastify';
import { Calculator, Plus, Trash2, Download, Eye, Save, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CodesAPI } from '@/services/codes_api';
import { CodeDetail } from '@/types/codes';

const isValDifferent = (val1: any, val2: any) => {
  if (val1 === val2) return false;
  const num1 = Number(val1);
  const num2 = Number(val2);
  if (!isNaN(num1) && !isNaN(num2)) {
    return Math.abs(num1 - num2) > 0.01;
  }
  return String(val1 ?? '').trim() !== String(val2 ?? '').trim();
};

const formatAmount = (val: any) => {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-IN');
};

const normalizePercentage = (value: any) => {
  const percentage = Number(value || 0);
  if (!Number.isFinite(percentage)) return 0;
  return Math.abs(percentage) > 1 ? percentage / 100 : percentage;
};

const calculatePfEarningComponents = (total: number, employee: Employee | undefined) => {
  const basicDaPercent = normalizePercentage(employee?.basicDaPercent);
  const hraPercent = normalizePercentage(employee?.hraPercent);
  const taPercent = normalizePercentage(employee?.taPercent);
  const medicalPercent = normalizePercentage(employee?.medicalPercent);
  const hasConfiguredPercentages = [basicDaPercent, hraPercent, taPercent, medicalPercent].some(percent => percent > 0);

  if (hasConfiguredPercentages) {
    const basicDA = Math.round(total * basicDaPercent);
    const hra = Math.round(total * hraPercent);
    const ta = Math.round(total * taPercent);
    const medical = Math.round(total * medicalPercent);
    return {
      basicDA,
      hra,
      ta,
      medical,
      totalEarningForPF: basicDA + hra + ta + medical,
    };
  }

  return {
    basicDA: 0,
    hra: 0,
    ta: 0,
    medical: 0,
    totalEarningForPF: total,
  };
};

const employeeAllowsOvertime = (employee: Employee | undefined) =>
  Number(employee?.shiftDetails?.overtimeAllowed) === 1;

const countDaysInMonth = (year: number, month: number, dayName: string) => {
  const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayName.toLowerCase().trim());
  if (dayIndex === -1) return 0;
  
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === dayIndex) {
      count++;
    }
  }
  return count;
};

const getAttDateStr = (d: any): string => {
  if (!d) return '';
  if (Array.isArray(d)) {
    const [y, m, day] = d;
    return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const str = String(d).trim();
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  return str.slice(0, 10);
};

const getAttendancePresentDays = (
  empId: any,
  empCode: any,
  targetMonth: string,
  targetFromDate: string,
  targetToDate: string,
  filterMode: 'month' | 'range',
  attList: any[]
): number | null => {
  if (!attList || attList.length === 0) return null;

  const targetIdStr = empId !== undefined && empId !== null ? String(empId).trim() : '';
  const targetCodeStr = empCode !== undefined && empCode !== null ? String(empCode).trim().toUpperCase() : '';

  const matchingRecords = attList.filter((att: any) => {
    const attIdStr = att.employeeId !== undefined && att.employeeId !== null 
      ? String(att.employeeId).trim() 
      : (att.employee_id !== undefined && att.employee_id !== null ? String(att.employee_id).trim() : '');
    const attCodeStr = String(att.employeeCode || att.employee_code || '').trim().toUpperCase();

    const matchesEmp = (targetIdStr && attIdStr && targetIdStr === attIdStr) ||
                       (targetCodeStr && attCodeStr && targetCodeStr === attCodeStr);
    if (!matchesEmp) return false;

    const dateStr = getAttDateStr(att.date);
    if (!dateStr) return false;

    if (filterMode === 'month' && targetMonth) {
      return dateStr.startsWith(targetMonth);
    } else if (filterMode === 'range' && targetFromDate && targetToDate) {
      return dateStr >= targetFromDate && dateStr <= targetToDate;
    }
    return false;
  });

  if (matchingRecords.length === 0) return null;

  const totalWorkingDays = matchingRecords.reduce((sum: number, att: any) => {
    let val = 0;
    if (att.workingDays !== undefined && att.workingDays !== null && !isNaN(Number(att.workingDays))) {
      val = Number(att.workingDays);
    } else if (att.status === 'Present') {
      val = 1;
    } else if (att.status === 'Half Day' || att.status === 'HalfDay') {
      val = 0.5;
    }
    return sum + val;
  }, 0);

  return totalWorkingDays;
};

const getAttendanceOtHours = (
  empId: any,
  empCode: any,
  targetMonth: string,
  targetFromDate: string,
  targetToDate: string,
  filterMode: 'month' | 'range',
  attList: any[]
): number | null => {
  if (!attList || attList.length === 0) return null;

  const targetIdStr = empId !== undefined && empId !== null ? String(empId).trim() : '';
  const targetCodeStr = empCode !== undefined && empCode !== null ? String(empCode).trim().toUpperCase() : '';

  const matchingRecords = attList.filter((att: any) => {
    const attIdStr = att.employeeId !== undefined && att.employeeId !== null 
      ? String(att.employeeId).trim() 
      : (att.employee_id !== undefined && att.employee_id !== null ? String(att.employee_id).trim() : '');
    const attCodeStr = String(att.employeeCode || att.employee_code || '').trim().toUpperCase();

    const matchesEmp = (targetIdStr && attIdStr && targetIdStr === attIdStr) ||
                       (targetCodeStr && attCodeStr && targetCodeStr === attCodeStr);
    if (!matchesEmp) return false;

    const dateStr = getAttDateStr(att.date);
    if (!dateStr) return false;

    if (filterMode === 'month' && targetMonth) {
      return dateStr.startsWith(targetMonth);
    } else if (filterMode === 'range' && targetFromDate && targetToDate) {
      return dateStr >= targetFromDate && dateStr <= targetToDate;
    }
    return false;
  });

  if (matchingRecords.length === 0) return null;

  const totalOtHours = matchingRecords.reduce((sum: number, att: any) => {
    let val = 0;
    const rawOt = att.overtimeHours ?? att.overtime_hours ?? att.ot_hours;
    if (rawOt !== undefined && rawOt !== null && rawOt !== '--' && rawOt !== '-') {
      const num = Number(rawOt);
      if (!isNaN(num)) {
        val = num;
      }
    }
    return sum + val;
  }, 0);

  return totalOtHours;
};

const EditableCell = ({ value: initialValue, employeeId, companyId, field, onUpdate, type = 'number', formatType = 'number', disabled }: any) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setValue((prev: any) => (isValDifferent(prev, initialValue) ? initialValue : prev));
    }
  }, [initialValue, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onUpdate(employeeId, companyId, field, value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  const renderValue = () => {
    if (type !== 'number') return value || '-';
    const num = Number(value) || 0;
    if (formatType === 'amount') {
      return formatAmount(num);
    }
    if (formatType === 'days') {
      return num % 1 === 0 ? num.toString() : num.toFixed(1);
    }
    return num.toFixed(2); // default number / hours format
  };

  if (!isEditing) {
    return (
      <div 
        className={`${disabled ? 'text-gray-500' : 'cursor-pointer hover:bg-blue-50 hover:border-blue-200'} px-2 py-1 rounded min-h-[1.5rem] transition-colors border border-transparent`} 
        onClick={() => !disabled && setIsEditing(true)}
        title={disabled ? "" : "Click to edit"}
      >
        {renderValue()}
      </div>
    );
  }

  return (
    <input
      autoFocus
      type={type}
      className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
      value={value ?? ''}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
};

const DropdownEditableCell = ({
  value: initialValue,
  employeeId,
  companyId,
  field,
  options = [],
  onUpdate,
  disabled
}: {
  value: any;
  employeeId: number;
  companyId: number;
  field: string;
  options: Array<{ label: string; value: string }>;
  onUpdate: (employeeId: number, companyId: number, field: string, value: any) => void;
  disabled?: boolean;
}) => {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  const handleChange = (newValue: any) => {
    const val = typeof newValue === 'object' && newValue?.target ? newValue.target.value : String(newValue || '');
    setValue(val);
    if (val !== initialValue) {
      onUpdate(employeeId, companyId, field, val);
    }
  };

  if (disabled) {
    return (
      <div className="px-2 py-1 text-gray-800 min-h-[1.5rem] truncate">
        {value || '-'}
      </div>
    );
  }

  const allOptions = [...options];
  if (value && !allOptions.some(opt => opt.value === value)) {
    allOptions.unshift({ label: value, value: value });
  }

  return (
    <div className="w-full min-w-[140px]">
      <CommonSearchableSelect
        options={allOptions}
        value={value || ''}
        onChange={handleChange}
        placeholder={`Select ${field}...`}
        className="w-full text-xs"
      />
    </div>
  );
};

export default function SalaryReportPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { salaryReportList, loading } = useSelector((state: RootState) => state.salary);
  const { employeeList } = useSelector((state: RootState) => state.employee);
  const { allAllowanceAdvanceList } = useSelector((state: RootState) => state.allowanceAdvance);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { holidayList } = useSelector((state: RootState) => state.holiday);
  const { canteenList } = useSelector((state: RootState) => state.canteenDeduction);
  const { incentiveList: attIncentiveList } = useSelector((state: RootState) => state.attendanceIncentive);
  const { incentiveList: prodIncentiveList } = useSelector((state: RootState) => state.productionIncentive);
  const { attendanceList } = useSelector((state: RootState) => state.attendance);
  const [month, setMonth] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [singleDate, setSingleDate] = useState('');
  const [filterType, setFilterType] = useState<'month' | 'range' | 'single'>('month');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [tableColumnFilters, setTableColumnFilters] = useState<Record<string, boolean>>({});
  const [modifiedEmployees, setModifiedEmployees] = useState<Set<number>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [employeeMasterLoaded, setEmployeeMasterLoaded] = useState(false);
  const hasAutoSyncedAdvanceForMonthRef = useRef<string>('');
  const hasAutoSyncedMasterForMonthRef = useRef<string>('');

  // Generate Department options from subCategoryList, employeeList, and default list
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    
    const defaults = ["Weaving", "Sizing", "Spinning", "Maintenance", "Quality", "Warehouse", "Electrical", "Accounts", "HR", "Admin", "Canteen", "Security", "IT", "Production"];
    defaults.forEach(d => set.add(d));

    if (Array.isArray(subCategoryList)) {
      subCategoryList.forEach((item: any) => {
        if (!item) return;
        const catName = String(item.categoryName || item.categorySno || '').trim().toLowerCase();
        if (catName === 'department') {
          const name = item.subCategoryName || item.name;
          if (name) set.add(String(name).trim());
        }
      });
    }

    if (Array.isArray(employeeList)) {
      employeeList.forEach((emp: any) => {
        const dept = emp.employmentDetails?.department || emp.department;
        if (dept && typeof dept === 'string' && dept.trim()) {
          set.add(dept.trim());
        }
      });
    }

    return Array.from(set).sort().map(dept => ({ label: dept, value: dept }));
  }, [subCategoryList, employeeList]);

  const [designationList, setDesignationList] = useState<CodeDetail[]>([]);

  useEffect(() => {
    CodesAPI.getCodeDetailsByHeader('Designation')
      .then((data) => {
        if (Array.isArray(data)) {
          setDesignationList(data);
        }
      })
      .catch((err) => console.error('Error fetching designations:', err));
  }, []);

  // Generate Designation options dynamically
  const designationOptions = useMemo(() => {
    const set = new Set<string>();

    if (Array.isArray(designationList) && designationList.length > 0) {
      designationList.forEach((item) => {
        if (item && item.is_active !== false) {
          const val = item.value || item.code;
          if (val && String(val).trim()) set.add(String(val).trim());
        }
      });
    }

    if (set.size === 0) {
      const defaults = [
        "GM", "DGM", "M-Planning", "AM-Warehouse", "Electrical Incharge", "Knotter", "Weaver",
        "Quality Supervisor", "Operator - C Unit", "Fabric Inspector", "Office Cleaning", "House Keeping",
        "Maintenance", "Electrical Assistant", "Group Fitter", "Warehouse Supervisor", "Warehouse Assistant",
        "Office Assistant", "Loadman", "Gaiter", "Incharge - C Unit", "Shed Incharge", "Shift Fitter",
        "Manpower + Grey Warehouse", "Shift Fitter Trainee", "Knotter Trainee", "Gaiter Trainee", "Pujari",
        "Electrical Helper", "Helper - C Unit", "Scavenger", "Trainee Knotter", "Loadman -C Unit",
        "Trainee Weaver", "Trainee Inspector", "Canteen - Helper", "Canteen - Master", "Canteen Helper",
        "Fitter", "Tsudakoma Incharge", "Scavanger", "Loom Cleaning", "Helper", "Machine Operator",
        "Technician", "Supervisor", "Production Incharge", "Manager", "Deputy General Manager"
      ];
      defaults.forEach(d => set.add(d));
    }

    if (Array.isArray(subCategoryList)) {
      subCategoryList.forEach((item: any) => {
        if (!item) return;
        const catName = String(item.categoryName || item.categorySno || '').trim().toLowerCase();
        if (catName === 'designation') {
          const name = item.subCategoryName || item.name;
          if (name) set.add(String(name).trim());
        }
      });
    }

    if (Array.isArray(employeeList)) {
      employeeList.forEach((emp: any) => {
        const desig = emp.employmentDetails?.designation || emp.designation;
        if (desig && typeof desig === 'string' && desig.trim()) {
          set.add(desig.trim());
        }
      });
    }

    return Array.from(set).sort().map(desig => ({ label: desig, value: desig }));
  }, [designationList, subCategoryList, employeeList]);

  // Create employee mapping for calculations
  const employeeMap = useMemo(() => {
    const map = new Map();
    (employeeList || []).forEach((employee: any) => {
      map.set(employee.id, employee);
    });
    return map;
  }, [employeeList]);

  // Create mapping of employeeCode to employeeMaster
  const employeeCodeMap = useMemo(() => {
    const map = new Map();
    (employeeList || []).forEach((employee: any) => {
      if (employee.employeeCode) {
        map.set(employee.employeeCode.trim().toUpperCase(), employee);
      }
    });
    return map;
  }, [employeeList]);

  const employeeMasterVersion = useMemo(() => JSON.stringify(employeeList), [employeeList]);

  useEffect(() => {
    if (filterType === 'month' && month) {
      hasAutoSyncedAdvanceForMonthRef.current = '';
      hasAutoSyncedMasterForMonthRef.current = '';
      dispatch(getSalaryReport(month));
      dispatch(fetchCanteenDeductionsByMonth(month));
      dispatch(fetchIncentivesByMonth(month));
      dispatch(fetchProductionIncentivesByMonth(month));
      dispatch(getAllAttendances({ fetchAll: true, month }));
      setModifiedEmployees(new Set()); // Reset on month change
      setIsEditMode(false); // Reset edit mode on month change
    } else if (filterType === 'single' && singleDate) {
      hasAutoSyncedAdvanceForMonthRef.current = '';
      hasAutoSyncedMasterForMonthRef.current = '';
      dispatch(getSalaryReport({ fromDate: singleDate, toDate: singleDate }));
      dispatch(getAllAttendances({ fetchAll: true }));
      setModifiedEmployees(new Set());
      setIsEditMode(false);
    } else if (filterType === 'range' && (fromDate || toDate)) {
      const effFrom = fromDate || toDate;
      const effTo = toDate || fromDate;
      hasAutoSyncedAdvanceForMonthRef.current = '';
      hasAutoSyncedMasterForMonthRef.current = '';
      dispatch(getSalaryReport({ fromDate: effFrom, toDate: effTo }));
      dispatch(getAllAttendances({ fetchAll: true }));
      setModifiedEmployees(new Set());
      setIsEditMode(false);
    }
  }, [dispatch, month, fromDate, toDate, singleDate, filterType]);

  useEffect(() => {
    let isCurrent = true;
    setEmployeeMasterLoaded(false);
    dispatch(getAllEmployees({ fetchAll: true }))
      .unwrap()
      .then(() => {
        if (isCurrent) setEmployeeMasterLoaded(true);
      })
      .catch((error) => {
        if (!isCurrent) return;
        console.error('Failed to load employee master for salary report:', error);
        toast.error('Failed to load employee master. Please try again.');
      });
    dispatch(getAllAllowanceAdvance({ fetchAll: true }));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(fetchHolidays());
    dispatch(getAllAttendances({ fetchAll: true }));

    return () => {
      isCurrent = false;
    };
  }, [dispatch]);

  const monthHolidaysCount = useMemo(() => {
    const effFrom = filterType === 'single' ? singleDate : (fromDate || toDate);
    const effTo = filterType === 'single' ? singleDate : (toDate || fromDate);
    if ((filterType === 'month' && !month) || (filterType !== 'month' && (!effFrom || !effTo)) || !Array.isArray(holidayList) || holidayList.length === 0) return 0;

    return holidayList.filter((h: any) => {
      if (!h || !h.holidayDate) return false;
      if (h.status && String(h.status).toLowerCase() === 'inactive') return false;

      let dateStr = '';
      if (Array.isArray(h.holidayDate)) {
        const [y, m, d] = h.holidayDate;
        dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      } else {
        dateStr = String(h.holidayDate).trim().slice(0, 10);
      }

      if (filterType === 'month' && month) {
        return dateStr.startsWith(month);
      } else if (effFrom && effTo) {
        return dateStr >= effFrom && dateStr <= effTo;
      }
      return false;
    }).length;
  }, [month, fromDate, toDate, singleDate, filterType, holidayList]);

  // Sync Salary Advance from allAllowanceAdvanceList to salaryReportList in Redux if not saved in SalaryReportOverride table
  useEffect(() => {
    if (filterType !== 'month' || !month || salaryReportList.length === 0 || !allAllowanceAdvanceList || allAllowanceAdvanceList.length === 0) return;
    if (hasAutoSyncedAdvanceForMonthRef.current === month) return;

    hasAutoSyncedAdvanceForMonthRef.current = month;

    const extractMonth = (m: any) => {
      if (!m) return '';
      if (Array.isArray(m)) return `${m[0]}-${String(m[1]).padStart(2, '0')}`;
      return String(m).slice(0, 7);
    };

    salaryReportList.forEach((report: any) => {
      const empId = report.employeeId;
      if (modifiedEmployees.has(empId)) return;

      // Check if Salary Advance data is already saved in SalaryReportOverride database table
      const isSavedInDb = (report.id !== null && report.id !== undefined && report.id > 0) || report.isSalaryGenerated === 1;
      const isSalaryAdvanceSavedInDb = isSavedInDb && report.salaryAdvanceDeduction !== null && report.salaryAdvanceDeduction !== undefined && Number(report.salaryAdvanceDeduction) > 0;

      // If salary advance exists and is set from SalaryReportOverride table in database, preserve it
      if (isSalaryAdvanceSavedInDb) {
        return;
      }

      const matchingAdvances = (allAllowanceAdvanceList || []).filter((adv: any) => 
        String(adv.employeeId || adv.employee_id) === String(empId) &&
        extractMonth(adv.month) === month &&
        adv.type === 'Salary Advance'
      );

      const sum = matchingAdvances.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

      if (sum !== Number(report.salaryAdvanceDeduction || 0)) {
        const salaryAdvanceDeduction = sum;
        const loanDeduction = Number(report.loanDeduction || 0);
        const pfDeduction = Number(report.pfDeduction || 0);
        const esiDeduction = Number(report.esiDeduction || 0);
        const canteenDeduction = Number(report.canteenDeduction || 0);
        const tds = Number(report.tds || 0);
        
        const totalDeduction = salaryAdvanceDeduction + loanDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
        const totalEarningForPF = Number(report.totalEarningForPF || 0);
        const netSalary = totalEarningForPF - totalDeduction;

        dispatch(updateReportItem({ employeeId: empId, field: 'salaryAdvanceDeduction', value: salaryAdvanceDeduction }));
        dispatch(updateReportItem({ employeeId: empId, field: 'totalDeduction', value: totalDeduction }));
        dispatch(updateReportItem({ employeeId: empId, field: 'netSalary', value: netSalary }));
      }
    });
  }, [salaryReportList, allAllowanceAdvanceList, month, filterType, modifiedEmployees, dispatch]);

  // Auto-sync Employee Master and Attendance changes to Salary Report calculations
  useEffect(() => {
    if (!employeeMasterLoaded || filterType !== 'month' || !month || salaryReportList.length === 0 || employeeList.length === 0) return;
    const autoSyncKey = `${month}_${fromDate}_${toDate}_att${attendanceList?.length || 0}_employeeMaster${employeeMasterVersion}_pinc${prodIncentiveList?.length || 0}_ainc${attIncentiveList?.length || 0}_cant${canteenList?.length || 0}`;
    if (hasAutoSyncedMasterForMonthRef.current === autoSyncKey) return;

    hasAutoSyncedMasterForMonthRef.current = autoSyncKey;

    let updatedSome = false;

    salaryReportList.forEach((report: any) => {
      const empId = report.employeeId;
      // Skip if this row is currently being manually edited on the screen to avoid interfering with user input
      if (modifiedEmployees.has(empId)) return;

      const employee = employeeMap.get(empId) || employeeCodeMap.get(report.employeeCode?.trim().toUpperCase());
      if (!employee) return;
      const overtimeAllowed = employeeAllowsOvertime(employee);

      // Calculate expected days to be present for the month
      const [year, monthStr] = month.split('-');
      const totalDaysInMonth = new Date(Number(year), Number(monthStr), 0).getDate();

      const isSavedRecord = report.isSalaryGenerated === 1 || (report.id !== null && report.id !== undefined && report.id > 0);

      let expectedDaysToBePresent = report.daysToBePresent;
      if (!isSavedRecord || report.daysToBePresent === undefined || report.daysToBePresent === null || Number(report.daysToBePresent) <= 0) {
        if (employee.isEligibleFor28Days) {
          expectedDaysToBePresent = 28;
        } else if (employee.shiftDetails) {
          const weekOffDay = employee.shiftDetails.weeklyOffDay;
          const noOfLeave = Number(employee.shiftDetails.noOfLeave || 0);

          let weekOffCount = 0;
          if (weekOffDay && !['no', 'none', ''].includes(weekOffDay.toLowerCase().trim())) {
            weekOffCount = countDaysInMonth(Number(year), Number(monthStr), weekOffDay);
          }

          const salaryType = employee.salaryDetails?.salaryType || 'Monthly';
          if (salaryType === 'Daily') {
            expectedDaysToBePresent = totalDaysInMonth - noOfLeave;
          } else {
            expectedDaysToBePresent = totalDaysInMonth - weekOffCount;
          }
        }
      }

      const isHolDeduct = employee.holidayDeductionApplicable === true || 
                          employee.holidayDeductionApplicable === 1 || 
                          employee.isHolidayDeductionApplicable === true || 
                          employee.isHolidayDeductionApplicable === 1 || 
                          String(employee.holidayDeductionApplicable) === '1' ||
                          String(employee.isHolidayDeductionApplicable) === '1' ||
                          (employee.employmentDetails as any)?.isHolidayDeductionApplicable === true || 
                          (employee.employmentDetails as any)?.isHolidayDeductionApplicable === 1 ||
                          (employee.employmentDetails as any)?.holidayDeductionApplicable === true || 
                          (employee.employmentDetails as any)?.holidayDeductionApplicable === 1 ||
                          String((employee.employmentDetails as any)?.isHolidayDeductionApplicable) === '1' ||
                          String((employee.employmentDetails as any)?.holidayDeductionApplicable) === '1';

      if (isHolDeduct && monthHolidaysCount > 0) {
        expectedDaysToBePresent = Math.max(0, expectedDaysToBePresent - monthHolidaysCount);
      }

      const currentGross = Number(employee.salaryDetails?.basicSalary || 0);
      const isCanteenVal = employee.salaryDetails?.isCanteen === true || employee.salaryDetails?.isCanteen === 1 ? 1 : 0;
      const pfApplicableVal = employee.pfApplicable === true || employee.pfApplicable === 1;
      const esiApplicableVal = employee.esiApplicable === true || employee.esiApplicable === 1;

      // Recalculate row details
      const workingHoursPerDay = Number(employee.shiftDetails?.totalWorkingHours || 8);
      const salaryType = employee.salaryDetails?.salaryType || 'Monthly';

      const attPresentDays = getAttendancePresentDays(
        empId,
        report.employeeCode,
        month,
        fromDate,
        toDate,
        filterType,
        attendanceList
      );

      const attOtHours = overtimeAllowed
        ? getAttendanceOtHours(
            empId,
            report.employeeCode,
            month,
            fromDate,
            toDate,
            filterType,
            attendanceList
          )
        : null;

      const actualPresentDays = attPresentDays !== null ? attPresentDays : Number(report.actualPresentDays || 0);
      const otHoursWorked = overtimeAllowed
        ? (attOtHours !== null ? attOtHours : Number(report.otHoursWorked || 0))
        : 0;
      const festivalHoursWorked = Number(report.festivalHoursWorked || 0);

      let basicDays = actualPresentDays;
      let extraOtHours = 0;
      let displayedPresentDays = actualPresentDays;
      if (expectedDaysToBePresent === 28 && actualPresentDays > 28) {
        basicDays = 28;
        displayedPresentDays = 28;
        extraOtHours = (actualPresentDays - 28) * workingHoursPerDay;
      }

      const effectiveOtHours = overtimeAllowed ? otHoursWorked + extraOtHours : 0;

      let perDaySalary = 0;
      let basicSalary = 0;
      let otSalary = 0;
      let festivalWageSalary = 0;

      const isDaily = String(salaryType).trim().toLowerCase() === 'daily';

      if (isDaily) {
        perDaySalary = currentGross;
        basicSalary = perDaySalary * basicDays;
        const hourlyRate = workingHoursPerDay > 0 ? (perDaySalary / workingHoursPerDay) : 0;
        otSalary = hourlyRate * effectiveOtHours;
        festivalWageSalary = hourlyRate * festivalHoursWorked;
      } else {
        perDaySalary = expectedDaysToBePresent > 0 ? (currentGross / expectedDaysToBePresent) : 0;
        basicSalary = perDaySalary * basicDays;
        const monthlyPerHourSalary = workingHoursPerDay > 0 ? (perDaySalary / workingHoursPerDay) : 0;
        otSalary = monthlyPerHourSalary * effectiveOtHours;
        festivalWageSalary = monthlyPerHourSalary * festivalHoursWorked;
      }

      perDaySalary = Math.round(perDaySalary);
      basicSalary = Math.round(basicSalary);
      otSalary = Math.round(otSalary);
      festivalWageSalary = Math.round(festivalWageSalary);

      const attendanceIncentiveApplicable = employee.attendanceIncentiveApplicable === true || employee.attendanceIncentiveApplicable === 1;
      const productionIncentiveApplicable = employee.productionIncentiveApplicable === true || employee.productionIncentiveApplicable === 1;
      const foodAllowanceApplicable = employee.foodAllowanceApplicable === true || employee.foodAllowanceApplicable === 1;

      // Check for HR Module Attendance Incentive entry first
      const empAttInc = (attIncentiveList || []).find((item: any) => {
        if (!item) return false;
        const itemEmpId = item.employeeId !== undefined && item.employeeId !== null ? String(item.employeeId).trim() : (item.employee?.id ? String(item.employee.id).trim() : '');
        const reportEmpId = empId !== undefined && empId !== null ? String(empId).trim() : '';
        const itemCode = String(item.employeeCode || item.employee?.employeeCode || '').trim().toUpperCase();
        const reportCode = String(report.employeeCode || '').trim().toUpperCase();
        return (itemEmpId && reportEmpId && itemEmpId === reportEmpId) || (itemCode && reportCode && itemCode === reportCode);
      });

      const savedAttInc = (report.attIncentive !== undefined && report.attIncentive !== null)
        ? Number(report.attIncentive)
        : ((report.attendanceIncentive !== undefined && report.attendanceIncentive !== null) ? Number(report.attendanceIncentive) : null);

      let attendanceIncentive = 0;
      let attIncentive = 0;

      if (empAttInc) {
        if (empAttInc.dailyRate !== undefined && empAttInc.dailyRate !== null && Number(empAttInc.dailyRate) > 0) {
          const rate = Number(empAttInc.dailyRate);
          attIncentive = Math.round(rate * actualPresentDays);
        } else {
          attIncentive = Math.round(Number(empAttInc.amount || 0));
        }
        attendanceIncentive = attIncentive;
      } else if (savedAttInc !== null && savedAttInc > 0) {
        attendanceIncentive = savedAttInc;
        attIncentive = savedAttInc;
      } else {
        if (attendanceIncentiveApplicable && employee.attendanceIncentive) {
          attendanceIncentive = Number(employee.attendanceIncentive);
        }
        if (actualPresentDays >= expectedDaysToBePresent) {
          attIncentive = attendanceIncentiveApplicable ? (attendanceIncentive * actualPresentDays) : 0;
        }
        attIncentive = Math.round(attIncentive);
      }

      // Check for HR Module Production Incentive entry first
      const empProdInc = (prodIncentiveList || []).find((item: any) => {
        if (!item) return false;
        const itemEmpId = item.employeeId !== undefined && item.employeeId !== null ? String(item.employeeId).trim() : (item.employee?.id ? String(item.employee.id).trim() : '');
        const reportEmpId = empId !== undefined && empId !== null ? String(empId).trim() : '';
        const itemCode = String(item.employeeCode || item.employee?.employeeCode || '').trim().toUpperCase();
        const reportCode = String(report.employeeCode || '').trim().toUpperCase();
        return (itemEmpId && reportEmpId && itemEmpId === reportEmpId) || (itemCode && reportCode && itemCode === reportCode);
      });

      const savedProdInc = (report.prodIncentive !== undefined && report.prodIncentive !== null)
        ? Number(report.prodIncentive)
        : ((report.productionIncentive !== undefined && report.productionIncentive !== null) ? Number(report.productionIncentive) : null);

      let productionIncentive = 0;
      let prodIncentive = 0;

      if (empProdInc) {
        if (empProdInc.dailyRate !== undefined && empProdInc.dailyRate !== null && Number(empProdInc.dailyRate) > 0) {
          const rate = Number(empProdInc.dailyRate);
          prodIncentive = Math.round(rate * actualPresentDays);
        } else {
          prodIncentive = Math.round(Number(empProdInc.amount || 0));
        }
        productionIncentive = prodIncentive;
      } else if (savedProdInc !== null && savedProdInc > 0) {
        productionIncentive = savedProdInc;
        prodIncentive = savedProdInc;
      } else {
        if (productionIncentiveApplicable && employee.productionIncentive) {
          productionIncentive = Number(employee.productionIncentive);
        }
        if (actualPresentDays >= expectedDaysToBePresent) {
          prodIncentive = productionIncentiveApplicable ? (productionIncentive * actualPresentDays) : 0;
        }
        prodIncentive = Math.round(prodIncentive);
      }

      let foodAllowance = Number(report.foodAllowance || 0);
      if (foodAllowance === 0 && foodAllowanceApplicable && actualPresentDays > 0) {
        foodAllowance = actualPresentDays * 50;
      }

      const empHouseRent = Number(employee.employmentDetails?.houseRent || employee.houseRent || 0);
      const houseRent = (report.houseRent !== undefined && report.houseRent !== null && Number(report.houseRent) !== 0)
        ? Number(report.houseRent)
        : empHouseRent;

      const total = basicSalary + otSalary + festivalWageSalary + attIncentive + prodIncentive + houseRent;

      const pfEarningComponents = calculatePfEarningComponents(total, employee);
      const { basicDA, hra, ta, medical, totalEarningForPF } = pfEarningComponents;

      const salaryAdvanceDeduction = Number(report.salaryAdvanceDeduction || 0);
      const loanDeduction = Number(report.loanDeduction || 0);

      let pfDeduction = 0;
      if (pfApplicableVal && basicDA > 0) {
        const pfPercent = Number(employee.pfPercent || 0);
        if (basicDA < 15000) {
          pfDeduction = Math.round(basicDA * pfPercent);
        } else {
          pfDeduction = Math.round(15000 * pfPercent);
        }
      }

      let esiDeduction = 0;
      if (esiApplicableVal && totalEarningForPF > 0) {
        if (isDaily ? ((currentGross * 26) < 21000) : (currentGross < 21000)) {
          esiDeduction = Math.round(totalEarningForPF * 0.0075);
        }
      }

      // Check for HR Module Canteen Deduction entry first
      const empCanteen = (canteenList || []).find((item: any) => {
        if (!item) return false;
        const itemEmpId = item.employeeId !== undefined && item.employeeId !== null ? String(item.employeeId).trim() : (item.employee?.id ? String(item.employee.id).trim() : '');
        const reportEmpId = empId !== undefined && empId !== null ? String(empId).trim() : '';
        const itemCode = String(item.employeeCode || item.employee?.employeeCode || '').trim().toUpperCase();
        const reportCode = String(report.employeeCode || '').trim().toUpperCase();
        return (itemEmpId && reportEmpId && itemEmpId === reportEmpId) || (itemCode && reportCode && itemCode === reportCode);
      });

      let canteenDeduction = Number(report.canteenDeduction || 0);
      if (empCanteen) {
        if (empCanteen.canteenAmount !== undefined && empCanteen.canteenAmount !== null && Number(empCanteen.canteenAmount) > 0) {
          canteenDeduction = Math.round(Number(empCanteen.canteenAmount));
        } else if (empCanteen.dailyDeductionRate !== undefined && empCanteen.dailyDeductionRate !== null && Number(empCanteen.dailyDeductionRate) > 0) {
          canteenDeduction = Math.round(Number(empCanteen.dailyDeductionRate) * actualPresentDays);
        }
      } else if (isCanteenVal === 0 && foodAllowance > 0 && foodAllowanceApplicable) {
        canteenDeduction = foodAllowance;
      }

      const tds = Number(report.tds || 0);
      const totalDeduction = salaryAdvanceDeduction + loanDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
      const netSalary = totalEarningForPF - totalDeduction;

      // Check if values differ from the current report values
      const isSaved = report.isSalaryGenerated === 1 || (report.id !== null && report.id !== undefined && report.id > 0);

      const hasChanges = isSaved
        ? (
            isValDifferent(report.actualPresentDays, actualPresentDays) ||
            isValDifferent(report.otHoursWorked, otHoursWorked) ||
            isValDifferent(report.otSalary, otSalary) ||
            isValDifferent(report.daysToBePresent, expectedDaysToBePresent) ||
            isValDifferent(report.grossSalary, currentGross) ||
            isValDifferent(report.salaryType, salaryType) ||
            isValDifferent(report.perDaySalary, perDaySalary) ||
            isValDifferent(report.basicSalary, basicSalary) ||
            isValDifferent(report.houseRent, houseRent) ||
            isValDifferent(report.attendanceIncentive, attendanceIncentive) ||
            isValDifferent(report.productionIncentive, productionIncentive) ||
            isValDifferent(report.attIncentive, attIncentive) ||
            isValDifferent(report.prodIncentive, prodIncentive) ||
            isValDifferent(report.total, total) ||
            isValDifferent(report.basicDA, basicDA) ||
            isValDifferent(report.hra, hra) ||
            isValDifferent(report.ta, ta) ||
            isValDifferent(report.medical, medical) ||
            isValDifferent(report.totalEarningForPF, totalEarningForPF) ||
            isValDifferent(report.pfDeduction, pfDeduction) ||
            isValDifferent(report.esiDeduction, esiDeduction) ||
            isValDifferent(report.canteenDeduction, canteenDeduction) ||
            isValDifferent(report.totalDeduction, totalDeduction) ||
            isValDifferent(report.netSalary, netSalary)
          )
        : (
            isValDifferent(report.actualPresentDays, actualPresentDays) ||
            isValDifferent(report.otHoursWorked, otHoursWorked) ||
            isValDifferent(report.otSalary, otSalary) ||
            isValDifferent(report.daysToBePresent, expectedDaysToBePresent) ||
            isValDifferent(report.grossSalary, currentGross) ||
            isValDifferent(report.salaryType, salaryType) ||
            isValDifferent(report.perDaySalary, perDaySalary) ||
            isValDifferent(report.basicSalary, basicSalary) ||
            isValDifferent(report.festivalWageSalary, festivalWageSalary) ||
            isValDifferent(report.attendanceIncentive, attendanceIncentive) ||
            isValDifferent(report.productionIncentive, productionIncentive) ||
            isValDifferent(report.foodAllowance, foodAllowance) ||
            isValDifferent(report.houseRent, houseRent) ||
            isValDifferent(report.attIncentive, attIncentive) ||
            isValDifferent(report.prodIncentive, prodIncentive) ||
            isValDifferent(report.total, total) ||
            isValDifferent(report.basicDA, basicDA) ||
            isValDifferent(report.hra, hra) ||
            isValDifferent(report.ta, ta) ||
            isValDifferent(report.medical, medical) ||
            isValDifferent(report.totalEarningForPF, totalEarningForPF) ||
            isValDifferent(report.pfDeduction, pfDeduction) ||
            isValDifferent(report.esiDeduction, esiDeduction) ||
            isValDifferent(report.canteenDeduction, canteenDeduction) ||
            isValDifferent(report.totalDeduction, totalDeduction) ||
            isValDifferent(report.netSalary, netSalary)
          );

      if (hasChanges) {
        console.log(`[Auto-Sync] Mismatch detected for ${report.employeeName}. Dispatching updates...`);
        dispatch(updateReportItem({ employeeId: empId, field: 'actualPresentDays', value: actualPresentDays }));
        dispatch(updateReportItem({ employeeId: empId, field: 'otHoursWorked', value: otHoursWorked }));
        dispatch(updateReportItem({ employeeId: empId, field: 'daysToBePresent', value: expectedDaysToBePresent }));
        dispatch(updateReportItem({ employeeId: empId, field: 'grossSalary', value: currentGross }));
        dispatch(updateReportItem({ employeeId: empId, field: 'salaryType', value: salaryType }));
        dispatch(updateReportItem({ employeeId: empId, field: 'perDaySalary', value: perDaySalary }));
        dispatch(updateReportItem({ employeeId: empId, field: 'basicSalary', value: basicSalary }));
        dispatch(updateReportItem({ employeeId: empId, field: 'otSalary', value: otSalary }));
        dispatch(updateReportItem({ employeeId: empId, field: 'festivalWageSalary', value: festivalWageSalary }));
        dispatch(updateReportItem({ employeeId: empId, field: 'attendanceIncentive', value: attendanceIncentive }));
        dispatch(updateReportItem({ employeeId: empId, field: 'productionIncentive', value: productionIncentive }));
        dispatch(updateReportItem({ employeeId: empId, field: 'foodAllowance', value: foodAllowance }));
        dispatch(updateReportItem({ employeeId: empId, field: 'houseRent', value: houseRent }));
        dispatch(updateReportItem({ employeeId: empId, field: 'attIncentive', value: attIncentive }));
        dispatch(updateReportItem({ employeeId: empId, field: 'prodIncentive', value: prodIncentive }));
        dispatch(updateReportItem({ employeeId: empId, field: 'total', value: total }));
        dispatch(updateReportItem({ employeeId: empId, field: 'basicDA', value: basicDA }));
        dispatch(updateReportItem({ employeeId: empId, field: 'hra', value: hra }));
        dispatch(updateReportItem({ employeeId: empId, field: 'ta', value: ta }));
        dispatch(updateReportItem({ employeeId: empId, field: 'medical', value: medical }));
        dispatch(updateReportItem({ employeeId: empId, field: 'totalEarningForPF', value: totalEarningForPF }));
        dispatch(updateReportItem({ employeeId: empId, field: 'pfDeduction', value: pfDeduction }));
        dispatch(updateReportItem({ employeeId: empId, field: 'esiDeduction', value: esiDeduction }));
        dispatch(updateReportItem({ employeeId: empId, field: 'canteenDeduction', value: canteenDeduction }));
        dispatch(updateReportItem({ employeeId: empId, field: 'totalDeduction', value: totalDeduction }));
        dispatch(updateReportItem({ employeeId: empId, field: 'netSalary', value: netSalary }));

        setModifiedEmployees(prev => {
          const next = new Set(prev);
          next.add(empId);
          return next;
        });
        updatedSome = true;
      }
    });

    if (updatedSome) {
      toast.info("Salary report recalculated and updated with the latest Employee Master changes. Please review and click 'Save/Update' to save the changes.");
    }
  }, [salaryReportList, employeeList, employeeMasterLoaded, employeeMasterVersion, attendanceList, prodIncentiveList, attIncentiveList, canteenList, month, fromDate, toDate, filterType, employeeMap, employeeCodeMap, modifiedEmployees, dispatch]);


  const handleUpdate = (employeeId: number, companyId: number, field: string, value: any) => {
    console.log('[handleUpdate] Input received:', { employeeId, companyId, field, value });
    
    const report = salaryReportList.find((r: any) => r.employeeId === employeeId);
    const employeeMaster = report
      ? employeeMap.get(report.employeeId) || employeeCodeMap.get(report.employeeCode?.trim().toUpperCase())
      : undefined;
    const overtimeAllowed = employeeAllowsOvertime(employeeMaster);
    const isOvertimeField = field === 'otHoursWorked' || field === 'otSalary';
    const overtimeRestricted = isOvertimeField && !overtimeAllowed;
    const updateValue = overtimeRestricted ? 0 : value;

    if (overtimeRestricted && Number(value || 0) !== 0) {
      toast.error(`Overtime is not allowed for ${report?.employeeName || 'this employee'}.`);
    }

    setModifiedEmployees(prev => {
      const next = new Set(prev);
      next.add(employeeId);
      return next;
    });

    const parsedValue = updateValue === '' ? null : (['remarks', 'department', 'designation'].includes(field) ? updateValue : parseFloat(updateValue));
    
    console.log('[handleUpdate] Dispatching updated cell value:', { field, parsedValue });
    dispatch(updateReportItem({ 
      employeeId, 
      field, 
      value: parsedValue
    }));

    if (field === 'attendanceIncentive' || field === 'attIncentive') {
      dispatch(updateReportItem({ employeeId, field: 'attendanceIncentive', value: parsedValue }));
      dispatch(updateReportItem({ employeeId, field: 'attIncentive', value: parsedValue }));
    }
    if (field === 'productionIncentive' || field === 'prodIncentive') {
      dispatch(updateReportItem({ employeeId, field: 'productionIncentive', value: parsedValue }));
      dispatch(updateReportItem({ employeeId, field: 'prodIncentive', value: parsedValue }));
    }

    if (report) {
      console.log('[handleUpdate] Found employee master:', employeeMaster);

      // Validation for festival wages eligibility
      if (field === 'festivalHoursWorked' || field === 'festivalWageSalary') {
        const numVal = parseFloat(value || 0);
        if (numVal > 0) {
          const isFestivalWageApplicable =
            employeeMaster?.festivalWagesApplicable === true ||
            employeeMaster?.festivalWagesApplicable === 1 ||
            employeeMaster?.employmentDetails?.isFestivalWageApplicable === true ||
            employeeMaster?.employmentDetails?.isFestivalWageApplicable === 1;

          if (!isFestivalWageApplicable) {
            toast.error(`The employee ${report?.employeeName || ''} is not applicable for festival wages.`);
            dispatch(updateReportItem({ employeeId, field: 'festivalHoursWorked', value: 0 }));
            dispatch(updateReportItem({ employeeId, field: 'festivalWageSalary', value: 0 }));
            return;
          }
        }
      }

      // Auto-calculate OT Salary, Basic Salary, and Per Day Salary when hours/days are edited
      const currentOtHoursWorked = field === 'otHoursWorked' ? (updateValue === '' ? null : parseFloat(updateValue)) : (report.otHoursWorked !== undefined && report.otHoursWorked !== null ? Number(report.otHoursWorked) : null);
      const currentActualPresentDays = field === 'actualPresentDays' ? parseFloat(value || 0) : Number(report.actualPresentDays || 0);
      const currentDaysToBePresent = field === 'daysToBePresent' ? parseFloat(value || 26) : Number(report.daysToBePresent || 26);
      const grossSalary = Number(employeeMaster?.salaryDetails?.basicSalary ?? report.grossSalary ?? 0);
      const salaryType = employeeMaster?.salaryDetails?.salaryType || report.salaryType || 'Monthly';
      const workingHoursPerDay = Number(report.workingHoursPerDay || 8);

      console.log('[handleUpdate] Computation variables:', {
        currentOtHoursWorked,
        currentActualPresentDays,
        currentDaysToBePresent,
        grossSalary,
        salaryType,
        workingHoursPerDay
      });

      let basicDays = currentActualPresentDays;
      let extraOtHours = 0;
      let displayedPresentDays = currentActualPresentDays;
      if (currentDaysToBePresent === 28 && currentActualPresentDays > 28) {
        basicDays = 28;
        displayedPresentDays = 28;
        extraOtHours = (currentActualPresentDays - 28) * workingHoursPerDay;
      }

      const effectiveOtHours = overtimeAllowed
        ? (currentOtHoursWorked !== null ? (currentOtHoursWorked + extraOtHours) : (extraOtHours > 0 ? extraOtHours : null))
        : 0;

      let computedOtSalary = 0;
      let perDaySalary = 0;
      let basicSalary = 0;

      if (salaryType === 'Daily') {
        perDaySalary = grossSalary;
        basicSalary = perDaySalary * basicDays;
        const hourlyRate = workingHoursPerDay > 0 ? (perDaySalary / workingHoursPerDay) : 0;
        computedOtSalary = effectiveOtHours !== null ? (hourlyRate * effectiveOtHours) : 0;
      } else {
        // Monthly
        if (grossSalary && currentDaysToBePresent) {
          perDaySalary = grossSalary / currentDaysToBePresent;
        }
        basicSalary = perDaySalary * basicDays;
        if (workingHoursPerDay > 0) {
          const monthlyPerHourSalary = perDaySalary / workingHoursPerDay;
          computedOtSalary = effectiveOtHours !== null ? (monthlyPerHourSalary * effectiveOtHours) : 0;
        }
      }

      // Round properly
      computedOtSalary = Math.round(computedOtSalary);
      basicSalary = Math.round(basicSalary);
      perDaySalary = Math.round(perDaySalary);

      console.log('[handleUpdate] Recalculated OT, Basic and PerDay:', {
        computedOtSalary,
        basicSalary,
        perDaySalary
      });

      if (field === 'otHoursWorked' || field === 'actualPresentDays' || field === 'daysToBePresent') {
        console.log('[handleUpdate] Dispatching secondary calculated values');
        dispatch(updateReportItem({ employeeId, field: 'otSalary', value: computedOtSalary }));
        dispatch(updateReportItem({ employeeId, field: 'basicSalary', value: basicSalary }));
        dispatch(updateReportItem({ employeeId, field: 'perDaySalary', value: perDaySalary }));
      }

      let computedFestivalWageSalary = 0;
      const festivalHoursWorkedVal = field === 'festivalHoursWorked'
        ? parseFloat(value || 0)
        : Number(report.festivalHoursWorked || 0);

      const hourlyRate = workingHoursPerDay > 0 ? (perDaySalary / workingHoursPerDay) : 0;
      computedFestivalWageSalary = Math.round(hourlyRate * festivalHoursWorkedVal);

      if (field === 'festivalHoursWorked' || field === 'actualPresentDays' || field === 'daysToBePresent') {
        dispatch(updateReportItem({ employeeId, field: 'festivalWageSalary', value: computedFestivalWageSalary }));
      }

      // Get values for total earnings calculation
      const basicSalaryValue = (field === 'otHoursWorked' || field === 'actualPresentDays' || field === 'daysToBePresent')
        ? basicSalary
        : (field === 'basicSalary' ? parseFloat(value || 0) : Number(report.basicSalary || 0));

      const otSalaryValue = (field === 'otHoursWorked' || field === 'actualPresentDays' || field === 'daysToBePresent')
        ? computedOtSalary
        : (field === 'otSalary' ? parseFloat(updateValue || 0) : Number(report.otSalary || 0));

      const festivalWageSalaryValue = (field === 'festivalHoursWorked' || field === 'actualPresentDays' || field === 'daysToBePresent')
        ? computedFestivalWageSalary
        : (field === 'festivalWageSalary' ? parseFloat(value || 0) : Number(report.festivalWageSalary || 0));

      const attIncentive = (field === 'attIncentive' || field === 'attendanceIncentive')
        ? (value === '' || value === null ? 0 : parseFloat(value || 0))
        : Number(report.attIncentive !== undefined && report.attIncentive !== null ? report.attIncentive : (report.attendanceIncentive || 0));

      const prodIncentive = (field === 'prodIncentive' || field === 'productionIncentive')
        ? (value === '' || value === null ? 0 : parseFloat(value || 0))
        : Number(report.prodIncentive !== undefined && report.prodIncentive !== null ? report.prodIncentive : (report.productionIncentive || 0));

      const foodAllowance = field === 'foodAllowance' ? parseFloat(value || 0) : Number(report.foodAllowance || 0);
      const empHouseRent = Number(employeeMaster?.employmentDetails?.houseRent || employeeMaster?.houseRent || 0);
      const houseRent = field === 'houseRent'
        ? (value === '' ? 0 : parseFloat(value))
        : ((report.houseRent !== undefined && report.houseRent !== null && Number(report.houseRent) !== 0) ? Number(report.houseRent) : empHouseRent);
      
      const total = basicSalaryValue + otSalaryValue + festivalWageSalaryValue + attIncentive + prodIncentive + houseRent;

      const pfEarningComponents = calculatePfEarningComponents(total, employeeMaster);
      const basicDA = field === 'basicDA'
        ? (value === '' ? 0 : parseFloat(value))
        : pfEarningComponents.basicDA;
      const hra = field === 'hra'
        ? (value === '' ? 0 : parseFloat(value))
        : pfEarningComponents.hra;
      const ta = field === 'ta'
        ? (value === '' ? 0 : parseFloat(value))
        : pfEarningComponents.ta;
      const medical = field === 'medical'
        ? (value === '' ? 0 : parseFloat(value))
        : pfEarningComponents.medical;
      
      const totalEarningForPF = (basicDA + hra + ta + medical) || pfEarningComponents.totalEarningForPF;

      const salaryAdvanceDeduction = field === 'salaryAdvanceDeduction' ? parseFloat(value || 0) : Number(report.salaryAdvanceDeduction || 0);
      const loanDeduction = field === 'loanDeduction' ? parseFloat(value || 0) : Number(report.loanDeduction || 0);
      const pfDeduction = field === 'pfDeduction' ? parseFloat(value || 0) : Number(report.pfDeduction || 0);
      const esiDeduction = field === 'esiDeduction' ? parseFloat(value || 0) : Number(report.esiDeduction || 0);
      const canteenDeduction = field === 'canteenDeduction' ? parseFloat(value || 0) : Number(report.canteenDeduction || 0);
      const tds = field === 'tds' ? parseFloat(value || 0) : Number(report.tds || 0);
      
      const totalDeduction = salaryAdvanceDeduction + loanDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
      const netSalary = totalEarningForPF - totalDeduction;

      console.log('[handleUpdate] Earnings & deductions recap:', { total, totalEarningForPF, totalDeduction, netSalary });

      const allRelevantFields = [
        'basicSalary', 'otSalary', 'festivalWageSalary', 'attIncentive', 'prodIncentive',
        'attendanceIncentive', 'productionIncentive', 'foodAllowance', 'houseRent',
        'basicDA', 'hra', 'ta', 'medical',
        'salaryAdvanceDeduction', 'loanDeduction', 'pfDeduction', 'esiDeduction', 'canteenDeduction', 'tds',
        'otHoursWorked', 'festivalHoursWorked', 'actualPresentDays', 'daysToBePresent'
      ];

      if (allRelevantFields.includes(field)) {
        console.log('[handleUpdate] Dispatching calculated totals to Redux');
        dispatch(updateReportItem({ employeeId, field: 'basicDA', value: basicDA }));
        dispatch(updateReportItem({ employeeId, field: 'hra', value: hra }));
        dispatch(updateReportItem({ employeeId, field: 'ta', value: ta }));
        dispatch(updateReportItem({ employeeId, field: 'medical', value: medical }));
        dispatch(updateReportItem({ employeeId, field: 'total', value: total }));
        dispatch(updateReportItem({ employeeId, field: 'totalEarningForPF', value: totalEarningForPF }));
        dispatch(updateReportItem({ employeeId, field: 'totalDeduction', value: totalDeduction }));
        dispatch(updateReportItem({ employeeId, field: 'netSalary', value: netSalary }));
      }
    } else {
      console.warn('[handleUpdate] Failed to find report record matching employeeId:', employeeId);
    }
    
    setModifiedEmployees(prev => new Set(prev).add(employeeId));
  };

  const handleUpdateReport = async () => {
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthInt = parseInt(monthStr);
    
    try {
      // If no UI modifications but user wants to save, save all employees (initial save)
      const employeesToProcess = modifiedEmployees.size > 0 
        ? Array.from(modifiedEmployees)
        : salaryReportList.map((emp: any) => emp.employeeId);

      // Pre-save validation: Check if any employee has festival wages entered but is not eligible
      for (const employeeId of employeesToProcess) {
        const report = salaryReportList.find((r: any) => r.employeeId === employeeId);
        if (report) {
          const festHours = Number(report.festivalHoursWorked || 0);
          const festSalary = Number(report.festivalWageSalary || 0);
          if (festHours > 0 || festSalary > 0) {
            const employeeMaster = employeeMap.get(employeeId) || employeeCodeMap.get(report.employeeCode?.trim().toUpperCase());
            const isFestivalWageApplicable =
              employeeMaster?.festivalWagesApplicable === true ||
              employeeMaster?.festivalWagesApplicable === 1 ||
              employeeMaster?.employmentDetails?.isFestivalWageApplicable === true ||
              employeeMaster?.employmentDetails?.isFestivalWageApplicable === 1;

            if (!isFestivalWageApplicable) {
              toast.error(`The employee ${report.employeeName || ''} is not applicable for festival wages.`);
              return;
            }
          }
        }
      }
      
      // Check if this is an initial save (no modifications) or subsequent save (with modifications)
      const isInitialSave = modifiedEmployees.size === 0;
      
      if (isInitialSave) {
        // Initial save: Use bulk API to create all records at once
        const payloads = employeesToProcess.map(employeeId => {
          const report = salaryReportList.find((r: any) => r.employeeId === employeeId);
          if (!report) return null;
          
          const attIncVal = Number(report.attIncentive !== undefined && report.attIncentive !== null ? report.attIncentive : (report.attendanceIncentive || 0));
          const prodIncVal = Number(report.prodIncentive !== undefined && report.prodIncentive !== null ? report.prodIncentive : (report.productionIncentive || 0));

          // Recalculate totals before sending to ensure consistency
          const total = (
            Number(report.basicSalary || 0) +
            Number(report.otSalary || 0) +
            Number(report.festivalWageSalary || 0) +
            attIncVal +
            prodIncVal +
            Number(report.houseRent || 0)
          );
          
          const totalEarningForPF = (
            Number(report.basicDA || 0) +
            Number(report.hra || 0) +
            Number(report.ta || 0) +
            Number(report.medical || 0)
          ) || total;
          
          const totalDeduction = (
            Number(report.salaryAdvanceDeduction || 0) +
            Number(report.loanDeduction || 0) +
            Number(report.pfDeduction || 0) +
            Number(report.esiDeduction || 0) +
            Number(report.canteenDeduction || 0) +
            Number(report.tds || 0)
          );
          
          const netSalary = totalEarningForPF - totalDeduction;
          
          const employeeMaster = employeeMap.get(report.employeeId) || employeeCodeMap.get(report.employeeCode?.trim().toUpperCase());
          return {
            employeeId: report.employeeId,
            month: monthInt,
            year: year,
            companyId: 1,
            department: report.department || employeeMaster?.employmentDetails?.department || employeeMaster?.department || '',
            designation: report.designation || employeeMaster?.employmentDetails?.designation || employeeMaster?.designation || '',
            salaryType: employeeMaster?.salaryDetails?.salaryType || report.salaryType || 'Monthly',
            grossSalary: employeeMaster?.salaryDetails?.basicSalary ?? report.grossSalary ?? 0,
            daysToBePresent: report.daysToBePresent,
            perDaySalary: report.perDaySalary,
            basicSalary: report.basicSalary,
            otSalary: report.otSalary,
            festivalHoursWorked: report.festivalHoursWorked,
            festivalWageSalary: report.festivalWageSalary,
            attendanceIncentive: report.attendanceIncentive !== undefined && report.attendanceIncentive !== null ? report.attendanceIncentive : attIncVal,
            productionIncentive: report.productionIncentive !== undefined && report.productionIncentive !== null ? report.productionIncentive : prodIncVal,
            attIncentive: attIncVal,
            prodIncentive: prodIncVal,
            foodAllowance: report.foodAllowance,
            salaryAdvanceDeduction: report.salaryAdvanceDeduction,
            loanDeduction: report.loanDeduction,
            pfDeduction: report.pfDeduction,
            esiDeduction: report.esiDeduction,
            canteenDeduction: report.canteenDeduction,
            tds: report.tds,
            total: total,
            totalEarningForPF: totalEarningForPF,
            totalDeduction: totalDeduction,
            netSalary: netSalary,
            actualPresentDays: report.actualPresentDays,
            otHoursWorked: report.otHoursWorked,
            remarks: report.remarks,
            basicDA: report.basicDA,
            hra: report.hra,
            ta: report.ta,
            medical: report.medical,
            houseRent: report.houseRent,
            updatedBy: "User"
          };
        }).filter(Boolean); // Remove null entries

        if (payloads.length > 0) {
          // Debug: Log the payloads being sent
          console.log('Sending payloads to bulk API (Initial Save):', payloads);
          
          // Single bulk API call for initial save
          const result = await dispatch(bulkUpsertSalaryReport(payloads)).unwrap();
          
          // Debug: Log the result received
          console.log('Received result from bulk API:', result);
          
          // Count creates vs updates from the result
          const createCount = result.filter((item: any) => item.id && !item.updatedAt).length;
          const updateCount = result.filter((item: any) => item.updatedAt).length;
          
          let message = "All changes saved successfully";
          if (createCount > 0 && updateCount > 0) {
            message = `${createCount} record(s) created, ${updateCount} record(s) updated successfully`;
          } else if (createCount > 0) {
            message = `${createCount} new record(s) created successfully`;
          } else if (updateCount > 0) {
            message = `${updateCount} record(s) updated successfully`;
          } else {
            message = "All records are already up to date";
          }
          
          toast.success(message);
          setModifiedEmployees(new Set());
          setIsEditMode(false);
          
          // Update local state with the calculated values
          employeesToProcess.forEach(employeeId => {
            const report = salaryReportList.find((r: any) => r.employeeId === employeeId);
            if (report) {
              const basicSalary = Number(report.basicSalary || 0);
              const otSalary = Number(report.otSalary || 0);
              const festivalWageSalary = Number(report.festivalWageSalary || 0);
              const attIncentive = Number(report.attIncentive || 0);
              const prodIncentive = Number(report.prodIncentive || 0);
              const foodAllowance = Number(report.foodAllowance || 0);
              const houseRent = Number(report.houseRent || 0);
              
              const total = basicSalary + otSalary + festivalWageSalary + attIncentive + prodIncentive + houseRent;
              
              const basicDA = Number(report.basicDA || 0);
              const hra = Number(report.hra || 0);
              const ta = Number(report.ta || 0);
              const medical = Number(report.medical || 0);
              
              const totalEarningForPF = basicDA + hra + ta + medical || total;
              
              const salaryAdvanceDeduction = Number(report.salaryAdvanceDeduction || 0);
              const loanDeduction = Number(report.loanDeduction || 0);
              const pfDeduction = Number(report.pfDeduction || 0);
              const esiDeduction = Number(report.esiDeduction || 0);
              const canteenDeduction = Number(report.canteenDeduction || 0);
              const tds = Number(report.tds || 0);
              
              const totalDeduction = salaryAdvanceDeduction + loanDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
              
              const netSalary = totalEarningForPF - totalDeduction;
              
              // Update local state with calculated values
              dispatch(updateReportItem({ employeeId, field: 'total', value: total }));
              dispatch(updateReportItem({ employeeId, field: 'totalEarningForPF', value: totalEarningForPF }));
              dispatch(updateReportItem({ employeeId, field: 'totalDeduction', value: totalDeduction }));
              dispatch(updateReportItem({ employeeId, field: 'netSalary', value: netSalary }));
            }
          });
        } else {
          toast.info("No employee data available to save");
        }
      } else {
        // Subsequent save: Use individual PUT/PATCH calls for only modified employees
        console.log('Using individual API calls for modified employees:', employeesToProcess);
        
        // Check data existence for each modified employee
        const existenceChecks = await Promise.all(
          employeesToProcess.map(async (employeeId) => {
            const exists = await dispatch(checkSalaryReportExists({ 
              employeeId, 
              month: monthInt, 
              year
            })).unwrap();
            return { employeeId, exists };
          })
        );
        
        const updatePromises = existenceChecks.map(({ employeeId, exists }) => {
          const report = salaryReportList.find((r: any) => r.employeeId === employeeId);
          if (!report) return Promise.resolve();
          
          const attIncVal = Number(report.attIncentive !== undefined && report.attIncentive !== null ? report.attIncentive : (report.attendanceIncentive || 0));
          const prodIncVal = Number(report.prodIncentive !== undefined && report.prodIncentive !== null ? report.prodIncentive : (report.productionIncentive || 0));

          // Recalculate totals before sending to ensure consistency
          const total = (
            Number(report.basicSalary || 0) +
            Number(report.otSalary || 0) +
            Number(report.festivalWageSalary || 0) +
            attIncVal +
            prodIncVal +
            Number(report.houseRent || 0)
          );
          
          const totalEarningForPF = (
            Number(report.basicDA || 0) +
            Number(report.hra || 0) +
            Number(report.ta || 0) +
            Number(report.medical || 0)
          ) || total;
          
          const totalDeduction = (
            Number(report.salaryAdvanceDeduction || 0) +
            Number(report.loanDeduction || 0) +
            Number(report.pfDeduction || 0) +
            Number(report.esiDeduction || 0) +
            Number(report.canteenDeduction || 0) +
            Number(report.tds || 0)
          );
          
          const netSalary = totalEarningForPF - totalDeduction;
          
          const employeeMaster = employeeMap.get(report.employeeId) || employeeCodeMap.get(report.employeeCode?.trim().toUpperCase());
          const payload = {
            employeeId: report.employeeId,
            month: monthInt,
            year: year,
            companyId: 1,
            department: report.department || employeeMaster?.employmentDetails?.department || employeeMaster?.department || '',
            designation: report.designation || employeeMaster?.employmentDetails?.designation || employeeMaster?.designation || '',
            salaryType: employeeMaster?.salaryDetails?.salaryType || report.salaryType || 'Monthly',
            grossSalary: employeeMaster?.salaryDetails?.basicSalary ?? report.grossSalary ?? 0,
            daysToBePresent: report.daysToBePresent,
            perDaySalary: report.perDaySalary,
            basicSalary: report.basicSalary,
            otSalary: report.otSalary,
            festivalHoursWorked: report.festivalHoursWorked,
            festivalWageSalary: report.festivalWageSalary,
            attendanceIncentive: report.attendanceIncentive !== undefined && report.attendanceIncentive !== null ? report.attendanceIncentive : attIncVal,
            productionIncentive: report.productionIncentive !== undefined && report.productionIncentive !== null ? report.productionIncentive : prodIncVal,
            attIncentive: attIncVal,
            prodIncentive: prodIncVal,
            foodAllowance: report.foodAllowance,
            salaryAdvanceDeduction: report.salaryAdvanceDeduction,
            loanDeduction: report.loanDeduction,
            pfDeduction: report.pfDeduction,
            esiDeduction: report.esiDeduction,
            canteenDeduction: report.canteenDeduction,
            tds: report.tds,
            total: total,
            totalEarningForPF: totalEarningForPF,
            totalDeduction: totalDeduction,
            netSalary: netSalary,
            actualPresentDays: report.actualPresentDays,
            otHoursWorked: report.otHoursWorked,
            remarks: report.remarks,
            basicDA: report.basicDA,
            hra: report.hra,
            ta: report.ta,
            medical: report.medical,
            houseRent: report.houseRent,
            updatedBy: "User"
          };
          
          // Call PUT for update (records should exist after initial save)
          if (exists) {
            return dispatch(updateSalaryReportRecord(payload)).unwrap();
          } else {
            // Fallback to create if somehow record doesn't exist
            return dispatch(createSalaryReport(payload)).unwrap();
          }
        });

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          
          // Provide feedback based on create vs update operations
          const createCount = existenceChecks.filter(({ exists }) => !exists).length;
          const updateCount = existenceChecks.filter(({ exists }) => exists).length;
          
          let message = "All changes saved successfully";
          if (createCount > 0 && updateCount > 0) {
            message = `${createCount} record(s) created, ${updateCount} record(s) updated successfully`;
          } else if (createCount > 0) {
            message = `${createCount} new record(s) created successfully`;
          } else if (updateCount > 0) {
            message = `${updateCount} record(s) updated successfully`;
          }
          
          toast.success(message);
          setModifiedEmployees(new Set());
          setIsEditMode(false);
          
          // Update local state with calculated values
          employeesToProcess.forEach(employeeId => {
            const report = salaryReportList.find((r: any) => r.employeeId === employeeId);
            if (report) {
              const basicSalary = Number(report.basicSalary || 0);
              const otSalary = Number(report.otSalary || 0);
              const festivalWageSalary = Number(report.festivalWageSalary || 0);
              const attIncentive = Number(report.attIncentive || 0);
              const prodIncentive = Number(report.prodIncentive || 0);
              const foodAllowance = Number(report.foodAllowance || 0);
              const houseRent = Number(report.houseRent || 0);
              
              const total = basicSalary + otSalary + festivalWageSalary + attIncentive + prodIncentive + houseRent;
              
              const basicDA = Number(report.basicDA || 0);
              const hra = Number(report.hra || 0);
              const ta = Number(report.ta || 0);
              const medical = Number(report.medical || 0);
              
              const totalEarningForPF = basicDA + hra + ta + medical || total;
              
              const salaryAdvanceDeduction = Number(report.salaryAdvanceDeduction || 0);
              const pfDeduction = Number(report.pfDeduction || 0);
              const esiDeduction = Number(report.esiDeduction || 0);
              const canteenDeduction = Number(report.canteenDeduction || 0);
              const tds = Number(report.tds || 0);
              
              const totalDeduction = salaryAdvanceDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
              
              const netSalary = totalEarningForPF - totalDeduction;
              
              // Update local state with calculated values
              dispatch(updateReportItem({ employeeId, field: 'total', value: total }));
              dispatch(updateReportItem({ employeeId, field: 'totalEarningForPF', value: totalEarningForPF }));
              dispatch(updateReportItem({ employeeId, field: 'totalDeduction', value: totalDeduction }));
              dispatch(updateReportItem({ employeeId, field: 'netSalary', value: netSalary }));
            }
          });
        } else {
          toast.info("No employee data available to save");
        }
      }
      
    } catch (error) {
      console.error('Failed to update report:', error);
      toast.error("Some updates failed. Please check console.");
      // On error, refetch to restore original state
      dispatch(getSalaryReport(month));
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) {
          toast.error("Failed to read file contents");
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Scan all sheets in the workbook to find the one with the highest header score
        let sheetName = workbook.SheetNames[0];
        let bestHeaderRowIndex = 0;
        let maxSheetScore = 0;
        const targetKeywords = ["emp", "code", "id", "name", "designation", "present", "days", "ot", "hours", "overtime", "canteen", "salary"];

        for (const name of workbook.SheetNames) {
          const s = workbook.Sheets[name];
          if (!s) continue;
          
          const rawRows2D = XLSX.utils.sheet_to_json<any[]>(s, { header: 1 });
          if (rawRows2D.length === 0) continue;
          
          let sheetMaxScore = 0;
          let sheetHeaderRowIdx = 0;
          
          for (let i = 0; i < Math.min(rawRows2D.length, 15); i++) {
            const row = rawRows2D[i];
            if (Array.isArray(row)) {
              // Ensure row has at least 3 non-empty cells to be considered a header row (skips title blocks / spacer rows)
              const nonEmptyCount = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length;
              if (nonEmptyCount < 3) continue;

              let score = 0;
              row.forEach(cell => {
                const cellStr = String(cell || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                targetKeywords.forEach(kw => {
                  if (cellStr.includes(kw)) score++;
                });
              });
              
              if (score > sheetMaxScore) {
                sheetMaxScore = score;
                sheetHeaderRowIdx = i;
              }
            }
          }
          
          if (sheetMaxScore > maxSheetScore) {
            maxSheetScore = sheetMaxScore;
            sheetName = name;
            bestHeaderRowIndex = sheetHeaderRowIdx;
          }
        }

        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          toast.error("Excel sheet is empty");
          return;
        }

        // Parse sheet starting from the detected best header row
        const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { range: bestHeaderRowIndex });
        if (rawRows.length === 0) {
          toast.error("Could not parse any rows after header row detection");
          return;
        }

        // Helper to find column fuzzy match via normalization (stripping spaces, dots, dashes, etc.)
        const getRowValue = (row: any, keysToMatch: string[]) => {
          const rowKeys = Object.keys(row);
          const normalize = (str: string) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          
          const normalizedKeysToMatch = keysToMatch.map(k => normalize(k));

          // 1. Exact normalized match
          for (const rowKey of rowKeys) {
            const normalizedRowKey = normalize(rowKey);
            if (normalizedKeysToMatch.includes(normalizedRowKey)) {
              return row[rowKey];
            }
          }

          // 2. Fuzzy match: Check if Excel column name contains target key (ignoring very short keys like 'ot')
          for (const rowKey of rowKeys) {
            const normalizedRowKey = normalize(rowKey);
            for (const matchKey of normalizedKeysToMatch) {
              if (matchKey.length > 2 && normalizedRowKey.includes(matchKey)) {
                return row[rowKey];
              }
            }
          }
          return undefined;
        };

        const matchesEmployeeCode = (code1: string, code2: string) => {
          if (!code1 || !code2) return false;
          const c1 = String(code1).trim().toUpperCase();
          const c2 = String(code2).trim().toUpperCase();
          if (c1 === c2) return true;
          const n1 = c1.replace(/\D/g, '');
          const n2 = c2.replace(/\D/g, '');
          if (n1 && n2 && n1 === n2) return true;
          if (c1.includes(c2) || c2.includes(c1)) return true;
          return false;
        };

        let successCount = 0;
        const newModifiedEmployees = new Set(modifiedEmployees);

        // Helper to parse Excel numeric values safely
        const parseExcelNumeric = (val: any) => {
          if (val === undefined || val === null || String(val).trim() === '') {
            return null;
          }
          const num = parseFloat(String(val));
          return isNaN(num) ? null : num;
        };

        rawRows.forEach((row: any) => {
          const excelCodeRaw = getRowValue(row, ["Employee Code", "EMP.No", "EMP.NO", "Emp Code", "Emp ID", "Code"]);
          if (excelCodeRaw === undefined || excelCodeRaw === null) return;
          const excelCode = String(excelCodeRaw).trim().toUpperCase();
          if (!excelCode) return;

          // Find corresponding employee in the current month's report list
          const reportItem = salaryReportList.find((r: any) => matchesEmployeeCode(excelCode, r.employeeCode));
          if (!reportItem) return;

          const employeeMaster = employeeCodeMap.get(reportItem.employeeCode?.trim().toUpperCase());
          const overtimeAllowed = employeeAllowsOvertime(employeeMaster);

          const totalPresentVal = getRowValue(row, ["Total Present Days", "Actual Present Days", "Present Days", "Total Present", "Present", "Days Present", "Days"]);
          const totalOtVal = getRowValue(row, ["Total OT Hours", "OT Hours Worked", "OT Hours", "OT", "Overtime Hours", "Overtime", "Total OT"]);
          const festivalHoursVal = getRowValue(row, ["Festival Wages Working Hours", "Festival Working Hours", "Festival Hours Worked", "Festival Hours", "Festival Wage Working Hours", "Festival Wage Hours", "Fest. Hours", "Fest Hours", "Festival OT"]);
          const festivalWageVal = getRowValue(row, ["Festival Wages", "Festival Wage", "Festival Wage Amount", "Festival Wages Amount", "Fest. Wages", "Fest Wages"]);

          const excelPresentDays = parseExcelNumeric(totalPresentVal);
          const actualPresentDays = excelPresentDays !== null 
            ? excelPresentDays 
            : (reportItem.actualPresentDays !== undefined && reportItem.actualPresentDays !== null ? Number(reportItem.actualPresentDays) : 0);

          const excelOtHours = parseExcelNumeric(totalOtVal);
          // If totalOtVal is undefined (the column was not in the Excel sheet at all), keep the existing value.
          // If it is defined but empty/null/invalid, excelOtHours will be null, which we save.
          const otHoursWorked = overtimeAllowed
            ? (totalOtVal !== undefined
                ? excelOtHours
                : (reportItem.otHoursWorked !== undefined && reportItem.otHoursWorked !== null ? Number(reportItem.otHoursWorked) : null))
            : 0;

          const excelFestivalHours = parseExcelNumeric(festivalHoursVal);
          let festivalHoursWorked = festivalHoursVal !== undefined
            ? (excelFestivalHours !== null ? excelFestivalHours : 0)
            : (reportItem.festivalHoursWorked !== undefined && reportItem.festivalHoursWorked !== null ? Number(reportItem.festivalHoursWorked) : 0);

          // Calculate basic salary and OT salary
          const grossSalary = Number(employeeMaster?.salaryDetails?.basicSalary ?? reportItem.grossSalary ?? 0);
          const daysToBePresent = Number(reportItem.daysToBePresent || 26);
          const salaryType = employeeMaster?.salaryDetails?.salaryType || reportItem.salaryType || 'Monthly';
          const workingHoursPerDay = Number(reportItem.workingHoursPerDay || 8);

          let perDaySalary = 0;
          let basicSalary = 0;
          let otSalary = 0;

          let basicDays = actualPresentDays;
          let extraOtHours = 0;
          let displayedPresentDays = actualPresentDays;
          if (daysToBePresent === 28 && actualPresentDays > 28) {
            basicDays = 28;
            displayedPresentDays = 28;
            if (overtimeAllowed) {
              extraOtHours = (actualPresentDays - 28) * workingHoursPerDay;
            }
          }
          const effectiveOtHours = overtimeAllowed
            ? (otHoursWorked !== null ? (otHoursWorked + extraOtHours) : (extraOtHours > 0 ? extraOtHours : null))
            : 0;

          if (salaryType === 'Daily') {
            perDaySalary = grossSalary;
            if (!perDaySalary && employeeMaster?.salaryDetails?.basicSalary) {
              perDaySalary = Number(employeeMaster.salaryDetails.basicSalary);
            }
            basicSalary = perDaySalary * basicDays;
            const hourlyRate = workingHoursPerDay > 0 ? (perDaySalary / workingHoursPerDay) : 0;
            otSalary = effectiveOtHours !== null ? (hourlyRate * effectiveOtHours) : 0;
          } else {
            // Monthly
            if (grossSalary) {
              perDaySalary = grossSalary / daysToBePresent;
            } else if (employeeMaster?.salaryDetails?.basicSalary) {
              perDaySalary = Number(employeeMaster.salaryDetails.basicSalary) / daysToBePresent;
            }
            basicSalary = perDaySalary * basicDays;
            const monthlyPerHourSalary = perDaySalary / workingHoursPerDay;
            otSalary = effectiveOtHours !== null ? (monthlyPerHourSalary * effectiveOtHours) : 0;
          }

          // Round values
          basicSalary = Math.round(basicSalary);
          otSalary = Math.round(otSalary);
          perDaySalary = Math.round(perDaySalary);

          // Calculate Festival Wage Salary with Eligibility check
          const isFestivalWageApplicable =
            employeeMaster?.festivalWagesApplicable === true ||
            employeeMaster?.festivalWagesApplicable === 1 ||
            employeeMaster?.employmentDetails?.isFestivalWageApplicable === true ||
            employeeMaster?.employmentDetails?.isFestivalWageApplicable === 1;

          const excelFestivalWage = parseExcelNumeric(festivalWageVal);
          let festivalWageSalary = 0;

          if (!isFestivalWageApplicable) {
            festivalHoursWorked = 0;
            festivalWageSalary = 0;
          } else {
            if (festivalWageVal !== undefined && excelFestivalWage !== null) {
              festivalWageSalary = Math.round(excelFestivalWage);
            } else if (festivalHoursWorked > 0) {
              const hourlyRate = workingHoursPerDay > 0 ? (perDaySalary / workingHoursPerDay) : 0;
              festivalWageSalary = Math.round(hourlyRate * festivalHoursWorked);
            } else {
              festivalWageSalary = Number(reportItem.festivalWageSalary || 0);
            }
          }

          // Incentives and Food allowance
          const attendanceIncentiveApplicable = employeeMaster?.attendanceIncentiveApplicable === true || employeeMaster?.attendanceIncentiveApplicable === 1;
          const productionIncentiveApplicable = employeeMaster?.productionIncentiveApplicable === true || employeeMaster?.productionIncentiveApplicable === 1;
          const foodAllowanceApplicable = employeeMaster?.foodAllowanceApplicable === true || employeeMaster?.foodAllowanceApplicable === 1;

          // Parse incentives from Excel
          const excelAttIncVal = getRowValue(row, ["Attendance Incentive", "Att. Incentive", "Att Incentive", "Attendance Inc", "Attendance Allowance"]);
          const excelProdIncVal = getRowValue(row, ["Production Incentive", "Prod. Incentive", "Prod Incentive", "Production Inc", "Production Allowance", "Total Production Incentive"]);

          const excelAttInc = parseExcelNumeric(excelAttIncVal);
          const excelProdInc = parseExcelNumeric(excelProdIncVal);

          let attendanceIncentive = 0;
          if (excelAttIncVal !== undefined) {
            attendanceIncentive = excelAttInc !== null ? excelAttInc : 0;
          } else if (attendanceIncentiveApplicable && employeeMaster?.attendanceIncentive) {
            attendanceIncentive = Number(employeeMaster.attendanceIncentive);
          }

          let productionIncentive = 0;
          if (excelProdIncVal !== undefined) {
            productionIncentive = excelProdInc !== null ? excelProdInc : 0;
          } else if (productionIncentiveApplicable && employeeMaster?.productionIncentive) {
            productionIncentive = Number(employeeMaster.productionIncentive);
          }

          let attIncentive = 0;
          let prodIncentive = 0;
          if (excelAttIncVal !== undefined) {
            attIncentive = excelAttInc !== null ? excelAttInc : 0;
          } else {
            const empAttInc = (attIncentiveList || []).find((item: any) => 
              (item.employeeId !== undefined && item.employeeId !== null && String(item.employeeId) === String(reportItem.employeeId)) ||
              (item.employeeCode && reportItem.employeeCode && String(item.employeeCode).trim().toUpperCase() === String(reportItem.employeeCode).trim().toUpperCase())
            );
            if (empAttInc) {
              if (empAttInc.dailyRate !== undefined && empAttInc.dailyRate !== null && Number(empAttInc.dailyRate) > 0) {
                attIncentive = Math.round(Number(empAttInc.dailyRate) * actualPresentDays);
              } else {
                attIncentive = Math.round(Number(empAttInc.amount || 0));
              }
            } else if (actualPresentDays < daysToBePresent) {
              attIncentive = 0;
            } else {
              if (attendanceIncentiveApplicable && employeeMaster?.attendanceIncentive) {
                attIncentive = Number(employeeMaster.attendanceIncentive) * actualPresentDays;
              }
            }
          }

          if (excelProdIncVal !== undefined) {
            prodIncentive = excelProdInc !== null ? excelProdInc : 0;
          } else {
            const empProdInc = (prodIncentiveList || []).find((item: any) => 
              (item.employeeId !== undefined && item.employeeId !== null && String(item.employeeId) === String(reportItem.employeeId)) ||
              (item.employeeCode && reportItem.employeeCode && String(item.employeeCode).trim().toUpperCase() === String(reportItem.employeeCode).trim().toUpperCase())
            );
            if (empProdInc) {
              if (empProdInc.dailyRate !== undefined && empProdInc.dailyRate !== null && Number(empProdInc.dailyRate) > 0) {
                prodIncentive = Math.round(Number(empProdInc.dailyRate) * actualPresentDays);
              } else {
                prodIncentive = Math.round(Number(empProdInc.amount || 0));
              }
            } else if (actualPresentDays < daysToBePresent) {
              prodIncentive = 0;
            } else {
              if (productionIncentiveApplicable && employeeMaster?.productionIncentive) {
                prodIncentive = Number(employeeMaster.productionIncentive) * actualPresentDays;
              }
            }
          }

          attIncentive = Math.round(attIncentive);
          prodIncentive = Math.round(prodIncentive);

          const excelFoodAllowanceVal = getRowValue(row, ["Food Allowance", "Food", "Food Allowance Amount", "Food Allowance Amt", "Foodallowance"]);
          let foodAllowance = 0;
          if (excelFoodAllowanceVal !== undefined) {
            const excelFoodAllowance = parseExcelNumeric(excelFoodAllowanceVal);
            foodAllowance = excelFoodAllowance !== null ? Math.round(excelFoodAllowance) : 0;
          } else if (foodAllowanceApplicable && actualPresentDays > 0) {
            foodAllowance = actualPresentDays * 50;
          }

          const excelHouseRentVal = getRowValue(row, ["House Rent", "HouseRent", "House Rent Amt"]);
          let houseRent = 0;
          if (excelHouseRentVal !== undefined) {
            const excelHouseRent = parseExcelNumeric(excelHouseRentVal);
            houseRent = excelHouseRent !== null ? Math.round(excelHouseRent) : 0;
          } else {
            houseRent = Number(reportItem.houseRent || employeeMaster?.employmentDetails?.houseRent || 0);
          }

          // TOTAL = basicSalary + otSalary + festivalWageSalary + attIncentive + prodIncentive + houseRent (FoodAllowance is display only)
          const total = basicSalary + otSalary + festivalWageSalary + attIncentive + prodIncentive + houseRent;

          // Basic+DA & HRA & TA & Medical
          // Get values from Excel if present, else use default calculation
          const excelBasicDAVal = getRowValue(row, ["Basic+DA", "Basic + DA", "Basic DA", "Basicda"]);
          const excelHRAVal = getRowValue(row, ["HRA", "Hra"]);
          const excelTAVal = getRowValue(row, ["TA", "Ta"]);
          const excelMedicalVal = getRowValue(row, ["Medical", "Medical Allowance", "Medicalallowance"]);
          const excelPFVal = getRowValue(row, ["PF - 12%", "PF 12%", "PF", "PF Deduction", "Pf"]);
          const excelESIVal = getRowValue(row, ["ESI - 0.75%", "ESI 0.75%", "ESI", "ESI Deduction", "Esi"]);

          const excelBasicDA = parseExcelNumeric(excelBasicDAVal);
          const excelHRA = parseExcelNumeric(excelHRAVal);
          const excelTA = parseExcelNumeric(excelTAVal);
          const excelMedical = parseExcelNumeric(excelMedicalVal);
          const excelPF = parseExcelNumeric(excelPFVal);
          const excelESI = parseExcelNumeric(excelESIVal);

          const pfEarningComponents = calculatePfEarningComponents(total, employeeMaster);
          const basicDA = excelBasicDA !== null
            ? Math.round(excelBasicDA)
            : pfEarningComponents.basicDA;
          const hra = excelHRA !== null
            ? Math.round(excelHRA)
            : pfEarningComponents.hra;
          const ta = excelTA !== null
            ? Math.round(excelTA)
            : pfEarningComponents.ta;
          const medical = excelMedical !== null
            ? Math.round(excelMedical)
            : pfEarningComponents.medical;

          const totalEarningsForPF = (basicDA + hra + ta + medical) || pfEarningComponents.totalEarningForPF;
          const totalEarning = totalEarningsForPF;

          // Deductions
          const excelSalAdvVal = getRowValue(row, ["Salary Advance", "Salary Advance Deduction", "Advance", "Advance Deduction", "Sal Advance", "Sal. Advance", "Salary Advance / Loan", "Adv"]);
          const excelSalAdv = parseExcelNumeric(excelSalAdvVal);
          let salaryAdvanceDeduction = Number(reportItem.salaryAdvanceDeduction || 0);
          if (excelSalAdvVal !== undefined) {
            salaryAdvanceDeduction = excelSalAdv !== null ? Math.round(excelSalAdv) : 0;
          }

          const excelLoanVal = getRowValue(row, ["Loan", "Loan Deduction", "Loan Amt", "Loans"]);
          const excelLoan = parseExcelNumeric(excelLoanVal);
          let loanDeduction = Number(reportItem.loanDeduction || 0);
          if (excelLoanVal !== undefined) {
            loanDeduction = excelLoan !== null ? Math.round(excelLoan) : 0;
          }

          const pfApplicable = employeeMaster?.pfApplicable === true || employeeMaster?.pfApplicable === 1;
          let pfDeduction = 0;
          if (excelPF !== null) {
            pfDeduction = Math.round(excelPF);
          } else if (pfApplicable && basicDA > 0) {
            const pfPercent = Number(employeeMaster?.pfPercent || 0);
            if (basicDA < 15000) {
              pfDeduction = Math.round(basicDA * pfPercent);
            } else {
              pfDeduction = Math.round(15000 * pfPercent);
            }
          }

          const esiApplicable = employeeMaster?.esiApplicable === true || employeeMaster?.esiApplicable === 1;
          let esiDeduction = 0;
          if (excelESI !== null) {
            esiDeduction = Math.round(excelESI);
          } else if (esiApplicable && salaryType && totalEarning > 0) {
            if (salaryType === 'Monthly') {
              const basic = Number(employeeMaster?.salaryDetails?.basicSalary || 0);
              if (basic < 21000) {
                esiDeduction = Math.round(totalEarning * 0.0075);
              }
            } else if (salaryType === 'Daily') {
              const basic = Number(employeeMaster?.salaryDetails?.basicSalary || 0);
              if (basic * 26 < 21000) {
                esiDeduction = Math.round(totalEarning * 0.0075);
              }
            }
          }

          const isCanteenFlag = Number(employeeMaster?.salaryDetails?.isCanteen || 0);
          const excelCanteenVal = getRowValue(row, ["Canteen", "Canteen Deduction", "Canteen Charge", "Canteen Amt", "Canteen Deductions"]);
          let canteenDeduction = 0;
          if (excelCanteenVal !== undefined) {
            const excelCanteen = parseExcelNumeric(excelCanteenVal);
            canteenDeduction = excelCanteen !== null ? excelCanteen : 0;
          } else {
            const empCanteen = (canteenList || []).find((item: any) => 
              (item.employeeId !== undefined && item.employeeId !== null && String(item.employeeId) === String(reportItem.employeeId)) ||
              (item.employeeCode && reportItem.employeeCode && String(item.employeeCode).trim().toUpperCase() === String(reportItem.employeeCode).trim().toUpperCase())
            );
            if (empCanteen) {
              if (empCanteen.canteenAmount !== undefined && empCanteen.canteenAmount !== null && Number(empCanteen.canteenAmount) > 0) {
                canteenDeduction = Math.round(Number(empCanteen.canteenAmount));
              } else if (empCanteen.dailyDeductionRate !== undefined && empCanteen.dailyDeductionRate !== null && Number(empCanteen.dailyDeductionRate) > 0) {
                canteenDeduction = Math.round(Number(empCanteen.dailyDeductionRate) * actualPresentDays);
              }
            } else if (isCanteenFlag === 0 && foodAllowance > 0 && foodAllowanceApplicable) {
              canteenDeduction = foodAllowance;
            }
          }

          const tds = Number(reportItem.tds || 0);
          const totalDeduction = salaryAdvanceDeduction + loanDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
          const netSalary = totalEarning - totalDeduction;

          const employeeId = reportItem.employeeId;

          // Dispatch all updated fields to local Redux state
          dispatch(updateReportItem({ employeeId, field: 'actualPresentDays', value: displayedPresentDays }));
          dispatch(updateReportItem({ employeeId, field: 'otHoursWorked', value: effectiveOtHours }));
          dispatch(updateReportItem({ employeeId, field: 'festivalHoursWorked', value: festivalHoursWorked }));
          dispatch(updateReportItem({ employeeId, field: 'grossSalary', value: grossSalary }));
          dispatch(updateReportItem({ employeeId, field: 'salaryType', value: salaryType }));
          dispatch(updateReportItem({ employeeId, field: 'perDaySalary', value: perDaySalary }));
          dispatch(updateReportItem({ employeeId, field: 'basicSalary', value: basicSalary }));
          dispatch(updateReportItem({ employeeId, field: 'otSalary', value: otSalary }));
          dispatch(updateReportItem({ employeeId, field: 'festivalWageSalary', value: festivalWageSalary }));
          dispatch(updateReportItem({ employeeId, field: 'attendanceIncentive', value: attendanceIncentive }));
          dispatch(updateReportItem({ employeeId, field: 'productionIncentive', value: productionIncentive }));
          dispatch(updateReportItem({ employeeId, field: 'foodAllowance', value: foodAllowance }));
          dispatch(updateReportItem({ employeeId, field: 'houseRent', value: houseRent }));
          dispatch(updateReportItem({ employeeId, field: 'attIncentive', value: attIncentive }));
          dispatch(updateReportItem({ employeeId, field: 'prodIncentive', value: prodIncentive }));
          dispatch(updateReportItem({ employeeId, field: 'total', value: total }));
          dispatch(updateReportItem({ employeeId, field: 'basicDA', value: basicDA }));
          dispatch(updateReportItem({ employeeId, field: 'hra', value: hra }));
          dispatch(updateReportItem({ employeeId, field: 'ta', value: ta }));
          dispatch(updateReportItem({ employeeId, field: 'medical', value: medical }));
          dispatch(updateReportItem({ employeeId, field: 'totalEarningForPF', value: totalEarning }));
          dispatch(updateReportItem({ employeeId, field: 'pfDeduction', value: pfDeduction }));
          dispatch(updateReportItem({ employeeId, field: 'esiDeduction', value: esiDeduction }));
          dispatch(updateReportItem({ employeeId, field: 'salaryAdvanceDeduction', value: salaryAdvanceDeduction }));
          dispatch(updateReportItem({ employeeId, field: 'loanDeduction', value: loanDeduction }));
          dispatch(updateReportItem({ employeeId, field: 'canteenDeduction', value: canteenDeduction }));
          dispatch(updateReportItem({ employeeId, field: 'totalDeduction', value: totalDeduction }));
          dispatch(updateReportItem({ employeeId, field: 'netSalary', value: netSalary }));

          newModifiedEmployees.add(employeeId);
          successCount++;
        });

        if (successCount > 0) {
          setModifiedEmployees(newModifiedEmployees);
          setIsEditMode(true); // Enable edit mode to visualize changes
          
          // Capture a sample of updated values to display in the success toast
          const samples: string[] = [];
          let sampleIdx = 0;
          rawRows.forEach((row: any) => {
            if (sampleIdx >= 3) return;
            const excelCodeRaw = getRowValue(row, ["Employee Code", "EMP.No", "EMP.NO", "Emp Code", "Emp ID", "Code"]);
            if (excelCodeRaw) {
              const code = String(excelCodeRaw).trim();
              const p = getRowValue(row, ["Total Present Days", "Actual Present Days", "Present Days", "Total Present", "Present", "Days Present", "Days"]);
              const ot = getRowValue(row, ["Total OT Hours", "OT Hours Worked", "OT Hours", "OT", "Overtime Hours", "Total OT"]);
              const fest = getRowValue(row, ["Festival Wages Working Hours", "Festival Working Hours", "Festival Hours Worked", "Festival Hours", "Fest. Hours", "Fest Hours"]);
              const cant = getRowValue(row, ["Canteen", "Canteen Deduction", "Canteen Charge", "Canteen Amt", "Canteen Deductions"]);
              const att = getRowValue(row, ["Attendance Incentive", "Att. Incentive", "Att Incentive", "Attendance Inc", "Attendance Allowance"]);
              const prod = getRowValue(row, ["Production Incentive", "Prod. Incentive", "Prod Incentive", "Production Inc", "Production Allowance", "Total Production Incentive"]);
              const adv = getRowValue(row, ["Salary Advance", "Salary Advance Deduction", "Advance", "Advance Deduction", "Sal Advance", "Sal. Advance"]);
              const loan = getRowValue(row, ["Loan", "Loan Deduction", "Loan Amt", "Loans"]);
              
              samples.push(`${code}: Pres=${p !== undefined ? p : 'N/A'}, OT=${ot !== undefined ? ot : 'N/A'}, FestHours=${fest !== undefined ? fest : 'N/A'}, Cant=${cant !== undefined ? cant : 'N/A'}, AttInc=${att !== undefined ? att : 'N/A'}, ProdInc=${prod !== undefined ? prod : 'N/A'}, Adv=${adv !== undefined ? adv : 'N/A'}, Loan=${loan !== undefined ? loan : 'N/A'}`);
              sampleIdx++;
            }
          });

          toast.success(`Successfully parsed spreadsheet and updated ${successCount} matched employee records. Samples: [${samples.join(' | ')}]. Click 'Save/Update' to save.`, { autoClose: 12000 });
        } else {
          // Log keys and a sample row to help the user diagnose header issues
          const firstRow = rawRows[0];
          const detectedHeaders = firstRow ? Object.keys(firstRow).join(", ") : "None";
          const sampleCodeVal = firstRow ? String(getRowValue(firstRow, ["Employee Code", "EMP.No", "EMP.NO", "Emp Code", "Emp ID", "Code"]) || "Not Found") : "N/A";
          
          // Generate detailed diagnostic report across all sheets
          const sheetsDiagnostics = workbook.SheetNames.map(name => {
            const s = workbook.Sheets[name];
            const rows2D = XLSX.utils.sheet_to_json<any[]>(s, { header: 1 });
            const sampleRows = rows2D.slice(0, 10).map((r, idx) => 
              `Row ${idx}: [${(Array.isArray(r) ? r : []).map(c => c !== null && c !== undefined ? String(c) : '').join(', ')}]`
            ).join('\n');
            return `Sheet Name: "${name}" (${rows2D.length} total rows scanned)\n${sampleRows}`;
          }).join('\n\n');

          alert(`EXCEL SHEET DIAGNOSTIC REPORT\n\nNo matching employee codes were found. Here is the structure of your Excel file to help diagnose headers:\n\n${sheetsDiagnostics}\n\nDetected columns from selected sheet: [${detectedHeaders}]\nSample employee code: "${sampleCodeVal}"`);
          
          toast.warning(`No matching employee codes found. Check the diagnostic report popup.`);
        }
      } catch (e: any) {
        console.error("Error parsing Excel:", e);
        toast.error("Failed to parse Excel file: " + e.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Columns with grouping for multi-level header
  const columns = useMemo(() => [
    {
      Header: 'Basic Information',
      headerClassName: 'border-b-4 border-b-slate-300',
      columns: [
        { 
          Header: 'S.No', 
          accessor: (row: any, i: number) => i + 1, 
          id: 'sno',
          Cell: ({ row }: any) => row.index + 1,
          width: 50
        },
        { Header: 'Name', accessor: 'employeeName', width: 150 },
        { 
          Header: 'Department', 
          accessor: 'department', 
          width: 150,
          Cell: ({ value, row }: any) => {
            const emp = employeeMap.get(row.original.employeeId) || employeeCodeMap.get(row.original.employeeCode?.trim().toUpperCase());
            const displayVal = value || emp?.employmentDetails?.department || emp?.department || '';
            return (
              <DropdownEditableCell 
                value={displayVal} 
                employeeId={row.original.employeeId} 
                companyId={row.original.companyId} 
                field="department" 
                options={departmentOptions}
                onUpdate={handleUpdate} 
                disabled={!isEditMode}
              />
            );
          }
        },
        { 
          Header: 'Designation', 
          accessor: 'designation', 
          width: 150,
          Cell: ({ value, row }: any) => {
            const emp = employeeMap.get(row.original.employeeId) || employeeCodeMap.get(row.original.employeeCode?.trim().toUpperCase());
            const displayVal = value || emp?.employmentDetails?.designation || emp?.designation || '';
            return (
              <DropdownEditableCell 
                value={displayVal} 
                employeeId={row.original.employeeId} 
                companyId={row.original.companyId} 
                field="designation" 
                options={designationOptions}
                onUpdate={handleUpdate} 
                disabled={!isEditMode}
              />
            );
          }
        },
        { Header: 'EMP.No', accessor: 'employeeCode', width: 100 },
        { Header: filterType === 'month' ? 'Month' : 'Date', accessor: 'month' },
        { Header: 'Salary Type', accessor: 'salaryType', width: 100 },
        { 
          Header: 'Gross Salary', 
          accessor: 'grossSalary',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { Header: 'Days to be Present', accessor: 'daysToBePresent', width: 100,
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="daysToBePresent" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="days"
            />
          ),
        },
        { 
          Header: 'Per day salary', 
          accessor: 'perDaySalary',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { Header: 'Working hours / Day', accessor: 'workingHoursPerDay', width: 100 },
        { Header: 'Actual Present days', accessor: 'actualPresentDays', width: 100 },
        { Header: 'Additional weekly-off Days for weavers', accessor: 'additionalWeekOffDays',
          Cell: ({ value }: any) => value !== undefined && value !== null ? (value % 1 === 0 ? value.toString() : value.toFixed(1)) : '0',
          width: 150 },
        { Header: 'OT Hours Worked', accessor: 'otHoursWorked', width: 100,
          Cell: ({ value, row }: any) => {
            const employee = employeeMap.get(row.original.employeeId) ||
              employeeCodeMap.get(String(row.original.employeeCode || '').trim().toUpperCase());
            return (
              <EditableCell 
                value={value} 
                employeeId={row.original.employeeId} 
                companyId={row.original.companyId} 
                field="otHoursWorked" 
                onUpdate={handleUpdate} 
                disabled={!isEditMode || !employeeAllowsOvertime(employee)}
              />
            );
          },
        },
        { Header: 'Festival Wages Working Hours', accessor: 'festivalHoursWorked', width: 140,
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="festivalHoursWorked" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
            />
          ),
        },
        { 
          Header: 'Attendance Incentive', 
          accessor: 'attendanceIncentive', 
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="attendanceIncentive" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 120 
        },
        { 
          Header: 'Production Incentive', 
          accessor: 'productionIncentive', 
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="productionIncentive" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
           width: 120
        },
        { 
          Header: 'Food Allowance', 
          accessor: 'foodAllowance',
          id: 'foodAllowanceInfo',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="foodAllowance" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 100
        },
      ]
    },
    // Grouped columns under "Actual Earnings"
    {
      Header: 'Actual Earnings',
      headerClassName: 'border-l-4 border-l-slate-300 border-b-4 border-b-slate-300',
      columns: [
        { 
          Header: 'Basic Salary', 
          accessor: 'basicSalary',
          cellClassName: 'border-l-4 border-l-slate-300',
          headerClassName: 'border-l-4 border-l-slate-300',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="basicSalary" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 100
        },
        { 
          Header: 'OT', 
          accessor: 'otSalary',
          Cell: ({ value, row }: any) => {
            const employee = employeeMap.get(row.original.employeeId) ||
              employeeCodeMap.get(String(row.original.employeeCode || '').trim().toUpperCase());
            return (
              <EditableCell 
                value={value} 
                employeeId={row.original.employeeId} 
                companyId={row.original.companyId} 
                field="otSalary" 
                onUpdate={handleUpdate} 
                disabled={!isEditMode || !employeeAllowsOvertime(employee)}
                formatType="amount"
              />
            );
          },
          width: 80
        },
        { 
          Header: 'Festival Wages', 
          accessor: 'festivalWageSalary',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="festivalWageSalary" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 110
        },
        { 
          Header: 'Att. Incentive', 
          accessor: 'attIncentive',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="attIncentive" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 100
        },
        { 
          Header: 'Prod. Incentive', 
          accessor: 'prodIncentive',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="prodIncentive" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 100
        },
        { 
          Header: 'FoodAllowance', 
          accessor: 'foodAllowance',
          id: 'foodAllowanceEarning',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="foodAllowance" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 80
        },
        { 
          Header: 'House Rent', 
          accessor: 'houseRent',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="houseRent" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 100
        },
        { 
          Header: 'TOTAL', 
          accessor: 'total',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        }
      ]
    },
    // Grouped columns under "Earnings for PF workings"
    {
      Header: 'Earnings for PF workings',
      headerClassName: 'border-l-4 border-l-slate-300 border-b-4 border-b-slate-300',
      columns: [
        { 
          Header: 'Basic+DA', 
          accessor: 'basicDA',
          cellClassName: 'border-l-4 border-l-slate-300',
          headerClassName: 'border-l-4 border-l-slate-300',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="basicDA" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 100
        },
        { 
          Header: 'HRA', 
          accessor: 'hra',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="hra" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 80
        },
        { 
          Header: 'TA', 
          accessor: 'ta',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="ta" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 80
        },
        { 
          Header: 'Medical', 
          accessor: 'medical',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="medical" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 80
        },
        { 
          Header: 'Total Earning', 
          accessor: 'totalEarningForPF',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        }
      ]
    },
    // Deductions group
    {
      Header: 'Deductions',
      headerClassName: 'border-l-4 border-l-slate-300 border-b-4 border-b-slate-300',
      columns: [
        { 
          Header: 'Salary Advance / Loan', 
          accessor: 'salaryAdvanceDeduction',
          cellClassName: 'border-l-4 border-l-slate-300',
          headerClassName: 'border-l-4 border-l-slate-300',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="salaryAdvanceDeduction" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 140
        },
        { 
          Header: 'PF - 12%', 
          accessor: 'pfDeduction',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="pfDeduction" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 80
        },
        { 
          Header: 'ESI - 0.75%', 
          accessor: 'esiDeduction',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="esiDeduction" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 100
        },
        { 
          Header: 'Canteen', 
          accessor: 'canteenDeduction',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="canteenDeduction" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 80
        },
        { 
          Header: 'TDS', 
          accessor: 'tds',
          Cell: ({ value, row }: any) => (
            <EditableCell 
              value={value} 
              employeeId={row.original.employeeId} 
              companyId={row.original.companyId} 
              field="tds" 
              onUpdate={handleUpdate} 
              disabled={!isEditMode}
              formatType="amount"
            />
          ),
          width: 80
        },
        { 
          Header: 'Total Deduction', 
          accessor: 'totalDeduction',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { 
          Header: 'Net Salary', 
          accessor: 'netSalary',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100,
          className: 'font-bold text-green-600'
        },
      ]
    },
    { Header: 'Category', accessor: 'category', width: 100, headerClassName: 'border-l-4 border-l-slate-300', cellClassName: 'border-l-4 border-l-slate-300' },
    { 
      Header: 'Sign / Remarks', 
      accessor: 'remarks', 
      Cell: ({ value, row }: any) => (
        <EditableCell 
          value={value} 
          employeeId={row.original.employeeId} 
          companyId={row.original.companyId} 
          field="remarks" 
          onUpdate={handleUpdate} 
          type="text"
          disabled={!isEditMode}
        />
      ),
      width: 150
    },
    // {
    //   Header: 'Actions',
    //   id: 'actions',
    //   Cell: ({ row }: any) => (
    //     <div className="flex justify-center">
    //       <button
    //         onClick={() => handleUpdate(row.original.employeeId, row.original.companyId, 'remarks', row.original.remarks)}
    //         className="p-1 hover:bg-blue-100 rounded text-blue-600"
    //         title="Save Row"
    //       >
    //         <Save className="w-4 h-4" />
    //       </button>
    //     </div>
    //   ),
    //   width: 70
    // }
  ], [month, fromDate, toDate, singleDate, filterType, handleUpdate, isEditMode, departmentOptions, designationOptions, employeeMap, employeeCodeMap]);

const filteredData = useMemo(() => {
  let list: any[] = [];
  if (filterType === 'month') {
    if (!month) return [];
    list = (salaryReportList || []).filter((item: any) => item.month === month);
  } else if (filterType === 'single') {
    if (!singleDate) return [];
    list = (salaryReportList || []).filter((item: any) => !item.month || item.month === singleDate);
  } else {
    const effFrom = fromDate || toDate;
    const effTo = toDate || fromDate;
    if (!effFrom || !effTo) return [];
    list = salaryReportList || [];
  }

  // Filter out relieved employees (isRelieved === 1)
  return list.filter((item: any) => {
    const emp = employeeMap.get(item.employeeId) || employeeCodeMap.get(item.employeeCode?.trim().toUpperCase());
    const relievedVal = item.isRelieved !== undefined && item.isRelieved !== null 
      ? item.isRelieved 
      : (emp ? emp.isRelieved : 0);
    return Number(relievedVal) !== 1 && relievedVal !== true;
  });
}, [salaryReportList, month, fromDate, toDate, singleDate, filterType, employeeMap, employeeCodeMap]);

// Apply column filters to the data
const dataWithColumnFilters = useMemo(() => {
  return filteredData.map((item: any) => {
    const filteredItem = { 
      ...item,
      salaryAdvanceDeduction: Number(item.salaryAdvanceDeduction || 0) + Number(item.loanDeduction || 0)
    };
    
    if (tableColumnFilters && Object.keys(tableColumnFilters).length > 0) {
      // Apply filters to specific columns
      Object.keys(tableColumnFilters).forEach((columnKey) => {
        if (!tableColumnFilters[columnKey]) {
          // Hide column by setting value to null or empty
          filteredItem[columnKey] = null;
        }
      });
    }
    
    return filteredItem;
  });
}, [filteredData, tableColumnFilters]);

// Sort data to ensure latest entries appear first (by employee ID descending)
const sortedData = useMemo(() => {
  return [...dataWithColumnFilters].sort((a, b) => (b.employeeId || 0) - (a.employeeId || 0));
}, [dataWithColumnFilters]);

// Calculate grand totals for specified columns
const grandTotals = useMemo(() => {
  const totals: Record<string, number> = {};
  const columnsToSum = [
    'attendanceIncentive', 
    'productionIncentive', 
    'foodAllowance',
    'houseRent',
    'basicSalary',
    'otSalary',
    'festivalWageSalary',
    'total',
    'basicDA',
    'hra',
    'ta',
    'medical',
    'totalEarningForPF',
    'salaryAdvanceDeduction',
    'pfDeduction',
    'esiDeduction',
    'canteenDeduction',
    'tds',
    'totalDeduction',
    'netSalary'
  ];
  
  // Calculate totals from current data (including unsaved changes)
  const currentData = sortedData.map(item => {
    const report = salaryReportList.find((r: any) => r.employeeId === item.employeeId);
    return { ...report, ...item };
  });
  
  columnsToSum.forEach(column => {
    totals[column] = currentData.reduce((sum: number, row: any) => {
      return sum + Number(row[column] || 0);
    }, 0);
  });

  return totals;
}, [sortedData, salaryReportList]);

// Define which columns should display totals
const totalColumnKeys = [
  'attendanceIncentive', 
  'productionIncentive', 
  'foodAllowance',
  'houseRent',
  'basicSalary',
  'otSalary',
  'festivalWageSalary',
  'total',
  'basicDA',
  'hra',
  'ta',
  'medical',
  'totalEarningForPF',
  'salaryAdvanceDeduction',
  'pfDeduction',
  'esiDeduction',
  'canteenDeduction',
  'tds',
  'totalDeduction',
  'netSalary',
];

return (
  <div className="p-6 pt-16 salary-report-edit-container">
    <style>{`
      @media print {
        @page {
          size: landscape;
          margin: 6mm;
        }
        .print\\:hidden, .no-print, .sidebar, header, nav, button, .buttons-wrapper, .mb-6.print\\:hidden, input, select {
          display: none !important;
        }
        .p-6, .p-4 {
          padding: 0 !important;
          margin: 0 !important;
        }
        body {
          background: white !important;
          color: black !important;
          font-size: 7.5pt !important;
        }
        .salary-report-edit-container {
          zoom: 46% !important;
          width: 100% !important;
          max-width: 100% !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
          overflow: visible !important;
        }
        .relative.overflow-hidden, .overflow-x-auto, .overflow-y-auto {
          overflow: visible !important;
          max-height: none !important;
          width: 100% !important;
        }
        table {
          width: 100% !important;
          table-layout: auto !important;
          border-collapse: collapse !important;
        }
        th, td {
          width: auto !important;
          min-width: auto !important;
          max-width: none !important;
          font-size: 7pt !important;
          padding: 2px 3px !important;
          border: 1px solid #475569 !important;
          white-space: nowrap !important;
        }
        th {
          white-space: normal !important;
        }
      }
    `}</style>
    <div className="mb-6">
 
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter Mode:</label>
          <select
            className="select border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 px-3 py-2 text-sm font-medium cursor-pointer"
            value={filterType}
            onChange={(e) => {
              const newMode = e.target.value as 'month' | 'range' | 'single';
              setFilterType(newMode);
            }}
          >
            <option value="month">Month View</option>
            <option value="single">Single Date View</option>
            <option value="range">Date Range View</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          {filterType === 'month' ? (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Select Month:</label>
              <input 
                type="month" 
                className="input border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5" 
                value={month} 
                onChange={(e) => setMonth(e.target.value)} 
              />
            </div>
          ) : filterType === 'single' ? (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Select Date:</label>
              <input 
                type="date" 
                className="input border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5" 
                value={singleDate} 
                onChange={(e) => {
                  const val = e.target.value;
                  setSingleDate(val);
                  setFromDate(val);
                  setToDate(val);
                }} 
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From Date:</label>
                <input 
                  type="date" 
                  className="input border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5" 
                  value={fromDate} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFromDate(val);
                    if (!toDate) {
                      setToDate(val);
                    }
                  }} 
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To Date:</label>
                <input 
                  type="date" 
                  className="input border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-1.5" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)} 
                />
              </div>
            </div>
          )}

          {filterType === 'month' && (
            <div className="flex gap-2">
              <input 
                type="file" 
                id="excel-upload-input" 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleExcelUpload} 
                disabled={!month}
              />
              <button 
                onClick={() => document.getElementById('excel-upload-input')?.click()}
                disabled={!month}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors shadow-sm font-medium ${
                  !month ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title={!month ? "Please select a month first" : "Upload Excel to import attendance/OT data"}
              >
                <Upload className="w-4 h-4" />
                Upload Excel
              </button>
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors shadow-sm font-medium ${
                  isEditMode ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Eye className="w-4 h-4" />
                {isEditMode ? 'Cancel Edit' : 'Edit'}
              </button>
              <button 
                onClick={handleUpdateReport}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                <Calculator className="w-4 h-4" />
                 Save/Update
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    <DataTable
      columns={columns}
      data={sortedData}
      title={
        filterType === 'month' 
          ? `Salary_Report_${month}` 
          : filterType === 'single'
            ? `Salary_Report_${singleDate}`
            : `Salary_Report_${fromDate || toDate}_to_${toDate || fromDate}`
      }
      loading={loading}
      showExport={
        filterType === 'month' 
          ? !!month 
          : filterType === 'single'
            ? !!singleDate
            : !!(fromDate || toDate)
      }
      showPdfExport={
        filterType === 'month' 
          ? !!month 
          : filterType === 'single'
            ? !!singleDate
            : !!(fromDate || toDate)
      }
      pdfFileName={
        filterType === 'month' 
          ? `Salary_Report_${month}` 
          : filterType === 'single'
            ? `Salary_Report_${singleDate}`
            : `Salary_Report_${fromDate || toDate}_to_${toDate || fromDate}`
      }
      showColumnFilters={
        filterType === 'month' 
          ? !!month 
          : filterType === 'single'
            ? !!singleDate
            : !!(fromDate || toDate)
      }
      columnFilters={tableColumnFilters}
      onColumnFiltersChange={setTableColumnFilters}
      grandTotal={grandTotals}
      totalColumnKeys={totalColumnKeys}
      onlyGrandTotal={true}
      virtualScroll={true}
      isShowPagination={false}
      disableFullDataFetch={true}
    />
      
    {/* Expanded Row Details */}
    {expandedRow && selectedEmployee && (
      <div className="mt-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Calculation</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Earnings Calculation</h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Per Day Salary:</span> {Number(selectedEmployee?.perDaySalary ?? (selectedEmployee?.salaryType === 'Daily'
                ? (selectedEmployee?.grossSalary || 0)
                : ((selectedEmployee?.grossSalary || 0) / (selectedEmployee?.daysToBePresent || 1)))).toFixed(2)}</p>
              <p><span className="text-gray-600">Actual Earnings:</span> {Number(
                selectedEmployee?.basicSalary ??
                (((selectedEmployee?.grossSalary || 0) / (selectedEmployee?.daysToBePresent || 1)) *
                  (selectedEmployee?.daysToBePresent === 28 && selectedEmployee?.actualPresentDays > 28 ? 28 : (selectedEmployee?.actualPresentDays || 0)))
              ).toFixed(2)}</p>
              <p><span className="text-gray-600">OT Calculation:</span> {selectedEmployee?.otHoursWorked || 0} hrs × {(Number(selectedEmployee?.perDaySalary ?? (selectedEmployee?.salaryType === 'Daily'
                ? (selectedEmployee?.grossSalary || 0)
                : ((selectedEmployee?.grossSalary || 0) / (selectedEmployee?.daysToBePresent || 1)))) / (selectedEmployee?.workingHoursPerDay || 1)).toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Deductions Breakdown</h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">PF (12%):</span> {selectedEmployee?.pfDeduction?.toFixed(2)}</p>
              <p><span className="text-gray-600">ESI (0.75%):</span> {selectedEmployee?.esiDeduction?.toFixed(2)}</p>
              <p><span className="text-gray-600">Canteen:</span> {selectedEmployee?.canteenDeduction?.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">Attendance Details</h4>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Days to be Present:</span> {selectedEmployee?.daysToBePresent}</p>
              <p><span className="text-gray-600">Actual Present:</span> {selectedEmployee?.actualPresentDays}</p>
              <p><span className="text-gray-600">Working Hours/Day:</span> {selectedEmployee?.workingHoursPerDay}</p>
              <p><span className="text-gray-600">OT Hours:</span> {selectedEmployee?.otHoursWorked}</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
