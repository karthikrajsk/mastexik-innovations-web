import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { getAllVendors } from "@/state/vendorSlice";
import { AppDispatch, RootState } from "@/state/store";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getAllDyeingWorkOrdersByType } from "@/state/processContractSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllYarnDispatch, deleteYarnDispatch } from "@/state/yarn-dispatch-for-dyeing-slice";


interface YarnDispatch {
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

export function ProcessingIssueYarnDetails() {
    const { list: yarnDispatchDyingList } = useSelector((state: RootState) => state.yarnDispatchForDyeing);
    const [currentDispatch, setCurrentDispatch] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);
    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(getAllYarnDispatch({ processType: "YARN" }));
        dispatch(getAllVendors({}));
        dispatch(getAllDyeingWorkOrdersByType({ type: "YARN", offset: 0, limit: 500 }));
        dispatch(getAllFabricMasters({}));
    }, [dispatch]);

    useEffect(() => {
        if (!currentDispatch) return;
        console.log("yarnDispatchDyingList:", yarnDispatchDyingList);
    })

    const vendorMap = useMemo(() => {
        console.log("Vendor List:", vendorList);
        return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
            acc[vendor.id] = vendor.vendorName;
            console.log("Vendor List:", acc);
            return acc;
        }, {}) || {};
    }, [vendorList]);

    const fabricsArr = useMemo(() => ((fabricMasterList?.data ?? fabricMasterList) || []) as any[], [fabricMasterList]);
    const fabricById = useMemo(() => {
        const m: Record<string, any> = {};
        (Array.isArray(fabricsArr) ? fabricsArr : []).forEach((f: any) => { m[String(f.id)] = f; });
        return m;
    }, [fabricsArr]);

    const workOrderDetailsMap = useMemo(() => {
        if (!Array.isArray(processContractList)) {
            return {};
        }
        return processContractList.reduce((acc: Record<number, { dyeingWorkOrderNo: string; greige: string; finished: string }>, order: any) => {
            if (order?.id != null) {
                const firstItem = Array.isArray(order.items) ? order.items[0] : undefined;
                const g = firstItem?.greigeFabricCodeId;
                const f = firstItem?.finishedFabricCodeId;
                const greigeStr = g && isNaN(Number(g)) ? String(g) : (fabricById[String(g)]?.greigeCode || fabricById[String(g)]?.fabricCode || fabricById[String(g)]?.code || fabricById[String(g)]?.name || (g ?? "--"));
                const finishedStr = f && isNaN(Number(f)) ? String(f) : (fabricById[String(f)]?.fabricCode || fabricById[String(f)]?.code || fabricById[String(f)]?.name || (f ?? "--"));
                acc[order.id] = {
                    dyeingWorkOrderNo: order.dyeingWorkOrderNo ?? "--",
                    greige: greigeStr ?? "--",
                    finished: finishedStr ?? "--"
                };
            }
            return acc;
        }, {} as Record<number, { dyeingWorkOrderNo: string; greige: string; finished: string }>);
    }, [processContractList, fabricById]);

    const processedCityList = useMemo(() => {
        const resolveFinished = (val: any) => {
            if (val == null || val === "") return "--";
            return isNaN(Number(val)) ? String(val) : (fabricById[String(val)]?.fabricCode || fabricById[String(val)]?.code || fabricById[String(val)]?.name || String(val));
        };
        const resolveGreige = (val: any) => {
            if (val == null || val === "") return "--";
            return isNaN(Number(val)) ? String(val) : (fabricById[String(val)]?.greigeCode || fabricById[String(val)]?.fabricCode || fabricById[String(val)]?.code || fabricById[String(val)]?.name || String(val));
        };
        console.log("yarnDispatchDyingList---->", yarnDispatchDyingList);
        return yarnDispatchDyingList
            .filter((city: any) => city.processType === "YARN")
            .map((city: any, index: number) => {
                const details = workOrderDetailsMap[city.dyeingWorkOrderId];
                const vName = vendorMap[Number(city.vendorId)] ?? city.vendorName ?? city.vendor?.vendorName ?? city.vendor?.name ?? '--';
                return {
                    ...city,
                    serialNo: index + 1,
                    processContractNo: details?.dyeingWorkOrderNo ?? "--",
                    // finishedYarn: city.finishedFabricName,
                    // greigeYarn: city.greigeFabricName,
                    finishedYarn: Array.from(new Set((city.yarnIssues || []).map((y: any) => y.finishedYarnName).filter(Boolean))).join(', ') || city.finishedFabricName || '--',
                    greigeYarn: Array.from(new Set((city.yarnIssues || []).map((y: any) => y.yarnName).filter(Boolean))).join(', ') || city.greigeFabricName || '--',
                    orderQuantity: (city.yarnIssues || []).reduce((sum: number, y: any) => sum + (Number(y.issueQty) || 0), 0),
                    vendorName: vName,
                };
            });
            
    }, [yarnDispatchDyingList, workOrderDetailsMap, fabricById, vendorMap]);

    const columns = useMemo(
        () => [
            {
                Header: 'S.No',
                accessor: 'serialNo',
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
                         { Header: 'Process Yarn Issue No', accessor: 'fabricDispatchId' },
            {
                Header: 'Vendor',
                accessor: 'vendorName',
                Cell: ({ value }: { value: string }) => (
                    <span>{value || '--'}</span>
                )
            },
            { Header: 'Process Contract No', accessor: 'processContractNo' },
            { Header: 'Finished Yarn', accessor: 'finishedYarn' },
            { Header: 'Greige Yarn', accessor: 'greigeYarn' },
            { Header: 'Order Qty', accessor: 'orderQuantity' },
            { Header: 'Dispatched Qty', accessor: 'dispatchedQuantity' },
            {
                Header: 'Print',
                id: 'print',
                Cell: ({ row }: any) => {
                    const handlePrint = () => {
                        const printData = { ...row.original, type: 'processing' };
                        localStorage.setItem('yarnReturnPrintData', JSON.stringify(printData));
                        window.open(`/#/transaction/yarn-delivery-challan-print?id=${row.original.id}`, '_blank');
                    };
                    
                    return (
                        <button
                            onClick={handlePrint}
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                            Print
                        </button>
                    );
                },
                disableFilters: true,
                disableGlobalFilter: true
            },
        ],
        []
    );

    const handleAdd = () => {
        navigate("/transaction/processing-yarn-issue");
    };

    const handleView = (dispatch: YarnDispatch) => {
        setCurrentDispatch(dispatch);
        setIsViewModalOpen(true);
    };

    const handleEdit = (processingIssueDtl: any) => {
        console.log(processingIssueDtl);
        navigate("/transaction/processing-yarn-issue", { state: { processingIssueDtl } });
    };

    const handleDelete = (item: any) => {
        setCurrentDispatch(item);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentDispatch) return;

        try {
            await dispatch(deleteYarnDispatch({ id: currentDispatch.id, processType: "YARN" })).unwrap();
            // Optimistic UI is handled in slice; still refresh to stay in sync with backend
            await dispatch(getAllYarnDispatch({ processType: "YARN" }));
        } catch (error) {
            console.error("Error deleting YarnDispatch:", error);
        }

        setIsDeleteModalOpen(false);
    };

    return (
        <div>
            <DataTable
                columns={columns}
                data={processedCityList}
                title="Yarn Dispatch Details"
                onAdd={handleAdd}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions={true}
                filterPlaceholder="Search Yarn Dispatches..."
                showColumnFilters={true}
            />

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Yarn Dispatch Details`}
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
                    <p>Are you sure you want to delete this Yarn Dispatch?</p>
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