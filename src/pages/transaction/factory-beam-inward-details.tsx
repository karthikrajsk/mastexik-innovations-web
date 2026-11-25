import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { deleteFactoryBeamInward, getAllFactoryBeamInwards, getFactoryBeamInwardsByFactoryCompanyId } from "@/state/factoryBeamInwardSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllPoTypes, getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import React from "react";
import { getAllBeamInward } from "@/state/beamInwardSlice";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

interface BeamInwardData {
  id: number;
  vendorId: number;
  sizingPlanId: number | null;
  termsConditionsId: number;
  consigneeId: number;
  paymentTermsId: number;
  sizingRate: number;
  remarks: string;
  beamInwardNo: string;
  orderTypeId: number;
  beamInwardQualityDetails: {
    id: number;
    beamInwardId: number | null;
    quality: string;
    yarnId: number;
    sordEnds: number;
    actualEnds: number;
    parts: number;
    endsPerPart: number;
    wrapMeters: number;
  }[];
  beamInwardBeamDetails: {
    id: number;
    beamInwardId: number | null;
    weavingContractId: number;
    salesOrderId: number;
    sizedBeamNo: number;
    wrapMeters: number;
    shrinkage: number;
    expectedFabricMeter: number;
  }[];
}

export function FactoryBeamInwardDetails() {

  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
   const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const { purchaseOrderList } = useSelector((state: RootState) => state.purchaseOrder);
  const { list: beamInwardList, pagination } = useSelector((state: RootState) => state.factoryBeamInward);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { customerList } = useSelector((state: RootState) => state.customer as any);
  const { beamInwardList: allBeamInwardList } = useSelector((state: RootState) => state.beamInward as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const [beamInwardData, setBeamInwardData] = useState<BeamInwardData[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentBeamInward, setCurrentBeamInward] = useState<BeamInwardData | null>(null);
  const [factoryCompanyId, setFactoryCompanyId] = useState<number | null>(null);
  const [companyInitialized, setCompanyInitialized] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentPage, itemsPerPage, handlePageChange, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  // Map of weaving work order id -> display number for quick lookup
  const jobWorkOrderMap = useMemo(() => {
    const raw: any = weavingJobWorkOrderList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, { label: string; buyerId?: string }>();
    arr.forEach((w: any) => {
      const label = w?.jobWorkOrderNo || w?.weavingJobWorkOrderNo || w?.weavingWorkOrderNo || w?.jobWorkOrderNumber || String(w?.id || '');
      if (w?.id != null) map.set(String(w.id), { label: String(label), buyerId: String(w?.buyerId ?? w?.customerId ?? '') || undefined });
    });
    return map;
  }, [weavingJobWorkOrderList]);

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

  const beamInwardNoMap = useMemo(() => {
    const raw: any = allBeamInwardList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((r: any) => {
      if (r?.id != null && (r?.beamInwardNo ?? '') !== '') map.set(String(r.id), String(r.beamInwardNo));
    });
    return map;
  }, [allBeamInwardList]);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const parsedCompanyId = storedCompanyId ? Number(storedCompanyId) : null;
    setFactoryCompanyId(parsedCompanyId);
    setCompanyInitialized(true);

    if (parsedCompanyId) {
       dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
                        factoryCompanyId: parsedCompanyId,
                        fetchAll: true
                      }) as any);
      // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(parsedCompanyId) as any);
    } else {
      dispatch(getAllWeavingJobWorkOrders({fetchAll: true} as any));
    }
    dispatch(getAllVendors({fetchAll: true} as any));
    dispatch(getAllConsignee({fetchAll: true} as any));
    dispatch(getAllCustomers({fetchAll: true} as any));
    dispatch(getAllCompanies({fetchAll: true} as any));
  }, [dispatch]);

  useEffect(() => {
    const payload = factoryCompanyId ? { companyId: factoryCompanyId, fetchAll: true } : {};
    dispatch(getAllBeamInward(payload as any));
  }, [dispatch, factoryCompanyId]);

  useEffect(() => {
    if (!companyInitialized) return;
    const paginationPayload = {
      offset: getOffset(),
      limit: itemsPerPage,
    };

    if (factoryCompanyId) {
      dispatch(getFactoryBeamInwardsByFactoryCompanyId({
        companyId: factoryCompanyId,
        fetchAll: true,
        // ...paginationPayload,
      }) as any);
    } else {
      dispatch(getAllFactoryBeamInwards(paginationPayload));
    }
  }, [dispatch, companyInitialized, factoryCompanyId, currentPage, getOffset, itemsPerPage]);

    const safeBeamInwardList = useMemo(() => (
      Array.isArray(beamInwardList) ? beamInwardList : []
    ), [beamInwardList]);

    const processedCityList = useMemo(() => {
      const baseSerial = pagination?.offset || 0;
      return safeBeamInwardList.map((city: any, index: number) => ({
        ...city,
        serialNo: baseSerial + index + 1
      }));
    }, [safeBeamInwardList, pagination?.offset]);

    const displayedData = useMemo(() => processedCityList, [processedCityList]);

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: 'Beam Inward Date',
        id: 'beamInwardDate',
        accessor: (row: any) => row?.beamInwardDate || row?.createdAt || row?.date || '',
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
      { 
        Header: 'Beam Inward No', 
        id: 'beamInwardNo',
        accessor: (row: any) => row?.beamInwardNo || beamInwardNoMap.get(String(row?.beamInwardId)) || '-' 
      },
     
      {
        Header: 'Job Work Order No/Buyer',
        id: 'jobWorkOrderBuyer',
        accessor: (row: any) => {
          const weavingWorkOrderId = row?.weavingWorkOrderId;
          const orderTypeId = Number(row?.orderTypeId ?? 0);
          const tradingCompanyId = row?.tradingCompanyId;
          
          // Get job work order number from map
          const meta = weavingWorkOrderId != null ? jobWorkOrderMap.get(String(weavingWorkOrderId)) : undefined;
          const jobWorkOrderNo = meta?.label || row.jobWorkOrderNo || row.weavingJobWorkOrderNo || row.weavingWorkOrderNo || '';
          
          // Determine buyer name
          let buyerName = '';
            buyerName = tradingCompanyId != null ? (companyNameMap.get(String(tradingCompanyId)) || '') : '';
          // if (orderTypeId === 1) {
          //   buyerName = tradingCompanyId != null ? (companyNameMap.get(String(tradingCompanyId)) || '') : '';
          // }
          // For orderTypeId !== 1, don't fetch buyer
          
          // Construct final display
          if (!jobWorkOrderNo) return '-';
          return buyerName ? `${jobWorkOrderNo} - ${buyerName}` : jobWorkOrderNo;
        },
      },
      { 
        Header: 'Order Type', 
        id: 'orderType',
        accessor: (row: any) => (String(row?.orderTypeId) === '1' ? 'Internal' : 'External') 
      },
      { 
        Header: 'Sizing Set No', 
        id: 'sizingSetNo',
        accessor: (row: any) => row.sizingSetNo || row.dcNo || row.emptyBeamNo || '-' 
      },
      { 
        Header: 'Sort No/Construction', 
        id: 'fabricQuality',
        accessor: (row: any) => {
          const top = row.fabricCodeQuality;
          if (top) return top;
          
          const qualityDetails = row.beamInwardQualityDetails || [];
          if (qualityDetails.length === 0) {
            const code = row.fabricCode;
            const quality = row.quality;
            return [code, quality].filter(Boolean).join(' / ') || '-';
          }
          
          const uniqueQualities = new Set<string>();
          qualityDetails.forEach((q: any) => {
            const code = q.fabricCode || row.fabricCode;
            const quality = q.quality || row.quality;
            const combined = [code, quality].filter(Boolean).join(' / ');
            if (combined) uniqueQualities.add(combined);
          });
          
          return uniqueQualities.size > 0 ? Array.from(uniqueQualities).join(', ') : '-';
        }
      },
      {
        Header: 'Sizing Vendor',
        id: 'sizingVendor',
        accessor: (row: any) => {
          const vendor = vendorList.find((c: any) => c.id === row.sizingVendorId);
          return vendor ? vendor.vendorName : row.sizingVendorId;
        },
        Filter: ({ column: { filterValue, setFilter } }: any) => {
          const uniqueVendors = Array.from(new Set(displayedData.map(row => {
            const vendor = vendorList.find((c: any) => c.id === row.sizingVendorId);
            return vendor ? vendor.vendorName : row.sizingVendorId;
          }).filter(Boolean))).sort();

          return (
            <select
              value={filterValue || ''}
              onChange={e => setFilter(e.target.value || undefined)}
              className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
            >
              <option value="">All</option>
              {uniqueVendors.map((vendorName: any) => (
                <option key={vendorName} value={vendorName}>{vendorName}</option>
              ))}
            </select>
          );
        },
        filter: (rows: any[], columnIds: string[], filterValue: string) => {
          const term = (filterValue || '').toString().toLowerCase().trim();
          if (!term) return rows;
          return rows.filter((row: any) => {
            const val = (row.values[columnIds[0]] || '').toString().toLowerCase();
            return val.includes(term);
          });
        },
      },
      { 
        Header: 'No of Beams', 
        id: 'noOfBeams',
        accessor: (row: any) => row.beamInwardBeamDetails?.length || 0 
      },
      { 
        Header: 'Meters', 
        id: 'meters',
        accessor: (row: any) => row.beamInwardBeamDetails?.reduce((sum: number, beam: any) => sum + (beam.wrapMeters || 0), 0) || 0 
      },
    ],
     [vendorList, weavingContractList, consigneeList, jobWorkOrderMap, beamInwardNoMap, customerNameMap, companyNameMap, displayedData]
  );

  const handleAdd = () => {
    try {
      sessionStorage.removeItem('factoryBeamInwardEdit');
    } catch {}
    navigate("/transaction/factory-beam-inward-entry");
  };

  const handleEdit = (beamInwardDtl: BeamInwardData) => {
    console.log(JSON.stringify(beamInwardDtl));
    try {
      sessionStorage.setItem('factoryBeamInwardEdit', JSON.stringify(beamInwardDtl));
    } catch {}
    navigate("/transaction/factory-beam-inward-entry", { state: { beamInwardDtl } });
  };

  const handleDelete = (beamInward: BeamInwardData) => {
    setCurrentBeamInward(beamInward);
    setIsDeleteModalOpen(true);
  };

  const handleView = (beamInward: BeamInwardData) => {
    setCurrentBeamInward(beamInward);
    setIsViewModalOpen(true);
  };

  // const confirmDelete = () => {
  //   // Implement actual delete logic here
  //   setBeamInwardData(beamInwardData.filter(item => item.id !== currentBeamInward?.id));
  //   setIsDeleteModalOpen(false);
  // };
  const confirmDelete = async () => {
    if (!currentBeamInward) return;
    try {
      await dispatch(
        factoryCompanyId
          ? deleteFactoryBeamInward({ id: currentBeamInward.id, factoryCompanyId })
          : deleteFactoryBeamInward(currentBeamInward.id)
      ).unwrap();

      const currentTotal = pagination?.total || 0;
      const updatedTotal = Math.max(0, currentTotal - 1);
      const maxPage = Math.max(0, Math.ceil(updatedTotal / itemsPerPage) - 1);

      if (currentPage > maxPage) {
        handlePageChange(maxPage);
      } else {
        const payload = { offset: getOffset(), limit: itemsPerPage };
        if (factoryCompanyId) {
          await dispatch(getFactoryBeamInwardsByFactoryCompanyId({ companyId: factoryCompanyId, ...payload }) as any);
        } else {
          await dispatch(getAllFactoryBeamInwards(payload));
        }
      }
    } catch (error) {
      console.error("Error deleting Beam Inward:", error);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={displayedData}
        title="Factory Beam Inward Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search beam inward..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //     totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
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
        title="Factory Beam Inward Details"
        className="max-w-4xl"
      >
        {currentBeamInward && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Beam Inward No</p>
                <p className="font-medium">{currentBeamInward.beamInwardNo}</p>
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
                    {currentBeamInward.beamInwardQualityDetails.map((quality, index) => (
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
              <h3 className="font-medium text-lg mb-3">Beam Details</h3>
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
                    {currentBeamInward.beamInwardBeamDetails.map((beam, index) => (
                      <tr key={index}>
                        <td className="border p-2">{beam.weavingContractId}</td>
                        <td className="border p-2">{beam.salesOrderId}</td>
                        <td className="border p-2">{beam.sizedBeamNo}</td>
                        <td className="border p-2">{beam.wrapMeters}</td>
                        <td className="border p-2">{beam.shrinkage}</td>
                        <td className="border p-2">{beam.expectedFabricMeter}</td>
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
          <p>Are you sure you want to delete beam inward"?</p>
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