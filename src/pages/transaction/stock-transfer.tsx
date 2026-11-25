// StockTransfer.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data/DataTable';
import { Pagination, usePagination } from '@/components/common/Pagination';
import { Modal } from '@/components/ui/Modal';
import { getAllStockTransfers, deleteStockTransfer, StockTransfer as StockTransferType } from '@/state/stockTransferSlice';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/state/store';
import { getAllFabricMasters } from '@/state/fabricMasterSlice';
import { getAllYarnMasters } from '@/state/yarnSlice';
import { getAllWarehouse } from '@/state/warehouseSlice';

export default function StockTransferList() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get reload state from navigation
  const reloadState = location.state?.reload;
  
  const { list: stockTransferList = [], loading, paginationInfo } = useSelector((state :any) => state.StockTransfer);
  const fabricMasterList = useSelector((state: RootState) => state.fabricMaster.fabricMasterList || []);
  const yarnMasterList = useSelector((state: RootState) => state.yarn.yarnList || []);
  const warehouseList = useSelector((state: RootState) => state.warehouse.warehouseList || []);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockTransferType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { currentPage, setItemsPerPage ,itemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });

  // Fetch data on component mount AND when reloadState/currentPage changes
  useEffect(() => {
    const refreshList = async () => {
      try {
        const storedCompanyId = typeof window !== 'undefined'
          ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
          : null;
        const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
        
        console.log('Loading stock transfers...', reloadState);
        await dispatch(getAllStockTransfers({ 
          // offset: getOffset(), 
          // limit: itemsPerPage, 
          companyId ,
          fetchAll: true
        })).unwrap();
      } catch (error) {
        console.error('Error fetching stock transfers:', error);
      }
    };
    refreshList();
  }, [dispatch, reloadState, currentPage, itemsPerPage, getOffset]);

  // Clear location state after using it to prevent infinite re-renders
  useEffect(() => {
    if (reloadState) {
      // Clear the state to prevent infinite refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [reloadState, navigate, location.pathname]);

  // Load master data if not already loaded
  useEffect(() => {
    if (fabricMasterList.length === 0) {
      dispatch(getAllFabricMasters({}));
    }
    if (yarnMasterList.length === 0) {
      dispatch(getAllYarnMasters({}));
    }
    if (warehouseList.length === 0) {
      dispatch(getAllWarehouse({}));
    }
  }, [dispatch, fabricMasterList.length, yarnMasterList.length, warehouseList.length]);

  const getItemNameLabel = (item: StockTransferType): string => {
    if (!item) return '';
    return String(item.itemName || '');
  };

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const storedCompanyId = typeof window !== 'undefined'
        ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
        : null;
      const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
      
      await dispatch(getAllStockTransfers({ companyId, fetchAll: true })).unwrap();
    } catch (error) {
      console.error('Error refreshing stock transfers:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdd = () => {
    navigate('/transaction/stock-transfer-details');
  };

  const handleEdit = (item: StockTransferType) => {
    navigate('/transaction/stock-transfer-details', { state: { stockTransfer: item } });
  };

  const handleView = (item: StockTransferType) => {
    setSelectedItem(item);
  };

  const handleDeleteClick = (item: StockTransferType) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedItem?.id) {
      try {
        const storedCompanyId = typeof window !== 'undefined'
          ? (localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany'))
          : null;
        const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
        
        await dispatch(deleteStockTransfer({ id: selectedItem.id, companyId })).unwrap();
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
        // Refresh the list after delete - reset to first page
        resetPage();
        await dispatch(getAllStockTransfers({ offset: 0, limit: itemsPerPage, companyId })).unwrap();
      } catch (error: any) {
        console.error('Error deleting Stock Transfer:', error);
      }
    }
  };

  const columns = useMemo(() => [
    {
      Header: 'Sl.No',
      accessor: 'serialNo',
      width: 50,
      disableFilters: true,
      disableGlobalFilter: true,
    },
     {
      Header: 'Date',
      accessor: 'transferDate',
      Cell: ({ value }: any) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      },
    },
      {
      Header: 'Stock Transfer No',
      accessor: 'stockTransferNo',
    },
   
    {
      Header: 'From Godown',
      accessor: 'fromGodownName',
    },
    {
      Header: 'To Godown',
      accessor: 'toGodownName',
    },
    {
      Header: 'Goods Type',
      accessor: 'goodsType',
    },
    {
      Header: 'Item Name',
      accessor: 'itemName',
    },
    {
      Header: 'Quantity',
      accessor: 'quantity',
      Cell: ({ value, row }: any) => (
        <span>
          {value} {row?.original?.goodsType === 'Fabric' ? 'meters' : 'kg'}
        </span>
      ),
    },
  ], []);

  // Columns for fabric items in view modal
  const fabricItemsColumns = useMemo(() => [
    {
      Header: 'S.No',
      accessor: 'slNo',
      Cell: ({ row }: any) => row.index + 1,
    },
    {
      Header: 'Roll No',
      accessor: 'rollNo',
    },
    {
      Header: 'Piece No',
      accessor: 'pieceNo',
    },
    {
      Header: 'Meter',
      accessor: 'meter',
    },
    {
      Header: 'Net Weight',
      accessor: 'netWeight',
    },
    {
      Header: 'Avg Weight',
      accessor: 'avgWeight',
    },
  ], []);

  // Columns for yarn items in view modal
  const yarnItemsColumns = useMemo(() => [
    {
      Header: 'S.No',
      accessor: 'slNo',
      Cell: ({ row }: any) => row.index + 1,
    },
    {
      Header: 'Inward No',
      accessor: 'inwardNo',
    },
    {
      Header: 'Mill Name',
      accessor: 'millName',
    },
    {
      Header: 'Lot No',
      accessor: 'lotNo',
    },
    {
      Header: 'No of Bags',
      accessor: 'noOfBags',
    },
    {
      Header: 'Kg/Bag',
      accessor: 'kgsPerBag',
      Cell: ({ value }: any) => Number(value ?? 0).toFixed(3),
    },
    {
      Header: 'Cones Per Bag',
      accessor: 'conesPerBag',
      Cell: ({ value }: any) => Number(value ?? 0),
    },
    {
      Header: 'Cones weight',
      accessor: 'conesWeight',
      Cell: ({ value }: any) => Number(value ?? 0).toFixed(3),
    },
    {
      Header: 'Total Quantity',
      accessor: 'totalQuantity',
      Cell: ({ value }: any) => Number(value ?? 0).toFixed(3),
    },
  ], []);

  // Safely derive items array for the selected item (avoid undefined)
  const itemsForSelected = useMemo(() => {
    if (!selectedItem) return [];
    const items = selectedItem.goodsType === 'Fabric' ? selectedItem.fabricItems : selectedItem.yarnItems;
    if (!Array.isArray(items)) return [];

    if (selectedItem.goodsType !== 'Yarn') {
      return items;
    }

    return items.map((item: any) => {
      const kgsPerBag = Number(item.kgsPerBag ?? item.kgPerBag ?? 0);
      const conesPerBag = Number(item.conesPerBag ?? 0);
      const conesWeight = item.conesWeight != null
        ? Number(item.conesWeight)
        : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
      return {
        ...item,
        kgsPerBag,
        conesPerBag,
        conesWeight
      };
    });
  }, [selectedItem]);

  // Add serial numbers to list data and ensure required fields exist
  const dataWithSerialNo = useMemo(() => {
    return Array.isArray(stockTransferList) ? stockTransferList.map((item, index) => {
      // Find godown names if not in response
      const fromGodownName = item.fromGodownName || 
        warehouseList.find((w: any) => String(w.id) === String(item.fromGodownId || item.fromGodown))?.name || 
        warehouseList.find((w: any) => String(w.id) === String(item.fromGodownId || item.fromGodown))?.warehouseName || 
        String(item.fromGodown || 'N/A');
      
      const toGodownName = item.toGodownName || 
        warehouseList.find((w: any) => String(w.id) === String(item.toGodownId || item.toGodown))?.name || 
        warehouseList.find((w: any) => String(w.id) === String(item.toGodownId || item.toGodown))?.warehouseName || 
        String(item.toGodown || 'N/A');
      
      let itemName = item.itemName;
      if ((!itemName || itemName === '') && item.goodsType === 'Item' && Array.isArray(item.itemGoods) && item.itemGoods.length > 0) {
        itemName = item.itemGoods.map((ig: any) => ig.itemName).filter(Boolean).join(', ');
      }

      return {
        ...item,
        serialNo: (paginationInfo?.offset || 0) + index + 1,
        fromGodownName,
        toGodownName,
        transferDate: item.transferDate || item.date,
        itemName,
      };
    }) : [];
  }, [stockTransferList, warehouseList, paginationInfo]);

  const totalItems = paginationInfo?.total ?? dataWithSerialNo.length;
  const currentOffset = paginationInfo?.offset || 0;
  const hasNext = !!paginationInfo?.next;
  const hasPrev = !!paginationInfo?.prev;

  return (
    <div className="p-4">
    
      {/* Show data table */}
      <DataTable
        columns={columns}
        data={dataWithSerialNo}
        title="Stock Transfer List"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDeleteClick}
        showActions={true}
        showAddActions={true}
        showExport={true}
        showColumnFilters={true}
        filterPlaceholder="Search by godown, item name..."
        disableFullDataFetch={true}
        //  initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={paginationInfo?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        // isLoading={loading && stockTransferList.length === 0}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        offset={currentOffset}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onPageChange={handlePageChange}
      /> */}
      
      {/* {!loading && dataWithSerialNo.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 pt-16 space-y-4">
          <div className="text-lg text-gray-600">No stock transfers found</div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Stock Transfer
          </Button>
        </div>
      )} */}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-700">Are you sure you want to delete this stock transfer record?</p>
          {selectedItem && (
            <div className="bg-gray-50 p-4 rounded border">
              <div className="space-y-2">
                <p><strong>Date:</strong> {selectedItem.transferDate ? new Date(selectedItem.transferDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>From Godown:</strong> {selectedItem.fromGodownName || selectedItem.fromGodown}</p>
                <p><strong>To Godown:</strong> {selectedItem.toGodownName || selectedItem.toGodown}</p>
                <p><strong>Item Name:</strong> {getItemNameLabel(selectedItem)}</p>
                <p><strong>Quantity:</strong> {selectedItem.quantity} {selectedItem.goodsType === 'Fabric' ? 'meters' : 'kg'}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem && !isDeleteModalOpen}
          onClose={() => setSelectedItem(null)}
          title={`Stock Transfer Details`}
          className="max-w-6xl"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Transfer Date</p>
                <p className="font-semibold">
                  {selectedItem.transferDate ? new Date(selectedItem.transferDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Goods Type</p>
                <p className="font-semibold">{selectedItem.goodsType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">From Godown</p>
                <p className="font-semibold">{selectedItem.fromGodownName || selectedItem.fromGodown}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">To Godown</p>
                <p className="font-semibold">{selectedItem.toGodownName || selectedItem.toGodown}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Item Name</p>
                <p className="font-semibold">{getItemNameLabel(selectedItem)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="font-semibold">
                  {selectedItem.quantity} {selectedItem.goodsType === 'Fabric' ? 'meters' : 'kg'}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">
                {selectedItem.goodsType === 'Fabric' ? 'Fabric Items' : 'Yarn Items'}
              </h3>
              <DataTable
                columns={selectedItem.goodsType === 'Fabric' ? fabricItemsColumns : yarnItemsColumns}
                data={itemsForSelected}
                title=""
                showActions={false}
                showAddActions={false}
                showExport={false}
                filterPlaceholder="Search items..."
                // className="border rounded-lg"
              />
            </div>

            {/* Remarks */}
            {selectedItem.remarks && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Remarks</p>
                <p className="font-semibold p-3 bg-gray-50 rounded border">{selectedItem.remarks}</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setSelectedItem(null);
                  handleEdit(selectedItem);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}