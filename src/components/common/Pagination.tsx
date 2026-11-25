import React from 'react';

// ============================================================================
// PAGINATION COMPONENT
// ============================================================================

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  variant?: 'default' | 'compact';
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  offset,
  hasNext: hasNextProp,
  hasPrev: hasPrevProp,
  onPageChange,
  variant = 'default'
}) => {
  const startItem = Math.min(offset + 1, totalItems);
  const endItem = Math.min(offset + itemsPerPage, totalItems);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Robust internal calculation to determine button availability
  const hasNext = (currentPage + 1 < totalPages);
  const hasPrev = (currentPage > 0);

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between py-3 px-4">
        <span className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrev}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end mt-6 px-4 py-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* <div className="text-sm text-gray-600">
        Showing {startItem} to {endItem} of {totalItems} results
      </div> */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <div className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700">
          Page {currentPage + 1} of {totalPages}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PAGINATION HOOK - For managing pagination state
// ============================================================================

interface UsePaginationProps {
  initialPage?: number;
  itemsPerPage?: number;
}

export const usePagination = ({
  initialPage = 0,
  itemsPerPage: initialItemsPerPage = 10
}: UsePaginationProps = {}) => {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  const handlePageChange = React.useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const resetPage = React.useCallback(() => {
    setCurrentPage(0);
  }, []);

  const updateItemsPerPage = React.useCallback((nextItemsPerPage: number) => {
    setItemsPerPage(nextItemsPerPage);
    setCurrentPage(0);
  }, []);

  const getOffset = React.useCallback(() => {
    return currentPage * itemsPerPage;
  }, [currentPage, itemsPerPage]);

  return {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage: updateItemsPerPage
  };
};

// ============================================================================
// DEMO USAGE EXAMPLES
// ============================================================================

const PaginationDemo: React.FC = () => {
  // Example 1: Basic usage with hook
  const pagination1 = usePagination({ itemsPerPage: 10 });
  
  // Example 2: Compact variant
  const pagination2 = usePagination({ itemsPerPage: 20 });

  // Mock pagination data
  const mockPaginationData = {
    total: 150,
    offset: pagination1.currentPage * pagination1.itemsPerPage,
    limit: pagination1.itemsPerPage,
    next: pagination1.currentPage < Math.ceil(150 / pagination1.itemsPerPage) - 1,
    prev: pagination1.currentPage > 0
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">Pagination Component Examples</h2>
        <p className="text-gray-600 mb-6">
          Reusable pagination components that work with your existing Redux state
        </p>
      </div>

      {/* Example 1: Default Variant */}
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Default Variant (Full)</h3>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="text-sm text-gray-600">Current Page: {pagination1.currentPage + 1}</p>
          <p className="text-sm text-gray-600">Offset: {mockPaginationData.offset}</p>
        </div>
        <Pagination
          currentPage={pagination1.currentPage}
          totalItems={mockPaginationData.total}
          itemsPerPage={pagination1.itemsPerPage}
          offset={mockPaginationData.offset}
          hasNext={mockPaginationData.next}
          hasPrev={mockPaginationData.prev}
          onPageChange={pagination1.handlePageChange}
        />
      </div>

      {/* Example 2: Compact Variant */}
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Compact Variant</h3>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="text-sm text-gray-600">Current Page: {pagination2.currentPage + 1}</p>
        </div>
        <Pagination
          currentPage={pagination2.currentPage}
          totalItems={150}
          itemsPerPage={pagination2.itemsPerPage}
          offset={pagination2.currentPage * pagination2.itemsPerPage}
          hasNext={pagination2.currentPage < Math.ceil(150 / pagination2.itemsPerPage) - 1}
          hasPrev={pagination2.currentPage > 0}
          onPageChange={pagination2.handlePageChange}
          variant="compact"
        />
      </div>

      {/* Usage Code Example */}
      <div className="border rounded-lg p-6 bg-gray-900 text-white">
        <h3 className="text-lg font-semibold mb-4">Usage Example Code</h3>
        <pre className="text-sm overflow-x-auto">
{`// In your component file:
import { Pagination, usePagination } from '@/components/common/Pagination';

export function YourListComponent() {
  const { subCategoryList, pagination } = useSelector(
    (state: RootState) => state.subCategory
  );
  
  // Initialize pagination hook
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });
  
  // Fetch data when page changes
  useEffect(() => {
    dispatch(getAllSubCategories({ 
      offset: getOffset(), 
      limit: itemsPerPage 
    }));
  }, [currentPage, dispatch]);
  
  // Reset page after add/edit/delete
  const onSubmit = async (data) => {
    await dispatch(createSubCategory(data));
    resetPage(); // Reset to page 0
    dispatch(getAllSubCategories({ 
      offset: 0, 
      limit: itemsPerPage 
    }));
  };
  
  return (
    <div>
      <DataTable ... />
      
      <Pagination
        currentPage={currentPage}
        totalItems={pagination.total}
        itemsPerPage={itemsPerPage}
        offset={pagination.offset || 0}
        hasNext={!!pagination.next}
        hasPrev={!!pagination.prev}
        onPageChange={handlePageChange}
      />
    </div>
  );
}`}
        </pre>
      </div>

      {/* Features List */}
      <div className="border rounded-lg p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-3">✨ Features</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Works seamlessly with existing Redux pagination state</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Custom hook (usePagination) manages local state</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Two variants: default (full) and compact</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>resetPage() function for after CRUD operations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Fully typed with TypeScript</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>No changes to existing code structure required</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PaginationDemo;