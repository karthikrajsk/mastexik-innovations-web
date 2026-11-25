import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllEmployees } from '@/state/employeeSlice';
import {
  fetchIncentivesByMonth,
  createAttendanceIncentive,
  bulkCreateAttendanceIncentive,
  deleteAttendanceIncentive,
  type AttendanceIncentiveItem
} from '@/state/attendanceIncentiveSlice';
import {
  fetchProductionIncentivesByMonth,
  createProductionIncentive,
  bulkCreateProductionIncentive,
  deleteProductionIncentive,
  type ProductionIncentiveItem
} from '@/state/productionIncentiveSlice';
import {
  fetchAllSlabs,
  fetchGroupedSlabs,
  copyMonthSlabs,
  createSlab,
  updateSlab,
  deleteSlab,
  fetchSlabPreview,
  type AttendanceIncentiveSlabItem,
  type MonthlyGroupedSlabItem
} from '@/state/attendanceIncentiveSlabSlice';
import { CodesAPI } from '@/services/codes_api';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-toastify';
import {
  Save,
  Trash2,
  Send,
  Award,
  Factory,
  Calendar,
  Filter,
  Plus,
  UserPlus,
  Calculator,
  Settings,
  RefreshCw,
  AlertCircle,
  Edit3,
  X,
  Check,
  ShieldAlert,
  Info,
  UserCheck,
  Copy
} from 'lucide-react';

interface RowState {
  id?: number;
  amount: string;
  remarks: string;
  isSaved?: boolean;
  workedDays?: number;
  matchedSlabLabel?: string;
  systemAmount?: string;
  isOverridden?: boolean;
}

export default function AttendanceIncentivePage() {
  const dispatch = useDispatch<AppDispatch>();

  // Tab State: 'attendance' | 'production'
  const [activeTab, setActiveTab] = useState<'attendance' | 'production'>('attendance');

  const { employeeList } = useSelector((state: RootState) => state.employee);
  const { incentiveList: attList, loading: attLoading } = useSelector((state: RootState) => state.attendanceIncentive);
  const { incentiveList: prodList, loading: prodLoading } = useSelector((state: RootState) => state.productionIncentive);
  const { slabList, groupedSlabList, previewList, loading: slabLoading } = useSelector((state: RootState) => state.attendanceIncentiveSlab);

  const getCurrentMonth = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getLoggedInUserName = () => {
    try {
      const storedPayload = localStorage.getItem('authPayload');
      if (storedPayload) {
        const parsed = JSON.parse(storedPayload);
        const u = parsed.user || parsed;
        const name = u.userName || u.username || u.name || u.firstName || u.employeeName;
        if (name) return String(name);
      }

      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        const name = u.userName || u.username || u.name || u.firstName || u.employeeName;
        if (name) return String(name);
      }

      const userStr = localStorage.getItem('user') || localStorage.getItem('userData');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        const name = parsed.userName || parsed.username || parsed.name || parsed.firstName;
        if (name) return String(name);
      }

      const username = localStorage.getItem('userName') || localStorage.getItem('username');
      if (username) return String(username);
    } catch (e) {
      console.error('Error fetching logged-in user name:', e);
    }
    return 'ADMIN';
  };


  // Main Filter State
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [selectedIncentiveType, setSelectedIncentiveType] = useState<'Monthly' | 'Daily' | 'Fixed'>('Monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [fromDate, setFromDate] = useState<string>(getCurrentDate());
  const [toDate, setToDate] = useState<string>(getCurrentDate());
  const [designationList, setDesignationList] = useState<string[]>([]);

  // Row Edit Tracking State: { [employeeId: number]: RowState }
  const [rowEdits, setRowEdits] = useState<Record<number, RowState>>({});
  const [savingRows, setSavingRows] = useState<Record<number, boolean>>({});

  // Optional Single Employee Quick Add State
  const [showSingleAdd, setShowSingleAdd] = useState<boolean>(false);
  const [singleEmpId, setSingleEmpId] = useState<string>('');
  const [singleEmpCode, setSingleEmpCode] = useState<string>('');
  const [singleEmpName, setSingleEmpName] = useState<string>('');
  const [singleAmount, setSingleAmount] = useState<string>('');

  // Slab Master Management Modal State
  const [showSlabModal, setShowSlabModal] = useState<boolean>(false);
  const [editingSlabId, setEditingSlabId] = useState<number | null>(null);
  const [slabFormTargetMonth, setSlabFormTargetMonth] = useState<string>(getCurrentMonth());
  const [slabFormWorkingHours, setSlabFormWorkingHours] = useState<string>('12.0');
  const [slabFormMonthType, setSlabFormMonthType] = useState<'FEB' | 'DAYS_30' | 'DAYS_31'>('DAYS_30');
  const [slabFormMinDays, setSlabFormMinDays] = useState<string>('');
  const [slabFormMaxDays, setSlabFormMaxDays] = useState<string>('');
  const [slabFormRevisedDailySalary, setSlabFormRevisedDailySalary] = useState<string>('610');
  const [slabFormIncentiveAmount, setSlabFormIncentiveAmount] = useState<string>('');
  const [slabFormIsActive, setSlabFormIsActive] = useState<boolean>(true);

  // Copy Month State
  const [showCopySection, setShowCopySection] = useState<boolean>(false);
  const [copySourceMonth, setCopySourceMonth] = useState<string>('Default');
  const [copyTargetMonth, setCopyTargetMonth] = useState<string>(getCurrentMonth());

  const currentList = activeTab === 'attendance' ? attList : prodList;
  const isLoading = activeTab === 'attendance' ? attLoading : prodLoading;

  // 1. Fetch Employees & Slabs on mount
  useEffect(() => {
    dispatch(getAllEmployees({ limit: 1000 }));
    dispatch(fetchAllSlabs(false));
    dispatch(fetchGroupedSlabs(false));
  }, [dispatch]);


  // 2. Fetch Designation list from CodesAPI ("Designation") & merge with Employee Master designations
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
        console.error('Failed to load designations from CodesAPI:', err);
        const empDesigs = (employeeList || [])
          .map((e: any) => e.designation || e.employmentDetails?.designation)
          .filter(Boolean);
        setDesignationList(Array.from(new Set(empDesigs)).sort());
      }
    };
    loadDesignations();
  }, [employeeList]);

  // 3. Fetch Saved Incentives & Slab Calculations when filters change
  useEffect(() => {
    if (selectedMonth) {
      if (activeTab === 'attendance') {
        dispatch(fetchIncentivesByMonth(selectedMonth));
        dispatch(fetchSlabPreview({ month: selectedMonth, designation: selectedDesignation }));
      } else {
        dispatch(fetchProductionIncentivesByMonth(selectedMonth));
      }
    }
  }, [dispatch, selectedMonth, activeTab, selectedDesignation]);

  // 4. Pre-populate rowEdits map whenever currentList or previewList changes
  useEffect(() => {
    const previewMap = new Map<number, any>();
    (previewList || []).forEach(p => {
      if (p.employeeId) previewMap.set(p.employeeId, p);
    });

    const newEdits: Record<number, RowState> = {};
    
    // First map all employees from preview
    (previewList || []).forEach(p => {
      const empId = p.employeeId;
      const calcAmt = p.calculatedIncentiveAmount !== undefined && p.calculatedIncentiveAmount !== null ? String(p.calculatedIncentiveAmount) : '0';
      newEdits[empId] = {
        amount: calcAmt,
        remarks: '',
        workedDays: p.workedDays || 0,
        matchedSlabLabel: p.matchedSlabLabel || 'No Slab Matched',
        systemAmount: calcAmt,
        isOverridden: false
      };
    });

    // Then overwrite with saved entries if exist
    (currentList || []).forEach((item: any) => {
      if (item.employeeId) {
        const empId = item.employeeId;
        const prevRow = newEdits[empId] || {};
        const savedAmt = item.amount !== undefined && item.amount !== null ? String(item.amount) : '';
        const sysAmt = prevRow.systemAmount || savedAmt;
        const isOver = Boolean(sysAmt && savedAmt && Number(savedAmt) !== Number(sysAmt));

        newEdits[empId] = {
          ...prevRow,
          id: item.id,
          amount: savedAmt,
          remarks: item.remarks || '',
          isSaved: true,
          systemAmount: sysAmt,
          isOverridden: isOver
        };
      }
    });

    setRowEdits(newEdits);
  }, [currentList, previewList]);

  // Designation Filter Options
  const designationSelectOptions = useMemo(() => {
    const opts = [{ value: 'ALL', label: 'All Designations' }];
    designationList.forEach(desig => {
      opts.push({ value: desig, label: desig });
    });
    return opts;
  }, [designationList]);

  const isFlagEnabled = (val: any) => val === 1 || val === true || val === '1';

  // Filter Employees based on selected Designation & Incentive Applicability
  const filteredEmployees = useMemo(() => {
    return (employeeList || []).filter((emp: any) => {
      if (emp.isRelieved && Number(emp.isRelieved) !== 0) return false;

      if (activeTab === 'attendance') {
        const canAtt = isFlagEnabled(emp.attendanceIncentiveApplicable) || 
                       isFlagEnabled(emp.employmentDetails?.isAttendanceIncentiveApplicable);
        if (!canAtt) return false;
      } else if (activeTab === 'production') {
        const canProd = isFlagEnabled(emp.productionIncentiveApplicable) || 
                       isFlagEnabled(emp.employmentDetails?.isProductionIncentiveApplicable);
        if (!canProd) return false;
      }

      if (!selectedDesignation || selectedDesignation === 'ALL') return true;
      const empDesig = (emp.designation || emp.employmentDetails?.designation || '').trim();
      return empDesig.toLowerCase() === selectedDesignation.trim().toLowerCase();
    });
  }, [employeeList, selectedDesignation, activeTab]);

  // Employee Select Options for optional Single Quick Add
  const employeeOptions = useMemo(() => {
    return filteredEmployees.map((emp: any) => {
      const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim() || `Emp #${emp.id}`;
      const code = emp.employeeCode || emp.code || '';
      return {
        value: String(emp.id),
        label: `${fullName} ${code ? `(${code})` : ''}`,
        code: code,
        name: fullName,
        raw: emp
      };
    });
  }, [filteredEmployees]);

  // Auto-Calculate Slabs Handler across loaded rows
  const handleAutoCalculateSlabs = async () => {
    toast.info("Calculating slab incentive amounts based on attendance days...");
    const result = await dispatch(fetchSlabPreview({ month: selectedMonth, designation: selectedDesignation }));
    if (fetchSlabPreview.fulfilled.match(result)) {
      const previews = result.payload || [];
      const updatedCount = previews.length;
      
      setRowEdits(prev => {
        const next = { ...prev };
        previews.forEach((p: any) => {
          const empId = p.employeeId;
          const calcAmt = p.calculatedIncentiveAmount !== undefined ? String(p.calculatedIncentiveAmount) : '0';
          const existing = next[empId] || {};
          
          const keepOverride = existing.isOverridden && existing.amount !== calcAmt;
          
          next[empId] = {
            ...existing,
            workedDays: p.workedDays || 0,
            matchedSlabLabel: p.matchedSlabLabel || 'No Slab Matched',
            systemAmount: calcAmt,
            amount: keepOverride ? existing.amount : calcAmt,
            isOverridden: keepOverride
          };
        });
        return next;
      });

      toast.success(`Calculated incentive slabs for ${updatedCount} employees`);
    }
  };

  // Row Amount Input Handler
  const handleAmountChange = (empId: number, amountVal: string) => {
    setRowEdits(prev => {
      const row = prev[empId] || {};
      const sysAmt = row.systemAmount || '';
      const isOver = Boolean(sysAmt && amountVal && Number(amountVal) !== Number(sysAmt));

      return {
        ...prev,
        [empId]: {
          ...row,
          amount: amountVal,
          isOverridden: isOver,
          remarks: isOver && (!row.remarks || row.remarks === '') ? 'Manual override approval' : row.remarks
        }
      };
    });
  };

  // Row Remarks Handler
  const handleRemarksChange = (empId: number, remarksVal: string) => {
    setRowEdits(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        remarks: remarksVal
      }
    }));
  };

  // Single Row Save Handler
  const handleSaveRow = async (emp: any) => {
    const empId = Number(emp.id);
    const edit = rowEdits[empId];
    if (!edit || !edit.amount || Number(edit.amount) < 0) {
      toast.error(`Please enter a valid incentive amount for ${emp.employeeName}`);
      return;
    }

    setSavingRows(prev => ({ ...prev, [empId]: true }));
    try {
      const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
      const code = emp.employeeCode || emp.code || '';

      const payload: any = {
        id: edit.id,
        employeeId: empId,
        employeeCode: code,
        employeeName: fullName,
        month: selectedIncentiveType === 'Daily' ? fromDate.substring(0, 7) : selectedMonth,
        incentiveDate: selectedIncentiveType === 'Daily' ? fromDate : null,
        incentiveType: selectedIncentiveType,
        amount: Number(edit.amount),
        dailyRate: selectedIncentiveType === 'Daily' ? Number(edit.amount) : null,
        remarks: edit.remarks || (edit.isOverridden ? 'Manual override' : '')
      };

      if (activeTab === 'attendance') {
        const result = await dispatch(createAttendanceIncentive(payload));
        if (createAttendanceIncentive.fulfilled.match(result)) {
          dispatch(fetchIncentivesByMonth(selectedMonth));
        }
      } else {
        const result = await dispatch(createProductionIncentive(payload));
        if (createProductionIncentive.fulfilled.match(result)) {
          dispatch(fetchProductionIncentivesByMonth(selectedMonth));
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving incentive');
    } finally {
      setSavingRows(prev => ({ ...prev, [empId]: false }));
    }
  };

  // Bulk Save All Handler
  const handleSaveAll = async () => {
    const itemsToSave: any[] = [];

    filteredEmployees.forEach((emp: any) => {
      const empId = Number(emp.id);
      const edit = rowEdits[empId];
      if (edit && edit.amount !== undefined && edit.amount !== '' && Number(edit.amount) >= 0) {
        const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
        const code = emp.employeeCode || emp.code || '';

        itemsToSave.push({
          id: edit.id,
          employeeId: empId,
          employeeCode: code,
          employeeName: fullName,
          month: selectedIncentiveType === 'Daily' ? fromDate.substring(0, 7) : selectedMonth,
          incentiveDate: selectedIncentiveType === 'Daily' ? fromDate : null,
          incentiveType: selectedIncentiveType,
          amount: Number(edit.amount),
          dailyRate: selectedIncentiveType === 'Daily' ? Number(edit.amount) : null,
          remarks: edit.remarks || (edit.isOverridden ? 'Manual override' : '')
        });
      }
    });

    if (itemsToSave.length === 0) {
      toast.warn('No incentive amounts entered to save.');
      return;
    }

    if (activeTab === 'attendance') {
      const result = await dispatch(bulkCreateAttendanceIncentive(itemsToSave));
      if (bulkCreateAttendanceIncentive.fulfilled.match(result)) {
        dispatch(fetchIncentivesByMonth(selectedMonth));
      }
    } else {
      const result = await dispatch(bulkCreateProductionIncentive(itemsToSave));
      if (bulkCreateProductionIncentive.fulfilled.match(result)) {
        dispatch(fetchProductionIncentivesByMonth(selectedMonth));
      }
    }
  };

  // Delete Handler
  const handleDeleteRow = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this incentive entry?')) {
      if (activeTab === 'attendance') {
        await dispatch(deleteAttendanceIncentive(id));
        dispatch(fetchIncentivesByMonth(selectedMonth));
      } else {
        await dispatch(deleteProductionIncentive(id));
        dispatch(fetchProductionIncentivesByMonth(selectedMonth));
      }
    }
  };

  // Single Quick Add Handler
  const handleSingleAddEmployeeChange = (val: string) => {
    setSingleEmpId(val);
    const matched = employeeOptions.find(opt => opt.value === val);
    if (matched) {
      setSingleEmpCode(matched.code);
      setSingleEmpName(matched.name);
    } else {
      setSingleEmpCode('');
      setSingleEmpName('');
    }
  };

  const handleSingleAddSubmit = () => {
    if (!singleEmpId) {
      toast.error('Please select an employee');
      return;
    }
    if (!singleAmount || Number(singleAmount) < 0) {
      toast.error('Please enter valid incentive amount');
      return;
    }

    const empId = Number(singleEmpId);
    setRowEdits(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        amount: singleAmount,
        remarks: 'Quick Add entry'
      }
    }));

    toast.info(`Updated incentive details for ${singleEmpName} in table list`);
    setSingleEmpId('');
    setSingleEmpCode('');
    setSingleEmpName('');
    setSingleAmount('');
  };

  // Copy Month Rules Handler
  const handleCopyMonthSlabs = async () => {
    if (!copySourceMonth) {
      toast.error('Please select a source month');
      return;
    }
    if (!copyTargetMonth) {
      toast.error('Please select a target month');
      return;
    }
    if (copySourceMonth.trim().toLowerCase() === copyTargetMonth.trim().toLowerCase()) {
      toast.error('Source month and target month must be different');
      return;
    }

    const currentUser = getLoggedInUserName();
    const result = await dispatch(copyMonthSlabs({
      sourceMonth: copySourceMonth,
      targetMonth: copyTargetMonth,
      userName: currentUser
    }));

    if (copyMonthSlabs.fulfilled.match(result)) {
      dispatch(fetchAllSlabs(false));
      dispatch(fetchGroupedSlabs(false));
      setShowCopySection(false);
    }
  };

  // Slab Master Form Submit Handler (Create or Update)
  const handleSlabMasterSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slabFormMinDays || Number(slabFormMinDays) < 0) {
      toast.error('Please enter a valid minimum days value');
      return;
    }
    if (!slabFormIncentiveAmount || Number(slabFormIncentiveAmount) < 0) {
      toast.error('Please enter a valid incentive amount');
      return;
    }

    const currentUser = getLoggedInUserName();

    const payload: AttendanceIncentiveSlabItem = {
      id: editingSlabId || undefined,
      month: slabFormTargetMonth || null,
      workingHours: Number(slabFormWorkingHours || 12.0),
      monthType: slabFormMonthType,
      minDays: Number(slabFormMinDays),
      maxDays: slabFormMaxDays ? Number(slabFormMaxDays) : null,
      revisedDailySalary: slabFormRevisedDailySalary ? Number(slabFormRevisedDailySalary) : 0,
      incentiveAmount: Number(slabFormIncentiveAmount),
      isActive: slabFormIsActive,
      createdBy: editingSlabId ? undefined : currentUser,
      updatedBy: currentUser
    };

    if (editingSlabId) {
      const result = await dispatch(updateSlab({ id: editingSlabId, data: payload }));
      if (updateSlab.fulfilled.match(result)) {
        resetSlabForm();
        dispatch(fetchAllSlabs(false));
        dispatch(fetchGroupedSlabs(false));
      }
    } else {
      const result = await dispatch(createSlab(payload));
      if (createSlab.fulfilled.match(result)) {
        resetSlabForm();
        dispatch(fetchAllSlabs(false));
        dispatch(fetchGroupedSlabs(false));
      }
    }
  };

  const handleEditSlab = (slab: AttendanceIncentiveSlabItem) => {
    setEditingSlabId(slab.id || null);
    setSlabFormTargetMonth(slab.month || getCurrentMonth());
    setSlabFormWorkingHours(String(slab.workingHours || 12.0));
    setSlabFormMonthType(slab.monthType || 'DAYS_30');
    setSlabFormMinDays(String(slab.minDays));
    setSlabFormMaxDays(slab.maxDays !== undefined && slab.maxDays !== null ? String(slab.maxDays) : '');
    setSlabFormRevisedDailySalary(String(slab.revisedDailySalary || 610));
    setSlabFormIncentiveAmount(String(slab.incentiveAmount));
    setSlabFormIsActive(slab.isActive !== false);
  };

  const handleDeleteSlabItem = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this slab master entry?')) {
      await dispatch(deleteSlab(id));
      dispatch(fetchAllSlabs(false));
      dispatch(fetchGroupedSlabs(false));
    }
  };

  const resetSlabForm = () => {
    setEditingSlabId(null);
    setSlabFormTargetMonth(getCurrentMonth());
    setSlabFormWorkingHours('12.0');
    setSlabFormMonthType('DAYS_30');
    setSlabFormMinDays('');
    setSlabFormMaxDays('');
    setSlabFormRevisedDailySalary('610');
    setSlabFormIncentiveAmount('');
    setSlabFormIsActive(true);
  };

  // Processed Data for Application DataTable
  const processedTableData = useMemo(() => {
    return filteredEmployees.map((emp: any, index: number) => {
      const empId = Number(emp.id);
      const edit = rowEdits[empId] || {
        amount: '',
        remarks: '',
        workedDays: 0,
        matchedSlabLabel: 'No Slab Matched',
        systemAmount: '0',
        isOverridden: false
      };
      const designation = emp.designation || emp.employmentDetails?.designation || '-';

      return {
        id: edit.id,
        serialNo: index + 1,
        employeeId: empId,
        employeeCode: emp.employeeCode || emp.code || '-',
        employeeName: emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim() || `Emp #${empId}`,
        designation: designation,
        workedDays: edit.workedDays || 0,
        matchedSlabLabel: edit.matchedSlabLabel || 'No Slab Matched',
        systemAmount: edit.systemAmount || '0',
        amount: edit.amount,
        remarks: edit.remarks,
        isOverridden: edit.isOverridden,
        isSaved: Boolean(edit.isSaved && edit.id),
        rawEmployee: emp
      };
    });
  }, [filteredEmployees, rowEdits]);

  // DataTable Column Definitions with Visual Context & Override Badge
  const columns = useMemo(() => {
    const baseCols: any[] = [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true
      },
      {
        Header: 'Employee Code',
        accessor: 'employeeCode',
        Cell: ({ value }: { value: any }) => <span className="font-semibold text-blue-700">{value}</span>
      },
      {
        Header: 'Employee Name',
        accessor: 'employeeName',
        Cell: ({ value }: { value: any }) => <span className="font-bold text-gray-900">{value}</span>
      },
      {
        Header: 'Designation',
        accessor: 'designation',
        Cell: ({ value }: { value: any }) => (
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded text-[11px] border border-indigo-100">
            {value}
          </span>
        )
      }
    ];

    if (activeTab === 'attendance') {
      baseCols.push(
        {
          Header: 'Worked Days',
          accessor: 'workedDays',
          Cell: ({ value }: { value: any }) => (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded text-xs border border-blue-200 flex items-center gap-1 w-fit">
              <Calendar className="w-3 h-3 text-blue-600" />
              {Number(value || 0).toFixed(1)} Days
            </span>
          )
        },
        {
          Header: 'Applied Slab',
          accessor: 'matchedSlabLabel',
          Cell: ({ value }: { value: any }) => {
            const isMatched = value && !value.includes('No Slab');
            return (
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                isMatched
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {value || 'No Slab Matched'}
              </span>
            );
          }
        },
        {
          Header: 'System Amount',
          accessor: 'systemAmount',
          Cell: ({ value }: { value: any }) => (
            <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-xs">
              ₹{Number(value || 0).toLocaleString('en-IN')}
            </span>
          )
        }
      );
    }

    baseCols.push(
      {
        Header: 'Amount (₹)',
        accessor: 'amount',
        width: 110,
        Cell: ({ row }: { row: any }) => {
          const empId = row.original.employeeId;
          const edit = rowEdits[empId] || {};
          const val = edit.amount || '';
          const isOverridden = activeTab === 'attendance' && edit.isOverridden;

          return (
            <div className="relative w-28 max-w-[110px]">
              <span className="absolute left-2 top-1.5 text-gray-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={val}
                onChange={e => handleAmountChange(empId, e.target.value)}
                className={`w-full pl-5 pr-1 py-1 border rounded text-xs focus:outline-none focus:ring-1 font-bold text-gray-900 ${
                  isOverridden
                    ? 'border-amber-500 bg-amber-50/60 focus:ring-amber-500'
                    : 'border-gray-300 bg-white focus:ring-indigo-500'
                }`}
              />
              {isOverridden && (
                <span className="absolute -right-1 -top-1 px-1 py-0.2 bg-amber-600 text-white font-extrabold text-[8px] rounded uppercase tracking-wider shadow-xs">
                  Ovr
                </span>
              )}
            </div>
          );
        }
      },
      {
        Header: 'Remarks',
        accessor: 'remarks',
        Cell: ({ row }: { row: any }) => {
          const empId = row.original.employeeId;
          const edit = rowEdits[empId] || {};
          const val = edit.remarks || '';
          const isOverridden = activeTab === 'attendance' && edit.isOverridden;

          return (
            <input
              type="text"
              placeholder={isOverridden ? "Reason for override..." : "Remarks..."}
              value={val}
              onChange={e => handleRemarksChange(empId, e.target.value)}
              className={`w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 text-gray-700 ${
                isOverridden
                  ? 'border-amber-400 bg-amber-50/40 focus:ring-amber-500 font-medium'
                  : 'border-gray-200 bg-white focus:ring-indigo-500'
              }`}
            />
          );
        }
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const emp = row.original.rawEmployee;
          const empId = row.original.employeeId;
          const isSaving = savingRows[empId];
          const isSaved = row.original.isSaved;

          return (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => handleSaveRow(emp)}
                disabled={isSaving}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                title={isSaved ? 'Update Saved Record' : 'Save Record'}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : isSaved ? 'Updated' : 'Save'}</span>
              </button>

              {isSaved && row.original.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteRow(row.original.id)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete Entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        }
      }
    );

    return baseCols;
  }, [activeTab, rowEdits, savingRows]);

  return (
    <div className="p-3 max-w-full mx-auto space-y-3 bg-gray-50 min-h-screen text-xs">
      {/* Tab Navigation Bar: Attendance Incentive vs Production Incentive */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Attendance Incentive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('production')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'production'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Production Incentive</span>
          </button>
        </div>

        {/* Master Configuration Button */}
        {activeTab === 'attendance' && (
          <button
            type="button"
            onClick={() => setShowSlabModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-700 text-white font-bold rounded-lg hover:bg-purple-800 transition-colors shadow-sm text-xs"
          >
            <Settings className="w-4 h-4" />
            <span>Manage Incentive Slabs</span>
          </button>
        )}
      </div>

      {/* Top Header & Main Filter Controls */}
      <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-md ${activeTab === 'attendance' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {activeTab === 'attendance' ? <Award className="w-5 h-5" /> : <Factory className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                {activeTab === 'attendance' ? 'Attendance Incentive Configuration' : 'Production Incentive Configuration'}
              </h1>
              <p className="text-[11px] text-gray-500">
                Configure {activeTab === 'attendance' ? 'attendance' : 'production'} incentives per employee against designation & date filters
              </p>
            </div>
          </div>

          <div className="mt-2 md:mt-0 flex items-center space-x-2">
            {activeTab === 'attendance' && (
              <button
                type="button"
                onClick={handleAutoCalculateSlabs}
                className="flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded hover:bg-purple-100 font-bold text-xs transition-colors shadow-xs"
                title="Calculate incentive amounts based on attendance days and active slab master definitions"
              >
                <Calculator className="w-3.5 h-3.5 text-purple-600" />
                <span>Auto-Calculate Slabs</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSingleAdd(!showSingleAdd)}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200 font-medium text-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-gray-500" />
              <span>{showSingleAdd ? 'Hide Single Quick Add' : 'Optional Single Quick Add'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Designation Filter -> Incentive Type -> Date Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-gray-50/80 p-2.5 rounded-md border border-gray-200">
          {/* Filter 1: Designation Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <Filter className={`w-3 h-3 ${activeTab === 'attendance' ? 'text-indigo-600' : 'text-emerald-600'}`} />
              Designation Filter:
            </label>
            <CommonSearchableSelect
              options={designationSelectOptions}
              value={selectedDesignation}
              onChange={val => setSelectedDesignation(val)}
              placeholder="Select Designation..."
              className="w-full text-xs"
            />
          </div>

          {/* Filter 2: Incentive Type (positioned right next to Designation Filter) */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <Award className={`w-3 h-3 ${activeTab === 'attendance' ? 'text-indigo-600' : 'text-emerald-600'}`} />
              Incentive Type:
            </label>
            <select
              value={selectedIncentiveType}
              onChange={e => setSelectedIncentiveType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-xs"
            >
              <option value="Monthly">Monthly Incentive</option>
              <option value="Daily">Daily Incentive Rate</option>
              <option value="Fixed">Fixed Bonus</option>
            </select>
          </div>

          {/* Filter 3: Conditional Target Month / Incentive Date Pickers */}
          {selectedIncentiveType !== 'Daily' ? (
            /* Target Month Picker for Monthly / Fixed */
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
                <Calendar className={`w-3 h-3 ${activeTab === 'attendance' ? 'text-indigo-600' : 'text-emerald-600'}`} />
                Target Month:
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          ) : (
            /* Daily Incentive Date Range Pickers: From Date & To Date */
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600" />
                Incentive Date (From - To):
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-indigo-300 rounded text-xs font-semibold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
                <span className="text-gray-400 font-bold text-xs">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-indigo-300 rounded text-xs font-semibold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* Filter Summary Stats & Bulk Save Button */}
          <div className="flex items-center justify-between md:justify-end space-x-2">
            <div className="text-right text-[11px] text-gray-500 mr-2">
              Showing <strong className="text-gray-900">{filteredEmployees.length}</strong> employees
            </div>
            <button
              type="button"
              onClick={handleSaveAll}
              className={`flex items-center space-x-1.5 px-4 py-1.5 text-white font-bold rounded transition-colors shadow-sm text-xs ${
                activeTab === 'attendance' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save All Entries</span>
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner for Cash Incentive Policy */}
      {activeTab === 'attendance' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-purple-700 flex-shrink-0" />
            <span className="text-[11px] text-purple-900 font-medium">
              Factory Policy: Slabs are evaluated against employee <strong>working hours</strong> & <strong>month duration</strong> (FEB, 30-Day, 31-Day). <strong>₹3,000 Cash Incentive</strong> applies for 3 consecutive months without leave.
            </span>
          </div>
          <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-bold uppercase">
            Auto Slab Sync Active
          </span>
        </div>
      )}

      {/* Optional Single Employee Quick Add Panel */}
      {showSingleAdd && (
        <div className="bg-indigo-50/40 rounded-lg p-3 border border-indigo-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-indigo-900 border-b border-indigo-200 pb-1 flex items-center justify-between">
            <span>Optional Single Employee Quick Add</span>
            <span className="text-[11px] font-normal text-indigo-700">Fill details to populate table row</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-700 uppercase">Employee</label>
              <CommonSearchableSelect
                options={employeeOptions}
                value={singleEmpId}
                onChange={handleSingleAddEmployeeChange}
                placeholder="Select Employee..."
                className="w-full text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-700 uppercase">Employee Code</label>
              <input
                type="text"
                readOnly
                value={singleEmpCode}
                placeholder="Autofetched"
                className="w-full px-2 py-1 border border-gray-200 rounded bg-gray-50 text-xs font-semibold text-gray-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-700 uppercase">Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 1500"
                value={singleAmount}
                onChange={e => setSingleAmount(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleSingleAddSubmit}
                className="w-full flex items-center justify-center space-x-1 px-3 py-1 bg-indigo-700 text-white rounded hover:bg-indigo-800 font-semibold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply to Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Virtualized DataTable Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
        <DataTable
          title={`Employee ${activeTab === 'attendance' ? 'Attendance' : 'Production'} Incentive List (${selectedDesignation === 'ALL' ? 'All Designations' : selectedDesignation} - ${selectedIncentiveType} - ${selectedIncentiveType === 'Daily' ? `${fromDate} to ${toDate}` : selectedMonth})`}
          data={processedTableData}
          columns={columns}
          loading={isLoading || slabLoading}
          showActions={false}
          showExport={true}
          virtualScroll={true}
          virtualScrollHeight="600px"
          initialPageSize={1000}
          rowHeight={44}
          filterPlaceholder="Search employee code, name, designation, remarks..."
        />
      </div>

      {/* Modal Drawer: Manage Incentive Slab Master */}
      <Modal
        isOpen={showSlabModal}
        onClose={() => {
          setShowSlabModal(false);
          resetSlabForm();
          setShowCopySection(false);
        }}
        title="Attendance Incentive Slab Master Management"
        size="5xl"
      >
        <div className="space-y-4 text-xs p-1">
          {/* Header Action Toolbar for Copy Month Rules */}
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md border border-gray-200">
            <span className="font-semibold text-gray-700 flex items-center gap-1.5 text-xs">
              <Calendar className="w-4 h-4 text-purple-700" />
              Monthly Rule Storage & Replication
            </span>
            <button
              type="button"
              onClick={() => setShowCopySection(!showCopySection)}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-900 hover:bg-purple-200 rounded font-bold text-xs transition-colors border border-purple-300"
            >
              <Copy className="w-3.5 h-3.5 text-purple-700" />
              <span>{showCopySection ? 'Hide Copy Rules Tool' : 'Copy Rules to Another Month'}</span>
            </button>
          </div>

          {/* Copy Rules across Months Tool */}
          {showCopySection && (
            <div className="bg-purple-100/50 p-3 rounded-lg border border-purple-300 space-y-2">
              <div className="text-xs font-bold text-purple-900 flex items-center justify-between border-b border-purple-200 pb-1">
                <span>Copy Slab Rules Across Months</span>
                <span className="text-[11px] text-purple-700 font-normal">Replicate master definitions from one month to another</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 uppercase">Source Month</label>
                  <select
                    value={copySourceMonth}
                    onChange={e => setCopySourceMonth(e.target.value)}
                    className="w-full px-2 py-1.5 border border-purple-300 rounded text-xs font-bold text-gray-900 bg-white"
                  >
                    <option value="Default">Default / All Months</option>
                    {(groupedSlabList || []).map(g => (
                      <option key={g.id} value={g.month}>{g.month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 uppercase">Target Month</label>
                  <input
                    type="month"
                    value={copyTargetMonth}
                    onChange={e => setCopyTargetMonth(e.target.value)}
                    className="w-full px-2 py-1.5 border border-purple-300 rounded text-xs font-bold text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleCopyMonthSlabs}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-purple-700 text-white rounded font-bold hover:bg-purple-800 transition-colors shadow-sm text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Rules to {copyTargetMonth || 'Target Month'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form to Create/Edit Slab */}
          <form onSubmit={handleSlabMasterSave} className="bg-purple-50/60 p-3 rounded-lg border border-purple-200 space-y-3">
            <div className="text-xs font-bold text-purple-900 border-b border-purple-200 pb-1 flex items-center justify-between">
              <span>{editingSlabId ? 'Edit Incentive Slab Definition' : 'Add New Incentive Slab Definition'}</span>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-purple-800 bg-purple-100 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-purple-700" /> User: {getLoggedInUserName()}
                </span>
                {editingSlabId && (
                  <button
                    type="button"
                    onClick={resetSlabForm}
                    className="text-[10px] text-purple-700 underline font-semibold"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 uppercase">Target Month (Optional)</label>
                <input
                  type="month"
                  value={slabFormTargetMonth}
                  onChange={e => setSlabFormTargetMonth(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 uppercase">Working Hours (Hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={slabFormWorkingHours}
                  onChange={e => setSlabFormWorkingHours(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs font-bold text-gray-900"
                  placeholder="e.g. 12.0"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 uppercase">Month Type</label>
                <select
                  value={slabFormMonthType}
                  onChange={e => setSlabFormMonthType(e.target.value as any)}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs font-bold text-gray-900"
                >
                  <option value="FEB">February (28/29 Days)</option>
                  <option value="DAYS_30">30-Day Month (Apr, Jun, Sep, Nov)</option>
                  <option value="DAYS_31">31-Day Month (Jan, Mar, May, Jul, Aug, Oct, Dec)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 uppercase">Revised Daily Salary (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={slabFormRevisedDailySalary}
                  onChange={e => setSlabFormRevisedDailySalary(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs font-bold text-gray-900"
                  placeholder="e.g. 610"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 uppercase">Min Attendance Days</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={slabFormMinDays}
                  onChange={e => setSlabFormMinDays(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs font-bold text-gray-900"
                  placeholder="e.g. 24.0"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 uppercase">Max Attendance Days (Empty = & above)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={slabFormMaxDays}
                  onChange={e => setSlabFormMaxDays(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs font-bold text-gray-900"
                  placeholder="e.g. 24.5"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 uppercase">Incentive Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={slabFormIncentiveAmount}
                  onChange={e => setSlabFormIncentiveAmount(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs font-bold font-mono text-purple-900"
                  placeholder="e.g. 800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-purple-200">
              <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={slabFormIsActive}
                  onChange={e => setSlabFormIsActive(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Active Rule</span>
              </label>

              <button
                type="submit"
                className="flex items-center space-x-1 px-4 py-1.5 bg-purple-700 text-white font-bold rounded hover:bg-purple-800 transition-colors text-xs shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingSlabId ? 'Update Slab' : 'Save Slab Rule'}</span>
              </button>
            </div>
          </form>

          {/* Grouped Display of Configured Slab Master Items by Month */}
          <div className="space-y-4">
            {(!groupedSlabList || groupedSlabList.length === 0) ? (
              <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500 font-medium">
                No incentive slab rules configured yet. Fill the form above to create the first rule.
              </div>
            ) : (
              groupedSlabList.map((group: MonthlyGroupedSlabItem) => (
                <div key={group.id} className="border border-purple-200 rounded-lg overflow-hidden bg-white shadow-xs">
                  {/* Group Month Header */}
                  <div className="bg-purple-100/70 px-3 py-2 border-b border-purple-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-purple-900 text-xs tracking-wide">
                        {group.month === 'Default' ? 'Default / All Months Policy' : `Month: ${group.month}`}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-200 text-purple-900 font-bold rounded-full text-[10px]">
                        {group.data?.length || 0} Rules Defined
                      </span>
                    </div>
                    {group.month !== 'Default' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSlabFormTargetMonth(group.month);
                          toast.info(`Target month set to ${group.month} in form`);
                        }}
                        className="text-[10px] font-bold text-purple-800 hover:text-purple-950 underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Rule for {group.month}
                      </button>
                    )}
                  </div>

                  {/* Group Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 font-bold text-gray-700 border-b">
                        <tr>
                          <th className="p-2">Target Month</th>
                          <th className="p-2">Shift Hours</th>
                          <th className="p-2">Month Type</th>
                          <th className="p-2">Days Range</th>
                          <th className="p-2">Revised Daily (₹)</th>
                          <th className="p-2">Incentive Amount (₹)</th>
                          <th className="p-2">Created By</th>
                          <th className="p-2">Updated By</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(group.data || []).map((slab: AttendanceIncentiveSlabItem) => (
                          <tr key={slab.id} className="hover:bg-purple-50/30">
                            <td className="p-2 font-semibold text-gray-800">
                              {slab.month ? (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-800 font-bold rounded border border-purple-200 text-[10px]">
                                  {slab.month}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic text-[10px]">All Months</span>
                              )}
                            </td>
                            <td className="p-2 font-bold text-blue-800">{slab.workingHours} Hrs</td>
                            <td className="p-2 font-semibold">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                slab.monthType === 'FEB' ? 'bg-pink-100 text-pink-800' :
                                slab.monthType === 'DAYS_30' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {slab.monthType}
                              </span>
                            </td>
                            <td className="p-2 font-bold text-gray-900">
                              {slab.minDays} {slab.maxDays !== undefined && slab.maxDays !== null ? `– ${slab.maxDays}` : '+'} Days
                            </td>
                            <td className="p-2 font-semibold text-gray-700">₹{Number(slab.revisedDailySalary || 0).toLocaleString('en-IN')}</td>
                            <td className="p-2 font-extrabold text-purple-900">₹{Number(slab.incentiveAmount || 0).toLocaleString('en-IN')}</td>
                            <td className="p-2 text-gray-700 font-medium text-[11px]">{slab.createdBy || '-'}</td>
                            <td className="p-2 text-gray-700 font-medium text-[11px]">{slab.updatedBy || '-'}</td>
                            <td className="p-2 font-semibold">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${slab.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                                {slab.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-2 text-right space-x-1">
                              <button
                                type="button"
                                onClick={() => handleEditSlab(slab)}
                                className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                                title="Edit Slab Rule"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlabItem(slab.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Delete Slab Rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

