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
import { getAllDyeingWorkOrders } from "@/state/processContractSlice";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getSubCategoryByCategory } from "@/state/subCategorySlice";
import { getAllGrandMaster } from "@/state/gradeMasterSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { createFinishFabricReceive, updateFinishFabricReceive, clearCreateResult } from "@/state/finishFabricReceiveSlice";
import { getAllFabricDispatch } from "@/state/processIssueSlice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { toast } from "react-toastify";
import { generateExcelTemplate, readExcelFile } from "@/lib/utils";
import documentNumberService from "@/services/DocumentNumberService";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface FabricReceiveItem {
  id?: number;
  finishedFabricCodeQuality: string;
  pieceRollNo: string;
  meter: number;
  yards: number;
  netWeight: number;
  averageWeight: number;
  gradeId: number;
  warehouseId: number;
  activeFlag: boolean;
  fabricMasterId?: number;
}

interface FinishFabricReceiveFormData {
  fabricReceiveDate: string;
  dyeingWorkOrderId: number;
  dyeingWorkOrderNo: string;
  inwardType: string;
  orderQuantity: number;
  costPerPound: number;
  dcNumber: string;
  dcDate: string;
  totalAmount: number;
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

const FABRIC_TEMPLATE_HEADERS = [
  "Warehouse Name",
  "Sort No - Construction",
  "Piece/Roll No",
  "Meter",
  "Net Weight",
  // "Average Weight",
  "Grade Name"
];

const EXCEL_ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

export function ProcessingReceiveFabric() {
  const location = useLocation();
  const existingData = location.state?.finishFabricReceive;
  const isEditMode = !!existingData;

  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { gradeList } = useSelector((state: RootState) => state.grade);
  const { subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
  const { fabricDispatchDyingList } = useSelector((state: RootState) => state.fabricDispatchDyeing as any);
  const { loading } = useSelector((state: RootState) => state.finishFabricReceive);
  const fabricMasterArray = useMemo(() => {
    if (Array.isArray(fabricMasterList)) {
      return fabricMasterList;
    }
    if (fabricMasterList?.data && Array.isArray(fabricMasterList.data)) {
      return fabricMasterList.data;
    }
    return [];
  }, [fabricMasterList]);

  const warehouseData = useMemo(() => {
    if (Array.isArray(warehouseList)) {
      return warehouseList;
    }
    return warehouseList?.data || [];
  }, [warehouseList]);

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

  const warehouseByIdLookup = useMemo(() => {
    const map = new Map<number, string>();
    warehouseData.forEach((warehouse: any) => {
      const id = Number(warehouse?.id);
      if (id) {
        map.set(id, warehouse?.warehouseName || warehouse?.name || '');
      }
    });
    return map;
  }, [warehouseData]);

  const gradeNameLookup = useMemo(() => {
    const map = new Map<string, any>();
    (gradeList || []).forEach((grade: any) => {
      const key = (grade?.gradeName || grade?.name || '')
        .toString()
        .trim()
        .toLowerCase();
      if (key) {
        map.set(key, grade);
      }
    });
    return map;
  }, [gradeList]);

  const gradeByIdLookup = useMemo(() => {
    const map = new Map<number, string>();
    (gradeList || []).forEach((grade: any) => {
      const id = Number(grade?.id);
      if (id) {
        map.set(id, grade?.gradeName || grade?.name || '');
      }
    });
    return map;
  }, [gradeList]);

  const [fabricReceiveDetails, setFabricReceiveDetails] = useState<FabricReceiveItem[]>([]);
  const [newItem, setNewItem] = useState<FabricReceiveItem>({
    finishedFabricCodeQuality: '',
    pieceRollNo: '',
    meter: 0,
    yards: 0,
    netWeight: 0,
    averageWeight: 0,
    gradeId: 0,
    warehouseId: 0,
    activeFlag: true,
    fabricMasterId: 0
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(existingData?.vendorId ?? null);

  const [dispatchDetails, setDispatchDetails] = useState({
    finishedFabricCode: "",
    finishedFabricCodeId: undefined,
    finishedFabricName: "",
    greigeFabricCode: "",
    greigeFabricCodeId: undefined,
    greigeFabricName: "",
    orderQuantity: "",
    dispatchedQuantity: "",
    receivedQuantity: "",
    balanceQuantity: ""
  });

  const [pieceRollCounter, setPieceRollCounter] = useState({ piece: 1, roll: 1 });
  const [availableFabrics, setAvailableFabrics] = useState<any[]>([]);
  const resolveFabricMasterIdFromQuality = (quality: string) => {
    if (!quality) {
      return undefined;
    }
    const code = quality.split(" - ")[0]?.trim();
    if (!code) {
      return undefined;
    }

    const matchedAvailable = availableFabrics.find((fabric) =>
      (fabric?.code || '').toString().toLowerCase() === code.toLowerCase()
    );
    if (matchedAvailable?.id) {
      return Number(matchedAvailable.id);
    }

    const matchedMaster = fabricMasterArray.find((fabric: any) =>
      ((fabric?.fabricCode || fabric?.code || '').toString().toLowerCase() === code.toLowerCase())
    );
    if (matchedMaster?.id) {
      return Number(matchedMaster.id);
    }

    return undefined;
  };

  const parseFabricCodeAndQuality = (value: string) => {
    if (!value) {
      return { fabricCode: "", fabricQuality: "" };
    }
    const parts = value.split(" - ");
    const fabricCode = parts[0]?.trim() || "";
    const fabricQuality = parts.slice(1).join(" - ").trim();
    return { fabricCode, fabricQuality };
  };

  const buildPieceEntryFromDetail = (
    item: FabricReceiveItem,
    resolvedFabricMasterId: number | undefined,
    fabricCode: string,
    fabricQuality: string
  ) => {
    const meterValue = Number(item.meter || 0);
    return {
      id: item.id,
      pieceNumber: item.pieceRollNo,
      meter: meterValue,
      meters: meterValue,
      netWeight: Number(item.netWeight || 0),
      avgWeight: Number(item.averageWeight || 0),
      gradeId: item.gradeId,
      warehouseId: item.warehouseId,
      fabricMasterId: resolvedFabricMasterId,
      fabricId: resolvedFabricMasterId,
      fabricCode,
      fabricDetails: item.finishedFabricCodeQuality,
      quality: fabricQuality || item.finishedFabricCodeQuality,
      activeFlag: true,
      fabricTypeId: 2,
      isFactoryFabric: 0
    };
  };

  const [availableLotNumbers, setAvailableLotNumbers] = useState<any[]>([]); // ADDED
  const availableFabricLookup = useMemo(() => {
    const map = new Map<string, any>();
    availableFabrics.forEach((fabric: any) => {
      const fullDisplay = fabric?.fullDisplay || '';
      const code = fabric?.code || '';
      const name = fabric?.name || '';
      [fullDisplay, code, name].forEach(value => {
        if (value) {
          const key = value.toString().trim().toLowerCase();
          if (key) {
            map.set(key, fabric);
          }
        }
      });
    });
    return map;
  }, [availableFabrics]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<FinishFabricReceiveFormData>({
    defaultValues: {
      processType: "FABRIC",
      activeFlag: true,
      fabricReceiveDate: new Date().toISOString().split('T')[0],
      inwardType: "ROLL",
      dyeingWorkOrderNo: "",
      lotNumber: "" // ADDED
    }
  }); 
  
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
            tabName: 'fabric',
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
          documentNumberService.clearMemoryCache('Processing Receive Management', 'fabric');
        }
      };
  
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (hasGeneratedNumberRef.current && !isSavingRef.current && !existingData) {
          documentNumberService.clearMemoryCache('Processing Receive Management', 'fabric');
        }
      };
    }, [existingData]);
  
    useEffect(() => {
      setValue('receiveNo', existingData?.receiveNo || '');
    }, [existingData, setValue]);

  const inwardType = watch("inwardType");
  const dyeingWorkOrderId = watch("dyeingWorkOrderId");


  useEffect(() => {
    dispatch(getAllVendors({fetchAll: true}));
    dispatch(getAllWarehouse({fetchAll: true}));
    dispatch(getAllDyeingWorkOrders({fetchAll: true}));
    dispatch(getAllSalesOrders({fetchAll: true}));
    dispatch(getAllGrandMaster({fetchAll: true}));
    dispatch(getSubCategoryByCategory("Colour"));
    dispatch(getAllFabricMasters({fetchAll: true}));
    dispatch(getAllFabricDispatch({fetchAll: true}));
  }, [dispatch]);

  // Load existing data in edit mode
  useEffect(() => {
    if (isEditMode && existingData) {
      Object.keys(existingData).forEach((key) => {
        if (key !== 'items' && key !== 'yarnItems' && key !== 'fabricItems') {
          setValue(key as any, existingData[key]);
        }
      });

      if (existingData.items && existingData.items.length > 0) {
        const mappedItems = existingData.items.map((item: any) => ({
          ...item,
          fabricMasterId: item.fabricMasterId ?? item.finishedFabricCodeId ?? resolveFabricMasterIdFromQuality(item.finishedFabricCodeQuality)
        }));
        setFabricReceiveDetails(mappedItems);
      }

      setSelectedVendorId(existingData.vendorId ?? null);
      setValue("dyeingWorkOrderNo", existingData.dyeingWorkOrderNo || "");

      // Load lot number if exists - ADDED
      setValue("lotNumber", existingData.lotNumber || "");
      setValue("receiveNo", existingData.receiveNo || "");

      if (existingData.dyeingWorkOrderId) {
        const selectedContract = processContractList.find(
          (contract: any) => contract.id === existingData.dyeingWorkOrderId
        );
        if (selectedContract) {
          loadDispatchDetails(selectedContract, { preserveDcFields: true });
        }
      }
    }
  }, [isEditMode, existingData, processContractList, setValue]); // ADDED setValue

  // Load available fabrics when process contract is selected
  useEffect(() => {
    if (dyeingWorkOrderId) {
      const selectedContract = processContractList.find((contract: any) => contract.id === dyeingWorkOrderId);
      if (selectedContract) {
        setValue("dyeingWorkOrderNo", selectedContract.dyeingWorkOrderNo || "");
      }
      if (selectedContract && selectedContract.fabricItems) {
        const fabrics = selectedContract.fabricItems.map((item: any) => {
          const fabricCode = getFabricCodeById(item.finishedFabricCodeId);
          return {
            id: item.finishedFabricCodeId,
            name: item.finishedFabricName,
            code: fabricCode,
            fullDisplay: `${fabricCode} - ${item.finishedFabricName}`
          };
        });
        setAvailableFabrics(fabrics);

        // Auto-select the first fabric if only one exists and not editing an item
        if (fabrics.length === 1 && !newItem.finishedFabricCodeQuality && editingIndex === null) {
          setNewItem(prev => ({
            ...prev,
            finishedFabricCodeQuality: fabrics[0].fullDisplay
          }));
        }

        // AUTO-FETCH LOT NUMBERS FROM FabricDispatchForDyeing - ADDED
        const dispatchRecords = (fabricDispatchDyingList || []).filter(
          (dispatch: any) => dispatch.dyeingWorkOrderId === dyeingWorkOrderId && dispatch.processType === "FABRIC"
        );
        
        // Extract unique lot numbers
        const uniqueLotNumbers = [...new Set(dispatchRecords.map((d: any) => d.lotNumber).filter(Boolean))] as string[];
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
    } else {
      setAvailableFabrics([]);
      setAvailableLotNumbers([]); // ADDED
      setValue("lotNumber", ""); // ADDED
      setValue("dyeingWorkOrderNo", "");
      setSelectedVendorId(null);
    }
  }, [dyeingWorkOrderId, processContractList, fabricMasterList, fabricDispatchDyingList, setValue]); // ADDED fabricDispatchDyingList, setValue

  useEffect(() => {
    if (newItem.meter > 0) {
      const yards = newItem.meter * 1.094;
      setNewItem(prev => ({ ...prev, yards: Number(yards.toFixed(2)) }));
    }
  }, [newItem.meter]);

  useEffect(() => {
    if (newItem.netWeight > 0 && newItem.meter > 0) {
      const averageWeight = newItem.netWeight / newItem.meter;
      setNewItem(prev => ({ ...prev, averageWeight: Number(averageWeight.toFixed(2)) }));
    }
  }, [newItem.netWeight, newItem.meter]);

  const orderQuantity = watch("orderQuantity");
  const costPerPound = watch("costPerPound");

  useEffect(() => {
    if (orderQuantity && costPerPound) {
      const total = Number(orderQuantity) * Number(costPerPound);
      setValue("totalAmount", Number(total.toFixed(2)));
    }
  }, [orderQuantity, costPerPound, setValue]);

  useEffect(() => {
    const totalReceived = fabricReceiveDetails.reduce((sum, item) =>
      sum + (Number(item.meter) || 0), 0
    );
    setValue("receivedQuantity", totalReceived);

    const balance = (Number(orderQuantity) || 0) - totalReceived;
    setValue("balanceQuantity", balance);

    setDispatchDetails(prev => ({
      ...prev,
      receivedQuantity: totalReceived.toFixed(2),
      balanceQuantity: balance.toFixed(2),
      
    }));
  }, [fabricReceiveDetails, orderQuantity, setValue]);

  const getFabricCodeById = (fabricCodeId: number) => {
    const fabric = fabricMasterList?.find((f: any) => f.id === fabricCodeId);
    return fabric?.fabricCode || "";
  };

  const findFabricMasterByCode = (code?: string) => {
    if (!code) {
      return undefined;
    }
    const normalizedCode = code.toString().trim().toLowerCase();
    if (!normalizedCode) {
      return undefined;
    }
    return fabricMasterArray.find((fabric: any) => {
      const fabricCode = (fabric?.fabricCode || fabric?.code || "").toString().trim().toLowerCase();
      return fabricCode === normalizedCode;
    });
  };

  const getFabricMasterIdByCode = (code?: string) => {
    const fabric = findFabricMasterByCode(code);
    return fabric?.id ? Number(fabric.id) : undefined;
  };

  const loadDispatchDetails = (selectedContract: any, options: { preserveDcFields?: boolean } = {}) => {
    setSelectedVendorId(selectedContract?.vendorId ?? null);
    setValue("dyeingWorkOrderNo", selectedContract?.dyeingWorkOrderNo || "");
    const contractItem = selectedContract.fabricItems?.[0];

    if (contractItem) {
      const finishedFabricCode = getFabricCodeById(contractItem?.finishedFabricCodeId);
      const greigeFabricCode = getFabricCodeById(contractItem?.greigeFabricCodeId);

      const dispatchedQty = (fabricDispatchDyingList || [])
        .filter((dispatch: any) => dispatch.dyeingWorkOrderId === selectedContract.id && dispatch.processType === "FABRIC")
        .reduce((total: number, dispatch: any) => total + (Number(dispatch.dispatchedQuantity) || 0), 0);

      setDispatchDetails({
        finishedFabricCode: finishedFabricCode || "",
        finishedFabricCodeId: contractItem?.finishedFabricCodeId,
        finishedFabricName: contractItem?.finishedFabricName || "",
        greigeFabricCode: greigeFabricCode || "",
        greigeFabricCodeId: contractItem?.greigeFabricCodeId,
        greigeFabricName: contractItem?.greigeFabricName || "",
        orderQuantity: contractItem?.quantity?.toString() || "",
        dispatchedQuantity: dispatchedQty.toString(),
        receivedQuantity: "0",
        balanceQuantity: contractItem?.quantity?.toString() || ""
      });

      setValue("orderQuantity", Number(contractItem?.quantity) || 0);
      setValue("costPerPound", Number(contractItem?.costPerPound) || 0);
      if (!options.preserveDcFields) {
        setValue("dcNumber", contractItem?.dcNumber || "");
        setValue("dcDate", contractItem?.dcDate || "");
      }
      setValue("totalAmount", Number(contractItem?.totalAmount) || 0);
      
      // AUTO-FETCH LOT NUMBERS FROM FabricDispatchForDyeing - ADDED
      const dispatchRecords = (fabricDispatchDyingList || []).filter(
        (dispatch: any) => dispatch.dyeingWorkOrderId === selectedContract.id && dispatch.processType === "FABRIC"
      );
      
      // Extract unique lot numbers
      const uniqueLotNumbers = [...new Set(dispatchRecords.map((d: any) => d.lotNumber).filter(Boolean))] as string[];
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

  const importFabricRowsFromExcel = (rows: Record<string, any>[]) => {
    const validationErrors: string[] = [];
    const parsedEntries: FabricReceiveItem[] = [];
    const existingPieces = new Set(
      fabricReceiveDetails
        .map(entry => entry.pieceRollNo?.toString().trim().toLowerCase())
        .filter(Boolean)
    );

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

      const fabricValue = normalizeCellValue(
        normalized['fabric code - quality'] ??
        normalized['fabric code quality'] ??
        normalized['fabric code'] ??
        normalized['finished fabric']
      );
      if (!fabricValue) {
        validationErrors.push(`Row ${index + 2}: Sort No - Construction is required`);
        return;
      }
      const fabricRecord = availableFabricLookup.get(fabricValue.toLowerCase());
      if (!fabricRecord) {
        validationErrors.push(`Row ${index + 2}: Fabric "${fabricValue}" not available for the selected contract`);
        return;
      }

      const pieceRollNo = normalizeCellValue(
        normalized['piece/roll no'] ??
        normalized['piece roll no'] ??
        normalized['piece no'] ??
        normalized['roll no']
      );
      if (!pieceRollNo) {
        validationErrors.push(`Row ${index + 2}: Piece/Roll No is required`);
        return;
      }
      const normalizedPieceNo = pieceRollNo.toLowerCase();
      if (existingPieces.has(normalizedPieceNo) || parsedEntries.some(entry => entry.pieceRollNo?.toLowerCase() === normalizedPieceNo)) {
        validationErrors.push(`Row ${index + 2}: Duplicate Piece/Roll No "${pieceRollNo}"`);
        return;
      }

      const meterValue = parseNumericCell(normalized['meter']);
      if (!meterValue || meterValue <= 0) {
        validationErrors.push(`Row ${index + 2}: Meter must be greater than zero`);
        return;
      }

      const netWeightValue = parseNumericCell(normalized['net weight'] ?? normalized['weight']);
      if (netWeightValue === null || netWeightValue < 0) {
        validationErrors.push(`Row ${index + 2}: Net Weight must be zero or greater`);
        return;
      }

      const avgWeightValue = parseNumericCell(normalized['average weight'] ?? normalized['avg weight']);
      const computedAvgWeight = netWeightValue && meterValue ? Number((Number(netWeightValue) / Number(meterValue)).toFixed(3)) : 0;
      const averageWeight = avgWeightValue && avgWeightValue > 0 ? Number(avgWeightValue) : computedAvgWeight;

      const gradeName = normalizeCellValue(normalized['grade name'] ?? normalized['grade']);
      if (!gradeName) {
        validationErrors.push(`Row ${index + 2}: Grade Name is required`);
        return;
      }
      const gradeRecord = gradeNameLookup.get(gradeName.toLowerCase());
      if (!gradeRecord) {
        validationErrors.push(`Row ${index + 2}: Grade "${gradeName}" not found`);
        return;
      }

      const yards = Number((Number(meterValue) * 1.094).toFixed(2));

      parsedEntries.push({
        id: Date.now() + index + parsedEntries.length,
        finishedFabricCodeQuality: fabricRecord.fullDisplay || fabricRecord.name || fabricValue,
        pieceRollNo,
        meter: Number(meterValue),
        yards,
        netWeight: netWeightValue ? Number(netWeightValue) : 0,
        averageWeight: Number(averageWeight || 0),
        gradeId: Number(gradeRecord.id) || 0,
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
      const combinedMeters = [...fabricReceiveDetails, ...parsedEntries].reduce((sum, entry) => sum + (Number(entry.meter) || 0), 0);
      if (combinedMeters > orderQtyNumber + 0.0001) {
        toast.error('Imported meters exceed the order quantity');
        return;
      }
    }

    setFabricReceiveDetails(prev => [...prev, ...parsedEntries]);
    toast.success(`Imported ${parsedEntries.length} ${parsedEntries.length === 1 ? 'entry' : 'entries'}`);
  };

  const handleDownloadTemplate = () => {
    if (!canUseTemplateActions) {
      toast.error('Select a work order to download the template');
      return;
    }
    generateExcelTemplate({
      headers: FABRIC_TEMPLATE_HEADERS,
      fileName: 'processing-fabric-template'
    });
  };

  const handleUploadButtonClick = () => {
    if (!canUseTemplateActions) {
      toast.error('Load fabric and warehouse data before importing');
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
      importFabricRowsFromExcel(rows);
    } catch (error) {
      toast.error('Failed to process the uploaded file');
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const generatePieceRollNo = () => {
    const prefix = inwardType === "PIECE" ? "P" : "R";
    const counter = inwardType === "PIECE" ? pieceRollCounter.piece : pieceRollCounter.roll;
    return `${prefix}-${counter.toString().padStart(4, '0')}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "finishedFabricCodeQuality") {
      const fabricMasterId = resolveFabricMasterIdFromQuality(value);
      setNewItem(prev => ({
        ...prev,
        finishedFabricCodeQuality: value,
        fabricMasterId: fabricMasterId ?? prev.fabricMasterId
      }));
      return;
    }

    const numericFields = ['meter', 'netWeight', 'averageWeight', 'gradeId', 'warehouseId'];
    setNewItem(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value
    }));
  };

  const addFabricReceiveDetail = () => {
    if (!newItem.finishedFabricCodeQuality || !newItem.meter) {
      alert("Please fill in Sort No - Construction and Meter");
      return;
    }

    const trimmedPieceRoll = newItem.pieceRollNo?.toString().trim();
    const preparedPieceRollNo = trimmedPieceRoll || generatePieceRollNo();
    const normalizedPieceRollNo = preparedPieceRollNo.toLowerCase();

    const duplicatePieceRoll = fabricReceiveDetails.some((detail, index) => {
      if (editingIndex !== null && index === editingIndex) {
        return false;
      }
      const detailPieceRoll = detail.pieceRollNo?.toString().trim().toLowerCase();
      return !!detailPieceRoll && detailPieceRoll === normalizedPieceRollNo;
    });

    if (duplicatePieceRoll) {
      toast.error(`Piece/Roll No "${preparedPieceRollNo}" already exists`);
      return;
    }

    const itemToAdd = {
      ...newItem,
      pieceRollNo: preparedPieceRollNo,
      fabricMasterId: newItem.fabricMasterId || resolveFabricMasterIdFromQuality(newItem.finishedFabricCodeQuality)
    };

    if (editingIndex !== null) {
      const updatedDetails = [...fabricReceiveDetails];
      updatedDetails[editingIndex] = itemToAdd;
      setFabricReceiveDetails(updatedDetails);
      setEditingIndex(null);
    } else {
      setFabricReceiveDetails([...fabricReceiveDetails, itemToAdd]);

      if (!trimmedPieceRoll) {
        setPieceRollCounter(prev => ({
          ...prev,
          [inwardType.toLowerCase()]: prev[inwardType.toLowerCase() as keyof typeof prev] + 1
        }));
      }
    }

    setNewItem({
      finishedFabricCodeQuality: '',
      pieceRollNo: '',
      meter: 0,
      yards: 0,
      netWeight: 0,
      averageWeight: 0,
      gradeId: 0,
      warehouseId: 0,
      activeFlag: true,
      fabricMasterId: 0
    });
  };

  const editFabricReceiveDetail = (index: number) => {
    setNewItem(fabricReceiveDetails[index]);
    setEditingIndex(index);
  };

  const deleteFabricReceiveDetail = (index: number) => {
    setFabricReceiveDetails(fabricReceiveDetails.filter((_, i) => i !== index));
  };

  const handleProcessContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    if (id) {
      const selectedContract = processContractList.find((contract: any) => contract.id === id);
      if (selectedContract) {
        loadDispatchDetails(selectedContract);
      }
    }
  };

  const onSubmit = async (data: FinishFabricReceiveFormData) => {

    if (fabricReceiveDetails.length === 0) {
      alert("Please add at least one fabric item");
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
                  tabName: "fabric",
                });
                receiveNo = docResponse.documentNumber;
              } catch (error) {
                console.warn("Failed to generate document number:", error);
              }
            }
            isSavingRef.current = true;


    const payloadItems = fabricReceiveDetails.map((item) => {
      const resolvedFabricMasterId = item.fabricMasterId ?? resolveFabricMasterIdFromQuality(item.finishedFabricCodeQuality);
      const { fabricCode, fabricQuality } = parseFabricCodeAndQuality(item.finishedFabricCodeQuality || "");
      return {
        ...item,
        fabricMasterId: resolvedFabricMasterId,
        fabricCode,
        quality: fabricQuality,
        pieceEntries: [
          buildPieceEntryFromDetail(item, resolvedFabricMasterId, fabricCode, fabricQuality)
        ]
      };
    });

    const selectedContract = processContractList.find((contract: any) => contract.id === data.dyeingWorkOrderId);
    const contractItem = selectedContract?.fabricItems?.[0];

    const resolvedFinishedFabricCode = contractItem
      ? getFabricCodeById(contractItem.finishedFabricCodeId) || dispatchDetails.finishedFabricCode
      : dispatchDetails.finishedFabricCode || "";
    const resolvedFinishedFabricName = contractItem?.finishedFabricName || dispatchDetails.finishedFabricName || "";
    const resolvedFinishedFabricCodeId =
      contractItem?.finishedFabricCodeId ?? getFabricMasterIdByCode(resolvedFinishedFabricCode);

    const resolvedGreigeFabricCode = contractItem
      ? getFabricCodeById(contractItem.greigeFabricCodeId) || dispatchDetails.greigeFabricCode
      : dispatchDetails.greigeFabricCode || "";
    const resolvedGreigeFabricName = contractItem?.greigeFabricName || dispatchDetails.greigeFabricName || "";
    const resolvedGreigeFabricCodeId =
      contractItem?.greigeFabricCodeId ?? getFabricMasterIdByCode(resolvedGreigeFabricCode);

    const payload = {
      ...data,
      processType: "FABRIC",
      vendorId: selectedVendorId ?? 0,
      dyeingWorkOrderNo: data.dyeingWorkOrderNo || "",
      items: payloadItems,
      yarnItems: null,
      receivedQuantity: fabricReceiveDetails.reduce((sum, item) => sum + (Number(item.meter) || 0), 0),
      balanceQuantity: (data.orderQuantity || 0) - fabricReceiveDetails.reduce((sum, item) => sum + (Number(item.meter) || 0), 0),
      receiveNo: receiveNo,
      lotNumber: data.lotNumber || "", // ADDED
      companyId,
      finishedFabricCode: resolvedFinishedFabricCode,
      finishedFabricName: resolvedFinishedFabricName,
      finishedFabricCodeId: resolvedFinishedFabricCodeId,
      greigeFabricCode: resolvedGreigeFabricCode,
      greigeFabricName: resolvedGreigeFabricName,
      greigeFabricCodeId: resolvedGreigeFabricCodeId
    };
   

    try {
      // console.log("Submitting payload:", payload);
      // alert(JSON.stringify(payload));
      if (isEditMode && existingData?.id) {
        const updatePayload = { ...payload, id: existingData.id, processType: "FABRIC", companyId };
        await dispatch(updateFinishFabricReceive(updatePayload)).unwrap();
      } else {
        await dispatch(createFinishFabricReceive(payload)).unwrap();
        documentNumberService.clearMemoryCache("Processing Receive Management", "fabric");
      
      }

      reset();
      setFabricReceiveDetails([]);
      dispatch(clearCreateResult());
      navigate("/transaction/processing-receive-management", { state: { activeTab: "fabric" } });
    } catch (error) {
      console.error("Error saving fabric receive:", error);
    }
  };

  const canUseTemplateActions = useMemo(() => {
    return availableFabrics.length > 0 && warehouseData.length > 0;
  }, [availableFabrics.length, warehouseData.length]);

  const summary = {
    totalPiecesRolls: fabricReceiveDetails.length,
    totalMeters: fabricReceiveDetails.reduce((sum, item) => sum + (Number(item.meter) || 0), 0),
    totalYards: fabricReceiveDetails.reduce((sum, item) => sum + (Number(item.yards) || 0), 0),
    totalNetWeight: fabricReceiveDetails.reduce((sum, item) => sum + (Number(item.netWeight) || 0), 0),
    fabricCodes: [...new Set(fabricReceiveDetails.map(item => item.finishedFabricCodeQuality))]
  };

  return (
    <div className="p-14 bg-white shadow-md rounded-lg">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xls,.xlsx"
        onChange={handleFileUpload}
      />
      <input type="hidden" {...register("dyeingWorkOrderNo")} />
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center space-x-8">
          <Button
            variant="outline"
            onClick={() => navigate("/transaction/processing-receive-management", { state: { activeTab: "fabric" } })}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">
            {isEditMode ? "Edit" : "New"} Finished Fabric Receive
          </h2>
        </div>
       
      </div>

      {/* General Details - Same as before */}
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
              <label className="block text-sm font-medium">Fabric Receive Date <span className="text-red-600">*</span></label>
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
              <label className="block text-sm font-medium">Dyeing Work Order <span className="text-red-600">*</span></label>
              <CommonSearchableSelect
                options={processContractList?.filter((contract: any) => contract.processType === "FABRIC").map((contract: any) => ({
                  value: String(contract.id),
                  label: contract.dyeingWorkOrderNo
                }))}
                value={String(watch("dyeingWorkOrderId") || "")}
                onValueChange={(value) => {
                  const id = parseInt(value);
                  setValue("dyeingWorkOrderId", id, { shouldValidate: true });
                  handleProcessContractChange({ target: { value } } as any);
                }}
                placeholder="Select Work Order"
                className={`w-full ${errors.dyeingWorkOrderId ? 'border-red-500' : ''}`}
              />
              {errors.dyeingWorkOrderId && (
                <p className="mt-1 text-sm text-red-600">{errors.dyeingWorkOrderId.message}</p>
              )}
            </div>



             <div>
              <label className="block text-sm font-medium mb-1">
                Inward Type <span className="text-red-600">*</span>
              </label>

              <CommonSearchableSelect
                placeholder="Select Inward Type"
                value={watch("inwardType") || ""}
                onChange={(value: string) => {
                  setValue("inwardType", value, { shouldValidate: true });
                }}
                options={[
                  { value: "ROLL", label: "Roll" },
                  { value: "PIECE", label: "Piece" }
                ]}
              />

              {errors.inwardType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.inwardType.message}
                </p>
              )}
            </div>


            <div>
              <label className="block text-sm font-medium">Order Quantity <span className="text-red-600">*</span></label>
              <input
                type="number"
                {...register("orderQuantity", {
                  required: "Quantity is required",
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Must be greater than 0" }
                })}
                className={`input mt-1 bg-gray-50 ${errors.orderQuantity ? 'border-red-500' : ''}`}
                placeholder="Order quantity"
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

            {/* LOT NUMBER FIELD - ADDED */}
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
                  }))}
                  {...register("lotNumber")}
                  onValueChange={(value) => {
                    setValue("lotNumber", value, { shouldValidate: true });
                  }}
                />
              ) : (
                <input
                  {...register("lotNumber")}
                  type="text"
                  className="input mt-1 bg-gray-50"
                  placeholder="Auto-filled from process contract"
                  readOnly={availableLotNumbers.length <= 1}
                />
              )}
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

      {/* Dispatch Details - Same as before */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Dispatch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium">Finished Fabric Code</label>
              <input value={dispatchDetails.finishedFabricCode} className="input mt-1 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Finished Fabric Name</label>
              <input value={dispatchDetails.finishedFabricName} className="input mt-1 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Greige Fabric Code</label>
              <input value={dispatchDetails.greigeFabricCode} className="input mt-1 bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Greige Fabric Name</label>
              <input value={dispatchDetails.greigeFabricName} className="input mt-1 bg-gray-50" readOnly />
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

      {/* Inward Details - UPDATED WITH DROPDOWN */}
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
              <label className="block text-sm font-medium">Sort No - Construction <span className="text-red-600">*</span></label>
              <select
                name="finishedFabricCodeQuality"
                value={newItem.finishedFabricCodeQuality}
                onChange={handleChange}
                className="input mt-1"
                disabled={!availableFabrics.length}
              >
                <option value="">Select Sort No - Construction</option>
                {availableFabrics.map((fabric: any) => (
                  <option key={fabric.id} value={fabric.fullDisplay}>
                    {fabric.fullDisplay}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {availableFabrics.length === 0 ? 'Select a work order first' : 'Editable - select from available fabrics'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">Piece/Roll No <span className="text-red-600">*</span></label>
              <input
                name="pieceRollNo"
                value={newItem.pieceRollNo}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Auto-generated if empty"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-generate: {generatePieceRollNo()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">Meter <span className="text-red-600">*</span></label>
              <input
                type="number"
                name="meter"
                value={newItem.meter || ''}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Meter"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Yards</label>
              <input
                type="number"
                name="yards"
                value={newItem.yards || ''}
                className="input mt-1 bg-gray-50"
                placeholder="Auto-calculated"
                step="0.01"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Net Weight</label>
              <input
                type="number"
                name="netWeight"
                value={newItem.netWeight || ''}
                onChange={handleChange}
                className="input mt-1"
                placeholder="Net Weight"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Average Weight</label>
              <input
                type="number"
                name="averageWeight"
                value={newItem.averageWeight || ''}
                className="input mt-1 bg-gray-50"
                placeholder="Auto-calculated"
                step="0.01"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Grade</label>
              <CommonSearchableSelect
                placeholder="Select Grade"
                value={newItem.gradeId ? String(newItem.gradeId) : "0"}
                options={gradeList?.map((grade: any) => ({
                  value: String(grade.id),
                  label: grade.gradeName,
                  activeFlag: grade.activeFlag ?? true
                })) || []}
                filterActive
                onValueChange={(value) => {
                  setNewItem(prev => ({
                    ...prev,
                    gradeId: Number(value)
                  }));
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Warehouse</label>
              <CommonSearchableSelect
                placeholder="Select Warehouse"
                value={newItem.warehouseId ? String(newItem.warehouseId) : "0"}
                options={warehouseList?.map((wh: any) => ({
                  value: String(wh.id),
                  label: wh.warehouseName,
                  activeFlag: wh.activeFlag ?? true
                })) || []}
                filterActive
                onValueChange={(value) => {
                  setNewItem(prev => ({
                    ...prev,
                    warehouseId: Number(value)
                  }));
                }}
              />
            </div>

            {/* <div></div> */}
          
          </div>
            <div className="flex items-end justify-end pt-8">
              <Button onClick={addFabricReceiveDetail} className="bg-primary hover:bg-primary text-white px-6 flex items-center">
                <Plus size={18} className="mr-2" />
                {editingIndex !== null ? "Update Item" : "Add Item"}
              </Button>
            </div>
        </CardContent>
      </Card>

      {/* Fabric Receive Details Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fabric Receive Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">#</th>
                  <th className="border p-2 text-left">Sort No - Construction</th>
                  <th className="border p-2 text-left">Piece/Roll No</th>
                  <th className="border p-2 text-right">Meter</th>
                  <th className="border p-2 text-right">Yards</th>
                  <th className="border p-2 text-right">Net Weight</th>
                  <th className="border p-2 text-right">Avg Weight</th>
                  <th className="border p-2 text-left">Grade</th>
                  <th className="border p-2 text-left">Warehouse</th>
                  <th className="border p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {fabricReceiveDetails.length > 0 ? (
                  fabricReceiveDetails.map((detail, index) => {
                    const gradeName = gradeByIdLookup.get(Number(detail.gradeId)) || '-';
                    const warehouseName = warehouseByIdLookup.get(Number(detail.warehouseId)) || '-';
                    const isPieceInspected = (detail as any).pieceEntries?.some((pe: any) => pe.isInspected === 1);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">{index + 1}</td>
                        <td className="border p-2">{detail.finishedFabricCodeQuality}</td>
                        <td className="border p-2">{detail.pieceRollNo}</td>
                        <td className="border p-2 text-right">{detail.meter?.toFixed(2)}</td>
                        <td className="border p-2 text-right">{detail.yards?.toFixed(2)}</td>
                        <td className="border p-2 text-right">{detail.netWeight?.toFixed(2)}</td>
                        <td className="border p-2 text-right">{detail.averageWeight?.toFixed(2)}</td>
                        <td className="border p-2">{gradeName}</td>
                        <td className="border p-2">{warehouseName}</td>
                        <td className="border p-2">
                          {isPieceInspected ? (
                            <div className="flex justify-center">
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                                Inspected
                              </span>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center">
                              <Button variant="outline" size="sm" onClick={() => editFabricReceiveDetail(index)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteFabricReceiveDetail(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="border p-4 text-center text-gray-500">
                      No fabric receive details added yet. Please add items above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      {fabricReceiveDetails.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Finished Fabric Codes - Quality</h4>
                <div className="flex flex-wrap gap-2">
                  {summary.fabricCodes.map((code, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total No. of Rolls/Pieces</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.totalPiecesRolls}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Meters</p>
                  <p className="text-2xl font-bold text-green-600">{summary.totalMeters.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Yards</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.totalYards.toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Net Weight</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.totalNetWeight.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

       <div className="flex justify-end mt-4">
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-primary hover:bg-primary text-white px-6 flex items-center"
        >
          <Save size={18} className="mr-2" />
          {loading ? "Saving..." : isEditMode ? "Update" : "Save"} Fabric Receive
        </Button>
        </div>
    </div>
  );
}