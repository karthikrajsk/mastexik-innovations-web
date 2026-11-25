
import { DataTable } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { Modal } from "@/components/ui/Modal";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { deleteContract, getAllWeavingContract, updateWeavingContract } from "@/state/weavingContractSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useHighlightRow } from "@/hooks/useHighlightRow";
import { toast } from "react-toastify";
import { OrderStatusModal } from "@/components/ui/OrderStatusModal";
import { TransactionStatusAPI } from "@/services/transaction-status-api";
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";

interface wcFormData {
  id?: number;
  name: string;
  status: string;
}

const parseCompanyIdValue = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const parsed = parseInt(String(value).trim(), 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
};

const getValidCompanyId = () => {
  if (typeof window === "undefined") return null;

  const storedCompanyId = parseCompanyIdValue(localStorage.getItem('selectedCompanyId'));
  if (storedCompanyId) {
    return storedCompanyId;
  }

  const legacyCompanyEntry = localStorage.getItem('selectedCompany');
  if (legacyCompanyEntry) {
    try {
      const parsedLegacyCompany = JSON.parse(legacyCompanyEntry);
      const legacyId = parseCompanyIdValue(parsedLegacyCompany?.id ?? parsedLegacyCompany?.companyId);
      if (legacyId) {
        return legacyId;
      }
    } catch {
      const legacyId = parseCompanyIdValue(legacyCompanyEntry);
      if (legacyId) {
        return legacyId;
      }
    }
  }

  const authPayload = localStorage.getItem('authPayload');
  if (authPayload) {
    try {
      const parsedAuthPayload = JSON.parse(authPayload);
      const authCompanyId = parseCompanyIdValue(parsedAuthPayload?.user?.selectedCompany?.id ?? parsedAuthPayload?.user?.companyId);
      if (authCompanyId) {
        return authCompanyId;
      }
    } catch { }
  }

  return null;
};

export function WeavingContractDetails() {

  const { weavingContractList, paginationInfo } = useSelector((state: RootState) => state.weavingContracts)
  const { vendorList } = useSelector((state: RootState) => state.vendor)
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder)
  const { purchaseOrderList } = useSelector((state: RootState) => state.purchaseOrder);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentWeavingContract, setCurrentWeavingContract] = useState<any>(null);
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'open' | 'completed'>('open');
    const [updatedContracts, setUpdatedContracts] = useState<Map<number, any>>(new Map());
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isEditing, setIsEditing] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const highlightRowId = useHighlightRow();
  const [companyId, setCompanyId] = useState<number | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<wcFormData>();
  const [genericTransactionData, setGenericTransactionData] = useState<{
      transactionTypeId?: number;
      vendorId?: number;
      buyerId?: number;
      [key: string]: any;
    } | null>(null);
      const location = useLocation();

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

    useEffect(() => {
    if (location.state?.activeTab) {
      setActiveSubTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    setCompanyId(getValidCompanyId());
  }, []);

  useEffect(() => {
    if (companyId == null) return;
    dispatch(getAllWeavingContract({
      // offset: getOffset(),
      // limit: itemsPerPage,
      fetchAll: true,
      companyId
    }));
  }, [dispatch, getOffset, itemsPerPage, companyId]);

  useEffect(() => {
    dispatch(getAllVendors({fetchAll: true}));
    dispatch(getAllFabricMasters({fetchAll: true}));
  }, [dispatch]);

  const vendorMap = useMemo(() => {
    return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
      acc[vendor.id] = vendor.vendorName;
      return acc;
    }, {}) || {};
  }, [vendorList]);

  const fabricMap = useMemo(() => {
    return fabricMasterList?.reduce((acc: Record<number, any>, fabric: any) => {
      acc[fabric.id] = fabric;
      return acc;
    }, {}) || {};
  }, [fabricMasterList]);

    const processedContractList = useMemo(() => {
      const baseList = Array.isArray(weavingContractList) ? weavingContractList : [];
      const startIndex = paginationInfo?.offset || 0;

      return baseList.map((contract: any, index: number) => {
        const firstItem = contract.items?.[0] || contract.weavingContractItemDtl?.[0];
        const fabric = fabricMap[firstItem?.fabricCodeId];
        
        const updatedInfo = updatedContracts.get(contract.id);
        const isCompleteVal = updatedInfo 
          ? (updatedInfo.isComplete === 1 || updatedInfo.isComplete === true)
          : (contract.isComplete === 1 || contract.isComplete === true || contract.order_status === 'Completed');
        const orderStatus = updatedInfo?.order_status || contract.order_status || (isCompleteVal ? 'Completed' : 'Pending');

        return {
          ...contract,
          serialNo: startIndex + index + 1,
          vendorName: vendorMap[contract.vendorId] || contract.vendorId,
          fabricCode: fabric?.fabricCode || firstItem?.fabricCodeId || '',
          quality: fabric?.fabricQuality || firstItem?.quality || '',
          pickRate: firstItem?.pickCost ?? '',
          statusLabel: contract.activeFlag ? 'Active' : 'Inactive',
          order_status: orderStatus,
          isComplete: isCompleteVal ? 1 : 0
        };
      }).filter((contract: any) => {
        const matchesSubTab = activeSubTab === 'open' ? !contract.isComplete : contract.isComplete;
        return matchesSubTab;
      });
    }, [weavingContractList, vendorMap, fabricMap, paginationInfo?.offset, updatedContracts, activeSubTab]);

  //  const handleCompleteContract = (contract: any) => {
  //   setCurrentWeavingContract(contract);
  //   setIsOrderStatusModalOpen(true);
  // };

  
    const handleCompleteContract = useCallback((order: any) => {
      if (!order) return;
      setCurrentWeavingContract(order);
      const { vendorId, ...orderRest } = order;
      setGenericTransactionData({
        transactionTypeId: order.poTypeId || 0,
        vendorId: vendorId || undefined,
        buyerId: undefined,
        ...orderRest
      });
      setIsOrderStatusModalOpen(true);
    }, []);

  const containerNames = useMemo(() => {
    return (processedContractList || []).map((contract: any) => `weaving_contract_${contract.id}`);
  }, [processedContractList]);

  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

  const handleOpenAttachmentModal = useCallback((contract: any) => {
    setSelectedAttachmentContainer(`weaving_contract_${contract.id}`);
    setAttachmentModalTitle(`Weaving Contract #${contract.weavingContractNo || contract.id} Files`);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
        width: 50,
        disableFilters: true,
        disableGlobalFilter: true
      },
{
        Header: 'Weaving Contract Date',
        accessor: 'contractDate',
      },
      {
        Header: 'Weaving Contract No',
        accessor: 'weavingContractNo',
      },
      {
        Header: 'Vendor',
        accessor: 'vendorName',
        Cell: ({ value }: { value: string }) => (
          <span>{value || '-'}</span>
        ),
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <select
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
          >
            <option value="">All</option>
            {vendorList?.map((vendor: any) => (
              <option key={vendor.id} value={vendor.vendorName}>{vendor.vendorName}</option>
            ))}
          </select>
        )
      },
      {
        Header: 'Sort No',
        accessor: 'fabricCode',
        Cell: ({ value }: { value: string }) => (
          <span>{value || '-'}</span>
        )
      },
      {
        Header: 'Construction',
        accessor: 'quality',
        Cell: ({ value }: { value: string }) => (
          <span>{value || '-'}</span>
        )
      },
       {
        Header: 'Quantity',
        accessor: 'quantity',
        Cell: ({ row }: { row: any }) => {
          const firstItem = row.original.items?.[0] || row.original.weavingContractItemDtl?.[0];
          const quantity = firstItem?.quantity;
          return <span>{quantity || '-'}</span>;
        }
      },
      {
        Header: 'Pick Rate',
        accessor: 'pickRate',
        Cell: ({ value }: { value: number | string }) => (
          <span>{value !== undefined && value !== null && value !== '' ? value : '-'}</span>
        )
      },
     
      {
        Header: 'Files',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const containerName = `weaving_contract_${row.original.id}`;
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
        Cell: (props: any) => {
          const { row } = props;
          const isComplete = row.original.isComplete;
          return isComplete ? (
            <button
              onClick={() => handleCompleteContract(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
            >
              Re-open
            </button>
          ) : (
            <button
              onClick={() => handleCompleteContract(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
            >
              Complete
            </button>
          );
        },
      }
    ],
    [vendorList, handleCompleteContract, fileCounts, handleOpenAttachmentModal]
  );

  const handleAdd = () => {
    setModalMode('add');
    setCurrentWeavingContract(null);
    reset({
      name: '',
      status: 'Active',
    });
    // setIsModalOpen(true);
    navigate("/transaction/weaving-contract-entry");
  };

  const handleEdit = (weavingContractDtl: any) => {
    setModalMode('edit');
    setCurrentWeavingContract(weavingContractDtl);
    setIsModalOpen(true);
    navigate("/transaction/weaving-contract-entry", { state: { weavingContractDtl } });

  };

  const handleDelete = (wc: any) => {
    setCurrentWeavingContract(wc);
    setIsDeleteModalOpen(true);
  };

  const handleView = (wc: any) => {
    setCurrentWeavingContract(wc);
    setIsViewModalOpen(true);
  };

  const totalContracts = paginationInfo?.total ?? (Array.isArray(weavingContractList) ? weavingContractList.length : 0);
  const currentOffset = paginationInfo?.offset || 0;
  const displayStart = totalContracts === 0 ? 0 : currentOffset + 1;
  const displayEnd = Math.min(currentOffset + processedContractList.length, totalContracts);

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

   const handleSaveOrderStatus = async (completionDate: string, description: string) => {
    if (!currentWeavingContract) return;

   const isReopening = currentWeavingContract.order_status === 'Completed' || currentWeavingContract.isComplete === 1;
    const transactionStatus = isReopening ? 'Open' : 'Completed';

    const transactionStatusPayload = {
      id: currentWeavingContract.id,
      transactionTypeId: 103,
      transactionTypeName: 'weaving-contract',
      primaryTypeId: currentWeavingContract.id,
      vendorId: currentWeavingContract.vendorId,
      date: completionDate,
      description: description || '',
      status: transactionStatus,
      isComplete: isReopening ? 0 : 1,
      isActive: true
    };

    try {
      await TransactionStatusAPI.postTransactionStatus(transactionStatusPayload);
      const isReopening = currentWeavingContract.order_status === 'Completed' || currentWeavingContract.isComplete === 1;

           const newStatus = transactionStatus;
      const newIsComplete = isReopening ? 0 : 1;
      const companyId = getSelectedCompanyId();
      const updatedPayload = {
        ...currentWeavingContract,
        order_status: newStatus,
        isComplete:newIsComplete
      };
        await dispatch(updateWeavingContract({ id: currentWeavingContract.id, data: updatedPayload, companyId })).unwrap();
   
      const updatedContract = {
        ...currentWeavingContract,
        order_status: newStatus,
        isComplete:newIsComplete
      };
      const newUpdatedContracts = new Map(updatedContracts);
      newUpdatedContracts.set(currentWeavingContract.id, updatedContract);
      setUpdatedContracts(newUpdatedContracts);

      toast.success(`Contract ${currentWeavingContract.weavingContractNo} marked as ${newStatus.toLowerCase()}`);
          dispatch(getAllWeavingContract({
              companyId,
              offset: getOffset(),
              limit: itemsPerPage,
              fetchAll: false
            }));
    } catch (error) {
      console.error('Error saving transaction status:', error);
      toast.error('Failed to save transaction status');
    }

    setIsOrderStatusModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!currentWeavingContract) return;
    if (companyId == null) {
      toast.error("Please select a company before deleting the contract.");
      return;
    }
    try {
      await dispatch(deleteContract({ id: currentWeavingContract.id, companyId })).unwrap();
      const totalAfterDelete = Math.max(0, (paginationInfo?.total || 0) - 1);
      const maxPageIndex = Math.max(0, Math.ceil(totalAfterDelete / itemsPerPage) - 1);

      if (currentPage > maxPageIndex) {
        resetPage();
        await dispatch(getAllWeavingContract({ offset: 0, limit: itemsPerPage, fetchAll: false, companyId }));
      } else {
        await dispatch(getAllWeavingContract({ offset: getOffset(), limit: itemsPerPage, fetchAll: false, companyId }));
      }
    } catch (error) {
      console.error("Error deleting WeavingContract:", error);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div>
        {/* <h1 className="text-[20px] font-semibold text-slate-800 tracking-tight pb-3">
              Weaving Contract
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
        data={processedContractList}
        title=""
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search Weaving Contract..."
        showColumnFilters={true}
        highlightRowId={highlightRowId}
        disableFullDataFetch={true}
        virtualScroll={true}
        virtualScrollHeight="65vh"
        isShowPagination={false}
      />
{/* 
      <Pagination
        currentPage={currentPage}
        totalItems={totalContracts}
        itemsPerPage={itemsPerPage}
        offset={currentOffset}
        hasNext={!!paginationInfo?.next}
        hasPrev={!!paginationInfo?.prev}
        onPageChange={handlePageChange}
      /> */}
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete WeavingContract"?</p>
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

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Weaving Contract Details"
        className="w-full max-w-4xl"
      >

        {currentWeavingContract && (
          <div className="space-y-6">
            {/* Basic Contract Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Contract No</p>
                <p className="font-medium">{currentWeavingContract.weavingContractNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sales Order No</p>
                <p className="font-medium">{salesOrderList.find((v: any) => v.id === currentWeavingContract.salesOrderId)?.salesOrderNo || currentWeavingContract.salesOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Vendor ID</p>
                <p className="font-medium">{vendorList.find((v: any) => v.id === currentWeavingContract.vendorId)?.vendorName || currentWeavingContract.vendorId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Status</p>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs ${currentWeavingContract.activeFlag
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {currentWeavingContract.activeFlag ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Remarks</p>
                <p className="font-medium">{currentWeavingContract.remarks}</p>
              </div>
            </div>

            {/* Items Section */}
            <div className="mt-6">
              <h3 className="font-medium mb-2">Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Sort No</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Construction</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Pick Cost</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Start Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentWeavingContract.items?.map((item: any) => (
                      <tr key={item.id} className="border">
                        <td className="px-4 py-2 border">{item.fabricCodeId}</td>
                        <td className="px-4 py-2 border">{item.quantity}</td>
                        <td className="px-4 py-2 border">{item.pickCost}</td>
                        <td className="px-4 py-2 border">{item.plannedStartDate}</td>
                        <td className="px-4 py-2 border">{item.plannedEndDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Yarn Requirements Section */}
            <div className="mt-6">
              <h3 className="font-medium mb-2">Yarn Requirements</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Yarn Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Yarn Count</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Grams/Meter</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Required Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Available Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentWeavingContract.yarnRequirements?.map((yarn: any) => (
                      <tr key={yarn.id} className="border">
                        <td className="px-4 py-2 border">{yarn.yarnType}</td>
                        <td className="px-4 py-2 border">{yarn.yarnCount}</td>
                        <td className="px-4 py-2 border">{yarn.gramsPerMeter}</td>
                        <td className="px-4 py-2 border">{yarn.totalRequiredQty}</td>
                        <td className="px-4 py-2 border">{yarn.totalAvailableQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-secondary"
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