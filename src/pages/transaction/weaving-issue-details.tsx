import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { getAllWeavingYarnIssue, deleteWeavingYarnIssue } from "@/state/weavingYarnIssueSlice";
import { AppDispatch, RootState } from "@/state/store";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllBeamGaitings } from "@/state/beamGaitingSlice";
import { Eye } from "lucide-react";
import { Pagination, usePagination } from "@/components/common/Pagination";

type YarnIssueRow = {
  id: any;
  yarnName: string;
  lotNumber: string;
  availableQty: number;
  availableBags: number;
  issuedBags: number;
  kgsPerBag: number;
  conesPerBag: number;
  conesWeight: number;
  issueQty: number;
};

export function WeavingIssueDetails() {
  // Lists from store
  const { weavingYarnIssuetList, loading,paginationInfo } = useSelector((state: RootState) => state.weavingYarnIssue);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
  const { transportList } = useSelector((state: RootState) => state.transport as any);
  const { list: beamGatingList } = useSelector((state: RootState) => (state.beamGaiting as any) || {});

  // Local UI state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentWeavingContract, setCurrentWeavingContract] = useState<any>(null);

  // Filter state
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>(""); // vendorId as string
  const [contractFilter, setContractFilter] = useState<string>(""); // weavingContractId as string
  const [itemNameFilter, setItemNameFilter] = useState<string>("");
  const [outwardFilter, setOutwardFilter] = useState<string>("");
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const selectedCompanyId = useMemo(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return storedCompanyId ? Number(storedCompanyId) : undefined;
  }, []);

  useEffect(() => {
    const weavingIssueParams: { companyId?: number,offset?:number,limit?:number,isFetchAll:boolean } = {
      // limit :itemsPerPage,
      // offset: getOffset(),
      isFetchAll:true
    };
    if (selectedCompanyId) {
      weavingIssueParams.companyId = selectedCompanyId;
    }
    dispatch(getAllWeavingYarnIssue(weavingIssueParams));
    // Ensure needed lists for mapping and filter options
    dispatch(getAllVendors({ fetchAll: true } as any));
    dispatch(getAllWeavingContract({ fetchAll: true } as any));
    dispatch(getAllBeamGaitings({ fetchAll: true } as any));
  }, [dispatch, selectedCompanyId,currentPage, getOffset, itemsPerPage]);

  const isGaited = (row: any) => {
    const reqs = row.requirements || row.items || [];
    return reqs.some((req: any) =>
      (req.yarnIssues || []).some((issue: any) => {
        if (issue.beamGaitingId != null) return true;
        const lotNum = String(issue.lotNumber || issue.lotNo || '').trim();
        if (!lotNum) return false;
        const normLot = lotNum.toLowerCase();
        return (beamGatingList || []).some((bg: any) => {
          const weftLot = String(bg.weftYarnLotNo || '').trim().toLowerCase();
          const warpLot = String(bg.warpYarnLotNo || '').trim().toLowerCase();
          return (weftLot && weftLot === normLot) || (warpLot && warpLot === normLot);
        });
      })
    );
  };

  const vendorsArray = useMemo(() => {
    if (Array.isArray(vendorList)) return vendorList;
    if (Array.isArray((vendorList as any)?.data)) return (vendorList as any).data;
    if (Array.isArray((vendorList as any)?.items)) return (vendorList as any).items;
    return [];
  }, [vendorList]);

  // Maps for display
  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendorsArray.forEach((vendor: any) => {
      const id = vendor?.id ?? vendor?.vendorId;
      const name = vendor?.vendorName || vendor?.name;
      if (id != null && name) {
        map.set(String(id), name);
      }
    });
    return map;
  }, [vendorsArray]);

  const contractsArray = useMemo(() => {
    if (Array.isArray(weavingContractList)) return weavingContractList;
    if (Array.isArray((weavingContractList as any)?.data)) return (weavingContractList as any).data;
    if (Array.isArray((weavingContractList as any)?.items)) return (weavingContractList as any).items;
    return [];
  }, [weavingContractList]);

  const contractMap = useMemo(() => {
    const map = new Map<string, string>();
    contractsArray.forEach((c: any) => {
      const id = c?.id ?? c?.weavingContractId;
      const no = c?.weavingContractNo || String(id);
      if (id != null) {
        map.set(String(id), no);
      }
    });
    return map;
  }, [contractsArray]);

  const transportListArray = useMemo(() => {
    if (Array.isArray(transportList)) return transportList;
    if (Array.isArray((transportList as any)?.data)) return (transportList as any).data;
    if (Array.isArray((transportList as any)?.items)) return (transportList as any).items;
    return [];
  }, [transportList]);

  const transportMap = useMemo(() => {
    const map = new Map<string, string>();
    transportListArray.forEach((transport: any) => {
      const id = transport?.id ?? transport?.transportId;
      const label = transport?.transportName || transport?.name;
      if (id != null && label) {
        map.set(String(id), label);
      }
    });
    return map;
  }, [transportListArray]);

  // Pre-process and filter list
  // const processedList = useMemo(() => {
  //   const list = (weavingYarnIssuetList || []).map((row: any, index: number) => ({
  //     ...row,
  //     serialNo: index + 1,
  //   }));

  //   // Helper: parse date safely
  //   const parseDate = (val: any): number | null => {
  //     if (!val) return null;
  //     const d = new Date(val);
  //     const t = d.getTime();
  //     return isNaN(t) ? null : t;
  //   };

  //   // Filter function chain
  //   return list.filter((row: any) => {
  //     // Date range filter on yarnIssueDate
  //     const rowTime = parseDate(row.yarnIssueDate);
  //     if (fromDate) {
  //       const fromTime = parseDate(fromDate);
  //       if (fromTime !== null && (rowTime === null || rowTime < fromTime)) return false;
  //     }
  //     if (toDate) {
  //       const toTime = parseDate(toDate + "T23:59:59");
  //       if (toTime !== null && (rowTime === null || rowTime > toTime)) return false;
  //     }

  //     // Vendor filter
  //     if (vendorFilter) {
  //       if (String(row.vendorId) !== String(vendorFilter)) return false;
  //     }

  //     // Contract filter (by ID). If needed, users can search by number via select label
  //     if (contractFilter) {
  //       if (String(row.weavingContractId) !== String(contractFilter)) return false;
  //     }

  //     // Item Name filter (match any requirement yarnName contains)
  //     if (itemNameFilter) {
  //       const name = String(itemNameFilter).toLowerCase();
  //       const hasMatch = (row.requirements || row.items || [])?.some((it: any) => {
  //         const yn = (it?.yarnName ?? it?.itemName ?? "").toString().toLowerCase();
  //         return yn.includes(name);
  //       });
  //       if (!hasMatch) return false;
  //     }

  //     // Outward No filter
  //     if (outwardFilter) {
  //       const val = (row.yarnIssueChallanNo ?? "").toString().toLowerCase();
  //       if (!val.includes(outwardFilter.toLowerCase())) return false;
  //     }

  //     return true;
  //   });
  // }, [weavingYarnIssuetList, fromDate, toDate, vendorFilter, contractFilter, itemNameFilter, outwardFilter]);
  const weavingYarnIssueArray = useMemo(() => {
    if (Array.isArray(weavingYarnIssuetList)) return weavingYarnIssuetList;
    if (Array.isArray((weavingYarnIssuetList as any)?.data)) return (weavingYarnIssuetList as any).data;
    if (Array.isArray((weavingYarnIssuetList as any)?.items)) return (weavingYarnIssuetList as any).items;
    return [];
  }, [weavingYarnIssuetList]);

  const processedList = useMemo(() => {
    const list = weavingYarnIssueArray.map((row: any, index: number) => {
      const vId = row.vendorId ?? row.vendor_id ?? row.vendor?.id;
      const vendorName = (vId != null ? vendorMap.get(String(vId)) : null) || row.vendorName || row.vendor?.vendorName || (vId ? `Vendor ${vId}` : '-');
      const cId = row.weavingContractId ?? row.weaving_contract_id ?? row.weavingContract?.id;
      const contractNo = (cId != null ? contractMap.get(String(cId)) : null) || row.weavingContractNo || row.weavingContract?.weavingContractNo || (cId ? String(cId) : '-');

      const itemNames = Array.from(new Set(
        (row.requirements || [])
          .flatMap((req: any) => (req.yarnIssues || []))
          .map((issue: any) => {
            if (issue.actualYarn) return issue.actualYarn;
            if (issue.yarnName) return issue.yarnName;
            return '';
          })
          .filter(Boolean)
      )).join(' | ');

      const issuedQty = (row.requirements || [])
        .reduce((sum: number, req: any) => sum + (parseFloat(req?.totalIssueQty) || 0), 0);
      return {
        ...row,
        serialNo: index + 1,
        vendorName,
        contractNo,
        itemNames,
        issuedQty,
        // keep original fields for actions/views
      };
    });
    return list;
  }, [weavingYarnIssueArray, vendorMap, contractMap]);

 
  // Columns
  const columns = useMemo(
  () => [
    {
      Header: 'S.No',
      accessor: 'serialNo',
      width: 50,
      disableFilters: true,
      disableGlobalFilter: true,
    },
    {
      Header: 'Yarn Issue Date',
      accessor: 'yarnIssueDate',
      Cell: ({ value }: { value: string }) => formatDate(value),
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
            const toDate = new Date(filterValue.to + 'T23:59:59');
            if (date > toDate) return false;
          }
          return true;
        });
      },
    },
    {
      Header: 'Outward No',
      accessor: 'yarnIssueChallanNo',
    },
    {
      Header: 'Weaving Contract No',
      accessor: 'contractNo',
      Filter: ({ column: { filterValue, setFilter } }: any) => (
        <input
          type="text"
          value={filterValue || ''}
          onChange={e => setFilter(e.target.value || undefined)}
          className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
          placeholder="Search contract..."
        />
      ),
    },
    {
      Header: 'Vendor',
      accessor: 'vendorName',
      Filter: ({ column: { filterValue, setFilter } }: any) => (
        <select
          value={filterValue || ''}
          onChange={e => setFilter(e.target.value || undefined)}
          className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
        >
          <option value="">All</option>
          {vendorsArray?.map((v: any) => (
            <option key={v.id} value={v.vendorName || v.name}>{v.vendorName || v.name}</option>
          ))}
        </select>
      ),
    },
    {
      Header: 'Vehicle No',
      accessor: 'vehicleNo',
    },
    {
      Header: 'Item Name',
      accessor: 'itemNames',
      Cell: ({ value }: any) => {
        if (!value) return '-';
        const itemArray = value.split(' | ').filter((item: string) => item.trim());
        if (itemArray.length === 0) return '-';
        if (itemArray.length === 1) return itemArray[0];
        return (
          <div className="space-y-1">
            {itemArray.map((item: string, idx: number) => (
              <div key={idx} className="text-sm">{item}</div>
            ))}
          </div>
        );
      },
    },
    {
      Header: 'Issued Qty',
      accessor: 'issuedQty',
      Cell: ({ value }: { value: number }) => value || '0',
    },
    {
      Header: 'Transportation',
      accessor: 'transportationDetails',
      Cell: ({ row }: any) => {
        const transportObj = row.original?.transport;
        const transportId = row.original?.transportId ?? transportObj?.id;
        const label = transportId != null ? transportMap.get(String(transportId)) : undefined;
        const transportName = transportObj?.transportName || transportObj?.name;
        return transportName || label || row.original?.transportationDetails || '-';
      },
    },
    {
      Header: 'Print',
      id: 'print',
      Cell: ({ row }: any) => {
        const handlePrint = () => {
          const printData = { ...row.original, type: 'weaving' };
          localStorage.setItem('yarnReturnPrintData', JSON.stringify(printData));
          window.open(`/#/transaction/yarn-delivery-challan-print?id=${row.original.id}`, '_blank');
        };
        return (
          <button
            onClick={handlePrint}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Print
          </button>
        );
      },
      disableFilters: true,
      disableGlobalFilter: true,
    },
  ],
  [vendorList, transportMap]
);


  const handleAdd = () => {
    navigate("/transaction/weaving-yarn-issue");
  };

  const handleEdit = (weavingYarnIssueDtl: any) => {
    navigate("/transaction/weaving-yarn-issue", { state: { weavingYarnIssueDtl } });
  };

  const handleDelete = (item: any) => {
    setCurrentWeavingContract(item);
    setIsDeleteModalOpen(true);
  };

  const handleView = (item: any) => {
    setCurrentWeavingContract(item);
    setIsViewModalOpen(true);
  };

  const confirmDelete = () => {
    if (!currentWeavingContract?.id) return setIsDeleteModalOpen(false);
    const deleteParams = {
      id: currentWeavingContract.id,
      companyId: currentWeavingContract.companyId ?? selectedCompanyId
    };
    const listParams: { companyId?: number; fetchAll?: boolean } = {};
    if (selectedCompanyId) {
      listParams.companyId = selectedCompanyId;
      listParams.fetchAll = true;
    }
    dispatch(deleteWeavingYarnIssue(deleteParams))
      .then(() => dispatch(getAllWeavingYarnIssue(listParams)))
      .finally(() => setIsDeleteModalOpen(false));
  };

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setVendorFilter("");
    setContractFilter("");
    setItemNameFilter("");
    setOutwardFilter("");
  };

  
  const totalContracts = paginationInfo?.total ?? (Array.isArray(weavingYarnIssuetList) ? weavingYarnIssuetList.length : 0);
  const currentOffset = paginationInfo?.offset || 0;
  const displayStart = totalContracts === 0 ? 0 : currentOffset + 1;
  const displayEnd = Math.min(currentOffset + processedList.length, totalContracts);

  const yarnIssueRows = useMemo<YarnIssueRow[]>(() => {
    if (!currentWeavingContract?.requirements) {
      return [];
    }
    return currentWeavingContract.requirements.flatMap((requirement: any) =>
      (requirement.yarnIssues || []).map((issue: any, index: number) => {
        const availableBags = Number(issue.lotAvailableBags ?? issue.availableBags ?? 0);
        const kgsPerBag = Number(issue.kgsPerBag ?? 0);
        const conesPerBag = Number(issue.conesPerBag ?? 0);
        const conesWeight = issue.conesWeight != null
          ? Number(issue.conesWeight)
          : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / Math.max(conesPerBag, 1)).toFixed(3)) : 0);
        return {
          id: issue.id || `${requirement.id}_${index}`,
          yarnName: issue.yarnName || requirement.yarnName,
          lotNumber: issue.lotNumber || issue.lotNo || issue.lotId || '',
          availableQty: Number(issue.availableReqQty ?? issue.availableQty ?? 0),
          availableBags,
          issuedBags: Number(issue.noOfBags ?? 0),
          kgsPerBag,
          conesPerBag,
          conesWeight,
          issueQty: Number(issue.issueQty ?? 0)
        };
      })
    );
  }, [currentWeavingContract]);

  return (
    <div className="p-6 pt-16">
      {/* <h1 className="text-2xl font-semibold mb-6">Weaving Yarn Issue Management</h1> */}
  
      <DataTable
  columns={columns}
  data={processedList}
  title="Weaving Yarn Issue Details"
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
  showActions={true}
  filterPlaceholder="Search Issue No, Vendor, Contract, Item..."
  showColumnFilters={true}
  disableFullDataFetch={true}
/>

      {/* <Pagination
        currentPage={currentPage}
        totalItems={totalContracts}
        itemsPerPage={itemsPerPage}
        offset={currentOffset}
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
          <p>Are you sure you want to delete this yarn issue (ID: {currentWeavingContract?.id})?</p>
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
        title="Weaving Yarn Issue Details"
        className="max-w-4xl"
      >
        {currentWeavingContract && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">ID</p>
                <p className="font-medium">{currentWeavingContract.id}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Weaving Contract No</p>
                <p className="font-medium">
                  {(() => {
                    const cId = currentWeavingContract.weavingContractId ?? currentWeavingContract.weaving_contract_id ?? currentWeavingContract.weavingContract?.id;
                    return (cId != null ? contractMap.get(String(cId)) : null) || currentWeavingContract.weavingContractNo || currentWeavingContract.weavingContract?.weavingContractNo || (cId ? String(cId) : '-');
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Yarn Issue Date</p>
                <p className="font-medium">{formatDate(currentWeavingContract.yarnIssueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Outward No</p>
                <p className="font-medium">{currentWeavingContract.yarnIssueChallanNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Transportation Details</p>
                <p className="font-medium">{currentWeavingContract.transportationDetails}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Vendor</p>
                <p className="font-medium">
                  {(() => {
                    const vId = currentWeavingContract.vendorId ?? currentWeavingContract.vendor_id ?? currentWeavingContract.vendor?.id;
                    return (vId != null ? vendorMap.get(String(vId)) : null) || currentWeavingContract.vendorName || currentWeavingContract.vendor?.vendorName || (vId ? `Vendor ${vId}` : '-');
                  })()}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-3">Yarn Requirements</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yarn Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yarn Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grams/Meter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentWeavingContract.requirements?.map((requirement: any) => (
                      <tr key={requirement.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.yarnName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.yarnCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.gramsPerMeter}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.totalReqQty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.totalIssueQty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{requirement.balanceToIssue}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${requirement.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {requirement.activeFlag ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-3">Yarn Issue Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yarn Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Bags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Bags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kgs/Bag</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cones/Bag</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cones Weight</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Qty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {yarnIssueRows.length > 0 ? (
                      yarnIssueRows.map((issue) => (
                        <tr key={issue.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.yarnName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.lotNumber || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.availableQty.toFixed(3)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.availableBags}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.issuedBags}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.kgsPerBag.toFixed(3)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.conesPerBag}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.conesWeight.toFixed(3)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.issueQty.toFixed(3)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 text-center text-gray-500">No yarn issues found</td>
                      </tr>
                    )}
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
    </div>
  );
}