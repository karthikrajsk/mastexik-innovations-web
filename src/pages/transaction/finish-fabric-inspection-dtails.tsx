import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { getAllFabricInspection } from "@/state/fabricInspectionsSlice";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import { getAllJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
import { getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
import { getAllFinishFabricReceive } from "@/state/finishFabricReceiveSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllGrandMaster } from "@/state/gradeMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllVendors } from "@/state/vendorSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FabricBarcodePiece, getFabricBarcodeLink } from "@/lib/barcode";
import { getPiecesAvailableForBrushingInspection } from "@/state/brushingSlice";

export function FinishFabricInspectionDetails() {
  const { fabricInspectionList } = useSelector((state: RootState) => state.fabricInspections);
  const { purchaseInwardList } = useSelector((state: RootState) => state.purchaseInward);
  const { jobworkFabricReceiveList } = useSelector((state: RootState) => state.JobworkFabricReceive);
  const { purchaseOrderList } = useSelector((state: RootState) => state.purchaseOrder);
  const { finishFabricReceiveList } = useSelector((state: RootState) => state.finishFabricReceive);
  const { availableInspectionPieces } = useSelector((state: RootState) => state.brushing);
  const [inspectionList, setInspectionList] = useState<any[]>(fabricInspectionList);
  const { vendorList } = useSelector((state: RootState) => state.vendor)
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any)
  const { gradeList } = useSelector((state: RootState) => state.grade)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentInspection, setCurrentInspection] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const location = useLocation();
  const locationState = (location.state as any) ?? {};
  const getDesiredStatus = () => {
    const fromState = locationState.inspectionStatus ?? locationState.returnStatus;
    return fromState === 'completed' ? 'completed' : 'pending';
  };
  const [inspectionStatus, setInspectionStatus] = useState<'pending' | 'completed'>(getDesiredStatus());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);
  useEffect(() => {
    const desired = locationState.inspectionStatus ?? locationState.returnStatus;
    if (desired === 'completed' || desired === 'pending') {
      setInspectionStatus(desired);
    }
  }, [locationState.inspectionStatus, locationState.returnStatus]);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const selectedCompanyId = useMemo(() => {
    const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return stored ? Number(stored) : undefined;
  }, []);

  useEffect(() => {
    const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const companyId = v ? Number(v) : undefined;
    dispatch(getAllFabricInspection({ companyId, fabricTypeId: 2 } as any));
    dispatch(getAllVendors({}));
    dispatch(getAllFabricMasters({} as any));
    dispatch(getAllGrandMaster({}));
    dispatch(getAllPurchaseInwards(companyId ? { companyId, fabricTypeId: 2 } : { fabricTypeId: 2 }));
    dispatch(getAllJobworkFabricReceive(companyId ? { companyId, fabricTypeId: 2 } : { fabricTypeId: 2 }));
    dispatch(getAllFinishFabricReceive(companyId ? { companyId, fabricTypeId: 2 } : { fabricTypeId: 2 }));
    dispatch(getAllPurchaseOrders({}));
    if (companyId) {
      dispatch(getPiecesAvailableForBrushingInspection(companyId));
    }
  }, [dispatch]);

  const vendorMap = useMemo(() => {
    return vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
      acc[vendor.id] = vendor.vendorName;
      return acc;
    }, {}) || {};
  }, [vendorList]);

  const fabricMasterData = useMemo(() => {
    const raw = fabricMasterList as any;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [fabricMasterList]);

  const fabricMasterMap = useMemo(() => {
    const map: Record<string, any> = {};
    fabricMasterData.forEach((master: any) => {
      const masterId = master?.id ?? master?.fabricMasterId;
      if (masterId != null) {
        map[String(masterId)] = master;
      }
    });
    return map;
  }, [fabricMasterData]);

  const gradeArray = useMemo(() => {
    if (Array.isArray(gradeList)) return gradeList;
    if (Array.isArray((gradeList as any)?.data)) return (gradeList as any).data;
    return [];
  }, [gradeList]);

  const gradeMap = useMemo(() => {
    const map = new Map<string, string>();
    gradeArray.forEach((grade: any) => {
      const id = grade?.id ?? grade?.gradeId ?? grade?.grade_id;
      const name = (grade?.gradeName ?? grade?.grade_name ?? grade?.gradeCode ?? grade?.grade_code ?? '')
        .toString()
        .trim();
      if (id != null && name) {
        map.set(String(id), name);
      }
    });
    return map;
  }, [gradeArray]);

  const resolveFabricCodeAndQuality = (piece: any, item: any, receive: any) => {
    const masterId =
      piece?.fabricMasterId ??
      piece?.fabric_master_id ??
      item?.fabricMasterId ??
      item?.fabric_master_id ??
      piece?.fabricMaster?.id ??
      piece?.fabricMaster?.fabricMasterId ??
      item?.fabricMaster?.id ??
      item?.fabricMaster?.fabricMasterId;
    const masterRecord = masterId != null ? fabricMasterMap[String(masterId)] : undefined;
    const masterCode =
      masterRecord?.fabricCode ??
      masterRecord?.fabric_code ??
      masterRecord?.code ??
      masterRecord?.fabricName ??
      masterRecord?.fabric_name;
    const masterQuality =
      masterRecord?.fabricQuality ??
      masterRecord?.quality ??
      masterRecord?.fabricName ??
      masterRecord?.fabric_quality;
    const fallbackCode = receive?.fabricCode || receive?.finishedFabricCode || item?.fabricCode || piece?.fabricCode;
    const fallbackQuality =
      item?.fabricQuality ??
      item?.quality ??
      receive?.quality ??
      receive?.finishedFabricName ??
      piece?.fabricQuality;

    return {
      fabricCode: masterCode || fallbackCode || '-',
      fabricQuality: masterQuality || (fallbackQuality != null ? String(fallbackQuality) : undefined) || '-'
    };
  };

  const getPrimaryInspectionDetail = (record: any) => {
    const details = record.inspectionDetails ?? record.inspection_details;
    if (Array.isArray(details) && details.length > 0) {
      return details[0];
    }
    if (details && typeof details === "object") {
      return details;
    }
    return undefined;
  };

  const formatAvgWeightValue = (value: any) => {
    if (value == null || value === "") {
      return undefined;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return undefined;
    }
    return numeric.toFixed(3);
  };

  const resolveInspectionGrade = (record: any) => {
    const detail = getPrimaryInspectionDetail(record);
    const gradeIdValue =
      record.gradeId ??
      record.grade_id ??
      detail?.gradeId ??
      detail?.grade_id ??
      record.rawData?.gradeId ??
      record.rawData?.grade_id;
    if (gradeIdValue != null) {
      const mapped = gradeMap.get(String(gradeIdValue));
      if (mapped) return mapped;
    }
    const fallbackGrade = [
      record.grade,
      record.fabricGrade,
      record.fabric_grade,
      record.rawData?.grade,
      record.rawData?.fabricGrade,
      detail?.grade,
      detail?.fabricGrade,
      detail?.gradeName,
      detail?.grade_name,
    ].find((value) => value != null && value !== "");
    if (fallbackGrade) {
      return String(fallbackGrade);
    }
    return "";
  };

  const resolveInspectionAvgWeight = (record: any) => {
    const detail = getPrimaryInspectionDetail(record);
    const candidates = [
      record.avgWeight ?? record.avg_weight,
      record.rawData?.avgWeight ?? record.rawData?.avg_weight,
      detail?.avgWeight ?? detail?.avg_weight,
    ];
    for (const candidate of candidates) {
      const formatted = formatAvgWeightValue(candidate);
      if (formatted != null) return formatted;
    }
    const netWeightValue =
      record.netWeight ??
      record.net_weight ??
      detail?.actualNetWeight ??
      detail?.actual_net_weight;
    const meterValue =
      record.pieceMeters ??
      record.piece_meters ??
      detail?.inspectedMeters ??
      detail?.inspected_meters;
    const numericNet = Number(netWeightValue);
    const numericMeter = Number(meterValue);
    if (Number.isFinite(numericNet) && Number.isFinite(numericMeter) && numericMeter !== 0) {
      return (numericNet / numericMeter).toFixed(3);
    }
    return undefined;
  };

  // const finishFabricRows = useMemo(() => {
  //   const rows: any[] = [];
  //   (finishFabricReceiveList || []).forEach((receive: any) => {
  //     const itemsArray = receive.items || receive.finishFabricReceiveItemsDtl || [];
  //     if (!Array.isArray(itemsArray)) return;
  //     itemsArray.forEach((item: any) => {
  //       const pieceArray = item.pieceEntries || item.pieces || [];
  //       if (Array.isArray(pieceArray) && pieceArray.length > 0) {
  //         pieceArray.forEach((piece: any) => {
  //           const isInspected = Number(piece.isInspected ?? piece.is_inspected ?? 0);
  //           const isFactoryFabric = Number(piece.isFactoryFabric ?? piece.isFactoryFabricFlag ?? piece.is_factory_fabric ?? 0);
  //           const fabricTypeId = Number(piece.fabricTypeId ?? piece.fabric_type_id ?? 2);
  //           if (isFactoryFabric !== 0 || fabricTypeId !== 2) return;
  //           const fabricCode = receive.fabricCode || receive.finishedFabricCode || item?.fabricCode || '-';
  //           const fabricQuality = receive.quality || receive.finishedFabricName || item?.quality || '-';
  //           rows.push({
  //             id: `FF-${receive.id}-${piece.pieceNumber}`,
  //             sourceType: piece.sourceType || item.sourceType || receive.sourceType || receive.processType || 'Finish Fabric',
  //             sourceId: receive.id,
  //             inwardDate: receive.receiveDate || receive.finishFabricReceiveDate || receive.fabricReceiveDate,
  //             orderNo: receive.contractNo || receive.processContractNo || receive.dyeingWorkOrderNo || '-',
  //             pieceNo: piece.pieceNumber,
  //             fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
  //             fabricCode,
  //             fabricQuality,
  //             vendorId: receive.vendorId,
  //             vendorName: receive.vendorId ? vendorMap[receive.vendorId] || '-' : '--',
  //             isPacked: piece.isPacked ?? 0,
  //             pieceMeters: piece.meters ?? piece.meter ?? 0,
  //             netWeight: piece.netWeight ?? piece.net_weight ?? 0,
  //             inspectionDate: receive.receiveDate || receive.finishFabricReceiveDate || receive.fabricReceiveDate,
  //             isInspected,
  //             rawData: {
  //               ...receive,
  //               selectedPieces: [{ ...piece }],
  //               selectedItem: item,
  //               items: itemsArray,
  //               fabricCode,
  //               quality: fabricQuality
  //             }
  //           });
  //         });
  //       } else if (item.pieceRollNo || item.pieceNo) {
  //         const isInspected = Number(item.isInspected ?? item.is_inspected ?? 0);
  //         const isFactoryFabric = Number(item.isFactoryFabric ?? item.isFactoryFabricFlag ?? item.is_factory_fabric ?? 0);
  //         const fabricTypeId = Number(item.fabricTypeId ?? item.fabric_type_id ?? 2);
  //         if (isFactoryFabric !== 0 || fabricTypeId !== 2) return;
  //         const [fabricCode, fabricQuality] = (item.finishedFabricCodeQuality || '-').split(' - ');
  //         rows.push({
  //           id: `FF-${receive.id}-${item.pieceRollNo || item.pieceNo}`,
  //           sourceType: 'Process Receive',
  //           sourceId: receive.id,
  //           inwardDate: receive.receiveDate || receive.finishFabricReceiveDate || receive.fabricReceiveDate,
  //           orderNo: receive.contractNo || receive.processContractNo || receive.dyeingWorkOrderNo || '-',
  //           pieceNo: item.pieceRollNo || item.pieceNo,
  //           fabricCodeQuality: item.finishedFabricCodeQuality || '-',
  //           fabricCode: fabricCode || '-',
  //           fabricQuality: fabricQuality || '-',
  //           vendorId: receive.vendorId,
  //           vendorName: receive.vendorId ? vendorMap[receive.vendorId] || '-' : '--',
  //           isPacked: item.isPacked ?? 0,
  //           pieceMeters: item.meter ?? item.meters ?? 0,
  //           netWeight: item.netWeight ?? item.net_weight ?? 0,
  //           inspectionDate: receive.receiveDate || receive.finishFabricReceiveDate || receive.fabricReceiveDate,
  //           isInspected,
  //           rawData: {
  //             ...receive,
  //             selectedPieces: [{ ...item, pieceNumber: item.pieceRollNo || item.pieceNo }],
  //             selectedItem: item,
  //             items: itemsArray,
  //             fabricCode: fabricCode || '-',
  //             quality: fabricQuality || '-'
  //           }
  //         });
  //       }
  //     });
  //   });
  //   return rows;
  // }, [finishFabricReceiveList, vendorMap]);

  const normalizedFabricInspections = useMemo(() => {
    if (Array.isArray(fabricInspectionList)) return fabricInspectionList;
    if (Array.isArray((fabricInspectionList as any)?.data)) return (fabricInspectionList as any).data;
    return [];
  }, [fabricInspectionList]);

  const finishPIInspectionLookup = useMemo(() => {
    const map = new Map<string, any>();
    normalizedFabricInspections.forEach((inspection: any) => {
      const piId = inspection.purchaseInwardId ?? inspection.purchase_inward_id;
      const pieceNo = String(inspection.pieceNo ?? inspection.piece_no ?? '').trim().toLowerCase();
      if (piId && pieceNo) {
        map.set(`${piId}:${pieceNo}`, inspection);
      }
    });
    return map;
  }, [normalizedFabricInspections]);

  const finishReceiveInspectionLookup = useMemo(() => {
    const map = new Map<string, any>();
    normalizedFabricInspections.forEach((inspection: any) => {
      const pieceNo = String(inspection.pieceNo ?? inspection.piece_no ?? '').trim().toLowerCase();
      const pieceEntryId = inspection.pieceEntryId ?? inspection.piece_entry_id;
      if (pieceNo) {
        map.set(`PIECE:${pieceNo}`, inspection);
      }
      if (pieceEntryId != null) {
        map.set(`ENTRY:${pieceEntryId}`, inspection);
      }
    });
    return map;
  }, [normalizedFabricInspections]);

  const pendingData = useMemo(() => {
    const purchaseInwardData = (purchaseInwardList || [])
      .filter((inward: any) => inward.poTypeId === 2)
      .flatMap((inward: any) => {
        const itemsArray = inward.items || inward.purchaseInwardItemsDtl || [];
        if (!Array.isArray(itemsArray)) return [];
        const rows: any[] = [];
        itemsArray.forEach((item: any) => {
          const pieceArray = item.pieceEntries || item.pieces || [];
          if (Array.isArray(pieceArray)) {
            pieceArray.forEach((piece: any) => {
              const isInspected = piece.isInspected ?? 0;
              const isFactoryFabric = Number(piece.isFactoryFabric ?? piece.isFactoryFabricFlag ?? 0);
              const fabricTypeId = Number(piece.fabricTypeId ?? piece.fabric_type_id ?? 2);
              if (isInspected === 0 && isFactoryFabric === 0 && fabricTypeId === 2) {
                const { fabricCode, fabricQuality } = resolveFabricCodeAndQuality(piece, item, inward);
                const pieceNumber = String(piece.pieceNumber || '').trim().toLowerCase();
                const existingPIInspection = finishPIInspectionLookup.get(`${inward.id}:${pieceNumber}`);
                const existingInspectionId = existingPIInspection?.id ?? null;
                rows.push({
                  id: `PI-${inward.id}-${piece.pieceNumber}`,
                  sourceType: 'Purchase Inward',
                  sourceId: inward.id,
                  inwardDate: inward.inwardDate,
                  orderNo: inward.purchaseOrderNo || `PO #${inward.purchaseOrderId}`, 
                  pieceNo: piece.pieceNumber,
                  fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
                  fabricCode,
                  fabricQuality,
                  vendorId: inward.vendorId,
                  vendorName: inward.vendorId ? vendorMap[inward.vendorId] || '-' : '--',
                  isPacked: piece.isPacked ?? 0,
                  rawData: {
                    ...inward,
                    ...(existingPIInspection ?? {}),
                    fabricInspectionId: existingInspectionId,
                    id: existingInspectionId,
                    purchaseInwardId: inward.id,
                    selectedPieces: [{ ...piece }],
                    selectedItem: item,
                    items: itemsArray,
                    fabricCode
                  }
                });
              }
            });
          }
        });
        return rows;
      });

      const finishData = (finishFabricReceiveList || [])
      .filter((receive: any) => receive.processType === "FABRIC")
      .flatMap((receive: any) => {
        const itemsArray = receive.items || receive.finishFabricReceiveItemsDtl || [];
        if (!Array.isArray(itemsArray)) return [];
        const rows: any[] = [];
        itemsArray.forEach((item: any) => {
          const pieceArray = item.pieceEntries || item.pieces || [];
          if (Array.isArray(pieceArray)) {
            pieceArray.forEach((piece: any) => {
              const isInspected = piece.isInspected ?? 0;
              const isFactoryFabric = Number(piece.isFactoryFabric ?? piece.isFactoryFabricFlag ?? 0);
              const fabricTypeId = Number(piece.fabricTypeId ?? piece.fabric_type_id ?? 2);
              if (isInspected === 0 && isFactoryFabric === 0 && fabricTypeId === 2) {
                const { fabricCode, fabricQuality } = resolveFabricCodeAndQuality(piece, item, receive);
                const pieceNumber = String(piece.pieceNumber || '').trim().toLowerCase();
                const existingFFInspection = finishReceiveInspectionLookup.get(`ENTRY:${piece.id}`) || finishReceiveInspectionLookup.get(`PIECE:${pieceNumber}`);
                const existingFFInspectionId = existingFFInspection?.id ?? null;
                rows.push({
                  id: `PR-${receive.id}-${piece.pieceNumber}`,
                  sourceType: 'Process Receive',
                  sourceId: receive.id,
                  inwardDate: receive.fabricReceiveDate || receive.finishFabricReceiveDate || receive.fabricReceiveDate,
                  orderNo: receive.contractNo || receive.processContractNo || receive.dyeingWorkOrderNo || '-',
                  pieceNo: piece.pieceNumber,
                  fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
                  fabricCode,
                  fabricQuality,
                  vendorId: receive.vendorId,
                  vendorName: receive.vendorId ? vendorMap[receive.vendorId] || '-' : '--',
                  isPacked: piece.isPacked ?? 0,
                  rawData: {
                    ...receive,
                    ...(existingFFInspection ?? {}),
                    fabricInspectionId: existingFFInspectionId,
                    id: existingFFInspectionId,
                    selectedPieces: [{ ...piece }],
                    selectedItem: item,
                    items: itemsArray,
                    fabricCode,
                    quality: fabricQuality
                  }
                });
              }
            });
          }
        });
        return rows;
      });

      const brushedData = (availableInspectionPieces || [])
      .filter((piece: any) => Number(piece.isInspected ?? 0) === 0)
      .map((piece: any) => {
        const { fabricCode, fabricQuality } = resolveFabricCodeAndQuality(piece, null, null);
        const pieceNumber = String(piece.pieceNumber || '').trim().toLowerCase();
        const existingInspection = finishReceiveInspectionLookup.get(`ENTRY:${piece.id}`) || finishReceiveInspectionLookup.get(`PIECE:${pieceNumber}`);
        const existingInspectionId = existingInspection?.id ?? null;
        
        return {
          id: `BR-${piece.brushingReceiveId}-${piece.pieceNumber}`,
          sourceType: 'Brushed Fabric',
          sourceId: piece.brushingReceiveId,
          inwardDate: piece.inwardDate || new Date().toISOString().split('T')[0],
          orderNo: piece.orderNo || '-',
          pieceNo: piece.pieceNumber,
          fabricCodeQuality: `${fabricCode} - ${fabricQuality}`,
          fabricCode,
          fabricQuality,
          vendorId: null,
          vendorName: '-',
          isPacked: piece.isPacked ?? 0,
          rawData: {
            ...piece,
            fabricInspectionId: existingInspectionId,
            id: existingInspectionId,
            selectedPieces: [{ 
              ...piece, 
              quantity: piece.brushedMeters || piece.quantity, 
              weight: piece.brushedWeight || piece.weight,
              meters: piece.brushedMeters || piece.quantity, 
              netWeight: piece.brushedWeight || piece.weight 
            }],
            selectedItem: null,
            items: [],
            fabricCode,
            quality: fabricQuality,
            brushingReceiveId: piece.brushingReceiveId
          }
        };
      });

    // const finishFabricPendingRows = finishFabricRows.filter((row: any) => Number(row.isInspected ?? 0) === 0);

    const combined = [...purchaseInwardData, ...finishData, ...brushedData];
    const sortedData = [...combined].sort((a: any, b: any) => {
      const aId = typeof a.id === 'string' ? parseInt(a.id.split('-')[1]) : a.id;
      const bId = typeof b.id === 'string' ? parseInt(b.id.split('-')[1]) : b.id;
      return (bId || 0) - (aId || 0);
    });

    return sortedData.map((item: any, index: number) => ({ ...item, siNo: index + 1 }));
  }, [purchaseInwardList, finishFabricReceiveList, fabricMasterMap, vendorMap, finishPIInspectionLookup, finishReceiveInspectionLookup]);

  const completedData = useMemo(() => {
    const raw = Array.isArray(fabricInspectionList)
      ? fabricInspectionList
      : (fabricInspectionList && Array.isArray((fabricInspectionList as any)?.data)
          ? (fabricInspectionList as any).data
          : []);

    const entries = (raw || [])
      .filter((inspection: any) => {
        const isFactoryFabric = Number(inspection.isFactoryFabric ?? inspection.is_factory_fabric ?? 0);
        const fabricTypeId = Number(inspection.fabricTypeId ?? inspection.fabric_type_id ?? 2);
        const hasDetails = inspection.inspectionDetails && inspection.inspectionDetails.length > 0;
        const isInspected = Number(inspection.isInspected ?? inspection.is_inspected ?? 0) === 1;
        return hasDetails && isFactoryFabric === 0 && fabricTypeId === 2 && isInspected;
      })
      .map((inspection: any, index: number) => {
        const fabricInspectionId = inspection.fabricInspectionId || inspection.fabric_inspection_id || inspection.inspectionId || inspection.inspection_id || inspection.id;
        const pieceEntryId = inspection.pieceEntryId || inspection.piece_entry_id || (inspection.pieceEntries && inspection.pieceEntries[0]?.id);

        const updatedDetails = (inspection.inspectionDetails || []).map((d: any) => ({
          ...d,
          pieceEntryId: pieceEntryId || d.pieceEntryId || d.piece_entry_id
        }));

        return {
          ...inspection,
          id: fabricInspectionId,
          pieceEntryId: pieceEntryId,
          vendorName: inspection.vendorId ? vendorMap[inspection.vendorId] || '-' : '--',
          siNo: index + 1,
          fabricCode: inspection.fabricCode || inspection.fabric_code || '-',
          fabricQuality: inspection.fabricQuality || inspection.quality || inspection.finishedFabricName || '-',
          pieceMeters: inspection.pieceMeters || inspection.piece_meters || '-',
          netWeight: inspection.netWeight || inspection.net_weight || '-',
          inspectionDetails: updatedDetails
        };
      });

    const sortedData = [...entries].sort((a: any, b: any) => {
      const aId = typeof a.id === 'string' ? parseInt(a.id.split('-')[1]) : a.id;
      const bId = typeof b.id === 'string' ? parseInt(b.id.split('-')[1]) : b.id;
      return (bId || 0) - (aId || 0);
    });

    return sortedData.map((item: any, index: number) => ({ ...item, siNo: index + 1 }));
  }, [fabricInspectionList, vendorMap]);

  const pendingColumns = useMemo(
    () => [
      {
        Header: 'SI NO',
        accessor: 'siNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: "Source Type",
        accessor: "sourceType",
        Cell: ({ value }: { value: string }) => (
          <span className={`px-2 py-1 rounded-full text-xs ${
            value === 'Purchase Inward' ? 'bg-blue-100 text-blue-800' :
            value === 'Brushed Fabric' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
            'bg-purple-100 text-purple-800'
          }`}>
            {value}
          </span>
        )
      },
      {
        Header: "Inward Date",
        accessor: "inwardDate",
        Cell: ({ value }: { value: string }) => formatDate(value),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            const date = new Date(dateStr);
            if (filterValue.from) {
              const fromDate = new Date(filterValue.from);
              if (date < fromDate) return false;
            }
            if (filterValue.to) {
              const toDate = new Date(filterValue.to);
              if (date > toDate) return false;
            }
            return true;
          });
        }
      },
      {
        Header: "Purchase/Weaving Order No",
        accessor: "orderNo",
        width: 150
      },
      {
        Header: "Piece No",
        accessor: "pieceNo"
      },
      {
        Header: "Sort No - Construction",
        accessor: "fabricCodeQuality"
      },
      {
        Header: 'Vendor',
        accessor: 'vendorName'
      },
      {
        Header: "Actions",
        accessor: "actions",
        disableFilters: true,
        width: 'auto',
        Cell: ({ row }: any) => {
          const data = row.original || row;
          const isPacked = Number(data.isPacked ?? 0) === 1;
          
          if (isPacked) {
            return (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Packed
              </span>
            );
          }
          
          return (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(row)}
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleInspect(row)}
                title="Inspect"
              >
                <ClipboardCheck className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const completedColumns = useMemo(
    () => [
      {
        Header: 'SI NO',
        accessor: 'siNo',
        width: 50,
        disableFilters: true,
      },
      {
        Header: "Inspection Date",
        accessor: "inspectionDate",
        Cell: ({ value }: { value: string }) => formatDate(value),
        Filter: DateRangeFilter,
        filter: (rows: any[], columnIds: string[], filterValue: any) => {
          if (!filterValue || (!filterValue.from && !filterValue.to)) return rows;
          return rows.filter(row => {
            const dateStr = row.values[columnIds[0]];
            const date = new Date(dateStr);
            if (filterValue.from) {
              const fromDate = new Date(filterValue.from);
              if (date < fromDate) return false;
            }
            if (filterValue.to) {
              const toDate = new Date(filterValue.to);
              if (date > toDate) return false;
            }
            return true;
          });
        }
      },
      {
        Header: "Piece No",
        accessor: "pieceNo"
      },
      {
        Header: "Sort No",
        accessor: "fabricCode"
      },
      {
        Header: "Construction",
        accessor: "fabricQuality"
      },
      {
        Header: "Vendor",
        accessor: "vendorName"
      },
      {
        Header: "Piece Meters",
        accessor: "pieceMeters"
      },
      {
        Header: "Net Weight",
        accessor: "netWeight"
      },
      {
        Header: "Barcode",
        accessor: "barcodeLink",
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const record = row.original || row;
          const barcodeValue = record.pieceNo || record.piece_number;
          if (!barcodeValue) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          const meter = record.pieceMeters ?? record.piece_meters;
          const netWeight =
            record.netWeight ??
            record.net_weight ??
            record.rawData?.netWeight ??
            record.rawData?.net_weight;
          const netWeightDisplay = netWeight != null ? netWeight : '--';
          const grade = resolveInspectionGrade(record);
          const avgWeight = resolveInspectionAvgWeight(record);
          const companyId =
            record.companyId ??
            record.rawData?.companyId ??
            record.rawData?.company_id ??
            selectedCompanyId;
          const link = getFabricBarcodeLink({
            barcode: barcodeValue,
            fabricCode: record.fabricCode || record.fabric_code || '',
            fabricQuality: record.fabricQuality || record.fabric_quality || '',
            grade: grade || undefined,
            meter,
            netWeight,
            avgWeight,
            companyId,
          });

          if (!link) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          return (
            <div className="flex flex-col">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                Barcode
              </a>
            </div>
          );
        }
      },
    ],
    [selectedCompanyId, resolveInspectionGrade, resolveInspectionAvgWeight]
  );

  const extractPieceEntriesForRow = useCallback((record: any): FabricBarcodePiece[] => {
    const barcodeValue = record.pieceNo || record.piece_number;
    if (!barcodeValue) return [];
    const grade = resolveInspectionGrade(record);
    const avgWeight = resolveInspectionAvgWeight(record);
    return [{
      barcode: barcodeValue,
      fabricCode: record.fabricCode || record.fabric_code || '',
      fabricQuality: record.fabricQuality || record.fabric_quality || '',
      grade: grade || undefined,
      meter: record.pieceMeters ?? record.piece_meters,
      netWeight: record.netWeight ?? record.net_weight ?? undefined,
      avgWeight: avgWeight ?? undefined,
    }];
  }, [resolveInspectionGrade, resolveInspectionAvgWeight]);

  const handleToggleRow = useCallback((id: any) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean, data: any[]) => {
    setSelectedIds(checked ? new Set(data.map((r: any) => r.id)) : new Set());
  }, []);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleCancelSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const totalBarcodeCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      const row = completedData.find((r: any) => r.id === id);
      if (row) count += extractPieceEntriesForRow(row).length;
    }
    return count;
  }, [selectedIds, completedData, extractPieceEntriesForRow]);

  const handleOpenBarcodeStickerPage = useCallback(() => {
    const allEntries: FabricBarcodePiece[] = [];
    for (const id of selectedIds) {
      const row = completedData.find((r: any) => r.id === id);
      if (row) allEntries.push(...extractPieceEntriesForRow(row));
    }
    if (!allEntries.length) return;
    const link = getFabricBarcodeLink({ barcode: allEntries[0].barcode, pieceEntries: allEntries, companyId: selectedCompanyId });
    if (link) window.open(link, '_blank');
    setIsBulkPrintModalOpen(false);
  }, [selectedIds, completedData, extractPieceEntriesForRow, selectedCompanyId]);

  const checkboxColumn = useMemo(() => ({
    id: 'bulkSelect',
    Header: (
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={completedData.length > 0 && selectedIds.size === completedData.length}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked, completedData)}
          className="w-3.5 h-3.5 cursor-pointer accent-black"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
        <span className="text-xs font-semibold">All</span>
      </div>
    ),
    accessor: 'id',
    disableFilters: true,
    width: 60,
    Cell: ({ row }: { row: any }) => {
      const id = row.original.id;
      return (
        <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <input type="checkbox" checked={selectedIds.has(id)} onChange={() => handleToggleRow(id)} className="w-3.5 h-3.5 cursor-pointer accent-black" />
        </div>
      );
    }
  }), [completedData, selectedIds, handleSelectAll, handleToggleRow]);

  const activeCompletedColumns = useMemo(() => {
    if (!selectMode) return completedColumns;
    const filtered = completedColumns.filter((c: any) => c.accessor !== 'barcodeLink');
    const actionsIdx = filtered.findIndex((c: any) => c.accessor === 'actions' || c.id === 'actions');
    if (actionsIdx >= 0) return [...filtered.slice(0, actionsIdx), checkboxColumn, ...filtered.slice(actionsIdx)];
    return [...filtered, checkboxColumn];
  }, [selectMode, completedColumns, checkboxColumn]);

  const handleView = (row: any) => {
    const inspectionData = row.original || row;
    setCurrentInspection(inspectionData);
    setIsViewModalOpen(true);
  };

  // const handleAdd = () => {
  //   setModalMode('add');
  //   setCurrentInspection(null);
  //   navigate("/transaction/fabric-inspection");
  // };

  // const handleInspect = (row: any) => {
  //   const sourceData = row.original || row;
  //   const payload = sourceData.rawData || sourceData;
  //   navigate("/transaction/fabric-inspection", {
  //     state: {
  //       purchaseInward: payload,
  //       mode: 'add'
  //     }
  //   });
  // };

  const handleInspect = (row: any) => {
    const record = row.original || row;
    const existingInspectionId = record.rawData?.fabricInspectionId ?? null;
    const fabricInspDtl = existingInspectionId
      ? { ...record, ...record.rawData, fabricInspectionId: existingInspectionId, id: existingInspectionId }
      : record;
    navigate("/transaction/finish-fabric-inspection", {
      state: { 
        fabricInspDtl,
        sourceData: record.rawData,
        sourceType: record.sourceType,
        mode: existingInspectionId ? 'edit' : 'add',
        returnTab: 'finish',
        returnStatus: 'pending'
      }
    });
  };

  // const handleEdit = (fabricInspDtl: any) => {
  //   setModalMode('edit');
  //   setCurrentInspection(fabricInspDtl);
  //   setIsModalOpen(true);
  //   navigate("/transaction/fabric-inspection", {
  //     state: {
  //       fabricInspDtl,
  //       mode: 'edit'
  //     }
  //   });
  // };

  //   const handleInspect = (row: any) => {
  //      const sourceData = row.original || row;
  //   navigate("/transaction/trading-fabric-inspection", {
  //     state: { sourceData: sourceData.rawData,
  //       sourceType: sourceData.sourceType,mode: 'edit' }
  //   });
  // };

  const handleEdit = (row: any) => {
    if (!row) {
      console.error('Missing inspection data:', row);
      alert('Error: Unable to load inspection data. Please try again.');
      return;
    }

    const inspectionData = row.original || row;
    const inspectionId = inspectionData.id || inspectionData.inspectionId;
    
    if (!inspectionId) {
      console.error('Missing inspection ID:', inspectionData);
      alert('Error: Inspection ID not found. Please try again.');
      return;
    }

    console.log('Editing inspection:', {
      id: inspectionId,
      hasDetails: !!inspectionData.inspectionDetails,
      hasEntries: !!inspectionData.inspectionEntries
    });

    navigate("/transaction/finish-fabric-inspection", {
      state: {
        fabricInspDtl: inspectionData,
        mode: 'edit',
        returnTab: 'finish',
        returnStatus: 'completed'
      }
    });
  };

  const handleDelete = (row: any) => {
    setCurrentInspection(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setInspectionList(inspectionList.filter((c: { id: any; }) => c.id !== currentInspection.id));
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="">
      {selectMode && inspectionStatus === 'completed' && (
        <div className="flex items-center gap-3 px-4 py-2 mb-2 bg-blue-200 border border-purple-200 rounded-md">
          <span className="text-sm text-primary font-medium">{selectedIds.size} row(s) selected &mdash; {totalBarcodeCount} barcode(s)</span>
          <button onClick={handleClearSelection} className="text-xs text-primary underline hover:text-primary">Clear</button>
          <button
            onClick={() => setIsBulkPrintModalOpen(true)}
            className="ml-auto px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary"
          >
            Print Bundle of Barcodes
          </button>
        </div>
      )}
      <DataTable
        columns={inspectionStatus === 'pending' ? pendingColumns : activeCompletedColumns}
        data={inspectionStatus === 'pending' ? pendingData : completedData}
        title={inspectionStatus === 'pending' ? "Pending Inspections" : "Completed Inspections"}
        // onAdd={inspectionStatus === 'pending' ? handleAdd : undefined}
        onView={handleView}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        showActions={inspectionStatus === 'pending' ? false : true}
        showAddActions={true}
        filterPlaceholder="Search..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        onRowClick={selectMode && inspectionStatus === 'completed' ? (row) => handleToggleRow(row.id) : undefined}
        getRowClassName={selectMode && inspectionStatus === 'completed' ? (row) => selectedIds.has(row.id) ? 'bg-[#EDE7F6]' : '' : undefined}
        headerActions={<div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-blue-50 p-1 rounded-md">
            <button
              className={`px-4 py-1 text-sm rounded-md transition-colors ${inspectionStatus === 'pending'
                ? 'bg-primary text-white shadow-sm'
                : 'text-blue-600 hover:bg-blue-100'
              }`}
              onClick={() => { setInspectionStatus('pending'); handleCancelSelectMode(); }}
            >
              Pending
            </button>
            <button
              className={`px-4 py-1 text-sm rounded-md transition-colors ${inspectionStatus === 'completed'
                ? 'bg-primary text-white shadow-sm'
                : 'text-blue-600 hover:bg-blue-100'
              }`}
              onClick={() => setInspectionStatus('completed')}
            >
              Completed
            </button>
          </div>
          {inspectionStatus === 'completed' && (
            <button
            onClick={() => selectMode ? handleCancelSelectMode() : setSelectMode(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${selectMode ? 'border-blue-600 bg-blue-600 text-white shadow' : 'border-blue-600 bg-white text-blue-700 hover:bg-blue-50'}`}
          >
            {selectMode ? 'Cancel Selection' : 'Print Multiple Barcode'}
          </button>
          )}
        </div>}
      />

      {/* Bulk Print Confirmation Modal */}
      <Modal isOpen={isBulkPrintModalOpen} onClose={() => setIsBulkPrintModalOpen(false)} title="Print Bundle of Barcodes" className="max-w-lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{totalBarcodeCount}</span> barcode sticker{totalBarcodeCount !== 1 ? 's' : ''} across{' '}
            <span className="font-semibold text-gray-800">{selectedIds.size}</span> {selectedIds.size === 1 ? 'entry' : 'entries'} will be sent to the sticker page.
          </p>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md bg-gray-50">
            {Array.from(selectedIds).map(id => {
              const row = completedData.find((r: any) => r.id === id);
              if (!row) return null;
              const count = extractPieceEntriesForRow(row).length;
              return (
                <div key={String(id)} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{row.pieceNo || `#${String(id)}`}</span>
                    <span className="ml-2 text-xs text-gray-500">{row.inspectionDate ? new Date(row.inspectionDate).toLocaleDateString() : ''}</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                    {count} {count === 1 ? 'barcode' : 'barcodes'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setIsBulkPrintModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Cancel</button>
            <button onClick={handleOpenBarcodeStickerPage} className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary-light rounded-md transition-colors font-semibold">Open Barcode Sticker Page</button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={inspectionStatus === 'pending' ? "Purchase Inward / GRN Details" : "Fabric Inspection Details"}
        className="w-full max-w-4xl"
      >
        {currentInspection && (
          <div className="space-y-4">
            {inspectionStatus === 'pending' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium">{currentInspection.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inward Date</p>
                    <p className="font-medium">
                      {new Date(currentInspection.inwardDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Purchase Order ID</p>
                    <p className="font-medium">{currentInspection.purchaseOrderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${currentInspection.activeFlag
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}
                    >
                      {currentInspection.activeFlag ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remarks</p>
                    <p className="font-medium">{currentInspection.remarks || "-"}</p>
                  </div>
                </div>

                {/* Items Details */}
                <div>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Items Details</h2>
                  {currentInspection.items?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">Item ID</th>
                            <th className="border p-2">Quantity Received</th>
                            <th className="border p-2">Price</th>
                            <th className="border p-2">Lots</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentInspection.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="border p-2 text-center">{item.id}</td>
                              <td className="border p-2 text-center">{item.quantityReceived}</td>
                              <td className="border p-2 text-center">{item.price}</td>
                              <td className="border p-2 text-center">{item.lotEntries?.length || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No items details available.</p>
                  )}
                </div>

                {/* Lot Entries */}
                <div>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Lot Entries</h2>
                  {currentInspection.items?.some((item: any) => item.lotEntries?.length > 0) ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">Lot Number</th>
                            <th className="border p-2">Quantity</th>
                            <th className="border p-2">Rejected Quantity</th>
                            <th className="border p-2">Cost</th>
                            <th className="border p-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentInspection.items.flatMap((item: any) =>
                            item.lotEntries?.map((lot: any) => (
                              <tr key={lot.id}>
                                <td className="border p-2 text-center">{lot.lotNumber}</td>
                                <td className="border p-2 text-center">{lot.quantity}</td>
                                <td className="border p-2 text-center">{lot.rejectedQuantity}</td>
                                <td className="border p-2 text-center">{lot.cost}</td>
                                <td className="border p-2 text-center">{lot.remarks || "-"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No lot entries available.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium">{currentInspection.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inspection Date</p>
                    <p className="font-medium">{currentInspection.inspectionDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Loom No</p>
                    <p className="font-medium">{currentInspection.loomNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vendor ID</p>
                    <p className="font-medium">{currentInspection.vendorId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Construction</p>
                    <p className="font-medium">{currentInspection.fabricQuality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Doff Meters</p>
                    <p className="font-medium">{currentInspection.doffMeters}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Doff Weight</p>
                    <p className="font-medium">{currentInspection.doffWeight}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${currentInspection.activeFlag
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                      }`}
                    >
                      {currentInspection.activeFlag ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Inspection Details */}
                <div>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Inspection Details</h2>
                  {currentInspection.inspectionDetails?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">Roll No</th>
                            <th className="border p-2">Doff Meters</th>
                            <th className="border p-2">Inspected Meters</th>
                            <th className="border p-2">Weight</th>
                            <th className="border p-2">Total Defect Points</th>
                            <th className="border p-2">Defect Counts</th>
                            <th className="border p-2">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentInspection.inspectionDetails.map((detail: any) => (
                            <tr key={detail.id}>
                              <td className="border p-2 text-center">{detail.rollNo || "-"}</td>
                              <td className="border p-2 text-center">{detail.doffMeters || "-"}</td>
                              <td className="border p-2 text-center">{detail.inspectedMeters || "-"}</td>
                              <td className="border p-2 text-center">{detail.weight || "-"}</td>
                              <td className="border p-2 text-center">{detail.totalDefectPoints || "-"}</td>
                              <td className="border p-2 text-center">{detail.defectCounts || "-"}</td>
                              <td className="border p-2 text-center">{detail.grade || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No inspection details available.</p>
                  )}
                </div>

                {/* Inspection Entries */}
                <div>
                  <h2 className="text-lg font-semibold mt-4 mb-2">Inspection Entries</h2>
                  {currentInspection.inspectionEntries?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2">Defected Meters</th>
                            <th className="border p-2">From Meters</th>
                            <th className="border p-2">To Meters</th>
                            <th className="border p-2">Defect Type ID</th>
                            <th className="border p-2">Defect Points</th>
                            <th className="border p-2">Inspection Id</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentInspection.inspectionEntries.map((entry: any) => (
                            <tr key={entry.id}>
                              <td className="border p-2 text-center">{entry.defectedMeters || "-"}</td>
                              <td className="border p-2 text-center">{entry.fromMeters || "-"}</td>
                              <td className="border p-2 text-center">{entry.toMeters || "-"}</td>
                              <td className="border p-2 text-center">{entry.defectTypeId || "-"}</td>
                              <td className="border p-2 text-center">{entry.defectPoints || "-"}</td>
                              <td className="border p-2 text-center">{entry.inspectionId || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No inspection entries available.</p>
                  )}
                </div>
              </>
            )}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}