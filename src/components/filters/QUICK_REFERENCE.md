# Column Filters - Quick Reference Card

## 🚀 Quick Start

```typescript
// 1. Import filters
import { DateRangeFilter, dateRangeFilterFn, TextFilter, NumberRangeFilter, numberRangeFilterFn } from "@/components/filters";

// 2. Add to columns
const columns = [
  {
    Header: 'Date',
    accessor: 'date',
    Filter: DateRangeFilter,
    filter: dateRangeFilterFn
  }
];

// 3. Enable in DataTable
<DataTable columns={columns} data={data} showColumnFilters={true} />
```

## 📋 Filter Types Cheat Sheet

| Filter Type | Import | Use Case | Example |
|------------|--------|----------|---------|
| **DateRangeFilter** | `DateRangeFilter, dateRangeFilterFn` | Date columns | Order Date, Delivery Date |
| **TextFilter** | `TextFilter` | Text columns | Name, Code, Description |
| **NumberRangeFilter** | `NumberRangeFilter, numberRangeFilterFn` | Number columns | Quantity, Amount, Price |
| **SelectFilter** | `SelectFilter` | Dropdown options | Status, Category, Type |
| **BooleanFilter** | `BooleanFilter` | Active/Inactive | activeFlag, isActive |

## 💡 Common Patterns

### Date Column with Filter
```typescript
{
  Header: 'Order Date',
  accessor: 'orderDate',
  Cell: ({ value }) => formatDate(value),
  Filter: DateRangeFilter,
  filter: dateRangeFilterFn
}
```

### Text Column with Filter
```typescript
{
  Header: 'Customer Name',
  accessor: 'customerName',
  Filter: TextFilter
}
```

### Number Column with Filter
```typescript
{
  Header: 'Quantity',
  accessor: 'quantity',
  Filter: NumberRangeFilter,
  filter: numberRangeFilterFn
}
```

### Status Column with Filter
```typescript
{
  Header: 'Status',
  accessor: 'status',
  Filter: SelectFilter
}
```

### Boolean Column with Filter
```typescript
{
  Header: 'Active',
  accessor: 'activeFlag',
  Cell: ({ value }) => value ? 'Active' : 'Inactive',
  Filter: BooleanFilter,
  filter: (rows, columnIds, filterValue) => {
    if (!filterValue) return rows;
    return rows.filter(row => String(row.values[columnIds[0]]) === filterValue);
  }
}
```

### Disable Filter for Column
```typescript
{
  Header: "S.No",
  Cell: ({ row }) => row.index + 1,
  disableFilters: true
}
```

## ⚡ One-Line Import

```typescript
import { DateRangeFilter, dateRangeFilterFn, TextFilter, NumberRangeFilter, numberRangeFilterFn, SelectFilter, BooleanFilter } from "@/components/filters";
```

## ✅ Checklist for Adding Filters

- [ ] Import filter components at the top
- [ ] Add `Filter` property to column definition
- [ ] Add `filter` function for custom filters (DateRange, NumberRange)
- [ ] Set `showColumnFilters={true}` on DataTable
- [ ] Test filtering with sample data
- [ ] Verify filters work with pagination and sorting

## 🎯 Real-World Examples

See these files for complete implementations:
- `src/pages/transaction/sales-order-details.tsx`
- `src/pages/transaction/purchase-order-details.tsx`

## 📚 Full Documentation

For detailed information, see:
- `COLUMN_FILTERS_USAGE_GUIDE.md` - Complete usage guide
- `src/components/filters/README.md` - Component API reference
- `FILTER_COMPONENTS_MIGRATION.md` - Migration history

---

**Pro Tip**: Copy column definitions from existing migrated pages and modify the accessor and header names!