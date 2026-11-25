import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import {
  getAllAttendances,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  createAttendancesBulk,
  type Attendance
} from '@/state/attendanceSlice';
import { toast } from 'react-toastify';
import { DataTable, DateRangeFilter } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination, usePagination } from '@/components/common/Pagination';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';
import { getAllEmployees } from '@/state/employeeSlice';
import { formatTimeIST } from '@/utils/dateUtils';
import { BulkUploadModal } from '@/components/ui/BulkUploadModal';

import { RotateCw } from 'lucide-react';

type AttendanceFormData = Omit<Attendance, 'id'> & { id?: number };

export default function AttendanceDownloadPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { attendanceList, loading } = useSelector((state: RootState) => state.attendance);
  const { employeeList } = useSelector((state: RootState) => state.employee);
  const { currentPage, itemsPerPage, handlePageChange, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<AttendanceFormData>({
    mode: 'onBlur',
    defaultValues: {
      status: 'Present',
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      checkIn: '',
      checkOut: '',
      otCheckIn: '',
      otCheckOut: '',
      overtimeHours: '',
    },
  });

  const selectedStatus = watch('status');
  const watchedOtCheckIn = watch('otCheckIn');
  const watchedOtCheckOut = watch('otCheckOut');

  useEffect(() => {
    if (selectedStatus === 'Absent' || selectedStatus === 'Leave') {
      clearErrors(['checkIn', 'checkOut']);
    }
  }, [selectedStatus, clearErrors]);

  // Auto-calculate OT Hours when OT Check-In and OT Check-Out change in drawer
  useEffect(() => {
    if (watchedOtCheckIn && watchedOtCheckOut) {
      const [inH, inM] = watchedOtCheckIn.split(':').map(Number);
      const [outH, outM] = watchedOtCheckOut.split(':').map(Number);
      if (!isNaN(inH) && !isNaN(outH)) {
        let inMins = inH * 60 + (inM || 0);
        let outMins = outH * 60 + (outM || 0);
        if (outMins < inMins) outMins += 24 * 60;
        const diffH = (outMins - inMins) / 60.0;
        if (diffH > 0) {
          setValue('overtimeHours', Number(diffH.toFixed(2)).toString());
        }
      }
    }
  }, [watchedOtCheckIn, watchedOtCheckOut, setValue]);

  useEffect(() => {
    dispatch(getAllAttendances({ fetchAll: true }));
    dispatch(getAllEmployees({ fetchAll: true }));
  }, [dispatch]);

  const refreshData = () => {
    dispatch(getAllAttendances({ fetchAll: true }));
    toast.success('Data refreshed successfully');
  };

  // Columns for Daily Attendance
  const dailyColumns = useMemo(() => [
    { Header: 'Sl No', accessor: 'serialNo', disableFilters: true },
    { Header: 'Date', accessor: 'date',  Cell: ({ value }: { value: string }) => {
              const date = new Date(value);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            },
            Filter: DateRangeFilter,
    },
    { Header: 'Employee Name', accessor: 'employeeName' },
    { Header: 'Emp ID', accessor: 'employeeCode' },
    { Header: 'Check In', accessor: 'checkIn' },
    { Header: 'Check Out', accessor: 'checkOut' },
    { Header: 'OT Check-In', accessor: 'otCheckIn' },
    { Header: 'OT Check-Out', accessor: 'otCheckOut' },
    { Header: 'Working Hours', accessor: 'workingHours' },
    { Header: 'Working Days', accessor: (row: any) => Number(row.workingDays || 0).toFixed(1) },
    { Header: 'OT (Hrs)', accessor: 'overtimeHours' },
    { Header: 'Difference', accessor: (row: any) => Number(row.difference || 0).toFixed(2) },
  ], []);

  const attendancesWithSerial = useMemo(() => {
    return (attendanceList || []).map((att, index) => {
      const emp = employeeList?.find(e => String(e.id) === String(att.employeeId));
      const employeeName = emp?.employeeName || att.employee_name || 'N/A';
      const employeeCode = emp?.employeeCode || att.employee_code || att.employeeId;
      return {
        ...att,
        serialNo: index + 1,
        employeeName,
        employeeCode,
        employee_name: employeeName,
        employee_code: employeeCode,
        otCheckIn: att.otCheckIn ?? (att as any).ot_check_in ?? '-',
        otCheckOut: att.otCheckOut ?? (att as any).ot_check_out ?? '-',
        overtimeHours: att.overtimeHours ?? (att as any).overtime_hours ?? (att as any).ot_hours ?? '',
      };
    });
  }, [attendanceList, employeeList]);

  const convertToTimeInput = (val?: string) => {
    if (!val || val === '-') return '';
    if (/^\d{2}:\d{2}$/.test(val)) return val;
    const ampmMatch = val.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const m = ampmMatch[2];
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    }
    if (val.includes('T')) {
      const timePart = val.split('T')[1];
      if (timePart) return timePart.substring(0, 5);
    }
    return '';
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrent(null);
    reset({
      date: new Date().toISOString().split('T')[0],
      employeeId: '',
      checkIn: '',
      checkOut: '',
      otCheckIn: '',
      otCheckOut: '',
      workingHours: '',
      overtimeHours: '',
      status: 'Present',
    });
    setIsModalOpen(true);
  };

  const onEditRow = (row: Attendance) => {
    setIsEditing(true);
    setCurrent(row);
    reset({
      ...row,
      checkIn: convertToTimeInput(row.checkIn),
      checkOut: convertToTimeInput(row.checkOut),
      otCheckIn: convertToTimeInput(row.otCheckIn),
      otCheckOut: convertToTimeInput(row.otCheckOut),
      overtimeHours: row.overtimeHours ?? (row as any).overtime_hours ?? '',
    });
    setIsModalOpen(true);
  };

  const onViewRow = (row: Attendance) => {
    const emp = employeeList?.find(e => String(e.id) === String(row.employeeId));
    setCurrent({ ...row, employeeName: emp?.employeeName || 'N/A' });
    setIsViewModalOpen(true);
  };

  const onDeleteRow = (row: Attendance) => {
    setCurrent(row);
    setIsDeleteModalOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!current?.id) return setIsDeleteModalOpen(false);
    await dispatch(deleteAttendance(current.id));
    dispatch(getAllAttendances({ fetchAll: true }));
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: AttendanceFormData) => {
    const employee = employeeList?.find(e => String(e.id) === String(data.employeeId));

    // Calculate OT hours from otCheckIn and otCheckOut if present
    let calculatedOt = data.overtimeHours;
    if (data.otCheckIn && data.otCheckOut) {
      const [inH, inM] = data.otCheckIn.split(':').map(Number);
      const [outH, outM] = data.otCheckOut.split(':').map(Number);
      if (!isNaN(inH) && !isNaN(outH)) {
        let inMins = inH * 60 + (inM || 0);
        let outMins = outH * 60 + (outM || 0);
        if (outMins < inMins) outMins += 24 * 60;
        const diffH = (outMins - inMins) / 60.0;
        if (diffH > 0) {
          calculatedOt = Number(diffH.toFixed(2)).toString();
        }
      }
    }

    const otCheckInISO = data.otCheckIn ? `${data.date}T${data.otCheckIn}:00.000` : undefined;
    const isOtOvernight = data.otCheckIn && data.otCheckOut && data.otCheckOut < data.otCheckIn;
    let otCheckOutDate = data.date;
    if (isOtOvernight) {
      const d = new Date(data.date);
      d.setDate(d.getDate() + 1);
      otCheckOutDate = d.toISOString().split('T')[0];
    }
    const otCheckOutISO = data.otCheckOut ? `${otCheckOutDate}T${data.otCheckOut}:00.000` : undefined;

    if (isEditing && current?.id) {
      await dispatch(updateAttendance({
        ...data,
        id: current.id,
        employee_id: employee?.id || current.employee_id,
        employee_code: employee?.employeeCode || current.employee_code,
        employee_name: employee?.employeeName || current.employee_name,
        otCheckIn: otCheckInISO,
        otCheckOut: otCheckOutISO,
        overtimeHours: calculatedOt,
        overtime_hours: calculatedOt,
      } as Attendance));
    } else {
      // Backend expects: employee_id, employee_code, employee_name, type (1/0), time
      const commonData = {
        employee_id: employee?.id,
        employee_code: employee?.employeeCode,
        employee_name: employee?.employeeName,
        date: data.date,
        status: data.status,
        otCheckIn: otCheckInISO,
        otCheckOut: otCheckOutISO,
        overtimeHours: calculatedOt,
        overtime_hours: calculatedOt,
      };

      if (data.checkIn) {
        await dispatch(createAttendance({
          ...commonData,
          type: 1, // 1 for check_in
          time: `${data.date}T${data.checkIn}:00.000`,
          checkIn: `${data.date}T${data.checkIn}:00.000`
        } as any));
      }

      if (data.checkOut) {
        await dispatch(createAttendance({
          ...commonData,
          type: 0, // 0 for check_out
          time: `${data.date}T${data.checkOut}:00.000`,
          checkIn: data.checkIn ? `${data.date}T${data.checkIn}:00.000` : undefined,
          checkOut: `${data.date}T${data.checkOut}:00.000`
        } as any));
      }

      if (!data.checkIn && !data.checkOut) {
        // If it's just a status update (e.g. Absent or Leave)
        await dispatch(createAttendance({
          ...commonData,
          ...data,
          employee_id: employee?.id,
          employee_code: employee?.employeeCode,
          employee_name: employee?.employeeName,
        } as any));
      }
    }
    dispatch(getAllAttendances({ fetchAll: true }));
    setIsModalOpen(false);
  };

  const employeeOptions = useMemo(() => {
    return (employeeList || []).map(emp => ({
      value: String(emp.id),
      label: `${emp.employeeName} (${emp.employeeCode})`
    }));
  }, [employeeList]);

  const handleBulkUploadConfirm = async (parsedData: any[]) => {
    try {
      const enrichedPayloads = (parsedData || []).map(record => {
        if (!record.id) {
          const match = attendanceList?.find(a => {
            const matchEmp = (record.employee_id && String(a.employeeId || a.employee_id) === String(record.employee_id)) ||
                             (record.employee_code && String(a.employee_code).trim().toUpperCase() === String(record.employee_code).trim().toUpperCase());
            const aDate = a.date ? String(a.date).slice(0, 10) : '';
            const rDate = record.date ? String(record.date).slice(0, 10) : '';
            return matchEmp && aDate === rDate;
          });
          if (match?.id) {
            return { ...record, id: match.id };
          }
        }
        return record;
      });
      await dispatch(createAttendancesBulk(enrichedPayloads)).unwrap();
      dispatch(getAllAttendances({ fetchAll: true }));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <div className="p-6 pt-16">
      {/* Tab Content */}
      <div className="space-y-4">
        <section className="animate-in fade-in duration-300">
          <div className="flex items-center justify-end gap-2 mb-3">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm cursor-pointer"
              title="Upload Excel to import attendance in bulk"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" x2="12" y1="3" y2="15"/>
              </svg>
              <span>Bulk Import</span>
            </button>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-100 shadow-sm cursor-pointer"
              title="Refresh Attendance Data"
            >
              <RotateCw size={16} className={`${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <DataTable
            columns={dailyColumns}
            data={attendancesWithSerial}
            title="Attendance Records"
            onEdit={onEditRow}
            onView={onViewRow}
            showActions={false}
            showAddActions={true}
            showColumnFilters={true}
            showExport={true}
            showPdfExport={true}
            filterPlaceholder="Search daily records..."
            disableFullDataFetch={true}
            virtualScroll={true}
            isShowPagination={false}
          />
        </section>
      </div>

      {/* Add/Edit Side Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              {isEditing ? 'Edit Attendance' : 'Add Attendance'}
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                </svg>
              </button>
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <section>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Attendance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date <span className="text-red-600">*</span></label>
                    <input type="date" className="input mt-1 w-full" {...register('date', { required: 'Required' })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee Name <span className="text-red-600">*</span></label>
                    <Controller
                      name="employeeId"
                      control={control}
                      rules={{ required: 'Required' }}
                      render={({ field }) => (
                        <CommonSearchableSelect className="mt-1" placeholder="Select Employee" options={employeeOptions} {...field} error={errors.employeeId?.message as string} />
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <input className="input mt-1 w-full bg-gray-50" value={employeeList?.find(e => String(e.id) === String(watch('employeeId')))?.employeeCode || ''} placeholder="Emp ID" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Check In {selectedStatus === 'Present' && <span className="text-red-600">*</span>}
                    </label>
                    <input
                      type="time"
                      className={`input mt-1 w-full ${errors.checkIn ? 'border-red-500' : ''}`}
                      {...register('checkIn', {
                        validate: (val) => {
                          if (watch('status') === 'Present' && !val) {
                            return 'Check In is required for Present status';
                          }
                          return true;
                        }
                      })}
                    />
                    {errors.checkIn && <p className="text-red-500 text-xs mt-1">{errors.checkIn.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Check Out {selectedStatus === 'Present' && <span className="text-red-600">*</span>}
                    </label>
                    <input
                      type="time"
                      className={`input mt-1 w-full ${errors.checkOut ? 'border-red-500' : ''}`}
                      {...register('checkOut', {
                        validate: (val) => {
                          if (watch('status') === 'Present' && !val) {
                            return 'Check Out is required for Present status';
                          }
                          return true;
                        }
                      })}
                    />
                    {errors.checkOut && <p className="text-red-500 text-xs mt-1">{errors.checkOut.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select className="input mt-1 w-full" {...register('status')}>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Leave">Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      OT Check-In <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      type="time"
                      className="input mt-1 w-full"
                      {...register('otCheckIn')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      OT Check-Out <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      type="time"
                      className="input mt-1 w-full"
                      {...register('otCheckOut')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      OT (Hrs) <span className="text-gray-400 text-xs font-normal">(Auto-calculated / Optional)</span>
                    </label>
                    <input
                      className="input mt-1 w-full bg-gray-50"
                      {...register('overtimeHours')}
                      placeholder="e.g. 2.00"
                    />
                  </div>
                </div>
              </section>
              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Processing...' : isEditing ? 'Update Attendance' : 'Save Attendance'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Attendance Details" className="max-w-2xl">
        {current && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="font-medium">Date:</span> {current.date}</p>
            <p><span className="font-medium">Status:</span> {current.status}</p>
            <p><span className="font-medium">Employee:</span> {current.employeeName}</p>
            <p><span className="font-medium">Emp ID:</span> {current.employeeCode || current.employeeId}</p>
            <p><span className="font-medium">Check In:</span> {formatTimeIST(current.checkIn)}</p>
            <p><span className="font-medium">Check Out:</span> {formatTimeIST(current.checkOut)}</p>
            <p><span className="font-medium">OT Check-In:</span> {formatTimeIST(current.otCheckIn)}</p>
            <p><span className="font-medium">OT Check-Out:</span> {formatTimeIST(current.otCheckOut)}</p>
            <p><span className="font-medium">OT (Hrs):</span> {current.overtimeHours ?? current.overtime_hours ?? current.ot_hours ?? '0'}</p>
            <p><span className="font-medium">Working Hours:</span> {current.workingHours || '-'}</p>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Attendance" className="max-w-md">
        <div className="space-y-4">
          <p>Are you sure you want to delete this attendance record?</p>
          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirmDelete}>Delete</button>
          </div>
        </div>
      </Modal>

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        type="attendance"
        onUploadConfirm={handleBulkUploadConfirm}
        employeesList={employeeList}
        existingAttendanceList={attendanceList}
      />
    </div>
  );
}
