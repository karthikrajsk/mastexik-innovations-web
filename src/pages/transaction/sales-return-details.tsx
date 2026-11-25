
import React, { useEffect, useState, useMemo } from "react";
import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getAllInvoices } from "@/state/invoiceSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { deleteSalesReturn, getAllSalesReturn } from "@/state/salesReturnSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";

interface MediaUploadDetail {
  mediaDetailSno: number;
  mediaSno: number;
  azureId: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  mediaType: string;
  contentType: string;
  mediaSize: number;
  mediaDetailDescription: string;
  isUploaded: boolean;
  createdAt: number;
  updatedAt: number;
  originalFileName: string;
  isCompressed: boolean;
  originalFileSize: number;
  storedFileSize: number;
}

function DateRangeFilter({ column: { filterValue = {}, setFilter } }: any) {
  return (
    <div className="flex space-x-2">
      <p className="text-sm font-normal">From</p>
      <input
        type="date"
        value={filterValue.from || ""}
        onChange={(e) => setFilter({ ...filterValue, from: e.target.value })}
        placeholder="From"
        className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <p className="text-sm font-normal">To</p>
      <input
        type="date"
        value={filterValue.to || ""}
        onChange={(e) => setFilter({ ...filterValue, to: e.target.value })}
        placeholder="To"
        className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const normalizeCodeValue = (value?: string | number | null) => String(value ?? '').trim().toUpperCase();
const isBeamTypeLabel = (value?: string | number | null) => {
  const normalized = normalizeCodeValue(value);
  return (
    normalized === 'BEAM' ||
    normalized === 'JOB WORK BEAM' ||
    normalized === 'JOBWORK BEAM' ||
    normalized === 'JOBWORKBEAM'
  );
};

export function SalesReturnDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleFileDownload = (mediaUrl: string | undefined, fileName: string | undefined) => {
    if (!mediaUrl || !fileName) {
      console.error('Invalid file download parameters');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const { salesReturnList, paginationInfo } = useSelector(
    (state: RootState) => state.salesReturn
  ) as { salesReturnList: any[]; paginationInfo: { total: number; offset: number; next: boolean; prev: boolean } };
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  const { salesOrderList } = useSelector(
    (state: RootState) => state.salesOrder
  );
  const { yarnList } = useSelector((state: RootState) => (state as any).yarn);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { sizingPlanList } = useSelector((state: RootState) => (state as any).sizingPlan);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentSalesReturn, setCurrentSalesReturn] = useState<any>(null);
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  const invoiceTypeOptions = useMemo(() => {
    try {
      const stored = localStorage.getItem('codes_header');
      if (stored) {
        const headers = JSON.parse(stored);
        const raw = Array.isArray(headers) ? headers : (headers?.data || []);
        const tradeHeader = raw.find((h: any) => (h.code_group || h.codeGroup) === 'TRADE_TYPE' || Number(h.id) === 2);
        return tradeHeader?.details || [];
      }
    } catch (e) {
      console.error("Failed to load invoice type options", e);
    }
    return [];
  }, []);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedCompanyId ? parseInt(storedCompanyId) : undefined;

    dispatch(getAllSalesReturn({  companyId ,fetchAll: true }));
    dispatch(getAllInvoices({}));
    dispatch(getAllCustomers({}));
    dispatch(getAllSalesOrders({}));
    dispatch(getAllYarnMasters({}));
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllSizingPlan({ fetchAll: true }));
  }, [dispatch, currentPage]);

  const processedSalesReturnList = useMemo(() => {
    return (Array.isArray(salesReturnList) ? salesReturnList : []).map(
      (returnItem: any, index: number) => {
        let fabricQuality = "-";
        let buyerName = returnItem.buyerName || "-";
        let orderNo = returnItem.orderNo || "-";
        
        const typeOption = (Array.isArray(invoiceTypeOptions) ? invoiceTypeOptions : []).find((opt: any) => String(opt.id) === String(returnItem.invoiceType));
        const typeLabel = typeOption?.value || "";
        const isBeamFlow = (returnItem.beamItems && returnItem.beamItems.length > 0) || 
                           isBeamTypeLabel(typeOption?.code || typeOption?.value) || 
                           typeLabel === 'Beam' ||
                           String(returnItem.invoiceType) === "206";

        if (isBeamFlow) {
          // 1. Buyer Name -> Weaver Name
          const weaverId = returnItem.weaverId || returnItem.beamItems?.[0]?.weaverId;
          if (weaverId) {
            const weaver = (Array.isArray(vendorList) ? vendorList : []).find((v: any) => v.id === weaverId);
            buyerName = weaver?.vendorName || weaver?.name || returnItem.beamItems?.[0]?.weaverName || buyerName;
          }

          // 2. Order No -> Sizing Plan No
          orderNo = returnItem.beamItems?.[0]?.sizingPlanNo || orderNo;

          // 3. Item Name - Prioritize record's own fabric details
          if (returnItem.fabricCode && returnItem.fabricQuality) {
            fabricQuality = `${returnItem.fabricCode} - ${returnItem.fabricQuality}`;
          } else if (returnItem.fabricCode) {
            fabricQuality = returnItem.fabricCode;
          } else {
            // Fallback to sizing plan if top level fields are missing
            const sPlanNo = returnItem.beamItems?.[0]?.sizingPlanNo;
            if (sPlanNo) {
               const plan = (Array.isArray(sizingPlanList) ? sizingPlanList : []).find((p: any) => 
                 (p.sizingPlanNo || p.planNo || p.sizingPlanNumber || p.sizing_plan_no || p.plan_no) === sPlanNo
               );
               if (plan) {
                  // Try top level first, then sizingQualityDetails
                  let fCode = plan.fabricCode || plan.fabricCodeId || "";
                  let fQuality = plan.fabricQuality || plan.fabricQualityName || "";

                  if (!fCode && Array.isArray(plan.sizingQualityDetails) && plan.sizingQualityDetails.length > 0) {
                     const firstQuality = plan.sizingQualityDetails[0];
                     fCode = firstQuality.fabricCode || firstQuality.fabricCodeId || "";
                     fQuality = firstQuality.fabricQuality || firstQuality.fabricQualityName || "";
                  }

                  if (fCode && fQuality) {
                    fabricQuality = `${fCode} - ${fQuality}`;
                  } else if (fCode || fQuality) {
                    fabricQuality = fCode || fQuality;
                  }
               }
            }
          }
        } else {
          // Handle Yarn Sales type (check if it's yarn sales based on some property or just try to find yarn)
          // If items exist and have yarnId, it's likely yarn sales
          const firstItem = returnItem.items?.[0];
          if (firstItem?.yarnId) {
            const yarn = (Array.isArray(yarnList) ? yarnList : []).find((y: any) => y.id === firstItem.yarnId);
            fabricQuality = yarn?.yarnName || firstItem.yarnName || returnItem.fabricCode || "-";
          } else if (returnItem.fabricCode && returnItem.fabricQuality) {
            fabricQuality = `${returnItem.fabricCode} - ${returnItem.fabricQuality}`;
          } else if (returnItem.fabricCode) {
            fabricQuality = returnItem.fabricCode;
          }
        }

        const isYarnSales = typeLabel === "YARN SALES" || String(returnItem.invoiceType) === "205";
        const isSizingSales = typeLabel === "SIZING SALES" || String(returnItem.invoiceType) === "204";
        
        let packingListNo = returnItem.packingListNo || returnItem.sizingBeamOutwardNo || "-";
        if (isYarnSales) {
          packingListNo = returnItem.invoiceNo || "-";
        } else if (isBeamFlow) {
          packingListNo = returnItem.beamItems?.[0]?.beamOutwardNo || returnItem.packingListNo || "-";
        } else if (isSizingSales) {
          packingListNo = returnItem.sizingBeamOutwardNo || (returnItem.sizingItems?.[0]?.beamOutwardNo) || returnItem.packingListNo || "-";
        }

        return {
          ...returnItem,
          serialNo: (paginationInfo?.offset || 0) + index + 1,
          buyerName: buyerName,
          invoiceNo: returnItem.invoiceNo || "-",
          invoiceType: typeLabel || returnItem.invoiceType || "-",
          orderNo: orderNo,
          displayItemName: fabricQuality,
          packingListNo: packingListNo,
        };
      }
    );
  }, [salesReturnList, paginationInfo, yarnList, vendorList, sizingPlanList, invoiceTypeOptions]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 50,
        disableFilters: true,
      },
       {
        Header: "Return Date",
        accessor: "date",
      },
      {
        Header: "Sales Return No",
        accessor: "salesReturnNo",
      },
      {
        Header: "Buyer  / Weaver Name",
        accessor: "buyerName",
      },
      {
        Header: "Return Type",
        accessor: "invoiceType",
      },

      {
        Header: "Invoice No",
        accessor: "invoiceNo",
      },
      {
        Header: "Order No",
        accessor: "orderNo",
      },
      {
        Header: "Item Name",
        accessor: "displayItemName",
      },
      {
        Header: "Packing List",
        accessor: "packingListNo",

      }
   
    ],
    [handleFileDownload]
  );

  const handleAdd = () => {
    navigate("/transaction/sales-return");
  };

  const handleEdit = (returnItem: any) => {
    navigate(`/transaction/sales-return?id=${returnItem.id}`, {
      state: { salesReturn: returnItem },
    });
  };

  const handleDelete = (returnItem: any) => {
    setCurrentSalesReturn(returnItem);
    setIsDeleteModalOpen(true);
  };

  const handleView = (returnItem: any) => {
    setCurrentSalesReturn(returnItem);
    setIsViewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentSalesReturn) return;

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedCompanyId ? parseInt(storedCompanyId) : undefined;

    try {
      await dispatch(deleteSalesReturn({ id: currentSalesReturn.id, companyId })).unwrap();
      resetPage();
      await dispatch(getAllSalesReturn({ companyId, fetchAll: true }));
      // toast.success("Sales return deleted successfully");
    } catch (error) {
      console.error("Error deleting sales return:", error);
      toast.error("Failed to delete sales return");
    }

    setIsDeleteModalOpen(false);
    setCurrentSalesReturn(null);
  };

  const totalOrders = paginationInfo?.total ?? (Array.isArray(processedSalesReturnList) ? processedSalesReturnList.length : 0);
  const currentOffset = paginationInfo?.offset || 0;
  const displayStart = totalOrders === 0 ? 0 : currentOffset + 1;
  const displayEnd = Math.min(currentOffset + processedSalesReturnList.length, totalOrders);

  return (
    <div>
      <DataTable
      title="Sales Beam/Jobwork Return Details"
        columns={columns}
        data={processedSalesReturnList}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search Sales Beam/Jobwork Return..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={paginationInfo?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
      />

      {/* <div className="mt-4 flex justify-end">
        <Pagination
          currentPage={currentPage}
          totalItems={totalOrders}
          itemsPerPage={itemsPerPage}
          offset={currentOffset}
          hasNext={!!paginationInfo?.next}
          hasPrev={!!paginationInfo?.prev}
          onPageChange={handlePageChange}
        />
      </div> */}

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Sales Beam/Jobwork Return Details"
        className="w-full max-w-4xl"
      >
        {currentSalesReturn && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {formatDate(currentSalesReturn.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice No</p>
                <p className="font-medium">{currentSalesReturn.invoiceNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order No</p>
                <p className="font-medium">{currentSalesReturn.orderNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Buyer Name </p>
                <p className="font-medium">{currentSalesReturn.buyerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sort No</p>
                <p className="font-medium">{currentSalesReturn.fabricCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Construction</p>
                <p className="font-medium">
                  {currentSalesReturn.fabricQuality}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">DC Upload</p>
                {currentSalesReturn.dcUploadDetail?.mediaUrl ? (
                  <button
                    onClick={() => handleFileDownload(
                      currentSalesReturn.dcUploadDetail?.mediaUrl, 
                      currentSalesReturn.dcUploadDetail?.originalFileName
                    )}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                    type="button"
                  >
                    <span>📄</span>
                    <span>{currentSalesReturn.dcUploadDetail?.originalFileName || 'Download DC'}</span>
                  </button>
                ) : (
                  <p className="font-medium text-gray-400 cursor-not-allowed">No file uploaded</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Invoice Upload</p>
                {currentSalesReturn.invoiceUploadDetail?.mediaUrl ? (
                  <button
                    onClick={() => handleFileDownload(
                      currentSalesReturn.invoiceUploadDetail?.mediaUrl, 
                      currentSalesReturn.invoiceUploadDetail?.originalFileName
                    )}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                    type="button"
                  >
                    <span>📄</span>
                    <span>{currentSalesReturn.invoiceUploadDetail?.originalFileName || 'Download Invoice'}</span>
                  </button>
                ) : (
                  <p className="font-medium text-gray-400 cursor-not-allowed">No file uploaded</p>
                )}
              </div>
            </div>

            {currentSalesReturn.items && currentSalesReturn.items.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Selected Pieces/Rolls</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          S.No
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Roll No
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Piece No
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Meter
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Net Weight
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentSalesReturn.items.map(
                        (item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">{item.rollNo}</td>
                            <td className="px-4 py-2">{item.pieceNo}</td>
                            <td className="px-4 py-2">
                              {Number(item.meter).toFixed(2)}
                            </td>
                            <td className="px-4 py-2">
                              {Number(item.netWeight).toFixed(2)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentSalesReturn.remarks && (
              <div>
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium">{currentSalesReturn.remarks}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this sales return?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}