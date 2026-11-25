import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllEmployees } from '@/state/employeeSlice';
import {
  fetchCanteenDeductionsByMonth,
  createCanteenDeduction,
  bulkCreateCanteenDeduction,
  deleteCanteenDeduction,
  type CanteenDeductionItem
} from '@/state/canteenDeductionSlice';
import { CodesAPI } from '@/services/codes_api';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { DataTable } from '@/components/data/DataTable';
import { toast } from 'react-toastify';
import { Save, Trash2, Send, Utensils, Calendar, Filter, Plus, UserPlus, Info, CheckCircle2 } from 'lucide-react';

interface RowState {
  id?: number;
  canteenAmount: string;
  dailyDeductionRate: string;
  remarks: string;
  isSaved?: boolean;
}

export default function CanteenDeductionPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { employeeList } = useSelector((state: RootState) => state.employee);
  const { canteenList, loading } = useSelector((state: RootState) => state.canteenDeduction);

  const getCurrentMonth = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Main Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [designationList, setDesignationList] = useState<string[]>([]);
  const [effectiveDate, setEffectiveDate] = useState<string>(getCurrentDate());

  // Row Edit Tracking State: { [employeeId: number]: RowState }
  const [rowEdits, setRowEdits] = useState<Record<number, RowState>>({});
  const [savingRows, setSavingRows] = useState<Record<number, boolean>>({});

  // Optional Single Employee Quick Add State
  const [showSingleAdd, setShowSingleAdd] = useState<boolean>(false);
  const [singleEmpId, setSingleEmpId] = useState<string>('');
  const [singleEmpCode, setSingleEmpCode] = useState<string>('');
  const [singleEmpName, setSingleEmpName] = useState<string>('');
  const [singleAmount, setSingleAmount] = useState<string>('');
  const [singleDaily, setSingleDaily] = useState<string>('');

  // 1. Fetch Employees on mount
  useEffect(() => {
    dispatch(getAllEmployees({ limit: 1000 }));
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
        // Fallback to employee master designations
        const empDesigs = (employeeList || [])
          .map((e: any) => e.designation || e.employmentDetails?.designation)
          .filter(Boolean);
        setDesignationList(Array.from(new Set(empDesigs)).sort());
      }
    };
    loadDesignations();
  }, [employeeList]);

  // 3. Fetch Saved Canteen Deductions when month changes
  useEffect(() => {
    if (selectedMonth) {
      dispatch(fetchCanteenDeductionsByMonth(selectedMonth));
    }
  }, [dispatch, selectedMonth]);

  // 4. Pre-populate rowEdits map whenever canteenList (saved entries) changes
  useEffect(() => {
    const newEdits: Record<number, RowState> = {};
    (canteenList || []).forEach((item: any) => {
      if (item.employeeId) {
        newEdits[item.employeeId] = {
          id: item.id,
          canteenAmount: item.canteenAmount !== undefined && item.canteenAmount !== null ? String(item.canteenAmount) : '',
          dailyDeductionRate: item.dailyDeductionRate !== undefined && item.dailyDeductionRate !== null ? String(item.dailyDeductionRate) : '',
          remarks: item.remarks || '',
          isSaved: true
        };
      }
    });
    setRowEdits(newEdits);
  }, [canteenList]);

  // Designation Filter Options for Dropdown
  const designationSelectOptions = useMemo(() => {
    const opts = [{ value: 'ALL', label: 'All Designations' }];
    designationList.forEach(desig => {
      opts.push({ value: desig, label: desig });
    });
    return opts;
  }, [designationList]);

  const isFlagEnabled = (val: any) => val === 1 || val === true || val === '1';

  // Filter Employees based on selected Designation & Canteen Applicability
  const filteredEmployees = useMemo(() => {
    return (employeeList || []).filter((emp: any) => {
      if (emp.isRelieved && Number(emp.isRelieved) !== 0) return false;

      const canCanteen = isFlagEnabled(emp.isCanteen) || 
                         isFlagEnabled(emp.salaryDetails?.isCanteen) || 
                         isFlagEnabled(emp.employmentDetails?.isCanteen);
      if (!canCanteen) return false;

      if (!selectedDesignation || selectedDesignation === 'ALL') return true;
      const empDesig = (emp.designation || emp.employmentDetails?.designation || '').trim();
      return empDesig.toLowerCase() === selectedDesignation.trim().toLowerCase();
    });
  }, [employeeList, selectedDesignation]);

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

  const getDaysInMonth = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return 30;
    const [year, month] = monthStr.split('-').map(Number);
    if (!year || !month) return 30;
    return new Date(year, month, 0).getDate();
  };

  const daysInTargetMonth = useMemo(() => {
    return getDaysInMonth(selectedMonth);
  }, [selectedMonth]);

  // Row Field Input Handlers
  const handleAmountChange = (empId: number, val: string) => {
    const num = Number(val);
    let calculatedDaily = '';
    if (!isNaN(num) && num > 0 && daysInTargetMonth > 0) {
      calculatedDaily = (num / daysInTargetMonth).toFixed(2);
    }

    setRowEdits(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        canteenAmount: val,
        dailyDeductionRate: calculatedDaily
      }
    }));
  };

  const handleDailyRateChange = (empId: number, val: string) => {
    setRowEdits(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        dailyDeductionRate: val
      }
    }));
  };

  // Single Row Save Handler
  const handleSaveRow = async (emp: any) => {
    const empId = Number(emp.id);
    const edit = rowEdits[empId];
    if (!edit || !edit.canteenAmount || Number(edit.canteenAmount) <= 0) {
      toast.error(`Please enter a valid monthly canteen amount for ${emp.employeeName}`);
      return;
    }

    setSavingRows(prev => ({ ...prev, [empId]: true }));
    try {
      const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
      const code = emp.employeeCode || emp.code || '';
      const dailyRate = edit.dailyDeductionRate ? Number(edit.dailyDeductionRate) : Number((Number(edit.canteenAmount) / daysInTargetMonth).toFixed(2));

      const payload: CanteenDeductionItem = {
        id: edit.id,
        employeeId: empId,
        employeeCode: code,
        employeeName: fullName,
        month: selectedMonth,
        effectiveDate: effectiveDate,
        canteenAmount: Number(edit.canteenAmount),
        dailyDeductionRate: dailyRate,
        remarks: edit.remarks || ''
      };

      const result = await dispatch(createCanteenDeduction(payload));
      if (createCanteenDeduction.fulfilled.match(result)) {
        toast.success(`Saved canteen deduction for ${fullName}`);
        dispatch(fetchCanteenDeductionsByMonth(selectedMonth));
      } else {
        toast.error(`Failed to save for ${fullName}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An error occurred while saving entry');
    } finally {
      setSavingRows(prev => ({ ...prev, [empId]: false }));
    }
  };

  // Bulk Save All Handler
  const handleSaveAll = async () => {
    const itemsToSave: CanteenDeductionItem[] = [];

    filteredEmployees.forEach((emp: any) => {
      const empId = Number(emp.id);
      const edit = rowEdits[empId];
      if (edit && edit.canteenAmount && Number(edit.canteenAmount) > 0) {
        const fullName = emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim();
        const code = emp.employeeCode || emp.code || '';
        const dailyRate = edit.dailyDeductionRate ? Number(edit.dailyDeductionRate) : Number((Number(edit.canteenAmount) / daysInTargetMonth).toFixed(2));

        itemsToSave.push({
          id: edit.id,
          employeeId: empId,
          employeeCode: code,
          employeeName: fullName,
          month: selectedMonth,
          effectiveDate: effectiveDate,
          canteenAmount: Number(edit.canteenAmount),
          dailyDeductionRate: dailyRate,
          remarks: edit.remarks || ''
        });
      }
    });

    if (itemsToSave.length === 0) {
      toast.warn('No monthly canteen amounts entered to save.');
      return;
    }

    const result = await dispatch(bulkCreateCanteenDeduction(itemsToSave));
    if (bulkCreateCanteenDeduction.fulfilled.match(result)) {
      toast.success(`Successfully saved canteen deduction for ${itemsToSave.length} employees`);
      dispatch(fetchCanteenDeductionsByMonth(selectedMonth));
    }
  };

  // Delete Handler
  const handleDeleteRow = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this canteen deduction entry?')) {
      await dispatch(deleteCanteenDeduction(id));
      dispatch(fetchCanteenDeductionsByMonth(selectedMonth));
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
    if (!singleAmount || Number(singleAmount) <= 0) {
      toast.error('Please enter monthly canteen amount');
      return;
    }

    const empId = Number(singleEmpId);
    const dailyRate = singleDaily ? Number(singleDaily) : Number((Number(singleAmount) / daysInTargetMonth).toFixed(2));

    setRowEdits(prev => ({
      ...prev,
      [empId]: {
        canteenAmount: singleAmount,
        dailyDeductionRate: String(dailyRate),
        remarks: ''
      }
    }));

    toast.info(`Updated canteen details for ${singleEmpName} in table list`);
    setSingleEmpId('');
    setSingleEmpCode('');
    setSingleEmpName('');
    setSingleAmount('');
    setSingleDaily('');
  };

  // Processed Data for Application DataTable
  const processedTableData = useMemo(() => {
    return filteredEmployees.map((emp: any, index: number) => {
      const empId = Number(emp.id);
      const edit = rowEdits[empId] || { canteenAmount: '', dailyDeductionRate: '', remarks: '' };
      const designation = emp.designation || emp.employmentDetails?.designation || '-';

      return {
        id: edit.id,
        serialNo: index + 1,
        employeeId: empId,
        employeeCode: emp.employeeCode || emp.code || '-',
        employeeName: emp.employeeName || `${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`.trim() || `Emp #${empId}`,
        designation: designation,
        month: selectedMonth,
        canteenAmount: edit.canteenAmount,
        dailyDeductionRate: edit.dailyDeductionRate,
        isSaved: Boolean(edit.isSaved && edit.id),
        rawEmployee: emp
      };
    });
  }, [filteredEmployees, rowEdits, selectedMonth]);

  // DataTable Column Definitions with Inline Inputs
  const columns = useMemo(
    () => [
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
      },
      // {
      //   Header: 'Target Month',
      //   accessor: 'month',
      //   Cell: ({ value }: { value: any }) => <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700 font-medium">{value}</span>
      // },
      {
        Header: 'Monthly Canteen (₹)',
        accessor: 'canteenAmount',
        Cell: ({ row }: { row: any }) => {
          const empId = row.original.employeeId;
          const val = rowEdits[empId]?.canteenAmount || '';
          return (
            <div className="relative min-w-[120px]">
              <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 5000"
                value={val}
                onChange={e => handleAmountChange(empId, e.target.value)}
                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-gray-900 bg-white"
              />
            </div>
          );
        }
      },
      {
        Header: 'Daily Rate (₹/day)',
        accessor: 'dailyDeductionRate',
        Cell: ({ row }: { row: any }) => {
          const empId = row.original.employeeId;
          const val = rowEdits[empId]?.dailyDeductionRate || '';
          return (
            <div className="relative min-w-[120px]">
              <span className="absolute left-2.5 top-1.5 text-amber-600 font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 166.67"
                value={val}
                onChange={e => handleDailyRateChange(empId, e.target.value)}
                className="w-full pl-6 pr-2 py-1 border border-amber-200 bg-amber-50/50 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold text-amber-900"
              />
            </div>
          );
        }
      },
      {
        Header: 'Leave Deduction Rule',
        accessor: 'leaveRule',
        Cell: () => (
          <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Leave days excluded
          </span>
        )
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
                    : 'bg-amber-600 text-white hover:bg-amber-700'
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
    ],
    [rowEdits, savingRows]
  );

  return (
    <div className="p-3 max-w-full mx-auto space-y-3 bg-gray-50 min-h-screen text-xs">
      {/* Top Header & Main Filter Controls */}
      <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Canteen Deduction</h1>
              <p className="text-[11px] text-gray-500">Filter by Designation & Month to configure monthly canteen amounts per employee</p>
            </div>
          </div>

          <div className="mt-2 md:mt-0 flex items-center space-x-2">
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

        {/* Filter Bar: 2 Main Inputs (Designation Filter & Target Month) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end bg-gray-50/80 p-2.5 rounded-md border border-gray-200">
          {/* Input 1: Designation Dropdown Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-600" />
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

          {/* Input 2: Target Month Picker */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600" />
              Target Month:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            />
          </div>

          {/* Filter Summary Stats & Bulk Save Button */}
          <div className="flex items-center justify-between md:justify-end space-x-2">
            <div className="text-right text-[11px] text-gray-500 mr-2">
              Showing <strong className="text-gray-900">{filteredEmployees.length}</strong> employees
            </div>
            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-amber-600 text-white font-bold rounded hover:bg-amber-700 transition-colors shadow-sm text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save All Entries</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leave Exclusion Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center space-x-2">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-[11px] text-amber-900 font-medium">
          Rule: Daily Rate (₹/day) = Monthly Canteen Amount / <strong>{daysInTargetMonth} days</strong> for target month <strong>{selectedMonth}</strong>. If an employee is on <strong>LEAVE/ABSENT</strong> on any day, that day's canteen amount will <strong>NOT</strong> be deducted in the salary report.
        </span>
      </div>

      {/* Optional Single Employee Quick Add Panel */}
      {showSingleAdd && (
        <div className="bg-amber-50/40 rounded-lg p-3 border border-amber-200 shadow-sm space-y-2">
          <div className="text-xs font-semibold text-amber-900 border-b border-amber-200 pb-1 flex items-center justify-between">
            <span>Optional Single Employee Quick Add</span>
            <span className="text-[11px] font-normal text-amber-700">Fill details to populate table row</span>
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
              <label className="text-[10px] font-semibold text-gray-700 uppercase">Monthly Canteen (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={singleAmount}
                onChange={e => {
                  setSingleAmount(e.target.value);
                  const num = Number(e.target.value);
                  if (!isNaN(num) && num > 0 && daysInTargetMonth > 0) {
                    setSingleDaily((num / daysInTargetMonth).toFixed(2));
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-700 uppercase">Daily Rate (₹/day)</label>
              <input
                type="number"
                placeholder="e.g. 166.67"
                value={singleDaily}
                onChange={e => setSingleDaily(e.target.value)}
                className="w-full px-2 py-1 border border-amber-300 bg-white rounded text-xs font-bold text-amber-900"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleSingleAddSubmit}
                className="w-full flex items-center justify-center space-x-1 px-3 py-1 bg-amber-700 text-white rounded hover:bg-amber-800 font-semibold text-xs"
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
          title={`Employee Canteen Deduction List (${selectedDesignation === 'ALL' ? 'All Designations' : selectedDesignation} - ${selectedMonth})`}
          data={processedTableData}
          columns={columns}
          loading={loading}
          showActions={false}
          showExport={true}
          virtualScroll={true}
          virtualScrollHeight="600px"
          initialPageSize={1000}
          rowHeight={44}
          filterPlaceholder="Search employee code, name, designation..."
        />
      </div>
    </div>
  );
}
