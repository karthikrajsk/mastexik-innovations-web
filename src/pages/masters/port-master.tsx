import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { getAllCategories } from "@/state/categorySlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllCountries } from "@/state/countrySlice";
import { getAllCities } from "@/state/citySlice";
import { createPort, deletePort, getAllPorts, updatePort } from "@/state/portSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

interface PortFormData {
    id?: number | null;
    portName: string;
    portTypeId: string;
    countryId: string;
    cityId: string;
    activeFlag: boolean;
}

export function PortMaster() {
    const dispatch = useDispatch<AppDispatch>();
    const { portList, pagination, loading } = useSelector((state: RootState) => state.port);
    const { categoryList } = useSelector((state: RootState) => state.category);
    const { subCategoryList } = useSelector((state: RootState) => state.subCategory);
    const { countryList } = useSelector((state: RootState) => state.country);
    const { cityList } = useSelector((state: RootState) => state.city);

    const {
        currentPage,
        itemsPerPage,
        handlePageChange,
        resetPage,
        getOffset
    } = usePagination({ itemsPerPage: 10 });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentPort, setCurrentPort] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Suggestion states
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isValid }
    } = useForm<PortFormData>({
        mode: 'onBlur',
        reValidateMode: 'onBlur'
    });

    const countryIdValue = watch("countryId");
    const portNameValue = watch("portName");

    useEffect(() => {
        dispatch(getAllPorts({ fetchAll: true }));
        dispatch(getAllCategories({ fetchAll: true }));
        dispatch(getAllSubCategories({ fetchAll: true }));
        dispatch(getAllCountries({ fetchAll: true }));
        dispatch(getAllCities({ fetchAll: true }));
    }, [currentPage, dispatch, getOffset, itemsPerPage]);


            const PortType  = useMemo(
          () => subCategoryList?.filter((sc: any) => sc.categoryName === "Port") || [],
          [subCategoryList]
        );


    const filteredCities = useMemo(() => {
        if (!countryIdValue) return [];
        return cityList?.filter((city: any) => String(city.countrySno || city.countryId) === String(countryIdValue));
    }, [countryIdValue, cityList]);

    const existingPortNames = useMemo(() => {
        return portList.map((p: any) => p.portName).filter(Boolean);
    }, [portList]);

    const filteredSuggestions = useMemo(() => {
        const q = (portNameValue || "").toLowerCase();
        if (!q) return [];
        return Array.from(new Set(existingPortNames))
            .filter((name: any) => name.toLowerCase().includes(q))
            .slice(0, 8);
    }, [portNameValue, existingPortNames]);

    const processedPortList = useMemo(() => {
        return portList.map((port: any, index: number) => ({
            ...port,
            serialNo: (pagination.offset || 0) + index + 1
        }));
    }, [portList, pagination.offset]);

    const columns = useMemo(() => [
        { Header: 'S.No', accessor: 'serialNo', width: 50, disableFilters: true },
        { Header: "Port Name", accessor: "portName" },
        { Header: "Port Type", accessor: "portTypeName" },
        { Header: "City", accessor: "cityName" },
        { Header: "Country", accessor: "countryName" },
        {
            Header: "Status",
            accessor: "activeFlag",
            Filter: BooleanFilter,
            Cell: ({ value }: { value: boolean }) => (
                <span className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {value ? "Active" : "Inactive"}
                </span>
            ),
        },
    ], []);

    const handleOpenModal = (editing = false, port: any = null) => {
        setIsEditing(editing);
        if (editing && port) {
            setCurrentPort(port);
            reset({
                id: port.id,
                portName: port.portName,
                portTypeId: port.portTypeId ? String(port.portTypeId) : "",
                countryId: port.countryId ? String(port.countryId) : "",
                cityId: port.cityId ? String(port.cityId) : "",
                activeFlag: port.activeFlag
            });
        } else {
            setCurrentPort(null);
            reset({ id: null, portName: "", portTypeId: "", countryId: "", cityId: "", activeFlag: true });
        }
        setIsModalOpen(true);
        setShowSuggestions(false);
    };

    const onSubmit = async (data: PortFormData) => {
        if (isEditing) {
            await dispatch(updatePort(data));
        } else {
            await dispatch(createPort(data));
        }
        resetPage();
        dispatch(getAllPorts({ fetchAll: true }));
        setIsModalOpen(false);
    };

    const handleDelete = (port: any) => {
        setCurrentPort(port);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (currentPort) {
            await dispatch(deletePort(currentPort.id));
            resetPage();
            dispatch(getAllPorts({ fetchAll: true }));
            setIsDeleteModalOpen(false);
        }
    };

    const handleView = (port: any) => {
        setCurrentPort(port);
        setIsViewModalOpen(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
        } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
            e.preventDefault();
            handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
        }
    };

    const handleSuggestionClick = (name: string) => {
        setValue("portName", name, { shouldValidate: true });
        setShowSuggestions(false);
    };

    return (
        <div className="p-6 pt-16">
            <h1 className="text-[20px] font-semibold mb-2 text-slate-800 tracking-tight">Port Master</h1>
            <DataTable
                columns={columns}
                data={processedPortList}
                title="Port Master"
                onAdd={() => handleOpenModal(false)}
                onEdit={(row) => handleOpenModal(true, row)}
                // onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                showColumnFilters={true}
                filterPlaceholder="Search Port..."
                disableFullDataFetch={true}
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Edit Port" : "Add Port"}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium">Port Name <span className="text-red-600">*</span></label>
                        <input 
                            {...register("portName", { 
                                required: "Port Name is required",
                                validate: (value) => {
                                    if (!value || !countryIdValue) return true;
                                    const val = value.trim().toLowerCase();
                                    const isDuplicate = portList.some((p: any) => 
                                        p.portName.toLowerCase() === val && 
                                        String(p.countryId) === String(countryIdValue) &&
                                        p.id !== currentPort?.id
                                    );
                                    return isDuplicate ? "Port name already exists in this country" : true;
                                }
                            })}
                            placeholder="Enter Port Name"
                            className="input mt-1"
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onKeyDown={handleKeyDown}
                            autoComplete="off"
                        />
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                                {filteredSuggestions.map((name, idx) => (
                                    <li 
                                        key={idx}
                                        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${idx === activeSuggestionIndex ? 'bg-blue-100' : ''}`}
                                        onClick={() => handleSuggestionClick(name)}
                                    >
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {errors.portName && <p className="text-red-600 text-xs mt-1">{errors.portName.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Port Type <span className="text-red-600">*</span></label>
                        <select {...register("portTypeId", { required: "Port Type is required" })} className="input mt-1">
                            <option value="">Select Port Type</option>
                            {PortType.map((type: any) => (
                                <option key={type.id} value={String(type.id)}>{type.subCategoryName}</option>
                            ))}
                        </select>
                        {errors.portTypeId && <p className="text-red-600 text-xs mt-1">{errors.portTypeId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Country <span className="text-red-600">*</span></label>
                        <select 
                            {...register("countryId", { required: "Country is required" })} 
                            className="input mt-1"
                            onChange={(e) => {
                                setValue("countryId", e.target.value);
                                setValue("cityId", "");
                            }}
                        >
                            <option value="">Select Country</option>
                            {countryList.map((c: any) => (
                                <option key={c.id} value={String(c.id)}>{c.countryName}</option>
                            ))}
                        </select>
                        {errors.countryId && <p className="text-red-600 text-xs mt-1">{errors.countryId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">City <span className="text-red-600">*</span></label>
                        <select {...register("cityId", { required: "City is required" })} className="input mt-1" disabled={!countryIdValue}>
                            <option value="">Select City</option>
                            {filteredCities.map((c: any) => (
                                <option key={c.id} value={String(c.id)}>{c.cityName}</option>
                            ))}
                        </select>
                        {errors.cityId && <p className="text-red-600 text-xs mt-1">{errors.cityId.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Status</label>
                        <select {...register("activeFlag")} className="input mt-1">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={!isValid} className={`btn ${isValid ? 'btn-primary' : 'bg-gray-300 cursor-not-allowed'}`}>
                            {isEditing ? "Update" : "Add"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View Port">
                {currentPort && (
                    <div className="space-y-4">
                        <div><label className="text-xs font-semibold text-gray-500">Port Name</label><p className="p-2 border rounded bg-gray-50">{currentPort.portName}</p></div>
                        <div><label className="text-xs font-semibold text-gray-500">Port Type</label><p className="p-2 border rounded bg-gray-50">{currentPort.portTypeName}</p></div>
                        <div><label className="text-xs font-semibold text-gray-500">City</label><p className="p-2 border rounded bg-gray-50">{currentPort.cityName}</p></div>
                        <div><label className="text-xs font-semibold text-gray-500">Country</label><p className="p-2 border rounded bg-gray-50">{currentPort.countryName}</p></div>
                        <div><label className="text-xs font-semibold text-gray-500">Status</label><p className="mt-1"><span className={`px-2 py-1 rounded-full text-xs ${currentPort.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{currentPort.activeFlag ? "Active" : "Inactive"}</span></p></div>
                        <div className="flex justify-end pt-4"><button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">Close</button></div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
                <div className="space-y-4">
                    <p>Are you sure you want to delete port "{currentPort?.portName}"?</p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
