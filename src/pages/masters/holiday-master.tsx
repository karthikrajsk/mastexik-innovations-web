import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { BooleanFilter } from "@/components/filters";
import { addHoliday, fetchHolidays, removeHoliday, updateHoliday } from "@/state/holidaySlice";
import { AppDispatch, RootState } from "@/state/store";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Holiday } from "@/services/holidayService";
import { usePagination } from "@/components/common/Pagination";

interface HolidayFormData {
  id?: number;
  holidayName: string;
  holidayDate: string;
  isFestivalWageApplicable: boolean;
  description?: string;
  status?: string;
}

export function HolidayMaster() {
  const { holidayList, loading } = useSelector((state: RootState) => state.holiday);
  const dispatch = useDispatch<AppDispatch>();

  const {
    currentPage,
    itemsPerPage,
    getOffset,
    resetPage,
    handlePageChange,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentHoliday, setCurrentHoliday] = useState<Holiday | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<HolidayFormData>({
    mode: "onChange",
    defaultValues: {
      isFestivalWageApplicable: true,
      status: "Active"
    }
  });

  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  const processedHolidayList = useMemo(() => {
    return (holidayList || []).map((item: Holiday, index: number) => ({
      ...item,
      serialNo: index + 1
    }));
  }, [holidayList]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 60,
        disableFilters: true
      },
      {
        Header: "Festival / Holiday Name",
        accessor: "holidayName"
      },
      {
        Header: "Holiday Date",
        accessor: "holidayDate"
      },
      {
        Header: "Festival Wage Applicable",
        accessor: "isFestivalWageApplicable",
        Filter: BooleanFilter,
        Cell: ({ value }: { value: boolean }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {value ? "Yes" : "No"}
          </span>
        )
      },
      {
        Header: "Description",
        accessor: "description"
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }: { value: string }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              value === "Active" || !value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {value || "Active"}
          </span>
        )
      }
    ],
    []
  );

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentHoliday(null);
    reset({
      holidayName: "",
      holidayDate: "",
      isFestivalWageApplicable: true,
      description: "",
      status: "Active"
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Holiday) => {
    setIsEditing(true);
    setCurrentHoliday(item);
    reset({
      id: item.id,
      holidayName: item.holidayName,
      holidayDate: item.holidayDate,
      isFestivalWageApplicable: item.isFestivalWageApplicable ?? true,
      description: item.description || "",
      status: item.status || "Active"
    });
    setIsModalOpen(true);
  };

  const handleView = (item: Holiday) => {
    setCurrentHoliday(item);
    setIsViewModalOpen(true);
  };

  const handleDelete = (item: Holiday) => {
    setCurrentHoliday(item);
    setIsDeleteModalOpen(true);
  };

  const onSubmit = async (data: HolidayFormData) => {
    if (isEditing && currentHoliday?.id) {
      await dispatch(updateHoliday({ id: currentHoliday.id, holiday: { ...data, id: currentHoliday.id } }));
    } else {
      await dispatch(addHoliday(data));
    }
    setIsModalOpen(false);
    resetPage();
    dispatch(fetchHolidays());
  };

  const confirmDelete = async () => {
    if (currentHoliday?.id) {
      await dispatch(removeHoliday(currentHoliday.id));
      setIsDeleteModalOpen(false);
      resetPage();
      dispatch(fetchHolidays());
    }
  };

  return (
    <div className="p-6 pt-16">
      <div className="space-y-6">
        <DataTable
          columns={columns}
          data={processedHolidayList}
          title="Holiday / Festival Master"
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          showActions={true}
          showColumnFilters={true}
          filterPlaceholder="Search Holiday / Festival..."
          disableFullDataFetch={true}
        />
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Holiday / Festival" : "Add Holiday / Festival"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Festival / Holiday Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Festival or Holiday Name (e.g. Independence Day)"
              {...register("holidayName", { required: "Holiday name is required" })}
            />
            {errors.holidayName && (
              <p className="mt-1 text-sm text-red-600">{errors.holidayName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Holiday Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("holidayDate", { required: "Holiday date is required" })}
            />
            {errors.holidayDate && (
              <p className="mt-1 text-sm text-red-600">{errors.holidayDate.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isFestivalWageApplicable"
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              {...register("isFestivalWageApplicable")}
            />
            <label htmlFor="isFestivalWageApplicable" className="text-sm font-medium text-gray-700 cursor-pointer">
              Festival Wages Applicable (Employees working on this day get Festival Pay)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Remarks</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter optional description or remarks"
              {...register("description")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("status")}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
            >
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete festival <strong>{currentHoliday?.holidayName}</strong> ({currentHoliday?.holidayDate})?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Holiday / Festival Details"
      >
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 border-b pb-2">
            <span className="font-medium text-gray-500">Festival Name:</span>
            <span className="font-semibold text-gray-900">{currentHoliday?.holidayName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 border-b pb-2">
            <span className="font-medium text-gray-500">Holiday Date:</span>
            <span className="font-semibold text-gray-900">{currentHoliday?.holidayDate}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 border-b pb-2">
            <span className="font-medium text-gray-500">Festival Wages Applicable:</span>
            <span className="font-semibold text-gray-900">
              {currentHoliday?.isFestivalWageApplicable ? "Yes" : "No"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 border-b pb-2">
            <span className="font-medium text-gray-500">Description:</span>
            <span className="text-gray-900">{currentHoliday?.description || "N/A"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="font-medium text-gray-500">Status:</span>
            <span className="font-semibold text-gray-900">{currentHoliday?.status || "Active"}</span>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default HolidayMaster;
