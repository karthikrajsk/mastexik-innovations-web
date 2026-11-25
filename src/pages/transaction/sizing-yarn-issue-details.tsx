// sizing-yarn-issue-details.tsx (Fixed Version)
import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { deleteSizingYarnIssue, getAllSizingYarnIssue } from "@/state/sizingYarnIssueSlice";
import { AppDispatch, RootState } from "@/state/store";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { Pagination, usePagination } from "@/components/common/Pagination";

interface SizingYarnIssueEntry {
  id: number;
  vendorId: number;
  sizingPlanId: number;
  transportationDetails: string;
  termsConditionsId: number;
  fabricDetails: string | null;
  sizingYarnIssueDate: string;
  activeFlag: boolean;
  requirements: SizingYarnRequirement[];
  sizingYarnIssue: SizingYarnIssueItem[]; // Fixed: Make sure this matches your DTO
}

interface SizingYarnRequirement {
  id: number;
  yarnName: string;
  yarnCount: number;
  gramsPerMeter: number;
  totalReqQty: number;
  totalIssueQty: number;
  balanceToIssue: number;
  activeFlag: boolean;
  fabricDetails?: string | null;
}

interface SizingYarnIssueItem {
  id: number;
  lotId: number;
  yarnName: string;
  lotNumber?: string;
  availableReqQty: number;
  availableBags?: number;
  lotAvailableBags?: number;
  noOfBags?: number;
  kgsPerBag?: number;
  conesPerBag?: number;
  conesWeight?: number;
  perBabyConeWeight?: number;
  noOfCones?: number;
  availableCones?: number;
  issueQty: number;
  activeFlag: boolean;
}

const resolveFabricDetails = (issue?: SizingYarnIssueEntry | null) => {
  if (!issue) {
    return '';
  }
  if (issue.fabricDetails && issue.fabricDetails.trim()) {
    return issue.fabricDetails;
  }
  const details = (issue.requirements || [])
    .map((req) => req.fabricDetails)
    .filter((detail): detail is string => Boolean(detail && detail.trim()))
    .map((detail) => detail.trim());
  return Array.from(new Set(details)).join(', ');
};

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

export function SizingYarnIssueDetails() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Fixed: Properly access the state
  const { sizingYarnIssuetList,paginationInfo} = useSelector((state: RootState) => state.sizingYarnIssue);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<SizingYarnIssueEntry | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { vendorList = [] } = useSelector((state: RootState) => state.vendor);
  const { sizingPlanList = [] } = useSelector((state: RootState) => state.sizingPlan);

  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  
  useEffect(() => {
    const companyId = getSelectedCompanyId();
    if (!companyId) return;

    const companyParams = { companyId, fetchAll: true };
    const listParams = { companyId};
    dispatch(getAllSizingYarnIssue(listParams));
    dispatch(getAllVendors(companyParams));
    dispatch(getAllSizingPlan(companyParams));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  const processedDataList = useMemo(() => {
    return sizingYarnIssuetList.map((item: any, index: number) => ({
      ...item,
      serialNo: (paginationInfo?.offset ?? 0) + index + 1
    }));
  }, [sizingYarnIssuetList, paginationInfo?.offset]);

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
        Header: 'Issue Date',
        accessor: 'sizingYarnIssueDate',
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
        Header: 'Issue No',
        accessor: 'issueNo',
        // disableFilters: true
      },
      {
        Header: 'Sizing Vendor',
        accessor: 'vendorId',
        Cell: ({ value }: { value: number }) => {
          const vendor = vendorList.find((v: any) => v.id === value);
          return vendor ? vendor.vendorName : `Vendor ${value}`;
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
          return rows.filter(row => row.values[columnIds[0]] === parseInt(filterValue));
        }
      },
      {
        Header: 'Sizing Plan No',
        accessor: 'sizingPlanId',
        Cell: ({ value }: { value: number }) => {
          const plan = sizingPlanList.find((p: any) => p.id === value);
          return plan ? plan.sizingPlanNo : `Plan ${value}`;
        },
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <select
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
             className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
          >
            <option value="">All</option>
            {sizingPlanList?.map((plan: any) => (
              <option key={plan.id} value={plan.id}>{plan.sizingPlanNo}</option>
            ))}
          </select>
        ),
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue) return rows;
          return rows.filter(row => row.values[columnIds[0]] === parseInt(filterValue));
        }
      },
      {
        Header: 'Fabric Details',
        accessor: 'fabricDetails',
        Cell: ({ value, row }: { value: string | null; row: any }) => {
          const display = value && value.trim() ? value : resolveFabricDetails(row.original);
          return display || 'N/A';
        },
      },
      
      {
        Header: 'Issued Quantity',
        accessor: 'totalIssuedQty',
        Cell: ({ row }: any) => {
          // Calculate total issued quantity from sizingYarnIssue array
          const issues = row.original.sizingYarnIssue || [];
          const total = issues.reduce((sum: number, i: SizingYarnIssueItem) => 
            sum + (i.issueQty || 0), 0
          );
          return total.toFixed(2);
        },
        // disableFilters: true
      },
      {
        Header: 'Print',
        id: 'print',
        Cell: ({ row }: any) => {
          const handlePrint = () => {
            const printData = { ...row.original, type: 'sizing' };
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
        disableGlobalFilter: true
      },
    ],
    [vendorList, sizingPlanList, navigate]
  );

  const handleAdd = () => {
    setModalMode('add');
    setCurrentIssue(null);
    navigate("/transaction/sizing-yarn-issue");
  };

  const handleEdit = (sizingYarnIssueDtl: any) => {
    setModalMode('edit');
    setCurrentIssue(sizingYarnIssueDtl);
    navigate("/transaction/sizing-yarn-issue", { state: { sizingYarnIssueDtl } });
  };

  const handleDelete = (issue: SizingYarnIssueEntry) => {
    setCurrentIssue(issue);
    setIsDeleteModalOpen(true);
  };

  const handleView = (issue: SizingYarnIssueEntry) => {
    setCurrentIssue(issue);
    setIsViewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentIssue) {
      return;
    }
    const companyId = getSelectedCompanyId();
    try {
      await dispatch(deleteSizingYarnIssue({ id: currentIssue.id, companyId })).unwrap();
      const refreshParams = companyId
        ? { companyId, offset: getOffset(), limit: itemsPerPage }
        : { offset: getOffset(), limit: itemsPerPage };
      dispatch(getAllSizingYarnIssue(refreshParams));
    } catch (error) {
      console.error('Failed to delete sizing yarn issue', error);
    } finally {
      setIsDeleteModalOpen(false);
      setCurrentIssue(null);
    }
  };

  return (
    <div className="p-6">
      <DataTable
        columns={columns}
        data={processedDataList}
        title="Sizing Yarn Issue List"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search yarn issues..."
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={paginationInfo?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
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
        title="Sizing Yarn Issue Details"
        className="max-w-4xl"
      >
        {currentIssue && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">ID</p>
                <p className="font-medium">{currentIssue.id}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sizing Vendor</p>
                <p className="font-medium">
                  {vendorList.find((v: any) => v.id === currentIssue.vendorId)?.vendorName || `Vendor ${currentIssue.vendorId}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Issue Date</p>
                <p className="font-medium">{formatDate(currentIssue.sizingYarnIssueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Fabric Details</p>
                <p className="font-medium">{resolveFabricDetails(currentIssue) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Transport Details</p>
                <p className="font-medium">{currentIssue.transportationDetails || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sizing Plan</p>
                <p className="font-medium">
                  {sizingPlanList.find((p: any) => p.id === currentIssue.sizingPlanId)?.sizingPlanNo || `Plan ${currentIssue.sizingPlanId}`}
                </p>
              </div>
            </div>

            {/* Yarn Requirements Section */}
            <div className="mt-6">
              <h3 className="font-medium text-lg mb-3">Yarn Requirement Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yarn Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yarn Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grams Per Meter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Req Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Issue Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance to Issue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(currentIssue.requirements || []).length > 0 ? (
                      (currentIssue.requirements || []).map((req, index) => (
                        <tr key={req.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.yarnName || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.yarnCount || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.gramsPerMeter || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.totalReqQty || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.totalIssueQty || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.balanceToIssue || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No requirements found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Yarn Issue Details Section */}
            <div className="mt-6">
              <h3 className="font-medium text-lg mb-3">Yarn Issue Details</h3>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Baby Cone Wt</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Qty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(currentIssue.sizingYarnIssue || []).length > 0 ? (
                      (currentIssue.sizingYarnIssue || []).map((issue, index) => {
                        const availBags = Number(issue.lotAvailableBags ?? issue.availableBags ?? 0);
                        const cPerBag = Number(issue.conesPerBag ?? 0);
                        return (
                          <tr key={issue.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.yarnName || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.lotNumber || issue.lotId || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(issue.availableReqQty ?? 0).toFixed(3)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{availBags}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(issue.noOfBags ?? 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(issue.kgsPerBag ?? 0).toFixed(3)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cPerBag}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(issue.conesWeight ?? 0).toFixed(3)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(issue.perBabyConeWeight || 0.01).toFixed(3)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(issue.issueQty ?? 0).toFixed(3)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                          No yarn issues found
                        </td>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this yarn issue?</p>
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