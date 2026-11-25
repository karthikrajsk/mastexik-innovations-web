import React, { useState, useMemo } from 'react';
import { Filter, X } from 'lucide-react';

export interface PopupColumn {
  Header: string | React.ReactNode;
  accessor?: string | ((row: any) => any);
  id: string;
  Cell?: (props: { row: any; value: any; index: number }) => React.ReactNode;
  disableFilters?: boolean;
}

interface PopupDataTableProps {
  columns: PopupColumn[];
  data: any[];
  emptyMessage?: string;
}

export function PopupDataTable({
  columns,
  data = [],
  emptyMessage = 'No matching rows found.',
}: PopupDataTableProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Clean and prepare columns
  const preparedColumns = useMemo(() => {
    return columns.map((col) => ({
      ...col,
      id: col.id || (typeof col.accessor === 'string' ? col.accessor : ''),
    }));
  }, [columns]);

  // Track original indexes for state consistency
  const indexedData = useMemo(() => {
    return data.map((item, originalIndex) => ({
      item,
      originalIndex,
    }));
  }, [data]);

  // Compute active column filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(columnFilters).filter((v) => v !== undefined && v !== '').length;
  }, [columnFilters]);

  // Handle individual column filter inputs
  const handleFilterChange = (colId: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [colId]: value,
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setColumnFilters({});
  };

  // Filter the data based on column filter values
  const filteredData = useMemo(() => {
    if (activeFilterCount === 0) return indexedData;

    return indexedData.filter(({ item }) => {
      return Object.entries(columnFilters).every(([colId, filterVal]) => {
        if (!filterVal) return true;

        const col = preparedColumns.find((c) => c.id === colId);
        if (!col) return true;

        let value = '';
        if (col.accessor) {
          value = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
        } else {
          value = item[colId];
        }

        return String(value ?? '').toLowerCase().includes(filterVal.toLowerCase());
      });
    });
  }, [indexedData, columnFilters, preparedColumns, activeFilterCount]);

  return (
    <div className="space-y-3">
      {/* Filters Toolbar */}
      <div className="flex items-center gap-2 flex-shrink-0 justify-end">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            showFilters
              ? 'border-transparent bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          title="Toggle Column Filters"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              showFilters ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
            title="Clear All Filters"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full border-collapse text-sm popup-table">
          <thead className="text-sm font-semibold uppercase tracking-wide text-white">
            {/* Header Labels */}
            <tr className=" border-b border-gray-200">
              {preparedColumns.map((col) => (
                <th
                  key={col.id}
                  className="p-3 border-r border-gray-200 last:border-r-0 font-semibold  text-left"
                >
                  {col.Header}
                </th>
              ))}
            </tr>
            {/* Column Filter Inputs */}
            {showFilters && (
              <tr className="bg-slate-50 border-b border-gray-200">
                {preparedColumns.map((col) => (
                  <td
                    key={`filter-${col.id}`}
                    className="p-2 border-r border-gray-200 last:border-r-0"
                  >
                    {!col.disableFilters ? (
                      <input
                        type="text"
                        value={columnFilters[col.id] || ''}
                        onChange={(e) => handleFilterChange(col.id, e.target.value)}
                        placeholder="Filter..."
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-black"
                      />
                    ) : (
                      <div className="h-6"></div>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredData.length > 0 ? (
              filteredData.map(({ item, originalIndex }) => (
                <tr
                  key={originalIndex}
                  className={`hover:bg-slate-50 transition-colors ${
                    item.selected ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {preparedColumns.map((col) => {
                    const cellValue = col.accessor
                      ? typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : item[col.accessor]
                      : item[col.id];

                    return (
                      <td
                        key={col.id}
                        className="p-3 border-r border-gray-200 last:border-r-0 text-gray-800"
                      >
                        {col.Cell
                          ? col.Cell({ row: item, value: cellValue, index: originalIndex })
                          : String(cellValue ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={preparedColumns.length}
                  className="p-8 text-center text-gray-400 italic bg-gray-50/50"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
