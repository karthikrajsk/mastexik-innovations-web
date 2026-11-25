import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { 
  saveAllowanceAdvance, 
  getAllowanceAdvance, 
  updateAllowanceAdvance, 
  getAllAllowanceAdvance, 
  deleteAllowanceAdvance,
  AllowanceAdvance
} from '@/state/allowanceAdvanceSlice';
import { 
  getEmployeeLoans, 
  getAllEmployeeLoans, 
  saveEmployeeLoans, 
  updateEmployeeLoans, 
  deleteEmployeeLoan,
  EmployeeLoan
} from '@/state/employeeLoanSlice';
import { 
  getSkipRequests, 
  createSkipRequest, 
  updateSkipRequestStatus, 
  deleteSkipRequest, 
  EmployeeLoanSkipRequest 
} from '@/state/employeeLoanSkipRequestSlice';
import { getSalaryReport } from '@/state/salarySlice';
import { getAllAttendances } from '@/state/attendanceSlice';
import { getAllCompanies } from '@/state/company-master-slice';
import { getCompanyContext } from '@/hooks/useCompanyContext';
import { CodesAPI } from '@/services/codes_api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save, 
  Landmark, 
  X, 
  Eye, 
  Coins, 
  Filter, 
  Calendar, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Printer
} from 'lucide-react';
import { toast } from 'react-toastify';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';
import DocumentNumberService from '@/services/DocumentNumberService';
import { DataTable } from '@/components/data/DataTable';
import { getAllEmployees } from '@/state/employeeSlice';

interface AllowanceRowEdit {
  id?: number;
  type: 'Salary Advance';
  amount: string;
  date: string;
  eligibleForAdvance: boolean;
  reason: string;
  isSaved?: boolean;
}

interface LoanRowEdit {
  id?: number;
  loanAmount: string;
  tenureMonths: string;
  installmentAmount: string;
  fromMonth: string;
  toMonth: string;
  disbursementDate: string;
  purpose: string;
  status: 'Active' | 'Closed' | 'Paused';
  skippedMonths?: string;
  isSaved?: boolean;
}

export default function EmployeePayoutAddPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Helpers
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Redux State
  const { 
    employeeList, 
    allAllowanceAdvanceList, 
    allowanceLoading,
    allEmployeeLoanList, 
    loanLoading,
    salaryReportList,
    attendanceList,
    companyMasterList
  } = useSelector((state: RootState) => ({
    employeeList: state.employee.employeeList,
    allAllowanceAdvanceList: state.allowanceAdvance.allAllowanceAdvanceList,
    allowanceLoading: state.allowanceAdvance.loading,
    allEmployeeLoanList: state.employeeLoan.allEmployeeLoanList,
    loanLoading: state.employeeLoan.loading,
    salaryReportList: state.salary.salaryReportList,
    attendanceList: state.attendance.attendanceList,
    companyMasterList: state.companyMaster.companyMasterList,
  }));

  // Controls & Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [designationList, setDesignationList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'allowance_advance' | 'loan'>(tabParam === 'loan' ? 'loan' : 'allowance_advance');

  // Row Edit Tracking State
  const [allowanceEdits, setAllowanceEdits] = useState<Record<number, AllowanceRowEdit>>({});
  const [savingAllowanceRows, setSavingAllowanceRows] = useState<Record<number, boolean>>({});
  const [loanEdits, setLoanEdits] = useState<Record<number, LoanRowEdit>>({});
  const [savingLoanRows, setSavingLoanRows] = useState<Record<number, boolean>>({});

  // Voucher state
  const [voucherNo, setVoucherNo] = useState('');
  const [voucherConfig, setVoucherConfig] = useState<any>(null);

  // Skip Modal State
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [selectedLoanForSkip, setSelectedLoanForSkip] = useState<any | null>(null);
  const [skipRequests, setSkipRequests] = useState<EmployeeLoanSkipRequest[]>([]);
  const [newSkipMonth, setNewSkipMonth] = useState(selectedMonth);
  const [newSkipReason, setNewSkipReason] = useState('');

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printModalItems, setPrintModalItems] = useState<any[]>([]);

  // 1. Initial Data Fetching
  useEffect(() => {
    dispatch(getAllEmployees({ fetchAll: true }));
    dispatch(getAllAllowanceAdvance({ fetchAll: true }));
    dispatch(getAllEmployeeLoans());
    dispatch(getAllCompanies({ fetchAll: true }));
    fetchVoucherNo();
  }, [dispatch]);

  // Logged-in Company Context & Address
  const companyContext = useMemo(() => getCompanyContext(), []);

  const activeCompany = useMemo(() => {
    const list = Array.isArray(companyMasterList?.data) ? companyMasterList.data : Array.isArray(companyMasterList) ? companyMasterList : [];
    if (!list || list.length === 0) return null;
    if (companyContext.companyId) {
      const found = list.find((c: any) => Number(c.id) === Number(companyContext.companyId));
      if (found) return found;
    }
    if (companyContext.companyName) {
      const found = list.find((c: any) => 
        (c.companyName || c.name || '').toLowerCase() === companyContext.companyName.toLowerCase()
      );
      if (found) return found;
    }
    return list[0];
  }, [companyMasterList, companyContext]);

  const companyNameDisplay = useMemo(() => {
    return activeCompany?.companyName || activeCompany?.name || companyContext.companyName || 'HAYAGREEVAS FABRICS PRIVATE LIMITED';
  }, [activeCompany, companyContext]);

  const companyAddressDisplay = useMemo(() => {
    if (!activeCompany) {
      return 'SF.No : 193, P.Vadugapalayam, Pollachi Road, Palladam, Tirupur Dt - 641664';
    }

    const addrObj = Array.isArray(activeCompany.address) && activeCompany.address.length > 0
      ? (activeCompany.address.find((a: any) => a.isDefault) || activeCompany.address[0])
      : activeCompany;

    const parts = [
      addrObj?.line1 || addrObj?.addressLine1 || activeCompany.addressLine1 || activeCompany.address,
      addrObj?.line2 || addrObj?.addressLine2 || activeCompany.addressLine2,
      addrObj?.city || activeCompany.city,
      addrObj?.stateName || addrObj?.stateCode || activeCompany.state,
      addrObj?.pinCode || addrObj?.pincode || activeCompany.pincode
    ].filter((p: any) => p && typeof p === 'string' && p.trim() !== '');

    if (parts.length > 0) {
      return parts.join(', ');
    }

    return 'SF.No : 193, P.Vadugapalayam, Pollachi Road, Palladam, Tirupur Dt - 641664';
  }, [activeCompany]);

  const deptDisplay = useMemo(() => {
    if (printModalItems.length === 0) {
      return selectedDesignation !== 'ALL' ? selectedDesignation : 'Canteen';
    }

    const depts = Array.from(
      new Set(
        printModalItems.map((item: any) => {
          const emp = item.rawEmployee || {};
          return (
            emp.department ||
            emp.employmentDetails?.department ||
            emp.dept ||
            emp.departmentName ||
            ''
          );
        })
      )
    ).filter((d: any) => typeof d === 'string' && d.trim() !== '');

    if (depts.length > 0) {
      return depts.join(', ');
    }

    return selectedDesignation !== 'ALL' ? selectedDesignation : 'Canteen';
  }, [printModalItems, selectedDesignation]);

  useEffect(() => {
    if (selectedMonth) {
      dispatch(getSalaryReport(selectedMonth));
      dispatch(getAllAttendances({ fetchAll: true }));
    }
  }, [dispatch, selectedMonth]);

  // Worked Days Helper for Employee in target month
  const getWorkedDaysForEmployee = (empId: number) => {
    const targetEmp = (employeeList || []).find((e: any) => Number(e.id) === Number(empId));
    const targetCode = String(targetEmp?.employeeCode || targetEmp?.code || '').trim().toUpperCase();

    const extractMonth = (monthVal: any) => {
      if (!monthVal) return '';
      if (Array.isArray(monthVal)) {
        return `${monthVal[0]}-${String(monthVal[1]).padStart(2, '0')}`;
      }
      return String(monthVal).trim().slice(0, 7);
    };

    const extractDateStr = (dateVal: any) => {
      if (!dateVal) return '';
      if (Array.isArray(dateVal)) {
        return `${dateVal[0]}-${String(dateVal[1]).padStart(2, '0')}-${String(dateVal[2] || 1).padStart(2, '0')}`;
      }
      return String(dateVal).trim().slice(0, 10);
    };

    // 1. Check Salary Report List
    const reportArray = Array.isArray(salaryReportList)
      ? salaryReportList
      : (salaryReportList as any)?.data && Array.isArray((salaryReportList as any).data)
      ? (salaryReportList as any).data
      : (salaryReportList as any)?.content && Array.isArray((salaryReportList as any).content)
      ? (salaryReportList as any).content
      : [];

    const reportItem = reportArray.find((r: any) => {
      const rEmpId = Number(r.employeeId || r.employee_id);
      const rCode = String(r.employeeCode || r.code || '').trim().toUpperCase();
      const matchesEmp = rEmpId === Number(empId) || (targetCode !== '' && rCode === targetCode);
      if (!matchesEmp) return false;

      const rMonth = extractMonth(r.month);
      return !rMonth || !selectedMonth || rMonth === selectedMonth;
    });

    if (reportItem) {
      const days = reportItem.actualPresentDays ?? reportItem.presentDays ?? reportItem.daysToBePresent;
      if (days !== undefined && days !== null) {
        return Number(days);
      }
    }

    // 2. Aggregate from Attendance List for selectedMonth
    const empAttendances = (attendanceList || []).filter((a: any) => {
      const aEmpId = Number(a.employeeId || a.employee_id);
      const aCode = String(a.employeeCode || a.employee_code || a.code || '').trim().toUpperCase();
      const matchesEmp = aEmpId === Number(empId) || (targetCode !== '' && aCode === targetCode);
      if (!matchesEmp) return false;

      if (selectedMonth && a.date) {
        const aDateStr = extractDateStr(a.date);
        return aDateStr.startsWith(selectedMonth);
      }
      return true;
    });

    if (empAttendances.length > 0) {
      return empAttendances.reduce((sum: number, att: any) => {
        if (att.workingDays !== undefined && att.workingDays !== null) {
          return sum + Number(att.workingDays);
        }
        if (att.status === 'Present') {
          return sum + 1;
        }
        return sum;
      }, 0);
    }

    return 0;
  };

  const fetchVoucherNo = async () => {
    try {
      const res = await DocumentNumberService.generateDocumentNumber({ screenName: 'Employee Payout' });
      setVoucherNo(res.documentNumber);
      setVoucherConfig(res.configuration);
    } catch (error) {
      console.error("Error fetching voucher number", error);
    }
  };

  // 2. Fetch Designation list from CodesAPI & Employee Master
  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const details = await CodesAPI.getCodeDetailsByHeader('Designation');
        const apiDesigs = (details || []).map((d: any) => d.value || d.code).filter(Boolean);
        const empDesigs = (employeeList || [])
          .map((e: any) => e.designation || e.employmentDetails?.designation)
          .filter(Boolean);
        const uniqueDesigs = Array.from(new Set([...apiDesigs, ...empDesigs])).sort();
        setDesignationList(uniqueDesigs);
      } catch (err) {
        console.error('Failed to load designations:', err);
        const empDesigs = (employeeList || [])
          .map((e: any) => e.designation || e.employmentDetails?.designation)
          .filter(Boolean);
        setDesignationList(Array.from(new Set(empDesigs)).sort());
      }
    };
    loadDesignations();
  }, [employeeList]);

  // 3. Pre-populate Allowance Edits map whenever allAllowanceAdvanceList, salaryReportList, or selectedMonth changes
  useEffect(() => {
    const edits: Record<number, AllowanceRowEdit> = {};
    const extractMonth = (monthVal: any) => {
      if (!monthVal) return '';
      if (Array.isArray(monthVal)) {
        return `${monthVal[0]}-${String(monthVal[1]).padStart(2, '0')}`;
      }
      return String(monthVal).trim().slice(0, 7);
    };

    // 1. Populate from allAllowanceAdvanceList (employee_allowance_advance table)
    const list = Array.isArray(allAllowanceAdvanceList) 
      ? allAllowanceAdvanceList 
      : (allAllowanceAdvanceList as any)?.data && Array.isArray((allAllowanceAdvanceList as any).data) 
      ? (allAllowanceAdvanceList as any).data 
      : [];

    list.forEach((item: any) => {
      const empId = Number(item.employeeId || item.employee_id);
      const itemMonth = extractMonth(item.month);
      if (empId && (itemMonth === selectedMonth || !selectedMonth)) {
        edits[empId] = {
          id: item.id,
          type: 'Salary Advance',
          amount: item.amount !== undefined && item.amount !== null ? String(item.amount) : '',
          date: item.date || item.paymentDate || item.voucherDate || getCurrentDate(),
          eligibleForAdvance: item.eligibleForAdvance !== false,
          reason: item.reason || '',
          isSaved: true
        };
      }
    });

    // 2. Fallback to salaryReportList (salary_report_override table) if advance deduction > 0 and not yet populated
    const reportArray = Array.isArray(salaryReportList)
      ? salaryReportList
      : (salaryReportList as any)?.data && Array.isArray((salaryReportList as any).data)
      ? (salaryReportList as any).data
      : [];

    reportArray.forEach((report: any) => {
      const empId = Number(report.employeeId || report.employee_id);
      const repMonth = extractMonth(report.month);
      if (empId && (!report.month || repMonth === selectedMonth)) {
        const reportAdv = Number(report.salaryAdvanceDeduction || 0);
        if (reportAdv > 0 && (!edits[empId] || !edits[empId].amount || Number(edits[empId].amount) === 0)) {
          edits[empId] = {
            ...edits[empId],
            type: 'Salary Advance',
            amount: String(reportAdv),
            date: edits[empId]?.date || getCurrentDate(),
            eligibleForAdvance: true,
            reason: edits[empId]?.reason || 'Saved in Salary Report',
            isSaved: true
          };
        }
      }
    });

    setAllowanceEdits(edits);
  }, [allAllowanceAdvanceList, salaryReportList, selectedMonth]);

  // 4. Pre-populate Loan Edits map whenever allEmployeeLoanList changes
  useEffect(() => {
    const edits: Record<number, LoanRowEdit> = {};
    const list = Array.isArray(allEmployeeLoanList) 
      ? allEmployeeLoanList 
      : (allEmployeeLoanList as any)?.data && Array.isArray((allEmployeeLoanList as any).data) 
      ? (allEmployeeLoanList as any).data 
      : [];
    list.forEach((item: any) => {
      const empId = Number(item.employeeId || item.employee_id);
      if (empId) {
        edits[empId] = {
          id: item.id,
          loanAmount: item.loanAmount !== undefined && item.loanAmount !== null ? String(item.loanAmount) : '',
          tenureMonths: item.tenureMonths !== undefined && item.tenureMonths !== null ? String(item.tenureMonths) : '1',
          installmentAmount: item.installmentAmount !== undefined && item.installmentAmount !== null ? String(item.installmentAmount) : '',
          fromMonth: item.fromMonth || selectedMonth,
          toMonth: item.toMonth || selectedMonth,
          disbursementDate: item.disbursementDate || getCurrentDate(),
          purpose: item.purpose || '',
          status: item.status || 'Active',
          skippedMonths: item.skippedMonths || '',
          isSaved: true
        };
      }
    });
    setLoanEdits(edits);
  }, [allEmployeeLoanList, selectedMonth]);

  // Designation Filter Options
  const designationSelectOptions = useMemo(() => {
    const opts = [{ value: 'ALL', label: 'All Designations' }];
    designationList.forEach(desig => {
      opts.push({ value: desig, label: desig });
    });
    return opts;
  }, [designationList]);

  // Filtered Employees List
  const filteredEmployees = useMemo(() => {
    return (employeeList || []).filter((emp: any) => {
      if (emp.isRelieved && Number(emp.isRelieved) !== 0) return false;
      if (selectedDesignation && selectedDesignation !== 'ALL') {
        const empDesig = (emp.designation || emp.employmentDetails?.designation || '').trim();
        if (empDesig.toLowerCase() !== selectedDesignation.trim().toLowerCase()) return false;
      }
      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const code = (emp.employeeCode || emp.code || '').toLowerCase();
        const fullName = (emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`).toLowerCase();
        if (!code.includes(q) && !fullName.includes(q)) return false;
      }
      return true;
    });
  }, [employeeList, selectedDesignation, searchQuery]);

  // Helper flags
  const isFlagEnabled = (value: any) => value === true || Number(value) === 1;

  // Tenure & Month calculations for Loan
  const calculateExtendedToMonth = (fromM: string, tenure: number, skippedMonthsStr: string) => {
    if (!fromM || !tenure || tenure <= 0) return '';
    const skipped = skippedMonthsStr ? skippedMonthsStr.split(',').map(s => s.trim()) : [];
    let current = fromM;
    let nonSkippedCount = 0;
    for (let i = 0; i < 1200; i++) {
      const isSkipped = skipped.includes(current);
      if (!isSkipped) {
        nonSkippedCount++;
      }
      if (nonSkippedCount >= tenure) {
        return current;
      }
      const [year, m] = current.split('-').map(Number);
      const nextDate = new Date(year, m, 1);
      const nextYear = nextDate.getFullYear();
      const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
      current = `${nextYear}-${nextMonth}`;
    }
    return current;
  };

  // Row Field Input Handlers for Allowance & Advance
  const handleAllowanceEditChange = (empId: number, field: keyof AllowanceRowEdit, val: any) => {
    setAllowanceEdits(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        type: 'Salary Advance',
        amount: prev[empId]?.amount || '',
        date: prev[empId]?.date || getCurrentDate(),
        eligibleForAdvance: prev[empId]?.eligibleForAdvance !== false,
        reason: prev[empId]?.reason || '',
        [field]: val
      }
    }));
  };

  // Row Field Input Handlers for Loan
  const handleLoanEditChange = (empId: number, field: keyof LoanRowEdit, val: any) => {
    setLoanEdits(prev => {
      const current = prev[empId] || {
        loanAmount: '',
        tenureMonths: '1',
        installmentAmount: '',
        fromMonth: selectedMonth,
        toMonth: selectedMonth,
        disbursementDate: getCurrentDate(),
        purpose: '',
        status: 'Active'
      };
      let updated = { ...current, [field]: val };

      if (field === 'loanAmount' || field === 'tenureMonths') {
        const amt = field === 'loanAmount' ? parseFloat(val) || 0 : parseFloat(updated.loanAmount) || 0;
        const tenure = field === 'tenureMonths' ? parseInt(val) || 1 : parseInt(updated.tenureMonths) || 1;
        if (tenure > 0) {
          updated.installmentAmount = String(Math.round(amt / tenure));
        }
      }

      if (field === 'fromMonth' || field === 'tenureMonths' || field === 'skippedMonths') {
        const fromM = field === 'fromMonth' ? val : updated.fromMonth;
        const tenure = field === 'tenureMonths' ? parseInt(val) || 1 : parseInt(updated.tenureMonths) || 1;
        const skippedStr = field === 'skippedMonths' ? val : updated.skippedMonths || '';
        if (fromM && tenure > 0) {
          updated.toMonth = calculateExtendedToMonth(fromM, tenure, skippedStr);
        }
      }

      return { ...prev, [empId]: updated };
    });
  };

  // Helper to validate employee eligibility before save / print
  const validateEmployeeEligibility = (emp: any, type?: string, module?: 'allowance_advance' | 'loan'): { eligible: boolean; message: string } => {
    const fullName = emp?.employeeName || `${emp?.personalDetails?.firstName || ''} ${emp?.personalDetails?.lastName || ''}`.trim() || 'Employee';
    const code = emp?.employeeCode || emp?.code || '';
    const nameWithCode = code ? `${fullName} (${code})` : fullName;

    const currentModule = module || activeTab;

    if (currentModule === 'allowance_advance') {
      const canAdvance = isFlagEnabled(emp?.isAdvance);
      if (!canAdvance) {
        return {
          eligible: false,
          message: `${nameWithCode} is not eligible for Salary Advance. Enable Advance Applicable from Employee Master.`
        };
      }
    } else if (currentModule === 'loan') {
      const canLoan = isFlagEnabled(emp?.isLoan ?? true);
      if (!canLoan) {
        return {
          eligible: false,
          message: `${nameWithCode} is not eligible for Loan. Enable Loan Applicable from Employee Master.`
        };
      }
    }

    return { eligible: true, message: '' };
  };

  // Save Single Allowance Row
  const handleSaveAllowanceRow = async (emp: any) => {
    const empId = Number(emp.id);
    const edit = allowanceEdits[empId];
    if (!edit || !edit.amount || Number(edit.amount) <= 0) {
      toast.error(`Please enter a valid amount for ${emp.employeeName}`);
      return;
    }

    const validation = validateEmployeeEligibility(emp, edit.type || 'Salary Advance', 'allowance_advance');
    if (!validation.eligible) {
      toast.error(validation.message);
      return;
    }

    setSavingAllowanceRows(prev => ({ ...prev, [empId]: true }));
    try {
      const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
      const code = emp.employeeCode || emp.code || '';

      const payload: AllowanceAdvance = {
        id: edit.id,
        employeeId: empId,
        employeeCode: code,
        employeeName: fullName,
        type: 'Salary Advance',
        amount: Number(edit.amount),
        date: edit.date || getCurrentDate(),
        month: selectedMonth,
        eligibleForAdvance: edit.eligibleForAdvance,
        reason: edit.reason || '',
        voucherNo: voucherNo,
        voucherDate: getCurrentDate(),
        paymentDate: edit.date || getCurrentDate()
      };

      await dispatch(saveAllowanceAdvance({
        employeeId: empId,
        month: selectedMonth,
        data: [payload]
      }));
      dispatch(getAllAllowanceAdvance({ fetchAll: true }));
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSavingAllowanceRows(prev => ({ ...prev, [empId]: false }));
    }
  };

  // Bulk Save All Allowances
  const handleSaveAllAllowances = async () => {
    const itemsToSave: AllowanceAdvance[] = [];
    let hasIneligible = false;

    filteredEmployees.forEach((emp: any) => {
      const empId = Number(emp.id);
      const edit = allowanceEdits[empId];
      if (edit && edit.amount && Number(edit.amount) > 0) {
        const validation = validateEmployeeEligibility(emp, edit.type || 'Salary Advance', 'allowance_advance');
        if (!validation.eligible) {
          toast.error(validation.message);
          hasIneligible = true;
          return;
        }

        const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
        const code = emp.employeeCode || emp.code || '';

        itemsToSave.push({
          id: edit.id,
          employeeId: empId,
          employeeCode: code,
          employeeName: fullName,
          type: 'Salary Advance',
          amount: Number(edit.amount),
          date: edit.date || getCurrentDate(),
          month: selectedMonth,
          eligibleForAdvance: edit.eligibleForAdvance,
          reason: edit.reason || '',
          voucherNo: voucherNo,
          voucherDate: getCurrentDate(),
          paymentDate: edit.date || getCurrentDate()
        });
      }
    });

    if (hasIneligible && itemsToSave.length === 0) {
      return;
    }

    if (itemsToSave.length === 0) {
      toast.warn('No advance amounts entered to save.');
      return;
    }

    try {
      for (const item of itemsToSave) {
        await dispatch(saveAllowanceAdvance({
          employeeId: item.employeeId,
          month: selectedMonth,
          data: [item]
        }));
      }
      toast.success(`Successfully saved advance entries for ${itemsToSave.length} employee(s)`);
      dispatch(getAllAllowanceAdvance({ fetchAll: true }));
    } catch (err) {
      console.error('Bulk save error:', err);
    }
  };

  // Delete Allowance Entry
  const handleDeleteAllowanceEntry = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this allowance/advance record?')) {
      await dispatch(deleteAllowanceAdvance(id));
      dispatch(getAllAllowanceAdvance({ fetchAll: true }));
    }
  };

  // Save Single Loan Row
  const handleSaveLoanRow = async (emp: any) => {
    const empId = Number(emp.id);
    const edit = loanEdits[empId];
    if (!edit || !edit.loanAmount || Number(edit.loanAmount) <= 0) {
      toast.error(`Please enter a valid loan amount for ${emp.employeeName}`);
      return;
    }

    const validation = validateEmployeeEligibility(emp, undefined, 'loan');
    if (!validation.eligible) {
      toast.error(validation.message);
      return;
    }

    setSavingLoanRows(prev => ({ ...prev, [empId]: true }));
    try {
      const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
      const code = emp.employeeCode || emp.code || '';

      const payload: EmployeeLoan = {
        id: edit.id,
        employeeId: empId,
        employeeCode: code,
        employeeName: fullName,
        loanAmount: Number(edit.loanAmount),
        tenureMonths: Number(edit.tenureMonths || 1),
        installmentAmount: Number(edit.installmentAmount || edit.loanAmount),
        fromMonth: edit.fromMonth || selectedMonth,
        toMonth: edit.toMonth || selectedMonth,
        disbursementDate: edit.disbursementDate || getCurrentDate(),
        purpose: edit.purpose || '',
        status: edit.status || 'Active',
        skippedMonths: edit.skippedMonths || ''
      };

      if (edit.id) {
        await dispatch(updateEmployeeLoans({ employeeId: empId, data: [payload] }));
      } else {
        await dispatch(saveEmployeeLoans({ employeeId: empId, data: [payload] }));
      }
      dispatch(getAllEmployeeLoans());
    } catch (error) {
      console.error('Save loan error:', error);
    } finally {
      setSavingLoanRows(prev => ({ ...prev, [empId]: false }));
    }
  };

  // Bulk Save All Loans
  const handleSaveAllLoans = async () => {
    const itemsToSave: EmployeeLoan[] = [];
    let hasIneligible = false;

    filteredEmployees.forEach((emp: any) => {
      const empId = Number(emp.id);
      const edit = loanEdits[empId];
      if (edit && edit.loanAmount && Number(edit.loanAmount) > 0) {
        const validation = validateEmployeeEligibility(emp, undefined, 'loan');
        if (!validation.eligible) {
          toast.error(validation.message);
          hasIneligible = true;
          return;
        }

        const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
        const code = emp.employeeCode || emp.code || '';

        itemsToSave.push({
          id: edit.id,
          employeeId: empId,
          employeeCode: code,
          employeeName: fullName,
          loanAmount: Number(edit.loanAmount),
          tenureMonths: Number(edit.tenureMonths || 1),
          installmentAmount: Number(edit.installmentAmount || edit.loanAmount),
          fromMonth: edit.fromMonth || selectedMonth,
          toMonth: edit.toMonth || selectedMonth,
          disbursementDate: edit.disbursementDate || getCurrentDate(),
          purpose: edit.purpose || '',
          status: edit.status || 'Active',
          skippedMonths: edit.skippedMonths || ''
        });
      }
    });

    if (hasIneligible && itemsToSave.length === 0) {
      return;
    }

    if (itemsToSave.length === 0) {
      toast.warn('No loan details entered to save.');
      return;
    }

    try {
      for (const item of itemsToSave) {
        await dispatch(saveEmployeeLoans({ employeeId: item.employeeId, data: [item] }));
      }
      toast.success(`Successfully saved loan entries for ${itemsToSave.length} employee(s)`);
      dispatch(getAllEmployeeLoans());
    } catch (err) {
      console.error('Bulk save loans error:', err);
    }
  };

  // Delete Loan Entry
  const handleDeleteLoanEntry = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this loan record?')) {
      await dispatch(deleteEmployeeLoan(id));
      dispatch(getAllEmployeeLoans());
    }
  };

  // Skip Modal Handlers
  const openSkipModal = (loan: any) => {
    setSelectedLoanForSkip(loan);
    setIsSkipModalOpen(true);
    if (loan && loan.id) {
      dispatch(getSkipRequests({ loanId: loan.id })).then((res: any) => {
        if (res.payload) setSkipRequests(res.payload);
      });
    }
  };

  const handleAddSkipRequest = () => {
    if (!selectedLoanForSkip || !selectedLoanForSkip.id || !newSkipMonth) return;
    const data: Omit<EmployeeLoanSkipRequest, 'id'> = {
      loanId: selectedLoanForSkip.id,
      skipMonth: newSkipMonth,
      reason: newSkipReason,
      status: 'Pending'
    };
    dispatch(createSkipRequest(data)).then((res: any) => {
      if (res.payload && res.payload.id) {
        dispatch(getSkipRequests({ loanId: selectedLoanForSkip.id })).then((r: any) => {
          if (r.payload) setSkipRequests(r.payload);
        });
        setNewSkipReason('');
      }
    });
  };

  const handleUpdateSkipStatus = async (id: number, status: 'Approved' | 'Declined') => {
    if (!selectedLoanForSkip || !selectedLoanForSkip.id) return;
    dispatch(updateSkipRequestStatus({ id, status })).then((res: any) => {
      if (res.payload) {
        dispatch(getSkipRequests({ loanId: selectedLoanForSkip.id })).then((r: any) => {
          if (r.payload) setSkipRequests(r.payload);
        });
        dispatch(getAllEmployeeLoans());
      }
    });
  };

  const handleDeleteSkipRequest = async (id: number) => {
    if (!selectedLoanForSkip || !selectedLoanForSkip.id) return;
    dispatch(deleteSkipRequest(id)).then((res: any) => {
      dispatch(getSkipRequests({ loanId: selectedLoanForSkip.id })).then((r: any) => {
        if (r.payload) setSkipRequests(r.payload);
      });
      dispatch(getAllEmployeeLoans());
    });
  };

  // Print Handlers
  const handlePrintSingleVoucher = (rowItem: any) => {
    const emp = rowItem.rawEmployee;
    const edit = rowItem.editState || {};
    const validation = validateEmployeeEligibility(emp, edit.type || 'Salary Advance', activeTab);
    if (!validation.eligible) {
      toast.error(validation.message);
      return;
    }

    setPrintModalItems([rowItem]);
    setShowPrintModal(true);
  };

  const handlePrintBatchVouchers = () => {
    const activeData = activeTab === 'allowance_advance' ? processedAdvanceData : processedLoanData;
    const itemsToPrint: any[] = [];
    for (const item of activeData) {
      const edit: any = item.editState || {};
      const amt = activeTab === 'allowance_advance' ? Number(edit.amount || 0) : Number(edit.loanAmount || 0);
      if (amt > 0) {
        const validation = validateEmployeeEligibility(item.rawEmployee, edit.type || 'Salary Advance', activeTab);
        if (!validation.eligible) {
          toast.error(validation.message);
          return;
        }
        itemsToPrint.push(item);
      }
    }

    if (itemsToPrint.length === 0) {
      toast.warn('No items with non-zero amount found to print report.');
      return;
    }
    setPrintModalItems(itemsToPrint);
    setShowPrintModal(true);
  };

  const printTotalAmount = useMemo(() => {
    return printModalItems.reduce((sum: number, item: any) => {
      const edit: any = item.editState || {};
      const amt = activeTab === 'allowance_advance' ? Number(edit.amount || 0) : Number(edit.loanAmount || 0);
      return sum + amt;
    }, 0);
  }, [printModalItems, activeTab]);

  const formattedMonthRange = useMemo(() => {
    if (!selectedMonth) return 'N/A';
    const [year, m] = selectedMonth.split('-');
    const dateObj = new Date(Number(year), Number(m) - 1, 1);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthStr = months[dateObj.getMonth()];
    const lastDay = new Date(Number(year), Number(m), 0).getDate();
    return `01-${monthStr}-${year} To ${lastDay}-${monthStr}-${year}`;
  }, [selectedMonth]);

  // Processed Data for Advance DataTable
  const processedAdvanceData = useMemo(() => {
    return filteredEmployees.map((emp: any, index: number) => {
      const empId = Number(emp.id);
      const edit = allowanceEdits[empId] || {
        type: 'Salary Advance',
        amount: '',
        date: getCurrentDate(),
        eligibleForAdvance: true,
        reason: ''
      };
      const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
      const empCode = emp.employeeCode || emp.code || 'N/A';
      const desig = emp.designation || emp.employmentDetails?.designation || 'N/A';
      const isEligible = isFlagEnabled(emp.isAdvance);
      const workedDays = getWorkedDaysForEmployee(empId);

      return {
        id: edit.id,
        serialNo: index + 1,
        employeeId: empId,
        employeeCode: empCode,
        employeeName: fullName,
        designation: desig,
        workedDays: workedDays,
        isEligible: isEligible,
        rawEmployee: emp,
        editState: edit
      };
    });
  }, [filteredEmployees, allowanceEdits, selectedMonth, attendanceList, salaryReportList]);

  // Advance Columns Definition for DataTable
  const advanceColumns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 45,
        disableFilters: true,
        Cell: ({ value }: any) => <span className="font-medium text-gray-600">{value}</span>
      },
      {
        Header: 'Emp Code',
        accessor: 'employeeCode',
        width: 95,
        Cell: ({ value }: any) => <span className="font-semibold text-gray-800">{value}</span>
      },
      {
        Header: 'Employee Name',
        accessor: 'employeeName',
        minWidth: 150,
        Cell: ({ value }: any) => <span className="font-medium text-gray-900">{value}</span>
      },
      {
        Header: 'Designation',
        accessor: 'designation',
        minWidth: 120,
        Cell: ({ value }: any) => <span className="text-gray-600">{value}</span>
      },
      {
        Header: 'Worked Days',
        accessor: 'workedDays',
        width: 95,
        Cell: ({ value }: any) => (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
            {value} Days
          </span>
        )
      },
      {
        Header: 'Eligibility',
        accessor: 'isEligible',
        width: 105,
        Cell: ({ value }: any) => (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            value 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {value ? <Check className="w-3 h-3 text-green-600" /> : <Info className="w-3 h-3 text-amber-600" />}
            {value ? 'Eligible' : 'Not Eligible'}
          </span>
        )
      },
      {
        Header: 'Advance Date',
        accessor: 'advanceDate',
        width: 130,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = allowanceEdits[empId] || { date: getCurrentDate() };
          return (
            <input 
              type="date"
              className="input py-1 px-1.5 w-full border-gray-300 rounded-md text-xs font-medium focus:ring-blue-500"
              value={edit.date || getCurrentDate()}
              onChange={(e) => handleAllowanceEditChange(empId, 'date', e.target.value)}
            />
          );
        }
      },
      {
        Header: 'Payment Type',
        accessor: 'type',
        width: 130,
        Cell: () => (
          <span className="font-semibold text-xs text-gray-700 px-2 py-1 bg-gray-100 rounded border border-gray-200 block text-center">
            Salary Advance
          </span>
        )
      },
      {
        Header: 'Amount (₹)',
        accessor: 'amount',
        width: 110,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = allowanceEdits[empId] || { amount: '' };
          return (
            <input 
              type="number"
              className="input py-1 px-2 w-full border-gray-300 rounded-md text-xs font-semibold text-gray-900 focus:ring-blue-500"
              placeholder="0.00"
              value={edit.amount}
              onChange={(e) => handleAllowanceEditChange(empId, 'amount', e.target.value)}
            />
          );
        }
      },
      {
        Header: 'Advance Check',
        accessor: 'eligibleForAdvance',
        width: 100,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = allowanceEdits[empId] || { type: 'Salary Advance', eligibleForAdvance: true };
          if (edit.type !== 'Salary Advance') {
            return <span className="text-gray-400 italic text-[10px]">N/A</span>;
          }
          return (
            <label className="inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox"
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                checked={!!edit.eligibleForAdvance}
                onChange={(e) => handleAllowanceEditChange(empId, 'eligibleForAdvance', e.target.checked)}
              />
            </label>
          );
        }
      },
      {
        Header: 'Reason / Purpose',
        accessor: 'reason',
        minWidth: 140,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = allowanceEdits[empId] || { reason: '' };
          return (
            <input 
              type="text"
              className="input py-1 px-2 w-full border-gray-300 rounded-md text-xs"
              placeholder="e.g. Festival / Medical"
              value={edit.reason}
              onChange={(e) => handleAllowanceEditChange(empId, 'reason', e.target.value)}
            />
          );
        }
      },
      {
        Header: 'Action',
        accessor: 'action',
        width: 110,
        disableFilters: true,
        Cell: ({ row }: any) => {
          const emp = row.original.rawEmployee;
          const empId = row.original.employeeId;
          const edit = allowanceEdits[empId] || {};
          const isSaving = savingAllowanceRows[empId];
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => handleSaveAllowanceRow(emp)}
                disabled={isSaving}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                title="Save Row Entry"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePrintSingleVoucher(row.original)}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                title="Print Payment Report / Voucher"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              {edit.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteAllowanceEntry(edit.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        }
      }
    ],
    [allowanceEdits, savingAllowanceRows]
  );

  // Processed Data for Loan DataTable
  const processedLoanData = useMemo(() => {
    return filteredEmployees.map((emp: any, index: number) => {
      const empId = Number(emp.id);
      const edit = loanEdits[empId] || {
        loanAmount: '',
        tenureMonths: '1',
        installmentAmount: '',
        fromMonth: selectedMonth,
        toMonth: selectedMonth,
        disbursementDate: getCurrentDate(),
        purpose: '',
        status: 'Active'
      };
      const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
      const empCode = emp.employeeCode || emp.code || 'N/A';
      const desig = emp.designation || emp.employmentDetails?.designation || 'N/A';
      const isEligible = isFlagEnabled(emp.isLoan ?? true);
      const workedDays = getWorkedDaysForEmployee(empId);

      return {
        id: edit.id,
        serialNo: index + 1,
        employeeId: empId,
        employeeCode: empCode,
        employeeName: fullName,
        designation: desig,
        workedDays: workedDays,
        isEligible: isEligible,
        rawEmployee: emp,
        editState: edit
      };
    });
  }, [filteredEmployees, loanEdits, selectedMonth, attendanceList, salaryReportList]);

  // Loan Columns Definition for DataTable
  const loanColumns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 45,
        disableFilters: true,
        Cell: ({ value }: any) => <span className="font-medium text-gray-600">{value}</span>
      },
      {
        Header: 'Emp Code',
        accessor: 'employeeCode',
        width: 90,
        Cell: ({ value }: any) => <span className="font-semibold text-gray-800">{value}</span>
      },
      {
        Header: 'Employee Name',
        accessor: 'employeeName',
        minWidth: 140,
        Cell: ({ value }: any) => <span className="font-medium text-gray-900">{value}</span>
      },
      {
        Header: 'Worked Days',
        accessor: 'workedDays',
        width: 95,
        Cell: ({ value }: any) => (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
            {value} Days
          </span>
        )
      },
      {
        Header: 'Eligibility',
        accessor: 'isEligible',
        width: 100,
        Cell: ({ value }: any) => (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            value 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {value ? <Check className="w-3 h-3 text-green-600" /> : <Info className="w-3 h-3 text-amber-600" />}
            {value ? 'Eligible' : 'Not Eligible'}
          </span>
        )
      },
      {
        Header: 'Loan Amt (₹)',
        accessor: 'loanAmount',
        width: 105,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || { loanAmount: '' };
          return (
            <input 
              type="number"
              className="input py-1 px-2 w-full border-gray-300 rounded-md text-xs font-semibold text-gray-900"
              placeholder="0.00"
              value={edit.loanAmount}
              onChange={(e) => handleLoanEditChange(empId, 'loanAmount', e.target.value)}
            />
          );
        }
      },
      {
        Header: 'Tenure (M)',
        accessor: 'tenureMonths',
        width: 75,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || { tenureMonths: '1' };
          return (
            <input 
              type="number"
              className="input py-1 px-1.5 w-full border-gray-300 rounded-md text-xs"
              placeholder="Months"
              value={edit.tenureMonths}
              onChange={(e) => handleLoanEditChange(empId, 'tenureMonths', e.target.value)}
            />
          );
        }
      },
      {
        Header: 'Installment (₹)',
        accessor: 'installmentAmount',
        width: 100,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || { installmentAmount: '' };
          return (
            <input 
              type="number"
              className="input py-1 px-2 w-full bg-gray-50 border-gray-300 rounded-md text-xs font-bold text-gray-800 cursor-not-allowed"
              value={edit.installmentAmount}
              readOnly
              placeholder="0.00"
            />
          );
        }
      },
      {
        Header: 'From Month',
        accessor: 'fromMonth',
        width: 110,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || { fromMonth: selectedMonth };
          return (
            <input 
              type="month"
              className="input py-1 px-1 w-full border-gray-300 rounded-md text-[11px]"
              value={edit.fromMonth}
              onChange={(e) => handleLoanEditChange(empId, 'fromMonth', e.target.value)}
            />
          );
        }
      },
      {
        Header: 'To Month',
        accessor: 'toMonth',
        width: 110,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || { toMonth: selectedMonth };
          return (
            <input 
              type="month"
              className="input py-1 px-1 w-full bg-gray-50 border-gray-300 rounded-md text-[11px] cursor-not-allowed font-semibold"
              value={edit.toMonth}
              readOnly
            />
          );
        }
      },
      {
        Header: 'Disbursement',
        accessor: 'disbursementDate',
        width: 120,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || { disbursementDate: getCurrentDate() };
          return (
            <input 
              type="date"
              className="input py-1 px-1 w-full border-gray-300 rounded-md text-[11px]"
              value={edit.disbursementDate}
              onChange={(e) => handleLoanEditChange(empId, 'disbursementDate', e.target.value)}
            />
          );
        }
      },
      {
        Header: 'Purpose',
        accessor: 'purpose',
        minWidth: 120,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || { purpose: '' };
          return (
            <input 
              type="text"
              className="input py-1 px-2 w-full border-gray-300 rounded-md text-xs"
              placeholder="Purpose..."
              value={edit.purpose}
              onChange={(e) => handleLoanEditChange(empId, 'purpose', e.target.value)}
            />
          );
        }
      },
      {
        Header: 'Status',
        accessor: 'status',
        width: 95,
        Cell: ({ row }: any) => {
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || { status: 'Active' };
          return (
            <select 
              className="input py-1 px-1 w-full border-gray-300 rounded-md text-xs font-semibold"
              value={edit.status}
              onChange={(e) => handleLoanEditChange(empId, 'status', e.target.value as any)}
            >
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Paused">Paused</option>
            </select>
          );
        }
      },
      {
        Header: 'Action',
        accessor: 'action',
        width: 120,
        disableFilters: true,
        Cell: ({ row }: any) => {
          const emp = row.original.rawEmployee;
          const empId = row.original.employeeId;
          const edit = loanEdits[empId] || {};
          const isSaving = savingLoanRows[empId];
          return (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => handleSaveLoanRow(emp)}
                disabled={isSaving}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                title="Save Loan"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePrintSingleVoucher(row.original)}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                title="Print Loan Voucher"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              {edit.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => openSkipModal(edit)}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                    title="Skip Requests"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLoanEntry(edit.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Loan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : null}
            </div>
          );
        }
      }
    ],
    [loanEdits, savingLoanRows]
  );

  return (
    <div className="p-6 pt-16 space-y-4">
      {/* Print styles */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-voucher-area, #printable-voucher-area * {
            visibility: visible !important;
          }
          #printable-voucher-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 275mm !important;
            box-sizing: border-box !important;
            border: none !important;
            padding: 10mm 12mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          table {
            width: 100% !important;
            table-layout: auto !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      {/* Compact Top Control & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        
        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
           {/* Active Tab Switcher */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Module View</label>
            <div className="flex border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              <button
                type="button"
                className={`flex-1 py-1 px-2 font-semibold text-xs rounded-md transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'allowance_advance' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('allowance_advance')}
              >
                <Coins className="w-3.5 h-3.5" /> Advance
              </button>
              <button
                type="button"
                className={`flex-1 py-1 px-2 font-semibold text-xs rounded-md transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'loan' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('loan')}
              >
                <Landmark className="w-3.5 h-3.5" /> Loans
              </button>
            </div>
          </div>
          {/* Target Month Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Target Month
            </label>
            <input 
              type="month" 
              className="input w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs py-1.5" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
            />
          </div>

          {/* Designation Searchable Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" /> Designation Filter
            </label>
            <CommonSearchableSelect 
              options={designationSelectOptions}
              value={selectedDesignation}
              onValueChange={(val: string) => setSelectedDesignation(val)}
              placeholder="All Designations"
              className="w-full text-xs"
            />
          </div>

        </div>
      </div>

      {/* Main Bulk Row-by-Row DataTable Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'allowance_advance' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-600" />
                Salary Advance Entries ({filteredEmployees.length} Employees)
              </h3>
            </div>

            {/* Application Shared DataTable Component */}
            <div className="">
              <DataTable
                columns={advanceColumns}
                data={processedAdvanceData}
                title=""
                showActions={false}
                showExport={false}
                isShowPagination={false}
              />
            </div>

            {/* Bottom Save & Print Action Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <button 
                type="button"
                onClick={handlePrintBatchVouchers}
                className="btn flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-colors font-bold shadow-md text-sm"
              >
                <Printer className="w-4 h-4" /> Print Payment Report ({processedAdvanceData.filter(d => Number(d.editState?.amount || 0) > 0).length})
              </button>
              <button 
                type="button"
                onClick={handleSaveAllAllowances}
                className="btn btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-bold shadow-md text-sm"
              >
                <Save className="w-4 h-4" /> Save All Advances
              </button>
            </div>
          </div>
        )}

        {activeTab === 'loan' && (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                Employee Loan Entries ({filteredEmployees.length} Employees)
              </h3>
            </div>

            {/* Application Shared DataTable Component */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <DataTable
                columns={loanColumns}
                data={processedLoanData}
                title=""
                showActions={false}
                showExport={false}
                isShowPagination={false}
              />
            </div>

            {/* Bottom Save & Print Action Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <button 
                type="button"
                onClick={handlePrintBatchVouchers}
                className="btn flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-colors font-bold shadow-md text-sm"
              >
                <Printer className="w-4 h-4" /> Print Loan Report ({processedLoanData.filter(d => Number(d.editState?.loanAmount || 0) > 0).length})
              </button>
              <button 
                type="button"
                onClick={handleSaveAllLoans}
                className="btn btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-bold shadow-md text-sm"
              >
                <Save className="w-4 h-4" /> Save All Loans
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip Month Requests Modal */}
      {isSkipModalOpen && selectedLoanForSkip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-40 transition-opacity">
          <div className="relative w-full max-w-3xl my-6 mx-auto px-4">
            <div className="border-0 rounded-2xl shadow-2xl relative flex flex-col w-full bg-white outline-none focus:outline-none overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-solid border-gray-100 rounded-t bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Manage Skip Month Requests</h3>
                  <p className="text-xs text-gray-500 mt-1">Loan Amount: ₹{selectedLoanForSkip.loanAmount} | Installment: ₹{selectedLoanForSkip.installmentAmount}</p>
                </div>
                <button
                  className="p-1.5 ml-auto border-0 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-150 transition-colors"
                  onClick={() => setIsSkipModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="relative p-6 flex-auto max-h-[60vh] overflow-y-auto space-y-6">
                {/* Form to submit new request */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                  <h4 className="font-semibold text-blue-900 text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Submit Skip Month Request
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Month to Skip</label>
                      <input
                        type="month"
                        className="input w-full py-1.5 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                        value={newSkipMonth}
                        onChange={(e) => setNewSkipMonth(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                        <input
                          type="text"
                          className="input w-full py-1.5 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                          value={newSkipReason}
                          onChange={(e) => setNewSkipReason(e.target.value)}
                          placeholder="e.g. Medical emergency / Festival expenses"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSkipRequest}
                        className="btn btn-primary py-1.5 px-4 rounded-lg text-sm font-semibold h-[38px] flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Submit Request
                      </button>
                    </div>
                  </div>
                </div>

                {/* List of Skip Requests */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-800 text-sm">Request History</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Month</th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Reason</th>
                          <th className="px-4 py-2.5 text-left font-semibold text-gray-600 w-28">Status</th>
                          <th className="px-4 py-2.5 text-center font-semibold text-gray-600 w-44">Actions / Actions By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {skipRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-800">{req.skipMonth}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{req.reason || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                req.status === 'Approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                                req.status === 'Declined' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {req.status === 'Pending' ? (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleUpdateSkipStatus(req.id!, 'Approved')}
                                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-2.5 py-1 rounded-md font-semibold transition-colors shadow-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateSkipStatus(req.id!, 'Declined')}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded-md font-semibold transition-colors shadow-sm"
                                  >
                                    Decline
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between px-2">
                                  <span className="text-xs text-gray-400 italic">Actioned</span>
                                  <button
                                    onClick={() => handleDeleteSkipRequest(req.id!)}
                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                    title="Delete Request"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {skipRequests.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-gray-400 italic bg-gray-50 text-xs">
                              No skip month requests submitted yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-4 border-t border-solid border-gray-100 bg-gray-50">
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold uppercase text-xs px-5 py-2.5 rounded-lg shadow hover:shadow-md outline-none focus:outline-none transition-all"
                  type="button"
                  onClick={() => setIsSkipModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal matching kumar adv.pdf */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-gray-200">
            
            {/* Top Controls Bar */}
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Print Payment Report / Voucher
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-md transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area - Printable Report matching kumar adv.pdf */}
            <div id="printable-voucher-area" className="p-6 bg-white border border-gray-300 rounded-lg text-black font-sans text-xs flex flex-col min-h-[275mm] justify-between space-y-4">
              <div className="space-y-4">
                {/* Header Title Section */}
                <div className="space-y-1 py-1 border-b border-black pb-2">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-extrabold tracking-wider text-black uppercase">
                      {companyNameDisplay}
                    </h2>
                    <p className="text-xs text-gray-800 leading-tight">
                      {companyAddressDisplay}
                    </p>
                    <h3 className="font-bold text-sm text-black pt-1">
                      {activeTab === 'allowance_advance' ? 'Salary Advance Payment Report' : 'Employee Loan Disbursement Report'}
                    </h3>
                  </div>
                  <div className="text-right text-[11px] font-semibold text-gray-800 pt-1">
                    Date : {formattedMonthRange}
                  </div>
                </div>

                {/* Group Meta */}
                <div className="space-y-0.5 text-xs font-bold pt-1">
                  <div><span className="text-gray-700">Unit : </span><span className="text-red-600">{companyNameDisplay}</span></div>
                  <div><span className="text-gray-700">Cate : </span><span className="text-emerald-700">WORKER</span></div>
                  <div><span className="text-gray-700">Dept : </span><span className="text-blue-700">{deptDisplay}</span></div>
                  <div><span className="text-gray-700">Pay Mode : </span><span className="text-black">CASH</span></div>
                </div>

                {/* Item Table */}
                <table className="w-full border-collapse border border-black text-xs text-black">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black font-bold text-black text-center">
                      <th className="border border-black px-2 py-1.5 w-12">S.No</th>
                      <th className="border border-black px-3 py-1.5 text-left">Employee Name</th>
                      <th className="border border-black px-2 py-1.5 w-24">Emp. No</th>
                      <th className="border border-black px-3 py-1.5 text-left">Designation</th>
                      <th className="border border-black px-2 py-1.5 w-28">Entry Date</th>
                      <th className="border border-black px-2 py-1.5 w-28">Repay Date</th>
                      <th className="border border-black px-3 py-1.5 w-28 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printModalItems.map((item: any, idx: number) => {
                      const edit: any = item.editState || {};
                      const amt = activeTab === 'allowance_advance' 
                        ? Number(edit.amount || 0) 
                        : Number(edit.loanAmount || 0);
                      const entryDate = activeTab === 'allowance_advance' 
                        ? (edit.date || getCurrentDate()) 
                        : (edit.disbursementDate || getCurrentDate());
                      const repayDate = activeTab === 'allowance_advance' 
                        ? (edit.date || getCurrentDate()) 
                        : (edit.toMonth || selectedMonth);

                      return (
                        <tr key={idx} className="border-b border-black text-black">
                          <td className="border border-black px-2 py-1.5 text-center font-medium">{idx + 1}</td>
                          <td className="border border-black px-3 py-1.5 font-bold">{item.employeeName}</td>
                          <td className="border border-black px-2 py-1.5 text-center font-semibold font-mono">{item.employeeCode}</td>
                          <td className="border border-black px-3 py-1.5">{item.designation}</td>
                          <td className="border border-black px-2 py-1.5 text-center">{formatDateDisplay(entryDate)}</td>
                          <td className="border border-black px-2 py-1.5 text-center">{formatDateDisplay(repayDate)}</td>
                          <td className="border border-black px-3 py-1.5 text-right font-extrabold">{amt.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Subtotals & Grand Totals */}
                <div className="space-y-1 text-xs font-bold text-right pt-2 border-b-2 border-black pb-2">
                  <div className="flex justify-end gap-12 text-blue-700">
                    <span>{deptDisplay} Total :</span>
                    <span className="w-28 text-right font-extrabold">{printTotalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-12 text-emerald-700">
                    <span>WORKER Total :</span>
                    <span className="w-28 text-right font-extrabold">{printTotalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-12 text-red-600">
                    <span>{companyNameDisplay} Total :</span>
                    <span className="w-28 text-right font-extrabold">{printTotalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end gap-12 text-black text-sm pt-1.5 border-t border-black">
                    <span>Report Total :</span>
                    <span className="w-28 text-right font-black underline ">{printTotalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures & Footer Anchored to Page Bottom */}
              <div className="mt-auto space-y-8 pt-10">
                {/* Signatures Footer */}
                <div className="grid grid-cols-3 text-center text-xs font-bold text-black">
                  <div>Prepared By</div>
                  <div>Approved By</div>
                  <div>Authorised Signatory</div>
                </div>

                {/* Document Footer */}
                <div className="pt-3 border-t border-black flex justify-between items-center text-[10px] text-gray-700">
                  <div>
                    <p>Print Date & Time : {new Date().toLocaleString()}</p>
                    <p className="italic">Software Developed by Tech3...</p>
                  </div>
                  <div className="font-semibold">Page 1 of 1</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
