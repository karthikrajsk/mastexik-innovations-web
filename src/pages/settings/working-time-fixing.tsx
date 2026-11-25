import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CommonSearchableSelect, { CommonSearchableSelectOption } from '@/components/ui/CommonSearchableSelect';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Plus, Trash2, Clock, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// JSON Configuration for the dynamic form
const formConfig = {
  sections: [
    {
      title: "Shift Setup",
      fields: [
        { label: "Shift Name", name: "shiftName", type: "text", placeholder: "Enter shift name", required: true },
        { label: "Shift Type", name: "shiftType", type: "select", options: ["First Shift / Day Shift", "Night Shift / Overnight"] },
        { label: "Shift Start Time", name: "startTime", type: "time", required: true },
        { label: "Shift End Time", name: "endTime", type: "time", required: true },
        { label: "Break Time", name: "breakTime", type: "time" },
        { label: "Weekly Off", name: "weeklyOff", type: "select", options: ["Sunday", "Saturday", "Friday", "Thursday", "Wednesday", "Tuesday", "Monday"] }
      ]
    },
    {
      title: "Employee Shift Assignment",
      fields: [
        { label: "Employee ID", name: "employeeId", type: "text", placeholder: "Enter employee ID", required: true },
        {
          label: "Employee Name", name: "employeeName", type: "select",
          options: ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Williams", "Robert Brown", "Emily Davis", "David Wilson", "Lisa Anderson", "James Taylor", "Mary Thomas"]
        },
        { label: "Shift Name", name: "shiftName", type: "select", options: ["Morning Shift", "Evening Shift", "Night Shift", "General Shift", "Flexible Shift"] },
        { label: "Department", name: "department", type: "select", options: ["Production", "Quality", "Maintenance", "Administration", "Finance", "HR", "Sales", "Purchase"] },
        { label: "Effective From", name: "effectiveFrom", type: "date", required: true }
      ]
    }
  ]
};

interface FormData {
  [key: string]: any;
}

interface ShiftData {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakTime?: string;
  weeklyOff?: string;
}

interface AssignmentData {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftName: string;
  department: string;
  effectiveFrom: string;
}

export default function WorkingTimeFixing() {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<FormData>();

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => { setSuccessMessage(''); setErrorMessage(''); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const renderField = (field: any) => {
    const base = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
    switch (field.type) {
      case 'text':
        return <Input {...register(field.name, { required: field.required ? `${field.label} is required` : false })} placeholder={field.placeholder} className={base} />;
      
      case 'time':
        return <Input type="time" {...register(field.name, { required: field.required ? `${field.label} is required` : false })} className={base} />;
      
      case 'date':
        return <Input type="date" {...register(field.name, { required: field.required ? `${field.label} is required` : false })} className={base} />;
      
      case 'select':
        const opts: CommonSearchableSelectOption[] = (field.options || []).map((o: string) => ({ id: o, label: o, value: o }));
        return (
          <CommonSearchableSelect
            options={opts}
            value={watch(field.name) || ''}
            onValueChange={(v) => setValue(field.name, v)}
            placeholder={`Select ${field.label.toLowerCase()}`}
            className="w-full"
          />
        );
      
      default:
        return <Input {...register(field.name)} className={base} />;
    }
  };

  const onSubmitShift = (data: FormData) => {
    setShifts([...shifts, { id: Date.now().toString(), shiftName: data.shiftName || '', startTime: data.startTime || '', endTime: data.endTime || '', breakTime: data.breakTime, weeklyOff: data.weeklyOff }]);
    setSuccessMessage('Shift created successfully!');
    reset();
  };

  const onSubmitAssignment = (data: FormData) => {
    setAssignments([...assignments, { 
      id: Date.now().toString(), 
      employeeId: data.employeeId || '', 
      employeeName: data.employeeName || '', 
      shiftName: data.shiftName || '', 
      department: data.department || '',
      effectiveFrom: data.effectiveFrom || '' 
    }]);
    setSuccessMessage('Employee shift assigned successfully!');
    reset();
  };

  const handleCancel = () => {
    navigate('/settings/working-time-fixing-list');
  };

  return (
    <div className="p-6 pt-16">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button onClick={handleCancel} variant="outline">
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800 ps-5">Working Time Fixing</h1>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {errorMessage && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Setup Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Shift Setup</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmitShift)} className="space-y-4">
            {formConfig.sections[0].fields.map((field, index) => (
              <div key={index}>
                <Label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
                {errors[field.name] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message as string}</p>
                )}
              </div>
            ))}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Shift
              </button>
            </div>
          </form>
        </div>

        {/* Employee Shift Assignment Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Employee Shift Assignment</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmitAssignment)} className="space-y-4">
            {formConfig.sections[1].fields.map((field, index) => (
              <div key={index}>
                <Label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
                {errors[field.name] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message as string}</p>
                )}
              </div>
            ))}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Assign Shift
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Data Display Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Existing Shifts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Existing Shifts</h3>
            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
              {shifts.length} items
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {shifts.length > 0 ? (
              shifts.map((shift) => (
                <div key={shift.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{shift.shiftName}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {shift.startTime} - {shift.endTime}
                        {shift.breakTime && ` (Break: ${shift.breakTime})`}
                      </p>
                      {shift.weeklyOff && (
                        <p className="text-sm text-gray-500 mt-1">Weekly Off: {shift.weeklyOff}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShifts(shifts.filter(s => s.id !== shift.id))}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No shifts created yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Assignments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Current Assignments</h3>
            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
              {assignments.length} items
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <div key={assignment.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="font-medium text-gray-900 mr-2">{assignment.employeeName}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">ID: {assignment.employeeId}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Shift: {assignment.shiftName}</p>
                      <p className="text-sm text-gray-600 mb-1">Department: {assignment.department}</p>
                      <p className="text-sm text-gray-500">From: {assignment.effectiveFrom}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignments(assignments.filter(a => a.id !== assignment.id))}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No assignments made yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
