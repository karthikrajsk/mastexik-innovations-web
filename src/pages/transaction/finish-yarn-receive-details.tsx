import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { 
  deleteFinishFabricReceive, 
  getAllFinishFabricReceivesByType 
} from "@/state/finishFabricReceiveSlice";
import { getAllDyeingWorkOrders } from "@/state/processContractSlice";
import { AppDispatch, RootState } from "@/state/store";
import React from "react";
import { getAllVendors } from "@/state/vendorSlice";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export function FinishYarnReceiveDetails() {
    const { finishFabricReceiveList, paginationInfo } = useSelector((state: RootState) => state.finishFabricReceive);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentFinishYarnReceive, setCurrentFinishYarnReceive] = useState<any>(null);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });

    useEffect(() => {
        const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        const companyId = v ? Number(v) : undefined;
        dispatch(getAllFinishFabricReceivesByType({ processType: "YARN", companyId, fetchAll: true }));
        dispatch(getAllVendors({}));
        dispatch(getAllDyeingWorkOrders({}));
    }, [dispatch, currentPage, getOffset, itemsPerPage]);

    const vendorMap = useMemo(() => {
        return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
            acc[vendor.id] = vendor.vendorName;
            return acc;
        }, {}) || {};
    }, [vendorList]);

    // Create a map of dyeingWorkOrderId to yarnItems
    const workOrderYarnMap = useMemo(() => {
        return processContractList?.reduce((acc: Record<number, any>, contract: any) => {
            // if (contract.yarnItems && contract.yarnItems.length > 0) {
            //     acc[contract.id] = contract.yarnItems[0]; // Get first yarn item
            // }
             if (contract.yarnItems && contract.yarnItems.length > 0) {
                // Join all finished yarn names with comma
                const finishedYarnNames = contract.yarnItems
                    .map((item: any) => item.finishedYarnName)
                    .filter(Boolean)
                    .join(", ");
                
                // Join all greige yarn names with comma
                const greigeYarnNames = contract.yarnItems
                    .map((item: any) => item.greigeYarnName)
                    .filter(Boolean)
                    .join(", ");

                // Join all quantities with comma
                const orderQuantities = contract.yarnItems
                    .map((item: any) => Number(item.quantity || 0).toFixed(2))
                    .join(", ");

                acc[contract.id] = {
                    finishedYarnName: finishedYarnNames || '-',
                    greigeYarnName: greigeYarnNames || '-',
                    orderQuantity: orderQuantities || '-'
                };
            }
            return acc;
        }, {}) || {};
    }, [processContractList]);

    // Create a map of dyeingWorkOrderId to dyeingWorkOrderNo
    const workOrderNoMap = useMemo(() => {
        return processContractList?.reduce((acc: Record<number, string>, contract: any) => {
            acc[contract.id] = contract.dyeingWorkOrderNo || '-';
            return acc;
        }, {}) || {};
    }, [processContractList]);

    const processedList = useMemo(() => {
        if (!Array.isArray(finishFabricReceiveList)) return [];
        
        return finishFabricReceiveList
            .filter((item: any) => item.processType === "YARN")
            .map((item: any, index: number) => {
                const yarnInfo = workOrderYarnMap[item.dyeingWorkOrderId];
                const processContractNo = workOrderNoMap[item.dyeingWorkOrderId];
                 const receivedQuantities = item.yarnItems && item.yarnItems.length > 0
                    ? item.yarnItems.map((yi: any) => Number(yi.totalKgs || 0).toFixed(2)).join(", ")
                    : Number(item.receivedQuantity || 0).toFixed(2);

                return {
                    ...item,
                    serialNo: (paginationInfo?.offset || 0) + index + 1,
                    finishedYarnName: yarnInfo?.finishedYarnName || '-',
                    greigeYarnName: yarnInfo?.greigeYarnName || '-',
                    receivedQuantityDisplay: receivedQuantities,
                    processContractNo: processContractNo || '-'
                };
            });
    }, [finishFabricReceiveList, workOrderYarnMap, workOrderNoMap, paginationInfo]);

    const columns = useMemo(
        () => [
            {
                Header: 'S.No',
                accessor: 'serialNo',
                width: 50,
                disableFilters: true,
            },
            {
                Header: 'Receive Date',
                accessor: 'fabricReceiveDate',
                Cell: ({ value }: { value: string }) => 
                    value ? new Date(value).toLocaleDateString() : '-',
                Filter: DateRangeFilter,
                filter: (rows: any[], columnIds: string[], filterValue: any) => {
                    if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
                    return rows.filter(row => {
                        const dateStr = row.values[columnIds[0]];
                        if (!dateStr) return false;
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
               {
                Header: 'Receive No',
                accessor: 'receiveNo',
            },
            {
                Header: 'Process Contract No',
                accessor: 'processContractNo',
                width: 150,
            },
            {
                Header: 'Finished Yarn',
                accessor: 'finishedYarnName',
            },
            {
                Header: 'Greige Yarn',
                accessor: 'greigeYarnName',
            },
      {
    Header: 'Order Qty (kgs)',
    accessor: 'orderQuantityDisplay', // Updated
    Cell: ({ value }: { value: any }) => value || '0.00'
},
{
    Header: 'Received Qty (kgs)',
    accessor: 'receivedQuantityDisplay', // Updated
    Cell: ({ value }: { value: any }) => value || '0.00'
},
        ],
        []
    );

    const handleAdd = () => {
        navigate("/transaction/processing-receive-yarn");
    };

    const handleEdit = (finishYarnReceive: any) => {
        navigate("/transaction/processing-receive-yarn", { state: { finishYarnReceive } });
    };

    const handleDelete = (finishYarnReceive: any) => {
        setCurrentFinishYarnReceive(finishYarnReceive);
        setIsDeleteModalOpen(true);
    };

    const handleView = (finishYarnReceive: any) => {
        setCurrentFinishYarnReceive(finishYarnReceive);
        setIsViewModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentFinishYarnReceive) return;
        try {
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = v ? Number(v) : undefined;
            await dispatch(deleteFinishFabricReceive({ id: currentFinishYarnReceive.id, companyId, processType: "YARN" }) as any).unwrap();
            await dispatch(getAllFinishFabricReceivesByType({ processType: "YARN", companyId, fetchAll:true }) as any);
        } catch (error) {
            console.error("Error deleting Yarn Receive:", error);
        }
        setIsDeleteModalOpen(false);
    };

    return (
        <div>
            <DataTable
                columns={columns}
                data={processedList}
                title="Yarn Receives"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                filterPlaceholder="Search yarn receives..."
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
                    Showing {processedList.length > 0 ? (paginationInfo?.offset || 0) + 1 : 0} - {(paginationInfo?.offset || 0) + processedList.length} of {paginationInfo?.total || 0}
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Delete"
            >
                <div className="space-y-4">
                    <p>Are you sure you want to delete this Yarn Receive?</p>
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

            {/* View Details Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Yarn Receive Details"
                className="w-full max-w-4xl"
            >
                {currentFinishYarnReceive && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-secondary-500">Receive Date</p>
                                <p className="font-medium">
                                    {currentFinishYarnReceive.fabricReceiveDate 
                                        ? new Date(currentFinishYarnReceive.fabricReceiveDate).toLocaleDateString()
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Process Type</p>
                                <p className="font-medium capitalize">{currentFinishYarnReceive.processType?.toLowerCase()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Finished Yarn Name</p>
                                <p className="font-medium">{currentFinishYarnReceive.finishedYarnName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Greige Yarn Name</p>
                                <p className="font-medium">{currentFinishYarnReceive.greigeYarnName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Order Quantity (kgs)</p>
                                <p className="font-medium">{currentFinishYarnReceive.orderQuantity?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Received Quantity (kgs)</p>
                                <p className="font-medium">{currentFinishYarnReceive.receivedQuantity?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Balance Quantity (kgs)</p>
                                <p className="font-medium">{currentFinishYarnReceive.balanceQuantity?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Cost Per Pound</p>
                                <p className="font-medium">${currentFinishYarnReceive.costPerPound?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Total Amount</p>
                                <p className="font-medium">${currentFinishYarnReceive.totalAmount?.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Status</p>
                                <p>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        currentFinishYarnReceive.activeFlag
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {currentFinishYarnReceive.activeFlag ? 'Active' : 'Inactive'}
                                    </span>
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-secondary-500">Remarks</p>
                                <p className="font-medium">{currentFinishYarnReceive.remarks || 'No remarks'}</p>
                            </div>
                        </div>

                        {/* Yarn Items Section */}
                        {currentFinishYarnReceive.yarnItems && currentFinishYarnReceive.yarnItems.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-medium mb-2">Received Yarn Items</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">#</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Yarn Code</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">No. of Bags</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Kgs per Bag</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Total Kgs</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Lot No</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentFinishYarnReceive.yarnItems.map((item: any, idx: number) => (
                                                <tr key={item.id} className="border">
                                                    <td className="px-4 py-2 border">{idx + 1}</td>
                                                    <td className="px-4 py-2 border">{item.finishedYarnCode || '-'}</td>
                                                    <td className="px-4 py-2 border">{item.noOfBags}</td>
                                                    <td className="px-4 py-2 border">{item.kgsPerBag?.toFixed(2)}</td>
                                                    <td className="px-4 py-2 border">{item.totalKgs?.toFixed(2)}</td>
                                                    <td className="px-4 py-2 border">{item.lotNo}</td>
                                                    <td className="px-4 py-2 border">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            item.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {item.activeFlag ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

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
        </div>
    );
}