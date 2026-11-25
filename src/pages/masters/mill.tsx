import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/data/DataTable";
import { usePagination } from "@/components/common/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { createMill, deleteMill, getAllMills, updateMill } from "@/state/millSlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCountries } from "@/state/countrySlice";
import { getAllCities } from "@/state/citySlice";
import { getSubCategoryByCategory } from "@/state/subCategorySlice";
import { Trash, X } from "lucide-react";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { BooleanFilter } from "@/components/filters";

interface AddressDetail {
    id?: number;
    line1: string;
    line2: string;
    countryId: string;
    stateId: string;
    cityId: string;
    stateCode: string;
    pinCode: string;
    activeFlag: boolean;
}

interface millData {
    id?: number | null;
    millName: string;
    millTypeId: number | string | null;
    millTypeName?: string;
    contactPerson?: string;
    contactNumber?: string;
    activeFlag?: boolean;
    address: AddressDetail[]; // always array!
}

interface millFormData extends millData { }

export function MillMaster() {
    const dispatch = useDispatch<AppDispatch>();
    const { stateList } = useSelector((state: RootState) => state.state);
    const { countryList } = useSelector((state: RootState) => state.country);
    const { cityList } = useSelector((state: RootState) => state.city);
    const { subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
    const { millList, pagination } = useSelector((state: RootState) => state.mill);

    // Normalize address to array for all rows
    const normalizedMillList = useMemo(
        () =>
            (Array.isArray(millList) ? millList : []).map((m: any) => ({
                ...m,
                address: Array.isArray(m.address) ? m.address : m.address ? [m.address] : [],
            })),
        [millList]
    );

    const [currentMill, setCurrentMill]: any = useState(null);
    const [addressDetails, setAddressDetails] = useState<AddressDetail[]>([]);

    const processedMillList = useMemo(() => {
        const baseSerial = pagination?.offset || 0;
        return normalizedMillList.map((mill, index) => {
            return {
                ...mill,
                serialNo: baseSerial + index + 1,
                millTypeDisplay: mill.millTypeName || `Type ${mill.millTypeId || ""}`,
            };
        });
    }, [normalizedMillList, pagination?.offset]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const {
        currentPage,
        itemsPerPage,
        setItemsPerPage,
        handlePageChange,
        resetPage,
        getOffset,
    } = usePagination({ itemsPerPage: 10 });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, touchedFields, isValid }
    } = useForm<millFormData>({
        mode: 'onBlur',
        reValidateMode: 'onBlur'
    });

    useEffect(() => {
        dispatch(getAllCountries({ fetchAll: true }));
        dispatch(getAllStates({ fetchAll: true }));
        dispatch(getAllCities({ fetchAll: true }));
        dispatch(getSubCategoryByCategory({ categoryName: "Mill Type", fetchAll: true, activeOnly: true }));
    }, [dispatch]);

    useEffect(() => {
        const params: any = {
            fetchAll: true
        };
        dispatch(getAllMills(params));
    }, [dispatch, currentPage, itemsPerPage]);

    // Get state code by state ID
    const getStateCode = (stateId: string) => {
        const state = stateList.find((state: any) => state.id.toString() === stateId);
        return state ? state.stateCode : "";
    };

    const statesByCountry = useMemo(() => {
        const map = new Map<string, any[]>();
        (stateList || []).forEach((state: any) => {
            const key = String(state.countryId ?? state.country_id ?? "").trim();
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)?.push(state);
        });
        return map;
    }, [stateList]);

    const citiesByState = useMemo(() => {
        const map = new Map<string, any[]>();
        (cityList || []).forEach((city: any) => {
            const key = String(city.stateId ?? city.state_id ?? "").trim();
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)?.push(city);
        });
        return map;
    }, [cityList]);

    const getStatesForCountry = (countryId?: string) => {
        const key = countryId ? String(countryId) : "";
        if (!key) return [];
        return statesByCountry.get(key) ?? [];
    };

    const getCitiesForState = (stateId?: string) => {
        const key = stateId ? String(stateId) : "";
        if (!key) return [];
        return citiesByState.get(key) ?? [];
    };

    const handleCountryChange = (index: number, countryId: string) => {
        setAddressDetails((prev) =>
            prev.map((addr, i) =>
                i === index
                    ? { ...addr, countryId, stateId: "", stateCode: "", cityId: "" }
                    : addr
            )
        );
    };

    const handleStateChange = (index: number, stateId: string) => {
        setAddressDetails((prev) =>
            prev.map((addr, i) =>
                i === index
                    ? { ...addr, stateId, stateCode: getStateCode(stateId), cityId: "" }
                    : addr
            )
        );
    };

    const columns = useMemo(
        () => [
            { Header: "S.No", accessor: "serialNo", disableFilters: true, width: 60 },
            { Header: "Mill Name", accessor: "millName" },
            { Header: "Mill Type", accessor: "millTypeDisplay" },
            { Header: "Contact Person", accessor: "contactPerson" },
            { Header: "Contact Number", accessor: "contactNumber" },
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

    const handleAddAddress = () => {
        setAddressDetails([...addressDetails, {
            id: addressDetails.length + 1,
            line1: "",
            line2: "",
            countryId: "",
            stateId: "",
            cityId: "",
            stateCode: "",
            pinCode: "",
            activeFlag: true
        }]);
    };

    const handleDeleteAddress = (id: any) => {
        setAddressDetails(addressDetails.filter((item: any) => item.id !== id));
    };

    const handleEdit = (mill: millData) => {
        setIsEditing(true);
        setCurrentMill(mill);

        const millAddresses = (Array.isArray(mill.address) ? mill.address : mill.address ? [mill.address] : []).map(addr => ({
            ...addr,
            pinCode: addr.pinCode || (addr as any).pincode || ""
        }));
        setAddressDetails(millAddresses);

        reset({
            id: mill.id,
            millName: mill.millName,
            millTypeId: mill.millTypeId ? String(mill.millTypeId) : "",
            contactPerson: mill.contactPerson,
            contactNumber: mill.contactNumber,
            activeFlag: mill.activeFlag,
            address: millAddresses,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (mill: any) => {
        setCurrentMill(mill);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentMill) return;

        try {
            await dispatch(deleteMill(currentMill.id)).unwrap();
            resetPage();
            await dispatch(getAllMills({ fetchAll: true }));
        } catch (error) {
            console.error("Error deleting mill:", error);
        }

        setIsDeleteModalOpen(false);
    };

    const handleView = (mill: millData) => {
        const normalizedAddress = (Array.isArray(mill.address) ? mill.address : mill.address ? [mill.address] : []).map(addr => ({
            ...addr,
            pinCode: addr.pinCode || (addr as any).pincode || ""
        }));
        const millWithNormalizedAddress = {
            ...mill,
            address: normalizedAddress
        };
        setCurrentMill(millWithNormalizedAddress);
        setIsViewModalOpen(true);
    };

    const handleOpenModal = (editing = false, mill: millData | null = null) => {
        if (editing && mill) {
            const millAddresses = Array.isArray(mill.address) ? mill.address : mill.address ? [mill.address] : [];
            reset({
                ...mill,
                millTypeId: mill.millTypeId ? String(mill.millTypeId) : "",
                address: millAddresses,
            });
            setCurrentMill(mill);
            setAddressDetails(millAddresses);
        } else {
            reset({ millName: "", millTypeId: "", contactPerson: "", contactNumber: "", activeFlag: true });
            setCurrentMill(null);
            setAddressDetails([]);
        }
        setIsEditing(editing);
        setIsModalOpen(true);
    };

    const onSubmit = async (data: millFormData) => {
        try {
            // Validate addressDetails
            const first = addressDetails[0];
            const pin = first?.pinCode || "";
            const isPinValid = /^\d{6}$/.test(pin);
            if (!first?.stateCode || !isPinValid) {
                alert('Please provide valid State Code (auto from State) and 6-digit numeric Pin Code.');
                return;
            }

            const missing = addressDetails.some(addr => !addr.stateCode || !addr.pinCode);
            if (missing) {
                alert('Please ensure State Code and Pin Code are provided for all address rows.');
                return;
            }

            const payload = {
                ...data,
                millTypeId: data.millTypeId ? Number(data.millTypeId) : null,
                address: addressDetails[0],
            };

            if (isEditing) {
                await dispatch(updateMill(payload)).unwrap();
            } else {
                const { id, ...newMillData } = payload;
                await dispatch(createMill(newMillData)).unwrap();
            }
            resetPage();
            await dispatch(getAllMills({ fetchAll: true })).unwrap();
            setIsModalOpen(false);
            reset();
            setAddressDetails([]);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <div className="p-6 pt-16">
            <DataTable
                columns={columns}
                data={processedMillList}
                title="Mills"
                onAdd={() => handleOpenModal(false)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                showColumnFilters={true}
                filterPlaceholder="Search Mill..."
                disableFullDataFetch={true}
            />

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
                    <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
                            {isEditing ? "Update Mill" : "Add Mill"}
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer animate-hover" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                            </svg>
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {/* Mill Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mill Name <span className="text-red-600">*</span></label>
                                    <input {...register("millName", { required: "Mill Name is required" })}
                                        placeholder="Enter Mill Name"
                                        className="input mt-1"
                                        autoComplete="off" />
                                    {errors.millName && <p className="text-red-500 text-sm">{errors.millName.message}</p>}
                                </div>

                                {/* Mill Type Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mill Type <span className="text-red-600">*</span></label>
                                    <select {...register("millTypeId", { required: "Mill Type is required" })} className="input mt-1">
                                        <option value="">Select Mill Type</option>
                                        {(subCategoryByCategoryList || []).map((sub: any) => (
                                            <option key={sub.id} value={sub.id}>{sub.subCategoryName}</option>
                                        ))}
                                    </select>
                                    {errors.millTypeId && <p className="text-red-500 text-sm">{errors.millTypeId.message}</p>}
                                </div>

                                {/* Contact Person */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Contact Person</label>
                                    <input {...register("contactPerson")}
                                        placeholder="Enter Contact Person"
                                        className="input mt-1" />
                                </div>

                                {/* Contact Number */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Contact Number</label>
                                    <input {...register("contactNumber")}
                                        placeholder="Enter Contact Number"
                                        className="input mt-1" />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Status</label>
                                    <select {...register("activeFlag")} className="input mt-1">
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Address Details */}
                            <div className="h-10"></div>
                            <div className="mt-10">
                                <h3 className="font-semibold flex items-center">
                                    Address Details
                                    <button type="button"
                                        onClick={handleAddAddress} className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-200">
                                        + Add Address
                                    </button>
                                </h3>
                                <table className="w-full border mt-4">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="p-2 border">SL.NO</th>
                                            <th className="p-2 border">Line 1</th>
                                            <th className="p-2 border">Line 2</th>
                                            <th className="p-2 border">Country</th>
                                            <th className="p-2 border">State</th>
                                            <th className="p-2 border">City</th>
                                            <th className="p-2 border">State Code</th>
                                            <th className="p-2 border">Pin Code</th>
                                            <th className="p-2 border">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addressDetails?.map((item: any, index: any) => {
                                            const countryKey = String(item.countryId ?? "").trim();
                                            const stateKey = String(item.stateId ?? "").trim();
                                            const availableStates = getStatesForCountry(countryKey);
                                            const availableCities = getCitiesForState(stateKey);
                                            return (
                                                <tr key={item.id} className="border">
                                                    <td className="p-2 text-center border">{index + 1}</td>

                                                    {/* Line 1 */}
                                                    <td className="p-2 border">
                                                        <input
                                                            type="text"
                                                            value={item.line1}
                                                            onChange={e => {
                                                                const updated = addressDetails.map((addr, i) =>
                                                                    i === index ? { ...addr, line1: e.target.value } : addr
                                                                );
                                                                setAddressDetails(updated);
                                                            }}
                                                            className="border p-1 w-full rounded"
                                                        />
                                                    </td>

                                                    {/* Line 2 */}
                                                    <td className="p-2 border">
                                                        <input
                                                            type="text"
                                                            value={item.line2}
                                                            onChange={e => {
                                                                const updated = addressDetails.map((addr, i) =>
                                                                    i === index ? { ...addr, line2: e.target.value } : addr
                                                                );
                                                                setAddressDetails(updated);
                                                            }}
                                                            className="border p-1 w-full rounded"
                                                        />
                                                    </td>

                                                    {/* Country */}
                                                    <td className="p-2 border w-56">
                                                        <CommonSearchableSelect
                                                            options={(countryList || []).map((country: any) => ({
                                                                value: String(country.id),
                                                                label: country.countryName,
                                                                isActive: country.isActive !== false && country.activeFlag !== false
                                                            }))}
                                                            placeholder="Select Country"
                                                            value={item.countryId ? String(item.countryId) : ""}
                                                            onChange={(value: string) => handleCountryChange(index, value)}
                                                        />
                                                    </td>

                                                    {/* State */}
                                                    <td className="p-2 border w-56">
                                                        {item.countryId ? (
                                                            <CommonSearchableSelect
                                                                options={(availableStates || []).map((state: any) => ({
                                                                    value: String(state.id),
                                                                    label: state.stateName || state.name || `State ${state.id}`,
                                                                    isActive: state.isActive !== false && state.activeFlag !== false
                                                                }))}
                                                                placeholder="Select State"
                                                                value={item.stateId ? String(item.stateId) : ""}
                                                                onChange={(value: string) => handleStateChange(index, value)}
                                                            />
                                                        ) : (
                                                            <CommonSearchableSelect
                                                                options={[]}
                                                                placeholder="Select Country first"
                                                                value=""
                                                            />
                                                        )}
                                                    </td>

                                                    {/* City */}
                                                    <td className="p-2 border w-56">
                                                        {item.stateId ? (
                                                            <CommonSearchableSelect
                                                                options={(availableCities || []).map((city: any) => ({
                                                                    value: String(city.id),
                                                                    label: city.cityName || city.name || `City ${city.id}`,
                                                                    isActive: city.isActive !== false && city.activeFlag !== false
                                                                }))}
                                                                placeholder="Select City"
                                                                value={item.cityId ? String(item.cityId) : ""}
                                                                onChange={(value: string) => {
                                                                    const updated = [...addressDetails];
                                                                    updated[index].cityId = value;
                                                                    setAddressDetails(updated);
                                                                }}
                                                            />
                                                        ) : (
                                                            <CommonSearchableSelect
                                                                options={[]}
                                                                placeholder="Select State first"
                                                                value=""
                                                            />
                                                        )}
                                                    </td>

                                                    {/* State Code - read-only */}
                                                    <td className="p-2 border">
                                                        <input
                                                            type="text"
                                                            value={item.stateCode}
                                                            readOnly
                                                            className="border p-1 w-full bg-gray-100 rounded"
                                                            placeholder="State Code"
                                                        />
                                                    </td>

                                                    {/* Pin Code */}
                                                    <td className="p-2 border">
                                                        <input
                                                            type="text"
                                                            value={item.pinCode || ""}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/\D/g, "");
                                                                if (val.length <= 6) {
                                                                    const updated = [...addressDetails];
                                                                    updated[index].pinCode = val;
                                                                    setAddressDetails(updated);
                                                                }
                                                            }}
                                                            className="border p-1 w-full rounded"
                                                            placeholder="6-digit PIN"
                                                        />
                                                    </td>

                                                    {/* Trash Action */}
                                                    <td className="p-2 border text-center">
                                                        <Trash className="text-red-500 hover:text-red-700 cursor-pointer inline transition duration-200" onClick={() => handleDeleteAddress(item.id)} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Form Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`btn ${!isValid
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'btn-primary'
                                        } transition-colors duration-200`}
                                    disabled={!isValid}
                                >
                                    {isEditing ? "Update Mill" : "Add Mill"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Mill Details"
            >
                {currentMill && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm text-secondary-500 font-medium">
                                Mill Name: <span className="text-md font-bold text-gray-900">{currentMill.millName}</span>
                            </p>
                            <p className="text-sm text-secondary-500 font-medium">
                                Mill Type: <span className="text-md font-bold text-gray-900">{currentMill.millTypeName || `Type ID: ${currentMill.millTypeId}`}</span>
                            </p>
                            <p className="text-sm text-secondary-500 font-medium">
                                Contact Person: <span className="text-md font-bold text-gray-900">{currentMill.contactPerson || '-'}</span>
                            </p>
                            <p className="text-sm text-secondary-500 font-medium">
                                Contact Number: <span className="text-md font-bold text-gray-900">{currentMill.contactNumber || '-'}</span>
                            </p>
                            <p className="text-sm text-secondary-500 font-medium flex items-center">
                                Status: 
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${currentMill.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {currentMill.activeFlag ? "Active" : "Inactive"}
                                </span>
                            </p>
                        </div>

                        {/* Address Details Section */}
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Address Details</h3>
                            {(Array.isArray(currentMill.address) ? currentMill.address : currentMill.address ? [currentMill.address] : []).map((addr: AddressDetail, index: number) => (
                                <div key={index} className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-secondary-500">Address Line 1</p>
                                        <p className="font-medium">{addr.line1}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">Address Line 2</p>
                                        <p className="font-medium">{addr.line2 || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">City</p>
                                        <p className="font-medium">
                                            {cityList.find((city: any) => city.id === addr.cityId)?.cityName || `City ID: ${addr.cityId}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">State</p>
                                        <p className="font-medium">
                                            {stateList.find((state: any) => state.id === addr.stateId)?.stateName || `State ID: ${addr.stateId}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">Country</p>
                                        <p className="font-medium">
                                            {countryList.find((country: any) => country.id === addr.countryId)?.countryName || `Country ID: ${addr.countryId}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">Status</p>
                                        <p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${addr.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                {addr.activeFlag ? "Active" : "Inactive"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
                <div className="space-y-4">
                    <p>Are you sure you want to delete Mill "{currentMill?.millName}"?</p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
