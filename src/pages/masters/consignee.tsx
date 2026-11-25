// import { Key, useEffect, useMemo, useState } from "react";
// import { useForm } from "react-hook-form";
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
// import React from "react";
// import { createConsignee, deleteConsignee, getAllConsignee, updateConsignee } from "@/state/consigneeSlice";
// import { updateCustomer } from "@/state/customerSlice";
// import { BooleanFilter } from "@/components/filters";

// interface consigneeData {
//     id?: number;
//     consigneeName: string;
//     gstNo: string;
//     panCard: string;
//     mobileNo: string;
//     email: string;
//     activeFlag: boolean;
//     contactPerson: string;
//     contactNumber: string;
//     address: AddressDetail[];
//     addressDisplay?: string;
// }

// interface consigneeFormData {
//     id?: number;
//     consigneeName: string;
//     gstNo: string;
//     panCard: string;
//     mobileNo: string;
//     email: string;
//     activeFlag: boolean;
//     contactPerson: string;    // NEW
//     contactNumber: string;    // NEW
//     address: AddressDetail[];
// }

// interface AddressDetail {
//     id?: number;
//     line1: string;
//     line2: string;
//     countryId: string;
//     stateId: string;
//     stateCode: string;
//     pinCode: string;
//     cityId: string;
//     activeFlag: boolean;
// }

// export function ConsigneeMaster() {

//     const { stateList } = useSelector((state: RootState) => state.state);
//     const { countryList } = useSelector((state: RootState) => state.country);
//     const { cityList } = useSelector((state: RootState) => state.city);
//     const { consigneeList, pagination } = useSelector((state: RootState) => state.consignee);
//     const [addressDetails, setAddressDetails] = useState<AddressDetail[]>([]);
//     const [consignee, setConsignee]: any = useState(consigneeList);
//     const [consignees, setConsignees] = useState<consigneeData[]>([]);

//     const {
//       currentPage,
//       itemsPerPage,
//       handlePageChange,
//       resetPage,
//       getOffset
//     } = usePagination({ itemsPerPage: 10 });

//     // Sync local consignees with Redux state, sorted by id
//     useEffect(() => {
//         const normalized = (consigneeList || []).map((item: any) => {
//             const addressArray = Array.isArray(item.address) ? item.address : item.address ? [item.address] : [];
//             const primaryAddress = addressArray[0] || null;
//             const addressParts = primaryAddress ? [primaryAddress.line1, primaryAddress.line2, primaryAddress.pinCode].filter(Boolean) : [];
//             return {
//                 ...item,
//                 address: addressArray,
//                 addressDisplay: addressParts.join(", "),
//             };
//         });
//         setConsignees(normalized.sort((a: consigneeData, b: consigneeData) => (a.id || 0) - (b.id || 0)));
//     }, [consigneeList]);
//     const [currentConsignee, setCurrentConsignee]: any = useState(null);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//     const [isEditing, setIsEditing] = React.useState(false);
//     const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//     const [consigneeImage, setConsigneeImage]: any = useState(null);
//     const dispatch = useDispatch<AppDispatch>();

//     // const { register, handleSubmit, reset, formState: { errors } } = useForm<consigneeFormData>();
//     const {
//         register,
//         handleSubmit,
//         reset,
//         setValue,
//         watch,
//         formState: { errors, touchedFields, isValid }
//     } = useForm<consigneeFormData>({
//         mode: 'onBlur', // Validate on blur
//         reValidateMode: 'onBlur' // Re-validate on blur
//     });

//     // Get state code by state ID
//     const getStateCode = (stateId: string) => {
//         const st = stateList.find((s: any) => s.id?.toString() === stateId?.toString());
//         return st ? st.stateCode : "";
//     };

//     useEffect(() => {
//         dispatch(getAllCountries({}));
//         dispatch(getAllStates({}));
//         dispatch(getAllCities({}));
//         dispatch(getAllConsignee({ fetchAll: true }));
//     }, [dispatch]);

//     useEffect(() => {
//         dispatch(getAllConsignee({ 
//             offset: getOffset(), 
//             limit: itemsPerPage 
//         }));
//     }, [currentPage, dispatch, getOffset, itemsPerPage]);

//     const processedConsigneeList = useMemo(() => {
//         return consigneeList.map((item: any, index: number) => ({
//             ...item,
//             serialNo: (pagination.offset || 0) + index + 1
//         }));
//     }, [consigneeList, pagination.offset]);

//     const columns = useMemo(
//         () => [
//             { Header: "S.No", accessor: "serialNo" },
//             { Header: "Consignee Name", accessor: "consigneeName" },
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
//         setAddressDetails([
//             ...addressDetails,
//             {
//                 id: addressDetails.length + 1,
//                 line1: "",
//                 line2: "",
//                 countryId: "",
//                 stateId: "",
//                 stateCode: "",
//                 pinCode: "",
//                 cityId: "",
//                 activeFlag: true,
//             },
//         ]);
//     };

//     const handleDeleteAddress = (id: any) => {
//         setAddressDetails(addressDetails.filter((item: any) => item.id !== id));
//     };

//     const handleEdit = (consignee: consigneeData) => {
//         setIsEditing(true);
//         setCurrentConsignee(consignee);
//         // Defensive: always set as array
//         setAddressDetails(Array.isArray(consignee.address) ? consignee.address : consignee.address ? [consignee.address] : []);
//         // setCustomerImage(customer.imageUrl || null);
//         reset({
//             id: consignee.id,
//             consigneeName: consignee.consigneeName,
//             gstNo: consignee.gstNo,
//             panCard: consignee.panCard,
//             mobileNo: consignee.mobileNo,
//             email: consignee.email,
//             contactPerson: consignee.contactPerson,
//             contactNumber: consignee.contactNumber,
//             activeFlag: consignee.activeFlag,
//             address: Array.isArray(consignee.address) ? consignee.address : consignee.address ? [consignee.address] : [],
//         });
//         setIsModalOpen(true);
//     };

//     const handleDelete = (state: any) => {
//         setCurrentConsignee(state);
//         setIsDeleteModalOpen(true);
//     };

//     const confirmDelete = async () => {
//         if (!currentConsignee) return;

//         try {
//             await dispatch(deleteConsignee(currentConsignee.id)).unwrap();
//             resetPage();
//             await dispatch(getAllConsignee({ offset: 0, limit: itemsPerPage }));
//         } catch (error) {
//             console.error("Error deleting consignee:", error);
//         }

//         setIsDeleteModalOpen(false);
//     };

//     const handleView = (consignee: consigneeData) => {
//         setCurrentConsignee(consignee);
//         setIsViewModalOpen(true);
//     };

//     const handleOpenModal = (editing = false, state: consigneeData | null = null) => {
//         if (editing && state) {
//             reset({
//             });
//             setConsignee(state);
//         } else {
//             reset({
//             });
//             setConsignee(null);
//         }
//         setIsEditing(editing);
//         setIsModalOpen(true);
//     };

//     const onSubmit = async (data: consigneeFormData) => {
//         try {
//             // Only mandatory validations: Consignee Name (already via react-hook-form), State Code, Pin Code
//             const first = addressDetails[0];
//             const pin = first?.pinCode || "";
//             const isPinValid = /^\d{6}$/.test(pin);
//             if (!first?.stateCode || !isPinValid) {
//                 alert('Please provide valid State Code (auto from State) and 6-digit numeric Pin Code.');
//                 return;
//             }

//             const payload = {
//                 ...data,
//                 address: first,
//             };

//             if (isEditing) {
//                 await dispatch(updateConsignee(payload)).unwrap();
//             } else {
//                 const { id, ...newconsigneeData } = payload;
//                 await dispatch(createConsignee(newconsigneeData)).unwrap();
//             }

//             resetPage();
//             await dispatch(getAllConsignee({ offset: 0, limit: itemsPerPage }));
//             setIsModalOpen(false);
//             reset();
//             setAddressDetails([]);
//         } catch (error) {
//             console.error('Error submitting form:', error);
//         }
//     };

//     const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setConsigneeImage(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const consigneeNameValue = watch("consigneeName");
//     const [showSuggestions, setShowSuggestions] = useState(false);

//     const existingNames = useMemo(
//         () => consigneeList.map((cs: any) => (cs?.consigneeName ?? "")).filter(Boolean),
//         [consigneeList]
//     );

//     const filteredSuggestions = useMemo(() => {
//         const q = (consigneeNameValue || "").toLowerCase();
//         if (!q) return [] as string[];
//         return existingNames
//             .filter((name: string) => name.toLowerCase().includes(q))
//             .slice(0, 8);
//     }, [consigneeNameValue, existingNames]);

//     return (
//         <div className="p-6 pt-16">
//             {/* <h1 className="text-2xl font-semibold mb-6">Consignee Management</h1> */}
//             {/* <Button onClick={handleAddCustomer} className="mb-4">Add Customer</Button> */}
//             <DataTable
//                 columns={columns}
//                 data={processedConsigneeList}
//                 title="Consignee"
//                 onAdd={() => handleOpenModal(false)}
//                 onEdit={handleEdit}
//                 onDelete={handleDelete}
//                 onView={handleView}
//                 showActions={true}
//                 showColumnFilters={true}
//                 filterPlaceholder="Search Consignee..."
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
//                     <div className="bg-white p-8 shadow-lg w-3/4 h-full  max-h-full overflow-y-auto ">
//                         <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between ">
//                             {isEditing ? "Update Consignee" : "Add Consignee"}
//                             <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
//                                 <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
//                             </svg>
//                         </h2>
//                         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                             <div className="grid grid-cols-3 gap-4">
//                                 <div className="relative">
//                                     <label className="block text-sm font-medium text-gray-700">Consignee Name <span className="text-red-600">*</span> </label>
//                                     <input {...register("consigneeName", {
//                                         required: "Consignee Name is required", onChange: () => {
//                                             setShowSuggestions(true);
//                                         },
//                                         onBlur: () => {
//                                             setTimeout(() => setShowSuggestions(false), 150);
//                                         }
//                                     })}
//                                         placeholder="Enter Consignee Name"
//                                         className="input mt-1" onFocus={() => setShowSuggestions(true)}
//                                         autoComplete="off" />
//                                     {errors.consigneeName && <p className="text-red-500 text-sm">{errors.consigneeName.message}</p>}
//                                     {(showSuggestions && filteredSuggestions.length > 0) && (
//                                         <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
//                                             {filteredSuggestions.map((s: string) => (
//                                                 <li
//                                                     key={s}
//                                                     className="px-3 py-2 cursor-pointer hover:bg-gray-100"
//                                                     onMouseDown={(e) => {
//                                                         e.preventDefault();
//                                                         setValue("consigneeName", s, { shouldValidate: true, shouldDirty: true });
//                                                         setShowSuggestions(false);
//                                                     }}
//                                                 >
//                                                     {s}
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     )}
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">GST No</label>
//                                     <input {...register('gstNo')}
//                                         placeholder="Enter GST No"
//                                         className="input mt-1" />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Pancard</label>
//                                     <input {...register("panCard")}
//                                         placeholder="Enter PanCard No"
//                                         className="input mt-1" />
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
//                                 {/* Contact Person */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">
//                                         Contact Person <span className="text-red-600">*</span>
//                                     </label>
//                                     <input
//                                         {...register("contactPerson", {
//                                             required: "Contact Person is required",
//                                             maxLength: { value: 50, message: "Cannot exceed 50 characters" },
//                                         })}
//                                         placeholder="Enter Contact Person"
//                                         className="input mt-1"
//                                     />
//                                     {errors.contactPerson && (
//                                         <p className="text-red-500 text-sm">{errors.contactPerson.message}</p>
//                                     )}
//                                 </div>

//                                 {/* Contact Number */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">
//                                         Contact Number <span className="text-red-600">*</span>
//                                     </label>
//                                     <input
//                                         {...register("contactNumber", {
//                                             required: "Contact Number is required",
//                                             pattern: {
//                                                 value: /^\d{10}$/,
//                                                 message: "Contact Number must be exactly 10 digits",
//                                             },
//                                             maxLength: {
//                                                 value: 10,
//                                                 message: "Cannot exceed 10 digits",
//                                             },
//                                         })}
//                                         placeholder="Enter Contact Number"
//                                         className="input mt-1"
//                                     />
//                                     {errors.contactNumber && (
//                                         <p className="text-red-500 text-sm">{errors.contactNumber.message}</p>
//                                     )}
//                                 </div>

//                                 <div>
//                                     <label className="block text-sm font-medium text-secondary-700">Status</label>
//                                     <select {...register("activeFlag")} className="input mt-1">
//                                         <option value="true">Active</option>
//                                         <option value="false">Inactive</option>
//                                     </select>
//                                 </div>
//                                 {/* <div>
//                                     <label className="block text-sm font-medium text-gray-700">Image</label>
//                                     <input type="file" onChange={handleImageUpload} className="mt-2" />
//                                     {consigneeImage && (
//                                         <img
//                                             src={consigneeImage}
//                                             alt="Uploaded"
//                                             className="mt-2 w-24 h-24 border rounded-lg object-cover"
//                                         />
//                                     )}
//                                 </div> */}
//                             </div>

//                             {/* Address Details */}
//                             <div className="h-10"></div>
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
//                                             <th>City</th>
//                                             <th>State Code</th>
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
//                                                         onChange={e => {
//                                                             const stateId = e.target.value;
//                                                             const stateCode = getStateCode(stateId);
//                                                             const updated = addressDetails.map((addr, i) =>
//                                                                 i === index ? { ...addr, stateId, stateCode } : addr
//                                                             );
//                                                             setAddressDetails(updated);
//                                                         }}
//                                                         className="input mt-1"
//                                                     >
//                                                         <option value="">Select a State</option>
//                                                         {stateList?.map((state: any) => (
//                                                             <option key={state.id} value={state.id}>{state.stateName}</option>
//                                                         ))}
//                                                     </select>
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
//                                                 {/* State Code (auto) */}
//                                                 <td className="p-2">
//                                                     <input
//                                                         type="text"
//                                                         value={item.stateCode || ""}
//                                                         readOnly
//                                                         className="border p-1 w-full bg-gray-100"
//                                                     />
//                                                 </td>
//                                                 {/* Pin Code */}
//                                                 <td className="p-2">
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
//                                 {/* <button type="submit" className="btn btn-primary">
//                                     {isEditing ? 'Update Consignee' : 'Add Consignee'}
//                                 </button> */}
//                                 <button
//                                     type="submit"
//                                     className={`btn 
//                         ${!isValid
//                                             ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
//                                             : 'btn-primary hover:bg-blue-700'
//                                         }
//                         transition-colors duration-200
//                       `}
//                                     disabled={!isValid}
//                                     title={!isValid ? "Please fill all required fields" : ""}
//                                 >
//                                     {isEditing ? "Update Consignee" : "Add Consignee"}
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
//                 title="Consignee Details"
//             >
//                 {currentConsignee && (
//                     <div className="space-y-4">
//                         {/* Image + Name, Mobile, Email Section */}
//                         <div className="flex gap-6 items-center">
//                             {/* Left: Image - Assuming imageUrl might be available */}
//                             {currentConsignee.imageUrl && (
//                                 <img
//                                     src={currentConsignee.imageUrl}
//                                     alt={currentConsignee.consigneeName}
//                                     className="w-32 h-32 object-cover rounded-lg shadow"
//                                 />
//                             )}

//                             {/* Right: Name, Mobile No, Email */}
//                             <div className="space-y-2">
//                                 <div>
//                                     <p className="text-sm text-secondary-500 font-medium">
//                                         Consignee Name: <span className="text-md font-bold text-gray-900">{currentConsignee.consigneeName}</span>
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500 font-medium">
//                                         Mobile: <span className="text-md font-bold text-gray-900">{currentConsignee.mobileNo}</span>
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500 font-medium">
//                                         Email: <span className="text-md font-bold text-gray-900">{currentConsignee.email}</span>
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Details Grid */}
//                         <div className="grid grid-cols-2 gap-4 pt-4">
//                             <div>
//                                 <p className="text-sm text-secondary-500">GST NO</p>
//                                 <p className="font-medium">{currentConsignee.gstNo}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">Status</p>
//                                 <p>
//                                     <span
//                                         className={`px-2 py-1 rounded-full text-xs ${currentConsignee.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
//                                             }`}
//                                     >
//                                         {currentConsignee.activeFlag ? "Active" : "Inactive"}
//                                     </span>
//                                 </p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">Pancard No</p>
//                                 <p className="font-medium">{currentConsignee.panCard}</p>
//                             </div>
//                             <div>
//                                 <p className="text-sm text-secondary-500">Address Status</p>
//                                 <p>
//                                     <span
//                                         className={`px-2 py-1 rounded-full text-xs ${currentConsignee.address.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
//                                             }`}
//                                     >
//                                         {currentConsignee.address.activeFlag ? "Active" : "Inactive"}
//                                     </span>
//                                 </p>
//                             </div>
//                         </div>

//                         {/* Address Details Section */}
//                         <div className="pt-4 border-t border-gray-200">
//                             <h3 className="text-lg font-medium text-gray-900 mb-3">Address Details</h3>
//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <p className="text-sm text-secondary-500">Address Line 1</p>
//                                     <p className="font-medium">{currentConsignee.address.line1}</p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500">Address Line 2</p>
//                                     <p className="font-medium">{currentConsignee.address.line2 || '-'}</p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500">City</p>
//                                     <p className="font-medium">
//                                         {cityList.find((city: any) => city.id === currentConsignee.address.cityId)?.cityName || `City ID: ${currentConsignee.address.cityId}`}
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500">State</p>
//                                     <p className="font-medium">
//                                         {stateList.find((state: any) => state.id === currentConsignee.address.stateId)?.stateName || `State ID: ${currentConsignee.address.stateId}`}
//                                     </p>
//                                 </div>
//                                 <div>
//                                     <p className="text-sm text-secondary-500">Country</p>
//                                     <p className="font-medium">
//                                         {countryList.find((country: any) => country.id === currentConsignee.address.countryId)?.countryName || `Country ID: ${currentConsignee.address.countryId}`}
//                                     </p>
//                                 </div>
//                             </div>
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
//                     <p>Are you sure you want to delete Consignee "{currentConsignee?.consigneeName}"?</p>
//                     {/* <p className="text-red-600 text-sm">This action cannot be undone.</p> */}
//                     <div className="flex justify-end space-x-3 pt-4">
//                         <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
//                         <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
//                     </div>
//                 </div>
//             </Modal>
//         </div>
//     );
// }
import { Key, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllCountries } from "@/state/countrySlice";
import { getAllCities } from "@/state/citySlice";
import { getAllStates } from "@/state/stateSlice";
import React from "react";
import { createConsignee, deleteConsignee, getAllConsignee, updateConsignee } from "@/state/consigneeSlice";
import { updateCustomer } from "@/state/customerSlice";
import { BooleanFilter } from "@/components/filters";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface consigneeData {
    id?: number;
    consigneeName: string;
    gstNo: string;
    panCard: string;
    mobileNo: string;
    email: string;
    activeFlag: boolean;
    contactPerson?: string;
    contactNumber?: string;
    address: AddressDetail[];
    addressDisplay?: string;
}

interface consigneeFormData {
    id?: number;
    consigneeName: string;
    gstNo: string;
    panCard: string;
    mobileNo: string;
    email: string;
    activeFlag: boolean;
    contactPerson?: string;
    contactNumber?: string;
    address: AddressDetail[];
}


interface AddressDetail {
    id?: number;
    line1: string;
    line2: string;
    countryId: string;
    stateId: string;
    stateCode: string;
    pinCode: string;
    cityId: string;
    activeFlag: boolean;
}

export function ConsigneeMaster() {

    const { stateList } = useSelector((state: RootState) => state.state);
    const { countryList } = useSelector((state: RootState) => state.country);
    const { cityList } = useSelector((state: RootState) => state.city);
    const { consigneeList, pagination } = useSelector((state: RootState) => state.consignee);
    const [addressDetails, setAddressDetails] = useState<AddressDetail[]>([]);
    const [consignee, setConsignee]: any = useState(consigneeList);
    const [consignees, setConsignees] = useState<consigneeData[]>([]);

    const cityMap = useMemo(() => {
        if (!Array.isArray(cityList)) return {} as Record<string, string>;
        return cityList.reduce((acc: Record<string, string>, city: any) => {
            const key = city?.id !== undefined ? String(city.id) : "";
            if (key) acc[key] = city.cityName || city.name || "";
            return acc;
        }, {} as Record<string, string>);
    }, [cityList]);

    const stateMap = useMemo(() => {
        if (!Array.isArray(stateList)) return {} as Record<string, string>;
        return stateList.reduce((acc: Record<string, string>, state: any) => {
            const key = state?.id !== undefined ? String(state.id) : "";
            if (key) acc[key] = state.stateName || state.name || "";
            return acc;
        }, {} as Record<string, string>);
    }, [stateList]);

    const countryMap = useMemo(() => {
        if (!Array.isArray(countryList)) return {} as Record<string, string>;
        return countryList.reduce((acc: Record<string, string>, country: any) => {
            const key = country?.id !== undefined ? String(country.id) : "";
            if (key) acc[key] = country.countryName || country.name || "";
            return acc;
        }, {} as Record<string, string>);
    }, [countryList]);

    const formatAddress = useMemo<(address: any) => string>(() => {
        return (address: any) => {
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
            if (address.pinCode) parts.push(String(address.pinCode));
            return parts.filter(Boolean).join(", ");
        };
    }, [cityMap, stateMap, countryMap]);

    const {
        currentPage,
        itemsPerPage,
        setItemsPerPage,
        handlePageChange,
        resetPage,
        getOffset
    } = usePagination({ itemsPerPage: 10 });

    // Sync local consignees with Redux state, sorted by id
    useEffect(() => {
        const normalized = (consigneeList || []).map((item: any) => {
            const addressArray = Array.isArray(item.address) ? item.address : item.address ? [item.address] : [];
            const primaryAddress = addressArray[0] || null;
            return {
                ...item,
                address: addressArray,
                addressDisplay: formatAddress(primaryAddress),
            };
        });
        setConsignees(normalized.sort((a: consigneeData, b: consigneeData) => (a.id || 0) - (b.id || 0)));
    }, [consigneeList, formatAddress]);
    const [currentConsignee, setCurrentConsignee]: any = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [consigneeImage, setConsigneeImage]: any = useState(null);
    const dispatch = useDispatch<AppDispatch>();

    // const { register, handleSubmit, reset, formState: { errors } } = useForm<consigneeFormData>();
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, touchedFields, isValid }
    } = useForm<consigneeFormData>({
        mode: 'onBlur', // Validate on blur
        reValidateMode: 'onBlur' // Re-validate on blur
    });

    // Get state code by state ID
    const getStateCode = (stateId: string) => {
        const st = stateList.find((s: any) => s.id?.toString() === stateId?.toString());
        return st ? st.stateCode : "";
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
        const key = String(countryId ?? "").trim();
        if (!key) return [];
        return statesByCountry.get(key) ?? [];
    };

    const getCitiesForState = (stateId?: string) => {
        const key = String(stateId ?? "").trim();
        if (!key) return [];
        return citiesByState.get(key) ?? [];
    };

    const handleCountryChange = (index: number, countryId: string) => {
        setAddressDetails((prev) =>
            prev.map((item, idx) =>
                idx === index
                    ? { ...item, countryId, stateId: "", stateCode: "", cityId: "" }
                    : item
            )
        );
    };

    const handleStateChange = (index: number, stateId: string) => {
        const stateCode = getStateCode(stateId);
        setAddressDetails((prev) =>
            prev.map((item, idx) =>
                idx === index
                    ? { ...item, stateId, stateCode, cityId: "" }
                    : item
            )
        );
    };

    const toEditableAddresses = (addresses: any[]) => {
        if (!Array.isArray(addresses)) return [];
        return addresses.map((addr: any, index: number) => {
            const stateId = addr?.stateId !== undefined && addr?.stateId !== null ? String(addr.stateId) : "";
            return {
                id: addr?.id ?? index + 1,
                line1: addr?.line1 || "",
                line2: addr?.line2 || "",
                countryId: addr?.countryId !== undefined && addr?.countryId !== null ? String(addr.countryId) : "",
                stateId,
                stateCode: addr?.stateCode || getStateCode(stateId),
                pinCode: addr?.pinCode ? String(addr.pinCode) : "",
                cityId: addr?.cityId !== undefined && addr?.cityId !== null ? String(addr.cityId) : "",
                activeFlag: addr?.activeFlag !== undefined ? addr.activeFlag : true,
            } as AddressDetail;
        });
    };

    useEffect(() => {
        dispatch(getAllCountries({ fetchAll: true }));
        dispatch(getAllStates({ fetchAll: true }));
        dispatch(getAllCities({ fetchAll: true }));
        dispatch(getAllConsignee({ fetchAll: true }));
    }, [dispatch]);

    useEffect(() => {
        dispatch(getAllConsignee({
            // offset: getOffset(),
            // limit: itemsPerPage
            fetchAll: true
        }));
    }, [currentPage, dispatch, getOffset, itemsPerPage]);

    const processedConsigneeList = useMemo(() => {
        return (consigneeList || []).map((item: any, index: number) => {
            const addressArray = Array.isArray(item.address) ? item.address : item.address ? [item.address] : [];
            const primaryAddress = addressArray[0] || null;
            return {
                ...item,
                serialNo: (pagination.offset || 0) + index + 1,
                addressDisplay: formatAddress(primaryAddress),
            };
        });
    }, [consigneeList, pagination.offset, formatAddress]);

    const columns = useMemo(
        () => [
            { Header: "S.No", accessor: "serialNo" },
            { Header: "Consignee Name", accessor: "consigneeName" },
            { Header: "GST NO", accessor: "gstNo" },
            { Header: "PanCard", accessor: "panCard" },
            { Header: "Address", accessor: "addressDisplay" },
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
        setAddressDetails([
            ...addressDetails,
            {
                id: Date.now() + addressDetails.length,
                line1: "",
                line2: "",
                countryId: "",
                stateId: "",
                stateCode: "",
                pinCode: "",
                cityId: "",
                activeFlag: true,
            },
        ]);
    };

    const handleDeleteAddress = (id: any) => {
        setAddressDetails(addressDetails.filter((item: any) => item.id !== id));
    };

    const handleEdit = (consignee: consigneeData) => {
        setIsEditing(true);
        setCurrentConsignee(consignee);
        const sourceAddresses = Array.isArray(consignee.address) ? consignee.address : consignee.address ? [consignee.address] : [];
        const editableAddresses = toEditableAddresses(sourceAddresses);
        setAddressDetails(editableAddresses);
        reset({
            id: consignee.id,
            consigneeName: consignee.consigneeName,
            gstNo: consignee.gstNo,
            panCard: consignee.panCard,
            mobileNo: consignee.mobileNo,
            email: consignee.email,
            contactPerson: consignee.contactPerson,
            contactNumber: consignee.contactNumber,
            activeFlag: consignee.activeFlag,
            address: editableAddresses,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (state: any) => {
        setCurrentConsignee(state);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentConsignee) return;

        try {
            await dispatch(deleteConsignee(currentConsignee.id)).unwrap();
            resetPage();
            await dispatch(getAllConsignee({ fetchAll: true }));
        } catch (error) {
            console.error("Error deleting consignee:", error);
        }

        setIsDeleteModalOpen(false);
    };

    const handleView = (consignee: consigneeData) => {
        const normalizedAddress = (Array.isArray(consignee.address) ? consignee.address : consignee.address ? [consignee.address] : []).map(addr => ({
            ...addr,
            pinCode: addr.pinCode || (addr as any).pincode || ""
        }));
        const consigneeWithNormalizedAddress = {
            ...consignee,
            address: normalizedAddress
        };
        setCurrentConsignee(consigneeWithNormalizedAddress);
        setIsViewModalOpen(true);
    };

    const resetConsigneeForm = () => {
        reset({
            id: undefined,
            consigneeName: "",
            gstNo: "",
            panCard: "",
            mobileNo: "",
            email: "",
            contactPerson: "",
            contactNumber: "",
            activeFlag: true,
            address: [],
        });
        setAddressDetails([]);
        setCurrentConsignee(null);
        setConsignee(null);
        setConsigneeImage(null);
        setShowSuggestions(false);
    };

    const handleOpenModal = (editing = false, state: consigneeData | null = null) => {
        if (editing && state) {
            reset({
            });
            setConsignee(state);
        } else {
            resetConsigneeForm();
        }
        setIsEditing(editing);
        setIsModalOpen(true);
    };

    // Function to check for duplicate addresses
    const checkDuplicateAddresses = (addresses: AddressDetail[]): boolean => {
        for (let i = 0; i < addresses.length; i++) {
            for (let j = i + 1; j < addresses.length; j++) {
                const addr1 = addresses[i];
                const addr2 = addresses[j];
                
                if (addr1.line1.trim().toLowerCase() === addr2.line1.trim().toLowerCase() &&
                    addr1.line2.trim().toLowerCase() === addr2.line2.trim().toLowerCase() &&
                    addr1.countryId === addr2.countryId &&
                    addr1.stateId === addr2.stateId &&
                    addr1.cityId === addr2.cityId &&
                    addr1.pinCode === addr2.pinCode) {
                    return true;
                }
            }
        }
        return false;
    };

    // Show toast notification for duplicate address
    const showDuplicateAddressToast = () => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
        toast.innerHTML = `
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            <span>Duplicate address! This address already exists.</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    };

    const onSubmit = async (data: consigneeFormData) => {
        try {
            if (addressDetails.length === 0) {
                alert('Please add at least one address.');
                return;
            }
            const hasInvalidAddress = addressDetails.some(addr => {
                const isPinValid = /^\d{6}$/.test(addr.pinCode || "");
                return !addr.stateCode || !isPinValid;
            });
            if (hasInvalidAddress) {
                alert('Please provide valid State Code (auto from State) and 6-digit numeric Pin Code for all addresses.');
                return;
            }

            // Check for duplicate addresses
            if (checkDuplicateAddresses(addressDetails)) {
                showDuplicateAddressToast();
                return;
            }

            const cleanAddresses = addressDetails.map(({ id, ...rest }) => rest);

            const payload = {
                ...data,
                address: cleanAddresses,
            };

            console.log('Submitting payload:', payload);

            if (isEditing) {
                await dispatch(updateConsignee(payload)).unwrap();
            } else {
                const { id, ...newconsigneeData } = payload;
                await dispatch(createConsignee(newconsigneeData)).unwrap();
            }

            resetPage();
            await dispatch(getAllConsignee({ fetchAll: true }));
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
                setConsigneeImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const consigneeNameValue = watch("consigneeName");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const existingNames = useMemo(
        () => consigneeList.map((cs: any) => (cs?.consigneeName ?? "")).filter(Boolean),
        [consigneeList]
    );

    const filteredSuggestions = useMemo(() => {
        const q = (consigneeNameValue || "").toLowerCase();
        if (!q) return [] as string[];
        return existingNames
            .filter((name: string) => name.toLowerCase().includes(q))
            .slice(0, 8);
    }, [consigneeNameValue, existingNames]);

    return (
        <div className="p-6 pt-16">
      
            <DataTable
                columns={columns}
                data={processedConsigneeList}
                title="Consignee"
                onAdd={() => handleOpenModal(false)}
                onEdit={handleEdit}
                // onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                showColumnFilters={true}
                filterPlaceholder="Search Consignee..."
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center flex justify-end z-50 bg-gray-800 bg-opacity-50">
                    <div className="bg-white p-8 shadow-lg w-3/4 h-full  max-h-full overflow-y-auto ">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between ">
                            {isEditing ? "Update Consignee" : "Add Consignee"}
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                            </svg>
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700">Consignee Name <span className="text-red-600">*</span> </label>
                                    <input {...register("consigneeName", {
                                        required: "Consignee Name is required", onChange: () => {
                                            setShowSuggestions(true);
                                        },
                                        onBlur: () => {
                                            setTimeout(() => setShowSuggestions(false), 150);
                                        }
                                    })}
                                        placeholder="Enter Consignee Name"
                                        className="input mt-1" onFocus={() => setShowSuggestions(true)}
                                        autoComplete="off" />
                                    {errors.consigneeName && <p className="text-red-500 text-sm">{errors.consigneeName.message}</p>}
                                    {(showSuggestions && filteredSuggestions.length > 0) && (
                                        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                                            {filteredSuggestions.map((s: string) => (
                                                <li
                                                    key={s}
                                                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setValue("consigneeName", s, { shouldValidate: true, shouldDirty: true });
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">GST No</label>
                                    <input {...register('gstNo')}
                                        placeholder="Enter GST No"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Pancard</label>
                                    <input {...register("panCard")}
                                        placeholder="Enter PanCard No"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Mobile No</label>
                                    <input {...register("mobileNo")}
                                        placeholder="Enter Mobile No"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Email</label>
                                    <input {...register("email")}
                                        placeholder="Enter Email"
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

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Status</label>
                                    <select {...register("activeFlag")} className="input mt-1">
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                                {/* <div>
                                    <label className="block text-sm font-medium text-gray-700">Image</label>
                                    <input type="file" onChange={handleImageUpload} className="mt-2" />
                                    {consigneeImage && (
                                        <img
                                            src={consigneeImage}
                                            alt="Uploaded"
                                            className="mt-2 w-24 h-24 border rounded-lg object-cover"
                                        />
                                    )}
                                </div> */}
                            </div>

                            {/* Address Details */}
                            <div className="h-10"></div>
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
                                            <th>City</th>
                                            <th>State Code</th>
                                            <th>Pin Code</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addressDetails?.map((item, index) => {
                                            const countryKey = String(item.countryId ?? "").trim();
                                            const stateKey = String(item.stateId ?? "").trim();
                                            const availableStates = getStatesForCountry(countryKey);
                                            const availableCities = getCitiesForState(stateKey);
                                            return (
                                                <tr key={item.id} className="border">
                                                    <td className="p-2">{index + 1}</td>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.line1}
                                                            onChange={e => {
                                                                const updated = [...addressDetails];
                                                                updated[index].line1 = e.target.value;
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
                                                                updated[index].line2 = e.target.value;
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
                                                                options={(availableStates || []).map((state: any) => ({
                                                                    value: String(state.id),
                                                                    label: state.stateName || state.name || `State ${state.id}`,
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


                                                    <td className="p-2 w-56">
                                                        {item.stateId ? (
                                                            <CommonSearchableSelect
                                                                options={(availableCities || []).map((city: any) => ({
                                                                    value: String(city.id),
                                                                    label: city.cityName || city.name || `City ${city.id}`,
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
                                                            //   isDisabled={true}
                                                            />
                                                        )}
                                                    </td>
                                                    {/* State Code (auto) */}
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.stateCode || ""}
                                                            readOnly
                                                            className="border p-1 w-full bg-gray-100"
                                                        />
                                                    </td>
                                                    {/* Pin Code */}
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.pinCode || ""}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/\D/g, ""); // numeric only
                                                                if (val.length <= 6) {
                                                                    const updated = [...addressDetails];
                                                                    updated[index].pinCode = val;
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
                                            );
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
                                {/* <button type="submit" className="btn btn-primary">
                                    {isEditing ? 'Update Consignee' : 'Add Consignee'}
                                </button> */}
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
                                    {isEditing ? "Update Consignee" : "Add Consignee"}
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
                title="Consignee Details"
            >
                {currentConsignee && (
                    <div className="space-y-4">
                        {/* Image + Name, Mobile, Email Section */}
                        <div className="flex gap-6 items-center">
                            {/* Left: Image - Assuming imageUrl might be available */}
                            {currentConsignee.imageUrl && (
                                <img
                                    src={currentConsignee.imageUrl}
                                    alt={currentConsignee.consigneeName}
                                    className="w-32 h-32 object-cover rounded-lg shadow"
                                />
                            )}

                            {/* Right: Name, Mobile No, Email */}
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Consignee Name: <span className="text-md font-bold text-gray-900">{currentConsignee.consigneeName}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Mobile: <span className="text-md font-bold text-gray-900">{currentConsignee.mobileNo}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Email: <span className="text-md font-bold text-gray-900">{currentConsignee.email}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                                <p className="text-sm text-secondary-500">GST NO</p>
                                <p className="font-medium">{currentConsignee.gstNo}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Status</p>
                                <p>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${currentConsignee.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {currentConsignee.activeFlag ? "Active" : "Inactive"}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Pancard No</p>
                                <p className="font-medium">{currentConsignee.panCard}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Address Status</p>
                                <p>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${currentConsignee.address.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {currentConsignee.address.activeFlag ? "Active" : "Inactive"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Address Details Section */}
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Address Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-secondary-500">Address Line 1</p>
                                    <p className="font-medium">{currentConsignee.address.line1}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">Address Line 2</p>
                                    <p className="font-medium">{currentConsignee.address.line2 || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">City</p>
                                    <p className="font-medium">
                                        {cityList.find((city: any) => city.id === currentConsignee.address.cityId)?.cityName || `City ID: ${currentConsignee.address.cityId}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">State</p>
                                    <p className="font-medium">
                                        {stateList.find((state: any) => state.id === currentConsignee.address.stateId)?.stateName || `State ID: ${currentConsignee.address.stateId}`}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500">Country</p>
                                    <p className="font-medium">
                                        {countryList.find((country: any) => country.id === currentConsignee.address.countryId)?.countryName || `Country ID: ${currentConsignee.address.countryId}`}
                                    </p>
                                </div>
                            </div>
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
                    <p>Are you sure you want to delete Consignee "{currentConsignee?.consigneeName}"?</p>
                    {/* <p className="text-red-600 text-sm">This action cannot be undone.</p> */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}