import React, { useState, useMemo, useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Search, Download, ChevronDown, ChevronUp, Edit, Trash, Eye, Plus, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy, Printer, LayoutGrid, List } from 'lucide-react';
import { exportToExcel, exportToPdf, cn } from '@/lib/utils';
import { useSelector, useDispatch } from 'react-redux';
// @ts-ignore
import { useVirtualizer } from '@tanstack/react-virtual';
import { selectHasPermission } from '@/state/permissionSlice';
import { getAllFabricMastersForDropdown } from '@/state/fabricMasterSlice';
import { useLocation } from 'react-router-dom';
import apiService from '@/services/ApiService';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
import { useRouteHero, type RouteHeroSummary } from '@/contexts/RouteHeroContext';

let _dtAppSessionActive = false;

interface Column {
  Header: string | React.ReactNode;
  accessor: string | ((row: any) => any);
  id?: string;
  Cell?: (props: { value: any; row: any }) => React.ReactNode;
  Filter?: React.ComponentType<any>;
  filter?: (rows: any[], columnIds: string[], filterValue: any) => any[];
  disableFilters?: boolean;
  width?: number;
  minWidth?: number;
  isSectionStart?: boolean;
  filterVariant?: 'text' | 'select' | 'date' | 'range';
  filterOptions?: Array<{ label: string; value: any } | string | number>;
  isSelect?: boolean;
  align?: 'left' | 'center' | 'right';
  cellContentClassName?: string;
  disableSorting?: boolean;
}

interface DataTableSummaryConfig {
  dataIsComplete?: boolean;
  statusField?: string;
  activeValues?: readonly (string | number | boolean)[];
  inactiveValues?: readonly (string | number | boolean)[];
}

interface DataTableProps {
  columns: any[];
  data: any[];
  title?: string;
  headerContent?: React.ReactNode | ((props: { filteredData: any[]; processedTotals: Record<string, number>; isSearchActive: boolean }) => React.ReactNode);
  headerActions?: React.ReactNode | ((props: { filteredData: any[]; processedTotals: Record<string, number>; isSearchActive: boolean }) => React.ReactNode);
  summaryConfig?: DataTableSummaryConfig;
  onFilteredDataChange?: (filteredData: any[], processedTotals: Record<string, number>) => void;
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onClone?: (row: any) => void;
  onView?: (row: any) => void;
  onPrint?: (row: any) => void;
  onPending?: () => void;
  onApproved?: () => void;
  activeTab?: string;
  showActions?: boolean;
  showAddActions?: boolean;
  showExport?: boolean;
  filterPlaceholder?: string;
  showColumnFilters?: boolean;
  showPdfExport?: boolean;
  pdfHeaders?: string[];
  pdfFileName?: string;
  canShowActions?: (row: any) => boolean;
  renderActions?: (row: any) => React.ReactNode;
  loading?: boolean;
  hideDeleteAction?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  columnFilters?: Record<string, any>;
  onColumnFiltersChange?: (filters: Record<string, any>) => void;
  grandTotal?: Record<string, number>;
  totalColumnKey?: string | null;
  totalColumnKeys?: string[];
  onlyGrandTotal?: boolean;
  showGrandTotal?: boolean;
  grandTotalLabel?: string;
  offset?: number;
  searchQueryParams?: Record<string, any>;
  searchApiEndpoint?: string;
  highlightRowId?: number | null;
  isShowPagination?: boolean;
  disableFullDataFetch?: boolean;
  onRowClick?: (row: any) => void;
  onRowDoubleClick?: (row: any) => void;
  getRowClassName?: (row: any) => string;
  renderRowDetails?: (row: any) => React.ReactNode;
  getRowId?: (row: any) => string;
  virtualScroll?: boolean;
  virtualScrollHeight?: string;
  rowHeight?: number;
  bodyCellClassName?: string;
  disableColumnExpand?: boolean;
  showToolbar?: boolean;
  showSearch?: boolean;
  disableSorting?: boolean;
  disableAutoFormatting?: boolean;
  cellContentClassName?: string;
  emptyMessage?: string;
  tableClassName?: string;
  defaultViewMode?: 'table' | 'cards';
  viewMode?: 'table' | 'cards';
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  showViewToggle?: boolean;
  renderCard?: (props: { row: any; index: number; columns: any[]; actions: React.ReactNode }) => React.ReactNode;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

function getExplicitStatus(row: any, config?: DataTableSummaryConfig): boolean | null {
  const fields = config?.statusField
    ? [config.statusField]
    : ['activeFlag', 'isActive', 'isActiveFlag', 'active', 'status'];
  const activeValues = config?.activeValues ?? [true, 'true', 'active', 'enabled'];
  const inactiveValues = config?.inactiveValues ?? [false, 'false', 'inactive', 'disabled'];

  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(row, field)) continue;
    const value = row[field];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (activeValues.some((candidate) => String(candidate).toLowerCase() === normalized)) return true;
      if (inactiveValues.some((candidate) => String(candidate).toLowerCase() === normalized)) return false;
    }
    return null;
  }

  return null;
}

function countStatuses(rows: any[], config?: DataTableSummaryConfig) {
  if (rows.length === 0) return { active: 0, inactive: 0 };

  let active = 0;
  let inactive = 0;
  for (const row of rows) {
    const status = getExplicitStatus(row, config);
    if (status === null) return null;
    if (status) active += 1;
    else inactive += 1;
  }

  return { active, inactive };
}

// Default Column Filter Component
export function DefaultColumnFilter({ column: { filterValue, setFilter } }: any) {
  return (
    <input
      value={filterValue || ''}
      onChange={e => setFilter(e.target.value || undefined)}
      placeholder="Filter..."
      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#008F8C]/20 focus:border-[#008F8C] transition-all text-[#102F50] font-medium bg-white"
    />
  );
}

// Select/Dropdown Column Filter Component
export function SelectColumnFilter({
  column: { filterValue, setFilter },
  options = [],
}: {
  column: { filterValue: any; setFilter: (val: any) => void; id?: string; Header?: any };
  options?: Array<{ label: string; value: any }>;
}) {
  return (
    <select
      value={filterValue ?? ''}
      onChange={e => setFilter(e.target.value || undefined)}
      className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#008F8C]/20 focus:border-[#008F8C] transition-all text-[#102F50] font-medium bg-white cursor-pointer"
    >
      <option value="">All</option>
      {options.map((option, index) => (
        <option key={`${option.value}-${index}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}


// Helper function to determine if companyId should be excluded for master screens
const shouldExcludeCompanyId = (path: string): boolean => {
  // Exclude companyId for master screens, location masters, and settings
  // But include companyId for flange-master as it's company-specific
  return (path.startsWith('/masters/') && path !== '/masters/flange-master') || 
         path.startsWith('/location-masters/') || 
         path.startsWith('/settings/');
};

// Route to API mapping
const routeToApiMap: Record<string, string> = {
  '/location-masters/state-master': '/state',
  '/location-masters/city-master': '/city',
  '/location-masters/country-master': '/country',
  '/transaction/purchase-order-details': '/purchase-orders',
  '/transaction/sales-order-details': '/sales-orders',
  '/masters/category': '/category',
  '/masters/sub-category': '/sub-category',
  '/masters/vendor': '/vendor',
  '/masters/customer': '/customer',
  '/masters/uom-master': '/uom',
  '/masters/warehouse': '/warehouse',
  '/masters/brand-master': '/brand-master',
  '/masters/process-master': '/process',
  '/masters/quality-master': '/fabric-master', // Logic handled in handleExcelExport was specialized, we keep it simple here or refine
  '/masters/fabric-management': '/fabric-master',
  '/masters/yarn-master': '/yarn',
  '/masters/gst-master': '/gst',
  '/transaction/invoice-details': '/invoice',
  '/transaction/invoice-management': '/invoices',
  '/transaction/purchase-inward-details': '/purchase-inward',
  '/transaction/sales-return-management': '/sales-returns',
  '/transaction/purchase-return-details': '/purchase-returns',
  '/transaction/lot-details': '/lot-details',
  '/transaction/costing-list': '/costing-transaction',
  '/settings/number-format-configuration-list': '/number-format-configurations',
  '/transaction/opening-balance': '/opening-balance',
  '/transaction/sales-return-details': '/sales-returns',
  '/transaction/item-outward': '/item-outward',
  '/transaction/analysis-report-list': '/analysis-report/completed',
  '/masters/woven-fabric-master': '/fabric-master',
  '/masters/knitted-fabric-master': '/knitted-fabric-master',
  '/masters/fabric-category': '/fabric-category',
  '/masters/finishFabric-master': '/finish-master',
  '/masters/fabric-type': '/fabric-type',
  '/masters/po-type-master': '/po-type-master',
  '/masters/flange-master': '/flange',
  '/masters/machine-master': '/machine-master',
  '/masters/loom-master': '/loom-master',
  '/masters/employee': '/employee',
  '/masters/company': '/company',
  '/masters/grade-master': '/grade-master',
  '/masters/defect-master': '/defect-master',
  '/masters/consignee': '/consignee',
  '/masters/buying-office': '/buying-office',
  '/masters/customer-management': '/customer',
  '/masters/agent-master': '/agent',
  '/masters/light-source-master': '/light-source',
  '/masters/certification-master': '/certification',
  '/masters/shipment-mode-master': '/shipment-mode',
  '/masters/shipment-terms-master': '/shipment-terms',
  '/masters/currency-master': '/currency',
  '/masters/payment-terms-master': '/payment-terms',
  '/masters/port-master': '/port',
  '/masters/transport-master': '/transport',
  '/masters/item-master-detail': '/item-master',
  '/masters/terms-condition-master': '/terms-condition',
  '/settings/menu-master': '/menu-masters',
  '/settings/level1-menu': '/level1-menus',
  '/settings/level2-menu': '/level2-menus',
  '/settings/application-user': '/application-users',
  '/settings/company': '/companies',
  '/settings/employee': '/employee',
  '/settings/report-configuration-list': '/report-configurations',
  '/settings/employee-relieved': '/employee-relieved',
  '/settings/employee-growth': '/promotions',
  '/settings/leave-requests': '/leave-request',
  '/settings/salary-report': '/salary-report',
    '/settings/salary-report-view': '/salary-report',
        '/settings/employee-payout-list': '/allowance-advance',
  '/transaction/fabric-inspection-dtails': '/fabric-inspection',
  // '/transaction/fabric-inspection-management': '/fabric-inspections',
  '/transaction/generate-packing-list-details': '/packing-list',
  '/transaction/packing-list-mamagement': '/generate-packing',
  '/transaction/jobwork-fabric-receive-details': '/jobwork-fabric-receive',
  '/transaction/trading-fabric-inspection-management': '/fabric-inspections',
  '/transaction/process-contract-details': '/process-contract',
  '/transaction/process-contract-managemant': '/dyeing-work-orders', // Needs sfvgfvpecialization if needed
  '/transaction/processing-issue-management': '/fabric-dispatch',
  '/transaction/processing-receive-management': '/finish-fabric-receives',
  '/transaction/weaving-contract-details': '/weaving-contracts',
  '/transaction/weaving-yarn-issue': '/weaving-yarn-issues',
  '/transaction/sizing-plan-details': '/sizing-plan',
  '/transaction/sizing-yarn-issue-details': '/sizing-yarn-issues',
  '/transaction/sizing-jobwork-order-details': '/sizing-jobwork-orders',
  '/transaction/sizing-yarn-outward-details': '/sizing-yarn-outward',
  '/transaction/sizing-management': '/sizing-plan',
  '/transaction/weaving-yarn-outward-details': '/weaving-yarn-outward',
  '/transaction/weaving-production': '/weaving-production',
  '/transaction/sizing-production': '/sizing-production',
  '/transaction/sizing-beam-outward-details': '/sizing-beam-outward',
  '/transaction/beam-management': '/beam-inward',
  '/transaction/beam-outward-details': '/beam-outward',
  '/transaction/flange-management': '/flange  ',
  '/transaction/flange-inward-details': '/flange-inward',
  '/transaction/factory-beam-inward': '/factory-beam-inward',
  '/transaction/weaving-jobwork-order-details': '/weaving-work-orders',
  '/transaction/beam-gaiting-details': '/beam-gating',
  '/transaction/weft-inward-details': '/weft-inward',
  '/transaction/weaving-issue-details': '/weaving-issue',
  '/transaction/processing-issue-details': '/processing-issue',
  '/transaction/finish-fabric-receive-details': '/finish-fabric-receive',
  '/transaction/finish-yarn-receive-details': '/finish-yarn-receive',
  '/transaction/yarn-return-details': '/yarn-return',
    '/transaction/beam-cut-details': '/beam-cut',
    '/transaction/doffing-entry-details': '/doffing-entry',
    '/transaction/yarn-sales-order-list': '/yarn-sales-orders',
    '/transaction/yarn-challan-management': '/yarn-challan',
  '/transaction/stock-transfers': '/stock-transfers',
  '/transaction/piece-split-join-details': '/piece-split',
  '/transaction/hanger-management': '/hanger',
  '/transaction/sales-order-management': '/sales-orders',
  '/transaction/customer-enquiry-list-wireframe': '/customer-inquiries',
  '/transaction/sizing-yarn-issue': '/sizing-yarn-issues',
  '/transaction/bale-roll-packing-details': '/bale-roll-packing',
  '/transaction/brushing-receive-details': '/brushing/receive',
  '/transaction/scan-dispatch-details': '/scan-dispatch',
};

// Helper to parse various date formats
const parseDateString = (val: any): Date | null => {
  if (val == null) return null;
  if (val instanceof Date) return val;
  if (typeof val !== 'string') return null;

  const cleanVal = val.trim();
  if (cleanVal.length < 6) return null;

  // Only attempt date parsing if the string contains a date separator
  if (!cleanVal.includes('/') && !cleanVal.includes('-') && !cleanVal.includes(' ')) {
    return null;
  }

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanVal)) {
    const [day, month, year] = cleanVal.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  // MMM YY or MMM YYYY or MMMM YYYY
  const monthYearMatch = cleanVal.match(/^([A-Za-z]{3,})\s(\d{2,4})$/);
  if (monthYearMatch) {
    const monthStr = monthYearMatch[1].substring(0, 3).toLowerCase();
    let year = parseInt(monthYearMatch[2], 10);
    if (monthYearMatch[2].length === 2) {
      year += 2000; // Assume 2000s for 2-digit year
    }
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIdx = monthNames.indexOf(monthStr);
    if (monthIdx !== -1) return new Date(year, monthIdx, 1);
  }

  const d = new Date(cleanVal);
  return isNaN(d.getTime()) ? null : d;
};

// Helper to identify date columns based on headers or accessors
const isDateColumn = (col: any): boolean => {
  if (!col) return false;
  if (col.Filter?.name === 'DateRangeFilter' || col.Filter?.name === 'MonthRangeFilter') return true;
  const headerStr = typeof col.Header === 'string' ? col.Header.toLowerCase() : '';
  const accessorStr = typeof col.accessor === 'string' ? col.accessor.toLowerCase() : (col.accessorKey || '').toLowerCase();
  return (
    headerStr.includes('date') ||
    headerStr.includes('dt') ||
    headerStr.includes('month') ||
    headerStr.includes('period') ||
    headerStr.includes('created') ||
    headerStr.includes('updated') ||
    accessorStr.includes('date') ||
    accessorStr.includes('dt') ||
    accessorStr.includes('month') ||
    accessorStr.includes('period') ||
    accessorStr.includes('created') ||
    accessorStr.includes('updated')
  );
};

// Helper to determine if a column is a master data column or should render a select dropdown
const isMasterColumn = (col: any): boolean => {
  if (!col) return false;
  if (col.filterVariant === 'select' || col.isSelect || (col.filterOptions && col.filterOptions.length > 0)) {
    return true;
  }
  if (col.filterVariant === 'text' || col.disableFilters) {
    return false;
  }
  const headerStr = typeof col.Header === 'string' ? col.Header.toLowerCase().trim() : '';
  const accessorStr = typeof col.accessor === 'string' ? col.accessor.toLowerCase().trim() : (col.accessorKey || '').toLowerCase().trim();

  if (isDateColumn(col)) return false;

  const masterKeywords = [
    'sort no', 'sortno', 'construction',
    'vendor', 'supplier',
    'customer', 'buyer',
    'category', 'sub category', 'subcategory', 'fabric category', 'fabriccategory',
    'uom', 'unit',
    'brand',
    'process',
    'quality', 'fabric quality', 'fabricquality',
    'fabric code', 'fabriccode', 'fabric type', 'fabrictype',
    'yarn', 'mill',
    'machine', 'loom',
    'employee', 'agent', 'consignee', 'buying office',
    'grade', 'defect',
    'status', 'approval status',
    'po type', 'potype',
    'payment terms', 'shipment mode', 'shipment terms', 'currency', 'port', 'transport',
    'city', 'state', 'country', 'warehouse', 'location',
    'item name', 'item master', 'color', 'shade', 'design', 'pattern'
  ];

  return masterKeywords.some(keyword => 
    headerStr === keyword ||
    headerStr.includes(keyword) ||
    accessorStr === keyword ||
    accessorStr.includes(keyword)
  );
};



// Date Range Filter Component
export function DateRangeFilter({ column: { filterValue = {}, setFilter } }: any) {
  return (
    <div className="flex space-x-2">
      <input
        type="date"
        value={filterValue.from || ''}
        onChange={e => setFilter({ ...filterValue, from: e.target.value })}
        placeholder="From"
        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#008F8C]/15 text-[#102F50] font-medium"
      />
      <input
        type="date"
        value={filterValue.to || ''}
        min={filterValue.from || ''}
        onChange={e => setFilter({ ...filterValue, to: e.target.value })}
        placeholder="To"
        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#008F8C]/15 text-[#102F50] font-medium"
      />
    </div>
  );
}

// Month Range Filter Component (e.g., "YYYY-MM")
export function MonthRangeFilter({ column: { filterValue = {}, setFilter } }: any) {
  return (
    <div className="flex space-x-2">
      <input
        type="month"
        value={filterValue.from || ''}
        onChange={e => setFilter({ ...filterValue, from: e.target.value })}
        className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-[#008F8C] text-[#102F50] font-medium"
      />
      <input
        type="month"
        value={filterValue.to || ''}
        min={filterValue.from || ''}
        onChange={e => setFilter({ ...filterValue, to: e.target.value })}
        className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-[#008F8C] text-[#102F50] font-medium"
      />
    </div>
  );
}

const isNumericFormattedColumn = (header: any, accessor: any): boolean => {
  const headerStr = typeof header === 'string' ? header.toLowerCase() : '';
  const accessorStr = typeof accessor === 'string' ? accessor.toLowerCase() : '';
  return (
    headerStr.includes('quantity') ||
    headerStr.includes('meter') ||
    headerStr.includes('mtr') ||
    headerStr.includes('amount') ||
    headerStr.includes('balance') ||
    accessorStr.includes('quantity') ||
    accessorStr.includes('meter') ||
        accessorStr.includes('metre') ||
    accessorStr.includes('mtr') ||
    accessorStr.includes('amount') ||
    accessorStr.includes('balance') ||
    accessorStr.includes('weight') ||
    accessorStr.includes('yards')
  );
};

const parseNumber = (val: any): number => {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  
  if (str.includes(',')) {
    const parts = str.split(',').map(p => p.trim());
    const isThousandsSeparator = /^\d{1,3}(,\d{3})*(\.\d+)?$/.test(str) || /^\d{1,2}(,\d{2})*(,\d{3})(\.\d+)?$/.test(str);
    if (isThousandsSeparator) {
      const cleaned = str.replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    } else {
      return parts.reduce((acc, part) => {
        const parsed = parseFloat(part);
        return acc + (isNaN(parsed) ? 0 : parsed);
      }, 0);
    }
  }
  
  const cleaned = str.replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};


export function DataTable({
  columns,
  data,
  title,
  headerContent,
  headerActions,
  summaryConfig,
  onAdd,
  onEdit,
  onDelete,
  onClone,
  onView,
  onPrint,
  onPending,
  onApproved,
  activeTab,
  showActions = false,
  showAddActions = true,
  showExport = true,
  filterPlaceholder = 'Search across all columns...',
  showColumnFilters = false,
  showPdfExport = false,
  pdfHeaders,
  pdfFileName,
  loading = false,
  hideDeleteAction = false,
  initialPageSize = 10,
  pageSizeOptions,
  onPageSizeChange,
  totalCount,
  currentPage: propCurrentPage,
  onPageChange: propOnPageChange,
  columnFilters: propColumnFilters,
  onColumnFiltersChange,
  canShowActions,
  renderActions,
  grandTotal,
  totalColumnKey,
  totalColumnKeys,
  onlyGrandTotal = false,
  showGrandTotal = true,
  grandTotalLabel = "GRAND TOTAL",
  offset: externalOffset = 0,
  searchQueryParams,
  searchApiEndpoint,
  highlightRowId,
  isShowPagination = true,
  disableFullDataFetch = false,
  onRowClick,
  onRowDoubleClick,
  getRowClassName,
  renderRowDetails,
  getRowId,
  onFilteredDataChange,
  virtualScroll = false,
  virtualScrollHeight = '600px',
  rowHeight = 36,
  bodyCellClassName,
  disableColumnExpand = false,
  showToolbar = true,
  showSearch = true,
  disableSorting = false,
  disableAutoFormatting = false,
  cellContentClassName,
  emptyMessage,
  tableClassName,
  defaultViewMode = 'table',
  viewMode: controlledViewMode,
  onViewModeChange,
  showViewToggle = true,
  renderCard,
}: DataTableProps) {
  const location = useLocation();
  const path = location.pathname;
  const routeHero = useRouteHero();
  const routeHeroId = useId();
  const registerRouteHero = routeHero?.register;
  const unregisterRouteHero = routeHero?.unregister;
  const resolvedCompanyId = useResolvedCompanyId();
  const storageKey = `dt-filters:${path}`;
  const canAdd = useSelector(selectHasPermission(path, 'add'));
  const canEdit = useSelector(selectHasPermission(path, 'edit'));
  const canDelete = useSelector(selectHasPermission(path, 'delete'));
  const canView = useSelector(selectHasPermission(path, 'view'));
  const canExportPermission = useSelector(selectHasPermission(path, 'export'));
  const canExport = canExportPermission || path.includes('salary-report') || path.includes('-view') || path.startsWith('/reports');
  const canPrintPermission = useSelector(selectHasPermission(path, 'print'));

  const dispatch = useDispatch();
  const fabricMasterFullList = useSelector((state: any) => state.fabricMaster?.fabricMasterFullList) || [];
  const fabricMasterList = useSelector((state: any) => state.fabricMaster?.fabricMasterList) || [];

  const [filterInput, setFilterInput] = useState<string>(() => {
    if (!showToolbar || !_dtAppSessionActive) return '';
    try {
      const stored = sessionStorage.getItem(`dt-filters:${location.pathname}`);
      return stored ? (JSON.parse(stored).filterInput ?? '') : '';
    } catch { return ''; }
  });
  const [localSearchVal, setLocalSearchVal] = useState(filterInput);
  const [isSearching, setIsSearching] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = propCurrentPage ?? internalPage;
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [fullData, setFullData] = useState<any[] | null>(null);
  const [isLoadingFullData, setIsLoadingFullData] = useState(false);
  const [selectedAging, setSelectedAging] = useState<string>('Select aging');
  const [internalColumnFilters, setInternalColumnFilters] = useState<Record<string, any>>(() => {
    if (!showToolbar || !_dtAppSessionActive) return {};
    try {
      const stored = sessionStorage.getItem(`dt-filters:${location.pathname}`);
      return stored ? (JSON.parse(stored).columnFilters ?? {}) : {};
    } catch { return {}; }
  });
  const columnFilters = propColumnFilters ?? internalColumnFilters;

  const fetchFullData = useCallback(async () => {
    const endpoint = searchApiEndpoint || routeToApiMap[path];
    if (!endpoint) return;

    try {
      setIsLoadingFullData(true);
      let apiEndpoint = endpoint;

      // Special logic for quality-master and fabric-management
      if (path === '/masters/quality-master' || path === '/masters/fabric-management') {
        apiEndpoint = title === 'Knitted Quality Master' || title === 'Knitted Fabric Master' ? '/knitted-fabric-master' : '/fabric-master';
      } else if (path === '/transaction/invoice-management') {
        apiEndpoint = '/invoices';
      } else if (path === '/transaction/fabric-inspection-management') {
        apiEndpoint = '/fabric-inspections';
      } else if (path === '/transaction/packing-list-mamagement') {
        apiEndpoint = '/generate-packing';
      } else if (path === '/transaction/process-contract-managemant') {
        apiEndpoint = title === 'process-contract-details' ? '/dyeing-work-orders/type/FABRIC' : '/dyeing-work-orders/type/YARN';
      } else if (path === '/transaction/processing-receive-management') {
        apiEndpoint = title === 'finish-fabric-receive-details' ? '/finish-fabric-receives/type/FABRIC' : '/finish-fabric-receives/type/YARN';
      } else if (path === '/transaction/beam-management') {
        apiEndpoint = title === 'beam-inward-details' ? '/beam-inward' : '/empty-beam-issue';
      }

      if (resolvedCompanyId != null && !apiEndpoint.includes('/company/') && !shouldExcludeCompanyId(path)) {
        apiEndpoint = `${apiEndpoint}/company/${resolvedCompanyId}`;
      }

      const extraParams = searchQueryParams
        ? '&' + Object.entries(searchQueryParams).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
        : '';
      const response = await apiService.get(`${apiEndpoint}?limit=10000&offset=0${extraParams}`);

      let allData = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        allData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        allData = response.data;
      } else if (Array.isArray(response)) {
        allData = response;
      } else if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        allData = response.data.data.data;
      }

      setFullData(allData);
    } catch (error) {
      console.error("Error fetching full data for search:", error);
    } finally {
      setIsLoadingFullData(false);
    }
  }, [path, title, searchQueryParams, searchApiEndpoint, resolvedCompanyId]);

  useEffect(() => {
    if (disableFullDataFetch) return;
    const needsFullData = !!filterInput.trim() || Object.keys(columnFilters).length > 0;
    if (needsFullData && !fullData && !isLoadingFullData) {
      fetchFullData();
    } else if (!needsFullData && fullData) {
      setFullData(null);
    }
  }, [disableFullDataFetch, filterInput, columnFilters, fullData, isLoadingFullData, fetchFullData]);




  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    const nextPage = typeof page === 'function' ? page(currentPage) : page;
    if (propOnPageChange) {
      propOnPageChange(nextPage);
    } else {
      setInternalPage(nextPage);
    }
  };

  const firstPage = propOnPageChange ? 0 : 1;

  // Sync localSearchVal when filterInput is changed externally (e.g. clear filters)
  useEffect(() => {
    setLocalSearchVal(filterInput);
  }, [filterInput]);

  // Debounce updating filterInput
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearchVal !== filterInput) {
        setFilterInput(localSearchVal);
        setCurrentPage(firstPage === 0 ? 0 : 1);
      }
      setIsSearching(false);
    }, 750);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchVal, filterInput, firstPage]);

  const resizingColumn = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  // Put this outside the DataTable component (top level)


  const handleMouseDown = useCallback((e: React.MouseEvent, columnId: string) => {
    e.stopPropagation();
    e.preventDefault();
    resizingColumn.current = columnId;
    startX.current = e.pageX;
    // const thElement = (e.target as HTMLElement).closest('th');
    // startWidth.current = thElement ? thElement.offsetWidth : 0;

    const thElement = (e.target as HTMLElement).closest('th');
    startWidth.current = thElement ? thElement.offsetWidth : 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (resizingColumn.current) {
        const deltaX = moveEvent.pageX - startX.current;
        const newWidth = Math.max(50, startWidth.current + deltaX);
        setColumnWidths(prev => ({
          ...prev,
          [resizingColumn.current!]: newWidth,
        }));
      }
    };

    const onMouseUp = () => {
      resizingColumn.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const [pageSize, setLocalPageSize] = useState<number>(() => {
    if (!_dtAppSessionActive) return initialPageSize;
    try {
      const stored = sessionStorage.getItem(`dt-filters:${location.pathname}`);
      return stored ? (JSON.parse(stored).pageSize ?? initialPageSize) : initialPageSize;
    } catch { return initialPageSize; }
  });
  const [internalViewMode, setInternalViewMode] = useState<'table' | 'cards'>(() => {
    if (!_dtAppSessionActive) return defaultViewMode;
    try {
      const stored = sessionStorage.getItem(`dt-filters:${location.pathname}`);
      return stored ? (JSON.parse(stored).viewMode ?? defaultViewMode) : defaultViewMode;
    } catch { return defaultViewMode; }
  });
  const viewMode = controlledViewMode ?? internalViewMode;

  const setViewMode = useCallback((mode: 'table' | 'cards') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  }, [onViewModeChange]);
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    if (!_dtAppSessionActive) return false;
    try {
      const stored = sessionStorage.getItem(`dt-filters:${location.pathname}`);
      return stored ? (JSON.parse(stored).showFilters ?? false) : false;
    } catch { return false; }
  });
  const updateColumnFilters = useCallback((nextFilters: Record<string, any>) => {
    if (onColumnFiltersChange) {
      onColumnFiltersChange(nextFilters);
      return;
    }
    setInternalColumnFilters(nextFilters);
  }, [onColumnFiltersChange]);

  useEffect(() => {
    _dtAppSessionActive = true;
    try {
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('dt-filters:') && key !== storageKey)
        .forEach(key => sessionStorage.removeItem(key));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    try {
      if (!showToolbar) return;
      sessionStorage.setItem(storageKey, JSON.stringify({
        filterInput,
        columnFilters: internalColumnFilters,
        showFilters,
        pageSize,
        viewMode,
      }));
    } catch {}
  }, [storageKey, filterInput, internalColumnFilters, showFilters, pageSize, viewMode, showToolbar]);

  const initialPageSizeRef = useRef(initialPageSize);
  useEffect(() => {
    if (initialPageSize != null && initialPageSize !== initialPageSizeRef.current) {
      initialPageSizeRef.current = initialPageSize;
      setLocalPageSize(initialPageSize);
      setInternalPage(1);
    }
  }, [initialPageSize]);

  const effectivePageSizeOptions = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;

  const handlePageSizeSelect = (nextSize: number) => {
    setLocalPageSize(nextSize);
    setCurrentPage(firstPage);
    if (onPageSizeChange) {
      onPageSizeChange(nextSize);
    }
  };

  // Enhanced columns with filter support - FLATTENED for data access
  const enhancedColumns = useMemo(() => {
    if (!columns || !Array.isArray(columns)) {
      return [];
    }

    // Recursive function to flatten columns
    const flatten = (cols: any[], parentHeaderClassName?: string, parentCellClassName?: string): any[] => {
      let flat: any[] = [];
      cols.forEach((col, index) => {
        const currentHeaderClassName = col.headerClassName || parentHeaderClassName;
        const currentCellClassName = col.cellClassName || parentCellClassName;
        if (col.columns) {
          flat = flat.concat(flatten(col.columns, currentHeaderClassName, currentCellClassName));
        } else {
          const columnId = col.id || (typeof col.accessor === 'string' ? col.accessor : `col-${index}-${Math.random()}`);
          const accessorKey = typeof col.accessor === 'string' ? col.accessor : columnId;
          flat.push({
            ...col,
            id: columnId,
            accessorKey: accessorKey,
            headerClassName: currentHeaderClassName,
            cellClassName: currentCellClassName
          });
        }
      });
      return flat;
    };

    return flatten(columns);
  }, [columns]);

  const hasBothFabricColumns = useMemo(() => {
    let hasFabricCode = false;
    let hasFabricQuality = false;
    enhancedColumns.forEach(col => {
      const headerStr = typeof col.Header === 'string' ? col.Header.toLowerCase() : '';
      const accessorStr = typeof col.accessor === 'string' ? col.accessor.toLowerCase() : (col.accessorKey || '').toLowerCase();
      if (
        headerStr.includes('fabric code') ||
        headerStr.includes('fabriccode') ||
        accessorStr.includes('fabriccode') ||
        accessorStr.includes('fabricmasterid') ||
        accessorStr.includes('fabriccodeid') ||
        accessorStr.includes('fabricid')
      ) {
        hasFabricCode = true;
      }
      if (
        headerStr.includes('fabric quality') ||
        headerStr.includes('fabricquality') ||
        accessorStr.includes('fabricquality') ||
        accessorStr.includes('fabricqualityid')
      ) {
        hasFabricQuality = true;
      }
    });
    return hasFabricCode && hasFabricQuality;
  }, [enhancedColumns]);

  useEffect(() => {
    const hasFabricCodeColumn = enhancedColumns.some(col => {
      const headerStr = typeof col.Header === 'string' ? col.Header : '';
      const accessorStr = typeof col.accessor === 'string' ? col.accessor : (col.accessorKey || '');
      return (
        headerStr.toLowerCase().includes('fabric code') ||
        headerStr.toLowerCase().includes('fabriccode') ||
        accessorStr.toLowerCase().includes('fabriccode') ||
        accessorStr.toLowerCase().includes('fabricmasterid') ||
        accessorStr.toLowerCase().includes('fabriccodeid') ||
        accessorStr.toLowerCase().includes('fabricid')
      );
    });
    if (hasFabricCodeColumn && !hasBothFabricColumns && fabricMasterFullList.length === 0) {
      dispatch(getAllFabricMastersForDropdown() as any);
    }
  }, [enhancedColumns, hasBothFabricColumns, fabricMasterFullList.length, dispatch]);

  const headerGroups = useMemo(() => {
    if (!columns || !Array.isArray(columns)) {
      return [];
    }

    const groups: any[][] = [];

    const getLeafCount = (col: any): number => {
      if (!col.columns) return 1;
      return col.columns.reduce((sum: number, c: any) => sum + getLeafCount(c), 0);
    };

    const getMaxDepth = (cols: any[]): number => {
      let maxDepth = 0;
      cols.forEach(col => {
        if (col.columns) {
          maxDepth = Math.max(maxDepth, 1 + getMaxDepth(col.columns));
        } else {
          maxDepth = Math.max(maxDepth, 1);
        }
      });
      return maxDepth;
    };

    const maxDepth = getMaxDepth(columns);

    const fillGroups = (cols: any[], level: number) => {
      groups[level] = groups[level] || [];
      cols.forEach((col, index) => {
        const leafCount = getLeafCount(col);
        const columnId = col.id || (typeof col.accessor === 'string' ? col.accessor : `header-${level}-${index}`);

        groups[level].push({
          ...col,
          id: columnId,
          colSpan: leafCount,
          rowSpan: col.columns ? 1 : maxDepth - level,
          headerClassName: col.headerClassName,
          cellClassName: col.cellClassName
        });

        if (col.columns) {
          fillGroups(col.columns, level + 1);
        }
      });
    };

    fillGroups(columns, 0);
    return groups;
  }, [columns]);

  const extractStringFromReactNode = (node: any): string => {
    if (node == null) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractStringFromReactNode).join(' ');
    if (node?.props?.value !== undefined && node?.props?.value !== null) {
      return String(node.props.value);
    }
    if (node?.props?.checked !== undefined && node?.props?.checked !== null) {
      return String(node.props.checked);
    }
    if (node?.props?.children != null) return extractStringFromReactNode(node.props.children);
    return '';
  };

  // Apply custom filter functions
  // const applyCustomFilter = (data: any[], column: any, filterValue: any) => {
  //   if (!column.filter || typeof column.filter !== 'function') {
  //     return data;
  //   }

  //   try {
  //     const accessorKey = column.accessorKey;
  //     const rows = data.map(item => ({
  //       values: { [accessorKey]: typeof column.accessor === 'function' ? column.accessor(item) : item[accessorKey] },
  //       original: item
  //     }));

  //     const filteredRows = column.filter(rows, [accessorKey], filterValue);
  //     return filteredRows.map((row: any) => row.original);
  //   } catch (error) {
  //     console.error('Error applying custom filter:', error);
  //     return data;
  //   }
  // };
const applyCustomFilter = useCallback((data: any[], column: any, filterValue: any) => {
    if (!column.filter || typeof column.filter !== 'function') {
      return data;
    }

    try {
      const accessorKey = column.accessorKey;
      const rows = data.map(item => ({
        values: { [accessorKey]: typeof column.accessor === 'function' ? column.accessor(item) : item[accessorKey] },
        original: item
      }));

      const filteredRows = column.filter(rows, [accessorKey], filterValue);
      return filteredRows.map((row: any) => row.original);
    } catch (error) {
      console.error('Error applying custom filter:', error);
      return data;
    }
  }, []);

    const filterAndSortData = useCallback((baseData: any[], precomputedSearch?: string[][]) => {
    let filtered = baseData;

    // Global filter - search across all columns
    if (filterInput.trim()) {
      const searchStr = filterInput.toLowerCase();
      filtered = baseData.filter((item, idx) => {
        // If precomputed search strings are available, use them for ultra-fast matching
        if (precomputedSearch && precomputedSearch[idx]) {
          const searchList = precomputedSearch[idx];
          const len = searchList.length;
          for (let i = 0; i < len; i++) {
            if (searchList[i].includes(searchStr)) return true;
          }
          return false;
        }

        // Check via column accessors (respects computed/renamed fields)
        const colMatch = enhancedColumns.some(col => {
          if (col.disableFilters) return false;
          const value = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessorKey];
          if (value == null) return false;

          const valueStr = value.toString().toLowerCase();
          if (valueStr.includes(searchStr)) return true;

          // Try to handle date matching for global search
          if (isDateColumn(col)) {
            const d = parseDateString(value);
            if (d) {
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase();
              const dayStr = d.getDate().toString().padStart(2, '0');
              const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
              const yearStr = d.getFullYear().toString();
              const fullDateStr = `${dayStr}/${monthStr}/${yearStr}`;
              if (dateStr.includes(searchStr) || fullDateStr.includes(searchStr)) return true;
            }
          }

          return false;
        });
        if (colMatch) return true;

        // Fallback: search ALL primitive values on the raw item so cross-page items
        // with differently-named fields (e.g. buyerCustomerName vs customer) are still found.
        // Optimized using a loop instead of Object.values to avoid allocating new arrays.
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            const val = item[key];
            if (
              val != null &&
              typeof val !== 'object' &&
              !Array.isArray(val) &&
              val.toString().toLowerCase().includes(searchStr)
            ) {
              return true;
            }
          }
        }
        return false;
      });
    }

    // Apply column filters
    enhancedColumns.forEach(col => {
      const filterValue = columnFilters[col.id];
      if (!filterValue || col.disableFilters) return;

      if (col.filter && typeof col.filter === 'function') {
        filtered = applyCustomFilter(filtered, col, filterValue);
      } else {
        filtered = filtered.filter(item => {
          const itemValue = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessorKey];

          // Date range filter
          if (typeof filterValue === 'object' && filterValue !== null && ('from' in filterValue || 'to' in filterValue)) {
            if (itemValue == null) return false;

            try {
              let itemStartDate = parseDateString(itemValue);
              if (!itemStartDate) return false;

              let itemEndDate = new Date(itemStartDate);

              // Handle "MMM YYYY" or "MMM YY" format for range expansion (include entire month)
              if (typeof itemValue === 'string' && /^[A-Za-z]{3,}\s\d{2,4}$/.test(itemValue.trim())) {
                itemEndDate.setMonth(itemEndDate.getMonth() + 1);
                itemEndDate.setDate(0); // Last day of month
                itemEndDate.setHours(23, 59, 59, 999);
              } else {
                itemEndDate.setHours(23, 59, 59, 999);
              }

              if (filterValue.from) {
                const fromDate = new Date(filterValue.from);
                fromDate.setHours(0, 0, 0, 0);
                if (itemEndDate < fromDate) return false;
              }

              if (filterValue.to) {
                let toDate: Date;
                // If filter value is YYYY-MM (from type="month"), set to end of that month
                if (typeof filterValue.to === 'string' && /^\d{4}-\d{2}$/.test(filterValue.to)) {
                  const [y, m] = filterValue.to.split('-').map(Number);
                  toDate = new Date(y, m, 0, 23, 59, 59, 999);
                } else {
                  toDate = new Date(filterValue.to);
                  toDate.setHours(23, 59, 59, 999);
                }
                if (itemStartDate > toDate) return false;
              }

              return true;
            } catch (error) {
              return false;
            }
          }

          // Text/Generic/Select filter
          if (filterValue != null && filterValue !== '') {
            const searchStr = filterValue.toString().toLowerCase();
            const itemValueStr = itemValue?.toString().toLowerCase() || '';

            if (itemValueStr === searchStr || itemValueStr.includes(searchStr)) return true;

            if (col.Cell && typeof col.Cell === 'function') {
              try {
                const cellResult = col.Cell({ value: itemValue, row: { original: item, values: {} } });
                const cellStr = extractStringFromReactNode(cellResult).toLowerCase();
                if (cellStr && (cellStr === searchStr || cellStr.includes(searchStr))) return true;
              } catch (e) {}
            }

            // Handle fabric code / quality matching if fabric code column
            const headerStr = typeof col.Header === 'string' ? col.Header : '';
            const accessorStr = typeof col.accessor === 'string' ? col.accessor : (col.accessorKey || '');
            const isFabricCodeCol = headerStr.toLowerCase().includes('fabric code') || 
                                    headerStr.toLowerCase().includes('fabriccode') ||
                                    headerStr.toLowerCase().includes('sort no') ||
                                    headerStr.toLowerCase().includes('sortno') ||
                                    accessorStr.toLowerCase().includes('fabriccode') ||
                                    accessorStr.toLowerCase().includes('fabricmasterid') ||
                                    accessorStr.toLowerCase().includes('fabriccodeid') ||
                                    accessorStr.toLowerCase().includes('fabricid');

            if (isFabricCodeCol) {
              const fabricId = item.fabricMasterId ?? item.fabricCodeId ?? item.fabricId ?? itemValue;
              if (fabricId != null && fabricId !== '') {
                let fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
                  f.id !== undefined && String(f.id) === String(fabricId)
                );
                if (!fabric && typeof fabricId === 'string') {
                  fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
                    f.fabricCode !== undefined && String(f.fabricCode).toLowerCase() === fabricId.toLowerCase()
                  );
                }
                if (fabric) {
                  const code = fabric.fabricCode || fabric.fabric_code || fabric.code || '';
                  const quality = fabric.fabricQuality || fabric.quality || fabric.fabric_quality || '';
                  const formattedFabric = code && quality ? `${code} - ${quality}` : (code || quality);
                  if (formattedFabric.toLowerCase() === searchStr || formattedFabric.toLowerCase().includes(searchStr)) return true;
                }
              }
            }

            // Handle date matching for column filter (e.g. "Jan 2026")
            if (isDateColumn(col)) {
              const d = parseDateString(itemValue);
              if (d) {
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase();
                if (dateStr.includes(searchStr)) return true;
              }
            }

            return false;
          }

          return true;
        });
      }
    });

    // Sort
    if (!disableSorting && sortConfig && sortConfig.key) {
      const sortingCol = enhancedColumns.find(col => col.id === sortConfig.key);
      const isSortingColDate = sortingCol ? isDateColumn(sortingCol) : false;
      const getVal = (item: any) => {
        if (!sortingCol) return item[sortConfig.key];
        return typeof sortingCol.accessor === 'function'
          ? sortingCol.accessor(item)
          : item[sortingCol.accessorKey];
      };

      filtered = [...filtered].sort((a, b) => {
        const aValue = getVal(a);
        const bValue = getVal(b);

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const dateA = isSortingColDate ? parseDateString(aValue) : null;
        const dateB = isSortingColDate ? parseDateString(bValue) : null;

        if (dateA && dateB) {
          return sortConfig.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        }

        const aString = aValue.toString().toLowerCase();
        const bString = bValue.toString().toLowerCase();

        if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply selected aging filter
    if (selectedAging && selectedAging !== 'Select aging') {
      filtered = filtered.filter(item => {
        let days: number | null = null;
        
        // 1. Check numeric keys containing days/age/aging
        const keys = Object.keys(item);
        const ageKey = keys.find(k => {
          const l = k.toLowerCase();
          return l.includes('days') || l.includes('age') || l.includes('aging') || l.includes('days_old') || l.includes('noofdays') || l.includes('no_of_days');
        });
        
        if (ageKey) {
          const val = item[ageKey];
          if (val != null) {
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
              days = parsed;
            }
          }
        }
        
        // 2. Fallback to calculating age from date keys
        if (days === null) {
          const dateKey = keys.find(k => {
            const l = k.toLowerCase();
            return l.includes('date') || l.includes('dt') || l === 'date';
          });
          
          if (dateKey) {
            const dateVal = parseDateString(item[dateKey]);
            if (dateVal) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              dateVal.setHours(0, 0, 0, 0);
              const diffTime = today.getTime() - dateVal.getTime();
              days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
          }
        }
        
        if (days === null) return false;
        
        switch (selectedAging) {
          case '<30days':
            return days < 30;
          case '30-59days':
            return days >= 30 && days <= 59;
          case '60-89 days':
            return days >= 60 && days <= 89;
          case '90 - 180 days':
            return days >= 90 && days <= 180;
          case '>180days':
            return days > 180;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [filterInput, columnFilters, sortConfig, selectedAging, enhancedColumns, applyCustomFilter, disableSorting]);


  // Process data with filters and sorting
  // const processedData = useMemo(() => {
  //   // Ensure data is always an array
  //   const safeData = Array.isArray(data) ? data : [];

  //   // When fullData is available (cross-page search or column filter), merge with processed safeData by id
  //   // so that computed/transformed fields are preserved for current-page items.
  //   const hasActiveFilterInput = !!filterInput.trim();
  //   const hasActiveColumnFilters = Object.keys(columnFilters).length > 0;
  //   let baseData: any[];
  //   if ((hasActiveFilterInput || hasActiveColumnFilters) && fullData) {
  //     const processedById = new Map<any, any>(
  //       safeData.map((item: any) => [item.id ?? item.Id ?? item.ID, item])
  //     );
  //     baseData = fullData.map((rawItem: any) => {
  //       const id = rawItem.id ?? rawItem.Id ?? rawItem.ID;
  //       return processedById.get(id) ?? rawItem;
  //     });
  //   } else {
  //     baseData = safeData;
  //   }
  //   let filtered = baseData;

  //   // Global filter - search across all columns
  //   if (filterInput.trim()) {
  //     const searchStr = filterInput.toLowerCase();
  //     filtered = baseData.filter(item => {
  //       // Check via column accessors (respects computed/renamed fields)
  //       const colMatch = enhancedColumns.some(col => {
  //         if (col.disableFilters) return false;
  //         const value = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessorKey];
  //         if (value == null) return false;

  //         const valueStr = value.toString().toLowerCase();
  //         if (valueStr.includes(searchStr)) return true;

  //         // Try to handle date matching for global search
  //         const d = parseDateString(value);
  //         if (d) {
  //           const dateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase();
  //           const dayStr = d.getDate().toString().padStart(2, '0');
  //           const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
  //           const yearStr = d.getFullYear().toString();
  //           const fullDateStr = `${dayStr}/${monthStr}/${yearStr}`;
  //           if (dateStr.includes(searchStr) || fullDateStr.includes(searchStr)) return true;
  //         }

  //         return false;
  //       });
  //       if (colMatch) return true;

  //       // Fallback: search ALL primitive values on the raw item so cross-page items
  //       // with differently-named fields (e.g. buyerCustomerName vs customer) are still found.
  //       return Object.values(item).some(val =>
  //         val != null &&
  //         typeof val !== 'object' &&
  //         !Array.isArray(val) &&
  //         val.toString().toLowerCase().includes(searchStr)
  //       );
  //     });
  //   }

  //   // Apply column filters
  //   enhancedColumns.forEach(col => {
  //     const filterValue = columnFilters[col.id];
  //     if (!filterValue || col.disableFilters) return;

  //     if (col.filter && typeof col.filter === 'function') {
  //       filtered = applyCustomFilter(filtered, col, filterValue);
  //     } else {
  //       filtered = filtered.filter(item => {
  //         const itemValue = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessorKey];

  //         // Date range filter
  //         if (typeof filterValue === 'object' && filterValue !== null && ('from' in filterValue || 'to' in filterValue)) {
  //           if (itemValue == null) return false;

  //           try {
  //             let itemStartDate = parseDateString(itemValue);
  //             if (!itemStartDate) return false;

  //             let itemEndDate = new Date(itemStartDate);

  //             // Handle "MMM YYYY" or "MMM YY" format for range expansion (include entire month)
  //             if (typeof itemValue === 'string' && /^[A-Za-z]{3,}\s\d{2,4}$/.test(itemValue.trim())) {
  //               itemEndDate.setMonth(itemEndDate.getMonth() + 1);
  //               itemEndDate.setDate(0); // Last day of month
  //               itemEndDate.setHours(23, 59, 59, 999);
  //             } else {
  //               itemEndDate.setHours(23, 59, 59, 999);
  //             }

  //             if (filterValue.from) {
  //               const fromDate = new Date(filterValue.from);
  //               fromDate.setHours(0, 0, 0, 0);
  //               if (itemEndDate < fromDate) return false;
  //             }

  //             if (filterValue.to) {
  //               let toDate: Date;
  //               // If filter value is YYYY-MM (from type="month"), set to end of that month
  //               if (typeof filterValue.to === 'string' && /^\d{4}-\d{2}$/.test(filterValue.to)) {
  //                 const [y, m] = filterValue.to.split('-').map(Number);
  //                 toDate = new Date(y, m, 0, 23, 59, 59, 999);
  //               } else {
  //                 toDate = new Date(filterValue.to);
  //                 toDate.setHours(23, 59, 59, 999);
  //               }
  //               if (itemStartDate > toDate) return false;
  //             }

  //             return true;
  //           } catch (error) {
  //             return false;
  //           }
  //         }

  //         // Text/Generic filter
  //         if (filterValue != null && filterValue !== '') {
  //           const searchStr = filterValue.toString().toLowerCase();
  //           const itemValueStr = itemValue?.toString().toLowerCase() || '';

  //           if (itemValueStr.includes(searchStr)) return true;

  //           if (col.Cell && typeof col.Cell === 'function') {
  //             try {
  //               const cellResult = col.Cell({ value: itemValue, row: { original: item, values: {} } });
  //               const cellStr = extractStringFromReactNode(cellResult).toLowerCase();
  //               if (cellStr && cellStr.includes(searchStr)) return true;
  //             } catch (e) {}
  //           }

  //           // Handle date matching for column filter (e.g. "Jan 2026")
  //           const d = parseDateString(itemValue);
  //           if (d) {
  //             const dateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase();
  //             if (dateStr.includes(searchStr)) return true;
  //           }

  //           return false;
  //         }

  //         return true;
  //       });
  //     }
  //   });

  //   // Sort
  //   if (sortConfig && sortConfig.key) {
  //     const sortingCol = enhancedColumns.find(col => col.id === sortConfig.key);
  //     const getVal = (item: any) => {
  //       if (!sortingCol) return item[sortConfig.key];
  //       return typeof sortingCol.accessor === 'function'
  //         ? sortingCol.accessor(item)
  //         : item[sortingCol.accessorKey];
  //     };

  //     filtered = [...filtered].sort((a, b) => {
  //       const aValue = getVal(a);
  //       const bValue = getVal(b);

  //       if (aValue == null && bValue == null) return 0;
  //       if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
  //       if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

  //       if (typeof aValue === 'number' && typeof bValue === 'number') {
  //         return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  //       }

  //       const dateA = parseDateString(aValue);
  //       const dateB = parseDateString(bValue);

  //       if (dateA && dateB) {
  //         return sortConfig.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  //       }

  //       const aString = aValue.toString().toLowerCase();
  //       const bString = bValue.toString().toLowerCase();

  //       if (aString < bString) return sortConfig.direction === 'asc' ? -1 : 1;
  //       if (aString > bString) return sortConfig.direction === 'asc' ? 1 : -1;
  //       return 0;
  //     });
  //   }

  //   // Apply selected aging filter
  //   if (selectedAging && selectedAging !== 'Select aging') {
  //     filtered = filtered.filter(item => {
  //       let days: number | null = null;
        
  //       // 1. Check numeric keys containing days/age/aging
  //       const keys = Object.keys(item);
  //       const ageKey = keys.find(k => {
  //         const l = k.toLowerCase();
  //         return l.includes('days') || l.includes('age') || l.includes('aging') || l.includes('days_old') || l.includes('noofdays') || l.includes('no_of_days');
  //       });
        
  //       if (ageKey) {
  //         const val = item[ageKey];
  //         if (val != null) {
  //           const parsed = parseFloat(val);
  //           if (!isNaN(parsed)) {
  //             days = parsed;
  //           }
  //         }
  //       }
        
  //       // 2. Fallback to calculating age from date keys
  //       if (days === null) {
  //         const dateKey = keys.find(k => {
  //           const l = k.toLowerCase();
  //           return l.includes('date') || l.includes('dt') || l === 'date';
  //         });
          
  //         if (dateKey) {
  //           const dateVal = parseDateString(item[dateKey]);
  //           if (dateVal) {
  //             const today = new Date();
  //             today.setHours(0, 0, 0, 0);
  //             dateVal.setHours(0, 0, 0, 0);
  //             const diffTime = today.getTime() - dateVal.getTime();
  //             days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  //           }
  //         }
  //       }
        
  //       if (days === null) return false;
        
  //       switch (selectedAging) {
  //         case '<30days':
  //           return days < 30;
  //         case '30-59days':
  //           return days >= 30 && days <= 59;
  //         case '60-89 days':
  //           return days >= 60 && days <= 89;
  //         case '90 - 180 days':
  //           return days >= 90 && days <= 180;
  //         case '>180days':
  //           return days > 180;
  //         default:
  //           return true;
  //       }
  //     });
  //   }

  //   return filtered;
  // }, [data, filterInput, sortConfig, enhancedColumns, columnFilters, fullData, selectedAging]);

  const isSearchActive = useMemo(() => {
    const hasActiveFilterInput = !!filterInput.trim();
    const hasActiveColumnFilters = Object.keys(columnFilters).length > 0;
    return hasActiveFilterInput || hasActiveColumnFilters;
  }, [filterInput, columnFilters]);

  const baseData = useMemo(() => {
    // Ensure data is always an array
    const safeData = Array.isArray(data) ? data : [];

    // When fullData is available (cross-page search or column filter), merge with processed safeData by id
    // so that computed/transformed fields are preserved for current-page items.
    if (isSearchActive && fullData) {
      const processedById = new Map<any, any>(
        safeData.map((item: any) => [item.id ?? item.Id ?? item.ID, item])
      );
      return fullData.map((rawItem: any) => {
        const id = rawItem.id ?? rawItem.Id ?? rawItem.ID;
        return processedById.get(id) ?? rawItem;
      });
    }
    return safeData;
  }, [data, isSearchActive, fullData]);

  // Precompute dropdown options for master / select columns
  const columnDropdownOptions = useMemo(() => {
    const optionsMap: Record<string, Array<{ label: string; value: any }>> = {};

    enhancedColumns.forEach(col => {
      if (col.disableFilters) return;

      if (isMasterColumn(col)) {
        if (col.filterOptions && Array.isArray(col.filterOptions)) {
          optionsMap[col.id] = col.filterOptions.map((opt: { label: any; value: any; } | null) => {
            if (typeof opt === 'object' && opt !== null && 'label' in opt && 'value' in opt) {
              return { label: String(opt.label), value: opt.value };
            }
            return { label: String(opt), value: opt };
          });
        } else {
          const uniqueValuesSet = new Set<string>();
          const uniqueOptions: Array<{ label: string; value: any }> = [];

          baseData.forEach((item, index) => {
            let rawVal = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessorKey];
            let displayVal = rawVal;

            if (col.Cell && typeof col.Cell === 'function') {
              try {
                const cellResult = col.Cell({ value: rawVal, row: { original: item, index } });
                const extracted = extractStringFromReactNode(cellResult);
                if (extracted) displayVal = extracted;
              } catch (e) {}
            }

            const headerStr = typeof col.Header === 'string' ? col.Header : '';
            const accessorStr = typeof col.accessor === 'string' ? col.accessor : (col.accessorKey || '');
            const isFabricCodeCol = headerStr.toLowerCase().includes('fabric code') || 
                                    headerStr.toLowerCase().includes('fabriccode') ||
                                    headerStr.toLowerCase().includes('sort no') ||
                                    headerStr.toLowerCase().includes('sortno') ||
                                    accessorStr.toLowerCase().includes('fabriccode') ||
                                    accessorStr.toLowerCase().includes('fabricmasterid') ||
                                    accessorStr.toLowerCase().includes('fabriccodeid') ||
                                    accessorStr.toLowerCase().includes('fabricid');

            if (isFabricCodeCol && (!hasBothFabricColumns || (typeof title === 'string' && title.toLowerCase().includes('sizing')))) {
              const isFormatted = typeof displayVal === 'string' && displayVal.includes(' - ');
              if (!isFormatted) {
                const fabricId = item.fabricMasterId ?? item.fabricCodeId ?? item.fabricId ?? rawVal;
                if (fabricId != null && fabricId !== '') {
                  let fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
                    f.id !== undefined && String(f.id) === String(fabricId)
                  );
                  if (!fabric && typeof fabricId === 'string') {
                    fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
                      f.fabricCode !== undefined && String(f.fabricCode).toLowerCase() === fabricId.toLowerCase()
                    );
                  }
                  if (fabric) {
                    const code = fabric.fabricCode || fabric.fabric_code || fabric.code || '';
                    const quality = fabric.fabricQuality || fabric.quality || fabric.fabric_quality || '';
                    if (code || quality) {
                      displayVal = code && quality ? `${code} - ${quality}` : (code || quality);
                    }
                  }
                }
              }
            }

            if (displayVal != null && displayVal !== '') {
              const strVal = String(displayVal).trim();
              if (strVal && !uniqueValuesSet.has(strVal)) {
                uniqueValuesSet.add(strVal);
                uniqueOptions.push({ label: strVal, value: strVal });
              }
            }
          });

          uniqueOptions.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
          optionsMap[col.id] = uniqueOptions;
        }
      }
    });

    return optionsMap;
  }, [enhancedColumns, baseData, hasBothFabricColumns, title, fabricMasterFullList, fabricMasterList]);


  // Precompute lowercase search list for each row in baseData
  const precomputedSearchData = useMemo(() => {
    return baseData.map(item => {
      const list: string[] = [];
      enhancedColumns.forEach(col => {
        if (col.disableFilters) return;
        const value = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessorKey];
        if (value == null) return;

        list.push(value.toString().toLowerCase());

        if (isDateColumn(col)) {
          const d = parseDateString(value);
          if (d) {
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase();
            const dayStr = d.getDate().toString().padStart(2, '0');
            const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
            const yearStr = d.getFullYear().toString();
            const fullDateStr = `${dayStr}/${monthStr}/${yearStr}`;
            list.push(dateStr);
            list.push(fullDateStr);
          }
        }
      });

      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          const val = item[key];
          if (val != null && typeof val !== 'object' && !Array.isArray(val)) {
            list.push(val.toString().toLowerCase());
          }
        }
      }
      return list;
    });
  }, [baseData, enhancedColumns]);

  const processedData = useMemo(() => {
    return filterAndSortData(baseData, precomputedSearchData);
  }, [baseData, precomputedSearchData, filterAndSortData]);

  const dataIsComplete = summaryConfig?.dataIsComplete
    ?? (totalCount === undefined ? !propOnPageChange : data.length === totalCount);
  const completeInternalResult = fullData !== null && (
    totalCount !== undefined
      ? fullData.length >= totalCount
      : summaryConfig?.dataIsComplete === true && fullData.length >= data.length
  );
  const filteredResultIsComplete = isSearchActive && dataIsComplete && (
    fullData === null || disableFullDataFetch || completeInternalResult
  );
  const filteredSummary = isSearchActive && filteredResultIsComplete;
  const statusSummaryRows = dataIsComplete
    ? (filteredSummary ? processedData : data)
    : null;
  const statusTotals = useMemo(
    () => statusSummaryRows === null || loading ? null : countStatuses(statusSummaryRows, summaryConfig),
    [statusSummaryRows, loading, summaryConfig],
  );
  const summaryTotal = loading
    ? null
    : filteredSummary
      ? processedData.length
      : totalCount ?? (dataIsComplete ? data.length : null);

  const routeHeroSummary = useMemo<RouteHeroSummary>(() => {
    const totalValue = summaryTotal === null ? '—' : summaryTotal.toLocaleString();
    const statusValue = (count: number | undefined) => count === undefined ? '—' : count.toLocaleString();
    const totalDescription = loading
      ? 'Loading records'
      : filteredSummary
        ? 'Matching results'
        : isSearchActive
          ? 'All entries · filtered scope unavailable'
          : summaryTotal === null
            ? 'Complete total unavailable'
            : 'All entries';
    const statusDescription = loading
      ? 'Loading status totals'
      : statusTotals === null
        ? 'Complete dataset required'
        : statusTotals
          ? filteredSummary ? 'In filtered results' : 'Across all entries'
          : 'Status values unavailable';

    return {
      cards: [
        { label: 'Total Entries', value: totalValue, description: totalDescription, tone: 'navy' },
        { label: 'Active', value: statusValue(statusTotals?.active), description: statusDescription, tone: 'teal' },
        { label: 'Inactive', value: statusValue(statusTotals?.inactive), description: statusDescription, tone: 'gold' },
      ],
    };
  }, [summaryTotal, loading, filteredSummary, isSearchActive, statusTotals]);

  useEffect(() => {
    if (registerRouteHero) registerRouteHero(routeHeroId, routeHeroSummary);
  }, [registerRouteHero, routeHeroId, routeHeroSummary]);

  useEffect(() => () => unregisterRouteHero?.(routeHeroId), [unregisterRouteHero, routeHeroId]);

  const paginatedData = useMemo(() => {
    if (virtualScroll) return processedData;
    if (totalCount !== undefined) return processedData;
    if (!isShowPagination) return processedData;
    const startIndex = (currentPage - firstPage) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize, totalCount, firstPage, isShowPagination, virtualScroll]);

  const pageTotals = useMemo(() => {
    if (!totalColumnKeys || totalColumnKeys.length === 0) return {};

    const totals: Record<string, number> = {};

    totalColumnKeys.forEach(key => {
      const sum = paginatedData.reduce((sum, row) => {
        return sum + parseNumber(row[key]);
      }, 0);
      if (key.toLowerCase().includes("avg")) {
        totals[key] = paginatedData.length > 0 ? Number((sum / paginatedData.length).toFixed(2)) : 0;
      } else {
        totals[key] = sum;
      }
    });

    return totals;
  }, [paginatedData, totalColumnKeys]);

  const processedTotals = useMemo(() => {
    if (!totalColumnKeys || totalColumnKeys.length === 0) return {};

    const totals: Record<string, number> = {};

    totalColumnKeys.forEach(key => {
      const sum = processedData.reduce((sum, row) => {
        return sum + parseNumber(row[key]);
      }, 0);
      if (key.toLowerCase().includes("avg")) {
        totals[key] = processedData.length > 0 ? Number((sum / processedData.length).toFixed(2)) : 0;
      } else {
        totals[key] = sum;
      }
    });

    return totals;
  }, [processedData, totalColumnKeys]);

  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(processedData, processedTotals);
    }
  }, [processedData, processedTotals, onFilteredDataChange]);

  const effectiveGrandTotal = grandTotal;

  const summaryRows = useMemo(() => {
    if (!totalColumnKeys || totalColumnKeys.length === 0) return [];

    const firstColumn = typeof enhancedColumns[0]?.accessor === "string"
      ? enhancedColumns[0].accessor
      : (enhancedColumns[0]?.id || "label");

    const totalRow: any = { [firstColumn]: "PAGE TOTAL" };
    const grandRow: any = { [firstColumn]: isSearchActive ? "FILTERED TOTAL" : grandTotalLabel };

    totalColumnKeys.forEach(key => {
      const pTot = pageTotals[key] || 0;
      const calcGTot = processedTotals[key] || 0;
      const gTot = (isSearchActive || !effectiveGrandTotal || effectiveGrandTotal[key] === undefined) 
        ? calcGTot
        : (effectiveGrandTotal[key] || 0);

      totalRow[key] = Number(Number(pTot).toFixed(2));
      grandRow[key] = Number(Number(gTot).toFixed(2));
    });

    // If onlyGrandTotal is true, only return the grand total row
    if (onlyGrandTotal) {
      return [grandRow];
    }

    // If showGrandTotal is false, only return the total row
    if (!showGrandTotal) {
      return [totalRow];
    }

    return [totalRow, grandRow];
  }, [totalColumnKeys, pageTotals, processedTotals, effectiveGrandTotal, isSearchActive, enhancedColumns, grandTotalLabel, onlyGrandTotal, showGrandTotal]);

  const totalPages = useMemo(() => {
    const totalItems = totalCount !== undefined ? totalCount : processedData.length;
    const total = Math.ceil(totalItems / pageSize);
    return isNaN(total) || total === 0 ? 1 : total;
  }, [processedData.length, pageSize, totalCount]);

  const safeCurrentPage = useMemo(() => {
    if (currentPage > totalPages) return totalPages;
    if (currentPage < 1) return 1;
    return currentPage;
  }, [currentPage, totalPages]);

  const handleSort = (key: string) => {
    if (!key) return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(firstPage);
  };

  const handleColumnFilterChange = (columnKey: string, value: any) => {
    const nextFilters = { ...columnFilters };
    if (value === undefined || value === '' || (typeof value === 'object' && !value.from && !value.to)) {
      delete nextFilters[columnKey];
    } else {
      nextFilters[columnKey] = value;
    }
    updateColumnFilters(nextFilters);
    setCurrentPage(firstPage);
  };

  const clearAllFilters = () => {
    updateColumnFilters({});
    setFilterInput('');
    setSelectedAging('Select aging');
    setCurrentPage(firstPage);
  };

  const computedPdfHeaders = useMemo(() => {
    if (Array.isArray(pdfHeaders) && pdfHeaders.length > 0) {
      return pdfHeaders;
    }
    return enhancedColumns
      .map((column) => {
        if (typeof column.Header === 'string') {
          return column.Header;
        }
        if (typeof column.accessor === 'string') {
          return column.accessor;
        }
        return '';
      })
      .filter((header: string) => header !== '');
  }, [pdfHeaders, enhancedColumns]);

  const handleExport = async () => {
    if (canExport) {
      const isReport = path.startsWith('/reports');
      const exportFileName = (title && title.trim()) || (pdfFileName && pdfFileName.trim()) || 'Export_Data';
      const headers = enhancedColumns
        .filter(col => typeof col.Header === 'string')
        .map(col => col.Header as string);

      // Create mapping from accessor keys to header names
      const accessorToHeaderMap: Record<string, string> = {};
      enhancedColumns.forEach(col => {
        if (typeof col.Header === 'string' && col.accessorKey) {
          accessorToHeaderMap[col.accessorKey] = col.Header;
        }
      });

      // Convert pageTotals from accessor keys to header names for Excel export
      const pageTotalForExcel: Record<string, number> = {};
      if (pageTotals && totalColumnKeys) {
        totalColumnKeys.forEach(accessorKey => {
          const headerName = accessorToHeaderMap[accessorKey];
          if (headerName && pageTotals[accessorKey] !== undefined) {
            pageTotalForExcel[headerName] = Number(Number(pageTotals[accessorKey]).toFixed(2));
          }
        });
      }

      // Convert grandTotal from accessor keys to header names for Excel export
      const targetGrandTotal = (isSearchActive || !grandTotal) ? processedTotals : grandTotal;
      const grandTotalForExcel: Record<string, number> = {};
      const effectiveTotalKeys = (totalColumnKeys && totalColumnKeys.length > 0)
        ? totalColumnKeys
        : (targetGrandTotal ? Object.keys(targetGrandTotal) : []);

      if (targetGrandTotal && effectiveTotalKeys.length > 0) {
        effectiveTotalKeys.forEach(accessorKey => {
          const headerName = accessorToHeaderMap[accessorKey] || accessorKey;
          if (targetGrandTotal[accessorKey] !== undefined) {
            grandTotalForExcel[headerName] = Number(Number(targetGrandTotal[accessorKey]).toFixed(2));
          }
        });
      }

      const excelOptions: any = {
        headers,
        includeSerialNo: true,
        headerGroups: headerGroups
      };

      if (targetGrandTotal && effectiveTotalKeys.length > 0 && Object.keys(grandTotalForExcel).length > 0) {
        excelOptions.grandTotal = grandTotalForExcel;
        excelOptions.totalColumnKeys = headers.filter(header =>
          effectiveTotalKeys.some(accessorKey => 
            String(accessorKey ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') ||
            (accessorToHeaderMap[accessorKey] && String(accessorToHeaderMap[accessorKey] ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''))
          )
        );
      }

      const mapDataForExport = (dataArray: any[]) => {
        return dataArray.map((item: any, index: number) => {
          const row: Record<string, any> = {};
          enhancedColumns.forEach((col: any) => {
            if (col.Header === 'Actions' || col.id === 'actions') return;

            const header = typeof col.Header === 'string' ? col.Header : (col.id || col.accessorKey);

            let value = typeof col.accessor === 'function' 
              ? col.accessor(item) 
              : (item[col.accessor] !== undefined ? item[col.accessor] : item[col.accessorKey]);

               // Apply custom column formatter if available to preserve presentation values (like vendor name, customer name, formatted dates, etc.)
            if (col.Cell && typeof col.Cell === 'function') {
              try {
                const cellResult = col.Cell({ value, row: { original: item, index } });
                value = extractStringFromReactNode(cellResult);
              } catch (e) {
                console.error("Error formatting cell for export:", e);
              }
            }

            if (col.Header === 'S.No' || col.accessorKey === 'serialNo') {
              value = index + 1;
            }

            // Format decimals if the column contains quantity, meter, mtr, or amount
            if (isNumericFormattedColumn(col.Header, col.accessor ?? col.accessorKey)) {
              if (value != null && value !== '') {
                const num = Number(value);
                if (!isNaN(num)) {
                  value = Math.round(num * 100) / 100;
                }
              }
            }

            // Format Fabric Code if needed
            const headerStr = typeof col.Header === 'string' ? col.Header : '';
            const accessorStr = typeof col.accessor === 'string' ? col.accessor : (col.accessorKey || '');
            const isFabricCodeCol = headerStr.toLowerCase().includes('fabric code') || 
                                    headerStr.toLowerCase().includes('fabriccode') ||
                                    headerStr.toLowerCase().includes('sort no') ||
                                    accessorStr.toLowerCase().includes('fabriccode') ||
                                    accessorStr.toLowerCase().includes('fabricmasterid') ||
                                    accessorStr.toLowerCase().includes('fabriccodeid') ||
                                    accessorStr.toLowerCase().includes('fabricid');

            if (isFabricCodeCol && !hasBothFabricColumns) {
              const isFormatted = typeof value === 'string' && value.includes(' - ');
              if (!isFormatted) {
                const fabricId = item.fabricMasterId ?? item.fabricCodeId ?? item.fabricId ?? value;
                if (fabricId != null && fabricId !== '') {
                  let fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
                    f.id !== undefined && String(f.id) === String(fabricId)
                  );
                  if (!fabric && typeof fabricId === 'string') {
                    fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
                      f.fabricCode !== undefined && String(f.fabricCode).toLowerCase() === fabricId.toLowerCase()
                    );
                  }
                  if (fabric) {
                    const code = fabric.fabricCode || fabric.fabric_code || fabric.code || '';
                    const quality = fabric.fabricQuality || fabric.quality || fabric.fabric_quality || '';
                    if (code || quality) {
                      value = code && quality ? `${code} - ${quality}` : (code || quality);
                    }
                  }
                }
              }
            }

            row[header] = value;
          });
          return row;
        });
      };

      const endpoint = searchApiEndpoint || routeToApiMap[path];

      if (endpoint && !disableFullDataFetch) {
        try {
          let apiEndpoint = endpoint;

          // Special logic for quality-master and fabric-management
          if (path === '/masters/quality-master' || path === '/masters/fabric-management') {
            apiEndpoint = title === 'Knitted Quality Master' || title === 'Knitted Fabric Master' ? '/knitted-fabric-master' : '/fabric-master';
          } else if (path === '/transaction/invoice-management') {
            apiEndpoint = '/invoices';
          } else if (path === '/transaction/fabric-inspection-management') {
            apiEndpoint = '/fabric-inspections';
          } else if (path === '/transaction/packing-list-mamagement') {
            apiEndpoint = '/generate-packing';
          } else if (path === '/transaction/process-contract-managemant') {
            apiEndpoint = title === 'process-contract-details' ? '/dyeing-work-orders/type/FABRIC' : '/dyeing-work-orders/type/YARN';
          } else if (path === '/transaction/processing-receive-management') {
            apiEndpoint = title === 'finish-fabric-receive-details' ? '/finish-fabric-receives/type/FABRIC' : '/finish-fabric-receives/type/YARN';
          } else if (path === '/transaction/beam-management') {
            apiEndpoint = title === 'beam-inward-details' ? '/beam-inward' : '/empty-beam-issue';
          }

          if (resolvedCompanyId != null && !apiEndpoint.includes('/company/') && !shouldExcludeCompanyId(path)) {
            apiEndpoint = `${apiEndpoint}/company/${resolvedCompanyId}`;
          }

          const extraParams = searchQueryParams
             ? '&' + Object.entries(searchQueryParams).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
             : '';
          const response = await apiService.get(`${apiEndpoint}?limit=10000&offset=0${extraParams}`);

          let allData = [];
          if (response?.data?.data && Array.isArray(response.data.data)) {
            allData = response.data.data;
          } else if (response?.data && Array.isArray(response.data)) {
            allData = response.data;
          } else if (Array.isArray(response)) {
            allData = response;
          } else if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
            allData = response.data.data.data;
          }

          if (allData.length > 0) {
             const safeData = Array.isArray(data) ? data : [];
            const processedById = new Map<any, any>(
              safeData.map((item: any) => [item.id ?? item.Id ?? item.ID, item])
            );
            const mergedData = allData.map((rawItem: any) => {
              const id = rawItem.id ?? rawItem.Id ?? rawItem.ID;
              return processedById.get(id) ?? rawItem;
            });

            // Filter and sort merged dataset
            const filteredData = filterAndSortData(mergedData);
            const exportData = mapDataForExport(filteredData);
            // const exportData = mapDataForExport(allData);
            exportToExcel(exportData, exportFileName, excelOptions);
          } else {
            // Fallback to current page data
            const exportData = mapDataForExport(processedData);
            exportToExcel(exportData, exportFileName, excelOptions);
          }
        } catch (error) {
          console.error("Export error:", error);
          // Fallback to current page data
          const exportData = mapDataForExport(processedData);
          exportToExcel(exportData, exportFileName, excelOptions);
        }
      } else {
        // Fallback for routes without mapping
        const exportData = mapDataForExport(processedData);
        exportToExcel(exportData, exportFileName, excelOptions);
      }
    }
  };

  const handlePdfExport = () => {
    if (canExport) {
      const isReport = path.startsWith('/reports');
      const headers = enhancedColumns
        .filter(col => typeof col.Header === 'string')
        .map(col => col.Header as string);

      // Create mapping from accessor keys to header names
      const accessorToHeaderMap: Record<string, string> = {};
      enhancedColumns.forEach(col => {
        if (typeof col.Header === 'string' && col.accessorKey) {
          accessorToHeaderMap[col.accessorKey] = col.Header;
        }
      });

      // Convert grandTotal from accessor keys to header names for PDF export
      const grandTotalForPdf: Record<string, number> = {};
      if (grandTotal && totalColumnKeys) {
        totalColumnKeys.forEach(accessorKey => {
          const headerName = accessorToHeaderMap[accessorKey];
          if (headerName && grandTotal[accessorKey] !== undefined) {
            grandTotalForPdf[headerName] = Number(Number(grandTotal[accessorKey]).toFixed(2));
          }
        });
      }

     const exportData = processedData.map((row, index) => {
        const mappedRow: any = {};
        enhancedColumns.forEach(col => {
          if (typeof col.Header === 'string') {
            let value = typeof col.accessor === 'function'
              ? col.accessor(row)
              : (row[col.accessor] !== undefined ? row[col.accessor] : row[col.accessorKey]);

                 // Apply custom column formatter if available to preserve presentation values (like vendor name, customer name, formatted dates, etc.)
            if (col.Cell && typeof col.Cell === 'function') {
              try {
                const cellResult = col.Cell({ value, row: { original: row, index } });
                value = extractStringFromReactNode(cellResult);
              } catch (e) {
                console.error("Error formatting cell for PDF export:", e);
              }
            }

            // Format decimals if the column contains quantity, meter, mtr, or amount
            if (isNumericFormattedColumn(col.Header, col.accessor ?? col.accessorKey)) {
              if (value != null && value !== '') {
                const num = Number(value);
                if (!isNaN(num)) {
                  value = Math.round(num * 100) / 100;
                }
              }
            }

            // Format Fabric Code if needed
            const headerStr = typeof col.Header === 'string' ? col.Header : '';
            const accessorStr = typeof col.accessor === 'string' ? col.accessor : (col.accessorKey || '');
            const isFabricCodeCol = headerStr.toLowerCase().includes('fabric code') || 
                                    headerStr.toLowerCase().includes('fabriccode') ||
                                    headerStr.toLowerCase().includes('sort no') ||
                                    accessorStr.toLowerCase().includes('fabriccode') ||
                                    accessorStr.toLowerCase().includes('fabricmasterid') ||
                                    accessorStr.toLowerCase().includes('fabriccodeid') ||
                                    accessorStr.toLowerCase().includes('fabricid');
                                     


            if (isFabricCodeCol && !hasBothFabricColumns) {
              const isFormatted = typeof value === 'string' && value.includes(' - ');
              if (!isFormatted) {
                const fabricId = row.fabricMasterId ?? row.fabricCodeId ?? row.fabricId ?? value;
                if (fabricId != null && fabricId !== '') {
                  let fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
                    f.id !== undefined && String(f.id) === String(fabricId)
                  );
                  if (!fabric && typeof fabricId === 'string') {
                    fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
                      f.fabricCode !== undefined && String(f.fabricCode).toLowerCase() === fabricId.toLowerCase()
                    );
                  }
                  if (fabric) {
                    const code = fabric.fabricCode || fabric.fabric_code || fabric.code || '';
                    const quality = fabric.fabricQuality || fabric.quality || fabric.fabric_quality || '';
                    if (code || quality) {
                      value = code && quality ? `${code} - ${quality}` : (code || quality);
                    }
                  }
                }
              }
            }

            mappedRow[col.Header] = value;
          }
        });
        return mappedRow;
      });

      const pdfOptions: any = {
        includeSerialNo: true,
        headerGroups: headerGroups
      };

      if (grandTotal && totalColumnKeys && totalColumnKeys.length > 0) {
        pdfOptions.grandTotal = grandTotalForPdf;
        pdfOptions.totalColumnKeys = headers.filter(header =>
          totalColumnKeys.some(accessorKey => 
            accessorKey.toLowerCase().replace(/[^a-z0-9]/g, '') === header.toLowerCase().replace(/[^a-z0-9]/g, '') ||
            (accessorToHeaderMap[accessorKey] && accessorToHeaderMap[accessorKey].toLowerCase().replace(/[^a-z0-9]/g, '') === header.toLowerCase().replace(/[^a-z0-9]/g, ''))
          )
        );
      }

      exportToPdf(headers, exportData, pdfFileName || title || 'Export_Data', pdfOptions);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [dynamicScrollHeight, setDynamicScrollHeight] = useState<string>(virtualScrollHeight);

  useEffect(() => {
    if (!virtualScroll) return;

    const calculateHeight = () => {
      if (scrollContainerRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        const topOffset = rect.top;
        const windowHeight = window.innerHeight;
        const computedHeight = windowHeight - topOffset - 60;
        
        if (computedHeight > 200) {
          setDynamicScrollHeight(`${computedHeight}px`);
        } else {
          setDynamicScrollHeight(virtualScrollHeight);
        }
      }
    };

    calculateHeight();
    const timer = setTimeout(calculateHeight, 150);

    window.addEventListener('resize', calculateHeight);
    return () => {
      window.removeEventListener('resize', calculateHeight);
      clearTimeout(timer);
    };
  }, [virtualScroll, virtualScrollHeight]);

  const rowVirtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 15,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const startIndex = virtualItems.length > 0 ? virtualItems[0].index : 0;
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  const displayTotal = totalCount !== undefined ? totalCount : processedData.length;
  const displayStart = processedData.length > 0 ? (currentPage - firstPage) * pageSize + 1 : 0;
  const displayEnd = Math.min((currentPage - firstPage) * pageSize + paginatedData.length, displayTotal);

  const hasActiveFilters = filterInput.trim() !== '' || Object.keys(columnFilters).length > 0;
  const activeFilterCount = (filterInput.trim() ? 1 : 0) + Object.keys(columnFilters).length;
  const actionsInHero = !!routeHero
    && routeHero.activeId === routeHeroId
    && !!routeHero.actionTarget
    && !routeHero.isCompact
    && showToolbar;

  const formatCellValue = useCallback((column: any, row: any, index: number) => {
    let cellValue = typeof column.accessor === 'function' 
      ? column.accessor(row) 
      : (row[column.accessor] !== undefined ? row[column.accessor] : row[column.accessorKey]);

    // Recompute Serial Number for filtered dataset consistency
    if (column.accessor === 'serialNo' || column.Header === 'S.No' || column.id === 'serialNo') {
      cellValue = externalOffset + (virtualScroll ? index : (currentPage - firstPage) * pageSize + index) + 1;
    }

    // Format decimals if the column contains quantity, meter, mtr, or amount
    if (!disableAutoFormatting && isNumericFormattedColumn(column.Header, column.accessor ?? column.accessorKey)) {
      if (cellValue != null && cellValue !== '') {
        const num = Number(cellValue);
        if (!isNaN(num)) {
          cellValue = Math.round(num * 100) / 100;
        }
      }
    }

    // Format Fabric Code if needed
    const headerStr = typeof column.Header === 'string' ? column.Header : '';
    const accessorStr = typeof column.accessor === 'string' ? column.accessor : (column.accessorKey || '');
    const isFabricCodeCol = headerStr.toLowerCase().includes('fabric code') || 
                            headerStr.toLowerCase().includes('fabriccode') ||
                            headerStr.toLowerCase().includes('sortno') ||
                            headerStr.toLowerCase().includes('sort no') ||
                            accessorStr.toLowerCase().includes('fabriccode') ||
                            accessorStr.toLowerCase().includes('fabricmasterid') ||
                            accessorStr.toLowerCase().includes('fabriccodeid') ||
                            accessorStr.toLowerCase().includes('fabricid');
    const isSizing = typeof title === 'string' && title.toLowerCase().includes('sizing');
    const isFabricQualityCol = headerStr.toLowerCase().includes('fabric quality') || 
                               headerStr.toLowerCase().includes('fabricquality') ||
                               accessorStr.toLowerCase().includes('fabricquality') ||
                               accessorStr.toLowerCase().includes('fabric_quality');

    const shouldFormatFabric = isFabricCodeCol || (isSizing && isFabricQualityCol);

    if (!disableAutoFormatting && shouldFormatFabric && (!hasBothFabricColumns || (isSizing && isFabricQualityCol))) {
      const isFormatted = typeof cellValue === 'string' && cellValue.includes(' - ');
      if (!isFormatted) {
        const fabricId = row.fabricMasterId ?? row.fabricCodeId ?? row.fabricId ?? cellValue;
        if (fabricId != null && fabricId !== '') {
          let fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
            f.id !== undefined && String(f.id) === String(fabricId)
          );
          if (!fabric && typeof fabricId === 'string') {
            fabric = [...fabricMasterFullList, ...fabricMasterList].find(f => 
              f.fabricCode !== undefined && String(f.fabricCode).toLowerCase() === fabricId.toLowerCase()
            );
          }
          if (fabric) {
            const code = fabric.fabricCode || fabric.fabric_code || fabric.code || '';
            const quality = fabric.fabricQuality || fabric.quality || fabric.fabric_quality || '';
            if (code || quality) {
              cellValue = code && quality ? `${code} - ${quality}` : (code || quality);
            }
          }
        }
      }
    }

    if (column.Cell && typeof column.Cell === 'function') {
      try {
        return column.Cell({
          value: cellValue,
          row: { original: row, index: externalOffset + (virtualScroll ? index : (currentPage - firstPage) * pageSize + index) }
        });
      } catch (e) {
        return cellValue;
      }
    }

    return cellValue;
  }, [
    externalOffset,
    virtualScroll,
    currentPage,
    firstPage,
    pageSize,
    disableAutoFormatting,
    title,
    hasBothFabricColumns,
    fabricMasterFullList,
    fabricMasterList,
  ]);

  const renderRowActions = useCallback((row: any) => {
    const customActions = renderActions ? renderActions(row) : null;
    if (customActions) return customActions;
    return (!canShowActions || canShowActions(row)) && (
      <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
        {onView && canView && (
          <button
            onClick={() => onView(row)}
            className="rounded-md border border-[var(--primary-200)] bg-[var(--primary-50)] p-1.5 text-[var(--primary)] transition hover:border-[var(--primary-500)]"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
        {onEdit && canEdit && (
          <button
            onClick={() => onEdit(row)}
            className="rounded-lg border border-amber-100 bg-amber-50/60 p-1.5 text-amber-600 transition hover:border-amber-200"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}
        {onPrint && canPrintPermission && (
          <button
            onClick={() => onPrint(row)}
            className="rounded-lg border border-[#CBE7E5] bg-[#E9F4F4] p-1.5 text-[#007F7C] transition hover:border-[#93D0CD]"
            title="Print"
          >
            <Printer className="h-4 w-4" />
          </button>
        )}
        {onClone && canAdd && (
          <button
            onClick={() => onClone(row)}
            className="rounded-lg border border-purple-100 bg-purple-50/60 p-1.5 text-purple-600 transition hover:border-purple-200"
            title="Clone"
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
        {onDelete && !hideDeleteAction && canDelete && (
          <button
            onClick={() => onDelete(row)}
            className="rounded-lg border border-rose-100 bg-rose-50/70 p-1.5 text-rose-600 transition hover:border-rose-200"
            title="Delete"
          >
            <Trash className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }, [
    renderActions,
    canShowActions,
    onView,
    canView,
    onEdit,
    canEdit,
    onPrint,
    canPrintPermission,
    onClone,
    canAdd,
    onDelete,
    hideDeleteAction,
    canDelete,
  ]);

  const isSerialCol = useCallback((col: any) => {
    if (!col) return false;
    if (col.accessor === 'serialNo' || col.id === 'serialNo' || col.accessorKey === 'serialNo') return true;
    if (typeof col.Header === 'string') {
      const h = col.Header.toLowerCase().trim();
      return ['s.no', 'sl no', 'sno', 'sl.no', 's no', '#'].includes(h);
    }
    return false;
  }, []);

  const isActionCol = useCallback((col: any) => {
    if (!col) return false;
    if (col.id === 'actions' || col.accessorKey === 'actions') return true;
    if (typeof col.Header === 'string') {
      return col.Header.toLowerCase().trim() === 'actions';
    }
    return false;
  }, []);

  const isSelectCol = useCallback((col: any) => {
    if (!col) return false;
    return col.id === 'select' || col.accessorKey === 'select';
  }, []);

  const isStatusCol = useCallback((col: any) => {
    if (!col) return false;
    const h = typeof col.Header === 'string' ? col.Header.toLowerCase() : '';
    const a = typeof col.accessor === 'string' ? col.accessor.toLowerCase() : (col.accessorKey || '').toLowerCase();
    return h.includes('status') || a.includes('status') || a.includes('activeflag') || a.includes('isactive');
  }, []);

  const isOrderStatusCol = useCallback((col: any) => {
    if (!col) return false;
    const h = typeof col.Header === 'string' ? col.Header.toLowerCase() : '';
    const a = typeof col.accessor === 'string' ? col.accessor.toLowerCase() : (col.accessorKey || '').toLowerCase();
    return (
      h.includes('order status') ||
      h.includes('order_status') ||
      h.includes('orderstatus') ||
      a.includes('order_status') ||
      a.includes('orderstatus') ||
      a.includes('iscomplete')
    );
  }, []);

  const isFilesCol = useCallback((col: any) => {
    if (!col) return false;
    const h = typeof col.Header === 'string' ? col.Header.toLowerCase() : '';
    const a = typeof col.accessor === 'string' ? col.accessor.toLowerCase() : (col.accessorKey || '').toLowerCase();
    return h.includes('file') || h.includes('attachment') || a.includes('file') || a.includes('attachment');
  }, []);

  const isPrintCol = useCallback((col: any) => {
    if (!col) return false;
    const h = typeof col.Header === 'string' ? col.Header.toLowerCase() : '';
    const a = typeof col.accessor === 'string' ? col.accessor.toLowerCase() : (col.accessorKey || '').toLowerCase();
    return h === 'print' || a === 'print';
  }, []);

  const extractTextContent = useCallback((node: any): string => {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node).trim();
    if (React.isValidElement(node)) {
      const props = node.props as any;
      if (!props) return '';
      if (typeof props.children === 'string' || typeof props.children === 'number') {
        return String(props.children).trim();
      }
      if (Array.isArray(props.children)) {
        return props.children.map(extractTextContent).filter(Boolean).join(' ').trim();
      }
      if (React.isValidElement(props.children)) {
        return extractTextContent(props.children);
      }
      if (props.value != null && (typeof props.value === 'string' || typeof props.value === 'number')) {
        return String(props.value).trim();
      }
    }
    if (typeof node === 'object') {
      if (typeof node.label === 'string') return node.label.trim();
      if (typeof node.name === 'string') return node.name.trim();
      if (typeof node.value === 'string' || typeof node.value === 'number') return String(node.value).trim();
    }
    return '';
  }, []);

  const isValueEmpty = useCallback((node: any): boolean => {
    if (node == null) return true;
    if (typeof node === 'string') {
      const trimmed = node.trim();
      return trimmed === '' || trimmed === '-' || trimmed === '—' || trimmed === 'null' || trimmed === 'undefined';
    }
    if (typeof node === 'number') return isNaN(node);
    if (React.isValidElement(node)) {
      const text = extractTextContent(node);
      return text === '' || text === '-' || text === '—';
    }
    return false;
  }, [extractTextContent]);

  const getCardInitials = useCallback((text: any): string => {
    const raw = extractTextContent(text).replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    if (!raw) return 'HF';
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (words.length === 1 && words[0].length >= 2) {
      return words[0].slice(0, 2).toUpperCase();
    }
    if (words.length === 1 && words[0].length === 1) {
      return words[0][0].toUpperCase();
    }
    return 'HF';
  }, [extractTextContent]);

  const renderCardStatusBadge = useCallback((rawVal: any, row: any) => {
    let text = 'Active';
    if (rawVal != null) {
      const extracted = extractTextContent(rawVal);
      if (extracted) {
        text = extracted;
      } else if (typeof rawVal === 'string' || typeof rawVal === 'number') {
        text = String(rawVal).trim();
      } else if (typeof rawVal === 'boolean') {
        text = rawVal ? 'Active' : 'Inactive';
      }
    } else if (row) {
      if (row.status != null) text = String(row.status).trim();
      else if (row.statusLabel != null) text = String(row.statusLabel).trim();
      else if (row.isActive != null) text = row.isActive ? 'Active' : 'Inactive';
      else if (row.activeFlag != null) text = (row.activeFlag === 'Y' || row.activeFlag === 1 || row.activeFlag === true) ? 'Active' : 'Inactive';
      else if (row.activeflag != null) text = (row.activeflag === 'Y' || row.activeflag === 1) ? 'Active' : 'Inactive';
    }

    const lower = text.toLowerCase();
    const isApproved = lower.includes('approved') || lower.includes('active') || lower.includes('complete') || lower === 'y' || lower === '1';
    const isPending = lower.includes('pending') || lower.includes('draft') || lower.includes('wait') || lower.includes('process');
    const isRejected = lower.includes('inactive') || lower.includes('reject') || lower.includes('cancel') || lower === 'n' || lower === '0';

    let pillClass = 'bg-sky-50 text-sky-700 border-sky-200/80';
    let dotClass = 'bg-sky-500';

    if (isApproved) {
      pillClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/90';
      dotClass = 'bg-emerald-500';
    } else if (isPending) {
      pillClass = 'bg-amber-50 text-amber-700 border-amber-200/90';
      dotClass = 'bg-amber-500';
    } else if (isRejected) {
      pillClass = 'bg-rose-50 text-rose-700 border-rose-200/90';
      dotClass = 'bg-rose-500';
    }

    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-2xs select-none', pillClass)}>
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotClass)} />
        <span className="capitalize">{text}</span>
      </span>
    );
  }, [extractTextContent]);

  const renderOrderStatusButton = useCallback((orderStatusNode: any, row: any) => {
    if (!orderStatusNode) return null;

    if (React.isValidElement(orderStatusNode)) {
      const props = orderStatusNode.props as any;
      const buttonText = extractTextContent(orderStatusNode) || 'Complete';
      const onClick = props?.onClick;

      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick(e);
          }}
          className="rounded-full border border-[#CCA651] bg-[#CCA651]/10 px-3.5 py-1 text-xs font-semibold text-[#8C6D23] transition hover:bg-[#CCA651]/20 hover:border-[#B8923F] cursor-pointer shadow-2xs active:scale-95"
        >
          {buttonText}
        </button>
      );
    }

    const text = String(orderStatusNode).trim();
    if (!text || text === '-' || text === '—') return null;

    return (
      <span className="rounded-full border border-[#CCA651] bg-[#CCA651]/10 px-3.5 py-1 text-xs font-semibold text-[#8C6D23]">
        {text}
      </span>
    );
  }, [extractTextContent]);

  const cardColumnsConfig = useMemo(() => {
    const serialCol = enhancedColumns.find(isSerialCol);
    const statusCol = enhancedColumns.find(isStatusCol);
    const orderStatusCol = enhancedColumns.find(isOrderStatusCol);
    const filesCol = enhancedColumns.find(isFilesCol);
    const printCol = enhancedColumns.find(isPrintCol);

    const contentCols = enhancedColumns.filter(c =>
      !isSerialCol(c) && !isActionCol(c) && !isSelectCol(c)
    );

    const colMatch = (c: any, keywords: string[]) => {
      if (!c) return false;
      const h = typeof c.Header === 'string' ? c.Header.toLowerCase() : '';
      const a = typeof c.accessor === 'string' ? c.accessor.toLowerCase() : (c.accessorKey || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      return keywords.some(k => h.includes(k) || a.includes(k) || id.includes(k));
    };

    const dataCols = contentCols.filter(c =>
      c !== orderStatusCol && c !== filesCol && c !== printCol && !isStatusCol(c)
    );

    // 1. Primary Title: Contract No, PO No, Doc No, Order No, Code, Name
    const titleCol = dataCols.find(c => colMatch(c, [
      'contractno', 'contract no', 'weavingcontractno',
      'docno', 'doc no', 'documentno', 'document no',
      'pono', 'po no', 'orderno', 'order no',
      'invoiceno', 'invoice no', 'dcno', 'dc no',
      'rollno', 'roll no', 'refno', 'ref no',
      'code', 'number', 'terms'
    ])) || dataCols.find(c => !isDateColumn(c) && colMatch(c, ['name', 'title'])) || dataCols.find(c => !isDateColumn(c)) || dataCols[0];

    // 2. Date column (for subtitle under title)
    const dateCol = dataCols.find(c => c !== titleCol && (isDateColumn(c) || colMatch(c, ['date', 'time', 'created', 'dt'])));

    // 3. Entity column: Vendor, Supplier, Buyer, Customer, Party, Mill
    const entityCol = dataCols.find(c =>
      c !== titleCol && c !== dateCol &&
      colMatch(c, ['vendor', 'supplier', 'buyer', 'customer', 'party', 'mill', 'company', 'client', 'agency'])
    );

    // 4. Remaining other columns for attributes and inset box
    const otherCols = dataCols.filter(c => c !== titleCol && c !== dateCol && c !== entityCol);

    return {
      serialCol,
      statusCol,
      orderStatusCol,
      filesCol,
      printCol,
      titleCol,
      dateCol,
      entityCol,
      otherCols,
    };
  }, [enhancedColumns, isSerialCol, isActionCol, isSelectCol, isStatusCol, isOrderStatusCol, isFilesCol, isPrintCol]);

  const renderCardsView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008F8C]"></div>
          <span className="ml-3 text-slate-500 font-medium text-sm">Loading records...</span>
        </div>
      );
    }

    if (paginatedData.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 px-6 py-16 text-center shadow-xs">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <div className="rounded-full bg-slate-100 p-4 text-slate-400">
              <Search className="h-8 w-8" />
            </div>
            <p className="text-base font-semibold text-slate-700">
              {emptyMessage || (hasActiveFilters ? 'No records match the current filters' : 'No records available yet')}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
              >
                Clear filters to view everything
              </button>
            )}
          </div>
        </div>
      );
    }

    const {
      serialCol,
      statusCol,
      orderStatusCol,
      filesCol,
      printCol,
      titleCol,
      dateCol,
      entityCol,
      otherCols,
    } = cardColumnsConfig;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3.5 pb-2">
        {paginatedData.map((row: any, mapIdx: number) => {
          const index = (currentPage - firstPage) * pageSize + mapIdx;
          const rowId = getRowId ? getRowId(row) : (row.id !== undefined ? `row-${row.id}` : undefined);
          const key = rowId ? `${rowId}-${index}` : (row?.pieceNo ? `row-${row.pieceNo}-${index}` : mapIdx);
          const details = renderRowDetails ? renderRowDetails(row) : null;
          const isHighlighted = highlightRowId != null && row.id === highlightRowId;
          const actionsNode = showActions ? renderRowActions(row) : null;

          if (renderCard) {
            return (
              <React.Fragment key={key}>
                {renderCard({ row, index, columns: enhancedColumns, actions: actionsNode })}
              </React.Fragment>
            );
          }

          const serialValue = serialCol
            ? formatCellValue(serialCol, row, mapIdx)
            : externalOffset + index + 1;

          // 1. Title / Code
          const rawTitleVal = titleCol ? formatCellValue(titleCol, row, mapIdx) : null;
          const titleText = extractTextContent(rawTitleVal) || row.weavingContractNo || row.poNo || row.orderNo || row.docNo || row.code || row.name || `Record #${serialValue}`;

          // 2. Subtitle / Date (only if date data exists)
          let subtitleLabel = dateCol && typeof dateCol.Header === 'string' ? dateCol.Header : 'Date';
          let subtitleNode: React.ReactNode = null;
          if (dateCol) {
            const rawDate = formatCellValue(dateCol, row, mapIdx);
            if (!isValueEmpty(rawDate)) {
              subtitleNode = rawDate;
            }
          } else if (row.contractDate || row.poDate || row.date || row.createdAt || row.created_at) {
            subtitleLabel = 'Date';
            const d = parseDateString(row.contractDate || row.poDate || row.date || row.createdAt || row.created_at);
            if (d) {
              subtitleNode = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            }
          }

          // 3. Status Badge (only if status data exists)
          const rawStatusVal = statusCol ? formatCellValue(statusCol, row, mapIdx) : null;
          const statusBadgeNode = !isValueEmpty(rawStatusVal) || row.statusLabel != null || row.activeFlag != null || row.isActive != null || row.status != null
            ? renderCardStatusBadge(rawStatusVal, row)
            : null;

          // 4. Entity / Vendor / Supplier (only if entity data exists)
          let entityNode: React.ReactNode = null;
          let entityText = '';
          const entityRole = entityCol && typeof entityCol.Header === 'string' ? entityCol.Header : 'Vendor';

          if (entityCol) {
            const rawEnt = formatCellValue(entityCol, row, mapIdx);
            if (!isValueEmpty(rawEnt)) {
              entityNode = rawEnt;
              entityText = extractTextContent(rawEnt);
            }
          }
          if (!entityText && (row.vendorName || row.supplierName || row.partyName || row.buyerName || row.customerName || row.millName)) {
            entityText = String(row.vendorName || row.supplierName || row.partyName || row.buyerName || row.customerName || row.millName);
            entityNode = entityText;
          }
          const hasEntity = !isValueEmpty(entityNode) && entityText.trim().length > 0;
          const avatarInitials = hasEntity ? getCardInitials(entityText) : '';

          // 5. Dynamic other data columns (attributes & inset box) - ONLY show non-empty fields!
          const validOtherCols = otherCols.map(col => {
            const val = formatCellValue(col, row, mapIdx);
            return {
              col,
              label: typeof col.Header === 'string' ? col.Header : (col.id || col.accessorKey || ''),
              val,
              isEmpty: isValueEmpty(val),
            };
          }).filter(item => !item.isEmpty);

          let gridItems: typeof validOtherCols = [];
          let insetItems: typeof validOtherCols = [];

          if (validOtherCols.length >= 4) {
            gridItems = validOtherCols.slice(0, 2);
            insetItems = validOtherCols.slice(2, 4);
          } else if (validOtherCols.length === 3) {
            gridItems = validOtherCols.slice(0, 1);
            insetItems = validOtherCols.slice(1, 3);
          } else if (validOtherCols.length === 2) {
            insetItems = validOtherCols.slice(0, 2);
          } else if (validOtherCols.length === 1) {
            insetItems = validOtherCols.slice(0, 1);
          }
          const extraItems = validOtherCols.length > 4 ? validOtherCols.slice(4) : [];

          // 6. Files & Print (only if columns exist and have non-empty values)
          const rawFilesVal = filesCol ? formatCellValue(filesCol, row, mapIdx) : null;
          const hasFiles = filesCol && !isValueEmpty(rawFilesVal);

          const rawPrintVal = printCol ? formatCellValue(printCol, row, mapIdx) : null;
          const hasPrint = printCol && !isValueEmpty(rawPrintVal);

          // 7. Order Status / Complete Button (only if order status column exists in table!)
          const rawOrderStatusVal = orderStatusCol ? formatCellValue(orderStatusCol, row, mapIdx) : null;
          const hasOrderStatus = orderStatusCol && !isValueEmpty(rawOrderStatusVal);

          return (
            <div
              key={key}
              id={rowId}
              data-record-row
              onClick={() => onRowClick?.(row)}
              onDoubleClick={() => onRowDoubleClick?.(row)}
              className={cn(
                'group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/70 backdrop-blur-md p-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:border-[#CCA651]/70 hover:bg-white/90 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition-all duration-200 text-slate-800 overflow-hidden',
                isHighlighted && 'ring-2 ring-[#008F8C] border-[#008F8C]',
                onRowClick && 'cursor-pointer'
              )}
            >
              {/* Top Gradient Gold Border Accent */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#CCA651] via-[#EBD694] to-transparent pointer-events-none" />

              <div>
                {/* Top Header: ID/Code + Subtitle & Status Pill */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div
                      className="font-serif font-bold text-[#082A59] text-[15px] md:text-[16px] leading-tight break-words tracking-tight group-hover:text-[#008F8C] transition-colors"
                      title={titleText}
                    >
                      {isValueEmpty(rawTitleVal) ? titleText : rawTitleVal}
                    </div>
                    {subtitleNode != null && (
                      <div className="text-[11px] text-slate-500 mt-1 font-normal flex items-center gap-1 truncate">
                        <span>{subtitleLabel}:</span>
                        <span className="truncate">{subtitleNode}</span>
                      </div>
                    )}
                  </div>
                  {statusBadgeNode && (
                    <div className="shrink-0 pt-0.5">
                      {statusBadgeNode}
                    </div>
                  )}
                </div>

                {/* Avatar & Entity Row (only if entity data exists) */}
                {hasEntity && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 flex items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 rounded-full border border-sky-200 bg-sky-50 flex items-center justify-center text-xs font-bold text-[#082A59] shadow-2xs select-none">
                      {avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 tracking-wide uppercase truncate" title={entityText}>
                        {entityNode}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                        {entityRole}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attributes Grid (only if non-empty columns exist) */}
                {gridItems.length > 0 && (
                  <div className={cn('mt-3 grid gap-2.5', gridItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                    {gridItems.map((item, idx) => (
                      <div key={idx} className="min-w-0">
                        <span className="text-[10.5px] text-slate-500 font-medium block truncate" title={item.label}>
                          {item.label}
                        </span>
                        <div className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
                          {item.val}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inset Box (only if non-empty metrics/details exist) */}
                {insetItems.length > 0 && (
                  <div className={cn('mt-3 rounded-xl bg-slate-100/75 border border-slate-200/80 p-2.5 backdrop-blur-xs', insetItems.length === 1 ? 'block' : 'grid grid-cols-2 gap-2.5')}>
                    {insetItems.map((item, idx) => (
                      <div key={idx} className="min-w-0">
                        <span className="text-[10.5px] text-slate-500 font-medium block truncate" title={item.label}>
                          {item.label}
                        </span>
                        <div className="text-xs md:text-[13px] font-bold text-[#082A59] block mt-0.5 truncate">
                          {item.val}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Extra columns (if more than 4 data columns exist) */}
                {extraItems.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 pt-2 border-t border-slate-200/80">
                    {extraItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[10.5px] text-slate-500 truncate">{item.label}:</span>
                        <span className="text-xs font-semibold text-slate-800 truncate text-right">{item.val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Metadata Line (Files & Print - only if columns exist and have content) */}
                {(hasFiles || hasPrint) && (
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                    {hasFiles ? (
                      <div className="truncate flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span>Files:</span>
                        <span className="text-[#008F8C] font-semibold hover:underline cursor-pointer">
                          {rawFilesVal}
                        </span>
                      </div>
                    ) : <div />}
                    {hasPrint && (
                      <div className="truncate flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span>Print:</span>
                        <span>{rawPrintVal}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Details (if expandable row details exist) */}
                {details && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs text-slate-600">
                    {details}
                  </div>
                )}
              </div>

              {/* Footer Action Bar */}
              <div
                className="mt-3.5 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  {hasOrderStatus && renderOrderStatusButton(rawOrderStatusVal, row)}
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
                  {onView && canView && (
                    <button
                      type="button"
                      onClick={() => onView(row)}
                      className="rounded-md p-1.5 text-sky-600 hover:bg-sky-50 active:scale-95 transition-all"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {onEdit && canEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50 active:scale-95 transition-all"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && !hideDeleteAction && canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                      title="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                  {onPrint && canPrintPermission && (
                    <button
                      type="button"
                      onClick={() => onPrint(row)}
                      className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all"
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  )}
                  {onClone && canAdd && (
                    <button
                      type="button"
                      onClick={() => onClone(row)}
                      className="rounded-md p-1.5 text-purple-600 hover:bg-purple-50 active:scale-95 transition-all"
                      title="Clone"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  {renderActions && (
                    <div className="flex items-center gap-1">
                      {renderActions(row)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderViewModeToggle = (inHero = false) => {
    if (!showViewToggle) return null;

    return (
      <div
        className={
          inHero
            ? 'inline-flex items-center rounded-md border border-white/30 bg-white/10 p-0.5'
            : 'inline-flex items-center rounded-lg border border-[#D8E1EA] bg-[#F7F9FB] p-0.5 shadow-2xs'
        }
      >
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={
            inHero
              ? `inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-[#008F8C] text-white shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              : `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-[#082A59] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#082A59] hover:bg-white'
                }`
          }
          title="Switch to Table View"
          aria-label="Table View"
        >
          <List className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Table</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('cards')}
          className={
            inHero
              ? `inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === 'cards'
                    ? 'bg-[#008F8C] text-white shadow-xs'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              : `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === 'cards'
                    ? 'bg-[#082A59] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#082A59] hover:bg-white'
                }`
          }
          title="Switch to Cards View"
          aria-label="Cards View"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Cards</span>
        </button>
      </div>
    );
  };

  const renderTopLevelActions = (inHero: boolean) => (
    <div className={`flex flex-wrap items-center gap-2 ${inHero ? 'justify-end' : 'ml-auto'}`}>
      {headerContent && (
        <div className="flex flex-wrap items-center gap-2">
          {typeof headerContent === 'function'
            ? headerContent({ filteredData: processedData, processedTotals, isSearchActive })
            : headerContent}
        </div>
      )}
      {showAddActions && onAdd && canAdd && (
        <button
          onClick={onAdd}
          className={inHero
            ? 'inline-flex items-center gap-1.5 rounded-md bg-[#D0A45D] px-3 py-1.5 text-xs font-semibold text-[#082A59] transition hover:bg-[#DDB774]'
            : 'bg-primary inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95'}
        >
          <Plus className="h-3 w-3" />
          Add Entry
        </button>
      )}
      {headerActions && (
        <div className="flex flex-wrap items-center gap-1">
          {typeof headerActions === 'function'
            ? headerActions({ filteredData: processedData, processedTotals, isSearchActive })
            : headerActions}
        </div>
      )}
      {title && title.toLowerCase().includes('location wise yarn') && (
        <select
          value={selectedAging}
          onChange={(e) => {
            setSelectedAging(e.target.value);
            setCurrentPage(firstPage);
          }}
          className={inHero
            ? 'inline-flex items-center rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#00A89D]/40'
            : 'inline-flex items-center gap-1.5 rounded-md border border-[#D8E1EA] bg-white px-3 py-1.5 text-xs font-semibold text-[#102F50] focus:outline-none focus:ring-2 focus:ring-[#008F8C]/15 focus:border-[#008F8C] transition-all font-medium cursor-pointer'}
        >
          <option value="Select aging">Select aging</option>
          <option value="<30days">&lt;30days</option>
          <option value="30-59days">30-59days</option>
          <option value="60-89 days">60-89 days</option>
          <option value="90 - 180 days">90 - 180 days</option>
          <option value=">180days">&gt;180days</option>
        </select>
      )}
      {showColumnFilters && (
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={inHero
            ? `relative inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${showFilters ? 'border-[#008F8C] bg-[#008F8C] text-white' : 'border-white/30 bg-white/10 text-white hover:bg-white/20'}`
            : `relative inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${showFilters ? 'border-transparent bg-primary text-white shadow-sm' : 'border-[#D8E1EA] bg-white text-[#102F50] hover:bg-[var(--primary-50)]'}`}
          title="Toggle Column Filters"
        >
          <Filter className="h-3 w-3" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className={`absolute -top-1 -right-2 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold shadow ${inHero ? 'bg-white text-[#008F8C]' : 'bg-white text-[var(--primary)]'}`}>
              {activeFilterCount}
            </span>
          )}
        </button>
      )}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className={inHero
            ? 'inline-flex items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100'}
          title="Clear All Filters"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
      {showExport && canExport && (
        <button
          onClick={handleExport}
          className={inHero
            ? 'inline-flex items-center gap-1.5 rounded-md border border-[#00A89D]/45 bg-[#008F8C]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#008F8C]/35'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-[#CBE7E5] bg-[#E9F4F4] px-3 py-1.5 text-xs font-semibold text-[#007F7C] transition hover:bg-[#DDF0EF]'}
        >
          <Download className="h-3 w-3" />
          Excel
        </button>
      )}
      {showPdfExport && canExport && (
        <button
          onClick={handlePdfExport}
          className={inHero
            ? 'inline-flex items-center gap-1.5 rounded-md border border-[#D0A45D]/55 bg-[#D0A45D]/15 px-3 py-1.5 text-xs font-semibold text-[#F3D9A7] transition hover:bg-[#D0A45D]/25'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-100'}
        >
          <Download className="h-3 w-3" />
          PDF
        </button>
      )}
      {renderViewModeToggle(inHero)}
    </div>
  );
  const heroActionsPortal = actionsInHero && routeHero?.actionTarget
    ? createPortal(renderTopLevelActions(true), routeHero.actionTarget)
    : null;

  return (
    <div className="data-table-shell w-full">
      {heroActionsPortal}
      {showToolbar && (
      <div className="no-print">
        <div className="flex flex-col">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(onPending || onApproved) && (
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 py-3">
                  {onPending && (
                    <button
                      onClick={onPending}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${activeTab === 'pending'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-[var(--primary)] hover:bg-[var(--primary-50)]'
                        }`}
                    >
                      Pending
                    </button>
                  )}
                  {onApproved && (
                    <button
                      onClick={onApproved}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${activeTab === 'approved'
                        ? 'bg-[#008F8C] text-white shadow-sm'
                        : 'text-[#008F8C] hover:bg-[#E9F3F8]'
                        }`}
                    >
                      Approved
                    </button>
                  )}
                </div>
              )}
             
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center pb-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              {showSearch && (
                <div className="relative min-w-[200px] flex-shrink-0">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  <input
                    value={localSearchVal}
                    onChange={(e) => {
                      setLocalSearchVal(e.target.value);
                      if (e.target.value !== filterInput) {
                        setIsSearching(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setFilterInput(localSearchVal);
                        setCurrentPage(firstPage === 0 ? 0 : 1);
                        setIsSearching(false);
                      }
                    }}
                    placeholder={filterPlaceholder}
                    className="w-full rounded-full border border-[#D8E1EA] bg-white pl-6 pr-8 py-1.5 text-xs text-[#102F50] shadow-sm focus:border-[#008F8C] focus:outline-none focus:ring-2 focus:ring-[#008F8C]/15 font-medium"
                  />
                  {(isSearching || isLoadingFullData) && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-200 border-t-[var(--primary)]"></div>
                    </div>
                  )}
                </div>
              )}
              {renderViewModeToggle(false)}
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* {showAddActions && onAdd && canAdd && (
                <button
                  onClick={onAdd}
                  className="bg-primary inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95"
                >
                  <Plus className="h-3 w-3" />
                  Add Entry
                </button>
              )} */}
               {headerActions && (
                <div className="flex flex-col gap-1">
                  {typeof headerActions === 'function'
                    ? headerActions({ filteredData: processedData, processedTotals, isSearchActive })
                    : headerActions}
                </div>
              )}
               {title && title.toLowerCase().includes("location wise yarn") && (
                <select
                  value={selectedAging}
                  onChange={(e) => {
                    setSelectedAging(e.target.value);
                    setCurrentPage(firstPage);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#D8E1EA] bg-white text-[#102F50] px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#008F8C]/15 focus:border-[#008F8C] transition-all font-medium cursor-pointer"
                >
                  <option value="Select aging">Select aging</option>
                  <option value="<30days">&lt;30days</option>
                  <option value="30-59days">30-59days</option>
                  <option value="60-89 days">60-89 days</option>
                  <option value="90 - 180 days">90 - 180 days</option>
                  <option value=">180days">&gt;180days</option>
                </select>
              )}
              {/* {showColumnFilters && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`relative inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${showFilters ? 'border-transparent bg-primary text-white shadow-sm' : 'border-[#D8E1EA] bg-white text-[#102F50] hover:bg-[var(--primary-50)]'
                    }`}
                  title="Toggle Column Filters"
                >
                  <Filter className="h-3 w-3" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-2 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-[var(--primary)] shadow">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                  title="Clear All Filters"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
              {showExport && canExport && (
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBE7E5] bg-[#E9F4F4] px-3 py-1.5 text-xs font-semibold text-[#007F7C] transition hover:bg-[#DDF0EF]"
                >
                  <Download className="h-3 w-3" />
                  Excel
                </button>
              )}
              {showPdfExport && canExport && (
                <button
                  onClick={handlePdfExport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-100"
                >
                  <Download className="h-3 w-3" />
                  PDF
                </button>
              )} */}
             
            </div>
          </div>
        </div>
      </div>

      )}

      {showToolbar && totalColumnKeys && totalColumnKeys.length > 0 && (
        <div className="no-print mb-2 flex flex-wrap items-center gap-3 rounded-md border border-[#D8E1EA] bg-[#F7F9FB] p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 font-bold text-[11px] text-[#102F50] uppercase tracking-wider pr-3 border-r border-[#D8E1EA]">
            <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
            Totals Summary {isSearchActive && <span className="text-[10px] font-semibold text-[var(--primary)] normal-case">(Filtered)</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {totalColumnKeys.map(key => {
              const col = enhancedColumns.find(c => c.accessorKey === key || c.id === key);
              const headerLabel = col && typeof col.Header === 'string' ? col.Header : key;
              const filteredVal = processedTotals[key] || 0;
              const pageVal = pageTotals[key] || 0;

              let displayFiltered = filteredVal % 1 === 0
                ? filteredVal.toLocaleString('en-IN')
                : filteredVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

              let displayPage = pageVal % 1 === 0
                ? pageVal.toLocaleString('en-IN')
                : pageVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

              return (
                <div key={key} className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200/90 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">{headerLabel}:</span>
                  <span className="text-xs font-bold text-slate-900">{displayFiltered}</span>
                  {processedData.length > paginatedData.length && (
                    <span className="text-[10px] text-slate-400 font-medium" title={`Current Page: ${displayPage}`}>
                      (Pg: {displayPage})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden">
        {viewMode === 'cards' ? (
          <div>
            {/* Cards View Column Filters Panel */}
            {showToolbar && showColumnFilters && showFilters && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-[#082A59] uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-[#008F8C]" />
                    Column Filters
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-medium text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear all filters
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {enhancedColumns
                    .filter(c => !c.disableFilters && !isActionCol(c) && !isSerialCol(c) && !isSelectCol(c))
                    .map(column => {
                      const isMaster = isMasterColumn(column);
                      const dropdownOpts = columnDropdownOptions[column.id] || [];
                      const label = typeof column.Header === 'string' ? column.Header : (column.id || column.accessorKey);
                      return (
                        <div key={`card-filter-${column.id}`} className="flex flex-col gap-1">
                          <label className="text-[10.5px] font-semibold text-slate-600 uppercase tracking-tight truncate" title={label}>
                            {label}
                          </label>
                          {column.Filter ? (
                            <column.Filter
                              column={{
                                id: column.id,
                                filterValue: columnFilters[column.id] || {},
                                setFilter: (value: any) => handleColumnFilterChange(column.id, value)
                              }}
                            />
                          ) : isMaster ? (
                            <SelectColumnFilter
                              column={{
                                id: column.id,
                                Header: column.Header,
                                filterValue: columnFilters[column.id] || '',
                                setFilter: (value: any) => handleColumnFilterChange(column.id, value)
                              }}
                              options={dropdownOpts}
                            />
                          ) : (
                            <DefaultColumnFilter
                              column={{
                                filterValue: columnFilters[column.id] || '',
                                setFilter: (value: any) => handleColumnFilterChange(column.id, value)
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {renderCardsView()}
          </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-auto"
            style={virtualScroll ? { maxHeight: dynamicScrollHeight } : {}}
          >
            <table className={`border-spacing-0 text-xs common-table ${disableColumnExpand ? 'mx-auto' : 'min-w-full'} ${tableClassName || ''}`}>
            <thead className="bg-[#082A59] text-sm font-semibold uppercase tracking-wide text-white">
              {headerGroups.map((headerGroup, groupIndex) => (
                <tr key={groupIndex}>
                  {headerGroup.map((column) => (
                    <th
                      key={column.id}
                      colSpan={column.colSpan}
                      rowSpan={column.rowSpan}
                      className={`sticky z-20 bg-[#082A59] relative px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide ${!disableSorting && !column.disableSorting && !column.columns ? 'cursor-pointer' : ''} border-r border-b border-[#174B7A] last:border-r-0 ${column.headerClassName || 'text-white'}`}
                      onClick={() => !disableSorting && !column.disableSorting && !column.columns && column.id !== 'select' && handleSort(column.id)}
                      style={{
                        top: groupIndex === 0 ? '0px' : '36px',
                        width: columnWidths[column.id] ? `${columnWidths[column.id]}px` : (column.width ? `${column.width}px` : (
                          (column.accessor === 'serialNo' || column.id === 'serialNo' || (typeof column.Header === 'string' && ['s.no', 'sl no', 'sno', 'sl.no', 's no'].includes(column.Header.toLowerCase().trim()))) ? '50px' : 'auto'
                        )),
                        minWidth: column.minWidth ? `${column.minWidth}px` : (column.width ? `${column.width}px` : (
                          (column.accessor === 'serialNo' || column.id === 'serialNo' || (typeof column.Header === 'string' && ['s.no', 'sl no', 'sno', 'sl.no', 's no'].includes(column.Header.toLowerCase().trim()))) ? '50px' : 'auto'
                        )),
                        maxWidth: (column.accessor === 'serialNo' || column.id === 'serialNo' || (typeof column.Header === 'string' && ['s.no', 'sl no', 'sno', 'sl.no', 's no'].includes(column.Header.toLowerCase().trim()))) ? '50px' : undefined,
                        textAlign: column.align || (column.columns || column.headerClassName?.includes('text-center') ? 'center' : 'left')
                      }}
                    >
                      <div className={`flex items-center ${column.columns || column.headerClassName?.includes('text-center') || column.align === 'center' ? 'justify-center' : ''}`}>
                        {typeof column.Header === 'function' ? column.Header() : column.Header}
                        {!disableSorting && !column.disableSorting && !column.columns && (
                          <span className="ml-1">
                            {sortConfig?.key === column.id && (
                              sortConfig?.direction === 'asc' ?
                                <ChevronUp className="w-4 h-4" /> :
                                <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        )}
                      </div>
                      {/* Resize Handle - only for leaf columns */}
                      {!column.columns && (
                        <div
                          className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-[#D0A45D] z-10"
                          onMouseDown={(e) => handleMouseDown(e, column.id)}
                        />
                      )}
                    </th>
                  ))}
                  {groupIndex === 0 && showActions && (
                  <th
                      rowSpan={headerGroups.length}
                      className="sticky top-0 z-20 bg-[#082A59] px-2 py-1.5 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-[#174B7A]"
                      style={Object.keys(columnWidths).length > 0 ? { width: '150px' } : {}}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              ))}
              {showToolbar && showColumnFilters && showFilters && (
                <tr className="bg-secondary-50 ">
                  {enhancedColumns.map((column) => {
                    const isMaster = isMasterColumn(column);
                    const dropdownOpts = columnDropdownOptions[column.id] || [];

                    return (
                      <th
                        key={`filter-${column.id}`}
                        className="px-2 py-1 border-r border-gray-600 last:border-r-0 sticky z-20 bg-secondary-50"
                        style={{ 
                          top: headerGroups.length === 2 ? '72px' : '36px',
                          width: columnWidths[column.id] ? `${columnWidths[column.id]}px` : (typeof column.width === 'number' ? `${column.width}px` : column.width || 'auto') 
                        }}
                      >
                        {!column.disableFilters ? (
                          column.Filter ? (
                            // Use custom filter component if provided
                            <column.Filter
                              column={{
                                id: column.id,
                                filterValue: columnFilters[column.id] || {},
                                setFilter: (value: any) => handleColumnFilterChange(column.id, value)
                              }}
                            />
                          ) : isMaster ? (
                            // Use Dropdown/Select filter for master data columns
                            <SelectColumnFilter
                              column={{
                                id: column.id,
                                Header: column.Header,
                                filterValue: columnFilters[column.id] || '',
                                setFilter: (value: any) => handleColumnFilterChange(column.id, value)
                              }}
                              options={dropdownOpts}
                            />
                          ) : (
                            // Use default filter
                            <DefaultColumnFilter
                              column={{
                                filterValue: columnFilters[column.id] || '',
                                setFilter: (value: any) => handleColumnFilterChange(column.id, value)
                              }}
                            />
                          )
                        ) : (
                          <div className="h-8"></div> // Empty space for columns without filters
                        )}
                      </th>
                    );
                  })}
                  {showActions && (
                    <th
                      className="px-2 py-1 border-r border-gray-600 sticky z-20 bg-secondary-50"
                      style={{ 
                        top: headerGroups.length === 2 ? '72px' : '36px',
                        ...(Object.keys(columnWidths).length > 0 ? { width: '150px' } : {}) 
                      }}
                    ></th>
                  )}
                </tr>
              )}
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={enhancedColumns.length + (showActions ? 1 : 0)}
                    className="px-6 py-10 text-center"
                  >
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="text-secondary-500 font-medium">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : (virtualScroll ? virtualItems.length > 0 : paginatedData.length > 0) ? (
                <>
                  {virtualScroll && paddingTop > 0 && (
                    <tr>
                      <td colSpan={enhancedColumns.length + (showActions ? 1 : 0)} style={{ height: `${paddingTop}px`, padding: 0, border: 0 }}></td>
                    </tr>
                  )}
                  {(virtualScroll ? virtualItems : paginatedData).map((itemOrRow: any, mapIdx: number) => {
                    const index = virtualScroll ? (itemOrRow as any).index : mapIdx;
                    const row = virtualScroll ? paginatedData[index] : itemOrRow;
                    const details = renderRowDetails ? renderRowDetails(row) : null;
                    const rowId = getRowId ? getRowId(row) : (row.id !== undefined ? `row-${row.id}` : undefined);
                    const key = virtualScroll
                      ? (itemOrRow as any).key
                      : (rowId ? `${rowId}-${index}` : (row?.pieceNo ? `row-${row.pieceNo}-${index}` : mapIdx));
                    const rowContent = (
                      <tr
                        key={key}
                        id={rowId}
                        data-record-row
                        onClick={() => onRowClick?.(row)}
                        onDoubleClick={() => onRowDoubleClick?.(row)}
                        className={`${
                          highlightRowId != null && row.id === highlightRowId
                            ? 'bg-[var(--primary-100)] ring-2 ring-inset ring-[var(--primary-500)] transition-all duration-500'
                            : (getRowClassName?.(row) || 'bg-white')
                        } border-slate-200 transition hover:bg-[var(--primary-50)] ${onRowClick ? 'cursor-pointer' : ''}`}
                      >
                        {enhancedColumns.map((column, colIdx) => (
                          <td
                            key={column.id || colIdx}
                            style={{
                              width: columnWidths[column.id] ? `${columnWidths[column.id]}px` : (typeof column.width === 'number' ? `${column.width}px` : column.width || 'auto'),
                              minWidth: columnWidths[column.id] ? `${columnWidths[column.id]}px` : (column.minWidth ? `${column.minWidth}px` : (typeof column.width === 'number' ? `${column.width}px` : undefined)),
                              maxWidth: columnWidths[column.id] ? `${columnWidths[column.id]}px` : (typeof column.width === 'number' ? `${column.width}px` : undefined),
                            }}
                            className={`border-b border-r border-slate-300 px-2 py-1 text-left align-middle ${bodyCellClassName || 'text-[12.5px]'} ${column.isSectionStart ? 'border-l-4 border-l-[#D0A45D]' : ''} ${column.cellClassName || ''}`}
                          >
                            <div className={column.cellContentClassName !== undefined ? column.cellContentClassName : (cellContentClassName !== undefined ? cellContentClassName : "overflow-hidden whitespace-nowrap text-ellipsis")}>
                              {formatCellValue(column, row, mapIdx)}
                            </div>
                          </td>
                        ))}
                        {showActions && (
                          <td
                            className="px-1.5 py-1 whitespace-nowrap text-xs text-right border-b border-r border-slate-600"
                            style={Object.keys(columnWidths).length > 0 ? { width: '150px' } : {}}
                            onClick={e => e.stopPropagation()}
                          >
                            {renderRowActions(row)}
                          </td>
                        )}
                      </tr>
                    );

                    if (details) {
                      return (
                        <React.Fragment key={row.id || index}>
                          {rowContent}
                          {details}
                        </React.Fragment>
                      );
                    }

                    return rowContent;
                  })}
                  {virtualScroll && paddingBottom > 0 && (
                    <tr>
                      <td colSpan={enhancedColumns.length + (showActions ? 1 : 0)} style={{ height: `${paddingBottom}px`, padding: 0, border: 0 }}></td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={enhancedColumns.length + (showActions ? 1 : 0)}
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                      <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                        <Search className="h-8 w-8" />
                      </div>
                      <p className="text-base font-semibold text-slate-700">
                        {emptyMessage || (hasActiveFilters ? 'No records match the current filters' : 'No records available yet')}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
                        >
                          Clear filters to view everything
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {summaryRows.length > 0 && summaryRows.map((row, index) => {
                const isGrand = row[Object.keys(row)[0]] === "GRAND TOTAL" || row[Object.keys(row)[0]] === grandTotalLabel;
                const labelValue = row[Object.keys(row)[0]];

                return (
                  <tr
                    key={`summary-${index}`}
                    className={`font-bold ${isGrand ? 'bg-[#EAF1F7]' : 'bg-slate-100'}`}
                  >
                    {enhancedColumns.map((column, colIdx) => {
                      const value = row[column.accessorKey];
                      const isTotalColumn = totalColumnKeys && totalColumnKeys.includes(column.accessorKey);

                      const firstTotalColumnIndex = totalColumnKeys && totalColumnKeys.length > 0
                        ? enhancedColumns.findIndex(col => totalColumnKeys.includes(col.accessorKey))
                        : -1;

                      const shouldShowLabel = firstTotalColumnIndex > 0 ? colIdx === firstTotalColumnIndex - 1 : colIdx === 0;

                      let displayValue = isTotalColumn ? value : "";
                      const numVal = typeof value === 'number' ? value : (value != null && value !== '' ? Number(value) : NaN);

                      if (isTotalColumn && !isNaN(numVal)) {
                        if (typeof title === 'string' && title.toLowerCase().includes('salary')) {
                          const isOtHoursColumn = column.accessorKey === 'otHoursWorked';
                          if (isOtHoursColumn) {
                            displayValue = numVal.toFixed(2);
                          } else {
                            displayValue = Math.round(numVal).toLocaleString('en-IN');
                          }
                        } else if (typeof title === 'string' && title.toLowerCase().includes('ledger')) {
                          displayValue = numVal.toFixed(3);
                        } else {
                          displayValue = numVal % 1 === 0
                            ? numVal.toLocaleString('en-IN')
                            : numVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
                        }
                      }

                      return (
                        <td
                          key={colIdx}
                          className={`border-b border-r border-slate-400 px-3 py-2 text-[15px] font-bold text-slate-900 ${
                            isTotalColumn ? 'text-right' : 'text-left'
                          }`}
                        >
                          {shouldShowLabel ? labelValue : (isTotalColumn ? displayValue : "")}
                        </td>
                      );
                    })}
                    {showActions && <td className="border-b border-r border-slate-400 px-2 py-1 text-[13px] font-bold text-black"></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {isShowPagination && <div className="no-print border-t border-slate-100 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span>
              Showing <span className="font-semibold text-slate-900">{displayStart}</span> to{' '}
              <span className="font-semibold text-slate-900">{displayEnd}</span> of{' '}
              <span className="font-semibold text-slate-900">{displayTotal}</span>
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeSelect(Number(e.target.value))}
              className="rounded-md border border-[#D8E1EA] px-3 py-1.5 text-sm font-medium text-[#102F50] focus:border-[#008F8C] focus:outline-none focus:ring-2 focus:ring-[#008F8C]/15"
            >
              {effectivePageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
          {!propOnPageChange && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(firstPage === 0 ? 0 : 1)}
                disabled={safeCurrentPage <= 1}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage <= 1}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Prev</span>
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (safeCurrentPage <= 3) {
                    pageNum = i + 1;
                  } else if (safeCurrentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = safeCurrentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[2.5rem] rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        safeCurrentPage === pageNum
                          ? 'bg-primary text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-[var(--primary-50)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <div className="sm:hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                {safeCurrentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage >= totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                title="Next Page"
              >
                <span className="text-sm font-medium">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}

export default DataTable;