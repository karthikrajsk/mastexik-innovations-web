import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { deleteYarnReturn, getAllYarnReturns } from "@/state/yarnReturnSlice";

interface YarnReturnItem {
  id: number;
  yarnReturnId: number;
  yarnId: number;
  yarnName: string;
  noOfBags: number;
  totalKgs: number;
  lotNo: string | null;
  activeFlag: boolean;
}

interface YarnReturnDetail {
  id: number;
  inwardDate: string;
  inwardNumber: string;
  inwardType: string;
  orderNo: string;
  vendorId: number;
  vendorName: string;
  warehouseId: number;
  issuedQty: number;
  dcNumber: string;
  dcDate: string;
  remarks: string | null;
  activeFlag: boolean;
  yarnReturnItems: YarnReturnItem[];
}

const getSelectedCompanyId = () => {
  if (typeof window === "undefined") {
    return undefined;
  }
  const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
  return storedCompanyId ? Number(storedCompanyId) : undefined;
};

export function YarnReturnDetails() {
  const { yarnReturnList, paginationInfo, loading } = useSelector((state: RootState) => state.yarnReturn);
  
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentYarnReturn, setCurrentYarnReturn] = useState<YarnReturnDetail | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    const companyId = getSelectedCompanyId();
    dispatch(getAllYarnReturns({ 
      // offset: getOffset(), 
      // limit: itemsPerPage,
      fetchAll: true,
      companyId
    }));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  // Helper function to parse DD/MM/YYYY format date
  const parseDateFromString = (dateString: string): Date => {
    if (!dateString) return new Date();
    const [day, month, year] = dateString.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const processedYarnReturnList = useMemo(() => {
    if (!Array.isArray(yarnReturnList)) {
      return [];
    }
    const getUniqueYarnNames = (items?: YarnReturnItem[]) => {
      if (!Array.isArray(items) || !items.length) return "N/A";
      const seen = new Set<string>();
      const orderedUnique: string[] = [];
      items.forEach((item) => {
        const name = (item?.yarnName || "").trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          orderedUnique.push(name);
        }
      });
      return orderedUnique.length ? orderedUnique.join(", ") : "N/A";
    };
    return yarnReturnList.filter((yarnReturn: YarnReturnDetail) => yarnReturn.activeFlag === true).map((yarnReturn: YarnReturnDetail, index: number) => ({
      ...yarnReturn,
      serialNo: (paginationInfo?.offset || 0) + index + 1,
      yarnNames: getUniqueYarnNames(yarnReturn.yarnReturnItems),
      receivedQty: yarnReturn.yarnReturnItems?.reduce((total, item) => total + item.totalKgs, 0) || 0
    }));
  }, [yarnReturnList, paginationInfo?.offset]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: 'Inward Date',
        accessor: 'inwardDate',
        Cell: ({ value }: { value: string }) => {
          const date = parseDateFromString(value);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        Filter: ({ column: { filterValue = {}, setFilter } }: any) => (
          <div className="flex flex-col space-y-1">
              <p className="text-sm font-normal">From</p>
            <input
              type="date"
              value={filterValue.from || ''}
              onChange={e => setFilter({ ...filterValue, from: e.target.value })}
              placeholder="From"
              className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
              <p className="text-sm font-normal">To</p>
            <input
              type="date"
              value={filterValue.to || ''}
              onChange={e => setFilter({ ...filterValue, to: e.target.value })}
              placeholder="To"
              className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        ),
      },
      {
        Header: 'Inward Number',
        accessor: 'inwardNumber',
        width: 120,
        filter: 'includes',
      },
      {
        Header: 'Inward Type',
        accessor: 'inwardType',
        Cell: ({ value }: { value: string }) => {
          const typeMap: { [key: string]: string } = {
            'SIZING_YARN_RETURN': 'SIZING_YARN_RETURN',
            'WEFT_YARN_RETURN': 'WEAVING_YARN_RETURN'
          };
          return typeMap[value] || value;
        },
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <select
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All</option>
            <option value="SIZING_YARN_RETURN">Sizing Yarn Return</option>
            <option value="WEFT_YARN_RETURN">Weft Yarn Return</option>
          </select>
        ),
      },
      {
        Header: 'Order No',
        accessor: 'orderNo',
        filter: 'includes',
      },
      {
        Header: 'Vendor',
        accessor: 'vendorName',
        filter: 'includes',
      },
      {
        Header: 'Yarn Name',
        accessor: 'yarnNames',
        Cell: ({ value }: { value: string }) => (
          <div className="max-w-xs truncate" title={value}>
            {value}
          </div>
        ),
        filter: 'includes',
      },
      {
        Header: 'Received Qty (Kgs)',
        accessor: 'receivedQty',
        Cell: ({ value }: { value: number }) => `${value.toFixed(2)} kgs`,
        width: 120,
      },
 {
        Header: 'Dc Number',
        accessor: 'dcNumber',
      },
       {
        Header: 'Dc Date',
        accessor: 'dcDate',
      },
      // {
      //   Header: 'Status',
      //   accessor: 'activeFlag',
      //   Cell: ({ value }: { value: boolean }) => (
      //     <span
      //       className={`px-2 py-1 rounded-full text-xs ${
      //         value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      //       }`}
      //     >
      //       {value ? 'Active' : 'Inactive'}
      //     </span>
      //   ),
      //   Filter: ({ column: { filterValue, setFilter } }: any) => (
      //     <select
      //       value={filterValue || ''}
      //       onChange={e => setFilter(e.target.value)}
      //       className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      //     >
      //       <option value="">All</option>
      //       <option value="true">Active</option>
      //       <option value="false">Inactive</option>
      //     </select>
      //   ),
      // },
    ],
    []
  );

  const handleAdd = () => {
    navigate("/transaction/yarn-return");
  };

  const handleEdit = (yarnReturn: YarnReturnDetail) => {
    const parentId = yarnReturn.id;
    const childIds: number[] = [];
    if (yarnReturn.yarnReturnItems) {
      childIds.push(...(yarnReturn.yarnReturnItems as any[]).map(item => item.id).filter(Boolean));
    }
    
    const queryParams = new URLSearchParams();
    queryParams.set('parentId', String(parentId));
    if (childIds.length > 0) {
      childIds.forEach(childId => queryParams.append('childId', String(childId)));
    }
    
    navigate(`/transaction/yarn-return?${queryParams.toString()}`, { state: { yarnReturnDtl: yarnReturn } });
  };

  const handleView = (yarnReturn: YarnReturnDetail) => {
    setCurrentYarnReturn(yarnReturn);
    setIsViewModalOpen(true);
  };

  const handleDelete = (yarnReturn: YarnReturnDetail) => {
    setCurrentYarnReturn(yarnReturn);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentYarnReturn) return;

    try {
      const companyId = getSelectedCompanyId();
      await dispatch(deleteYarnReturn({ id: currentYarnReturn.id, companyId })).unwrap();
      resetPage();
      await dispatch(getAllYarnReturns({ fetchAll: true, companyId }));
    } catch (error) {
      console.error("Error deleting Yarn Return:", error);
    }

    setIsDeleteModalOpen(false);
  };

  const totalPages = paginationInfo ? Math.ceil(paginationInfo.total / itemsPerPage) : 0;

  return (
    <div className="p-6 pt-16">
      {/* <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Yarn Return Details</h1>
        
        <span className="text-sm text-gray-600">
          Showing {(paginationInfo?.offset || 0) + 1} - {Math.min((paginationInfo?.offset || 0) + itemsPerPage, paginationInfo?.total || 0)} of {paginationInfo?.total || 0}
        </span>
      </div> */}

      <DataTable
        columns={columns}
        data={processedYarnReturnList}
        title="Yarn Return Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search yarn returns..."
        disableFullDataFetch={true}
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

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Yarn Return Details - ${currentYarnReturn?.inwardNumber || ''}`}
        className="max-w-4xl"
      >
        {currentYarnReturn && (
          <div className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Inward Number</p>
                <p className="font-medium">{currentYarnReturn.inwardNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inward Date</p>
                <p className="font-medium">
                  {parseDateFromString(currentYarnReturn.inwardDate).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inward Type</p>
                <p className="font-medium">
                  {currentYarnReturn.inwardType === 'SIZING_YARN_RETURN' 
                    ? 'Sizing Yarn Return' 
                    : 'Weft Yarn Return'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order No</p>
                <p className="font-medium">{currentYarnReturn.orderNo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vendor</p>
                <p className="font-medium">{currentYarnReturn.vendorName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Issued Quantity</p>
                <p className="font-medium">{currentYarnReturn.issuedQty} kgs</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium">{currentYarnReturn.remarks || 'N/A'}</p>
              </div>
               <div>
                <p className="text-sm text-gray-500">Dc Number</p>
                <p className="font-medium">{currentYarnReturn.dcNumber}</p>
              </div>
               <div>
                <p className="text-sm text-gray-500">Dc Date</p>
                <p className="font-medium">{currentYarnReturn.dcDate}</p>
              </div>
{/*              
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    currentYarnReturn.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {currentYarnReturn.activeFlag ? 'Active' : 'Inactive'}
                </span>
              </div> */}
            </div>

            {/* Yarn Items Section */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3">Yarn Return Items</h3>
              {currentYarnReturn.yarnReturnItems?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Yarn Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">No of Bags</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Kgs</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot No</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentYarnReturn.yarnReturnItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.yarnName}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.noOfBags}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.totalKgs} kgs</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.lotNo || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No yarn items found</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this yarn return?</p>

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