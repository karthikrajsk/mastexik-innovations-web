// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/state/store";
// import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany } from "@/state/factoryPieceEntrySlice";
// import { getAllLooms } from "@/state/loomMasterSlice";
// import { getAllFlanges } from "@/state/flangeSlice";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
// import { useLocation, useNavigate } from "react-router-dom";

// import { Plus, Minus, ArrowLeft } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { toast } from "react-toastify";
// import { createPieceOperation, updatePieceOperation, getPieceSplitsByCompany } from "@/state/pieceSplitJoinSlice";
// import documentNumberService from "@/services/DocumentNumberService";
// import { join } from "node:path/posix";

// interface SavedRow {
//   id: number;
//   mode: "SPLIT" | "JOIN";
//   operationDate: string;
//   pieceNo: string;
//   pieceMeter: string;
//   netWeight: string;
//   avgWt: string;
//   loomNo?: string;
//   beamNo?: string;
//   flangeNo?: string;
//   fabricLabel?: string;
// }

// const resolveFlangeLabel = (source?: any) => {
//   if (!source) return undefined;
//   const label =
//     source.flangeNo ??
//     source.flange_no ??
//     source.no ??
//     source.flange?.flangeNo ??
//     source.flange?.flange_no ??
//     source.flange?.no ??
//     source.flange?.flangeNumber ??
//     source.flange?.number ??
//     source.flange?.name;
//   if (label == null) return undefined;
//   return typeof label === "string" ? label : String(label);
// };

// const TAB_KEYS = ["SPLIT", "JOIN"] as const;
// type TabName = (typeof TAB_KEYS)[number];
// const DOCUMENT_SCREEN_NAME = "Piece Split/Join";
// const MODE_OPTIONS = [
//   { value: "1", label: "Split" },
//   { value: "2", label: "Join" },
// ];

// export default function PieceSplitJoinPage() {
//   const dispatch = useDispatch<AppDispatch>();
//   const { list: pieceEntryList } = useSelector((s: RootState) => s.factoryPieceEntry as any);
//   const { loomList } = useSelector((s: RootState) => s.loomMaster as any);
//   const { flangeList } = useSelector((s: RootState) => s.flange as any);
//   const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster as any);
//   const { splitList } = useSelector((s: RootState) => s.pieceSplitJoin as any);

//   const [splitDocumentNumber, setSplitDocumentNumber] = useState("");
//   const [joinDocumentNumber, setJoinDocumentNumber] = useState("");
//   const isSavingRef = useRef(false);
//   const hasGeneratedNumberRef = useRef<Record<TabName, boolean>>({ SPLIT: false, JOIN: false });

//   const [activeTab, setActiveTab] = useState<"SPLIT" | "JOIN">("SPLIT");
//   const [operationDate, setOperationDate] = useState<string>(new Date().toISOString().split("T")[0]);
//   const [operationId, setOperationId] = useState<number>(1);
//   const [modeId, setModeId] = useState<number>(1);
//   const [saved, setSaved] = useState<SavedRow[]>([]);
//   const [editIndex, setEditIndex] = useState<number | null>(null);

//   const [splitFabricMasterId, setSplitFabricMasterId] = useState<string>("");
//   const [splitPieceNo, setSplitPieceNo] = useState<string>("");
//   const [splitCount, setSplitCount] = useState<number>(0);
//   const [splitPieceMeter, setSplitPieceMeter] = useState<string>("");
//   const gatingSnoOptions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
//   const [splitRows, setSplitRows] = useState<Array<{ sno: string; pieceNo: string; pieceMeter: string; netWeight: string; avgWt: string }>>([]);

//   const [joinRows, setJoinRows] = useState<Array<{ pieceNo: string; pieceMeter: string; netWeight: string; avgWt: string; fabricMasterId: string }>>([{ pieceNo: "", pieceMeter: "", netWeight: "", avgWt: "", fabricMasterId: "" }]);
//   const [joinedPieceNo, setJoinedPieceNo] = useState<string>("");

//   const location = useLocation();
//   const navigate = useNavigate();
//   const editData = location.state as any;
//   const isEditMode = !!editData?.id;
//   const STORAGE_KEY = "psj_saved";

//   useEffect(() => {
//     const data = localStorage.getItem(STORAGE_KEY);
//     if (data) {
//       try { setSaved(JSON.parse(data)); } catch {}
//     }
//   }, []);

//   useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }, [saved]);

//   useEffect(() => {
//     const st: any = location.state as any;
//     if (st?.tab) {
//       setActiveTab(st.tab);
//       setOperationId(st.tab === "SPLIT" ? 1 : 0);
//       setModeId(st.tab === "SPLIT" ? 1 : 2);
//       if (st.operationDate) setOperationDate(st.operationDate.split("T")[0]);
//     }
//     const editId = st?.editId;
//     if (editId && saved.length) {
//       const i = saved.findIndex(x => x.id === editId);
//       if (i >= 0) {
//         setEditIndex(i);
//         const it = saved[i];
//         if (it.mode === "SPLIT") {
//           setActiveTab("SPLIT");
//           setOperationId(1);
//           setModeId(1);
//           setSplitPieceNo(it.pieceNo);
//           setSplitCount(1);
//           setSplitRows([{ sno: gatingSnoOptions[0], pieceNo: it.pieceNo, pieceMeter: it.pieceMeter, netWeight: it.netWeight, avgWt: it.avgWt }]);
//         } else {
//           setActiveTab("JOIN");
//           setOperationId(0);
//           setModeId(2);
//           setJoinRows([{
//             pieceNo: it.pieceNo, pieceMeter: it.pieceMeter, netWeight: it.netWeight, avgWt: it.avgWt,
//             fabricMasterId: ""
//           }]);
//         }
//       }
//     }
//   }, [location.state, saved]);

//   useEffect(() => {
//     const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
//     const cid = v ? Number(v) : undefined;
//     if (cid) {
//       dispatch(getFactoryPieceEntriesByCompany(cid));
//       dispatch(getPieceSplitsByCompany(cid));
//     } else {
//       dispatch(getAllFactoryPieceEntries({fetchAll: true} as any));
//     }
//     dispatch(getAllLooms(cid ? { companyId: cid, fetchAll: true } as any : ({} as any)));
//     dispatch(getAllFlanges(cid ? { companyId: cid, fetchAll: true } as any : ({} as any)));
//     dispatch(getAllFabricMasters({fetchAll: true} as any));
//   }, [dispatch]);

//   useEffect(() => {
//     const n = Math.max(0, Number(splitCount) || 0);
//     setSplitRows(prev => {
//       let next = [...prev];
//       if (next.length > n) {
//         next = next.slice(0, n);
//       }
//       while (next.length < n) {
//         next.push({ sno: String(next.length + 1), pieceNo: "", pieceMeter: "", netWeight: "", avgWt: "" });
//       }
//       for (let i = 0; i < next.length; i++) {
//         const suffix = i < 26 ? String.fromCharCode(65 + i) : String(i + 1);
//         const autoPieceNo = splitPieceNo ? `${splitPieceNo}.${suffix}` : "";
//         next[i] = { ...next[i], sno: String(i + 1), pieceNo: autoPieceNo };
//       }
//       return next;
//     });
//   }, [splitCount, splitPieceNo]);

//   useEffect(() => {
//     const st: any = location.state as any;
//     if (!st?.id) return;
//     if (st.operationDate) setOperationDate(st.operationDate.split("T")[0]);
//     if (Number(st.operationId) === 1) {
//       setActiveTab("SPLIT");
//       setOperationId(1);
//       setModeId(1);
//       setSplitPieceNo(String(st.parentPieceNo || ""));
//       setSplitPieceMeter(String(st.parentPieceMeter ?? ""));
//       if (st.fabricMasterId) setSplitFabricMasterId(String(st.fabricMasterId));
//       const details: any[] = Array.isArray(st.splitPiecesDetails) ? st.splitPiecesDetails : [];
//       const cnt = details.length || Number(st.noOfPieces || 0) || 0;
//       setSplitCount(cnt);
//       setSplitRows(details.map((d: any, i: number) => ({
//         sno: String(i + 1),
//         pieceNo: String(d.pieceNo || ""),
//         pieceMeter: String(d.pieceMeter ?? ""),
//         netWeight: String(d.netWeight ?? ""),
//         avgWt: String(d.avgWt ?? ""),
//       })));
//     } else if (Number(st.operationId) === 0) {
//       setActiveTab("JOIN");
//       setOperationId(0);
//       setModeId(2);
//       if (st.joinedPieceNo) setJoinedPieceNo(String(st.joinedPieceNo));
//       const details: any[] = Array.isArray((st as any).joinPiecesDetails) ? (st as any).joinPiecesDetails : [];
//       if (details.length) {
//         setJoinRows(details.map((d: any) => ({
//           pieceNo: String(d.pieceNo || ""),
//           pieceMeter: String(d.pieceMeter ?? ""),
//           netWeight: String(d.netWeight ?? ""),
//           avgWt: String(d.avgWt ?? ""),
//           fabricMasterId: d.fabricMasterId ? String(d.fabricMasterId) : "",
//         })));
//       }
//     }
//   }, [location.state]);

//   const factoryPieces = useMemo(() => {
//     const raw: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
//     return raw;
//   }, [pieceEntryList]);

//   const pieceOptions = useMemo(() => {
//     const entries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
//     const op0Entries = entries.filter((p: any) => Number(p.operationId ?? p.operation_id ?? -1) === 0)
//       .map((p: any) => String(p.pieceNumber || p.pieceNo || '').trim());
//     const splits: any[] = Array.isArray(splitList) ? splitList : [];
//     const op0SplitChildren: string[] = splits.flatMap((it: any) => {
//       const details: any[] = Array.isArray(it?.splitPiecesDetails) ? it.splitPiecesDetails : [];
//       return details.filter((d: any) => Number(d.operationId ?? d.operation_id ?? -1) === 0).map((d: any) => String(d.pieceNo || '').trim());
//     });
//     const all = Array.from(new Set([...op0Entries, ...op0SplitChildren])).filter(Boolean) as string[];
//     all.sort((a, b) => a.localeCompare(b));
//     return all;
//   }, [pieceEntryList, splitList]);

//   const pieceSelectOptions = useMemo(() => pieceOptions.map(p => ({ value: p, label: p })), [pieceOptions]);

//   useEffect(() => {
//     if (!splitPieceNo) { setSplitPieceMeter(""); return; }
//     const n = String(splitPieceNo || "").trim().toLowerCase();
//     const p: any = factoryPieces.find((x: any) => String(x.pieceNumber || x.pieceNo || "").trim().toLowerCase() === n);
//     if (!p) {
//       const info = lookupByPieceNo(splitPieceNo);
//       if (info) {
//         setSplitPieceMeter(info.meter || "");
//         if (info.fabricMasterId) setSplitFabricMasterId(String(info.fabricMasterId));
//       } else {
//         setSplitPieceMeter("");
//       }
//       return;
//     }
//     const inspected = Number(p.isInspected ?? p.is_inspected ?? 0) === 1;
//     const m = inspected ? (p.inspectedMtr ?? p.inspected_mtr) : (p.pieceMeter ?? p.piece_meter);
//     setSplitPieceMeter(m != null ? String(m) : "");
//     const fid = p.fabricMasterId ?? p.fabric_master_id;
//     if (fid != null) setSplitFabricMasterId(String(fid));
//   }, [splitPieceNo, factoryPieces]);

//   const loomNameById = useMemo(() => {
//     const raw: any = loomList as any;
//     const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const m = new Map<string, string>();
//     arr.forEach((l: any) => m.set(String(l.id), String(l.loomNo || l.loomName || l.name || l.id)));
//     return m;
//   }, [loomList]);

//   const flangeNoById = useMemo(() => {
//     const raw: any = flangeList as any;
//     const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const m = new Map<string, string>();
//     arr.forEach((f: any) => m.set(String(f.id), String(f.flangeNo || f.flange_no || f.no || "")));
//     return m;
//   }, [flangeList]);

//   const fabricLabelById = useMemo(() => {
//     const arr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
//     const m = new Map<string, string>();
//     arr.forEach((f: any) => {
//       const code = String(f.fabricCode || f.fabric_code || f.code || "").trim();
//       const qual = String(f.fabricQuality || f.quality || f.fabric_quality || "").trim();
//       const label = [code, qual].filter(Boolean).join(" - ");
//       m.set(String(f.id), label);
//     });
//     return m;
//   }, [fabricMasterList]);

//   const fabricCodeOptions = useMemo(() => {
//     const arr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
//     const seen = new Set<string>();
//     const result: { value: string; label: string }[] = [];
//     arr.forEach((f: any) => {
//       const id = String(f.id ?? '').trim();
//       if (!id || seen.has(id)) return;
//       seen.add(id);
//       const code = String(f.fabricCode || f.fabric_code || '').trim();
//       const qual = String(f.fabricQuality || f.quality || f.fabric_quality || '').trim();
//       const label = [code, qual].filter(Boolean).join(' - ') || id;
//       result.push({ value: id, label });
//     });
//     return result;
//   }, [fabricMasterList]);

//   const splitFilteredPieceOptions = useMemo(() => {
//     if (!splitFabricMasterId) return pieceSelectOptions;
//     const entries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
//     const validPieceNos = new Set(
//       entries
//         .filter((p: any) => String(p.fabricMasterId ?? p.fabric_master_id ?? '') === splitFabricMasterId)
//         .map((p: any) => String(p.pieceNumber || p.pieceNo || '').trim())
//         .filter(Boolean)
//     );
//     return pieceSelectOptions.filter(o => validPieceNos.has(o.value));
//   }, [splitFabricMasterId, pieceSelectOptions, pieceEntryList]);

//   const splitChildInfoByPieceNo = useMemo(() => {
//     const map = new Map<string, any>();
//     const splits: any[] = Array.isArray(splitList) ? splitList : [];
//     splits.forEach((it: any) => {
//       const details: any[] = Array.isArray(it?.splitPiecesDetails) ? it.splitPiecesDetails : [];
//       details.filter((d: any) => Number(d.operationId ?? d.operation_id ?? -1) === 0).forEach((d: any) => {
//         map.set(String(d.pieceNo || '').trim().toLowerCase(), {
//           loomId: it?.loomId ?? it?.loom_id,
//           flangeId: it?.flangeId ?? it?.flange_id,
//           flangeNo: resolveFlangeLabel(it),
//           beamId: it?.beamId ?? it?.beam_id,
//           beamNo: it?.beamNo ?? it?.beam_no,
//           fabricMasterId: it?.fabricMasterId ?? it?.fabric_master_id,
//           meter: d?.pieceMeter,
//           weight: d?.netWeight,
//         });
//       });
//     });
//     return map;
//   }, [splitList]);

//   const lookupByPieceNo = (no: string) => {
//     const n = String(no || '').trim().toLowerCase();
//     const p = factoryPieces.find((x: any) => String(x.pieceNumber || x.pieceNo || '').trim().toLowerCase() === n);
//     if (!p) {
//       const s = splitChildInfoByPieceNo.get(n);
//       if (!s) return null;
//       const loomNo = loomNameById.get(String(s.loomId || ''));
//       const flangeSource = flangeNoById.get(String(s.flangeId || ''));
//       const flangeNo = flangeSource || s.flangeNo;
//       const fabricLabel = fabricLabelById.get(String(s.fabricMasterId || ''));
//       return { loomId: s.loomId, flangeId: s.flangeId, beamId: s.beamId, loomNo, beamNo: s.beamNo, flangeNo, fabricMasterId: s.fabricMasterId, fabricLabel, meter: s.meter != null ? String(s.meter) : '', weight: s.weight != null ? String(s.weight) : '' };
//     }
//     const baseBeamId = p.beamId ?? p.beam_id;
//     const fromBeam = factoryPieces.find((x: any) => (x.beamId ?? x.beam_id) === baseBeamId) || p;
//     const loomId = (fromBeam.loomId ?? fromBeam.loom_id) ?? (p.loomId ?? p.loom_id);
//     const flangeId = (fromBeam.flangeId ?? fromBeam.flange_id) ?? (p.flangeId ?? p.flange_id);
//     const beamId = baseBeamId;
//     const loomNo = loomNameById.get(String(loomId || ''));
//     const beamNo = String(fromBeam.beamNo ?? p.beamNo ?? '').trim() || undefined;
//     const flangeSource = flangeNoById.get(String(flangeId || ''));
//     const fallbackFlangeNo = resolveFlangeLabel(fromBeam) || resolveFlangeLabel(p);
//     const flangeNo = flangeSource || fallbackFlangeNo;
//     const fabricMasterId = (fromBeam.fabricMasterId ?? fromBeam.fabric_master_id) ?? (p.fabricMasterId ?? p.fabric_master_id);
//     const fabricLabel = fabricLabelById.get(String(fabricMasterId || ''));
//     const meter = p.pieceMeter ?? p.inspectedMtr ?? p.quantity ?? '';
//     const weight = p.netWeight ?? p.actualNetWeight ?? p.weight ?? '';
//     return { loomId, flangeId, beamId, loomNo, beamNo, flangeNo, fabricMasterId, fabricLabel, meter: meter != null ? String(meter) : '', weight: weight != null ? String(weight) : '' };
//   };

//   const onSplitRowChange = (i: number, key: "sno" | "pieceNo" | "pieceMeter" | "netWeight", val: string) => {
//     setSplitRows(prev => {
//       const next = [...prev];
//       const row = { ...next[i], [key]: val } as any;
//       const m = parseFloat(row.pieceMeter || "0");
//       const w = parseFloat(row.netWeight || "0");
//       row.avgWt = m > 0 ? (w / m).toFixed(3) : "0";
//       next[i] = row;
//       return next;
//     });
//   };

//   const onJoinRowChange = (i: number, key: "pieceNo" | "pieceMeter" | "netWeight" | "fabricMasterId", val: string) => {
//     setJoinRows(prev => {
//       if (key === "pieceNo") {
//         const v = String(val || '').trim();
//         const dup = v && prev.some((r, j) => j !== i && String(r.pieceNo || '').trim().toLowerCase() === v.toLowerCase());
//         if (dup) {
//           toast.error("Same Piece cant able to join");
//           return prev;
//         }
//       }
//       const next = [...prev];
//       const row = { ...next[i], [key]: val } as any;
//       if (key === "fabricMasterId") {
//         row.pieceNo = "";
//         row.pieceMeter = "";
//         row.netWeight = "";
//         row.avgWt = "0";
//         next[i] = row;
//         return next;
//       }
//       if (key === "pieceNo") {
//         const info = lookupByPieceNo(val);
//         if (info) {
//           row.pieceMeter = info.meter || row.pieceMeter || "";
//           row.netWeight = info.weight || row.netWeight || "";
//           if (info.fabricMasterId) {
//             row.fabricMasterId = String(info.fabricMasterId);
//           }
//         }
//       }
//       const m = parseFloat(row.pieceMeter || "0");
//       const w = parseFloat(row.netWeight || "0");
//       row.avgWt = m > 0 ? (w / m).toFixed(3) : "0";
//       next[i] = row;
//       return next;
//     });
//   };

//   const addJoinRow = () => setJoinRows(prev => [...prev, { pieceNo: "", pieceMeter: "", netWeight: "", avgWt: "", fabricMasterId: "" }]);
//   const removeJoinRow = (i: number) => setJoinRows(prev => prev.filter((_, ix) => ix !== i));

//   const canSaveSplit = useMemo(() => {
//     if (!splitPieceNo) return false;
//     if (!splitRows.length) return false;
//     return splitRows.every(r => r.pieceNo && r.pieceMeter !== "" && r.netWeight !== "");
//   }, [splitPieceNo, splitRows]);

//   const canSaveJoin = useMemo(() => {
//     const count = joinRows.filter(r => r.pieceNo).length;
//     return count >= 2;
//   }, [joinRows]);

//   useEffect(() => {
//     if (!isEditMode) {
//       setJoinedPieceNo(joinRows.map(r => r.pieceNo).filter(Boolean).join("-"));
//     }
//   }, [joinRows, isEditMode]);

//   const findPieceIdByNo = (no: string) => {
//   const entries: any[] = Array.isArray(pieceEntryList) ? (pieceEntryList as any) : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
//   const p = entries.find((x: any) => String(x.pieceNumber || x.pieceNo || '').trim().toLowerCase() === String(no || '').trim().toLowerCase());
//   return p?.id ?? 0;
// };


//   const ensureDocumentNumberForTab = async (tab: TabName): Promise<string | null> => {
//   const existingNumber = tab === "SPLIT" ? splitDocumentNumber : joinDocumentNumber;
//   if (existingNumber) return existingNumber;

//   try {
//     const result = await documentNumberService.generateDocumentNumber({
//       screenName: DOCUMENT_SCREEN_NAME,
//       tabName: tab,
//     });
//     const generatedNumber = result.documentNumber;
//     if (!generatedNumber) return null;

//     if (tab === "SPLIT") {
//       setSplitDocumentNumber(generatedNumber);
//     } else {
//       setJoinDocumentNumber(generatedNumber);
//     }

//     hasGeneratedNumberRef.current[tab] = true;
//     return generatedNumber;
//   } catch (error) {
//     console.error(`Failed to generate ${tab.toLowerCase()} document number`, error);
//     toast.error(`Failed to generate ${tab === "SPLIT" ? "split" : "join"} document number`);
//     return null;
//   }
// };

// const buildSplitPayload = (documentNumber?: string) => {
//   const srcInfo = lookupByPieceNo(splitPieceNo);
//   const companyId = Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany")) || undefined;
//   const parentSelectedPieceId = findPieceIdByNo(splitPieceNo);
//   return {
//     operationId: 1,
//     modeId: 1,
//     operationDate,
//     companyId,
//     parentPieceId: 0,
//     parentPieceNo: splitPieceNo,
//     parentPieceMeter: splitPieceMeter,
//     loomId: srcInfo?.loomId,
//     flangeId: srcInfo?.flangeId,
//     flangeNo: srcInfo?.flangeNo,
//     beamId: srcInfo?.beamId,
//     beamNo: srcInfo?.beamNo,
//     fabricMasterId: splitFabricMasterId ? Number(splitFabricMasterId) : srcInfo?.fabricMasterId,
//     pieceSplitNo: documentNumber,
//     noOfPieces: splitRows.length,
//     splitPiecesDetails: splitRows.map(r => ({
//       parentPieceId: parentSelectedPieceId,
//       modeId: 1,
//       operationId: 0,
//       pieceNo: r.pieceNo,
//       pieceMeter: r.pieceMeter,
//       netWeight: r.netWeight,
//       avgWt: r.avgWt
//     })),
//   };
// };

// const buildJoinPayload = (documentNumber?: string) => {
//   const companyId = Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany")) || undefined;
//   const firstPieceNo = (joinRows.find(r => r.pieceNo) || { pieceNo: "" }).pieceNo || "";
//   const srcInfo = lookupByPieceNo(firstPieceNo);
//   const totalJoinedMeter = joinRows.reduce((s, r) => s + (parseFloat(r.pieceMeter || "0") || 0), 0);
//   const joinEntries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
//   const firstPiece = firstPieceNo ? joinEntries.find((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase() === firstPieceNo.trim().toLowerCase()) : null;
//   const resolvedFabricMasterId = firstPiece
//     ? (firstPiece.fabricMasterId ?? firstPiece.fabric_master_id ?? srcInfo?.fabricMasterId)
//     : srcInfo?.fabricMasterId;
//   const resolvedIsFactoryFabric = firstPiece != null
//     ? Number(firstPiece.isFactoryFabric ?? firstPiece.is_factory_fabric ?? 1)
//     : 1;
//   return {
//     operationId: 0,
//     modeId: 2,
//     operationDate,
//     companyId,
//     loomId: srcInfo?.loomId,
//     flangeId: srcInfo?.flangeId,
//     flangeNo: srcInfo?.flangeNo,
//     beamId: srcInfo?.beamId,
//     beamNo: srcInfo?.beamNo,
//     // fabricMasterId: resolvedFabricMasterId,
//     pieceJoinNo: documentNumber,
//     joinedPieceId: 0,
//     joinedPieceNo,
//     joinedPieceMeter: String(totalJoinedMeter),
//     isFactoryFabric: resolvedIsFactoryFabric,
//     joinPiecesDetails: joinRows.map(r => {
//       const rowPiece = r.pieceNo ? joinEntries.find((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase() === r.pieceNo.trim().toLowerCase()) : null;
//       const rowFabricMasterId = rowPiece ? (rowPiece.fabricMasterId ?? rowPiece.fabric_master_id ?? undefined) : undefined;
//       return {
//         joinedPieceId: findPieceIdByNo(r.pieceNo),
//         modeId: 2,
//         operationId: 2,
//         beamId: srcInfo?.beamId,
//         pieceNo: r.pieceNo,
//         pieceMeter: r.pieceMeter,
//         netWeight: r.netWeight,
//         avgWt: r.avgWt,
//         fabricMasterId: rowFabricMasterId,
//       };
//     }),
//   };
// };

//   const saveSplit = async () => {
//     if (!canSaveSplit) return;

//     const entries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
//     for (const r of splitRows) {
//       const exists = entries.some((x: any) => {
//         const pieceNo = String(x.pieceNumber || x.pieceNo || "").trim().toLowerCase();
//         const targetNo = String(r.pieceNo || "").trim().toLowerCase();
//         if (pieceNo === targetNo) {
//           if (isEditMode && editData?.splitPiecesDetails) {
//             return !editData.splitPiecesDetails.some((d: any) => String(d.pieceNo || "").trim().toLowerCase() === targetNo);
//           }
//           return true;
//         }
//         return false;
//       });
//       if (exists) {
//         toast.error("This Piece number already exists");
//         return;
//       }
//     }

//     const parent = parseFloat(splitPieceMeter || "0") || 0;
//     const totalChild = splitRows.reduce((s, r) => s + (parseFloat(r.pieceMeter || "0") || 0), 0);
//     if (Math.abs(totalChild - parent) > 0.0001) {
//       toast.error("Piece Meter Mistmatch");
//       return;
//     }

//     let documentNumber = splitDocumentNumber;
//     if (!documentNumber && editData?.pieceSplitNo) {
//       documentNumber = String(editData.pieceSplitNo);
//     }
//     if (!documentNumber) {
//       const generatedNumber = await ensureDocumentNumberForTab("SPLIT");
//       if (!generatedNumber) return;
//       documentNumber = generatedNumber;
//     }

//     const payload = buildSplitPayload(documentNumber);
//     // alert(JSON.stringify(payload));
//     //   console.log("hddjjdjdjdjjdjdj"+JSON.stringify(payload));
//     const companyId = Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany")) || undefined;
//     isSavingRef.current = true;
//     const dispatchPromise = isEditMode && editData?.id
//       ? dispatch(updatePieceOperation({ id: editData.id, companyId, data: payload }))
//       : dispatch(createPieceOperation(payload));

//     if (!isEditMode || !editData?.id) {
//       documentNumberService.clearMemoryCache(DOCUMENT_SCREEN_NAME, "SPLIT");
//       hasGeneratedNumberRef.current.SPLIT = false;
//     }

//     dispatchPromise.finally(() => {
//       isSavingRef.current = false;
//     });

//     const srcInfo = lookupByPieceNo(splitPieceNo);
//     const startId = saved.length ? Math.max(...saved.map(s => s.id)) + 1 : 1;
//     const rows: SavedRow[] = splitRows.map((r, idx) => {
//       return {
//         id: startId + idx,
//         mode: "SPLIT",
//         operationDate,
//         pieceNo: r.pieceNo,
//         pieceMeter: r.pieceMeter,
//         netWeight: r.netWeight,
//         avgWt: r.avgWt,
//         loomNo: srcInfo?.loomNo,
//         beamNo: srcInfo?.beamNo,
//         flangeNo: srcInfo?.flangeNo,
//         fabricLabel: srcInfo?.fabricLabel,
//       };
//     });
//     if (editIndex != null) {
//       const targetId = saved[editIndex]?.id;
//       if (targetId != null && rows.length) rows[0].id = targetId;
//       setSaved(prev => prev.map((x, i) => (i === editIndex ? rows[0] : x)));
//       setEditIndex(null);
//     } else {
//       setSaved(prev => [...prev, ...rows]);
//     }
//     setSplitPieceNo("");
//     setSplitCount(0);
//     setSplitRows([]);
//     navigate("/transaction/piece-split-join-details", { state: { tab: "SPLIT" } });
//   };

//   const saveJoin = async () => {
//     if (!canSaveJoin) return;

//     const entries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];

//     const filledRows = joinRows.filter(r => r.pieceNo);
//     const fabricLabels = filledRows.map(r => {
//       const piece = entries.find((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase() === r.pieceNo.trim().toLowerCase());
//       const fid = piece ? String(piece.fabricMasterId ?? piece.fabric_master_id ?? '') : '';
//       return fid ? (fabricLabelById.get(fid) || '') : '';
//     });
//     const uniqueLabels = new Set(fabricLabels.filter(Boolean));
//     if (uniqueLabels.size > 1) {
//       toast.error("Selected Pieces having different quality. Please choose same quality of pieces");
//       return;
//     }
//     // alert(uniqueLabels.size);
//     const targetJoinedNo = String(joinedPieceNo || "").trim().toLowerCase();
//     const exists = entries.some((x: any) => {
//       const pieceNo = String(x.pieceNumber || x.pieceNo || "").trim().toLowerCase();
//       if (pieceNo === targetJoinedNo) {
//         if (isEditMode && String(editData?.joinedPieceNo || "").trim().toLowerCase() === targetJoinedNo) {
//           return false;
//         }
//         return true;
//       }
//       return false;
//     });

//     if (exists) {
//       toast.error("This Piece number already exists");
//       return;
//     }

//     let documentNumber = joinDocumentNumber;
//     if (!documentNumber && editData?.pieceJoinNo) {
//       documentNumber = String(editData.pieceJoinNo);
//     }
//     if (!documentNumber) {
//       const generatedNumber = await ensureDocumentNumberForTab("JOIN");
//       if (!generatedNumber) return;
//       documentNumber = generatedNumber;
//     }

//     const payload = buildJoinPayload(documentNumber);
//     const companyId = Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany")) || undefined;
//     isSavingRef.current = true;
//     const dispatchPromise = isEditMode && editData?.id
//       ? dispatch(updatePieceOperation({ id: editData.id, companyId, data: payload }))
//       : dispatch(createPieceOperation(payload));

//     if (!isEditMode || !editData?.id) {
//       documentNumberService.clearMemoryCache(DOCUMENT_SCREEN_NAME, "JOIN");
//       hasGeneratedNumberRef.current.JOIN = false;
//     }

//     dispatchPromise.finally(() => {
//       isSavingRef.current = false;
//     });

//     const startId = saved.length ? Math.max(...saved.map(s => s.id)) + 1 : 1;
//     const rows: SavedRow[] = joinRows.map((r, idx) => {
//       const info = lookupByPieceNo(r.pieceNo || "");
//       return {
//         id: startId + idx,
//         mode: "JOIN",
//         operationDate,
//         pieceNo: r.pieceNo,
//         pieceMeter: r.pieceMeter || info?.meter || "",
//         netWeight: r.netWeight || info?.weight || "",
//         avgWt: r.avgWt || "0",
//         loomNo: info?.loomNo,
//         beamNo: info?.beamNo,
//         flangeNo: info?.flangeNo,
//         fabricLabel: info?.fabricLabel,
//       };
//     });
//     if (editIndex != null) {
//       const targetId = saved[editIndex]?.id;
//       if (targetId != null && rows.length) rows[0].id = targetId;
//       setSaved(prev => prev.map((x, i) => (i === editIndex ? rows[0] : x)));
//       setEditIndex(null);
//     } else {
//       setSaved(prev => [...prev, ...rows]);
//     }
//     setJoinRows([{ pieceNo: "", pieceMeter: "", netWeight: "", avgWt: "", fabricMasterId: "" }]);
//     navigate("/transaction/piece-split-join-details", { state: { tab: "JOIN" } });
//   };

//   const onEdit = (i: number) => {
//     const it = saved[i];
//     if (!it) return;
//     setEditIndex(i);
//     if (it.mode === "SPLIT") {
//       setActiveTab("SPLIT");
//       setOperationId(1);
//       setSplitPieceNo(it.pieceNo);
//       setSplitCount(1);
//       setSplitRows([{ sno: gatingSnoOptions[0], pieceNo: it.pieceNo, pieceMeter: it.pieceMeter, netWeight: it.netWeight, avgWt: it.avgWt }]);
//     } else {
//       setActiveTab("JOIN");
//       setOperationId(0);
//       setJoinRows([{
//         pieceNo: it.pieceNo, pieceMeter: it.pieceMeter, netWeight: it.netWeight, avgWt: it.avgWt,
//         fabricMasterId: ""
//       }]);
//     }
//   };

//   const onDelete = (i: number) => setSaved(prev => prev.filter((_, ix) => ix !== i));

//   return (
//     <div className="p-6 pt-16 space-y-6 mt-5">
//       {/* <h1 className="text-2xl font-semibold">Piece Split/Join</h1> */}
//    <div className="flex gap-2">
//         <Button
//           variant="outline"
//           onClick={() => navigate("/transaction/piece-split-join-details")}
//         >
//           <ArrowLeft size={18} className="mr-2" />
//           Back
//         </Button>
//         <h1 className="text-2xl font-semibold mb-4">{isEditMode ? 'Edit' : 'Add'} Piece Split/Join</h1>
//       </div>
//       <Card className="bg-white">
//         <CardHeader>
//           <CardTitle>Add / Edit</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm mb-1">Mode</label>
//               <CommonSearchableSelect
//                 className="w-full"
//                 placeholder="Select Mode"
//                 options={MODE_OPTIONS}
//                 value={String(modeId)}
//                 onValueChange={(value) => {
//                   const v = Number(value);
//                   setModeId(v);
//                   setActiveTab(v === 1 ? "SPLIT" : "JOIN");
//                 }}
//               />
//             </div>
//             <div>
//               <label className="block text-sm mb-1">Date</label>
//               <input type="date" value={operationDate} onChange={e => setOperationDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
//             </div>
//           </div>

//           {modeId === 1 && (
//             <>
//               <div className="grid grid-cols-4 gap-4 mt-4">
//                 <div>
//                   <label className="block text-sm mb-1">Fabric Code/Quality</label>
//                   <CommonSearchableSelect
//                     className="w-full"
//                     placeholder="Select Fabric"
//                     options={fabricCodeOptions}
//                     value={splitFabricMasterId || ''}
//                     onValueChange={(value) => {
//                       setSplitFabricMasterId(value);
//                       setSplitPieceNo("");
//                     }}
//                     disabled={isEditMode}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm mb-1">Piece No<span className="text-red-500">*</span></label>
//                   <CommonSearchableSelect
//                     className="w-full"
//                     placeholder="Select Piece"
//                     options={(splitPieceNo && !splitFilteredPieceOptions.some(o => o.value === splitPieceNo))
//                       ? [{ value: splitPieceNo, label: splitPieceNo }, ...splitFilteredPieceOptions]
//                       : splitFilteredPieceOptions}
//                     value={splitPieceNo || ''}
//                     onValueChange={(value) => setSplitPieceNo(value)}
//                     disabled={isEditMode}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm mb-1">No of Pieces<span className="text-red-500">*</span></label>
//                   <input type="number" min={0} value={splitCount || ""} onChange={e => setSplitCount(Number(e.target.value || 0))} disabled={isEditMode} className="border border-gray-300 rounded px-2 py-1 w-full" />
//                 </div>
//                 <div>
//                   <label className="block text-sm mb-1">Piece Meter</label>
//                   <input type="number" min={0} value={splitPieceMeter} onChange={e => setSplitPieceMeter(e.target.value)} disabled={isEditMode} className="border border-gray-300 rounded px-2 py-1 w-full" />
//                 </div>
//               </div>

//               <div className="overflow-x-auto mt-4">
//                 <table className="w-full border-collapse border border-gray-300 text-center">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">S.No</th>
//                       <th className="border p-2">Piece No<span className="text-red-500">*</span></th>
//                       <th className="border p-2">Piece Meter<span className="text-red-500">*</span></th>
//                       <th className="border p-2">Net Weight<span className="text-red-500">*</span></th>
//                       <th className="border p-2">Avg Wt</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {splitRows.map((r, idx) => (
//                       <tr key={idx} className="border">
//                         <td className="border p-2">{idx + 1}</td>
//                         <td className="border p-2"><input value={r.pieceNo} onChange={e => onSplitRowChange(idx, "pieceNo", e.target.value)} readOnly={isEditMode} className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50" /></td>
//                         <td className="border p-2"><input type="number" value={r.pieceMeter} onChange={e => onSplitRowChange(idx, "pieceMeter", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" /></td>
//                         <td className="border p-2"><input type="number" value={r.netWeight} onChange={e => onSplitRowChange(idx, "netWeight", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" /></td>
//                         <td className="border p-2"><input value={r.avgWt} readOnly className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50" /></td>
//                       </tr>
//                     ))}
//                     {splitRows.length === 0 && (
//                       <tr>
//                         <td className="border p-2 text-gray-500" colSpan={5}>No rows</td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="flex justify-end mt-4">
//                 <button onClick={saveSplit} disabled={!canSaveSplit} className={`px-4 py-2 rounded text-white ${canSaveSplit ? "bg-primary" : "bg-gray-400"}`}>{isEditMode && modeId === 1 ? "Update" : "Save"}</button>
//               </div>
//             </>
//           )}

//           {modeId === 2 && (
//             <>
//               <div className="grid grid-cols-4 gap-4 mt-4">
//                 <div>
//                   <label className="block text-sm mb-1">Joined Piece No</label>
//                   <input value={joinedPieceNo} onChange={e => setJoinedPieceNo(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
//                 </div>
//               </div>
//               <div className="overflow-x-auto mt-4">
//                 <table className="w-full border-collapse border border-gray-300 text-center">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">S.No</th>
//                       <th className="border p-2">Piece No<span className="text-red-500">*</span></th>
//                       <th className="border p-2">Fabric Code/Quality</th>
//                       <th className="border p-2">Piece Meter</th>
//                       <th className="border p-2">Net Weight</th>
//                       <th className="border p-2">Avg Wt</th>
//                       <th className="border p-2">Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {joinRows.map((r, idx) => {
//                       const filteredJoinPieceOptions = pieceOptions
//                         .filter(p => {
//                           if (r.fabricMasterId) {
//                             const info = lookupByPieceNo(p);
//                             const fid = info?.fabricMasterId ? String(info.fabricMasterId) : '';
//                             if (fid !== r.fabricMasterId) return false;
//                           }
//                           return p === r.pieceNo || !joinRows.some((jr, jdx) => jdx !== idx && jr.pieceNo === p);
//                         })
//                         .map(p => ({ value: p, label: p }));
//                       const joinOptions = (r.pieceNo && !filteredJoinPieceOptions.some(o => o.value === r.pieceNo))
//                         ? [{ value: r.pieceNo, label: r.pieceNo }, ...filteredJoinPieceOptions]
//                         : filteredJoinPieceOptions;
//                       return (
//                         <tr key={idx} className="border">
//                           <td className="border p-2">{idx + 1}</td>
//                           <td className="border p-2">
//                             <CommonSearchableSelect
//                               className="w-full"
//                               placeholder="Select Piece"
//                               options={joinOptions}
//                               value={r.pieceNo || ''}
//                               onValueChange={(value) => onJoinRowChange(idx, "pieceNo", value)}
//                             />
//                           </td>
//                           <td className="border p-2">
//                             <CommonSearchableSelect
//                               className="w-full"
//                               placeholder="Fabric Code/Quality"
//                               options={fabricCodeOptions}
//                               value={r.fabricMasterId || ''}
//                               onValueChange={(value) => onJoinRowChange(idx, "fabricMasterId", value)}
//                             />
//                           </td>
//                           <td className="border p-2"><input type="number" value={r.pieceMeter} onChange={e => onJoinRowChange(idx, "pieceMeter", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" /></td>
//                           <td className="border p-2"><input type="number" value={r.netWeight} onChange={e => onJoinRowChange(idx, "netWeight", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" /></td>
//                           <td className="border p-2"><input value={r.avgWt} readOnly className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50" /></td>
//                           <td className="border p-2 space-x-2">
//                             <button onClick={() => addJoinRow()} className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded"><Plus size={16} /></button>
//                             {joinRows.length > 1 && (
//                               <button onClick={() => removeJoinRow(idx)} className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded"><Minus size={16} /></button>
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//               <div className="flex justify-end mt-4">
//                 <button onClick={saveJoin} disabled={!canSaveJoin} className={`px-4 py-2 rounded text-white ${canSaveJoin ? "bg-primary" : "bg-gray-400"}`}>{isEditMode && modeId === 2 ? "Update" : "Join"}</button>
//               </div>
//             </>
//           )}
//         </CardContent>
//       </Card>


//     </div>
//   );
// }

// export const TAB_NAMES = ["SPLIT", "JOIN"];
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany } from "@/state/factoryPieceEntrySlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { useLocation, useNavigate } from "react-router-dom";

import { Plus, Minus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { createPieceOperation, updatePieceOperation, getPieceSplitsByCompany } from "@/state/pieceSplitJoinSlice";
import documentNumberService from "@/services/DocumentNumberService";
import { join } from "node:path/posix";

interface SavedRow {
  id: number;
  mode: "SPLIT" | "JOIN";
  operationDate: string;
  pieceNo: string;
  pieceMeter: string;
  netWeight: string;
  avgWt: string;
  loomNo?: string;
  beamNo?: string;
  flangeNo?: string;
  fabricLabel?: string;
}

const resolveFlangeLabel = (source?: any) => {
  if (!source) return undefined;
  const label =
    source.flangeNo ??
    source.flange_no ??
    source.no ??
    source.flange?.flangeNo ??
    source.flange?.flange_no ??
    source.flange?.no ??
    source.flange?.flangeNumber ??
    source.flange?.number ??
    source.flange?.name;
  if (label == null) return undefined;
  return typeof label === "string" ? label : String(label);
};

const TAB_KEYS = ["SPLIT", "JOIN"] as const;
type TabName = (typeof TAB_KEYS)[number];
const DOCUMENT_SCREEN_NAME = "Piece Split/Join";
const MODE_OPTIONS = [
  { value: "1", label: "Split" },
  { value: "2", label: "Join" },
];

export default function PieceSplitJoinPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: pieceEntryList } = useSelector((s: RootState) => s.factoryPieceEntry as any);
  const { loomList } = useSelector((s: RootState) => s.loomMaster as any);
  const { flangeList } = useSelector((s: RootState) => s.flange as any);
  const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster as any);
  const { splitList } = useSelector((s: RootState) => s.pieceSplitJoin as any);

  const [splitDocumentNumber, setSplitDocumentNumber] = useState("");
  const [joinDocumentNumber, setJoinDocumentNumber] = useState("");
  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef<Record<TabName, boolean>>({ SPLIT: false, JOIN: false });

  const [activeTab, setActiveTab] = useState<"SPLIT" | "JOIN">("SPLIT");
  const [operationDate, setOperationDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [operationId, setOperationId] = useState<number>(1);
  const [modeId, setModeId] = useState<number>(1);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [splitFabricMasterId, setSplitFabricMasterId] = useState<string>("");
  const [splitPieceNo, setSplitPieceNo] = useState<string>("");
  const [splitCount, setSplitCount] = useState<number>(0);
  const [splitPieceMeter, setSplitPieceMeter] = useState<string>("");
  const gatingSnoOptions = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const [splitRows, setSplitRows] = useState<Array<{ sno: string; pieceNo: string; pieceMeter: string; netWeight: string; avgWt: string }>>([]);

  const [joinRows, setJoinRows] = useState<Array<{ pieceNo: string; pieceMeter: string; netWeight: string; avgWt: string; fabricMasterId: string }>>([{ pieceNo: "", pieceMeter: "", netWeight: "", avgWt: "", fabricMasterId: "" }]);
  const [joinedPieceNo, setJoinedPieceNo] = useState<string>("");

  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state as any;
  const isEditMode = !!editData?.id;
  const STORAGE_KEY = "psj_saved";

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try { setSaved(JSON.parse(data)); } catch {}
    }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }, [saved]);

  useEffect(() => {
    const st: any = location.state as any;
    if (st?.tab) {
      setActiveTab(st.tab);
      setOperationId(st.tab === "SPLIT" ? 1 : 0);
      setModeId(st.tab === "SPLIT" ? 1 : 2);
      if (st.operationDate) setOperationDate(st.operationDate.split("T")[0]);
    }
    const editId = st?.editId;
    if (editId && saved.length) {
      const i = saved.findIndex(x => x.id === editId);
      if (i >= 0) {
        setEditIndex(i);
        const it = saved[i];
        if (it.mode === "SPLIT") {
          setActiveTab("SPLIT");
          setOperationId(1);
          setModeId(1);
          setSplitPieceNo(it.pieceNo);
          setSplitCount(1);
          setSplitRows([{ sno: gatingSnoOptions[0], pieceNo: it.pieceNo, pieceMeter: it.pieceMeter, netWeight: it.netWeight, avgWt: it.avgWt }]);
        } else {
          setActiveTab("JOIN");
          setOperationId(0);
          setModeId(2);
          setJoinRows([{
            pieceNo: it.pieceNo, pieceMeter: it.pieceMeter, netWeight: it.netWeight, avgWt: it.avgWt,
            fabricMasterId: ""
          }]);
        }
      }
    }
  }, [location.state, saved]);

  useEffect(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    if (cid) {
      dispatch(getFactoryPieceEntriesByCompany(cid));
      dispatch(getPieceSplitsByCompany(cid));
    } else {
      dispatch(getAllFactoryPieceEntries({fetchAll: true} as any));
    }
    dispatch(getAllLooms(cid ? { companyId: cid, fetchAll: true } as any : ({} as any)));
    dispatch(getAllFlanges(cid ? { companyId: cid, fetchAll: true } as any : ({} as any)));
    dispatch(getAllFabricMasters({fetchAll: true} as any));
  }, [dispatch]);

  useEffect(() => {
    const n = Math.max(0, Number(splitCount) || 0);
    setSplitRows(prev => {
      let next = [...prev];
      if (next.length > n) {
        next = next.slice(0, n);
      }
      while (next.length < n) {
        next.push({ sno: String(next.length + 1), pieceNo: "", pieceMeter: "", netWeight: "", avgWt: "" });
      }
      for (let i = 0; i < next.length; i++) {
        const suffix = i < 26 ? String.fromCharCode(65 + i) : String(i + 1);
        const autoPieceNo = splitPieceNo ? `${splitPieceNo}.${suffix}` : "";
        next[i] = { ...next[i], sno: String(i + 1), pieceNo: autoPieceNo };
      }
      return next;
    });
  }, [splitCount, splitPieceNo]);

  useEffect(() => {
    const st: any = location.state as any;
    if (!st?.id) return;
    if (st.operationDate) setOperationDate(st.operationDate.split("T")[0]);
    if (Number(st.operationId) === 1) {
      setActiveTab("SPLIT");
      setOperationId(1);
      setModeId(1);
      setSplitPieceNo(String(st.parentPieceNo || ""));
      setSplitPieceMeter(String(st.parentPieceMeter ?? ""));
      if (st.fabricMasterId) setSplitFabricMasterId(String(st.fabricMasterId));
      const details: any[] = Array.isArray(st.splitPiecesDetails) ? st.splitPiecesDetails : [];
      const cnt = details.length || Number(st.noOfPieces || 0) || 0;
      setSplitCount(cnt);
      setSplitRows(details.map((d: any, i: number) => ({
        sno: String(i + 1),
        pieceNo: String(d.pieceNo || ""),
        pieceMeter: String(d.pieceMeter ?? ""),
        netWeight: String(d.netWeight ?? ""),
        avgWt: String(d.avgWt ?? ""),
      })));
    } else if (Number(st.operationId) === 0) {
      setActiveTab("JOIN");
      setOperationId(0);
      setModeId(2);
      if (st.joinedPieceNo) setJoinedPieceNo(String(st.joinedPieceNo));
      const details: any[] = Array.isArray((st as any).joinPiecesDetails) ? (st as any).joinPiecesDetails : [];
      if (details.length) {
        setJoinRows(details.map((d: any) => ({
          pieceNo: String(d.pieceNo || ""),
          pieceMeter: String(d.pieceMeter ?? ""),
          netWeight: String(d.netWeight ?? ""),
          avgWt: String(d.avgWt ?? ""),
          fabricMasterId: d.fabricMasterId ? String(d.fabricMasterId) : "",
        })));
      }
    }
  }, [location.state]);

  const factoryPieces = useMemo(() => {
    const raw: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
    return raw;
  }, [pieceEntryList]);

  const pieceOptions = useMemo(() => {
    const entries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
    const op0Entries = entries.filter((p: any) => {
      const opId = p.operationId ?? p.operation_id;
      return opId === 0 || opId == null;
    })
      .map((p: any) => String(p.pieceNumber || p.pieceNo || '').trim());
    const splits: any[] = Array.isArray(splitList) ? splitList : [];
    const op0SplitChildren: string[] = splits.flatMap((it: any) => {
      const details: any[] = Array.isArray(it?.splitPiecesDetails) ? it.splitPiecesDetails : [];
      return details.filter((d: any) => {
        const opId = d.operationId ?? d.operation_id;
        return opId === 0 || opId == null;
      }).map((d: any) => String(d.pieceNo || '').trim());
    });
    const all = Array.from(new Set([...op0Entries, ...op0SplitChildren])).filter(Boolean) as string[];
    all.sort((a, b) => a.localeCompare(b));
    return all;
  }, [pieceEntryList, splitList]);

  const pieceSelectOptions = useMemo(() => pieceOptions.map(p => ({ value: p, label: p })), [pieceOptions]);

  useEffect(() => {
    if (!splitPieceNo) { setSplitPieceMeter(""); return; }
    const n = String(splitPieceNo || "").trim().toLowerCase();
    const p: any = factoryPieces.find((x: any) => String(x.pieceNumber || x.pieceNo || "").trim().toLowerCase() === n);
    if (!p) {
      const info = lookupByPieceNo(splitPieceNo);
      if (info) {
        setSplitPieceMeter(info.meter || "");
        if (info.fabricMasterId) setSplitFabricMasterId(String(info.fabricMasterId));
      } else {
        setSplitPieceMeter("");
      }
      return;
    }
    const inspected = Number(p.isInspected ?? p.is_inspected ?? 0) === 1;
    const m = inspected ? (p.inspectedMtr ?? p.inspected_mtr) : (p.quantity ?? p.pieceMeter ?? p.piece_meter);
    setSplitPieceMeter(m != null ? String(m) : "");
    const fid = p.fabricMasterId ?? p.fabric_master_id;
    if (fid != null) setSplitFabricMasterId(String(fid));
  }, [splitPieceNo, factoryPieces]);

  const loomNameById = useMemo(() => {
    const raw: any = loomList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, string>();
    arr.forEach((l: any) => m.set(String(l.id), String(l.loomNo || l.loomName || l.name || l.id)));
    return m;
  }, [loomList]);

  const flangeNoById = useMemo(() => {
    const raw: any = flangeList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, string>();
    arr.forEach((f: any) => m.set(String(f.id), String(f.flangeNo || f.flange_no || f.no || "")));
    return m;
  }, [flangeList]);

  const fabricLabelById = useMemo(() => {
    const arr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
    const m = new Map<string, string>();
    arr.forEach((f: any) => {
      const code = String(f.fabricCode || f.fabric_code || f.code || "").trim();
      const qual = String(f.fabricQuality || f.quality || f.fabric_quality || "").trim();
      const label = [code, qual].filter(Boolean).join(" - ");
      m.set(String(f.id), label);
    });
    return m;
  }, [fabricMasterList]);

  const fabricCodeOptions = useMemo(() => {
    const arr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    arr.forEach((f: any) => {
      const id = String(f.id ?? '').trim();
      if (!id || seen.has(id)) return;
      seen.add(id);
      const code = String(f.fabricCode || f.fabric_code || '').trim();
      const qual = String(f.fabricQuality || f.quality || f.fabric_quality || '').trim();
      const label = [code, qual].filter(Boolean).join(' - ') || id;
      result.push({ value: id, label });
    });
    return result;
  }, [fabricMasterList]);

  const splitFilteredPieceOptions = useMemo(() => {
    if (!splitFabricMasterId) return pieceSelectOptions;
    const entries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
    const validPieceNos = new Set(
      entries
        .filter((p: any) => String(p.fabricMasterId ?? p.fabric_master_id ?? '') === splitFabricMasterId)
        .map((p: any) => String(p.pieceNumber || p.pieceNo || '').trim())
        .filter(Boolean)
    );
    return pieceSelectOptions.filter(o => validPieceNos.has(o.value));
  }, [splitFabricMasterId, pieceSelectOptions, pieceEntryList]);

  const splitChildInfoByPieceNo = useMemo(() => {
    const map = new Map<string, any>();
    const splits: any[] = Array.isArray(splitList) ? splitList : [];
    splits.forEach((it: any) => {
      const details: any[] = Array.isArray(it?.splitPiecesDetails) ? it.splitPiecesDetails : [];
      details.filter((d: any) => Number(d.operationId ?? d.operation_id ?? -1) === 0).forEach((d: any) => {
        map.set(String(d.pieceNo || '').trim().toLowerCase(), {
          loomId: it?.loomId ?? it?.loom_id,
          flangeId: it?.flangeId ?? it?.flange_id,
          flangeNo: resolveFlangeLabel(it),
          beamId: it?.beamId ?? it?.beam_id,
          beamNo: it?.beamNo ?? it?.beam_no,
          fabricMasterId: it?.fabricMasterId ?? it?.fabric_master_id,
          meter: d?.pieceMeter,
          weight: d?.netWeight,
        });
      });
    });
    return map;
  }, [splitList]);

  const lookupByPieceNo = (no: string) => {
    const n = String(no || '').trim().toLowerCase();
    const p = factoryPieces.find((x: any) => String(x.pieceNumber || x.pieceNo || '').trim().toLowerCase() === n);
    if (!p) {
      const s = splitChildInfoByPieceNo.get(n);
      if (!s) return null;
      const loomNo = loomNameById.get(String(s.loomId || ''));
      const flangeSource = flangeNoById.get(String(s.flangeId || ''));
      const flangeNo = flangeSource || s.flangeNo;
      const fabricLabel = fabricLabelById.get(String(s.fabricMasterId || ''));
      return { loomId: s.loomId, flangeId: s.flangeId, beamId: s.beamId, loomNo, beamNo: s.beamNo, flangeNo, fabricMasterId: s.fabricMasterId, fabricLabel, meter: s.meter != null ? String(s.meter) : '', weight: s.weight != null ? String(s.weight) : '' };
    }
    const baseBeamId = p.beamId ?? p.beam_id;
    const fromBeam = (baseBeamId != null && baseBeamId !== 0)
      ? (factoryPieces.find((x: any) => (x.beamId ?? x.beam_id) === baseBeamId) || p)
      : p;
    const loomId = (fromBeam.loomId ?? fromBeam.loom_id) ?? (p.loomId ?? p.loom_id);
    const flangeId = (fromBeam.flangeId ?? fromBeam.flange_id) ?? (p.flangeId ?? p.flange_id);
    const beamId = baseBeamId;
    const loomNo = loomNameById.get(String(loomId || ''));
    const beamNo = String(fromBeam.beamNo ?? p.beamNo ?? '').trim() || undefined;
    const flangeSource = flangeNoById.get(String(flangeId || ''));
    const fallbackFlangeNo = resolveFlangeLabel(fromBeam) || resolveFlangeLabel(p);
    const flangeNo = flangeSource || fallbackFlangeNo;
    const fabricMasterId = (fromBeam.fabricMasterId ?? fromBeam.fabric_master_id) ?? (p.fabricMasterId ?? p.fabric_master_id);
    const fabricLabel = fabricLabelById.get(String(fabricMasterId || ''));
    const meter = p.quantity ?? p.pieceMeter ?? p.inspectedMtr ?? '';
    const weight = p.netWeight ?? p.actualNetWeight ?? p.weight ?? '';
    return { loomId, flangeId, beamId, loomNo, beamNo, flangeNo, fabricMasterId, fabricLabel, meter: meter != null ? String(meter) : '', weight: weight != null ? String(weight) : '' };
  };

  const onSplitRowChange = (i: number, key: "sno" | "pieceNo" | "pieceMeter" | "netWeight", val: string) => {
    setSplitRows(prev => {
      const next = [...prev];
      const row = { ...next[i], [key]: val } as any;
      const m = parseFloat(row.pieceMeter || "0");
      const w = parseFloat(row.netWeight || "0");
      row.avgWt = m > 0 ? (w / m).toFixed(3) : "0";
      next[i] = row;
      return next;
    });
  };

  const onJoinRowChange = (i: number, key: "pieceNo" | "pieceMeter" | "netWeight" | "fabricMasterId", val: string) => {
    setJoinRows(prev => {
      if (key === "pieceNo") {
        const v = String(val || '').trim();
        const dup = v && prev.some((r, j) => j !== i && String(r.pieceNo || '').trim().toLowerCase() === v.toLowerCase());
        if (dup) {
          toast.error("Same Piece cant able to join");
          return prev;
        }
      }
      const next = [...prev];
      const row = { ...next[i], [key]: val } as any;
      if (key === "fabricMasterId") {
        row.pieceNo = "";
        row.pieceMeter = "";
        row.netWeight = "";
        row.avgWt = "0";
        next[i] = row;
        return next;
      }
      if (key === "pieceNo") {
        const info = lookupByPieceNo(val);
        if (info) {
          row.pieceMeter = info.meter || row.pieceMeter || "";
          row.netWeight = info.weight || row.netWeight || "";
          if (info.fabricMasterId) {
            row.fabricMasterId = String(info.fabricMasterId);
          }
        }
      }
      const m = parseFloat(row.pieceMeter || "0");
      const w = parseFloat(row.netWeight || "0");
      row.avgWt = m > 0 ? (w / m).toFixed(3) : "0";
      next[i] = row;
      return next;
    });
  };

  const addJoinRow = () => setJoinRows(prev => [...prev, { pieceNo: "", pieceMeter: "", netWeight: "", avgWt: "", fabricMasterId: "" }]);
  const removeJoinRow = (i: number) => setJoinRows(prev => prev.filter((_, ix) => ix !== i));

  const canSaveSplit = useMemo(() => {
    if (!splitPieceNo) return false;
    if (!splitRows.length) return false;
    return splitRows.every(r => r.pieceNo && r.pieceMeter !== "" && r.netWeight !== "");
  }, [splitPieceNo, splitRows]);

  const canSaveJoin = useMemo(() => {
    const count = joinRows.filter(r => r.pieceNo).length;
    return count >= 2;
  }, [joinRows]);

  useEffect(() => {
    if (!isEditMode) {
      setJoinedPieceNo(joinRows.map(r => r.pieceNo).filter(Boolean).join("-"));
    }
  }, [joinRows, isEditMode]);

  const findPieceIdByNo = (no: string) => {
  const entries: any[] = Array.isArray(pieceEntryList) ? (pieceEntryList as any) : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
  const p = entries.find((x: any) => String(x.pieceNumber || x.pieceNo || '').trim().toLowerCase() === String(no || '').trim().toLowerCase());
  return p?.id ?? 0;
};


  const ensureDocumentNumberForTab = async (tab: TabName): Promise<string | null> => {
  const existingNumber = tab === "SPLIT" ? splitDocumentNumber : joinDocumentNumber;
  if (existingNumber) return existingNumber;

  try {
    const result = await documentNumberService.generateDocumentNumber({
      screenName: DOCUMENT_SCREEN_NAME,
      tabName: tab,
    });
    const generatedNumber = result.documentNumber;
    if (!generatedNumber) return null;

    if (tab === "SPLIT") {
      setSplitDocumentNumber(generatedNumber);
    } else {
      setJoinDocumentNumber(generatedNumber);
    }

    hasGeneratedNumberRef.current[tab] = true;
    return generatedNumber;
  } catch (error) {
    console.error(`Failed to generate ${tab.toLowerCase()} document number`, error);
    toast.error(`Failed to generate ${tab === "SPLIT" ? "split" : "join"} document number`);
    return null;
  }
};

const buildSplitPayload = (documentNumber?: string) => {
  const srcInfo = lookupByPieceNo(splitPieceNo);
  const companyId = Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany")) || undefined;
  const parentSelectedPieceId = findPieceIdByNo(splitPieceNo);
  return {
    operationId: 1,
    modeId: 1,
    operationDate,
    companyId,
    parentPieceId: 0,
    parentPieceNo: splitPieceNo,
    parentPieceMeter: splitPieceMeter,
    loomId: srcInfo?.loomId,
    flangeId: srcInfo?.flangeId,
    flangeNo: srcInfo?.flangeNo,
    beamId: srcInfo?.beamId,
    beamNo: srcInfo?.beamNo,
    fabricMasterId: splitFabricMasterId ? Number(splitFabricMasterId) : srcInfo?.fabricMasterId,
    pieceSplitNo: documentNumber,
    noOfPieces: splitRows.length,
    splitPiecesDetails: splitRows.map(r => ({
      parentPieceId: parentSelectedPieceId,
      modeId: 1,
      operationId: 0,
      pieceNo: r.pieceNo,
      pieceMeter: r.pieceMeter,
      netWeight: r.netWeight,
      avgWt: r.avgWt
    })),
  };
};

const buildJoinPayload = (documentNumber?: string) => {
  const companyId = Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany")) || undefined;
  const firstPieceNo = (joinRows.find(r => r.pieceNo) || { pieceNo: "" }).pieceNo || "";
  const srcInfo = lookupByPieceNo(firstPieceNo);
  const totalJoinedMeter = joinRows.reduce((s, r) => s + (parseFloat(r.pieceMeter || "0") || 0), 0);
  const joinEntries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
  const firstPiece = firstPieceNo ? joinEntries.find((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase() === firstPieceNo.trim().toLowerCase()) : null;
  const resolvedFabricMasterId = firstPiece
    ? (firstPiece.fabricMasterId ?? firstPiece.fabric_master_id ?? srcInfo?.fabricMasterId)
    : srcInfo?.fabricMasterId;
  // const resolvedIsFactoryFabric = firstPiece != null
  //   ? Number(firstPiece.isFactoryFabric ?? firstPiece.is_factory_fabric ?? 1)
  //   : 1;
  return {
    operationId: 0,
    modeId: 2,
    operationDate,
    companyId,
    loomId: srcInfo?.loomId,
    flangeId: srcInfo?.flangeId,
    flangeNo: srcInfo?.flangeNo,
    beamId: srcInfo?.beamId,
    beamNo: srcInfo?.beamNo,
    // fabricMasterId: resolvedFabricMasterId,
    pieceJoinNo: documentNumber,
    joinedPieceId: 0,
    joinedPieceNo,
    joinedPieceMeter: String(totalJoinedMeter),
    // isFactoryFabric: resolvedIsFactoryFabric,
    joinPiecesDetails: joinRows.map(r => {
      const rowPiece = r.pieceNo ? joinEntries.find((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase() === r.pieceNo.trim().toLowerCase()) : null;
      const rowFabricMasterId = rowPiece ? (rowPiece.fabricMasterId ?? rowPiece.fabric_master_id ?? undefined) : undefined;
      return {
        joinedPieceId: findPieceIdByNo(r.pieceNo),
        modeId: 2,
        operationId: 2,
        beamId: srcInfo?.beamId,
        pieceNo: r.pieceNo,
        pieceMeter: r.pieceMeter,
        netWeight: r.netWeight,
        avgWt: r.avgWt,
        fabricMasterId: rowFabricMasterId,
      };
    }),
  };
};

  const saveSplit = async () => {
    if (!canSaveSplit) return;

    const entries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];
    for (const r of splitRows) {
      const exists = entries.some((x: any) => {
        const pieceNo = String(x.pieceNumber || x.pieceNo || "").trim().toLowerCase();
        const targetNo = String(r.pieceNo || "").trim().toLowerCase();
        if (pieceNo === targetNo) {
          if (isEditMode && editData?.splitPiecesDetails) {
            return !editData.splitPiecesDetails.some((d: any) => String(d.pieceNo || "").trim().toLowerCase() === targetNo);
          }
          return true;
        }
        return false;
      });
      if (exists) {
        toast.error("This Piece number already exists");
        return;
      }
    }

    const parent = parseFloat(splitPieceMeter || "0") || 0;
    const totalChild = splitRows.reduce((s, r) => s + (parseFloat(r.pieceMeter || "0") || 0), 0);
    if (Math.abs(totalChild - parent) > 0.0001) {
      toast.error("Piece Meter Mistmatch");
      return;
    }

    let documentNumber = splitDocumentNumber;
    if (!documentNumber && editData?.pieceSplitNo) {
      documentNumber = String(editData.pieceSplitNo);
    }
    if (!documentNumber) {
      const generatedNumber = await ensureDocumentNumberForTab("SPLIT");
      if (!generatedNumber) return;
      documentNumber = generatedNumber;
    }

    const payload = buildSplitPayload(documentNumber);
    // alert(JSON.stringify(payload));
    //   console.log("hddjjdjdjdjjdjdj"+JSON.stringify(payload));
    const companyId = Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany")) || undefined;
    isSavingRef.current = true;
    const dispatchPromise = isEditMode && editData?.id
      ? dispatch(updatePieceOperation({ id: editData.id, companyId, data: payload }))
      : dispatch(createPieceOperation(payload));

    if (!isEditMode || !editData?.id) {
      documentNumberService.clearMemoryCache(DOCUMENT_SCREEN_NAME, "SPLIT");
      hasGeneratedNumberRef.current.SPLIT = false;
    }

    dispatchPromise.finally(() => {
      isSavingRef.current = false;
    });

    const srcInfo = lookupByPieceNo(splitPieceNo);
    const startId = saved.length ? Math.max(...saved.map(s => s.id)) + 1 : 1;
    const rows: SavedRow[] = splitRows.map((r, idx) => {
      return {
        id: startId + idx,
        mode: "SPLIT",
        operationDate,
        pieceNo: r.pieceNo,
        pieceMeter: r.pieceMeter,
        netWeight: r.netWeight,
        avgWt: r.avgWt,
        loomNo: srcInfo?.loomNo,
        beamNo: srcInfo?.beamNo,
        flangeNo: srcInfo?.flangeNo,
        fabricLabel: srcInfo?.fabricLabel,
      };
    });
    if (editIndex != null) {
      const targetId = saved[editIndex]?.id;
      if (targetId != null && rows.length) rows[0].id = targetId;
      setSaved(prev => prev.map((x, i) => (i === editIndex ? rows[0] : x)));
      setEditIndex(null);
    } else {
      setSaved(prev => [...prev, ...rows]);
    }
    setSplitPieceNo("");
    setSplitCount(0);
    setSplitRows([]);
    navigate("/transaction/piece-split-join-details", { state: { tab: "SPLIT" } });
  };

  const saveJoin = async () => {
    if (!canSaveJoin) return;

    const entries: any[] = Array.isArray(pieceEntryList) ? pieceEntryList : Array.isArray((pieceEntryList as any)?.data) ? (pieceEntryList as any).data : [];

    const filledRows = joinRows.filter(r => r.pieceNo);
    const fabricLabels = filledRows.map(r => {
      const piece = entries.find((p: any) => String(p.pieceNumber || p.pieceNo || '').trim().toLowerCase() === r.pieceNo.trim().toLowerCase());
      const fid = piece ? String(piece.fabricMasterId ?? piece.fabric_master_id ?? '') : '';
      return fid ? (fabricLabelById.get(fid) || '') : '';
    });
    const uniqueLabels = new Set(fabricLabels.filter(Boolean));
    if (uniqueLabels.size > 1) {
      toast.error("Selected Pieces having different quality. Please choose same quality of pieces");
      return;
    }
    // alert(uniqueLabels.size);
    const targetJoinedNo = String(joinedPieceNo || "").trim().toLowerCase();
    const exists = entries.some((x: any) => {
      const pieceNo = String(x.pieceNumber || x.pieceNo || "").trim().toLowerCase();
      if (pieceNo === targetJoinedNo) {
        if (isEditMode && String(editData?.joinedPieceNo || "").trim().toLowerCase() === targetJoinedNo) {
          return false;
        }
        return true;
      }
      return false;
    });

    if (exists) {
      toast.error("This Piece number already exists");
      return;
    }

    let documentNumber = joinDocumentNumber;
    if (!documentNumber && editData?.pieceJoinNo) {
      documentNumber = String(editData.pieceJoinNo);
    }
    if (!documentNumber) {
      const generatedNumber = await ensureDocumentNumberForTab("JOIN");
      if (!generatedNumber) return;
      documentNumber = generatedNumber;
    }

    const payload = buildJoinPayload(documentNumber);
    const companyId = Number(localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany")) || undefined;
    isSavingRef.current = true;
    const dispatchPromise = isEditMode && editData?.id
      ? dispatch(updatePieceOperation({ id: editData.id, companyId, data: payload }))
      : dispatch(createPieceOperation(payload));

    if (!isEditMode || !editData?.id) {
      documentNumberService.clearMemoryCache(DOCUMENT_SCREEN_NAME, "JOIN");
      hasGeneratedNumberRef.current.JOIN = false;
    }

    dispatchPromise.finally(() => {
      isSavingRef.current = false;
    });

    const startId = saved.length ? Math.max(...saved.map(s => s.id)) + 1 : 1;
    const rows: SavedRow[] = joinRows.map((r, idx) => {
      const info = lookupByPieceNo(r.pieceNo || "");
      return {
        id: startId + idx,
        mode: "JOIN",
        operationDate,
        pieceNo: r.pieceNo,
        pieceMeter: r.pieceMeter || info?.meter || "",
        netWeight: r.netWeight || info?.weight || "",
        avgWt: r.avgWt || "0",
        loomNo: info?.loomNo,
        beamNo: info?.beamNo,
        flangeNo: info?.flangeNo,
        fabricLabel: info?.fabricLabel,
      };
    });
    if (editIndex != null) {
      const targetId = saved[editIndex]?.id;
      if (targetId != null && rows.length) rows[0].id = targetId;
      setSaved(prev => prev.map((x, i) => (i === editIndex ? rows[0] : x)));
      setEditIndex(null);
    } else {
      setSaved(prev => [...prev, ...rows]);
    }
    setJoinRows([{ pieceNo: "", pieceMeter: "", netWeight: "", avgWt: "", fabricMasterId: "" }]);
    navigate("/transaction/piece-split-join-details", { state: { tab: "JOIN" } });
  };

  const onEdit = (i: number) => {
    const it = saved[i];
    if (!it) return;
    setEditIndex(i);
    if (it.mode === "SPLIT") {
      setActiveTab("SPLIT");
      setOperationId(1);
      setSplitPieceNo(it.pieceNo);
      setSplitCount(1);
      setSplitRows([{ sno: gatingSnoOptions[0], pieceNo: it.pieceNo, pieceMeter: it.pieceMeter, netWeight: it.netWeight, avgWt: it.avgWt }]);
    } else {
      setActiveTab("JOIN");
      setOperationId(0);
      setJoinRows([{
        pieceNo: it.pieceNo, pieceMeter: it.pieceMeter, netWeight: it.netWeight, avgWt: it.avgWt,
        fabricMasterId: ""
      }]);
    }
  };

  const onDelete = (i: number) => setSaved(prev => prev.filter((_, ix) => ix !== i));

  return (
    <div className="p-6 pt-16 space-y-6 mt-5">
      {/* <h1 className="text-2xl font-semibold">Piece Split/Join</h1> */}
   <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate("/transaction/piece-split-join-details")}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold mb-4">{isEditMode ? 'Edit' : 'Add'} Piece Split/Join</h1>
      </div>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Add / Edit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1">Mode</label>
              <CommonSearchableSelect
                className="w-full"
                placeholder="Select Mode"
                options={MODE_OPTIONS}
                value={String(modeId)}
                onValueChange={(value) => {
                  const v = Number(value);
                  setModeId(v);
                  setActiveTab(v === 1 ? "SPLIT" : "JOIN");
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input type="date" value={operationDate} onChange={e => setOperationDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
            </div>
          </div>

          {modeId === 1 && (
            <>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm mb-1">Sort No - Construction</label>
                  <CommonSearchableSelect
                    className="w-full"
                    placeholder="Select Sort No - Construction"
                    options={fabricCodeOptions}
                    value={splitFabricMasterId || ''}
                    onValueChange={(value) => {
                      setSplitFabricMasterId(value);
                      setSplitPieceNo("");
                    }}
                    disabled={isEditMode}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Piece No<span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    className="w-full"
                    placeholder="Select Piece"
                    options={(splitPieceNo && !splitFilteredPieceOptions.some(o => o.value === splitPieceNo))
                      ? [{ value: splitPieceNo, label: splitPieceNo }, ...splitFilteredPieceOptions]
                      : splitFilteredPieceOptions}
                    value={splitPieceNo || ''}
                    onValueChange={(value) => setSplitPieceNo(value)}
                    disabled={isEditMode}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">No of Pieces<span className="text-red-500">*</span></label>
                  <input type="number" min={0} value={splitCount || ""} onChange={e => setSplitCount(Number(e.target.value || 0))} disabled={isEditMode} className="border border-gray-300 rounded px-2 py-1 w-full" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Piece Meter</label>
                  <input type="number" min={0} value={splitPieceMeter} onChange={e => setSplitPieceMeter(e.target.value)} disabled={isEditMode} className="border border-gray-300 rounded px-2 py-1 w-full" />
                </div>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">S.No</th>
                      <th className="border p-2">Piece No<span className="text-red-500">*</span></th>
                      <th className="border p-2">Piece Meter<span className="text-red-500">*</span></th>
                      <th className="border p-2">Net Weight<span className="text-red-500">*</span></th>
                      <th className="border p-2">Avg Wt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splitRows.map((r, idx) => (
                      <tr key={idx} className="border">
                        <td className="border p-2">{idx + 1}</td>
                        <td className="border p-2"><input value={r.pieceNo} onChange={e => onSplitRowChange(idx, "pieceNo", e.target.value)} readOnly={isEditMode} className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50" /></td>
                        <td className="border p-2"><input type="number" value={r.pieceMeter} onChange={e => onSplitRowChange(idx, "pieceMeter", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" /></td>
                        <td className="border p-2"><input type="number" value={r.netWeight} onChange={e => onSplitRowChange(idx, "netWeight", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" /></td>
                        <td className="border p-2"><input value={r.avgWt} readOnly className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50" /></td>
                      </tr>
                    ))}
                    {splitRows.length === 0 && (
                      <tr>
                        <td className="border p-2 text-gray-500" colSpan={5}>No rows</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-4">
                <button onClick={saveSplit} disabled={!canSaveSplit} className={`px-4 py-2 rounded text-white ${canSaveSplit ? "bg-primary" : "bg-gray-400"}`}>{isEditMode && modeId === 1 ? "Update" : "Save"}</button>
              </div>
            </>
          )}

          {modeId === 2 && (
            <>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm mb-1">Joined Piece No</label>
                  <input value={joinedPieceNo} onChange={e => setJoinedPieceNo(e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" />
                </div>
              </div>
              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse border border-gray-300 text-center">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">S.No</th>
                      <th className="border p-2">Piece No<span className="text-red-500">*</span></th>
                      <th className="border p-2">Sort No - Construction</th>
                      <th className="border p-2">Piece Meter</th>
                      <th className="border p-2">Net Weight</th>
                      <th className="border p-2">Avg Wt</th>
                      <th className="border p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {joinRows.map((r, idx) => {
                      const filteredJoinPieceOptions = pieceOptions
                        .filter(p => {
                          if (r.fabricMasterId) {
                            const info = lookupByPieceNo(p);
                            const fid = info?.fabricMasterId ? String(info.fabricMasterId) : '';
                            if (fid !== r.fabricMasterId) return false;
                          }
                          return p === r.pieceNo || !joinRows.some((jr, jdx) => jdx !== idx && jr.pieceNo === p);
                        })
                        .map(p => ({ value: p, label: p }));
                      const joinOptions = (r.pieceNo && !filteredJoinPieceOptions.some(o => o.value === r.pieceNo))
                        ? [{ value: r.pieceNo, label: r.pieceNo }, ...filteredJoinPieceOptions]
                        : filteredJoinPieceOptions;
                      return (
                        <tr key={idx} className="border">
                          <td className="border p-2">{idx + 1}</td>
                          <td className="border p-2">
                            <CommonSearchableSelect
                              className="w-full"
                              placeholder="Select Piece"
                              options={joinOptions}
                              value={r.pieceNo || ''}
                              onValueChange={(value) => onJoinRowChange(idx, "pieceNo", value)}
                            />
                          </td>
                          <td className="border p-2">
                            <CommonSearchableSelect
                              className="w-full"
                              placeholder="Sort No - Construction"
                              options={fabricCodeOptions}
                              value={r.fabricMasterId || ''}
                              onValueChange={(value) => onJoinRowChange(idx, "fabricMasterId", value)}
                            />
                          </td>
                          <td className="border p-2"><input type="number" value={r.pieceMeter} onChange={e => onJoinRowChange(idx, "pieceMeter", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" /></td>
                          <td className="border p-2"><input type="number" value={r.netWeight} onChange={e => onJoinRowChange(idx, "netWeight", e.target.value)} className="border border-gray-300 rounded px-2 py-1 w-full" /></td>
                          <td className="border p-2"><input value={r.avgWt} readOnly className="border border-gray-300 rounded px-2 py-1 w-full bg-gray-50" /></td>
                          <td className="border p-2 space-x-2">
                            <button onClick={() => addJoinRow()} className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded"><Plus size={16} /></button>
                            {joinRows.length > 1 && (
                              <button onClick={() => removeJoinRow(idx)} className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded"><Minus size={16} /></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={saveJoin} disabled={!canSaveJoin} className={`px-4 py-2 rounded text-white ${canSaveJoin ? "bg-primary" : "bg-gray-400"}`}>{isEditMode && modeId === 2 ? "Update" : "Join"}</button>
              </div>
            </>
          )}
        </CardContent>
      </Card>


    </div>
  );
}

export const TAB_NAMES = ["SPLIT", "JOIN"];
