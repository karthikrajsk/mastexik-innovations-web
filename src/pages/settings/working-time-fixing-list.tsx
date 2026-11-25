import React, { useState } from 'react';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmployeeShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftName: string;
  effectiveFrom: string;
  department?: string;
  status?: 'Active' | 'Inactive';
}

export default function WorkingTimeFixingList() {
  const navigate = useNavigate();

  // Empty data
  const [assignments] = useState<EmployeeShiftAssignment[]>([]);

  // Table Columns
  const columns = [
    {
      Header: 'Employee ID',
      accessor: 'employeeId',
      Cell: ({ value }: any) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      Header: 'Employee Name',
      accessor: 'employeeName',
      Cell: ({ value }: any) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      Header: 'Shift Name',
      accessor: 'shiftName',
      Cell: ({ value }: any) => (
        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-lg">
          {value}
        </span>
      )
    },
    {
      Header: 'Effective From',
      accessor: 'effectiveFrom',
      Cell: ({ value }: any) => (
        <span className="text-gray-600">{value}</span>
      )
    },
    {
      Header: 'Department',
      accessor: 'department',
      Cell: ({ value }: any) => (
        <span className="text-gray-600">{value || '-'}</span>
      )
    },
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ value }: any) => (
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            value === 'Active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value || 'Active'}
        </span>
      )
    }
  ];

  const handleAdd = () => {
    navigate('/settings/working-time-fixing');
  };

  const handleEdit = (row: any) => {
    navigate('/settings/working-time-fixing', { state: { assignment: row } });
  };

  const handleDelete = (id: string) => {
    console.log('Delete ID:', id);
  };

  return (
    <div className="p-6 pt-16">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Working Time Fixing
          </h1>
          <p className="text-gray-600">
            Manage employee shift assignments
          </p>
        </div>

        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Table */}
      <Card className="p-6">
        <DataTable
          columns={columns}
          data={[]}  // Empty data → Only headers shown
          title="Employee Shift Assignments"
          showActions={true}
          renderActions={(row: any) => (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(row)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(row.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        />
      </Card>

    </div>
  );
}