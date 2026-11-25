import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { FileText, ClipboardList, ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllItemMasters } from "@/state/itemSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { toast } from "react-toastify";
import apiService from "@/services/ApiService";
import documentNumberService from "@/services/DocumentNumberService";
import { createItemOutward, updateItemOutward, getItemOutwardById } from "@/state/itemOutwardSlice";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import CommonMultiSearchableSelect from "@/components/ui/CommonMultiSearchableSelect";
import { useFilteredWarehouseOptions } from "@/hooks/useFilteredWarehouseOptions";
import { getSubCategoryByCategory, getAllSubCategories } from "@/state/subCategorySlice";
import { getAllMachines } from "@/state/machineMasterSlice";
import { DataTable } from "@/components/data/DataTable";
import { filterVendorsByTypeIds } from "@/utils/vendorFilters";

interface ItemDetailRow {
  id?: string | number;
  itemName: string;
  itemCode: string;
  itemDepartment?: string;
  availableBags: number;
  availableQuantity: number;
  unitPerBags: number;
  issuingBags: number;
  issuingQuantity: number;
  inwardNo?: string;
  warehouseId?: number;
  warehouseName?: string;
  itemId?: number;
  itemStockDetailId?: number;
  machineId?: number | null;
  machineName?: string;
}

interface PopupItem {
  selected: boolean;
  inwardNo: string;
  itemName: string;
  itemCode: string;
  itemDepartment?: string;
  warehouse: string;
  warehouseId: number;
  availableBags: number;
  unitPerBags: number;
  availableQuantity: number;
  itemId: number;
  itemStockDetailId?: number;
  machineName?: string;
  machineId?: number | null;
}

const ItemOutwardStockDetails = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { itemList } = useSelector((state: RootState) => state.itemMaster);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const { subCategoryList, subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
  const machineState = useSelector((state: RootState) => (state as any).machineMaster || { machineList: [] });
  const machineList = machineState.machineList || [];

  const { filteredWarehouseOptions: itemWarehouseOptions, defaultWarehouseId: defaultItemWarehouseId } =
    useFilteredWarehouseOptions(warehouseList, 'Item');

  // Filter vendors by vendorTypeId 305 (Item vendors) and 307 (All category)
  const filteredVendorList = useMemo(() => {
    return filterVendorsByTypeIds(vendorList, [305], { includeAllVendorTypeId: 307 });
  }, [vendorList]);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [itemDetails, setItemDetails] = useState<ItemDetailRow[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [popupItems, setPopupItems] = useState<PopupItem[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  
  const { machineNameSuggestions } = useSelector((state: RootState) => state.itemOutward);

  const departmentOptions = useMemo(() => {
    const list = Array.isArray(subCategoryByCategoryList) ? subCategoryByCategoryList : [];
    const opts = list.map((item: any) => ({
      value: String(item.subCategoryName || item.name || ''),
      label: String(item.subCategoryName || item.name || ''),
      activeFlag: item.activeFlag ?? true,
    }));
    return [{ value: "All", label: "All" }, ...opts];
  }, [subCategoryByCategoryList]);

  const { register, watch, setValue, reset, formState: { errors } } = useForm<any>({
    defaultValues: {
      department: "All"
    }
  });

  // Get vendor name from vendor ID
  const getVendorName = useCallback((vendorId: number | string | null | undefined): string => {
    if (!vendorId || !vendorList) return '';
    const vendor = Array.isArray(vendorList) 
      ? vendorList.find((v: any) => v.id === Number(vendorId))
      : vendorList?.data?.find((v: any) => v.id === Number(vendorId));
    return vendor?.vendorName || '';
  }, [vendorList]);

  // Get warehouse name from warehouse ID
  const getWarehouseName = useCallback((warehouseId: number | string | null | undefined): string => {
    if (!warehouseId || !warehouseList) return '';
    const warehouse = Array.isArray(warehouseList)
      ? warehouseList.find((w: any) => w.id === Number(warehouseId))
      : warehouseList?.data?.find((w: any) => w.id === Number(warehouseId));
    return warehouse?.warehouseName || '';
  }, [warehouseList]);

  // Get item name from item ID
  const getItemName = useCallback((itemId: number | string | null | undefined): string => {
    if (!itemId || !itemList) return '';
    const item = Array.isArray(itemList)
      ? itemList.find((i: any) => i.id === Number(itemId))
      : itemList?.data?.find((i: any) => i.id === Number(itemId));
    return item?.itemName || '';
  }, [itemList]);

  // Get item code from item ID
  const getItemCode = useCallback((itemId: number | string | null | undefined): string => {
    if (!itemId || !itemList) return '';
    const item = Array.isArray(itemList)
      ? itemList.find((i: any) => i.id === Number(itemId))
      : itemList?.data?.find((i: any) => i.id === Number(itemId));
    return item?.itemCode || '';
  }, [itemList]);

  // Get department from item ID
  const getDepartment = useCallback((itemId: number | string | null | undefined): string => {
    if (!itemId || !itemList) return '';
    const item = Array.isArray(itemList)
      ? itemList.find((i: any) => i.id === Number(itemId))
      : itemList?.data?.find((i: any) => i.id === Number(itemId));
    return item?.department || '';
  }, [itemList]);

  // Helper to find machine ID from machine ID, name, or no
  const getMachineIdFromName = useCallback((machineNameVal: string | number | null | undefined): number | null => {
    if (!machineNameVal || !machineList) return null;
    const list = Array.isArray(machineList) ? machineList : (machineList?.data || []);
    
    // If it's already a valid numeric ID or numeric string
    const numVal = Number(machineNameVal);
    if (!isNaN(numVal) && numVal > 0) {
      const matchById = list.find((item: any) => Number(item.id) === numVal);
      if (matchById) return Number(matchById.id);
    }

    const targetStr = String(machineNameVal).trim().toLowerCase();
    const m = list.find((item: any) => {
      const idStr = String(item.id || '').trim().toLowerCase();
      const nameStr = String(item.machineName || '').trim().toLowerCase();
      const noStr = String(item.machineNo || '').trim().toLowerCase();
      return idStr === targetStr || nameStr === targetStr || noStr === targetStr;
    });

    if (m?.id) return Number(m.id);
    return !isNaN(numVal) && numVal > 0 ? numVal : null;
  }, [machineList]);

  // Helper to find machine name from machine ID, name, or no
  const getMachineNameFromId = useCallback((machineIdVal: number | string | null | undefined): string => {
    if (!machineIdVal || !machineList) return '';
    const list = Array.isArray(machineList) ? machineList : (machineList?.data || []);
    
    const targetStr = String(machineIdVal).trim().toLowerCase();
    const m = list.find((item: any) => {
      const idStr = String(item.id || '').trim().toLowerCase();
      const nameStr = String(item.machineName || '').trim().toLowerCase();
      const noStr = String(item.machineNo || '').trim().toLowerCase();
      return idStr === targetStr || nameStr === targetStr || noStr === targetStr;
    });

    if (m) {
      return m.machineName || m.machineNo || String(m.id);
    }
    return typeof machineIdVal === 'string' && isNaN(Number(machineIdVal)) ? machineIdVal : '';
  }, [machineList]);

  const selectedDepartment = watch("department") || "All";

  const selectedDeptArray = useMemo(() => {
    if (!selectedDepartment) return ["All"];
    if (Array.isArray(selectedDepartment)) return selectedDepartment;
    const split = String(selectedDepartment).split(",").map((s) => s.trim()).filter(Boolean);
    return split.length > 0 ? split : ["All"];
  }, [selectedDepartment]);

  const getMachineOptionsForDept = useCallback((deptName?: string) => {
    const list = Array.isArray(machineList) ? machineList : (machineList?.data || []);
    if (!deptName || deptName === "All") {
      return list.map((m: any) => {
        const displayName = m.machineName ? (m.machineNo ? `${m.machineNo} - ${m.machineName}` : m.machineName) : (m.machineNo || `Machine ${m.id}`);
        return {
          value: String(m.id),
          label: String(displayName),
          activeFlag: m.activeFlag ?? true,
        };
      });
    }

    const catList = Array.isArray(subCategoryByCategoryList) ? subCategoryByCategoryList : [];
    const allList = Array.isArray(subCategoryList) ? subCategoryList : (subCategoryList?.data || []);
    const combined = catList.length > 0 ? catList : (Array.isArray(allList) ? allList : []);

    const found = combined.find((item: any) =>
      String(item.subCategoryName || item.name || '').trim().toLowerCase() === String(deptName).trim().toLowerCase()
    );
    const deptId = found ? String(found.id) : null;

    const filtered = list.filter((m: any) => {
      const matchByDeptId = deptId !== null && String(m.departmentId) === String(deptId);
      const matchByDeptName = (m.departmentName || m.department) &&
        String(m.departmentName || m.department).trim().toLowerCase() === String(deptName).trim().toLowerCase();
      const matchByDirectId = String(m.departmentId || '').trim().toLowerCase() === String(deptName).trim().toLowerCase();
      return matchByDeptId || matchByDeptName || matchByDirectId;
    });

    const displayList = filtered.length > 0 ? filtered : list;

    return displayList.map((m: any) => {
      const displayName = m.machineName ? (m.machineNo ? `${m.machineNo} - ${m.machineName}` : m.machineName) : (m.machineNo || `Machine ${m.id}`);
      return {
        value: String(m.id),
        label: String(displayName),
        activeFlag: m.activeFlag ?? true,
      };
    });
  }, [machineList, subCategoryByCategoryList, subCategoryList]);

  const popupColumns = useMemo(() => [
    {
      Header: () => {
        const allSelected = popupItems.length > 0 && popupItems.every((i) => i.selected);
        const someSelected = popupItems.some((i) => i.selected);
        return (
          <div className="flex justify-center items-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) input.indeterminate = !allSelected && someSelected;
              }}
              onChange={(e) => {
                const checked = e.target.checked;
                setPopupItems((prev) => prev.map((item) => ({ ...item, selected: checked })));
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        );
      },
      accessor: "selected",
      disableFilters: true,
      width: 50,
      Cell: ({ row }: { row: { original: PopupItem; index: number } }) => {
        const idx = row.index;
        return (
          <div className="flex justify-center items-center">
            <input
              type="checkbox"
              checked={row.original.selected || false}
              onChange={(e) => {
                setPopupItems((prev) => {
                  const updated = [...prev];
                  if (updated[idx]) {
                    updated[idx] = { ...updated[idx], selected: e.target.checked };
                  }
                  return updated;
                });
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        );
      },
    },
    {
      Header: "Inward No",
      accessor: "inwardNo",
      Cell: ({ value }: { value: any }) => (
        <span className="font-mono text-xs font-semibold text-slate-800">{value || '-'}</span>
      ),
    },
    {
      Header: "Description/Item Name",
      accessor: "itemName",
      Cell: ({ value }: { value: any }) => (
        <span className="font-semibold text-slate-900">{value || '-'}</span>
      ),
    },
    {
      Header: "Item Code",
      accessor: "itemCode",
      Cell: ({ value }: { value: any }) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200 font-mono font-medium">
          {value || '-'}
        </span>
      ),
    },
    {
      Header: "Department",
      accessor: "itemDepartment",
      Cell: ({ row }: { row: { original: PopupItem } }) => {
        const dept = row.original.itemDepartment || getDepartment(row.original.itemId);
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 inline-block">
            {dept || '-'}
          </span>
        );
      },
    },
    {
      Header: "Warehouse",
      accessor: "warehouse",
      Cell: ({ value }: { value: any }) => (
        <span className="text-slate-600 text-xs font-medium">{value || '-'}</span>
      ),
    },
    {
      Header: "Available Bags",
      accessor: "availableBags",
      Cell: ({ value }: { value: any }) => (
        <div className="text-right font-medium text-slate-700">{Number(value || 0).toLocaleString('en-IN')}</div>
      ),
    },
    {
      Header: "Unit per Bags",
      accessor: "unitPerBags",
      Cell: ({ value }: { value: any }) => (
        <div className="text-right font-medium text-slate-700">{Number(value || 0).toLocaleString('en-IN')}</div>
      ),
    },
    {
      Header: "Available Quantity",
      accessor: "availableQuantity",
      Cell: ({ value }: { value: any }) => (
        <div className="text-right font-bold text-emerald-700">{Number(value || 0).toLocaleString('en-IN')}</div>
      ),
    },
    {
      Header: "Machine No/Name",
      accessor: "machineName",
      Cell: ({ row }: { row: { original: PopupItem; index: number } }) => {
        const idx = row.index;
        const item = row.original;
        const currentMachineVal = item.machineId ? String(item.machineId) : (item.machineName ? String(getMachineIdFromName(item.machineName) || item.machineName) : "");
        return (
          <div className="min-w-[200px] py-0.5">
            <CommonSearchableSelect
              placeholder="Select Machine"
              value={currentMachineVal}
              options={getMachineOptionsForDept(item.itemDepartment || getDepartment(item.itemId))}
              filterActive
              onValueChange={(val) => {
                setPopupItems((prev) => {
                  const updated = [...prev];
                  const mId = val ? (getMachineIdFromName(val) || (Number(val) > 0 ? Number(val) : null)) : null;
                  const mName = getMachineNameFromId(val || mId);
                  if (updated[idx]) {
                    updated[idx] = { ...updated[idx], machineName: mName || val, machineId: mId };
                  }
                  return updated;
                });
              }}
            />
          </div>
        );
      },
    },
  ], [popupItems, getMachineOptionsForDept, getDepartment, getMachineIdFromName]);

  const location = useLocation();
  const itemOutwardDtl = location.state?.itemOutwardDtl || location.state?.record;
  const navigate = useNavigate();
  const [loadedItemOutward, setLoadedItemOutward] = useState<any>(null);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

     const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

    
 // Generate document number for new beam inward entries
    useEffect(() => {
        const generateDocumentNumber = async () => {
            // Only generate for new entries (not editing existing ones)
            if (itemOutwardDtl || hasGeneratedNumberRef.current) {
                return;
            }

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Material Issue'
                });

                setValue('outwardNo', result.documentNumber, { shouldValidate: true });
                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate beam inward number:', error);
                toast.error('Failed to generate beam inward number');
            }
        };

        generateDocumentNumber();
    }, [itemOutwardDtl, setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !itemOutwardDtl) {
                documentNumberService.clearMemoryCache('Material Issue');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !itemOutwardDtl) {
                documentNumberService.clearMemoryCache('Material Issue');
            }
        };
    }, [itemOutwardDtl]);

  useEffect(() => {
    setValue('outwardNo', itemOutwardDtl?.outwardNo || '') ;
  }, [itemOutwardDtl, setValue]);

  useEffect(() => {
    dispatch(getAllVendors({fetchAll: true}));
    dispatch(getAllItemMasters({ fetchAll: true }));
    dispatch(getAllWarehouse({fetchAll: true}));
    dispatch(getAllUomMaster({fetchAll: true}));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(getSubCategoryByCategory({ categoryName: 'Department', fetchAll: true }));
    dispatch(getAllMachines({ fetchAll: true }));

    // Set outward date to current date
    setValue("outwardDate", getCurrentDate());

    // Load machine name suggestions
  }, [dispatch, setValue, itemOutwardDtl]);

  useEffect(() => {
    if (!itemOutwardDtl && defaultItemWarehouseId) {
      setValue('warehouseId', defaultItemWarehouseId, { shouldValidate: true });
      setSelectedWarehouseId(Number(defaultItemWarehouseId));
    }
  }, [defaultItemWarehouseId, itemOutwardDtl, setValue]);

  // Fetch full record if we have an ID but incomplete data
  useEffect(() => {
    const fetchFullRecord = async () => {
      if (!itemOutwardDtl) return;
      
      // If we already have loaded data, skip
      if (loadedItemOutward) return;
      
      if (itemOutwardDtl.id) {
        try {
          const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
          const companyId = storedCompanyId ? Number(storedCompanyId) : undefined;
          
          const result = await dispatch(getItemOutwardById({ 
            id: itemOutwardDtl.id, 
            companyId 
          })).unwrap();
          
          if (result) {
            setLoadedItemOutward(result);
          }
        } catch (error) {
          console.error('Error fetching item outward details:', error);
          // If fetch fails, use the data from location state
          setLoadedItemOutward(itemOutwardDtl);
        }
      } else {
        // If no ID, use the data from location state directly
        setLoadedItemOutward(itemOutwardDtl);
      }
    };

    fetchFullRecord();
  }, [itemOutwardDtl?.id, dispatch]);

  // Initialize form data from itemOutwardDtl on first load (edit mode)
  useEffect(() => {
    const dataToLoad = loadedItemOutward || itemOutwardDtl;
    
    if (dataToLoad && dataToLoad.id) {
      if (!isEditMode) {
        setIsEditMode(true);
      }
      
      setValue("id", dataToLoad.id || 0);
      setValue("outwardDate", dataToLoad.outwardDate ? (dataToLoad.outwardDate.includes('T') ? dataToLoad.outwardDate.slice(0, 10) : dataToLoad.outwardDate) : getCurrentDate());
      setValue("outwardNo", dataToLoad.outwardNo || '');
      setValue("vendorId", dataToLoad.vendorId ? Number(dataToLoad.vendorId) : '');
      setValue("department", dataToLoad.department || '');
      setValue("machineName",dataToLoad.machineName || '');
      // Handle warehouseId - if null, try to find from warehouse name
      let warehouseIdValue = dataToLoad.warehouseId;
      if (!warehouseIdValue && dataToLoad.warehouse) {
        const warehouse = Array.isArray(warehouseList) 
          ? warehouseList.find((w: any) => w.warehouseName === dataToLoad.warehouse)
          : warehouseList?.data?.find((w: any) => w.warehouseName === dataToLoad.warehouse);
        warehouseIdValue = warehouse?.id || null;
      }
      setValue("warehouseId", warehouseIdValue ? Number(warehouseIdValue) : '');

      // Load item details - check multiple possible field names
      // Backend returns itemOutwardStockDetails with different field names
      const items = dataToLoad.itemOutwardStockDetails || dataToLoad.itemOutwardItemsDtl || dataToLoad.items || dataToLoad.itemOutwardItems || [];
      
      if (items && items.length > 0) {
        const loadedItems: ItemDetailRow[] = items.map((item: any) => {
          // Get warehouseId from warehouse name if warehouseId is null
          let warehouseIdValue = item.warehouseId;
          if (!warehouseIdValue && item.warehouse) {
            // Try to find warehouseId from warehouse name
            const warehouse = Array.isArray(warehouseList) 
              ? warehouseList.find((w: any) => w.warehouseName === item.warehouse)
              : warehouseList?.data?.find((w: any) => w.warehouseName === item.warehouse);
            warehouseIdValue = warehouse?.id || dataToLoad.warehouseId || null;
          } else if (!warehouseIdValue) {
            warehouseIdValue = dataToLoad.warehouseId || null;
          }

          // Get item name from itemId if itemName is empty
          const itemIdValue = item.itemId;
          let itemNameValue = item.itemName || '';
          if (!itemNameValue && itemIdValue) {
            // Look up item name from itemList
            const itemFromList = Array.isArray(itemList)
              ? itemList.find((i: any) => i.id === Number(itemIdValue))
              : itemList?.data?.find((i: any) => i.id === Number(itemIdValue));
            itemNameValue = itemFromList?.itemName || '';
          }

          // Get item code from itemId if itemCode is empty
          let itemCodeValue = item.itemCode || '';
          if (!itemCodeValue && itemIdValue) {
            // Look up item code from itemList
            const itemFromList = Array.isArray(itemList)
              ? itemList.find((i: any) => i.id === Number(itemIdValue))
              : itemList?.data?.find((i: any) => i.id === Number(itemIdValue));
            itemCodeValue = itemFromList?.itemCode || '';
          }

          // Get machineId and machineName
          let itemMachineId = item.machineId ?? (item.machine?.id || null);
          let itemMachineName = item.machineName || item.machineNo || item.machine?.machineName || item.machine?.machineNo || '';

          if (!itemMachineName && itemMachineId) {
            itemMachineName = getMachineNameFromId(itemMachineId);
          }
          if (!itemMachineId && itemMachineName) {
            itemMachineId = getMachineIdFromName(itemMachineName);
          }
          if (!itemMachineId && !itemMachineName && dataToLoad.machineName) {
            itemMachineName = dataToLoad.machineName;
            itemMachineId = getMachineIdFromName(dataToLoad.machineName);
          }

          return {
            id: item.id,
            itemName: itemNameValue,
            itemCode: itemCodeValue,
            itemDepartment: item.department || item.itemDepartment || getDepartment(itemIdValue),
            availableBags: Number(item.availableBags || 0),
            availableQuantity: Number(item.availableQuantity || 0),
            // Backend uses unitPerBag (singular), but we use unitPerBags (plural) in frontend
            unitPerBags: Number(item.unitPerBags || item.unitPerBag || 0),
            // Handle null values - preserve the value
            issuingBags: item.issuingBags !== null && item.issuingBags !== undefined ? Number(item.issuingBags) : 0,
            issuingQuantity: item.issuingQuantity !== null && item.issuingQuantity !== undefined ? Number(item.issuingQuantity) : 0,
            inwardNo: item.inwardNo || '',
            warehouseId: warehouseIdValue,
            warehouseName: item.warehouse || item.warehouseName || '',
            itemId: itemIdValue,
            // Backend uses itemInwardStockDetailsId, but we use itemStockDetailId
            itemStockDetailId: item.itemStockDetailId || item.itemInwardStockDetailsId || null,
            machineId: itemMachineId ? Number(itemMachineId) : null,
            machineName: itemMachineName,
          };
        });
        
        // Update itemDetails when full data is loaded or if it's currently empty
        setItemDetails(loadedItems);
      }
      
      setSelectedWarehouseId(dataToLoad.warehouseId || null);
    }
  }, [loadedItemOutward, itemOutwardDtl, warehouseList, itemList, getMachineIdFromName, getMachineNameFromId, getDepartment]);



  // Fetch item inventory filtered by warehouse and department
  const fetchInventoryStock = async (warehouseIdVal: string | number, deptVal?: string | string[]) => {
    try {
      const response = await apiService.get('/item-stock-details/filter', {
        warehouseId: Number(warehouseIdVal),
        companyId: localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany')
      });

      const responseData = response?.data || [];
      const stockData = Array.isArray(responseData) ? responseData : [];
      
      let depts: string[] = [];
      if (Array.isArray(deptVal)) {
        depts = deptVal;
      } else if (typeof deptVal === 'string' && deptVal.trim()) {
        depts = deptVal.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        depts = selectedDeptArray;
      }

      const isAllDepts = depts.length === 0 || depts.includes("All");

      // Filter inventory items by available quantity > 0 and matching item department from itemSlice (itemList)
      const filteredStockData = stockData.filter((item: any) => {
        const stockDetails = item?.itemInwardStockDetails || {};
        
        // Filter out items where available quantity or available bags is 0 or less
        const availQty = Number(stockDetails.availableQty ?? stockDetails.availableQuantity ?? 0);
        const availBags = Number(stockDetails.availableBags ?? 0);
        if (availQty <= 0 && availBags <= 0) {
          return false;
        }

        if (isAllDepts) return true;

        const itemId = Number(stockDetails.itemId || 0);
        const itemDept = getDepartment(itemId);
        if (!itemDept) return true;
        return depts.some(d => d.toLowerCase() === itemDept.trim().toLowerCase());
      });

      const popupData: PopupItem[] = filteredStockData.map((item: any) => {
        const stockDetails = item?.itemInwardStockDetails || {};
        const inventory = item?.itemInventory || {};
        
        const itemId = Number(stockDetails.itemId || 0);
        const itemName = getItemName(itemId) || stockDetails.itemName || '';
        const itemCode = getItemCode(itemId) || '';
        const itemDept = getDepartment(itemId) || stockDetails.department || '';
        
        const warehouseIdFromStock = Number(stockDetails.warehouseId || 0);
        const warehouseName = getWarehouseName(warehouseIdFromStock) || '';

        return {
          selected: false,
          inwardNo: stockDetails.inwardNo || inventory.inwardNo || '',
          itemName: itemName,
          itemCode: itemCode,
          itemDepartment: itemDept,
          warehouse: warehouseName,
          warehouseId: warehouseIdFromStock,
          availableBags: Number(stockDetails.availableBags || 0),
          unitPerBags: Number(stockDetails.kgsPerBag || 0),
          availableQuantity: Number(stockDetails.availableQty || 0),
          itemId: itemId,
          itemStockDetailId: stockDetails.id,
          machineName: watch("machineName") || '',
          machineId: getMachineIdFromName(watch("machineName")),
        };
      });

      setPopupItems(popupData);
    } catch (error) {
      console.error('Error fetching item inventory:', error);
      toast.error('Failed to fetch item inventory data');
    }
  };

  // Open popup to select items
  const handleOpenPopup = async () => {
    const warehouseId = watch("warehouseId");
    const department = watch("department");

    if (!warehouseId) {
      toast.error("Please select Warehouse first");
      return;
    }

    await fetchInventoryStock(warehouseId, department);
    setIsPopupOpen(true);
  };

  // Confirm selection from popup
  const handleConfirmSelection = () => {
    const selectedItems = popupItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    const defaultMachineName = watch("machineName") || '';
    const defaultMachineId = getMachineIdFromName(defaultMachineName);

    const newItems: ItemDetailRow[] = selectedItems.map((popupItem) => ({
      id: `new-${Date.now()}-${Math.random()}`,
      itemName: popupItem.itemName,
      itemCode: popupItem.itemCode,
      itemDepartment: popupItem.itemDepartment || getDepartment(popupItem.itemId),
      availableBags: popupItem.availableBags,
      availableQuantity: popupItem.availableQuantity,
      unitPerBags: popupItem.unitPerBags,
      issuingBags: 0,
      issuingQuantity: 0,
      inwardNo: popupItem.inwardNo,
      warehouseId: popupItem.warehouseId,
      warehouseName: popupItem.warehouse,
      itemId: popupItem.itemId,
      itemStockDetailId: popupItem.itemStockDetailId,
      machineName: popupItem.machineName || defaultMachineName,
      machineId: popupItem.machineId || defaultMachineId,
    }));

    // Auto update header department field if un-set or if currently "All"
    const currentDept = watch("department");
    const itemDepts = Array.from(new Set(newItems.map(i => i.itemDepartment).filter(Boolean)));
    if ((!currentDept || currentDept === "All" || currentDept.trim() === "") && itemDepts.length > 0) {
      setValue("department", itemDepts.join(", "), { shouldValidate: true });
    }

    setItemDetails(prev => [...prev, ...newItems]);
    setIsPopupOpen(false);
    setPopupItems([]);
  };

  // Handle item detail changes
  const handleItemDetailChange = (index: number, field: keyof ItemDetailRow, value: any) => {
    const updatedItems = [...itemDetails];
    const item = updatedItems[index];

    if (field === 'issuingBags') {
      let bags = Number(value);
      if (isNaN(bags)) bags = 0;

      if (bags > item.availableBags) {
        toast.error(`Issuing Bags cannot exceed Available Bags (${item.availableBags})`);
        bags = item.availableBags;
      }

      const unitPerBags = item.unitPerBags || 0;
      const computedQty = bags * unitPerBags;

      // Check if computed quantity exceeds available quantity
      if (computedQty > item.availableQuantity) {
        toast.error(`Issuing Quantity cannot exceed Available Quantity (${item.availableQuantity})`);
        updatedItems[index] = {
          ...item,
          issuingQuantity: item.availableQuantity,
          issuingBags: unitPerBags > 0 ? item.availableQuantity / unitPerBags : bags,
        };
      } else {
        updatedItems[index] = {
          ...item,
          issuingBags: bags,
          issuingQuantity: computedQty,
        };
      }
    } else if (field === 'issuingQuantity') {
      let qty = Number(value);
      if (isNaN(qty)) qty = 0;

      if (qty > item.availableQuantity) {
        toast.error(`Issuing Quantity cannot exceed Available Quantity (${item.availableQuantity})`);
        qty = item.availableQuantity;
      }

      const unitPerBags = item.unitPerBags || 0;
      const computedBags = unitPerBags > 0 ? qty / unitPerBags : item.issuingBags;

      if (computedBags > item.availableBags) {
        toast.error(`Issuing Bags cannot exceed Available Bags (${item.availableBags})`);
        updatedItems[index] = {
          ...item,
          issuingBags: item.availableBags,
          issuingQuantity: item.availableBags * unitPerBags,
        };
      } else {
        updatedItems[index] = {
          ...item,
          issuingQuantity: qty,
          issuingBags: computedBags,
        };
      }
    } else {
      updatedItems[index] = {
        ...item,
        [field]: value,
      };
    }

    setItemDetails(updatedItems);
  };

  // Remove item detail row
  const handleRemoveItem = (index: number) => {
    setItemDetails(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate item summary
  const itemSummary = useMemo(() => {
    const summaryMap = new Map<string, { itemName: string; itemCode: string; totalIssuingBags: number; totalIssuingQuantity: number }>();

    itemDetails.forEach((item) => {
      const key = `${item.itemId || item.itemName}`;
      const existing = summaryMap.get(key) || {
        itemName: item.itemName,
        itemCode: item.itemCode,
        totalIssuingBags: 0,
        totalIssuingQuantity: 0,
      };

      existing.totalIssuingBags += Number(item.issuingBags || 0);
      existing.totalIssuingQuantity += Number(item.issuingQuantity || 0);
      summaryMap.set(key, existing);
    });

    return Array.from(summaryMap.values());
  }, [itemDetails]);

  // Handle save
  const handleSave = async (data: any) => {
    const outwardDate = watch("outwardDate");
    let department = watch("department");
    const machineName = watch("machineName");
    const warehouseId = watch("warehouseId");

    if (!outwardDate) {
      toast.error("Outward Date is required");
      return;
    }

    if (!department || (typeof department === 'string' && department.trim() === '')) {
      const itemDepts = Array.from(new Set(itemDetails.map(i => i.itemDepartment || getDepartment(i.itemId)).filter(Boolean)));
      department = itemDepts.length > 0 ? itemDepts.join(", ") : "All";
      setValue("department", department, { shouldValidate: true });
    }

    if (!department) {
      toast.error("Department is required");
      return;
    }

    if (!warehouseId) {
      toast.error("Warehouse is required");
      return;
    }

    if (itemDetails.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    // Validate all items have issuing quantities
    const invalidItems = itemDetails.filter(item => 
      !item.issuingBags || item.issuingBags <= 0 || 
      !item.issuingQuantity || item.issuingQuantity <= 0
    );

    if (invalidItems.length > 0) {
      toast.error("Please enter issuing bags and quantity for all items");
      return;
    }

    // Validate issuing bags & issuing quantity do not exceed available stock
    const exceededItems = itemDetails.filter(item => 
      Number(item.issuingBags || 0) > Number(item.availableBags || 0) ||
      Number(item.issuingQuantity || 0) > Number(item.availableQuantity || 0)
    );

    if (exceededItems.length > 0) {
      toast.error("Issuing Bags or Quantity cannot exceed Available Bags or Quantity");
      return;
    }

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) {
      toast.error("Please select a company before submitting");
      return;
    }
 const isEditMode = Boolean(itemOutwardDtl?.id);
       let outwardNo = data.outwardNo || itemOutwardDtl?.outwardNo || "";
            if (!itemOutwardDtl?.id && !outwardNo) {
                try {
                    const docResponse = await documentNumberService.generateDocumentNumber({
                        screenName: "Material Issue"
                    });
                    outwardNo = docResponse.documentNumber;
                } catch (error) {
                    console.warn("Failed to generate document number:", error);
                }
            }
isSavingRef.current = true;

    const currentMachineName = watch("machineName");
    const currentMachineId = getMachineIdFromName(currentMachineName);

    const firstItemMachineId = itemDetails.find(i => i.machineId != null)?.machineId || getMachineIdFromName(itemDetails.find(i => i.machineName)?.machineName) || currentMachineId || null;
    const firstItemMachineName = itemDetails.find(i => i.machineName)?.machineName || getMachineNameFromId(firstItemMachineId) || currentMachineName || null;

    const payload :any = {
      id: isEditMode ? watch("id") : undefined,
      outwardDate: outwardDate,
      outwardNo: outwardNo,
      vendorId: null,
      department: department,
      machineName: firstItemMachineName,
      machineId: firstItemMachineId,
      warehouseId: Number(warehouseId),
      companyId: parseInt(storedCompanyId),
      items: itemDetails.map(item => {
        const itemMId = item.machineId ? Number(item.machineId) : (getMachineIdFromName(item.machineName) || firstItemMachineId || null);
        const itemMName = item.machineName || getMachineNameFromId(itemMId) || firstItemMachineName || null;
        return {
          id: item.id && typeof item.id === 'number' ? item.id : undefined,
          itemId: item.itemId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          availableBags: Number(item.availableBags || 0),
          availableQuantity: Number(item.availableQuantity || 0),
          unitPerBags: Number(item.unitPerBags || 0),
          issuingBags: Number(item.issuingBags || 0),
          issuingQuantity: Number(item.issuingQuantity || 0),
          inwardNo: item.inwardNo || '',
          warehouseId: item.warehouseId ? Number(item.warehouseId) : null,
          itemStockDetailId: item.itemStockDetailId ? Number(item.itemStockDetailId) : null,
          machineId: itemMId,
          machineName: itemMName,
        };
      }),
      activeFlag: true,
    };

    try {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const companyId = storedCompanyId ? Number(storedCompanyId) : payload.companyId;

      if (isEditMode) {
        await dispatch(updateItemOutward({ 
          id: Number(watch("id")), 
          data: payload, 
          companyId 
        })).unwrap();
      } else {
        await dispatch(createItemOutward(payload)).unwrap();
 documentNumberService.clearMemoryCache("Material Issue");
      }
      navigate("/transaction/item-outward");
    } catch (error: any) {
      console.error('Error saving item outward:', error);
      // Error toast is handled in the slice
    }
  };


  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/item-outward")}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              {isEditMode ? 'Edit Material Issue' : 'Material Issue'}
            </h2>
          </div>

          <div className="space-x-2">
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary text-white px-6"
            >
              <Save size={18} className="mr-2" />
              {isEditMode ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="space-y-6 mt-10">
          {/* Outward Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} /> Outward Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium">Outward Date <span className="text-red-500">*</span></label>
                <input
                  {...register("outwardDate", { required: "Outward Date is required" })}
                  type="date"
                  className={`input mt-1 ${errors.outwardDate ? 'border-red-500' : ''}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Outward No</label>
                <input
                  {...register("outwardNo")}
                  type="text"
                  className="input mt-1"
                  readOnly
                  placeholder="Auto-generated"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Department <span className="text-red-500">*</span></label>
                <CommonMultiSearchableSelect
                  className="mt-1"
                  placeholder="Select Department(s)"
                  value={selectedDeptArray}
                  options={departmentOptions}
                  onValueChange={(vals) => {
                    const joined = vals.join(", ");
                    setValue("department", joined, { shouldValidate: true });
                  }}
                  error={errors.department?.message as string}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Warehouse <span className="text-red-500">*</span></label>
                <CommonSearchableSelect
                  className="mt-1"
                  placeholder="Select Warehouse"
                  value={watch("warehouseId") || ""}
                  options={itemWarehouseOptions}
                  filterActive
                  {...register("warehouseId", { required: "Warehouse is required" })}
                  onValueChange={(value) => {
                    setValue("warehouseId", value, { shouldValidate: true });
                    setSelectedWarehouseId(value ? Number(value) : null);
                  }}
                  error={errors.warehouseId?.message as string}
                />
              </div>
            </CardContent>
          </Card>

          {/* Item Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ClipboardList size={20} /> Description/Item Details
                </span>
                <Button onClick={handleOpenPopup}>
                  <Plus size={18} className="mr-2" />
                  Select Items
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itemDetails.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items added. Click "Select Items" to add items.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-xs">Sl.No</th>
                        <th className="border p-2 text-xs">Description/Item Name</th>
                        <th className="border p-2 text-xs">Item Code</th>
                        <th className="border p-2 text-xs">Department</th>
                        <th className="border p-2 text-xs">Machine No/Name</th>
                        <th className="border p-2 text-xs">Available Bags</th>
                        <th className="border p-2 text-xs">Available Quantity</th>
                        <th className="border p-2 text-xs">Unit per Bags</th>
                        <th className="border p-2 text-xs">Issuing Bags</th>
                        <th className="border p-2 text-xs">Issuing Quantity</th>
                        <th className="border p-2 text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemDetails.map((item, index) => (
                        <tr key={index} className="border hover:bg-gray-50">
                          <td className="border p-2 text-center">{index + 1}</td>
                          <td className="border p-2 text-xs">{item.itemName}</td>
                          <td className="border p-2 text-xs">{item.itemCode}</td>
                          <td className="border p-2 text-xs text-center font-medium">{item.itemDepartment || getDepartment(item.itemId) || '-'}</td>
                          <td className="border p-2 min-w-[180px]">
                            <CommonSearchableSelect
                              placeholder="Select Machine"
                              value={item.machineId ? String(item.machineId) : (item.machineName ? String(getMachineIdFromName(item.machineName) || item.machineName) : "")}
                              options={getMachineOptionsForDept(item.itemDepartment || getDepartment(item.itemId))}
                              filterActive
                              onValueChange={(val) => {
                                const mId = val ? (getMachineIdFromName(val) || (Number(val) > 0 ? Number(val) : null)) : null;
                                const mName = getMachineNameFromId(val || mId);
                                handleItemDetailChange(index, 'machineName', mName || val);
                                handleItemDetailChange(index, 'machineId', mId);
                              }}
                            />
                          </td>
                          <td className="border p-2 text-center">{item.availableBags}</td>
                          <td className="border p-2 text-center">{item.availableQuantity}</td>
                          <td className="border p-2 text-center">{item.unitPerBags}</td>
                          <td className="border p-2">
                            <input
                              type="number"
                              min="0"
                              max={item.availableBags}
                              step="0.01"
                              className="w-24 border p-1 text-center"
                              value={item.issuingBags || ''}
                              onChange={(e) => handleItemDetailChange(index, 'issuingBags', e.target.value)}
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              min="0"
                              max={item.availableQuantity}
                              step="0.01"
                              className="w-24 border p-1 text-center"
                              value={item.issuingQuantity || ''}
                              onChange={(e) => handleItemDetailChange(index, 'issuingQuantity', e.target.value)}
                            />
                          </td>
                          <td className="border p-2 text-center">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item Summary Section */}
          {itemSummary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList size={20} /> Item Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-xs">Sl.No</th>
                        <th className="border p-2 text-xs">Description/Item Name</th>
                        <th className="border p-2 text-xs">Item Code</th>
                        <th className="border p-2 text-xs">Issuing Bags</th>
                        <th className="border p-2 text-xs">Issuing Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemSummary.map((summary, index) => (
                        <tr key={index} className="border hover:bg-gray-50">
                          <td className="border p-2 text-center">{index + 1}</td>
                          <td className="border p-2 text-xs">{summary.itemName}</td>
                          <td className="border p-2 text-xs">{summary.itemCode}</td>
                          <td className="border p-2 text-center">{summary.totalIssuingBags.toFixed(2)}</td>
                          <td className="border p-2 text-center">{summary.totalIssuingQuantity.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Item Selection Popup */}
      <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
        <DialogContent className="w-[95vw] max-w-7xl max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden rounded-xl shadow-2xl border-slate-200">
          <DialogHeader className="pb-3 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pr-6">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" /> Select Items from Inventory
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose available inventory stock items and assign machines per item.
                </p>
              </div>

              {/* Inline Header Controls: Department Filter & Warehouse Dropdown */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Department:</span>
                  <div className="flex flex-wrap gap-1 items-center px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                    {selectedDeptArray.includes("All") || selectedDeptArray.length === 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                        All
                      </span>
                    ) : (
                      selectedDeptArray.map((dept, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                          {dept}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 min-w-[260px]">
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Warehouse
                  </span>
                  <div className="flex-1 min-w-[180px]">
                    <CommonSearchableSelect
                      placeholder="Select Warehouse"
                      value={watch("warehouseId") || ""}
                      options={itemWarehouseOptions}
                      filterActive
                      onValueChange={(value) => {
                        setValue("warehouseId", value, { shouldValidate: true });
                        setSelectedWarehouseId(value ? Number(value) : null);
                        if (value) {
                          fetchInventoryStock(value, watch("department"));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Responsive Bounded Scrollable Table Container */}
          <div>
            <DataTable
              columns={popupColumns}
              data={popupItems}
              title=""
              showActions={false}
              showExport={false}
              showColumnFilters={false}
              filterPlaceholder="Search inventory by item name, inward no, code, department..."
              disableFullDataFetch={true}
              isShowPagination={false}
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between gap-3">
            <div className="text-xs text-slate-600 font-medium">
              Selected: <span className="font-bold text-blue-600">{popupItems.filter(i => i.selected).length}</span> of {popupItems.length} items
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsPopupOpen(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSelection} 
                disabled={!popupItems.some(i => i.selected)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md"
              >
                Confirm Selection ({popupItems.filter(i => i.selected).length})
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemOutwardStockDetails;

