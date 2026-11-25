// import { DataTable } from "@/components/data/DataTable";
// import { Modal } from "@/components/ui/Modal";
// import { formatDate } from "@/lib/utils";
// import { AppDispatch, RootState } from "@/state/store";
// import { getAllSubCategories, getSubCategoryByColor } from "@/state/subCategorySlice";
// import { createYarnMaster, deleteYarnMaster, getAllYarnMasters, updateYarnMaster } from "@/state/yarnSlice";
// import React, { useEffect, useMemo, useState } from "react";
// import { useForm } from "react-hook-form";
// import { useDispatch, useSelector } from "react-redux";
// import type { ApiState as SubCategoryState } from "@/state/subCategorySlice";
// import type { ApiState as YarnState } from "@/state/yarnSlice";

// interface YarnFormData {
//         id?: number | null;
//         yarnName: string;
//         unitSno: string;
//         types: string; // Will now hold the ID of the selected yarn type subCategory
//         colorSno: string;
//         conversion: string;
//         countSno: string;
//         content: string;
//         plySno: string;
//         filaments: string;
//         activeFlag: boolean;
//         taxId: string;
//         igst: string;
//         cgst: string;
//         sgst: string;
// }

// export function YarnMaster() {
//         const { subCategoryList: subCategories, subCategoryByColourList } = useSelector(
//                 (state: RootState) => state.subCategory as SubCategoryState
//         );
//         const { yarnList } = useSelector((state: RootState) => state.yarn as YarnState);
//         const [isModalOpen, setIsModalOpen] = useState(false);
//         const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//         const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//         const [currentYarn, setCurrentYarn] = useState<any>(null);
//         const [isEditing, setIsEditing] = useState(false);
//         const dispatch = useDispatch<AppDispatch>();
//         const [selectedGstDropdownId, setSelectedGstDropdownId] = useState<string>('');
//         const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

//         // Removed suggestion states for 'types'
//         const [showYarnSuggestions, setShowYarnSuggestions] = useState(false);
//         const [duplicateYarnError, setDuplicateYarnError] = useState<string>("");

//         const gstOptionList = [
//                 { id: 1, name: 0 },
//                 { id: 2, name: 5 },
//                 { id: 3, name: 12 },
//                 { id: 4, name: 18 },
//                 { id: 5, name: 28 }
//         ];
//         const gstIdToPercent: Record<string, number> = { '1': 0, '2': 5, '3': 12, '4': 18, '5': 28 };

//         const {
//                 register,
//                 handleSubmit,
//                 reset,
//                 setValue,
//                 watch,
//                 formState: { errors, isValid }
//         } = useForm<YarnFormData>({
//                 mode: 'onBlur',
//                 reValidateMode: 'onBlur'
//         });

//         // Watch form values
//         const yarnNameValue = watch("yarnName");
//         // typesValue is no longer needed for suggestions
//         const countSnoValue = watch("countSno");
//         const plySnoValue = watch("plySno");
//         const unitSnoValue = watch("unitSno");

//         // Existing names for suggestions
//         const existingYarnNames = useMemo(
//                 () => yarnList.map((y: any) => (y?.yarnName ?? "")).filter((name: any): name is string => Boolean(name)),
//                 [yarnList]
//         );

//         // Removed existingTypes and filteredTypeSuggestions as 'types' is now a dropdown

//         const filteredYarnSuggestions = useMemo(() => {
//                 const q = (yarnNameValue || "").toLowerCase();
//                 if (!q) return [] as string[];
//                 return existingYarnNames
//                         .filter((name: string) => name.toLowerCase().includes(q))
//                         .slice(0, 8);
//         }, [yarnNameValue, existingYarnNames]);

//         // Filtered lists from subCategories
//         const counts = useMemo(
//                 () => subCategories?.filter((sc: any) => sc.categoryName === "Counts") || [],
//                 [subCategories]
//         );

//         const plies = useMemo(
//                 () => subCategories?.filter((sc: any) => sc.categoryName === "Ply") || [],
//                 [subCategories]
//         );

//         // New list for the Yarn Types dropdown
//         const yarnTypes = useMemo(
//                 () => subCategories?.filter((sc: any) => sc.categoryName === "Yarn") || [],
//                 [subCategories]
//         );

//         const units = ["NE", "DEN"] as const;

//         const handleSuggestionClick = (suggestion: string) => {
//                 setValue("yarnName", suggestion, {
//                         shouldValidate: true,
//                         shouldDirty: true
//                 });
//                 setShowYarnSuggestions(false);
//                 setActiveSuggestionIndex(-1);
//                 setDuplicateYarnError("");
//         };

//         const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//                 if (!showYarnSuggestions || filteredYarnSuggestions.length === 0) return;

//                 switch (e.key) {
//                         case 'ArrowDown':
//                                 e.preventDefault();
//                                 setActiveSuggestionIndex(prev =>
//                                         prev < filteredYarnSuggestions.length - 1 ? prev + 1 : 0
//                                 );
//                                 break;
//                         case 'ArrowUp':
//                                 e.preventDefault();
//                                 setActiveSuggestionIndex(prev =>
//                                         prev > 0 ? prev - 1 : filteredYarnSuggestions.length - 1
//                                 );
//                                 break;
//                         case 'Enter':
//                                 if (activeSuggestionIndex >= 0) {
//                                         e.preventDefault();
//                                         handleSuggestionClick(filteredYarnSuggestions[activeSuggestionIndex]);
//                                 }
//                                 break;
//                         case 'Escape':
//                                 setShowYarnSuggestions(false);
//                                 setActiveSuggestionIndex(-1);
//                                 break;
//                         default:
//                                 break;
//                 }
//         };

//         // Live duplicate check for yarnName
//         useEffect(() => {
//                 const currentName = (yarnNameValue || "").trim().toLowerCase();
//                 if (!currentName) {
//                         setDuplicateYarnError("");
//                         return;
//                 }
//                 const excludeName = isEditing ? (currentYarn?.yarnName || "").toLowerCase() : "";
//                 const isDuplicate = existingYarnNames.some(
//                         (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
//                 );
//                 // Update: We only use the react-hook-form error now for validation.
//                 // This useEffect logic is now somewhat redundant with the validation in register, but kept for standalone error display if needed.
//                 setDuplicateYarnError(isDuplicate ? "This yarn name already exists" : "");
//         }, [yarnNameValue, isEditing, currentYarn, existingYarnNames]);

//         // Auto-calculate conversion
//         useEffect(() => {
//                 if (countSnoValue && plySnoValue && unitSnoValue) {
//                         let count = 0;
//                         // Find count value from subCategories or use input value
//                         const countItem = counts.find((c: any) => String(c.id) === countSnoValue);
//                         if (countItem) {
//                                 count = parseFloat(countItem.subCategoryName || "0");
//                         } else {
//                                 count = parseFloat(countSnoValue) || 0;
//                         }

//                         let ply = 0;
//                         // Find ply value from subCategories or use input value (though ply is a required dropdown)
//                         const plyItem = plies.find((p: any) => String(p.id) === plySnoValue);
//                         if (plyItem) {
//                                 ply = parseFloat(plyItem.subCategoryName || "0");
//                         } else {
//                                 // Fallback if plySnoValue is not an ID but a number string (unlikely for a dropdown)
//                                 ply = parseFloat(plySnoValue) || 0;
//                         }

//                         // Conversion Logic - Assuming NE is for Cotton/Spun yarn count (higher number = finer)
//                         // and DEN is for Filament yarn denier (lower number = finer)
//                         // The original conversion formula is: (count / ply / divisor).toFixed(2)
//                         // The divisor '5315' is often used in a denier to cotton count conversion approximation (e.g., Denier = 5315 / Cotton Count)
//                         // Let's stick to the original logic structure but acknowledge the '5315' divisor's intent.

//                         if (!isNaN(count) && !isNaN(ply) && ply !== 0) {
//                                 // Original logic: if NE, divisor is 1, else 5315. This seems to be calculating a ratio/conversion factor.
//                                 // It's likely intended to calculate a specific value based on the unit.
//                                 const divisor = unitSnoValue === "NE" ? 1 : 5315;
//                                 const result = (count / ply / divisor).toFixed(2);
//                                 setValue("conversion", result);
//                         } else {
//                                 setValue("conversion", "");
//                         }
//                 } else {
//                         setValue("conversion", "");
//                 }
//         }, [countSnoValue, plySnoValue, unitSnoValue, setValue, counts, plies]);

//         useEffect(() => {
//                 dispatch(getAllYarnMasters({}));
//                 dispatch(getAllSubCategories({}));
//                 dispatch(getSubCategoryByColor("Colour"));
//         }, [dispatch]);

//         // Helper function to get subCategoryName by ID
//         const getSubCategoryName = (id: string, list: any[]) => {
//                 return list.find((item: any) => String(item.id) === id)?.subCategoryName || id;
//         };

//         // Helper function for Types Name
//         const getTypeName = (id: string) => {
//                 return yarnTypes.find((item: any) => String(item.id) === id)?.subCategoryName || id;
//         }

//           const processedCityList = useMemo(() => {
//             return yarnList.map((city: any, index: number) => ({
//               ...city,
//               serialNo: index + 1
//             }));
//           }, [yarnList]);

//         const columns = useMemo(
//                 () => [
//                         {
//                                 Header: 'S.No',
//                                 accessor: 'serialNo', // ✅ Use pre-calculated serial number
//     width: 50,
//     disableFilters: true,
//                         },
//                         {
//                                 Header: 'Yarn Name',
//                                 accessor: 'yarnName',
//                         },
//                         {
//                                 Header: 'Count',
//                                 accessor: 'countSno',
//                                 // Updated to use getSubCategoryName for clarity
//                                 Cell: ({ value }: { value: string }) => getSubCategoryName(value, counts),
//                         },
//                         {
//                                 Header: 'Ply',
//                                 accessor: 'plySno',
//                                 // Updated to use getSubCategoryName for clarity
//                                 Cell: ({ value }: { value: string }) => getSubCategoryName(value, plies),
//                         },
//                         {
//                                 Header: 'Filaments',
//                                 accessor: 'filaments',
//                         },
//                         {
//                                 Header: 'Unit',
//                                 accessor: 'unitSno',
//                         },
//                         {
//                                 Header: 'Content',
//                                 accessor: 'content',
//                         },
//                         {
//                                 Header: 'Types',
//                                 accessor: 'types',
//                                 Cell: ({ value }: { value: string }) => getTypeName(value)
//                         },
//                         {
//                                 Header: 'Conversion',
//                                 accessor: 'conversion',
//                         },
//                         {
//                                 Header: "Status",
//                                 accessor: "activeFlag",
//                                 Cell: ({ value }: { value: boolean }) => (
//                                         <span
//                                                 className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
//                                         >
//                                                 {value ? "Active" : "Inactive"}
//                                         </span>
//                                 ),
//                         },
//                 ],
//                 [counts, plies, yarnTypes]
//         );

//         const handleEdit = (state: Record<string, any>) => {
//                 setIsEditing(true);
//                 setCurrentYarn(state);
//                 const taxIdFromData = state.taxType ? String(state.taxType) : '1';
//                 const gstPercentFromData = state.gstPercent ?? 0;
//                 let matchingId = '';
//                 const matchingEntry = Object.entries(gstIdToPercent).find(([id, p]) => p === gstPercentFromData);
//                 if (matchingEntry) {
//                         matchingId = matchingEntry[0];
//                 }
//                 setSelectedGstDropdownId(matchingId);
//                 reset({
//                         id: state.id,
//                         yarnName: state.yarnName,
//                         countSno: String(state.countSno || ''),
//                         plySno: String(state.plySno || ''),
//                         filaments: state.filaments || '',
//                         unitSno: state.unitSno === 1 ? "NE" : state.unitSno === 2 ? "DEN" : state.unitSno,
//                         content: state.content || '',
//                         types: String(state.types || ''), // Should be an ID now
//                         colorSno: String(state.colorSno || ''),
//                         conversion: state.conversion !== null && state.conversion !== undefined ? String(state.conversion) : '',
//                         activeFlag: Boolean(state.activeFlag),
//                         taxId: taxIdFromData,
//                         igst: state.igst !== null && state.igst !== undefined ? String(state.igst) : '',
//                         cgst: state.cgst !== null && state.cgst !== undefined ? String(state.cgst) : '',
//                         sgst: state.sgst !== null && state.sgst !== undefined ? String(state.sgst) : ''
//                 });
//                 setIsModalOpen(true);
//         };

//         const handleDelete = (state: any) => {
//                 setCurrentYarn(state);
//                 setIsDeleteModalOpen(true);
//         };

//         const confirmDelete = async () => {
//                 if (!currentYarn) return;

//                 try {
//                         await dispatch(deleteYarnMaster(currentYarn.id)).unwrap();
//                         await dispatch(getAllYarnMasters({}));
//                 } catch (error) {
//                         console.error("Error deleting yarn:", error);
//                 }

//                 setIsDeleteModalOpen(false);
//         };

//         const handleView = (state: any) => {
//                 setCurrentYarn(state);
//                 setIsViewModalOpen(true);
//         };

//         const handleOpenModal = (editing = false, state: Record<string, any> | null = null) => {
//                 if (editing && state) {
//                         const taxIdFromData = state.taxType ? String(state.taxType) : '1';
//                         const gstPercentFromData = state.gstPercent ?? 0;
//                         let matchingId = '';
//                         const matchingEntry = Object.entries(gstIdToPercent).find(([id, p]) => p === gstPercentFromData);
//                         if (matchingEntry) {
//                                 matchingId = matchingEntry[0];
//                         }
//                         setSelectedGstDropdownId(matchingId);
//                         reset({
//                                 id: state.id,
//                                 yarnName: state.yarnName,
//                                 countSno: String(state.countSno || ''),
//                                 plySno: String(state.plySno || ''),
//                                 filaments: state.filaments || '',
//                                 unitSno: state.unitSno === 1 ? "NE" : state.unitSno === 2 ? "DEN" : state.unitSno,
//                                 content: state.content || '',
//                                 types: String(state.types || ''), // Should be an ID now
//                                 colorSno: String(state.colorSno || ''),
//                                 conversion: state.conversion !== null && state.conversion !== undefined ? String(state.conversion) : '',
//                                 activeFlag: Boolean(state.activeFlag),
//                                 taxId: taxIdFromData,
//                                 igst: state.igst !== null && state.igst !== undefined ? String(state.igst) : '',
//                                 cgst: state.cgst !== null && state.cgst !== undefined ? String(state.cgst) : '',
//                                 sgst: state.sgst !== null && state.sgst !== undefined ? String(state.sgst) : ''
//                         });
//                         setCurrentYarn(state);
//                 } else {
//                         setSelectedGstDropdownId('');
//                         reset({
//                                 id: null,
//                                 yarnName: '',
//                                 countSno: '',
//                                 plySno: '',
//                                 filaments: '',
//                                 unitSno: '',
//                                 content: '',
//                                 types: '', // Reset to empty string for the dropdown
//                                 colorSno: '',
//                                 conversion: '',
//                                 activeFlag: true,
//                                 taxId: '1',
//                                 igst: '',
//                                 cgst: '',
//                                 sgst: ''
//                         });
//                         setCurrentYarn(null);
//                 }
//                 setIsEditing(editing);
//                 setIsModalOpen(true);
//                 // Reset the yarn-specific error on modal open
//                 setDuplicateYarnError("");
//         };

//         const onSubmit = async (data: YarnFormData) => {
//                 try {
//                         console.log('Form data submitted:', data);

//                         // Check for yarn name duplicate just before submit as final safety check
//                         const currentName = (data.yarnName || "").trim().toLowerCase();
//                         const excludeName = isEditing ? (currentYarn?.yarnName || "").toLowerCase() : "";
//                         const isDuplicate = existingYarnNames.some(
//                                 (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
//                         );
//                         if (isDuplicate) {
//                                 setDuplicateYarnError("This yarn name already exists");
//                                 return; // Block submission
//                         }

//                         // Removed old suggestion states reset
//                         setShowYarnSuggestions(false);

//                         const normalizedTaxId = typeof data.taxId === "string" ? data.taxId : data.taxId ? String(data.taxId) : "";

//                         let igst = 0;
//                         let cgst = 0;
//                         let sgst = 0;
//                         let gstPercent: number | null = null;

//                         if (selectedGstDropdownId) {
//                                 gstPercent = gstIdToPercent[selectedGstDropdownId];
//                                 if (normalizedTaxId === "2") {
//                                         igst = gstPercent;
//                                 } else if (normalizedTaxId === "1") {
//                                         const halfPercent = gstPercent / 2;
//                                         cgst = halfPercent;
//                                         sgst = halfPercent;
//                                 }
//                         } else {
//                                 // Fallback to manual input if dropdown is not used (which are readonly now, so this path is unlikely)
//                                 igst = parseFloat(data.igst) || 0;
//                                 cgst = parseFloat(data.cgst) || 0;
//                                 sgst = parseFloat(data.sgst) || 0;
//                                 if (normalizedTaxId === "2") {
//                                         gstPercent = igst;
//                                 } else if (normalizedTaxId === "1") {
//                                         gstPercent = cgst + sgst;
//                                 }
//                         }

//                         const normalizedData = {
//                                 ...data,
//                                 activeFlag: typeof data.activeFlag === "boolean" ? data.activeFlag : data.activeFlag === 'true',
//                                 taxId: normalizedTaxId
//                         };

//                         const formData = {
//                                 id: data.id,
//                                 yarnName: data.yarnName,
//                                 unitSno: data.unitSno === "NE" ? 1 : 2, // Simple number assignment
//                                 types: data.types,
//                                 colorSno: data.colorSno ? parseInt(data.colorSno) : null,
//                                 conversion: data.conversion ? parseFloat(data.conversion) : null,
//                                 countSno: data.countSno ? parseInt(data.countSno) : null,
//                                 content: data.content,
//                                 plySno: data.plySno ? parseInt(data.plySno) : null,
//                                 filaments: data.filaments,
//                                 activeFlag: data.activeFlag,
//                                 taxType: data.taxId ? parseInt(data.taxId) : null,
//                                 gstPercent: gstPercent,
//                                 igst: igst,
//                                 cgst: cgst,
//                                 sgst: sgst
//                         };

//                         if (isEditing) {
//                                 await dispatch(updateYarnMaster(formData));
//                         } else {
//                                 const { id, ...newYarnData } = formData;
//                                 await dispatch(createYarnMaster(newYarnData));
//                         }
//                         dispatch(getAllYarnMasters({}));
//                         setIsModalOpen(false);
//                         reset();
//                         setSelectedGstDropdownId('');
//                         setDuplicateYarnError("");
//                 } catch (error) {
//                         console.error('Error submitting form:', error);
//                 }
//         };

//         return (
//                 <div className="p-6 pt-16">
//                         <h1 className="text-2xl font-semibold mb-6">Yarn Management</h1>
//                         <hr className="my-4" />

//                         <DataTable
//                                 columns={columns}
//                                 data={processedCityList}
//                                 title="Yarn Master"
//                                 onAdd={() => handleOpenModal(false)}
//                                 onEdit={handleEdit}
//                                 onDelete={handleDelete}
//                                 onView={handleView}
//                                 showActions={true}
//                                 filterPlaceholder="Search yarn..."
//                         />
//                         <hr className="my-4" />

//                         <Modal
//                                 isOpen={isModalOpen}
//                                 onClose={() => setIsModalOpen(false)}
//                                 title={isEditing ? 'Edit Yarn' : 'Add Yarn'}
//                                 // CUSTOM STYLE FOR WIDER MODAL
//                                 className="!max-w-3xl"
//                         >
//                                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                                         <div className="grid grid-cols-2 gap-4">
//                                                 {/* Yarn Name with suggestions */}
//                                                 <div className="relative">
//                                                         <label className="block text-sm font-medium text-secondary-700">
//                                                                 Yarn Name <span className="text-red-600">*</span>
//                                                         </label>
//                                                         <input
//                                                                 {...register('yarnName', {
//                                                                         required: 'Yarn Name is required',
//                                                                         validate: (value) => {
//                                                                                 const val = (value || "").trim().toLowerCase();
//                                                                                 if (!val) return true;
//                                                                                 const excludeName = isEditing ? (currentYarn?.yarnName || "").toLowerCase() : "";
//                                                                                 const exists = existingYarnNames.some((n: string) => n.toLowerCase() === val && n.toLowerCase() !== excludeName);
//                                                                                 return exists ? "This yarn name already exists" : true;
//                                                                         },
//                                                                         onChange: () => {
//                                                                                 setShowYarnSuggestions(true);
//                                                                         },
//                                                                         onBlur: () => {
//                                                                                 setTimeout(() => setShowYarnSuggestions(false), 150);
//                                                                         }
//                                                                 })}
//                                                                 placeholder="Enter Yarn Name"
//                                                                 className="input mt-1"
//                                                                 onFocus={() => setShowYarnSuggestions(true)}
//                                                                 autoComplete="off"
//                                                                 onKeyDown={handleKeyDown}
//                                                         />
//                                                         {(showYarnSuggestions && filteredYarnSuggestions.length > 0) && (
//                                                                 <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
//                                                                         {filteredYarnSuggestions.map((s: string, index: number) => (
//                                                                                 <li
//                                                                                         key={s}
//                                                                                         className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${index === activeSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''
//                                                                                                 }`}
//                                                                                         onMouseEnter={() => setActiveSuggestionIndex(index)}
//                                                                                         onClick={(e) => {
//                                                                                                 e.preventDefault();
//                                                                                                 e.stopPropagation();
//                                                                                                 handleSuggestionClick(s);
//                                                                                         }}
//                                                                                         onMouseDown={(e) => e.preventDefault()}
//                                                                                 >
//                                                                                         {s}
//                                                                                 </li>
//                                                                         ))}
//                                                                 </ul>
//                                                         )}
//                                                         {duplicateYarnError && !errors.yarnName && (
//                                                                 <p className="mt-1 text-sm text-red-600">{duplicateYarnError}</p>
//                                                         )}
//                                                         {errors.yarnName && (
//                                                                 <p className="mt-1 text-sm text-red-600">{String(errors.yarnName.message)}</p>
//                                                         )}
//                                                 </div>

//                                                 {/* Select Count */}
//                                                 <div>
//                                                         <label className="block text-sm font-medium">
//                                                                 Select Count <span className="text-red-600">*</span>
//                                                         </label>
//                                                         <select
//                                                                 {...register("countSno", { required: "Count is required" })}
//                                                                 className="input mt-1"
//                                                         >
//                                                                 <option value="">Select a Count</option>
//                                                                 {counts.map((category: any) => (
//                                                                         <option key={category.id} value={category.id}>
//                                                                                 {category.subCategoryName}
//                                                                         </option>
//                                                                 ))}
//                                                         </select>
//                                                         {errors.countSno && <p className="mt-1 text-sm text-red-600">{errors.countSno.message}</p>}
//                                                 </div>

//                                                 {/* Ply Name */}
//                                                 <div>
//                                                         <label className="block text-sm font-medium">
//                                                                 Ply Name <span className="text-red-600">*</span>
//                                                         </label>
//                                                         <select
//                                                                 {...register("plySno", { required: "Ply Name is required" })}
//                                                                 className="input mt-1"
//                                                         >
//                                                                 <option value="">Select Ply</option>
//                                                                 {plies.map((ply: any) => (
//                                                                         <option key={ply.id} value={ply.id}>
//                                                                                 {ply.subCategoryName}
//                                                                         </option>
//                                                                 ))
//                                                                 }
//                                                         </select>
//                                                         {errors.plySno && <p className="mt-1 text-sm text-red-600">{errors.plySno.message}</p>}
//                                                 </div>

//                                                 {/* Filaments */}
//                                                 <div>
//                                                         <label className="block text-sm font-medium">Filaments</label>
//                                                         <input
//                                                                 type="number"
//                                                                 {...register('filaments')}
//                                                                 placeholder="Enter Filaments"
//                                                                 className="input mt-1"
//                                                         />
//                                                 </div>

//                                                 {/* Select Unit */}
//                                                 <div>
//                                                         <label className="block text-sm font-medium">
//                                                                 Select Unit <span className="text-red-600">*</span>
//                                                         </label>
//                                                         <select
//                                                                 {...register("unitSno", { required: "Unit is required" })}
//                                                                 className="input mt-1"
//                                                         >
//                                                                 <option value="">Select Unit</option>
//                                                                 {units.map((unit) => (
//                                                                         <option key={unit} value={unit}>
//                                                                                 {unit}
//                                                                         </option>
//                                                                 ))}
//                                                         </select>
//                                                         {errors.unitSno && <p className="mt-1 text-sm text-red-600">{errors.unitSno.message}</p>}
//                                                 </div>

//                                                 <div>
//                                                         <label className="block text-sm font-medium text-secondary-700">
//                                                                 Content
//                                                         </label>
//                                                         <input
//                                                                 type="text"
//                                                                 {...register("content")} // Removed 'required' validation
//                                                                 placeholder="Enter Content"
//                                                                 className="input mt-1"
//                                                         />
//                                                         {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
//                                                 </div>


//                                                 {/* Yarn Types - NOW A DROPDOWN */}
//                                                 <div>
//                                                         <label className="block text-sm font-medium text-secondary-700">
//                                                                 Yarn Types <span className="text-red-600">*</span>
//                                                         </label>
//                                                         <select
//                                                                 {...register('types', { required: 'Type is required' })}
//                                                                 className="input mt-1"
//                                                         >
//                                                                 <option value="">Select Yarn Type</option>
//                                                                 {yarnTypes.map((type: any) => (
//                                                                         <option key={type.id} value={type.id}>
//                                                                                 {type.subCategoryName}
//                                                                         </option>
//                                                                 ))}
//                                                         </select>
//                                                         {errors.types && (
//                                                                 <p className="mt-1 text-sm text-red-600">{errors.types.message}</p>
//                                                         )}
//                                                 </div>

//                                                 {/* Conversion */}
//                                                 <div>
//                                                         <label className="block text-sm font-medium text-secondary-700">Conversion</label>
//                                                         <input
//                                                                 {...register('conversion')}
//                                                                 placeholder="0.00"
//                                                                 className="input mt-1 bg-gray-100"
//                                                                 readOnly
//                                                         />
//                                                 </div>

//                                                 {/* Select Color */}
//                                                 <div className="col-span-2">
//                                                         <label className="block text-sm font-medium">
//                                                                 Select Color
//                                                         </label>
//                                                         <select {...register("colorSno")} className="input mt-1">
//                                                                 <option value="">Select a Color</option>
//                                                                 {subCategoryByColourList?.map((category: any) => (
//                                                                         <option key={category.id} value={category.id}>
//                                                                                 {category.subCategoryName}
//                                                                         </option>
//                                                                 ))}
//                                                         </select>
//                                                         {errors.colorSno && <p className="mt-1 text-sm text-red-600">{errors.colorSno.message}</p>}
//                                                 </div>
//                                         </div>

//                                         {/* Status */}
//                                         <div>
//                                                 <label className="block text-sm font-medium text-secondary-700">Status</label>
//                                                 <select
//                                                         {...register('activeFlag', { required: 'Status is required' })}
//                                                         className="input mt-1"
//                                                 >
//                                                         <option value="true">Active</option>
//                                                         <option value="false">Inactive</option>
//                                                 </select>
//                                                 {errors.activeFlag && (
//                                                         <p className="mt-1 text-sm text-red-600">{errors.activeFlag.message}</p>
//                                                 )}
//                                         </div>

//                                         <input type="hidden" {...register("taxId")} defaultValue="1" />

//                                         {/* Tax Fields */}
//                                         <div className="grid grid-cols-3 gap-4">
//                                                 <div>
//                                                         <label className="block text-sm font-medium text-secondary-700">IGST %</label>
//                                                         <select
//                                                                 value={selectedGstDropdownId}
//                                                                 onChange={(e) => {
//                                                                         const id = e.target.value;
//                                                                         setSelectedGstDropdownId(id);
//                                                                         const percent = gstIdToPercent[id] ?? 0;
//                                                                         const halfPercent = percent / 2;
//                                                                         setValue('cgst', String(halfPercent));
//                                                                         setValue('sgst', String(halfPercent));
//                                                                         setValue('igst', String(percent));
//                                                                 }}
//                                                                 className="input mt-1"
//                                                         >
//                                                                 <option value="">Select IGST %</option>
//                                                                 {gstOptionList.map((gstOption: any) => (
//                                                                         <option key={gstOption.id} value={String(gstOption.id)}>
//                                                                                 {gstOption.name}%
//                                                                         </option>
//                                                                 ))}
//                                                         </select>
//                                                 </div>
//                                                 <div>
//                                                         <label className="block text-sm font-medium text-secondary-700">CGST %</label>
//                                                         <input
//                                                                 {...register("cgst")}
//                                                                 placeholder="CGST %"
//                                                                 className="input mt-1 bg-gray-100"
//                                                                 readOnly
//                                                         />
//                                                 </div>
//                                                 <div>
//                                                         <label className="block text-sm font-medium text-secondary-700">SGST %</label>
//                                                         <input
//                                                                 {...register("sgst")}
//                                                                 placeholder="SGST %"
//                                                                 className="input mt-1 bg-gray-100"
//                                                                 readOnly
//                                                         />
//                                                 </div>
//                                         </div>

//                                         <div className="flex justify-end space-x-3 pt-4">
//                                                 <button
//                                                         type="button"
//                                                         onClick={() => setIsModalOpen(false)}
//                                                         className="btn btn-secondary"
//                                                 >
//                                                         Cancel
//                                                 </button>
//                                                 <button
//                                                         type="submit"
//                                                         // Button is only disabled if isValid is false OR there is a duplicate yarn error.
//                                                         disabled={!isValid || !!duplicateYarnError}
//                                                         className={`btn 
//                 ${(!isValid || !!duplicateYarnError)
//                                                                         ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
//                                                                         : 'btn-primary hover:bg-blue-700'
//                                                                 }
//                 transition-colors duration-200
//               `}
//                                                         title={!isValid ? "Please fill all required fields" : (!!duplicateYarnError ? duplicateYarnError : "")}
//                                                 >
//                                                         {isEditing ? "Update Yarn" : "Add Yarn"}
//                                                 </button>
//                                         </div>
//                                 </form>
//                         </Modal>

//                         <Modal
//                                 isOpen={isDeleteModalOpen}
//                                 onClose={() => setIsDeleteModalOpen(false)}
//                                 title="Confirm Delete"
//                         >
//                                 <hr className="my-4" />
//                                 <div className="space-y-4">
//                                         <p>Are you sure you want to delete yarn?</p>
//                                         <p className="text-red-600 text-sm">This action cannot be undone.</p>

//                                         <div className="flex justify-end space-x-3 pt-4">
//                                                 <button
//                                                         onClick={() => setIsDeleteModalOpen(false)}
//                                                         className="btn btn-secondary"
//                                                 >
//                                                         Cancel
//                                                 </button>
//                                                 <button
//                                                         onClick={confirmDelete}
//                                                         className="btn btn-danger"
//                                                 >
//                                                         Delete
//                                                 </button>
//                                         </div>
//                                 </div>
//                         </Modal>

//                         <Modal
//                                 isOpen={isViewModalOpen}
//                                 onClose={() => setIsViewModalOpen(false)}
//                                 title="Yarn Details"
//                         >
//                                 <hr className="my-4" />
//                                 {currentYarn && (
//                                         <div className="space-y-4">
//                                                 <div className="grid grid-cols-2 gap-4">
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">Yarn Name</p>
//                                                                 <p className="font-medium">{currentYarn.yarnName}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">Count</p>
//                                                                 <p className="font-medium">{getSubCategoryName(currentYarn.countSno, counts)}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">Ply</p>
//                                                                 <p className="font-medium">{getSubCategoryName(currentYarn.plySno, plies)}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">Filaments</p>
//                                                                 <p className="font-medium">{currentYarn.filaments}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">Unit</p>
//                                                                 <p className="font-medium">{currentYarn.unitSno}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">Content</p>
//                                                                 <p className="font-medium">{currentYarn.content}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">Types</p>
//                                                                 <p className="font-medium">{getTypeName(currentYarn.types)}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">Conversion</p>
//                                                                 <p className="font-medium">{currentYarn.conversion}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">IGST</p>
//                                                                 <p className="font-medium">{currentYarn.igst}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">CGST</p>
//                                                                 <p className="font-medium">{currentYarn.cgst}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm text-secondary-500">SGST</p>
//                                                                 <p className="font-medium">{currentYarn.sgst}</p>
//                                                         </div>
//                                                         <div>
//                                                                 <p className="text-sm">Status</p>
//                                                                 <p>
//                                                                         <span
//                                                                                 className={`px-2 py-1 rounded-full text-xs ${currentYarn.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
//                                                                         >
//                                                                                 {currentYarn.activeFlag ? "Active" : "Inactive"}
//                                                                         </span>
//                                                                 </p>
//                                                         </div>
//                                                 </div>
//                                                 <div className="flex justify-end pt-4">
//                                                         <button
//                                                                 onClick={() => setIsViewModalOpen(false)}
//                                                                 className="btn btn-secondary"
//                                                         >
//                                                                 Close
//                                                         </button>
//                                                 </div>
//                                         </div>
//                                 )}
//                         </Modal>
//                 </div>
//         );
// }

import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { AppDispatch, RootState } from "@/state/store";
import { getAllSubCategories, getSubCategoryByColor } from "@/state/subCategorySlice";
import { createYarnMaster, deleteYarnMaster, getAllYarnMasters, updateYarnMaster } from "@/state/yarnSlice";
import { getAllGstMaster } from "@/state/gstMasterSlice";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, UseFormSetError } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import type { ApiState as SubCategoryState } from "@/state/subCategorySlice";
import type { ApiState as YarnState } from "@/state/yarnSlice";
import type { ApiState as GstState } from "@/state/gstMasterSlice";
import { BooleanFilter } from "@/components/filters";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";


interface YarnFormData {
        id?: number | null;
        yarnName: string;
        unitSno: string;
        types: string; // Will now hold the ID of the selected yarn type subCategory
        colorSno: string;
        conversion: string;
        countSno: string;
        content: string;
        plySno: string;
        filaments: string;
        activeFlag: boolean;
        taxId: string;
        igst: string;
        cgst: string;
        sgst: string;
        gstId?: string;
}

const resolveApiErrorMessage = (error: any, fallback: string) => {
        const responseData = error?.response?.data;
        const candidates: string[] = [];

        if (typeof responseData === "string") {
                candidates.push(responseData);
        } else if (responseData) {
                if (typeof responseData.message === "string") {
                        candidates.push(responseData.message);
                }
                if (typeof responseData.error === "string") {
                        candidates.push(responseData.error);
                }
                if (typeof responseData.data === "string") {
                        candidates.push(responseData.data);
                }
                if (responseData.data && typeof responseData.data === "object") {
                        if (typeof responseData.data.message === "string") {
                                candidates.push(responseData.data.message);
                        }
                        if (typeof responseData.data.error === "string") {
                                candidates.push(responseData.data.error);
                        }
                        if (Array.isArray(responseData.data.errors)) {
                                responseData.data.errors.forEach((err: any) => {
                                        if (typeof err === "string") {
                                                candidates.push(err);
                                        } else if (typeof err?.message === "string") {
                                                candidates.push(err.message);
                                        }
                                });
                        }
                }
                if (Array.isArray(responseData.errors)) {
                        responseData.errors.forEach((err: any) => {
                                if (typeof err === "string") {
                                        candidates.push(err);
                                } else if (typeof err?.message === "string") {
                                        candidates.push(err.message);
                                }
                        });
                }
        }

        const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
        return candidate || error?.message || fallback;
};

const handleYarnSaveError = (error: any, setError: UseFormSetError<YarnFormData>) => {
        const message = resolveApiErrorMessage(error, "Failed to save yarn");
        setError("yarnName", { type: "server", message }, { shouldFocus: true });
        return message;
};

export function YarnMaster() {
        const { subCategoryList: subCategories, subCategoryByColourList } = useSelector(
                (state: RootState) => state.subCategory as SubCategoryState
        );
        const { yarnList, pagination } = useSelector((state: RootState) => state.yarn as YarnState);
        const { gstList } = useSelector((state: RootState) => state.gst as GstState);
        const {
                currentPage,
                itemsPerPage,
                setItemsPerPage,
                handlePageChange,
                getOffset
        } = usePagination({ itemsPerPage: 10 });
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
        const [isViewModalOpen, setIsViewModalOpen] = useState(false);
        const [currentYarn, setCurrentYarn] = useState<any>(null);
        const [isEditing, setIsEditing] = useState(false);
        const dispatch = useDispatch<AppDispatch>();
        const [selectedGstDropdownId, setSelectedGstDropdownId] = useState<string>('');
        const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

        // Removed suggestion states for 'types'
        const [showYarnSuggestions, setShowYarnSuggestions] = useState(false);
        const [duplicateYarnError, setDuplicateYarnError] = useState<string>("");

        const parseRateValue = (value: any) => {
                const num = Number(value)
                return Number.isFinite(num) ? num : 0
        }

        const activeGstList = useMemo(() => {
                const rawList = Array.isArray(gstList)
                        ? gstList
                        : Array.isArray((gstList as any)?.data)
                                ? (gstList as any).data
                                : []
                return rawList.filter((gst: any) => gst.activeFlag !== false)
        }, [gstList])

        const normalizedGstList = useMemo(() => {
                return activeGstList.map((gst: any) => {
                        const cgstRate = parseRateValue(gst.cgstRate ?? gst.cgst ?? 0)
                        const sgstRate = parseRateValue(gst.sgstRate ?? gst.sgst ?? 0)
                        const igstRate = parseRateValue(gst.igstRate ?? gst.igst ?? 0)
                        const totalRate = igstRate || (cgstRate + sgstRate)
                        const breakdown: string[] = []
                        if (cgstRate) breakdown.push(`CGST ${cgstRate}%`)
                        if (sgstRate) breakdown.push(`SGST ${sgstRate}%`)
                        if (igstRate) breakdown.push(`IGST ${igstRate}%`)
                        const label = `${totalRate}%`
                        return { ...gst, cgstRate, sgstRate, igstRate, totalRate, label }
                })
        }, [activeGstList])

        const gstIdToPercent = useMemo(() => {
                const map: Record<string, number> = {}
                normalizedGstList.forEach((gst: any) => {
                        map[String(gst.id)] = gst.totalRate
                })
                return map
        }, [normalizedGstList])

        const gstIdToRates = useMemo(() => {
                const map: Record<string, { cgst: number; sgst: number; igst: number; total: number }> = {}
                normalizedGstList.forEach((gst: any) => {
                        map[String(gst.id)] = {
                                cgst: gst.cgstRate,
                                sgst: gst.sgstRate,
                                igst: gst.igstRate,
                                total: gst.totalRate,
                        }
                })
                return map
        }, [normalizedGstList])

        const defaultFivePercentGstId = useMemo(() => {
                const match = normalizedGstList.find((gst: any) => Number(gst.totalRate) === 5 || Number(gst.igstRate) === 5)
                return match ? String(match.id) : ''
        }, [normalizedGstList])

        const resolveExistingGstPercent = (source: any) => {
                const fromPercent = Number(source?.gstPercent)
                if (Number.isFinite(fromPercent) && fromPercent > 0) {
                        return fromPercent
                }
                const igstValue = Number(source?.igst)
                if (Number.isFinite(igstValue) && igstValue > 0) {
                        return igstValue
                }
                const cgstValue = Number(source?.cgst)
                const sgstValue = Number(source?.sgst)
                const combined = (Number.isFinite(cgstValue) ? cgstValue : 0) + (Number.isFinite(sgstValue) ? sgstValue : 0)
                if (combined > 0) {
                        return combined
                }
                return 0
        }

        const {
                register,
                handleSubmit,
                reset,
                setValue,
                watch,
                setError,
                clearErrors,
                formState: { errors, isValid }
        } = useForm<YarnFormData>({
                mode: 'onBlur',
                reValidateMode: 'onBlur',
                defaultValues: {
                        yarnName: '',
                        unitSno: '',
                        types: '',
                        colorSno: '',
                        conversion: '',
                        countSno: '',
                        content: '',
                        plySno: '',
                        filaments: '',
                        activeFlag: true,
                        taxId: '',
                        gstId: '',
                        igst: '5',
                        cgst: '2.5',
                        sgst: '2.5'
                }
        });

        // Watch form values
        const yarnNameValue = watch("yarnName");
        // typesValue is no longer needed for suggestions
        const countSnoValue = watch("countSno");
        const plySnoValue = watch("plySno");
        const unitSnoValue = watch("unitSno");

        // Existing names for suggestions
        const existingYarnNames = useMemo(
                () => yarnList.map((y: any) => (y?.yarnName ?? "")).filter((name: any): name is string => Boolean(name)),
                [yarnList]
        );

        // Removed existingTypes and filteredTypeSuggestions as 'types' is now a dropdown

        const filteredYarnSuggestions = useMemo(() => {
                const q = (yarnNameValue || "").toLowerCase();
                if (!q) return [] as string[];
                return existingYarnNames
                        .filter((name: string) => name.toLowerCase().includes(q))
                        .slice(0, 8);
        }, [yarnNameValue, existingYarnNames]);

        const getSubCategoriesByCategory = useCallback(
                (categoryName: string) =>
                        subCategories?.filter(
                                (sc: any) => sc.categoryName === categoryName && sc.activeFlag === true
                        ) || [],
                [subCategories]
        );

        // Filtered lists from subCategories
        const counts = useMemo(() => getSubCategoriesByCategory("Counts"), [getSubCategoriesByCategory]);

        const plies = useMemo(() => getSubCategoriesByCategory("Ply"), [getSubCategoriesByCategory]);

        const getCountName = (countSno: string | number) => {
                const item = counts.find((c: any) => String(c.id) === String(countSno));
                return item?.subCategoryName ?? ""; // fallback to empty if not loaded yet
        };

        const getPlyName = (plySno: string | number) => {
                const item = plies.find((p: any) => String(p.id) === String(plySno));
                return item?.subCategoryName ?? ""; // fallback to empty if not loaded yet
        };

        // New list for the Yarn Types dropdown
        const yarnTypes = useMemo(() => getSubCategoriesByCategory("Yarn"), [getSubCategoriesByCategory]);

        const units = ["NE", "DEN"] as const;

        const handleSuggestionClick = (suggestion: string) => {
                setValue("yarnName", suggestion, {
                        shouldValidate: true,
                        shouldDirty: true
                });
                setShowYarnSuggestions(false);
                setActiveSuggestionIndex(-1);
                setDuplicateYarnError("");
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (!showYarnSuggestions || filteredYarnSuggestions.length === 0) return;

                switch (e.key) {
                        case 'ArrowDown':
                                e.preventDefault();
                                setActiveSuggestionIndex(prev =>
                                        prev < filteredYarnSuggestions.length - 1 ? prev + 1 : 0
                                );
                                break;
                        case 'ArrowUp':
                                e.preventDefault();
                                setActiveSuggestionIndex(prev =>
                                        prev > 0 ? prev - 1 : filteredYarnSuggestions.length - 1
                                );
                                break;
                        case 'Enter':
                                if (activeSuggestionIndex >= 0) {
                                        e.preventDefault();
                                        handleSuggestionClick(filteredYarnSuggestions[activeSuggestionIndex]);
                                }
                                break;
                        case 'Escape':
                                setShowYarnSuggestions(false);
                                setActiveSuggestionIndex(-1);
                                break;
                        default:
                                break;
                }
        };

        // Live duplicate check for yarnName
        useEffect(() => {
                const currentName = (yarnNameValue || "").trim().toLowerCase();
                if (!currentName) {
                        setDuplicateYarnError("");
                        return;
                }
                const excludeName = isEditing ? (currentYarn?.yarnName || "").toLowerCase() : "";
                const isDuplicate = existingYarnNames.some(
                        (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
                );
                // Update: We only use the react-hook-form error now for validation.
                // This useEffect logic is now somewhat redundant with the validation in register, but kept for standalone error display if needed.
                setDuplicateYarnError(isDuplicate ? "This yarn name already exists" : "");
        }, [yarnNameValue, isEditing, currentYarn, existingYarnNames]);

        // Auto-calculate conversion
        useEffect(() => {
                if (countSnoValue && plySnoValue && unitSnoValue) {
                        let count = 0;
                        // Find count value from subCategories or use input value
                        const countItem = counts.find((c: any) => String(c.id) === countSnoValue);
                        if (countItem) {
                                count = parseFloat(countItem.subCategoryName || "0");
                        } else {
                                count = parseFloat(countSnoValue) || 0;
                        }

                        let ply = 0;
                        // Find ply value from subCategories or use input value (though ply is a required dropdown)
                        const plyItem = plies.find((p: any) => String(p.id) === plySnoValue);
                        if (plyItem) {
                                ply = parseFloat(plyItem.subCategoryName || "0");
                        } else {
                                // Fallback if plySnoValue is not an ID but a number string (unlikely for a dropdown)
                                ply = parseFloat(plySnoValue) || 0;
                        }

                        // Conversion Logic - Assuming NE is for Cotton/Spun yarn count (higher number = finer)
                        // and DEN is for Filament yarn denier (lower number = finer)
                        // The original conversion formula is: (count / ply / divisor).toFixed(2)
                        // The divisor '5315' is often used in a denier to cotton count conversion approximation (e.g., Denier = 5315 / Cotton Count)
                        // Let's stick to the original logic structure but acknowledge the '5315' divisor's intent.

                        if (!isNaN(count) && !isNaN(ply) && ply !== 0) {
                                // Original logic: if NE, divisor is 1, else 5315. This seems to be calculating a ratio/conversion factor.
                                // It's likely intended to calculate a specific value based on the unit.
                                const divisor = unitSnoValue === "NE" ? 1 : 5315;
                                let result: string;
                                if (unitSnoValue === "NE") {
                                        result = (count / ply / divisor).toFixed(2);
                                } else {
                                        result = (divisor / (count / ply)).toFixed(2);
                                }
                                setValue("conversion", result);
                        } else {
                                setValue("conversion", "");
                        }
                } else {
                        setValue("conversion", "");
                }
        }, [countSnoValue, plySnoValue, unitSnoValue, setValue, counts, plies]);

        useEffect(() => {
                dispatch(getAllYarnMasters({
                        fetchAll: true,
                }));
        }, [currentPage, dispatch, getOffset, itemsPerPage]);

        useEffect(() => {
                dispatch(getAllSubCategories({ fetchAll: true }));
                dispatch(getSubCategoryByColor("Colour"));
                dispatch(getAllGstMaster({ fetchAll: true }));
        }, [dispatch]);

        // Helper function to get subCategoryName by ID
        const getSubCategoryName = (id: string, list: any[]) => {
                return list.find((item: any) => String(item.id) === id)?.subCategoryName || id;
        };

        // Helper function for Types Name
        const getTypeName = (id: string) => {
                return yarnTypes.find((item: any) => String(item.id) === id)?.subCategoryName || id;
        }

        // Helper function for Unit Name
        const getUnitName = (value: string | number) => {
                const v = String(value).toUpperCase();
                if (v === '1' || v === 'NE') return 'NE';
                if (v === '2' || v === 'DEN') return 'DEN';
                return v;
        }

        const processedCityList = useMemo(() => {
                return yarnList.map((city: any, index: number) => ({
                        ...city,
                        serialNo: (pagination.offset || 0) + index + 1
                }));
        }, [yarnList, pagination.offset]);

        const columns = useMemo(
                () => [
                        {
                                Header: 'S.No',
                                accessor: 'serialNo',
                                width: 50,
                                disableFilters: true,
                        },
                        {
                                Header: 'Yarn Name',
                                accessor: 'yarnName',
                                // Default text filter works fine - no changes needed
                        },
                        {
                                Header: 'Count',
                                accessor: 'countSno',
                                Cell: ({ value }: { value: string | number }) => getCountName(value),
                                // ADD THIS: Custom filter to search by display name
                                filter: (rows: any[], columnIds: string[], filterValue: string) => {
                                        if (!filterValue) return rows;
                                        return rows.filter((row: any) => {
                                                const countName = getCountName(row.values[columnIds[0]]);
                                                return countName.toLowerCase().includes(filterValue.toLowerCase());
                                        });
                                },
                        },
                        {
                                Header: 'Ply',
                                accessor: 'plySno',
                                Cell: ({ value }: { value: string }) => getPlyName(value),
                                // ADD THIS: Custom filter to search by display name
                                filter: (rows: any[], columnIds: string[], filterValue: string) => {
                                        if (!filterValue) return rows;
                                        return rows.filter((row: any) => {
                                                const plyName = getPlyName(row.values[columnIds[0]]);
                                                return plyName.toLowerCase().includes(filterValue.toLowerCase());
                                        });
                                },
                        },
                        {
                                Header: 'Filaments',
                                accessor: 'filaments',

                        },
                        {
                                Header: 'Unit',
                                accessor: 'unitSno',
                                Cell: ({ value }: { value: string | number }) => getUnitName(value),
                                // ADD THIS: Custom filter to search by display name
                                filter: (rows: any[], columnIds: string[], filterValue: string) => {
                                        if (!filterValue) return rows;
                                        return rows.filter((row: any) => {
                                                const unitName = getUnitName(row.values[columnIds[0]]);
                                                return unitName.toLowerCase().includes(filterValue.toLowerCase());
                                        });
                                },
                        },
                        {
                                Header: 'Content',
                                accessor: 'content',
                                // Default text filter works fine - no changes needed
                        },
                        {
                                Header: 'Types',
                                accessor: 'types',
                                Cell: ({ value }: { value: string }) => getTypeName(value),
                                // ADD THIS: Custom filter to search by display name
                                filter: (rows: any[], columnIds: string[], filterValue: string) => {
                                        if (!filterValue) return rows;
                                        return rows.filter((row: any) => {
                                                const typeName = getTypeName(row.values[columnIds[0]]);
                                                return typeName.toLowerCase().includes(filterValue.toLowerCase());
                                        });
                                },
                        },
                        {
                                Header: 'Conversion',
                                accessor: 'conversion',

                        },
                        {
                                Header: "Status",
                                accessor: "activeFlag",
                                Filter: BooleanFilter,
                                // ADD THIS: Boolean filter function
                                filter: (rows: any[], columnIds: string[], filterValue: string) => {
                                        if (filterValue === '' || filterValue === undefined) return rows;
                                        const boolValue = filterValue === 'true';
                                        return rows.filter((row: any) => row.values[columnIds[0]] === boolValue);
                                },
                                Cell: ({ value }: { value: boolean }) => (
                                        <span
                                                className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                        >
                                                {value ? "Active" : "Inactive"}
                                        </span>
                                ),
                        },
                ],
                [counts, plies, yarnTypes]
        );

        const colours = useMemo(
                () => getSubCategoriesByCategory("Colour"),
                [getSubCategoriesByCategory]
        );


        const handleEdit = (state: Record<string, any>) => {
                setIsEditing(true);
                setCurrentYarn(state);
                const taxIdFromData = state.taxType ? String(state.taxType) : '1';
                const gstPercentFromData = resolveExistingGstPercent(state);
                let matchingId = '';
                const matchingEntry = Object.entries(gstIdToPercent).find(([id, p]) => p === gstPercentFromData);
                if (matchingEntry) {
                        matchingId = matchingEntry[0];
                }
                setSelectedGstDropdownId(matchingId);
                reset({
                        id: state.id,
                        yarnName: state.yarnName,
                        countSno: String(state.countSno || ''),
                        plySno: String(state.plySno || ''),
                        filaments: state.filaments || '',
                        unitSno: state.unitSno === 1 ? "NE" : state.unitSno === 2 ? "DEN" : state.unitSno,
                        content: state.content || '',
                        types: String(state.types || ''), // Should be an ID now
                        colorSno: String(state.colorSno || ''),
                        conversion: state.conversion !== null && state.conversion !== undefined ? String(state.conversion) : '',
                        activeFlag: Boolean(state.activeFlag),
                        taxId: taxIdFromData,
                        gstId: matchingId,
                        igst: state.igst !== null && state.igst !== undefined ? String(state.igst) : '',
                        cgst: state.cgst !== null && state.cgst !== undefined ? String(state.cgst) : '',
                        sgst: state.sgst !== null && state.sgst !== undefined ? String(state.sgst) : ''
                });
                setIsModalOpen(true);
        };

        const handleDelete = (state: any) => {
                setCurrentYarn(state);
                setIsDeleteModalOpen(true);
        };

        const confirmDelete = async () => {
                if (!currentYarn) return;

                try {
                        await dispatch(deleteYarnMaster(currentYarn.id)).unwrap();
                        await dispatch(getAllYarnMasters({
                                fetchAll: true,
                        }));
                } catch (error) {
                        console.error("Error deleting yarn:", error);
                }

                setIsDeleteModalOpen(false);
        };

        const handleView = (state: any) => {
                setCurrentYarn(state);
                setIsViewModalOpen(true);
        };

        const handleOpenModal = (editing = false, state: Record<string, any> | null = null) => {
                if (editing && state) {
                        const taxIdFromData = state.taxType ? String(state.taxType) : '1';
                        const gstPercentFromData = resolveExistingGstPercent(state);
                        let matchingId = '';
                        const matchingEntry = Object.entries(gstIdToPercent).find(([id, p]) => p === gstPercentFromData);
                        if (matchingEntry) {
                                matchingId = matchingEntry[0];
                        }
                        setSelectedGstDropdownId(matchingId);
                        reset({
                                id: state.id,
                                yarnName: state.yarnName,
                                countSno: String(state.countSno || ''),
                                plySno: String(state.plySno || ''),
                                filaments: state.filaments || '',
                                unitSno: state.unitSno === 1 ? "NE" : state.unitSno === 2 ? "DEN" : state.unitSno,
                                content: state.content || '',
                                types: String(state.types || ''), // Should be an ID now
                                colorSno: String(state.colorSno || ''),
                                conversion: state.conversion !== null && state.conversion !== undefined ? String(state.conversion) : '',
                                activeFlag: Boolean(state.activeFlag),
                                taxId: taxIdFromData,
                                igst: state.igst !== null && state.igst !== undefined ? String(state.igst) : '',
                                cgst: state.cgst !== null && state.cgst !== undefined ? String(state.cgst) : '',
                                sgst: state.sgst !== null && state.sgst !== undefined ? String(state.sgst) : ''
                        });
                        setCurrentYarn(state);
                } else {
                        setSelectedGstDropdownId(defaultFivePercentGstId);
                        reset({
                                id: null,
                                yarnName: '',
                                countSno: '',
                                plySno: '',
                                filaments: '',
                                unitSno: '',
                                content: '',
                                types: '', // Reset to empty string for the dropdown
                                colorSno: '',
                                conversion: '',
                                activeFlag: true,
                                taxId: '1',
                                gstId: defaultFivePercentGstId,
                                igst: '5',
                                cgst: '2.5',
                                sgst: '2.5'
                        });
                        setCurrentYarn(null);
                }
                setIsEditing(editing);
                setIsModalOpen(true);
                // Reset the yarn-specific error on modal open
                setDuplicateYarnError("");
        };

        useEffect(() => {
                if (!isModalOpen || isEditing || selectedGstDropdownId || !defaultFivePercentGstId) return;
                const rates = gstIdToRates[defaultFivePercentGstId];
                const totalPercent = rates?.total ?? 5;
                const cgstRate = rates?.cgst ?? (totalPercent ? totalPercent / 2 : 0);
                const sgstRate = rates?.sgst ?? (totalPercent ? totalPercent / 2 : 0);
                const igstRate = rates?.igst ?? totalPercent;
                setSelectedGstDropdownId(defaultFivePercentGstId);
                setValue('gstId', defaultFivePercentGstId);
                setValue('cgst', cgstRate ? String(cgstRate) : '');
                setValue('sgst', sgstRate ? String(sgstRate) : '');
                setValue('igst', igstRate ? String(igstRate) : '');
        }, [isModalOpen, isEditing, selectedGstDropdownId, defaultFivePercentGstId, gstIdToRates, setValue]);

        const onSubmit = async (data: YarnFormData) => {
                try {
                        console.log('Form data submitted:', data);

                        const currentName = (data.yarnName || "").trim().toLowerCase();
                        const excludeName = isEditing ? (currentYarn?.yarnName || "").toLowerCase() : "";
                        const isDuplicate = existingYarnNames.some(
                                (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
                        );
                        if (isDuplicate) {
                                setDuplicateYarnError("This yarn name already exists");
                                return;
                        }

                        setShowYarnSuggestions(false);

                        const normalizedTaxId = typeof data.taxId === "string" ? data.taxId : data.taxId ? String(data.taxId) : "";

                        let igst = 0;
                        let cgst = 0;
                        let sgst = 0;
                        let gstPercent: number | null = null;

                        if (selectedGstDropdownId) {
                                const rates = gstIdToRates[selectedGstDropdownId];
                                if (rates) {
                                        gstPercent = rates.total;
                                        if (normalizedTaxId === "2") {
                                                igst = rates.igst || rates.total;
                                        } else if (normalizedTaxId === "1") {
                                                const cgstRate = rates.cgst || (rates.total ? rates.total / 2 : 0);
                                                const sgstRate = rates.sgst || (rates.total ? rates.total / 2 : 0);
                                                cgst = cgstRate;
                                                sgst = sgstRate;
                                        }
                                }
                        } else {
                                igst = parseFloat(data.igst) || 0;
                                cgst = parseFloat(data.cgst) || 0;
                                sgst = parseFloat(data.sgst) || 0;
                                if (normalizedTaxId === "2") {
                                        gstPercent = igst;
                                } else if (normalizedTaxId === "1") {
                                        gstPercent = cgst + sgst;
                                }
                        }

                        const inputIgst = parseFloat(data.igst);
                        if (igst <= 0 && Number.isFinite(inputIgst) && inputIgst > 0) {
                                igst = inputIgst;
                        }

                        const formData = {
                                id: data.id,
                                yarnName: data.yarnName,
                                unitSno: data.unitSno === "NE" ? 1 : 2,
                                types: data.types,
                                colorSno: data.colorSno ? parseInt(data.colorSno) : null,
                                conversion: data.conversion ? parseFloat(data.conversion) : null,
                                countSno: data.countSno ? parseInt(data.countSno) : null,
                                content: data.content,
                                plySno: data.plySno ? parseInt(data.plySno) : null,
                                filaments: data.filaments,
                                activeFlag: data.activeFlag,
                                taxType: data.taxId ? parseInt(data.taxId) : null,
                                gstPercent: gstPercent,
                                igst: igst,
                                cgst: cgst,
                                sgst: sgst
                        };
                        if (isEditing) {
                                await dispatch(updateYarnMaster(formData)).unwrap();
                        } else {
                                const { id, ...newYarnData } = formData;
                                await dispatch(createYarnMaster(newYarnData)).unwrap();
                        }
                        await dispatch(getAllYarnMasters({
                               fetchAll: true
                        }));
                        clearErrors();
                        setDuplicateYarnError("");
                        setShowYarnSuggestions(false);
                        setIsModalOpen(false);
                        reset();
                        setSelectedGstDropdownId('');
                } catch (error: any) {
                        const message = handleYarnSaveError(error, setError);
                        setDuplicateYarnError(message);
                        setShowYarnSuggestions(false);
                        console.error('Error submitting form:', error);
                }
        };

        return (
                <div className="p-6 pt-16">
                     
                        <DataTable
                                columns={columns}
                                data={processedCityList}
                                title="Yarn Master"
                                onAdd={() => handleOpenModal(false)}
                                onEdit={handleEdit}
                                // onDelete={handleDelete}
                                onView={handleView}
                                showActions={true}
                                filterPlaceholder="Search yarn..."
                                showColumnFilters={true}
                                disableFullDataFetch={true}
                                // initialPageSize={itemsPerPage}
                                // onPageSizeChange={setItemsPerPage}
                                // totalCount={pagination?.total || 0}
                                // currentPage={currentPage}
                                // onPageChange={handlePageChange}
                        />

                        {/* <Pagination
                                currentPage={currentPage}
                                totalItems={pagination?.total || 0}
                                itemsPerPage={itemsPerPage}
                                offset={pagination?.offset || 0}
                                hasNext={!!pagination?.next}
                                hasPrev={!!pagination?.prev}
                                onPageChange={handlePageChange}
                        /> */}
                        <hr className="my-4" />

                        <Modal
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                                title={isEditing ? 'Edit Yarn' : 'Add Yarn'}
                                // CUSTOM STYLE FOR WIDER MODAL
                                className="!max-w-3xl"
                        >
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                                {/* Yarn Name with suggestions */}
                                                <div className="relative">
                                                        <label className="block text-sm font-medium text-secondary-700">
                                                                Yarn Name <span className="text-red-600">*</span>
                                                        </label>
                                                        <input
                                                                {...register('yarnName', {
                                                                        required: 'Yarn Name is required',
                                                                        validate: (value) => {
                                                                                const val = (value || "").trim().toLowerCase();
                                                                                if (!val) return true;
                                                                                const excludeName = isEditing ? (currentYarn?.yarnName || "").toLowerCase() : "";
                                                                                const exists = existingYarnNames.some((n: string) => n.toLowerCase() === val && n.toLowerCase() !== excludeName);
                                                                                return exists ? "This yarn name already exists" : true;
                                                                        },
                                                                        onChange: () => {
                                                                                setShowYarnSuggestions(true);
                                                                        },
                                                                        onBlur: () => {
                                                                                setTimeout(() => setShowYarnSuggestions(false), 150);
                                                                        }
                                                                })}
                                                                placeholder="Enter Yarn Name"
                                                                className="input mt-1"
                                                                onFocus={() => setShowYarnSuggestions(true)}
                                                                autoComplete="off"
                                                                onKeyDown={handleKeyDown}
                                                        />
                                                        {(showYarnSuggestions && filteredYarnSuggestions.length > 0) && (
                                                                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                                                                        {filteredYarnSuggestions.map((s: string, index: number) => (
                                                                                <li
                                                                                        key={s}
                                                                                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${index === activeSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''
                                                                                                }`}
                                                                                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                                                                                        onClick={(e) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                handleSuggestionClick(s);
                                                                                        }}
                                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                                >
                                                                                        {s}
                                                                                </li>
                                                                        ))}
                                                                </ul>
                                                        )}
                                                        {duplicateYarnError && !errors.yarnName && (
                                                                <p className="mt-1 text-sm text-red-600">{duplicateYarnError}</p>
                                                        )}
                                                        {errors.yarnName && (
                                                                <p className="mt-1 text-sm text-red-600">{String(errors.yarnName.message)}</p>
                                                        )}
                                                </div>

                                                {/* Select Count */}
                                                <div>
                                                        <label className="block text-sm font-medium">
                                                                Select Count <span className="text-red-600">*</span>
                                                        </label>

                                                        <CommonSearchableSelect
                                                                options={(counts || []).map((category: any) => ({
                                                                        value: String(category.id),
                                                                        label: category.subCategoryName || `Count ${category.id}`,
                                                                }))}
                                                                placeholder="Select a Count"
                                                                {...register("countSno", { required: "Count is required" })}
                                                                error={errors.countSno?.message as string}
                                                        />
                                                </div>

                                                {/* Ply Name */}
                                                <div>
                                                        <label className="block text-sm font-medium">
                                                                Ply Name <span className="text-red-600">*</span>
                                                        </label>

                                                        <CommonSearchableSelect
                                                                options={(plies || []).map((ply: any) => ({
                                                                        value: String(ply.id),
                                                                        label: ply.subCategoryName || `Ply ${ply.id}`,
                                                                }))}
                                                                placeholder="Select Ply"
                                                                {...register("plySno", { required: "Ply Name is required" })}
                                                                error={errors.plySno?.message as string}
                                                        />
                                                </div>

                                                {/* Filaments */}
                                                <div>
                                                        <label className="block text-sm font-medium">Filaments</label>
                                                        <input
                                                                type="number"
                                                                {...register('filaments')}
                                                                placeholder="Enter Filaments"
                                                                className="input mt-1"
                                                        />
                                                </div>

                                                {/* Select Unit */}
                                                <div>
                                                        <label className="block text-sm font-medium">
                                                                Select Unit <span className="text-red-600">*</span>
                                                        </label>

                                                        <CommonSearchableSelect
                                                                options={(units || []).map((unit) => ({
                                                                        value: String(unit),
                                                                        label: String(unit),
                                                                }))}
                                                                placeholder="Select Unit"
                                                                {...register("unitSno", { required: "Unit is required" })}
                                                                error={errors.unitSno?.message as string}
                                                        />
                                                </div>

                                                <div>
                                                        <label className="block text-sm font-medium text-secondary-700">
                                                                Content
                                                        </label>
                                                        <input
                                                                type="text"
                                                                {...register("content")} // Removed 'required' validation
                                                                placeholder="Enter Content"
                                                                className="input mt-1"
                                                        />
                                                        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
                                                </div>


                                                {/* Yarn Types - NOW A DROPDOWN */}
                                                <div>
                                                        <label className="block text-sm font-medium text-secondary-700">
                                                                Yarn Types <span className="text-red-600">*</span>
                                                        </label>

                                                        <CommonSearchableSelect
                                                                options={(yarnTypes || []).map((type: any) => ({
                                                                        value: String(type.id),
                                                                        label: type.subCategoryName || `Type ${type.id}`,
                                                                }))}
                                                                placeholder="Select Yarn Type"
                                                                {...register('types', { required: 'Type is required' })}
                                                                error={errors.types?.message as string}
                                                        />
                                                </div>

                                                {/* Conversion */}
                                                <div>
                                                        <label className="block text-sm font-medium text-secondary-700">Conversion</label>
                                                        <input
                                                                {...register('conversion')}
                                                                placeholder="0.00"
                                                                className="input mt-1 bg-gray-100"
                                                                readOnly
                                                        />
                                                </div>

                                                {/* Select Color */}
                                                <div>
                                                        <label className="block text-sm font-medium">
                                                                Select Colour
                                                        </label>

                                                        <CommonSearchableSelect
                                                                options={(colours || []).map((category: any) => ({
                                                                        value: String(category.id),
                                                                        label: category.subCategoryName || `Colour ${category.id}`,
                                                                }))}
                                                                placeholder="Select a Colour"
                                                                {...register("colorSno")}
                                                                error={errors.colorSno?.message as string}
                                                        />
                                                </div>
                                                <div>
                                                        <label className="block text-sm font-medium text-secondary-700">Status</label>
                                                        <select
                                                                {...register('activeFlag', { required: 'Status is required' })}
                                                                className="input mt-1"
                                                        >
                                                                <option value="true">Active</option>
                                                                <option value="false">Inactive</option>
                                                        </select>
                                                        {errors.activeFlag && (
                                                                <p className="mt-1 text-sm text-red-600">{errors.activeFlag.message}</p>
                                                        )}
                                                </div>

                                        </div>

                                        <input type="hidden" {...register("taxId")} defaultValue="1" />

                                        {/* Tax Fields */}
                                        <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                        <label className="block text-sm font-medium text-secondary-700">
                                                                IGST % <span className="text-red-600">*</span>
                                                        </label>

                                                        <CommonSearchableSelect
                                                                options={(normalizedGstList || []).map((gstOption: any) => ({
                                                                        value: String(gstOption.id),
                                                                        label: gstOption.label,
                                                                }))}
                                                                placeholder="Select IGST %"
                                                                value={selectedGstDropdownId || ""}
                                                                {...register("gstId", {
                                                                        required: "IGST % is required",
                                                                        onChange: (e: any) => {
                                                                                const id = e.target.value;
                                                                                setSelectedGstDropdownId(id);
                                                                                const rates = gstIdToRates[id];
                                                                                const totalPercent = rates?.total ?? 0;
                                                                                const cgstRate = rates?.cgst ?? (totalPercent ? totalPercent / 2 : 0);
                                                                                const sgstRate = rates?.sgst ?? (totalPercent ? totalPercent / 2 : 0);
                                                                                const igstRate = rates?.igst ?? totalPercent;
                                                                                setValue('cgst', cgstRate ? String(cgstRate) : '');
                                                                                setValue('sgst', sgstRate ? String(sgstRate) : '');
                                                                                setValue('igst', igstRate ? String(igstRate) : '');
                                                                        }
                                                                })}
                                                                error={errors.gstId?.message as string}
                                                        />
                                                </div>
                                                <div>
                                                        <label className="block text-sm font-medium text-secondary-700">CGST %</label>
                                                        <input
                                                                {...register("cgst")}
                                                                placeholder="CGST %"
                                                                className="input mt-1 bg-gray-100"
                                                                readOnly
                                                        />
                                                </div>
                                                <div>
                                                        <label className="block text-sm font-medium text-secondary-700">SGST %</label>
                                                        <input
                                                                {...register("sgst")}
                                                                placeholder="SGST %"
                                                                className="input mt-1 bg-gray-100"
                                                                readOnly
                                                        />
                                                </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                                <button
                                                        type="button"
                                                        onClick={() => setIsModalOpen(false)}
                                                        className="btn btn-secondary"
                                                >
                                                        Cancel
                                                </button>
                                                <button
                                                        type="submit"
                                                        // Button is only disabled if isValid is false OR there is a duplicate yarn error.
                                                        disabled={!isValid || !!duplicateYarnError}
                                                        className={`btn 
  ${(!isValid || !!duplicateYarnError)
                                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
                                                                        : 'btn-primary hover:bg-blue-700'
                                                                }
  transition-colors duration-200
}`}
                                                        title={!isValid ? "Please fill all required fields" : (duplicateYarnError ? duplicateYarnError : "")}
                                                >
                                                        {isEditing ? "Update Yarn" : "Add Yarn"}
                                                </button>
                                        </div>
                                </form>
                        </Modal>

                        <Modal
                                isOpen={isDeleteModalOpen}
                                onClose={() => setIsDeleteModalOpen(false)}
                                title="Confirm Delete"
                        >
                                <hr className="my-4" />
                                <div className="space-y-4">
                                        <p>Are you sure you want to delete yarn?</p>
                                        <p className="text-red-600 text-sm">This action cannot be undone.</p>

                                        <div className="flex justify-end space-x-3 pt-4">
                                                <button
                                                        onClick={() => setIsDeleteModalOpen(false)}
                                                        className="btn btn-secondary"
                                                >
                                                        Cancel
                                                </button>
                                                <button
                                                        onClick={confirmDelete}
                                                        className="btn btn-danger"
                                                >
                                                        Delete
                                                </button>
                                        </div>
                                </div>
                        </Modal>

                        <Modal
                                isOpen={isViewModalOpen}
                                onClose={() => setIsViewModalOpen(false)}
                                title="Yarn Details"
                        >
                                <hr className="my-4" />
                                {currentYarn && (
                                        <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                                <p className="text-sm text-secondary-500">Yarn Name</p>
                                                                <p className="font-medium">{currentYarn.yarnName}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">Count</p>
                                                                <p className="font-medium">{getSubCategoryName(currentYarn.countSno, counts)}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">Ply</p>
                                                                <p className="font-medium">{getSubCategoryName(currentYarn.plySno, plies)}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">Filaments</p>
                                                                <p className="font-medium">{currentYarn.filaments}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">Unit</p>
                                                                <p className="font-medium">{currentYarn.unitSno}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">Content</p>
                                                                <p className="font-medium">{currentYarn.content}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">Types</p>
                                                                <p className="font-medium">{getTypeName(currentYarn.types)}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">Conversion</p>
                                                                <p className="font-medium">{currentYarn.conversion}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">IGST</p>
                                                                <p className="font-medium">{currentYarn.igst}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">CGST</p>
                                                                <p className="font-medium">{currentYarn.cgst}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-secondary-500">SGST</p>
                                                                <p className="font-medium">{currentYarn.sgst}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm">Status</p>
                                                                <p>
                                                                        <span
                                                                                className={`px-2 py-1 rounded-full text-xs ${currentYarn.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                                                        >
                                                                                {currentYarn.activeFlag ? "Active" : "Inactive"}
                                                                        </span>
                                                                </p>
                                                        </div>
                                                </div>
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