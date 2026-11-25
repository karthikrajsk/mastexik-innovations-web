import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createCountry, deleteCountry, getAllCountries, updateCountry } from "@/state/countrySlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from 'react-redux';

interface CountryFormData {
  id?: number | null;
  countryName: string;
  activeFlag: boolean;
}

export function CountryMaster() {

  const { countryList, pagination } = useSelector((state: RootState) => state.country);
  
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    setItemsPerPage,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const [selectedCountry, setSelectedCountry] = React.useState<CountryFormData | null>(null);
  const [country, setCountry] = useState(countryList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [apiError, setApiError] = useState("");


  const dispatch = useDispatch<AppDispatch>();

  // const { register, handleSubmit, reset, formState: { errors } } = useForm<CountryFormData>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<CountryFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur'
  });

  const countryNameValue = watch("countryName");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const existingCountryNames = useMemo(() => {
    if (!Array.isArray(countryList)) return [];
    return countryList
      .map((country: any) => (country?.countryName || "").trim())
      .filter(Boolean);
  }, [countryList]);

  const filteredSuggestions = useMemo(() => {
    const query = (countryNameValue || "").toLowerCase();
    if (!query) return [];
    return existingCountryNames
      .filter((name: string) => name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [countryNameValue, existingCountryNames]);

  const countryNameField = register("countryName", {
    required: "Country Name is required",
    validate: (value: string) => {
      const trimmedValue = (value || "").trim().toLowerCase();
      if (!trimmedValue) return true;
      const excludeName = isEditing ? (currentCountry?.countryName || "").trim().toLowerCase() : "";
      const exists = existingCountryNames.some((name: string) => {
        const normalized = name.trim().toLowerCase();
        return normalized === trimmedValue && normalized !== excludeName;
      });
      return exists ? "This country already exists" : true;
    },
  });

  useEffect(() => {
    const current = (countryNameValue || "").trim().toLowerCase();
    if (!current) {
      setDuplicateError("");
      return;
    }
    const excludeName = isEditing ? (currentCountry?.countryName || "").trim().toLowerCase() : "";
    const hasDuplicate = existingCountryNames.some((name: string) => {
      const normalized = name.trim().toLowerCase();
      return normalized === current && normalized !== excludeName;
    });
    setDuplicateError(hasDuplicate ? "This country already exists" : "");
  }, [countryNameValue, existingCountryNames, isEditing, currentCountry]);

  useEffect(() => {
    dispatch(getAllCountries({ 
    fetchAll: true,
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

  const resetCountrySuggestionState = () => {
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue("countryName", suggestion, { shouldValidate: true, shouldDirty: true });
    resetCountrySuggestionState();
  };

  const handleCountryNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case "Enter":
        if (activeSuggestionIndex >= 0) {
          event.preventDefault();
          handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

    const processedCityList = useMemo(() => {
    return countryList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [countryList, pagination.offset]);
  
  const columns = useMemo(
    () => [
      { Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true, },
      { Header: "Country Name", accessor: "countryName" },
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
    setCurrentCountry(state);
    reset({ id: state.id, countryName: state.countryName, activeFlag: state.activeFlag });
    setIsModalOpen(true);
  };

  const handleView = (state: any) => {
    setCurrentCountry(state);
    setIsViewModalOpen(true);
  };

  const handleOpenModal = (editing = false, country: CountryFormData | null = null) => {
    if (editing && country) {
      reset({
        id: country.id,
        countryName: country.countryName,
        activeFlag: country.activeFlag
      });
      setCountry(country);
    } else {
      reset({
        id: null,
        countryName: '',
        activeFlag: true
      });
      setCountry(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
    resetCountrySuggestionState();
  };

  // const onSubmit = async (data: CountryFormData) => {
  //   try {
  //     console.log('Form data submitted:', data); // Add this to debug

  //     if (isEditing) {
  //       await dispatch(updateCountry({
  //         ...data,
  //       }));
  //     } else {
  //       const { id, ...newCountryData } = data;
  //       await dispatch(createCountry({
  //         ...newCountryData,
  //       }));
  //     }
  //     resetPage();
  //     await dispatch(getAllCountries({ offset: 0, limit: itemsPerPage }));
  //     resetCountrySuggestionState();
  //     setIsModalOpen(false);
  //     reset();
  //   } catch (error) {
  //     console.error('Error submitting form:', error);
  //   }
  // };

  const onSubmit = async (data: CountryFormData) => {
  try {
    setApiError("");
    console.log('Form data submitted:', data);

    let result;
    if (isEditing) {
      result = await dispatch(updateCountry({
        ...data,
      })).unwrap();
    } else {
      const { id, ...newCountryData } = data;
      result = await dispatch(createCountry({
        ...newCountryData,
      })).unwrap();
    }
    
    resetPage();
    await dispatch(getAllCountries({ fetchAll: true }));
    resetCountrySuggestionState();
    setIsModalOpen(false);
    reset();
  } catch (error: any) {
    // const errorMessage = error?.message || "Country with this name already exists";
    // setApiError(errorMessage);
    console.error('Error submitting form:', error);
  }
};
  const handleDelete = (state: any) => {
    setCurrentCountry(state);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCountry) return;

    try {
      await dispatch(deleteCountry(currentCountry.id)).unwrap();
      resetPage();
      await dispatch(getAllCountries({ fetchAll: true }));
    } catch (error) {
      console.error("Error deleting country:", error);
    }

    setIsDeleteModalOpen(false);
  };

  return (
    <div>

      <DataTable
        columns={columns}
        data={processedCityList}
        title="Country Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Country..."
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
  resetCountrySuggestionState();
  setApiError("");
}} title={isEditing ? "Edit Country" : "Add Country"}>
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    {/* {apiError && (
      <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
        {apiError}
      </div>
    )} */}
          <div className="relative">
            <label className="block text-sm font-medium">Country Name <span className="text-red-600">*</span></label>
            <input
              name={countryNameField.name}
              ref={countryNameField.ref}
              onBlur={(event) => {
                countryNameField.onBlur(event);
                setTimeout(() => {
                  setShowSuggestions(false);
                  setActiveSuggestionIndex(-1);
                }, 200);
              }}
              onChange={(event) => {
                countryNameField.onChange(event);
                setShowSuggestions(true);
                setActiveSuggestionIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleCountryNameKeyDown}
              placeholder="EnterCountry Name"
              className={`input mt-1 ${errors.countryName ? 'border-red-500' : ''}`}
              autoComplete="off"
            />
            {(showSuggestions && filteredSuggestions.length > 0) && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                {filteredSuggestions.map((suggestion: string, index: number) => (
                  <li
                    key={suggestion}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                      index === activeSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''
                    }`}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleSuggestionClick(suggestion);
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
            {duplicateError && !errors.countryName && (
              <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
            )}
            {errors.countryName && (
              <p className="mt-1 text-sm text-red-600">{errors.countryName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select {...register("activeFlag")} className="input mt-1">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          {/* <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{isEditing ? "Update Country" : "Add Country"}</button>
          </div> */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetCountrySuggestionState();
              }}
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
              {isEditing ? "Update Country" : "Add Country"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete country "{currentCountry?.countryName}"?</p>
          {/* <p className="text-red-600 text-sm">This action cannot be undone.</p> */}
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Country Details">
        {currentCountry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Country Name</p>
                <p className="font-medium">{currentCountry.countryName}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentCountry.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentCountry.activeFlag ? "Active" : "Inactive"}
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

