import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '@/state/store';
import { getAllEmployees, type Employee } from '@/state/employeeSlice';
import { getAllItemMasters } from '@/state/itemSlice';
import {
  fetchEmployeePropertyAssignments,
  createEmployeePropertyAssignment,
  bulkCreateEmployeePropertyAssignment,
  updateEmployeePropertyAssignment,
  returnEmployeePropertyAssignment,
  deleteEmployeePropertyAssignment,
  type EmployeePropertyAssignmentItem
} from '@/state/employeePropertyAssignmentSlice';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
import { CodesAPI } from '@/services/codes_api';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-toastify';
import {
  Laptop,
  Plus,
  Save,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Send,
  UserCheck,
  Building2,
  Calendar,
  Box,
  ExternalLink,
  ShieldCheck,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Tag,
  Package,
  Check,
  Edit3
} from 'lucide-react';

interface RowState {
  id?: number;
  serialNumber: string;
  expectedReturnDate: string;
  conditionAtIssue: string;
  remarks: string;
  isSaved?: boolean;
}

export default function EmployeePropertyAssignmentPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const companyId = useResolvedCompanyId();

  // Tab State: 'assigned' (Active Custody) | 'history' (Returned/Damage) | 'summary' (By Employee)
  const [activeTab, setActiveTab] = useState<'assigned' | 'history' | 'summary'>('assigned');

  // Redux Selectors
  const { employeeList, loading: empLoading } = useSelector((state: RootState) => state.employee);
  const { itemList, loading: itemLoading } = useSelector((state: RootState) => (state as any).itemMaster || { itemList: [] });
  const { assignmentList, loading: assignLoading } = useSelector((state: RootState) => state.employeePropertyAssignment);

  // Main Filters State
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [departmentList, setDepartmentList] = useState<string[]>([]);
  const [designationList, setDesignationList] = useState<string[]>([]);

  // Row Edit Tracking State
  const [rowEdits, setRowEdits] = useState<Record<number, RowState>>({});
  const [savingRows, setSavingRows] = useState<Record<number, boolean>>({});

  // Quick Single Assign Drawer State
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);

  // Modal 1: Assign / Edit Property Modal State
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<EmployeePropertyAssignmentItem | null>(null);
  const [modalEmployeeId, setModalEmployeeId] = useState<string>('');
  const [modalItemId, setModalItemId] = useState<string>('');
  const [modalItemCode, setModalItemCode] = useState<string>('');
  const [modalItemName, setModalItemName] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('IT Equipment');
  const [modalSerialNumber, setModalSerialNumber] = useState<string>('');
  const [modalQuantity, setModalQuantity] = useState<string>('1');
  const [modalUom, setModalUom] = useState<string>('NOS');
  const [modalAssignedDate, setModalAssignedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [modalExpectedReturnDate, setModalExpectedReturnDate] = useState<string>('');
  const [modalCondition, setModalCondition] = useState<string>('GOOD');
  const [modalStatus, setModalStatus] = useState<string>('ASSIGNED');
  const [modalRemarks, setModalRemarks] = useState<string>('');

  // Modal 2: Return Property Modal
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [returnTargetItem, setReturnTargetItem] = useState<EmployeePropertyAssignmentItem | null>(null);
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [returnCondition, setReturnCondition] = useState<string>('GOOD');
  const [receivedBy, setReceivedBy] = useState<string>('');
  const [damageDeduction, setDamageDeduction] = useState<string>('0');
  const [returnRemarks, setReturnRemarks] = useState<string>('');

  // Get current logged in username
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
        const name = u.userName || u.username || u.name || u.firstName;
        if (name) return String(name);
      }
      const uStr = localStorage.getItem('userName') || localStorage.getItem('username');
      if (uStr) return String(uStr);
    } catch {
      // ignore
    }
    return 'HR Admin';
  };

  // 1. Initial Data Fetching
  useEffect(() => {
    dispatch(getAllEmployees({ limit: 1000 }));
    dispatch(getAllItemMasters({ limit: 1000 }));
    dispatch(fetchEmployeePropertyAssignments({ companyId }));
  }, [dispatch, companyId]);

  // 2. Load Department & Designation Dropdowns
  useEffect(() => {
    const loadCodes = async () => {
      try {
        const desigCodes = await CodesAPI.getCodeDetailsByHeader('Designation');
        const apiDesigs = (desigCodes || []).map((d: any) => d.value || d.code).filter(Boolean);
        const empDesigs = (employeeList || []).map((e: any) => e.designation || e.employmentDetails?.designation).filter(Boolean);
        setDesignationList(Array.from(new Set([...apiDesigs, ...empDesigs])).sort());
      } catch {
        const empDesigs = (employeeList || []).map((e: any) => e.designation || e.employmentDetails?.designation).filter(Boolean);
        setDesignationList(Array.from(new Set(empDesigs)).sort());
      }

      try {
        const deptCodes = await CodesAPI.getCodeDetailsByHeader('Department');
        const apiDepts = (deptCodes || []).map((d: any) => d.value || d.code).filter(Boolean);
        const empDepts = (employeeList || []).map((e: any) => e.department || e.employmentDetails?.department).filter(Boolean);
        setDepartmentList(Array.from(new Set([...apiDepts, ...empDepts])).sort());
      } catch {
        const empDepts = (employeeList || []).map((e: any) => e.department || e.employmentDetails?.department).filter(Boolean);
        setDepartmentList(Array.from(new Set(empDepts)).sort());
      }
    };
    loadCodes();
  }, [employeeList]);

  // 3. Extract Unique Property Categories from Item Master
  const propertyCategories = useMemo(() => {
    const rawCategories = (itemList || [])
      .map((item: any) => item.itemCategory || item.category || item.department)
      .filter(Boolean);
    const defaults = [
      'IT Equipment',
      'Communication & SIM',
      'Tools & Instruments',
      'Safety & PPE',
      'Vehicles & Keys',
      'Uniforms & Identity',
      'General Asset'
    ];
    return Array.from(new Set([...defaults, ...rawCategories])).sort();
  }, [itemList]);

  // 4. Pre-populate Row Edits when assignmentList changes
  useEffect(() => {
    const edits: Record<number, RowState> = {};
    (assignmentList || []).forEach(item => {
      if (item.id) {
        edits[item.id] = {
          id: item.id,
          serialNumber: item.serialNumber || '',
          expectedReturnDate: item.expectedReturnDate || '',
          conditionAtIssue: item.conditionAtIssue || 'GOOD',
          remarks: item.remarks || '',
          isSaved: true
        };
      }
    });
    setRowEdits(edits);
  }, [assignmentList]);

  // Employee Dropdown Options
  const employeeSelectOptions = useMemo(() => {
    const opts = (employeeList || []).map((emp: Employee) => {
      const id = String(emp.id);
      const code = emp.employeeCode || emp.code || '';
      const name = emp.employeeName;
      const dept = emp.employmentDetails?.department || '';
      return {
        value: id,
        label: `${code ? `[${code}] ` : ''}${name}${dept ? ` - ${dept}` : ''}`
      };
    });
    return opts;
  }, [employeeList]);

  // Item Master Property Dropdown Options
  const itemSelectOptions = useMemo(() => {
    return (itemList || []).map((itm: any) => {
      const id = String(itm.id);
      const name = itm.itemName || itm.name || '';
      const code = itm.itemCode || itm.code || '';
      const cat = itm.itemCategory || itm.category || '';
      return {
        value: id,
        label: `${name}${code ? ` (${code})` : ''}${cat ? ` [${cat}]` : ''}`
      };
    });
  }, [itemList]);

  // Handle Item Selection in Assign Modal -> auto-fills category, uom, itemCode
  const handleItemSelect = (selectedId: string) => {
    setModalItemId(selectedId);
    if (!selectedId) {
      setModalItemName('');
      setModalItemCode('');
      return;
    }
    const found = (itemList || []).find((itm: any) => String(itm.id) === selectedId);
    if (found) {
      setModalItemName(found.itemName || found.name || '');
      setModalItemCode(found.itemCode || found.code || '');
      if (found.itemCategory) setModalCategory(found.itemCategory);
      if (found.uomName) setModalUom(found.uomName);
    }
  };

  // Filtered Assignments List
  const filteredAssignments = useMemo(() => {
    return (assignmentList || []).filter(item => {
      // Tab Filter: 'assigned' vs 'history'
      if (activeTab === 'assigned' && item.status !== 'ASSIGNED') return false;
      if (activeTab === 'history' && item.status === 'ASSIGNED') return false;

      // Status Filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

      // Department Filter
      if (selectedDepartment !== 'ALL') {
        const itemDept = (item.department || '').toLowerCase().trim();
        if (itemDept !== selectedDepartment.toLowerCase().trim()) return false;
      }

      // Designation Filter
      if (selectedDesignation !== 'ALL') {
        const itemDesig = (item.designation || '').toLowerCase().trim();
        if (itemDesig !== selectedDesignation.toLowerCase().trim()) return false;
      }

      // Category Filter
      if (selectedCategory !== 'ALL') {
        const itemCat = (item.propertyCategory || '').toLowerCase().trim();
        if (itemCat !== selectedCategory.toLowerCase().trim()) return false;
      }

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = (item.employeeName || '').toLowerCase();
        const empCode = (item.employeeCode || '').toLowerCase();
        const itmName = (item.itemName || '').toLowerCase();
        const itmCode = (item.itemCode || '').toLowerCase();
        const serial = (item.serialNumber || '').toLowerCase();
        const remarks = (item.remarks || '').toLowerCase();

        const matches = (
          empName.includes(q) ||
          empCode.includes(q) ||
          itmName.includes(q) ||
          itmCode.includes(q) ||
          serial.includes(q) ||
          remarks.includes(q)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [assignmentList, activeTab, selectedStatus, selectedDepartment, selectedDesignation, selectedCategory, searchQuery]);

  // KPI Calculation
  const kpiStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const totalActive = (assignmentList || []).filter(a => a.status === 'ASSIGNED').length;
    const uniqueEmployees = new Set(
      (assignmentList || []).filter(a => a.status === 'ASSIGNED').map(a => a.employeeId)
    ).size;
    const overdueCount = (assignmentList || []).filter(
      a => a.status === 'ASSIGNED' && a.expectedReturnDate && a.expectedReturnDate < today
    ).length;
    const totalReturned = (assignmentList || []).filter(a => a.status === 'RETURNED').length;

    return { totalActive, uniqueEmployees, overdueCount, totalReturned };
  }, [assignmentList]);

  // Employee Custody Grouping (for Summary Tab)
  const employeeCustodySummary = useMemo(() => {
    const map = new Map<number, {
      employeeId: number;
      employeeCode?: string;
      employeeName: string;
      department?: string;
      designation?: string;
      activeItems: EmployeePropertyAssignmentItem[];
      returnedItems: EmployeePropertyAssignmentItem[];
    }>();

    (assignmentList || []).forEach(item => {
      const eId = item.employeeId;
      if (!map.has(eId)) {
        map.set(eId, {
          employeeId: eId,
          employeeCode: item.employeeCode,
          employeeName: item.employeeName,
          department: item.department,
          designation: item.designation,
          activeItems: [],
          returnedItems: []
        });
      }
      const entry = map.get(eId)!;
      if (item.status === 'ASSIGNED') {
        entry.activeItems.push(item);
      } else {
        entry.returnedItems.push(item);
      }
    });

    return Array.from(map.values());
  }, [assignmentList]);

  // Handlers for Row Editing
  const handleSerialChange = (id: number, val: string) => {
    setRowEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { id, expectedReturnDate: '', conditionAtIssue: 'GOOD', remarks: '' }), serialNumber: val }
    }));
  };

  const handleExpectedReturnDateChange = (id: number, val: string) => {
    setRowEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { id, serialNumber: '', conditionAtIssue: 'GOOD', remarks: '' }), expectedReturnDate: val }
    }));
  };

  const handleConditionChange = (id: number, val: string) => {
    setRowEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { id, serialNumber: '', expectedReturnDate: '', remarks: '' }), conditionAtIssue: val }
    }));
  };

  const handleRemarksChange = (id: number, val: string) => {
    setRowEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { id, serialNumber: '', expectedReturnDate: '', conditionAtIssue: 'GOOD' }), remarks: val }
    }));
  };

  // Save Single Row Inline
  const handleSaveRow = async (item: EmployeePropertyAssignmentItem) => {
    if (!item.id) return;
    const edit = rowEdits[item.id];
    setSavingRows(prev => ({ ...prev, [item.id!]: true }));
    try {
      await dispatch(updateEmployeePropertyAssignment({
        id: item.id,
        data: {
          serialNumber: edit?.serialNumber ?? item.serialNumber,
          expectedReturnDate: edit?.expectedReturnDate !== undefined ? (edit.expectedReturnDate || null) : item.expectedReturnDate,
          conditionAtIssue: edit?.conditionAtIssue ?? item.conditionAtIssue,
          remarks: edit?.remarks ?? item.remarks
        }
      })).unwrap();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update assignment');
    } finally {
      setSavingRows(prev => ({ ...prev, [item.id!]: false }));
    }
  };

  // Save All Inline Edits
  const handleSaveAll = async () => {
    const itemsToUpdate = filteredAssignments
      .filter(item => item.id && rowEdits[item.id])
      .map(item => ({
        id: item.id!,
        data: {
          serialNumber: rowEdits[item.id!].serialNumber,
          expectedReturnDate: rowEdits[item.id!].expectedReturnDate || null,
          conditionAtIssue: rowEdits[item.id!].conditionAtIssue,
          remarks: rowEdits[item.id!].remarks
        }
      }));

    if (itemsToUpdate.length === 0) {
      toast.warn('No assignments to save.');
      return;
    }

    let successCount = 0;
    for (const u of itemsToUpdate) {
      const res = await dispatch(updateEmployeePropertyAssignment(u));
      if (updateEmployeePropertyAssignment.fulfilled.match(res)) {
        successCount++;
      }
    }
    toast.success(`Saved changes for ${successCount} property record(s).`);
  };

  // Delete Assignment Handler
  const handleDeleteRow = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to remove this property assignment record?');
    if (confirmed) {
      await dispatch(deleteEmployeePropertyAssignment(id));
    }
  };

  // Open Return Dialog
  const handleOpenReturnModal = (item: EmployeePropertyAssignmentItem) => {
    setReturnTargetItem(item);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnCondition(item.conditionAtIssue || 'GOOD');
    setReceivedBy(getLoggedInUserName());
    setDamageDeduction('0');
    setReturnRemarks('');
    setShowReturnModal(true);
  };

  // Submit Return Dialog
  const handleReturnSubmit = async () => {
    if (!returnTargetItem?.id) return;
    try {
      await dispatch(returnEmployeePropertyAssignment({
        id: returnTargetItem.id,
        returnPayload: {
          returnDate,
          conditionAtReturn: returnCondition,
          receivedBy,
          damageDeductionAmount: Number(damageDeduction) || 0,
          remarks: returnRemarks
        }
      })).unwrap();
      setShowReturnModal(false);
      setReturnTargetItem(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process return');
    }
  };

  // Open Edit Modal with full pre-filled item values
  const handleOpenEditModal = (item: EmployeePropertyAssignmentItem) => {
    setIsEditMode(true);
    setEditingItem(item);
    setModalEmployeeId(String(item.employeeId || ''));
    setModalItemId(item.itemId ? String(item.itemId) : '');
    setModalItemCode(item.itemCode || '');
    setModalItemName(item.itemName || '');
    setModalCategory(item.propertyCategory || 'IT Equipment');
    setModalSerialNumber(item.serialNumber || '');
    setModalQuantity(String(item.quantity ?? 1));
    setModalUom(item.uom || 'NOS');
    setModalAssignedDate(item.assignedDate || new Date().toISOString().split('T')[0]);
    setModalExpectedReturnDate(item.expectedReturnDate || '');
    setModalCondition(item.conditionAtIssue || 'GOOD');
    setModalStatus(item.status || 'ASSIGNED');
    setModalRemarks(item.remarks || '');
    setShowAssignModal(true);
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingItem(null);
    resetAssignForm();
    setShowAssignModal(true);
  };

  const resetAssignForm = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setModalEmployeeId('');
    setModalItemId('');
    setModalItemCode('');
    setModalItemName('');
    setModalCategory('IT Equipment');
    setModalSerialNumber('');
    setModalQuantity('1');
    setModalUom('NOS');
    setModalAssignedDate(new Date().toISOString().split('T')[0]);
    setModalExpectedReturnDate('');
    setModalCondition('GOOD');
    setModalStatus('ASSIGNED');
    setModalRemarks('');
  };

  // Submit Assign / Edit Property Modal
  const handleAssignSubmit = async () => {
    if (!modalEmployeeId) {
      toast.error('Please select an employee.');
      return;
    }
    
    if (!modalItemName.trim()) {
      toast.error('Please select an item from Item Master or enter a property name.');
      return;
    }

    const emp = (employeeList || []).find((employee: Employee) => String(employee.id) === modalEmployeeId);
    const fullName = emp?.employeeName || (isEditMode ? (editingItem?.employeeName || '') : '');
    const code = emp?.employeeCode || emp?.code || (isEditMode ? (editingItem?.employeeCode || '') : '');
    const dept = emp?.employmentDetails?.department || (isEditMode ? (editingItem?.department || '') : '');
    const desig = emp?.employmentDetails?.designation || (isEditMode ? (editingItem?.designation || '') : '');

    const payloadData: any = {
      employeeId: Number(modalEmployeeId),
      employeeCode: code,
      employeeName: fullName,
      department: dept,
      designation: desig,
      itemId: modalItemId ? Number(modalItemId) : undefined,
      itemCode: modalItemCode,
      itemName: modalItemName.trim(),
      propertyCategory: modalCategory,
      serialNumber: modalSerialNumber.trim(),
      quantity: Number(modalQuantity) || 1,
      uom: modalUom,
      assignedDate: modalAssignedDate,
      expectedReturnDate: modalExpectedReturnDate ? modalExpectedReturnDate : null,
      conditionAtIssue: modalCondition,
      assignedBy: getLoggedInUserName(),
      status: (isEditMode ? modalStatus : 'ASSIGNED'),
      remarks: modalRemarks.trim(),
      companyId: companyId ? Number(companyId) : null
    };

    try {
      if (isEditMode && editingItem?.id) {
        await dispatch(updateEmployeePropertyAssignment({
          id: editingItem.id,
          data: payloadData
        })).unwrap();

        // Update local row edits
        setRowEdits(prev => ({
          ...prev,
          [editingItem.id!]: {
            id: editingItem.id!,
            serialNumber: payloadData.serialNumber,
            expectedReturnDate: modalExpectedReturnDate || '',
            conditionAtIssue: payloadData.conditionAtIssue,
            remarks: payloadData.remarks,
            isSaved: true
          }
        }));
      } else {
        await dispatch(createEmployeePropertyAssignment(payloadData as EmployeePropertyAssignmentItem)).unwrap();
      }
      setShowAssignModal(false);
      resetAssignForm();
    } catch (err: any) {
      toast.error(err?.message || (isEditMode ? 'Failed to update property assignment' : 'Failed to assign property'));
    }
  };

  // DataTable Column Definitions
  const columns = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const baseCols: any[] = [
      {
        Header: '#',
        accessor: 'slNo',
        width: 50,
        minWidth: 50,
        disableFilters: true,
        Cell: ({ row }: { row: any }) => (
          <span className="text-gray-500 font-semibold">{row.index + 1}</span>
        )
      },
      {
        Header: 'Employee',
        accessor: 'employeeName',
        minWidth: 180,
        Cell: ({ row }: { row: any }) => {
          const item = row.original;
          const initials = (item.employeeName || 'E')
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

          return (
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-2xs shrink-0 border border-indigo-200">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                  <span>{item.employeeName}</span>
                  {item.employeeCode && (
                    <span className="text-3xs font-mono font-semibold bg-gray-100 text-gray-700 px-1 py-0.2 rounded border">
                      {item.employeeCode}
                    </span>
                  )}
                </div>
                <div className="text-3xs text-gray-500 truncate">
                  {item.department || '-'} &bull; {item.designation || '-'}
                </div>
              </div>
            </div>
          );
        }
      },
      {
        Header: 'Property / Asset (Item Master)',
        accessor: 'itemName',
        minWidth: 200,
        Cell: ({ row }: { row: any }) => {
          const item = row.original;
          return (
            <div className="space-y-0.5">
              <div className="font-bold text-gray-900 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{item.itemName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.propertyCategory && (
                  <span className="text-3xs font-semibold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200">
                    {item.propertyCategory}
                  </span>
                )}
                {item.itemCode && (
                  <span className="text-3xs font-mono text-gray-500">
                    #{item.itemCode}
                  </span>
                )}
              </div>
            </div>
          );
        }
      },
      {
        Header: 'Serial / Tag No',
        accessor: 'serialNumber',
        minWidth: 130,
        Cell: ({ row }: { row: any }) => {
          const item = row.original;
          const edit = rowEdits[item.id] || { serialNumber: item.serialNumber || '' };

          if (activeTab === 'history') {
            return (
              <span className="font-mono text-2xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                {item.serialNumber || '---'}
              </span>
            );
          }

          return (
            <input
              type="text"
              placeholder="Serial/Asset Tag..."
              value={edit.serialNumber}
              onChange={e => handleSerialChange(item.id, e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-xs font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          );
        }
      },
      {
        Header: 'Qty & UOM',
        accessor: 'quantity',
        minWidth: 85,
        Cell: ({ row }: { row: any }) => {
          const item = row.original;
          return (
            <span className="font-mono text-xs font-bold text-gray-800">
              {item.quantity} {item.uom || 'NOS'}
            </span>
          );
        }
      },
      {
        Header: 'Issue Date',
        accessor: 'assignedDate',
        minWidth: 105,
        Cell: ({ row }: { row: any }) => (
          <div className="text-2xs text-gray-700 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{row.original.assignedDate || '-'}</span>
          </div>
        )
      },
      {
        Header: 'Return Due',
        accessor: 'expectedReturnDate',
        minWidth: 140,
        cellContentClassName: 'whitespace-nowrap overflow-visible',
        Cell: ({ row }: { row: any }) => {
          const item = row.original;
          const edit = rowEdits[item.id] || { expectedReturnDate: item.expectedReturnDate || '' };
          const val = edit.expectedReturnDate ?? (item.expectedReturnDate || '');

          if (activeTab === 'history') {
            if (!item.expectedReturnDate) {
              return <span className="text-2xs text-gray-400 italic">Permanent</span>;
            }
            return (
              <div className="text-2xs text-gray-700 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>{item.expectedReturnDate}</span>
              </div>
            );
          }

          const isOverdue = Boolean(val && val < today);

          return (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={val}
                  onChange={e => handleExpectedReturnDateChange(item.id, e.target.value)}
                  className={`w-28 px-1.5 py-0.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white ${
                    isOverdue ? 'border-red-400 text-red-700 font-bold bg-red-50/50' : 'border-gray-300 text-gray-800'
                  }`}
                  title={val ? `Return due by ${val}` : 'Permanent issue (click to set due date)'}
                />
                {val && (
                  <button
                    type="button"
                    onClick={() => handleExpectedReturnDateChange(item.id, '')}
                    className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Clear return date (Make Permanent)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-3xs px-0.5">
                {!val ? (
                  <span className="text-gray-400 italic">Permanent</span>
                ) : isOverdue ? (
                  <span className="text-red-600 font-extrabold flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5 animate-pulse" /> Overdue
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">Due: {val}</span>
                )}
              </div>
            </div>
          );
        }
      },
      {
        Header: 'Condition',
        accessor: 'conditionAtIssue',
        minWidth: 95,
        Cell: ({ row }: { row: any }) => {
          const item = row.original;
          const edit = rowEdits[item.id] || { conditionAtIssue: item.conditionAtIssue || 'GOOD' };

          if (activeTab === 'history') {
            return (
              <div className="space-y-0.5 text-3xs">
                <span className="block text-gray-500">Issued: <strong>{item.conditionAtIssue}</strong></span>
                {item.conditionAtReturn && (
                  <span className="block text-emerald-700 font-bold">Returned: <strong>{item.conditionAtReturn}</strong></span>
                )}
              </div>
            );
          }

          return (
            <select
              value={edit.conditionAtIssue}
              onChange={e => handleConditionChange(item.id, e.target.value)}
              className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-800 bg-white"
            >
              <option value="NEW">NEW</option>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
            </select>
          );
        }
      },
      {
        Header: 'Status',
        accessor: 'status',
        minWidth: 110,
        Cell: ({ row }: { row: any }) => {
          const status = row.original.status;
          let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
          if (status === 'ASSIGNED') badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
          if (status === 'RETURNED') badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
          if (status === 'DAMAGED') badgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
          if (status === 'LOST') badgeClass = 'bg-red-50 text-red-800 border-red-300 font-bold';

          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs border ${badgeClass}`}>
              {status === 'ASSIGNED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              {status === 'RETURNED' && <Check className="w-3 h-3 text-slate-500" />}
              {(status === 'DAMAGED' || status === 'LOST') && <AlertTriangle className="w-3 h-3 text-red-600" />}
              <span>{status}</span>
            </span>
          );
        }
      },
      {
        Header: 'Remarks',
        accessor: 'remarks',
        minWidth: 160,
        Cell: ({ row }: { row: any }) => {
          const item = row.original;
          const edit = rowEdits[item.id] || { remarks: item.remarks || '' };

          if (activeTab === 'history') {
            return <span className="text-2xs text-gray-600 italic">{item.remarks || '-'}</span>;
          }

          return (
            <input
              type="text"
              placeholder="Handover notes..."
              value={edit.remarks}
              onChange={e => handleRemarksChange(item.id, e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
          );
        }
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        minWidth: 200,
        disableFilters: true,
        cellContentClassName: 'overflow-visible whitespace-nowrap',
        Cell: ({ row }: { row: any }) => {
          const item = row.original;
          const isSaving = savingRows[item.id];

          return (
            <div className="flex items-center space-x-1.5 whitespace-nowrap min-w-max">
              {/* Full Edit Modal button */}
              <button
                type="button"
                onClick={() => handleOpenEditModal(item)}
                className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded transition-colors shadow-2xs shrink-0"
                title="Edit Full Assignment Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {item.status === 'ASSIGNED' && (
                <button
                  type="button"
                  onClick={() => handleOpenReturnModal(item)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded text-2xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs shrink-0"
                  title="Mark Property as Returned"
                >
                  <RotateCcw className="w-3 h-3 text-amber-700" />
                  <span>Return</span>
                </button>
              )}

              {activeTab === 'assigned' && (
                <button
                  type="button"
                  onClick={() => handleSaveRow(item)}
                  disabled={isSaving}
                  className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors shadow-2xs shrink-0"
                  title="Save Row Changes"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteRow(item.id)}
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors shrink-0"
                title="Delete Record"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }
      }
    ];

    return baseCols;
  }, [activeTab, rowEdits, savingRows]);

  return (
    <div className="p-3 max-w-full mx-auto space-y-3 bg-gray-50 min-h-screen text-xs font-sans">
      {/* Tab Navigation Bar: Active Assignments vs Return History vs Employee View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-2 gap-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'assigned'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Active Property Assignments ({kpiStats.totalActive})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return History & Clearance ({kpiStats.totalReturned})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Employee Custody Summary ({kpiStats.uniqueEmployees})</span>
          </button>
        </div>

        {/* Master Configuration & Action Links */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/masters/item-master')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors shadow-2xs text-xs"
            title="Open Item Master to add or manage company property items"
          >
            <Box className="w-3.5 h-3.5 text-indigo-600" />
            <span>Manage Item Master</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Property</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-2xs font-semibold text-gray-500 uppercase">Active Properties</span>
            <span className="block text-lg sm:text-xl font-bold text-indigo-950 font-mono mt-0.5">
              {kpiStats.totalActive}
            </span>
          </div>
          <div className="p-2 rounded-md bg-indigo-50 text-indigo-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-2xs font-semibold text-gray-500 uppercase">Employees in Custody</span>
            <span className="block text-lg sm:text-xl font-bold text-emerald-950 font-mono mt-0.5">
              {kpiStats.uniqueEmployees}
            </span>
          </div>
          <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-red-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-2xs font-semibold text-red-600 uppercase">Overdue Returns</span>
            <span className="block text-lg sm:text-xl font-bold text-red-950 font-mono mt-0.5">
              {kpiStats.overdueCount}
            </span>
          </div>
          <div className="p-2 rounded-md bg-red-50 text-red-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-2xs font-semibold text-gray-500 uppercase">Returned to Store</span>
            <span className="block text-lg sm:text-xl font-bold text-purple-950 font-mono mt-0.5">
              {kpiStats.totalReturned}
            </span>
          </div>
          <div className="p-2 rounded-md bg-purple-50 text-purple-600">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Header & Main Filter Controls (Patterned after attendance-incentive.tsx) */}
      <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                {activeTab === 'assigned'
                  ? 'Active Employee Property Assignments'
                  : activeTab === 'history'
                  ? 'Property Return & Clearance History'
                  : 'Employee Property Custody Summary'}
              </h1>
              <p className="text-[11px] text-gray-500">
                Track laptops, SIMs, safety gear & tools issued from Item Master to employees across departments
              </p>
            </div>
          </div>

          <div className="mt-2 md:mt-0 flex items-center space-x-2">
            {activeTab === 'assigned' && (
              <button
                type="button"
                onClick={handleSaveAll}
                className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold text-xs transition-colors shadow-xs"
                title="Save all modified serial numbers, condition and remarks across the table"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Edits</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200 font-medium text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-gray-500" />
              <span>{showQuickAdd ? 'Hide Quick Assign Bar' : 'Quick Assign Bar'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Department -> Designation -> Category -> Status -> Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end bg-gray-50/80 p-2.5 rounded-md border border-gray-200">
          {/* Filter 1: Department */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-600" />
              Department:
            </label>
            <CommonSearchableSelect
              options={[{ value: 'ALL', label: 'All Departments' }, ...departmentList.map(d => ({ value: d, label: d }))]}
              value={selectedDepartment}
              onChange={val => setSelectedDepartment(val)}
              placeholder="Select Department..."
              className="w-full text-xs"
            />
          </div>

          {/* Filter 2: Designation */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-600" />
              Designation:
            </label>
            <CommonSearchableSelect
              options={[{ value: 'ALL', label: 'All Designations' }, ...designationList.map(d => ({ value: d, label: d }))]}
              value={selectedDesignation}
              onChange={val => setSelectedDesignation(val)}
              placeholder="Select Designation..."
              className="w-full text-xs"
            />
          </div>

          {/* Filter 3: Property Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" />
              Category:
            </label>
            <CommonSearchableSelect
              options={[{ value: 'ALL', label: 'All Categories' }, ...propertyCategories.map(c => ({ value: c, label: c }))]}
              value={selectedCategory}
              onChange={val => setSelectedCategory(val)}
              placeholder="Select Category..."
              className="w-full text-xs"
            />
          </div>

          {/* Filter 4: Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
              Status:
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-bold text-gray-800 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Assigned (In Custody)</option>
              <option value="RETURNED">Returned</option>
              <option value="DAMAGED">Damaged</option>
              <option value="LOST">Lost</option>
            </select>
          </div>

          {/* Filter 5: Search Query */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-700 uppercase flex items-center gap-1">
              <Search className="w-3 h-3 text-indigo-600" />
              Quick Search:
            </label>
            <input
              type="text"
              placeholder="Search employee, item, serial..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Assign Bar (Collapsible) */}
      {showQuickAdd && (
        <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-indigo-900 border-b border-indigo-200 pb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quick Assign Property to Employee</span>
            </span>
            <span className="text-3xs text-indigo-600 font-normal">
              For complete details with return dates & handover notes, use '+ Assign New Property' above
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end pt-1">
            <div>
              <label className="block text-3xs font-semibold text-gray-600 uppercase mb-0.5">Select Employee *</label>
              <CommonSearchableSelect
                options={employeeSelectOptions}
                value={modalEmployeeId}
                onChange={val => setModalEmployeeId(val)}
                placeholder="Search Employee..."
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-gray-600 uppercase mb-0.5">Select Item from Item Master *</label>
              <CommonSearchableSelect
                options={itemSelectOptions}
                value={modalItemId}
                onChange={val => handleItemSelect(val)}
                placeholder="Search Item Master..."
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-3xs font-semibold text-gray-600 uppercase mb-0.5">Serial No / Asset Tag</label>
              <input
                type="text"
                placeholder="e.g. SN-04928"
                value={modalSerialNumber}
                onChange={e => setModalSerialNumber(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono font-semibold"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAssignSubmit}
                className="w-full flex items-center justify-center space-x-1 px-3 py-1.5 bg-indigo-700 text-white rounded hover:bg-indigo-800 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign to Employee</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab !== 'summary' ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <DataTable
            title={`Employee Property Assignment List (${activeTab === 'assigned' ? 'Active Custody' : 'Return History'} - ${filteredAssignments.length} records)`}
            data={filteredAssignments}
            columns={columns}
            loading={assignLoading || empLoading}
            showActions={false}
            showExport={true}
            virtualScroll={true}
            virtualScrollHeight="600px"
            initialPageSize={100}
            rowHeight={52}
            filterPlaceholder="Filter by employee code, name, property, serial number..."
          />
        </div>
      ) : (
        /* Employee Custody Summary View */
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="border-b pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Employee Custody Summary</h2>
              <p className="text-2xs text-gray-500">Overview of all active properties currently held by each employee</p>
            </div>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
              {employeeCustodySummary.length} Employees with Property Records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employeeCustodySummary.map(emp => (
              <div key={emp.employeeId} className="p-3 rounded-lg border border-gray-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-xs">{emp.employeeName}</h3>
                    <span className="text-2xs text-gray-500 font-mono">Code: {emp.employeeCode || '-'}</span>
                    <div className="text-3xs text-gray-600 mt-0.5">{emp.department || '-'} &bull; {emp.designation || '-'}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-2xs font-bold ${emp.activeItems.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                    {emp.activeItems.length} Active
                  </span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-2 space-y-1">
                  <span className="block text-3xs font-bold uppercase text-gray-500">Assigned Properties:</span>
                  {emp.activeItems.length > 0 ? (
                    <ul className="space-y-1">
                      {emp.activeItems.map((itm, i) => (
                        <li key={itm.id || i} className="text-2xs flex items-center justify-between bg-white px-2 py-1 rounded border border-gray-100">
                          <span className="truncate font-semibold text-gray-800">{itm.itemName}</span>
                          <span className="font-mono text-3xs text-gray-500 ml-1 shrink-0">{itm.serialNumber || 'No SN'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-3xs text-gray-400 italic">No active assets in custody</span>
                  )}
                </div>

                {emp.returnedItems.length > 0 && (
                  <div className="text-3xs text-gray-500 pt-1">
                    {emp.returnedItems.length} returned property record(s) on file
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Assign / Edit Property */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          resetAssignForm();
        }}
        title={isEditMode ? `Edit Property Assignment #${editingItem?.id} - ${editingItem?.itemName}` : "Assign Property to Employee"}
        size="2xl"
      >
        <div className="space-y-4 text-xs p-1">
          <div className="bg-indigo-50 border border-indigo-200 rounded p-2 text-2xs text-indigo-900">
            {isEditMode ? (
              <span>
                Modify property assignment details for <strong>{editingItem?.employeeName}</strong>. You can change return due date, serial numbers, custody status, and handover remarks.
              </span>
            ) : (
              <span>
                Select an employee and choose an asset from <strong>Item Master</strong>. The property will be tracked under the employee's custody.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Custody Status (in Edit Mode) */}
            {isEditMode && (
              <div className="space-y-1 sm:col-span-2 bg-gray-50 p-2 rounded border border-gray-200">
                <label className="block text-2xs font-bold text-gray-700 uppercase">
                  Custody Status
                </label>
                <select
                  value={modalStatus}
                  onChange={e => setModalStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold text-gray-800 bg-white"
                >
                  <option value="ASSIGNED">ASSIGNED - In Employee Custody</option>
                  <option value="RETURNED">RETURNED - Returned to Company Store</option>
                  <option value="DAMAGED">DAMAGED - Defective / Damaged</option>
                  <option value="LOST">LOST - Reported Missing / Lost</option>
                </select>
              </div>
            )}

            {/* Employee Selector */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-2xs font-bold text-gray-700 uppercase">
                Select Employee *
              </label>
              <CommonSearchableSelect
                options={employeeSelectOptions}
                value={modalEmployeeId}
                onChange={val => setModalEmployeeId(val)}
                placeholder="Search Employee by Name or Code..."
                className="w-full text-xs"
              />
            </div>

            {/* Item Master Property Selector */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-2xs font-bold text-gray-700 uppercase flex items-center justify-between">
                <span>Select Property from Item Master *</span>
                <span className="text-3xs text-indigo-600 font-normal">Pulled from Item Master (`item_master`)</span>
              </label>
              <CommonSearchableSelect
                options={itemSelectOptions}
                value={modalItemId}
                onChange={val => handleItemSelect(val)}
                placeholder="Search Property / Item Master..."
                className="w-full text-xs"
              />
            </div>

            {/* Custom Property Name if not in Item Master */}
            <div className="space-y-1">
              <label className="block text-2xs font-bold text-gray-700 uppercase">
                Property / Item Name *
              </label>
              <input
                type="text"
                value={modalItemName}
                onChange={e => setModalItemName(e.target.value)}
                placeholder="e.g. Dell Latitude 3420"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold text-gray-900"
              />
            </div>

            {/* Property Category */}
            <div className="space-y-1">
              <label className="block text-2xs font-bold text-gray-700 uppercase">
                Property Category
              </label>
              <select
                value={modalCategory}
                onChange={e => setModalCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold text-gray-800 bg-white"
              >
                {propertyCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Serial Number / Asset Tag */}
            <div className="space-y-1">
              <label className="block text-2xs font-bold text-gray-700 uppercase">
                Serial No / Asset Tag
              </label>
              <input
                type="text"
                value={modalSerialNumber}
                onChange={e => setModalSerialNumber(e.target.value)}
                placeholder="e.g. LAP-DL-0824, SIM-98765"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono font-bold text-gray-900"
              />
            </div>

            {/* Quantity & UOM */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-2xs font-bold text-gray-700 uppercase">Quantity</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={modalQuantity}
                  onChange={e => setModalQuantity(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-bold text-gray-900"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-2xs font-bold text-gray-700 uppercase">UOM</label>
                <input
                  type="text"
                  value={modalUom}
                  onChange={e => setModalUom(e.target.value)}
                  placeholder="NOS"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-gray-800"
                />
              </div>
            </div>

            {/* Assigned Date */}
            <div className="space-y-1">
              <label className="block text-2xs font-bold text-gray-700 uppercase">
                Assigned / Issue Date *
              </label>
              <input
                type="date"
                value={modalAssignedDate}
                onChange={e => setModalAssignedDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-gray-800 font-semibold"
              />
            </div>

            {/* Expected Return Date */}
            <div className="space-y-1">
              <label className="block text-2xs font-bold text-gray-700 uppercase flex items-center justify-between">
                <span>Expected Return Date</span>
                {modalExpectedReturnDate && (
                  <button
                    type="button"
                    onClick={() => setModalExpectedReturnDate('')}
                    className="text-3xs text-indigo-600 hover:text-indigo-800 underline font-normal"
                  >
                    Clear (Set Permanent)
                  </button>
                )}
              </label>
              <input
                type="date"
                value={modalExpectedReturnDate}
                onChange={e => setModalExpectedReturnDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-gray-800"
              />
            </div>

            {/* Condition at Issue */}
            <div className="space-y-1">
              <label className="block text-2xs font-bold text-gray-700 uppercase">
                Condition at Issue
              </label>
              <select
                value={modalCondition}
                onChange={e => setModalCondition(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold text-gray-800 bg-white"
              >
                <option value="NEW">NEW - Brand New</option>
                <option value="GOOD">GOOD - Excellent Working Condition</option>
                <option value="FAIR">FAIR - Used / Minor Cosmetic Wear</option>
              </select>
            </div>

            {/* Handover Notes / Remarks */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-2xs font-bold text-gray-700 uppercase">
                Handover Notes / Accessories Included
              </label>
              <textarea
                rows={2}
                value={modalRemarks}
                onChange={e => setModalRemarks(e.target.value)}
                placeholder="e.g. Laptop charger, bag, power cable and mouse included. Handed over with sign-off."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-gray-800"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => {
                setShowAssignModal(false);
                resetAssignForm();
              }}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignSubmit}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold"
            >
              {isEditMode ? 'Update Assignment' : 'Assign Property'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Return Property Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setReturnTargetItem(null);
        }}
        title="Return Property & Asset Clearance"
        size="md"
      >
        {returnTargetItem && (
          <div className="space-y-3 text-xs p-1">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-2xs space-y-1">
              <div className="font-bold text-gray-900 text-xs">
                {returnTargetItem.itemName}
              </div>
              <div className="text-gray-600">
                Employee: <strong>{returnTargetItem.employeeName}</strong> ({returnTargetItem.employeeCode || '-'})
              </div>
              <div className="text-gray-600 font-mono">
                Serial / Asset Tag: <strong>{returnTargetItem.serialNumber || '---'}</strong>
              </div>
              <div className="text-gray-600">
                Issued on: {returnTargetItem.assignedDate} &bull; Condition: {returnTargetItem.conditionAtIssue}
              </div>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-2xs font-bold text-gray-700 uppercase">
                  Return Date *
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-2xs font-bold text-gray-700 uppercase">
                  Condition at Return *
                </label>
                <select
                  value={returnCondition}
                  onChange={e => setReturnCondition(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-semibold text-gray-800 bg-white"
                >
                  <option value="GOOD">GOOD - Fully Functional, No Damage</option>
                  <option value="DAMAGED">DAMAGED - Requires Repair / Defective</option>
                  <option value="SCRAP">SCRAP - Unusable / Beyond Repair</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-2xs font-bold text-gray-700 uppercase">
                  Received By *
                </label>
                <input
                  type="text"
                  value={receivedBy}
                  onChange={e => setReceivedBy(e.target.value)}
                  placeholder="Store / HR executive name"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-gray-900"
                />
              </div>

              {returnCondition === 'DAMAGED' && (
                <div className="space-y-1">
                  <label className="block text-2xs font-bold text-red-700 uppercase">
                    Damage Recovery / Deduction Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={damageDeduction}
                    onChange={e => setDamageDeduction(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 border border-red-300 rounded font-mono font-bold text-red-900 bg-red-50/50"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-2xs font-bold text-gray-700 uppercase">
                  Return Remarks
                </label>
                <textarea
                  rows={2}
                  value={returnRemarks}
                  onChange={e => setReturnRemarks(e.target.value)}
                  placeholder="e.g. Returned on resignation clearance, charger and bag verified."
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-gray-800"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnTargetItem(null);
                }}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturnSubmit}
                className="px-4 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 font-bold"
              >
                Complete Return
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
