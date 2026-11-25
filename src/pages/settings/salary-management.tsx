import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { 
  getAllSalaryFixing,
  getAllSalaryCalculations,
  getAllSalaryProjected,
  getAllSalaryPayments,
  getAllBonusCalculations,
  createSalaryFixing,
  createSalaryPayment,
  createBonusCalculation,
  type SalaryFixing,
  type SalaryProjected,
  type SalaryCalculation,
  type SalaryPayment,
  type BonusCalculation
} from '@/state/salarySlice';
import { getAllEmployeeMasters } from '@/state/employeeMasterSlice';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { usePagination } from '@/components/common/Pagination';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';
import { DollarSign, Calculator, FileText, CreditCard, Award, TrendingUp, Printer, Download, Eye } from 'lucide-react';

export default function SalaryManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { salaryFixingList, calculationsList, projectedList, paymentsList, bonusList, loading } = useSelector((state: RootState) => state.salary);
  const { employeeMasterList } = useSelector((state: RootState) => state.employeeMaster);
  
  const [activeTab, setActiveTab] = useState("fixing");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPayslipPreviewOpen, setIsPayslipPreviewOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({ mode: 'onBlur' });

  useEffect(() => {
    dispatch(getAllEmployeeMasters({ fetchAll: true }));
    // if (activeTab === 'fixing') dispatch(getAllSalaryFixing());
    // if (activeTab === 'calculations') dispatch(getAllSalaryCalculations());
    // if (activeTab === 'projected') dispatch(getAllSalaryProjected());
    // if (activeTab === 'payments') dispatch(getAllSalaryPayments());
    // if (activeTab === 'bonus') dispatch(getAllBonusCalculations());
  }, [activeTab, dispatch]);

  const employeeOptions = useMemo(() => (employeeMasterList || []).map(emp => ({
    value: String(emp.id), label: `${emp.employeeName} (${emp.employeeCode})`
  })), [employeeMasterList]);

  // Tab Definitions
  const tabs = [
    { id: 'fixing', label: 'Salary Fixing', icon: DollarSign },
    { id: 'projected', label: 'Salary Projected', icon: TrendingUp },
    { id: 'calculations', label: 'Salary Calculations', icon: Calculator },
    { id: 'payslip', label: 'Payslip', icon: FileText },
    { id: 'payments', label: 'Salary Payments', icon: CreditCard },
    { id: 'bonus', label: 'Bonus Calculation', icon: Award },
  ];

  // Dynamic Columns
  const columns = useMemo(() => {
    switch (activeTab) {
      case 'fixing': return [
        { Header: 'Emp ID', accessor: 'employeeCode' },
        { Header: 'Name', accessor: 'employeeName' },
        { Header: 'Basic', accessor: 'basicSalary' },
        { Header: 'HRA', accessor: 'hra' },
        { Header: 'Effective', accessor: 'effectiveDate' },
      ];
      case 'projected': return [
        { Header: 'Month', accessor: 'month' },
        { Header: 'Name', accessor: 'employeeName' },
        { Header: 'Est. Days', accessor: 'estimatedWorkingDays' },
        { Header: 'Est. Salary', accessor: 'estimatedSalary' },
      ];
      case 'calculations': return [
        { Header: 'Month', accessor: 'month' },
        { Header: 'Name', accessor: 'employeeName' },
        { Header: 'Gross', accessor: 'grossSalary' },
        { Header: 'Deductions', accessor: 'totalDeductions' },
        { Header: 'Net', accessor: 'netSalary' },
      ];
      case 'payments': return [
        { Header: 'Month', accessor: 'month' },
        { Header: 'Name', accessor: 'employeeName' },
        { Header: 'Net Paid', accessor: 'netSalary' },
        { Header: 'Date', accessor: 'paymentDate' },
        { Header: 'Mode', accessor: 'paymentMode' },
      ];
      case 'bonus': return [
        { Header: 'Year', accessor: 'financialYear' },
        { Header: 'Name', accessor: 'employeeName' },
        { Header: 'Basic', accessor: 'basicSalary' },
        { Header: 'Bonus Amt', accessor: 'bonusAmount' },
        { Header: 'Pay Date', accessor: 'paymentDate' },
      ];
      default: return [];
    }
  }, [activeTab]);

  const tableData = useMemo(() => {
    let list: any[] = [];
    if (activeTab === 'fixing') list = salaryFixingList;
    if (activeTab === 'calculations') list = calculationsList;
    if (activeTab === 'projected') list = projectedList;
    if (activeTab === 'payments') list = paymentsList;
    if (activeTab === 'bonus') list = bonusList;
    
    return (list || []).map(item => {
      const emp = employeeMasterList?.find(e => String(e.id) === String(item.employeeId));
      return { ...item, employeeName: emp?.employeeName || 'N/A', employeeCode: emp?.employeeCode || item.employeeId };
    });
  }, [activeTab, salaryFixingList, calculationsList, projectedList, paymentsList, bonusList, employeeMasterList]);

  const openAddModal = () => {
    reset({});
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    if (activeTab === 'fixing') await dispatch(createSalaryFixing(data));
    if (activeTab === 'payments') await dispatch(createSalaryPayment(data));
    if (activeTab === 'bonus') await dispatch(createBonusCalculation(data));
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Salary Management</h1>
      </div>

      {/* Standard Tab Navigation */}
      <div className="flex gap-4 border-b mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`pb-2 px-4 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'payslip' ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <h3 className="text-lg font-medium mb-6">Generate Payslip</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium mb-1">Select Employee</label>
                    <CommonSearchableSelect options={employeeOptions} onValueChange={(v) => console.log(v)} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Select Month</label>
                    <input type="month" className="input w-full" />
                </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Select criteria to preview payslip</p>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <button className="btn btn-primary flex items-center gap-2 px-8" onClick={() => setIsPayslipPreviewOpen(true)}><Eye className="w-4 h-4" /> Preview</button>
                <button className="btn btn-secondary flex items-center gap-2 text-blue-600 border-blue-100 hover:bg-blue-50"><Calculator className="w-4 h-4" /> Generate</button>
                <button className="btn btn-secondary flex items-center gap-2"><Printer className="w-4 h-4" /> Print</button>
                <button className="btn btn-secondary flex items-center gap-2 text-red-600 border-red-100 hover:bg-red-50"><Download className="w-4 h-4" /> PDF</button>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tableData}
            title={`${tabs.find(t => t.id === activeTab)?.label} Records`}
            onAdd={activeTab !== 'calculations' && activeTab !== 'projected' ? openAddModal : undefined}
            onView={(row) => { setCurrent(row); setIsViewModalOpen(true); }}
            showActions={true}
            showAddActions={activeTab !== 'calculations' && activeTab !== 'projected'}
            showExport={true}
          />
        )}
      </div>

      {/* Payslip Preview Modal */}
      <Modal isOpen={isPayslipPreviewOpen} onClose={() => setIsPayslipPreviewOpen(false)} title="Payslip Preview" className="max-w-4xl">
        <div className="p-8 border rounded-lg bg-white shadow-sm font-serif">
          <div className="text-center border-b pb-6 mb-8">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-blue-900">COMPANY NAME</h2>
            <p className="text-sm text-gray-600 mt-1">123 Industrial Estate, Sector 4, City - 560001</p>
            <h3 className="text-lg font-semibold mt-4 text-gray-800 border-t pt-4 inline-block px-8">PAYSLIP FOR THE MONTH OF MARCH 2026</h3>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-12 mb-10 text-sm">
            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Employee Name:</span> <span className="font-semibold text-gray-900">John Doe</span></div>
            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Employee ID:</span> <span className="font-semibold text-gray-900">EMP001</span></div>
            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Designation:</span> <span className="font-semibold text-gray-900">Manager</span></div>
            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Department:</span> <span className="font-semibold text-gray-900">Production</span></div>
            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">PAN Number:</span> <span className="font-semibold text-gray-900">ABCDE1234F</span></div>
            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Bank Account:</span> <span className="font-semibold text-gray-900">XXXXXXXX4567</span></div>
          </div>

          <div className="grid grid-cols-2 border rounded-lg overflow-hidden mb-8">
            <div className="border-r">
              <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 border-b">EARNINGS</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span>Basic Salary</span> <span>₹ 30,000.00</span></div>
                <div className="flex justify-between"><span>HRA</span> <span>₹ 8,000.00</span></div>
                <div className="flex justify-between"><span>Allowances</span> <span>₹ 5,000.00</span></div>
                <div className="flex justify-between"><span>Incentives</span> <span>₹ 2,000.00</span></div>
                <div className="flex justify-between font-bold pt-4 border-t mt-4"><span>GROSS EARNINGS</span> <span>₹ 45,000.00</span></div>
              </div>
            </div>
            <div>
              <div className="bg-gray-50 px-4 py-2 font-bold text-gray-700 border-b">DEDUCTIONS</div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span>Provident Fund (PF)</span> <span>₹ 1,800.00</span></div>
                <div className="flex justify-between"><span>ESI</span> <span>₹ 750.00</span></div>
                <div className="flex justify-between"><span>Professional Tax</span> <span>₹ 200.00</span></div>
                <div className="flex justify-between"><span>TDS / Income Tax</span> <span>₹ 0.00</span></div>
                <div className="flex justify-between font-bold pt-4 border-t mt-4"><span>TOTAL DEDUCTIONS</span> <span>₹ 2,750.00</span></div>
              </div>
            </div>
          </div>

          <div className="bg-blue-900 text-white p-4 rounded-lg flex justify-between items-center">
            <span className="text-lg font-semibold uppercase tracking-wider">Net Salary Payable</span>
            <span className="text-2xl font-bold">₹ 42,250.00</span>
          </div>

          <div className="mt-12 flex justify-between text-xs text-gray-500">
            <div className="text-center border-t pt-2 w-32 italic">Employee Signature</div>
            <div className="text-center border-t pt-2 w-40 italic font-bold">Employer Seal & Signature</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
            <button className="btn btn-secondary flex items-center gap-2" onClick={() => window.print()}><Printer className="w-4 h-4" /> Print</button>
            <button className="btn btn-primary" onClick={() => setIsPayslipPreviewOpen(false)}>Close</button>
        </div>
      </Modal>

      {/* Add/Edit Side Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 md:w-1/2 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              Add {tabs.find(t => t.id === activeTab)?.label}
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500">X</button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium">Employee <span className="text-red-600">*</span></label>
                <Controller
                  name="employeeId" control={control} rules={{ required: 'Required' }}
                  render={({ field }) => <CommonSearchableSelect className="mt-1" options={employeeOptions} {...field} />}
                />
              </div>

              {activeTab === 'fixing' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm">Basic Salary</label><input type="number" className="input mt-1 w-full" {...register('basicSalary')} /></div>
                  <div><label className="block text-sm">HRA</label><input type="number" className="input mt-1 w-full" {...register('hra')} /></div>
                  <div><label className="block text-sm">Per Hour Salary</label><input type="number" className="input mt-1 w-full" {...register('perHourSalary')} /></div>
                  <div><label className="block text-sm">OT Rate Per Hour</label><input type="number" className="input mt-1 w-full" {...register('otRatePerHour')} /></div>
                  <div><label className="block text-sm">Allowance</label><input type="number" className="input mt-1 w-full" {...register('allowance')} /></div>
                  <div><label className="block text-sm">Incentive</label><input type="number" className="input mt-1 w-full" {...register('incentive')} /></div>
                  <div><label className="block text-sm">PF Deduction</label><input type="number" className="input mt-1 w-full" {...register('pfDeduction')} /></div>
                  <div><label className="block text-sm">ESI Deduction</label><input type="number" className="input mt-1 w-full" {...register('esiDeduction')} /></div>
                  <div><label className="block text-sm">Professional Tax</label><input type="number" className="input mt-1 w-full" {...register('professionalTax')} /></div>
                  <div><label className="block text-sm">Effective Date</label><input type="date" className="input mt-1 w-full" {...register('effectiveDate')} /></div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm">Month</label><input type="month" className="input mt-1 w-full" {...register('month')} /></div>
                  <div><label className="block text-sm">Net Salary</label><input type="number" className="input mt-1 w-full" {...register('netSalary')} /></div>
                  <div><label className="block text-sm">Payment Date</label><input type="date" className="input mt-1 w-full" {...register('paymentDate')} /></div>
                  <div>
                    <label className="block text-sm">Payment Mode</label>
                    <select className="input mt-1 w-full" {...register('paymentMode')}>
                        <option value="Bank">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div className="col-span-2"><label className="block text-sm">Transaction ID</label><input className="input mt-1 w-full" {...register('transactionId')} /></div>
                </div>
              )}

              {activeTab === 'bonus' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm">Financial Year</label><input className="input mt-1 w-full" {...register('financialYear')} placeholder="e.g. 2024-25" /></div>
                  <div><label className="block text-sm">Basic Salary</label><input type="number" className="input mt-1 w-full" {...register('basicSalary')} /></div>
                  <div><label className="block text-sm">Bonus %</label><input type="number" className="input mt-1 w-full" {...register('bonusPercentage')} /></div>
                  <div><label className="block text-sm">Bonus Amount</label><input type="number" className="input mt-1 w-full" {...register('bonusAmount')} /></div>
                  <div><label className="block text-sm">Payment Date</label><input type="date" className="input mt-1 w-full" {...register('paymentDate')} /></div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">Save {tabs.find(t => t.id === activeTab)?.label}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
