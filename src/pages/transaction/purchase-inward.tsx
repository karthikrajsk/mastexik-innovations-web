import React, { useEffect, useMemo, useState, useRef } from "react";
import { FileText, ClipboardList, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { documentNumberService } from "@/services/DocumentNumberService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { toast } from "react-toastify";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllPoTypes, getPendingPurchaseOrdersByVendorId, getPurchaseOrderById, getPurchaseOrdersByVendorId } from "@/state/purchaseOrderSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllKnittedFabricMasters } from "@/state/knittedMasterSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllSubCategories, getSubCategoryByCategory } from "@/state/subCategorySlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { VENDOR_TYPE_ALL, filterVendorsByPoType, parseIds } from "@/utils/vendorFilters";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { LotDetails } from "./lot-details";

// PO TYPE CONSTANTS
const PO_TYPE_YARN = 1;
const PO_TYPE_WOVEN_FABRIC = 2;
const PO_TYPE_KNITTED_FABRIC = 11;
const PO_TYPE_ITEM = 3;

// VENDOR TYPE CONSTANTS
const VENDOR_TYPE_YARN = 301;
const VENDOR_TYPE_ITEM = 305;
const VENDOR_TYPE_FABRIC = 306;

const normalizeYarnStockDetails = (entry: any) => {
  if (!entry) {
    return [];
  }
  const rawDetails = Array.isArray(entry.yarnStockDetails) && entry.yarnStockDetails.length > 0
    ? entry.yarnStockDetails
    : Array.isArray(entry.lotEntries) && entry.lotEntries.length > 0
      ? entry.lotEntries
      : [];

  // Deduplicate by lotNo and id if possible to prevent UI duplication
  const uniqueLotsMap = new Map();
  rawDetails.forEach((lot: any) => {
    const key = lot.id && Number(lot.id) > 0 ? `id-${lot.id}` : `no-${lot.lotNo || lot.lotNumber}`;
    if (!uniqueLotsMap.has(key)) {
      uniqueLotsMap.set(key, lot);
    }
  });

  return Array.from(uniqueLotsMap.values()).map((lot: any) => ({
    id: lot.id ?? "",
    lotNo: lot.lotNo || lot.lotNumber || "",
    inwardQty: Number(lot.inwardQty ?? lot.quantity ?? 0),
    acceptedQty: Number(lot.acceptedQty ?? lot.quantity ?? 0),
    rejectedQty: Number(lot.rejectedQty ?? lot.rejectedQuantity ?? 0),
    inwardBags: Number(lot.inwardBags ?? lot.bags ?? 0),
    kgsPerBag: Number(lot.kgsPerBag ?? lot.kgPerBag ?? 0),
    conesPerBag: Number(lot.conesPerBag ?? lot.cones_per_bag ?? 0),
    conesWeight: Number(lot.conesWeight ?? lot.cones_weight ?? 0),
    remarks: lot.remarks ?? lot.remark ?? "",
    warehouseId: lot.warehouseId ? String(lot.warehouseId) : "",
    itemId: lot.itemId ?? entry.yarnId ?? entry.itemId ?? null,
    uomId: lot.uomId ?? entry.uomId ?? null,
    yarnId: lot.yarnId ?? entry.yarnId ?? null,
    fabricId: lot.fabricId ?? entry.fabricId ?? null,
    orderItemId: lot.orderItemId ?? entry.id ?? null,
    isInspected: lot.isInspected ?? 0,
    yarnTypeId: lot.yarnTypeId ?? entry.yarnTypeId ?? null,
    millId: lot.millId ?? lot.millNameId ?? entry.millId ?? entry.millNameId ?? null,
  }));
};

const normalizeItemStockDetails = (entry: any) => {
  if (!entry) {
    return [];
  }
  const rawDetails = Array.isArray(entry.itemStockDetails) && entry.itemStockDetails.length > 0
    ? entry.itemStockDetails
    : Array.isArray(entry.lotEntries) && entry.lotEntries.length > 0
      ? entry.lotEntries
      : [];

  // Deduplicate by id, lotNo, or index
  const uniqueStockMap = new Map();
  rawDetails.forEach((stock: any, idx: number) => {
    const key = (stock.id && Number(stock.id) > 0)
      ? `id-${stock.id}`
      : (stock.lotNo || stock.lotNumber)
        ? `no-${stock.lotNo || stock.lotNumber}`
        : (stock.rackNo || stock.rack_no)
          ? `rack-${stock.rackNo || stock.rack_no}-${idx}`
          : `idx-${idx}`;
    if (!uniqueStockMap.has(key)) {
      uniqueStockMap.set(key, stock);
    }
  });

  return Array.from(uniqueStockMap.values()).map((stock: any) => ({
    id: stock.id ?? "",
    lotNo: stock.lotNo || stock.lotNumber || "",
    rackNo: stock.rackNo || stock.rack_no || "",
    inwardQty: Number(stock.inwardQty ?? stock.quantity ?? 0),
    acceptedQty: Number(stock.acceptedQty ?? stock.quantity ?? 0),
    rejectedQty: Number(stock.rejectedQty ?? stock.rejectedQuantity ?? 0),
    inwardBags: Number(stock.inwardBags ?? stock.bags ?? 0),
    kgsPerBag: Number(stock.kgsPerBag ?? stock.kgPerBag ?? 0),
    conesPerBag: Number(stock.conesPerBag ?? stock.cones_per_bag ?? 0),
    conesWeight: Number(stock.conesWeight ?? stock.cones_weight ?? 0),
    remark: stock.remark || stock.remarks || "",
    warehouseId: stock.warehouseId ? String(stock.warehouseId) : "",
    itemId: stock.itemId ?? entry.itemId ?? null,
    uomId: stock.uomId ?? entry.uomId ?? null,
    itemInwardItemId: stock.itemInwardItemId ?? entry.id ?? null,
    isInspected: stock.isInspected ?? 0,
    millId: stock.millId ?? stock.millNameId ?? entry.millId ?? entry.millNameId ?? null,
  }));
};

const PurchaseInward = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const purchaseInwardDtl = location.state?.purchaseInwardDtl;
  const [currentFormData, setCurrentFormData] = useState<any>(null);
  const { purchaseOrderTypeList, purchaseOrderListByVendorId, purchaseOrderListById } = useSelector((state: RootState) => state.purchaseOrder);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  const { knittedknittedFabricMasterList } = useSelector((state: RootState) => state.knittedMasters);
  const { subCategoryList, subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { uomList } = useSelector((state: RootState) => state.uom);

  const activePurchaseOrderTypeList = useMemo(() => (purchaseOrderTypeList || []).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [purchaseOrderTypeList]);
  const activeVendorList = useMemo(() => (vendorList || []).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [vendorList]);
  const activeFabricMasterList = useMemo(() => (fabricMasterList || []).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [fabricMasterList]);
  const activeYarnList = useMemo(() => (yarnList || []).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [yarnList]);
  const activeKnittedFabricMasterList = useMemo(() => (knittedknittedFabricMasterList || []).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [knittedknittedFabricMasterList]);
  const activeSubCategoryList = useMemo(() => (subCategoryList || []).filter((x: any) => x.isActive !== false && x.activeFlag !== false), [subCategoryList]);
  const millSubCategories = useMemo(() => {
    const list = Array.isArray(subCategoryByCategoryList) && subCategoryByCategoryList.length > 0
      ? subCategoryByCategoryList
      : subCategoryList || [];
    return list.filter((sc: any) => 
      sc.isActive !== false && 
      sc.activeFlag !== false && 
      (sc.categoryName || '').trim().toLowerCase() === 'mill'
    );
  }, [subCategoryByCategoryList, subCategoryList]);
  const activeUomList = useMemo(() => {
    let list = [];
    if (Array.isArray(uomList)) list = uomList;
    else if (Array.isArray(uomList?.data)) list = uomList.data;
    return list.filter((x: any) => x.isActive !== false && x.activeFlag !== false);
  }, [uomList]);

  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [filteredVendorList, setFilteredVendorList] = useState<any[]>([]);
  const [showLotDetails, setShowLotDetails] = useState<boolean>(!!(purchaseInwardDtl || location.state?.updatedFromLotDetails));
  const lotDetailsRef = useRef<HTMLDivElement | null>(null);

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const { register, watch, setValue, reset, formState: { errors } } = useForm<any>({
    defaultValues: {
      purchaseInwardNo: purchaseInwardDtl?.purchaseInwardNo || 'Loading sequence...'
    }
  });
  const hasGeneratedNumberRef = useRef(false);
  const isSavingRef = useRef(false);
  const isFormInitializedRef = useRef(false);

  useEffect(() => {
    if (purchaseInwardDtl?.purchaseInwardNo) {
      setValue('purchaseInwardNo', purchaseInwardDtl.purchaseInwardNo);
    }
  }, [purchaseInwardDtl, setValue]);

  useEffect(() => {
    const isEditing = !!purchaseInwardDtl;
    const isReturning = !!location.state?.updatedFromLotDetails;

    if (!isEditing && !isReturning && !hasGeneratedNumberRef.current) {
      hasGeneratedNumberRef.current = true;
      const generateNumber = async () => {
        setValue('purchaseInwardNo', 'Loading sequence...');
        try {
          const result = await documentNumberService.generateDocumentNumber({
            screenName: 'Purchase Inward / GRN Details'
          });
          setValue('purchaseInwardNo', result.documentNumber, { shouldValidate: true });
        } catch (error) {
          console.warn('Failed to generate purchase inward number:', error);
          hasGeneratedNumberRef.current = false;
        }
      };
      generateNumber();
    }

    const handleBeforeUnload = () => {
      if (!purchaseInwardDtl?.id && hasGeneratedNumberRef.current && !isSavingRef.current) {
        documentNumberService.clearMemoryCache('Purchase Inward / GRN Details');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!purchaseInwardDtl?.id && hasGeneratedNumberRef.current && !isSavingRef.current) {
        documentNumberService.clearMemoryCache('Purchase Inward / GRN Details');
      }
    };
  }, [purchaseInwardDtl, location.state]);

  const selectedPoTypeId = watch("poTypeId");
  const poTypeName = useMemo(() => {
    const poType = activePurchaseOrderTypeList?.find((pt: any) => String(pt.id) === String(selectedPoTypeId));
    return poType?.poTypeName?.toLowerCase() || "";
  }, [selectedPoTypeId, activePurchaseOrderTypeList]);

  const isYarn = poTypeName.includes("yarn");
  const isFabric = poTypeName.includes("fabric") || poTypeName.includes("knitted") || poTypeName.includes("woven");
  const isItem = poTypeName.includes("item");


  const navigate = useNavigate();
    const [pendingPoNoValue, setPendingPoNoValue] = useState<string | null>(null);


  const getSelectedCompanyId = (): number | null => {
    const storedId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    if (!storedId) return null;
    const parsedId = Number(storedId);
    return Number.isNaN(parsedId) ? null : parsedId;
  };

  useEffect(() => {

    if (location.state?.updatedFromLotDetails && location.state?.updatedSelectedItems) {
      isFormInitializedRef.current = true;
      const updatedItems = location.state.updatedSelectedItems;
      const updatedFormData = location.state.formData;
      // Restore form fields
      if (updatedFormData) {
        // Update currentFormData so it's used in navigateToLotDetails
        setCurrentFormData(updatedFormData);

        const poTypeId = updatedFormData.poTypeId || (updatedItems.length > 0 ? updatedItems[0].poTypeId : "");
        const vendorId = updatedFormData.vendorId || (updatedItems.length > 0 ? updatedItems[0].vendorId : "");
        const poNo = updatedFormData.poNo || updatedFormData.purchaseOrderId || updatedFormData.poId || (updatedItems.length > 0 ? (updatedItems[0].poId || updatedItems[0].purchaseOrderId) : "");

        // Use reset to set all form values at once for better consistency
        reset({
          ...updatedFormData,
          poTypeId: String(poTypeId),
          vendorId: String(vendorId),
          poNo: String(poNo),
          inwardDate: updatedFormData.inwardDate || getCurrentDate(),
          dcDate: updatedFormData.dcDate || getCurrentDate(),
          dcNumber: updatedFormData.dcNumber || "",
          millInvNo: updatedFormData.millInvNo || "",
          millDate: updatedFormData.millDate || "",
          icilInvNo: updatedFormData.icilInvNo || "",
          icilInvDate: updatedFormData.icilInvDate || "",
          remarks: updatedFormData.remarks || updatedFormData.remark || "",
          items: updatedItems.map((item: any) => ({
            ...item,
            quantityReceived: String(item.quantityReceived || ""),
            price: String(item.price || "")
          }))
        });

        if (vendorId) {
          const vId = Number(vendorId);
          setSelectedVendorId(vId);

          dispatch(getPurchaseOrdersByVendorId(vId)).then(() => {
            if (poNo) {
              setValue("poNo", String(poNo));
            }
          });
        }
      }

      // Update selectedItems and filteredItems
      setSelectedItems(updatedItems);
      setIsEditMode(true);

      // Get original filtered items to preserve unselected items
      const originalItems = location.state?.originalFilteredItems || [];
      
      // Update selected items in original filtered items with latest data
      const reconstructedFilteredItems = originalItems.map((originalItem: any) => {
        const updatedSelectedItem = updatedItems.find((updated: any) => 
          updated.id === originalItem.id && updated.poId === originalItem.poId
        );
        
        if (updatedSelectedItem) {
          // This item was selected and updated in lot-details
          return {
            ...originalItem,
            quantityReceived: String(updatedSelectedItem.quantityReceived ?? originalItem.quantityReceived ?? ''),
            price: updatedSelectedItem.price ?? originalItem.price,
            yarnStockDetails: updatedSelectedItem.yarnStockDetails || originalItem.yarnStockDetails,
            pieceEntries: updatedSelectedItem.pieceEntries || originalItem.pieceEntries,
            itemStockDetails: updatedSelectedItem.itemStockDetails || originalItem.itemStockDetails
          };
        } else {
          // This item was not selected, preserve original data
          return {
            ...originalItem,
            quantityReceived: String(originalItem.quantityReceived ?? ''),
            price: originalItem.price || 0,
            quantity: originalItem.orderedQuantity || originalItem.quantity || 0,
            poId: originalItem.poId,
            id: originalItem.id,
            vendorId: originalItem.vendorId,
            poTypeId: originalItem.poTypeId
          };
        }
      });

      setFilteredItems(reconstructedFilteredItems);
    } else if (!location.state?.purchaseInwardDtl) {
      setSelectedItems([]);
    }
  }, [location, reset, dispatch]);

  // Set PO number after PO list is loaded
useEffect(() => {
  if (!pendingPoNoValue) return;
  
  const listData = purchaseOrderListByVendorId?.data || purchaseOrderListByVendorId;
  const hasData = Array.isArray(listData) && listData.length > 0;
  
  if (hasData) {
    // Check if the pending PO exists in the list
    const poExists = listData.find((po: any) => String(po.id) === String(pendingPoNoValue));
        
    if (poExists) {
      setValue("poNo", String(pendingPoNoValue));
      
      // Also fetch the PO details to populate items
      const companyId = getSelectedCompanyId();
      dispatch(getPurchaseOrderById({ 
        id: Number(pendingPoNoValue), 
        companyId: companyId || undefined,
        excludeInwardId: currentFormData?.id 
      }));
      
      setPendingPoNoValue(null); // Clear the pending value
    }
  }
}, [purchaseOrderListByVendorId, pendingPoNoValue, setValue, dispatch]);

  // Handle PO details response to populate filteredItems
useEffect(() => {
  if (purchaseOrderListById?.purchaseOrderItemsDtl) {
    // Skip if we're returning from lot-details to prevent overwriting restored data
    if (location.state?.updatedFromLotDetails) {
      return;
    }
    
    // Check if the purchase order is approved
    if (purchaseOrderListById.isApproved !== 1) {
      // Clear the filtered items if PO is not approved
      setFilteredItems([]);
      // Show toast message if coming from Order Entry Management
      if (location.state?.fromOrderEntry) {
        toast.error(`Purchase Order ${purchaseOrderListById.poNo} is not approved. Please approve the Purchase Order before generating Purchase Inward.`);
      }
      return;
    }
    
    const rawInwardItems = purchaseInwardDtl
      ? (purchaseInwardDtl.items || purchaseInwardDtl.purchaseInwardItemsDtl || [])
      : [];

    const items = purchaseOrderListById.purchaseOrderItemsDtl.map((item: any) => {
      // In edit mode, preserve existing quantityReceived values or populate from purchaseInwardDtl
      const existingItem = filteredItems.find(filteredItem => 
        filteredItem.id === item.id && filteredItem.poId === purchaseOrderListById.id
      );

      const matchingInwardItem = rawInwardItems.find(
        (inwardItem: any) => (inwardItem.poItemId || inwardItem.purchaseOrderItemId) === item.id
      );

      const resolvedQty = (existingItem?.quantityReceived !== undefined && existingItem?.quantityReceived !== '')
        ? existingItem.quantityReceived
        : (matchingInwardItem?.quantityReceived !== undefined && matchingInwardItem?.quantityReceived !== null)
          ? matchingInwardItem.quantityReceived
          : '';

      const resolvedPrice = (existingItem?.price !== undefined && existingItem?.price !== 0 && existingItem?.price !== '')
        ? existingItem.price
        : (matchingInwardItem?.price || item.price || 0);

      return {
        ...item,
        poId: purchaseOrderListById.id,
        poDate: purchaseOrderListById.poDate,
        quantityReceived: resolvedQty,
        receivedQuantityTotal: 0,
        price: resolvedPrice,
        millName: item.millName || getMillNameFromId(item.millNameId),
        orderItemId: item.orderItemId ?? item.id ?? null,
        remarks: matchingInwardItem?.remarks || '',
      };
    });
    setFilteredItems(items);
  }
}, [purchaseOrderListById, location.state?.updatedFromLotDetails, location.state?.fromOrderEntry, purchaseInwardDtl]);

// Check if current purchase order is approved
const isCurrentPOApproved = purchaseOrderListById?.isApproved === 1;

// Restore form values when returning from lot-details via back button
useEffect(() => {
  if (selectedItems.length > 0 && selectedPoTypeId && selectedVendorId) {
    setValue("poTypeId", String(selectedPoTypeId));
    setValue("vendorId", String(selectedVendorId));
    
    // Fetch PO list for the selected vendor
    if (selectedVendorId) {
      const companyId = getSelectedCompanyId();
      dispatch(getPendingPurchaseOrdersByVendorId({ 
        vendorId: selectedVendorId, 
        companyId: companyId || undefined, 
        excludeInwardId: currentFormData?.id 
      }));
    }
  }
}, [selectedItems, selectedPoTypeId, selectedVendorId, dispatch, setValue]);

// Get current date in YYYY-MM-DD format
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};
  
  // Helper function to determine if PO Type is Yarn
  const isYarnPoType = (poTypeId: number | string | null): boolean => {
    const type = activePurchaseOrderTypeList?.find((pt: any) => String(pt.id) === String(poTypeId));
    return type?.poTypeName?.toLowerCase().includes("yarn") || false;
  };

  // Helper function to determine if PO Type is Fabric (Knitted or Woven)
  const isFabricPoType = (poTypeId: number | string | null): boolean => {
    const type = activePurchaseOrderTypeList?.find((pt: any) => String(pt.id) === String(poTypeId));
    const name = type?.poTypeName?.toLowerCase() || "";
    return name.includes("fabric") || name.includes("knitted") || name.includes("woven");
  };

  // Helper function to determine if PO Type is Item
  const isItemPoType = (poTypeId: number | string | null): boolean => {
    const type = activePurchaseOrderTypeList?.find((pt: any) => String(pt.id) === String(poTypeId));
    return type?.poTypeName?.toLowerCase().includes("item") || false;
  };

  // Helper function to get entry type label for button
  const getEntryTypeLabel = (poTypeId: number | string | null): string => {
    if (isYarnPoType(poTypeId)) return "Lots";
    if (isFabricPoType(poTypeId)) return "Pieces";
    if (isItemPoType(poTypeId)) return "Stock Details";
    return "Entries";
  };

  const handleCreateLotDetailsClick = () => {
    if (selectedItems.length === 0) {
      toast.warning("Please select at least one purchase order item");
      return;
    }

    // Validate all selected items have received quantity
    const itemsWithoutQuantity = selectedItems.filter((item: any) => {
      const qty = item.quantityReceived === '' || item.quantityReceived === null || item.quantityReceived === undefined
        ? 0
        : Number(item.quantityReceived);
      return !qty || qty <= 0;
    });

    if (itemsWithoutQuantity.length > 0) {
      toast.warning("Please enter received quantity for all selected items");
      return;
    }

    setShowLotDetails(true);
    setTimeout(() => {
      lotDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Helper function to get mill name from millNameId
  const getMillNameFromId = (millNameId: number | null | undefined): string => {
    if (!millNameId || !activeSubCategoryList) return '';
    const millSubCategory = activeSubCategoryList.find((sc: any) => sc.id === millNameId);
    return millSubCategory?.subCategoryName || '';
  };

  // Helper function to get millNameId from mill name
  const getMillNameIdFromName = (millName: string | null | undefined): number | null => {
    if (!millName || !activeSubCategoryList) return null;
    const millSubCategory = activeSubCategoryList.find((sc: any) => sc.subCategoryName === millName);
    return millSubCategory?.id || null;
  };

  // Helper function to get UOM name from UOM ID
  const getUomNameFromId = (uomId: number | string | null | undefined): string => {
    if (!uomId || !activeUomList) return 'N/A';
    const uom = activeUomList.find((u: any) => u.id === Number(uomId));
    return uom?.uomName || `UOM #${uomId}`;
  };

  useEffect(() => {
    dispatch(getAllVendors({ fetchAll: true } as any));
    dispatch(getAllPoTypes({ fetchAll: true } as any));
    dispatch(getAllFabricMasters({ fetchAll: true } as any));
    dispatch(getAllKnittedFabricMasters({ fetchAll: true } as any));
    dispatch(getAllYarnMasters({ fetchAll: true } as any));
    dispatch(getAllSubCategories({ fetchAll: true } as any));
    dispatch(getSubCategoryByCategory({ categoryName: 'Mill', fetchAll: true } as any));
    dispatch(getAllUomMaster({ fetchAll: true } as any));
    // Set inward date to current date only if not returning from lot details
    if (!location.state?.updatedFromLotDetails) {
      setValue("inwardDate", getCurrentDate());
      setValue("dcDate", getCurrentDate());
    }

    }, [dispatch, location.state?.updatedFromLotDetails]);

  // Auto-select Yarn PO Type when coming from Order Entry Management
  useEffect(() => {
    console.log("Auto-select Yarn check:", {
      fromOrderEntry: location.state?.fromOrderEntry,
      poType: location.state?.poType,
      activePoTypesLength: activePurchaseOrderTypeList?.length,
      selectedPoTypeId
    });
    
    if (location.state?.fromOrderEntry && location.state?.poType === "Yarn" && activePurchaseOrderTypeList?.length > 0) {
      // Find the Yarn PO Type and set it automatically
      const yarnPoType = activePurchaseOrderTypeList.find((pt: any) => 
        pt.poTypeName?.toLowerCase().includes("yarn")
      );
      console.log("Found Yarn PO Type:", yarnPoType);
      
      if (yarnPoType) {
        // Always set the value when coming from Order Entry Management with Yarn type
        setValue("poTypeId", String(yarnPoType.id));
        console.log("Set poTypeId to:", String(yarnPoType.id));
      }
    }
  }, [location.state?.fromOrderEntry, location.state?.poType, activePurchaseOrderTypeList, setValue]);

  // Auto-fetch vendor and PO data when coming from Order Entry Management
  useEffect(() => {
    if (location.state?.fromOrderEntry && location.state?.vendorId && location.state?.purchaseOrderId) {
      console.log("Auto-fetch vendor and PO data:", {
        vendorId: location.state?.vendorId,
        vendorName: location.state?.vendorName,
        purchaseOrderId: location.state?.purchaseOrderId,
        purchaseOrderNo: location.state?.purchaseOrderNo
      });
      
      // Set vendor field
      if (location.state?.vendorId) {
        setValue("vendorId", String(location.state.vendorId));
        setSelectedVendorId(Number(location.state.vendorId));
        
        // Fetch PO list for this vendor
        const companyId = getSelectedCompanyId();
        const vendorPayload = { 
          vendorId: Number(location.state.vendorId), 
          companyId: companyId || undefined, 
          excludeInwardId: currentFormData?.id 
        };
        dispatch(getPendingPurchaseOrdersByVendorId(vendorPayload)).then(() => {
          // Set PO number using the existing pendingPoNoValue mechanism
          if (location.state?.purchaseOrderId) {
            setPendingPoNoValue(String(location.state.purchaseOrderId));
          }
        });
      }
    }
  }, [location.state?.fromOrderEntry, location.state?.vendorId, location.state?.purchaseOrderId, dispatch, setValue, setPendingPoNoValue]);

  // Initialize currentFormData from purchaseInwardDtl on first load (edit mode)

  useEffect(() => {

    if (purchaseInwardDtl && !currentFormData) {

      setCurrentFormData({

        id: purchaseInwardDtl.id || 0,

        purchaseInwardNo: purchaseInwardDtl.purchaseInwardNo || '',

        purchaseInwardItemsDtl: purchaseInwardDtl.purchaseInwardItemsDtl || [],

        inwardDate: purchaseInwardDtl.inwardDate || '',

        dcNumber: purchaseInwardDtl.dcNumber || '',

        dcDate: purchaseInwardDtl.dcDate || '',

        remarks: purchaseInwardDtl.remarks || ''

      });

    }

  }, [purchaseInwardDtl]);

  // Get product name based on PO type
  const getProductName = (item: any, poTypeId?: number | string) => {
    const typeId = poTypeId || selectedPoTypeId;
    if (!typeId) return item.productName || item.itemName || "Select PO Type";

    const type = activePurchaseOrderTypeList?.find((pt: any) => String(pt.id) === String(typeId));
    const name = type?.poTypeName?.toLowerCase() || "";

    try {
      // Yarn
      if (name.includes("yarn")) {
        if (item.yarnCode) return item.yarnCode;
        if (item.yarnName) return item.yarnName;
        if (!activeYarnList || !item.yarnId) return item.productName || "Yarn not specified";
        const yarn = activeYarnList.find((y: any) => y.id === item.yarnId);
        return yarn ? yarn.yarnName : `Yarn #${item.yarnId}`;
      }
      // Fabric
      else if (name.includes("fabric") || name.includes("knitted") || name.includes("woven")) {
        if (item.fabricCode) return item.fabricCode;
        if (item.fabricName) return item.fabricName;

        const fabricId = item.fabricId || item.fabricMasterId;
        if (!fabricId) return item.productName || "Fabric not specified";

        if (name.includes("knitted")) {
          const knittedFabric = activeKnittedFabricMasterList?.find((f: any) => f.id === fabricId);
          return knittedFabric ? knittedFabric.fabricName : `Knitted Fabric #${fabricId}`;
        } else {
          const fabric = activeFabricMasterList?.find((f: any) => f.id === fabricId);
          return fabric ? (fabric.fabricCode || fabric.fabricName) : `Fabric #${fabricId}`;
        }
      }
      // Item
      else if (name.includes("item")) {
        return item.itemName || item.productName || (item.itemId ? `Item #${item.itemId}` : "Item not specified");
      }
    } catch (error) {
      console.error("Error getting product name:", error);
      return item.productName || "Error loading product";
    }

    return item.productName || item.itemName || "Unknown product type";
  };

  // Get GST percentage from master data
  const getGSTPercent = (item: any, poTypeId?: number | string) => {
    // Priority 1: Use gstPercent from the item (PO item) if available
    const itemGst = item.gstPercent ?? item.gst_percent ?? item.gst_percentage;
    if (itemGst !== undefined && itemGst !== null && itemGst !== '') {
      return parseFloat(itemGst);
    }

    // Priority 2: Use combined CGST/SGST or IGST from item if available
    const cgst = parseFloat(item.cgstPercent || item.cgst || 0);
    const sgst = parseFloat(item.sgstPercent || item.sgst || 0);
    const igst = parseFloat(item.igstPercent || item.igst || 0);
    const combinedGst = igst || (cgst + sgst);
    if (combinedGst > 0) return combinedGst;

    const typeId = poTypeId || selectedPoTypeId;
    const type = activePurchaseOrderTypeList?.find((pt: any) => String(pt.id) === String(typeId));
    const name = type?.poTypeName?.toLowerCase() || "";

    try {
      if (name.includes("yarn") && item.yarnId) {
        const yarn = activeYarnList?.find((y: any) => y.id === item.yarnId);
        return yarn?.gstPercent || 0;
      } else if (name.includes("knitted") && item.fabricId) {
        const knittedFabric = activeKnittedFabricMasterList?.find((f: any) => f.id === item.fabricId);
        return (knittedFabric?.cgst || 0) + (knittedFabric?.sgst || 0) || knittedFabric?.igst || 0;
      } else if (name.includes("fabric") && item.fabricMasterId) {
        const fabric = activeFabricMasterList?.find((f: any) => f.id === item.fabricMasterId);
        return (fabric?.cgst || 0) + (fabric?.sgst || 0) || fabric?.igst || 0;
      }
    } catch (error) {
      console.error("Error getting GST:", error);
    }
    return item.gstPercent ? parseFloat(item.gstPercent) : 0;
  };

  const calculateTotalAmount = (quantityReceived: number, pricePerUnit: number) => {
    return (quantityReceived || 0) * (pricePerUnit || 0);
  };

  const calculateGSTAmount = (totalAmount: number, gstPercent: number) => {
    return (totalAmount * gstPercent) / 100;
  };

  const calculateFinalAmount = (totalAmount: number, gstAmount: number) => {
    return totalAmount + gstAmount;
  };

  const calculateBalanceQuantity = (orderedQty: number, receivedQty: number) => {
    return (orderedQty || 0) - (receivedQty || 0);
  };

  const handlePoTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    setValue("poTypeId", value);

    setSelectedVendorId(null);
    setFilteredItems([]);
    setSelectedItems([]);
    setShowLotDetails(false);
    setValue("vendorId", "");
    setValue("poNo", "");
    setValue("poDate", "");
  };

  useEffect(() => {
    // Skip if returning from lot details to avoid overwriting updated state
    if (location.state?.updatedFromLotDetails) {
      return;
    }

    if (isFormInitializedRef.current) {
      return;
    }

    console.log("Selected Po Type Id:", selectedPoTypeId);
    // If we have purchaseInwardDtl, we are in edit mode; otherwise, create mode
    if (purchaseInwardDtl) {
      isFormInitializedRef.current = true;
      const formData = {
        id: purchaseInwardDtl.id ?? "",
        purchaseInwardNo: purchaseInwardDtl.purchaseInwardNo ?? "",
        inwardDate: purchaseInwardDtl.inwardDate
          ? purchaseInwardDtl.inwardDate.slice(0, 10)
          : getCurrentDate(),
        remarks: purchaseInwardDtl.remarks ?? "",
        activeFlag: purchaseInwardDtl.activeFlag ?? true,
        dcNumber: purchaseInwardDtl.dcNumber ? String(purchaseInwardDtl.dcNumber) : "",

        purchaseOrderId: (purchaseInwardDtl.purchaseOrderId || purchaseInwardDtl.poId)
          ? String(purchaseInwardDtl.purchaseOrderId || purchaseInwardDtl.poId)
          : "",
        poTypeId: purchaseInwardDtl.poTypeId ?? "",
        vendorId: purchaseInwardDtl.vendorId ?? "",
        yarnMillId: purchaseInwardDtl.yarnMillId ? String(purchaseInwardDtl.yarnMillId) : "",
        poNo: (purchaseInwardDtl.purchaseOrderId || purchaseInwardDtl.poId) ? String(purchaseInwardDtl.purchaseOrderId || purchaseInwardDtl.poId) : "",
        poDate: "",
        millInvNo: purchaseInwardDtl.millInvNo ?? "",
        millDate: purchaseInwardDtl.millDate ? purchaseInwardDtl.millDate.slice(0, 10) : "",
        icilInvNo: purchaseInwardDtl.icilInvNo ?? "",
        icilInvDate: purchaseInwardDtl.icilInvDate ? purchaseInwardDtl.icilInvDate.slice(0, 10) : "",
        dcDate: purchaseInwardDtl.dcDate
          ? purchaseInwardDtl.dcDate.slice(0, 10)
          : getCurrentDate(),
        items: (purchaseInwardDtl.items || purchaseInwardDtl.purchaseInwardItemsDtl || []).map(
          (item: any) => ({
            id: item.id ?? "",
            quantityReceived: String(item.quantityReceived ?? ""),
            price: String(item.price ?? ""),
            activeFlag: item.activeFlag ?? true,
            purchaseOrderItemId: (item.poItemId || item.purchaseOrderItemId) ?? "",
            yarnId: item.yarnId ?? "",
            fabricId: item.fabricId ?? "",
            orderItemId: item.orderItemId ?? item.id ?? null,
            yarnStockDetails: normalizeYarnStockDetails(item),
            pieceEntries: Array.isArray(item.pieceEntries)
              ? item.pieceEntries.map((piece: any) => ({
                id: piece.id ?? "",
                pieceNumber: piece.pieceNumber ?? "",
                quantity: String(piece.quantity ?? ""),
                weight: String(piece.weight ?? ""),
                cost: String(piece.cost ?? ""),
                remarks: piece.remarks ?? "",
                activeFlag: piece.activeFlag ?? true,
                fabricId: piece.fabricId ?? "",
                fabricMasterId: piece.fabricMasterId ?? "",
                warehouseId: piece.warehouseId ?? "",
                inspectionStatus: piece.inspectionStatus ?? "",
                sourceType: piece.sourceType ?? "",
                poType: piece.poType ?? "",
              }))
              : [],
            itemStockDetails: normalizeItemStockDetails(item),
          })
        ),
      };
      console.log("Form Data to Reset:", formData);
      reset(formData);
    } else if (!isFormInitializedRef.current) {
      isFormInitializedRef.current = true;
      if (location.state?.fromOrderEntry && location.state?.poType === "Yarn" && activePurchaseOrderTypeList?.length > 0) {
        const yarnPoType = activePurchaseOrderTypeList.find((pt: any) => 
          pt.poTypeName?.toLowerCase().includes("yarn")
        );
        if (yarnPoType) {
          setValue("poTypeId", String(yarnPoType.id));
        }
      }
    }

    if (purchaseInwardDtl) {
      setIsEditMode(true);
      setValue("poTypeId", purchaseInwardDtl.poTypeId);
      setSelectedVendorId(purchaseInwardDtl.vendorId);

      const activeCompanyId = getSelectedCompanyId();

      // Fetch PO lists
      const targetPoId = purchaseInwardDtl.purchaseOrderId || purchaseInwardDtl.poId;
      if (targetPoId) {
        const vendorId = Number(purchaseInwardDtl.vendorId);
        if (!Number.isNaN(vendorId)) {
          const vendorPayload = activeCompanyId
            ? { vendorId, companyId: activeCompanyId }
            : vendorId;
          dispatch(getPurchaseOrdersByVendorId(vendorPayload));
        }

        const strPoId = String(targetPoId);
        setValue("poNo", strPoId);
        setPendingPoNoValue(strPoId);
        const poId = Number(targetPoId);
        if (!Number.isNaN(poId)) {
            dispatch(getPurchaseOrdersByVendorId(purchaseInwardDtl.vendorId));
        setPendingPoNoValue(String(poId));
          const poPayload = { 
            id: poId, 
            companyId: activeCompanyId || undefined, 
            excludeInwardId: purchaseInwardDtl.id 
          };
          dispatch(getPurchaseOrderById(poPayload)).then((result) => {
            const po = result?.payload;
            if (po?.purchaseOrderItemsDtl) {
              setValue("poDate", po.poDate ? po.poDate.slice(0, 10) : "");

              // Skip if we're returning from lot-details to prevent overwriting restored data
              if (location.state?.updatedFromLotDetails) {
                return;
              }

              const items = po.purchaseOrderItemsDtl.map((item: any) => {
                // Check if we already have this item in filteredItems with quantityReceived
                const existingItem = filteredItems.find(filteredItem => 
                  filteredItem.id === item.id && filteredItem.poId === po.id
                );
                
                return {
                  ...item,
                  poId: po.id,
                  poDate: po.poDate,
                  quantityReceived: existingItem?.quantityReceived ?? '',
                  price: item.price || 0,
                  millName: item.millName || getMillNameFromId(item.millNameId),
                  orderItemId: item.orderItemId ?? item.id ?? null,
                  remarks: '',
                };
              });
              setFilteredItems(items);

              const rawInwardItems = (purchaseInwardDtl.items || purchaseInwardDtl.purchaseInwardItemsDtl || []);
              const uniqueInwardItemsMap = new Map();
              rawInwardItems.forEach((inwardItem: any) => {
                const key = inwardItem.poItemId || inwardItem.purchaseOrderItemId || inwardItem.id;
                if (key && !uniqueInwardItemsMap.has(String(key))) {
                  uniqueInwardItemsMap.set(String(key), inwardItem);
                }
              });

              const enrichedSelectedItems = Array.from(uniqueInwardItemsMap.values())
                .map((inwardItem: any) => {
                  const matchingPoItem = items.find(
                    (poItem: any) => poItem.id === (inwardItem.poItemId || inwardItem.purchaseOrderItemId)
                  );
                  if (!matchingPoItem) return null;

                  const firstYarnStock = inwardItem.yarnStockDetails?.[0];
                  const firstPiece = inwardItem.pieceEntries?.[0];

                  const yarnId = inwardItem.yarnId || firstYarnStock?.yarnId || matchingPoItem.yarnId;
                  const fabricId =
                    inwardItem.fabricId || firstYarnStock?.fabricId || firstPiece?.fabricId || matchingPoItem.fabricId;
                  const fabricMasterId =
                    inwardItem.fabricMasterId || firstPiece?.fabricMasterId || firstYarnStock?.fabricMasterId || matchingPoItem.fabricMasterId;

                  const enrichedPieceEntries = (inwardItem.pieceEntries || []).map((piece: any) => ({
                    ...piece,
                    fabricMasterId: piece.fabricMasterId || fabricMasterId,
                  }));

                  return {
                    ...matchingPoItem,
                    id: matchingPoItem.id,
                    poItemId: matchingPoItem.id,
                    purchaseOrderItemId: matchingPoItem.id,
                    inwardItemId: inwardItem.id,
                    poId: po.id,
                    vendorId: purchaseInwardDtl.vendorId,
                    poTypeId: purchaseInwardDtl.poTypeId,
                    poTypeName:
                      purchaseOrderTypeList?.find((pt: any) => pt.id === purchaseInwardDtl.poTypeId)?.poTypeName ||
                      "Unknown",
                    productName: getProductName(matchingPoItem, purchaseInwardDtl.poTypeId),
                    gstPercent: getGSTPercent(matchingPoItem, purchaseInwardDtl.poTypeId),
                    quantityReceived: inwardItem.quantityReceived ?? 0,
                    orderedQuantity: parseFloat(matchingPoItem.quantity || 0),
                    price: parseFloat(inwardItem.price || matchingPoItem.price || 0),
                    yarnId,
                    fabricId,
                    fabricMasterId,
                    orderItemId: inwardItem.orderItemId ?? matchingPoItem.orderItemId ?? matchingPoItem.id ?? null,
                    unit: matchingPoItem.unit,
                    yarnStockDetails: normalizeYarnStockDetails({ ...inwardItem, yarnTypeId: matchingPoItem.yarnTypeId }),
                    pieceEntries: enrichedPieceEntries,
                    itemStockDetails: normalizeItemStockDetails(inwardItem),
                    remarks: inwardItem.remarks || '',
                  };
                })
                .filter(Boolean);

              setSelectedItems(enrichedSelectedItems);

              // Update filteredItems quantities for edit mode
              const updatedFilteredItems = items.map((filteredItem: any) => {
                const inwardItem = enrichedSelectedItems.find((sel: any) => sel.id === filteredItem.id);
                return {
                  ...filteredItem,
                  quantityReceived: inwardItem?.quantityReceived ?? filteredItem.quantityReceived ?? '',
                  price: inwardItem?.price || filteredItem.price || 0,
                };
              });
              setFilteredItems(updatedFilteredItems);

              updatedFilteredItems.forEach((item: any, index: number) => {
                setValue(`items.${index}.quantityReceived`, item.quantityReceived.toString());
                setValue(`items.${index}.price`, item.price.toString());
              });
            }
          });
        }
      }
    }
  }, [
    purchaseInwardDtl,
    reset,
    dispatch,
    purchaseOrderTypeList,
    yarnList,
    fabricMasterList,
    knittedknittedFabricMasterList,
    location.state,
    activePurchaseOrderTypeList,
  ]);

  // Filter vendors based on selected PO Type
  useEffect(() => {
    if (!selectedPoTypeId || !vendorList) {
      setFilteredVendorList([]);
      return;
    }

    let targetVendorTypeId: number | null = null;
    if (isYarn) targetVendorTypeId = VENDOR_TYPE_YARN;
    else if (isFabric) targetVendorTypeId = VENDOR_TYPE_FABRIC;
    else if (isItem) targetVendorTypeId = VENDOR_TYPE_ITEM;

    const filtered = vendorList.filter((vendor: any) => {
      // Parse comma-separated vendor type IDs into array
      const vendorTypeIds = parseIds(vendor.vendorTypeId);
      
      // Check if target vendor type ID or VENDOR_TYPE_ALL is present in the array
      const hasTargetType = targetVendorTypeId ? vendorTypeIds.includes(String(targetVendorTypeId)) : false;
      const hasAllType = vendorTypeIds.includes(String(VENDOR_TYPE_ALL));
      
      return hasTargetType || hasAllType;
    });

    setFilteredVendorList(filtered);
  }, [selectedPoTypeId, isYarn, isFabric, isItem, vendorList]);
  //   }

  //   const poType = purchaseOrderTypeList.find((pt: any) => pt.id === selectedPoTypeId);
  //   if (!poType) {
  //     setFilteredVendorList([]);
  //     return;
  //   }

  //   const poName = (poType.poTypeName || "").toLowerCase();

  //   const matches = (vt: string) => {
  //     const t = (vt || "").toLowerCase();
  //     if (!t) return false;
  //     if (poName.includes("yarn")) return t.includes("yarn");
  //     if (poName.includes("knit")) return t.includes("knit");
  //     if (poName.includes("woven")) return t.includes("woven");
  //     if (poName.includes("process")) return t.includes("process");
  //     return false;
  //   };

  //   const filtered = Array.isArray(vendorList)
  //     ? vendorList.filter((v: any) => matches(v?.vendorType || ""))
  //     : [];

  //   setFilteredVendorList(filtered);
  // }, [selectedPoTypeId, purchaseOrderTypeList, vendorList]);

  const handleVendorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? parseInt(e.target.value) : null;
    setSelectedVendorId(id);

    setFilteredItems([]);
    setSelectedItems([]);
    setShowLotDetails(false);
    setValue("poNo", "");
    setValue("poDate", "");

    if (id) {
      try {
        const companyId = getSelectedCompanyId();

        const payload = { 
          vendorId: id, 
          companyId: companyId || undefined, 
          excludeInwardId: currentFormData?.id 
        };
              await dispatch(getPendingPurchaseOrdersByVendorId(payload));
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
      }
    }
  };

  const handlePONumberChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    
    const poId = parseInt(e.target.value);
    setFilteredItems([]);
    setSelectedItems([]);
    setShowLotDetails(false);

    if (poId) {
      try {
        const companyId = getSelectedCompanyId();
        const payload = { 
          id: poId, 
          companyId: companyId || undefined, 
          excludeInwardId: currentFormData?.id 
        };
        const result = await dispatch(getPurchaseOrderById(payload));
        const po = result?.payload;
        if (po?.purchaseOrderItemsDtl) {
          // Skip if we're returning from lot-details to prevent overwriting restored data
          if (location.state?.updatedFromLotDetails) {
            return;
          }
          
          const items = po.purchaseOrderItemsDtl.map((item: any) => {
            // In edit mode, preserve existing quantityReceived values
            const existingItem = filteredItems.find(filteredItem => 
              filteredItem.id === item.id && filteredItem.poId === po.id
            );
            
            return {
              ...item,
              poId: po.id,
              poDate: po.poDate,
              quantityReceived: existingItem?.quantityReceived ?? '',
              receivedQuantityTotal: 0,
              price: item.price || 0,
              millName: item.millName || getMillNameFromId(item.millNameId),
              orderItemId: item.orderItemId ?? item.id ?? null,
              remarks: '',
            };
          });
          setFilteredItems(items);
        }
      } catch (error) {
        console.error("Error fetching PO by ID:", error);
      }
    }
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const targetItem = filteredItems[index];
    const updatedItems = filteredItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return { ...item };
    });
    setFilteredItems(updatedItems);

    if (targetItem) {
      setSelectedItems((prev: any[]) =>
        prev.map((sel: any) => {
          if (sel.id === targetItem.id && sel.poId === targetItem.poId) {
            return { ...sel, [field]: value };
          }
          return sel;
        })
      );
    }

    if (field === "quantityReceived") {
      const item = filteredItems[index];
      const orderedQty = parseFloat(item.quantity || item.orderedQuantity || 0);
      const prevReceived = parseFloat(item.receivedQuantity || item.receivedQuantityTotal || 0);
      const pendingQty = orderedQty - prevReceived;
      const enteredQty = parseFloat(value) || 0;
      const balanceQty = pendingQty - enteredQty;
      if (enteredQty > 0 && balanceQty < 0) {
        toast.error(`Your remaining quantity is ${pendingQty} but entered ${enteredQty}.`);
      }
    }
  };

  const handleItemSelect = (item: any) => {
    if (!selectedPoTypeId) {
      console.error('No PO type selected');
      return;
    }

    if (!purchaseOrderTypeList?.length) {
      console.error('Purchase order type list not loaded');
      return;
    }

    try {
      const poTypeId = Number(selectedPoTypeId);
      const selectedPoType = purchaseOrderTypeList.find(
        (poType: any) => Number(poType.id) === poTypeId
      );

      // Check if item is already selected
      const isAlreadySelected = selectedItems.some((selected: any) =>
        selected.id === item.id && selected.poId === item.poId
      );

      if (isAlreadySelected) {
        // Unselect the item
        setSelectedItems((prev: any) =>
          prev.filter((selected: any) =>
            !(selected.id === item.id && selected.poId === item.poId)
          )
        );
        return;
      }

      // Get the current quantityReceived from filteredItems (which has the latest input value)
      const currentItem = filteredItems.find((filteredItem: any) =>
        filteredItem.id === item.id && filteredItem.poId === item.poId
      );

      const quantitySource = currentItem?.quantityReceived ?? item.quantityReceived ?? '';
      const currentQuantityReceived = quantitySource === '' || quantitySource === null || quantitySource === undefined
        ? 0
        : parseFloat(quantitySource);

      if (!currentQuantityReceived || currentQuantityReceived <= 0) {
        alert("Please enter a valid received quantity before selecting the item");
        return;
      }
      // In edit mode, try to find previously selected item to preserve lot entries

      let previouslySelectedItem = null;

      if (purchaseInwardDtl) {

        const enrichedItem = (purchaseInwardDtl.purchaseInwardItemsDtl || []).find(

          (inwardItem: any) => inwardItem.poItemId === item.id || inwardItem.purchaseOrderItemId === item.id

        );

        if (enrichedItem) {

          previouslySelectedItem = enrichedItem;

        }

      }
      const preservedYarnStocks = normalizeYarnStockDetails(previouslySelectedItem);
      const fallbackYarnStocks = preservedYarnStocks.length > 0 ? preservedYarnStocks : normalizeYarnStockDetails(item);

      const preservedItemStocks = normalizeItemStockDetails(previouslySelectedItem);
      const fallbackItemStocks = preservedItemStocks.length > 0 ? preservedItemStocks : normalizeItemStockDetails(item);

      const itemWithDetails = {
        ...item,
        vendorId: selectedVendorId,
        poTypeId: poTypeId,
        poTypeName: selectedPoType?.poTypeName || `Unknown (ID: ${poTypeId})`,
        yarnId: item.yarnId,
        fabricId: item.fabricId,
        fabricMasterId: item.fabricMasterId,
        orderItemId: item.orderItemId ?? item.id ?? null,
        productName: getProductName(item),
        gstPercent: getGSTPercent(item),
        quantityReceived: currentQuantityReceived,
        orderedQuantity: parseFloat(item.quantity || 0),
        price: parseFloat(item.price || 0),
        millName: item.millName || getMillNameFromId(item.millNameId) || '',
        millNameId: item.millNameId || getMillNameIdFromName(item.millName) || null,
        yarnStockDetails: fallbackYarnStocks,
        pieceEntries: previouslySelectedItem?.pieceEntries || item.pieceEntries || [],
        itemStockDetails: fallbackItemStocks,
        remarks: previouslySelectedItem?.remarks || ''
      };

      const currentItems = watch("items") || [];
      setValue("items", [...currentItems, itemWithDetails]);

      setSelectedItems((prev: any) => [...prev, itemWithDetails]);
    } catch (error) {
      console.error('Selection error:', error);
    }
  };

  const navigateToLotDetails = () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

     // Validate all selected items have received quantity and do not exceed remaining quantity
    const invalidItems = selectedItems.map((item: any) => {
      const latestFilteredItem = filteredItems.find(
        (fi: any) => fi.id === item.id && fi.poId === item.poId
      );

      
      const inwardQty = parseFloat(latestFilteredItem?.quantityReceived || item.quantityReceived || 0);
      const orderedQty = parseFloat(latestFilteredItem?.quantity || item.quantity || latestFilteredItem?.orderedQuantity || item.orderedQuantity || 0);
      const prevReceived = parseFloat(latestFilteredItem?.receivedQuantity || item.receivedQuantity || latestFilteredItem?.receivedQuantityTotal || item.receivedQuantityTotal || 0);
      const pendingQty = orderedQty - prevReceived;
      
      return { 
        ...item, 
        inwardQty, 
        pendingQty,
        exceeds: inwardQty > pendingQty,
        missing: inwardQty <= 0
      };
    });
      
 const itemsExceeding = invalidItems.filter(item => item.exceeds);
    if (itemsExceeding.length > 0) {
      alert(`Entered quantity for some items exceeds the remaining Purchase Order quantity.\n\n${itemsExceeding.map(item => `${item.productName || getProductName(item)}: Entering ${item.inwardQty.toFixed(2)}, Remaining ${item.pendingQty.toFixed(2)}`).join('\n')}`);
      return;
    }

    // Validate all selected items have received quantity
    const itemsWithoutQuantity = selectedItems.filter((item: any) => {
      const qty = item.quantityReceived === '' || item.quantityReceived === null || item.quantityReceived === undefined
        ? 0
        : Number(item.quantityReceived);
      return !qty || qty <= 0;
    });

    if (itemsWithoutQuantity.length > 0) {
      alert("Please enter received quantity for all selected items");
      return;
    }

    // Determine entry type based on PO Type
    let entryType: string;
    if (isYarnPoType(selectedPoTypeId)) {
      entryType = 'lot';
    } else if (isItemPoType(selectedPoTypeId)) {
      entryType = 'item';
    } else {
      entryType = location.state?.entryType || 'piece';
    }

    // ✅ Read form data using watch
    const formInwardDate = watch("inwardDate") || null;
    const formDcNumber = watch("dcNumber") || "";
    const formDcDate = watch("dcDate") || null;
    const formRemarks = watch("remarks") || "";
    const formPoTypeId = watch("poTypeId") || "";
    const formVendorId = watch("vendorId") || "";
    const formPoNo = watch("poNo") || "";
    const formYarnMillId = watch("yarnMillId") || "";
    const poListData = purchaseOrderListByVendorId?.data || purchaseOrderListByVendorId || [];
    const resolvedPoNumber = Array.isArray(poListData)
      ? (poListData.find((po: any) => String(po.id) === String(formPoNo))?.poNo || formPoNo)
      : formPoNo;
    const formPoDate = watch("poDate") || "";
    const formPurchaseInwardNo = watch("purchaseInwardNo") || "";
    const formMillInvNo = watch("millInvNo") || "";
    const formMillDate = watch("millDate") || null;
    const formIcilInvNo = watch("icilInvNo") || "";
    const formIcilInvDate = watch("icilInvDate") || null;

    // Create a clean copy of selected items with only necessary data
    // Create a clean copy of selected items with latest values from filteredItems

    const itemsForDetails = selectedItems.map((item: any) => {

      // Get latest values from filteredItems for this selected item

      const latestFilteredItem = filteredItems.find(

        (fi: any) => fi.id === item.id && fi.poId === item.poId

      );



      const latestQuantityReceivedRaw = latestFilteredItem?.quantityReceived ?? item.quantityReceived ?? '';
      const normalizedQuantityReceived = latestQuantityReceivedRaw === '' || latestQuantityReceivedRaw === null || latestQuantityReceivedRaw === undefined
        ? 0
        : Number(latestQuantityReceivedRaw);
      
      const latestPrice = latestFilteredItem?.price ?? item.price;

      const itemOrderedQty = parseFloat(latestFilteredItem?.quantity || latestFilteredItem?.orderedQuantity || item.quantity || item.orderedQuantity || 0);
      const itemPrevReceived = parseFloat(latestFilteredItem?.receivedQuantity || latestFilteredItem?.receivedQuantityTotal || item.receivedQuantity || item.receivedQuantityTotal || 0);
      const itemPendingQty = itemOrderedQty - itemPrevReceived;
      const itemBalanceQty = itemPendingQty - normalizedQuantityReceived;

      return {
        id: item.id,
        poId: item.poId,
        vendorId: item.vendorId,
        poTypeId: item.poTypeId,
        poTypeName: item.poTypeName,
        productName: item.productName,
        quantityReceived: String(latestQuantityReceivedRaw),
        balanceQty: itemBalanceQty,
        
        orderedQuantity: item.orderedQuantity,

        price: latestPrice,

        yarnId: item.yarnId,

        yarnTypeId: item.yarnTypeId,

        fabricId: item.fabricId,

        fabricMasterId: item.fabricMasterId,

        fabricTypeId: item.fabricTypeId || 0,

        orderItemId: item.orderItemId ?? item.id ?? null,

        gstPercent: item.gstPercent,

        unit: item.unit,

        millName: item.millName || getMillNameFromId(item.millNameId) || '',

        millNameId: item.millNameId || getMillNameIdFromName(item.millName) || null,

        entryType: entryType,

        yarnStockDetails: normalizeYarnStockDetails(item),

        pieceEntries: item.pieceEntries || [],

        itemStockDetails: normalizeItemStockDetails(item),

        inwardDate: formInwardDate,

        dcNumber: formDcNumber,

        dcDate: formDcDate,

        remarks: item.remarks || ''

      };

    });


    console.log("Sending to Details Page:", itemsForDetails);
    const formDataToPass = currentFormData || purchaseInwardDtl;

    const originalItemsDtl = formDataToPass?.purchaseInwardItemsDtl || (purchaseInwardDtl?.purchaseInwardItemsDtl || []);
    isSavingRef.current = true;
    navigate("/transaction/lot-details", {
      state: {
        selectedItems: itemsForDetails,
        originalFilteredItems: filteredItems,
        entryType: entryType,
        isEditMode: !!(purchaseInwardDtl || (currentFormData?.id && currentFormData.id > 0)),
        purchaseInwardDtl: purchaseInwardDtl,
        // Pass Order Entry Management context if available
        fromOrderEntry: location.state?.fromOrderEntry || false,
        expandedRowId: location.state?.expandedRowId || null,
        activeTab: location.state?.activeTab || null,
        salesOrderId: location.state?.salesOrderId || null,
        flowType: location.state?.flowType || null,
        selectedHyperlink: location.state?.selectedHyperlink || null,
        formData: {

          id: formDataToPass?.id || 0,

          purchaseInwardNo: formPurchaseInwardNo || formDataToPass?.purchaseInwardNo || '',

          purchaseInwardItemsDtl: originalItemsDtl.map((originalItem: any, index: number) => {

            const editedItem = itemsForDetails[index];

            return {

              id: originalItem.id,

              inwardId: originalItem.inwardId,

              poItemId: originalItem.poItemId,

              quantityReceived: editedItem?.quantityReceived ?? originalItem.quantityReceived,

              price: editedItem?.price ?? originalItem.price,

              // Calculate and include the amount fields
              totalAmount: calculateTotalAmount(
                parseFloat(editedItem?.quantityReceived ?? originalItem.quantityReceived ?? 0),
                parseFloat(editedItem?.price ?? originalItem.price ?? 0)
              ),
              gstAmount: calculateGSTAmount(
                calculateTotalAmount(
                  parseFloat(editedItem?.quantityReceived ?? originalItem.quantityReceived ?? 0),
                  parseFloat(editedItem?.price ?? originalItem.price ?? 0)
                ),
                getGSTPercent(editedItem || originalItem)
              ),
              finalAmount: calculateFinalAmount(
                calculateTotalAmount(
                  parseFloat(editedItem?.quantityReceived ?? originalItem.quantityReceived ?? 0),
                  parseFloat(editedItem?.price ?? originalItem.price ?? 0)
                ),
                calculateGSTAmount(
                  calculateTotalAmount(
                    parseFloat(editedItem?.quantityReceived ?? originalItem.quantityReceived ?? 0),
                    parseFloat(editedItem?.price ?? originalItem.price ?? 0)
                  ),
                  getGSTPercent(editedItem || originalItem)
                )
              ),

              yarnStockDetails: normalizeYarnStockDetails(originalItem),

              pieceEntries: originalItem.pieceEntries,

              itemStockDetails: normalizeItemStockDetails(originalItem)

            };

          }),

          inwardDate: formInwardDate,

          dcNumber: formDcNumber,

          dcDate: formDcDate,

          remarks: formRemarks,

          remark: formRemarks,

          poTypeId: formPoTypeId,

          vendorId: formVendorId,
          yarnMillId: formYarnMillId,
          poNo: formPoNo,

          poNumber: resolvedPoNumber,

          poDate: formPoDate,

          millInvNo: formMillInvNo,

          millDate: formMillDate,

          icilInvNo: formIcilInvNo,

          icilInvDate: formIcilInvDate

        }

      }

    });

  };

  return (
    <div>
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/purchase-inward-details")}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              {isEditMode ? 'Edit Purchase Inward / GRN Details' : 'Purchase Inward / GRN Details'}
            </h2>
          </div>
        </div>

        <div className="space-y-6 mt-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} /> Purchase Inward / GRN Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-5 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700">Inward/GRN Details</label>
                <input
                  type="text"
                  className={`w-full border px-3 py-2 rounded transition-all duration-200 mt-1 ${
                    !watch('purchaseInwardNo') || watch('purchaseInwardNo')?.startsWith('Loading')
                      ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                      : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                  }`}
                  placeholder="Loading sequence..."
                  {...register('purchaseInwardNo')}
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">Inward / GRN Date <span className="text-red-600">*</span></label>
                <input
                  {...register("inwardDate", { required: "Inward / GRN Date is required" })}
                  type="date"
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Purchase Order Type <span className="text-red-500">*</span></label>
                <CommonSearchableSelect
                  {...register("poTypeId", { required: "PO Type is required" })}
                  value={selectedPoTypeId || ""}
                  options={activePurchaseOrderTypeList?.map((poType: any) => ({
                    value: String(poType.id),
                    label: poType.poTypeName,
                  })) || []}
                  placeholder="Select a PO Type"
                  className="mt-1"
                onChange={(e: any) => {
                    const value = e.target?.value || e;
                    handlePoTypeChange({ target: { value } } as any);
                  }}
                  error={errors.poTypeId?.message as string}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Supplier/Vendor <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  {...register("vendorId", { required: "Vendor is required" })}
                  options={filteredVendorList?.map((vendor: any) => ({
                    value: String(vendor.id),
                    label: vendor.vendorName,
                  })) || []}
                  placeholder="Select a Vendor"
                  className="mt-1"
                  value={selectedVendorId || ""}
                  onChange={(e: any) => {
                    const value = e.target?.value || e;
                    handleVendorChange({ target: { value } } as any);
                  }}
                  disabled={!selectedPoTypeId}
                  error={errors.vendorId?.message as string}
                />
              </div>

              {isYarn && (
                <div>
                  <label className="block text-sm font-medium">Yarn Mill Name</label>
                  <CommonSearchableSelect
                    {...register("yarnMillId")}
                    options={millSubCategories?.map((sc: any) => ({
                      value: String(sc.id),
                      label: sc.subCategoryName,
                    })) || []}
                    placeholder="Select Yarn Mill"
                    className="mt-1"
                    value={watch("yarnMillId") || ""}
                    onValueChange={(value) => {
                      setValue("yarnMillId", value, { shouldValidate: true });
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium">Select Purchase Order <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  {...register("poNo", { required: "Purchase Order is required" })}
                  options={(() => {
                    const rawList = purchaseOrderListByVendorId?.data || (Array.isArray(purchaseOrderListByVendorId) ? purchaseOrderListByVendorId : []);
                    const poList = Array.isArray(rawList) ? rawList : [];

                    const filtered = poList
                      .filter((po: any) =>
                        po.poNo !== null &&
                        po.poNo !== undefined &&
                        (!selectedPoTypeId || String(po.poTypeId) === String(selectedPoTypeId)) &&
                        (po.isApproved === 1 || po.isApproved === undefined)
                      )
                      .map((po: any) => ({
                        value: String(po.id),
                        label: po.poNo || `PO-${po.id}`,
                        activeFlag: po.activeFlag ?? true,
                      }));

                    const currentPoId = watch("poNo");
                    if (currentPoId && !filtered.some((po: any) => String(po.value) === String(currentPoId))) {
                      const fallbackLabel = purchaseInwardDtl?.purchaseOrderNo || currentFormData?.poNumber || currentFormData?.poNo || `PO-${currentPoId}`;
                      filtered.push({
                        value: String(currentPoId),
                        label: String(fallbackLabel),
                        activeFlag: true,
                      });
                    }

                    return filtered;
                  })()}
                  filterActive
                  placeholder={selectedVendorId ? "Select a Purchase Order" : "Select a vendor first"}
                  className="mt-1"
                  value={watch("poNo") || ""}
                  onValueChange={(value) => {
                    setValue("poNo", value, { shouldValidate: true });
                    handlePONumberChange({ target: { value } } as any);
                  }}
                  disabled={!selectedVendorId}
                  error={errors.poNo?.message as string}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">DC Number</label>
                <input {...register("dcNumber")} type="text" placeholder="Enter DC Number" className="input mt-1" />

              </div>

              {/* New DC Date Field */}
              <div>
                <label className="block text-sm font-medium">DC Date</label>
                <input
                  {...register("dcDate")}
                  type="date"
                  className="input mt-1"
                />
              </div>
          
              {!isItem && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Yarn Mill Inv. No</label>
                    <input {...register("millInvNo")} type="text" placeholder="Enter Yarn Mill Inv. No" className="input mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Yarn Mill Date</label>
                    <input {...register("millDate")} type="date" className="input mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">ICIL Inv. No</label>
                    <input {...register("icilInvNo")} type="text" placeholder="Enter ICIL Inv. No" className="input mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">ICIL Inv. Date</label>
                    <input {...register("icilInvDate")} type="date" className="input mt-1" />
                  </div>
                </>
              )}
    <div className="col-span-1">
                <label className="block text-sm font-medium text-secondary-700">Remarks</label>
                <input placeholder="Remarks" {...register("remarks")} className="input mt-1" />
              </div>


            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={20} /> Purchase Order Item Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 && (
                <p className="text-gray-500 text-center py-4">No items to display. Please select a purchase order.</p>
              )}

              {filteredItems.length > 0 && (
                <>
                  <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-xs">Select</th>
                        <th className="border p-2 text-xs">Sl.No</th>
                        <th className="border p-2 text-xs">Product Name</th>
                        {selectedPoTypeId == PO_TYPE_YARN && <th className="border p-2 text-xs">Yarn Type</th>}
                        {String(selectedPoTypeId) !== String(PO_TYPE_ITEM) && String(selectedPoTypeId) !== String(PO_TYPE_WOVEN_FABRIC) && <th className="border p-2 text-xs">Mill Name</th>}
                        <th className="border p-2 text-xs">Unit (UOM)</th>
                        <th className="border p-2 text-xs">Ordered Qty</th>
                        <th className="border p-2 text-xs">Prev. Received</th>
                        <th className="border p-2 text-xs">Pending Qty</th>
                        <th className="border p-2 text-xs">Received Qty</th>
                        <th className="border p-2 text-xs">Balance Qty</th>
                        <th className="border p-2 text-xs">Price/Unit</th>
                        <th className="border p-2 text-xs">Total Amount</th>
                        <th className="border p-2 text-xs">GST %</th>
                        <th className="border p-2 text-xs">GST Amount</th>
                        <th className="border p-2 text-xs">Final Amount</th>


                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item: any, index: number) => {
                        const receivedQty = item.quantityReceived === '' || item.quantityReceived === null || item.quantityReceived === undefined
                          ? 0
                          : parseFloat(item.quantityReceived);
                        const pricePerUnit = parseFloat(item.price || 0);
                        const orderedQty = parseFloat(item.quantity || item.orderedQuantity || 0);
                        const gstPercent = getGSTPercent(item);
                        const prevReceived = parseFloat(item.receivedQuantity || item.receivedQuantityTotal || 0);
                        const orderedQtyTotal = parseFloat(item.quantity || item.orderedQuantity || 0);
                        const pendingQty = orderedQtyTotal - prevReceived;
                        const balanceQty = pendingQty - receivedQty;
                        const totalAmount = calculateTotalAmount(receivedQty, pricePerUnit);
                        const gstAmount = calculateGSTAmount(totalAmount, gstPercent);
                        const finalAmount = calculateFinalAmount(totalAmount, gstAmount);

                        return (
                          <tr key={`${item.poId}-${item.id}`} className="border hover:bg-gray-50">
                            <td className="border p-2 text-center">
                              <input
                                type="checkbox"
                                onChange={() => handleItemSelect(item)}
                                checked={selectedItems.some((selected: any) =>
                                  selected.id === item.id && selected.poId === item.poId
                                )}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="border p-2 text-center">{index + 1}</td>
                            <td className="border p-2 text-xs">{getProductName(item)}</td>
                            {selectedPoTypeId == PO_TYPE_YARN && (
                              <td className="border p-2 text-center text-xs">
                                {String(item.yarnTypeId) === "1" ? "Warp" : String(item.yarnTypeId) === "2" ? "Weft" : "Both"}
                              </td>
                            )}
                            {String(selectedPoTypeId) !== String(PO_TYPE_ITEM) && String(selectedPoTypeId) !== String(PO_TYPE_WOVEN_FABRIC) && <td className="border p-2 text-xs">{item.millName || 'N/A'}</td>}
                            <td className="border p-2 text-center text-xs">{getUomNameFromId(item.unit)}</td>
                            <td className="border p-2 text-center">{orderedQty.toFixed(2)}</td>
                            <td className="border p-2 text-center bg-gray-50">{prevReceived.toFixed(2)}</td>
                            <td className="border p-2 text-center bg-gray-50 font-medium">{pendingQty.toFixed(2)}</td>
                            <td className="border p-2">
                              <input
                                type="number"
                                min="0"
                                max={pendingQty}
                                step="0.01"
                                className={`w-24 border p-1 text-center ${receivedQty > pendingQty ? 'border-red-500 bg-red-50' : ''}`}
                                value={item.quantityReceived ?? ''}
                                onChange={e => {
                                  handleInputChange(index, "quantityReceived", e.target.value);
                                }}
                              />
                            </td>
                            <td className="border p-2 text-center bg-gray-50 font-medium">{balanceQty.toFixed(2)}</td>
                            <td className="border p-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24 border p-1 text-center"
                                value={pricePerUnit}
                                onChange={e => handleInputChange(index, "price", e.target.value)}
                              />
                            </td>
                            <td className="border p-2 text-right bg-gray-50 font-medium">₹{totalAmount.toFixed(2)}</td>
                            <td className="border p-2 text-center bg-gray-50">{gstPercent.toFixed(2)}%</td>
                            <td className="border p-2 text-right bg-gray-50 font-medium">₹{gstAmount.toFixed(2)}</td>
                            <td className="border p-2 text-right bg-blue-50 font-semibold text-blue-700">₹{finalAmount.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    type="button"
                    onClick={handleCreateLotDetailsClick}
                    className="bg-primary hover:bg-blue-600 text-white px-6 py-2 flex items-center gap-2 text-sm font-semibold rounded-md shadow-sm transition-all"
                  >
                    Create {getEntryTypeLabel(selectedPoTypeId)}
                  </Button>
                </div>
              </>
              )}
            </CardContent>
          </Card>

          {filteredItems.length > 0 && showLotDetails && (
            <div ref={lotDetailsRef}>
              <LotDetails
                embedded={true}
                selectedItems={selectedItems}
                entryType={isYarn ? 'lot' : isFabric ? 'piece' : 'item'}
                isEditMode={isEditMode}
                formData={{
                  ...watch(),
                  purchaseInwardNo: watch('purchaseInwardNo'),
                  inwardDate: watch('inwardDate'),
                  poTypeId: watch('poTypeId'),
                  vendorId: watch('vendorId'),
                  poNo: watch('poNo'),
                  dcNumber: watch('dcNumber'),
                  dcDate: watch('dcDate'),
                  millInvNo: watch('millInvNo'),
                  millDate: watch('millDate'),
                  icilInvNo: watch('icilInvNo'),
                  icilInvDate: watch('icilInvDate'),
                  remarks: watch('remarks'),
                  yarnMillId: watch('yarnMillId'),
                  id: purchaseInwardDtl?.id || null,
                  purchaseInwardItemsDtl: purchaseInwardDtl?.purchaseInwardItemsDtl || purchaseInwardDtl?.items || [],
                }}
                fromOrderEntry={location.state?.fromOrderEntry}
                expandedRowId={location.state?.expandedRowId}
                activeTab={location.state?.activeTab}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseInward;