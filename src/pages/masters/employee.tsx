import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createEmployeesBulk,
  type Employee,
  type SalaryHistoryItem,
  type PfWageCeilingHistoryItem
} from '@/state/employeeSlice';
import { getAllShifts, type ShiftTimingDetail } from '@/state/shiftSlice';
import { getSalaryReport } from '@/state/salarySlice';
import { getSubCategoryByCategory, getAllSubCategories } from '@/state/subCategorySlice';
import { fetchHolidays } from '@/state/holidaySlice';
import { DataTable } from '@/components/data/DataTable';
import { Pagination, usePagination } from '@/components/common/Pagination';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import mediaService, { MediaDetailResponse } from '@/services/MediaUploadService';
import { toast } from 'react-toastify';
import { BulkUploadModal } from '@/components/ui/BulkUploadModal';
import { CodesAPI } from '@/services/codes_api';
import { CodeDetail } from '@/types/codes';

type EmployeeFormData = Omit<Employee, 'id'> & { id?: number };

export default function EmployeePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { employeeList, loading, pagination } = useSelector((state: RootState) => state.employee);
  const { shiftList } = useSelector((state: RootState) => state.shift);
  const { salaryReportList } = useSelector((state: RootState) => state.salary);
  const { subCategoryByCategoryList, subCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { holidayList } = useSelector((state: RootState) => state.holiday);
  const { currentPage, itemsPerPage, setItemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingAadhaar, setIsUploadingAadhaar] = useState(false);
  const [isUploadingBankDoc, setIsUploadingBankDoc] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  // Salary Revision State
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryItem[]>([]);
  const [reviseFormData, setReviseFormData] = useState<SalaryHistoryItem>({
    salaryType: 'Monthly',
    basicSalary: 0,
    hra: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    otSalary: 0,
    isCanteen: false,
    effectiveDate: '',
    remarks: '',
  });

  const handleOpenReviseModal = () => {
    const currentSalary = watch('salaryDetails');
    const currentEmpDetails = watch('employmentDetails');
    setReviseFormData({
      department: currentEmpDetails?.department || '',
      designation: currentEmpDetails?.designation || '',
      salaryType: currentSalary?.salaryType || 'Monthly',
      basicSalary: Number(currentSalary?.basicSalary || 0),
      hra: Number(currentSalary?.hra || 0),
      conveyanceAllowance: Number(currentSalary?.conveyanceAllowance || 0),
      medicalAllowance: Number(currentSalary?.medicalAllowance || 0),
      specialAllowance: Number(currentSalary?.specialAllowance || 0),
      otSalary: Number(currentSalary?.otSalary || 0),
      isCanteen: Boolean(currentSalary?.isCanteen),
      effectiveDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setIsReviseModalOpen(true);
  };

  const handleAddSalaryRevision = () => {
    if (!reviseFormData.effectiveDate) {
      toast.error('Please select an Effective Date for salary revision');
      return;
    }
    if (reviseFormData.basicSalary === undefined || reviseFormData.basicSalary === null || isNaN(Number(reviseFormData.basicSalary))) {
      toast.error('Please enter a valid Basic Salary');
      return;
    }

    const newRevision: SalaryHistoryItem = {
      department: reviseFormData.department || '',
      designation: reviseFormData.designation || '',
      salaryType: reviseFormData.salaryType || 'Monthly',
      basicSalary: Number(reviseFormData.basicSalary || 0),
      hra: Number(reviseFormData.hra || 0),
      conveyanceAllowance: Number(reviseFormData.conveyanceAllowance || 0),
      medicalAllowance: Number(reviseFormData.medicalAllowance || 0),
      specialAllowance: Number(reviseFormData.specialAllowance || 0),
      otSalary: Number(reviseFormData.otSalary || 0),
      isCanteen: Boolean(reviseFormData.isCanteen),
      effectiveDate: reviseFormData.effectiveDate,
      remarks: reviseFormData.remarks || 'Salary Revision',
      createdAt: new Date().toISOString(),
    };

    const updatedHistory = [
      newRevision,
      ...salaryHistory.filter(item => item.effectiveDate !== newRevision.effectiveDate)
    ].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    setSalaryHistory(updatedHistory);

    // If this revision has the latest effective date, update the main form salaryDetails and employmentDetails
    if (updatedHistory[0].effectiveDate === newRevision.effectiveDate) {
      setValue('salaryDetails.salaryType', newRevision.salaryType as any);
      setValue('salaryDetails.basicSalary', newRevision.basicSalary);
      setValue('salaryDetails.hra', newRevision.hra);
      setValue('salaryDetails.conveyanceAllowance', newRevision.conveyanceAllowance);
      setValue('salaryDetails.medicalAllowance', newRevision.medicalAllowance);
      setValue('salaryDetails.specialAllowance', newRevision.specialAllowance);
      setValue('salaryDetails.otSalary', newRevision.otSalary);
      setValue('salaryDetails.isCanteen', Boolean(newRevision.isCanteen));
      setValue('salaryDetails.effectiveDate', newRevision.effectiveDate);

      if (newRevision.department) {
        setValue('employmentDetails.department', newRevision.department);
      }
      if (newRevision.designation) {
        setValue('employmentDetails.designation', newRevision.designation);
      }
    }

    toast.success('Salary revision added to history & employment details updated');
    setIsReviseModalOpen(false);
  };

  // PF Wage Ceiling Revision State
  const [isPfCeilingModalOpen, setIsPfCeilingModalOpen] = useState(false);
  const [pfWageCeilingHistory, setPfWageCeilingHistory] = useState<PfWageCeilingHistoryItem[]>([]);
  const [pfCeilingFormData, setPfCeilingFormData] = useState<PfWageCeilingHistoryItem>({
    pfWageCeiling: 15000,
    effectiveDate: '',
    remarks: '',
  });

  const handleOpenPfCeilingModal = () => {
    const currentCeiling = Number(watch('pfWageCeiling') ?? current?.pfWageCeiling ?? 15000);
    setPfCeilingFormData({
      pfWageCeiling: currentCeiling || 15000,
      effectiveDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setIsPfCeilingModalOpen(true);
  };

  const handleAddPfCeilingRevision = () => {
    if (!pfCeilingFormData.effectiveDate) {
      toast.error('Please select an Effective Date for PF ceiling revision');
      return;
    }
    const ceilingVal = Number(pfCeilingFormData.pfWageCeiling);
    if (isNaN(ceilingVal) || ceilingVal <= 0) {
      toast.error('Please enter a valid PF Wage Ceiling amount');
      return;
    }

    const newCeilingRevision: PfWageCeilingHistoryItem = {
      pfWageCeiling: ceilingVal,
      effectiveDate: pfCeilingFormData.effectiveDate,
      remarks: pfCeilingFormData.remarks || 'PF Wage Ceiling Revision',
      createdAt: new Date().toISOString(),
    };

    const updatedCeilingHistory = [
      newCeilingRevision,
      ...pfWageCeilingHistory.filter(item => item.effectiveDate !== newCeilingRevision.effectiveDate)
    ].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    setPfWageCeilingHistory(updatedCeilingHistory);

    // If this revision has the latest effective date, update the form value
    if (updatedCeilingHistory[0].effectiveDate === newCeilingRevision.effectiveDate) {
      setValue('pfWageCeiling', newCeilingRevision.pfWageCeiling);
    }

    toast.success('PF Wage Ceiling revision added to history');
    setIsPfCeilingModalOpen(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("Photo size should be less than 2MB");
        return;
      }

      setIsUploadingPhoto(true);
      try {
        const base64 = await mediaService.fileToBase64(file);
        const request = {
          base64File: base64,
          fileName: file.name,
          contentType: file.type,
          mediaType: mediaService.getMediaType(file),
          containerName: 'employee_image',
          isPublic: true
        };

        const response: MediaDetailResponse = await mediaService.uploadMedia(request);

        setValue('employeePhoto', response.mediaUrl);
        setValue('photoMediaDetailSno', response.mediaDetailSno);
        setValue('photoMediaSno', response.mediaSno);

        toast.success("Photo uploaded successfully");
      } catch (error) {
        console.error('Error uploading photo:', error);
        toast.error("Failed to upload photo");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleAadhaarCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for documents
        toast.error("Aadhaar Card size should be less than 5MB");
        return;
      }

      // Validate file type (PDF or image)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Aadhaar Card must be a PDF or image file (JPG, PNG)");
        return;
      }

      setIsUploadingAadhaar(true);
      try {
        const base64 = await mediaService.fileToBase64(file);
        const request = {
          base64File: base64,
          fileName: file.name,
          contentType: file.type,
          mediaType: mediaService.getMediaType(file),
          containerName: 'employee_aadhaar',
          isPublic: true
        };

        const response: MediaDetailResponse = await mediaService.uploadMedia(request);

        setValue('aadhaarCard', response.mediaUrl);

        toast.success("Aadhaar Card uploaded successfully");
      } catch (error) {
        console.error('Error uploading Aadhaar Card:', error);
        toast.error("Failed to upload Aadhaar Card");
      } finally {
        setIsUploadingAadhaar(false);
      }
    }
  };

  const handleBankDocumentsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit for bank documents)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return;
    }

    // Validate file type (PDF or image)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("File must be a PDF or image file (JPG, PNG)");
      return;
    }

    setIsUploadingBankDoc(true);
    try {
      const base64 = await mediaService.fileToBase64(file);
      const request = {
        base64File: base64,
        fileName: file.name,
        contentType: file.type,
        mediaType: mediaService.getMediaType(file),
        containerName: 'employee_bank_documents',
        isPublic: true
      };

      const response: MediaDetailResponse = await mediaService.uploadMedia(request);
      
      setValue('bankDetails.bankDocumentsUrl', response.mediaUrl);
      setValue('bankDetails.bankDocumentsMediaDetailSno', response.mediaDetailSno);
      setValue('bankDetails.bankDocumentsMediaSno', response.mediaSno);
      toast.success("Bank document uploaded successfully");
    } catch (error) {
      console.error('Error uploading bank document:', error);
      toast.error("Failed to upload bank document");
    } finally {
      setIsUploadingBankDoc(false);
      e.target.value = '';
    }
  };

  const removeBankDocument = () => {
    setValue('bankDetails.bankDocumentsUrl', '');
    setValue('bankDetails.bankDocumentsMediaDetailSno', undefined);
    setValue('bankDetails.bankDocumentsMediaSno', undefined);
    toast.success("Bank document removed");
  };

  const removeAadhaarCard = () => {
    setValue('aadhaarCard', '');
    toast.success("Aadhaar Card removed");
  };

  const openFileView = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    setValue,
    watch,
    control,
  } = useForm<EmployeeFormData>({
    mode: 'onChange',
    defaultValues: {
      gender: '',
      maritalStatus: '',
      bloodGroup: '',
      category: '',
      emergencyContactNumber: '',
      employeePhoto: '',
      aadhaarCard: '',
      photoMediaDetailSno: undefined,
      photoMediaSno: undefined,
      employmentDetails: {
        employeeType: '',
        status: 'Active',
        qualification: '',
        hostelFamilyQuarters: '',
        hostelFamilyQuartersRoomNo: '',
        houseRent: 0,
        isFestivalWageApplicable: 0,
      },
      pfApplicable: false,
      esiApplicable: false,
      pfPercent: 0,
      pfWageCeiling: 15000,
      esiPercent: 0,
      basicDaPercent: 0,
      hraPercent: 0,
      taPercent: 0,
      medicalPercent: 0,
      isRelieved: false,
      isEligibleFor28Days: false,
      isAllowance: false,
      isAdvance: false,
      productionIncentiveApplicable: false,
      attendanceIncentiveApplicable: false,
      foodAllowanceApplicable: false,
      festivalWagesApplicable: false,
      holidayDeductionApplicable: false,
      attendanceIncentive: 0,
      productionIncentive: 0,
      salaryDetails: {
        salaryType: '',
        perHourSalary: 0,
        otRatePerHour: 0,
        otSalary: 0,
        productionIncentive: 0,
        isCanteen: false,
        effectiveDate: '',
      },
      shiftDetails: {
        overtimeAllowed: false,
        noOfLeave: 0,
        lunchBreak: '',
      },
    },
  });

  const employeePhoto = watch('employeePhoto');
  const isCanteen = watch('salaryDetails.isCanteen');
  const pfApplicable = watch('pfApplicable');
  const esiApplicable = watch('esiApplicable');
  const productionIncentiveApplicable = watch('productionIncentiveApplicable');
  const attendanceIncentiveApplicable = watch('attendanceIncentiveApplicable');
  const selectedShiftName = watch('shiftDetails.shiftName') ?? '';
  const shiftStartTime = watch('shiftDetails.shiftStartTime');
  const shiftEndTime = watch('shiftDetails.shiftEndTime');

  const selectedShiftMaster = useMemo(() => {
    const normalizedName = String(selectedShiftName || '').trim().toLowerCase();
    return normalizedName
      ? shiftList.find(shift => String(shift.shiftName || '').trim().toLowerCase() === normalizedName) ?? null
      : null;
  }, [selectedShiftName, shiftList]);

  const calculateSlotWorkingHours = (
    timing?: Pick<ShiftTimingDetail, 'inTime' | 'outTime' | 'isNextDay'> | null
  ): number => {
    if (!timing || !timing.inTime || !timing.outTime) return 0;
    const [inH, inM] = timing.inTime.split(':').map(Number);
    const [outH, outM] = timing.outTime.split(':').map(Number);
    const inTotal = (inH || 0) * 60 + (inM || 0);
    let outTotal = (outH || 0) * 60 + (outM || 0);
    if (timing.isNextDay || outTotal < inTotal) {
      outTotal += 24 * 60;
    }
    return Number((Math.max(0, outTotal - inTotal) / 60).toFixed(2));
  };

  const handleShiftNameChange = (newShiftName: string) => {
    const normalizedName = String(newShiftName || '').trim().toLowerCase();
    const selectedShift = normalizedName
      ? shiftList.find(shift => String(shift.shiftName || '').trim().toLowerCase() === normalizedName) ?? null
      : null;

    if (selectedShift) {
      const timingDetails = Array.isArray(selectedShift.timingDetails)
        ? [...selectedShift.timingDetails].sort((a, b) => (Number(a.slotNumber) || 0) - (Number(b.slotNumber) || 0))
        : [];
      const firstTiming = timingDetails[0];

      // Shift Code: autofetch from selected shift, or clear if unassigned
      const shiftCode = selectedShift.shiftCode ? String(selectedShift.shiftCode).trim() : '';

      // Shift Start & End Time: strictly from 0th index timing, or clear if unassigned
      const startTime = firstTiming?.inTime ? String(firstTiming.inTime).slice(0, 5) : '';
      const endTime = firstTiming?.outTime ? String(firstTiming.outTime).slice(0, 5) : '';
      const breakStartTime = firstTiming?.breakStartTime
        ? String(firstTiming.breakStartTime).slice(0, 5)
        : '';
      const breakEndTime = firstTiming?.breakEndTime
        ? String(firstTiming.breakEndTime).slice(0, 5)
        : '';
      const breakDurationMinutes =
        Number(firstTiming?.breakDuration) || Number(firstTiming?.totalBreakHours || 0) * 60;

      // Total Working Hours uses the first timing slot's full duration, excluding no break time.
      const workingHours = firstTiming ? calculateSlotWorkingHours(firstTiming) : 0;

      setValue('shiftDetails.shiftCode', shiftCode, { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.shiftStartTime', startTime, { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.shiftEndTime', endTime, { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.breakStartTime', breakStartTime, { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.breakEndTime', breakEndTime, { shouldDirty: true, shouldValidate: true });
      setValue(
        'shiftDetails.lunchBreak',
        breakDurationMinutes > 0 ? `${breakDurationMinutes} mins` : '',
        { shouldDirty: true, shouldValidate: true }
      );
      setValue('shiftDetails.totalWorkingHours', workingHours, { shouldDirty: true, shouldValidate: true });
    } else {
      // If unassigned in shiftSlice or not selected, refresh and clear all autofetched fields
      setValue('shiftDetails.shiftCode', '', { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.shiftStartTime', '', { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.shiftEndTime', '', { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.breakStartTime', '', { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.breakEndTime', '', { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.lunchBreak', '', { shouldDirty: true, shouldValidate: true });
      setValue('shiftDetails.totalWorkingHours', 0, { shouldDirty: true, shouldValidate: true });
    }
  };

  const selectedShiftTimings = useMemo(
    () => [...(selectedShiftMaster?.timingDetails ?? [])].sort((a, b) => (Number(a.slotNumber) || 0) - (Number(b.slotNumber) || 0)),
    [selectedShiftMaster]
  );

  useEffect(() => {
    if (selectedShiftTimings.length > 0) {
      setValue(
        'shiftDetails.totalWorkingHours',
        calculateSlotWorkingHours(selectedShiftTimings[0])
      );
      return;
    }

    if (!shiftStartTime || !shiftEndTime) {
      if (!selectedShiftName || !selectedShiftMaster) {
        setValue('shiftDetails.totalWorkingHours', 0);
      }
      return;
    }

    const [startHour, startMinute] = shiftStartTime.split(':').map(Number);
    const [endHour, endMinute] = shiftEndTime.split(':').map(Number);
    const startMinutes = (startHour || 0) * 60 + (startMinute || 0);
    let endMinutes = (endHour || 0) * 60 + (endMinute || 0);

    if (endMinutes < startMinutes) endMinutes += 24 * 60;

    const calculatedHours = Number(((endMinutes - startMinutes) / 60).toFixed(2));
    setValue('shiftDetails.totalWorkingHours', calculatedHours);
  }, [selectedShiftMaster, selectedShiftTimings, shiftStartTime, shiftEndTime, selectedShiftName, setValue]);

  useEffect(() => {
    if (isModalOpen) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      dispatch(getSalaryReport(currentMonth));
    }
  }, [isModalOpen, dispatch]);

  // Updated PF Autofetch logic
  useEffect(() => {
    if (pfApplicable && salaryReportList && salaryReportList.length > 0) {
      // Find the report specific to the current employee
      const report = salaryReportList.find(r => String(r.employeeId) === String(current?.id));
      if (!watch('pfPercent')) {
        // Default to 0 if no report is found or pfDeduction is null
        setValue('pfPercent', report?.pfDeduction ?? 0);
      }
    }
  }, [pfApplicable, salaryReportList, setValue, watch, current?.id]);

  // Updated ESI Autofetch logic
  useEffect(() => {
    if (esiApplicable && salaryReportList && salaryReportList.length > 0) {
      // Find the report specific to the current employee
      const report = salaryReportList.find(r => String(r.employeeId) === String(current?.id));
      if (!watch('esiPercent')) {
        // Default to 0 if no report is found or esiDeduction is null
        setValue('esiPercent', report?.esiDeduction ?? 0);
      }
    }
  }, [esiApplicable, salaryReportList, setValue, watch, current?.id]);

  const bloodGroupOptions = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
  ];

  const categoryOptions = [
    { label: 'PF employee', value: 'PF employee' },
    { label: 'Non-PF employee', value: 'Non-PF employee' },
    { label: 'Guest', value: 'Guest' },
    { label: 'Security', value: 'Security' },
    { label: 'Others', value: 'Others' }
  ];

  const departmentOptions = useMemo(() => {
    if (Array.isArray(subCategoryByCategoryList) && subCategoryByCategoryList.length > 0) {
      return subCategoryByCategoryList.map((item: any) => ({
        label: item.subCategoryName || item.name || '',
        value: item.subCategoryName || item.name || ''
      }));
    }

    const fullList = Array.isArray(subCategoryList) ? subCategoryList : [];
    const filteredList = fullList.filter((item: any) => {
      if (!item) return false;
      const catName = String(item.categoryName || item.categorySno || '').trim().toLowerCase();
      return catName === 'department';
    });

    return filteredList.map((item: any) => ({
      label: item.subCategoryName || item.name || '',
      value: item.subCategoryName || item.name || ''
    }));
  }, [subCategoryByCategoryList, subCategoryList]);

  const [designationList, setDesignationList] = useState<CodeDetail[]>([]);

  useEffect(() => {
    CodesAPI.getCodeDetailsByHeader('Designation')
      .then((data) => {
        if (Array.isArray(data)) {
          setDesignationList(data);
        }
      })
      .catch((err) => console.error('Error fetching designations:', err));
  }, []);

  const designationOptions = useMemo(() => {
    const set = new Set<string>();

    if (Array.isArray(designationList) && designationList.length > 0) {
      designationList.forEach((item) => {
        if (item && item.is_active !== false) {
          const val = item.value || item.code;
          if (val && String(val).trim()) set.add(String(val).trim());
        }
      });
    }

    if (set.size === 0) {
      const defaults = [
        "GM", "DGM", "M-Planning", "AM-Warehouse", "Electrical Incharge", "Knotter", "Weaver",
        "Quality Supervisor", "Operator - C Unit", "Fabric Inspector", "Office Cleaning", "House Keeping",
        "Maintenance", "Electrical Assistant", "Group Fitter", "Warehouse Supervisor", "Warehouse Assistant",
        "Office Assistant", "Loadman", "Gaiter", "Incharge - C Unit", "Shed Incharge", "Shift Fitter",
        "Manpower + Grey Warehouse", "Shift Fitter Trainee", "Knotter Trainee", "Gaiter Trainee", "Pujari",
        "Electrical Helper", "Helper - C Unit", "Scavenger", "Trainee Knotter", "Loadman -C Unit",
        "Trainee Weaver", "Trainee Inspector", "Canteen - Helper", "Canteen - Master", "Canteen Helper",
        "Fitter", "Tsudakoma Incharge", "Scavanger", "Loom Cleaning"
      ];
      defaults.forEach(d => set.add(d));
    }

    if (Array.isArray(employeeList)) {
      employeeList.forEach((emp: any) => {
        const desig = emp.employmentDetails?.designation || emp.designation;
        if (desig && typeof desig === 'string' && desig.trim()) {
          set.add(desig.trim());
        }
      });
    }

    return Array.from(set).sort().map(desig => ({ label: desig, value: desig }));
  }, [designationList, employeeList]);

  const shiftOptions = useMemo(() => {
    const optionsByName = new Map<string, { label: string; value: string }>();
    const legacyOptions = (Array.isArray(subCategoryList) ? subCategoryList : [])
      .filter((item: any) => {
        const categoryName = String(item?.categoryName || item?.categorySno || '').trim().toLowerCase();
        return categoryName === 'shift';
      })
      .map((item: any) => {
        const name = String(item?.subCategoryName || item?.name || '').trim();
        return { label: name, value: name };
      })
      .filter(option => option.value);

    legacyOptions.forEach(option => optionsByName.set(option.value.toLowerCase(), option));
    shiftList
      .filter(shift => shift.activeFlag !== false && shift.shiftName.trim())
      .forEach(shift => {
        optionsByName.set(shift.shiftName.trim().toLowerCase(), {
          label: shift.shiftName,
          value: shift.shiftName
        });
      });

    const options = Array.from(optionsByName.values());
    const selectedName = String(selectedShiftName).trim();

    if (selectedName && !options.some(option => option.value.toLowerCase() === selectedName.toLowerCase())) {
      return [{ label: selectedName, value: selectedName }, ...options];
    }

    return options;
  }, [selectedShiftName, shiftList, subCategoryList]);

  useEffect(() => {
    dispatch(getAllEmployees({ fetchAll: true }));
    dispatch(getSubCategoryByCategory({ categoryName: "Department", fetchAll: true }));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(fetchHolidays());
  }, [currentPage, dispatch, itemsPerPage, getOffset]);

  useEffect(() => {
    dispatch(getAllShifts({ fetchAll: true }));
  }, [dispatch]);

  const currentMonthInfo = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;
    const monthName = now.toLocaleString('en-US', { month: 'long' });

    const count = (holidayList || []).filter((h: any) => 
      h.holidayDate && String(h.holidayDate).startsWith(monthStr)
    ).length;

    return { monthStr, monthName, count };
  }, [holidayList]);

  const columns = useMemo(() => [
    { Header: 'Sl No', accessor: 'serialNo' },
    { Header: 'Emp ID', accessor: 'employeeCode' },
    { Header: 'Employee Name', accessor: 'employeeName' },
    { Header: 'Department', accessor: (row: any) => row.employmentDetails?.department || row.department || '-' },
    { Header: 'Designation', accessor: (row: any) => row.employmentDetails?.designation || row.designation || '-' },
    { Header: 'Qualification', accessor: (row: any) => row.employmentDetails?.qualification || '-' },
    { Header: 'Mobile', accessor: 'mobileNumber' },
    { Header: 'Status', accessor: (row: any) => row.employmentDetails?.status || '-' },
    { Header: 'Is Relieved', accessor: (row: any) => row.isRelieved ? 'Yes' : 'No' },
  ], []);

  const employeesWithSerial = useMemo(() => {
    return (employeeList || []).map((emp, index) => ({
      ...emp,
      serialNo: getOffset() + index + 1
    }));
  }, [employeeList, getOffset]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrent(null);

    // Generate unique random employee code
    const existingCodes = (employeeList || []).map(emp => emp.employeeCode);
    let newCode = '';
    let isUnique = false;
    while (!isUnique) {
      newCode = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!existingCodes.includes(newCode)) {
        isUnique = true;
      }
    }

    reset({
      employeeCode: newCode,
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
      bloodGroup: '',
      category: '',
      emergencyContactNumber: '',
      employeePhoto: '',
      aadhaarCard: '',
      photoMediaDetailSno: undefined,
      photoMediaSno: undefined,
      uanNumber: '',
      pfNumber: '',
      pfJoiningDate: '',
      esiNumber: '',
      pfApplicable: false,
      esiApplicable: false,
      pfPercent: 0,
      pfWageCeiling: 15000,
      esiPercent: 0,
      basicDaPercent: 0,
      hraPercent: 0,
      taPercent: 0,
      medicalPercent: 0,
      isRelieved: false,
      isEligibleFor28Days: false,
      isAllowance: false,
      isAdvance: false,
      productionIncentiveApplicable: false,
      attendanceIncentiveApplicable: false,
      foodAllowanceApplicable: false,
      festivalWagesApplicable: false,
      holidayDeductionApplicable: false,
      attendanceIncentive: 0,
      productionIncentive: 0,
      employmentDetails: {
        department: '',
        designation: '',
        joiningDate: '',
        employeeType: '',
        status: 'Active',
        qualification: '',
        hostelFamilyQuarters: '',
        hostelFamilyQuartersRoomNo: '',
        houseRent: 0,
        isFestivalWageApplicable: 0,
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
        perHourSalary: 0,
        otRatePerHour: 0,
        otSalary: 0,
        productionIncentive: 0,
        isCanteen: false,
        effectiveDate: '',
      },
      shiftDetails: {
        shiftName: '',
        shiftCode: '',
        shiftStartTime: '',
        shiftEndTime: '',
        breakStartTime: '',
        breakEndTime: '',
        lunchBreak: '',
        totalWorkingHours: 0,
        weeklyOffDay: '',
        overtimeAllowed: false,
        lateEntryAllowedMinutes: 0,
        shiftEffectiveFrom: '',
        noOfLeave: 0,
      },
      bankDetails: {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        bankDocumentsUrl: '',
        bankDocumentsMediaDetailSno: undefined,
        bankDocumentsMediaSno: undefined,
      },
    });
    setSalaryHistory([]);
    setPfWageCeilingHistory([]);
    setActiveTab("personal");
    setIsModalOpen(true);
  };

  const onEditRow = (row: Employee) => {
    setIsEditing(true);
    setCurrent(row);
    setSalaryHistory(row.salaryHistory || []);
    setPfWageCeilingHistory(row.pfWageCeilingHistory || []);
    
    const isFestWage = Boolean(
      row.festivalWagesApplicable === 1 || 
      row.festivalWagesApplicable === true ||
      (row.employmentDetails as any)?.isFestivalWageApplicable === 1 ||
      (row.employmentDetails as any)?.isFestivalWageApplicable === true
    );

    const isHolidayDeduction = Boolean(
      row.holidayDeductionApplicable === 1 || 
      row.holidayDeductionApplicable === true ||
      (row.employmentDetails as any)?.isHolidayDeductionApplicable === 1 ||
      (row.employmentDetails as any)?.isHolidayDeductionApplicable === true
    );

    // Convert PF and ESI percentages back to percentage format for display
    const editData = {
      ...row,
      isRelieved: Boolean(row.isRelieved === 1 || row.isRelieved === true),
      isAllowance: Boolean(row.isAllowance === 1 || row.isAllowance === true),
      isAdvance: Boolean(row.isAdvance === 1 || row.isAdvance === true),
      productionIncentiveApplicable: Boolean(row.productionIncentiveApplicable === 1 || row.productionIncentiveApplicable === true),
      attendanceIncentiveApplicable: Boolean(row.attendanceIncentiveApplicable === 1 || row.attendanceIncentiveApplicable === true),
      foodAllowanceApplicable: Boolean(row.foodAllowanceApplicable === 1 || row.foodAllowanceApplicable === true),
      festivalWagesApplicable: isFestWage,
      holidayDeductionApplicable: isHolidayDeduction,
      salaryDetails: row.salaryDetails ? {
        ...row.salaryDetails,
        isCanteen: Boolean(row.salaryDetails.isCanteen === 1 || row.salaryDetails.isCanteen === true),
      } : undefined,
      employmentDetails: {
        ...row.employmentDetails,
        isFestivalWageApplicable: isFestWage ? 1 : 0,
        qualification: row.employmentDetails?.qualification || '',
        isHolidayDeductionApplicable: isHolidayDeduction ? 1 : 0,
      },
      pfPercent: row.pfPercent ? row.pfPercent * 100 : 0,
      pfWageCeiling: row.pfWageCeiling ?? (row.pfWageCeilingHistory?.[0]?.pfWageCeiling ?? 15000),
      esiPercent: row.esiPercent ? row.esiPercent * 100 : 0,
      basicDaPercent: row.basicDaPercent ? row.basicDaPercent * 100 : 0,
      hraPercent: row.hraPercent ? row.hraPercent * 100 : 0,
      taPercent: row.taPercent ? row.taPercent * 100 : 0,
      medicalPercent: row.medicalPercent ? row.medicalPercent * 100 : 0,
    };
    
    reset(editData);
    setActiveTab("personal");
    setIsModalOpen(true);
  };

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const isFestWage = Boolean(
        data.festivalWagesApplicable || 
        (data.employmentDetails as any)?.isFestivalWageApplicable
      );

      const isHolidayDeduction = Boolean(
        data.holidayDeductionApplicable || 
        (data.employmentDetails as any)?.isHolidayDeductionApplicable
      );

      const payload = {
        ...data,
        isRelieved: data.isRelieved ? 1 : 0,
        isAllowance: data.isAllowance ? 1 : 0,
        isAdvance: data.isAdvance ? 1 : 0,
        productionIncentiveApplicable: data.productionIncentiveApplicable ? 1 : 0,
        attendanceIncentiveApplicable: data.attendanceIncentiveApplicable ? 1 : 0,
        foodAllowanceApplicable: data.foodAllowanceApplicable ? 1 : 0,
        festivalWagesApplicable: isFestWage ? 1 : 0,
        holidayDeductionApplicable: isHolidayDeduction ? 1 : 0,
        pfWageCeiling: Number(data.pfWageCeiling || 15000),
        pfWageCeilingHistory: (pfWageCeilingHistory || []).map(ch => ({
          ...ch,
          employeeId: current?.id || ch.employeeId,
          pfWageCeiling: Number(ch.pfWageCeiling || data.pfWageCeiling || 15000),
        })),
        salaryHistory: (salaryHistory || []).map(sh => ({
          ...sh,
          employeeId: current?.id || sh.employeeId,
          isCanteen: sh.isCanteen ? 1 : 0,
        })),
        salaryDetails: data.salaryDetails ? {
          ...data.salaryDetails,
          isCanteen: data.salaryDetails.isCanteen ? 1 : 0,
        } : undefined,
        employmentDetails: {
          ...data.employmentDetails,
          isFestivalWageApplicable: isFestWage ? 1 : 0,
          qualification: data.employmentDetails?.qualification || '',
          isHolidayDeductionApplicable: isHolidayDeduction ? 1 : 0,
        },
      } as unknown as Employee;

      if (isEditing && current?.id) {
        await dispatch(updateEmployee({ ...payload, id: current.id })).unwrap();
      } else {
        await dispatch(createEmployee(payload)).unwrap();
        resetPage();
      }
      dispatch(getAllEmployees({ fetchAll: true }));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

  const onInvalid = () => {
    toast.error("Please fill required fields");
  };

  const handleBulkUploadConfirm = async (parsedData: any[]) => {
    try {
      await dispatch(createEmployeesBulk(parsedData)).unwrap();
      dispatch(getAllEmployees({ fetchAll: true }));
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const headerActions = useMemo(() => (
    <button
      onClick={() => setIsBulkModalOpen(true)}
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
      title="Upload Excel to import employees in bulk"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" x2="12" y1="3" y2="15"/>
      </svg>
      <span>Bulk Import</span>
    </button>
  ), []);

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={employeesWithSerial}
        title="Employee"
        onAdd={openAddModal}
        onEdit={onEditRow}
        showActions={true}
        showAddActions={true}
        showExport={true}
        showColumnFilters={true}
        filterPlaceholder="Search employees..."
        headerActions={headerActions}
        disableFullDataFetch={true}
        virtualScroll={true}
        isShowPagination={false}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        type="employee"
        onUploadConfirm={handleBulkUploadConfirm}
      />

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              {isEditing ? 'Edit Employee' : 'Add Employee'}
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                </svg>
              </button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
              <div className="flex gap-6 border-b mb-6 overflow-x-auto">
                {["personal", "employment", "salary", "shift", "bank"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`pb-2 px-2 transition-all whitespace-nowrap ${activeTab === tab
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
                    <div className="flex items-start gap-6 mb-4">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 ${employeePhoto && !isUploadingPhoto ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                          onClick={() => { if (employeePhoto && !isUploadingPhoto) setPhotoPreviewOpen(true); }}
                          title={employeePhoto ? 'Click to view photo' : undefined}
                        >
                          {isUploadingPhoto ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span className="text-[10px] text-gray-400 mt-1">Uploading...</span>
                            </div>
                          ) : employeePhoto ? (
                            <img src={employeePhoto} alt="Employee Preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-400">Photo</span>
                          )}
                        </div>
                        <label className={`cursor-pointer text-blue-600 text-xs font-medium hover:underline ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                          {employeePhoto ? 'Change Photo' : 'Upload Photo'}
                          <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} disabled={isUploadingPhoto} />
                        </label>
                      </div>
                      <div className="grid grid-cols-4 gap-4 flex-1">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                          <input className="input mt-1 w-full" {...register('employeeCode')} placeholder="Enter Employee ID" />
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
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Father / Husband Name</label>
                        <input className="input mt-1 w-full" {...register('fatherHusbandName')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                        <input className="input mt-1 w-full" {...register('mobileNumber')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Emergency Contact No</label>
                        <input className="input mt-1 w-full" {...register('emergencyContactNumber', {
                          pattern: { value: /^[0-9]*$/, message: 'Digits only' }
                        })} />
                        {errors.emergencyContactNumber && <span className="text-red-500 text-xs">{errors.emergencyContactNumber.message}</span>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" className="input mt-1 w-full" {...register('email')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                        <Controller
                          name="bloodGroup"
                          control={control}
                          render={({ field }) => (
                            <CommonSearchableSelect
                              {...field}
                              options={bloodGroupOptions}
                              placeholder="Select Blood Group"
                              className="mt-1"
                            />
                          )}
                        />
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
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <CommonSearchableSelect
                              {...field}
                              options={categoryOptions}
                              placeholder="Select Category"
                              className="mt-1"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
                        <input className="input mt-1 w-full" {...register('aadhaarNumber', {
                          pattern: { value: /^\d{12}$/, message: 'Must be 12 digits' }
                        })} maxLength={12} />
                        {errors.aadhaarNumber && <span className="text-red-500 text-xs">{errors.aadhaarNumber.message}</span>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Aadhaar Card Upload</label>
                        <div className="mt-1 flex items-center gap-4">
                          <input
                            type="file"
                            className="hidden"
                            id="aadhaarCardUpload"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleAadhaarCardChange}
                            disabled={isUploadingAadhaar}
                          />
                          <label
                            htmlFor="aadhaarCardUpload"
                            className={`cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium ${
                              isUploadingAadhaar ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {isUploadingAadhaar ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white inline-block"></span>
                                Uploading...
                              </span>
                            ) : 'Choose File'}
                          </label>
                          {watch('aadhaarCard') && !isUploadingAadhaar && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-gray-600">Uploaded</span>
                              <button
                                type="button"
                                onClick={() => openFileView(watch('aadhaarCard'))}
                                className="text-blue-600 hover:text-blue-800 text-sm underline font-medium"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={removeAadhaarCard}
                                className="text-red-600 hover:text-red-800 text-sm underline font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Upload Aadhaar Card (PDF, JPG, PNG - Max 5MB)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                        <input className="input mt-1 w-full" {...register('panNumber', {
                          pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, message: 'Invalid PAN format (e.g., ABCDE1234F)' }
                        })} maxLength={10} />
                        {errors.panNumber && <span className="text-red-500 text-xs">{errors.panNumber.message}</span>}
                      </div>

                      {pfApplicable && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">PF Number <span className="text-red-600">*</span></label>
                            <input className="input mt-1 w-full" {...register('pfNumber', {
                              required: 'Required',
                              validate: (value) => {
                                if (!value) return true;
                                const exists = (employeeList || []).some(emp => emp.pfNumber === value && emp.id !== current?.id);
                                return exists ? 'PF Number already exists' : true;
                              }
                            })} />
                            {errors.pfNumber && <span className="text-red-500 text-xs">{errors.pfNumber.message}</span>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">PF Percentage (%)</label>
                            <input type="number" step="0.01" className="input mt-1 w-full" {...register('pfPercent')} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">PF Wage Ceiling (₹)</label>
                            <input type="number" step="0.01" placeholder="15000" className="input mt-1 w-full font-semibold" {...register('pfWageCeiling')} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">PF Joining Date</label>
                            <input type="date" className="input mt-1 w-full" {...register('pfJoiningDate')} />
                            {errors.pfJoiningDate && <span className="text-red-500 text-xs">{errors.pfJoiningDate.message}</span>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Basic/DA Percentage (%)</label>
                            <input type="number" step="0.01" className="input mt-1 w-full" {...register('basicDaPercent')} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">HRA Percentage (%)</label>
                            <input type="number" step="0.01" className="input mt-1 w-full" {...register('hraPercent')} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">TA Percentage (%)</label>
                            <input type="number" step="0.01" className="input mt-1 w-full" {...register('taPercent')} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Medical Percentage (%)</label>
                            <input type="number" step="0.01" className="input mt-1 w-full" {...register('medicalPercent')} />
                          </div>
                        </>
                      )}

                      {esiApplicable && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">ESI Number <span className="text-red-600">*</span></label>
                            <input className="input mt-1 w-full" {...register('esiNumber', {
                              required: 'Required',
                              validate: (value) => {
                                if (!value) return true;
                                const exists = (employeeList || []).some(emp => emp.esiNumber === value && emp.id !== current?.id);
                                return exists ? 'ESI Number already exists' : true;
                              }
                            })} />
                            {errors.esiNumber && <span className="text-red-500 text-xs">{errors.esiNumber.message}</span>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">ESI Percentage (%)</label>
                            <input type="number" step="0.01" className="input mt-1 w-full" {...register('esiPercent')} />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <textarea
                          className="input mt-1 w-full"
                          rows={3}
                          {...register('address')}
                        />
                      </div>
                    </div>
                    <div className="flex gap-6 flex-row mt-4">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="pfApplicable" {...register('pfApplicable')} className="h-6 w-6 cursor-pointer" />
                        <label htmlFor="pfApplicable" className="text-sm font-medium text-gray-700 cursor-pointer">PF Applicable</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="esiApplicable" {...register('esiApplicable')} className="h-6 w-6 cursor-pointer" />
                        <label htmlFor="esiApplicable" className="text-sm font-medium text-gray-700 cursor-pointer">ESI Applicable</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isRelieved" {...register('isRelieved')} className="h-6 w-6 cursor-pointer" />
                        <label htmlFor="isRelieved" className="text-sm font-medium text-gray-700 cursor-pointer">Is Relieved</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isAllowance" {...register('isAllowance')} className="h-6 w-6 cursor-pointer" />
                        <label htmlFor="isAllowance" className="text-sm font-medium text-gray-700 cursor-pointer">Allowance</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isAdvance" {...register('isAdvance')} className="h-6 w-6 cursor-pointer" />
                        <label htmlFor="isAdvance" className="text-sm font-medium text-gray-700 cursor-pointer">Advance</label>
                      </div>
                    </div>

                    {pfApplicable && (
                      <div className="border border-blue-200 bg-blue-50/20 rounded-lg p-4 mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded text-blue-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <span>PF Wage Ceiling Revision History</span>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                  {pfWageCeilingHistory.length} Record{pfWageCeilingHistory.length !== 1 ? 's' : ''}
                                </span>
                              </h4>
                              <p className="text-xs text-gray-500">Configure historical date/month-wise PF Wage Ceiling limits for salary PF deductions (Default: ₹15,000).</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenPfCeilingModal}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>+ Revise PF Ceiling</span>
                          </button>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-50 text-gray-700">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold">#</th>
                                <th className="px-3 py-2 text-left font-semibold">Effective Date</th>
                                <th className="px-3 py-2 text-right font-semibold">PF Wage Ceiling (₹)</th>
                                <th className="px-3 py-2 text-left font-semibold">Remarks / Reason</th>
                                <th className="px-3 py-2 text-center font-semibold">Status</th>
                                <th className="px-3 py-2 text-center font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {pfWageCeilingHistory.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-3 py-4 text-center text-gray-500 italic">
                                    No PF wage ceiling revision history found. Default ceiling (₹15,000) will be applied. Click "+ Revise PF Ceiling" to add custom effective ceiling.
                                  </td>
                                </tr>
                              ) : (
                                pfWageCeilingHistory.map((item, index) => {
                                  const isLatest = index === 0;
                                  return (
                                    <tr key={index} className={isLatest ? 'bg-blue-50/50 font-medium' : 'hover:bg-gray-50'}>
                                      <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                                      <td className="px-3 py-2 text-gray-900 font-semibold">{item.effectiveDate || '-'}</td>
                                      <td className="px-3 py-2 text-right text-gray-900 font-bold text-sm text-blue-700">
                                        ₹{Number(item.pfWageCeiling || 15000).toLocaleString('en-IN')}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 truncate max-w-[200px]">{item.remarks || '-'}</td>
                                      <td className="px-3 py-2 text-center">
                                        {isLatest ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Current Active</span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Historical</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = pfWageCeilingHistory.filter((_, i) => i !== index);
                                            setPfWageCeilingHistory(updated);
                                            if (updated.length > 0) {
                                              setValue('pfWageCeiling', updated[0].pfWageCeiling);
                                            } else {
                                              setValue('pfWageCeiling', 15000);
                                            }
                                            toast.info('PF ceiling revision removed');
                                          }}
                                          className="text-red-600 hover:text-red-800 text-xs font-medium hover:underline"
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    <div className="hidden">
                      <div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "employment" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <Controller
                          name="employmentDetails.department"
                          control={control}
                          render={({ field }) => (
                            <CommonSearchableSelect
                              {...field}
                              options={departmentOptions}
                              placeholder="Select Department"
                              className="mt-1"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Designation</label>
                        <Controller
                          name="employmentDetails.designation"
                          control={control}
                          render={({ field }) => (
                            <CommonSearchableSelect
                              {...field}
                              options={designationOptions}
                              placeholder="Select Designation"
                              className="mt-1"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Qualification</label>
                        <input
                          className="input mt-1 w-full"
                          {...register('employmentDetails.qualification')}
                          placeholder="Enter Qualification"
                        />
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
                          <option value="Temporary">Temporary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select className="input mt-1 w-full" {...register('employmentDetails.status')}>
                          <option value="Active">Active</option>
                          <option value="Relieved">Relieved</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hostel / Family Quarters</label>
                        <select className="input mt-1 w-full" {...register('employmentDetails.hostelFamilyQuarters')}>
                          <option value="">Select Option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hostel / Family Quarters Room No</label>
                        <input className="input mt-1 w-full" {...register('employmentDetails.hostelFamilyQuartersRoomNo')} placeholder="Enter Room No" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">House Rent</label>
                        <input type="number" step="0.01" className="input mt-1 w-full" {...register('employmentDetails.houseRent', { valueAsNumber: true })} placeholder="Enter House Rent" />
                      </div>
                    </div>
                    <div className="flex gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="productionIncentiveApplicable"
                          className="h-5 w-5"
                          {...register('productionIncentiveApplicable')}
                        />
                        <label htmlFor="productionIncentiveApplicable" className="text-sm font-medium text-gray-700">
                          Prod. Incentive
                        </label>
                        <input
                          type="number"
                          placeholder="Amount"
                          className={`input mt-1 w-24 ${!productionIncentiveApplicable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          {...register('productionIncentive', { 
                            valueAsNumber: true,
                            disabled: !productionIncentiveApplicable
                          })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="attendanceIncentiveApplicable"
                          className="h-5 w-5"
                          {...register('attendanceIncentiveApplicable')}
                        />
                        <label htmlFor="attendanceIncentiveApplicable" className="text-sm font-medium text-gray-700">
                          Att. Incentive
                        </label>
                        <input
                          type="number"
                          placeholder="Amount"
                          className={`input mt-1 w-24 ${!attendanceIncentiveApplicable ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          {...register('attendanceIncentive', { 
                            valueAsNumber: true,
                            disabled: !attendanceIncentiveApplicable
                          })}
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="foodAllowanceApplicable"
                          className="mr-2 h-5 w-5"
                          {...register('foodAllowanceApplicable')}
                        />
                        <label htmlFor="foodAllowanceApplicable" className="text-sm font-medium text-gray-700">
                          Food Allowance
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="festivalWagesApplicable"
                          className="mr-2 h-5 w-5"
                          {...register('festivalWagesApplicable')}
                        />
                        <label htmlFor="festivalWagesApplicable" className="text-sm font-medium text-gray-700">
                          Festival Wages
                        </label>
                      </div>
                      <div className="flex items-center gap-2 border-l pl-4 ml-2 border-gray-300">
                        <input
                          type="checkbox"
                          id="holidayDeductionApplicable"
                          className="h-5 w-5 cursor-pointer accent-amber-600"
                          {...register('holidayDeductionApplicable')}
                        />
                        <label htmlFor="holidayDeductionApplicable" className="text-sm font-semibold text-gray-800 cursor-pointer flex items-center gap-2">
                          <span>Holiday Deduction Applicable</span>
                        </label>
                        {watch('holidayDeductionApplicable') && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold border border-amber-300 rounded-md text-xs shadow-sm flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            Holidays for current month ({currentMonthInfo.monthName}): <span className="text-amber-900 underline font-extrabold">{currentMonthInfo.count}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "salary" && (
                  <div className="space-y-6">
                    {/* Header with Revise Salary Button */}
                    <div className="flex items-center justify-between border-b pb-3 bg-gray-50 p-3 rounded-lg border">
                      <div>
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Active Salary Structure</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Current salary configuration. Click "+ Revise Salary" to apply increments or adjustments without affecting past salary records.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenReviseModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Revise Salary
                      </button>
                    </div>

                    {/* Main Salary Fields */}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Salary Type</label>
                        <select className="input mt-1 w-full" {...register('salaryDetails.salaryType')}>
                          <option value="">Select Type</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Daily">Daily</option>
                          <option value="Hourly">Hourly</option>
                          <option value="28 days">28 days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Basic Salary (₹)</label>
                        <input type="number" className="input mt-1 w-full font-bold text-gray-900" {...register('salaryDetails.basicSalary')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">HRA (₹)</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.hra')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">DA (₹)</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.conveyanceAllowance')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Medical Allowance (₹)</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.medicalAllowance')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">TA (₹)</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.specialAllowance')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">OT Salary (₹)</label>
                        <input type="number" className="input mt-1 w-full" {...register('salaryDetails.otSalary')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                        <input type="date" className="input mt-1 w-full" {...register('salaryDetails.effectiveDate')} />
                      </div>
                      <div className="flex items-center space-x-2 mt-6">
                        <input type="checkbox" id="isCanteen" {...register('salaryDetails.isCanteen')} className="h-5 w-5 text-blue-600 rounded cursor-pointer" />
                        <label htmlFor="isCanteen" className="text-sm font-medium text-gray-700 cursor-pointer">Is Canteen</label>
                      </div>
                    </div>

                    {/* Salary Revision History Section */}
                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Salary Revision History</span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                            {salaryHistory.length} Record{salaryHistory.length !== 1 ? 's' : ''}
                          </span>
                        </h4>
                      </div>

                      {salaryHistory.length === 0 ? (
                        <div className="text-center py-6 text-xs text-gray-500 border border-dashed rounded-lg bg-gray-50">
                          <p className="font-medium text-gray-600 mb-1">No past salary revisions recorded for this employee.</p>
                          <p>Click the <strong className="text-blue-600">+ Revise Salary</strong> button above to record a new salary revision with an effective date.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border rounded-lg shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600">Effective Date</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600">Department</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600">Designation</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600">Type</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-600">Basic Salary</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-600">HRA</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-600">DA</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-600">Medical</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-600">TA</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-600">OT Salary</th>
                                <th className="px-3 py-2 text-center font-semibold text-gray-600">Canteen</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600">Remarks</th>
                                <th className="px-3 py-2 text-center font-semibold text-gray-600">Status</th>
                                <th className="px-3 py-2 text-center font-semibold text-gray-600">Action</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {salaryHistory.map((item, index) => {
                                const isLatest = index === 0;
                                return (
                                  <tr key={index} className={isLatest ? 'bg-blue-50/50 font-medium' : 'hover:bg-gray-50'}>
                                    <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                                    <td className="px-3 py-2 text-gray-900 font-semibold">{item.effectiveDate || '-'}</td>
                                    <td className="px-3 py-2 text-gray-700 font-medium">{item.department || '-'}</td>
                                    <td className="px-3 py-2 text-gray-700 font-medium">{item.designation || '-'}</td>
                                    <td className="px-3 py-2 text-gray-700">{item.salaryType || '-'}</td>
                                    <td className="px-3 py-2 text-right text-gray-900 font-bold">₹{Number(item.basicSalary || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">₹{Number(item.hra || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">₹{Number(item.conveyanceAllowance || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">₹{Number(item.medicalAllowance || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">₹{Number(item.specialAllowance || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">₹{Number(item.otSalary || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-3 py-2 text-center">
                                      {item.isCanteen ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Yes</span>
                                      ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">No</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600 truncate max-w-[150px]">{item.remarks || '-'}</td>
                                    <td className="px-3 py-2 text-center">
                                      {isLatest ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Current Active</span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Historical</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSalaryHistory(prev => prev.filter((_, i) => i !== index));
                                          toast.info('Salary revision removed from list');
                                        }}
                                        className="text-red-600 hover:text-red-800 text-xs font-medium hover:underline"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "shift" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Shift Name</label>
                        <select
                          className="input mt-1 w-full"
                          {...register('shiftDetails.shiftName', {
                            onChange: (event) => handleShiftNameChange(event.target.value)
                          })}
                        >
                          <option value="">Select Shift</option>
                          {shiftOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
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
                        <label className="block text-sm font-medium text-gray-700">Lunch Break</label>
                        <input className="input mt-1 w-full" {...register('shiftDetails.lunchBreak')} placeholder="e.g. 40mins" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Working Hours</label>
                        <input type="number" step="0.01" readOnly className="input mt-1 w-full" {...register('shiftDetails.totalWorkingHours')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Weekly Off Day
                        </label>
                        <select
                          className="input mt-1 w-full"
                          {...register('shiftDetails.weeklyOffDay')}
                        >
                          <option value="">Select Day</option>
                          <option value="Sunday">Sunday</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 mt-8">
                        <input type="checkbox" id="overtimeAllowed" {...register('shiftDetails.overtimeAllowed')} className="h-6 w-6 cursor-pointer" />
                        <label htmlFor="overtimeAllowed" className="text-sm font-medium text-gray-700 cursor-pointer">Overtime Allowed</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Late Entry Allowed (Mins)</label>
                        <input type="number" className="input mt-1 w-full" {...register('shiftDetails.lateEntryAllowedMinutes')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Effective From Date</label>
                        <input type="date" className="input mt-1 w-full" {...register('shiftDetails.shiftEffectiveFrom')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">No of Leave</label>
                        <input type="number" className="input mt-1 w-full" {...register('shiftDetails.noOfLeave')} />
                      </div>
                    </div>
                    {selectedShiftMaster && (
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-3 text-sm font-semibold text-gray-700">Shift Timing Slots</h3>
                        {selectedShiftTimings.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {selectedShiftTimings.map((timing) => (
                              <div key={timing.id ?? timing.slotNumber} className="rounded border border-gray-200 bg-white p-3">
                                <div className="text-sm font-medium text-gray-700">Slot {timing.slotNumber}</div>
                                <div className="mt-1 text-sm text-gray-600">
                                  {timing.inTime?.slice(0, 5) || '--:--'} – {timing.outTime?.slice(0, 5) || '--:--'}
                                  {timing.isNextDay ? ' (next day)' : ''}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {Number(timing.workingHours || 0).toFixed(2)} working hours
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No timing slots configured for this shift.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "bank" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
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
                    
                    <div className="mt-6 max-w-md">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Bank Document</label>
                      <div className={`border-2 border-dashed rounded-lg p-3 transition-colors ${isUploadingBankDoc ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}>
                        {isUploadingBankDoc ? (
                          <div className="flex flex-col items-center justify-center py-4 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-blue-600 font-medium">Uploading document...</p>
                            <p className="text-xs text-gray-400">Please wait</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <input
                                  type="file"
                                  id="bankDocuments"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={handleBankDocumentsChange}
                                  disabled={isUploadingBankDoc}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="bankDocuments"
                                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  Choose File
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Upload bank document (PDF, JPG, PNG - Max 10MB)</p>
                              </div>
                            </div>

                            {watch('bankDetails.bankDocumentsUrl') && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">Uploaded Document:</h4>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">Bank Document</p>
                                      <p className="text-xs text-gray-500">Uploaded successfully</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => window.open(watch('bankDetails.bankDocumentsUrl'), '_blank')}
                                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={removeBankDocument}
                                      className="text-red-600 hover:text-red-800 text-sm underline"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary" disabled={loading}>
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

      {/* Revise Salary Modal */}
      {isReviseModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Revise Employee Salary</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReviseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-600 bg-blue-50 p-2.5 rounded-md border border-blue-100">
              Set the new salary structure and effective date. This will record a new revision in the employee's history while preserving all previous salary records.
            </p>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="col-span-1">
                <label className="block font-semibold text-gray-700 mb-1">Effective Date *</label>
                <input
                  type="date"
                  className="input w-full"
                  value={reviseFormData.effectiveDate}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, effectiveDate: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold text-gray-700 mb-1">Department</label>
                <CommonSearchableSelect
                  value={reviseFormData.department || ''}
                  onChange={(val: string) => setReviseFormData({ ...reviseFormData, department: val })}
                  options={departmentOptions}
                  placeholder="Select Department"
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold text-gray-700 mb-1">Designation</label>
                <CommonSearchableSelect
                  value={reviseFormData.designation || ''}
                  onChange={(val: string) => setReviseFormData({ ...reviseFormData, designation: val })}
                  options={designationOptions}
                  placeholder="Select Designation"
                />
              </div>
              <div className="col-span-1">
                <label className="block font-semibold text-gray-700 mb-1">Salary Type</label>
                <select
                  className="input w-full"
                  value={reviseFormData.salaryType}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, salaryType: e.target.value as any })}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Daily">Daily</option>
                  <option value="Hourly">Hourly</option>
                  <option value="28 days">28 days</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block font-semibold text-gray-700 mb-1">Basic Salary (₹) *</label>
                <input
                  type="number"
                  className="input w-full font-bold text-gray-900"
                  value={reviseFormData.basicSalary}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, basicSalary: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <label className="block font-medium text-gray-700 mb-1">HRA (₹)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={reviseFormData.hra}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, hra: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <label className="block font-medium text-gray-700 mb-1">DA (₹)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={reviseFormData.conveyanceAllowance}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, conveyanceAllowance: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <label className="block font-medium text-gray-700 mb-1">Medical Allowance (₹)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={reviseFormData.medicalAllowance}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, medicalAllowance: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <label className="block font-medium text-gray-700 mb-1">TA (₹)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={reviseFormData.specialAllowance}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, specialAllowance: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1">
                <label className="block font-medium text-gray-700 mb-1">OT Salary (₹)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={reviseFormData.otSalary}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, otSalary: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-1 flex items-center pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={Boolean(reviseFormData.isCanteen)}
                    onChange={(e) => setReviseFormData({ ...reviseFormData, isCanteen: e.target.checked })}
                  />
                  <span className="font-medium text-gray-700">Is Canteen</span>
                </label>
              </div>
              <div className="col-span-3">
                <label className="block font-medium text-gray-700 mb-1">Revision Remarks / Reason</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Annual Increment 2026 / Performance Appraisal"
                  value={reviseFormData.remarks || ''}
                  onChange={(e) => setReviseFormData({ ...reviseFormData, remarks: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsReviseModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSalaryRevision}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
              >
                Apply Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {isPfCeilingModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Revise PF Wage Ceiling</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPfCeilingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-600 bg-blue-50 p-2.5 rounded-md border border-blue-100">
              Configure a date-wise PF Wage Ceiling limit. The salary generation will dynamically use this limit for the corresponding salary month (Default: ₹15,000).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Effective Date *</label>
                <input
                  type="date"
                  className="input w-full"
                  value={pfCeilingFormData.effectiveDate}
                  onChange={(e) => setPfCeilingFormData({ ...pfCeilingFormData, effectiveDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">PF Wage Ceiling (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input w-full font-bold text-gray-900"
                  placeholder="15000"
                  value={pfCeilingFormData.pfWageCeiling}
                  onChange={(e) => setPfCeilingFormData({ ...pfCeilingFormData, pfWageCeiling: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Remarks / Reason</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g. Statutory Ceiling Revision / Government Update"
                  value={pfCeilingFormData.remarks || ''}
                  onChange={(e) => setPfCeilingFormData({ ...pfCeilingFormData, remarks: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsPfCeilingModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPfCeilingRevision}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
              >
                Apply Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {photoPreviewOpen && employeePhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setPhotoPreviewOpen(false)}
        >
          <div
            className="relative max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setPhotoPreviewOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </button>
            <img
              src={employeePhoto}
              alt="Employee Photo"
              className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
