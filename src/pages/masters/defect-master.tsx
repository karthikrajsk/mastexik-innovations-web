import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { createDefectMaster, deleteDefectMaster, getAllDefectMaster, updateDefectMaster } from "@/state/defectMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, UseFormSetError } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/components/common/Pagination";

interface DefectData {
  id: number;
  defectName: string;
  defectCode: string;
  defectPoint: string;
  description: string;
  activeFlag: boolean;
}

interface DefectFormData {
  id?: number | null;
  defectName: string;
  defectCode: string;
  defectPoint?: string;
  description: string;
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

const handleDefectSaveError = (error: any, setError: UseFormSetError<DefectFormData>) => {
  const message = resolveApiErrorMessage(error, "Failed to save defect");
  const normalized = (message || "").toLowerCase();
  const field: keyof DefectFormData = normalized.includes("code")
    ? "defectCode"
    : "defectName";
  setError(field, { type: "server", message }, { shouldFocus: true });
  return message;
};

export function DefectMaster() {

  const { defectMasterList, pagination } = useSelector((state: RootState) => state.defect);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { currentPage, itemsPerPage, getOffset, resetPage, handlePageChange , setItemsPerPage} = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDefect, setCurrentDefect] = useState<DefectData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // const { register, handleSubmit, reset, formState: { errors } } = useForm<DefectFormData>();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, touchedFields, isValid }
  } = useForm<DefectFormData>({
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onBlur' // Re-validate on blur
  });

  useEffect(() => {
    dispatch(getAllDefectMaster({ fetchAll: true }));
  }, [location.pathname, currentPage, getOffset, itemsPerPage, dispatch]);

   const processedCityList = useMemo(() => {
        return defectMasterList.map((city: any, index: number) => ({
          ...city,
          serialNo: (pagination.offset || 0) + index + 1
        }));
      }, [defectMasterList, pagination.offset]);

      
  const columns = useMemo(() => [
    { Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true, },
    { Header: "Defect Name", accessor: "defectName" },
    { Header: "Defect Code", accessor: "defectCode" },
    { Header: "Defect Point", accessor: "defectPoint" },
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

  const handleOpenModal = (editing = false, defectMaster: DefectData | null = null) => {
    if (editing && defectMaster) {
      reset({ ...defectMaster });
      setCurrentDefect(defectMaster);
    } else {
      reset({ id: null, defectName: "", description: "", activeFlag: true });
      setCurrentDefect(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleDelete = (defectMaster: DefectData) => {
    setCurrentDefect(defectMaster);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentDefect) return;
    try {
      await dispatch(deleteDefectMaster(currentDefect.id)).unwrap();
      resetPage();
      dispatch(getAllDefectMaster({ fetchAll  :true }));
    } catch (error) {
      console.error("Delete failed:", error);
    }
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: DefectFormData) => {
    try {
      if (isEditing) {
        await dispatch(updateDefectMaster(data)).unwrap();
      } else {
        await dispatch(createDefectMaster(data)).unwrap();
      }
      resetPage();
      dispatch(getAllDefectMaster({ fetchAll  :true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      handleDefectSaveError(error, setError);
      console.error("Submit failed:", error);
    }
  };

  const handleView = (state: any) => {
    setCurrentDefect(state);
    setIsViewModalOpen(true);
  };

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setCurrentDefect(state);
    reset({
      id: state.id, defectName: state.defectName, defectPoint: state.defectPoint,
      defectCode: state.defectCode, description: state.description, activeFlag: state.activeFlag
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 pt-16">

            <DataTable
        columns={columns}
        data={processedCityList}
        title="Defect Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Defect..."
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //       totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        // totalItems={pagination.total}
        // offset={pagination.offset}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Defect" : "Add Defect"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* <div>
            <label className="block text-sm font-medium">Defect Name <span className="text-red-600">*</span> </label>
            <input {...register("defectName", { required: "Defect Name is required" })} className="input mt-1" />
            {errors.defectName && <p className="mt-1 text-sm text-red-600">{errors.defectName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Defect Code <span className="text-red-600">*</span> </label>
            <input {...register("defectCode", { required: "Defect Code is required" })} className="input mt-1" />
            {errors.defectCode && <p className="mt-1 text-sm text-red-600">{errors.defectCode.message}</p>}
          </div> */}
          <div>
            <label className="block text-sm font-medium">Defect Name <span className="text-red-600">*</span> </label>
            <input 
              {...register("defectName", { 
                required: "Defect Name is required",
                validate: (value) => {
                  const trimmed = String(value ?? "").trim().toLowerCase();
                  if (!trimmed) return true;
                  const duplicate = defectMasterList.find((item: any) =>
                    item.defectName.trim().toLowerCase() === trimmed && item.id !== currentDefect?.id
                  );
                  if (duplicate) return "Defect Name already exists";
                  return true;
                }
              })} 
              className="input mt-1" 
            />
            {errors.defectName && <p className="mt-1 text-sm text-red-600">{errors.defectName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Defect Code <span className="text-red-600">*</span> </label>
            <input 
              {...register("defectCode", { 
                required: "Defect Code is required",
                validate: (value) => {
                  const trimmed = String(value ?? "").trim().toLowerCase();
                  if (!trimmed) return true;
                  const duplicate = defectMasterList.find((item: any) =>
                    item.defectCode.trim().toLowerCase() === trimmed && item.id !== currentDefect?.id
                  );
                  if (duplicate) return "Defect Code already exists";
                  return true;
                }
              })} 
              className="input mt-1" 
            />
            {errors.defectCode && <p className="mt-1 text-sm text-red-600">{errors.defectCode.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Defect Point <span className="text-red-600">*</span> </label>
            <input {...register("defectPoint", { required: "Defect Point is required" })} className="input mt-1" />
            {errors.defectPoint && <p className="mt-1 text-sm text-red-600">{errors.defectPoint.message}</p>}
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
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            {/* <button type="submit" className="btn btn-primary">{isEditing ? "Edit Defect" : "Add Defect"}</button> */}
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
              {isEditing ? "Update Defect" : "Add Defect"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete Defect ?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Defect Details">
        {currentDefect && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Defect Name</p>
                <p className="font-medium">{currentDefect.defectName}</p>
              </div>
              <div>
                <p className="text-sm">Defect Code</p>
                <p className="font-medium">{currentDefect.defectCode}</p>
              </div>
              <div>
                <p className="text-sm">Defect Point</p>
                <p className="font-medium">{currentDefect.defectPoint}</p>
              </div>
              <div>
                <p className="text-sm">Description</p>
                <p className="font-medium">{currentDefect.description}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentDefect.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentDefect.activeFlag ? "Active" : "Inactive"}
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
