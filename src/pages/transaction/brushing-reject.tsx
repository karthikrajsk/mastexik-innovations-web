import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllBrushingReceivesByCompany, updateBrushingReceive } from "@/state/brushingSlice";
import { getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";
import { getCompanyById } from "@/state/company-master-slice";
import { DataTable } from "@/components/data/DataTable";
import { toast } from "react-toastify";
import { X, Save, Edit, Trash2, AlertCircle, CheckSquare } from "lucide-react";

export default function BrushingReject() {
    const dispatch = useDispatch<AppDispatch>();
    const { brushingReceivesList, loading } = useSelector((state: RootState) => state.brushing);
    const { fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster);

    const [companyId, setCompanyId] = useState<number | null>(null);
    const [companyName, setCompanyName] = useState<string>("");

    // Multi-selection state
    const [selectedRollIds, setSelectedRollIds] = useState<Set<number>>(new Set());

    // Single Edit / Delete Modal State
    const [editingRoll, setEditingRoll] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [deletingRoll, setDeletingRoll] = useState<any | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Form fields state for single editing
    const [editUnwoundMeters, setEditUnwoundMeters] = useState<string>("");
    const [editUnwoundWeight, setEditUnwoundWeight] = useState<string>("");
    const [editUnwindStatus, setEditUnwindStatus] = useState<string>("REJECTED");
    const [editRejectedReason, setEditRejectedReason] = useState<string>("");
    const [editReturnType, setEditReturnType] = useState<string>("");
    const [editRejectionDate, setEditRejectionDate] = useState<string>("");
    const [editUnwindRemarks, setEditUnwindRemarks] = useState<string>("");
    const [editDcNo, setEditDcNo] = useState<string>("");
    const [editHfplDcNo, setEditHfplDcNo] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // Bulk Edit / Delete Modal State
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkUnwindStatus, setBulkUnwindStatus] = useState<string>("REJECTED");
    const [bulkRejectionDate, setBulkRejectionDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [bulkReturnType, setBulkReturnType] = useState<string>("Returnable");
    const [bulkDcNo, setBulkDcNo] = useState<string>("");
    const [bulkHfplDcNo, setBulkHfplDcNo] = useState<string>("");
    const [bulkRejectedReason, setBulkRejectedReason] = useState<string>("");
    const [bulkUnwindRemarks, setBulkUnwindRemarks] = useState<string>("");

    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    // Fetch dependencies on mount and selected company change
    useEffect(() => {
        const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        dispatch(getAllFabricMastersForDropdown());
        if (storedCompanyId) {
            const numericCompanyId = Number(storedCompanyId);
            setCompanyId(numericCompanyId);
            dispatch(getAllBrushingReceivesByCompany(numericCompanyId));
            dispatch(getCompanyById({ id: numericCompanyId }) as any).then((result: any) => {
                const company = result?.payload;
                if (company) {
                    setCompanyName(
                        company.companyName || company.name || company.company_name || ""
                    );
                }
            });
        }
    }, [dispatch]);

    // Fabric construction lookup map: fabricMasterId → "fabricCode - fabricQuality"
    const fabricLookupMap = useMemo(() => {
        const map: Record<number, string> = {};
        const list = Array.isArray(fabricMasterFullList) ? fabricMasterFullList : [];
        list.forEach((fm: any) => {
            if (fm?.id != null) {
                const code = fm.fabricCode || "";
                const quality = fm.fabricQuality || "";
                map[fm.id] = code && quality ? `${code} - ${quality}` : code || quality || "—";
            }
        });
        return map;
    }, [fabricMasterFullList]);

    // Flatten all rolls from brushing receives
    const allRolls = useMemo(() => {
        const list = Array.isArray(brushingReceivesList) ? brushingReceivesList : [];
        const rolls: any[] = [];
        list.forEach((rec: any) => {
            if (rec.details && Array.isArray(rec.details)) {
                rec.details.forEach((d: any) => {
                    rolls.push({
                        ...d,
                        parentReceiveId:          rec.id,
                        parentReceiveChallanNo:   rec.receiveChallanNo,
                        parentReceiveDate:        rec.receiveDate,
                        parentReceiveOrderType:   rec.orderType,
                        parentReceiveBuyerId:     rec.buyerId,
                        parentReceiveStatus:      rec.status,
                        parentReceiveRemarks:     rec.remarks,
                        parentReceiveDetails:     rec.details,
                        companyId:                rec.companyId,
                    });
                });
            }
        });
        return rolls;
    }, [brushingReceivesList]);

    // Filter only rejected rolls
    const rejectRolls = useMemo(() => {
        return allRolls.filter(r => (r.isRejected ?? 0) === 1 || r.unwindStatus === "REJECTED");
    }, [allRolls]);

    // Multi-selection handlers
    const handleToggleSelectRow = (id: number) => {
        setSelectedRollIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedRollIds.size === rejectRolls.length) {
            setSelectedRollIds(new Set());
        } else {
            const allIds = new Set<number>();
            rejectRolls.forEach((r) => {
                if (r.id) allIds.add(r.id);
            });
            setSelectedRollIds(allIds);
        }
    };

    // Column configurations
    const columns = useMemo(() => {
        const selectCol = {
            Header: () => (
                <input
                    type="checkbox"
                    checked={rejectRolls.length > 0 && selectedRollIds.size === rejectRolls.length}
                    onChange={handleSelectAll}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
            ),
            id: "select",
            width: 40,
            disableFilters: true,
            Cell: ({ row }: any) => (
                <input
                    type="checkbox"
                    checked={row.original.id ? selectedRollIds.has(row.original.id) : false}
                    onChange={() => row.original.id && handleToggleSelectRow(row.original.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
            ),
        };

        const commonStartCols = [
            selectCol,
            {
                Header: "S.No",
                id: "serialNo",
                accessor: "id",
                width: 50,
                disableFilters: true,
                Cell: ({ row }: any) => row.index + 1,
            },
            {
                Header: "Date",
                accessor: "date",
                id: "date",
                minWidth: 100,
            },
            {
                Header: "Party Name",
                id: "companyPartyName",
                accessor: "id",
                minWidth: 130,
                disableFilters: true,
                Cell: () => (
                    <span className="flex items-center gap-1 font-semibold text-slate-700 text-xs">
                        {companyName || "—"}
                    </span>
                ),
            },
            {
                Header: "Ref Party Name",
                accessor: "partyName",
                id: "partyName",
                minWidth: 120,
            },
            {
                Header: "Invoice No",
                accessor: "invoiceNo",
                id: "invoiceNo",
                minWidth: 100,
            },
            {
                Header: "TC",
                accessor: "tc",
                id: "tc",
                minWidth: 70,
            },
            {
                Header: "Construction",
                accessor: "fabricMasterId",
                id: "construction",
                minWidth: 200,
                Cell: ({ row }: any) => {
                    const fabricMasterId = row.original.fabricMasterId;
                    const construction = fabricMasterId
                        ? (fabricLookupMap[fabricMasterId] || row.original.construction || "—")
                        : (row.original.construction || "—");
                    return (
                        <span
                            className="font-semibold text-slate-700 text-xs"
                            title={construction}
                        >
                            {construction}
                        </span>
                    );
                },
            },
            {
                Header: "Weave",
                accessor: "weave",
                id: "weave",
                minWidth: 80,
            },
            {
                Header: "Piece No.",
                accessor: "pieceNumber",
                id: "pieceNumber",
                minWidth: 125,
                Cell: ({ value }: any) => (
                    <span className="font-bold text-slate-800 tracking-wide text-xs">{value}</span>
                )
            },
        ];

        return [
            ...commonStartCols,
            {
                Header: "Receiving Mtr",
                accessor: "greigeMeters",
                id: "greigeMeters",
                minWidth: 100,
                Cell: ({ value }: any) => (Number(value) || 0).toFixed(2)
            },
            {
                Header: "Net Wt",
                accessor: "greigeWeight",
                id: "greigeWeight",
                minWidth: 90,
                Cell: ({ value }: any) => (Number(value) || 0).toFixed(3)
            },
            {
                Header: "GLM",
                accessor: "glm",
                id: "glm",
                minWidth: 70,
                Cell: ({ value }: any) => (Number(value) || 0).toFixed(3)
            },
            {
                Header: "Gross Wt",
                accessor: "greigeGrossWt",
                id: "greigeGrossWt",
                minWidth: 90,
                Cell: ({ value }: any) => (Number(value) || 0).toFixed(3)
            },
            {
                Header: "Actual Unwound Mtr",
                accessor: "unwoundMeters",
                id: "unwoundMeters",
                minWidth: 145,
                Cell: ({ value }: any) => (Number(value) || 0).toFixed(2)
            },
            {
                Header: "Actual Unwound Wt",
                accessor: "unwoundWeight",
                id: "unwoundWeight",
                minWidth: 145,
                Cell: ({ value }: any) => (Number(value) || 0).toFixed(3)
            },
            {
                Header: "Variation",
                accessor: "variation",
                id: "variation",
                minWidth: 90,
                Cell: ({ row }: any) => {
                    const diff = (Number(row.original.unwoundMeters) || 0) - (Number(row.original.greigeMeters) || 0);
                    return (
                        <span className={`font-bold ${diff > 0.5 ? 'text-green-600' : diff < -0.5 ? 'text-red-600' : 'text-slate-600'}`}>
                            {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} m
                        </span>
                    );
                }
            },
            {
                Header: "Unwind Status",
                accessor: "unwindStatus",
                id: "unwindStatus",
                minWidth: 115,
                Cell: ({ value }: any) => (
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700">
                        {value || "REJECTED"}
                    </span>
                )
            },
            {
                Header: "Remarks",
                accessor: "unwindRemarks",
                id: "unwindRemarks",
                minWidth: 140,
                Cell: ({ value }: any) => value || "—"
            },
            {
                Header: "HFPL DC No",
                accessor: "hfplDcNo",
                id: "hfplDcNo",
                minWidth: 140,
                Cell: ({ value }: any) => value || "—"
            },
            {
                Header: "DC No",
                accessor: "dcNo",
                id: "dcNo",
                minWidth: 100,
                Cell: ({ value }: any) => value || "—"
            },
            {
                Header: "Return Type",
                accessor: "returnType",
                id: "returnType",
                minWidth: 120,
                Cell: ({ value }: any) => value || "—"
            },
            {
                Header: "Rejection Date",
                accessor: "rejectionDate",
                id: "rejectionDate",
                minWidth: 120,
                Cell: ({ row }: any) => row.original.rejectionDate || row.original.returnDate || "—"
            },
            {
                Header: "Reason for Rejection",
                accessor: "rejectedReason",
                id: "rejectedReason",
                minWidth: 200,
                Cell: ({ row }: any) => {
                    const val = row.original.rejectedReason || row.original.returnReason || "—";
                    return (
                        <span className="font-semibold text-rose-700 text-xs" title={val}>
                            {val}
                        </span>
                    );
                }
            }
        ];
    }, [fabricLookupMap, companyName, selectedRollIds, rejectRolls]);

    // Open Single Edit Modal
    const handleOpenEditModal = (row: any) => {
        setEditingRoll(row);
        setEditUnwoundMeters(row.unwoundMeters != null ? String(row.unwoundMeters) : String(row.greigeMeters || ""));
        setEditUnwoundWeight(row.unwoundWeight != null ? String(row.unwoundWeight) : String(row.greigeWeight || ""));
        setEditUnwindStatus(row.unwindStatus || "REJECTED");
        setEditRejectedReason(row.rejectedReason || row.returnReason || "");
        setEditReturnType(row.returnType || "Returnable");
        setEditRejectionDate(row.rejectionDate || row.returnDate || new Date().toISOString().split("T")[0]);
        setEditUnwindRemarks(row.unwindRemarks || "");
        setEditDcNo(row.dcNo || "");
        setEditHfplDcNo(row.hfplDcNo || "");
        setIsEditModalOpen(true);
    };

    // Save Single Edited Roll
    const handleSaveEdit = async () => {
        if (!editingRoll || !editingRoll.parentReceiveId) return;
        setIsSaving(true);
        try {
            const parentReceive = (brushingReceivesList || []).find((r: any) => r.id === editingRoll.parentReceiveId);
            if (!parentReceive) {
                toast.error("Parent receive record not found.");
                setIsSaving(false);
                return;
            }

            const isRej = editUnwindStatus === "REJECTED" ? 1 : 0;
            const isRet = editUnwindStatus === "RETURN" ? 1 : 0;
            const isAcc = editUnwindStatus === "ACCEPTED" ? 1 : 0;

            const updatedDetails = (parentReceive.details || []).map((dtl: any) => {
                if (dtl.id === editingRoll.id || (dtl.pieceNumber && dtl.pieceNumber === editingRoll.pieceNumber)) {
                    return {
                        ...dtl,
                        unwoundMeters: Number(editUnwoundMeters) || 0,
                        unwoundWeight: Number(editUnwoundWeight) || 0,
                        unwindStatus: editUnwindStatus,
                        isRejected: isRej,
                        isReturn: isRet,
                        isUnwound: isAcc ? 1 : (isRej || isRet ? 0 : dtl.isUnwound),
                        rejectedReason: (isRej || isRet) ? editRejectedReason : null,
                        returnReason: (isRej || isRet) ? editRejectedReason : null,
                        returnType: (isRej || isRet) ? editReturnType : null,
                        rejectionDate: (isRej || isRet) ? editRejectionDate : null,
                        returnDate: (isRej || isRet) ? editRejectionDate : null,
                        unwindRemarks: editUnwindRemarks,
                        dcNo: (isRej || isRet) ? editDcNo : null,
                        hfplDcNo: (isRej || isRet) ? editHfplDcNo : null,
                    };
                }
                return dtl;
            });

            const updateDto = {
                ...parentReceive,
                details: updatedDetails,
            };

            await dispatch(updateBrushingReceive({ id: parentReceive.id, dto: updateDto })).unwrap();
            toast.success("Roll details updated successfully!");
            setIsEditModalOpen(false);
            if (companyId) {
                dispatch(getAllBrushingReceivesByCompany(companyId));
            }
        } catch (error: any) {
            console.error("Failed to edit roll:", error);
            toast.error(error?.message || "Failed to update roll details");
        } finally {
            setIsSaving(false);
        }
    };

    // Open Delete Confirmation Modal
    const handleOpenDeleteModal = (row: any) => {
        setDeletingRoll(row);
        setIsDeleteModalOpen(true);
    };

    // Confirm Single Delete action (Revert is_rejected = 0, is_return = 0)
    const handleConfirmDelete = async () => {
        if (!deletingRoll || !deletingRoll.parentReceiveId) return;
        setIsSaving(true);
        try {
            const parentReceive = (brushingReceivesList || []).find((r: any) => r.id === deletingRoll.parentReceiveId);
            if (!parentReceive) {
                toast.error("Parent receive record not found.");
                setIsSaving(false);
                return;
            }

            const updatedDetails = (parentReceive.details || []).map((dtl: any) => {
                if (dtl.id === deletingRoll.id || (dtl.pieceNumber && dtl.pieceNumber === deletingRoll.pieceNumber)) {
                    return {
                        ...dtl,
                        isRejected: 0,
                        isReturn: 0,
                        isUnwound: 0,
                        unwindStatus: "PENDING",
                        rejectedReason: null,
                        returnReason: null,
                        rejectionDate: null,
                        returnDate: null,
                        returnType: null,
                        dcNo: null,
                    };
                }
                return dtl;
            });

            const updateDto = {
                ...parentReceive,
                details: updatedDetails,
            };

            await dispatch(updateBrushingReceive({ id: parentReceive.id, dto: updateDto })).unwrap();
            toast.success("Rejected roll record deleted/reverted successfully!");
            setIsDeleteModalOpen(false);
            if (companyId) {
                dispatch(getAllBrushingReceivesByCompany(companyId));
            }
        } catch (error: any) {
            console.error("Failed to delete rejected roll:", error);
            toast.error(error?.message || "Failed to delete rejected roll");
        } finally {
            setIsSaving(false);
        }
    };

    // Bulk Save Edited Rolls
    const handleSaveBulkEdit = async () => {
        if (selectedRollIds.size === 0) return;
        setIsSaving(true);
        try {
            const parentMap = new Map<number, any>();
            rejectRolls.forEach((r) => {
                if (r.id && selectedRollIds.has(r.id) && r.parentReceiveId) {
                    if (!parentMap.has(r.parentReceiveId)) {
                        const parent = (brushingReceivesList || []).find((p: any) => p.id === r.parentReceiveId);
                        if (parent) {
                            parentMap.set(r.parentReceiveId, parent);
                        }
                    }
                }
            });

            let successCount = 0;
            let failCount = 0;

            for (const [parentReceiveId, parentReceive] of parentMap.entries()) {
                const updatedDetails = (parentReceive.details || []).map((dtl: any) => {
                    if (dtl.id && selectedRollIds.has(dtl.id)) {
                        const isRej = bulkUnwindStatus === "REJECTED" ? 1 : 0;
                        const isRet = bulkUnwindStatus === "RETURN" ? 1 : 0;
                        const isAcc = bulkUnwindStatus === "ACCEPTED" ? 1 : 0;
                        return {
                            ...dtl,
                            unwindStatus: bulkUnwindStatus,
                            isRejected: isRej,
                            isReturn: isRet,
                            isUnwound: isAcc ? 1 : (isRej || isRet ? 0 : dtl.isUnwound),
                            rejectedReason: (isRej || isRet) ? (bulkRejectedReason || dtl.rejectedReason) : null,
                            returnReason: (isRej || isRet) ? (bulkRejectedReason || dtl.returnReason) : null,
                            rejectionDate: (isRej || isRet) ? (bulkRejectionDate || dtl.rejectionDate) : null,
                            returnDate: (isRej || isRet) ? (bulkRejectionDate || dtl.returnDate) : null,
                            returnType: (isRej || isRet) ? (bulkReturnType || dtl.returnType) : null,
                            dcNo: (isRej || isRet) ? (bulkDcNo || dtl.dcNo) : null,
                            hfplDcNo: (isRej || isRet) ? (bulkHfplDcNo || dtl.hfplDcNo) : null,
                            unwindRemarks: bulkUnwindRemarks || dtl.unwindRemarks,
                        };
                    }
                    return dtl;
                });

                try {
                    await dispatch(updateBrushingReceive({ id: parentReceiveId, dto: { ...parentReceive, details: updatedDetails } })).unwrap();
                    successCount++;
                } catch (err) {
                    failCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully updated ${selectedRollIds.size} selected roll(s) in bulk!`);
            }
            if (failCount > 0) {
                toast.error(`Failed to update ${failCount} receive record(s).`);
            }

            setIsBulkEditModalOpen(false);
            setSelectedRollIds(new Set());
            if (companyId) {
                dispatch(getAllBrushingReceivesByCompany(companyId));
            }
        } catch (error: any) {
            console.error("Bulk edit failed:", error);
            toast.error("Failed to update selected rolls in bulk");
        } finally {
            setIsSaving(false);
        }
    };

    // Bulk Confirm Delete Action (Revert is_rejected = 0, is_return = 0)
    const handleConfirmBulkDelete = async () => {
        if (selectedRollIds.size === 0) return;
        setIsSaving(true);
        try {
            const parentMap = new Map<number, any>();
            rejectRolls.forEach((r) => {
                if (r.id && selectedRollIds.has(r.id) && r.parentReceiveId) {
                    if (!parentMap.has(r.parentReceiveId)) {
                        const parent = (brushingReceivesList || []).find((p: any) => p.id === r.parentReceiveId);
                        if (parent) {
                            parentMap.set(r.parentReceiveId, parent);
                        }
                    }
                }
            });

            let successCount = 0;
            let failCount = 0;

            for (const [parentReceiveId, parentReceive] of parentMap.entries()) {
                const updatedDetails = (parentReceive.details || []).map((dtl: any) => {
                    if (dtl.id && selectedRollIds.has(dtl.id)) {
                        return {
                            ...dtl,
                            isRejected: 0,
                            isReturn: 0,
                            isUnwound: 0,
                            unwindStatus: "PENDING",
                            rejectedReason: null,
                            returnReason: null,
                            rejectionDate: null,
                            returnDate: null,
                            returnType: null,
                            dcNo: null,
                        };
                    }
                    return dtl;
                });

                try {
                    await dispatch(updateBrushingReceive({ id: parentReceiveId, dto: { ...parentReceive, details: updatedDetails } })).unwrap();
                    successCount++;
                } catch (err) {
                    failCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully deleted/reverted ${selectedRollIds.size} selected roll(s)!`);
            }
            if (failCount > 0) {
                toast.error(`Failed to delete ${failCount} receive record(s).`);
            }

            setIsBulkDeleteModalOpen(false);
            setSelectedRollIds(new Set());
            if (companyId) {
                dispatch(getAllBrushingReceivesByCompany(companyId));
            }
        } catch (error: any) {
            console.error("Bulk delete failed:", error);
            toast.error("Failed to delete selected rolls");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 pt-16 min-h-screen bg-slate-50/50">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
                <DataTable
                    columns={columns}
                    data={rejectRolls}
                    title="Brushing Reject"
                    showActions={true}
                    showAddActions={false}
                    onEdit={handleOpenEditModal}
                    onDelete={handleOpenDeleteModal}
                    virtualScroll={true}
                    virtualScrollHeight="600px"
                    isShowPagination={false}
                    totalColumnKeys={["greigeMeters", "greigeWeight", "unwoundMeters", "unwoundWeight"]}
                    loading={loading}
                    headerActions={
                        <div className="flex items-center gap-3">
                            {selectedRollIds.size > 0 && (
                                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                                    <button
                                        onClick={() => {
                                            setBulkUnwindStatus("REJECTED");
                                            setIsBulkEditModalOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Bulk Edit ({selectedRollIds.size})
                                    </button>
                                    <button
                                        onClick={() => setIsBulkDeleteModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Bulk Delete ({selectedRollIds.size})
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                                <span>
                                    Total Rolls:{" "}
                                    <span className="text-blue-700 font-extrabold">
                                        {rejectRolls.length}
                                    </span>
                                </span>
                                <span className="w-px h-3 bg-slate-300" />
                                <span>
                                    Total Received Mtr:{" "}
                                    <span className="text-violet-700 font-extrabold">
                                        {rejectRolls.reduce((sum, r) => sum + (Number(r.greigeMeters) || 0), 0).toFixed(2)}
                                    </span>
                                </span>
                                <span className="w-px h-3 bg-slate-300" />
                                <span>
                                    Total Rejected Mtr:{" "}
                                    <span className="text-rose-700 font-extrabold">
                                        {rejectRolls.reduce((sum, r) => sum + (Number(r.unwoundMeters) || 0), 0).toFixed(2)}
                                    </span>
                                </span>
                            </div>
                        </div>
                    }
                />
            </div>

            {/* Dynamic Single Edit Modal Popup */}
            {isEditModalOpen && editingRoll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                <Edit className="h-4 w-4 text-rose-600" />
                                Update Rejected Roll (Piece: <span className="text-rose-700 font-mono">{editingRoll.pieceNumber}</span>)
                            </h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs font-medium text-slate-700 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">Unwind Status</label>
                                    <select
                                        value={editUnwindStatus}
                                        onChange={(e) => setEditUnwindStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold bg-white"
                                    >
                                        <option value="REJECTED">REJECTED</option>
                                        <option value="RETURN">RETURN</option>
                                        <option value="ACCEPTED">ACCEPTED</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">Rejection Date</label>
                                    <input
                                        type="date"
                                        value={editRejectionDate}
                                        onChange={(e) => setEditRejectionDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">Actual Unwound Mtr</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editUnwoundMeters}
                                        onChange={(e) => setEditUnwoundMeters(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">Actual Unwound Wt</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={editUnwoundWeight}
                                        onChange={(e) => setEditUnwoundWeight(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">Return Type</label>
                                    <select
                                        value={editReturnType}
                                        onChange={(e) => setEditReturnType(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold bg-white"
                                    >
                                        <option value="Returnable">Returnable</option>
                                        <option value="Non-Returnable">Non-Returnable</option>
                                        <option value="Full Return">Full Return</option>
                                        <option value="Partial Return">Partial Return</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">DC No</label>
                                    <input
                                        type="text"
                                        value={editDcNo}
                                        onChange={(e) => setEditDcNo(e.target.value)}
                                        placeholder="Enter DC No..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-slate-600">HFPL DC No</label>
                                <input
                                    type="text"
                                    value={editHfplDcNo}
                                    onChange={(e) => setEditHfplDcNo(e.target.value)}
                                    placeholder="Enter HFPL DC No..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-slate-600">Reason for Rejection</label>
                                <textarea
                                    rows={2}
                                    value={editRejectedReason}
                                    onChange={(e) => setEditRejectedReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-slate-600">Remarks</label>
                                <input
                                    type="text"
                                    value={editUnwindRemarks}
                                    onChange={(e) => setEditUnwindRemarks(e.target.value)}
                                    placeholder="Enter remarks..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 bg-white shadow-xs hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? "Updating..." : "Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Single Delete Confirmation Modal Popup */}
            {isDeleteModalOpen && deletingRoll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Delete Rejected Roll?</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Are you sure you want to remove rejected status for piece{" "}
                                    <span className="font-bold text-slate-800">{deletingRoll.pieceNumber}</span>? This roll will be reverted back to received pending status.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 bg-white shadow-xs hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isSaving}
                                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                {isSaving ? "Deleting..." : "Delete Rejected"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Bulk Edit Modal Popup */}
            {isBulkEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                <Edit className="h-4 w-4 text-blue-600" />
                                Bulk Update ({selectedRollIds.size} Selected Rolls)
                            </h3>
                            <button
                                onClick={() => setIsBulkEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs font-medium text-slate-700 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">Unwind Status</label>
                                    <select
                                        value={bulkUnwindStatus}
                                        onChange={(e) => setBulkUnwindStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white"
                                    >
                                        <option value="REJECTED">REJECTED</option>
                                        <option value="RETURN">RETURN</option>
                                        <option value="ACCEPTED">ACCEPTED</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">Rejection/Return Date</label>
                                    <input
                                        type="date"
                                        value={bulkRejectionDate}
                                        onChange={(e) => setBulkRejectionDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">Return Type</label>
                                    <select
                                        value={bulkReturnType}
                                        onChange={(e) => setBulkReturnType(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white"
                                    >
                                        <option value="Returnable">Returnable</option>
                                        <option value="Non-Returnable">Non-Returnable</option>
                                        <option value="Full Return">Full Return</option>
                                        <option value="Partial Return">Partial Return</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 font-bold text-slate-600">DC No</label>
                                    <input
                                        type="text"
                                        value={bulkDcNo}
                                        onChange={(e) => setBulkDcNo(e.target.value)}
                                        placeholder="Enter DC No..."
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-slate-600">HFPL DC No</label>
                                <input
                                    type="text"
                                    value={bulkHfplDcNo}
                                    onChange={(e) => setBulkHfplDcNo(e.target.value)}
                                    placeholder="Enter HFPL DC No..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-slate-600">Reason for Rejection / Return</label>
                                <textarea
                                    rows={2}
                                    value={bulkRejectedReason}
                                    onChange={(e) => setBulkRejectedReason(e.target.value)}
                                    placeholder="Enter reason..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 font-bold text-slate-600">Remarks</label>
                                <input
                                    type="text"
                                    value={bulkUnwindRemarks}
                                    onChange={(e) => setBulkUnwindRemarks(e.target.value)}
                                    placeholder="Enter remarks..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsBulkEditModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 bg-white shadow-xs hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveBulkEdit}
                                disabled={isSaving}
                                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? "Updating Bulk..." : `Update All ${selectedRollIds.size} Rolls`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dynamic Bulk Delete Confirmation Modal Popup */}
            {isBulkDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Delete {selectedRollIds.size} Selected Rolls?</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Are you sure you want to remove rejected status for all <span className="font-bold text-slate-800">{selectedRollIds.size}</span> selected rolls? They will be reverted back to received pending status.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsBulkDeleteModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 bg-white shadow-xs hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmBulkDelete}
                                disabled={isSaving}
                                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                {isSaving ? "Deleting Bulk..." : `Delete All ${selectedRollIds.size} Rolls`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
