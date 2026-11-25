import { Pagination, usePagination } from "@/components/common/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { BooleanFilter } from "@/components/filters";
import { Modal } from "@/components/ui/Modal";
import { createCurrency, deleteCurrency, getAllCurrencies, updateCurrency } from "@/state/currencySlice";
import { AppDispatch, RootState } from "@/state/store";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface CurrencyData {
  id: number;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  activeFlag: boolean;
}

interface CurrencyFormData {
  id?: number | null;
  currencyCode: string;
  currencyName: string;
  symbol: string;
  activeFlag: boolean;
}

export function CurrencyMaster() {
  const { currencyList, pagination } = useSelector((state: RootState) => state.currency);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { currentPage, itemsPerPage, handlePageChange, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });


  // const { register, handleSubmit, reset, formState: { errors } } = useForm<CurrencyFormData>();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, touchedFields, isValid }
  } = useForm<CurrencyFormData>({
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onBlur' // Re-validate on blur
  });

  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(getAllCurrencies({ fetchAll: true }));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  const processedCityList = useMemo(() => {
    return currencyList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
      // serialNo: index + 1
    }));
  }, [currencyList]);

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
        width: 50,
        disableFilters: true,
      },
      { Header: "Currency Code", accessor: "currencyCode" },
      { Header: "Currency Name", accessor: "currencyName" },
      { Header: "Symbol", accessor: "symbol" },
      {
        Header: "Status",
        accessor: "activeFlag",
        Filter: BooleanFilter,
        Cell: ({ value }: { value: boolean }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value ? "Active" : "Inactive"}</span>
        ),
      },
    ],
    []
  );

  const handleOpenModal = (editing = false, currency: CurrencyData | null = null) => {
    if (editing && currency) {
      reset(currency);
      setCurrentCurrency(currency);
    } else {
      reset({ id: null, currencyCode: "", currencyName: "", symbol: "", activeFlag: true });
      setCurrentCurrency(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleDelete = (currency: CurrencyData) => {
    setCurrentCurrency(currency);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCurrency) return;
    try {
      await dispatch(deleteCurrency(currentCurrency.id)).unwrap();
      await dispatch(getAllCurrencies({fetchAll: true}));
    } catch (error) {
      console.error("Error deleting currency:", error);
    }
    setIsDeleteModalOpen(false);
  };

  // const onSubmit = async (data: CurrencyFormData) => {
  //   try {
  //     if (isEditing) {
  //       await dispatch(updateCurrency(data)).unwrap();
  //     } else {
  //       const { id, ...newCurrencyData } = data;
  //       await dispatch(createCurrency(newCurrencyData)).unwrap();
  //     }
  //     dispatch(getAllCurrencies({}));
  //     setIsModalOpen(false);
  //     reset();
  //   } catch (error) {
  //     console.error("Error submitting form:", error);
  //   }
  // };
  const onSubmit = async (data: CurrencyFormData) => {
    try {
      setServerErrors({});

      if (isEditing) {
        await dispatch(updateCurrency(data)).unwrap();
      } else {
        const { id, ...newCurrencyData } = data;
        await dispatch(createCurrency(newCurrencyData)).unwrap();
      }

      await dispatch(getAllCurrencies({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error submitting form:', error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      if (serverMessage.toLowerCase().includes('currency code')) {
        setServerErrors({ currencyCode: serverMessage });
        setError("currencyCode", { type: "manual", message: serverMessage }, { shouldFocus: true });
      } else if (serverMessage.toLowerCase().includes('currency name')) {
        setServerErrors({ currencyName: serverMessage });
        setError("currencyName", { type: "manual", message: serverMessage }, { shouldFocus: true });
      } else if (serverMessage.toLowerCase().includes('symbol')) {
        setServerErrors({ symbol: serverMessage });
        setError("symbol", { type: "manual", message: serverMessage }, { shouldFocus: true });
      }
    }
  };

  const handleView = (state: any) => {
    setCurrentCurrency(state);
    // setIsViewModalOpen(true);
  };

  const handleEdit = (state: any) => {
    setIsEditing(true);
    setCurrentCurrency(state);
    reset({
      id: state.id, currencyCode: state.currencyCode,
      currencyName: state.currencyName, symbol: state.symbol, activeFlag: state.activeFlag
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 pt-16">
<DataTable
        columns={columns}
        data={processedCityList}
        title="Currency Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Currency..."
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
      }} title={isEditing ? "Edit Currency" : "Add Currency"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Currency Code <span className="text-red-600">*</span> </label>
            <input {...register("currencyCode", {
              required: "Currency Code is required",
              validate: (value) => {
                if (!value) return true;
                const isDuplicate = currencyList.some((c: any) =>
                  c.currencyCode?.trim().toLowerCase() === value.trim().toLowerCase() &&
                  (!isEditing || c.id !== currentCurrency?.id)
                );
                return isDuplicate ? "Currency Code already exists" : true;
              }
            })}
              placeholder="Enter Currency Code"
              onChange={(e) => {
                if (serverErrors.currencyCode) {
                  setServerErrors({ ...serverErrors, currencyCode: '' });
                }
              }}
              className="input mt-1" />
            {serverErrors.currencyCode && !errors.currencyCode && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.currencyCode}</p>
            )}
            {errors.currencyCode && <p className="mt-1 text-sm text-red-600">{errors.currencyCode.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Currency Name <span className="text-red-600">*</span> </label>
            <input {...register("currencyName", {
              required: "Currency Name is required",
              validate: (value) => {
                if (!value) return true;
                const isDuplicate = currencyList.some((c: any) =>
                  c.currencyName?.trim().toLowerCase() === value.trim().toLowerCase() &&
                  (!isEditing || c.id !== currentCurrency?.id)
                );
                return isDuplicate ? "Currency Name already exists" : true;
              }
            })}
              placeholder="Enter Currency Name"
              onChange={(e) => {
                if (serverErrors.currencyName) {
                  setServerErrors({ ...serverErrors, currencyName: '' });
                }
              }}
              className="input mt-1" />
            {serverErrors.currencyName && !errors.currencyName && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.currencyName}</p>
            )}
            {errors.currencyName && <p className="mt-1 text-sm text-red-600">{errors.currencyName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Symbol <span className="text-red-600">*</span> </label>
            <input {...register("symbol", {
              required: "Symbol is required",
              validate: (value) => {
                if (!value) return true;
                const isDuplicate = currencyList.some((c: any) =>
                  c.symbol?.trim() === value.trim() &&
                  (!isEditing || c.id !== currentCurrency?.id)
                );
                return isDuplicate ? "Symbol already exists" : true;
              }
            })}
              placeholder="Enter Symbol"
              onChange={(e) => {
                if (serverErrors.symbol) {
                  setServerErrors({ ...serverErrors, symbol: '' });
                }
              }}
              className="input mt-1" />
            {serverErrors.symbol && !errors.symbol && (
              <p className="mt-1 text-sm text-red-600">{serverErrors.symbol}</p>
            )}
            {errors.symbol && <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select {...register("activeFlag", { required: "Status is required" })} className="input mt-1">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {errors.activeFlag && <p className="mt-1 text-sm text-red-600">{errors.activeFlag.message}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            {/* <button type="submit" className="btn btn-primary">{isEditing ? "Edit Currency" : "Add Currency"}</button> */}
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
              {isEditing ? "Update Currency" : "Add Currency"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete currency "{currentCurrency?.currencyName}"?</p>
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
