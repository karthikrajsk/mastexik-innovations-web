import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createShipmentTerm, deleteShipmentTerm, getAllShipmentTerms, updateShipmentTerm } from "@/state/shipmentTermsSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface ShipmentTermData {
  id: number;
  termName: string;
  description: string;
  activeFlag: boolean;
}

interface ShipmentTermFormData {
  id?: number | null;
  termName: string;
  description: string;
  activeFlag: boolean;
}

export function ShipmentTermMaster() {
  const { shipmentTermsList, pagination } = useSelector((state: RootState) => state.shipmentTerms);
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
  const [currentShipmentTerm, setCurrentShipmentTerm] = useState<ShipmentTermData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, touchedFields, isValid }
  } = useForm<ShipmentTermFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(getAllShipmentTerms({ 
      fetchAll: true
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

     const processedCityList = useMemo(() => {
      return shipmentTermsList.map((city: any, index: number) => ({
        ...city,
        serialNo: (pagination.offset || 0) + index + 1
      }));
    }, [shipmentTermsList, pagination.offset]);
  const columns = useMemo(() => [
    { Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true, },
    { Header: "Term Name", accessor: "termName" },
    { Header: "Description", accessor: "description" },
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
  ], []);

  const handleOpenModal = (editing = false, shipmentTerm: ShipmentTermData | null = null) => {
    if (editing && shipmentTerm) {
      reset({ ...shipmentTerm });
      setCurrentShipmentTerm(shipmentTerm);
    } else {
      reset({ id: null, termName: "", description: "", activeFlag: true });
      setCurrentShipmentTerm(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleDelete = (shipmentTerm: ShipmentTermData) => {
    setCurrentShipmentTerm(shipmentTerm);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentShipmentTerm) return;
    await dispatch(deleteShipmentTerm(currentShipmentTerm.id));
    resetPage();
    await dispatch(getAllShipmentTerms({ fetchAll: true }));
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: ShipmentTermFormData) => {
    try {
      setServerErrors({});

      if (isEditing) {
        await dispatch(updateShipmentTerm(data)).unwrap();
      } else {
        const { id, ...newShipmentTermData } = data;
        await dispatch(createShipmentTerm(newShipmentTermData)).unwrap();
      }

      resetPage();
      await dispatch(getAllShipmentTerms({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      if (serverMessage.toLowerCase().includes('term name') || serverMessage.toLowerCase().includes('term_name')) {
        setServerErrors({ termName: serverMessage });
        setError("termName", { type: "manual", message: serverMessage }, { shouldFocus: true });
      } else {
        setServerErrors({ general: serverMessage });
      }
    }
  };

  const handleView = (state: any) => {
    setCurrentShipmentTerm(state);
    // setIsViewModalOpen(true);
  };

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setCurrentShipmentTerm(state);
    reset({ id: state.id, termName: state.termName, description: state.description, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 pt-16">

            <DataTable
        columns={columns}
        data={processedCityList}
        title="Shipment Term Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Shipment Term..."
        disableFullDataFetch={true}
        //   initialPageSize={itemsPerPage}
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

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setServerErrors({});
      }} title={isEditing ? "Edit Shipment Term" : "Add Shipment Term"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Shipment Term Name <span className="text-red-600">*</span> </label>
            <input {...register("termName", { required: "Shipment Term Name is required" })}
              placeholder="Enter Shipment Term Name"
              onChange={(e) => {
                if (serverErrors.termName) {
                  setServerErrors({ ...serverErrors, termName: '' });
                }
              }}
              className="input mt-1" />
            {serverErrors.termName && !errors.termName && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.termName}</p>
            )}
            {errors.termName && <p className="mt-1 text-sm text-red-600">{errors.termName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea {...register("description")} className="input mt-1"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select {...register("activeFlag")} className="input mt-1">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => {
              setIsModalOpen(false);
              setServerErrors({});
            }} className="btn btn-secondary">Cancel</button>
            {/* <button type="submit" className="btn btn-primary">{isEditing ? "Edit Term" : "Add Term"}</button> */}
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
              {isEditing ? "Update Term" : "Add Term"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete term "{currentShipmentTerm?.termName}"?</p>
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
