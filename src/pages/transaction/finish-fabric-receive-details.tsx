import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { Edit, Trash } from "lucide-react";
import { FabricBarcodePiece, getFabricBarcodeLink } from "@/lib/barcode";
import { 
  deleteFinishFabricReceive, 
  getAllFinishFabricReceivesByType 
} from "@/state/finishFabricReceiveSlice";
import { getAllDyeingWorkOrders } from "@/state/processContractSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllGrandMaster } from "@/state/gradeMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import React, { useCallback } from "react";
import { getAllVendors } from "@/state/vendorSlice";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";


export function FinishFabricReceiveDetails() {
    const { finishFabricReceiveList, paginationInfo } = useSelector((state: RootState) => state.finishFabricReceive);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);
    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
    const { gradeList } = useSelector((state: RootState) => state.grade);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentFinishFabricReceive, setCurrentFinishFabricReceive] = useState<any>(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });
    const selectedCompanyId = useMemo(() => {
        const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        return stored ? Number(stored) : undefined;
    }, []);

    useEffect(() => {
        const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        const companyId = v ? Number(v) : undefined;
        dispatch(getAllFinishFabricReceivesByType({ processType: "FABRIC", companyId, fetchAll: true }));
        dispatch(getAllVendors({}));
        dispatch(getAllDyeingWorkOrders({}));
        dispatch(getAllFabricMasters({} as any));
        dispatch(getAllGrandMaster({} as any));
    }, [dispatch, currentPage, getOffset, itemsPerPage]);

    const vendorMap = useMemo(() => {
        return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
            acc[vendor.id] = vendor.vendorName;
            return acc;
        }, {}) || {};
    }, [vendorList]);

    const fabricMasterData = useMemo(() => {
        const raw = fabricMasterList as any;
        if (Array.isArray(raw?.data)) return raw.data;
        if (Array.isArray(raw)) return raw;
        return [];
    }, [fabricMasterList]);

    const fabricMasterLookup = useMemo(() => {
        const byId = new Map<string, any>();
        const byCode = new Map<string, any>();
        fabricMasterData.forEach((fabric: any) => {
            const id = fabric?.id ?? fabric?.fabricMasterId ?? fabric?.fabricId ?? fabric?.fabric_code_id;
            if (id != null) {
                byId.set(String(id), fabric);
            }
            const code = (fabric?.fabricCode ?? fabric?.code ?? fabric?.fabric_code ?? '')?.toString().trim().toUpperCase();
            if (code) {
                byCode.set(code, fabric);
            }
        });
        return { byId, byCode };
    }, [fabricMasterData]);

    const gradeArray = useMemo(() => {
        if (Array.isArray(gradeList)) return gradeList;
        if (Array.isArray((gradeList as any)?.data)) return (gradeList as any).data;
        return [];
    }, [gradeList]);

    const gradeMap = useMemo(() => {
        const map = new Map<string, string>();
        gradeArray.forEach((grade: any) => {
            const id = grade?.id ?? grade?.gradeId ?? grade?.grade_id;
            const name = (grade?.gradeName ?? grade?.grade_name ?? grade?.gradeCode ?? grade?.grade_code ?? '').toString().trim();
            if (id != null && name) {
                map.set(String(id), name);
            }
        });
        return map;
    }, [gradeArray]);

    const formatThreeDecimalValue = (value: any) => {
        if (value == null || value === "") return undefined;
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return undefined;
        return numeric.toFixed(3);
    };

    const computeAvgWeightValue = (candidate: any, netWeight: any, meter: any) => {
        const formatted = formatThreeDecimalValue(candidate);
        if (formatted != null) return formatted;
        const numericNet = Number(netWeight);
        const numericMeter = Number(meter);
        if (Number.isFinite(numericNet) && Number.isFinite(numericMeter) && numericMeter !== 0) {
            return (numericNet / numericMeter).toFixed(3);
        }
        return undefined;
    };

    const resolveFabricMasterRecord = (piece: any, record: any) => {
        const idCandidates = [
            piece?.finishedFabricCodeId,
            piece?.fabricMasterId,
            piece?.fabricCodeId,
            piece?.fabric_id,
            piece?.fabricMaster?.id,
            record?.finishedFabricCodeId,
            record?.fabricMasterId,
            record?.fabricCodeId,
            record?.fabric_id
        ];
        for (const candidate of idCandidates) {
            if (candidate == null) continue;
            const key = String(candidate).trim();
            if (!key) continue;
            const found = fabricMasterLookup.byId.get(key);
            if (found) return found;
        }
        const codeCandidates = [
            piece?.finishedFabricCode,
            piece?.fabricCode,
            piece?.fabric_code,
            record?.finishedFabricCode,
            record?.fabricCode,
            record?.fabric_code
        ];
        for (const candidate of codeCandidates) {
            if (!candidate) continue;
            const normalized = String(candidate).trim().toUpperCase();
            if (!normalized) continue;
            const found = fabricMasterLookup.byCode.get(normalized);
            if (found) return found;
        }
        return undefined;
    };

    const resolveFabricCodeValue = (piece: any, record: any) => {
        const master = resolveFabricMasterRecord(piece, record);
        if (master) {
            return master.fabricCode ?? master.fabric_code ?? master.code ?? '';
        }
        return (
            piece?.fabricCode ??
            piece?.finishedFabricCode ??
            piece?.fabric_code ??
            record?.finishedFabricCode ??
            record?.fabricCode ??
            record?.fabric_code ??
            ''
        );
    };

    const resolveFabricQualityValue = (piece: any, record: any) => {
        const master = resolveFabricMasterRecord(piece, record);
        if (master) {
            return master.fabricQuality ?? master.fabric_quality ?? master.quality ?? '';
        }
        return (
            piece?.fabricQuality ??
            piece?.quality ??
            piece?.finishedFabricQuality ??
            piece?.finishedFabricName ??
            record?.finishedFabricName ??
            record?.greigeFabricName ??
            record?.fabricQuality ??
            record?.quality ??
            ''
        );
    };

    const resolveGradeNameValue = (piece: any, record: any) => {
        const gradeIdCandidates = [
            piece?.gradeId,
            piece?.grade_id,
            piece?.gradeMasterId,
            piece?.grandMasterId,
            piece?.gradeMaster?.id,
            record?.gradeId,
            record?.grade_id,
            record?.gradeMasterId,
            record?.grandMasterId,
            record?.gradeMaster?.id,
            record?.rawData?.gradeId,
            record?.rawData?.grade_id,
            record?.rawData?.gradeMasterId,
            record?.rawData?.grade_master_id
        ];
        for (const candidate of gradeIdCandidates) {
            if (candidate == null) continue;
            const mapped = gradeMap.get(String(candidate));
            if (mapped) return mapped;
        }
        const fallbackGrade = (
            piece?.grade ??
            piece?.gradeName ??
            piece?.grade_name ??
            record?.grade ??
            record?.gradeName ??
            record?.grade_name ??
            record?.rawData?.grade ??
            record?.rawData?.gradeName ??
            ''
        );
        return fallbackGrade ? String(fallbackGrade) : undefined;
    };

    const resolveMeterValue = (piece: any, record: any) => {
        const candidates = [
            piece?.meter,
            piece?.meters,
            piece?.length,
            piece?.quantity,
            piece?.pieceMeter,
            piece?.piece_meter,
            record?.receivedQuantity,
            record?.received_quantity,
            record?.quantity
        ];
        for (const candidate of candidates) {
            if (candidate != null && candidate !== '') return candidate;
        }
        return undefined;
    };

    const resolveNetWeightValue = (piece: any, record: any) => {
        const candidates = [
            piece?.netWeight,
            piece?.net_weight,
            piece?.inspectedNtWt,
            piece?.weight,
            record?.netWeight,
            record?.net_weight,
            record?.weight,
            record?.rawData?.netWeight,
            record?.rawData?.net_weight
        ];
        for (const candidate of candidates) {
            if (candidate != null && candidate !== '') return candidate;
        }
        return undefined;
    };

    // Create a map of dyeingWorkOrderId to fabricItems
    const workOrderFabricMap = useMemo(() => {
        return processContractList?.reduce((acc: Record<number, any>, contract: any) => {
            if (contract.fabricItems && contract.fabricItems.length > 0) {
                acc[contract.id] = contract.fabricItems[0]; // Get first fabric item
            }
            return acc;
        }, {}) || {};
    }, [processContractList]);

    // Create a map of dyeingWorkOrderId to dyeingWorkOrderNo
    const workOrderNoMap = useMemo(() => {
        return processContractList?.reduce((acc: Record<number, string>, contract: any) => {
            acc[contract.id] = contract.dyeingWorkOrderNo || '-';
            return acc;
        }, {}) || {};
    }, [processContractList]);

    const processedList = useMemo(() => {
        return finishFabricReceiveList
            .filter((item: any) => item.processType === "FABRIC")
            .map((item: any, index: number) => {
                const fabricInfo = workOrderFabricMap[item.dyeingWorkOrderId];
                const processContractNo = workOrderNoMap[item.dyeingWorkOrderId];
                return {
                    ...item,
                    serialNo: (paginationInfo?.offset || 0) + index + 1,
                    finishedFabricName: fabricInfo?.finishedFabricName || '-',
                    greigeFabricName: fabricInfo?.greigeFabricName || '-',
                    processContractNo: processContractNo || '-'
                };
            });
    }, [finishFabricReceiveList, workOrderFabricMap, workOrderNoMap, paginationInfo]);

    const extractPieceEntriesForRow = useCallback((record: any): FabricBarcodePiece[] => {
        const allPieceEntries = (record.items ?? []).flatMap((item: any) => item.pieceEntries ?? []);
        return allPieceEntries
            .map((piece: any) => {
                const barcodeValue = piece.pieceNumber || piece.pieceRollNo || piece.pieceNo;
                if (!barcodeValue) return null;
                const fabricCode = resolveFabricCodeValue(piece, record);
                const fabricQuality = resolveFabricQualityValue(piece, record);
                const meter = resolveMeterValue(piece, record);
                const netWeight = resolveNetWeightValue(piece, record);
                return {
                    barcode: barcodeValue,
                    fabricCode,
                    fabricQuality,
                    meter,
                    netWeight: netWeight ?? undefined,
                } as FabricBarcodePiece;
            })
            .filter((e: any): e is FabricBarcodePiece => Boolean(e));
    }, [resolveFabricCodeValue, resolveFabricQualityValue, resolveMeterValue, resolveNetWeightValue]);

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
            const row = processedList.find((r: any) => r.id === id);
            if (row) count += extractPieceEntriesForRow(row).length;
        }
        return count;
    }, [selectedIds, processedList, extractPieceEntriesForRow]);

    const handleOpenBarcodeStickerPage = useCallback(() => {
        const allEntries: FabricBarcodePiece[] = [];
        for (const id of selectedIds) {
            const row = processedList.find((r: any) => r.id === id);
            if (row) allEntries.push(...extractPieceEntriesForRow(row));
        }
        if (!allEntries.length) return;
        const link = getFabricBarcodeLink({ barcode: allEntries[0].barcode, pieceEntries: allEntries, companyId: selectedCompanyId });
        if (link) window.open(link, '_blank');
        setIsBulkPrintModalOpen(false);
    }, [selectedIds, processedList, extractPieceEntriesForRow, selectedCompanyId]);

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
                accessor: 'fabricReceiveDate',
                Cell: ({ value }: { value: string }) => 
                    value ? new Date(value).toLocaleDateString() : '-',
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
                Header: 'Receive No',
                accessor: 'receiveNo',
            },
            {
                Header: 'Process Contract No',
                accessor: 'processContractNo',
                width: 150,
            },
            {
                Header: 'Finished Fabric',
                accessor: 'finishedFabricCode',
            },
            {
                Header: 'Greige Fabric',
                accessor: 'greigeFabricCode',
            },
           
            {
                Header: 'Order Qty',
                accessor: 'orderQuantity',
                Cell: ({ value }: { value: number }) => value?.toFixed(2) || '0.00'
            },
            {
                Header: 'Received Qty',
                accessor: 'receivedQuantity',
                Cell: ({ value }: { value: number }) => value?.toFixed(2) || '0.00'
            },
             {
                Header: "Barcode",
                accessor: "barcodeLink",
                disableFilters: true,
                Cell: ({ row }: { row: any }) => {
                    const record = row.original;
                    const companyId = record.companyId ?? selectedCompanyId;
                    const pieceEntries = (record.items ?? []).flatMap((item: any) => item.pieceEntries ?? []);

                    const pieceEntriesForLink = pieceEntries
                        .map((piece: any) => {
                            const barcodeValue = piece.pieceNumber || piece.pieceRollNo || piece.pieceNo;
                            if (!barcodeValue) {
                                return null;
                            }

                            const fabricCode = resolveFabricCodeValue(piece, record);
                            const fabricQuality = resolveFabricQualityValue(piece, record);
                            const grade = resolveGradeNameValue(piece, record);
                            const meter = resolveMeterValue(piece, record);
                            const netWeight = resolveNetWeightValue(piece, record);
                            const avgWeight = computeAvgWeightValue(
                                piece?.avgWeight ?? piece?.avg_weight ?? record?.avgWeight ?? record?.avg_weight,
                                netWeight,
                                meter ?? record?.receivedQuantity,
                            );

                            return {
                                barcode: barcodeValue,
                                fabricCode,
                                fabricQuality,
                                // grade,
                                meter,
                                netWeight: netWeight ?? undefined,
                                // avgWeight,
                            } as FabricBarcodePiece;
                        })
                        .filter((entry: any): entry is FabricBarcodePiece => Boolean(entry));

                    const primaryPieceData = pieceEntriesForLink[0];
                    const primaryBarcodeValue = pieceEntriesForLink[0]?.barcode || record.receiveNo || `FIN-${record.id}`;

                    if (!primaryBarcodeValue) {
                        return <span className="text-xs text-secondary-500">-</span>;
                    }

                    const netWeightValues = pieceEntriesForLink
                        .map((entry: { netWeight: any }) => entry.netWeight)
                        .filter((value:any): value is string | number => value !== undefined && value !== null);
                    const totalNetWeight = netWeightValues.length
                        ? netWeightValues.reduce((sum: number, value: any) => sum + Number(value), 0)
                        : undefined;
                    const pieceCount = pieceEntriesForLink.length || pieceEntries.length;

                    const link = getFabricBarcodeLink({
                        barcode: primaryBarcodeValue,
                        fabricCode: primaryPieceData?.fabricCode || record.finishedFabricName || record.greigeFabricName || '',
                        fabricQuality: primaryPieceData?.fabricQuality || record.finishedFabricName || record.greigeFabricName || '',
                        grade: primaryPieceData?.grade || record.grade,
                        meter: primaryPieceData?.meter ?? record.receivedQuantity,
                        netWeight: totalNetWeight,
                        avgWeight: primaryPieceData?.avgWeight,
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
                }
            },
        ],
        [
            selectedCompanyId,
            resolveFabricCodeValue,
            resolveFabricQualityValue,
            resolveGradeNameValue,
            resolveMeterValue,
            resolveNetWeightValue,
            computeAvgWeightValue,
        ]
    );

    const checkboxColumn = useMemo(() => ({
        id: 'bulkSelect',
        Header: (
            <div className="flex items-center gap-1.5">
                <input
                    type="checkbox"
                    checked={processedList.length > 0 && selectedIds.size === processedList.length}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked, processedList)}
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
    }), [processedList, selectedIds, handleSelectAll, handleToggleRow]);

    const activeColumns = useMemo(() => {
        if (!selectMode) return columns;
        const filtered = columns.filter((c: any) => c.accessor !== 'barcodeLink');
        const actionsIdx = filtered.findIndex((c: any) => c.accessor === 'actions' || c.id === 'actions');
        if (actionsIdx >= 0) return [...filtered.slice(0, actionsIdx), checkboxColumn, ...filtered.slice(actionsIdx)];
        return [...filtered, checkboxColumn];
    }, [selectMode, columns, checkboxColumn]);

    const handleAdd = () => {
        navigate("/transaction/processing-receive-fabric");
    };

    const handleEdit = (finishFabricReceive: any) => {
        navigate("/transaction/processing-receive-fabric", { state: { finishFabricReceive } });
    };

    const handleDelete = (finishFabricReceive: any) => {
        setCurrentFinishFabricReceive(finishFabricReceive);
        setIsDeleteModalOpen(true);
    };

    const handleView = (finishFabricReceive: any) => {
        setCurrentFinishFabricReceive(finishFabricReceive);
        setIsViewModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentFinishFabricReceive) return;
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = v ? Number(v) : undefined;
            await dispatch(deleteFinishFabricReceive({ id: currentFinishFabricReceive.id, companyId, processType: "FABRIC" }) as any).unwrap();
            await dispatch(getAllFinishFabricReceivesByType({ processType: "FABRIC", companyId , fetchAll: true }) as any);
        } catch (error) {
            console.error("Error deleting Finish Fabric Receive:", error);
        }
        setIsDeleteModalOpen(false);
    };

    return (
        <div>
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
            <DataTable
                columns={activeColumns}
                data={processedList}
                title="Fabric Receives"
                onAdd={handleAdd}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={true}
                filterPlaceholder="Search fabric receives..."
                showColumnFilters={true}
                disableFullDataFetch={true}
                // initialPageSize={itemsPerPage}
                // onPageSizeChange={setItemsPerPage}
                // totalCount={paginationInfo?.total || 0}
                // currentPage={currentPage}
                // onPageChange={handlePageChange}
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

            {/* <div className="mt-4 flex justify-between items-center px-4">
                <div className="text-sm text-gray-600">
                    Showing {processedList.length > 0 ? (paginationInfo?.offset || 0) + 1 : 0} - {(paginationInfo?.offset || 0) + processedList.length} of {paginationInfo?.total || 0}
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalItems={paginationInfo?.total || 0}
                    itemsPerPage={itemsPerPage}
                    offset={paginationInfo?.offset || 0}
                    hasNext={!!paginationInfo?.next}
                    hasPrev={!!paginationInfo?.prev}
                    onPageChange={handlePageChange}
                />
            </div> */}

            {/* Bulk Print Confirmation Modal */}
            <Modal isOpen={isBulkPrintModalOpen} onClose={() => setIsBulkPrintModalOpen(false)} title="Print Bundle of Barcodes" className="max-w-lg">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">{totalBarcodeCount}</span> barcode sticker{totalBarcodeCount !== 1 ? 's' : ''} across{' '}
                        <span className="font-semibold text-gray-800">{selectedIds.size}</span> {selectedIds.size === 1 ? 'entry' : 'entries'} will be sent to the sticker page.
                    </p>
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md bg-gray-50">
                        {Array.from(selectedIds).map(id => {
                            const row = processedList.find((r: any) => r.id === id);
                            if (!row) return null;
                            const count = extractPieceEntriesForRow(row).length;
                            return (
                                <div key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-800">{row.receiveNo || `Receive #${row.id}`}</span>
                                        <span className="ml-2 text-xs text-gray-500">{row.fabricReceiveDate ? new Date(row.fabricReceiveDate).toLocaleDateString() : ''}</span>
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
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <p>Are you sure you want to delete this Fabric Receive?</p>
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

            {/* View Details Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Fabric Receive Details"
                className="w-full max-w-4xl"
            >
                {currentFinishFabricReceive && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-secondary-500">Receive Date</p>
                                <p className="font-medium">
                                    {currentFinishFabricReceive.fabricReceiveDate 
                                        ? new Date(currentFinishFabricReceive.fabricReceiveDate).toLocaleDateString()
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Process Type</p>
                                <p className="font-medium capitalize">{currentFinishFabricReceive.processType?.toLowerCase()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Finished Fabric Name</p>
                                <p className="font-medium">{currentFinishFabricReceive.finishedFabricName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Greige Fabric Name</p>
                                <p className="font-medium">{currentFinishFabricReceive.greigeFabricName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Order Quantity</p>
                                <p className="font-medium">{currentFinishFabricReceive.orderQuantity?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Received Quantity</p>
                                <p className="font-medium">{currentFinishFabricReceive.receivedQuantity?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Balance Quantity</p>
                                <p className="font-medium">{currentFinishFabricReceive.balanceQuantity?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Cost Per Pound</p>
                                <p className="font-medium">${currentFinishFabricReceive.costPerPound?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Total Amount</p>
                                <p className="font-medium">${currentFinishFabricReceive.totalAmount?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Status</p>
                                <p>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        currentFinishFabricReceive.activeFlag
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {currentFinishFabricReceive.activeFlag ? 'Active' : 'Inactive'}
                                    </span>
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-secondary-500">Remarks</p>
                                <p className="font-medium">{currentFinishFabricReceive.remarks || 'No remarks'}</p>
                            </div>
                        </div>

                        {/* Items Section */}
                        {currentFinishFabricReceive.items && currentFinishFabricReceive.items.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-medium mb-2">Received Fabric Items</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">#</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Sort No-Construction</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Piece/Roll No</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Meter</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Yards</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Net Weight</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Avg Weight</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentFinishFabricReceive.items.map((item: any, idx: number) => (
                                                <tr key={item.id} className="border">
                                                    <td className="px-4 py-2 border">{idx + 1}</td>
                                                    <td className="px-4 py-2 border">{item.finishedFabricCodeQuality}</td>
                                                    <td className="px-4 py-2 border">{item.pieceRollNo}</td>
                                                    <td className="px-4 py-2 border">{item.meter?.toFixed(2)}</td>
                                                    <td className="px-4 py-2 border">{item.yards?.toFixed(2)}</td>
                                                    <td className="px-4 py-2 border">{item.netWeight?.toFixed(2)}</td>
                                                    <td className="px-4 py-2 border">{item.averageWeight?.toFixed(2)}</td>
                                                    <td className="px-4 py-2 border">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            item.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {item.activeFlag ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

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