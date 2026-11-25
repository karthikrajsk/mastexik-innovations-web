import { useState } from 'react';

export function usePagination(defaultPageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPageSize);

  const getOffset = () => currentPage * itemsPerPage;

  const resetPage = () => setCurrentPage(0);

  const setPage = (page: number) => setCurrentPage(page);

  return {
    currentPage,
    setPage,
    getOffset,
    itemsPerPage,
    setItemsPerPage,
    resetPage,
  };
}
