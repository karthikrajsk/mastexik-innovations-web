import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllProductCategory } from "@/state/productCategorySlice";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllConsignee } from "@/state/consigneeSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { createDyeingWorkOrder, updateDyeingWorkOrder } from "@/state/processContractSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllFinishFabric } from "@/state/finishMasterSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllProcessMaster } from "@/state/processMasterSlice";
import { getAllGstMaster } from "@/state/gstMasterSlice";
import { getCompanyById } from "@/state/company-master-slice";
import { getAllStates } from "@/state/stateSlice";
import { toast } from "react-toastify";
import { documentNumberService } from "@/services/DocumentNumberService";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";

interface dyeingDtl {
  id?: number;
  finishedFabricCodeId: string;
  finishedFabricName: string;
  greigeFabricCodeId: string;
  greigeFabricName: string;
  quantity: string;
  costPerPound: string;
  gstPercent: string;
  gstAmount: string;
  totalAmount: string;
  finalAmount: string;
  colorId: string;
  pantone: string;
  finishedWeight: string;
  greigeWidth: string;
  reqFinishedWidth: string;
  uomId: string;
  remarks: string;
  activeFlag: boolean;
}

interface PurchaseOrderFormData {
  id?: number | null;
  dyeingWorkOrderNo: string;
  processContractDate: string;
  processTypeId: string;
  vendorId: string;
  gstTypeId: string;
  expectedDeliveryDate: string;
  salesOrderId: string;
  consigneeId: string;
  labDipStatusId: string;
  firstYardageId: string;
  instructions: string;
  activeFlag: boolean;
  isComplete?: number;
  dyeingDtl: dyeingDtl[];
}

const PROCESS_VENDOR_TYPE_IDS = [304, VENDOR_TYPE_ALL];

export function ProcessContractEntry() {
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const { finishFabricList } = useSelector((state: RootState) => state.finishFabric);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { processMasterList } = useSelector((state: RootState) => state.process);
  const { gstList } = useSelector((state: RootState) => state.gst);
  const { stateList } = useSelector((state: RootState) => state.state);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();
  const dyeingWorkOrderDtl = location.state?.order;
  const isEdit = !!dyeingWorkOrderDtl;
  const companyId = useResolvedCompanyId();
  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);
  const prevVendorIdRef = useRef<string | null>(null);

  const [companyStateCode, setCompanyStateCode] = useState<string>("");
  const [vendorStateCode, setVendorStateCode] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid: isFormValid },
    watch
  } = useForm<PurchaseOrderFormData>({
    mode: 'onChange',
    defaultValues: {
      activeFlag: true,
      processContractDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
    }
  });

  const [dyeingDtl, setDyeingDtl] = useState<dyeingDtl[]>(dyeingWorkOrderDtl?.items || []);
  const [newItem, setNewItem] = useState<Partial<dyeingDtl>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("orderDetails");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { subCategoryList } = useSelector((state: RootState) => state.subCategory);

  const activeProcessMasterList = useMemo(() => processMasterList?.filter((p: any) => p.activeFlag !== false) || [], [processMasterList]);
  const activeSalesOrderList = useMemo(() => salesOrderList?.filter((so: any) => so.activeFlag !== false && so.isApproved === 1) || [], [salesOrderList]);
  const activeConsigneeList = useMemo(() => consigneeList?.filter((c: any) => c.activeFlag !== false) || [], [consigneeList]);
  const activeFabricMasterList = useMemo(() => fabricMasterList?.filter((fm: any) => fm.activeFlag !== false) || [], [fabricMasterList]);
  const activeUomList = useMemo(() => uomList?.filter((u: any) => u.activeFlag !== false) || [], [uomList]);

  // Check if form is ready to be submitted
  const isSubmitDisabled = !isFormValid || dyeingDtl.length === 0 || isSubmitting;

  const activeVendorList = useMemo(() => vendorList?.filter((v: any) => v.activeFlag !== false) || [], [vendorList]);

  const processVendors = useMemo(
    () => filterVendorsByTypeIds(activeVendorList, PROCESS_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
    [activeVendorList],
  );

  const selectedVendorId = watch('vendorId');
  const selectedGstTypeId = watch('gstTypeId');

  const selectedVendor = useMemo(() => {
    if (!selectedVendorId) {
      return null;
    }
    const base = Array.isArray(vendorList) ? vendorList : [];
    return base.find((vendor: any) => String(vendor?.id) === String(selectedVendorId)) || null;
  }, [selectedVendorId, vendorList]);

  const selectedVendorMissing = useMemo(() => {
    if (!selectedVendor) {
      return false;
    }
    return !processVendors.some((vendor: any) => String(vendor?.id) === String(selectedVendor.id));
  }, [selectedVendor, processVendors]);

  useEffect(() => {
    if (!selectedVendorId) {
      setVendorStateCode("");
      return;
    }

    if (selectedVendor) {
      const addr = Array.isArray(selectedVendor?.address) ? selectedVendor.address[0] : selectedVendor?.address;
      const stId = addr?.stateId || addr?.stateCode;
      const mapped = (stateList || []).find((st: any) => String(st.id) === String(stId) || String(st.stateCode) === String(stId))?.stateCode;
      const code = mapped || addr?.stateCode || "";
      setVendorStateCode(code);
    }
  }, [selectedVendorId, selectedVendor, stateList]);

  useEffect(() => {
    if (selectedVendorId) {
      if (!isEdit || (prevVendorIdRef.current !== null && prevVendorIdRef.current !== selectedVendorId)) {
        if (vendorStateCode && companyStateCode) {
          const newGstTypeId = vendorStateCode === companyStateCode ? "1" : "2";
          setValue("gstTypeId", newGstTypeId, { shouldValidate: true });
        } else {
          const vendorGstTypeId = selectedVendor?.gstTypeId || selectedVendor?.taxTypeId || selectedVendor?.gstType || "";
          if (vendorGstTypeId) {
            setValue("gstTypeId", String(vendorGstTypeId), { shouldValidate: true });
          }
        }
      }
      prevVendorIdRef.current = selectedVendorId;
    }
  }, [selectedVendorId, selectedVendor, vendorStateCode, companyStateCode, setValue, isEdit]);

  useEffect(() => {
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllProductCategory({}));
    const salesOrderParams = companyId ? { companyId } : {};
    dispatch(getAllSalesOrders(salesOrderParams));
    dispatch(getAllConsignee({ fetchAll: true }));
    dispatch(getAllUomMaster({ fetchAll: true }));
    dispatch(getAllFinishFabric({ fetchAll: true }));
    dispatch(getAllFabricMasters({ fetchAll: true }));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(getAllProcessMaster({ fetchAll: true }));
    dispatch(getAllGstMaster({ fetchAll: true }));
    dispatch(getAllStates({ fetchAll: true }));

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (storedCompanyId) {
      dispatch(getCompanyById({ id: Number(storedCompanyId) }))
        .unwrap()
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
  }, [dispatch, companyId]);

  const colours = useMemo(
    () => subCategoryList?.filter((sc: any) => sc.categoryName === "Colour" && sc.activeFlag !== false) || [],
    [subCategoryList]
  );

  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      if (dyeingWorkOrderDtl || hasGeneratedNumberRef.current) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Process Contract Management',
          tabName: 'processContactFabric',
        });
        setValue('dyeingWorkOrderNo', result.documentNumber, { shouldValidate: true });

        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate packing list number:', error);
        toast.error('Failed to generate packing list number');
      }
    };

    generateDocumentNumber();
  }, [dyeingWorkOrderDtl, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !dyeingWorkOrderDtl) {
        documentNumberService.clearMemoryCache('Process Contract Management', 'processContactFabric');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !dyeingWorkOrderDtl) {
        documentNumberService.clearMemoryCache('Process Contract Management', 'processContactFabric');
      }
    };
  }, [dyeingWorkOrderDtl]);

  useEffect(() => {
    setValue('dyeingWorkOrderNo', dyeingWorkOrderDtl?.dyeingWorkOrderNo || '');
  }, [dyeingWorkOrderDtl, setValue]);


  useEffect(() => {
    if (isEdit && dyeingWorkOrderDtl) {
      reset({
        processContractDate: dyeingWorkOrderDtl.processContactDate,
        processTypeId: (dyeingWorkOrderDtl.processId || dyeingWorkOrderDtl.processTypeId || "")?.toString(),
        gstTypeId: (dyeingWorkOrderDtl.gstTypeId || "")?.toString(),
        expectedDeliveryDate: dyeingWorkOrderDtl.deliveryDate,
        vendorId: dyeingWorkOrderDtl.vendorId?.toString(),
        salesOrderId: dyeingWorkOrderDtl.salesOrderNo?.toString(),
        consigneeId: dyeingWorkOrderDtl.consigneeId?.toString(),
        labDipStatusId: dyeingWorkOrderDtl.lapDipStatusId?.toString(),
        firstYardageId: dyeingWorkOrderDtl.firstYardageId?.toString(),
        instructions: dyeingWorkOrderDtl.remarks,
        activeFlag: dyeingWorkOrderDtl.activeFlag,
        isComplete: dyeingWorkOrderDtl.isComplete,
      });
      setDyeingDtl(dyeingWorkOrderDtl.items || []);
    }
  }, [isEdit, dyeingWorkOrderDtl, reset]);

  const validateItem = (item: Partial<dyeingDtl>): boolean => {
    return !!(
      item.finishedFabricCodeId &&
      item.greigeFabricCodeId &&
      item.quantity &&
      Number(item.quantity) > 0 &&
      item.costPerPound &&
      Number(item.costPerPound) > 0
    );
  };

  const addItem = () => {
    if (!validateItem(newItem)) {
      toast.error("Please fill all required item fields with valid values");
      return;
    }

    const itemToAdd = {
      ...newItem,
      activeFlag: true
    } as dyeingDtl;

    if (editingIndex !== null) {
      const updatedItems = [...dyeingDtl];
      updatedItems[editingIndex] = itemToAdd;
      setDyeingDtl(updatedItems);
      setEditingIndex(null);
    } else {
      setDyeingDtl([...dyeingDtl, itemToAdd]);
    }
    setNewItem({});
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const update: any = { ...newItem, [name]: value };

    if (name === "finishedFabricCodeId") {
      // Find in fabricMasterList for finished fabrics (fabricType === 2)
      const fabricObj = fabricMasterList.find((fm: any) => fm.id?.toString() === value);
      const fabricName = fabricObj?.fabricName || "";
      const fabricQuality = fabricObj?.fabricQuality || "";
      update.finishedFabricName = fabricQuality ? `${fabricName} - ${fabricQuality}` : fabricName;
      update.finishedFabricCode = fabricObj?.fabricCode || "";
      update.reqFinishedWidth = fabricObj?.fabricWidth || "";
      update.gstPercent = fabricObj?.gstPercent || fabricObj?.gst || "0";
    }

    if (name === "greigeFabricCodeId") {
      // Find in fabricMasterList for greige fabrics (has greigeCode)
      const fabricObj = fabricMasterList.find((fm: any) => fm.id?.toString() === value);
      const fabricName = fabricObj?.fabricName || "";
      const fabricQuality = fabricObj?.fabricQuality || "";
      update.greigeFabricName = fabricQuality ? `${fabricName} - ${fabricQuality}` : fabricName;
      update.greigeFabricCode = fabricObj?.greigeCode || fabricObj?.fabricCode || "";
      update.greigeWidth = fabricObj?.reedspace || fabricObj?.fabricWidth || "";
    }

    if (["quantity", "costPerPound", "gstPercent", "finishedFabricCodeId"].includes(name)) {
      if (["quantity", "costPerPound", "gstPercent"].includes(name) && value && !/^\d*\.?\d*$/.test(value)) return;
      if (["quantity", "costPerPound", "gstPercent"].includes(name) && value && Number(value) < 0) return;

      // Auto-calculate total amount
      const quantity = Number(update.quantity || 0);
      const costPerPound = Number(update.costPerPound || 0);
      const gstPercent = Number(update.gstPercent || 0);

      const totalAmount = quantity * costPerPound;
      const gstAmount = totalAmount * (gstPercent / 100);
      const finalAmount = totalAmount + gstAmount;

      update.totalAmount = totalAmount.toFixed(2);
      update.gstAmount = gstAmount.toFixed(2);
      update.finalAmount = finalAmount.toFixed(2);
    }

    setNewItem(update);
  };

  const editItem = (index: number) => {
    setNewItem(dyeingDtl[index]);
    setEditingIndex(index);
    setActiveTab("itemDetails");
  };

  const deleteItem = (index: number) => {
    setDyeingDtl(dyeingDtl.filter((_, i) => i !== index));
  };


  const onSubmit = async (data: any) => {
    let dyeingWorkOrderNo = data.dyeingWorkOrderNo || dyeingWorkOrderDtl?.dyeingWorkOrderNo || "";
    if (!dyeingWorkOrderDtl?.id && !dyeingWorkOrderNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Process Contract Management",
          tabName: "processContactFabric",
        });
        dyeingWorkOrderNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;

    if (isSubmitDisabled) return;
    setIsSubmitting(true);

    try {
      const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      if (!storedCompanyId) {
        toast.error("Please select a company before submitting");
        setIsSubmitting(false);
        return;
      }

      const fabricItems = dyeingDtl.map((item: any) => {
        // Get the actual fabric objects to ensure we have correct codes
        const finishedFabric = finishFabricList?.find((ff: any) => ff.id?.toString() === item.finishedFabricCodeId);
        const greigeFabric = fabricMasterList?.find((fm: any) => fm.id?.toString() === item.greigeFabricCodeId);

        return {
          id: item.id ? Number(item.id) : 0,
          dyeingWorkOrderId: item.dyeingWorkOrderId ? Number(item.dyeingWorkOrderId) : 0,
          finishedFabricCodeId: Number(item.finishedFabricCodeId || 0),
          finishedFabricName: item.finishedFabricName || finishedFabric?.finishName || "",
          greigeFabricCodeId: Number(item.greigeFabricCodeId || 0),
          greigeFabricName: item.greigeFabricName || greigeFabric?.fabricName || "",
          quantity: Number(item.quantity || 0),
          costPerPound: Number(item.costPerPound || 0),
          totalAmount: Number(item.totalAmount || (Number(item.quantity) * Number(item.costPerPound))),
          gstPercent: Number(item.gstPercent || 0),
          gstAmount: Number(item.gstAmount || 0),
          finalAmount: Number(item.finalAmount || 0),
          colorId: Number(item.colorId || 0),
          pantone: item.pantone || "",
          finishedWeight: Number(item.finishedWeight || 0),
          greigeWidth: Number(item.greigeWidth || 0),
          reqFinishedWidth: Number(item.reqFinishedWidth || 0),
          uomId: Number(item.uomId || 0),
          remarks: item.remarks || "",
          activeFlag: item.activeFlag !== undefined ? item.activeFlag : true,
        };
      });

      const payload = {
        processType: "FABRIC",
        id: dyeingWorkOrderDtl?.id,
        dyeingWorkOrderNo: dyeingWorkOrderNo,
        processContactDate: data.processContractDate,
        processTypeId: Number(data.processTypeId || 0),
        gstTypeId: Number(data.gstTypeId || 0),
        deliveryDate: data.expectedDeliveryDate,
        vendorId: Number(data.vendorId || 0),
        salesOrderNo: Number(data.salesOrderId || 0),
        consigneeId: Number(data.consigneeId || 0),
        lapDipStatusId: Number(data.labDipStatusId || 0),
        firstYardageId: Number(data.firstYardageId || 0),
        remarks: data.instructions || "",
        activeFlag: true,
        isComplete: dyeingWorkOrderDtl?.isComplete || 0,
        fabricItems: fabricItems,
        yarnItems: [],
        companyId: parseInt(storedCompanyId)
      };
      console.log("Payload:", payload);
      if (isEdit && dyeingWorkOrderDtl?.id) {
        await dispatch(updateDyeingWorkOrder({ id: dyeingWorkOrderDtl.id, data: payload })).unwrap();
      } else {
        await dispatch(createDyeingWorkOrder(payload)).unwrap();
        documentNumberService.clearMemoryCache("Process Contract Management", "processContactFabric");
      }

      reset();
      setDyeingDtl([]);
      navigate("/transaction/process-contract-managemant", { state: { tab: "processContactFabric" } });
    } catch (err) {
      toast.error("Failed to save Process Contract");
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const labDipList = [
    { "id": 1, "name": "Approved" },
    { "id": 2, "name": "Rejected" }
  ];

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">                                         <Button
            variant="outline"
            onClick={() => navigate("/transaction/process-contract-managemant", { state: { tab: "processContactFabric" } })}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
            <h2 className="text-2xl font-semibold">{isEdit ? "Edit Process Contract" : "Process Contract"}</h2>
          </div>

        </div>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('orderDetails')}
                  className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'orderDetails'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('itemDetails')}
                  className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'itemDetails'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Dyeing Details
                </button>
              </nav>
            </div>
          </div>

          {activeTab === "orderDetails" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} /> Dyeing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-8">
                <div>
                  <label className="block text-sm mb-1">Dyeing Work Order No</label>
                  <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                    {...register('dyeingWorkOrderNo')} readOnly />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700">Process Contact Date <span className="text-red-600">*</span></label>
                  <input
                    {...register('processContractDate', { required: 'Date is required' })}
                    className="input mt-1" type="date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Process Type <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...register("processTypeId", { required: "Process Type is required" })}
                    options={activeProcessMasterList.map((p: any) => ({
                      value: String(p.id),
                      label: p.processName,
                    }))}
                    placeholder="Select Process"
                    className="mt-1"
                    error={errors.processTypeId?.message}
                  />
                  {errors.processTypeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.processTypeId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Expected Delivery Date</label>
                  <input
                    {...register('expectedDeliveryDate')}
                    className="input mt-1" type="date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Select Vendor <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...register("vendorId", { required: "Vendor is required" })}
                    options={processVendors.map((vendor: any) => ({
                      value: String(vendor.id),
                      label: vendor.vendorName || vendor.customerName || vendor.name,
                    }))}
                    placeholder="Select a Vendor"
                    className="mt-1"
                    error={errors.vendorId?.message}
                  />
                  {errors.vendorId && (
                    <p className="mt-1 text-sm text-red-600">{errors.vendorId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium">GST Type <span className="text-red-600">*</span></label>
                  <CommonSearchableSelect
                    {...register("gstTypeId", { required: "GST Type is required" })}
                    options={[
                      { value: "1", label: "CGST/SGST" },
                      { value: "2", label: "IGST" },
                    ]}
                    placeholder="Select GST Type"
                    className="mt-1"
                    disabled
                    error={errors.gstTypeId?.message}
                  />
                  {errors.gstTypeId && (
                    <p className="mt-1 text-sm text-red-600">{errors.gstTypeId.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Sales Order</label>
                  <CommonSearchableSelect
                    {...register("salesOrderId")}
                    options={activeSalesOrderList.map((so: any) => ({
                      value: String(so.id),
                      label: so.salesOrderNo,
                    }))}
                    placeholder="Select a Sales Order"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Consignee</label>
                  <CommonSearchableSelect
                    {...register("consigneeId")}
                    options={activeConsigneeList.map((c: any) => ({
                      value: String(c.id),
                      label: c.consigneeName,
                    }))}
                    placeholder="Select Consignee"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Lab Dip Status</label>
                  <CommonSearchableSelect
                    {...register("labDipStatusId")}
                    options={labDipList.map((lab: any) => ({
                      value: String(lab.id),
                      label: lab.name,
                    }))}
                    placeholder="Select Lab Dip Status"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">First Yardage</label>
                  <CommonSearchableSelect
                    {...register("firstYardageId")}
                    options={labDipList.map((lab: any) => ({
                      value: String(lab.id),
                      label: lab.name,
                    }))}
                    placeholder="Select First Yardage"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Instructions</label>
                  <textarea {...register("instructions")} className="input mt-1"></textarea>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "itemDetails" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart size={20} /> Item Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Finished Fabric Code <span className="text-red-600">*</span></label>
                      <CommonSearchableSelect
                        name="finishedFabricCodeId"
                        value={newItem.finishedFabricCodeId || ''}
                        onValueChange={(val) => handleItemChange({ target: { name: 'finishedFabricCodeId', value: val } } as any)}
                        options={activeFabricMasterList
                          ?.filter((fm: any) => fm.fabricType === 2) // Only show fabricType 2 for finished fabric
                          ?.map((fm: any) => ({
                            value: String(fm.id),
                            label: `${fm.fabricCode} - ${fm.fabricQuality}`,
                          }))}
                        placeholder="Select Finished Fabric Code"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Finished Fabric Name</label>
                      <input
                        className="input mt-1"
                        name="finishedFabricName"
                        value={newItem.finishedFabricName || ''}
                        readOnly
                        placeholder="Auto-filled from selected code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Greige Fabric Code <span className="text-red-600">*</span></label>
                      <CommonSearchableSelect
                        name="greigeFabricCodeId"
                        value={newItem.greigeFabricCodeId || ''}
                        onValueChange={(val) => handleItemChange({ target: { name: 'greigeFabricCodeId', value: val } } as any)}
                        options={activeFabricMasterList
                          ?.filter((fm: any) => fm.greigeCode && fm.greigeCode.trim() !== "") // Only show fabrics that have greigeCode
                          ?.map((fm: any) => ({
                            value: String(fm.id),
                            label: `${fm.fabricCode} - ${fm.fabricQuality}`,
                          }))}
                        placeholder="Select Greige Fabric Code"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Greige Fabric Name</label>
                      <input
                        className="input mt-1"
                        name="greigeFabricName"
                        value={newItem.greigeFabricName || ''}
                        readOnly
                        placeholder="Auto-filled from selected code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Quantity <span className="text-red-600">*</span></label>
                      <input placeholder="Quantity" name="quantity"
                        value={newItem.quantity || ''}
                        onChange={handleItemChange} className="input mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Rate/unit</label>
                      <input placeholder="Rate per unit" name="costPerPound"
                        value={newItem.costPerPound || ''}
                        onChange={handleItemChange} className="input mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Total Amount</label>
                      <input placeholder="Total Amount" name="totalAmount"
                        value={newItem.totalAmount || ''}
                        readOnly className="input mt-1 bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">GST Percent (%)</label>
                      <input placeholder="GST %" name="gstPercent"
                        value={newItem.gstPercent || ''}
                        onChange={handleItemChange} className="input mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">GST Amount</label>
                      <input placeholder="GST Amount" name="gstAmount"
                        value={newItem.gstAmount || ''}
                        readOnly className="input mt-1 bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Final Amount</label>
                      <input placeholder="Final Amount" name="finalAmount"
                        value={newItem.finalAmount || ''}
                        readOnly className="input mt-1 bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Color</label>
                      <CommonSearchableSelect
                        name="colorId"
                        value={newItem.colorId || ''}
                        onValueChange={(val) => handleItemChange({ target: { name: 'colorId', value: val } } as any)}
                        options={colours.map((color: any) => ({
                          value: String(color.id),
                          label: color.subCategoryName,
                        }))}
                        placeholder="Select Color"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Pantone</label>
                      <input placeholder="Pantone" name="pantone"
                        value={newItem.pantone || ''}
                        onChange={handleItemChange} className="input mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Finished Weight</label>
                      <input placeholder="Finished Weight" name="finishedWeight"
                        value={newItem.finishedWeight || ''}
                        onChange={handleItemChange} className="input mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Greige Width <span className="text-red-600">*</span></label>
                      <input placeholder="Greige Width" name="greigeWidth"
                        value={newItem.greigeWidth || ''}
                        onChange={handleItemChange} className="input mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Req. Finished Width <span className="text-red-600">*</span></label>
                      <input placeholder="ReqFinishedWidth" name="reqFinishedWidth"
                        value={newItem.reqFinishedWidth || ''}
                        onChange={handleItemChange} className="input mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">UOM </label>
                      <CommonSearchableSelect
                        name="uomId"
                        value={newItem.uomId || ''}
                        onValueChange={(val) => handleItemChange({ target: { name: 'uomId', value: val } } as any)}
                        options={activeUomList?.map((unit: any) => ({
                          value: String(unit.id),
                          label: unit.uomName,
                        }))}
                        placeholder="Select UOM"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Remarks</label>
                      <input placeholder="Remarks" name="remarks"
                        value={newItem.remarks || ''}
                        onChange={handleItemChange} className="input" />
                    </div>
                  </div>
                  <Button onClick={addItem} className="mt-4 ml-auto flex items-center" type="button">
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
                        <th className="border p-2">Fin. Fabric Code</th>
                        <th className="border p-2">Finished Fabric Name</th>
                        <th className="border p-2">Greige Fabric Code</th>
                        <th className="border p-2">Greige Fabric Name</th>
                        <th className="border p-2">Quantity</th>
                        <th className="border p-2">Rate/unit</th>
                        <th className="border p-2">Total Amount</th>
                        <th className="border p-2">GST %</th>
                        <th className="border p-2">GST Amount</th>
                        <th className="border p-2">Final Amount</th>
                        <th className="border p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dyeingDtl?.map((item: any, index: any) => {
                        const finishedFabric = fabricMasterList?.find((fm: any) => `${fm.id}` === `${item.finishedFabricCodeId ?? ""}`);
                        const greigeFabric = fabricMasterList?.find((fm: any) => `${fm.id}` === `${item.greigeFabricCodeId ?? ""}`);

                        return (
                          <tr key={index} className="border">
                            <td className="border p-2">{index + 1}</td>
                            <td className="border p-2">{finishedFabric?.fabricCode || item.finishedFabricCodeId}</td>
                            <td className="border p-2">{item.finishedFabricName}</td>
                            <td className="border p-2">{greigeFabric?.fabricCode || item.greigeFabricCodeId}</td>
                            <td className="border p-2">{item.greigeFabricName}</td>
                            <td className="border p-2">{item.quantity}</td>
                            <td className="border p-2">{item.costPerPound}</td>
                            <td className="border p-2">₹{item.totalAmount || (Number(item.quantity) * Number(item.costPerPound)).toFixed(2)}</td>
                            <td className="border p-2">{item.gstPercent}%</td>
                            <td className="border p-2">₹{item.gstAmount}</td>
                            <td className="border p-2">₹{item.finalAmount}</td>
                            <td className="border p-2">
                              <div className="flex justify-center gap-2">
                                <Button size="sm" onClick={() => editItem(index)} variant="outline"><Edit size={14} /></Button>
                                <Button size="sm" onClick={() => deleteItem(index)} variant="destructive"><Trash2 size={14} /></Button>
                              </div>
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
              disabled={isSubmitDisabled}
            >
              {isSubmitting ? (
                "Processing..."
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  {isEdit ? "Update" : "Save"} Process Contract
                </>
              )}
            </Button>
          </div>
            </>
            
          )}
         
        </div>
      </div>
    </div>
  );
}




