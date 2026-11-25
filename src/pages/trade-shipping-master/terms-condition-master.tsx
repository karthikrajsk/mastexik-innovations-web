import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createTermsCondition, deleteTermsCondition, getAllTermsConditions, updateTermsCondition } from "@/state/termsConditions";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface TermsConditionData {
    id: number;
    termsConditionsName: string;
    description: string;
    activeFlag: boolean;
}

interface TermsConditionFormData {
    id?: number | null;
    termsConditionsName: string;
    description: string;
    activeFlag: boolean;
}

export function TermsConditionMaster() {
    const { termsContitionsList, pagination } = useSelector((state: RootState) => state.termsConditions);
    
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
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentTermsCondition, setCurrentTermsCondition] = useState<TermsConditionData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

    const dispatch = useDispatch<AppDispatch>();

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isValid }
    } = useForm<TermsConditionFormData>({
        mode: 'onBlur',
        reValidateMode: 'onBlur'
    });

    useEffect(() => {
        dispatch(getAllTermsConditions({ 
            fetchAll: true
        }));
    }, [currentPage, dispatch, getOffset, itemsPerPage]);

      const processedCityList = useMemo(() => {
        return termsContitionsList.map((city: any, index: number) => ({
          ...city,
          serialNo: (pagination.offset || 0) + index + 1
        }));
      }, [termsContitionsList, pagination.offset]);

    const columns = useMemo(() => [
        {
            Header: "S.No",
            accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true,
        },
        {
            Header: "Terms & Conditions",
            accessor: "termsConditionsName",
            Cell: ({ value }: { value: string }) => (
                <div className="max-w-md whitespace-pre-wrap">{value}</div>
            )
        },
        {
            Header: "Description",
            accessor: "description",
            width: 300, // pixels
            Cell: ({ value }: { value: string }) => (
                <div className="whitespace-pre-wrap break-words">
                    {value}
                </div>
            )
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
    ], []);

    const handleOpenModal = (editing = false, termsCondition: TermsConditionData | null = null) => {
        if (editing && termsCondition) {
            reset({ ...termsCondition });
            setCurrentTermsCondition(termsCondition);
        } else {
            reset({
                id: null,
                termsConditionsName: "",
                description: "",
                activeFlag: true
            });
            setCurrentTermsCondition(null);
        }
        setIsEditing(editing);
        setIsModalOpen(true);
    };

    const handleDelete = (termsCondition: TermsConditionData) => {
        setCurrentTermsCondition(termsCondition);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentTermsCondition) return;
        try {
            await dispatch(deleteTermsCondition(currentTermsCondition.id)).unwrap();
            resetPage();
            await dispatch(getAllTermsConditions({ fetchAll: true }));
        } catch (error) {
            console.error("Error deleting terms condition:", error);
        }
        setIsDeleteModalOpen(false);
    };

    const onSubmit = async (data: TermsConditionFormData) => {
        try {
            setServerErrors({});

            if (isEditing) {
                await dispatch(updateTermsCondition(data)).unwrap();
            } else {
                await dispatch(createTermsCondition(data)).unwrap();
            }

            resetPage();
            await dispatch(getAllTermsConditions({ fetchAll: true }));
            setIsModalOpen(false);
            reset();
        } catch (error: any) {
            console.error('Error submitting form:', error);

            const serverMessage =
                typeof error?.payload === "string"
                    ? error.payload
                    : error?.payload?.message || error?.message || "An unexpected error occurred";

            if (serverMessage.toLowerCase().includes('termsconditionsname') || serverMessage.toLowerCase().includes('terms') || serverMessage.toLowerCase().includes('condition')) {
                setServerErrors({ termsConditionsName: serverMessage });
                setError("termsConditionsName", { type: "manual", message: serverMessage }, { shouldFocus: true });
            } else {
                setServerErrors({ general: serverMessage });
            }
        }
    };

    const handleView = (state: any) => {
        setCurrentTermsCondition(state);
        setIsViewModalOpen(true);
    };

    const handleEdit = (state: any) => {
        setIsEditing(true);
        setCurrentTermsCondition(state);
        reset({
            id: state.id,
            termsConditionsName: state.termsConditionsName,
            description: state.description,
            activeFlag: state.activeFlag
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 pt-16">
         
            <DataTable
                columns={columns}
                data={processedCityList}
                title="Terms & Conditions Master"
                onAdd={() => handleOpenModal(false)}
                onEdit={handleEdit}
                // onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                showColumnFilters={true}
                filterPlaceholder="Search Terms & Conditions..."
                disableFullDataFetch={true}
        //          initialPageSize={itemsPerPage}
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

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setServerErrors({});
                }}
                title={isEditing ? "Edit Terms & Condition" : "Add Terms & Condition"}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">
                            Terms & Conditions Name <span className="text-red-600">*</span>
                        </label>
                        <input
                            {...register("termsConditionsName", {
                                required: "Terms & Conditions Name is required",
                                minLength: {
                                    value: 1,
                                    message: "Terms & Conditions Name must be at least 1 character"
                                },
                                maxLength: {
                                    value: 50,
                                    message: "Terms & Conditions Name must not exceed 50 characters"
                                }
                            })}
                            placeholder="Enter Terms & Conditions Name"
                            onChange={(e) => {
                                if (serverErrors.termsConditionsName) {
                                    setServerErrors({ ...serverErrors, termsConditionsName: '' });
                                }
                            }}
                            className="input mt-1 w-full"
                        />
                        {serverErrors.termsConditionsName && !errors.termsConditionsName && (
                            <p className="mt-1 text-sm text-red-600">{serverErrors.termsConditionsName}</p>
                        )}
                        {errors.termsConditionsName && <p className="mt-1 text-sm text-red-600">{errors.termsConditionsName.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Description</label>
                        <textarea
                            {...register("description")}
                            placeholder="Enter Description"
                            rows={3}
                            className="input mt-1 w-full resize-vertical"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Status</label>
                        <select {...register("activeFlag")} className="input mt-1 w-full">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
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
                        <button
                            type="submit"
                            className={`btn 
                ${!isValid
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                    : 'btn-primary hover:bg-blue-700'
                                }
                transition-colors duration-200
              `}
                            disabled={!isValid}
                            title={!isValid ? "Please fill all required fields" : ""}
                        >
                            {isEditing ? "Update Terms & Condition" : "Add Terms & Condition"}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="View Terms & Condition"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Terms & Conditions Name</label>
                        <p className="mt-1 px-4 py-2 border rounded bg-gray-50">{currentTermsCondition?.termsConditionsName}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 px-4 py-2 border rounded bg-gray-50 whitespace-pre-wrap break-words">{currentTermsCondition?.description}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <p className="mt-1"><span className={`px-2 py-1 rounded-full text-xs ${currentTermsCondition?.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{currentTermsCondition?.activeFlag ? "Active" : "Inactive"}</span></p>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">Close</button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <p>Are you sure you want to delete terms & condition "{currentTermsCondition?.termsConditionsName}"?</p>
                    <p className="text-red-600 text-sm">This action cannot be undone.</p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="btn btn-danger"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}