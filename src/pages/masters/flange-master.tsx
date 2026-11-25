import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createFlange, deleteFlange, getAllFlanges, updateFlange } from "@/state/flangeSlice";
import { AppDispatch, RootState } from "@/state/store";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, UseFormSetError } from "react-hook-form";
import { useDispatch, useSelector } from 'react-redux';
import { BooleanFilter } from "@/components/filters";

interface FlangeFormDate {
  id?: number | null;
  flangeNo: string;
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

const handleFlangeSaveError = (error: any, setError: UseFormSetError<FlangeFormDate>) => {
  const message = resolveApiErrorMessage(error, "Failed to save flange");
  setError("flangeNo", { type: "server", message }, { shouldFocus: true });
  return message;
};

export function FlangeMaster() {

  const { flangeList, pagination } = useSelector((state: RootState) => state.flange);
  const [selectedflange, setSelectedflange] = React.useState<FlangeFormDate | null>(null);
  const [flange, setFlange] = useState(flangeList);
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    setItemsPerPage,
    getOffset,
  } = usePagination({ itemsPerPage: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentflange, setCurrentflange] = useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const safeFlangeList = useMemo(() => (Array.isArray(flangeList) ? flangeList : []), [flangeList]);

  const selectedCompanyId = useMemo(() => {
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return v ? Number(v) : undefined;
  }, []);

  // const { register, handleSubmit, reset, formState: { errors } } = useForm<FlangeFormDate>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, touchedFields, isValid }
  } = useForm<FlangeFormDate>({
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onBlur' // Re-validate on blur
  });

  // Suggestion states and duplicate check
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");

  // Watch flangeNo value for live suggestions
  const flangeNoValue = watch("flangeNo");

  // Existing flange numbers for suggestions
  const existingFlangeNos = useMemo(
    () => safeFlangeList.map((f: any) => (f?.flangeNo ?? "")).filter(Boolean),
    [safeFlangeList]
  );

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const filteredSuggestions = useMemo(() => {
    const q = (flangeNoValue || "").toLowerCase();
    if (!q) return [] as string[];
    return existingFlangeNos
      .filter((name: string) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [flangeNoValue, existingFlangeNos]);

  // Live duplicate check for flangeNo
  useEffect(() => {
    const current = (flangeNoValue || "").trim().toLowerCase();
    if (!current) {
      setDuplicateError("");
      return;
    }
    const exclude = isEditing ? (currentflange?.flangeNo || "").toLowerCase() : "";
    const isDuplicate = existingFlangeNos.some(
      (n: string) => n.toLowerCase() === current && n.toLowerCase() !== exclude
    );
    setDuplicateError(isDuplicate ? "This flange no already exists" : "");
  }, [flangeNoValue, isEditing, currentflange, existingFlangeNos]);

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
    setValue("flangeNo", suggestion, {
      shouldValidate: true,
      shouldDirty: true
    });
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) return;
    dispatch(getAllFlanges({
      companyId: Number(storedCompanyId),
     fetchAll: true,
    }));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);


  const processedFlangeList = useMemo(() => {
    const baseSerial = pagination?.offset || 0;
    return safeFlangeList.map((city: any, index: number) => ({
      ...city,
      serialNo: baseSerial + index + 1,
    }));
  }, [safeFlangeList, pagination?.offset]);

  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true, },
      { Header: "Empty Beam No", accessor: "flangeNo" },
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
    setCurrentflange(state);
    reset({ id: state.id, flangeNo: state.flangeNo, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  const handleView = (state: any) => {
    setCurrentflange(state);
    setIsViewModalOpen(true);
  };

  const handleOpenModal = (editing = false, flange: FlangeFormDate | null = null) => {
    if (editing && flange) {
      reset({
        id: flange.id,
        flangeNo: flange.flangeNo,
        activeFlag: flange.activeFlag
      });
      setFlange(flange);
    } else {
      reset({
        id: null,
        flangeNo: '',
        activeFlag: true
      });
      setFlange(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: FlangeFormDate) => {
    try {
      console.log('Form data submitted:', data);

      const companyIdRaw = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const companyId = companyIdRaw ? Number(companyIdRaw) : undefined;
      console.log('Company ID:', companyId);
      
      if (!companyId) {
        console.error('Company ID is required');
        return;
      }

      const extraFields = {
        companyId,
        isIssued: 0,
        isSizingBeam: 0,
        isBeamGating: 0,
      };

      if (isEditing) {
        await dispatch(updateFlange({
          ...data,
          ...extraFields,
        })).unwrap();
      } else {
        const { id, ...newFlangeData } = data;
        await dispatch(createFlange({
          ...newFlangeData,
          ...extraFields,
        })).unwrap();
      }

      resetPage();
      await dispatch(getAllFlanges({
        companyId,
        fetchAll: true,
      }));
      clearErrors();
      setShowSuggestions(false);
      setDuplicateError("");
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      const message = handleFlangeSaveError(error, setError);
      setDuplicateError(message);
      setShowSuggestions(false);
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = (state: any) => {
    setCurrentflange(state);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentflange) return;
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) return;

    try {
      await dispatch(deleteFlange({ id: currentflange.id, companyId: Number(storedCompanyId) })).unwrap();
      resetPage();
      await dispatch(getAllFlanges({
        companyId: Number(storedCompanyId),
        fetchAll: true,
      }));
    } catch (error) {
      console.error("Error deleting flange:", error);
    }

    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processedFlangeList}
        title="Flange Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search flange..."
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //       totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        searchQueryParams={selectedCompanyId ? { companyId: selectedCompanyId } : undefined}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Flange" : "Add Flange"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* <div>
            <label className="block text-sm font-medium">Empty Beam No</label>
            <input {...register("flangeNo", { required: "Empty Beam No is required" })} className="input mt-1" />
            {errors.flangeNo && <p className="mt-1 text-sm text-red-600">{errors.flangeNo.message}</p>}
          </div> */}
          <div className="relative">
            <label className="block text-sm font-medium text-secondary-700">Empty Beam No <span className="text-red-600">*</span></label>
            <input
              {...register("flangeNo", {
                required: "Empty Beam No is required",
                validate: (value) => {
                  const val = (value || "").trim().toLowerCase();
                  if (!val) return true;
                  const exclude = isEditing ? (currentflange?.flangeNo || "").toLowerCase() : "";
                  const exists = existingFlangeNos.some((n: string) => n.toLowerCase() === val && n.toLowerCase() !== exclude);
                  return exists ? "This flange no already exists" : true;
                }
              })}
              placeholder="Enter Empty Beam No"
              autoComplete="off"
              className={`input mt-1 ${errors.flangeNo ? 'border-red-500' : ''}`}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setValue("flangeNo", e.target.value, { shouldValidate: true });
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
            />
            {(showSuggestions && filteredSuggestions.length > 0) && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                {filteredSuggestions.map((s: string, index: number) => (
                  <li
                    key={s}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${index === activeSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''}`}
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
            {duplicateError && !errors.flangeNo && (
              <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
            )}
            {errors.flangeNo && (
              <p className="mt-1 text-sm text-red-600">{errors.flangeNo.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              {...register("activeFlag", {
                // Coerce string "true"/"false" from select to actual boolean
                setValueAs: (v) => v === 'true' || v === true,
              })}
              className="input mt-1"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          {/* <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{isEditing ? "Update flange" : "Add flange"}</button>
          </div> */}
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
              {isEditing ? "Update Flange" : "Add Flange"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete flange "{currentflange?.flangeNo}"?</p>
          {/* <p className="text-red-600 text-sm">This action cannot be undone.</p> */}
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="flange Details">
        {currentflange && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Empty Beam No</p>
                <p className="font-medium">{currentflange.flangeNo}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentflange.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentflange.activeFlag ? "Active" : "Inactive"}
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

