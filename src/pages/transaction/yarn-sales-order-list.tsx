import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { deleteYarnSalesOrder, getAllYarnSalesOrders } from "@/state/yarnSalesSlice";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";


export function YarnSalesOrderList() {
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const { yarnSalesOrderList } = useSelector((state: RootState) => state.yarnSales);
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (storedCompanyId) {
      dispatch(getAllYarnSalesOrders({ companyId: Number(storedCompanyId), fetchAll: true}));
      dispatch(getAllCustomers({ companyId: Number(storedCompanyId) , fetchAll: true}));
      dispatch(getAllConsignee({fetchAll: true}));
      dispatch(getAllYarnMasters({fetchAll: true}));
      dispatch(getAllPaymentTerms({fetchAll: true}));
      dispatch(getAllSubCategories({fetchAll: true}));
      dispatch(getAllUomMaster({fetchAll: true}));
    }
  }, [dispatch, location.pathname]);

  const aggregatedData = useMemo(() => {
    if (!yarnSalesOrderList || !Array.isArray(yarnSalesOrderList)) return [];
    
    return yarnSalesOrderList.map((order: any, index: number) => {
      const totalQuantity = order.items?.reduce((sum: number, item: any) => sum + (item.orderQuantity || 0), 0) || 0;
      
      const yarnNames = order.items?.map((item: any) => {
        const yarn = yarnList?.find((y: any) => y.id === item.yarnId);
        return yarn?.yarnName || '';
      }).filter(Boolean).join(', ') || '';

      const buyer = customerList?.find((c: any) => c.id === order.buyerId);
      const consignee = consigneeList?.find((c: any) => c.id === order.deliveryAtId);
      
      return {
        id: order.id,
        serialNo: index + 1,
        orderDate: order.orderDate?.split('T')[0] || '',
        orderNo: order.yarnSalesNo || `YS-${order.id}`,
        buyerName: buyer?.customerName || '',
        deliveryAt: consignee?.consigneeName || '',
        yarnName: yarnNames,
        quantity: totalQuantity,
        status: order.activeFlag ? 'Active' : 'Inactive'
      };
    });
  }, [yarnSalesOrderList, customerList, consigneeList, yarnList]);

  const paginatedData = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return aggregatedData.slice(start, start + itemsPerPage).map((item, index) => ({
      ...item,
      serialNo: start + index + 1,
    }));
  }, [aggregatedData, currentPage, itemsPerPage]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo',
        width: 50,
        disableFilters: true
      },
      {
        Header: 'Order Date',
        accessor: 'orderDate',
        Cell: ({ value }: { value: string }) => {
          if (!value) return '';
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
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
      { Header: 'Order No', accessor: 'orderNo' },
      { Header: 'Buyer Name', accessor: 'buyerName' },
      { Header: 'Delivery At', accessor: 'deliveryAt' },
      { Header: 'Yarn Name', accessor: 'yarnName' },
      { Header: 'Quantity', accessor: 'quantity' },
    ],
    []
  );

  const handleAdd = () => {
    navigate("/transaction/yarn-sales-order-entry");
  };

  const handleEdit = (aggregatedRowData: any) => {
    const originalOrder = yarnSalesOrderList.find((order: any) => order.id === aggregatedRowData.id);
    if (originalOrder) {
      navigate("/transaction/yarn-sales-order-entry", { state: { yarnSalesOrder: originalOrder } });
    }
  };

  const handleDelete = (order: any) => {
    setCurrentOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleView = (aggregatedRowData: any) => {
    const originalOrder = yarnSalesOrderList.find((order: any) => order.id === aggregatedRowData.id);
    if (originalOrder) {
      setCurrentOrder(originalOrder);
      setIsViewModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!currentOrder) return;

    try {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      if (!storedCompanyId) return;
      await dispatch(deleteYarnSalesOrder({ id: currentOrder.id, companyId: Number(storedCompanyId) })).unwrap();
      await dispatch(getAllYarnSalesOrders({ companyId: Number(storedCompanyId) , fetchAll: true })).unwrap();
    } catch (error) {
      console.error("Error deleting Yarn Sales Order:", error);
    }

    setIsDeleteModalOpen(false);
  };

  return (
  <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={paginatedData}
        title="Yarn Sales Order"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search Yarn Sales Order..."
        showColumnFilters={true}
        disableFullDataFetch={true}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={aggregatedData.length}
        itemsPerPage={itemsPerPage}
        offset={getOffset()}
        hasNext={getOffset() + itemsPerPage < aggregatedData.length}
        hasPrev={currentPage > 0}
        onPageChange={handlePageChange}
      /> */}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this yarn sales order?</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Yarn Sales Order: ${currentOrder?.yarnSalesNo || ''}`}
        className="max-w-4xl"
      >
        {currentOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order No</p>
                <p className="font-medium">{currentOrder.yarnSalesNo || `YS-${currentOrder.id}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">
                  {currentOrder.orderDate ? new Date(currentOrder.orderDate).toLocaleDateString() : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Buyer Name</p>
                <p className="font-medium">{customerList?.find((c: any) => c.id === currentOrder.buyerId)?.customerName || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery At</p>
                <p className="font-medium">{consigneeList?.find((c: any) => c.id === currentOrder.deliveryAtId)?.consigneeName || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GST Type</p>
                <p className="font-medium">{currentOrder.gstTypeId === 1 ? 'CGST/SGST' : 'IGST'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="font-medium">
                  {paymentTermsList?.find((pt: any) => pt.id === currentOrder.paymentTermsId)?.termName || currentOrder.paymentTerms || '-'}
                </p>
              </div>
            </div>

            {currentOrder.items && currentOrder.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Item Details</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">S.No</th>
                      <th className="border border-gray-300 px-4 py-2">Yarn Name</th>
                      <th className="border border-gray-300 px-4 py-2">Mill Name</th>
                      <th className="border border-gray-300 px-4 py-2">Order Quantity</th>
                      <th className="border border-gray-300 px-4 py-2">Rate/Unit</th>
                      <th className="border border-gray-300 px-4 py-2">UOM</th>
                      <th className="border border-gray-300 px-4 py-2">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.items.map((item: any, index: number) => {
                      const yarn = yarnList?.find((y: any) => y.id === item.yarnId);
                      const mill = subCategoryList?.find((sc: any) => sc.id === item.millId);
                      const uom = uomList?.find((u: any) => u.id === item.uomId);
                      return (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2">{yarn?.yarnName || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2">{mill?.subCategoryName || item.millName || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{item.orderQuantity}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{item.ratePerUnit}</td>
                          <td className="border border-gray-300 px-4 py-2">{uom?.uomName || item.uomName || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{item.totalAmount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default YarnSalesOrderList;
