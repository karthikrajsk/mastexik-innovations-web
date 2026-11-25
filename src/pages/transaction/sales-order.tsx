import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, ShoppingCart, ClipboardList, Plus, Edit, Trash2, Save, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { createSalesOrder, getAllSalesOrders, updateSalesOrder } from "@/state/salesOrderSlice";
import { getAllCustomers, getInternationalCustomers } from "@/state/customerSlice";
import { getAllCurrencies } from "@/state/currencySlice";
import { getAllShipmentTerms } from "@/state/shipmentTermsSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllShipmentModes } from "@/state/shipmentModeSlice";
import { getAllFabricTypes } from "@/state/fabricTypeSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllFabricCategory } from "@/state/fabricCategorySlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllCities } from "@/state/citySlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCountries } from "@/state/countrySlice";
import { getCompanyById } from "@/state/company-master-slice";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import documentNumberService from "@/services/DocumentNumberService";

interface salesOrderFormData {
  id?: number;
  orderDate: string;
  buyerPoNo: string;
  buyerCustomerId: string;
  deliverToId: string;
  deliverToAddressId: string;
  currencyId: string;
  packingTypeId: string;
  exchangeRate: string;
  modeOfShipmentId: string;
  shipmentTermsId: string;
  paymentTermsId: string;
  termsConditionsId: string;
  gstOption: string;
  internalOrderNo: string;
  salesOrderNo: string;
  SalesOrderItem: SalesOrderItem[];
  taxId: string;
  isComplete?: number;
  companyId?: string;
  department?: string;
}

interface SalesOrderItem {
  fabricTypeId: string;
  fabricMasterId: string;
  fabricCategoryId: string;
  fabricId: string;
  quality: string;
  buyerProduct: string;
  orderQty: string;
  pricePerUnit: string;
  discountType?: string;
  discountValue?: string;
  discountAmount?: string;
  netPricePerUnit?: string;
  uom: string;
  gstPercent: string;
  gstAmount: string;
  finalAmount: string;
  deliveryDate: string;
  remarks: string;
  totalAmount: string;
  fabricMasterTypeId: string;
  cgstPercent?: string;
  sgstPercent?: string;
  igstPercent?: string;
  cgstAmount?: string;
  sgstAmount?: string;
  igstAmount?: string;
  fabricCode?: string;
}

interface SalesOrderSequenceInfo {
  prefix: string;
  sequence: number;
  padding: number;
}

interface DeliverToOption {
  consigneeId: string;
  consigneeName: string;
  addressId: string;
  addressLine: string;
  fullAddress: any;
}

// const extractSalesOrderSequence = (value: string | null | undefined): SalesOrderSequenceInfo | null => {
//   if (!value) return null;
//   const match = value.match(/(\d+)(?!.*\d)/);
//   if (!match) return null;
//   const digits = match[1];
//   const index = typeof match.index === 'number' ? match.index : value.length - digits.length;
//   const numericSequence = Number(digits);
//   if (Number.isNaN(numericSequence)) return null;
//   return {
//     prefix: value.slice(0, index),
//     sequence: numericSequence,
//     padding: digits.length
//   };
// };

const normalizeSalesOrders = (list: any): any[] => {
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data?.data)) return list.data.data;
  if (Array.isArray(list?.data)) return list.data;
  return [];
};

const resolveOrderTypeValue = (order: any): number => {
  const numericCandidate = Number(order?.exportType ?? order?.orderTypeId ?? order?.orderType ?? order?.tradeTypeId ?? order?.type);
  if (!Number.isNaN(numericCandidate) && numericCandidate > 0) {
    return numericCandidate;
  }
  const textCandidate = String(order?.orderType ?? order?.type ?? '').toLowerCase();
  if (textCandidate.includes('export')) return 2;
  if (textCandidate.includes('domestic')) return 1;
  return 1;
};

const matchesTabType = (order: any, tabType: number) => {
  const typeValue = resolveOrderTypeValue(order);
  return tabType === 2 ? typeValue === 2 : typeValue !== 2;
};

// const getHighestSalesOrderSequence = (orders: any[], tabType: number): SalesOrderSequenceInfo | null => {
//   let info: SalesOrderSequenceInfo | null = null;
//   orders.forEach((order) => {
//     if (!matchesTabType(order, tabType)) {
//       return;
//     }
//     const details = extractSalesOrderSequence(order?.salesOrderNo || order?.orderNo || '');
//     if (details && (!info || details.sequence > info.sequence)) {
//       info = details;
//     }
//   });
//   return info;
// };

const mapBackendItemToFrontend = (item: any, taxId: string, fabricMasterData: any) => {
  const fabricList = Array.isArray(fabricMasterData) ? fabricMasterData : [];
  let fabricCode = item.fabricCode || '';

  if (!fabricCode && item.fabricMasterId && fabricList.length > 0) {
    const fabric = fabricList.find((f: any) => f.id === item.fabricMasterId);
    fabricCode = fabric?.fabricCode || fabric?.fabric_code || '';
  }

  const gstPercent = item.gstPercent || 0;
  const gstAmount = item.gstAmount || 0;

  let cgstPercent = '', sgstPercent = '', igstPercent = '', cgstAmount = '', sgstAmount = '', igstAmount = '';

  if (taxId === '1') {
    cgstPercent = (gstPercent / 2).toString();
    sgstPercent = (gstPercent / 2).toString();
    cgstAmount = (gstAmount / 2).toString();
    sgstAmount = (gstAmount / 2).toString();
  } else {
    igstPercent = gstPercent.toString();
    igstAmount = gstAmount.toString();
  }

  const pricePerUnit = item.pricePerUnit?.toString() || '';
  const discountType = item.discountType || 'Percentage';
  const discountValue = item.discountValue !== undefined && item.discountValue !== null ? item.discountValue.toString() : '0';
  const discountAmount = item.discountAmount !== undefined && item.discountAmount !== null ? item.discountAmount.toString() : '0';
  const netPricePerUnit = item.netPricePerUnit !== undefined && item.netPricePerUnit !== null ? item.netPricePerUnit.toString() : pricePerUnit;

  return {
    fabricTypeId: item.fabricTypeId?.toString() || '',
    fabricMasterId: item.fabricMasterId?.toString() || '',
    fabricCategoryId: item.fabricCategoryId?.toString() || '',
    fabricId: '',
    quality: item.quality || '',
    buyerProduct: item.buyerProduct || '',
    orderQty: item.orderQty?.toString() || '',
    pricePerUnit: pricePerUnit,
    discountType: discountType,
    discountValue: discountValue,
    discountAmount: discountAmount,
    netPricePerUnit: netPricePerUnit,
    uom: item.uomId?.toString() || '',
    gstPercent: gstPercent.toString(),
    gstAmount: gstAmount.toString(),
    finalAmount: item.finalAmount?.toString() || '',
    deliveryDate: item.deliveryDate ? item.deliveryDate.slice(0, 10) : '',
    remarks: item.remarks || '',
    totalAmount: item.totalAmount?.toString() || '',
    fabricMasterTypeId: item.fabricMasterTypeId?.toString() || '',
    cgstPercent,
    sgstPercent,
    igstPercent,
    cgstAmount,
    sgstAmount,
    igstAmount,
    fabricCode,
  };
};

const SalesOrderEntry = () => {
  const [items, setItems]: any = useState([]);
  const [salesOrderNo, setSalesOrderNo] = useState("");
  const [isSalesOrderNoLoading, setIsSalesOrderNoLoading] = useState(false);
  const [newItem, setNewItem] = useState<SalesOrderItem>({
    fabricTypeId: "1",
    fabricMasterId: "",
    fabricCategoryId: "1",
    fabricId: "",
    quality: "",
    buyerProduct: "",
    orderQty: "",
    pricePerUnit: "",
    discountType: "Percentage",
    discountValue: "",
    discountAmount: "",
    netPricePerUnit: "",
    uom: "1",
    gstPercent: "",
    gstAmount: "",
    finalAmount: "",
    deliveryDate: "",
    remarks: "",
    totalAmount: "",
    fabricMasterTypeId: "1",
    cgstPercent: "",
    sgstPercent: "",
    igstPercent: "",
    cgstAmount: "",
    sgstAmount: "",
    igstAmount: "",
    fabricCode: "",
  });
  const [editingIndex, setEditingIndex]: any = useState(null);
  const [activeTab, setActiveTab] = useState("orderDetails");
  const [taxType, setTaxType] = useState("IGST");

  const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const { fabricCategoryFullList: fabricCategoryList } = useSelector((state: RootState) => state.fabricCategoty);
  const { customerList, internationalCustomerList } = useSelector((state: RootState) => state.customer);
  const { currencyList } = useSelector((state: RootState) => state.currency);
  const { shipmentTermsList } = useSelector((state: RootState) => state.shipmentTerms);
  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
  const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
  const { shipmentModesList } = useSelector((state: RootState) => state.shipmentMode);
  const { fabricTypeList } = useSelector((state: RootState) => state.fabricType);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const { cityList } = useSelector((state: RootState) => state.city);
  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const { fabricMasterList: fabricMasterData } = useSelector((state: RootState) => state.fabricMaster);

  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const salesOrderdetail = location.state?.salesOrderdetail;
  const tabType = location.state?.tab ?? 1;
  const navigate = useNavigate();
  const filteredCustomerList = useMemo(() => {
    const domesticArr = Array.isArray(customerList) ? customerList : (customerList as any)?.data || [];
    const internationalArr = Array.isArray(internationalCustomerList) ? internationalCustomerList : (internationalCustomerList as any)?.data || [];

    // Combine both lists and remove duplicates by ID
    const allCustomers = [...domesticArr, ...internationalArr];
    const uniqueCustomers = Array.from(new Map(allCustomers.map(c => [c.id, c])).values())
      .filter((c: any) => c.activeFlag !== false);

    // Trade Type IDs: Domestic = 201, Export = 202
    if (tabType === 2) {
      return uniqueCustomers.filter((c: any) => String(c.tradeTypeId) === '202');
    } else {
      // For domestic, include 201 and those without a tradeTypeId for backward compatibility
      return uniqueCustomers.filter((c: any) => String(c.tradeTypeId) === '201' || !c.tradeTypeId);
    }
  }, [tabType, customerList, internationalCustomerList]);

  const filteredConsigneeList = useMemo(() => {
    return (Array.isArray(consigneeList) ? consigneeList : (consigneeList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [consigneeList]);

  const filteredCurrencyList = useMemo(() => {
    return (Array.isArray(currencyList) ? currencyList : (currencyList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [currencyList]);

  const filteredShipmentModesList = useMemo(() => {
    return (Array.isArray(shipmentModesList) ? shipmentModesList : (shipmentModesList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [shipmentModesList]);

  const filteredShipmentTermsList = useMemo(() => {
    return (Array.isArray(shipmentTermsList) ? shipmentTermsList : (shipmentTermsList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [shipmentTermsList]);

  const filteredPaymentTermsList = useMemo(() => {
    return (Array.isArray(paymentTermsList) ? paymentTermsList : (paymentTermsList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [paymentTermsList]);

  const filteredTermsConditionsList = useMemo(() => {
    return (Array.isArray(termsContitionsList) ? termsContitionsList : (termsContitionsList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [termsContitionsList]);

  const filteredFabricTypeList = useMemo(() => {
    return (Array.isArray(fabricTypeList) ? fabricTypeList : (fabricTypeList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [fabricTypeList]);

  const filteredFabricCategoryList = useMemo(() => {
    return (Array.isArray(fabricCategoryList) ? fabricCategoryList : (fabricCategoryList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [fabricCategoryList]);

  const filteredFabricMasterData = useMemo(() => {
    return (Array.isArray(fabricMasterData) ? fabricMasterData : (fabricMasterData as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [fabricMasterData]);

  const filteredUomList = useMemo(() => {
    return (Array.isArray(uomList) ? uomList : (uomList as any)?.data || [])
      .filter((item: any) => item.activeFlag !== false);
  }, [uomList]);

  const toNumber = (v: any) => {
    const n = parseFloat(String(v));
    return isNaN(n) ? 0 : n;
  };

  const getNumericGramsPerMeter = (details: any): number => {
    if (!Array.isArray(details) || details.length === 0) {
      return 0;
    }
    return details.reduce((sum: number, detail: any) => {
      const grams = toNumber(detail?.gramsPerMeter);
      return sum + grams;
    }, 0);
  };

  const getWeightDetailsByOrderQty = (details: any, orderQty: number): number[] => {
    if (!Array.isArray(details) || details.length === 0) return [];
    return details.map((detail: any) => {
      const grams = toNumber(detail?.gramsPerMeter);
      return Number((grams * orderQty).toFixed(2));
    });
  };

  const resolveFabricMasterRecord = (item: any) => {
    if (!item) return null;

    const fabricId = item.fabricMasterId || item.fabricId || item.fabricMasterId;
    const fabricCodeValue = String(item.fabricCode || item.fabricCode || '').trim();
    const fabricList = Array.isArray(filteredFabricMasterData) ? filteredFabricMasterData : [];

    if (fabricId) {
      const recordById = fabricList.find((record: any) => String(record?.id) === String(fabricId));
      if (recordById) return recordById;
    }

    if (fabricCodeValue) {
      const normalizedCode = fabricCodeValue.toLowerCase();
      return fabricList.find((record: any) =>
        String(record?.fabricCode || record?.code || '')
          .trim()
          .toLowerCase() === normalizedCode
      );
    }

    return null;
  };

  const yarnRequirementRows = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.map((item: any, index: number) => {
      const fabricMaster = resolveFabricMasterRecord(item);
      const orderQty = toNumber(item.orderQty);
      const warpValues = getWeightDetailsByOrderQty(fabricMaster?.warpDetails, orderQty);
      const weftValues = getWeightDetailsByOrderQty(fabricMaster?.weftDetails, orderQty);
      const totalValue = Number([
        ...warpValues,
        ...weftValues
      ].reduce((sum: number, value: number) => sum + value, 0).toFixed(2));

      const fabricCode = item.fabricCode || String(fabricMaster?.fabricCode || fabricMaster?.code || '').trim() || '-';

      return {
        serial: index + 1,
        fabricCode,
        orderQty: orderQty ? orderQty.toString() : '',
        warpValues,
        weftValues,
        total: totalValue,
      };
    });
  }, [items, filteredFabricMasterData]);

  const maxWarpColumns = useMemo(() => {
    return yarnRequirementRows.reduce((max: number, row: any) => {
      return Math.max(max, Array.isArray(row.warpValues) ? row.warpValues.length : 0);
    }, 0);
  }, [yarnRequirementRows]);

  const maxWeftColumns = useMemo(() => {
    return yarnRequirementRows.reduce((max: number, row: any) => {
      return Math.max(max, Array.isArray(row.weftValues) ? row.weftValues.length : 0);
    }, 0);
  }, [yarnRequirementRows]);

  const [isItemsValid, setIsItemsValid] = useState(false);
  const [fabricTypeIdError, setFabricTypeIdError] = useState("");
  const [fcIdError, setFcIdError] = useState("");
  const [fabricIdError, setFabricIdError] = useState("");
  const [fabricCodeDuplicateError, setFabricCodeDuplicateError] = useState("");
  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [buyerStateCode, setBuyerStateCode] = useState<string>('');
  const [deliverToAddress, setDeliverToAddress] = useState<string>('');
  const [deliverToStateCode, setDeliverToStateCode] = useState<string>('');
  const [companyStateCode, setCompanyStateCode] = useState<string>('');
  const [isDeliverToDropdownOpen, setIsDeliverToDropdownOpen] = useState(false);
  const [selectedDeliverToOption, setSelectedDeliverToOption] = useState<DeliverToOption | null>(null);
  const currentDate = new Date().toISOString().slice(0, 10);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [uomError, setUomError] = useState("");
  const [buyerProductError, setBuyerProductError] = useState("");
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [previousPrices, setPreviousPrices] = useState<any[]>([]);
  const hasGeneratedNumberRef = useRef(false);
  const isSavingRef = useRef(false);
  const { user, selectedCompany } = useAuth();
  
  const userRole = (user?.role || '').trim().toLowerCase();
  const capitalizedRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()) : '';
  const isDeptSpecific = ['weaving', 'brushing', 'garments'].includes(userRole);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<salesOrderFormData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      orderDate: currentDate,
      salesOrderNo: salesOrderdetail?.salesOrderNo || "Loading sequence...",
      department: isDeptSpecific ? capitalizedRole : "",
    }
  });

  const selectedDepartment = watch('department');

  useEffect(() => {
    if (salesOrderdetail?.id) return; // Don't generate in edit mode

    const generateNumberForDept = async () => {
      setIsSalesOrderNoLoading(true);
      setValue('salesOrderNo', 'Loading sequence...');
      setSalesOrderNo('Loading sequence...');
      try {
        const tabName = tabType === 2 ? 'export' : 'domestic';
        const deptSuffix = selectedDepartment ? `-${selectedDepartment.toLowerCase()}` : '';
        const fullTabName = `${tabName}${deptSuffix}`;

        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: 'Sales Order Management',
          tabName: fullTabName
        });

        console.log(`Generated sales order number for ${fullTabName}:`, docResponse.documentNumber);
        setSalesOrderNo(docResponse.documentNumber);
        setValue('salesOrderNo', docResponse.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.warn('Failed to generate sales order number:', error);
        hasGeneratedNumberRef.current = false;
      } finally {
        setIsSalesOrderNoLoading(false);
      }
    };

    generateNumberForDept();
  }, [selectedDepartment, tabType, salesOrderdetail?.id, setValue]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!salesOrderdetail?.id && hasGeneratedNumberRef.current && !isSavingRef.current) {
        const tabName = tabType === 2 ? 'export' : 'domestic';
        const deptSuffix = selectedDepartment ? `-${selectedDepartment.toLowerCase()}` : '';
        const fullTabName = `${tabName}${deptSuffix}`;
        documentNumberService.clearMemoryCache('Sales Order Management', fullTabName);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!salesOrderdetail?.id && hasGeneratedNumberRef.current && !isSavingRef.current) {
        const tabName = tabType === 2 ? 'export' : 'domestic';
        const deptSuffix = selectedDepartment ? `-${selectedDepartment.toLowerCase()}` : '';
        const fullTabName = `${tabName}${deptSuffix}`;
        documentNumberService.clearMemoryCache('Sales Order Management', fullTabName);
      }
    };
  }, [selectedDepartment, tabType, salesOrderdetail?.id]);

  useEffect(() => {
    register('salesOrderNo');
  }, [register]);

  const selectedTaxId = watch('taxId');
  const selectedBuyerCustomerId = watch('buyerCustomerId');
  const selectedDeliverToId = watch('deliverToId');
  const selectedCurrencyId = watch('currencyId');

  const getCurrencySymbol = (currencyId: string) => {
    if (!currencyId) return '₹';
    const currency = currencyList.find((c: any) => c.id.toString() === currencyId);
    return currency?.symbol || '₹';
  };

  const currencySymbol = getCurrencySymbol(selectedCurrencyId);

  const normalizedSalesOrders = useMemo(() => normalizeSalesOrders(salesOrderList), [salesOrderList]);
  // const highestSequenceInfo = useMemo(() => getHighestSalesOrderSequence(normalizedSalesOrders, Number(tabType) || 1), [normalizedSalesOrders, tabType]);

  const getDefaultSalesOrderNumber = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const financialYear = `${currentYear % 100}-${nextYear % 100}`;
    return `DOC/${financialYear}/000001`;
  };

  // const buildNextSalesOrderNoFromExisting = useCallback(() => {
  //   if (!highestSequenceInfo) return '';
  //   const nextSequenceValue = highestSequenceInfo.sequence + 1;
  //   const padLength = Math.max(highestSequenceInfo.padding, String(highestSequenceInfo.sequence).length);
  //   const padded = nextSequenceValue.toString().padStart(padLength, '0');
  //   return `${highestSequenceInfo.prefix}${padded}`;
  // }, [highestSequenceInfo]);

  const isFormValid = isValid &&
    items.length > 0 &&
    items.every((item: any) => item.fabricMasterId && item.uom && item.buyerProduct);

  useEffect(() => {
    // const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const storedCompanyId = selectedCompany || 0;
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getInternationalCustomers({ fetchAll: true }));
    dispatch(getAllCurrencies({ fetchAll: true }));
    dispatch(getAllShipmentTerms({ fetchAll: true }));
    dispatch(getAllTermsConditions({ fetchAll: true }));
    dispatch(getAllShipmentModes({ fetchAll: true }));
    dispatch(getAllFabricTypes({ fetchAll: true }));
    dispatch(getAllConsignee({ fetchAll: true }));
    dispatch(getAllPaymentTerms({ fetchAll: true }));
    dispatch(getAllFabricCategory({ fetchAll: true }));
    dispatch(getAllFabricMasters({ fetchAll: true }));
    dispatch(getAllUomMaster({ fetchAll: true }));
    dispatch(getAllCities({ fetchAll: true }));
    dispatch(getAllStates({ fetchAll: true }));
    dispatch(getAllCountries({ fetchAll: true }));
    if (storedCompanyId) {
      dispatch(getAllSalesOrders({ companyId: Number(storedCompanyId) }));
    }

    try {
      if (storedCompanyId) {
        dispatch(getCompanyById({ id: Number(storedCompanyId) }))
          .unwrap?.()
          .then((res: any) => {
            const companyData = res?.data || res;
            const addressArr = companyData?.address || companyData?.data?.address || [];
            const defaultAddr = Array.isArray(addressArr)
              ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
              : null;
            const code = defaultAddr?.stateCode || '';
            setCompanyStateCode(code);
          })
          .catch(() => { });
      }
    } catch { }
  }, [dispatch, salesOrderdetail?.id, selectedCompany]);

  useEffect(() => {
    console.log('companyStateCode changed:', companyStateCode);
  }, [companyStateCode]);

  useEffect(() => {
    console.log('buyerStateCode changed:', buyerStateCode);
  }, [buyerStateCode]);

  useEffect(() => {
    console.log('Auto-selecting GST Type - Company:', companyStateCode, 'Buyer:', buyerStateCode);
    if (!buyerStateCode || !companyStateCode) return;
    const newTaxId = buyerStateCode === companyStateCode ? '1' : '2';
    console.log('Setting taxId to:', newTaxId);
    setValue('taxId', newTaxId, { shouldValidate: true, shouldDirty: false });
  }, [buyerStateCode, companyStateCode, setValue]);

  const getCityName = (cityId: string, cityList: any[]) => {
    if (!cityId || !cityList || cityList.length === 0) return '';
    const city = cityList.find((c: any) =>
      c.id.toString() === cityId.toString() || c.id === parseInt(cityId)
    );
    return city ? city.cityName : '';
  };

  const getStateName = (stateId: string, stateList: any[]) => {
    if (!stateId || !stateList || stateList.length === 0) return '';
    const state = stateList.find((s: any) =>
      s.id.toString() === stateId.toString() || s.id === parseInt(stateId)
    );
    return state ? state.stateName : '';
  };

  const getCountryName = (countryId: string, countryList: any[]) => {
    if (!countryId || !countryList || countryList.length === 0) return '';
    const country = countryList.find((c: any) =>
      c.id.toString() === countryId.toString() || c.id === parseInt(countryId)
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

  const deliverToOptions = useMemo(() => {
    const options: DeliverToOption[] = [];
    
    filteredConsigneeList.forEach((consignee: any) => {
      const addresses = consignee.address || consignee.addresses || [];
      const addressArray = Array.isArray(addresses) 
        ? addresses.filter((a: any) => a && a.activeFlag !== false) 
        : [addresses].filter((a: any) => a && a.activeFlag !== false);
      
      if (addressArray.length === 0) {
        options.push({
          consigneeId: String(consignee.id),
          consigneeName: consignee.consigneeName,
          addressId: '',
          addressLine: '',
          fullAddress: null
        });
      } else {
        addressArray.forEach((addr: any) => {
          const addrFormatted = formatCompleteAddress(addr, cityList, stateList, countryList);
          options.push({
            consigneeId: String(consignee.id),
            consigneeName: consignee.consigneeName,
            addressId: addr.id ? String(addr.id) : '',
            addressLine: addrFormatted || addr.line1 || '',
            fullAddress: addr
          });
        });
      }
    });
    
    return options;
  }, [filteredConsigneeList, cityList, stateList, countryList]);

  const handleDeliverToSelection = (option: DeliverToOption) => {
    setSelectedDeliverToOption(option);
    setValue('deliverToId', option.consigneeId);
    setValue('deliverToAddressId', option.addressId);
    setIsDeliverToDropdownOpen(false);

    const completeAddress = formatCompleteAddress(
      option.fullAddress,
      cityList,
      stateList,
      countryList
    );
    setDeliverToAddress(completeAddress || '');
    setDeliverToStateCode(option.fullAddress?.stateCode || '');
  };

  const clearDeliverToSelection = () => {
    setSelectedDeliverToOption(null);
    setValue('deliverToId', '');
    setValue('deliverToAddressId', '');
    setDeliverToAddress('');
    setDeliverToStateCode('');
  };

  useEffect(() => {
    if (salesOrderdetail) {
      reset({
        orderDate: salesOrderdetail.orderDate ? salesOrderdetail.orderDate.slice(0, 10) : currentDate,
        buyerPoNo: salesOrderdetail.buyerPoNo || "",
        buyerCustomerId: salesOrderdetail.buyerCustomerId ? String(salesOrderdetail.buyerCustomerId) : "",
        deliverToId: salesOrderdetail.deliverToId ? String(salesOrderdetail.deliverToId) : "",
        deliverToAddressId: salesOrderdetail.deliverToAddressId ? String(salesOrderdetail.deliverToAddressId) : "",
        currencyId: salesOrderdetail.currencyId ? String(salesOrderdetail.currencyId) : "",
        exchangeRate: salesOrderdetail.exchangeRate ? String(salesOrderdetail.exchangeRate) : "",
        modeOfShipmentId: salesOrderdetail.modeOfShipmentId ? String(salesOrderdetail.modeOfShipmentId) : "",
        shipmentTermsId: salesOrderdetail.shipmentTermsId ? String(salesOrderdetail.shipmentTermsId) : "",
        paymentTermsId: salesOrderdetail.paymentTermsId ? String(salesOrderdetail.paymentTermsId) : "",
        termsConditionsId: salesOrderdetail.termsConditionsId ? String(salesOrderdetail.termsConditionsId) : "",
        packingTypeId: salesOrderdetail.packingTypeId ? String(salesOrderdetail.packingTypeId) : "",
        salesOrderNo: salesOrderdetail.salesOrderNo ? String(salesOrderdetail.salesOrderNo) : "",
        internalOrderNo: salesOrderdetail.internalOrderNo ? String(salesOrderdetail.internalOrderNo) : "",
        taxId: salesOrderdetail.taxId ? String(salesOrderdetail.taxId) : "",
        department: salesOrderdetail.department || (isDeptSpecific ? capitalizedRole : ""),
      });
      setSalesOrderNo(salesOrderdetail.salesOrderNo || "");

      if (salesOrderdetail.buyerCustomerId) {
        const buyerCust = filteredCustomerList.find((c: any) => c.id === salesOrderdetail.buyerCustomerId);
        if (buyerCust?.address) {
          const completeAddress = formatCompleteAddress(
            buyerCust.address,
            cityList,
            stateList,
            countryList
          );
          setBuyerAddress(completeAddress || '');
          setBuyerStateCode(buyerCust.address.stateCode || '');
        }
      }

      if (salesOrderdetail.deliverToId) {
        const resolvedAddressId = salesOrderdetail.deliverToAddressId
          ? String(salesOrderdetail.deliverToAddressId)
          : null;
        const matchingOption = deliverToOptions.find(
          option => option.consigneeId === String(salesOrderdetail.deliverToId) &&
                   (!resolvedAddressId || option.addressId === resolvedAddressId)
        );
        
        if (matchingOption) {
          setSelectedDeliverToOption(matchingOption);
          const completeAddress = formatCompleteAddress(
            matchingOption.fullAddress,
            cityList,
            stateList,
            countryList
          );
          setDeliverToAddress(completeAddress || '');
          setDeliverToStateCode(matchingOption.fullAddress?.stateCode || '');
        } else {
          const delTo = filteredConsigneeList.find((c: any) => String(c.id) === String(salesOrderdetail.deliverToId));
          if (delTo) {
            const addressArr = Array.isArray(delTo.address) ? delTo.address : (delTo.address ? [delTo.address] : []);
            const firstAddr = addressArr.find((a: any) => a.activeFlag !== false) || addressArr[0];
            if (firstAddr) {
              const completeAddress = formatCompleteAddress(firstAddr, cityList, stateList, countryList);
              setDeliverToAddress(completeAddress || '');
              setDeliverToStateCode(firstAddr.stateCode || '');
              setSelectedDeliverToOption({
                consigneeId: String(delTo.id),
                consigneeName: delTo.consigneeName,
                addressId: String(firstAddr.id),
                addressLine: firstAddr.line1 || '',
                fullAddress: firstAddr
              });
            }
          }
        }
      }

      const orderTaxId = String(salesOrderdetail.taxId || 1);
      if (Array.isArray(salesOrderdetail.items) && Array.isArray(fabricMasterData) && fabricMasterData.length > 0) {
        const processedItems = salesOrderdetail.items.map((item: any) =>
          mapBackendItemToFrontend(item, orderTaxId, fabricMasterData)
        );
        setItems(processedItems);
      } else if (Array.isArray(salesOrderdetail.items)) {
        const processedItems = salesOrderdetail.items.map((item: any) =>
          mapBackendItemToFrontend(item, orderTaxId, [])
        );
        setItems(processedItems);
      } else {
        setItems([]);
      }
    }
  }, [salesOrderdetail, reset, filteredCustomerList, filteredConsigneeList, currentDate, cityList, stateList, countryList, fabricMasterData, deliverToOptions]);

  useEffect(() => {
    if (salesOrderdetail && Array.isArray(salesOrderdetail.items) && Array.isArray(fabricMasterData) && fabricMasterData.length > 0) {
      const orderTaxId = String(salesOrderdetail.taxId || 1);
      const processedItems = salesOrderdetail.items.map((item: any) =>
        mapBackendItemToFrontend(item, orderTaxId, fabricMasterData)
      );
      setItems(processedItems);
    }
  }, [fabricMasterData, salesOrderdetail]);

  useEffect(() => {
    setValue('salesOrderNo', salesOrderNo || '', { shouldDirty: false });
  }, [salesOrderNo, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedBuyerCustomerId) {
        setIsLoadingAddresses(true);
        const buyerCust = filteredCustomerList.find((c: any) => c.id === parseInt(selectedBuyerCustomerId));

        if (buyerCust?.address) {
          const completeAddress = formatCompleteAddress(
            buyerCust.address,
            cityList,
            stateList,
            countryList
          );
          setBuyerAddress(completeAddress || '');
          setBuyerStateCode(buyerCust.address.stateCode || '');
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
  }, [selectedBuyerCustomerId, filteredCustomerList, cityList, stateList, countryList]);

  useEffect(() => {
    if (!buyerStateCode || !companyStateCode) return;
    const newTaxId = buyerStateCode === companyStateCode ? '1' : '2';
    setValue('taxId', newTaxId, { shouldValidate: true, shouldDirty: false });
  }, [buyerStateCode, companyStateCode, setValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.deliver-to-dropdown')) {
        setIsDeliverToDropdownOpen(false);
      }
    };

    if (isDeliverToDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDeliverToDropdownOpen]);

  useEffect(() => {
    if (editingIndex !== null) {
      setActiveTab('itemDetails');
      // Scroll to item details form after tab switch
      setTimeout(() => {
        const itemDetailsCard = document.querySelector('[data-itemdetails-form="true"]');
        if (itemDetailsCard) {
          itemDetailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }, [editingIndex]);




  const recalc = (item: any) => {
    const qty = toNumber(item.orderQty);
    const price = toNumber(item.pricePerUnit);
    const discType = item.discountType || "Percentage";
    const discVal = toNumber(item.discountValue);

    let discAmt = 0;
    if (price > 0 && discVal > 0) {
      if (discType === "Percentage" || discType === "%") {
        discAmt = (price * discVal) / 100;
      } else if (discType === "Amount" || discType === "₹") {
        discAmt = discVal;
      }
    }

    const netPrice = Math.max(0, price - discAmt);
    const total = qty * netPrice;

    const discAmtStr = price > 0 && discVal > 0 ? Number(discAmt.toFixed(4)).toString() : "0";
    const netPriceStr = price > 0 ? Number(netPrice.toFixed(4)).toString() : (price === 0 ? "0" : "");

    if (tabType === 2) {
      return {
        ...item,
        discountType: discType,
        discountAmount: discAmtStr,
        netPricePerUnit: netPriceStr,
        totalAmount: total ? total.toFixed(2) : "",
        gstAmount: "",
        cgstAmount: "",
        sgstAmount: "",
        igstAmount: "",
        finalAmount: total ? total.toFixed(2) : "",
      };
    }

    const gstP = toNumber(item.gstPercent);
    const cgstP = toNumber(item.cgstPercent);
    const sgstP = toNumber(item.sgstPercent);
    const igstP = toNumber(item.igstPercent);
    const gstAmt = total * (gstP / 100);
    const cgstAmt = total * (cgstP / 100);
    const sgstAmt = total * (sgstP / 100);
    const igstAmt = total * (igstP / 100);
    const final = total + gstAmt;
    return {
      ...item,
      discountType: discType,
      discountAmount: discAmtStr,
      netPricePerUnit: netPriceStr,
      totalAmount: total ? total.toFixed(2) : "",
      gstAmount: gstAmt ? gstAmt.toFixed(2) : "",
      cgstAmount: cgstAmt ? cgstAmt.toFixed(2) : "",
      sgstAmount: sgstAmt ? sgstAmt.toFixed(2) : "",
      igstAmount: igstAmt ? igstAmt.toFixed(2) : "",
      finalAmount: final ? final.toFixed(2) : "",
    };
  };

  // const recalc = (item: any) => {
  //   const qty = toNumber(item.orderQty);
  //   const price = toNumber(item.pricePerUnit);
  //   const gstP = toNumber(item.gstPercent);
  //   const cgstP = toNumber(item.cgstPercent);
  //   const sgstP = toNumber(item.sgstPercent);
  //   const igstP = toNumber(item.igstPercent);
  //   const total = qty * price;
  //   const gstAmt = total * (gstP / 100);
  //   const cgstAmt = total * (cgstP / 100);
  //   const sgstAmt = total * (sgstP / 100);
  //   const igstAmt = total * (igstP / 100);
  //   const final = total + gstAmt;
  //   return {
  //     ...item,
  //     totalAmount: total ? total.toFixed(2) : "",
  //     gstAmount: gstAmt ? gstAmt.toFixed(2) : "",
  //     cgstAmount: cgstAmt ? cgstAmt.toFixed(2) : "",
  //     sgstAmount: sgstAmt ? sgstAmt.toFixed(2) : "",
  //     igstAmount: igstAmt ? igstAmt.toFixed(2) : "",
  //     finalAmount: final ? final.toFixed(2) : "",
  //   };
  // };

  const addItem = () => {
    let isValid = true;

    if (!newItem.fabricTypeId) {
      setFabricTypeIdError("Fabric Type is required");
      isValid = false;
    } else {
      setFabricTypeIdError("");
    }

    if (!newItem.fabricCategoryId) {
      setFcIdError("Fabric Category is required");
      isValid = false;
    } else {
      setFcIdError("");
    }

    if (!newItem.fabricMasterId) {
      setFabricIdError("Sort No is required");
      isValid = false;
    } else {
      setFabricIdError("");
    }

    if (!newItem.uom) {
      setUomError("UOM is required");
      isValid = false;
    } else {
      setUomError("");
    }

    if (!newItem.buyerProduct) {
      setBuyerProductError("Buyer Product is required");
      isValid = false;
    } else {
      setBuyerProductError("");
    }

    const priceNum = toNumber(newItem.pricePerUnit);
    const discValNum = toNumber(newItem.discountValue);

    if (priceNum < 0) {
      toast.error("Price / Unit cannot be negative");
      isValid = false;
    }

    if (discValNum < 0) {
      toast.error("Discount Value cannot be negative");
      isValid = false;
    }

    if ((newItem.discountType === "Percentage" || newItem.discountType === "%") && discValNum > 100) {
      toast.error("Discount percentage cannot be greater than 100%");
      isValid = false;
    }

    if ((newItem.discountType === "Amount" || newItem.discountType === "₹") && discValNum > priceNum) {
      toast.error("Discount amount cannot be greater than Price / Unit");
      isValid = false;
    }

    setIsItemsValid(isValid);

    if (!isValid) {
      return;
    }

    const itemToAdd = { ...newItem };
    const fabricList = filteredFabricMasterData;

    if (!itemToAdd.fabricCode && itemToAdd.fabricMasterId && fabricList.length > 0) {
      const selectedFabric = fabricList.find((item: any) => item.id.toString() === itemToAdd.fabricMasterId);
      if (selectedFabric) {
        itemToAdd.fabricCode = selectedFabric.fabricCode || '';
      }
    }

    if (editingIndex === null && itemToAdd.fabricMasterId) {
      const isDuplicateInCurrentOrder = items.some((item: any) =>
        item.fabricMasterId === itemToAdd.fabricMasterId
      );

      if (isDuplicateInCurrentOrder) {
        setFabricCodeDuplicateError(`Fabric code "${itemToAdd.fabricCode || 'this'}" already exists in the current sales order. Please select a different fabric code.`);
        toast.error(`Fabric code "${itemToAdd.fabricCode || 'this'}" already exists in the current sales order. Please select a different fabric code.`);
        return;
      }
    }

    if (editingIndex !== null) {
      const updatedItems = [...items];
      updatedItems[editingIndex] = itemToAdd;
      setItems(updatedItems);
      setEditingIndex(null);
    } else {
      setItems([...items, itemToAdd]);
    }

    setNewItem({
      fabricTypeId: "1",
      fabricMasterId: "",
      fabricCategoryId: "1",
      fabricId: "",
      quality: "",
      buyerProduct: "",
      orderQty: "",
      pricePerUnit: "",
      discountType: "Percentage",
      discountValue: "",
      discountAmount: "",
      netPricePerUnit: "",
      uom: "1",
      gstPercent: "",
      gstAmount: "",
      finalAmount: "",
      deliveryDate: "",
      remarks: "",
      totalAmount: "",
      fabricMasterTypeId: "1",
      cgstPercent: "",
      sgstPercent: "",
      igstPercent: "",
      cgstAmount: "",
      sgstAmount: "",
      igstAmount: "",
      fabricCode: "",
    });
  };

  // const getFilteredFabricMasterList = () => {
  //   const fabricList = Array.isArray(fabricMasterData) ? fabricMasterData : [];

  //   console.log('fabricMasterData:', fabricMasterData);
  //   console.log('Extracted fabricList:', fabricList);

  //   if (!fabricList || fabricList.length === 0) {
  //     console.log('No fabric list available');
  //     return [];
  //   }

  //   let filteredList = [...fabricList];

  //   if (newItem.fabricCategoryId) {
  //     console.log('Filtering by category:', newItem.fabricCategoryId);
  //     filteredList = filteredList.filter((fabric: any) => {
  //       const fabricCatId = fabric.fabricCategoryId?.toString();
  //       const selectedCatId = newItem.fabricCategoryId.toString();
  //       return fabricCatId === selectedCatId;
  //     });
  //     console.log('After category filter:', filteredList.length);
  //   }

  //   if (newItem.fabricTypeId) {
  //     console.log('Filtering by type:', newItem.fabricTypeId);
  //     filteredList = filteredList.filter((fabric: any) => {
  //       const fabricType = fabric.fabricType?.toString();
  //       const selectedTypeId = newItem.fabricTypeId.toString();
  //       return fabricType === selectedTypeId;
  //     });
  //     console.log('After type filter:', filteredList.length);
  //   }

  //   console.log('Final filtered fabrics:', filteredList.length);
  //   return filteredList;
  // };

  // useEffect(() => {
  //   if (newItem.fabricCategoryId || newItem.fabricTypeId) {
  //     setNewItem(prev => ({
  //       ...prev,
  //       fabricMasterId: "",
  //       fabricCode: "",
  //       quality: "",
  //       buyerProduct: "",
  //       gstPercent: "",
  //       cgstPercent: "",
  //       sgstPercent: "",
  //       igstPercent: ""
  //     }));
  //   }
  // }, [newItem.fabricCategoryId, newItem.fabricTypeId]);


  const getFilteredFabricMasterList = () => {
    const fabricList = filteredFabricMasterData;

    if (!fabricList.length) {
      return [];
    }

    let filteredList = [...fabricList];

    if (newItem.fabricTypeId) {
      console.log('Filtering by type:', newItem.fabricTypeId);
      filteredList = filteredList.filter((fabric: any) => {
        const fabricType = fabric.fabricType?.toString() || fabric.type?.toString();
        const selectedTypeId = newItem.fabricTypeId.toString();
        return fabricType === selectedTypeId;
      });
      console.log('After type filter:', filteredList.length);
    }

    console.log('Final filtered fabrics:', filteredList.length);
    return filteredList;
  };


  useEffect(() => {
    console.log('=== FILTER DEBUG ===');
    console.log('Selected fabricCategoryId:', newItem.fabricCategoryId);
    console.log('Selected fabricTypeId:', newItem.fabricTypeId);
    console.log('Raw fabricMasterData:', fabricMasterData);
    console.log('Is array?', Array.isArray(fabricMasterData) ? 'YES' : 'NO');
    console.log('Total fabricMasterData:', Array.isArray(fabricMasterData) ? fabricMasterData.length : 0);

    if (Array.isArray(fabricMasterData) && fabricMasterData.length > 0) {
      console.log('Sample fabric data:', fabricMasterData[0]);
      console.log('First 3 fabrics with category 2:',
        fabricMasterData.filter((f: any) => f.fabricCategoryId === 2).slice(0, 3)
      );
    }

    const filtered = getFilteredFabricMasterList();
    console.log('Filtered results:', filtered.length);
    console.log('Filtered fabrics:', filtered.map((f: any) => ({
      id: f.id,
      name: f.fabricName,
      code: f.fabricCode,
      // categoryId: f.fabricCategoryId,
      fabricType: f.fabricType
    })));
  }, [newItem.fabricTypeId, fabricMasterData]);


  const editItem = (index: any) => {
    const itemToEdit = items[index];
    let fabricCode = itemToEdit.fabricCode || '';
    const fabricList = Array.isArray(fabricMasterData) ? fabricMasterData : [];

    if (!fabricCode && itemToEdit.fabricMasterId && fabricList.length > 0) {
      const selectedFabric = fabricList.find((item: any) =>
        item.id.toString() === itemToEdit.fabricMasterId.toString()
      );
      if (selectedFabric) {
        fabricCode = selectedFabric.fabricCode || selectedFabric.fabric_code || '';
      }
    }

    const editedItem = {
      ...itemToEdit,
      fabricCode: fabricCode,
      quality: String(itemToEdit.quality || ''),
      buyerProduct: String(itemToEdit.buyerProduct || ''),
      uom: String(itemToEdit.uom || ''),
      remarks: String(itemToEdit.remarks || ''),
      fabricTypeId: String(itemToEdit.fabricTypeId || ''),
      fabricCategoryId: String(itemToEdit.fabricCategoryId || ''),
      fabricMasterId: String(itemToEdit.fabricMasterId || ''),
      fabricMasterTypeId: String(itemToEdit.fabricMasterTypeId || ''),
      orderQty: String(itemToEdit.orderQty || ''),
      pricePerUnit: String(itemToEdit.pricePerUnit || ''),
      discountType: String(itemToEdit.discountType || 'Percentage'),
      discountValue: String(itemToEdit.discountValue || ''),
      discountAmount: String(itemToEdit.discountAmount || ''),
      netPricePerUnit: String(itemToEdit.netPricePerUnit || itemToEdit.pricePerUnit || ''),
      totalAmount: String(itemToEdit.totalAmount || ''),
      gstPercent: String(itemToEdit.gstPercent || ''),
      gstAmount: String(itemToEdit.gstAmount || ''),
      finalAmount: String(itemToEdit.finalAmount || ''),
      cgstPercent: String(itemToEdit.cgstPercent || ''),
      sgstPercent: String(itemToEdit.sgstPercent || ''),
      igstPercent: String(itemToEdit.igstPercent || ''),
      cgstAmount: String(itemToEdit.cgstAmount || ''),
      sgstAmount: String(itemToEdit.sgstAmount || ''),
      igstAmount: String(itemToEdit.igstAmount || ''),
      deliveryDate: itemToEdit.deliveryDate || '',
    };

    setNewItem(editedItem);
    setEditingIndex(index);
  };

  const deleteItem = (index: any) => {
    setItems(items.filter((_: any, i: any) => i !== index));
  };

  const draftKey = `salesOrderDraft_${tabType}`;
  const itemsDraftKey = `salesOrderItemsDraft_${tabType}`;
  const saveDraftToLocalStorage = (formData: any, itemsData: any) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(formData));
      localStorage.setItem(itemsDraftKey, JSON.stringify(itemsData));
    } catch (error) {
      console.warn('Failed to save draft to localStorage:', error);
    }
  };

  const loadDraftFromLocalStorage = () => {
    try {
      const savedForm = localStorage.getItem(draftKey);
      const savedItems = localStorage.getItem(itemsDraftKey);
      return {
        form: savedForm ? JSON.parse(savedForm) : null,
        items: savedItems ? JSON.parse(savedItems) : null
      };
    } catch (error) {
      console.warn('Failed to load draft from localStorage:', error);
      return { form: null, items: null };
    }
  };

  const clearDraftFromLocalStorage = () => {
    try {
      localStorage.removeItem(draftKey);
      localStorage.removeItem(itemsDraftKey);
    } catch (error) {
      console.warn('Failed to clear draft from localStorage:', error);
    }
  };


  useEffect(() => {
    if (!salesOrderdetail) {
      const { form: draftForm, items: draftItems } = loadDraftFromLocalStorage();
      if (draftForm) {
        reset(draftForm);
      }
      if (draftItems && draftItems.length > 0) {
        setItems(draftItems);
      }
    }

    return () => {
      if (!salesOrderdetail) {
        clearDraftFromLocalStorage();
      }
    };
  }, [salesOrderdetail]);

  const formValues = watch();
  useEffect(() => {
    if (!salesOrderdetail) {
      saveDraftToLocalStorage(formValues, items);
    }
  }, [formValues, items]);

  const onSubmit = async (data: salesOrderFormData) => {
    let currencyId = data.currencyId ? parseInt(data.currencyId) : undefined;
    let exchangeRate = data.exchangeRate ? parseFloat(data.exchangeRate) : null;

    if (tabType === 1) {
      const inrCurrency = currencyList.find((c: any) => c.currencyName === 'INR');
      currencyId = inrCurrency ? parseInt(inrCurrency.id) : 1;
      exchangeRate = null;
    }

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) {
      toast.error("Company not selected. Please select a company.");
      return;
    }

    let salesOrderNo = data.salesOrderNo || '';

    if (!salesOrderdetail?.id && !salesOrderNo) {
      try {
        console.log('[SalesOrderEntry.onSubmit] Generating document number...');
        console.log('[SalesOrderEntry.onSubmit] tabType:', tabType, 'Type:', typeof tabType);

        const tabName = tabType === 2 ? 'export' : 'domestic';
        const deptSuffix = data.department ? `-${data.department.toLowerCase()}` : '';
        const fullTabName = `${tabName}${deptSuffix}`;

        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: 'Sales Order Management',
          tabName: fullTabName
        });

        salesOrderNo = docResponse.documentNumber;
        console.log('[SalesOrderEntry.onSubmit] ✓ Generated document number:', salesOrderNo);
      } catch (error) {
        isSavingRef.current = false;
        console.error('[SalesOrderEntry.onSubmit] ❌ Failed to generate document number:', error);
        toast.error('Failed to generate Sales Order Number: ' + (error instanceof Error ? error.message : String(error)));
        return; // Stop submission if document number generation fails
      }
    } else if (salesOrderdetail?.id) {
      salesOrderNo = salesOrderdetail.salesOrderNo;
      console.log('[SalesOrderEntry.onSubmit] Using existing order number:', salesOrderNo);
    }

    // Extract sequence number for cache update
    const sequenceMatch = salesOrderNo.match(/\/(\d+)$/);
    const sequenceNumber = sequenceMatch ? sequenceMatch[1] : '';
    isSavingRef.current = true;

    const payload = {
      companyId: parseInt(storedCompanyId),
      userId: user?.id,
      exportType: tabType === 2 ? 2 : 1,
      orderTypeId: tabType === 2 ? 2 : 1,
      orderDate: new Date(data.orderDate).toISOString(),
      buyerCustomerId: parseInt(data.buyerCustomerId),
      buyerPoNo: data.buyerPoNo,
      deliverToId: parseInt(data.deliverToId),
      deliverToAddressId: selectedDeliverToOption?.addressId ? parseInt(selectedDeliverToOption.addressId) : (data.deliverToAddressId ? parseInt(data.deliverToAddressId) : null),
      currencyId: currencyId,
      exchangeRate: exchangeRate,
      modeOfShipmentId: parseInt(data.modeOfShipmentId),
      shipmentTermsId: parseInt(data.shipmentTermsId),
      paymentTermsId: parseInt(data.paymentTermsId),
      termsConditionsId: parseInt(data.termsConditionsId),
      packingTypeId: parseInt(data.packingTypeId),
      salesOrderNo: salesOrderNo,
      internalOrderNo: data.internalOrderNo || '',
      activeFlag: true,
      isComplete: salesOrderdetail?.isComplete || 0,
      taxId: tabType === 2 ? null : parseInt(data.taxId),
      department: data.department || null,
      items: items.map((item: any) => ({
        id: item.id,
        fabricTypeId: parseInt(item.fabricTypeId),
        quality: item.quality,
        buyerProduct: item.buyerProduct,
        orderQty: parseFloat(item.orderQty),
        pricePerUnit: parseFloat(item.pricePerUnit),
        discountType: item.discountType || 'Percentage',
        discountValue: parseFloat(item.discountValue || '0'),
        discountAmount: parseFloat(item.discountAmount || '0'),
        netPricePerUnit: parseFloat(item.netPricePerUnit || item.pricePerUnit || '0'),
        uomId: parseInt(item.uom),
        totalAmount: parseFloat(item.totalAmount),
        gstPercent: parseFloat(item.gstPercent),
        gstAmount: parseFloat(item.gstAmount),
        finalAmount: parseFloat(item.finalAmount),
        deliveryDate: item.deliveryDate && item.deliveryDate.trim() ? new Date(item.deliveryDate).toISOString() : null,
        remarks: item.remarks,
        fabricMasterTypeId: parseInt(item.fabricMasterTypeId),
        fabricCategoryId: parseInt(item.fabricCategoryId),
        fabricId: parseInt(item.fabricMasterId),
        fabricMasterId: parseInt(item.fabricMasterId),
        fabricCode: item.fabricCode || null,
        activeFlag: true
      }))
    };

    try {
      // alert(JSON.stringify(payload));
      console.log("submission payload:", payload);
      if (salesOrderdetail?.id) {
        const result: any = await dispatch(updateSalesOrder({ id: salesOrderdetail.id, data: payload, companyId: parseInt(storedCompanyId) })).unwrap();
        toast.success("Sales Order updated successfully!");
        clearDraftFromLocalStorage();
      } else {
        const result: any = await dispatch(createSalesOrder(payload)).unwrap();
        toast.success("Sales Order saved successfully!");
        clearDraftFromLocalStorage();
        const newId = result?.data?.id || result?.id;
        if (sequenceNumber) {
          const normalizedTabName = tabType === 1 ? 'domestic' : 'export';
          const deptSuffix = data.department ? `-${data.department.toLowerCase()}` : '';
          const fullTabName = `${normalizedTabName}${deptSuffix}`;
          documentNumberService.updateMemoryCache('Sales Order Management', sequenceNumber, fullTabName);
          console.log('[SalesOrderEntry.onSubmit] ✓ Updated memory cache with sequence:', sequenceNumber);
        }
      }
      navigate("/transaction/sales-order-management", { state: { tab: tabType } });
    } catch (err) {
      console.error("Error saving sales order:", err);
      toast.error("Failed to save/update Sales Order");
    }
  };

  const fabricMasterTypeOptions = [
    { "id": 1, "fabricMasterName": "Woven Fabric" },
    { "id": 2, "fabricMasterName": "Knitted Fabric" }
  ];

  // const handleFabricTypeChange = (value: string) => {
  //   // Client-side only
  // };


  const resetFabricDependentFields = (item: SalesOrderItem): SalesOrderItem => ({
    ...item,
    fabricMasterId: "",
    fabricCode: "",
    quality: "",
    buyerProduct: "",
    gstPercent: "",
    cgstPercent: "",
    sgstPercent: "",
    igstPercent: ""
  });

  const handleFabricTypeChange = (value: string) => {
    setNewItem(prev => resetFabricDependentFields({ ...prev, fabricTypeId: value }));
  };

  // const handleFabricCategoryChange = (value: string) => {
  //   // Client-side only
  // };
  const handleFabricCategoryChange = (value: string) => {
    setNewItem(prev => resetFabricDependentFields({ ...prev, fabricCategoryId: value }));
  };


  // const handleFabricMasterChange = (e: React.ChangeEvent<HTMLSelectElement> | string) => {
  //   const id = typeof e === 'string' ? e : e.target.value;
  //   setFabricCodeDuplicateError("");

  //   setNewItem((prevItem: SalesOrderItem) => {
  //     const updatedItem = { ...prevItem, fabricMasterId: id };

  //     if (id) {
  //       const filteredList = getFilteredFabricMasterList();
  //       const selectedFabric = filteredList.find((item: any) => item.id.toString() === id);

  //       if (selectedFabric) {
  //         const quality = selectedFabric.fabricQuality || selectedFabric.quality || selectedFabric.fabric_quality || '';
  //         const fabricCode = selectedFabric.fabricCode || selectedFabric.fabric_code || '';
  //         const buyerProduct = quality;

  //         let gstPercent = '';
  //         let cgstPercent = '';
  //         let sgstPercent = '';
  //         let igstPercent = '';

  //         if (selectedTaxId === '1') {
  //           cgstPercent = selectedFabric.cgst ? selectedFabric.cgst.toFixed(2) : '';
  //           sgstPercent = selectedFabric.sgst ? selectedFabric.sgst.toFixed(2) : '';
  //           gstPercent = (parseFloat(cgstPercent || '0') + parseFloat(sgstPercent || '0')).toFixed(2);
  //         } else {
  //           igstPercent = selectedFabric.gstPercent ? selectedFabric.gstPercent.toFixed(2) : '';
  //           gstPercent = igstPercent;
  //         }

  //         const itemWithAutoFill = {
  //           ...updatedItem,
  //           quality,
  //           buyerProduct,
  //           fabricCode,
  //           gstPercent,
  //           cgstPercent,
  //           sgstPercent,
  //           igstPercent,
  //         };
  //         return recalc(itemWithAutoFill);
  //       }
  //     }
  //     return updatedItem;
  //   });
  // };
  const getCurrentTaxId = () => {
    return watch('taxId') || selectedTaxId || '1'; // Default to 1 if not set
  };

  const handleFabricMasterChange = (e: React.ChangeEvent<HTMLSelectElement> | string) => {
    const id = typeof e === 'string' ? e : e.target.value;
    setFabricCodeDuplicateError("");

    // Get current tax ID
    const currentTaxId = getCurrentTaxId();

    setNewItem((prevItem: SalesOrderItem) => {
      const updatedItem = { ...prevItem, fabricMasterId: id };

      if (id) {
        const filteredList = getFilteredFabricMasterList();
        const selectedFabric = filteredList.find((item: any) => item.id.toString() === id);

        if (selectedFabric) {
          const quality = selectedFabric.fabricQuality || selectedFabric.quality || selectedFabric.fabric_quality || '';
          const fabricCode = selectedFabric.fabricCode || selectedFabric.fabric_code || '';
          const buyerProduct = quality;

          // Get GST values from the API response structure
          const gstPercent = selectedFabric.gstPercent ? selectedFabric.gstPercent.toString() : '0';
          const cgst = selectedFabric.cgst ? selectedFabric.cgst.toString() : '0';
          const sgst = selectedFabric.sgst ? selectedFabric.sgst.toString() : '0';
          const igst = selectedFabric.igst ? selectedFabric.igst.toString() : '0';

          let cgstPercent = '', sgstPercent = '', igstPercent = '';

          if (tabType === 1) {
            if (currentTaxId === '1') {
              // For CGST/SGST - use the values from API or divide equally
              cgstPercent = cgst !== '0' ? cgst : (parseFloat(gstPercent) / 2).toFixed(2);
              sgstPercent = sgst !== '0' ? sgst : (parseFloat(gstPercent) / 2).toFixed(2);
            } else {
              // For IGST
              igstPercent = igst !== '0' ? igst : gstPercent;
            }
          }

          const itemWithAutoFill = {
            ...updatedItem,
            quality,
            buyerProduct,
            fabricCode,
            gstPercent: gstPercent || '0',
            cgstPercent,
            sgstPercent,
            igstPercent,
          };
          return recalc(itemWithAutoFill);
        }
      }
      return updatedItem;
    });
  };


  useEffect(() => {
    // Update GST percentages when tax type changes
    if (newItem.fabricMasterId && selectedTaxId) {
      const filteredList = getFilteredFabricMasterList();
      const selectedFabric = filteredList.find((item: any) => item.id.toString() === newItem.fabricMasterId);

      if (selectedFabric) {
        const gstPercent = selectedFabric.gstPercent ? selectedFabric.gstPercent.toString() : '0';
        const cgst = selectedFabric.cgst ? selectedFabric.cgst.toString() : '0';
        const sgst = selectedFabric.sgst ? selectedFabric.sgst.toString() : '0';
        const igst = selectedFabric.igst ? selectedFabric.igst.toString() : '0';

        let cgstPercent = '', sgstPercent = '', igstPercent = '';

        if (tabType === 1) {
          if (selectedTaxId === '1') {
            cgstPercent = cgst !== '0' ? cgst : (parseFloat(gstPercent) / 2).toFixed(2);
            sgstPercent = sgst !== '0' ? sgst : (parseFloat(gstPercent) / 2).toFixed(2);
          } else {
            igstPercent = igst !== '0' ? igst : gstPercent;
          }
        }

        setNewItem(prev => recalc({
          ...prev,
          gstPercent,
          cgstPercent,
          sgstPercent,
          igstPercent
        }));
      }
    }
  }, [selectedTaxId, tabType]);

  const handleShowPriceHistory = async (fabricMasterId: string) => {
    try {
      // Filter sales orders that contain this fabric and get their prices
      const relevantOrders = salesOrderList.filter((order: any) =>
        order.items && order.items.some((item: any) => item.fabricMasterId?.toString() === fabricMasterId.toString())
      );

      const priceHistory = relevantOrders.flatMap((order: any) =>
        order.items
          .filter((item: any) => item.fabricMasterId?.toString() === fabricMasterId.toString())
          .map((item: any) => ({
            id: `${order.id}-${item.id}`,
            orderNo: order.salesOrderNo || order.internalOrderNo || `Order ${order.id}`,
            orderDate: order.orderDate,
            pricePerUnit: item.pricePerUnit,
            buyerCustomerName: order.buyerCustomerName || 'Unknown Customer',
            currency: order.currency?.currencyName || 'INR',
            quantity: item.orderQty,
            uom: item.uomId ? uomList.find((u: any) => u.id.toString() === item.uomId.toString())?.uomName : '',
          }))
      );
      // Sort by date descending (most recent first)
      priceHistory.sort((a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

      setPreviousPrices(priceHistory);
      setShowPriceHistory(true);
    } catch (error) {
      console.error('Error fetching price history:', error);
      toast.error('Failed to load price history');
    }
  };

  const handleSelectPrice = (selectedPrice: any) => {
    setNewItem((prevItem) => ({
      ...prevItem,
      pricePerUnit: selectedPrice.pricePerUnit.toString()
    }));
    setShowPriceHistory(false);
    toast.success(`Price updated to ${selectedPrice.pricePerUnit}`);
  };


  return (
    <div>
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/sales-order-management", { state: { tab: tabType } })}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">Sales Order ({tabType === 1 ? 'Domestic' : 'Export'})</h2>
          </div>

        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} /> Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-8">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Sales Order No</label>
                <input
                  value={watch('salesOrderNo') || salesOrderNo || ''}
                  readOnly
                  className={`w-full border px-3 py-2 rounded transition-all duration-200 mt-1 ${
                    !watch('salesOrderNo') || watch('salesOrderNo')?.startsWith('Loading')
                      ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                      : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                  }`}
                  placeholder="Loading sequence..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Order Date <span className="text-red-600">*</span></label>
                <input
                  {...register('orderDate', { required: 'Date is required' })}
                  className="input mt-1" type="date"
                />
                {errors.orderDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.orderDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Buyer PO No</label>
                <input
                  {...register('buyerPoNo')}
                  className="input mt-1" placeholder="Buyer PO No"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Buyer / Customer <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  {...register("buyerCustomerId", { required: "Customer is required" })}
                  options={filteredCustomerList.map((customer: any) => ({
                    value: String(customer.id),
                    label: customer.customerName,
                  }))}
                  placeholder="Select a Customer"
                  className="mt-1"
                  error={errors.buyerCustomerId?.message as string}
                />
                {errors.buyerCustomerId && (
                  <p className="mt-1 text-sm text-red-600">{errors.buyerCustomerId.message}</p>
                )}
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
              <div>
                <label className="block text-sm font-medium text-secondary-700">Deliver To <span className="text-red-600">*</span></label>
                
                {/* Custom Checkbox Dropdown */}
                <div className="relative mt-1 deliver-to-dropdown">
                  <div 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white cursor-pointer"
                    onClick={() => setIsDeliverToDropdownOpen(!isDeliverToDropdownOpen)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">
                        {selectedDeliverToOption 
                          ? `${selectedDeliverToOption.consigneeName}${selectedDeliverToOption.addressLine ? ` (${selectedDeliverToOption.addressLine})` : ''}`
                          : 'Select a Deliver To'
                        }
                      </span>
                      <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Dropdown Content */}
                  {isDeliverToDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      <div className="p-1.5 divide-y divide-gray-100">
                        {deliverToOptions.length > 0 ? (
                          deliverToOptions.map((option, idx) => (
                            <div
                              key={`${option.consigneeId}-${option.addressId || idx}`}
                              className="flex items-start p-2.5 hover:bg-blue-50 cursor-pointer rounded transition-colors"
                              onClick={() => handleDeliverToSelection(option)}
                            >
                              <input
                                type="radio"
                                name="deliverTo"
                                checked={selectedDeliverToOption?.consigneeId === option.consigneeId && selectedDeliverToOption?.addressId === option.addressId}
                                onChange={() => {}}
                                className="mt-1 mr-3 cursor-pointer text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {option.consigneeName}
                                  </span>
                                  {option.fullAddress?.isDefault && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                      Default
                                    </span>
                                  )}
                                </div>
                                {option.addressLine && (
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                    {option.addressLine}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 p-3 text-center">
                            No consignees with addresses found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Hidden input for form validation */}
                <input
                  type="hidden"
                  {...register("deliverToId", { required: "Deliver To is required" })}
                />
                
                {errors.deliverToId && (
                  <p className="mt-1 text-sm text-red-600">{errors.deliverToId.message}</p>
                )}

                {deliverToAddress ? (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <h2 className="font-bold text-[16px] mb-2">Shipping To</h2>
                    <div className="space-y-1">
                      <p className="text-sm"><strong>Address:</strong> {deliverToAddress}</p>
                      {deliverToStateCode && (
                        <p className="text-sm"><strong>State Code:</strong> {deliverToStateCode}</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Packing Type <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  {...register("packingTypeId")}
                  options={[
                    { value: "1", label: "Roll" },
                    { value: "2", label: "Bale" },
                  ]}
                  placeholder="Select Packing Type"
                  className="mt-1"
                />
              </div>
              {tabType === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Currency <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      {...register("currencyId", { required: "Currency is required" })}
                      options={filteredCurrencyList.map((currency: any) => ({
                        value: String(currency.id),
                        label: currency.currencyName,
                      }))}
                      placeholder="Select a Currency"
                      className="mt-1"
                      error={errors.currencyId?.message as string}
                    />
                    {errors.currencyId && (
                      <p className="mt-1 text-sm text-red-600">{errors.currencyId.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Exchange Rate <span className="text-red-600">*</span></label>
                    {/* <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        placeholder="Order Qty"
                        value={newItem.orderQty}
                        onChange={e => setNewItem(recalc({ ...newItem, orderQty: e.target.value }))}
                        className="input mt-1"
                      /> */}
                    <input type="number"
                      inputMode="decimal" step="any"
                      min="0"
                      {...register('exchangeRate', { required: 'Exchange Rate is required' })}
                      className="input mt-1" placeholder="Exchange Rate"
                    />
                    {errors.exchangeRate && (
                      <p className="mt-1 text-sm text-red-600">{errors.exchangeRate.message}</p>
                    )}
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-secondary-700">Mode Of Shipment <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  {...register("modeOfShipmentId", { required: "Mode Of Shipment is required" })}
                  options={filteredShipmentModesList.map((shippingModes: any) => ({
                    value: String(shippingModes.id),
                    label: shippingModes.modeName,
                  }))}
                  placeholder="Select a Mode Of Shipment"
                  className="mt-1"
                  error={errors.modeOfShipmentId?.message as string}
                />
                {errors.modeOfShipmentId && (
                  <p className="mt-1 text-sm text-red-600">{errors.modeOfShipmentId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Shipment Terms <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  {...register("shipmentTermsId", { required: "Shipment Terms is required" })}
                  options={filteredShipmentTermsList.map((shipmentTerms: any) => ({
                    value: String(shipmentTerms.id),
                    label: shipmentTerms.termName,
                  }))}
                  placeholder="Select a Shipment Terms"
                  className="mt-1"
                  error={errors.shipmentTermsId?.message as string}
                />
                {errors.shipmentTermsId && (
                  <p className="mt-1 text-sm text-red-600">{errors.shipmentTermsId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Payment Terms <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  {...register("paymentTermsId", { required: "Payment Terms is required" })}
                  options={filteredPaymentTermsList.map((paymentTerms: any) => ({
                    value: String(paymentTerms.id),
                    label: paymentTerms.termName,
                  }))}
                  placeholder="Select a Payment Terms"
                  className="mt-1"
                  error={errors.paymentTermsId?.message as string}
                />
                {errors.paymentTermsId && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentTermsId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Terms & Conditions <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  {...register("termsConditionsId", { required: "Shipment Terms is required" })}
                  options={filteredTermsConditionsList.map((Conditions: any) => ({
                    value: String(Conditions.id),
                    label: Conditions.termsConditionsName,
                  }))}
                  placeholder="Select a Shipment Terms"
                  className="mt-1"
                  error={errors.termsConditionsId?.message as string}
                />
                {errors.termsConditionsId && (
                  <p className="mt-1 text-sm text-red-600">{errors.termsConditionsId.message}</p>
                )}
              </div>
              {tabType === 1 && (
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
              )}
              <div>
                <label className="block text-sm font-medium text-secondary-700">Department <span className="text-red-600">*</span></label>
                <select
                  {...register("department", { required: "Department is required" })}
                  disabled={isDeptSpecific}
                  className="input mt-1 bg-white border border-gray-300 rounded-md shadow-sm w-full py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Select Department</option>
                  <option value="Weaving">Weaving</option>
                  <option value="Brushing">Brushing</option>
                  <option value="Garments">Garments</option>
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>
              {/* <div>
                <label className="block text-sm font-medium">GST Type <span className="text-red-500">*</span></label>
                <select
                  {...register("taxId", { required: "GST Type is required" })}
                  className={`input mt-1 ${errors.taxId ? 'border-red-500' : ''}`}
                  disabled
                >
                  <option value="">Select GST Type</option>
                  <option value="1">CGST/SGST</option>
                  <option value="2">IGST</option>
                </select>
                {errors.taxId && <p className="mt-1 text-sm text-red-600">{errors.taxId.message}</p>}
              </div> */}
            </CardContent>
          </Card>

          <Card data-itemdetails-form="true">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart size={20} /> Item Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6">
                    <div className="hidden">
                      <label className="block text-sm font-medium text-secondary-700">Select Fabric Master <span className="text-red-600">*</span></label>
                      <CommonSearchableSelect
                        value={newItem.fabricMasterTypeId}
                        onChange={(e: any) => {
                          const value = e.target?.value || e;
                          setNewItem({ ...newItem, fabricMasterTypeId: value });
                        }}
                        options={fabricMasterTypeOptions?.map((fabric: any) => ({
                          value: String(fabric.id),
                          label: fabric.fabricMasterName,
                        })) || []}
                        placeholder="Select Fabric Master"
                        className="mt-1"
                      />
                    </div>
                    <div className="hidden">
                      <label className="block text-sm font-medium text-secondary-700">Fabric Type <span className="text-red-600">*</span></label>
                      <CommonSearchableSelect
                        value={newItem.fabricTypeId}
                        onChange={(e: any) => {
                          const value = e.target?.value || e;
                          setNewItem({ ...newItem, fabricTypeId: value });
                          handleFabricTypeChange(value);
                        }}
                        options={filteredFabricTypeList?.map((fabric: any) => ({
                          value: String(fabric.id),
                          label: fabric.fabricTypeName,
                        })) || []}
                        placeholder="Select Fabric Type"
                        className="mt-1"
                        error={fabricTypeIdError}
                      />
                    </div>
                    <div className="hidden">
                      <label className="block text-sm font-medium text-secondary-700">Fabric Category <span className="text-red-600">*</span></label>
                      <CommonSearchableSelect
                        value={newItem.fabricCategoryId}
                        onChange={(e: any) => {
                          const value = e.target?.value || e;
                          setNewItem({ ...newItem, fabricCategoryId: value });
                          handleFabricCategoryChange(value);
                        }}
                        options={filteredFabricCategoryList?.map((fabric: any) => ({
                          value: String(fabric.id),
                          label: fabric.fabricCategoryName,
                        })) || []}
                        placeholder="Select Fabric Category"
                        className="mt-1"
                        error={fcIdError}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Sort No <span className="text-red-600">*</span></label>
                      <div className="space-y-2">
                        {/* <SearchableSelect
                          value={newItem.fabricMasterId}
                          onChange={handleFabricMasterChange}
                          options={(() => {
                            return getFilteredFabricMasterList()?.map((item: any) => {
                              return {
                                id: item.id,
                                label: `${item.fabricName || item.fabric_name || 'Unnamed'} (${item.fabricCode || item.fabric_code || 'No Code'})`,
                                value: item.id.toString()
                              };
                            }) || [];
                          })()}
                          placeholder={
                            !newItem.fabricCategoryId || !newItem.fabricTypeId
                              ? "Select Fabric Category and Type first"
                              : `Select Fabric Code (${getFilteredFabricMasterList().length} available)`
                          }
                          className="mt-1"
                          error={!!fabricCodeDuplicateError || !!fabricIdError}
                          disabled={!newItem.fabricCategoryId || !newItem.fabricTypeId}
                        /> */}

                        <CommonSearchableSelect
                          value={newItem.fabricMasterId}
                          onChange={handleFabricMasterChange}
                          options={(() => {
                            return getFilteredFabricMasterList()?.map((item: any) => {
                              return {
                                id: item.id,
                                label: `${item.fabricCode || item.fabric_code || 'No Code'}`,
                                value: item.id.toString()
                              };
                            }) || [];
                          })()}
                          placeholder={
                            !newItem.fabricTypeId
                              ? "Select Fabric Type first"
                              : `Select Sort No (${getFilteredFabricMasterList().length} available)`
                          }
                          className="mt-1"
                          error={!!fabricCodeDuplicateError || !!fabricIdError}
                          disabled={!newItem.fabricTypeId}
                        />

                        {/* <div className="text-xs text-gray-500">
                          <p>Selected: Category={newItem.fabricCategoryId}, Type={newItem.fabricTypeId}</p>
                          <p>Available: {getFilteredFabricMasterList().length} fabrics</p>
                          {fabricMasterData && (
                            <>
                              <p>Total fabrics: {fabricMasterData?.data?.length || 0}</p>
                              <p>Response status: {fabricMasterData?.status}</p>
                            </>
                          )}
                        </div> */}
                      </div>
                      {fabricIdError && <p className="mt-1 text-sm text-red-600">{fabricIdError}</p>}
                      {fabricCodeDuplicateError && <p className="mt-1 text-sm text-red-600">{fabricCodeDuplicateError}</p>}
                      {/* {(!newItem.fabricCategoryId || !newItem.fabricTypeId) ? (
                        <p className="mt-1 text-sm text-yellow-600">
                          Please select Fabric Category and Fabric Type first
                        </p>
                      ) : getFilteredFabricMasterList().length === 0 ? (
                        <p className="mt-1 text-sm text-yellow-600">
                          No fabrics found. Check console for debugging info.
                        </p>
                      ) : null} */}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Construction</label>
                      <input placeholder="Construction"
                        value={newItem.quality}
                        onChange={e => setNewItem({ ...newItem, quality: e.target.value })} className="input mt-1" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Buyer Product <span className="text-red-600">*</span></label>
                      <input
                        placeholder="Buyer Product"
                        value={newItem.buyerProduct}
                        onChange={e => setNewItem({ ...newItem, buyerProduct: e.target.value })}
                        className={`input mt-1 ${buyerProductError ? 'border-red-500' : ''}`}
                      />
                      {buyerProductError && <p className="mt-1 text-sm text-red-600">{buyerProductError}</p>}
                    </div>
                    {newItem.fabricMasterId && (
                      <div>
                        <button
                          type="button"
                          onClick={() => handleShowPriceHistory(newItem.fabricMasterId)}
                          className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                          title="View Previous Prices"
                        >
                          View Price History
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Order Qty</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        placeholder="Order Qty"
                        value={newItem.orderQty}
                        onChange={e => setNewItem(recalc({ ...newItem, orderQty: e.target.value }))}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Price / Unit</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        placeholder="Price / Unit"
                        value={newItem.pricePerUnit}
                        onChange={e => setNewItem(recalc({ ...newItem, pricePerUnit: e.target.value }))}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Discount Type</label>
                      <select
                        value={newItem.discountType || "Percentage"}
                        onChange={e => setNewItem(recalc({ ...newItem, discountType: e.target.value }))}
                        className="input mt-1 bg-white border border-gray-300 rounded-md shadow-sm w-full py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Amount">Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">
                        Discount Value {newItem.discountType === "Amount" ? "(₹)" : "(%)"}
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        placeholder={newItem.discountType === "Amount" ? "Amount per unit" : "Percentage"}
                        value={newItem.discountValue || ""}
                        onChange={e => setNewItem(recalc({ ...newItem, discountValue: e.target.value }))}
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Discount Amount / Unit</label>
                      <input
                        placeholder="Discount Amount"
                        value={newItem.discountAmount || "0"}
                        className="input mt-1 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Net Price / Unit</label>
                      <input
                        placeholder="Net Price / Unit"
                        value={newItem.netPricePerUnit || ""}
                        className="input mt-1 bg-gray-50 font-medium text-blue-700"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">UOM <span className="text-red-600">*</span></label>
                      <CommonSearchableSelect
                        value={newItem.uom}
                        onChange={(e: any) => {
                          const value = e.target?.value || e;
                          setNewItem({ ...newItem, uom: value });
                        }}
                        options={filteredUomList?.map((uom: any) => ({
                          value: String(uom.id),
                          label: uom.uomName,
                        })) || []}
                        placeholder="Select a UOM"
                        className="mt-1"
                        error={uomError}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Total Amount</label>
                      <input placeholder="Total Amount"
                        value={newItem.totalAmount}
                        onChange={e => setNewItem({ ...newItem, totalAmount: e.target.value })}
                        className="input mt-1 bg-gray-50"
                        readOnly
                      />
                    </div>
                    {tabType === 1 && selectedTaxId === '2' && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">IGST %</label>
                        <input
                          placeholder="IGST %"
                          value={newItem.igstPercent}
                          onChange={e => {
                            const percent = toNumber(e.target.value);
                            setNewItem(recalc({ ...newItem, gstPercent: String(percent), igstPercent: e.target.value, cgstPercent: '', sgstPercent: '' }));
                          }}
                          className="input mt-1"
                        />
                      </div>
                    )}
                    {tabType === 1 && selectedTaxId === '1' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">CGST %</label>
                          <input
                            placeholder="CGST %"
                            value={newItem.cgstPercent}
                            onChange={e => {
                              const c = toNumber(e.target.value);
                              const s = toNumber(newItem.sgstPercent);
                              setNewItem(recalc({ ...newItem, cgstPercent: e.target.value, gstPercent: String(c + s), igstPercent: '' }));
                            }}
                            className="input mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">SGST %</label>
                          <input
                            placeholder="SGST %"
                            value={newItem.sgstPercent}
                            onChange={e => {
                              const s = toNumber(e.target.value);
                              const c = toNumber(newItem.cgstPercent);
                              setNewItem(recalc({ ...newItem, sgstPercent: e.target.value, gstPercent: String(c + s), igstPercent: '' }));
                            }}
                            className="input mt-1"
                          />
                        </div>
                      </>
                    )}
                    {tabType === 1 && selectedTaxId === '2' && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">IGST Amount</label>
                        <input placeholder="IGST Amount"
                          value={newItem.igstAmount}
                          onChange={e => setNewItem({ ...newItem, igstAmount: e.target.value })}
                          className="input mt-1"
                          readOnly
                        />
                      </div>
                    )}
                    {tabType === 1 && selectedTaxId === '1' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">CGST Amount</label>
                          <input placeholder="CGST Amount"
                            value={newItem.cgstAmount}
                            onChange={e => setNewItem({ ...newItem, cgstAmount: e.target.value })}
                            className="input mt-1"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">SGST Amount</label>
                          <input placeholder="SGST Amount"
                            value={newItem.sgstAmount}
                            onChange={e => setNewItem({ ...newItem, sgstAmount: e.target.value })}
                            className="input mt-1"
                            readOnly
                          />
                        </div>
                      </>
                    )}
                    {/* {selectedTaxId === '2' && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">IGST %</label>
                        <input
                          placeholder="IGST %"
                          value={newItem.igstPercent}
                          onChange={e => {
                            const percent = toNumber(e.target.value);
                            setNewItem(recalc({ ...newItem, gstPercent: String(percent), igstPercent: e.target.value, cgstPercent: '', sgstPercent: '' }));
                          }}
                          className="input mt-1"
                        />
                      </div>
                    )}
                    {selectedTaxId === '1' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">CGST %</label>
                          <input
                            placeholder="CGST %"
                            value={newItem.cgstPercent}
                            onChange={e => {
                              const c = toNumber(e.target.value);
                              const s = toNumber(newItem.sgstPercent);
                              setNewItem(recalc({ ...newItem, cgstPercent: e.target.value, gstPercent: String(c + s), igstPercent: '' }));
                            }}
                            className="input mt-1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">SGST %</label>
                          <input
                            placeholder="SGST %"
                            value={newItem.sgstPercent}
                            onChange={e => {
                              const s = toNumber(e.target.value);
                              const c = toNumber(newItem.cgstPercent);
                              setNewItem(recalc({ ...newItem, sgstPercent: e.target.value, gstPercent: String(c + s), igstPercent: '' }));
                            }}
                            className="input mt-1"
                          />
                        </div>
                      </>
                    )}
                    {selectedTaxId === '2' && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">IGST Amount</label>
                        <input placeholder="IGST Amount"
                          value={newItem.igstAmount}
                          onChange={e => setNewItem({ ...newItem, igstAmount: e.target.value })}
                          className="input mt-1"
                          readOnly
                        />
                      </div>
                    )}
                    {selectedTaxId === '1' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">CGST Amount</label>
                          <input placeholder="CGST Amount"
                            value={newItem.cgstAmount}
                            onChange={e => setNewItem({ ...newItem, cgstAmount: e.target.value })}
                            className="input mt-1"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700">SGST Amount</label>
                          <input placeholder="SGST Amount"
                            value={newItem.sgstAmount}
                            onChange={e => setNewItem({ ...newItem, sgstAmount: e.target.value })}
                            className="input mt-1"
                            readOnly
                          />
                        </div>
                      </>
                    )} */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Final Amount</label>
                      <input placeholder="Final Amount"
                        value={newItem.finalAmount}
                        onChange={e => setNewItem({ ...newItem, finalAmount: e.target.value })}
                        className="input mt-1"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Delivery Date</label>
                      <input type="date"
                        value={newItem.deliveryDate}
                        onChange={e => setNewItem({ ...newItem, deliveryDate: e.target.value })} className="input mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Remarks</label>
                      <input placeholder="Remarks"
                        value={newItem.remarks}
                        onChange={e => setNewItem({ ...newItem, remarks: e.target.value })} className="input mt-1" />
                    </div>
                  </div>
                  <Button onClick={addItem} className="mt-4 ml-auto flex items-center">
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
                        <th className="border p-2">Sort No</th>
                        <th className="border p-2">Construction</th>
                        <th className="border p-2">Buyer Product</th>
                        <th className="border p-2">Order Qty</th>
                        <th className="border p-2">Price/Unit</th>
                        <th className="border p-2">Discount</th>
                        <th className="border p-2">Net Price/Unit</th>
                        {tabType === 1 && <th className="border p-2">GST Amount</th>}
                        <th className="border p-2">{tabType === 1 ? 'Final Amount' : 'Total Amount'}</th>
                        <th className="border p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, index: any) => {
                        const fabricCode = item.fabricCode || '-';
                        const gstAmountDisplay = selectedTaxId === '1'
                          ? `${currencySymbol}${(parseFloat(item.cgstAmount || '0') + parseFloat(item.sgstAmount || '0')).toFixed(2)}`
                          : `${currencySymbol}${item.igstAmount}`;

                        const discountDisplay = item.discountValue && parseFloat(item.discountValue) > 0
                          ? (item.discountType === 'Amount' ? `₹${item.discountValue}` : `${item.discountValue}%`)
                          : '-';

                        const netPriceDisplay = item.netPricePerUnit || item.pricePerUnit || '-';

                        return (
                          <tr key={index} className="border">
                            <td className="border p-2">{index + 1}</td>
                            <td className="border p-2">{fabricCode}</td>
                            <td className="border p-2">{item.quality}</td>
                            <td className="border p-2">{item.buyerProduct}</td>
                            <td className="border p-2">{item.orderQty}</td>
                            <td className="border p-2">{item.pricePerUnit}</td>
                            <td className="border p-2">{discountDisplay}</td>
                            <td className="border p-2">{netPriceDisplay}</td>
                            {tabType === 1 && <td className="border p-2">{gstAmountDisplay}</td>}
                            <td className="border p-2">{currencySymbol}{tabType === 1 ? item.finalAmount : item.totalAmount}</td>
                            <td className="border p-2">
                              <button onClick={() => editItem(index)} className="mr-2 text-blue-500">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => deleteItem(index)} className="text-red-500">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText size={20} /> Yarn Requirement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full border-collapse border border-gray-300 text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">S.No</th>
                        <th className="border p-2">Sort No</th>
                        <th className="border p-2">Order Qty</th>
                        {Array.from({ length: maxWarpColumns }, (_, index) => (
                          <th key={`warp-header-${index}`} className="border p-2">Warp {index + 1}</th>
                        ))}
                        {Array.from({ length: maxWeftColumns }, (_, index) => (
                          <th key={`weft-header-${index}`} className="border p-2">Weft {index + 1}</th>
                        ))}
                        <th className="border p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yarnRequirementRows.length === 0 ? (
                        <tr>
                          <td colSpan={3 + maxWarpColumns + maxWeftColumns + 1} className="border p-4 text-center text-gray-500">
                            No yarn requirement data available.
                          </td>
                        </tr>
                      ) : (
                        yarnRequirementRows.map((row: any) => (
                          <tr key={row.serial} className="border">
                            <td className="border p-2">{row.serial}</td>
                            <td className="border p-2">{row.fabricCode}</td>
                            <td className="border p-2">{row.orderQty}</td>
                            {Array.from({ length: maxWarpColumns }, (_, index) => (
                              <td key={`warp-${row.serial}-${index}`} className="border p-2">
                                {typeof row.warpValues[index] === 'number' ? row.warpValues[index].toFixed(2) : '-'}
                              </td>
                            ))}
                            {Array.from({ length: maxWeftColumns }, (_, index) => (
                              <td key={`weft-${row.serial}-${index}`} className="border p-2">
                                {typeof row.weftValues[index] === 'number' ? row.weftValues[index].toFixed(2) : '-'}
                              </td>
                            ))}
                            <td className="border p-2">{row.total.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit(onSubmit)}
                  disabled={!isFormValid}
                  className={`bg-primary hover:bg-primary text-white px-6 flex items-center ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Save size={18} className="mr-2" />
                  {salesOrderdetail?.id ? "Update Sales Order" : "Save Sales Order"}
                </Button>
              </div>
        </div>
      </div>
      {showPriceHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Previous Sales Order Prices</h3>
              <button
                onClick={() => setShowPriceHistory(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {previousPrices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No previous prices found for this fabric.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Select a price to apply it to the current item:
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">Select</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Order No</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Price/Unit</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Currency</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">UOM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previousPrices.map((price) => (
                          <tr key={price.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">
                              <input
                                type="radio"
                                name="priceSelection"
                                onChange={() => handleSelectPrice(price)}
                                className="w-4 h-4 text-blue-600"
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{price.orderNo}</td>
                            <td className="border border-gray-300 px-4 py-2">
                              {new Date(price.orderDate).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{price.buyerCustomerName}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                              {price.pricePerUnit}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{price.currency}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{price.quantity}</td>
                            <td className="border border-gray-300 px-4 py-2">{price.uom}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
              <Button
                onClick={() => setShowPriceHistory(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>

  );
};

export default SalesOrderEntry;