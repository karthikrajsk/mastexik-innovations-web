import React, { useEffect, useMemo, useState } from "react";
const FINISH_FABRIC_INSPECTION_EDIT_KEY = "finishFabricInspectionEdit";
import { FileText, ShoppingCart, ClipboardList, Edit, Trash2, Save, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommonSearchableSelect, { CommonSearchableSelectOption } from "@/components/ui/CommonSearchableSelect";
import { useForm } from "react-hook-form";
import { createFabricInspection, updateFabricInspection } from "@/state/fabricInspectionsSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { getAllCustomers } from "@/state/customerSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllDefectMaster } from "@/state/defectMasterSlice";
import { getAllGrandMaster } from "@/state/gradeMasterSlice";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import { getAllJobworkFabricReceive } from "@/state/jobFabricReceiveSlice";
import { getAllFabricInspection } from "@/state/fabricInspectionsSlice";
import { getAllEmployees } from "@/state/employeeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { toast } from 'react-toastify';

const normalizeList = (value: any) => {
    if (Array.isArray(value)) return value;
    if (value?.data && Array.isArray(value.data)) return value.data;
    if (value?.data?.data && Array.isArray(value.data.data)) return value.data.data;
    return [];
};

const normalizeGradeNameValue = (value: any) => {
    return String(value || "").trim().toLowerCase();
};

const parseNumberValue = (value: any) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

interface FabricInspectionFormData {
    id?: number | null;
    inspectionDate: string;
    loomNo: string;
    vendorId: string;
    fabricQuality: string;
    pieceMeters: string;
    netWeight: string;
    activeFlag: boolean;
    sourceType: string;
    purchaseInwardId?: number;
    jobworkFabricReceiveId?: number;
    brushingReceiveId?: number;
    pieceNo: string;
    fabricCode: string;
    inspectorId?: string;
    inspectionDetails: InspectionDetails[];
    inspectionEntries: InspectionEntries[];
}

interface InspectionDetails {
    id?: number;
    fabricInspectionId: string;
    pieceNo: string;
    pieceEntryId?: number;
    pieceMeters: string;
    inspectedMeters: string;
    actualNetWeight: string;
    avgWeight?: string;
    totalDefectPoints: string;
    defectCounts: string;
    grade: string;
    gradeId?: number | null;
    activeFlag: boolean;
}

interface InspectionEntries {
    id?: number;
    fabricInspectionId: string;
    defectedMeters: string;
    fromMeters: string;
    toMeters: string;
    defectTypeId: string;
    defectPoints: string;
    activeFlag: boolean;
}

interface DefectMaster {
    id: number;
    defectName: string;
    defectPoint: number;
}

interface PieceDetail {
    pieceNumber: string;
    pieceEntryId?: number;
    quantity: number;
    weight: number;
    cost: number;
}

export function FinishFabricInspection() {
    const { customerList } = useSelector((state: RootState) => state.customer);
    const { vendorList } = useSelector((state: RootState) => state.vendor);
    const { defectMasterList } = useSelector((state: RootState) => state.defect);
    const { gradeList } = useSelector((state: RootState) => state.grade);
    const { employeeList } = useSelector((state: RootState) => state.employee);
    const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);

    const fabricMasterArray = useMemo<any[]>(() => {
        if (Array.isArray((fabricMasterList as any)?.data)) return (fabricMasterList as any).data;
        if (Array.isArray(fabricMasterList)) return fabricMasterList as any;
        return [];
    }, [fabricMasterList]);

    const fabricCodeOptions = useMemo<CommonSearchableSelectOption[]>(() =>
        fabricMasterArray
            .map((f: any) => {
                const id = f?.id;
                const code = f?.fabricCode || f?.code;
                if (!id || !code) return null;
                return { id, value: String(id), label: code, activeFlag: f?.activeFlag ?? true };
            })
            .filter(Boolean) as CommonSearchableSelectOption[]
    , [fabricMasterArray]);

    const normalizedEmployeeList = useMemo(() => normalizeList(employeeList).filter((employee: any) => employee?.isRelieved === false), [employeeList]);
    const inspectorOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedEmployeeList
        .map((employee: any) => {
            const id = employee?.id ?? employee?.employeeId;
            const label = employee?.employeeName || employee?.name;
            if (!id || !label) return null;
            return {
                id,
                value: String(id),
                label,
                activeFlag: employee?.activeFlag ?? true
            };
        })
        .filter(Boolean) as CommonSearchableSelectOption[], [normalizedEmployeeList]);

    const normalizedDefectList = useMemo(() => normalizeList(defectMasterList), [defectMasterList]);
    const defectTypeOptions = useMemo<CommonSearchableSelectOption[]>(() => normalizedDefectList
        .map((defect: any) => {
            const id = defect?.id;
            const label = defect?.defectName;
            if (id == null || !label) return null;
            return {
                id,
                value: String(id),
                label,
                activeFlag: defect?.activeFlag ?? true
            };
        })
        .filter(Boolean) as CommonSearchableSelectOption[], [normalizedDefectList]);

    const normalizedGradeList = useMemo(() => {
        const grades = normalizeList(gradeList);
        return grades.map((grade: any) => {
            const id = grade?.id ?? grade?.gradeId ?? grade?.grade_id;
            const gradeId = grade?.gradeId ?? grade?.grade_id ?? grade?.id ?? id;
            const gradeName = grade?.gradeName ?? grade?.grade_name ?? grade?.name ?? "";
            return {
                ...grade,
                id,
                gradeId,
                gradeName,
                minPoint: parseNumberValue(
                    grade?.minPoint ?? grade?.min_point ?? grade?.min_points ?? grade?.min ?? 0
                ),
                maxPoint: parseNumberValue(
                    grade?.maxPoint ?? grade?.max_point ?? grade?.max_points ?? grade?.max ?? 0
                ),
            };
        });
    }, [gradeList]);

    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const navigate = useNavigate();

    const sourceData = location.state?.sourceData;
    const sourceType = location.state?.sourceType;
    const editData: FabricInspectionFormData | undefined = location.state?.fabricInspDtl;
    const mode = (location.state as any)?.mode;
    const returnTab = (location.state as any)?.returnTab || 'finish';
    const returnStatus = (location.state as any)?.returnStatus || 'pending';
    const isEdit = mode === 'edit' && editData?.id;

    const [inspectionEntries, setInspectionEntries] = useState<InspectionEntries[]>(editData?.inspectionEntries || []);
    const [inspectionDetails, setInspectionDetails] = useState<InspectionDetails[]>(editData?.inspectionDetails || []);
    const [newItem, setNewItem] = useState<Partial<InspectionEntries>>({});
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isDetailsValid, setIsDetailsValid] = useState(false);
    const [defectsLoaded, setDefectsLoaded] = useState(false);
    const [availablePieces, setAvailablePieces] = useState<PieceDetail[]>([]);
    const [noDefected, setNoDefected] = useState(false);
    const [selectedFabricMasterId, setSelectedFabricMasterId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FabricInspectionFormData>({
        mode: "onBlur",
        reValidateMode: "onChange"
    });
    const inspectorRegistration = register('inspectorId', { required: true });
    const { ref: inspectorRef, onChange: inspectorOnChange, ...inspectorRest } = inspectorRegistration;
    const watchNetWeight = watch('netWeight');
    const watchPieceMeters = watch('pieceMeters');
    const watchSourceType = watch('sourceType');

    const isInspectionValid = !!watch('inspectorId') && inspectionDetails.length > 0 &&
        inspectionDetails.every(detail =>
            detail.pieceMeters &&
            detail.inspectedMeters &&
            detail.actualNetWeight &&
            detail.totalDefectPoints !== undefined
        );

    const extractPiecesFromSource = (data: any, type: string): PieceDetail[] => {
        const pieces: PieceDetail[] = [];

        if (!data) return pieces;

        let allPieces: any[] = [];

        if (data.selectedPieces && Array.isArray(data.selectedPieces)) {
            allPieces = data.selectedPieces;
        } else if (data.items && Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
                if (item.pieceEntries && Array.isArray(item.pieceEntries)) {
                    allPieces.push(...item.pieceEntries);
                } else if (item.pieceRollNo || item.meter || item.netWeight) {
                    allPieces.push(item);
                }
            });
        }

        allPieces.forEach((piece: any) => {
            const pieceNumber = piece.pieceNumber || piece.pieceRollNo;
            if (pieceNumber) {
                pieces.push({
                    pieceNumber: pieceNumber,
                    pieceEntryId: piece.id || piece.pieceEntryId,
                    quantity: piece.quantity || piece.meter || 0,
                    weight: piece.weight || piece.netWeight || 0,
                    cost: piece.cost || 0
                });
            }
        });

        return pieces;
    };

    const calculateAvgWeight = (weight?: string | number, meters?: string | number) => {
        const w = weight !== undefined && weight !== null ? Number(weight) : NaN;
        const m = meters !== undefined && meters !== null ? Number(meters) : NaN;
        if (!isFinite(w) || !isFinite(m) || m === 0) {
            return "";
        }
        return (w / m).toFixed(3);
    };

    const deriveDetailAvgWeight = (detail: InspectionDetails, fallbackWeight?: string, fallbackMeters?: string) => {
        const weightValue = detail.actualNetWeight || fallbackWeight;
        const meterValue = detail.inspectedMeters || detail.pieceMeters || fallbackMeters;
        return calculateAvgWeight(weightValue, meterValue);
    };

    useEffect(() => {
        const resolveFmList = (payload: any): any[] => {
            if (Array.isArray(payload?.data)) return payload.data;
            if (Array.isArray(payload)) return payload;
            return [];
        };

        const resolveFabricQualityFromCode = (fabricCode: string, fmList: any[]): string => {
            if (!fabricCode || !fmList.length) return '';
            const rec = fmList.find((f: any) => String(f?.fabricCode || '') === String(fabricCode));
            return rec?.fabricQuality || rec?.quality || '';
        };

        const loadData = async () => {
            await dispatch(getAllCustomers({}));
            await dispatch(getAllVendors({}));
            await dispatch(getAllDefectMaster({}));
            await dispatch(getAllGrandMaster({ fetchAll: true }));
            await dispatch(getAllEmployees({}));
            const fmResult = await dispatch(getAllFabricMasters({} as any)).unwrap();
            const fmList = resolveFmList(fmResult);
            const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
            const companyId = v ? Number(v) : undefined;
            await dispatch(getAllFabricInspection({ companyId }));
            setDefectsLoaded(true);

            if (isEdit && editData) {
                const convertToString = (value: any) => value !== null && value !== undefined ? String(value) : '';
                const rawDetails: any[] = (editData as any).inspectionDetails || (editData as any).inspection_details || (editData as any).fabricInspectionDetails || [];
                const rawEntries: any[] = (editData as any).inspectionEntries || (editData as any).inspection_entries || [];
                const editPieceEntryId = (editData as any).pieceEntryId || (editData as any).piece_entry_id;
                const processedDetails = (rawDetails || []).map((detail: any) => ({
                    ...detail,
                    fabricInspectionId: convertToString((detail as any).fabricInspectionId ?? (detail as any).fabric_inspection_id),
                    pieceEntryId: (detail as any).pieceEntryId ?? (detail as any).piece_entry_id ?? editPieceEntryId,
                    pieceMeters: convertToString((detail as any).pieceMeters ?? (detail as any).piece_meters),
                    inspectedMeters: convertToString((detail as any).inspectedMeters ?? (detail as any).inspected_meters),
                    actualNetWeight: convertToString((detail as any).actualNetWeight ?? (detail as any).actual_net_weight),
                    avgWeight: (detail as any).avgWeight ? convertToString((detail as any).avgWeight) : (detail as any).avg_weight ? convertToString((detail as any).avg_weight) : undefined,
                    totalDefectPoints: convertToString((detail as any).totalDefectPoints ?? (detail as any).total_defect_points ?? 0),
                    defectCounts: convertToString((detail as any).defectCounts ?? (detail as any).defect_counts ?? 0),
                    pieceNo: convertToString((detail as any).pieceNo ?? (detail as any).piece_no ?? (detail as any).pieceNumber ?? (detail as any).piece_number)
                }));
                const processedEntries = (rawEntries || []).map((entry: any) => ({
                    ...entry,
                    fabricInspectionId: convertToString((entry as any).fabricInspectionId ?? (entry as any).fabric_inspection_id),
                    defectedMeters: convertToString((entry as any).defectedMeters ?? (entry as any).defected_meters),
                    fromMeters: convertToString((entry as any).fromMeters ?? (entry as any).from_meters),
                    toMeters: convertToString((entry as any).toMeters ?? (entry as any).to_meters),
                    defectTypeId: convertToString((entry as any).defectTypeId ?? (entry as any).defect_type_id),
                    defectPoints: convertToString((entry as any).defectPoints ?? (entry as any).defect_points),
                }));
                const fabricId = (editData as any).fabricMasterId ?? (editData as any).fabricCodeId ?? (editData as any).finishedFabricCodeId ?? (editData as any).fabric_id ?? (editData as any).fabric_code_id;
                const fabric = fabricId != null ? fmList.find((f: any) => String(f.id) === String(fabricId)) : undefined;
                const resolvedFabricCode = (editData as any).fabricCode || (editData as any).finishedFabricCode || (fabric ? (fabric.fabricCode || fabric.code || '') : '');
                const resolvedFabricQuality = (editData as any).fabricQuality || (editData as any).quality || (editData as any).finishedFabricName || resolveFabricQualityFromCode(resolvedFabricCode, fmList) || (fabric ? (fabric.fabricQuality || fabric.quality || fabric.name || '') : '');
                const firstDetail = (processedDetails && processedDetails[0]) || {} as any;
                const pieceMeters = convertToString((editData as any).pieceMeters ?? (editData as any).piece_meters ?? firstDetail.pieceMeters);
                const netWeight = convertToString((editData as any).netWeight ?? (editData as any).net_weight ?? firstDetail.actualNetWeight);
                const pieceNo = convertToString((editData as any).pieceNo ?? (editData as any).piece_no ?? firstDetail.pieceNo);
                let finalDetails = processedDetails;
                if ((!finalDetails || finalDetails.length === 0) && editData) {
                    const pieces = extractPiecesFromSource(editData as any, String((editData as any).sourceType || ''));
                    if (pieces.length > 0) {
                        finalDetails = pieces.map(piece => ({
                            fabricInspectionId: "",
                            pieceNo: piece.pieceNumber,
                            pieceEntryId: piece.pieceEntryId,
                            pieceMeters: String(piece.quantity || ''),
                            inspectedMeters: String(piece.quantity || ''),
                            actualNetWeight: String(piece.weight || ''),
                            avgWeight: piece.quantity > 0 ? (Number(piece.weight || 0) / Number(piece.quantity || 1)).toFixed(3) : "0",
                            totalDefectPoints: "0",
                            defectCounts: "0",
                            grade: "",
                            activeFlag: true
                        }));
                    }
                }
                reset({
                    id: (editData as any).id ?? (editData as any).inspectionId,
                    inspectionDate: (editData as any).inspectionDate ?? (editData as any).createdDate ?? (editData as any).created_at,
                    loomNo: (editData as any).loomNo || '',
                    vendorId: convertToString((editData as any).vendorId),
                    fabricQuality: convertToString(resolvedFabricQuality),
                    pieceMeters: pieceMeters,
                    netWeight: netWeight,
                    activeFlag: (editData as any).activeFlag,
                    sourceType: (editData as any).sourceType,
                    purchaseInwardId: (editData as any).purchaseInwardId,
                    jobworkFabricReceiveId: (editData as any).jobworkFabricReceiveId,
                    brushingReceiveId: (editData as any).brushingReceiveId,
                    pieceNo: pieceNo,
                    fabricCode: convertToString(resolvedFabricCode),
                    inspectorId: convertToString((editData as any).inspectorId),
                    inspectionDetails: finalDetails,
                    inspectionEntries: processedEntries,
                });
                setInspectionDetails(finalDetails);
                setInspectionEntries(processedEntries);
                const savedNoDef = Number((editData as any).isNoDefectedPieces ?? 0) === 1 || String((editData as any).isNoDefectedPieces || '') === 'true';
                setNoDefected(savedNoDef);

            } else if (editData && !isEdit && (editData as any).rawData) {
                const rawData = (editData as any).rawData;
                const currentDate = new Date().toISOString().split('T')[0];
                const pieces = extractPiecesFromSource(rawData, (editData as any).sourceType);
                setAvailablePieces(pieces);

                const firstItem = rawData.selectedItem || (rawData.items && rawData.items[0]);
                const firstPiece = pieces && pieces[0];
                const detectedSourceType = (editData as any).sourceType || 'Process Receive';

                if (detectedSourceType === 'Purchase Inward') {
                    const fabricCode = rawData.fabricCode || firstItem?.fabricCode || (editData as any).fabricCode || '';
                    const fabricQuality = resolveFabricQualityFromCode(fabricCode, fmList) || rawData.quality || rawData.fabricQuality || (editData as any).fabricQuality || '';

                    reset({
                        inspectionDate: currentDate,
                        loomNo: '',
                        vendorId: rawData.vendorId?.toString() || (editData as any).vendorId?.toString() || '',
                        fabricQuality: fabricQuality,
                        pieceMeters: firstPiece?.quantity?.toString() || '',
                        netWeight: firstPiece?.weight?.toString() || '',
                        activeFlag: true,
                        sourceType: 'PURCHASE_INWARD',
                        purchaseInwardId: rawData.id || rawData.sourceId,
                        pieceNo: firstPiece?.pieceNumber || (editData as any).pieceNo || '',
                        fabricCode: fabricCode,
                        inspectorId: '',
                        inspectionDetails: [],
                        inspectionEntries: [],
                    });

                    const details = pieces.map(piece => ({
                        fabricInspectionId: "",
                        pieceNo: piece.pieceNumber,
                        pieceEntryId: piece.pieceEntryId,
                        pieceMeters: piece.quantity.toString(),
                        inspectedMeters: piece.quantity.toString(),
                        actualNetWeight: piece.weight.toString(),
                        avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                        totalDefectPoints: "0",
                        defectCounts: "0",
                        grade: "",
                        gradeId: undefined,
                        activeFlag: true
                    }));
                    setInspectionDetails(details);
                } else if (detectedSourceType === 'Process Receive' || detectedSourceType === 'Finish Fabric') {
                    const fabricCode = rawData.fabricCode || rawData.finishedFabricCode || firstItem?.fabricCode || (editData as any).fabricCode || '';
                    const fabricQuality = resolveFabricQualityFromCode(fabricCode, fmList) || rawData.quality || rawData.fabricQuality || rawData.finishedFabricName || firstItem?.quality || (editData as any).fabricQuality || '';

                    reset({
                        inspectionDate: currentDate,
                        loomNo: '',
                        vendorId: rawData.vendorId?.toString() || (editData as any).vendorId?.toString() || '',
                        fabricQuality: fabricQuality,
                        pieceMeters: firstPiece?.quantity?.toString() || '',
                        netWeight: firstPiece?.weight?.toString() || '',
                        activeFlag: true,
                        sourceType: 'FINISH_FABRIC_RECEIVE',
                        jobworkFabricReceiveId: rawData.id || rawData.sourceId,
                        pieceNo: firstPiece?.pieceNumber || (editData as any).pieceNo || '',
                        fabricCode: fabricCode,
                        inspectorId: '',
                        inspectionDetails: [],
                        inspectionEntries: [],
                    });

                    const details = pieces.map(piece => ({
                        fabricInspectionId: "",
                        pieceNo: piece.pieceNumber,
                        pieceEntryId: piece.pieceEntryId,
                        pieceMeters: piece.quantity.toString(),
                        inspectedMeters: piece.quantity.toString(),
                        actualNetWeight: piece.weight.toString(),
                        avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                        totalDefectPoints: "0",
                        defectCounts: "0",
                        grade: "",
                        activeFlag: true
                    }));
                    setInspectionDetails(details);
                } else if (detectedSourceType === 'Brushed Fabric' || detectedSourceType === 'BRUSHED_FABRIC') {
                    const fabricCode = rawData.fabricCode || (editData as any).fabricCode || '';
                    const fabricQuality = resolveFabricQualityFromCode(fabricCode, fmList) || rawData.quality || rawData.fabricQuality || (editData as any).fabricQuality || '';

                    reset({
                        inspectionDate: currentDate,
                        loomNo: '',
                        vendorId: rawData.vendorId?.toString() || (editData as any).vendorId?.toString() || '',
                        fabricQuality: fabricQuality,
                        pieceMeters: firstPiece?.quantity?.toString() || '',
                        netWeight: firstPiece?.weight?.toString() || '',
                        activeFlag: true,
                        sourceType: 'BRUSHED_FABRIC',
                        brushingReceiveId: rawData.brushingReceiveId,
                        pieceNo: firstPiece?.pieceNumber || (editData as any).pieceNo || '',
                        fabricCode: fabricCode,
                        inspectorId: '',
                        inspectionDetails: [],
                        inspectionEntries: [],
                    });

                    const details = pieces.map(piece => ({
                        fabricInspectionId: "",
                        pieceNo: piece.pieceNumber,
                        pieceEntryId: piece.pieceEntryId,
                        pieceMeters: piece.quantity.toString(),
                        inspectedMeters: piece.quantity.toString(),
                        actualNetWeight: piece.weight.toString(),
                        avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                        totalDefectPoints: "0",
                        defectCounts: "0",
                        grade: "",
                        activeFlag: true
                    }));
                    setInspectionDetails(details);
                }
            } else if (sourceData) {
                const currentDate = new Date().toISOString().split('T')[0];
                const pieces = extractPiecesFromSource(sourceData, sourceType);
                setAvailablePieces(pieces);

                const firstItem = sourceData.selectedItem || (sourceData.items && sourceData.items[0]);
                const firstPiece = pieces && pieces[0];

                if (sourceType === 'Purchase Inward') {
                    const fabricCode = sourceData.fabricCode || firstItem?.fabricCode || '';
                    const fabricQuality = resolveFabricQualityFromCode(fabricCode, fmList) || sourceData.quality || firstItem?.quality || '';

                    reset({
                        inspectionDate: currentDate,
                        loomNo: '',
                        vendorId: sourceData.vendorId?.toString() || '',
                        fabricQuality: fabricQuality,
                        pieceMeters: firstPiece?.quantity?.toString() || '',
                        netWeight: firstPiece?.weight?.toString() || '',
                        activeFlag: true,
                        sourceType: 'PURCHASE_INWARD',
                        purchaseInwardId: sourceData.id,
                        pieceNo: firstPiece?.pieceNumber || '',
                        fabricCode: fabricCode,
                        inspectorId: '',
                        inspectionDetails: [],
                        inspectionEntries: [],
                    });

                    const details = pieces.map(piece => ({
                        fabricInspectionId: "",
                        pieceNo: piece.pieceNumber,
                        pieceEntryId: piece.pieceEntryId,
                        pieceMeters: piece.quantity.toString(),
                        inspectedMeters: piece.quantity.toString(),
                        actualNetWeight: piece.weight.toString(),
                        avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                        totalDefectPoints: "0",
                        defectCounts: "0",
                        grade: "",
                        activeFlag: true
                    }));
                    setInspectionDetails(details);
                } else if (sourceType === 'Jobwork Fabric') {
                    const fabricCode = sourceData.fabricCode || firstItem?.fabricCode || '';
                    const fabricQuality = resolveFabricQualityFromCode(fabricCode, fmList) || sourceData.quality || firstItem?.quality || '';

                    reset({
                        inspectionDate: currentDate,
                        loomNo: '',
                        vendorId: sourceData.vendorId?.toString() || '',
                        fabricQuality: fabricQuality,
                        pieceMeters: firstPiece?.quantity?.toString() || '',
                        netWeight: firstPiece?.weight?.toString() || '',
                        activeFlag: true,
                        sourceType: 'JOBWORK_FABRIC',
                        jobworkFabricReceiveId: sourceData.id,
                        pieceNo: firstPiece?.pieceNumber || '',
                        fabricCode: fabricCode,
                        inspectorId: '',
                        inspectionDetails: [],
                        inspectionEntries: [],
                    });

                    const details = pieces.map(piece => ({
                        fabricInspectionId: "",
                        pieceNo: piece.pieceNumber,
                        pieceEntryId: piece.pieceEntryId,
                        pieceMeters: piece.quantity.toString(),
                        inspectedMeters: piece.quantity.toString(),
                        actualNetWeight: piece.weight.toString(),
                        avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                        totalDefectPoints: "0",
                        defectCounts: "0",
                        grade: "",
                        activeFlag: true
                    }));
                    setInspectionDetails(details);
                } else if (sourceType === 'Brushed Fabric' || sourceType === 'BRUSHED_FABRIC') {
                    const fabricCode = sourceData.fabricCode || '';
                    const fabricQuality = resolveFabricQualityFromCode(fabricCode, fmList) || sourceData.quality || '';

                    reset({
                        inspectionDate: currentDate,
                        loomNo: '',
                        vendorId: sourceData.vendorId?.toString() || '',
                        fabricQuality: fabricQuality,
                        pieceMeters: firstPiece?.quantity?.toString() || '',
                        netWeight: firstPiece?.weight?.toString() || '',
                        activeFlag: true,
                        sourceType: 'BRUSHED_FABRIC',
                        brushingReceiveId: sourceData.brushingReceiveId,
                        pieceNo: firstPiece?.pieceNumber || '',
                        fabricCode: fabricCode,
                        inspectorId: '',
                        inspectionDetails: [],
                        inspectionEntries: [],
                    });

                    const details = pieces.map(piece => ({
                        fabricInspectionId: "",
                        pieceNo: piece.pieceNumber,
                        pieceEntryId: piece.pieceEntryId,
                        pieceMeters: piece.quantity.toString(),
                        inspectedMeters: piece.quantity.toString(),
                        actualNetWeight: piece.weight.toString(),
                        avgWeight: piece.quantity > 0 ? (piece.weight / piece.quantity).toFixed(3) : "0",
                        totalDefectPoints: "0",
                        defectCounts: "0",
                        grade: "",
                        activeFlag: true
                    }));
                    setInspectionDetails(details);
                }
            } else {
                reset({
                    inspectionDate: new Date().toISOString().split('T')[0],
                    activeFlag: true,
                    inspectorId: '',
                    inspectionDetails: [],
                    inspectionEntries: [],
                });
            }
        };

        loadData();
    }, [dispatch, isEdit, editData, sourceData, sourceType, reset]);

    const validateDetails = () => {
        const sourceTypeVal = watch("sourceType");
        const fields = [
            "inspectionDate",
            "fabricQuality",
            "pieceMeters",
            "netWeight"
        ];
        if (sourceTypeVal !== 'BRUSHED_FABRIC') {
            fields.push("vendorId");
        }
        const values = watch(fields as any);

        return values.every((value: any) => !!value);
    };

    useEffect(() => {
        setIsDetailsValid(validateDetails());
        const subscription = watch(() => {
            setIsDetailsValid(validateDetails());
        });

        return () => subscription.unsubscribe();
    }, [watch]);

    useEffect(() => {
        if (!inspectionDetails.length) return;
        let updated = false;
        const refreshed = inspectionDetails.map(detail => {
            const avg = deriveDetailAvgWeight(detail, watchNetWeight, watchPieceMeters);
            if (avg !== detail.avgWeight) {
                updated = true;
                return { ...detail, avgWeight: avg };
            }
            return detail;
        });
        if (updated) {
            setInspectionDetails(refreshed);
        }
    }, [inspectionDetails, watchNetWeight, watchPieceMeters]);

    const handleDefectTypeChange = (value: string) => {
        const defectId = value || '';
        let defectPoints = "";

        if (defectsLoaded && Array.isArray(normalizedDefectList)) {
            const selectedDefect = normalizedDefectList.find((defect: any) =>
                String(defect?.id) === defectId
            );

            if (selectedDefect && selectedDefect.defectPoint != null) {
                defectPoints = String(selectedDefect.defectPoint);
            }
        }

        setNewItem({
            ...newItem,
            defectTypeId: defectId,
            defectPoints
        });
    };

    const calculateGradeForPoints = (totalPoints: number): string => {
        if (!normalizedGradeList.length) {
            return "";
        }

        const matchedGrade = normalizedGradeList.find((g: any) => {
            const minPt = parseFloat(g.minPoint) || 0;
            const maxPt = parseFloat(g.maxPoint) || 0;
            return totalPoints >= minPt && totalPoints <= maxPt;
        });

        return matchedGrade ? matchedGrade.gradeName : "";
    };

    // useEffect(() => {
    //     if (!inspectionDetails.length) return;

    //     const gradeAEntry = normalizedGradeList.find((grade: { gradeName: any; }) => normalizeGradeNameValue(grade.gradeName) === "grade a");
    //     const gradeALabel = gradeAEntry?.gradeName || "Grade A";

    //     if (noDefected) {
    //         const needsUpdate = inspectionDetails.some(
    //             (d) =>
    //                 d.totalDefectPoints !== "0" ||
    //                 d.defectCounts !== "0" ||
    //                 d.grade !== gradeALabel ||
    //                 d.gradeId !== gradeAEntry?.id
    //         );
    //         if (needsUpdate) {
    //             setInspectionDetails(
    //                 inspectionDetails.map((d) => ({
    //                     ...d,
    //                     totalDefectPoints: "0",
    //                     defectCounts: "0",
    //                     grade: gradeALabel,
    //                     gradeId: gradeAEntry?.id ?? undefined
    //                 }))
    //             );
    //         }
    //         return;
    //     }

    //     if (inspectionEntries.length > 0) {
    //         const totalPoints = inspectionEntries.reduce((sum, entry) => sum + (parseFloat(entry.defectPoints) || 0), 0);
    //         const gradeName = calculateGradeForPoints(totalPoints);
    //         const normalizedGrade = normalizeGradeNameValue(gradeName);
    //         const matchedGrade = normalizedGrade
    //             ? normalizedGradeList.find((grade: { gradeName: any; }) => normalizeGradeNameValue(grade.gradeName) === normalizedGrade)
    //             : undefined;
    //         const tp = totalPoints.toString();
    //         const gradeIdValue = matchedGrade?.id;
    //         const needsUpdate = inspectionDetails.some(
    //             (d) =>
    //                 d.totalDefectPoints !== tp ||
    //                 d.grade !== gradeName ||
    //                 d.gradeId !== gradeIdValue
    //         );
    //         if (needsUpdate) {
    //             setInspectionDetails(
    //                 inspectionDetails.map((detail) => ({
    //                     ...detail,
    //                     totalDefectPoints: tp,
    //                     grade: gradeName,
    //                     gradeId: gradeIdValue
    //                 }))
    //             );
    //         }
    //     } else {
    //         const needsUpdate = inspectionDetails.some((d) => d.grade || d.gradeId !== undefined);
    //         if (needsUpdate) {
    //             setInspectionDetails(inspectionDetails.map((d) => ({ ...d, grade: "", gradeId: undefined })));
    //         }
    //     }
    // }, [noDefected, inspectionEntries, normalizedGradeList, inspectionDetails]);

    useEffect(() => {
        if (!inspectionDetails.length) return;

        const gradeAEntry = normalizedGradeList.find((g: any) =>
            normalizeGradeNameValue(g.gradeName) === "grade a"
        );
        const gradeALabel = gradeAEntry?.gradeName || "Grade A";
        const gradeAId = gradeAEntry?.id ?? gradeAEntry?.gradeId;

        if (noDefected) {
            const needsUpdate = inspectionDetails.some(
                (d) =>
                    d.totalDefectPoints !== "0" ||
                    d.defectCounts !== "0" ||
                    d.grade !== gradeALabel ||
                    d.gradeId !== gradeAId
            );
            if (needsUpdate) {
                setInspectionDetails(
                    inspectionDetails.map((d) => ({
                        ...d,
                        totalDefectPoints: "0",
                        defectCounts: "0",
                        grade: gradeALabel,
                        gradeId: gradeAId ?? undefined
                    }))
                );
            }
            return;
        }

        if (inspectionEntries.length > 0) {
            const totalPoints = inspectionEntries.reduce((sum, entry) => sum + (parseFloat(entry.defectPoints) || 0), 0);
            const gradeName = calculateGradeForPoints(totalPoints);
            const normalizedGrade = normalizeGradeNameValue(gradeName);
            const matchedGrade = normalizedGrade
                ? normalizedGradeList.find((g: any) => normalizeGradeNameValue(g.gradeName) === normalizedGrade)
                : undefined;
            const tp = totalPoints.toString();
            const gradeIdValue = matchedGrade?.id ?? matchedGrade?.gradeId;

            const needsUpdate = inspectionDetails.some(
                (d) =>
                    d.totalDefectPoints !== tp ||
                    d.grade !== gradeName ||
                    d.gradeId !== gradeIdValue
            );
            if (needsUpdate) {
                setInspectionDetails(
                    inspectionDetails.map((detail) => ({
                        ...detail,
                        totalDefectPoints: tp,
                        grade: gradeName,
                        gradeId: gradeIdValue
                    }))
                );
            }
        } else {
            const needsUpdate = inspectionDetails.some((d) => d.grade || d.gradeId !== undefined);
            if (needsUpdate) {
                setInspectionDetails(
                    inspectionDetails.map((d) => ({ ...d, grade: "", gradeId: undefined }))
                );
            }
        }
    }, [noDefected, inspectionEntries, normalizedGradeList, inspectionDetails]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewItem({ ...newItem, [e.target.name]: e.target.value });
    };

    const addItem = () => {
        if (!newItem.defectedMeters || !newItem.fromMeters || !newItem.toMeters || !newItem.defectTypeId) return;
        if (noDefected) setNoDefected(false);
        if (editingIndex !== null) {
            const updated = [...inspectionEntries];
            updated[editingIndex] = { ...newItem, activeFlag: true } as InspectionEntries;
            setInspectionEntries(updated);
            setEditingIndex(null);
        } else {
            setInspectionEntries([...inspectionEntries, { ...newItem, activeFlag: true } as InspectionEntries]);
        }
        setNewItem({});
    };

    useEffect(() => {
        if (!fabricMasterArray.length || selectedFabricMasterId) return;

        const directFabricMasterId =
            (editData as any)?.fabricMasterId ??
            (editData as any)?.fabricCodeId ??
            (editData as any)?.finishedFabricCodeId ??
            (editData as any)?.fabric_master_id ??
            (sourceData as any)?.fabricMasterId ??
            (sourceData as any)?.fabricCodeId;

        if (directFabricMasterId != null) {
            const directMatch = fabricMasterArray.find((f: any) => String(f?.id) === String(directFabricMasterId));
            if (directMatch) {
                setSelectedFabricMasterId(directMatch.id);
                setValue('fabricCode', directMatch.fabricCode || directMatch.code || '', { shouldValidate: true });
                if (directMatch.fabricQuality || directMatch.quality) {
                    setValue('fabricQuality', directMatch.fabricQuality || directMatch.quality || '', { shouldValidate: true });
                }
                return;
            }
        }

        const fabricCodeVal = String((editData as any)?.fabricCode || (sourceData as any)?.fabricCode || '').trim().toLowerCase();
        if (!fabricCodeVal) return;
        const match = fabricMasterArray.find((f: any) =>
            String(f?.fabricCode || f?.code || '').trim().toLowerCase() === fabricCodeVal
        );
        if (match) {
            setSelectedFabricMasterId(match.id);
            if (match.fabricQuality || match.quality) {
                setValue('fabricQuality', match.fabricQuality || match.quality || '', { shouldValidate: true });
            }
        }
    }, [fabricMasterArray, editData, sourceData]);

    const editItem = (index: number) => {
        setNewItem(inspectionEntries[index]);
        setEditingIndex(index);
    };

    const deleteItem = (index: number) => {
        setInspectionEntries(inspectionEntries.filter((_, i) => i !== index));
    };

    // const onSubmit = async (data: FabricInspectionFormData) => {
    //     const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    //     const companyId = v ? Number(v) : undefined;

    //     const grades = normalizedGradeList;
    //     const defaultGrade = grades.find((gg: any) => normalizeGradeNameValue(gg?.gradeName || gg?.name) === 'grade a');
    //     const detailsPayload = (inspectionDetails || []).map((d: any) => {
    //         const normalizedGrade = normalizeGradeNameValue(d.grade);
    //         const matchedGrade = normalizedGrade
    //             ? grades.find((gg: any) => normalizeGradeNameValue(gg?.gradeName || gg?.name) === normalizedGrade)
    //             : undefined;
    //         const resolvedGradeId = d.gradeId ?? matchedGrade?.id ?? defaultGrade?.id;
    //         const { grade, gradeId, ...rest } = d;
    //         return { ...rest, grade, gradeId: resolvedGradeId };
    //     });

    //     const payload = {
    //         ...data,
    //         inspectionDetails: detailsPayload,
    //         inspectionEntries,
    //         activeFlag: true,
    //         companyId,
    //         isNoDefectedPieces: noDefected ? 1 : 0,
    //         isFactoryFabric: 0,
    //         fabricTypeId: 2
    //     };

    //     try {
    //         alert(JSON.stringify(payload));
    //         console.log('Payload to submit:', payload);
    //         if (isEdit && data.id) {
    //             await dispatch(updateFabricInspection({ id: data.id, data: payload, companyId }) as any).unwrap();
    //         } else {
    //             await dispatch(createFabricInspection(payload) as any).unwrap();
    //         }

    //         await dispatch(getAllPurchaseInwards(companyId ? { companyId } : {}));
    //         await dispatch(getAllJobworkFabricReceive(companyId ? { companyId } : {}));
    //         await dispatch(getAllFabricInspection({ companyId }) as any);

    //          navigate('/transaction/trading-fabric-inspection-management', { 
    //             state: { tab: 'finishedFabricInspection', activeTab: returnStatus }
    //         });

    //         reset();
    //         setInspectionEntries([]);
    //         setInspectionDetails([]);
    //     } catch (error) {
    //         console.error('Error saving inspection:', error);
    //     }
    // };

    const onSubmit = async (data: FabricInspectionFormData) => {
        if (!selectedFabricMasterId) {
            toast.warning('Please select a Sort No');
            return;
        }
        const v = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
        const companyId = v ? Number(v) : undefined;

        // Get grades from normalizedGradeList
        const grades = normalizedGradeList;

        // Helper function to normalize grade names for comparison
        const normalizeGradeName = (value: any) => String(value || '').trim().toLowerCase();

        // Find default grade (Grade A) as fallback
        const defaultGrade = grades.find((gg: any) =>
            normalizeGradeName(gg?.gradeName || gg?.name || '') === 'grade a'
        );

        // Map inspection details with proper gradeId
        const detailsPayload = (inspectionDetails || []).map((d: any) => {
            const normalizedGrade = normalizeGradeName(d.grade);
            const matchedGrade = normalizedGrade
                ? grades.find((gg: any) => normalizeGradeName(gg?.gradeName || gg?.name || '') === normalizedGrade)
                : undefined;

            // Use existing gradeId if available, otherwise use matched grade ID, or default grade ID
            const resolvedGradeId = d.gradeId ?? matchedGrade?.id ?? matchedGrade?.gradeId ?? defaultGrade?.id ?? defaultGrade?.gradeId;

            // Create a new object that includes both grade and gradeId
            // Don't spread the original d as it might cause issues
            return {
                fabricInspectionId: d.fabricInspectionId || "",
                pieceNo: d.pieceNo || "",
                pieceEntryId: d.pieceEntryId,
                pieceMeters: d.pieceMeters || "0",
                inspectedMeters: d.inspectedMeters || "0",
                actualNetWeight: d.actualNetWeight || "0",
                avgWeight: d.avgWeight || "0",
                totalDefectPoints: d.totalDefectPoints || "0",
                defectCounts: d.defectCounts || "0",
                activeFlag: d.activeFlag !== undefined ? d.activeFlag : true,
                grade: d.grade || "", // Keep grade name if needed
                gradeId: resolvedGradeId // This is the key field that was missing
            };
        });

        const payload = {
            ...data,
            inspectionDetails: detailsPayload,
            inspectionEntries,
            activeFlag: true,
            companyId,
            isNoDefectedPieces: noDefected ? 1 : 0,
            isFactoryFabric: 0,
            fabricTypeId: 2,
            fabricMasterId: selectedFabricMasterId
        };

        try {
            // alert(JSON.stringify(payload));
            console.log('Payload to submit:', payload);
            if (isEdit && data.id) {
                await dispatch(updateFabricInspection({ id: data.id, data: payload, companyId }) as any).unwrap();
            } else {
                await dispatch(createFabricInspection(payload) as any).unwrap();
            }

            await dispatch(getAllPurchaseInwards(companyId ? { companyId } : {}));
            await dispatch(getAllJobworkFabricReceive(companyId ? { companyId } : {}));
            await dispatch(getAllFabricInspection({ companyId }) as any);

            navigate('/transaction/trading-fabric-inspection-management', {
                state: { tab: 'finishedFabricInspection', inspectionStatus: returnStatus }
            });

            reset();
            setInspectionEntries([]);
            setInspectionDetails([]);
        } catch (error) {
            console.error('Error saving inspection:', error);
        }
    };

    const goToFinishInspectionManagement = () => {
        navigate('/transaction/trading-fabric-inspection-management', {
            state: { tab: 'finishedFabricInspection', inspectionStatus: returnStatus }
        });
    }


    return (
        <div className="mt-10 p-6 bg-white shadow-md rounded-lg">
            <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => goToFinishInspectionManagement()}
                        className="mr-auto"
                    >
                        <ArrowLeft size={18} className="mr-2" />
                        Back
                    </Button>
                    <h2 className="text-2xl font-semibold">{isEdit ? "Edit Finish Fabric Inspection" : "Finish Fabric Inspection"}</h2>
                </div>

            </div>

            <div className="space-y-6 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={20} /> Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Inspection Date <span className="text-red-500">*</span></label>
                            <input
                                {...register('inspectionDate', { required: true })}
                                type="date"
                                className="input mt-1"
                                required
                            />
                            {errors.inspectionDate && <p className="text-red-500 text-xs mt-1">Date is required</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Loom No</label>
                            <input
                                {...register('loomNo')}
                                className="input mt-1"
                                placeholder="Loom No"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Vendor {watchSourceType !== 'BRUSHED_FABRIC' && <span className="text-red-500">*</span>}</label>
                            <select
                                {...register('vendorId', { required: watchSourceType !== 'BRUSHED_FABRIC' })}
                                className="input mt-1"
                                required={watchSourceType !== 'BRUSHED_FABRIC'}
                            >
                                <option value="">Select a Vendor</option>
                                {vendorList?.map((vendor: any) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.vendorName}
                                    </option>
                                ))}
                            </select>
                            {errors.vendorId && <p className="text-red-500 text-xs mt-1">Vendor is required</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Piece No</label>
                            <input
                                {...register('pieceNo')}
                                className="input mt-1 bg-gray-100"
                                placeholder="Piece No"
                                type="text"
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Sort No <span className="text-red-500">*</span></label>
                            <input type="hidden" {...register('fabricCode', { required: 'Sort No is required' })} />
                            <CommonSearchableSelect
                                options={fabricCodeOptions}
                                value={selectedFabricMasterId ? String(selectedFabricMasterId) : ''}
                                onChange={(val) => {
                                    const fabric = fabricMasterArray.find((f: any) => String(f.id) === val);
                                    if (fabric) {
                                        setSelectedFabricMasterId(fabric.id);
                                        setValue('fabricCode', fabric.fabricCode || fabric.code || '', { shouldValidate: true });
                                        setValue('fabricQuality', fabric.fabricQuality || fabric.quality || '', { shouldValidate: true });
                                    }
                                }}
                                placeholder="Select Sort No"
                                required
                                error={errors.fabricCode?.message as string}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Construction <span className="text-red-500">*</span></label>
                            <input
                                {...register('fabricQuality', { required: true })}
                                className="input mt-1"
                                placeholder="Construction"
                                type="text"
                            />
                            {errors.fabricQuality && <p className="text-red-500 text-xs mt-1">Construction is required</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Piece Meters <span className="text-red-500">*</span></label>
                            <input
                                {...register('pieceMeters', { required: true })}
                                className="input mt-1 bg-gray-100"
                                placeholder="Piece Meters"
                                type="number"
                                readOnly
                                required
                            />
                            {errors.pieceMeters && <p className="text-red-500 text-xs mt-1">Piece Meters is required</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Inspector <span className="text-red-500">*</span></label>
                            <CommonSearchableSelect
                                {...inspectorRest}
                                ref={inspectorRef}
                                options={inspectorOptions}
                                filterActive
                                placeholder="Select Inspector"
                                value={watch('inspectorId') || ''}
                                onValueChange={(value) => inspectorOnChange?.({
                                    target: { name: 'inspectorId', value },
                                    currentTarget: { name: 'inspectorId', value },
                                    preventDefault: () => { },
                                    stopPropagation: () => { }
                                } as any)}
                                className="mt-1"
                                error={errors.inspectorId?.message as string}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700">Net Weight <span className="text-red-500">*</span></label>
                            <input
                                {...register('netWeight', { required: true })}
                                className="input mt-1 bg-gray-100"
                                placeholder="Net Weight"
                                type="number"
                                readOnly
                                required
                            />
                            {errors.netWeight && <p className="text-red-500 text-xs mt-1">Net Weight is required</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart size={20} /> Inspection Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-200 border border-gray-300">
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">S.No</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Piece No</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Inspected Meter</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Actual Net Weight</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Avg Weight</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inspectionDetails.length > 0 ? (
                                        inspectionDetails.map((field, index) => (
                                            <tr key={index} className="border border-gray-300 hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={index + 1}
                                                        className="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded"
                                                        readOnly
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={field.pieceNo}
                                                        onChange={e => {
                                                            const details = [...inspectionDetails];
                                                            details[index].pieceNo = e.target.value;
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Piece No"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={field.inspectedMeters}
                                                        onChange={e => {
                                                            const details = [...inspectionDetails];
                                                            details[index].inspectedMeters = e.target.value;
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Inspected Meters"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={field.actualNetWeight}
                                                        onChange={e => {
                                                            const v = e.target.value;
                                                            const details = [...inspectionDetails];
                                                            details[index].actualNetWeight = v;
                                                            setInspectionDetails(details);
                                                            if ((watch('netWeight') || '').toString() !== v) setValue('netWeight', v);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Net Weight"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        value={field.avgWeight || ''}
                                                        onChange={e => {
                                                            const details = [...inspectionDetails];
                                                            details[index].avgWeight = e.target.value;
                                                            setInspectionDetails(details);
                                                        }}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        placeholder="Avg Weight"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={field.grade}
                                                        className="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded"
                                                        placeholder="Grade"
                                                        readOnly
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                                                No inspection details available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart size={20} /> Inspection Entry
                            </CardTitle>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={noDefected}
                                    onChange={(e) => {
                                        const v = e.target.checked;
                                        setNoDefected(v);
                                        const gradeAEntry = normalizedGradeList.find(
                                            (g: any) => normalizeGradeNameValue(g.gradeName) === "grade a"
                                        );
                                        if (v) {
                                            setInspectionEntries([]);
                                            if (inspectionDetails.length > 0) {
                                                setInspectionDetails(inspectionDetails.map(d => ({
                                                    ...d,
                                                    totalDefectPoints: "0",
                                                    defectCounts: "0",
                                                    grade: "Grade A",
                                                    gradeId: gradeAEntry?.id ?? undefined
                                                })));
                                            }
                                        } else {
                                            if (inspectionDetails.length > 0) {
                                                setInspectionDetails(inspectionDetails.map(d => ({
                                                    ...d,
                                                    grade: "",
                                                    gradeId: undefined
                                                })));
                                            }
                                        }
                                    }}
                                //                                     onChange={(e) => {
                                //                                         const v = e.target.checked;
                                //                                         setNoDefected(v);
                                //                                                                             const gradeAEntry = normalizedGradeList.find(
                                //     (g: any) => normalizeGradeNameValue(g.gradeName) === "grade a"
                                // );
                                //                                         if (v) {

                                //                                             setInspectionEntries([]);
                                //                                            if (inspectionDetails.length > 0) {
                                //                                                 setInspectionDetails(inspectionDetails.map(d => ({ ...d, totalDefectPoints: "0", defectCounts: "0", grade: "Grade A" })));
                                //                                             }
                                //                                         } else {
                                //                                             if (inspectionDetails.length > 0) {
                                //                                                 setInspectionDetails(inspectionDetails.map(d => ({ ...d, grade: "" })));
                                //                                             }
                                //                                         }
                                //                                     }}
                                />
                                No Defected Pieces
                            </label>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Defected Meters</label>
                                <input
                                    name="defectedMeters"
                                    value={newItem.defectedMeters || ''}
                                    onChange={handleChange}
                                    className="input mt-1"
                                    type="number"
                                    placeholder="Defected Meters"
                                    disabled={noDefected}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">From Meter</label>
                                <input
                                    name="fromMeters"
                                    value={newItem.fromMeters || ''}
                                    onChange={handleChange}
                                    className="input mt-1"
                                    type="number"
                                    placeholder="From Meters"
                                    disabled={noDefected}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">To Meter</label>
                                <input
                                    name="toMeters"
                                    value={newItem.toMeters || ''}
                                    onChange={handleChange}
                                    className="input mt-1"
                                    type="number"
                                    placeholder="To Meters"
                                    disabled={noDefected}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Defect Type</label>
                                <CommonSearchableSelect
                                    options={defectTypeOptions}
                                    filterActive
                                    placeholder="Select a Defect Type"
                                    value={newItem.defectTypeId || ''}
                                    onValueChange={(value) => handleDefectTypeChange(value || '')}
                                    className="mt-1"
                                    disabled={noDefected}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Defect Points</label>
                                <input
                                    name="defectPoints"
                                    value={newItem.defectPoints || ''}
                                    className="input mt-1 bg-gray-100"
                                    type="number"
                                    placeholder="Defect Points"
                                    readOnly
                                />
                            </div>
                        </div>

                        <Button onClick={addItem} className="mt-4 ml-auto flex items-center" disabled={noDefected}>
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
                                    <th className="border p-2">Defected Meters</th>
                                    <th className="border p-2">From Meters</th>
                                    <th className="border p-2">To Meters</th>
                                    <th className="border p-2">Defect Type</th>
                                    <th className="border p-2">Defect Points</th>
                                    <th className="border p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspectionEntries.map((item, index) => {
                                    const defectType = defectMasterList?.find((defect: any) =>
                                        defect.id.toString() === item.defectTypeId
                                    );

                                    return (
                                        <tr key={index} className="border">
                                            <td className="border p-2">{index + 1}</td>
                                            <td className="border p-2">{item.defectedMeters}</td>
                                            <td className="border p-2">{item.fromMeters}</td>
                                            <td className="border p-2">{item.toMeters}</td>
                                            <td className="border p-2">{defectType?.defectName || item.defectTypeId}</td>
                                            <td className="border p-2">{item.defectPoints}</td>
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
            </div>

            <div className="flex justify-end mt-6">
                <Button
                    onClick={handleSubmit(onSubmit)}
                    className="bg-primary hover:bg-primary text-white px-6 flex items-center"
                    disabled={!isInspectionValid || (!noDefected && inspectionEntries.length === 0)}
                >
                    <Save size={18} className="mr-2" />
                    {isEdit ? "Update Fabric Inspect" : "Save Fabric Inspect"}
                </Button>
            </div>
        </div>
    );
}