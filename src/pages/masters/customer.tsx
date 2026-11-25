// import { Key, useEffect, useMemo, useState } from "react";
// import { useForm, useWatch } from "react-hook-form";
// import { Modal } from "@/components/ui/Modal";
// import { Button } from "@/components/ui/button";
// import { DataTable } from "@/components/data/DataTable";
// import { Pagination, usePagination } from "@/components/common/Pagination";
// import { Trash } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/state/store";
// import { getAllCountries } from "@/state/countrySlice";
// import { getAllCities } from "@/state/citySlice";
// import { getAllStates } from "@/state/stateSlice";
// import { createCustomer, deleteCustomer, getAllCustomers, updateCustomer } from "@/state/customerSlice";
// import React from "react";
// import { BooleanFilter } from "@/components/filters";
// import { getTradeTypeId } from "@/utils/codesHelper";


// interface customerData {
//     id?: number;
//     customerName: string;
//     gstNo: string;
//     panCard: string;
//     mobileNo: string;
//     contactNumber?: string;
//     email: string;
//     iecCode: string;
//     cinNo: string;
//     tinNo: string;
//     msmeUdyam: string;
//     pinCode: string;
//     contactPerson: string;
//     activeFlag: boolean;
//     address: AddressDetail[];
//     addressDisplay?: string;
// }

// interface customerFormData {
//     id?: number;
//     customerName: string;
//     gstNo: string;
//     panCard: string;
//     mobileNo: string;
//     contactNumber?: string;
//     email: string;
//     iecCode: string;
//     cinNo: string;
//     tinNo: string;
//     msmeUdyam: string;
//     pinCode: string;
//     contactPerson: string;
//     activeFlag: boolean;
//     address: AddressDetail[];
// }

// interface AddressDetail {
//     id?: number;
//     line1: string;
//     line2: string;
//     countryId: string;
//     stateId: string;
//     cityId: string;
//     stateCode: string;
//     pinCode: string;
//     activeFlag: boolean;
// }

// export function CustomerMaster() {
//     const { stateList } = useSelector((state: RootState) => state.state);
//     const { countryList } = useSelector((state: RootState) => state.country);
//     const { cityList } = useSelector((state: RootState) => state.city);
//     const { customerList, pagination } = useSelector((state: RootState) => state.customer);
//     const [addressDetails, setAddressDetails] = useState<AddressDetail[]>([]);
//     const [customers, setCustomers]: any = useState(customerList);
//     const [currentCustomer, setCurrentCustomer]: any = useState(null);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//     const [modalMode, setModalMode] = useState("add");
//     const [isEditing, setIsEditing] = React.useState(false);
//     const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//     const [customerImage, setCustomerImage]: any = useState(null);
//     const dispatch = useDispatch<AppDispatch>();

//     const {
//       currentPage,
//       itemsPerPage,
//       handlePageChange,
//       resetPage,
//       getOffset
//     } = usePagination({ itemsPerPage: 10 });

//     // Suggestion states for customerName
//     const [showSuggestions, setShowSuggestions] = useState(false);

//     const {
//         register,
//         handleSubmit,
//         reset,
//         setValue,
//         watch,
//         formState: { errors, touchedFields, isValid }
//     } = useForm<customerFormData>({
//         mode: 'onBlur',
//         reValidateMode: 'onBlur'
//     });

//     // Watch form values
//     const customerNameValue = watch("customerName");

//     // Existing names for suggestions
//     const existingNames = useMemo(
//         () => customerList.map((c: any) => (c?.customerName ?? "")).filter(Boolean),
//         [customerList]
//     );

//     const filteredSuggestions = useMemo(() => {
//         const q = (customerNameValue || "").toLowerCase();
//         if (!q) return [] as string[];
//         return existingNames
//             .filter((name: string) => name.toLowerCase().includes(q))
//             .slice(0, 8);
//     }, [customerNameValue, existingNames]);

//     // Live duplicate check for customerName
//     // useEffect(() => {
//     //     const currentName = (customerNameValue || "").trim().toLowerCase();
//     //     if (!currentName) {
//     //         setDuplicateError("");
//     //         return;
//     //     }
//     //     const excludeName = isEditing ? (currentCustomer?.customerName || "").toLowerCase() : "";
//     //     const isDuplicate = existingNames.some(
//     //         (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
//     //     );
//     //     setDuplicateError(isDuplicate ? "This customer name already exists" : "");
//     // }, [customerNameValue, isEditing, currentCustomer, existingNames]);

//     useEffect(() => {
//         dispatch(getAllCountries({}));
//         dispatch(getAllStates({}));
//         dispatch(getAllCities({}));
//         dispatch(getAllCustomers({ fetchAll: true }));
//     }, [dispatch]);

//     useEffect(() => {
//         dispatch(getAllCustomers({ 
//             offset: getOffset(), 
//             limit: itemsPerPage 
//         }));
//     }, [currentPage, dispatch, getOffset, itemsPerPage]);

//     // Function to get state code by state ID
//     const getStateCode = (stateId: string) => {
//         const state = stateList.find((state: any) => state.id.toString() === stateId);
//         return state ? state.stateCode : "";
//     };

//     const handleStateChange = (index: number, stateId: string) => {
//         const updated = addressDetails.map((item, i) => {
//             if (i === index) {
//                 // Create a new object instead of modifying the existing one
//                 return {
//                     ...item,
//                     stateId: stateId,
//                     stateCode: getStateCode(stateId)
//                 };
//             }
//             return item;
//         });
//         setAddressDetails(updated);
//     };


//     const processedCityList = useMemo(() => {
//         return (customerList || [])
//             .filter((item: any) => item.tradeTypeId === 201)
//             .map((item: any, index: number) => {
//                 const addressArray = Array.isArray(item.address) ? item.address : item.address ? [item.address] : [];
//                 const primaryAddress = addressArray[0] || null;
//                 const addressParts = primaryAddress ? [primaryAddress.line1, primaryAddress.line2, primaryAddress.pinCode].filter(Boolean) : [];
//                 return {
//                     ...item,
//                     serialNo: index + 1,
//                     address: addressArray,
//                     addressDisplay: addressParts.join(", "),
//                 };
//             });
//     }, [customerList]);

//     const processedCustomerList = useMemo(() => {
//         return customerList.map((item: any, index: number) => ({
//             ...item,
//             serialNo: (pagination.offset || 0) + index + 1
//         }));
//     }, [customerList, pagination.offset]);

//     const columns = useMemo(
//         () => [
//             {
//                 Header: 'S.No',
//                 accessor: 'serialNo',
//                 width: 50,
//                 disableFilters: true,
//             },
//             { Header: "Customer Name", accessor: "customerName" },
//             { Header: "GST NO", accessor: "gstNo" },
//             { Header: "PanCard", accessor: "panCard" },
//             { Header: "Address", accessor: "addressDisplay" },
//             { Header: "Contact Person", accessor: "contactPerson" },
//             { Header: "Contact Number", accessor: "contactNumber" },
//             {
//                 Header: "Status",
//                 accessor: "activeFlag",
//                 Filter: BooleanFilter,
//                 Cell: ({ value }: { value: boolean }) => (
//                     <span
//                         className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
//                             }`}
//                     >
//                         {value ? "Active" : "Inactive"}
//                     </span>
//                 ),
//             },
//         ],
//         []
//     );

//     const handleAddAddress = () => {
//         setAddressDetails([...addressDetails, {
//             id: addressDetails.length + 1,
//             line1: "",
//             line2: "",
//             countryId: "",
//             stateId: "",
//             cityId: "",
//             stateCode: "",
//             pinCode: "",
//             activeFlag: true
//         }]);
//     };

//     const handleDeleteAddress = (id: any) => {
//         setAddressDetails(addressDetails.filter((item: any) => item.id !== id));
//     };

//     const handleEdit = (customer: customerData) => {
//         setIsEditing(true);
//         setCurrentCustomer(customer);
//         const customerAddresses = Array.isArray(customer.address) ? customer.address : customer.address ? [customer.address] : [];
//         setAddressDetails(customerAddresses);
//         reset({
//             id: customer.id,
//             customerName: customer.customerName,
//             gstNo: customer.gstNo,
//             panCard: customer.panCard,
//             mobileNo: customer.mobileNo,
//             contactNumber: customer.contactNumber,
//             email: customer.email,
//             iecCode: customer.iecCode,
//             cinNo: customer.cinNo,
//             tinNo: customer.tinNo,
//             msmeUdyam: customer.msmeUdyam,
//             pinCode: customer.pinCode,
//             contactPerson: customer.contactPerson,
//             activeFlag: customer.activeFlag,
//             address: customerAddresses,
//         });
//         setIsModalOpen(true);
//         setShowSuggestions(false);
//     };

//     const handleDelete = (state: any) => {
//         setCurrentCustomer(state);
//         setIsDeleteModalOpen(true);
//     };

//     const confirmDelete = async () => {
//         if (!currentCustomer) return;

//         try {
//             await dispatch(deleteCustomer(currentCustomer.id)).unwrap();
//             resetPage();
//             await dispatch(getAllCustomers({ offset: 0, limit: itemsPerPage }));
//         } catch (error) {
//             console.error("Error deleting customer:", error);
//         }

//         setIsDeleteModalOpen(false);
//     };

//     const handleView = (customer: customerData) => {
//         setCurrentCustomer(customer);
//         setIsViewModalOpen(true);
//     };

//     const handleOpenModal = (editing = false, state: customerData | null = null) => {
//         if (editing && state) {
//             reset({});
//             setCustomers(state);
//         } else {
//             reset({});
//             setCustomers(null);
//         }
//         setIsEditing(editing);
//         setIsModalOpen(true);
//         setShowSuggestions(false);
//     };

//     const onSubmit = async (data: customerFormData) => {
//         try {
//                 const first = addressDetails[0];
//             const pin = first?.pinCode || "";
//             const isPinValid = /^\d{6}$/.test(pin);
//             if (!first?.stateCode || !isPinValid) {
//                 alert('Please provide valid State Code (auto from State) and 6-digit numeric Pin Code.');
//                 return;
//             }

//             // Validate addressDetails: require stateCode and pinCode on each row
//             const missing = addressDetails.some(addr => !addr.stateCode || !addr.pinCode);
//             if (missing) {
//                 alert('Please ensure State Code (auto-filled) and Pin Code are provided for all address rows.');
//                 return;
//             }

//             const DomesticTradeTypeId = getTradeTypeId("DOMESTIC");
            
//             const payload = {
//                 ...data,
//                 address: addressDetails[0],
//                 tradeTypeId: DomesticTradeTypeId,
//             };
//             if (isEditing) {
//                 await dispatch(updateCustomer(payload)).unwrap();
//             } else {
//                 const { id, ...newCustomerData } = payload;
//                 await dispatch(createCustomer(newCustomerData)).unwrap();
//             }

//             resetPage();
//             await dispatch(getAllCustomers({ offset: 0, limit: itemsPerPage }));
//             setIsModalOpen(false);
//             reset();
//             setAddressDetails([]);
//             setShowSuggestions(false);
//         } catch (error) {
//             console.error('Error submitting form:', error);
//         }
//     };

//     const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setCustomerImage(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     return (
//         <div>
//             <DataTable
//                 columns={columns}
//                 data={processedCustomerList}
//                 title="Buyers / Customers"
//                 onAdd={() => handleOpenModal(false)}
//                 onEdit={handleEdit}
//                 onDelete={handleDelete}
//                 onView={handleView}
//                 showActions={true}
//                 showColumnFilters={true}
//                 filterPlaceholder="Search Customer..."
//             />

//             <Pagination
//                 currentPage={currentPage}
//                 totalItems={pagination.total}
//                 itemsPerPage={itemsPerPage}
//                 offset={pagination.offset || 0}
//                 hasNext={!!pagination.next}
//                 hasPrev={!!pagination.prev}
//                 onPageChange={handlePageChange}
//             />

//             {/* Add/Edit Modal */}
//             {isModalOpen && (
//                 <div className="fixed inset-0 flex items-center flex justify-end z-50 bg-gray-800 bg-opacity-50">
//                     <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
//                         <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
//                             {isEditing ? "Update Customer" : "Add Customer"}
//                             <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
//                                 <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
//                             </svg>
//                         </h2>
//                         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                             <div className="grid grid-cols-3 gap-4">
//                                 {/* Basic Information */}
//                                 <div className="relative">
//                                     <label className="block text-sm font-medium text-gray-700">Customer Name <span className="text-red-600">*</span></label>
//                                     <input {...register("customerName", {
//                                         required: "Customer Name is required",
//                                         onChange: () => {
//                                             setShowSuggestions(true);
//                                         },
//                                         onBlur: () => {
//                                             setTimeout(() => setShowSuggestions(false), 150);
//                                         }
//                                     })}
//                                         placeholder="Enter Customer Name"
//                                         className="input mt-1"
//                                         onFocus={() => setShowSuggestions(true)}
//                                         autoComplete="off"
//                                     />
//                                     {(showSuggestions && filteredSuggestions.length > 0) && (
//                                         <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
//                                             {filteredSuggestions.map((s: string) => (
//                                                 <li
//                                                     key={s}
//                                                     className="px-3 py-2 cursor-pointer hover:bg-gray-100"
//                                                     onMouseDown={(e) => {
//                                                         e.preventDefault();
//                                                         setValue("customerName", s, { shouldValidate: true, shouldDirty: true });
//                                                         setShowSuggestions(false);
//                                                     }}
//                                                 >
//                                                     {s}
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     )}
                                 
//                                     {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName.message}</p>}
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Mobile No</label>
//                                     <input {...register("mobileNo")}
//                                         placeholder="Enter Mobile No"
//                                         className="input mt-1" />
//                                 </div>

                              
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Email</label>
//                                     <input {...register("email")}
//                                         placeholder="Enter Email"
//                                         className="input mt-1" />
//                                 </div>

//                                 {/* Tax Information */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">GST No</label>
//                                     <input {...register('gstNo')}
//                                         placeholder="Enter GST NO"
//                                         className="input mt-1" />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">PanCard</label>
//                                     <input {...register("panCard")}
//                                         placeholder="Enter PanCard No"
//                                         className="input mt-1" />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">IEC Code</label>
//                                     <input {...register("iecCode")}
//                                         placeholder="Enter IEC Code"
//                                         className="input mt-1" />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">CIN No</label>
//                                     <input {...register("cinNo")}
//                                         placeholder="Enter CIN No"
//                                         className="input mt-1" />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">TIN No</label>
//                                     <input {...register("tinNo")}
//                                         placeholder="Enter TIN No"
//                                         className="input mt-1" />
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">MSME Udyam</label>
//                                     <input {...register("msmeUdyam")}
//                                         placeholder="Enter MSME Udyam"
//                                         className="input mt-1" />
//                                 </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-secondary-700">Contact Person <span className="text-red-600">*</span></label>
//                                         <input {...register("contactPerson", { required: "Contact Person is required" })}
//                                             placeholder="Enter contact Person"
//                                             className="input mt-1" />
//                                         {errors.contactPerson && <p className="text-red-500 text-sm">{errors.contactPerson.message}</p>}
//                                     </div>
//                                       <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Contact Number <span className="text-red-600">*</span></label>
//                                     <input {...register("contactNumber", {
//                                         required: "Contact Number is required",
//                                         pattern: { value: /^\d{10}$/, message: "Contact Number must be 10 digits" }
//                                     })}
//                                         placeholder="Enter Contact Number"
//                                         className="input mt-1" />
//                                     {errors.contactNumber && <p className="text-red-500 text-sm">{errors.contactNumber.message}</p>}
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Status</label>
//                                     <select {...register("activeFlag")} className="input mt-1">
//                                         <option value="true">Active</option>
//                                         <option value="false">Inactive</option>
//                                     </select>
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700">Image</label>
//                                     <input type="file" onChange={handleImageUpload} className="mt-2" />
//                                     {customerImage && (
//                                         <img
//                                             src={customerImage}
//                                             alt="Uploaded"
//                                             className="mt-2 w-24 h-24 border rounded-lg object-cover"
//                                         />
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Address Details */}
//                             <div className="mt-10">
//                                 <h3 className="font-semibold">Address Details
//                                     <button type="button"
//                                         onClick={handleAddAddress} className="ml-2 bg-primary text-white px-2 py-1 rounded">
//                                         + Add Address
//                                     </button>
//                                 </h3>
//                                 <table className="w-full border mt-4">
//                                     <thead>
//                                         <tr className="bg-gray-200">
//                                             <th>SL.NO</th>
//                                             <th>Line 1</th>
//                                             <th>Line 2</th>
//                                             <th>Country</th>
//                                             <th>State</th>
//                                             <th>State Code</th>
//                                             <th>City</th>
//                                             <th>Pin Code</th>
//                                             <th>Action</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {addressDetails?.map((item, index) => (
//                                             <tr key={item.id} className="border">
//                                                 <td className="p-2">{index + 1}</td>
//                                                 <td className="p-2">
//                                                     <input
//                                                         type="text"
//                                                         value={item.line1}
//                                                         onChange={e => {
//                                                             const updated = [...addressDetails];
//                                                             updated[index].line1 = e.target.value;
//                                                             setAddressDetails(updated);
//                                                         }}
//                                                         className="border p-1 w-full"
//                                                     />
//                                                 </td>
//                                                 <td className="p-2">
//                                                     <input
//                                                         type="text"
//                                                         value={item.line2}
//                                                         onChange={e => {
//                                                             const updated = [...addressDetails];
//                                                             updated[index].line2 = e.target.value;
//                                                             setAddressDetails(updated);
//                                                         }}
//                                                         className="border p-1 w-full"
//                                                     />
//                                                 </td>
//                                                 <td className="p-2">
//                                                     <select
//                                                         value={item.countryId}
//                                                         onChange={e => {
//                                                             const updated = [...addressDetails];
//                                                             updated[index].countryId = e.target.value;
//                                                             setAddressDetails(updated);
//                                                         }}
//                                                         className="input mt-1"
//                                                     >
//                                                         <option value="">Select a Country</option>
//                                                         {countryList?.map((country: any) => (
//                                                             <option key={country.id} value={country.id}>{country.countryName}</option>
//                                                         ))}
//                                                     </select>
//                                                 </td>
//                                                 <td className="p-2">
//                                                     <select
//                                                         value={item.stateId}
//                                                         onChange={e => handleStateChange(index, e.target.value)}
//                                                         className="input mt-1"
//                                                     >
//                                                         <option value="">Select a State</option>
//                                                         {stateList?.map((state: any) => (
//                                                             <option key={state.id} value={state.id}>{state.stateName}</option>
//                                                         ))}
//                                                     </select>
//                                                 </td>
//                                                 <td className="p-2">
//                                                     <input
//                                                         type="text"
//                                                         value={item.stateCode}
//                                                         readOnly // Make it non-editable
//                                                         className="border p-1 w-full bg-gray-100"
//                                                         placeholder="State Code"
//                                                     />
//                                                 </td>
//                                                 <td className="p-2">
//                                                     <select
//                                                         value={item.cityId}
//                                                         onChange={e => {
//                                                             const updated = [...addressDetails];
//                                                             updated[index].cityId = e.target.value;
//                                                             setAddressDetails(updated);
//                                                         }}
//                                                         className="input mt-1"
//                                                     >
//                                                         <option value="">Select a City</option>
//                                                         {cityList?.map((city: any) => (
//                                                             <option key={city.id} value={city.id}>{city.cityName}</option>
//                                                         ))}
//                                                     </select>
//                                                 </td>
//                                                  <td className="p-2">
//                                                     <input
//                                                         type="text"
//                                                         value={item.pinCode || ""}
//                                                         onChange={e => {
//                                                             const val = e.target.value.replace(/\D/g, ""); // numeric only
//                                                             if (val.length <= 6) {
//                                                                 const updated = [...addressDetails];
//                                                                 updated[index].pinCode = val;
//                                                                 setAddressDetails(updated);
//                                                             }
//                                                         }}
//                                                         className="border p-1 w-full"
//                                                         placeholder="6-digit PIN"
//                                                     />
//                                                 </td>
//                                                 <td className="p-2">
//                                                     <Trash className="text-red-500 cursor-pointer" onClick={() => handleDeleteAddress(item.id)} />
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>

//                             <div className="flex justify-end space-x-3 pt-4">
//                                 <button
//                                     type="button"
//                                     onClick={() => setIsModalOpen(false)}
//                                     className="btn btn-secondary"
//                                 >
//                                     Cancel
//                                 </button>
//                                 <button
//                                     type="submit"
//                                     className={`btn 
//                                         ${!isValid
//                                             ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
//                                             : 'btn-primary hover:bg-blue-700'
//                                         }
//                                         transition-colors duration-200
//                                     `}
//                                     disabled={!isValid}
//                                     title={!isValid ? "Please fill all required fields" : ""}
//                                 >
//                                     {isEditing ? "Update Customer" : "Add Customer"}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}

//             {/* View Modal */}
//             <Modal
//                 isOpen={isViewModalOpen}
//                 onClose={() => setIsViewModalOpen(false)}
//                 title="Customer Details"
//             >
//                 {currentCustomer && (
//                     <div className="space-y-4">
//                         {/* Image + Name, Mobile, Email Section */}
//                         <div className="flex gap-6 items-center">
//                             {currentCustomer.imageUrl && (
//                                 <img
//                                     src={currentCustomer.imageUrl}
//                                     alt={currentCustomer.customerName}
//                                     className="w-32 h-32 object-cover rounded-lg shadow"
//                                 />
//                             )}
//                             <div className="space-y-2">
//                                 <div>
//                                     <p className="text-sm text-secondary-500 font-medium">
//                                         Name: <span className="text-md font-bold text-gray-900">{currentCustomer.customerName}</span>
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500 font-medium">
//                                         Contact Person: <span className="text-md font-bold text-gray-900">{currentCustomer.contactPerson}</span>
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500 font-medium">
//                                         Contact Number: <span className="text-md font-bold text-gray-900">{currentCustomer.contactNumber || "-"}</span>
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500 font-medium">
//                                         Mobile: <span className="text-md font-bold text-gray-900">{currentCustomer.mobileNo}</span>
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500 font-medium">
//                                         Email: <span className="text-md font-bold text-gray-900">{currentCustomer.email}</span>
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Other Details (organized as grid with Status included) */}
//                         <div className="grid grid-cols-2 gap-4 pt-4">
//                             <div>
//                                 <p className="text-sm text-secondary-500">GST NO</p>
//                                 <p className="font-medium">{currentCustomer.gstNo}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">PAN Card</p>
//                                 <p className="font-medium">{currentCustomer.panCard}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">IEC Code</p>
//                                 <p className="font-medium">{currentCustomer.iecCode || "-"}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">CIN No</p>
//                                 <p className="font-medium">{currentCustomer.cinNo || "-"}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">TIN No</p>
//                                 <p className="font-medium">{currentCustomer.tinNo || "-"}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">MSME Udyam</p>
//                                 <p className="font-medium">{currentCustomer.msmeUdyam || "-"}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">Contact Person</p>
//                                 <p className="font-medium">{currentCustomer.contactPerson || "-"}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">Status</p>
//                                 <p>
//                                     <span className={`px-2 py-1 rounded-full text-xs ${currentCustomer.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
//                                         {currentCustomer.activeFlag ? "Active" : "Inactive"}
//                                     </span>
//                                 </p>
//                             </div>
//                         </div>

//                         {/* Address Details */}
//                         <div className="pt-4">
//                             <h3 className="text-sm font-medium text-secondary-500 mb-2">Addresses</h3>
//                             {Array.isArray(currentCustomer.address) && currentCustomer.address.map((addr: AddressDetail, idx: number) => (
//                                 <div key={addr.id || idx} className="mb-4 p-3 border rounded-lg">
//                                     <p className="font-medium">{addr.line1}, {addr.line2}</p>
//                                     <p>{addr.cityId}, {addr.stateId} {addr.stateCode && `(${addr.stateCode})`}, {addr.countryId}</p>
//                                     <p>Pin Code: {addr.pinCode}</p>
//                                 </div>
//                             ))}
//                         </div>

//                         {/* Close Button */}
//                         <div className="flex justify-end pt-4">
//                             <button
//                                 onClick={() => setIsViewModalOpen(false)}
//                                 className="btn btn-secondary"
//                             >
//                                 Close
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </Modal>

//             <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
//                 <div className="space-y-4">
//                     <p>Are you sure you want to delete Customer "{currentCustomer?.customerName}"?</p>
//                     <div className="flex justify-end space-x-3 pt-4">
//                         <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
//                         <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
//                     </div>
//                 </div>
//             </Modal>
//         </div>
//     );
// }
import { Key, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data/DataTable";
import { Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllCountries } from "@/state/countrySlice";
import { getAllCities } from "@/state/citySlice";
import { getAllStates } from "@/state/stateSlice";
import { createCustomer, deleteCustomer, getAllCustomers, updateCustomer } from "@/state/customerSlice";
import { getTradeTypeId } from "@/utils/codesHelper";
import { Pagination, usePagination } from "@/components/common/Pagination";
import React from "react";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface customerData {
    id?: number;
    customerName: string;
    gstNo: string;
    panCard: string;
    mobileNo: string;
    email: string;
    iecCode: string;
    cinNo: string;
    tinNo: string;
    msmeUdyam: string;
    pinCode: string;
    contactPerson: string;
    activeFlag: boolean;
    address: AddressDetail[];
}

interface customerFormData {
    id?: number;
    customerName: string;
    gstNo: string;
    panCard: string;
    mobileNo: string;
    email: string;
    iecCode: string;
    cinNo: string;
    tinNo: string;
    msmeUdyam: string;
    pinCode: string;
    contactPerson: string;
    activeFlag: boolean;
    address: AddressDetail[];
}

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

export function CustomerMaster() {
    const { stateList } = useSelector((state: RootState) => state.state);
    const { countryList } = useSelector((state: RootState) => state.country);
    const { cityList } = useSelector((state: RootState) => state.city);
    const { domesticCustomerList, domesticPagination } = useSelector((state: RootState) => state.customer);
    const [addressDetails, setAddressDetails] = useState<AddressDetail[]>([]);
    const [customers, setCustomers]: any = useState(null);
    const [currentCustomer, setCurrentCustomer]: any = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [isEditing, setIsEditing] = React.useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [customerImage, setCustomerImage]: any = useState(null);
    const dispatch = useDispatch<AppDispatch>();

    const domesticTradeTypeId = useMemo(() => getTradeTypeId("DOMESTIC") || 201, []);
    const { currentPage, setItemsPerPage,itemsPerPage, handlePageChange, resetPage, getOffset } = usePagination({ itemsPerPage: 10 });

    const fetchDomesticCustomers = useCallback((overrideOffset?: number) => {
        if (!domesticTradeTypeId) return;
        const offsetValue = overrideOffset !== undefined ? overrideOffset : getOffset();
        return dispatch(getAllCustomers({
           fetchAll: true,
            tradeTypeId: domesticTradeTypeId,
            scope: "domestic"
        }));
    }, [dispatch, getOffset, itemsPerPage, domesticTradeTypeId]);

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
            return normalizedStateList.filter(
                (state) => String(state.countryId) === normalizedCountryId
            );
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

    // Suggestion states for customerName
    const [showSuggestions, setShowSuggestions] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, touchedFields, isValid }
    } = useForm<customerFormData>({
        mode: 'onBlur',
        reValidateMode: 'onBlur'
    });

    // Watch form values
    const customerNameValue = watch("customerName");

    // Existing names for suggestions
    const existingNames = useMemo(
        () => (domesticCustomerList || [])
            .map((c: any) => (c?.customerName ?? ""))
            .filter(Boolean),
        [domesticCustomerList]
    );

    const filteredSuggestions = useMemo(() => {
        const q = (customerNameValue || "").toLowerCase();
        if (!q) return [] as string[];
        return existingNames
            .filter((name: string) => name.toLowerCase().includes(q))
            .slice(0, 8);
    }, [customerNameValue, existingNames]);

    // Live duplicate check for customerName
    // useEffect(() => {
    //     const currentName = (customerNameValue || "").trim().toLowerCase();
    //     if (!currentName) {
    //         setDuplicateError("");
    //         return;
    //     }
    //     const excludeName = isEditing ? (currentCustomer?.customerName || "").toLowerCase() : "";
    //     const isDuplicate = existingNames.some(
    //         (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
    //     );
    //     setDuplicateError(isDuplicate ? "This customer name already exists" : "");
    // }, [customerNameValue, isEditing, currentCustomer, existingNames]);

    // useEffect(() => {
    //     dispatch(getAllCountries({}));
    //     dispatch(getAllStates({}));
    //     dispatch(getAllCities({}));
    //     dispatch(getAllCustomers({}));
    // }, [dispatch]);

    useEffect(() => {
        dispatch(getAllCountries({ fetchAll: true }));
        dispatch(getAllStates({ fetchAll: true }));
        dispatch(getAllCities({ fetchAll: true }));
    }, [dispatch]);

    useEffect(() => {
        fetchDomesticCustomers();
    }, [fetchDomesticCustomers]);

    // Function to get state code by state ID
    const getStateCode = (stateId: string) => {
        const state = stateList.find((state: any) => state.id.toString() === stateId);
        return state ? state.stateCode : "";
    };

    
    const handleCountryChange = (index: number, countryId: string) => {
        setAddressDetails((prev) =>
            prev.map((item, idx) =>
                idx === index
                    ? { ...item, countryId, stateId: "", cityId: "", stateCode: "" }
                    : item
            )
        );
    };

    const handleStateChange = (index: number, stateId: string) => {
        const updated = addressDetails.map((item, i) => {
            if (i === index) {
                // Create a new object instead of modifying the existing one
                return {
                    ...item,
                    stateId: stateId,
                    stateCode: getStateCode(stateId)
                };
            }
            return item;
        });
        setAddressDetails(updated);
    };


        const processedCityList = useMemo(() => {
        const offset = domesticPagination?.offset || 0;
        return (domesticCustomerList || []).map((city: any, index: number) => ({
            ...city,
            serialNo: offset + index + 1
        }));
    }, [domesticCustomerList, domesticPagination?.offset]);

    const columns = useMemo(
        () => [
            {
                Header: 'ID',
                accessor: 'serialNo', // ✅ Use pre-calculated serial number
    width: 50,
    disableFilters: true,
            },
            { Header: "Customer Name", accessor: "customerName" },
            { Header: "Mobile", accessor: "mobileNo" },
            { Header: "GST NO", accessor: "gstNo" },
            { Header: "PanCard", accessor: "panCard" },
            { Header: "Email", accessor: "email" },
            {
                Header: "Status",
                accessor: "activeFlag",
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

    const handleEdit = (customer: customerData) => {
        setIsEditing(true);
        setCurrentCustomer(customer);
        const customerAddresses = Array.isArray(customer.address) ? customer.address : customer.address ? [customer.address] : [];
        setAddressDetails(customerAddresses);
        reset({
            id: customer.id,
            customerName: customer.customerName,
            gstNo: customer.gstNo,
            panCard: customer.panCard,
            mobileNo: customer.mobileNo,
            email: customer.email,
            iecCode: customer.iecCode,
            cinNo: customer.cinNo,
            tinNo: customer.tinNo,
            msmeUdyam: customer.msmeUdyam,
            pinCode: customer.pinCode,
            contactPerson: customer.contactPerson,
            activeFlag: customer.activeFlag,
            address: customerAddresses,
        });
        setIsModalOpen(true);
        setShowSuggestions(false);
    };

    const handleDelete = (state: any) => {
        setCurrentCustomer(state);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentCustomer) return;

        try {
            await dispatch(deleteCustomer(currentCustomer.id)).unwrap();
            await fetchDomesticCustomers();
        } catch (error) {
            console.error("Error deleting country:", error);
        }

        setIsDeleteModalOpen(false);
    };

    const handleView = (customer: customerData) => {
        setCurrentCustomer(customer);
        setIsViewModalOpen(true);
    };

    const handleOpenModal = (editing = false, state: customerData | null = null) => {
        if (editing && state) {
            reset({});
            setCustomers(state);
        } else {
            reset({});
            setCustomers(null);
        }
        setIsEditing(editing);
        setIsModalOpen(true);
        setShowSuggestions(false);
    };

    const onSubmit = async (data: customerFormData) => {
        try {
                const first = addressDetails[0];
            const pin = first?.pinCode || "";
            const isPinValid = /^\d{6}$/.test(pin);
            if (!first?.stateCode || !isPinValid) {
                alert('Please provide valid State Code (auto from State) and 6-digit numeric Pin Code.');
                return;
            }

            // Validate addressDetails: require stateCode and pinCode on each row
            const missing = addressDetails.some(addr => !addr.stateCode || !addr.pinCode);
            if (missing) {
                alert('Please ensure State Code (auto-filled) and Pin Code are provided for all address rows.');
                return;
            }

            console.log('Form data submitted:', data);

            const payload = {
                ...data,
                address: addressDetails[0],
                tradeTypeId: domesticTradeTypeId,
            };

            if (isEditing) {
                await dispatch(updateCustomer(payload)).unwrap();
                await fetchDomesticCustomers();
            } else {
                const { id, ...newCustomerData } = payload;
                await dispatch(createCustomer(newCustomerData)).unwrap();
                resetPage();
                await fetchDomesticCustomers(0);
            }

            setIsModalOpen(false);
            reset();
            setAddressDetails([]);
            setShowSuggestions(false);
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
            <DataTable
                columns={columns}
                data={processedCityList}
                title="Buyers / Customers"
                onAdd={() => handleOpenModal(false)}
                onEdit={handleEdit}
                // onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                filterPlaceholder="Search Customer..."
                disableFullDataFetch={true}
                // initialPageSize={itemsPerPage}
                // onPageSizeChange={setItemsPerPage}
                // totalCount={domesticPagination?.total || 0}
                // currentPage={currentPage}
                // onPageChange={handlePageChange}
            />

          {/* <Pagination
                currentPage={currentPage}
                totalItems={domesticPagination?.total || 0}
                itemsPerPage={itemsPerPage}
                offset={domesticPagination?.offset || 0}
                hasNext={!!domesticPagination?.next}
                hasPrev={!!domesticPagination?.prev}
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
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700">Customer Name <span className="text-red-600">*</span></label>
                                    <input {...register("customerName", {
                                        required: "Customer Name is required",
                                        onChange: () => {
                                            setShowSuggestions(true);
                                        },
                                        onBlur: () => {
                                            setTimeout(() => setShowSuggestions(false), 150);
                                        }
                                    })}
                                        placeholder="Enter Customer Name"
                                        className="input mt-1"
                                        onFocus={() => setShowSuggestions(true)}
                                        autoComplete="off"
                                    />
                                    {(showSuggestions && filteredSuggestions.length > 0) && (
                                        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                                            {filteredSuggestions.map((s: string) => (
                                                <li
                                                    key={s}
                                                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setValue("customerName", s, { shouldValidate: true, shouldDirty: true });
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                 
                                    {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Mobile No</label>
                                    <input
                                        type="tel"
                                        {...register("mobileNo", {
                                            validate: (value) =>
                                                !value || /^\d{10}$/.test(value) || "Mobile number must be 10 digits",
                                        })}
                                        placeholder="Enter Mobile No"
                                        maxLength={10}
                                        className="input mt-1"
                                    />
                                    {errors.mobileNo && <p className="text-red-600 text-sm">{errors.mobileNo.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Email</label>
                                    <input
                                        type="email"
                                        {...register("email", {
                                            validate: (value) =>
                                                !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Enter a valid email address",
                                        })}
                                        placeholder="Enter Email"
                                        className="input mt-1"
                                    />
                                    {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
                                </div>

                                {/* Tax Information */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">GST No</label>
                                    <input {...register('gstNo')}
                                        placeholder="Enter GST NO"
                                        className="input mt-1" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">PanCard</label>
                                    <input {...register("panCard")}
                                        placeholder="Enter PanCard No"
                                        className="input mt-1" />
                                </div>

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
                                    <label className="block text-sm font-medium text-secondary-700">MSME Udyam</label>
                                    <input {...register("msmeUdyam")}
                                        placeholder="Enter MSME Udyam"
                                        className="input mt-1" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Status</label>
                                    <select {...register("activeFlag")} className="input mt-1">
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
                                            <th>State</th>
                                            <th>State Code</th>
                                            <th>City</th>
                                            <th>Pin Code</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addressDetails?.map((item, index) => {
                                            const statesForRow = getStatesForCountry(item.countryId);
                                            const citiesForRow = getCitiesForState(item.stateId, item.countryId);
                                            return (
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
                                                    <td className="p-2 w-56">
                                                        {item.countryId ? (
                                                            <CommonSearchableSelect
                                                                options={(statesForRow || []).map((state: any) => ({
                                                                    value: String(state.id),
                                                                    label: state.stateName || `State ${state.id}`,
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
                                                            //   isDisabled={true}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.stateCode}
                                                            readOnly // Make it non-editable
                                                            className="border p-1 w-full bg-gray-100"
                                                            placeholder="State Code"
                                                        />
                                                    </td>
                                                    <td className="p-2 w-56">
                                                        {item.stateId ? (
                                                            <CommonSearchableSelect
                                                                options={(citiesForRow || []).map((city: any) => ({
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
                                                            />
                                                        ) : (
                                                            <CommonSearchableSelect
                                                                options={[]}
                                                                placeholder="Select State first"
                                                                value=""
                                                            //   isDisabled={true}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.pinCode || ""}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/\D/g, ""); // numeric only
                                                                if (val.length <= 6) {
                                                                    const updated = [...addressDetails];
                                                                    updated[index] = { ...updated[index], pinCode: val };
                                                                    setAddressDetails(updated);
                                                                }
                                                            }}
                                                            className="border p-1 w-full"
                                                            placeholder="6-digit PIN"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Trash className="text-red-500 cursor-pointer" onClick={() => handleDeleteAddress(item.id)} />
                                                    </td>
                                                </tr>
                                            )
                                        })}
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

                        {/* Other Details */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                                <p className="text-sm text-secondary-500">GST NO</p>
                                <p className="font-medium">{currentCustomer.gstNo}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">PAN Card</p>
                                <p className="font-medium">{currentCustomer.panCard}</p>
                            </div>
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
                                <p className="text-sm text-secondary-500">MSME Udyam</p>
                                <p className="font-medium">{currentCustomer.msmeUdyam || "-"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Status</p>
                                <p>
                                    <span className={`px-2 py-1 rounded-full text-xs ${currentCustomer.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                        {currentCustomer.activeFlag ? "Active" : "Inactive"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Address Details */}
                        <div className="pt-4">
                            <h3 className="text-sm font-medium text-secondary-500 mb-2">Addresses</h3>
                            {Array.isArray(currentCustomer.address) && currentCustomer.address.map((addr: AddressDetail, idx: number) => (
                                <div key={addr.id || idx} className="mb-4 p-3 border rounded-lg">
                                    <p className="font-medium">{addr.line1}, {addr.line2}</p>
                                    <p>{addr.cityId}, {addr.stateId} {addr.stateCode && `(${addr.stateCode})`}, {addr.countryId}</p>
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