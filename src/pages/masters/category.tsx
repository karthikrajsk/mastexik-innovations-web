import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createCategory, deleteCategory, getAllCategories, updateCategory } from "@/state/categorySlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface categoryData {
  id: number;
  categoryName: string;
  activeFlag: boolean;
}

interface categoryFormData {
  id?: number | null;
  categoryName: string;
  activeFlag: boolean;
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

export function CategoryMaster() {

  const { categoryList, pagination } = useSelector((state: RootState) => state.category);
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });
  const [category, setCategory] = useState(categoryList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentCategory, setcurrentCategory] = useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Suggestion states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isValid }
  } = useForm<categoryFormData>({
    mode: 'onChange', // Changed to onChange for better UX
    reValidateMode: 'onChange'
  });

  // Watch form values
  const categoryNameValue = watch("categoryName");

  // Existing names for suggestions
  const existingNames = useMemo(
    () => categoryList.map((c: any) => (c?.categoryName ?? "")).filter(Boolean),
    [categoryList]
  );
  
 const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const filteredSuggestions = useMemo(() => {
    const q = (categoryNameValue || "").toLowerCase();
    if (!q) return [] as string[];
    return existingNames
      .filter((name: string) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [categoryNameValue, existingNames]);

  // Live duplicate check for categoryName
 useEffect(() => {
    const currentName = (categoryNameValue || "").trim().toLowerCase();
    if (!currentName) {
      setDuplicateError("");
      return;
    }
    const excludeName = isEditing ? (currentCategory?.categoryName || "").toLowerCase() : "";
    const isDuplicate = existingNames.some(
      (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
    );
    setDuplicateError(isDuplicate ? "This category name already exists" : "");
  }, [categoryNameValue, isEditing, currentCategory, existingNames]);

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
  
const handleSuggestionClick = (suggestion: string) => {
    setValue("categoryName", suggestion, { 
      shouldValidate: true, 
      shouldDirty: true 
    });
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  useEffect(() => {
    dispatch(getAllCategories({
      fetchAll: true,
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

   const processedCityList = useMemo(() => {
    return categoryList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [categoryList, pagination.offset]);

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true,
      },
      {
        Header: 'Category Name',
        accessor: 'categoryName',
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
    setcurrentCategory(state);
    reset({ id: state.id, categoryName: state.categoryName, activeFlag: state.activeFlag });
    setIsModalOpen(true);
    setShowSuggestions(false);
  };

  const handleDelete = (state: any) => {
    setcurrentCategory(state);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCategory) return;

    try {
      await dispatch(deleteCategory(currentCategory.id)).unwrap();
      await dispatch(getAllCategories({fetchAll: true}));
    } catch (error) {
      console.error("Error deleting category:", error);
    }

    setIsDeleteModalOpen(false);
  };

  const handleView = (state: any) => {
    setcurrentCategory(state);
    setIsViewModalOpen(true);
  };

  const handleOpenModal = (editing = false, state: categoryData | null = null) => {
    if (editing && state) {
      reset({
        id: state.id,
        categoryName: state.categoryName,
        activeFlag: state.activeFlag
      });
      setCategory(state);
    } else {
      reset({
        id: null,
        categoryName: '',
        activeFlag: true
      });
      setCategory(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
    setShowSuggestions(false);
    setDuplicateError("");
  };

  const handleCategorySaveError = (error: any) => {
    const message = resolveApiErrorMessage(error, "Failed to save category");
    const normalized = (message || "").toLowerCase();
    if (normalized.includes("status") || normalized.includes("active")) {
      setError("activeFlag", { type: "server", message }, { shouldFocus: true });
      return;
    }
    setError("categoryName", { type: "server", message }, { shouldFocus: true });
  };

  const onSubmit = async (data: categoryFormData) => {
    try {
      console.log('Form data submitted:', data); // Add this to debug

      if (isEditing) {
        await dispatch(updateCategory({
          ...data,
        })).unwrap();
      } else {
        const { ...newStateData } = data;
        await dispatch(createCategory({
          ...newStateData,
        })).unwrap();
      }
      dispatch(getAllCategories({
        fetchAll: true,
      }));
      setIsModalOpen(false);
      reset();
      clearErrors();
      setShowSuggestions(false);
      setDuplicateError("");
    } catch (error: any) {
      handleCategorySaveError(error);
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="p-6 pt-16">

            <DataTable
        columns={columns}
        data={processedCityList}
        title="Category Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search Category..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //       totalCount={pagination?.total || 0}
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit category' : 'Add category'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category Name with suggestions */}
          <div className="relative">
            <label className="block text-sm font-medium text-secondary-700">Category Name <span className="text-red-600">*</span></label>
            <input
              {...register('categoryName', {
                required: 'Category Name is required',
                validate: (value) => {
                  const val = (value || "").trim().toLowerCase();
                  if (!val) return true;
                  const excludeName = isEditing ? (currentCategory?.categoryName || "").toLowerCase() : "";
                  const exists = existingNames.some((n: string) => n.toLowerCase() === val && n.toLowerCase() !== excludeName);
                  return exists ? "This category name already exists" : true;
                },
              })}
              placeholder="Enter Category Name"
              className="input mt-1"
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setValue("categoryName", e.target.value, { shouldValidate: true });
                setShowSuggestions(true);
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
            />
            {(showSuggestions && filteredSuggestions.length > 0) && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                {filteredSuggestions.map((s: string, index: number) => (
                  <li
                    key={s}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                      index === activeSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''
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
            {duplicateError && !errors.categoryName && (
              <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
            )}
            {errors.categoryName && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Status</label>
            <select
              {...register('activeFlag')}
              className="input mt-1"
            >
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
              className={`btn 
                        ${!isValid
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
                  : 'btn-primary hover:bg-blue-700'
                }
                        transition-colors duration-200
                      `}
              disabled={!isValid}
              title={!isValid ? "Please fill all required fields" : ""}
            >
              {isEditing ? "Update Category" : "Add Category"}
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
          <p>Are you sure you want to delete category "{currentCategory?.categoryName}"?</p>
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
        title="Category Details"
      >
        {currentCategory && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Category Name</p>
                <p className="font-medium">{currentCategory.categoryName}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentCategory.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentCategory.activeFlag ? "Active" : "Inactive"}
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