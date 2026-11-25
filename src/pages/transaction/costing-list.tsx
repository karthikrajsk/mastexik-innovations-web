import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from "@/state/store";
import { getAllAgentMasters } from "@/state/agentMasterSlice";
import { getAllCostings, deleteCosting, Costing } from "@/state/costingSlice";
import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";

export default function CostingList() {
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { costingList, paginationInfo, loading } = useSelector((state: RootState) => state.costing);
  const { agentMasterList } = useSelector((state: RootState) => state.agentMaster);
  const [viewingCosting, setViewingCosting] = useState<Costing | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentCosting, setCurrentCosting] = useState<Costing | null>(null);

  const safeCostingList: Costing[] = Array.isArray(costingList) ? costingList : [];

  useEffect(() => {
    const companyId = localStorage.getItem('companyId') ? parseInt(localStorage.getItem('companyId')!) : localStorage.getItem('selectedCompanyId') ? parseInt(localStorage.getItem('selectedCompanyId')!) : undefined;
    if (companyId) {
      dispatch(getAllCostings({ 
        // offset: getOffset(), 
        // limit: itemsPerPage,
        fetchAll: true,
        companyId
      }));
    }
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  useEffect(() => {
    dispatch(getAllAgentMasters({ fetchAll: true }));
  }, [dispatch]);

  const agentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(agentMasterList)) {
      agentMasterList.forEach((agent: any) => {
        if (agent?.id != null) {
          const name = agent.agentName || agent.name || "";
          if (name) {
            map[String(agent.id)] = name;
          }
        }
      });
    }
    return map;
  }, [agentMasterList]);

  const processedCostings = useMemo(() => {
    return safeCostingList.filter((costing: any) => costing.activeFlag !== false).map((costing: Costing, index: number) => ({
      ...costing,
      serialNo: (paginationInfo?.offset || 0) + index + 1,
      agentName: agentNameById[String(costing.agentId ?? "")] || costing.agent || "N/A",
    }));
  }, [safeCostingList, paginationInfo?.offset, agentNameById]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
     
      {
        Header: "Date",
        accessor: "date",
        Cell: ({ value }: any) => formatDate(value),
      },
      {
        Header: "Customer Name",
        accessor: "customerName",
      },
       {
        Header: "Costing No",
        accessor: "costingNo",
      },
      {
        Header: "Agent",
        accessor: "agentName",
      },
      {
        Header: "Sort No - Construction",
        accessor: "fabricCodeQuality",
      },
      {
        Header: "Target Price",
        accessor: "targetPrice",
        Cell: ({ value, row }: any) => {
          const price = value || row?.original?.finalCostingData?.targetPrice;
          return price?.toFixed(2) || 'N/A';
        },
      },
    ],
    [],
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleAddNew = () => {
    navigate('/transaction/costing-form');
  };

  const handleEdit = (costing: Costing) => {
    const parentId = costing.id;
    const childIds: number[] = [];
    
    const queryParams = new URLSearchParams();
    queryParams.set('parentId', String(parentId));
    if (childIds.length > 0) {
      childIds.forEach(childId => queryParams.append('childId', String(childId)));
    }
    
    navigate(`/transaction/costing-form?${queryParams.toString()}`, { state: { costing } });
  };

  const handleView = (costing: Costing) => {
    setViewingCosting(costing);
  };

  const handleDelete = (costing: Costing) => {
    setCurrentCosting(costing);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (currentCosting?.id) {
      const companyId = localStorage.getItem('companyId') ? parseInt(localStorage.getItem('companyId')!) : localStorage.getItem('selectedCompanyId') ? parseInt(localStorage.getItem('selectedCompanyId')!) : undefined;
      if (!companyId) {
        alert("Company ID not found");
        return;
      }
      dispatch(deleteCosting({ id: currentCosting.id, companyId })).then(() => {
        resetPage();
        dispatch(getAllCostings({ fetchAll: true, companyId }));
      });
      setIsDeleteModalOpen(false);
      setCurrentCosting(null);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    resetPage();
  };

  const totalPages = paginationInfo ? Math.ceil(paginationInfo.total / itemsPerPage) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div>
        {/* <div className="mb-4 flex items-center justify-end">
          
          <div className="flex items-center gap-4">
            <div>
              <label className="mr-2 text-sm">Items per page:</label>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span className="text-sm text-gray-600">
              Showing {(paginationInfo?.offset || 0) + 1} - {Math.min((paginationInfo?.offset || 0) + itemsPerPage, paginationInfo?.total || 0)} of {paginationInfo?.total || 0}
            </span>
          </div>
        </div> */}

        <DataTable
          columns={columns}
          data={processedCostings}
          title="Costing List"
          onAdd={handleAddNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          showActions={true}
          showColumnFilters={true}
          filterPlaceholder="Search costings..."
          disableFullDataFetch={true}
        />

        {/* <Pagination
          currentPage={currentPage}
          totalItems={paginationInfo?.total || 0}
          itemsPerPage={itemsPerPage}
          offset={paginationInfo?.offset || 0}
          hasNext={!!paginationInfo?.next}
          hasPrev={!!paginationInfo?.prev}
          onPageChange={handlePageChange}
        /> */}
      </div>

      <Modal
        isOpen={viewingCosting !== null}
        onClose={() => setViewingCosting(null)}
        title="Costing Details"
      >
        {viewingCosting && (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800">Header Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Costing No.</label>
                  <p className="text-gray-900">{viewingCosting.costingNo || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-gray-900">{formatDate(viewingCosting.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Name</label>
                  <p className="text-gray-900">{viewingCosting.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Agent</label>
                  <p className="text-gray-900">{viewingCosting.agent || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sort No - Construction</label>
                  <p className="text-gray-900">{viewingCosting.fabricCodeQuality || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target Price</label>
                  <p className="text-gray-900">{(viewingCosting.targetPrice || viewingCosting.finalCostingData?.targetPrice)?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>
            </div>

            {viewingCosting.yarnDetails && viewingCosting.yarnDetails.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800">Yarn Details</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Warp/Weft</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Yarn Count</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Rate/Unit</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Processing Cost</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Content</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Yarn Type</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">EPI</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">PPI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingCosting.yarnDetails.map((yarn, index) => (
                        <tr key={yarn.id || index}>
                          <td className="border border-gray-300 px-3 py-2">{yarn.warpWeft}</td>
                          <td className="border border-gray-300 px-3 py-2">{yarn.yarnCount}</td>
                          <td className="border border-gray-300 px-3 py-2">{yarn.ratePerUnit}</td>
                          <td className="border border-gray-300 px-3 py-2">{yarn.yarnProcessingCost || 'N/A'}</td>
                          <td className="border border-gray-300 px-3 py-2">{yarn.content || 'N/A'}</td>
                          <td className="border border-gray-300 px-3 py-2">{yarn.yarnType || 'N/A'}</td>
                          <td className="border border-gray-300 px-3 py-2">{yarn.epi}</td>
                          <td className="border border-gray-300 px-3 py-2">{yarn.ppi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewingCosting.fabricDetails && (
              <div>
                <h4 className="text-lg font-semibold mb-3 text-gray-800">Fabric Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Grey Width</label>
                    <p className="text-gray-900">{viewingCosting.fabricDetails.greyWidth}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">EPI Difference</label>
                    <p className="text-gray-900">{viewingCosting.fabricDetails.epiDifference}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">EPI on Table</label>
                    <p className="text-gray-900">{viewingCosting.fabricDetails.epiOnTable}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reed Space</label>
                    <p className="text-gray-900">{viewingCosting.fabricDetails.reedSpace}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Ends</label>
                    <p className="text-gray-900">{viewingCosting.fabricDetails.totalEnds}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Warp Crimp %</label>
                    <p className="text-gray-900">{viewingCosting.fabricDetails.warpCrimp}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setViewingCosting(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
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
          <p className="text-gray-700">Are you sure you want to delete the costing "{currentCosting?.costingNo}"?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
