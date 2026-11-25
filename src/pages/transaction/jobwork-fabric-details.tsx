import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { FabricBarcodePiece, getFabricBarcodeLink } from "@/lib/barcode";
import { getAllJobworkFabricReceive, hardDeleteJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import React, { useCallback } from "react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { selectHasPermission } from "@/state/permissionSlice";
import { Edit, Trash, Eye } from 'lucide-react';
import { Pagination, usePagination } from "@/components/common/Pagination";


export function JobworkFabricReceiveDetails() {
  const { jobworkFabricReceiveList, pagination: paginationInfo } = useSelector((state: RootState) => state.JobworkFabricReceive);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { fabricMasterList } = useSelector((state: RootState) => (state as any).fabricMaster);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const canEdit = useSelector(selectHasPermission(path, 'edit'));
  const canDelete = useSelector(selectHasPermission(path, 'delete'));
  const canView = useSelector(selectHasPermission(path, 'view'));
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  const selectedCompanyId = useMemo(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return storedCompanyId ? Number(storedCompanyId) : undefined;
  }, []);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  useEffect(() => {
    const companyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const companyIdNumber = companyId ? Number(companyId) : undefined;

    dispatch(getAllJobworkFabricReceive({
      companyId: companyIdNumber,
      fetchAll: true,
    }));
    dispatch(getAllVendors({fetchAll: true}));
    dispatch(getAllWeavingContract({fetchAll: true}));
    dispatch(getAllWarehouse({fetchAll: true}));
    dispatch(getAllFabricMasters({fetchAll: true} as any));
  }, [dispatch, getOffset, itemsPerPage]);

  const fabricMasterMap = useMemo(() => {
    const list = Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : Array.isArray(fabricMasterList) ? fabricMasterList : [];
    const map = new Map<number, string>();
    list.forEach((f: any) => {
      if (f?.id != null) map.set(Number(f.id), f.fabricCode || f.code || '');
    });
    return map;
  }, [fabricMasterList]);

  const vendorMap = useMemo(() => 
    vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
      acc[vendor.id] = vendor.vendorName;
      return acc;
    }, {}), [vendorList]
  );

  const weavingContractMap = useMemo(() => {
    const list = Array.isArray(weavingContractList) ? weavingContractList : (weavingContractList?.data || []);
    return list.reduce((acc: Record<number, string>, wc: any) => {
      acc[Number(wc.id)] = wc.weavingContractNo || wc.contractNo || '';
      return acc;
    }, {});
  }, [weavingContractList]);

  const warehouseData = useMemo(() => {
    return Array.isArray(warehouseList) ? warehouseList : (warehouseList?.data || []);
  }, [warehouseList]);

  const warehouseMap = useMemo(() => {
    return warehouseData.reduce((acc: Record<number, string>, wh: any) => {
      acc[Number(wh.id)] = wh.warehouseName || '';
      return acc;
    }, {});
  }, [warehouseData]);

  const processedData = useMemo(() => {
    return jobworkFabricReceiveList.map((record: any, index: number) => {
      const serialNo = index + 1;
      const weavingContractNo = weavingContractMap[Number(record.weavingContractId)] || '';
      const vendorName = record.vendorId != null ? (vendorMap[record.vendorId] ?? '-') : '--';
      const items = record.items || [];
      let fabricDetails = '-';
      if (items.length > 0) {
        const first = items[0];
        fabricDetails = first?.pieceEntries?.[0]?.fabricDetails || first?.fabricDetails || '-';
      }
      
      const totalPieces = items.reduce((sum: number, item: any) => sum + (item.pieceEntries?.length || 0), 0);
     const quantityReceived = items.reduce((sum: number, item: any) => sum + (item.quantityReceived || 0), 0);
      let warehouseInfo = '-';
      if (items.length > 0) {
        const warehouseCount: { [key: number]: number } = {};
        items.forEach((item: any) => {
          if (Array.isArray(item.pieceEntries)) {
            item.pieceEntries.forEach((piece: any) => {
              if (piece.warehouseId) {
                const whId = Number(piece.warehouseId);
                warehouseCount[whId] = (warehouseCount[whId] || 0) + 1;
              }
            });
          }
        });
        if (Object.keys(warehouseCount).length === 0) {
          const first = items[0];
          const whId = first?.warehouseId;
          if (whId) {
            warehouseInfo = warehouseMap[Number(whId)] || whId.toString();
          }
        } else {
          const warehouseDisplay = Object.entries(warehouseCount).map(([whId, count]) => {
            const warehouseName = warehouseMap[Number(whId)] || `Warehouse-${whId}`;
            return count > 1 ? `${warehouseName}` : warehouseName;
          });
          warehouseInfo = warehouseDisplay.join(', ');
        }
      }
      return {
        ...record,
        serialNo,
        receiveNo: record.receiveNo,
        weavingContractNo,
        vendorName,
            quantityReceived,
        fabricDetails,
        totalPieces,
        warehouseInfo,
  
      };
    });
  }, [jobworkFabricReceiveList, vendorMap, weavingContractMap, warehouseMap]);

  const handleAdd = () => {
    navigate("/transaction/jobwork-fabric-receive");
  };

  const handleEdit = (record: any) => {
    const parentId = record.id;
    const childIds: number[] = [];
    const items = record.jobworkFabricReceiveItemsDtl || record.items || [];
    if (items) {
      childIds.push(...(items as any[]).map(item => item.id).filter(Boolean));
    }
    
    const queryParams = new URLSearchParams();
    queryParams.set('parentId', String(parentId));
    if (childIds.length > 0) {
      childIds.forEach(childId => queryParams.append('childId', String(childId)));
    }
    
    navigate(`/transaction/jobwork-fabric-receive?${queryParams.toString()}`, { state: { record } });
  };

  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setIsDeleteModalOpen(true);
  };

  const handleView = (record: any) => {
    setCurrentRecord(record);
    setIsViewModalOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
       
      {
        Header: 'Receive Date',
        accessor: 'jobFabricReceiveDate',
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
        Header: 'Receive No',
        accessor: 'receiveNo',
        Cell: ({ value }: { value: string }) => value || '-',
      },
      {
        Header: 'Weaving Contract No',
        accessor: 'weavingContractNo',
        Cell: ({ value }: { value: string }) => (
          <span>{value || '-'}</span>
        ),
      },
      {
        Header: 'Vendor',
        accessor: 'vendorName',
        Cell: ({ value }: { value: string }) => (
          <span>{value}</span>
        )
      },
      {
        Header: 'Fabric Details',
        accessor: 'fabricDetails',
        Cell: ({ value }: { value: string }) => value || '-',
      },
     
      {
        Header: 'Total No. of Pieces',
        accessor: 'totalPieces',
        Cell: ({ value }: { value: number }) => value || 0,
      },
       {
        Header: 'Total Meters',
        accessor: 'quantityReceived',
      },
      {
        Header: 'Warehouse',
        accessor: 'warehouseInfo',
        Cell: ({ value }: { value: string }) => value || '-',
      },
      {
        Header: 'Dc Number',
        accessor: 'dcNumber',
      },
       {
        Header: 'Dc Date',
        accessor: 'dcDate',
      },
       {
        Header: 'Barcode',
        accessor: 'barcodeLink',
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const record = row.original;
          const companyId = record.companyId ?? selectedCompanyId;
          const allPieceEntries = (record.items ?? []).flatMap((item: any) => item.pieceEntries ?? []);
          const [fabricCode, fabricQuality] = (record.fabricDetails || '').split(' - ');

          const pieceEntriesForLink = allPieceEntries
            .map((piece: any) => {
              const barcodeValue = piece.pieceNumber || piece.pieceRollNo || piece.pieceNo;
              if (!barcodeValue) {
                return null;
              }

              const fabricDetails =
                piece.fabricDetails || piece.finishedFabricCodeQuality || record.fabricDetails || '';
              const [fabricCodePiece, fabricQualityPiece] = (fabricDetails || '').split(' - ');
              const meter = piece.meter ?? piece.quantity ?? record.quantityReceived;
              const netWeight = piece.inspectedNtWt ?? piece.netWeight ?? piece.weight;

              return {
                barcode: barcodeValue,
                fabricCode: fabricCodePiece || fabricCode || record.fabricDetails || '',
                fabricQuality: fabricQualityPiece || fabricQuality || record.fabricDetails || '',
                grade: piece.grade ?? record.grade,
                meter,
                netWeight: netWeight ?? undefined,
                avgWeight: piece.weight && piece.quantity ? (Number(piece.weight) / Number(piece.quantity)) : undefined,
              } as FabricBarcodePiece;
            })
            .filter((entry: any): entry is FabricBarcodePiece => Boolean(entry));

          const primaryPieceData = pieceEntriesForLink[0];
          const primaryBarcodeValue =
            primaryPieceData?.barcode || record.receiveNo || `JOBWORK-${record.id}`;

          if (!primaryBarcodeValue) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          const netWeightValues = pieceEntriesForLink
            .map((piece: { netWeight: any; }) => piece.netWeight)
            .filter((value:any): value is string | number => value !== undefined && value !== null);
          const totalNetWeight = netWeightValues.length
            ? netWeightValues.reduce((sum: number, value: any) => sum + Number(value), 0)
            : undefined;
          const netWeightDisplay = totalNetWeight !== undefined ? totalNetWeight : '--';
          const pieceCount = pieceEntriesForLink.length || allPieceEntries.length;

          const link = getFabricBarcodeLink({
            barcode: primaryBarcodeValue,
            fabricCode: primaryPieceData?.fabricCode || fabricCode || record.fabricDetails || '',
            fabricQuality: primaryPieceData?.fabricQuality || fabricQuality || record.fabricDetails || '',
            grade: primaryPieceData?.grade || record.grade,
            meter: primaryPieceData?.meter ?? record.quantityReceived,
            netWeight: totalNetWeight,
            companyId,
            pieceEntries: pieceEntriesForLink.length > 0 ? pieceEntriesForLink : undefined,
          });

          if (!link) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          return (
            <div className="flex flex-col gap-1 text-xs">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                Barcode
              </a>
            </div>
          );
        },
      },
      {
        Header: 'Actions',
        id: 'actions',
        disableFilters: true,
        width: 'auto',
        Cell: ({ row }: { row: any }) => {
          const record = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {canView && (
                <button
                  onClick={() => handleView(record)}
                  className="rounded-lg border border-blue-100 bg-blue-50/60 p-2 text-blue-600 transition hover:border-blue-200"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              {canEdit && (
                    <button
                      onClick={() => handleEdit(record)}
                      className="rounded-lg border border-amber-100 bg-amber-50/60 p-2 text-amber-600 transition hover:border-amber-200"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(record)}
                      className="rounded-lg border border-rose-100 bg-rose-50/70 p-2 text-rose-600 transition hover:border-rose-200"
                      title="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
            </div>
          );
        }
      },
    ],
    [canView, canEdit, canDelete, handleView, handleEdit, handleDelete]
  );

  const extractPieceEntriesForRow = useCallback((record: any): FabricBarcodePiece[] => {
    const allPieceEntries = (record.items ?? []).flatMap((item: any) => item.pieceEntries ?? []);
    const [fabricCode, fabricQuality] = (record.fabricDetails || '').split(' - ');
    return allPieceEntries
      .map((piece: any) => {
        const barcodeValue = piece.pieceNumber || piece.pieceRollNo || piece.pieceNo;
        if (!barcodeValue) return null;
        const fd = piece.fabricDetails || piece.finishedFabricCodeQuality || record.fabricDetails || '';
        const [fcp, fqp] = fd.split(' - ');
        const meter = piece.meter ?? piece.quantity ?? record.quantityReceived;
        const netWeight = piece.inspectedNtWt ?? piece.netWeight ?? piece.weight;
        return {
          barcode: barcodeValue,
          fabricCode: fcp || fabricCode || '',
          fabricQuality: fqp || fabricQuality || '',
          grade: piece.grade ?? record.grade,
          meter,
          netWeight: netWeight ?? undefined,
        } as FabricBarcodePiece;
      })
      .filter((e: any): e is FabricBarcodePiece => Boolean(e));
  }, []);

  const handleToggleRow = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean, data: any[]) => {
    setSelectedIds(checked ? new Set(data.map((r: any) => r.id)) : new Set());
  }, []);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleCancelSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const totalBarcodeCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      const row = processedData.find((r: any) => r.id === id);
      if (row) count += extractPieceEntriesForRow(row).length;
    }
    return count;
  }, [selectedIds, processedData, extractPieceEntriesForRow]);

  const checkboxColumn = useMemo(() => ({
    id: 'bulkSelect',
    Header: (
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={processedData.length > 0 && selectedIds.size === processedData.length}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked, processedData)}
          className="w-3.5 h-3.5 cursor-pointer accent-black"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
        <span className="text-xs font-semibold">All</span>
      </div>
    ),
    accessor: 'id',
    disableFilters: true,
    width: 60,
    Cell: ({ row }: { row: any }) => {
      const id = row.original.id;
      return (
        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <input type="checkbox" checked={selectedIds.has(id)} onChange={() => handleToggleRow(id)} className="w-3.5 h-3.5 cursor-pointer accent-black" />
        </div>
      );
    }
  }), [processedData, selectedIds, handleSelectAll, handleToggleRow]);

  const activeColumns = useMemo(() => {
    if (!selectMode) return columns;
    const filtered = columns.filter((c: any) => c.accessor !== 'barcodeLink');
    const actionsIdx = filtered.findIndex((c: any) => c.accessor === 'actions' || c.id === 'actions');
    if (actionsIdx >= 0) return [...filtered.slice(0, actionsIdx), checkboxColumn, ...filtered.slice(actionsIdx)];
    return [...filtered, checkboxColumn];
  }, [selectMode, columns, checkboxColumn]);

  const handleOpenBarcodeStickerPage = useCallback(() => {
    const allEntries: FabricBarcodePiece[] = [];
    for (const id of selectedIds) {
      const row = processedData.find((r: any) => r.id === id);
      if (row) allEntries.push(...extractPieceEntriesForRow(row));
    }
    if (!allEntries.length) return;
    const link = getFabricBarcodeLink({ barcode: allEntries[0].barcode, pieceEntries: allEntries, companyId: selectedCompanyId });
    if (link) window.open(link, '_blank');
    setIsBulkPrintModalOpen(false);
  }, [selectedIds, processedData, extractPieceEntriesForRow, selectedCompanyId]);

  const confirmDelete = async () => {
    if (!currentRecord) return;

    const companyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const companyIdNumber = companyId ? Number(companyId) : undefined;

    if (!companyIdNumber) {
      console.error("No company ID found");
      return;
    }

    try {
      await dispatch(hardDeleteJobworkFabricReceive({ id: currentRecord.id, companyId: companyIdNumber })).unwrap();
      // await dispatch(deleteJobworkFabricReceive({ id: currentRecord.id, companyId: companyIdNumber })).unwrap();
      await dispatch(getAllJobworkFabricReceive({
        companyId: companyIdNumber,
        fetchAll: true,
      }));
    } catch (error) {
      console.error("Error deleting JobworkFabricReceive:", error);
    }

    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
       <div className="pb-5">
      {selectMode && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-0 bg-blue-200 border border-primary rounded-t-md">
          <div className="flex items-center gap-3 text-sm text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m14.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" /><rect x="3" y="7" width="18" height="13" rx="2" strokeWidth={2} /></svg>
            <span className="font-semibold">{selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} selected</span>
            <span className="text-primary text-xs">{totalBarcodeCount} {totalBarcodeCount === 1 ? 'barcode' : 'barcodes'} will be printed</span>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleClearSelection} className="text-xs text-primary hover:text-primary font-medium underline-offset-2 hover:underline">
                Clear
              </button>
            )}
            <button
              disabled={selectedIds.size === 0}
              onClick={() => setIsBulkPrintModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedIds.size === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary shadow'}`}
            >
              Print Bundle of Barcodes
            </button>
          </div>
        </div>
      )}
      </div>
      {/* <h1 className="text-2xl font-semibold mb-6">Jobwork Fabric Receive Management</h1> */}
      <DataTable
        columns={activeColumns}
        data={processedData}
        title="Jobwork Fabric Receive Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={false}
        filterPlaceholder="Search receives..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        onRowClick={selectMode ? (row) => handleToggleRow(row.id) : undefined}
        getRowClassName={selectMode ? (row) => selectedIds.has(row.id) ? 'bg-[#EDE7F6]' : '' : undefined}
      headerActions={
          <button
            onClick={() => selectMode ? handleCancelSelectMode() : setSelectMode(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${selectMode ? 'border-blue-600 bg-blue-600 text-white shadow' : 'border-blue-600 bg-white text-blue-700 hover:bg-blue-50'}`}
          >
            {selectMode ? 'Cancel Selection' : 'Print Multiple Barcode'}
          </button>
        }
      />

      {/* Bulk Print Confirmation Modal */}
      <Modal isOpen={isBulkPrintModalOpen} onClose={() => setIsBulkPrintModalOpen(false)} title="Print Bundle of Barcodes" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{totalBarcodeCount}</span> barcode sticker{totalBarcodeCount !== 1 ? 's' : ''} across{' '}
            <span className="font-semibold text-gray-800">{selectedIds.size}</span> {selectedIds.size === 1 ? 'entry' : 'entries'} will be sent to the sticker page.
          </p>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md bg-gray-50">
            {Array.from(selectedIds).map(id => {
              const row = processedData.find((r: any) => r.id === id);
              if (!row) return null;
              const count = extractPieceEntriesForRow(row).length;
              return (
                <div key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{row.receiveNo || `Receive #${row.id}`}</span>
                    <span className="ml-2 text-xs text-gray-500">{row.jobFabricReceiveDate ? new Date(row.jobFabricReceiveDate).toLocaleDateString() : ''}</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                    {count} {count === 1 ? 'barcode' : 'barcodes'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setIsBulkPrintModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Cancel</button>
            <button onClick={handleOpenBarcodeStickerPage} className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary-light rounded-md transition-colors font-semibold">Open Barcode Sticker Page</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete" >
        <div className="space-y-4">
          <p>Are you sure you want to delete receive record (ID: {currentRecord?.id})?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary" >
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>
      {/* View Modal - Enhanced to show all details */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Fabric Receive Details`} className="max-w-4xl" >
        {currentRecord && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Contract No</p>
                <p className="font-medium">{weavingContractMap[Number(currentRecord.weavingContractId)] || currentRecord.weavingContractNo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vendor</p>
                <p className="font-medium">{vendorMap?.[currentRecord.vendorId] || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Receive Date</p>
                <p className="font-medium">{new Date(currentRecord.jobFabricReceiveDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium">{currentRecord.remarks || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">dc Number</p>
                <p className="font-medium">{currentRecord.dcNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">dc Date</p>
                <p className="font-medium">{currentRecord.dcDate ? new Date(currentRecord.dcDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs ${currentRecord.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {currentRecord.activeFlag ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
            {/* Items Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Received Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty Received</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contract Item ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pieces</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentRecord.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.quantityReceived}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.price}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.weavingContractItemId}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.pieceEntries?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Piece Entries Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Piece Details</h3>
              {currentRecord.items?.some((item: any) => item.pieceEntries?.length > 0) ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piece No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sort No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentRecord.items?.flatMap((item: any) =>
                        item.pieceEntries?.map((piece: any) => (
                          <tr key={piece.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.pieceNumber}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.fabricMasterId ? (fabricMasterMap.get(Number(piece.fabricMasterId)) || '-') : '-'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.quantity}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.weight}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.cost}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.remarks || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No piece details available</p>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary" >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}