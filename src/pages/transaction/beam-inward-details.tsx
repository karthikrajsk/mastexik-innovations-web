// import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
// import { Button } from "@/components/ui/button";
// import { Modal } from "@/components/ui/Modal";
// import { formatDate } from "@/lib/utils";
// import { deleteBeamInward, getAllBeamInward } from "@/state/beamInwardSlice";
// import { getAllConsignee } from "@/state/consigneeSlice";
// import { getAllSalesOrders } from "@/state/salesOrderSlice";
// import { AppDispatch, RootState } from "@/state/store";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllWeavingContract } from "@/state/weavingContractSlice";
// import { getAllCompanies } from "@/state/company-master-slice";
// import { createBeamOutward } from "@/state/beamOutwardSlice";
// import { getAllSizingPlan } from "@/state/sizingPlanSlice";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { getAllWeavingJobWorkOrders } from "@/state/weavingJobWorkOrderSlice";
// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { Pagination, usePagination } from "@/components/common/Pagination";

// interface BeamInwardData {
//   id: number;
//   sizingVendorId: number;
//   sizingPlanId: number | null;
//   termsConditionsId: number;
//   consigneeId: number;
//   paymentTermsId: number;
//   sizingRate: number;
//   remarks: string;
//   beamInwardNo: string;
//   orderTypeId: number;
//   beamInwardQualityDetails: {
//     id: number;
//     beamInwardId: number | null;
//     quality: string;
//     yarnId: number;
//     sordEnds: number;
//     actualEnds: number;
//     parts: number;
//     endsPerPart: number;
//     wrapMeters: number;
//   }[];
//   beamInwardBeamDetails: {
//     id: number;
//     beamInwardId: number | null;
//     weavingContractId: number;
//     weavingVendorId: number;
//     salesOrderId: number;
//     sizedBeamNo: number | string;
//     flangeNo?: string;
//     wrapMeters: number;
//     shrinkage: number;
//     expectedFabricMeter: number;
//      isBeamOutwarded:number;
//   }[];
// }

// export function BeamInwardDetails() {
//   const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
//   const { vendorList } = useSelector((state: RootState) => state.vendor);
//   const { consigneeList } = useSelector((state: RootState) => state.consignee);
//   const { salesOrderList } = useSelector((state: RootState) => state.salesOrder as any);
//   const { beamInwardList,paginationInfo } = useSelector((state: RootState) => state.beamInward);
//   const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
//   const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
//   const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
//   const { weavingJobWorkOrderList } = useSelector((state: RootState) => (state as any).weavingJobWorkOrder);
  
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
//   const [currentBeamInward, setCurrentBeamInward] = useState<BeamInwardData | null>(null);
//   const [outwardRow, setOutwardRow] = useState<BeamInwardData | null>(null);
//   const [outwardSelection, setOutwardSelection] = useState<Record<number, boolean>>({});
//   const [outwardDate, setOutwardDate] = useState<string>(new Date().toISOString().slice(0, 10));
//   const [localOutwardedIds, setLocalOutwardedIds] = useState<Set<number>>(new Set());
//   const [companyId, setCompanyId] = useState<number | null>(null);
//   const [companyName, setCompanyName] = useState<string>("");
//   const [companyResolved, setCompanyResolved] = useState(false);
//     const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  
//   const dispatch = useDispatch<AppDispatch>();
//   const navigate = useNavigate();

//   useEffect(() => {
//     dispatch(getAllVendors({}));
//     dispatch(getAllConsignee({fetchAll: true}));
//     dispatch(getAllWeavingContract({}) as any);
//     dispatch(getAllSalesOrders({}) as any);
//     dispatch(getAllSizingPlan({}) as any);
//     dispatch(getAllFabricMasters({}) as any);
//     dispatch(getAllCompanies({}) as any);
//     dispatch(getAllWeavingJobWorkOrders({}) as any);
//   }, [dispatch,getOffset, itemsPerPage]);

//   useEffect(() => {
//     let id: number | null = null;
//     let name = '';

//     try {
//       const companyIdStr = localStorage.getItem('companyId');
//       if (companyIdStr) id = Number(companyIdStr);

//       const selectedCompanyRaw = localStorage.getItem('selectedCompany');
//       if (selectedCompanyRaw) {
//         try {
//           const sc = JSON.parse(selectedCompanyRaw);
//           if (sc?.id != null) id = Number(sc.id);
//           if (sc?.name) name = sc.name;
//         } catch {}
//       }

//       const authPayloadRaw = localStorage.getItem('authPayload');
//       if (authPayloadRaw) {
//         try {
//           const ap = JSON.parse(authPayloadRaw);
//           const companies = ap?.user?.companies || ap?.companies || [];
//           if (Array.isArray(companies) && companies.length) {
//             if (id != null) {
//               const c = companies.find((c: any) => Number(c?.id) === Number(id)) || companies[0];
//               if (c?.name) name = name || c.name;
//               if (!id && c?.id != null) id = Number(c.id);
//             } else {
//               const c = companies[0];
//               if (c?.id != null) id = Number(c.id);
//               if (c?.name) name = c.name;
//             }
//           }
//         } catch {}
//       }

//       const userRaw = localStorage.getItem('user');
//       if (userRaw) {
//         try {
//           const u = JSON.parse(userRaw);
//           const companies = u?.companies || [];
//           if (Array.isArray(companies) && companies.length) {
//             if (id == null && companies[0]?.id != null) id = Number(companies[0].id);
//             if (!name && companies[0]?.name) name = companies[0].name;
//           }
//         } catch {}
//       }

//       const companiesRaw = localStorage.getItem('companies');
//       if (!name && companiesRaw) {
//         try {
//           const arr = JSON.parse(companiesRaw);
//           if (Array.isArray(arr) && arr.length) {
//             if (id == null && arr[0]?.id != null) id = Number(arr[0].id);
//             if (arr[0]?.name) name = arr[0].name;
//           }
//         } catch {}
//       }
//     } catch {}

//     setCompanyId(id);
//     setCompanyName(name);
//     setCompanyResolved(true);
//   }, []);

//   useEffect(() => {
//     if (!companyResolved || companyId == null) return;
//     dispatch(getAllBeamInward({ companyId }));
//   }, [dispatch, companyId, companyResolved]);

//   const processedCityList = useMemo(() => {
//     return beamInwardList.map((city: any, index: number) => ({
//       ...city,
//       serialNo: index + 1
//     }));
//   }, [beamInwardList]);

//   // Simplified handleBeamOutward function
//   const handleBeamOutward = (row: BeamInwardData) => {
//     const normalizedId = row?.id != null ? Number(row.id) : null;
//     const sourceList = (Array.isArray(beamInwardList) ? beamInwardList : []) as BeamInwardData[];
//     const beamInwardData: BeamInwardData =
//       normalizedId != null
//         ? sourceList.find((item) => Number(item?.id) === normalizedId) || row
//         : row;

//     if (!beamInwardData) {
//       console.error("Beam inward data not found for ID:", row?.id);
//       return;
//     }

//     setOutwardRow(beamInwardData);

//     const initialSelection: Record<number, boolean> = {};
//     if (beamInwardData.beamInwardBeamDetails && beamInwardData.beamInwardBeamDetails.length > 0) {
//       beamInwardData.beamInwardBeamDetails
//         .filter((beam) => String(beam.isBeamOutwarded) !== "1" && !localOutwardedIds.has(beam.id))
//         .forEach((beam) => {
//           if (beam?.id != null) initialSelection[beam.id] = false;
//         });
//     }

//     setOutwardSelection(initialSelection);
//     setIsOutwardModalOpen(true);
//   };

//   const workOrderByContractMap = useMemo(() => {
//     const raw = weavingJobWorkOrderList as any;
//     const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
//     const map = new Map<string, number>();
//     arr.forEach((w: any) => {
//       const contractId = w?.weavingContractId ?? w?.contractId ?? w?.weavingContract?.id;
//       if (contractId != null && w?.id != null) map.set(String(contractId), Number(w.id));
//     });
//     return map;
//   }, [weavingJobWorkOrderList]);

//   const columns = useMemo(
//     () => [
//       {
//         Header: 'S.No',
//         accessor: 'serialNo',
//         width: 50,
//         disableFilters: true,
//       },
//       {
//         Header: 'Beam Inward Date',
//         accessor: (row: any) => row?.beamInwardDate || row?.createdAt || row?.date || '',
//         Cell: ({ value }: { value: string }) => {
//                              if (!value) return 'N/A';
//                              const date = new Date(value);
//                              const day = date.getDate().toString().padStart(2, '0');
//                              const month = (date.getMonth() + 1).toString().padStart(2, '0');
//                              const year = date.getFullYear();
//                              return `${day}/${month}/${year}`;
//                            },
//                            Filter: DateRangeFilter,
//         filter: (rows: any[], columnIds: string[], fv: { from?: string; to?: string }) => {
//           const id = columnIds[0];
//           return rows.filter((row: any) => {
//             const raw = row.values[id];
//             if (!raw) return false;
//             const d = new Date(raw);
//             if (isNaN(d.getTime())) return false;
//             d.setHours(0,0,0,0);
//             if (fv?.from) {
//               const from = new Date(fv.from);
//               from.setHours(0,0,0,0);
//               if (d < from) return false;
//             }
//             if (fv?.to) {
//               const to = new Date(fv.to);
//               to.setHours(23,59,59,999);
//               if (d > to) return false;
//             }
//             return true;
//           });
//         },
//       },
//       {
//         Header: 'Beam Inward No',
//         accessor: 'beamInwardNo',
//       },
//       {
//         Header: 'Sizing Plan No',
//         accessor: 'sizingPlanId',
//         Cell: ({ value }: { value: number | string | null }) => {
//           if (value == null || value === '') return '';
//           const spArr: any[] = Array.isArray((sizingPlanList as any)?.data)
//             ? (sizingPlanList as any).data
//             : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
//           const plan = spArr.find((sp: any) => String(sp.id) === String(value));
//           return plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || value || '';
//         },
//         Filter: ({ column: { filterValue, setFilter } }: any) => (
//           <input
//             type="text"
//             value={filterValue || ''}
//             onChange={e => setFilter(e.target.value || undefined)}
//             className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
//             placeholder="Search plan..."
//           />
//         ),
//         filter: (rows: any[], columnIds: string[], filterValue: string) => {
//             const term = (filterValue || '').toString().toLowerCase().trim();
//             if (!term) return rows;
//             const id = columnIds[0];
//             const spArr: any[] = Array.isArray((sizingPlanList as any)?.data)
//               ? (sizingPlanList as any).data
//               : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
//             return rows.filter((row: any) => {
//               const planId = row.values[id];
//               const plan = spArr.find((sp: any) => String(sp.id) === String(planId));
//               const planNo = (plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || planId || '').toString().toLowerCase();
//               return planNo.includes(term);
//             });
//         },
//       },
//       {
//         Header: 'Sizing Vendor',
//         accessor: 'sizingVendorId',
//         Cell: ({ value }: { value: number }) => {
//           const vendor = vendorList.find((c: any) => c.id === value);
//           return vendor ? vendor.vendorName : value;
//         },
//         Filter: ({ column: { filterValue, setFilter } }: any) => (
//           <input
//             type="text"
//             value={filterValue || ''}
//             onChange={e => setFilter(e.target.value || undefined)}
//             className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
//             placeholder="Search vendor..."
//           />
//         ),
//         filter: (rows: any[], columnIds: string[], filterValue: string) => {
//           const term = (filterValue || '').toString().toLowerCase().trim();
//           if (!term) return rows;
//           return rows.filter((row: any) => {
//             const id = row.values[columnIds[0]];
//             const vendor = vendorList.find((c: any) => c.id === id);
//             const name = vendor?.vendorName?.toLowerCase() || '';
//             return name.includes(term);
//           });
//         },
//       },
//       {
//         Header: 'Weaver',
//         id: 'weaver',
//         accessor: (row: any) => {
//           // Normalize lists that may come as array or { data: [] }
//           const spArr: any[] = Array.isArray((sizingPlanList as any)?.data) ? (sizingPlanList as any).data : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
//           const vendorArr: any[] = Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : (Array.isArray(vendorList) ? (vendorList as any) : []);

//           const sp = spArr.find((s: any) => String(s.id) === String(row?.sizingPlanId));
//           const otRaw = row?.orderTypeId ?? sp?.orderTypeId;
//           const ot = String(otRaw ?? "");
//           // if (ot === "1") return (companyName || row?.companyName || 'Internal');

//           const beams = row?.beamInwardBeamDetails || [];
//           const names = Array.from(new Set((beams || []).map((b: any) => {
//             const vendorId = b?.weavingVendorId ?? b?.vendorId;
//             const v = vendorArr.find((c: any) => String(c.id) === String(vendorId));
//             return v ? v.vendorName : '';
//           }).filter(Boolean)));
//           return names.length ? names.join(', ') : '';
//         },
//         Cell: ({ value }: { value: string }) => value || '',
//         Filter: ({ column: { filterValue, setFilter } }: any) => (
//           <input
//             type="text"
//             value={filterValue || ''}
//             onChange={e => setFilter(e.target.value || undefined)}
//             className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
//             placeholder="Search weaver..."
//           />
//         ),
//         filter: (rows: any[], columnIds: string[], filterValue: string) => {
//           const term = (filterValue || '').toString().toLowerCase().trim();
//           if (!term) return rows;
//           const id = columnIds[0];
//           return rows.filter((row: any) => {
//             const val = (row.values[id] || '').toString().toLowerCase();
//             return val.includes(term);
//           });
//         },
//       },
//       {
//         Header: 'Sizing Rate',
//         accessor: 'sizingRate',
//       },
//       {
//         Header: 'Total Beam',
//         id: 'totalBeam',
//         accessor: (row: any) => row.beamInwardBeamDetails?.length || 0,
//       },
//       {
//         Header: 'Total Warp Meters',
//         id: 'totalWarpMeters',
//         accessor: (row: any) => row.beamInwardBeamDetails?.reduce((sum: number, beam: any) => sum + (beam.wrapMeters || 0), 0) || 0,
//       },
//       // {
//       //   Header: 'Beam Outward',
//       //   accessor: 'id',
//       //   Cell: ({ row }: any) => (
//       //     <button
//       //       className="text-blue-600 underline"
//       //       onClick={() => handleBeamOutward(row?.original || row?.values || row || {})}
//       //     >
//       //       Beam Outward
//       //     </button>
//       //   ),
//       //   disableFilters: true,
//       // },
//     ],
//     [vendorList, weavingContractList, consigneeList, sizingPlanList, companyName]
//   );

//   const handleAdd = () => {
//     navigate("/transaction/beam-inward-entry");
//   };

//   const handleEdit = (beamInwardDtl: BeamInwardData) => {
//     console.log(JSON.stringify(beamInwardDtl));
//     navigate("/transaction/beam-inward-entry", { state: { beamInwardDtl } });
//   };

//   const handleDelete = (beamInward: BeamInwardData) => {
//     setCurrentBeamInward(beamInward);
//     setIsDeleteModalOpen(true);
//   };

//   const handleView = (beamInward: BeamInwardData) => {
//     setCurrentBeamInward(beamInward);
//     setIsViewModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!currentBeamInward) return;
//     try {
//       const deletePayload = companyId != null
//         ? { id: currentBeamInward.id, companyId }
//         : { id: currentBeamInward.id };
//       await dispatch(deleteBeamInward(deletePayload)).unwrap();
//       await dispatch(getAllBeamInward(companyId != null ? { companyId } : {}));
//     } catch (error) {
//       console.error("Error deleting Beam Inward:", error);
//     }
//     setIsDeleteModalOpen(false);
//   };

//   // Handle checkbox changes in beam outward modal
//   const handleCheckboxChange = (beamId: number, checked: boolean) => {
//     setOutwardSelection(prev => ({
//       ...prev,
//       [beamId]: checked
//     }));
//   };

//   // Handle beam outward submission
//   const handleOutwardSubmit = async () => {
//     const selectedBeams = outwardRow?.beamInwardBeamDetails.filter((beam, idx) => outwardSelection[beam?.id ?? idx]) || [];
//     const payloads = selectedBeams.map((beam: any, idx: number) => {
//       const spArr: any[] = Array.isArray((sizingPlanList as any)?.data) ? (sizingPlanList as any).data : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
//       const planId = beam?.sizingPlanId ?? outwardRow?.sizingPlanId;
//       const plan = spArr.find((p: any) => String(p.id) === String(planId));
//       const fpw = Number(plan?.sizingQualityDetails?.[0]?.fabricPanelWidth || 1) || 1;
//       const warp = Number(beam?.wrapMeters || 0) || 0;
//       const shrink = Number(beam?.shrinkage || 0) || 0;
//       const base = warp * fpw;
//       const efmCalc = base - (base * (shrink / 100));
//       const efmVal = beam?.expectedFabricMeter ?? (isNaN(efmCalc) ? 0 : Number(efmCalc.toFixed(2)));

//       const wcArr: any[] = Array.isArray((weavingContractList as any)?.data) ? (weavingContractList as any).data : (Array.isArray(weavingContractList) ? (weavingContractList as any) : []);
//       const vendorArr: any[] = Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : (Array.isArray(vendorList) ? (vendorList as any) : []);
//       const companies: any[] = Array.isArray((companyMasterList as any)?.data) ? (companyMasterList as any).data : (Array.isArray(companyMasterList) ? (companyMasterList as any) : []);
//       const wc = wcArr.find((w: any) => String(w.id) === String(beam.weavingContractId));
//       const orderTypeIdNum = Number(wc?.orderTypeId ?? 0);
//       const weaverId = beam?.weavingVendorId ?? beam?.vendorId;
//       const weaver = vendorArr.find((v: any) => String(v.id) === String(weaverId));
//       const vendorName = String(weaver?.vendorName || "").trim().toLowerCase();
//       const matchedCompany = companies.find((c: any) => String(c?.companyName || c?.name || "").trim().toLowerCase() === vendorName);
//       const effectiveFactoryCompanyId = orderTypeIdNum === 1 ? (matchedCompany?.id ?? null) : null;

//       const weavingWorkOrderId = workOrderByContractMap.get(String(beam?.weavingContractId ?? ''));


//       return {
//         beamInwardId: beam?.beamInwardId ?? outwardRow?.id,
//         weavingContractId: beam?.weavingContractId,
//         weavingWorkOrderId: weavingWorkOrderId != null ? Number(weavingWorkOrderId) : null,
//         weavingVendorId: beam?.weavingVendorId ?? beam?.vendorId,
//         salesOrderId: beam?.salesOrderId,
//         sizedBeamNo: beam?.sizedBeamNo,
//         flangeNo: beam?.flangeNo,
//         wrapMeters: beam?.wrapMeters,
//         shrinkage: beam?.shrinkage,
//         expectedFabricMeter: efmVal,
//         fabricPanelWidth: fpw,
//         outwardDate: outwardDate,
//         sizingPlanId: outwardRow?.sizingPlanId ?? "",
//         tradingCompanyId: selectedCompany != null ? Number(selectedCompany) : null,
//         factoryCompanyId: effectiveFactoryCompanyId != null ? Number(effectiveFactoryCompanyId) : null,
//       };
//     });

//     try {
//       await dispatch(createBeamOutward(payloads) as any).unwrap();
//       const selectedKeys = new Set(
//         (outwardRow?.beamInwardBeamDetails || [])
//           .map((b: any, i: number) => (outwardSelection[(b?.id ?? i)] ? (b?.id ?? i) : null))
//           .filter((k: any) => k !== null)
//       );
//       setOutwardRow((prev: any) => {
//         if (!prev) return prev;
//         const updatedDetails = (prev.beamInwardBeamDetails || []).map((b: any, i: number) =>
//           selectedKeys.has(b?.id ?? i) ? { ...b, isBeamOutwarded: 1 } : b
//         );
//         return { ...prev, beamInwardBeamDetails: updatedDetails };
//       });
//       setOutwardSelection({});
//       await dispatch(getAllBeamInward(companyId != null ? { companyId } : {}));
//       const justOutwardedIds = (selectedBeams as any[]).map((b: any) => b.id).filter((id: any) => id !== undefined && id !== null);
//       setLocalOutwardedIds(prev => new Set([...Array.from(prev), ...justOutwardedIds]));
//       setIsOutwardModalOpen(false);
//       setOutwardRow(null);
//       setOutwardSelection({});
//     } catch (e) {
//       console.error(e);
//     }
//   };


//   return (
//     <div>
//       <DataTable
//         columns={columns}
//         data={processedCityList}
//         title="Beam Inward Details"
//         onAdd={handleAdd}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//         onView={handleView}
//         showActions={true}
//         filterPlaceholder="Search beam inward..."
//         showColumnFilters={true}
//         initialPageSize={itemsPerPage}
//         onPageSizeChange={setItemsPerPage}
//            totalCount={paginationInfo?.total || 0}
//         currentPage={currentPage}
//         onPageChange={handlePageChange}
//       />

// <Pagination
//           currentPage={currentPage}
//           totalItems={paginationInfo?.total || 0}
//           itemsPerPage={itemsPerPage}
//           offset={paginationInfo?.offset || 0}
//           hasNext={!!paginationInfo?.next}
//           hasPrev={!!paginationInfo?.prev}
//           onPageChange={handlePageChange}
//         />
//       {/* View Modal */}
//       <Modal
//         isOpen={isViewModalOpen}
//         onClose={() => setIsViewModalOpen(false)}
//         title="Beam Inward Details"
//         className="max-w-4xl"
//       >
//         {currentBeamInward && (
//           <div className="space-y-6">
//             <div className="grid grid-cols-3 gap-4">
//               <div>
//                 <p className="text-sm text-secondary-500">Beam Inward No</p>
//                 <p className="font-medium">{currentBeamInward.beamInwardNo}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Sizing Vendor</p>
//                 <p className="font-medium">{currentBeamInward.sizingVendorId}</p>
//               </div>
//               {/* <div>
//                 <p className="text-sm text-secondary-500">Weaver</p>
//                 <p className="font-medium">{currentBeamInward.consigneeId}</p>
//               </div> */}
//               <div>
//                 <p className="text-sm text-secondary-500">Sizing Rate</p>
//                 <p className="font-medium">{currentBeamInward.sizingRate}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Payment Terms</p>
//                 <p className="font-medium">{currentBeamInward.paymentTermsId}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Remarks</p>
//                 <p className="font-medium">{currentBeamInward.remarks}</p>
//               </div>
//             </div>

//             <div className="mt-6">
//               <h3 className="font-medium text-lg mb-3">Quality Details</h3>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full border-collapse border border-gray-300">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       <th className="border p-2">Quality</th>
//                       <th className="border p-2">Yarn ID</th>
//                       <th className="border p-2">Sort Ends</th>
//                       <th className="border p-2">Actual Ends</th>
//                       <th className="border p-2">Parts</th>
//                       <th className="border p-2">Ends Per Part</th>
//                       <th className="border p-2">Wrap Meters</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {currentBeamInward.beamInwardQualityDetails.map((quality, index) => (
//                       <tr key={index}>
//                         <td className="border p-2">{quality.quality}</td>
//                         <td className="border p-2">{quality.yarnId}</td>
//                         <td className="border p-2">{quality.sordEnds}</td>
//                         <td className="border p-2">{quality.actualEnds}</td>
//                         <td className="border p-2">{quality.parts}</td>
//                         <td className="border p-2">{quality.endsPerPart}</td>
//                         <td className="border p-2">{quality.wrapMeters}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div className="mt-6">
//               <h3 className="font-medium text-lg mb-3">Beam Details</h3>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full border-collapse border border-gray-300">
//                   <thead className="bg-gray-100">
//                     <tr>
//                       {/* <th className="border p-2">Weaving Contract ID</th */}
//                       <th className="border p-2">Weaving Contract ID</th>
//                       <th className="border p-2">Sales Order ID</th>
//                       <th className="border p-2">Sized Beam No</th>
//                       <th className="border p-2">Wrap Meters</th>
//                       <th className="border p-2">Shrinkage</th>
//                       <th className="border p-2">Expected Fabric Meter</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {(currentBeamInward.beamInwardBeamDetails || [])
//                       .filter((beam: any) => String(beam.isBeamOutwarded) !== "1" && !localOutwardedIds.has(beam.id))
//                       .map((beam, index) => (
//                         <tr key={index}>
//                           <td className="border p-2">{beam.weavingContractId}</td>
//                           <td className="border p-2">{beam.salesOrderId}</td>
//                           <td className="border p-2">{beam.sizedBeamNo}</td>
//                           <td className="border p-2">{beam.wrapMeters}</td>
//                           <td className="border p-2">{beam.shrinkage}</td>
//                           <td className="border p-2">{beam.expectedFabricMeter}</td>
//                         </tr>
//                       ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div className="flex justify-end pt-4">
//               <Button
//                 onClick={() => setIsViewModalOpen(false)}
//                 className="btn btn-secondary"
//               >
//                 Close
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* Beam Outward Modal */}
//       <Modal
//         isOpen={isOutwardModalOpen}
//         onClose={() => setIsOutwardModalOpen(false)}
//         title="Beam Outward"
//         className="max-w-[60%]"
//       >
//         {outwardRow && (
//           <div className="space-y-4">
//             <div className="grid grid-cols-3 gap-4 mb-4">
//               <div>
//                 <p className="text-sm text-secondary-500">Outward Date</p>
//                 <input
//                   type="date"
//                   value={outwardDate}
//                   onChange={(e) => setOutwardDate(e.target.value)}
//                   className="w-full px-2 py-1 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
//                 />
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Beam Inward No</p>
//                 <p className="font-medium">{outwardRow.beamInwardNo}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Total Beams</p>
//                 <p className="font-medium">{Object.values(outwardSelection).filter(Boolean).length}</p>
//               </div>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-full border-collapse border border-gray-300">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="border p-2">Select</th>
//                     <th className="border p-2">Fabric Code/Quality</th>
//                     <th className="border p-2">Weaving Contract No</th>
//                     <th className="border p-2">Weaver</th>
//                     <th className="border p-2">Sales Order No</th>
//                     <th className="border p-2">Sizing Plan No</th>
//                     <th className="border p-2">Sized Beam No</th>
//                     {/* <th className="border p-2">Empty Beam No</th> */}
//                     <th className="border p-2">Fabric Panel/Width</th>
//                     <th className="border p-2">Warp Meters</th>
//                     <th className="border p-2">Shrinkage</th>
//                     <th className="border p-2">Expected Fabric Meter</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {(outwardRow.beamInwardBeamDetails || [])
//                     .filter((beam: any) => String(beam.isBeamOutwarded) !== "1" && !localOutwardedIds.has(beam.id))
//                     .map((beam: any, idx: number) => {
//                       const wcArr: any[] = Array.isArray((weavingContractList as any)?.data) ? (weavingContractList as any).data : (Array.isArray(weavingContractList) ? (weavingContractList as any) : []);
//                       const soArr: any[] = Array.isArray((salesOrderList as any)?.data) ? (salesOrderList as any).data : (Array.isArray(salesOrderList) ? (salesOrderList as any) : []);
//                       const vendorArr: any[] = Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : (Array.isArray(vendorList) ? (vendorList as any) : []);
//                       const spArr: any[] = Array.isArray((sizingPlanList as any)?.data) ? (sizingPlanList as any).data : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
//                       const wc = wcArr.find((w: any) => String(w.id) === String(beam.weavingContractId));
//                       const so = soArr.find((s: any) => String(s.id) === String(beam.salesOrderId));
//                       const weaverId = beam?.weavingVendorId ?? beam?.vendorId;
//                       const weaver = vendorArr.find((s: any) => String(s.id) === String(weaverId));
//                       const planId = beam?.sizingPlanId ?? outwardRow?.sizingPlanId;
//                       const plan = spArr.find((p: any) => String(p.id) === String(planId));
//                       const otRaw = outwardRow?.orderTypeId ?? plan?.orderTypeId;
//                       const ot = String(otRaw ?? "");
//                       const wcNo = wc?.weavingContractNo || wc?.contractNo || wc?.wcNo || wc?.contractNumber || wc?.weavingContractNumber || beam.weavingContractId;
//                       const soNo = so?.salesOrderNo || so?.orderNo || so?.soNo || so?.salesOrderNumber || beam.salesOrderId;
//                       const weaverName = weaver?.vendorName || '';
//                       const spNo = plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || planId || "";
//                       const planFPW = Number(plan?.sizingQualityDetails?.[0]?.fabricPanelWidth || 1) || 1;
//                       const warp = Number(beam.wrapMeters || 0) || 0;
//                       const shrink = Number(beam.shrinkage || 0) || 0;
//                       const base = warp * planFPW;
//                       const efmCalc = base - (base * (shrink / 100));
//                       const showEfm = (beam.expectedFabricMeter != null && beam.expectedFabricMeter !== '') ? beam.expectedFabricMeter : (isNaN(efmCalc) ? '' : efmCalc.toFixed(2));
//                       const key = beam?.id ?? idx;
//                       return (
//                         <tr key={key}>
//                           <td className="border p-2 text-center">
//                             <input
//                               type="checkbox"
//                               checked={!!outwardSelection[key]}
//                               onChange={(e) => handleCheckboxChange(key, e.target.checked)}
//                               className="h-4 w-4"
//                             />
//                           </td>
//                           <td className="border p-2">
//                             {(() => {
//                               const beamFabricId = beam?.fabricId ?? beam?.fabricCodeId ?? beam?.itemId;
//                               const wcFabricId = wc?.fabricId ?? wc?.fabricCodeId ?? wc?.itemId;
//                               const fid = String(beamFabricId || wcFabricId || "");
                              
//                               const fmArr: any[] = Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : (Array.isArray(fabricMasterList) ? (fabricMasterList as any) : []);
                              
//                               // 1. Try to find in quality details by fabric ID
//                               let uq = plan?.sizingQualityDetails?.find((q: any) => 
//                                 String(q?.fabricId || q?.fabricCodeId || "") === fid && fid !== ""
//                               );
                              
//                               // 2. If not found, try to find in quality details by yarnId (many beams are linked by yarn in sizing)
//                               if (!uq && beam?.yarnId) {
//                                 uq = plan?.sizingQualityDetails?.find((q: any) => 
//                                   String(q?.yarnId) === String(beam.yarnId)
//                                 );
//                               }
                              
//                               // 3. If still not found and we have a valid fid, try fabric master
//                               if (!uq && fid !== "") {
//                                 const fm = fmArr.find((f: any) => String(f?.id) === fid || String(f?.fabricCodeId) === fid);
//                                 if (fm) return `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}`;
//                               }

//                               if (uq) return `${uq.fabricCode || ""} / ${uq.quality || uq.fabricQuality || ""}`;
                              
//                               // 4. Final fallback: if we have quality info in plan at all
//                               if (plan?.sizingQualityDetails?.[0]) {
//                                 const q = plan.sizingQualityDetails[0];
//                                 return `${q.fabricCode || ""} / ${q.quality || q.fabricQuality || ""}`;
//                               }
                              
//                               return "";
//                             })()}
//                           </td>
                         
//                           <td className="border p-2">{wcNo}</td>
//                           <td className="border p-2">{weaverName}</td>
//                           <td className="border p-2">{soNo}</td>
//                           <td className="border p-2">{spNo}</td>
//                           <td className="border p-2">{beam.sizedBeamNo}</td>
//                           {/* <td className="border p-2">{beam.flangeNo || ''}</td> */}
//                           <td className="border p-2">{planFPW}</td>
//                           <td className="border p-2">{beam.wrapMeters}</td>
//                           <td className="border p-2">{beam.shrinkage}</td>
//                           <td className="border p-2">{showEfm}</td>
//                         </tr>
//                       );
//                     })}
//                 </tbody>
//               </table>
//             </div>

//             {((outwardRow.beamInwardBeamDetails || []).filter((beam: any) => String(beam.isBeamOutwarded) !== "1" && !localOutwardedIds.has(beam.id)).length === 0) && (
//               <div className="text-center py-4 text-gray-500">
//                 No beam details available for this inward.
//               </div>
//             )}

//             <div className="flex justify-end space-x-3 pt-4">
//               <Button 
//                 onClick={() => setIsOutwardModalOpen(false)} 
//                 className="btn btn-secondary"
//               >
//                 Cancel
//               </Button>
//               <Button 
//                 onClick={handleOutwardSubmit}
//                 className="btn btn-primary"
//                 disabled={Object.values(outwardSelection).every(val => !val)}
//               >
//                 Process Outward
//               </Button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         isOpen={isDeleteModalOpen}
//         onClose={() => setIsDeleteModalOpen(false)}
//         title="Confirm Delete"
//       >
//         <div className="space-y-4">
//           <p>Are you sure you want to delete beam inward "{currentBeamInward?.beamInwardNo}"?</p>
//           <p className="text-red-600 text-sm">This action cannot be undone.</p>

//           <div className="flex justify-end space-x-3 pt-4">
//             <Button
//               onClick={() => setIsDeleteModalOpen(false)}
//               className="btn btn-secondary"
//             >
//               Cancel
//             </Button>
//             <Button onClick={confirmDelete} className="btn btn-danger">
//               Delete
//             </Button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }
//beam inward beam details



import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { deleteBeamInward, getAllBeamInward } from "@/state/beamInwardSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { createBeamOutward } from "@/state/beamOutwardSlice";
import { getAllSizingPlan } from "@/state/sizingPlanSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllWeavingJobWorkOrders } from "@/state/weavingJobWorkOrderSlice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";

interface BeamInwardData {
  id: number;
  sizingVendorId: number;
  sizingPlanId: number | null;
  termsConditionsId: number;
  consigneeId: number;
  paymentTermsId: number;
  sizingRate: number;
  remarks: string;
  beamInwardNo: string;
  orderTypeId: number;
  beamInwardQualityDetails: {
    id: number;
    beamInwardId: number | null;
    quality: string;
    yarnId: number;
    sordEnds: number;
    actualEnds: number;
    parts: number;
    endsPerPart: number;
    wrapMeters: number;
  }[];
  beamInwardBeamDetails: {
    id: number;
    beamInwardId: number | null;
    weavingContractId: number;
    weavingVendorId: number;
    salesOrderId: number;
    sizedBeamNo: number | string;
    flangeNo?: string;
    wrapMeters: number;
    shrinkage: number;
    expectedFabricMeter: number;
     isBeamOutwarded:number;
  }[];
}

export function BeamInwardDetails() {
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder as any);
  const { beamInwardList,paginationInfo } = useSelector((state: RootState) => state.beamInward);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan as any);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => (state as any).weavingJobWorkOrder);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');
  const [currentBeamInward, setCurrentBeamInward] = useState<BeamInwardData | null>(null);
  const [outwardRow, setOutwardRow] = useState<BeamInwardData | null>(null);
  const [outwardSelection, setOutwardSelection] = useState<Record<number, boolean>>({});
  const [outwardDate, setOutwardDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [localOutwardedIds, setLocalOutwardedIds] = useState<Set<number>>(new Set());
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset,setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedCompany } = useAuth();

  useEffect(() => {
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllConsignee({fetchAll: true}));
    dispatch(getAllWeavingContract({}) as any);
    dispatch(getAllSalesOrders({}) as any);
    dispatch(getAllSizingPlan({}) as any);
    dispatch(getAllFabricMasters({}) as any);
    dispatch(getAllCompanies({}) as any);
    dispatch(getAllWeavingJobWorkOrders({}) as any);
  }, [dispatch,getOffset, itemsPerPage]);

  useEffect(() => {
    if (selectedCompany == null) return;
    dispatch(getAllBeamInward({ companyId: selectedCompany,fetchAll:true }));
  }, [dispatch, selectedCompany, currentPage, itemsPerPage, getOffset]);

  const processedCityList = useMemo(() => {
    return beamInwardList.map((city: any, index: number) => ({
      ...city,
      serialNo: (paginationInfo?.offset ?? 0) + index + 1
    }));
  }, [beamInwardList, paginationInfo?.offset]);

  // Simplified handleBeamOutward function
  const handleBeamOutward = (row: BeamInwardData) => {
    const normalizedId = row?.id != null ? Number(row.id) : null;
    const sourceList = (Array.isArray(beamInwardList) ? beamInwardList : []) as BeamInwardData[];
    const beamInwardData: BeamInwardData =
      normalizedId != null
        ? sourceList.find((item) => Number(item?.id) === normalizedId) || row
        : row;

    if (!beamInwardData) {
      console.error("Beam inward data not found for ID:", row?.id);
      return;
    }

    setOutwardRow(beamInwardData);

    const initialSelection: Record<number, boolean> = {};
    if (beamInwardData.beamInwardBeamDetails && beamInwardData.beamInwardBeamDetails.length > 0) {
      beamInwardData.beamInwardBeamDetails
        .filter((beam) => String(beam.isBeamOutwarded) !== "1" && !localOutwardedIds.has(beam.id))
        .forEach((beam) => {
          if (beam?.id != null) initialSelection[beam.id] = false;
        });
    }

    setOutwardSelection(initialSelection);
    setIsOutwardModalOpen(true);
  };

  const workOrderByContractMap = useMemo(() => {
    const raw = weavingJobWorkOrderList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, number>();
    arr.forEach((w: any) => {
      const contractId = w?.weavingContractId ?? w?.contractId ?? w?.weavingContract?.id;
      if (contractId != null && w?.id != null) map.set(String(contractId), Number(w.id));
    });
    return map;
  }, [weavingJobWorkOrderList]);

  const containerNames = useMemo(() => {
    return (processedCityList || []).map((row: any) => `beam_inward_${row.id}`);
  }, [processedCityList]);

  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

  const handleOpenAttachmentModal = useCallback((row: any) => {
    setSelectedAttachmentContainer(`beam_inward_${row.id}`);
    setAttachmentModalTitle(`Beam Inward #${row.beamInwardNo || row.id} Files`);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: 'Beam Inward Date',
        accessor: (row: any) => row?.beamInwardDate || row?.createdAt || row?.date || '',
        Cell: ({ value }: { value: string }) => {
                             if (!value) return 'N/A';
                             const date = new Date(value);
                             const day = date.getDate().toString().padStart(2, '0');
                             const month = (date.getMonth() + 1).toString().padStart(2, '0');
                             const year = date.getFullYear();
                             return `${day}/${month}/${year}`;
                           },
                           Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], fv: { from?: string; to?: string }) => {
          const id = columnIds[0];
          return rows.filter((row: any) => {
            const raw = row.values[id];
            if (!raw) return false;
            const d = new Date(raw);
            if (isNaN(d.getTime())) return false;
            d.setHours(0,0,0,0);
            if (fv?.from) {
              const from = new Date(fv.from);
              from.setHours(0,0,0,0);
              if (d < from) return false;
            }
            if (fv?.to) {
              const to = new Date(fv.to);
              to.setHours(23,59,59,999);
              if (d > to) return false;
            }
            return true;
          });
        },
      },
      {
        Header: 'Beam Inward No',
        accessor: 'beamInwardNo',
      },
      {
        Header: 'Sizing Plan No',
        accessor: 'sizingPlanId',
        Cell: ({ value }: { value: number | string | null }) => {
          if (value == null || value === '') return '';
          const spArr: any[] = Array.isArray((sizingPlanList as any)?.data)
            ? (sizingPlanList as any).data
            : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
          const plan = spArr.find((sp: any) => String(sp.id) === String(value));
          return plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || value || '';
        },
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <input
            type="text"
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
            placeholder="Search plan..."
          />
        ),
        filter: (rows: any[], columnIds: string[], filterValue: string) => {
            const term = (filterValue || '').toString().toLowerCase().trim();
            if (!term) return rows;
            const id = columnIds[0];
            const spArr: any[] = Array.isArray((sizingPlanList as any)?.data)
              ? (sizingPlanList as any).data
              : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
            return rows.filter((row: any) => {
              const planId = row.values[id];
              const plan = spArr.find((sp: any) => String(sp.id) === String(planId));
              const planNo = (plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || planId || '').toString().toLowerCase();
              return planNo.includes(term);
            });
        },
      },
      {
        Header: 'Sizing Vendor',
        accessor: 'sizingVendorId',
        Cell: ({ value }: { value: number | string }) => {
          const vendorArr: any[] = Array.isArray((vendorList as any)?.data)
            ? (vendorList as any).data
            : (Array.isArray(vendorList) ? (vendorList as any) : []);
          const vendor = vendorArr.find((c: any) => String(c.id) === String(value));
          return vendor ? (vendor.vendorName || vendor.name || value) : (value ?? '');
        },
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <input
            type="text"
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
            placeholder="Search vendor..."
          />
        ),
        filter: (rows: any[], columnIds: string[], filterValue: string) => {
          const term = (filterValue || '').toString().toLowerCase().trim();
          if (!term) return rows;
          const vendorArr: any[] = Array.isArray((vendorList as any)?.data)
            ? (vendorList as any).data
            : (Array.isArray(vendorList) ? (vendorList as any) : []);
          return rows.filter((row: any) => {
            const id = row.values[columnIds[0]];
            const vendor = vendorArr.find((c: any) => String(c.id) === String(id));
            const name = (vendor?.vendorName || vendor?.name || String(id || '')).toLowerCase();
            return name.includes(term);
          });
        },
      },
      {
        Header: 'Weaver',
        id: 'weaver',
        accessor: (row: any) => {
          // Normalize lists that may come as array or { data: [] }
          const spArr: any[] = Array.isArray((sizingPlanList as any)?.data) ? (sizingPlanList as any).data : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
          const vendorArr: any[] = Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : (Array.isArray(vendorList) ? (vendorList as any) : []);

          const sp = spArr.find((s: any) => String(s.id) === String(row?.sizingPlanId));
          const otRaw = row?.orderTypeId ?? sp?.orderTypeId;
          const ot = String(otRaw ?? "");

          const beams = row?.beamInwardBeamDetails || [];
          const names = Array.from(new Set((beams || []).map((b: any) => {
            const vendorId = b?.weavingVendorId ?? b?.vendorId ?? b?.returnWeaverId;
            const v = vendorArr.find((c: any) => String(c.id) === String(vendorId));
            return v ? (v.vendorName || v.name) : (vendorId ? String(vendorId) : '');
          }).filter(Boolean)));
          return names.length ? names.join(', ') : '';
        },
        Cell: ({ value }: { value: string }) => value || '',
        Filter: ({ column: { filterValue, setFilter } }: any) => (
          <input
            type="text"
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-black font-medium"
            placeholder="Search weaver..."
          />
        ),
        filter: (rows: any[], columnIds: string[], filterValue: string) => {
          const term = (filterValue || '').toString().toLowerCase().trim();
          if (!term) return rows;
          const id = columnIds[0];
          return rows.filter((row: any) => {
            const val = (row.values[id] || '').toString().toLowerCase();
            return val.includes(term);
          });
        },
      },
      {
        Header: 'Sizing Rate',
        accessor: 'sizingRate',
      },
      {
        Header: 'Total Beam',
        id: 'totalBeam',
        accessor: (row: any) => row.beamInwardBeamDetails?.length || 0,
      },
      {
        Header: 'Total Warp Meters',
        id: 'totalWarpMeters',
        accessor: (row: any) => row.beamInwardBeamDetails?.reduce((sum: number, beam: any) => sum + (beam.wrapMeters || 0), 0) || 0,
      },
      {
        Header: 'Files',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const containerName = `beam_inward_${row.original.id}`;
          const count = fileCounts[containerName] || 0;
          return count > 0 ? (
            <button
              onClick={() => handleOpenAttachmentModal(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              View Files ({count})
            </button>
          ) : (
            <button
              onClick={() => handleOpenAttachmentModal(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              Upload
            </button>
          );
        },
      },
    ],
    [vendorList, weavingContractList, consigneeList, sizingPlanList, fileCounts, handleOpenAttachmentModal]
  );

  const handleAdd = () => {
    navigate("/transaction/beam-inward-entry");
  };

  const handleEdit = (beamInwardDtl: BeamInwardData) => {
    console.log(JSON.stringify(beamInwardDtl));
    navigate(`/transaction/beam-inward-entry/${beamInwardDtl.id}`, { state: { beamInwardDtl } });
  };

  const handleDelete = (beamInward: BeamInwardData) => {
    setCurrentBeamInward(beamInward);
    setIsDeleteModalOpen(true);
  };

  const handleView = (beamInward: BeamInwardData) => {
    setCurrentBeamInward(beamInward);
    setIsViewModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentBeamInward) return;
    try {
      const deletePayload = selectedCompany != null
        ? { id: currentBeamInward.id, companyId: selectedCompany }
        : { id: currentBeamInward.id };
      await dispatch(deleteBeamInward(deletePayload)).unwrap();
      await dispatch(getAllBeamInward(selectedCompany != null ? { companyId: selectedCompany, offset: getOffset(), limit: itemsPerPage } : { offset: getOffset(), limit: itemsPerPage }));
    } catch (error) {
      console.error("Error deleting Beam Inward:", error);
    }
    setIsDeleteModalOpen(false);
  };

  // Handle checkbox changes in beam outward modal
  const handleCheckboxChange = (beamId: number, checked: boolean) => {
    setOutwardSelection(prev => ({
      ...prev,
      [beamId]: checked
    }));
  };

  // Handle beam outward submission
  const handleOutwardSubmit = async () => {
    const selectedBeams = outwardRow?.beamInwardBeamDetails.filter((beam, idx) => outwardSelection[beam?.id ?? idx]) || [];
    const payloads = selectedBeams.map((beam: any, idx: number) => {
      const spArr: any[] = Array.isArray((sizingPlanList as any)?.data) ? (sizingPlanList as any).data : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
      const planId = beam?.sizingPlanId ?? outwardRow?.sizingPlanId;
      const plan = spArr.find((p: any) => String(p.id) === String(planId));
      const fpw = Number(plan?.sizingQualityDetails?.[0]?.fabricPanelWidth || 1) || 1;
      const warp = Number(beam?.wrapMeters || 0) || 0;
      const shrink = Number(beam?.shrinkage || 0) || 0;
      const base = warp * fpw;
      const efmCalc = base - (base * (shrink / 100));
      const efmVal = beam?.expectedFabricMeter ?? (isNaN(efmCalc) ? 0 : Number(efmCalc.toFixed(2)));

      const wcArr: any[] = Array.isArray((weavingContractList as any)?.data) ? (weavingContractList as any).data : (Array.isArray(weavingContractList) ? (weavingContractList as any) : []);
      const vendorArr: any[] = Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : (Array.isArray(vendorList) ? (vendorList as any) : []);
      const companies: any[] = Array.isArray((companyMasterList as any)?.data) ? (companyMasterList as any).data : (Array.isArray(companyMasterList) ? (companyMasterList as any) : []);
      const wc = wcArr.find((w: any) => String(w.id) === String(beam.weavingContractId));
      const orderTypeIdNum = Number(wc?.orderTypeId ?? 0);
      const weaverId = beam?.weavingVendorId ?? beam?.vendorId;
      const weaver = vendorArr.find((v: any) => String(v.id) === String(weaverId));
      const vendorName = String(weaver?.vendorName || "").trim().toLowerCase();
      const matchedCompany = companies.find((c: any) => String(c?.companyName || c?.name || "").trim().toLowerCase() === vendorName);
      const effectiveFactoryCompanyId = orderTypeIdNum === 1 ? (matchedCompany?.id ?? null) : null;

      const weavingWorkOrderId = workOrderByContractMap.get(String(beam?.weavingContractId ?? ''));


      return {
        beamInwardId: beam?.beamInwardId ?? outwardRow?.id,
        weavingContractId: beam?.weavingContractId,
        weavingWorkOrderId: weavingWorkOrderId != null ? Number(weavingWorkOrderId) : null,
        weavingVendorId: beam?.weavingVendorId ?? beam?.vendorId,
        salesOrderId: beam?.salesOrderId,
        sizedBeamNo: beam?.sizedBeamNo,
        flangeNo: beam?.flangeNo,
        wrapMeters: beam?.wrapMeters,
        shrinkage: beam?.shrinkage,
        expectedFabricMeter: efmVal,
        fabricPanelWidth: fpw,
        outwardDate: outwardDate,
        sizingPlanId: outwardRow?.sizingPlanId ?? "",
        tradingCompanyId: selectedCompany != null ? Number(selectedCompany) : null,
        factoryCompanyId: effectiveFactoryCompanyId != null ? Number(effectiveFactoryCompanyId) : null,
      };
    });

    try {
      await dispatch(createBeamOutward(payloads) as any).unwrap();
      const selectedKeys = new Set(
        (outwardRow?.beamInwardBeamDetails || [])
          .map((b: any, i: number) => (outwardSelection[(b?.id ?? i)] ? (b?.id ?? i) : null))
          .filter((k: any) => k !== null)
      );
      setOutwardRow((prev: any) => {
        if (!prev) return prev;
        const updatedDetails = (prev.beamInwardBeamDetails || []).map((b: any, i: number) =>
          selectedKeys.has(b?.id ?? i) ? { ...b, isBeamOutwarded: 1 } : b
        );
        return { ...prev, beamInwardBeamDetails: updatedDetails };
      });
      setOutwardSelection({});
      await dispatch(getAllBeamInward(selectedCompany != null ? { companyId: selectedCompany, offset: getOffset(), limit: itemsPerPage } : { offset: getOffset(), limit: itemsPerPage }));
      const justOutwardedIds = (selectedBeams as any[]).map((b: any) => b.id).filter((id: any) => id !== undefined && id !== null);
      setLocalOutwardedIds(prev => new Set([...Array.from(prev), ...justOutwardedIds]));
      setIsOutwardModalOpen(false);
      setOutwardRow(null);
      setOutwardSelection({});
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div>
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Beam Inward Details"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search beam inward..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        virtualScroll={true}
        virtualScrollHeight="65vh"
        isShowPagination={false}
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
      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Beam Inward Details"
        className="max-w-4xl"
      >
        {currentBeamInward && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Beam Inward No</p>
                <p className="font-medium">{currentBeamInward.beamInwardNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sizing Vendor</p>
                <p className="font-medium">
                  {(() => {
                    const vendorArr: any[] = Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : (Array.isArray(vendorList) ? (vendorList as any) : []);
                    const v = vendorArr.find((c: any) => String(c.id) === String(currentBeamInward.sizingVendorId));
                    return v ? (v.vendorName || v.name) : (currentBeamInward.sizingVendorId ?? '-');
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Weaver</p>
                <p className="font-medium">
                  {(() => {
                    const vendorArr: any[] = Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : (Array.isArray(vendorList) ? (vendorList as any) : []);
                    const beams = currentBeamInward.beamInwardBeamDetails || [];
                    const names = Array.from(new Set(beams.map((b: any) => {
                      const vId = b?.weavingVendorId ?? b?.vendorId ?? b?.returnWeaverId;
                      const v = vendorArr.find((c: any) => String(c.id) === String(vId));
                      return v ? (v.vendorName || v.name) : (vId ? String(vId) : '');
                    }).filter(Boolean)));
                    return names.length ? names.join(', ') : '-';
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sizing Rate</p>
                <p className="font-medium">{currentBeamInward.sizingRate}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Payment Terms</p>
                <p className="font-medium">{currentBeamInward.paymentTermsId}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Remarks</p>
                <p className="font-medium">{currentBeamInward.remarks}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-lg mb-3">Quality Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Construction</th>
                      <th className="border p-2">Yarn ID</th>
                      <th className="border p-2">Sort Ends</th>
                      <th className="border p-2">Actual Ends</th>
                      <th className="border p-2">Parts</th>
                      <th className="border p-2">Ends Per Part</th>
                      <th className="border p-2">Wrap Meters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentBeamInward.beamInwardQualityDetails.map((quality, index) => (
                      <tr key={index}>
                        <td className="border p-2">{quality.quality}</td>
                        <td className="border p-2">{quality.yarnId}</td>
                        <td className="border p-2">{quality.sordEnds}</td>
                        <td className="border p-2">{quality.actualEnds}</td>
                        <td className="border p-2">{quality.parts}</td>
                        <td className="border p-2">{quality.endsPerPart}</td>
                        <td className="border p-2">{quality.wrapMeters}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-lg mb-3">Beam Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      {/* <th className="border p-2">Weaving Contract ID</th */}
                      <th className="border p-2">Weaving Contract ID</th>
                      <th className="border p-2">Sales Order ID</th>
                      <th className="border p-2">Sized Beam No</th>
                      <th className="border p-2">Wrap Meters</th>
                      <th className="border p-2">Shrinkage</th>
                      <th className="border p-2">Expected Fabric Meter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentBeamInward.beamInwardBeamDetails || [])
                      .filter((beam: any) => String(beam.isBeamOutwarded) !== "1" && !localOutwardedIds.has(beam.id))
                      .map((beam, index) => (
                        <tr key={index}>
                          <td className="border p-2">{beam.weavingContractId}</td>
                          <td className="border p-2">{beam.salesOrderId}</td>
                          <td className="border p-2">{beam.sizedBeamNo}</td>
                          <td className="border p-2">{beam.wrapMeters}</td>
                          <td className="border p-2">{beam.shrinkage}</td>
                          <td className="border p-2">{beam.expectedFabricMeter}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Beam Outward Modal */}
      <Modal
        isOpen={isOutwardModalOpen}
        onClose={() => setIsOutwardModalOpen(false)}
        title="Beam Outward"
        className="max-w-[60%]"
      >
        {outwardRow && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-secondary-500">Outward Date</p>
                <input
                  type="date"
                  value={outwardDate}
                  onChange={(e) => setOutwardDate(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <p className="text-sm text-secondary-500">Beam Inward No</p>
                <p className="font-medium">{outwardRow.beamInwardNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Total Beams</p>
                <p className="font-medium">{Object.values(outwardSelection).filter(Boolean).length}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Select</th>
                    <th className="border p-2">Sort No/Construction</th>
                    <th className="border p-2">Weaving Contract No</th>
                    <th className="border p-2">Weaver</th>
                    <th className="border p-2">Sales Order No</th>
                    <th className="border p-2">Sizing Plan No</th>
                    <th className="border p-2">Sized Beam No</th>
                    {/* <th className="border p-2">Empty Beam No</th> */}
                    <th className="border p-2">Fabric Panel/Width</th>
                    <th className="border p-2">Warp Meters</th>
                    <th className="border p-2">Shrinkage</th>
                    <th className="border p-2">Expected Fabric Meter</th>
                  </tr>
                </thead>
                <tbody>
                  {(outwardRow.beamInwardBeamDetails || [])
                    .filter((beam: any) => String(beam.isBeamOutwarded) !== "1" && !localOutwardedIds.has(beam.id))
                    .map((beam: any, idx: number) => {
                      const wcArr: any[] = Array.isArray((weavingContractList as any)?.data) ? (weavingContractList as any).data : (Array.isArray(weavingContractList) ? (weavingContractList as any) : []);
                      const soArr: any[] = Array.isArray((salesOrderList as any)?.data) ? (salesOrderList as any).data : (Array.isArray(salesOrderList) ? (salesOrderList as any) : []);
                      const vendorArr: any[] = Array.isArray((vendorList as any)?.data) ? (vendorList as any).data : (Array.isArray(vendorList) ? (vendorList as any) : []);
                      const spArr: any[] = Array.isArray((sizingPlanList as any)?.data) ? (sizingPlanList as any).data : (Array.isArray(sizingPlanList) ? (sizingPlanList as any) : []);
                      const wc = wcArr.find((w: any) => String(w.id) === String(beam.weavingContractId));
                      const so = soArr.find((s: any) => String(s.id) === String(beam.salesOrderId));
                      const weaverId = beam?.weavingVendorId ?? beam?.vendorId;
                      const weaver = vendorArr.find((s: any) => String(s.id) === String(weaverId));
                      const planId = beam?.sizingPlanId ?? outwardRow?.sizingPlanId;
                      const plan = spArr.find((p: any) => String(p.id) === String(planId));
                      const otRaw = outwardRow?.orderTypeId ?? plan?.orderTypeId;
                      const ot = String(otRaw ?? "");
                      const wcNo = wc?.weavingContractNo || wc?.contractNo || wc?.wcNo || wc?.contractNumber || wc?.weavingContractNumber || beam.weavingContractId;
                      const soNo = so?.salesOrderNo || so?.orderNo || so?.soNo || so?.salesOrderNumber || beam.salesOrderId;
                      const weaverName = weaver?.vendorName || '';
                      const spNo = plan?.sizingPlanNo || plan?.planNo || plan?.sizingPlanNumber || planId || "";
                      const planFPW = Number(plan?.sizingQualityDetails?.[0]?.fabricPanelWidth || 1) || 1;
                      const warp = Number(beam.wrapMeters || 0) || 0;
                      const shrink = Number(beam.shrinkage || 0) || 0;
                      const base = warp * planFPW;
                      const efmCalc = base - (base * (shrink / 100));
                      const showEfm = (beam.expectedFabricMeter != null && beam.expectedFabricMeter !== '') ? beam.expectedFabricMeter : (isNaN(efmCalc) ? '' : efmCalc.toFixed(2));
                      const key = beam?.id ?? idx;
                      return (
                        <tr key={key}>
                          <td className="border p-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!outwardSelection[key]}
                              onChange={(e) => handleCheckboxChange(key, e.target.checked)}
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="border p-2">
                            {(() => {
                              const beamFabricId = beam?.fabricId ?? beam?.fabricCodeId ?? beam?.itemId;
                              const wcFabricId = wc?.fabricId ?? wc?.fabricCodeId ?? wc?.itemId;
                              const fid = String(beamFabricId || wcFabricId || "");
                              
                              const fmArr: any[] = Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : (Array.isArray(fabricMasterList) ? (fabricMasterList as any) : []);
                              
                              // 1. Try to find in quality details by fabric ID
                              let uq = plan?.sizingQualityDetails?.find((q: any) => 
                                String(q?.fabricId || q?.fabricCodeId || "") === fid && fid !== ""
                              );
                              
                              // 2. If not found, try to find in quality details by yarnId (many beams are linked by yarn in sizing)
                              if (!uq && beam?.yarnId) {
                                uq = plan?.sizingQualityDetails?.find((q: any) => 
                                  String(q?.yarnId) === String(beam.yarnId)
                                );
                              }
                              
                              // 3. If still not found and we have a valid fid, try fabric master
                              if (!uq && fid !== "") {
                                const fm = fmArr.find((f: any) => String(f?.id) === fid || String(f?.fabricCodeId) === fid);
                                if (fm) return `${fm.fabricCode || ""} / ${fm.fabricQuality || fm.quality || fm.fabricName || ""}`;
                              }

                              if (uq) return `${uq.fabricCode || ""} / ${uq.quality || uq.fabricQuality || ""}`;
                              
                              // 4. Final fallback: if we have quality info in plan at all
                              if (plan?.sizingQualityDetails?.[0]) {
                                const q = plan.sizingQualityDetails[0];
                                return `${q.fabricCode || ""} / ${q.quality || q.fabricQuality || ""}`;
                              }
                              
                              return "";
                            })()}
                          </td>
                         
                          <td className="border p-2">{wcNo}</td>
                          <td className="border p-2">{weaverName}</td>
                          <td className="border p-2">{soNo}</td>
                          <td className="border p-2">{spNo}</td>
                          <td className="border p-2">{beam.sizedBeamNo}</td>
                          {/* <td className="border p-2">{beam.flangeNo || ''}</td> */}
                          <td className="border p-2">{planFPW}</td>
                          <td className="border p-2">{beam.wrapMeters}</td>
                          <td className="border p-2">{beam.shrinkage}</td>
                          <td className="border p-2">{showEfm}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {((outwardRow.beamInwardBeamDetails || []).filter((beam: any) => String(beam.isBeamOutwarded) !== "1" && !localOutwardedIds.has(beam.id)).length === 0) && (
              <div className="text-center py-4 text-gray-500">
                No beam details available for this inward.
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                onClick={() => setIsOutwardModalOpen(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleOutwardSubmit}
                className="btn btn-primary"
                disabled={Object.values(outwardSelection).every(val => !val)}
              >
                Process Outward
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete beam inward "{currentBeamInward?.beamInwardNo}"?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      {selectedAttachmentContainer && (
        <DocumentAttachmentModal
          isOpen={Boolean(selectedAttachmentContainer)}
          onClose={() => setSelectedAttachmentContainer(null)}
          containerName={selectedAttachmentContainer}
          title={attachmentModalTitle}
          onFilesUpdated={(newCount) => updateFileCount(selectedAttachmentContainer, newCount)}
        />
      )}
    </div>
  );
}



