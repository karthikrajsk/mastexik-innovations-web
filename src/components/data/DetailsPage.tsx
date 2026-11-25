import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "@/state/store";

interface DetailsPageProps {
  // Data & State
  data: any[];
  listSelector: (state: any) => any;
  fetchAction: any;
  additionalFetchActions?: any[];
  
  // Columns
  columns: any[];
  
  // Configuration
  title: string;
  basePath: string;
  addButtonText?: string;
  filterPlaceholder?: string;
  
  // Modals
  viewModal?: {
    render: (data: any, onClose: () => void) => React.ReactNode;
  };
  deleteModal?: {
    deleteAction: (id: number) => any;
    render?: (data: any, onClose: () => void, onConfirm: () => void) => React.ReactNode;
  };
  
  // Actions
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  
  // Features
  showActions?: boolean;
  showExport?: boolean;
  showColumnFilters?: boolean;
  enableAdd?: boolean;
  
  // Custom data transformation
  transformData?: (data: any[]) => any[];
}

export function DetailsPage({
  data,
  listSelector,
  fetchAction,
  additionalFetchActions = [],
  columns,
  title,
  basePath,
  addButtonText = "Add",
  filterPlaceholder = "Search...",
  viewModal,
  deleteModal,
  onAdd,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  showExport = true,
  showColumnFilters = false,
  enableAdd = true,
  transformData
}: DetailsPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchAction({}));
    additionalFetchActions.forEach(action => {
      dispatch(action({}));
    });
  }, [dispatch, fetchAction, additionalFetchActions]);

  // Transform data if needed
  const transformedData = useMemo(() => {
    return transformData ? transformData(data) : data;
  }, [data, transformData]);

  // Default handlers
  const defaultHandleAdd = () => {
    navigate(basePath);
  };

  const defaultHandleEdit = (row: any) => {
    navigate(basePath, { state: { ...row } });
  };

  const defaultHandleView = (row: any) => {
    setCurrentItem(row);
    setIsViewModalOpen(true);
  };

  const defaultHandleDelete = (row: any) => {
    setCurrentItem(row);
    setIsDeleteModalOpen(true);
  };

  const defaultConfirmDelete = async () => {
    if (!currentItem || !deleteModal) return;
    
    try {
      await dispatch(deleteModal.deleteAction(currentItem.id)).unwrap();
      await dispatch(fetchAction({}));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
    
    setIsDeleteModalOpen(false);
  };

  // Use provided handlers or defaults
  const handleAdd = onAdd || defaultHandleAdd;
  const handleEdit = onEdit || defaultHandleEdit;
  const handleView = onView || defaultHandleView;
  const handleDelete = onDelete || defaultHandleDelete;
  const confirmDelete = defaultConfirmDelete;

  // Default delete modal render
  const defaultDeleteModalRender = (item: any, onClose: () => void, onConfirm: () => void) => (
    <div className="space-y-4">
      <p>Are you sure you want to delete this item?</p>
      <div className="flex justify-end space-x-3 pt-4">
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button onClick={onConfirm} className="btn btn-danger">Delete</button>
      </div>
    </div>
  );

  return (
    <div>
      <DataTable
        columns={columns}
        data={transformedData}
        title={title}
        onAdd={enableAdd ? handleAdd : undefined}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={showActions}
        showExport={showExport}
        filterPlaceholder={filterPlaceholder}
        showColumnFilters={showColumnFilters}
      />

      {/* View Modal */}
      {viewModal && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`View ${title}`}
          className="max-w-4xl"
        >
          {currentItem && viewModal.render(currentItem, () => setIsViewModalOpen(false))}
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirm Delete"
        >
          {currentItem && (
            deleteModal.render 
              ? deleteModal.render(currentItem, () => setIsDeleteModalOpen(false), confirmDelete)
              : defaultDeleteModalRender(currentItem, () => setIsDeleteModalOpen(false), confirmDelete)
          )}
        </Modal>
      )}
    </div>
  );
}