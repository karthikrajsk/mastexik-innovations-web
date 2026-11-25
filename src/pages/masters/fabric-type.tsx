import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createFabricType, deleteFabricType, getAllFabricTypes, updateFabricType } from "@/state/fabricTypeSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect } from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

// Sample data
// const initialFabricTypes = [
//   { id: 1, fabricName: "Gregie", status: 'Active' },
//   { id: 2, fabricName: "Finished", status: 'Active' },
//   { id: 3, fabricName: "Finished Shade", status: 'Inactive' },
// ];

interface FabricTypeData {
  id: number;
  fabricTypeName: string;
  activeFlag: boolean;
}

interface FabricFormData {
  id?: number | null;
  fabricTypeName: string;
  activeFlag: boolean;
}

export function FabricTypeMaster() {

  const dispatch = useDispatch<AppDispatch>();
  const { fabricTypeList, pagination } = useSelector((state: RootState) => state.fabricType);
  
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    setItemsPerPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentFabric, setCurrentFabric] = useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm<FabricFormData>({
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onBlur' // Re-validate on blur
  });

  const fabricTypeNameValue = watch("fabricTypeName") ?? "";
  const editingFabricId = currentFabric?.id ?? null;
  const duplicateFabricTypeErrorMessage = "Fabric Type Name already exists";

  const normalizeFabricTypeName = (value?: string | null) => (value ?? "").trim().toLowerCase();

  const isDuplicateFabricTypeName = (value?: string | null) => {
    const normalizedValue = normalizeFabricTypeName(value);
    if (!normalizedValue) {
      return false;
    }
    return fabricTypeList.some((fabric: FabricTypeData) => {
      if (!fabric?.fabricTypeName) {
        return false;
      }
      if (fabric.id === editingFabricId) {
        return false;
      }
      return normalizeFabricTypeName(fabric.fabricTypeName) === normalizedValue;
    });
  };

  const hasDuplicateFabricTypeName = useMemo(
    () => isDuplicateFabricTypeName(fabricTypeNameValue),
    [fabricTypeList, fabricTypeNameValue, editingFabricId]
  );

  const fabricTypeNameErrorMessage =
    errors.fabricTypeName?.message || (hasDuplicateFabricTypeName ? duplicateFabricTypeErrorMessage : undefined);

  const isSubmitDisabled = !isValid || hasDuplicateFabricTypeName;


  useEffect(() => {
    dispatch(getAllFabricTypes({ 
      fetchAll: true, 
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

    const processedCityList = useMemo(() => {
      return fabricTypeList.map((city: any, index: number) => ({
        ...city,
        serialNo: (pagination.offset || 0) + index + 1
      }));
    }, [fabricTypeList, pagination.offset]);

  const columns = useMemo(
    () => [
      {
        Header: 'S.No',
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true,
      },
      {
        Header: 'Fabric Type Name',
        accessor: 'fabricTypeName',
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
    setCurrentFabric(state);
    reset({ id: state.id, fabricTypeName: state.fabricTypeName, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  const handleView = (fabric: any) => {
    setCurrentFabric(fabric);
    setIsViewModalOpen(true);
  };

  const handleOpenModal = (editing = false, state: FabricTypeData | null = null) => {
    if (editing && state) {
      reset({
        id: state.id,
        fabricTypeName: state.fabricTypeName,
        activeFlag: state.activeFlag
      });
      setCurrentFabric(state);
    } else {
      reset({
        id: null,
        fabricTypeName: '',
        activeFlag: true
      });
      setCurrentFabric(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: FabricFormData) => {
    if (isDuplicateFabricTypeName(data.fabricTypeName)) {
      return;
    }
    try {
      setServerErrors({});

      if (isEditing) {
        await dispatch(updateFabricType(data)).unwrap();
      } else {
        await dispatch(createFabricType(data)).unwrap();
      }

      resetPage();
      await dispatch(getAllFabricTypes({ fetchAll: true,}));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      setServerErrors({ fabricTypeName: serverMessage });
    }
  };

  const handleDelete = (state: any) => {
    setCurrentFabric(state);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentFabric) return;

    try {
      await dispatch(deleteFabricType(currentFabric.id)).unwrap();
      resetPage();
      await dispatch(getAllFabricTypes({ fetchAll: true}));
    } catch (error) {
      console.error("Error deleting fabric type:", error);
    }

    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">

      <DataTable
        columns={columns}
        data={processedCityList}
        title="Fabric Type Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search Fabric Type..."
        disableFullDataFetch={true}
        // showColumnFilters={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //       totalCount={pagination?.total || 0}
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setServerErrors({});
        }}
        title={isEditing ? 'Edit Fabric Type' : 'Add Fabric Type'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700">Fabric Type Name <span className="text-red-600">*</span> </label>
            <input
              {...register('fabricTypeName', {
                required: 'Fabric Type Name is required',
                validate: (value) =>
                  isDuplicateFabricTypeName(value) ? duplicateFabricTypeErrorMessage : true
              })}
              placeholder="Enter Fabric Type Name"
              onChange={(e) => {
                if (serverErrors.fabricTypeName) {
                  setServerErrors({ ...serverErrors, fabricTypeName: '' });
                }
              }}
              className="input mt-1"
            />
            {serverErrors.fabricTypeName && !fabricTypeNameErrorMessage && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.fabricTypeName}</p>
            )}
            {fabricTypeNameErrorMessage && (
              <p className="mt-1 text-sm text-red-600">{fabricTypeNameErrorMessage}</p>
            )}
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

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setServerErrors({});
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            {/* <button type="submit" className="btn btn-primary">
              {isEditing ? 'Edit Fabric Type' : 'Add Fabric Type'}
            </button> */}
            <button
              type="submit"
              className={`btn 
                        ${isSubmitDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
                  : 'btn-primary hover:bg-blue-700'
                }
                        transition-colors duration-200
                      `}
              disabled={isSubmitDisabled}
              title={isSubmitDisabled ? duplicateFabricTypeErrorMessage : (!isValid ? "Please fill all required fields" : "")}
            >
              {isEditing ? "Update Fabric Type" : "Add Fabric Type"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Fabric Type Details">
        {currentFabric && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Fabric Type Name</p>
                <p className="font-medium">{currentFabric.fabricTypeName}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentFabric.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentFabric.activeFlag ? "Active" : "Inactive"}
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
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete Fabric Type?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
