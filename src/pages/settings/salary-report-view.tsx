// salary report view - read only version for reports sidebar

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '@/state/store';
import { getSalaryReport } from '@/state/salarySlice';
import { getAllEmployees } from '@/state/employeeSlice';
import { getAllAllowanceAdvance } from '@/state/allowanceAdvanceSlice';
import { fetchHolidays } from '@/state/holidaySlice';
import { DataTable } from '@/components/data/DataTable';
import { Download, Printer } from 'lucide-react';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { toast } from 'react-toastify';

const formatAmount = (val: any) => {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-IN');
};

export default function SalaryReportViewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => location.state || {}, [location.state]);

  const { salaryReportList, loading } = useSelector((state: RootState) => state.salary);
  const { employeeList } = useSelector((state: RootState) => state.employee);
  const { allAllowanceAdvanceList } = useSelector((state: RootState) => state.allowanceAdvance);
  const { holidayList } = useSelector((state: RootState) => state.holiday);

  const [month, setMonth] = useState(params.month || '');
  const [fromDate, setFromDate] = useState(params.fromDate || '');
  const [toDate, setToDate] = useState(params.toDate || '');
  const [singleDate, setSingleDate] = useState(params.singleDate || (params.filterType === 'single' ? params.fromDate : ''));
  const [filterType, setFilterType] = useState<'month' | 'range' | 'single'>(params.filterType || 'month');
  const [tableColumnFilters, setTableColumnFilters] = useState<Record<string, boolean>>({});
  const [selectedUnit, setSelectedUnit] = useState(params.selectedUnit || '');
  const [selectedDesignation, setSelectedDesignation] = useState(params.selectedDesignation || '');
  const [pfFilter, setPfFilter] = useState<'all' | 'pf' | 'non-pf'>(params.pfFilter || 'all');

  useEffect(() => {
    if (filterType === 'month' && month) {
      dispatch(getSalaryReport(month));
    } else if (filterType === 'single' && (singleDate || fromDate)) {
      const targetDate = singleDate || fromDate;
      dispatch(getSalaryReport({ fromDate: targetDate, toDate: targetDate }));
    } else if (filterType === 'range' && (fromDate || toDate)) {
      const effFrom = fromDate || toDate;
      const effTo = toDate || fromDate;
      dispatch(getSalaryReport({ fromDate: effFrom, toDate: effTo }));
    }
  }, [dispatch, month, fromDate, toDate, singleDate, filterType]);

  useEffect(() => {
    dispatch(getAllEmployees({ fetchAll: true }));
    dispatch(getAllAllowanceAdvance({ fetchAll: true }));
    dispatch(fetchHolidays());
  }, [dispatch]);




  // Columns with grouping for multi-level header - READ ONLY VERSION
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
            const emp = (employeeList || []).find((e: any) => 
              String(e.id) === String(row.original.employeeId) || 
              (e.employeeCode && row.original.employeeCode && e.employeeCode.trim().toUpperCase() === row.original.employeeCode.trim().toUpperCase())
            );
            return value || emp?.employmentDetails?.department ||'-';
          }
        },
        { 
          Header: 'Designation', 
          accessor: 'designation', 
          width: 150,
          Cell: ({ value, row }: any) => {
            const emp = (employeeList || []).find((e: any) => 
              String(e.id) === String(row.original.employeeId) || 
              (e.employeeCode && row.original.employeeCode && e.employeeCode.trim().toUpperCase() === row.original.employeeCode.trim().toUpperCase())
            );
            return value || emp?.employmentDetails?.designation || '-';
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
          Cell: ({ value }: any) => value || 0,
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
          Cell: ({ value }: any) => (Number(value) || 0).toFixed(2),
        },
        { Header: 'Festival Wages Working Hours', accessor: 'festivalHoursWorked', width: 140,
          Cell: ({ value }: any) => (Number(value) || 0).toFixed(2),
        },
        { 
          Header: 'Attendance Incentive', 
          accessor: 'attendanceIncentive', 
          Cell: ({ value }: any) => formatAmount(value),
          width: 120 
        },
        { 
          Header: 'Production Incentive', 
          accessor: 'productionIncentive', 
          Cell: ({ value }: any) => formatAmount(value),
           width: 120
        },
        { 
          Header: 'Food Allowance', 
          accessor: 'foodAllowance',
          id: 'foodAllowanceBasic',
          Cell: ({ value }: any) => formatAmount(value),
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
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { 
          Header: 'OT', 
          accessor: 'otSalary',
          Cell: ({ value }: any) => formatAmount(value),
          width: 80
        },
        { 
          Header: 'Festival Wages', 
          accessor: 'festivalWageSalary',
          Cell: ({ value }: any) => formatAmount(value),
          width: 110
        },
        { 
          Header: 'Att. Incentive', 
          accessor: 'attIncentive',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { 
          Header: 'Prod. Incentive', 
          accessor: 'prodIncentive',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { 
          Header: 'FoodAllowance', 
          accessor: 'foodAllowance',
          id: 'foodAllowanceEarning',
          Cell: ({ value }: any) => formatAmount(value),
          width: 80
        },
        { 
          Header: 'House Rent', 
          accessor: 'houseRent',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { 
          Header: 'TOTAL', 
          accessor: 'total',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
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
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { 
          Header: 'HRA', 
          accessor: 'hra',
          Cell: ({ value }: any) => formatAmount(value),
          width: 80
        },
        { 
          Header: 'TA', 
          accessor: 'ta',
          Cell: ({ value }: any) => formatAmount(value),
          width: 80
        },
        { 
          Header: 'Medical', 
          accessor: 'medical',
          Cell: ({ value }: any) => formatAmount(value),
          width: 80
        },
        { 
          Header: 'Total Earning', 
          accessor: 'totalEarningForPF',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
      ]
    },
    // Deductions group
    {
      Header: 'Deductions',
      headerClassName: 'border-l-4 border-l-slate-300 border-b-4 border-b-slate-300',
      columns: [
        { 
          Header: 'Salary Advance', 
          accessor: 'salaryAdvanceDeduction',
          cellClassName: 'border-l-4 border-l-slate-300',
          headerClassName: 'border-l-4 border-l-slate-300',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { 
          Header: 'PF - 12%', 
          accessor: 'pfDeduction',
          Cell: ({ value }: any) => formatAmount(value),
          width: 80
        },
        { 
          Header: 'ESI - 0.75%', 
          accessor: 'esiDeduction',
          Cell: ({ value }: any) => formatAmount(value),
          width: 100
        },
        { 
          Header: 'Canteen', 
          accessor: 'canteenDeduction',
          Cell: ({ value }: any) => formatAmount(value),
          width: 80
        },
        { 
          Header: 'TDS', 
          accessor: 'tds',
          Cell: ({ value }: any) => formatAmount(value),
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
      Cell: ({ value }: any) => value || '-',
      width: 150
    },
  ], [month]);

  // Extract unique departments and designations from salaryReportList (with fallback to employeeList)
  const departments = useMemo(() => {
    const set = new Set<string>();
    (salaryReportList || []).forEach((item: any) => {
      const emp = (employeeList || []).find((e: any) => 
        String(e.id) === String(item.employeeId) || 
        (e.employeeCode && item.employeeCode && e.employeeCode.trim().toUpperCase() === item.employeeCode.trim().toUpperCase())
      );
      const dep = item.department || emp?.employmentDetails?.department;
      if (dep && dep.trim()) {
        set.add(dep.trim());
      }
    });
    if (set.size === 0 && Array.isArray(employeeList)) {
      employeeList.forEach((emp: any) => {
        const dep = emp.employmentDetails?.department || emp.department;
        if (dep && dep.trim()) {
          set.add(dep.trim());
        }
      });
    }
    return Array.from(set).sort();
  }, [salaryReportList, employeeList]);

  const unitDepartments = useMemo(() => {
    if (selectedUnit === 'A-Unit') {
      return departments.filter(dept => dept.trim().toLowerCase() !== 'brushing');
    } else if (selectedUnit === 'C-Unit') {
      return departments.filter(dept => dept.trim().toLowerCase() === 'brushing');
    }
    return [];
  }, [departments, selectedUnit]);

  const designations = useMemo(() => {
    const set = new Set<string>();
    (salaryReportList || []).forEach((item: any) => {
      const emp = (employeeList || []).find((e: any) => 
        String(e.id) === String(item.employeeId) || 
        (e.employeeCode && item.employeeCode && e.employeeCode.trim().toUpperCase() === item.employeeCode.trim().toUpperCase())
      );
      const desg = item.designation || emp?.employmentDetails?.designation;
      if (desg && desg.trim()) {
        set.add(desg.trim());
      }
    });
    if (set.size === 0 && Array.isArray(employeeList)) {
      employeeList.forEach((emp: any) => {
        const desg = emp.employmentDetails?.designation || emp.designation;
        if (desg && desg.trim()) {
          set.add(desg.trim());
        }
      });
    }
    return Array.from(set).sort();
  }, [salaryReportList, employeeList]);

const filteredData = useMemo(() => {
  if (filterType === 'month') {
    if (!month) return [];
    const baseData = (salaryReportList || []).filter((item: any) => 
      item.month === month && item.isSalaryGenerated === 1
    );

    return baseData.map((item: any) => {
      const matchingAdvances = (allAllowanceAdvanceList || []).filter((adv: any) => 
        String(adv.employeeId) === String(item.employeeId) &&
        adv.month === month &&
        adv.type === 'Salary Advance'
      );

      const sum = matchingAdvances.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

      const savedAdvance = (item.salaryAdvanceDeduction !== undefined && item.salaryAdvanceDeduction !== null)
        ? Number(item.salaryAdvanceDeduction)
        : sum;
      const loanDeduction = Number(item.loanDeduction || 0);

      const houseRent = Number(item.houseRent || 0);
      const total = Number(item.basicSalary || 0) + Number(item.otSalary || 0) + Number(item.festivalWageSalary || 0) + Number(item.attIncentive || 0) + Number(item.prodIncentive || 0) + houseRent;
      const salaryAdvanceDeduction = savedAdvance + loanDeduction;
      const pfDeduction = Number(item.pfDeduction || 0);
      const esiDeduction = Number(item.esiDeduction || 0);
      const canteenDeduction = Number(item.canteenDeduction || 0);
      const tds = Number(item.tds || 0);
      const totalDeduction = salaryAdvanceDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
      const totalEarningForPF = (Number(item.basicDA || 0) + Number(item.hra || 0) + Number(item.ta || 0) + Number(item.medical || 0)) || total;
      const netSalary = totalEarningForPF - totalDeduction;

      return {
        ...item,
        total,
        totalEarningForPF,
        salaryAdvanceDeduction,
        totalDeduction,
        netSalary
      };
    });
  } else if (filterType === 'single') {
    const targetDate = singleDate || fromDate;
    if (!targetDate) return [];
    const baseData = (salaryReportList || []).filter((item: any) => !item.month || item.month === targetDate);

    return baseData.map((item: any) => {
      const matchingAdvances = (allAllowanceAdvanceList || []).filter((adv: any) => 
        String(adv.employeeId) === String(item.employeeId) &&
        adv.month === item.month &&
        adv.type === 'Salary Advance'
      );

      const sum = matchingAdvances.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

      const savedAdvance = (item.salaryAdvanceDeduction !== undefined && item.salaryAdvanceDeduction !== null)
        ? Number(item.salaryAdvanceDeduction)
        : sum;
      const loanDeduction = Number(item.loanDeduction || 0);

      const houseRent = Number(item.houseRent || 0);
      const total = Number(item.basicSalary || 0) + Number(item.otSalary || 0) + Number(item.festivalWageSalary || 0) + Number(item.attIncentive || 0) + Number(item.prodIncentive || 0) + houseRent;
      const salaryAdvanceDeduction = savedAdvance + loanDeduction;
      const pfDeduction = Number(item.pfDeduction || 0);
      const esiDeduction = Number(item.esiDeduction || 0);
      const canteenDeduction = Number(item.canteenDeduction || 0);
      const tds = Number(item.tds || 0);
      const totalDeduction = salaryAdvanceDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
      const totalEarningForPF = (Number(item.basicDA || 0) + Number(item.hra || 0) + Number(item.ta || 0) + Number(item.medical || 0)) || total;
      const netSalary = totalEarningForPF - totalDeduction;

      return {
        ...item,
        total,
        totalEarningForPF,
        salaryAdvanceDeduction,
        totalDeduction,
        netSalary
      };
    });
  } else {
    const effFrom = fromDate || toDate;
    const effTo = toDate || fromDate;
    if (!effFrom || !effTo) return [];
    const baseData = salaryReportList || [];

    return baseData.map((item: any) => {
      const matchingAdvances = (allAllowanceAdvanceList || []).filter((adv: any) => 
        String(adv.employeeId) === String(item.employeeId) &&
        adv.month === item.month &&
        adv.type === 'Salary Advance'
      );

      const sum = matchingAdvances.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

      const savedAdvance = (item.salaryAdvanceDeduction !== undefined && item.salaryAdvanceDeduction !== null)
        ? Number(item.salaryAdvanceDeduction)
        : sum;
      const loanDeduction = Number(item.loanDeduction || 0);

      const houseRent = Number(item.houseRent || 0);
      const total = Number(item.basicSalary || 0) + Number(item.otSalary || 0) + Number(item.festivalWageSalary || 0) + Number(item.attIncentive || 0) + Number(item.prodIncentive || 0) + houseRent;
      const salaryAdvanceDeduction = savedAdvance + loanDeduction;
      const pfDeduction = Number(item.pfDeduction || 0);
      const esiDeduction = Number(item.esiDeduction || 0);
      const canteenDeduction = Number(item.canteenDeduction || 0);
      const tds = Number(item.tds || 0);
      const totalDeduction = salaryAdvanceDeduction + pfDeduction + esiDeduction + canteenDeduction + tds;
      const totalEarningForPF = (Number(item.basicDA || 0) + Number(item.hra || 0) + Number(item.ta || 0) + Number(item.medical || 0)) || total;
      const netSalary = totalEarningForPF - totalDeduction;

      return {
        ...item,
        total,
        totalEarningForPF,
        salaryAdvanceDeduction,
        totalDeduction,
        netSalary
      };
    });
  }
}, [salaryReportList, month, fromDate, toDate, singleDate, filterType, allAllowanceAdvanceList]);

// Apply column filters to the data
const dataWithColumnFilters = useMemo(() => {
  if (!tableColumnFilters || Object.keys(tableColumnFilters).length === 0) {
    return filteredData;
  }
  
  return filteredData.map((item: any) => {
    const filteredItem = { ...item };
    
    // Apply filters to specific columns
    Object.keys(tableColumnFilters).forEach((columnKey) => {
      if (!tableColumnFilters[columnKey]) {
        // Hide column by setting value to null or empty
        filteredItem[columnKey] = null;
      }
    });
    
    return filteredItem;
  });
}, [filteredData, tableColumnFilters]);

// Filter data by selected Unit, Designation, and PF Status using saved report data (from salarySlice)
const displayedData = useMemo(() => {
  return dataWithColumnFilters.filter((item: any) => {
    const emp = (employeeList || []).find((e: any) => 
      String(e.id) === String(item.employeeId) || 
      (e.employeeCode && item.employeeCode && e.employeeCode.trim().toUpperCase() === item.employeeCode.trim().toUpperCase())
    );
    
    const empDept = item.department || emp?.employmentDetails?.department || '';
    const empDesg = item.designation || emp?.employmentDetails?.designation ||  '';
    
    let matchesUnit = true;
    if (selectedUnit === 'A-Unit') {
      matchesUnit = empDept.trim().toLowerCase() !== 'brushing';
    } else if (selectedUnit === 'C-Unit') {
      matchesUnit = empDept.trim().toLowerCase() === 'brushing';
    }
    
    const matchesDesg = !selectedDesignation || empDesg === selectedDesignation;

    let matchesPf = true;
    if (pfFilter === 'pf') {
      const isPf = emp && emp.pfApplicable !== undefined && emp.pfApplicable !== null
        ? (emp.pfApplicable === true || (emp.pfApplicable as any) === 1 || String(emp.pfApplicable).toLowerCase() === 'true')
        : (item.pfApplicable === true || Number(item.pfDeduction || 0) > 0);
      matchesPf = isPf;
    } else if (pfFilter === 'non-pf') {
      const isPf = emp && emp.pfApplicable !== undefined && emp.pfApplicable !== null
        ? (emp.pfApplicable === true || (emp.pfApplicable as any) === 1 || String(emp.pfApplicable).toLowerCase() === 'true')
        : (item.pfApplicable === true || Number(item.pfDeduction || 0) > 0);
      matchesPf = !isPf;
    }
    
    return matchesUnit && matchesDesg && matchesPf;
  });
}, [dataWithColumnFilters, employeeList, selectedUnit, selectedDesignation, pfFilter]);

// Sort data to ensure latest entries appear first (by employee ID descending)
const sortedData = useMemo(() => {
  return [...displayedData].sort((a, b) => (b.employeeId || 0) - (a.employeeId || 0));
}, [displayedData]);

// Auto trigger pdf / print / excel action
useEffect(() => {
  if (!loading && sortedData.length > 0 && params?.actionType) {
    if (params.actionType === "excel") {
      toast.info("Generating Excel sheet...");
      const timer = setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const excelBtn = buttons.find(b => b.textContent?.trim().toLowerCase().includes('excel'));
        if (excelBtn) {
          (excelBtn as HTMLButtonElement).click();
        } else {
          console.warn("Excel button not found");
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (params.actionType === "pdf") {
      toast.info("Generating PDF... If blocked, please allow popups for this page or click the 'PDF' button at the top-right of the table.");
      const timer = setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const pdfBtn = buttons.find(b => b.textContent?.trim().toLowerCase().includes('pdf'));
        if (pdfBtn) {
          (pdfBtn as HTMLButtonElement).click();
        } else {
          console.warn("PDF button not found");
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (params.actionType === "print") {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }
}, [loading, sortedData, params?.actionType]);

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
  
  columnsToSum.forEach(column => {
    totals[column] = sortedData.reduce((sum: number, row: any) => {
      return sum + Number(row[column] || 0);
    }, 0);
  });

  return totals;
}, [sortedData]);

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

  const isActive = filterType === 'month' 
    ? !!month 
    : filterType === 'single'
      ? !!(singleDate || fromDate)
      : (!!fromDate && !!toDate);

  const reportTitle = filterType === 'month' 
    ? (month ? `Salary_Report_${month}` : 'Salary_Report') 
    : filterType === 'single'
      ? (singleDate || fromDate ? `Salary_Report_${singleDate || fromDate}` : 'Salary_Report')
      : (fromDate && toDate ? `Salary_Report_${fromDate}_to_${toDate}` : 'Salary_Report');

  const formattedPeriod = useMemo(() => {
    if (filterType === 'month') {
      return month ? new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'All Months';
    } else if (filterType === 'single') {
      const dt = singleDate || fromDate;
      return dt ? new Date(dt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Single Date';
    }
    return fromDate && toDate ? `${fromDate} to ${toDate}` : 'All Dates';
  }, [filterType, month, fromDate, toDate, singleDate]);

  const totalDays = useMemo(() => {
    if (filterType === 'month') {
      if (!month) return 0;
      const [year, m] = month.split('-').map(Number);
      return new Date(year, m, 0).getDate();
    } else if (filterType === 'single') {
      return (singleDate || fromDate) ? 1 : 0;
    } else {
      if (!fromDate || !toDate) return 0;
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
  }, [filterType, month, fromDate, toDate, singleDate]);

  const sundaysCount = useMemo(() => {
    let start: Date;
    let end: Date;
    if (filterType === 'month') {
      if (!month) return 0;
      const [year, m] = month.split('-').map(Number);
      start = new Date(year, m - 1, 1);
      end = new Date(year, m, 0);
    } else if (filterType === 'single') {
      const dt = singleDate || fromDate;
      if (!dt) return 0;
      return new Date(dt).getDay() === 0 ? 1 : 0;
    } else {
      if (!fromDate || !toDate) return 0;
      start = new Date(fromDate);
      end = new Date(toDate);
    }
    let count = 0;
    let current = new Date(start);
    while (current <= end) {
      if (current.getDay() === 0) { // Sunday is 0
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }, [filterType, month, fromDate, toDate, singleDate]);

  const holidayCount = useMemo(() => {
    let countFromSlice = 0;
    if (holidayList && holidayList.length > 0) {
      if (filterType === 'month' && month) {
        countFromSlice = holidayList.filter((h: any) => {
          if (!h.holidayDate) return false;
          const rawDate = String(h.holidayDate).trim();
          if (rawDate.length >= 7 && rawDate.includes('-')) {
            const yyyyMm = rawDate.slice(0, 7);
            if (yyyyMm === month) return true;
          }
          return false;
        }).length;
      } else if (filterType === 'single') {
        const dt = singleDate || fromDate;
        if (dt) {
          countFromSlice = holidayList.filter((h: any) => {
            if (!h.holidayDate) return false;
            const rawDate = String(h.holidayDate).trim().slice(0, 10);
            return rawDate === dt;
          }).length;
        }
      } else if (filterType === 'range' && fromDate && toDate) {
        countFromSlice = holidayList.filter((h: any) => {
          if (!h.holidayDate) return false;
          const rawDate = String(h.holidayDate).trim().slice(0, 10);
          return rawDate >= fromDate && rawDate <= toDate;
        }).length;
      }
    }

    if (countFromSlice > 0) {
      return countFromSlice;
    }

    if (sortedData && sortedData.length > 0) {
      const firstWithHolidays = sortedData.find((item: any) => item.holidays != null && item.holidays > 0);
      return firstWithHolidays ? Number(firstWithHolidays.holidays) : Number(sortedData[0].holidays || 0);
    }
    return 0;
  }, [holidayList, filterType, month, fromDate, toDate, singleDate, sortedData]);

  return (
    <div className="p-6 pt-16 salary-report-view-container">
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
          .salary-report-view-container {
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
     
<div className="mb-6 print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
  <div className="flex items-center gap-3 flex-wrap">
    <button
      onClick={() => navigate("/settings/salary-report-view")}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm animate-in fade-in duration-200"
    >
      ← Back to Filters
    </button>

    <div className="flex items-center gap-2">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Mode:</label>
      <select
        className="select border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 px-2.5 py-1 text-xs font-medium cursor-pointer"
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

    {filterType === 'month' ? (
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-700">Select Month:</label>
        <input 
          type="month" 
          className="input border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-2 py-1 text-xs" 
          value={month} 
          onChange={(e) => setMonth(e.target.value)} 
        />
      </div>
    ) : filterType === 'single' ? (
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-700">Select Date:</label>
        <input 
          type="date" 
          className="input border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-2 py-1 text-xs" 
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
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-700">From:</label>
          <input 
            type="date" 
            className="input border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-2 py-1 text-xs" 
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
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-700">To:</label>
          <input 
            type="date" 
            className="input border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-2 py-1 text-xs" 
            value={toDate} 
            onChange={(e) => setToDate(e.target.value)} 
          />
        </div>
      </div>
    )}
  </div>

  <button
    onClick={() => window.print()}
    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-150 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 shadow-sm"
  >
    <Printer className="h-3.5 w-3.5" />
    Print
  </button>
</div>
      {/* Report Summary Headers Block */}
      <div className="border-b border-slate-200 pb-5 mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Salary Report
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold text-indigo-700">
            Month: {formattedPeriod}
          </span>
          <span className="inline-flex items-center bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-700">
            No. of Days: {totalDays}
          </span>
          <span className="inline-flex items-center bg-amber-50 border border-amber-100 px-3 py-1 rounded-full text-xs font-bold text-amber-700">
            No. of Sundays: {sundaysCount}
          </span>
          <span className="inline-flex items-center bg-rose-50 border border-rose-100 px-3 py-1 rounded-full text-xs font-bold text-rose-700">
            No. of Holidays: {holidayCount}
          </span>
          {selectedUnit && (
            <span className="inline-flex items-center bg-violet-50 border border-violet-100 px-3 py-1 rounded-full text-xs font-bold text-violet-700">
              Unit: {selectedUnit}
            </span>
          )}
          {selectedDesignation && (
            <span className="inline-flex items-center bg-teal-50 border border-teal-100 px-3 py-1 rounded-full text-xs font-bold text-teal-700">
              Designation: {selectedDesignation}
            </span>
          )}
          {pfFilter !== 'all' && (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
              pfFilter === 'pf'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-amber-50 border-amber-100 text-amber-700'
            }`}>
              PF Status: {pfFilter === 'pf' ? 'PF Employees' : 'Non-PF Employees'}
            </span>
          )}
          <span className="inline-flex items-center bg-sky-50 border border-sky-100 px-3 py-1 rounded-full text-xs font-bold text-sky-700">
            Total Employees: {sortedData.length}
          </span>
          {selectedUnit && (
            <div className="w-full mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">Unit Departments:</span>
              {unitDepartments.map((dept) => (
                <span key={dept} className="inline-flex items-center bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-full text-xs font-bold text-indigo-750 shadow-sm">
                  {dept}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={sortedData}
        title={reportTitle}
        loading={loading}
        showExport={true}
        showPdfExport={true}
        pdfFileName={isActive ? reportTitle : ''}
        showColumnFilters={false}
        columnFilters={tableColumnFilters}
        onColumnFiltersChange={setTableColumnFilters}
        grandTotal={grandTotals}
        totalColumnKeys={totalColumnKeys}
        onlyGrandTotal={true}
        grandTotalLabel="TOTAL"
        virtualScroll={true}
        isShowPagination={false}
        disableFullDataFetch={true}
        virtualScrollHeight='70vh'
      />
    </div>
  );
}
