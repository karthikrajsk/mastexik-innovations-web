import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { 
  getAllEmployeeMasters, 
  createEmployeeMaster, 
  updateEmployeeMaster, 
  deleteEmployeeMaster, 
  type EmployeeMaster 
} from '@/state/employeeMasterSlice';
import { DataTable } from '@/components/data/DataTable';
import { Pagination, usePagination } from '@/components/common/Pagination';

type EmployeeMasterFormData = Omit<EmployeeMaster, 'id'> & { id?: number };

export default function EmployeeMasterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { employeeMasterList, loading, pagination } = useSelector((state: RootState) => state.employeeMaster);
  const { currentPage, itemsPerPage, setItemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<EmployeeMaster | null>(null);
  const [activeTab, setActiveTab] = useState("personal");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<EmployeeMasterFormData>({
    mode: 'onChange',
    defaultValues: {
      gender: '',
      maritalStatus: '',
      employmentDetails: {
        employeeType: '',
        status: 'Active',
      },
      pfApplicable: false,
      esiApplicable: false,
      salaryDetails: {
        salaryType: '',
      },
      shiftDetails: {
        overtimeAllowed: false,
      },
    },
  });

  useEffect(() => {
    dispatch(getAllEmployeeMasters({ offset: getOffset(), limit: itemsPerPage }));
  }, [currentPage, dispatch, itemsPerPage, getOffset]);

  const columns = useMemo(() => [
    { Header: 'Sl No', accessor: 'serialNo' },
    { Header: 'Emp ID', accessor: 'employeeCode' },
    { Header: 'Employee Name', accessor: 'employeeName' },
    { Header: 'Department', accessor: 'employmentDetails.department' },
    { Header: 'Designation', accessor: 'employmentDetails.designation' },
    { Header: 'Mobile', accessor: 'mobileNumber' },
    { Header: 'Status', accessor: 'employmentDetails.status' },
  ], []);

  const employeesWithSerial = useMemo(() => {
    return (employeeMasterList || []).map((emp, index) => ({
      ...emp,
      serialNo: getOffset() + index + 1
    }));
  }, [employeeMasterList, getOffset]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrent(null);
    reset({
      employeeCode: '',
      employeeName: '',
      gender: '',
      dob: '',
      fatherHusbandName: '',
      mobileNumber: '',
      email: '',
      address: '',
      aadhaarNumber: '',
      panNumber: '',
      maritalStatus: '',
      uanNumber: '',
      pfNumber: '',
      pfJoiningDate: '',
      esiNumber: '',
      pfApplicable: false,
      esiApplicable: false,
      employmentDetails: {
        department: '',
        designation: '',
        joiningDate: '',
        employeeType: '',
        status: 'Active',
      },
      salaryDetails: {
        salaryStructure: '',
        salaryType: '',
        basicSalary: 0,
        hra: 0,
        conveyanceAllowance: 0,
        medicalAllowance: 0,
        specialAllowance: 0,
        incentive: 0,
      },
      shiftDetails: {
        shiftName: '',
        shiftCode: '',
        shiftStartTime: '',
        shiftEndTime: '',
        breakStartTime: '',
        breakEndTime: '',
        totalWorkingHours: 0,
        weeklyOffDay: '',
        overtimeAllowed: false,
        lateEntryAllowedMinutes: 0,
        shiftEffectiveFrom: '',
      },
      bankDetails: {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
      },
    });
    setActiveTab("personal");
    setIsModalOpen(true);
  };

  const onEditRow = (row: EmployeeMaster) => {
    setIsEditing(true);
    setCurrent(row);
    reset(row);
    setActiveTab("personal");
    setIsModalOpen(true);
  };

  const onSubmit = async (data: EmployeeMasterFormData) => {
    if (isEditing && current?.id) {
      await dispatch(updateEmployeeMaster({ ...data, id: current.id } as EmployeeMaster));
    } else {
      await dispatch(createEmployeeMaster(data));
      resetPage();
    }
    dispatch(getAllEmployeeMasters({ offset: isEditing ? getOffset() : 0, limit: itemsPerPage }));
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={employeesWithSerial}
        title="Employee Master"
        onAdd={openAddModal}
        onEdit={onEditRow}
        showActions={true}
        showAddActions={true}
        showExport={true}
        filterPlaceholder="Search employees..."
        initialPageSize={itemsPerPage}
        onPageSizeChange={setItemsPerPage}
        totalCount={pagination?.total || 0}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={getOffset()}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      />

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              {isEditing ? 'Edit Employee Master' : 'Add Employee Master'}
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                </svg>
              </button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex gap-6 border-b mb-6 overflow-x-auto">
                {["personal", "employment", "salary", "shift", "bank"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`pb-2 px-2 transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? "border-b-2 border-blue-500 text-blue-600 font-bold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Details
                  </button>
                ))}
              </div>

              <div>
                {activeTab === "personal" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employee ID (Auto)</label>
                        <input className="input mt-1 w-full bg-gray-50" {...register('employeeCode')} placeholder="Auto Generated" readOnly />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employee Name <span className="text-red-600">*</span></label>
                        <input className="input mt-1 w-full" {...register('employeeName', { required: 'Required' })} />
                        {errors.employeeName && <span className="text-red-500 text-xs">{errors.employeeName.message}</span>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <select className="input mt-1 w-full" {...register('gender')}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input type="date" className="input mt-1 w-full" {...register('dob')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Father / Husband Name</label>
                        <input className="input mt-1 w-full" {...register('fatherHusbandName')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile Number <span className="text-red-600">*</span></label>
                        <input className="input mt-1 w-full" {...register('mobileNumber', { required: 'Required' })} />
                        {errors.mobileNumber && <span className="text-red-500 text-xs">{errors.mobileNumber.message}</span>}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input className="input mt-1 w-full" {...register('address')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                        <select className="input mt-1 w-full" {...register('maritalStatus')}>
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">PF Number</label>
                        <input className="input mt-1 w-full" {...register('pfNumber', {
                          validate: (value) => {
                            if (!value) return true;
                            const exists = employeeMasterList.some(emp => emp.pfNumber === value && emp.id !== current?.id);
                            return exists ? 'PF Number already exists' : true;
                          }
                        })} />
                        {errors.pfNumber && <span className="text-red-500 text-xs">{errors.pfNumber.message}</span>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">PF Joining Date</label>
                        <input type="date" className="input mt-1 w-full" {...register('pfJoiningDate')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ESI Number</label>
                        <input className="input mt-1 w-full" {...register('esiNumber', {
                          validate: (value) => {
                            if (!value) return true;
                            const exists = employeeMasterList.some(emp => emp.esiNumber === value && emp.id !== current?.id);
                            return exists ? 'ESI Number already exists' : true;
                          }
                        })} />
                        {errors.esiNumber && <span className="text-red-500 text-xs">{errors.esiNumber.message}</span>}
                      </div>
                      <div className="flex items-center space-x-2 mt-8">
                        <input type="checkbox" id="pfApplicable" {...register('pfApplicable')} className="h-4 w-4" />
                        <label htmlFor="pfApplicable" className="text-sm font-medium text-gray-700">PF Applicable</label>
                      </div>
                      <div className="flex items-center space-x-2 mt-8">
                        <input type="checkbox" id="esiApplicable" {...register('esiApplicable')} className="h-4 w-4" />
                        <label htmlFor="esiApplicable" className="text-sm font-medium text-gray-700">ESI Applicable</label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "employment" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <input className="input mt-1 w-full" {...register('employmentDetails.department')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Designation</label>
                        <input className="input mt-1 w-full" {...register('employmentDetails.designation')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                        <input type="date" className="input mt-1 w-full" {...register('employmentDetails.joiningDate')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employee Type</label>
                        <select className="input mt-1 w-full" {...register('employmentDetails.employeeType')}>
                          <option value="">Select Type</option>
                          <option value="Permanent">Permanent</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select className="input mt-1 w-full" {...register('employmentDetails.status')}>
                          <option value="Active">Active</option>
                          <option value="Relieved">Relieved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "salary" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Salary Structure</label>
                        <input className="input mt-1 w-full" {...register('salaryDetails.salaryStructure')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Salary Type</label>
                        <select className="input mt-1 w-full" {...register('salaryDetails.salaryType')}>
                          <option value="">Select Type</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Daily">Daily</option>
                          <option value="Hourly">Hourly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.basicSalary')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">HRA</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.hra')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Conveyance Allowance</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.conveyanceAllowance')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Medical Allowance</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.medicalAllowance')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Special Allowance</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.specialAllowance')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Incentive</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.incentive')} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "shift" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Shift Name</label>
                        <select className="input mt-1 w-full" {...register('shiftDetails.shiftName')}>
                          <option value="">Select Shift</option>
                          <option value="Day Shift">Day Shift</option>
                          <option value="Night Shift">Night Shift</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Shift Code</label>
                        <input className="input mt-1 w-full" {...register('shiftDetails.shiftCode')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Shift Start Time</label>
                        <input type="time" className="input mt-1 w-full" {...register('shiftDetails.shiftStartTime')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Shift End Time</label>
                        <input type="time" className="input mt-1 w-full" {...register('shiftDetails.shiftEndTime')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Break Start Time</label>
                        <input type="time" className="input mt-1 w-full" {...register('shiftDetails.breakStartTime')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Break End Time</label>
                        <input type="time" className="input mt-1 w-full" {...register('shiftDetails.breakEndTime')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Working Hours</label>
                        <input type="number" className="input mt-1 w-full" {...register('shiftDetails.totalWorkingHours')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Weekly Off Day</label>
                        <select className="input mt-1 w-full" {...register('shiftDetails.weeklyOffDay')}>
                          <option value="">Select Day</option>
                          <option value="Sunday">Sunday</option>
                          <option value="Monday">Monday</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 mt-8">
                        <input type="checkbox" id="overtimeAllowed" {...register('shiftDetails.overtimeAllowed')} className="h-4 w-4" />
                        <label htmlFor="overtimeAllowed" className="text-sm font-medium text-gray-700">Overtime Allowed</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Late Entry Allowed (Mins)</label>
                        <input type="number" className="input mt-1 w-full" {...register('shiftDetails.lateEntryAllowedMinutes')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Effective From Date</label>
                        <input type="date" className="input mt-1 w-full" {...register('shiftDetails.shiftEffectiveFrom')} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "bank" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input className="input mt-1 w-full" {...register('bankDetails.bankName')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <input className="input mt-1 w-full" {...register('bankDetails.accountNumber')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                        <input className="input mt-1 w-full" {...register('bankDetails.ifscCode')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                        <input className="input mt-1 w-full" {...register('bankDetails.branchName')} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary" disabled={loading || !isValid}>
                  {loading ? 'Processing...' : isEditing ? 'Update Employee' : 'Save Employee'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
