import React, { useEffect, useMemo, useRef, useState } from "react";
import { Save, Plus, ArrowLeft, Edit, Trash2, FileDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllDyeingWorkOrdersByType } from "@/state/processContractSlice";
import { createFinishFabricReceive, updateFinishFabricReceive, clearCreateResult, getAllFinishFabricReceivesByType } from "@/state/finishFabricReceiveSlice";
import { getAllYarnDispatch } from "@/state/yarn-dispatch-for-dyeing-slice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { toast } from "react-toastify";
import { generateExcelTemplate, readExcelFile } from "@/lib/utils";
import documentNumberService from "@/services/DocumentNumberService";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { useYarnWarehouseOptions } from "@/hooks/useYarnWarehouseOptions";

interface YarnReceiveItem {
  id?: number;
  finishedYarn: string;
  noOfBags: number;
  kgsPerBag: number;
  conesPerBag: number;
  conesWeight: number;
  totalKgs: number;
  lotNo: string;
  warehouseId: number;
  activeFlag: boolean;
}

interface FinishYarnReceiveFormData {
  fabricReceiveDate: string;
  processContractNo: number;
  finishedYarn: string;
  greigeYarn: string;
  orderQuantity: number;
  costPerPound: number;
  totalAmount: number;
  dcNumber: string;
  dcDate: string;
  colorId: number;
  pantone: string;
  finishingId: number;
  salesOrderId: number;
  purchaseInwardId: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  balanceQuantity: number;
  remarks: string;
  activeFlag: boolean;
  processType: string;
  lotNumber: string; // ADDED
  receiveNo?: string;
}

const YARN_TEMPLATE_HEADERS = [
  "Warehouse Name",
  "Finished Yarn",
  "No Of Bags",
  "Kgs/Bag",
  "Cones Per Bag",
  "Lot No"
];

const EXCEL_ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

export function ProcessingReceiveYarn() {
  const location = useLocation();
  const existingData = location.state?.finishYarnReceive;
  const isEditMode = !!existingData;

  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);
  const { list: yarnDispatchDyingList } = useSelector((state: RootState) => state.yarnDispatchForDyeing);
  const { loading } = useSelector((state: RootState) => state.finishFabricReceive);

  const warehouseData = useMemo(() => {
    if (Array.isArray(warehouseList)) {
      return warehouseList;
    }
    return warehouseList?.data || [];
  }, [warehouseList]);

  const { yarnWarehouseOptions, defaultYarnWarehouseId } = useYarnWarehouseOptions(warehouseList);

  const warehouseNameLookup = useMemo(() => {
    const map = new Map<string, any>();
    warehouseData.forEach((warehouse: any) => {
      const key = (warehouse?.warehouseName || warehouse?.name || '')
        .toString()
        .trim()
        .toLowerCase();
      if (key) {
        map.set(key, warehouse);
      }
    });
    return map;
  }, [warehouseData]);

  const [yarnReceiveDetails, setYarnReceiveDetails] = useState<YarnReceiveItem[]>([]);
  const [newItem, setNewItem] = useState<YarnReceiveItem>({
    finishedYarn: '',
    noOfBags: 0,
    kgsPerBag: 0,
    conesPerBag: 0,
    conesWeight: 0,
    totalKgs: 0,
    lotNo: '',
    warehouseId: 0,
    activeFlag: true
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (defaultYarnWarehouseId && !isEditMode) {
      setNewItem(prev => ({
        ...prev,
        warehouseId: prev.warehouseId || Number(defaultYarnWarehouseId)
      }));
    }
  }, [defaultYarnWarehouseId, isEditMode]);

  const [dispatchDetails, setDispatchDetails] = useState({
    finishedYarnCode: "",
    finishedYarnName: "",
    greigeYarnCode: "",
    greigeYarnName: "",
    orderQuantity: "",
    dispatchedQuantity: "",
    receivedQuantity: "",
    balanceQuantity: "",
    dcNumber: "",
    dcDate: ""
  });

  const [availableYarns, setAvailableYarns] = useState<any[]>([]);
  const [availableLotNumbers, setAvailableLotNumbers] = useState<any[]>([]); // ADDED
  const availableYarnLookup = useMemo(() => {
    const map = new Map<string, any>();
    availableYarns.forEach((yarn: any) => {
      const code = yarn?.code || '';
      const name = yarn?.name || '';
      const id = yarn?.id ? yarn.id.toString() : '';
      [code, name, id].forEach(value => {
        if (value) {
          const key = value.toString().trim().toLowerCase();
          if (key) {
            map.set(key, yarn);
          }
        }
      });
    });
    return map;
  }, [availableYarns]);

  const { finishFabricReceiveList } = useSelector((state: RootState) => state.finishFabricReceive);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<FinishYarnReceiveFormData>({
    defaultValues: {
      processType: "YARN",
      activeFlag: true,
      fabricReceiveDate: new Date().toISOString().split('T')[0],
      lotNumber: "", // ADDED
      receiveNo: "" // ADDED
    }
  });

  const processContractNo = watch("processContractNo");
  const finishedYarn = watch("finishedYarn");
  const lotNumber = watch("lotNumber");

  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);

  // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      if (existingData || hasGeneratedNumberRef.current) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Processing Receive Management',
          tabName: 'yarn',
        });
        setValue('receiveNo', result.documentNumber, { shouldValidate: true });

        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate processing receive number:', error);
        toast.error('Failed to generate processing receive number');
      }
    };

    generateDocumentNumber();
  }, [existingData, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !existingData) {
        documentNumberService.clearMemoryCache('Processing Receive Management', 'yarn');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !existingData) {
        documentNumberService.clearMemoryCache('Processing Receive Management', 'yarn');
      }
    };
  }, [existingData]);

  useEffect(() => {
    setValue('receiveNo', existingData?.receiveNo || '');
  }, [existingData, setValue]);


  useEffect(() => {
    dispatch(getAllVendors({fetchAll: true}));
    dispatch(getAllWarehouse({fetchAll: true}));
    dispatch(getAllDyeingWorkOrdersByType({ type: "YARN", offset: 0, limit: 500 }));
    dispatch(getAllYarnDispatch({ processType: "YARN" }));
  }, [dispatch]);

  // Load existing data in edit mode
  useEffect(() => {
    if (isEditMode && existingData) {
      console.log("📝 STEP 1: Loading existing data:", existingData);

      // Set processType
      setValue("processType", "YARN");

      // Set basic fields
      setValue("fabricReceiveDate", existingData.fabricReceiveDate || new Date().toISOString().split('T')[0]);
      setValue("orderQuantity", existingData.orderQuantity || 0);
      setValue("costPerPound", existingData.costPerPound || 0);
      setValue("totalAmount", existingData.totalAmount || 0);
      setValue("dcNumber", existingData.dcNumber || "");
      setValue("dcDate", existingData.dcDate || new Date().toISOString().split('T')[0]);
      setValue("colorId", existingData.colorId || 0);
      setValue("pantone", existingData.pantone || "");
      setValue("remarks", existingData.remarks || "");
      setValue("activeFlag", existingData.activeFlag !== false);
      setValue("receivedQuantity", existingData.receivedQuantity || 0);
      setValue("balanceQuantity", existingData.balanceQuantity || 0);
      setValue("lotNumber", existingData.lotNumber || ""); // ADDED
      setValue("receiveNo", existingData.receiveNo || ""); // ADDED

      // Set process contract number - THIS IS CRITICAL
      const contractId = existingData.dyeingWorkOrderId || existingData.processContractNo;
      if (contractId) {
        console.log("📝 Setting processContractNo to:", contractId);
        setValue("processContractNo", contractId);
      }
    }
  }, [isEditMode, existingData, setValue]);

  // Set greige yarn when finished yarn is selected
  useEffect(() => {
    if (finishedYarn && processContractNo) {
      const selectedContract = (processContractList || []).find((contract: any) => Number(contract.id) === Number(processContractNo));
      if (selectedContract) {
        const contractItems = selectedContract.yarnItems || selectedContract.items || selectedContract.dyeingDtl || [];
        const selectedYarnItem = contractItems.find(
          (item: any) => (item.finishedYarnCodeId || item.finishedFabricCodeId)?.toString() === finishedYarn
        );
        if (selectedYarnItem) {
          setValue("greigeYarn", selectedYarnItem.greigeYarnName || selectedYarnItem.greigeFabricName || "");
          console.log("🔄 Updated greigeYarn to:", selectedYarnItem.greigeYarnName || selectedYarnItem.greigeFabricName);
        }
      }
    }
  }, [finishedYarn, processContractNo, processContractList, setValue]);

  // useEffect(() => {
  //   if (finishedYarn && editingIndex === null) {
  //     setNewItem(prev => ({
  //       ...prev,
  //       finishedYarn: finishedYarn
  //     }));
  //   }
  // }, [finishedYarn]);

  // Load available yarns when process contract is selected
  useEffect(() => {
    if (processContractNo) {
      const selectedContract = (processContractList || []).find((contract: any) => Number(contract.id) === Number(processContractNo));

      if (selectedContract) {
        const yarnItems = selectedContract.yarnItems || selectedContract.items || selectedContract.dyeingDtl || [];

        const availableYarnsData = yarnItems.map((item: any) => ({
          id: item.finishedYarnCodeId || item.finishedFabricCodeId || item.id,
          name: item.finishedYarnName || item.finishedFabricName || `Yarn ${item.finishedYarnCodeId || item.finishedFabricCodeId || item.id}`,
          code: (item.finishedYarnCodeId || item.finishedFabricCodeId || item.id)?.toString()
        }));

        console.log("📋 Available yarns:", availableYarnsData);
        setAvailableYarns(availableYarnsData);

        // Auto-select only in new mode with single yarn
        if (!isEditMode && availableYarnsData.length === 1) {
          setValue("finishedYarn", availableYarnsData[0].code);
        }

        // AUTO-FETCH LOT NUMBERS FROM YarnDispatchForDyeing - ADDED
        const dispatchRecords = (yarnDispatchDyingList || []).filter(
          (dispatch: any) => (Number(dispatch.dyeingWorkOrderId) === Number(processContractNo) || Number(dispatch.processContractNo) === Number(processContractNo))
        );

        console.log("🔍 Found dispatch records for lot numbers:", dispatchRecords);

        // Extract unique lot numbers
        // const uniqueLotNumbers = [...new Set(dispatchRecords.map((d: any) => d.lotNumber).filter(Boolean))];
        // console.log("🔍 Unique lot numbers found:", uniqueLotNumbers);
        // setAvailableLotNumbers(
        //   uniqueLotNumbers.map((lotNum: string) => ({
        //     id: lotNum,
        //     name: lotNum,
        //     value: lotNum
        //   }))
        // );

        // // Auto-fetch if single lot number, otherwise keep blank for user selection
        // if (uniqueLotNumbers.length === 1) {
        //   setValue("lotNumber", uniqueLotNumbers[0]);
        // } else if (uniqueLotNumbers.length === 0) {
        //   setValue("lotNumber", "");
        // }
      }
    } else {
      setAvailableYarns([]);
      setAvailableLotNumbers([]); // ADDED
      if (!isEditMode) {
        setValue("finishedYarn", "");
        setValue("greigeYarn", "");
        setValue("lotNumber", ""); // ADDED
      }
    }
  }, [processContractNo, processContractList, yarnDispatchDyingList, setValue, isEditMode]); // ADDED yarnDispatchDyingList

  useEffect(() => {
    if (processContractNo && processContractList.length > 0) {
      const selectedContract = (processContractList || []).find(
        (contract: any) => Number(contract.id) === Number(processContractNo)
      );

      if (selectedContract) {
        console.log("🔍 STEP 4: Loading dispatch details for contract:", selectedContract);

        const contractItems = selectedContract.yarnItems || selectedContract.items || selectedContract.dyeingDtl || [];
        const contractItem = contractItems[0];

        if (contractItem) {
          const contractYarnCode = (contractItem.finishedYarnCodeId || contractItem.finishedFabricCodeId)?.toString();

          const totalReceivedQty = (finishFabricReceiveList || [])
            .filter((receive: any) =>
              Number(receive.dyeingWorkOrderId) === processContractNo &&
              receive.processType === "YARN"
            )
            .reduce((total: number, receive: any) => {
              // Sum up matching yarn items from each receipt
              const matchingYarnItems = (receive.yarnItems || receive.items || []).filter((yi: any) =>
                yi.finishedYarnItemId?.toString() === contractYarnCode ||
                yi.finishedYarn === contractYarnCode
              );
              return total + matchingYarnItems.reduce((sub: number, yi: any) => sub + (Number(yi.totalKgs) || 0), 0);
            }, 0);

          console.log("All receives:", finishFabricReceiveList);

          const orderQty = Number(contractItem.quantity) || 0;
          const dispatchedQty = Number(contractItem.dispatchQuantity) || 0;

          setDispatchDetails({
            finishedYarnCode: contractYarnCode || "",
            finishedYarnName: contractItem.finishedYarnName || contractItem.finishedFabricName || "",
            greigeYarnCode: (contractItem.greigeYarnCodeId || contractItem.greigeFabricCodeId)?.toString() || "",
            greigeYarnName: contractItem.greigeYarnName || contractItem.greigeFabricName || "",
            orderQuantity: orderQty.toString(),
            dispatchedQuantity: dispatchedQty.toString(),
            receivedQuantity: totalReceivedQty.toFixed(2),
            dcNumber: contractItem.dcNumber || "",
            dcDate: contractItem.dcDate || "",
            balanceQuantity: (orderQty - dispatchedQty).toFixed(2)
          });

          // Set finishedYarn and greigeYarn in the form
          const yarnCodeId = contractYarnCode;
          if (yarnCodeId) {
            setValue("finishedYarn", yarnCodeId);
            setValue("greigeYarn", contractItem.greigeYarnName || contractItem.greigeFabricName || "");
            console.log("✅ Set finishedYarn to:", yarnCodeId);
            console.log("✅ Set greigeYarn to:", contractItem.greigeYarnName || contractItem.greigeFabricName);
          }

          // Only set order details in new mode
          if (!isEditMode) {
            setValue("orderQuantity", Number(contractItem.quantity) || 0);
            setValue("costPerPound", Number(contractItem.costPerPound) || 0);
            setValue("totalAmount", Number(contractItem.totalAmount) || 0);
            setValue("dcNumber", contractItem.dcNumber || "");
            setValue("dcDate", contractItem.dcDate || "");
            setValue("colorId", Number(contractItem.colorId) || 0);
            setValue("pantone", contractItem.pantone || "");
          }
        }
      }
    }
  }, [processContractNo, processContractList, isEditMode, setValue, finishFabricReceiveList, dispatch]);

  // Update dispatch details when selected finished yarn changes
  useEffect(() => {
    if (finishedYarn && processContractNo && processContractList.length > 0) {
      const selectedContract = (processContractList || []).find(
        (contract: any) => Number(contract.id) === Number(processContractNo)
      );

      if (selectedContract) {
        const contractItems = selectedContract.yarnItems || selectedContract.items || selectedContract.dyeingDtl || [];
        const selectedYarnItem = contractItems.find(
          (item: any) => (item.finishedYarnCodeId || item.finishedFabricCodeId)?.toString() === finishedYarn
        );

        if (selectedYarnItem) {
          console.log("🔄 Updating dispatch details for selected yarn:", selectedYarnItem);

          const totalReceivedQty = (finishFabricReceiveList || [])
            .filter((receive: any) =>
              Number(receive.dyeingWorkOrderId) === processContractNo &&
              receive.processType === "YARN"
            )
            .reduce((total: number, receive: any) => {
              // Sum up matching yarn items from each receipt
              const matchingYarnItems = (receive.yarnItems || receive.items || []).filter((yi: any) =>
                yi.finishedYarnItemId?.toString() === finishedYarn ||
                yi.finishedYarn === finishedYarn
              );
              return total + matchingYarnItems.reduce((sub: number, yi: any) => sub + (Number(yi.totalKgs) || 0), 0);
            }, 0);

          const orderQty = Number(selectedYarnItem.quantity) || 0;
          const dispatchedQty = Number(selectedYarnItem.dispatchQuantity) || 0;

          setDispatchDetails({
            finishedYarnCode: (selectedYarnItem.finishedYarnCodeId || selectedYarnItem.finishedFabricCodeId)?.toString() || "",
            finishedYarnName: selectedYarnItem.finishedYarnName || selectedYarnItem.finishedFabricName || "",
            greigeYarnCode: (selectedYarnItem.greigeYarnCodeId || selectedYarnItem.greigeFabricCodeId)?.toString() || "",
            greigeYarnName: selectedYarnItem.greigeYarnName || selectedYarnItem.greigeFabricName || "",
            orderQuantity: orderQty.toString(),
            dispatchedQuantity: dispatchedQty.toString(),
            receivedQuantity: totalReceivedQty.toFixed(2),
            dcNumber: selectedYarnItem.dcNumber || "",
            dcDate: selectedYarnItem.dcDate || "",
            balanceQuantity: (orderQty - dispatchedQty).toFixed(2)
          });
        }
      }
    }
  }, [finishedYarn, processContractNo, processContractList, finishFabricReceiveList]);


  useEffect(() => {
    if (isEditMode && existingData && availableYarns.length > 0 && yarnReceiveDetails.length === 0) {
      console.log("📦 STEP 3: Loading yarn items with availableYarns:", availableYarns);
      const existingItems = existingData.yarnItems || existingData.items || [];
      console.log("📦 Existing yarn items:", existingItems);

      if (existingItems && existingItems.length > 0) {
        const mappedYarnItems = existingItems.map((item: any) => {
          // Try to find matching yarn code from availableYarns
          let finishedYarnCode = item.finishedYarn || item.finishedYarnCodeId?.toString() || item.finishedFabricCodeId?.toString() || '';

          console.log(`🔍 Mapping item:`, item);
          console.log(`🔍 Initial finishedYarnCode:`, finishedYarnCode);

          // If the stored value doesn't match availableYarns, try to find it
          const matchingYarn = availableYarns.find(y =>
            y.code === finishedYarnCode ||
            y.id?.toString() === finishedYarnCode ||
            y.name === item.finishedYarnName
          );

          if (matchingYarn) {
            finishedYarnCode = matchingYarn.code;
            console.log(`✅ Mapped yarn: ${item.finishedYarnName || 'Unknown'} -> ${finishedYarnCode}`);
          } else {
            console.warn(`⚠️ No matching yarn found for:`, item);
            // Use the first available yarn as fallback
            // if (availableYarns.length > 0) {
            //   finishedYarnCode = availableYarns[0].code;
            //   console.log(`🔄 Using fallback yarn: ${finishedYarnCode}`);
            // }
          }

          const conesPerBag = Number(item.conesPerBag) || 0;
          const kgsPerBag = Number(item.kgsPerBag) || 0;
          const conesWeight = item.conesWeight != null
            ? Number(item.conesWeight)
            : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);

          return {
            id: item.id,
            finishedYarn: finishedYarnCode,
            noOfBags: item.noOfBags || 0,
            kgsPerBag,
            conesPerBag,
            conesWeight,
            totalKgs: item.totalKgs || 0,
            lotNo: item.lotNo || '',
            warehouseId: item.warehouseId || 0,
            activeFlag: item.activeFlag !== false
          };
        });

        console.log("📦 Final mapped yarn items:", mappedYarnItems);
        setYarnReceiveDetails(mappedYarnItems);
      }
    }
  }, [isEditMode, existingData, availableYarns, yarnReceiveDetails.length]);


  // Auto-calculate total amount
  const orderQuantity = watch("orderQuantity");
  const costPerPound = watch("costPerPound");

  useEffect(() => {
    if (orderQuantity && costPerPound) {
      const total = Number(orderQuantity) * Number(costPerPound);
      setValue("totalAmount", Number(total.toFixed(2)));
    }

  }, [orderQuantity, costPerPound, setValue]);

  // Auto-calculate total kgs for new item
  useEffect(() => {
    if (newItem.noOfBags && newItem.kgsPerBag) {
      const totalKgs = Number(newItem.noOfBags) * Number(newItem.kgsPerBag);
      const rounded = Number(totalKgs.toFixed(2));
      if (rounded !== newItem.totalKgs) {
        setNewItem(prev => ({ ...prev, totalKgs: rounded }));
      }
    }
  }, [newItem.noOfBags, newItem.kgsPerBag, newItem.totalKgs]);


  const addYarnReceiveDetail = () => {
    if (!newItem.finishedYarn || !newItem.totalKgs) {
      alert("Please fill in Finished Yarn and Total Kgs");
      return;
    }

    const detailToSave: YarnReceiveItem = {
      ...newItem,
      conesWeight: newItem.conesPerBag > 0 && newItem.kgsPerBag > 0
        ? Number((newItem.kgsPerBag / newItem.conesPerBag).toFixed(3))
        : 0
    };

    if (editingIndex !== null) {
      const updatedDetails = [...yarnReceiveDetails];
      updatedDetails[editingIndex] = detailToSave;
      setYarnReceiveDetails(updatedDetails);
      setEditingIndex(null);
    } else {
      setYarnReceiveDetails([...yarnReceiveDetails, detailToSave]);
    }

    setNewItem({
      finishedYarn: '',
      noOfBags: 0,
      kgsPerBag: 0,
      conesPerBag: 0,
      conesWeight: 0,
      totalKgs: 0,
      lotNo: '',
      warehouseId: 0,
      activeFlag: true
    });
  };

  useEffect(() => {
    if (finishedYarn && editingIndex === null && !isEditMode) {
      setNewItem(prev => ({
        ...prev,
        finishedYarn: finishedYarn,
        lotNo: lotNumber || prev.lotNo
      }));
    }
  }, [finishedYarn, lotNumber, isEditMode, editingIndex]);

  useEffect(() => {
    if (lotNumber && editingIndex === null && !isEditMode) {
      setNewItem(prev => ({
        ...prev,
        lotNo: lotNumber
      }));
    }
  }, [lotNumber, isEditMode, editingIndex]);

  // Auto-calculate received and balance quantities
  useEffect(() => {
    const totalReceived = yarnReceiveDetails.reduce((sum, item) =>
      sum + (Number(item.totalKgs) || 0), 0
    );
    setValue("receivedQuantity", totalReceived);

    const balance = (Number(orderQuantity) || 0) - totalReceived;
    setValue("balanceQuantity", balance);

    setDispatchDetails(prev => ({
      ...prev,
      receivedQuantity: totalReceived.toFixed(2),
      balanceQuantity: balance.toFixed(2)
    }));
  }, [yarnReceiveDetails, orderQuantity, setValue]);

  const loadDispatchDetails = (selectedContract: any) => {
    const contractItems = selectedContract.yarnItems || selectedContract.items || selectedContract.dyeingDtl || [];
    const contractItem = contractItems[0];

    if (contractItem) {
      const finishedYarnCode = (contractItem.finishedYarnCodeId || contractItem.finishedFabricCodeId)?.toString() || "";
      const finishedYarnName = contractItem.finishedYarnName || contractItem.finishedFabricName || "";
      const greigeYarnCode = (contractItem.greigeYarnCodeId || contractItem.greigeFabricCodeId)?.toString() || "";
      const greigeYarnName = contractItem.greigeYarnName || contractItem.greigeFabricName || "";

      setDispatchDetails({
        finishedYarnCode: finishedYarnCode,
        finishedYarnName: finishedYarnName,
        greigeYarnCode: greigeYarnCode,
        greigeYarnName: greigeYarnName,
        orderQuantity: contractItem.quantity?.toString() || "",
        dispatchedQuantity: (contractItem.dispatchQuantity || 0).toString(),
        receivedQuantity: "0",
        dcNumber: contractItem.dcNumber || "",
        dcDate: contractItem.dcDate || "",
        balanceQuantity: contractItem.quantity?.toString() || ""
      });

      setValue("orderQuantity", Number(contractItem.quantity) || 0);
      setValue("costPerPound", Number(contractItem.costPerPound) || 0);
      setValue("totalAmount", Number(contractItem.totalAmount) || 0);
      setValue("dcNumber", contractItem.dcNumber || "");
      setValue("dcDate", contractItem.dcDate || "");
      setValue("colorId", Number(contractItem.colorId) || 0);
      setValue("pantone", contractItem.pantone || "");
      setValue("finishedYarn", finishedYarnCode);
      setValue("greigeYarn", greigeYarnName);

      // AUTO-FETCH LOT NUMBERS FROM YarnDispatchForDyeing - ADDED
      const dispatchRecords = (yarnDispatchDyingList || []).filter(
        (dispatch: any) => Number(dispatch.dyeingWorkOrderId) === Number(selectedContract.id) || Number(dispatch.processContractNo) === Number(selectedContract.id)
      );

      console.log("🔍 loadDispatchDetails - Found dispatch records:", dispatchRecords);

      // Extract unique lot numbers
      const uniqueLotNumbers = [...new Set(dispatchRecords.map((d: any) => d.lotNumber).filter(Boolean))];
      console.log("🔍 loadDispatchDetails - Unique lot numbers:", uniqueLotNumbers);
      setAvailableLotNumbers(
        uniqueLotNumbers.map((lotNum: string) => ({
          id: lotNum,
          name: lotNum,
          value: lotNum
        }))
      );

      // Auto-fetch if single lot number, otherwise keep blank for user selection
      if (uniqueLotNumbers.length === 1) {
        setValue("lotNumber", uniqueLotNumbers[0]);
      } else if (uniqueLotNumbers.length === 0) {
        setValue("lotNumber", "");
      }
    }
  };

  const normalizeCellValue = (value: any) => {
    if (value === null || value === undefined) return '';
    return value.toString().trim();
  };

  const parseNumericCell = (value: any) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = parseFloat(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const normalizeRowKeys = (row: Record<string, any>) => {
    return Object.entries(row || {}).reduce<Record<string, any>>((acc, [key, value]) => {
      acc[key?.toString().trim().toLowerCase()] = value;
      return acc;
    }, {});
  };

  const importYarnDetailsFromRows = (rows: Record<string, any>[]) => {
    const validationErrors: string[] = [];
    const parsedEntries: YarnReceiveItem[] = [];

    rows.forEach((row, index) => {
      const normalized = normalizeRowKeys(row || {});
      const values = Object.values(normalized);
      if (!values.some(value => value !== undefined && value !== null && value !== '')) {
        return;
      }

      const warehouseName = normalizeCellValue(normalized['warehouse name'] ?? normalized['warehouse']);
      if (!warehouseName) {
        validationErrors.push(`Row ${index + 2}: Warehouse Name is required`);
        return;
      }
      const warehouseRecord = warehouseNameLookup.get(warehouseName.toLowerCase());
      if (!warehouseRecord) {
        validationErrors.push(`Row ${index + 2}: Warehouse "${warehouseName}" not found`);
        return;
      }

      const finishedYarnValue = normalizeCellValue(
        normalized['finished yarn'] ??
        normalized['finished yarn name'] ??
        normalized['finished yarn code']
      );
      if (!finishedYarnValue) {
        validationErrors.push(`Row ${index + 2}: Finished Yarn is required`);
        return;
      }
      const yarnRecord = availableYarnLookup.get(finishedYarnValue.toLowerCase());
      if (!yarnRecord) {
        validationErrors.push(`Row ${index + 2}: Finished Yarn "${finishedYarnValue}" not available for the selected contract`);
        return;
      }

      const bagsValue = parseNumericCell(normalized['no of bags'] ?? normalized['bags']);
      if (!bagsValue || bagsValue <= 0) {
        validationErrors.push(`Row ${index + 2}: No Of Bags must be greater than zero`);
        return;
      }

      const kgsPerBagValue = parseNumericCell(normalized['kgs/bag'] ?? normalized['kgs per bag']);
      if (!kgsPerBagValue || kgsPerBagValue <= 0) {
        validationErrors.push(`Row ${index + 2}: Kgs/Bag must be greater than zero`);
        return;
      }

      const conesPerBagValue = parseNumericCell(normalized['cones per bag'] ?? normalized['cones/bag']);
      if (conesPerBagValue !== null && conesPerBagValue < 0) {
        validationErrors.push(`Row ${index + 2}: Cones Per Bag cannot be negative`);
        return;
      }

      const lotNo = normalizeCellValue(normalized['lot no'] ?? normalized['lot number']) || '';

      const totalKgs = Number((Number(bagsValue) * Number(kgsPerBagValue)).toFixed(3));
      const conesWeight = conesPerBagValue && conesPerBagValue > 0
        ? Number((Number(kgsPerBagValue) / Number(conesPerBagValue)).toFixed(3))
        : 0;

      parsedEntries.push({
        id: Date.now() + index + parsedEntries.length,
        finishedYarn: yarnRecord.code || yarnRecord.name || finishedYarnValue,
        noOfBags: Number(bagsValue),
        kgsPerBag: Number(kgsPerBagValue),
        conesPerBag: conesPerBagValue ? Number(conesPerBagValue) : 0,
        conesWeight,
        totalKgs,
        lotNo,
        warehouseId: Number(warehouseRecord.id),
        activeFlag: true
      });
    });

    if (validationErrors.length) {
      toast.error(validationErrors.join('\n'));
      return;
    }

    if (!parsedEntries.length) {
      toast.error('No valid rows found in the uploaded file');
      return;
    }

    const orderQtyNumber = Number(orderQuantity) || 0;
    if (orderQtyNumber > 0) {
      const combinedTotal = [...yarnReceiveDetails, ...parsedEntries].reduce((sum, entry) => sum + (Number(entry.totalKgs) || 0), 0);
      if (combinedTotal > orderQtyNumber + 0.0001) {
        toast.error('Imported kgs exceed the order quantity');
        return;
      }
    }

    setYarnReceiveDetails(prev => [...prev, ...parsedEntries]);
    toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'entry' : 'entries'}`);
  };

  const handleDownloadTemplate = () => {
    if (!canUseTemplateActions) {
      toast.error('Select a process contract to download the template');
      return;
    }
    generateExcelTemplate({
      headers: YARN_TEMPLATE_HEADERS,
      fileName: 'processing-yarn-template'
    });
  };

  const handleUploadButtonClick = () => {
    if (!canUseTemplateActions) {
      toast.error('Select a process contract and ensure warehouses are loaded before importing');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!EXCEL_ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error('Only Excel files (.xls, .xlsx) are supported');
      event.target.value = '';
      return;
    }
    try {
      setIsImporting(true);
      const rows = await readExcelFile<Record<string, any>>(file);
      if (!Array.isArray(rows) || rows.length === 0) {
        toast.error('No data found in the uploaded file');
        return;
      }
      importYarnDetailsFromRows(rows);
    } catch (error) {
      toast.error('Failed to process the uploaded file');
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => {
      const numericFields = ['noOfBags', 'kgsPerBag', 'totalKgs', 'warehouseId', 'conesPerBag'];
      const nextValue = numericFields.includes(name) ? Number(value) : value;
      const updated = { ...prev, [name]: nextValue } as YarnReceiveItem;

      if (name === 'kgsPerBag' || name === 'conesPerBag') {
        const cones = Number(updated.conesPerBag) || 0;
        const kpb = Number(updated.kgsPerBag) || 0;
        updated.conesWeight = cones > 0 && kpb > 0 ? Number((kpb / cones).toFixed(3)) : 0;
      }

      return updated;
    });
  };


  const editYarnReceiveDetail = (index: number) => {
    const detail = yarnReceiveDetails[index];
    const recomputedWeight = detail.conesPerBag > 0 && detail.kgsPerBag > 0
      ? Number((detail.kgsPerBag / detail.conesPerBag).toFixed(3))
      : detail.conesWeight || 0;
    setNewItem({ ...detail, conesWeight: recomputedWeight });
    setEditingIndex(index);
  };

  const deleteYarnReceiveDetail = (index: number) => {
    setYarnReceiveDetails(yarnReceiveDetails.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FinishYarnReceiveFormData) => {
    if (yarnReceiveDetails.length === 0) {
      alert("Please add at least one yarn item");
      return;
    }

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) {
      alert("Company not selected. Please select a company.");
      return;
    }

    const companyId = parseInt(storedCompanyId, 10);

    const isEditMode = Boolean(existingData?.id);
    let receiveNo = data.receiveNo || existingData?.receiveNo || "";
    if (!existingData?.id && !receiveNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Processing Receive Management",
          tabName: "yarn",
        });
        receiveNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;

    const payload = {
      ...data,
      processType: "YARN",
      items: null,
      yarnItems: yarnReceiveDetails,
      receivedQuantity: yarnReceiveDetails.reduce((sum, item) => sum + (item.totalKgs || 0), 0),
      balanceQuantity: (data.orderQuantity || 0) - yarnReceiveDetails.reduce((sum, item) => sum + (item.totalKgs || 0), 0),
      receiveNo: receiveNo,
      dyeingWorkOrderId: data.processContractNo,
      lotNumber: data.lotNumber || "", // ADDED
      companyId
    };

    // Log for debugging
    console.log("Submitting payload with processType:", payload);

    try {
      // alert(JSON.stringify(payload));
      if (isEditMode && existingData?.id) {
        const updatePayload = { ...payload, id: existingData.id, processType: "YARN", companyId };
        await dispatch(updateFinishFabricReceive(updatePayload)).unwrap();
        dispatch(getAllFinishFabricReceivesByType({ processType: "YARN", companyId }));
      } else {
        await dispatch(createFinishFabricReceive(payload)).unwrap();
        dispatch(getAllFinishFabricReceivesByType({ processType: "YARN", companyId }));
        documentNumberService.clearMemoryCache("Processing Receive Management", "yarn");
      }

      reset();
      setYarnReceiveDetails([]);
      dispatch(clearCreateResult());
      navigate("/transaction/processing-receive-management", { state: { activeTab: "yarn" } });
    } catch (error) {
      console.error("Error saving yarn receive:", error);
    }
  };

  const canUseTemplateActions = useMemo(() => {
    return availableYarns.length > 0 && warehouseData.length > 0 && Boolean(processContractNo);
  }, [availableYarns.length, warehouseData.length, processContractNo]);

  const summary = useMemo(() => {
    const totalBags = yarnReceiveDetails.reduce((sum, item) => sum + (Number(item.noOfBags) || 0), 0);
    const totalKgs = yarnReceiveDetails.reduce((sum, item) => sum + (Number(item.totalKgs) || 0), 0);
    const averageKgsPerBag = yarnReceiveDetails.length > 0 && totalBags > 0
      ? totalKgs / totalBags
      : 0;

    return {
      totalBags,
      totalKgs,
      averageKgsPerBag
    };
  }, [yarnReceiveDetails]);

  return (
    <div className="p-14 bg-white shadow-md rounded-lg">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xls,.xlsx"
        onChange={handleFileUpload}
      />
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/transaction/processing-receive-management", { state: { activeTab: "yarn" } })}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">
            {isEditMode ? "Edit" : "New"} Finished Yarn Receive
          </h2>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-primary hover:bg-primary text-white px-6 flex items-center"
        >
          <Save size={18} className="mr-2" />
          {loading ? "Saving..." : isEditMode ? "Update" : "Save"} Yarn Receive
        </Button>
      </div>

      {/* General Details */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>General Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium">Receive Number</label>
              <input
                {...register("receiveNo")}
                type="text"
                className="input mt-1 bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Yarn Receive Date <span className="text-red-600">*</span></label>
              <input
                type="date"
                {...register("fabricReceiveDate", { required: "Receive date is required" })}
                className={`input mt-1 ${errors.fabricReceiveDate ? 'border-red-500' : ''}`}
              />
              {errors.fabricReceiveDate && (
                <p className="mt-1 text-sm text-red-600">{errors.fabricReceiveDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Process Contract No <span className="text-red-600">*</span></label>
              <CommonSearchableSelect
                placeholder="Select Process Contract"
                value={watch("processContractNo") ? String(watch("processContractNo")) : ""}
                options={processContractList?.filter((contract: any) => contract.processType === "YARN").map((contract: any) => ({
                  value: String(contract.id),
                  label: contract.dyeingWorkOrderNo,
                  activeFlag: contract.activeFlag ?? true
                })) || []}
                error={errors.processContractNo?.message}
                {...register("processContractNo", {
                  required: "Process contract is required",
                  valueAsNumber: true
                })}
                onValueChange={(value) => {
                  const id = parseInt(value);
                  setValue("processContractNo", id, { shouldValidate: true });
                  if (id) {
                    const selectedContract = (processContractList || []).find((contract: any) => Number(contract.id) === id);
                    if (selectedContract) {
                      loadDispatchDetails(selectedContract);
                    }
                  } else {
                    // Reset if cleared
                    setAvailableYarns([]);
                    setAvailableLotNumbers([]);
                    setValue("finishedYarn", "");
                    setValue("greigeYarn", "");
                    setValue("lotNumber", "");
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Finished Yarn <span className="text-red-600">*</span></label>
              <CommonSearchableSelect
                placeholder="Select Finished Yarn"
                value={watch("finishedYarn") || ""}
                disabled={!processContractNo}
                options={availableYarns.map((yarn: any) => ({
                  value: yarn.code,
                  label: yarn.name,
                  activeFlag: true
                }))}
                error={errors.finishedYarn?.message}
                {...register("finishedYarn", { required: "Finished yarn is required" })}
                onValueChange={(value) => {
                  setValue("finishedYarn", value, { shouldValidate: true });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Greige Yarn <span className="text-red-600">*</span></label>
              <input
                {...register("greigeYarn", { required: "Greige yarn is required" })}
                className={`input mt-1 bg-gray-50 ${errors.greigeYarn ? 'border-red-500' : ''}`}
                placeholder="Auto-filled from process contract"
                readOnly
              />
              {errors.greigeYarn && (
                <p className="mt-1 text-sm text-red-600">{errors.greigeYarn.message}</p>
              )}
            </div>

            {/* LOT NUMBER FIELD - ADDED */}
            <div>
              <label className="block text-sm font-medium">Lot Number</label>
              {availableLotNumbers.length > 1 ? (
                <CommonSearchableSelect
                  placeholder="Select Lot Number"
                  value={watch("lotNumber") || ""}
                  options={availableLotNumbers.map((lot: any) => ({
                    value: lot.value,
                    label: lot.name,
                    activeFlag: true
                  }))}
                  {...register("lotNumber")}
                  onValueChange={(value) => {
                    setValue("lotNumber", value, { shouldValidate: true });
                  }}
                />
              ) : (
                <input
                  {...register("lotNumber")}
                  className="input mt-1 bg-gray-50"
                  placeholder="Auto-filled from process contract"
                  readOnly={availableLotNumbers.length <= 1}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Order Quantity<span className="text-red-600">*</span></label>
              <input
                type="number"
                {...register("orderQuantity", {
                  required: "Quantity is required",
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Must be greater than 0" }
                })}
                className={`input mt-1 bg-gray-50 ${errors.orderQuantity ? 'border-red-500' : ''}`}
                placeholder="Order quantity in kgs"
                step="0.01"
                readOnly
              />
              {errors.orderQuantity && (
                <p className="mt-1 text-sm text-red-600">{errors.orderQuantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Cost Per Pound</label>
              <input
                type="number"
                {...register("costPerPound", { valueAsNumber: true })}
                className="input mt-1 bg-gray-50"
                placeholder="Cost per pound"
                step="0.01"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Total Amount</label>
              <input
                type="number"
                {...register("totalAmount", { valueAsNumber: true })}
                className="input mt-1 bg-gray-50"
                placeholder="Total amount"
                step="0.01"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium">DC Number</label>
              <input
                {...register("dcNumber")}
                type="text"
                placeholder="Enter DC Number"
                className="input mt-1"
              />
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

            <div>
              <label className="block text-sm font-medium">Remarks</label>
              <textarea
                {...register("remarks")}
                className="input mt-1 w-full"
                rows={3}
                placeholder="Additional remarks"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispatch Details */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Dispatch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium">Finished Yarn Name</label>
              <input value={dispatchDetails.finishedYarnName} className="input mt-1 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Greige Yarn Name</label>
              <input value={dispatchDetails.greigeYarnName} className="input mt-1 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Order Quantity</label>
              <input value={dispatchDetails.orderQuantity} className="input mt-1 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Dispatched Quantity</label>
              <input value={dispatchDetails.dispatchedQuantity} className="input mt-1 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Received Quantity</label>
              <input value={dispatchDetails.receivedQuantity} className="input mt-1 bg-gray-50" readOnly />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Inward Details - ALREADY PERFECT WITH AUTO-FETCH & EDITABLE */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inward Details</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={!canUseTemplateActions}
                className="flex items-center"
              >
                <FileDown size={16} className="mr-2" />
                Download Template
              </Button>
              <Button
                variant="outline"
                onClick={handleUploadButtonClick}
                disabled={!canUseTemplateActions || isImporting}
                className="flex items-center"
              >
                <Upload size={16} className="mr-2" />
                {isImporting ? 'Importing...' : 'Upload Excel'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium">Finished Yarn <span className="text-red-600">*</span></label>
              <CommonSearchableSelect
                placeholder="Select Finished Yarn"
                value={newItem.finishedYarn}
                disabled={!availableYarns.length}
                options={availableYarns.map((yarn: any) => ({
                  value: yarn.code,
                  label: yarn.name,
                  activeFlag: true
                }))}
                onValueChange={(value) => {
                  setNewItem(prev => ({
                    ...prev,
                    finishedYarn: value
                  }));
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                {availableYarns.length === 0 ? 'Select a process contract first' : 'Editable - select from available yarns'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">No. of Bags</label>
              <input
                type="number"
                name="noOfBags"
                value={newItem.noOfBags || ''}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Number of bags"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Kgs per Bag</label>
              <input
                type="number"
                name="kgsPerBag"
                value={newItem.kgsPerBag || ''}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Kgs per bag"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Cones per Bag</label>
              <input
                type="number"
                name="conesPerBag"
                value={newItem.conesPerBag || ''}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Cones per bag"
                min="0"
                step="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Cones Weight (Auto)</label>
              <input
                type="number"
                name="conesWeight"
                value={newItem.conesWeight || ''}
                readOnly
                className="input mt-1 bg-gray-100"
                placeholder="Auto-calculated"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Total Kgs <span className="text-red-600">*</span></label>
              <input
                type="number"
                name="totalKgs"
                value={newItem.totalKgs || ''}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Total kgs"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Lot No</label>
              <input
                name="lotNo"
                value={newItem.lotNo}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Lot number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Warehouse</label>
              <CommonSearchableSelect
                placeholder="Select Warehouse"
                value={newItem.warehouseId ? String(newItem.warehouseId) : "0"}
                options={yarnWarehouseOptions}
filterActive        
        onValueChange={(value) => {
                  setNewItem(prev => ({
                    ...prev,
                    warehouseId: Number(value)
                  }));
                }}
              />
            </div>

          </div>
            <div className="flex items-end justify-end pt-5">
              <Button onClick={addYarnReceiveDetail}>
                <Plus size={18} className="mr-2" />
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </Button>
            </div>
        </CardContent>

      </Card>

      {/* Yarn Receive Details Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Yarn Receive Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-center">#</th>
                  <th className="border p-2 text-center">Finished Yarn</th>
                  <th className="border p-2 text-center">No. of Bags</th>
                  <th className="border p-2 text-center">Kgs per Bag</th>
                  <th className="border p-2 text-center">Cones/Bag</th>
                  <th className="border p-2 text-center">Cones Weight</th>
                  <th className="border p-2 text-center">Total Kgs</th>
                  <th className="border p-2 text-center">Lot No</th>
                  <th className="border p-2 text-center">Warehouse</th>
                  <th className="border p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {yarnReceiveDetails.length > 0 ? (
                  yarnReceiveDetails.map((detail, index) => {
                    const yarnInfo = availableYarns.find(yarn => yarn.code === detail.finishedYarn);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">{index + 1}</td>
                        <td className="border p-2">
                          {yarnInfo ? `${yarnInfo.name}` : detail.finishedYarn}
                        </td>
                        <td className="border p-2 text-center">{detail.noOfBags || '-'}</td>
                        <td className="border p-2 text-center">
                          {detail.kgsPerBag ? detail.kgsPerBag.toFixed(2) : '-'}
                        </td>
                        <td className="border p-2 text-center">
                          {detail.conesPerBag ? detail.conesPerBag : '-'}
                        </td>
                        <td className="border p-2 text-center">
                          {detail.conesWeight ? detail.conesWeight.toFixed(3) : '-'}
                        </td>
                        <td className="border p-2 text-center">
                          {detail.totalKgs ? detail.totalKgs.toFixed(2) : '-'}
                        </td>
                        <td className="border p-2 text-center">{detail.lotNo || '-'}</td>
                        <td className="border p-2 text-center">
                          {detail.warehouseId ?
                            warehouseList?.find((wh: any) => wh.id === detail.warehouseId)?.warehouseName || '-'
                            : '-'
                          }
                        </td>
                        <td className="border p-2">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editYarnReceiveDetail(index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteYarnReceiveDetail(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="border p-4 text-center text-gray-500">
                      No yarn receive details added yet. Please add items above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      {yarnReceiveDetails.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Bags</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalBags}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Kgs</p>
                <p className="text-2xl font-bold text-green-600">{summary.totalKgs.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Kgs per Bag</p>
                <p className="text-2xl font-bold text-purple-600">
                  {isFinite(summary.averageKgsPerBag) ? summary.averageKgsPerBag.toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}