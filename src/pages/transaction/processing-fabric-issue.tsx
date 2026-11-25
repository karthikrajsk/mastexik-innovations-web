import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, Plus, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { PopupDataTable, PopupColumn } from "@/components/data/PopupDataTable";
import { createPurchaseOrder, getAllPoTypes, getAllPurchaseOrders, updatePurchaseOrder } from "@/state/purchaseOrderSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useDispatch, useSelector } from "react-redux";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllProductCategory } from "@/state/productCategorySlice";
import { DataTable } from "@/components/data/DataTable";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllTermsConditions } from "@/state/termsConditions";
import { getAllLotEntries, getAllWeavingContract, getWeavingContractById } from "@/state/weavingContractSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CodeSandboxLogoIcon } from "@radix-ui/react-icons";
import { getAllDyeingWorkOrdersByType } from "@/state/processContractSlice";
import { getAllSubCategories, getSubCategoryByCategory } from "@/state/subCategorySlice";
import { getAllShipmentModes } from "@/state/shipmentModeSlice";
import { createFabricDispatch, updateFabricDispatch, getAllFabricDispatch } from "@/state/processIssueSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllSalesOrders } from "@/state/salesOrderSlice";
import { getAllFabricInspection } from "@/state/fabricInspectionsSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllBaleRollPackings } from "@/state/baleRollPackingSlice";
import { getAllFinishFabricReceivesByType } from "@/state/finishFabricReceiveSlice";
import type { ApiState as SubCategoryState } from "@/state/subCategorySlice";
import documentNumberService from "@/services/DocumentNumberService";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { VENDOR_TYPE_ALL, filterVendorsByTypeIds } from "@/utils/vendorFilters";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { toast } from "react-toastify";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";

// Piece interfaces adapted from BaleRollPacking
interface FormPiece {
  id?: string;
  pieceNo: string;
  meters?: number;
  netWeight?: number;
  avgWeight?: number;
  gradeLabel?: string;
  availableQty: number;
  issueQty?: number;
}

// Update your interface to use boolean instead of literal true
interface FabricDispatchDyeingFormData {
  id?: number;
  fabricDispatchDate: string;
  vendorId: string;
  dyeingWorkOrderId: string;
  issueType: 'Roll' | 'Piece';
  lotNumber: string;
  orderQuantity: string;
  dispatchedQuantity: string;
  receivedQuantity: string;
  balanceQuantity: string;
  costPerPound: string;
  totalAmount: string;
  colorId: string;
  pantone: string;
  finishingId: string;
  salesOrderId: string;
  shipmentModeId: string;
  lotId: string | null;
  remarks: string;
  activeFlag: boolean; // Change from 'true' to 'boolean'
  processType: string;
  fabricDispatchId?: string;
}

const PROCESS_VENDOR_TYPE_IDS = [304, VENDOR_TYPE_ALL];

export function ProcessingFabricIssue() {
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const { subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
  const { processContractList } = useSelector((state: RootState) => state.dyeingWorkOrde);
  const { shipmentModesList } = useSelector((state: RootState) => state.shipmentMode);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const processVendors = useMemo(
    () => filterVendorsByTypeIds(vendorList, PROCESS_VENDOR_TYPE_IDS, { includeAllVendorTypeId: null }),
    [vendorList],
  );
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { fabricInspectionList } = useSelector((state: RootState) => state.fabricInspections);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
  const { list: baleRollList } = useSelector((state: RootState) => state.baleRollPacking as any);
  const { fabricDispatchDyingList } = useSelector((state: RootState) => state.fabricDispatchDyeing as any);
  const { finishFabricReceiveList } = useSelector((state: RootState) => state.finishFabricReceive as any);
  const [weavingContractItemDtl, setweavingContractItemDtl]: any = useState([]);
  const [newItem, setNewItem]: any = useState({});
  const [editingIndex, setEditingIndex]: any = useState(null);
  const [activeTab, setActiveTab] = useState("orderDetails");
  const [selectedJobWork, setSelectedJobWork]: any = useState([]);
  const [yarnRequirementDetails, setYarnRequirementDetails]: any = useState<any[]>([]);
  const [showLotDialog, setShowLotDialog] = useState(false);
  const [yarnIssueDetails, setYarnIssueDetails] = useState<any[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<FormPiece[]>([]); // Renamed from selectedLot
  const dispatch = useDispatch<AppDispatch>();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FabricDispatchDyeingFormData>();
  const [selectedDyeingWorkOrder, setSelectedDyeingWorkOrder] = useState<any>(null);
  const { subCategoryList: subCategories, subCategoryByCategoryList } = useSelector(
    (state: RootState) => state.subCategory as SubCategoryState
  );
  const [dispatchDetails, setDispatchDetails] = useState({
    finishedFabricCode: "",
    finishedFabricName: "",
    greigeFabricCode: "",
    greigeFabricName: "",
    orderQuantity: "",
    dispatchedQuantity: "",
    receivedQuantity: "",
    balanceQuantity: ""
  });
  const [formErrors, setFormErrors] = useState({
    fabricDispatchDate: false,
    vendorId: false,
    dyeingWorkOrderId: false,
    orderQuantity: false,
    issueType: false, // New
  });
  const navigate = useNavigate();
  const location = useLocation();
  const processingIssueDtl = location.state?.processingIssueDtl;
  const companyId = useResolvedCompanyId();
  console.log("processingIssueDtl from location state:", processingIssueDtl);

  // Piece dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availablePieces, setAvailablePieces] = useState<FormPiece[]>([]);

  // Watchers
  const issueType = watch('issueType');
  const currentFabricCodeStr = dispatchDetails.greigeFabricCode || dispatchDetails.finishedFabricCode || '';

  // Update validateForm to include issueType
  const validateForm = () => {
    const formValues = {
      date: watch("fabricDispatchDate"),
      vendor: watch("vendorId"),
      workOrder: watch("dyeingWorkOrderId"),
      issueType: watch("issueType"), // New
      lotNumber: watch("lotNumber"),
      quantity: watch("orderQuantity"),
      cost: watch("costPerPound"),
      total: watch("totalAmount")
    };

    const isValid = Object.values(formValues).every(val => Boolean(val)) &&
      !isNaN(Number(formValues.quantity)) &&
      !isNaN(Number(formValues.cost)) &&
      !isNaN(Number(formValues.total));

    setIsFormValid(isValid);
    return isValid;
  };

  useEffect(() => {
    const subscription = watch(() => validateForm());
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    const orderQty = Number(watch("orderQuantity")) || 0;
    const costPerPound = Number(watch("costPerPound")) || 0;
    const total = orderQty * costPerPound;
    setValue("totalAmount", total.toFixed(2));
  }, [watch("orderQuantity"), watch("costPerPound")]);

  // Set default dispatch date to today for new records
  useEffect(() => {
    if (!processingIssueDtl) {
      const today = new Date().toISOString().split('T')[0];
      setValue("fabricDispatchDate", today);
    }
  }, [setValue]);

  // Update the useEffect that populates edit data
  // Update the useEffect that populates edit data
  useEffect(() => {
    if (processingIssueDtl) {
      console.log("Populating edit data:", processingIssueDtl);

      reset({
        id: processingIssueDtl.id,
        fabricDispatchDate: processingIssueDtl.fabricDispatchDate?.slice(0, 10) || new Date().toISOString().split('T')[0],
        vendorId: String(processingIssueDtl.vendorId || ''),
        dyeingWorkOrderId: String(processingIssueDtl.dyeingWorkOrderId || ''),
        issueType: processingIssueDtl.issueType || 'Roll',
        lotNumber: String(processingIssueDtl.lotNumber ?? processingIssueDtl.lotNo ?? ''),
        orderQuantity: String(processingIssueDtl.orderQuantity || ''),
        dispatchedQuantity: String(processingIssueDtl.dispatchedQuantity || '0'),
        receivedQuantity: String(processingIssueDtl.receivedQuantity || '0'),
        balanceQuantity: String(processingIssueDtl.balanceQuantity || ''),
        costPerPound: String(processingIssueDtl.costPerPound || ''),
        totalAmount: String(processingIssueDtl.totalAmount || ''),
        colorId: String(processingIssueDtl.colorId || ''),
        pantone: processingIssueDtl.pantone || '',
        finishingId: String(processingIssueDtl.finishingId || '0'),
        salesOrderId: String(processingIssueDtl.salesOrderId || ''),
        shipmentModeId: String(processingIssueDtl.shipmentModeId || '0'),
        lotId: processingIssueDtl.lotId ? String(processingIssueDtl.lotId) : null,
        remarks: processingIssueDtl.remarks || '',
        activeFlag: processingIssueDtl.activeFlag !== false,
        processType: processingIssueDtl.processType || 'FABRIC',
        fabricDispatchId: processingIssueDtl.fabricDispatchId || ''
      });

      // Populate selected pieces for edit
      let fabricCodeFromIssues = "";
      let fabricNameFromIssues = "";

      if (processingIssueDtl.fabricIssues && Array.isArray(processingIssueDtl.fabricIssues)) {
        const pieces = processingIssueDtl.fabricIssues.map((issue: any) => ({
          id: issue.lotId || issue.id,
          pieceNo: issue.pieceNo || '',
          meters: issue.meters || 0,
          netWeight: issue.netWeight || issue.availableQty || 0,
          avgWeight: issue.avgWeight || 0,
          gradeLabel: issue.gradeLabel || '',
          availableQty: issue.availableQty || issue.availableReqQty || 0,
          issueQty: issue.issueQty || 0,
          fabricCode: issue.fabricCode || null,
          fabricName: issue.fabricName || null,
          issueType: issue.issueType || null
        }));
        setSelectedPieces(pieces);

        // Extract fabric code and name from first piece (all pieces typically have same fabric)
        if (pieces.length > 0 && pieces[0].fabricCode) {
          fabricCodeFromIssues = pieces[0].fabricCode;
          fabricNameFromIssues = pieces[0].fabricName || '';
        }
      }

      // Update dispatch details for edit - PRIORITIZE values from fabricIssues
      setDispatchDetails({
        finishedFabricCode: processingIssueDtl.finishedFabricCode || "",
        finishedFabricName: processingIssueDtl.finishedFabricName || "",
        greigeFabricCode: fabricCodeFromIssues || processingIssueDtl.greigeFabricCode || "",
        greigeFabricName: fabricNameFromIssues || processingIssueDtl.greigeFabricName || "",
        orderQuantity: String(processingIssueDtl.orderQuantity || ''),
        dispatchedQuantity: String(processingIssueDtl.dispatchedQuantity || '0'),
        receivedQuantity: String(processingIssueDtl.receivedQuantity || '0'),
        balanceQuantity: String(processingIssueDtl.balanceQuantity || '')
      });

      console.log("Dispatch Details after edit population:", {
        greigeFabricCode: fabricCodeFromIssues || processingIssueDtl.greigeFabricCode || "",
        greigeFabricName: fabricNameFromIssues || processingIssueDtl.greigeFabricName || "",
        fabricCodeFromIssues,
        fabricNameFromIssues
      });
    }
  }, [processingIssueDtl, reset, setValue]);

  // useEffect(() => {
  //   if (selectedPieces.length > 0) {
  //     const totalIssueQty = selectedPieces.reduce((sum: number, piece: any) => {
  //       return sum + (piece.issueQty ? Number(piece.issueQty) : 0);
  //     }, 0);

  //     setDispatchDetails(prev => ({
  //       ...prev,
  //       receivedQuantity: totalIssueQty.toString(),
  //       balanceQuantity: (Number(prev.orderQuantity) - totalIssueQty).toString()
  //     }));
  //   }
  // }, [selectedPieces]);

  useEffect(() => {
    dispatch(getAllPurchaseOrders({}));
    const salesOrderParams = companyId ? { companyId } : {};
    dispatch(getAllSalesOrders(salesOrderParams));
    dispatch(getAllPoTypes({fetchAll:true}));
    dispatch(getAllVendors({fetchAll:true}));
    dispatch(getAllProductCategory({fetchAll:true}));
    dispatch(getAllTermsConditions({fetchAll:true}));
    dispatch(getAllWeavingContract({fetchAll:true}));
    dispatch(getAllDyeingWorkOrdersByType({ type: "FABRIC", offset: 0, limit: 500 }));
    dispatch(getSubCategoryByCategory("Colour"));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(getAllShipmentModes({fetchAll:true}));
    dispatch(getAllFabricInspection(companyId ? { companyId } : undefined));
    dispatch(getAllFabricMasters({fetchAll:true}));
    dispatch(getAllBaleRollPackings({} as any));
    dispatch(getAllFabricDispatch({ processType: "FABRIC" }));
    dispatch(getAllFinishFabricReceivesByType("FABRIC"));
  }, [dispatch, companyId]);

  // Filter processing contracts to show only FABRIC type
  const fabricProcessContracts = useMemo(() => {
    return (processContractList || []).filter((contract: any) => contract.processType === "FABRIC");
  }, [processContractList]);

  // Piece/Roll dialog logic
  // Enhanced openPieceDialog with debugging for Roll selection
  const openPieceDialog = () => {
    if (!currentFabricCodeStr) {
      alert("Please select a fabric code first");
      return;
    }

    console.log("=== Opening Piece Dialog ===");
    console.log("Issue Type:", issueType);
    console.log("Current Sort No - Construction:", currentFabricCodeStr);

    // Build fabric lookup
    const fabricsArr: any[] = ((fabricMasterList?.data ?? fabricMasterList) || []) as any[];
    const fabricById: Record<string, any> = {};
    fabricsArr.forEach((ff: any) => { fabricById[String(ff.id)] = ff; });

    const codeById = (id: any) => (
      fabricById[String(id)]?.greigeCode ||
      fabricById[String(id)]?.fabricCode ||
      fabricById[String(id)]?.code ||
      fabricById[String(id)]?.name ||
      ''
    );

    // Get bale/roll data
    const brpRaw = (baleRollList?.data ?? baleRollList) || [];
    const brpArr: any[] = Array.isArray(brpRaw) ? brpRaw : [];
    console.log("Total Bale/Roll Records:", brpArr.length);

    // Create lookup map for bale/roll records by ID
    const brpById: Record<string, any> = {};
    brpArr.forEach((bp: any) => { brpById[String(bp.id)] = bp; });

    // Get all dispatched piece numbers
    const dispatchedPieceNos = new Set(
      ((((fabricDispatchDyingList as any)?.data ?? fabricDispatchDyingList) || []) as any[])
        .flatMap((fd: any) => (Array.isArray(fd?.pieceIssues) ? fd.pieceIssues : []))
        .map((pi: any) => pi?.pieceNo)
        .filter(Boolean)
    );

    // In edit mode, exclude the current record's selected pieceNos from the dispatched filter
    // to allow them to appear in availablePieces for modification
    const isEditMode = !!processingIssueDtl;
    if (isEditMode && selectedPieces.length > 0) {
      const currentPieceNos = selectedPieces.map((p: FormPiece) => p.pieceNo).filter(Boolean);
      currentPieceNos.forEach((no) => dispatchedPieceNos.delete(no));
      console.log("Edit mode: Excluded current pieceNos from dispatched filter:", currentPieceNos);
    }

    console.log("Dispatched Pieces (after edit exclusion):", Array.from(dispatchedPieceNos));

    // Get inspections matching the fabric code
    const inspectionsRaw = (fabricInspectionList?.data ?? fabricInspectionList) || [];
    const inspectionsArr: any[] = Array.isArray(inspectionsRaw) ? inspectionsRaw : [];
    const filteredInspections = inspectionsArr.filter((ins: any) =>
      String(ins.fabricCode) === String(currentFabricCodeStr)
    );
    console.log("Filtered Inspections for fabric:", filteredInspections.length);

    // ==================== ROLL LOGIC ====================
    if (issueType === 'Roll') {
      console.log("--- Processing ROLL Type ---");

      // Method 1: Try to get rolls from pieceEntries that are packed as rolls
      const rollsFromPieceEntries = filteredInspections.flatMap((ins: any) => {
        const pieceEntries = Array.isArray(ins.pieceEntries) ? ins.pieceEntries : [];
        console.log(`Inspection ${ins.id} has ${pieceEntries.length} piece entries`);

        return pieceEntries
          .filter((piece: any) => {
            const isInspected = piece.isInspected === 1 || piece.isInspected === true;
            const isPacked = piece.isPacked === 1 || piece.isPacked === true;
            const packingRec = brpById[String(piece.packingId)];
            const isRoll = packingRec && String(packingRec.packingType).toLowerCase() === 'roll';

            console.log(`Piece ${piece.pieceNumber}:`, {
              isInspected,
              isPacked,
              packingId: piece.packingId,
              hasPackingRec: !!packingRec,
              packingType: packingRec?.packingType,
              isRoll
            });

            return isInspected && isPacked && isRoll && !dispatchedPieceNos.has(piece.pieceNumber);
          })
          .map((piece: any) => {
            const meters = Number(piece.inspectedMtr ?? piece.quantity ?? 0);
            const netWeight = Number(piece.inspectedNtWt ?? piece.weight ?? 0);
            const avgWeight = piece.inspectedAvgWt != null ? Number(piece.inspectedAvgWt) :
              (meters ? Number((netWeight / meters).toFixed(6)) : 0);

            const packingRec = brpById[String(piece.packingId)];
            const rollNo = packingRec?.rollOrBaleNo || packingRec?.packingNo || piece.pieceNumber;
// alert(rollNo);
            return {
              id: piece.packingId || piece.id || `${ins.id}-${piece.pieceNumber}`,
              pieceNo: rollNo,
              meters,
              netWeight,
              avgWeight,
              gradeLabel: piece.gradeId ? `Grade ${String.fromCharCode(64 + piece.gradeId)}` : '',
              availableQty: netWeight,
            };
          });
      });

      // Method 2: Get rolls directly from baleRollList matching the fabric code
      const rollsFromBaleRoll = brpArr
        .filter((p: any) => {
          const fabricCode = codeById(p.fabricCodeId);
          const isRoll = String(p.packingType).toLowerCase() === 'roll';
          const matchesFabric = String(fabricCode) === String(currentFabricCodeStr);

          console.log(`BaleRoll ${p.id}:`, {
            fabricCodeId: p.fabricCodeId,
            resolvedCode: fabricCode,
            packingType: p.packingType,
            isRoll,
            matchesFabric,
            rollOrBaleNo: p.rollOrBaleNo
          });

          return isRoll && matchesFabric;
        })
        .map((p: any) => {
          const items = Array.isArray(p.items) ? p.items : [];
          const meters = items.reduce((s: number, it: any) => s + Number(it.meters || 0), 0);
          const net = items.reduce((s: number, it: any) => s + Number(it.netWeight || 0), 0);
          const avg = meters ? Number((net / meters).toFixed(6)) : 0;

          // Use the roll number from the packing record
          const rollNo = p.rollOrBaleNo || p.packingNo || `ROLL-${p.id}`;

          return {
            id: p.id,
            pieceNo: rollNo,
            meters,
            netWeight: net,
            avgWeight: avg,
            availableQty: net,
            gradeLabel: '',
            packingId: p.id
          };
        })
        .filter((r: any) => !dispatchedPieceNos.has(r.pieceNo));

      // Combine both methods and deduplicate by pieceNo (for robustness)
      const allRolls = [...rollsFromPieceEntries, ...rollsFromBaleRoll];
      const uniqueRolls = Array.from(
        new Map(allRolls.map((roll: any) => [roll.pieceNo, roll])).values()
      );

      console.log("Rolls from pieceEntries:", rollsFromPieceEntries.length);
      console.log("Rolls from baleRollList:", rollsFromBaleRoll.length);
      console.log("Unique rolls after dedup:", uniqueRolls.length);

      setAvailablePieces(uniqueRolls);
      setIsDialogOpen(true);
      return;
    }

    // ==================== PIECE LOGIC ====================
    console.log("--- Processing PIECE Type ---");

    const mappedPieces = filteredInspections.flatMap((ins: any) => {
      const pieceEntries = Array.isArray(ins.pieceEntries) ? ins.pieceEntries : [];

      if (pieceEntries.length > 0) {
        return pieceEntries
          .filter((piece: any) => {
            const isInspected = piece.isInspected === 1 || piece.isInspected === true;
            const computedPieceNo = piece.pieceNumber;
            const notDispatched = !dispatchedPieceNos.has(computedPieceNo);

            return isInspected && notDispatched;
          })
          .map((piece: any) => {
            const meters = Number(piece.inspectedMtr ?? piece.quantity ?? 0);
            const netWeight = Number(piece.inspectedNtWt ?? piece.weight ?? 0);
            const avgWeight = piece.inspectedAvgWt != null ? Number(piece.inspectedAvgWt) :
              (meters ? Number((netWeight / meters).toFixed(6)) : 0);

            return {
              id: piece.id || `${ins.id}-${piece.pieceNo}`,
              pieceNo:piece.pieceNumber,
              meters,
              netWeight,
              avgWeight,
              gradeLabel: piece.gradeId ? `Grade ${String.fromCharCode(64 + piece.gradeId)}` : '',
              availableQty: netWeight,
            };
          });
      }

      // Fallback to inspectionDetails
      const details = Array.isArray(ins.inspectionDetails) ? ins.inspectionDetails : [];
      if (details.length > 0) {
        return details
          .filter((det: any) => {
            const isInspected = det?.isInspected === 1 || det?.isInspected === true ||
              String(det?.isInspected ?? '1') === '1';
            return isInspected && !dispatchedPieceNos.has(det.pieceNo);
          })
          .map((det: any, idx: number) => {
            const meters = Number(det?.inspectedMeters ?? ins.pieceMeters ?? 0);
            const netWeight = Number(det?.actualNetWeight ?? ins.netWeight ?? 0);
            const avgWeight = det?.avgWeight != null ? Number(det.avgWeight) :
              (meters ? Number((netWeight / meters).toFixed(6)) : 0);

            return {
              id: det?.id ?? `${ins.id}-${idx}`,
              pieceNo: det?.pieceNo ?? ins.pieceNo,
              meters,
              netWeight,
              avgWeight,
              gradeLabel: det?.grade || '',
              availableQty: netWeight,
            };
          });
      }

      // Last resort
      const meters = Number(ins.pieceMeters || 0);
      const netWeight = Number(ins.netWeight || 0);
      const avgWeight = meters ? Number((netWeight / meters).toFixed(6)) : 0;

      const row = {
        id: ins.id,
        pieceNo: ins.pieceNo,
        meters,
        netWeight,
        avgWeight,
        gradeLabel: '',
        availableQty: netWeight,
      };

      return dispatchedPieceNos.has(row.pieceNo) ? [] : [row];
    });

    console.log("Total pieces found:", mappedPieces.length);
    setAvailablePieces(mappedPieces);
    setIsDialogOpen(true);
  };

  const handlePieceSelect = (piece: FormPiece) => {
    setSelectedPieces((prev: FormPiece[]) => {
      const exists = prev.some(p => p.pieceNo === piece.pieceNo);
      if (exists) {
        return prev.filter(p => p.pieceNo !== piece.pieceNo);
      }

      // When adding a piece, also update the dispatch details with fabric info
      const fabricCode = dispatchDetails.greigeFabricCode || dispatchDetails.finishedFabricCode || '';
      const fabricName = dispatchDetails.greigeFabricName || dispatchDetails.finishedFabricName || '';

      return [...prev, {
        ...piece,
        issueQty: 0,
        fabricCode: fabricCode,
        fabricName: fabricName
      }];
    });
  };

  const addItem = () => {
    if (editingIndex !== null) {
      const updatedItems = [...weavingContractItemDtl];
      updatedItems[editingIndex] = newItem;
      setweavingContractItemDtl(updatedItems);
      setEditingIndex(null);
    } else {
      setweavingContractItemDtl([...weavingContractItemDtl, newItem]);
    }
    setNewItem({
      productCategoryId: '',
      quantity: '',
      unit: '',
      price: '',
      netAmount: '',
      deliveryDate: '',
      remarks: '',
      activeFlag: true,
    });
  };

  const editItem = (index: number) => {
    setNewItem(weavingContractItemDtl[index]);
    setEditingIndex(index);
  };

  const deleteItem = (index: number) => {
    setweavingContractItemDtl(weavingContractItemDtl.filter((_: any, i: number) => i !== index));
  };


  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);

 // Generate document number for new beam inward entries
  useEffect(() => {
    const generateDocumentNumber = async () => {
      if (processingIssueDtl || hasGeneratedNumberRef.current) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Processing Issue Management',
          tabName: 'processIssueFabric',
        });
        setValue('fabricDispatchId', result.documentNumber, { shouldValidate: true });

        hasGeneratedNumberRef.current = true;
      } catch (error) {
        console.error('Failed to generate process contract number:', error);
        toast.error('Failed to generate process contract number');
      }
    };

    generateDocumentNumber();
  }, [processingIssueDtl, setValue]);

  // Cleanup document number cache if not saved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !processingIssueDtl) {
        documentNumberService.clearMemoryCache('Processing Issue Management', 'processIssueFabric');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (hasGeneratedNumberRef.current && !isSavingRef.current && !processingIssueDtl) {
        documentNumberService.clearMemoryCache('Processing Issue Management', 'processIssueFabric');
      }
    };
  }, [processingIssueDtl]);

  useEffect(() => {
    setValue('fabricDispatchId', processingIssueDtl?.fabricDispatchId || '');
  }, [processingIssueDtl, setValue]);

  const onSubmit = async (data: FabricDispatchDyeingFormData) => {
    if (!selectedPieces || selectedPieces.length === 0) {
      toast.error("Please add at least one Fabric Issue Detail item.");
      return;
    }

       const isEditMode = Boolean(processingIssueDtl?.id);
            let fabricDispatchId = data.fabricDispatchId || processingIssueDtl?.fabricDispatchId || "";
            if (!processingIssueDtl?.id && !fabricDispatchId) {
              try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                  screenName: "Processing Issue Management",
                  tabName: "processIssueFabric",
                });
                fabricDispatchId = docResponse.documentNumber;
              } catch (error) {
                console.warn("Failed to generate document number:", error);
              }
            }
            isSavingRef.current = true;

    console.log("Form data:", data);

    if (!validateForm()) {
      alert("Please fill all required fields correctly");
      return;
    }

    const totalIssueQty = selectedPieces.reduce((sum: number, piece: any) => {
      return sum + (piece.issueQty ? Number(piece.issueQty) : 0);
    }, 0);

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (!storedCompanyId) {
      alert("Company not selected. Please select a company.");
      return;
    }

    const receivedQtyFromFinishForSubmit = (finishFabricReceiveList || [])
      .filter((receive: any) =>
        Number(receive.dyeingWorkOrderId) === Number(data.dyeingWorkOrderId) &&
        receive.processType === "FABRIC"
      )
      .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

    const payload = {
      ...data,
      fabricDispatchDate: data.fabricDispatchDate,
      vendorId: Number(data.vendorId) || 0,
      dyeingWorkOrderId: Number(data.dyeingWorkOrderId) || 0,
      orderQuantity: Number(data.orderQuantity) || 0,
      dispatchedQuantity: Number(data.dispatchedQuantity) || 0,
      receivedQuantity: receivedQtyFromFinishForSubmit,
      balanceQuantity: (Number(data.orderQuantity) || 0) - totalIssueQty,
      costPerPound: Number(data.costPerPound) || 0,
      totalAmount: Number(data.totalAmount) || 0,
      colorId: Number(data.colorId) || 0,
      pantone: data.pantone || '',
      finishingId: Number(data.finishingId) || 0,
      salesOrderId: Number(data.salesOrderId) || 0,
      shipmentModeId: Number(data.shipmentModeId) || 0,
      lotId: data.lotId ? Number(data.lotId) : 0,
      lotNumber: data.lotNumber?.trim() || '',
      remarks: data.remarks || '',
      activeFlag: data.activeFlag,
      processType: data.processType || "FABRIC",
      issueType: data.issueType,
      fabricDispatchId: fabricDispatchId,
      companyId: parseInt(storedCompanyId),
      // Fabric details
      finishedFabricCode: dispatchDetails.finishedFabricCode || "",
      finishedFabricName: dispatchDetails.finishedFabricName || "",
      greigeFabricCode: dispatchDetails.greigeFabricCode || "",
      greigeFabricName: dispatchDetails.greigeFabricName || "",

      // Enhanced fabricIssues with ALL piece data
      fabricIssues: selectedPieces.map((piece: any) => ({
        lotId: piece.id || 0,
        availableReqQty: Number(piece.availableQty) || 0,
        issueQty: 0,
        pieceNo: piece.pieceNo || '',

        // ADD ALL THE MISSING FIELDS
        meters: Number(piece.meters) || 0,
        netWeight: Number(piece.netWeight) || 0,
        avgWeight: Number(piece.avgWeight) || 0,
        gradeLabel: piece.gradeLabel || '',
        availableQty: Number(piece.availableQty) || 0,

        fabricCode: piece.fabricCode || null,
        fabricName: piece.fabricName || null,
        issueType: data.issueType,
        activeFlag: true
      }))
    };

    console.log("Submitting payload with complete piece data:", payload);

    try {
      setIsSubmitting(true);
      if (isEditMode) {
        await dispatch(updateFabricDispatch({ id: processingIssueDtl.id, data: payload, processType: "FABRIC" })).unwrap();
      } else {
        await dispatch(createFabricDispatch(payload)).unwrap();
  documentNumberService.clearMemoryCache("Processing Issue Management", "processIssueFabric");
      }
      navigate("/transaction/processing-issue-management", { state: { activeTab: "processIssueFabric" } });
    } catch (err) {
      console.error("Failed to save/update Fabric Dispatch:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    reset();
    setSelectedPieces([]);
    setSelectedDyeingWorkOrder(null);
    setValue("lotNumber", "");
    setValue("fabricDispatchId", "");
    setDispatchDetails({
      finishedFabricCode: "",
      finishedFabricName: "",
      greigeFabricCode: "",
      greigeFabricName: "",
      orderQuantity: "",
      dispatchedQuantity: "",
      receivedQuantity: "",
      balanceQuantity: ""
    });
  };

  const handleJobWorkChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setSelectedJobWork([]);
    setYarnRequirementDetails([]);

    if (id) {
      try {
        const result = await dispatch(getWeavingContractById(id));
        console.log(result)
        const yarnRequired = result?.payload;

        if (yarnRequired?.yarnRequirements) {
          const requirements = yarnRequired.yarnRequirements.map((yarn: any) => ({
            yarnType: yarn.yarnType,
            yarnCount: yarn.yarnCount,
            gramsPerMeter: yarn.gramsPerMeter,
            totalwarpReq: yarn.totalRequiredQty,
            totalWarpIssued: yarn.totalIssuedQty || 0,
            balanceWarpToIssue: yarn.totalRequiredQty - (yarn.totalIssuedQty || 0)
          }));

          setYarnRequirementDetails(requirements);
          setSelectedJobWork(yarnRequired);
        }
      } catch (error) {
        console.error("Error fetching weaving contract by ID:", error);
      }
    }
  };

  const handleDyeingWorkOrderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    if (id) {
      try {
        const selectedOrder = processContractList.find((order: any) => order.id === id);
        setSelectedDyeingWorkOrder(selectedOrder);

        // During edit mode, if dispatch details are already populated from fabricIssues, 
        // preserve them instead of overwriting with contract data
        const hasExistingFabricIssues = processingIssueDtl &&
          processingIssueDtl.fabricIssues &&
          processingIssueDtl.fabricIssues.length > 0 &&
          processingIssueDtl.fabricIssues[0].fabricCode;

        if (hasExistingFabricIssues) {
          console.log("Edit mode with existing fabric issues - preserving fabric details");
          // Only update the work order reference, don't overwrite fabric details
          return;
        }

        let item = null;
        let processType = "FABRIC"; // default

        // Check if it's a fabric or yarn process
        if (selectedOrder.processType === "FABRIC" && selectedOrder.fabricItems && selectedOrder.fabricItems.length > 0) {
          item = selectedOrder.fabricItems[0];
          processType = "FABRIC";
        } else if (selectedOrder.processType === "YARN" && selectedOrder.yarnItems && selectedOrder.yarnItems.length > 0) {
          item = selectedOrder.yarnItems[0];
          processType = "YARN";
        }

        if (item) {
          const fabricsArr: any[] = ((fabricMasterList?.data ?? fabricMasterList) || []) as any[];
          const byId: Record<string, any> = {};
          fabricsArr.forEach((ff: any) => { byId[String(ff.id)] = ff; });

          const resolveFinishedCodeById = (fid: any) => {
            if (fid && isNaN(Number(fid))) return String(fid);
            const f = byId[String(fid)];
            return f?.fabricCode || f?.code || f?.name || String(fid) || '';
          };

          const resolveGreigeCodeById = (fid: any) => {
            if (fid && isNaN(Number(fid))) return String(fid);
            const f = byId[String(fid)];
            return f?.fabricCode || f?.greigeCode || f?.code || f?.name || String(fid) || '';
          };

          // For fabric process
          if (processType === "FABRIC") {
            const finishedCodeStr = resolveFinishedCodeById(item.finishedFabricCodeId);
            const greigeCodeStr = resolveGreigeCodeById(item.greigeFabricCodeId);

            // Calculate total received quantity from finish fabric receives
            const receivedQty = (finishFabricReceiveList || [])
              .filter((receive: any) =>
                receive.dyeingWorkOrderId === id &&
                receive.processType === "FABRIC"
              )
              .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);


            setDispatchDetails({
              finishedFabricCode: finishedCodeStr || "",
              finishedFabricName: item.finishedFabricName || "",
              greigeFabricCode: greigeCodeStr || "",
              greigeFabricName: item.greigeFabricName || "",
              orderQuantity: item.quantity || "",
              dispatchedQuantity: "0",
              receivedQuantity: receivedQty.toString(),
              balanceQuantity: item.quantity || ""
            });
          }
          // For yarn process  
          else if (processType === "YARN") {
            const finishedCodeStr = resolveFinishedCodeById(item.finishedYarnCodeId);
            const greigeCodeStr = resolveGreigeCodeById(item.greigeYarnCodeId);

            setDispatchDetails({
              finishedFabricCode: finishedCodeStr || "",
              finishedFabricName: item.finishedYarnName || "",
              greigeFabricCode: greigeCodeStr || "",
              greigeFabricName: item.greigeYarnName || "",
              orderQuantity: item.quantity || "",
              dispatchedQuantity: "0",
              receivedQuantity: "0",
              balanceQuantity: item.quantity || ""
            });
          }

          // Auto-set common form fields
          if (selectedOrder.vendorId != null) setValue("vendorId", String(selectedOrder.vendorId));
          if (item.quantity != null) setValue("orderQuantity", String(item.quantity));
          if (item.costPerPound != null) setValue("costPerPound", String(item.costPerPound));
          if (item.colorId != null) setValue("colorId", String(item.colorId));
          if (item.pantone != null) setValue("pantone", String(item.pantone));
          if (selectedOrder.remarks != null) setValue("remarks", String(selectedOrder.remarks));

          const soList: any[] = Array.isArray(salesOrderList) ? salesOrderList : (((salesOrderList as any)?.data) ?? []);
          if (selectedOrder.salesOrderNo != null && Array.isArray(soList)) {
            const so = soList.find((s: any) => String(s.salesOrderNo) === String(selectedOrder.salesOrderNo));
            if (so?.id != null) setValue("salesOrderId", String(so.id));
          }

          // Calculate total received quantity from finish fabric receives
          const receivedQtyFromFinish = (finishFabricReceiveList || [])
            .filter((receive: any) =>
              receive.dyeingWorkOrderId === id &&
              receive.processType === "FABRIC"
            )
            .reduce((total: number, receive: any) => total + (Number(receive.receivedQuantity) || 0), 0);

          setValue("dispatchedQuantity" as any, "0" as any);
          setValue("receivedQuantity" as any, receivedQtyFromFinish.toString() as any);
          if (item.quantity != null) setValue("balanceQuantity" as any, String(item.quantity) as any);

          // Set process type based on the contract
          setValue("processType", processType);
        }
      } catch (error) {
        console.error("Error fetching Processing Contract details:", error);
      }
    } else {
      setSelectedDyeingWorkOrder(null);
      setDispatchDetails({
        finishedFabricCode: "",
        finishedFabricName: "",
        greigeFabricCode: "",
        greigeFabricName: "",
        orderQuantity: "",
        dispatchedQuantity: "",
        receivedQuantity: "",
        balanceQuantity: ""
      });
      // Clear form fields
      setValue("vendorId", "");
      setValue("orderQuantity", "");
      setValue("costPerPound", "");
      setValue("totalAmount", "");
      setValue("colorId", "");
      setValue("pantone", "");
      setValue("finishingId", "");
      setValue("salesOrderId", "");
      setValue("shipmentModeId", "");
      setValue("remarks", "");
      setValue("lotNumber", "");
      setValue("dispatchedQuantity" as any, "" as any);
      setValue("receivedQuantity" as any, "" as any);
      setValue("balanceQuantity" as any, "" as any);
      setValue("processType", "FABRIC"); // Reset to default
    }
  };

  const colours = useMemo(() => {
    if (Array.isArray(subCategoryByCategoryList) && subCategoryByCategoryList.length > 0) {
      return subCategoryByCategoryList;
    }
    const list = Array.isArray(subCategories)
      ? subCategories
      : Array.isArray((subCategories as any)?.data)
        ? (subCategories as any).data
        : [];
    return list.filter((sc: any) => (sc?.categoryName || "").toLowerCase() === "colour");
  }, [subCategoryByCategoryList, subCategories]);

  const pieceColumns = useMemo<PopupColumn[]>(() => {
    const cols: PopupColumn[] = [
      {
        Header: 'Select',
        id: 'selected',
        disableFilters: true,
        Cell: ({ row }) => {
          const isSelected = selectedPieces.some((p: any) => p.pieceNo === row.pieceNo);
          return (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handlePieceSelect(row)}
            />
          );
        },
      },
      {
        Header: `${issueType || 'Issue'} No`,
        accessor: 'pieceNo',
        id: 'pieceNo',
      },
      {
        Header: 'Meters',
        accessor: (row: any) => Number(row.meters || 0).toFixed(3),
        id: 'meters',
      },
      {
        Header: 'Net Wt (lbs)',
        accessor: (row: any) => Number(row.netWeight || row.availableQty || 0).toFixed(3),
        id: 'netWeight',
      },
      {
        Header: 'Avg Wt',
        accessor: (row: any) => Number(row.avgWeight || 0).toFixed(6),
        id: 'avgWeight',
      },
    ];

    if (issueType === 'Piece') {
      cols.push({
        Header: 'Grade',
        accessor: 'gradeLabel',
        id: 'gradeLabel',
      });
    }

    return cols;
  }, [selectedPieces, issueType]);

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/transaction/processing-issue-management", { state: { activeTab: "processIssueFabric" } })}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">Fabric Dispatch for Dyeing</h2>
          </div>

         
        </div>
        <div className="space-y-6">
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('orderDetails')}
                  className={`py-4 px-6 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${activeTab === 'orderDetails'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 Inward Ordershover:border-gray-300'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  Details
                </button>
              </nav>
            </div>
          </div>
{/* Order Details Card */}
          {activeTab === "orderDetails" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">
                    <div>
                  <label className="block text-sm mb-1 font-medium">Fabric Dispatch No</label>
                  <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                    {...register('fabricDispatchId')} readOnly />
                </div>
                  <div>
                    <label className="block text-sm font-medium">Dispatch Date <span className="text-red-600">*</span></label>
                    <input
                      type="date"
                      {...register("fabricDispatchDate", { required: "Dispatch date is required" })}
                      className={`input mt-1 ${errors.fabricDispatchDate ? 'border-red-500' : ''}`}
                      placeholder="Select dispatch date"
                    />
                    <input type="hidden" {...register("fabricDispatchId")} />
                    {errors.fabricDispatchDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.fabricDispatchDate.message}</p>
                    )}
                  </div>
<div>
                    <label className="block text-sm font-medium">Processing Contract No<span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      placeholder="Select Processing Contract No"
                      value={watch("dyeingWorkOrderId") || ""}
                      options={fabricProcessContracts?.map((dyn: any) => ({
                        value: String(dyn.id),
                        label: dyn.dyeingWorkOrderNo,
                        activeFlag: dyn.activeFlag ?? true,
                      }))}
                      filterActive
                      {...register("dyeingWorkOrderId", { required: "Processing Contract No is required" })}
                      onValueChange={(value) => {
                        setValue("dyeingWorkOrderId", value, { shouldValidate: true });
                        const event = { target: { value } } as React.ChangeEvent<HTMLSelectElement>;
                        handleDyeingWorkOrderChange(event);
                      }}
                      error={errors.dyeingWorkOrderId?.message}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Vendor <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      placeholder="Select Vendor"
                      value={watch("vendorId") || ""}
                      options={processVendors?.map((vendor: any) => ({
                        value: String(vendor.id),
                        label: vendor.vendorName,
                        activeFlag: vendor.activeFlag ?? true,
                      }))}
                      filterActive
                      {...register("vendorId", { required: "Vendor is required" })}
                      onValueChange={(value) => setValue("vendorId", value, { shouldValidate: true })}
                      error={errors.vendorId?.message}
                    />
                  </div>

                  

                  {/* New Issue Type Field */}
                  <div>
                    <label className="block text-sm font-medium">Issue Type <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      placeholder="Select Issue Type"
                      value={watch("issueType") || ""}
                      options={[
                        { value: "Roll", label: "Roll" },
                        { value: "Piece", label: "Piece" }
                      ]}
                        filterActive
                      {...register("issueType", { required: "Issue Type is required" })}
                      onValueChange={(value) => setValue("issueType", value as 'Roll' | 'Piece', { shouldValidate: true })}
                      error={errors.issueType?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Order Quantity (lbs) <span className="text-red-600">*</span></label>
                    <input
                      type="number"
                      {...register("orderQuantity", {
                        required: "Quantity is required",
                        min: { value: 0.01, message: "Must be greater than 0" }
                      })}
                      className={`input mt-1 ${errors.orderQuantity ? 'border-red-500' : ''}`}
                      placeholder="Enter quantity in pounds"
                      step="0.01"
                    />
                    {errors.orderQuantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.orderQuantity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Rate/unit <span className="text-red-600">*</span></label>
                    <input
                      type="number"
                      {...register("costPerPound", {
                        required: "Cost is required",
                        min: { value: 0.01, message: "Must be greater than 0" }
                      })}
                      className={`input mt-1 ${errors.costPerPound ? 'border-red-500' : ''}`}
                      placeholder="Enter cost per pound"
                      step="0.01"
                    />
                    {errors.costPerPound && (
                      <p className="mt-1 text-sm text-red-600">{errors.costPerPound.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Total Amount <span className="text-red-600">*</span></label>
                    <input
                      type="number"
                      {...register("totalAmount", {
                        required: "Total amount is required",
                        min: { value: 0.01, message: "Must be greater than 0" }
                      })}
                      className={`input mt-1 ${errors.totalAmount ? 'border-red-500' : ''}`}
                      placeholder="Calculated total amount"
                      readOnly
                    />
                    {errors.totalAmount && (
                      <p className="mt-1 text-sm text-red-600">{errors.totalAmount.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Select Colour
                    </label>
                    <CommonSearchableSelect
                      placeholder="Select a Colour"
                      value={watch("colorId") || ""}
                      options={colours?.map((subCategory: any) => ({
                        value: String(subCategory.id),
                        label: subCategory.subCategoryName,
                        activeFlag: subCategory.activeFlag ?? true,
                      }))}
                      filterActive
                      {...register("colorId")}
                      onValueChange={(value) => setValue("colorId", value, { shouldValidate: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Pantone</label>
                    <input {...register("pantone")} className="input mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Finishing</label>
                    <CommonSearchableSelect
                      placeholder="Select a Dyeing Work No"
                      value={watch("finishingId") || ""}
                      options={processContractList?.map((jwn: any) => ({
                        value: String(jwn.id),
                        label: jwn.dyeingWorkOrderNo,
                        activeFlag: jwn.activeFlag ?? true,
                      }))}
                      filterActive
                      {...register("finishingId")}
                      onValueChange={(value) => setValue("finishingId", value, { shouldValidate: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Sales Order</label>
                    <CommonSearchableSelect
                      placeholder="Select sales Order"
                      value={watch("salesOrderId") || ""}
                      options={salesOrderList?.map((sm: any) => ({
                        value: String(sm.id),
                        label: sm.salesOrderNo,
                        activeFlag: sm.activeFlag ?? true,
                      }))}
                      filterActive
                      {...register("salesOrderId")}
                      onValueChange={(value) => setValue("salesOrderId", value, { shouldValidate: true })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Ship Via</label>
                    <CommonSearchableSelect
                      placeholder="Select a Ship Via"
                      value={watch("shipmentModeId") || ""}
                      options={shipmentModesList?.map((sm: any) => ({
                        value: String(sm.id),
                        label: sm.modeName,
                        activeFlag: sm.activeFlag ?? true,
                      }))}
                      filterActive
                      {...register("shipmentModeId")}
                      onValueChange={(value) => setValue("shipmentModeId", value, { shouldValidate: true })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium">Lot Number <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      {...register("lotNumber", { required: "Lot Number is required" })}
                      className={`input mt-1 ${errors.lotNumber ? 'border-red-500' : ''}`}
                      placeholder="Enter lot number"
                    />
                    {errors.lotNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.lotNumber.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Instructions</label>
                    <textarea {...register("remarks")} className="input mt-1"></textarea>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
{/* Order Details Card End */}
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Dispatch Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Finished Fabric Code</label>
                    <input
                      value={dispatchDetails.finishedFabricCode}
                      className="input mt-1"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Finished Fabric Name</label>
                    <input
                      value={dispatchDetails.finishedFabricName}
                      className="input mt-1"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Greige Fabric Code</label>
                    <input
                      value={dispatchDetails.greigeFabricCode}
                      className="input mt-1"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Greige Fabric Name</label>
                    <input
                      value={dispatchDetails.greigeFabricName}
                      className="input mt-1"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Order Quantity</label>
                    <input
                      value={dispatchDetails.orderQuantity}
                      className="input mt-1"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Dispatched Quantity</label>
                    <input
                      value={dispatchDetails.dispatchedQuantity}
                      className="input mt-1"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Received Quantity</label>
                    <input
                      value={dispatchDetails.receivedQuantity}
                      className="input mt-1"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Balance Quantity</label>
                    <input
                      value={dispatchDetails.balanceQuantity}
                      className="input mt-1"
                      readOnly
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <Button
                    onClick={openPieceDialog}
                    className="bg-primary hover:bg-primary text-white"
                  // disabled={!selectedDyeingWorkOrder}
                  >
                    <Plus size={18} className="mr-2" />
                    Select Piece/Roll
                  </Button>

                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Fabric Issue Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Display Fabric Info Above Table */}
                {currentFabricCodeStr && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p><strong>Greige Fabric Code:</strong> {dispatchDetails.greigeFabricCode || dispatchDetails.finishedFabricCode}</p>
                    <p><strong>Greige Fabric Name:</strong> {dispatchDetails.greigeFabricName || dispatchDetails.finishedFabricName}</p>
                  </div>
                )}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">{issueType || 'Issue'} No</th>
                      <th className="border p-2">Meters</th>
                      <th className="border p-2">Net Wt (lbs)</th>
                      <th className="border p-2">Avg Wt</th>
                      {issueType == "Piece" && <th className="border p-2">Grade</th>}
                      {/* <th className="border p-2">Available Qty</th>
                      <th className="border p-2">Issue Qty</th> */}
                      <th className="border p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPieces.length > 0 ? (
                      selectedPieces.map((detail: any, index: any) => (
                        <tr key={index}>
                          <td className="border p-2 text-center">{detail.pieceNo}</td>
                          <td className="border p-2 text-center">{Number(detail.meters || 0).toFixed(3)}</td>
                          <td className="border p-2 text-center">{Number(detail.netWeight || detail.availableQty || 0).toFixed(3)}</td>
                          <td className="border p-2 text-center">{Number(detail.avgWeight || 0).toFixed(6)}</td>
                          {issueType == "Piece" && (<td className="border p-2 text-center">{detail.gradeLabel || ''}</td>)}
                          {/* <td className="border p-2">{Number(detail.availableQty || 0).toFixed(3)}</td>
                          <td className="border p-2">
                            <Input
                              type="number"
                              value={detail.issueQty ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                const newDetails = [...selectedPieces];
                                newDetails[index].issueQty = value;
                                setSelectedPieces(newDetails);
                              }}
                              min={0}
                              max={detail.availableQty}
                              step="0.01"
                            />
                          </td> */}
                          <td className="border p-2 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedPieces(selectedPieces.filter((_: any, i: any) => i !== index));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="border p-2 text-center text-gray-500">
                          No pieces/rolls selected. Click "Select Piece/Roll" to add.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
              <div className="p-6 flex justify-end">
                <Button
                  variant="default"
                  className="bg-primary hover:bg-primary text-white"
                  onClick={() => {
                    const totalIssueQty = selectedPieces.reduce((sum: number, piece: any) => sum + (piece.issueQty ? Number(piece.issueQty) : 0), 0);
                    setValue("dispatchedQuantity" as any, String(totalIssueQty) as any);
                    const balance = String((Number(dispatchDetails.orderQuantity) || 0) - totalIssueQty);
                    setValue("balanceQuantity" as any, balance as any);
                    setDispatchDetails(prev => ({
                      ...prev,
                      dispatchedQuantity: String(totalIssueQty),
                      balanceQuantity: balance,
                    }));
                  }}
                >
                  Save Pieces
                </Button>
              </div>
            </Card>

            {/* Piece Dialog - Adapted from BaleRollPacking */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Select {issueType || 'Pieces/Rolls'}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                  <PopupDataTable
                    columns={pieceColumns}
                    data={availablePieces}
                    emptyMessage={
                      availablePieces.length === 0
                        ? `No ${issueType || 'pieces/rolls'} available.`
                        : `No matching ${issueType || 'pieces/rolls'} found.`
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsDialogOpen(false)}>
                    Confirm Selection
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
       <Button
            disabled={!isFormValid || !selectedPieces || selectedPieces.length === 0 || isSubmitting}
            className={`bg-primary hover:bg-primary text-white px-6 flex items-center`}
            onClick={handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {processingIssueDtl?.id ? "Update Fabric Dispatch" : "Save Fabric Dispatch"}
              </>
            )}
          </Button>
          </div>
    </div>
    
  );
}