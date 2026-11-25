// // import React, { useEffect, useMemo, useState } from 'react';
// // import { useForm, Controller } from 'react-hook-form';
// // import { useDispatch, useSelector } from 'react-redux';
// // import { AppDispatch, RootState } from '@/state/store';
// // import { 
// //   getAllLeaveRequests,
// //   createLeaveRequest,
// //   updateLeaveRequest,
// //   approveLeaveRequest,
// //   rejectLeaveRequest,
// //   deleteLeaveRequest,
// //   type LeaveRequest 
// // } from '@/state/leaveRequestSlice';
// // import { 
// //   getAllPermissionRequests,
// //   createPermissionRequest,
// //   updatePermissionRequest,
// //   approvePermissionRequest,
// //   rejectPermissionRequest,
// //   deletePermissionRequest,
// //   type PermissionRequest 
// // } from '@/state/permissionRequestSlice';
// // import { getAllEmployees } from '@/state/employeeSlice';
// // import { DataTable } from '@/components/data/DataTable';
// // import { Modal } from '@/components/ui/Modal';
// // import { Pagination, usePagination } from '@/components/common/Pagination';
// // import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';

// // export default function LeaveRequestsPage() {
// //   const dispatch = useDispatch<AppDispatch>();
// //   const { leaveRequestList, loading } = useSelector((state: RootState) => state.leaveRequest);
// //   const { permissionList, loading: permissionLoading } = useSelector((state: RootState) => state.permissionRequest);
// //   const { employeeList } = useSelector((state: RootState) => state.employee);
// //   const { currentPage, itemsPerPage, setItemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });

// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
// //   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
// //   const [current, setCurrent] = useState<any>(null);
// //   const [activeTab, setActiveTab] = useState<'leave' | 'permission'>('leave');

// //   // Permission request states
// //   const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
// //   const [isPermissionEditModalOpen, setIsPermissionEditModalOpen] = useState(false);
// //   const [currentPermission, setCurrentPermission] = useState<PermissionRequest | null>(null);

// //   const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({ mode: 'onBlur' });

// //   useEffect(() => {
// //     dispatch(getAllLeaveRequests({ offset: getOffset(), limit: itemsPerPage }));
// //     dispatch(getAllEmployees({ fetchAll: true }));
// //   }, [currentPage, dispatch, itemsPerPage, getOffset]);

// //   useEffect(() => {
// //     if (activeTab === 'permission') {
// //       dispatch(getAllPermissionRequests({ page: 0, limit: 10 }));
// //     }
// //   }, [activeTab, dispatch]);

// //   const employeeOptions = useMemo(() => {
// //     return (employeeList || [])
// //       .filter(emp => !emp.isRelieved) // Filter out relieved employees
// //       .map(emp => ({
// //         value: String(emp.id),
// //         label: `${emp.employeeName} (${emp.employeeCode})`
// //       }));
// //   }, [employeeList]);

// //   const columns = useMemo(() => [
// //     { Header: 'Sl No', accessor: 'serialNo' },
// //     { Header: 'Emp ID', accessor: 'employeeCode' },
// //     { Header: 'Employee Name', accessor: 'employeeName' },
// //     { Header: 'Leave Type', accessor: 'leaveType' },
// //     { Header: 'Start Date', accessor: 'startDate' },
// //     { Header: 'End Date', accessor: 'endDate' },
// //     { Header: 'Reason', accessor: 'reason' },
// //     { Header: 'Status', accessor: 'status' },
// //     { Header: 'Approved By', accessor: 'approvedByName' },
// //   ], []);

// //   const dataWithSerial = useMemo(() => {
// //     return (leaveRequestList || []).map((item: LeaveRequest, index: number) => {
// //       const emp = employeeList?.find(e => String(e.id) === String(item.employeeId));
// //       return {
// //         ...item,
// //         serialNo: getOffset() + index + 1,
// //         employeeName: emp?.employeeName || 'N/A',
// //         employeeCode: emp?.employeeCode || item.employeeId,
// //       };
// //     });
// //   }, [leaveRequestList, employeeList, getOffset]);

// //   const openAddModal = () => {
// //     reset({
// //       employeeId: 0,
// //       leaveType: 'Casual',
// //       startDate: new Date().toISOString().split('T')[0],
// //       endDate: new Date().toISOString().split('T')[0],
// //       reason: '',
// //       status: 'Pending',
// //     });
// //     setIsModalOpen(true);
// //   };

// //   const openEditModal = (row: any) => {
// //     // Only allow editing if status is Pending
// //     // if (row.status !== 'Pending') {
// //     //   alert('Can only edit leave requests with Pending status');
// //     //   return;
// //     // }
// //     setCurrent(row);
// //     reset({
// //       id: row.id,
// //       employeeId: row.employeeId,
// //       leaveType: row.leaveType || 'Casual',
// //       startDate: row.startDate || new Date().toISOString().split('T')[0],
// //       endDate: row.endDate || new Date().toISOString().split('T')[0],
// //       reason: row.reason || '',
// //       status: row.status || 'Pending',
// //     });
// //     setIsEditModalOpen(true);
// //   };

// //   const onSubmit = async (data: any) => {
// //     const payload = {
// //       ...data,
// //       employeeId: Number(data.employeeId),
// //     };

// //     if (data.id) {
// //       // Update existing record
// //       await dispatch(updateLeaveRequest(payload));
// //     } else {
// //       // Create new record
// //       await dispatch(createLeaveRequest(payload));
// //     }

// //     dispatch(getAllLeaveRequests({ offset: getOffset(), limit: itemsPerPage }));
// //     setIsModalOpen(false);
// //     setIsEditModalOpen(false);
// //   };

// //   // Permission request handlers
// //   const openPermissionModal = () => {
// //     setCurrentPermission({
// //       employeeId: 0,
// //       date: new Date().toISOString().split('T')[0],
// //       fromTime: '',
// //       toTime: '',
// //       reason: '',
// //       status: 'Pending',
// //     });
// //     setIsPermissionModalOpen(true);
// //   };

// //   const openPermissionEditModal = (permission: PermissionRequest) => {
// //     setCurrentPermission(permission);
// //     setIsPermissionEditModalOpen(true);
// //   };

// //   const onPermissionSubmit = async (data: any) => {
// //     const payload: PermissionRequest = {
// //       ...data,
// //       employeeId: Number(data.employeeId),
// //     };

// //     if (currentPermission?.id) {
// //       await dispatch(updatePermissionRequest({ ...payload, id: currentPermission.id }));
// //     } else {
// //       await dispatch(createPermissionRequest(payload));
// //     }

// //     dispatch(getAllPermissionRequests({ page: 0, limit: 10 }));
// //     setIsPermissionModalOpen(false);
// //     setIsPermissionEditModalOpen(false);
// //     setCurrentPermission(null);
// //   };

// //   const permissionColumns = useMemo(() => [
// //     { Header: 'Sl No', accessor: 'serialNo' },
// //     { Header: 'Employee Name', accessor: 'employeeName' },
// //     { Header: 'Date', accessor: 'date' },
// //     { Header: 'From Time', accessor: 'fromTime' },
// //     { Header: 'To Time', accessor: 'toTime' },
// //     { Header: 'Reason', accessor: 'reason' },
// //     { Header: 'Status', accessor: 'status' },
// //   ], []);

// //   const permissionDataWithSerial = useMemo(() => {
// //     // Debug log to check what permissionList contains
// //     console.log('Permission List Debug:', permissionList);

// //     // More robust safety check
// //     if (!permissionList || !Array.isArray(permissionList)) {
// //       console.warn('Permission list is not an array:', permissionList);
// //       return [];
// //     }

// //     return permissionList.map((item: PermissionRequest, index: number) => {
// //       const emp = employeeList?.find(e => e.id === item.employeeId);
// //       return {
// //         ...item,
// //         serialNo: index + 1,
// //         employeeName: emp?.employeeName || 'N/A',
// //       };
// //     });
// //   }, [permissionList, employeeList]);

// //   return (
// //     <div className="p-6 pt-16">
// //       <div className="flex justify-between items-center mb-6">
// //         <h1 className="text-2xl font-semibold text-gray-800">Leave & Requests</h1>
// //       </div>

// //       {/* Tabs */}
// //       <div className="border-b border-gray-200 mb-6">
// //         <nav className="-mb-px flex space-x-8">
// //           <button
// //             onClick={() => setActiveTab('leave')}
// //             className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //               activeTab === 'leave'
// //                 ? 'border-blue-500 text-blue-600'
// //                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //             }`}
// //           >
// //             Leave Particulars
// //           </button>
// //           <button
// //             onClick={() => setActiveTab('permission')}
// //             className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //               activeTab === 'permission'
// //                 ? 'border-blue-500 text-blue-600'
// //                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
// //             }`}
// //           >
// //             Employee Permission (Short Leave)
// //           </button>
// //         </nav>
// //       </div>

// //       {/* Tab Content */}
// //       {activeTab === 'leave' && (
// //         <DataTable
// //           columns={columns}
// //           data={dataWithSerial}
// //           title="Leave Requests"
// //           onAdd={openAddModal}
// //           onView={(row) => { setCurrent(row); setIsViewModalOpen(true); }}
// //           onEdit={openEditModal}
// //           showActions={true}
// //           showAddActions={true}
// //           showExport={true}
// //           filterPlaceholder="Search leave requests..."
// //           initialPageSize={itemsPerPage}
// //           onPageSizeChange={setItemsPerPage}
// //           totalCount={dataWithSerial.length}
// //           currentPage={currentPage}
// //           onPageChange={handlePageChange}
// //         />
// //       )}

// //       {activeTab === 'permission' && (
// //         <DataTable
// //           columns={permissionColumns}
// //           data={permissionDataWithSerial}
// //           title="Employee Permission Requests"
// //           onAdd={openPermissionModal}
// //           onEdit={openPermissionEditModal}
// //           showActions={true}
// //           showAddActions={true}
// //           showExport={false}
// //           filterPlaceholder="Search permission requests..."
// //           initialPageSize={10}
// //           totalCount={permissionDataWithSerial.length}
// //         />
// //       )}

// //       {isModalOpen && (
// //         <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
// //           <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
// //             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
// //               Add Leave Request
// //               <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>
// //             </h2>

// //             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
// //                 <Controller
// //                   name="employeeId" control={control} rules={{ required: 'Required' }}
// //                   render={({ field }) => (
// //                     <CommonSearchableSelect 
// //                       className="mt-1" 
// //                       options={employeeOptions} 
// //                       value={field.value ? String(field.value) : ''}
// //                       onChange={(value) => field.onChange(Number(value))}
// //                     />
// //                   )}
// //                 />
// //               </div>

// //               <div className="grid grid-cols-2 gap-4">
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">Leave Type</label>
// //                   <select className="input mt-1 w-full" {...register('leaveType')}>
// //                     <option value="Casual">Casual</option>
// //                     <option value="Sick">Sick</option>
// //                     <option value="Annual">Annual</option>
// //                     <option value="Maternity">Maternity</option>
// //                     <option value="Paternity">Paternity</option>
// //                     <option value="Unpaid">Unpaid</option>
// //                   </select>
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">Status</label>
// //                   <select className="input mt-1 w-full" {...register('status')}>
// //                     <option value="Pending">Pending</option>
// //                     <option value="Approved">Approved</option>
// //                     <option value="Rejected">Rejected</option>
// //                     <option value="Cancelled">Cancelled</option>
// //                   </select>
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-600">*</span></label>
// //                   <input type="date" className="input mt-1 w-full" {...register('startDate', { required: 'Required' })} />
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">End Date <span className="text-red-600">*</span></label>
// //                   <input type="date" className="input mt-1 w-full" {...register('endDate', { required: 'Required' })} />
// //                 </div>
// //                 <div className="col-span-2">
// //                   <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-600">*</span></label>
// //                   <textarea className="input mt-1 w-full h-24" {...register('reason', { required: 'Required' })} />
// //                 </div>
// //               </div>

// //               <div className="flex gap-2 pt-4 border-t">
// //                 <button type="submit" className="btn btn-primary">Save Leave Request</button>
// //                 <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}

// //       <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Leave Request Details" className="max-w-2xl">
// //         {current && (
// //           <div className="grid grid-cols-2 gap-4 text-sm">
// //             <p><span className="font-medium">Employee:</span> {current.employeeName}</p>
// //             <p><span className="font-medium">Emp ID:</span> {current.employeeCode}</p>
// //             <p><span className="font-medium">Leave Type:</span> {current.leaveType}</p>
// //             <p><span className="font-medium">Start Date:</span> {current.startDate}</p>
// //             <p><span className="font-medium">End Date:</span> {current.endDate}</p>
// //             <p><span className="font-medium">Status:</span> {current.status}</p>
// //             <p><span className="font-medium">Approved By:</span> {current.approvedByName || 'N/A'}</p>
// //             <p className="col-span-2"><span className="font-medium">Reason:</span> {current.reason}</p>
// //             {current.rejectionReason && (
// //               <p className="col-span-2"><span className="font-medium">Rejection Reason:</span> {current.rejectionReason}</p>
// //             )}
// //           </div>
// //         )}
// //       </Modal>

// //       {isEditModalOpen && (
// //       <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
// //           <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
// //             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
// //               Edit Leave Request
// //               <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>
// //             </h2>

// //             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
// //                 <Controller
// //                   name="employeeId" control={control} rules={{ required: 'Required' }}
// //                   render={({ field }) => (
// //                     <CommonSearchableSelect 
// //                       className="mt-1" 
// //                       options={employeeOptions} 
// //                       value={field.value ? String(field.value) : ''}
// //                       onChange={(value) => field.onChange(Number(value))}
// //                     />
// //                   )}
// //                 />
// //               </div>

// //               <div className="grid grid-cols-2 gap-4">
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">Leave Type</label>
// //                   <select className="input mt-1 w-full" {...register('leaveType')}>
// //                     <option value="Casual">Casual</option>
// //                     <option value="Sick">Sick</option>
// //                     <option value="Annual">Annual</option>
// //                     <option value="Maternity">Maternity</option>
// //                     <option value="Paternity">Paternity</option>
// //                     <option value="Unpaid">Unpaid</option>
// //                   </select>
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">Status</label>
// //                   <select className="input mt-1 w-full" {...register('status')}>
// //                     <option value="Pending">Pending</option>
// //                     <option value="Approved">Approved</option>
// //                     <option value="Rejected">Rejected</option>
// //                     <option value="Cancelled">Cancelled</option>
// //                   </select>
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-600">*</span></label>
// //                   <input type="date" className="input mt-1 w-full" {...register('startDate', { required: 'Required' })} />
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">End Date <span className="text-red-600">*</span></label>
// //                   <input type="date" className="input mt-1 w-full" {...register('endDate', { required: 'Required' })} />
// //                 </div>
// //                 <div className="col-span-2">
// //                   <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-600">*</span></label>
// //                   <textarea className="input mt-1 w-full h-24" {...register('reason', { required: 'Required' })} />
// //                 </div>
// //               </div>

// //               <div className="flex gap-2 pt-4 border-t">
// //                 <button type="submit" className="btn btn-primary">Update Leave Request</button>
// //                 <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}

// //       {/* Permission Request Modal */}
// //       {(isPermissionModalOpen || isPermissionEditModalOpen) && (
// //         <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
// //           <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
// //             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
// //               {isPermissionEditModalOpen ? 'Edit Permission Request' : 'Add Permission Request'}
// //               <button 
// //                 onClick={() => {
// //                   setIsPermissionModalOpen(false);
// //                   setIsPermissionEditModalOpen(false);
// //                   setCurrentPermission(null);
// //                 }} 
// //                 className="text-gray-500 hover:text-gray-700"
// //               >
// //                 X
// //               </button>
// //             </h2>

// //             <form onSubmit={handleSubmit(onPermissionSubmit)} className="space-y-6">
// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
// //                 <Controller
// //                   name="employeeId" 
// //                   control={control} 
// //                   rules={{ required: 'Required' }}
// //                   defaultValue={currentPermission?.employeeId || ''}
// //                   render={({ field }) => (
// //                     <CommonSearchableSelect 
// //                       className="mt-1" 
// //                       options={employeeOptions} 
// //                       value={field.value ? String(field.value) : ''}
// //                       onChange={(value) => field.onChange(Number(value))}
// //                     />
// //                   )}
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700">Date <span className="text-red-600">*</span></label>
// //                 <input 
// //                   type="date" 
// //                   className="input mt-1 w-full" 
// //                   {...register('date', { required: 'Required' })}
// //                   defaultValue={currentPermission?.date || ''}
// //                 />
// //               </div>

// //               <div className="grid grid-cols-2 gap-4">
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">From Time <span className="text-red-600">*</span></label>
// //                   <input 
// //                     type="time" 
// //                     className="input mt-1 w-full" 
// //                     {...register('fromTime', { required: 'Required' })}
// //                     defaultValue={currentPermission?.fromTime || ''}
// //                   />
// //                 </div>
// //                 <div>
// //                   <label className="block text-sm font-medium text-gray-700">To Time <span className="text-red-600">*</span></label>
// //                   <input 
// //                     type="time" 
// //                     className="input mt-1 w-full" 
// //                     {...register('toTime', { required: 'Required' })}
// //                     defaultValue={currentPermission?.toTime || ''}
// //                   />
// //                 </div>
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-600">*</span></label>
// //                 <textarea 
// //                   className="input mt-1 w-full h-24" 
// //                   {...register('reason', { required: 'Required' })}
// //                   defaultValue={currentPermission?.reason || ''}
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium text-gray-700">Approved By</label>
// //                 <input 
// //                   type="text" 
// //                   className="input mt-1 w-full" 
// //                   {...register('approvedBy')}
// //                   defaultValue={currentPermission?.approvedBy || ''}
// //                   placeholder="Auto-filled when approved"
// //                   disabled
// //                 />
// //               </div>

// //               <div className="flex gap-2 pt-4 border-t">
// //                 <button type="submit" className="btn btn-primary">
// //                   {isPermissionEditModalOpen ? 'Update Permission' : 'Save Permission'}
// //                 </button>
// //                 <button 
// //                   type="button" 
// //                   className="btn btn-secondary" 
// //                   onClick={() => {
// //                     setIsPermissionModalOpen(false);
// //                     setIsPermissionEditModalOpen(false);
// //                     setCurrentPermission(null);
// //                   }}
// //                 >
// //                   Cancel
// //                 </button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }
// import React, { useEffect, useMemo, useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/state/store';
// import {
//   getAllLeaveRequests,
//   createLeaveRequest,
//   updateLeaveRequest,
//   approveLeaveRequest,
//   rejectLeaveRequest,
//   deleteLeaveRequest,
//   type LeaveRequest
// } from '@/state/leaveRequestSlice';
// import {
//   getAllPermissionRequests,
//   createPermissionRequest,
//   updatePermissionRequest,
//   approvePermissionRequest,
//   rejectPermissionRequest,
//   deletePermissionRequest,
//   type PermissionRequest
// } from '@/state/permissionRequestSlice';
// import { getAllEmployees } from '@/state/employeeSlice';
// import { DataTable } from '@/components/data/DataTable';
// import { Modal } from '@/components/ui/Modal';
// import { Pagination, usePagination } from '@/components/common/Pagination';
// import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';

// export default function LeaveRequestsPage() {
//   const dispatch = useDispatch<AppDispatch>();
//   const { leaveRequestList, loading } = useSelector((state: RootState) => state.leaveRequest);
//   const { permissionList, loading: permissionLoading } = useSelector((state: RootState) => state.permissionRequest);
//   const { employeeList } = useSelector((state: RootState) => state.employee);
//   const { currentPage, itemsPerPage, setItemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [current, setCurrent] = useState<any>(null);
//   const [activeTab, setActiveTab] = useState<'leave' | 'permission'>('leave');

//   // Permission request states
//   const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
//   const [isPermissionEditModalOpen, setIsPermissionEditModalOpen] = useState(false);
//   const [currentPermission, setCurrentPermission] = useState<PermissionRequest | null>(null);

//   const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({ mode: 'onBlur' });

//   useEffect(() => {
//     dispatch(getAllLeaveRequests({ offset: getOffset(), limit: itemsPerPage }));
//     dispatch(getAllEmployees({ fetchAll: true }));
//   }, [currentPage, dispatch, itemsPerPage, getOffset]);

//   useEffect(() => {
//     if (activeTab === 'permission') {
//       dispatch(getAllPermissionRequests({ page: 0, limit: 10 }));
//     }
//   }, [activeTab, dispatch]);

//   const employeeOptions = useMemo(() => {
//     return (employeeList || [])
//       .filter(emp => !emp.isRelieved) // Filter out relieved employees
//       .map(emp => ({
//         value: String(emp.id),
//         label: `${emp.employeeName} (${emp.employeeCode})`
//       }));
//   }, [employeeList]);

//   const columns = useMemo(() => [
//     { Header: 'Sl No', accessor: 'serialNo' },
//     { Header: 'Emp ID', accessor: 'employeeCode' },
//     { Header: 'Employee Name', accessor: 'employeeName' },
//     { Header: 'Leave Type', accessor: 'leaveType' },
//     { Header: 'Start Date', accessor: 'startDate' },
//     { Header: 'End Date', accessor: 'endDate' },
//     { Header: 'Reason', accessor: 'reason' },
//     { Header: 'Status', accessor: 'status' },
//     // { Header: 'Approved By', accessor: 'approvedByName' },
//   ], []);

//   const dataWithSerial = useMemo(() => {
//     return (leaveRequestList || []).map((item: LeaveRequest, index: number) => {
//       const emp = employeeList?.find(e => String(e.id) === String(item.employeeId));
//       return {
//         ...item,
//         serialNo: getOffset() + index + 1,
//         employeeName: emp?.employeeName || 'N/A',
//         employeeCode: emp?.employeeCode || item.employeeId,
//       };
//     });
//   }, [leaveRequestList, employeeList, getOffset]);

//   const openAddModal = () => {
//     reset({
//       employeeId: 0,
//       leaveType: 'Casual',
//       startDate: new Date().toISOString().split('T')[0],
//       endDate: new Date().toISOString().split('T')[0],
//       reason: '',
//       status: 'Pending',
//     });
//     setIsModalOpen(true);
//   };

//   const openEditModal = (row: any) => {
//     // Only allow editing if status is Pending
//     // if (row.status !== 'Pending') {
//     //   alert('Can only edit leave requests with Pending status');
//     //   return;
//     // }
//     setCurrent(row);
//     reset({
//       id: row.id,
//       employeeId: row.employeeId,
//       leaveType: row.leaveType || 'Casual',
//       startDate: row.startDate || new Date().toISOString().split('T')[0],
//       endDate: row.endDate || new Date().toISOString().split('T')[0],
//       reason: row.reason || '',
//       status: row.status || 'Pending',
//     });
//     setIsEditModalOpen(true);
//   };

//   const onSubmit = async (data: any) => {
//     const payload = {
//       ...data,
//       employeeId: Number(data.employeeId),
//     };

//     if (data.id) {
//       // Update existing record
//       await dispatch(updateLeaveRequest(payload));
//     } else {
//       // Create new record
//       await dispatch(createLeaveRequest(payload));
//     }

//     dispatch(getAllLeaveRequests({ offset: getOffset(), limit: itemsPerPage }));
//     setIsModalOpen(false);
//     setIsEditModalOpen(false);
//   };

//   // Permission request handlers
//   const openPermissionModal = () => {
//   setCurrentPermission(null);
  
//   // Reset form with default values
//   reset({
//     employeeId: '',
//     date: new Date().toISOString().split('T')[0],
//     fromTime: '',
//     toTime: '',
//     reason: '',
//     status: 'Pending',
//     approvedBy: '',
//   });
  
//   setIsPermissionModalOpen(true);
// };


//   const openPermissionEditModal = (permission: PermissionRequest) => {
//   setCurrentPermission(permission);
  
//     reset({
//     employeeId: permission.employeeId,
//     date: permission.date,
//     fromTime: permission.fromTime,
//     toTime: permission.toTime,
//     reason: permission.reason,
//     status: permission.status || 'Pending',
//     approvedBy: permission.approvedBy || '',
//   });
  
//   setIsPermissionEditModalOpen(true);
// };

//   const onPermissionSubmit = async (data: any) => {
//     const payload: PermissionRequest = {
//       ...data,
//       employeeId: Number(data.employeeId),
//     };

//     if (currentPermission?.id) {
//       await dispatch(updatePermissionRequest({ ...payload, id: currentPermission.id }));
//     } else {
//       await dispatch(createPermissionRequest(payload));
//     }

//     dispatch(getAllPermissionRequests({ page: 0, limit: 10 }));
//     setIsPermissionModalOpen(false);
//     setIsPermissionEditModalOpen(false);
//     setCurrentPermission(null);
//   };

//   const permissionColumns = useMemo(() => [
//     { Header: 'Sl No', accessor: 'serialNo' },
//     { Header: 'Employee Name', accessor: 'employeeName' },
//     { Header: 'Date', accessor: 'date' },
//     { Header: 'From Time', accessor: 'fromTime' },
//     { Header: 'To Time', accessor: 'toTime' },
//     { Header: 'Reason', accessor: 'reason' },
//     { Header: 'Status', accessor: 'status' },
//   ], []);

//   const permissionDataWithSerial = useMemo(() => {
//     // Debug log to check what permissionList contains
//     console.log('Permission List Debug:', permissionList);

//     // More robust safety check
//     if (!permissionList || !Array.isArray(permissionList)) {
//       console.warn('Permission list is not an array:', permissionList);
//       return [];
//     }

//     return permissionList.map((item: PermissionRequest, index: number) => {
//       const emp = employeeList?.find(e => e.id === item.employeeId);
//       return {
//         ...item,
//         serialNo: index + 1,
//         employeeName: emp?.employeeName || 'N/A',
//       };
//     });
//   }, [permissionList, employeeList]);

//   return (
//     <div className="p-6 pt-16">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-2xl font-semibold text-gray-800">Leave & Requests</h1>
//       </div>

//       {/* Tabs */}
//       <div className="border-b border-gray-200 mb-6">
//         <nav className="-mb-px flex space-x-8">
//           <button
//             onClick={() => setActiveTab('leave')}
//             className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'leave'
//               ? 'border-blue-500 text-blue-600'
//               : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//           >
//             Leave Particulars
//           </button>
//           <button
//             onClick={() => setActiveTab('permission')}
//             className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'permission'
//               ? 'border-blue-500 text-blue-600'
//               : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//           >
//             Employee Permission (Short Leave)
//           </button>
//         </nav>
//       </div>

//       {/* Tab Content */}
//       {activeTab === 'leave' && (
//         <DataTable
//           columns={columns}
//           data={dataWithSerial}
//           title="Leave Requests"
//           onAdd={openAddModal}
//           onView={(row) => { setCurrent(row); setIsViewModalOpen(true); }}
//           onEdit={openEditModal}
//           showActions={true}
//           showAddActions={true}
//           showExport={true}
//           filterPlaceholder="Search leave requests..."
//           initialPageSize={itemsPerPage}
//           onPageSizeChange={setItemsPerPage}
//           totalCount={dataWithSerial.length}
//           currentPage={currentPage}
//           onPageChange={handlePageChange}
//         />
//       )}

//       {activeTab === 'permission' && (
//         <DataTable
//           columns={permissionColumns}
//           data={permissionDataWithSerial}
//           title="Employee Permission Requests"
//           onAdd={openPermissionModal}
//           onEdit={openPermissionEditModal}
//           showActions={true}
//           showAddActions={true}
//           showExport={false}
//           filterPlaceholder="Search permission requests..."
//           initialPageSize={10}
//           totalCount={permissionDataWithSerial.length}
//         />
//       )}

//       {isModalOpen && (
//         <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
//           <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
//             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
//               Add Leave Request
//               <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>
//             </h2>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
//                 <CommonSearchableSelect
//                   className="mt-1"
//                   options={employeeOptions}
//                   value={watch('employeeId') || ''}
//                   onChange={(value) => setValue('employeeId', value)}
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Leave Type</label>
//                   <select className="input mt-1 w-full" {...register('leaveType')}>
//                     <option value="Casual">Casual</option>
//                     <option value="Sick">Sick</option>
//                     <option value="Annual">Annual</option>
//                     <option value="Maternity">Maternity</option>
//                     <option value="Paternity">Paternity</option>
//                     <option value="Unpaid">Unpaid</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Status</label>
//                   <select className="input mt-1 w-full" {...register('status')}>

//                     <option value="Pending">Pending</option>
//                     <option value="Approved">Approved</option>
//                     <option value="Rejected">Rejected</option>
//                     <option value="Cancelled">Cancelled</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-600">*</span></label>
//                   <input type="date" className="input mt-1 w-full" {...register('startDate', { required: 'Required' })} />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">End Date <span className="text-red-600">*</span></label>
//                   <input type="date" className="input mt-1 w-full" {...register('endDate', { required: 'Required' })} />
//                 </div>
//                 <div className="col-span-2">
//                   <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-600">*</span></label>
//                   <textarea className="input mt-1 w-full h-24" {...register('reason', { required: 'Required' })} />
//                 </div>
//               </div>

//               <div className="flex gap-2 pt-4 border-t">
//                 <button type="submit" className="btn btn-primary">Save Leave Request</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Leave Request Details" className="max-w-2xl">
//         {current && (
//           <div className="grid grid-cols-2 gap-4 text-sm">
//             <p><span className="font-medium">Employee:</span> {current.employeeName}</p>
//             <p><span className="font-medium">Emp ID:</span> {current.employeeCode}</p>
//             <p><span className="font-medium">Leave Type:</span> {current.leaveType}</p>
//             <p><span className="font-medium">Start Date:</span> {current.startDate}</p>
//             <p><span className="font-medium">End Date:</span> {current.endDate}</p>
//             <p><span className="font-medium">Status:</span> {current.status}</p>
//             {/* <p><span className="font-medium">Approved By:</span> {current.approvedByName || 'N/A'}</p> */}
//             <p className="col-span-2"><span className="font-medium">Reason:</span> {current.reason}</p>
//             {current.rejectionReason && (
//               <p className="col-span-2"><span className="font-medium">Rejection Reason:</span> {current.rejectionReason}</p>
//             )}
//           </div>
//         )}
//       </Modal>

//       {isEditModalOpen && (
//         <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
//           <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
//             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
//               Edit Leave Request
//               <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>
//             </h2>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
//                 <CommonSearchableSelect
//                   className="mt-1"
//                   options={employeeOptions}
//                   value={watch('employeeId') || ''}
//                   onChange={(value) => setValue('employeeId', value)}
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Leave Type</label>
//                   <select className="input mt-1 w-full" {...register('leaveType')}>
//                     <option value="Casual">Casual</option>
//                     <option value="Sick">Sick</option>
//                     <option value="Annual">Annual</option>
//                     <option value="Maternity">Maternity</option>
//                     <option value="Paternity">Paternity</option>
//                     <option value="Unpaid">Unpaid</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Status</label>
//                   <select
//                     className="input mt-1 w-full"
//                     {...register('status')}
//                     value={watch('status') || 'Pending'}
//                   >
//                     <option value="Pending">Pending</option>
//                     <option value="Approved">Approved</option>
//                     <option value="Cancelled">Cancelled</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-600">*</span></label>
//                   <input type="date" className="input mt-1 w-full" {...register('startDate', { required: 'Required' })} />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700">End Date <span className="text-red-600">*</span></label>
//                   <input type="date" className="input mt-1 w-full" {...register('endDate', { required: 'Required' })} />
//                 </div>
//                 <div className="col-span-2">
//                   <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-600">*</span></label>
//                   <textarea className="input mt-1 w-full h-24" {...register('reason', { required: 'Required' })} />
//                 </div>
//               </div>

//               <div className="flex gap-2 pt-4 border-t">
//                 <button type="submit" className="btn btn-primary">Update Leave Request</button>
//                 <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Permission Request Modal */}
//      {/* Permission Request Modal */}
// {(isPermissionModalOpen || isPermissionEditModalOpen) && (
//   <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
//     <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
//       <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
//         {isPermissionEditModalOpen ? 'Edit Permission Request' : 'Add Permission Request'}
//         <button
//           onClick={() => {
//             setIsPermissionModalOpen(false);
//             setIsPermissionEditModalOpen(false);
//             setCurrentPermission(null);
//           }}
//           className="text-gray-500 hover:text-gray-700"
//         >
//           X
//         </button>
//       </h2>

//       <form onSubmit={handleSubmit(onPermissionSubmit)} className="space-y-6">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Employee <span className="text-red-600">*</span></label>
//           <CommonSearchableSelect
//             className="mt-1"
//             options={employeeOptions}
//             value={watch('employeeId') ? String(watch('employeeId')) : ''}
//             onChange={(value) => setValue('employeeId', Number(value))}
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700">Date <span className="text-red-600">*</span></label>
//           <input
//             type="date"
//             className="input mt-1 w-full"
//             {...register('date', { required: 'Required' })}
//           />
//         </div>

//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">From Time <span className="text-red-600">*</span></label>
//             <input
//               type="time"
//               className="input mt-1 w-full"
//               {...register('fromTime', { required: 'Required' })}
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700">To Time <span className="text-red-600">*</span></label>
//             <input
//               type="time"
//               className="input mt-1 w-full"
//               {...register('toTime', { required: 'Required' })}
//             />
//           </div>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700">Status</label>
//           <select 
//             className="input mt-1 w-full"
//             {...register('status')}
//           >
//             <option value="PENDING">Pending</option>
//             <option value="APPROVED">Approved</option>
//             <option value="CANCELLED">Cancelled</option>
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-600">*</span></label>
//           <textarea
//             className="input mt-1 w-full h-24"
//             {...register('reason', { required: 'Required' })}
//           />
//         </div>

//         <div className="flex gap-2 pt-4 border-t">
//           <button type="submit" className="btn btn-primary">
//             {isPermissionEditModalOpen ? 'Update Permission' : 'Save Permission'}
//           </button>
//           <button
//             type="button"
//             className="btn btn-secondary"
//             onClick={() => {
//               setIsPermissionModalOpen(false);
//               setIsPermissionEditModalOpen(false);
//               setCurrentPermission(null);
//             }}
//           >
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   </div>
// )}
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import {
  getAllLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  deleteLeaveRequest,
  type LeaveRequest
} from '@/state/leaveRequestSlice';
import {
  getAllPermissionRequests,
  createPermissionRequest,
  updatePermissionRequest,
  approvePermissionRequest,
  rejectPermissionRequest,
  deletePermissionRequest,
  type PermissionRequest
} from '@/state/permissionRequestSlice';
import { getAllEmployees } from '@/state/employeeSlice';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/common/Pagination';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';

export default function LeaveRequestsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { leaveRequestList, loading } = useSelector((state: RootState) => state.leaveRequest);
  const { permissionList, loading: permissionLoading } = useSelector((state: RootState) => state.permissionRequest);
  const { employeeList } = useSelector((state: RootState) => state.employee);
  const { currentPage, itemsPerPage, setItemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'leave' | 'permission'>('leave');

  // Permission request states
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isPermissionEditModalOpen, setIsPermissionEditModalOpen] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<PermissionRequest | null>(null);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({ mode: 'onBlur' });

  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');
  const watchedLeaveType = watch('leaveType');

  const leaveDurationDays = useMemo(() => {
    if (!watchedStartDate || !watchedEndDate) return null;
    const start = new Date(watchedStartDate);
    const end = new Date(watchedEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [watchedStartDate, watchedEndDate]);

  useEffect(() => {
    dispatch(getAllLeaveRequests({ offset: getOffset(), limit: itemsPerPage }));
    dispatch(getAllEmployees({ fetchAll: true }));
  }, [currentPage, dispatch, itemsPerPage, getOffset]);

  useEffect(() => {
    if (activeTab === 'permission') {
      dispatch(getAllPermissionRequests({ page: 0, limit: 10 }));
    }
  }, [activeTab, dispatch]);

  const employeeOptions = useMemo(() => {
    return (employeeList || [])
      .filter(emp => !emp.isRelieved) // Filter out relieved employees
      .map(emp => ({
        value: String(emp.id),
        label: `${emp.employeeName} (${emp.employeeCode})`
      }));
  }, [employeeList]);

  const columns = useMemo(() => [
    { Header: 'Sl No', accessor: 'serialNo' },
    { Header: 'Emp ID', accessor: 'employeeCode' },
    { Header: 'Employee Name', accessor: 'employeeName' },
    { Header: 'Leave Type', accessor: 'leaveType' },
    { Header: 'Start Date', accessor: 'startDate' },
    { Header: 'End Date', accessor: 'endDate' },
    { Header: 'Reason', accessor: 'reason' },
    { Header: 'Status', accessor: 'status' },
  ], []);

  const dataWithSerial = useMemo(() => {
    return (leaveRequestList || []).map((item: LeaveRequest, index: number) => {
      const emp = employeeList?.find(e => String(e.id) === String(item.employeeId));
      return {
        ...item,
        serialNo: getOffset() + index + 1,
        employeeName: emp?.employeeName || 'N/A',
        employeeCode: emp?.employeeCode || item.employeeId,
      };
    });
  }, [leaveRequestList, employeeList, getOffset]);

  const openAddModal = () => {
    reset({
      employeeId: '',
      leaveType: 'Casual',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
      status: 'Pending',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setCurrent(row);
    reset({
      id: row.id,
      employeeId: String(row.employeeId),
      leaveType: row.leaveType || 'Casual',
      startDate: row.startDate || new Date().toISOString().split('T')[0],
      endDate: row.endDate || new Date().toISOString().split('T')[0],
      reason: row.reason || '',
      status: row.status || 'Pending',
    });
    setIsEditModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    // Validate required fields
    if (!data.employeeId) {
      alert('Please select an employee');
      return;
    }
    if (!data.startDate) {
      alert('Please select start date');
      return;
    }
    if (!data.endDate) {
      alert('Please select end date');
      return;
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      alert('End date cannot be earlier than start date');
      return;
    }

    const payload = {
      ...data,
      employeeId: Number(data.employeeId),
    };

    if (data.id) {
      await dispatch(updateLeaveRequest(payload));
    } else {
      await dispatch(createLeaveRequest(payload));
    }

    dispatch(getAllLeaveRequests({ offset: getOffset(), limit: itemsPerPage }));
    setIsModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Permission request handlers
  const openPermissionModal = () => {
    setCurrentPermission(null);
    reset({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      fromTime: '',
      toTime: '',
      reason: '',
      status: 'PENDING',
      approvedBy: '',
    });
    setIsPermissionModalOpen(true);
  };

  const openPermissionEditModal = (permission: PermissionRequest) => {
    setCurrentPermission(permission);
    reset({
      employeeId: String(permission.employeeId),
      date: permission.date,
      fromTime: permission.fromTime,
      toTime: permission.toTime,
      reason: permission.reason,
      status: permission.status || 'PENDING',
      approvedBy: permission.approvedBy || '',
    });
    setIsPermissionEditModalOpen(true);
  };

  const onPermissionSubmit = async (data: any) => {
    // Validate required fields
    if (!data.employeeId) {
      alert('Please select an employee');
      return;
    }
    if (!data.date) {
      alert('Please select date');
      return;
    }
    if (!data.fromTime) {
      alert('Please select from time');
      return;
    }
    if (!data.toTime) {
      alert('Please select to time');
      return;
    }

    const payload: PermissionRequest = {
      ...data,
      employeeId: Number(data.employeeId),
    };

    if (currentPermission?.id) {
      await dispatch(updatePermissionRequest({ ...payload, id: currentPermission.id }));
    } else {
      await dispatch(createPermissionRequest(payload));
    }

    dispatch(getAllPermissionRequests({ page: 0, limit: 10 }));
    setIsPermissionModalOpen(false);
    setIsPermissionEditModalOpen(false);
    setCurrentPermission(null);
  };

  const permissionColumns = useMemo(() => [
    { Header: 'Sl No', accessor: 'serialNo' },
    { Header: 'Employee Name', accessor: 'employeeName' },
    { Header: 'Date', accessor: 'date' },
    { Header: 'From Time', accessor: 'fromTime' },
    { Header: 'To Time', accessor: 'toTime' },
    { Header: 'Reason', accessor: 'reason' },
    { Header: 'Status', accessor: 'status' },
  ], []);

  const permissionDataWithSerial = useMemo(() => {
    console.log('Permission List Debug:', permissionList);

    if (!permissionList || !Array.isArray(permissionList)) {
      console.warn('Permission list is not an array:', permissionList);
      return [];
    }

    return permissionList.map((item: PermissionRequest, index: number) => {
      const emp = employeeList?.find(e => e.id === item.employeeId);
      return {
        ...item,
        serialNo: index + 1,
        employeeName: emp?.employeeName || 'N/A',
      };
    });
  }, [permissionList, employeeList]);

  return (
    <div className="p-6 pt-16">
   

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('leave')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'leave'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Leave Particulars
          </button>
          <button
            onClick={() => setActiveTab('permission')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'permission'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Employee Permission (Short Leave)
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'leave' && (
        <DataTable
          columns={columns}
          data={dataWithSerial}
          title="Leave Requests"
          onAdd={openAddModal}
          onView={(row) => { setCurrent(row); setIsViewModalOpen(true); }}
          onEdit={openEditModal}
          showActions={true}
          showAddActions={true}
          showExport={true}
          filterPlaceholder="Search leave requests..."
          initialPageSize={itemsPerPage}
          onPageSizeChange={setItemsPerPage}
          totalCount={dataWithSerial.length}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      {activeTab === 'permission' && (
        <DataTable
          columns={permissionColumns}
          data={permissionDataWithSerial}
          title="Employee Permission Requests"
          onAdd={openPermissionModal}
          onEdit={openPermissionEditModal}
          showActions={true}
          showAddActions={true}
          showExport={false}
          filterPlaceholder="Search permission requests..."
          initialPageSize={10}
          totalCount={permissionDataWithSerial.length}
        />
      )}

      {/* Leave Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              Add Leave Request
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee <span className="text-red-600">*</span>
                </label>
                <CommonSearchableSelect
                  className="mt-1"
                  options={employeeOptions}
                  value={watch('employeeId') || ''}
                  onChange={(value) => setValue('employeeId', value)}
                />
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">Employee is required</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                  <select className="input mt-1 w-full" {...register('leaveType')}>
                    <option value="Casual">Casual</option>
                    <option value="Sick">Sick</option>
                    <option value="Annual">Annual</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Paternity">Paternity</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Long Leave">Long Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select className="input mt-1 w-full" {...register('status')}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="input mt-1 w-full" 
                    {...register('startDate', { required: 'Start date is required' })} 
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message as string}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="input mt-1 w-full" 
                    {...register('endDate', { required: 'End date is required' })} 
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate.message as string}</p>
                  )}
                </div>

                {leaveDurationDays !== null && (
                  <div className={`col-span-2 p-3 rounded-lg border text-xs font-medium flex items-center justify-between ${
                    leaveDurationDays <= 0 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : watchedLeaveType === 'Long Leave' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-800' 
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div>
                      <span className="font-semibold">{watchedLeaveType === 'Long Leave' ? 'Long Leave Duration:' : 'Leave Duration:'}</span>{' '}
                      {leaveDurationDays <= 0 ? (
                        <span className="font-semibold">End date cannot be earlier than start date</span>
                      ) : (
                        <span>{leaveDurationDays} Day{leaveDurationDays > 1 ? 's' : ''} ({watchedStartDate} to {watchedEndDate})</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-600">*</span></label>
                  <textarea className="input mt-1 w-full h-24" {...register('reason', { required: 'Reason is required' })} />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason.message as string}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">Save Leave Request</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Leave Request Details" className="max-w-2xl">
        {current && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="font-medium">Employee:</span> {current.employeeName}</p>
            <p><span className="font-medium">Emp ID:</span> {current.employeeCode}</p>
            <p><span className="font-medium">Leave Type:</span> {current.leaveType}</p>
            <p><span className="font-medium">Start Date:</span> {current.startDate}</p>
            <p><span className="font-medium">End Date:</span> {current.endDate}</p>
            {current.startDate && current.endDate && (
              <p className="col-span-2">
                <span className="font-medium">Total Duration:</span>{' '}
                {Math.max(1, Math.ceil((new Date(current.endDate).getTime() - new Date(current.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} Day(s)
              </p>
            )}
            <p><span className="font-medium">Status:</span> {current.status}</p>
            <p className="col-span-2"><span className="font-medium">Reason:</span> {current.reason}</p>
            {current.rejectionReason && (
              <p className="col-span-2"><span className="font-medium">Rejection Reason:</span> {current.rejectionReason}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Leave Request Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              Edit Leave Request
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">X</button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee <span className="text-red-600">*</span>
                </label>
                <CommonSearchableSelect
                  className="mt-1"
                  options={employeeOptions}
                  value={watch('employeeId') || ''}
                  onChange={(value) => setValue('employeeId', value)}
                />
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">Employee is required</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                  <select className="input mt-1 w-full" {...register('leaveType')}>
                    <option value="Casual">Casual</option>
                    <option value="Sick">Sick</option>
                    <option value="Annual">Annual</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Paternity">Paternity</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Long Leave">Long Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="input mt-1 w-full"
                    {...register('status')}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="input mt-1 w-full" 
                    {...register('startDate', { required: 'Start date is required' })} 
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message as string}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date <span className="text-red-600">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="input mt-1 w-full" 
                    {...register('endDate', { required: 'End date is required' })} 
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate.message as string}</p>
                  )}
                </div>

                {leaveDurationDays !== null && (
                  <div className={`col-span-2 p-3 rounded-lg border text-xs font-medium flex items-center justify-between ${
                    leaveDurationDays <= 0 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : watchedLeaveType === 'Long Leave' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-800' 
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div>
                      <span className="font-semibold">{watchedLeaveType === 'Long Leave' ? 'Long Leave Duration:' : 'Leave Duration:'}</span>{' '}
                      {leaveDurationDays <= 0 ? (
                        <span className="font-semibold">End date cannot be earlier than start date</span>
                      ) : (
                        <span>{leaveDurationDays} Day{leaveDurationDays > 1 ? 's' : ''} ({watchedStartDate} to {watchedEndDate})</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Reason <span className="text-red-600">*</span></label>
                  <textarea className="input mt-1 w-full h-24" {...register('reason', { required: 'Reason is required' })} />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason.message as string}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">Update Leave Request</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Request Modal */}
      {(isPermissionModalOpen || isPermissionEditModalOpen) && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-1/2 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              {isPermissionEditModalOpen ? 'Edit Permission Request' : 'Add Permission Request'}
              <button
                onClick={() => {
                  setIsPermissionModalOpen(false);
                  setIsPermissionEditModalOpen(false);
                  setCurrentPermission(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                X
              </button>
            </h2>

            <form onSubmit={handleSubmit(onPermissionSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee <span className="text-red-600">*</span>
                </label>
                <CommonSearchableSelect
                  className="mt-1"
                  options={employeeOptions}
                  value={watch('employeeId') ? String(watch('employeeId')) : ''}
                  onChange={(value) => setValue('employeeId', Number(value))}
                />
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">Employee is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  className="input mt-1 w-full"
                  {...register('date', { required: 'Date is required' })}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    From Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    className="input mt-1 w-full"
                    {...register('fromTime', { required: 'From time is required' })}
                  />
                  {errors.fromTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.fromTime.message as string}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    To Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    className="input mt-1 w-full"
                    {...register('toTime', { required: 'To time is required' })}
                  />
                  {errors.toTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.toTime.message as string}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select 
                  className="input mt-1 w-full"
                  {...register('status')}
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  className="input mt-1 w-full h-24"
                  {...register('reason', { required: 'Reason is required' })}
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message as string}</p>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">
                  {isPermissionEditModalOpen ? 'Update Permission' : 'Save Permission'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsPermissionModalOpen(false);
                    setIsPermissionEditModalOpen(false);
                    setCurrentPermission(null);
                  }}
                >
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