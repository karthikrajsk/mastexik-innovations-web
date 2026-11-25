import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { getAllConsignee } from "@/state/consigneeSlice";
import { deleteEmptyBeamIssue, getAllEmptyBeamIssue } from "@/state/emptyBeamIssueSlice";
import { deleteFlangeIssue, getAllFlangeIssue } from "@/state/flangeIssueSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export function FlangeIssueDetails() {

  const { flangeIssueList, pagination } = useSelector((state: RootState) => state.flangeIssue);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const [flangeIssue, setEmptyBeamIssue]: any = useState(flangeIssueList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentEmptyBeamIssue, setCurrentEmptyBeamIssue] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [companyId, setCompanyId] = useState<number | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentPage, itemsPerPage, handlePageChange, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (storedCompanyId) {
      const numericCompanyId = Number(storedCompanyId);
      setCompanyId(numericCompanyId);
      dispatch(getAllVendors({fetchAll: true} as any));
      dispatch(getAllConsignee({fetchAll: true} as any));
    }
  }, [dispatch]);

  useEffect(() => {
    if (!companyId) return;
    dispatch(getAllFlangeIssue({
      companyId,
      fetchAll: true,
      // offset: getOffset(),
      // limit: itemsPerPage,
    }));
  }, [dispatch, companyId, currentPage, getOffset, itemsPerPage]);

  // Create maps for vendor and consignee names for better performance
  const vendorMap = useMemo(() => {
    return vendorList.reduce((acc: Record<number, string>, vendor: any) => {
      acc[vendor.id] = vendor.vendorName;
      return acc;
    }, {});
  }, [vendorList]);

  const consigneeMap = useMemo(() => {
    return consigneeList.reduce((acc: Record<number, string>, consignee: any) => {
      acc[consignee.id] = consignee.consigneeName;
      return acc;
    }, {});
  }, [consigneeList]);

  const safeFlangeIssueList = useMemo(() => (
    Array.isArray(flangeIssueList) ? flangeIssueList : []
  ), [flangeIssueList]);

  const processedCityList = useMemo(() => {
    const baseSerial = pagination?.offset || 0;
    return safeFlangeIssueList.map((city: any, index: number) => ({
      ...city,
      serialNo: baseSerial + index + 1,
      // Add vendorName and consigneeName for filtering
      vendorName: vendorMap[city.vendorId] || city.vendorId,
      consigneeName: consigneeMap[city.consigneeId] || city.consigneeId,
      beamCount: Array.isArray(city.items) ? city.items.length : 0,
    }));
  }, [safeFlangeIssueList, vendorMap, consigneeMap, pagination?.offset]);

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
      { 
        Header: 'Issue Date', 
        accessor: 'flangeIssueDate',
        Cell: ({ value }: { value: string }) => formatDate(value),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            if (!dateStr) return false;
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
        Header: 'Outward Number', 
        accessor: 'flangeIssueNo' 
      },  
      { 
        Header: 'Vechile No', 
        accessor: 'vechileNo' 
      },
      {
        Header: 'Sizing Vendor',
        accessor: 'vendorName', // Use vendorName for filtering
        Cell: ({ value }: { value: string }) => {
          // Directly return the value which is already the vendor name
          return value || '-';
        }
      },
      // {
      //   Header: 'Weaver',
      //   accessor: 'consigneeName', // Use consigneeName for filtering
      //   Cell: ({ value }: { value: string }) => {
      //     // Directly return the value which is already the consignee name
      //     return value || '-';
      //   }
      // },
      {
        Header: 'No of Beam',
        accessor: 'beamCount',
        width: 120,
        disableFilters: true,
      },
    ],
    [] // Remove vendorMap and consigneeMap from dependencies since we're using the precomputed values
  );

  const handleAdd = () => {
    setModalMode('add');
    setCurrentEmptyBeamIssue(null);
    navigate("/transaction/flange-issue");
  };

  const handleEdit = (emptyBeamIssuedetail: any) => {
    console.log(emptyBeamIssuedetail)
    setModalMode('edit');
    setCurrentEmptyBeamIssue(flangeIssue);
    setIsModalOpen(true);
    navigate("/transaction/flange-issue", { state: { emptyBeamIssuedetail } });
  };

  const handleDelete = (category: any) => {
    setCurrentEmptyBeamIssue(category);
    setIsDeleteModalOpen(true);
  };

  const handleView = (category: any) => {
    setCurrentEmptyBeamIssue(category);
    setIsViewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentEmptyBeamIssue || !companyId) return;

    try {
      await dispatch(deleteFlangeIssue({ id: currentEmptyBeamIssue.id, companyId })).unwrap();
      const currentTotal = pagination?.total || 0;
      const updatedTotal = Math.max(0, currentTotal - 1);
      const maxPage = Math.max(0, Math.ceil(updatedTotal / itemsPerPage) - 1);

      if (currentPage > maxPage) {
        handlePageChange(maxPage);
      } else {
        await dispatch(getAllFlangeIssue({
          companyId,
          fetchAll: true,
          // offset: getOffset(),
          // limit: itemsPerPage,
        }));
      }
    } catch (error) {
      console.error("Error deleting FlangeIssue:", error);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Empty Beam Issue Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search Empty Beam..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //  totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
      />
{/* 
      <Pagination
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
        title="Flange Issue Details"
      >
        {currentEmptyBeamIssue && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Outward Number</p>
                <p className="font-medium">{currentEmptyBeamIssue.emptyBeamNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Issue Date</p>
                <p className="font-medium">{currentEmptyBeamIssue.emptyBeamIssueDate}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Vechile No</p>
                <p className="font-medium">{currentEmptyBeamIssue.vechileNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sizing Vendor Name</p>
                <p className="font-medium">{vendorList.find((v: any) => v.id === currentEmptyBeamIssue.vendorId)?.vendorName || currentEmptyBeamIssue.vendorId}</p>
              </div>
              {/* <div>
                <p className="text-sm text-secondary-500">Weaver Name</p>
                <p className="font-medium">{consigneeList.find((v: any) => v.id === currentEmptyBeamIssue.consigneeId)?.consigneeName || currentEmptyBeamIssue.consigneeId}</p>
              </div> */}
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
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete FlangeIssue"?</p>
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