

import { Key, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { getAllCountries } from "@/state/countrySlice";
import { getAllCities } from "@/state/citySlice";
import { getAllStates } from "@/state/stateSlice";
import React from "react";
import { create } from "domain";
import { getTradeTypeId } from "@/utils/codesHelper";
import { createCustomer, getAllCustomers, updateCustomer, deleteCustomer } from "@/state/customerSlice";
import { BooleanFilter } from "@/components/filters";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface customerData {
    id?: number;
    customerName: string;
    address: AddressDetail[];
    iecCode: string;
    cinNo: string;
    tinNo: string;
    ircNo: string;
    binNo: string;
    contactPerson?: string;    // NEW
    contactNumber?: string;
    mobileNo: string;
    email: string;
    activeFlag: boolean;
    isInternational: boolean;
    tradeTypeId?: number;
}

interface customerFormData {
    id?: number;
    customerName: string;
    address: AddressDetail[];
    iecCode: string;
    cinNo: string;
    tinNo: string;
    ircNo: string;
    binNo: string;
    mobileNo: string;
    email: string;
    contactPerson?: string;    // NEW
    contactNumber?: string;
    activeFlag: boolean;
    isInternational: boolean;
    tradeTypeId?: number;
}

interface AddressDetail {
    id?: number;
    line1: string;
    line2: string;
    countryId: string;
    stateId: string;
    cityId: string;
    pinCode: string;
    activeFlag: boolean;
}

export function InternationalCustomerMaster() {

    const { stateList } = useSelector((state: RootState) => state.state);
    const { countryList } = useSelector((state: RootState) => state.country);
    const { cityList } = useSelector((state: RootState) => state.city);
    const { internationalCustomerList, internationalPagination } = useSelector((state: RootState) => state.customer);
    const [addressDetails, setAddressDetails] = useState<AddressDetail[]>([]);
    const [customers, setCustomers]: any = useState([]);
    const [currentCustomer, setCurrentCustomer]: any = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [isEditing, setIsEditing] = React.useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [customerImage, setCustomerImage]: any = useState(null);
    const [isInternational, setIsInternational] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const { currentPage, setItemsPerPage,itemsPerPage, handlePageChange, resetPage, getOffset } = usePagination({ itemsPerPage: 10 });

    const internationalTradeTypeId = useMemo(() => getTradeTypeId("INTERNATIONAL") || 202, []);

    const fetchInternationalCustomers = useCallback((overrideOffset?: number) => {
        if (!internationalTradeTypeId) return;
        const offsetValue = overrideOffset !== undefined ? overrideOffset : getOffset();
        return dispatch(getAllCustomers({
           fetchAll: true,
            tradeTypeId: internationalTradeTypeId,
            scope: "international"
        }));
    }, [dispatch, getOffset, itemsPerPage, internationalTradeTypeId]);

    
    const normalizedStateList = useMemo(() => {
        const list = Array.isArray(stateList) ? stateList : [];
        return list.filter((state) => state.activeFlag !== false);
    }, [stateList]);

    const normalizedCityList = useMemo(() => {
        const list = Array.isArray(cityList) ? cityList : [];
        return list.filter((city) => city.activeFlag !== false);
    }, [cityList]);

    const getStatesForCountry = useCallback(
        (countryId?: string) => {
            const normalizedCountryId = String(countryId ?? "").trim();
            if (!normalizedCountryId) return [];
            return normalizedStateList.filter((state) => String(state.countryId) === normalizedCountryId);
        },
        [normalizedStateList]
    );

    const getCitiesForState = useCallback(
        (stateId?: string, countryId?: string) => {
            const normalizedStateId = String(stateId ?? "").trim();
            if (!normalizedStateId) return [];
            const normalizedCountryId = String(countryId ?? "").trim();
            return normalizedCityList.filter((city) => {
                const matchesState = String(city.stateId) === normalizedStateId;
                const matchesCountry = normalizedCountryId ? String(city.countryId) === normalizedCountryId : true;
                return matchesState && matchesCountry;
            });
        },
        [normalizedCityList]
    );

    const handleCountryChange = (index: number, countryId: string) => {
        setAddressDetails((prev) =>
            prev.map((item, idx) =>
                idx === index
                    ? { ...item, countryId, stateId: "", cityId: "" }
                    : item
            )
        );
    };

    const handleStateChange = (index: number, stateId: string) => {
        setAddressDetails((prev) =>
            prev.map((item, idx) =>
                idx === index
                    ? { ...item, stateId, cityId: "" }
                    : item
            )
        );
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, touchedFields, isValid }
    } = useForm<customerFormData>({
        mode: 'onBlur',
        reValidateMode: 'onBlur'
    });

     
    useEffect(() => {
      dispatch(getAllCountries({ fetchAll: true }));
            dispatch(getAllStates({ fetchAll: true }));
            dispatch(getAllCities({ fetchAll: true }));
    }, [dispatch]);

    useEffect(() => {
        fetchInternationalCustomers();
    }, [fetchInternationalCustomers, location.pathname]);

    // useEffect(() => {
    //     setCustomers(
    //         (customerList || []).filter(
    //             (c: any) => Number(c?.tradeTypeId ?? 0) === Number(internationalTradeTypeId)
    //         )
    //     );
    // }, [customerList, internationalTradeTypeId]);


        const cityMap = useMemo(() => {
            if (!Array.isArray(cityList)) return {} as Record<string, string>;
            return cityList.reduce((acc: Record<string, string>, city: any) => {
                const key = city?.id !== undefined ? String(city.id) : "";
                if (key) acc[key] = city.cityName || city.name || "";
                return acc;
            }, {});
        }, [cityList]);
    
        const stateMap = useMemo(() => {
            if (!Array.isArray(stateList)) return {} as Record<string, string>;
            return stateList.reduce((acc: Record<string, string>, state: any) => {
                const key = state?.id !== undefined ? String(state.id) : "";
                if (key) acc[key] = state.stateName || state.name || "";
                return acc;
            }, {});
        }, [stateList]);
    
        const countryMap = useMemo(() => {
            if (!Array.isArray(countryList)) return {} as Record<string, string>;
            return countryList.reduce((acc: Record<string, string>, country: any) => {
                const key = country?.id !== undefined ? String(country.id) : "";
                if (key) acc[key] = country.countryName || country.name || "";
                return acc;
            }, {});
        }, [countryList]);

            
    //         const processedCityList = useMemo(() => {
    //     return (customerList || [])
    //       .filter((c: any) => Number(c?.tradeTypeId ?? 0) === Number(internationalTradeTypeId))
    //       .map((city: any, index: number) => ({
    //       ...city,
    //       serialNo: index + 1
    //     }));
    //   }, [customerList, internationalTradeTypeId]);
    const processedCityList = useMemo(() => {
    const offset = internationalPagination?.offset || 0;

    const formatAddress = (address: any) => {
        if (!address) return "";
        const parts: string[] = [];
        if (address.line1) parts.push(address.line1);
        if (address.line2) parts.push(address.line2);

        const cityName = cityMap[String(address.cityId ?? "")] || "";
        const stateName = stateMap[String(address.stateId ?? "")] || "";
        const countryName = countryMap[String(address.countryId ?? "")] || "";

        if (cityName) parts.push(cityName);
        if (stateName) parts.push(stateName);
        if (countryName) parts.push(countryName);
        if (address.pinCode) parts.push(address.pinCode);

        return parts.filter(Boolean).join(", ");
    };

    const customers = Array.isArray(internationalCustomerList) ? internationalCustomerList : [];

    return customers.map((city: any, index: number) => {
        const addressSource = Array.isArray(city.address)
            ? city.address[0]
            : city.address;

        return {
            ...city,
            serialNo: offset + index + 1,
            addressDisplay: formatAddress(addressSource)
        };
    });

}, [
    internationalCustomerList,
    internationalPagination?.offset,
    cityMap,
    stateMap,
    countryMap
]);
    

    // const processedCityList = useMemo(() => {
    //     const offset = pagination?.offset || 0;
    //     const formatAddress = (address: any) => {
    //         if (!address) return "";
    //         const parts: string[] = [];
    //         if (address.line1) parts.push(address.line1);
    //         if (address.line2) parts.push(address.line2);
    //         const cityName = cityMap[String(address.cityId ?? "")] || "";
    //         const stateName = stateMap[String(address.stateId ?? "")] || "";
    //         const countryName = countryMap[String(address.countryId ?? "")] || "";
    //         if (cityName) parts.push(cityName);
    //         if (stateName) parts.push(stateName);
    //         if (countryName) parts.push(countryName);
    //         if (address.pinCode) parts.push(address.pinCode);
    //         return parts.filter(Boolean).join(", ");
    //     };

    //     const customers = Array.isArray(customerList) ? customerList : [];
    //     return customers.map((city: any, index: number) => {
    //         const addressSource = Array.isArray(city.address) ? city.address[0] : city.address;
    //         return {
    //             ...city,
    //             serialNo: offset + index + 1,
    //             addressDisplay: formatAddress(addressSource)
    //         };
    //     });
    // }, [customerList, pagination, cityMap, stateMap, countryMap]);

    const columns = useMemo(
        () => [
            { Header: "S.No", accessor: "serialNo" },
            { Header: "Customer Name", accessor: "customerName" },
            { Header: "Mobile", accessor: "mobileNo" },
            { Header: "Email", accessor: "email" },
            { Header: "Contact Person", accessor: "contactPerson" },
            { Header: "Contact Number", accessor: "contactNumber" },
            // {
            //     Header: "Type",
            //     accessor: "isInternational",
            //     Cell: ({ value }: { value: boolean }) => (
            //         <span className={`px-2 py-1 rounded-full text-xs ${value ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
            //             {value ? "International" : "Domestic"}
            //         </span>
            //     ),
            // },
             {
                                            Header: "Status",
                                            accessor: "activeFlag",
                                            Filter: BooleanFilter,
                                            // ADD THIS: Boolean filter function
                                            filter: (rows: any[], columnIds: string[], filterValue: string) => {
                                                    if (filterValue === '' || filterValue === undefined) return rows;
                                                    const boolValue = filterValue === 'true';
                                                    return rows.filter((row: any) => row.values[columnIds[0]] === boolValue);
                                            },
                                            Cell: ({ value }: { value: boolean }) => (
                                                    <span
                                                            className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                                    >
                                                            {value ? "Active" : "Inactive"}
                                                    </span>
                                            ),
                                    },
            // {
            //     Header: "Status",
            //     accessor: "activeFlag",
            //     Cell: ({ value }: { value: boolean }) => (
            //         <span className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            //             {value ? "Active" : "Inactive"}
            //         </span>
            //     ),
            // },
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
            pinCode: "",
            activeFlag: true
        }]);
    };

    const handleDeleteAddress = (id: any) => {
        setAddressDetails(addressDetails.filter((item: any) => item.id !== id));
    };

    const handleEdit = (customer: customerData) => {
        setIsEditing(true);
        setCurrentCustomer(customer);
        setIsInternational(customer.isInternational);
        setAddressDetails(Array.isArray(customer.address) ? customer.address : customer.address ? [customer.address] : []);
        reset({
            id: customer.id,
            customerName: customer.customerName,
            mobileNo: customer.mobileNo,
            email: customer.email,
            iecCode: customer.iecCode,
            cinNo: customer.cinNo,
            tinNo: customer.tinNo,
            ircNo: customer.ircNo,
            binNo: customer.binNo,
            contactPerson: customer.contactPerson,
            contactNumber: customer.contactNumber,
            activeFlag: customer.activeFlag,
            isInternational: customer.isInternational,
            address: Array.isArray(customer.address) ? customer.address : customer.address ? [customer.address] : [],
        });
        setIsModalOpen(true);
    };

    const handleDelete = (state: any) => {
        setCurrentCustomer(state);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentCustomer) return;

        try {
            await dispatch(deleteCustomer(currentCustomer.id)).unwrap();
            await fetchInternationalCustomers();
        } catch (error) {
            console.error("Error deleting country:", error);
        }

        setIsDeleteModalOpen(false);
    };

    const handleView = (customer: customerData) => {
        setCurrentCustomer(customer);
        setIsViewModalOpen(true);
    };

    // const handleOpenModal = (editing = false, state: customerData | null = null) => {
    //     if (editing && state) {
    //         reset({});
    //         setCustomers(state);
    //     } else {
    //         reset({});
    //         setCustomers(null);
    //     }
    //     setIsEditing(editing);
    //     setIsModalOpen(true);
    // };

    const handleOpenModal = () => {
        setIsEditing(false);
        setCurrentCustomer(null);
        setAddressDetails([]);
        setIsInternational(false);
        setCustomerImage(null);
        reset({
            address: [],
            activeFlag: true
        });
        // reset({
        //     id: undefined,
        //     customerName: "",
        //     gstNo: "",
        //     panCard: "",
        //     mobileNo: "",
        //     email: "",
        //     iecCode: "",
        //     cinNo: "",
        //     tinNo: "",
        //     msmeUdyam: "",
        //     pinCode: "",
        //     contactPerson: "",
        //     contactNumber: "",
        //     activeFlag: true,
        //     isInternational: false,
        //     address: []
        // });
        setIsModalOpen(true);
    };

    const onSubmit = async (data: customerFormData) => {
          if (addressDetails.length === 0) {
            alert("Please add at least one address before saving.");
            return;
        }

        try {
            console.log('Form data submitted:', data);

            const payload = {
                ...data,
                address: addressDetails[0],
                tradeTypeId: internationalTradeTypeId,
            };
            console.log('Payload sent to API:', payload);
            if (isEditing) {
                await dispatch(updateCustomer(payload)).unwrap();
                await fetchInternationalCustomers();
            } else {
                const { id, ...newCustomerData } = payload;
                await dispatch(createCustomer(newCustomerData)).unwrap();
                resetPage();
                await fetchInternationalCustomers(0);
            }
            setIsModalOpen(false);
            reset();
            setAddressDetails([]);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomerImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            {/* <h1 className="text-2xl font-bold mb-6">Customer Management</h1> */}
            <DataTable
                columns={columns}
                 data={processedCityList}
                title="International Customers"
                onAdd={handleOpenModal}
                onEdit={handleEdit}
                // onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                 showColumnFilters={true}
                filterPlaceholder="Search Customer..."
                disableFullDataFetch={true}
        //          initialPageSize={itemsPerPage}
        //          onPageSizeChange={setItemsPerPage}
        //            totalCount={internationalPagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
            />

            {/* <Pagination
                currentPage={currentPage}
                totalItems={internationalPagination?.total || 0}
                itemsPerPage={itemsPerPage}
                offset={internationalPagination?.offset || 0}
                hasNext={!!internationalPagination?.next}
                hasPrev={!!internationalPagination?.prev}
                onPageChange={handlePageChange}
            /> */}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center flex justify-end z-50 bg-gray-800 bg-opacity-50">
                    <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
                            {isEditing ? "Update Customer" : "Add Customer"}
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                            </svg>
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {/* Basic Information */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Customer Name <span className="text-red-600">*</span></label>
                                    <input {...register("customerName", { required: "Customer Name is required" })}
                                        placeholder="Enter Customer Name"
                                        className="input mt-1" />
                                    {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Mobile No <span className="text-red-600">*</span></label>
                                    <input
                                        type="tel"
                                        {...register("mobileNo", {
                                            required: "Mobile No is required",
                                            pattern: {
                                                value: /^\d{10}$/,
                                                message: "Mobile number must be 10 digits",
                                            },
                                        })}
                                        placeholder="Enter Mobile No"
                                        maxLength={10}
                                        className="input mt-1"
                                    />
                                    {errors.mobileNo && <p className="text-red-600 text-sm">{errors.mobileNo.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Email <span className="text-red-600">*</span></label>
                                    <input
                                        type="email"
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "Enter a valid email address",
                                            },
                                        })}
                                        placeholder="Enter Email"
                                        className="input mt-1"
                                    />
                                    {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
                                </div>

                                {/* International Documents */}
                                {/* {isInternational && ( */}
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">IEC Code</label>
                                        <input {...register("iecCode")}
                                            placeholder="Enter IEC Code"
                                            className="input mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">CIN No</label>
                                        <input {...register("cinNo")}
                                            placeholder="Enter CIN No"
                                            className="input mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">TIN No</label>
                                        <input {...register("tinNo")}
                                            placeholder="Enter TIN No"
                                            className="input mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">IRC No</label>
                                        <input {...register("ircNo")}
                                            placeholder="Enter IRC No"
                                            className="input mt-1" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">BIN No</label>
                                        <input {...register("binNo")}
                                            placeholder="Enter BIN No"
                                            className="input mt-1" />
                                    </div>
                                    {/* Contact Person */}
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">
                                            Contact Person
                                        </label>
                                        <input
                                            {...register("contactPerson", {
                                                maxLength: { value: 50, message: "Cannot exceed 50 characters" },
                                            })}
                                            placeholder="Enter Contact Person"
                                            className="input mt-1"
                                        />

                                    </div>

                                    {/* Contact Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700">
                                            Contact Number
                                        </label>
                                        <input
                                            {...register("contactNumber", {
                                                maxLength: {
                                                    value: 10,
                                                    message: "Cannot exceed 10 digits",
                                                },
                                                validate: (value) =>
                                                    !value || /^\d{10}$/.test(value)
                                                        ? true
                                                        : "Contact Number must be exactly 10 digits",
                                            })}
                                            placeholder="Enter Contact Number"
                                            className="input mt-1"
                                        />
                                        {errors.contactNumber && (
                                            <p className="text-red-500 text-sm">{errors.contactNumber.message}</p>
                                        )}
                                    </div>

                                </>
                                {/* )} */}

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Status</label>
                                    <select {...register("activeFlag", { required: "Status is required" })} className="input mt-1">
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Image</label>
                                    <input type="file" onChange={handleImageUpload} className="mt-2" />
                                    {customerImage && (
                                        <img
                                            src={customerImage}
                                            alt="Uploaded"
                                            className="mt-2 w-24 h-24 border rounded-lg object-cover"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Address Details */}
                           <div className="mt-10">
                                <h3 className="font-semibold">Address Details
                                    <button type="button"
                                        onClick={handleAddAddress} className="ml-2 bg-primary text-white px-2 py-1 rounded">
                                        + Add Address
                                    </button>
                                </h3>
                                <table className="w-full border mt-4">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th>SL.NO</th>
                                            <th>Line 1</th>
                                            <th>Line 2</th>
                                            <th>Country</th>
                                            {!isInternational && <th>State</th>}
                                            {!isInternational && <th>City</th>}
                                            <th>Pin Code</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addressDetails?.map((item, index) => (
                                            <tr key={item.id} className="border">
                                                <td className="p-2">{index + 1}</td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={item.line1}
                                                        onChange={e => {
                                                            const updated = [...addressDetails];
                                                            updated[index] = { ...updated[index], line1: e.target.value };
                                                            setAddressDetails(updated);
                                                        }}
                                                        className="border p-1 w-full"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={item.line2}
                                                        onChange={e => {
                                                            const updated = [...addressDetails];
                                                            updated[index] = { ...updated[index], line2: e.target.value };
                                                            setAddressDetails(updated);
                                                        }}
                                                        className="border p-1 w-full"
                                                    />
                                                </td>
                                                <td className="p-2 w-56 ">
                                                    <CommonSearchableSelect
                                                        options={(countryList || []).map((country: any) => ({
                                                            value: String(country.id),
                                                            label: country.countryName
                                                        }))}
                                                        placeholder="Select Country"
                                                        value={item.countryId ? String(item.countryId) : ""}
                                                        onChange={(value: string) => handleCountryChange(index, value)}
                                                    />
                                                </td>
                                                {!isInternational && (
                                                    <td className="p-2 w-56">
                                                        {item.countryId ? (
                                                            <CommonSearchableSelect
                                                                options={getStatesForCountry(item.countryId).map((state: any) => ({
                                                                    value: String(state.id),
                                                                    label: state.stateName || `State ${state.id}`,
                                                                }))}
                                                                placeholder="Select a State"
                                                                value={item.stateId ? String(item.stateId) : ""}
                                                                onChange={(value: string) => handleStateChange(index, value)}
                                                                required
                                                            />
                                                        ) : (
                                                            <CommonSearchableSelect
                                                                options={[]}
                                                                placeholder="Select Country first"
                                                                value=""
                                                            // isDisabled={true}
                                                            />
                                                        )}
                                                    </td>
                                                )}
                                                {!isInternational && (
                                                    <td className="p-2 w-56">
                                                        {item.stateId ? (
                                                            <CommonSearchableSelect
                                                                options={getCitiesForState(item.stateId, item.countryId).map((city: any) => ({
                                                                    value: String(city.id),
                                                                    label: city.cityName || `City ${city.id}`,
                                                                }))}
                                                                placeholder="Select City"
                                                                value={item.cityId ? String(item.cityId) : ""}
                                                                onChange={(value: string) => {
                                                                    const updated = [...addressDetails];
                                                                    updated[index] = { ...updated[index], cityId: value };
                                                                    setAddressDetails(updated);
                                                                }}
                                                                required
                                                            />
                                                        ) : (
                                                            <CommonSearchableSelect
                                                                options={[]}
                                                                placeholder="Select State first"
                                                                value=""
                                                            // isDisabled={true}
                                                            />
                                                        )}
                                                    </td>
                                                )}
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={item.pinCode}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/\D/g, ""); // numeric only
                                                            if (val.length <= 6) {
                                                                const updated = [...addressDetails];
                                                                updated[index] = { ...updated[index], pinCode: val };
                                                                setAddressDetails(updated);
                                                            }
                                                            // const updated = [...addressDetails];
                                                            // updated[index].pinCode = e.target.value;
                                                            // setAddressDetails(updated);
                                                        }}
                                                        className="border p-1 w-full"
                                                        required
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <Trash className="text-red-500 cursor-pointer" onClick={() => handleDeleteAddress(item.id)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

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
                                    {isEditing ? "Update Customer" : "Add Customer"}
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
                title="Customer Details"
            >
                {currentCustomer && (
                    <div className="space-y-4">
                        {/* Image + Name, Mobile, Email Section */}
                        <div className="flex gap-6 items-center">
                            {currentCustomer.imageUrl && (
                                <img
                                    src={currentCustomer.imageUrl}
                                    alt={currentCustomer.customerName}
                                    className="w-32 h-32 object-cover rounded-lg shadow"
                                />
                            )}
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Name: <span className="text-md font-bold text-gray-900">{currentCustomer.customerName}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Type: <span className={`px-2 py-1 rounded-full text-xs ${currentCustomer.isInternational ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                                            {currentCustomer.isInternational ? "International" : "Domestic"}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Contact Person: <span className="text-md font-bold text-gray-900">{currentCustomer.contactPerson}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Mobile: <span className="text-md font-bold text-gray-900">{currentCustomer.mobileNo}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Email: <span className="text-md font-bold text-gray-900">{currentCustomer.email}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* International Documents */}
                        {currentCustomer.isInternational && (
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div>
                                    <p className="text-sm text-secondary-500">IEC Code</p>
                                    <p className="font-medium">{currentCustomer.iecCode || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">CIN No</p>
                                    <p className="font-medium">{currentCustomer.cinNo || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">TIN No</p>
                                    <p className="font-medium">{currentCustomer.tinNo || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">IRC No</p>
                                    <p className="font-medium">{currentCustomer.ircNo || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">BIN No</p>
                                    <p className="font-medium">{currentCustomer.binNo || "-"}</p>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">
                                Contact Person <span className="text-red-600">*</span>
                            </label>
                            <input
                                {...register("contactPerson", {
                                    required: "Contact Person is required",
                                    maxLength: { value: 50, message: "Cannot exceed 50 characters" },
                                })}
                                placeholder="Enter Contact Person"
                                className="input mt-1"
                            />
                            {errors.contactPerson && (
                                <p className="text-red-500 text-sm">{errors.contactPerson.message}</p>
                            )}
                        </div>

                        {/* Contact Number */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">
                                Contact Number <span className="text-red-600">*</span>
                            </label>
                            <input
                                {...register("contactNumber", {
                                    required: "Contact Number is required",
                                    pattern: {
                                        value: /^\d{10}$/,
                                        message: "Contact Number must be exactly 10 digits",
                                    },
                                    maxLength: {
                                        value: 10,
                                        message: "Cannot exceed 10 digits",
                                    },
                                })}
                                placeholder="Enter Contact Number"
                                className="input mt-1"
                            />
                            {errors.contactNumber && (
                                <p className="text-red-500 text-sm">{errors.contactNumber.message}</p>
                            )}
                        </div>


                        {/* Status */}
                        <div className="pt-4">
                            <p className="text-sm text-secondary-500">Status</p>
                            <p>
                                <span className={`px-2 py-1 rounded-full text-xs ${currentCustomer.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {currentCustomer.activeFlag ? "Active" : "Inactive"}
                                </span>
                            </p>
                        </div>

                        {/* Address Details */}
                        <div className="pt-4">
                            <h3 className="text-sm font-medium text-secondary-500 mb-2">Addresses</h3>
                            {Array.isArray(currentCustomer.address) && currentCustomer.address.map((addr: AddressDetail, idx: number) => (
                                <div key={addr.id || idx} className="mb-4 p-3 border rounded-lg">
                                    <p className="font-medium">{addr.line1}, {addr.line2}</p>
                                    <p>{addr.countryId}{!currentCustomer.isInternational && `, ${addr.stateId}, ${addr.cityId}`}</p>
                                    <p>Pin Code: {addr.pinCode}</p>
                                </div>
                            ))}
                        </div>

                        {/* Close Button */}
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

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
                <div className="space-y-4">
                    <p>Are you sure you want to delete Customer "{currentCustomer?.customerName}"?</p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}