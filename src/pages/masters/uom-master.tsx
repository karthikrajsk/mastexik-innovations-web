import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { AppDispatch, RootState } from "@/state/store";
import { createUom, deleteUom, getAllUomMaster, updateUom } from "@/state/uomMasterSlice";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Pagination, usePagination } from "@/components/common/Pagination";

interface UomData {
  id: number;
  uomName: string;
  uomCode: string;
  description: string;
  activeFlag: boolean;
}

interface UomFormData {
  id?: number | null;
  uomName: string;
  uomCode: string;
  description: string;
  activeFlag: boolean;
}

export function UomMaster() {
  const { uomList, pagination } = useSelector((state: RootState) => state.uom);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { currentPage, itemsPerPage, handlePageChange, getOffset, setItemsPerPage, resetPage } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUom, setCurrentUom] = useState<UomData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm<UomFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  const uomNameValue = watch("uomName") ?? "";
  const uomCodeValue = watch("uomCode") ?? "";
  const editingUomId = currentUom?.id ?? null;
  const duplicateNameErrorMessage = "UOM Name already exists";
  const duplicateCodeErrorMessage = "UOM Code already exists";

  const normalizeValue = (value?: string | null) => (value ?? "").trim().toLowerCase();

  const isDuplicateUomName = (value?: string | null) => {
    const normalizedValue = normalizeValue(value);
    if (!normalizedValue) {
      return false;
    }
    return uomList.some((item: UomData) => {
      if (!item?.uomName) {
        return false;
      }
      if (item.id === editingUomId) {
        return false;
      }
      return normalizeValue(item.uomName) === normalizedValue;
    });
  };

  const isDuplicateUomCode = (value?: string | null) => {
    const normalizedValue = normalizeValue(value);
    if (!normalizedValue) {
      return false;
    }
    return uomList.some((item: UomData) => {
      if (!item?.uomCode) {
        return false;
      }
      if (item.id === editingUomId) {
        return false;
      }
      return normalizeValue(item.uomCode) === normalizedValue;
    });
  };

  const hasDuplicateName = useMemo(
    () => isDuplicateUomName(uomNameValue),
    [uomList, uomNameValue, editingUomId]
  );

  const hasDuplicateCode = useMemo(
    () => isDuplicateUomCode(uomCodeValue),
    [uomList, uomCodeValue, editingUomId]
  );

  const uomNameErrorMessage =
    errors.uomName?.message || (hasDuplicateName ? duplicateNameErrorMessage : undefined);

  const uomCodeErrorMessage =
    errors.uomCode?.message || (hasDuplicateCode ? duplicateCodeErrorMessage : undefined);

  const isSubmitDisabled = !isValid || hasDuplicateName || hasDuplicateCode;

  useEffect(() => {
    dispatch(getAllUomMaster({ fetchAll: true }));
  }, [dispatch, location.pathname, currentPage, getOffset, itemsPerPage]);

  const processedCityList = useMemo(() => {
    return uomList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [uomList, pagination.offset]);

  const columns = useMemo(() => [
    {
      Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
      width: 50,
      disableFilters: true,
    },
    { Header: "UOM Name", accessor: "uomName" },
    { Header: "UOM Code", accessor: "uomCode" },
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

  const handleOpenModal = (editing = false, shipmentTerm: UomData | null = null) => {
    if (editing && shipmentTerm) {
      reset({ ...shipmentTerm });
      setCurrentUom(shipmentTerm);
    } else {
      reset({ id: null, uomName: "", description: "", activeFlag: true });
      setCurrentUom(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleDelete = (shipmentTerm: UomData) => {
    setCurrentUom(shipmentTerm);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentUom) return;
    try {
      await dispatch(deleteUom(currentUom.id)).unwrap();
      resetPage();
      dispatch(getAllUomMaster({ fetchAll: true }));
    } catch (error) {
      console.error("Delete failed:", error);
    }
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: UomFormData) => {
    if (isDuplicateUomName(data.uomName) || isDuplicateUomCode(data.uomCode)) {
      return;
    }
    try {
      setServerErrors({});

      if (isEditing) {
        await dispatch(updateUom(data)).unwrap();
      } else {
        await dispatch(createUom(data)).unwrap();
      }

      resetPage();
      dispatch(getAllUomMaster({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error("Submit failed:", error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      if (serverMessage.toLowerCase().includes('name') || serverMessage.toLowerCase().includes('uom_name')) {
        setServerErrors({ uomName: serverMessage });
      } else if (serverMessage.toLowerCase().includes('code') || serverMessage.toLowerCase().includes('uom_code')) {
        setServerErrors({ uomCode: serverMessage });
      } else {
        setServerErrors({ general: serverMessage });
      }
    }
  };

  const handleView = (state: any) => {
    setCurrentUom(state);
    setIsViewModalOpen(true);
  };

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setCurrentUom(state);
    reset({ id: state.id, uomName: state.uomName, uomCode: state.uomCode, description: state.description, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 pt-16">
   
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Uom Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Uom..."
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={pagination?.total || 0}
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

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setServerErrors({});
      }} title={isEditing ? "Edit UOM" : "Add UOM"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">UOM Name <span className="text-red-600">*</span> </label>
            <input
              {...register("uomName", {
                required: "UOM Name is required",
                validate: (value) =>
                  isDuplicateUomName(value) ? duplicateNameErrorMessage : true
              })}
              onChange={(e) => {
                if (serverErrors.uomName) {
                  setServerErrors({ ...serverErrors, uomName: '' });
                }
              }}
              className="input mt-1"
            />
            {serverErrors.uomName && !uomNameErrorMessage && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.uomName}</p>
            )}
            {uomNameErrorMessage && <p className="mt-1 text-sm text-red-600">{uomNameErrorMessage}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">UOM Code <span className="text-red-600">*</span> </label>
            <input
              {...register("uomCode", {
                required: "UOM Code is required",
                validate: (value) =>
                  isDuplicateUomCode(value) ? duplicateCodeErrorMessage : true
              })}
              onChange={(e) => {
                if (serverErrors.uomCode) {
                  setServerErrors({ ...serverErrors, uomCode: '' });
                }
              }}
              className="input mt-1"
            />
            {serverErrors.uomCode && !uomCodeErrorMessage && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.uomCode}</p>
            )}
            {uomCodeErrorMessage && <p className="mt-1 text-sm text-red-600">{uomCodeErrorMessage}</p>}
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
            {/* <button type="submit" className="btn btn-primary">{isEditing ? "Edit UOM" : "Add UOM"}</button> */}
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
              title={
                isSubmitDisabled
                  ? hasDuplicateName
                    ? duplicateNameErrorMessage
                    : hasDuplicateCode
                      ? duplicateCodeErrorMessage
                      : "Please fill all required fields"
                  : ""
              }
            >
              {isEditing ? "Update UOM" : "Add UOM"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete UOM "{currentUom?.uomName}"?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="UOM Details">
        {currentUom && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">UOM Name</p>
                <p className="font-medium">{currentUom.uomName}</p>
              </div>
              <div>
                <p className="text-sm">UOM Code</p>
                <p className="font-medium">{currentUom.uomCode}</p>
              </div>
              <div>
                <p className="text-sm">Description</p>
                <p className="font-medium">{currentUom.description}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentUom.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentUom.activeFlag ? "Active" : "Inactive"}
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
