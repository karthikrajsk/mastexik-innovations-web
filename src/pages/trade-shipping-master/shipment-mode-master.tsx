import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createShipmentMode, deleteShipmentMode, getAllShipmentModes, updateShipmentMode } from "@/state/shipmentModeSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface ShipmentModeData {
  id: number;
  modeName: string;
  description: string;
  activeFlag: boolean;
}

interface ShipmentModeFormData {
  id?: number | null;
  modeName: string;
  description: string;
  activeFlag: boolean;
}

export function ShipmentModeMaster() {
  const { shipmentModesList, pagination } = useSelector((state: RootState) => state.shipmentMode);
  const dispatch = useDispatch<AppDispatch>();

  const {
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentShipmentMode, setCurrentShipmentMode] = useState<ShipmentModeData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, touchedFields, isValid }
  } = useForm<ShipmentModeFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(getAllShipmentModes({
      fetchAll: true,
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

  const processedCityList = useMemo(() => {
    if (!Array.isArray(shipmentModesList)) {
      return [];
    }
    return shipmentModesList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [shipmentModesList, pagination.offset]);

  const columns = useMemo(() => [
    {
      Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
      width: 50,
      disableFilters: true,
    },
    { Header: "Mode Name", accessor: "modeName" },
    { Header: "Description", accessor: "description" },
    {
      Header: "Status",
      accessor: "activeFlag",
      Filter: BooleanFilter,
      Cell: ({ value }: { value: boolean }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value ? "Active" : "Inactive"}</span>
      ),
    },
  ], []);

  const handleOpenModal = (editing = false, shipmentMode: ShipmentModeData | null = null) => {
    if (editing && shipmentMode) {
      reset({ ...shipmentMode });
      setCurrentShipmentMode(shipmentMode);
    } else {
      reset({ id: null, modeName: "", description: "", activeFlag: true });
      setCurrentShipmentMode(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleDelete = (shipmentMode: ShipmentModeData) => {
    setCurrentShipmentMode(shipmentMode);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentShipmentMode) return;
    await dispatch(deleteShipmentMode(currentShipmentMode.id));
    resetPage();
    await dispatch(getAllShipmentModes({ fetchAll: true }));
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: ShipmentModeFormData) => {
    try {
      setServerErrors({});

      if (isEditing) {
        await dispatch(updateShipmentMode(data)).unwrap();
      } else {
        await dispatch(createShipmentMode(data)).unwrap();
      }

      resetPage();
      await dispatch(getAllShipmentModes({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      if (serverMessage.toLowerCase().includes('mode') || serverMessage.toLowerCase().includes('mode_name')) {
        setServerErrors({ modeName: serverMessage });
        setError("modeName", { type: "manual", message: serverMessage }, { shouldFocus: true });
      } else {
        setServerErrors({ general: serverMessage });
      }
    }
  };

  const handleView = (state: any) => {
    setCurrentShipmentMode(state);
    // setIsViewModalOpen(true);
  };

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setCurrentShipmentMode(state);
    reset({ id: state.id, modeName: state.modeName, description: state.description, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 pt-16">
 
       <DataTable
        columns={columns}
        data={processedCityList}
        title="Shipment Mode Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Shipment Mode..."
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

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setServerErrors({});
      }} title={isEditing ? "Edit Shipment Mode" : "Add Shipment Mode"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Shipment Mode Name <span className="text-red-600">*</span> </label>
            <input {...register("modeName", { required: "Shipment Mode Name is required" })}
              placeholder="Enter Shipmnt Mode Name"
              onChange={(e) => {
                if (serverErrors.modeName) {
                  setServerErrors({ ...serverErrors, modeName: '' });
                }
              }}
              className="input mt-1" />
            {serverErrors.modeName && !errors.modeName && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.modeName}</p>
            )}
            {errors.modeName && <p className="mt-1 text-sm text-red-600">{errors.modeName.message}</p>}
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
            <button type="button" onClick={() => {
              setIsModalOpen(false);
              setServerErrors({});
            }} className="btn btn-secondary">Cancel</button>
            {/* <button type="submit" className="btn btn-primary">{isEditing ? "Edit Mode" : "Add Mode"}</button> */}
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
              {isEditing ? "Update Mode" : "Add Mode"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete mode "{currentShipmentMode?.modeName}"?</p>
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
