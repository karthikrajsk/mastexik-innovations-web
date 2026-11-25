import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createProcessMaster, deleteProcessMaster, getAllProcessMaster, updateProcessMaster } from "@/state/processMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, UseFormSetError } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface ProcessData {
  id: number;
  processName: string;
  description: string;
  activeFlag: boolean;
  goodsType?: string;
}

interface ProcessFormData {
  id?: number | null;
  processName: string;
  description: string;
  activeFlag: boolean;
  goodsType: string;
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

const handleProcessSaveError = (error: any, setError: UseFormSetError<ProcessFormData>) => {
  const message = resolveApiErrorMessage(error, "Failed to save process");
  const normalized = (message || "").toLowerCase();
  const field: keyof ProcessFormData = normalized.includes("goods")
    ? "goodsType"
    : "processName";
  setError(field, { type: "server", message }, { shouldFocus: true });
  return message;
};

export function ProcessMaster() {
  const { processMasterList, pagination } = useSelector((state: RootState) => state.process);
  const dispatch = useDispatch<AppDispatch>();

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
  const [currentProcess, setCurrentProcess] = useState<ProcessData | null>(null); // Renamed from currentDefect
  const [isEditing, setIsEditing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Suggestions state for processName
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1); // For keyboard navigation

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    setError,
    formState: { errors, isValid }
  } = useForm<ProcessFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  // Watch form values
  const processNameValue = watch("processName");
  const goodsTypeValue = watch("goodsType");

  // Existing names for suggestions
  const existingNames = useMemo(
    () => (processMasterList || []).map((p: any) => (p?.processName ?? "")).filter(Boolean),
    [processMasterList]
  );

  const filteredSuggestions = useMemo(() => {
    const q = (processNameValue || "").toLowerCase();
    if (!q) return [] as string[];
    return existingNames
      .filter((name: string) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [processNameValue, existingNames]);

  const goodsTypes = ["Fabric", "Yarn", "Both"] as const;

  // Live duplicate check for message display
  useEffect(() => {
    const currentName = (processNameValue || "").trim().toLowerCase();
    if (!currentName) {
      setDuplicateError("");
      return;
    }

    const excludeName = isEditing ? (currentProcess?.processName || "").toLowerCase() : "";
    const isDuplicate = existingNames.some(
      (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
    );

    setDuplicateError(isDuplicate ? "This process name already exists" : "");

    if (currentName) {
      trigger("processName");
    }
  }, [processNameValue, isEditing, currentProcess, existingNames, trigger]);

  useEffect(() => {
    dispatch(getAllProcessMaster({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllProcessMaster({
      fetchAll: true,
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

  // Keyboard navigation for suggestions
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
          selectSuggestion(filteredSuggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      case 'Tab':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  const selectSuggestion = (suggestion: string) => {
    console.log("Selected suggestion:", suggestion); // Debug log
    setValue("processName", suggestion, {
      shouldValidate: true,
      shouldDirty: true
    });
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");

    // Force trigger validation immediately
    setTimeout(() => {
      trigger("processName");
    }, 0);
  };

  const processedCityList = useMemo(() => {
    return processMasterList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [processMasterList, pagination.offset]);

  const columns = useMemo(() => [
    {
      Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
      width: 50,
      disableFilters: true,
    },
    { Header: "Process Name", accessor: "processName" },
    { Header: "Description", accessor: "description" },
    {
      Header: "Status",
      accessor: "activeFlag",
      Filter: BooleanFilter,
      Cell: ({ value }: { value: boolean }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ], []);

  const handleOpenModal = (editing = false, process: ProcessData | null = null) => {
    if (editing && process) {
      reset({ ...process, goodsType: process.goodsType ?? "Fabric" });
      setCurrentProcess(process);
    } else {
      reset({ id: null, processName: "", description: "", activeFlag: true, goodsType: "Fabric" });
      setCurrentProcess(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
    setDuplicateError("");
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleDelete = (process: ProcessData) => {
    setCurrentProcess(process);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentProcess) return;
    await dispatch(deleteProcessMaster(currentProcess.id));
    resetPage();
    await dispatch(getAllProcessMaster({ fetchAll: true }));
    setIsDeleteModalOpen(false);
    setCurrentProcess(null);
  };

  const onSubmit = async (data: ProcessFormData) => {
    const normalized: any = {
      ...data,
      activeFlag: typeof data.activeFlag === 'string' ? data.activeFlag === 'true' : data.activeFlag,
    };

    try {
      if (isEditing) {
        await dispatch(updateProcessMaster(normalized)).unwrap();
      } else {
        await dispatch(createProcessMaster(normalized)).unwrap();
      }
      resetPage();
      await dispatch(getAllProcessMaster({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
      setDuplicateError("");
      setShowSuggestions(false);
      setCurrentProcess(null);
    } catch (error: any) {
      handleProcessSaveError(error, setError);
      console.error("Error submitting process:", error);
    }
  };

  const handleView = (process: ProcessData) => {
    setCurrentProcess(process);
    setIsViewModalOpen(true);
  };

  const handleEdit = (process: ProcessData) => {
    setIsEditing(true);
    setCurrentProcess(process);
    reset({
      id: process.id,
      processName: process.processName,
      description: process.description,
      activeFlag: process.activeFlag,
      goodsType: process.goodsType ?? "Fabric"
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Process Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Process..."
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Process" : "Add Process"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* <div>
            <label className="block text-sm font-medium">
              Goods Types <span className="text-red-600">*</span>
            </label>

            <CommonSearchableSelect
              options={(goodsTypes || []).map((gt: string) => ({
                value: gt,
                label: gt
              }))}
              placeholder="Select Goods Type"
              value={goodsTypeValue || "Fabric"}
              {...register("goodsType", {
                required: "Goods Type is required"
              })}
              onChange={(value: string) => {
                setValue("goodsType", value, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
              error={errors.goodsType?.message as string}
            />
          </div> */}
          <div>
            <label className="block text-sm font-medium">
              Goods Types <span className="text-red-600">*</span>
            </label>

            <CommonSearchableSelect
              options={(goodsTypes || []).map((gt: string) => ({
                value: gt,
                label: gt
              }))}
              placeholder="Select Goods Type"
              value={goodsTypeValue || "Fabric"}
              {...register("goodsType", {
                required: "Goods Type is required"
              })}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const value = e.target.value; // extract the value
                setValue("goodsType", value, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }}
              error={errors.goodsType?.message as string}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium">Process Name <span className="text-red-600">*</span></label>
            <input
              {...register("processName", {
                required: "Process Name is required",
                validate: (value) => {
                  const val = (value || "").trim().toLowerCase();
                  if (!val) return "Process Name is required";
                  const excludeName = isEditing ? (currentProcess?.processName || "").toLowerCase() : "";
                  const exists = existingNames.some((n: string) => n.toLowerCase() === val && n.toLowerCase() !== excludeName);
                  return exists ? "This process name already exists" : true;
                },
              })}
              className="input mt-1"
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setValue("processName", e.target.value, { shouldValidate: true });
                setShowSuggestions(true);
                setActiveSuggestionIndex(-1);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />

            {showSuggestions && filteredSuggestions.length > 0 && (
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
                      selectSuggestion(s);
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}

            {duplicateError && !errors.processName && (
              <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
            )}
            {errors.processName && (
              <p className="mt-1 text-sm text-red-600">{String(errors.processName.message)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea {...register("description")} className="input mt-1"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <select {...register("activeFlag", { required: "Status is required" })} className="input mt-1">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${!isValid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'btn-primary hover:bg-blue-700'
                } transition-colors duration-200`}
              disabled={!isValid}
              title={!isValid ? "Please fill all required fields" : ""}
            >
              {isEditing ? "Update Process" : "Add Process"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete this process?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Process Details">
        {currentProcess && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Process Name</p>
                <p className="font-medium">{currentProcess.processName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{currentProcess.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Goods Type</p>
                <p className="font-medium">{currentProcess.goodsType || "Fabric"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentProcess.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentProcess.activeFlag ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}