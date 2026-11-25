// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { FileText, ShoppingCart, ClipboardList, Plus, Edit, Trash2, Save, ArrowLeft } from "lucide-react";
// import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useForm } from "react-hook-form";
// import { Checkbox } from "@/components/ui/checkbox";
// import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/state/store";
// import { useLocation, useNavigate } from "react-router-dom";
// import { getAllFabricMasterDetails } from "@/state/fabricMasterSlice";
// import { getAllVendors } from "@/state/vendorSlice";
// import { getAllFlanges } from "@/state/flangeSlice";
// import { getAllCities } from "@/state/citySlice";
// import { getAllStates } from "@/state/stateSlice";
// import { getAllCountries } from "@/state/countrySlice";
// import { getAllCompanies } from "@/state/company-master-slice";
// import { createEmptyBeamIssue, getAllEmptyBeamIssue, updateEmptyBeamIssue } from "@/state/emptyBeamIssueSlice";
// import { toast } from "react-toastify";
// import { createFlangeIssue, updateFlangeIssue } from "@/state/flangeIssueSlice";
// import { documentNumberService } from "@/services/DocumentNumberService";
// import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";

// const toArray = (value: any) => {
//   if (Array.isArray(value)) return value;
//   if (Array.isArray(value?.data)) return value.data;
//   if (Array.isArray(value?.rows)) return value.rows;
//   return [];
// };

// const normalizeText = (value: any) => String(value ?? "").trim().toLowerCase();

// type SelectOption = {
//   value: string;
//   label: string;
// };

// const ORDER_TYPE_OPTIONS: SelectOption[] = [
//   { value: "1", label: "Internal" },
//   { value: "2", label: "External" },
// ];

// interface flangeIssueFormData {
//   id?: number;
//   orderTypeId: string;
//   vendorId: string;
//   emptyBeamNo: string;
//   consigneeId: string;
//   vechileNo: string;
//   flangeIssueNo: string;
//   flangeIssueDate: string;
//   remarks?: string;
//   EmptyBeamIssueItem: EmptyBeamIssueItem[];
// }

// interface EmptyBeamIssueItem {
//   flangeId: string;
// }

// const FlangeIssue = () => {
//   const [items, setItems]: any = useState([]);
//   const [newItem, setNewItem] = useState<EmptyBeamIssueItem>({
//     flangeId: ""
//   });
//   const [editingIndex, setEditingIndex]: any = useState(null);
//   const { vendorList } = useSelector((state: RootState) => state.vendor);
//   const { flangeList } = useSelector((state: RootState) => state.flange)
//   const { cityList } = useSelector((state: RootState) => state.city);
//   const { stateList } = useSelector((state: RootState) => state.state);
//   const { countryList } = useSelector((state: RootState) => state.country);
//   const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
//   const dispatch = useDispatch<AppDispatch>();
//   // const { register, handleSubmit, reset, formState: { errors } } = useForm<flangeIssueFormData>();
//   const location = useLocation();
//   const emptyBeamIssuedetail = location.state?.emptyBeamIssuedetail;
//   const navigate = useNavigate();
//   console.log("salesOrderdetail from location state:", emptyBeamIssuedetail);
//   const [flangeIdError, setFlangeIdError] = useState("");
//   const [isItemsValid, setIsItemsValid] = useState(false);
//   const [removedFlangeIds, setRemovedFlangeIds] = useState<number[]>([]);
//   const isSavingRef = useRef(false);
//   const hasGeneratedNumberRef = useRef(false);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     watch,
//     setValue,
//     formState: { errors, isValid } // Add isValid here
//   } = useForm<flangeIssueFormData>({
//     mode: 'onBlur',
//     reValidateMode: 'onBlur',
//     defaultValues: {
//       orderTypeId: "",
//       vendorId: "",
//       flangeIssueDate: new Date().toISOString().slice(0, 10),
//       remarks: "",
//     },
//   });

//   useEffect(() => {
//     setValue('flangeIssueNo', emptyBeamIssuedetail?.flangeIssueNo || '');
//   }, [emptyBeamIssuedetail, setValue]);

//   // Generate document number for new beam inward entries
//   useEffect(() => {
//     const generateDocumentNumber = async () => {
//       // Only generate for new entries (not editing existing ones)
//       if (emptyBeamIssuedetail || hasGeneratedNumberRef.current) {
//         return;
//       }

//       try {
//         const result = await documentNumberService.generateDocumentNumber({
//           screenName: 'Empty Beam Issue'
//         });

//         setValue('flangeIssueNo', result.documentNumber, { shouldValidate: true });
//         hasGeneratedNumberRef.current = true;
//       } catch (error) {
//         console.error('Failed to generate flange issue number:', error);
//         toast.error('Failed to generate flange issue number');
//       }
//     };

//     generateDocumentNumber();
//   }, [emptyBeamIssuedetail, setValue]);

//   // Cleanup document number cache if not saved
//   useEffect(() => {
//     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//       if (hasGeneratedNumberRef.current && !isSavingRef.current && !emptyBeamIssuedetail) {
//         documentNumberService.clearMemoryCache('Empty Beam Issue');
//       }
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//       if (hasGeneratedNumberRef.current && !isSavingRef.current && !emptyBeamIssuedetail) {
//         documentNumberService.clearMemoryCache('Empty Beam Issue');
//       }
//     };
//   }, [emptyBeamIssuedetail]);

//   // Selected company from localStorage
//   const selectedCompanyId = useMemo(() => {
//     const directId = localStorage.getItem('selectedCompanyId');
//     if (directId) {
//       const num = Number(directId);
//       if (Number.isFinite(num)) return num;
//       try {
//         const parsed = JSON.parse(directId);
//         const fromParsed = Number(parsed?.id ?? parsed?.companyId);
//         if (Number.isFinite(fromParsed)) return fromParsed;
//       } catch { }
//     }
//     const stored = localStorage.getItem('selectedCompany');
//     if (stored) {
//       const num = Number(stored);
//       if (Number.isFinite(num)) return num;
//       try {
//         const parsed = JSON.parse(stored);
//         const fromParsed = Number(parsed?.id ?? parsed?.companyId);
//         if (Number.isFinite(fromParsed)) return fromParsed;
//       } catch { }
//     }
//     return 0;
//   }, []);


//   // Update filteredFlangeList (around line 163)
//   const filteredFlangeList = useMemo(() => {
//     if (!Array.isArray(flangeList)) return [];
//     const removedSet = new Set(removedFlangeIds);
//     return flangeList.filter((f: any) => {
//       if (Number(f.companyId) !== selectedCompanyId) return false;
//       // Common condition: Only active records
//       if (f.isActive === false || f.isActive === 0) return false;

//       const idNum = Number(f?.id);
//       if (!Number.isFinite(idNum)) return false;
//       const isRemoved = removedSet.has(idNum);
//       const isUnissued = Number(f?.isIssued) === 0;
//       return isRemoved || isUnissued;
//     });
//   }, [flangeList, selectedCompanyId, removedFlangeIds]);

//   const companies = useMemo(() => toArray(companyMasterList), [companyMasterList]);
//   const loggedCompany = useMemo(() => {
//     if (!selectedCompanyId) return null;
//     return companies.find((company: any) => Number(company?.id) === selectedCompanyId) || null;
//   }, [companies, selectedCompanyId]);
//   const loggedCompanyName = loggedCompany?.companyName || loggedCompany?.name || loggedCompany?.customerName || "";

//   const [selectedFlangeIds, setSelectedFlangeIds] = useState<Set<number>>(new Set());

//   useEffect(() => {
//     const ids = new Set<number>();
//     items?.forEach((it: any, idx: number) => {
//       if (editingIndex !== null && idx === editingIndex) return;
//       const idNum = Number(it?.flangeId);
//       if (Number.isFinite(idNum)) {
//         ids.add(idNum);
//       }
//     });
//     setSelectedFlangeIds(ids);
//   }, [items, editingIndex]);

//   const dropdownFlangeList = useMemo(() => {
//     return filteredFlangeList.filter((flange: any) => {
//       const idNum = Number(flange?.id);
//       if (!Number.isFinite(idNum)) return false;
//       return !selectedFlangeIds.has(idNum);
//     });
//   }, [filteredFlangeList, selectedFlangeIds]);

//   const flangeSelectOptions = useMemo(() => {
//     return dropdownFlangeList
//       .map((flange: any) => ({
//         value: String(flange.id),
//         label: flange.flangeNo || `Flange ${flange.id}`,
//       }));
//   }, [dropdownFlangeList]);

//   // Helpers to resolve names by IDs (same pattern as sales-order)
//   const getCityName = (cityId: string, list: any[]) => {
//     if (!cityId || !Array.isArray(list)) return '';
//     const c = list.find((x: any) => x.id?.toString() === cityId?.toString() || x.id === parseInt(String(cityId)));
//     return c ? c.cityName : '';
//   };
//   const getStateName = (stateId: string, list: any[]) => {
//     if (!stateId || !Array.isArray(list)) return '';
//     const s = list.find((x: any) => x.id?.toString() === stateId?.toString() || x.id === parseInt(String(stateId)));
//     return s ? s.stateName : '';
//   };
//   const getCountryName = (countryId: string, list: any[]) => {
//     if (!countryId || !Array.isArray(list)) return '';
//     const c = list.find((x: any) => x.id?.toString() === countryId?.toString() || x.id === parseInt(String(countryId)));
//     return c ? c.countryName : '';
//   };

//   const formatCompleteAddress = (address: any) => {
//     if (!address) return '';
//     const parts: string[] = [];
//     if (address.line1 && String(address.line1).trim()) parts.push(String(address.line1).trim());
//     if (address.line2 && String(address.line2).trim()) parts.push(String(address.line2).trim());

//     const cityName = getCityName(address.cityId, cityList);
//     const stateName = getStateName(address.stateId, stateList);
//     const countryName = getCountryName(address.countryId, countryList);

//     const locationParts: string[] = [];
//     if (cityName) locationParts.push(cityName);
//     if (stateName) locationParts.push(stateName);
//     if (countryName) locationParts.push(countryName);
//     if (locationParts.length) parts.push(locationParts.join(', '));

//     if (address.pinCode) {
//       const pin = String(address.pinCode).trim();
//       if (pin) parts.push(`PIN: ${pin}`);
//     }

//     return parts.join(', ');
//   };



//   const loggedCompanyAddress = useMemo(() => {
//     if (!loggedCompany) return "";
//     const addressArray = Array.isArray(loggedCompany.address)
//       ? loggedCompany.address
//       : Array.isArray(loggedCompany.addresses)
//         ? loggedCompany.addresses
//         : [];
//     const primaryAddress = addressArray.length
//       ? addressArray.find((addr: any) => addr.isDefault) || addressArray[0]
//       : loggedCompany.address || null;
//     return primaryAddress ? formatCompleteAddress(primaryAddress) : "";
//   }, [loggedCompany, cityList, stateList, countryList]);

//   // Watch selected values to derive addresses
//   const orderTypeField = register("orderTypeId", { required: "Order Type is required" });
//   const vendorField = register("vendorId", { required: "Vendor is required" });

//   const orderTypeWatch = watch('orderTypeId');
//   const selectedVendorId = watch('vendorId');

//   const normalizedVendors = useMemo(() => toArray(vendorList), [vendorList]);


//   // Update filteredVendors (around line 270)
//   const filteredVendors = useMemo(() => {
//     if (!normalizedVendors.length) return [];
//     // Common condition: Filter active vendors first
//     const activeVendors = normalizedVendors.filter((v: any) => v.isActive !== false && v.isActive !== 0);

//     if (!orderTypeWatch) return activeVendors;
//     const isInternal = Number(orderTypeWatch) === 1;
//     return activeVendors.filter((vendor: any) => Number(vendor?.isInternalVendor) === (isInternal ? 1 : 0));
//   }, [normalizedVendors, orderTypeWatch]);

//   const vendorOptions = useMemo<SelectOption[]>(() => {
//     return filteredVendors
//       .map((vendor: any) => ({
//         value: String(vendor.id),
//         label: vendor.vendorName || vendor.name || `Vendor ${vendor.id}`,
//       }))
//       .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
//   }, [filteredVendors]);

//   const handleOrderTypeSelect = () => {
//     setValue("vendorId", "", { shouldValidate: true });
//     setVendorAddress("");
//   };

//   const selectedVendor = useMemo(() => {
//     if (!selectedVendorId) return null;
//     return normalizedVendors.find((vendor: any) => String(vendor.id) === String(selectedVendorId)) || null;
//   }, [selectedVendorId, normalizedVendors]);

//   const issuedCompanyId = useMemo(() => {
//     if (!selectedVendor) return null;
//     const vendorName = normalizeText(selectedVendor.vendorName || selectedVendor.name);
//     if (!vendorName) return null;
//     const matchedCompany = companies.find((company: any) => normalizeText(company.companyName || company.name || company.customerName) === vendorName);
//     return matchedCompany?.id ? Number(matchedCompany.id) : null;
//   }, [selectedVendor, companies]);

//   const resolvedOrderTypeId = useMemo(() => {
//     if (orderTypeWatch) {
//       const parsed = Number(orderTypeWatch);
//       return Number.isFinite(parsed) ? parsed : null;
//     }
//     if (emptyBeamIssuedetail?.orderTypeId != null) {
//       const parsed = Number(emptyBeamIssuedetail.orderTypeId);
//       return Number.isFinite(parsed) ? parsed : null;
//     }
//     if (emptyBeamIssuedetail?.issuedToInternal != null) {
//       return emptyBeamIssuedetail.issuedToInternal ? 1 : 2;
//     }
//     return null;
//   }, [orderTypeWatch, emptyBeamIssuedetail]);

//   const issuedToInternal = resolvedOrderTypeId === 1;

//   const isFormValid = isValid &&
//     resolvedOrderTypeId != null &&
//     items.length > 0 &&
//     items.every((item: any) => item.flangeId);

//   // Local formatted address states
//   const [vendorAddress, setVendorAddress] = useState<string>('');

//   useEffect(() => {
//     const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//     if (storedCompanyId) {
//       dispatch(getAllVendors({}));
//       dispatch(getAllFlanges({ companyId: Number(storedCompanyId) }));
//       dispatch(getAllCities({}));
//       dispatch(getAllStates({}));
//       dispatch(getAllCountries({}));
//       dispatch(getAllCompanies({} as any));
//     }
//   }, [dispatch]);


//   useEffect(() => {
//     if (loggedCompany?.id) {
//       setValue('consigneeId', String(loggedCompany.id), { shouldDirty: false, shouldValidate: true });
//     }
//   }, [loggedCompany, setValue]);

//   useEffect(() => {
//     if (emptyBeamIssuedetail) {
//       reset({
//         // emptyBeamNo: emptyBeamIssuedetail.emptyBeamNo || "",
//         orderTypeId: emptyBeamIssuedetail.orderTypeId != null
//           ? String(emptyBeamIssuedetail.orderTypeId)
//           : emptyBeamIssuedetail.issuedToInternal != null
//             ? (emptyBeamIssuedetail.issuedToInternal ? "1" : "2")
//             : "",
//         flangeIssueDate: emptyBeamIssuedetail.flangeIssueDate
//           ? emptyBeamIssuedetail.flangeIssueDate.slice(0, 10)
//           : "",
//         vendorId: emptyBeamIssuedetail.vendorId
//           ? emptyBeamIssuedetail.vendorId
//           : "",
//         consigneeId: emptyBeamIssuedetail.consigneeId
//           ? emptyBeamIssuedetail.consigneeId
//           : "",
//         vechileNo: emptyBeamIssuedetail.vechileNo || "",
//         remarks: emptyBeamIssuedetail.remarks || "",
//       });

//       // Prefill Vendor/Consignee addresses on edit
//       try {
//         const v = vendorList.find((x: any) => x.id === emptyBeamIssuedetail.vendorId);
//         setVendorAddress(v?.address ? formatCompleteAddress(v.address) : '');
//       } catch { }

//       // Handle items array
//       if (Array.isArray(emptyBeamIssuedetail.items) && emptyBeamIssuedetail.items.length > 0) {
//         setItems(emptyBeamIssuedetail.items.map((item: any) => ({
//           flangeId: item.flangeId ? String(item.flangeId) : "",
//         })));
//       } else {
//         setItems([]);
//       }
//     } else {
//       setItems([]);
//     }
//   }, [emptyBeamIssuedetail, reset, vendorList]);

//   const addItem = () => {
//     if (!newItem.flangeId) {
//       setFlangeIdError("Flange is required");
//       setIsItemsValid(false);
//       return;
//     }
//     // Add other required field validations as needed
//     setIsItemsValid(true);
//     setFlangeIdError("");

//     if (emptyBeamIssuedetail?.id) {
//       const flangeIdNumber = Number(newItem.flangeId);
//       if (Number.isFinite(flangeIdNumber)) {
//         setRemovedFlangeIds((prev) => prev.filter((id) => id !== flangeIdNumber));
//       }
//     }
//     if (editingIndex !== null) {
//       const updatedItems = [...items];
//       updatedItems[editingIndex] = newItem;
//       setItems(updatedItems);
//       setEditingIndex(null);
//     } else {
//       setItems([...items, newItem]);
//     }
//     console.log(items)
//     setNewItem({
//       flangeId: "",
//     });
//   };

//   const editItem = (index: any) => {
//     setNewItem(items[index]);
//     setEditingIndex(index);
//   };

//   const deleteItem = (index: any) => {
//     const item = items[index];
//     const flangeIdNumber = Number(item?.flangeId);
//     if (emptyBeamIssuedetail?.id && Number.isFinite(flangeIdNumber)) {
//       setRemovedFlangeIds((prev) => {
//         if (prev.includes(flangeIdNumber)) return prev;
//         return [...prev, flangeIdNumber];
//       });
//     }
//     setItems((prev: any[]) => prev.filter((_: any, i: any) => i !== index));
//     setNewItem({ flangeId: "" });
//     if (editingIndex === index) {
//       setEditingIndex(null);
//     }
//   };

//   // Update address display when Vendor changes
//   useEffect(() => {
//     if (selectedVendor?.address) {
//       setVendorAddress(formatCompleteAddress(selectedVendor.address));
//     } else {
//       setVendorAddress('');
//     }
//   }, [selectedVendor, cityList, stateList, countryList]);


//   const onSubmit = async (data: flangeIssueFormData) => {
//     const isEditMode = Boolean(emptyBeamIssuedetail?.id);
//     let resolvedFlangeIssueNo = data?.flangeIssueNo || emptyBeamIssuedetail?.flangeIssueNo || "";
//     if (!emptyBeamIssuedetail?.id && !resolvedFlangeIssueNo) {
//       try {
//         const docResponse = await documentNumberService.generateDocumentNumber({
//           screenName: 'Empty Beam Issue'
//         });
//         resolvedFlangeIssueNo = docResponse.documentNumber;
//       } catch (error) {
//         console.warn("Failed to generate document number:", error);
//       }
//     }

//     if (!resolvedFlangeIssueNo) {
//       toast.error("Flange issue number is missing. Please try again.");
//       return;
//     }

//     if (!resolvedOrderTypeId) {
//       toast.error("Select Order Type");
//       return;
//     }
//     // Prepare the complete payload including emptyBeamNo
//     const resolvedConsigneeId = loggedCompany?.id ?? (data.consigneeId ? parseInt(String(data.consigneeId)) : null);
//     isSavingRef.current = true;
//     const basePayload = {
//       id: emptyBeamIssuedetail?.id || 0, // Include ID for update, default to 0 for create
//       orderTypeId: resolvedOrderTypeId,
//       flangeIssueNo: resolvedFlangeIssueNo,
//       emptyBeamNo: emptyBeamIssuedetail?.emptyBeamNo || resolvedFlangeIssueNo,
//       flangeIssueDate: new Date(data.flangeIssueDate).toISOString(),
//       vechileNo: data.vechileNo,
//       vendorId: parseInt(data.vendorId),
//       consigneeId: resolvedConsigneeId ?? null,
//       companyId: selectedCompanyId,
//       issuedCompanyId: issuedToInternal ? (issuedCompanyId ?? null) : null,
//       issuedToInternal,
//       remarks: data.remarks || "",
//       items: items.map((item: any) => ({
//         flangeId: parseInt(item.flangeId) // Ensure flangeId is a number
//       }))
//     };

//     try {
//       if (isEditMode) {
//         const updatePayload = {
//           ...basePayload,
//           removedFlangeIds,
//         };
//         dispatch(updateFlangeIssue(updatePayload))
//           .then(() => {
//             reset();
//             navigate("/transaction/flange-management", { state: { tab: "emptyBeam" } });
//           });
//       } else {
//         const { id, ...createPayload } = basePayload;
//         await dispatch(createFlangeIssue(createPayload)).unwrap();
//         documentNumberService.clearMemoryCache('Empty Beam Issue');
//       }
//       navigate("/transaction/flange-management");
//     } catch (err) {
//       console.error("Operation failed:", err);
//     }
//   };


//   return (
//     <div className="p-6 pt-16">
//       <div className=" p-6 bg-white shadow-md rounded-lg">
//         {/* Title & Save Button */}
//         <div className="flex justify-between items-center border-b pb-4">

//           <div className="flex items-center space-x-4">                                         <Button
//             variant="outline"
//             onClick={() => navigate("/transaction/flange-management")}
//             className="mr-auto"
//           >
//             <ArrowLeft size={18} className="mr-2" />
//             Back
//           </Button>
//             <h2 className="text-2xl font-semibold">Empty Beam Issue</h2>
//           </div>
//           <Button
//             onClick={handleSubmit(onSubmit)}
//             className="bg-primary hover:bg-primary text-white px-6 flex items-center"
//             disabled={!isFormValid}
//           >
//             <Save size={18} className="mr-2" />
//             {emptyBeamIssuedetail?.id ? "Update Empty Beam Issue" : "Save Empty Beam Issue"}
//           </Button>
//         </div>
//         <div className="space-y-6">
//           {/* Tab Navigation */}
//           <div className="mb-8">
//           </div>

//           {/* Vendor Details */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2 ">
//                 <FileText size={20} /> Vendor Details
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="grid grid-cols-4 gap-8">
//               <div>


//               <label className="block text-sm mb-1">Empty Beam Issue No</label>

//               <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"

//                 {...register('flangeIssueNo')} readOnly />

//             </div>
//             <div>
//               <label className="block text-sm font-medium text-secondary-700">Order Type <span className="text-red-600">*</span></label>
//               <CommonSearchableSelect
//                 className="mt-1"
//                 placeholder="Select Order Type"
//                 options={ORDER_TYPE_OPTIONS}
//                 value={orderTypeWatch || ""}
//                 {...orderTypeField}
//                 onValueChange={(value) => {
//                   setValue('orderTypeId', value, { shouldValidate: true });
//                   handleOrderTypeSelect();
//                 }}
//                 error={errors.orderTypeId?.message as string}
//               />
            
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-secondary-700">Sizing Vendor Name <span className="text-red-600">*</span> </label>
//               <CommonSearchableSelect
//                 className="mt-1"
//                 placeholder="Select a Sizing Vendor"
//                 options={vendorOptions}
//                 value={selectedVendorId || ""}
//                 {...vendorField}
//                 onValueChange={(value) => setValue('vendorId', value, { shouldValidate: true })}
//                 disabled={!orderTypeWatch}
//                 error={errors.vendorId?.message as string}
//               />
           
//               {vendorAddress ? (
//                 <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
//                   <h2 className="font-bold text-[16px] mb-2">Vendor Address</h2>
//                   <p className="text-sm"><strong>Address:</strong> {vendorAddress}</p>
//                 </div>
//               ) : null}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-secondary-700">Weaver <span className="text-red-600">*</span> </label>
//               <input className="input mt-1 bg-gray-100" value={loggedCompanyName || ""} readOnly placeholder="Company not available" />
//               <input type="hidden" {...register("consigneeId", { required: "Delivey Address is required" })} />
//               {errors.consigneeId && (
//                 <p className="mt-1 text-sm text-red-600">{errors.consigneeId.message}</p>
//               )}
//               {/* {loggedCompanyAddress ? (
//                 <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
//                   <h2 className="font-bold text-[16px] mb-2">Weaver Address</h2>
//                   <p className="text-sm"><strong>Address:</strong> {loggedCompanyAddress}</p>
//                 </div>
//               ) : null} */}
//               </div>
//               <div>
//               <label className="block text-sm font-medium text-secondary-700">Vehicle No <span className="text-red-600">*</span> </label>
//               <input
//                 {...register('vechileNo', { required: 'Vehicle No is required' })}
//                 className="input mt-1" placeholder="Enter Vehicle No"
//               />
//               {errors.vechileNo && (
//                 <p className="mt-1 text-sm text-red-600">{errors.vechileNo.message}</p>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-secondary-700">Empty Beam Issue Date <span className="text-red-600">*</span> </label>
//               <input
//                 {...register('flangeIssueDate', { required: 'Date is required' })}
//                 className="input mt-1" type="date"
//               />
//               {errors.flangeIssueDate && (
//                 <p className="mt-1 text-sm text-red-600">{errors.flangeIssueDate.message}</p>
//               )}
//             </div>
//               <div>
//                 <label className="block text-sm font-medium text-secondary-700">Remarks</label>
//                 <textarea
//                   {...register('remarks')}
//                   className="input mt-1 min-h-[90px]"
//                   placeholder="Enter remarks"
//                 />
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <ShoppingCart size={20} /> Flange Details
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-4 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-secondary-700">Select Empty Beam No</label>
//                   <CommonSearchableSelect
//                     value={newItem.flangeId}
//                     onValueChange={(val) =>
//                       setNewItem({ ...newItem, flangeId: val })
//                     }
//                     placeholder="Select Empty Beam No"
//                     className="mt-1"
//                     error={!!flangeIdError}
//                   >
//                     {dropdownFlangeList?.map((flange: any) => (
//                       <option key={flange.id} value={flange.id}>
//                         {flange.flangeNo}
//                       </option>
//                     ))}
//                   </CommonSearchableSelect>

//                   {flangeIdError && <p className="mt-1 text-sm text-red-600">{flangeIdError}</p>}
//                 </div>
//               </div>
//               <Button onClick={addItem} className="mt-4 ml-auto flex items-center">
//                 <Plus size={18} className="mr-2" />
//                 {editingIndex !== null ? "Update Item" : "Add Item"}
//               </Button>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <ClipboardList size={20} /> Item Summary
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <table className="w-full border-collapse border border-gray-300 text-center">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="border p-2">Sl.No</th>
//                     <th className="border p-2">Empty Beam No</th>
//                     <th className="border p-2">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {items.map((item: any, index: any) => (
//                     <tr key={index} className="border">
//                       <td className="border p-2">{index + 1}</td>
//                       {/* <td className="border p-2">{item.flangeId}</td> */}
//                       <td className="border p-2">
//                         {(() => {
//                           const idNum = Number(item.flangeId);
//                           const f = Array.isArray(flangeList) ? flangeList.find((fl: any) => Number(fl.id) === idNum) : null;
//                           return f?.flangeNo || 'N/A';
//                         })()}
//                       </td>
//                       <td className="border p-2">
//                         <button onClick={() => editItem(index)} className="mr-2 text-blue-500">
//                           <Edit size={18} />
//                         </button>
//                         <button onClick={() => deleteItem(index)} className="text-red-500">
//                           <Trash2 size={18} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FlangeIssue;
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, ShoppingCart, ClipboardList, Plus, Edit, Trash2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllFabricMasterDetails } from "@/state/fabricMasterSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { getAllCities } from "@/state/citySlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCountries } from "@/state/countrySlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { createEmptyBeamIssue, getAllEmptyBeamIssue, updateEmptyBeamIssue } from "@/state/emptyBeamIssueSlice";
import { toast } from "react-toastify";
import { createFlangeIssue, updateFlangeIssue } from "@/state/flangeIssueSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { VENDOR_TYPE_ALL, filterVendorsByTypeIds, resolveVendorTypeId } from "@/utils/vendorFilters";

const toArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
};

const normalizeText = (value: any) => String(value ?? "").trim().toLowerCase();

type SelectOption = {
  value: string;
  label: string;
};

const ORDER_TYPE_OPTIONS: SelectOption[] = [
  { value: "1", label: "Internal" },
  { value: "2", label: "External" },
];

const SIZING_VENDOR_TYPE_ID = 302;
const SIZING_VENDOR_TYPE_IDS = [SIZING_VENDOR_TYPE_ID, VENDOR_TYPE_ALL];

interface flangeIssueFormData {
  id?: number;
  orderTypeId: string;
  vendorId: string;
  emptyBeamNo: string;
  consigneeId: string;
  vechileNo: string;
  flangeIssueNo: string;
  flangeIssueDate: string;
  remarks?: string;
  EmptyBeamIssueItem: EmptyBeamIssueItem[];
}

interface EmptyBeamIssueItem {
  flangeId: string;
}

const FlangeIssue = () => {
  const [items, setItems]: any = useState([]);
  const [newItem, setNewItem] = useState<EmptyBeamIssueItem>({
    flangeId: ""
  });
  const [editingIndex, setEditingIndex]: any = useState(null);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { flangeList } = useSelector((state: RootState) => state.flange)
  const { cityList } = useSelector((state: RootState) => state.city);
  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const dispatch = useDispatch<AppDispatch>();
  // const { register, handleSubmit, reset, formState: { errors } } = useForm<flangeIssueFormData>();
  const location = useLocation();
  const emptyBeamIssuedetail = location.state?.emptyBeamIssuedetail;
  const navigate = useNavigate();
  console.log("salesOrderdetail from location state:", emptyBeamIssuedetail);
  const [flangeIdError, setFlangeIdError] = useState("");
  const [isItemsValid, setIsItemsValid] = useState(false);
  const [removedFlangeIds, setRemovedFlangeIds] = useState<number[]>([]);
  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid } // Add isValid here
  } = useForm<flangeIssueFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      orderTypeId: "",
      vendorId: "",
      flangeIssueDate: new Date().toISOString().slice(0, 10),
      remarks: "",
    },
  });

  useEffect(() => {
    setValue('flangeIssueNo', emptyBeamIssuedetail?.flangeIssueNo || '');
  }, [emptyBeamIssuedetail, setValue]);

  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      // Only generate for new entries (not editing existing ones)
      if (emptyBeamIssuedetail || hasGeneratedNumberRef.current) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Empty Beam Issue'
        });

        setValue('flangeIssueNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate flange issue number:', error);
        toast.error('Failed to generate flange issue number');
      }
    };

    generateDocumentNumber();
  }, [emptyBeamIssuedetail, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !emptyBeamIssuedetail) {
        documentNumberService.clearMemoryCache('Empty Beam Issue');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !emptyBeamIssuedetail) {
        documentNumberService.clearMemoryCache('Empty Beam Issue');
      }
    };
  }, [emptyBeamIssuedetail]);

  // Selected company from localStorage
  const selectedCompanyId = useMemo(() => {
    const directId = localStorage.getItem('selectedCompanyId');
    if (directId) {
      const num = Number(directId);
      if (Number.isFinite(num)) return num;
      try {
        const parsed = JSON.parse(directId);
        const fromParsed = Number(parsed?.id ?? parsed?.companyId);
        if (Number.isFinite(fromParsed)) return fromParsed;
      } catch { }
    }
    const stored = localStorage.getItem('selectedCompany');
    if (stored) {
      const num = Number(stored);
      if (Number.isFinite(num)) return num;
      try {
        const parsed = JSON.parse(stored);
        const fromParsed = Number(parsed?.id ?? parsed?.companyId);
        if (Number.isFinite(fromParsed)) return fromParsed;
      } catch { }
    }
    return 0;
  }, []);


  // Update filteredFlangeList (around line 163)
  const filteredFlangeList = useMemo(() => {
    if (!Array.isArray(flangeList)) return [];
    const removedSet = new Set(removedFlangeIds);
    return flangeList.filter((f: any) => {
      if (Number(f.companyId) !== selectedCompanyId) return false;
      // Common condition: Only active records
      if (f.isActive === false || f.isActive === 0) return false;

      const idNum = Number(f?.id);
      if (!Number.isFinite(idNum)) return false;
      const isRemoved = removedSet.has(idNum);
      const isUnissued = Number(f?.isIssued) === 0;
      return isRemoved || isUnissued;
    });
  }, [flangeList, selectedCompanyId, removedFlangeIds]);

  const companies = useMemo(() => toArray(companyMasterList), [companyMasterList]);
  const loggedCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return companies.find((company: any) => Number(company?.id) === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);
  const loggedCompanyName = loggedCompany?.companyName || loggedCompany?.name || loggedCompany?.customerName || "";

  const [selectedFlangeIds, setSelectedFlangeIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const ids = new Set<number>();
    items?.forEach((it: any, idx: number) => {
      if (editingIndex !== null && idx === editingIndex) return;
      const idNum = Number(it?.flangeId);
      if (Number.isFinite(idNum)) {
        ids.add(idNum);
      }
    });
    setSelectedFlangeIds(ids);
  }, [items, editingIndex]);

  const dropdownFlangeList = useMemo(() => {
    return filteredFlangeList.filter((flange: any) => {
      const idNum = Number(flange?.id);
      if (!Number.isFinite(idNum)) return false;
      return !selectedFlangeIds.has(idNum);
    });
  }, [filteredFlangeList, selectedFlangeIds]);

  const flangeSelectOptions = useMemo(() => {
    return dropdownFlangeList
      .map((flange: any) => ({
        value: String(flange.id),
        label: flange.flangeNo || `Flange ${flange.id}`,
      }));
  }, [dropdownFlangeList]);

  // Helpers to resolve names by IDs (same pattern as sales-order)
  const getCityName = (cityId: string, list: any[]) => {
    if (!cityId || !Array.isArray(list)) return '';
    const c = list.find((x: any) => x.id?.toString() === cityId?.toString() || x.id === parseInt(String(cityId)));
    return c ? c.cityName : '';
  };
  const getStateName = (stateId: string, list: any[]) => {
    if (!stateId || !Array.isArray(list)) return '';
    const s = list.find((x: any) => x.id?.toString() === stateId?.toString() || x.id === parseInt(String(stateId)));
    return s ? s.stateName : '';
  };
  const getCountryName = (countryId: string, list: any[]) => {
    if (!countryId || !Array.isArray(list)) return '';
    const c = list.find((x: any) => x.id?.toString() === countryId?.toString() || x.id === parseInt(String(countryId)));
    return c ? c.countryName : '';
  };

  const formatCompleteAddress = (address: any) => {
    if (!address) return '';
    const parts: string[] = [];
    if (address.line1 && String(address.line1).trim()) parts.push(String(address.line1).trim());
    if (address.line2 && String(address.line2).trim()) parts.push(String(address.line2).trim());

    const cityName = getCityName(address.cityId, cityList);
    const stateName = getStateName(address.stateId, stateList);
    const countryName = getCountryName(address.countryId, countryList);

    const locationParts: string[] = [];
    if (cityName) locationParts.push(cityName);
    if (stateName) locationParts.push(stateName);
    if (countryName) locationParts.push(countryName);
    if (locationParts.length) parts.push(locationParts.join(', '));

    if (address.pinCode) {
      const pin = String(address.pinCode).trim();
      if (pin) parts.push(`PIN: ${pin}`);
    }

    return parts.join(', ');
  };



  const loggedCompanyAddress = useMemo(() => {
    if (!loggedCompany) return "";
    const addressArray = Array.isArray(loggedCompany.address)
      ? loggedCompany.address
      : Array.isArray(loggedCompany.addresses)
        ? loggedCompany.addresses
        : [];
    const primaryAddress = addressArray.length
      ? addressArray.find((addr: any) => addr.isDefault) || addressArray[0]
      : loggedCompany.address || null;
    return primaryAddress ? formatCompleteAddress(primaryAddress) : "";
  }, [loggedCompany, cityList, stateList, countryList]);

  // Watch selected values to derive addresses
  const orderTypeField = register("orderTypeId", { required: "Order Type is required" });
  const vendorField = register("vendorId", { required: "Vendor is required" });

  const orderTypeWatch = watch('orderTypeId');
  const selectedVendorId = watch('vendorId');

  const normalizedVendors = useMemo(() => toArray(vendorList), [vendorList]);


  // Update filteredVendors (around line 270)
  const filteredVendors = useMemo(() => {
    if (!normalizedVendors.length) return [];
    // Common condition: Filter active vendors first
    const activeVendors = normalizedVendors.filter((v: any) => v.isActive !== false && v.isActive !== 0);

    if (!orderTypeWatch) return activeVendors;
    const isInternal = Number(orderTypeWatch) === 1;
    
    if (isInternal) {
      // For Internal orders: show only vendors with vendorType All (307) and Sizing Jobwork (302)
      const sizingVendors = filterVendorsByTypeIds(activeVendors, SIZING_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null });
      // Also filter by isInternalVendor = 1
      return sizingVendors.filter((vendor: any) => Number(vendor?.isInternalVendor) === 1);
    } else {
      // For External orders: keep existing logic
      return activeVendors.filter((vendor: any) => Number(vendor?.isInternalVendor) === 0);
    }
  }, [normalizedVendors, orderTypeWatch]);

  const vendorOptions = useMemo<SelectOption[]>(() => {
    return filteredVendors
      .map((vendor: any) => ({
        value: String(vendor.id),
        label: vendor.vendorName || vendor.name || `Vendor ${vendor.id}`,
      }))
      .sort((a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label));
  }, [filteredVendors]);

  const handleOrderTypeSelect = () => {
    setValue("vendorId", "", { shouldValidate: true });
    setVendorAddress("");
  };

  const selectedVendor = useMemo(() => {
    if (!selectedVendorId) return null;
    return normalizedVendors.find((vendor: any) => String(vendor.id) === String(selectedVendorId)) || null;
  }, [selectedVendorId, normalizedVendors]);

  const issuedCompanyId = useMemo(() => {
    if (!selectedVendor) return null;
    const vendorName = normalizeText(selectedVendor.vendorName || selectedVendor.name);
    if (!vendorName) return null;
    const matchedCompany = companies.find((company: any) => normalizeText(company.companyName || company.name || company.customerName) === vendorName);
    return matchedCompany?.id ? Number(matchedCompany.id) : null;
  }, [selectedVendor, companies]);

  const resolvedOrderTypeId = useMemo(() => {
    if (orderTypeWatch) {
      const parsed = Number(orderTypeWatch);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (emptyBeamIssuedetail?.orderTypeId != null) {
      const parsed = Number(emptyBeamIssuedetail.orderTypeId);
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (emptyBeamIssuedetail?.issuedToInternal != null) {
      return emptyBeamIssuedetail.issuedToInternal ? 1 : 2;
    }
    return null;
  }, [orderTypeWatch, emptyBeamIssuedetail]);

  const issuedToInternal = resolvedOrderTypeId === 1;

  const isFormValid = isValid &&
    resolvedOrderTypeId != null &&
    items.length > 0 &&
    items.every((item: any) => item.flangeId);

  // Local formatted address states
  const [vendorAddress, setVendorAddress] = useState<string>('');

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (storedCompanyId) {
      dispatch(getAllVendors({fetchAll: true}));
      dispatch(getAllFlanges({ companyId: Number(storedCompanyId),fetchAll: true } as any));
      dispatch(getAllCities({fetchAll: true}));
      dispatch(getAllStates({fetchAll: true}));
      dispatch(getAllCountries({fetchAll: true}));
      dispatch(getAllCompanies({fetchAll: true} as any));
    }
  }, [dispatch]);


  useEffect(() => {
    if (loggedCompany?.id) {
      setValue('consigneeId', String(loggedCompany.id), { shouldDirty: false, shouldValidate: true });
    }
  }, [loggedCompany, setValue]);

  useEffect(() => {
    if (emptyBeamIssuedetail) {
      reset({
        // emptyBeamNo: emptyBeamIssuedetail.emptyBeamNo || "",
        orderTypeId: emptyBeamIssuedetail.orderTypeId != null
          ? String(emptyBeamIssuedetail.orderTypeId)
          : emptyBeamIssuedetail.issuedToInternal != null
            ? (emptyBeamIssuedetail.issuedToInternal ? "1" : "2")
            : "",
        flangeIssueDate: emptyBeamIssuedetail.flangeIssueDate
          ? emptyBeamIssuedetail.flangeIssueDate.slice(0, 10)
          : "",
        vendorId: emptyBeamIssuedetail.vendorId
          ? emptyBeamIssuedetail.vendorId
          : "",
        consigneeId: emptyBeamIssuedetail.consigneeId
          ? emptyBeamIssuedetail.consigneeId
          : "",
        vechileNo: emptyBeamIssuedetail.vechileNo || "",
        remarks: emptyBeamIssuedetail.remarks || "",
      });

      // Prefill Vendor/Consignee addresses on edit
      try {
        const v = vendorList.find((x: any) => x.id === emptyBeamIssuedetail.vendorId);
        setVendorAddress(v?.address ? formatCompleteAddress(v.address) : '');
      } catch { }

      // Handle items array
      if (Array.isArray(emptyBeamIssuedetail.items) && emptyBeamIssuedetail.items.length > 0) {
        setItems(emptyBeamIssuedetail.items.map((item: any) => ({
          flangeId: item.flangeId ? String(item.flangeId) : "",
        })));
      } else {
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [emptyBeamIssuedetail, reset, vendorList]);

  const addItem = () => {
    if (!newItem.flangeId) {
      setFlangeIdError("Flange is required");
      setIsItemsValid(false);
      return;
    }
    // Add other required field validations as needed
    setIsItemsValid(true);
    setFlangeIdError("");

    if (emptyBeamIssuedetail?.id) {
      const flangeIdNumber = Number(newItem.flangeId);
      if (Number.isFinite(flangeIdNumber)) {
        setRemovedFlangeIds((prev) => prev.filter((id) => id !== flangeIdNumber));
      }
    }
    if (editingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingIndex] = newItem;
      setItems(updatedItems);
      setEditingIndex(null);
    } else {
      setItems([...items, newItem]);
    }
    console.log(items)
    setNewItem({
      flangeId: "",
    });
  };

  const editItem = (index: any) => {
    setNewItem(items[index]);
    setEditingIndex(index);
  };

  const deleteItem = (index: any) => {
    const item = items[index];
    const flangeIdNumber = Number(item?.flangeId);
    if (emptyBeamIssuedetail?.id && Number.isFinite(flangeIdNumber)) {
      setRemovedFlangeIds((prev) => {
        if (prev.includes(flangeIdNumber)) return prev;
        return [...prev, flangeIdNumber];
      });
    }
    setItems((prev: any[]) => prev.filter((_: any, i: any) => i !== index));
    setNewItem({ flangeId: "" });
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  // Update address display when Vendor changes
  useEffect(() => {
    if (selectedVendor?.address) {
      setVendorAddress(formatCompleteAddress(selectedVendor.address));
    } else {
      setVendorAddress('');
    }
  }, [selectedVendor, cityList, stateList, countryList]);


  const onSubmit = async (data: flangeIssueFormData) => {
    const isEditMode = Boolean(emptyBeamIssuedetail?.id);
    let resolvedFlangeIssueNo = data?.flangeIssueNo || emptyBeamIssuedetail?.flangeIssueNo || "";
    if (!emptyBeamIssuedetail?.id && !resolvedFlangeIssueNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: 'Empty Beam Issue'
        });
        resolvedFlangeIssueNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }

    if (!resolvedFlangeIssueNo) {
      toast.error("Flange issue number is missing. Please try again.");
      return;
    }

    if (!resolvedOrderTypeId) {
      toast.error("Select Order Type");
      return;
    }
    // Prepare the complete payload including emptyBeamNo
    const resolvedConsigneeId = loggedCompany?.id ?? (data.consigneeId ? parseInt(String(data.consigneeId)) : null);
    isSavingRef.current = true;
    const basePayload = {
      id: emptyBeamIssuedetail?.id || 0, // Include ID for update, default to 0 for create
      orderTypeId: resolvedOrderTypeId,
      flangeIssueNo: resolvedFlangeIssueNo,
      emptyBeamNo: emptyBeamIssuedetail?.emptyBeamNo || resolvedFlangeIssueNo,
      flangeIssueDate: new Date(data.flangeIssueDate).toISOString(),
      vechileNo: data.vechileNo,
      vendorId: parseInt(data.vendorId),
      consigneeId: resolvedConsigneeId ?? null,
      companyId: selectedCompanyId,
      issuedCompanyId: issuedToInternal ? (issuedCompanyId ?? null) : null,
      issuedToInternal,
      remarks: data.remarks || "",
      items: items.map((item: any) => ({
        flangeId: parseInt(item.flangeId) // Ensure flangeId is a number
      }))
    };

    try {
      if (isEditMode) {
        const updatePayload = {
          ...basePayload,
          removedFlangeIds,
        };
        dispatch(updateFlangeIssue(updatePayload))
          .then(() => {
            reset();
            navigate("/transaction/flange-management", { state: { tab: "emptyBeam" } });
          });
      } else {
        const { id, ...createPayload } = basePayload;
        await dispatch(createFlangeIssue(createPayload)).unwrap();
        documentNumberService.clearMemoryCache('Empty Beam Issue');
      }
      navigate("/transaction/flange-management");
    } catch (err) {
      console.error("Operation failed:", err);
    }
  };


  return (
    <div className="p-6 pt-16">
      <div className=" p-6 bg-white shadow-md rounded-lg">
        {/* Title & Save Button */}
        <div className="flex justify-between items-center border-b pb-4">

          <div className="flex items-center space-x-4">                                         <Button
            variant="outline"
            onClick={() => navigate("/transaction/flange-management")}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
            <h2 className="text-2xl font-semibold">Empty Beam Issue</h2>
          </div>
       
        </div>
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="mb-8">
          </div>

          {/* Vendor Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 ">
                <FileText size={20} /> Vendor Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-8">
              <div>


              <label className="block text-sm mb-1">Empty Beam Issue No</label>

              <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"

                {...register('flangeIssueNo')} readOnly />

            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Order Type <span className="text-red-600">*</span></label>
              <CommonSearchableSelect
                className="mt-1"
                placeholder="Select Order Type"
                options={ORDER_TYPE_OPTIONS}
                value={orderTypeWatch || ""}
                {...orderTypeField}
                onValueChange={(value) => {
                  setValue('orderTypeId', value, { shouldValidate: true });
                  handleOrderTypeSelect();
                }}
                error={errors.orderTypeId?.message as string}
              />
            
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Sizing Vendor Name <span className="text-red-600">*</span> </label>
              <CommonSearchableSelect
                className="mt-1"
                placeholder="Select a Sizing Vendor"
                options={vendorOptions}
                value={selectedVendorId || ""}
                {...vendorField}
                onValueChange={(value) => setValue('vendorId', value, { shouldValidate: true })}
                disabled={!orderTypeWatch}
                error={errors.vendorId?.message as string}
              />
           
              {vendorAddress ? (
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                  <h2 className="font-bold text-[16px] mb-2">Vendor Address</h2>
                  <p className="text-sm"><strong>Address:</strong> {vendorAddress}</p>
                </div>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Weaver <span className="text-red-600">*</span> </label>
              <input className="input mt-1 bg-gray-100" value={loggedCompanyName || ""} readOnly placeholder="Company not available" />
              <input type="hidden" {...register("consigneeId", { required: "Delivey Address is required" })} />
              {errors.consigneeId && (
                <p className="mt-1 text-sm text-red-600">{errors.consigneeId.message}</p>
              )}
              {/* {loggedCompanyAddress ? (
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                  <h2 className="font-bold text-[16px] mb-2">Weaver Address</h2>
                  <p className="text-sm"><strong>Address:</strong> {loggedCompanyAddress}</p>
                </div>
              ) : null} */}
              </div>
              <div>
              <label className="block text-sm font-medium text-secondary-700">Vehicle No <span className="text-red-600">*</span> </label>
              <input
                {...register('vechileNo', { required: 'Vehicle No is required' })}
                className="input mt-1" placeholder="Enter Vehicle No"
              />
              {errors.vechileNo && (
                <p className="mt-1 text-sm text-red-600">{errors.vechileNo.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Empty Beam Issue Date <span className="text-red-600">*</span> </label>
              <input
                {...register('flangeIssueDate', { required: 'Date is required' })}
                className="input mt-1" type="date"
              />
              {errors.flangeIssueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.flangeIssueDate.message}</p>
              )}
            </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Remarks</label>
                <textarea
                  {...register('remarks')}
                  className="input mt-1 min-h-[90px]"
                  placeholder="Enter remarks"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart size={20} /> Flange Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Select Empty Beam No</label>
                  <CommonSearchableSelect
                    value={newItem.flangeId}
                    onValueChange={(val) =>
                      setNewItem({ ...newItem, flangeId: val })
                    }
                    placeholder="Select Empty Beam No"
                    className="mt-1"
                    error={!!flangeIdError}
                  >
                    {dropdownFlangeList?.map((flange: any) => (
                      <option key={flange.id} value={flange.id}>
                        {flange.flangeNo}
                      </option>
                    ))}
                  </CommonSearchableSelect>

                  {flangeIdError && <p className="mt-1 text-sm text-red-600">{flangeIdError}</p>}
                </div>
              </div>
              <Button onClick={addItem} className="mt-4 ml-auto flex items-center">
                <Plus size={18} className="mr-2" />
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> Item Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full border-collapse border border-gray-300 text-center">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2">Sl.No</th>
                    <th className="border p-2">Empty Beam No</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: any) => (
                    <tr key={index} className="border">
                      <td className="border p-2">{index + 1}</td>
                      {/* <td className="border p-2">{item.flangeId}</td> */}
                      <td className="border p-2">
                        {(() => {
                          const idNum = Number(item.flangeId);
                          const f = Array.isArray(flangeList) ? flangeList.find((fl: any) => Number(fl.id) === idNum) : null;
                          return f?.flangeNo || 'N/A';
                        })()}
                      </td>
                      <td className="border p-2">
                        <button onClick={() => editItem(index)} className="mr-2 text-blue-500">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => deleteItem(index)} className="text-red-500">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
        
      </div>
         <div className="flex justify-end mt-4">
          <Button
            onClick={handleSubmit(onSubmit)}
            className="bg-primary hover:bg-primary text-white px-6 flex items-center"
            disabled={!isFormValid}
          >
            <Save size={18} className="mr-2" />
            {emptyBeamIssuedetail?.id ? "Update Empty Beam Issue" : "Save Empty Beam Issue"}
          </Button>
          </div>
    </div>
  );
};

export default FlangeIssue;
