# Column Filters

This directory contains reusable filter components for DataTable column filtering.

## Available Filters

### DateRangeFilter
Provides two date inputs for filtering date ranges.
```tsx
import { DateRangeFilter } from '@/components/filters';

const columns = [
  {
    Header: 'Date',
    accessor: 'date',
    Filter: DateRangeFilter,
    filter: (rows, columnIds, filterValue) => {
      // Custom filter logic for date ranges
    }
  }
];
```

### TextFilter
Basic text input filter (similar to default).
```tsx
import { TextFilter } from '@/components/filters';

const columns = [
  {
    Header: 'Name',
    accessor: 'name',
    Filter: TextFilter
  }
];
```

### NumberRangeFilter
Provides min/max inputs for number ranges.
```tsx
import { NumberRangeFilter } from '@/components/filters';

const columns = [
  {
    Header: 'Quantity',
    accessor: 'quantity',
    Filter: NumberRangeFilter
  }
];
```

### SelectFilter
Dropdown filter that automatically generates options from column data.
```tsx
import { SelectFilter } from '@/components/filters';

const columns = [
  {
    Header: 'Status',
    accessor: 'status',
    Filter: SelectFilter
  }
];
```

### BooleanFilter
Dropdown filter for boolean values (Active/Inactive).
```tsx
import { BooleanFilter } from '@/components/filters';

const columns = [
  {
    Header: 'Active',
    accessor: 'activeFlag',
    Filter: BooleanFilter
  }
];
```

## Usage in DataTable

To enable column filters in your DataTable component:

```tsx
<DataTable
  columns={columns}
  data={data}
  title="My Table"
  showColumnFilters={true}
  // ... other props
/>
```

## Custom Filter Functions

For complex filters like DateRangeFilter and NumberRangeFilter, we provide pre-built filter functions:

### dateRangeFilterFn
Use with DateRangeFilter for date range filtering:

```tsx
import { DateRangeFilter, dateRangeFilterFn } from '@/components/filters';

const columns = [
  {
    Header: 'Order Date',
    accessor: 'orderDate',
    Filter: DateRangeFilter,
    filter: dateRangeFilterFn
  }
];
```

### numberRangeFilterFn
Use with NumberRangeFilter for number range filtering:

```tsx
import { NumberRangeFilter, numberRangeFilterFn } from '@/components/filters';

const columns = [
  {
    Header: 'Quantity',
    accessor: 'quantity',
    Filter: NumberRangeFilter,
    filter: numberRangeFilterFn
  }
];
```

## Complete Example

Here's a complete example showing how to use multiple filters:

```tsx
import { useMemo } from 'react';
import { DataTable } from '@/components/data/DataTable';
import { 
  DateRangeFilter, 
  dateRangeFilterFn,
  NumberRangeFilter,
  numberRangeFilterFn,
  SelectFilter,
  BooleanFilter 
} from '@/components/filters';

export function MyDetailsPage() {
  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'id',
        Cell: ({ row }) => row.index + 1,
        disableFilters: true
      },
      {
        Header: 'Order Date',
        accessor: 'orderDate',
        Cell: ({ value }) => {
          const date = new Date(value);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        Filter: DateRangeFilter,
        filter: dateRangeFilterFn
      },
      {
        Header: 'Order No',
        accessor: 'orderNo'
        // Uses default text filter
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
        Filter: NumberRangeFilter,
        filter: numberRangeFilterFn
      },
      {
        Header: 'Status',
        accessor: 'status',
        Filter: SelectFilter
      },
      {
        Header: 'Active',
        accessor: 'activeFlag',
        Filter: BooleanFilter,
        Cell: ({ value }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? "Active" : "Inactive"}
          </span>
        )
      }
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      title="My Details"
      showColumnFilters={true}
      filterPlaceholder="Search..."
    />
  );
}
```

## Notes

- All filters are styled consistently with the application theme
- Date filters expect date values in YYYY-MM-DD format for proper filtering
- Number filters automatically handle non-numeric values
- Select and Boolean filters automatically generate options from the data
- Use `disableFilters: true` on columns where filtering doesn't make sense (like row numbers)