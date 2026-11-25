import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { 
  getAllPromotions, 
  createPromotion, 
  updatePromotion, 
  deletePromotion,
  getAllPerformance, 
  createPerformance, 
  updatePerformance, 
  deletePerformance,
  getAllInsurance,
  createInsurance,
  updateInsurance,
  deleteInsurance,
  type PromotionIncrement,
  type EmployeePerformance,
  type EmployeeInsurance
} from '@/state/employeePerformanceSlice';
import { getAllEmployeeMasters } from '@/state/employeeMasterSlice';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';
import { getAllEmployees } from '@/state/employeeSlice';

export default function EmployeeGrowthPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { promotionList, performanceList, insuranceList, loading } = useSelector((state: RootState) => state.employeePerformance);
  const { employeeList } = useSelector((state: RootState) => state.employee);
  const [activeTab, setActiveTab] = useState("promotion");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({ mode: 'onBlur' });

  const selectedEmpId = watch('employeeId');
  useEffect(() => {
    if (selectedEmpId && activeTab === 'promotion' && !current) {
        const emp = employeeList?.find((e: any) => String(e.id) === String(selectedEmpId));
        if (emp) {
            setValue('currentDesignation', emp.employmentDetails?.designation || '');
            setValue('currentSalary', emp.salaryDetails?.basicSalary || '');
        }
    }
  }, [selectedEmpId, activeTab, employeeList, setValue, current]);

  useEffect(() => {
    dispatch(getAllEmployees({ fetchAll: true }));
    if (activeTab === 'promotion') dispatch(getAllPromotions());
    if (activeTab === 'performance') dispatch(getAllPerformance());
    if (activeTab === 'insurance') dispatch(getAllInsurance());
  }, [activeTab, dispatch]);

  const employeeOptions = useMemo(() => (employeeList || [])
    .filter((emp: any) => !emp.isRelieved || emp.isRelieved === 0)
    .map((emp: { id: any; employeeName: any; employeeCode: any; }) => ({
      value: String(emp.id), label: `${emp.employeeName} (${emp.employeeCode})`
    })), [employeeList]);

  // Dynamic Columns based on Tab
  const columns = useMemo(() => {
    if (activeTab === 'promotion') return [
      { Header: 'Sl No', accessor: 'serialNo' },
      { Header: 'Emp ID', accessor: 'employeeCode' },
      { Header: 'Name', accessor: 'employeeName' },
      { Header: 'Current Designation', accessor: 'currentDesignation' },
      { Header: 'New Designation', accessor: 'newDesignation' },
      { Header: 'Current Salary', accessor: 'currentSalary' },
      { Header: 'New Salary', accessor: 'newSalary' },
      { Header: 'Effective Date', accessor: 'effectiveDate' },
    ];
    if (activeTab === 'performance') return [
      { Header: 'Sl No', accessor: 'serialNo' },
      { Header: 'Emp ID', accessor: 'employeeCode' },
      { Header: 'Name', accessor: 'employeeName' },
      { Header: 'Period', accessor: 'reviewPeriod' },
      { Header: 'Rating', accessor: 'rating' },
      { Header: 'Reviewer', accessor: 'reviewerName' },
    ];
    return [
      { Header: 'Sl No', accessor: 'serialNo' },
      { Header: 'Emp ID', accessor: 'employeeCode' },
      { Header: 'Name', accessor: 'employeeName' },
      { Header: 'Provider', accessor: 'insuranceProvider' },
      { Header: 'Policy No', accessor: 'policyNumber' },
      { Header: 'End Date', accessor: 'endDate' },
    ];
  }, [activeTab]);

  const tableData = useMemo(() => {
    const list = activeTab === 'promotion' ? promotionList : activeTab === 'performance' ? performanceList : insuranceList;
    return (list || []).map((item, index) => {
      const emp = employeeList?.find((e: { id: any; }) => String(e.id) === String(item.employeeId));
      return { 
        ...item, 
        serialNo: index + 1,
        employeeName: emp?.employeeName || 'N/A', 
        employeeCode: emp?.employeeCode || item.employeeId 
      };
    });
  }, [activeTab, promotionList, performanceList, insuranceList, employeeList]);

  const openAddModal = () => {
    setCurrent(null);
    reset({
        employeeId: '',
        currentDesignation: '',
        newDesignation: '',
        currentSalary: '',
        incrementAmount: '',
        newSalary: '',
        effectiveDate: '',
        remarks: '',
        reviewPeriod: '',
        rating: '',
        performanceComments: '',
        reviewerName: '',
        reviewDate: new Date().toISOString().split('T')[0],
        insuranceProvider: '',
        policyNumber: '',
        coverageAmount: '',
        nominee: '',
        startDate: '',
        endDate: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setCurrent(row);
    reset(row);
    setIsModalOpen(true);
  };

  const handleDelete = (row: any) => {
    if (window.confirm(`Are you sure you want to delete this ${activeTab} record?`)) {
        if (activeTab === 'promotion') dispatch(deletePromotion(row.id));
        if (activeTab === 'performance') dispatch(deletePerformance(row.id));
        if (activeTab === 'insurance') dispatch(deleteInsurance(row.id));
    }
  };

  const onSubmit = async (data: any) => {
    if (activeTab === 'promotion') {
        if (current?.id) {
            dispatch(updatePromotion({ id: current.id, data }));
        } else {
            dispatch(createPromotion(data));
        }
    } else if (activeTab === 'performance') {
        if (current?.id) {
            dispatch(updatePerformance({ id: current.id, data }));
        } else {
            dispatch(createPerformance(data));
        }
    } else if (activeTab === 'insurance') {
        if (current?.id) {
            dispatch(updateInsurance({ id: current.id, data }));
        } else {
            dispatch(createInsurance(data));
        }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
     
      <div className="flex gap-4 border-b mb-6 text-sm">
        {[
          { id: 'promotion', label: 'Promotion / Increment' },
          { id: 'performance', label: 'Employee Performance' },
          { id: 'insurance', label: 'Employee Insurance' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`pb-2 px-4 whitespace-nowrap transition-all ${
              activeTab === tab.id ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} List`}
        onAdd={openAddModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onView={(row) => { setCurrent(row); setIsViewModalOpen(true); }}
        showActions={true}
        showAddActions={true}
        showExport={true}
        loading={loading}
      />

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 md:w-1/2 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              {current?.id ? 'Edit' : 'Add'} {activeTab === 'promotion' ? 'Promotion / Increment' : activeTab === 'performance' ? 'Performance Review' : 'Insurance Policy'}
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium">Employee <span className="text-red-600">*</span></label>
                <Controller
                  name="employeeId" control={control} rules={{ required: 'Required' }}
                  render={({ field }) => <CommonSearchableSelect className="mt-1" options={employeeOptions} {...field} />}
                />
              </div>

              {activeTab === 'promotion' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm">Current Designation</label><input className="input mt-1 w-full bg-gray-50" {...register('currentDesignation')} readOnly /></div>
                  <div><label className="block text-sm">New Designation</label><input className="input mt-1 w-full" {...register('newDesignation')} /></div>
                  <div><label className="block text-sm">Current Salary</label><input type="number" className="input mt-1 w-full bg-gray-50" {...register('currentSalary')} readOnly /></div>
                  <div><label className="block text-sm">Increment Amount</label><input type="number" className="input mt-1 w-full" {...register('incrementAmount')} /></div>
                  <div><label className="block text-sm">New Salary</label><input type="number" className="input mt-1 w-full" {...register('newSalary')} /></div>
                  <div><label className="block text-sm">Effective Date</label><input type="date" className="input mt-1 w-full" {...register('effectiveDate')} /></div>
                  <div className="col-span-2"><label className="block text-sm">Remarks</label><input className="input mt-1 w-full" {...register('remarks')} /></div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm">Review Period</label><input className="input mt-1 w-full" {...register('reviewPeriod')} placeholder="e.g. Q1 2024" /></div>
                  <div><label className="block text-sm">Rating (1-5)</label><input type="number" min="1" max="5" className="input mt-1 w-full" {...register('rating')} /></div>
                  <div className="col-span-2"><label className="block text-sm">Comments</label><textarea className="input mt-1 w-full h-24" {...register('performanceComments')} /></div>
                  <div><label className="block text-sm">Reviewer Name</label><input className="input mt-1 w-full" {...register('reviewerName')} /></div>
                  <div><label className="block text-sm">Review Date</label><input type="date" className="input mt-1 w-full" {...register('reviewDate')} /></div>
                </div>
              )}

              {activeTab === 'insurance' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm">Insurance Provider</label><input className="input mt-1 w-full" {...register('insuranceProvider')} /></div>
                  <div><label className="block text-sm">Policy Number</label><input className="input mt-1 w-full" {...register('policyNumber')} /></div>
                  <div><label className="block text-sm">Coverage Amount</label><input className="input mt-1 w-full" {...register('coverageAmount')} /></div>
                  <div><label className="block text-sm">Nominee</label><input className="input mt-1 w-full" {...register('nominee')} /></div>
                  <div><label className="block text-sm">Start Date</label><input type="date" className="input mt-1 w-full" {...register('startDate')} /></div>
                  <div><label className="block text-sm">End Date</label><input type="date" className="input mt-1 w-full" {...register('endDate')} /></div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">{current?.id ? 'Update' : 'Save'} {activeTab}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`${activeTab.toUpperCase()} Details`} className="max-w-2xl">
        {current && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="font-medium">Employee:</span> {current.employeeName}</p>
            <p><span className="font-medium">Emp ID:</span> {current.employeeCode}</p>
            {activeTab === 'promotion' && (
              <>
                <p><span className="font-medium">Current Desig:</span> {current.currentDesignation}</p>
                <p><span className="font-medium">New Desig:</span> {current.newDesignation}</p>
                <p><span className="font-medium">Current Salary:</span> {current.currentSalary}</p>
                <p><span className="font-medium">New Salary:</span> {current.newSalary}</p>
                <p><span className="font-medium">Effective:</span> {current.effectiveDate}</p>
              </>
            )}
            {activeTab === 'performance' && (
              <>
                <p><span className="font-medium">Period:</span> {current.reviewPeriod}</p>
                <p><span className="font-medium">Rating:</span> {current.rating}</p>
                <p><span className="font-medium">Reviewer:</span> {current.reviewerName}</p>
                <p className="col-span-2"><span className="font-medium">Comments:</span> {current.performanceComments}</p>
              </>
            )}
            {activeTab === 'insurance' && (
              <>
                <p><span className="font-medium">Provider:</span> {current.insuranceProvider}</p>
                <p><span className="font-medium">Policy No:</span> {current.policyNumber}</p>
                <p><span className="font-medium">Amount:</span> {current.coverageAmount}</p>
                <p><span className="font-medium">End Date:</span> {current.endDate}</p>
                <p><span className="font-medium">Nominee:</span> {current.nominee}</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
