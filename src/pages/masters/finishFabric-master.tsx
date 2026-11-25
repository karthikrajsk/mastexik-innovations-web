import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createFinishFabric, deleteFinishFabric, getAllFinishFabric, updateFinishFabric } from "@/state/finishMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface FinishFabricData {
  id: number;
  finishName: string;
  finishCode: string;
  description: string;
  activeFlag: boolean;
}

interface FinishFabricFormData {
  id?: number | null;
  finishName: string;
  finishCode: string;
  description: string;
  activeFlag: boolean;
}

export function FinishFabricMaster() {

  const { finishFabricList, pagination } = useSelector((state: RootState) => state.finishFabric);

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const dispatch = useDispatch<AppDispatch>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentFinishFabric, setCurrentFinishFabric] = useState<FinishFabricData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // const { register, handleSubmit, reset, formState: { errors } } = useForm<FinishFabricFormData>();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, touchedFields, isValid }
  } = useForm<FinishFabricFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(getAllFinishFabric({
      fetchAll: true,
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

  const columns = useMemo(() => [
    {
      Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
      width: 50,
      disableFilters: true,
    },
    { Header: "Finish Fabric Name", accessor: "finishName" },
    { Header: "Finish Fabric Code", accessor: "finishCode" },
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

  const handleOpenModal = (editing = false, finishFabric: FinishFabricData | null = null) => {
    if (editing && finishFabric) {
      reset({ ...finishFabric });
      setCurrentFinishFabric(finishFabric);
    } else {
      reset({ id: null, finishName: "", finishCode: "", description: "", activeFlag: true });
      setCurrentFinishFabric(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleDelete = (finishFabric: FinishFabricData) => {
    setCurrentFinishFabric(finishFabric);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentFinishFabric) return;
    try {
      await dispatch(deleteFinishFabric(currentFinishFabric.id)).unwrap();
      resetPage();
      await dispatch(getAllFinishFabric({ fetchAll: true }));
    } catch (error) {
      console.error("Error deleting finish fabric:", error);
    }
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: FinishFabricFormData) => {
    try {
      setServerErrors({});

      if (isEditing) {
        await dispatch(updateFinishFabric(data)).unwrap();
      } else {
        const { id, ...newFinishFabricData } = data;
        await dispatch(createFinishFabric(newFinishFabricData)).unwrap();
      }

      resetPage();
      await dispatch(getAllFinishFabric({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      if (serverMessage.toLowerCase().includes('finish name') || serverMessage.toLowerCase().includes('finish_name')) {
        setServerErrors({ finishName: serverMessage });
        setError("finishName", { type: "manual", message: serverMessage }, { shouldFocus: true });
      } else if (serverMessage.toLowerCase().includes('finish code') || serverMessage.toLowerCase().includes('finish_code')) {
        setServerErrors({ finishCode: serverMessage });
        setError("finishCode", { type: "manual", message: serverMessage }, { shouldFocus: true });
      } else {
        setServerErrors({ general: serverMessage });
      }
    }
  };

  const handleView = (state: any) => {
    setCurrentFinishFabric(state);
    setIsViewModalOpen(true);
  };

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setCurrentFinishFabric(state);
    reset({ id: state.id, finishName: state.finishName, finishCode: state.finishCode, description: state.description, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  const processedCityList = useMemo(() => {
    return finishFabricList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [finishFabricList, pagination.offset]);

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Finish Fabric Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Finish Fabric..."
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
      }} title={isEditing ? "Edit Finish Fabric" : "Add Finish Fabric"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Finish Fabric Name <span className="text-red-600">*</span> </label>
            <input {...register("finishName", {
              required: "Finish Fabric Name is required",
              validate: (value) => {
                const isDuplicate = finishFabricList.some(
                  (item: any) =>
                    item.finishName.toLowerCase() === value.trim().toLowerCase() &&
                    item.id !== currentFinishFabric?.id
                );
                return isDuplicate ? "Finish Fabric Name already exists" : true;
              }
            })}
              placeholder="Enter Finish Fabric Name"
              onChange={(e) => {
                if (serverErrors.finishName) {
                  setServerErrors({ ...serverErrors, finishName: '' });
                }
              }}
              className="input mt-1" />
            {serverErrors.finishName && !errors.finishName && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.finishName}</p>
            )}
            {errors.finishName && <p className="mt-1 text-sm text-red-600">{errors.finishName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Finish Fabric Code <span className="text-red-600">*</span> </label>
            <input {...register("finishCode", {
              required: "Finish Fabric Code is required",
              validate: (value) => {
                const isDuplicate = finishFabricList.some(
                  (item: any) =>
                    item.finishCode.toLowerCase() === value.trim().toLowerCase() &&
                    item.id !== currentFinishFabric?.id
                );
                return isDuplicate ? "Finish Fabric Code already exists" : true;
              }
            })}
              placeholder="Enter Finish Fabric Code"
              onChange={(e) => {
                if (serverErrors.finishCode) {
                  setServerErrors({ ...serverErrors, finishCode: '' });
                }
              }}
              className="input mt-1" />
            {serverErrors.finishCode && !errors.finishCode && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.finishCode}</p>
            )}
            {errors.finishCode && <p className="mt-1 text-sm text-red-600">{errors.finishCode.message}</p>}
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
            {/* <button type="submit" className="btn btn-primary">{isEditing ? "Edit Finish Fabric" : "Add Finish Fabric"}</button> */}
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
              {isEditing ? "Update Finish Fabric" : "Add Finish Fabric"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete FinishFabric "{currentFinishFabric?.finishName}"?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="FinishFabric Details">
        {currentFinishFabric && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Finish Fabric Name</p>
                <p className="font-medium">{currentFinishFabric.finishName}</p>
              </div>
              <div>
                <p className="text-sm">Finish Fabric Code</p>
                <p className="font-medium">{currentFinishFabric.finishCode}</p>
              </div>
              <div>
                <p className="text-sm">Description</p>
                <p className="font-medium">{currentFinishFabric.description}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentFinishFabric.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentFinishFabric.activeFlag ? "Active" : "Inactive"}
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
