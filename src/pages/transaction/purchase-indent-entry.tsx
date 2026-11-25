import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  History,
  Info,
  Package,
  Plus,
  Receipt,
  RotateCw,
  Save,
  Send,
  ShoppingBag,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import apiService from "@/services/ApiService";
import { AppDispatch, RootState } from "@/state/store";
import { Employee, getAllEmployees } from "@/state/employeeSlice";
import { createItemMaster, getAllItemMasters } from "@/state/itemSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import {
  clearCurrentIndent,
  createPurchaseIndent,
  getPurchaseIndentById,
  PurchaseIndentItem,
  PurchaseHistoryResponse,
  updatePurchaseIndent,
  isPurchaseIndentEditable,
} from "@/state/purchaseIndentSlice";

type Priority = "Low" | "Normal" | "High" | "Urgent";

interface ItemOption {
  id: number | string;
  itemName?: string;
  name?: string;
  productName?: string;
  itemCode?: string;
  specification?: string;
  itemSpecification?: string;
  description?: string;
  uomId?: number | string;
  unitId?: number | string;
}

interface UomOption {
  id: number | string;
  uomName?: string;
  name?: string;
  unitName?: string;
  code?: string;
}

interface DraftItem {
  itemId: string;
  itemName: string;
  specification: string;
  quantity: string;
  uomId: string;
  requiredDate: string;
}

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const blankItem: DraftItem = {
  itemId: "",
  itemName: "",
  specification: "",
  quantity: "",
  uomId: "",
  requiredDate: "",
};

const blankItemMaster = {
  itemName: "",
  itemCode: "",
  department: "",
  itemCategory: "",
  hsnCode: "",
  uomId: "",
  igst: "",
  cgst: "",
  sgst: "",
  activeFlag: true,
};

const fieldClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

const itemName = (item: ItemOption) =>
  item.itemName || item.name || item.productName || item.itemCode || `Item ${item.id}`;

const uomName = (uom: UomOption) => uom.uomName || uom.name || uom.unitName || uom.code || "";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (amount?: number | string | null) => {
  if (amount === undefined || amount === null || amount === "") return "—";
  const num = Number(amount);
  if (!Number.isFinite(num)) return String(amount);
  return `₹ ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatQuantity = (quantity?: number | string | null) => {
  if (quantity === undefined || quantity === null || quantity === "") return "—";
  const num = Number(quantity);
  if (!Number.isFinite(num)) return String(quantity);
  return num.toLocaleString("en-IN", { maximumFractionDigits: 4 });
};

export function PurchaseIndentEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get("id");
  const indentId = idParam ? Number(idParam) : undefined;
  const isViewMode = searchParams.get("mode") === "view";
  const companyId = useResolvedCompanyId();
  const { employeeList = [] } = useSelector((state: RootState) => state.employee);
  const { subCategoryList = [] } = useSelector((state: RootState) => state.subCategory);
  const { itemList } = useSelector((state: RootState) => state.itemMaster);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const { currentIndent, loading, saving, error } = useSelector((state: RootState) => state.purchaseIndent);

  const [indentDate, setIndentDate] = useState(today());
  const [department, setDepartment] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<PurchaseIndentItem[]>([]);
  const [draftItem, setDraftItem] = useState<DraftItem>(blankItem);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [masterError, setMasterError] = useState("");
  const [isItemMasterModalOpen, setIsItemMasterModalOpen] = useState(false);
  const [isSavingItemMaster, setIsSavingItemMaster] = useState(false);
  const [itemMasterData, setItemMasterData] = useState(blankItemMaster);
  const [selectedGstDropdownId, setSelectedGstDropdownId] = useState("");
  const [itemMasterErrors, setItemMasterErrors] = useState<Record<string, string>>({});

  // Previous Purchase History state
  const [activeHistoryItemId, setActiveHistoryItemId] = useState<number | null>(null);
  const [activeHistoryItemName, setActiveHistoryItemName] = useState<string>("");
  const [historyPage, setHistoryPage] = useState<number>(0);
  const historyPageSize = 5;
  const [historyState, setHistoryState] = useState<{
    itemId: number | null;
    loading: boolean;
    error: string | null;
    data: PurchaseHistoryResponse | null;
  }>({
    itemId: null,
    loading: false,
    error: null,
    data: null,
  });

  const latestFetchItemIdRef = useRef<number | null>(null);

  const itemOptions = useMemo(() => {
    const source = Array.isArray(itemList) ? itemList : itemList?.data || [];
    return source as ItemOption[];
  }, [itemList]);

  const uomOptions = useMemo(() => {
    const source = Array.isArray(uomList) ? uomList : uomList?.data || [];
    return source as UomOption[];
  }, [uomList]);

  const defaultMeterUom = useMemo(() => {
    return (
      uomOptions.find((uom) => {
        const name = uomName(uom).trim().toLowerCase();
        return name === "meters" || name === "meter";
      }) ||
      uomOptions.find((uom) => {
        const name = uomName(uom).trim().toLowerCase();
        return name === "mtrs" || name === "mtr";
      })
    );
  }, [uomOptions]);

  const resolveUomLabel = useCallback(
    (val?: string | number | null) => {
      if (val === undefined || val === null) return "—";
      const str = String(val).trim();
      if (!str || str === "—" || str === "-") return "—";
      if (/^\d+$/.test(str)) {
        const found = uomOptions.find((u) => String(u.id) === str);
        if (found) {
          const name = uomName(found);
          if (name) return name;
        }
      }
      return str;
    },
    [uomOptions]
  );

  const employees = useMemo(() => {
    return employeeList as Employee[];
  }, [employeeList]);

  const departmentCategories = useMemo(
    () =>
      (Array.isArray(subCategoryList) ? subCategoryList : []).filter(
        (subCategory: { categoryName?: string; subCategoryName?: string }) =>
          subCategory.categoryName?.trim().toLowerCase() === "department" &&
          Boolean(subCategory.subCategoryName?.trim())
      ),
    [subCategoryList]
  );

  const departments = useMemo(
    () => [
      ...new Set(
        departmentCategories
          .map((subCategory: { subCategoryName?: string }) => subCategory.subCategoryName?.trim())
          .filter((value: string | undefined): value is string => Boolean(value))
      ),
    ].sort((a, b) => a.localeCompare(b)),
    [departmentCategories]
  );

  const employeeSelectOptions = useMemo(
    () =>
      employees
        .filter((employee) => employee.isRelieved === false)
        .map((employee) => ({
          value: employee.employeeName,
          label: `${employee.employeeName}${employee.employeeCode ? ` (${employee.employeeCode})` : ""}`,
        }))
        .filter((option) => Boolean(option.value)),
    [employees]
  );

  const departmentSelectOptions = useMemo(
    () => departments.map((value) => ({ value, label: value })),
    [departments]
  );

  const itemMasterDepartmentOptions = useMemo(
    () =>
      departmentCategories.map((subCategory: { subCategoryName?: string }) => ({
        value: String(subCategory.subCategoryName?.trim() || ""),
        label: String(subCategory.subCategoryName?.trim() || ""),
      })).filter((option) => option.value),
    [departmentCategories]
  );

  const itemSelectOptions = useMemo(
    () =>
      itemOptions.map((item) => ({
        value: String(item.id),
        label: `${itemName(item)}${item.itemCode ? ` (${item.itemCode})` : ""}`,
      })),
    [itemOptions]
  );

  const uomSelectOptions = useMemo(
    () =>
      uomOptions.map((uom) => ({
        value: String(uom.id),
        label: uomName(uom),
      })),
    [uomOptions]
  );

  const readOnly = isViewMode || Boolean(currentIndent && !isPurchaseIndentEditable(currentIndent));
  const isEditingPendingApproval =
    currentIndent?.id === indentId && currentIndent?.status === "Pending approval";

  // Fetch purchase history helper with stale response guard and duplicate prevention
  const fetchPurchaseHistory = useCallback(
    async (targetItemId: number, page: number = 0) => {
      if (!targetItemId || !Number.isFinite(targetItemId) || targetItemId <= 0) return;

      latestFetchItemIdRef.current = targetItemId;

      // Immediately clear old history if selecting a different material and show loading:
      setHistoryState((prev) => ({
        itemId: targetItemId,
        loading: true,
        error: null,
        data: prev.itemId === targetItemId ? prev.data : null,
      }));

      try {
        const offset = page * historyPageSize;
        const params: Record<string, any> = {
          itemId: targetItemId,
          offset,
          limit: historyPageSize,
        };
        if (companyId) {
          params.companyId = companyId;
        }

        const response = await apiService.get<any>("/purchase-history", params);
        const unwrap = (res: any) =>
          res && typeof res === "object" && "data" in res ? res.data : res;
        const result = unwrap(response) as PurchaseHistoryResponse;

        // Discard stale responses if user changed material while request was in flight:
        if (latestFetchItemIdRef.current !== targetItemId) {
          return;
        }

        setHistoryState({
          itemId: targetItemId,
          loading: false,
          error: null,
          data: result,
        });
      } catch (fetchErr: unknown) {
        if (latestFetchItemIdRef.current !== targetItemId) return;
        const msg =
          typeof fetchErr === "object" && fetchErr !== null && "response" in fetchErr
            ? (fetchErr as any).response?.data?.message ||
              (fetchErr as any).response?.data?.error ||
              "Unable to load previous purchase history."
            : fetchErr instanceof Error
            ? fetchErr.message
            : "Unable to load previous purchase history.";
        setHistoryState((prev) => ({
          ...prev,
          loading: false,
          error: msg,
        }));
      }
    },
    [companyId, historyPageSize]
  );

  // Trigger history fetch when activeHistoryItemId or historyPage changes
  useEffect(() => {
    if (activeHistoryItemId) {
      fetchPurchaseHistory(activeHistoryItemId, historyPage);
    }
  }, [activeHistoryItemId, historyPage, fetchPurchaseHistory]);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      dispatch(getAllItemMasters({ fetchAll: true })).unwrap(),
      dispatch(getAllUomMaster({ fetchAll: true })).unwrap(),
      dispatch(getAllEmployees({ fetchAll: true })).unwrap(),
      dispatch(getAllSubCategories({ fetchAll: true })).unwrap(),
    ]).catch((loadError: unknown) => {
      if (!isCurrent) return;
      const message =
        typeof loadError === "string"
          ? loadError
          : loadError instanceof Error
          ? loadError.message
          : "Unable to load material, unit, employee, and department choices.";
      setMasterError(message);
    });
    return () => {
      isCurrent = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (indentId && Number.isFinite(indentId)) {
      if (companyId) dispatch(getPurchaseIndentById({ id: indentId, companyId }));
    } else {
      dispatch(clearCurrentIndent());
    }
    return () => {
      dispatch(clearCurrentIndent());
    };
  }, [dispatch, indentId, companyId]);

  useEffect(() => {
    if (!currentIndent || currentIndent.id !== indentId) return;
    setIndentDate(currentIndent.indentDate?.slice(0, 10) || today());
    setDepartment(currentIndent.department || "");
    setRequestedBy(currentIndent.requestedBy || "");
    setRequiredDate(currentIndent.requiredDate?.slice(0, 10) || "");
    setPriority(currentIndent.priority || "Normal");
    setRemarks(currentIndent.remarks || "");
    const loadedItems = (currentIndent.items || []).map((item) => ({
      ...item,
      itemId: Number(item.itemId),
      uomId: Number(item.uomId),
    }));
    setItems(loadedItems);

    // If viewing an existing indent with items, select the first line's history initially
    if (loadedItems.length > 0 && !activeHistoryItemId) {
      setActiveHistoryItemId(loadedItems[0].itemId);
      setActiveHistoryItemName(loadedItems[0].itemName);
      setHistoryPage(0);
    }
  }, [currentIndent, indentId, activeHistoryItemId]);

  useEffect(() => {
    if (error) setValidationMessage(error);
  }, [error]);

  useEffect(() => {
    if (defaultMeterUom && !draftItem.uomId && editingIndex === null) {
      setDraftItem((current) => ({
        ...current,
        uomId: String(defaultMeterUom.id),
      }));
    }
  }, [defaultMeterUom, draftItem.uomId, editingIndex]);

  const updateDraftItem = (updates: Partial<DraftItem>) =>
    setDraftItem((current) => ({ ...current, ...updates }));

  const handleItemSelection = (itemId: string) => {
    const selected = itemOptions.find((item) => String(item.id) === itemId);
    const suggestedUom = selected?.uomId ?? selected?.unitId;
    const resolvedName = selected ? itemName(selected) : "";
    updateDraftItem({
      itemId,
      itemName: resolvedName,
      specification: selected?.specification || selected?.itemSpecification || selected?.description || "",
      uomId: suggestedUom ? String(suggestedUom) : (draftItem.uomId || (defaultMeterUom ? String(defaultMeterUom.id) : "")),
    });

    const parsedId = Number(itemId);
    if (parsedId && Number.isFinite(parsedId) && parsedId > 0) {
      setActiveHistoryItemId(parsedId);
      setActiveHistoryItemName(resolvedName);
      setHistoryPage(0);
    } else {
      setActiveHistoryItemId(null);
      setActiveHistoryItemName("");
      setHistoryState({ itemId: null, loading: false, error: null, data: null });
    }
  };

  const handleItemMasterGstChange = (gstId: string) => {
    setSelectedGstDropdownId(gstId);
    if (!gstId) {
      setItemMasterData((current) => ({ ...current, igst: "", cgst: "", sgst: "" }));
      return;
    }
    const igst = ({ "1": 0, "2": 5, "3": 12, "4": 18, "5": 28 } as Record<string, number>)[gstId] ?? 0;
    const halfTax = String(igst / 2);
    setItemMasterData((current) => ({
      ...current,
      igst: String(igst),
      cgst: halfTax,
      sgst: halfTax,
    }));
  };

  const closeItemMasterModal = () => {
    if (isSavingItemMaster) return;
    setIsItemMasterModalOpen(false);
    setItemMasterData(blankItemMaster);
    setSelectedGstDropdownId("");
    setItemMasterErrors({});
  };

  const saveItemMaster = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!itemMasterData.itemName.trim()) errors.itemName = "Item Name is required";
    if (!itemMasterData.department) errors.department = "Department is required";
    if (!itemMasterData.uomId) errors.uomId = "UOM is required";
    if (errors.itemName || errors.department || errors.uomId) {
      setItemMasterErrors(errors);
      return;
    }

    const duplicateName = itemOptions.some(
      (item) => itemName(item).trim().toLowerCase() === itemMasterData.itemName.trim().toLowerCase()
    );
    if (duplicateName) {
      setItemMasterErrors({ itemName: "Item Name already exists" });
      return;
    }
    if (itemMasterData.itemCode.trim() && itemOptions.some(
      (item) => item.itemCode?.trim().toLowerCase() === itemMasterData.itemCode.trim().toLowerCase()
    )) {
      setItemMasterErrors({ itemCode: "Assert No/Item Code already exists" });
      return;
    }

    const selectedUom = uomOptions.find((uom) => String(uom.id) === itemMasterData.uomId);
    const payload = {
      itemName: itemMasterData.itemName.trim(),
      itemCode: itemMasterData.itemCode.trim() || null,
      department: itemMasterData.department,
      itemCategory: itemMasterData.itemCategory.trim() || null,
      hsnCode: itemMasterData.hsnCode.trim() || null,
      uomId: Number(itemMasterData.uomId),
      uomName: selectedUom ? uomName(selectedUom) : "",
      igst: itemMasterData.igst ? Number(itemMasterData.igst) : null,
      cgst: itemMasterData.cgst ? Number(itemMasterData.cgst) : null,
      sgst: itemMasterData.sgst ? Number(itemMasterData.sgst) : null,
      activeFlag: itemMasterData.activeFlag,
    };

    setIsSavingItemMaster(true);
    setItemMasterErrors({});
    try {
      const response = await dispatch(createItemMaster(payload)).unwrap();
      const createdItem = response?.data?.data || response?.data || response;
      let refreshedItems: ItemOption[] = [];
      try {
        const refreshed = await dispatch(getAllItemMasters({ fetchAll: true })).unwrap();
        refreshedItems = Array.isArray(refreshed?.data) ? refreshed.data as ItemOption[] : [];
      } catch (refreshError: unknown) {
        const message = typeof refreshError === "string"
          ? refreshError
          : refreshError instanceof Error ? refreshError.message : "Unable to refresh the item list.";
        toast.error(`Item Master was created, but the item list could not be refreshed: ${message}`);
      }
      const matchingItem = refreshedItems.find((item) =>
        (createdItem?.id && String(item.id) === String(createdItem.id)) ||
        itemName(item).trim().toLowerCase() === payload.itemName.toLowerCase()
      );
      const createdId = matchingItem?.id ?? createdItem?.id;

      if (!createdId) {
        setItemMasterErrors({
          general: "Item Master was saved, but its ID could not be resolved. Select it from the refreshed item list.",
        });
        toast.error("Item Master was saved but could not be selected.");
        return;
      }

      const id = String(createdId);
      const name = matchingItem ? itemName(matchingItem) : createdItem?.itemName || payload.itemName;
      const selectedItemUom = matchingItem?.uomId ?? matchingItem?.unitId ?? createdItem?.uomId ?? payload.uomId;
      setDraftItem((current) => ({
        ...current,
        itemId: id,
        itemName: name,
        specification: matchingItem?.specification || matchingItem?.itemSpecification || matchingItem?.description || "",
        uomId: String(selectedItemUom),
      }));
      const numericId = Number(id);
      if (Number.isFinite(numericId) && numericId > 0) {
        setActiveHistoryItemId(numericId);
        setActiveHistoryItemName(name);
        setHistoryPage(0);
      }
      setIsItemMasterModalOpen(false);
      setItemMasterData(blankItemMaster);
      setSelectedGstDropdownId("");
      toast.success("Item Master created and selected successfully.");
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error ? error.message : "Failed to create Item Master.";
      setItemMasterErrors({ general: message });
    } finally {
      setIsSavingItemMaster(false);
    }
  };

  const saveLine = () => {
    const quantity = Number(draftItem.quantity);
    if (!draftItem.itemId) return setValidationMessage("Choose a material for the item line.");
    if (!Number.isFinite(quantity) || quantity <= 0) return setValidationMessage("Enter a quantity greater than zero.");
    if (!draftItem.uomId) return setValidationMessage("Choose a unit of measure for the item line.");
    if (!draftItem.requiredDate) return setValidationMessage("Choose a required date for the item line.");
    const selectedUom = uomOptions.find((uom) => String(uom.id) === draftItem.uomId);
    const line: PurchaseIndentItem = {
      itemId: Number(draftItem.itemId),
      itemName: draftItem.itemName,
      specification: draftItem.specification.trim(),
      quantity,
      uomId: Number(draftItem.uomId),
      uomName: selectedUom ? uomName(selectedUom) : "",
      requiredDate: draftItem.requiredDate,
    };
    setItems((current) => {
      const next = [...current];
      if (editingIndex === null) next.push(line);
      else next[editingIndex] = { ...next[editingIndex], ...line };
      return next;
    });
    setDraftItem({
      ...blankItem,
      uomId: defaultMeterUom ? String(defaultMeterUom.id) : "",
    });
    setEditingIndex(null);
    setValidationMessage("");
  };

  const editLine = (index: number) => {
    const line = items[index];
    setDraftItem({
      itemId: String(line.itemId),
      itemName: line.itemName,
      specification: line.specification || "",
      quantity: String(line.quantity),
      uomId: String(line.uomId),
      requiredDate: line.requiredDate || "",
    });
    setEditingIndex(index);
    setActiveHistoryItemId(line.itemId);
    setActiveHistoryItemName(line.itemName);
    setHistoryPage(0);
  };

  const saveIndent = async (status: "Draft" | "Pending approval") => {
    setValidationMessage("");
    if (!companyId) {
      setValidationMessage("Select a company before saving a purchase indent.");
      return;
    }
    if (!indentDate || !department.trim() || !requestedBy.trim() || !requiredDate) {
      setValidationMessage("Complete the indent date, department, requester, and required date.");
      return;
    }
    if (status === "Pending approval" && items.length === 0) {
      setValidationMessage("Add at least one material line before submitting for approval.");
      return;
    }
    const savedStatus = isEditingPendingApproval ? "Pending approval" : status;
    const payload = {
      ...(indentId ? { id: indentId } : {}),
      companyId,
      indentDate,
      department: department.trim(),
      requestedBy: requestedBy.trim(),
      requiredDate,
      priority,
      remarks: remarks.trim(),
      status: savedStatus,
      items,
    };
    try {
      const saved = indentId
        ? await dispatch(updatePurchaseIndent({ ...payload, id: indentId })).unwrap()
        : await dispatch(createPurchaseIndent(payload)).unwrap();
      toast.success(
        isEditingPendingApproval
          ? "Purchase indent changes saved; it remains pending approval."
          : savedStatus === "Draft"
          ? "Purchase indent draft saved."
          : "Purchase indent submitted for approval."
      );
      navigate("/transaction/purchase-indent-details", { state: { highlightId: saved?.id } });
    } catch (saveError: unknown) {
      const message =
        typeof saveError === "string"
          ? saveError
          : saveError instanceof Error
          ? saveError.message
          : "Unable to save the purchase indent. Please try again.";
      setValidationMessage(message);
      toast.error(message);
    }
  };

  if (loading && indentId && !currentIndent) {
    return (
      <div role="status" className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow-md">
        Loading purchase indent...
      </div>
    );
  }

  if (indentId && !loading && !currentIndent && error) {
    return (
      <div role="alert" className="space-y-4 rounded-lg bg-white p-6 text-sm text-red-800 shadow-md">
        <p>{error}</p>
        <Button variant="outline" onClick={() => navigate("/transaction/purchase-indent-details")}>
          Back to Purchase Indent Details
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/transaction/purchase-indent-details")}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Purchase Indent Entry</h1>
            <p className="mt-1 text-sm text-gray-500">
              {readOnly ? "View material request details" : "Record a new material request"}
            </p>
          </div>
        </div>
        {currentIndent?.status && (
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-xs text-gray-500">{currentIndent.indentNo}</span>
            <span
              className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-semibold ${
                currentIndent.status === "Pending approval"
                  ? "bg-amber-100 text-amber-900"
                  : currentIndent.status === "Approved"
                  ? "bg-green-100 text-green-900"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  currentIndent.status === "Pending approval"
                    ? "bg-amber-600"
                    : currentIndent.status === "Approved"
                    ? "bg-green-600"
                    : "bg-gray-500"
                }`}
              />
              {currentIndent.status}
            </span>
          </div>
        )}
      </div>

      {!companyId && (
        <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Select a company before creating or updating a purchase indent.
        </div>
      )}
      {masterError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {masterError}
        </div>
      )}
      {validationMessage && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {validationMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Section 1: Indent Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} /> Indent Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="indent-number" className={labelClass}>Indent No</label>
              <input
                id="indent-number"
                readOnly
                value={currentIndent?.indentNo || "Generated on save"}
                className={`${fieldClass} bg-gray-100 font-medium`}
              />
            </div>
            <div>
              <label htmlFor="indent-date" className={labelClass}>Indent Date <span className="text-red-600">*</span></label>
              <input id="indent-date" type="date" value={indentDate} onChange={(event) => setIndentDate(event.target.value)} className={fieldClass} disabled={readOnly} required />
            </div>
            <div>
              <label htmlFor="indent-department" className={labelClass}>Department <span className="text-red-600">*</span></label>
              <CommonSearchableSelect
                id="indent-department"
                options={departmentSelectOptions}
                value={department}
                onValueChange={setDepartment}
                placeholder="Select department"
                className="w-full"
                disabled={readOnly}
              />
            </div>
            <div>
              <label htmlFor="indent-requested-by" className={labelClass}>Requested By <span className="text-red-600">*</span></label>
              <CommonSearchableSelect
                id="indent-requested-by"
                options={employeeSelectOptions}
                value={requestedBy}
                onValueChange={setRequestedBy}
                placeholder="Select employee"
                className="w-full"
                disabled={readOnly}
              />
            </div>
            <div>
              <label htmlFor="indent-required-date" className={labelClass}>Required Date <span className="text-red-600">*</span></label>
              <input id="indent-required-date" type="date" value={requiredDate} onChange={(event) => setRequiredDate(event.target.value)} className={fieldClass} disabled={readOnly} required />
            </div>
            <div>
              <label htmlFor="indent-priority" className={labelClass}>Priority</label>
              <select id="indent-priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className={fieldClass} disabled={readOnly}>
                {["Low", "Normal", "High", "Urgent"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="indent-remarks" className={labelClass}>Remarks / Purpose</label>
              <textarea id="indent-remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} className={`${fieldClass} min-h-20 resize-y`} disabled={readOnly} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Material Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Package size={20} /> Material Details</span>
              {!readOnly && <span className="text-sm font-normal text-gray-500">{items.length} line{items.length === 1 ? "" : "s"}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {!readOnly && (
              <div className="grid grid-cols-1 items-end gap-4 border-b pb-5 md:grid-cols-2 xl:grid-cols-6">
                <div className="xl:col-span-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label htmlFor="indent-item-material" className={labelClass}>
                      Item / Material <span className="text-red-600">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsItemMasterModalOpen(true)}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Plus size={13} /> Add Item Master
                    </button>
                  </div>
                  <CommonSearchableSelect
                    id="indent-item-material"
                    options={itemSelectOptions}
                    value={draftItem.itemId}
                    onValueChange={handleItemSelection}
                    placeholder="Select material"
                    className="w-full"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label htmlFor="indent-item-specification" className={labelClass}>Item Specification</label>
                  <input id="indent-item-specification" value={draftItem.specification} onChange={(event) => updateDraftItem({ specification: event.target.value })} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="indent-item-quantity" className={labelClass}>Quantity <span className="text-red-600">*</span></label>
                  <input id="indent-item-quantity" type="number" min="0.001" step="any" value={draftItem.quantity} onChange={(event) => updateDraftItem({ quantity: event.target.value })} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="indent-item-uom" className={labelClass}>UOM <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    id="indent-item-uom"
                    options={uomSelectOptions}
                    value={draftItem.uomId}
                    onValueChange={(uomId) => updateDraftItem({ uomId })}
                    placeholder="Select UOM"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="indent-item-required-date" className={labelClass}>Required Date <span className="text-red-600">*</span></label>
                  <input id="indent-item-required-date" type="date" value={draftItem.requiredDate} onChange={(event) => updateDraftItem({ requiredDate: event.target.value })} className={fieldClass} />
                </div>
                <div className="md:col-span-2 xl:col-span-6">
                  <Button type="button" onClick={saveLine} className="bg-primary inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary">
                    <Plus size={16} className="mr-2" /> {editingIndex === null ? "Add Item" : "Update Item"}
                  </Button>
                  {editingIndex !== null && (
                    <Button type="button" variant="outline" className="ml-2" onClick={() => { setEditingIndex(null); setDraftItem({ ...blankItem, uomId: defaultMeterUom ? String(defaultMeterUom.id) : "" }); }}>
                      Cancel edit
                    </Button>
                  )}
                  <span className="ml-3 text-xs text-gray-500">Available stock: —</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                    <th className="px-3 py-3">Item / Material</th>
                    <th className="px-3 py-3">Specification</th>
                    <th className="px-3 py-3 text-right">Quantity</th>
                    <th className="px-3 py-3">UOM</th>
                    <th className="px-3 py-3">Required Date</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? (
                    items.map((item, index) => {
                      const isCurrentHistoryItem = activeHistoryItemId === item.itemId;
                      return (
                        <tr
                          key={`${item.itemId}-${index}`}
                          className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${
                            isCurrentHistoryItem ? "bg-blue-50/40" : ""
                          }`}
                        >
                          <td className="px-3 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{item.itemName}</span>
                              {isCurrentHistoryItem && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                                  Viewing History
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-gray-600">{item.specification || "—"}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{formatQuantity(item.quantity)}</td>
                          <td className="px-3 py-3">{item.uomName || "—"}</td>
                          <td className="px-3 py-3">{formatDate(item.requiredDate)}</td>
                          <td className="px-3 py-3 text-center">
                            <div className="inline-flex items-center gap-1.5 justify-center">
                              <button
                                type="button"
                                title="View previous purchase history for this material"
                                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                                  isCurrentHistoryItem
                                    ? "bg-blue-100 text-blue-800 ring-1 ring-blue-300"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                                onClick={() => {
                                  setActiveHistoryItemId(item.itemId);
                                  setActiveHistoryItemName(item.itemName);
                                  setHistoryPage(0);
                                }}
                              >
                                <History size={13} /> History
                              </button>
                              {!readOnly && (
                                <>
                                  <button
                                    type="button"
                                    className="rounded px-2 py-1 text-blue-700 hover:bg-blue-50 text-xs font-medium"
                                    onClick={() => editLine(index)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${item.itemName}`}
                                    className="rounded p-1 text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                      setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                                    }
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                        No material lines added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Previous Purchase History */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-gray-100 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <History size={18} className="text-blue-600" />
                <span>Previous Purchase History</span>
              </CardTitle>
              {activeHistoryItemId ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 border border-blue-200">
                    <Package size={13} />
                    <span>{activeHistoryItemName || `Material #${activeHistoryItemId}`}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs bg-primary text-white hover:bg-primary/90"
                    disabled={historyState.loading}
                    onClick={() => fetchPurchaseHistory(activeHistoryItemId, historyPage)}
                    title="Refresh purchase history"
                  >
                    <RotateCw size={13} className={historyState.loading ? "animate-spin mr-1" : "mr-1"} />
                    Refresh
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Case 1: No material selected */}
            {!activeHistoryItemId && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
                <div className="rounded-full bg-blue-50 p-3 text-blue-600 mb-3 border border-blue-100">
                  <Info size={22} />
                </div>
                <h4 className="text-sm font-semibold text-gray-800">No Material Selected</h4>
                <p className="mt-1 text-xs text-gray-500 max-w-md">
                  Select a material in the entry form above or click <span className="font-semibold text-gray-700">"History"</span> on any added line to inspect its past purchase orders, vendor pricing, and order trends.
                </p>
              </div>
            )}

            {/* Case 2: Loading State */}
            {activeHistoryItemId && historyState.loading && !historyState.data && (
              <div className="space-y-4 py-6">
                <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                  <RotateCw size={18} className="animate-spin text-blue-600" />
                  <span>Loading previous purchase records for <span className="font-medium text-gray-900">{activeHistoryItemName}</span>...</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 rounded-lg border border-gray-200 bg-gray-100 p-3" />
                  ))}
                </div>
              </div>
            )}

            {/* Case 3: Error State */}
            {activeHistoryItemId && historyState.error && !historyState.loading && (
              <div
                role="alert"
                className="flex items-start justify-between rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="mt-0.5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Unable to fetch purchase history</p>
                    <p className="text-xs text-red-700 mt-0.5">{historyState.error}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-3 text-xs border-red-300 text-red-800 hover:bg-red-100"
                  onClick={() => fetchPurchaseHistory(activeHistoryItemId, historyPage)}
                >
                  <RotateCw size={13} className="mr-1.5" /> Retry
                </Button>
              </div>
            )}

            {/* Case 4: Loaded with 0 historical purchase records */}
            {activeHistoryItemId && !historyState.loading && !historyState.error && historyState.data && historyState.data.total === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50/50 p-8 text-center">
                <div className="rounded-full bg-amber-50 p-3 text-amber-600 mb-3 border border-amber-200">
                  <ShoppingBag size={22} />
                </div>
                <h4 className="text-sm font-semibold text-gray-900">
                  No Previous Purchases Found
                </h4>
                <p className="mt-1 text-xs text-gray-500 max-w-md">
                  No approved or active purchase orders exist for{" "}
                  <span className="font-medium text-gray-800">{historyState.data.itemName || activeHistoryItemName}</span>{" "}
                  {historyState.data.itemCode ? `(${historyState.data.itemCode})` : ""}.
                  This will be recorded as a new material purchase.
                </p>
              </div>
            )}

            {/* Case 5: Loaded with historical purchase records */}
            {activeHistoryItemId && historyState.data && historyState.data.records.length > 0 && (
              <div className="space-y-5">
                {/* 5.1 Latest Purchase Summary */}
                {historyState.data.latestPurchase && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-blue-600" />
                        Latest Purchase Summary
                      </h4>
                      <span className="text-xs text-gray-400">
                        Most recent order:{" "}
                        <span className="font-mono font-medium text-gray-700">
                          {historyState.data.latestPurchase.lastPoNumber || "—"}
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar size={13} className="text-blue-600" /> Last Purchase Date
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatDate(historyState.data.latestPurchase.lastPurchaseDate)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Receipt size={13} className="text-blue-600" /> Last PO Number
                        </div>
                        <p
                          className="mt-1 text-sm font-semibold font-mono text-gray-900 truncate"
                          title={historyState.data.latestPurchase.lastPoNumber || ""}
                        >
                          {historyState.data.latestPurchase.lastPoNumber || "—"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Building2 size={13} className="text-blue-600" /> Last Vendor Name
                        </div>
                        <p
                          className="mt-1 text-sm font-semibold text-gray-900 truncate"
                          title={historyState.data.latestPurchase.lastVendorName || ""}
                        >
                          {historyState.data.latestPurchase.lastVendorName || "—"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Package size={13} className="text-blue-600" /> Last Purchase Quantity
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900 tabular-nums">
                          {formatQuantity(historyState.data.latestPurchase.lastPurchaseQuantity)}{" "}
                          <span className="text-xs font-normal text-gray-500">
                            {resolveUomLabel(historyState.data.latestPurchase.lastUom)}
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                          <DollarSign size={13} className="text-blue-600" /> Last Purchase Unit Price
                        </div>
                        <p className="mt-1 text-base font-bold text-blue-900 tabular-nums">
                          {formatCurrency(historyState.data.latestPurchase.lastPurchaseUnitPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5.2 Recent Purchase Orders Table */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Recent Purchase Records ({historyState.data.total})
                    </h4>
                    <span className="text-xs text-gray-500">
                      Showing {historyPage * historyPageSize + 1}–
                      {Math.min((historyPage + 1) * historyPageSize, historyState.data.total)} of{" "}
                      {historyState.data.total} records
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-gray-200">
                    <table className="w-full min-w-[960px] border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b bg-gray-50 text-[11px] uppercase tracking-wider text-gray-600">
                          <th className="px-3 py-2.5 font-semibold text-center w-12">S.No</th>
                          <th className="px-3 py-2.5 font-semibold">PO Number</th>
                          <th className="px-3 py-2.5 font-semibold">PO Date</th>
                          <th className="px-3 py-2.5 font-semibold">Vendor Name</th>
                          <th className="px-3 py-2.5 font-semibold">Item / Specification</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Quantity</th>
                          <th className="px-3 py-2.5 font-semibold">UOM</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Unit Price</th>
                          <th className="px-3 py-2.5 font-semibold text-right">GST Amount</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Net Amount</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Final Amount</th>
                          <th className="px-3 py-2.5 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {historyState.data.records.map((rec, idx) => (
                          <tr
                            key={`${rec.poId}-${rec.poItemId}-${idx}`}
                            className="hover:bg-blue-50/30 transition-colors"
                          >
                            <td className="px-3 py-2.5 text-center text-gray-500 tabular-nums font-medium">
                              {historyPage * historyPageSize + idx + 1}
                            </td>
                            <td className="px-3 py-2.5 font-mono font-medium text-gray-900 whitespace-nowrap">
                              {rec.poNo || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                              {formatDate(rec.poDate)}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-gray-800">
                              {rec.vendorName}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 max-w-[200px]">
                              <div className="truncate font-medium text-gray-900" title={rec.itemName}>
                                {rec.itemName}
                              </div>
                              {rec.specification && rec.specification !== "—" && (
                                <div className="truncate text-[11px] text-gray-500" title={rec.specification}>
                                  {rec.specification}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-gray-900 tabular-nums whitespace-nowrap">
                              {formatQuantity(rec.quantity)}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                              {resolveUomLabel(rec.uom)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-blue-900 tabular-nums whitespace-nowrap">
                              {formatCurrency(rec.unitPrice)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums whitespace-nowrap">
                              {formatCurrency(rec.gstAmount)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-gray-700 tabular-nums whitespace-nowrap">
                              {formatCurrency(rec.netAmount)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">
                              {formatCurrency(rec.finalAmount)}
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  rec.status === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {rec.status || "Active"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {historyState.data.total > historyPageSize && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">
                        Page {historyPage + 1} of {Math.ceil(historyState.data.total / historyPageSize)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={historyPage === 0 || historyState.loading}
                          onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                          className="h-7 px-2.5 text-xs"
                        >
                          <ChevronLeft size={14} className="mr-1" /> Previous
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!historyState.data.hasMore || historyState.loading}
                          onClick={() => setHistoryPage((p) => p + 1)}
                          className="h-7 px-2.5 text-xs"
                        >
                          Next <ChevronRight size={14} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/transaction/purchase-indent-details")}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving || !companyId}
            onClick={() => saveIndent(isEditingPendingApproval ? "Pending approval" : "Draft")}
          >
            <Save size={17} className="mr-2" />
            {isEditingPendingApproval ? "Save Changes" : "Save Draft"}
          </Button>
          {!isEditingPendingApproval && (
            <Button type="button" disabled={saving || !companyId} onClick={() => saveIndent("Pending approval")} className="bg-primary inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary">
              <Send size={17} className="mr-2" /> {saving ? "Saving..." : "Submit for Approval"}
            </Button>
          )}
        </div>
      )}
      {readOnly && (
        <div className="flex justify-end border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/transaction/purchase-indent-details")}>
            Back to Purchase Indent Details
          </Button>
        </div>
      )}

      {isItemMasterModalOpen && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="indent-item-master-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <h2 id="indent-item-master-title" className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <Plus size={18} className="text-blue-600" /> Add Item Master
              </h2>
              <button
                type="button"
                onClick={closeItemMasterModal}
                disabled={isSavingItemMaster}
                aria-label="Close Add Item Master"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {itemMasterErrors.general && (
              <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {itemMasterErrors.general}
              </div>
            )}

            <form onSubmit={saveItemMaster} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Item Name <span className="text-red-600">*</span></label>
                  <input
                    value={itemMasterData.itemName}
                    onChange={(event) => {
                      setItemMasterData((current) => ({ ...current, itemName: event.target.value }));
                      setItemMasterErrors((current) => ({ ...current, itemName: "" }));
                    }}
                    placeholder="Enter item name"
                    className={fieldClass}
                  />
                  {itemMasterErrors.itemName && <p className="mt-1 text-xs text-red-600">{itemMasterErrors.itemName}</p>}
                </div>
                <div>
                  <label className={labelClass}>Assert No/Item Code</label>
                  <input
                    value={itemMasterData.itemCode}
                    onChange={(event) => {
                      setItemMasterData((current) => ({ ...current, itemCode: event.target.value }));
                      setItemMasterErrors((current) => ({ ...current, itemCode: "" }));
                    }}
                    placeholder="Enter Assert No / Item Code"
                    className={fieldClass}
                  />
                  {itemMasterErrors.itemCode && <p className="mt-1 text-xs text-red-600">{itemMasterErrors.itemCode}</p>}
                </div>
                <div>
                  <label className={labelClass}>Department <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    options={itemMasterDepartmentOptions}
                    value={itemMasterData.department}
                    onValueChange={(department) => {
                      setItemMasterData((current) => ({ ...current, department }));
                      setItemMasterErrors((current) => ({ ...current, department: "" }));
                    }}
                    placeholder="Select Department"
                    error={itemMasterErrors.department}
                  />
                </div>
                <div>
                  <label className={labelClass}>Item Category</label>
                  <input
                    value={itemMasterData.itemCategory}
                    onChange={(event) => setItemMasterData((current) => ({ ...current, itemCategory: event.target.value }))}
                    placeholder="Enter item category"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>HSN Code</label>
                  <input
                    value={itemMasterData.hsnCode}
                    onChange={(event) => setItemMasterData((current) => ({ ...current, hsnCode: event.target.value }))}
                    placeholder="Enter HSN Code"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>UOM <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    options={uomSelectOptions}
                    value={itemMasterData.uomId}
                    onValueChange={(uomId) => {
                      setItemMasterData((current) => ({ ...current, uomId }));
                      setItemMasterErrors((current) => ({ ...current, uomId: "" }));
                    }}
                    placeholder="Select UOM"
                    error={itemMasterErrors.uomId}
                  />
                </div>
                <div>
                  <label className={labelClass}>IGST %</label>
                  <CommonSearchableSelect
                    options={[0, 5, 12, 18, 28].map((rate, index) => ({
                      value: String(index + 1),
                      label: String(rate),
                    }))}
                    value={selectedGstDropdownId}
                    onValueChange={handleItemMasterGstChange}
                    placeholder="Select IGST %"
                  />
                </div>
                <div>
                  <label className={labelClass}>CGST %</label>
                  <input value={itemMasterData.cgst} readOnly placeholder="CGST %" className={`${fieldClass} bg-gray-50`} />
                </div>
                <div>
                  <label className={labelClass}>SGST %</label>
                  <input value={itemMasterData.sgst} readOnly placeholder="SGST %" className={`${fieldClass} bg-gray-50`} />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={itemMasterData.activeFlag}
                  onChange={(event) => setItemMasterData((current) => ({ ...current, activeFlag: event.target.checked }))}
                />
                Active
              </label>
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button type="button" variant="outline" onClick={closeItemMasterModal} disabled={isSavingItemMaster}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSavingItemMaster} className="bg-primary text-white">
                  {isSavingItemMaster ? "Saving..." : "Save Item Master"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
