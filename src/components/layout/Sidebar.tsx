import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn, toReportSlug } from '@lib/utils';
import { ThemeSelector } from '@components/ui/ThemeSelector';
import {
  ChevronDown,
  LayoutDashboard,
  FileText,
  Settings,
  X,
  BadgeIndianRupee,
  BadgePercent,
  Users,
  Bell,
  LogOut,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllReports, ReportConfig } from '@/state/reportConfigSlice';
import { useAuth } from '@/contexts/AuthContext';
import { selectMenus, selectIsAdmin } from '@/state/permissionSlice';
import { getIconByName } from '@/utils/iconHelper';
import { getAllCompanies } from '@/state/company-master-slice';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  resetNotifications,
  deleteNotification,
} from '@/state/notificationSlice';
import { useNotificationWebSocket } from '@/hooks/useNotificationWebSocket';

interface SidebarItemProps {
  to?: string;
  icon?: React.ReactNode;
  label: string;
  children?: React.ReactNode;
  collapsed: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onExpandSidebar?: () => void;
}

function SidebarItem({
  to,
  icon,
  label,
  children,
  collapsed,
  isOpen,
  onToggle,
  onExpandSidebar,
}: SidebarItemProps) {
  const location = useLocation();

  const isActive = useMemo(() => {
    if (!to) return false;
    const normalizedPath = location.pathname.replace(/\/+$/, '');
    const normalizedTo = to.replace(/\/+$/, '');

    if (children) {
      return normalizedPath === normalizedTo || normalizedPath.startsWith(`${normalizedTo}/`);
    }
    return normalizedPath === normalizedTo;
  }, [location.pathname, to, children]);

  const handleClick = () => {
    if (collapsed && onExpandSidebar) {
      onExpandSidebar();
    }
    onToggle?.();
  };

  if (children) {
    return (
      <div className="mb-1 relative group">
        <button
          onClick={handleClick}
          className={cn(
            'w-full flex items-center px-2.5 py-2 transition-all duration-200 text-[12px]',
            !isActive && 'rounded-md hover:bg-white/10',
            isActive && !collapsed && 'sidebar-active-arrow text-white font-semibold',
            isActive && collapsed && 'bg-primary text-white font-medium rounded-md',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <div className="flex items-center">
            {icon && (
              <span
                className={cn(
                  'sidebar-icon transition-transform',
                  !collapsed && 'mr-3',
                )}
              >
                {icon}
              </span>
            )}
            {!collapsed && <span className="font-medium">{label}</span>}
          </div>
          {!collapsed && (
            <ChevronDown
              size={16}
              className={cn(
                'transition-transform duration-200',
                isOpen ? 'rotate-180' : 'rotate-0',
              )}
            />
          )}
        </button>

        {collapsed && (
          <div className="absolute left-full top-0 ml-2 pl-1 hidden group-hover:block z-50">
            <div className="bg-surface py-1 px-3 rounded-md shadow-lg border border-border whitespace-nowrap">
              {label}
            </div>
          </div>
        )}

        <div
          className={cn(
            'grid overflow-hidden transition-[grid-template-rows,opacity] duration-200',
            isOpen && !collapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 ml-1 mt-1 space-y-1 border-border pl-2 text-sm">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <NavLink
        to={to || '#'}
        onClick={() => {
          if (collapsed && onExpandSidebar) {
            onExpandSidebar();
          }
        }}
        className={({ isActive }) =>
          cn(
            'flex items-center px-2.5 py-2 transition-all duration-200 text-[12px]',
            !isActive && 'rounded-md hover:bg-white/10',
            isActive && !collapsed && 'sidebar-active-arrow text-white font-semibold',
            isActive && collapsed && 'bg-primary text-white font-medium rounded-md',
            collapsed ? 'justify-center' : '',
          )
        }
      >
        {icon && (
          <span
            className={cn(
              'sidebar-icon transition-transform',
              !collapsed && 'mr-3',
            )}
          >
            {icon}
          </span>
        )}
        {!collapsed && <span className="font-medium">{label}</span>}
      </NavLink>

      {collapsed && (
        <div className="absolute left-full top-0 ml-2 pl-1 hidden group-hover:block z-50">
          <div className="bg-surface py-1 px-3 rounded-md shadow-lg border border-border whitespace-nowrap">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const getActiveSubmenu = (path: string) => {
  const normalizedPath = path.replace(/\/+$/, '') + '/';
  if (normalizedPath.startsWith('/masters/')) return 'Masters';
  if (normalizedPath.startsWith('/transaction/')) return 'Transaction';
  if (normalizedPath.startsWith('/agency/')) return 'Agency';
  if (normalizedPath.startsWith('/settings/')) return 'Settings';
  if (normalizedPath.startsWith('/reports/')) return 'Reports';
  return '';
};

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = false;
  const [openSubmenus, setOpenSubmenus] = useState<string[]>(() => {
    const initial = getActiveSubmenu(location.pathname);
    return initial ? [initial] : [];
  });

  const dispatch = useDispatch<AppDispatch>();
  const { reportList, fetched, loading, lastFetchedCompanyId } = useSelector((state: RootState) => state.reportConfig);
  const { logout, user, selectedCompany } = useAuth();
  const userMenus = useSelector(selectMenus);
  const isAdmin = useSelector(selectIsAdmin);

  // User Profile & Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const notificationRef = useRef<HTMLDivElement>(null);

  const { companyMasterList: companies, loading: companyLoading } = useSelector(
    (state: RootState) => state.companyMaster
  );
  const { notifications, unreadCount, loading: notifLoading, hasMore, page } = useSelector(
    (state: RootState) => state.notifications
  );

  useNotificationWebSocket(selectedCompanyId || null);

  useEffect(() => {
    const storedPayload = localStorage.getItem('authPayload');
    if (storedPayload) {
      try {
        const parsedPayload = JSON.parse(storedPayload);
        const u = parsedPayload.user;
        if (u && u.userName) {
          setUsername(String(u.userName));
        } else {
          setUsername('Unknown User');
        }
        const storedId = localStorage.getItem('selectedCompanyId');
        if (storedId) {
          setSelectedCompanyId(storedId);
        }
      } catch {
        setUsername('Error Loading User');
      }
    } else {
      setUsername('Not Logged In');
    }
  }, [user]);

  useEffect(() => {
    if (selectedCompanyId && companies.length === 0 && !companyLoading) {
      dispatch(getAllCompanies({ fetchAll: true }));
    }
  }, [selectedCompanyId, companies.length, companyLoading, dispatch]);

  useEffect(() => {
    if (selectedCompanyId && companies.length > 0 && !companyLoading) {
      const matchingCompany = companies.find(
        (company: any) => String(company.id ?? company.companyId) === selectedCompanyId
      );
      if (matchingCompany) {
        setCompanyName(
          String(matchingCompany.companyName ?? matchingCompany.name ?? matchingCompany.company_name ?? 'Unknown Company')
        );
      } else if (!companyLoading && companies.length > 0) {
        setCompanyName('No Company Found');
      }
    }
  }, [selectedCompanyId, companies, companyLoading]);

  useEffect(() => {
    if (selectedCompanyId && showNotifications) {
      dispatch(resetNotifications());
      dispatch(fetchNotifications({ companyId: selectedCompanyId, page: 0 }));
    }
  }, [showNotifications, selectedCompanyId, dispatch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const computedCompanyName = useMemo(() => {
    if (!selectedCompanyId || companyLoading || companies.length === 0) return 'Loading...';
    const matchingCompany = companies.find(
      (company: any) => String(company.id ?? company.companyId) === selectedCompanyId
    );
    return matchingCompany
      ? String(matchingCompany.companyName ?? matchingCompany.name ?? matchingCompany.company_name ?? 'Unknown Company')
      : 'No Company Selected';
  }, [selectedCompanyId, companies, companyLoading]);

  const handleLogout = () => {
    try {
      logout();
      localStorage.setItem('isAuthenticated', 'false');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authPayload');
      localStorage.removeItem('selectedCompanyId');
      setShowLogoutDialog(false);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMarkAsRead = useCallback((id: number) => {
    if (selectedCompanyId) {
      dispatch(markAsRead({ id, companyId: selectedCompanyId }));
    }
  }, [dispatch, selectedCompanyId]);

  const handleMarkAllAsRead = useCallback(() => {
    if (selectedCompanyId) {
      dispatch(markAllAsRead(selectedCompanyId));
    }
  }, [dispatch, selectedCompanyId]);

  const handleLoadMore = useCallback(() => {
    if (selectedCompanyId && !notifLoading && hasMore) {
      dispatch(fetchNotifications({ companyId: selectedCompanyId, page: page + 1 }));
    }
  }, [dispatch, selectedCompanyId, notifLoading, hasMore, page]);

  const handleDelete = useCallback((id: number) => {
    if (selectedCompanyId) {
      dispatch(deleteNotification({ id, companyId: selectedCompanyId }));
    }
  }, [dispatch, selectedCompanyId]);

  const handleView = useCallback((screenPath: string | null, id: number, referenceId: number | null) => {
    handleMarkAsRead(id);
    if (screenPath) {
      navigate(screenPath, { state: { highlightId: referenceId } });
      setShowNotifications(false);
    }
  }, [handleMarkAsRead, navigate]);

  function getScreenName(eventType: string | null | undefined): string {
    switch (eventType) {
      case 'WEAVING_JOBWORK': return 'Weaving Job Work';
      case 'WEFT_INWARD': return 'Weft Inward';
      case 'SIZING_JOBWORK': return 'Sizing Job Work';
      case 'SIZING_YARN_INWARD': return 'Sizing Yarn Inward';
      case 'PURCHASE_INWARD_BALANCE_ZERO': return 'Purchase Order';
      case 'SIZING_PLAN_BALANCE_ZERO': return 'Sizing Plan';
      case 'WEAVING_CONTRACT_BALANCE_ZERO': return 'Weaving Contract';
      default: return 'System';
    }
  }

  function formatTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  useEffect(() => {
    const shouldFetch = !fetched || (selectedCompany !== null && selectedCompany !== lastFetchedCompanyId);
    if (shouldFetch && !loading) {
      dispatch(getAllReports({ companyId: selectedCompany }));
    }
  }, [dispatch, fetched, loading, selectedCompany, lastFetchedCompanyId]);

  const reportMenuItems = (Array.isArray(reportList) ? reportList : []).map((report: ReportConfig) => {
    const rawName = report?.reportName ?? '';
    const trimmedName = rawName.trim();
    const fallbackName = report?.id != null ? `Report ${report.id}` : 'Report';
    const label = trimmedName !== '' ? trimmedName : fallbackName;
    const slug = toReportSlug(label, report?.id ?? label);
    return {
      label,
      path: `/reports/${slug}`,
    };
  });

  // Only update open submenus based on current active path, but don't auto-navigate
  useEffect(() => {
    // Check dynamic user menus
    if (userMenus && userMenus.length > 0) {
      const activeMenu = userMenus.find((menu: any) =>
        menu.subMenus.some((subMenu: any) => location.pathname.startsWith(subMenu.subMenuPath))
      );

      if (activeMenu) {
        setOpenSubmenus(prev => {
          if (!prev.includes(activeMenu.menuName)) {
            return [...prev, activeMenu.menuName];
          }
          return prev;
        });
        return;
      }
    }

    // Fallback for hardcoded menus
    const storeEntryPaths = [
      '/transaction/costing-list',
      '/transaction/sales-order-management',
      '/transaction/order-entry-management',
      '/transaction/purchase-order-details',
      '/transaction/purchase-inward-details',
      '/transaction/purchase-return-details',
      '/transaction/sales-return-management',
      '/transaction/yarn-return-details',
      '/transaction/item-outward',
      '/transaction/stock-transfers',
      '/transaction/opening-balance',
    ];

    const sizingPaths = [
      '/transaction/sizing-plan-details',
      '/transaction/sizing-jobwork-order-details',
      '/transaction/sizing-yarn-inward-details',
      '/transaction/sizing-yarn-outward-details',
      '/transaction/sizing-production',
      '/transaction/sizing-beam-outward',
      '/transaction/beam-management',
      '/transaction/flange-management',
      '/transaction/flange-inward-details',
      '/transaction/factory-beam-inward',
    ];

    const brushingPaths = [
      '/transaction/brushing-receive-details',
      '/transaction/brushing-unwind-rolls',
      '/transaction/brushing-rolling',
      '/transaction/brushing-ready-dispatch',
      '/transaction/brushing-return',
      '/transaction/brushing-reject',
      '/transaction/brushing-stock',
      '/transaction/brushing-stock-ledger',
    ];

    const isStoreEntry = storeEntryPaths.some(p => location.pathname.startsWith(p));
    const isSizing = sizingPaths.some(p => location.pathname.startsWith(p));
    const isBrushing = brushingPaths.some(p => location.pathname.startsWith(p));
    const isTransaction = location.pathname.startsWith('/transaction/');
    const isWeaving = isTransaction && !isStoreEntry && !isSizing && !isBrushing;

    setOpenSubmenus(prev => {
      const next = [...prev];
      if (isTransaction && !next.includes('Transaction')) {
        next.push('Transaction');
      }
      if (isStoreEntry && !next.includes('Store Entry')) {
        next.push('Store Entry');
      }
      if (isSizing && !next.includes('Sizing')) {
        next.push('Sizing');
      }
      if (isWeaving && !next.includes('Weaving')) {
        next.push('Weaving');
      }
      if (isBrushing && !next.includes('Brushing')) {
        next.push('Brushing');
      }

      // Handle HR vs Settings
      const isSettingsPath = location.pathname.startsWith('/settings/');
      const isHRPath = location.pathname.startsWith('/hr/');
      if (isSettingsPath || isHRPath) {
        const hrPaths = [
          '/settings/employee',
          '/settings/employee-relieved',
          '/settings/employee-growth',
          '/settings/attendance',
          '/settings/leave-requests',
          '/settings/salary-report',
          '/settings/salary-report-view',
          '/settings/salary-advance',
          '/hr/attendance-incentive',
          '/hr/canteen-deduction',
          '/hr/employee-property-assignment',
          '/hr/property-assignment',
          '/settings/attendance-incentive',
          '/settings/canteen-deduction',
          '/settings/employee-property-assignment',
          '/settings/property-assignment',
          '/employee-property-assignment',
          '/property-assignment',
        ];
        const isHR = isHRPath || hrPaths.some(p => location.pathname.startsWith(p));
        if (isHR) {
          if (!next.includes('HR')) next.push('HR');
        } else {
          if (!next.includes('Settings')) next.push('Settings');
        }
      }

      const isMasters = location.pathname.startsWith('/masters/');
      if (isMasters && !next.includes('Masters')) {
        next.push('Masters');
      }

      const isAgency = location.pathname.startsWith('/agency/');
      if (isAgency && !next.includes('Agency')) {
        next.push('Agency');
      }

      const isReports = location.pathname.startsWith('/reports/');
      if (isReports && !next.includes('Reports')) {
        next.push('Reports');
      }

      return Array.from(new Set(next));
    });
  }, [location.pathname, userMenus]);

  const expandSidebar = () => undefined;

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label);
      } else {
        return [...prev, label]; // Allow multiple submenus to be open
      }
    });
  };

  const handleNavClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link) {
      onMobileClose?.();
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 h-auto w-full rounded-none bg-[#082A59] text-white transition-transform duration-300 z-40 shadow-[0_14px_36px_rgba(6,30,65,0.24)] flex flex-col overflow-visible',
          'lg:inset-y-3 lg:left-3 lg:w-[216px] lg:rounded-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-[60px] items-center justify-between border-b border-white/10 px-2.5 shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D0A45D] font-serif text-sm font-bold text-[#082A59]">T</span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-serif text-[15px] font-semibold tracking-wide text-[#FFFDF8]">TextPro</p>
              <p className="truncate text-[9px] uppercase tracking-[0.13em] text-white/55">Textile ERP</p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-50">
            <ThemeSelector alignOutside={false} />
            <button
              onClick={onMobileClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav
          onClick={handleNavClick}
          className="sidebar-nav flex-1 space-y-1 overflow-y-auto p-2"
        >
          <SidebarItem
            to="/"
            icon={<LayoutDashboard />}
            label="Dashboard"
            collapsed={collapsed}
            onExpandSidebar={expandSidebar}
          />

          {userMenus && userMenus.length > 0 ? (
            userMenus.map((menu: any) => {
              const Icon = getIconByName(menu.menuIcon);
              return (
                <SidebarItem
                  key={menu.menuId}
                  to="#"
                  icon={<Icon />}
                  label={menu.menuName}
                  collapsed={collapsed}
                  isOpen={openSubmenus.includes(menu.menuName)}
                  onToggle={() => toggleSubmenu(menu.menuName)}
                  onExpandSidebar={expandSidebar}
                >
                  {menu.subMenus.map((subMenu: any) => (
                    <SidebarItem
                      key={subMenu.subMenuId}
                      to={subMenu.subMenuPath}
                      label={subMenu.subMenuName}
                      collapsed={collapsed}
                      onExpandSidebar={expandSidebar}
                    />
                  ))}
                </SidebarItem>
              );
            })
          ) : isAdmin ? (
            <>
              <SidebarItem
                to="/masters"
                icon={<FileText />}
                label="Masters"
                collapsed={collapsed}
                isOpen={openSubmenus.includes('Masters')}
                onToggle={() => toggleSubmenu('Masters')}
                onExpandSidebar={expandSidebar}
              >
                <SidebarItem
                  to="/masters/location-management"
                  label="Location Management"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/fabric-management"
                  label="Sort Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/currency-master"
                  label="Currency"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/shipment-mode-master"
                  label="Shipment Mode"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/shipment-terms-master"
                  label="Shipment Terms"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/terms-condition-master"
                  label="Terms Condition"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/payment-terms-master"
                  label="Payment Terms"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/category"
                  label="Categories"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/sub-category"
                  label="Sub Categories"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/fabric-type"
                  label="Fabric Type"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/fabric-category"
                  label="Fabric Category"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/finishFabric-master"
                  label="Finish Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/yarn-master"
                  label="Yarn Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/customer-management"
                  label="Buyer/Customers"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/vendor"
                  label="Supplier/Vendors"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                {/* <SidebarItem
                  to="/masters/mill"
                  label="Mill Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                /> */}

                <SidebarItem
                  to="/masters/consignee"
                  label="Consignee"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/uom-master"
                  label="Uom Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/gst-master"
                  label="GST Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/flange-master"
                  label="Flange Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/loom-master"
                  label="Loom Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/shift-master"
                  label="Shift Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/warehouse"
                  label="Warehouse"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/grade-master"
                  label="Grade Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/defect-master"
                  label="Defect Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/process-master"
                  label="Process Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/agent-master"
                  label="Agent Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/quality-master"
                  label="Quality Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/po-type-master"
                  label="Po Type Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/machine-master"
                  label="Machine Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/transport-master"
                  label="Transport Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/masters/item-master-detail"
                  label="Item Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
  <SidebarItem
                  to="/masters/holiday-master"
                  label="Holiday / Festival"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
              </SidebarItem>

              <SidebarItem
                to="/transaction"
                icon={<BadgeIndianRupee />}
                label="Transaction"
                collapsed={collapsed}
                isOpen={openSubmenus.includes('Transaction')}
                onToggle={() => toggleSubmenu('Transaction')}
                onExpandSidebar={expandSidebar}
              >
                <SidebarItem
                  to="/transaction/approval-management"
                  label="Approval"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />

                {/* Store Entry Subcategory */}
                <SidebarItem
                  to="#"
                  label="Store Entry"
                  collapsed={collapsed}
                  isOpen={openSubmenus.includes('Store Entry')}
                  onToggle={() => toggleSubmenu('Store Entry')}
                  onExpandSidebar={expandSidebar}
                >
                  <SidebarItem
                    to="/transaction/costing-list"
                    label="Costing List"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/sales-order-management"
                    label="Sales Order Management"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/order-entry-management"
                    label="Order Entry Management"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                    <SidebarItem
                    to="/transaction/purchase-indent-details"
                    label="Purchase Indent"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/purchase-order-details"
                    label="Purchase Order"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                
                  <SidebarItem
                    to="/transaction/purchase-inward-details"
                    label="Purchase Inward / GRN Details"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/purchase-return-details"
                    label="Purchase Return / GRN Return"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/sales-return-management"
                    label="Sales Beam/Jobwork Return"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/yarn-return-details"
                    label="Yarn Return Details"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                
                  <SidebarItem
                    to="/transaction/item-outward"
                    label="Material Issue"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/stock-transfers"
                    label="Stock Transfer"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                
                  <SidebarItem
                    to="/transaction/opening-balance"
                    label="Opening Balance"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                </SidebarItem>

                {/* Weaving Subcategory */}
                <SidebarItem
                  to="#"
                  label="Weaving"
                  collapsed={collapsed}
                  isOpen={openSubmenus.includes('Weaving')}
                  onToggle={() => toggleSubmenu('Weaving')}
                  onExpandSidebar={expandSidebar}
                >
                  <SidebarItem
                    to="/transaction/weaving-contract-details"
                    label="Weaving Contract"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                                   <SidebarItem
                    to="/transaction/weaving-jobwork-order-details"
                    label="Weaving Jobwork Order"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/old-fabric-stock-upload"
                    label="Upload Old Fabric Stock"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/beam-opening-stock"
                    label="Beam Opening Stock"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                
                  {/* <SidebarItem
                    to="/transaction/weaving-production"
                    label="Weaving Production"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  /> */}
                  <SidebarItem
                    to="/transaction/sizing-plan-details"
                    label="Sizing Plan"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                   

                  <SidebarItem
                    to="/transaction/beam-management"
                    label="Beam Inward/Outward"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/factory-beam-inward"
                    label="Factory Beam Inward"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                   
                  <SidebarItem
                    to="/transaction/beam-gaiting-details"
                    label="Beam Gaiting/Knotting"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />

                   <SidebarItem
                    to="/transaction/weaving-yarn-issue"
                    label="Weft Yarn Issue"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                     <SidebarItem
                    to="/reports/weaving-production-report"
                    label="Weaving Production Report"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                 

                 
                  <SidebarItem
                    to="/transaction/doffing-entry"
                    label="Doffing Entry"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                    <SidebarItem
                    to="/transaction/beam-cut-details"
                    label="Beam Cut"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                   <SidebarItem
                    to="/transaction/trading-fabric-inspection-management"
                    label="Fabric Inspection"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/piece-split-join-details"
                    label="Piece Split/Join"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                 
                 
                  {/* <SidebarItem
                    to="/transaction/jobwork-fabric-receive-details"
                    label="Jobwork Fabric Receive"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  /> */}
                 
                  <SidebarItem
                    to="/transaction/bale-roll-packing-details"
                    label="Bale/Roll Packing"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/packing-list-mamagement"
                    label="Packing List Management"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  {/* <SidebarItem
                    to="/transaction/scan-dispatch"
                    label="Scan & Dispatch"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  /> */}
                  <SidebarItem
                    to="/transaction/invoice-management"
                    label="Generate Invoice"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  {/* <SidebarItem
                    to="/transaction/process-contract-managemant"
                    label="Process Contract Management"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/processing-issue-management"
                    label="Processing Issue Management"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/processing-receive-management"
                    label="Processing Receive Management"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  /> */}
                   <SidebarItem
                    to="/transaction/beam-card"
                    label="Beam Card"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/yarn-sales-order-list"
                    label="Yarn Sales"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/yarn-challan-management"
                    label="Yarn Challan"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                
                  {/* <SidebarItem
                    to="/transaction/warping-production"
                    label="Warping Production"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  /> */}
  <SidebarItem
                    to="/transaction/weaving-yarn-outward-details"
                    label="Weaving Yarn Outward"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                   <SidebarItem
                    to="/transaction/weft-inward-details"
                    label="Weft Inward"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                 
                </SidebarItem>

                {/* Brushing Subcategory */}
                <SidebarItem
                  to="#"
                  label="Brushing"
                  collapsed={collapsed}
                  isOpen={openSubmenus.includes('Brushing')}
                  onToggle={() => toggleSubmenu('Brushing')}
                  onExpandSidebar={expandSidebar}
                >
                  <SidebarItem
                    to="/transaction/brushing-receive-details"
                    label="Brushing Fabric Receive"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  
                  <SidebarItem
                    to="/transaction/brushing-unwind-rolls"
                    label="Unwinding Rolls"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/brushing-rolling"
                    label="Rolling"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/brushing-ready-dispatch"
                    label="Ready For Dispatch"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                    <SidebarItem
                    to="/transaction/brushing-return"
                    label="Brushing Return"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/brushing-reject"
                    label="Brushing Reject"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  {/* <SidebarItem
                    to="/transaction/brushing-stock"
                    label="Opening Dispatched Rolls"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  /> */}
                  <SidebarItem
                    to="/transaction/brushing-stock-ledger"
                    label="Brushing Stock Ledger"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  <SidebarItem
                    to="/transaction/brushing-unit-fabric-status"
                    label="Brushing Unit Fabric Status"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                  
                </SidebarItem>


                {/* Sizing Subcategory */}
                <SidebarItem
                to="#"
                // icon={<Users />}
                label="HR"
                collapsed={collapsed}
                isOpen={openSubmenus.includes('HR')}
                onToggle={() => toggleSubmenu('HR')}
                onExpandSidebar={expandSidebar}
              >
                
                <SidebarItem
                  to="/settings/employee"
                  label="Employee"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/employee-relieved"
                  label="Employee Relieved"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/employee-growth"
                  label="Employee Growth"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/attendance"
                  label="Attendance"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/leave-requests"
                  label="Leave Requests"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/salary-report"
                  label="Salary Details"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/salary-report-view"
                  label="Salary Report"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/salary-advance"
                  label="Salary Advance/Loan"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/hr/attendance-incentive"
                  label="Attendance Incentive"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/hr/canteen-deduction"
                  label="Canteen Deduction"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/hr/employee-property-assignment"
                  label="Property Assignment"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
             
              </SidebarItem>
              </SidebarItem>

              <SidebarItem
                to="/reports"
                icon={<FileText />}
                label="Reports"
                collapsed={collapsed}
                isOpen={openSubmenus.includes('Reports')}
                onToggle={() => toggleSubmenu('Reports')}
                onExpandSidebar={expandSidebar}
              >
                <SidebarItem
                  to="/reports/generate-report"
                  label="Generate Report"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                {reportMenuItems.map((item) => (
                  <SidebarItem
                    key={item.path}
                    to={item.path}
                    label={item.label}
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
                ))}
              </SidebarItem>



              <SidebarItem
                to="/agency"
                icon={<BadgePercent />}
                label="Agency"
                collapsed={collapsed}
                isOpen={openSubmenus.includes('Agency')}
                onToggle={() => toggleSubmenu('Agency')}
                onExpandSidebar={expandSidebar}
              >
                <SidebarItem
                  to="/agency/order-status"
                  label="Agency Sales Contracts"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/agency/mill-dispatch"
                  label="Mill Dispatch Tracking"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/agency/payment-realization"
                  label="Payment Realization"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                {/* <SidebarItem
                  to="/agency/buyer-outstanding"
                  label="Buyer Outstanding"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                /> */}
                <SidebarItem
                  to="/agency/commission-statement"
                  label="Commission Statement"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
             
              </SidebarItem>

              <SidebarItem
                to="/settings"
                icon={<Settings />}
                label="Settings"
                collapsed={collapsed}
                isOpen={openSubmenus.includes('Settings')}
                onToggle={() => toggleSubmenu('Settings')}
                onExpandSidebar={expandSidebar}
              >
                <SidebarItem
                  to="/settings/application-user"
                  label="Application User"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/company"
                  label="Company"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/menu-master"
                  label="Menu Master"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/level1-menu"
                  label="Level 1 Menu"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/level2-menu"
                  label="Level 2 Menu"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                <SidebarItem
                  to="/settings/report-configuration-list"
                  label="Report Configuration"
                  collapsed={collapsed}
                  onExpandSidebar={expandSidebar}
                />
                
                  <SidebarItem
                    to="/settings/number-format-configuration-list"
                    label="Number Format Configuration"
                    collapsed={collapsed}
                    onExpandSidebar={expandSidebar}
                  />
              </SidebarItem>
            </>
          ) : null}
        </nav>

        {/* Bottom Section: Profile, Notifications & Logout */}
        <div className="relative mx-2 mb-2 shrink-0 rounded-xl border border-white/15 bg-white/[0.06] p-2" ref={notificationRef}>
          {/* Notification Popup Drawer */}
          {showNotifications && (
            <div className={cn(
              "absolute bottom-16 bg-white rounded-xl shadow-2xl border border-secondary-200 z-50 flex flex-col max-h-[80vh] sm:max-h-[480px]",
              collapsed ? "left-16 w-80 md:w-96" : "left-2 w-[calc(100%-1rem)] sm:w-80 md:w-96"
            )}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#008F8C]" />
                  <h3 className="font-semibold text-secondary-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-xs text-[#008F8C] hover:text-[#082A59] font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 && !notifLoading && (
                  <div className="flex flex-col items-center justify-center py-12 text-secondary-400">
                    <Bell className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No notifications</p>
                  </div>
                )}

                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 border-b border-secondary-50 hover:bg-secondary-50 transition-colors',
                      !n.isRead && 'bg-[#E9F3F8] hover:bg-[#DCEBF3]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#008F8C] uppercase tracking-wide truncate">
                          {getScreenName(n.eventType)}
                        </p>
                        <p className="text-sm text-secondary-800 mt-0.5 leading-snug">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-secondary-400 mt-1">
                          {formatTime(n.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#008F8C] mt-1" />
                        )}
                        {n.screenPath && (
                          <button
                            onClick={() => handleView(n.screenPath, n.id, n.referenceId)}
                            className="flex items-center gap-1 text-[11px] text-[#008F8C] hover:text-[#082A59] font-medium whitespace-nowrap"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="text-[11px] text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {notifLoading && (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-[#008F8C] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {hasMore && !notifLoading && notifications.length > 0 && (
                  <button
                    onClick={handleLoadMore}
                    className="w-full py-2.5 text-xs text-[#008F8C] hover:text-[#082A59] font-medium border-t border-secondary-100"
                  >
                    Load more
                  </button>
                )}
              </div>
            </div>
          )}

          {/* User Profile & Actions controls */}
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              {/* Profile info */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#0B376E] border border-[#D0A45D] flex items-center justify-center shrink-0">
                  <span className="text-white font-medium text-sm">
                    {username.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-semibold text-white truncate">{username}</p>
                  <p className="text-[10px] font-semibold text-[#D0A45D] uppercase tracking-tight truncate">
                    {companyName || computedCompanyName}
                  </p>
                </div>
              </div>

              {/* Action buttons: Bell & Logout */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 rounded-full hover:bg-white/10 relative text-white/80 hover:text-white transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-[#D0A45D] transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-full hover:bg-white/10 relative text-white/80 hover:text-white transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="w-8 h-8 rounded-full bg-[#0B376E] border border-[#D0A45D] flex items-center justify-center shrink-0" title={`${username} - ${companyName || computedCompanyName}`}>
                <span className="text-white font-medium text-xs">
                  {username.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>

              <button
                onClick={() => setShowLogoutDialog(true)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-[#D0A45D] transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
              <button onClick={() => setShowLogoutDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">Are you sure you want to log out?</p>
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-[#082A59] rounded-md hover:bg-[#0B376E]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}