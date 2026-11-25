// import React, { useCallback, useEffect, useMemo, useRef, useState, useCallback as useCall } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
// import { formatDate } from "@/lib/utils";
// import { Pagination, usePagination } from "@/components/common/Pagination";
// import DataTable from "@/components/data/DataTable";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllUomMaster } from "@/state/uomMasterSlice";
// import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
// import { getAllPurchaseReturns } from "@/state/purchaseReturnSlice";
// import { getAllWarehouse } from "@/state/warehouseSlice";
// import { getAllSubCategories } from "@/state/subCategorySlice";
// import { getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";
// import { getAllWeavingContract } from "@/state/weavingContractSlice";
// import { getAllBeamOutward } from "@/state/beamOutwardSlice";
// import { getAllSizingPlan } from "@/state/sizingPlanSlice";
// import { getAllWeavingYarnIssue } from "@/state/weavingYarnIssueSlice";
// import { getAllSizingYarnIssue } from "@/state/sizingYarnIssueSlice";
// import { getAllJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
// import { getAllLooms } from "@/state/loomMasterSlice";
// import apiService from "@/services/ApiService";
// import { getAllSalesReturn } from "@/state/salesReturnSlice";
// import { getFactoryBeamInwardsByFactoryCompanyId } from "@/state/factoryBeamInwardSlice";
// import { AppDispatch, RootState } from "@/state/store";
// import { toast } from "react-toastify";
// import { getAllBeamInward } from "@/state/beamInwardSlice";
// import { getAllYarnMasters } from "@/state/yarnSlice";
// // Doffed Details interface
// interface DoffedDetail {
//   id: number;
//   pieceNumber: string;
//   quantity: number;
//   pieceMeter: string;
//   loomId: number;
//   beamNo: string;
//   flangeNo: string;
//   flangeId: number;
//   beamId: number;
//   inspectedMtr: number;
//   inspectedNtWt: number;
//   inspectedAvgWt: number;
//   gradeId: number;
//   warehouseId: number;
//   contractNo: string;
// }
// interface SalesOrderData {
//   id: number;
//   orderDate: string;
//   salesOrderNo: string;
//   buyerCustomerName: string;
//   buyerPoNo: string;
//   items: SalesOrderItem[];
//   isComplete: number;
//   isApproved: number;
//   exportType: string;
//   orderTypeId: number;
// }
// interface SalesOrderItem {
//   fabricCode: string;
//   buyerProduct: string;
//   quality: string;
//   orderQty: number;
//   pricePerUnit: number;
//   totalAmount: number;
//   gstPercent: number;
//   gstAmount: number;
//   finalAmount: number;
//   deliveryDate: string;
//   remarks: string;
// }
// /* ─── Shared style constants ─── */
// const TH =
//   "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white border-r border-blue-700 last:border-r-0 whitespace-nowrap";
// const TD =
//   "px-4 py-3 text-[13px] text-slate-700 border-b border-r border-slate-100/80 last:border-r-0 align-middle leading-snug";
// const TD_CENTER =
//   "px-4 py-3 text-[13px] text-slate-700 border-b border-r border-slate-100/80 last:border-r-0 align-middle text-center tabular-nums";
// const INNER_TH =
//   "px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white border-r border-slate-100/10 last:border-r-0 text-center whitespace-nowrap";
// const INNER_TD =
//   "px-3 py-2 text-[12.5px] text-slate-700 border border-slate-100/70 align-middle text-center whitespace-nowrap leading-snug";
// /* ─── Yarn color palette (elegant medium-dark shades) ─── */
// const YARN_COLORS = [
//   "text-green-600",
//   "text-blue-600",
//   "text-orange-500",
//   "text-purple-600",
//   "text-pink-600",
//   "text-cyan-600",
//   "text-emerald-600",
//   "text-amber-600",
//   "text-indigo-600",
//   "text-rose-600",
// ];
// export default function OrderEntryManagement() {
//   const {
//     currentPage,
//     itemsPerPage,
//     handlePageChange,
//     resetPage,
//     getOffset,
//     setItemsPerPage,
//   } = usePagination({ itemsPerPage: 10 });
//   const { salesOrderList, paginationInfo } = useSelector(
//     (state: RootState) => state.salesOrder
//   );
//   const { purchaseOrderList } = useSelector(
//     (state: RootState) => state.purchaseOrder
//   );
//   const { vendorList } = useSelector((state: RootState) => state.vendor);
//   const { uomList } = useSelector((state: RootState) => state.uom);
//   const { purchaseInwardList } = useSelector(
//     (state: RootState) => state.purchaseInward
//   );
//   const { purchaseReturnList } = useSelector(
//     (state: RootState) => state.purchaseReturn
//   );
//   const { warehouseList } = useSelector((state: RootState) => state.warehouse);
//   const { subCategoryList: millMasters } = useSelector(
//     (state: RootState) => state.subCategory
//   );
//   const { weavingContractList } = useSelector(
//     (state: RootState) => state.weavingContracts
//   );
//   const { beamOutwardList } = useSelector(
//     (state: RootState) => state.beamOutward
//   );
//   const { sizingPlanList } = useSelector(
//     (state: RootState) => state.sizingPlan
//   );
//   const { fabricMasterFullList: fabricMasters } = useSelector(
//     (state: RootState) => state.fabricMaster
//   );
//   const { weavingYarnIssuetList } = useSelector(
//     (state: RootState) => state.weavingYarnIssue
//   );
//   const { sizingYarnIssuetList } = useSelector(
//     (state: RootState) => state.sizingYarnIssue
//   );
//   const { jobworkFabricReceiveList } = useSelector(
//     (state: RootState) => state.JobworkFabricReceive
//   );
//   const { beamInwardList } = useSelector(
//     (state: RootState) => state.beamInward as any
//   );
//   const { loomList } = useSelector(
//     (state: RootState) => state.loomMaster
//   );
//   const { salesReturnList } = useSelector(
//     (state: RootState) => state.salesReturn
//   );
//   const { yarnList } = useSelector((state: RootState) => state.yarn);
//   const [activeTab, setActiveTab] = useState<"domestic" | "export">(
//     "domestic"
//   );
//   const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
//   const [viewMode, setViewMode] = useState<{ [key: number]: boolean }>({});
//   const [weavingViewMode, setWeavingViewMode] = useState<{ [key: number]: boolean }>({});
//   const [sizingViewMode, setSizingViewMode] = useState<{ [key: number]: boolean }>({});
//   const [activeSubTab, setActiveSubTab] = useState<"yarnPurchase" | "weaving" | "sizing">("yarnPurchase");
//   const [yarnReturnMap, setYarnReturnMap] = useState<Record<string, number>>({});
//   const [isNavigating, setIsNavigating] = useState(false);
//   const [redirectSource, setRedirectSource] = useState<string | null>(null);
//   const [isRedirecting, setIsRedirecting] = useState(false);
//   const [isLoadingWeavingContracts, setIsLoadingWeavingContracts] = useState(true);
//   const [doffedDetails, setDoffedDetails] = useState<{ [key: string]: DoffedDetail[] }>({});
//   const [loadingDoffedDetails, setLoadingDoffedDetails] = useState<{ [key: string]: boolean }>({});
//   const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const companyId = useResolvedCompanyId();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const dispatch = useDispatch<AppDispatch>();
//   /*
//    * ─── Yarn color map (stable across re-renders) ───
//    * Uses a ref so the mapping is never reset on re-render.
//    * The same yarn name will always resolve to the same Tailwind color class.
//    */
//   const yarnColorMapRef = useRef<Record<string, string>>({});
//   const getYarnColor = (yarnName: string): string => {
//     if (!yarnColorMapRef.current[yarnName]) {
//       const assignedCount = Object.keys(yarnColorMapRef.current).length;
//       yarnColorMapRef.current[yarnName] =
//         YARN_COLORS[assignedCount % YARN_COLORS.length];
//     }
//     return yarnColorMapRef.current[yarnName];
//   };
//   const yarnMap = useMemo<Record<number, string>>(() => {
//     if (!Array.isArray(yarnList)) return {};
//     return yarnList.reduce((acc: Record<number, string>, yarn: any) => {
//       if (yarn.id != null) acc[Number(yarn.id)] = yarn.yarnName || "";
//       return acc;
//     }, {});
//   }, [yarnList]);

//   /* ─── Data filtering (unchanged) ─── */
//   const filteredSalesOrders = useMemo(() => {
//     return salesOrderList.filter(
//       (order: SalesOrderData) =>
//         order.isComplete === 0 && order.isApproved === 1
//     );
//   }, [salesOrderList]);
//   const tabFilteredOrders = useMemo(() => {
//     return filteredSalesOrders.filter((order: SalesOrderData) => {
//       if (activeTab === "domestic") return order.orderTypeId === 1;
//       return order.orderTypeId === 2;
//     });
//   }, [filteredSalesOrders, activeTab]);
//   /* ─── Effects (unchanged) ─── */
//   useEffect(() => {
//     const storedCompanyId =
//       localStorage.getItem("selectedCompanyId") ||
//       localStorage.getItem("selectedCompany");
//     const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
//     dispatch(
//       getAllSalesOrders({
//         companyId,
//         offset: getOffset(),
//         limit: itemsPerPage,
//         fetchAll: false,
//         filters: {
//           exportType: activeTab === "domestic" ? "1" : "2",
//           orderTypeId: activeTab === "domestic" ? 1 : 2,
//           isComplete: 0,
//           isApproved: 1,
//         },
//       })
//     );
//   }, [dispatch, getOffset, itemsPerPage, activeTab]);
//   useEffect(() => {
//     const state = location.state as any;
//     const searchParams = new URLSearchParams(location.search);
//     // Set redirecting flag to prevent state conflicts
//     if (state?.source || searchParams.get('source')) {
//       setIsRedirecting(true);
//       // Debug logging for redirect flow
//       console.log('🔄 Redirect detected:', {
//         source: state?.source || searchParams.get('source'),
//         flowType: state?.flowType || searchParams.get('flowType'),
//         salesOrderId: state?.salesOrderId || searchParams.get('salesOrderId'),
//         expandView: state?.expandView || searchParams.get('expandView')
//       });
//       const source = state?.source || searchParams.get('source');
//       setRedirectSource(source as string);
//       // Parse query parameters for auto-expand info
//       const salesOrderId = state?.salesOrderId || searchParams.get('salesOrderId');
//       const expandView = state?.expandView || searchParams.get('expandView');
//       const flowType = state?.flowType || searchParams.get('flowType');
//       const fromOrderEntry = state?.fromOrderEntry || searchParams.get('fromOrderEntry');
//       const selectedHyperlink = state?.selectedHyperlink || searchParams.get('selectedHyperlink');
//       if (salesOrderId) {
//         const orderId = Number(salesOrderId);
//         setExpandedRowId(orderId);
//         // Enhanced auto-expand logic based on selected hyperlink and flow type
//         if (expandView === 'true' || flowType || fromOrderEntry) {
//           // Use setTimeout to ensure state updates are properly sequenced
//           setTimeout(() => {
//             // Reset both view modes first to ensure clean state
//             setViewMode(prev => ({ ...prev, [orderId]: false }));
//             setWeavingViewMode(prev => ({ ...prev, [orderId]: false }));
//             setSizingViewMode(prev => ({ ...prev, [orderId]: false }));
//             // Auto-expand based on specific selected hyperlink
//             setTimeout(() => {
//               if (selectedHyperlink) {
//                 // Expand specific section based on the selected hyperlink
//                 switch (selectedHyperlink) {
//                   case 'puprchaseOrder':
//                   case 'purchaseInward':
//                     setActiveSubTab('yarnPurchase');
//                     setViewMode(prev => ({ ...prev, [orderId]: true }));
//                     break;
//                   case 'weavingContract':
//                   case 'beamOutward':
//                   case 'weftIssue':
//                   case 'fabricReceived':
//                     setActiveSubTab('weaving');
//                     setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                     break;
//                   case 'sizingPlan':
//                     setActiveSubTab('sizing');
//                     setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//                     break;
//                   default:
//                     // Fallback to flow type logic
//                     if (flowType === 'weaving') {
//                       setActiveSubTab('weaving');
//                       setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                     } else if (flowType === 'yarnPurchase') {
//                       setActiveSubTab('yarnPurchase');
//                       setViewMode(prev => ({ ...prev, [orderId]: true }));
//                     } else if (flowType === 'sizing') {
//                       setActiveSubTab('sizing');
//                       setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//                     } else if (fromOrderEntry) {
//                       setActiveSubTab('yarnPurchase');
//                       setViewMode(prev => ({ ...prev, [orderId]: true }));
//                       setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                       setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//                     }
//                 }
//               } else {
//                 // Fallback to flow type logic if no selected hyperlink
//                 if (flowType === 'weaving') {
//                   setActiveSubTab('weaving');
//                   setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                 } else if (flowType === 'yarnPurchase') {
//                   setActiveSubTab('yarnPurchase');
//                   setViewMode(prev => ({ ...prev, [orderId]: true }));
//                 } else if (flowType === 'sizing') {
//                   setActiveSubTab('sizing');
//                   setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//                 } else if (fromOrderEntry) {
//                   setActiveSubTab('yarnPurchase');
//                   setViewMode(prev => ({ ...prev, [orderId]: true }));
//                   setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                   setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//                 }
//               }
//             }, 50);
//           }, 50);
//           // Scroll to the expanded section after a short delay to ensure rendering is complete
//           setTimeout(() => {
//             const elementId = `sales-order-row-${orderId}`;
//             const element = document.getElementById(elementId);
//             if (element) {
//               element.scrollIntoView({
//                 behavior: 'smooth',
//                 block: 'center'
//               });
//             }
//           }, 200);
//         }
//         // Set active tab if provided
//         if (state?.activeTab) {
//           setActiveTab(state.activeTab);
//         }
//       }
//       // Reset redirecting flag after processing
//       setTimeout(() => setIsRedirecting(false), 200);
//     }
//     // Handle refresh data with enhanced state restoration
//     if (state?.refreshData) {
//       setIsRedirecting(true);
//       const storedCompanyId =
//         localStorage.getItem("selectedCompanyId") ||
//         localStorage.getItem("selectedCompany");
//       const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
//       dispatch(
//         getAllSalesOrders({
//           companyId,
//           offset: getOffset(),
//           limit: itemsPerPage,
//           fetchAll: false,
//           filters: {
//             exportType: activeTab === "domestic" ? "1" : "2",
//             orderTypeId: activeTab === "domestic" ? 1 : 2,
//             isComplete: 0,
//             isApproved: 1,
//           },
//         })
//       ).then(() => {
//         // Restore states after data refresh
//         if (state.activeTab) setActiveTab(state.activeTab);
//         if (state.expandedRowId) setExpandedRowId(state.expandedRowId);
//         // Restore view modes based on selected hyperlink and flow type
//         if ((state.flowType || state.fromOrderEntry || state.selectedHyperlink) && state.expandedRowId) {
//           const orderId = state.expandedRowId;
//           setTimeout(() => {
//             if (state.selectedHyperlink) {
//               // Restore based on specific selected hyperlink
//               switch (state.selectedHyperlink) {
//                 case 'purchaseOrder':
//                 case 'purchaseInward':
//                   setActiveSubTab('yarnPurchase');
//                   setViewMode(prev => ({ ...prev, [orderId]: true }));
//                   break;
//                 case 'weavingContract':
//                 case 'beamOutward':
//                 case 'weftIssue':
//                 case 'fabricReceived':
//                   setActiveSubTab('weaving');
//                   setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                   break;
//                 case 'sizingPlan':
//                   setActiveSubTab('sizing');
//                   setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//                   break;
//                 default:
//                   // Fallback to flow type logic
//                   if (state.flowType === 'weaving') {
//                     setActiveSubTab('weaving');
//                     setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                   } else if (state.flowType === 'yarnPurchase') {
//                     setActiveSubTab('yarnPurchase');
//                     setViewMode(prev => ({ ...prev, [orderId]: true }));
//                   } else if (state.flowType === 'sizing') {
//                     setActiveSubTab('sizing');
//                     setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//                   } else if (state.fromOrderEntry) {
//                     setActiveSubTab('yarnPurchase');
//                     setViewMode(prev => ({ ...prev, [orderId]: true }));
//                     setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                     setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//                   }
//               }
//             } else {
//               // Fallback to flow type logic if no selected hyperlink
//               if (state.flowType === 'weaving') {
//                 setActiveSubTab('weaving');
//                 setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//               } else if (state.flowType === 'yarnPurchase') {
//                 setActiveSubTab('yarnPurchase');
//                 setViewMode(prev => ({ ...prev, [orderId]: true }));
//               } else if (state.flowType === 'sizing') {
//                 setActiveSubTab('sizing');
//                 setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//               } else if (state.fromOrderEntry) {
//                 setActiveSubTab('yarnPurchase');
//                 setViewMode(prev => ({ ...prev, [orderId]: true }));
//                 setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
//                 setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
//               }
//             }
//           }, 100);
//           // Scroll to the expanded section after refresh
//           setTimeout(() => {
//             const elementId = `sales-order-row-${orderId}`;
//             const element = document.getElementById(elementId);
//             if (element) {
//               element.scrollIntoView({
//                 behavior: 'smooth',
//                 block: 'center'
//               });
//             }
//           }, 250);
//         }
//         // Also re-fetch Purchase Orders, Inwards, Weaving Contracts, Beam Outward, Sizing Plan and Weft Issue to get latest data
//         dispatch(getAllPurchaseOrders({ companyId, fetchAll: true }));
//         dispatch(getAllPurchaseInwards({ companyId, fetchAll: true }));
//         dispatch(getAllPurchaseReturns({ companyId, fetchAll: true }));
//         setIsLoadingWeavingContracts(true);
//         dispatch(getAllWeavingContract({ companyId }))
//           .finally(() => {
//             setIsLoadingWeavingContracts(false);
//           });
//         dispatch(getAllBeamOutward({ companyId, fetchAll: true }));
//         dispatch(getAllSizingPlan({ companyId, fetchAll: true }));
//         dispatch(getAllWeavingYarnIssue({ companyId }));
//         dispatch(getAllSizingYarnIssue({ companyId ,fetchAll: true}));
//         dispatch(getAllJobworkFabricReceive({ companyId }));
//         // Reset redirecting flag and clean up state
//         setTimeout(() => {
//           setIsRedirecting(false);
//           navigate(location.pathname, { replace: true, state: null });
//         }, 150);
//       });
//     }
//   }, [location.state, location.search, dispatch, getOffset, itemsPerPage, activeTab, navigate]);
//   // Cleanup navigation timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (navigationTimeoutRef.current) {
//         clearTimeout(navigationTimeoutRef.current);
//       }
//     };
//   }, []);
//   // Utility function for redirect handling
//   const handleRedirectBack = useCallback((source: string, salesOrderId: number, flowType?: string) => {
//     navigate('/transaction/order-entry-management', {
//       state: {
//         source: 'order-entry-management',
//         salesOrderId,
//         flowType,
//         expandView: 'true',
//         refreshData: true
//       }
//     });
//   }, [navigate]);
//   // Loading overlay component
//   const LoadingOverlay = () => {
//     if (!isNavigating) return null;
//     return (
//       <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 pointer-events-none backdrop-blur-[1px]">
//         <div className="bg-white rounded-xl px-5 py-3.5 shadow-lg border border-slate-700 flex items-center gap-3">
//           <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-blue-600"></div>
//           <span className="text-sm font-medium text-slate-700">Processing...</span>
//         </div>
//       </div>
//     );
//   };
//   // Function to fetch doffed details by contract number
//   const fetchDoffedDetails = async (contractNo: string) => {
//     if (!contractNo || !companyId) return;
//     console.log(`Fetching doffed details for contract: ${contractNo}`);
//     setLoadingDoffedDetails(prev => ({ ...prev, [contractNo]: true }));
//     try {
//       const response = await apiService.get(
//         `/piece-entries/company/${companyId}?isFactoryFabric=1&weavingContractNo=${encodeURIComponent(contractNo)}`
//       );
//       console.log('API Response:', response);
//       // Check different possible response structures
//       let pieceEntries = [];
//       if (response?.data?.data) {
//         pieceEntries = response.data.data;
//       } else if (response?.data) {
//         pieceEntries = response.data;
//       } else if (Array.isArray(response)) {
//         pieceEntries = response;
//       }
//       console.log(`Doffed entries for ${contractNo}:`, pieceEntries);
//       setDoffedDetails(prev => ({
//         ...prev,
//         [contractNo]: pieceEntries
//       }));
//     } catch (error) {
//       console.error('Error fetching doffed details:', error);
//       toast.error('Failed to fetch doffed details');
//     } finally {
//       setLoadingDoffedDetails(prev => ({ ...prev, [contractNo]: false }));
//     }
//   };
//   // Function to calculate crimp percentage
//   const calculateCrimpPercentage = (doffedMtr: number, beamId: number, beamNo: string): string => {
//     if (!doffedMtr) return '0.00';
//     let beamMtr = 0;

//     // First try to find beam details from beamOutwardList
//     if (Array.isArray(beamOutwardList)) {
//       for (const outward of beamOutwardList) {
//         if (outward.outwardDetails && Array.isArray(outward.outwardDetails)) {
//           const detail = outward.outwardDetails.find((d: any) =>
//             (beamNo && d.sizedBeamNo === beamNo) || (beamId && d.id === beamId)
//           );
//           if (detail) {
//             beamMtr = detail.wrapMeters || 0;
//             break;
//           }
//         }
//       }
//     }

//     // Fallback to factoryBeamInwardList if not found
//     if (beamMtr === 0 && Array.isArray(beamInwardList)) {
//       for (const factoryBeam of beamInwardList) {
//         const beamDetail = factoryBeam.beamInwardBeamDetails?.find((beam: any) =>
//           (beamId && beam.id === beamId) || (beamNo && beam.beamNo === beamNo)
//         );
//         if (beamDetail) {
//           beamMtr = beamDetail.wrapMeters || 0;
//           break;
//         }
//       }
//     }

//     if (beamMtr === 0) return '0.00';
//     const crimpPercentage = ((beamMtr - doffedMtr) / beamMtr) * 100;
//     return crimpPercentage.toFixed(2);
//   };
//   // Function to get warehouse name by ID
//   const getWarehouseName = (warehouseId: number): string => {
//     const warehouse = warehouseList.find((w: any) => w.id === warehouseId);
//     return warehouse?.warehouseName || 'N/A';
//   };
//   // Function to get grade name by ID
//   const getGradeName = (gradeId: number): string => {
//     // This would need to be implemented based on your grade master data
//     // For now, returning a placeholder
//     return gradeId ? `Grade ${gradeId}` : 'N/A';
//   };
//   // Function to get loom name by ID
//   const getLoomName = (loomId: number): string => {
//     const loom = loomList.find((loom: any) => loom.id === loomId);
//     return loom?.loomNo || loom?.loomName || `Loom ${loomId}`;
//   };
//   useEffect(() => {
//     const storedCompanyId =
//       localStorage.getItem("selectedCompanyId") ||
//       localStorage.getItem("selectedCompany");
//     const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
//     if (companyId) {
//       dispatch(getAllPurchaseOrders({ companyId, fetchAll: true }));
//       dispatch(getAllVendors({ companyId }));
//       dispatch(getAllUomMaster({ fetchAll: true }));
//       dispatch(getAllPurchaseInwards({ companyId, fetchAll: true }));
//       dispatch(getAllPurchaseReturns({ companyId, fetchAll: true }));
//       dispatch(getAllWarehouse({ fetchAll: true }));
//       dispatch(getAllSubCategories({ fetchAll: true }));
//       dispatch(getAllFabricMastersForDropdown());
//       // Set loading state before fetching weaving contracts
//       setIsLoadingWeavingContracts(true);
//       dispatch(getAllWeavingContract({ companyId }))
//         .finally(() => {
//           setIsLoadingWeavingContracts(false);
//         });
//       dispatch(getAllBeamOutward({ companyId, fetchAll: true }));
//       dispatch(getAllSizingPlan({ companyId, fetchAll: true }));
//       dispatch(getAllWeavingYarnIssue({ companyId }));
//       dispatch(getAllSizingYarnIssue({ companyId , fetchAll: true }));
//       dispatch(getAllJobworkFabricReceive({ companyId }));
//       dispatch(getAllLooms({ companyId }));
//       dispatch(getAllBeamInward({ companyId, fetchAll: true } as any));
//       dispatch(getAllSalesReturn({ companyId, fetchAll: true }));
//       dispatch(getAllYarnMasters({ fetchAll: true }));
//     }
//   }, [dispatch, companyId]);

//   /* ─── Yarn Return Data Fetching ─── */
//   const fetchYarnReturnForSizingPlan = useCallback(async (sizingPlanNo: string) => {
//     if (!sizingPlanNo || !companyId) return;
//     try {
//       // Calling the company-wide endpoint as specific No endpoints might fail or not be supported
//       // This returns a list of all yarn returns for the company
//       const response = await apiService.get(`/yarn-return/company/${companyId}`);

//       const responseData = response?.data?.data || response?.data || response;
//       const list = Array.isArray(responseData) ? responseData : (Array.isArray(responseData?.data) ? responseData.data : []);

//       console.log("SizingPlanNo:", sizingPlanNo);

//       // Match the correct data from the list using orderNo as sizingPlanNo
//       const matched = list.find((item: any) => {
//         console.log("API orderNo:", item.orderNo);
//         return item.orderNo === sizingPlanNo;
//       });

//       const yarnReturnKg = matched?.yarnReturnItems?.reduce(
//         (sum: number, item: any) => sum + (Number(item.totalKgs) || 0),
//         0
//       ) || 0;

//       setYarnReturnMap(prev => ({ ...prev, [sizingPlanNo]: yarnReturnKg }));
//     } catch (error) {
//       console.error(`Error fetching yarn return for sizing plan ${sizingPlanNo}:`, error);
//       setYarnReturnMap(prev => ({ ...prev, [sizingPlanNo]: 0 }));
//     }
//   }, [companyId]);

//   useEffect(() => {
//     if (activeSubTab === "sizing" && expandedRowId) {
//       // Find sizing plans relevant to the current expanded sales order
//       const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
//         sp.sizingBeamDetails?.some((beam: any) => beam.salesOrderId === expandedRowId)
//       );

//       relevantSizingPlans.forEach((sp: any) => {
//         const key = sp.sizingPlanNo;
//         if (key && yarnReturnMap[key] === undefined) {
//           fetchYarnReturnForSizingPlan(key);
//         }
//       });
//     }
//   }, [activeSubTab, expandedRowId, sizingPlanList, yarnReturnMap, fetchYarnReturnForSizingPlan]);

//   useEffect(() => {
//     if (activeSubTab === "weaving" && expandedRowId) {
//       // Find weaving contracts relevant to the current expanded sales order
//       const relatedContracts = weavingContractList.filter((wc: any) =>
//         Number(wc.salesOrderId) === expandedRowId || Number(wc.salesOrderNo) === expandedRowId
//       );

//       relatedContracts.forEach((wc: any) => {
//         const key = wc.weavingContractNo || wc.contractNo;
//         if (key && yarnReturnMap[key] === undefined) {
//           fetchYarnReturnForSizingPlan(key);
//         }
//       });
//     }
//   }, [activeSubTab, expandedRowId, weavingContractList, yarnReturnMap, fetchYarnReturnForSizingPlan]);

//   /* ─── Lookup helpers (unchanged) ─── */
//   const getVendorName = (vendorId: number) => {
//     const vendor = vendorList.find((v: any) => v.id === vendorId);
//     return vendor?.vendorName || `Vendor ${vendorId}`;
//   };
//   const getUomName = (uomId: string) => {
//     const uom = uomList.find(
//       (u: any) =>
//         u.id === uomId ||
//         u.uomCode === uomId ||
//         u.id?.toString() === uomId ||
//         u.uomCode?.toString() === uomId
//     );
//     return uom?.uomName || uom?.uomCode || uom?.name || uomId;
//   };
//   /* ─── Transform helpers (unchanged logic) ─── */
//   const transformPurchaseOrderData = (purchaseOrders: any[]) => {
//     const flattenedData: any[] = [];
//     let serialNumber = 1;
//     purchaseOrders.forEach((po) => {
//       const items = po.purchaseOrderItemsDtl || [];
//       const itemCount = items.length;
//       items.forEach((item: any, itemIndex: number) => {
//         flattenedData.push({
//           id: `${po.id}-${itemIndex}`,
//           serialNumber: itemIndex === 0 ? serialNumber++ : null,
//           poNo: itemIndex === 0 ? po.poNo : null,
//           vendorName: itemIndex === 0 ? getVendorName(po.vendorId) : null,
//           vendorId: po.vendorId,
//           yarnName: item.yarnName,
//           yarnCount: item.yarnName,
//           quantity: item.quantity,
//           unit: item.unit,
//           price: item.price,
//           netAmount: item.netAmount,
//           gstAmount: item.gstAmount,
//           finalAmount: item.finalAmount,
//           isComplete: po.isComplete,
//           status: Number(po.isApproved) === 1 ? "Approved" : "Pending",
//           rowSpan: {
//             poNo: itemIndex === 0 ? itemCount : 0,
//             vendorName: itemIndex === 0 ? itemCount : 0,
//             unit: itemIndex === 0 ? itemCount : 0,
//             status: itemIndex === 0 ? itemCount : 0,
//           },
//         });
//       });
//     });
//     return flattenedData;
//   };
//   const transformPurchaseInwardData = (
//     purchaseInwardData: any[],
//     purchaseReturnData: any[] = []
//   ) => {
//     const flattenedRows: any[] = [];
//     let serialNumberCounter = 1;
//     purchaseInwardData?.forEach((inward: any) => {
//       const inwardRows: any[] = [];

//       inward.purchaseInwardItemsDtl?.forEach((item: any) => {
//         const matchedPO = purchaseOrderList?.find(
//           (po: any) => Number(po.id) === Number(inward.purchaseOrderId)
//         );
//         const matchedPOItem = matchedPO?.purchaseOrderItemsDtl?.find(
//           (poItem: any) => Number(poItem.id) === Number(item.poItemId)
//         );
//         const millName =
//           millMasters?.find(
//             (mill: any) =>
//               Number(mill.id) === Number(matchedPOItem?.millNameId)
//           )?.subCategoryName || "-";

//         const yarnGroups: Record<string, any[]> = {};
//         item.yarnStockDetails?.forEach((stock: any) => {
//           const yarnName = stock.yarnCode || "-";
//           if (!yarnGroups[yarnName]) {
//             yarnGroups[yarnName] = [];
//           }
//           yarnGroups[yarnName].push(stock);
//         });

//         Object.entries(yarnGroups).forEach(([yarnName, stocks]) => {
//           const totalQuantity = stocks.reduce((sum: number, stock: any) =>
//             sum + Number(stock.acceptedQty || 0), 0);
//           const returnQty =
//             purchaseReturnData
//               ?.filter((returnEntry: any) =>
//                 Number(returnEntry.purchaseOrderId) === Number(inward.purchaseOrderId)
//               )
//               ?.flatMap((entry: any) => entry.yarnItems || [])
//               ?.filter(
//                 (returnItem: any) =>
//                   Number(returnItem.purchaseInwardId) === Number(inward.id) &&
//                   returnItem.yarnName === yarnName
//               )
//               ?.reduce(
//                 (sum: number, returnItem: any) =>
//                   sum + Number(returnItem.returnQuantity || 0),
//                 0
//               ) || 0;
//           const returnTotalAmount =
//             purchaseReturnData
//               ?.filter((returnEntry: any) =>
//                 Number(returnEntry.purchaseOrderId) === Number(inward.purchaseOrderId)
//               )
//               ?.flatMap((entry: any) => entry.yarnItems || [])
//               ?.filter(
//                 (returnItem: any) =>
//                   Number(returnItem.purchaseInwardId) === Number(inward.id) &&
//                   returnItem.yarnName === yarnName
//               )
//               ?.reduce(
//                 (sum: number, returnItem: any) =>
//                   sum + Number(returnItem.totalAmount || 0),
//                 0
//               ) || 0;
//           const warehouse = warehouseList?.find(
//             (wh: any) => Number(wh.id) === Number(stocks[0].warehouseId)
//           )?.warehouseName || "-";

//           stocks.forEach((stock: any, stockIndex: number) => {
//             const isYarnGroupFirst = stockIndex === 0;
//             inwardRows.push({
//               productName: isYarnGroupFirst ? yarnName : "-",
//               quantity: isYarnGroupFirst ? totalQuantity : 0,
//               totalAmount: isYarnGroupFirst ? Number(item.totalAmount || 0) : 0,
//               warehouse: warehouse,
//               mill: millName,
//               returnQty: isYarnGroupFirst ? returnQty : 0,
//               returnTotalAmount: isYarnGroupFirst ? returnTotalAmount : 0,
//               yarnGroupLength: stocks.length,
//               isYarnGroupFirst: isYarnGroupFirst
//             });
//           });
//         });
//       });

//       if (inwardRows.length === 0) return;

//       const firstMill = inwardRows[0].mill;
//       const firstWarehouse = inwardRows[0].warehouse;
//       const allSameMill = inwardRows.every((row: any) => row.mill === firstMill);
//       const allSameWarehouse = inwardRows.every((row: any) => row.warehouse === firstWarehouse);

//       inwardRows.forEach((row: any, index: number) => {
//         const isOverallFirst = index === 0;

//         let millRowSpan = 0;
//         let warehouseRowSpan = 0;
//         let showMill = false;
//         let showWarehouse = false;

//         if (allSameMill) {
//           if (isOverallFirst) {
//             showMill = true;
//             millRowSpan = inwardRows.length;
//           }
//         } else {
//           if (row.isYarnGroupFirst) {
//             showMill = true;
//             millRowSpan = row.yarnGroupLength;
//           }
//         }

//         if (allSameWarehouse) {
//           if (isOverallFirst) {
//             showWarehouse = true;
//             warehouseRowSpan = inwardRows.length;
//           }
//         } else {
//           if (row.isYarnGroupFirst) {
//             showWarehouse = true;
//             warehouseRowSpan = row.yarnGroupLength;
//           }
//         }

//         flattenedRows.push({
//           id: `${inward.id}-${index}`,
//           serialNumber: isOverallFirst ? serialNumberCounter++ : null,
//           inwardNo: isOverallFirst ? inward.purchaseInwardNo : null,
//           inwardDate: isOverallFirst ? inward.inwardDate : null,
//           poNumber: isOverallFirst ? inward.purchaseOrderNo : null,
//           vendor: isOverallFirst
//             ? inward.vendorName || getVendorName(inward.vendorId) || "-"
//             : "-",
//           dcNumber: isOverallFirst ? inward.dcNumber || "-" : "-",
//           dcDate: isOverallFirst ? inward.dcDate || "-" : "-",

//           productName: row.productName,
//           quantity: row.quantity,
//           totalAmount: row.totalAmount,

//           mill: showMill ? row.mill : null,
//           warehouse: showWarehouse ? row.warehouse : null,

//           returnQty: row.returnQty,
//           returnTotalAmount: row.returnTotalAmount,

//           rowSpan: {
//             inwardNo: isOverallFirst ? inwardRows.length : 0,
//             inwardDate: isOverallFirst ? inwardRows.length : 0,
//             poNumber: isOverallFirst ? inwardRows.length : 0,
//             vendor: isOverallFirst ? inwardRows.length : 0,
//             dcNumber: isOverallFirst ? inwardRows.length : 0,
//             dcDate: isOverallFirst ? inwardRows.length : 0,
//             mill: millRowSpan,
//             warehouse: warehouseRowSpan,
//             productInfo: row.isYarnGroupFirst ? row.yarnGroupLength : 0
//           },
//           isYarnGroupFirst: row.isYarnGroupFirst
//         });
//       });
//     });
//     return flattenedRows;
//   };
//   const getMillName = (millNameId: number | null | undefined): string => {
//     if (!millNameId) return "";
//     return `Mill ${millNameId}`;
//   };
//   const getPurchaseOrdersForSalesOrder = (salesOrderId: number) => {
//     return purchaseOrderList.filter((po: any) =>
//       po.purchaseOrderItemsDtl?.some((item: any) =>
//         Number(item.salesOrderId) === Number(salesOrderId) &&
//         (item.yarnId || item.yarnName || Number(po.poTypeId) === 1 || po.poType?.toString().toLowerCase().includes('yarn'))
//       )
//     );
//   };
//   const getPurchaseInwardsForSalesOrder = (salesOrderId: number) => {
//     const yarnPurchaseInwards = purchaseInwardList.filter((inward: any) => {
//       const items = inward.purchaseInwardItemsDtl || inward.yarnStockDetails || [];
//       const hasYarnItem = items.some((item: any) => {
//         const yarnStockDetails = item.yarnStockDetails || [item];
//         return yarnStockDetails.some((stock: any) => stock.yarnId || stock.yarnName || item.yarnId || item.yarnName);
//       });
//       return Number(inward.poTypeId) === 1 || hasYarnItem || inward.poType?.toString().toLowerCase().includes('yarn');
//     });
//     if (yarnPurchaseInwards.length === 0) {
//       return [];
//     }
//     const directlyRelatedInwards = yarnPurchaseInwards.filter((inward: any) => {
//       const items = inward.purchaseInwardItemsDtl || inward.yarnStockDetails || [];
//       return items.some((item: any) => {
//         const yarnStockDetails = item.yarnStockDetails || [item];
//         return yarnStockDetails.some((stock: any) =>
//           Number(stock.salesOrderId) === Number(salesOrderId) || Number(item.salesOrderId) === Number(salesOrderId)
//         );
//       });
//     });
//     if (directlyRelatedInwards.length === 0) {
//       const relatedPurchaseOrders = getPurchaseOrdersForSalesOrder(salesOrderId);
//       const relatedPoNumbers = relatedPurchaseOrders.map((po: any) => po.poNo);
//       const poRelatedInwards = yarnPurchaseInwards.filter((inward: any) => {
//         return relatedPoNumbers.includes(inward.purchaseOrderNo);
//       });
//       if (poRelatedInwards.length > 0) {
//         return poRelatedInwards;
//       }
//     }
//     return directlyRelatedInwards;
//   };
//   const calculateRequiredQuantity = (
//     salesOrder: SalesOrderData,
//     yarnId: number,
//     useWarp: boolean = true,
//     useWeft: boolean = true
//   ): string => {
//     const toNumber = (value: any): number => {
//       const num = Number(value);
//       return isNaN(num) ? 0 : num;
//     };
//     let totalQuantity = 0;
//     salesOrder.items?.forEach((item: SalesOrderItem) => {
//       const orderQty = toNumber(item.orderQty);
//       const fabric = fabricMasters?.find((f: any) => f.fabricCode === item.fabricCode);
//       if (fabric) {
//         if (useWarp) {
//           const warpDetails = fabric.warpDetails?.filter((warp: any) => toNumber(warp.yarnId) === yarnId) || [];
//           warpDetails.forEach((warpDetail: any) => {
//             if (warpDetail.gramsPerMeter) {
//               totalQuantity += toNumber(warpDetail.gramsPerMeter) * orderQty;
//             }
//           });
//         }
//         if (useWeft) {
//           const weftDetails = fabric.weftDetails?.filter((weft: any) => toNumber(weft.yarnId) === yarnId) || [];
//           weftDetails.forEach((weftDetail: any) => {
//             if (weftDetail.gramsPerMeter) {
//               totalQuantity += toNumber(weftDetail.gramsPerMeter) * orderQty;
//             }
//           });
//         }
//       } else {
//         if (fabric) {
//           if (fabric.warpDetails && Array.isArray(fabric.warpDetails)) {
//             fabric.warpDetails.forEach((warp: any) => {
//               if (warp.gramsPerMeter) {
//                 totalQuantity += toNumber(warp.gramsPerMeter) * orderQty;
//               }
//             });
//           }
//           if (fabric.weftDetails && Array.isArray(fabric.weftDetails)) {
//             fabric.weftDetails.forEach((weft: any) => {
//               if (weft.gramsPerMeter) {
//                 totalQuantity += toNumber(weft.gramsPerMeter) * orderQty;
//               }
//             });
//           }
//         }
//       }
//     });
//     return totalQuantity > 0 ? totalQuantity.toFixed(2) : '';
//   };
//   const getWeavingContractsForSalesOrder = (salesOrderId: number) => {
//     const id = Number(salesOrderId);
//     return weavingContractList.filter((wc: any) =>
//       Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
//     );
//   };
//   const validateWeavingContractExists = (salesOrderId: number): boolean => {
//     // If we are still in the initial loading phase and have no data, 
//     // we should block navigation to be safe.
//     if (isLoadingWeavingContracts && (!weavingContractList || (Array.isArray(weavingContractList) && weavingContractList.length === 0))) {
//       return false;
//     }

//     const weavingContracts = getWeavingContractsForSalesOrder(salesOrderId);

//     // If no contracts are found for this specific sales order
//     if (weavingContracts.length === 0) {
//       return false;
//     }

//     // Validate that at least one contract has a valid number (not 0 or empty)
//     return weavingContracts.some((wc: any) => {
//       const weavingContractNo = wc.weavingContractNo || wc.contractNo;
//       return weavingContractNo && weavingContractNo !== 0 && weavingContractNo !== "0";
//     });
//   };
//   const getBeamOutwardsForSalesOrder = (salesOrderId: number) => {
//     const id = Number(salesOrderId);
//     // Get weaving contracts for this sales order using robust filtering
//     const relatedContracts = weavingContractList.filter((wc: any) =>
//       Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
//     );
//     // Get weaving contract IDs
//     const contractIds = relatedContracts.map((wc: any) => Number(wc.id));

//     return (Array.isArray(beamOutwardList) ? beamOutwardList : []).filter((bo: any) => {
//       // Match by direct salesOrderId
//       const matchByOrderId = Number(bo.salesOrderId) === id;

//       // Match by weavingContractId (more robust for process flow)
//       const matchByContractId = bo.weavingContractId && contractIds.includes(Number(bo.weavingContractId));

//       // Also check if any of the details match the sales order or related contracts
//       const matchInDetails = Array.isArray(bo.outwardDetails) && bo.outwardDetails.some((detail: any) =>
//         Number(detail.salesOrderId) === id || (detail.weavingContractId && contractIds.includes(Number(detail.weavingContractId)))
//       );

//       return matchByOrderId || matchByContractId || matchInDetails;
//     });
//   };
//   const getWeftIssuesForSalesOrder = (salesOrderId: number) => {
//     const id = Number(salesOrderId);
//     // Get weaving contracts for this sales order using robust filtering
//     const relatedContracts = weavingContractList.filter((wc: any) =>
//       Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
//     );
//     // Get weaving contract IDs
//     const contractIds = relatedContracts.map((wc: any) => wc.id);
//     // Filter weft issues by weaving contract IDs
//     return weavingYarnIssuetList.filter((wyi: any) =>
//       contractIds.includes(wyi.weavingContractId)
//     );
//   };
//   const getFabricReceivesForSalesOrder = (salesOrderId: number) => {
//     const id = Number(salesOrderId);
//     // Get weaving contracts for this sales order using robust filtering
//     const relatedContracts = weavingContractList.filter((wc: any) =>
//       Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
//     );
//     // Get weaving contract IDs
//     const contractIds = relatedContracts.map((wc: any) => wc.id);
//     // Filter fabric receives by weaving contract IDs
//     return jobworkFabricReceiveList.filter((jfr: any) =>
//       contractIds.includes(jfr.weavingContractId)
//     );
//   };
//   const transformWeavingContractData = (weavingContracts: any[]) => {
//     const transformedRows: any[] = [];
//     let serialNumber = 1;
//     weavingContracts.forEach((contract: any) => {
//       const vendor = vendorList.find((v: any) => v.id === contract.vendorId);
//       const vendorName = vendor?.vendorName || 'Unknown Vendor';
//       if (contract.items && contract.items.length > 0) {
//         contract.items.forEach((item: any) => {
//           const fabric = fabricMasters.find((f: any) => f.id === item.fabricCodeId);
//           const fabricCode = fabric?.fabricCode || 'Unknown Fabric';
//           const quality = fabric?.fabricQuality || 'N/A';
//           transformedRows.push({
//             serialNumber,
//             contractDate: contract.contractDate || '',
//             weavingContractNo: contract.weavingContractNo,
//             vendorName,
//             fabricCode,
//             quality,
//             pickRate: item.pickCost || 0,
//             quantity: item.quantity || 0,
//             status: contract.isComplete === 1 ? 'Completed' : 'Open'
//           });
//           serialNumber++;
//         });
//       }
//     });
//     return transformedRows;
//   };
//   const transformBeamOutwardData = (beamOutwards: any[], salesOrderId: number) => {
//     // Group beam outwards by sizing plan (or plan id) and then by weaving contract
//     const groupedRows: Record<string, any> = {};
//     beamOutwards.forEach((beamOutward: any) => {
//       const sizingVendor = vendorList.find((v: any) => Number(v.id) === Number(beamOutward.sizingVendorId));
//       const outwardDetails = Array.isArray(beamOutward.outwardDetails) ? beamOutward.outwardDetails : [];
//       let weavingVendorId = beamOutward.weavingVendorId;
//       if (outwardDetails.length > 0) {
//         const detailVendor = outwardDetails.find((detail: any) => detail.weavingVendorId != null);
//         if (detailVendor) {
//           weavingVendorId = detailVendor.weavingVendorId;
//         }
//       }
//       const weaver = vendorList.find((v: any) => Number(v.id) === Number(weavingVendorId));
//       const sizingPlan = sizingPlanList.find((sp: any) => Number(sp.id) === Number(beamOutward.sizingPlanId));
//       const planNo = sizingPlan?.sizingPlanNo || beamOutward.sizingPlanNo || `Plan ${beamOutward.sizingPlanId}`;
//       const groupKey = String(beamOutward.sizingPlanId || planNo).trim();

//       if (!groupedRows[groupKey]) {
//         groupedRows[groupKey] = {
//           outwardDates: new Set<string>(),
//           outwardNos: new Set<string>(),
//           contracts: {} as Record<string, any>,
//           serialNumber: 0,
//           sizingVendorName: sizingVendor?.vendorName || `Vendor ${beamOutward.sizingVendorId}`,
//           defaultWeavingVendorId: weavingVendorId,
//           sizingPlanNo: planNo,
//           beamMeter: 0,
//           noOfBeams: 0,
//           rowCount: 0,
//         };
//       }

//       const group = groupedRows[groupKey];
//       group.outwardDates.add(beamOutward.outwardDate || "");
//       group.outwardNos.add(beamOutward.outwardNo || "");
//       group.beamMeter += Number(beamOutward.totalBeamMeters) || 0;
//       group.noOfBeams += Number(beamOutward.totalNoOfBeams) || 0;
//       group.rowCount = (group.rowCount || 0) + 1;

//       // Distribute outward details across weaving contracts when present
//       const details = Array.isArray(beamOutward.outwardDetails) ? beamOutward.outwardDetails : [];
//       if (details.length === 0) {
//         // Fallback to whole outward assigned to the actual weavingContractNo if available, else lookup by id
//         let contractNo = beamOutward.weavingContractNo || "";
//         if (!contractNo && beamOutward.weavingContractId) {
//           const wc = weavingContractList.find((w: any) => Number(w.id) === Number(beamOutward.weavingContractId));
//           contractNo = wc?.weavingContractNo || "";
//         }
//         const defaultContractKey = contractNo || "";
//         if (!group.contracts[defaultContractKey]) {
//           group.contracts[defaultContractKey] = {
//             beamMeter: 0,
//             noOfBeams: 0,
//             outwardDates: new Set<string>(),
//             outwardNos: new Set<string>(),
//             weavingVendorId: beamOutward.weavingVendorId,
//           };
//         }
//         group.contracts[defaultContractKey].beamMeter += Number(beamOutward.totalBeamMeters) || 0;
//         group.contracts[defaultContractKey].noOfBeams += Number(beamOutward.totalNoOfBeams) || 0;
//         group.contracts[defaultContractKey].outwardDates.add(beamOutward.outwardDate || "");
//         group.contracts[defaultContractKey].outwardNos.add(beamOutward.outwardNo || "");
//       } else {
//         details.forEach((d: any) => {
//           // Prefer explicit weavingContractNo on detail; fallback to lookup by id; else empty string
//           let contractKey = d.weavingContractNo || beamOutward.weavingContractNo || "";
//           if (!contractKey && d.weavingContractId) {
//             const wc = weavingContractList.find((w: any) => Number(w.id) === Number(d.weavingContractId));
//             contractKey = wc?.weavingContractNo || "";
//           }
//           const contractVendorId = d.weavingVendorId ?? beamOutward.weavingVendorId;
//           if (!group.contracts[contractKey]) {
//             group.contracts[contractKey] = {
//               beamMeter: 0,
//               noOfBeams: 0,
//               outwardDates: new Set<string>(),
//               outwardNos: new Set<string>(),
//               weavingVendorId: contractVendorId,
//             };
//           }
//           group.contracts[contractKey].beamMeter += Number(d.wrapMeters || 0);
//           // If detail doesn't have explicit noOfBeams, count the detail as one beam
//           const detailBeams = d.noOfBeams != null ? Number(d.noOfBeams) : 1;
//           group.contracts[contractKey].noOfBeams += detailBeams;
//           group.contracts[contractKey].weavingVendorId = group.contracts[contractKey].weavingVendorId ?? contractVendorId;
//           group.contracts[contractKey].outwardDates.add(beamOutward.outwardDate || "");
//           group.contracts[contractKey].outwardNos.add(beamOutward.outwardNo || "");
//         });
//       }
//     });

//     const computeBeamReturnForContract = (contractKey: string) => {
//       if (!contractKey) return 0;
//       return (salesReturnList || []).reduce((sum: number, sr: any) => {
//         const beamItems = Array.isArray(sr.beamItems) ? sr.beamItems : [];
//         return sum + beamItems.reduce((inner: number, item: any) => {
//           const itemContract = item.weavingContractNo || item.weavingContractNumber || "";
//           const itemContractId = item.weavingContractId != null ? String(item.weavingContractId) : "";
//           if (
//             String(itemContract) === String(contractKey) ||
//             String(itemContractId) === String(contractKey)
//           ) {
//             return inner + (Number(item.beamMeters) || 0);
//           }
//           return inner;
//         }, 0);
//       }, 0);
//     };

//     const rows: any[] = [];
//     Object.values(groupedRows).forEach((group: any) => {
//       const contractKeys = Object.keys(group.contracts || {});
//       const outwardDates = Array.from(group.outwardDates).filter(Boolean);
//       const outwardNos = Array.from(group.outwardNos).filter(Boolean);
//       const hasMultipleContracts = contractKeys.length > 1;
//       const showOutwardColumns = outwardDates.length === 1 && outwardNos.length === 1 && group.rowCount === 1 && !hasMultipleContracts;

//       contractKeys.forEach((ck: string) => {
//         const c = group.contracts[ck];
//         const beamMeter = Number(c.beamMeter || 0);
//         const beamReturn = computeBeamReturnForContract(ck);
//         const beamConsumed = parseFloat((beamMeter - beamReturn).toFixed(2));
//         const outwardDate = Array.from(c.outwardDates || []).filter(Boolean)[0] || "";
//         const outwardNo = Array.from(c.outwardNos || []).filter(Boolean)[0] || "";
//         rows.push({
//           outwardDate: showOutwardColumns ? outwardDate : "",
//           outwardNo: showOutwardColumns ? outwardNo : "",
//           sizingVendorName: group.sizingVendorName,
//           weaverName:
//             vendorList.find((v: any) => Number(v.id) === Number(c.weavingVendorId))?.vendorName ||
//             vendorList.find((v: any) => Number(v.id) === Number(group.defaultWeavingVendorId))?.vendorName ||
//             `Vendor ${c.weavingVendorId ?? group.defaultWeavingVendorId}`,
//           sizingPlanNo: group.sizingPlanNo,
//           beamMeter,
//           beamConsumed,
//           noOfBeams: Number(c.noOfBeams || 0),
//           weavingContractNo: ck || "-",
//           showOutwardColumns: showOutwardColumns && contractKeys.length === 1,
//         });
//       });
//     });

//     return rows.map((row: any, index: number) => ({ ...row, serialNumber: index + 1 }));
//   };
//   const transformSizingPlanData = (salesOrderId: number) => {
//     const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
//       sp.sizingBeamDetails?.some((beam: any) => beam.salesOrderId === salesOrderId)
//     );
//     const transformedRows: any[] = [];
//     let serialNumber = 1;
//     relevantSizingPlans.forEach((sp: any) => {
//       const vendor = vendorList.find((v: any) => v.id === sp.vendorId);
//       const vendorName = vendor?.vendorName || "-";
//       const yarnIssue = sizingYarnIssuetList?.find((issue: any) => issue.sizingPlanId === sp.id);
//       const yarnReqs = yarnIssue?.requirements || [];
//       const qualDetails = sp.sizingQualityDetails || [];
//       const beamDetails = Array.isArray(sp.sizingBeamDetails) ? sp.sizingBeamDetails : [];
//       const firstQuality = qualDetails[0] || {};
//       const firstBeam = beamDetails[0] || {};
//       if (yarnReqs.length > 0) {
//         yarnReqs.forEach((req: any, idx: number) => {
//           const qual = qualDetails[idx] || firstQuality;
//           const fabricQuality =
//             req?.fabricDetails?.quality ||
//             req?.quality ||
//             qual?.quality ||
//             firstQuality?.quality ||
//             "-";
//           const sortEnds =
//             qual?.sordEnds ??
//             qual?.actualEnds ??
//             firstQuality?.sordEnds ??
//             firstQuality?.actualEnds ??
//             0;
//           const meters =
//             req?.warpMeters ??
//             qual?.warpMeters ??
//             firstBeam?.warpMeters ??
//             0;
//           transformedRows.push({
//             id: `${sp.id}-${req.id || idx}`,
//             serialNumber: serialNumber++,
//             sizingPlanDate: sp.sizingPlanDate,
//             sizingPlanNo: sp.sizingPlanNo,
//             sizingVendorName: vendorName,
//             yarnName: (req.yarnId ? yarnMap[Number(req.yarnId)] : undefined) || req.yarnName || (typeof req.actualYarn === "string" ? req.actualYarn : undefined) || "-",
//             fabricQuality,
//             sortEnds,
//             meters,
//             yarnRequired: req.warpRequirement || 0,
//             issued: req.totalIssuedQty || 0,
//             balance: req.balanceToIssue || 0,
//             yarnReturn: yarnReturnMap[sp.sizingPlanNo] || 0
//           });
//           // alert(req.yarn);
//         });
//       } else if (qualDetails.length > 0) {
//         qualDetails.forEach((qual: any, idx: number) => {
//           const resolvedYarnName =

//             qual.yarnName ||
//             (qual.yarnId ? yarnMap[Number(qual.yarnId)] : undefined) ||
//             (qual.actualYarn && typeof qual.actualYarn === "string" ? qual.actualYarn : undefined) ||
//             "-";
//           console.log("qual.yarnName", qual.yarnName);
//           transformedRows.push({
//             id: `${sp.id}-qual-${idx}`,
//             serialNumber: serialNumber++,
//             sizingPlanDate: sp.sizingPlanDate,
//             sizingPlanNo: sp.sizingPlanNo,
//             sizingVendorName: vendorName,
//             yarnName: resolvedYarnName,
//             fabricQuality: qual.quality || "-",
//             sortEnds: qual.sordEnds || qual.actualEnds || 0,
//             meters: qual.warpMeters || 0,
//             yarnRequired: 0,
//             issued: 0,
//             balance: 0,
//             yarnReturn: yarnReturnMap[sp.sizingPlanNo] || 0
//           });
//         });
//         // alert("transformSizingPlanData");
//       } else {
//         transformedRows.push({
//           id: `${sp.id}-empty`,
//           serialNumber: serialNumber++,
//           sizingPlanDate: sp.sizingPlanDate,
//           sizingPlanNo: sp.sizingPlanNo,
//           sizingVendorName: vendorName,
//           yarnName: "-",
//           fabricQuality: "-",
//           sortEnds: 0,
//           meters: 0,
//           yarnRequired: 0,
//           issued: 0,
//           balance: 0,
//           yarnReturn: yarnReturnMap[sp.sizingPlanNo] || 0
//         });
//       }
//     });
//     return transformedRows;
//   };
//   const transformSizingBeamSummaryData = (salesOrderId: number) => {
//     const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
//       sp.sizingBeamDetails?.some((beam: any) => Number(beam.salesOrderId) === Number(salesOrderId))
//     );
//     const relatedBeamOutwards = getBeamOutwardsForSalesOrder(salesOrderId);
//     const relatedContracts = weavingContractList.filter((wc: any) =>
//       Number(wc.salesOrderId) === Number(salesOrderId) || Number(wc.salesOrderNo) === Number(salesOrderId)
//     );
//     const contractIds = relatedContracts.map((wc: any) => Number(wc.id));
//     const contractNos = relatedContracts.map((wc: any) => wc.weavingContractNo || wc.contractNo).filter(Boolean);
//     const transformedRows: any[] = [];
//     let serialNumber = 1;

//     relevantSizingPlans.forEach((sp: any) => {
//       const planBeamDetails = Array.isArray(sp.sizingBeamDetails) ? sp.sizingBeamDetails : [];
//       const planOutwards = relatedBeamOutwards.filter((bo: any) =>
//         Number(bo?.sizingPlanId) === Number(sp?.id) ||
//         (bo?.weavingContractId && contractIds.includes(Number(bo.weavingContractId))) ||
//         (bo?.weavingContractNo && contractNos.includes(bo.weavingContractNo))
//       );
//       const planInwards = (Array.isArray(beamInwardList) ? beamInwardList : [])
//         .filter((bi: any) => {
//           const matchPlan = Number(bi?.sizingPlanId) === Number(sp?.id) || bi?.sizingPlanNo === sp?.sizingPlanNo;
//           const matchContract = (bi?.weavingContractId && contractIds.includes(Number(bi.weavingContractId))) ||
//             (bi?.weavingContractNo && contractNos.includes(bi.weavingContractNo));
//           const matchDetails = Array.isArray(bi?.beamInwardBeamDetails) && bi.beamInwardBeamDetails.some((d: any) =>
//             Number(d.sizingPlanId) === Number(sp?.id) ||
//             d.sizingPlanNo === sp?.sizingPlanNo ||
//             (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
//             (d.weavingContractNo && contractNos.includes(d.weavingContractNo))
//           );
//           return matchPlan || matchContract || matchDetails;
//         });

//       const beamsPlan =
//         Math.max(
//           0,
//           ...planBeamDetails.map((beam: any) => Number(beam?.noOfBeams) || 0)
//         ) || planBeamDetails.length || 0;

//       const beamsIssued = planOutwards.reduce(
//         (sum: number, bo: any) => sum + (Number(bo?.totalNoOfBeams) || 0),
//         0
//       );

//       const beamsReceived = planInwards.reduce((sum: number, inward: any) => {
//         const details = Array.isArray(inward?.beamInwardBeamDetails) ? inward.beamInwardBeamDetails : [];
//         if (details.length > 0) {
//           const matchingDetails = details.filter((d: any) =>
//             Number(d.sizingPlanId) === Number(sp?.id) ||
//             d.sizingPlanNo === sp?.sizingPlanNo ||
//             (!d.sizingPlanId && !d.sizingPlanNo) ||
//             (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
//             (d.weavingContractNo && contractNos.includes(d.weavingContractNo))
//           );
//           return sum + (matchingDetails.length || details.length);
//         }
//         return sum + Number(inward?.totalNoOfBeams || inward?.totalBeams || 0);
//       }, 0);

//       const beamMtrsFromOutward = planOutwards.reduce((sum: number, bo: any) => {
//         const details = Array.isArray(bo?.outwardDetails) ? bo.outwardDetails : [];
//         const matchingDetails = details.filter((d: any) =>
//           Number(d.sizingPlanId) === Number(sp?.id) ||
//           d.sizingPlanNo === sp?.sizingPlanNo ||
//           (!d.sizingPlanId && !d.sizingPlanNo) ||
//           (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
//           (d.weavingContractNo && contractNos.includes(d.weavingContractNo))
//         );
//         const beamMtrs = matchingDetails.reduce((inner: number, d: any) => inner + (Number(d?.wrapMeters) || 0), 0);
//         return sum + (beamMtrs || Number(bo?.totalBeamMeters || bo?.wrapMeters || 0));
//       }, 0);

//       const beamMtrsFromInward = planInwards.reduce((sum: number, inward: any) => {
//         const details = Array.isArray(inward?.beamInwardBeamDetails) ? inward.beamInwardBeamDetails : [];
//         const matchingDetails = details.filter((d: any) =>
//           Number(d.sizingPlanId) === Number(sp?.id) ||
//           d.sizingPlanNo === sp?.sizingPlanNo ||
//           (!d.sizingPlanId && !d.sizingPlanNo) ||
//           (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
//           (d.weavingContractNo && contractNos.includes(d.weavingContractNo))
//         );
//         const beamMtrs = matchingDetails.reduce((inner: number, beam: any) => inner + (Number(beam?.wrapMeters) || 0), 0);

//         // Fallback to quality details if beam details meters are 0
//         if (beamMtrs === 0) {
//           const qualityDetails = Array.isArray(inward?.beamInwardQualityDetails) ? inward.beamInwardQualityDetails : [];
//           const matchingQuality = qualityDetails.filter((q: any) =>
//             Number(q.sizingPlanId) === Number(sp?.id) ||
//             q.sizingPlanNo === sp?.sizingPlanNo ||
//             (q.weavingContractId && contractIds.includes(Number(q.weavingContractId))) ||
//             (q.weavingContractNo && contractNos.includes(q.weavingContractNo))
//           );
//           return sum + (matchingQuality.length > 0
//             ? matchingQuality.reduce((inner: number, q: any) => inner + (Number(q?.wrapMeters) || 0), 0)
//             : qualityDetails.reduce((inner: number, q: any) => inner + (Number(q?.wrapMeters) || 0), 0));
//         }
//         return sum + beamMtrs;
//       }, 0);

//       const beamMeter = Math.max(beamMtrsFromInward, beamMtrsFromOutward) || 0;

//       // Calculate Beam Return from salesReturnList
//       const beamReturn = salesReturnList.reduce((sum: number, sr: any) => {
//         const beamItems = Array.isArray(sr.beamItems) ? sr.beamItems : [];
//         const planReturn = beamItems
//           .filter((item: any) =>
//             item.sizingPlanNo === sp.sizingPlanNo ||
//             (item.weavingContractId && contractIds.includes(Number(item.weavingContractId))) ||
//             (item.weavingContractNo && contractNos.includes(item.weavingContractNo))
//           )
//           .reduce((inner: number, item: any) => inner + (Number(item.beamMeters) || 0), 0);
//         return sum + planReturn;
//       }, 0);

//       const beamReturnCount = salesReturnList.reduce((sum: number, sr: any) => {
//         const beamItems = Array.isArray(sr.beamItems) ? sr.beamItems : [];
//         const matchedBeamItems = beamItems.filter((item: any) =>
//           item.sizingPlanNo === sp.sizingPlanNo ||
//           (item.weavingContractId && contractIds.includes(Number(item.weavingContractId))) ||
//           (item.weavingContractNo && contractNos.includes(item.weavingContractNo))
//         );
//         return sum + matchedBeamItems.length;
//       }, 0);

//       const beamUtilize = beamMeter - beamReturn;

//       transformedRows.push({
//         id: `beam-summary-${sp.id}`,
//         serialNumber: serialNumber++,
//         sizingPlanNo: sp.sizingPlanNo || "-",
//         beamsPlan,
//         beamsReceived,
//         beamsIssued,
//         beamMeter,
//         beamReturn,
//         returnedBeams: beamReturnCount,
//         beamUtilize,
//       });
//     });

//     return transformedRows;
//   };

//   const transformSizingYarnIssueData = (salesOrderId: number) => {
//     const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
//       sp.sizingBeamDetails?.some((beam: any) => Number(beam.salesOrderId) === Number(salesOrderId))
//     );
//     const sizingPlanIds = relevantSizingPlans.map((sp: any) => sp.id);

//     const relatedIssues = sizingYarnIssuetList.filter((issue: any) =>
//       sizingPlanIds.includes(issue.sizingPlanId)
//     );

//     // Group by sizing plan number and sum the required fields
//     const groupedBySizingPlan: Record<string, any> = {};

//     relatedIssues.forEach((issue: any) => {
//       const sizingPlan = relevantSizingPlans.find((sp: any) => sp.id === issue.sizingPlanId);
//       const sizingPlanNoValue = issue.sizingPlanNo || sizingPlan?.sizingPlanNo || String(issue.sizingPlanId) || "-";

//       // Initialize group if not exists
//       if (!groupedBySizingPlan[sizingPlanNoValue]) {
//         groupedBySizingPlan[sizingPlanNoValue] = {
//           sizingPlanNo: sizingPlanNoValue,
//           yarnRequired: 0,
//           issuedQty: 0,
//           balanceYarn: 0,
//           yarnReturn: 0,
//           consumed: 0
//         };
//       }

//       // Sum yarnRequired/balance from requirements (if present)
//       const requirements = issue.requirements || [];
//       requirements.forEach((req: any) => {
//         const yarnRequired = Number(req.warpRequirement || 0);
//         const balanceYarn = Number(req.balanceToIssue || 0);
//         groupedBySizingPlan[sizingPlanNoValue].yarnRequired += yarnRequired;
//         groupedBySizingPlan[sizingPlanNoValue].balanceYarn += balanceYarn;
//       });

//       // Prefer actual issued quantities from sizingYarnIssue entries (issueQty) when available
//       const sizingIssueEntries = Array.isArray(issue.sizingYarnIssue) ? issue.sizingYarnIssue : [];
//       const issueQtyFromEntries = sizingIssueEntries.reduce((sum: number, e: any) => {
//         return sum + (Number(e.issueQty || e.issueQty) || 0);
//       }, 0);

//       // Fallback to totals reported in requirements (totalIssuedQty) if sizingIssue entries are not present
//       const issuedQtyFromRequirements = requirements.reduce((sum: number, req: any) => {
//         return sum + (Number(req.totalIssuedQty || 0) || 0);
//       }, 0);

//       const finalIssuedQty = issueQtyFromEntries > 0 ? issueQtyFromEntries : issuedQtyFromRequirements;

//       const yarnReturn = yarnReturnMap[sizingPlanNoValue] || 0;
//       const consumed = finalIssuedQty - yarnReturn;

//       // Sum the values for this sizing plan
//       groupedBySizingPlan[sizingPlanNoValue].issuedQty += finalIssuedQty;
//       groupedBySizingPlan[sizingPlanNoValue].yarnReturn += yarnReturn;
//       groupedBySizingPlan[sizingPlanNoValue].consumed += consumed;
//     });

//     // Convert grouped object to array with serial numbers
//     const transformedRows: any[] = [];
//     let serialNumber = 1;
//     Object.values(groupedBySizingPlan).forEach((group: any) => {
//       transformedRows.push({
//         id: group.sizingPlanNo,
//         serialNumber: serialNumber++,
//         sizingPlanNo: group.sizingPlanNo,
//         yarnRequired: group.yarnRequired,
//         issuedQty: group.issuedQty,
//         balanceYarn: group.balanceYarn,
//         yarnReturn: group.yarnReturn,
//         consumed: group.consumed
//       });
//     });

//     return transformedRows;
//   };

//   const transformWeftIssueData = (weftIssues: any[]) => {
//     // Group by weaving contract number and sum the required fields
//     const groupedByContract: Record<string, any> = {};

//     weftIssues.forEach((weftIssue: any) => {
//       const vendor = vendorList.find((v: any) => v.id === weftIssue.vendorId);
//       const vendorName = vendor?.vendorName || 'Unknown Vendor';
//       const weavingContract = weavingContractList.find((wc: any) => wc.id === weftIssue.weavingContractId);
//       const weavingContractNo = weavingContract?.weavingContractNo || `Contract ${weftIssue.weavingContractId}`;

//       // Initialize group if not exists
//       if (!groupedByContract[weavingContractNo]) {
//         groupedByContract[weavingContractNo] = {
//           weavingContractNo,
//           vendorName,
//           yarnRequired: 0,
//           issuedQty: 0,
//           balanceYarn: 0,
//           yarnReturn: 0,
//           consumed: 0,
//           yarnNames: new Set<string>()
//         };
//       }

//       // Extract item names and issued quantities from requirements
//       if (weftIssue.requirements && Array.isArray(weftIssue.requirements)) {
//         weftIssue.requirements.forEach((req: any) => {
//           const yarnName = req.yarnName || req.actualYarn || '-';
//           const yarnRequired = Number(req.totalReqQty || 0) || 0;
//           const balanceToIssue = Number(req.balanceToIssue || (req.totalReqQty && req.totalReqQty - (req.totalIssueQty || 0)) || 0) || 0;

//           // Prefer actual issued quantities from nested yarnIssues entries (issueQty) when available
//           const yarnIssues = Array.isArray(req.yarnIssues) ? req.yarnIssues : [];
//           const issueQtyFromEntries = yarnIssues.reduce((sum: number, e: any) => {
//             return sum + (Number(e.issueQty || 0) || 0);
//           }, 0);

//           // Fallback to totals reported in requirements if yarnIssues entries are not present
//           const issuedQtyFromRequirements = Number(req.totalIssueQty || req.overallTotalIssueQty || 0) || 0;

//           const finalIssuedQty = issueQtyFromEntries > 0 ? issueQtyFromEntries : issuedQtyFromRequirements;

//           const yarnReturn = yarnReturnMap[weavingContractNo] || 0;
//           const consumed = finalIssuedQty - yarnReturn;

//           // Sum the values for this contract
//           groupedByContract[weavingContractNo].yarnRequired += yarnRequired;
//           groupedByContract[weavingContractNo].issuedQty += finalIssuedQty;
//           groupedByContract[weavingContractNo].balanceYarn += balanceToIssue;
//           groupedByContract[weavingContractNo].yarnReturn += yarnReturn;
//           groupedByContract[weavingContractNo].consumed += consumed;
//           groupedByContract[weavingContractNo].yarnNames.add(yarnName);
//         });
//       }
//     });

//     // Convert grouped object to array with serial numbers
//     const transformedRows: any[] = [];
//     let serialNumber = 1;
//     Object.values(groupedByContract).forEach((group: any) => {
//       const uniqueYarns = Array.from(group.yarnNames as Set<string>);
//       let itemName = 'Multiple Items';
//       if (uniqueYarns.length === 1) {
//         itemName = uniqueYarns[0];
//       } else if (uniqueYarns.length > 1) {
//         itemName = uniqueYarns.join(', ');
//       } else {
//         itemName = '-';
//       }

//       transformedRows.push({
//         serialNumber: serialNumber++,
//         weavingContractNo: group.weavingContractNo,
//         vendorName: group.vendorName,
//         itemName,
//         yarnRequired: group.yarnRequired,
//         issuedQty: group.issuedQty,
//         balanceYarn: group.balanceYarn,
//         yarnReturn: group.yarnReturn,
//         consumed: group.consumed
//       });
//     });

//     return transformedRows;
//   };
//   const transformFabricReceiveData = (fabricReceives: any[]) => {
//     const transformedRows: any[] = [];
//     let serialNumber = 1;
//     fabricReceives.forEach((fabricReceive: any) => {
//       const vendor = vendorList.find((v: any) => v.id === fabricReceive.vendorId);
//       const vendorName = vendor?.vendorName || 'Unknown Vendor';

//       let totalPieces = 0;
//       let totalMeters = 0;
//       let totalInspectedMtr = 0;
//       let totalNetWgt = 0;

//       if (fabricReceive.jobworkFabricReceiveItemsDtl && Array.isArray(fabricReceive.jobworkFabricReceiveItemsDtl)) {
//         fabricReceive.jobworkFabricReceiveItemsDtl.forEach((item: any) => {
//           if (item.pieceEntries && Array.isArray(item.pieceEntries)) {
//             totalPieces += item.pieceEntries.length;
//             item.pieceEntries.forEach((piece: any) => {
//               const pieceQuantity = Number(piece.quantity || piece.pieceMeter || 0);
//               const inspectedMeters = Number(piece.inspectedMtr || 0);
//               const inspectedNetWeight = Number(piece.inspectedNtWt || 0);
//               totalMeters += pieceQuantity;
//               totalInspectedMtr += inspectedMeters;
//               totalNetWgt += inspectedNetWeight;
//             });
//           }
//         });
//       }

//       // Fetch Beam Outward data using weavingContractId for Crimp% calculation
//       const beamOutwardData = (Array.isArray(beamOutwardList) ? beamOutwardList : []).find(
//         (bo: any) => Number(bo.weavingContractId) === Number(fabricReceive.weavingContractId)
//       );

//       const beamMeter = Number(beamOutwardData?.totalBeamMeters || 0);
//       const totalMeter = totalMeters;

//       // Crimp % = ((totalBeamMeters - totalMtr) / totalBeamMeters) * 100
//       const crimpPercentage =
//         beamMeter > 0
//           ? ((beamMeter - totalMeter) / beamMeter) * 100
//           : 0;

//       transformedRows.push({
//         serialNumber: serialNumber++,
//         receiveNo: fabricReceive.receiveNo,
//         receiveDate: fabricReceive.jobFabricReceiveDate,
//         weavingContractNo: fabricReceive.weavingContractNo,
//         weaverName: fabricReceive.weaverName || vendorName,
//         vendorName,
//         fabricDetails: fabricReceive.fabricDetails,
//         totalPieces,
//         totalMeters,
//         totalInspectedMtr,
//         totalNetWgt,
//         totalAvgWgt: totalInspectedMtr > 0 ? totalNetWgt / totalInspectedMtr : (totalMeters > 0 ? totalNetWgt / totalMeters : 0),
//         crimpPercentage,
//         fabricReceiveId: fabricReceive.id
//       });
//     });
//     return transformedRows;
//   };
//   const calculateWeavingSummary = (fabricReceiveRows: any[]) => {
//     const totalPieces = fabricReceiveRows.reduce((sum: number, row: any) => sum + (Number(row?.totalPieces) || 0), 0);
//     const totalDoffedMtr = fabricReceiveRows.reduce((sum: number, row: any) => sum + (Number(row?.totalMeters) || 0), 0);
//     const totalInspectedMtr = fabricReceiveRows.reduce((sum: number, row: any) => sum + (Number(row?.totalInspectedMtr) || 0), 0);
//     const totalNetWeight = fabricReceiveRows.reduce((sum: number, row: any) => sum + (Number(row?.totalNetWgt) || 0), 0);

//     const totalAvgWgt = totalInspectedMtr > 0
//       ? totalNetWeight / totalInspectedMtr
//       : (totalDoffedMtr > 0 ? totalNetWeight / totalDoffedMtr : 0);

//     const crimpRows = fabricReceiveRows
//       .map((row: any) => Number(row?.crimpPercentage))
//       .filter((value: number) => Number.isFinite(value));
//     const avgCrimpPercentage = crimpRows.length > 0
//       ? crimpRows.reduce((sum: number, value: number) => sum + value, 0) / crimpRows.length
//       : 0;

//     return {
//       totalPieces,
//       totalDoffedMtr,
//       totalInspectedMtr,
//       totalNetWeight,
//       totalAvgWgt,
//       avgCrimpPercentage
//     };
//   };
//   const getYarnPurchaseSummary = (salesOrderId: number) => {
//     const purchaseOrders = getPurchaseOrdersForSalesOrder(salesOrderId);
//     const purchaseInwards = getPurchaseInwardsForSalesOrder(salesOrderId);
//     const salesOrder = tabFilteredOrders.find((order: SalesOrderData) => order.id === salesOrderId);
//     const yarnSummaryMap = new Map<string, {
//       yarnCount: string;
//       requiredQty: number;
//       orderedQty: number;
//       inwardQty: number;
//     }>();
//     purchaseOrders.forEach((po: any) => {
//       po.purchaseOrderItemsDtl?.forEach((item: any) => {
//         const yarnKey = item.yarnName || 'Unknown';
//         const existing = yarnSummaryMap.get(yarnKey) || {
//           yarnCount: yarnKey,
//           requiredQty: 0,
//           orderedQty: 0,
//           inwardQty: 0
//         };
//         existing.orderedQty += Number(item.quantity || 0);
//         if (salesOrder && item.yarnId) {
//           const requiredQtyStr = calculateRequiredQuantity(salesOrder, Number(item.yarnId), true, true);
//           existing.requiredQty = Number(requiredQtyStr) || 0;
//         }
//         yarnSummaryMap.set(yarnKey, existing);
//       });
//     });
//     purchaseInwards.forEach((inward: any) => {
//       const items = inward.purchaseInwardItemsDtl || [];
//       items.forEach((item: any) => {
//         item.yarnStockDetails?.forEach((stock: any) => {
//           const yarnKey = stock.yarnCode || stock.productName || 'Unknown';
//           const existing = yarnSummaryMap.get(yarnKey) || {
//             yarnCount: yarnKey,
//             requiredQty: 0,
//             orderedQty: 0,
//             inwardQty: 0
//           };
//           existing.inwardQty += Number(stock.inwardQty || stock.acceptedQty || 0);
//           yarnSummaryMap.set(yarnKey, existing);
//         });
//       });
//     });
//     const summaryData = Array.from(yarnSummaryMap.values()).map(item => ({
//       ...item,
//       balanceQty: item.orderedQty - item.inwardQty
//     }));
//     return summaryData;
//   };
//   const handleSalesOrderClick = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;
//     // Clear any existing timeout
//     if (navigationTimeoutRef.current) {
//       clearTimeout(navigationTimeoutRef.current);
//     }
//     setExpandedRowId((prevExpanded) => {
//       const isClosing = prevExpanded === salesOrder.id;
//       if (isClosing) {
//         setViewMode(prev => ({ ...prev, [salesOrder.id]: false }));
//         setWeavingViewMode(prev => ({ ...prev, [salesOrder.id]: false }));
//         setSizingViewMode(prev => ({ ...prev, [salesOrder.id]: false }));
//         setActiveSubTab("yarnPurchase");
//         return null;
//       }
//       setViewMode(prev => ({ ...prev, [salesOrder.id]: true }));
//       setWeavingViewMode(prev => ({ ...prev, [salesOrder.id]: true }));
//       setSizingViewMode(prev => ({ ...prev, [salesOrder.id]: true }));
//       return salesOrder.id;
//     });
//   }, [isNavigating]);
//   const handleGeneratePurchaseOrder = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;
//     setIsNavigating(true);
//     const firstItem =
//       salesOrder.items && salesOrder.items.length > 0
//         ? salesOrder.items[0]
//         : null;
//     navigate(
//       "/transaction/purchase-order?purchaseOrderId=0&purchaseOrderItemId=0",
//       {
//         state: {
//           fromOrderEntry: true,
//           salesOrderId: salesOrder.id,
//           salesOrderNo: salesOrder.salesOrderNo,
//           activeTab,
//           expandedRowId: salesOrder.id,
//           flowType: 'yarnPurchase',
//           selectedHyperlink: 'purchaseOrder',
//           autoFetchSalesOrderNo: true,
//           salesOrderData: {
//             salesOrderNo: salesOrder.salesOrderNo,
//             fabricCode: firstItem?.fabricCode || "",
//             quality: firstItem?.quality || firstItem?.buyerProduct || "",
//             customerId: salesOrder.buyerCustomerName,
//           },
//         },
//       }
//     );
//     // Reset navigation state after a delay
//     setTimeout(() => setIsNavigating(false), 300);
//   }, [isNavigating, activeTab]);
//   const handleGeneratePurchaseInward = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;
//     const purchaseOrders = getPurchaseOrdersForSalesOrder(salesOrder.id);
//     if (purchaseOrders.length === 0) {
//       toast.error("No Purchase Order found for this Sales Order. Please create a Purchase Order first.");
//       return;
//     }
//     const firstPurchaseOrder = purchaseOrders[0];
//     if (Number(firstPurchaseOrder.isApproved) !== 1) {
//       toast.error(`Purchase Order ${firstPurchaseOrder.poNo} is not approved. Please approve the Purchase Order before generating Purchase Inward.`);
//       return;
//     }
//     setIsNavigating(true);
//     navigate("/transaction/purchase-inward", {
//       state: {
//         fromOrderEntry: true,
//         poType: "Yarn",
//         salesOrderId: salesOrder.id,
//         salesOrderNo: salesOrder.salesOrderNo,
//         expandedRowId: salesOrder.id,
//         activeTab,
//         flowType: 'yarnPurchase',
//         selectedHyperlink: 'purchaseInward',
//         vendorId: firstPurchaseOrder?.vendorId,
//         vendorName: firstPurchaseOrder ? getVendorName(firstPurchaseOrder.vendorId) : null,
//         purchaseOrderId: firstPurchaseOrder?.id,
//         purchaseOrderNo: firstPurchaseOrder?.poNo,
//       },
//     });
//     // Reset navigation state after a delay
//     setTimeout(() => setIsNavigating(false), 300);
//   }, [isNavigating, activeTab]);
//   const handleGenerateWeavingContract = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;
//     setIsNavigating(true);
//     navigate("/transaction/weaving-contract-entry", {
//       state: {
//         source: 'order-entry-management',
//         salesOrderId: salesOrder.id,
//         salesOrderNo: salesOrder.salesOrderNo,
//         flowType: 'weaving',
//         selectedHyperlink: 'weavingContract',
//         activeTab
//       }
//     });
//     // Reset navigation state after a delay
//     setTimeout(() => setIsNavigating(false), 300);
//   }, [isNavigating, activeTab]);
//   const handleGenerateBeamOutward = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;

//     if (isLoadingWeavingContracts) {
//       toast.info("Loading contract data, please try again in a moment.");
//       return;
//     }

//     // Show toast and block navigation if Weaving Contract does not exist
//     if (!validateWeavingContractExists(salesOrder.id)) {
//       toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
//       return;
//     }

//     setIsNavigating(true);
//     navigate("/transaction/beam-outward", {
//       state: {
//         source: 'order-entry-management',
//         salesOrderId: salesOrder.id,
//         salesOrderNo: salesOrder.salesOrderNo,
//         flowType: 'weaving',
//         selectedHyperlink: 'beamOutward',
//         activeTab
//       }
//     });
//     // Reset navigation state after a delay
//     setTimeout(() => setIsNavigating(false), 300);
//   }, [isNavigating, isLoadingWeavingContracts, weavingContractList, activeTab]);
//   const handleGenerateWeftIssue = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;

//     if (isLoadingWeavingContracts) {
//       toast.info("Loading contract data, please try again in a moment.");
//       return;
//     }

//     // Show toast and block navigation if Weaving Contract does not exist
//     if (!validateWeavingContractExists(salesOrder.id)) {
//       toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
//       return;
//     }

//     // Get weaving contracts for this sales order to find vendor and contract info
//     const weavingContracts = getWeavingContractsForSalesOrder(salesOrder.id);
//     // Use the first active weaving contract to get vendor and contract details
//     const firstContract = weavingContracts.find((wc: any) => wc.isComplete !== 1) || weavingContracts[0];

//     // Construct fabric details string
//     let fabricDetails = "";
//     if (firstContract?.items && firstContract.items.length > 0) {
//       fabricDetails = firstContract.items.map((item: any) => {
//         const fabric = fabricMasters?.find((f: any) => f.id === item.fabricCodeId);
//         const fabricCode = fabric?.fabricCode || item.fabricCodeId;
//         const fabricQuality = fabric?.fabricQuality || item.fabricQualityId;
//         return `${fabricCode} - ${fabricQuality}`;
//       }).join(', ');
//     }

//     setIsNavigating(true);
//     navigate("/transaction/weaving-yarn-issue", {
//       state: {
//         source: 'order-entry-management',
//         salesOrderId: salesOrder.id,
//         salesOrderNo: salesOrder.salesOrderNo,
//         weavingContractId: firstContract?.id,
//         vendorId: firstContract?.vendorId,
//         fabricDetails: fabricDetails,
//         flowType: 'weaving',
//         selectedHyperlink: 'weftIssue',
//         activeTab
//       }
//     });
//     // Reset navigation state after a delay
//     setTimeout(() => setIsNavigating(false), 300);
//   }, [isNavigating, isLoadingWeavingContracts, weavingContractList, activeTab, fabricMasters]);
//   const handleGenerateFabricReceived = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;

//     if (isLoadingWeavingContracts) {
//       toast.info("Loading contract data, please try again in a moment.");
//       return;
//     }

//     // Show toast and block navigation if Weaving Contract does not exist
//     if (!validateWeavingContractExists(salesOrder.id)) {
//       toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
//       return;
//     }

//     setIsNavigating(true);
//     // Get weaving contracts for this sales order to find vendor and contract info
//     const weavingContracts = getWeavingContractsForSalesOrder(salesOrder.id);
//     // Use the first active weaving contract to get vendor and contract details
//     const firstContract = weavingContracts.find((wc: any) => wc.isComplete !== 1) || weavingContracts[0];
//     const stateData: any = {
//       source: 'order-entry-management',
//       salesOrderId: salesOrder.id,
//       salesOrderNo: salesOrder.salesOrderNo,
//       flowType: 'weaving',
//       selectedHyperlink: 'fabricReceived',
//       activeTab
//     };
//     // Add vendor data if available
//     if (firstContract?.vendorId) {
//       stateData.vendorId = firstContract.vendorId;
//       stateData.vendorName = getVendorName(firstContract.vendorId);
//     }
//     // Add weaving contract data if available
//     if (firstContract?.id) {
//       stateData.weavingContractId = firstContract.id;
//       stateData.weavingContractNo = firstContract.weavingContractNo || firstContract.contractNo;
//     }
//     navigate("/transaction/jobwork-fabric-receive", {
//       state: stateData
//     });
//     // Reset navigation state after a delay
//     setTimeout(() => setIsNavigating(false), 300);
//   }, [isNavigating, isLoadingWeavingContracts, weavingContractList, activeTab]);
//   const handleGenerateSizingPlan = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;

//     if (isLoadingWeavingContracts) {
//       toast.info("Loading contract data, please try again in a moment.");
//       return;
//     }

//     if (!validateWeavingContractExists(salesOrder.id)) {
//       toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
//       return;
//     }
//     setIsNavigating(true);
//     const firstItem =
//       salesOrder.items && salesOrder.items.length > 0
//         ? salesOrder.items[0]
//         : null;
//     navigate(
//       "/transaction/sizing-plan-entry",
//       {
//         state: {
//           source: 'order-entry-management',
//           salesOrderId: salesOrder.id,
//           salesOrderNo: salesOrder.salesOrderNo,
//           activeTab,
//           expandedRowId: salesOrder.id,
//           flowType: 'sizing',
//           selectedHyperlink: 'sizingPlan',
//           salesOrderData: {
//             salesOrderNo: salesOrder.salesOrderNo,
//             fabricCode: firstItem?.fabricCode || "",
//             quality: firstItem?.quality || firstItem?.buyerProduct || "",
//             customerId: salesOrder.buyerCustomerName,
//           },
//         },
//       }
//     );
//     // Reset navigation state after a delay
//     setTimeout(() => setIsNavigating(false), 300);
//   }, [isNavigating, activeTab, isLoadingWeavingContracts, weavingContractList]);
//   const handleGenerateSizingYarnIssue = useCall((salesOrder: SalesOrderData) => {
//     if (isNavigating) return;

//     if (isLoadingWeavingContracts) {
//       toast.info("Loading contract data, please try again in a moment.");
//       return;
//     }

//     if (!validateWeavingContractExists(salesOrder.id)) {
//       toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
//       return;
//     }

//     const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
//       sp.sizingBeamDetails?.some((beam: any) => Number(beam.salesOrderId) === Number(salesOrder.id))
//     );

//     if (relevantSizingPlans.length === 0) {
//       toast.error("No Sizing Plan found for this Sales Order. Please create a Sizing Plan first.");
//       return;
//     }

//     setIsNavigating(true);

//     const firstPlan = relevantSizingPlans[0];

//     navigate("/transaction/sizing-yarn-issue", {
//       state: {
//         source: 'order-entry-management',
//         salesOrderId: salesOrder.id,
//         salesOrderNo: salesOrder.salesOrderNo,
//         activeTab,
//         expandedRowId: salesOrder.id,
//         flowType: 'sizing',
//         selectedHyperlink: 'sizingYarnIssue',
//         sizingPlanId: firstPlan.id,
//         vendorId: firstPlan.vendorId,
//       },
//     });
//     setTimeout(() => setIsNavigating(false), 300);
//   }, [isNavigating, activeTab, sizingPlanList, isLoadingWeavingContracts, weavingContractList]);
//   /* ─── Columns definition (unchanged logic) ─── */
//   const columns = useMemo(
//     () => [
//       {
//         Header: "S.No",
//         accessor: "sNo",
//         width: 60,
//         minWidth: 60,
//         Cell: (props: any) => props.row.index + 1,
//         disableFilters: true,
//       },
//       {
//         Header: "SO Date",
//         accessor: "orderDate",
//         width: 110,
//         minWidth: 110,
//         Cell: (props: any) =>
//           props.value ? formatDate(props.value) : "",
//       },
//       {
//         Header: "Sales Order No",
//         accessor: "salesOrderNo",
//         width: 160,
//         minWidth: 160,
//         Cell: (props: any) => {
//           const salesOrder = props.row.original;
//           const isExpanded = expandedRowId === salesOrder.id;
//           return (
//             <button
//               onClick={() => handleSalesOrderClick(salesOrder)}
//               disabled={isNavigating}
//               className={`text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600 transition-all duration-150 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed ${isExpanded ? 'text-blue-800 decoration-blue-600' : ''
//                 }`}
//             >
//               <span className="inline-flex items-center gap-1">
//                 <span>{salesOrder.salesOrderNo}</span>
//                 <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                 </svg>
//               </span>
//             </button>
//           );
//         },
//       },
//       {
//         Header: "Customer Name",
//         accessor: "buyerCustomerName",
//         minWidth: 180,
//       },
//       {
//         Header: "Customer PO No",
//         accessor: "buyerPoNo",
//         width: 150,
//         minWidth: 150,
//       },
//       {
//         Header: "Sort No",
//         accessor: "items",
//         width: 130,
//         minWidth: 130,
//         Cell: (props: any) =>
//           props.value?.length > 0 ? props.value[0]?.fabricCode || "" : "",
//       },
//       {
//         Header: "Construction",
//         accessor: "items",
//         minWidth: 180,
//         Cell: (props: any) =>
//           props.value?.length > 0 ? props.value[0]?.buyerProduct || "" : "",
//       },
//       {
//         Header: "Order Qty",
//         accessor: "items",
//         width: 110,
//         minWidth: 110,
//         cellClassName: "text-center tabular-nums",
//         Cell: (props: any) =>
//           props.value?.length > 0 ? props.value[0]?.orderQty || 0 : 0,
//       },
//       {
//         Header: "Dispatched Qty",
//         accessor: "dispatchedQuantity",
//         width: 120,
//         minWidth: 120,
//         cellClassName: "text-center tabular-nums",
//         Cell: () => 0,
//       },
//       {
//         Header: "Balance Qty",
//         accessor: "balanceQuantity",
//         width: 110,
//         minWidth: 110,
//         cellClassName: "text-center tabular-nums",
//         Cell: (props: any) => {
//           const salesOrder = props.row.original;
//           const orderQty =
//             salesOrder.items?.length > 0
//               ? salesOrder.items[0]?.orderQty || 0
//               : 0;
//           return orderQty;
//         },
//       },
//       {
//         Header: "Status",
//         accessor: "status",
//         width: 90,
//         minWidth: 90,
//         cellClassName: "text-center",
//         Cell: () => (
//           <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 tracking-wide">
//             Open
//           </span>
//         ),
//       },
//     ],
//     [expandedRowId, isNavigating]
//   );
//   /* ─── Empty state component ─── */
//   const EmptyState = ({ message }: { message: string }) => (
//     <div className="flex flex-col items-center justify-center py-7 px-6 bg-slate-50/50">
//       <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
//         <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//         </svg>
//       </div>
//       <p className="text-[12.5px] font-medium text-slate-400">{message}</p>
//     </div>
//   );
//   /* ─── Section card wrapper ─── */
//   const SectionCard = ({
//     icon,
//     title,
//     actionLabel,
//     onAction,
//     accentColor = "blue",
//     children,
//     showActionNearTitle = false,
//   }: {
//     icon: React.ReactNode;
//     title: string;
//     actionLabel?: string;
//     onAction?: () => void;
//     accentColor?: "blue" | "violet" | "emerald" | "amber" | "slate";
//     children: React.ReactNode;
//     showActionNearTitle?: boolean;
//   }) => {
//     const accent = {
//       blue: {
//         bar: "bg-blue-800",
//         badge: "bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100 hover:text-blue-800",
//         header: "bg-white border-slate-100",
//         icon: "text-blue-400",
//         iconBg: "bg-blue-50",
//       },
//       violet: {
//         bar: "bg-violet-500",
//         badge: "bg-violet-50 text-violet-700 border-violet-200/80 hover:bg-violet-100 hover:text-violet-800",
//         header: "bg-white border-slate-100",
//         icon: "text-violet-400",
//         iconBg: "bg-violet-50",
//       },
//       emerald: {
//         bar: "bg-emerald-500",
//         badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 hover:text-emerald-800",
//         header: "bg-white border-slate-100",
//         icon: "text-emerald-400",
//         iconBg: "bg-emerald-50",
//       },
//       amber: {
//         bar: "bg-amber-500",
//         badge: "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100 hover:text-amber-800",
//         header: "bg-white border-slate-100",
//         icon: "text-amber-400",
//         iconBg: "bg-amber-50",
//       },
//       slate: {
//         bar: "bg-slate-500",
//         badge: "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:text-slate-800",
//         header: "bg-white border-slate-100",
//         icon: "text-slate-400",
//         iconBg: "bg-slate-50",
//       },
//     }[accentColor] || {
//       bar: "bg-slate-500",
//       badge: "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:text-slate-800",
//       header: "bg-white border-slate-100",
//       icon: "text-slate-400",
//       iconBg: "bg-slate-50",
//     };
//     return (
//       <div className="rounded-lg border border-slate-200/80 overflow-hidden bg-white shadow-sm">
//         {/* Card header */}
//         <div className={`flex items-center justify-between px-4 py-3 border-b ${accent.header}`}>
//           <div className="flex items-center gap-2.5">
//             <div className={`w-0.5 h-4 rounded-full ${accent.bar}`} />
//             <div className="flex items-center gap-2">
//               <div className={`w-6 h-6 rounded-md ${accent.iconBg} flex items-center justify-center`}>
//                 <span className={`${accent.icon} [&>svg]:w-3.5 [&>svg]:h-3.5`}>{icon}</span>
//               </div>
//               <h4 className="text-[13px] font-semibold text-slate-700 tracking-tight">{title}</h4>
//               {showActionNearTitle && actionLabel && onAction && (
//                 <button
//                   onClick={onAction}
//                   className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-medium border rounded-md transition-all duration-150 ${accent.badge}`}
//                 >
//                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
//                   </svg>
//                   {actionLabel}
//                 </button>
//               )}
//             </div>
//           </div>
//           {!showActionNearTitle && actionLabel && onAction && (
//             <button
//               onClick={onAction}
//               className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-medium border rounded-md transition-all duration-150 ${accent.badge}`}
//             >
//               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
//               </svg>
//               {actionLabel}
//             </button>
//           )}
//         </div>
//         {/* Card body */}
//         <div>{children}</div>
//       </div>
//     );
//   };
//   /* ─── Expanded panel ─── */
//   const ExpandedPanel = ({ row }: { row: SalesOrderData }) => {
//     const purchaseOrders = getPurchaseOrdersForSalesOrder(row.id);
//     const transformedPOData = transformPurchaseOrderData(purchaseOrders);
//     const purchaseInwards = getPurchaseInwardsForSalesOrder(row.id);
//     const flattenedInwardRows = transformPurchaseInwardData(
//       purchaseInwards,
//       purchaseReturnList
//     );
//     const weavingContracts = getWeavingContractsForSalesOrder(row.id);
//     const transformedWeavingData = transformWeavingContractData(weavingContracts);
//     const beamOutwards = getBeamOutwardsForSalesOrder(row.id);
//     const transformedBeamOutwardData = transformBeamOutwardData(beamOutwards, row.id);
//     const weftIssues = getWeftIssuesForSalesOrder(row.id);
//     const transformedWeftIssueData = transformWeftIssueData(weftIssues);
//     const fabricReceives = getFabricReceivesForSalesOrder(row.id);
//     const transformedFabricReceiveData = transformFabricReceiveData(fabricReceives);
//     const weavingSummary = calculateWeavingSummary(transformedFabricReceiveData);
//     const transformedSizingPlanData = transformSizingPlanData(row.id);
//     const transformedSizingBeamSummaryData = transformSizingBeamSummaryData(row.id);
//     return (
//       <tr>
//         <td colSpan={columns.length} className="p-0 border-b border-slate-200" style={{ background: "#f8fafc" }}>
//           {/* ── Unified Process Management Card ── */}
//           <div className="mx-5 my-4 rounded-xl border border-slate-700 ring-1 ring-slate-900/[0.04] overflow-hidden bg-slate-50/30 shadow-sm">
//             {/* ── Tab Modal Header ── */}
//             <div className="bg-white border-b border-slate-200">
//               <div className="flex items-center px-5 py-3 border-b border-slate-200 bg-slate-50/50">
//                 <div className="flex gap-0">
//                   {(["yarnPurchase", "weaving", "sizing"] as const).map((tab) => {
//                     const label =
//                       tab === "yarnPurchase" ? "Yarn Purchase" : tab === "weaving" ? "Weaving" : "Sizing";
//                     const isActive = activeSubTab === tab;
//                     const color = tab === "yarnPurchase" ? "blue" : tab === "weaving" ? "amber" : "green";
//                     return (
//                       <button
//                         key={tab}
//                         onClick={() => setActiveSubTab(tab)}
//                         className={`relative px-5 py-2.5 text-[13px] font-medium transition-all duration-150 ${isActive
//                           ? `text-${color}-600 bg-white border-b-2 border-${color}-500`
//                           : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
//                           }`}
//                       >
//                         {label}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//             {/* ── Yarn Purchase Expandable Body ── */}
//             {activeSubTab === "yarnPurchase" && (
//               <div className="p-4 space-y-3 bg-slate-50/40 border-b border-slate-100">
//                 {/* ── Purchase Order sub-section ── */}
//                 <SectionCard
//                   accentColor="blue"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6M5 20h14a2 2 0 002-2V8l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
//                     </svg>
//                   }
//                   title="Purchase Order"
//                   actionLabel="Generate Purchase Order"
//                   onAction={() => handleGeneratePurchaseOrder(row)}
//                   showActionNearTitle={true}
//                 >
//                   {transformedPOData.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm border-collapse">
//                         <thead className="bg-blue-800">
//                           <tr>
//                             {["S.No", "Purchase Order No", "Vendor Name", "Yarn Count", "Quantity", "UOM", "Price / Unit", "Total Amount", "GST Amount", "Final Amount", "Status"].map(
//                               (h) => <th key={h} className={INNER_TH}>{h}</th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-slate-50">
//                           {transformedPOData.map((item: any) => {
//                             const isFirst = item.serialNumber !== null;
//                             return (
//                               <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
//                                 {isFirst ? (
//                                   <>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.poNo}>{item.serialNumber}</td>
//                                     <td className={`${INNER_TD} font-medium text-slate-600`} rowSpan={item.rowSpan.poNo}>{item.poNo}</td>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.vendorName}>{item.vendorName}</td>
//                                   </>
//                                 ) : (
//                                   <><td className="hidden" /><td className="hidden" /><td className="hidden" /></>
//                                 )}
//                                 <td className={INNER_TD}>{item.yarnName}</td>
//                                 <td className={INNER_TD}>{item.quantity?.toLocaleString()}</td>
//                                 {isFirst ? (
//                                   <td className={INNER_TD} rowSpan={item.rowSpan.unit}>{getUomName(item.unit)}</td>
//                                 ) : (
//                                   <td className="hidden" />
//                                 )}
//                                 <td className={INNER_TD}>{item.price?.toFixed(2)}</td>
//                                 <td className={INNER_TD}>{item.netAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                                 <td className={INNER_TD}>{item.gstAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                                 <td className={INNER_TD}>{item.finalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                                 {isFirst ? (
//                                   <td className={INNER_TD} rowSpan={item.rowSpan.status}>
//                                     <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.isComplete === 1
//                                       ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
//                                       : "bg-amber-50 text-amber-800 border-amber-200/80"
//                                       }`}>
//                                       {item.isComplete === 1 ? "Completed" : "Open"}
//                                     </span>
//                                   </td>
//                                 ) : (
//                                   <td className="hidden" />
//                                 )}
//                               </tr>
//                             );
//                           })}
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <EmptyState message="No purchase orders found for this sales order." />
//                   )}
//                 </SectionCard>
//                 {/* ── Purchase Inward sub-section ── */}
//                 <SectionCard
//                   accentColor="violet"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0l-4-4m4 4l-4 4M5 11l4-4M5 11l4 4" />
//                     </svg>
//                   }
//                   title="Purchase Inward"
//                   actionLabel="Generate Purchase Inward"
//                   onAction={() => handleGeneratePurchaseInward(row)}
//                   showActionNearTitle={true}
//                 >
//                   {flattenedInwardRows.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm border-collapse">
//                         <thead className="bg-blue-800">
//                           <tr>
//                             {["S.No", "Inward No", "Inward Date", "PO Number", "Vendor", "Product Name", "Quantity", "Total Amount", "Mill", "Warehouse", "Return Qty", "Return Value", "DC Number", "DC Date"].map(
//                               (h) => <th key={h} className={INNER_TH}>{h}</th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-slate-50">
//                           {flattenedInwardRows.map((item: any) => {
//                             const isFirst = item.serialNumber !== null;
//                             const shouldShowProductInfo = item.isYarnGroupFirst;
//                             return (
//                               <tr key={item.id} className="hover:bg-violet-50/30 transition-colors">
//                                 {isFirst ? (
//                                   <>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.inwardNo}>{item.serialNumber}</td>
//                                     <td className={`${INNER_TD} font-medium text-slate-600`} rowSpan={item.rowSpan.inwardNo}>{item.inwardNo}</td>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.inwardDate}>{item.inwardDate ? formatDate(item.inwardDate) : ""}</td>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.poNumber}>{item.poNumber}</td>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.vendor}>{item.vendor}</td>
//                                   </>
//                                 ) : (
//                                   <><td className="hidden" /><td className="hidden" /><td className="hidden" /><td className="hidden" /><td className="hidden" /></>
//                                 )}
//                                 {shouldShowProductInfo ? (
//                                   <>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.productName}</td>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.quantity?.toLocaleString()}</td>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.totalAmount?.toLocaleString()}</td>
//                                   </>
//                                 ) : (
//                                   <><td className="hidden" /><td className="hidden" /><td className="hidden" /></>
//                                 )}
//                                 {item.mill !== null ? (
//                                   <td className={INNER_TD} rowSpan={item.rowSpan.mill}>{item.mill}</td>
//                                 ) : (
//                                   <td className="hidden" />
//                                 )}
//                                 {item.warehouse !== null ? (
//                                   <td className={INNER_TD} rowSpan={item.rowSpan.warehouse}>{item.warehouse}</td>
//                                 ) : (
//                                   <td className="hidden" />
//                                 )}
//                                 {shouldShowProductInfo ? (
//                                   <>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.returnQty?.toLocaleString() || 0}</td>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.returnTotalAmount?.toLocaleString()}</td>
//                                   </>
//                                 ) : (
//                                   <><td className="hidden" /><td className="hidden" /></>
//                                 )}
//                                 {isFirst ? (
//                                   <>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.dcNumber}>{item.dcNumber}</td>
//                                     <td className={INNER_TD} rowSpan={item.rowSpan.dcDate}>{item.dcDate ? formatDate(item.dcDate) : ""}</td>
//                                   </>
//                                 ) : (
//                                   <><td className="hidden" /><td className="hidden" /></>
//                                 )}
//                               </tr>
//                             );
//                           })}
//                           <tr className="bg-slate-100/70 font-semibold">
//                             <td className={INNER_TD} colSpan={6}>Total</td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {flattenedInwardRows.reduce((sum: number, row: any) => sum + (Number(row?.quantity) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {flattenedInwardRows.reduce((sum: number, row: any) => sum + (Number(row?.totalAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
//                             <td className={`${INNER_TD} text-right`} colSpan={3}>
//                               {flattenedInwardRows.reduce((sum: number, row: any) => sum + (Number(row?.returnQty) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
//                             <td className={`${INNER_TD} text-right`} colSpan={1}>
//                               {flattenedInwardRows.reduce((sum: number, row: any) => sum + (Number(row?.returnTotalAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>

//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <EmptyState message="No purchase inwards found for this sales order." />
//                   )}
//                 </SectionCard>
//                 {/* ── Yarn Purchase Summary sub-section ── */}
//                 <SectionCard
//                   accentColor="emerald"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2V10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                     </svg>
//                   }
//                   title="Yarn Purchase Summary"
//                 >
//                   {(() => {
//                     const yarnSummaryData = getYarnPurchaseSummary(row.id);
//                     return yarnSummaryData.length > 0 ? (
//                       <div className="overflow-x-auto">
//                         <table className="w-full text-sm border-collapse">
//                           <thead className="bg-blue-800">
//                             <tr>
//                               {["Yarn Count", "Required Qty", "Ordered Qty", "Inward Qty", "Balance Qty"].map(
//                                 (h) => <th key={h} className={INNER_TH}>{h}</th>
//                               )}
//                             </tr>
//                           </thead>
//                           <tbody className="bg-white divide-y divide-slate-50">
//                             {yarnSummaryData.map((item: any, index: number) => (
//                               <tr key={index} className="hover:bg-emerald-50/30 transition-colors">
//                                 <td className={INNER_TD}>
//                                   <span className={`font-medium ${getYarnColor(item.yarnCount)}`}>
//                                     {item.yarnCount}
//                                   </span>
//                                 </td>
//                                 <td className={INNER_TD}>{item.requiredQty?.toLocaleString() || 0}</td>
//                                 <td className={INNER_TD}>{item.orderedQty?.toLocaleString()}</td>
//                                 <td className={INNER_TD}>{item.inwardQty?.toLocaleString()}</td>
//                                 <td className={`${INNER_TD} ${item.balanceQty < 0 ? "text-red-500 font-semibold" : ""}`}>
//                                   {item.balanceQty?.toLocaleString()}
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>
//                     ) : (
//                       <EmptyState message="No yarn purchase data found for this sales order." />
//                     );
//                   })()}
//                 </SectionCard>
//               </div>
//             )}
//             {/* ── Weaving Expandable Body ── */}
//             {activeSubTab === "weaving" && (
//               <div className="p-4 space-y-3 bg-amber-50/30">
//                 {/* ── Weaving Contract sub-section ── */}
//                 <SectionCard
//                   accentColor="blue"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                     </svg>
//                   }
//                   title="Weaving Contract"
//                   actionLabel="Generate Weaving Contract"
//                   onAction={() => handleGenerateWeavingContract(row)}
//                   showActionNearTitle={true}
//                 >
//                   {transformedWeavingData.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm border-collapse">
//                         <thead className="bg-blue-800">
//                           <tr>
//                             {["S.No", "Weaving Contract Date", "Weaving Contract No", "Vendor", "Fabric Code", "Quality", "Pick Rate", "Quantity", "Status"].map(
//                               (h) => <th key={h} className={INNER_TH}>{h}</th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-slate-50">
//                           {transformedWeavingData.map((item: any) => (
//                             <tr key={`${item.weavingContractNo}-${item.serialNumber}`} className="hover:bg-blue-50/30 transition-colors">
//                               <td className={INNER_TD}>{item.serialNumber}</td>
//                               <td className={INNER_TD}>{item.contractDate ? formatDate(item.contractDate) : ''}</td>
//                               <td className={`${INNER_TD} font-medium text-slate-600`}>{item.weavingContractNo}</td>
//                               <td className={INNER_TD}>{item.vendorName}</td>
//                               <td className={INNER_TD}>{item.fabricCode}</td>
//                               <td className={INNER_TD}>{item.quality}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.pickRate?.toFixed(2)}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.quantity?.toLocaleString()}</td>
//                               <td className={INNER_TD}>
//                                 <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.status === 'Completed'
//                                   ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
//                                   : "bg-amber-50 text-amber-800 border-amber-200/80"
//                                   }`}>
//                                   {item.status}
//                                 </span>
//                               </td>
//                             </tr>
//                           ))}
//                           <tr className="bg-slate-100/70 font-semibold">
//                             <td className={INNER_TD} colSpan={7}>Total</td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedWeavingData.reduce((sum: number, row: any) => sum + (Number(row?.quantity) || 0), 0).toLocaleString()}
//                             </td>
//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <EmptyState message="No weaving contracts found for this sales order." />
//                   )}
//                 </SectionCard>
//                 {/* ── Weft Issue sub-section ── */}
//                 <SectionCard
//                   accentColor="emerald"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
//                     </svg>
//                   }
//                   title="Weft Issue"
//                   actionLabel="Generate Weft Issue"
//                   onAction={() => handleGenerateWeftIssue(row)}
//                   showActionNearTitle={true}
//                 >
//                   {transformedWeftIssueData.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm border-collapse">
//                         <thead className="bg-blue-800">
//                           <tr>
//                             {["S.No", "Weaving Contract No", "Vendor", "Item Name", "Yarn Required", "Issued Qty", "Balance Yarn", "Yarn Return", "Consumed"].map(
//                               (h) => <th key={h} className={INNER_TH}>{h}</th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-slate-50">
//                           {transformedWeftIssueData.map((item: any) => (
//                             <tr key={`${item.weavingContractNo}-${item.serialNumber}`} className="hover:bg-emerald-50/30 transition-colors">
//                               <td className={INNER_TD}>{item.serialNumber}</td>
//                               <td className={INNER_TD}>{item.weavingContractNo}</td>
//                               <td className={INNER_TD}>{item.vendorName}</td>
//                               <td className={INNER_TD}>{item.itemName}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.yarnRequired?.toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.issuedQty?.toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.balanceYarn?.toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.yarnReturn?.toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.consumed?.toLocaleString()}</td>
//                             </tr>
//                           ))}
//                           <tr className="bg-slate-100/70 font-semibold">
//                             <td className={INNER_TD} colSpan={4}>Total</td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnRequired) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.issuedQty) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.balanceYarn) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnReturn) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
//                             <td className={`${INNER_TD} text-right text-blue-600`}>
//                               {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.consumed) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>

//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <EmptyState message="No weft issue records found for this sales order." />
//                   )}
//                 </SectionCard>
//                 {/* ── Beam Outward sub-section ── */}
//                 <SectionCard
//                   accentColor="violet"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0l-4-4m4 4l-4 4M5 11l4-4M5 11l4 4" />
//                     </svg>
//                   }
//                   title="Beam Outward"
//                   actionLabel="Generate Beam Outward"
//                   onAction={() => handleGenerateBeamOutward(row)}
//                   showActionNearTitle={true}
//                 >
//                   {transformedBeamOutwardData.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm border-collapse">
//                         <thead className="bg-blue-800">
//                           <tr>
//                             {["S.No", ...(transformedBeamOutwardData.some((item: any) => item.showOutwardColumns) ? ["Outward Date", "Outward No"] : []), "Weaving Contract No", "Sizing Vendor", "Weaver Name", "No Of Beams", "Beam Meter", "Beam Consumed",].map(
//                               (h) => <th key={h} className={INNER_TH}>{h}</th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-slate-50">
//                           {transformedBeamOutwardData.map((item: any) => (
//                             <tr key={`${item.sizingPlanNo}-${item.serialNumber}`} className="hover:bg-violet-50/30 transition-colors">
//                               <td className={INNER_TD}>{item.serialNumber}</td>
//                               {item.showOutwardColumns && (
//                                 <>
//                                   <td className={INNER_TD}>{item.outwardDate ? formatDate(item.outwardDate) : ""}</td>
//                                   <td className={`${INNER_TD} font-medium text-slate-600`}>{item.outwardNo}</td>
//                                 </>
//                               )}
//                               <td className={INNER_TD}>{item.weavingContractNo}</td>
//                               <td className={INNER_TD}>{item.sizingVendorName}</td>
//                               <td className={INNER_TD}>{item.weaverName}</td>
//                               {/* <td className={INNER_TD}>{item.sizingPlanNo}</td> */}
//                               <td className={`${INNER_TD} text-right`}>{item.noOfBeams?.toLocaleString()}</td>

//                               <td className={`${INNER_TD} text-right`}>{item.beamMeter?.toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.beamConsumed?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                             </tr>
//                           ))}
//                           <tr className="bg-slate-100/70 font-semibold">
//                             <td className={INNER_TD} colSpan={(transformedBeamOutwardData.some((item: any) => item.showOutwardColumns) ? 6 : 4)}>
//                               Total
//                             </td>
//                              <td className={`${INNER_TD} text-right`}>
//                               {transformedBeamOutwardData.reduce((sum: number, row: any) => sum + (Number(row?.noOfBeams) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedBeamOutwardData.reduce((sum: number, row: any) => sum + (Number(row?.beamMeter) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedBeamOutwardData.reduce((sum: number, row: any) => sum + (Number(row?.beamConsumed) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
                           
//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <EmptyState message="No beam outward records found for this sales order." />
//                   )}
//                 </SectionCard>
                
//                 {/* ── Fabric Received sub-section ── */}
//                 <SectionCard
//                   accentColor="amber"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                     </svg>
//                   }
//                   title="Fabric Received"
//                   actionLabel="Generate Fabric Received"
//                   onAction={() => handleGenerateFabricReceived(row)}
//                   showActionNearTitle={true}
//                 >
//                   {transformedFabricReceiveData.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm border-collapse">
//                         <thead className="bg-blue-800">
//                           <tr>
//                             {["S.No", "Weaving Contract No", "Vendor", "Fabric Details", "Total No. of Pieces", "Total Meters", "Inspected Mtr", "Net Wgt", "Avg Wgt", "Crimp%"].map(
//                               (h) => <th key={h} className={INNER_TH}>{h}</th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-slate-50">
//                           {transformedFabricReceiveData.map((item: any) => (
//                             <tr key={`${item.receiveNo}-${item.serialNumber}`} className="hover:bg-amber-50/30 transition-colors">
//                               <td className={INNER_TD}>{item.serialNumber}</td>
//                               {/* <td className={`${INNER_TD} font-medium text-slate-600`}>{item.receiveNo}</td> */}
//                               {/* <td className={INNER_TD}>{item.receiveDate ? formatDate(item.receiveDate) : ""}</td> */}
//                               <td className={INNER_TD}>{item.weavingContractNo}</td>
//                               <td className={INNER_TD}>{item.vendorName}</td>
//                               <td className={INNER_TD}>{item.fabricDetails}</td>
//                               <td className={INNER_TD}>
//                                 <button
//                                   onClick={() => {
//                                     if (isNavigating) return;

//                                     if (isLoadingWeavingContracts) {
//                                       toast.info("Loading contract data, please try again in a moment.");
//                                       return;
//                                     }

//                                     if (!validateWeavingContractExists(row.id)) {
//                                       toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
//                                       return;
//                                     }
//                                     setIsNavigating(true);
//                                     // Navigate to piece details page
//                                     navigate(`/transaction/piece-details`, {
//                                       state: {
//                                         fabricReceiveId: item.fabricReceiveId,
//                                         source: 'order-entry-management',
//                                         salesOrderId: row.id,
//                                         salesOrderNo: row.salesOrderNo,
//                                         flowType: 'weaving',
//                                         activeTab
//                                       }
//                                     });
//                                     // Reset navigation state after a delay
//                                     setTimeout(() => setIsNavigating(false), 300);
//                                   }}
//                                   disabled={isNavigating}
//                                   className={`text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${isNavigating ? 'animate-pulse' : ''
//                                     }`}
//                                 >
//                                   {item.totalPieces}
//                                 </button>
//                               </td>
//                               <td className={`${INNER_TD} text-right`}>{item.totalMeters?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.totalInspectedMtr?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.totalNetWgt?.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.totalAvgWgt?.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
//                               <td className={`${INNER_TD} text-right`}>{item.crimpPercentage?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <EmptyState message="No fabric received records found for this sales order." />
//                   )}
//                 </SectionCard>
//                 {/* ── Weaving Summary sub-section ── */}
             
//                 {/* ── Doffed Details sub-section ── */}
//                 <SectionCard
//                   accentColor="slate"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
//                     </svg>
//                   }
//                   title="Doffed Details"
//                 >
//                   {(() => {
//                     // Get contract numbers from weaving contracts
//                     const contractNos = [...new Set(transformedWeavingData.map((item: any) => item.weavingContractNo).filter(Boolean))];
//                     // For testing: Show message if no contracts found
//                     if (contractNos.length === 0) {
//                       return (
//                         <div className="text-center py-8">
//                           <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
//                             <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                             </svg>
//                           </div>
//                           <p className="text-[12.5px] font-medium text-slate-600">No weaving contracts found. Please add weaving contracts to see doffed details.</p>
//                         </div>
//                       );
//                     }
//                     // Fetch doffed details for each contract number if not already loaded
//                     contractNos.forEach(contractNo => {
//                       if (!doffedDetails[contractNo] && !loadingDoffedDetails[contractNo]) {
//                         fetchDoffedDetails(contractNo);
//                       }
//                     });
//                     // Combine all doffed details from all contracts
//                     const allDoffedDetails: DoffedDetail[] = [];
//                     contractNos.forEach(contractNo => {
//                       if (doffedDetails[contractNo]) {
//                         allDoffedDetails.push(...doffedDetails[contractNo]);
//                       }
//                     });
//                     // Group by beam details for better display
//                     const groupedData = allDoffedDetails.reduce((acc: any, item: DoffedDetail) => {
//                       const key = `${item.beamNo}-${item.flangeNo}`;
//                       if (!acc[key]) {
//                         acc[key] = {
//                           beamNo: item.beamNo,
//                           flangeNo: item.flangeNo,
//                           loomId: item.loomId,
//                           beamId: item.beamId,
//                           pieces: [],
//                           totalDoffedMtr: 0,
//                           totalInspectedMtr: 0,
//                           totalNetWt: 0,
//                           avgWgt: 0,
//                           gradeId: item.gradeId,
//                           warehouseId: item.warehouseId
//                         };
//                       }
//                       acc[key].pieces.push(item);
//                       acc[key].totalDoffedMtr += parseFloat(item.pieceMeter || '0');
//                       acc[key].totalInspectedMtr += item.inspectedMtr || 0;
//                       acc[key].totalNetWt += item.inspectedNtWt || 0;
//                       return acc;
//                     }, {});
//                     const groupedArray = Object.values(groupedData);
//                     // Calculate average weight for each group
//                     groupedArray.forEach((group: any) => {
//                       const totalWeight = group.pieces.reduce((sum: number, piece: DoffedDetail) => sum + (piece.inspectedAvgWt || 0), 0);
//                       group.avgWgt = group.pieces.length > 0 ? totalWeight / group.pieces.length : 0;
//                     });
//                     const isLoading = contractNos.some(contractNo => loadingDoffedDetails[contractNo]);
//                     if (isLoading) {
//                       return (
//                         <div className="text-center py-8">
//                           <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3"></div>
//                           <p className="text-sm text-slate-500">Loading doffed details...</p>
//                         </div>
//                       );
//                     }
//                     if (groupedArray.length === 0) {
//                       return (
//                         <div className="text-center py-8">
//                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
//                             <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                             </svg>
//                           </div>
//                           <p className="text-[12.5px] font-medium text-slate-400">No doffed details found for this sales order.</p>
//                         </div>
//                       );
//                     }
//                     return (
//                       <div className="overflow-x-auto">
//                         <table className="w-full text-sm border-collapse">
//                           <thead className="bg-blue-800">
//                             <tr>
//                               {["S.No", "Loom No", "Beam No", "Empty Beam No", "No of Pieces", "Doffed Mtr", "Inspected Mtr", "Net Wgt", "Avg Wgt", "Grade", "Warehouse", "Crimp %"].map(
//                                 (h) => <th key={h} className={INNER_TH}>{h}</th>
//                               )}
//                             </tr>
//                           </thead>
//                           <tbody className="bg-white divide-y divide-slate-50">
//                             {groupedArray.map((group: any, index: number) => {
//                               const crimpPercentage = calculateCrimpPercentage(group.totalDoffedMtr, group.beamId, group.beamNo);
//                               return (
//                                 <tr key={`${group.beamNo}-${group.flangeNo}`} className="hover:bg-slate-50/30 transition-colors">
//                                   <td className={INNER_TD}>{index + 1}</td>
//                                   <td className={INNER_TD}>{getLoomName(group.loomId)}</td>
//                                   <td className={`${INNER_TD} font-medium text-slate-600`}>{group.beamNo}</td>
//                                   <td className={INNER_TD}>{group.flangeNo}</td>
//                                   <td className={`${INNER_TD} text-right`}>{group.pieces.length}</td>
//                                   <td className={`${INNER_TD} text-right`}>{group.totalDoffedMtr.toFixed(2)}</td>
//                                   <td className={`${INNER_TD} text-right`}>{group.totalInspectedMtr.toFixed(2)}</td>
//                                   <td className={`${INNER_TD} text-right`}>{group.totalNetWt.toFixed(2)}</td>
//                                   <td className={`${INNER_TD} text-right`}>{group.avgWgt.toFixed(2)}</td>
//                                   <td className={INNER_TD}>{getGradeName(group.gradeId)}</td>
//                                   <td className={INNER_TD}>{getWarehouseName(group.warehouseId)}</td>
//                                   <td className={`${INNER_TD} text-right font-medium ${parseFloat(crimpPercentage) > 10 ? 'text-red-600' :
//                                     parseFloat(crimpPercentage) > 5 ? 'text-amber-600' : 'text-green-600'
//                                     }`}>
//                                     {crimpPercentage}%
//                                   </td>
//                                 </tr>
//                               );
//                             })}
//                           </tbody>
//                         </table>
//                       </div>
//                     );
//                   })()}
//                 </SectionCard>

//                   <SectionCard
//                   accentColor="amber"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//                     </svg>
//                   }
//                   title="Weaving Summary"
//                 >
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-sm border-collapse">
//                       <thead className="bg-primary">
//                         <tr>
//                           {['S.No', 'Weaving Contract No', 'Weaver Name', 'Net Wgt', 'No of pieces', 'Doffed Mtr', 'Inspected Meter', 'Avg Wgt', 'Crimp%'].map(
//                             (h) => <th key={h} className={INNER_TH}>{h}</th>
//                           )}
//                         </tr>
//                       </thead>
//                       <tbody className="bg-white divide-y divide-slate-50">
//                         {transformedFabricReceiveData.map((item: any) => (
//                           <tr key={item.fabricReceiveId} className="hover:bg-amber-50/30 transition-colors">
//                             <td className={INNER_TD}>{item.serialNumber}</td>
//                             <td className={INNER_TD}>{item.weavingContractNo || '-'}</td>
//                             <td className={INNER_TD}>{item.weaverName || '-'}</td>
//                             <td className={`${INNER_TD} text-right`}>{Number(item.totalNetWgt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                             <td className={`${INNER_TD} text-right`}>{Number(item.totalPieces || 0).toLocaleString()}</td>
//                             <td className={`${INNER_TD} text-right`}>{Number(item.totalMeters || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                             <td className={`${INNER_TD} text-right`}>{Number(item.totalInspectedMtr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                             <td className={`${INNER_TD} text-right`}>{Number(item.totalAvgWgt || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
//                             <td className={`${INNER_TD} text-right`}>{Number(item.crimpPercentage || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
//                           </tr>
//                         ))}
//                         <tr className="bg-slate-100/70 font-semibold">
//                           <td className={INNER_TD} colSpan={4}>Total</td>
//                           <td className={`${INNER_TD} text-right`}>{weavingSummary.totalPieces?.toLocaleString()}</td>
//                           <td className={`${INNER_TD} text-right`}>{weavingSummary.totalDoffedMtr?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                           <td className={`${INNER_TD} text-right`}>{weavingSummary.totalInspectedMtr?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                           <td className={`${INNER_TD} text-right`}>{weavingSummary.totalAvgWgt?.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
//                           <td className={`${INNER_TD} text-right`}>{weavingSummary.avgCrimpPercentage?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>
//                 </SectionCard>
//               </div>
              
//             )}
             
//             {/* ── Sizing Expandable Body ── */}
//             {activeSubTab === "sizing" && (
//               <div className="p-4 space-y-3 bg-green-50/30">
//                 <SectionCard
//                   accentColor="emerald"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h10M7 16h6M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
//                     </svg>
//                   }
//                   title="Sizing Plan"
//                   actionLabel="Generate Sizing Plan"
//                   onAction={() => handleGenerateSizingPlan(row)}
//                   showActionNearTitle={true}
//                 >
//                   {transformedSizingPlanData.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm border-collapse">
//                         <thead className="bg-blue-800">
//                           <tr>
//                             {["Sl No", "Sizing Plan Date", "Sizing Plan No", "Sizing Vendor", "Yarn Name", "Fabric Quality", "Sort Ends", "Meters"].map(
//                               (h) => <th key={h} className={INNER_TH}>{h}</th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-slate-50">
//                           {transformedSizingPlanData.map((item: any) => (
//                             <tr key={item.id} className="hover:bg-green-50/40 transition-colors">
//                               <td className={INNER_TD}>{item.serialNumber}</td>
//                               <td className={INNER_TD}>{item.sizingPlanDate ? formatDate(item.sizingPlanDate) : ""}</td>
//                               <td className={`${INNER_TD} font-medium text-slate-600`}>{item.sizingPlanNo || "-"}</td>
//                               <td className={INNER_TD}>{item.sizingVendorName || "-"}</td>
//                               <td className={INNER_TD}>{item.yarnName || "100s CC EGY"}</td>
//                               <td className={INNER_TD}>{item.fabricQuality || "-"}</td>
//                               <td className={`${INNER_TD} text-right`}>{Number(item.sortEnds || 0).toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right`}>{Number(item.meters || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

//                             </tr>
//                           ))}
//                           <tr className="bg-slate-100/70 font-semibold">
//                             <td className={INNER_TD} colSpan={7}>Total</td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedSizingPlanData.reduce((sum: number, row: any) => sum + (Number(row?.meters) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>

//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <EmptyState message="No sizing plans found for this sales order." />
//                   )}
//                 </SectionCard>

//                 {(() => {
//                   const transformedSizingYarnIssueData = transformSizingYarnIssueData(row.id);
//                   return (
//                     <SectionCard
//                       accentColor="blue"
//                       icon={
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                         </svg>
//                       }
//                       title="Sizing Yarn reconciliation"
//                       actionLabel="Generate Sizing Yarn reconciliation"
//                       onAction={() => handleGenerateSizingYarnIssue(row)}
//                       showActionNearTitle={true}
//                     >
//                       {transformedSizingYarnIssueData.length > 0 ? (
//                         <div className="overflow-x-auto">
//                           <table className="w-full text-sm border-collapse">
//                             <thead className="bg-blue-800">
//                               <tr>
//                                 {["S.No", "Sizing Plan No", "Yarn Required", "Issued Qty", "Balance Yarn", "Yarn Return", "Consumed"].map(
//                                   (h) => <th key={h} className={INNER_TH}>{h}</th>
//                                 )}
//                               </tr>
//                             </thead>
//                             <tbody className="bg-white divide-y divide-slate-50">
//                               {transformedSizingYarnIssueData.map((item: any) => (
//                                 <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
//                                   <td className={INNER_TD}>{item.serialNumber}</td>
//                                   <td className={`${INNER_TD} font-medium text-slate-600`}>{item.sizingPlanNo}</td>
//                                   <td className={`${INNER_TD} text-right`}>{item.yarnRequired?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                                   <td className={`${INNER_TD} text-right`}>{item.issuedQty?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                                   <td className={`${INNER_TD} text-right`}>{item.balanceYarn?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                                   <td className={`${INNER_TD} text-right font-medium text-blue-600`}>
//                                     {item.yarnReturn > 0 ? `${item.yarnReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG` : "-"}
//                                   </td>
//                                   <td className={`${INNER_TD} text-right font-semibold`}>{item.consumed?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                                 </tr>
//                               ))}
//                               <tr className="bg-slate-100/70 font-semibold">
//                                 <td className={INNER_TD} colSpan={2}>Total</td>
//                                 <td className={`${INNER_TD} text-right`}>
//                                   {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnRequired) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                 </td>
//                                 <td className={`${INNER_TD} text-right`}>
//                                   {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.issuedQty) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                 </td>
//                                 <td className={`${INNER_TD} text-right`}>
//                                   {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.balanceYarn) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                 </td>
//                                 <td className={`${INNER_TD} text-right`}>
//                                   {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnReturn) || 0), 0) > 0
//                                     ? `${transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnReturn) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KG`
//                                     : "-"
//                                   }
//                                 </td>
//                                 <td className={`${INNER_TD} text-right`}>
//                                   {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.consumed) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                                 </td>
//                               </tr>
//                             </tbody>
//                           </table>
//                         </div>
//                       ) : (
//                         <EmptyState message="No sizing yarn issue records found for this sales order." />
//                       )}
//                     </SectionCard>
//                   );

//                 })()}

//                 <SectionCard
//                   accentColor="slate"
//                   icon={
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
//                     </svg>
//                   }
//                   title="Beam Details"
//                 >
//                   {transformedSizingBeamSummaryData.length > 0 ? (
//                     <div className="overflow-x-auto">
//                       <table className="w-full text-sm border-collapse">
//                         <thead className="bg-blue-800">
//                           <tr>
//                             {["S.No", "Sizing Plan No", "Beams Plan", "Beams Received", "Beams Issued", "Beam Meter", "Return Beams", "Beam Return Meter", "Beam Utilize"].map(
//                               (h) => <th key={h} className={INNER_TH}>{h}</th>
//                             )}
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-slate-50">
//                           {transformedSizingBeamSummaryData.map((item: any) => (
//                             <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
//                               <td className={INNER_TD}>{item.serialNumber}</td>
//                               <td className={`${INNER_TD} font-medium text-slate-600`}>{item.sizingPlanNo}</td>
//                               <td className={`${INNER_TD} text-right`}>{Number(item.beamsPlan || 0).toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right`}>{Number(item.beamsReceived || 0).toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right`}>{Number(item.beamsIssued || 0).toLocaleString()}</td>

//                               <td className={`${INNER_TD} text-right`}>{Number(item.beamMeter || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>


//                               <td className={`${INNER_TD} text-right`}>{Number(item.returnedBeams || 0).toLocaleString()}</td>
//                               <td className={`${INNER_TD} text-right text-blue-600 font-medium`}>{item.beamReturn > 0 ? Number(item.beamReturn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</td>
//                               <td className={`${INNER_TD} text-right font-semibold`}>{Number(item.beamUtilize || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
//                             </tr>
//                           ))}
//                           <tr className="bg-slate-100/70 font-semibold">
//                             <td className={INNER_TD} colSpan={2}>Total</td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamsPlan) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamsReceived) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamsIssued) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamMeter) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
//                             <td className={`${INNER_TD} text-right`} >
//                               {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.returnedBeams) || 0), 0).toLocaleString()}
//                             </td>
//                             <td className={`${INNER_TD} text-right text-blue-600`}>
//                               {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamReturn) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>

//                             <td className={`${INNER_TD} text-right`}>
//                               {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamUtilize) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                             </td>
//                           </tr>
//                         </tbody>
//                       </table>
//                     </div>
//                   ) : (
//                     <EmptyState message="No beam summary data found for this sales order." />
//                   )}
//                 </SectionCard>
//               </div>

//             )}

//           </div>
//         </td >
//       </tr >
//     );
//   };
//   /* ─── Page render ─── */
//   return (
//     <>
//       <LoadingOverlay />
//       <div className="px-6 py-5 pt-16 space-y-5">
//         {/* Page header */}
       
//         {/* Tabs */}
//         <div className="flex gap-0 border-b border-slate-200">
//           {(["domestic", "export"] as const).map((tab) => {
//             const label =
//               tab === "domestic" ? "Sales Order Domestic" : "Sales Order Export";
//             const isActive = activeTab === tab;
//             return (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`relative px-5 py-2.5 text-[13px] font-medium transition-colors duration-150 ${isActive
//                   ? "text-blue-600"
//                   : "text-slate-500 hover:text-slate-700"
//                   }`}
//               >
//                 {label}
//                 {isActive && (
//                   <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-blue-800" />
//                 )}
//               </button>
//             );
//           })}
//         </div>
//         {/* Table card */}
//         <div className="overflow-hidden">
//           <DataTable
//             columns={columns}
//             data={tabFilteredOrders}
//             title="Sales Orders"
//             isShowPagination={true}
//             showActions={false}
//             showAddActions={false}
//             showExport={true}
//             showPdfExport={true}
//             showColumnFilters={true}
//             getRowId={(row) => `sales-order-row-${row.id}`}
//             getRowClassName={(row) => {
//               const isExpanded = expandedRowId === row.id;
//               return isExpanded ? "bg-blue-50/40 shadow-[inset_3px_0_0_#3b82f6]" : "";
//             }}
//             renderRowDetails={(row) => {
//               const isExpanded = expandedRowId === row.id;
//               return isExpanded ? <ExpandedPanel row={row} /> : null;
//             }}
//           />
//         </div>
      
//       </div>
//     </>
//   );
// }
import React, { useCallback, useEffect, useMemo, useRef, useState, useCallback as useCall } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { formatDate } from "@/lib/utils";
import { Pagination, usePagination } from "@/components/common/Pagination";
import DataTable from "@/components/data/DataTable";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import { getAllPurchaseReturns } from "@/state/purchaseReturnSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllFabricMastersForDropdown } from "@/state/fabricMasterSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllBeamOutward } from "@/state/beamOutwardSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllWeavingYarnIssue } from "@/state/weavingYarnIssueSlice";
import { getAllSizingYarnIssue } from "@/state/sizingYarnIssueSlice";
import { getAllJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import apiService from "@/services/ApiService";
import { getAllSalesReturn } from "@/state/salesReturnSlice";
import { getFactoryBeamInwardsByFactoryCompanyId } from "@/state/factoryBeamInwardSlice";
import { AppDispatch, RootState } from "@/state/store";
import { toast } from "react-toastify";
import { getAllBeamInward, getAllReturnedBeamInward } from "@/state/beamInwardSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getFactoryPieceEntriesByCompany } from "@/state/factoryPieceEntrySlice";
// Doffed Details interface
interface DoffedDetail {
  id: number;
  pieceNumber: string;
  quantity: number;
  pieceMeter: string;
  loomId: number;
  beamNo: string;
  flangeNo: string;
  flangeId: number;
  beamId: number;
  inspectedMtr: number;
  inspectedNtWt: number;
  inspectedAvgWt: number;
  gradeId: number;
  warehouseId: number;
  contractNo: string;
}
interface SalesOrderData {
  id: number;
  orderDate: string;
  salesOrderNo: string;
  buyerCustomerName: string;
  buyerPoNo: string;
  items: SalesOrderItem[];
  isComplete: number;
  isApproved: number;
  exportType: string;
  orderTypeId: number;
}
interface SalesOrderItem {
  fabricCode: string;
  buyerProduct: string;
  quality: string;
  orderQty: number;
  pricePerUnit: number;
  totalAmount: number;
  gstPercent: number;
  gstAmount: number;
  finalAmount: number;
  deliveryDate: string;
  remarks: string;
}
/* ─── Shared style constants ─── */
const TH =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white border-r border-blue-700 last:border-r-0 whitespace-nowrap";
const TD =
  "px-4 py-3 text-[13px] text-slate-700 border-b border-r border-slate-100/80 last:border-r-0 align-middle leading-snug";
const TD_CENTER =
  "px-4 py-3 text-[13px] text-slate-700 border-b border-r border-slate-100/80 last:border-r-0 align-middle text-center tabular-nums";
const INNER_TH =
  "px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white border-r border-slate-100/10 last:border-r-0 text-center whitespace-nowrap";
const INNER_TD =
  "px-3 py-2 text-[12.5px] text-slate-700 border border-slate-100/70 align-middle text-center whitespace-nowrap leading-snug";
/* ─── Yarn color palette (elegant medium-dark shades) ─── */
const YARN_COLORS = [
  "text-green-600",
  "text-blue-600",
  "text-orange-500",
  "text-purple-600",
  "text-pink-600",
  "text-cyan-600",
  "text-emerald-600",
  "text-amber-600",
  "text-indigo-600",
  "text-rose-600",
];
export default function OrderEntryManagement() {
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage,
  } = usePagination({ itemsPerPage: 10 });
  const { salesOrderList, paginationInfo } = useSelector(
    (state: RootState) => state.salesOrder
  );
  const { purchaseOrderList } = useSelector(
    (state: RootState) => state.purchaseOrder
  );
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const { purchaseInwardList } = useSelector(
    (state: RootState) => state.purchaseInward
  );
  const { purchaseReturnList } = useSelector(
    (state: RootState) => state.purchaseReturn
  );
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { subCategoryList: millMasters } = useSelector(
    (state: RootState) => state.subCategory
  );
  const { weavingContractList } = useSelector(
    (state: RootState) => state.weavingContracts
  );
  const { beamOutwardList } = useSelector(
    (state: RootState) => state.beamOutward
  );
  const { sizingPlanList } = useSelector(
    (state: RootState) => state.sizingPlan
  );
  const { fabricMasterFullList: fabricMasters } = useSelector(
    (state: RootState) => state.fabricMaster
  );
  const { weavingYarnIssuetList } = useSelector(
    (state: RootState) => state.weavingYarnIssue
  );
  const { sizingYarnIssuetList } = useSelector(
    (state: RootState) => state.sizingYarnIssue
  );
  const { jobworkFabricReceiveList } = useSelector(
    (state: RootState) => state.JobworkFabricReceive
  );
  const { beamInwardList } = useSelector(
    (state: RootState) => state.beamInward as any
  );
  const { loomList } = useSelector(
    (state: RootState) => state.loomMaster
  );
  const { salesReturnList } = useSelector(
    (state: RootState) => state.salesReturn
  );
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  const { list: factoryPieceEntries } = useSelector(
    (state: RootState) => state.factoryPieceEntry
  );
  const [activeTab, setActiveTab] = useState<"domestic" | "export">(
    "domestic"
  );
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<{ [key: number]: boolean }>({});
  const [weavingViewMode, setWeavingViewMode] = useState<{ [key: number]: boolean }>({});
  const [sizingViewMode, setSizingViewMode] = useState<{ [key: number]: boolean }>({});
  const [activeSubTab, setActiveSubTab] = useState<"yarnPurchase" | "weaving" | "sizing">("yarnPurchase");
  const [yarnReturnMap, setYarnReturnMap] = useState<Record<string, number>>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const [redirectSource, setRedirectSource] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoadingWeavingContracts, setIsLoadingWeavingContracts] = useState(true);
  const [doffedDetails, setDoffedDetails] = useState<{ [key: string]: DoffedDetail[] }>({});
  const [loadingDoffedDetails, setLoadingDoffedDetails] = useState<{ [key: string]: boolean }>({});
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const companyId = useResolvedCompanyId();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  /*
   * ─── Yarn color map (stable across re-renders) ───
   * Uses a ref so the mapping is never reset on re-render.
   * The same yarn name will always resolve to the same Tailwind color class.
   */
  const yarnColorMapRef = useRef<Record<string, string>>({});
  const getYarnColor = (yarnName: string): string => {
    if (!yarnColorMapRef.current[yarnName]) {
      const assignedCount = Object.keys(yarnColorMapRef.current).length;
      yarnColorMapRef.current[yarnName] =
        YARN_COLORS[assignedCount % YARN_COLORS.length];
    }
    return yarnColorMapRef.current[yarnName];
  };
  const yarnMap = useMemo<Record<number, string>>(() => {
    if (!Array.isArray(yarnList)) return {};
    return yarnList.reduce((acc: Record<number, string>, yarn: any) => {
      if (yarn.id != null) acc[Number(yarn.id)] = yarn.yarnName || "";
      return acc;
    }, {});
  }, [yarnList]);

  /* ─── Data filtering (unchanged) ─── */
  const filteredSalesOrders = useMemo(() => {
    return salesOrderList.filter(
      (order: SalesOrderData) =>
        order.isComplete === 0 && order.isApproved === 1
    );
  }, [salesOrderList]);
  const tabFilteredOrders = useMemo(() => {
    return filteredSalesOrders.filter((order: SalesOrderData) => {
      if (activeTab === "domestic") return order.orderTypeId === 1;
      return order.orderTypeId === 2;
    });
  }, [filteredSalesOrders, activeTab]);
  /* ─── Effects (unchanged) ─── */
  useEffect(() => {
    const storedCompanyId =
      localStorage.getItem("selectedCompanyId") ||
      localStorage.getItem("selectedCompany");
    const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
    dispatch(
      getAllSalesOrders({
        companyId,
        filters: {
          exportType: activeTab === "domestic" ? "1" : "2",
          orderTypeId: activeTab === "domestic" ? 1 : 2,
          isComplete: 0,
          isApproved: 1,
        },
      })
    );
  }, [dispatch, getOffset, itemsPerPage, activeTab]);
  useEffect(() => {
    const state = location.state as any;
    const searchParams = new URLSearchParams(location.search);
    // Set redirecting flag to prevent state conflicts
    if (state?.source || searchParams.get('source')) {
      setIsRedirecting(true);
      // Debug logging for redirect flow
      console.log('🔄 Redirect detected:', {
        source: state?.source || searchParams.get('source'),
        flowType: state?.flowType || searchParams.get('flowType'),
        salesOrderId: state?.salesOrderId || searchParams.get('salesOrderId'),
        expandView: state?.expandView || searchParams.get('expandView')
      });
      const source = state?.source || searchParams.get('source');
      setRedirectSource(source as string);
      // Parse query parameters for auto-expand info
      const salesOrderId = state?.salesOrderId || searchParams.get('salesOrderId');
      const expandView = state?.expandView || searchParams.get('expandView');
      const flowType = state?.flowType || searchParams.get('flowType');
      const fromOrderEntry = state?.fromOrderEntry || searchParams.get('fromOrderEntry');
      const selectedHyperlink = state?.selectedHyperlink || searchParams.get('selectedHyperlink');
      if (salesOrderId) {
        const orderId = Number(salesOrderId);
        setExpandedRowId(orderId);
        // Enhanced auto-expand logic based on selected hyperlink and flow type
        if (expandView === 'true' || flowType || fromOrderEntry) {
          // Use setTimeout to ensure state updates are properly sequenced
          setTimeout(() => {
            // Reset both view modes first to ensure clean state
            setViewMode(prev => ({ ...prev, [orderId]: false }));
            setWeavingViewMode(prev => ({ ...prev, [orderId]: false }));
            setSizingViewMode(prev => ({ ...prev, [orderId]: false }));
            // Auto-expand based on specific selected hyperlink
            setTimeout(() => {
              if (selectedHyperlink) {
                // Expand specific section based on the selected hyperlink
                switch (selectedHyperlink) {
                  case 'puprchaseOrder':
                  case 'purchaseInward':
                    setActiveSubTab('yarnPurchase');
                    setViewMode(prev => ({ ...prev, [orderId]: true }));
                    break;
                  case 'weavingContract':
                  case 'beamOutward':
                  case 'weftIssue':
                  case 'fabricReceived':
                    setActiveSubTab('weaving');
                    setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                    break;
                  case 'sizingPlan':
                    setActiveSubTab('sizing');
                    setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
                    break;
                  default:
                    // Fallback to flow type logic
                    if (flowType === 'weaving') {
                      setActiveSubTab('weaving');
                      setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                    } else if (flowType === 'yarnPurchase') {
                      setActiveSubTab('yarnPurchase');
                      setViewMode(prev => ({ ...prev, [orderId]: true }));
                    } else if (flowType === 'sizing') {
                      setActiveSubTab('sizing');
                      setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
                    } else if (fromOrderEntry) {
                      setActiveSubTab('yarnPurchase');
                      setViewMode(prev => ({ ...prev, [orderId]: true }));
                      setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                      setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
                    }
                }
              } else {
                // Fallback to flow type logic if no selected hyperlink
                if (flowType === 'weaving') {
                  setActiveSubTab('weaving');
                  setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                } else if (flowType === 'yarnPurchase') {
                  setActiveSubTab('yarnPurchase');
                  setViewMode(prev => ({ ...prev, [orderId]: true }));
                } else if (flowType === 'sizing') {
                  setActiveSubTab('sizing');
                  setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
                } else if (fromOrderEntry) {
                  setActiveSubTab('yarnPurchase');
                  setViewMode(prev => ({ ...prev, [orderId]: true }));
                  setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                  setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
                }
              }
            }, 50);
          }, 50);
          // Scroll to the expanded section after a short delay to ensure rendering is complete
          setTimeout(() => {
            const elementId = `sales-order-row-${orderId}`;
            const element = document.getElementById(elementId);
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }, 200);
        }
        // Set active tab if provided
        if (state?.activeTab) {
          setActiveTab(state.activeTab);
        }
      }
      // Reset redirecting flag after processing
      setTimeout(() => setIsRedirecting(false), 200);
    }
    // Handle refresh data with enhanced state restoration
    if (state?.refreshData) {
      setIsRedirecting(true);
      const storedCompanyId =
        localStorage.getItem("selectedCompanyId") ||
        localStorage.getItem("selectedCompany");
      const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
      dispatch(
        getAllSalesOrders({
          companyId,
          offset: getOffset(),
          limit: itemsPerPage,
          fetchAll: false,
          filters: {
            exportType: activeTab === "domestic" ? "1" : "2",
            orderTypeId: activeTab === "domestic" ? 1 : 2,
            isComplete: 0,
            isApproved: 1,
          },
        })
      ).then(() => {
        // Restore states after data refresh
        if (state.activeTab) setActiveTab(state.activeTab);
        if (state.expandedRowId) setExpandedRowId(state.expandedRowId);
        // Restore view modes based on selected hyperlink and flow type
        if ((state.flowType || state.fromOrderEntry || state.selectedHyperlink) && state.expandedRowId) {
          const orderId = state.expandedRowId;
          setTimeout(() => {
            if (state.selectedHyperlink) {
              // Restore based on specific selected hyperlink
              switch (state.selectedHyperlink) {
                case 'purchaseOrder':
                case 'purchaseInward':
                  setActiveSubTab('yarnPurchase');
                  setViewMode(prev => ({ ...prev, [orderId]: true }));
                  break;
                case 'weavingContract':
                case 'beamOutward':
                case 'weftIssue':
                case 'fabricReceived':
                  setActiveSubTab('weaving');
                  setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                  break;
                case 'sizingPlan':
                  setActiveSubTab('sizing');
                  setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
                  break;
                default:
                  // Fallback to flow type logic
                  if (state.flowType === 'weaving') {
                    setActiveSubTab('weaving');
                    setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                  } else if (state.flowType === 'yarnPurchase') {
                    setActiveSubTab('yarnPurchase');
                    setViewMode(prev => ({ ...prev, [orderId]: true }));
                  } else if (state.flowType === 'sizing') {
                    setActiveSubTab('sizing');
                    setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
                  } else if (state.fromOrderEntry) {
                    setActiveSubTab('yarnPurchase');
                    setViewMode(prev => ({ ...prev, [orderId]: true }));
                    setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                    setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
                  }
              }
            } else {
              // Fallback to flow type logic if no selected hyperlink
              if (state.flowType === 'weaving') {
                setActiveSubTab('weaving');
                setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
              } else if (state.flowType === 'yarnPurchase') {
                setActiveSubTab('yarnPurchase');
                setViewMode(prev => ({ ...prev, [orderId]: true }));
              } else if (state.flowType === 'sizing') {
                setActiveSubTab('sizing');
                setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
              } else if (state.fromOrderEntry) {
                setActiveSubTab('yarnPurchase');
                setViewMode(prev => ({ ...prev, [orderId]: true }));
                setWeavingViewMode(prev => ({ ...prev, [orderId]: true }));
                setSizingViewMode(prev => ({ ...prev, [orderId]: true }));
              }
            }
          }, 100);
          // Scroll to the expanded section after refresh
          setTimeout(() => {
            const elementId = `sales-order-row-${orderId}`;
            const element = document.getElementById(elementId);
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }, 250);
        }
        // Also re-fetch Purchase Orders, Inwards, Weaving Contracts, Beam Outward, Sizing Plan and Weft Issue to get latest data
        dispatch(getAllPurchaseOrders({ companyId, fetchAll: true }));
        dispatch(getAllPurchaseInwards({ companyId, fetchAll: true }));
        dispatch(getAllPurchaseReturns({ companyId, fetchAll: true }));
        setIsLoadingWeavingContracts(true);
        dispatch(getAllWeavingContract({ companyId }))
          .finally(() => {
            setIsLoadingWeavingContracts(false);
          });
        dispatch(getAllBeamOutward({ companyId, fetchAll: true }));
        dispatch(getAllSizingPlan({ companyId, fetchAll: true }));
        dispatch(getAllWeavingYarnIssue({ companyId }));
        dispatch(getAllSizingYarnIssue({ companyId, fetchAll: true }));
        dispatch(getAllJobworkFabricReceive({ companyId }));
        if (companyId) {
          dispatch(getFactoryPieceEntriesByCompany({ companyId }));
        }
        // Reset redirecting flag and clean up state
        setTimeout(() => {
          setIsRedirecting(false);
          navigate(location.pathname, { replace: true, state: null });
        }, 150);
      });
    }
  }, [location.state, location.search, dispatch, getOffset, itemsPerPage, activeTab, navigate]);
  // Cleanup navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);
  // Utility function for redirect handling
  const handleRedirectBack = useCallback((source: string, salesOrderId: number, flowType?: string) => {
    navigate('/transaction/order-entry-management', {
      state: {
        source: 'order-entry-management',
        salesOrderId,
        flowType,
        expandView: 'true',
        refreshData: true
      }
    });
  }, [navigate]);
  // Loading overlay component
  const LoadingOverlay = () => {
    if (!isNavigating) return null;
    return (
      <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 pointer-events-none backdrop-blur-[1px]">
        <div className="bg-white rounded-xl px-5 py-3.5 shadow-lg border border-slate-700 flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-blue-600"></div>
          <span className="text-sm font-medium text-slate-700">Processing...</span>
        </div>
      </div>
    );
  };
  // Function to fetch doffed details by contract number
  const fetchDoffedDetails = async (contractNo: string) => {
    if (!contractNo || !companyId) return;
    console.log(`Fetching doffed details for contract: ${contractNo}`);
    setLoadingDoffedDetails(prev => ({ ...prev, [contractNo]: true }));
    try {
      const response = await apiService.get(
        `/piece-entries/company/${companyId}?isFactoryFabric=1&sourceType=Factory-Fabric&weavingContractNo=${encodeURIComponent(contractNo)}`
      );
      console.log('API Response:', response);
      // Check different possible response structures
      let pieceEntries = [];
      if (response?.data?.data) {
        pieceEntries = response.data.data;
      } else if (response?.data) {
        pieceEntries = response.data;
      } else if (Array.isArray(response)) {
        pieceEntries = response;
      }
      console.log(`Doffed entries for ${contractNo}:`, pieceEntries);
      setDoffedDetails(prev => ({
        ...prev,
        [contractNo]: pieceEntries
      }));
    } catch (error) {
      console.error('Error fetching doffed details:', error);
      toast.error('Failed to fetch doffed details');
    } finally {
      setLoadingDoffedDetails(prev => ({ ...prev, [contractNo]: false }));
    }
  };
  // Function to calculate crimp percentage
  const calculateCrimpPercentage = (doffedMtr: number, beamId: number, beamNo: string): string => {
    if (!doffedMtr) return '0.00';
    let beamMtr = 0;

    // First try to find beam details from beamOutwardList
    if (Array.isArray(beamOutwardList)) {
      for (const outward of beamOutwardList) {
        if (outward.outwardDetails && Array.isArray(outward.outwardDetails)) {
          const detail = outward.outwardDetails.find((d: any) =>
            (beamNo && d.sizedBeamNo === beamNo) || (beamId && d.id === beamId)
          );
          if (detail) {
            beamMtr = detail.wrapMeters || 0;
            break;
          }
        }
      }
    }

    // Fallback to factoryBeamInwardList if not found
    if (beamMtr === 0 && Array.isArray(beamInwardList)) {
      for (const factoryBeam of beamInwardList) {
        const beamDetail = factoryBeam.beamInwardBeamDetails?.find((beam: any) =>
          (beamId && beam.id === beamId) || (beamNo && beam.beamNo === beamNo)
        );
        if (beamDetail) {
          beamMtr = beamDetail.wrapMeters || 0;
          break;
        }
      }
    }

    if (beamMtr === 0) return '0.00';
    const crimpPercentage = ((beamMtr - doffedMtr) / beamMtr) * 100;
    return crimpPercentage.toFixed(2);
  };
  // Function to get warehouse name by ID
  const getWarehouseName = (warehouseId: number): string => {
    const warehouse = warehouseList.find((w: any) => w.id === warehouseId);
    return warehouse?.warehouseName || 'N/A';
  };
  // Function to get grade name by ID
  const getGradeName = (gradeId: number): string => {
    // This would need to be implemented based on your grade master data
    // For now, returning a placeholder
    return gradeId ? `Grade ${gradeId}` : 'N/A';
  };
  // Function to get loom name by ID
  const getLoomName = (loomId: number): string => {
    const loom = loomList.find((loom: any) => loom.id === loomId);
    return loom?.loomNo || loom?.loomName || `Loom ${loomId}`;
  };
  useEffect(() => {
    const storedCompanyId =
      localStorage.getItem("selectedCompanyId") ||
      localStorage.getItem("selectedCompany");
    const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
    if (companyId) {
      dispatch(getAllPurchaseOrders({ companyId, fetchAll: true }));
      dispatch(getAllVendors({ companyId }));
      dispatch(getAllUomMaster({ fetchAll: true }));
      dispatch(getAllPurchaseInwards({ companyId, fetchAll: true }));
      dispatch(getAllPurchaseReturns({ companyId, fetchAll: true }));
      dispatch(getAllWarehouse({ fetchAll: true }));
      dispatch(getAllSubCategories({ fetchAll: true }));
      dispatch(getAllFabricMastersForDropdown());
      // Set loading state before fetching weaving contracts
      setIsLoadingWeavingContracts(true);
      dispatch(getAllWeavingContract({ companyId }))
        .finally(() => {
          setIsLoadingWeavingContracts(false);
        });
      dispatch(getAllBeamOutward({ companyId, fetchAll: true }));
      dispatch(getAllSizingPlan({ companyId, fetchAll: true }));
      dispatch(getAllWeavingYarnIssue({ companyId }));
      dispatch(getAllSizingYarnIssue({ companyId, fetchAll: true }));
      dispatch(getAllJobworkFabricReceive({ companyId }));
      dispatch(getAllLooms({ companyId }));
      dispatch(getAllReturnedBeamInward({ companyId, fetchAll: true } as any));
      dispatch(getAllSalesReturn({ companyId, fetchAll: true }));
      dispatch(getAllYarnMasters({ fetchAll: true }));
      dispatch(getFactoryPieceEntriesByCompany({ companyId }));
    }
  }, [dispatch, companyId]);

  /* ─── Yarn Return Data Fetching ─── */
  const fetchYarnReturnForSizingPlan = useCallback(async (sizingPlanNo: string) => {
    if (!sizingPlanNo || !companyId) return;
    try {
      // Calling the company-wide endpoint as specific No endpoints might fail or not be supported
      // This returns a list of all yarn returns for the company
      const response = await apiService.get(`/yarn-return/company/${companyId}`);

      const responseData = response?.data?.data || response?.data || response;
      const list = Array.isArray(responseData) ? responseData : (Array.isArray(responseData?.data) ? responseData.data : []);

      console.log("SizingPlanNo:", sizingPlanNo);

      // Match the correct data from the list using orderNo as sizingPlanNo
      const matched = list.find((item: any) => {
        console.log("API orderNo:", item.orderNo);
        return item.orderNo === sizingPlanNo;
      });

      const yarnReturnKg = matched?.yarnReturnItems?.reduce(
        (sum: number, item: any) => sum + (Number(item.totalKgs) || 0),
        0
      ) || 0;

      setYarnReturnMap(prev => ({ ...prev, [sizingPlanNo]: yarnReturnKg }));
    } catch (error) {
      console.error(`Error fetching yarn return for sizing plan ${sizingPlanNo}:`, error);
      setYarnReturnMap(prev => ({ ...prev, [sizingPlanNo]: 0 }));
    }
  }, [companyId]);

  useEffect(() => {
    if (activeSubTab === "sizing" && expandedRowId) {
      // Find sizing plans relevant to the current expanded sales order
      const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
        sp.sizingBeamDetails?.some((beam: any) => beam.salesOrderId === expandedRowId)
      );

      relevantSizingPlans.forEach((sp: any) => {
        const key = sp.sizingPlanNo;
        if (key && yarnReturnMap[key] === undefined) {
          fetchYarnReturnForSizingPlan(key);
        }
      });
    }
  }, [activeSubTab, expandedRowId, sizingPlanList, yarnReturnMap, fetchYarnReturnForSizingPlan]);

  useEffect(() => {
    if (activeSubTab === "weaving" && expandedRowId) {
      // Find weaving contracts relevant to the current expanded sales order
      const relatedContracts = weavingContractList.filter((wc: any) =>
        Number(wc.salesOrderId) === expandedRowId || Number(wc.salesOrderNo) === expandedRowId
      );

      relatedContracts.forEach((wc: any) => {
        const key = wc.weavingContractNo || wc.contractNo;
        if (key && yarnReturnMap[key] === undefined) {
          fetchYarnReturnForSizingPlan(key);
        }
      });
    }
  }, [activeSubTab, expandedRowId, weavingContractList, yarnReturnMap, fetchYarnReturnForSizingPlan]);

  /* ─── Lookup helpers (unchanged) ─── */
  const getVendorName = (vendorId: number) => {
    const vendor = vendorList.find((v: any) => v.id === vendorId);
    return vendor?.vendorName || `Vendor ${vendorId}`;
  };
  const getUomName = (uomId: string) => {
    const uom = uomList.find(
      (u: any) =>
        u.id === uomId ||
        u.uomCode === uomId ||
        u.id?.toString() === uomId ||
        u.uomCode?.toString() === uomId
    );
    return uom?.uomName || uom?.uomCode || uom?.name || uomId;
  };
  /* ─── Transform helpers (unchanged logic) ─── */
  const transformPurchaseOrderData = (purchaseOrders: any[]) => {
    const flattenedData: any[] = [];
    let serialNumber = 1;
    purchaseOrders.forEach((po) => {
      const items = po.purchaseOrderItemsDtl || [];
      const itemCount = items.length;
      items.forEach((item: any, itemIndex: number) => {
        flattenedData.push({
          id: `${po.id}-${itemIndex}`,
          serialNumber: itemIndex === 0 ? serialNumber++ : null,
          poNo: itemIndex === 0 ? po.poNo : null,
          vendorName: itemIndex === 0 ? getVendorName(po.vendorId) : null,
          vendorId: po.vendorId,
          yarnName: item.yarnName,
          yarnCount: item.yarnName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          netAmount: item.netAmount,
          gstAmount: item.gstAmount,
          finalAmount: item.finalAmount,
          isComplete: po.isComplete,
          status: Number(po.isApproved) === 1 ? "Approved" : "Pending",
          rowSpan: {
            poNo: itemIndex === 0 ? itemCount : 0,
            vendorName: itemIndex === 0 ? itemCount : 0,
            unit: itemIndex === 0 ? itemCount : 0,
            status: itemIndex === 0 ? itemCount : 0,
          },
        });
      });
    });
    return flattenedData;
  };
  const transformPurchaseInwardData = (
    purchaseInwardData: any[],
    purchaseReturnData: any[] = []
  ) => {
    const flattenedRows: any[] = [];
    let serialNumberCounter = 1;
    purchaseInwardData?.forEach((inward: any) => {
      const inwardRows: any[] = [];

      inward.purchaseInwardItemsDtl?.forEach((item: any) => {
        const matchedPO = purchaseOrderList?.find(
          (po: any) => Number(po.id) === Number(inward.purchaseOrderId)
        );
        const matchedPOItem = matchedPO?.purchaseOrderItemsDtl?.find(
          (poItem: any) => Number(poItem.id) === Number(item.poItemId)
        );
        const millName =
          millMasters?.find(
            (mill: any) =>
              Number(mill.id) === Number(matchedPOItem?.millNameId)
          )?.subCategoryName || "-";

        const yarnGroups: Record<string, any[]> = {};
        item.yarnStockDetails?.forEach((stock: any) => {
          const yarnName = stock.yarnCode || "-";
          if (!yarnGroups[yarnName]) {
            yarnGroups[yarnName] = [];
          }
          yarnGroups[yarnName].push(stock);
        });

        Object.entries(yarnGroups).forEach(([yarnName, stocks]) => {
          const totalQuantity = stocks.reduce((sum: number, stock: any) =>
            sum + Number(stock.acceptedQty || 0), 0);
          const returnQty =
            purchaseReturnData
              ?.filter((returnEntry: any) =>
                Number(returnEntry.purchaseOrderId) === Number(inward.purchaseOrderId)
              )
              ?.flatMap((entry: any) => entry.yarnItems || [])
              ?.filter(
                (returnItem: any) =>
                  Number(returnItem.purchaseInwardId) === Number(inward.id) &&
                  returnItem.yarnName === yarnName
              )
              ?.reduce(
                (sum: number, returnItem: any) =>
                  sum + Number(returnItem.returnQuantity || 0),
                0
              ) || 0;
          const returnTotalAmount =
            purchaseReturnData
              ?.filter((returnEntry: any) =>
                Number(returnEntry.purchaseOrderId) === Number(inward.purchaseOrderId)
              )
              ?.flatMap((entry: any) => entry.yarnItems || [])
              ?.filter(
                (returnItem: any) =>
                  Number(returnItem.purchaseInwardId) === Number(inward.id) &&
                  returnItem.yarnName === yarnName
              )
              ?.reduce(
                (sum: number, returnItem: any) =>
                  sum + Number(returnItem.totalAmount || 0),
                0
              ) || 0;
          const warehouse = warehouseList?.find(
            (wh: any) => Number(wh.id) === Number(stocks[0].warehouseId)
          )?.warehouseName || "-";

          stocks.forEach((stock: any, stockIndex: number) => {
            const isYarnGroupFirst = stockIndex === 0;
            inwardRows.push({
              productName: isYarnGroupFirst ? yarnName : "-",
              quantity: isYarnGroupFirst ? totalQuantity : 0,
              totalAmount: isYarnGroupFirst ? Number(item.totalAmount || 0) : 0,
              warehouse: warehouse,
              mill: millName,
              returnQty: isYarnGroupFirst ? returnQty : 0,
              returnTotalAmount: isYarnGroupFirst ? returnTotalAmount : 0,
              yarnGroupLength: stocks.length,
              isYarnGroupFirst: isYarnGroupFirst
            });
          });
        });
      });

      if (inwardRows.length === 0) return;

      const firstMill = inwardRows[0].mill;
      const firstWarehouse = inwardRows[0].warehouse;
      const allSameMill = inwardRows.every((row: any) => row.mill === firstMill);
      const allSameWarehouse = inwardRows.every((row: any) => row.warehouse === firstWarehouse);

      inwardRows.forEach((row: any, index: number) => {
        const isOverallFirst = index === 0;

        let millRowSpan = 0;
        let warehouseRowSpan = 0;
        let showMill = false;
        let showWarehouse = false;

        if (allSameMill) {
          if (isOverallFirst) {
            showMill = true;
            millRowSpan = inwardRows.length;
          }
        } else {
          if (row.isYarnGroupFirst) {
            showMill = true;
            millRowSpan = row.yarnGroupLength;
          }
        }

        if (allSameWarehouse) {
          if (isOverallFirst) {
            showWarehouse = true;
            warehouseRowSpan = inwardRows.length;
          }
        } else {
          if (row.isYarnGroupFirst) {
            showWarehouse = true;
            warehouseRowSpan = row.yarnGroupLength;
          }
        }

        flattenedRows.push({
          id: `${inward.id}-${index}`,
          serialNumber: isOverallFirst ? serialNumberCounter++ : null,
          inwardNo: isOverallFirst ? inward.purchaseInwardNo : null,
          inwardDate: isOverallFirst ? inward.inwardDate : null,
          poNumber: isOverallFirst ? inward.purchaseOrderNo : null,
          vendor: isOverallFirst
            ? inward.vendorName || getVendorName(inward.vendorId) || "-"
            : "-",
          dcNumber: isOverallFirst ? inward.dcNumber || "-" : "-",
          dcDate: isOverallFirst ? inward.dcDate || "-" : "-",

          productName: row.productName,
          quantity: row.quantity,
          totalAmount: row.totalAmount,

          mill: showMill ? row.mill : null,
          warehouse: showWarehouse ? row.warehouse : null,

          returnQty: row.returnQty,
          returnTotalAmount: row.returnTotalAmount,

          rowSpan: {
            inwardNo: isOverallFirst ? inwardRows.length : 0,
            inwardDate: isOverallFirst ? inwardRows.length : 0,
            poNumber: isOverallFirst ? inwardRows.length : 0,
            vendor: isOverallFirst ? inwardRows.length : 0,
            dcNumber: isOverallFirst ? inwardRows.length : 0,
            dcDate: isOverallFirst ? inwardRows.length : 0,
            mill: millRowSpan,
            warehouse: warehouseRowSpan,
            productInfo: row.isYarnGroupFirst ? row.yarnGroupLength : 0
          },
          isYarnGroupFirst: row.isYarnGroupFirst
        });
      });
    });
    return flattenedRows;
  };
  const getMillName = (millNameId: number | null | undefined): string => {
    if (!millNameId) return "";
    return `Mill ${millNameId}`;
  };
  const getPurchaseOrdersForSalesOrder = (salesOrderId: number) => {
    return purchaseOrderList.filter((po: any) =>
      po.purchaseOrderItemsDtl?.some((item: any) =>
        Number(item.salesOrderId) === Number(salesOrderId) &&
        (item.yarnId || item.yarnName || Number(po.poTypeId) === 1 || po.poType?.toString().toLowerCase().includes('yarn'))
      )
    );
  };
  const getPurchaseInwardsForSalesOrder = (salesOrderId: number) => {
    const yarnPurchaseInwards = purchaseInwardList.filter((inward: any) => {
      const items = inward.purchaseInwardItemsDtl || inward.yarnStockDetails || [];
      const hasYarnItem = items.some((item: any) => {
        const yarnStockDetails = item.yarnStockDetails || [item];
        return yarnStockDetails.some((stock: any) => stock.yarnId || stock.yarnName || item.yarnId || item.yarnName);
      });
      return Number(inward.poTypeId) === 1 || hasYarnItem || inward.poType?.toString().toLowerCase().includes('yarn');
    });
    if (yarnPurchaseInwards.length === 0) {
      return [];
    }
    const directlyRelatedInwards = yarnPurchaseInwards.filter((inward: any) => {
      const items = inward.purchaseInwardItemsDtl || inward.yarnStockDetails || [];
      return items.some((item: any) => {
        const yarnStockDetails = item.yarnStockDetails || [item];
        return yarnStockDetails.some((stock: any) =>
          Number(stock.salesOrderId) === Number(salesOrderId) || Number(item.salesOrderId) === Number(salesOrderId)
        );
      });
    });
    if (directlyRelatedInwards.length === 0) {
      const relatedPurchaseOrders = getPurchaseOrdersForSalesOrder(salesOrderId);
      const relatedPoNumbers = relatedPurchaseOrders.map((po: any) => po.poNo);
      const poRelatedInwards = yarnPurchaseInwards.filter((inward: any) => {
        return relatedPoNumbers.includes(inward.purchaseOrderNo);
      });
      if (poRelatedInwards.length > 0) {
        return poRelatedInwards;
      }
    }
    return directlyRelatedInwards;
  };
  const calculateRequiredQuantity = (
    salesOrder: SalesOrderData,
    yarnId: number,
    useWarp: boolean = true,
    useWeft: boolean = true
  ): string => {
    const toNumber = (value: any): number => {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };
    let totalQuantity = 0;
    salesOrder.items?.forEach((item: SalesOrderItem) => {
      const orderQty = toNumber(item.orderQty);
      const fabric = fabricMasters?.find((f: any) => f.fabricCode === item.fabricCode);
      if (fabric) {
        if (useWarp) {
          const warpDetails = fabric.warpDetails?.filter((warp: any) => toNumber(warp.yarnId) === yarnId) || [];
          warpDetails.forEach((warpDetail: any) => {
            if (warpDetail.gramsPerMeter) {
              totalQuantity += toNumber(warpDetail.gramsPerMeter) * orderQty;
            }
          });
        }
        if (useWeft) {
          const weftDetails = fabric.weftDetails?.filter((weft: any) => toNumber(weft.yarnId) === yarnId) || [];
          weftDetails.forEach((weftDetail: any) => {
            if (weftDetail.gramsPerMeter) {
              totalQuantity += toNumber(weftDetail.gramsPerMeter) * orderQty;
            }
          });
        }
      } else {
        if (fabric) {
          if (fabric.warpDetails && Array.isArray(fabric.warpDetails)) {
            fabric.warpDetails.forEach((warp: any) => {
              if (warp.gramsPerMeter) {
                totalQuantity += toNumber(warp.gramsPerMeter) * orderQty;
              }
            });
          }
          if (fabric.weftDetails && Array.isArray(fabric.weftDetails)) {
            fabric.weftDetails.forEach((weft: any) => {
              if (weft.gramsPerMeter) {
                totalQuantity += toNumber(weft.gramsPerMeter) * orderQty;
              }
            });
          }
        }
      }
    });
    return totalQuantity > 0 ? totalQuantity.toFixed(2) : '';
  };
  const getWeavingContractsForSalesOrder = (salesOrderId: number) => {
    const id = Number(salesOrderId);
    return weavingContractList.filter((wc: any) =>
      Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
    );
  };
  const validateWeavingContractExists = (salesOrderId: number): boolean => {
    // If we are still in the initial loading phase and have no data, 
    // we should block navigation to be safe.
    if (isLoadingWeavingContracts && (!weavingContractList || (Array.isArray(weavingContractList) && weavingContractList.length === 0))) {
      return false;
    }

    const weavingContracts = getWeavingContractsForSalesOrder(salesOrderId);

    // If no contracts are found for this specific sales order
    if (weavingContracts.length === 0) {
      return false;
    }

    // Validate that at least one contract has a valid number (not 0 or empty)
    return weavingContracts.some((wc: any) => {
      const weavingContractNo = wc.weavingContractNo || wc.contractNo;
      return weavingContractNo && weavingContractNo !== 0 && weavingContractNo !== "0";
    });
  };
  const getBeamOutwardsForSalesOrder = (salesOrderId: number) => {
    const id = Number(salesOrderId);
    // Get weaving contracts for this sales order using robust filtering
    const relatedContracts = weavingContractList.filter((wc: any) =>
      Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
    );
    // Get weaving contract IDs
    const contractIds = relatedContracts.map((wc: any) => Number(wc.id));

    return (Array.isArray(beamOutwardList) ? beamOutwardList : []).filter((bo: any) => {
      // Match by direct salesOrderId
      const matchByOrderId = Number(bo.salesOrderId) === id;

      // Match by weavingContractId (more robust for process flow)
      const matchByContractId = bo.weavingContractId && contractIds.includes(Number(bo.weavingContractId));

      // Also check if any of the details match the sales order or related contracts
      const matchInDetails = Array.isArray(bo.outwardDetails) && bo.outwardDetails.some((detail: any) =>
        Number(detail.salesOrderId) === id || (detail.weavingContractId && contractIds.includes(Number(detail.weavingContractId)))
      );

      return matchByOrderId || matchByContractId || matchInDetails;
    });
  };
  const getWeftIssuesForSalesOrder = (salesOrderId: number) => {
    const id = Number(salesOrderId);
    // Get weaving contracts for this sales order using robust filtering
    const relatedContracts = weavingContractList.filter((wc: any) =>
      Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
    );
    // Get weaving contract IDs
    const contractIds = relatedContracts.map((wc: any) => wc.id);
    // Filter weft issues by weaving contract IDs
    return weavingYarnIssuetList.filter((wyi: any) =>
      contractIds.includes(wyi.weavingContractId)
    );
  };
  const getFabricReceivesForSalesOrder = (salesOrderId: number) => {
    const id = Number(salesOrderId);
    // Get weaving contracts for this sales order using robust filtering
    const relatedContracts = weavingContractList.filter((wc: any) =>
      Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
    );
    // Get weaving contract IDs
    const contractIds = relatedContracts.map((wc: any) => wc.id);
    // Filter fabric receives by weaving contract IDs
    return jobworkFabricReceiveList.filter((jfr: any) =>
      contractIds.includes(jfr.weavingContractId)
    );
  };
  const transformWeavingContractData = (weavingContracts: any[]) => {
    const transformedRows: any[] = [];
    let serialNumber = 1;
    weavingContracts.forEach((contract: any) => {
      const vendor = vendorList.find((v: any) => v.id === contract.vendorId);
      const vendorName = vendor?.vendorName || 'Unknown Vendor';
      if (contract.items && contract.items.length > 0) {
        contract.items.forEach((item: any) => {
          const fabric = fabricMasters.find((f: any) => f.id === item.fabricCodeId);
          const fabricCode = fabric?.fabricCode || 'Unknown Fabric';
          const quality = fabric?.fabricQuality || 'N/A';
          transformedRows.push({
            serialNumber,
            contractDate: contract.contractDate || '',
            weavingContractNo: contract.weavingContractNo,
            vendorName,
            fabricCode,
            quality,
            pickRate: item.pickCost || 0,
            quantity: item.quantity || 0,
            status: contract.isComplete === 1 ? 'Completed' : 'Open'
          });
          serialNumber++;
        });
      }
    });
    return transformedRows;
  };
  const transformBeamOutwardData = (beamOutwards: any[], salesOrderId: number) => {
    const getReturnedBeamMeter = (
      sizingPlanId: number | string | null | undefined,
      sizingPlanNo: string | null | undefined,
      weavingContractId: number | string | null | undefined,
      weavingContractNo: string | null | undefined
    ) => {
      let sum = 0;
      const inwardList = Array.isArray(beamInwardList) ? beamInwardList : [];
      inwardList.forEach((bi: any) => {
        const details = Array.isArray(bi.beamInwardBeamDetails) ? bi.beamInwardBeamDetails : [];
        details.forEach((d: any) => {
          // Resolve sizing plan
          const dPlanId = d.sizingPlanId ?? bi.sizingPlanId;
          const dPlanNo = d.sizingPlanNo ?? d.planNo ?? d.sizing_plan_no ?? bi.sizingPlanNo ?? bi.planNo ?? bi.sizing_plan_no;

          let planMatch = false;
          if (sizingPlanId && dPlanId && Number(dPlanId) === Number(sizingPlanId)) {
            planMatch = true;
          } else if (sizingPlanNo && dPlanNo && String(dPlanNo).trim() === String(sizingPlanNo).trim()) {
            planMatch = true;
          }

          // Resolve weaving contract
          const dContractId = d.weavingContractId ?? d.weaving_contract_id ?? d.contractId ?? d.contract_id ?? d.weavingWorkOrderId ?? d.weaving_work_order_id ?? bi.weavingContractId ?? bi.weaving_contract_id;
          const dContractNo = d.weavingContractNo ?? d.weaving_contract_no ?? d.contractNo ?? d.weavingContractNumber ?? bi.weavingContractNo ?? bi.weaving_contract_no ?? bi.contractNo;

          let contractMatch = false;
          if (weavingContractId && dContractId && Number(dContractId) === Number(weavingContractId)) {
            contractMatch = true;
          } else if (weavingContractNo && dContractNo && String(dContractNo).trim() === String(weavingContractNo).trim()) {
            contractMatch = true;
          } else if (!weavingContractId && !weavingContractNo) {
            contractMatch = true;
          }

          if (planMatch && contractMatch) {
            sum += Number(d.wrapMeters) || 0;
          }
        });
      });
      return sum;
    };

    // Group beam outwards by sizing plan (or plan id) and then by weaving contract
    const groupedRows: Record<string, any> = {};
    beamOutwards.forEach((beamOutward: any) => {
      const sizingVendor = vendorList.find((v: any) => Number(v.id) === Number(beamOutward.sizingVendorId));
      const outwardDetails = Array.isArray(beamOutward.outwardDetails) ? beamOutward.outwardDetails : [];
      let weavingVendorId = beamOutward.weavingVendorId;
      if (outwardDetails.length > 0) {
        const detailVendor = outwardDetails.find((detail: any) => detail.weavingVendorId != null);
        if (detailVendor) {
          weavingVendorId = detailVendor.weavingVendorId;
        }
      }
      const weaver = vendorList.find((v: any) => Number(v.id) === Number(weavingVendorId));
      const sizingPlan = sizingPlanList.find((sp: any) => Number(sp.id) === Number(beamOutward.sizingPlanId));
      const planNo = sizingPlan?.sizingPlanNo || beamOutward.sizingPlanNo || `Plan ${beamOutward.sizingPlanId}`;
      const groupKey = String(beamOutward.sizingPlanId || planNo).trim();

      if (!groupedRows[groupKey]) {
        groupedRows[groupKey] = {
          outwardDates: new Set<string>(),
          outwardNos: new Set<string>(),
          contracts: {} as Record<string, any>,
          serialNumber: 0,
          sizingVendorName: sizingVendor?.vendorName || `Vendor ${beamOutward.sizingVendorId}`,
          defaultWeavingVendorId: weavingVendorId,
          sizingPlanNo: planNo,
          sizingPlanId: beamOutward.sizingPlanId,
          beamMeter: 0,
          noOfBeams: 0,
          rowCount: 0,
        };
      }

      const group = groupedRows[groupKey];
      group.outwardDates.add(beamOutward.outwardDate || "");
      group.outwardNos.add(beamOutward.outwardNo || "");
      group.beamMeter += Number(beamOutward.totalBeamMeters) || 0;
      group.noOfBeams += Number(beamOutward.totalNoOfBeams) || 0;
      group.rowCount = (group.rowCount || 0) + 1;

      // Distribute outward details across weaving contracts when present
      const details = Array.isArray(beamOutward.outwardDetails) ? beamOutward.outwardDetails : [];
      if (details.length === 0) {
        // Fallback to whole outward assigned to the actual weavingContractNo if available, else lookup by id
        let contractNo = beamOutward.weavingContractNo || "";
        if (!contractNo && beamOutward.weavingContractId) {
          const wc = weavingContractList.find((w: any) => Number(w.id) === Number(beamOutward.weavingContractId));
          contractNo = wc?.weavingContractNo || "";
        }
        const defaultContractKey = contractNo || "";
        if (!group.contracts[defaultContractKey]) {
          group.contracts[defaultContractKey] = {
            beamMeter: 0,
            noOfBeams: 0,
            outwardDates: new Set<string>(),
            outwardNos: new Set<string>(),
            weavingVendorId: beamOutward.weavingVendorId,
            weavingContractId: beamOutward.weavingContractId,
          };
        }
        group.contracts[defaultContractKey].beamMeter += Number(beamOutward.totalBeamMeters) || 0;
        group.contracts[defaultContractKey].noOfBeams += Number(beamOutward.totalNoOfBeams) || 0;
        group.contracts[defaultContractKey].outwardDates.add(beamOutward.outwardDate || "");
        group.contracts[defaultContractKey].outwardNos.add(beamOutward.outwardNo || "");
      } else {
        details.forEach((d: any) => {
          // Prefer explicit weavingContractNo on detail; fallback to lookup by id; else empty string
          let contractKey = d.weavingContractNo || beamOutward.weavingContractNo || "";
          if (!contractKey && d.weavingContractId) {
            const wc = weavingContractList.find((w: any) => Number(w.id) === Number(d.weavingContractId));
            contractKey = wc?.weavingContractNo || "";
          }
          const contractVendorId = d.weavingVendorId ?? beamOutward.weavingVendorId;
          if (!group.contracts[contractKey]) {
            group.contracts[contractKey] = {
              beamMeter: 0,
              noOfBeams: 0,
              outwardDates: new Set<string>(),
              outwardNos: new Set<string>(),
              weavingVendorId: contractVendorId,
              weavingContractId: d.weavingContractId || beamOutward.weavingContractId,
            };
          }
          group.contracts[contractKey].beamMeter += Number(d.wrapMeters || 0);
          // If detail doesn't have explicit noOfBeams, count the detail as one beam
          const detailBeams = d.noOfBeams != null ? Number(d.noOfBeams) : 1;
          group.contracts[contractKey].noOfBeams += detailBeams;
          group.contracts[contractKey].weavingVendorId = group.contracts[contractKey].weavingVendorId ?? contractVendorId;
          group.contracts[contractKey].outwardDates.add(beamOutward.outwardDate || "");
          group.contracts[contractKey].outwardNos.add(beamOutward.outwardNo || "");
        });
      }
    });

    const computeBeamReturnForContract = (contractKey: string) => {
      if (!contractKey) return 0;
      return (salesReturnList || []).reduce((sum: number, sr: any) => {
        const beamItems = Array.isArray(sr.beamItems) ? sr.beamItems : [];
        return sum + beamItems.reduce((inner: number, item: any) => {
          const itemContract = item.weavingContractNo || item.weavingContractNumber || "";
          const itemContractId = item.weavingContractId != null ? String(item.weavingContractId) : "";
          if (
            String(itemContract) === String(contractKey) ||
            String(itemContractId) === String(contractKey)
          ) {
            return inner + (Number(item.beamMeters) || 0);
          }
          return inner;
        }, 0);
      }, 0);
    };

    const rows: any[] = [];
    Object.values(groupedRows).forEach((group: any) => {
      const contractKeys = Object.keys(group.contracts || {});
      const outwardDates = Array.from(group.outwardDates).filter(Boolean);
      const outwardNos = Array.from(group.outwardNos).filter(Boolean);
      const hasMultipleContracts = contractKeys.length > 1;
      const showOutwardColumns = outwardDates.length === 1 && outwardNos.length === 1 && group.rowCount === 1 && !hasMultipleContracts;

      contractKeys.forEach((ck: string) => {
        const c = group.contracts[ck];

        let targetContractId = c.weavingContractId;
        if (!targetContractId) {
          const matchedContract = weavingContractList.find(
            (wc: any) => (wc.weavingContractNo || wc.contractNo || "").trim() === ck.trim()
          );
          targetContractId = matchedContract?.id;
        }

        const returnedBeamMeter = getReturnedBeamMeter(
          group.sizingPlanId,
          group.sizingPlanNo,
          targetContractId,
          ck
        );

        const beamMeter = returnedBeamMeter || Number(c.beamMeter || 0);
        const beamReturn = computeBeamReturnForContract(ck);
        const beamConsumed = parseFloat((beamMeter - beamReturn).toFixed(2));
        const outwardDate = Array.from(c.outwardDates || []).filter(Boolean)[0] || "";
        const outwardNo = Array.from(c.outwardNos || []).filter(Boolean)[0] || "";
        rows.push({
          outwardDate: showOutwardColumns ? outwardDate : "",
          outwardNo: showOutwardColumns ? outwardNo : "",
          sizingVendorName: group.sizingVendorName,
          weaverName:
            vendorList.find((v: any) => Number(v.id) === Number(c.weavingVendorId))?.vendorName ||
            vendorList.find((v: any) => Number(v.id) === Number(group.defaultWeavingVendorId))?.vendorName ||
            `Vendor ${c.weavingVendorId ?? group.defaultWeavingVendorId}`,
          sizingPlanNo: group.sizingPlanNo,
          beamMeter,
          beamReturn,
          beamReturnMtr: beamReturn,
          beamConsumed,
          noOfBeams: Number(c.noOfBeams || 0),
          weavingContractNo: ck || "-",
          showOutwardColumns: showOutwardColumns && contractKeys.length === 1,
        });
      });
    });

    return rows.map((row: any, index: number) => ({ ...row, serialNumber: index + 1 }));
  };
  const transformSizingPlanData = (salesOrderId: number) => {
    const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
      sp.sizingBeamDetails?.some((beam: any) => beam.salesOrderId === salesOrderId)
    );
    const transformedRows: any[] = [];
    let serialNumber = 1;
    relevantSizingPlans.forEach((sp: any) => {
      const vendor = vendorList.find((v: any) => v.id === sp.vendorId);
      const vendorName = vendor?.vendorName || "-";
      const yarnIssue = sizingYarnIssuetList?.find((issue: any) => issue.sizingPlanId === sp.id);
      const yarnReqs = yarnIssue?.requirements || [];
      const qualDetails = sp.sizingQualityDetails || [];
      const beamDetails = Array.isArray(sp.sizingBeamDetails) ? sp.sizingBeamDetails : [];
      const firstQuality = qualDetails[0] || {};
      const firstBeam = beamDetails[0] || {};
      if (yarnReqs.length > 0) {
        yarnReqs.forEach((req: any, idx: number) => {
          const qual = qualDetails[idx] || firstQuality;
          const fabricQuality =
            req?.fabricDetails?.quality ||
            req?.quality ||
            qual?.quality ||
            firstQuality?.quality ||
            "-";
          const sortEnds =
            qual?.sordEnds ??
            qual?.actualEnds ??
            firstQuality?.sordEnds ??
            firstQuality?.actualEnds ??
            0;
          const meters =
            req?.warpMeters ??
            qual?.warpMeters ??
            firstBeam?.warpMeters ??
            0;
          transformedRows.push({
            id: `${sp.id}-${req.id || idx}`,
            serialNumber: serialNumber++,
            sizingPlanDate: sp.sizingPlanDate,
            sizingPlanNo: sp.sizingPlanNo,
            sizingVendorName: vendorName,
            yarnName: (req.yarnId ? yarnMap[Number(req.yarnId)] : undefined) || req.yarnName || (typeof req.actualYarn === "string" ? req.actualYarn : undefined) || "-",
            fabricQuality,
            sortEnds,
            meters,
            yarnRequired: req.warpRequirement || 0,
            issued: req.totalIssuedQty || 0,
            balance: req.balanceToIssue || 0,
            yarnReturn: yarnReturnMap[sp.sizingPlanNo] || 0
          });
          // alert(req.yarn);
        });
      } else if (qualDetails.length > 0) {
        qualDetails.forEach((qual: any, idx: number) => {
          const resolvedYarnName =

            qual.yarnName ||
            (qual.yarnId ? yarnMap[Number(qual.yarnId)] : undefined) ||
            (qual.actualYarn && typeof qual.actualYarn === "string" ? qual.actualYarn : undefined) ||
            "-";
          console.log("qual.yarnName", qual.yarnName);
          transformedRows.push({
            id: `${sp.id}-qual-${idx}`,
            serialNumber: serialNumber++,
            sizingPlanDate: sp.sizingPlanDate,
            sizingPlanNo: sp.sizingPlanNo,
            sizingVendorName: vendorName,
            yarnName: resolvedYarnName,
            fabricQuality: qual.quality || "-",
            sortEnds: qual.sordEnds || qual.actualEnds || 0,
            meters: qual.warpMeters || 0,
            yarnRequired: 0,
            issued: 0,
            balance: 0,
            yarnReturn: yarnReturnMap[sp.sizingPlanNo] || 0
          });
        });
        // alert("transformSizingPlanData");
      } else {
        transformedRows.push({
          id: `${sp.id}-empty`,
          serialNumber: serialNumber++,
          sizingPlanDate: sp.sizingPlanDate,
          sizingPlanNo: sp.sizingPlanNo,
          sizingVendorName: vendorName,
          yarnName: "-",
          fabricQuality: "-",
          sortEnds: 0,
          meters: 0,
          yarnRequired: 0,
          issued: 0,
          balance: 0,
          yarnReturn: yarnReturnMap[sp.sizingPlanNo] || 0
        });
      }
    });
    return transformedRows;
  };
  const transformSizingBeamSummaryData = (salesOrderId: number) => {
    const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
      sp.sizingBeamDetails?.some((beam: any) => Number(beam.salesOrderId) === Number(salesOrderId))
    );
    const relatedBeamOutwards = getBeamOutwardsForSalesOrder(salesOrderId);
    const relatedContracts = weavingContractList.filter((wc: any) =>
      Number(wc.salesOrderId) === Number(salesOrderId) || Number(wc.salesOrderNo) === Number(salesOrderId)
    );
    const contractIds = relatedContracts.map((wc: any) => Number(wc.id));
    const contractNos = relatedContracts.map((wc: any) => wc.weavingContractNo || wc.contractNo).filter(Boolean);
    const transformedRows: any[] = [];
    let serialNumber = 1;

    relevantSizingPlans.forEach((sp: any) => {
      const planBeamDetails = Array.isArray(sp.sizingBeamDetails) ? sp.sizingBeamDetails : [];
      const planOutwards = relatedBeamOutwards.filter((bo: any) => {
        const matchPlan = Number(bo?.sizingPlanId) === Number(sp?.id) || bo?.sizingPlanNo === sp?.sizingPlanNo;
        const matchDetails = Array.isArray(bo?.outwardDetails) && bo.outwardDetails.some((d: any) => {
          return Number(d.sizingPlanId) === Number(sp?.id) || d.sizingPlanNo === sp?.sizingPlanNo;
        });
        return matchPlan || matchDetails;
      });

      const planInwards = (Array.isArray(beamInwardList) ? beamInwardList : [])
        .filter((bi: any) => {
          const matchPlan = Number(bi?.sizingPlanId) === Number(sp?.id) || bi?.sizingPlanNo === sp?.sizingPlanNo;
          const matchContract = (bi?.weavingContractId && contractIds.includes(Number(bi.weavingContractId))) ||
            (bi?.weavingContractNo && contractNos.includes(bi.weavingContractNo)) ||
            Number(bi?.salesOrderId) === Number(salesOrderId);

          const matchDetails = Array.isArray(bi?.beamInwardBeamDetails) && bi.beamInwardBeamDetails.some((d: any) => {
            const pMatch = Number(d.sizingPlanId) === Number(sp?.id) || d.sizingPlanNo === sp?.sizingPlanNo || (!d.sizingPlanId && !d.sizingPlanNo);
            const cMatch = (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
              (d.weavingContractNo && contractNos.includes(d.weavingContractNo)) ||
              Number(d.salesOrderId) === Number(salesOrderId);
            return pMatch && cMatch;
          });

          return (matchPlan && matchContract) || matchDetails;
        });

      const beamsPlan =
        Math.max(
          0,
          ...planBeamDetails.map((beam: any) => Number(beam?.noOfBeams) || 0)
        ) || planBeamDetails.length || 0;

      const beamsIssued = planOutwards.reduce((sum: number, bo: any) => {
        const details = Array.isArray(bo?.outwardDetails) ? bo.outwardDetails : [];
        if (details.length > 0) {
          const matchingDetails = details.filter((d: any) => {
            const pMatch = Number(d.sizingPlanId) === Number(sp?.id) || d.sizingPlanNo === sp?.sizingPlanNo || (!d.sizingPlanId && !d.sizingPlanNo);
            const cMatch = (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
              (d.weavingContractNo && contractNos.includes(d.weavingContractNo)) ||
              Number(d.salesOrderId) === Number(salesOrderId);
            return pMatch && cMatch;
          });
          return sum + matchingDetails.length;
        }
        return sum + (Number(bo?.totalNoOfBeams) || 0);
      }, 0);

      const beamsReceived = planInwards.reduce((sum: number, inward: any) => {
        const details = Array.isArray(inward?.beamInwardBeamDetails) ? inward.beamInwardBeamDetails : [];
        if (details.length > 0) {
          const matchingDetails = details.filter((d: any) => {
            const pMatch = Number(d.sizingPlanId) === Number(sp?.id) || d.sizingPlanNo === sp?.sizingPlanNo || (!d.sizingPlanId && !d.sizingPlanNo);
            const cMatch = (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
              (d.weavingContractNo && contractNos.includes(d.weavingContractNo)) ||
              Number(d.salesOrderId) === Number(salesOrderId);
            return pMatch && cMatch;
          });
          return sum + (matchingDetails.length || details.length);
        }
        return sum + Number(inward?.totalNoOfBeams || inward?.totalBeams || 0);
      }, 0);

      const beamMtrsFromOutward = planOutwards.reduce((sum: number, bo: any) => {
        const details = Array.isArray(bo?.outwardDetails) ? bo.outwardDetails : [];
        const matchingDetails = details.filter((d: any) => {
          const pMatch = Number(d.sizingPlanId) === Number(sp?.id) || d.sizingPlanNo === sp?.sizingPlanNo || (!d.sizingPlanId && !d.sizingPlanNo);
          const cMatch = (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
            (d.weavingContractNo && contractNos.includes(d.weavingContractNo)) ||
            Number(d.salesOrderId) === Number(salesOrderId);
          return pMatch && cMatch;
        });
        const beamMtrs = matchingDetails.reduce((inner: number, d: any) => inner + (Number(d?.wrapMeters) || 0), 0);
        return sum + (beamMtrs || Number(bo?.totalBeamMeters || bo?.wrapMeters || 0));
      }, 0);

      const beamMtrsFromInward = planInwards.reduce((sum: number, inward: any) => {
        const details = Array.isArray(inward?.beamInwardBeamDetails) ? inward.beamInwardBeamDetails : [];
        const matchingDetails = details.filter((d: any) => {
          const pMatch = Number(d.sizingPlanId) === Number(sp?.id) || d.sizingPlanNo === sp?.sizingPlanNo || (!d.sizingPlanId && !d.sizingPlanNo);
          const cMatch = (d.weavingContractId && contractIds.includes(Number(d.weavingContractId))) ||
            (d.weavingContractNo && contractNos.includes(d.weavingContractNo)) ||
            Number(d.salesOrderId) === Number(salesOrderId);
          return pMatch && cMatch;
        });
        const beamMtrs = matchingDetails.reduce((inner: number, beam: any) => inner + (Number(beam?.wrapMeters) || 0), 0);

        // Fallback to quality details if beam details meters are 0
        if (beamMtrs === 0) {
          const qualityDetails = Array.isArray(inward?.beamInwardQualityDetails) ? inward.beamInwardQualityDetails : [];
          const matchingQuality = qualityDetails.filter((q: any) => {
            const pMatch = Number(q.sizingPlanId) === Number(sp?.id) || q.sizingPlanNo === sp?.sizingPlanNo || (!q.sizingPlanId && !q.sizingPlanNo);
            const cMatch = (q.weavingContractId && contractIds.includes(Number(q.weavingContractId))) ||
              (q.weavingContractNo && contractNos.includes(q.weavingContractNo)) ||
              Number(q.salesOrderId) === Number(salesOrderId);
            return pMatch && cMatch;
          });
          return sum + (matchingQuality.length > 0
            ? matchingQuality.reduce((inner: number, q: any) => inner + (Number(q?.wrapMeters) || 0), 0)
            : qualityDetails.reduce((inner: number, q: any) => inner + (Number(q?.wrapMeters) || 0), 0));
        }
        return sum + beamMtrs;
      }, 0);

      const beamMeter = Math.max(beamMtrsFromInward, beamMtrsFromOutward) || 0;

      // Calculate Beam Return from salesReturnList
      const beamReturn = salesReturnList.reduce((sum: number, sr: any) => {
        const beamItems = Array.isArray(sr.beamItems) ? sr.beamItems : [];
        const planReturn = beamItems
          .filter((item: any) => {
            const pMatch = item.sizingPlanNo === sp.sizingPlanNo || Number(item.sizingPlanId) === Number(sp.id);
            const cMatch = (item.weavingContractId && contractIds.includes(Number(item.weavingContractId))) ||
              (item.weavingContractNo && contractNos.includes(item.weavingContractNo)) ||
              Number(item.salesOrderId) === Number(salesOrderId);
            return pMatch && cMatch;
          })
          .reduce((inner: number, item: any) => inner + (Number(item.beamMeters) || 0), 0);
        return sum + planReturn;
      }, 0);

      const beamReturnCount = salesReturnList.reduce((sum: number, sr: any) => {
        const beamItems = Array.isArray(sr.beamItems) ? sr.beamItems : [];
        const matchedBeamItems = beamItems.filter((item: any) => {
          const pMatch = item.sizingPlanNo === sp.sizingPlanNo || Number(item.sizingPlanId) === Number(sp.id);
          const cMatch = (item.weavingContractId && contractIds.includes(Number(item.weavingContractId))) ||
            (item.weavingContractNo && contractNos.includes(item.weavingContractNo)) ||
            Number(item.salesOrderId) === Number(salesOrderId);
          return pMatch && cMatch;
        });
        return sum + matchedBeamItems.length;
      }, 0);

      const beamUtilize = beamMeter - beamReturn;

      transformedRows.push({
        id: `beam-summary-${sp.id}`,
        serialNumber: serialNumber++,
        sizingPlanNo: sp.sizingPlanNo || "-",
        beamsPlan,
        beamsReceived,
        beamsIssued,
        beamMeter,
        beamReturn,
        returnedBeams: beamReturnCount,
        beamUtilize,
      });
    });

    return transformedRows;
  };

  const transformSizingYarnIssueData = (salesOrderId: number) => {
    const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
      sp.sizingBeamDetails?.some((beam: any) => Number(beam.salesOrderId) === Number(salesOrderId))
    );
    const sizingPlanIds = relevantSizingPlans.map((sp: any) => sp.id);

    const relatedIssues = sizingYarnIssuetList.filter((issue: any) =>
      sizingPlanIds.includes(issue.sizingPlanId)
    );

    // Group by sizing plan number and sum the required fields
    const groupedBySizingPlan: Record<string, any> = {};

    relatedIssues.forEach((issue: any) => {
      const sizingPlan = relevantSizingPlans.find((sp: any) => sp.id === issue.sizingPlanId);
      const sizingPlanNoValue = issue.sizingPlanNo || sizingPlan?.sizingPlanNo || String(issue.sizingPlanId) || "-";

      // Initialize group if not exists
      if (!groupedBySizingPlan[sizingPlanNoValue]) {
        groupedBySizingPlan[sizingPlanNoValue] = {
          sizingPlanNo: sizingPlanNoValue,
          yarnRequired: 0,
          issuedQty: 0,
          balanceYarn: 0,
          yarnReturn: 0,
          consumed: 0
        };
      }

      // Sum yarnRequired/balance from requirements (if present)
      const requirements = issue.requirements || [];
      requirements.forEach((req: any) => {
        const yarnRequired = Number(req.warpRequirement || 0);
        const balanceYarn = Number(req.balanceToIssue || 0);
        groupedBySizingPlan[sizingPlanNoValue].yarnRequired += yarnRequired;
        groupedBySizingPlan[sizingPlanNoValue].balanceYarn += balanceYarn;
      });

      // Prefer actual issued quantities from sizingYarnIssue entries (issueQty) when available
      const sizingIssueEntries = Array.isArray(issue.sizingYarnIssue) ? issue.sizingYarnIssue : [];
      const issueQtyFromEntries = sizingIssueEntries.reduce((sum: number, e: any) => {
        return sum + (Number(e.issueQty || e.issueQty) || 0);
      }, 0);

      // Fallback to totals reported in requirements (totalIssuedQty) if sizingIssue entries are not present
      const issuedQtyFromRequirements = requirements.reduce((sum: number, req: any) => {
        return sum + (Number(req.totalIssuedQty || 0) || 0);
      }, 0);

      const finalIssuedQty = issueQtyFromEntries > 0 ? issueQtyFromEntries : issuedQtyFromRequirements;

      const yarnReturn = yarnReturnMap[sizingPlanNoValue] || 0;
      const consumed = finalIssuedQty - yarnReturn;

      // Sum the values for this sizing plan
      groupedBySizingPlan[sizingPlanNoValue].issuedQty += finalIssuedQty;
      groupedBySizingPlan[sizingPlanNoValue].yarnReturn += yarnReturn;
      groupedBySizingPlan[sizingPlanNoValue].consumed += consumed;
    });

    // Convert grouped object to array with serial numbers
    const transformedRows: any[] = [];
    let serialNumber = 1;
    Object.values(groupedBySizingPlan).forEach((group: any) => {
      transformedRows.push({
        id: group.sizingPlanNo,
        serialNumber: serialNumber++,
        sizingPlanNo: group.sizingPlanNo,
        yarnRequired: group.yarnRequired,
        issuedQty: group.issuedQty,
        balanceYarn: group.balanceYarn,
        yarnReturn: group.yarnReturn,
        consumed: group.consumed
      });
    });

    return transformedRows;
  };

  const transformWeftIssueData = (weftIssues: any[]) => {
    // Group by weaving contract number and sum the required fields
    const groupedByContract: Record<string, any> = {};

    weftIssues.forEach((weftIssue: any) => {
      const vendor = vendorList.find((v: any) => v.id === weftIssue.vendorId);
      const vendorName = vendor?.vendorName || 'Unknown Vendor';
      const weavingContract = weavingContractList.find((wc: any) => wc.id === weftIssue.weavingContractId);
      const weavingContractNo = weavingContract?.weavingContractNo || `Contract ${weftIssue.weavingContractId}`;

      // Initialize group if not exists
      if (!groupedByContract[weavingContractNo]) {
        groupedByContract[weavingContractNo] = {
          weavingContractNo,
          vendorName,
          yarnRequired: 0,
          issuedQty: 0,
          balanceYarn: 0,
          yarnReturn: 0,
          consumed: 0,
          yarnNames: new Set<string>()
        };
      }

      // Extract item names and issued quantities from requirements
      if (weftIssue.requirements && Array.isArray(weftIssue.requirements)) {
        weftIssue.requirements.forEach((req: any) => {
          const yarnName = req.yarnName || req.actualYarn || '-';
          const yarnRequired = Number(req.totalReqQty || 0) || 0;
          const balanceToIssue = Number(req.balanceToIssue || (req.totalReqQty && req.totalReqQty - (req.totalIssueQty || 0)) || 0) || 0;

          // Prefer actual issued quantities from nested yarnIssues entries (issueQty) when available
          const yarnIssues = Array.isArray(req.yarnIssues) ? req.yarnIssues : [];
          const issueQtyFromEntries = yarnIssues.reduce((sum: number, e: any) => {
            return sum + (Number(e.issueQty || 0) || 0);
          }, 0);

          // Fallback to totals reported in requirements if yarnIssues entries are not present
          const issuedQtyFromRequirements = Number(req.totalIssueQty || req.overallTotalIssueQty || 0) || 0;

          const finalIssuedQty = issueQtyFromEntries > 0 ? issueQtyFromEntries : issuedQtyFromRequirements;

          const yarnReturn = yarnReturnMap[weavingContractNo] || 0;
          const consumed = finalIssuedQty - yarnReturn;

          // Sum the values for this contract
          groupedByContract[weavingContractNo].yarnRequired += yarnRequired;
          groupedByContract[weavingContractNo].issuedQty += finalIssuedQty;
          groupedByContract[weavingContractNo].balanceYarn += balanceToIssue;
          groupedByContract[weavingContractNo].yarnReturn += yarnReturn;
          groupedByContract[weavingContractNo].consumed += consumed;
          groupedByContract[weavingContractNo].yarnNames.add(yarnName);
        });
      }
    });

    // Convert grouped object to array with serial numbers
    const transformedRows: any[] = [];
    let serialNumber = 1;
    Object.values(groupedByContract).forEach((group: any) => {
      const uniqueYarns = Array.from(group.yarnNames as Set<string>);
      let itemName = 'Multiple Items';
      if (uniqueYarns.length === 1) {
        itemName = uniqueYarns[0];
      } else if (uniqueYarns.length > 1) {
        itemName = uniqueYarns.join(', ');
      } else {
        itemName = '-';
      }

      transformedRows.push({
        serialNumber: serialNumber++,
        weavingContractNo: group.weavingContractNo,
        vendorName: group.vendorName,
        itemName,
        yarnRequired: group.yarnRequired,
        issuedQty: group.issuedQty,
        balanceYarn: group.balanceYarn,
        yarnReturn: group.yarnReturn,
        consumed: group.consumed
      });
    });

    return transformedRows;
  };
  const transformFabricReceiveData = (fabricReceives: any[], transformedBeamOutwardData?: any[]) => {
    const transformedRows: any[] = [];
    let serialNumber = 1;
    fabricReceives.forEach((fabricReceive: any) => {
      const vendor = vendorList.find((v: any) => v.id === fabricReceive.vendorId);
      const vendorName = vendor?.vendorName || 'Unknown Vendor';

      let totalPieces = 0;
      let totalMeters = 0;
      let totalInspectedMtr = 0;
      let totalNetWgt = 0;

      if (fabricReceive.jobworkFabricReceiveItemsDtl && Array.isArray(fabricReceive.jobworkFabricReceiveItemsDtl)) {
        fabricReceive.jobworkFabricReceiveItemsDtl.forEach((item: any) => {
          if (item.pieceEntries && Array.isArray(item.pieceEntries)) {
            totalPieces += item.pieceEntries.length;
            item.pieceEntries.forEach((piece: any) => {
              const pieceQuantity = Number(piece.quantity || piece.pieceMeter || 0);
              const inspectedMeters = Number(piece.inspectedMtr || 0);
              const inspectedNetWeight = Number(piece.inspectedNtWt || 0);
              totalMeters += pieceQuantity;
              totalInspectedMtr += inspectedMeters;
              totalNetWgt += inspectedNetWeight;
            });
          }
        });
      }

      // Try to sum beam meters based on unique beams associated with received pieces
      const uniqueBeams = new Map<string, { beamNo: string; beamId: any }>();
      if (fabricReceive.jobworkFabricReceiveItemsDtl && Array.isArray(fabricReceive.jobworkFabricReceiveItemsDtl)) {
        fabricReceive.jobworkFabricReceiveItemsDtl.forEach((item: any) => {
          if (item.pieceEntries && Array.isArray(item.pieceEntries)) {
            item.pieceEntries.forEach((piece: any) => {
              const bNo = piece.beamNo || "";
              const bId = piece.beamId || "";
              if (bNo || bId) {
                const key = `${bNo}_${bId}`;
                if (!uniqueBeams.has(key)) {
                  uniqueBeams.set(key, { beamNo: bNo, beamId: bId });
                }
              }
            });
          }
        });
      }

      const getBeamMtrForBeam = (beamNo: string, beamId: number | string) => {
        let beamMtr = 0;
        if (Array.isArray(beamOutwardList)) {
          for (const outward of beamOutwardList) {
            if (outward.outwardDetails && Array.isArray(outward.outwardDetails)) {
              const detail = outward.outwardDetails.find((d: any) =>
                (beamNo && d.sizedBeamNo === beamNo) || (beamId && Number(d.id) === Number(beamId))
              );
              if (detail) {
                beamMtr = Number(detail.wrapMeters) || 0;
                break;
              }
            }
          }
        }
        if (beamMtr === 0 && Array.isArray(beamInwardList)) {
          for (const factoryBeam of beamInwardList) {
            const beamDetail = factoryBeam.beamInwardBeamDetails?.find((beam: any) =>
              (beamId && Number(beam.id) === Number(beamId)) || (beamNo && beam.beamNo === beamNo)
            );
            if (beamDetail) {
              beamMtr = Number(beamDetail.wrapMeters) || 0;
              break;
            }
          }
        }
        return beamMtr;
      };

      let beamMeter = 0;
      uniqueBeams.forEach((beam) => {
        beamMeter += getBeamMtrForBeam(beam.beamNo, beam.beamId);
      });

      if (beamMeter === 0) {
        // Fallback to contract-based matching
        const targetContractId = Number(fabricReceive.weavingContractId);
        const targetContractNo = fabricReceive.weavingContractNo ? String(fabricReceive.weavingContractNo).trim() : "";

        const matchingOutwards = (Array.isArray(beamOutwardList) ? beamOutwardList : []).filter(
          (bo: any) => {
            const matchId = targetContractId && (
              Number(bo.weavingContractId) === targetContractId ||
              (Array.isArray(bo.outwardDetails) &&
                bo.outwardDetails.some((d: any) => Number(d.weavingContractId) === targetContractId))
            );
            const matchNo = targetContractNo && (
              (bo.weavingContractNo && String(bo.weavingContractNo).trim() === targetContractNo) ||
              (Array.isArray(bo.outwardDetails) &&
                bo.outwardDetails.some((d: any) => d.weavingContractNo && String(d.weavingContractNo).trim() === targetContractNo))
            );
            return matchId || matchNo;
          }
        );

        beamMeter = matchingOutwards.reduce((sum: number, bo: any) => {
          let boMtr = 0;
          if (Array.isArray(bo.outwardDetails) && bo.outwardDetails.length > 0) {
            boMtr = bo.outwardDetails
              .filter((d: any) => {
                const matchDetId = targetContractId && Number(d.weavingContractId) === targetContractId;
                const matchDetNo = targetContractNo && d.weavingContractNo && String(d.weavingContractNo).trim() === targetContractNo;
                return matchDetId || matchDetNo;
              })
              .reduce((inner: number, d: any) => inner + (Number(d.wrapMeters) || 0), 0);
          }
          if (boMtr === 0) {
            boMtr = Number(bo.totalBeamMeters || bo.wrapMeters || 0);
          }
          return sum + boMtr;
        }, 0);
      }

      const totalMeter = totalMeters;

      // Fetch beamConsumed from transformedBeamOutwardData using weavingContractNo
      const targetContractNo = fabricReceive.weavingContractNo ? String(fabricReceive.weavingContractNo).trim().toLowerCase() : "";
      const matchedBeamOutward = (transformedBeamOutwardData || []).find(
        (bo: any) => bo.weavingContractNo && String(bo.weavingContractNo).trim().toLowerCase() === targetContractNo
      );
      const beamConsumed = matchedBeamOutward ? Number(matchedBeamOutward.beamConsumed || 0) : 0;

      const baseMeter = beamConsumed > 0 ? beamConsumed : beamMeter;

      // Crimp % = ((totalBeamMeters - totalMtr) / totalBeamMeters) * 100
      const crimpPercentage =
        baseMeter > 0
          ? ((baseMeter - totalMeter) / baseMeter) * 100
          : 0;

      transformedRows.push({
        serialNumber: serialNumber++,
        receiveNo: fabricReceive.receiveNo,
        receiveDate: fabricReceive.jobFabricReceiveDate,
        weavingContractNo: fabricReceive.weavingContractNo,
        weaverName: fabricReceive.weaverName || vendorName,
        vendorName,
        fabricDetails: fabricReceive.fabricDetails,
        totalPieces,
        totalMeters,
        totalInspectedMtr,
        totalNetWgt,
        totalAvgWgt: totalInspectedMtr > 0 ? totalNetWgt / totalInspectedMtr : (totalMeters > 0 ? totalNetWgt / totalMeters : 0),
        crimpPercentage,
        fabricReceiveId: fabricReceive.id
      });
    });
    return transformedRows;
  };

  const transformWeavingSummaryFromPieceEntries = (salesOrderId: number, transformedFabricReceiveData: any[]) => {
    const id = Number(salesOrderId);
    const relatedContracts = weavingContractList.filter((wc: any) =>
      Number(wc.salesOrderId) === id || Number(wc.salesOrderNo) === id
    );
    const contractNos = relatedContracts.map((wc: any) => wc.weavingContractNo || wc.contractNo).filter(Boolean);

    // 1. Get all unique contract numbers across contracts, receives, and piece entries
    const allContractNos = new Set<string>();
    contractNos.forEach((no: any) => allContractNos.add(String(no).trim()));
    (transformedFabricReceiveData || []).forEach((item: any) => {
      if (item.weavingContractNo) allContractNos.add(String(item.weavingContractNo).trim());
    });

    // Add contract numbers from doffedDetails
    Object.keys(doffedDetails || {}).forEach((contractNo) => {
      if (contractNos.some((no: any) => String(no).trim() === contractNo)) {
        allContractNos.add(contractNo);
      }
    });

    const groupedByContract: Record<string, any> = {};

    allContractNos.forEach((contractNo: string) => {
      // Find matching contract
      const matchingContract = relatedContracts.find((wc: any) => 
        String(wc.weavingContractNo || wc.contractNo).trim() === contractNo
      );
      const targetContractId = matchingContract?.id;

      // Find weaver name
      let weaverName = '';
      if (matchingContract) {
        const vendor = vendorList.find((v: any) => v.id === matchingContract.vendorId);
        weaverName = vendor?.vendorName;
      }

      // Gather Jobwork Receives for this contract
      const contractReceives = (transformedFabricReceiveData || []).filter((item: any) => 
        String(item.weavingContractNo).trim() === contractNo
      );

      // Gather Doffed Details (factory piece entries) for this contract from local state
      const contractDoffs = doffedDetails[contractNo] || [];

      // Sum everything
      const jobworkPieces = contractReceives.reduce((sum: number, item: any) => sum + (Number(item.totalPieces) || 0), 0);
      const jobworkMeters = contractReceives.reduce((sum: number, item: any) => sum + (Number(item.totalMeters) || 0), 0);
      const jobworkInspectedMtr = contractReceives.reduce((sum: number, item: any) => sum + (Number(item.totalInspectedMtr) || 0), 0);
      const jobworkNetWgt = contractReceives.reduce((sum: number, item: any) => sum + (Number(item.totalNetWgt) || 0), 0);

      const doffedPieces = contractDoffs.length;
      const doffedMeters = contractDoffs.reduce((sum: number, piece: any) => sum + (Number(piece.quantity || piece.pieceMeter || 0)), 0);
      const doffedInspectedMtr = contractDoffs.reduce((sum: number, piece: any) => sum + (Number(piece.inspectedMtr || 0)), 0);
      const doffedNetWgt = contractDoffs.reduce((sum: number, piece: any) => sum + (Number(piece.inspectedNtWt || 0)), 0);

      const totalPieces = jobworkPieces + doffedPieces;
      const totalMeters = jobworkMeters + doffedMeters;
      const totalInspectedMtr = jobworkInspectedMtr + doffedInspectedMtr;
      const totalNetWgt = jobworkNetWgt + doffedNetWgt;

      // Resolve weaver name fallback
      if (!weaverName && contractReceives.length > 0) {
        weaverName = contractReceives[0].weaverName || contractReceives[0].vendorName;
      }
      if (!weaverName && contractDoffs.length > 0) {
        const firstDoff: any = contractDoffs[0];
        weaverName = firstDoff.weaverName || firstDoff.vendorName;
        if (!weaverName) {
          const firstPiece: any = contractDoffs[0];
          if (firstPiece.vendorId) {
            const vendor = vendorList.find((v: any) => v.id === firstPiece.vendorId);
            weaverName = vendor?.vendorName;
          }
        }
      }
      if (!weaverName) {
        weaverName = 'Unknown Weaver';
      }

      groupedByContract[contractNo] = {
        weavingContractNo: contractNo,
        weavingContractId: targetContractId,
        weaverName,
        totalPieces,
        totalMeters,
        totalInspectedMtr,
        totalNetWgt,
        hasData: totalPieces > 0 || totalMeters > 0 || matchingContract
      };
    });

    const transformedRows: any[] = [];
    let serialNumber = 1;

    Object.values(groupedByContract).forEach((group: any) => {
      if (!group.hasData) return;

      const targetContractId = Number(group.weavingContractId);
      const targetContractNo = group.weavingContractNo ? String(group.weavingContractNo).trim() : "";

      const matchingOutwards = (Array.isArray(beamOutwardList) ? beamOutwardList : []).filter(
        (bo: any) => {
          const matchId = targetContractId && (
            Number(bo.weavingContractId) === targetContractId ||
            (Array.isArray(bo.outwardDetails) &&
              bo.outwardDetails.some((d: any) => Number(d.weavingContractId) === targetContractId))
          );
          const matchNo = targetContractNo && (
            (bo.weavingContractNo && String(bo.weavingContractNo).trim() === targetContractNo) ||
            (Array.isArray(bo.outwardDetails) &&
              bo.outwardDetails.some((d: any) => d.weavingContractNo && String(d.weavingContractNo).trim() === targetContractNo))
          );
          return matchId || matchNo;
        }
      );

      let beamMeter = matchingOutwards.reduce((sum: number, bo: any) => {
        let boMtr = 0;
        if (Array.isArray(bo.outwardDetails) && bo.outwardDetails.length > 0) {
          boMtr = bo.outwardDetails
            .filter((d: any) => {
              const matchDetId = targetContractId && Number(d.weavingContractId) === targetContractId;
              const matchDetNo = targetContractNo && d.weavingContractNo && String(d.weavingContractNo).trim() === targetContractNo;
              return matchDetId || matchDetNo;
            })
            .reduce((inner: number, d: any) => inner + (Number(d.wrapMeters) || 0), 0);
        }
        if (boMtr === 0) {
          boMtr = Number(bo.totalBeamMeters || bo.wrapMeters || 0);
        }
        return sum + boMtr;
      }, 0);

      const crimpPercentage =
        beamMeter > 0
          ? ((beamMeter - group.totalMeters) / beamMeter) * 100
          : 0;

      transformedRows.push({
        serialNumber: serialNumber++,
        fabricReceiveId: group.weavingContractNo,
        weavingContractNo: group.weavingContractNo,
        weaverName: group.weaverName,
        totalPieces: group.totalPieces,
        totalMeters: group.totalMeters,
        totalInspectedMtr: group.totalInspectedMtr,
        totalNetWgt: group.totalNetWgt,
        totalAvgWgt: group.totalInspectedMtr > 0 
          ? group.totalNetWgt / group.totalInspectedMtr 
          : (group.totalMeters > 0 ? group.totalNetWgt / group.totalMeters : 0),
        crimpPercentage
      });
    });

    return transformedRows;
  };

  const calculateWeavingSummary = (fabricReceiveRows: any[]) => {
    const totalPieces = fabricReceiveRows.reduce((sum: number, row: any) => sum + (Number(row?.totalPieces) || 0), 0);
    const totalDoffedMtr = fabricReceiveRows.reduce((sum: number, row: any) => sum + (Number(row?.totalMeters) || 0), 0);
    const totalInspectedMtr = fabricReceiveRows.reduce((sum: number, row: any) => sum + (Number(row?.totalInspectedMtr) || 0), 0);
    const totalNetWeight = fabricReceiveRows.reduce((sum: number, row: any) => sum + (Number(row?.totalNetWgt) || 0), 0);

    const totalAvgWgt = totalInspectedMtr > 0
      ? totalNetWeight / totalInspectedMtr
      : (totalDoffedMtr > 0 ? totalNetWeight / totalDoffedMtr : 0);

    const crimpRows = fabricReceiveRows
      .map((row: any) => Number(row?.crimpPercentage))
      .filter((value: number) => Number.isFinite(value));
    const avgCrimpPercentage = crimpRows.length > 0
      ? crimpRows.reduce((sum: number, value: number) => sum + value, 0) / crimpRows.length
      : 0;

    return {
      totalPieces,
      totalDoffedMtr,
      totalInspectedMtr,
      totalNetWeight,
      totalAvgWgt,
      avgCrimpPercentage
    };
  };
  const getYarnPurchaseSummary = (salesOrderId: number) => {
    const purchaseOrders = getPurchaseOrdersForSalesOrder(salesOrderId);
    const purchaseInwards = getPurchaseInwardsForSalesOrder(salesOrderId);
    const salesOrder = tabFilteredOrders.find((order: SalesOrderData) => order.id === salesOrderId);
    const yarnSummaryMap = new Map<string, {
      yarnCount: string;
      requiredQty: number;
      orderedQty: number;
      inwardQty: number;
    }>();
    purchaseOrders.forEach((po: any) => {
      po.purchaseOrderItemsDtl?.forEach((item: any) => {
        const yarnKey = item.yarnName || 'Unknown';
        const existing = yarnSummaryMap.get(yarnKey) || {
          yarnCount: yarnKey,
          requiredQty: 0,
          orderedQty: 0,
          inwardQty: 0
        };
        existing.orderedQty += Number(item.quantity || 0);
        if (salesOrder && item.yarnId) {
          const requiredQtyStr = calculateRequiredQuantity(salesOrder, Number(item.yarnId), true, true);
          existing.requiredQty = Number(requiredQtyStr) || 0;
        }
        yarnSummaryMap.set(yarnKey, existing);
      });
    });
    purchaseInwards.forEach((inward: any) => {
      const items = inward.purchaseInwardItemsDtl || [];
      items.forEach((item: any) => {
        item.yarnStockDetails?.forEach((stock: any) => {
          const yarnKey = stock.yarnCode || stock.productName || 'Unknown';
          const existing = yarnSummaryMap.get(yarnKey) || {
            yarnCount: yarnKey,
            requiredQty: 0,
            orderedQty: 0,
            inwardQty: 0
          };
          existing.inwardQty += Number(stock.inwardQty || stock.acceptedQty || 0);
          yarnSummaryMap.set(yarnKey, existing);
        });
      });
    });
    const summaryData = Array.from(yarnSummaryMap.values()).map(item => ({
      ...item,
      balanceQty: item.orderedQty - item.inwardQty
    }));
    return summaryData;
  };
  const handleSalesOrderClick = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    setExpandedRowId((prevExpanded) => {
      const isClosing = prevExpanded === salesOrder.id;
      if (isClosing) {
        setViewMode(prev => ({ ...prev, [salesOrder.id]: false }));
        setWeavingViewMode(prev => ({ ...prev, [salesOrder.id]: false }));
        setSizingViewMode(prev => ({ ...prev, [salesOrder.id]: false }));
        setActiveSubTab("yarnPurchase");
        return null;
      }
      setViewMode(prev => ({ ...prev, [salesOrder.id]: true }));
      setWeavingViewMode(prev => ({ ...prev, [salesOrder.id]: true }));
      setSizingViewMode(prev => ({ ...prev, [salesOrder.id]: true }));
      return salesOrder.id;
    });
  }, [isNavigating]);
  const handleGeneratePurchaseOrder = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;
    setIsNavigating(true);
    const firstItem =
      salesOrder.items && salesOrder.items.length > 0
        ? salesOrder.items[0]
        : null;
    navigate(
      "/transaction/purchase-order?purchaseOrderId=0&purchaseOrderItemId=0",
      {
        state: {
          fromOrderEntry: true,
          salesOrderId: salesOrder.id,
          salesOrderNo: salesOrder.salesOrderNo,
          activeTab,
          expandedRowId: salesOrder.id,
          flowType: 'yarnPurchase',
          selectedHyperlink: 'purchaseOrder',
          autoFetchSalesOrderNo: true,
          salesOrderData: {
            salesOrderNo: salesOrder.salesOrderNo,
            fabricCode: firstItem?.fabricCode || "",
            quality: firstItem?.quality || firstItem?.buyerProduct || "",
            customerId: salesOrder.buyerCustomerName,
          },
        },
      }
    );
    // Reset navigation state after a delay
    setTimeout(() => setIsNavigating(false), 300);
  }, [isNavigating, activeTab]);
  const handleGeneratePurchaseInward = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;
    const purchaseOrders = getPurchaseOrdersForSalesOrder(salesOrder.id);
    if (purchaseOrders.length === 0) {
      toast.error("No Purchase Order found for this Sales Order. Please create a Purchase Order first.");
      return;
    }
    const firstPurchaseOrder = purchaseOrders[0];
    if (Number(firstPurchaseOrder.isApproved) !== 1) {
      toast.error(`Purchase Order ${firstPurchaseOrder.poNo} is not approved. Please approve the Purchase Order before generating Purchase Inward.`);
      return;
    }
    setIsNavigating(true);
    navigate("/transaction/purchase-inward", {
      state: {
        fromOrderEntry: true,
        poType: "Yarn",
        salesOrderId: salesOrder.id,
        salesOrderNo: salesOrder.salesOrderNo,
        expandedRowId: salesOrder.id,
        activeTab,
        flowType: 'yarnPurchase',
        selectedHyperlink: 'purchaseInward',
        vendorId: firstPurchaseOrder?.vendorId,
        vendorName: firstPurchaseOrder ? getVendorName(firstPurchaseOrder.vendorId) : null,
        purchaseOrderId: firstPurchaseOrder?.id,
        purchaseOrderNo: firstPurchaseOrder?.poNo,
      },
    });
    // Reset navigation state after a delay
    setTimeout(() => setIsNavigating(false), 300);
  }, [isNavigating, activeTab]);
  const handleGenerateWeavingContract = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate("/transaction/weaving-contract-entry", {
      state: {
        source: 'order-entry-management',
        salesOrderId: salesOrder.id,
        salesOrderNo: salesOrder.salesOrderNo,
        flowType: 'weaving',
        selectedHyperlink: 'weavingContract',
        activeTab
      }
    });
    // Reset navigation state after a delay
    setTimeout(() => setIsNavigating(false), 300);
  }, [isNavigating, activeTab]);
  const handleGenerateBeamOutward = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;

    if (isLoadingWeavingContracts) {
      toast.info("Loading contract data, please try again in a moment.");
      return;
    }

    // Show toast and block navigation if Weaving Contract does not exist
    if (!validateWeavingContractExists(salesOrder.id)) {
      toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
      return;
    }

    setIsNavigating(true);
    navigate("/transaction/beam-outward", {
      state: {
        source: 'order-entry-management',
        salesOrderId: salesOrder.id,
        salesOrderNo: salesOrder.salesOrderNo,
        flowType: 'weaving',
        selectedHyperlink: 'beamOutward',
        activeTab
      }
    });
    // Reset navigation state after a delay
    setTimeout(() => setIsNavigating(false), 300);
  }, [isNavigating, isLoadingWeavingContracts, weavingContractList, activeTab]);
  const handleGenerateWeftIssue = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;

    if (isLoadingWeavingContracts) {
      toast.info("Loading contract data, please try again in a moment.");
      return;
    }

    // Show toast and block navigation if Weaving Contract does not exist
    if (!validateWeavingContractExists(salesOrder.id)) {
      toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
      return;
    }

    // Get weaving contracts for this sales order to find vendor and contract info
    const weavingContracts = getWeavingContractsForSalesOrder(salesOrder.id);
    // Use the first active weaving contract to get vendor and contract details
    const firstContract = weavingContracts.find((wc: any) => wc.isComplete !== 1) || weavingContracts[0];

    // Construct fabric details string
    let fabricDetails = "";
    if (firstContract?.items && firstContract.items.length > 0) {
      fabricDetails = firstContract.items.map((item: any) => {
        const fabric = fabricMasters?.find((f: any) => f.id === item.fabricCodeId);
        const fabricCode = fabric?.fabricCode || item.fabricCodeId;
        const fabricQuality = fabric?.fabricQuality || item.fabricQualityId;
        return `${fabricCode} - ${fabricQuality}`;
      }).join(', ');
    }

    setIsNavigating(true);
    navigate("/transaction/weaving-yarn-issue", {
      state: {
        source: 'order-entry-management',
        salesOrderId: salesOrder.id,
        salesOrderNo: salesOrder.salesOrderNo,
        weavingContractId: firstContract?.id,
        vendorId: firstContract?.vendorId,
        fabricDetails: fabricDetails,
        flowType: 'weaving',
        selectedHyperlink: 'weftIssue',
        activeTab
      }
    });
    // Reset navigation state after a delay
    setTimeout(() => setIsNavigating(false), 300);
  }, [isNavigating, isLoadingWeavingContracts, weavingContractList, activeTab, fabricMasters]);
  const handleGenerateFabricReceived = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;

    if (isLoadingWeavingContracts) {
      toast.info("Loading contract data, please try again in a moment.");
      return;
    }

    // Show toast and block navigation if Weaving Contract does not exist
    if (!validateWeavingContractExists(salesOrder.id)) {
      toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
      return;
    }

    setIsNavigating(true);
    // Get weaving contracts for this sales order to find vendor and contract info
    const weavingContracts = getWeavingContractsForSalesOrder(salesOrder.id);
    // Use the first active weaving contract to get vendor and contract details
    const firstContract = weavingContracts.find((wc: any) => wc.isComplete !== 1) || weavingContracts[0];
    const stateData: any = {
      source: 'order-entry-management',
      salesOrderId: salesOrder.id,
      salesOrderNo: salesOrder.salesOrderNo,
      flowType: 'weaving',
      selectedHyperlink: 'fabricReceived',
      activeTab
    };
    // Add vendor data if available
    if (firstContract?.vendorId) {
      stateData.vendorId = firstContract.vendorId;
      stateData.vendorName = getVendorName(firstContract.vendorId);
    }
    // Add weaving contract data if available
    if (firstContract?.id) {
      stateData.weavingContractId = firstContract.id;
      stateData.weavingContractNo = firstContract.weavingContractNo || firstContract.contractNo;
    }
    navigate("/transaction/jobwork-fabric-receive", {
      state: stateData
    });
    // Reset navigation state after a delay
    setTimeout(() => setIsNavigating(false), 300);
  }, [isNavigating, isLoadingWeavingContracts, weavingContractList, activeTab]);
  const handleGenerateSizingPlan = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;

    if (isLoadingWeavingContracts) {
      toast.info("Loading contract data, please try again in a moment.");
      return;
    }

    if (!validateWeavingContractExists(salesOrder.id)) {
      toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
      return;
    }
    setIsNavigating(true);
    const firstItem =
      salesOrder.items && salesOrder.items.length > 0
        ? salesOrder.items[0]
        : null;
    navigate(
      "/transaction/sizing-plan-entry",
      {
        state: {
          source: 'order-entry-management',
          salesOrderId: salesOrder.id,
          salesOrderNo: salesOrder.salesOrderNo,
          activeTab,
          expandedRowId: salesOrder.id,
          flowType: 'sizing',
          selectedHyperlink: 'sizingPlan',
          salesOrderData: {
            salesOrderNo: salesOrder.salesOrderNo,
            fabricCode: firstItem?.fabricCode || "",
            quality: firstItem?.quality || firstItem?.buyerProduct || "",
            customerId: salesOrder.buyerCustomerName,
          },
        },
      }
    );
    // Reset navigation state after a delay
    setTimeout(() => setIsNavigating(false), 300);
  }, [isNavigating, activeTab, isLoadingWeavingContracts, weavingContractList]);
  const handleGenerateSizingYarnIssue = useCall((salesOrder: SalesOrderData) => {
    if (isNavigating) return;

    if (isLoadingWeavingContracts) {
      toast.info("Loading contract data, please try again in a moment.");
      return;
    }

    if (!validateWeavingContractExists(salesOrder.id)) {
      toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
      return;
    }

    const relevantSizingPlans = sizingPlanList.filter((sp: any) =>
      sp.sizingBeamDetails?.some((beam: any) => Number(beam.salesOrderId) === Number(salesOrder.id))
    );

    if (relevantSizingPlans.length === 0) {
      toast.error("No Sizing Plan found for this Sales Order. Please create a Sizing Plan first.");
      return;
    }

    setIsNavigating(true);

    const firstPlan = relevantSizingPlans[0];

    navigate("/transaction/sizing-yarn-issue", {
      state: {
        source: 'order-entry-management',
        salesOrderId: salesOrder.id,
        salesOrderNo: salesOrder.salesOrderNo,
        activeTab,
        expandedRowId: salesOrder.id,
        flowType: 'sizing',
        selectedHyperlink: 'sizingYarnIssue',
        sizingPlanId: firstPlan.id,
        vendorId: firstPlan.vendorId,
      },
    });
    setTimeout(() => setIsNavigating(false), 300);
  }, [isNavigating, activeTab, sizingPlanList, isLoadingWeavingContracts, weavingContractList]);
  /* ─── Columns definition (unchanged logic) ─── */
  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "sNo",
        width: 60,
        minWidth: 60,
        Cell: (props: any) => props.row.index + 1,
        disableFilters: true,
      },
      {
        Header: "SO Date",
        accessor: "orderDate",
        width: 110,
        minWidth: 110,
        Cell: (props: any) =>
          props.value ? formatDate(props.value) : "",
      },
      {
        Header: "Sales Order No",
        accessor: "salesOrderNo",
        width: 160,
        minWidth: 160,
        Cell: (props: any) => {
          const salesOrder = props.row.original;
          const isExpanded = expandedRowId === salesOrder.id;
          return (
            <button
              onClick={() => handleSalesOrderClick(salesOrder)}
              disabled={isNavigating}
              className={`text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600 transition-all duration-150 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed ${isExpanded ? 'text-blue-800 decoration-blue-600' : ''
                }`}
            >
              <span className="inline-flex items-center gap-1">
                <span>{salesOrder.salesOrderNo}</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
          );
        },
      },
      {
        Header: "Customer Name",
        accessor: "buyerCustomerName",
        minWidth: 180,
      },
      {
        Header: "Customer PO No",
        accessor: "buyerPoNo",
        width: 150,
        minWidth: 150,
      },
      {
        Header: "Sort No",
        accessor: "items",
        width: 130,
        minWidth: 130,
        Cell: (props: any) =>
          props.value?.length > 0 ? props.value[0]?.fabricCode || "" : "",
      },
      {
        Header: "Construction",
        accessor: "items",
        minWidth: 180,
        Cell: (props: any) =>
          props.value?.length > 0 ? props.value[0]?.buyerProduct || "" : "",
      },
      {
        Header: "Order Qty",
        accessor: "items",
        width: 110,
        minWidth: 110,
        cellClassName: "text-center tabular-nums",
        Cell: (props: any) =>
          props.value?.length > 0 ? props.value[0]?.orderQty || 0 : 0,
      },
      {
        Header: "Dispatched Qty",
        accessor: "dispatchedQuantity",
        width: 120,
        minWidth: 120,
        cellClassName: "text-center tabular-nums",
        Cell: () => 0,
      },
      {
        Header: "Balance Qty",
        accessor: "balanceQuantity",
        width: 110,
        minWidth: 110,
        cellClassName: "text-center tabular-nums",
        Cell: (props: any) => {
          const salesOrder = props.row.original;
          const orderQty =
            salesOrder.items?.length > 0
              ? salesOrder.items[0]?.orderQty || 0
              : 0;
          return orderQty;
        },
      },
      {
        Header: "Status",
        accessor: "status",
        width: 90,
        minWidth: 90,
        cellClassName: "text-center",
        Cell: () => (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 tracking-wide">
            Open
          </span>
        ),
      },
    ],
    [expandedRowId, isNavigating]
  );
  /* ─── Empty state component ─── */
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-7 px-6 bg-slate-50/50">
      <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-[12.5px] font-medium text-slate-400">{message}</p>
    </div>
  );
  /* ─── Section card wrapper ─── */
  const SectionCard = ({
    icon,
    title,
    actionLabel,
    onAction,
    accentColor = "blue",
    children,
    showActionNearTitle = false,
  }: {
    icon: React.ReactNode;
    title: string;
    actionLabel?: string;
    onAction?: () => void;
    accentColor?: "blue" | "violet" | "emerald" | "amber" | "slate";
    children: React.ReactNode;
    showActionNearTitle?: boolean;
  }) => {
    const accent = {
      blue: {
        bar: "bg-blue-800",
        badge: "bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100 hover:text-blue-800",
        header: "bg-white border-slate-100",
        icon: "text-blue-400",
        iconBg: "bg-blue-50",
      },
      violet: {
        bar: "bg-violet-500",
        badge: "bg-violet-50 text-violet-700 border-violet-200/80 hover:bg-violet-100 hover:text-violet-800",
        header: "bg-white border-slate-100",
        icon: "text-violet-400",
        iconBg: "bg-violet-50",
      },
      emerald: {
        bar: "bg-emerald-500",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 hover:text-emerald-800",
        header: "bg-white border-slate-100",
        icon: "text-emerald-400",
        iconBg: "bg-emerald-50",
      },
      amber: {
        bar: "bg-amber-500",
        badge: "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100 hover:text-amber-800",
        header: "bg-white border-slate-100",
        icon: "text-amber-400",
        iconBg: "bg-amber-50",
      },
      slate: {
        bar: "bg-slate-500",
        badge: "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:text-slate-800",
        header: "bg-white border-slate-100",
        icon: "text-slate-400",
        iconBg: "bg-slate-50",
      },
    }[accentColor] || {
      bar: "bg-slate-500",
      badge: "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:text-slate-800",
      header: "bg-white border-slate-100",
      icon: "text-slate-400",
      iconBg: "bg-slate-50",
    };
    return (
      <div className="rounded-lg border border-slate-200/80 overflow-hidden bg-white shadow-sm">
        {/* Card header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${accent.header}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-0.5 h-4 rounded-full ${accent.bar}`} />
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md ${accent.iconBg} flex items-center justify-center`}>
                <span className={`${accent.icon} [&>svg]:w-3.5 [&>svg]:h-3.5`}>{icon}</span>
              </div>
              <h4 className="text-[13px] font-semibold text-slate-700 tracking-tight">{title}</h4>
              {showActionNearTitle && actionLabel && onAction && (
                <button
                  onClick={onAction}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-medium border rounded-md transition-all duration-150 ${accent.badge}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  {actionLabel}
                </button>
              )}
            </div>
          </div>
          {!showActionNearTitle && actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-medium border rounded-md transition-all duration-150 ${accent.badge}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              {actionLabel}
            </button>
          )}
        </div>
        {/* Card body */}
        <div>{children}</div>
      </div>
    );
  };
  /* ─── Expanded panel ─── */
  const ExpandedPanel = ({ row }: { row: SalesOrderData }) => {
    const purchaseOrders = getPurchaseOrdersForSalesOrder(row.id);
    const transformedPOData = transformPurchaseOrderData(purchaseOrders);
    const purchaseInwards = getPurchaseInwardsForSalesOrder(row.id);
    const flattenedInwardRows = transformPurchaseInwardData(
      purchaseInwards,
      purchaseReturnList
    );
    const weavingContracts = getWeavingContractsForSalesOrder(row.id);
    const transformedWeavingData = transformWeavingContractData(weavingContracts);

    // Fetch doffed details (factory piece entries) for each contract number if not already loaded
    const contractNosForFetch = [...new Set(weavingContracts.map((wc: any) => wc.weavingContractNo || wc.contractNo).filter(Boolean))] as string[];
    contractNosForFetch.forEach(contractNo => {
      if (!doffedDetails[contractNo] && !loadingDoffedDetails[contractNo]) {
        fetchDoffedDetails(contractNo);
      }
    });
    const beamOutwards = getBeamOutwardsForSalesOrder(row.id);
    const transformedBeamOutwardData = transformBeamOutwardData(beamOutwards, row.id);
    const weftIssues = getWeftIssuesForSalesOrder(row.id);
    const transformedWeftIssueData = transformWeftIssueData(weftIssues);
    const fabricReceives = getFabricReceivesForSalesOrder(row.id);
    const transformedFabricReceiveData = transformFabricReceiveData(fabricReceives, transformedBeamOutwardData);
    const weavingSummary = calculateWeavingSummary(transformedFabricReceiveData);
    const transformedWeavingSummaryData = transformWeavingSummaryFromPieceEntries(row.id, transformedFabricReceiveData);
    const weavingSummaryComputed = calculateWeavingSummary(transformedWeavingSummaryData);
    const transformedSizingPlanData = transformSizingPlanData(row.id);
    const transformedSizingBeamSummaryData = transformSizingBeamSummaryData(row.id);
    return (
      <tr>
        <td colSpan={columns.length} className="p-0 border-b border-slate-200" style={{ background: "#f8fafc" }}>
          {/* ── Unified Process Management Card ── */}
          <div className="mx-5 my-4 rounded-xl border border-slate-700 ring-1 ring-slate-900/[0.04] overflow-hidden bg-slate-50/30 shadow-sm">
            {/* ── Tab Modal Header ── */}
            <div className="bg-white border-b border-slate-200">
              <div className="flex items-center px-5 py-3 border-b border-slate-200 bg-slate-50/50">
                <div className="flex gap-0">
                  {(["yarnPurchase", "weaving", "sizing"] as const).map((tab) => {
                    const label =
                      tab === "yarnPurchase" ? "Yarn Purchase" : tab === "weaving" ? "Weaving" : "Sizing";
                    const isActive = activeSubTab === tab;
                    const color = tab === "yarnPurchase" ? "blue" : tab === "weaving" ? "amber" : "green";
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={`relative px-5 py-2.5 text-[13px] font-medium transition-all duration-150 ${isActive
                          ? `text-${color}-600 bg-white border-b-2 border-${color}-500`
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* ── Yarn Purchase Expandable Body ── */}
            {activeSubTab === "yarnPurchase" && (
              <div className="p-4 space-y-3 bg-slate-50/40 border-b border-slate-100">
                {/* ── Purchase Order sub-section ── */}
                <SectionCard
                  accentColor="blue"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6M5 20h14a2 2 0 002-2V8l-6-6H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                  title="Purchase Order"
                  actionLabel="Generate Purchase Order"
                  onAction={() => handleGeneratePurchaseOrder(row)}
                  showActionNearTitle={true}
                >
                  {transformedPOData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-blue-800">
                          <tr>
                            {["S.No", "Purchase Order No", "Supplier/Vendor", "Yarn Count", "Quantity", "UOM", "Price / Unit", "Total Amount", "GST Amount", "Final Amount", "Status"].map(
                              (h) => <th key={h} className={INNER_TH}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {transformedPOData.map((item: any) => {
                            const isFirst = item.serialNumber !== null;
                            return (
                              <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                {isFirst ? (
                                  <>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.poNo}>{item.serialNumber}</td>
                                    <td className={`${INNER_TD} font-medium text-slate-600`} rowSpan={item.rowSpan.poNo}>{item.poNo}</td>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.vendorName}>{item.vendorName}</td>
                                  </>
                                ) : (
                                  <><td className="hidden" /><td className="hidden" /><td className="hidden" /></>
                                )}
                                <td className={INNER_TD}>{item.yarnName}</td>
                                <td className={INNER_TD}>{item.quantity?.toLocaleString()}</td>
                                {isFirst ? (
                                  <td className={INNER_TD} rowSpan={item.rowSpan.unit}>{getUomName(item.unit)}</td>
                                ) : (
                                  <td className="hidden" />
                                )}
                                <td className={INNER_TD}>{item.price?.toFixed(2)}</td>
                                <td className={INNER_TD}>{item.netAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className={INNER_TD}>{item.gstAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className={INNER_TD}>{item.finalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                {isFirst ? (
                                  <td className={INNER_TD} rowSpan={item.rowSpan.status}>
                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.isComplete === 1
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                      : "bg-amber-50 text-amber-800 border-amber-200/80"
                                      }`}>
                                      {item.isComplete === 1 ? "Completed" : "Open"}
                                    </span>
                                  </td>
                                ) : (
                                  <td className="hidden" />
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No purchase orders found for this sales order." />
                  )}
                </SectionCard>
                {/* ── Purchase Inward sub-section ── */}
                <SectionCard
                  accentColor="violet"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0l-4-4m4 4l-4 4M5 11l4-4M5 11l4 4" />
                    </svg>
                  }
                  title="Purchase Inward"
                  actionLabel="Generate Purchase Inward"
                  onAction={() => handleGeneratePurchaseInward(row)}
                  showActionNearTitle={true}
                >
                  {flattenedInwardRows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-blue-800">
                          <tr>
                            {["S.No", "Inward No", "Inward Date", "PO Number", "Supplier/Vendor", "Product Name", "Quantity", "Total Amount", "Mill", "Warehouse", "Return Qty", "Return Value", "DC Number", "DC Date"].map(
                              (h) => <th key={h} className={INNER_TH}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {flattenedInwardRows.map((item: any) => {
                            const isFirst = item.serialNumber !== null;
                            const shouldShowProductInfo = item.isYarnGroupFirst;
                            return (
                              <tr key={item.id} className="hover:bg-violet-50/30 transition-colors">
                                {isFirst ? (
                                  <>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.inwardNo}>{item.serialNumber}</td>
                                    <td className={`${INNER_TD} font-medium text-slate-600`} rowSpan={item.rowSpan.inwardNo}>{item.inwardNo}</td>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.inwardDate}>{item.inwardDate ? formatDate(item.inwardDate) : ""}</td>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.poNumber}>{item.poNumber}</td>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.vendor}>{item.vendor}</td>
                                  </>
                                ) : (
                                  <><td className="hidden" /><td className="hidden" /><td className="hidden" /><td className="hidden" /><td className="hidden" /></>
                                )}
                                {shouldShowProductInfo ? (
                                  <>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.productName}</td>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.quantity?.toLocaleString()}</td>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.totalAmount?.toLocaleString()}</td>
                                  </>
                                ) : (
                                  <><td className="hidden" /><td className="hidden" /><td className="hidden" /></>
                                )}
                                {item.mill !== null ? (
                                  <td className={INNER_TD} rowSpan={item.rowSpan.mill}>{item.mill}</td>
                                ) : (
                                  <td className="hidden" />
                                )}
                                {item.warehouse !== null ? (
                                  <td className={INNER_TD} rowSpan={item.rowSpan.warehouse}>{item.warehouse}</td>
                                ) : (
                                  <td className="hidden" />
                                )}
                                {shouldShowProductInfo ? (
                                  <>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.returnQty?.toLocaleString() || 0}</td>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.productInfo}>{item.returnTotalAmount?.toLocaleString()}</td>
                                  </>
                                ) : (
                                  <><td className="hidden" /><td className="hidden" /></>
                                )}
                                {isFirst ? (
                                  <>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.dcNumber}>{item.dcNumber}</td>
                                    <td className={INNER_TD} rowSpan={item.rowSpan.dcDate}>{item.dcDate ? formatDate(item.dcDate) : ""}</td>
                                  </>
                                ) : (
                                  <><td className="hidden" /><td className="hidden" /></>
                                )}
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-100/70 font-semibold">
                            <td className={INNER_TD} colSpan={6}>Total</td>
                            <td className={`${INNER_TD} text-right`}>
                              {flattenedInwardRows.reduce((sum: number, row: any) => sum + (Number(row?.quantity) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {flattenedInwardRows.reduce((sum: number, row: any) => sum + (Number(row?.totalAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className={`${INNER_TD} text-right`} colSpan={3}>
                              {flattenedInwardRows.reduce((sum: number, row: any) => sum + (Number(row?.returnQty) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className={`${INNER_TD} text-right`} colSpan={1}>
                              {flattenedInwardRows.reduce((sum: number, row: any) => sum + (Number(row?.returnTotalAmount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No purchase inwards found for this sales order." />
                  )}
                </SectionCard>
                {/* ── Yarn Purchase Summary sub-section ── */}
                <SectionCard
                  accentColor="emerald"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2V10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  title="Yarn Purchase Summary"
                >
                  {(() => {
                    const yarnSummaryData = getYarnPurchaseSummary(row.id);
                    return yarnSummaryData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-blue-800">
                            <tr>
                              {["Yarn Count", "Required Qty", "Ordered Qty", "Inward Qty", "Balance Qty"].map(
                                (h) => <th key={h} className={INNER_TH}>{h}</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-50">
                            {yarnSummaryData.map((item: any, index: number) => (
                              <tr key={index} className="hover:bg-emerald-50/30 transition-colors">
                                <td className={INNER_TD}>
                                  <span className={`font-medium ${getYarnColor(item.yarnCount)}`}>
                                    {item.yarnCount}
                                  </span>
                                </td>
                                <td className={INNER_TD}>{item.requiredQty?.toLocaleString() || 0}</td>
                                <td className={INNER_TD}>{item.orderedQty?.toLocaleString()}</td>
                                <td className={INNER_TD}>{item.inwardQty?.toLocaleString()}</td>
                                <td className={`${INNER_TD} ${item.balanceQty < 0 ? "text-red-500 font-semibold" : ""}`}>
                                  {item.balanceQty?.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState message="No yarn purchase data found for this sales order." />
                    );
                  })()}
                </SectionCard>
              </div>
            )}
            {/* ── Weaving Expandable Body ── */}
            {activeSubTab === "weaving" && (
              <div className="p-4 space-y-3 bg-amber-50/30">
                {/* ── Weaving Contract sub-section ── */}
                <SectionCard
                  accentColor="blue"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  title="Weaving Contract"
                  actionLabel="Generate Weaving Contract"
                  onAction={() => handleGenerateWeavingContract(row)}
                  showActionNearTitle={true}
                >
                  {transformedWeavingData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-blue-800">
                          <tr>
                            {["S.No", "Weaving Contract Date", "Weaving Contract No", "Vendor", "Sort No", "Construction", "Pick Rate", "Quantity", "Status"].map(
                              (h) => <th key={h} className={INNER_TH}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {transformedWeavingData.map((item: any) => (
                            <tr key={`${item.weavingContractNo}-${item.serialNumber}`} className="hover:bg-blue-50/30 transition-colors">
                              <td className={INNER_TD}>{item.serialNumber}</td>
                              <td className={INNER_TD}>{item.contractDate ? formatDate(item.contractDate) : ''}</td>
                              <td className={`${INNER_TD} font-medium text-slate-600`}>{item.weavingContractNo}</td>
                              <td className={INNER_TD}>{item.vendorName}</td>
                              <td className={INNER_TD}>{item.fabricCode}</td>
                              <td className={INNER_TD}>{item.quality}</td>
                              <td className={`${INNER_TD} text-right`}>{item.pickRate}</td>
                              <td className={`${INNER_TD} text-right`}>{item.quantity?.toLocaleString()}</td>
                              <td className={INNER_TD}>
                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${item.status === 'Completed'
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                  : "bg-amber-50 text-amber-800 border-amber-200/80"
                                  }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 font-semibold">
                            <td className={INNER_TD} colSpan={7}>Total</td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedWeavingData.reduce((sum: number, row: any) => sum + (Number(row?.quantity) || 0), 0).toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No weaving contracts found for this sales order." />
                  )}
                </SectionCard>
                {/* ── Weft Issue sub-section ── */}
                <SectionCard
                  accentColor="emerald"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                  }
                  title="Weft Issue"
                  actionLabel="Generate Weft Issue"
                  onAction={() => handleGenerateWeftIssue(row)}
                  showActionNearTitle={true}
                >
                  {transformedWeftIssueData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-blue-800">
                          <tr>
                            {["S.No", "Weaving Contract No", "Vendor", "Item Name", "Yarn Required", "Issued Qty", "Balance Yarn", "Yarn Return", "Consumed"].map(
                              (h) => <th key={h} className={INNER_TH}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {transformedWeftIssueData.map((item: any) => (
                            <tr key={`${item.weavingContractNo}-${item.serialNumber}`} className="hover:bg-emerald-50/30 transition-colors">
                              <td className={INNER_TD}>{item.serialNumber}</td>
                              <td className={INNER_TD}>{item.weavingContractNo}</td>
                              <td className={INNER_TD}>{item.vendorName}</td>
                              <td className={INNER_TD}>{item.itemName}</td>
                              <td className={`${INNER_TD} text-right`}>{item.yarnRequired?.toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{item.issuedQty?.toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{item.balanceYarn?.toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{item.yarnReturn?.toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{item.consumed?.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 font-semibold">
                            <td className={INNER_TD} colSpan={4}>Total</td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnRequired) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.issuedQty) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.balanceYarn) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnReturn) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className={`${INNER_TD} text-right text-blue-600`}>
                              {transformedWeftIssueData.reduce((sum: number, row: any) => sum + (Number(row?.consumed) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No weft issue records found for this sales order." />
                  )}
                </SectionCard>
                {/* ── Beam Outward sub-section ── */}
                <SectionCard
                  accentColor="violet"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0l-4-4m4 4l-4 4M5 11l4-4M5 11l4 4" />
                    </svg>
                  }
                  title="Beam Outward"
                  actionLabel="Generate Beam Outward"
                  onAction={() => handleGenerateBeamOutward(row)}
                  showActionNearTitle={true}
                >
                  {transformedBeamOutwardData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-blue-800">
                          <tr>
                            {["S.No", "Weaving Contract No", "Sizing Vendor", "Weaver Name", "No Of Beams", "Beam Meter", "Beam Return Mtr", "Beam Consumed",].map(
                              (h) => <th key={h} className={INNER_TH}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {transformedBeamOutwardData.map((item: any) => (
                            <tr key={`${item.sizingPlanNo}-${item.serialNumber}`} className="hover:bg-violet-50/30 transition-colors">
                              <td className={INNER_TD}>{item.serialNumber}</td>
                              {/* {item.showOutwardColumns && (
                                <>
                                  <td className={INNER_TD}>{item.outwardDate ? formatDate(item.outwardDate) : ""}</td>
                                  <td className={`${INNER_TD} font-medium text-slate-600`}>{item.outwardNo}</td>
                                </>
                              )} */}
                              <td className={INNER_TD}>{item.weavingContractNo}</td>
                              <td className={INNER_TD}>{item.sizingVendorName}</td>
                              <td className={INNER_TD}>{item.weaverName}</td>
                              {/* <td className={INNER_TD}>{item.sizingPlanNo}</td> */}
                              <td className={`${INNER_TD} text-right`}>{item.noOfBeams?.toLocaleString()}</td>

                              <td className={`${INNER_TD} text-right`}>{item.beamMeter?.toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{item.beamReturn?.toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{item.beamConsumed?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 font-semibold">
                            <td className={INNER_TD} colSpan={(transformedBeamOutwardData.some((item: any) => item.showOutwardColumns) ? 4 : 4)}>
                              Total
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedBeamOutwardData.reduce((sum: number, row: any) => sum + (Number(row?.noOfBeams) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedBeamOutwardData.reduce((sum: number, row: any) => sum + (Number(row?.beamMeter) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedBeamOutwardData.reduce((sum: number, row: any) => sum + (Number(row?.beamReturnMtr) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedBeamOutwardData.reduce((sum: number, row: any) => sum + (Number(row?.beamConsumed) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No beam outward records found for this sales order." />
                  )}
                </SectionCard>

                {/* ── Fabric Received sub-section ── */}
                <SectionCard
                  accentColor="amber"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                  title="Fabric Received"
                  actionLabel="Generate Fabric Received"
                  onAction={() => handleGenerateFabricReceived(row)}
                  showActionNearTitle={true}
                >
                  {transformedFabricReceiveData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-blue-800">
                          <tr>
                            {["S.No", "Weaving Contract No", "Vendor", "Fabric Details", "Total No. of Pieces", "Inward Meters", "Inspected Mtr", "Net Wgt", "Avg Wgt", "Crimp%"].map(
                              (h) => <th key={h} className={INNER_TH}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {transformedFabricReceiveData.map((item: any) => (
                            <tr key={`${item.receiveNo}-${item.serialNumber}`} className="hover:bg-amber-50/30 transition-colors">
                              <td className={INNER_TD}>{item.serialNumber}</td>
                              {/* <td className={`${INNER_TD} font-medium text-slate-600`}>{item.receiveNo}</td> */}
                              {/* <td className={INNER_TD}>{item.receiveDate ? formatDate(item.receiveDate) : ""}</td> */}
                              <td className={INNER_TD}>{item.weavingContractNo}</td>
                              <td className={INNER_TD}>{item.vendorName}</td>
                              <td className={INNER_TD}>{item.fabricDetails}</td>
                              <td className={INNER_TD}>
                                <button
                                  onClick={() => {
                                    if (isNavigating) return;

                                    if (isLoadingWeavingContracts) {
                                      toast.info("Loading contract data, please try again in a moment.");
                                      return;
                                    }

                                    if (!validateWeavingContractExists(row.id)) {
                                      toast.error("No Weaving Contract found for this Sales Order. Please create a Weaving Contract first.");
                                      return;
                                    }
                                    setIsNavigating(true);
                                    // Navigate to piece details page
                                    navigate(`/transaction/piece-details`, {
                                      state: {
                                        fabricReceiveId: item.fabricReceiveId,
                                        source: 'order-entry-management',
                                        salesOrderId: row.id,
                                        salesOrderNo: row.salesOrderNo,
                                        flowType: 'weaving',
                                        activeTab
                                      }
                                    });
                                    // Reset navigation state after a delay
                                    setTimeout(() => setIsNavigating(false), 300);
                                  }}
                                  disabled={isNavigating}
                                  className={`text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${isNavigating ? 'animate-pulse' : ''
                                    }`}
                                >
                                  {item.totalPieces}
                                </button>
                              </td>
                              <td className={`${INNER_TD} text-right`}>{item.totalMeters?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className={`${INNER_TD} text-right`}>{item.totalInspectedMtr?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className={`${INNER_TD} text-right`}>{item.totalNetWgt?.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                              <td className={`${INNER_TD} text-right`}>{item.totalAvgWgt?.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                              <td className={`${INNER_TD} text-right`}>{item.crimpPercentage?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No fabric received records found for this sales order." />
                  )}
                </SectionCard>


                {/* ── Doffed Details sub-section ── */}
                <SectionCard
                  accentColor="slate"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  }
                  title="Doffed Details"
                >
                  {(() => {
                    // Get contract numbers from weaving contracts
                    const contractNos = [...new Set(transformedWeavingData.map((item: any) => item.weavingContractNo).filter(Boolean))] as string[];
                    // For testing: Show message if no contracts found
                    if (contractNos.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-[12.5px] font-medium text-slate-600">No weaving contracts found. Please add weaving contracts to see doffed details.</p>
                        </div>
                      );
                    }
                    // Fetch doffed details for each contract number if not already loaded
                    contractNos.forEach(contractNo => {
                      if (!doffedDetails[contractNo] && !loadingDoffedDetails[contractNo]) {
                        fetchDoffedDetails(contractNo);
                      }
                    });
                    // Combine all doffed details from all contracts
                    const allDoffedDetails: DoffedDetail[] = [];
                    contractNos.forEach(contractNo => {
                      if (doffedDetails[contractNo]) {
                        allDoffedDetails.push(...doffedDetails[contractNo]);
                      }
                    });
                    // Group by beam details for better display
                    const groupedData = allDoffedDetails.reduce((acc: any, item: DoffedDetail) => {
                      const key = `${item.beamNo}-${item.flangeNo}`;
                      if (!acc[key]) {
                        acc[key] = {
                          beamNo: item.beamNo,
                          flangeNo: item.flangeNo,
                          loomId: item.loomId,
                          beamId: item.beamId,
                          pieces: [],
                          totalDoffedMtr: 0,
                          totalInspectedMtr: 0,
                          totalNetWt: 0,
                          avgWgt: 0,
                          gradeId: item.gradeId,
                          warehouseId: item.warehouseId
                        };
                      }
                      acc[key].pieces.push(item);
                      acc[key].totalDoffedMtr += parseFloat(item.pieceMeter || '0');
                      acc[key].totalInspectedMtr += item.inspectedMtr || 0;
                      acc[key].totalNetWt += item.inspectedNtWt || 0;
                      return acc;
                    }, {});
                    const groupedArray = Object.values(groupedData);
                    // Calculate average weight for each group
                    groupedArray.forEach((group: any) => {
                      const totalWeight = group.pieces.reduce((sum: number, piece: DoffedDetail) => sum + (piece.inspectedAvgWt || 0), 0);
                      group.avgWgt = group.pieces.length > 0 ? totalWeight / group.pieces.length : 0;
                    });
                    const isLoading = contractNos.some(contractNo => loadingDoffedDetails[contractNo]);
                    if (isLoading) {
                      return (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-blue-600 mx-auto mb-3"></div>
                          <p className="text-sm text-slate-500">Loading doffed details...</p>
                        </div>
                      );
                    }
                    if (groupedArray.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-[12.5px] font-medium text-slate-400">No doffed details found for this sales order.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-blue-800">
                            <tr>
                              {["S.No", "Loom No", "Beam No", "Empty Beam No", "No of Pieces", "Doffed Mtr", "Inspected Mtr", "Net Wgt", "Avg Wgt", "Grade", "Warehouse", "Crimp %"].map(
                                (h) => <th key={h} className={INNER_TH}>{h}</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-50">
                            {groupedArray.map((group: any, index: number) => {
                              const crimpPercentage = calculateCrimpPercentage(group.totalDoffedMtr, group.beamId, group.beamNo);
                              return (
                                <tr key={`${group.beamNo}-${group.flangeNo}`} className="hover:bg-slate-50/30 transition-colors">
                                  <td className={INNER_TD}>{index + 1}</td>
                                  <td className={INNER_TD}>{getLoomName(group.loomId)}</td>
                                  <td className={`${INNER_TD} font-medium text-slate-600`}>{group.beamNo}</td>
                                  <td className={INNER_TD}>{group.flangeNo}</td>
                                  <td className={`${INNER_TD} text-right`}>{group.pieces.length}</td>
                                  <td className={`${INNER_TD} text-right`}>{group.totalDoffedMtr.toFixed(2)}</td>
                                  <td className={`${INNER_TD} text-right`}>{group.totalInspectedMtr.toFixed(2)}</td>
                                  <td className={`${INNER_TD} text-right`}>{group.totalNetWt.toFixed(2)}</td>
                                  <td className={`${INNER_TD} text-right`}>{group.avgWgt.toFixed(2)}</td>
                                  <td className={INNER_TD}>{getGradeName(group.gradeId)}</td>
                                  <td className={INNER_TD}>{getWarehouseName(group.warehouseId)}</td>
                                  <td className={`${INNER_TD} text-right font-medium ${parseFloat(crimpPercentage) > 10 ? 'text-red-600' :
                                    parseFloat(crimpPercentage) > 5 ? 'text-amber-600' : 'text-green-600'
                                    }`}>
                                    {crimpPercentage}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </SectionCard>
                {/* ── Weaving Summary sub-section ── */}
                <SectionCard
                  accentColor="amber"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  title="Weaving Summary"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-primary">
                        <tr>
                          {['S.No', 'Weaving Contract No', 'Weaver Name', 'No of pieces', 'Inward Mtr', 'Inspected Meter', 'Net Wgt', 'Avg Wgt'].map(
                            (h) => <th key={h} className={INNER_TH}>{h}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-50">
                        {transformedWeavingSummaryData.map((item: any) => (
                          <tr key={item.fabricReceiveId} className="hover:bg-amber-50/30 transition-colors">
                            <td className={INNER_TD}>{item.serialNumber}</td>
                            <td className={INNER_TD}>{item.weavingContractNo || '-'}</td>
                            <td className={INNER_TD}>{item.weaverName || '-'}</td>
                            <td className={`${INNER_TD} text-right`}>{Number(item.totalPieces || 0).toLocaleString()}</td>
                            <td className={`${INNER_TD} text-right`}>{Number(item.totalMeters || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                            <td className={`${INNER_TD} text-right`}>{Number(item.totalInspectedMtr || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className={`${INNER_TD} text-right`}>{Number(item.totalNetWgt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                            <td className={`${INNER_TD} text-right`}>{Number(item.totalAvgWgt || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100/70 font-semibold">
                          <td className={INNER_TD} colSpan={3}>Total</td>
                          <td className={`${INNER_TD} text-right`}>{weavingSummaryComputed.totalPieces?.toLocaleString()}</td>
                          <td className={`${INNER_TD} text-right`}>{weavingSummaryComputed.totalDoffedMtr?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className={`${INNER_TD} text-right`}>{weavingSummaryComputed.totalInspectedMtr?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className={`${INNER_TD} text-right`}>{weavingSummaryComputed.totalNetWeight?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className={`${INNER_TD} text-right`}>{weavingSummaryComputed.totalAvgWgt?.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 4 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              </div>

            )}

            {/* ── Sizing Expandable Body ── */}
            {activeSubTab === "sizing" && (
              <div className="p-4 space-y-3 bg-green-50/30">
                <SectionCard
                  accentColor="emerald"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h10M7 16h6M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                  }
                  title="Sizing Plan"
                  actionLabel="Generate Sizing Plan"
                  onAction={() => handleGenerateSizingPlan(row)}
                  showActionNearTitle={true}
                >
                  {transformedSizingPlanData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-blue-800">
                          <tr>
                            {["S.No", "Sizing Plan Date", "Sizing Plan No", "Sizing Vendor", "Yarn Name", "Construction", "Sort Ends", "Meters"].map(
                              (h) => <th key={h} className={INNER_TH}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {transformedSizingPlanData.map((item: any) => (
                            <tr key={item.id} className="hover:bg-green-50/40 transition-colors">
                              <td className={INNER_TD}>{item.serialNumber}</td>
                              <td className={INNER_TD}>{item.sizingPlanDate ? formatDate(item.sizingPlanDate) : ""}</td>
                              <td className={`${INNER_TD} font-medium text-slate-600`}>{item.sizingPlanNo || "-"}</td>
                              <td className={INNER_TD}>{item.sizingVendorName || "-"}</td>
                              <td className={INNER_TD}>{item.yarnName || "100s CC EGY"}</td>
                              <td className={INNER_TD}>{item.fabricQuality || "-"}</td>
                              <td className={`${INNER_TD} text-right`}>{Number(item.sortEnds || 0).toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{Number(item.meters || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 font-semibold">
                            <td className={INNER_TD} colSpan={7}>Total</td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedSizingPlanData.reduce((sum: number, row: any) => sum + (Number(row?.meters) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No sizing plans found for this sales order." />
                  )}
                </SectionCard>

                {(() => {
                  const transformedSizingYarnIssueData = transformSizingYarnIssueData(row.id);
                  return (
                    <SectionCard
                      accentColor="blue"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      }
                      title="Sizing Yarn reconciliation"
                      actionLabel="Generate Sizing Yarn reconciliation"
                      onAction={() => handleGenerateSizingYarnIssue(row)}
                      showActionNearTitle={true}
                    >
                      {transformedSizingYarnIssueData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead className="bg-blue-800">
                              <tr>
                                {["S.No", "Sizing Plan No", "Yarn Required", "Issued Qty", "Balance Yarn", "Yarn Return", "Consumed"].map(
                                  (h) => <th key={h} className={INNER_TH}>{h}</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                              {transformedSizingYarnIssueData.map((item: any) => (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                  <td className={INNER_TD}>{item.serialNumber}</td>
                                  <td className={`${INNER_TD} font-medium text-slate-600`}>{item.sizingPlanNo}</td>
                                  <td className={`${INNER_TD} text-right`}>{item.yarnRequired?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className={`${INNER_TD} text-right`}>{item.issuedQty?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className={`${INNER_TD} text-right`}>{item.balanceYarn?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className={`${INNER_TD} text-right font-medium text-blue-600`}>
                                    {item.yarnReturn > 0 ? `${item.yarnReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ` : "0"}
                                  </td>
                                  <td className={`${INNER_TD} text-right font-semibold`}>{item.consumed?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                              <tr className="bg-slate-100/70 font-semibold">
                                <td className={INNER_TD} colSpan={2}>Total</td>
                                <td className={`${INNER_TD} text-right`}>
                                  {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnRequired) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className={`${INNER_TD} text-right`}>
                                  {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.issuedQty) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className={`${INNER_TD} text-right`}>
                                  {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.balanceYarn) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className={`${INNER_TD} text-right`}>
                                  {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnReturn) || 0), 0) > 0
                                    ? `${transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.yarnReturn) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} `
                                    : "0"
                                  }
                                </td>
                                <td className={`${INNER_TD} text-right`}>
                                  {transformedSizingYarnIssueData.reduce((sum: number, row: any) => sum + (Number(row?.consumed) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <EmptyState message="No sizing yarn issue records found for this sales order." />
                      )}
                    </SectionCard>
                  );

                })()}

                <SectionCard
                  accentColor="slate"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  }
                  title="Beam Details"
                >
                  {transformedSizingBeamSummaryData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-blue-800">
                          <tr>
                            {["S.No", "Sizing Plan No", "Beams Plan", "Beams Received", "Beams Issued", "Beam Meter", "Return Beams", "Beam Return Meter"].map(
                              (h) => <th key={h} className={INNER_TH}>{h}</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {transformedSizingBeamSummaryData.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className={INNER_TD}>{item.serialNumber}</td>
                              <td className={`${INNER_TD} font-medium text-slate-600`}>{item.sizingPlanNo}</td>
                              <td className={`${INNER_TD} text-right`}>{Number(item.beamsPlan || 0).toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{Number(item.beamsReceived || 0).toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right`}>{Number(item.beamsIssued || 0).toLocaleString()}</td>

                              <td className={`${INNER_TD} text-right`}>{Number(item.beamMeter || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>


                              <td className={`${INNER_TD} text-right`}>{Number(item.returnedBeams || 0).toLocaleString()}</td>
                              <td className={`${INNER_TD} text-right text-blue-600 font-medium`}>{item.beamReturn > 0 ? Number(item.beamReturn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0"}</td>
                              {/* <td className={`${INNER_TD} text-right font-semibold`}>{Number(item.beamUtilize || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> */}
                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 font-semibold">
                            <td className={INNER_TD} colSpan={2}>Total</td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamsPlan) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamsReceived) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamsIssued) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right`}>
                              {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamMeter) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className={`${INNER_TD} text-right`} >
                              {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.returnedBeams) || 0), 0).toLocaleString()}
                            </td>
                            <td className={`${INNER_TD} text-right text-blue-600`}>
                              {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamReturn) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* <td className={`${INNER_TD} text-right`}>
                              {transformedSizingBeamSummaryData.reduce((sum: number, row: any) => sum + (Number(row?.beamUtilize) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td> */}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState message="No beam summary data found for this sales order." />
                  )}
                </SectionCard>
              </div>

            )}

          </div>
        </td >
      </tr >
    );
  };
  /* ─── Page render ─── */
  return (
    <>
      <LoadingOverlay />
      <div className="px-6 py-5 pt-16 space-y-5">
        {/* Page header */}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-slate-200">
          {(["domestic", "export"] as const).map((tab) => {
            const label =
              tab === "domestic" ? "Sales Order Domestic" : "Sales Order Export";
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-5 py-2.5 text-[13px] font-medium transition-colors duration-150 ${isActive
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-blue-800" />
                )}
              </button>
            );
          })}
        </div>
        {/* Table card */}
        <div className="overflow-hidden">
          <DataTable
            columns={columns}
            data={tabFilteredOrders}
            title="Sales Orders"
            isShowPagination={true}
            showActions={false}
            showAddActions={false}
            showExport={true}
            showPdfExport={true}
            showColumnFilters={true}
            getRowId={(row) => `sales-order-row-${row.id}`}
            getRowClassName={(row) => {
              const isExpanded = expandedRowId === row.id;
              return isExpanded ? "bg-blue-50/40 shadow-[inset_3px_0_0_#3b82f6]" : "";
            }}
            renderRowDetails={(row) => {
              const isExpanded = expandedRowId === row.id;
              return isExpanded ? <ExpandedPanel row={row} /> : null;
            }}
          />
        </div>

      </div>
    </>
  );
}