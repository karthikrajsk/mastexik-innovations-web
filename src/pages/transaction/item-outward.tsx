import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppDispatch, RootState } from '@/state/store';
import { DataTable, DateRangeFilter } from '@/components/data/DataTable';
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from '@/components/common/Pagination';
import { formatDate } from '@/lib/utils';
import { toast } from "react-toastify";
import { Printer, X } from 'lucide-react';
import { getAllItemOutwards, deleteItemOutward } from '@/state/itemOutwardSlice';
import { getAllVendors } from '@/state/vendorSlice';
import { getAllItemMasters } from '@/state/itemSlice';
import { getAllUomMaster } from '@/state/uomMasterSlice';
import apiService from '@/services/ApiService';

interface ItemOutwardListItem {
  id: number;
  outwardDate: string;
  outwardNo: string;
  itemVendorName: string;
  itemName: string;
  quantity: number | string;
  department: string;
  uom: string;
  activeFlag?: boolean;
}

export default function ItemOutwardDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset } = usePagination({ itemsPerPage: 10 });
  
  const { itemOutwardList, paginationInfo, loading } = useSelector((state: RootState) => state.itemOutward);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { itemList } = useSelector((state: RootState) => state.itemMaster);
  const { uomList } = useSelector((state: RootState) => state.uom);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [selectedPrintRecord, setSelectedPrintRecord] = useState<any | null>(null);

  const selectedCompanyId = useMemo(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return storedCompanyId ? Number(storedCompanyId) : undefined;
  }, []);

  useEffect(() => {
    dispatch(getAllItemOutwards({
      companyId: selectedCompanyId,
      fetchAll: true
    }));
    dispatch(getAllVendors({}));
    dispatch(getAllItemMasters({ fetchAll: true }));
    dispatch(getAllUomMaster({}));
  }, [dispatch, currentPage, getOffset, itemsPerPage, selectedCompanyId, location.pathname]);

  // Create vendor map for quick lookup
  const vendorMap = useMemo(() => {
    const vendors = Array.isArray(vendorList) ? vendorList : (vendorList?.data || []);
    return vendors.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
      acc[vendor.id] = vendor.vendorName;
      return acc;
    }, {});
  }, [vendorList]);

  // Create item map for quick lookup
  const itemMap = useMemo(() => {
    const items = Array.isArray(itemList) ? itemList : (itemList?.data || []);
    return items.reduce((acc: Record<number, any>, item: { id: number; itemName: string; department?: string; uomId?: number }) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [itemList]);

  // Create UOM map for quick lookup
  const uomMap = useMemo(() => {
    const uoms = Array.isArray(uomList) ? uomList : (uomList?.data || []);
    return uoms.reduce((acc: Record<number, string>, uom: { id: number; uomName: string }) => {
      acc[uom.id] = uom.uomName;
      return acc;
    }, {});
  }, [uomList]);

  const rows: ItemOutwardListItem[] = useMemo(() => {
    if (!itemOutwardList || itemOutwardList.length === 0) return [];
    
    return itemOutwardList.map((r: any) => {
      const vendorName = vendorMap[r?.vendorId] || r?.vendorName || r?.itemVendorName || 'N/A';
      const department = r?.department || 'N/A';
      
      const items = r?.itemOutwardStockDetails || r?.itemOutwardItemsDtl || r?.items || [];
      const totalQuantity = Array.isArray(items)
        ? items.reduce((sum: number, item: any) => 
            sum + (Number(item.issuingQuantity || item.quantity || 0)), 0)
        : (r?.quantity || 0);
      
      const itemNames = Array.isArray(items) && items.length > 0
        ? items.map((item: any) => {
            const itemId = item.itemId;
            const mappedItem = itemMap[itemId] || {};
            return mappedItem.itemName || item.itemName || (itemId ? `Item ${itemId}` : 'N/A');
          }).filter((name: string) => name !== 'N/A' && !name.startsWith('Item ')).join(', ') || 
          (items.length > 0 && items[0].itemId ? `Item ${items[0].itemId}` : 'N/A')
        : 'N/A';
      
      let uom = 'N/A';
      if (Array.isArray(items) && items.length > 0) {
        const firstItem = items[0];
        const itemId = firstItem.itemId;
        const mappedItem = itemMap[itemId] || {};
        const uomId = mappedItem.uomId || firstItem.uomId;
        uom = uomId ? (uomMap[uomId] || 'N/A') : 'N/A';
      }

      return {
        id: r.id,
        outwardDate: r.outwardDate || r.date || '',
        outwardNo: r.outwardNo || r.outwardNumber || `IO-${String(r.id).padStart(5, '0')}`,
        itemVendorName: vendorName,
        itemName: itemNames,
        quantity: totalQuantity,
        department: department,
        uom: uom,
        activeFlag: r.activeFlag,
      };
    });
  }, [itemOutwardList, vendorMap, itemMap, uomMap]);

  const handlePrint = async (row: any) => {
    const fullRecord = itemOutwardList?.find((r: any) => r.id === row.id) || row;
    if (!fullRecord?.itemOutwardStockDetails && !fullRecord?.items && !fullRecord?.itemOutwardItemsDtl) {
      try {
        const res: any = await apiService.get(`/item-outward/${row.id}`);
        const fetchedData = res?.data?.data || res?.data || res;
        setSelectedPrintRecord(fetchedData);
        return;
      } catch (e) {
        console.warn("Could not fetch outward details by ID, using list record", e);
      }
    }
    setSelectedPrintRecord(fullRecord);
  };

  const columns = useMemo(() => ([
    { Header: 'S.No', accessor: 'serialNo', width: 60, disableFilters: true, disableGlobalFilter: true },
    { 
      Header: 'Outward Date', 
      accessor: 'outwardDate', 
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
    { Header: 'Outward No', accessor: 'outwardNo' },
    { Header: 'Description/Item Name', accessor: 'itemName' },
    { Header: 'Quantity', accessor: 'quantity', Cell: ({ value }: any) => Number(value || 0).toFixed(2) },
    { Header: 'Department', accessor: 'department' },
    {
      Header: 'Print',
      accessor: 'print',
      disableFilters: true,
      disableGlobalFilter: true,
      Cell: ({ row }: { row: any }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrint(row.original || row);
          }}
          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      ),
    },
  ]), [itemOutwardList]);

  const aggregatedData = useMemo(() => {
    const filtered = (rows || []).filter((r: any) => r.activeFlag !== false);
    return filtered.map((r, i) => ({ 
      ...r, 
      serialNo: (paginationInfo?.offset || 0) + i + 1 
    }));
  }, [rows, paginationInfo]);

  const handleAdd = () => navigate('/transaction/item-outward-stock-details');
  
  const handleEdit = (row: any) => {
    navigate('/transaction/item-outward-stock-details', { 
      state: { record: row, itemOutwardDtl: itemOutwardList.find((r: any) => r.id === row.id) } 
    });
  };

  const handleDelete = (row: any) => {
    setCurrentRecord(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentRecord) return;

    try {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      if (!storedCompanyId) {
        toast.error('Please select a company');
        return;
      }
      
      await dispatch(deleteItemOutward({ 
        id: currentRecord.id, 
        companyId: Number(storedCompanyId) 
      })).unwrap();
      
      dispatch(getAllItemOutwards({
        companyId: selectedCompanyId,
        fetchAll: true
      }));
    } catch (error) {
      console.error('Error deleting item outward:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setCurrentRecord(null);
    }
  };

  return (
    <div className="p-6 pt-16">
      {/* Material Request Slip Print styles */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-material-slip, #printable-material-slip * {
            visibility: visible !important;
          }
          #printable-material-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            border: none !important;
            padding: 12mm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          table {
            width: 100% !important;
            table-layout: auto !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      <DataTable
        columns={columns as any}
        data={aggregatedData as any}
        title="Material Issue Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrint={handlePrint}
        onView={undefined}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Outward No, Vendor, Item..."
        disableFullDataFetch={true}
      />
     
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete outward {currentRecord?.outwardNo}?</p>
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

      {/* Dynamic Material Request Slip Print Modal matching material-issue-print.pdf */}
      {selectedPrintRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Material Request Slip Print - {selectedPrintRecord.outwardNo || selectedPrintRecord.outwardNumber || `IO-${selectedPrintRecord.id}`}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-md transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPrintRecord(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Material Request Slip Area matching material-issue-print.pdf */}
            <div id="printable-material-slip" className="p-5 bg-white border-2 border-black rounded-sm text-black font-sans text-xs flex flex-col justify-between space-y-3 max-w-4xl mx-auto">
              {/* Header Title */}
              <div className="text-center space-y-0.5">
                <h1 className="text-xl font-extrabold tracking-wider text-black uppercase">HAYAGREEVAS FABRICS PRIVATE LIMITED</h1>
                <p className="text-[11px] font-semibold text-black">
                  S.F. No. 193, P.Vadugapalayam, Pollachi Road, Palladam - 641 664, Tirupur District
                </p>
                <div className="pt-1.5 flex justify-center">
                  <span className="border-2 border-black rounded-2xl px-6 py-0.5 text-xs font-black tracking-wider uppercase bg-white">
                    MATERIAL REQUEST SLIP
                  </span>
                </div>
              </div>

              {/* Sub-header meta */}
              <div className="pt-2 pb-1 space-y-1.5 text-xs font-bold text-black border-b border-black">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span>No. :</span>
                    <span className="text-sm font-black underline">
                      {selectedPrintRecord.outwardNo || selectedPrintRecord.outwardNumber || `IO-${String(selectedPrintRecord.id).padStart(5, '0')}`}
                    </span>
                  </div>
                  <div className="text-center italic font-semibold text-black">
                    To the Store's In-charge &nbsp;&nbsp;&nbsp;&nbsp; Please issue the following
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Date :</span>
                    <span className="font-black underline">
                      {formatDate(selectedPrintRecord.outwardDate || selectedPrintRecord.date || selectedPrintRecord.createdDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span>Dept :</span>
                  <span className="font-black underline">
                    {selectedPrintRecord.department || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-white border-b border-black text-center font-bold">
                    <th className="border border-black px-1.5 py-1.5 w-14 leading-tight">
                      Serial<br />No.
                    </th>
                    <th className="border border-black px-3 py-1.5 text-left">Description of Article</th>
                    <th className="border border-black px-2 py-1.5 w-20">Unit</th>
                    <th className="border border-black px-2 py-1.5 w-24">Quantity</th>
                    <th className="border border-black px-2 py-1.5 w-32">Receiver's Sign</th>
                    <th className="border border-black px-3 py-1.5 w-36">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rawItems = selectedPrintRecord.itemOutwardStockDetails || selectedPrintRecord.itemOutwardItemsDtl || selectedPrintRecord.items || [];
                    const itemsList = Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : [{
                      itemId: selectedPrintRecord.itemId,
                      itemName: selectedPrintRecord.itemName,
                      issuingQuantity: selectedPrintRecord.quantity,
                      uomId: selectedPrintRecord.uomId,
                      remarks: selectedPrintRecord.remarks
                    }];

                    // Minimum 7 rows for slip layout height matching pre-printed pad
                    const displayRows = [...itemsList];
                    while (displayRows.length < 7) {
                      displayRows.push(null);
                    }

                    return displayRows.map((item: any, idx: number) => {
                      if (!item) {
                        return (
                          <tr key={`empty-${idx}`} className="border-b border-black h-8">
                            <td className="border border-black px-2 py-1.5 text-center font-medium">{idx + 1}</td>
                            <td className="border border-black px-3 py-1.5"></td>
                            <td className="border border-black px-2 py-1.5 text-center"></td>
                            <td className="border border-black px-2 py-1.5 text-center"></td>
                            <td className="border border-black px-2 py-1.5"></td>
                            <td className="border border-black px-3 py-1.5"></td>
                          </tr>
                        );
                      }

                      const itemId = item.itemId;
                      const masterItem = itemMap[itemId] || {};
                      const desc = masterItem.itemName || item.itemName || (itemId ? `Item #${itemId}` : 'N/A');
                      
                      const uomId = masterItem.uomId || item.uomId;
                      const unitStr = uomId ? (uomMap[uomId] || item.uomName || '') : (item.uomName || item.unit || '');
                      const qtyVal = Number(item.issuingQuantity || item.quantity || item.qty || 0);

                      return (
                        <tr key={idx} className="border-b border-black h-8">
                          <td className="border border-black px-2 py-1.5 text-center font-bold">{idx + 1}</td>
                          <td className="border border-black px-3 py-1.5 font-bold">{desc}</td>
                          <td className="border border-black px-2 py-1.5 text-center font-medium">{unitStr}</td>
                          <td className="border border-black px-2 py-1.5 text-center font-extrabold">{qtyVal > 0 ? qtyVal : ''}</td>
                          <td className="border border-black px-2 py-1.5 text-center"></td>
                          <td className="border border-black px-3 py-1.5 text-center">{item.remarks || item.remark || ''}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>

              {/* Signatures Footer Box */}
              <div className="grid grid-cols-4 border border-black divide-x divide-black text-center font-bold text-xs h-16 items-end pb-1 mt-auto">
                <div>Requested by</div>
                <div>M-M</div>
                <div>AGM-W</div>
                <div>Issued by</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
