
// import { DataTable } from "@/components/data/DataTable";
// import { Modal } from "@/components/ui/Modal";
// import { Pagination, usePagination } from "@/components/common/Pagination"; // ✅ Import reusable components
// import { getAllCategories } from "@/state/categorySlice";
// import { AppDispatch, RootState } from "@/state/store";
// import { createSubCategory, deleteSubCategory, getAllSubCategories, getSubCategoryByCategory, updateSubCategory } from "@/state/subCategorySlice";
// import { BooleanFilter } from "@/components/filters";
// import React, { useEffect } from "react";
// import { useMemo, useState } from "react";
// import { useForm } from "react-hook-form";
// import { useDispatch, useSelector } from "react-redux";

// interface subcategoryData {
//   id?: number;
//   categorySno: string;
//   categoryName: string;
//   subCategoryName: string;
//   activeFlag: boolean;
// }

// interface subcategoryFormData {
//   id?: number | null;
//   categorySno: string;
//   subCategoryName: string;
//   activeFlag: boolean;
// }

// export function SubCategoryMaster() {
//   const { subCategoryList, pagination, subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
//   const { categoryList } = useSelector((state: RootState) => state.category);

//   // ✅ Use the reusable pagination hook
//   const {
//     currentPage,
//     itemsPerPage,
//     setItemsPerPage,
//     handlePageChange,
//     resetPage,
//     getOffset
//   } = usePagination({ itemsPerPage: 10 });

//   const [subcategory, setSubCategory] = useState(subCategoryList);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [currentSubCategory, setcurrentSubCategory] = useState<any>(null);
//   const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
//   const [isEditing, setIsEditing] = React.useState(false);
//   const dispatch = useDispatch<AppDispatch>();

//   // Suggestion states
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
//   const [duplicateError, setDuplicateError] = useState<string>("");

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     trigger,
//     formState: { errors, isValid }
//   } = useForm<subcategoryFormData>({
//     mode: 'onChange',
//     reValidateMode: 'onChange'
//   });

//   // Watch form values
//   const categorySnoValue = watch("categorySno");
//   const subCategoryNameValue = watch("subCategoryName");

//   // Get current category name
//   const currentCategoryName = useMemo(() => {
//     if (!categorySnoValue) return "";
//     const category = categoryList.find((c: any) => String(c.id) === categorySnoValue);
//     return category ? category.categoryName : "";
//   }, [categorySnoValue, categoryList]);

//   // Existing subcategories for the selected category
//   const existingSubCategories = useMemo(() => {
//     if (!categorySnoValue) return [];
//     return subCategoryList
//       .filter((sc: any) => String(sc.categorySno) === categorySnoValue)
//       .map((sc: any) => (sc?.subCategoryName ?? ""))
//       .filter(Boolean);
//   }, [categorySnoValue, subCategoryList]);

//   const filteredSuggestions = useMemo(() => {
//     const q = (subCategoryNameValue || "").toLowerCase();
//     if (!q || !categorySnoValue) return [] as string[];
//     return existingSubCategories
//       .filter((name: string) => name.toLowerCase().includes(q))
//       .slice(0, 8);
//   }, [subCategoryNameValue, categorySnoValue, existingSubCategories]);

//   // Live duplicate check
//   useEffect(() => {
//     const currentName = (subCategoryNameValue || "").trim().toLowerCase();
//     if (!currentName || !categorySnoValue) {
//       setDuplicateError("");
//       return;
//     }
//     const excludeName = isEditing ? (currentSubCategory?.subCategoryName || "").toLowerCase() : "";
//     const isDuplicate = existingSubCategories.some(
//       (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
//     );
//     setDuplicateError(isDuplicate ? `This subcategory name already exists in this ${currentCategoryName} category` : "");

//     if (currentName && categorySnoValue) {
//       trigger("subCategoryName");
//     }
//   }, [subCategoryNameValue, categorySnoValue, isEditing, currentSubCategory, existingSubCategories, currentCategoryName, trigger]);

//   // Keyboard navigation for suggestions
//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (!showSuggestions || filteredSuggestions.length === 0) return;

//     switch (e.key) {
//       case 'ArrowDown':
//         e.preventDefault();
//         setActiveSuggestionIndex(prev =>
//           prev < filteredSuggestions.length - 1 ? prev + 1 : 0
//         );
//         break;
//       case 'ArrowUp':
//         e.preventDefault();
//         setActiveSuggestionIndex(prev =>
//           prev > 0 ? prev - 1 : filteredSuggestions.length - 1
//         );
//         break;
//       case 'Enter':
//         if (activeSuggestionIndex >= 0) {
//           e.preventDefault();
//           handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
//         }
//         break;
//       case 'Escape':
//         setShowSuggestions(false);
//         setActiveSuggestionIndex(-1);
//         break;
//       default:
//         break;
//     }
//   };

//   // Suggestion click handler
//   const handleSuggestionClick = (suggestion: string) => {
//     setValue("subCategoryName", suggestion, {
//       shouldValidate: true,
//       shouldDirty: true
//     });
//     setShowSuggestions(false);
//     setActiveSuggestionIndex(-1);
//     setDuplicateError("");
//   };

//   // ✅ Fetch data when page changes - using reusable hook
//   useEffect(() => {
//     dispatch(getAllSubCategories({ 
//       offset: getOffset(), 
//       limit: itemsPerPage 
//     }));
//     dispatch(getAllCategories({fetchAll: true}));
//   }, [currentPage, dispatch, getOffset, itemsPerPage]);

//   const processedCityList = useMemo(() => {
//     return subCategoryList.map((city: any, index: number) => ({
//       ...city,
//       serialNo: (pagination.offset || 0) + index + 1
//     }));
//   }, [subCategoryList, pagination.offset]);

//   const columns = useMemo(
//     () => [
//       {
//         Header: 'S.No',
//         accessor: 'serialNo',
//         width: 50,
//         disableFilters: true,
//       },
//       {
//         Header: 'Category Name',
//         accessor: 'categoryName',
//       },
//       {
//         Header: 'SubCatgory Name',
//         accessor: 'subCategoryName',
//       },
//       {
//         Header: "Status",
//         accessor: "activeFlag",
//         Filter: BooleanFilter,
//         Cell: ({ value }: { value: boolean }) => (
//           <span
//             className={`px-2 py-1 rounded-full text-xs ${
//               value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
//             }`}
//           >
//             {value ? "Active" : "Inactive"}
//           </span>
//         ),
//       },
//     ],
//     []
//   );

//   const handleEdit = (state: any) => {
//     setIsEditing(true);
//     setcurrentSubCategory(state);
//     reset({
//       id: state.id,
//       categorySno: String(state.categorySno),
//       subCategoryName: state.subCategoryName,
//       activeFlag: state.activeFlag
//     });
//     setIsModalOpen(true);
//     setShowSuggestions(false);
//     setActiveSuggestionIndex(-1);
//   };

//   const handleDelete = (state: any) => {
//     setcurrentSubCategory(state);
//     setIsDeleteModalOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!currentSubCategory) return;

//     try {
//       await dispatch(deleteSubCategory(currentSubCategory.id)).unwrap();
//       // ✅ Reset to page 0 after delete using reusable hook
//       resetPage();
//       await dispatch(getAllSubCategories({ offset: 0, limit: itemsPerPage }));
//     } catch (error) {
//       console.error("Error deleting country:", error);
//     }

//     setIsDeleteModalOpen(false);
//   };

//   const handleView = (state: any) => {
//     setcurrentSubCategory(state);
//     setIsViewModalOpen(true);
//   };

//   const handleOpenModal = (editing = false, state: subcategoryData | null = null) => {
//     if (editing && state) {
//       reset({
//         id: state.id,
//         categorySno: String(state.categorySno),
//         subCategoryName: state.subCategoryName,
//         activeFlag: state.activeFlag
//       });
//       setSubCategory(state);
//     } else {
//       reset({
//         id: null,
//         categorySno: '',
//         subCategoryName: '',
//         activeFlag: true
//       });
//       setSubCategory(null);
//     }
//     setIsEditing(editing);
//     setIsModalOpen(true);
//     setShowSuggestions(false);
//     setActiveSuggestionIndex(-1);
//     setDuplicateError("");
//   };

//   const onSubmit = async (data: subcategoryFormData) => {
//     try {
//       console.log('Form data submitted:', data);

//       if (isEditing) {
//         await dispatch(updateSubCategory(data)).unwrap();
//       } else {
//         const { id, ...newSubCategoryData } = data;
//         await dispatch(createSubCategory(newSubCategoryData)).unwrap();
//       }

//       // ✅ Reset to page 0 after submit using reusable hook
//       resetPage();
//       await dispatch(getAllSubCategories({ offset: 0, limit: itemsPerPage }));

//       setIsModalOpen(false);
//       reset();
//       setShowSuggestions(false);
//       setActiveSuggestionIndex(-1);
//       setDuplicateError("");
//     } catch (error: any) {
//       console.error('Error submitting form:', error);
//       const serverMessage =
//         typeof error?.payload === "string"
//           ? error.payload
//           : error?.payload?.message || error?.message || "An unexpected error occurred";
//       setDuplicateError(serverMessage);
//     }
//   };

//   return (
//     <div className="p-6 pt-16">
//       {/* <h1 className="text-2xl font-semibold mb-6">subcategory Management</h1> */}
//       <DataTable
//         columns={columns}
//         data={processedCityList}
//         title="Subcategory Master"
//         onAdd={() => handleOpenModal(false)}
//         onEdit={handleEdit}
//         // onDelete={handleDelete}
//         onView={handleView}
//         showActions={true}
//         filterPlaceholder="Search subcategory..."
//         showColumnFilters={true}
//         initialPageSize={itemsPerPage}
//         onPageSizeChange={setItemsPerPage}
//       />

//       {/* ✅ Use the reusable Pagination component */}
//       <Pagination
//         currentPage={currentPage}
//         totalItems={pagination.total}
//         itemsPerPage={itemsPerPage}
//         offset={pagination.offset || 0}
//         hasNext={!!pagination.next}
//         hasPrev={!!pagination.prev}
//         onPageChange={handlePageChange}
//       />

//       {/* Add/Edit Modal */}
//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title={isEditing ? 'Edit Subcategory' : 'Add Subcategory'}
//       >
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium">Select Category <span className="text-red-600">*</span></label>
//             <select
//               {...register("categorySno", { required: "Category is required" })}
//               className="input mt-1"
//               onChange={(e) => {
//                 setValue("categorySno", e.target.value, { shouldValidate: true });
//                 setValue("subCategoryName", "", { shouldValidate: true });
//                 setShowSuggestions(false);
//                 setActiveSuggestionIndex(-1);
//               }}
//             >
//               <option value="">Select a Category</option>
//               {categoryList?.map((category: any) => (
//                 <option key={category.id} value={String(category.id)}>{category.categoryName}</option>
//               ))}
//             </select>
//             {errors.categorySno && <p className="mt-1 text-sm text-red-600">{errors.categorySno.message}</p>}
//           </div>

//           <div className="relative">
//             <label className="block text-sm font-medium text-secondary-700">SubCategory Name <span className="text-red-600">*</span></label>
//             <input
//               {...register('subCategoryName', {
//                 required: 'SubCategory Name is required',
//                 validate: (value) => {
//                   const val = (value || "").trim().toLowerCase();
//                   if (!val || !categorySnoValue) return "SubCategory Name is required";
//                   const excludeName = isEditing ? (currentSubCategory?.subCategoryName || "").toLowerCase() : "";
//                   const exists = existingSubCategories.some((n: string) => n.toLowerCase() === val && n.toLowerCase() !== excludeName);
//                   return exists ? `This subcategory name already exists in this ${currentCategoryName} category` : true;
//                 },
//               })}
//               placeholder="Enter SubCategory Name"
//               className="input mt-1"
//               onFocus={() => setShowSuggestions(true)}
//               onChange={(e) => {
//                 setValue("subCategoryName", e.target.value, { shouldValidate: true });
//                 setShowSuggestions(true);
//                 setActiveSuggestionIndex(-1);
//               }}
//               onBlur={() => {
//                 setTimeout(() => {
//                   setShowSuggestions(false);
//                   setActiveSuggestionIndex(-1);
//                 }, 200);
//               }}
//               onKeyDown={handleKeyDown}
//               autoComplete="off"
//               disabled={!categorySnoValue}
//             />

//             {(showSuggestions && filteredSuggestions.length > 0) && (
//               <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
//                 {filteredSuggestions.map((s: string, index: number) => (
//                   <li
//                     key={s}
//                     className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
//                       index === activeSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''
//                     }`}
//                     onMouseEnter={() => setActiveSuggestionIndex(index)}
//                     onClick={(e) => {
//                       e.preventDefault();
//                       e.stopPropagation();
//                       handleSuggestionClick(s);
//                     }}
//                     onMouseDown={(e) => e.preventDefault()}
//                   >
//                     {s}
//                   </li>
//                 ))}
//               </ul>
//             )}

//             {!categorySnoValue && (
//               <p className="mt-1 text-sm text-yellow-600">Please select a category first</p>
//             )}
//             {duplicateError && !errors.subCategoryName && (
//               <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
//             )}
//             {errors.subCategoryName && (
//               <p className="mt-1 text-sm text-red-600">{String(errors.subCategoryName.message)}</p>
//             )}
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-secondary-700">Status</label>
//             <select {...register('activeFlag')} className="input mt-1">
//               <option value="true">Active</option>
//               <option value="false">Inactive</option>
//             </select>
//           </div>

//           <div className="flex justify-end space-x-3 pt-4">
//             <button
//               type="button"
//               onClick={() => setIsModalOpen(false)}
//               className="btn btn-secondary"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className={`btn ${
//                 !isValid
//                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
//                   : 'btn-primary hover:bg-blue-700'
//               } transition-colors duration-200`}
//               disabled={!isValid}
//               title={!isValid ? "Please fill all required fields" : ""}
//             >
//               {isEditing ? "Update Subcategory" : "Add Subcategory"}
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         isOpen={isDeleteModalOpen}
//         onClose={() => setIsDeleteModalOpen(false)}
//         title="Confirm Delete"
//       >
//         <div className="space-y-4">
//           <p>Are you sure you want to delete subcategory?</p>
//           <div className="flex justify-end space-x-3 pt-4">
//             <button
//               onClick={() => setIsDeleteModalOpen(false)}
//               className="btn btn-secondary"
//             >
//               Cancel
//             </button>
//             <button onClick={confirmDelete} className="btn btn-danger">
//               Delete
//             </button>
//           </div>
//         </div>
//       </Modal>

//       {/* View Modal */}
//       <Modal
//         isOpen={isViewModalOpen}
//         onClose={() => setIsViewModalOpen(false)}
//         title="Subcategory Details"
//       >
//         {currentSubCategory && (
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-sm text-secondary-500">Category Name</p>
//                 <p className="font-medium">{currentSubCategory.categoryName}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">SubCategory Name</p>
//                 <p className="font-medium">{currentSubCategory.subCategoryName}</p>
//               </div>
//               <div>
//                 <p className="text-sm">Status</p>
//                 <p>
//                   <span
//                     className={`px-2 py-1 rounded-full text-xs ${
//                       currentSubCategory.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
//                     }`}
//                   >
//                     {currentSubCategory.activeFlag ? "Active" : "Inactive"}
//                   </span>
//                 </p>
//               </div>
//             </div>
//             <div className="flex justify-end pt-4">
//               <button
//                 onClick={() => setIsViewModalOpen(false)}
//                 className="btn btn-secondary"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// }

import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination"; // ✅ Import reusable components
import { getAllCategories } from "@/state/categorySlice";
import { AppDispatch, RootState } from "@/state/store";
import { createSubCategory, deleteSubCategory, getAllSubCategories, getSubCategoryByCategory, updateSubCategory } from "@/state/subCategorySlice";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect } from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface subcategoryData {
  id?: number;
  categorySno: string;
  categoryName: string;
  subCategoryName: string;
  activeFlag: boolean;
}

interface subcategoryFormData {
  id?: number | null;
  categorySno: string;
  subCategoryName: string;
  activeFlag: boolean;
}

const areDuplicateNames = (name1: string, name2: string): boolean => {
  const trimmed1 = name1.trim();
  const trimmed2 = name2.trim();

  // Exact match (case-insensitive)
  if (trimmed1.toLowerCase() === trimmed2.toLowerCase()) {
    return true;
  }

  // Check if both are numeric representations
  const isNumeric1 = /^\d+$/.test(trimmed1);
  const isNumeric2 = /^\d+$/.test(trimmed2);

  if (isNumeric1 && isNumeric2) {
    // Convert to numbers and compare
    return Number(trimmed1) === Number(trimmed2);
  }

  return false;
};

// You can remove the old normalizeSubcategoryKey function or keep it if used elsewhere
const normalizeSubcategoryKey = (value?: string) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const lowered = trimmed.toLowerCase();
  const numericPattern = /^\d+$/;
  if (numericPattern.test(lowered)) {
    return String(Number(lowered));
  }
  return lowered;
};


export function SubCategoryMaster() {
  const { subCategoryList, pagination, subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { categoryList } = useSelector((state: RootState) => state.category);

  // ✅ Use the reusable pagination hook
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    setItemsPerPage,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const [subcategory, setSubCategory] = useState(subCategoryList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentSubCategory, setcurrentSubCategory] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isEditing, setIsEditing] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Suggestion states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [duplicateError, setDuplicateError] = useState<string>("");
  const [allSubCategoriesForValidation, setAllSubCategoriesForValidation] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isValid }
  } = useForm<subcategoryFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  // Watch form values
  const categorySnoValue = watch("categorySno");
  const subCategoryNameValue = watch("subCategoryName");

  // Get current category name
  const currentCategoryName = useMemo(() => {
    if (!categorySnoValue) return "";
    const category = categoryList.find((c: any) => String(c.id) === categorySnoValue);
    return category ? category.categoryName : "";
  }, [categorySnoValue, categoryList]);

  const categoryDropdownOptions = useMemo(() => {
    const categories = Array.isArray(categoryList) ? categoryList : [];
    const activeCategories = categories.filter((category: any) => category?.activeFlag);
    const selectedCategory = categorySnoValue
      ? categories.find((category: any) => String(category?.id) === categorySnoValue)
      : undefined;

    if (selectedCategory && !selectedCategory.activeFlag) {
      const alreadyIncluded = activeCategories.some(
        (category: any) => String(category?.id) === String(selectedCategory.id)
      );
      if (!alreadyIncluded) {
        return [...activeCategories, selectedCategory];
      }
    }

    return activeCategories;
  }, [categoryList, categorySnoValue]);

  useEffect(() => {
    if (!categorySnoValue || !currentCategoryName) {
      return;
    }

    dispatch(getSubCategoryByCategory({ categoryName: currentCategoryName, fetchAll: true }));
  }, [categorySnoValue, currentCategoryName, dispatch]);

  // Existing subcategories for the selected category
  const existingSubCategories = useMemo(() => {
    if (!categorySnoValue) return [];

    const seen = new Set<string>();
    const results: string[] = [];

    const matchesCategory = (item: any) => {
      if (!item) return false;
      if (item.categorySno !== undefined && String(item.categorySno) !== categorySnoValue) {
        return false;
      }
      if (currentCategoryName && item.categoryName && item.categoryName !== currentCategoryName) {
        return false;
      }
      return true;
    };

    const addIfValid = (name?: string) => {
      const trimmed = (name || "").trim();
      if (!trimmed) return;
      const key = normalizeSubcategoryKey(trimmed);
      if (!key || seen.has(key)) return;
      seen.add(key);
      results.push(trimmed);
    };

    const populateFromList = (list: any[]) => {
      list?.forEach((item: any) => {
        if (!matchesCategory(item)) return;
        addIfValid(item?.subCategoryName);
      });
    };

    if (Array.isArray(subCategoryByCategoryList) && subCategoryByCategoryList.length > 0) {
      populateFromList(subCategoryByCategoryList);
    } else {
      populateFromList(subCategoryList);
    }

    return results;
  }, [categorySnoValue, currentCategoryName, subCategoryByCategoryList, subCategoryList]);

  const filteredSuggestions = useMemo(() => {
    const q = (subCategoryNameValue || "").toLowerCase();
    if (!q || !categorySnoValue) return [] as string[];
    return existingSubCategories
      .filter((name: string) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [subCategoryNameValue, categorySnoValue, existingSubCategories]);

  // Live duplicate check
  // Live duplicate check
  useEffect(() => {
    const currentName = (subCategoryNameValue || "").trim();
    if (!currentName || !categorySnoValue) {
      setDuplicateError("");
      return;
    }

    const excludeName = isEditing ? (currentSubCategory?.subCategoryName || "").trim() : "";

    const isDuplicate = existingSubCategories.some((name: string) => {
      // Skip the current item if we're editing
      if (isEditing && excludeName && areDuplicateNames(name, excludeName)) {
        return false;
      }
      return areDuplicateNames(currentName, name);
    });

    setDuplicateError(isDuplicate ? `This subcategory name already exists in this ${currentCategoryName} category` : "");

    if (currentName && categorySnoValue) {
      trigger("subCategoryName");
    }
  }, [subCategoryNameValue, categorySnoValue, isEditing, currentSubCategory, existingSubCategories, currentCategoryName, trigger]);
  const isSubmitDisabled = !isValid || Boolean(duplicateError);
  const submitButtonTitle = duplicateError
    ? duplicateError
    : !isValid
      ? "Please fill all required fields"
      : "";

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (activeSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  // Suggestion click handler
  const handleSuggestionClick = (suggestion: string) => {
    setValue("subCategoryName", suggestion, {
      shouldValidate: true,
      shouldDirty: true
    });
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  // ✅ Fetch data when page changes - using reusable hook
  useEffect(() => {
    dispatch(getAllSubCategories({
      fetchAll: true,
    }));
    dispatch(getAllCategories({ fetchAll: true, activeOnly: true, includeId: Number(categorySnoValue) }));
  }, [currentPage, dispatch, getOffset, itemsPerPage, categorySnoValue]);

  const processedCityList = useMemo(() => {
    return subCategoryList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [subCategoryList, pagination.offset]);

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: 'Category Name',
        accessor: 'categoryName',
      },
      {
        Header: 'SubCatgory Name',
        accessor: 'subCategoryName',
      },
      {
        Header: "Status",
        accessor: "activeFlag",
        Filter: BooleanFilter,
        Cell: ({ value }: { value: boolean }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        ),
      },
    ],
    []
  );

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setcurrentSubCategory(state);
    reset({
      id: state.id,
      categorySno: String(state.categorySno),
      subCategoryName: state.subCategoryName,
      activeFlag: state.activeFlag
    });
    setIsModalOpen(true);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleDelete = (state: any) => {
    setcurrentSubCategory(state);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentSubCategory) return;

    try {
      await dispatch(deleteSubCategory(currentSubCategory.id)).unwrap();
      // ✅ Reset to page 0 after delete using reusable hook
      resetPage();
      await dispatch(getAllSubCategories({fetchAll:true})); 
    } catch (error) {
      console.error("Error deleting country:", error);
    }

    setIsDeleteModalOpen(false);
  };

  const handleView = (state: any) => {
    setcurrentSubCategory(state);
    setIsViewModalOpen(true);
  };

  const handleOpenModal = (editing = false, state: subcategoryData | null = null) => {
    if (editing && state) {
      reset({
        id: state.id,
        categorySno: String(state.categorySno),
        subCategoryName: state.subCategoryName,
        activeFlag: state.activeFlag
      });
      setSubCategory(state);
    } else {
      reset({
        id: null,
        categorySno: '',
        subCategoryName: '',
        activeFlag: true
      });
      setSubCategory(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  const onSubmit = async (data: subcategoryFormData) => {

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

    try {
      console.log('Form data submitted:', data);

      if (isEditing) {
        await dispatch(updateSubCategory(data)).unwrap();
      } else {
        const { id, ...newSubCategoryData } = data;
        await dispatch(createSubCategory(newSubCategoryData)).unwrap();
      }

      // ✅ Reset to page 0 after submit using reusable hook
      resetPage();
      await dispatch(getAllSubCategories({ fetchAll:true }));

      setIsModalOpen(false);
      reset();
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      clearErrors("subCategoryName");
      setDuplicateError("");
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const serverMessage = resolveApiErrorMessage(error, "");
      const trimmedSubCat = (subCategoryNameValue || "").trim();
      const fallbackMessage = trimmedSubCat && currentCategoryName
        ? `The ${currentCategoryName} category already contains sub-category '${trimmedSubCat}'`
        : "This subcategory already exists";
      const friendlyMessage = serverMessage && serverMessage.trim() ? serverMessage : fallbackMessage;
      setDuplicateError(friendlyMessage);
      setError("subCategoryName", { type: "manual", message: friendlyMessage }, { shouldFocus: true });
    }
  };

  return (
    <div className="p-6 pt-16">

      <DataTable
        columns={columns}
        data={processedCityList}
        title="Subcategory Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        hideDeleteAction={true}
        filterPlaceholder="Search subcategory..."
        showColumnFilters={true}
             disableFullDataFetch={true}

        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
      />

      {/* ✅ Use the reusable Pagination component */}
      {/* <Pagination
        currentPage={currentPage}
        totalItems={pagination.total}
        itemsPerPage={itemsPerPage}
        offset={pagination.offset || 0}
        hasNext={pagination.next ?? undefined}
        hasPrev={!!pagination.prev}
        onPageChange={handlePageChange}
      /> */}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Subcategory' : 'Add Subcategory'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* <div>
            <label className="block text-sm font-medium">
              Select Category <span className="text-red-600">*</span>
            </label>

            <CommonSearchableSelect
              options={(categoryDropdownOptions || []).map((category: any) => ({
                value: String(category.id),
                label: category.categoryName || `Category ${category.id}`,
              }))}
               value={categorySnoValue}
              placeholder="Select a Category"
              {...register("categorySno", { required: "Category is required" })}
              onChange={(value: string) => {
                setValue("categorySno", value, { shouldValidate: true });
                setValue("subCategoryName", "", { shouldValidate: true });
                clearErrors("subCategoryName");
                setDuplicateError("");
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
                
              }}
              error={errors.categorySno?.message as string}
                name="categorySno"
    onBlur={() => trigger("categorySno")}
            />
          </div> */}
          <div>
            <label className="block text-sm font-medium">
              Select Category <span className="text-red-600">*</span>
            </label>

            <CommonSearchableSelect
              options={(categoryDropdownOptions || []).map((category: any) => ({
                value: String(category.id),
                label: category.categoryName || `Category ${category.id}`,
              }))}
              placeholder="Select a Category"
              {...register("categorySno", { required: "Category is required" })}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const value = e.target.value; // <- extract value from event
                setValue("categorySno", value, { shouldValidate: true });
                setValue("subCategoryName", "", { shouldValidate: true });
                clearErrors("subCategoryName");
                setDuplicateError("");
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
              }}
              error={errors.categorySno?.message as string}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-secondary-700">SubCategory Name <span className="text-red-600">*</span></label>
            <input
              {...register('subCategoryName', {
                required: 'SubCategory Name is required',
                validate: (value) => {
                  const currentName = (value || "").trim();
                  if (!currentName || !categorySnoValue) return "SubCategory Name is required";

                  const excludeName = isEditing ? (currentSubCategory?.subCategoryName || "").trim() : "";

                  const exists = existingSubCategories.some((name: string) => {
                    // Skip the current item if we're editing
                    if (isEditing && excludeName && areDuplicateNames(name, excludeName)) {
                      return false;
                    }
                    return areDuplicateNames(currentName, name);
                  });

                  return exists ? `This subcategory name already exists in this ${currentCategoryName} category` : true;
                }
              })}
              placeholder="Enter SubCategory Name"
              className="input mt-1"
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setValue("subCategoryName", e.target.value, { shouldValidate: true });
                clearErrors("subCategoryName");
                setDuplicateError("");
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions(false);
                  setActiveSuggestionIndex(-1);
                }, 200);
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              disabled={!categorySnoValue}
            />

            {(showSuggestions && filteredSuggestions.length > 0) && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                {filteredSuggestions.map((s: string, index: number) => (
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

            {!categorySnoValue && (
              <p className="mt-1 text-sm text-yellow-600">Please select a category first</p>
            )}
            {duplicateError && !errors.subCategoryName && (
              <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
            )}
            {errors.subCategoryName && (
              <p className="mt-1 text-sm text-red-600">{String(errors.subCategoryName.message)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700">Status</label>
            <select {...register('activeFlag')} className="input mt-1">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
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
              className={`btn ${isSubmitDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                : 'btn-primary hover:bg-blue-700'
                } transition-colors duration-200`}
              disabled={isSubmitDisabled}
              title={submitButtonTitle}
            >
              {isEditing ? "Update Subcategory" : "Add Subcategory"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete subcategory?</p>
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

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Subcategory Details"
      >
        {currentSubCategory && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Category Name</p>
                <p className="font-medium">{currentSubCategory.categoryName}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">SubCategory Name</p>
                <p className="font-medium">{currentSubCategory.subCategoryName}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentSubCategory.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentSubCategory.activeFlag ? "Active" : "Inactive"}
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