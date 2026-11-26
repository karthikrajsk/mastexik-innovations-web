import React, { act, useEffect, useMemo, useRef, useState } from "react";
import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, Plus, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { createPurchaseOrder, getAllPoTypes, getVendorByPoId, updatePurchaseOrder, getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllItemMasters, createItemMaster } from "@/state/itemSlice";
import { getAllFabricMasters, getAllFabricMasterDetails } from "@/state/fabricMasterSlice";
import { getAllFabricTypes } from "@/state/fabricTypeSlice";
import { getAllFabricCategory } from "@/state/fabricCategorySlice";
import { getAllKnittedFabricMasters } from "@/state/knittedMasterSlice";
import { getAllCities } from "@/state/citySlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCountries } from "@/state/countrySlice";
import { getCompanyById } from "@/state/company-master-slice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllGstMaster } from "@/state/gstMasterSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";
import { VENDOR_TYPE_ALL, filterVendorsByPoType, parseIds } from "@/utils/vendorFilters";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { CodesUtil } from "@/utils/codesUtil";
import { CodesAPI } from "@/services/codes_api";
import { CodeDetail, CodeHeader } from "@/types/codes";

import { getAllPaymentTerms } from "@/state/paymentTermsSlice";

interface PurchaseOrderFormData {
  id?: number | null;
  poNo: string;
  poTypeId: string;
  poCategoryId: string;
  poDate: string;
  vendorId: string;
  taxId: string;
  note?: string;
  activeFlag: boolean;
  isComplete?: number;
  purchaseOrderItemsDtl: PurchaseOrderItem[];
  companyId?: string;
  fabricMasterId?: number | null;
}

type ProductType = "yarn" | "fabric" | "item";

interface PurchaseOrderItem {
  id?: number;
  yarnId?: string | null;
  yarnName?: string | null;
  fabricTypeId?: string | null;
  fabricCategoryId?: string | null;
  fabricId?: string | null;
  fabricMasterId?: string | null; // Selected Fabric Master (to derive Fabric Code & Quality)
  itemId?: string | null; // Selected Item Master
  itemName?: string | null; // Item Name from Master
  quantity: string;
  unit: string;
  price: string;
  discountType?: string;
  discountValue?: string;
  discountAmount?: string;
  netPricePerUnit?: string;
  netAmount: string;
  deliveryDate: string;
  remarks: string;
  activeFlag: boolean;
  // gstPercent?: string;
  cgstPercent?: string;
  sgstPercent?: string;
  igstPercent?: string;
  gstPercent?: string;
  gstAmount?: string;
  finalAmount?: string;
  fabricCode?: string; // Auto from Fabric Master
  quality?: string; // Auto from Fabric Master
  salesOrderId?: string; // Link to Sales Order (display ID)
  salesOrderNo?: string | null;
  actualSalesOrderId?: string; // Actual Sales Order ID for backend
  millName?: string; // Mill Name from Sub Categories
  millNameId?: number; // Mill Name ID from database
  productType?: ProductType;
  yarnTypeId?: string | null;
  performaNo?: string;
  packingAndForwarding?: string;
  others?: string;
  note?: string;
}

const getEmptyNewItem = (): Omit<PurchaseOrderItem, "id"> => ({
  yarnId: "",
  yarnName: "",
  fabricTypeId: "",
  fabricCategoryId: "",
  fabricId: "",
  fabricMasterId: "",
  itemId: "",
  itemName: "",
  quantity: "",
  unit: "",
  price: "",
  discountType: "Percentage",
  discountValue: "",
  discountAmount: "",
  netPricePerUnit: "",
  netAmount: "",
  deliveryDate: "",
  remarks: "",
  activeFlag: true,
  cgstPercent: "",
  sgstPercent: "",
  igstPercent: "",
  gstAmount: "",
  finalAmount: "",
  fabricCode: "",
  quality: "",
  salesOrderId: "",
  salesOrderNo: "",
  actualSalesOrderId: "",
  millName: "",
  yarnTypeId: "",
  performaNo: "",
  packingAndForwarding: "",
  others: "",
  note: "",
});

export function PurchaseOrderEntry() {
  const { purchaseOrderTypeList, purchaseOrderList } = useSelector((state: RootState) => state.purchaseOrder);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  const { itemList: itemMasterList } = useSelector((state: RootState) => state.itemMaster);
  const { fabricTypeList } = useSelector((state: RootState) => state.fabricType);
  const { fabricCategoryList } = useSelector((state: RootState) => state.fabricCategoty);
  const { fabricMasterList, fabricMasterDetailList } = useSelector((state: RootState) => state.fabricMaster);
  const { knittedknittedFabricMasterList } = useSelector((state: RootState) => state.knittedMasters);
  const { subCategoryList: subCategories } = useSelector((state: RootState) => state.subCategory);
  const { cityList } = useSelector((state: RootState) => state.city);
  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const { gstList } = useSelector((state: RootState) => state.gst);


  const parseRateValue = (value: any) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const normalizedGstList = useMemo(() => {
    const rawList = Array.isArray(gstList)
      ? gstList
      : Array.isArray((gstList as any)?.data)
        ? (gstList as any).data
        : []
    return rawList.map((gst: any) => {
      const cgstRate = parseRateValue(gst.cgstRate ?? gst.cgst ?? 0)
      const sgstRate = parseRateValue(gst.sgstRate ?? gst.sgst ?? 0)
      const igstRate = parseRateValue(gst.igstRate ?? gst.igst ?? 0)
      const totalRate = igstRate || (cgstRate + sgstRate)
      const breakdown: string[] = []
      if (cgstRate) breakdown.push(`CGST ${cgstRate}%`)
      if (sgstRate) breakdown.push(`SGST ${sgstRate}%`)
      if (igstRate) breakdown.push(`IGST ${igstRate}%`)
      const label = `${totalRate}%`
      return { ...gst, cgstRate, sgstRate, igstRate, totalRate, label }
    })
  }, [gstList])

  const gstIdToPercent = useMemo(() => {
    const mapping: Record<string, number> = {}
    normalizedGstList.forEach((gst: any) => {
      mapping[String(gst.id)] = gst.totalRate
    })
    return mapping
  }, [normalizedGstList])

  const gstIdToRates = useMemo(() => {
    const mapping: Record<string, { cgst: number; sgst: number; igst: number; total: number }> = {}
    normalizedGstList.forEach((gst: any) => {
      mapping[String(gst.id)] = {
        cgst: gst.cgstRate,
        sgst: gst.sgstRate,
        igst: gst.igstRate,
        total: gst.totalRate,
      }
    })
    return mapping
  }, [normalizedGstList])

  const [purchaseOrderItemsDtl, setPurchaseOrderItemsDtl] = useState<PurchaseOrderItem[]>([]);
  const [millSubCategories, setMillSubCategories] = useState<any[]>([]);

  useEffect(() => {
    setCounts(subCategories?.filter((sc: any) => sc.categoryName === "Counts") || []);
    setMillSubCategories(subCategories?.filter((sc: any) => sc.categoryName === "Mill" || sc.categoryName === "Mill Name" || sc.categoryName === "Mill/Mill Name") || []);
  }, [subCategories]);
  const [newItem, setNewItem] = useState<Omit<PurchaseOrderItem, 'id'>>(getEmptyNewItem());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("orderDetails");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsValid, setIsDetailsValid] = useState(false);
  const [isItemsValid, setIsItemsValid] = useState(false);
  const [selectedFabricType, setSelectedFabricType] = useState<string>('');
  const [currentFabricList, setCurrentFabricList] = useState<any[]>([]); // Store current fabric list
  const [counts, setCounts] = useState<any[]>([]);
  const [poCategoryOptions, setPoCategoryOptions] = useState<{ value: string; label: string }[]>([]);

  // New states for GST auto-selection based on vendor
  const [vendorStateCode, setVendorStateCode] = useState<string>('');
  const [companyStateCode, setCompanyStateCode] = useState<string>('');
  const [filteredVendorList, setFilteredVendorList] = useState<any[]>([]);
  const [fabricCodeDuplicateError, setFabricCodeDuplicateError] = useState<string>('');
  const [selectedFabricInOrderDetails, setSelectedFabricInOrderDetails] = useState<string>('');

  // Item Master Modal states & handlers
  const [isItemMasterModalOpen, setIsItemMasterModalOpen] = useState(false);
  const [isSavingItemMaster, setIsSavingItemMaster] = useState(false);
  const [itemMasterModalData, setItemMasterModalData] = useState({
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
  });
  const [selectedGstDropdownId, setSelectedGstDropdownId] = useState("");
  const [itemMasterServerErrors, setItemMasterServerErrors] = useState<Record<string, string>>({});

  const gstOptionList = [
    { id: 1, name: 0 },
    { id: 2, name: 5 },
    { id: 3, name: 12 },
    { id: 4, name: 18 },
    { id: 5, name: 28 }
  ];
  const itemModalGstPercentMap: Record<string, number> = { '1': 0, '2': 5, '3': 12, '4': 18, '5': 28 };

  const departmentOptions = useMemo(() => {
    const list = Array.isArray(subCategories) ? subCategories.filter((sc: any) => sc.categoryName === "Department" || sc.categoryName === "department") : [];
    if (list.length === 0 && Array.isArray(subCategories)) {
      return subCategories.map((item: any) => ({
        value: String(item.subCategoryName || item.name || ''),
        label: String(item.subCategoryName || item.name || ''),
        activeFlag: item.activeFlag ?? true,
      }));
    }
    return list.map((item: any) => ({
      value: String(item.subCategoryName || item.name || ''),
      label: String(item.subCategoryName || item.name || ''),
      activeFlag: item.activeFlag ?? true,
    }));
  }, [subCategories]);

  const handleGstChangeInModal = (gstId: string) => {
    setSelectedGstDropdownId(gstId);
    if (gstId) {
      const igstVal = itemModalGstPercentMap[gstId] ?? 0;
      const halved = (igstVal / 2).toString();
      setItemMasterModalData(prev => ({
        ...prev,
        igst: igstVal.toString(),
        cgst: halved,
        sgst: halved,
      }));
    } else {
      setItemMasterModalData(prev => ({ ...prev, igst: "", cgst: "", sgst: "" }));
    }
  };

  const handleSaveItemMasterModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemMasterServerErrors({});

    const { itemName, itemCode, department, itemCategory, hsnCode, uomId, igst, cgst, sgst, activeFlag } = itemMasterModalData;

    if (!itemName?.trim()) {
      setItemMasterServerErrors({ itemName: "Item Name is required" });
      return;
    }
    if (!department) {
      setItemMasterServerErrors({ department: "Department is required" });
      return;
    }
    if (!uomId) {
      setItemMasterServerErrors({ uomId: "UOM is required" });
      return;
    }

    const rawItemList = Array.isArray(itemMasterList) ? itemMasterList : (itemMasterList?.data || []);
    const dupName = rawItemList.some((i: any) => i.itemName?.toLowerCase().trim() === itemName.trim().toLowerCase());
    if (dupName) {
      setItemMasterServerErrors({ itemName: "Item Name already exists" });
      return;
    }
    if (itemCode?.trim()) {
      const dupCode = rawItemList.some((i: any) => i.itemCode && i.itemCode.toLowerCase().trim() === itemCode.trim().toLowerCase());
      if (dupCode) {
        setItemMasterServerErrors({ itemCode: "Assert No/Item Code already exists" });
        return;
      }
    }

    const uomDataList = Array.isArray(uomList) ? uomList : (uomList?.data || []);
    const selectedUom = uomDataList.find((u: any) => String(u.id) === String(uomId));

    const payload = {
      itemName: itemName.trim(),
      itemCode: itemCode?.trim() || null,
      department: department,
      itemCategory: itemCategory?.trim() || null,
      uomId: Number(uomId),
      uomName: selectedUom?.uomName || "",
      hsnCode: hsnCode?.trim() || null,
      igst: igst !== "" && igst !== undefined && igst !== null ? Number(igst) : null,
      cgst: cgst !== "" && cgst !== undefined && cgst !== null ? Number(cgst) : null,
      sgst: sgst !== "" && sgst !== undefined && sgst !== null ? Number(sgst) : null,
      activeFlag: activeFlag,
    };

    try {
      setIsSavingItemMaster(true);
      const res = await dispatch(createItemMaster(payload)).unwrap();
      const createdItem = res?.data || res;
      
      // Refresh item list
      await dispatch(getAllItemMasters({ fetchAll: true }));

      const newId = createdItem?.id ? String(createdItem.id) : null;
      if (newId) {
        handleItemChange({ target: { value: newId } } as any);
      }

      setIsItemMasterModalOpen(false);
      setItemMasterModalData({
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
      });
      setSelectedGstDropdownId("");
      setSelectedGstDropdownId("");
      toast.success("Item Master created and selected successfully");
    } catch (err: any) {
      console.error("Error creating item master:", err);
      const errMsg = typeof err === "string" ? err : err?.message || "Failed to create Item Master";
      setItemMasterServerErrors({ general: errMsg });
    } finally {
      setIsSavingItemMaster(false);
    }
  };

  const hasGeneratedNumberRef = useRef(false);
  const isSavingRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const currentDate = new Date().toISOString().slice(0, 10);

  const location = useLocation();

  const purchaseOrderdetail = location.state?.order;
  const navigate = useNavigate();
  const selectedCompanyId = useMemo(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return storedCompanyId ? Number(storedCompanyId) : undefined;
  }, []);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<PurchaseOrderFormData>({
    defaultValues: {
      poDate: currentDate,
      poNo: purchaseOrderdetail?.poNo || '',
      poTypeId: purchaseOrderdetail?.poTypeId ? String(purchaseOrderdetail.poTypeId) : '',
      poCategoryId: purchaseOrderdetail?.poCategoryId ? String(purchaseOrderdetail.poCategoryId) : '',
      vendorId: purchaseOrderdetail?.vendorId ? String(purchaseOrderdetail.vendorId) : '',
      note: purchaseOrderdetail?.note || '',
    }
  });

  useAutoDocumentNumber({
    screenName: 'Purchase Order',
    detail: purchaseOrderdetail,
    existingValue: purchaseOrderdetail?.poNo,
    fieldName: 'poNo',
    setValue,
    isSavingRef,
  });

  const selectedPoCategoryId = watch("poCategoryId");
  const isBulkOpenOrder = String(selectedPoCategoryId) === "2" || String(selectedPoCategoryId) === "401";

  const selectedPoType = watch("poTypeId");
  const poTypeName = useMemo(() => {
    const poType = purchaseOrderTypeList?.find((pt: any) => String(pt.id) === selectedPoType);
    return poType?.poTypeName?.toLowerCase() || "";
  }, [selectedPoType, purchaseOrderTypeList]);

  const isYarn = poTypeName.includes("yarn");
  const isWoven = poTypeName.includes("fabric");
  const isKnitted = poTypeName.includes("knitted");
  const isItem = poTypeName.includes("item");

  const filteredPoCategoryOptions = useMemo(() => {
    if (!Array.isArray(poCategoryOptions)) return [];

    if (isItem) {
      const itemCategories = poCategoryOptions.filter(opt => {
        const label = (opt.label || '').toLowerCase();
        return label.includes('purchase order') || label.includes('work order');
      });

      const hasPO = itemCategories.some(c => c.label.toLowerCase().includes('purchase order'));
      const hasWO = itemCategories.some(c => c.label.toLowerCase().includes('work order'));

      const result = [...itemCategories];
      if (!hasPO) {
        const found = poCategoryOptions.find(c => c.label.toLowerCase().includes('purchase'));
        if (found) result.push(found);
        else result.push({ value: '398', label: 'Purchase Order' });
      }
      if (!hasWO) {
        const found = poCategoryOptions.find(c => c.label.toLowerCase().includes('work'));
        if (found) result.push(found);
        else result.push({ value: '399', label: 'Work Order' });
      }

      return result;
    }

    return poCategoryOptions.filter(opt => {
      const label = (opt.label || '').toLowerCase();
      return !label.includes('work order');
    });
  }, [poCategoryOptions, isItem]);

  const productTypeForCurrentPo = useMemo<ProductType>(() => {
    if (isYarn) return "yarn";
    if (isItem) return "item";
    return "fabric";
  }, [isYarn, isItem]);

  const selectedTaxId = watch('taxId'); // "1" => CGST/SGST, "2" => IGST
  const selectedVendorId = watch('vendorId');

  const isItemRequiredFieldsValid = (item: PurchaseOrderItem) => {
    const isSalesOrderRequired = !isItem && !isBulkOpenOrder;
    if (!item.quantity || !item.unit || !item.price || (isSalesOrderRequired && !item.salesOrderId)) {
      return false;
    }
    // Only require Mill Name for Yarn and Knitted PO types
    if (!isWoven && !isItem && !item.millName) {
      return false;
    }
    if ((isWoven || isKnitted) && !item.fabricMasterId) {
      return false;
    }
    if (isYarn && (!item.yarnId || !item.yarnTypeId)) {
      return false;
    }
    if (isItem && !item.itemId) {
      return false;
    }
    if (isKnitted && (!item.fabricTypeId || !item.fabricCategoryId)) {
      return false;
    }
    return true;
  };

  const areAllItemsValid = useMemo(() => {
    if (!purchaseOrderItemsDtl.length) return false;
    return purchaseOrderItemsDtl.every(isItemRequiredFieldsValid);
  }, [purchaseOrderItemsDtl, isYarn, isWoven, isKnitted, isItem]);

  const canSaveOrUpdate = isDetailsValid && areAllItemsValid && !isLoading;

  const getResolvedFabricMasterId = (item: PurchaseOrderItem): number | null => {
    const idFromRow = item.fabricMasterId ? parseInt(String(item.fabricMasterId)) : null;
    if (idFromRow) return idFromRow;

    const combinedFabricList = [
      ...(Array.isArray(fabricMasterList?.data) ? fabricMasterList.data : Array.isArray(fabricMasterList) ? fabricMasterList : []),
      ...(Array.isArray(knittedknittedFabricMasterList?.data) ? knittedknittedFabricMasterList.data : Array.isArray(knittedknittedFabricMasterList) ? knittedknittedFabricMasterList : []),
    ];
    if (!item.fabricCode) return null;
    const matchedFabric = combinedFabricList.find(
      (f: any) => String(f.fabricCode || "").trim() === String(item.fabricCode || "").trim()
    );
    return matchedFabric?.id ? parseInt(String(matchedFabric.id)) : null;
  };

  const poTypeOptions = useMemo(() => {
    if (!Array.isArray(purchaseOrderTypeList)) return [];
    const filtered = purchaseOrderTypeList.filter((poType: any) => poType.activeFlag !== false);
    return filtered.map((poType: any) => ({
      value: String(poType.id),
      label: poType.poTypeName,
      activeFlag: poType.activeFlag ?? true,
    }));
  }, [purchaseOrderTypeList]);

  const vendorOptions = useMemo(() => {
    if (!Array.isArray(filteredVendorList)) return [];
    return filteredVendorList.map((vendor: any) => ({
      value: String(vendor.id),
      label: vendor.vendorName,
    }));
  }, [filteredVendorList]);

  // Filter yarns based on selected fabric in Order Details
  const filteredYarnList = useMemo(() => {
    if (!isYarn || !selectedFabricInOrderDetails) {
      return yarnList?.data || yarnList || [];
    }

    const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
    const selectedFabric = fabricDataList.find((fabric: any) => String(fabric.id) === selectedFabricInOrderDetails);
    
    if (!selectedFabric) {
      return yarnList?.data || yarnList || [];
    }

    // Extract yarn IDs from fabric's warpDetails and weftDetails
    const fabricYarnIds = new Set<number>();
    
    // Add yarn IDs from warpDetails
    if (selectedFabric.warpDetails && Array.isArray(selectedFabric.warpDetails)) {
      selectedFabric.warpDetails.forEach((warp: any) => {
        if (warp.yarnId) {
          fabricYarnIds.add(warp.yarnId);
        }
      });
    }
    
    // Add yarn IDs from weftDetails
    if (selectedFabric.weftDetails && Array.isArray(selectedFabric.weftDetails)) {
      selectedFabric.weftDetails.forEach((weft: any) => {
        if (weft.yarnId) {
          fabricYarnIds.add(weft.yarnId);
        }
      });
    }

    // Filter yarns based on the extracted yarn IDs
    const allYarns = yarnList?.data || yarnList || [];
    return allYarns.filter((yarn: any) => {
      // If we have yarn IDs from fabric, filter by those IDs
      if (fabricYarnIds.size > 0) {
        return fabricYarnIds.has(yarn.id);
      }
      
      // Fallback to original logic if no yarn IDs found
      // If fabric has yarnName property, match it
      if (selectedFabric.yarnName && yarn.yarnName) {
        return yarn.yarnName.toLowerCase().includes(selectedFabric.yarnName.toLowerCase());
      }
      
      // If fabric has countSno property, match with yarn count
      if (selectedFabric.countSno && yarn.countSno) {
        return String(yarn.countSno) === String(selectedFabric.countSno);
      }
      
      // For now, return all yarns as a fallback
      return true;
    });
  }, [isYarn, selectedFabricInOrderDetails, yarnList, fabricMasterList]);

  // Filter sales orders and create fabric-specific entries
  const filteredSalesOrderList = useMemo(() => {
    const baseSalesOrders = Array.isArray(salesOrderList) ? salesOrderList : (salesOrderList?.data || []);
    const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
    
    // Get the currently selected fabric ID based on PO type
    let selectedFabricId = selectedFabricInOrderDetails;
    
    // For woven PO type, check the fabric selected in the current item being edited
    if (isWoven) {
      // Always check the current fabric selection for Woven type
      if (!selectedFabricId) {
        // If editing an item, use its fabricMasterId
        if (editingIndex !== null && purchaseOrderItemsDtl[editingIndex]) {
          selectedFabricId = String(purchaseOrderItemsDtl[editingIndex].fabricMasterId || '');
        }
        // If adding a new item, use the fabricMasterId from newItem
        else if (newItem.fabricMasterId) {
          selectedFabricId = String(newItem.fabricMasterId);
        }
      }
    }
    
    // For yarn and item PO types, also check the fabric selected in the current item being edited
    if ((isYarn || isItem) && !selectedFabricId) {
      // If editing an item, use its fabricMasterId
      if (editingIndex !== null && purchaseOrderItemsDtl[editingIndex]) {
        selectedFabricId = String(purchaseOrderItemsDtl[editingIndex].fabricMasterId || '');
      }
      // If adding a new item, use the fabricMasterId from newItem
      else if (newItem.fabricMasterId) {
        selectedFabricId = String(newItem.fabricMasterId);
      }
    }
    
    // Filter approved sales orders
    const approvedOrders = baseSalesOrders.filter((so: any) => so.isApproved === 1);
    
    // Create fabric-specific entries
    const fabricSpecificEntries: any[] = [];
    
    approvedOrders.forEach((so: any) => {
      // Check if sales order has items with different fabrics
      if (so.items && Array.isArray(so.items)) {
        // Group items by fabricMasterId to get unique fabrics
        const uniqueFabrics = new Map();
        
        so.items.forEach((item: any) => {
          if (item.fabricMasterId) {
            const fabricId = String(item.fabricMasterId);
            if (!uniqueFabrics.has(fabricId)) {
              uniqueFabrics.set(fabricId, {
                fabricMasterId: fabricId,
                fabricCode: item.fabricCode || '',
                fabricQuality: item.fabricQuality || '',
                orderQty: item.orderQty || 0,
                // Store all items for this fabric
                items: so.items.filter((i: any) => String(i.fabricMasterId) === fabricId)
              });
            }
          }
        });
        
        // If multiple fabrics exist, create separate entries for each
        if (uniqueFabrics.size > 1) {
          uniqueFabrics.forEach((fabricData, fabricId) => {
            // Get fabric details
            const fabric = fabricDataList.find((f: any) => String(f.id) === fabricId);
            const fabricCodeQuality = fabric ? 
              `${fabric.fabricCode || fabricData.fabricCode || ''}-${fabric.fabricQuality || fabricData.fabricQuality || ''}` : 
              `${fabricData.fabricCode || ''}-${fabricData.fabricQuality || ''}`;
            
            fabricSpecificEntries.push({
              ...so,
              // Create unique ID for fabric-specific entry
              id: `${so.id}_${fabricId}`,
              originalSalesOrderId: String(so.id),
              fabricMasterId: fabricId,
              fabricCodeQuality: fabricCodeQuality,
              fabricCode: fabricData.fabricCode,
              fabricQuality: fabricData.fabricQuality,
              // Store only items related to this fabric
              items: fabricData.items,
              // Mark as fabric-specific entry
              isFabricSpecific: true
            });
          });
        } else if (uniqueFabrics.size === 1) {
          // Single fabric - create fabric-specific entry anyway for consistency
          const singleFabric = Array.from(uniqueFabrics.values())[0];
          const fabricId = singleFabric.fabricMasterId;
          const fabric = fabricDataList.find((f: any) => String(f.id) === fabricId);
          const fabricCodeQuality = fabric ? 
            `${fabric.fabricCode || singleFabric.fabricCode || ''}-${fabric.fabricQuality || singleFabric.fabricQuality || ''}` : 
            `${singleFabric.fabricCode || ''}-${singleFabric.fabricQuality || ''}`;
          
          fabricSpecificEntries.push({
            ...so,
            id: `${so.id}_${fabricId}`,
            originalSalesOrderId: String(so.id),
            fabricMasterId: fabricId,
            fabricCodeQuality: fabricCodeQuality,
            fabricCode: singleFabric.fabricCode,
            fabricQuality: singleFabric.fabricQuality,
            items: singleFabric.items,
            isFabricSpecific: true
          });
        }
      } else {
        // No items array or no fabric data - create single entry
        fabricSpecificEntries.push({
          ...so,
          isFabricSpecific: false
        });
      }
    });
    
    // If no fabric is selected, return all fabric-specific entries
    if (!selectedFabricId) {
      return fabricSpecificEntries;
    }
    
    // Filter entries based on selected fabric
    return fabricSpecificEntries.filter((entry: any) => {
      // If entry is fabric-specific, check if it matches selected fabric
      if (entry.isFabricSpecific) {
        return entry.fabricMasterId === selectedFabricId;
      }
      
      // For non-fabric-specific entries (backward compatibility)
      let fabricMatch = false;
      if (entry.items && Array.isArray(entry.items)) {
        fabricMatch = entry.items.some((item: any) => {
          return item.fabricMasterId && String(item.fabricMasterId) === selectedFabricId;
        });
      }
      
      // Additional check: match by fabric code for robustness
      if (!fabricMatch && entry.fabricCode) {
        const selectedFabric = fabricDataList.find((fabric: any) => String(fabric.id) === selectedFabricId);
        if (selectedFabric) {
          fabricMatch = entry.fabricCode === selectedFabric.fabricCode;
        }
      }
      
      return fabricMatch;
    });
  }, [salesOrderList, selectedFabricInOrderDetails, fabricMasterList, isWoven, isYarn, isItem, editingIndex, purchaseOrderItemsDtl, newItem.fabricMasterId]);

  // helpers for auto-calculation
  const toNumber = (v: any) => {
    const n = parseFloat(String(v));
    return isNaN(n) ? 0 : n;
  };
  const recalc = (item: any) => {
    const qty = toNumber(item.quantity);
    const price = toNumber(item.price);
    const discType = item.discountType || "Percentage";
    const discVal = toNumber(item.discountValue);
    const pfAmt = toNumber(item.packingAndForwarding);
    const otherAmt = toNumber(item.others);

    let discAmt = 0;
    if (price > 0 && discVal > 0) {
      if (discType === "Percentage" || discType === "%") {
        discAmt = (price * discVal) / 100;
      } else if (discType === "Amount" || discType === "₹") {
        discAmt = discVal;
      }
    }

    const netPrice = Math.max(0, price - discAmt);
    const baseTotal = qty * netPrice;
    const total = baseTotal + pfAmt + otherAmt;

    const discAmtStr = price > 0 && discVal > 0 ? Number(discAmt.toFixed(4)).toString() : "0";
    const netPriceStr = price > 0 ? Number(netPrice.toFixed(4)).toString() : (price === 0 ? "0" : "");

    const gstP = toNumber(item.gstPercent);
    const gstAmt = total * (gstP / 100);
    const final = total + gstAmt;
    return {
      ...item,
      discountType: discType,
      discountAmount: discAmtStr,
      netPricePerUnit: netPriceStr,
      packingAndForwarding: item.packingAndForwarding ?? "",
      others: item.others ?? "",
      netAmount: total ? total.toFixed(2) : "",
      gstAmount: gstAmt ? gstAmt.toFixed(2) : "",
      finalAmount: final ? final.toFixed(2) : "",
    };
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getCombinedPerformaNo = () => {
    const pNos: string[] = [];
    if (Array.isArray(purchaseOrderItemsDtl)) {
      purchaseOrderItemsDtl.forEach((item) => {
        const p = (item.performaNo || (item as any).proformaNo || '').trim();
        if (p && !pNos.includes(p)) {
          pNos.push(p);
        }
      });
    }
    const currentP = (newItem.performaNo || '').trim();
    if (currentP && !pNos.includes(currentP)) {
      pNos.push(currentP);
    }
    return pNos.length > 0 ? pNos.join(' & ') : 'G143';
  };

  const getDefaultNoteText = (poDateStr?: string, vendorIdStr?: string) => {
    const combinedPerforma = getCombinedPerformaNo();
    const formattedDate = formatDateDisplay(poDateStr || watch("poDate") || new Date().toISOString().slice(0, 10));

    const vendor = (vendorList || []).find((v: any) => String(v.id) === String(vendorIdStr || watch("vendorId")));
    const paymentTermObj = (paymentTermsList || []).find((pt: any) => String(pt.id) === String(vendor?.paymentTermsId));
    const rawTermName = paymentTermObj?.termName || paymentTermObj?.description || paymentTermObj?.name || '';

    let paymentText = 'Payment within 30 Days.';
    if (rawTermName) {
      const lower = rawTermName.toLowerCase();
      if (lower.startsWith('payment')) {
        paymentText = rawTermName;
      } else if (lower.startsWith('within')) {
        paymentText = `Payment ${rawTermName}`;
      } else {
        paymentText = `Payment within ${rawTermName}`;
      }
      if (!paymentText.endsWith('.')) {
        paymentText += '.';
      }
    }

    return `1 As per your P.I. No. ${combinedPerforma}, dated ${formattedDate}.\n2 Delivery -- Ready delivery.\n3 ${paymentText}`;
  };

  const handleOrderNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      const textBeforeCursor = value.substring(0, selectionStart);
      const textAfterCursor = value.substring(selectionEnd);

      const linesBefore = textBeforeCursor.split("\n");
      const currentLine = linesBefore[linesBefore.length - 1];

      const match = currentLine.match(/^(\d+)/);
      let nextNum = linesBefore.length + 1;
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }

      const insertion = `\n${nextNum} `;
      const newValue = textBeforeCursor + insertion + textAfterCursor;

      setValue("note", newValue, { shouldValidate: true });

      setTimeout(() => {
        textarea.selectionStart = selectionStart + insertion.length;
        textarea.selectionEnd = selectionStart + insertion.length;
      }, 0);
    }
  };

  useEffect(() => {
    const currentNoteVal = watch("note");
    if (isItem && (!currentNoteVal || currentNoteVal.trim() === "")) {
      const defaultText = getDefaultNoteText(watch("poDate"), watch("vendorId"));
      setValue("note", defaultText, { shouldValidate: true });
    }
  }, [isItem, purchaseOrderItemsDtl, watch("poDate"), watch("vendorId")]);

  // Function to calculate quantity based on warp/weft details and sales order
  const calculateQuantity = (fabric: any, selectedSalesOrderId: string, selectedYarnId?: string, selectedYarnTypeId?: string) => {
    if (!fabric || !selectedSalesOrderId) return 0;

    // Find the selected sales order to get orderQty
    // First try to find by actual sales order ID (for fabric-specific entries)
    let selectedOrder = filteredSalesOrderList.find((order: any) => 
      order.originalSalesOrderId === selectedSalesOrderId || 
      String(order.originalSalesOrderId) === selectedSalesOrderId
    );
    
    // If not found, try by direct ID match
    if (!selectedOrder) {
      selectedOrder = filteredSalesOrderList.find((order: any) => 
        String(order.id) === selectedSalesOrderId
      );
    }
    
    if (!selectedOrder || !selectedOrder.items) return 0;

    // Find the specific sales order item that matches the fabric
    const salesOrderItem = selectedOrder.items.find((item: any) => {
      return item.fabricMasterId && String(item.fabricMasterId) === String(fabric.id);
    });

    if (!salesOrderItem || !salesOrderItem.orderQty) return 0;
    
    const orderQty = toNumber(salesOrderItem.orderQty); // in meters
    let totalQuantity = 0;

    // If a specific yarn is selected (for yarn PO type)
    if (selectedYarnId) {
      const yarnIdNum = toNumber(selectedYarnId);
      // "1" = WARP only, "2" = WEFT only, "3" = BOTH, undefined = BOTH
      const useWarp = !selectedYarnTypeId || selectedYarnTypeId === "1" || selectedYarnTypeId === "3";
      const useWeft = !selectedYarnTypeId || selectedYarnTypeId === "2" || selectedYarnTypeId === "3";

      if (useWarp) {
        const warpDetails = fabric.warpDetails?.filter((warp: any) => toNumber(warp.yarnId) === yarnIdNum) || [];
        warpDetails.forEach((warpDetail: any) => {
          if (warpDetail.gramsPerMeter) {
            totalQuantity += toNumber(warpDetail.gramsPerMeter) * orderQty;
          }
        });
      }

      if (useWeft) {
        const weftDetails = fabric.weftDetails?.filter((weft: any) => toNumber(weft.yarnId) === yarnIdNum) || [];
        weftDetails.forEach((weftDetail: any) => {
          if (weftDetail.gramsPerMeter) {
            totalQuantity += toNumber(weftDetail.gramsPerMeter) * orderQty;
          }
        });
      }
    } else {
      // For fabric PO type, sum up all yarns in the fabric
      // Sum all warp yarns
      if (fabric.warpDetails && Array.isArray(fabric.warpDetails)) {
        fabric.warpDetails.forEach((warp: any) => {
          if (warp.gramsPerMeter) {
            totalQuantity += toNumber(warp.gramsPerMeter) * orderQty;
          }
        });
      }

      // Sum all weft yarns
      if (fabric.weftDetails && Array.isArray(fabric.weftDetails)) {
        fabric.weftDetails.forEach((weft: any) => {
          if (weft.gramsPerMeter) {
            totalQuantity += toNumber(weft.gramsPerMeter) * orderQty;
          }
        });
      }
    }

    return totalQuantity > 0 ? totalQuantity.toFixed(2) : '';
  };

  // Function to determine yarn type (WARP/WEFT/BOTH) based on fabric details
  const determineYarnType = (fabric: any, yarnId: string): string => {
    if (!fabric || !yarnId) return '';
    
    const yarnIdNum = toNumber(yarnId);
    let isInWarp = false;
    let isInWeft = false;
    
    // Check if yarn exists in warp details
    if (fabric.warpDetails && Array.isArray(fabric.warpDetails)) {
      isInWarp = fabric.warpDetails.some((warp: any) => toNumber(warp.yarnId) === yarnIdNum);
    }
    
    // Check if yarn exists in weft details
    if (fabric.weftDetails && Array.isArray(fabric.weftDetails)) {
      isInWeft = fabric.weftDetails.some((weft: any) => toNumber(weft.yarnId) === yarnIdNum);
    }
    
    // Determine yarn type based on presence in warp/weft
    if (isInWarp && isInWeft) {
      return '3'; // BOTH
    } else if (isInWarp) {
      return '1'; // WARP
    } else if (isInWeft) {
      return '2'; // WEFT
    }
    
    return '';
  };

  // Function to handle Sales Order selection and calculate quantity
  const handleSalesOrderSelection = (selectedId: string, currentItem: PurchaseOrderItem) => {
    const orders = filteredSalesOrderList;
    const matchedOrder = orders.find((order: any) => String(order.id) === selectedId);
    
    // Extract the actual sales order ID and fabric information
    let actualSalesOrderId = '';
    let selectedSalesOrderNo = '';
    let fabricMasterId = '';
    
    if (matchedOrder) {
      // For fabric-specific entries, extract the original sales order ID
      if (matchedOrder.isFabricSpecific) {
        actualSalesOrderId = matchedOrder.originalSalesOrderId || String(matchedOrder.id).split('_')[0];
        fabricMasterId = matchedOrder.fabricMasterId || '';
      } else {
        actualSalesOrderId = String(matchedOrder.id);
      }
      
      selectedSalesOrderNo = matchedOrder.salesOrderNo || matchedOrder.internalOrderNo || '';
    }
    
    // Initialize auto-fetched values
    let autoFetchedFabricCodeQualityId = '';
    let autoFetchedYarnId = '';
    let autoFetchedYarnName = '';
    let autoFetchedYarnTypeId = '';
    let autoFetchedQuantity = '';
    let autoFetchedUnit = '';
    
    // Calculate quantity when sales order is selected
    let calculatedQuantity = '';
    
    if (selectedId && matchedOrder && matchedOrder.items && Array.isArray(matchedOrder.items)) {
      // Auto-fetch based on PO type
      if (isYarn) {
        // For YARN PO type: fetch fabric and yarn details from sales order items
        const firstOrderItem = matchedOrder.items.find((item: any) => item.fabricMasterId);
        if (firstOrderItem) {
          autoFetchedFabricCodeQualityId = String(firstOrderItem.fabricMasterId);
          
          // Find yarns associated with this fabric
          const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
          const fabric = fabricDataList.find((f: any) => String(f.id) === autoFetchedFabricCodeQualityId);
          
          if (fabric && fabric.warpDetails && Array.isArray(fabric.warpDetails)) {
            const firstWarpYarn = fabric.warpDetails[0];
            const yarnDataList = yarnList?.data || yarnList || [];
            const yarn = yarnDataList.find((y: any) => String(y.id) === String(firstWarpYarn.yarnId));
            
            if (yarn) {
              autoFetchedYarnId = String(firstWarpYarn.yarnId);
              autoFetchedYarnName = yarn.yarnName || '';
              autoFetchedYarnTypeId = determineYarnType(fabric, autoFetchedYarnId);
            }
          }
          
          // Calculate quantity — user-selected yarn takes priority over auto-fetched
          const yarnIdToUse = currentItem.yarnId || autoFetchedYarnId;
          const yarnTypeIdToUse = currentItem.yarnTypeId
            ? String(currentItem.yarnTypeId)
            : (yarnIdToUse && fabric ? determineYarnType(fabric, yarnIdToUse) : autoFetchedYarnTypeId);
          if (yarnIdToUse) {
            const qtyResult = calculateQuantity(fabric, actualSalesOrderId, yarnIdToUse, yarnTypeIdToUse || undefined);
            calculatedQuantity = String(qtyResult || '');
          }
        }
      } else if (isWoven || isKnitted) {
        // For WOVEN/Knitted PO type: fetch fabric details
        const firstOrderItem = matchedOrder.items.find((item: any) => item.fabricMasterId);
        if (firstOrderItem) {
          autoFetchedFabricCodeQualityId = String(firstOrderItem.fabricMasterId);
          autoFetchedQuantity = String(firstOrderItem.orderQty || '');
          
          // Calculate quantity using fabric details
          const fabricDataList = isWoven ? 
            (fabricMasterList?.data || fabricMasterList || []) : 
            (knittedknittedFabricMasterList?.data || knittedknittedFabricMasterList || []);
          const fabric = fabricDataList.find((f: any) => String(f.id) === autoFetchedFabricCodeQualityId);
          
          if (fabric) {
            const qtyResult = calculateQuantity(fabric, actualSalesOrderId);
            calculatedQuantity = String(qtyResult || '') || autoFetchedQuantity;
          }
        }
      } else if (isItem) {
        // For ITEM PO type: fetch fabric and item details
        const firstOrderItem = matchedOrder.items.find((item: any) => item.fabricMasterId || item.itemId);
        if (firstOrderItem) {
          if (firstOrderItem.fabricMasterId) {
            autoFetchedFabricCodeQualityId = String(firstOrderItem.fabricMasterId);
          }
          if (firstOrderItem.itemId) {
            // For Item PO, get the fabric from the yarn mapping
            const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
            const fabric = fabricDataList.find((f: any) => String(f.id) === autoFetchedFabricCodeQualityId);
            if (fabric) {
              const qtyResult = calculateQuantity(fabric, actualSalesOrderId);
              calculatedQuantity = String(qtyResult || '');
            }
          }
          autoFetchedQuantity = String(firstOrderItem.orderQty || '');
        }
      }
    } else if (selectedId) {
      // Fallback to existing quantity calculation logic
      let fabric = null;
      
      // Get fabric based on PO type and current selection
      if (isYarn && selectedFabricInOrderDetails) {
        const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
        fabric = fabricDataList.find((f: any) => String(f.id) === selectedFabricInOrderDetails);
      } else if ((isWoven || isKnitted) && currentItem.fabricMasterId) {
        const fabricDataList = isWoven ? 
          (fabricMasterList?.data || fabricMasterList || []) : 
          (knittedknittedFabricMasterList?.data || knittedknittedFabricMasterList || []);
        fabric = fabricDataList.find((f: any) => String(f.id) === currentItem.fabricMasterId);
      }
      
      if (fabric) {
        const yarnId:any = isYarn ? currentItem.yarnId : undefined;
        const yarnTypeId: any = isYarn ? currentItem.yarnTypeId : undefined;
        const qtyResult = calculateQuantity(fabric, actualSalesOrderId, yarnId, yarnTypeId || undefined);
        calculatedQuantity = String(qtyResult || '');
      }
    }
    
    // Set default UOM based on PO type
    const uomDataList = uomList?.data || uomList || [];
    if (isYarn) {
      autoFetchedUnit = findUOMByName(uomDataList, 'kilogram');
    } else if (isWoven || isKnitted) {
      autoFetchedUnit = findUOMByName(uomDataList, 'meter');
    } 
    
    // Update selectedFabricInOrderDetails for YARN and ITEM PO types
    if ((isYarn || isItem) && autoFetchedFabricCodeQualityId) {
      setSelectedFabricInOrderDetails(autoFetchedFabricCodeQualityId);
    } else if (fabricMasterId) {
      // For fabric-specific entries, update the selected fabric
      setSelectedFabricInOrderDetails(fabricMasterId);
    }
    
    return {
      // Sales order info
      salesOrderId: selectedId,
      salesOrderNo: actualSalesOrderId ? selectedSalesOrderNo : '',
      actualSalesOrderId: actualSalesOrderId,
      // Auto-fetched values for YARN PO type
      ...(isYarn && {
        fabricMasterId: autoFetchedFabricCodeQualityId || currentItem.fabricMasterId,
        // Only auto-fetch yarn details if user hasn't manually selected a yarn
        yarnId: currentItem.yarnId || autoFetchedYarnId,
        yarnName: currentItem.yarnName || autoFetchedYarnName,
        yarnTypeId: currentItem.yarnTypeId || autoFetchedYarnTypeId,
      }),
      // Auto-fetched values for WOVEN/Knitted PO type
      ...((isWoven || isKnitted) && {
        fabricMasterId: autoFetchedFabricCodeQualityId || currentItem.fabricMasterId,
      }),
      // Auto-fetched values for ITEM PO type
      ...(isItem && {
        fabricMasterId: autoFetchedFabricCodeQualityId || currentItem.fabricMasterId,
      }),
      // Auto-calculated values
      quantity: calculatedQuantity || currentItem.quantity,
      unit: autoFetchedUnit || currentItem.unit,
    };
  };

  // Helper function to find UOM by multiple possible name variations
  const findUOMByName = (uomDataList: any[], targetUOM: 'kilogram' | 'meter'): string => {
    if (!uomDataList || !Array.isArray(uomDataList)) return '';
    
    const variations = targetUOM === 'kilogram' 
      ? ['kilogram', 'kg', 'kgs', 'kilograms'] 
      : ['meter', 'm', 'mtrs', 'meters', 'metre'];
    
    for (const variation of variations) {
      const found = uomDataList.find((uom: any) => 
        uom.uomName && uom.uomName.toLowerCase().trim() === variation
      );
      if (found) {
        console.log(`Debug UOM - Found ${targetUOM} as:`, found.uomName, 'ID:', found.id);
        return String(found.id);
      }
    }
    
    console.log(`Debug UOM - ${targetUOM} not found, searched for:`, variations);
    return '';
  };

  // Helper function to find UOM ID by exact name match from item's uomName field
  const findUOMByItemName = (uomDataList: any[], itemUomName: string): string => {
    if (!uomDataList || !Array.isArray(uomDataList) || !itemUomName) return '';
    
    const found = uomDataList.find((uom: any) => 
      uom.uomName && uom.uomName.toLowerCase().trim() === itemUomName.toLowerCase().trim()
    );
    
    if (found) {
      console.log(`Debug Item UOM - Found UOM for item '${itemUomName}' as:`, found.uomName, 'ID:', found.id);
      return String(found.id);
    }
    
    console.log(`Debug Item UOM - UOM '${itemUomName}' not found in UOM list`);
    return '';
  };

  useEffect(() => {
    const loadPoCategories = async () => {
      try {
        const details = await CodesAPI.getCodeDetailsByHeader("7");
        if (details && Array.isArray(details)) {
          const options = details
            .filter((d: any) => d.is_active !== false && d.isActive !== false)
            .map((d: any) => ({
              value: String(d.id),
              label: d.value,
            }));
          setPoCategoryOptions(options);
        }
      } catch (err) {
        console.error("Failed to load PO Category codes:", err);
      }
    };
    loadPoCategories();

    dispatch(getAllPoTypes({ fetchAll: true }));
    dispatch(getAllVendors({ fetchAll: true }));
    const salesOrderParams = selectedCompanyId ? { companyId: selectedCompanyId } : {};
    dispatch(getAllSalesOrders(salesOrderParams));
    dispatch(getAllUomMaster({ fetchAll: true }));
    // dispatch(getAllYarnMasters({fetchAll: true}))
    dispatch(getAllItemMasters({ fetchAll: true }));
    // dispatch(getAllFabricMasters({}));
    dispatch(getAllFabricTypes({}));
    dispatch(getAllFabricCategory({}));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(getAllCities({}));
    dispatch(getAllStates({}));
    dispatch(getAllCountries({}));
    dispatch(getAllGstMaster({ fetchAll: true }));
    dispatch(getAllPaymentTerms({ fetchAll: true }));
    const purchaseOrderParams = selectedCompanyId ? { companyId: selectedCompanyId, fetchAll: true } : { fetchAll: true };
    dispatch(getAllPurchaseOrders(purchaseOrderParams));

    const handleBeforeUnload = () => {
      if (!purchaseOrderdetail?.id && hasGeneratedNumberRef.current && !isSavingRef.current) {
        documentNumberService.clearMemoryCache('Purchase Order');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    // Fetch company details for selected company to get stateCode
    try {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      console.log('[PO] Stored Company ID from localStorage:', storedCompanyId);
      if (storedCompanyId) {
        console.log('[PO] Dispatching getCompanyById for ID:', storedCompanyId);
        dispatch(getCompanyById({ id: Number(storedCompanyId) }))
          .unwrap?.()
          .then((res: any) => {
            console.log('[PO] Company response:', res);
            const companyData = res?.data || res;
            console.log('[PO] Company data:', companyData);
            const addressArr = companyData?.address || companyData?.data?.address || [];
            console.log('[PO] Address array:', addressArr, 'is array:', Array.isArray(addressArr));
            let defaultAddr: any = null;

            if (Array.isArray(addressArr)) {
              defaultAddr = addressArr.find((a: any) => a.isDefault) || addressArr[0];
              console.log('[PO] Using array address:', defaultAddr);
            } else if (addressArr) {
              defaultAddr = addressArr;
              console.log('[PO] Using object address:', defaultAddr);
            }

            const code = defaultAddr?.stateCode || '';
            setCompanyStateCode(code);
            console.log('[PO] Company State Code:', code);
          })
          .catch((err) => {
            console.log('[PO] Error loading company:', err);
          });
      } else {
        console.log('[PO] No stored company ID found');
      }
    } catch (err) {
      console.log('[PO] Exception loading company:', err);
    }
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!purchaseOrderdetail?.id && hasGeneratedNumberRef.current && !isSavingRef.current) {
        documentNumberService.clearMemoryCache('Purchase Order');
      }
    };
  }, [dispatch, selectedCompanyId]);


  // Strictly filter vendors based on PO Type: include only vendors with a matching vendorType; exclude null/empty
  useEffect(() => {
    if (!selectedPoType) {
      setFilteredVendorList([]);
      return;
    }

    if (isItem) {
      const rawVendors = Array.isArray(vendorList) ? vendorList : (vendorList as any)?.data || [];
      const itemSuppliers = rawVendors.filter((v: any) => {
        // Parse comma-separated values into arrays
        const typeItemArr = parseIds(v.vendorTypeItem);
        const typeIdArr = parseIds(v.vendorTypeId);
        
        // Check if 305 (Item Suppliers) or 307 (All Vendors) is present in either array
        const isItemMatch = typeItemArr.includes("305") || typeIdArr.includes("305");
        const isAllMatch = typeItemArr.includes(String(VENDOR_TYPE_ALL)) || typeIdArr.includes(String(VENDOR_TYPE_ALL));
        
        return isItemMatch || isAllMatch;
      });
      setFilteredVendorList(itemSuppliers);
    } else {
      const filtered = filterVendorsByPoType(vendorList, selectedPoType, {
        purchaseOrderTypes: purchaseOrderTypeList,
        includeVendorTypeIds: [VENDOR_TYPE_ALL],
      });
      setFilteredVendorList(filtered);
    }
  }, [selectedPoType, vendorList, purchaseOrderTypeList, isItem]);

  // Fetch appropriate fabrics when PO type changes
  useEffect(() => {
    if (isWoven) { // Woven Fabric
      dispatch(getAllFabricMasters({fetchAll: true}));
      console.log("Fetching woven fabrics");
    } else if (isKnitted) { // Knitted Fabric
      dispatch(getAllKnittedFabricMasters({}));
      console.log("Fetching knitted fabrics");
    } else if (isYarn) { // Yarn
      dispatch(getAllYarnMasters({fetchAll: true}));
      dispatch(getAllFabricMasters({fetchAll: true})); // Also fetch fabric masters for Fabric code-Quality dropdown
      console.log("Fetching yarns and fabric masters");
    } else if (isItem) { // Item
      dispatch(getAllItemMasters({ fetchAll: true }));
      dispatch(getAllFabricMasters({ fetchAll: true })); // Also fetch fabric masters for Fabric code-Quality dropdown
      console.log("Fetching item masters and fabric masters");
    }

    // Reset fabric selections when PO type changes
    setNewItem({
      ...newItem,
      fabricTypeId: '',
      fabricCategoryId: '',
      fabricId: '',
      fabricMasterId: '',
      itemId: '',
      gstPercent: '',
      cgstPercent: '',
      sgstPercent: '',
      igstPercent: '',
      gstAmount: '',
      finalAmount: '',
      fabricCode: '',
      quality: '',
      deliveryDate: '',
      // Clear millName only when switching to woven or item PO types
      millName: (isWoven || isItem) ? '' : newItem.millName,
      actualSalesOrderId: '',
    });
    setSelectedFabricType('');
    setCurrentFabricList([]);
  }, [selectedPoType, isYarn, isWoven, isKnitted, isItem, dispatch]);

  useEffect(() => {
    let baseFabricList: any[] = [];

    if (isYarn) {
      // For yarn, extract the data array
      baseFabricList = yarnList?.data || yarnList || [];
    } else if (isWoven) {
      // For woven, extract the data array
      baseFabricList = fabricMasterList?.data || fabricMasterList || [];
    } else if (isKnitted) {
      // For knitted, extract the data array
      baseFabricList = knittedknittedFabricMasterList?.data || knittedknittedFabricMasterList || [];
    } else if (isItem) {
      // For items, extract the data array
      baseFabricList = itemMasterList?.data || itemMasterList || [];
    }

    // Ensure baseFabricList is an array
    if (!Array.isArray(baseFabricList)) {
      baseFabricList = [];
    }

    let filteredList = baseFabricList;


    // NEW CODE TO IMPLEMENT OLD LOGIC
    if (!isYarn) {
      if (selectedFabricType) {
        const fabricTypeId = parseInt(selectedFabricType);
        filteredList = baseFabricList.filter((fabric: any) =>
          fabric.fabricType === fabricTypeId
        );
      }
    }

    console.log('Setting currentFabricList:', filteredList);
    setCurrentFabricList(filteredList);
  }, [selectedPoType, isYarn, isWoven, isKnitted, isItem, selectedFabricType, newItem.fabricCategoryId, yarnList, knittedknittedFabricMasterList, fabricMasterList, itemMasterList]);
  // useEffect(() => {
  //   let baseFabricList: any[] = [];

  //   if (selectedPoType === "1") {
  //     // For yarn, extract the data array
  //     baseFabricList = yarnList?.data || yarnList || [];
  //   } else if (selectedPoType === "2") {
  //     // For woven, extract the data array
  //     baseFabricList = fabricMasterList?.data || fabricMasterList || [];
  //   } else if (selectedPoType === "3") {
  //     // For knitted, extract the data array
  //     baseFabricList = knittedknittedFabricMasterList?.data || knittedknittedFabricMasterList || [];
  //   }

  //   // Ensure baseFabricList is an array
  //   if (!Array.isArray(baseFabricList)) {
  //     baseFabricList = [];
  //   }

  //   let filteredList = baseFabricList;

  //   if (selectedPoType !== "1") {
  //     if (selectedFabricType === '2') { // Greige
  //       filteredList = baseFabricList.filter((fabric: any) =>
  //         fabric.fabricType === 1 || fabric.fabricTypeName?.toLowerCase().includes('greige')
  //       );
  //     } else if (selectedFabricType === '3') { // Finished
  //       filteredList = baseFabricList.filter((fabric: any) =>
  //         fabric.fabricType === 2 || fabric.fabricTypeName?.toLowerCase().includes('finished')
  //       );
  //     }

  //     if (newItem.fabricCategoryId) {
  //       filteredList = filteredList.filter((fabric: any) => fabric.fabricCategoryId == newItem.fabricCategoryId);
  //     }
  //   }

  //   console.log('Setting currentFabricList:', filteredList);
  //   setCurrentFabricList(filteredList);
  // }, [selectedPoType, selectedFabricType, newItem.fabricCategoryId, yarnList, knittedknittedFabricMasterList, fabricMasterList]);


  // Watch for vendor selection and fetch vendor state code
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedVendorId) {
        console.log('[PO] vendorList type:', Array.isArray(vendorList) ? 'array' : typeof vendorList);
        console.log('[PO] vendorList:', vendorList);

        const list = Array.isArray(vendorList) ? vendorList : (vendorList?.data || []);
        console.log('[PO] Searching for vendor ID:', selectedVendorId, 'in list of', list.length);

        const vendor = list.find((v: any) => v.id === parseInt(selectedVendorId));
        console.log('[PO] Selected Vendor:', vendor);
        console.log('[PO] Vendor Address Data:', vendor?.address);

        if (vendor?.address && Array.isArray(vendor.address) && vendor.address.length > 0) {
          const code = vendor.address[0]?.stateCode || '';
          setVendorStateCode(code);
          console.log('[PO] Vendor State Code (from array):', code);
        } else if (vendor?.address && !Array.isArray(vendor.address)) {
          const code = vendor.address.stateCode || '';
          setVendorStateCode(code);
          console.log('[PO] Vendor State Code (from object):', code);
        } else {
          setVendorStateCode('');
          console.log('[PO] No vendor address found');
        }
      } else {
        setVendorStateCode('');
        console.log('[PO] No vendor selected');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedVendorId, vendorList]);

  // Auto-select GST Type (taxId) based on vendor vs company state code
  useEffect(() => {
    console.log('[PO] Auto-selecting GST Type - Company:', companyStateCode, 'Vendor:', vendorStateCode);
    if (!vendorStateCode || !companyStateCode) {
      console.log('[PO] Skipping auto-select: missing vendorStateCode or companyStateCode');
      return;
    }
    const newTaxId = vendorStateCode === companyStateCode ? '1' : '2'; // 1: CGST/SGST, 2: IGST
    console.log('[PO] Setting taxId to:', newTaxId, '(match:', vendorStateCode === companyStateCode, ')');
    setValue('taxId', newTaxId, { shouldValidate: true, shouldDirty: false });
  }, [vendorStateCode, companyStateCode, setValue]);

  const handleFabricTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedFabricType(value);
    setNewItem({
      ...newItem,
      fabricTypeId: value,
      fabricCategoryId: '', // Reset category when type changes
      fabricId: '',
      fabricMasterId: '',
      // gstPercent: '',
      cgstPercent: '',
      sgstPercent: '',
      igstPercent: '',
      gstAmount: '',
      finalAmount: '',
      fabricCode: '',
      quality: '',
      deliveryDate: '',
      // Clear millName only when switching to woven or item PO types
      millName: (isWoven || isItem) ? '' : newItem.millName,
      actualSalesOrderId: '',
    });
  };

  // Handler for fabric master change to autofetch quality and GST
  const handleFabricMasterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;

    setFabricCodeDuplicateError('');

    setNewItem((prevItem: any) => {
      const updatedItem = { ...prevItem, fabricMasterId: id };

      // Determine the correct list based on PO Type and extract data array
      const getFabricList = () => {
        if (isYarn) {
          return yarnList?.data || yarnList || [];
        }
        if (isWoven) {
          return fabricMasterList?.data || fabricMasterList || [];
        }
        if (isKnitted) {
          return knittedknittedFabricMasterList?.data || knittedknittedFabricMasterList || [];
        }
        return [];
      };

      const fabricList = getFabricList();

      // Ensure fabricList is an array
      if (!Array.isArray(fabricList)) {
        console.error('fabricList is not an array:', fabricList);
        return updatedItem;
      }

      if (id && fabricList.length > 0) {
        const selectedFabric = fabricList.find((item: any) => item.id.toString() === id);
        console.log("Selected Fabric:", selectedFabric);

        if (selectedFabric) {
          let quality = '';
          let fabricCode = '';

          if (isYarn) { // Yarn
            fabricCode = selectedFabric.yarnName || '';
            quality = subCategories.find((sc: any) => sc.categoryName === "Counts" && String(sc.id) === selectedFabric.countSno)?.subCategoryName || '';
          } else if (isWoven) { // Woven
            fabricCode = selectedFabric.fabricCode || '';
            quality = selectedFabric.fabricQuality || '';
          } else if (isKnitted) { // Knitted
            fabricCode = selectedFabric.fabricCode || '';
            quality = selectedFabric.fabricName || '';
          }

          let gstPercent = '';
          let cgstPercent = '';
          let sgstPercent = '';
          let igstPercent = '';

          const cgstValue = parseRateValue(selectedFabric.cgst ?? selectedFabric.cgstRate ?? 0);
          const sgstValue = parseRateValue(selectedFabric.sgst ?? selectedFabric.sgstRate ?? 0);
          const igstValue = parseRateValue(selectedFabric.igst ?? selectedFabric.igstRate ?? 0);
          const totalFromMaster = parseRateValue(selectedFabric.gstPercent ?? selectedFabric.totalRate ?? 0);
          const effectiveTotal = totalFromMaster || igstValue || (cgstValue + sgstValue);

          if (selectedTaxId === '1') {
            const resolvedCgst = cgstValue || (effectiveTotal ? effectiveTotal / 2 : 0);
            const resolvedSgst = sgstValue || (effectiveTotal ? effectiveTotal / 2 : 0);
            cgstPercent = resolvedCgst ? resolvedCgst.toString() : '';
            sgstPercent = resolvedSgst ? resolvedSgst.toString() : '';
            const splitTotal = resolvedCgst + resolvedSgst;
            gstPercent = splitTotal ? splitTotal.toString() : '';
            igstPercent = '';
          } else {
            const resolvedIgst = igstValue || effectiveTotal;
            igstPercent = resolvedIgst ? resolvedIgst.toString() : '';
            gstPercent = igstPercent;
            cgstPercent = '';
            sgstPercent = '';
          }

          // Auto-select Sales Order No if there's only one option OR if fabric is already selected
          let autoSelectedSalesOrderId = '';   // actual backend SO ID
          let autoSelectedDropdownId = '';     // composite ID used as dropdown value
          let autoSelectedSalesOrderNo = '';
          
          if (!isBulkOpenOrder && filteredSalesOrderList && filteredSalesOrderList.length === 1) {
            const onlyOrder = filteredSalesOrderList[0];
            autoSelectedDropdownId = String(onlyOrder.id);
            if (onlyOrder.isFabricSpecific) {
              autoSelectedSalesOrderId = onlyOrder.originalSalesOrderId || String(onlyOrder.id).split('_')[0];
            } else {
              autoSelectedSalesOrderId = String(onlyOrder.id);
            }
            autoSelectedSalesOrderNo = onlyOrder.salesOrderNo || onlyOrder.internalOrderNo || '';
          } else if (!isBulkOpenOrder && filteredSalesOrderList && filteredSalesOrderList.length > 1 && id) {
            // For Woven PO type, auto-select the sales order that matches the selected fabric
            const matchingOrder = filteredSalesOrderList.find((order: any) => {
              if (!order.items || !Array.isArray(order.items)) return false;
              return order.items.some((item: any) => 
                item.fabricMasterId && String(item.fabricMasterId) === id
              );
            });
            if (matchingOrder) {
              autoSelectedDropdownId = String(matchingOrder.id);
              if (matchingOrder.isFabricSpecific) {
                autoSelectedSalesOrderId = matchingOrder.originalSalesOrderId || String(matchingOrder.id).split('_')[0];
              } else {
                autoSelectedSalesOrderId = String(matchingOrder.id);
              }
              autoSelectedSalesOrderNo = matchingOrder.salesOrderNo || matchingOrder.internalOrderNo || '';
            }
          }

          // Calculate quantity for fabric selection (no specific yarn)
          let calculatedQuantity = '';
          const salesOrderIdToUse = autoSelectedDropdownId || autoSelectedSalesOrderId || prevItem.actualSalesOrderId || String(prevItem.salesOrderId || '').split('_')[0];
          if (!isBulkOpenOrder && salesOrderIdToUse) {
            const qtyResult = calculateQuantity(selectedFabric, salesOrderIdToUse);
            calculatedQuantity = String(qtyResult || '');
          }

          // Set default UOM for WOVEN/Knitted PO type
          const uomDataList = uomList?.data || uomList || [];
          const defaultUOM = findUOMByName(uomDataList, 'meter');

          const itemWithAutoFill = {
            ...updatedItem,
            quality,
            fabricCode,
            gstPercent,
            cgstPercent,
            sgstPercent,
            igstPercent,
            salesOrderId: isBulkOpenOrder ? "" : (autoSelectedDropdownId || autoSelectedSalesOrderId),
            salesOrderNo: isBulkOpenOrder ? "" : autoSelectedSalesOrderNo,
            // Auto-calculate quantity for fabric selection
            quantity: isBulkOpenOrder ? prevItem.quantity : (calculatedQuantity || prevItem.quantity),
            // Auto-fetch UOM for WOVEN/Knitted PO type
            unit: defaultUOM || prevItem.unit,
            actualSalesOrderId: isBulkOpenOrder ? "" : autoSelectedSalesOrderId,
          };

          // If Sales Order was auto-selected, trigger the full Sales Order selection logic
          // to ensure all quantity calculations are properly executed
          if (!isBulkOpenOrder && autoSelectedDropdownId && filteredSalesOrderList.length === 1) {
            const salesOrderData = handleSalesOrderSelection(autoSelectedDropdownId, itemWithAutoFill);
            // Merge the sales order data with the current item data
            Object.assign(itemWithAutoFill, salesOrderData);
          }

          // For Woven type, also update selectedFabricInOrderDetails to ensure Sales Order filtering works
          if (isWoven && id) {
            setSelectedFabricInOrderDetails(id);
          }

          return recalc(itemWithAutoFill);
        }
      }
      return updatedItem;
    });
  };

  useEffect(() => {
    // Check if coming from Order Entry Management with default values
    const state = location.state as any;
    if (state?.fromOrderEntry && state?.salesOrderData && !purchaseOrderdetail) {
      // Set default values from Order Entry Management
      const yarnPoType = purchaseOrderTypeList?.find((pt: any) => pt.poTypeName.toLowerCase().includes('yarn'));
      if (yarnPoType) {
        setValue('poTypeId', String(yarnPoType.id));
      }
      
      // Set fabric code/quality if available - only proceed if fabric data is loaded
      if (state.salesOrderData.fabricCode && fabricMasterList) {
        // Find fabric master with matching fabric code
        const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
        const matchingFabric = fabricDataList.find((f: any) => 
          f.fabricCode === state.salesOrderData.fabricCode
        );
        if (matchingFabric) {
          setSelectedFabricInOrderDetails(String(matchingFabric.id));
        }
      }
    }
  }, [location.state, purchaseOrderdetail, purchaseOrderTypeList, fabricMasterList, setValue, setSelectedFabricInOrderDetails]);

  // Additional useEffect to handle fabric lookup when fabricMasterList loads after initial render
  useEffect(() => {
    const state = location.state as any;
    if (state?.fromOrderEntry && state?.salesOrderData && !purchaseOrderdetail && state.salesOrderData.fabricCode && fabricMasterList) {
      // Find fabric master with matching fabric code
      const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
      const matchingFabric = fabricDataList.find((f: any) => 
        f.fabricCode === state.salesOrderData.fabricCode
      );
      if (matchingFabric) {
        setSelectedFabricInOrderDetails(String(matchingFabric.id));
      }
    }
  }, [location.state, purchaseOrderdetail, fabricMasterList, setSelectedFabricInOrderDetails]);

  // Auto-fetch and select Sales Order No in Item Details tab
  useEffect(() => {
    const state = location.state as any;
    if (!isBulkOpenOrder && state?.autoFetchSalesOrderNo && state?.salesOrderNo && filteredSalesOrderList && filteredSalesOrderList.length > 0 && !purchaseOrderdetail) {
      // Find the matching sales order by salesOrderNo
      const matchingSalesOrder = filteredSalesOrderList.find((so: any) => 
        (so.salesOrderNo === state.salesOrderNo || so.internalOrderNo === state.salesOrderNo)
      );

      if (matchingSalesOrder) {
        // Auto-populate the newItem with the matching sales order
        const salesOrderData = handleSalesOrderSelection(String(matchingSalesOrder.id), newItem);
        setNewItem((prevItem) => ({
          ...prevItem,
          ...salesOrderData,
          salesOrderId: String(matchingSalesOrder.id),
        }));
      }
    }
  }, [location.state, filteredSalesOrderList, purchaseOrderdetail, newItem]);

  useEffect(()=> {
    if (purchaseOrderdetail) {
      reset({
        id: purchaseOrderdetail.id ?? null,
        poTypeId: purchaseOrderdetail.poTypeId ? String(purchaseOrderdetail.poTypeId) : "",
        poCategoryId: purchaseOrderdetail.poCategoryId ? String(purchaseOrderdetail.poCategoryId) : "",
        poDate: purchaseOrderdetail.poDate ? purchaseOrderdetail.poDate.slice(0, 10) : "",
        vendorId: purchaseOrderdetail.vendorId ? String(purchaseOrderdetail.vendorId) : "",
        taxId: purchaseOrderdetail.taxId ? String(purchaseOrderdetail.taxId) : "",
        activeFlag: purchaseOrderdetail.activeFlag ?? true,
        poNo: purchaseOrderdetail.poNo ? String(purchaseOrderdetail.poNo) : "",
        note: purchaseOrderdetail.note || "",
      });

      // Map millNameId to millName for items using full subCategoryList
      const parentFabricMasterId = purchaseOrderdetail.fabricMasterId ? String(purchaseOrderdetail.fabricMasterId) : null;
      const parentFabricDataList = fabricMasterList?.data || fabricMasterList || [];
      const parentFabric = parentFabricMasterId
        ? parentFabricDataList.find((f: any) => String(f.id) === parentFabricMasterId)
        : null;

      const itemsWithMappedMills = (purchaseOrderdetail.purchaseOrderItemsDtl || []).map((item: any) => {
        let millNameValue = item.millName || '';
        if (item.millNameId && !millNameValue) {
          const millSubCategory = subCategories.find((sc: any) => sc.id === item.millNameId);
          millNameValue = millSubCategory?.subCategoryName || '';
        }

        let fabricCode = item.fabricCode || '';
        let quality = item.quality || '';

        // Resolve from item's own fabricMasterId first
        const itemFabricId = item.fabricMasterId ? String(item.fabricMasterId) : null;
        if (itemFabricId && (!fabricCode || !quality)) {
          const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
          const fabric = fabricDataList.find((f: any) => String(f.id) === itemFabricId);
          if (fabric) {
            if (!fabricCode) fabricCode = fabric.fabricCode || fabric.yarnName || '';
            if (!quality) quality = fabric.fabricQuality || fabric.quality || '';
          }
        }

        // Fallback: for Yarn/Item PO types use the parent PO's fabricMasterId
        if (parentFabric && (!fabricCode || !quality)) {
          if (!fabricCode) fabricCode = parentFabric.fabricCode || '';
          if (!quality) quality = parentFabric.fabricQuality || parentFabric.quality || '';
        }

        return {
          ...item,
          millName: millNameValue,
          salesOrderNo: item.salesOrderNo || '',
          fabricCode: fabricCode,
          quality: quality,
        };
      });

      // Set the purchase order items
      setPurchaseOrderItemsDtl(itemsWithMappedMills);

      // Set fabricMasterId at the order level (for Yarn/Item PO types)
      if (purchaseOrderdetail.fabricMasterId) {
        setSelectedFabricInOrderDetails(String(purchaseOrderdetail.fabricMasterId));
      }

      // If there are items, set the first item's fabricTypeId for editing
      if (itemsWithMappedMills && itemsWithMappedMills.length > 0) {
        const firstItem = itemsWithMappedMills[0];
        setSelectedFabricType(firstItem.fabricTypeId ? String(firstItem.fabricTypeId) : '');

        // Fallback: derive from first item's fabricMasterId if parent-level not set
        if (!purchaseOrderdetail.fabricMasterId && firstItem.fabricMasterId) {
          setSelectedFabricInOrderDetails(String(firstItem.fabricMasterId));
        }
      }

      // Immediately validate for edit case
      const initialIsValid = !!(
        purchaseOrderdetail.poTypeId &&
        purchaseOrderdetail.poCategoryId &&
        purchaseOrderdetail.poDate &&
        purchaseOrderdetail.vendorId &&
        purchaseOrderdetail.taxId
      );
      setIsDetailsValid(initialIsValid);
    }
    setIsLoading(false);
  }, [purchaseOrderdetail, reset, subCategories]);

  // const documentNumberHook = useDocumentNumber({
  //   screenName: 'Purchase Order',
  //   existingNumber: purchaseOrderdetail?.poNo,
  //   shouldGenerateOnMount: !purchaseOrderdetail?.poNo
  // });

  //  const poNo = documentNumberHook.documentNumber;
  // const isPoNoGenerating = documentNumberHook.isGenerating;

  useEffect(() => {
    const subscription = watch((value) => {
      setIsDetailsValid(!!(
        value.poTypeId &&
        value.poCategoryId &&
        value.poDate &&
        value.vendorId &&
        value.taxId
      ));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  //     useEffect(() => {
  //   if (poNo && !purchaseOrderdetail?.poNo) {
  //     setValue('poNo', poNo, { shouldDirty: false });
  //   }
  // }, [poNo, setValue, purchaseOrderdetail?.poNo]);

  useEffect(() => {
    setIsItemsValid(areAllItemsValid);
  }, [areAllItemsValid]);

  useEffect(() => {
    if (!selectedFabricInOrderDetails) return;
    if (!filteredSalesOrderList || filteredSalesOrderList.length === 0) return;

    let matchingOrder: any = null;

    if (filteredSalesOrderList.length === 1) {
      matchingOrder = filteredSalesOrderList[0];
    } else {
      matchingOrder = filteredSalesOrderList.find((order: any) => {
        if (order.isFabricSpecific) {
          return String(order.fabricMasterId) === selectedFabricInOrderDetails;
        }
        if (!order.items || !Array.isArray(order.items)) return false;
        return order.items.some((item: any) =>
          item.fabricMasterId && String(item.fabricMasterId) === selectedFabricInOrderDetails
        );
      });
    }

    if (!matchingOrder) return;

    const dropdownId = String(matchingOrder.id);
    const actualId = matchingOrder.isFabricSpecific
      ? (matchingOrder.originalSalesOrderId || String(matchingOrder.id).split('_')[0])
      : String(matchingOrder.id);
    const soNo = matchingOrder.salesOrderNo || matchingOrder.internalOrderNo || '';

    setNewItem(prev => {
      // Don't auto-populate if the user has just cleared the form (all fields are empty)
      if (prev.salesOrderId) return prev;
      // Check if this is a fresh form (all key fields are empty) - if so, don't auto-populate
      if (!prev.yarnId && !prev.fabricMasterId && !prev.itemId && !prev.quantity && !prev.price) {
        return prev;
      }
      return {
        ...prev,
        salesOrderId: dropdownId,
        actualSalesOrderId: actualId,
        salesOrderNo: soNo,
      };
    });
  }, [selectedFabricInOrderDetails, filteredSalesOrderList]);

  const handleNextClick = () => {
    if (isLoading) return;

    // Double-check validation in case state wasn't updated
    const values = watch();
    const currentIsValid = !!(
      values.poTypeId &&
      values.poDate &&
      values.vendorId &&
      values.taxId
    );

    if (currentIsValid) {
      setActiveTab("itemDetails");
    } else {
      alert("Please fill all required fields in Order Details");
    }
  };

  const addItem = () => {
    if (!newItem.quantity || !newItem.unit || !newItem.price) {
      alert("Please fill all required item fields");
      return;
    }
    // Only require Mill Name for Yarn and Knitted PO types
    if (!isWoven && !isItem && !newItem.millName) {
      alert("Please select Mill Name (required for Yarn and Knitted PO types)");
      return;
    }


    // For fabric PO types, ensure a fabric code is selected
    if ((isWoven || isKnitted) && !newItem.fabricMasterId) {
      alert("Please select Sort No");
      return;
    }

    if (isYarn && (!newItem.yarnId || !newItem.yarnTypeId)) {
      alert("Please select Yarn and Yarn Type");
      return;
    }

    if (isItem && !newItem.itemId) {
      alert("Please select an Item");
      return;
    }

    if (isKnitted && (!newItem.fabricTypeId || !newItem.fabricCategoryId)) {
      alert("Please fill all fabric fields");
      return;
    }

    // Ensure Sales Order No is selected (only for non-Item and non-Bulk/Open Order PO types)
    if (!isItem && !isBulkOpenOrder && !newItem.salesOrderId) {
      alert("Please select Sales Order No");
      return;
    }


    // Check for duplicate fabric code within the same purchase order (handles both add and update)
    if ((isWoven || isKnitted) && newItem.fabricMasterId) {
      const isDuplicate = purchaseOrderItemsDtl.some((item, index) =>
        index !== editingIndex && item.fabricMasterId === newItem.fabricMasterId
      );

      if (isDuplicate) {
        const duplicateMessage = `Fabric code "${newItem.fabricCode || 'this'}" already exists in the current purchase order. Please select a different fabric code.`;
        setFabricCodeDuplicateError(duplicateMessage);
        toast.error(duplicateMessage);
        return;
      }
    }

    // For yarn PO type, check for duplicate yarn and yarn type (handles both add and update)
    if (isYarn && newItem.yarnId && newItem.yarnTypeId) {
      const isDuplicate = purchaseOrderItemsDtl.some((item, index) =>
        index !== editingIndex &&
        String(item.yarnId) === String(newItem.yarnId) && String(item.yarnTypeId) === String(newItem.yarnTypeId)
      );

      if (isDuplicate) {
        const yarnTypeName = String(newItem.yarnTypeId) === "1" ? "Warp" : String(newItem.yarnTypeId) === "2" ? "Weft" : "";
        const duplicateMessage = `This yarn ${newItem.yarnName} already added this ${yarnTypeName}. Add different.`;
        toast.error(duplicateMessage);
        return;
      }
    }

    const itemToAdd = {
      ...newItem,
      productType: productTypeForCurrentPo
    };

    // Check if this fabric code is already used in other purchase orders (for fabric PO types)
    // Skip this check if we're editing an item and the fabric code hasn't changed
    if ((isWoven || isKnitted) && newItem.fabricCode) {
      const isEditingWithSameFabricCode = editingIndex !== null &&
        purchaseOrderItemsDtl[editingIndex]?.fabricCode === newItem.fabricCode;

      if (!isEditingWithSameFabricCode) {
        setFabricCodeDuplicateError("");
      }
    }

    if (editingIndex !== null) {
      const updatedItems = [...purchaseOrderItemsDtl];
      updatedItems[editingIndex] = itemToAdd as PurchaseOrderItem;
      setPurchaseOrderItemsDtl(updatedItems);
      setEditingIndex(null);
    } else {
      setPurchaseOrderItemsDtl([...purchaseOrderItemsDtl, itemToAdd as PurchaseOrderItem]);
    }

    setNewItem(getEmptyNewItem());
  };

  const editItem = (index: number) => {
    const itemToEdit = purchaseOrderItemsDtl[index];

    // Convert millNameId to millName if present using full subCategoryList
    let millNameValue = itemToEdit.millName || '';
    if (itemToEdit.millNameId && !millNameValue) {
      const millSubCategory = subCategories.find((sc: any) => sc.id === itemToEdit.millNameId);
      millNameValue = millSubCategory?.subCategoryName || '';
    }

    let fabricCode = itemToEdit.fabricCode || '';
    let quality = itemToEdit.quality || '';

    // Resolve from item's own fabricMasterId
    if (itemToEdit.fabricMasterId && (!fabricCode || !quality)) {
      const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
      const fabric = fabricDataList.find((f: any) => String(f.id) === String(itemToEdit.fabricMasterId));
      if (fabric) {
        if (!fabricCode) fabricCode = isYarn ? (fabric.yarnName || '') : (fabric.fabricCode || '');
        if (!quality) quality = isYarn
          ? (subCategories.find((sc: any) => sc.categoryName === "Counts" && String(sc.id) === fabric.countSno)?.subCategoryName || '')
          : (fabric.fabricQuality || fabric.quality || '');
      }
    }

    // Fallback: use parent-level fabricMasterId (selectedFabricInOrderDetails) for Yarn/Item PO types
    if (selectedFabricInOrderDetails && (!fabricCode || !quality)) {
      const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
      const fabric = fabricDataList.find((f: any) => String(f.id) === selectedFabricInOrderDetails);
      if (fabric) {
        if (!fabricCode) fabricCode = fabric.fabricCode || '';
        if (!quality) quality = fabric.fabricQuality || fabric.quality || '';
      }
    }

    // Use item's fabricMasterId; fall back to parent-level (selectedFabricInOrderDetails) for Yarn/Item POs
    const fabricIdStr = itemToEdit.fabricMasterId
      ? String(itemToEdit.fabricMasterId)
      : (selectedFabricInOrderDetails || '');
    const originalSalesOrderId =
      itemToEdit.actualSalesOrderId
        ? String(itemToEdit.actualSalesOrderId)
        : (itemToEdit.salesOrderId ? String(itemToEdit.salesOrderId).split('_')[0] : '');

    // Sales Order No dropdown options use `id` from `filteredSalesOrderList`, which for fabric-specific
    // entries is `${originalSalesOrderId}_${fabricMasterId}`. Without this, edit-mode won't match.
    const dropdownSalesOrderId =
      fabricIdStr && originalSalesOrderId ? `${originalSalesOrderId}_${fabricIdStr}` : (itemToEdit.salesOrderId ? String(itemToEdit.salesOrderId) : '');

    setNewItem({
      ...itemToEdit,
      // Ensure all fields are properly set
      fabricId: itemToEdit.fabricId ? String(itemToEdit.fabricId) : '',
      fabricTypeId: itemToEdit.fabricTypeId ? String(itemToEdit.fabricTypeId) : '',
      fabricCategoryId: itemToEdit.fabricCategoryId ? String(itemToEdit.fabricCategoryId) : '',
      fabricMasterId: itemToEdit.fabricMasterId ? String(itemToEdit.fabricMasterId) : '',
      itemId: itemToEdit.itemId ? String(itemToEdit.itemId) : '',
      yarnId: itemToEdit.yarnId ? String(itemToEdit.yarnId) : '',
      yarnTypeId: itemToEdit.yarnTypeId ? String(itemToEdit.yarnTypeId) : '',
      salesOrderId: dropdownSalesOrderId,
      actualSalesOrderId: originalSalesOrderId,
      salesOrderNo: itemToEdit.salesOrderNo || '',
      unit: itemToEdit.unit || '',
      // Convert numbers to strings for input fields
      quantity: String(itemToEdit.quantity || ''),
      price: String(itemToEdit.price || ''),
      discountType: itemToEdit.discountType || 'Percentage',
      discountValue: itemToEdit.discountValue !== undefined && itemToEdit.discountValue !== null ? String(itemToEdit.discountValue) : '',
      discountAmount: itemToEdit.discountAmount !== undefined && itemToEdit.discountAmount !== null ? String(itemToEdit.discountAmount) : '',
      netPricePerUnit: itemToEdit.netPricePerUnit !== undefined && itemToEdit.netPricePerUnit !== null ? String(itemToEdit.netPricePerUnit) : '',
      netAmount: String(itemToEdit.netAmount || ''),
      cgstPercent: String(itemToEdit.cgstPercent || ''),
      sgstPercent: String(itemToEdit.sgstPercent || ''),
      igstPercent: String(itemToEdit.igstPercent || ''),
      gstPercent: String(itemToEdit.gstPercent || ''),
      gstAmount: String(itemToEdit.gstAmount || ''),
      finalAmount: String(itemToEdit.finalAmount || ''),
      deliveryDate: itemToEdit.deliveryDate ? itemToEdit.deliveryDate.slice(0, 10) : '',
      millName: millNameValue,
      fabricCode: fabricCode,
      quality: quality,
    });

    // Set the fabric type for the dropdown
    setSelectedFabricType(itemToEdit.fabricTypeId ? String(itemToEdit.fabricTypeId) : '');
    // For Woven/Knitted PO types, fabric is item-level — update filter to match the row's fabricMasterId.
    // For Yarn/Item PO types, fabric is order-level (selectedFabricInOrderDetails) — do NOT overwrite it.
    if (isWoven || isKnitted) {
      setSelectedFabricInOrderDetails(itemToEdit.fabricMasterId ? String(itemToEdit.fabricMasterId) : '');
    }
    setEditingIndex(index);
  };

  const deleteItem = (index: number) => {
    // If we are deleting the item that is currently being edited, reset the editing state
    if (editingIndex === index) {
      setEditingIndex(null);
      setNewItem(getEmptyNewItem());
    } else if (editingIndex !== null && index < editingIndex) {
      // If we are deleting an item before the one being edited, adjust the editing index
      setEditingIndex(editingIndex - 1);
    }

    setPurchaseOrderItemsDtl(purchaseOrderItemsDtl.filter((_, i) => i !== index));
    setFabricCodeDuplicateError(""); // Refresh/Clear duplicate error state
  };

  // Helper function to convert millName to millNameId
  const getMillNameIdFromName = (millName: string | null | undefined): number | null => {
    if (!millName) return null;
    const millSubCategory = subCategories.find((sc: any) => sc.subCategoryName === millName);
    return millSubCategory?.id || null;
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) {
      toast.error("Company not selected. Please select a company.");
      return;
    }

    isSavingRef.current = true;
    let poNo = purchaseOrderdetail?.poNo || data.poNo || '';

    if (!purchaseOrderdetail?.id && !poNo) {
      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Purchase Order'
        });
        poNo = result.documentNumber;
      } catch (error) {
        console.warn('Failed to generate purchase order number:', error);
        // Graceful degradation - allow submission with empty number
        poNo = '';
      }
    }

    console.log('[PurchaseOrderEntry.onSubmit] Using PO Number:', poNo);

    const currentNote = watch("note");
    const effectiveNote = currentNote !== undefined && currentNote !== null && currentNote !== ""
      ? currentNote
      : (isItem ? getDefaultNoteText(watch("poDate"), watch("vendorId")) : null);

    const payload = {
      ...data,
      note: effectiveNote,
      companyId: parseInt(storedCompanyId),
      poNo: poNo,
      poTypeId: parseInt(data.poTypeId),
      poCategoryId: parseInt(data.poCategoryId),
      vendorId: parseInt(data.vendorId),
      taxId: parseInt(data.taxId),
      activeFlag: true,
      isComplete: purchaseOrderdetail?.isComplete || 0,
      fabricMasterId: selectedFabricInOrderDetails ? parseInt(selectedFabricInOrderDetails) : null,
      purchaseOrderItemsDtl: purchaseOrderItemsDtl.map(({ gstPercent, ...item }) => ({
        ...item,
        poTypeId: parseInt(data.poTypeId),
        productType: productTypeForCurrentPo,
        fabricMasterId: getResolvedFabricMasterId(item),
        fabricTypeId: item.fabricTypeId ? parseInt(item.fabricTypeId) : 1,
        fabricCategoryId: item.fabricCategoryId ? parseInt(item.fabricCategoryId) : 1,
        fabricId: getResolvedFabricMasterId(item) ?? (item.fabricId ? parseInt(item.fabricId) : null),
        yarnId: item.yarnId ? parseInt(item.yarnId) : null,
        yarnTypeId: item.yarnTypeId ? parseInt(String(item.yarnTypeId)) : null,
        yarnName: item.yarnName || null,
        itemId: item.itemId ? parseInt(item.itemId) : null,
        itemName: item.itemName || null,
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        discountType: item.discountType || 'Percentage',
        discountValue: item.discountValue ? parseFloat(item.discountValue) : 0,
        discountAmount: item.discountAmount ? parseFloat(item.discountAmount) : 0,
        netPricePerUnit: item.netPricePerUnit ? parseFloat(item.netPricePerUnit) : (item.price ? parseFloat(item.price) : 0),
        netAmount: parseFloat(item.netAmount),
        deliveryDate: item.deliveryDate ? new Date(item.deliveryDate).toISOString() : null,
        cgstPercent: item.cgstPercent ? parseFloat(item.cgstPercent) : null,
        sgstPercent: item.sgstPercent ? parseFloat(item.sgstPercent) : null,
        igstPercent: item.igstPercent ? parseFloat(item.igstPercent) : null,
        gstAmount: item.gstAmount ? parseFloat(item.gstAmount) : null,
        finalAmount: item.finalAmount ? parseFloat(item.finalAmount) : null,
        fabricCode: item.fabricCode || null,
        quality: item.quality || null,
        salesOrderId: (isBulkOpenOrder || isItem) ? null : (item.actualSalesOrderId ? parseInt(item.actualSalesOrderId) : (item.salesOrderId ? parseInt(item.salesOrderId) : null)),
        salesOrderNo: (isBulkOpenOrder || isItem) ? null : (item.salesOrderNo || null),
        millNameId: getMillNameIdFromName(item.millName) || item.millNameId || null,
      })),
    };

    if (!isDetailsValid) {
      toast.error("Please fill all required fields in Order Details.");
      return;
    }
    if (!areAllItemsValid) {
      toast.error("Please complete all required fields in Item Details before saving.");
      return;
    }

    try {
      // alert(JSON.stringify(payload));
      console.log("Submitting payload:", payload);
      if (purchaseOrderdetail?.id) {
        payload.companyId = purchaseOrderdetail.companyId || parseInt(storedCompanyId); // Use existing if available
        await dispatch(updatePurchaseOrder({ id: purchaseOrderdetail.id, data: payload, companyId: payload.companyId })).unwrap();
      } else {
        await dispatch(createPurchaseOrder(payload)).unwrap();
        hasGeneratedNumberRef.current = false;
        documentNumberService.clearMemoryCache('Purchase Order');
      }

      // Check if coming from Order Entry Management and handle custom redirect
      if (location.state?.fromOrderEntry) {
        navigate("/transaction/order-entry-management", {
          state: {
            source: 'order-entry-management',
            refreshData: true,
            activeTab: location.state.activeTab,
            expandedRowId: location.state.expandedRowId,
            salesOrderId: location.state.salesOrderId,
            flowType: location.state.flowType,
            selectedHyperlink: location.state.selectedHyperlink
          }
        });
      } else {
        navigate("/transaction/purchase-order-details");
      }

    } catch (err) {
      isSavingRef.current = false;
      console.error("Failed to save purchase order:", err);
    }
  };

  // Auto-set GST from yarn master on yarn selection
  const handleYarnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yarnId = e.target.value;

    // Extract data array
    const yarnDataList = yarnList?.data || yarnList || [];
    const selectedYarn = Array.isArray(yarnDataList)
      ? yarnDataList.find((y: any) => String(y.id) === String(yarnId))
      : null;

    let cgstPercent = '';
    let sgstPercent = '';
    let igstPercent = '';
    let gstPercent = '';

    if (selectedYarn) {
      if (selectedTaxId === '1') {
        const c = Number(selectedYarn.cgst ?? 0);
        const s = Number(selectedYarn.sgst ?? 0);
        cgstPercent = c.toFixed(2);
        sgstPercent = s.toFixed(2);
        gstPercent = (c + s).toFixed(2);
        igstPercent = '';
      } else if (selectedTaxId === '2') {
        const i = Number(selectedYarn.gstPercent ?? 0);
        igstPercent = i.toFixed(2);
        gstPercent = i.toFixed(2);
        cgstPercent = '';
        sgstPercent = '';
      }
    }

    // Auto-select Sales Order No if there's only one option
    let autoSelectedDropdownId = '';
    
    if (!isBulkOpenOrder && filteredSalesOrderList && filteredSalesOrderList.length === 1) {
      const onlyOrder = filteredSalesOrderList[0];
      autoSelectedDropdownId = String(onlyOrder.id);
    }

    // Auto-fetch yarn type based on fabric details
    let autoFetchedYarnTypeId = '';
    if (yarnId && selectedFabricInOrderDetails) {
      const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
      const fabric = fabricDataList.find((f: any) => String(f.id) === selectedFabricInOrderDetails);
      if (fabric) {
        autoFetchedYarnTypeId = determineYarnType(fabric, yarnId);
      }
    }

    // Create base item with yarn details
    const baseItem = recalc({
      ...newItem,
      yarnId,
      yarnName: selectedYarn?.yarnName || null,
      yarnTypeId: autoFetchedYarnTypeId, // Auto-fetch yarn type
      cgstPercent,
      sgstPercent,
      igstPercent,
      gstPercent,
    });

    // If Sales Order was auto-selected, trigger the full Sales Order selection logic
    let finalItem = baseItem;
    if (!isBulkOpenOrder && autoSelectedDropdownId) {
      const salesOrderData = handleSalesOrderSelection(autoSelectedDropdownId, baseItem);
      finalItem = recalc({
        ...baseItem,
        ...salesOrderData
      });
    } else if (isBulkOpenOrder) {
      finalItem = recalc({
        ...baseItem,
        salesOrderId: "",
        salesOrderNo: "",
        actualSalesOrderId: "",
      });
    }
    setNewItem(finalItem);
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value;
    const itemDataList = itemMasterList?.data || itemMasterList || [];
    const selectedItem = Array.isArray(itemDataList)
      ? itemDataList.find((i: any) => String(i.id) === String(itemId))
      : null;

    let cgstPercent = '';
    let sgstPercent = '';
    let igstPercent = '';
    let gstPercent = '';

    if (selectedItem) {
      if (selectedTaxId === '1') {
        const c = Number(selectedItem.cgst ?? 0);
        const s = Number(selectedItem.sgst ?? 0);
        cgstPercent = c.toFixed(2);
        sgstPercent = s.toFixed(2);
        gstPercent = (c + s).toFixed(2);
        igstPercent = '';
      } else if (selectedTaxId === '2') {
        const i = Number(selectedItem.igst ?? 0);
        igstPercent = i.toFixed(2);
        gstPercent = i.toFixed(2);
        cgstPercent = '';
        sgstPercent = '';
      }
    }

    // Auto-select Sales Order No if there's only one option OR if item is already selected
    let autoSelectedDropdownId = '';
    
    if (!isBulkOpenOrder && filteredSalesOrderList && filteredSalesOrderList.length === 1) {
      const onlyOrder = filteredSalesOrderList[0];
      autoSelectedDropdownId = String(onlyOrder.id);
    } else if (!isBulkOpenOrder && filteredSalesOrderList && filteredSalesOrderList.length > 1 && itemId) {
      // For Item PO type, auto-select the sales order that matches the selected item
      const matchingOrder = filteredSalesOrderList.find((order: any) => {
        if (!order.items || !Array.isArray(order.items)) return false;
        return order.items.some((item: any) => 
          item.itemId && String(item.itemId) === itemId
        );
      });
      if (matchingOrder) {
        autoSelectedDropdownId = String(matchingOrder.id);
      }
    }

    // Set UOM for ITEM PO type - auto-fetch from item's uomName, fallback to default
    const uomDataList = uomList?.data || uomList || [];
    let itemUOM = '';
    
    if (isItem && selectedItem?.uomName) {
      // Try to find UOM by the item's uomName field
      itemUOM = findUOMByItemName(uomDataList, selectedItem.uomName);
    }
    
    // Fallback to default UOM if item's UOM not found
    const defaultUOM = findUOMByName(uomDataList, 'meter');
    const finalUOM = itemUOM || defaultUOM || newItem.unit;

    // Create base item with item details
    const baseItem = recalc({
      ...newItem,
      itemId: itemId,
      itemName: selectedItem?.itemName || null,
      // For ITEM PO type, use auto-fetched UOM from item, fallback to default
      unit: isItem ? finalUOM : (selectedItem?.uomId ? String(selectedItem.uomId) : newItem.unit),
      cgstPercent,
      sgstPercent,
      igstPercent,
      gstPercent,
    });

    // If Sales Order was auto-selected, trigger the full Sales Order selection logic
    let finalItem = baseItem;
    if (!isBulkOpenOrder && autoSelectedDropdownId) {
      const salesOrderData = handleSalesOrderSelection(autoSelectedDropdownId, baseItem);
      finalItem = recalc({
        ...baseItem,
        ...salesOrderData
      });
    } else if (isBulkOpenOrder) {
      finalItem = recalc({
        ...baseItem,
        salesOrderId: "",
        salesOrderNo: "",
        actualSalesOrderId: "",
      });
    }
    setNewItem(finalItem);
  };

  useEffect(() => {
    if (!isYarn) return;
    if (!newItem.yarnId) return;

    const yarnDataList = yarnList?.data || yarnList || [];
    const y = Array.isArray(yarnDataList)
      ? yarnDataList.find((yy: any) => String(yy.id) === String(newItem.yarnId))
      : null;

    if (!y) return;

    let cgstPercent = '';
    let sgstPercent = '';
    let igstPercent = '';
    let gstPercent = '';

    if (selectedTaxId === '1') {
      const c = Number(y.cgst ?? 0);
      const s = Number(y.sgst ?? 0);
      cgstPercent = c.toFixed(2);
      sgstPercent = s.toFixed(2);
      gstPercent = (c + s).toFixed(2);
      igstPercent = '';
    } else if (selectedTaxId === '2') {
      const i = Number(y.gstPercent ?? 0);
      igstPercent = i.toFixed(2);
      gstPercent = i.toFixed(2);
      cgstPercent = '';
      sgstPercent = '';
    }

    setNewItem(prev => recalc({ ...prev, cgstPercent, sgstPercent, igstPercent, gstPercent }));
  }, [selectedTaxId, isYarn, newItem.yarnId, yarnList]);

  useEffect(() => {
    if (!isItem) return;
    if (!newItem.itemId) return;

    const itemDataList = itemMasterList?.data || itemMasterList || [];
    const selectedItem = Array.isArray(itemDataList)
      ? itemDataList.find((i: any) => String(i.id) === String(newItem.itemId))
      : null;

    if (!selectedItem) return;

    let cgstPercent = '';
    let sgstPercent = '';
    let igstPercent = '';
    let gstPercent = '';

    if (selectedTaxId === '1') {
      const c = Number(selectedItem.cgst ?? 0);
      const s = Number(selectedItem.sgst ?? 0);
      cgstPercent = c.toFixed(2);
      sgstPercent = s.toFixed(2);
      gstPercent = (c + s).toFixed(2);
      igstPercent = '';
    } else if (selectedTaxId === '2') {
      const i = Number(selectedItem.igst ?? 0);
      igstPercent = i.toFixed(2);
      gstPercent = i.toFixed(2);
      cgstPercent = '';
      sgstPercent = '';
    }

    setNewItem(prev => recalc({ ...prev, cgstPercent, sgstPercent, igstPercent, gstPercent }));
  }, [selectedTaxId, isItem, newItem.itemId, itemMasterList]);

  useEffect(() => {
    if (!(isWoven || isKnitted)) return;
    if (!newItem.fabricMasterId) return;

    const fabricList = isWoven ? (fabricMasterList?.data || fabricMasterList || []) : (knittedknittedFabricMasterList?.data || knittedknittedFabricMasterList || []);
    const selectedFabric = Array.isArray(fabricList) ? fabricList.find((f: any) => String(f.id) === String(newItem.fabricMasterId)) : null;

    if (!selectedFabric) return;

    let gstPercent = '';
    let cgstPercent = '';
    let sgstPercent = '';
    let igstPercent = '';

    const cgstValue = parseRateValue(selectedFabric.cgst ?? selectedFabric.cgstRate ?? 0);
    const sgstValue = parseRateValue(selectedFabric.sgst ?? selectedFabric.sgstRate ?? 0);
    const igstValue = parseRateValue(selectedFabric.igst ?? selectedFabric.igstRate ?? 0);
    const totalFromMaster = parseRateValue(selectedFabric.gstPercent ?? selectedFabric.totalRate ?? 0);
    const effectiveTotal = totalFromMaster || igstValue || (cgstValue + sgstValue);

    if (selectedTaxId === '1') {
      const resolvedCgst = cgstValue || (effectiveTotal ? effectiveTotal / 2 : 0);
      const resolvedSgst = sgstValue || (effectiveTotal ? effectiveTotal / 2 : 0);
      cgstPercent = resolvedCgst ? resolvedCgst.toString() : '';
      sgstPercent = resolvedSgst ? resolvedSgst.toString() : '';
      const splitTotal = resolvedCgst + resolvedSgst;
      gstPercent = splitTotal ? splitTotal.toString() : '';
      igstPercent = '';
    } else if (selectedTaxId === '2') {
      const resolvedIgst = igstValue || effectiveTotal;
      igstPercent = resolvedIgst ? resolvedIgst.toString() : '';
      gstPercent = igstPercent;
      cgstPercent = '';
      sgstPercent = '';
    }

    setNewItem(prev => recalc({ ...prev, cgstPercent, sgstPercent, igstPercent, gstPercent }));
  }, [selectedTaxId, isWoven, isKnitted, newItem.fabricMasterId, fabricMasterList, knittedknittedFabricMasterList]);


  return (
    <div>
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/purchase-order-details")}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">Purchase Order</h2>
          </div>
         
        </div>



        <div className="space-y-6">
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} /> Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-6 gap-8">
                <div>
                  <label className="block text-sm font-medium mb-1">PO No</label>
                  <input
                    type="text"
                    placeholder="Loading sequence..."
                    readOnly
                    className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                      !watch('poNo') || watch('poNo')?.startsWith('Loading')
                        ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                        : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                    }`}
                    {...register('poNo')}
                  />
                </div>
                {/* <div>
                  <label className="block text-sm font-medium">PO Type <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    {...register("poTypeId", { required: "PO Type is required" })}
                    options={purchaseOrderTypeList?.filter((poType: any) => poType.activeFlag !== false)

                      ?.map((poType: any) => ({
                        value: String(poType.id),
                        label: poType.poTypeName,
                      })) || []}
                    placeholder="Select a PO Type"
                    className="mt-1"
                    error={errors.poTypeId?.message as string}
                  />
                  {errors.poTypeId && <p className="mt-1 text-sm text-red-600">{errors.poTypeId.message}</p>}
                </div> */}
                <div>
                  <label className="block text-sm font-medium">PO Type <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    {...register("poTypeId", { required: "PO Type is required" })}
                    value={watch("poTypeId")}
                    options={poTypeOptions}
                    filterActive
                    onChange={(e: any) => {
                      const selectedPoTypeId = e.target?.value || e;
                      setValue("poTypeId", selectedPoTypeId, { shouldValidate: true });
                      setValue("poCategoryId", "");
                      setValue("vendorId", "");
                      setValue("taxId", "");
                      setFilteredVendorList([]);
                      setActiveTab("orderDetails");
                      setPurchaseOrderItemsDtl([]);
                      setEditingIndex(null);
                      setFabricCodeDuplicateError('');
                      setSelectedFabricInOrderDetails(''); // Reset fabric selection
                      setSelectedFabricType('');
                      setNewItem(getEmptyNewItem());
                    }}
                    placeholder="Select a PO Type"
                    error={errors.poTypeId?.message as string}
                  />
                  {errors.poTypeId && <p className="mt-1 text-sm text-red-600">{errors.poTypeId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium">PO Category <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    {...register("poCategoryId", { required: "PO Category is required" })}
                    value={watch("poCategoryId")}
                    options={filteredPoCategoryOptions}
                    onChange={(e: any) => {
                      const val = e.target?.value || e;
                      setValue("poCategoryId", val, { shouldValidate: true });
                      
                      // If user selects Bulk/Open Order (value 2 or 401), reset sales order fields
                      if (String(val) === "2" || String(val) === "401") {
                        setNewItem(prev => ({
                          ...prev,
                          salesOrderId: "",
                          salesOrderNo: "",
                          actualSalesOrderId: "",
                          quantity: "",
                          netAmount: "",
                          gstAmount: "",
                          finalAmount: "",
                        }));
                      }
                    }}
                    placeholder="Select a PO Category"
                    error={errors.poCategoryId?.message as string}
                  />
                  {errors.poCategoryId && <p className="mt-1 text-sm text-red-600">{errors.poCategoryId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium">PO Date <span className="text-red-500">*</span></label>
                  <input
                    {...register('poDate', { required: "PO Date is required" })}
                    type="date"
                    className={`input mt-1 ${errors.poDate ? 'border-red-500' : ''}`}
                  />
                  {errors.poDate && <p className="mt-1 text-sm text-red-600">{errors.poDate.message}</p>}
                </div>

                {/* <div>
                  <label className="block text-sm font-medium">Vendor <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    {...register("vendorId", { required: "Vendor is required" })}
                    options={filteredVendorList?.map((vendor: any) => ({
                      value: String(vendor.id),
                      label: vendor.vendorName,
                    })) || []}
                    placeholder="Select a Vendor"
                    className="mt-1"
                    error={errors.vendorId?.message as string}
                  />
                  {errors.vendorId && <p className="mt-1 text-sm text-red-600">{errors.vendorId.message}</p>}
                </div> */}

                <div>
                  <label className="block text-sm font-medium">Supplier/Vendor <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    {...register("vendorId", { required: "Supplier is required" })}
                    value={watch("vendorId")}
                    options={vendorOptions}
                    filterActive
                    onChange={(e: any) => {
                      const selectedVendorId = e.target?.value || e;
                      setValue("vendorId", selectedVendorId, { shouldValidate: true });
                      const selectedVendor = filteredVendorList.find((v: any) => String(v.id) === String(selectedVendorId));
                      if (selectedVendor) {
                        const addressArr = selectedVendor.address || [];
                        let defaultAddr: any = null;
                        if (Array.isArray(addressArr)) {
                          defaultAddr = addressArr.find((a: any) => a.isDefault) || addressArr[0];
                        } else if (addressArr) {
                          defaultAddr = addressArr;
                        }
                        const code = defaultAddr?.stateCode || '';
                        setVendorStateCode(code);
                        
                      }
                    }}
                    placeholder="Select a Vendor"
                    error={errors.vendorId?.message as string}
                  />
                  {errors.vendorId && <p className="mt-1 text-sm text-red-600">{errors.vendorId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium">GST Type <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    {...register("taxId", { required: "GST Type is required" })}
                    options={[
                      { value: "1", label: "CGST/SGST" },
                      { value: "2", label: "IGST" },
                    ]}
                    placeholder="Select GST Type"
                    className="mt-1"
                    disabled
                    error={errors.taxId?.message as string}
                  />
                  {errors.taxId && <p className="mt-1 text-sm text-red-600">{errors.taxId.message}</p>}
                </div>
                
                {/* Fabric code-Quality dropdown - show for Yarn PO types only */}
                {isYarn && (
                  <div>
                    <label className="block text-sm font-medium">
                      Sort No - Construction
                    </label>
                    <CommonSearchableSelect
                      value={selectedFabricInOrderDetails}
                      onChange={(e: any) => {
                        const value = e.target?.value || e;
                        setSelectedFabricInOrderDetails(value);
                        
                        // Find the selected fabric to get fabricCode and quality
                        const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
                        const selectedFabric = fabricDataList.find((fabric: any) => String(fabric.id) === value);
                        
                        let fabricCode = '';
                        let quality = '';
                        
                        if (selectedFabric) {
                          fabricCode = selectedFabric.fabricCode || '';
                          quality = selectedFabric.fabricQuality || selectedFabric.quality || '';
                        }
                        
                        // Update fabricCode/quality when fabric changes
                        setNewItem(prev => ({
                          ...prev,
                          // Reset yarn fields only for yarn PO type
                          ...(isYarn && {
                            yarnId: '',
                            yarnName: '',
                            yarnTypeId: '',
                          }),
                          fabricCode: fabricCode,
                          quality: quality,
                        }));
                      }}
                      options={(fabricMasterList?.data || (Array.isArray(fabricMasterList) ? fabricMasterList : []))
                        .map((fabric: any) => ({
                          value: String(fabric.id),
                          label: `${fabric.fabricCode || ''} - ${fabric.fabricQuality || fabric.quality || ''}`,
                        }))}
                      placeholder="Select Sort No - Construction"
                      className="mt-1"
                    />
                  </div>
                )}

                {isItem && (
                  <div className="col-span-6">
                    <label className="block text-sm font-medium mb-1">Note</label>
                    <textarea
                      rows={3}
                      {...register("note")}
                      onKeyDown={handleOrderNoteKeyDown}
                      className="input mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      placeholder="Enter Note"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={20} /> Item Details
                      {selectedPoType && (() => {
                        const poType = purchaseOrderTypeList.find((pt: any) => String(pt.id) === selectedPoType);
                        return poType ? <span className="text-sm text-gray-500">({poType.poTypeName})</span> : null;
                      })()}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-6">
                    {/* Dynamic fields based on PO Type */}
                    {isYarn && (
                      <>
                        <div>
                          <label className="block text-sm font-medium">
                            Yarn Name <span className="text-red-500">*</span>
                          </label>
                          <CommonSearchableSelect
                            value={newItem.yarnId || ''}
                            onChange={(e: any) => {
                              const value = e.target?.value || e;
                              handleYarnChange({ target: { value } } as any);
                            }}
                            options={filteredYarnList?.map((yarn: any) => ({
                              value: String(yarn.id),
                              label: yarn.yarnName,
                            })) || []}
                            placeholder="Select Yarn"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">
                            Yarn Type <span className="text-red-500">*</span>
                          </label>
                          <CommonSearchableSelect
                            value={newItem.yarnTypeId || ''}
                            onChange={(e: any) => {
                              const value = e.target?.value || e;
                              const updatedItem = { ...newItem, yarnTypeId: value };
                              if (newItem.yarnId && newItem.salesOrderId) {
                                const fabricDataList = fabricMasterList?.data || fabricMasterList || [];
                                const fabric = fabricDataList.find((f: any) => String(f.id) === (selectedFabricInOrderDetails || newItem.fabricMasterId));
                                if (fabric) {
                                  const salesOrderIdToUse = newItem.actualSalesOrderId || newItem.salesOrderId || '';
                                  const qtyResult = calculateQuantity(fabric, salesOrderIdToUse, newItem.yarnId || undefined, value || undefined);
                                  if (qtyResult) {
                                    setNewItem(recalc({ ...updatedItem, quantity: String(qtyResult) }));
                                    return;
                                  }
                                }
                              }
                              setNewItem(updatedItem);
                            }}
                            options={[
                              { value: "1", label: "Warp" },
                              { value: "2", label: "Weft" },
                               { value: "3", label: "Both" },
                            ]}
                            placeholder="Select Yarn Type"
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}

                    {isItem && (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium">
                              Description/Item Name <span className="text-red-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsItemMasterModalOpen(true)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add Item Master
                            </button>
                          </div>
                          <CommonSearchableSelect
                            value={newItem.itemId || ''}
                            onChange={(e: any) => {
                              const value = e.target?.value || e;
                              handleItemChange({ target: { value } } as any);
                            }}
                            options={(Array.isArray(itemMasterList) ? itemMasterList : itemMasterList?.data || []).map((item: any) => ({
                              value: String(item.id),
                              label: item.itemName,
                            })) || []}
                            placeholder="Select Item"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium">Performa Number</label>
                          <input
                            type="text"
                            value={newItem.performaNo || ''}
                            onChange={(e) => setNewItem({ ...newItem, performaNo: e.target.value })}
                            className="input mt-1"
                            placeholder="Enter Performa Number"
                          />
                        </div>
                      </>
                    )}


                    {(isWoven || isKnitted) && ( // Woven Fabric
                      <>
                        {/* <div>
                          <label className="block">Fabric Type <span className="text-red-600">*</span></label>
                          <CommonSearchableSelect
                            value={newItem.fabricTypeId || ''}
                            onChange={(e: any) => {
                              const selectedValue = e.target?.value || e;
                              handleFabricTypeChange({ target: { value: selectedValue } } as any);
                              setNewItem({
                                ...newItem,
                                fabricTypeId: selectedValue,
                                fabricId: '' // Reset fabric selection when type changes
                              });
                            }}
                            options={fabricTypeList?.map((fabricType: any) => ({
                              value: String(fabricType.id),
                              label: fabricType.fabricTypeName,
                              activeFlag: fabricType.activeFlag ?? true,
                            })) || []}
                            filterActive
                            placeholder="Select a Fabric Type"
                            className="mt-1"
                          />
                        </div> */}

                        {/* {selectedFabricType === '1' && (
                          <div>

                            <label className="block">Select Greige</label>
                            <CommonSearchableSelect
                              value={newItem.fabricId || ''}
                              onChange={(e: any) => {
                                const value = e.target?.value || e;
                                setNewItem({ ...newItem, fabricId: value });
                              }}
                              options={currentFabricList?.map((item: any) => ({
                                value: String(item.id),
                                label: `${item.fabricQuality} ${item.fabricCode}`,

                              })) || []}
                              placeholder="Select Greige"
                              className="mt-1"
                            />
                          </div>
                        )}

                        {selectedFabricType === '2' && (
                          <div>
                            <label className="block">Select Finished</label>
                            <CommonSearchableSelect
                              value={newItem.fabricId || ''}
                              onChange={(e: any) => {
                                const value = e.target?.value || e;
                                setNewItem({ ...newItem, fabricId: value });
                              }}
                              options={currentFabricList?.map((item: any) => ({
                                value: String(item.id),
                                label: ` ${item.fabricCode}`,
                              })) || []}
                              placeholder="Select Finished"
                              className="mt-1"
                            />
                          </div>
                        )} */}

                        {/* {selectedFabricType && ( */}
                        {/* <div>
                          <label className="block text-sm font-medium">Fabric Category <span className="text-red-500">*</span></label>
                          <CommonSearchableSelect
                            value={newItem.fabricCategoryId || ''}
                            onChange={(e: any) => {
                              const value = e.target?.value || e;
                              setNewItem({
                                ...newItem,
                                fabricCategoryId: value,
                              });
                            }}
                            options={fabricCategoryList?.map((item: any) => ({
                              value: String(item.id),
                              label: item.fabricCategoryName,
                              activeFlag: item.activeFlag ?? true,
                            })) || []}
                            filterActive
                            placeholder="Select Category"
                            className="mt-1"
                          />
                        </div> */}

                        {/* Fabric Code (dropdown from fabric management) */}
                        <div>
                          <label className="block text-sm font-medium">Sort No <span className="text-red-500">*</span></label>
                          <CommonSearchableSelect
                            value={newItem.fabricMasterId || ''}
                            onChange={(e: any) => {
                              const value = e.target?.value || e;
                              handleFabricMasterChange({ target: { value } } as any);
                            }}
                            options={currentFabricList?.map((fabric: any) => ({
                              value: String(fabric.id),
                              label: fabric.fabricCode || 'N/A',
                            })) || []}
                            placeholder="Select Sort No"
                            className="mt-1"
                            error={fabricCodeDuplicateError}
                          />
                          {fabricCodeDuplicateError && (
                            <p className="text-red-500 text-sm mt-1">{fabricCodeDuplicateError}</p>
                          )}
                        </div>

                        {/* Fabric Name/Quality (auto from selected Fabric Code) */}
                        <div>
                          <label className="block text-sm font-medium">Construction</label>
                          <input
                            type="text"
                            value={newItem.quality || ''}
                            readOnly
                            className="input mt-1 bg-gray-100 cursor-not-allowed"
                            placeholder="Auto from Sort No"
                          />
                        </div>
                      </>
                    )}

                    {/* Common fields for all item types */}
                    <div>
                      <label className="block text-sm font-medium">Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem(recalc({ ...newItem, quantity: e.target.value }))}
                        className="input mt-1"
                        placeholder="Quantity"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">UOM <span className="text-red-500">*</span></label>
                      <CommonSearchableSelect
                        value={newItem.unit}
                        onChange={(e: any) => {
                          const value = e.target?.value || e;
                          setNewItem({ ...newItem, unit: value });
                        }}
                        options={uomList?.map((unit: any) => ({
                          value: String(unit.id),
                          label: unit.uomName,
                        })) || []}
                        placeholder="Select Unit"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Price <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem(recalc({ ...newItem, price: e.target.value }))}
                        className="input mt-1"
                        placeholder="Price"
                      />
                    </div>

                    {isItem && (
                      <>
                        <div>
                          <label className="block text-sm font-medium">Discount Type</label>
                          <select
                            value={newItem.discountType || "Percentage"}
                            onChange={(e) => setNewItem(recalc({ ...newItem, discountType: e.target.value }))}
                            className="input mt-1 bg-white border border-gray-300 rounded-md shadow-sm w-full py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="Percentage">Percentage (%)</option>
                            <option value="Amount">Amount (₹)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium">
                            Discount Value {newItem.discountType === "Amount" ? "(₹)" : "(%)"}
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0"
                            placeholder={newItem.discountType === "Amount" ? "Amount per unit" : "Percentage"}
                            value={newItem.discountValue || ""}
                            onChange={(e) => setNewItem(recalc({ ...newItem, discountValue: e.target.value }))}
                            className="input mt-1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium">Discount Amount / Unit</label>
                          <input
                            placeholder="Discount Amount"
                            value={newItem.discountAmount || "0"}
                            className="input mt-1 bg-gray-50"
                            readOnly
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium">Net Price / Unit</label>
                          <input
                            placeholder="Net Price / Unit"
                            value={newItem.netPricePerUnit || ""}
                            className="input mt-1 bg-gray-50 font-medium text-blue-700"
                            readOnly
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium">Packing and Forwarding</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0"
                            placeholder="Packing & Forwarding Amount"
                            value={newItem.packingAndForwarding || ""}
                            onChange={(e) => setNewItem(recalc({ ...newItem, packingAndForwarding: e.target.value }))}
                            className="input mt-1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium">Others</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0"
                            placeholder="Others Amount"
                            value={newItem.others || ""}
                            onChange={(e) => setNewItem(recalc({ ...newItem, others: e.target.value }))}
                            className="input mt-1"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium">Net Amount</label>
                      <input
                        type="number"
                        value={newItem.netAmount}
                        onChange={(e) => setNewItem({ ...newItem, netAmount: e.target.value })}
                        className="input mt-1"
                        placeholder="Net Amount"
                        readOnly
                      />
                    </div>

                    {/* Sales Order No (dropdown) */}
                    {!isBulkOpenOrder && !isItem && (
                      <div>
                        <label className="block text-sm font-medium">Sales Order No <span className="text-red-600">*</span></label>
                      <CommonSearchableSelect
                        value={newItem.salesOrderId || ''}
                        onChange={(e: any) => {
                          const selectedId = e.target?.value || e;
                          const salesOrderData = handleSalesOrderSelection(selectedId, newItem);
                          setNewItem({
                            ...newItem,
                            ...salesOrderData
                          });
                        }}
                        options={filteredSalesOrderList
                          .map((so: any) => {
                            const salesOrderNo = so.salesOrderNo || so.internalOrderNo || String(so.originalSalesOrderId || so.id);
                            
                            // For fabric-specific entries, use the fabricCodeQuality
                            if (so.isFabricSpecific && so.fabricCodeQuality) {
                              return {
                                value: String(so.id),
                                label: `${salesOrderNo} - ${so.fabricCodeQuality}`,
                              };
                            }
                            
                            // For non-fabric-specific entries (backward compatibility), get fabric code
                            let fabricCode = '';
                            
                            // First try to get fabric code from sales order items
                            if (so.items && Array.isArray(so.items) && so.items.length > 0) {
                              const firstItem = so.items[0];
                              if (firstItem.fabricCode) {
                                fabricCode = firstItem.fabricCode;
                              }
                            }
                            
                            // If no fabric code in items, try to get it from selected fabric
                            if (!fabricCode && selectedFabricInOrderDetails) {
                              const fabric = fabricMasterList?.data?.find((f: any) => String(f.id) === selectedFabricInOrderDetails);
                              fabricCode = fabric?.fabricCode || '';
                            }
                            
                            // If still no fabric code, try direct property
                            if (!fabricCode && so.fabricCode) {
                              fabricCode = so.fabricCode;
                            }
                            
                            const label = fabricCode ? `${salesOrderNo} - ${fabricCode}` : salesOrderNo;
                            return {
                              value: String(so.id),
                              label: label,
                            };
                          }) || []}
                        placeholder="Select Sales Order"
                        className="mt-1"
                      />
                    </div>
                    )}

                    {/* Mill Name (dropdown) - Only show for Yarn and Knitted PO types */}
                    {!isWoven && !isItem && (
                      <div>
                        <label className="block text-sm font-medium">Mill Name <span className="text-red-500">*</span></label>
                        <CommonSearchableSelect
                          value={newItem.millName || ''}
                          onChange={(e: any) => {
                            const value = e.target?.value || e;
                            setNewItem({ ...newItem, millName: value });
                          }}
                          options={millSubCategories?.map((mill: any) => ({
                            value: mill.subCategoryName,
                            label: mill.subCategoryName,
                            activeFlag: mill.activeFlag ?? true,
                          })) || []}
                          filterActive
                          placeholder="Select Mill Name"
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* GST fields based on selected GST Type type */}
                    {selectedTaxId === "1" && ( // CGST/SGST
                      <>
                        <div>
                          <label className="block text-sm font-medium">CGST %</label>
                          <input
                            type="number"
                            value={newItem.cgstPercent || ''}
                            disabled
                            onChange={(e) => {
                              const c = toNumber(e.target.value);
                              const s = toNumber(newItem.sgstPercent);
                              setNewItem(recalc({ ...newItem, cgstPercent: e.target.value, gstPercent: String(c + s), igstPercent: '' }));
                            }}
                            className="input mt-1"
                            placeholder="CGST %"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">SGST %</label>
                          <input
                            type="number"
                            value={newItem.sgstPercent || ''}
                            disabled
                            onChange={(e) => {
                              const s = toNumber(e.target.value);
                              const c = toNumber(newItem.cgstPercent);
                              setNewItem(recalc({ ...newItem, sgstPercent: e.target.value, gstPercent: String(c + s), igstPercent: '' }));
                            }}
                            className="input mt-1"
                            placeholder="SGST %"
                          />
                        </div>
                      </>
                    )}

                    {selectedTaxId === "2" && ( // IGST
                      <div>
                        <label className="block text-sm font-medium">IGST %</label>
                        <input
                          type="number"
                          value={newItem.igstPercent || ''}
                          disabled
                          onChange={(e) => {
                            const percent = toNumber(e.target.value);
                            setNewItem(recalc({ ...newItem, gstPercent: String(percent), igstPercent: e.target.value, cgstPercent: '', sgstPercent: '' }));
                          }}
                          className="input mt-1"
                          placeholder="IGST %"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium">GST Amount</label>
                      <input placeholder="GST Amount"
                        value={newItem.gstAmount}
                        onChange={(e) => setNewItem({ ...newItem, gstAmount: e.target.value })}
                        className="input mt-1"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Final Amount</label>
                      <input placeholder="Final Amount"
                        value={newItem.finalAmount}
                        onChange={(e) => setNewItem({ ...newItem, finalAmount: e.target.value })}
                        className="input mt-1"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Delivery Date</label>
                      <input
                        type="date"
                        value={newItem.deliveryDate}
                        onChange={(e) => setNewItem({ ...newItem, deliveryDate: e.target.value })}
                        className="input mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Remarks</label>
                      <input
                        value={newItem.remarks}
                        onChange={(e) => setNewItem({ ...newItem, remarks: e.target.value })}
                        className="input mt-1"
                        placeholder="Remarks"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={addItem}
                    className="mt-4 ml-auto flex items-center bg-primary hover:bg-primary text-white"
                  >
                    <Plus size={18} className="mr-2" />
                    {editingIndex !== null ? "Update Item" : "Add Item"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList size={20} /> Item Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full border-collapse border border-gray-300 text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Sl.No</th>
                        {/* <th className="border p-2">Product Type</th> */}
                        {/* <th className="border p-2">Product Name</th> */}
                        {isYarn && <th className="border p-2">Yarn Name</th>}
                        {isYarn && <th className="border p-2">Yarn Type</th>}
                        {(isWoven || isKnitted) && (
                          <>
                            <th className="border p-2">Sort No</th>
                            <th className="border p-2">Construction</th>
                          </>
                        )}
                        {isItem && <th className="border p-2">Description/Item Name</th>}
                        <th className="border p-2">Quantity</th>
                        <th className="border p-2">Unit</th>
                        <th className="border p-2">Price</th>
                        {isItem && <th className="border p-2">Discount</th>}
                        {isItem && <th className="border p-2">Net Price/Unit</th>}
                        {isItem && <th className="border p-2">P&F</th>}
                        {isItem && <th className="border p-2">Others</th>}
                        <th className="border p-2">Net Amount</th>
                        <th className="border p-2">Delivery Date</th>
                        <th className="border p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrderItemsDtl.map((item, index) => {
                        const discountDisplay = item.discountValue && parseFloat(item.discountValue) > 0
                          ? (item.discountType === 'Amount' ? `₹${item.discountValue}` : `${item.discountValue}%`)
                          : '-';

                        const netPriceDisplay = item.netPricePerUnit || item.price || '-';

                        return (
                          <tr key={index} className="border">
                            <td className="border p-2">{index + 1}</td>
                            {isYarn && <td className="border p-2">{item.yarnName || "-"}</td>}
                            {isYarn && (
                              <td className="border p-2">
                                {String(item.yarnTypeId) === "1" ? "Warp" : String(item.yarnTypeId) === "2" ? "Weft" : String(item.yarnTypeId) === "3" ? "Both" : "-"}
                              </td>
                            )}
                            {(isWoven || isKnitted) && (
                              <>
                                <td className="border p-2">{item.fabricCode || '-'}</td>
                                <td className="border p-2">{item.quality || '-'}</td>
                              </>
                            )}
                            {isItem && (
                              <td className="border p-2">{item.itemName || "-"}</td>
                            )}
                            <td className="border p-2">{item.quantity}</td>
                            <td className="border p-2">
                              {uomList.find((uom: any) => uom.id === Number(item.unit))?.uomName}
                            </td>
                            <td className="border p-2">{item.price}</td>
                            {isItem && <td className="border p-2">{discountDisplay}</td>}
                            {isItem && <td className="border p-2">{netPriceDisplay}</td>}
                            {isItem && <td className="border p-2">{item.packingAndForwarding ? `₹${item.packingAndForwarding}` : '-'}</td>}
                            {isItem && <td className="border p-2">{item.others ? `₹${item.others}` : '-'}</td>}
                            <td className="border p-2">{item.netAmount}</td>
                            <td className="border p-2">{item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : ''}</td>
                            <td className="border p-2">
                              <Button size="sm" onClick={() => editItem(index)} className="mr-2">
                                <Edit size={14} />
                              </Button>
                              <Button size="sm" onClick={() => deleteItem(index)} variant="destructive">
                                <Trash2 size={14} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
            </Card>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit(onSubmit)}
              className="bg-primary hover:bg-primary text-white px-6 flex items-center"
              disabled={!canSaveOrUpdate}
            >
              <Save size={18} className="mr-2" />
              {purchaseOrderdetail?.id ? "Update Purchase Order" : "Save Purchase Order"}
            </Button>
          </div>
        </div>
      </div>

      {/* Item Master Modal */}
      {isItemMasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" /> Add Item Master
              </h3>
              <button
                type="button"
                onClick={() => setIsItemMasterModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {itemMasterServerErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {itemMasterServerErrors.general}
              </div>
            )}

            <form onSubmit={handleSaveItemMasterModal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemMasterModalData.itemName}
                    onChange={(e) => {
                      setItemMasterModalData({ ...itemMasterModalData, itemName: e.target.value });
                      if (itemMasterServerErrors.itemName) setItemMasterServerErrors({ ...itemMasterServerErrors, itemName: '' });
                    }}
                    placeholder="Enter item name"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {itemMasterServerErrors.itemName && (
                    <p className="text-red-500 text-xs mt-1">{itemMasterServerErrors.itemName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assert No/Item Code
                  </label>
                  <input
                    type="text"
                    value={itemMasterModalData.itemCode}
                    onChange={(e) => {
                      setItemMasterModalData({ ...itemMasterModalData, itemCode: e.target.value });
                      if (itemMasterServerErrors.itemCode) setItemMasterServerErrors({ ...itemMasterServerErrors, itemCode: '' });
                    }}
                    placeholder="Enter Assert No / Item Code"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {itemMasterServerErrors.itemCode && (
                    <p className="text-red-500 text-xs mt-1">{itemMasterServerErrors.itemCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Department"
                    options={departmentOptions}
                    value={itemMasterModalData.department}
                    onValueChange={(val) => {
                      setItemMasterModalData({ ...itemMasterModalData, department: val });
                      if (itemMasterServerErrors.department) setItemMasterServerErrors({ ...itemMasterServerErrors, department: '' });
                    }}
                    error={itemMasterServerErrors.department}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Item Category
                  </label>
                  <input
                    type="text"
                    value={itemMasterModalData.itemCategory}
                    onChange={(e) => {
                      setItemMasterModalData({ ...itemMasterModalData, itemCategory: e.target.value });
                      if (itemMasterServerErrors.itemCategory) setItemMasterServerErrors({ ...itemMasterServerErrors, itemCategory: '' });
                    }}
                    placeholder="Enter item category"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {itemMasterServerErrors.itemCategory && (
                    <p className="text-red-500 text-xs mt-1">{itemMasterServerErrors.itemCategory}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={itemMasterModalData.hsnCode}
                    onChange={(e) => {
                      setItemMasterModalData({ ...itemMasterModalData, hsnCode: e.target.value });
                    }}
                    placeholder="Enter HSN Code"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    UOM <span className="text-red-500">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select UOM"
                    options={(Array.isArray(uomList) ? uomList : uomList?.data || []).map((uom: any) => ({
                      value: String(uom.id),
                      label: uom.uomName
                    }))}
                    value={itemMasterModalData.uomId}
                    onValueChange={(val) => {
                      setItemMasterModalData({ ...itemMasterModalData, uomId: val });
                      if (itemMasterServerErrors.uomId) setItemMasterServerErrors({ ...itemMasterServerErrors, uomId: '' });
                    }}
                    error={itemMasterServerErrors.uomId}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    IGST %
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select IGST %"
                    options={gstOptionList.map((opt) => ({
                      value: String(opt.id),
                      label: String(opt.name)
                    }))}
                    value={selectedGstDropdownId}
                    onValueChange={(val) => handleGstChangeInModal(val)}
                    error={itemMasterServerErrors.igst}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CGST %</label>
                  <input
                    type="text"
                    readOnly
                    value={itemMasterModalData.cgst}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    placeholder="CGST %"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SGST %</label>
                  <input
                    type="text"
                    readOnly
                    value={itemMasterModalData.sgst}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    placeholder="SGST %"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemMasterModalData.activeFlag}
                    onChange={(e) => setItemMasterModalData({ ...itemMasterModalData, activeFlag: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsItemMasterModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingItemMaster}
                  className="bg-primary text-white"
                >
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



