import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, UseFormSetError } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { createLoom, deleteLoom, getAllLooms, updateLoom } from "@/state/loomMasterSlice";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface LoomFormData {
  id?: number | null;
  date: string;
  companyName: string;
  companyId?: number;
  loomNo: string;
  loomTypeId: string;
  machineTypeId: string;
  shedId?: string;
  groupId?: string;
  machineSerialNo?: string;
  manufactureYearModel?: string;
  camBoxNo?: string;
  camBoxModel?: string;
  activeFlag: boolean;
  beamWidth?: string;
  pickMultiplicationValue?: string;
  remarks?: string;
}

const resolveApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;
  const candidates: string[] = [];

  if (typeof responseData === "string") {
    candidates.push(responseData);
  } else if (responseData) {
    if (typeof responseData.message === "string") {
      candidates.push(responseData.message);
    }
    if (typeof responseData.error === "string") {
      candidates.push(responseData.error);
    }
    if (typeof responseData.data === "string") {
      candidates.push(responseData.data);
    }
    if (responseData.data && typeof responseData.data === "object") {
      if (typeof responseData.data.message === "string") {
        candidates.push(responseData.data.message);
      }
      if (typeof responseData.data.error === "string") {
        candidates.push(responseData.data.error);
      }
      if (Array.isArray(responseData.data.errors)) {
        responseData.data.errors.forEach((err: any) => {
          if (typeof err === "string") {
            candidates.push(err);
          } else if (typeof err?.message === "string") {
            candidates.push(err.message);
          }
        });
      }
    }
    if (Array.isArray(responseData.errors)) {
      responseData.errors.forEach((err: any) => {
        if (typeof err === "string") {
          candidates.push(err);
        } else if (typeof err?.message === "string") {
          candidates.push(err.message);
        }
      });
    }
  }

  const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
  return candidate || error?.message || fallback;
};

const handleLoomSaveError = (error: any, setError: UseFormSetError<LoomFormData>) => {
  const message = resolveApiErrorMessage(error, "Failed to save loom");
  setError("loomNo", { type: "server", message }, { shouldFocus: true });
  return message;
};

export function LoomMaster() {
  const dispatch = useDispatch<AppDispatch>();
  const { loomList, pagination } = useSelector((s: RootState) => (s as any).loomMaster || { loomList: [], pagination: undefined });
  const { subCategoryList } = useSelector((s: RootState) => s.subCategory);
  const { companyMasterList, loading: companyLoading } = useSelector((s: RootState) => s.companyMaster);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isValid }
  } = useForm<LoomFormData>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    dispatch(getAllSubCategories({}));
    if (!companyLoading && companyMasterList.length === 0) {
      dispatch(getAllCompanies({}));
    }
  }, [dispatch, companyLoading, companyMasterList.length]);

  useEffect(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    const params: any = {
      fetchAll: true,
    };
    if (cid) {
      params.companyId = cid;
    }
    dispatch(getAllLooms(params));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  const selectedCompanyId = (() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    return v ? String(v) : "";
  })();

  const companyName = useMemo(() => {
    if (!selectedCompanyId || companyMasterList.length === 0) return "";
    const c = companyMasterList.find((x: any) => String(x.id ?? x.companyId) === String(selectedCompanyId));
    return c ? String(c.companyName ?? c.name ?? "") : "";
  }, [selectedCompanyId, companyMasterList]);

  const loomTypes = useMemo(() => {
    const list = subCategoryList || [];
    const filtered = list.filter((x: any) => x.categoryName === "Loom Type");
    return (filtered.length > 0 ? filtered : list).map((x: any) => ({ id: String(x.id), name: String(x.subCategoryName) }));
  }, [subCategoryList]);

  const machineTypes = useMemo(() => {
    const list = subCategoryList || [];
    const filtered = list.filter((x: any) => x.categoryName === "Machine Type");
    return (filtered.length > 0 ? filtered : list).map((x: any) => ({ id: String(x.id), name: String(x.subCategoryName) }));
  }, [subCategoryList]);

  const shedOptions = useMemo(() => {
    const list = subCategoryList || [];
    const filtered = list.filter((x: any) => String(x.categoryName || x.category?.categoryName || '').trim().toLowerCase() === "shed");
    return filtered.map((x: any) => ({ value: String(x.id), label: String(x.subCategoryName || x.subcategoryName || x.name) }));
  }, [subCategoryList]);

  const groupOptions = useMemo(() => {
    const list = subCategoryList || [];
    const filtered = list.filter((x: any) => String(x.categoryName || x.category?.categoryName || '').trim().toLowerCase() === "group");
    return filtered.map((x: any) => ({ value: String(x.id), label: String(x.subCategoryName || x.subcategoryName || x.name) }));
  }, [subCategoryList]);

  const machineTypeName = useCallback((id: string | number) => {
    const item = machineTypes.find((m: any) => String(m.id) === String(id));
    return item ? item.name : "";
  }, [machineTypes]);

  const subCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    (subCategoryList || []).forEach((x: any) => {
      map.set(String(x.id), String(x.subCategoryName || x.subcategoryName || x.name));
    });
    return map;
  }, [subCategoryList]);

  const safeLoomList = useMemo(() => (Array.isArray(loomList) ? loomList : []), [loomList]);

  const columns = useMemo(() => [
    { Header: "S.No", accessor: "serialNo", width: 50, disableFilters: true },
    { Header: "Loom No", accessor: "loomNo" },
    { Header: "Shed", accessor: "shedName" },
    { Header: "Group", accessor: "groupName" },
    { Header: "Loom Type", accessor: "loomTypeName" },
    { Header: "Machine Type", accessor: "machineTypeName" },
    { Header: "Machine Serial No", accessor: "machineSerialNo" },
    { Header: "Manufacture Year/Model", accessor: "manufactureYearModel" },
    { Header: "Cam Box No", accessor: "camBoxNo" },
    { Header: "Cam Box Model", accessor: "camBoxModel" },
    {
      Header: "Status",
      accessor: "activeFlag",
      Cell: ({ value }: { value: boolean }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value ? "Active" : "Blocked"}</span>
      ),
    },
  ], []);

  const handleOpenModal = (editing = false, row: any = null) => {
    if (editing && row) {
      reset({
        id: row.id,
        date: row.date ? new Date(row.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        companyName: row.companyName || companyName,
        companyId: row.companyId || (selectedCompanyId ? Number(selectedCompanyId) : undefined),
        loomNo: row.loomNo || "",
        loomTypeId: String(row.loomTypeId || ""),
        machineTypeId: String(row.machineTypeId || ""),
        shedId: row.shedId ? String(row.shedId) : "",
        groupId: row.groupId ? String(row.groupId) : "",
        machineSerialNo: row.machineSerialNo || "",
        manufactureYearModel: row.manufactureYearModel || "",
        camBoxNo: row.camBoxNo || "",
        camBoxModel: row.camBoxModel || "",
        activeFlag: Boolean(row.activeFlag),
        beamWidth: row.beamWidth || "",
        pickMultiplicationValue: row.pickMultiplicationValue ? String(row.pickMultiplicationValue) : "",
        remarks: row.remarks || "",
      });
      setCurrentRow(row);
      setCurrentLoom(row);
    } else {
      reset({
        id: null,
        date: new Date().toISOString().slice(0, 10),
        companyName: companyName,
        companyId: selectedCompanyId ? Number(selectedCompanyId) : undefined,
        loomNo: "",
        loomTypeId: "",
        machineTypeId: "",
        shedId: "",
        groupId: "",
        machineSerialNo: "",
        manufactureYearModel: "",
        camBoxNo: "",
        camBoxModel: "",
        activeFlag: true,
        beamWidth: "",
        pickMultiplicationValue: "",
        remarks: "",
      });
      setCurrentRow(null);
      setCurrentLoom(null);
    }
    setIsEditing(editing);
    setIsModalOpen(true);
  };

  const handleEdit = (row: any) => handleOpenModal(true, row);
  const handleView = (row: any) => { setCurrentRow(row); setIsViewModalOpen(true); };
  const handleDelete = (row: any) => { setCurrentRow(row); setIsDeleteModalOpen(true); };

  const confirmDelete = async () => {
    if (!currentRow) return;
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    try {
      await dispatch(deleteLoom(cid ? { id: currentRow.id, companyId: cid } : currentRow.id));
      resetPage();
      const params: any = {
        fetchAll: true,
      };
      if (cid) {
        params.companyId = cid;
      }
      dispatch(getAllLooms(params));
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const onSubmit = async (data: LoomFormData) => {
    const payload: any = {
      ...data,
      companyId: data.companyId ?? (selectedCompanyId ? Number(selectedCompanyId) : undefined),
      activeFlag: typeof data.activeFlag === "string" ? data.activeFlag === "true" : Boolean(data.activeFlag),
      machineTypeId: Number(data.machineTypeId || 0) || undefined,
      loomTypeId: data.loomTypeId ? Number(data.loomTypeId) : undefined,
      shedId: data.shedId ? Number(data.shedId) : undefined,
      groupId: data.groupId ? Number(data.groupId) : undefined,
      machineSerialNo: data.machineSerialNo || "",
      manufactureYearModel: data.manufactureYearModel || "",
      camBoxNo: data.camBoxNo || "",
      camBoxModel: data.camBoxModel || "",
      pickMultiplicationValue: data.pickMultiplicationValue ? Number(data.pickMultiplicationValue) : undefined,
    };

    try {
      if (isEditing) {
        await dispatch(updateLoom(payload)).unwrap();
      } else {
        const { id, ...p } = payload;
        await dispatch(createLoom(p)).unwrap();
      }

      const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
      const cid = v ? Number(v) : undefined;
      resetPage();
      const params: any = {
        fetchAll: true,
      };
      if (cid) {
        params.companyId = cid;
      }
      dispatch(getAllLooms(params));
      clearErrors();
      setShowSuggestions(false);
      setDuplicateError("");
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      const message = handleLoomSaveError(error, setError);
      setDuplicateError(message);
      setShowSuggestions(false);
      console.error('Error submitting form:', error);
    }
  };

   const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");
    const [currentloom, setCurrentLoom] = useState<any>(null);
  // Watch loomNo value for live suggestions
    const loomNoValue = watch("loomNo");
  
    // Existing loom numbers for suggestions
    const existingLoomNos = useMemo(
      () => safeLoomList.map((l: any) => (l?.loomNo ?? "")).filter(Boolean),
      [safeLoomList]
    );
  
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  
    const filteredSuggestions = useMemo(() => {
      const q = (loomNoValue || "").toLowerCase();
      if (!q) return [] as string[];
      return existingLoomNos
        .filter((name: string) => name.toLowerCase().includes(q))
        .slice(0, 8);
    }, [loomNoValue, existingLoomNos]);
useEffect(() => {
    const current = (loomNoValue || "").trim().toLowerCase();
    if (!current) {
      setDuplicateError("");
      return;
    }
    const exclude = isEditing ? (currentloom?.loomNo || "").toLowerCase() : "";
    const isDuplicate = existingLoomNos.some(
      (n: string) => n.toLowerCase() === current && n.toLowerCase() !== exclude
    );
    setDuplicateError(isDuplicate ? "This loom no already exists" : "");
  }, [loomNoValue, isEditing, currentloom, existingLoomNos]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (activeSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue("loomNo", suggestion, {
      shouldValidate: true,
      shouldDirty: true
    });
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  const tableData = useMemo(() => {
    const baseSerial = pagination?.offset || 0;
    return safeLoomList.map((x: any, index: number) => ({
      ...x,
      serialNo: baseSerial + index + 1,
      loomTypeName: subCategoryMap.get(String(x.loomTypeId)) || x.loomTypeName || x.loomType || x.subCategoryName || "",
      machineTypeName: x.machineTypeName || machineTypeName(x.machineTypeId),
      shedName: subCategoryMap.get(String(x.shedId)) || x.shedName || x.shed || "",
      groupName: subCategoryMap.get(String(x.groupId)) || x.groupName || x.group || "",
    }));
  }, [safeLoomList, subCategoryMap, machineTypeName, pagination?.offset]);

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={tableData}
        title="Loom Master"
        onAdd={() => handleOpenModal(false)}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Loom..."
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //       totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        searchQueryParams={selectedCompanyId ? { companyId: Number(selectedCompanyId) } : undefined}
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
  onClose={() => setIsModalOpen(false)}
  title={isEditing ? "Edit Loom" : "Add Loom"}
  className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl"
>
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium">
          Date <span className="text-red-600">*</span>
        </label>
        <input
          type="date"
          {...register("date", { required: "Date is required" })}
          className="input mt-1"
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{String(errors.date.message)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">
          Company Name <span className="text-red-600">*</span>
        </label>
        <input
          {...register("companyName", { required: "Company Name is required" })}
          className="input mt-1"
          defaultValue={companyName}
        />
      </div>

      <input
        type="hidden"
        {...register("companyId")}
        value={selectedCompanyId ? Number(selectedCompanyId) : undefined as any}
      />

      <div className="relative">
        <label className="block text-sm font-medium">
          Loom No <span className="text-red-600">*</span>
        </label>
        <input
          {...register("loomNo", { required: "Loom No is required",  validate: (value) => {
                  const val = (value || "").trim().toLowerCase();
                  if (!val) return true;
                  const exclude = isEditing ? (currentloom?.loomNo || "").toLowerCase() : "";
                  const exists = existingLoomNos.some((n: string) => n.toLowerCase() === val && n.toLowerCase() !== exclude);
                  return exists ? "This loom no already exists" : true;
                } })}
                autoComplete="off"
        className={`input mt-1 ${errors.loomNo ? 'border-red-500' : ''}`}
              onFocus={() => setShowSuggestions(true)}
               onChange={(e) => {
                setValue("loomNo", e.target.value, { shouldValidate: true });
                setShowSuggestions(true);
                setActiveSuggestionIndex(-1);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions(false);
                  setActiveSuggestionIndex(-1);
                }, 200);
              }}
              onKeyDown={handleKeyDown}
        />
        {errors.loomNo && (
          <p className="mt-1 text-sm text-red-600">{String(errors.loomNo.message)}</p>
        )}
         {(showSuggestions && filteredSuggestions.length > 0) && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                {filteredSuggestions.map((s: string, index: number) => (
                  <li
                    key={s}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${index === activeSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''}`}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSuggestionClick(s);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
            {duplicateError && !errors.loomNo && (
              <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
            )}
          
      </div>
     <div>
  <label className="block text-sm font-medium">
    Loom Type <span className="text-red-600">*</span>
  </label>

  <CommonSearchableSelect
    options={(loomTypes || []).map((x: any) => ({
      value: String(x.id),
      label: x.name
    }))}
    placeholder="Select Loom Type"
    {...register("loomTypeId", {
      required: "Loom Type is required"
    })}
    error={errors.loomTypeId?.message as string}
  />
</div>

      <div>
  <label className="block text-sm font-medium">
    Machine Type <span className="text-red-600">*</span>
  </label>

  <CommonSearchableSelect
    options={(machineTypes || []).map((x: any) => ({
      value: String(x.id),
      label: x.name
    }))}
    placeholder="Select Machine Type"
    {...register("machineTypeId", {
      required: "Machine Type is required"
    })}
    error={errors.machineTypeId?.message as string}
  />
</div>

      <div>
        <label className="block text-sm font-medium">Shed</label>
        <CommonSearchableSelect
          options={shedOptions}
          placeholder="Select Shed"
          value={watch("shedId") || ""}
          {...register("shedId")}
          onValueChange={(val) => setValue("shedId", val, { shouldValidate: true })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Group</label>
        <CommonSearchableSelect
          options={groupOptions}
          placeholder="Select Group"
          value={watch("groupId") || ""}
          {...register("groupId")}
          onValueChange={(val) => setValue("groupId", val, { shouldValidate: true })}
        />
      </div>
      {/* <div>
            <label className="block text-sm font-medium">Status</label>
            <select {...register("activeFlag", { required: "Status is required" })} className="input mt-1">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div> */}

    <div>
  <label className="block text-sm font-medium">
    Beam Width
  </label>

  <CommonSearchableSelect
    options={[
      { value: "Single Width", label: "Single Width" },
      { value: "Double Width", label: "Double Width" }
    ]}
    placeholder="Select"
    {...register("beamWidth")}
    error={errors.beamWidth?.message as string}
  />
</div>

      <div>
        <label className="block text-sm font-medium">Machine Serial No</label>
        <input
          type="text"
          placeholder="Enter Machine Serial No"
          {...register("machineSerialNo")}
          className="input mt-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Machine Manufacturing Year/Model</label>
        <input
          type="text"
          placeholder="Enter Manufacturing Year/Model"
          {...register("manufactureYearModel")}
          className="input mt-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Cam Box No</label>
        <input
          type="text"
          placeholder="Enter Cam Box No"
          {...register("camBoxNo")}
          className="input mt-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Cam Box Model</label>
        <input
          type="text"
          placeholder="Enter Cam Box Model"
          {...register("camBoxModel")}
          className="input mt-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Pick Multiplication Value</label>
        <input
          type="number"
          step="any"
          {...register("pickMultiplicationValue")}
          className="input mt-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Remarks</label>
        <textarea {...register("remarks")} className="input mt-1"></textarea>
      </div>
         <div>
        <label className="block text-sm font-medium">Status</label>
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" {...register("activeFlag")} className="h-4 w-4" />
          <span>Active</span>
        </div>
      </div>
    </div>

    <div className="flex justify-end space-x-3 pt-4">
      <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
        Cancel
      </button>
      <button
        type="submit"
        disabled={!isValid}
        className={`btn ${
          !isValid ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "btn-primary hover:bg-blue-700"
        }`}
      >
        {isEditing ? "Update Loom" : "Add Loom"}
      </button>
    </div>
  </form>
</Modal>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete Loom "{currentRow?.loomNo}"?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Loom Details">
        {currentRow && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">Date</p>
                <p className="font-medium">{currentRow.date}</p>
              </div>
              <div>
                <p className="text-sm">Company</p>
                <p className="font-medium">{currentRow.companyName || companyName}</p>
              </div>
              <div>
                <p className="text-sm">Loom No</p>
                <p className="font-medium">{currentRow.loomNo}</p>
              </div>
              <div>
                <p className="text-sm">Loom Type</p>
                <p className="font-medium">{currentRow.loomTypeName || currentRow.loomType || ""}</p>
              </div>
              <div>
                <p className="text-sm">Machine Type</p>
                <p className="font-medium">{currentRow.machineTypeName || machineTypeName(currentRow.machineTypeId)}</p>
              </div>
              <div>
                <p className="text-sm">Shed</p>
                <p className="font-medium">{currentRow.shedName || subCategoryMap.get(String(currentRow.shedId)) || "-"}</p>
              </div>
              <div>
                <p className="text-sm">Group</p>
                <p className="font-medium">{currentRow.groupName || subCategoryMap.get(String(currentRow.groupId)) || "-"}</p>
              </div>
              {/* <div>
                <p className="text-sm">Status</p>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs ${currentRow.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{currentRow.activeFlag ? "Active" : "Blocked"}</span>
                </p>
              </div> */}
              <div>
                <p className="text-sm">Beam Width</p>
                <p className="font-medium">{currentRow.beamWidth || ""}</p>
              </div>
              <div>
                <p className="text-sm">Pick Multiplication Value</p>
                <p className="font-medium">{currentRow.pickMultiplicationValue || ""}</p>
              </div>
              <div>
                <p className="text-sm">Machine Serial No</p>
                <p className="font-medium">{currentRow.machineSerialNo || "-"}</p>
              </div>
              <div>
                <p className="text-sm">Machine Manufacturing Year/Model</p>
                <p className="font-medium">{currentRow.manufactureYearModel || "-"}</p>
              </div>
              <div>
                <p className="text-sm">Cam Box No</p>
                <p className="font-medium">{currentRow.camBoxNo || "-"}</p>
              </div>
              <div>
                <p className="text-sm">Cam Box Model</p>
                <p className="font-medium">{currentRow.camBoxModel || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm">Remarks</p>
                <p className="font-medium">{currentRow.remarks || ""}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
