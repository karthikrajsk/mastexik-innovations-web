import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { getAllMachines, createMachine, updateMachine } from "@/state/machineMasterSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { BooleanFilter } from "@/components/filters";

interface MachineFormData {
  id?: number | null;
  machineNo: string;
  machineName?: string;
  departmentId: string;
  machineTypeId: string;
  manufactureYearModel?: string;
  serialNo?: string;
  activeFlag: string;
}

export function MachineMaster() {
  const dispatch = useDispatch<AppDispatch>();
  const machineState = useSelector((state: RootState) => (state as any).machineMaster || { machineList: [], pagination: undefined });
  const { machineList, pagination } = machineState;
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { currentPage, itemsPerPage, handlePageChange, resetPage, getOffset, setItemsPerPage } = usePagination({ itemsPerPage: 10 });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MachineFormData>({
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(getAllSubCategories({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllMachines({ fetchAll: true }));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  const safeMachineList = useMemo(() => (Array.isArray(machineList) ? machineList : []), [machineList]);

  const departmentOptions = useMemo(() => {
    const list = Array.isArray(subCategoryList) ? subCategoryList : [];
    return list
      .filter((item: any) => String(item.categoryName || "").toLowerCase() === "department".toLowerCase())
      .map((item: any) => ({ id: String(item.id), name: String(item.subCategoryName || item.name || "") }));
  }, [subCategoryList]);

  const machineTypeOptions = useMemo(() => {
    const list = Array.isArray(subCategoryList) ? subCategoryList : [];
    return list
      .filter((item: any) => String(item.categoryName || "").toLowerCase() === "machine type".toLowerCase())
      .map((item: any) => ({ id: String(item.id), name: String(item.subCategoryName || item.name || "") }));
  }, [subCategoryList]);

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();
    departmentOptions.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [departmentOptions]);

  const machineTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    machineTypeOptions.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [machineTypeOptions]);

  const tableData = useMemo(() => {
    const baseSerial = pagination?.offset || 0;
    return safeMachineList.map((item: any, index: number) => ({
      ...item,
      sNo: baseSerial + index + 1,
      departmentName: item.departmentName || departmentMap.get(String(item.departmentId)) || "",
      machineTypeName: item.machineTypeName || machineTypeMap.get(String(item.machineTypeId)) || "",
      statusDisplay: item.activeFlag === false ? "Inactive" : "Active",
    }));
  }, [safeMachineList, pagination?.offset, departmentMap, machineTypeMap]);

  const columns = useMemo(() => [
    { Header: "S.No", accessor: "sNo", width: 60, disableFilters: true },
    { Header: "Machine No", accessor: "machineNo" },
    { Header: "Machine Name", accessor: "machineName" },
    { Header: "Department", accessor: "departmentName" },
    { Header: "Machine Type", accessor: "machineTypeName" },
    { Header: "Manufacture Year/Model", accessor: "manufactureYearModel" },
    { Header: "Serial No", accessor: "serialNo" },
    {
      Header: "Status",
      accessor: "statusDisplay",
      Cell: ({ value }: { value: string }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {value === "Active" ? "Active" : "Inactive"}
        </span>
      ),
    },
  ], []);

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentRow(null);
    reset({ id: null, machineNo: "", machineName: "", departmentId: "", machineTypeId: "", manufactureYearModel: "", serialNo: "", activeFlag: "true" });
    setIsModalOpen(true);
  };

  const handleEdit = (row: any) => {
    setIsEditing(true);
    setCurrentRow(row);
    reset({
      id: row.id,
      machineNo: row.machineNo ? String(row.machineNo) : "",
      machineName: row.machineName ? String(row.machineName) : "",
      departmentId: row.departmentId ? String(row.departmentId) : "",
      machineTypeId: row.machineTypeId ? String(row.machineTypeId) : "",
      manufactureYearModel: row.manufactureYearModel ? String(row.manufactureYearModel) : "",
      serialNo: row.serialNo ? String(row.serialNo) : "",
      activeFlag: row.activeFlag === false ? "false" : "true",
    });
    setIsModalOpen(true);
  };

  const handleView = (row: any) => {
    setCurrentRow(row);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRow(null);
    setServerErrors({});
  };

  const onSubmit = async (data: MachineFormData) => {
    const payload = {
      ...data,
      machineNo: data.machineNo,
      machineName: data.machineName || "",
      departmentId: data.departmentId ? Number(data.departmentId) : undefined,
      machineTypeId: data.machineTypeId ? Number(data.machineTypeId) : undefined,
      manufactureYearModel: data.manufactureYearModel || "",
      serialNo: data.serialNo || "",
      activeFlag: data.activeFlag === "true",
    };
    try {
      setServerErrors({});

      if (isEditing && data.id) {
        await dispatch(updateMachine(payload)).unwrap();
      } else {
        const { id, ...rest } = payload;
        await dispatch(createMachine(rest)).unwrap();
      }

      resetPage();
      await dispatch(getAllMachines({ fetchAll: true }));
      closeModal();
      reset({ id: null, machineNo: "", departmentId: "", machineTypeId: "", manufactureYearModel: "", serialNo: "", activeFlag: "true" });
    } catch (error: any) {
      console.error("Error submitting form:", error);

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred";

      setServerErrors({ general: serverMessage });
    }
  };

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={tableData}
        title="Machine Master"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Machine..."
          disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
      />
      {/* <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      /> */}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          closeModal();
          setServerErrors({});
        }}
        title={isEditing ? "Edit Machine" : "Add Machine"}
        className="w-full max-w-2xl"
      >
         {/* {serverErrors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {serverErrors.general}
            </div>
          )} */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
         
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Machine No <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Machine No"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.machineNo ? "border-red-500" : "border-gray-300"}`}
                {...register("machineNo", {
                  required: "Machine No is required",
                })}
              />
              {errors.machineNo && (
                <p className="text-red-500 text-xs mt-1">{errors.machineNo.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">
                Machine Name
              </label>
              <input
                type="text"
                placeholder="Enter Machine Name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                {...register("machineName")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Department <span className="text-red-600">*</span>
              </label>
              <CommonSearchableSelect
                options={departmentOptions.map((option) => ({
                  value: String(option.id),
                  label: option.name
                }))}
                placeholder="Select Department"
                error={errors.departmentId?.message as string}
                {...register("departmentId", {
                  required: "Department is required"
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Machine Type <span className="text-red-600">*</span>
              </label>
              <CommonSearchableSelect
                options={machineTypeOptions.map((option) => ({
                  value: String(option.id),
                  label: option.name,
                }))}
                placeholder="Select Machine Type"
                error={errors.machineTypeId?.message as string}
                {...register("machineTypeId", {
                  required: "Machine Type is required"
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Manufacture Year/Model
              </label>
              <input
                type="text"
                placeholder="Enter Manufacture Year/Model"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                {...register("manufactureYearModel")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Serial No
              </label>
              <input
                type="text"
                placeholder="Enter Serial No"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                {...register("serialNo")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Status <span className="text-red-600">*</span>
              </label>
              <CommonSearchableSelect
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
                placeholder="Select Status"
                error={errors.activeFlag?.message as string}
                {...register("activeFlag", {
                  required: "Status is required",
                })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white"
            >
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="View Machine"
        className="w-full max-w-md"
      >
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Machine No</span>
            <span className="font-semibold">{currentRow?.machineNo || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Machine Name</span>
            <span className="font-semibold">{currentRow?.machineName || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Department</span>
            <span className="font-semibold">{currentRow?.departmentName || departmentMap.get(String(currentRow?.departmentId)) || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Machine Type</span>
            <span className="font-semibold">{currentRow?.machineTypeName || machineTypeMap.get(String(currentRow?.machineTypeId)) || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Manufacture Year/Model</span>
            <span className="font-semibold">{currentRow?.manufactureYearModel || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Serial No</span>
            <span className="font-semibold">{currentRow?.serialNo || "-"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="font-semibold">{currentRow?.activeFlag === false ? "Inactive" : "Active"}</span>
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
