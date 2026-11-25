import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createPaymentTerms, deletePaymentTerms, getAllPaymentTerms, updatePaymentTerms } from "@/state/paymentTermsSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface PaymentTermData {
  id: number;
  termName: string;
  description: string;
  activeFlag: boolean;
}

interface PaymentTermFormData {
  id?: number | null;
  termName: string;
  description: string;
  activeFlag: boolean;
}

export function PaymentTermsMaster() {
  const { paymentTermsList, pagination } = useSelector((state: RootState) => state.paymentTerms);
  
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPaymentTerm, setCurrentPaymentTerm] = useState<PaymentTermData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  const dispatch = useDispatch<AppDispatch>();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isValid }
  } = useForm<PaymentTermFormData>({
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onBlur' // Re-validate on blur
  });

  const termNameValue = watch("termName") ?? "";
  const editingTermId = currentPaymentTerm?.id ?? null;
  const duplicateTermNameErrorMessage = "Payment Term Name already exists";

  const normalizeTermName = (value?: string | null) => (value ?? "").trim().toLowerCase();

  const isDuplicateTermName = (value?: string | null) => {
    const normalizedValue = normalizeTermName(value);
    if (!normalizedValue) {
      return false;
    }
    return paymentTermsList.some((term: PaymentTermData) => {
      if (!term?.termName) {
        return false;
      }
      if (term.id === editingTermId) {
        return false;
      }
      return normalizeTermName(term.termName) === normalizedValue;
    });
  };

  const hasDuplicateTermName = useMemo(
    () => isDuplicateTermName(termNameValue),
    [paymentTermsList, termNameValue, editingTermId]
  );

  const termNameErrorMessage =
    errors.termName?.message || (hasDuplicateTermName ? duplicateTermNameErrorMessage : undefined);

  const isSubmitDisabled = !isValid || hasDuplicateTermName;

  useEffect(() => {
    dispatch(getAllPaymentTerms({ 
      fetchAll: true
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

    const processedCityList = useMemo(() => {
      return paymentTermsList.map((city: any, index: number) => ({
        ...city,
        serialNo: (pagination.offset || 0) + index + 1
      }));
    }, [paymentTermsList, pagination.offset]);

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
        <span className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value ? "Active" : "Inactive"}</span>
      ),
    },
  ], []);

  const handleOpenModal = (editing = false, paymentTerm: PaymentTermData | null = null) => {
    if (editing && paymentTerm) {
      reset({ ...paymentTerm });
      setCurrentPaymentTerm(paymentTerm);
    } else {
      reset({ id: null, termName: "", description: "", activeFlag: true });
      setCurrentPaymentTerm(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleDelete = (paymentTerm: PaymentTermData) => {
    setCurrentPaymentTerm(paymentTerm);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentPaymentTerm) return;
    try {
      await dispatch(deletePaymentTerms(currentPaymentTerm.id)).unwrap();
      resetPage();
      await dispatch(getAllPaymentTerms({ fetchAll: true }));
    } catch (error) {
      console.error("Error deleting payment term:", error);
    }
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: PaymentTermFormData) => {
    if (isDuplicateTermName(data.termName)) {
      return;
    }
    try {
      setServerErrors({});

      if (isEditing) {
        await dispatch(updatePaymentTerms(data)).unwrap();
      } else {
        await dispatch(createPaymentTerms(data)).unwrap();
      }

      resetPage();
      await dispatch(getAllPaymentTerms({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      if (serverMessage.toLowerCase().includes('term') || serverMessage.toLowerCase().includes('term_name')) {
        setServerErrors({ termName: serverMessage });
        setError("termName", { type: "manual", message: serverMessage }, { shouldFocus: true });
      } else {
        setServerErrors({ general: serverMessage });
      }
    }
  };

  const handleView = (state: any) => {
    setCurrentPaymentTerm(state);
    setIsViewModalOpen(true);
  };

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setCurrentPaymentTerm(state);
    reset({ id: state.id, termName: state.termName, description: state.description, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  return (
    <div>
     
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Payment Terms Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Payment Terms..."
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

      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setServerErrors({});
      }} title={isEditing ? "Edit Payment Term" : "Add Payment Term"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Payment Term Name <span className="text-red-600">*</span> </label>
            <input {...register("termName", {
              required: "Payment Term Name is required",
              validate: (value) =>
                isDuplicateTermName(value) ? duplicateTermNameErrorMessage : true
            })}
              placeholder="Enter Payment Term Name"
              onChange={(e) => {
                if (serverErrors.termName) {
                  setServerErrors({ ...serverErrors, termName: '' });
                }
              }}
              className="input mt-1" />
            {serverErrors.termName && !termNameErrorMessage && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.termName}</p>
            )}
            {termNameErrorMessage && <p className="mt-1 text-sm text-red-600">{termNameErrorMessage}</p>}
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
                        ${isSubmitDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
                  : 'btn-primary hover:bg-blue-700'
                }
                        transition-colors duration-200
                      `}
              disabled={isSubmitDisabled}
              title={
                isSubmitDisabled
                  ? hasDuplicateTermName
                    ? duplicateTermNameErrorMessage
                    : "Please fill all required fields"
                  : ""
              }
            >
              {isEditing ? "Update Term" : "Add Term"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View Payment Term">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Term Name</label>
            <p className="mt-1 px-4 py-2 border rounded bg-gray-50">{currentPaymentTerm?.termName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="mt-1 px-4 py-2 border rounded bg-gray-50 whitespace-pre-wrap break-words">{currentPaymentTerm?.description}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1"><span className={`px-2 py-1 rounded-full text-xs ${currentPaymentTerm?.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{currentPaymentTerm?.activeFlag ? "Active" : "Inactive"}</span></p>
          </div>
          <div className="flex justify-end pt-4">
            <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">Close</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete term "{currentPaymentTerm?.termName}"?</p>
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
