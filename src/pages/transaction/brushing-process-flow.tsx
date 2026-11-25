import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllBrushingReceivesByCompany, updateBrushingReceive } from "@/state/brushingSlice";
import { getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getCompanyById } from "@/state/company-master-slice";
import { getAllMachines } from "@/state/machineMasterSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data/DataTable";
import { Save, X, ChevronRight, Search, SkipForward, ListChecks, Building2, Zap, CheckCheck } from "lucide-react";
import { toast } from "react-toastify";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/ApiService";

// ─────────────────────────── Inline cell components ───────────────────────────

function UnwindMetersCell({ roll, onChange }: { roll: any; onChange: (val: string) => void }) {
    const value = roll.unwoundMeters ?? "";
    const [val, setVal] = useState(() => String(value));
    useEffect(() => { setVal(String(value)); }, [value]);
    return (
        <div className="flex items-center gap-1 justify-center">
            <Input
                type="number"
                step="0.01"
                value={val}
                onChange={(e) => { setVal(e.target.value); }}
                onBlur={() => { onChange(val); }}
                disabled={roll.isDispatched === 1}
                className="h-8 w-24 text-center font-semibold text-black rounded-lg border-slate-200 bg-white"
            />
        </div>
    );
}

function UnwindWeightCell({ roll, onChange }: { roll: any; onChange: (val: string) => void }) {
    const value = roll.unwoundWeight ?? "";
    const [val, setVal] = useState(() => String(value));
    useEffect(() => { setVal(String(value)); }, [value]);
    return (
        <div className="flex items-center gap-1 justify-center">
            <Input
                type="number"
                step="0.01"
                value={val}
                onChange={(e) => { setVal(e.target.value); }}
                onBlur={() => { onChange(val); }}
                disabled={roll.isDispatched === 1}
                className="h-8 w-24 text-center font-semibold text-black rounded-lg border-slate-200 bg-white"
            />
        </div>
    );
}

function UnwindStatusCell({ roll, onChange }: { roll: any; onChange: (val: string) => void }) {
    const value = roll.unwindStatus || "PENDING";
    const [val, setVal] = useState(value);
    useEffect(() => { setVal(value); }, [value]);

    const cls =
        val === "ACCEPTED" ? "border-green-200 bg-green-50 text-green-700 font-bold" :
        val === "REJECTED" ? "border-rose-200 bg-rose-50 text-rose-700 font-bold" :
        val === "RETURN" ? "border-purple-200 bg-purple-50 text-purple-700 font-bold" :
        "border-yellow-200 bg-yellow-50 text-yellow-700 font-bold";
    return (
        <select
            value={val}
            onChange={(e) => {
                const newVal = e.target.value;
                setVal(newVal);
                onChange(newVal);
            }}
            disabled={roll.isDispatched === 1}
            className={`h-8 rounded-lg border px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${cls}`}
        >
            <option value="PENDING" className="bg-white text-yellow-700 font-semibold">Pending</option>
            <option value="ACCEPTED" className="bg-white text-green-700 font-semibold">Accepted</option>
            <option value="REJECTED" className="bg-white text-rose-700 font-semibold">Rejected</option>
            <option value="RETURN" className="bg-white text-purple-700 font-semibold">Return</option>
        </select>
    );
}

function UnwindRemarksCell({ roll, onChange }: { roll: any; onChange: (val: string) => void }) {
    const value = roll.unwindRemarks ?? "";
    const [val, setVal] = useState(value);
    useEffect(() => { setVal(value); }, [value]);
    return (
        <Input
            type="text"
            value={val}
            onChange={(e) => { setVal(e.target.value); }}
            onBlur={() => { onChange(val); }}
            disabled={roll.isDispatched === 1}
            placeholder="Remarks..."
            className="h-8 min-w-[120px] text-xs rounded-lg border-slate-200 text-black font-semibold bg-white"
        />
    );
}

function BrushedMetersCell({ roll, onChange, disabled }: { roll: any; onChange: (val: string) => void; disabled?: boolean }) {
    const value = roll.brushedMeters ?? "";
    const [val, setVal] = useState(() => String(value));
    useEffect(() => { setVal(String(value)); }, [value]);

    if (disabled) {
        return <span className="font-semibold text-slate-700 text-xs">{(Number(value) || 0).toFixed(2)}</span>;
    }

    return (
        <Input
            type="number"
            step="0.01"
            value={val}
            onChange={(e) => { setVal(e.target.value); }}
            onBlur={() => { onChange(val); }}
            disabled={roll.isDispatched === 1}
            className="h-8 w-24 text-center font-semibold text-black rounded-lg border-slate-200 mx-auto bg-white"
        />
    );
}

function BrushedWeightCell({ roll, onChange, disabled }: { roll: any; onChange: (val: string) => void; disabled?: boolean }) {
    const value = roll.brushedWeight ?? "";
    const [val, setVal] = useState(() => String(value));
    useEffect(() => { setVal(String(value)); }, [value]);

    if (disabled) {
        return <span className="font-semibold text-slate-700 text-xs">{(Number(value) || 0).toFixed(3)}</span>;
    }

    return (
        <Input
            type="number"
            step="0.01"
            value={val}
            onChange={(e) => { setVal(e.target.value); }}
            onBlur={() => { onChange(val); }}
            disabled={roll.isDispatched === 1}
            className="h-8 w-24 text-center font-semibold text-black rounded-lg border-slate-200 mx-auto bg-white"
        />
    );
}

function BrushedGrossWtCell({ roll, onChange, disabled }: { roll: any; onChange: (val: string) => void; disabled?: boolean }) {
    const value = roll.brushedGrossWt ?? "";
    const [val, setVal] = useState(() => String(value));
    useEffect(() => { setVal(String(value)); }, [value]);

    if (disabled) {
        return <span className="font-semibold text-slate-700 text-xs">{(Number(value) || 0).toFixed(3)}</span>;
    }

    return (
        <Input
            type="number"
            step="0.01"
            value={val}
            onChange={(e) => { setVal(e.target.value); }}
            onBlur={() => { onChange(val); }}
            disabled={roll.isDispatched === 1}
            className="h-8 w-24 text-center font-semibold text-black rounded-lg border-slate-200 mx-auto bg-white"
        />
    );
}

function BrushingMachineNoCell({ roll, onChange, disabled, machineList }: { roll: any; onChange: (val: string) => void; disabled?: boolean; machineList: any[] }) {
    const value = roll.brushingMachineNo || "Both";
    const [val, setVal] = useState(value);
    useEffect(() => { setVal(value); }, [value]);
    const list = Array.isArray(machineList) ? machineList : [];

    if (disabled) {
        return <span className="font-semibold text-slate-700 text-xs">{value || "Both"}</span>;
    }

    return (
        <select
            value={val}
            onChange={(e) => {
                const newVal = e.target.value;
                setVal(newVal);
                onChange(newVal);
            }}
            disabled={roll.isDispatched === 1}
            className="h-8 w-24 text-center text-xs rounded-lg border border-slate-200 mx-auto text-black font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
            <option value="Both">Both</option>
            {list.map((m: any) => (
                <option key={m.id} value={m.machineNo}>
                    {m.machineNo}
                </option>
            ))}
        </select>
    );
}

function BrushingStatusCell({ roll, onChange, disabled }: { roll: any; onChange: (val: string) => void; disabled?: boolean }) {
    const value = roll.brushingStatus ?? "PENDING";
    const [val, setVal] = useState(value);
    useEffect(() => { setVal(value); }, [value]);

    if (disabled) {
        if (value === "READY_FOR_DISPATCH") {
            return (
                <span className="inline-flex px-2 py-1 rounded-lg text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
                    Ready For Dispatch
                </span>
            );
        }
        return (
            <span className="inline-flex px-2 py-1 rounded-lg text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 uppercase tracking-wide">
                Under Brushing
            </span>
        );
    }

    const cls = val === "READY_FOR_DISPATCH"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-yellow-200 bg-yellow-50 text-yellow-700";
    return (
        <select
            value={val}
            onChange={(e) => {
                const newVal = e.target.value;
                setVal(newVal);
                onChange(newVal);
            }}
            disabled={roll.isDispatched === 1}
            className={`h-8 rounded-lg border px-2 py-0.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 ${cls}`}
        >
            <option value="PENDING">Under Brushing</option>
            <option value="READY_FOR_DISPATCH">Ready For Dispatch</option>
        </select>
    );
}

function RollingDateCell({ roll, onChange, disabled }: { roll: any; onChange: (val: string) => void; disabled?: boolean }) {
    const value = roll.brushingDate ?? "";
    const [val, setVal] = useState(value);
    useEffect(() => { setVal(value); }, [value]);

    if (disabled) {
        return <span className="font-semibold text-slate-700 text-xs">{value || "—"}</span>;
    }

    return (
        <div className="flex items-center gap-1 justify-center">
            <Input
                type="date"
                value={val}
                onChange={(e) => { setVal(e.target.value); }}
                onBlur={() => { onChange(val); }}
                disabled={roll.isDispatched === 1}
                className="h-8 min-w-[130px] text-center text-xs rounded-lg border-slate-200 mx-auto text-black font-semibold bg-white"
            />
        </div>
    );
}

function HfplRollNoCell({ roll, onChange, disabled }: { roll: any; onChange: (val: string) => void; disabled?: boolean }) {
    const value = roll.hfplRollNo ?? "";
    const [val, setVal] = useState(value);
    useEffect(() => { setVal(value); }, [value]);

    if (disabled) {
        return <span className="font-bold text-slate-800 text-xs">{value || "—"}</span>;
    }

    return (
        <Input
            type="text"
            value={val}
            onChange={(e) => { setVal(e.target.value); }}
            onBlur={() => { onChange(val); }}
            disabled={roll.isDispatched === 1}
            placeholder="HFPL roll..."
            className="h-8 w-24 text-center text-xs rounded-lg border-slate-200 mx-auto text-black font-semibold bg-white"
        />
    );
}

// ─────────────────────────── Popup field helpers ───────────────────────────

function PopupField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
            {children}
        </div>
    );
}

// ─────────────────────────── Bulk Update Popup ───────────────────────────

interface PopupFormState {
    unwoundMeters: string;
    unwoundWeight: string;
    unwoundGrossWt: string;
    unwindStatus: string;
    unwindRemarks: string;
    rejectedReason?: string;
    dcNo?: string;
    returnType?: string;
    brushedMeters: string;
    brushedWeight: string;
    brushedGrossWt: string;
    brushingStatus: string;
    brushingMachineNo: string;
    machineId?: number | null;
    brushingDate: string;
    hfplRollNo: string;
    updatingAt?: string;
}

function toLocalDatetimeString(dateVal?: Date | string | null): string {
    const d = dateVal ? new Date(dateVal) : new Date();
    if (isNaN(d.getTime())) return toLocalDatetimeString(new Date());
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

interface BulkUpdatePopupProps {
    queue: any[];
    index: number;
    formState: PopupFormState;
    setFormState: React.Dispatch<React.SetStateAction<PopupFormState>>;
    isSaving: boolean;
    onUpdate: () => void;
    onUpdateAllAtOnce: (formState: PopupFormState) => void;
    onSkip: () => void;
    onCancel: () => void;
    machineList: any[];
    activeTab: 'unwinding' | 'rolling' | 'dispatch' | 'return';
}

function BulkUpdatePopup({ queue, index, formState, setFormState, isSaving, onUpdate, onUpdateAllAtOnce, onSkip, onCancel, machineList, activeTab }: BulkUpdatePopupProps) {
    const activeDotRef = useRef<HTMLDivElement | null>(null);
    const allowAllAtOnce = activeTab !== 'rolling';
    const [bulkMode, setBulkMode] = useState<'all_at_once' | 'one_by_one'>(
        allowAllAtOnce && queue.length > 1 ? 'all_at_once' : 'one_by_one'
    );

    useEffect(() => {
        if (activeDotRef.current) {
            activeDotRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        }
    }, [index]);

    const isUnwinding = activeTab === 'unwinding';
    const roll = queue[index];
    if (!roll) return null;

    const set = (field: keyof PopupFormState) => (val: string) =>
        setFormState(prev => ({ ...prev, [field]: val }));

    const unwindStatusCls =
        formState.unwindStatus === "ACCEPTED" ? "border-green-300 bg-green-50 text-green-700 font-bold" :
        formState.unwindStatus === "REJECTED" ? "border-rose-300 bg-rose-50 text-rose-700 font-bold" :
        formState.unwindStatus === "RETURN" ? "border-purple-300 bg-purple-50 text-purple-700 font-bold" :
        "border-yellow-300 bg-yellow-50 text-yellow-700 font-bold";

    const brushingStatusCls = formState.brushingStatus === "READY_FOR_DISPATCH"
        ? "border-green-300 bg-green-50 text-green-700 font-bold"
        : "border-yellow-300 bg-yellow-50 text-yellow-700 font-bold";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${isUnwinding ? "max-w-2xl" : "max-w-3xl"} border border-slate-200`}>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-2xl gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 text-lg">
                            <Save className="w-4 h-4 text-blue-600 " />
                            Update Roll Status
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {bulkMode === 'all_at_once' ? (
                                <span>Updating <span className="font-bold text-blue-700">{queue.length}</span> selected rolls at once</span>
                            ) : (
                                <span className="text-lg">
                                    Roll <span className="font-bold text-blue-700 text-md">{index + 1}</span> of <span className="font-bold text-blue-700 text-md">{queue.length}</span> · Roll No: <span className="font-bold text-slate-900 text-lg">{roll.pieceNumber}</span>
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Mode Toggle Tabs (when queue has multiple rolls and allowAllAtOnce is enabled) */}
                    {allowAllAtOnce && queue.length > 1 && (
                        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setBulkMode('all_at_once')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                                    bulkMode === 'all_at_once'
                                        ? "bg-white text-blue-700 shadow-xs font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Update All At Once ({queue.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setBulkMode('one_by_one')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                                    bulkMode === 'one_by_one'
                                        ? "bg-white text-blue-700 shadow-xs font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <ListChecks className="w-3.5 h-3.5" />
                                Roll by Roll
                            </button>
                        </div>
                    )}

                    {/* Progress pills for one_by_one mode */}
                    {bulkMode === 'one_by_one' && (
                        <div 
                            className="flex items-center gap-1.5 mx-2 overflow-x-auto max-w-[150px] sm:max-w-[200px] no-scrollbar scroll-smooth"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <style>{`
                                .no-scrollbar::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                            {queue.map((_, i) => (
                                <div
                                    key={i}
                                    ref={i === index ? activeDotRef : undefined}
                                    className={`h-2 rounded-full transition-all flex-shrink-0 ${
                                        i === index ? "w-5 bg-blue-600" :
                                        i < index  ? "w-2 bg-green-500" :
                                        "w-2 bg-slate-200"
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Mode 1: Update All At Once ── */}
                {bulkMode === 'all_at_once' ? (
                    <div>
                        <div className="bg-amber-50/80 border-b border-amber-200/80 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
                            <span className="font-medium flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                Applying common status & remarks to all <strong>{queue.length}</strong> selected rolls at once. Individual roll meters & weights are retained.
                            </span>
                            <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                                <span className="font-semibold text-slate-700 text-xs whitespace-nowrap">Updating at:</span>
                                <Input
                                    type="datetime-local"
                                    value={formState.updatingAt || toLocalDatetimeString(new Date())}
                                    onChange={e => set("updatingAt")(e.target.value)}
                                    className="h-8 w-44 text-xs font-bold text-indigo-700 bg-white border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 ${isUnwinding ? "" : "md:grid-cols-2"} gap-4 p-6`}>
                            {/* Unwind section */}
                            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 flex flex-col gap-3">
                                <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2 mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                                    Unwind (Common Settings)
                                </h3>

                                <PopupField label="Unwind Status">
                                    <select
                                        value={formState.unwindStatus}
                                        onChange={e => set("unwindStatus")(e.target.value)}
                                        className={`h-9 rounded-lg border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${unwindStatusCls}`}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="ACCEPTED">Accepted</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="RETURN">Return</option>
                                    </select>
                                </PopupField>

                                {(formState.unwindStatus === "REJECTED" || formState.unwindStatus === "RETURN") && (
                                    <>
                                        <PopupField label={formState.unwindStatus === "RETURN" ? "Reason for Return" : "Reason for Rejection"}>
                                            <Input
                                                type="text"
                                                placeholder={formState.unwindStatus === "RETURN" ? "Enter reason for return..." : "Enter reason for rejection..."}
                                                value={formState.rejectedReason || ""}
                                                onChange={e => set("rejectedReason")(e.target.value)}
                                                className="h-9 bg-white border-rose-200 text-black font-semibold"
                                            />
                                        </PopupField>
                                        <PopupField label="HFPL DC No">
                                            <Input
                                                type="text"
                                                value="(Auto-generated on save)"
                                                disabled={true}
                                                className="h-9 bg-slate-100 border-rose-200 text-slate-500 font-semibold"
                                            />
                                        </PopupField>
                                        <PopupField label="DC No">
                                            <Input
                                                type="text"
                                                placeholder="Enter DC No..."
                                                value={formState.dcNo || ""}
                                                onChange={e => set("dcNo")(e.target.value)}
                                                className="h-9 bg-white border-rose-200 text-black font-semibold"
                                            />
                                        </PopupField>
                                        <PopupField label="Return Type">
                                            <select
                                                value={formState.returnType || "Returnable"}
                                                onChange={e => set("returnType")(e.target.value)}
                                                className="h-9 rounded-lg border border-rose-200 px-2 text-sm font-semibold text-black bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
                                            >
                                                <option value="Returnable">Returnable</option>
                                                <option value="Non-Returnable">Non-Returnable</option>
                                            </select>
                                        </PopupField>
                                    </>
                                )}

                                <PopupField label="Remarks">
                                    <Input
                                        type="text"
                                        placeholder="Enter common remarks..."
                                        value={formState.unwindRemarks}
                                        onChange={e => set("unwindRemarks")(e.target.value)}
                                        className="h-9 bg-white border-blue-200 text-black"
                                    />
                                </PopupField>
                            </div>

                            {/* Brushing section */}
                            {!isUnwinding && (
                                <div className="bg-orange-50/60 rounded-xl p-4 border border-orange-100 flex flex-col gap-3">
                                    <h3 className="font-bold text-orange-800 text-sm flex items-center gap-2 mb-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                                        Brushing (Common Settings)
                                    </h3>

                                    <PopupField label="Machine No">
                                        <select
                                            value={formState.brushingMachineNo}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const selectedMachine = (machineList || []).find((m: any) => m.machineNo === val);
                                                setFormState(prev => ({
                                                    ...prev,
                                                    brushingMachineNo: val,
                                                    machineId: selectedMachine ? selectedMachine.id : null
                                                }));
                                            }}
                                            className="h-9 rounded-lg border border-orange-200 px-2 text-sm font-semibold text-black bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                                        >
                                            <option value="Both">Both</option>
                                            {(machineList || []).map((m: any) => (
                                                <option key={m.id} value={m.machineNo}>
                                                    {m.machineNo}
                                                </option>
                                            ))}
                                        </select>
                                    </PopupField>

                                    <PopupField label="Brushing Status">
                                        <select
                                            value={formState.brushingStatus}
                                            onChange={e => set("brushingStatus")(e.target.value)}
                                            className={`h-9 rounded-lg border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${brushingStatusCls}`}
                                        >
                                            <option value="PENDING">Under Brushing</option>
                                            <option value="READY_FOR_DISPATCH">Ready For Dispatch</option>
                                        </select>
                                    </PopupField>
                                </div>
                            )}
                        </div>

                        {/* Footer actions for All At Once */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onUpdateAllAtOnce(formState)}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-60 shadow-md"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Updating All ({queue.length})...
                                    </>
                                ) : (
                                    <>
                                        <CheckCheck className="w-4 h-4" />
                                        Update All ({queue.length} Rolls) At Once
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── Mode 2: Roll by Roll (Wizard) ── */
                    <div>
                        {/* Roll meta info strip */}
                        <div className="flex flex-wrap items-center gap-4 px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-sm text-slate-600">
                            {roll.partyName   && <span className="flex items-center gap-1"><span className="font-semibold text-slate-700">Ref Party:</span>   <span className="font-bold text-slate-900">{roll.partyName}</span></span>}
                            {roll.invoiceNo   && <span className="flex items-center gap-1"><span className="font-semibold text-slate-700">Invoice:</span>      <span className="font-bold text-slate-900">{roll.invoiceNo}</span></span>}
                            {roll.greigeMeters && <span className="flex items-center gap-1"><span className="font-semibold text-slate-700">Greige Mtr:</span>  <span className="font-bold text-blue-700">{Number(roll.greigeMeters).toFixed(2)}</span></span>}
                            {roll.greigeWeight && <span className="flex items-center gap-1"><span className="font-semibold text-slate-700">Net Wt:</span>       <span className="font-bold text-blue-700">{Number(roll.greigeWeight).toFixed(3)}</span></span>}
                            {roll.construction && <span className="flex items-center gap-1"><span className="font-semibold text-slate-700">Construction:</span> <span className="font-bold text-slate-900">{roll.construction}</span></span>}
                            <div className="flex items-center gap-1.5 ml-auto">
                                <span className="font-semibold text-slate-700 text-xs whitespace-nowrap">Updating at:</span>
                                <Input
                                    type="datetime-local"
                                    value={formState.updatingAt || toLocalDatetimeString(new Date())}
                                    onChange={e => set("updatingAt")(e.target.value)}
                                    disabled={roll.isDispatched === 1}
                                    className="h-8 w-44 text-xs font-bold text-indigo-700 bg-white border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Two-section form */}
                        <div className={`grid grid-cols-1 ${isUnwinding ? "" : "md:grid-cols-2"} gap-4 p-6`}>
                            {/* Unwind section */}
                            <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 flex flex-col gap-3">
                                <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2 mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                                    Unwind
                                </h3>

                                <PopupField label="Actual Unwound Mtr">
                                    <Input
                                        type="number" step="0.01"
                                        value={formState.unwoundMeters}
                                        onChange={e => set("unwoundMeters")(e.target.value)}
                                        disabled={roll.isDispatched === 1}
                                        className="h-9 bg-white border-blue-200 font-semibold text-black"
                                    />
                                </PopupField>

                                <PopupField label="Actual Unwound Wt">
                                    <Input
                                        type="number" step="0.001"
                                        value={formState.unwoundWeight}
                                        onChange={e => set("unwoundWeight")(e.target.value)}
                                        disabled={roll.isDispatched === 1}
                                        className="h-9 bg-white border-blue-200 font-semibold text-black"
                                    />
                                </PopupField>

                                <PopupField label="Unwound Gross Wt">
                                    <Input
                                        type="number" step="0.001"
                                        value={formState.unwoundGrossWt}
                                        onChange={e => set("unwoundGrossWt")(e.target.value)}
                                        disabled={roll.isDispatched === 1}
                                        className="h-9 bg-white border-blue-200 font-semibold text-black"
                                    />
                                </PopupField>

                                <PopupField label="Unwind Status">
                                    <select
                                        value={formState.unwindStatus}
                                        onChange={e => set("unwindStatus")(e.target.value)}
                                        disabled={roll.isDispatched === 1}
                                        className={`h-9 rounded-lg border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${unwindStatusCls}`}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="ACCEPTED">Accepted</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="RETURN">Return</option>
                                    </select>
                                </PopupField>

                                {(formState.unwindStatus === "REJECTED" || formState.unwindStatus === "RETURN") && (
                                    <>
                                        <PopupField label={formState.unwindStatus === "RETURN" ? "Reason for Return" : "Reason for Rejection"}>
                                            <Input
                                                type="text"
                                                placeholder={formState.unwindStatus === "RETURN" ? "Enter reason for return..." : "Enter reason for rejection..."}
                                                value={formState.rejectedReason || ""}
                                                onChange={e => set("rejectedReason")(e.target.value)}
                                                disabled={roll.isDispatched === 1}
                                                className="h-9 bg-white border-rose-200 text-black font-semibold"
                                            />
                                        </PopupField>
                                        <PopupField label="HFPL DC No">
                                            <Input
                                                type="text"
                                                value={roll.hfplDcNo || "(Auto-generated on Confirm)"}
                                                disabled={true}
                                                className="h-9 bg-slate-100 border-rose-200 text-slate-500 font-semibold"
                                            />
                                        </PopupField>
                                        <PopupField label="DC No">
                                            <Input
                                                type="text"
                                                placeholder="Enter DC No..."
                                                value={formState.dcNo || ""}
                                                onChange={e => set("dcNo")(e.target.value)}
                                                disabled={roll.isDispatched === 1}
                                                className="h-9 bg-white border-rose-200 text-black font-semibold"
                                            />
                                        </PopupField>
                                        <PopupField label="Return Type">
                                            <select
                                                value={formState.returnType || "Returnable"}
                                                onChange={e => set("returnType")(e.target.value)}
                                                disabled={roll.isDispatched === 1}
                                                className="h-9 rounded-lg border border-rose-200 px-2 text-sm font-semibold text-black bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
                                            >
                                                <option value="Returnable">Returnable</option>
                                                <option value="Non-Returnable">Non-Returnable</option>
                                            </select>
                                        </PopupField>
                                    </>
                                )}

                                <PopupField label="Remarks">
                                    <Input
                                        type="text"
                                        placeholder="Enter remarks..."
                                        value={formState.unwindRemarks}
                                        onChange={e => set("unwindRemarks")(e.target.value)}
                                        disabled={roll.isDispatched === 1}
                                        className="h-9 bg-white border-blue-200 text-black"
                                    />
                                </PopupField>
                            </div>

                            {/* Brushing section */}
                            {!isUnwinding && (
                                <div className="bg-orange-50/60 rounded-xl p-4 border border-orange-100 flex flex-col gap-3">
                                    <h3 className="font-bold text-orange-800 text-sm flex items-center gap-2 mb-1">
                                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                                        Brushing
                                    </h3>

                                    <PopupField label="Brushed Mtr">
                                        <Input
                                            type="number" step="0.01"
                                            value={formState.brushedMeters}
                                            onChange={e => set("brushedMeters")(e.target.value)}
                                            disabled={roll.isDispatched === 1}
                                            className="h-9 bg-white border-orange-200 font-semibold text-black"
                                        />
                                    </PopupField>

                                    <PopupField label="Brushed Wt (Kg)">
                                        <Input
                                            type="number" step="0.001"
                                            value={formState.brushedWeight}
                                            onChange={e => set("brushedWeight")(e.target.value)}
                                            disabled={roll.isDispatched === 1}
                                            className="h-9 bg-white border-orange-200 font-semibold text-black"
                                        />
                                    </PopupField>

                                    <PopupField label="Brushed Gross Wt">
                                        <Input
                                            type="number" step="0.001"
                                            value={formState.brushedGrossWt}
                                            onChange={e => set("brushedGrossWt")(e.target.value)}
                                            disabled={roll.isDispatched === 1}
                                            className="h-9 bg-white border-orange-200 font-semibold text-black"
                                        />
                                    </PopupField>

                                    <PopupField label="Machine No">
                                        <select
                                            value={formState.brushingMachineNo}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const selectedMachine = (machineList || []).find((m: any) => m.machineNo === val);
                                                setFormState(prev => ({
                                                    ...prev,
                                                    brushingMachineNo: val,
                                                    machineId: selectedMachine ? selectedMachine.id : null
                                                }));
                                            }}
                                            disabled={roll.isDispatched === 1}
                                            className="h-9 rounded-lg border border-orange-200 px-2 text-sm font-semibold text-black bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                                        >
                                            <option value="Both">Both</option>
                                            {(machineList || []).map((m: any) => (
                                                <option key={m.id} value={m.machineNo}>
                                                    {m.machineNo}
                                                </option>
                                            ))}
                                        </select>
                                    </PopupField>

                                     <PopupField label="Brushing Status">
                                        <select
                                            value={formState.brushingStatus}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                if (newStatus === "READY_FOR_DISPATCH") {
                                                    let rollNo = formState.hfplRollNo;
                                                    if (!rollNo) {
                                                        try {
                                                            const response = await apiService.get("/brushing/next-roll-no");
                                                            rollNo = typeof response === "string" ? response : response?.data || "";
                                                        } catch (err) {
                                                            console.error("Failed to fetch next roll number for popup", err);
                                                        }
                                                    }
                                                    setFormState(prev => ({ ...prev, brushingStatus: newStatus, hfplRollNo: rollNo }));
                                                } else {
                                                    setFormState(prev => ({ ...prev, brushingStatus: newStatus }));
                                                }
                                            }}
                                            disabled={roll.isDispatched === 1}
                                            className={`h-9 rounded-lg border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${brushingStatusCls}`}
                                        >
                                            <option value="PENDING">Under Brushing</option>
                                            <option value="READY_FOR_DISPATCH">Ready For Dispatch</option>
                                        </select>
                                    </PopupField>

                                    {formState.brushingStatus === "READY_FOR_DISPATCH" && (
                                        <PopupField label="HFPL Roll No">
                                            <Input
                                                type="text"
                                                placeholder="Enter HFPL Roll No..."
                                                value={formState.hfplRollNo}
                                                onChange={e => set("hfplRollNo")(e.target.value)}
                                                disabled= {true}
                                                className="h-9 bg-white border-orange-200 font-semibold text-black"
                                            />
                                        </PopupField>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer actions for Roll by Roll */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onSkip}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-100 transition disabled:opacity-50"
                                >
                                    <SkipForward className="w-4 h-4" />
                                    Skip Roll
                                </button>
                                <button
                                    onClick={onUpdate}
                                    disabled={isSaving || roll.isDispatched === 1}
                                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60 shadow"
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Update
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────── Helpers ───────────────────────────

const isZeroOrNullish = (val: any) => {
    if (val === null || val === undefined || val === "") return true;
    const num = Number(val);
    return isNaN(num) || num === 0;
};

const getFallbackValue = (value: any, fallback: any) => {
    return isZeroOrNullish(value) ? fallback : value;
};

function buildDefaultPopupForm(roll: any): PopupFormState {
    const hasPassMtr = roll.passMtr !== null && roll.passMtr !== undefined;
    
    const unwMtr = getFallbackValue(roll.unwoundMeters, roll.greigeMeters);
    const unwWt  = getFallbackValue(roll.unwoundWeight, roll.greigeWeight);
    const unwGwt = getFallbackValue(roll.unwoundGrossWt, roll.greigeGrossWt);
    
    const brMtr  = !isZeroOrNullish(roll.brushedMeters) ? roll.brushedMeters : (hasPassMtr ? roll.passMtr : "");
    const brWt   = !isZeroOrNullish(roll.brushedWeight) ? roll.brushedWeight : (hasPassMtr ? roll.greigeWeight : "");
    const brGwt  = !isZeroOrNullish(roll.brushedGrossWt) ? roll.brushedGrossWt : (hasPassMtr ? roll.greigeGrossWt : "");

    const brushingStatus = roll.isBrushed === 1 ? "READY_FOR_DISPATCH" : (roll.brushingStatus || "PENDING");
    const hfplRollNo = roll.hfplRollNo || "";

    return {
        unwoundMeters:    String(unwMtr ?? ""),
        unwoundWeight:    String(unwWt ?? ""),
        unwoundGrossWt:   String(unwGwt ?? ""),
        unwindStatus:     roll.unwindStatus  || "PENDING",
        unwindRemarks:    roll.unwindRemarks || "",
        rejectedReason:   roll.rejectedReason || "",
        dcNo:             roll.dcNo || "",
        returnType:       roll.returnType || "Returnable",
        brushedMeters:    String(brMtr ?? ""),
        brushedWeight:    String(brWt ?? ""),
        brushedGrossWt:   String(brGwt ?? ""),
        brushingStatus:   brushingStatus,
        brushingMachineNo: roll.brushingMachineNo || "Both",
        machineId:         roll.machineId || null,
        brushingDate:      roll.brushingDate || "",
        hfplRollNo:        hfplRollNo,
        updatingAt:        toLocalDatetimeString(roll.brushingUpdatedAt || roll.unwindUpdatedAt || new Date()),
    };
}

// ─────────────────────────── Main component ───────────────────────────

export function BrushingProcessFlow({ activeTabProp }: { activeTabProp?: 'unwinding' | 'rolling' | 'dispatch' | 'return' }) {
    const { user } = useAuth();
    const loggedInUserName = user?.userName || "";
    const { brushingReceivesList, loading } = useSelector((state: RootState) => state.brushing);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { machineList = [] } = useSelector((state: RootState) => state.machineMaster || {});
    const { fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster);

    const [companyId, setCompanyId]       = useState<number | null>(null);
    const [companyName, setCompanyName]   = useState<string>("");
    // Keyed by roll detail ID, stores local input overrides
    const [editStates, setEditStates]     = useState<Record<number, any>>({});
    // Tracks which rows are currently being saved (async)
    const [savingRows, setSavingRows]     = useState<Set<number>>(new Set());

    // ── Select-mode state ──
    const [showSelectCol, setShowSelectCol]     = useState(false);
    const [selectedRollIds, setSelectedRollIds] = useState<Set<number>>(new Set());

    // ── Rejection popup state ──
    const [rejectingRoll, setRejectingRoll]   = useState<any | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string>("");
    const [rejectionDcNo, setRejectionDcNo]   = useState<string>("");
    const [rejectionReturnType, setRejectionReturnType] = useState<string>("Returnable");

    // ── Bulk update popup state ──
    const [popupOpen, setPopupOpen]           = useState(false);
    const [popupQueue, setPopupQueue]         = useState<any[]>([]);
    const [popupIndex, setPopupIndex]         = useState(0);
    const [popupSaving, setPopupSaving]       = useState(false);
    const [popupMode, setPopupMode]           = useState<"checkbox" | "search">("checkbox");
    const [popupFormState, setPopupFormState] = useState<PopupFormState>({
        unwoundMeters: "", unwoundWeight: "", unwoundGrossWt: "",
        unwindStatus: "PENDING", unwindRemarks: "", rejectedReason: "",
        dcNo: "", returnType: "Returnable",
        brushedMeters: "", brushedWeight: "", brushedGrossWt: "",
        brushingStatus: "PENDING", brushingMachineNo: "Both",
        machineId: null,
        brushingDate: "",
        hfplRollNo: "",
        updatingAt: toLocalDatetimeString(new Date()),
    });

    // ── Search state ──
    const rollSearchRef = useRef("");

    const dispatch = useDispatch<AppDispatch>();

    const [nextRollNoBase, setNextRollNoBase] = useState<string>("");

    const fetchNextRollNo = useCallback(async () => {
        try {
            const response = await apiService.get("/brushing/next-roll-no");
            const rollNo = typeof response === "string" ? response : response?.data;
            if (rollNo) {
                setNextRollNoBase(rollNo);
            }
        } catch (err) {
            console.error("Failed to fetch next roll number", err);
        }
    }, []);

    useEffect(() => {
        fetchNextRollNo();
    }, [fetchNextRollNo]);

    const parsedBase = useMemo(() => {
        if (!nextRollNoBase) return null;
        const parts = nextRollNoBase.split("/");
        if (parts.length >= 4) {
            const prefix = parts.slice(0, 2).join("/") + "/"; // "HFPLB/R/"
            const seq = parseInt(parts[2], 10); // 8303
            const suffix = "/" + parts.slice(3).join("/"); // "/26-27"
            return { prefix, seq, suffix };
        }
        return null;
    }, [nextRollNoBase]);

    useEffect(() => {
        const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        dispatch(getAllMachines({ fetchAll: true }) as any);
        // Fetch full fabric master list for construction lookup (fabricCode - fabricQuality)
        dispatch(getAllFabricMastersForDropdown());
        if (storedCompanyId) {
            const numericCompanyId = Number(storedCompanyId);
            setCompanyId(numericCompanyId);
            dispatch(getAllVendors({ fetchAll: true } as any));
            // Fetch company name for the new "Party Name" column
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

    // Keep dynamic properties in refs so callback identities stay stable
    const editStatesRef = useRef(editStates);
    useEffect(() => { editStatesRef.current = editStates; }, [editStates]);

    const receivesListRef = useRef(brushingReceivesList);
    useEffect(() => { receivesListRef.current = brushingReceivesList; }, [brushingReceivesList]);

    const fetchReceives = useCallback(() => {
        if (companyId) {
            dispatch(getAllBrushingReceivesByCompany(companyId));
            fetchNextRollNo();
        }
    }, [dispatch, companyId, fetchNextRollNo]);

    useEffect(() => { fetchReceives(); }, [fetchReceives]);

    // Suppress unused warning — vendorList kept for future use
    void vendorList;

    // ── Fabric construction lookup map: fabricMasterId → "fabricCode - fabricQuality" ──
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

    // ── Flatten all rolls from receives ──
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

    // Helper to get sequence from HFPL roll number
    const getRollSeq = (rollNo: string) => {
        if (!rollNo) return 0;
        const parts = rollNo.split("/");
        if (parts.length >= 4) {
            const seq = parseInt(parts[2], 10);
            return isNaN(seq) ? 0 : seq;
        }
        return 0;
    };

    // Merge editStates onto all rolls
    const mergedRolls = useMemo(() => {
        return allRolls.map(r => {
            const es = editStates[r.id] || {};
            
            const defaultRollNo = r.hfplRollNo || "";
            
            return {
                ...r,
                unwoundMeters:    es.unwoundMeters    !== undefined ? es.unwoundMeters    : getFallbackValue(r.unwoundMeters, r.greigeMeters),
                unwoundWeight:    es.unwoundWeight    !== undefined ? es.unwoundWeight    : getFallbackValue(r.unwoundWeight, r.greigeWeight),
                unwoundGrossWt:   es.unwoundGrossWt   !== undefined ? es.unwoundGrossWt   : getFallbackValue(r.unwoundGrossWt, r.greigeGrossWt),
                unwindStatus:     es.unwindStatus     !== undefined ? es.unwindStatus     : (r.unwindStatus     || "PENDING"),
                unwindRemarks:    es.unwindRemarks    !== undefined ? es.unwindRemarks    : (r.unwindRemarks    || ""),
                brushedMeters:    es.brushedMeters    !== undefined ? es.brushedMeters    : (
                    !isZeroOrNullish(r.brushedMeters) ? r.brushedMeters : (r.passMtr !== null && r.passMtr !== undefined ? r.passMtr : "")
                ),
                brushedWeight:    es.brushedWeight    !== undefined ? es.brushedWeight    : (
                    !isZeroOrNullish(r.brushedWeight) ? r.brushedWeight : (r.passMtr !== null && r.passMtr !== undefined ? r.greigeWeight : "")
                ),
                brushedGrossWt:   es.brushedGrossWt   !== undefined ? es.brushedGrossWt   : (
                    !isZeroOrNullish(r.brushedGrossWt) ? r.brushedGrossWt : (r.passMtr !== null && r.passMtr !== undefined ? r.greigeGrossWt : "")
                ),
                brushingStatus:   es.brushingStatus   !== undefined ? es.brushingStatus   : (r.isBrushed === 1 ? "READY_FOR_DISPATCH" : "PENDING"),
                brushingMachineNo: es.brushingMachineNo !== undefined ? es.brushingMachineNo : (r.brushingMachineNo || "Both"),
                machineId:         es.machineId         !== undefined ? es.machineId         : (r.machineId         || null),
                brushingDate:     es.brushingDate     !== undefined ? es.brushingDate     : (r.brushingDate || ""),
                hfplRollNo:       es.hfplRollNo       !== undefined ? es.hfplRollNo       : defaultRollNo,
            };
        });
    }, [allRolls, editStates]);

    const mergedRollsRef = useRef(mergedRolls);
    useEffect(() => { mergedRollsRef.current = mergedRolls; }, [mergedRolls]);

    // ── Splitted tabs state ──
    const [activeTab, setActiveTab] = useState<'unwinding' | 'rolling' | 'dispatch' | 'return'>(activeTabProp || 'unwinding');
    const activeTabRef = useRef(activeTab);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    // Invoice No filter for dispatch tab
    const [selectedInvoiceFilter, setSelectedInvoiceFilter] = useState<string>('ALL');

    useEffect(() => {
        setSelectedInvoiceFilter('ALL');
        setFilteredRolls(null);
        setSelectedRollIds(new Set());
    }, [activeTab]);

    useEffect(() => {
        if (activeTabProp) {
            setActiveTab(activeTabProp);
        }
    }, [activeTabProp]);

    const unwindingRolls = useMemo(() => {
        return mergedRolls.filter(r => {
            const orig = allRolls.find(o => o.id === r.id) || r;
            const actualUnwindStatus = orig.unwindStatus || "PENDING";
            const actualIsRejected = orig.isRejected ?? 0;
            return actualUnwindStatus === "PENDING" && actualIsRejected !== 1;
        });
    }, [mergedRolls, allRolls]);

    const rollingRolls = useMemo(() => {
        return mergedRolls.filter(r => {
            const orig = allRolls.find(o => o.id === r.id) || r;
            const actualUnwindStatus = orig.unwindStatus || "PENDING";
            const actualBrushingStatus = orig.isBrushed === 1 ? "READY_FOR_DISPATCH" : (orig.brushingStatus || "PENDING");
            const actualIsDispatched = orig.isDispatched ?? 0;
            const actualIsInvoice = orig.isInvoice ?? 0;
            return actualUnwindStatus === "ACCEPTED" && actualBrushingStatus === "PENDING" && actualIsDispatched !== 1 && actualIsInvoice !== 1;
        });
    }, [mergedRolls, allRolls]);

    const dispatchRolls = useMemo(() => {
        return mergedRolls.filter(r => {
            const orig = allRolls.find(o => o.id === r.id) || r;
            const actualBrushingStatus = orig.isBrushed === 1 ? "READY_FOR_DISPATCH" : (orig.brushingStatus || "PENDING");
            const actualIsDispatched = orig.isDispatched ?? 0;
            const actualIsInvoice = orig.isInvoice ?? 0;
            return actualBrushingStatus === "READY_FOR_DISPATCH" && actualIsDispatched !== 1 && actualIsInvoice !== 1;
        });
    }, [mergedRolls, allRolls]);

    const returnRolls = useMemo(() => {
        return mergedRolls.filter(r => {
            const orig = allRolls.find(o => o.id === r.id) || r;
            const actualIsRejected = orig.isRejected ?? 0;
            return actualIsRejected === 1;
        });
    }, [mergedRolls, allRolls]);

    const returnRollsRef = useRef(returnRolls);
    useEffect(() => { returnRollsRef.current = returnRolls; }, [returnRolls]);

    const invoiceNumbers = useMemo(() => {
        const set = new Set<string>();
        dispatchRolls.forEach(r => {
            if (r.invoiceNo && r.invoiceNo.trim() !== '') {
                set.add(r.invoiceNo.trim());
            }
        });
        return Array.from(set).sort();
    }, [dispatchRolls]);

    const invoiceOptions = useMemo(() => {
        const list = invoiceNumbers.map(inv => ({
            id: inv,
            label: inv,
            value: inv
        }));
        return [
            { id: 'ALL', label: 'All Invoices', value: 'ALL' },
            ...list
        ];
    }, [invoiceNumbers]);

    const filteredDispatchRolls = useMemo(() => {
        if (!selectedInvoiceFilter || selectedInvoiceFilter === 'ALL') {
            return dispatchRolls;
        }
        return dispatchRolls.filter(r => r.invoiceNo && r.invoiceNo.trim() === selectedInvoiceFilter);
    }, [dispatchRolls, selectedInvoiceFilter]);

    const unwindingRollsRef = useRef(unwindingRolls);
    useEffect(() => { unwindingRollsRef.current = unwindingRolls; }, [unwindingRolls]);

    const rollingRollsRef = useRef(rollingRolls);
    useEffect(() => { rollingRollsRef.current = rollingRolls; }, [rollingRolls]);

    const dispatchRollsRef = useRef(filteredDispatchRolls);
    useEffect(() => { dispatchRollsRef.current = filteredDispatchRolls; }, [filteredDispatchRolls]);

    // ── Value accessors ──
    const getRollValue = useCallback((rollId: number, field: string, defaultValue: any) => {
        const es = editStates[rollId];
        if (es && es[field] !== undefined) return es[field];
        return defaultValue ?? "";
    }, [editStates]);

    const setRollValue = useCallback((rollId: number, field: string, value: any) => {
        setEditStates(prev => ({
            ...prev,
            [rollId]: { ...(prev[rollId] || {}), [field]: value }
        }));
    }, []);

    const handleInitiateRejectOrReturn = useCallback((roll: any, status: string) => {
        const isReturn = status === "RETURN";
        const isRejected = status === "REJECTED";
        
        setEditStates(prev => ({
            ...prev,
            [roll.id]: {
                ...(prev[roll.id] || {}),
                unwindStatus: status,
                isRejected: isRejected ? 1 : 0,
                isReturn: isReturn ? 1 : 0,
                unwoundMeters: String(roll.greigeMeters || ""),
                unwoundWeight: String(roll.greigeWeight || ""),
                unwoundGrossWt: String(roll.greigeGrossWt || ""),
            }
        }));
        
        const initialReason = editStates[roll.id]?.rejectedReason || editStates[roll.id]?.returnReason || editStates[roll.id]?.unwindRemarks || roll.rejectedReason || roll.returnReason || roll.unwindRemarks || "";
        const initialDcNo = editStates[roll.id]?.dcNo || roll.dcNo || "";
        const initialReturnType = editStates[roll.id]?.returnType || roll.returnType || "Returnable";
        
        setRejectionReason(initialReason);
        setRejectionDcNo(initialDcNo);
        setRejectionReturnType(initialReturnType);
        setRejectingRoll({ ...roll, targetStatus: status });
    }, [editStates]);

    // ── Core update function (used by both row-level and popup) ──
    const performUpdate = useCallback(async (
        roll: any,
        values: {
            unwoundMeters: number; unwoundWeight: number; unwoundGrossWt: number;
            unwindStatus: string;  unwindRemarks: string;
            rejectedReason?: string;
            dcNo?: string;
            returnType?: string;
            brushedMeters: number; brushedWeight: number; brushedGrossWt: number;
            brushingStatus: string; brushingMachineNo: string;
            machineId?: number | null;
            brushingDate?: string;
            rollingDate?: string;
            unwindDate?: string;
            unwindedDate?: string;
            updatingAt?: string;
            hfplRollNo?: string;
        }
    ): Promise<boolean> => {
        const {
            unwoundMeters, unwoundWeight, unwoundGrossWt, unwindStatus, unwindRemarks,
            rejectedReason, dcNo, returnType,
            brushedMeters, brushedWeight, brushedGrossWt, brushingStatus, brushingMachineNo,
            machineId, brushingDate, rollingDate, unwindDate, unwindedDate, updatingAt, hfplRollNo,
        } = values;

        // Validations
        if (brushingStatus === "READY_FOR_DISPATCH" && unwindStatus === "PENDING") {
            toast.error("Unwind Status still pending.");
            return false;
        }
        if (brushingStatus === "READY_FOR_DISPATCH" && unwindStatus === "REJECTED") {
            toast.error("Rejected roll could not able to complete further process.");
            return false;
        }
        if (unwindStatus === "ACCEPTED" && brushingStatus === "READY_FOR_DISPATCH") {
            const isEmptyOrZero = (val: any) => val === "" || val === null || val === undefined || Number(val) === 0;
            if (
                isEmptyOrZero(unwoundMeters)  || isEmptyOrZero(unwoundWeight)  ||
                isEmptyOrZero(unwoundGrossWt) || isEmptyOrZero(brushedMeters)  ||
                isEmptyOrZero(brushedWeight)  || isEmptyOrZero(brushedGrossWt) ||
                !String(brushingMachineNo).trim()
            ) {
                toast.error("Please fill all fields before update status.");
                return false;
            }
        }

        const currentReceives = receivesListRef.current;
        const parentReceive = (Array.isArray(currentReceives) ? currentReceives : [])
            .find((r: any) => r.id === roll.parentReceiveId);
        if (!parentReceive) {
            toast.error("Parent receive record not found.");
            return false;
        }

        const isRejected   = unwindStatus === "REJECTED";
        const isReturn     = unwindStatus === "RETURN";
        const isBrushedFlag = brushingStatus === "READY_FOR_DISPATCH" ? 1 : 0;
        const today        = new Date().toISOString().split("T")[0];
        const finalBrushingDate = brushingDate || today;
        const finalRollingDate = rollingDate || (isBrushedFlag === 1 ? finalBrushingDate : undefined);
        const finalUnwindDate = unwindDate || finalBrushingDate;
        const finalUnwindedDate = unwindedDate || finalBrushingDate;

        const mergedDetails = parentReceive.details.map((d: any) => {
            if (d.id === roll.id) {
                return {
                    ...d,
                    unwoundMeters, unwoundWeight, unwoundGrossWt,
                    unwindStatus, unwindRemarks,
                    isUnwound:     (isRejected || isReturn) ? 0 : (unwindStatus === "ACCEPTED" ? 1 : Number(d.isUnwound ?? 0)),
                    isRejected:    isRejected ? 1 : 0,
                    isReturn:      isReturn ? 1 : 0,
                    rejectionDate: isRejected ? finalUnwindDate : null,
                    rejectedReason: isRejected ? (rejectedReason || unwindRemarks) : null,
                    returnDate:    isReturn ? finalUnwindDate : null,
                    returnReason:  isReturn ? (rejectedReason || unwindRemarks) : null,
                    dcNo:          (isRejected || isReturn) ? dcNo : null,
                    returnType:    (isRejected || isReturn) ? returnType : null,
                    unwindDate:    finalUnwindDate,
                    unwindedDate:  unwindStatus === "ACCEPTED" ? finalUnwindedDate : d.unwindedDate,
                    brushedMeters, brushedWeight, brushedGrossWt, brushingMachineNo,
                    machineId,
                    isBrushed:         isBrushedFlag,
                    brushingStatus:    brushingStatus,
                    brushingDate:      finalBrushingDate,
                    rollingDate:       finalRollingDate,
                    hfplRollNo:        hfplRollNo,
                    unwindUpdatedAt:   updatingAt ? updatingAt : d.unwindUpdatedAt,
                    brushingUpdatedAt: updatingAt ? updatingAt : d.brushingUpdatedAt,
                    unwindUpdatedBy:   unwindStatus !== d.unwindStatus ? loggedInUserName : d.unwindUpdatedBy,
                    brushingUpdatedBy: (brushingStatus !== d.brushingStatus || isBrushedFlag !== d.isBrushed) ? loggedInUserName : d.brushingUpdatedBy,
                };
            }
            return {
                ...d,
                isUnwound:  d.isUnwound  ?? 0,
                isBrushed:  d.isBrushed  ?? 0,
                isRejected: d.isRejected ?? 0,
                isReturn:   d.isReturn   ?? 0,
            };
        });

        const allCompleted         = mergedDetails.every((d: any) => d.isBrushed === 1);
        const parentStatus         = allCompleted ? "COMPLETE" : "PENDING";
        const brushingCompletedDate = allCompleted ? today : (parentReceive.brushingCompletedDate || null);

        try {
            await dispatch(updateBrushingReceive({
                id: parentReceive.id,
                dto: {
                    ...parentReceive,
                    status: parentStatus,
                    isBrushed: allCompleted ? 1 : 0,
                    brushingCompletedDate,
                    details: mergedDetails,
                },
            })).unwrap();
            toast.success(`Data saved for Roll ${roll.pieceNumber}.`);
            return true;
        } catch (err: any) {
            toast.error(`Save failed for Roll ${roll.pieceNumber}: ${err?.message || err}`);
            return false;
        }
    }, [dispatch, receivesListRef]);

    // ── Row-level update (existing behaviour, unchanged) ──
    const handleUpdate = useCallback(async (roll: any) => {
        const rollId = roll.id;
        const hasPassMtr = roll.passMtr !== null && roll.passMtr !== undefined;
        
        const unwMtr = getFallbackValue(roll.unwoundMeters, roll.greigeMeters);
        const unwWt  = getFallbackValue(roll.unwoundWeight, roll.greigeWeight);
        const unwGwt = getFallbackValue(roll.unwoundGrossWt, roll.greigeGrossWt);
        
        const brMtr  = !isZeroOrNullish(roll.brushedMeters) ? roll.brushedMeters : (hasPassMtr ? roll.passMtr : "");
        const brWt   = !isZeroOrNullish(roll.brushedWeight) ? roll.brushedWeight : (hasPassMtr ? roll.greigeWeight : "");
        const brGwt  = !isZeroOrNullish(roll.brushedGrossWt) ? roll.brushedGrossWt : (hasPassMtr ? roll.greigeGrossWt : "");

        const currentBrushingStatus = getRollValue(rollId, "brushingStatus", roll.isBrushed === 1 ? "READY_FOR_DISPATCH" : "PENDING");
        const currentHfplRollNo = currentBrushingStatus === "READY_FOR_DISPATCH" ? getRollValue(rollId, "hfplRollNo", roll.hfplRollNo || "") : "";

        const currentUnwindStatus = getRollValue(rollId, "unwindStatus", roll.unwindStatus || "PENDING");
        if (currentUnwindStatus === "REJECTED" || currentUnwindStatus === "RETURN") {
            handleInitiateRejectOrReturn(roll, currentUnwindStatus);
            return;
        }

        const values = {
            unwoundMeters:    Number(getRollValue(rollId, "unwoundMeters",    unwMtr)),
            unwoundWeight:    Number(getRollValue(rollId, "unwoundWeight",    unwWt)),
            unwoundGrossWt:   Number(getRollValue(rollId, "unwoundGrossWt",   unwGwt)),
            unwindStatus:     currentUnwindStatus,
            unwindRemarks:    getRollValue(rollId, "unwindRemarks",    roll.unwindRemarks    || ""),
            brushedMeters:    Number(getRollValue(rollId, "brushedMeters",    brMtr)),
            brushedWeight:    Number(getRollValue(rollId, "brushedWeight",    brWt)),
            brushedGrossWt:   Number(getRollValue(rollId, "brushedGrossWt",   brGwt)),
            brushingStatus:   currentBrushingStatus,
            brushingMachineNo: getRollValue(rollId, "brushingMachineNo", roll.brushingMachineNo || "Both"),
            machineId:         getRollValue(rollId, "machineId",         roll.machineId         || null),
            brushingDate:      getRollValue(rollId, "brushingDate",      roll.brushingDate      || ""),
            hfplRollNo:        currentHfplRollNo,
        };

        setSavingRows(prev => new Set(prev).add(rollId));
        await performUpdate(roll, values);
        setSavingRows(prev => { const n = new Set(prev); n.delete(rollId); return n; });
        setEditStates(prev => { const c = { ...prev }; delete c[rollId]; return c; });
        fetchReceives();
    }, [getRollValue, performUpdate, fetchReceives]);

    // ── Popup helpers ──

    // Re-initialize form whenever the popup advances to a new roll
    useEffect(() => {
        const loadPopupForm = async () => {
            if (popupOpen && popupQueue[popupIndex]) {
                const roll = popupQueue[popupIndex];
                const defaultForm = buildDefaultPopupForm(roll);
                
                // Fetch next roll number ONLY if brushingStatus is READY_FOR_DISPATCH and hfplRollNo is empty
                if (defaultForm.brushingStatus === "READY_FOR_DISPATCH" && !defaultForm.hfplRollNo) {
                    try {
                        const response = await apiService.get("/brushing/next-roll-no");
                        const rollNo = typeof response === "string" ? response : response?.data;
                        if (rollNo) {
                            defaultForm.hfplRollNo = rollNo;
                        }
                    } catch (err) {
                        console.error("Failed to fetch next roll number for popup", err);
                    }
                }
                setPopupFormState(defaultForm);
            }
        };
        loadPopupForm();
    }, [popupOpen, popupIndex, popupQueue]);

    const openPopup = useCallback((rolls: any[], mode: "checkbox" | "search") => {
        if (!rolls.length) { toast.info("No rolls to update."); return; }
        setPopupQueue(rolls);
        setPopupIndex(0);
        setPopupMode(mode);
        setPopupOpen(true);
    }, []);

    const closePopup = useCallback((resetSelect: boolean) => {
        setPopupOpen(false);
        setPopupQueue([]);
        setPopupIndex(0);
        setPopupSaving(false);
        if (resetSelect) {
            setSelectedRollIds(new Set());
            setShowSelectCol(false);
        }
    }, []);

    const advanceOrClose = useCallback((currentIndex: number, queueLen: number, mode: "checkbox" | "search") => {
        if (currentIndex + 1 < queueLen) {
            setPopupIndex(currentIndex + 1);
        } else {
            closePopup(mode === "checkbox");
            fetchReceives();
        }
    }, [closePopup, fetchReceives]);

    const handlePopupUpdate = useCallback(async () => {
        const roll = popupQueue[popupIndex];
        if (!roll) return;

        const isRejected = popupFormState.unwindStatus === "REJECTED";
        const isReturn   = popupFormState.unwindStatus === "RETURN";
        const isReadyForDispatch = popupFormState.brushingStatus === "READY_FOR_DISPATCH";
        const unwMtr = (isRejected || isReturn) ? roll.greigeMeters : (popupFormState.unwoundMeters || roll.unwoundMeters || roll.greigeMeters || 0);
        const unwWt  = (isRejected || isReturn) ? roll.greigeWeight : (popupFormState.unwoundWeight || roll.unwoundWeight || roll.greigeWeight || 0);
        const unwGwt = (isRejected || isReturn) ? roll.greigeGrossWt : (popupFormState.unwoundGrossWt || roll.unwoundGrossWt || roll.greigeGrossWt || 0);

        if ((isRejected || isReturn) && !(popupFormState.rejectedReason || "").trim()) {
            toast.error(`Please enter a reason for ${isReturn ? 'return' : 'rejection'}.`);
            return;
        }

        let selectedDate = new Date().toISOString().split("T")[0];
        let fullTimestamp: string | undefined = undefined;

        if (popupFormState.updatingAt) {
            const dt = new Date(popupFormState.updatingAt);
            if (!isNaN(dt.getTime())) {
                const yyyy = dt.getFullYear();
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                selectedDate = `${yyyy}-${mm}-${dd}`;
                const hh = String(dt.getHours()).padStart(2, '0');
                const min = String(dt.getMinutes()).padStart(2, '0');
                const ss = String(dt.getSeconds()).padStart(2, '0');
                fullTimestamp = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
            }
        }

        const values = {
            unwoundMeters:    Number(unwMtr),
            unwoundWeight:    Number(unwWt),
            unwoundGrossWt:   Number(unwGwt),
            unwindStatus:     popupFormState.unwindStatus   || "PENDING",
            unwindRemarks:    (isRejected || isReturn) ? (popupFormState.rejectedReason || "") : (popupFormState.unwindRemarks || ""),
            rejectedReason:   (isRejected || isReturn) ? popupFormState.rejectedReason : "",
            dcNo:             (isRejected || isReturn) ? popupFormState.dcNo : "",
            returnType:       (isRejected || isReturn) ? popupFormState.returnType : "",
            brushedMeters:    Number(popupFormState.brushedMeters  || roll.brushedMeters  || roll.greigeMeters  || 0),
            brushedWeight:    Number(popupFormState.brushedWeight  || roll.brushedWeight  || roll.greigeWeight  || 0),
            brushedGrossWt:   Number(popupFormState.brushedGrossWt || roll.brushedGrossWt || roll.greigeGrossWt || 0),
            brushingStatus:   popupFormState.brushingStatus || "PENDING",
            brushingMachineNo: popupFormState.brushingMachineNo || roll.brushingMachineNo || "Both",
            machineId:         popupFormState.machineId !== undefined ? popupFormState.machineId : (roll.machineId || null),
            brushingDate:      selectedDate,
            rollingDate:       isReadyForDispatch ? selectedDate : undefined,
            unwindDate:        selectedDate,
            unwindedDate:      selectedDate,
            updatingAt:        fullTimestamp,
            hfplRollNo:        popupFormState.hfplRollNo || roll.hfplRollNo || "",
        };

        setPopupSaving(true);
        const ok = await performUpdate(roll, values);
        setPopupSaving(false);

        if (ok) {
            advanceOrClose(popupIndex, popupQueue.length, popupMode);
        }
    }, [popupQueue, popupIndex, popupFormState, popupMode, performUpdate, advanceOrClose]);

    const handleBulkUpdateAllAtOnce = useCallback(async (formState: PopupFormState) => {
        if (!popupQueue.length) return;

        const isRejected = formState.unwindStatus === "REJECTED";
        const isReturn = formState.unwindStatus === "RETURN";

        if ((isRejected || isReturn) && !(formState.rejectedReason || "").trim()) {
            toast.error(`Please enter a reason for ${isReturn ? 'return' : 'rejection'}.`);
            return;
        }

        setPopupSaving(true);

        try {
            const queueByParent: Record<number, any[]> = {};
            popupQueue.forEach(roll => {
                const parentId = roll.parentReceiveId;
                if (!queueByParent[parentId]) {
                    queueByParent[parentId] = [];
                }
                queueByParent[parentId].push(roll);
            });

            const currentReceives = receivesListRef.current;
            let successCount = 0;
            let failCount = 0;

            const parentIds = Object.keys(queueByParent).map(Number);
            const today = new Date().toISOString().split("T")[0];

            let selectedDate = today;
            let fullTimestamp: string | undefined = undefined;

            if (formState.updatingAt) {
                const dt = new Date(formState.updatingAt);
                if (!isNaN(dt.getTime())) {
                    const yyyy = dt.getFullYear();
                    const mm = String(dt.getMonth() + 1).padStart(2, '0');
                    const dd = String(dt.getDate()).padStart(2, '0');
                    selectedDate = `${yyyy}-${mm}-${dd}`;
                    const hh = String(dt.getHours()).padStart(2, '0');
                    const min = String(dt.getMinutes()).padStart(2, '0');
                    const ss = String(dt.getSeconds()).padStart(2, '0');
                    fullTimestamp = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
                }
            }

            const isReadyForDispatch = formState.brushingStatus === "READY_FOR_DISPATCH";

            for (const parentId of parentIds) {
                const parentReceive = (Array.isArray(currentReceives) ? currentReceives : [])
                    .find((r: any) => r.id === parentId);
                if (!parentReceive) {
                    failCount += queueByParent[parentId].length;
                    continue;
                }

                const selectedRollsInParent = queueByParent[parentId];
                const selectedRollIdsSet = new Set(selectedRollsInParent.map(r => r.id));

                const updatedDetails = parentReceive.details.map((d: any) => {
                    if (selectedRollIdsSet.has(d.id)) {
                        const es = editStatesRef.current[d.id] || {};

                        const unwMtr = (isRejected || isReturn)
                            ? Number(d.greigeMeters || 0)
                            : Number(es.unwoundMeters ?? getFallbackValue(d.unwoundMeters, d.greigeMeters) ?? 0);
                        const unwWt = (isRejected || isReturn)
                            ? Number(d.greigeWeight || 0)
                            : Number(es.unwoundWeight ?? getFallbackValue(d.unwoundWeight, d.greigeWeight) ?? 0);
                        const unwGwt = (isRejected || isReturn)
                            ? Number(d.greigeGrossWt || 0)
                            : Number(es.unwoundGrossWt ?? getFallbackValue(d.unwoundGrossWt, d.greigeGrossWt) ?? 0);

                        const hasPassMtr = d.passMtr !== null && d.passMtr !== undefined;
                        const brMtr = Number(es.brushedMeters ?? (!isZeroOrNullish(d.brushedMeters) ? d.brushedMeters : (hasPassMtr ? d.passMtr : d.greigeMeters)) ?? 0);
                        const brWt = Number(es.brushedWeight ?? (!isZeroOrNullish(d.brushedWeight) ? d.brushedWeight : (hasPassMtr ? d.greigeWeight : d.greigeWeight)) ?? 0);
                        const brGwt = Number(es.brushedGrossWt ?? (!isZeroOrNullish(d.brushedGrossWt) ? d.brushedGrossWt : (hasPassMtr ? d.greigeGrossWt : d.greigeGrossWt)) ?? 0);

                        const isBrushedFlag = isReadyForDispatch ? 1 : 0;
                        const finalBrushingDate = selectedDate || today;
                        const finalRollingDate = isReadyForDispatch ? selectedDate : (isBrushedFlag === 1 ? finalBrushingDate : undefined);
                        const finalUnwindDate = selectedDate || finalBrushingDate;
                        const finalUnwindedDate = selectedDate || finalBrushingDate;

                        return {
                            ...d,
                            unwoundMeters: unwMtr,
                            unwoundWeight: unwWt,
                            unwoundGrossWt: unwGwt,
                            unwindStatus: formState.unwindStatus,
                            unwindRemarks: (isRejected || isReturn) ? (formState.rejectedReason || "") : (formState.unwindRemarks || ""),
                            isUnwound: (isRejected || isReturn) ? 0 : (formState.unwindStatus === "ACCEPTED" ? 1 : Number(d.isUnwound ?? 0)),
                            isRejected: isRejected ? 1 : 0,
                            isReturn: isReturn ? 1 : 0,
                            rejectionDate: isRejected ? finalUnwindDate : null,
                            rejectedReason: isRejected ? formState.rejectedReason : null,
                            returnDate: isReturn ? finalUnwindDate : null,
                            returnReason: isReturn ? formState.rejectedReason : null,
                            dcNo: (isRejected || isReturn) ? formState.dcNo : null,
                            returnType: (isRejected || isReturn) ? formState.returnType : null,
                            unwindDate: finalUnwindDate,
                            unwindedDate: formState.unwindStatus === "ACCEPTED" ? finalUnwindedDate : d.unwindedDate,
                            brushedMeters: brMtr,
                            brushedWeight: brWt,
                            brushedGrossWt: brGwt,
                            brushingMachineNo: formState.brushingMachineNo || d.brushingMachineNo || "Both",
                            machineId: formState.machineId !== undefined ? formState.machineId : (d.machineId || null),
                            isBrushed: isBrushedFlag,
                            brushingStatus: formState.brushingStatus,
                            brushingDate: finalBrushingDate,
                            rollingDate: finalRollingDate,
                            hfplRollNo: d.hfplRollNo || "",
                            unwindUpdatedAt: fullTimestamp || d.unwindUpdatedAt,
                            brushingUpdatedAt: fullTimestamp || d.brushingUpdatedAt,
                            unwindUpdatedBy: loggedInUserName || d.unwindUpdatedBy,
                            brushingUpdatedBy: loggedInUserName || d.brushingUpdatedBy,
                        };
                    }
                    return {
                        ...d,
                        isUnwound: d.isUnwound ?? 0,
                        isBrushed: d.isBrushed ?? 0,
                        isRejected: d.isRejected ?? 0,
                        isReturn: d.isReturn ?? 0,
                    };
                });

                const allCompleted = updatedDetails.every((d: any) => d.isBrushed === 1);
                const parentStatus = allCompleted ? "COMPLETE" : "PENDING";
                const brushingCompletedDate = allCompleted ? today : (parentReceive.brushingCompletedDate || null);

                try {
                    await dispatch(updateBrushingReceive({
                        id: parentReceive.id,
                        dto: {
                            ...parentReceive,
                            status: parentStatus,
                            isBrushed: allCompleted ? 1 : 0,
                            brushingCompletedDate,
                            details: updatedDetails,
                        },
                    })).unwrap();
                    successCount += selectedRollsInParent.length;
                } catch (err: any) {
                    console.error(`Failed updating parent receive ${parentReceive.id}:`, err);
                    failCount += selectedRollsInParent.length;
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully updated all ${successCount} selected roll(s) at once!`);
            }
            if (failCount > 0) {
                toast.error(`Failed to update ${failCount} roll(s).`);
            }

            closePopup(true);
            fetchReceives();
        } catch (error: any) {
            console.error("Bulk update all failed:", error);
            toast.error("Failed to update selected rolls.");
        } finally {
            setPopupSaving(false);
        }
    }, [popupQueue, loggedInUserName, dispatch, receivesListRef, closePopup, fetchReceives]);

    const handlePopupSkip = useCallback(() => {
        const roll = popupQueue[popupIndex];
        if (roll && popupMode === "checkbox") {
            setSelectedRollIds(prev => { const n = new Set(prev); n.delete(roll.id); return n; });
        }
        advanceOrClose(popupIndex, popupQueue.length, popupMode);
    }, [popupQueue, popupIndex, popupMode, advanceOrClose]);

    const handlePopupCancel = useCallback(() => {
        closePopup(false);          // keep checkboxes as-is when user cancels
    }, [closePopup]);

    // ── Search submit ──
    const handleSearchSubmit = useCallback(() => {
        const q = rollSearchRef.current.trim().toLowerCase();
        if (!q) { toast.info("Enter a roll number to search."); return; }
        
        const currentList = activeTabRef.current === 'unwinding' 
            ? unwindingRollsRef.current 
            : activeTabRef.current === 'rolling' 
            ? rollingRollsRef.current 
            : dispatchRollsRef.current;

        const matched = currentList.filter(r =>
            String(r.pieceNumber || "").toLowerCase().includes(q)
        );
        if (!matched.length) { toast.info("No rolls matched that search in the current tab."); return; }
        
        const activeMatched = matched.filter(r => r.isDispatched !== 1);
        if (activeMatched.length === 0) {
            toast.warning("The matched roll(s) are already dispatched and cannot be edited.");
            return;
        }
        openPopup(activeMatched, "search");
    }, [openPopup]);

    // ── Checkbox helpers ──
    const [filteredRolls, setFilteredRolls] = useState<any[] | null>(null);

    const activeRolls = useMemo(() => {
        const currentList = filteredRolls ?? (
            activeTab === 'unwinding' 
                ? unwindingRolls 
                : activeTab === 'rolling' 
                ? rollingRolls 
                : activeTab === 'return'
                ? returnRolls
                : filteredDispatchRolls
        );
        return currentList.filter(r => r.isDispatched !== 1);
    }, [filteredRolls, activeTab, unwindingRolls, rollingRolls, returnRolls, filteredDispatchRolls]);

    const activeRollsRef = useRef(activeRolls);
    useEffect(() => { activeRollsRef.current = activeRolls; }, [activeRolls]);

    const allChecked = activeRolls.length > 0 && activeRolls.every(r => selectedRollIds.has(r.id));
    const someChecked = !allChecked && activeRolls.some(r => selectedRollIds.has(r.id));

    const toggleAll = useCallback((checked: boolean) => {
        const currentList = activeRollsRef.current;
        setSelectedRollIds(
            checked
                ? new Set(
                      currentList
                          .filter(r => r.isDispatched !== 1)
                          .map(r => r.id)
                  )
                : new Set()
        );
    }, []);

    const toggleRow = useCallback((id: number, checked: boolean) => {
        setSelectedRollIds(prev => {
            const n = new Set(prev);
            checked ? n.add(id) : n.delete(id);
            return n;
        });
    }, []);

    // ── Column definition ──
    const columns = useMemo(() => {
        const selectCol = (showSelectCol && activeTab !== 'dispatch') ? [{
            id: "select",
            Header: (
                <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked; }}
                    onChange={e => toggleAll(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                    title="Select / deselect all rows"
                />
            ) as React.ReactNode,
            accessor: "id" as const,
            width: 44,
            disableFilters: true,
            disableSortBy: true,
            Cell: ({ row }: any) => {
                const isDispatched = row.original.isDispatched === 1;
                return (
                    <input
                        type="checkbox"
                        checked={selectedRollIds.has(row.original.id)}
                        disabled={isDispatched}
                        onChange={e => toggleRow(row.original.id, e.target.checked)}
                        className={`w-4 h-4 accent-blue-600 ${
                            isDispatched ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                        }`}
                    />
                );
            },
        }] : [];

        const commonStartCols = [
            {
                Header: "S.No",
                id: "serialNo",
                accessor: "id",
                width: 50,
                disableFilters: true,
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
                minWidth: 140,
            },
            {
                Header: "TC",
                accessor: "tc",
                id: "tc",
                minWidth: 60,
            },
            {
                Header: "Construction",
                accessor: "fabricMasterId",
                id: "construction",
                minWidth: 200,
                Cell: ({ row }: any) => {
                    const fabricMasterId = row.original.fabricMasterId;
                    // Prefer lookup from fabricMasterFullList; fallback to raw construction field
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
                minWidth: 80,
                Cell: ({ value }: any) => <span className="font-bold text-blue-900">{value}</span>
            },
        ];

        if (activeTab === 'unwinding') {
            return [
                ...selectCol,
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
                    Cell: ({ row }: any) => (
                        <UnwindMetersCell
                            roll={row.original}
                            onChange={(val) => setRollValue(row.original.id, "unwoundMeters", val)}
                        />
                    )
                },
                {
                    Header: "Actual Unwound Wt",
                    accessor: "unwoundWeight",
                    id: "unwoundWeight",
                    minWidth: 145,
                    Cell: ({ row }: any) => (
                        <UnwindWeightCell
                            roll={row.original}
                            onChange={(val) => setRollValue(row.original.id, "unwoundWeight", val)}
                        />
                    )
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
                    Cell: ({ row }: any) => {
                        const currentStatus = getRollValue(row.original.id, "unwindStatus", row.original.unwindStatus);
                        return (
                            <UnwindStatusCell
                                key={`${row.original.id}_${currentStatus}`}
                                roll={row.original}
                                onChange={(val) => {
                                    if (val === "REJECTED" || val === "RETURN") {
                                        handleInitiateRejectOrReturn(row.original, val);
                                    } else {
                                        setRollValue(row.original.id, "unwindStatus", val);
                                        if (row.original.isRejected === 1) {
                                            setRollValue(row.original.id, "isRejected", 0);
                                        }
                                        if (row.original.isReturn === 1) {
                                            setRollValue(row.original.id, "isReturn", 0);
                                        }
                                    }
                                }}
                            />
                        );
                    }
                },
                {
                    Header: "Remarks",
                    accessor: "unwindRemarks",
                    id: "unwindRemarks",
                    minWidth: 140,
                    Cell: ({ row }: any) => (
                        <UnwindRemarksCell
                            roll={row.original}
                            onChange={(val) => setRollValue(row.original.id, "unwindRemarks", val)}
                        />
                    )
                },
                {
                    Header: "Actions",
                    id: "actionButtons",
                    accessor: "id",
                    minWidth: 100,
                    Cell: ({ row }: any) => {
                        const rollId  = row.original.id;
                        const isSaving = savingRows.has(rollId);
                        if (row.original.isDispatched === 1) {
                            return (
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-bold text-xs mx-auto">
                                    Dispatched
                                </span>
                            );
                        }
                        return (
                            <Button
                                onClick={() => handleUpdate(row.original)}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs py-1 px-3 flex items-center gap-1 mx-auto"
                            >
                                <Save className="h-3.5 w-3.5" />
                                {isSaving ? "Saving..." : "Update"}
                            </Button>
                        );
                    }
                }
            ];
        }

        if (activeTab === 'return') {
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
                    Cell: () => (
                        <span className="inline-flex px-2 py-0.5 rounded-lg text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700">
                            REJECTED
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
                    Header: "Rejection Date",
                    accessor: "rejectionDate",
                    id: "rejectionDate",
                    minWidth: 120,
                    Cell: ({ value }: any) => value || "—"
                },
                {
                    Header: "Reason for Rejection",
                    accessor: "rejectedReason",
                    id: "rejectedReason",
                    minWidth: 200,
                    Cell: ({ value }: any) => (
                        <span className="font-semibold text-rose-700 text-xs" title={value}>
                            {value || "—"}
                        </span>
                    )
                }
            ];
        }

        const isDispatchScreen = activeTab === 'dispatch';

        const stageCols = [
            ...selectCol,
            ...commonStartCols,
            ...(isDispatchScreen ? [{
                Header: "HFPL Roll No",
                accessor: "hfplRollNo",
                id: "hfplRollNo",
                minWidth: 130,
                Cell: ({ row }: any) => (
                    <HfplRollNoCell
                        roll={row.original}
                        onChange={(val) => setRollValue(row.original.id, "hfplRollNo", val)}
                        disabled={true}
                    />
                )
            }] : []),
            {
                Header: "Receive Mtr",
                accessor: "greigeMeters",
                id: "greigeMeters",
                minWidth: 110,
                Cell: ({ value }: any) => (Number(value) || 0).toFixed(2)
            },
            {
                Header: "Unwound Mtr",
                accessor: "unwoundMeters",
                id: "unwoundMeters",
                minWidth: 110,
                Cell: ({ value }: any) => (Number(value) || 0).toFixed(2)
            },
            {
                Header: "Brushed Mtr",
                accessor: "brushedMeters",
                id: "brushedMeters",
                minWidth: 130,
                Cell: ({ row }: any) => (
                    <BrushedMetersCell
                        roll={row.original}
                        onChange={(val) => setRollValue(row.original.id, "brushedMeters", val)}
                        disabled={isDispatchScreen}
                    />
                )
            },
            {
                Header: "Brushed Wt (Kg)",
                accessor: "brushedWeight",
                id: "brushedWeight",
                minWidth: 130,
                Cell: ({ row }: any) => (
                    <BrushedWeightCell
                        roll={row.original}
                        onChange={(val) => setRollValue(row.original.id, "brushedWeight", val)}
                        disabled={isDispatchScreen}
                    />
                )
            },
            {
                Header: "Brushed Gross Wt",
                accessor: "brushedGrossWt",
                id: "brushedGrossWt",
                minWidth: 130,
                Cell: ({ row }: any) => (
                    <BrushedGrossWtCell
                        roll={row.original}
                        onChange={(val) => setRollValue(row.original.id, "brushedGrossWt", val)}
                        disabled={isDispatchScreen}
                    />
                )
            },
            {
                Header: "Elongation",
                accessor: "shrinkage",
                id: "shrinkage",
                minWidth: 100,
                Cell: ({ row }: any) => {
                    const unwMtr = Number(row.original.unwoundMeters) || Number(row.original.greigeMeters) || 0;
                    const brMtr  = Number(row.original.brushedMeters ?? unwMtr);
                    const diff   = unwMtr > 0 ? ((brMtr - unwMtr) / unwMtr) * 100 : 0;
                    return (
                        <span className={`font-bold ${diff > 0.5 ? 'text-green-600' : diff < -0.5 ? 'text-red-600' : 'text-slate-600'}`}>
                            {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}%
                        </span>
                    );
                }
            },
            {
                Header: "Machine No",
                accessor: "brushingMachineNo",
                id: "brushingMachineNo",
                minWidth: 120,
                Cell: ({ row }: any) => (
                    <BrushingMachineNoCell
                        roll={row.original}
                        onChange={(val) => {
                            const selectedMachine = (machineList || []).find((m: any) => m.machineNo === val);
                            setRollValue(row.original.id, "brushingMachineNo", val);
                            setRollValue(row.original.id, "machineId", selectedMachine ? selectedMachine.id : null);
                        }}
                        disabled={isDispatchScreen}
                        machineList={machineList}
                    />
                )
            },
            {
                Header: "Brushing Status",
                accessor: "brushingStatus",
                id: "brushingStatus",
                minWidth: 145,
                Cell: ({ row }: any) => (
                    <BrushingStatusCell
                        roll={row.original}
                        onChange={(val) => setRollValue(row.original.id, "brushingStatus", val)}
                        disabled={isDispatchScreen}
                    />
                )
            },
        ];

        if (!isDispatchScreen) {
            stageCols.push({
                Header: "Actions",
                id: "actionButtons",
                accessor: "id",
                minWidth: 100,
                Cell: ({ row }: any) => {
                    const rollId  = row.original.id;
                    const isSaving = savingRows.has(rollId);
                    if (row.original.isDispatched === 1) {
                        return (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-bold text-xs mx-auto">
                                Dispatched
                            </span>
                        );
                    }
                    return (
                        <Button
                            onClick={() => handleUpdate(row.original)}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs py-1 px-3 flex items-center gap-1 mx-auto"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {isSaving ? "Saving..." : "Update"}
                        </Button>
                    );
                }
            });
        } else {
            stageCols.push({
                Header: "Actions",
                id: "actionButtons",
                accessor: "id",
                minWidth: 100,
                Cell: ({ row }: any) => {
                    if (row.original.isDispatched === 1) {
                        return (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-bold text-xs mx-auto">
                                Dispatched
                            </span>
                        );
                    }
                    return (
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg border border-green-200 bg-green-50 text-green-700 font-bold text-xs mx-auto">
                            Ready
                        </span>
                    );
                }
            });
        }

        return stageCols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleUpdate, savingRows, showSelectCol, allChecked, someChecked, selectedRollIds, companyName, toggleAll, toggleRow, activeTab]);

    return (
        <div className="p-6 pt-16 bg-slate-50/50">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
                <DataTable
                    columns={columns}
                    data={
                        activeTab === 'unwinding' 
                            ? unwindingRolls 
                            : activeTab === 'rolling' 
                            ? rollingRolls 
                            : activeTab === 'return'
                            ? returnRolls
                            : filteredDispatchRolls
                    }
                    title={
                        activeTab === 'unwinding' 
                            ? "Unwinding Rolls" 
                            : activeTab === 'rolling' 
                            ? "Rolling (Under Brushing)" 
                            : activeTab === 'return'
                            ? "Brushing Return"
                            : "Ready For Dispatch"
                    }
                    showActions={false}
                    showColumnFilters={true}
                    filterPlaceholder="Search rolls..."
                    loading={loading}
                    virtualScroll={true}
                    isShowPagination={false}
                    onFilteredDataChange={setFilteredRolls}
                    headerActions={({ filteredData }: { filteredData: any[] }) => {
                        const currentRolls = filteredData || [];
                        const totRolls = currentRolls.length;
                        const totRecMtr = currentRolls.reduce((sum, r) => sum + (Number(r.greigeMeters) || 0), 0);
                        const totUnwoundMtr = currentRolls.reduce((sum, r) => sum + (Number(r.unwoundMeters) || 0), 0);
                        const totBrushedMtr = currentRolls.reduce((sum, r) => sum + (Number(r.brushedMeters) || 0), 0);

                        return (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-1 h-7 text-xs font-bold text-slate-700 shadow-sm animate-fade-in">
                                    <span>
                                        Total Rolls:{" "}
                                        <span className="text-blue-700 font-extrabold">
                                            {totRolls.toLocaleString('en-IN')}
                                        </span>
                                    </span>
                                    <span className="w-px h-3 bg-slate-300" />
                                    
                                    {activeTab === 'unwinding' ? (
                                        <span>
                                            Total Received Mtr:{" "}
                                            <span className="text-emerald-700 font-extrabold">
                                                {totRecMtr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </span>
                                    ) : activeTab === 'rolling' ? (
                                        <>
                                            <span>
                                                Total Receive Mtr:{" "}
                                                <span className="text-violet-700 font-extrabold">
                                                    {totRecMtr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </span>
                                            <span className="w-px h-3 bg-slate-300" />
                                            <span>
                                                Total Unwound Mtr:{" "}
                                                <span className="text-emerald-700 font-extrabold">
                                                    {totUnwoundMtr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </span>
                                        </>
                                    ) : activeTab === 'return' ? (
                                        <>
                                            <span>
                                                Total Received Mtr:{" "}
                                                <span className="text-violet-700 font-extrabold">
                                                    {totRecMtr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </span>
                                            <span className="w-px h-3 bg-slate-300" />
                                            <span>
                                                Total Return Mtr:{" "}
                                                <span className="text-rose-700 font-extrabold">
                                                    {totUnwoundMtr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span>
                                                Total Receive Mtr:{" "}
                                                <span className="text-violet-700 font-extrabold">
                                                    {totRecMtr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </span>
                                            <span className="w-px h-3 bg-slate-300" />
                                            <span>
                                                Total Pass Mtr:{" "}
                                                <span className="text-emerald-700 font-extrabold">
                                                    {totBrushedMtr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </span>
                                        </>
                                    )}
                                </div>

                            {/* Invoice No Filter dropdown — only on dispatch stage */}
                            {activeTab === 'dispatch' && invoiceNumbers.length > 0 && (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                                        Filter by Invoice No:
                                    </span>
                                    <CommonSearchableSelect
                                        options={invoiceOptions}
                                        value={selectedInvoiceFilter}
                                        onValueChange={setSelectedInvoiceFilter}
                                        placeholder="Select Invoice"
                                        className="w-48"
                                    />
                                </div>
                            )}

                            {activeTab !== 'dispatch' && activeTab !== 'return' && (
                                <div className="w-px h-5 bg-slate-200" />
                            )}
                            {activeTab !== 'dispatch' && activeTab !== 'return' && (
                                <>
                                    {!showSelectCol && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                                                Select roll and update
                                            </span>
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                                <Input
                                                    placeholder="Roll No..."
                                                    defaultValue={rollSearchRef.current}
                                                    onChange={e => { rollSearchRef.current = e.target.value; }}
                                                    onKeyDown={e => { if (e.key === "Enter") handleSearchSubmit(); }}
                                                    className="pl-8 h-7 w-32 border-slate-200 text-xs rounded-md"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSearchSubmit}
                                                className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
                                            >
                                                OK
                                            </button>
                                        </div>
                                    )}
                                    {!showSelectCol && (
                                        <div className="w-px h-5 bg-slate-200" />
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowSelectCol(prev => !prev);
                                            if (showSelectCol) setSelectedRollIds(new Set());
                                        }}
                                        className={`h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition ${
                                            showSelectCol
                                                ? "border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100"
                                                : "border-slate-300 text-slate-600 bg-white hover:bg-slate-50"
                                        }`}
                                    >
                                        <ListChecks className="w-3.5 h-3.5" />
                                        {showSelectCol ? "Cancel Select" : "Select Rolls"}
                                    </button>
                                    {selectedRollIds.size > 0 && (
                                        <button
                                            onClick={() => openPopup(
                                                activeRolls.filter(r => selectedRollIds.has(r.id)),
                                                "checkbox"
                                            )}
                                            className="h-7 px-3 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow transition"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            Update Roll Status ({selectedRollIds.size})
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    );
                }}
                />
            </div>
            {popupOpen && popupQueue.length > 0 && (
                <BulkUpdatePopup
                    queue={popupQueue}
                    index={popupIndex}
                    formState={popupFormState}
                    setFormState={setPopupFormState}
                    isSaving={popupSaving}
                    onUpdate={handlePopupUpdate}
                    onUpdateAllAtOnce={handleBulkUpdateAllAtOnce}
                    onSkip={handlePopupSkip}
                    onCancel={handlePopupCancel}
                    machineList={machineList}
                    activeTab={activeTab}
                />
            )}
            {rejectingRoll && (() => {
                const currentStatus = getRollValue(rejectingRoll.id, "unwindStatus", rejectingRoll.unwindStatus || "REJECTED");
                const isReturnMode = currentStatus === "RETURN";
                const modeTitle = isReturnMode ? "Return" : "Reject";
                const reasonLabel = isReturnMode ? "Reason for Return" : "Reason for Rejection";
                const reasonPlaceholder = isReturnMode ? "Enter reason for return..." : "Enter reason for rejection...";
                const confirmBtnText = isReturnMode ? "Confirm Return" : "Confirm Rejection";
                const confirmBtnCls = isReturnMode
                    ? "px-5 py-2 rounded-lg text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow"
                    : "px-5 py-2 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow";
                const headerGradient = isReturnMode
                    ? "from-slate-50 to-purple-50"
                    : "from-slate-50 to-rose-50";
                const dotCls = isReturnMode ? "bg-purple-500" : "bg-rose-500";
                const focusRingCls = isReturnMode ? "focus:ring-purple-400" : "focus:ring-rose-400";

                return (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
                            {/* Header */}
                            <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r ${headerGradient} rounded-t-2xl`}>
                                <div>
                                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${dotCls} inline-block`} />
                                        {modeTitle} Roll - {rejectingRoll.pieceNumber}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditStates(prev => { const c = { ...prev }; delete c[rejectingRoll.id]; return c; });
                                        setRejectingRoll(null);
                                        setRejectionReason("");
                                        setRejectionDcNo("");
                                        setRejectionReturnType("Returnable");
                                    }}
                                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                    <div>
                                        <span className="font-semibold text-slate-500 block uppercase tracking-wider">Received Mtr</span>
                                        <span className="font-bold text-slate-900 text-sm">{(Number(rejectingRoll.greigeMeters) || 0).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-500 block uppercase tracking-wider">Received Weight</span>
                                        <span className="font-bold text-slate-900 text-sm">{(Number(rejectingRoll.greigeWeight) || 0).toFixed(3)}</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="font-semibold text-slate-500 block uppercase tracking-wider">Return Mtr</span>
                                        <span className="font-semibold text-slate-600 text-sm">{(Number(rejectingRoll.greigeMeters) || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className="font-semibold text-slate-500 block uppercase tracking-wider">Return Weight</span>
                                        <span className="font-semibold text-slate-600 text-sm">{(Number(rejectingRoll.greigeWeight) || 0).toFixed(3)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">{reasonLabel}</label>
                                    <Input
                                        type="text"
                                        placeholder={reasonPlaceholder}
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        className="border-slate-200 rounded-lg text-black font-semibold bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">HFPL DC No</label>
                                    <Input
                                        type="text"
                                        value={rejectingRoll.hfplDcNo || "(Auto-generated on Confirm)"}
                                        disabled={true}
                                        className="border-slate-200 rounded-lg text-slate-500 font-semibold bg-slate-100"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">DC No (Manual Entry)</label>
                                    <Input
                                        type="text"
                                        placeholder="Enter DC No..."
                                        value={rejectionDcNo}
                                        onChange={e => setRejectionDcNo(e.target.value)}
                                        className="border-slate-200 rounded-lg text-black font-semibold bg-white"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Return Type</label>
                                    <select
                                        value={rejectionReturnType}
                                        onChange={e => setRejectionReturnType(e.target.value)}
                                        className={`h-9 rounded-lg border border-slate-200 px-2 text-sm font-semibold text-black bg-white focus:outline-none focus:ring-2 ${focusRingCls} transition-all`}
                                    >
                                        <option value="Returnable">Returnable</option>
                                        <option value="Non-Returnable">Non-Returnable</option>
                                    </select>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                                <button
                                    onClick={() => {
                                        setEditStates(prev => { const c = { ...prev }; delete c[rejectingRoll.id]; return c; });
                                        setRejectingRoll(null);
                                        setRejectionReason("");
                                        setRejectionDcNo("");
                                        setRejectionReturnType("Returnable");
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const reason = rejectionReason.trim();
                                        if (!reason) {
                                            toast.error(`Please enter a reason for ${isReturnMode ? 'return' : 'rejection'}.`);
                                            return;
                                        }
                                        const values = {
                                            unwoundMeters: Number(rejectingRoll.greigeMeters || 0),
                                            unwoundWeight: Number(rejectingRoll.greigeWeight || 0),
                                            unwoundGrossWt: Number(rejectingRoll.greigeGrossWt || 0),
                                            unwindStatus: isReturnMode ? "RETURN" : "REJECTED",
                                            unwindRemarks: reason,
                                            rejectedReason: reason,
                                            isRejected: isReturnMode ? 0 : 1,
                                            isReturn: isReturnMode ? 1 : 0,
                                            brushedMeters: 0,
                                            brushedWeight: 0,
                                            brushedGrossWt: 0,
                                            brushingStatus: "PENDING",
                                            brushingMachineNo: "Both",
                                            dcNo: rejectionDcNo.trim(),
                                            returnType: rejectionReturnType,
                                        };
                                        setSavingRows(prev => new Set(prev).add(rejectingRoll.id));
                                        const ok = await performUpdate(rejectingRoll, values);
                                        setSavingRows(prev => { const n = new Set(prev); n.delete(rejectingRoll.id); return n; });
                                        if (ok) {
                                            setEditStates(prev => { const c = { ...prev }; delete c[rejectingRoll.id]; return c; });
                                            setRejectingRoll(null);
                                            setRejectionReason("");
                                            setRejectionDcNo("");
                                            setRejectionReturnType("Returnable");
                                            fetchReceives();
                                        }
                                    }}
                                    className={confirmBtnCls}
                                >
                                    {confirmBtnText}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
