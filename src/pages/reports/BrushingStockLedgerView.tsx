import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllBrushingReceivesByCompany } from "@/state/brushingSlice";
import { getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";
import { getCompanyById } from "@/state/company-master-slice";
import { DataTable } from "@/components/data/DataTable";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BrushingStockLedgerView() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { brushingReceivesList, loading } = useSelector((state: RootState) => state.brushing);
    const { fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster);

    const date = searchParams.get("date") || "";
    const sortNo = searchParams.get("sortNo") || "";
    const construction = searchParams.get("construction") || "";

    const [companyId, setCompanyId] = useState<number | null>(null);
    const [companyName, setCompanyName] = useState<string>("");
    const [activeTab, setActiveTab] = useState<"received" | "returned" | "dispatched">("received");

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
                    setCompanyName(company.companyName || company.name || company.company_name || "");
                }
            });
        }
    }, [dispatch]);

    // Fabric Code lookup map: fabricMasterId → fabricCode
    const fabricLookupMap = useMemo(() => {
        const map: Record<number, string> = {};
        const list = Array.isArray(fabricMasterFullList) ? fabricMasterFullList : [];
        list.forEach((fm: any) => {
            if (fm?.id != null && fm.fabricCode) {
                map[fm.id] = fm.fabricCode;
            }
        });
        return map;
    }, [fabricMasterFullList]);

    // Flatten all rolls from receives list
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

    // Filter rolls by sortNo and construction
    const filteredRolls = useMemo(() => {
        return allRolls.filter((r) => {
            const resolvedSortNo = r.fabricMasterId ? (fabricLookupMap[r.fabricMasterId] || "") : "";
            const matchesSort = resolvedSortNo.toLowerCase() === sortNo.toLowerCase() || sortNo === "null";
            const matchesConst = (r.construction || "").toLowerCase() === construction.toLowerCase() || construction === "null";
            return matchesSort && matchesConst;
        });
    }, [allRolls, fabricLookupMap, sortNo, construction]);

    // Segment rolls
    const receivedRolls = useMemo(() => {
        return filteredRolls.filter(r => r.parentReceiveDate === date);
    }, [filteredRolls, date]);

    const returnedRolls = useMemo(() => {
        return filteredRolls.filter(r => (r.isRejected ?? 0) === 1 && r.rejectionDate === date);
    }, [filteredRolls, date]);

    const dispatchedRolls = useMemo(() => {
        return filteredRolls.filter(r => (r.isDispatched === 1 || r.brushingStatus === "DISPATCHED") && (r.dispatchDate === date || (r.dispatchDate == null && r.parentReceiveDate === date)));
    }, [filteredRolls, date]);

    // Format date string (YYYY-MM-DD -> DD/MM/YYYY)
    const displayDateStr = useMemo(() => {
        if (!date) return "";
        const parts = date.split("-");
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return date;
    }, [date]);

    // Columns configs
    const receivedColumns = useMemo(() => [
        { Header: "S.No", id: "serialNo", accessor: "id", width: 50, disableFilters: true, Cell: ({ row }: any) => row.index + 1 },
        { Header: "Roll No", accessor: "pieceNumber", id: "pieceNumber", minWidth: 120, Cell: ({ value }: any) => <span className="font-bold text-slate-800">{value}</span> },
        { Header: "Challan No", accessor: "parentReceiveChallanNo", id: "challanNo", minWidth: 130 },
        { Header: "Ref Invoice No", accessor: "invoiceNo", id: "invoiceNo", minWidth: 110, Cell: ({ value }: any) => value || "—" },
        { Header: "Greige Mtrs", accessor: "greigeMeters", id: "greigeMeters", minWidth: 100, Cell: ({ value }: any) => Number(value || 0).toFixed(2) },
        { Header: "Net Wt (Kg)", accessor: "greigeWeight", id: "greigeWeight", minWidth: 100, Cell: ({ value }: any) => Number(value || 0).toFixed(3) },
        { Header: "Gross Wt (Kg)", accessor: "greigeGrossWt", id: "greigeGrossWt", minWidth: 100, Cell: ({ value }: any) => Number(value || 0).toFixed(3) },
        { Header: "GLM", accessor: "glm", id: "glm", minWidth: 80, Cell: ({ value }: any) => Number(value || 0).toFixed(3) },
        { Header: "TC", accessor: "tc", id: "tc", minWidth: 80, Cell: ({ value }: any) => value || "—" },
        { Header: "Weave", accessor: "weave", id: "weave", minWidth: 80, Cell: ({ value }: any) => value || "—" },
    ], []);

    const returnedColumns = useMemo(() => [
        { Header: "S.No", id: "serialNo", accessor: "id", width: 50, disableFilters: true, Cell: ({ row }: any) => row.index + 1 },
        { Header: "Roll No", accessor: "pieceNumber", id: "pieceNumber", minWidth: 120, Cell: ({ value }: any) => <span className="font-bold text-slate-800">{value}</span> },
        { Header: "Return Mtr", accessor: "greigeMeters", id: "greigeMeters", minWidth: 100, Cell: ({ value }: any) => Number(value || 0).toFixed(2) },
        { Header: "Return Weight", accessor: "greigeWeight", id: "greigeWeight", minWidth: 110, Cell: ({ value }: any) => Number(value || 0).toFixed(3) },
        { Header: "HFPL DC No", accessor: "hfplDcNo", id: "hfplDcNo", minWidth: 140, Cell: ({ value }: any) => value || "—" },
        { Header: "DC No", accessor: "dcNo", id: "dcNo", minWidth: 110, Cell: ({ value }: any) => value || "—" },
        { Header: "Return Type", accessor: "returnType", id: "returnType", minWidth: 120, Cell: ({ value }: any) => value || "—" },
        { Header: "Reason for Rejection", accessor: "rejectedReason", id: "rejectedReason", minWidth: 200, Cell: ({ value }: any) => <span className="font-semibold text-rose-700">{value || "—"}</span> },
    ], []);

    const dispatchedColumns = useMemo(() => [
        { Header: "S.No", id: "serialNo", accessor: "id", width: 50, disableFilters: true, Cell: ({ row }: any) => row.index + 1 },
        { Header: "Roll No", accessor: "pieceNumber", id: "pieceNumber", minWidth: 120, Cell: ({ value }: any) => <span className="font-bold text-slate-800">{value}</span> },
        { Header: "HFPL Roll No", accessor: "hfplRollNo", id: "hfplRollNo", minWidth: 130, Cell: ({ value }: any) => value || "—" },
        { Header: "Unwound Mtr", accessor: "unwoundMeters", id: "unwoundMeters", minWidth: 110, Cell: ({ value }: any) => Number(value || 0).toFixed(2) },
        { Header: "Unwound Weight", accessor: "unwoundWeight", id: "unwoundWeight", minWidth: 120, Cell: ({ value }: any) => Number(value || 0).toFixed(3) },
        { Header: "Pass Mtr", accessor: "passMtr", id: "passMtr", minWidth: 100, Cell: ({ value }: any) => Number(value || 0).toFixed(2) },
        { Header: "HFPL Invoice No", accessor: "hfplInvoiceNo", id: "hfplInvoiceNo", minWidth: 130, Cell: ({ value }: any) => value || "—" },
        { Header: "Remarks", accessor: "unwindRemarks", id: "remarks", minWidth: 140, Cell: ({ value }: any) => value || "—" },
    ], []);

    const currentData = activeTab === "received" ? receivedRolls : activeTab === "returned" ? returnedRolls : dispatchedRolls;
    const currentColumns = activeTab === "received" ? receivedColumns : activeTab === "returned" ? returnedColumns : dispatchedColumns;
    const currentTitle = activeTab === "received" ? "Received Rolls Breakdown" : activeTab === "returned" ? "Returned Rolls Breakdown" : "Dispatched Rolls Breakdown";

    return (
        <div className="p-6 pt-16 space-y-6 bg-slate-50/50 min-h-screen">
            {/* Header controls */}
            <div className="flex items-center gap-3">
                <Button onClick={() => navigate(-1)} variant="outline" size="sm" className="bg-white border-slate-200">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Ledger
                </Button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Ledger Auditor View</h1>
                    <p className="text-xs text-slate-500">Trace rolls for a specific date, sort, and construction.</p>
                </div>
            </div>

            {/* Selection Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 border-indigo-200">
                    <CardContent className="p-4">
                        <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Date & Company</p>
                        <p className="text-base font-extrabold text-indigo-900 mt-1">{displayDateStr || "—"}</p>
                        <p className="text-xs text-indigo-600 font-semibold mt-0.5">{companyName || "—"}</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
                    <CardContent className="p-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sort No</p>
                        <p className="text-base font-extrabold text-slate-900 mt-1">{sortNo || "—"}</p>
                        <p className="text-xs text-slate-600 mt-0.5">Fabric Reference Code</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
                    <CardContent className="p-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Construction</p>
                        <p className="text-base font-extrabold text-slate-900 mt-1 max-w-full truncate" title={construction}>{construction || "—"}</p>
                        <p className="text-xs text-slate-600 mt-0.5">Thread Count & Density</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tab Select Buttons & Statistics */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 max-w-max">
                    <button
                        onClick={() => setActiveTab("received")}
                        className={`px-4 py-1.5 text-xs font-bold capitalize rounded-lg transition-all flex items-center gap-1.5 ${
                            activeTab === "received" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                        }`}
                    >
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        Received ({receivedRolls.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("returned")}
                        className={`px-4 py-1.5 text-xs font-bold capitalize rounded-lg transition-all flex items-center gap-1.5 ${
                            activeTab === "returned" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600 hover:text-slate-850"
                        }`}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Returned ({returnedRolls.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("dispatched")}
                        className={`px-4 py-1.5 text-xs font-bold capitalize rounded-lg transition-all flex items-center gap-1.5 ${
                            activeTab === "dispatched" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-850"
                        }`}
                    >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        Dispatched ({dispatchedRolls.length})
                    </button>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span>
                        Selected Sum:{" "}
                        <span className="text-blue-600 font-bold">
                            {currentData.reduce((sum, r) => sum + (Number(r.greigeMeters || r.unwoundMeters || 0)), 0).toFixed(2)} Mtrs
                        </span>
                    </span>
                    <span className="w-px h-3 bg-slate-350" />
                    <span>
                        Selected Weight:{" "}
                        <span className="text-emerald-600 font-bold">
                            {currentData.reduce((sum, r) => sum + (Number(r.greigeWeight || r.unwoundWeight || 0)), 0).toFixed(3)} Kg
                        </span>
                    </span>
                </div>
            </div>

            {/* Table Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
                <DataTable
                    columns={currentColumns}
                    data={currentData}
                    title={currentTitle}
                    showActions={false}
                    showAddActions={false}
                    loading={loading}
                />
            </div>
        </div>
    );
}
