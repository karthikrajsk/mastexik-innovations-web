import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import {
  getAllAgencyContracts,
  deleteAgencyContract,
  updateAgencyContractStatus
} from '@/state/agencyContractSlice';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Printer, Building2, BadgePercent, AlertTriangle, FileText } from 'lucide-react';
import { AgencyContract } from '@/types/agency';
import { IndentPrintModal } from '@/components/agency/IndentPrintModal';
import { toast } from 'react-toastify';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
import { DocumentAttachmentModal } from '@/components/modals/DocumentAttachmentModal';
import { useFileCounts } from '@/hooks/useFileCounts';

const formatCompactQuantity = (value: number) => {
  const quantity = Number(value) || 0;
  if (quantity === 0) return '0';
  if (Math.abs(quantity) < 1000) return quantity.toLocaleString('en-IN');

  const thousands = quantity / 1000;
  return `${Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
};

const formatCompactCommission = (value: number) => {
  const amount = Number(value) || 0;
  const absoluteAmount = Math.abs(amount);
  if (amount === 0) return '₹0';
  if (absoluteAmount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (absoluteAmount >= 1000) return `₹${(amount / 1000).toFixed(2)}k`;
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const AgencyContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const companyId = useResolvedCompanyId();

  const { contracts, loading } = useSelector((state: RootState) => state.agencyContract);
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'completed'>('open');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved'>('pending');

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<AgencyContract | null>(null);
  const [selectedContractForPrint, setSelectedContractForPrint] = useState<AgencyContract | null>(null);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState('');

  const loadContracts = useCallback(() => {
    dispatch(getAllAgencyContracts({ fetchAll: true, companyId }));
  }, [dispatch, companyId]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const contractAttachmentContainers = useMemo(
    () => (contracts || []).map((contract: AgencyContract) => `agency_contract_${contract.id}`),
    [contracts]
  );
  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(contractAttachmentContainers);

  const handleApprovalChange = (status: 'pending' | 'approved') => {
    setApprovalStatus(status);
  };

  // Filter by fulfillment and approval status.
  const tabContracts = useMemo(() => {
    return (contracts || []).filter((contract: any) => {
      const isApproved = contract.isApproved === 1 || contract.isApproved === true;
      const matchesApproval = approvalStatus === 'approved' ? isApproved : !isApproved;
      const matchesFulfillment = activeSubTab === 'open'
        ? contract.status !== 'COMPLETED'
        : contract.status === 'COMPLETED';
      return matchesApproval && matchesFulfillment;
    });
  }, [contracts, activeSubTab, approvalStatus]);

  // Summary KPIs
  const summary = useMemo(() => {
    const list: any[] = contracts || [];
    const totalOrdered = list.reduce((acc, c) => acc + (Number(c.orderedQty) || 0), 0);
    const totalSupplied = list.reduce((acc, c) => acc + (Number(c.suppliedQty) || 0), 0);
    const totalBalance = list.reduce((acc, c) => acc + (Number(c.balanceQty) || 0), 0);
    const estCommission = list.reduce(
      (acc, c) => acc + (Number(c.orderedQty) || 0) * (Number(c.numericRate) || 0) * (Number(c.commissionRate) || 0.01),
      0
    );
    const openCount = list.filter(c => c.status !== 'COMPLETED').length;
    const completedCount = list.filter(c => c.status === 'COMPLETED').length;

    return {
      totalContracts: list.length,
      totalOrdered,
      totalSupplied,
      totalBalance,
      estCommission,
      openCount,
      completedCount
    };
  }, [contracts]);

  // Handlers matching other ERP screens
  const handleAdd = () => {
    navigate('/agency/contract-entry');
  };

  const handleEdit = (contract: AgencyContract) => {
    navigate('/agency/contract-entry', { state: { contract, isEdit: true } });
  };

  const handleDelete = (contract: AgencyContract) => {
    setContractToDelete(contract);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (contractToDelete) {
      await dispatch(deleteAgencyContract(Number(contractToDelete.id)));
      loadContracts();
    }
    setIsDeleteModalOpen(false);
    setContractToDelete(null);
  };

  const handleView = (contract: AgencyContract) => {
    setSelectedContractForPrint(contract);
  };

  const handleToggleStatus = useCallback(async (contract: AgencyContract) => {
    const newStatus = contract.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
    await dispatch(updateAgencyContractStatus({ id: Number(contract.id), status: newStatus }));
    loadContracts();
  }, [dispatch, loadContracts]);

  const handleOpenAttachmentModal = useCallback((contract: AgencyContract) => {
    setSelectedAttachmentContainer(`agency_contract_${contract.id}`);
    setAttachmentModalTitle(`Agency Contract ${contract.contractNo} Files`);
  }, []);

  // DataTable Columns configuration
  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'sNo',
        width: 50,
        Cell: ({ row }: any) => <span className="font-mono text-2xs">{row.index + 1}</span>
      },
      {
        Header: 'Contract No',
        accessor: 'contractNo',
        Cell: ({ value }: { value: string }) => (
          <span className="font-mono font-bold text-blue-900 whitespace-nowrap">{value}</span>
        )
      },
      {
        Header: 'Contract Date',
        accessor: 'contractDate',
        Cell: ({ value }: { value: string }) => (
          <span className="font-mono text-2xs whitespace-nowrap">{value}</span>
        )
      },
      {
        Header: 'Seller (Mill)',
        accessor: 'seller',
        Cell: ({ value }: { value: string }) => (
          <span className="font-semibold text-slate-900 whitespace-nowrap">{value}</span>
        )
      },
      {
        Header: 'Buyer Name',
        accessor: 'buyerName',
        Cell: ({ value }: { value: string }) => (
          <span className="font-bold text-slate-950 whitespace-nowrap">{value}</span>
        )
      },
      {
        Header: 'Construction / Quality',
        accessor: 'construction',
        Cell: ({ value }: { value: string }) => (
          <span className="text-2xs text-slate-700 font-medium max-w-xs truncate block" title={value}>
            {value}
          </span>
        )
      },
      {
        Header: 'Ordered Qty',
        accessor: 'orderedQty',
        Cell: ({ value }: { value: number }) => (
          <span className="font-mono font-bold text-slate-900">{value?.toLocaleString() || '-'}</span>
        )
      },
      {
        Header: 'Supplied Qty',
        accessor: 'suppliedQty',
        Cell: ({ value }: { value: number }) => (
          <span className="font-mono font-semibold text-emerald-700">{value?.toLocaleString() || '0'}</span>
        )
      },
      {
        Header: 'Balance Qty',
        accessor: 'balanceQty',
        Cell: ({ value }: { value: number }) => {
          const isExceeded = value < 0;
          return (
            <span
              className={`font-mono font-bold ${
                isExceeded ? 'text-purple-700' : value === 0 ? 'text-slate-400' : 'text-amber-800'
              }`}
            >
              {value?.toLocaleString() || '0'}
            </span>
          );
        }
      },
      {
        Header: 'Rate / Mtr',
        accessor: 'ratePerMtr',
        Cell: ({ value }: { value: string }) => (
          <span className="font-mono font-bold text-blue-900 whitespace-nowrap">₹{value}</span>
        )
      },
      {
        Header: 'C.D Rate',
        accessor: 'cdRate',
        Cell: ({ value }: { value: string }) => (
          <span className="font-mono text-slate-600 whitespace-nowrap">{value ? `₹${value}` : '-'}</span>
        )
      },
      {
        Header: 'Payment Terms',
        accessor: 'paymentTerms',
        Cell: ({ value }: { value: string }) => (
          <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-3xs font-mono font-semibold whitespace-nowrap">
            {value}
          </span>
        )
      },
      {
        Header: 'Buyer PO No',
        accessor: 'poNo',
        Cell: ({ value }: { value: string }) => (
          <span className="font-mono text-2xs text-slate-600 whitespace-nowrap">{value || '-'}</span>
        )
      },
      {
        Header: 'LC Status',
        accessor: 'lcOpen',
        Cell: ({ value }: { value: string }) => (
          <span
            className={`px-1.5 py-0.5 rounded text-3xs font-bold whitespace-nowrap ${
              value === 'OPENED'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : value === 'PENDING'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-slate-400'
            }`}
          >
            {value}
          </span>
        )
      },
      {
        Header: 'Comm. %',
        accessor: 'commissionRate',
        Cell: ({ value }: { value: number }) => (
          <span className="font-mono font-bold text-slate-800 whitespace-nowrap">{(value * 100).toFixed(1)}%</span>
        )
      },
      {
        Header: 'Dispatch Schedule',
        accessor: 'despatchSchedule',
        Cell: ({ value }: { value: string }) => (
          <span className="text-3xs text-slate-600 max-w-xs truncate block" title={value}>
            {value || '-'}
          </span>
        )
      },
      {
        Header: 'Files',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const contract = props.row.original as AgencyContract;
          const containerName = `agency_contract_${contract.id}`;
          const count = fileCounts[containerName] || 0;
          return (
            <button
              type="button"
              onClick={() => handleOpenAttachmentModal(contract)}
              className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer whitespace-nowrap"
            >
              {count > 0 ? `View Files (${count})` : 'Upload'}
            </button>
          );
        }
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: (props: any) => {
          const contract = props.row.original as AgencyContract;
          const isComplete = contract.status === 'COMPLETED';
          return (
            <button
              onClick={() => handleToggleStatus(contract)}
              className="text-blue-600 underline hover:text-blue-800 text-2xs font-semibold cursor-pointer whitespace-nowrap"
            >
              {isComplete ? 'Re-open' : 'Complete'}
            </button>
          );
        }
      },
      {
        Header: 'Indent Sheet',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const contract = props.row.original as AgencyContract;
          return (
            <button
              onClick={() => setSelectedContractForPrint(contract)}
              className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-3xs font-bold border border-slate-300 transition cursor-pointer whitespace-nowrap"
              title="Print 3-Way Indent Confirmation Sheet"
            >
              <Printer className="w-3 h-3 text-slate-500" />
              <span>Print Sheet</span>
            </button>
          );
        }
      }
    ],
    [fileCounts, handleOpenAttachmentModal, handleToggleStatus]
  );

  return (
    <div className="p-4 space-y-4 font-sans">
      
      {/* Header Banner */}
     

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider block">Total Deals</span>
          <div className="text-base font-extrabold text-slate-900 mt-1 font-mono">
            {summary.totalContracts} <span className="text-2xs font-normal text-slate-500">Booked</span>
          </div>
          <span className="text-3xs text-blue-600 font-medium">100% Client Records</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs font-bold text-slate-500 uppercase tracking-wider block">Ordered Qty</span>
          <div className="text-base font-extrabold text-blue-900 mt-1 font-mono">
            {formatCompactQuantity(summary.totalOrdered)} <span className="text-2xs font-normal text-slate-500">Mtrs</span>
          </div>
          <span className="text-3xs text-slate-400 font-mono">{summary.totalOrdered.toLocaleString()}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs font-bold text-emerald-700 uppercase tracking-wider block">Supplied Qty</span>
          <div className="text-base font-extrabold text-emerald-900 mt-1 font-mono">
            {formatCompactQuantity(summary.totalSupplied)} <span className="text-2xs font-normal text-slate-500">Mtrs</span>
          </div>
          <span className="text-3xs text-emerald-600 font-semibold">
            {summary.totalOrdered > 0 ? ((summary.totalSupplied / summary.totalOrdered) * 100).toFixed(1) : 0}% Shipped
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs font-bold text-amber-700 uppercase tracking-wider block">Balance Qty</span>
          <div className="text-base font-extrabold text-amber-900 mt-1 font-mono">
            {formatCompactQuantity(summary.totalBalance)} <span className="text-2xs font-normal text-slate-500">Mtrs</span>
          </div>
          <span className="text-3xs text-amber-600 font-semibold">Pending Delivery</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-3xs font-bold text-purple-700 uppercase tracking-wider block">Open Indents</span>
          <div className="text-base font-extrabold text-purple-900 mt-1 font-mono">
            {summary.openCount} <span className="text-2xs font-normal text-slate-500">Active</span>
          </div>
          <span className="text-3xs text-purple-600 font-medium">{summary.completedCount} Completed</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs bg-gradient-to-br from-white to-amber-50">
          <span className="text-3xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1">
            <BadgePercent className="w-3 h-3 text-amber-600" />
            <span>Est. Commission</span>
          </span>
          <div className="text-base font-extrabold text-slate-900 mt-1 font-mono">
            {formatCompactCommission(summary.estCommission)}
          </div>
          <span className="text-3xs text-slate-500">1% / 0.5% on Basic</span>
        </div>
      </div>

      {/* Sub-Tabs: Open vs Completed (Matching ERP Transaction Standard) */}
      <div className="flex gap-4 border-b border-slate-200 bg-white px-4 pt-2 rounded-t-xl">
        <button
          onClick={() => setActiveSubTab('open')}
          className={`pb-2.5 px-4 font-bold text-xs transition-colors duration-200 cursor-pointer ${
            activeSubTab === 'open'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          Open Contracts ({summary.openCount})
        </button>
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`pb-2.5 px-4 font-bold text-xs transition-colors duration-200 cursor-pointer ${
            activeSubTab === 'completed'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-blue-600'
          }`}
        >
          Completed ({summary.completedCount})
        </button>
      </div>

      {/* Standard ERP DataTable Component */}
      <div className="bg-white rounded-b-xl border p-2 border-slate-200 shadow-2xs overflow-hidden">
        <DataTable
          title=""
          columns={columns}
          data={tabContracts}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onPending={() => handleApprovalChange('pending')}
          onApproved={() => handleApprovalChange('approved')}
          activeTab={approvalStatus}
          showActions={true}
          filterPlaceholder="Search Agency Contracts, Mills, Buyers..."
        />
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && contractToDelete && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Delete Agency Contract"
          size="md"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-start space-x-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Are you sure you want to delete Contract #{contractToDelete.contractNo}?
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  This deal with <strong>{contractToDelete.buyerName}</strong> ({contractToDelete.orderedQty.toLocaleString()} Mtrs) will be removed from the order status register.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Indent Print Preview Modal */}
      {selectedContractForPrint && (
        <IndentPrintModal
          contract={selectedContractForPrint}
          onClose={() => setSelectedContractForPrint(null)}
        />
      )}

      {selectedAttachmentContainer && (
        <DocumentAttachmentModal
          isOpen
          containerName={selectedAttachmentContainer}
          title={attachmentModalTitle}
          onClose={() => setSelectedAttachmentContainer(null)}
          onFilesUpdated={(newCount) => {
            if (selectedAttachmentContainer) {
              updateFileCount(selectedAttachmentContainer, newCount);
            }
          }}
        />
      )}

    </div>
  );
};

export default AgencyContractsPage;
