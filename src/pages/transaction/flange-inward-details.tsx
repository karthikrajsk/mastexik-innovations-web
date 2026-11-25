import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { deleteFlangeInward, getAllFlangeInwards, getFlangeInwardsByFactoryCompanyId } from "@/state/flangeInwardSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

interface FlangeQualityDetail {
  id: number;
  beamInwardId: number | null;
  quality: string;
  yarnId: number;
  sordEnds: number;
  actualEnds: number;
  parts: number;
  endsPerPart: number;
  wrapMeters: number;
}

interface FlangeDetailRow {
  id: number;
  beamInwardId: number | null;
  weavingContractId: number;
  salesOrderId: number;
  sizedBeamNo: number;
  wrapMeters: number;
  shrinkage: number;
  expectedFabricMeter: number;
}

interface FlangeInwardData {
  id: number;
  vendorId: number;
  sizingPlanId: number | null;
  termsConditionsId: number;
  consigneeId: number;
  paymentTermsId: number;
  sizingRate: number;
  remarks: string;
  flangeInwardNo?: string;
  beamInwardNo?: string;
  flangeInwardDate?: string;
  beamInwardDate?: string;
  orderTypeId: number;
  isFlangePending?: number | boolean;
  isBeamPending?: number | boolean;
  flangeInwardQualityDetails?: FlangeQualityDetail[];
  beamInwardQualityDetails?: FlangeQualityDetail[];
  flangeDetails?: FlangeDetailRow[];
  beamInwardBeamDetails?: FlangeDetailRow[];
}

export default function FlangeInwardDetails() {

  const { list: flangeInwardList, pagination } = useSelector((state: RootState) => state.flangeInward);
  const { customerList } = useSelector((state: RootState) => state.customer as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentBeamInward, setCurrentBeamInward] = useState<FlangeInwardData | null>(null);
  const [factoryCompanyId, setFactoryCompanyId] = useState<number | null>(null);
  const [companyInitialized, setCompanyInitialized] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentPage, itemsPerPage, handlePageChange, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  const customerNameMap = useMemo(() => {
    const raw: any = customerList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((c: any) => {
      if (c?.id != null) map.set(String(c.id), String(c.customerName || c.buyerName || c.name || ''));
    });
    return map;
  }, [customerList]);

  const companyNameMap = useMemo(() => {
    const raw: any = companyMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((c: any) => {
      if (c?.id != null) map.set(String(c.id), String(c.companyName || c.name || ''));
    });
    return map;
  }, [companyMasterList]);

  const sizingOrderMap = useMemo(() => {
    const raw: any = sizingJobWorkOrderList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, { orderNo: string; buyerName: string; orderTypeId?: number }>();
    arr.forEach((order: any) => {
      if (order?.id == null) return;
      const orderTypeId = Number(order?.orderTypeId);
      const orderNo = order?.sizingWorkOrderNo || order?.sizingJobWorkOrderNo || order?.jobWorkOrderNo || order?.orderNo || String(order.id);
      let buyerName = order?.buyerName || '';
      if (orderTypeId === 1) {
        const companyId = order?.tradingCompanyId ?? order?.buyerId ?? order?.companyId;
        buyerName = companyNameMap.get(String(companyId)) || buyerName;
      } else {
        const customerId = order?.buyerId ?? order?.customerId ?? order?.consigneeId;
        buyerName = customerNameMap.get(String(customerId)) || buyerName;
      }
      if (!buyerName) buyerName = '-';
      map.set(String(order.id), { orderNo, buyerName, orderTypeId });
    });
    return map;
  }, [sizingJobWorkOrderList, companyNameMap, customerNameMap]);

  const [activeTab, setActiveTab] = useState<'pending' | 'complete'>(() => {
    try {
      const savedTab = sessionStorage.getItem('flangeInwardTab');
      return (savedTab === 'complete' ? 'complete' : 'pending') as 'pending' | 'complete';
    } catch {
      return 'pending';
    }
  });

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const parsedCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
    setFactoryCompanyId(parsedCompanyId);
    setCompanyInitialized(true);

    if (parsedCompanyId) {
      dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: parsedCompanyId }) as any);
    } else {
      dispatch(getAllSizingJobWorkOrders({} as any));
    }
    dispatch(getAllCustomers({} as any));
    dispatch(getAllCompanies({} as any));
  }, [dispatch]);

  useEffect(() => {
    if (!companyInitialized) return;
    const paginationPayload = {
      offset: getOffset(),
      limit: itemsPerPage,
    };

    if (factoryCompanyId) {
      dispatch(getFlangeInwardsByFactoryCompanyId({
        companyId: factoryCompanyId,
        fetchAll: true,
        // ...paginationPayload,
      }) as any);
    } else {
      dispatch(getAllFlangeInwards(paginationPayload));
    }
  }, [dispatch, companyInitialized, factoryCompanyId, currentPage, getOffset, itemsPerPage]);

    const safeBeamInwardList = useMemo(() => (
      Array.isArray(flangeInwardList) ? flangeInwardList : []
    ), [flangeInwardList]);

    const processedCityList = useMemo(() => {
      const baseSerial = pagination?.offset || 0;
      return safeBeamInwardList.map((city: any, index: number) => ({
        ...city,
        serialNo: baseSerial + index + 1
      }));
    }, [safeBeamInwardList, pagination?.offset]);

    const displayedData = useMemo(() => processedCityList, [processedCityList]);

  const columns = useMemo(
    () => {
      const resolveBuyer = (row: any) => {
        if (!row) return '-';
        if (row?.buyerName) return row.buyerName;
        if (row?.sizingJobWorkOrderId != null) {
          const match = sizingOrderMap.get(String(row.sizingJobWorkOrderId));
          if (match?.buyerName) return match.buyerName;
        }
        if (Number(row?.orderTypeId) === 1) {
          const companyId = row?.tradingCompanyId ?? row?.buyerId ?? row?.companyId;
          if (companyId != null) {
            const label = companyNameMap.get(String(companyId));
            if (label) return label;
          }
        } else {
          const customerId = row?.buyerId ?? row?.customerId ?? row?.consigneeId;
          if (customerId != null) {
            const label = customerNameMap.get(String(customerId));
            if (label) return label;
          }
        }
        return '-';
      };

      const resolveSizingOrderNo = (row: any) => {
        if (!row) return '-';
        if (row?.sizingOrderNo) return row.sizingOrderNo;
        if (row?.sizingJobWorkOrderId != null) {
          const match = sizingOrderMap.get(String(row.sizingJobWorkOrderId));
          if (match?.orderNo) return match.orderNo;
        }
        return '-';
      };

      const resolveFlangeCount = (row: any) => {
        if (!row) return 0;
        if (typeof row?.noOfFlanges === 'number') return row.noOfFlanges;
        const details = Array.isArray(row?.beamInwardBeamDetails)
          ? row.beamInwardBeamDetails
          : Array.isArray(row?.flangeDetails)
            ? row.flangeDetails
            : [];
        return details.length;
      };

      const buyerOptions = Array.from(new Set(displayedData.map(row => resolveBuyer(row)).filter(v => v && v !== '-'))).sort();

      return [
        {
          Header: 'S.No',
          accessor: 'serialNo',
          width: 50,
          disableFilters: true,
        },
        {
          Header: 'Inward Date',
          id: 'inwardDate',
          accessor: (row: any) => row?.flangeInwardDate || row?.beamInwardDate || row?.createdAt || row?.date || '',
       Cell: ({ value }: { value: string }) => {
                                          if (!value) return 'N/A';
                                          const date = new Date(value);
                                          const day = date.getDate().toString().padStart(2, '0');
                                          const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                          const year = date.getFullYear();
                                          return `${day}/${month}/${year}`;
                                        },
                                        Filter: DateRangeFilter,
          filter: (rows: any[], columnIds: string[], fv: { from?: string; to?: string }) => {
            const id = columnIds[0];
            return rows.filter((row: any) => {
              const raw = row.values[id];
              if (!raw) return false;
              const d = new Date(raw);
              if (isNaN(d.getTime())) return false;
              d.setHours(0,0,0,0);
              if (fv?.from) {
                const from = new Date(fv.from);
                from.setHours(0,0,0,0);
                if (d < from) return false;
              }
              if (fv?.to) {
                const to = new Date(fv.to);
                to.setHours(23,59,59,999);
                if (d > to) return false;
              }
              return true;
            });
          },
        },
        { Header: 'Inward No', id: 'inwardNo', accessor: (row: any) => row?.flangeInwardNo || row?.beamInwardNo || '-' },
        { Header: 'Order Type', id: 'orderType', accessor: (row: any) => (Number(row?.orderTypeId) === 1 ? 'Internal' : 'External') },
        {
          Header: 'Buyer Name',
          id: 'buyerName',
          accessor: (row: any) => resolveBuyer(row),
          Filter: ({ column: { filterValue, setFilter } }: any) => (
            <select
              value={filterValue || ''}
              onChange={e => setFilter(e.target.value || undefined)}
              className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
            >
              <option value="">All</option>
              {buyerOptions.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ),
          filter: (rows: any[], columnIds: string[], filterValue: string) => {
            const term = (filterValue || '').toString().toLowerCase().trim();
            if (!term) return rows;
            return rows.filter((row: any) => {
              const value = (row.values[columnIds[0]] || '').toString().toLowerCase();
              return value.includes(term);
            });
          },
        },
        { Header: 'Sizing Order No', id: 'sizingOrderNo', accessor: (row: any) => resolveSizingOrderNo(row) },
        { Header: 'No of Flanges', id: 'noOfFlanges', accessor: (row: any) => resolveFlangeCount(row) },
      ];
    },
    [companyNameMap, customerNameMap, sizingOrderMap, displayedData]
  );

  const currentQualityDetails = useMemo(() => {
    if (!currentBeamInward) return [];
    if (Array.isArray(currentBeamInward.flangeInwardQualityDetails)) return currentBeamInward.flangeInwardQualityDetails;
    if (Array.isArray(currentBeamInward.beamInwardQualityDetails)) return currentBeamInward.beamInwardQualityDetails;
    return [];
  }, [currentBeamInward]);

  const currentFlangeDetails = useMemo(() => {
    if (!currentBeamInward) return [];
    if (Array.isArray(currentBeamInward.flangeDetails)) return currentBeamInward.flangeDetails;
    if (Array.isArray(currentBeamInward.beamInwardBeamDetails)) return currentBeamInward.beamInwardBeamDetails;
    return [];
  }, [currentBeamInward]);

  const resolvedViewInwardNo = currentBeamInward?.flangeInwardNo || currentBeamInward?.beamInwardNo || "";

  const handleAdd = () => {
    try { 
      sessionStorage.removeItem('flangeInwardEdit');
      sessionStorage.setItem('flangeInwardTab', activeTab);
    } catch {}
    navigate("/transaction/flange-inward");
  };

  const handleEdit = (beamInwardDtl: FlangeInwardData) => {
    console.log(JSON.stringify(beamInwardDtl));
    try { 
      sessionStorage.setItem('flangeInwardEdit', JSON.stringify(beamInwardDtl));
      sessionStorage.setItem('flangeInwardTab', activeTab);
    } catch {}
    navigate("/transaction/flange-inward", { state: { beamInwardDtl, fromTab: activeTab } });
  };

  const handleDelete = (beamInward: FlangeInwardData) => {
    setCurrentBeamInward(beamInward);
    setIsDeleteModalOpen(true);
  };

  const handleView = (beamInward: FlangeInwardData) => {
    setCurrentBeamInward(beamInward);
    setIsViewModalOpen(true);
  };

  // const confirmDelete = () => {
  //   // Implement actual delete logic here
  //   setFlangeInwardData(beamInwardData.filter(item => item.id !== currentBeamInward?.id));
  //   setIsDeleteModalOpen(false);
  // };
  const confirmDelete = async () => {
    if (!currentBeamInward) return;
    try {
      await dispatch(
        factoryCompanyId
          ? deleteFlangeInward({ id: currentBeamInward.id, factoryCompanyId })
          : deleteFlangeInward(currentBeamInward.id)
      ).unwrap();

      const currentTotal = pagination?.total || 0;
      const updatedTotal = Math.max(0, currentTotal - 1);
      const maxPage = Math.max(0, Math.ceil(updatedTotal / itemsPerPage) - 1);

      if (currentPage > maxPage) {
        handlePageChange(maxPage);
      } else {
        const payload = { offset: getOffset(), limit: itemsPerPage };
        if (factoryCompanyId) {
          await dispatch(getFlangeInwardsByFactoryCompanyId({ companyId: factoryCompanyId, ...payload }) as any);
        } else {
          await dispatch(getAllFlangeInwards(payload));
        }
      }
    } catch (error) {
      console.error("Error deleting Beam Inward:", error);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      {/* <div>
        <h1 className="text-xl font-semibold">Sizing Flange Inward Details</h1>
      </div> */}
      <DataTable
        columns={columns}
        data={displayedData}
        title="Sizing Flange Inward Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search flange inward..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        //  initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      /> */}

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Sizing Flange Inward Details"
        className="max-w-4xl"
      >
        {currentBeamInward && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Flange Inward No</p>
                <p className="font-medium">{resolvedViewInwardNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Vendor ID</p>
                <p className="font-medium">{currentBeamInward.vendorId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Consignee ID</p>
                <p className="font-medium">{currentBeamInward.consigneeId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sizing Rate</p>
                <p className="font-medium">{currentBeamInward.sizingRate}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Payment Terms</p>
                <p className="font-medium">{currentBeamInward.paymentTermsId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Remarks</p>
                <p className="font-medium">{currentBeamInward.remarks}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-lg mb-3">Quality Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Construction</th>
                      <th className="border p-2">Yarn ID</th>
                      <th className="border p-2">Sort Ends</th>
                      <th className="border p-2">Actual Ends</th>
                      <th className="border p-2">Parts</th>
                      <th className="border p-2">Ends Per Part</th>
                      <th className="border p-2">Wrap Meters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQualityDetails.map((quality, index) => (
                      <tr key={index}>
                        <td className="border p-2">{quality.quality}</td>
                        <td className="border p-2">{quality.yarnId}</td>
                        <td className="border p-2">{quality.sordEnds}</td>
                        <td className="border p-2">{quality.actualEnds}</td>
                        <td className="border p-2">{quality.parts}</td>
                        <td className="border p-2">{quality.endsPerPart}</td>
                        <td className="border p-2">{quality.wrapMeters}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-lg mb-3">Flange Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Weaving Contract ID</th>
                      <th className="border p-2">Sales Order ID</th>
                      <th className="border p-2">Sized Beam No</th>
                      <th className="border p-2">Wrap Meters</th>
                      <th className="border p-2">Shrinkage</th>
                      <th className="border p-2">Expected Fabric Meter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFlangeDetails.map((detail, index) => (
                      <tr key={index}>
                        <td className="border p-2">{detail.weavingContractId}</td>
                        <td className="border p-2">{detail.salesOrderId}</td>
                        <td className="border p-2">{detail.sizedBeamNo}</td>
                        <td className="border p-2">{detail.wrapMeters}</td>
                        <td className="border p-2">{detail.shrinkage}</td>
                        <td className="border p-2">{detail.expectedFabricMeter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {/* <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete beam inward "{currentBeamInward?.beamInwardNo}"?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </Button>
          </div>
        </div>
      </Modal> */}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete flange inward?</p>
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

    </div>
  );
}