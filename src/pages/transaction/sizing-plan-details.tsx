// sizing-plan-details.tsx
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { getAllConsignee } from "@/state/consigneeSlice";
import { deleteSizingPlan, getAllSizingPlan, updateSizingPlan } from "@/state/sizingPlanSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import React, { useCallback } from "react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useHighlightRow } from "@/hooks/useHighlightRow";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllEmptyBeamIssue } from "@/state/emptyBeamIssueSlice";
import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
import { TransactionStatusAPI } from "@/services/transaction-status-api";
import { toast } from "react-toastify";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";

// Date Range Filter Component

interface SizingPlan {
  id: number;
  serialNo?: number;
  sizingPlanDate?: string;
  sizingPlanNo: string;
  vendorId: number;
  consigneeId: number;
  termsConditionsId: number;
  paymentTermsId: number;
  sizingRate: number;
  emptyBeamNo: string | null;
  remarks: string;
  sizingQualityDetails: any[];
  sizingBeamDetails: any[];
}

const getSelectedCompanyId = (): number | undefined => {
  if (typeof window === "undefined" || !window.localStorage) {
    return undefined;
  }
  const stored = window.localStorage.getItem("selectedCompanyId") || window.localStorage.getItem("selectedCompany");
  if (!stored) {
    return undefined;
  }
  const direct = Number(stored);
  if (!Number.isNaN(direct)) {
    return direct;
  }
  try {
    const parsed = JSON.parse(stored);
    const fallback = Number(parsed?.id ?? parsed?.companyId);
    return Number.isNaN(fallback) ? undefined : fallback;
  } catch {
    return undefined;
  }
};

export function SizingPlanDetails() {
  const { sizingPlanList,paginationInfo } = useSelector((state: RootState) => state.sizingPlan)
  const { vendorList } = useSelector((state: RootState) => state.vendor)
  const { consigneeList } = useSelector((state: RootState) => state.consignee)
  const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions)
  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms)
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder)
  const { yarnList } = useSelector((state: RootState) => state.yarn)
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster)
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts)
  const { emptyBeamIssueList } = useSelector((state: RootState) => state.emptyBeamIssue)
  const [isModalOpen, setIsModalOpen] = useState(false);
   const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<'open' | 'completed'>('open');
    const [updatedPlans, setUpdatedPlans] = useState<Map<number, any>>(new Map());
    const [genericTransactionData, setGenericTransactionData] = useState<{
      transactionTypeId?: number;
      vendorId?: number;
      buyerId?: number;
      [key: string]: any;
    } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');
  const [currentSizingPlan, setCurrentSizingPlan] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const highlightRowId = useHighlightRow();
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  useEffect(() => {
    const companyId = getSelectedCompanyId();
    // const paginationParams = { offset: getOffset(), limit: itemsPerPage };
    const sizingPlanParams = companyId ? { companyId } : {};
    const companyParams = companyId ? { companyId, fetchAll: true } : { fetchAll: true };
    dispatch(getAllSizingPlan(sizingPlanParams as any));
    dispatch(getAllVendors(companyParams as any));
    dispatch(getAllConsignee({fetchAll: true} as any));
    dispatch(getAllYarnMasters({fetchAll: true} as any));
    dispatch(getAllFabricMasters({fetchAll: true} as any));
    dispatch(getAllWeavingContract({fetchAll: true} as any));
    dispatch(getAllSalesOrders({fetchAll: true} as any));
    dispatch(getAllPaymentTerms({fetchAll: true} as any));
    dispatch(getAllEmptyBeamIssue({fetchAll: true} as any));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  const processedCityList = useMemo(() => {
    // Display data in the order it comes from API (no sorting)
    return sizingPlanList.map((plan: any, index: number) => {
      const qualityDetails = Array.isArray(plan.sizingQualityDetails) ? plan.sizingQualityDetails : [];
      const firstQuality = plan.sizingQualityDetails?.[0];
      
      // Get yarn name from yarnList using yarnId
      const yarn = firstQuality?.yarnId ? yarnList.find((y: any) => y.id === firstQuality.yarnId) : null;
      const yarnName = yarn?.yarnName || '';
      
      // Get fabric quality as "fabricCode - quality"
      const fabricQuality = firstQuality ? `${firstQuality.fabricCode} - ${firstQuality.quality}` : '';
      
      // Get sort ends (note: backend has typo "sordEnds" instead of "sortEnds")
      
      const warpMetersValues = qualityDetails
        .map((detail: any) => detail?.warpMeters)
        .filter((m: any) => m != null && m !== '') || [];

      const sortEnds = firstQuality?.sordEnds || firstQuality?.sortEnds || '';
       const totalWarpMeters = warpMetersValues.length > 0
        ? warpMetersValues.length === 1
          ? warpMetersValues[0]
          : Math.round((warpMetersValues.reduce((sum: number, m: number) => sum + m, 0) / warpMetersValues.length) * 100) / 100
        : 0;
      const updatedInfo = updatedPlans.get(plan.id);
      const isCompleteVal = updatedInfo 
        ? (updatedInfo.isComplete === 1 || updatedInfo.isComplete === true)
        : (plan.isComplete === 1 || plan.isComplete === true || plan.order_status === 'Completed');
      const orderStatus = updatedInfo?.order_status || plan.order_status || (isCompleteVal ? 'Completed' : 'Pending');

      return {
        ...plan,
        serialNo: (paginationInfo?.offset ?? 0) + index + 1,
        yarnName,
        fabricQuality,
        warpMeters: totalWarpMeters,
        sortEnds,
        order_status: orderStatus,
        isComplete: isCompleteVal ? 1 : 0
      };
    }).filter((plan: any) => {
      const matchesSubTab = activeSubTab === 'open' ? !plan.isComplete : plan.isComplete;
      return matchesSubTab;
    });
  }, [sizingPlanList, yarnList, updatedPlans, activeSubTab, paginationInfo?.offset]);

    const handleCompletePlan = (plan: any) => {
    setCurrentSizingPlan(plan);
    setIsOrderStatusModalOpen(true);
  };

  const containerNames = useMemo(() => {
    return (processedCityList || []).map((plan: any) => `sizing_plan_${plan.id}`);
  }, [processedCityList]);

  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

  const handleOpenAttachmentModal = useCallback((plan: any) => {
    setSelectedAttachmentContainer(`sizing_plan_${plan.id}`);
    setAttachmentModalTitle(`Sizing Plan #${plan.sizingPlanNo || plan.id} Files`);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'Sl No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
        disableGlobalFilter: true
      },
      {
        Header: 'Sizing Plan Date',
        accessor: 'sizingPlanDate',
        Cell: ({ value }: { value: string }) => {
          if (!value) return 'N/A';
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            const date = new Date(dateStr);
            if (filterValue.from) {
              const fromDate = new Date(filterValue.from);
              if (date < fromDate) return false;
            }
            if (filterValue.to) {
              const toDate = new Date(filterValue.to);
              if (date > toDate) return false;
            }
            return true;
          });
        }
      },
      {
        Header: 'Sizing Plan No',
        accessor: 'sizingPlanNo',
      },
      {
        Header: 'Sizing Vendor',
        accessor: 'vendorId',
        Cell: ({ value, row }: any) => {
          const vendor = vendorList?.find((v: any) => Number(v.id) === Number(value));
          return vendor ? vendor.vendorName : (row.original?.vendorName || row.original?.vendor?.vendorName || value || 'N/A');
        },
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <select
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
           className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
          >
            <option value="">All</option>
            {vendorList?.map((vendor: any) => (
              <option key={vendor.id} value={vendor.id}>{vendor.vendorName}</option>
            ))}
          </select>
        ),
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue) return rows;
          return rows.filter(row => Number(row.values[columnIds[0]]) === Number(filterValue));
        }
      },
      
      {
        Header: 'Yarn Name',
        accessor: 'yarnName',
      },
      {
        Header: 'Construction',
        accessor: 'fabricQuality',
      },
      {
        Header: 'Sort Ends',
        accessor: 'sortEnds',
      },
        { Header: 'Meters', accessor: 'warpMeters' },
        {
          Header: 'Files',
          accessor: 'id',
          disableFilters: true,
          Cell: (props: any) => {
            const { row } = props;
            const containerName = `sizing_plan_${row.original.id}`;
            const count = fileCounts[containerName] || 0;
            return count > 0 ? (
              <button
                onClick={() => handleOpenAttachmentModal(row.original)}
                className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
              >
                View Files ({count})
              </button>
            ) : (
              <button
                onClick={() => handleOpenAttachmentModal(row.original)}
                className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
              >
                Upload
              </button>
            );
          },
        },
       {
        Header: 'Order Status',
        accessor: 'order_status',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const isComplete = row.original.isComplete;
          return isComplete ? (
            <button
              onClick={() => handleCompletePlan(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
            >
              Re-open
            </button>
          ) : (
            <button
              onClick={() => handleCompletePlan(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
            >
              Complete
            </button>
          );
        },
      },
      {
        Header: 'Print',
        accessor: 'printAction',
        disableFilters: true,
        Cell: ({ row }: { row: any }) => (
          <a
            href={`#/transaction/sizing-plan-print/${row.original.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 text-sm font-semibold"
          >
            Print
          </a>
        )
      }
    ],
    [vendorList, yarnList, fileCounts, handleOpenAttachmentModal]
  );

  const handleAdd = () => {
    setModalMode('add');
    setCurrentSizingPlan(null);
    navigate("/transaction/sizing-plan-entry");
  };

  const handleEdit = (sizingPlanDtl: any) => {
    setModalMode('edit');
    setCurrentSizingPlan(sizingPlanDtl);
    navigate("/transaction/sizing-plan-entry", { state: { sizingPlanDtl } });
  };

  const handleDelete = (sizingPlan: any) => {
    setCurrentSizingPlan(sizingPlan);
    setIsDeleteModalOpen(true);
  };

  const handleView = (sizingPlan: any) => {
    setCurrentSizingPlan(sizingPlan);
    setIsViewModalOpen(true);
  };

   const handleSaveOrderStatus = async (completionDate: string, description: string) => {
    if (!currentSizingPlan) return;

    // const isReopening = currentSizingPlan.order_status === 'Completed' || currentSizingPlan.isComplete === 1;
    // const newStatus = isReopening ? 'Pending' : 'Completed';

    const isReopening = currentSizingPlan.order_status === 'Completed' || currentSizingPlan.isComplete === 1;
    const transactionStatus = isReopening ? 'Open' : 'Completed';

    const transactionStatusPayload = {
      id: currentSizingPlan.id,
      transactionTypeId: 104,
      transactionTypeName: 'sizing-plan',
      primaryTypeId: currentSizingPlan.id,
      buyerId: undefined,
      vendorId: currentSizingPlan.vendorId,
      date: completionDate,
      description: description || '',
      status: transactionStatus,
      isComplete: isReopening ? 0 : 1,
      isActive: true
    };

    try {
      await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload);

      const newStatus = transactionStatus;
      const newIsComplete = isReopening ? 0 : 1;

      const companyId = getSelectedCompanyId();
      const updatePayload = {
        ...currentSizingPlan,
        order_status: newStatus,
        isComplete: newIsComplete,
        completionDate: newIsComplete === 1 ? completionDate : null,
      };

      await dispatch(updateSizingPlan({ id: currentSizingPlan.id, data: updatePayload, companyId })).unwrap();

      const updatedPlan = {
        ...currentSizingPlan,
        order_status: newStatus,
        isComplete: newIsComplete
      };

      const newUpdatedPlans = new Map(updatedPlans);
      newUpdatedPlans.set(currentSizingPlan.id, updatedPlan);
      setUpdatedPlans(newUpdatedPlans);

      toast.success(`Sizing Plan ${currentSizingPlan.sizingPlanNo} marked as ${newStatus.toLowerCase()}`);
      const paginationParams = { offset: getOffset(), limit: itemsPerPage };
      dispatch(getAllSizingPlan(companyId ? { companyId, ...paginationParams } : paginationParams as any));
    } catch (error) {
      console.error('Error saving transaction status:', error);
      toast.error('Failed to save transaction status');
    }

    setIsOrderStatusModalOpen(false);
  };


  const confirmDelete = async () => {
    if (!currentSizingPlan) return;
    const companyId = getSelectedCompanyId();
    const companyParams = companyId ? { companyId } : {};
    const paginationParams = { offset: getOffset(), limit: itemsPerPage };
    try {
      await dispatch(deleteSizingPlan({ id: currentSizingPlan.id, ...companyParams })).unwrap();
      await dispatch(getAllSizingPlan({ ...companyParams, ...paginationParams } as any));
    } catch (error) {
      console.error("Error deleting SizingPlan:", error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div>
       {/* <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight pb-3">
              Sizing Plan
            </h1> */}

      <div className="flex gap-4 border-b mb-4">
        <button
          onClick={() => setActiveSubTab('open')}
          className={`pb-2 px-4 transition-colors duration-200 ${
            activeSubTab === 'open'
              ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
              : 'text-gray-600 hover:text-blue-500'
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setActiveSubTab('completed')}
          className={`pb-2 px-4 transition-colors duration-200 ${
            activeSubTab === 'completed'
              ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
              : 'text-gray-600 hover:text-blue-500'
          }`}
        >
          Completed
        </button>
      </div>

      <DataTable
        columns={columns}
        data={processedCityList}
        title=""
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search sizing plan..."
        disableFullDataFetch={true}
        highlightRowId={highlightRowId}
        virtualScroll={true}
        virtualScrollHeight="65vh"
        isShowPagination={false}
      />
{/* 
 <Pagination
          currentPage={currentPage}
          totalItems={paginationInfo?.total || 0}
          itemsPerPage={itemsPerPage}
          offset={paginationInfo?.offset || 0}
          hasNext={!!paginationInfo?.next}
          hasPrev={!!paginationInfo?.prev}
          onPageChange={handlePageChange}
        /> */}
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete sizingPlan?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Sizing Plan Details"
        className="w-full max-w-6xl"
      >
        {currentSizingPlan && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Sizing Plan No</p>
                <p className="font-medium">{currentSizingPlan.sizingPlanNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sizing Vendor</p>
                <p className="font-medium">
                  {vendorList.find((v: any) => v.id === currentSizingPlan.vendorId)?.vendorName || currentSizingPlan.vendorId}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Weaver</p>
                <p className="font-medium">
                  {consigneeList.find((c: any) => c.id === currentSizingPlan.consigneeId)?.consigneeName || currentSizingPlan.consigneeId}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sizing Rate/KG</p>
                <p className="font-medium">{currentSizingPlan.sizingRate}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Empty Beam No</p>
                <p className="font-medium">{currentSizingPlan.emptyBeamNo || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-secondary-500">Remarks</p>
                <p className="font-medium">{currentSizingPlan.remarks}</p>
              </div>
            </div>

            {/* Quality Details */}
            <div className="mt-6">
              <h3 className="font-medium text-lg mb-2">Quality Details</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Construction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Ends</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Ends</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yarn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Yarn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warp Ends</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Warp Ends</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parts</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ends/Part</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warp Meters</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentSizingPlan.sizingQualityDetails.map((quality: any, index: any) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.fabricCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.quality}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.sordEnds || quality.sortEnds || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.actualEnds}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{yarnList.find((y: any) => y.id === quality.yarnId)?.yarnName || quality.yarnId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{yarnList.find((y: any) => y.id === quality.actualYarn)?.yarnName || quality.actualYarn}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.warpEnds}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.actualWarpEnds}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.parts}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.endsPerPart}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quality.warpMeters}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Beam Details */}
            <div className="mt-6">
              <h3 className="font-medium text-lg mb-2">Beam Details</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weaving Contract No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Order No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empty Beam ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warp Meters</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shrinkage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Fabric Meter</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentSizingPlan.sizingBeamDetails.map((beam: any, index: any) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {weavingContractList.find((w: any) => w.id === beam.weavingContractId)?.weavingContractNo || beam.weavingContractId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salesOrderList.find((s: any) => s.id === beam.salesOrderId)?.salesOrderNo || beam.salesOrderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {emptyBeamIssueList.find((e: any) => e.id === beam.emptyBeamId)?.flangeNo || beam.emptyBeamId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{beam.warpMeters}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{beam.shrinkage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{beam.expectedFabricMeter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <OrderStatusModal
        isOpen={isOrderStatusModalOpen}
        onClose={() => setIsOrderStatusModalOpen(false)}
        onSave={handleSaveOrderStatus}
        transactionData={genericTransactionData}
      />
      {selectedAttachmentContainer && (
        <DocumentAttachmentModal
          isOpen={Boolean(selectedAttachmentContainer)}
          onClose={() => setSelectedAttachmentContainer(null)}
          containerName={selectedAttachmentContainer}
          title={attachmentModalTitle}
          onFilesUpdated={(newCount) => updateFileCount(selectedAttachmentContainer, newCount)}
        />
      )}
    </div>
  );
}