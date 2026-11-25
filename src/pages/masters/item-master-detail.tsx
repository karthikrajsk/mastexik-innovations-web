import { useEffect, useMemo, useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { DataTable } from "@/components/data/DataTable"
import { Pagination, usePagination } from "@/components/common/Pagination"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/state/store"
import { BooleanFilter } from "@/components/filters"
import {
  deleteItemMaster,
  getAllItemMasters,
} from "@/state/itemSlice"
import { getAllUomMaster } from "@/state/uomMasterSlice"
import { useNavigate } from "react-router-dom"
import React from "react"

export default function ItemMasterDetail() {
  const { itemList, pagination } = useSelector((state: RootState) => state.itemMaster)
  const { uomList } = useSelector((state: RootState) => state.uom)
  const [items, setItems] = useState<any[]>(Array.isArray(itemList) ? itemList : [])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 })

  useEffect(() => {
    dispatch(getAllItemMasters({
      fetchAll: true,
    }))
    dispatch(getAllUomMaster({ fetchAll: true }))
  }, [currentPage, dispatch, getOffset, itemsPerPage])

  useEffect(() => {
    setItems(itemList)
  }, [itemList])

  const getUomName = (uomId: any) => {
    if (!uomList || !uomId) return "N/A"
    const uom = uomList.find((u: any) => u.id === Number(uomId))
    return uom ? uom.uomName : "N/A"
  }

  const processedItemList = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((item: any, index: number) => ({
      ...item,
      serialNo: (pagination.offset || 0) + index + 1,
      uomName: item.uomName || getUomName(item.uomId),
      status: item.activeFlag ? "Active" : "Inactive"
    }));
  }, [items, pagination.offset, uomList]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: "Item Name",
        accessor: "itemName",
      },
      {
        Header: "Assert No/Item Code",
        accessor: "itemCode",
      },
      {
        Header: "Department",
        accessor: "department",
      },
      {
        Header: "Item Category",
        accessor: "itemCategory",
      },
      {
        Header: "HSN Code",
        accessor: "hsnCode",
      },
      {
        Header: "UOM",
        accessor: "uomName",
      },
    
    ],
    [uomList],
  )

  const handleAdd = () => {
    navigate("/masters/item-master")
  }

  const handleEdit = (item: any) => {
    navigate("/masters/item-master", { state: { item } })
  }

  const handleDelete = (item: any) => {
    setCurrentItem(item)
    setIsDeleteModalOpen(true)
  }

  const handleView = (item: any) => {
    setCurrentItem(item)
    setIsViewModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentItem?.id) return

    try {
      await dispatch(deleteItemMaster(currentItem.id)).unwrap()
      resetPage()
      await dispatch(getAllItemMasters({ fetchAll: true }))
    } catch (error) {
      console.error(error)
    }

    setIsDeleteModalOpen(false)
    setCurrentItem(null)
  }

  return (
    // <div>
      <div className="p-6 pt-16">
        <DataTable
          columns={columns}
          data={processedItemList}
          title="Item Master"
          onAdd={handleAdd}
          onEdit={handleEdit}
          // onDelete={handleDelete}
          onView={handleView}
          showActions={true}
          showColumnFilters={true}
          filterPlaceholder="Search items..."
          disableFullDataFetch={true}
        //   initialPageSize={itemsPerPage}
        //   onPageSizeChange={setItemsPerPage}
        //    totalCount={pagination?.total || 0}
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
      {/* </div> */}

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Item Details"
      >
        {currentItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Item Name</p>
                <p className="font-medium text-gray-900">{currentItem.itemName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Assert No/Item Code</p>
                <p className="font-medium text-gray-900">{currentItem.itemCode || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Department</p>
                <p className="font-medium text-gray-900">{currentItem.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Item Category</p>
                <p className="font-medium text-gray-900">{currentItem.itemCategory || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">HSN Code</p>
                <p className="font-medium text-gray-900">{currentItem.hsnCode || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">UOM</p>
                <p className="font-medium text-gray-900">{getUomName(currentItem.uomId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <p className="font-medium">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentItem.activeFlag
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {currentItem.activeFlag ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>

            {(currentItem.imageUrl || currentItem.image || currentItem.itemImage) && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 font-medium mb-2">Item Image</p>
                <div className="w-32 h-32 border border-gray-300 rounded-md overflow-hidden bg-gray-50 p-1">
                  <img
                    src={currentItem.imageUrl || currentItem.image || currentItem.itemImage}
                    alt={currentItem.itemName}
                    className="w-full h-full object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const win = window.open();
                      if (win) {
                        win.document.write(`<img src="${currentItem.imageUrl || currentItem.image || currentItem.itemImage}" style="max-width:100%;max-height:100vh;margin:auto;display:block;" />`);
                      }
                    }}
                    title="Click to view full image in new tab"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
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
          <p className="text-gray-700">Are you sure you want to delete the item "{currentItem?.itemName}"?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
