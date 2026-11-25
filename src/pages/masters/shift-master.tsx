import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { BooleanFilter } from "@/components/filters";
import { AppDispatch, RootState } from "@/state/store";
import {
  createShift,
  deleteShift,
  getAllShifts,
  updateShift,
  ShiftMaster as IShiftMaster,
  ShiftTimingDetail,
  ShiftType
} from "@/state/shiftSlice";
import { getAllSubCategories, getSubCategoryByCategory } from "@/state/subCategorySlice";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Trash2, Plus } from "lucide-react";

interface ShiftFormData {
  id?: number | string | null;
  shiftCode: string;
  shiftName: string;
  shiftType: ShiftType;
  description: string;
  activeFlag: boolean;
}

/**
 * Calculates gross slot working hours. Break time is tracked separately.
 */
export function calculateWorkingHours(
  inTime: string,
  outTime: string,
  isNextDay: boolean = false
): number {
  if (!inTime || !outTime) return 0;
  const [inH, inM] = inTime.split(":").map(v => parseInt(v, 10) || 0);
  const [outH, outM] = outTime.split(":").map(v => parseInt(v, 10) || 0);

  const inTotalMins = inH * 60 + inM;
  let outTotalMins = outH * 60 + outM;

  if (isNextDay || outTotalMins < inTotalMins) {
    outTotalMins += 24 * 60;
  }

  const grossMins = Math.max(0, outTotalMins - inTotalMins);
  return Number((grossMins / 60).toFixed(2));
}

export function calculateBreakDuration(
  breakStartTime?: string,
  breakEndTime?: string
): number {
  if (!breakStartTime || !breakEndTime) return 0;
  const [startH, startM] = breakStartTime.split(":").map(v => parseInt(v, 10) || 0);
  const [endH, endM] = breakEndTime.split(":").map(v => parseInt(v, 10) || 0);
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  const duration = endMinutes - startMinutes;
  return Math.max(0, duration);
}

export function formatDecimalHours(decimalHours: number): string {
  const totalMinutes = Math.max(0, Math.round((Number(decimalHours) || 0) * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")} hrs`;
}

export function ShiftMaster() {
  const { shiftList, pagination } = useSelector((state: RootState) => state.shift);
  const { subCategoryList, subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<IShiftMaster | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  // Filter subCategory items where categoryName is 'Shift' (combining both subCategoryByCategoryList and subCategoryList)
  const shiftNameOptions = useMemo(() => {
    const listByCategory = Array.isArray(subCategoryByCategoryList) ? subCategoryByCategoryList : [];
    const listAll = Array.isArray(subCategoryList)
      ? subCategoryList.filter((item: any) => {
          const catName = String(
            item?.categoryName ||
            item?.category?.categoryName ||
            item?.category?.name ||
            ""
          ).trim().toLowerCase();
          return catName === "shift";
        })
      : [];

    const combined = [...listByCategory, ...listAll];
    const seen = new Set<string>();
    return combined.filter((item: any) => {
      const name = String(item?.subCategoryName || item?.subcategoryName || item?.name || "").trim();
      if (!name || seen.has(name.toLowerCase())) return false;
      seen.add(name.toLowerCase());
      return true;
    });
  }, [subCategoryList, subCategoryByCategoryList]);

  // Child table timing details state
  const [timingRows, setTimingRows] = useState<ShiftTimingDetail[]>([
    {
      slotNumber: 1,
      inTime: "06:00",
      outTime: "14:00",
      isNextDay: false,
      breakDuration: 0,
      breakStartTime: "",
      breakEndTime: "",
      totalBreakHours: 0,
      workingHours: 8
    }
  ]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<ShiftFormData>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      id: null,
      shiftCode: "",
      shiftName: "",
      shiftType: "Fixed",
      description: "",
      activeFlag: true
    }
  });

  const shiftCodeValue = watch("shiftCode") ?? "";
  const shiftNameValue = watch("shiftName") ?? "";
  const editingShiftId = currentShift?.id ?? null;

  const duplicateCodeErrorMessage = "Shift Code already exists";
  const duplicateNameErrorMessage = "Shift Name already exists";

  const normalizeValue = (value?: string | null) => (value ?? "").trim().toLowerCase();

  const isDuplicateShiftCode = (value?: string | null) => {
    const normalized = normalizeValue(value);
    if (!normalized) return false;
    return shiftList.some((item: IShiftMaster) => {
      if (item.id === editingShiftId) return false;
      return normalizeValue(item.shiftCode) === normalized;
    });
  };

  const isDuplicateShiftName = (value?: string | null) => {
    const normalized = normalizeValue(value);
    if (!normalized) return false;
    return shiftList.some((item: IShiftMaster) => {
      if (item.id === editingShiftId) return false;
      return normalizeValue(item.shiftName) === normalized;
    });
  };

  const hasDuplicateCode = useMemo(
    () => isDuplicateShiftCode(shiftCodeValue),
    [shiftList, shiftCodeValue, editingShiftId]
  );

  const hasDuplicateName = useMemo(
    () => isDuplicateShiftName(shiftNameValue),
    [shiftList, shiftNameValue, editingShiftId]
  );

  const shiftCodeErrorMessage =
    errors.shiftCode?.message || (hasDuplicateCode ? duplicateCodeErrorMessage : undefined);

  const shiftNameErrorMessage =
    errors.shiftName?.message || (hasDuplicateName ? duplicateNameErrorMessage : undefined);

  // Fetch shifts and subcategories for Shift dropdown
  useEffect(() => {
    dispatch(getAllShifts({ fetchAll: true }));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(getSubCategoryByCategory({ categoryName: "Shift", fetchAll: true }));
  }, [dispatch, location.pathname]);

  // Recalculate timing row working hours
  const updateTimingRow = (index: number, updates: Partial<ShiftTimingDetail>) => {
    setTimingRows(prev => {
      const updated = [...prev];
      const target = { ...updated[index], ...updates };
      const breakDuration = calculateBreakDuration(target.breakStartTime, target.breakEndTime);
      target.breakDuration = breakDuration;
      target.totalBreakHours = Number((breakDuration / 60).toFixed(2));
      target.workingHours = calculateWorkingHours(
        target.inTime,
        target.outTime,
        target.isNextDay
      );
      updated[index] = target;
      return updated;
    });
  };

  // Add timing row
  const handleAddTimingRow = () => {
    const nextSlot = timingRows.length + 1;
    let nextIn = "14:00";
    let nextOut = "22:00";
    if (timingRows.length > 0) {
      const last = timingRows[timingRows.length - 1];
      nextIn = last.outTime || "14:00";
      const [h, m] = nextIn.split(":").map(Number);
      const outH = (h + 8) % 24;
      nextOut = `${String(outH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    const newRow: ShiftTimingDetail = {
      slotNumber: nextSlot,
      inTime: nextIn,
      outTime: nextOut,
      isNextDay: false,
      breakDuration: 0,
      breakStartTime: "",
      breakEndTime: "",
      totalBreakHours: 0,
      workingHours: calculateWorkingHours(nextIn, nextOut)
    };
    setTimingRows(prev => [...prev, newRow]);
  };

  // Remove timing row
  const handleRemoveTimingRow = (index: number) => {
    if (timingRows.length <= 1) return;
    setTimingRows(prev =>
      prev
        .filter((_, i) => i !== index)
        .map((row, idx) => ({ ...row, slotNumber: idx + 1 }))
    );
  };

  // Total working hours
  const totalCalculatedHours = useMemo(() => {
    const total = timingRows.reduce((acc, row) => acc + (row.workingHours || 0), 0);
    return Number(total.toFixed(2));
  }, [timingRows]);

  // Process data with serial number for DataTable
  const processedShiftList = useMemo(() => {
    const baseOffset = pagination?.offset || 0;
    return (shiftList || []).map((shift: IShiftMaster, index: number) => {
      const totalHours = shift.timingDetails?.length
        ? shift.timingDetails.reduce(
            (sum, timing) =>
              sum + calculateWorkingHours(timing.inTime, timing.outTime, timing.isNextDay),
            0
          )
        : shift.totalWorkingHours ?? 0;

      const timingPreview =
        shift.timingDetails && shift.timingDetails.length > 0
          ? shift.timingDetails
              .map(t => `${t.inTime}-${t.outTime}${t.isNextDay ? "(+1d)" : ""}`)
              .join(", ")
          : "-";

      return {
        ...shift,
        serialNo: baseOffset + index + 1,
        workingHoursDisplay: `${Number(totalHours).toFixed(2)} hrs`,
        timingPreview
      };
    });
  }, [shiftList, pagination?.offset]);

  // DataTable columns definition
  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 50,
        disableFilters: true
      },
      {
        Header: "Shift Code",
        accessor: "shiftCode"
      },
      {
        Header: "Shift Name",
        accessor: "shiftName"
      },
      {
        Header: "Shift Type",
        accessor: "shiftType",
        Cell: ({ value }: { value: string }) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              value === "Rotation"
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {value}
          </span>
        )
      },
      {
        Header: "Timing Slots",
        accessor: "timingPreview"
      },
      {
        Header: "Working Hours",
        accessor: "workingHoursDisplay"
      },
      {
        Header: "Description",
        accessor: "description"
      },
      {
        Header: "Status",
        accessor: "activeFlag",
        Filter: BooleanFilter,
        Cell: ({ value }: { value: boolean }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        )
      }
    ],
    []
  );

  // Modal open handler
  const handleOpenModal = (editing = false, shift: IShiftMaster | null = null) => {
    setServerErrors({});
    if (editing && shift) {
      setCurrentShift(shift);
      reset({
        id: shift.id,
        shiftCode: shift.shiftCode || "",
        shiftName: shift.shiftName,
        shiftType: shift.shiftType || "Fixed",
        description: shift.description || "",
        activeFlag: shift.activeFlag !== false
      });

      if (shift.timingDetails && shift.timingDetails.length > 0) {
        setTimingRows(
          shift.timingDetails.map((t, idx) => {
            const breakStartTime = t.breakStartTime || "";
            const breakEndTime = t.breakEndTime || "";
            const breakDuration = calculateBreakDuration(breakStartTime, breakEndTime);
            return {
              id: t.id,
              slotNumber: t.slotNumber || idx + 1,
              inTime: t.inTime,
              outTime: t.outTime,
              isNextDay: Boolean(t.isNextDay),
              breakDuration,
              breakStartTime,
              breakEndTime,
              totalBreakHours: Number((breakDuration / 60).toFixed(2)),
              workingHours: calculateWorkingHours(t.inTime, t.outTime, t.isNextDay)
            };
          })
        );
      } else {
        setTimingRows([
          {
            slotNumber: 1,
            inTime: "06:00",
            outTime: "14:00",
            isNextDay: false,
            breakDuration: 0,
            breakStartTime: "",
            breakEndTime: "",
            totalBreakHours: 0,
            workingHours: 8
          }
        ]);
      }
    } else {
      setCurrentShift(null);
      reset({
        id: null,
        shiftCode: "",
        shiftName: "",
        shiftType: "Fixed",
        description: "",
        activeFlag: true
      });
      setTimingRows([
        {
          slotNumber: 1,
          inTime: "06:00",
          outTime: "14:00",
          isNextDay: false,
          breakDuration: 0,
          breakStartTime: "",
          breakEndTime: "",
          totalBreakHours: 0,
          workingHours: 8
        }
      ]);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleEdit = (shift: IShiftMaster) => {
    handleOpenModal(true, shift);
  };

  const handleView = (shift: IShiftMaster) => {
    setCurrentShift(shift);
    setIsViewModalOpen(true);
  };

  const handleDelete = (shift: IShiftMaster) => {
    setCurrentShift(shift);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentShift) return;
    try {
      await dispatch(deleteShift(currentShift.id)).unwrap();
      dispatch(getAllShifts({ fetchAll: true }));
    } catch (error) {
      console.error("Delete failed:", error);
    }
    setIsDeleteModalOpen(false);
  };

  const onSubmit = async (data: ShiftFormData) => {
    if (isDuplicateShiftCode(data.shiftCode) || isDuplicateShiftName(data.shiftName)) {
      return;
    }

    // Validate timing rows
    for (let i = 0; i < timingRows.length; i++) {
      const row = timingRows[i];
      if (!row.inTime || !row.outTime) {
        setServerErrors({ timing: `Row #${i + 1}: Both In Time and Out Time are required.` });
        return;
      }
    }

    const payload = {
      shiftCode: data.shiftCode?.trim() ? data.shiftCode.trim().toUpperCase() : null,
      shiftName: data.shiftName.trim(),
      shiftType: data.shiftType,
      description: data.description ? data.description.trim() : "",
      activeFlag: Boolean(data.activeFlag),
      totalWorkingHours: totalCalculatedHours,
      timingDetails: timingRows.map(r => ({
        id: r.id,
        slotNumber: r.slotNumber,
        inTime: r.inTime,
        outTime: r.outTime,
        isNextDay: r.isNextDay,
        breakDuration: Number(r.breakDuration) || 0,
        breakStartTime: r.breakStartTime || "",
        breakEndTime: r.breakEndTime || "",
        totalBreakHours: Number(r.totalBreakHours) || 0,
        workingHours: r.workingHours
      }))
    };

    try {
      setServerErrors({});
      if (isEditing && currentShift?.id) {
        await dispatch(updateShift({ id: currentShift.id, data: payload })).unwrap();
      } else {
        await dispatch(createShift(payload)).unwrap();
      }

      dispatch(getAllShifts({ fetchAll: true }));
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      console.error("Submit failed:", error);
      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      if (serverMessage.toLowerCase().includes("code")) {
        setServerErrors({ shiftCode: serverMessage });
      } else if (serverMessage.toLowerCase().includes("name")) {
        setServerErrors({ shiftName: serverMessage });
      } else {
        setServerErrors({ general: serverMessage });
      }
    }
  };

  const isSubmitDisabled = !isValid || hasDuplicateCode || hasDuplicateName;

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processedShiftList}
        title="Shift Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Shift..."
        disableFullDataFetch={true}
      />

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setServerErrors({});
        }}
        title={isEditing ? "Edit Shift" : "Add Shift"}
        className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverErrors.general && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {serverErrors.general}
            </div>
          )}

          {/* Master Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shift Code */}
            <div>
              <label className="block text-sm font-medium">
                Shift Code
              </label>
              <input
                {...register("shiftCode", {
                  validate: value =>
                    isDuplicateShiftCode(value) ? duplicateCodeErrorMessage : true
                })}
                placeholder="e.g. SH-MORN-A"
                onChange={() => {
                  if (serverErrors.shiftCode) {
                    setServerErrors({ ...serverErrors, shiftCode: "" });
                  }
                }}
                className="input mt-1 uppercase"
              />
              {serverErrors.shiftCode && !shiftCodeErrorMessage && (
                <p className="mt-1 text-sm text-red-600">{serverErrors.shiftCode}</p>
              )}
              {shiftCodeErrorMessage && (
                <p className="mt-1 text-sm text-red-600">{shiftCodeErrorMessage}</p>
              )}
            </div>

            {/* Shift Name Dropdown (Fetched from subCategorySlice where categoryName === 'Shift') */}
            <div>
              <label className="block text-sm font-medium">
                Shift Name <span className="text-red-600">*</span>
              </label>
              <select
                {...register("shiftName", {
                  required: "Shift Name is required",
                  validate: value =>
                    isDuplicateShiftName(value) ? duplicateNameErrorMessage : true
                })}
                onChange={(e) => {
                  setValue("shiftName", e.target.value, { shouldValidate: true });
                  if (serverErrors.shiftName) {
                    setServerErrors({ ...serverErrors, shiftName: "" });
                  }
                }}
                className="input mt-1"
              >
                <option value="">Select Shift Name</option>
                {shiftNameOptions.map((item: any) => {
                  const name = item.subCategoryName || item.subcategoryName || item.name || "";
                  return (
                    <option key={item.id} value={name}>
                      {name}
                    </option>
                  );
                })}
                {/* Fallback to preserve existing shift name when editing if not currently in subcategories */}
                {currentShift?.shiftName &&
                  !shiftNameOptions.some(
                    (item: any) =>
                      (item.subCategoryName || item.subcategoryName || item.name) ===
                      currentShift.shiftName
                  ) && (
                    <option value={currentShift.shiftName}>
                      {currentShift.shiftName}
                    </option>
                  )}
              </select>
              {serverErrors.shiftName && !shiftNameErrorMessage && (
                <p className="mt-1 text-sm text-red-600">{serverErrors.shiftName}</p>
              )}
              {shiftNameErrorMessage && (
                <p className="mt-1 text-sm text-red-600">{shiftNameErrorMessage}</p>
              )}
            </div>

            {/* Shift Type */}
            <div>
              <label className="block text-sm font-medium">
                Shift Type <span className="text-red-600">*</span>
              </label>
              <select {...register("shiftType", { required: "Shift Type is required" })} className="input mt-1">
                <option value="Fixed">Fixed</option>
                <option value="Rotation">Rotation</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <input
                {...register("description")}
                placeholder="Operational notes or crew details..."
                className="input mt-1"
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium">
                Status <span className="text-red-600">*</span>
              </label>
              <select {...register("activeFlag", { required: "Status is required" })} className="input mt-1">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Child Table: Shift Timing Details */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">
                  Shift Timing Details <span className="text-red-600">*</span>
                </h4>
                <p className="text-xs text-gray-500">
                  Configure timing sequences, in/out slots, break duration, and calculated hours.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTimingRow}
                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Timing Row
              </button>
            </div>

            {serverErrors.timing && (
              <p className="mb-2 text-sm text-red-600">{serverErrors.timing}</p>
            )}

            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="py-2.5 px-3 w-16 text-center">Seq #</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Shift In Time</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Shift Out Time</th>
                    <th className="py-2.5 px-3 w-28 text-center">Is Next Day</th>
                    <th className="py-2.5 px-3 min-w-[110px]">Break Start</th>
                    <th className="py-2.5 px-3 min-w-[110px]">Break End</th>
                    <th className="py-2.5 px-3 min-w-[110px] text-right">Total Break</th>
                    <th className="py-2.5 px-3 min-w-[130px] text-right">Working Hours</th>
                    <th className="py-2.5 px-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {timingRows.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {/* Slot Number */}
                      <td className="py-2 px-3 text-center font-medium text-gray-600">
                        {row.slotNumber}
                      </td>

                      {/* In Time */}
                      <td className="py-1.5 px-2">
                        <input
                          type="time"
                          value={row.inTime}
                          onChange={e => updateTimingRow(index, { inTime: e.target.value })}
                          className="input py-1 text-sm"
                          required
                        />
                      </td>

                      {/* Out Time */}
                      <td className="py-1.5 px-2">
                        <input
                          type="time"
                          value={row.outTime}
                          onChange={e => updateTimingRow(index, { outTime: e.target.value })}
                          className="input py-1 text-sm"
                          required
                        />
                      </td>

                      {/* Is Next Day */}
                      <td className="py-1.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="checkbox"
                            checked={row.isNextDay}
                            onChange={e => updateTimingRow(index, { isNextDay: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            title="Check if shift ends next calendar day"
                          />
                          {row.isNextDay && (
                            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                              +1d
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Break Start */}
                      <td className="py-1.5 px-2">
                        <input
                          type="time"
                          value={row.breakStartTime || ""}
                          onChange={e =>
                            updateTimingRow(index, {
                              breakStartTime: e.target.value
                            })
                          }
                          className="input py-1 text-sm"
                        />
                      </td>

                      {/* Break End */}
                      <td className="py-1.5 px-2">
                        <input
                          type="time"
                          value={row.breakEndTime || ""}
                          onChange={e =>
                            updateTimingRow(index, {
                              breakEndTime: e.target.value
                            })
                          }
                          className="input py-1 text-sm"
                        />
                      </td>

                      {/* Total Break Hours */}
                      <td className="py-2 px-3 text-right font-medium text-amber-700">
                        {formatDecimalHours(Number(row.totalBreakHours) || 0)}
                      </td>

                      {/* Working Hours */}
                      <td className="py-2 px-3 text-right font-medium text-blue-700">
                        {formatDecimalHours(Number(row.workingHours || 0))}
                      </td>

                      {/* Remove Row */}
                      <td className="py-1.5 px-2 text-center">
                        {timingRows.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveTimingRow(index)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                            title="Remove timing row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Working Hours Summary */}
            <div className="flex justify-between items-center mt-2 px-1 text-sm">
              <span className="text-xs text-gray-500">
                Total timing slots: {timingRows.length}
              </span>
              <div className="font-semibold text-gray-800">
                Total Calculated Working Hours:{" "}
                <span className="text-blue-600 font-bold">{formatDecimalHours(totalCalculatedHours)}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setServerErrors({});
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${
                isSubmitDisabled
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
                  : "btn-primary"
              }`}
              disabled={isSubmitDisabled}
              title={
                isSubmitDisabled
                  ? hasDuplicateCode
                    ? duplicateCodeErrorMessage
                    : hasDuplicateName
                    ? duplicateNameErrorMessage
                    : "Please fill all required fields"
                  : ""
              }
            >
              {isEditing ? "Update Shift" : "Add Shift"}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete Shift "{currentShift?.shiftName}"?</p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Shift Details"
        className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl"
      >
        {currentShift && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Shift Code</p>
                <p className="font-semibold text-gray-900">{currentShift.shiftCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shift Name</p>
                <p className="font-semibold text-gray-900">{currentShift.shiftName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shift Type</p>
                <p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      currentShift.shiftType === "Rotation"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {currentShift.shiftType}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Working Hours</p>
                <p className="font-bold text-blue-600">
                  {(
                    currentShift.timingDetails?.length
                      ? currentShift.timingDetails.reduce(
                          (sum, timing) =>
                            sum +
                            calculateWorkingHours(
                              timing.inTime,
                              timing.outTime,
                              timing.isNextDay
                            ),
                          0
                        )
                      : currentShift.totalWorkingHours ?? 0
                  ).toFixed(2)} hrs
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      currentShift.activeFlag
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {currentShift.activeFlag ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div className="md:col-span-3">
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium text-gray-800">{currentShift.description || "-"}</p>
              </div>
            </div>

            {/* Child Timing Details List */}
            <div className="pt-3 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Shift Timing Details</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 uppercase font-medium">
                      <th className="py-2 px-3 text-center">Seq #</th>
                      <th className="py-2 px-3">Shift In Time</th>
                      <th className="py-2 px-3">Shift Out Time</th>
                      <th className="py-2 px-3 text-center">Is Next Day</th>
                      <th className="py-2 px-3 text-right">Break (Mins)</th>
                      <th className="py-2 px-3 text-right">Working Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(currentShift.timingDetails || []).map((t, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-center font-medium">{t.slotNumber}</td>
                        <td className="py-2 px-3">{t.inTime}</td>
                        <td className="py-2 px-3">{t.outTime}</td>
                        <td className="py-2 px-3 text-center">
                          {t.isNextDay ? (
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-2xs font-bold">
                              Yes (+1d)
                            </span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">{t.breakDuration} mins</td>
                        <td className="py-2 px-3 text-right font-semibold text-blue-600">
                          {calculateWorkingHours(t.inTime, t.outTime, t.isNextDay).toFixed(2)} hrs
                        </td>
                      </tr>
                    ))}
                    {(!currentShift.timingDetails || currentShift.timingDetails.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-3 text-center text-gray-400">
                          No timing slot records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default ShiftMaster;
