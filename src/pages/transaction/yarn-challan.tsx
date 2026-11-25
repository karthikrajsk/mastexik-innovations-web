import React, { useEffect, useState, useMemo, useRef } from "react";
import { Save, ArrowLeft, Plus, Trash2, Edit, Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllCities } from "@/state/citySlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCountries } from "@/state/countrySlice";
import { getAllBaleRollPackings } from "@/state/baleRollPackingSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllYarnSalesOrders } from "@/state/yarnSalesSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllGstMaster } from "@/state/gstMasterSlice";
import { getAllTransports } from "@/state/transportSlice";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createYarnChallan,
  updateYarnChallan,
  getAllYarnChallan
} from "@/state/yarnChallanSlice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import apiService from "@/services/ApiService";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import documentNumberService from "@/services/DocumentNumberService";
import { useForm } from "react-hook-form";
import { CodesAPI } from "@/services/codes_api";
import { CodesUtil } from "@/utils/codesUtil";


interface YarnChallanFormData {
  challanNo: string;
  challanDate: string;
  orderNo: string;
  buyerId: string;
  buyerName: string;
  deliveryAt: string;
  selectedConsigneeId: number | null;
  remarks: string;
  warehouse: string;
  grossWeight: string;
  vehicleNo: string;
  transportId: number | null;
  buyerAddress: string;
  buyerStateCode: string;
  deliveryAtAddress: string;
  deliveryAtStateCode: string;
}

interface BaleRoll {
  id: number;
  rollNo: string;
  pieceNo: string;
  meters: number;
  yards: number;
  netWeight: number;
  avgWt: number;
  grossWt: number;
  warehouse: number;
  grade?: string;
}

interface SelectedBale {
  rollNo: string;
  pieceNo: string;
  meters: number;
  yards: number;
  netWeight: number;
  avgWt: number;
  grossWt: number;
}

interface YarnRequirementDetail {
  id?: number;
  fabricDetails: string;
  yarnName: string;
  actualYarn: string;
  actualYarnId: number;
  yarnId: number;
  warpMeters: number;
  warpGramsPerMeter: number;
  warpRequirement: number;
  totalIssuedQty: number;
  balanceToIssue: number;
}

interface LotDetail {
  id: string;
  uniqueId: string;
  yarnId?: number;
  yarnName: string;
  originalYarnName?: string;
  alternateYarn?: string;
  lotNumber: string;
  availableQty: number;
  actualQty?: number;
  issueQty?: number;
  issuedQty?: number;
  millId?: number | string | null;
  millName?: string;
  warehouseId?: number | string | null;
  warehouseName?: string;
  availableBags?: number;
  noOfBags?: number;
  kgsPerBag?: number;
  conesPerBag?: number;
  conesWeight?: number;
  acceptedQty?: number;
  rejectedQty?: number;
  orderItemId?: number | string | null;
  inwardId?: number | string | null;
  inwardTypeId?: number;
  inwardType?: string;
  outwardTypeId?: number;
  inwardQty?: number;
  inwardBags?: number;
  inwardNo?: string;
  yarnInwardStockDetailsId?: number;
  uomName?: string;
  uomId?: number;
  yarnSalesQty?: number;
  ratePerUnit?: number;
  yarnSalesItemId?: number | null;
}

// Helper function to convert meters to yards
const toYards = (meters: number) => Number(((meters || 0) * 1.094).toFixed(3));

const YarnChallan = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  // Redux state
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { cityList } = useSelector((state: RootState) => state.city);
  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const { list: baleRollPackingList } = useSelector((state: RootState) => state.baleRollPacking as any);
  const { yarnChallanList } = useSelector((state: RootState) => state.yarnChallan as any);
  const { consigneeList } = useSelector((state: RootState) => state.consignee as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { yarnSalesOrderList } = useSelector((state: RootState) => state.yarnSales as any);
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const { gstList } = useSelector((state: RootState) => state.gst as any);
  const { transportList } = useSelector((state: RootState) => (state as any).transport || { transportList: [] });
  const resolvedCompanyId = useResolvedCompanyId();

  // Component states
  const [showBalePopup, setShowBalePopup] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(editingId || location.state?.challan);

  // Form states
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNo, setOrderNo] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [deliveryAt, setDeliveryAt] = useState("");
  const [selectedConsigneeId, setSelectedConsigneeId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transportId, setTransportId] = useState<number | null>(null);

  // Address states
  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [buyerStateCode, setBuyerStateCode] = useState<string>('');
  const [deliveryAtAddress, setDeliveryAtAddress] = useState<string>('');
  const [deliveryAtStateCode, setDeliveryAtStateCode] = useState<string>('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Selected bales/rolls
  const [selectedBales, setSelectedBales] = useState<SelectedBale[]>([]);
  const [tempSelectedBales, setTempSelectedBales] = useState<number[]>([]);
  const [availableBaleRolls, setAvailableBaleRolls] = useState<BaleRoll[]>([]);

  // Yarn Sales Order states
  const [selectedYarnSalesOrder, setSelectedYarnSalesOrder] = useState<any>(null);
  const [yarnSalesItems, setYarnSalesItems] = useState<any[]>([]);
  const [issueQuantities, setIssueQuantities] = useState<{ [key: number]: number }>({});
  const [savedChallanItems, setSavedChallanItems] = useState<any[]>([]);
  const [showIssuePopup, setShowIssuePopup] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [availableYarnLots, setAvailableYarnLots] = useState<any[]>([]);
  const [pendingLotIds, setPendingLotIds] = useState<string[]>([]);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [isIssuePopupLoading, setIsIssuePopupLoading] = useState(false);
  const [yarnRequirementDetails, setYarnRequirementDetails] = useState<YarnRequirementDetail[]>([]);
  const [selectedLots, setSelectedLots] = useState<LotDetail[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [lotWarehouseFilter, setLotWarehouseFilter] = useState<string>("");
  const [savedYarnIssueDetails, setSavedYarnIssueDetails] = useState<any[]>([]);
  const [originalYarnIssueDetails, setOriginalYarnIssueDetails] = useState<any[]>([]);
  const [preservedYarnIssuePayload, setPreservedYarnIssuePayload] = useState<any[]>([]);
  const hasLotSelectionSyncedRef = useRef(false);
  const [inwardTypes, setInwardTypes] = useState<any[]>([]);

  const normalizeDetailsResponse = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
  };

  const normalizeHeadersResponse = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
  };

  useEffect(() => {
    const fetchInwardTypes = async () => {
      try {
        let headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());

        if (!headers.length) {
          try {
            await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
            headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());
          } catch (error) {
            console.error("Failed to preload inward type headers", error);
          }
        }

        if (!headers.length) {
          try {
            const apiHeaders = await CodesAPI.getCodesHeader();
            headers = normalizeHeadersResponse(apiHeaders);
          } catch (error) {
            console.error("Failed to fetch inward type headers", error);
          }
        }

        const inwardHeader = headers.find((h: any) =>
          String(h.id) === "1" || String(h.hdr_id) === "1" || String(h.hdrId) === "1"
        );

        if (inwardHeader && Array.isArray(inwardHeader.details)) {
          setInwardTypes(inwardHeader.details);
        } else if (inwardHeader?.id) {
          const response = await CodesAPI.getCodeDetailsByHeader(inwardHeader.code_group || inwardHeader.codeGroup);
          setInwardTypes(normalizeDetailsResponse(response));
        } else {
          const response = await CodesAPI.getCodeDetailsByHeader("1");
          setInwardTypes(normalizeDetailsResponse(response));
        }
      } catch (error) {
        console.error("Failed to fetch inward types:", error);
      }
    };
    fetchInwardTypes();
  }, []);

  const inwardTypeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    inwardTypes.forEach((detail) => {
      const key = detail.id != null ? String(detail.id) : detail.code || detail.value || "";
      if (!key) return;
      map.set(key, detail.code || detail.value || `Code ${detail.id ?? ""}`);
    });
    return map;
  }, [inwardTypes]);

  const challanData = location.state?.challan;

  const companyMasterArr = useMemo(() => {
    const raw = (companyMasterList?.data ?? companyMasterList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [companyMasterList]);

  const customerListArr = useMemo(() => {
    const raw = (customerList?.data ?? customerList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [customerList]);

  const yarnSalesOrdersArr = useMemo(() => {
    const raw = (yarnSalesOrderList?.data ?? yarnSalesOrderList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [yarnSalesOrderList]);

  const millOptions = useMemo(() => {
    const raw = (subCategoryList?.data ?? subCategoryList) || [];
    const list = Array.isArray(raw) ? raw : [];
    return list.filter((sc: any) => (sc?.categoryName || "").toLowerCase() === "mill");
  }, [subCategoryList]);

  const gstMasterArr = useMemo(() => {
    const raw = (gstList?.data ?? gstList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [gstList]);

  const yarnMapById = useMemo(() => {
    const map = new Map<string, any>();
    (yarnList || []).forEach((y: any) => {
      if (y?.id != null) {
        map.set(String(y.id), y);
      }
    });
    return map;
  }, [yarnList]);

  const millMapById = useMemo(() => {
    const map = new Map<string, any>();
    (millOptions || []).forEach((m: any) => {
      if (m?.id != null) {
        map.set(String(m.id), m);
      }
    });
    return map;
  }, [millOptions]);

  const warehouseMapById = useMemo(() => {
    const map = new Map<string, any>();
    (warehouseList || []).forEach((w: any) => {
      if (w?.id != null) {
        map.set(String(w.id), w);
      }
    });
    return map;
  }, [warehouseList]);

  const uomMapById = useMemo(() => {
    const source = Array.isArray((uomList as any)?.data)
      ? (uomList as any).data
      : Array.isArray(uomList)
        ? uomList
        : [];
    const map = new Map<string, any>();
    (source || []).forEach((u: any) => {
      if (u?.id != null) {
        map.set(String(u.id), u);
      }
    });
    return map;
  }, [uomList]);

  const yarnRequirementsByYarn = useMemo(() => {
    const map = new Map<string, YarnRequirementDetail>();
    yarnRequirementDetails.forEach((req) => {
      const key = String(req.actualYarnId || req.yarnId || "");
      if (key) {
        map.set(key, req);
      }
    });
    return map;
  }, [yarnRequirementDetails]);

  const yarnSalesItemsByYarn = useMemo(() => {
    const map = new Map<string, any[]>();
    yarnSalesItems.forEach((item: any) => {
      const key = String(item?.yarnId ?? "");
      if (!key) {
        return;
      }
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });
    return map;
  }, [yarnSalesItems]);


  // Helper function to get consignee name by ID
  const getConsigneeNameById = (consigneeId: number | null): string => {
    if (!consigneeId || !consigneeList) return "";
    const consignee = consigneeList.find((c: any) => c.id === consigneeId);
    return consignee ? (consignee.consigneeName || consignee.name || "") : "";
  };

  // Helper function to get consignee details by ID
  const getConsigneeById = (consigneeId: number | null): any => {
    if (!consigneeId || !consigneeList) return null;
    return consigneeList.find((c: any) => c.id === consigneeId);
  };

  // Helper functions for address formatting
  const getCityName = (cityId: string | number, cityList: any[]) => {
    if (!cityId || !cityList || cityList.length === 0) return '';
    const city = cityList.find((c: any) =>
      c.id.toString() === cityId.toString() || c.id === parseInt(String(cityId))
    );
    return city ? city.cityName : '';
  };

  const getStateName = (stateId: string | number, stateList: any[]) => {
    if (!stateId || !stateList || stateList.length === 0) return '';
    const state = stateList.find((s: any) =>
      s.id.toString() === stateId.toString() || s.id === parseInt(String(stateId))
    );
    return state ? state.stateName : '';
  };

  const getCountryName = (countryId: string | number, countryList: any[]) => {
    if (!countryId || !countryList || countryList.length === 0) return '';
    const country = countryList.find((c: any) =>
      c.id.toString() === countryId.toString() || c.id === parseInt(String(countryId))
    );
    return country ? country.countryName : '';
  };

  const formatCompleteAddress = (address: any, cityList: any[], stateList: any[], countryList: any[]) => {
    if (!address) return '';

    const parts = [];
    if (address.line1 && address.line1.trim()) parts.push(address.line1.trim());
    if (address.line2 && address.line2.trim()) parts.push(address.line2.trim());

    const cityName = getCityName(address.cityId, cityList);
    const stateName = getStateName(address.stateId, stateList);
    const countryName = getCountryName(address.countryId, countryList);

    const locationParts = [];
    if (cityName) locationParts.push(cityName);
    if (stateName) locationParts.push(stateName);
    if (countryName) locationParts.push(countryName);

    if (locationParts.length > 0) {
      parts.push(locationParts.join(', '));
    }

    if (address.pinCode) {
      const pinCodeStr = String(address.pinCode).trim();
      if (pinCodeStr) {
        parts.push(`PIN: ${pinCodeStr}`);
      }
    }

    return parts.join(', ');
  };

     const isSavingRef = useRef(false);
      const hasGeneratedNumberRef = useRef(false);
      
     const methods = useForm<YarnChallanFormData>({
          mode: 'onChange',
          defaultValues: {
              challanNo: '',
          }
      });
    const { register, watch, setValue, handleSubmit, formState: { errors }, trigger, reset } = methods;
    // Generate document number for new beam inward entries
    useEffect(() => {
      const generateDocumentNumber = async () => {
        // Only generate for new entries (not editing existing ones)
        if (challanData || hasGeneratedNumberRef.current) {
          return;
        }
  
        try {
          const result = await documentNumberService.generateDocumentNumber({
            screenName: 'Yarn Challan'
          });
  
          setValue('challanNo', result.documentNumber, { shouldValidate: true });
          hasGeneratedNumberRef.current = true;
        } catch (error) {
          console.error('Failed to generate Yarn Challan number:', error);
          toast.error('Failed to generate Yarn Challan number');
        }
      };
  
      generateDocumentNumber();
    }, [challanData, setValue]);
  
    // Cleanup document number cache if not saved
    useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (hasGeneratedNumberRef.current && !isSavingRef.current && !challanData) {
          documentNumberService.clearMemoryCache('Yarn Challan');
        }
      };
  
      window.addEventListener('beforeunload', handleBeforeUnload);
  
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (hasGeneratedNumberRef.current && !isSavingRef.current && !challanData) {
          documentNumberService.clearMemoryCache('Yarn Challan');
        }
      };
    }, [challanData]);
  
    useEffect(() => {
      setValue('challanNo', challanData?.challanNo || '');
    }, [challanData, setValue]);

  // Update buyer address when buyerId changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (buyerId) {
        setIsLoadingAddresses(true);
        const buyer = customerListArr.find((c: any) => String(c.id) === String(buyerId));

        if (buyer?.address) {
          const completeAddress = formatCompleteAddress(
            buyer.address,
            cityList,
            stateList,
            countryList
          );
          setBuyerAddress(completeAddress || '');
          setBuyerStateCode(buyer.address.stateCode || '');
        } else {
          setBuyerAddress('');
          setBuyerStateCode('');
        }
        setIsLoadingAddresses(false);
      } else {
        setBuyerAddress('');
        setBuyerStateCode('');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [buyerId, customerListArr, cityList, stateList, countryList]);

  // Update delivery address when selectedConsigneeId changes
  useEffect(() => {
    if (selectedConsigneeId) {
      const consignee = consigneeList.find((c: any) => c.id === selectedConsigneeId);

      if (consignee) {
        const consigneeName = consignee.consigneeName || consignee.name || "";
        if (!deliveryAt && consigneeName) {
          setDeliveryAt(consigneeName);
        }

        if (consignee.address) {
          const completeAddress = formatCompleteAddress(
            consignee.address,
            cityList,
            stateList,
            countryList
          );
          setDeliveryAtAddress(completeAddress || '');
          setDeliveryAtStateCode(consignee.address.stateCode || '');
        } else {
          setDeliveryAtAddress('');
          setDeliveryAtStateCode('');
        }
      } else {
        setDeliveryAtAddress('');
        setDeliveryAtStateCode('');
      }
    } else {
      setDeliveryAtAddress('');
      setDeliveryAtStateCode('');
    }
  }, [selectedConsigneeId, consigneeList, cityList, stateList, countryList, deliveryAt]);







  // Helper function to build full address (kept for reference, but we'll use consignee names)
  const buildFullAddress = (customer: any): string => {
    if (!customer || !customer.address) return "";

    const addr = customer.address;
    const addressParts: string[] = [];

    // Add address lines
    if (addr.line1) addressParts.push(addr.line1);
    if (addr.line2) addressParts.push(addr.line2);

    // Add city name
    if (addr.cityId && cityList.length > 0) {
      const city = cityList.find((c: any) => c.id === addr.cityId);
      if (city) addressParts.push(city.cityName || city.name);
    }

    // Add state name
    if (addr.stateId && stateList.length > 0) {
      const state = stateList.find((s: any) => s.id === addr.stateId);
      if (state) addressParts.push(state.stateName || state.name);
    }

    // Add country name
    if (addr.countryId && countryList.length > 0) {
      const country = countryList.find((c: any) => c.id === addr.countryId);
      if (country) addressParts.push(country.countryName || country.name);
    }

    // Add pin code
    if (addr.pinCode) addressParts.push(addr.pinCode.toString());

    return addressParts.join(", ");
  };








  // NEW: Function to get all used bale/roll identifiers from existing packing lists
  const getUsedBaleRollIdentifiers = useMemo(() => {
    const usedIdentifiers = new Set<string>();

    const packingLists = Array.isArray(yarnChallanList) ? yarnChallanList : [];

    packingLists.forEach((packing: any) => {
      // Skip current packing if editing (allow re-selection of own items)
      if (editingId && packing.id === editingId) {
        return;
      }

      if (packing.items && Array.isArray(packing.items)) {
        packing.items.forEach((item: any) => {
          // Create unique identifier using rollNo and pieceNo
          const identifier = `${item.rollNo}|${item.pieceNo}`;
          usedIdentifiers.add(identifier);
        });
      }
    });

    return usedIdentifiers;
  }, [yarnChallanList, editingId]);
  // Load initial data
  useEffect(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedCompanyId ? Number(storedCompanyId) : null;

    dispatch(getAllCustomers({fetchAll: true} as any));
    dispatch(getAllWarehouse({fetchAll: true}) as any);
    dispatch(getAllCities({fetchAll: true}) as any);
    dispatch(getAllStates({fetchAll: true}) as any);
    dispatch(getAllCountries({fetchAll: true}) as any);
    dispatch(getAllBaleRollPackings({fetchAll: true}) as any);
    dispatch(getAllYarnChallan(companyId ? { companyId } : {fetchAll: true}) as any);
    dispatch(getAllConsignee({fetchAll: true}) as any);
    dispatch(getAllCompanies({fetchAll: true}) as any);
    dispatch(getAllYarnSalesOrders(companyId ? { companyId } : {fetchAll: true}) as any);
    dispatch(getAllYarnMasters({fetchAll: true}) as any);
    dispatch(getAllSubCategories({fetchAll: true}) as any);
    dispatch(getAllUomMaster({fetchAll: true}) as any);
    dispatch(getAllGstMaster({fetchAll: true}) as any);
    dispatch(getAllTransports({fetchAll: true}) as any);
  }, [dispatch]);

  const handleEditFromState = (data: any) => {
    if (!data) return;

    setEditingId(data.id);
    setChallanDate(data.challanDate);
    setOrderNo(String(data.yarnSalesOrderId));
    setBuyerId(String(data.buyerId));
    setDeliveryAt(data.deliveryAt);
    setSelectedConsigneeId(data.consigneeId || null);
    setRemarks(data.remarks || "");
    setGrossWeight(data.grossWeight || "");
    setVehicleNo(data.vehicleNo || "");
    setTransportId(data.transportId || null);

    // Populate items and issue details if they exist in the response
    if (data.items && Array.isArray(data.items)) {
      setSavedChallanItems(data.items);
    }

    if (data.yarnIssueDetails && Array.isArray(data.yarnIssueDetails)) {
      setSavedYarnIssueDetails(data.yarnIssueDetails);
      // Try to get preserved data from localStorage first (from when it was created)
      const preservedKey = `yarnChallan_${data.id}_originalDetails`;
      const preservedData = localStorage.getItem(preservedKey);
      if (preservedData) {
        try {
          const parsedData = JSON.parse(preservedData);
          setOriginalYarnIssueDetails(parsedData);
        } catch (error) {
          console.error('Error parsing preserved yarn issue details:', error);
          setOriginalYarnIssueDetails(data.yarnIssueDetails);
        }
      } else {
        setOriginalYarnIssueDetails(data.yarnIssueDetails);
      }
    }
    
    // Trigger loading of sales order items without resetting selections
    applyYarnSalesOrderSelection(String(data.yarnSalesOrderId), true, data.consigneeId || null, data.deliveryAt || "");
  };

  // Handle editing from location state
  useEffect(() => {
    if (challanData) {
      handleEditFromState(challanData);
    }
  }, [challanData]);

  // Match saved challan items with loaded yarn sales order items to restore issue quantities
  useEffect(() => {
    if (savedChallanItems.length > 0 && yarnSalesItems.length > 0) {
      const newIssueQty: { [key: number]: number } = {};
      const matchedSavedIds: string[] = [];
      const updatedItems = yarnSalesItems.map((ysoItem: any) => {
        const matchedSavedItem = savedChallanItems.find((savedItem: any) =>
          savedItem.yarnId === ysoItem.yarnId &&
          savedItem.millId === ysoItem.millId &&
          savedItem.uomId === ysoItem.uomId
        );

        if (matchedSavedItem) {
          newIssueQty[ysoItem.id] = matchedSavedItem.issueQty || 0;
          matchedSavedIds.push(String(ysoItem.id));
          return { ...ysoItem, yarnChallanItemId: matchedSavedItem.id };
        } else {
          newIssueQty[ysoItem.id] = 0;
          return ysoItem;
        }
      });

      setYarnSalesItems(updatedItems);
      setIssueQuantities(newIssueQty);
      if (matchedSavedIds.length > 0) {
        setSelectedItemIds(matchedSavedIds);
      }
      setSavedChallanItems([]);
    }
  }, [yarnSalesItems, savedChallanItems]);

  useEffect(() => {
    if (savedYarnIssueDetails.length === 0 || yarnSalesItems.length === 0) {
      return;
    }

    const mappedLots: LotDetail[] = savedYarnIssueDetails
      .map((detail: any, index: number) => {
        const matchingItem = detail.yarnSalesItemId
          ? yarnSalesItems.find((item: any) => String(item.id) === String(detail.yarnSalesItemId))
          : null;
        const fallbackYarn = yarnList?.find((y: any) => String(y.id) === String(detail.yarnId));
        const yarnName = matchingItem?.yarnName || fallbackYarn?.yarnName || detail.yarnName || `Yarn-${detail.yarnId || index}`;
        const uniqueId = String(
          detail.uniqueId ||
          detail.id ||
          `${detail.yarnSalesItemId || matchingItem?.id || index}_${detail.lotNumber || "LOT"}_${detail.warehouseId || 0}`
        );

        // Find the original data that has the missing fields from preserved localStorage data
        const originalDetail = originalYarnIssueDetails.find(orig => 
          orig.id === detail.id || 
          (orig.lotNumber === detail.lotNumber && orig.yarnSalesItemId === detail.yarnSalesItemId)
        );

        return {
          id: detail.id ? String(detail.id) : uniqueId,
          uniqueId,
          yarnId: detail.yarnId ?? matchingItem?.yarnId ?? 0,
          yarnName,
          originalYarnName: matchingItem?.yarnName || yarnName,
          alternateYarn: matchingItem?.yarnName || yarnName,
          lotNumber: detail.lotNumber || "",
          availableQty: Number(detail.availableQty ?? detail.actualQty ?? 0),
          actualQty: Number(detail.actualQty ?? detail.availableQty ?? 0),
          issueQty: Number(detail.issueQty ?? 0),
          issuedQty: Number(detail.issueQty ?? 0),
          millId: detail.millId ?? matchingItem?.millId ?? null,
          warehouseId: detail.warehouseId ?? null,
          availableBags: Number(detail.availableBags ?? 0),
          noOfBags: Number(detail.noOfBags ?? 0),
          kgsPerBag: Number(detail.kgsPerBag ?? 0),
          conesPerBag: Number(detail.conesPerBag ?? 0),
          conesWeight: Number(detail.conesWeight ?? 0),
          yarnSalesItemId: detail.yarnSalesItemId ?? matchingItem?.id ?? null,
          // Use preserved data if available, otherwise use API response data (which may be null/undefined)
          orderItemId: originalDetail?.orderItemId ?? detail.orderItemId ?? 0,
          inwardId: originalDetail?.inwardId ?? detail.inwardId ?? 0,
          inwardTypeId: originalDetail?.inwardTypeId ?? detail.inwardTypeId ?? 0,
          outwardTypeId: originalDetail?.outwardTypeId ?? detail.outwardTypeId ?? 132,
          uomId: originalDetail?.uomId ?? detail.uomId ?? 0,
          inwardQty: originalDetail?.inwardQty ?? detail.inwardQty ?? 0,
          inwardBags: originalDetail?.inwardBags ?? detail.inwardBags ?? 0,
          acceptedQty: originalDetail?.acceptedQty ?? detail.acceptedQty ?? 0,
          rejectedQty: originalDetail?.rejectedQty ?? detail.rejectedQty ?? 0,
          inwardNo: originalDetail?.inwardNo ?? detail.inwardNo ?? "",
          yarnInwardStockDetailsId: originalDetail?.yarnInwardStockDetailsId ?? detail.yarnInwardStockDetailsId ?? 0
        } as LotDetail;
      })
      .filter((lot): lot is LotDetail => Boolean(lot && lot.yarnSalesItemId));

    if (mappedLots.length === 0) {
      setSavedYarnIssueDetails([]);
      return;
    }

    setSelectedLots(mappedLots);
    const ids = mappedLots.map((lot) => lot.uniqueId);
    setSelectedLotIds(ids);
    setPendingLotIds(ids);
    setIsDraftSaved(true);
    setEditingRowIndex(null);
    setSavedYarnIssueDetails([]);
    hasLotSelectionSyncedRef.current = true;
  }, [savedYarnIssueDetails, yarnSalesItems, yarnList, originalYarnIssueDetails]);

  useEffect(() => {
    if (yarnSalesItems.length === 0) {
      setYarnRequirementDetails([]);
      return;
    }
    setYarnRequirementDetails((prev) =>
      yarnSalesItems.map((item: any) => {
        const existing = prev.find((req) => req.id === item.id);
        const defaultActualId = existing?.actualYarnId ?? item.actualYarnId ?? item.yarnId ?? 0;
        const actualYarnName = existing?.actualYarn ||
          yarnList.find((y: any) => y.id === defaultActualId)?.yarnName ||
          item.yarnName || "-";
        const orderQty = Number(item.orderQuantity || 0);
        return {
          id: item.id,
          fabricDetails: item.fabricDetails || item.quality || item.yarnName || `Item-${item.id}`,
          yarnName: item.yarnName || '-',
          actualYarn: actualYarnName,
          actualYarnId: defaultActualId,
          yarnId: item.yarnId || 0,
          warpMeters: Number(item.warpMeters || orderQty),
          warpGramsPerMeter: Number(item.warpGramsPerMeter || 0),
          warpRequirement: orderQty,
          totalIssuedQty: existing?.totalIssuedQty || 0,
          balanceToIssue: existing?.balanceToIssue ?? orderQty
        } as YarnRequirementDetail;
      })
    );
  }, [yarnSalesItems, yarnList]);

  useEffect(() => {
    if (yarnRequirementDetails.length === 0) {
      return;
    }
    setYarnRequirementDetails((prev) =>
      prev.map((req) => {
        const matchedItem = yarnSalesItems.find((item: any) => item.id === req.id);
        const orderQty = Number(matchedItem?.orderQuantity ?? req.warpRequirement ?? 0);
        const reqId = req.id ?? 0;
        const issuedQty = issueQuantities[reqId] || 0;
        return {
          ...req,
          warpRequirement: orderQty,
          totalIssuedQty: issuedQty,
          balanceToIssue: orderQty - issuedQty
        };
      })
    );
  }, [issueQuantities, yarnSalesItems, yarnRequirementDetails.length]);

  useEffect(() => {
    if (selectedLots.length === 0) {
      if (!hasLotSelectionSyncedRef.current) {
        return;
      }
      setIssueQuantities({});
      setSelectedItemIds([]);
      return;
    }
    hasLotSelectionSyncedRef.current = true;
    const aggregated: { [key: number]: number } = {};
    selectedLots.forEach((lot) => {
      if (lot.yarnSalesItemId == null) {
        return;
      }
      const issued = Number(lot.issuedQty ?? lot.issueQty ?? 0);
      aggregated[lot.yarnSalesItemId] = (aggregated[lot.yarnSalesItemId] || 0) + issued;
    });
    setIssueQuantities(aggregated);
    setSelectedItemIds(Object.keys(aggregated));
  }, [selectedLots]);

  const selectedItemSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds]);

  const selectedItems = useMemo(() => {
    if (selectedItemIds.length === 0) {
      return [];
    }
    return yarnSalesItems.filter((item: any) => selectedItemSet.has(String(item.id)));
  }, [yarnSalesItems, selectedItemIds, selectedItemSet]);

  const filteredYarnLots = useMemo(() => {
    if (!lotWarehouseFilter) {
      return availableYarnLots;
    }
    return availableYarnLots.filter((lot: any) => String(lot.warehouseId ?? "") === lotWarehouseFilter);
  }, [availableYarnLots, lotWarehouseFilter]);

  const overallIssuedQty = useMemo(() => {
    return Object.values(issueQuantities).reduce((sum, qty) => sum + Number(qty || 0), 0);
  }, [issueQuantities]);

  const requirementTotals = useMemo(() => {
    if (yarnRequirementDetails.length === 0) {
      return { warpRequirement: 0, totalIssuedQty: 0, balanceToIssue: 0 };
    }
    return yarnRequirementDetails.reduce(
      (acc, req) => ({
        warpRequirement: acc.warpRequirement + (req.warpRequirement || 0),
        totalIssuedQty: acc.totalIssuedQty + (req.totalIssuedQty || 0),
        balanceToIssue: acc.balanceToIssue + (req.balanceToIssue || 0)
      }),
      { warpRequirement: 0, totalIssuedQty: 0, balanceToIssue: 0 }
    );
  }, [yarnRequirementDetails]);

  useEffect(() => {
    if (overallIssuedQty > 0 && !editingId) {
      setGrossWeight(overallIssuedQty.toFixed(2));
    }
  }, [overallIssuedQty, editingId]);


  const handleOrderNoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orderId = e.target.value;

    if (!orderId) {
      setOrderNo("");
      setBuyerId("");
      setBuyerName("");
      setSelectedConsigneeId(null);
      setDeliveryAt("");
      setYarnSalesItems([]);
      setIssueQuantities({});
      setSelectedYarnSalesOrder(null);
      setSelectedItemIds([]);
      setAvailableYarnLots([]);
      setPendingLotIds([]);
      setSelectedLotIds([]);
      setSelectedLots([]);
      setEditingRowIndex(null);
      setIsDraftSaved(false);
      hasLotSelectionSyncedRef.current = false;
      return;
    }

    applyYarnSalesOrderSelection(orderId);
  };

  const applyYarnSalesOrderSelection = (
    orderId: string, 
    isEdit: boolean = false, 
    savedConsigneeId: number | null = null, 
    savedDeliveryAt: string = ""
  ) => {
    const yso = orderId ? yarnSalesOrdersArr.find((x: any) => String(x.id) === String(orderId)) : null;
    setOrderNo(orderId || "");
    setSelectedYarnSalesOrder(yso);

    if (!yso) {
      if (!isEdit) {
        setBuyerId("");
        setBuyerName("");
        setSelectedConsigneeId(null);
        setDeliveryAt("");
        setYarnSalesItems([]);
        setIssueQuantities({});
        setSelectedItemIds([]);
        setAvailableYarnLots([]);
        setPendingLotIds([]);
        setSelectedLotIds([]);
        setSelectedLots([]);
        setEditingRowIndex(null);
        setIsDraftSaved(false);
        hasLotSelectionSyncedRef.current = false;
      }
      return;
    }

    const buyerNumber = Number(yso.buyerId ?? NaN);
    if (!Number.isNaN(buyerNumber)) {
      setBuyerId(String(buyerNumber));
      const matchedBuyer = customerListArr.find((c: any) => c.id === buyerNumber);
      setBuyerName(matchedBuyer ? (matchedBuyer.customerName || matchedBuyer.name || "") : "");
    } else if (!isEdit) {
      setBuyerId("");
      setBuyerName("");
    }

    const consigneeIdValue = yso.deliveryAtId ?? null;
    if (isEdit && savedConsigneeId !== null && savedConsigneeId > 0) {
      setSelectedConsigneeId(savedConsigneeId);
      setDeliveryAt(savedDeliveryAt);
    } else if (consigneeIdValue != null) {
      const resolvedId = Number(consigneeIdValue);
      if (!Number.isNaN(resolvedId)) {
        setSelectedConsigneeId(resolvedId);
        const matchedConsignee = getConsigneeById(resolvedId);
        setDeliveryAt(matchedConsignee ? (matchedConsignee.consigneeName || matchedConsignee.name || "") : "");
      } else if (!isEdit) {
        setSelectedConsigneeId(null);
        setDeliveryAt("");
      }
    } else if (!isEdit) {
      setSelectedConsigneeId(null);
      setDeliveryAt("");
    }

    if (yso.items && Array.isArray(yso.items) && yso.items.length > 0) {
      const resolvedItems = yso.items.map((item: any) => {
        const yarn = yarnList?.find((y: any) => y.id === item.yarnId);
        const mill = subCategoryList?.find((sc: any) => sc.id === item.millId);
        const uom = uomList?.find((u: any) => u.id === item.uomId);
        const gst = gstMasterArr.find((g: any) => g.id === item.gstPercentId);

        let gstPercent = item.gstPercent || '';
        if (gst) {
          if (yso.gstTypeId === 1) {
            gstPercent = String(gst.cgstRate || gst.sgstRate || '');
          } else if (yso.gstTypeId === 2) {
            gstPercent = String(gst.igstRate || '');
          }
        }

        return {
          ...item,
          yarnName: yarn?.yarnName || yarn?.name || item.yarnName || '',
          millName: mill?.subCategoryName || mill?.name || item.millName || '',
          uomName: uom?.uomName || uom?.name || item.uomName || '',
          gstPercent: gstPercent
        };
      });

      setYarnSalesItems(resolvedItems);

      if (!isEdit) {
        setSelectedItemIds([]);
        setAvailableYarnLots([]);
        setPendingLotIds([]);
        setSelectedLotIds([]);
        setSelectedLots([]);
        setEditingRowIndex(null);
        setIsDraftSaved(false);
        hasLotSelectionSyncedRef.current = false;
        const initialIssueQty: { [key: number]: number } = {};
        resolvedItems.forEach((item: any) => {
          initialIssueQty[item.id] = 0;
        });
        setIssueQuantities(initialIssueQty);
      }
    } else if (!isEdit) {
      setYarnSalesItems([]);
      setIssueQuantities({});
      setSelectedItemIds([]);
      setAvailableYarnLots([]);
      setPendingLotIds([]);
      setSelectedLotIds([]);
      setSelectedLots([]);
      setEditingRowIndex(null);
      setIsDraftSaved(false);
      hasLotSelectionSyncedRef.current = false;
    }
  };

  const handleActualYarnChange = (index: number, newYarnId: string) => {
    const targetRequirement = yarnRequirementDetails[index];
    const yarnId = parseInt(newYarnId, 10);
    const selectedYarn = yarnList.find((y: any) => y.id === yarnId);
    setYarnRequirementDetails((prev) => {
      const updated = [...prev];
      if (!updated[index]) {
        return prev;
      }
      updated[index] = {
        ...updated[index],
        actualYarnId: yarnId,
        actualYarn: selectedYarn?.yarnName || ''
      };
      return updated;
    });
    if (!targetRequirement) {
      return;
    }
    setSelectedLots((prev) =>
      prev.map((lot) =>
        lot.yarnSalesItemId === targetRequirement.id
          ? { ...lot, alternateYarn: selectedYarn?.yarnName || '' }
          : lot
      )
    );
  };



  // Handle consignee selection for Delivery At (manual override)
  const handleConsigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const consigneeId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedConsigneeId(consigneeId);

    if (consigneeId) {
      const consigneeName = getConsigneeNameById(consigneeId);
      setDeliveryAt(consigneeName);
    } else {
      setDeliveryAt("");
    }
  };

  const normalizeStockResponse = (payload: any): any[] => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    if (Array.isArray(payload?.records)) {
      return payload.records;
    }
    if (Array.isArray(payload?.data?.data)) {
      return payload.data.data;
    }
    return [];
  };

  const handleYarnIssue = async () => {
    if (!orderNo) {
      toast.error("Please select a yarn sales order first");
      return;
    }
    if (yarnSalesItems.length === 0) {
      toast.error("No yarn items found for the selected sales order");
      return;
    }
    const requirementIds = yarnRequirementDetails
      .map((req) => req.actualYarnId || req.yarnId)
      .filter((id): id is number => id != null && !Number.isNaN(id) && id !== 0);
    const salesItemIds = yarnSalesItems
      .map((item: any) => (item?.yarnId != null ? Number(item.yarnId) : null))
      .filter((id): id is number => id != null && !Number.isNaN(id));
    const uniqueItemIds = Array.from(
      new Set([...requirementIds, ...salesItemIds].map((id) => String(id).trim()).filter(Boolean))
    );
    if (uniqueItemIds.length === 0) {
      toast.error("No yarn IDs available for the selected sales order");
      return;
    }
    setLotWarehouseFilter(warehouse || "");
    setIsIssuePopupLoading(true);
    try {
      const queryParams: Record<string, string | number> = { itemId: uniqueItemIds.join(",") };
      if (resolvedCompanyId != null) {
        queryParams.companyId = resolvedCompanyId;
      }
      const response = await apiService.get(
        "/sizing-yarn-issues/yarn-inward-stock",
        queryParams
      );
      const stockRows = normalizeStockResponse(response);
      if (!stockRows.length) {
        setAvailableYarnLots([]);
        setPendingLotIds([]);
        setShowIssuePopup(true);
        return;
      }
      const uniqueLots = new Map<string, any>();
      stockRows.forEach((lot: any, index: number) => {
        const uniqueKey = `${lot.orderItemId || index}_${lot.inwardId || "0"}_${lot.lotNo || "NA"}_${lot.itemId || "0"}_${lot. Id || "0"}_${lot.millId || "0"}`;
        if (uniqueLots.has(uniqueKey)) {
          return;
        }
        const yarnIdStr = lot.itemId != null ? String(lot.itemId) : "";
        const requirement = yarnRequirementsByYarn.get(yarnIdStr);
        const candidateItems = yarnSalesItemsByYarn.get(yarnIdStr) || [];
        let matchingItem = candidateItems.find((item: any) => {
          if (item?.millId && lot.millId) {
            return String(item.millId) === String(lot.millId);
          }
          return true;
        });
        if (!matchingItem && candidateItems.length > 0) {
          matchingItem = candidateItems[0];
        }
        const yarnRecord = yarnMapById.get(yarnIdStr);
        const yarnName =
          requirement?.actualYarn ||
          matchingItem?.yarnName ||
          requirement?.yarnName ||
          yarnRecord?.yarnName ||
          `Yarn-${yarnIdStr || index}`;
        const originalYarnName =
          requirement?.yarnName ||
          matchingItem?.yarnName ||
          yarnRecord?.yarnName ||
          yarnName;
        const alternateYarn = requirement?.actualYarn || matchingItem?.yarnName || yarnName;
        const millId = lot.millId ?? matchingItem?.millId ?? null;
        const warehouseId = lot.warehouseId ?? matchingItem?.warehouseId ?? null;
        const millName = millId != null ? (millMapById.get(String(millId))?.subCategoryName || millMapById.get(String(millId))?.name || "") : "";
        const warehouseName = warehouseId != null ? (warehouseMapById.get(String(warehouseId))?.warehouseName || warehouseMapById.get(String(warehouseId))?.name || "") : "";
        const acceptedQty = Number(lot.acceptedQty ?? lot.actualQty ?? 0);
        const availableQty = Number(lot.availableQty ?? acceptedQty ?? 0);
        const availableBags = Number(lot.availableBags ?? lot.inwardBags ?? 0);
        const kgsPerBag = Number(lot.kgsPerBag ?? 0);
        const conesPerBag = Number(lot.conesPerBag ?? 0);
        const conesWeight = Number(lot.conesWeight ?? 0);
        const uomName = matchingItem?.uomName || (matchingItem?.uomId ? uomMapById.get(String(matchingItem.uomId))?.uomName : "") || "";
        uniqueLots.set(uniqueKey, {
          uniqueKey,
          yarnName,
          lotNumber: lot.lotNo || `LOT-${lot.orderItemId || index}`,
          acceptedQty,
          availableQty,
          availableBags,
          kgsPerBag,
          conesPerBag,
          conesWeight,
          millId,
          millName,
          warehouseId,
          warehouseName,
          yarnId: yarnIdStr ? Number(yarnIdStr) : undefined,
          yarnSalesItemId: matchingItem?.id ?? null,
          yarnSalesQty: matchingItem ? Number(matchingItem.orderQuantity || 0) : 0,
          uomName,
          ratePerUnit: matchingItem ? Number(matchingItem.ratePerUnit || 0) : 0,
          originalYarnName,
          alternateYarn,
          orderItemId: lot.orderItemId ?? null,
          inwardId: lot.inwardId ?? null,
          yarnInwardStockDetailsId: lot.yarnInwardStockDetailsId || lot.id || null,
          uomId: matchingItem?.uomId ?? null,
          inwardQty: lot.inwardQty ?? 0,
          inwardBags: lot.inwardBags ?? 0,
          inwardNo: lot.inwardNo ?? "",
          inwardTypeId: lot.inwardTypeId ?? null,
          inwardType: lot.inwardTypeId ? inwardTypeLabelById.get(String(lot.inwardTypeId)) || lot.inwardType || "N/A" : "N/A"
        });
      });
      const transformedLots = Array.from(uniqueLots.values());
      if (!transformedLots.length) {
        setAvailableYarnLots([]);
        setPendingLotIds([]);
        setShowIssuePopup(true);
        return;
      }
      setAvailableYarnLots(transformedLots);
      const defaultPending = selectedLotIds.filter((id) =>
        transformedLots.some((lot: any) => lot.uniqueKey === id)
      );
      setPendingLotIds(defaultPending);
      setShowIssuePopup(true);
    } catch (error: any) {
      console.error("Error fetching yarn stock:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch yarn stock");
      setAvailableYarnLots([]);
      setPendingLotIds([]);
      setShowIssuePopup(false);
    } finally {
      setIsIssuePopupLoading(false);
    }
  };

  const togglePendingLot = (id: string, disabled: boolean) => {
    if (disabled) {
      return;
    }
    setPendingLotIds((prev) =>
      prev.includes(id)
        ? prev.filter((lotId) => lotId !== id)
        : [...prev, id]
    );
  };

  const handleConfirmLotSelection = () => {
    if (pendingLotIds.length === 0) {
      toast.error("Select at least one yarn lot");
      return;
    }
    const selectedEntries = pendingLotIds
      .map((lotId) => availableYarnLots.find((entry: any) => entry.uniqueKey === lotId))
      .filter((entry): entry is any => Boolean(entry));
    if (selectedEntries.length === 0) {
      toast.error("Selected yarn lots are unavailable");
      return;
    }
    const selectedItemsFromLots = Array.from(new Set(
      selectedEntries
        .map((lot: any) => (lot.yarnSalesItemId ? String(lot.yarnSalesItemId) : null))
        .filter((value): value is string => Boolean(value))
    ));
    if (selectedItemsFromLots.length === 0) {
      toast.error("Selected yarn lots do not match the sales order items");
      return;
    }
    const existingLotMap = new Map(selectedLots.map((lot) => [lot.uniqueId, lot]));
    const mergedLots: LotDetail[] = pendingLotIds
      .map((lotId) => {
        if (existingLotMap.has(lotId)) {
          return existingLotMap.get(lotId) || null;
        }
        const lotEntry = availableYarnLots.find((entry: any) => entry.uniqueKey === lotId);
        if (!lotEntry) {
          return null;
        }
        return {
          id: lotEntry.uniqueKey,
          uniqueId: lotEntry.uniqueKey,
          yarnId: lotEntry.yarnId,
          yarnName: lotEntry.yarnName,
          originalYarnName: lotEntry.yarnName,
          alternateYarn: lotEntry.yarnName,
          lotNumber: lotEntry.lotNumber,
          availableQty: Number(lotEntry.availableQty || lotEntry.acceptedQty || 0),
          actualQty: Number(lotEntry.acceptedQty || 0),
          issueQty: 0,
          issuedQty: 0,
          millId: lotEntry.millId ?? null,
          warehouseId: lotEntry.warehouseId ?? null,
          availableBags: Number(lotEntry.availableBags ?? 0),
          noOfBags: Number(lotEntry.noOfBags ?? 0),
          kgsPerBag: Number(lotEntry.kgsPerBag ?? 0),
          conesPerBag: Number(lotEntry.conesPerBag ?? 0),
          conesWeight: Number(lotEntry.conesWeight ?? 0),
          yarnSalesItemId: lotEntry.yarnSalesItemId ?? null,
          orderItemId: lotEntry.orderItemId,
          inwardId: lotEntry.inwardId,
          inwardTypeId: lotEntry.inwardTypeId,
          inwardType: lotEntry.inwardType,
          outwardTypeId: lotEntry.outwardTypeId,
          uomId: lotEntry.uomId,
          inwardQty: lotEntry.inwardQty,
          inwardBags: lotEntry.inwardBags,
          acceptedQty: lotEntry.acceptedQty,
          rejectedQty: lotEntry.rejectedQty,
          inwardNo: lotEntry.inwardNo,
          yarnInwardStockDetailsId: lotEntry.yarnInwardStockDetailsId
        } as LotDetail;
      })
      .filter((lot): lot is LotDetail => Boolean(lot));
    setSelectedLotIds(pendingLotIds);
    setSelectedLots(mergedLots);
    setIsDraftSaved(false);
    setEditingRowIndex(null);
    setShowIssuePopup(false);
  };

  const handleAlternateYarnValueChange = (index: number, value: string) => {
    setSelectedLots((prev) => {
      const updated = [...prev];
      if (!updated[index]) {
        return prev;
      }
      updated[index] = { ...updated[index], alternateYarn: value };
      return updated;
    });
    setIsDraftSaved(false);
  };

  const handleDeleteLot = (index: number) => {
    setSelectedLots((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const updatedIds = updated.map((lot) => lot.uniqueId);
      setSelectedLotIds(updatedIds);
      setPendingLotIds((prevPending) => prevPending.filter((id) => updatedIds.includes(id)));
      return updated;
    });
    setIsDraftSaved(false);
    setEditingRowIndex(null);
  };

  const handleEditLotRow = (index: number) => {
    setEditingRowIndex(index);
  };

  const handleSaveLotRow = (index: number) => {
    const lot = selectedLots[index];
    if (!lot) {
      return;
    }
    if (!lot.alternateYarn || !lot.alternateYarn.trim()) {
      toast.error("Please enter alternate yarn");
      return;
    }
    setEditingRowIndex(null);
  };

  const handleSaveDraft = () => {
    if (selectedLots.length === 0) {
      toast.error("Please select at least one yarn lot");
      return;
    }
    const hasEmptyAlternate = selectedLots.some((lot) => !lot.alternateYarn || !lot.alternateYarn.trim());
    if (hasEmptyAlternate) {
      toast.error("Please fill alternate yarn for all lots");
      return;
    }
    setIsDraftSaved(true);
    setEditingRowIndex(null);
  };


  const handleRemoveBale = (index: number) => {
    setSelectedBales(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (data: YarnChallanFormData) => {
    // Validation
    // if (!challanDate || !orderNo || !buyerId || !deliveryAt) {
    //   toast.error("Please fill all mandatory fields");
    //   return;
    // }

    if (yarnSalesItems.length === 0) {
      toast.error("Please select a yarn sales order with items");
      return;
    }

    if (selectedLots.length === 0) {
      toast.error("Please choose yarn items through Yarn Challan Issue");
      return;
    }

    for (const item of yarnSalesItems) {
      const issueQty = Number(issueQuantities[item.id] || 0);
      const orderQty = Number(item.orderQuantity || 0);

      if (issueQty > orderQty) {
        toast.error(`Issue Quantity (${issueQty}) cannot exceed Order Quantity (${orderQty}) for ${item.yarnName || 'item'}`);
        return;
      }
    }

    const hasExceedingBags = selectedLots.some((lot) => {
      const issuingBags = Number(lot.noOfBags ?? 0);
      const availableBags = Number(lot.availableBags ?? 0);
      return issuingBags > availableBags;
    });

    if (hasExceedingBags) {
      toast.error("Issuing No of Bags is exceed Available Bags");
      return;
    }

    setIsSubmitting(true);

    try {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      const companyId = storedCompanyId ? Number(storedCompanyId) : null;
      
 const isEditMode = Boolean(editingId || challanData?.id);
       let challanNo = data.challanNo || challanData?.challanNo || "";
            if (!(editingId || challanData?.id) && !challanNo) {
                try {
                    const docResponse = await documentNumberService.generateDocumentNumber({
                        screenName: "Yarn Challan"
                    });
                    challanNo = docResponse.documentNumber;
                } catch (error) {
                    console.warn("Failed to generate document number:", error);
                }
            }
isSavingRef.current = true;

      const resolvedWarehouseId = parseInt(warehouse);

      const itemsPayload = yarnSalesItems.map((item: any) => {
        // Find the corresponding lot for this item to get the warehouseId
        const correspondingLot = selectedLots.find(lot => 
          lot.yarnSalesItemId === item.id
        );
        const lotWarehouseId = correspondingLot?.warehouseId ? Number(correspondingLot.warehouseId) : null;
        
        return {
          id: item.yarnChallanItemId ? Number(item.yarnChallanItemId) : 0,
          yarnSalesItemId: Number(item.id),
          yarnId: item.yarnId ? Number(item.yarnId) : null,
          millId: item.millId ? Number(item.millId) : null,
          warehouseId: lotWarehouseId || resolvedWarehouseId,
          orderQuantity: Number(item.orderQuantity || 0),
          ratePerUnit: Number(item.ratePerUnit || 0),
          uomId: item.uomId ? Number(item.uomId) : null,
          taxableValue: Number(item.taxableValue || 0),
          gstPercentId: item.gstPercentId ? Number(item.gstPercentId) : null,
          gstAmount: Number(item.gstAmount || 0),
          totalAmount: Number(item.totalAmount || 0),
          issueQty: Number(issueQuantities[item.id] || 0),
          invoiceId: item.invoiceId || 0,
          isInvoice: item.isInvoice || 0,
          activeFlag: true
        };
      });

      const yarnIssueDetailsPayload = selectedLots.map((lot) => {
        const parsedId = typeof lot.id === "number"
          ? lot.id
          : Number(lot.id) || Number(lot.uniqueId) || 0;
        const stockDetailsId = lot.yarnInwardStockDetailsId
          ? Number(lot.yarnInwardStockDetailsId)
          : 0;
        return {
          id: parsedId,
          yarnSalesItemId: lot.yarnSalesItemId ? Number(lot.yarnSalesItemId) : 0,
          yarnId: lot.yarnId ? Number(lot.yarnId) : 0,
          millId: lot.millId ? Number(lot.millId) : 0,
          warehouseId: lot.warehouseId ? Number(lot.warehouseId) : resolvedWarehouseId,
          lotNumber: lot.lotNumber,
          availableQty: Number(lot.availableQty ?? 0),
          availableBags: Number(lot.availableBags ?? 0),
          noOfBags: Number(lot.noOfBags ?? 0),
          kgsPerBag: Number(lot.kgsPerBag ?? 0),
          conesPerBag: Number(lot.conesPerBag ?? 0),
          conesWeight: Number(lot.conesWeight ?? 0),
          issueQty: Number(lot.issuedQty ?? lot.issueQty ?? 0),
          activeFlag: true,
          orderItemId: lot.orderItemId ? Number(lot.orderItemId) : 0,
          inwardId: lot.inwardId ? Number(lot.inwardId) : 0,
          inwardTypeId: lot.inwardTypeId ? Number(lot.inwardTypeId) : 0,
          outwardTypeId: 132,
          uomId: lot.uomId ? Number(lot.uomId) : 0,
          inwardQty: lot.inwardQty ? Number(lot.inwardQty) : 0,
          inwardBags: lot.inwardBags ? Number(lot.inwardBags) : 0,
          acceptedQty: lot.acceptedQty ? Number(lot.acceptedQty) : 0,
          rejectedQty: lot.rejectedQty ? Number(lot.rejectedQty) : 0,
          inwardNo: lot.inwardNo || "",
          yarnInwardStockDetailsId: stockDetailsId
        };
      });

      const payload = {
        id: editingId || challanData?.id || 0,
        challanDate: challanDate,
        buyerId: buyerId ? parseInt(buyerId) : 0,
        yarnSalesOrderId: orderNo ? parseInt(orderNo) : 0,
        tareWeight: "",
        grossWeight: grossWeight || "",
        challanNo: challanNo,
        remarks: remarks,
        deliveryAt: deliveryAt,
        consigneeId: selectedConsigneeId || 0,
        companyId: companyId || 0,
        vehicleNo: vehicleNo || "",
        transportId: transportId || null,
        activeFlag: true,
        invoiceId: 0,
        isInvoice: 0,
        items: itemsPayload,
        yarnIssueDetails: yarnIssueDetailsPayload
      };

      if (isEditMode) {
        await dispatch(updateYarnChallan(payload)).unwrap();
      } else {
        const result = await dispatch(createYarnChallan(payload)).unwrap();
        // Store the original yarn issue details for future edits
        if (result && result.data && result.data.id) {
          const preservedKey = `yarnChallan_${result.data.id}_originalDetails`;
          localStorage.setItem(preservedKey, JSON.stringify(yarnIssueDetailsPayload));
        }
         documentNumberService.clearMemoryCache("Yarn Challan");
      }

      navigate("/transaction/yarn-challan-management");

    } catch (error: any) {
      toast.error(error.message || "Failed to save yarn challan");
      console.error("Save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/transaction/yarn-challan-management");
  };

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              {editingId ? "Edit Yarn Challan" : "Create Yarn Challan"}
            </h2>
          </div>

        </div>

        {/* Form Fields */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Yarn Challan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Challan No
                </label>
                <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                    {...register('challanNo')} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Challan Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={challanDate}
                  onChange={(e) => setChallanDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Yarn Sales Order No */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Yarn Sales Order No <span className="text-red-500">*</span>
                </label>
                <CommonSearchableSelect
                  placeholder="Select Yarn Sales Order"
                  value={orderNo}
                  options={yarnSalesOrdersArr.map((yso: any) => ({
                    value: String(yso.id),
                    label: yso.yarnSalesNo || `YS-${yso.id}`,
                    activeFlag: yso.activeFlag ?? true,
                  }))}
                  filterActive
                  onValueChange={(value) => handleOrderNoChange({ target: { value } } as any)}
                  className="w-full"
                />
              </div>
              {/* Buyer Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Buyer Name <span className="text-red-500">*</span>
                </label>
                <CommonSearchableSelect
                  placeholder="Select Buyer"
                  value={buyerId}
                  options={customerListArr.map((buyer: any) => ({
                    value: String(buyer.id),
                    label: buyer.customerName || buyer.name,
                    activeFlag: buyer.activeFlag ?? true,
                  }))}
                  filterActive
                  onValueChange={(selectedId) => {
                    setBuyerId(selectedId);
                    if (selectedId) {
                      const buyer = customerListArr.find((c: any) => String(c.id) === selectedId);
                      setBuyerName(buyer ? (buyer.customerName || buyer.name || "") : "");
                    } else {
                      setBuyerName("");
                    }
                  }}
                  className="w-full"
                />
                {isLoadingAddresses ? (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <p className="text-gray-500">Loading address...</p>
                  </div>
                ) : buyerAddress ? (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <h2 className="font-bold text-[16px] mb-2">Billing To</h2>
                    <div className="space-y-1">
                      <p className="text-sm"><strong>Address:</strong> {buyerAddress}</p>
                      {buyerStateCode && (
                        <p className="text-sm"><strong>State Code:</strong> {buyerStateCode}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Delivery At */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Delivery At <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">
                    (Select from Consignee Master)
                  </span>
                </label>
                <CommonSearchableSelect
                  placeholder="Select Consignee"
                  value={selectedConsigneeId ? String(selectedConsigneeId) : ""}
                  options={(consigneeList || []).map((consignee: any) => ({
                    value: String(consignee.id),
                    label: `${consignee.consigneeName || consignee.name}${consignee.city ? ` - ${consignee.city}` : ""}`,
                    activeFlag: consignee.activeFlag ?? true,
                  }))}
                  filterActive
                  onValueChange={(value) => handleConsigneeChange({ target: { value } } as any)}
                  className="w-full"
                />
                {deliveryAtAddress ? (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <h2 className="font-bold text-[16px] mb-2">Shipping To</h2>
                    <div className="space-y-1">
                      <p className="text-sm"><strong>Address:</strong> {deliveryAtAddress}</p>
                      {deliveryAtStateCode && (
                        <p className="text-sm"><strong>State Code:</strong> {deliveryAtStateCode}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Warehouse */}
              {/* <div>
                <label className="block text-sm font-medium mb-1">
                  Warehouse <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-1">(from Warehouse Master)</span>
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Warehouse</option>
                  {warehouseList.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.warehouseName}</option>
                  ))}
                </select>
              </div> */}

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter remarks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Gross Weight
                </label>
                <input
                  type="number"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter gross weight"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Vehicle No
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter vehicle number (alphanumeric)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Transport Name
                </label>
                <CommonSearchableSelect
                  placeholder="Select Transport"
                  value={transportId ? String(transportId) : ""}
                  options={(Array.isArray(transportList) ? transportList : []).map((transport: any) => ({
                    value: String(transport.id),
                    label: transport.transportName || transport.name || `Transport-${transport.id}`,
                    activeFlag: transport.activeFlag ?? true,
                  }))}
                  filterActive
                  onValueChange={(value) => setTransportId(value ? Number(value) : null)}
                  className="w-full"
                />
              </div>

              {/* Select Bale/Roll Button */}
              {/* <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleOpenBalePopup}
                  className="bg-primary hover:bg-primary text-white w-full"
                  disabled={!fabricCode || !warehouse}
                >
                  <Plus size={18} className="mr-2" />
                  Select Bale/Roll
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {yarnSalesItems.length > 0 && (
          <>
            {/* <Card className="mb-6">
              <CardHeader>
                <CardTitle>Yarn Requirement Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-left">Fabric Details</th>
                        <th className="border p-2 text-left">Yarn Name</th>
                        <th className="border p-2 text-left">Actual Yarn</th>
                        <th className="border p-2 text-left">Warp Meters</th>
                        <th className="border p-2 text-left">Warp Grams/Mtr</th>
                        <th className="border p-2 text-left">Warp Requirement</th>
                        <th className="border p-2 text-left">Total Issued Qty</th>
                        <th className="border p-2 text-left">Balance to Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yarnRequirementDetails.length > 0 ? (
                        <>
                          {yarnRequirementDetails.map((detail, index) => (
                            <tr key={detail.id ?? index}>
                              <td className="border p-2">{detail.fabricDetails}</td>
                              <td className="border p-2">{detail.yarnName}</td>
                              <td className="border p-2">
                                <select
                                  value={detail.actualYarnId ? String(detail.actualYarnId) : ""}
                                  onChange={(e) => handleActualYarnChange(index, e.target.value)}
                                  className="w-full p-1 border rounded"
                                >
                                  <option value="">Select Actual Yarn</option>
                                  {yarnList?.map((yarn: any) => (
                                    <option key={yarn.id} value={yarn.id}>{yarn.yarnName}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="border p-2">{Number(detail.warpMeters || 0).toFixed(2)}</td>
                              <td className="border p-2">{Number(detail.warpGramsPerMeter || 0).toFixed(3)}</td>
                              <td className="border p-2">{Number(detail.warpRequirement || 0).toFixed(3)}</td>
                              <td className="border p-2">{Number(detail.totalIssuedQty || 0).toFixed(3)}</td>
                              <td className="border p-2">{Number(detail.balanceToIssue || 0).toFixed(3)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-semibold">
                            <td className="border p-2" colSpan={5}>Total</td>
                            <td className="border p-2">{requirementTotals.warpRequirement.toFixed(3)}</td>
                            <td className="border p-2">{requirementTotals.totalIssuedQty.toFixed(3)}</td>
                            <td className="border p-2">{requirementTotals.balanceToIssue.toFixed(3)}</td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={8} className="border p-4 text-center text-gray-500">
                            Select a yarn sales order to view requirements
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card> */}
            <Card className="mb-6">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Item Details ({yarnSalesItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-center">S.No</th>
                        <th className="border p-2 text-center">Yarn Name</th>
                        <th className="border p-2 text-center">Mill Name</th>
                        <th className="border p-2 text-center">Order Qty</th>
                        <th className="border p-2 text-center">Total Issued Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yarnSalesItems.map((item: any, index: number) => {
                        const yarn = yarnList?.find((y: any) => y.id === item.yarnId);
                        const mill = subCategoryList?.find((sc: any) => sc.id === item.millId);
                        const issuedQty = Number(issueQuantities[item.id] ?? 0);
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="border p-2 text-center">{index + 1}</td>
                            <td className="border p-2 text-center">{yarn?.yarnName || '-'}</td>
                            <td className="border p-2 text-center">{mill?.subCategoryName || item.millName || '-'}</td>
                            <td className="border p-2 text-center">{parseFloat(item.orderQuantity || 0).toFixed(2)}</td>
                            <td className="border p-2 text-center bg-gray-50">{issuedQty.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold">Overall Issued Qty:</p>
                    <p className="text-xl font-bold text-blue-600">{overallIssuedQty.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Yarn Issue Details</CardTitle>
                <Button
                  type="button"
                  onClick={handleYarnIssue}
                  className="bg-primary hover:bg-primary text-white"
                  disabled={yarnRequirementDetails.length === 0}
                >
                  <Plus size={16} className="mr-2" />
                  YARN ISSUE
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-center">Sl No</th>
                        <th className="border p-2 text-center">Yarn</th>
                        <th className="border p-2 text-center">Mill</th>
                        <th className="border p-2 text-center">Warehouse</th>
                        <th className="border p-2 text-center">Available Bags</th>
                        <th className="border p-2 text-center">Kgs/Bag</th>
                        <th className="border p-2 text-center">Cones/Bag</th>
                        <th className="border p-2 text-center">Cone Weight</th>
                        <th className="border p-2 text-center">Available Qty</th>
                        <th className="border p-2 text-center">Issuing No of Bags</th>
                        <th className="border p-2 text-center">Issue Qty</th>
                        <th className="border p-2 text-center">Lot No</th>
                        <th className="border p-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLots.length > 0 ? (
                        selectedLots.map((lot, index) => {
                          const isEditing = !isDraftSaved || editingRowIndex === index;
                          const millName = millOptions.find((m: any) => String(m.id) === String(lot.millId))?.subCategoryName || '-';
                          const warehouseName = warehouseList.find((w: any) => String(w.id) === String(lot.warehouseId))?.warehouseName || '-';
                          // alert(JSON.stringify(lot));
                          return (
                            <tr key={lot.uniqueId}>
                              <td className="border p-2 text-center">{index + 1}</td>
                              <td className="border p-2 text-center">{lot.originalYarnName || '-'}</td>
                              <td className="border p-2 text-center">{millName}</td>
                              <td className="border p-2 text-center">{warehouseName}</td>
                              <td className="border p-2 text-center">{lot.availableBags}</td>

                              <td className="border p-2 text-center">{Number(lot.kgsPerBag ?? 0).toFixed(3)}</td>
                              <td className="border p-2 text-center">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.001"
                                  value={Number(lot.conesPerBag ?? 0)}
                                  onChange={(e) => {
                                    const conesPerBag = Number(e.target.value || 0);
                                    setSelectedLots((prev) => {
                                      const updated = [...prev];
                                      if (!updated[index]) {
                                        return prev;
                                      }
                                      updated[index] = { ...updated[index], conesPerBag };
                                      return updated;
                                    });
                                    setIsDraftSaved(false);
                                  }}
                                  disabled={!isEditing}
                                  className={`w-full ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                              </td>
                              <td className="border p-2 text-center">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.001"
                                  value={Number(lot.conesWeight ?? 0)}
                                  onChange={(e) => {
                                    const conesWeight = Number(e.target.value || 0);
                                    setSelectedLots((prev) => {
                                      const updated = [...prev];
                                      if (!updated[index]) {
                                        return prev;
                                      }
                                      updated[index] = { ...updated[index], conesWeight };
                                      return updated;
                                    });
                                    setIsDraftSaved(false);
                                  }}
                                  disabled={!isEditing}
                                  className={`w-full ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                              </td>
                              <td className="border p-2 text-center">{Number(lot.availableQty ?? 0).toFixed(3)}</td>
                              <td className="border p-2 text-center">
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  value={Number(lot.noOfBags ?? 0)}
                                  onChange={(e) => {
                                    const bags = Number(e.target.value || 0);
                                    setSelectedLots((prev) => {
                                      const updated = [...prev];
                                      if (!updated[index]) {
                                        return prev;
                                      }
                                      const kgs = Number(updated[index].kgsPerBag ?? 0);
                                      const computed = Number((bags * kgs).toFixed(3));
                                      updated[index] = {
                                        ...updated[index],
                                        noOfBags: bags,
                                        issueQty: computed,
                                        issuedQty: computed
                                      };
                                      return updated;
                                    });
                                    setIsDraftSaved(false);
                                  }}
                                  disabled={!isEditing}
                                  className={`w-full ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                              </td>
                              <td className="border p-2 text-center">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  value={Number(lot.issuedQty ?? 0)}
                                  onChange={(e) => {
                                    const issuedQty = Number(e.target.value || 0);
                                    setSelectedLots((prev) => {
                                      const updated = [...prev];
                                      if (!updated[index]) {
                                        return prev;
                                      }
                                      updated[index] = { ...updated[index], issuedQty, issueQty: issuedQty };
                                      return updated;
                                    });
                                    setIsDraftSaved(false);
                                  }}
                                  disabled={!isEditing}
                                  className={`w-full ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                              </td>
                              <td className="border p-2 text-center">{lot.lotNumber || '-'}</td>
                              {/* <td className="border p-2">{lot.availableBags}</td> */}
                              <td className="border p-2 text-center">
                                <div className="flex gap-2 justify-center">
                                  {isDraftSaved && editingRowIndex !== index && (
                                    <Button size="sm" onClick={() => handleEditLotRow(index)} className="bg-primary hover:bg-primary">
                                      <Edit size={14} />
                                    </Button>
                                  )}
                                  {isDraftSaved && editingRowIndex === index && (
                                    <Button size="sm" onClick={() => handleSaveLotRow(index)} className="bg-primary hover:bg-primary">
                                      <Check size={14} />
                                    </Button>
                                  )}
                                  <Button size="sm" onClick={() => handleDeleteLot(index)} className="bg-red-600 hover:bg-red-700">
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={13} className="border p-4 text-center text-gray-500">
                            No lots selected. Click "YARN ISSUE" to select yarn lots.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* {selectedLots.length > 0 && (
                  <>
                    <div className="flex justify-between items-center mt-4 p-4 bg-blue-50 rounded">
                      <p className="text-sm font-semibold">Overall Issued Qty:</p>
                      <p className="text-xl font-bold text-blue-600">{overallIssuedQty.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={handleSaveDraft}
                        className="bg-primary hover:bg-primary text-white px-6 flex items-center"
                        disabled={isDraftSaved && editingRowIndex === null}
                      >
                        <Save size={18} className="mr-2" />
                        {isDraftSaved ? 'Draft Saved ✓' : 'Save Draft'}
                      </Button>
                    </div>
                  </>
                )} */}
              </CardContent>
            </Card>
          </>
        )}

        <Dialog
          open={showIssuePopup}
          onOpenChange={(open) => {
            if (!open) {
              setShowIssuePopup(false);
              setPendingLotIds(selectedLotIds);
              setLotWarehouseFilter("");
            }
          }}
        >
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <div className="flex gap-8">
                <div>
                  <DialogTitle>Yarn Challan Issue Lots</DialogTitle>
                  {selectedYarnSalesOrder?.yarnSalesNo && (
                    <p className="text-sm text-gray-500">Sales Order: {selectedYarnSalesOrder.yarnSalesNo}</p>
                  )}
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Warehouse <span className="text-red-500">*</span>
                    </label>
                    <CommonSearchableSelect
                      placeholder="All Warehouses"
                      value={lotWarehouseFilter}
                      options={warehouseList.map((w: any) => ({
                        value: String(w.id),
                        label: w.warehouseName,
                        activeFlag: w.activeFlag ?? true,
                      }))}
                      filterActive
                      onValueChange={(value) => setLotWarehouseFilter(value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full border-collapse border">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border p-2">Select</th>
                    <th className="border p-2 text-left">Yarn Name</th>
                    <th className="border p-2 text-left">Lot No</th>
                    <th className="border p-2 text-left">Inward Type</th>
                    {/* <th className="border p-2 text-left">Accepted Qty</th> */}
                    <th className="border p-2">Available Bags</th>
                    <th className="border p-2">Kgs/Bag</th>
                    <th className="border p-2">Cones/Bag</th>
                    <th className="border p-2">Cone Weight</th>
                    <th className="border p-2 text-left">Available Qty</th>
                    {/* <th className="border p-2 text-left">Order Qty</th> */}
                    {/* <th className="border p-2 text-left">UOM</th> */}
                    <th className="border p-2 text-left">Mill</th>
                    <th className="border p-2 text-left">Warehouse</th>
                  </tr>
                </thead>
                <tbody>
                  {isIssuePopupLoading ? (
                    <tr>
                      <td colSpan={11} className="border p-4 text-center text-gray-500">
                        Loading yarn stock...
                      </td>
                    </tr>
                  ) : filteredYarnLots.length > 0 ? (
                    filteredYarnLots.map((lot: any) => {
                      const isSelected = pendingLotIds.includes(lot.uniqueKey);
                      const disabled = !lot.yarnSalesItemId;
                      return (
                        <tr
                          key={lot.uniqueKey}
                          className={`${isSelected ? "bg-blue-50" : ""} ${disabled ? "opacity-60" : ""}`}
                        >
                          <td className="border p-2 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() => togglePendingLot(lot.uniqueKey, disabled)}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="border p-2">{lot.yarnName}</td>
                          <td className="border p-2">{lot.lotNumber}</td>
                          <td className="border p-2">{lot.inwardType || '-'}</td>
                          <td className="border p-2">{lot.availableBags}</td>
                          <td className="border p-2">{lot.kgsPerBag}</td>
                          <td className="border p-2">{Number(lot.conesPerBag ?? 0).toFixed(3)}</td>
                          <td className="border p-2">{Number(lot.conesWeight ?? 0).toFixed(3)}</td>
                          {/* <td className="border p-2 text-right">{lot.acceptedQty.toFixed(3)}</td> */}
                          <td className="border p-2 text-right">{lot.availableQty.toFixed(3)}</td>
                          {/* <td className="border p-2 text-right">
                            {lot.yarnSalesQty ? lot.yarnSalesQty.toFixed(2) : "-"}
                          </td> */}
                          {/* <td className="border p-2">{lot.uomName || '-'}</td> */}
                          <td className="border p-2">{lot.millName || '-'}</td>
                          <td className="border p-2">{lot.warehouseName || '-'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="border p-4 text-center text-gray-500">
                        {lotWarehouseFilter ? "No yarn stock available for the selected warehouse." : "No yarn stock available for this sales order."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowIssuePopup(false);
                  setPendingLotIds(selectedLotIds);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmLotSelection} disabled={pendingLotIds.length === 0}>
                Confirm Selection ({pendingLotIds.length})
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rest of your component remains the same... */}
        {/* Selected Bales/Rolls Table */}
        {selectedBales.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Piece Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">S.No</th>
                      <th className="border p-2 text-left">Roll No</th>
                      <th className="border p-2 text-left">Piece No</th>
                      <th className="border p-2 text-left">Meters</th>
                      <th className="border p-2 text-left">Yards</th>
                      <th className="border p-2 text-left">Net Weight</th>
                      <th className="border p-2 text-left">Avg Wt</th>
                      <th className="border p-2 text-left">Gross Wt</th>
                      <th className="border p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBales.map((bale, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">{index + 1}</td>
                        <td className="border p-2">{bale.rollNo}</td>
                        <td className="border p-2">{bale.pieceNo}</td>
                        <td className="border p-2">{bale.meters.toFixed(2)}</td>
                        <td className="border p-2">{bale.yards.toFixed(2)}</td>
                        <td className="border p-2">{bale.netWeight.toFixed(2)}</td>
                        <td className="border p-2">{bale.avgWt.toFixed(3)}</td>
                        <td className="border p-2">{bale.grossWt > 0 ? bale.grossWt.toFixed(2) : "-"}</td>
                        <td className="border p-2 text-center">
                          <button
                            onClick={() => handleRemoveBale(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        {/* 
        <Card>
          <CardHeader>
            <CardTitle>Piece Details Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">No of Bales/Rolls</p>
                <p className="text-lg font-bold">{summary.noOfBalesRolls}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">Total Pieces</p>
                <p className="text-lg font-bold">{summary.totalPieces}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">Total Meters</p>
                <p className="text-lg font-bold">{summary.totalMeters.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">Total Yards</p>
                <p className="text-lg font-bold">{summary.totalYards.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">Total Net Wt</p>
                <p className="text-lg font-bold">{summary.totalNetWt.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">Total Avg Wt</p>
                <p className="text-lg font-bold">{summary.totalAvgWt.toFixed(3)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-xs text-gray-600 mb-1">Total Gross Wt</p>
                <p className="text-lg font-bold">{summary.totalGrossWt.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>

          <Button
            onClick={handleSubmit(handleSave)}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary text-white px-6 flex items-center"
          >
            <Save size={18} className="mr-2" />
            {isSubmitting ? "Saving..." : (editingId ? "Update" : "Save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default YarnChallan;