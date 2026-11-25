// Common column filter components for DataTable
// These can be used in columns definition for showColumnFilters functionality

import React from 'react';

// Date Range Filter Component
export function DateRangeFilter({ column: { filterValue = {}, setFilter } }: any) {
  return (
    <div className="flex space-x-2">
      <input
        type="date"
        value={filterValue.from || ''}
        onChange={e => setFilter({ ...filterValue, from: e.target.value })}
        placeholder="From"
        className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <input
        type="date"
        value={filterValue.to || ''}
        onChange={e => setFilter({ ...filterValue, to: e.target.value })}
        placeholder="To"
        className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

// Text Filter Component (default one, can be customized)
export function TextFilter({ column: { filterValue, preFilteredRows, setFilter } }: any) {
  const count = preFilteredRows.length;

  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      placeholder={`Filter...`}
      className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
    />
  );
}

// Number Range Filter Component
export function NumberRangeFilter({ column: { filterValue = {}, setFilter } }: any) {
  return (
    <div className="flex space-x-2">
      <input
        type="number"
        value={filterValue.min || ''}
        onChange={e => setFilter({ ...filterValue, min: e.target.value })}
        placeholder="Min"
        className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <input
        type="number"
        value={filterValue.max || ''}
        onChange={e => setFilter({ ...filterValue, max: e.target.value })}
        placeholder="Max"
        className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

// Select Filter Component for predefined options
export function SelectFilter({ column: { filterValue, setFilter, preFilteredRows, id } }: any) {
  // Calculate options from preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set();
    if (preFilteredRows && Array.isArray(preFilteredRows)) {
      preFilteredRows.forEach((row: any) => {
        const value = row.values ? row.values[id] : row[id];
        if (value != null && value !== '') {
          options.add(value);
        }
      });
    }
    return [...options.values()].sort();
  }, [id, preFilteredRows]);

  return (
    <select
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
      className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
    >
      <option value="">All</option>
      {options.map((option: any, i: number) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

// Boolean Filter Component
export function BooleanFilter({ column: { filterValue, setFilter } }: any) {
  return (
    <select
      value={filterValue || ''}
      onChange={e => {
        const value = e.target.value;
        setFilter(value === '' ? undefined : value);
      }}
      className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-900 bg-white"
    >
      <option value="" className="text-gray-900 bg-white">All</option>
      <option value="true" className="text-gray-900 bg-white">Active</option>
      <option value="false" className="text-gray-900 bg-white">Inactive</option>
    </select>
  );
}

// Custom filter function for date range filtering
// This should be used with the DateRangeFilter component
export function dateRangeFilterFn(rows: any[], columnIds: string[], filterValue: any) {
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

// Custom filter function for number range filtering
// This should be used with the NumberRangeFilter component
export function numberRangeFilterFn(rows: any[], columnIds: string[], filterValue: any) {
  if (!filterValue || (!filterValue.min && !filterValue.max)) return rows;
  return rows.filter(row => {
    const value = row.values[columnIds[0]];
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return true;
    if (filterValue.min && numValue < parseFloat(filterValue.min)) return false;
    if (filterValue.max && numValue > parseFloat(filterValue.max)) return false;
    return true;
  });
}