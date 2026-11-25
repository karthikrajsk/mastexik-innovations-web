import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { createCity, deleteCity, getAllCities, updateCity } from "@/state/citySlice";
import { getAllCountries } from "@/state/countrySlice";
import { getAllStates } from "@/state/stateSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface cityData {
  id: number;
  countryId: string;
  stateId: string;
  countryName: string;
  stateName: string;
  cityName: string;
  activeFlag: boolean;
}

interface CityFormData {
  id?: number | null;
  countryId: string;
  stateId: string;
  countryName: string;
  stateName: string;
  cityName: string;
  activeFlag: boolean;
}

export function CityMaster() {

  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const activeCountries = useMemo(() => {
    if (!Array.isArray(countryList)) return [];
    return countryList.filter((country: any) => country.activeFlag);
  }, [countryList]);
  const activeStates = useMemo(() => {
    if (!Array.isArray(stateList)) return [];
    return stateList.filter((state: any) => state.activeFlag);
  }, [stateList]);
  const { cityList, pagination } = useSelector((state: RootState) => state.city);
  const {
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  const [city, setCity] = useState(cityList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState<any>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // const { register, handleSubmit, reset, formState: { errors } } = useForm<CityFormData>();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    watch,
    formState: { errors, touchedFields, isValid }
  } = useForm<CityFormData>({
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onBlur' // Re-validate on blur
  });
  const countryIdValue = watch("countryId");
  const filteredStates = useMemo(() => {
    if (!countryIdValue) return activeStates;
    return activeStates.filter((state: any) => String(state.countryId) === String(countryIdValue));
  }, [activeStates, countryIdValue]);

  useEffect(() => {
    dispatch(getAllCountries({ fetchAll: true }));
    dispatch(getAllStates({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllCities({
    fetchAll: true,
    }));
  }, [currentPage, dispatch, getOffset, itemsPerPage]);

  const processedCityList = useMemo(() => {
    return cityList.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
    }));
  }, [cityList, pagination.offset]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No", accessor: 'serialNo', // ✅ Use pre-calculated serial number
        width: 50,
        disableFilters: true,

      },
      { Header: "Country", accessor: "countryName" },
      { Header: "State", accessor: "stateName" },
      { Header: "City", accessor: "cityName" },
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

  const handleEdit = (city: any) => {
    setIsEditing(true);
    setCurrentCity(city);
    reset(city);
    setIsModalOpen(true);
  };

  const handleDelete = (state: any) => {
    setCurrentCity(state);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentCity) return;

    try {
      await dispatch(deleteCity(currentCity.id)).unwrap();
      resetPage();
      await dispatch(getAllCities({ fetchAll: true }));
    } catch (error) {
      console.error("Error deleting country:", error);
    }

    setIsDeleteModalOpen(false);
  };

  const handleView = (city: any) => {
    setCurrentCity(city);
    setIsViewModalOpen(true);
  };

  const handleOpenModal = (editing = false, city: cityData | null = null) => {
    if (editing && city) {
      reset({
        id: city.id,
        countryId: city.countryId,
        stateId: city.stateId,
        countryName: city.countryName,
        stateName: city.stateName,
        cityName: city.cityName,
        activeFlag: city.activeFlag
      });
      setCity(city);
    } else {
      reset({
        id: null,
        countryId: '',
        stateId: '',
        countryName: '',
        stateName: '',
        cityName: '',
        activeFlag: true
      });
      setCity(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };


  const handleCitySaveError = (message: string) => {
    const normalized = (message || "").toLowerCase();
    if (normalized.includes("country")) {
      setError("countryId", { type: "server", message }, { shouldFocus: true });
      return;
    }

    if (normalized.includes("state")) {
      setError("stateId", { type: "server", message }, { shouldFocus: true });
      return;
    }

    setError("cityName", { type: "server", message }, { shouldFocus: true });
  };

  const onSubmit = async (data: CityFormData) => {
    try {
      console.log('Form data submitted:', data); // Add this to debug

      const normalizedCountryId = data.countryId?.toString() ?? "";
      const normalizedStateId = data.stateId?.toString() ?? "";
      const normalizedCityName = (data.cityName || "").trim().toLowerCase();
      const isDuplicate = cityList.some((cityItem: any) => {
        if (!cityItem) return false;
        const cityCountryId = cityItem.countryId?.toString() ?? "";
        const cityStateId = cityItem.stateId?.toString() ?? "";
        const cityNameValue = (cityItem.cityName || "").trim().toLowerCase();
        return (
          cityCountryId === normalizedCountryId &&
          cityStateId === normalizedStateId &&
          cityNameValue === normalizedCityName &&
          cityItem.id !== data.id
        );
      });
      if (isDuplicate) {
        setError("cityName", { type: "manual", message: "You’ve already added this country, state, and city" }, { shouldFocus: true });
        return;
      }
      clearErrors("cityName");

      if (isEditing) {
        await dispatch(updateCity({
          ...data,
        })).unwrap();
      } else {
        const { id, ...newCityData } = data;
        await dispatch(createCity({
          ...newCityData,
        })).unwrap();
      }
      resetPage();
      await dispatch(getAllCities({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      const message = typeof error === "string" ? error : error?.message;
      if (message) {
        handleCitySaveError(message);
      }
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={processedCityList}
        title="City Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search City..."
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit City" : "Add City"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              Select Country <span className="text-red-600">*</span>
            </label>

            <CommonSearchableSelect
              options={(activeCountries || []).map((country: any) => ({
                value: String(country.id),
                label: country.countryName || `Country ${country.id}`,
              }))}
              placeholder="Select a Country"
              {...register("countryId", { required: "Country is required" })}
              error={touchedFields.countryId && errors.countryId ? errors.countryId.message as string : undefined}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Select State <span className="text-red-600">*</span>
            </label>

            <CommonSearchableSelect
              options={(filteredStates || []).map((state: any) => ({
                value: String(state.id),
                label: state.stateName || `State ${state.id}`,
              }))}
              placeholder="Select a State"
              {...register("stateId", { required: "State is required" })}
              error={touchedFields.stateId && errors.stateId ? errors.stateId.message as string : undefined}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">City <span className="text-red-600">*</span> </label>
            <input {...register("cityName", { required: "City Name is required" })}
              placeholder="Enter City Name"
              className="input mt-1" />
            {/* {errors.cityName && <p className="mt-1 text-sm text-red-600">{errors.cityName.message}</p>} */}
            {(touchedFields.cityName && errors.cityName) && (
              <p className="mt-1 text-sm text-red-600">
                {errors.cityName.message}
              </p>
            )}
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
            {/* <button type="submit" className="btn btn-primary">{isEditing ? "Update City" : "Add City"}</button> */}
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
              {isEditing ? "Update City" : "Add City"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete state "{currentCity?.cityName}"?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="City Details">
        {currentCity && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Country Name</p>
                <p className="font-medium">{currentCity.countryName}</p>
              </div>
              <div>
                <p className="text-sm">State Name</p>
                <p className="font-medium">{currentCity.stateName}</p>
              </div>
              <div>
                <p className="text-sm">City Name</p>
                <p className="font-medium">{currentCity.cityName}</p>
              </div>
              <div>
                <p className="text-sm">Status</p>
                <p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${currentCity.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                  >
                    {currentCity.activeFlag ? "Active" : "Inactive"}
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
