import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from "@/state/store";
import { createWarehouse, deleteWarehouse, getAllWarehouse, updateWarehouse } from "@/state/warehouseSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllVendors } from "@/state/vendorSlice";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { BooleanFilter } from "@/components/filters";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, UseFormSetError, Controller, useWatch } from "react-hook-form";
import { useDispatch, useSelector } from 'react-redux';

interface WarehouseFormData {
  id?: number | null;
  warehouseName: string;
  activeFlag: boolean;
  ownerType: "Company" | "Vendor";
  ownerId: string;
  warehouseType: string;
  isDefault: boolean;
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

const handleWarehouseSaveError = (error: any, setError: UseFormSetError<WarehouseFormData>) => {
  const message = resolveApiErrorMessage(error, "Failed to save warehouse");
  const normalized = (message || "").toLowerCase();
  const field: keyof WarehouseFormData = normalized.includes("status") || normalized.includes("active")
    ? "activeFlag"
    : "warehouseName";
  setError(field, { type: "server", message }, { shouldFocus: true });
  return message;
};

export function WarehouseMaster() {

  const { warehouseList, pagination } = useSelector((state: RootState) => state.warehouse);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<WarehouseFormData | null>(null);
  const [warehouse, setWarehouse] = useState(warehouseList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const dispatch = useDispatch<AppDispatch>();

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    setItemsPerPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    setValue,
    watch,
    formState: { errors, touchedFields, isValid }
  } = useForm<WarehouseFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  const watchOwnerId = watch("ownerId");
  const watchWarehouseType = watch("warehouseType");

  const watchOwnerType = useWatch({ control, name: "ownerType" });

  const isDefaultDisabled = useMemo(() => {
    if (!watchOwnerId || !watchWarehouseType) return false;

    return warehouseList.some((w: any) =>
      w.ownerType === watchOwnerType &&
      String(w.ownerId) === String(watchOwnerId) &&
      w.warehouseType === watchWarehouseType &&
      w.isDefault === true &&
      w.id !== currentWarehouse?.id
    );
  }, [warehouseList, watchOwnerType, watchOwnerId, watchWarehouseType, currentWarehouse]);

  useEffect(() => {
    dispatch(getAllWarehouse({
      fetchAll: true,
      // offset: getOffset(),
      // limit: itemsPerPage
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

  useEffect(() => {
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllVendors({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    if (watchOwnerType === "Company" && !watchOwnerId && companyMasterList?.length > 0) {
      const storedId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
      const companyId = storedId ? Number(storedId) : null;
      if (companyId) {
        const match = companyMasterList.find((c: any) => c.id === companyId);
        if (match) setValue("ownerId", String(match.id));
      }
    }
  }, [watchOwnerType, watchOwnerId, companyMasterList, setValue]);

  const processedCityList = useMemo(() => {
    return warehouseList.map((city: any, index: number) => {
      let ownerName = "-";
      if (city.ownerType === "Company" && city.ownerId) {
        const company = companyMasterList?.find((c: any) => c.id === city.ownerId);
        ownerName = company?.companyName || "-";
      } else if (city.ownerType === "Vendor" && city.ownerId) {
        const vendor = vendorList?.find((v: any) => v.id === city.ownerId);
        ownerName = vendor?.vendorName || "-";
      }
      return {
        ...city,
        serialNo: (pagination.offset || 0) + index + 1,
        ownerName
      };
    });
  }, [warehouseList, pagination.offset, companyMasterList, vendorList]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No", accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
      { Header: "Warehouse Name", accessor: "warehouseName" },
      { Header: "Owner Type", accessor: "ownerType" },
      { Header: "Owner Name", accessor: "ownerName" },
      { Header: "Warehouse Type", accessor: "warehouseType" },
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
    setCurrentWarehouse(state);
    reset({
      id: state.id,
      warehouseName: state.warehouseName,
      activeFlag: state.activeFlag,
      ownerType: state.ownerType || "Company",
      ownerId: state.ownerId ? String(state.ownerId) : "",
      warehouseType: state.warehouseType || "",
      isDefault: state.isDefault ?? false
    });
    setIsModalOpen(true);
  };

  const handleView = (state: any) => {
    setCurrentWarehouse(state);
    setIsViewModalOpen(true);
  };

  const handleOpenModal = (editing = false, warehouse: WarehouseFormData | null = null) => {
    if (editing && warehouse) {
      reset({
        id: warehouse.id,
        warehouseName: warehouse.warehouseName,
        activeFlag: warehouse.activeFlag,
        ownerType: warehouse.ownerType || "Company",
        ownerId: warehouse.ownerId ? String(warehouse.ownerId) : "",
        warehouseType: warehouse.warehouseType || "",
        isDefault: warehouse.isDefault ?? false
      });
      setWarehouse(warehouse);
    } else {
      reset({
        id: null,
        warehouseName: '',
        activeFlag: true,
        ownerType: "Company",
        ownerId: "",
        warehouseType: "",
        isDefault: false
      });
      setWarehouse(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      console.log('Form data submitted:', data);

      const payload = {
        ...data,
        ownerId: data.ownerId ? Number(data.ownerId) : null
      };

      if (isEditing) {
        await dispatch(updateWarehouse(payload)).unwrap();
      } else {
        const { id, ...newwarehouseData } = payload;
        await dispatch(createWarehouse(newwarehouseData)).unwrap();
      }
      resetPage();
      await dispatch(getAllWarehouse({ fetchAll:true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      handleWarehouseSaveError(error, setError);
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = (state: any) => {
    setCurrentWarehouse(state);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentWarehouse) return;

    try {
      await dispatch(deleteWarehouse(currentWarehouse.id)).unwrap();
      resetPage();
      await dispatch(getAllWarehouse({ fetchAll:true }));
    } catch (error) {
      console.error("Error deleting warehouse:", error);
    }

    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
    
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Warehouse Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search warehouse..."
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Warehouse" : "Add Warehouse"}
        className="max-w-2xl w-full"// Add size prop for medium modal
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 2-column grid layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div>
              <label className="block text-sm font-medium">Warehouse Name <span className="text-red-600">*</span></label>
              <input
                {...register("warehouseName", {
                  required: "Warehouse Name is required"
                })}
                placeholder="Enter Warehouse Name"
                className={`input mt-1 w-full ${errors.warehouseName ? 'border-red-500' : ''}`}
              />
              {(touchedFields.warehouseName && errors.warehouseName) && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.warehouseName.message}
                </p>
              )}
            </div>

            {/* Right Column */}
            <div>
              <label className="block text-sm font-medium">Warehouse Type <span className="text-red-600">*</span></label>
              <Controller
                name="warehouseType"
                control={control}
                rules={{ required: "Warehouse Type is required" }}
                render={({ field }) => (
                  <CommonSearchableSelect
                    options={[
                      { value: "All", label: "All" },
                      { value: "Yarn", label: "Yarn" },
                      { value: "Fabric", label: "Fabric" },
                      { value: "Item", label: "Item" }
                    ]}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Select Warehouse Type"
                    className={`w-full mt-1 ${errors.warehouseType ? 'border-red-500' : ''}`}
                  />
                )}
              />
              {errors.warehouseType && (
                <p className="mt-1 text-sm text-red-600">{errors.warehouseType.message}</p>
              )}
            </div>

            {/* Left Column - Owner Type */}
            <div>
              <label className="block text-sm font-medium">Owner Type <span className="text-red-600">*</span></label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="Company"
                    {...register("ownerType", {
                      required: "Owner Type is required",
                      onChange: () => setValue("ownerId", "")
                    })}
                  />
                  <span className="ml-2">Company</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="Vendor"
                    {...register("ownerType", {
                      required: "Owner Type is required",
                      onChange: () => { setValue("ownerId", ""); setValue("isDefault", false); }
                    })}
                  />
                  <span className="ml-2">Vendor</span>
                </label>
              </div>
              {errors.ownerType && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerType.message}</p>
              )}
            </div>

            {/* Right Column - Owner Selection */}
            <div>
              <label className="block text-sm font-medium">
                {watchOwnerType === "Vendor" ? "Vendor" : "Company"} <span className="text-red-600">*</span>
              </label>
              <Controller
                name="ownerId"
                control={control}
                rules={{ required: "Owner is required" }}
                render={({ field }) => (
                  <CommonSearchableSelect
                    options={
                      watchOwnerType === "Vendor"
                        ? vendorList?.map((v: any) => ({ value: String(v.id), label: v.vendorName }))
                        : companyMasterList?.map((c: any) => ({ value: String(c.id), label: c.companyName }))
                    }
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder={`Select ${watchOwnerType === "Vendor" ? "Vendor" : "Company"}`}
                    className={`w-full mt-1 ${errors.ownerId ? 'border-red-500' : ''}`}
                  />
                )}
              />
              {errors.ownerId && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerId.message}</p>
              )}
            </div>

            {/* Left Column - Status */}
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select {...register("activeFlag")} className="input mt-1 w-full">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Right Column - Default Warehouse */}
            <div className="flex items-end">
              {watchOwnerType !== "Vendor" && (
                <label className={`inline-flex items-center ${isDefaultDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="checkbox"
                    {...register("isDefault")}
                    disabled={isDefaultDisabled}
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm font-medium">Default Warehouse</span>
                </label>
              )}
            </div>
          </div>

          {/* Buttons - full width */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
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
              {isEditing ? "Update Warehouse" : "Add Warehouse"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete warehouse "{currentWarehouse?.warehouseName}"?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Warehouse Details" className="max-w-2xl w-full">
        {currentWarehouse && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Warehouse Name</p>
                <p className="font-medium">{currentWarehouse.warehouseName}</p>
              </div>
              <div>
                <p className="text-sm">Owner Type</p>
                <p className="font-medium">{currentWarehouse.ownerType || "-"}</p>
              </div>
              <div>
                <p className="text-sm">Owner</p>
                <p className="font-medium">
                  {currentWarehouse.ownerType === "Vendor"
                    ? vendorList?.find((v: any) => String(v.id) === String(currentWarehouse.ownerId))?.vendorName || currentWarehouse.ownerId || "-"
                    : companyMasterList?.find((c: any) => String(c.id) === String(currentWarehouse.ownerId))?.companyName || currentWarehouse.ownerId || "-"
                  }
                </p>
              </div>
              <div>
                <p className="text-sm">Warehouse Type</p>
                <p className="font-medium">{currentWarehouse.warehouseType || "-"}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentWarehouse.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentWarehouse.activeFlag ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm">Default Warehouse</p>
                <p className="font-medium">{currentWarehouse.isDefault ? "Yes" : "No"}</p>
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