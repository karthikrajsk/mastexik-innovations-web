import React, { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { AppDispatch, RootState } from "@/state/store";
import { useDispatch, useSelector } from "react-redux";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { getAllShipmentTerms } from "@/state/shipmentTermsSlice";
import { getAllShipmentModes } from "@/state/shipmentModeSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllCategories } from "@/state/categorySlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCities } from "@/state/citySlice";
import { getAllCountries } from "@/state/countrySlice";
import { getCompanyById } from "@/state/company-master-slice";
import { getAllGstMaster } from "@/state/gstMasterSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { createYarnSalesOrder, updateYarnSalesOrder } from "@/state/yarnSalesSlice";
import { ArrowLeft, FileText, ShoppingCart, ClipboardList, Trash2, Plus } from "lucide-react";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import documentNumberService from "@/services/DocumentNumberService";
import { toast } from "react-toastify";

interface FormData {
  yarnSalesNo: string;
  orderDate: string;
  buyerId: string;
  deliveryAtId: string;
  gstTypeId: string;
  shipmentTermsId: string;
  paymentTermsId: string;
  termsConditionsId: string;
  modeOfShipmentId: string;
}

interface YarnSalesItem {
  id?: number;
  yarnId: string;
  yarnName?: string;
  millId?: string;
  millName?: string;
  orderQuantity: string;
  ratePerUnit: string;
  uomId: string;
  uomName?: string;
  taxableValue: string;
  gstPercentId: string;
  gstPercent: string;
  gstAmount: string;
  totalAmount: string;
}

export default function YarnSalesOrderEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const editData: any = location.state?.yarnSalesOrder;

  const { customerList } = useSelector((s: RootState) => s.customer);
  const { consigneeList } = useSelector((s: RootState) => s.consignee);
  const { termsContitionsList } = useSelector((s: RootState) => s.termsConditions);
  const { paymentTermsList } = useSelector((s: RootState) => s.paymentTerms);
  const { shipmentTermsList } = useSelector((s: RootState) => s.shipmentTerms);
  const { shipmentModesList } = useSelector((s: RootState) => s.shipmentMode);
  const { yarnList } = useSelector((s: RootState) => s.yarn);
  const { categoryList } = useSelector((s: RootState) => s.category);
  const { subCategoryList } = useSelector((s: RootState) => s.subCategory);
  const { uomList } = useSelector((s: RootState) => s.uom);
  const { stateList } = useSelector((s: RootState) => s.state);
  const { cityList } = useSelector((s: RootState) => s.city);
  const { countryList } = useSelector((s: RootState) => s.country);
  const { companyMaster } = useSelector((s: RootState) => s.companyMaster as any);
  const { gstList } = useSelector((s: RootState) => s.gst as any);

  const [items, setItems] = useState<YarnSalesItem[]>([]);
  const [newItem, setNewItem] = useState<YarnSalesItem>({
    yarnId: '',
    yarnName: '',
    millId: '',
    millName: '',
    orderQuantity: '',
    ratePerUnit: '',
    uomId: '',
    uomName: '',
    taxableValue: '',
    gstPercentId: '',
    gstPercent: '',
    gstAmount: '',
    totalAmount: '',
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [companyStateCode, setCompanyStateCode] = useState<string>('');
  const [buyerStateCode, setBuyerStateCode] = useState<string>('');
  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [deliveryAtAddress, setDeliveryAtAddress] = useState<string>('');
  const [deliveryAtStateCode, setDeliveryAtStateCode] = useState<string>('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      orderDate: new Date().toISOString().slice(0, 10),
      gstTypeId: '',
    }
  });

  const buyerId = watch('buyerId');
  const gstTypeId = watch('gstTypeId');
  const deliveryAtId = watch('deliveryAtId');

    const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      // Only generate for new entries (not editing existing ones)
      if (editData || hasGeneratedNumberRef.current) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Yarn Sales'
        });

        setValue('yarnSalesNo', result.documentNumber, { shouldValidate: true });
        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate Yarn Sales number:', error);
        toast.error('Failed to generate Yarn Sales number');
      }
    };

    generateDocumentNumber();
  }, [editData, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
        documentNumberService.clearMemoryCache('Yarn Sales');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !editData) {
        documentNumberService.clearMemoryCache('Yarn Sales');
      }
    };
  }, [editData]);

  useEffect(() => {
    setValue('yarnSalesNo', editData?.yarnSalesNo || '');
  }, [editData, setValue]);


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

  const millSubCategories = useMemo(() => {
    return (subCategoryList || []).filter((sc: any) => 
      String(sc.categoryName || '').toLowerCase() === 'mill'
    );
  }, [subCategoryList]);

  const resolveYarnGstDetails = (yarn: any, gstTypeValue: string) => {
    console.log('=== GST RESOLUTION DEBUG ===');
    console.log('Input yarn:', yarn);
    console.log('Input gstTypeValue:', gstTypeValue);
    
    if (!yarn) {
      console.log('No yarn data provided');
      return { rate: '', id: '' };
    }

    const type = gstTypeValue || String(yarn.taxType || '');
    console.log('Resolved GST type:', type);
    let resolvedRate: number | null = null;

    if (type === '2') {
      // IGST case
      console.log('Processing IGST case');
      console.log('Yarn IGST value:', yarn.igst);
      console.log('Yarn CGST value:', yarn.cgst);
      console.log('Yarn SGST value:', yarn.sgst);
      console.log('Yarn GST percent value:', yarn.gstPercent);
      
      // For IGST transactions, if yarn has IGST value, use it
      // Otherwise, if yarn has CGST/SGST, double the CGST (or SGST) to get IGST equivalent
      // Finally, fallback to gstPercent
      const igstValue = yarn.igst != null && yarn.igst !== 0 ? Number(yarn.igst) : null;
      const cgstValue = yarn.cgst != null && yarn.cgst !== 0 ? Number(yarn.cgst) : null;
      const sgstValue = yarn.sgst != null && yarn.sgst !== 0 ? Number(yarn.sgst) : null;
      const gstPercentValue = yarn.gstPercent != null ? Number(yarn.gstPercent) : null;
      
      console.log('Converted IGST value:', igstValue);
      console.log('Converted CGST value:', cgstValue);
      console.log('Converted SGST value:', sgstValue);
      console.log('Converted GST percent value:', gstPercentValue);
      
      if (igstValue != null && !Number.isNaN(igstValue) && igstValue > 0) {
        resolvedRate = igstValue;
      } else if (cgstValue != null && !Number.isNaN(cgstValue) && cgstValue > 0) {
        // For IGST, use CGST * 2 (CGST + SGST equivalent)
        resolvedRate = cgstValue * 2;
      } else if (sgstValue != null && !Number.isNaN(sgstValue) && sgstValue > 0) {
        // For IGST, use SGST * 2 (CGST + SGST equivalent)
        resolvedRate = sgstValue * 2;
      } else if (gstPercentValue != null && !Number.isNaN(gstPercentValue)) {
        resolvedRate = gstPercentValue;
      }
      
      console.log('Final IGST resolved rate:', resolvedRate);
    } else if (type === '1') {
      // CGST/SGST case
      console.log('Processing CGST/SGST case');
      console.log('Yarn CGST value:', yarn.cgst);
      console.log('Yarn SGST value:', yarn.sgst);
      console.log('Yarn IGST value:', yarn.igst);
      console.log('Yarn GST percent value:', yarn.gstPercent);
      
      const cgstValue = yarn.cgst != null && yarn.cgst !== 0 ? Number(yarn.cgst) : null;
      const sgstValue = yarn.sgst != null && yarn.sgst !== 0 ? Number(yarn.sgst) : null;
      const igstValue = yarn.igst != null && yarn.igst !== 0 ? Number(yarn.igst) : null;
      const gstPercentValue = yarn.gstPercent != null ? Number(yarn.gstPercent) : null;
      
      console.log('Converted CGST value:', cgstValue);
      console.log('Converted SGST value:', sgstValue);
      console.log('Converted IGST value:', igstValue);
      console.log('Converted GST percent value:', gstPercentValue);
      
      if (cgstValue != null && !Number.isNaN(cgstValue)) {
        resolvedRate = cgstValue;
      } else if (sgstValue != null && !Number.isNaN(sgstValue)) {
        resolvedRate = sgstValue;
      } else if (igstValue != null && !Number.isNaN(igstValue) && igstValue > 0) {
        // For CGST/SGST, if yarn only has IGST, divide by 2 to get CGST/SGST equivalent
        resolvedRate = igstValue / 2;
      } else if (gstPercentValue != null && !Number.isNaN(gstPercentValue)) {
        resolvedRate = gstPercentValue;
      }
      
      console.log('Final CGST/SGST resolved rate:', resolvedRate);
    } else {
      // Default case
      console.log('Processing default case');
      const gstPercentValue = yarn.gstPercent != null ? Number(yarn.gstPercent) : null;
      resolvedRate = gstPercentValue != null && !Number.isNaN(gstPercentValue) ? gstPercentValue : null;
    }

    console.log('Final resolved rate:', resolvedRate);

    if (resolvedRate == null || Number.isNaN(resolvedRate)) {
      console.log('No valid GST rate found');
      return { rate: '', id: '' };
    }

    let resolvedId = '';
    console.log('GST List length:', gstList?.length || 0);
    console.log('GST List:', gstList);
    
    if (Array.isArray(gstList) && gstList.length > 0) {
      const matched = gstList.find((gst: any) => {
        console.log('Checking GST entry:', gst);
        if (type === '2') {
          // Fix: Handle string comparison and null checks for IGST
          const igstRateValue = gst.igstRate != null ? Number(gst.igstRate) : null;
          console.log('GST IGST rate value:', igstRateValue, 'vs resolved rate:', resolvedRate);
          return igstRateValue != null && !Number.isNaN(igstRateValue) && igstRateValue === resolvedRate;
        }
        // Fix: Handle string comparison and null checks for CGST/SGST
        const cgstRateValue = gst.cgstRate != null ? Number(gst.cgstRate) : null;
        const sgstRateValue = gst.sgstRate != null ? Number(gst.sgstRate) : null;
        const cgstMatch = cgstRateValue != null && !Number.isNaN(cgstRateValue) && cgstRateValue === resolvedRate;
        const sgstMatch = sgstRateValue != null && !Number.isNaN(sgstRateValue) && sgstRateValue === resolvedRate;
        console.log('GST CGST/SGST match:', cgstMatch, sgstMatch);
        return cgstMatch || sgstMatch;
      });
      console.log('Matched GST entry:', matched);
      if (matched?.id != null) {
        resolvedId = String(matched.id);
      }
    }

    console.log('Final result:', { rate: resolvedRate.toString(), id: resolvedId });
    console.log('=== END GST RESOLUTION DEBUG ===');
    
    return {
      rate: resolvedRate.toString(),
      id: resolvedId,
    };
  };

  useEffect(() => {
    dispatch(getAllCustomers({fetchAll : true} as any));
    dispatch(getAllConsignee({fetchAll : true} as any));
    dispatch(getAllTermsConditions({fetchAll : true} as any));
    dispatch(getAllPaymentTerms({fetchAll : true} as any));
    dispatch(getAllShipmentTerms({fetchAll : true} as any));
    dispatch(getAllShipmentModes({fetchAll : true} as any));
    dispatch(getAllYarnMasters({fetchAll : true} as any));
    dispatch(getAllCategories({fetchAll : true} as any));
    dispatch(getAllSubCategories({fetchAll : true} as any));
    dispatch(getAllUomMaster({fetchAll : true} as any));
    dispatch(getAllStates({fetchAll : true} as any));
    dispatch(getAllCities({fetchAll : true} as any));
    dispatch(getAllCountries({fetchAll : true} as any));
    dispatch(getAllGstMaster({fetchAll : true} as any));
    
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (storedCompanyId) {
      dispatch(getCompanyById({ id: Number(storedCompanyId) }) as any)
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
  }, [dispatch]);

  useEffect(() => {
    if (editData) {
      reset({
        orderDate: editData.orderDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        buyerId: String(editData.buyerId || ''),
        deliveryAtId: String(editData.deliveryAtId || ''),
        gstTypeId: String(editData.gstTypeId || ''),
        shipmentTermsId: String(editData.shipmentTermsId || ''),
        paymentTermsId: String(editData.paymentTermsId || ''),
        termsConditionsId: String(editData.termsConditionsId || ''),
        modeOfShipmentId: String(editData.modeOfShipmentId || ''),
      });

      setItems((editData.items || []).map((item: any) => {
        const yarn = yarnList?.find((y: any) => y.id === item.yarnId);
        const mill = subCategoryList?.find((sc: any) => sc.id === item.millId);
        const uom = uomList?.find((u: any) => u.id === item.uomId);
        const gst = gstList?.find((g: any) => g.id === item.gstPercentId);
        
        let gstPercent = '';
        if (gst) {
          if (editData.gstTypeId === 1) {
            gstPercent = String(gst.cgstRate || gst.sgstRate || '');
          } else if (editData.gstTypeId === 2) {
            gstPercent = String(gst.igstRate || '');
          }
        }
        
        return {
          id: item.id,
          yarnId: String(item.yarnId || ''),
          yarnName: yarn?.yarnName || yarn?.name || item.yarnName || '',
          millId: String(item.millId || ''),
          millName: mill?.subCategoryName || mill?.name || item.millName || '',
          orderQuantity: String(item.orderQuantity || ''),
          ratePerUnit: String(item.ratePerUnit || ''),
          uomId: String(item.uomId || ''),
          uomName: uom?.uomName || uom?.name || item.uomName || '',
          taxableValue: String(item.taxableValue || ''),
          gstPercentId: String(item.gstPercentId || ''),
          gstPercent: gstPercent || String(item.gstPercent || ''),
          gstAmount: String(item.gstAmount || ''),
          totalAmount: String(item.totalAmount || ''),
        };
      }));
    }
  }, [editData, reset, yarnList, subCategoryList, uomList, gstList]);

  // useEffect(() => {
  //   if (editData) return;
  //   let active = true;
  //   const fetchYarnSalesNo = async () => {
  //     setIsYarnSalesNoLoading(true);
  //     try {
  //       const { documentNumber } = await documentNumberService.generateDocumentNumber({
  //         screenName: "Yarn Sales"
  //       });
  //       if (active) setYarnSalesNo(documentNumber);
  //     } catch (error) {
  //       console.error("Failed to generate yarn sales number", error);
  //     } finally {
  //       if (active) setIsYarnSalesNoLoading(false);
  //     }
  //   };
  //   fetchYarnSalesNo();
  //   return () => {
  //     active = false;
  //   };
  // }, [editData]);

  useEffect(() => {
    if (!buyerId) {
      setBuyerStateCode('');
      return;
    }

    const buyer = (customerList || []).find((c: any) => String(c.id) === String(buyerId));
    if (!buyer) {
      setBuyerStateCode('');
      return;
    }

    const addr = Array.isArray(buyer?.address) ? buyer.address[0] : buyer?.address;
    const stId = addr?.stateId || addr?.stateCode;
    const mapped = (stateList || []).find((st: any) => st.id === stId || st.stateCode === stId)?.stateCode;
    const code = mapped || addr?.stateCode || '';
    setBuyerStateCode(code);
  }, [buyerId, customerList, stateList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buyerId) {
        setIsLoadingAddresses(true);
        const buyer = (customerList || []).find((c: any) => String(c.id) === String(buyerId));

        if (buyer?.address) {
          const completeAddress = formatCompleteAddress(
            buyer.address,
            cityList,
            stateList,
            countryList
          );
          setBuyerAddress(completeAddress || '');
        } else {
          setBuyerAddress('');
        }
        setIsLoadingAddresses(false);
      } else {
        setBuyerAddress('');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [buyerId, customerList, cityList, stateList, countryList]);

  useEffect(() => {
    if (deliveryAtId) {
      const consignee = (consigneeList || []).find((c: any) => String(c.id) === String(deliveryAtId));

      if (consignee?.address) {
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
  }, [deliveryAtId, consigneeList, cityList, stateList, countryList]);

  useEffect(() => {
    if (!buyerStateCode || !companyStateCode) return;
    
    const newTaxId = buyerStateCode === companyStateCode ? '1' : '2';
    setValue('gstTypeId', newTaxId, { shouldValidate: true, shouldDirty: false });
  }, [buyerStateCode, companyStateCode, setValue]);

  useEffect(() => {
    setNewItem(prev => {
      if (!prev.yarnId) return prev;
      const yarn = (yarnList || []).find((y: any) => String(y.id) === String(prev.yarnId));
      if (!yarn) return prev;
      const { rate, id } = resolveYarnGstDetails(yarn, gstTypeId);
      if (rate === prev.gstPercent && id === (prev.gstPercentId || '')) {
        return prev;
      }
      return {
        ...prev,
        gstPercent: rate,
        gstPercentId: id,
      };
    });
  }, [gstTypeId, yarnList, gstList]);

  useEffect(() => {
    if (uomList && uomList.length > 0 && !newItem.uomId && !editData) {
      const kilogramUom = uomList.find((u: any) => 
        (u.uomName || u.name || '').toLowerCase() === 'kilogram'
      );
      if (kilogramUom) {
        setNewItem(prev => ({
          ...prev,
          uomId: String(kilogramUom.id),
          uomName: kilogramUom.uomName || kilogramUom.name || '',
        }));
      }
    }
  }, [uomList, editData]);

  const handleYarnChange = (yarnId: string) => {
    const yarn: any = (yarnList || []).find((y: any) => String(y.id) === String(yarnId));
    if (yarn) {
      const { rate, id } = resolveYarnGstDetails(yarn, gstTypeId);
      setNewItem((prev) => ({
        ...prev,
        yarnId,
        yarnName: yarn.yarnName || yarn.name || '',
        gstPercentId: id,
        gstPercent: rate,
      }));
    } else {
      setNewItem((prev) => ({
        ...prev,
        yarnId,
        yarnName: '',
        gstPercentId: '',
        gstPercent: '',
      }));
    }
  };

  const handleMillChange = (millId: string) => {
    const mill: any = subCategoryList.find((s: any) => String(s.id) === String(millId));
    setNewItem({
      ...newItem,
      millId,
      millName: mill ? (mill.subCategoryName || mill.name || '') : '',
    });
  };

  const handleUomChange = (uomId: string) => {
    const uom: any = uomList.find((u: any) => String(u.id) === String(uomId));
    setNewItem({
      ...newItem,
      uomId,
      uomName: uom ? (uom.uomName || uom.name || '') : '',
    });
  };

  useEffect(() => {
    const qty = parseFloat(newItem.orderQuantity) || 0;
    const rate = parseFloat(newItem.ratePerUnit) || 0;
    const taxable = qty * rate;
    const gstPct = parseFloat(newItem.gstPercent) || 0;
    const gstAmt = (taxable * gstPct) / 100;
    const total = taxable + gstAmt;

    setNewItem(prev => ({
      ...prev,
      taxableValue: taxable.toFixed(2),
      gstAmount: gstAmt.toFixed(2),
      totalAmount: total.toFixed(2),
    }));
  }, [newItem.orderQuantity, newItem.ratePerUnit, newItem.gstPercent]);

  const handleAddItem = () => {
    if (!newItem.yarnId || !newItem.orderQuantity || !newItem.ratePerUnit || !newItem.uomId) {
      alert('Please fill all required fields');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = { ...newItem };
      setItems(updated);
      setEditingIndex(null);
    } else {
      setItems([...items, { ...newItem }]);
    }

    setNewItem({
      yarnId: '',
      yarnName: '',
      millId: '',
      millName: '',
      orderQuantity: '',
      ratePerUnit: '',
      uomId: '',
      uomName: '',
      taxableValue: '',
      gstPercentId: '',
      gstPercent: '',
      gstAmount: '',
      totalAmount: '',
    });
  };

  const handleEditItem = (index: number) => {
    setNewItem({ ...items[index] });
    setEditingIndex(index);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = storedCompanyId ? Number(storedCompanyId) : null;
  
 const isEditMode = Boolean(editData?.id);
       let yarnSalesNo = data.yarnSalesNo || editData?.yarnSalesNo || "";
            if (!editData?.id && !yarnSalesNo) {
                try {
                    const docResponse = await documentNumberService.generateDocumentNumber({
                        screenName: "Yarn Sales",
                    });
                    yarnSalesNo = docResponse.documentNumber;
                } catch (error) {
                    console.warn("Failed to generate document number:", error);
                }
            }
isSavingRef.current = true;

    const payload = {
      yarnSalesNo: yarnSalesNo,
      orderDate: data.orderDate,
      buyerId: Number(data.buyerId),
      deliveryAtId: Number(data.deliveryAtId),
      gstTypeId: Number(data.gstTypeId),
      shipmentTermsId: data.shipmentTermsId ? Number(data.shipmentTermsId) : null,
      paymentTermsId: data.paymentTermsId ? Number(data.paymentTermsId) : null,
      termsConditionsId: data.termsConditionsId ? Number(data.termsConditionsId) : null,
      modeOfShipmentId: data.modeOfShipmentId ? Number(data.modeOfShipmentId) : null,
      companyId: companyId,
      items: items.map(item => ({
        id: item.id,
        yarnId: Number(item.yarnId),
        millId: item.millId ? Number(item.millId) : null,
        orderQuantity: parseFloat(item.orderQuantity),
        ratePerUnit: parseFloat(item.ratePerUnit),
        uomId: Number(item.uomId),
        taxableValue: parseFloat(item.taxableValue),
        gstPercentId: item.gstPercentId ? Number(item.gstPercentId) : null,
        gstPercent: parseFloat(item.gstPercent) || 0,
        gstAmount: parseFloat(item.gstAmount),
        totalAmount: parseFloat(item.totalAmount),
      })),
      activeFlag: true,
    } as any;

    if (isEditMode) {
      await dispatch(updateYarnSalesOrder({ id: editData.id, data: payload, companyId } as any));
    } else {
      await dispatch(createYarnSalesOrder(payload as any));
       documentNumberService.clearMemoryCache("Yarn Sales");
    }
    navigate('/transaction/yarn-sales-order-list');
  };

  const summaryData = useMemo(() => {
    return items.map((item, index) => ({
      serialNo: index + 1,
      yarnName: item.yarnName,
      millName: item.millName || '-',
      quantity: item.orderQuantity,
    }));
  }, [items]);

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/yarn-sales-order-list")}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">Yarn Sales Order</h2>
          </div>
          
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} /> Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium">Yarn Sales No</label>
               <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                    {...register('yarnSalesNo')} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">Order Date <span className="text-red-600">*</span></label>
                <input type="date" className="input mt-1" {...register('orderDate', { required: 'Required' })} />
                {errors.orderDate && <p className="mt-1 text-sm text-red-600">{String(errors.orderDate.message)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Buyer Name <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select Buyer"
                  value={watch('buyerId') || ''}
                  options={(customerList || []).map((c: any) => ({
                    value: String(c.id),
                    label: c.customerName,
                    activeFlag: c.activeFlag ?? true,
                  }))}
                  filterActive
                  {...register('buyerId', { required: 'Required' })}
                  onValueChange={(value) => setValue('buyerId', value, { shouldValidate: true })}
                  error={errors.buyerId?.message as string}
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
              <div>
                <label className="block text-sm font-medium">Delivery At <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select Consignee"
                  value={watch('deliveryAtId') || ''}
                  options={(consigneeList || []).map((c: any) => ({
                    value: String(c.id),
                    label: c.consigneeName || c.name,
                    activeFlag: c.activeFlag ?? true,
                  }))}
                  filterActive
                  {...register('deliveryAtId', { required: 'Required' })}
                  onValueChange={(value) => setValue('deliveryAtId', value, { shouldValidate: true })}
                  error={errors.deliveryAtId?.message as string}
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
              <div>
                <label className="block text-sm font-medium">GST Type <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select GST Type"
                  disabled
                  value={watch('gstTypeId') || ''}
                  options={[
                    { value: "1", label: "CGST/SGST" },
                    { value: "2", label: "IGST" },
                  ]}
                  {...register('gstTypeId', { required: 'Required' })}
                  onValueChange={(value) => setValue('gstTypeId', value, { shouldValidate: true })}
                  error={errors.gstTypeId?.message as string}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Shipment Terms <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select Shipment Terms"
                  value={watch('shipmentTermsId') || ''}
                  options={(shipmentTermsList || []).map((t: any) => ({
                    value: String(t.id),
                    label: t.termName,
                    activeFlag: t.activeFlag ?? true,
                  }))}
                  filterActive
                  {...register('shipmentTermsId', { required: 'Required' })}
                  onValueChange={(value) => setValue('shipmentTermsId', value, { shouldValidate: true })}
                  error={errors.shipmentTermsId?.message as string}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Payment Terms <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select Payment Terms"
                  value={watch('paymentTermsId') || ''}
                  options={(paymentTermsList || []).map((t: any) => ({
                    value: String(t.id),
                    label: t.termName,
                    activeFlag: t.activeFlag ?? true,
                  }))}
                  filterActive
                  {...register('paymentTermsId', { required: 'Required' })}
                  onValueChange={(value) => setValue('paymentTermsId', value, { shouldValidate: true })}
                  error={errors.paymentTermsId?.message as string}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Terms & Conditions <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select Terms & Conditions"
                  value={watch('termsConditionsId') || ''}
                  options={(termsContitionsList || []).map((t: any) => ({
                    value: String(t.id),
                    label: t.termsConditionsName,
                    activeFlag: t.activeFlag ?? true,
                  }))}
                  filterActive
                  {...register('termsConditionsId', { required: 'Required' })}
                  onValueChange={(value) => setValue('termsConditionsId', value, { shouldValidate: true })}
                  error={errors.termsConditionsId?.message as string}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mode of Shipment <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select Mode of Shipment"
                  value={watch('modeOfShipmentId') || ''}
                  options={(shipmentModesList || []).map((m: any) => ({
                    value: String(m.id),
                    label: m.modeName,
                    activeFlag: m.activeFlag ?? true,
                  }))}
                  filterActive
                  {...register('modeOfShipmentId', { required: 'Required' })}
                  onValueChange={(value) => setValue('modeOfShipmentId', value, { shouldValidate: true })}
                  error={errors.modeOfShipmentId?.message as string}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart size={20} /> Item Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">Yarn Name <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select Yarn"
                  value={newItem.yarnId}
                  options={(yarnList || []).map((y: any) => ({
                    value: String(y.id),
                    label: y.yarnName || y.name,
                    activeFlag: y.activeFlag ?? true,
                  }))}
                  filterActive
                  onValueChange={(value) => handleYarnChange(value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mill Name</label>
                <CommonSearchableSelect
                  placeholder="Select Mill"
                  value={newItem.millId}
                  options={(millSubCategories || []).map((s: any) => ({
                    value: String(s.id),
                    label: s.subCategoryName || s.name,
                    activeFlag: s.activeFlag ?? true,
                  }))}
                  filterActive
                  onValueChange={(value) => handleMillChange(value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Order Quantity <span className="text-red-600">*</span></label>
                <input
                  type="number"
                  value={newItem.orderQuantity}
                  onChange={(e) => setNewItem({ ...newItem, orderQuantity: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Rate / Unit <span className="text-red-600">*</span></label>
                <input
                  type="number"
                  value={newItem.ratePerUnit}
                  onChange={(e) => setNewItem({ ...newItem, ratePerUnit: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">UOM <span className="text-red-600">*</span></label>
                <CommonSearchableSelect
                  placeholder="Select UOM"
                  value={newItem.uomId}
                  options={(uomList || []).map((u: any) => ({
                    value: String(u.id),
                    label: u.uomName || u.name,
                    activeFlag: u.activeFlag ?? true,
                  }))}
                  filterActive
                  onValueChange={(value) => handleUomChange(value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Taxable Value</label>
                <input type="text" value={newItem.taxableValue} className="input mt-1 bg-gray-100" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">GST % <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={newItem.gstPercent}
                  readOnly
                  className="input mt-1 bg-gray-100"
                  placeholder="Auto-selected from Yarn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">GST Amount</label>
                <input type="text" value={newItem.gstAmount} className="input mt-1 bg-gray-100" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium">Total Amount</label>
                <input type="text" value={newItem.totalAmount} className="input mt-1 bg-gray-100" readOnly />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddItem} className="bg-primary text-white w-full">
                  <Plus size={16} className="mr-2" />
                  {editingIndex !== null ? 'Update' : 'Add'} Row
                </Button>
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">S.No</th>
                  <th className="border border-gray-300 px-4 py-2">Yarn Name</th>
                  <th className="border border-gray-300 px-4 py-2">Mill Name</th>
                  <th className="border border-gray-300 px-4 py-2">Order Quantity</th>
                  <th className="border border-gray-300 px-4 py-2">Rate/Unit</th>
                  <th className="border border-gray-300 px-4 py-2">UOM</th>
                  <th className="border border-gray-300 px-4 py-2">Taxable Value</th>
                  <th className="border border-gray-300 px-4 py-2">GST %</th>
                  <th className="border border-gray-300 px-4 py-2">GST Amount</th>
                  <th className="border border-gray-300 px-4 py-2">Total Amount</th>
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.yarnName}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.millName || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.orderQuantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.ratePerUnit}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.uomName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.taxableValue}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.gstPercent}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.gstAmount}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.totalAmount}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2 justify-center">
                        <Button size="sm" onClick={() => handleEditItem(index)} variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => handleDeleteItem(index)} variant="destructive">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={11} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                      No items added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList size={20} /> Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">S.No</th>
                  <th className="border border-gray-300 px-4 py-2">Yarn Name</th>
                  <th className="border border-gray-300 px-4 py-2">Mill Name</th>
                  <th className="border border-gray-300 px-4 py-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.length > 0 ? summaryData.map((row) => (
                  <tr key={row.serialNo}>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.serialNo}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.yarnName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.millName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.quantity}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                      No summary available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end mt-4">
            <Button onClick={handleSubmit(onSubmit)} className="bg-primary hover:bg-primary text-white px-6">
              {editData ? 'Update' : 'Save'}
            </Button>
          </div>
    </div>
  );
}
