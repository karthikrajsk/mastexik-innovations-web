import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, DateRangeFilter } from '@/components/data/DataTable';
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from '@/state/store';
import { getAllOpeningBalance, deleteOpeningBalance } from '@/state/openingBalanceSlice';
import { getAllFabricMasters } from '@/state/fabricMasterSlice';
import { getAllWarehouse } from '@/state/warehouseSlice';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

interface OpeningBalanceItem {
  id: number;
  slNo: number;
  goodsType: string;
  isPacked: string;
  warehouse: string;
  items: any[];
  fabricItems?: any[];
  yarnItems?: any[];
}

export default function OpeningBalance() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { openingBalanceList, paginationInfo, loading } = useSelector((state: RootState) => state.openingBalance as any);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory as any);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse as any);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OpeningBalanceItem | null>(null);
  const { uomList } = useSelector((state: RootState) => state.uom as any);
  const { selectedCompany } = useAuth();
  const resolvedCompanyId = selectedCompany != null ? Number(selectedCompany) : null;


  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

    const getUomLabelById = (uomId: number | string | null | undefined) => {
    if (!uomId || !uomList) return 'kg';
    const uom = uomList.find((u: any) => u.id === Number(uomId));
    return uom?.uomName || uom?.name || 'kg';
  };

  const getYarnItemsColumns = (uomId?: number | string | null) => {
    const uomLabel = getUomLabelById(uomId);
    return [
      {
        Header: 'S.No',
        Cell: ({ row }: any) => <span>{row.index + 1}</span>,
      },
    
      {
        Header: 'Opening Balance No',
        accessor: 'openingBalanceNo',
      },
      {
        Header: 'Yarn Name',
        accessor: 'yarnName',
        Cell: ({ value }: any) => <span>{value || 'N/A'}</span>,
      },
      {
        Header: 'Mill Name',
        accessor: (row: any) => {
          if (row.millName) {
            return row.millName;
          } else if (row.millId) {
            const mill = subCategoryList.find((subCat: any) =>
              subCat.id === row.millId && subCat.categoryName?.toLowerCase() === 'mill'
            );
            return mill?.subCategoryName || `Mill ${row.millId}`;
          }
          return 'No Mill';
        },
      },
      {
        Header: 'No. Bags',
        accessor: 'noOfBags',
        Cell: ({ value }: any) => <span>{value || '0'}</span>,
      },
      {
        Header: `Qty/Bag (${uomLabel})`,
        accessor: 'kgsPerBag',
        Cell: ({ value }: any) => <span>{value || '0'} ${uomLabel}</span>,
      },
      {
        Header: `Total (${uomLabel})`,
        accessor: 'totalKg',
        Cell: ({ value }: any) => <span>{value || '0'} ${uomLabel}</span>,
      },
      {
        Header: 'Lot No',
        accessor: 'lotNumber',
      },
    ];
  };

  // Fetch data on component mount
  useEffect(() => {
    dispatch(getAllOpeningBalance({ 
      // offset: getOffset(), 
      // limit: itemsPerPage,
      fetchAll: true,
      companyId: resolvedCompanyId ?? undefined
    }));
  }, [dispatch, currentPage, getOffset, itemsPerPage, resolvedCompanyId]);

  useEffect(() => {
    if (!fabricMasterList || fabricMasterList.length === 0) {
      dispatch(getAllFabricMasters({ fetchAll: true }));
    }
  }, [dispatch, fabricMasterList]);

  useEffect(() => {
    if (!warehouseList || warehouseList.length === 0) {
      dispatch(getAllWarehouse({fetchAll: true}));
    }
  }, [dispatch, warehouseList]);

  const handleAdd = () => {
    navigate('/transaction/opening-balance-details');
  };

  const handleEdit = (item: OpeningBalanceItem) => {
    navigate('/transaction/opening-balance-details', { state: { openingBalance: item } });
  };

  const handleView = (item: OpeningBalanceItem) => {
    setSelectedItem(item);
  };

  const handleDeleteClick = (item: OpeningBalanceItem) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedItem) {
      try {
        await dispatch(deleteOpeningBalance({ id: selectedItem.id, companyId: resolvedCompanyId ?? undefined })).unwrap();
        resetPage();
        await dispatch(getAllOpeningBalance({ fetchAll: true, companyId: resolvedCompanyId ?? undefined }));
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
        toast.success('Opening balance deleted successfully');
      } catch (error: any) {
        console.error('Error deleting Opening Balance:', error);
        toast.error('Failed to delete opening balance');
      }
    }
  };

  // Function to get mill name by ID
  const getMillNameById = (millId: number) => {
    if (!millId) return 'No Mill';

    const mill = subCategoryList.find((subCat: any) =>
      subCat.id === millId && subCat.categoryName?.toLowerCase() === 'mill'
    );

    return mill?.subCategoryName || `Mill ${millId}`;
  };

  const fabricMasterMap = useMemo(() => {
    if (!Array.isArray(fabricMasterList)) return {};
    return fabricMasterList.reduce((acc: Record<number, any>, fabric: any) => {
      if (fabric?.id != null) {
        acc[Number(fabric.id)] = fabric;
      }
      return acc;
    }, {} as Record<number, any>);
  }, [fabricMasterList]);

  const warehouseMap = useMemo(() => {
    if (!Array.isArray(warehouseList)) return {};
    return warehouseList.reduce((acc: Record<number, any>, warehouse: any) => {
      if (warehouse?.id != null) {
        acc[Number(warehouse.id)] = warehouse;
      }
      return acc;
    }, {} as Record<number, any>);
  }, [warehouseList]);

  const getFabricDetails = useCallback((item: any) => {
    if (!item) return { fabricCode: '', fabricName: '' };
    const codeId = item.fabricCodeId ?? item.fabricCodeID ?? item.fabric_code_id;
    const key = codeId != null ? Number(codeId) : undefined;
    const master = key != null ? fabricMasterMap[key] : undefined;
    const fabricCode = item.fabricCode || master?.fabricCode || master?.fabric_code || (codeId ? `Fabric ${codeId}` : '');
    const fabricName = item.fabricName || item.quality || master?.fabricQuality || master?.quality || '';
    return { fabricCode, fabricName };
  }, [fabricMasterMap]);

  const formatSummaryItemNames = (summaryItems?: any[]) => {
    if (!Array.isArray(summaryItems) || !summaryItems.length) return '';
    return summaryItems
      .map((item: any) => (item?.itemName || '').toString().trim())
      .filter((name: string) => name !== '')
      .join(', ');
  };

  const formatSummaryQuantities = (summaryItems?: any[], goodsType?: string) => {
    if (!Array.isArray(summaryItems) || !summaryItems.length) return '';
    const defaultUnit = goodsType === 'Fabric' ? 'm' : goodsType === 'Yarn' ? 'kg' : '';
    return summaryItems
      .map((item: any) => {
        if (item?.quantity == null) return '';
        const quantity = Number(item.quantity);
        if (Number.isNaN(quantity)) return '';
        const explicitUnit = typeof item.value === 'string' ? item.value.trim() : '';
        const unitSuffix = explicitUnit || defaultUnit;
        return unitSuffix ? `${quantity}${unitSuffix}` : `${quantity}`;
      })
      .filter((value: string) => value.trim() !== '')
      .join(', ');
  };

  // Sort data by ID in descending order (newest first) and add sequential S.No
  const sortedData = useMemo(() => {
    if (!openingBalanceList || openingBalanceList.length === 0) return [];

    // Sort by ID in descending order (newest first)
    const sorted = [...openingBalanceList].sort((a: any, b: any) => b.id - a.id);

    // Add sequential serial numbers starting from offset + 1
    return sorted.map((item, index) => ({
      ...item,
      sequentialNo: (paginationInfo?.offset || 0) + index + 1
    }));
  }, [openingBalanceList, paginationInfo?.offset]);

  // DataTable columns configuration for main list - UPDATED
  const columns = useMemo(() => [
    {
      Header: 'S.No',
      accessor: 'sequentialNo',
      disableFilters: true,
      Cell: ({ value }: any) => <span>{value}</span>,
    },
     {
            Header: 'Opening Balance Date',
            accessor: 'date',
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
                  const toDate = new Date(filterValue.to);
                  if (date > toDate) return false;
                }
                return true;
              });
            }
          },
     {
        Header: 'Opening Balance No',
        accessor: 'openingBalanceNo',
      },
    {
      Header: 'Goods Type',
      accessor: 'goodsType',
      Cell: ({ value }: any) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${value === 'Fabric'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-green-100 text-green-800'
          }`}>
          {value}
        </span>
      ),
    },
    {
      Header: 'Item Name',
      accessor: (row: any) => {
        const summaryNames = formatSummaryItemNames(row?.openingBalanceSummaryItems);
        if (summaryNames) {
          return summaryNames;
        }

        if (row.goodsType === 'Fabric') {
          const fabricArray = row.fabricItems?.length
            ? row.fabricItems
            : Array.isArray(row.items)
              ? row.items
              : [];
          if (fabricArray.length > 0) {
            return fabricArray.map((item: any) => {
              const { fabricCode, fabricName } = getFabricDetails(item);
              if (fabricCode && fabricName) {
                return `${fabricCode} - ${fabricName}`;
              }
              return fabricCode || fabricName || 'Fabric';
            }).join(' | ');
          }
        }

        if (row.goodsType === 'Yarn' && row.yarnItems && row.yarnItems.length > 0) {
          return row.yarnItems.map((item: any) => {
            return item.yarnName || 'N/A';
          }).join(' | ');
        }

        if (row.goodsType === 'Yarn' && row.items && row.items.length > 0) {
          return row.items.map((item: any) => {
            return item.yarnName || 'N/A';
          }).join(' | ');
        }

        if (row.goodsType === 'Item' && row.items && row.items.length > 0) {
          return row.items.map((item: any) => {
            return item.itemName || 'N/A';
          }).join(' | ');
        }

        return 'No items';
      },
    },
   {
      Header: 'Quantity',
      accessor: (row: any) => {
        const uomLabel = getUomLabelById(row.uomId);
        const summaryItems = Array.isArray(row.openingBalanceSummaryItems) ? row.openingBalanceSummaryItems : [];

        if (row.goodsType === 'Fabric') {
          if (summaryItems.length > 0) {
            const total = summaryItems.reduce((sum: number, item: any) => sum + (parseFloat(item.quantity) || 0), 0);
            return `${Number(total.toFixed(3))} m`;
          }
          const fabricArray = row.fabricItems?.length ? row.fabricItems : Array.isArray(row.items) ? row.items : [];
          const total = fabricArray.reduce((sum: number, item: any) => sum + (parseFloat(item.pieceMeter) || 0), 0);
          return `${Number(total.toFixed(3))} m`;
        }

        if (row.goodsType === 'Yarn') {
          if (summaryItems.length > 0) {
            const total = summaryItems.reduce((sum: number, item: any) => sum + (parseFloat(item.quantity) || 0), 0);
            return `${Number(total.toFixed(3))} ${uomLabel}`;
          }
          const yarnArray = row.yarnItems?.length ? row.yarnItems : Array.isArray(row.items) ? row.items : [];
          const total = yarnArray.reduce((sum: number, item: any) => sum + (parseFloat(item.totalKg) || 0), 0);
          return `${Number(total.toFixed(3))} ${uomLabel}`;
        }

        if (row.goodsType === 'Item') {
          if (summaryItems.length > 0) {
            const total = summaryItems.reduce((sum: number, item: any) => sum + (parseFloat(item.quantity) || 0), 0);
            return `${Number(total.toFixed(3))} ${uomLabel}`;
          }
          const itemArray = Array.isArray(row.items) ? row.items : [];
          const total = itemArray.reduce((sum: number, item: any) => sum + (parseFloat(item.acceptedQty) || 0), 0);
          return `${Number(total.toFixed(3))} ${uomLabel}`;
        }

        return '0';
      }
    },
    {
      Header: 'Warehouse',
      accessor: 'warehouse',
      Cell: ({ value }: any) => {
        const warehouse = warehouseMap[Number(value)];
        return <span>{warehouse?.name || warehouse?.warehouseName || `Warehouse ${value}`}</span>;
      },
    },
  ], [subCategoryList, getFabricDetails, warehouseMap]);

  // DataTable columns for Fabric items
  const fabricItemsColumns = useMemo(() => [
    {
      Header: 'S.No',
      Cell: ({ row }: any) => <span>{row.index + 1}</span>,
    },
    {
      Header: 'Sort No',
      accessor: 'fabricCode',
      Cell: ({ row }: any) => {
        const { fabricCode } = getFabricDetails(row.original);
        return fabricCode || row.original.fabricCodeId || '—';
      },
    },
    {
      Header: 'Fabric Name',
      accessor: 'fabricName',
      Cell: ({ row }: any) => {
        const { fabricName } = getFabricDetails(row.original);
        return fabricName || '—';
      },
    },
    {
      Header: 'Packing No',
      accessor: 'packingNo',
    },
    {
      Header: 'Piece No',
      accessor: 'pieceNo',
    },
    {
      Header: 'Piece Meter',
      accessor: 'pieceMeter',
      Cell: ({ value }: any) => <span>{value || '0'} m</span>,
    },
    {
      Header: 'Net Weight',
      accessor: 'netWeight',
      Cell: ({ value }: any) => <span>{value || '0'} kg</span>,
    },
    {
      Header: 'Avg Weight',
      accessor: 'avgWeight',
      Cell: ({ value }: any) => <span>{value || '0'} kg</span>,
    },
    {
      Header: 'Grade',
      accessor: 'grade',
    },
  ], [getFabricDetails]);

  // DataTable columns for Yarn items - UPDATED to show mill name
    const yarnItemsColumns = useMemo(() => getYarnItemsColumns(), [subCategoryList, uomList]);

  // Get items for display - handles both fabricItems and items arrays
  const getDisplayItems = (item: OpeningBalanceItem) => {
    if (item.goodsType === 'Fabric' && item.fabricItems && item.fabricItems.length > 0) {
      return item.fabricItems;
    }
    if (item.goodsType === 'Yarn' && item.yarnItems && item.yarnItems.length > 0) {
      return item.yarnItems;
    }
    return item.items || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 pt-16">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const totalPages = paginationInfo ? Math.ceil(paginationInfo.total / itemsPerPage) : 0;

  return (
    <div className="p-4">
      {/* <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Opening Balance</h1>
        <span className="text-sm text-gray-600">
          Showing {(paginationInfo?.offset || 0) + 1} - {Math.min((paginationInfo?.offset || 0) + itemsPerPage, paginationInfo?.total || 0)} of {paginationInfo?.total || 0}
        </span>
      </div>

      {sortedData.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">No opening balance records found.</p>
        </div>
      )} */}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={sortedData}
        title="Opening Balance List"
        onAdd={handleAdd}
        onEdit={handleEdit}
        // onView={handleView}
        onDelete={handleDeleteClick}
        showActions={true}
         showColumnFilters={true}

        showAddActions={true}
        showExport={true}
        filterPlaceholder="Search by warehouse, goods type..."
          initialPageSize={itemsPerPage}
        onPageSizeChange={setItemsPerPage}
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
          <p>Are you sure you want to delete this opening balance record?</p>
          {selectedItem && (
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p><strong>Goods Type:</strong> {selectedItem.goodsType}</p>
              <p><strong>Warehouse:</strong> {selectedItem.warehouse}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
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
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem && !isDeleteModalOpen}
          onClose={() => setSelectedItem(null)}
          title={`Opening Balance - ${selectedItem.goodsType}`}
          className="max-w-4xl"
        >
          <div className="space-y-4">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Goods Type</p>
                <p className="font-semibold">{selectedItem.goodsType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Is Packed</p>
                <p className="font-semibold">{selectedItem.isPacked ? 'Yes' : 'No'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Warehouse</p>
                <p className="font-semibold">Warehouse {selectedItem.warehouse}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <DataTable
                columns={selectedItem.goodsType === 'Fabric' ? fabricItemsColumns : yarnItemsColumns}
                data={getDisplayItems(selectedItem)}
                title=""
                showActions={false}
                showAddActions={false}
                showExport={false}
                filterPlaceholder="Search items..."
                disableFullDataFetch={true}
              />
            </div>

            {/* Close Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}