import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { getAllCountries } from "@/state/countrySlice";
import { createState, deleteState, getAllStates, updateState } from "@/state/stateSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";


interface stateData {
  id: number;
  countryId: string;
  countryName: string;
  stateName: string;
  stateCode: string;
  activeFlag: boolean;
}

interface StateFormData {
  id?: number | null;
  countryId: string;
  countryName: string;
  stateName: string;
  stateCode: string;
  activeFlag: boolean;
}

export function StateMaster() {

  const { stateList, pagination } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const activeCountries = useMemo(() => {
    if (!Array.isArray(countryList)) return [];
    return countryList.filter((country: any) => country.activeFlag);
  }, [countryList]);
  const {
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const [state, setState] = useState(stateList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentState, setCurrentState] = useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>();
  // const { register, handleSubmit, reset, formState: { errors } } = useForm<StateFormData>();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, touchedFields, isValid }
  } = useForm<StateFormData>({
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onBlur' // Re-validate on blur
  });


  useEffect(() => {
    dispatch(getAllCountries({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllStates({
      fetchAll: true,
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

  const processedCityList = useMemo(() => {
    return stateList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [stateList, pagination.offset]);
  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
        width: 50,
        disableFilters: true,
      },
      { Header: "Country Name", accessor: "countryName" },
      { Header: "State Name", accessor: "stateName" },
      { Header: "State Code", accessor: "stateCode" },
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
    setCurrentState(state);
    reset({ id: state.id, countryId: state.countryId, stateName: state.stateName, stateCode: state.stateCode, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  const handleDelete = (state: any) => {
    setCurrentState(state);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentState) return;

    try {
      await dispatch(deleteState(currentState.id)).unwrap();
      resetPage();
      await dispatch(getAllStates({ fetchAll: true }));
    } catch (error) {
      console.error("Error deleting country:", error);
    }

    setIsDeleteModalOpen(false);
  };

  const handleView = (state: any) => {
    setCurrentState(state);
    setIsViewModalOpen(true);
  };

  const handleOpenModal = (editing = false, state: stateData | null = null) => {
    if (editing && state) {
      reset({
        id: state.id,
        countryId: state.countryId,
        countryName: state.countryName,
        stateName: state.stateName,
        stateCode: state.stateCode,
        activeFlag: state.activeFlag
      });
      setState(state);
    } else {
      reset({
        id: null,
        countryId: '',
        countryName: '',
        stateName: '',
        stateCode: '',
        activeFlag: true
      });
      setState(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleStateSaveError = (message: string) => {
    const normalized = (message || "").toLowerCase();
    if (normalized.includes("country")) {
      setError("countryId", { type: "server", message }, { shouldFocus: true });
      return;
    }

    if (normalized.includes("state code")) {
      setError("stateCode", { type: "server", message }, { shouldFocus: true });
      return;
    }

    setError("stateName", { type: "server", message }, { shouldFocus: true });
  };

  const onSubmit = async (data: StateFormData) => {
    try {
      console.log('Form data submitted:', data); // Add this to debug

      const normalizedStateName = (data.stateName || "").trim().toLowerCase();
      const normalizedCountryId = data.countryId?.toString() ?? "";
      const isDuplicate = stateList.some((stateItem: any) => {
        if (!stateItem) return false;
        const stateCountryId = stateItem.countryId?.toString() ?? "";
        const stateNameValue = (stateItem.stateName || "").trim().toLowerCase();
        return stateCountryId === normalizedCountryId && stateNameValue === normalizedStateName && stateItem.id !== data.id;
      });
      if (isDuplicate) {
        setError("stateName", { type: "manual", message: "You’ve already added this country and state" }, { shouldFocus: true });
        return;
      }
      clearErrors("stateName");

      if (isEditing) {
        await dispatch(updateState({
          ...data,
        })).unwrap();
      } else {
        const { id, ...newStateData } = data;
        await dispatch(createState({
          ...newStateData,
        })).unwrap();
      }
      resetPage();
      await dispatch(getAllStates({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.message;
      if (message) {
        handleStateSaveError(message);
      }
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={processedCityList}
        title="State Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search State..."
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit State" : "Add State"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              Select Country <span className="text-red-600">*</span>
            </label>

            <CommonSearchableSelect
              options={(activeCountries || []).map((country: any) => ({
                value: String(country.id),
                label: country.countryName || `Country ${country.id}`,
              }))}
              placeholder="Select a Country"
              {...register("countryId", { required: "Country is required" })}
              error={touchedFields.countryId && errors.countryId ? errors.countryId.message as string : undefined}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">State Name <span className="text-red-600">*</span> </label>
            <input {...register("stateName", { required: "State Name is required" })}
              placeholder="Enter State Name"
              className="input mt-1" />
            {touchedFields.stateName && errors.stateName && <p className="mt-1 text-sm text-red-600">{errors.stateName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">
              State Code <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              {...register("stateCode", {
                required: "State Code is required",
                pattern: { value: /^[0-9]+$/, message: "Only numbers are allowed" },
                validate: (value) => {
                  const trimmed = String(value ?? "").trim();
                  if (!trimmed) return "State Code is required";
                  const duplicate = stateList.find((stateItem: any) =>
                    String(stateItem.stateCode) === trimmed && stateItem.id !== currentState?.id
                  );
                  if (duplicate) {
                    return `State code: ${trimmed} already used for state: ${duplicate.stateName}`;
                  }
                  return true;
                }
              })}
              placeholder="Enter State Code"
              className={`input mt-1`}
            // disabled={isEditing}   // Disable when editing
            />
            {touchedFields.stateCode && errors.stateCode && (
              <p className="mt-1 text-sm text-red-600">
                {errors.stateCode.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <select {...register("activeFlag")} className="input mt-1">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
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
              {isEditing ? "Update State" : "Add State"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete state "{currentState?.stateName}"?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="State Details">
        {currentState && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Country Name</p>
                <p className="font-medium">{currentState.countryName}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentState.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentState.activeFlag ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm">State Name</p>
              <p className="font-medium">{currentState.stateName}</p>
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


