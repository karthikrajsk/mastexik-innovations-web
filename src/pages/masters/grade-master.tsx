import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Grade, createGrandMaster, deleteGrandMaster, getAllGrandMaster, updateGrandMaster } from "@/state/gradeMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, UseFormSetError } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/components/common/Pagination";

interface GradeFormData {
  id?: number | null;
  gradeName: string;
  gradeCode: string;
  minPoint?: string | number;
  maxPoint?: string | number;
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

const handleGradeSaveError = (error: any, setError: UseFormSetError<GradeFormData>) => {
  const message = resolveApiErrorMessage(error, "Failed to save grade");
  const normalized = (message || "").toLowerCase();
  const field: keyof GradeFormData = normalized.includes("code")
    ? "gradeCode"
    : "gradeName";
  setError(field, { type: "server", message }, { shouldFocus: true });
  return message;
};

export function GradeMaster() {

  const { gradeList, pagination } = useSelector((state: RootState) => state.grade);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { currentPage, itemsPerPage, getOffset, resetPage, handlePageChange , setItemsPerPage} = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // const { register, handleSubmit, reset, formState: { errors } } = useForm<GradeFormData>();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isValid }
  } = useForm<GradeFormData>({
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onBlur' // Re-validate on blur
  });

  const gradeNameValue = watch("gradeName") ?? "";
  const gradeCodeValue = watch("gradeCode") ?? "";
  const editingGradeId = currentGrade?.id ?? null;
  const duplicateNameError = "Grade Name already exists";
  const duplicateCodeError = "Grade Code already exists";

  const normalizeInput = (value?: string | null) => (value ?? "").trim().toLowerCase();

  const isDuplicateGradeName = (value?: string | null) => {
    const normalized = normalizeInput(value);
    if (!normalized) return false;
    return gradeList.some((grade: Grade) => {
      if (!grade?.gradeName) return false;
      if (grade.id === editingGradeId) return false;
      return normalizeInput(grade.gradeName) === normalized;
    });
  };

  const isDuplicateGradeCode = (value?: string | null) => {
    const normalized = normalizeInput(value);
    if (!normalized) return false;
    return gradeList.some((grade: Grade) => {
      if (!grade?.gradeCode) return false;
      if (grade.id === editingGradeId) return false;
      return normalizeInput(grade.gradeCode) === normalized;
    });
  };

  const hasDuplicateGradeName = useMemo(
    () => isDuplicateGradeName(gradeNameValue),
    [gradeList, gradeNameValue, editingGradeId]
  );

  const hasDuplicateGradeCode = useMemo(
    () => isDuplicateGradeCode(gradeCodeValue),
    [gradeList, gradeCodeValue, editingGradeId]
  );

  const gradeNameErrorMessage =
    errors.gradeName?.message || (hasDuplicateGradeName ? duplicateNameError : undefined);
  const gradeCodeErrorMessage =
    errors.gradeCode?.message || (hasDuplicateGradeCode ? duplicateCodeError : undefined);

  const isSubmitDisabled = !isValid || hasDuplicateGradeName || hasDuplicateGradeCode;

  useEffect(() => {
    dispatch(getAllGrandMaster({fetchAll:true }));
    // console.log(gradeList);
  }, [dispatch,location.pathname, currentPage, getOffset, itemsPerPage]);

    const processedCityList = useMemo(() => {
      return gradeList.map((city: any, index: number) => ({
        ...city,
        serialNo: (pagination.offset || 0) + index + 1
      }));
    }, [gradeList, pagination.offset]);

  const columns = useMemo(() => [
    { Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true, },
    { Header: "Grade Name", accessor: "gradeName" },
    { Header: "Grade Code", accessor: "gradeCode" },
    { Header: "Min Point", accessor: "minPoint" },
    { Header: "Max Point", accessor: "maxPoint" },
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

  const handleOpenModal = (editing = false, grandMaster: Grade | null = null) => {
    if (editing && grandMaster) {
      reset({ ...grandMaster });
      setCurrentGrade(grandMaster);
    } else {
      reset({ id: null, gradeName: "", description: "", activeFlag: true });
      setCurrentGrade(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleDelete = (grandMaster: Grade) => {
    setCurrentGrade(grandMaster);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentGrade) return;
    try {
      await dispatch(deleteGrandMaster(currentGrade.id)).unwrap();
      resetPage();
      dispatch(getAllGrandMaster({fetchAll:true }));
    } catch (error) {
      console.error("Delete failed:", error);
    }
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: GradeFormData) => {
    if (isDuplicateGradeName(data.gradeName) || isDuplicateGradeCode(data.gradeCode)) {
      return;
    }
    try {
      if (isEditing) {
        await dispatch(updateGrandMaster(data)).unwrap();
      } else {
        await dispatch(createGrandMaster(data)).unwrap();
      }
      resetPage();
      dispatch(getAllGrandMaster({fetchAll:true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      handleGradeSaveError(error, setError);
      console.error("Submit failed:", error);
    }
  };

  const handleView = (state: any) => {
    setCurrentGrade(state);
    setIsViewModalOpen(true);
  };

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setCurrentGrade(state);
    reset({
      id: state.id, gradeName: state.gradeName, minPoint: state.minPoint, maxPoint: state.maxPoint,
      gradeCode: state.gradeCode, description: state.description, activeFlag: state.activeFlag
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Grade Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Grade..."
        disableFullDataFetch={true}
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
        offset={pagination.offset}
        hasNext={pagination.next}
        hasPrev={pagination.prev}
        onPageChange={handlePageChange}
      /> */}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Grade" : "Add Grade"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Grade Name <span className="text-red-600">*</span> </label>
            <input
              {...register("gradeName", {
                required: "Grade Name is required",
                validate: (value) =>
                  isDuplicateGradeName(value) ? duplicateNameError : true
              })}
              className="input mt-1"
            />
            {gradeNameErrorMessage && <p className="mt-1 text-sm text-red-600">{gradeNameErrorMessage}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Grade Code <span className="text-red-600">*</span> </label>
            <input
              {...register("gradeCode", {
                required: "Grade Code is required",
                validate: (value) =>
                  isDuplicateGradeCode(value) ? duplicateCodeError : true
              })}
              className="input mt-1"
            />
            {gradeCodeErrorMessage && <p className="mt-1 text-sm text-red-600">{gradeCodeErrorMessage}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Min Point <span className="text-red-600">*</span> </label>
            <input {...register("minPoint", { required: "Min Point is required" })} className="input mt-1" />
            {errors.minPoint && <p className="mt-1 text-sm text-red-600">{errors.minPoint.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Max Point <span className="text-red-600">*</span> </label>
            <input {...register("maxPoint", { required: "Max Point is required" })} className="input mt-1" />
            {errors.maxPoint && <p className="mt-1 text-sm text-red-600">{errors.maxPoint.message}</p>}
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
                  ? hasDuplicateGradeName
                    ? duplicateNameError
                    : hasDuplicateGradeCode
                    ? duplicateCodeError
                    : "Please fill all required fields"
                  : ""
              }
            >
              {isEditing ? "Update Grade" : "Add Grade"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete Grade?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Grade Details">
        {currentGrade && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Grade Name</p>
                <p className="font-medium">{currentGrade.gradeName}</p>
              </div>
              <div>
                <p className="text-sm">Grade Code</p>
                <p className="font-medium">{currentGrade.gradeCode}</p>
              </div>
              <div>
                <p className="text-sm">Min Point</p>
                <p className="font-medium">{currentGrade.minPoint}</p>
              </div>
              <div>
                <p className="text-sm">Max Point</p>
                <p className="font-medium">{currentGrade.maxPoint}</p>
              </div>
              <div>
                <p className="text-sm">Description</p>
                <p className="font-medium">{currentGrade.description}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentGrade.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentGrade.activeFlag ? "Active" : "Inactive"}
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
