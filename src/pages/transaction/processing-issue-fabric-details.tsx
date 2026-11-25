import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { deleteFabricDispatch, getAllFabricDispatch } from "@/state/processIssueSlice";
import { getAllVendors } from "@/state/vendorSlice"; // Import the action
import { AppDispatch, RootState } from "@/state/store";
import { getAllDyeingWorkOrdersByType } from "@/state/processContractSlice";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

interface FabricDispatch {
    id: number;
    fabricDispatchDate: string;
    vendorId: number;
    dyeingWorkOrderId: number;
    orderQuantity: number;
    dispatchedQuantity: number;
    receivedQuantity: number;
    balanceQuantity: number;
    costPerPound: number;
    totalAmount: number;
    colorId: number;
    pantone: string;
    finishingId: number;
    salesOrderId: number;
    shipmentModeId: number;
    lotId: number;
    remarks: string;
    activeFlag: boolean;
}

export function ProcessingIssueFabricDetails() {
    const { fabricDispatchDyingList, paginationInfo } = useSelector((state: RootState) => state.fabricDispatchDyeing);
    const [currentDispatch, setCurrentDispatch] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });

    useEffect(() => {
        dispatch(getAllFabricDispatch({ processType: "FABRIC", fetchAll: true }));
        dispatch(getAllVendors({}));
        dispatch(getAllDyeingWorkOrdersByType({ type: "FABRIC" }));
    }, [dispatch, currentPage, getOffset, itemsPerPage]);

    useEffect(() => {
        if (!currentDispatch) return;
        console.log("fabricDispatchDyingList:", fabricDispatchDyingList);
    })

    const vendorMap = useMemo(() => {
        const list = Array.isArray((vendorList as any)?.data)
            ? (vendorList as any).data
            : (Array.isArray(vendorList) ? vendorList : []);
        return (list || []).reduce((acc: Record<number, string>, v: any) => {
            const id = v?.id != null ? Number(v.id) : undefined;
            const name = v?.vendorName || v?.name || v?.vendor || '';
            if (id != null) acc[id] = name;
            return acc;
        }, {} as Record<number, string>);
    }, [vendorList]);

    const workOrderDetailsMap = useMemo(() => {
        if (!Array.isArray(processContractList)) {
            return {};
        }
        return processContractList.reduce((acc: Record<number, { dyeingWorkOrderNo: string; greige: string; finished: string }>, order: any) => {
            if (order?.id != null) {
                const firstItem = Array.isArray(order.items) ? order.items[0] : undefined;
                acc[order.id] = {
                    dyeingWorkOrderNo: order.dyeingWorkOrderNo ?? "--",
                    greige: firstItem?.greigeFabricCodeId ?? "--",
                    finished: firstItem?.finishedFabricCodeId ?? "--"
                };
            }
            return acc;
        }, {} as Record<number, { dyeingWorkOrderNo: string; greige: string; finished: string }>);
    }, [processContractList]);

    const processedCityList = useMemo(() => {
        return (fabricDispatchDyingList || [])
            .filter((city: any) => city.processType === "FABRIC")
            .map((city: any, index: number) => {
                const details = workOrderDetailsMap[city.dyeingWorkOrderId];
                const vName = vendorMap[Number(city.vendorId)]
                    ?? city.vendorName
                    ?? city.vendor?.vendorName
                    ?? city.vendor?.name
                    ?? '--';
                return {
                    ...city,
                    serialNo: (paginationInfo?.offset || 0) + index + 1,
                    // fabricDispatchId:details?.fabricDispatchId ?? "--",
                    processContractNo: details?.dyeingWorkOrderNo ?? "--",
                    greigeFabric: details?.greige ?? "--",
                    finishedFabric: details?.finished ?? "--",
                    vendorNameResolved: vName,
                };
            });
    }, [fabricDispatchDyingList, workOrderDetailsMap, vendorMap, paginationInfo]);

    const columns = useMemo(
        () => [
            {
                Header: 'S.No',
                accessor: 'serialNo', // ✅ Use pre-calculated serial number
                width: 50,
                disableFilters: true
            },
              {
                Header: 'Dispatch Date',
                accessor: 'fabricDispatchDate',
                Cell: ({ value }: { value: string }) => formatDate(value),
                Filter: DateRangeFilter,
                filter: (rows: any[], columnIds: string[], filterValue: any) => {
                    if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
                    return rows.filter(row => {
                        const dateStr = row.values[columnIds[0]];
                        const date = new Date(dateStr);
                        if (filterValue.from) {
                            const fromDate = new Date(filterValue.from);
                            if (date < fromDate) return false;
                        }
                        if (filterValue.to) {
                            const toDate = new Date(filterValue.to);
                            if (date > toDate) return false;
                        }
                        return true;
                    });
                }
            },
            { Header: 'Process Fabrice Issue No', accessor: 'fabricDispatchId' },
          
            {
                Header: 'Vendor',
                accessor: 'vendorNameResolved',
                Cell: ({ value }: { value: string }) => (
                    <span>{value || '--'}</span>
                )
            },
            { Header: 'Process Contract No', accessor: 'processContractNo' },
            { Header: 'Finished Fabric', accessor: 'finishedFabricCode' },
            { Header: 'Greige Fabric', accessor: 'greigeFabricCode' },
            { Header: 'Order Qty', accessor: 'orderQuantity' },
            { Header: 'Dispatched Qty', accessor: 'dispatchedQuantity' },
            // { Header: 'Balance Qty', accessor: 'balanceQuantity' },
            // { Header: 'Total Amount', accessor: 'totalAmount' },
            // {
            //     Header: 'Status',
            //     accessor: 'activeFlag',
            //     Cell: ({ value }: { value: boolean }) => (
            //         <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            //             {value ? "Active" : "Inactive"}
            //         </span>
            //     ),
            // }
        ],
        []
    );

    const handleAdd = () => {
        navigate("/transaction/processing-fabric-issue");
    };

    const handleView = (dispatch: FabricDispatch) => {
        setCurrentDispatch(dispatch);
        setIsViewModalOpen(true);
    };

    const handleEdit = (processingIssueDtl: any) => {
        console.log(processingIssueDtl);
        navigate("/transaction/processing-fabric-issue", { state: { processingIssueDtl } });
    };

    const handleDelete = (item: any) => {
        setCurrentDispatch(item);
        setIsDeleteModalOpen(true);
    };

    // const confirmDelete = () => {
    //     // TODO: Implement actual delete functionality
    //     setIsDeleteModalOpen(false);
    // };

    const confirmDelete = async () => {
        if (!currentDispatch) return;

        try {
            await dispatch(deleteFabricDispatch({ id: currentDispatch.id, processType: "FABRIC" })).unwrap();
            await dispatch(getAllFabricDispatch({ processType: "FABRIC", fetchAll: true }));
        } catch (error) {
            console.error("Error deleting FabricDispatch:", error);
        }

        setIsDeleteModalOpen(false);
    };

    return (
        <div>
            {/* <h1 className="text-2xl font-bold mb-6">Fabric Dispatch Management</h1> */}

            {/* Main DataTable */}
            <DataTable
                columns={columns}
                data={processedCityList}
                title="Fabric Dispatch Details"
                onAdd={handleAdd}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={true}
                filterPlaceholder="Search fabric dispatches..."
                showColumnFilters={true}
                // initialPageSize={itemsPerPage}
                // onPageSizeChange={setItemsPerPage}
                // totalCount={paginationInfo?.total || 0}
                // currentPage={currentPage}
                // onPageChange={handlePageChange}
                disableFullDataFetch={true}
            />

            {/* <div className="mt-4 flex justify-between items-center px-4">
                <div className="text-sm text-gray-600">
                    Showing {processedCityList.length > 0 ? (paginationInfo?.offset || 0) + 1 : 0} - {(paginationInfo?.offset || 0) + processedCityList.length} of {paginationInfo?.total || 0}
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalItems={paginationInfo?.total || 0}
                    itemsPerPage={itemsPerPage}
                    offset={paginationInfo?.offset || 0}
                    hasNext={!!paginationInfo?.next}
                    hasPrev={!!paginationInfo?.prev}
                    onPageChange={handlePageChange}
                />
            </div> */}

            {/* View Modal */}
            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Fabric Dispatch Details`}
                className="max-w-4xl"
            >
                {currentDispatch && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">ID</p>
                                <p className="font-medium">{currentDispatch.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Dispatch Date</p>
                                <p className="font-medium">{currentDispatch.fabricDispatchDate}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Vendor ID</p>
                                <p className="font-medium">{currentDispatch.vendorId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Work Order ID</p>
                                <p className="font-medium">{currentDispatch.dyeingWorkOrderId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Order Quantity</p>
                                <p className="font-medium">{currentDispatch.orderQuantity}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Dispatched Quantity</p>
                                <p className="font-medium">{currentDispatch.dispatchedQuantity}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Received Quantity</p>
                                <p className="font-medium">{currentDispatch.receivedQuantity}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Balance Quantity</p>
                                <p className="font-medium">{currentDispatch.balanceQuantity}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Cost Per Pound</p>
                                <p className="font-medium">{currentDispatch.costPerPound}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="font-medium">{currentDispatch.totalAmount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Color ID</p>
                                <p className="font-medium">{currentDispatch.colorId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pantone</p>
                                <p className="font-medium">{currentDispatch.pantone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Finishing ID</p>
                                <p className="font-medium">{currentDispatch.finishingId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Sales Order ID</p>
                                <p className="font-medium">{currentDispatch.salesOrderId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Shipment Mode ID</p>
                                <p className="font-medium">{currentDispatch.shipmentModeId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Lot ID</p>
                                <p className="font-medium">{currentDispatch.lotId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Remarks</p>
                                <p className="font-medium">{currentDispatch.remarks || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`px-2 py-1 rounded-full text-xs ${currentDispatch.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {currentDispatch.activeFlag ? "Active" : "Inactive"}
                                </span>
                            </div>
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

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <p>Are you sure you want to delete this Fabric Dispatch?</p>
                    <p className="text-red-600 text-sm">This action cannot be undone.</p>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button onClick={confirmDelete} className="btn btn-danger">
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}