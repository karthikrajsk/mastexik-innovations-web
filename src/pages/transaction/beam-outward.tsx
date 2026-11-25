// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Trash2 } from "lucide-react";
// import { toast } from "react-toastify";
// import { documentNumberService } from "@/services/DocumentNumberService";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllSizingPlan } from "@/state/sizingPlanSlice";
// import { getAllBeamInward } from "@/state/beamInwardSlice";
// import { getAllWeavingContract } from "@/state/weavingContractSlice";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { getAllWeavingJobWorkOrders } from "@/state/weavingJobWorkOrderSlice";
// import { getAllCompanies } from "@/state/company-master-slice";
// import { getAllTransports } from "@/state/transportSlice";
// import { createBeamOutward, getAllBeamOutward, getBeamOutwardByBeamInwardId, updateBeamOutward } from "@/state/beamOutwardSlice";
// import { getAllFlanges } from "@/state/flangeSlice";
// import { getAllSalesReturn } from "@/state/salesReturnSlice";
// import { AppDispatch, RootState } from "@/state/store";
// import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
// import { set, useForm } from "react-hook-form";
// import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
// import { resolveVendorTypeId, VENDOR_TYPE_ALL } from "@/utils/vendorFilters";

// interface BeamLineItem {
//   key: string | number;
//   outwardNo: string;
//   detailId?: number;
//   weavingContractId?: number | null;
//   weavingVendorId?: number | null;
//   salesOrderId?: number | null;
//   fabricMasterId?: number | null;
//   flangeId?: number | null;
//   sizedBeamNo?: string;
//   flangeNo?: string;
//   beamMeters: number;
//   width: number;
//   shrinkage: number;
//   expectedFabricMeter: number;
//   weaverName?: string;
//   weavingContractNo?: string;
//   salesOrderNo?: string;
//   totalEndsBase?: number | null;
//   totalEnds?: number | null;
//   isReturn?: number;
//   isBeamGated?: number;
// }

// const toArray = (value: any) => {
//   if (Array.isArray(value)) return value;
//   if (Array.isArray(value?.data)) return value.data;
//   if (Array.isArray(value?.rows)) return value.rows;
//   return [];
// };

// const calculateExpected = (beamMeters: number, width: number, shrinkage: number) => {
//   const base = Number(beamMeters || 0) * Number(width || 0);
//   const shrink = Number(shrinkage || 0) / 100;
//   const result = base - base * shrink;
//   if (!isFinite(result)) return 0;
//   return Number(result.toFixed(2));
// };

// const computeLineTotalEnds = (base?: number | null, width?: number | null) => {
//   if (base == null || !Number.isFinite(base)) {
//     return null;
//   }
//   if (width == null || !Number.isFinite(width) || width <= 0) {
//     return Number(base.toFixed(2));
//   }
//   const total = base * width;
//   return Number.isFinite(total) ? Number(total.toFixed(2)) : null;
// };

// const resolveLineBaseTotalEnds = (detail: any, width?: number | null) => {
//   const candidates = [
//     detail?.totalEndsBase,
//     detail?.totalEndsPerUnit,
//     detail?.warpEnds,
//     detail?.actualWarpEnds,
//     detail?.sordEnds,
//   ];
//   for (const candidate of candidates) {
//     const numeric = Number(candidate);
//     if (Number.isFinite(numeric) && numeric > 0) {
//       return numeric;
//     }
//   }
//   const total = Number(detail?.totalEnds);
//   if (Number.isFinite(total) && width && width > 0) {
//     const derived = total / width;
//     return Number.isFinite(derived) ? derived : null;
//   }
//   return null;
// };

// const deriveLineBaseFromItem = (item: BeamLineItem) => {
//   if (item.totalEndsBase != null && Number.isFinite(item.totalEndsBase)) {
//     return item.totalEndsBase;
//   }
//   if (item.totalEnds != null && Number.isFinite(item.totalEnds) && item.width) {
//     const derived = item.totalEnds / item.width;
//     if (Number.isFinite(derived)) {
//       return derived;
//     }
//   }
//   return null;
// };

// /** Collect sales order ids referenced from a weaving contract (list from weavingContractSlice). */
// const collectSalesOrderIdsFromWeavingContract = (contract: any): Set<string> => {
//   const ids = new Set<string>();
//   if (!contract) return ids;
//   [
//     contract.salesOrderId,
//     contract.sales_order_id,
//     contract.salesOrderNo,
//     contract.sales_order_no,
//   ].forEach((v: any) => {
//     if (v != null && v !== "") ids.add(String(v));
//   });
//   const orderDetails = contract.orderDetails || contract.order_details || [];
//   if (Array.isArray(orderDetails)) {
//     orderDetails.forEach((d: any) => {
//       const sid = d?.salesOrderId ?? d?.sales_order_id ?? d?.salesOrderNo ?? d?.sales_order_no;
//       if (sid != null && sid !== "") ids.add(String(sid));
//     });
//   }
//   return ids;
// };

// const filterSalesOrdersByWeavingContract = (
//   contractId: number | null | undefined,
//   contracts: any[],
//   orders: any[]
// ) => {
//   if (contractId == null) return orders;
//   const contract = contracts.find((c: any) => String(c?.id) === String(contractId));
//   if (!contract) return [];
//   const linked = collectSalesOrderIdsFromWeavingContract(contract);
//   if (linked.size > 0) {
//     return orders.filter((so: any) => linked.has(String(so?.id)));
//   }
//   return orders.filter(
//     (so: any) =>
//       String(so?.weavingContractId ?? so?.weaving_contract_id ?? "") === String(contractId)
//   );
// };


// const SIZING_VENDOR_TYPE_ID = 302;
// const SIZING_VENDOR_TYPE_IDS = [SIZING_VENDOR_TYPE_ID, VENDOR_TYPE_ALL];
// const WEAVING_VENDOR_TYPE_IDS = [303, 307];

// export default function BeamOutwardEntry() {
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const editRecord = (location.state as any)?.beamOutwardEdit;
//   const isEditMode = Boolean(editRecord);

//   const { vendorList } = useSelector((state: RootState) => state.vendor as any);
//   const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
//   const { beamInwardList } = useSelector((state: RootState) => state.beamInward as any);
//   const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts as any);
//   const { salesOrderList } = useSelector((state: RootState) => state.salesOrder as any);
//   const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
//   const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
//   const { beamOutwardList } = useSelector((state: RootState) => state.beamOutward as any);
//   const { transportList } = useSelector((state: RootState) => state.transport as any);
//   const { flangeList } = useSelector((state: RootState) => state.flange as any);
//   const { salesReturnList } = useSelector((state: RootState) => state.salesReturn as any);

//   const [companyId, setCompanyId] = useState<number | null>(null);
//   // const [outwardNo, setOutwardNo] = useState("");
//   const [outwardDate, setOutwardDate] = useState(new Date().toISOString().slice(0, 10));
//   // const [isOutwardNoLoading, setIsOutwardNoLoading] = useState(false);
//   const [selectedVendorId, setSelectedVendorId] = useState("");
//   const [selectedPlanId, setSelectedPlanId] = useState("");
//   const [selectedBeamInwardId, setSelectedBeamInwardId] = useState("");
//   const [selectedSalesReturnId, setSelectedSalesReturnId] = useState("");
//   const [lineItems, setLineItems] = useState<BeamLineItem[]>([]);
//   const [transportId, setTransportId] = useState("");
//   const [vehicleNo, setVehicleNo] = useState("");
//   const [remarks, setremarks] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [editInitialized, setEditInitialized] = useState(false);
//   const [editLinesHydrated, setEditLinesHydrated] = useState(false);

//   // const initialDraftOutwardNo = useMemo(() => {
//   //   if (editRecord?.outwardNo) {
//   //     return editRecord.outwardNo;
//   //   }
//   //   return getDraftOutwardNo();
//   // }, [editRecord?.outwardNo]);
//   const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BeamLineItem>();

//   // const hasGeneratedOutwardNoRef = useRef(Boolean(initialDraftOutwardNo && !editRecord?.outwardNo));
//   const isSavingRef = useRef(false);
//   const hasGeneratedNumberRef = useRef(false);


//   const vendorOptions = useMemo(() => toArray(vendorList), [vendorList]);
//   const activeVendorOptions = useMemo(() => vendorOptions.filter((v: any) => v.isActive !== false && v.activeFlag !== false), [vendorOptions]);
//   const planOptions = useMemo(() => toArray(sizingPlanList), [sizingPlanList]);
//   const activePlanOptions = useMemo(() => planOptions.filter((p: any) => p.isActive !== false && p.activeFlag !== false), [planOptions]);
//   const beamInwardOptions = useMemo(() => toArray(beamInwardList), [beamInwardList]);
//   const weavingContracts = useMemo(() => toArray(weavingContractList), [weavingContractList]);
//   const salesOrders = useMemo(() => toArray(salesOrderList), [salesOrderList]);
//   const companies = useMemo(() => toArray(companyMasterList), [companyMasterList]);
//   const weavingOrders = useMemo(() => toArray(weavingJobWorkOrderList), [weavingJobWorkOrderList]);
//   const outwardRecords = useMemo(() => toArray(beamOutwardList), [beamOutwardList]);
//   const activeTransportList = useMemo(() => toArray(transportList).filter((t: any) => t.isActive !== false && t.activeFlag !== false), [transportList]);
//   const flangeOptions = useMemo(() => toArray(flangeList), [flangeList]);
//   const issuedFlangeOptions = useMemo(
//     () =>
//       flangeOptions.filter(
//         (f: any) =>
//           Number(f?.isIssued ?? f?.is_issued ?? 0) === 1 &&
//           (companyId == null || Number(f?.companyId ?? f?.company_id) === companyId)
//       ),
//     [flangeOptions, companyId]
//   );
//   const flangeMap = useMemo(() => {
//     const map = new Map<number, string>();
//     flangeOptions.forEach((f: any) => {
//       if (f?.id != null && f?.flangeNo) {
//         map.set(Number(f.id), String(f.flangeNo));
//       }
//     });
//     return map;
//   }, [flangeOptions]);

//   const salesReturns = useMemo(() => toArray(salesReturnList), [salesReturnList]);

//   const availableSalesReturns = useMemo(() => {
//     if (!selectedPlanId) return [];
//     const plan = activePlanOptions.find((p: any) => String(p?.id) === selectedPlanId);
//     const planNo = (plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || "").trim();
//     return salesReturns.filter((sr: any) => {
//       const srPlanNo = (sr?.sizingPlanNo || "").trim();
//       const srPlanId = sr?.sizingPlanId;
//       const planNoMatch = planNo !== "" && srPlanNo !== "" && srPlanNo === planNo;
//       const planIdMatch = srPlanId != null && Number(srPlanId) > 0 && String(srPlanId) === selectedPlanId;
//       const beamItemsPlanMatch = planNo !== "" && Array.isArray(sr?.beamItems) &&
//         sr.beamItems.some((bi: any) => (bi?.sizingPlanNo || "").trim() === planNo);
//       if (!planNoMatch && !planIdMatch && !beamItemsPlanMatch) return false;
//       return Array.isArray(sr?.beamItems) && sr.beamItems.some((bi: any) => Number(bi?.isReturn ?? 0) === 0);
//     });
//   }, [salesReturns, selectedPlanId, activePlanOptions]);

//   const selectedInwardSourceValue = selectedSalesReturnId
//     ? `sr:${selectedSalesReturnId}`
//     : selectedBeamInwardId
//       ? `bi:${selectedBeamInwardId}`
//       : "";

//   const weaverVendorOptions = useMemo(() => {
//     return activeVendorOptions.filter((v: any) => {
//       const typeId = resolveVendorTypeId(v);
//       return typeId != null && WEAVING_VENDOR_TYPE_IDS.includes(typeId);
//     });
//   }, [activeVendorOptions]);

//   const availablePlans = useMemo(() => {
//     if (!selectedVendorId) return activePlanOptions;
//     return activePlanOptions.filter((plan: any) => String(plan?.sizingVendorId ?? plan?.vendorId) === selectedVendorId);
//   }, [activePlanOptions, selectedVendorId]);

//   // const availableBeamInwards = useMemo(() => {
//   //   return beamInwardOptions.filter((beam: any) => {
//   //     // Check if this beam has been returned or issued to weaving in any outward record
//   //     const isUnavailable = outwardRecords.some((outward: any) => {
//   //       // Exclude the current record being edited from the unavailability check
//   //       if (isEditMode) {
//   //         const editId = editRecord?.id;
//   //         const currentOutwardId = outward?.id;
//   //         if (editId != null && currentOutwardId != null && String(editId) === String(currentOutwardId)) {
//   //           return false;
//   //         }
//   //         const editNo = editRecord?.outwardNo || editRecord?.beamOutwardNo;
//   //         const currentOutwardNo = outward?.outwardNo || outward?.beamOutwardNo;
//   //         if (editNo && currentOutwardNo && String(editNo) === String(currentOutwardNo)) {
//   //           return false;
//   //         }
//   //       }

//   //       const biNo = outward.beamInwardNo || outward.beam_inward_no;
//   //       const targetBiNo = beam.beamInwardNo || beam.beam_inward_no || beam.documentNo || beam.loanNo;

//   //       const biId = outward.beamInwardId;
//   //       const targetBiId = beam.id;

//   //       const isMatch = (biId != null && targetBiId != null && String(biId) === String(targetBiId)) ||
//   //         (String(biNo) === String(targetBiNo));

//   //       if (!isMatch) return false;

//   //       // Condition 1: Is returned
//   //       if (Number(outward.isReturn) === 1) return true;

//   //       // Condition 2: Is issued to weaving (checked in details)
//   //       const hasIssuedDetail = Array.isArray(outward.outwardDetails) &&
//   //         outward.outwardDetails.some((d: any) => Number(d.isIssuedToWeaving) === 1);

//   //       return hasIssuedDetail;
//   //     });

//   //     if (isUnavailable) return false;

//   //     // Filter out beam inwards that have all beams already outwarded (unless in edit mode)
//   //     if (!isEditMode && Array.isArray(beam?.beamInwardBeamDetails)) {
//   //       const hasAvailableBeams = beam.beamInwardBeamDetails.some(
//   //         (d: any) => Number(d?.isBeamOutwarded || 0) === 0
//   //       );
//   //       if (!hasAvailableBeams) return false;
//   //     }

//   //     // In edit mode, if this beam is the one already selected, always include it
//   //     if (isEditMode && selectedBeamInwardId && String(beam?.id) === String(selectedBeamInwardId)) {
//   //       return true;
//   //     }

//   //     const planMatch = !selectedPlanId || String(beam?.sizingPlanId ?? beam?.planId) === selectedPlanId;
//   //     const vendorMatch = !selectedVendorId || String(beam?.sizingVendorId ?? beam?.vendorId) === selectedVendorId;
//   //     return planMatch && vendorMatch;
//   //   });
//   // }, [beamInwardOptions, selectedPlanId, selectedVendorId, outwardRecords, isEditMode, editRecord, selectedBeamInwardId]);

//   const availableBeamInwards = useMemo(() => {
//     return beamInwardOptions.filter((beam: any) => {
//       const planMatch =
//         !selectedPlanId || String(beam?.sizingPlanId ?? beam?.planId) === selectedPlanId;
//       const vendorMatch =
//         !selectedVendorId || String(beam?.sizingVendorId ?? beam?.vendorId) === selectedVendorId;
//       return planMatch && vendorMatch;
//     });
//   }, [beamInwardOptions, selectedPlanId, selectedVendorId]);

//   const selectedPlan = useMemo(() => {
//     const fromAvailable = availablePlans.find((plan: any) => String(plan?.id) === selectedPlanId);
//     if (fromAvailable) return fromAvailable;
//     return activePlanOptions.find((plan: any) => String(plan?.id) === selectedPlanId);
//   }, [availablePlans, activePlanOptions, selectedPlanId]);

//   const selectedBeamInward = useMemo(() => {
//     const fromAvailable = availableBeamInwards.find((beam: any) => String(beam?.id) === selectedBeamInwardId);
//     if (fromAvailable) return fromAvailable;
//     return beamInwardOptions.find((beam: any) => String(beam?.id) === selectedBeamInwardId);
//   }, [availableBeamInwards, beamInwardOptions, selectedBeamInwardId]);

//   const defaultOrderTypeId = useMemo(() => {
//     const candidate = editRecord?.orderTypeId ?? 2;
//     const numeric = Number(candidate);
//     return Number.isFinite(numeric) ? numeric : 2;
//   }, [editRecord]);

//   const derivedOrderTypeId = useMemo(() => {
//     const candidate = selectedBeamInward?.orderTypeId ?? selectedPlan?.orderTypeId;
//     if (candidate != null) {
//       const numeric = Number(candidate);
//       if (Number.isFinite(numeric)) {
//         return numeric;
//       }
//     }
//     return defaultOrderTypeId;
//   }, [selectedBeamInward, selectedPlan, defaultOrderTypeId]);

//   const sizingVendorOptions = useMemo(() => {
//     const base = Array.isArray(activeVendorOptions) ? activeVendorOptions : [];
//     const isSizingOrAll = (v: any) => {
//       if (!v) return false;
//       const typeId = resolveVendorTypeId(v);
//       if (typeId != null && SIZING_VENDOR_TYPE_IDS.includes(typeId)) {
//         return true;
//       }
//       const label = String(v?.VENDOR_TYPE_AL || v?.vendorType || v?.vendorTypeName || "").toLowerCase();
//       return label.includes("all") || label.includes("sizing");
//     };
//     if (derivedOrderTypeId === 1) {
//       return base.filter(vendor => (Number(vendor?.isInternalVendor) === 1 || isSizingOrAll(vendor)));
//     }
//     if (derivedOrderTypeId === 2) {
//       return base.filter(vendor => (Number(vendor?.isInternalVendor) === 0 || isSizingOrAll(vendor)));
//     }
//     return base;
//   }, [activeVendorOptions, derivedOrderTypeId]);

//   const isSelectedVendorInternal = useMemo(() => {
//     if (!selectedVendorId) return false;
//     const vendor = vendorOptions.find((v: any) => String(v?.id) === selectedVendorId);
//     return Number(vendor?.isInternalVendor) === 1;
//   }, [vendorOptions, selectedVendorId]);

//   const workOrderByContractMap = useMemo(() => {
//     const map = new Map<string, number>();
//     weavingOrders.forEach((order: any) => {
//       const contractId = order?.weavingContractId ?? order?.contractId ?? order?.weavingContract?.id;
//       if (contractId != null && order?.id != null) {
//         map.set(String(contractId), Number(order.id));
//       }
//     });
//     return map;
//   }, [weavingOrders]);

//   const companyNameMap = useMemo(() => {
//     const map = new Map<string, number>();
//     companies.forEach((company: any) => {
//       if (company?.id != null) {
//         const name = (company?.companyName || company?.name || "").toString().trim().toLowerCase();
//         if (name) {
//           map.set(name, Number(company.id));
//         }
//       }
//     });
//     return map;
//   }, [companies]);

//   const mapSavedOutwardDetails = useCallback(
//     (records: any[]): BeamLineItem[] => {
//       if (!Array.isArray(records) || !records.length) return [];
//       return records.flatMap((record: any, recordIdx: number) => {
//         const details = Array.isArray(record?.outwardDetails) && record.outwardDetails.length
//           ? record.outwardDetails
//           : [record];
//         return details.map((detail: any, detailIdx: number) => {
//           const weaverId = detail?.weavingVendorId ?? record?.weavingVendorId ?? record?.vendorId ?? null;
//           const contractId = detail?.weavingContractId ?? record?.weavingContractId ?? null;
//           const salesOrderId = detail?.salesOrderId ?? record?.salesOrderId ?? null;
//           const weaver = vendorOptions.find((v: any) => String(v?.id) === String(weaverId));
//           const contract = weavingContracts.find((wc: any) => String(wc?.id) === String(contractId));
//           const salesOrder = salesOrders.find((s: any) => String(s?.id) === String(salesOrderId));

//           const beamInward = beamInwardOptions.find(
//             (b: any) => String(b?.id) === String(record?.beamInwardId)
//           );
//           const beamInwardBeamDetails = Array.isArray(beamInward?.beamInwardBeamDetails)
//             ? beamInward.beamInwardBeamDetails
//             : [];
//           const matchingBeamDetail =
//             beamInwardBeamDetails.find(
//               (bd: any) =>
//                 detail?.sizedBeamNo &&
//                 String(bd?.sizedBeamNo) === String(detail.sizedBeamNo)
//             ) ??
//             beamInwardBeamDetails.find(
//               (bd: any) =>
//                 String(bd?.id) === String(detail?.beamInwardDetailId ?? detail?.beamDetailId)
//             );
//           const beamMeters = Number(
//             matchingBeamDetail?.wrapMeters ??
//             detail?.wrapMeters ??
//             detail?.beamMeters ??
//             record?.wrapMeters ??
//             record?.beamMeters ??
//             0
//           );
//           const width =
//             Number(
//               detail?.fabricPanelWidth ??
//               detail?.width ??
//               record?.fabricPanelWidth ??
//               record?.width ??
//               1
//             ) || 1;
//           const shrinkage = Number(detail?.shrinkage ?? record?.shrinkage ?? 0);
//           const savedTotalEnds = detail?.totalEnds ?? record?.totalEnds;
//           const totalEndsBase = savedTotalEnds ?? resolveLineBaseTotalEnds(detail, width);
//           const totalEnds = savedTotalEnds ?? computeLineTotalEnds(totalEndsBase, width);
//           return {
//             key: `${record?.id ?? "saved"}-${detail?.id ?? detailIdx}-${recordIdx}`,
//             detailId: detail?.id ?? detail?.detailId ?? record?.detailId ?? null,
//             weavingContractId: contractId ?? null,
//             weavingVendorId: weaverId ?? null,
//             salesOrderId: salesOrderId ?? null,
//             fabricMasterId: detail?.fabricMasterId ?? record?.fabricMasterId ?? null,
//             flangeId:
//               detail?.flangeId != null
//                 ? Number(detail.flangeId)
//                 : record?.flangeId != null
//                   ? Number(record.flangeId)
//                   : null,
//             sizedBeamNo: detail?.sizedBeamNo ?? record?.sizedBeamNo ?? "",
//             flangeNo: (() => {
//               const raw = detail?.flangeNo ?? record?.flangeNo ?? "";
//               if (raw) return raw;
//               const fId = detail?.flangeId != null ? Number(detail.flangeId) : record?.flangeId != null ? Number(record.flangeId) : null;
//               return fId != null ? (flangeMap.get(fId) ?? "") : "";
//             })(),
//             beamMeters,
//             width,
//             shrinkage,
//             expectedFabricMeter: Number(detail?.expectedFabricMeter ?? calculateExpected(beamMeters, width, shrinkage)),
//             weaverName: weaver?.vendorName || weaver?.name || "",

//             weavingContractNo:
//               contract?.weavingContractNo ||
//               contract?.contractNo ||
//               contract?.wcNo ||
//               contract?.weavingContractNumber ||
//               (contractId != null ? String(contractId) : ""),
//             salesOrderNo:
//               salesOrder?.salesOrderNo ||
//               salesOrder?.salesOrderNumber ||
//               salesOrder?.orderNo ||
//               (salesOrderId != null ? String(salesOrderId) : ""),
//             totalEndsBase,
//             totalEnds,
//             isReturn: Number(detail?.isReturn ?? record?.isReturn ?? 0),
//             isBeamGated: Number(matchingBeamDetail?.isBeamGated ?? detail?.isBeamGated ?? 0),
//           } as BeamLineItem;
//         });
//       });
//     },
//     [vendorOptions, weavingContracts, salesOrders, flangeMap, beamInwardOptions]
//   );

//   const mapBeamInwardDetails = useCallback(
//     ({ beam, plan, includeOutwarded = false }: { beam: any; plan?: any; includeOutwarded?: boolean }): BeamLineItem[] => {
//       if (!beam) return [];
//       const resolvedPlan =
//         plan ??
//         planOptions.find((candidate: any) =>
//           String(candidate?.id) === String(beam?.sizingPlanId ?? beam?.planId)
//         );
//       const planQualities = Array.isArray(resolvedPlan?.sizingQualityDetails)
//         ? resolvedPlan.sizingQualityDetails
//         : [];
//       const beamQualities = Array.isArray(beam?.beamInwardQualityDetails)
//         ? beam.beamInwardQualityDetails
//         : [];
//       const details = Array.isArray(beam?.beamInwardBeamDetails) ? beam.beamInwardBeamDetails : [];
//       return details
//         .filter((detail: any) =>
//           !String(detail?.sizedBeamNo || "").endsWith('-R') &&
//           (includeOutwarded ||
//           (Number(detail?.isBeamOutwarded || 0) === 0 && Number(detail?.isReturn || 0) === 0))
//         )
//         .map((detail: any, idx: number) => {
//           const weaverId = detail?.weavingVendorId ?? detail?.vendorId;
//           const weaver = vendorOptions.find((v: any) => String(v?.id) === String(weaverId));
//           const contract = weavingContracts.find((wc: any) => String(wc?.id) === String(detail?.weavingContractId));
//           const salesOrder = salesOrders.find((s: any) => String(s?.id) === String(detail?.salesOrderId));
//           const fabricId = detail?.fabricId ?? detail?.fabricCodeId ?? detail?.fabricMasterId;
//           const fabricMatch = planQualities.find((q: any) => {
//             const planFabricId = q?.fabricId ?? q?.fabricCodeId ?? q?.fabricMasterId;
//             return planFabricId != null && fabricId != null && String(planFabricId) === String(fabricId);
//           });
//           const beamQualityMatch = beamQualities.find((q: any) => {
//             const beamFabricId = q?.fabricId ?? q?.fabricCodeId ?? q?.fabricMasterId;
//             if (beamFabricId != null && fabricId != null && String(beamFabricId) === String(fabricId)) {
//               return true;
//             }
//             return false;
//           }) ?? beamQualities[0];
//           const fabricMasterIdRaw =
//             fabricMatch?.fabricMasterId ??
//             fabricMatch?.fabricId ??
//             detail?.fabricMasterId ??
//             detail?.fabricId ??
//             detail?.fabricCodeId ??
//             null;
//           const fabricMasterId = fabricMasterIdRaw != null ? Number(fabricMasterIdRaw) : null;
//           const width =
//             Number(
//               detail?.fabricPanelWidth ??
//               fabricMatch?.fabricPanelWidth ??
//               planQualities?.[0]?.fabricPanelWidth ??
//               resolvedPlan?.fabricPanelWidth ??
//               1
//             ) || 1;
//           const beamMeters = Number(detail?.wrapMeters ?? detail?.beamMeters ?? 0);
//           const shrinkage = Number(detail?.shrinkage ?? resolvedPlan?.shrinkage ?? beam?.shrinkage ?? 0);
//           const totalEndsBase = beamQualityMatch?.totalEnds ?? resolveLineBaseTotalEnds(detail, width);
//           const totalEnds = computeLineTotalEnds(totalEndsBase, width);
//           return {
//             key: detail?.id ?? `${detail?.sizedBeamNo ?? "row"}-${idx}`,
//             detailId: detail?.id,
//             weavingContractId: detail?.weavingContractId ?? null,
//             weavingVendorId: weaverId ?? null,
//             salesOrderId: detail?.salesOrderId ?? null,
//             fabricMasterId,
//             flangeId: detail?.flangeId != null ? Number(detail.flangeId) : null,
//             sizedBeamNo: detail?.sizedBeamNo ?? "",
//             flangeNo: detail?.flangeNo || (detail?.flangeId != null ? (flangeMap.get(Number(detail.flangeId)) ?? "") : ""),
//             beamMeters,
//             width,
//             shrinkage,
//             expectedFabricMeter: calculateExpected(beamMeters, width, shrinkage),
//             weaverName: weaver?.vendorName || "",
//             weavingContractNo:
//               contract?.weavingContractNo ||
//               contract?.contractNo ||
//               contract?.wcNo ||
//               contract?.weavingContractNumber ||
//               (detail?.weavingContractId != null ? String(detail?.weavingContractId) : ""),
//             salesOrderNo:
//               salesOrder?.salesOrderNo ||
//               salesOrder?.salesOrderNumber ||
//               salesOrder?.orderNo ||
//               (detail?.salesOrderId != null ? String(detail?.salesOrderId) : ""),
//             totalEndsBase,
//             totalEnds,
//             isReturn: Number(detail?.isReturn ?? 0),
//             isBeamGated: Number(detail?.isBeamGated ?? 0),
//           } as BeamLineItem;
//         });
//     },
//     [planOptions, vendorOptions, weavingContracts, salesOrders, flangeMap]
//   );

//   const mapSalesReturnBeamItems = useCallback(
//     (salesReturn: any): BeamLineItem[] => {
//       const beamItems = Array.isArray(salesReturn?.beamItems) ? salesReturn.beamItems : [];
//       return beamItems
//         .filter((bi: any) => Number(bi?.isReturn ?? 0) === 0)
//         .map((bi: any, idx: number) => {
//           const weaverId = bi?.weaverId ?? bi?.weavingVendorId ?? null;
//           const weaver = vendorOptions.find((v: any) => String(v?.id) === String(weaverId));
//           const contract = weavingContracts.find((wc: any) =>
//             bi?.weavingContractNo
//               ? wc?.weavingContractNo === bi.weavingContractNo || wc?.contractNo === bi.weavingContractNo
//               : false
//           );
//           let salesOrder = salesOrders.find((s: any) =>
//             bi?.salesOrderNo
//               ? s?.salesOrderNo === bi.salesOrderNo || s?.orderNo === bi.salesOrderNo
//               : false
//           );
//           if (!salesOrder && contract?.id != null) {
//             const filteredBySO = filterSalesOrdersByWeavingContract(Number(contract.id), weavingContracts, salesOrders);
//             if (filteredBySO.length === 1) salesOrder = filteredBySO[0];
//           }
//           const width = Number(bi?.fabricPanelWidth ?? 1) || 1;
//           const beamMeters = Number(bi?.beamMeters ?? 0);
//           const shrinkage = Number(bi?.shrinkage ?? 0);
//           const expectedFabricMeter = Number(bi?.expectedFabricMeter ?? calculateExpected(beamMeters, width, shrinkage));

//           const matchedBeamInward = bi?.beamInwardId != null
//             ? beamInwardOptions.find((b: any) => String(b?.id) === String(bi.beamInwardId))
//             : null;
//           const matchedBeamDetail = matchedBeamInward != null && Array.isArray(matchedBeamInward.beamInwardBeamDetails)
//             ? (bi?.sizedBeamNo
//                 ? matchedBeamInward.beamInwardBeamDetails.find(
//                     (bd: any) => String(bd?.sizedBeamNo) === String(bi.sizedBeamNo)
//                   )
//                 : null) ?? matchedBeamInward.beamInwardBeamDetails[0]
//             : null;
//           const rawTotalEnds = matchedBeamDetail?.totalEnds ?? null;
//           const totalEndsBase = rawTotalEnds != null && Number.isFinite(Number(rawTotalEnds))
//             ? Number(rawTotalEnds) / (width > 0 ? width : 1)
//             : null;
//           const totalEnds = rawTotalEnds != null && Number.isFinite(Number(rawTotalEnds))
//             ? Number(rawTotalEnds)
//             : null;

//           return {
//             key: `sr-${salesReturn?.id}-${bi?.id ?? idx}`,
//             outwardNo: "",
//             detailId: undefined,
//             weavingContractId: contract?.id != null ? Number(contract.id) : null,
//             weavingVendorId: weaverId != null ? Number(weaverId) : null,
//             salesOrderId: salesOrder?.id != null ? Number(salesOrder.id) : null,
//             fabricMasterId: null,
//             flangeId: null,
//             sizedBeamNo: bi?.sizedBeamNo ?? "",
//             flangeNo: bi?.flangeNo ?? "",
//             beamMeters,
//             width,
//             shrinkage,
//             expectedFabricMeter,
//             weaverName: weaver?.vendorName || bi?.weaverName || "",
//             weavingContractNo: bi?.weavingContractNo ?? (contract ? (contract.weavingContractNo || contract.contractNo || "") : ""),
//             salesOrderNo: bi?.salesOrderNo ?? (salesOrder ? (salesOrder.salesOrderNo || salesOrder.orderNo || "") : ""),
//             totalEndsBase,
//             totalEnds,
//             isReturn: 0,
//             isBeamGated: 0,
//           } as BeamLineItem;
//         });
//     },
//     [vendorOptions, weavingContracts, salesOrders, beamInwardOptions]
//   );

//   const beamInwardDropdownOptions = useMemo(() => {
//     const biOptions = availableBeamInwards.map((beam: any) => ({
//       value: `bi:${beam?.id}`,
//       label: beam?.beamInwardNo || beam?.documentNo || String(beam?.id),
//     }));
//     const srOptions = availableSalesReturns.map((sr: any) => ({
//       value: `sr:${sr?.id}`,
//       label: sr?.salesReturnNo || String(sr?.id),
//     }));
//     return [...biOptions, ...srOptions];
//   }, [availableBeamInwards, availableSalesReturns]);

//   const matchingEditOutwardRecords = useMemo(() => {
//     if (!isEditMode || !editRecord) return [];
//     const editId = editRecord?.id != null ? String(editRecord.id) : null;
//     const outwardNo = editRecord?.outwardNo ?? editRecord?.beamOutwardNo ?? null;
//     return outwardRecords.filter((record: any) => {
//       const recordId = record?.id != null ? String(record.id) : null;
//       if (recordId && editId && recordId === editId) return true;
//       const recordOutward = record?.outwardNo ?? record?.beamOutwardNo ?? null;
//       if (recordOutward && outwardNo && String(recordOutward) === String(outwardNo)) return true;
//       return false;
//     });
//   }, [isEditMode, editRecord, outwardRecords]);


//   useEffect(() => {
//     setValue('outwardNo', editRecord?.outwardNo || '') ;
//   }, [editRecord, setValue]);

//   // Generate document number for new beam inward entries
//   useEffect(() => {
//     const generateDocumentNumber = async () => {
//       // Only generate for new entries (not editing existing ones)
//       if (editRecord || hasGeneratedNumberRef.current) {
//         return;
//       }

//       try {
//         const result = await documentNumberService.generateDocumentNumber({
//           screenName: 'Beam Outward'
//         });

//         setValue('outwardNo', result.documentNumber, { shouldValidate: true });
//         hasGeneratedNumberRef.current = true;
//       } catch (error) {
//         console.error('Failed to generate beam inward number:', error);
//         toast.error('Failed to generate beam inward number');
//       }
//     };

//     generateDocumentNumber();
//   }, [editRecord, setValue]);

//   // Cleanup document number cache if not saved
//   useEffect(() => {
//     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//       if (hasGeneratedNumberRef.current && !isSavingRef.current && !editRecord) {
//         documentNumberService.clearMemoryCache('Beam Outward');
//       }
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//       if (hasGeneratedNumberRef.current && !isSavingRef.current && !editRecord) {
//         documentNumberService.clearMemoryCache('Beam Outward');
//       }
//     };
//   }, [editRecord]);
//   useEffect(() => {
//     try {
//       const stored = localStorage.getItem("selectedCompanyId");
//       if (stored) {
//         setCompanyId(Number(stored));
//         return;
//       }
//       const fallback = localStorage.getItem("selectedCompany");
//       if (fallback) {
//         const parsed = JSON.parse(fallback);
//         if (parsed?.id != null) {
//           setCompanyId(Number(parsed.id));
//         }
//       }
//     } catch {
//       setCompanyId(null);
//     }
//   }, []);

//   //   useEffect(() => {
//   //   if (editRecord?.outwardNo) {
//   //     // If editing, use the existing number
//   //     return;
//   //   }


//   //   // Let the hook handle generation automatically via shouldGenerateOnMount
//   // }, [editRecord]);

//   useEffect(() => {
//     setEditInitialized(false);
//     setEditLinesHydrated(false);
//   }, [editRecord]);

//   useEffect(() => {
//     if (!isEditMode || !editRecord || editInitialized) return;
//     if (editRecord.sizingVendorId != null) {
//       setSelectedVendorId(String(editRecord.sizingVendorId));
//     } else {
//       setSelectedVendorId("");
//     }
//     if (editRecord.sizingPlanId != null) {
//       setSelectedPlanId(String(editRecord.sizingPlanId));
//     } else {
//       setSelectedPlanId("");
//     }
//     if (editRecord.beamInwardId != null) {
//       setSelectedBeamInwardId(String(editRecord.beamInwardId));
//     } else {
//       setSelectedBeamInwardId("");
//     }
//     if (editRecord.outwardDate) {
//       setOutwardDate(String(editRecord.outwardDate).slice(0, 10));
//     }
//     if (editRecord.transportId != null) {
//       setTransportId(String(editRecord.transportId));
//     }
//     if (editRecord.vehicleNo) {
//       setVehicleNo(String(editRecord.vehicleNo));
//     }
//     if (editRecord.remarks) {
//       setremarks(String(editRecord.remarks));
//     }
//     setEditInitialized(true);
//   }, [isEditMode, editRecord, editInitialized]);

//   const selectedCompanyId = useMemo(() => {
//     const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     return storedCompanyId ? Number(storedCompanyId) : undefined;
//   }, []);

//   useEffect(() => {
//     const scopedParams: any = { fetchAll: true };
//     if (selectedCompanyId) {
//       scopedParams.companyId = selectedCompanyId;
//     }
//     dispatch(getAllVendors(scopedParams));
//     dispatch(getAllWeavingContract(selectedCompanyId ? { fetchAll: true, companyId: selectedCompanyId } : { fetchAll: true }));
//     dispatch(getAllSalesOrders(selectedCompanyId ? { fetchAll: true, companyId: selectedCompanyId } : { fetchAll: true }));
//     dispatch(getAllWeavingJobWorkOrders({ fetchAll: true }));
//     dispatch(getAllCompanies({}));
//     dispatch(getAllTransports({}));
//   }, [dispatch, selectedCompanyId]);

//   useEffect(() => {
//     if (derivedOrderTypeId === 2 || derivedOrderTypeId == null) {
//       if (selectedCompanyId) {
//         dispatch(getAllSizingPlan({ companyId: selectedCompanyId, fetchAll: true }));
//       }
//     } else {
//       dispatch(getAllSizingPlan({ fetchAll: true }));
//     }
//   }, [dispatch, derivedOrderTypeId, selectedCompanyId]);

//   useEffect(() => {
//     const payload: any = { fetchAll: true };
//     if (companyId != null) payload.companyId = companyId;
//     dispatch(getAllBeamInward(payload));
//     dispatch(getAllFlanges({ companyId: companyId ?? 0, fetchAll: true }));
//   }, [dispatch, companyId]);

//   useEffect(() => {
//     dispatch(getAllBeamOutward(companyId != null ? { companyId, fetchAll: true } : { fetchAll: true }));
//     dispatch(getAllSalesReturn(companyId != null ? { companyId, fetchAll: true } : { fetchAll: true }));
//   }, [dispatch, companyId]);

//   useEffect(() => {
//     if (!isEditMode) return;
//     if (editLinesHydrated) return;
//     const prioritizedRecords = matchingEditOutwardRecords.length
//       ? matchingEditOutwardRecords
//       : editRecord
//         ? [editRecord]
//         : [];
//     if (prioritizedRecords.length) {
//       const mapped = mapSavedOutwardDetails(prioritizedRecords);
//       if (mapped.length) {
//         setLineItems(mapped);
//         setEditLinesHydrated(true);
//         return;
//       }
//     }
//     const fallbackBeam =
//       selectedBeamInward ||
//       beamInwardOptions.find((beam: any) => String(beam?.id) === String(editRecord?.beamInwardId));
//     if (!fallbackBeam) return;
//     const fallbackPlan =
//       selectedPlan ||
//       planOptions.find((plan: any) => String(plan?.id) === String(editRecord?.sizingPlanId)) ||
//       planOptions.find((plan: any) => String(plan?.id) === String(fallbackBeam?.sizingPlanId ?? fallbackBeam?.planId));
//     const mappedFromBeam = mapBeamInwardDetails({
//       beam: fallbackBeam,
//       plan: fallbackPlan,
//       includeOutwarded: true,
//     });
//     if (mappedFromBeam.length) {
//       setLineItems(mappedFromBeam);
//       setEditLinesHydrated(true);
//     }
//   }, [
//     isEditMode,
//     editRecord,
//     editLinesHydrated,
//     matchingEditOutwardRecords,
//     mapSavedOutwardDetails,
//     selectedBeamInward,
//     selectedPlan,
//     beamInwardOptions,
//     planOptions,
//     mapBeamInwardDetails,
//   ]);

//   useEffect(() => {
//     if (isEditMode) return;
//     if (selectedSalesReturnId) return;
//     if (!selectedBeamInwardId) {
//       setLineItems([]);
//       return;
//     }
//     const beam = beamInwardOptions.find((b: any) => String(b?.id) === selectedBeamInwardId);
//     if (!beam) {
//       setLineItems([]);
//       return;
//     }
//     const plan = selectedPlan ?? planOptions.find((p: any) =>
//       String(p?.id) === String(beam?.sizingPlanId ?? beam?.planId)
//     );
//     setLineItems(mapBeamInwardDetails({ beam, plan }));
//   }, [isEditMode, selectedSalesReturnId, selectedBeamInwardId, beamInwardOptions, selectedPlan, planOptions, mapBeamInwardDetails]);

//   useEffect(() => {
//     if (!isEditMode) return;
//     const resolvedBeamInwardId =
//       selectedBeamInwardId || (editRecord?.beamInwardId != null ? String(editRecord.beamInwardId) : "");
//     if (!resolvedBeamInwardId) return;
//     if (!selectedBeamInwardId && editRecord?.beamInwardId != null) {
//       setSelectedBeamInwardId(String(editRecord.beamInwardId));
//     }
//     let active = true;
//     const fetchSavedLines = async () => {
//       try {
//         const payload: any = { beamInwardId: Number(resolvedBeamInwardId) };
//         if (companyId != null) {
//           payload.companyId = companyId;
//         }
//         const response = await dispatch(getBeamOutwardByBeamInwardId(payload)).unwrap();
//         if (!active) return;
//         const rows = toArray(response);
//         const filtered = rows.filter((row: any) => {
//           if (editRecord?.outwardNo) {
//             return (
//               row?.outwardNo === editRecord.outwardNo ||
//               row?.beamOutwardNo === editRecord.outwardNo
//             );
//           }
//           return row?.id === editRecord?.id;
//         });
//         const source = filtered.length ? filtered : editRecord ? [editRecord] : [];
//         if (!source.length) {
//           setLineItems([]);
//           return;
//         }
//         setLineItems(mapSavedOutwardDetails(source));
//         setEditLinesHydrated(true);
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     fetchSavedLines();
//     return () => {
//       active = false;
//     };
//   }, [
//     isEditMode,
//     selectedBeamInwardId,
//     companyId,
//     dispatch,
//     editRecord,
//     mapSavedOutwardDetails,
//   ]);

//   const summary = useMemo(() => {
//     const totalBeams = lineItems.length;
//     const totalMeters = lineItems.reduce((sum, item) => sum + Number(item.beamMeters || 0), 0);
//     const totalExpected = lineItems.reduce((sum, item) => sum + Number(item.expectedFabricMeter || 0), 0);
//     return {
//       totalBeams,
//       totalMeters: Number(totalMeters.toFixed(3)),
//       totalExpected: Number(totalExpected.toFixed(3)),
//     };
//   }, [lineItems]);

//   const handleLineChange = (key: string | number, field: "beamMeters" | "width", value: string) => {
//     if (isEditMode) return;
//     const numeric = Number(value);
//     setLineItems(prev =>
//       prev.map(item => {
//         if (item.key !== key) return item;
//         const next = { ...item, [field]: numeric } as BeamLineItem;
//         next.expectedFabricMeter = calculateExpected(
//           Number(next.beamMeters || 0),
//           Number(next.width || 0),
//           Number(next.shrinkage || 0)
//         );
//         const base = deriveLineBaseFromItem(next);
//         next.totalEndsBase = base;
//         const widthForCalc = field === "width" ? numeric : Number(next.width || 0);
//         next.totalEnds = base != null ? computeLineTotalEnds(base, widthForCalc) : next.totalEnds;

//         return next;
//       })
//     );
//   };

//   const handleLineDropdownChange = (key: string | number, field: "weavingVendorId" | "weavingContractId" | "salesOrderId" | "flangeId", value: string) => {
//     setLineItems(prev =>
//       prev.map(item => {
//         if (item.key !== key) return item;
//         const next = { ...item } as BeamLineItem;
//         if (field === "weavingVendorId") {
//           next.weavingVendorId = value ? Number(value) : null;
//           next.weavingContractId = null;
//           next.weavingContractNo = "";
//           next.salesOrderId = null;
//           next.salesOrderNo = "";
//           const vendor = vendorOptions.find((v: any) => String(v?.id) === value);
//           next.weaverName = vendor?.vendorName || vendor?.name || "";
//         } else if (field === "weavingContractId") {
//           next.weavingContractId = value ? Number(value) : null;
//           const contract = weavingContracts.find((wc: any) => String(wc?.id) === value);
//           next.weavingContractNo = contract?.weavingContractNo || contract?.contractNo || contract?.wcNo || contract?.weavingContractNumber || "";
//           const allowed = next.weavingContractId != null
//             ? filterSalesOrdersByWeavingContract(next.weavingContractId, weavingContracts, salesOrders)
//             : salesOrders;
//           const allowedIds = new Set(allowed.map((so: any) => String(so?.id)));
//           if (next.salesOrderId != null && !allowedIds.has(String(next.salesOrderId))) {
//             next.salesOrderId = null;
//             next.salesOrderNo = "";
//           }
//           if (allowed.length === 1) {
//             const only = allowed[0];
//             next.salesOrderId = only?.id != null ? Number(only.id) : null;
//             next.salesOrderNo = only?.salesOrderNo || only?.salesOrderNumber || only?.orderNo || (only?.id != null ? String(only.id) : "");
//           }
//         } else if (field === "salesOrderId") {
//           next.salesOrderId = value ? Number(value) : null;
//           const so = salesOrders.find((s: any) => String(s?.id) === value);
//           next.salesOrderNo = so?.salesOrderNo || so?.salesOrderNumber || so?.orderNo || "";
//         } else if (field === "flangeId") {
//           next.flangeId = value ? Number(value) : null;
//           const flange =
//             issuedFlangeOptions.find((f: any) => String(f?.id) === value) ||
//             flangeOptions.find((f: any) => String(f?.id) === value);
//           next.flangeNo = flange?.flangeNo || (value ? (flangeMap.get(Number(value)) ?? "") : "");
//         }
//         return next;
//       })
//     );
//   };

//   const handleLineFlangeNoChange = (key: string | number, value: string) => {
//     setLineItems(prev =>
//       prev.map(item => {
//         if (item.key !== key) return item;
//         return { ...item, flangeNo: value, flangeId: null };
//       })
//     );
//   };

//   const removeLine = (key: string | number) => {
//     if (isEditMode) return;
//     setLineItems(prev => prev.filter(item => item.key !== key));
//   };

//   const handleSave = async (data: BeamLineItem) => {
//     if (!selectedVendorId) {
//       toast.error("Select a sizing vendor");
//       return;
//     }
//     if (!selectedPlanId) {
//       toast.error("Select a sizing plan");
//       return;
//     }
//     if (!selectedSalesReturnId && (!selectedBeamInward || !selectedBeamInwardId)) {
//       toast.error("Select a beam inward");
//       return;
//     }

//     const isEditMode = Boolean(editRecord?.id);
//     let beamOutwardNo = data.outwardNo || editRecord?.outwardNo || "";
//     if (!editRecord?.id && !beamOutwardNo) {
//       try {
//         const docResponse = await documentNumberService.generateDocumentNumber({
//           screenName: 'Beam Management'
//         });
//         beamOutwardNo = docResponse.documentNumber;
//       } catch (error) {
//         console.warn("Failed to generate document number:", error);
//       }
//     }


//     if (!lineItems.length) {
//       toast.error("Add at least one beam to process");
//       return;
//     }
//     for (const item of lineItems) {
//       if (item.weavingVendorId != null) {
//         const lineVen = vendorOptions.find((v: any) => String(v?.id) === String(item.weavingVendorId));
//         const isReturnedBeamItem = Boolean(item.sizedBeamNo?.endsWith('-R'));
//         if (lineVen != null && Number(lineVen.isInternalVendor) === 1) {
//           if (!isReturnedBeamItem && !item.flangeNo && item.flangeId == null) {
//             toast.error(`Empty Beam No is required for beam ${item.sizedBeamNo || ""} (internal weaver)`);
//             return;
//           }
//         }
//       }
//     }
//     const orderTypeId = Number(selectedBeamInward?.orderTypeId ?? selectedPlan?.orderTypeId ?? 0);
//     const outwardDetails = lineItems.map(item => ({
//       ...(item.detailId != null ? { id: item.detailId } : {}),
//       weavingContractId: item.weavingContractId ?? null,
//       weavingVendorId: item.weavingVendorId ?? null,
//       salesOrderId: item.salesOrderId ?? null,
//       sizedBeamNo: item.sizedBeamNo ?? "",
//       flangeId: item.flangeId ?? null,
//       flangeNo: item.flangeNo ?? "",
//       wrapMeters: Number(item.beamMeters || 0),
//       shrinkage: Number(item.shrinkage || 0),
//       fabricPanelWidth: String(item.width ?? ""),
//       expectedFabricMeter: Number(item.expectedFabricMeter || 0),
//       totalEnds: item.totalEnds != null ? Number(item.totalEnds) : null,
//       isIssuedToWeaving: 1,
//       isFactoryInward: 1,
//     }));
//     const primaryItem = lineItems[0];
//     const primaryLine: any = primaryItem
//       ? {
//         weavingContractId: primaryItem.weavingContractId ?? null,
//         weavingVendorId: primaryItem.weavingVendorId ?? null,
//         salesOrderId: primaryItem.salesOrderId ?? null,
//         sizedBeamNo: primaryItem.sizedBeamNo ?? "",
//         flangeId: primaryItem.flangeId ?? null,
//         flangeNo: primaryItem.flangeNo ?? "",
//         shrinkage: Number(primaryItem.shrinkage ?? 0),
//         fabricMasterId: primaryItem.fabricMasterId ?? null,
//         fabricPanelWidth: primaryItem.width ?? null,
//         totalEnds: primaryItem.totalEnds != null ? Number(primaryItem.totalEnds) : null,
//         weavingWorkOrderId:
//           primaryItem.weavingContractId != null
//             ? workOrderByContractMap.get(String(primaryItem.weavingContractId)) ?? null
//             : null,
//       }
//       : {};
//     const primaryVendor = primaryItem?.weavingVendorId != null
//       ? vendorOptions.find((v: any) => String(v?.id) === String(primaryItem.weavingVendorId))
//       : null;
//     const primaryVendorKey = (
//       primaryVendor?.vendorName ||
//       primaryVendor?.name ||
//       primaryItem?.weaverName ||
//       ""
//     )
//       .toString()
//       .trim()
//       .toLowerCase();
//     const resolvedBeamInwardNo =
//       selectedBeamInward?.beamInwardNo ||
//       selectedBeamInward?.documentNo ||
//       selectedBeamInward?.loanNo ||
//       (selectedBeamInward?.id != null ? String(selectedBeamInward.id) : null) ||
//       null;

//     const srRecord = selectedSalesReturnId
//       ? salesReturns.find((s: any) => String(s?.id) === selectedSalesReturnId)
//       : null;
//     const firstSrBeamItem = srRecord && Array.isArray(srRecord.beamItems)
//       ? srRecord.beamItems.find((bi: any) => Number(bi?.isReturn ?? 0) === 0)
//       : null;
//     const srBeamInwardId = firstSrBeamItem?.beamInwardId ?? null;
//     const srBeamInwardNo = srRecord?.beamInwardNo ?? null;

//     isSavingRef.current = true;

//     const payload = {
//       beamInwardId: selectedBeamInward?.id ?? (selectedBeamInwardId ? Number(selectedBeamInwardId) : null) ?? srBeamInwardId ?? editRecord?.beamInwardId ?? null,
//       beamInwardNo: resolvedBeamInwardNo ?? srBeamInwardNo ?? editRecord?.beamInwardNo ?? null,
//       weavingContractId: primaryLine.weavingContractId ?? null,
//       weavingWorkOrderId: primaryLine.weavingWorkOrderId ?? null,
//       weavingVendorId: primaryLine.weavingVendorId ?? null,
//       salesOrderId: primaryLine.salesOrderId ?? null,
//       sizedBeamNo: primaryLine.sizedBeamNo ?? "",
//       flangeId: primaryLine.flangeId ?? null,
//       flangeNo: primaryLine.flangeNo ?? "",
//       wrapMeters: summary.totalMeters,
//       shrinkage: primaryLine.shrinkage ?? null,
//       expectedFabricMeter: summary.totalExpected,
//       sizingPlanId: selectedPlan?.id ?? (selectedPlanId ? Number(selectedPlanId) : null) ?? selectedBeamInward?.sizingPlanId ?? editRecord?.sizingPlanId ?? null,
//       sizingBeamOutwardId: selectedBeamInward?.sizingBeamOutwardId ?? editRecord?.sizingBeamOutwardId ?? null,
//       orderTypeId,
//       outwardDate,
//       fabricPanelWidth:
//         primaryLine.fabricPanelWidth != null
//           ? String(primaryLine.fabricPanelWidth)
//           : lineItems[0]?.width != null
//             ? String(lineItems[0]?.width)
//             : null,
//       totalNoOfBeams: Number(summary.totalBeams),
//       totalBeamMeters: summary.totalMeters,
//       totalExpectedMeters: summary.totalExpected,
//       companyId: companyId != null ? Number(companyId) : null,
//       tradingCompanyId: companyId != null ? Number(companyId) : null,
//       factoryCompanyId: orderTypeId === 1 && primaryVendorKey ? companyNameMap.get(primaryVendorKey) ?? null : null,
//       outwardNo: beamOutwardNo,
//       sizingVendorId: Number(selectedVendorId),
//       fabricMasterId: primaryLine.fabricMasterId ?? null,
//       transportId: transportId ? Number(transportId) : null,
//       vehicleNo: vehicleNo || null,
//       remarks: remarks || null,
//       outwardDetails,
//     };
//     setIsSubmitting(true);
//     try {
//       if (isEditMode && editRecord?.id) {
//         await dispatch(updateBeamOutward({ id: Number(editRecord.id), data: payload, companyId: companyId ?? undefined })).unwrap();
//       } else {
//         await dispatch(createBeamOutward(payload as any)).unwrap();
//         documentNumberService.clearMemoryCache('Beam Outward');
//       }
//       const refreshPayload: any = { fetchAll: true };
//       if (companyId != null) refreshPayload.companyId = companyId;
//       await dispatch(getAllBeamInward(refreshPayload)).unwrap();
//       await dispatch(getAllBeamOutward(companyId != null ? { companyId } : undefined)).unwrap();

//       // Check if user came from order-entry-management and redirect back if needed
//       const source = location.state?.source;
//       if (source === 'order-entry-management') {
//         navigate("/transaction/order-entry-management", {
//           state: {
//             source: 'order-entry-management',
//             refreshData: true,
//             activeTab: location.state?.activeTab,
//             expandedRowId: location.state?.expandedRowId,
//             salesOrderId: location.state?.salesOrderId,
//             flowType: location.state?.flowType,
//             selectedHyperlink: location.state?.selectedHyperlink
//           }
//         });
//       } else {
//         navigate("/transaction/beam-outward-details");
//       }
//     } catch (error) {
//       console.error(error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="p-6 pt-16 space-y-6 mt-5">
//       <div className="flex items-center gap-3">
//         <Button onClick={() => navigate("/transaction/beam-outward-details")} variant="outline">
//           Back
//         </Button>
//         <h2 className="text-2xl font-semibold">Beam Outward</h2>
//       </div>

//       <Card className="bg-white">
//         <CardHeader>
//           <CardTitle>Order Details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {/* <div>
//               <label className="block text-sm font-medium">Outward No</label>
//               <input
//                 className="input mt-1 bg-gray-100"
//                 value={outwardNo}
//                 readOnly
//                 placeholder={isOutwardNoLoading ? "Generating..." : ""}
//               />
//             </div> */}
//               <div>

//                 <label className="block text-sm mb-1">Beam Outward No</label>

//                 <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"

//                   {...register('outwardNo')} readOnly />

//               </div>

//             <div>
//               <label className="block text-sm font-medium">Outward Date</label>
//               <input
//                 type="date"
//                 className="input mt-1"
//                 value={outwardDate}
//                 disabled={isEditMode}
//                 onChange={e => setOutwardDate(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Sizing Vendor</label>
//               <CommonSearchableSelect
//                 className="mt-1"
//                 value={selectedVendorId}
//                 disabled={isEditMode}
//                 onValueChange={value => {
//                   setSelectedVendorId(value);
//                   setSelectedPlanId("");
//                   setSelectedBeamInwardId("");
//                   setSelectedSalesReturnId("");
//                   setLineItems([]);
//                   if (isEditMode) {
//                     setEditLinesHydrated(false);
//                   }
//                 }}
//                 options={sizingVendorOptions.map((vendor: any) => ({
//                   value: String(vendor?.id),
//                   label: vendor?.vendorName || vendor?.name || vendor?.companyName
//                 }))}
//                 placeholder="Select vendor"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Sizing Plan No</label>
//               <CommonSearchableSelect
//                 className="mt-1"
//                 value={selectedPlanId}
//                 onValueChange={value => {
//                   setSelectedPlanId(value);
//                   setSelectedBeamInwardId("");
//                   setSelectedSalesReturnId("");
//                   setLineItems([]);
//                   if (isEditMode) {
//                     setEditLinesHydrated(false);
//                   }
//                 }}
//                 disabled={isEditMode || !selectedVendorId}
//                 options={availablePlans.map((plan: any) => ({
//                   value: String(plan?.id),
//                   label: plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || plan?.id
//                 }))}
//                 placeholder="Select sizing plan"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Beam Inward/Return No</label>
//               <CommonSearchableSelect
//                 className="mt-1"
//                 value={selectedInwardSourceValue}
//                 onValueChange={value => {
//                   setLineItems([]);
//                   if (isEditMode) {
//                     setEditLinesHydrated(false);
//                   }
//                   if (value.startsWith("sr:")) {
//                     const srId = value.slice(3);
//                     setSelectedSalesReturnId(srId);
//                     setSelectedBeamInwardId("");
//                     const sr = salesReturns.find((s: any) => String(s?.id) === srId);
//                     if (sr) {
//                       setLineItems(mapSalesReturnBeamItems(sr));
//                     }
//                   } else if (value.startsWith("bi:")) {
//                     const biId = value.slice(3);
//                     setSelectedBeamInwardId(biId);
//                     setSelectedSalesReturnId("");
//                     const beam = beamInwardOptions.find((b: any) => String(b?.id) === biId);
//                     if (beam) {
//                       const plan = selectedPlan ?? planOptions.find((p: any) =>
//                         String(p?.id) === String(beam?.sizingPlanId ?? beam?.planId)
//                       );
//                       setLineItems(mapBeamInwardDetails({ beam, plan }));
//                     }
//                   } else {
//                     setSelectedBeamInwardId(value);
//                     setSelectedSalesReturnId("");
//                     const beam = beamInwardOptions.find((b: any) => String(b?.id) === value);
//                     if (beam) {
//                       const plan = selectedPlan ?? planOptions.find((p: any) =>
//                         String(p?.id) === String(beam?.sizingPlanId ?? beam?.planId)
//                       );
//                       setLineItems(mapBeamInwardDetails({ beam, plan }));
//                     }
//                   }
//                 }}
//                 disabled={isEditMode || !selectedPlanId}
//                 options={beamInwardDropdownOptions}
//                 placeholder="Select beam inward / return"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Transport Name</label>
//               <CommonSearchableSelect
//                 className="mt-1"
//                 value={transportId}
//                 onValueChange={value => setTransportId(value)}
//                 options={activeTransportList.map((t: any) => ({
//                   value: String(t.id),
//                   label: t.transportName
//                 }))}
//                 placeholder="Select transport"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Vehicle No</label>
//               <input
//                 type="text"
//                 className="input mt-1"
//                 value={vehicleNo}
//                 onChange={e => setVehicleNo(e.target.value)}
//                 placeholder="Enter vehicle number"
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium">Remarks</label>
//               <textarea
//                 className="input mt-1"
//                 value={remarks}
//                 onChange={e => setremarks(e.target.value)}
//                 rows={2}
//                 placeholder="Enter remarks"
//               />
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <Card className="bg-white">
//         <CardHeader>
//           <CardTitle>Outward Details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {lineItems.length === 0 ? (
//             <div className="text-center text-gray-500 py-8">No beam details available</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full border border-gray-200 text-sm">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="p-2 border">Sized Beam No</th>
//                     <th className="p-2 border">Weaver Name</th>
//                     <th className="p-2 border">Weaving Contract No</th>
//                     <th className="p-2 border">Sales Order No</th>
//                     <th className="p-2 border">Empty Beam No</th>
//                     <th className="p-2 border">Beam Meters</th>
//                     <th className="p-2 border">Width</th>
//                     <th className="p-2 border">Expected Fabric Meter</th>
//                     <th className="p-2 border">Total Ends</th>
//                     <th className="p-2 border">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {lineItems.map(item => {
//                     const itemContractOptions = weavingContracts.filter((wc: any) =>
//                       item.weavingVendorId != null
//                         ? String(wc?.weavingVendorId ?? wc?.vendorId) === String(item.weavingVendorId)
//                         : true
//                     );
//                     const itemSalesOrderOptions =
//                       item.weavingContractId != null
//                         ? filterSalesOrdersByWeavingContract(
//                             item.weavingContractId,
//                             weavingContracts,
//                             salesOrders
//                           )
//                         : salesOrders;
//                     const itemWeaver = item.weavingVendorId != null
//                       ? vendorOptions.find((v: any) => String(v?.id) === String(item.weavingVendorId))
//                       : null;
//                     const isInternalOrder = Number(itemWeaver?.isInternalVendor) === 1;
//                     const isBeamGated = Number(item.isBeamGated ?? 0) === 1;
//                     const isReturnedBeam = Boolean(item.sizedBeamNo?.endsWith('-R'));
//                     return (
//                       <tr key={item.key} className="text-center">
//                         <td className="p-2 border">{item.sizedBeamNo || "-"}</td>
//                         <td className="p-2 border min-w-[160px]">
//                           <CommonSearchableSelect
//                             value={item.weavingVendorId != null ? String(item.weavingVendorId) : ""}
//                             onValueChange={val => handleLineDropdownChange(item.key, "weavingVendorId", val)}
//                             options={weaverVendorOptions.map((v: any) => ({
//                               value: String(v.id),
//                               label: v.vendorName || v.name || "",
//                             }))}
//                             placeholder="Select weaver"
//                             disabled={isBeamGated}
//                           />
//                         </td>
//                         <td className="p-2 border min-w-[160px]">
//                           <CommonSearchableSelect
//                             value={item.weavingContractId != null ? String(item.weavingContractId) : ""}
//                             onValueChange={val => handleLineDropdownChange(item.key, "weavingContractId", val)}
//                             options={itemContractOptions.map((wc: any) => ({
//                               value: String(wc.id),
//                               label: wc.weavingContractNo || wc.contractNo || wc.wcNo || wc.weavingContractNumber || String(wc.id),
//                             }))}
//                             placeholder="Select contract"
//                             disabled={isBeamGated}
//                           />
//                         </td>
//                         <td className="p-2 border min-w-[160px]">
//                           <CommonSearchableSelect
//                             value={item.salesOrderId != null ? String(item.salesOrderId) : ""}
//                             onValueChange={val => handleLineDropdownChange(item.key, "salesOrderId", val)}
//                             options={itemSalesOrderOptions.map((so: any) => ({
//                               value: String(so.id),
//                               label: so.salesOrderNo || so.salesOrderNumber || so.orderNo || String(so.id),
//                             }))}
//                             placeholder="Select sales order"
//                             disabled={isBeamGated}
//                           />
//                         </td>
//                         <td className="p-2 border min-w-[140px]">
//                           {isReturnedBeam ? (
//                             isInternalOrder ? (
//                               <input
//                                 type="text"
//                                 className="input"
//                                 value={item.flangeNo ?? ""}
//                                 onChange={e => handleLineFlangeNoChange(item.key, e.target.value)}
//                                 placeholder="Enter flange no"
//                                 disabled={isBeamGated}
//                               />
//                             ) : (
//                               <span className="text-gray-500">-</span>
//                             )
//                           ) : isInternalOrder ? (
//                             <CommonSearchableSelect
//                               value={item.flangeId != null ? String(item.flangeId) : ""}
//                               onValueChange={val => handleLineDropdownChange(item.key, "flangeId", val)}
//                               options={issuedFlangeOptions.map((f: any) => ({
//                                 value: String(f.id),
//                                 label: f.flangeNo || String(f.id),
//                               }))}
//                               placeholder="Select flange"
//                               disabled={isBeamGated}
//                             />
//                           ) : (
//                             <span className="text-gray-500">-</span>
//                           )}
//                         </td>
//                         <td className="p-2 border">
//                           <input
//                             type="number"
//                             className={`input${isEditMode ? " bg-gray-100" : ""}`}
//                             value={item.beamMeters}
//                             onChange={e => handleLineChange(item.key, "beamMeters", e.target.value)}
//                             readOnly={isEditMode}
//                             disabled={isEditMode}
//                           />
//                         </td>
//                         <td className="p-2 border">
//                           <input
//                             type="number"
//                             className={`input${isEditMode ? " bg-gray-100" : ""}`}
//                             value={item.width}
//                             onChange={e => handleLineChange(item.key, "width", e.target.value)}
//                             readOnly={isEditMode}
//                             disabled={isEditMode}
//                           />
//                         </td>
//                         <td className="p-2 border">{item.expectedFabricMeter.toFixed(2)}</td>
//                         <td className="p-2 border">
//                           <input
//                             type="number"
//                             className="input bg-gray-100"
//                             value={item.totalEnds ?? ""}
//                             readOnly
//                           />
//                         </td>
//                         <td className="p-2 border text-center">
//                           {isEditMode ? (
//                             <div className="flex flex-col items-center gap-1">
//                               {Number(item.isReturn ?? 0) === 1 && (
//                                 <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
//                                   Returned
//                                 </span>
//                               )}
//                               {isBeamGated && (
//                                 <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-600 text-white">
//                                   Beam Gated
//                                 </span>
//                               )}
//                               {Number(item.isReturn ?? 0) !== 1 && !isBeamGated && <span>-</span>}
//                             </div>
//                           ) : (
//                             <div className="flex flex-col items-center gap-1">
//                               {isBeamGated && (
//                                 <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-600 text-white">
//                                   Beam Gated
//                                 </span>
//                               )}
//                               <Button
//                                 size="sm"
//                                 variant="destructive"
//                                 className="h-8 w-8 p-0 bg-red-500 text-white hover:bg-red-600"
//                                 onClick={() => removeLine(item.key)}
//                                 title="Remove row"
//                               >
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                   <line x1="18" y1="6" x2="6" y2="18"></line>
//                                   <line x1="6" y1="6" x2="18" y2="18"></line>
//                                 </svg>
//                               </Button>
//                             </div>
//                           )}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <Card className="bg-white">
//         <CardHeader>
//           <CardTitle>Outward Summary</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="p-4 rounded border">
//               <p className="text-sm text-gray-500">No of Beams</p>
//               <p className="text-xl font-semibold">{summary.totalBeams}</p>
//             </div>
//             <div className="p-4 rounded border">
//               <p className="text-sm text-gray-500">Beam Meters</p>
//               <p className="text-xl font-semibold">{summary.totalMeters.toFixed(3)}</p>
//             </div>
//             <div className="p-4 rounded border">
//               <p className="text-sm text-gray-500">Expected Fabric Meter</p>
//               <p className="text-xl font-semibold">{summary.totalExpected.toFixed(3)}</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       <div className="flex justify-end">
//         <Button onClick={handleSubmit(handleSave)} disabled={isSubmitting || !lineItems.length} className="bg-primary text-white px-8">
//           {isSubmitting ? "Processing..." : isEditMode ? "Update" : "Save"}
//         </Button>
//       </div>
//     </div>
//   );
// }
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { documentNumberService } from "@/services/DocumentNumberService";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllBeamInward } from "@/state/beamInwardSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllWeavingJobWorkOrders } from "@/state/weavingJobWorkOrderSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllTransports } from "@/state/transportSlice";
import { createBeamOutward, getAllBeamOutward, getBeamOutwardByBeamInwardId, updateBeamOutward } from "@/state/beamOutwardSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { getAllSalesReturn } from "@/state/salesReturnSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { set, useForm } from "react-hook-form";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { resolveVendorTypeId, VENDOR_TYPE_ALL } from "@/utils/vendorFilters";

interface BeamLineItem {
  key: string | number;
  outwardNo: string;
  detailId?: number;
  weavingContractId?: number | null;
  weavingVendorId?: number | null;
  salesOrderId?: number | null;
  fabricMasterId?: number | null;
  flangeId?: number | null;
  sizedBeamNo?: string;
  flangeNo?: string;
  beamMeters: number;
  width: number;
  shrinkage: number;
  expectedFabricMeter: number;
  weaverName?: string;
  weavingContractNo?: string;
  salesOrderNo?: string;
  totalEndsBase?: number | null;
  totalEnds?: number | null;
  isReturn?: number;
  isBeamGated?: number;
}

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
};

const calculateExpected = (beamMeters: number, width: number, shrinkage: number) => {
  const base = Number(beamMeters || 0) * Number(width || 0);
  const shrink = Number(shrinkage || 0) / 100;
  const result = base - base * shrink;
  if (!isFinite(result)) return 0;
  return Number(result.toFixed(2));
};

const computeLineTotalEnds = (base?: number | null, width?: number | null) => {
  if (base == null || !Number.isFinite(base)) {
    return null;
  }
  if (width == null || !Number.isFinite(width) || width <= 0) {
    return Number(base.toFixed(2));
  }
  const total = base * width;
  return Number.isFinite(total) ? Number(total.toFixed(2)) : null;
};

const resolveLineBaseTotalEnds = (detail: any, width?: number | null) => {
  const candidates = [
    detail?.totalEndsBase,
    detail?.totalEndsPerUnit,
    detail?.warpEnds,
    detail?.actualWarpEnds,
    detail?.sordEnds,
  ];
  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }
  const total = Number(detail?.totalEnds);
  if (Number.isFinite(total) && width && width > 0) {
    const derived = total / width;
    return Number.isFinite(derived) ? derived : null;
  }
  return null;
};

const deriveLineBaseFromItem = (item: BeamLineItem) => {
  if (item.totalEndsBase != null && Number.isFinite(item.totalEndsBase)) {
    return item.totalEndsBase;
  }
  if (item.totalEnds != null && Number.isFinite(item.totalEnds) && item.width) {
    const derived = item.totalEnds / item.width;
    if (Number.isFinite(derived)) {
      return derived;
    }
  }
  return null;
};

/** Collect sales order ids referenced from a weaving contract (list from weavingContractSlice). */
const collectSalesOrderIdsFromWeavingContract = (contract: any): Set<string> => {
  const ids = new Set<string>();
  if (!contract) return ids;
  [
    contract.salesOrderId,
    contract.sales_order_id,
    contract.salesOrderNo,
    contract.sales_order_no,
  ].forEach((v: any) => {
    if (v != null && v !== "") ids.add(String(v));
  });
  const orderDetails = contract.orderDetails || contract.order_details || [];
  if (Array.isArray(orderDetails)) {
    orderDetails.forEach((d: any) => {
      const sid = d?.salesOrderId ?? d?.sales_order_id ?? d?.salesOrderNo ?? d?.sales_order_no;
      if (sid != null && sid !== "") ids.add(String(sid));
    });
  }
  return ids;
};

const filterSalesOrdersByWeavingContract = (
  contractId: number | null | undefined,
  contracts: any[],
  orders: any[]
) => {
  if (contractId == null) return orders;
  const contract = contracts.find((c: any) => String(c?.id) === String(contractId));
  if (!contract) return [];
  const linked = collectSalesOrderIdsFromWeavingContract(contract);
  if (linked.size > 0) {
    return orders.filter((so: any) => linked.has(String(so?.id)));
  }
  return orders.filter(
    (so: any) =>
      String(so?.weavingContractId ?? so?.weaving_contract_id ?? "") === String(contractId)
  );
};


const SIZING_VENDOR_TYPE_ID = 302;
const SIZING_VENDOR_TYPE_IDS = [SIZING_VENDOR_TYPE_ID, VENDOR_TYPE_ALL];
const WEAVING_VENDOR_TYPE_IDS = [303, 307];

export default function BeamOutwardEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const editRecord = (location.state as any)?.beamOutwardEdit;
  const isEditMode = Boolean(editRecord);

  const { vendorList } = useSelector((state: RootState) => state.vendor as any);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
  const { beamInwardList } = useSelector((state: RootState) => state.beamInward as any);
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts as any);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { beamOutwardList } = useSelector((state: RootState) => state.beamOutward as any);
  const { transportList } = useSelector((state: RootState) => state.transport as any);
  const { flangeList } = useSelector((state: RootState) => state.flange as any);
  const { salesReturnList } = useSelector((state: RootState) => state.salesReturn as any);

  const [companyId, setCompanyId] = useState<number | null>(null);
  // const [outwardNo, setOutwardNo] = useState("");
  const [outwardDate, setOutwardDate] = useState(new Date().toISOString().slice(0, 10));
  // const [isOutwardNoLoading, setIsOutwardNoLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedBeamInwardId, setSelectedBeamInwardId] = useState("");
  const [selectedSalesReturnId, setSelectedSalesReturnId] = useState("");
  const [lineItems, setLineItems] = useState<BeamLineItem[]>([]);
  const [transportId, setTransportId] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [remarks, setremarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editInitialized, setEditInitialized] = useState(false);
  const [editLinesHydrated, setEditLinesHydrated] = useState(false);

  // const initialDraftOutwardNo = useMemo(() => {
  //   if (editRecord?.outwardNo) {
  //     return editRecord.outwardNo;
  //   }
  //   return getDraftOutwardNo();
  // }, [editRecord?.outwardNo]);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BeamLineItem>({
    defaultValues: {
      outwardNo: editRecord?.outwardNo || 'Loading sequence...'
    }
  });

  // const hasGeneratedOutwardNoRef = useRef(Boolean(initialDraftOutwardNo && !editRecord?.outwardNo));
  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);


  const vendorOptions = useMemo(() => toArray(vendorList), [vendorList]);
  const activeVendorOptions = useMemo(() => vendorOptions.filter((v: any) => v.isActive !== false && v.activeFlag !== false), [vendorOptions]);
  const planOptions = useMemo(() => toArray(sizingPlanList), [sizingPlanList]);
  const activePlanOptions = useMemo(() => planOptions.filter((p: any) => p.isActive !== false && p.activeFlag !== false), [planOptions]);
  const beamInwardOptions = useMemo(() => toArray(beamInwardList), [beamInwardList]);
  const weavingContracts = useMemo(() => toArray(weavingContractList), [weavingContractList]);
  const salesOrders = useMemo(() => toArray(salesOrderList), [salesOrderList]);
  const companies = useMemo(() => toArray(companyMasterList), [companyMasterList]);
  const weavingOrders = useMemo(() => toArray(weavingJobWorkOrderList), [weavingJobWorkOrderList]);
  const outwardRecords = useMemo(() => toArray(beamOutwardList), [beamOutwardList]);
  const activeTransportList = useMemo(() => toArray(transportList).filter((t: any) => t.isActive !== false && t.activeFlag !== false), [transportList]);
  const flangeOptions = useMemo(() => toArray(flangeList), [flangeList]);
  const issuedFlangeOptions = useMemo(
    () =>
      flangeOptions.filter(
        (f: any) =>
          Number(f?.isIssued ?? f?.is_issued ?? 0) === 1 &&
          (companyId == null || Number(f?.companyId ?? f?.company_id) === companyId)
      ),
    [flangeOptions, companyId]
  );
  const flangeMap = useMemo(() => {
    const map = new Map<number, string>();
    flangeOptions.forEach((f: any) => {
      if (f?.id != null && f?.flangeNo) {
        map.set(Number(f.id), String(f.flangeNo));
      }
    });
    return map;
  }, [flangeOptions]);

  const salesReturns = useMemo(() => toArray(salesReturnList), [salesReturnList]);

  const availableSalesReturns = useMemo(() => {
    if (!selectedPlanId) return [];
    const plan = activePlanOptions.find((p: any) => String(p?.id) === selectedPlanId);
    const planNo = (plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || "").trim();
    return salesReturns.filter((sr: any) => {
      if (isEditMode && selectedSalesReturnId && String(sr?.id) === selectedSalesReturnId) {
        return true;
      }
      const srPlanNo = (sr?.sizingPlanNo || "").trim();
      const srPlanId = sr?.sizingPlanId;
      const planNoMatch = planNo !== "" && srPlanNo !== "" && srPlanNo === planNo;
      const planIdMatch = srPlanId != null && Number(srPlanId) > 0 && String(srPlanId) === selectedPlanId;
      const beamItemsPlanMatch = planNo !== "" && Array.isArray(sr?.beamItems) &&
        sr.beamItems.some((bi: any) => (bi?.sizingPlanNo || "").trim() === planNo);
      if (!planNoMatch && !planIdMatch && !beamItemsPlanMatch) return false;

      // Filter out sales returns that have all beams already outwarded
      if (Array.isArray(sr?.beamItems)) {
        const hasAvailableBeams = sr.beamItems.some(
          (bi: any) => Number(bi?.isOutwarded ?? 0) === 0 && Number(bi?.isReturn ?? 0) === 0
        );
        if (!hasAvailableBeams) return false;
      }

      return Array.isArray(sr?.beamItems) && sr.beamItems.some((bi: any) => Number(bi?.isReturn ?? 0) === 0);
    });
  }, [salesReturns, selectedPlanId, activePlanOptions, isEditMode, selectedSalesReturnId]);

  const selectedInwardSourceValue = selectedSalesReturnId
    ? `sr:${selectedSalesReturnId}`
    : selectedBeamInwardId
      ? `bi:${selectedBeamInwardId}`
      : "";

  const weaverVendorOptions = useMemo(() => {
    return activeVendorOptions.filter((v: any) => {
      const typeId = resolveVendorTypeId(v);
      return typeId != null && WEAVING_VENDOR_TYPE_IDS.includes(typeId);
    });
  }, [activeVendorOptions]);

  const availablePlans = useMemo(() => {
    if (!selectedVendorId) return activePlanOptions;
    return activePlanOptions.filter((plan: any) => String(plan?.sizingVendorId ?? plan?.vendorId) === selectedVendorId);
  }, [activePlanOptions, selectedVendorId]);

  const availableBeamInwards = useMemo(() => {
    return beamInwardOptions.filter((beam: any) => {
      if (isEditMode && selectedBeamInwardId && String(beam?.id) === selectedBeamInwardId) {
        return true;
      }

      const planMatch =
        !selectedPlanId || String(beam?.sizingPlanId ?? beam?.planId) === selectedPlanId;
      const vendorMatch =
        !selectedVendorId || String(beam?.sizingVendorId ?? beam?.vendorId) === selectedVendorId;
      if (!planMatch || !vendorMatch) return false;

      // Filter out beam inwards that have all beams already outwarded
      if (Array.isArray(beam?.beamInwardBeamDetails)) {
        const hasAvailableBeams = beam.beamInwardBeamDetails.some(
          (d: any) => Number(d?.isBeamOutwarded || 0) === 0 && Number(d?.isReturn || 0) === 0
        );
        if (!hasAvailableBeams) return false;
      }

      return true;
    });
  }, [beamInwardOptions, selectedPlanId, selectedVendorId, isEditMode, selectedBeamInwardId]);

  const selectedPlan = useMemo(() => {
    const fromAvailable = availablePlans.find((plan: any) => String(plan?.id) === selectedPlanId);
    if (fromAvailable) return fromAvailable;
    return activePlanOptions.find((plan: any) => String(plan?.id) === selectedPlanId);
  }, [availablePlans, activePlanOptions, selectedPlanId]);

  const selectedBeamInward = useMemo(() => {
    const fromAvailable = availableBeamInwards.find((beam: any) => String(beam?.id) === selectedBeamInwardId);
    if (fromAvailable) return fromAvailable;
    return beamInwardOptions.find((beam: any) => String(beam?.id) === selectedBeamInwardId);
  }, [availableBeamInwards, beamInwardOptions, selectedBeamInwardId]);

  const defaultOrderTypeId = useMemo(() => {
    const candidate = editRecord?.orderTypeId ?? 2;
    const numeric = Number(candidate);
    return Number.isFinite(numeric) ? numeric : 2;
  }, [editRecord]);

  const derivedOrderTypeId = useMemo(() => {
    const candidate = selectedBeamInward?.orderTypeId ?? selectedPlan?.orderTypeId;
    if (candidate != null) {
      const numeric = Number(candidate);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return defaultOrderTypeId;
  }, [selectedBeamInward, selectedPlan, defaultOrderTypeId]);

  const sizingVendorOptions = useMemo(() => {
    const base = Array.isArray(activeVendorOptions) ? activeVendorOptions : [];
    const isSizingOrAll = (v: any) => {
      if (!v) return false;
      const typeId = resolveVendorTypeId(v);
      if (typeId != null && SIZING_VENDOR_TYPE_IDS.includes(typeId)) {
        return true;
      }
      const label = String(v?.VENDOR_TYPE_AL || v?.vendorType || v?.vendorTypeName || "").toLowerCase();
      return label.includes("all") || label.includes("sizing");
    };
    if (derivedOrderTypeId === 1) {
      return base.filter(vendor => (Number(vendor?.isInternalVendor) === 1 || isSizingOrAll(vendor)));
    }
    if (derivedOrderTypeId === 2) {
      return base.filter(vendor => (Number(vendor?.isInternalVendor) === 0 || isSizingOrAll(vendor)));
    }
    return base;
  }, [activeVendorOptions, derivedOrderTypeId]);

  const isSelectedVendorInternal = useMemo(() => {
    if (!selectedVendorId) return false;
    const vendor = vendorOptions.find((v: any) => String(v?.id) === selectedVendorId);
    return Number(vendor?.isInternalVendor) === 1;
  }, [vendorOptions, selectedVendorId]);

  const workOrderByContractMap = useMemo(() => {
    const map = new Map<string, number>();
    weavingOrders.forEach((order: any) => {
      const contractId = order?.weavingContractId ?? order?.contractId ?? order?.weavingContract?.id;
      if (contractId != null && order?.id != null) {
        map.set(String(contractId), Number(order.id));
      }
    });
    return map;
  }, [weavingOrders]);

  const companyNameMap = useMemo(() => {
    const map = new Map<string, number>();
    companies.forEach((company: any) => {
      if (company?.id != null) {
        const name = (company?.companyName || company?.name || "").toString().trim().toLowerCase();
        if (name) {
          map.set(name, Number(company.id));
        }
      }
    });
    return map;
  }, [companies]);

  const mapSavedOutwardDetails = useCallback(
    (records: any[]): BeamLineItem[] => {
      if (!Array.isArray(records) || !records.length) return [];
      return records.flatMap((record: any, recordIdx: number) => {
        const details = Array.isArray(record?.outwardDetails) && record.outwardDetails.length
          ? record.outwardDetails
          : [record];
        return details.map((detail: any, detailIdx: number) => {
          const weaverId = detail?.weavingVendorId ?? record?.weavingVendorId ?? record?.vendorId ?? null;
          const contractId = detail?.weavingContractId ?? record?.weavingContractId ?? null;
          const salesOrderId = detail?.salesOrderId ?? record?.salesOrderId ?? null;
          const weaver = vendorOptions.find((v: any) => String(v?.id) === String(weaverId));
          const contract = weavingContracts.find((wc: any) => String(wc?.id) === String(contractId));
          const salesOrder = salesOrders.find((s: any) => String(s?.id) === String(salesOrderId));

          const beamInward = beamInwardOptions.find(
            (b: any) => String(b?.id) === String(record?.beamInwardId)
          );
          const beamInwardBeamDetails = Array.isArray(beamInward?.beamInwardBeamDetails)
            ? beamInward.beamInwardBeamDetails
            : [];
          const matchingBeamDetail =
            beamInwardBeamDetails.find(
              (bd: any) =>
                detail?.sizedBeamNo &&
                String(bd?.sizedBeamNo) === String(detail.sizedBeamNo)
            ) ??
            beamInwardBeamDetails.find(
              (bd: any) =>
                String(bd?.id) === String(detail?.beamInwardDetailId ?? detail?.beamDetailId)
            );
          const rawBeamMeters = Number(
            matchingBeamDetail?.wrapMeters ??
            detail?.wrapMeters ??
            detail?.beamMeters ??
            record?.wrapMeters ??
            record?.beamMeters ??
            0
          );
          const beamMeters = Number(rawBeamMeters.toFixed(2));
          const width =
            Number(
              detail?.fabricPanelWidth ??
              detail?.width ??
              record?.fabricPanelWidth ??
              record?.width ??
              1
            ) || 1;
          const shrinkage = Number(detail?.shrinkage ?? record?.shrinkage ?? 0);
          const savedTotalEnds = detail?.totalEnds ?? record?.totalEnds;
          const totalEndsBase = savedTotalEnds ?? resolveLineBaseTotalEnds(detail, width);
          const totalEnds = savedTotalEnds ?? computeLineTotalEnds(totalEndsBase, width);
          return {
            key: `${record?.id ?? "saved"}-${detail?.id ?? detailIdx}-${recordIdx}`,
            detailId: detail?.id ?? detail?.detailId ?? record?.detailId ?? null,
            weavingContractId: contractId ?? null,
            weavingVendorId: weaverId ?? null,
            salesOrderId: salesOrderId ?? null,
            fabricMasterId: detail?.fabricMasterId ?? record?.fabricMasterId ?? null,
            flangeId:
              detail?.flangeId != null
                ? Number(detail.flangeId)
                : record?.flangeId != null
                  ? Number(record.flangeId)
                  : null,
            sizedBeamNo: detail?.sizedBeamNo ?? record?.sizedBeamNo ?? "",
            flangeNo: (() => {
              const raw = detail?.flangeNo ?? record?.flangeNo ?? "";
              if (raw) return raw;
              const fId = detail?.flangeId != null ? Number(detail.flangeId) : record?.flangeId != null ? Number(record.flangeId) : null;
              return fId != null ? (flangeMap.get(fId) ?? "") : "";
            })(),
            beamMeters,
            width,
            shrinkage,
            expectedFabricMeter: Number(detail?.expectedFabricMeter ?? calculateExpected(beamMeters, width, shrinkage)),
            weaverName: weaver?.vendorName || weaver?.name || "",

            weavingContractNo:
              contract?.weavingContractNo ||
              contract?.contractNo ||
              contract?.wcNo ||
              contract?.weavingContractNumber ||
              (contractId != null ? String(contractId) : ""),
            salesOrderNo:
              salesOrder?.salesOrderNo ||
              salesOrder?.salesOrderNumber ||
              salesOrder?.orderNo ||
              (salesOrderId != null ? String(salesOrderId) : ""),
            totalEndsBase,
            totalEnds,
            isReturn: Number(detail?.isReturn ?? record?.isReturn ?? 0),
            isBeamGated: Number(matchingBeamDetail?.isBeamGated ?? detail?.isBeamGated ?? 0),
          } as BeamLineItem;
        });
      });
    },
    [vendorOptions, weavingContracts, salesOrders, flangeMap, beamInwardOptions]
  );

  const mapBeamInwardDetails = useCallback(
    ({ beam, plan, includeOutwarded = false }: { beam: any; plan?: any; includeOutwarded?: boolean }): BeamLineItem[] => {
      if (!beam) return [];
      const resolvedPlan =
        plan ??
        planOptions.find((candidate: any) =>
          String(candidate?.id) === String(beam?.sizingPlanId ?? beam?.planId)
        );
      const planQualities = Array.isArray(resolvedPlan?.sizingQualityDetails)
        ? resolvedPlan.sizingQualityDetails
        : [];
      const beamQualities = Array.isArray(beam?.beamInwardQualityDetails)
        ? beam.beamInwardQualityDetails
        : [];
      const details = Array.isArray(beam?.beamInwardBeamDetails) ? beam.beamInwardBeamDetails : [];
      return details
        .filter((detail: any) =>
          !String(detail?.sizedBeamNo || "").endsWith('-R') &&
          (includeOutwarded ||
            (Number(detail?.isBeamOutwarded || 0) === 0 && Number(detail?.isReturn || 0) === 0))
        )
        .map((detail: any, idx: number) => {
          const weaverId = detail?.weavingVendorId ?? detail?.vendorId;
          const weaver = vendorOptions.find((v: any) => String(v?.id) === String(weaverId));
          const contract = weavingContracts.find((wc: any) => String(wc?.id) === String(detail?.weavingContractId));
          const salesOrder = salesOrders.find((s: any) => String(s?.id) === String(detail?.salesOrderId));
          const fabricId = detail?.fabricId ?? detail?.fabricCodeId ?? detail?.fabricMasterId;
          const fabricMatch = planQualities.find((q: any) => {
            const planFabricId = q?.fabricId ?? q?.fabricCodeId ?? q?.fabricMasterId;
            return planFabricId != null && fabricId != null && String(planFabricId) === String(fabricId);
          });
          const beamQualityMatch = beamQualities.find((q: any) => {
            const beamFabricId = q?.fabricId ?? q?.fabricCodeId ?? q?.fabricMasterId;
            if (beamFabricId != null && fabricId != null && String(beamFabricId) === String(fabricId)) {
              return true;
            }
            return false;
          }) ?? beamQualities[0];
          const fabricMasterIdRaw =
            fabricMatch?.fabricMasterId ??
            fabricMatch?.fabricId ??
            detail?.fabricMasterId ??
            detail?.fabricId ??
            detail?.fabricCodeId ??
            null;
          const fabricMasterId = fabricMasterIdRaw != null ? Number(fabricMasterIdRaw) : null;
          const width =
            Number(
              detail?.fabricPanelWidth ??
              fabricMatch?.fabricPanelWidth ??
              planQualities?.[0]?.fabricPanelWidth ??
              resolvedPlan?.fabricPanelWidth ??
              1
            ) || 1;
          const beamMeters = Number(Number(detail?.wrapMeters ?? detail?.beamMeters ?? 0).toFixed(2));
          const shrinkage = Number(detail?.shrinkage ?? resolvedPlan?.shrinkage ?? beam?.shrinkage ?? 0);
          const totalEndsBase = beamQualityMatch?.totalEnds ?? resolveLineBaseTotalEnds(detail, width);
          const totalEnds = computeLineTotalEnds(totalEndsBase, width);
          return {
            key: detail?.id ?? `${detail?.sizedBeamNo ?? "row"}-${idx}`,
            detailId: detail?.id,
            weavingContractId: detail?.weavingContractId ?? null,
            weavingVendorId: weaverId ?? null,
            salesOrderId: detail?.salesOrderId ?? null,
            fabricMasterId,
            flangeId: detail?.flangeId != null ? Number(detail.flangeId) : null,
            sizedBeamNo: detail?.sizedBeamNo ?? "",
            flangeNo: detail?.flangeNo || (detail?.flangeId != null ? (flangeMap.get(Number(detail.flangeId)) ?? "") : ""),
            beamMeters,
            width,
            shrinkage,
            expectedFabricMeter: calculateExpected(beamMeters, width, shrinkage),
            weaverName: weaver?.vendorName || "",
            weavingContractNo:
              contract?.weavingContractNo ||
              contract?.contractNo ||
              contract?.wcNo ||
              contract?.weavingContractNumber ||
              (detail?.weavingContractId != null ? String(detail?.weavingContractId) : ""),
            salesOrderNo:
              salesOrder?.salesOrderNo ||
              salesOrder?.salesOrderNumber ||
              salesOrder?.orderNo ||
              (detail?.salesOrderId != null ? String(detail?.salesOrderId) : ""),
            totalEndsBase,
            totalEnds,
            isReturn: Number(detail?.isReturn ?? 0),
            isBeamGated: Number(detail?.isBeamGated ?? 0),
          } as BeamLineItem;
        });
    },
    [planOptions, vendorOptions, weavingContracts, salesOrders, flangeMap]
  );

  const mapSalesReturnBeamItems = useCallback(
    (salesReturn: any, includeOutwarded = false): BeamLineItem[] => {
      const beamItems = Array.isArray(salesReturn?.beamItems) ? salesReturn.beamItems : [];
      return beamItems
        .filter((bi: any) =>
          Number(bi?.isReturn ?? 0) === 0 &&
          (includeOutwarded || Number(bi?.isOutwarded ?? 0) === 0)
        )
        .map((bi: any, idx: number) => {
          const weaverId = bi?.weaverId ?? bi?.weavingVendorId ?? null;
          const weaver = vendorOptions.find((v: any) => String(v?.id) === String(weaverId));
          const contract = weavingContracts.find((wc: any) =>
            bi?.weavingContractNo
              ? wc?.weavingContractNo === bi.weavingContractNo || wc?.contractNo === bi.weavingContractNo
              : false
          );
          let salesOrder = salesOrders.find((s: any) =>
            bi?.salesOrderNo
              ? s?.salesOrderNo === bi.salesOrderNo || s?.orderNo === bi.salesOrderNo
              : false
          );
          if (!salesOrder && contract?.id != null) {
            const filteredBySO = filterSalesOrdersByWeavingContract(Number(contract.id), weavingContracts, salesOrders);
            if (filteredBySO.length === 1) salesOrder = filteredBySO[0];
          }
          const width = Number(bi?.fabricPanelWidth ?? 1) || 1;
          const beamMeters = Number(Number(bi?.beamMeters ?? 0).toFixed(2));
          const shrinkage = Number(bi?.shrinkage ?? 0);
          const expectedFabricMeter = Number(bi?.expectedFabricMeter ?? calculateExpected(beamMeters, width, shrinkage));

          const matchedBeamInward = bi?.beamInwardId != null
            ? beamInwardOptions.find((b: any) => String(b?.id) === String(bi.beamInwardId))
            : null;
          const matchedBeamDetail = matchedBeamInward != null && Array.isArray(matchedBeamInward.beamInwardBeamDetails)
            ? (bi?.sizedBeamNo
              ? matchedBeamInward.beamInwardBeamDetails.find(
                (bd: any) => String(bd?.sizedBeamNo) === String(bi.sizedBeamNo)
              )
              : null) ?? matchedBeamInward.beamInwardBeamDetails[0]
            : null;
          const rawTotalEnds = matchedBeamDetail?.totalEnds ?? null;
          const totalEndsBase = rawTotalEnds != null && Number.isFinite(Number(rawTotalEnds))
            ? Number(rawTotalEnds) / (width > 0 ? width : 1)
            : null;
          const totalEnds = rawTotalEnds != null && Number.isFinite(Number(rawTotalEnds))
            ? Number(rawTotalEnds)
            : null;

          return {
            key: `sr-${salesReturn?.id}-${bi?.id ?? idx}`,
            outwardNo: "",
            detailId: undefined,
            weavingContractId: contract?.id != null ? Number(contract.id) : null,
            weavingVendorId: weaverId != null ? Number(weaverId) : null,
            salesOrderId: salesOrder?.id != null ? Number(salesOrder.id) : null,
            fabricMasterId: null,
            flangeId: null,
            sizedBeamNo: bi?.sizedBeamNo ?? "",
            flangeNo: bi?.flangeNo ?? "",
            beamMeters,
            width,
            shrinkage,
            expectedFabricMeter,
            weaverName: weaver?.vendorName || bi?.weaverName || "",
            weavingContractNo: bi?.weavingContractNo ?? (contract ? (contract.weavingContractNo || contract.contractNo || "") : ""),
            salesOrderNo: bi?.salesOrderNo ?? (salesOrder ? (salesOrder.salesOrderNo || salesOrder.orderNo || "") : ""),
            totalEndsBase,
            totalEnds,
            isReturn: 0,
            isBeamGated: 0,
          } as BeamLineItem;
        });
    },
    [vendorOptions, weavingContracts, salesOrders, beamInwardOptions]
  );

  const beamInwardDropdownOptions = useMemo(() => {
    const biOptions = availableBeamInwards.map((beam: any) => ({
      value: `bi:${beam?.id}`,
      label: beam?.beamInwardNo || beam?.documentNo || String(beam?.id),
    }));
    const srOptions = availableSalesReturns.map((sr: any) => ({
      value: `sr:${sr?.id}`,
      label: sr?.salesReturnNo || String(sr?.id),
    }));
    const merged = [...biOptions, ...srOptions];
    if (isEditMode && editRecord && selectedInwardSourceValue) {
      const exists = merged.some(opt => opt.value === selectedInwardSourceValue);
      if (!exists) {
        merged.push({
          value: selectedInwardSourceValue,
          label: editRecord.beamInwardNo || editRecord.beamInward?.beamInwardNo || String(editRecord.beamInwardId || "")
        });
      }
    }
    return merged;
  }, [availableBeamInwards, availableSalesReturns, isEditMode, editRecord, selectedInwardSourceValue]);

  const matchingEditOutwardRecords = useMemo(() => {
    if (!isEditMode || !editRecord) return [];
    const editId = editRecord?.id != null ? String(editRecord.id) : null;
    const outwardNo = editRecord?.outwardNo ?? editRecord?.beamOutwardNo ?? null;
    return outwardRecords.filter((record: any) => {
      const recordId = record?.id != null ? String(record.id) : null;
      if (recordId && editId && recordId === editId) return true;
      const recordOutward = record?.outwardNo ?? record?.beamOutwardNo ?? null;
      if (recordOutward && outwardNo && String(recordOutward) === String(outwardNo)) return true;
      return false;
    });
  }, [isEditMode, editRecord, outwardRecords]);


  useEffect(() => {
    if (editRecord?.outwardNo) {
      setValue('outwardNo', editRecord.outwardNo);
    }
  }, [editRecord, setValue]);

  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      // Only generate for new entries (not editing existing ones)
      if (editRecord || hasGeneratedNumberRef.current) {
        return;
      }

      setValue('outwardNo', 'Loading sequence...');

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Beam Outward'
        });

        setValue('outwardNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate beam inward number:', error);
        toast.error('Failed to generate beam inward number');
      }
    };

    generateDocumentNumber();
  }, [editRecord, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editRecord) {
        documentNumberService.clearMemoryCache('Beam Outward');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editRecord) {
        documentNumberService.clearMemoryCache('Beam Outward');
      }
    };
  }, [editRecord]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("selectedCompanyId");
      if (stored) {
        setCompanyId(Number(stored));
        return;
      }
      const fallback = localStorage.getItem("selectedCompany");
      if (fallback) {
        const parsed = JSON.parse(fallback);
        if (parsed?.id != null) {
          setCompanyId(Number(parsed.id));
        }
      }
    } catch {
      setCompanyId(null);
    }
  }, []);

  useEffect(() => {
    setEditInitialized(false);
    setEditLinesHydrated(false);
  }, [editRecord]);

  useEffect(() => {
    if (!isEditMode || !editRecord || editInitialized) return;
    if (editRecord.sizingVendorId != null) {
      setSelectedVendorId(String(editRecord.sizingVendorId));
    } else {
      setSelectedVendorId("");
    }
    if (editRecord.sizingPlanId != null) {
      setSelectedPlanId(String(editRecord.sizingPlanId));
    } else {
      setSelectedPlanId("");
    }
    const isReturnRecord = Number(editRecord.isReturn) === 1;
    if (isReturnRecord && editRecord.beamInwardId != null) {
      setSelectedSalesReturnId(String(editRecord.beamInwardId));
      setSelectedBeamInwardId("");
    } else if (editRecord.beamInwardId != null) {
      setSelectedBeamInwardId(String(editRecord.beamInwardId));
      setSelectedSalesReturnId("");
    } else {
      setSelectedBeamInwardId("");
      setSelectedSalesReturnId("");
    }
    if (editRecord.outwardDate) {
      setOutwardDate(String(editRecord.outwardDate).slice(0, 10));
    }
    if (editRecord.transportId != null) {
      setTransportId(String(editRecord.transportId));
    }
    if (editRecord.vehicleNo) {
      setVehicleNo(String(editRecord.vehicleNo));
    }
    if (editRecord.remarks) {
      setremarks(String(editRecord.remarks));
    }
    setEditInitialized(true);
  }, [isEditMode, editRecord, editInitialized]);

  const selectedCompanyId = useMemo(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return storedCompanyId ? Number(storedCompanyId) : undefined;
  }, []);

  useEffect(() => {
    const scopedParams: any = { fetchAll: true };
    if (selectedCompanyId) {
      scopedParams.companyId = selectedCompanyId;
    }
    dispatch(getAllVendors(scopedParams));
    dispatch(getAllWeavingContract(selectedCompanyId ? { fetchAll: true, companyId: selectedCompanyId } : { fetchAll: true }));
    dispatch(getAllSalesOrders(selectedCompanyId ? { fetchAll: true, companyId: selectedCompanyId } : { fetchAll: true }));
    dispatch(getAllWeavingJobWorkOrders({ fetchAll: true }));
    dispatch(getAllCompanies({}));
    dispatch(getAllTransports({}));
  }, [dispatch, selectedCompanyId]);

  useEffect(() => {
    if (derivedOrderTypeId === 2 || derivedOrderTypeId == null) {
      if (selectedCompanyId) {
        dispatch(getAllSizingPlan({ companyId: selectedCompanyId, fetchAll: true }));
      }
    } else {
      dispatch(getAllSizingPlan({ fetchAll: true }));
    }
  }, [dispatch, derivedOrderTypeId, selectedCompanyId]);

  useEffect(() => {
    const payload: any = { fetchAll: true };
    if (companyId != null) payload.companyId = companyId;
    dispatch(getAllBeamInward(payload));
    dispatch(getAllFlanges({ companyId: companyId ?? 0, fetchAll: true }));
  }, [dispatch, companyId]);

  useEffect(() => {
    dispatch(getAllBeamOutward(companyId != null ? { companyId, fetchAll: true } : { fetchAll: true }));
    dispatch(getAllSalesReturn(companyId != null ? { companyId, fetchAll: true } : { fetchAll: true }));
  }, [dispatch, companyId]);

  useEffect(() => {
    if (!isEditMode) return;
    if (editLinesHydrated) return;
    const prioritizedRecords = matchingEditOutwardRecords.length
      ? matchingEditOutwardRecords
      : editRecord
        ? [editRecord]
        : [];
    if (prioritizedRecords.length) {
      const mapped = mapSavedOutwardDetails(prioritizedRecords);
      if (mapped.length) {
        setLineItems(mapped);
        setEditLinesHydrated(true);
        return;
      }
    }
    const fallbackBeam =
      selectedBeamInward ||
      beamInwardOptions.find((beam: any) => String(beam?.id) === String(editRecord?.beamInwardId));
    if (!fallbackBeam) return;
    const fallbackPlan =
      selectedPlan ||
      planOptions.find((plan: any) => String(plan?.id) === String(editRecord?.sizingPlanId)) ||
      planOptions.find((plan: any) => String(plan?.id) === String(fallbackBeam?.sizingPlanId ?? fallbackBeam?.planId));
    const mappedFromBeam = mapBeamInwardDetails({
      beam: fallbackBeam,
      plan: fallbackPlan,
      includeOutwarded: false,
    });
    if (mappedFromBeam.length) {
      setLineItems(mappedFromBeam);
      setEditLinesHydrated(true);
    }
  }, [
    isEditMode,
    editRecord,
    editLinesHydrated,
    matchingEditOutwardRecords,
    mapSavedOutwardDetails,
    selectedBeamInward,
    selectedPlan,
    beamInwardOptions,
    planOptions,
    mapBeamInwardDetails,
  ]);

  useEffect(() => {
    if (isEditMode) return;
    if (selectedSalesReturnId) return;
    if (!selectedBeamInwardId) {
      setLineItems([]);
      return;
    }
    const beam = beamInwardOptions.find((b: any) => String(b?.id) === selectedBeamInwardId);
    if (!beam) {
      setLineItems([]);
      return;
    }
    const plan = selectedPlan ?? planOptions.find((p: any) =>
      String(p?.id) === String(beam?.sizingPlanId ?? beam?.planId)
    );
    setLineItems(mapBeamInwardDetails({ beam, plan }));
  }, [isEditMode, selectedSalesReturnId, selectedBeamInwardId, beamInwardOptions, selectedPlan, planOptions, mapBeamInwardDetails]);

  useEffect(() => {
    if (!isEditMode) return;
    const resolvedBeamInwardId =
      selectedBeamInwardId || (editRecord?.beamInwardId != null ? String(editRecord.beamInwardId) : "");
    if (!resolvedBeamInwardId) return;
    if (!selectedBeamInwardId && editRecord?.beamInwardId != null) {
      setSelectedBeamInwardId(String(editRecord.beamInwardId));
    }
    let active = true;
    const fetchSavedLines = async () => {
      try {
        const payload: any = { beamInwardId: Number(resolvedBeamInwardId) };
        if (companyId != null) {
          payload.companyId = companyId;
        }
        const response = await dispatch(getBeamOutwardByBeamInwardId(payload)).unwrap();
        if (!active) return;
        const rows = toArray(response);
        const filtered = rows.filter((row: any) => {
          if (editRecord?.outwardNo) {
            return (
              row?.outwardNo === editRecord.outwardNo ||
              row?.beamOutwardNo === editRecord.outwardNo
            );
          }
          return row?.id === editRecord?.id;
        });
        const source = filtered.length ? filtered : editRecord ? [editRecord] : [];
        if (!source.length) {
          setLineItems([]);
          return;
        }
        setLineItems(mapSavedOutwardDetails(source));
        setEditLinesHydrated(true);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSavedLines();
    return () => {
      active = false;
    };
  }, [
    isEditMode,
    selectedBeamInwardId,
    companyId,
    dispatch,
    editRecord,
    mapSavedOutwardDetails,
  ]);

  const summary = useMemo(() => {
    const totalBeams = lineItems.length;
    const totalMeters = lineItems.reduce((sum, item) => sum + Number(item.beamMeters || 0), 0);
    const totalExpected = lineItems.reduce((sum, item) => sum + Number(item.expectedFabricMeter || 0), 0);
    return {
      totalBeams,
      totalMeters: Number(totalMeters.toFixed(2)),
      totalExpected: Number(totalExpected.toFixed(2)),
    };
  }, [lineItems]);

  const handleLineChange = (key: string | number, field: "beamMeters" | "width", value: string) => {
    if (isEditMode) return;
    const numeric = Number(value);
    setLineItems(prev =>
      prev.map(item => {
        if (item.key !== key) return item;
        const next = { ...item, [field]: numeric } as BeamLineItem;
        next.expectedFabricMeter = calculateExpected(
          Number(next.beamMeters || 0),
          Number(next.width || 0),
          Number(next.shrinkage || 0)
        );
        const base = deriveLineBaseFromItem(next);
        next.totalEndsBase = base;
        const widthForCalc = field === "width" ? numeric : Number(next.width || 0);
        next.totalEnds = base != null ? computeLineTotalEnds(base, widthForCalc) : next.totalEnds;

        return next;
      })
    );
  };

  const handleLineDropdownChange = (key: string | number, field: "weavingVendorId" | "weavingContractId" | "salesOrderId" | "flangeId", value: string) => {
    setLineItems(prev =>
      prev.map(item => {
        if (item.key !== key) return item;
        const next = { ...item } as BeamLineItem;
        if (field === "weavingVendorId") {
          next.weavingVendorId = value ? Number(value) : null;
          next.weavingContractId = null;
          next.weavingContractNo = "";
          next.salesOrderId = null;
          next.salesOrderNo = "";
          const vendor = vendorOptions.find((v: any) => String(v?.id) === value);
          next.weaverName = vendor?.vendorName || vendor?.name || "";
        } else if (field === "weavingContractId") {
          next.weavingContractId = value ? Number(value) : null;
          const contract = weavingContracts.find((wc: any) => String(wc?.id) === value);
          next.weavingContractNo = contract?.weavingContractNo || contract?.contractNo || contract?.wcNo || contract?.weavingContractNumber || "";
          const allowed = next.weavingContractId != null
            ? filterSalesOrdersByWeavingContract(next.weavingContractId, weavingContracts, salesOrders)
            : salesOrders;
          const allowedIds = new Set(allowed.map((so: any) => String(so?.id)));
          if (next.salesOrderId != null && !allowedIds.has(String(next.salesOrderId))) {
            next.salesOrderId = null;
            next.salesOrderNo = "";
          }
          if (allowed.length === 1) {
            const only = allowed[0];
            next.salesOrderId = only?.id != null ? Number(only.id) : null;
            next.salesOrderNo = only?.salesOrderNo || only?.salesOrderNumber || only?.orderNo || (only?.id != null ? String(only.id) : "");
          }
        } else if (field === "salesOrderId") {
          next.salesOrderId = value ? Number(value) : null;
          const so = salesOrders.find((s: any) => String(s?.id) === value);
          next.salesOrderNo = so?.salesOrderNo || so?.salesOrderNumber || so?.orderNo || "";
        } else if (field === "flangeId") {
          next.flangeId = value ? Number(value) : null;
          const flange =
            issuedFlangeOptions.find((f: any) => String(f?.id) === value) ||
            flangeOptions.find((f: any) => String(f?.id) === value);
          next.flangeNo = flange?.flangeNo || (value ? (flangeMap.get(Number(value)) ?? "") : "");
        }
        return next;
      })
    );
  };

  const handleLineFlangeNoChange = (key: string | number, value: string) => {
    setLineItems(prev =>
      prev.map(item => {
        if (item.key !== key) return item;
        return { ...item, flangeNo: value, flangeId: null };
      })
    );
  };

  const removeLine = (key: string | number) => {
    setLineItems(prev => prev.filter(item => item.key !== key));
  };


  const handleSave = async (data: BeamLineItem) => {
    if (!selectedVendorId) {
      toast.error("Select a sizing vendor");
      return;
    }
    if (!selectedPlanId) {
      toast.error("Select a sizing plan");
      return;
    }
    if (!selectedSalesReturnId && (!selectedBeamInward || !selectedBeamInwardId)) {
      toast.error("Select a beam inward");
      return;
    }

    const isEditMode = Boolean(editRecord?.id);
    let beamOutwardNo = data.outwardNo || editRecord?.outwardNo || "";
    if (!editRecord?.id && !beamOutwardNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: 'Beam Management'
        });
        beamOutwardNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }


    if (!lineItems.length) {
      toast.error("Add at least one beam to process");
      return;
    }
    for (const item of lineItems) {
      if (item.weavingVendorId != null) {
        const lineVen = vendorOptions.find((v: any) => String(v?.id) === String(item.weavingVendorId));
        const isReturnedBeamItem = Boolean(item.sizedBeamNo?.endsWith('-R'));
        if (lineVen != null && Number(lineVen.isInternalVendor) === 1) {
          if (!isReturnedBeamItem && !item.flangeNo && item.flangeId == null) {
            toast.error(`Empty Beam No is required for beam ${item.sizedBeamNo || ""} (internal weaver)`);
            return;
          }
        }
      }
    }
    const orderTypeId = Number(selectedBeamInward?.orderTypeId ?? selectedPlan?.orderTypeId ?? 0);
    const primaryItem = lineItems[0];

    const primaryVendor = primaryItem?.weavingVendorId != null
      ? vendorOptions.find((v: any) => String(v?.id) === String(primaryItem.weavingVendorId))
      : null;
    const isInternalWeaver = primaryVendor != null && (
      Number(primaryVendor.isInternalVendor) === 1 ||
      primaryVendor.isInternalVendor === true ||
      String(primaryVendor.isInternalVendor).toLowerCase() === "true" ||
      String(primaryVendor.isInternalVendor) === "1"
    );

    const outwardDetails = lineItems.map(item => ({
      ...(item.detailId != null ? { id: item.detailId } : {}),
      weavingContractId: item.weavingContractId ?? null,
      weavingVendorId: item.weavingVendorId ?? null,
      salesOrderId: item.salesOrderId ?? null,
      sizedBeamNo: item.sizedBeamNo ?? "",
      flangeId: item.flangeId ?? null,
      flangeNo: item.flangeNo ?? "",
      wrapMeters: Number(Number(item.beamMeters || 0).toFixed(2)),
      shrinkage: Number(item.shrinkage || 0),
      fabricPanelWidth: String(item.width ?? ""),
      expectedFabricMeter: Number(item.expectedFabricMeter || 0),
      totalEnds: item.totalEnds != null ? Number(item.totalEnds) : null,
      isIssuedToWeaving: 1,
      isFactoryInward: isInternalWeaver ? 1 : 0,
    }));
    const primaryLine: any = primaryItem
      ? {
        weavingContractId: primaryItem.weavingContractId ?? null,
        weavingVendorId: primaryItem.weavingVendorId ?? null,
        salesOrderId: primaryItem.salesOrderId ?? null,
        sizedBeamNo: primaryItem.sizedBeamNo ?? "",
        flangeId: primaryItem.flangeId ?? null,
        flangeNo: primaryItem.flangeNo ?? "",
        shrinkage: Number(primaryItem.shrinkage ?? 0),
        fabricMasterId: primaryItem.fabricMasterId ?? null,
        fabricPanelWidth: primaryItem.width ?? null,
        totalEnds: primaryItem.totalEnds != null ? Number(primaryItem.totalEnds) : null,
        weavingWorkOrderId:
          primaryItem.weavingContractId != null
            ? workOrderByContractMap.get(String(primaryItem.weavingContractId)) ?? null
            : null,
      }
      : {};

    const selectedWeaverName = (
      primaryVendor?.vendorName ||
      primaryVendor?.name ||
      primaryItem?.weaverName ||
      ""
    )
      .toString()
      .trim()
      .toLowerCase();
    const loggedInCompany = companies.find((c: any) => Number(c?.id) === Number(companyId));
    const loggedInCompanyName = (loggedInCompany?.companyName || loggedInCompany?.name || "").toString().trim().toLowerCase();
    let matchedCompanyId: number | null = null;
    if (isInternalWeaver && selectedWeaverName) {
      if (loggedInCompanyName && selectedWeaverName === loggedInCompanyName) {
        matchedCompanyId = companyId != null ? Number(companyId) : null;
      }
      if (!matchedCompanyId) {
        const matchedCompany = companies.find((c: any) => {
          const cName = (c?.companyName || c?.name || "").toString().trim().toLowerCase();
          return cName !== "" && cName === selectedWeaverName;
        });
        if (matchedCompany) {
          matchedCompanyId = Number(matchedCompany.id);
        }
      }
    }
    const resolvedBeamInwardNo =
      selectedBeamInward?.beamInwardNo ||
      selectedBeamInward?.documentNo ||
      selectedBeamInward?.loanNo ||
      (selectedBeamInward?.id != null ? String(selectedBeamInward.id) : null) ||
      null;

    const srRecord = selectedSalesReturnId
      ? salesReturns.find((s: any) => String(s?.id) === selectedSalesReturnId)
      : null;
    const firstSrBeamItem = srRecord && Array.isArray(srRecord.beamItems)
      ? srRecord.beamItems.find((bi: any) => Number(bi?.isReturn ?? 0) === 0)
      : null;
    const srBeamInwardId = firstSrBeamItem?.beamInwardId ?? null;
    const srBeamInwardNo = srRecord?.beamInwardNo ?? null;

    isSavingRef.current = true;

    const payload = {
      beamInwardId: selectedSalesReturnId
        ? Number(selectedSalesReturnId)
        : (selectedBeamInward?.id ?? (selectedBeamInwardId ? Number(selectedBeamInwardId) : null) ?? editRecord?.beamInwardId ?? null),
      beamInwardNo: selectedSalesReturnId
        ? (srRecord?.salesReturnNo ?? editRecord?.beamInwardNo ?? null)
        : (resolvedBeamInwardNo ?? editRecord?.beamInwardNo ?? null),
      isReturn: selectedSalesReturnId ? 1 : (editRecord?.isReturn ? Number(editRecord.isReturn) : 0),
      weavingContractId: primaryLine.weavingContractId ?? null,
      weavingWorkOrderId: primaryLine.weavingWorkOrderId ?? null,
      weavingVendorId: primaryLine.weavingVendorId ?? null,
      salesOrderId: primaryLine.salesOrderId ?? null,
      sizedBeamNo: primaryLine.sizedBeamNo ?? "",
      flangeId: primaryLine.flangeId ?? null,
      flangeNo: primaryLine.flangeNo ?? "",
      wrapMeters: summary.totalMeters,
      shrinkage: primaryLine.shrinkage ?? null,
      expectedFabricMeter: summary.totalExpected,
      sizingPlanId: selectedPlan?.id ?? (selectedPlanId ? Number(selectedPlanId) : null) ?? selectedBeamInward?.sizingPlanId ?? editRecord?.sizingPlanId ?? null,
      sizingBeamOutwardId: selectedBeamInward?.sizingBeamOutwardId ?? editRecord?.sizingBeamOutwardId ?? null,
      orderTypeId,
      outwardDate,
      fabricPanelWidth:
        primaryLine.fabricPanelWidth != null
          ? String(primaryLine.fabricPanelWidth)
          : lineItems[0]?.width != null
            ? String(lineItems[0]?.width)
            : null,
      totalNoOfBeams: Number(summary.totalBeams),
      totalBeamMeters: summary.totalMeters,
      totalExpectedMeters: summary.totalExpected,
      companyId: companyId != null ? Number(companyId) : null,
      tradingCompanyId: companyId != null ? Number(companyId) : null,
      factoryCompanyId: matchedCompanyId,
      outwardNo: beamOutwardNo,
      sizingVendorId: Number(selectedVendorId),
      fabricMasterId: primaryLine.fabricMasterId ?? null,
      transportId: transportId ? Number(transportId) : null,
      vehicleNo: vehicleNo || null,
      remarks: remarks || null,
      outwardDetails,
    };
    setIsSubmitting(true);
    try {
      if (isEditMode && editRecord?.id) {
        await dispatch(updateBeamOutward({ id: Number(editRecord.id), data: payload, companyId: companyId ?? undefined })).unwrap();
      } else {

        await dispatch(createBeamOutward(payload as any)).unwrap();
        documentNumberService.clearMemoryCache('Beam Outward');
      }
      const refreshPayload: any = { fetchAll: true };
      if (companyId != null) refreshPayload.companyId = companyId;
      await dispatch(getAllBeamInward(refreshPayload)).unwrap();
      await dispatch(getAllBeamOutward(companyId != null ? { companyId } : undefined)).unwrap();

      // Check if user came from order-entry-management and redirect back if needed
      const source = location.state?.source;
      if (source === 'order-entry-management') {
        navigate("/transaction/order-entry-management", {
          state: {
            source: 'order-entry-management',
            refreshData: true,
            activeTab: location.state?.activeTab,
            expandedRowId: location.state?.expandedRowId,
            salesOrderId: location.state?.salesOrderId,
            flowType: location.state?.flowType,
            selectedHyperlink: location.state?.selectedHyperlink
          }
        });
      } else {
        navigate("/transaction/beam-outward-details");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 pt-16 space-y-6 mt-5">
      <div className="flex items-center gap-3">
        <Button onClick={() => navigate("/transaction/beam-outward-details")} variant="outline">
          Back
        </Button>
        <h2 className="text-2xl font-semibold">Beam Outward</h2>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>

              <label className="block text-sm mb-1">Beam Outward No</label>

              <input type="text"
                className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                  !watch('outwardNo') || watch('outwardNo')?.startsWith('Loading')
                    ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                    : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                }`}
                placeholder="Loading sequence..."
                {...register('outwardNo')} readOnly />

            </div>

            <div>
              <label className="block text-sm font-medium">Outward Date</label>
              <input
                type="date"
                className="input mt-1"
                value={outwardDate}
                disabled={isEditMode}
                onChange={e => setOutwardDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Sizing Vendor</label>
              <CommonSearchableSelect
                className="mt-1"
                value={selectedVendorId}
                disabled={isEditMode}
                onValueChange={value => {
                  setSelectedVendorId(value);
                  setSelectedPlanId("");
                  setSelectedBeamInwardId("");
                  setSelectedSalesReturnId("");
                  setLineItems([]);
                  if (isEditMode) {
                    setEditLinesHydrated(false);
                  }
                }}
                options={sizingVendorOptions.map((vendor: any) => ({
                  value: String(vendor?.id),
                  label: vendor?.vendorName || vendor?.name || vendor?.companyName
                }))}
                placeholder="Select vendor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Sizing Plan No</label>
              <CommonSearchableSelect
                className="mt-1"
                value={selectedPlanId}
                onValueChange={value => {
                  setSelectedPlanId(value);
                  setSelectedBeamInwardId("");
                  setSelectedSalesReturnId("");
                  setLineItems([]);
                  if (isEditMode) {
                    setEditLinesHydrated(false);
                  }
                }}
                disabled={isEditMode || !selectedVendorId}
                options={availablePlans.map((plan: any) => ({
                  value: String(plan?.id),
                  label: plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || plan?.id
                }))}
                placeholder="Select sizing plan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Beam Inward/Return No</label>
              <CommonSearchableSelect
                className="mt-1"
                value={selectedInwardSourceValue}
                onValueChange={value => {
                  setLineItems([]);
                  if (isEditMode) {
                    setEditLinesHydrated(false);
                  }
                  if (value.startsWith("sr:")) {
                    const srId = value.slice(3);
                    setSelectedSalesReturnId(srId);
                    setSelectedBeamInwardId("");
                    const sr = salesReturns.find((s: any) => String(s?.id) === srId);
                    if (sr) {
                      setLineItems(mapSalesReturnBeamItems(sr));
                    }
                  } else if (value.startsWith("bi:")) {
                    const biId = value.slice(3);
                    setSelectedBeamInwardId(biId);
                    setSelectedSalesReturnId("");
                    const beam = beamInwardOptions.find((b: any) => String(b?.id) === biId);
                    if (beam) {
                      const plan = selectedPlan ?? planOptions.find((p: any) =>
                        String(p?.id) === String(beam?.sizingPlanId ?? beam?.planId)
                      );
                      setLineItems(mapBeamInwardDetails({ beam, plan }));
                    }
                  } else {
                    setSelectedBeamInwardId(value);
                    setSelectedSalesReturnId("");
                    const beam = beamInwardOptions.find((b: any) => String(b?.id) === value);
                    if (beam) {
                      const plan = selectedPlan ?? planOptions.find((p: any) =>
                        String(p?.id) === String(beam?.sizingPlanId ?? beam?.planId)
                      );
                      setLineItems(mapBeamInwardDetails({ beam, plan }));
                    }
                  }
                }}
                disabled={isEditMode || !selectedPlanId}
                options={beamInwardDropdownOptions}
                placeholder="Select beam inward / return"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Transport Name</label>
              <CommonSearchableSelect
                className="mt-1"
                value={transportId}
                onValueChange={value => setTransportId(value)}
                options={activeTransportList.map((t: any) => ({
                  value: String(t.id),
                  label: t.transportName
                }))}
                placeholder="Select transport"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Vehicle No</label>
              <input
                type="text"
                className="input mt-1"
                value={vehicleNo}
                onChange={e => setVehicleNo(e.target.value)}
                placeholder="Enter vehicle number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Remarks</label>
              <textarea
                className="input mt-1"
                value={remarks}
                onChange={e => setremarks(e.target.value)}
                rows={2}
                placeholder="Enter remarks"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Outward Details</CardTitle>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No beam details available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border">Sized Beam No</th>
                    <th className="p-2 border">Weaver Name</th>
                    <th className="p-2 border">Weaving Contract No</th>
                    <th className="p-2 border">Sales Order No</th>
                    <th className="p-2 border">Empty Beam No</th>
                    <th className="p-2 border">Beam Meters</th>
                    <th className="p-2 border">Width</th>
                    <th className="p-2 border">Expected Fabric Meter</th>
                    <th className="p-2 border">Total Ends</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map(item => {
                    const itemContractOptions = weavingContracts.filter((wc: any) =>
                      item.weavingVendorId != null
                        ? String(wc?.weavingVendorId ?? wc?.vendorId) === String(item.weavingVendorId)
                        : true
                    );
                    const itemSalesOrderOptions =
                      item.weavingContractId != null
                        ? filterSalesOrdersByWeavingContract(
                          item.weavingContractId,
                          weavingContracts,
                          salesOrders
                        )
                        : salesOrders;
                    const itemWeaver = item.weavingVendorId != null
                      ? vendorOptions.find((v: any) => String(v?.id) === String(item.weavingVendorId))
                      : null;
                    const isInternalOrder = Number(itemWeaver?.isInternalVendor) === 1;
                    const isBeamGated = Number(item.isBeamGated ?? 0) === 1;
                    const isReturnedBeam = Boolean(item.sizedBeamNo?.endsWith('-R'));
                    return (
                      <tr key={item.key} className="text-center">
                        <td className="p-2 border">{item.sizedBeamNo || "-"}</td>
                        <td className="p-2 border min-w-[160px]">
                          <CommonSearchableSelect
                            value={item.weavingVendorId != null ? String(item.weavingVendorId) : ""}
                            onValueChange={val => handleLineDropdownChange(item.key, "weavingVendorId", val)}
                            options={weaverVendorOptions.map((v: any) => ({
                              value: String(v.id),
                              label: v.vendorName || v.name || "",
                            }))}
                            placeholder="Select weaver"
                            disabled={isBeamGated}
                          />
                        </td>
                        <td className="p-2 border min-w-[160px]">
                          <CommonSearchableSelect
                            value={item.weavingContractId != null ? String(item.weavingContractId) : ""}
                            onValueChange={val => handleLineDropdownChange(item.key, "weavingContractId", val)}
                            options={itemContractOptions.map((wc: any) => ({
                              value: String(wc.id),
                              label: wc.weavingContractNo || wc.contractNo || wc.wcNo || wc.weavingContractNumber || String(wc.id),
                            }))}
                            placeholder="Select contract"
                            disabled={isBeamGated}
                          />
                        </td>
                        <td className="p-2 border min-w-[160px]">
                          <CommonSearchableSelect
                            value={item.salesOrderId != null ? String(item.salesOrderId) : ""}
                            onValueChange={val => handleLineDropdownChange(item.key, "salesOrderId", val)}
                            options={itemSalesOrderOptions.map((so: any) => ({
                              value: String(so.id),
                              label: so.salesOrderNo || so.salesOrderNumber || so.orderNo || String(so.id),
                            }))}
                            placeholder="Select sales order"
                            disabled={isBeamGated}
                          />
                        </td>
                        <td className="p-2 border min-w-[140px]">
                          {isReturnedBeam ? (
                            isInternalOrder ? (
                              <input
                                type="text"
                                className="input"
                                value={item.flangeNo ?? ""}
                                onChange={e => handleLineFlangeNoChange(item.key, e.target.value)}
                                placeholder="Enter flange no"
                                disabled={isBeamGated}
                              />
                            ) : (
                              <span className="text-gray-500">-</span>
                            )
                          ) : isInternalOrder ? (
                            <CommonSearchableSelect
                              value={item.flangeId != null ? String(item.flangeId) : ""}
                              onValueChange={val => handleLineDropdownChange(item.key, "flangeId", val)}
                              options={issuedFlangeOptions.map((f: any) => ({
                                value: String(f.id),
                                label: f.flangeNo || String(f.id),
                              }))}
                              placeholder="Select flange"
                              disabled={isBeamGated}
                            />
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            className={`input${isEditMode ? " bg-gray-100" : ""}`}
                            value={item.beamMeters}
                            onChange={e => handleLineChange(item.key, "beamMeters", e.target.value)}
                            readOnly={isEditMode}
                            disabled={isEditMode}
                          />
                        </td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            className={`input${isEditMode ? " bg-gray-100" : ""}`}
                            value={item.width}
                            onChange={e => handleLineChange(item.key, "width", e.target.value)}
                            readOnly={isEditMode}
                            disabled={isEditMode}
                          />
                        </td>
                        <td className="p-2 border">{item.expectedFabricMeter.toFixed(2)}</td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            className="input bg-gray-100"
                            value={item.totalEnds ?? ""}
                            readOnly
                          />
                        </td>
                        <td className="p-2 border text-center">
                          {isEditMode ? (
                            <div className="flex flex-col items-center gap-1">
                              {Number(item.isReturn ?? 0) === 1 && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                                  Returned
                                </span>
                              )}
                              {isBeamGated && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-600 text-white">
                                  Beam Gated
                                </span>
                              )}
                              {Number(item.isReturn ?? 0) !== 1 && !isBeamGated && (!item.weavingVendorId || (itemWeaver != null && Number(itemWeaver.isInternalVendor) === 0)) ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0 bg-red-500 text-white hover:bg-red-600"
                                  onClick={() => removeLine(item.key)}
                                  title="Remove row"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </Button>
                              ) : (
                                Number(item.isReturn ?? 0) !== 1 && !isBeamGated && <span>-</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              {isBeamGated && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-600 text-white">
                                  Beam Gated
                                </span>
                              )}
                              {Number(item.isReturn ?? 0) !== 1 && !isBeamGated && (!item.weavingVendorId || (itemWeaver != null && Number(itemWeaver.isInternalVendor) === 0)) ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0 bg-red-500 text-white hover:bg-red-600"
                                  onClick={() => removeLine(item.key)}
                                  title="Remove row"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                </Button>
                              ) : (
                                !isBeamGated && <span>-</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Outward Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded border">
              <p className="text-sm text-gray-500">No of Beams</p>
              <p className="text-xl font-semibold">{summary.totalBeams}</p>
            </div>
            <div className="p-4 rounded border">
              <p className="text-sm text-gray-500">Beam Meters</p>
              <p className="text-xl font-semibold">{summary.totalMeters.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded border">
              <p className="text-sm text-gray-500">Expected Fabric Meter</p>
              <p className="text-xl font-semibold">{summary.totalExpected.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit(handleSave)} disabled={isSubmitting || !lineItems.length} className="bg-primary text-white px-8">
          {isSubmitting ? "Processing..." : isEditMode ? "Update" : "Save"}
        </Button>
      </div>
    </div>
  );
}
