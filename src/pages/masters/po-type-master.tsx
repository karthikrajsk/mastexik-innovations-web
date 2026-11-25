import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { createPoType, deletePoType, getAllPoTypes, updatePoType } from "@/state/poTypeMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface poTypeData {
  id: number;
  poTypeName: string;
  description: string;
  activeFlag: boolean;
}

interface poTypeFormData {
  id?: number | null;
  poTypeName: string;
  description: string;
  activeFlag: boolean;
}

export function PoTypeMaster() {

  const { poTypeList, pagination } = useSelector((state: RootState) => state.poTypeMaster);
  
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPoType, setCurrentPoType] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Suggestion states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<poTypeFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  // Watch form values
  const poTypeNameValue = watch("poTypeName");

  // Existing names for suggestions
  const existingNames = useMemo(
    () => poTypeList.map((c: any) => (c?.poTypeName ?? "")).filter(Boolean),
    [poTypeList]
  );

 const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const filteredSuggestions = useMemo(() => {
    const q = (poTypeNameValue || "").toLowerCase();
    if (!q) return [] as string[];
    return existingNames
      .filter((name: string) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [poTypeNameValue, existingNames]);

  // Live duplicate check for poTypeName
 useEffect(() => {
    const currentName = (poTypeNameValue || "").trim().toLowerCase();
    if (!currentName) {
      setDuplicateError("");
      return;
    }
    const excludeName = isEditing ? (currentPoType?.poTypeName || "").toLowerCase() : "";
    const isDuplicate = existingNames.some(
      (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
    );
    setDuplicateError(isDuplicate ? "This PO type name already exists" : "");
  }, [poTypeNameValue, isEditing, currentPoType, existingNames]);

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
          setValue("poTypeName", filteredSuggestions[activeSuggestionIndex]);
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue("poTypeName", suggestion);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  useEffect(() => {
    dispatch(getAllPoTypes({
      fetchAll: true,
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentPoType(null);
    reset({
      poTypeName: "",
      description: "",
      activeFlag: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (poType: poTypeData) => {
    setIsEditing(true);
    setCurrentPoType(poType);
    reset({
      id: poType.id,
      poTypeName: poType.poTypeName,
      description: poType.description || "",
      activeFlag: poType.activeFlag,
    });
    setIsModalOpen(true);
  };

  const handleView = (poType: poTypeData) => {
    setCurrentPoType(poType);
    setIsViewModalOpen(true);
  };

  const handleDelete = (poType: poTypeData) => {
    setCurrentPoType(poType);
    setIsDeleteModalOpen(true);
  };

  const onSubmit = async (data: poTypeFormData) => {
    try {
      setServerErrors({});

      if (isEditing && currentPoType) {
        await dispatch(updatePoType({ ...data, id: currentPoType.id })).unwrap();
      } else {
        await dispatch(createPoType(data)).unwrap();
      }

      resetPage();
      await dispatch(getAllPoTypes({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error("Error saving PO Type:", error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      setServerErrors({ poTypeName: serverMessage });
    }
  };

  const confirmDelete = async () => {
    if (!currentPoType) return;

    try {
      await dispatch(deletePoType(currentPoType.id)).unwrap();
      resetPage();
      await dispatch(getAllPoTypes({ fetchAll: true }));
    } catch (error) {
      console.error("Error deleting PO Type:", error);
    }

    setIsDeleteModalOpen(false);
  };

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 80,
        disableFilters: true,
      },
      {
        Header: "PO Type Name",
        accessor: "poTypeName",
      },
      {
        Header: "Description",
        accessor: "description",
      },
      {
        Header: "Status",
        accessor: "activeFlag",
        Cell: ({ value }: { value: boolean }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? "Active" : "Inactive"}
          </span>
        ),
        Filter: BooleanFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (filterValue === undefined || filterValue === null) return rows;
          return rows.filter(row => {
            const value = row.values[columnIds[0]];
            return value === filterValue;
          });
        }
      },
    ],
    []
  );

  const processedPoTypeList = useMemo(() => {
    return poTypeList.map((poType: any, index: number) => ({
      ...poType,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [poTypeList, pagination.offset]);

  return (
    <div className="p-6 pt-16">
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={processedPoTypeList}
          title="PO Type Master"
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
          showActions
          showColumnFilters
          filterPlaceholder="Search PO Types..."
          disableFullDataFetch={true}
          // initialPageSize={itemsPerPage}
          // onPageSizeChange={setItemsPerPage}
          // totalCount={pagination?.total || 0}
          // currentPage={currentPage}
          // onPageChange={handlePageChange}
        />
        {/* <Pagination
          currentPage={currentPage}
          totalItems={pagination.total}
          itemsPerPage={itemsPerPage}
          offset={pagination.offset || 0}
          hasNext={!!pagination.next}
          hasPrev={!!pagination.prev}
          onPageChange={handlePageChange}
        /> */}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setServerErrors({});
        }}
        title={isEditing ? "Edit PO Type" : "Add PO Type"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PO Type Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("poTypeName", {
                    required: "PO Type Name is required",
                    validate: (value) => {
                      if (!value || !value.trim()) return "PO Type Name cannot be empty";
                      return true;
                    },
                    onChange: (e) => {
                      if (serverErrors.poTypeName) {
                        setServerErrors({ ...serverErrors, poTypeName: "" });
                      }
                    }
                  })}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.poTypeName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter PO Type Name"
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((suggestion: string, index: number) => (
                      <div
                        key={index}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          index === activeSuggestionIndex ? 'bg-blue-100' : ''
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {serverErrors.poTypeName && !errors.poTypeName && !duplicateError && (
                <p className="mt-1 text-sm text-red-600">{serverErrors.poTypeName}</p>
              )}
              {errors.poTypeName && (
                <p className="mt-1 text-sm text-red-600">{errors.poTypeName.message}</p>
              )}
              {duplicateError && (
                <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
                rows={3}
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  {...register("activeFlag")}
                  type="checkbox"
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setServerErrors({});
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || !!duplicateError}
                className={`px-4 py-2 text-white rounded-md ${
                  !isValid || !!duplicateError
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary"
                }`}
              >
                {isEditing ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="PO Type Details"
        >
          {currentPoType && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Type Name
                </label>
                <p className="text-sm text-gray-900">{currentPoType.poTypeName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p className="text-sm text-gray-900">{currentPoType.description || "N/A"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  currentPoType.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {currentPoType.activeFlag ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          )}
        </Modal>

      {/* Delete Modal */}
        {/* <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        >
          <div className="space-y-4">
            <p>Are you sure you want to delete this PO Type?</p>
            <p className="text-red-600 text-sm">This action cannot be undone.</p>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal> */}
      </div>
    
  );
}