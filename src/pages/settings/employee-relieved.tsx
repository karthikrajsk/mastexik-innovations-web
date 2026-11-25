// import React, { useEffect, useMemo, useState } from 'react';
// import { useForm, Controller } from 'react-hook-form';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/state/store';
// import { 
//   getAllEmployeeRelieved, 
//   createEmployeeRelieved,
//   updateEmployeeRelieved,
//   type EmployeeRelieved 
// } from '@/state/employeeRelievedSlice';
// import { getAllEmployees } from '@/state/employeeSlice';
// import { DataTable } from '@/components/data/DataTable';
// import { Modal } from '@/components/ui/Modal';
// import { Pagination, usePagination } from '@/components/common/Pagination';
// import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';

// type RelievedFormData = Omit<EmployeeRelieved, 'id' | 'createdAt' | 'updatedAt'> & { 
//   id?: number;
//   finalSettlementStatus?: string;
// };

// export default function EmployeeRelievedPage() {
//   const dispatch = useDispatch<AppDispatch>();
//   const { relievedList, loading } = useSelector((state: RootState) => state.employeeRelieved);
//   const { employeeList } = useSelector((state: RootState) => state.employee);
//   const { currentPage, itemsPerPage, setItemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [current, setCurrent] = useState<any>(null);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     control,
//     watch,
//     formState: { errors },
//   } = useForm<RelievedFormData>({
//     mode: 'onBlur',
//   });

//   useEffect(() => {
//     dispatch(getAllEmployeeRelieved({ offset: getOffset(), limit: itemsPerPage }));
//     dispatch(getAllEmployees({ fetchAll: true }));
//   }, [currentPage, dispatch, itemsPerPage, getOffset]);

//   const columns = useMemo(() => [
//     { Header: 'Sl No', accessor: 'serialNo' },
//     { Header: 'Emp ID', accessor: 'employeeCode' },
//     { Header: 'Employee Name', accessor: 'employeeName' },
//     { Header: 'Relieving Date', accessor: 'relievingDate' },
//     // { Header: 'Status', accessor: 'finalSettlementStatus' },
//   ], []);

//   const dataWithSerial = useMemo(() => {
//     return (relievedList || []).map((item: EmployeeRelieved, index: number) => {
//       const emp = employeeList?.find(e => String(e.id) === String(item.employeeId));
//       return {
//         ...item,
//         serialNo: getOffset() + index + 1,
//         employeeName: emp?.employeeName || 'N/A',
//         employeeCode: emp?.employeeCode || item.employeeId,
//       };
//     });
//   }, [relievedList, employeeList, getOffset]);

//   const openAddModal = () => {
//     reset({
//       employeeId: 0,
//       relievingDate: new Date().toISOString().split('T')[0],
//       reason: '',
//       finalSettlementStatus: 'Pending',
//       remarks: '',
//     });
//     setIsModalOpen(true);
//   };

//   const openEditModal = (row: any) => {
//     setCurrent(row);
//     reset({
//       id: row.id,
//       employeeId: row.employeeId,
//       relievingDate: row.relievingDate,
//       reason: row.reason || '',
//       remarks: row.remarks || '',
//     });
//     setIsEditModalOpen(true);
//   };

//   const onSubmit = async (data: RelievedFormData) => {
//     // Convert employeeId to number and remove finalSettlementStatus before sending to backend
//     const { finalSettlementStatus, ...backendData } = data;
//     const payload = {
//       ...backendData,
//       employeeId: Number(data.employeeId),
//     };
    
//     if (data.id) {
//       // Update existing record
//       await dispatch(updateEmployeeRelieved(payload as EmployeeRelieved));
//     } else {
//       // Create new record
//       await dispatch(createEmployeeRelieved(payload));
//     }
    
//     dispatch(getAllEmployeeRelieved({ offset: getOffset(), limit: itemsPerPage }));
//     setIsModalOpen(false);
//     setIsEditModalOpen(false);
//   };

//   const employeeOptions = useMemo(() => {
//     return (employeeList || []).map(emp => ({
//       value: String(emp.id),
//       label: `${emp.employeeName} (${emp.employeeCode})`
//     }));
//   }, [employeeList]);

//   return (
//     <div className="p-6 pt-16">
//       <DataTable
//         columns={columns}
//         data={dataWithSerial}
//         title="Employee Relieved"
//         onAdd={openAddModal}
//         onView={(row) => { setCurrent(row); setIsViewModalOpen(true); }}
//         onEdit={(row) => openEditModal(row)}
//         showActions={true}
//         showAddActions={true}
//         showExport={true}
//         filterPlaceholder="Search records..."
//         initialPageSize={itemsPerPage}
//         onPageSizeChange={setItemsPerPage}
//         totalCount={dataWithSerial.length}
//         currentPage={currentPage}
//         onPageChange={handlePageChange}
//       />

//       {isModalOpen && (
//         <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
//           <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
//             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
//               Add Employee Relieved
//               <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
//                 <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
//                   <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
//                 </svg>
//               </button>
//             </h2>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             
//               <div className="grid grid-cols-2 gap-4">
//                  <div>
//                 <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
//                 <Controller
//                   name="employeeId"
//                   control={control}
//                   rules={{ required: 'Required' }}
//                   render={({ field }) => (
//                     <CommonSearchableSelect 
//                       className="mt-1" 
//                       options={employeeOptions} 
//                       {...field} 
//                       onChange={(value) => field.onChange(Number(value))}
//                       error={errors.employeeId?.message as string} 
//                     />
//                   )}
//                 />
//               </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Relieving Date <span className="text-red-600">*</span></label>
//                   <input type="date" className="input mt-1 w-full" {...register('relievingDate', { required: 'Required' })} />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Final Settlement Status</label>
//                   <select className="input mt-1 w-full" {...register("finalSettlementStatus")}>
//                     <option value="Pending">Pending</option>
//                     <option value="Completed">Completed</option>
//                     <option value="In Progress">In Progress</option>
//                   </select>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Reason</label>
//                 <textarea className="input mt-1 w-full h-24" {...register('reason')} />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Remarks</label>
//                 <input className="input mt-1 w-full" {...register('remarks')} />
//               </div>

//               <div className="flex gap-2 pt-4 border-t">
//                 <button type="submit" className="btn btn-primary">Save Record</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Relieved Details" className="max-w-2xl">
//         {current && (
//           <div className="grid grid-cols-2 gap-4 text-sm">
//             <p><span className="font-medium">Employee:</span> {current.employeeName}</p>
//             <p><span className="font-medium">Emp ID:</span> {current.employeeCode}</p>
//             <p><span className="font-medium">Relieving Date:</span> {current.relievingDate}</p>
//             <p><span className="font-medium">Status:</span> {current.finalSettlementStatus}</p>
//             <p className="col-span-2"><span className="font-medium">Reason:</span> {current.reason}</p>
//             <p className="col-span-2"><span className="font-medium">Remarks:</span> {current.remarks}</p>
//           </div>
//         )}
//       </Modal>

//       {isEditModalOpen && (
//         <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
//           <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
//             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
//               Edit Employee Relieved
//               <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
//                 <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
//                   <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
//                 </svg>
//               </button>
//             </h2>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             
//               <div className="grid grid-cols-2 gap-4">
//                  <div>
//                 <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
//                 <Controller
//                   name="employeeId"
//                   control={control}
//                   rules={{ required: 'Required' }}
//                   render={({ field }) => (
//                     <CommonSearchableSelect 
//                       className="mt-1" 
//                       options={employeeOptions} 
//                       {...field} 
//                       onChange={(value) => field.onChange(Number(value))}
//                       error={errors.employeeId?.message as string} 
//                     />
//                   )}
//                 />
//               </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Relieving Date <span className="text-red-600">*</span></label>
//                   <input type="date" className="input mt-1 w-full" {...register('relievingDate', { required: 'Required' })} />
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Reason</label>
//                 <textarea className="input mt-1 w-full h-24" {...register('reason')} />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Remarks</label>
//                 <input className="input mt-1 w-full" {...register('remarks')} />
//               </div>

//               <div className="flex gap-2 pt-4 border-t">
//                 <button type="submit" className="btn btn-primary">Update Record</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { 
  getAllEmployeeRelieved, 
  createEmployeeRelieved,
  updateEmployeeRelieved,
  deleteEmployeeRelieved,
  type EmployeeRelieved 
} from '@/state/employeeRelievedSlice';
import { getAllEmployees } from '@/state/employeeSlice';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/common/Pagination';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';

type RelievedFormData = Omit<EmployeeRelieved, 'id' | 'createdAt' | 'updatedAt'> & { 
  id?: number;
  finalSettlementStatus?: string;
  isActive?: boolean;
};

export default function EmployeeRelievedPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { relievedList, loading } = useSelector((state: RootState) => state.employeeRelieved);
  const { employeeList ,pagination } = useSelector((state: RootState) => state.employee);
  const { currentPage, itemsPerPage, setItemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);
const totalOrders = pagination?.total ?? (Array.isArray(relievedList) ? relievedList.length : 0);
  const currentOffset = pagination?.offset || 0;
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RelievedFormData>({
    mode: 'onBlur',
  });

  useEffect(() => {
    dispatch(getAllEmployeeRelieved({fetchAll: true  }));
    dispatch(getAllEmployees({ fetchAll: true }));
  }, [currentPage, dispatch, itemsPerPage, getOffset]);

  const columns = useMemo(() => [
    { Header: 'Sl No', accessor: 'serialNo' },
    { Header: 'Emp ID', accessor: 'employeeCode' },
    { Header: 'Employee Name', accessor: 'employeeName' },
    { Header: 'Department', accessor: 'department' },
    { Header: 'Designation', accessor: 'designation' },
    { Header: 'Joining Date', accessor: 'joiningDate' },
    { Header: 'Relieving Date', accessor: 'relievingDate' },
    // { Header: 'Status', accessor: 'finalSettlementStatus' },
  ], []);

  const dataWithSerial = useMemo(() => {
    return (relievedList || [])
      .filter((item: EmployeeRelieved) => item.isRelieved === 1)
      .map((item: EmployeeRelieved, index: number) => {
        const emp = employeeList?.find(e => String(e.id) === String(item.employeeId));
        return {
          ...item,
          serialNo: getOffset() + index + 1,
          employeeName: emp?.employeeName || 'N/A',
          employeeCode: emp?.employeeCode || item.employeeId,
          department: item.department || emp?.employmentDetails?.department || 'N/A',
          designation: item.designation || emp?.employmentDetails?.designation || 'N/A',
          joiningDate: item.joiningDate || emp?.employmentDetails?.joiningDate || 'N/A',
        };
      });
  }, [relievedList, employeeList, getOffset]);

  const openAddModal = () => {
    reset({
      employeeId: 0,
      relievingDate: new Date().toISOString().split('T')[0],
      reason: '',
      finalSettlementStatus: 'Pending',
      remarks: '',
      department: '',
      designation: '',
      joiningDate: '',
      isActive: true, // Default Active checkbox is selected when isRelieved = 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setCurrent(row);
    const emp = employeeList?.find(e => String(e.id) === String(row.employeeId));
    reset({
      id: row.id,
      employeeId: row.employeeId,
      relievingDate: row.relievingDate,
      reason: row.reason || '',
      remarks: row.remarks || '',
      department: row.department || emp?.employmentDetails?.department || '',
      designation: row.designation || emp?.employmentDetails?.designation || '',
      joiningDate: row.joiningDate || emp?.employmentDetails?.joiningDate || '',
      isActive: row.isRelieved === 1, // Active checkbox is selected when isRelieved = 1
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (row: any) => {
    if (window.confirm(`Are you sure you want to delete relieved record for ${row.employeeName || 'this employee'}?`)) {
      await dispatch(deleteEmployeeRelieved(row.id));
      dispatch(getAllEmployeeRelieved({ fetchAll: true }));
      dispatch(getAllEmployees({ fetchAll: true }));
    }
  };

  const onSubmit = async (data: RelievedFormData) => {
    // Convert employeeId to number and remove finalSettlementStatus before sending to backend
    const { finalSettlementStatus, isActive, ...backendData } = data;
    
    let payload = {
      ...backendData,
      employeeId: Number(data.employeeId),
    };
    
    if (data.id) {
      // Update existing record - apply new logic
      if (!isActive) {
        // When Active checkbox is unchecked: isRelieved = 0, activeFlag = true
        payload = {
          ...payload,
          isRelieved: 0,
          activeFlag: true
        };
      } else {
        // When Active checkbox is checked: isRelieved = 1, activeFlag = false (existing behavior)
        payload = {
          ...payload,
          isRelieved: 1,
          activeFlag: false
        };
      }
      await dispatch(updateEmployeeRelieved(payload as EmployeeRelieved));
    } else {
      // Create new record - existing behavior
      payload = {
        ...payload,
        isRelieved: isActive ? 1 : 0,
        activeFlag: isActive ? false : true
      };
      await dispatch(createEmployeeRelieved(payload));
    }
    
    dispatch(getAllEmployeeRelieved({ fetchAll:true }));
    dispatch(getAllEmployees({ fetchAll: true }));
    setIsModalOpen(false);
    setIsEditModalOpen(false);
  };

  const employeeOptions = useMemo(() => {
    return (employeeList || []).map(emp => ({
      value: String(emp.id),
      label: `${emp.employeeName} (${emp.employeeCode})`
    }));
  }, [employeeList]);

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={dataWithSerial}
        title="Employee Relieved"
        onAdd={openAddModal}
        onView={(row) => { setCurrent(row); setIsViewModalOpen(true); }}
        onEdit={(row) => openEditModal(row)}
        onDelete={(row) => handleDelete(row)}
        showActions={true}
        showAddActions={true}
        showExport={true}
        filterPlaceholder="Search records..."
        disableFullDataFetch={true}
      />
            {/* <Pagination
                        currentPage={currentPage}
                        totalItems={totalOrders}
                        itemsPerPage={itemsPerPage}
                        offset={currentOffset}
                        hasNext={!!pagination?.next}
                        hasPrev={!!pagination?.prev}
                        onPageChange={handlePageChange}
                      /> */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              Add Employee Relieved
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                </svg>
              </button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             
              <div className="grid grid-cols-2 gap-4">
                 <div>
                <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
                <CommonSearchableSelect 
                  className="mt-1" 
                  options={employeeOptions} 
                  value={watch('employeeId') || ''}
                  onChange={(value) => {
                    setValue('employeeId', value);
                    const emp = employeeList?.find(e => String(e.id) === String(value));
                    if (emp) {
                      setValue('department', emp.employmentDetails?.department || '');
                      setValue('designation', emp.employmentDetails?.designation || '');
                      setValue('joiningDate', emp.employmentDetails?.joiningDate || '');
                    }
                  }}
                  error={errors.employeeId?.message as string} 
                />
              </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                  <input type="date" className="input mt-1 w-full bg-gray-50" {...register('joiningDate')} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relieving Date <span className="text-red-600">*</span></label>
                  <input type="date" className="input mt-1 w-full" {...register('relievingDate', { required: 'Required' })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input type="text" className="input mt-1 w-full bg-gray-50" {...register('department')} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <input type="text" className="input mt-1 w-full bg-gray-50" {...register('designation')} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Final Settlement Status</label>
                  <select className="input mt-1 w-full" {...register("finalSettlementStatus")}>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register('isActive')}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea className="input mt-1 w-full h-24" {...register('reason')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <input className="input mt-1 w-full" {...register('remarks')} />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">Save Record</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Relieved Details" className="max-w-2xl">
        {current && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="font-medium">Employee:</span> {current.employeeName}</p>
            <p><span className="font-medium">Emp ID:</span> {current.employeeCode}</p>
            <p><span className="font-medium">Department:</span> {current.department}</p>
            <p><span className="font-medium">Designation:</span> {current.designation}</p>
            <p><span className="font-medium">Joining Date:</span> {current.joiningDate}</p>
            <p><span className="font-medium">Relieving Date:</span> {current.relievingDate}</p>
            <p><span className="font-medium">Status:</span> {current.finalSettlementStatus}</p>
            <p className="col-span-2"><span className="font-medium">Reason:</span> {current.reason}</p>
            <p className="col-span-2"><span className="font-medium">Remarks:</span> {current.remarks}</p>
          </div>
        )}
      </Modal>

      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              Edit Employee Relieved
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                </svg>
              </button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             
              <div className="grid grid-cols-2 gap-4">
                 <div>
                <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
                <CommonSearchableSelect 
                  className="mt-1" 
                  options={employeeOptions} 
                  value={watch('employeeId') || ''}
                  onChange={(value) => {
                    setValue('employeeId', value);
                    const emp = employeeList?.find(e => String(e.id) === String(value));
                    if (emp) {
                      setValue('department', emp.employmentDetails?.department || '');
                      setValue('designation', emp.employmentDetails?.designation || '');
                      setValue('joiningDate', emp.employmentDetails?.joiningDate || '');
                    }
                  }}
                  error={errors.employeeId?.message as string} 
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                  <input type="date" className="input mt-1 w-full bg-gray-50" {...register('joiningDate')} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relieving Date <span className="text-red-600">*</span></label>
                  <input type="date" className="input mt-1 w-full" {...register('relievingDate', { required: 'Required' })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input type="text" className="input mt-1 w-full bg-gray-50" {...register('department')} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <input type="text" className="input mt-1 w-full bg-gray-50" {...register('designation')} readOnly />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register('isActive')}
                  />
                  <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea className="input mt-1 w-full h-24" {...register('reason')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <input className="input mt-1 w-full" {...register('remarks')} />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">Update Record</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}