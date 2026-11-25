import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { getAllCountries } from "@/state/countrySlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCities } from "@/state/citySlice";
import { deleteTransport, getAllTransports } from "@/state/transportSlice";
import { AppDispatch, RootState } from "@/state/store";
import { BooleanFilter } from "@/components/filters";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export function TransportMaster() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { transportList, pagination } = useSelector((state: RootState) => state.transport);
    const { countryList } = useSelector((state: RootState) => state.country);
    const { stateList } = useSelector((state: RootState) => state.state);
    const { cityList } = useSelector((state: RootState) => state.city);

    const {
        currentPage,
        itemsPerPage,
        handlePageChange,
        resetPage,
        getOffset,
        setItemsPerPage
    } = usePagination({ itemsPerPage: 10 });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentTransport, setCurrentTransport] = useState<any>(null);

    useEffect(() => {
        dispatch(getAllTransports({ fetchAll: true }));
        dispatch(getAllCountries({ fetchAll: true }));
        dispatch(getAllStates({ fetchAll: true }));
        dispatch(getAllCities({ fetchAll: true }));
    }, [currentPage, dispatch, getOffset, itemsPerPage]);

    const formatAddress = (transport: any) => {
        const addr = transport?.address;
        if (!addr) return "";
        const city = cityList.find((c: any) => String(c.id) === String(addr.cityId))?.cityName || "";
        const state = stateList.find((s: any) => String(s.id) === String(addr.stateId));
        const country = countryList.find((c: any) => String(c.id) === String(addr.countryId))?.countryName || "";

        let display = `${addr.line1}`;
        if (addr.line2) display += `, ${addr.line2}`;
        display += `\n${city} - ${addr.pinCode}, ${state?.stateName || ""} (${state?.stateCode || ""}), ${country}`;
        return display;
    };

    const processedList = useMemo(() => {
        return transportList.map((t: any, index: number) => ({
            ...t,
            serialNo: (pagination.offset || 0) + index + 1,
            addressDisplay: formatAddress(t)
        }));
    }, [transportList, pagination.offset, cityList, stateList, countryList]);

    const columns = useMemo(() => [
        { Header: 'S.No', accessor: 'serialNo', width: 50, disableFilters: true },
        { Header: "Transport Name", accessor: "transportName" },
        { Header: "GST No", accessor: "gstNo" },
        { Header: "Address", accessor: "addressDisplay", Cell: ({ value }: any) => <div className="whitespace-pre-line">{value}</div> },
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
    ], [cityList, stateList, countryList]);

    const handleAdd = () => {
        navigate("/masters/transport-master-add");
    };

    const handleEdit = (row: any) => {
        navigate(`/masters/transport-master/edit/${row.id}`);
    };

    const handleDelete = (t: any) => {
        setCurrentTransport(t);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (currentTransport) {
            await dispatch(deleteTransport(currentTransport.id));
            resetPage();
            dispatch(getAllTransports({ fetchAll: true }));
            setIsDeleteModalOpen(false);
        }
    };

    const handleView = (t: any) => {
        setCurrentTransport(t);
        setIsViewModalOpen(true);
    };

    return (
        <div className="p-6 pt-16">
            <DataTable
                columns={columns}
                data={processedList}
                title="Transport Master"
                onAdd={handleAdd}
                onEdit={handleEdit}
                // onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                showColumnFilters={true}
                filterPlaceholder="Search Transport..."
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

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="View Transport" className="max-w-2xl">
                {currentTransport && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-semibold text-gray-500">Transport Name</label><p className="p-2 border rounded bg-gray-50">{currentTransport.transportName}</p></div>
                            <div><label className="text-xs font-semibold text-gray-500">GST No</label><p className="p-2 border rounded bg-gray-50">{currentTransport.gstNo || "-"}</p></div>
                        </div>
                        <div><label className="text-xs font-semibold text-gray-500">Address</label><p className="p-2 border rounded bg-gray-50 whitespace-pre-line">{formatAddress(currentTransport)}</p></div>
                        <div><label className="text-xs font-semibold text-gray-500">Status</label><p className="mt-1"><span className={`px-2 py-1 rounded-full text-xs ${currentTransport.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{currentTransport.activeFlag ? "Active" : "Inactive"}</span></p></div>
                        <div className="flex justify-end pt-4"><button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">Close</button></div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
                <div className="space-y-4">
                    <p>Are you sure you want to delete transport "{currentTransport?.transportName}"?</p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
