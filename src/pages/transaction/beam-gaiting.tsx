
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllFactoryBeamInwards, getFactoryBeamInwardsByFactoryCompanyId } from "@/state/factoryBeamInwardSlice";
import { createBeamGaiting, updateBeamGaiting, getAllBeamGaitings } from "@/state/beamGaitingSlice";
import { getAllBeamCuts } from "@/state/beamCutSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllFlanges } from "@/state/flangeSlice";
import { getAllWeavingContract } from "@/state/weavingContractSlice";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId } from "@/state/weavingJobWorkOrderSlice";
import { getAllSubCategories, getSubCategoryByCategory } from "@/state/subCategorySlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllBeamStockByCompany } from "@/state/beamStockSlice";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import documentNumberService from "@/services/DocumentNumberService";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";

interface BeamDetailRow {
  id?: number;
  beamNo: string;
  flangeNo?: string;
  flangeId?: string;
  fabricCodeQuality?: string;
  originalFabricCodeQuality?: string;
  beamMeter?: string;
  onLoomMtr?: string;
  shrinkage?: string;
  expectedFabricMeter?: string;
  gatingPicks?: string;
  isDoffedBeam?: number;
  sizingSetNo?: string;
  warpCount?: string;
  warpYarnMillName?: string;
  warpYarnLotNo?: string;
  weftCount?: string;
  weftYarnMillName?: string;
  weftYarnLotNo?: string;
  salesOrderNo?: string;
}

interface FormData {
  id?: number;
  beamGatingNo: string;
  gaitingDate: string;
  loomId: string;
  gaitingType: string;
  fabricMasterId?: string;
  shed?: string;
  shedId?: string;
  group?: string;
  groupId?: string;
  effectFrom?: string;
  effectiveDate?: string;
  noOfBeamsInput: string;
  noOfFabricOutput: string;
  fabricPanel: string;
  beamGatingDetails: BeamDetailRow[];
}

const GATING_TYPE_OPTIONS = [
  { value: "Gaiting", label: "Gaiting" },
  { value: "Knotting", label: "Knotting" },
  { value: "Sort Change", label: "Sort Change" },
];

const EFFECT_FROM_OPTIONS = [
  { value: "Now", label: "Now" },
  { value: "Next Run", label: "Next Run" },
  { value: "Knotting & Gaiting", label: "Knotting & Gaiting" },
  { value: "Time", label: "Time" },
];

const formatForDateInput = (dateVal?: Date | string | null): string => {
  if (!dateVal) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatForDateTimeInput = (dateVal?: Date | string | null): string => {
  if (!dateVal) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed.includes('Z') && !trimmed.includes('+') && trimmed.length >= 16) {
      const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
      if (match) {
        return `${match[1]}T${match[2]}`;
      }
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function BeamGaitingEntry() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state as any;
  const isEditMode = !!editData?.id;

  const { loomList } = useSelector((state: RootState) => state.loomMaster as any);
  const { list: factoryBeamInwardList } = useSelector((state: RootState) => state.factoryBeamInward as any);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
  const { flangeList } = useSelector((state: RootState) => state.flange as any);
  const { list: beamGatingList } = useSelector((state: RootState) => state.beamGaiting as any);
  const { weavingContractList } = useSelector((state: RootState) => state.weavingContracts as any);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { list: beamCutList } = useSelector((state: RootState) => state.beamCut as any);
  const { subCategoryList, subCategoryByCategoryList } = useSelector((state: RootState) => (state.subCategory as any) || {});
  const { yarnList } = useSelector((state: RootState) => (state.yarn as any) || {});
  const { stockList } = useSelector((state: RootState) => state.beamStock);

  const { register, handleSubmit, setValue, watch, reset, getValues, formState: { errors } } = useForm<FormData>();

  const noOfBeamsInput = watch('noOfBeamsInput');
  const noOfFabricOutput = watch('noOfFabricOutput');
  const gatingTypeValue = watch('gaitingType');

  const calculatedFabricPanel = useMemo(() => {
    const beamsStr = String(noOfBeamsInput ?? '').trim();
    const outputStr = String(noOfFabricOutput ?? '').trim();
    if (!beamsStr || !outputStr) return '';
    const beams = parseFloat(beamsStr);
    const output = parseFloat(outputStr);
    if (!isNaN(beams) && beams > 0 && !isNaN(output) && output >= 0) {
      const val = output / beams;
      return Number.isInteger(val) ? String(val) : String(Number(val.toFixed(3)));
    }
    return '';
  }, [noOfBeamsInput, noOfFabricOutput]);

  const [rows, setRows] = useState<BeamDetailRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formEditing, setFormEditing] = useState<boolean>(!isEditMode);
  const [selectedBeams, setSelectedBeams] = useState<Set<string>>(new Set());
  const [originalNoOfBeams, setOriginalNoOfBeams] = useState<string>('');
  const [hasBeamsCountChanged, setHasBeamsCountChanged] = useState(false);
  const [fabricPanelWidth, setFabricPanelWidth] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);
  const isEditInitialLoadRef = useRef(false);

  // Generate document number using useAutoDocumentNumber
  useAutoDocumentNumber({
    screenName: 'Beam Gating',
    detail: editData,
    existingValue: editData?.beamGatingNo,
    fieldName: 'beamGatingNo',
    setValue,
    isSavingRef,
  });

  useEffect(() => {
    if (editData?.beamGatingNo) {
      setValue('beamGatingNo', editData.beamGatingNo);
    }
  }, [editData, setValue]);

  useEffect(() => {
    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const cid = v ? Number(v) : undefined;
    dispatch(getAllLooms(cid ? { companyId: cid } as any : ({} as any)));
    if (cid) dispatch(getFactoryBeamInwardsByFactoryCompanyId(cid) as any);
    else dispatch(getAllFactoryBeamInwards({ fetchAll: true } as any) as any);
    dispatch(getAllFabricMasters({ fetchAll: true } as any));
    dispatch(getAllFlanges(cid ? { companyId: cid } as any : ({} as any)));
    dispatch(getAllBeamGaitings({ fetchAll: true } as any));
    dispatch(getAllBeamCuts(cid ? { companyId: cid, fetchAll: true } as any : { fetchAll: true } as any));
    dispatch(getAllWeavingContract({ fetchAll: true } as any));
    dispatch(getAllSubCategories({ fetchAll: true } as any));
    dispatch(getSubCategoryByCategory({ categoryName: "Shed", fetchAll: true }) as any);
    dispatch(getSubCategoryByCategory({ categoryName: "Group", fetchAll: true }) as any);
    dispatch(getAllYarnMasters({ fetchAll: true } as any));
    if (cid) {
      dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId({
        factoryCompanyId: cid,
      }) as any);
      dispatch(getAllBeamStockByCompany({ companyId: cid, fetchAll: true }) as any);
    } else {
      dispatch(getAllWeavingJobWorkOrders({ fetchAll: true } as any));
      dispatch(getAllBeamStockByCompany({ fetchAll: true }) as any);
    }
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode) {
      isEditInitialLoadRef.current = true;
      reset({
        gaitingDate: editData.gaitingDate ? formatForDateInput(editData.gaitingDate) : formatForDateInput(),
        loomId: String(editData.loomId ?? ''),
        gaitingType: String(editData.gaitingType ?? editData.gatingType ?? 'Gating'),
        fabricMasterId: editData.fabricMasterId != null ? String(editData.fabricMasterId) : (editData.beamGatingDetails?.[0]?.fabricMasterId != null ? String(editData.beamGatingDetails[0].fabricMasterId) : ''),
        shed: String(editData.shed ?? ''),
        shedId: editData.shedId != null ? String(editData.shedId) : '',
        group: String(editData.group ?? ''),
        groupId: editData.groupId != null ? String(editData.groupId) : '',
        effectFrom: String(editData.effectFrom ?? 'Now'),
        effectiveDate: editData.effectiveDate ? formatForDateTimeInput(editData.effectiveDate) : (editData.effectFrom === 'Time' ? formatForDateTimeInput() : ''),
        noOfBeamsInput: String(editData.noOfBeamsInput ?? editData.noOfBeamInput ?? ''),
        noOfFabricOutput: String(editData.noOfFabricOutput ?? ''),
        fabricPanel: String(editData.fabricPanel ?? ''),
        beamGatingDetails: [],
      } as any);
      
      // Store original no of beams for change tracking
      const originalBeams = String(editData.noOfBeamsInput ?? editData.noOfBeamInput ?? '');
      setOriginalNoOfBeams(originalBeams);
      
      const arr = Array.isArray(editData.beamGatingDetails) ? editData.beamGatingDetails : (Array.isArray(editData.beamDetails) ? editData.beamDetails : []);
      setRows(arr.map((d: any) => {
        const beamMeterValue = String(d.beamMeter ?? d.wrapMeters ?? '');
        const shrinkageValue = String(d.shrinkage ?? '');
        const originalCode = String(d.fabricCodeQuality ?? editData.fabricCodeQuality ?? '').split(' - ')[0]?.trim();
        const changedCode = d.changedFabricCodeQuality ? String(d.changedFabricCodeQuality).split(' - ')[0]?.trim() : undefined;
        const beamNoStr = String(d.beamNo ?? d.sizedBeamNo ?? '');
        const stockMatch = (stockList || []).find((s: any) => String(s.sizedBeamNo || '').trim() === beamNoStr.trim());
        const onLoomMtrValue = d.onLoomMtr != null ? String(d.onLoomMtr) : (stockMatch?.onLoomMtr != null ? String(stockMatch.onLoomMtr) : '');
        return {
          id: Number(d.id),
          beamNo: beamNoStr,
          flangeNo: String(d.flangeNo ?? ''),
          flangeId: d.flangeId != null ? String(d.flangeId) : '',
          fabricCodeQuality: changedCode || originalCode,
          originalFabricCodeQuality: originalCode,
          beamMeter: beamMeterValue,
          onLoomMtr: onLoomMtrValue,
          shrinkage: shrinkageValue,
          expectedFabricMeter: String(d.expectedFabricMeter ?? ''),
          gatingPicks: String(d.gatingPicks ?? ''),
          isDoffedBeam: d.isDoffedBeam != null ? Number(d.isDoffedBeam) : 0,
          sizingSetNo: String(d.sizingSetNo ?? ''),
          warpCount: String(d.warpCount ?? ''),
          warpYarnMillName: String(d.warpYarnMillName ?? ''),
          warpYarnLotNo: String(d.warpYarnLotNo ?? ''),
          weftCount: String(d.weftCount ?? ''),
          weftYarnMillName: String(d.weftYarnMillName ?? ''),
          weftYarnLotNo: String(d.weftYarnLotNo ?? ''),
          salesOrderNo: String(d.salesOrderNo ?? d.orderNo ?? stockMatch?.salesOrderNo ?? ''),
        };
      }));

    } else {
      reset({
        beamGatingNo: '',
        gaitingDate: formatForDateInput(),
        loomId: '',
        gaitingType: 'Gating',
        shed: '',
        shedId: '',
        group: '',
        groupId: '',
        effectFrom: 'Now',
        effectiveDate: '',
        noOfBeamsInput: '',
        noOfFabricOutput: '',
        fabricPanel: '',
      } as any);
      setRows([]);
      setEditingIndex(0);
      setOriginalNoOfBeams('');
      setHasBeamsCountChanged(false);
    }
  }, [isEditMode, editData, reset]);

  useEffect(() => {
    if (!stockList.length) return;

    setRows(currentRows => {
      let changed = false;
      const nextRows = currentRows.map(row => {
        if (row.salesOrderNo?.trim()) return row;

        const beamNo = String(row.beamNo || '').trim();
        const stockMatch = stockList.find(
          stock => String(stock?.sizedBeamNo || '').trim() === beamNo
        );
        const salesOrderNo = String(stockMatch?.salesOrderNo ?? '').trim();
        if (!salesOrderNo) return row;

        changed = true;
        return { ...row, salesOrderNo };
      });

      return changed ? nextRows : currentRows;
    });
  }, [rows, stockList]);

  useEffect(() => {
    setFormEditing(!isEditMode);
  }, [isEditMode]);

  // Watch for noOfBeamsInput changes during edit mode and reset beam details
  useEffect(() => {
    if (isEditMode && originalNoOfBeams && noOfBeamsInput) {
      if (noOfBeamsInput !== originalNoOfBeams) {
        setHasBeamsCountChanged(true);
        
        // Reset beam details completely
        const beamsCount = parseInt(noOfBeamsInput || '0');
        if (beamsCount > 0) {
          const newRows = Array.from({ length: beamsCount }, () => ({
            id: undefined,
            beamNo: '',
            flangeNo: '',
            flangeId: '',
            fabricCodeQuality: '',
            originalFabricCodeQuality: '',
            beamMeter: '',
            shrinkage: '',
            expectedFabricMeter: '',
            gatingPicks: '',
            isDoffedBeam: 0,
            sizingSetNo: '',
            warpCount: '',
            warpYarnMillName: '',
            warpYarnLotNo: '',
            weftCount: '',
            weftYarnMillName: '',
            weftYarnLotNo: '',
          }));
          setRows(newRows);
          setSelectedBeams(new Set());
          // Enable editing for all rows by setting editingIndex to 0 and formEditing to true
          setEditingIndex(0);
          setFormEditing(true);
        } else {
          setRows([]);
          setSelectedBeams(new Set());
          setEditingIndex(null);
          setFormEditing(true);
        }
      } else {
        setHasBeamsCountChanged(false);
      }
    }
  }, [noOfBeamsInput, originalNoOfBeams, isEditMode]);

  // Watch for noOfBeamsInput changes during create mode and refresh beam details
  useEffect(() => {
    if (!isEditMode && noOfBeamsInput) {
      const beamsCount = parseInt(noOfBeamsInput || '0');
      
      // Reset beam details completely
      if (beamsCount > 0) {
        const newRows = Array.from({ length: beamsCount }, () => ({
          id: undefined,
          beamNo: '',
          flangeNo: '',
          flangeId: '',
          fabricCodeQuality: '',
          originalFabricCodeQuality: '',
          beamMeter: '',
          shrinkage: '',
          expectedFabricMeter: '',
          gatingPicks: '',
          isDoffedBeam: 0,
          sizingSetNo: '',
          warpCount: '',
          warpYarnMillName: '',
          warpYarnLotNo: '',
          weftCount: '',
          weftYarnMillName: '',
          weftYarnLotNo: '',
        }));
        setRows(newRows);
        setSelectedBeams(new Set());
        // Enable editing for all rows by setting editingIndex to 0
        setEditingIndex(0);
        setFormEditing(true);
      } else {
        setRows([]);
        setSelectedBeams(new Set());
        setEditingIndex(null);
        setFormEditing(true);
      }
    }
  }, [noOfBeamsInput, isEditMode]);

  const completedBeamNos = useMemo(() => {
    const raw: any = beamGatingList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const set = new Set<string>();
    arr.forEach((g: any) => {
      const details: any[] = Array.isArray(g?.beamGatingDetails) ? g.beamGatingDetails : (Array.isArray(g?.beamDetails) ? g.beamDetails : []);
      details.forEach((d: any) => {
        if (Number(d?.isProductionCompleted) === 1) {
          const bn = String(d?.beamNo ?? d?.sizedBeamNo ?? '').trim();
          if (bn) set.add(bn);
        }
      });
    });
    return set;
  }, [beamGatingList]);

  const existingGatedBeamNos = useMemo(() => {
    const raw: any = beamGatingList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const set = new Set<string>();
    const currentEditId = editData?.id != null ? String(editData.id) : null;
    const isSortChange = String(gatingTypeValue || '').trim().toLowerCase() === 'sort change';

    arr.forEach((g: any) => {
      // If editing an existing beam gaiting record, skip the details of that record
      if (currentEditId && String(g?.id) === currentEditId) {
        return;
      }
      const details: any[] = Array.isArray(g?.beamGatingDetails)
        ? g.beamGatingDetails
        : (Array.isArray(g?.beamDetails) ? g.beamDetails : []);
      details.forEach((d: any) => {
        if (isSortChange && Number(d?.isBeamCut) === 1) return;
        const bn = String(d?.beamNo ?? d?.sizedBeamNo ?? '').trim();
        if (bn) set.add(bn);
      });
    });
    return set;
  }, [beamGatingList, editData?.id, gatingTypeValue]);

  const loomOptions = useMemo(() => {
    const raw: any = loomList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const filtered = arr.filter((l: any) => (l?.isBeamGating === 0 || l?.isBeamGating == null));
    return filtered.map((l: any) => ({
      value: String(l.id),
      label: String(l.loomNo || l.loomName || l.name || l.id),
      activeFlag: l?.activeFlag ?? true,
    }));
  }, [loomList]);

  const millOptions = useMemo(() => {
    const raw: any = (subCategoryList && subCategoryList.length > 0) ? subCategoryList : subCategoryByCategoryList;
    const list: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
    return list.filter((sc: any) => {
      const catName = String(sc?.categoryName || sc?.category?.categoryName || sc?.category_name || '').trim().toLowerCase();
      const isActive = sc?.isActive !== false && sc?.activeFlag !== false;
      return catName === 'mill' && isActive;
    });
  }, [subCategoryList, subCategoryByCategoryList]);

  const millSelectOptions = useMemo(() => {
    return millOptions.map((sc: any) => ({
      value: sc.subCategoryName,
      label: sc.subCategoryName,
    }));
  }, [millOptions]);

  const shedOptions = useMemo(() => {
    const rawAll: any = subCategoryList;
    const listAll: any[] = Array.isArray(rawAll) ? rawAll : (Array.isArray(rawAll?.data) ? rawAll.data : []);
    const filteredFromAll = listAll.filter((sc: any) => {
      const catName = String(sc?.categoryName || sc?.category?.categoryName || sc?.category_name || '').trim().toLowerCase();
      const isActive = sc?.isActive !== false && sc?.activeFlag !== false;
      return catName === 'shed' && isActive;
    });
    if (filteredFromAll.length > 0) return filteredFromAll;

    const rawByCat: any = subCategoryByCategoryList;
    const listByCat: any[] = Array.isArray(rawByCat) ? rawByCat : (Array.isArray(rawByCat?.data) ? rawByCat.data : []);
    return listByCat.filter((sc: any) => {
      const catName = String(sc?.categoryName || sc?.category?.categoryName || sc?.category_name || '').trim().toLowerCase();
      const isActive = sc?.isActive !== false && sc?.activeFlag !== false;
      return (catName === 'shed' || !catName) && isActive;
    });
  }, [subCategoryList, subCategoryByCategoryList]);

  const shedSelectOptions = useMemo(() => {
    return shedOptions
      .map((sc: any) => {
        const val = sc.subcategoryName || sc.subCategoryName || sc.name;
        return val ? { value: String(val), label: String(val) } : null;
      })
      .filter((opt): opt is { value: string; label: string } => opt !== null);
  }, [shedOptions]);

  const groupOptions = useMemo(() => {
    const raw: any = subCategoryList;
    const list: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
    return list.filter((sc: any) => {
      const catName = String(sc?.categoryName || sc?.category?.categoryName || sc?.category_name || '').trim().toLowerCase();
      const isActive = sc?.isActive !== false && sc?.activeFlag !== false;
      return catName === 'group' && isActive;
    });
  }, [subCategoryList]);

  const groupSelectOptions = useMemo(() => {
    return groupOptions
      .map((sc: any) => {
        const val = sc.subcategoryName || sc.subCategoryName || sc.name;
        return val ? { value: String(val), label: String(val) } : null;
      })
      .filter((opt): opt is { value: string; label: string } => opt !== null);
  }, [groupOptions]);

  const yarnOptions = useMemo(() => {
    const raw: any = yarnList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const setYarns = new Set<string>();
    arr.forEach((y: any) => {
      const name = y?.yarnName != null ? String(y.yarnName).trim() : '';
      if (name) setYarns.add(name);
    });
    return Array.from(setYarns).map(name => ({ value: name, label: name }));
  }, [yarnList]);

  const loomIdVal = watch('loomId');

  useEffect(() => {
    if (loomIdVal) {
      const raw: any = loomList as any;
      const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const selectedLoom = arr.find((l: any) => String(l.id) === String(loomIdVal));
      if (selectedLoom) {
        if (selectedLoom.shedId != null) {
          setValue('shedId', String(selectedLoom.shedId));
          const shedObj = (subCategoryList || []).find((sc: any) => String(sc.id) === String(selectedLoom.shedId));
          const shedName = shedObj?.subCategoryName || shedObj?.subcategoryName || selectedLoom.shedName || selectedLoom.shed || '';
          if (shedName) setValue('shed', shedName);
        }
        if (selectedLoom.groupId != null) {
          setValue('groupId', String(selectedLoom.groupId));
          const groupObj = (subCategoryList || []).find((sc: any) => String(sc.id) === String(selectedLoom.groupId));
          const groupName = groupObj?.subCategoryName || groupObj?.subcategoryName || selectedLoom.groupName || selectedLoom.group || '';
          if (groupName) setValue('group', groupName);
        }
      }
    }
  }, [loomIdVal, loomList, subCategoryList, setValue]);

  const fabricPanelVal = watch('fabricPanel');

  const normalizedWeavingContracts = useMemo(() => {
    if (Array.isArray(weavingContractList)) return weavingContractList;
    if (Array.isArray((weavingContractList as any)?.data)) return (weavingContractList as any).data;
    return [];
  }, [weavingContractList]);

  const normalizedWeavingJobWorkOrders = useMemo(() => {
    if (Array.isArray(weavingJobWorkOrderList)) return weavingJobWorkOrderList;
    if (Array.isArray((weavingJobWorkOrderList as any)?.data)) return (weavingJobWorkOrderList as any).data;
    return [];
  }, [weavingJobWorkOrderList]);

  const weavingContractNoLookup = useMemo(() => {
    const map = new Map<string, string>();
    normalizedWeavingContracts.forEach((contract: any) => {
      const id = contract?.id;
      if (id == null) return;
      const label = contract?.weavingContractNo || contract?.contractNo;
      if (label) map.set(String(id), label);
    });
    return map;
  }, [normalizedWeavingContracts]);

  const weavingWorkOrderNoLookup = useMemo(() => {
    const map = new Map<string, string>();
    normalizedWeavingJobWorkOrders.forEach((order: any) => {
      const id = order?.id;
      if (id == null) return;
      const label = order?.weavingWorkOrderNo || order?.jobWorkOrderNo || order?.orderNo;
      if (label) map.set(String(id), label);
    });
    return map;
  }, [normalizedWeavingJobWorkOrders]);

  const loomOptionsWithCurrent = useMemo(() => {
    const map = new Map<string, { value: string; label: string; activeFlag: boolean }>();
    loomOptions.forEach((o) => map.set(String(o.value), { value: o.value, label: o.label, activeFlag: o.activeFlag ?? true }));
    const currentId = String(loomIdVal || editData?.loomId || '').trim();
    if (currentId) {
      const raw: any = loomList as any;
      const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const f = arr.find((l: any) => String(l?.id) === currentId);
      const label = f ? String(f.loomNo || f.loomName || f.name || f.id) : currentId;
      if (!map.has(currentId)) map.set(currentId, { value: currentId, label, activeFlag: true });
    }
    return Array.from(map.values());
  }, [loomOptions, loomList, editData, loomIdVal]);

  const fabricMasterSelectOptions = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    return arr.map((f: any) => {
      const code = String(f?.fabricCode || '').trim();
      const quality = String(f?.fabricQuality || f?.construction || f?.quality || f?.fabricName || '').trim();
      const labelStr = code && quality ? `${code} - ${quality}` : code || quality || String(f.id);
      return {
        value: String(f.id),
        label: labelStr,
      };
    });
  }, [fabricMasterList]);

  const fabricMasterById = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, any>();
    arr.forEach((f: any) => { if (f?.id != null) map.set(String(f.id), f); });
    return map;
  }, [fabricMasterList]);

  const fabricMasterIdVal = watch('fabricMasterId');

  useEffect(() => {
    if (fabricMasterIdVal) {
      const raw: any = fabricMasterList as any;
      const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      const fabric = arr.find((f: any) => String(f.id) === String(fabricMasterIdVal));
      if (fabric) {
        const widthVal = fabric.fabricWidth || fabric.reedspace || fabric.reedSpace || fabric.width || fabric.fabric_width || '';
        setFabricPanelWidth(String(widthVal ?? ''));
      } else {
        setFabricPanelWidth('');
      }
    } else {
      setFabricPanelWidth('');
    }
  }, [fabricMasterIdVal, fabricMasterList]);

  // Synchronize calculated Fabric Panel value into form state
  useEffect(() => {
    setValue('fabricPanel', calculatedFabricPanel, { shouldValidate: true });
  }, [calculatedFabricPanel, setValue]);

  const beamCutFabricCodeByBeamNo = useMemo(() => {
    const arr: any[] = Array.isArray(beamCutList) ? beamCutList : [];
    const map = new Map<string, string>();
    arr.forEach((cut: any) => {
      (Array.isArray(cut?.beamDetails) ? cut.beamDetails : []).forEach((bd: any) => {
        const beamNo = String(bd?.beamNo || '').trim();
        if (!beamNo || bd?.fabricMasterId == null) return;
        const fabric = fabricMasterById.get(String(bd.fabricMasterId));
        const code = fabric?.fabricCode != null ? String(fabric.fabricCode) : '';
        if (code && !map.has(beamNo)) map.set(beamNo, code);
      });
    });
    return map;
  }, [beamCutList, fabricMasterById]);

  const allSizedBeams = useMemo(() => {
    const raw: any = factoryBeamInwardList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const flat: any[] = [];

    const selectedFabric = fabricMasterIdVal ? (Array.isArray(fabricMasterList) ? fabricMasterList : []).find((f: any) => String(f.id) === String(fabricMasterIdVal)) : null;
    const targetIdStr = fabricMasterIdVal ? String(fabricMasterIdVal).trim() : '';
    const targetCode = selectedFabric?.fabricCode ? String(selectedFabric.fabricCode).trim().toLowerCase() : '';
    const targetQuality = selectedFabric?.fabricQuality ? String(selectedFabric.fabricQuality).trim().toLowerCase() : '';

    if (!targetIdStr && !targetCode) {
      return flat;
    }

    arr.forEach((fi: any) => {
      const includeByPending = Number(fi?.isBeamPending) === 1;
      const includeExternal = Number(fi?.orderTypeId) === 2;
      const hasCutBeam = (fi.beamDetails || fi.beamInwardBeamDetails || []).some((bd: any) => Number(bd?.isBeamCut) === 1);
      if (!includeByPending && !includeExternal && !hasCutBeam) return;

      (fi.beamDetails || fi.beamInwardBeamDetails || []).forEach((bd: any) => {
        const contractId = fi?.weavingContractId;
        const workOrderId = fi?.weavingWorkOrderId;
        const contractLookupValue = contractId != null ? weavingContractNoLookup.get(String(contractId)) : null;
        const workOrderLookupValue = workOrderId != null ? weavingWorkOrderNoLookup.get(String(workOrderId)) : null;
        const contractNo = contractLookupValue ?? fi?.weavingContractNo ?? fi?.contractNo ?? fi?.contract_no ?? null;
        const workOrderNo = workOrderLookupValue ?? fi?.weavingWorkOrderNo ?? fi?.jobWorkOrderNo ?? fi?.orderNo ?? null;
        const beamSizedNo = String(bd.sizedBeamNo || '');
        const isBeamCutFlag = Number(bd?.isBeamCut) === 1;
        const resolvedFabricCode = isBeamCutFlag
          ? (beamCutFabricCodeByBeamNo.get(beamSizedNo) || String(fi.fabricCodeQuality || ''))
          : (String(fi.fabricCodeQuality || '') || String(fi.beamInwardQualityDetails?.[0]?.fabricCode || fi.qualityDetails?.[0]?.fabricCode || ''));

        // Match against selected Sort No / Construction
        let matchesFabric = true;
        if (targetIdStr || targetCode) {
          const bdFabricId = bd?.fabricMasterId != null ? String(bd.fabricMasterId) : (fi?.fabricMasterId != null ? String(fi.fabricMasterId) : null);
          const matchesById = targetIdStr && bdFabricId ? String(bdFabricId) === targetIdStr : false;

          const codeLower = String(resolvedFabricCode || '').trim().toLowerCase();
          const matchesByCode = targetCode && codeLower ? (codeLower.includes(targetCode) || targetCode.includes(codeLower.split(' ')[0])) : false;
          const matchesByQuality = targetQuality && codeLower ? codeLower.includes(targetQuality) : false;

          matchesFabric = matchesById || matchesByCode || matchesByQuality;
        }

        if (matchesFabric) {
          flat.push({
            sizedBeamNo: beamSizedNo,
            flangeNo: String(bd.flangeNo || ''),
            flangeId: bd.flangeId != null ? String(bd.flangeId) : '',
            fabricCodeQuality: resolvedFabricCode,
            beamMeter: String(bd.wrapMeters != null ? bd.wrapMeters : ''),
            shrinkage: String(bd.shrinkage != null ? bd.shrinkage : ''),
            expectedFabricMeter: String(bd.expectedFabricMeter != null ? bd.expectedFabricMeter : ''),
            isBeamGating: bd?.isBeamGating,
            isBeamCut: bd?.isBeamCut,
            isBeamGated: bd?.isBeamGated,
            beamId: bd?.id,
            weavingContractId: contractId,
            weavingContractNo: contractNo,
            weavingWorkOrderId: workOrderId,
            weavingWorkOrderNo: workOrderNo,
            contractNo,
            orderNo: workOrderNo,
            orderTypeId: fi?.orderTypeId,
            sizingSetNo: fi?.sizingSetNo || '',
            warpCount: String(bd?.warpCount || ''),
            warpYarnMillName: String(bd?.warpYarnMillName || ''),
            warpYarnLotNo: String(bd?.warpYarnLotNo || ''),
          });
        }
      });
    });

    // 2. Process Beam Stock Beams (Additional logic from beam-stock)
    const rawStock: any[] = Array.isArray(stockList) ? stockList : Array.isArray((stockList as any)?.data) ? (stockList as any).data : [];
    rawStock.forEach((bs: any) => {
      const isBeamOutwarded = Number(bs?.isBeamOutwarded ?? 0) === 1;
      const isBeamGated = Number(bs?.isBeamGated ?? 0) === 1;
      if (isBeamOutwarded || isBeamGated) return;

      const beamSizedNo = String(bs.sizedBeamNo || '').trim();
      if (!beamSizedNo) return;

      // Match against selected Sort No / Construction
      let matchesFabric = true;
      if (targetIdStr || targetCode) {
        const bsFabricId = bs?.fabricMasterId != null ? String(bs.fabricMasterId) : (bs?.fabricId != null ? String(bs.fabricId) : null);
        const matchesById = targetIdStr && bsFabricId ? String(bsFabricId) === targetIdStr : false;

        const bsCode = String(bs.fabricCode || bs.quality || '').trim().toLowerCase();
        const matchesByCode = targetCode && bsCode ? (bsCode.includes(targetCode) || targetCode.includes(bsCode.split(' ')[0])) : false;
        const matchesByQuality = targetQuality && bsCode ? bsCode.includes(targetQuality) : false;

        matchesFabric = matchesById || matchesByCode || matchesByQuality;
      }

      if (matchesFabric) {
        flat.push({
          sizedBeamNo: beamSizedNo,
          flangeNo: String(bs.flangeNo || ''),
          flangeId: bs.flangeId != null ? String(bs.flangeId) : '',
          fabricCodeQuality: String(bs.fabricCode || bs.quality || ''),
          beamMeter: String(bs.wrapMeters != null ? bs.wrapMeters : ''),
          shrinkage: String(bs.shrinkage != null ? bs.shrinkage : ''),
          expectedFabricMeter: String(bs.expectedFabricMeter != null ? bs.expectedFabricMeter : ''),
          isBeamGating: bs?.isBeamGated,
          isBeamCut: 0,
          isBeamGated: bs?.isBeamGated,
          beamId: bs?.id,
          weavingContractId: bs?.weavingContractId,
          weavingContractNo: bs?.weavingContractNo,
          weavingWorkOrderId: null,
          weavingWorkOrderNo: null,
          contractNo: bs?.weavingContractNo,
          orderNo: bs?.salesOrderNo,
          salesOrderNo: bs?.salesOrderNo || '',
          orderTypeId: 2,
          sizingSetNo: bs?.sizingSetNo || '',
          warpCount: String(bs?.warpCount || ''),
          warpYarnMillName: String(bs?.warpYarnMillName || ''),
          warpYarnLotNo: String(bs?.warpYarnLotNo || ''),
          fabricPanelWidth: bs?.fabricPanelWidth,
          fromBeamStock: true,
        });
      }
    });

    return flat;
  }, [factoryBeamInwardList, stockList, fabricMasterIdVal, fabricMasterList, weavingContractNoLookup, weavingWorkOrderNoLookup, beamCutFabricCodeByBeamNo]);

  const beamOptions = useMemo(() => {
    const isSortChange = String(gatingTypeValue || '').trim().toLowerCase() === 'sort change';
    const uniq = new Map<string, any>();
    allSizedBeams.forEach(b => {
      const bn = String(b.sizedBeamNo || '').trim();
      const isCut = Number(b.isBeamCut) === 1;
      const isGatedFlag = (!isSortChange || !isCut) && (Number(b.isBeamGated ?? 0) === 1 || Number(b.isBeamGating ?? 0) === 1 || b.isBeamGated === true || b.isBeamGating === true);
      if (
        bn &&
        !completedBeamNos.has(bn) &&
        !existingGatedBeamNos.has(bn) &&
        !isGatedFlag
      ) {
        uniq.set(bn, b);
      }
    });
    return Array.from(uniq.values()).map(b => ({ value: b.sizedBeamNo, label: b.sizedBeamNo }));
  }, [allSizedBeams, completedBeamNos, existingGatedBeamNos, gatingTypeValue]);

  const beamOptionsWithCurrent = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    beamOptions.forEach(o => map.set(String(o.value), { value: String(o.value), label: String(o.label) }));
    rows.forEach(r => {
      const v = String(r.beamNo || '').trim();
      if (v && !map.has(v)) map.set(v, { value: v, label: v });
    });
    return Array.from(map.values());
  }, [beamOptions, rows]);

  const beamCutRemainingMeters = useMemo(() => {
    const raw: any[] = Array.isArray(beamCutList)
      ? beamCutList
      : Array.isArray((beamCutList as any)?.data)
        ? (beamCutList as any).data
        : [];

    const sorted = [...raw].sort((a: any, b: any) => {
      const dateA = new Date(a?.beamCutDate || a?.createdAt || 0).getTime();
      const dateB = new Date(b?.beamCutDate || b?.createdAt || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });

    const byLoomAndBeamNo = new Map<string, number>();
    const byBeamNo = new Map<string, number>();
    const byBeamId = new Map<string, number>();

    sorted.forEach((cut: any) => {
      const cutLoomId = String(cut?.loomId ?? cut?.loom_id ?? '').trim();
      const details: any[] = Array.isArray(cut?.beamDetails) ? cut.beamDetails : [];
      details.forEach((bd: any) => {
        const bn = String(bd?.beamNo || bd?.sizedBeamNo || '').trim();
        const bid = bd?.beamId != null ? String(bd.beamId).trim() : (bd?.beamDetailId != null ? String(bd.beamDetailId).trim() : '');
        const remaining = bd?.remainingMeters ?? bd?.remainingMeter;
        const val = typeof remaining === 'number' ? remaining : (remaining != null ? Number(remaining) : NaN);
        if (Number.isFinite(val)) {
          if (cutLoomId && bn && !byLoomAndBeamNo.has(`${cutLoomId}_${bn}`)) {
            byLoomAndBeamNo.set(`${cutLoomId}_${bn}`, val);
          }
          if (bn && !byBeamNo.has(bn)) {
            byBeamNo.set(bn, val);
          }
          if (bid && !byBeamId.has(bid)) {
            byBeamId.set(bid, val);
          }
        }
      });
    });

    return { byLoomAndBeamNo, byBeamNo, byBeamId };
  }, [beamCutList]);

  const doffedBeamMetersByNo = useMemo(() => {
    const map = new Map<string, number>();
    const raw: any = beamGatingList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    arr.forEach((g: any) => {
      const details: any[] = Array.isArray(g?.beamGatingDetails) ? g.beamGatingDetails : [];
      details.forEach((detail: any) => {
        if (Number(detail?.isDoffedBeam) !== 1) return;
        const key = String(detail?.beamNo || detail?.sizedBeamNo || '').trim();
        if (!key) return;
        const remaining = detail?.remainingMeters ?? detail?.remainingMeter;
        const value = typeof remaining === 'number' ? remaining : (remaining != null ? Number(remaining) : NaN);
        if (Number.isNaN(value)) return;
        map.set(key, value);
      });
    });
    return map;
  }, [beamGatingList]);

  const doffedBeamMetersById = useMemo(() => {
    const map = new Map<string, number>();
    const raw: any = beamGatingList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    arr.forEach((g: any) => {
      const details: any[] = Array.isArray(g?.beamGatingDetails) ? g.beamGatingDetails : [];
      details.forEach((detail: any) => {
        if (Number(detail?.isDoffedBeam) !== 1) return;
        const key = detail?.beamId ?? detail?.id;
        if (key == null) return;
        const remaining = detail?.remainingMeters ?? detail?.remainingMeter;
        const value = typeof remaining === 'number' ? remaining : (remaining != null ? Number(remaining) : NaN);
        if (Number.isNaN(value)) return;
        map.set(String(key), value);
      });
    });
    return map;
  }, [beamGatingList]);

  const resolveDoffedBeamMeterInput = useCallback((beamNo?: string, beamId?: string | number, loomId?: string | number) => {
    const isSortChange = String(gatingTypeValue || '').trim().toLowerCase() === 'sort change';
    if (!isSortChange) {
      return undefined;
    }

    const noKey = String(beamNo || '').trim();
    const idKey = beamId != null ? String(beamId).trim() : '';
    const loomKey = loomId != null ? String(loomId).trim() : '';

    // 1. Check from Beam Cut by loomId and beamNo
    if (loomKey && noKey && beamCutRemainingMeters.byLoomAndBeamNo.has(`${loomKey}_${noKey}`)) {
      return String(beamCutRemainingMeters.byLoomAndBeamNo.get(`${loomKey}_${noKey}`));
    }

    // 2. Check from Beam Cut by beamNo (latest cut for this beam)
    if (noKey && beamCutRemainingMeters.byBeamNo.has(noKey)) {
      return String(beamCutRemainingMeters.byBeamNo.get(noKey));
    }

    // 3. Check from Beam Cut by beamId
    if (idKey && beamCutRemainingMeters.byBeamId.has(idKey)) {
      return String(beamCutRemainingMeters.byBeamId.get(idKey));
    }

    // 4. Fallback to legacy doffed beam gating records
    if (noKey) {
      const value = doffedBeamMetersByNo.get(noKey);
      if (value != null) return String(value);
    }
    if (idKey) {
      const value = doffedBeamMetersById.get(idKey);
      if (value != null) return String(value);
    }
    return undefined;
  }, [beamCutRemainingMeters, doffedBeamMetersById, doffedBeamMetersByNo, gatingTypeValue]);

  const flangeOptionsByBeam = useMemo(() => {
    const map = new Map<string, { value: string; label: string }[]>();
    allSizedBeams.forEach((b: any) => {
      const key = b.sizedBeamNo;
      if (!key) return;
      const arr = map.get(key) || [];
      const val = b.flangeId ? String(b.flangeId) : '';
      const lbl = b.flangeNo ? String(b.flangeNo) : '';
      const allowed = b?.isBeamGating === 0 || b?.isBeamGating === '0' || b?.isBeamGating == null;
      if (allowed && val && lbl && !arr.some(o => o.value === val)) arr.push({ value: val, label: lbl });
      map.set(key, arr);
    });
    return map;
  }, [allSizedBeams]);

  const ppiMap = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((f: any) => { if (f?.fabricCode != null) map.set(String(f.fabricCode), String(f.ppi ?? '')); });
    return map;
  }, [fabricMasterList]);

  const fabricCodeOptions = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const mapCodeToOption = new Map<string, { value: string; label: string }>();
    arr.forEach((f: any) => {
      const code = f?.fabricCode != null ? String(f.fabricCode).trim() : '';
      if (code !== '') {
        const quality = f?.fabricQuality || f?.construction || f?.quality || f?.fabricName || '';
        const labelStr = quality ? `${code} / ${quality}` : code;
        if (!mapCodeToOption.has(code)) {
          mapCodeToOption.set(code, { value: code, label: labelStr });
        }
      }
    });
    return Array.from(mapCodeToOption.values());
  }, [fabricMasterList]);

  const fabricCodeOptionsByBeamNo = useMemo(() => {
    const map = new Map<string, { value: string; label: string }[]>();
    allSizedBeams.forEach((b: any) => {
      const key = String(b.sizedBeamNo || '').trim();
      if (!key || Number(b.isBeamCut) !== 1) return;
      const code = String(b.fabricCodeQuality || '').split(' - ')[0]?.trim();
      if (!code) return;
      const existing = map.get(key) || [];
      if (!existing.some(o => o.value === code)) existing.push({ value: code, label: code });
      map.set(key, existing);
    });
    return map;
  }, [allSizedBeams]);

  const fabricMasterByCode = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, any>();
    arr.forEach((fabric: any) => {
      const code = String(fabric?.fabricCode || '').trim();
      if (code) map.set(code, fabric);
    });
    return map;
  }, [fabricMasterList]);

  const autoFillByBeamNo = (beamNo: string) => {
    const found = allSizedBeams.find(b => String(b.sizedBeamNo) === String(beamNo));
    const stockMatch = (stockList || []).find((s: any) => String(s.sizedBeamNo || '').trim() === String(beamNo || '').trim());
    const onLoomMtrVal = stockMatch?.onLoomMtr != null ? String(stockMatch.onLoomMtr) : (found?.onLoomMtr != null ? String(found.onLoomMtr) : '');
    const code = String(found?.fabricCodeQuality || '').split(' - ')[0]?.trim();
    const flArr = flangeOptionsByBeam.get(String(beamNo)) || [];
    const firstFl = flArr[0];
    const doffedInput = resolveDoffedBeamMeterInput(beamNo, found?.beamId, loomIdVal);
    const fallbackBeamMeter = found?.beamMeter != null ? String(found.beamMeter) : '';
    const beamMeterValue = doffedInput ?? fallbackBeamMeter;
    const shrinkageValue = found?.shrinkage || '';
    const expectedFromCalc = computeExpectedFabricMeterValue(beamMeterValue, fabricPanelVal, shrinkageValue, onLoomMtrVal);
    return {
      flangeNo: firstFl?.label || String(found?.flangeNo || ''),
      flangeId: firstFl?.value || (found?.flangeId ? String(found.flangeId) : ''),
      fabricCodeQuality: code || '',
      originalFabricCodeQuality: code || '',
      beamMeter: beamMeterValue,
      onLoomMtr: onLoomMtrVal,
      shrinkage: shrinkageValue,
      expectedFabricMeter: expectedFromCalc ?? String(found?.expectedFabricMeter || ''),
      gatingPicks: (() => { const c = code; return (c && ppiMap.get(c)) || ''; })(),
      sizingSetNo: found?.sizingSetNo || '',
      warpCount: found?.warpCount || '',
      warpYarnMillName: found?.warpYarnMillName || '',
      warpYarnLotNo: found?.warpYarnLotNo || '',
      weftCount: found?.weftCount || '',
      salesOrderNo: stockMatch?.salesOrderNo || found?.salesOrderNo || '',
    };
  };

  const shrinkageMap = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((f: any) => {
      const code = f?.fabricCode != null ? String(f.fabricCode) : '';
      const wds: any[] = Array.isArray(f?.warpDetails) ? f.warpDetails : [];
      const nums = wds.map((w: any) => Number(w?.shrinkagePercent)).filter((n: number) => !Number.isNaN(n));
      if (code && nums.length > 0) {
        const avg = nums.reduce((a: number, b: number) => a + b, 0) / nums.length;
        map.set(code, String(Number(avg.toFixed(2))));
      }
    });
    return map;
  }, [fabricMasterList]);


  const parseInputNumber = (value?: string | number) => {
    if (value == null) return NaN;
    const trimmed = String(value).trim();
    if (trimmed === "") return NaN;
    return Number(trimmed);
  };

  const computeExpectedFabricMeterValue = (beamMeterValue?: string | number, fabricPanelValue?: string | number, shrinkageValue?: string | number, onLoomMtrValue?: string | number) => {
    const bm = parseInputNumber(beamMeterValue);
    const fp = parseInputNumber(fabricPanelValue);
    const ol = parseInputNumber(onLoomMtrValue);
    const bmVal = Number.isNaN(bm) ? 0 : bm;
    const olVal = Number.isNaN(ol) ? 0 : ol;
    const totalBm = bmVal + olVal;

    if ((Number.isNaN(bm) && Number.isNaN(ol)) || Number.isNaN(fp)) return undefined;
    const shrinkage = parseInputNumber(shrinkageValue);
    const shrinkFactor = Number.isNaN(shrinkage) ? 0 : shrinkage / 100;
    const base = totalBm * fp;
    const result = (base - (base * shrinkFactor)) * fp;
    return Number.isFinite(result) ? String(result.toFixed(3)) : undefined;
  };

  // Synchronize beam meters if user changes Gating / Knotting to or from "Sort Change"
  useEffect(() => {
    if (!rows.length) return;
    setRows(prevRows => {
      let changed = false;
      const next = prevRows.map(row => {
        if (!row.beamNo) return row;
        const found = allSizedBeams.find(b => String(b.sizedBeamNo) === String(row.beamNo));
        const doffedInput = resolveDoffedBeamMeterInput(row.beamNo, found?.beamId, loomIdVal);
        const fallbackBeamMeter = found?.beamMeter != null ? String(found.beamMeter) : '';
        const targetMeter = doffedInput ?? fallbackBeamMeter;
        if (targetMeter && targetMeter !== row.beamMeter) {
          changed = true;
          const expected = computeExpectedFabricMeterValue(targetMeter, fabricPanelVal, row.shrinkage, row.onLoomMtr);
          return {
            ...row,
            beamMeter: targetMeter,
            expectedFabricMeter: expected ?? row.expectedFabricMeter,
          };
        }
        return row;
      });
      return changed ? next : prevRows;
    });
  }, [gatingTypeValue, resolveDoffedBeamMeterInput, allSizedBeams, loomIdVal, fabricPanelVal]);

  const handleRowChange = (index: number, field: keyof BeamDetailRow, value: string) => {
    const panel = watch('fabricPanel');
    setRows(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value } as BeamDetailRow;
      const updateExpected = () => {
        const expected = computeExpectedFabricMeterValue(row.beamMeter, panel, row.shrinkage, row.onLoomMtr);
        if (expected != null) row.expectedFabricMeter = expected;
      };
      if (field === 'beamNo') {
        const { flangeNo, flangeId, fabricCodeQuality, originalFabricCodeQuality, beamMeter, onLoomMtr, shrinkage, expectedFabricMeter, gatingPicks, sizingSetNo, warpCount, warpYarnMillName, warpYarnLotNo, weftCount, salesOrderNo } = autoFillByBeamNo(value);
        row.flangeNo = flangeNo;
        row.flangeId = flangeId;
        row.fabricCodeQuality = fabricCodeQuality;
        row.originalFabricCodeQuality = originalFabricCodeQuality;
        row.beamMeter = beamMeter;
        row.onLoomMtr = onLoomMtr;
        row.shrinkage = shrinkage;
        row.expectedFabricMeter = expectedFabricMeter;
        row.gatingPicks = gatingPicks;
        row.sizingSetNo = sizingSetNo;
        row.warpCount = warpCount;
        row.warpYarnMillName = warpYarnMillName;
        row.warpYarnLotNo = warpYarnLotNo;
        row.weftCount = weftCount;
        row.salesOrderNo = salesOrderNo;

        // Track beam selection
        if (value && value.trim() !== '') {
          setSelectedBeams(prev => new Set(prev).add(value));
        } else {
          // Remove from selected beams if beam is cleared
          const previousBeamNo = row.beamNo;
          if (previousBeamNo) {
            setSelectedBeams(prev => {
              const newSet = new Set(prev);
              newSet.delete(previousBeamNo);
              return newSet;
            });
          }
        }
      } else if (field === 'flangeId') {
        const opts = flangeOptionsByBeam.get(String(row.beamNo)) || [];
        const found = opts.find(o => String(o.value) === String(value));
        row.flangeNo = found?.label || '';
      } else if (field === 'shrinkage' || field === 'beamMeter') {
        updateExpected();
      } else if (field === 'fabricCodeQuality') {
        const code = String(value || '').split(' - ')[0]?.trim();
        row.gatingPicks = code ? String(ppiMap.get(code) || '') : '';
        const shr = code ? shrinkageMap.get(code) : undefined;
        if (shr != null) {
          row.shrinkage = shr;
        }
        updateExpected();
      }
      next[index] = row;
      return next;
    });
  };

  const addRow = () => setRows(prev => {
    const next = [...prev, {
      id: undefined,
      beamNo: '',
      flangeNo: '',
      flangeId: '',
      fabricCodeQuality: '',
      originalFabricCodeQuality: '',
      beamMeter: '',
      shrinkage: '',
      expectedFabricMeter: '',
      gatingPicks: '',
      isDoffedBeam: 0,
      sizingSetNo: '',
      warpCount: '',
      warpYarnMillName: '',
      warpYarnLotNo: '',
      weftCount: '',
      weftYarnMillName: '',
      weftYarnLotNo: '',
    }];
    setEditingIndex(next.length - 1);
    return next;
  });

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));

    // Decrement No. of Beams Input when a row is deleted
    const currentNoOfBeams = parseInt(noOfBeamsInput || '0');
    if (currentNoOfBeams > 1) {
      setValue('noOfBeamsInput', String(currentNoOfBeams - 1));
    }
  };

  // Validation logic to check if all beam detail rows are filled
  const isAllRowsFilled = useMemo(() => {
    const beamsCount = parseInt(noOfBeamsInput || '0');
    if (beamsCount === 0 || rows.length === 0) return false;
    
    return rows.length === beamsCount && rows.every(row => 
      row.beamNo && row.beamNo.trim() !== '' &&
      row.flangeId && row.flangeId.trim() !== '' &&
      row.fabricCodeQuality && row.fabricCodeQuality.trim() !== '' &&
      row.beamMeter && row.beamMeter.trim() !== '' &&
      row.shrinkage && row.shrinkage.trim() !== '' &&
      row.expectedFabricMeter && row.expectedFabricMeter.trim() !== '' &&
      row.gatingPicks && row.gatingPicks.trim() !== ''
    );
  }, [rows, noOfBeamsInput]);

  useEffect(() => {
    if (isEditInitialLoadRef.current) {
      isEditInitialLoadRef.current = false;
      return;
    }
    if (fabricPanelVal) {
      setRows(prev => prev.map(r => {
        const expected = computeExpectedFabricMeterValue(r.beamMeter, fabricPanelVal, r.shrinkage, r.onLoomMtr);
        return expected != null ? { ...r, expectedFabricMeter: expected } : r;
      }));
    }
  }, [fabricPanelVal]);

  const freezeCounts = useMemo(() => {
    return rows.some(r => (
      (r.beamNo && r.beamNo.trim() !== '') ||
      (r.fabricCodeQuality && r.fabricCodeQuality.trim() !== '') ||
      (r.gatingPicks && r.gatingPicks.trim() !== '') ||
      (r.beamMeter && r.beamMeter.trim() !== '') ||
      (r.shrinkage && r.shrinkage.trim() !== '') ||
      (r.expectedFabricMeter && r.expectedFabricMeter.trim() !== '')
    ));
  }, [rows]);
  const shouldFreezeCountsInput = isEditMode && ((freezeCounts && editingIndex === null) || selectedBeams.size > 0);

  useEffect(() => {
    const noOfBeams = parseInt(noOfBeamsInput || '0');
    if (noOfBeams > 0 && !freezeCounts) {
      setRows(prev => {
        const currentLength = prev.length;
        if (noOfBeams > currentLength) {
          // Add more rows
          const newRows = Array(noOfBeams - currentLength).fill(null).map(() => ({
            id: undefined,
            beamNo: '',
            flangeNo: '',
            flangeId: '',
            fabricCodeQuality: '',
            originalFabricCodeQuality: '',
            beamMeter: '',
            shrinkage: '',
            expectedFabricMeter: '',
            gatingPicks: '',
            isDoffedBeam: 0,
            sizingSetNo: '',
            warpCount: '',
            warpYarnMillName: '',
            warpYarnLotNo: '',
            weftCount: '',
            weftYarnMillName: '',
            weftYarnLotNo: '',
          }));
          return [...prev, ...newRows];
        } else if (noOfBeams < currentLength) {
          // Remove extra rows
          return prev.slice(0, noOfBeams);
        }
        return prev;
      });
    }
  }, [noOfBeamsInput, freezeCounts]);

  useEffect(() => {
    if (freezeCounts) {
      const beams = watch('noOfBeamsInput');
      if (!beams && rows.length > 0) setValue('noOfBeamsInput', String(rows.length));
    }
  }, [freezeCounts, watch, setValue, rows.length]);

  const onSubmit = async (data: FormData) => {
    if (isSubmitting || isSavingRef.current) return;

    const filledRows = rows.filter(row => row.beamNo && row.beamNo.trim() !== '');
    if (filledRows.length === 0) {
      toast.error("Please fill rows from Beam Details");
      return;
    }
    // Validate Fabric Code / Quality for multiple selected rows
    const nonEmptyRows = rows.filter(row => row.beamNo && row.beamNo.trim() !== '');
    if (nonEmptyRows.length > 1) {
      const fabricCodes = nonEmptyRows.map(row => String(row.fabricCodeQuality || '').trim());
      const uniqueFabricCodes = [...new Set(fabricCodes)];
      
      if (uniqueFabricCodes.length > 1) {
        toast.error('Selected rows must have the same Sort No / Construction.');
        return;
      }
    }

    // Validate Loom No field manually since it's a custom component
    if (!data.loomId || data.loomId.trim() === '') {
      toast.error('Please select a Loom No');
      return;
    }

    const v = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const companyId = v ? Number(v) : undefined;

    const flRaw: any = flangeList as any;
    const flArr: any[] = Array.isArray(flRaw) ? flRaw : Array.isArray(flRaw?.data) ? flRaw.data : [];

    const duplicateBeamNos = (() => {
      const seen = new Set<string>();
      const duplicates = new Set<string>();
      rows.forEach((row) => {
        const beamNo = String(row?.beamNo || "").trim().toLowerCase();
        if (!beamNo) return;
        if (seen.has(beamNo)) duplicates.add(beamNo);
        seen.add(beamNo);
      });
      return duplicates;
    })();

    if (duplicateBeamNos.size > 0) {
      toast.error("Duplicate Beam No exists");
      return;
    }

    const usedRow = rows.find(r => {
      const fid = r.flangeId != null && String(r.flangeId).trim() !== '' ? Number(r.flangeId) : NaN;
      if (Number.isNaN(fid)) return false;
      const f = flArr.find((x: any) => Number(x?.id) === fid);
      return f && (Number(f?.isBeamGating) === 1);
    });

    let beamGatingNo = data.beamGatingNo || editData?.beamGatingNo || "";
    if (!editData && !beamGatingNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Beam Gating",
        });
        beamGatingNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }

    setIsSubmitting(true);
    isSavingRef.current = true;

    try {
      const selShedObj = (subCategoryList || []).find((sc: any) => String(sc.subCategoryName || sc.subcategoryName || sc.name) === data.shed || String(sc.id) === data.shedId);
      const selGroupObj = (subCategoryList || []).find((sc: any) => String(sc.subCategoryName || sc.subcategoryName || sc.name) === data.group || String(sc.id) === data.groupId);

      const payload = {
        gaitingDate: data.gaitingDate,
        beamGatingNo: beamGatingNo,
        loomId: data.loomId ? parseInt(data.loomId) : undefined,
        gaitingType: data.gaitingType,
        fabricMasterId: data.fabricMasterId ? parseInt(data.fabricMasterId) : undefined,
        shed: data.shed || undefined,
        shedId: data.shedId ? parseInt(data.shedId) : (selShedObj?.id ? parseInt(String(selShedObj.id)) : undefined),
        group: data.group || undefined,
        groupId: data.groupId ? parseInt(data.groupId) : (selGroupObj?.id ? parseInt(String(selGroupObj.id)) : undefined),
        effectFrom: data.effectFrom || undefined,
        effectiveDate: data.effectFrom === 'Time' ? data.effectiveDate : undefined,
        noOfBeamsInput: data.noOfBeamsInput ? parseInt(data.noOfBeamsInput) : undefined,
        noOfFabricOutput: data.noOfFabricOutput ? parseFloat(data.noOfFabricOutput) : undefined,
        fabricPanel: data.fabricPanel ? parseFloat(data.fabricPanel) : undefined,
        companyId: companyId,
        isBeamProduction: 0,
        beamGatingDetails: rows.map(r => {
          const foundBeam = allSizedBeams.find(b => String(b.sizedBeamNo) === String(r.beamNo) && String(b.flangeId || '') === String(r.flangeId || ''));
          const flangeNoValue = r.flangeNo || foundBeam?.flangeNo || '';
          const contractNoValue = foundBeam?.weavingContractNo ?? foundBeam?.contractNo ?? foundBeam?.contract_no ?? undefined;
          const workOrderNoValue = foundBeam?.weavingWorkOrderNo ?? foundBeam?.jobWorkOrderNo ?? foundBeam?.orderNo ?? undefined;
          const originalCode = String(r.originalFabricCodeQuality || r.fabricCodeQuality || '').trim();
          const currentCode = String(r.fabricCodeQuality || '').trim();
          const isChanged = originalCode && currentCode && currentCode !== originalCode;
          const originalFabric = originalCode ? fabricMasterByCode.get(originalCode) : undefined;
          const changedFabric = isChanged ? fabricMasterByCode.get(currentCode) : undefined;
          return {
            id: r.id,
            beamNo: r.beamNo,
            flangeId: r.flangeId ? parseInt(String(r.flangeId)) : undefined,
            flangeNo: flangeNoValue || undefined,
            fabricCodeQuality: originalCode || currentCode,
            fabricMasterId: originalFabric?.id != null ? Number(originalFabric.id) : undefined,
            changedFabricCodeQuality: isChanged ? currentCode : undefined,
            changedFabricMasterId: isChanged && changedFabric?.id != null ? Number(changedFabric.id) : undefined,
            beamMeter: r.beamMeter,
            onLoomMtr: r.onLoomMtr ? parseFloat(r.onLoomMtr) : undefined,
            shrinkage: r.shrinkage,
            expectedFabricMeter: r.expectedFabricMeter,
            gatingPicks: r.gatingPicks,
            beamId: foundBeam?.beamId != null ? parseInt(String(foundBeam.beamId)) : undefined,
            weavingContractId: foundBeam?.weavingContractId != null ? parseInt(String(foundBeam.weavingContractId)) : undefined,
            weavingContractNo: contractNoValue,
            weavingWorkOrderId: foundBeam?.weavingWorkOrderId != null ? parseInt(String(foundBeam.weavingWorkOrderId)) : undefined,
            weavingWorkOrderNo: workOrderNoValue,
            orderTypeId: foundBeam?.orderTypeId != null ? parseInt(String(foundBeam.orderTypeId)) : undefined,
            sizingSetNo: r.sizingSetNo || foundBeam?.sizingSetNo || undefined,
            warpCount: r.warpCount || undefined,
            warpYarnMillName: r.warpYarnMillName || undefined,
            warpYarnLotNo: r.warpYarnLotNo || undefined,
            weftCount: r.weftCount || undefined,
            weftYarnMillName: r.weftYarnMillName || undefined,
            weftYarnLotNo: r.weftYarnLotNo || undefined,
          };
        }),
      } as any;

      console.log("Beam gaiting payload data" + JSON.stringify(payload));
      if (isEditMode) {
        await dispatch(updateBeamGaiting({ id: editData.id, data: payload, companyId }) as any).unwrap();
      } else {
        await dispatch(createBeamGaiting(payload) as any).unwrap();
        documentNumberService.clearMemoryCache("Beam Gating");
      }
      navigate('/transaction/beam-gaiting-details');
    } catch (error) {
      console.error("Error saving beam gaiting:", error);
      isSavingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const cancel = () => navigate('/transaction/beam-gaiting-details');

  const beamDetailColumns = useMemo(() => {
    const cols: any[] = [
      {
        Header: 'S.No',
        id: 'serialNo',
        width: 50,
        minWidth: 50,
        headerClassName: 'text-center',
        cellClassName: 'text-center font-medium',
        Cell: ({ row }: any) => row.index + 1,
      },
      {
        Header: 'Beam No',
        accessor: 'beamNo',
        minWidth: 160,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <CommonSearchableSelect
              className="w-full"
              placeholder="Select Beam"
              options={beamOptionsWithCurrent}
              value={r?.beamNo || ''}
              onValueChange={(value) => handleRowChange(idx, 'beamNo', value)}
              disabled={isDisabled}
            />
          );
        },
      },
      {
        Header: 'Empty Beam No / HFPL Beam No',
        accessor: 'flangeId',
        minWidth: 170,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const flangeOptionsForRow = (() => {
            const base = flangeOptionsByBeam.get(String(r?.beamNo)) || [];
            const exists = base.some(o => String(o.value) === String(r?.flangeId || ''));
            const extra = !exists && r?.flangeId
              ? [{ value: String(r.flangeId), label: String(r.flangeNo || r.flangeId) }]
              : [];
            return [...base, ...extra];
          })();
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? (!r?.beamNo || editingIndex !== idx) : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <CommonSearchableSelect
              className="w-full"
              placeholder="Select Flange"
              options={flangeOptionsForRow}
              filterActive
              value={r?.flangeId || ''}
              onValueChange={(value) => handleRowChange(idx, 'flangeId' as any, value)}
              disabled={isDisabled}
            />
          );
        },
      },
      {
        Header: 'Sort No / Construction',
        accessor: 'fabricCodeQuality',
        minWidth: 260,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const allFabricCodes = fabricCodeOptions;
          const currentCode = String(r?.fabricCodeQuality || '').trim();
          const options = (() => {
            if (currentCode && !allFabricCodes.some((o: any) => o.value === currentCode)) {
              const baseCode = currentCode.split(' - ')[0]?.split(' / ')[0]?.trim();
              const raw: any = fabricMasterList as any;
              const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
              const fMatch = arr.find((f: any) => String(f.fabricCode || f.code || '').trim() === baseCode);
              const quality = fMatch ? (fMatch.fabricQuality || fMatch.construction || fMatch.quality || fMatch.fabricName || '') : '';
              const labelStr = quality ? `${currentCode} / ${quality}` : currentCode;
              return [...allFabricCodes, { value: currentCode, label: labelStr }];
            }
            return allFabricCodes;
          })();
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <CommonSearchableSelect
              className="w-full"
              placeholder="Select Sort No"
              options={options}
              value={r?.fabricCodeQuality || ''}
              onValueChange={(value) => handleRowChange(idx, 'fabricCodeQuality', value)}
              disabled={isDisabled}
            />
          );
        },
      },
      {
        Header: 'Sizing set no',
        accessor: 'sizingSetNo',
        minWidth: 120,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          return (
            <input
              value={r?.sizingSetNo || ''}
              onChange={(e) => handleRowChange(idx, 'sizingSetNo', e.target.value)}
              readOnly
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-100 cursor-not-allowed text-center text-sm"
            />
          );
        },
      },
      {
        Header: 'Sales Order No',
        accessor: 'salesOrderNo',
        minWidth: 140,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          return (
            <input
              value={r?.salesOrderNo || ''}
              readOnly
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-100 cursor-not-allowed text-center text-sm"
            />
          );
        },
      },
      {
        Header: 'Warp count',
        accessor: 'warpCount',
        minWidth: 160,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const currentVal = String(r?.warpCount || '').trim();
          const opts = currentVal && !yarnOptions.some((o: any) => o.value === currentVal)
            ? [...yarnOptions, { value: currentVal, label: currentVal }]
            : yarnOptions;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <CommonSearchableSelect
              className="w-full"
              placeholder="Select Warp Count"
              options={opts}
              value={r?.warpCount || ''}
              onValueChange={(value) => handleRowChange(idx, 'warpCount', value)}
              disabled={isDisabled}
            />
          );
        },
      },
      {
        Header: 'Warp yarn mill name',
        accessor: 'warpYarnMillName',
        minWidth: 170,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const currentVal = String(r?.warpYarnMillName || '').trim();
          const opts = currentVal && !millSelectOptions.some((o: any) => o.value === currentVal)
            ? [...millSelectOptions, { value: currentVal, label: currentVal }]
            : millSelectOptions;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <CommonSearchableSelect
              className="w-full"
              placeholder="Select Mill"
              options={opts}
              value={r?.warpYarnMillName || ''}
              onValueChange={(value) => handleRowChange(idx, 'warpYarnMillName', value)}
              disabled={isDisabled}
            />
          );
        },
      },
      {
        Header: 'Warp yarn lot no',
        accessor: 'warpYarnLotNo',
        minWidth: 130,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <input
              value={r?.warpYarnLotNo || ''}
              onChange={(e) => handleRowChange(idx, 'warpYarnLotNo', e.target.value)}
              disabled={isDisabled}
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full text-center text-sm disabled:bg-gray-100"
            />
          );
        },
      },
      {
        Header: 'Weft count',
        accessor: 'weftCount',
        minWidth: 160,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const currentVal = String(r?.weftCount || '').trim();
          const opts = currentVal && !yarnOptions.some((o: any) => o.value === currentVal)
            ? [...yarnOptions, { value: currentVal, label: currentVal }]
            : yarnOptions;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <CommonSearchableSelect
              className="w-full"
              placeholder="Select Weft Count"
              options={opts}
              value={r?.weftCount || ''}
              onValueChange={(value) => handleRowChange(idx, 'weftCount', value)}
              disabled={isDisabled}
            />
          );
        },
      },
      {
        Header: 'Weft yarn mill name',
        accessor: 'weftYarnMillName',
        minWidth: 170,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const currentVal = String(r?.weftYarnMillName || '').trim();
          const opts = currentVal && !millSelectOptions.some((o: any) => o.value === currentVal)
            ? [...millSelectOptions, { value: currentVal, label: currentVal }]
            : millSelectOptions;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <CommonSearchableSelect
              className="w-full"
              placeholder="Select Mill"
              options={opts}
              value={r?.weftYarnMillName || ''}
              onValueChange={(value) => handleRowChange(idx, 'weftYarnMillName', value)}
              disabled={isDisabled}
            />
          );
        },
      },
      {
        Header: 'Weft yarn lot no',
        accessor: 'weftYarnLotNo',
        minWidth: 130,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <input
              value={r?.weftYarnLotNo || ''}
              onChange={(e) => handleRowChange(idx, 'weftYarnLotNo', e.target.value)}
              disabled={isDisabled}
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full text-center text-sm disabled:bg-gray-100"
            />
          );
        },
      },
      {
        Header: 'Beam Meter',
        accessor: 'beamMeter',
        minWidth: 120,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const isReadOnly = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <input
              value={r?.beamMeter || ''}
              onChange={(e) => handleRowChange(idx, 'beamMeter', e.target.value)}
              readOnly={isReadOnly}
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-50 text-center text-sm"
            />
          );
        },
      },
      {
        Header: 'On-Loom Mtr',
        accessor: 'onLoomMtr',
        minWidth: 110,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          return (
            <input
              value={r?.onLoomMtr || ''}
              readOnly
              placeholder="0"
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-100 cursor-not-allowed text-right text-sm"
            />
          );
        },
      },
      {
        Header: 'Crimp/Shrinkage(%)',
        accessor: 'shrinkage',
        minWidth: 130,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <input
              value={r?.shrinkage || ''}
              onChange={(e) => handleRowChange(idx, 'shrinkage', e.target.value)}
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full text-center text-sm disabled:bg-gray-100"
              disabled={isDisabled}
            />
          );
        },
      },
      {
        Header: 'Expected Fabric Meter',
        accessor: 'expectedFabricMeter',
        minWidth: 150,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const isReadOnly = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <input
              value={r?.expectedFabricMeter || ''}
              onChange={(e) => handleRowChange(idx, 'expectedFabricMeter', e.target.value)}
              readOnly={isReadOnly}
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-50 text-center text-sm"
            />
          );
        },
      },
      {
        Header: 'Gaiting Picks',
        accessor: 'gatingPicks',
        minWidth: 120,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          const isDisabled = !formEditing || 
            (hasBeamsCountChanged ? false : 
              (isEditMode ? editingIndex !== idx : 
                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
              )
            );
          return (
            <input
              value={r?.gatingPicks || ''}
              onChange={(e) => handleRowChange(idx, 'gatingPicks', e.target.value)}
              className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full text-center text-sm disabled:bg-gray-100"
              disabled={isDisabled}
            />
          );
        },
      },
    ];

    if (isEditMode) {
      cols.push({
        Header: 'Action',
        id: 'actions',
        minWidth: 100,
        headerClassName: 'text-center',
        Cell: ({ row }: any) => {
          const idx = row.index;
          const r = rows[idx] || row.original;
          if (r?.isDoffedBeam === 1) {
            return (
              <div className="flex justify-center">
                <div className="text-center text-green-600 text-xs font-semibold border border-green-500 rounded-md px-3 py-2 shadow-sm inline-block bg-green-50 min-h-9 flex items-center">
                  Doffed
                </div>
              </div>
            );
          }
          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  const next = editingIndex === idx ? null : idx;
                  setEditingIndex(next);
                  setFormEditing(next !== null);
                }}
              >
                <Pencil size={14} />
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  removeRow(idx);
                }}
                variant="destructive"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          );
        },
      });
    }

    return cols;
  }, [
    rows,
    beamOptionsWithCurrent,
    flangeOptionsByBeam,
    fabricCodeOptions,
    fabricMasterList,
    yarnOptions,
    millSelectOptions,
    formEditing,
    hasBeamsCountChanged,
    isEditMode,
    editingIndex,
    noOfBeamsInput,
    handleRowChange,
    removeRow,
  ]);

  const handleRefresh = () => {
    // Clear selected beams and reset editing state
    setSelectedBeams(new Set());
    setEditingIndex(null);
    setFormEditing(!isEditMode);

    // Reset form to re-enable all fields
    reset({
      beamGatingNo: editData?.beamGatingNo || '',
      gaitingDate: editData?.gaitingDate ? new Date(editData.gaitingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      loomId: String(editData?.loomId ?? ''),
      gaitingType: String(editData?.gaitingType ?? editData?.gatingType ?? 'Gating'),
      shed: String(editData?.shed ?? ''),
      shedId: editData?.shedId != null ? String(editData.shedId) : '',
      group: String(editData?.group ?? ''),
      groupId: editData?.groupId != null ? String(editData.groupId) : '',
      effectFrom: String(editData?.effectFrom ?? 'Now'),
      effectiveDate: editData?.effectiveDate ? new Date(editData.effectiveDate).toISOString().slice(0, 16) : (editData?.effectFrom === 'Time' ? new Date().toISOString().slice(0, 16) : ''),
      noOfBeamsInput: String(editData?.noOfBeamsInput ?? editData?.noOfBeamInput ?? ''),
      noOfFabricOutput: String(editData?.noOfFabricOutput ?? ''),
      fabricPanel: String(editData?.fabricPanel ?? ''),
      beamGatingDetails: [],
    } as any);

    // Reload rows data
    if (isEditMode && editData) {
      const arr = Array.isArray(editData.beamGatingDetails) ? editData.beamGatingDetails : (Array.isArray(editData.beamDetails) ? editData.beamDetails : []);
      setRows(arr.map((d: any) => {
        const beamMeterValue = String(d.beamMeter ?? d.wrapMeters ?? '');
        const shrinkageValue = String(d.shrinkage ?? '');
        const originalCode = String(d.fabricCodeQuality ?? editData.fabricCodeQuality ?? '').split(' - ')[0]?.trim();
        const changedCode = d.changedFabricCodeQuality ? String(d.changedFabricCodeQuality).split(' - ')[0]?.trim() : undefined;
        const beamNoStr = String(d.beamNo ?? d.sizedBeamNo ?? '');
        const stockMatch = (stockList || []).find((s: any) => String(s.sizedBeamNo || '').trim() === beamNoStr.trim());
        const onLoomMtrValue = d.onLoomMtr != null ? String(d.onLoomMtr) : (stockMatch?.onLoomMtr != null ? String(stockMatch.onLoomMtr) : '');
        return {
          id: Number(d.id),
          beamNo: beamNoStr,
          flangeNo: String(d.flangeNo ?? ''),
          flangeId: d.flangeId != null ? String(d.flangeId) : '',
          fabricCodeQuality: changedCode || originalCode,
          originalFabricCodeQuality: originalCode,
          beamMeter: beamMeterValue,
          onLoomMtr: onLoomMtrValue,
          shrinkage: shrinkageValue,
          expectedFabricMeter: String(d.expectedFabricMeter ?? ''),
          gatingPicks: String(d.gatingPicks ?? ''),
          isDoffedBeam: d.isDoffedBeam != null ? Number(d.isDoffedBeam) : 0,
          sizingSetNo: String(d.sizingSetNo ?? ''),
          warpCount: String(d.warpCount ?? ''),
          warpYarnMillName: String(d.warpYarnMillName ?? ''),
          warpYarnLotNo: String(d.warpYarnLotNo ?? ''),
          weftCount: String(d.weftCount ?? ''),
          weftYarnMillName: String(d.weftYarnMillName ?? ''),
          weftYarnLotNo: String(d.weftYarnLotNo ?? ''),
          salesOrderNo: String(d.salesOrderNo ?? d.orderNo ?? ''),
        };
      }));
    }
  };

  return (
    <div className="p-6 pt-16 mt-5">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate("/transaction/beam-gaiting-details")}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
        {isEditMode && selectedBeams.size > 0 && (
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="ml-2"
          >
            Refresh
          </Button>
        )}
        <h1 className="text-2xl font-semibold mb-4">{isEditMode ? 'Edit' : 'Add'} Beam Gaiting / Knotting</h1>
      </div>


      <form onSubmit={(e) => { e.preventDefault(); const formData = getValues(); onSubmit(formData); }} className="space-y-6">
        <Card className="bg-white">
          <CardHeader>

            <CardTitle>Gaiting Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Beam Gaiting/Knotting No</label>
                <input
                  type="text"
                  placeholder="Loading sequence..."
                  readOnly
                  className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                    !watch('beamGatingNo') || watch('beamGatingNo')?.startsWith('Loading')
                      ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                      : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                  }`}
                  {...register('beamGatingNo')}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Gaiting/Knotting Date</label>
                <input type="date" className="w-full border-2 border-gray-600 text-gray-900 font-medium rounded px-3 py-2" {...register('gaitingDate', { required: true })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Loom No</label>
                <CommonSearchableSelect
                  className="mt-1"
                  placeholder="Select Loom"
                  options={loomOptionsWithCurrent}
                  filterActive
                  value={watch('loomId') || ''}
                  {...register('loomId', { required: true })}
                  onValueChange={(value) => setValue('loomId', value, { shouldValidate: true })}
                  disabled={isEditMode && !formEditing}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Gaiting / Knotting</label>
                <CommonSearchableSelect
                  className="mt-1"
                  placeholder="Select Gaiting Type"
                  options={GATING_TYPE_OPTIONS}
                  value={gatingTypeValue || 'Gaiting'}
                  {...register('gaitingType', { required: true })}
                  onValueChange={(value) => setValue('gaitingType', value, { shouldValidate: true })}
                  disabled={isEditMode && !formEditing}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Shed</label>
                <CommonSearchableSelect
                  className="mt-1"
                  placeholder="Select Shed"
                  options={shedSelectOptions}
                  filterActive
                  value={watch('shed') || ''}
                  {...register('shed')}
                  onValueChange={(value) => {
                    setValue('shed', value, { shouldValidate: true });
                    const found = shedOptions.find((sc: any) => String(sc.subcategoryName || sc.subCategoryName || sc.name) === value || String(sc.id) === value);
                    if (found?.id) setValue('shedId', String(found.id));
                  }}
                  disabled={isEditMode && !formEditing}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Group</label>
                <CommonSearchableSelect
                  className="mt-1"
                  placeholder="Select Group"
                  options={groupSelectOptions}
                  filterActive
                  value={watch('group') || ''}
                  {...register('group')}
                  onValueChange={(value) => {
                    setValue('group', value, { shouldValidate: true });
                    const found = groupOptions.find((sc: any) => String(sc.subcategoryName || sc.subCategoryName || sc.name) === value || String(sc.id) === value);
                    if (found?.id) setValue('groupId', String(found.id));
                  }}
                  disabled={isEditMode && !formEditing}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Sort No / Construction</label>
                <CommonSearchableSelect
                  className="mt-1"
                  placeholder="Select Sort No / Construction"
                  options={fabricMasterSelectOptions}
                  filterActive
                  value={watch('fabricMasterId') || ''}
                  {...register('fabricMasterId')}
                  onValueChange={(value) => setValue('fabricMasterId', value, { shouldValidate: true })}
                  disabled={isEditMode && !formEditing}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Effect From</label>
                <CommonSearchableSelect
                  className="mt-1"
                  placeholder="Select Effect From"
                  options={EFFECT_FROM_OPTIONS}
                  value={watch('effectFrom') || 'Now'}
                  {...register('effectFrom')}
                  onValueChange={(value) => {
                    setValue('effectFrom', value, { shouldValidate: true });
                    if (value === 'Time' && !watch('effectiveDate')) {
                      setValue('effectiveDate', formatForDateTimeInput());
                    }
                  }}
                  disabled={isEditMode && !formEditing}
                />
              </div>
              {watch('effectFrom') === 'Time' && (
                <div>
                  <label className="block text-sm mb-1">
                    Effective Date & Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border-2 border-gray-600 text-gray-900 font-medium rounded px-3 py-2"
                    {...register('effectiveDate', { required: watch('effectFrom') === 'Time' })}
                    disabled={isEditMode && !formEditing}
                  />
                  {errors.effectiveDate && (
                    <p className="text-xs text-red-600 mt-1">Effective Date & Time is required when Effect From is Time</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">No. of Beams Input</label>
                <input type="number" className={`w-full border-2 border-gray-600 text-gray-900 font-medium rounded px-3 py-2 ${shouldFreezeCountsInput ? 'bg-gray-50' : ''}`} readOnly={shouldFreezeCountsInput || (isEditMode && !formEditing)} {...register('noOfBeamsInput', { required: true, min: 1 })} />
              </div>
              <div>
                <label className="block text-sm mb-1">No. of Fabric Output</label>
                <input type="number" step="0.01" className={`w-full border-2 border-gray-600 text-gray-900 font-medium rounded px-3 py-2 ${shouldFreezeCountsInput ? 'bg-gray-50' : ''}`} readOnly={shouldFreezeCountsInput || (isEditMode && !formEditing)} {...register('noOfFabricOutput', { required: true, min: 0 })} />
              </div>
              <div>
                <label className="block text-sm mb-1">Fabric Panel</label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-600 text-gray-900 font-medium rounded px-3 py-2 bg-gray-50"
                  value={calculatedFabricPanel}
                  readOnly
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Fabric Panel Width</label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-600 text-gray-900 font-medium rounded px-3 py-2 bg-gray-50"
                  value={fabricPanelWidth}
                  readOnly
                  placeholder="Panel Width"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Beam Details</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Please enter No. of Beams Input to add beam details
              </p>
            ) : (
              <div className="space-y-4">
                {rows.map((beamRow, idx) => {
                  const renderField = (accessor: string) => {
                    const column = beamDetailColumns.find((col) => col.accessor === accessor);
                    return column?.Cell?.({ row: { index: idx, original: beamRow } }) ?? null;
                  };
                  const actionColumn = beamDetailColumns.find((col) => col.id === 'actions');
                  const colSpanMap: Record<string, string> = {
                    beamNo: 'col-span-1',
                    flangeId: 'col-span-1',
                    fabricCodeQuality: 'col-span-2',
                    sizingSetNo: 'col-span-1',
                    salesOrderNo: 'col-span-1',
                    warpCount: 'col-span-1',
                    warpYarnMillName: 'col-span-2',
                    warpYarnLotNo: 'col-span-1',
                    weftCount: 'col-span-1',
                    weftYarnMillName: 'col-span-2',
                    weftYarnLotNo: 'col-span-1',
                    beamMeter: 'col-span-1',
                    onLoomMtr: 'col-span-1',
                    shrinkage: 'col-span-1',
                    expectedFabricMeter: 'col-span-1',
                    gatingPicks: 'col-span-1',
                  };
                  const fieldGroups = [
                    {
                      title: 'Beam & fabric',
                      fields: ['beamNo', 'flangeId', 'fabricCodeQuality', 'sizingSetNo', 'salesOrderNo'],
                      gridClass: 'grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6',
                    },
                    {
                      title: 'Yarn details',
                      fields: ['warpCount', 'warpYarnMillName', 'warpYarnLotNo', 'weftCount', 'weftYarnMillName', 'weftYarnLotNo'],
                      gridClass: 'grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6',
                    },
                    {
                      title: 'Measurements',
                      fields: ['beamMeter', 'onLoomMtr', 'shrinkage', 'expectedFabricMeter', 'gatingPicks'],
                      gridClass: 'grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5',
                    },
                  ];

                  return (
                    <article
                      key={`${String(beamRow.beamNo || 'beam')}-${idx}`}
                      className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                    >
                      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Beam {idx + 1}</p>
                          <h3 className="truncate text-base font-semibold text-gray-900">
                            {beamRow.beamNo || 'Unassigned beam'}
                          </h3>
                        </div>
                        {isEditMode && (
                          <div className="shrink-0">
                            {actionColumn?.Cell?.({ row: { index: idx, original: beamRow } })}
                          </div>
                        )}
                      </header>
                      <div className="space-y-4 p-4">
                        {fieldGroups.map((group) => (
                          <section key={group.title} className="min-w-0">
                            <h4 className="mb-3 border-b border-gray-100 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              {group.title}
                            </h4>
                            <div className={group.gridClass}>
                              {group.fields.map((accessor) => {
                                const column = beamDetailColumns.find((col) => col.accessor === accessor);
                                if (!column) return null;
                                return (
                                  <div key={accessor} className={"min-w-0 " + (colSpanMap[accessor] || 'col-span-1')}>
                                    <label className="mb-1 block text-xs font-medium leading-5 text-gray-600">
                                      {column.Header}
                                    </label>
                                    <div className="min-w-0">{renderField(accessor)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="hidden">
            {false && (
              <table className="w-full dark-table text-center">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="dark-table-header">S.No</th>
                    <th className="dark-table-header">Beam No</th>
                    <th className="dark-table-header">Empty Beam No / HFPL Beam No</th>
                    <th className="dark-table-header">Sort No / Construction</th>
                    <th className="dark-table-header">Sizing set no</th>
                    <th className="dark-table-header">Warp count</th>
                    <th className="dark-table-header">Warp yarn mill name</th>
                    <th className="dark-table-header">Warp yarn lot no</th>
                    <th className="dark-table-header">Weft count</th>
                    <th className="dark-table-header">Weft yarn mill name</th>
                    <th className="dark-table-header">Weft yarn lot no</th>
                    <th className="dark-table-header">Beam Meter</th>
                    <th className="dark-table-header">On-Loom Mtr</th>
                    <th className="dark-table-header">Crimp/Shrinkage(%)</th>
                    <th className="dark-table-header">Expected Fabric Meter</th>
                    <th className="dark-table-header">Gaiting Picks</th>
                    {isEditMode && <th className="dark-table-header">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const flangeOptionsForRow = (() => {
                      const base = flangeOptionsByBeam.get(String(row.beamNo)) || [];
                      const exists = base.some(o => String(o.value) === String(row.flangeId || ''));
                      const extra = !exists && row.flangeId
                        ? [{ value: String(row.flangeId), label: String(row.flangeNo || row.flangeId) }]
                        : [];
                      return [...base, ...extra];
                    })();
                    return (
                      <tr key={idx} className="dark-table-row">
                        <td className="dark-table-cell">{idx + 1}</td>
                        <td className="dark-table-cell">
                          <CommonSearchableSelect
                            className="w-full"
                            placeholder="Select Beam"
                            options={beamOptionsWithCurrent}
                            value={row.beamNo || ''}
                            onValueChange={(value) => handleRowChange(idx, 'beamNo', value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? editingIndex !== idx : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                          />
                        </td>
                        <td className="dark-table-cell">
                          <CommonSearchableSelect
                            className="w-full"
                            placeholder="Select Flange"
                            options={flangeOptionsForRow}
                            filterActive
                            value={row.flangeId || ''}
                            onValueChange={(value) => handleRowChange(idx, 'flangeId' as any, value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? (!row.beamNo || editingIndex !== idx) : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                          />
                        </td>
                        <td className="dark-table-cell">
                          <CommonSearchableSelect
                            className="w-full"
                            placeholder="Select Sort No"
                            options={(() => {
                              // Always include all fabric codes from fabric master
                              const allFabricCodes = fabricCodeOptions;
                              const currentCode = String(row.fabricCodeQuality || '').trim();

                              // If current code exists and is not in the options, add it
                              if (currentCode && !allFabricCodes.some((o: any) => o.value === currentCode)) {
                                const baseCode = currentCode.split(' - ')[0]?.split(' / ')[0]?.trim();
                                const raw: any = fabricMasterList as any;
                                const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
                                const fMatch = arr.find((f: any) => String(f.fabricCode || f.code || '').trim() === baseCode);
                                const quality = fMatch ? (fMatch.fabricQuality || fMatch.construction || fMatch.quality || fMatch.fabricName || '') : '';
                                const labelStr = quality ? `${currentCode} / ${quality}` : currentCode;
                                return [...allFabricCodes, { value: currentCode, label: labelStr }];
                              }
                              return allFabricCodes;
                            })()}
                            value={row.fabricCodeQuality || ''}
                            onValueChange={(value) => handleRowChange(idx, 'fabricCodeQuality', value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? editingIndex !== idx : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                          />
                        </td>
                        <td className="dark-table-cell">
                          <input
                            value={row.sizingSetNo || ''}
                            onChange={(e) => handleRowChange(idx, 'sizingSetNo', e.target.value)}
                            readOnly
                            className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-100 cursor-not-allowed"
                          />
                        </td>
                        <td className="dark-table-cell">
                          <CommonSearchableSelect
                            className="w-full"
                            placeholder="Select Warp Count"
                            options={(() => {
                              const currentVal = String(row.warpCount || '').trim();
                              if (currentVal && !yarnOptions.some((o: any) => o.value === currentVal)) {
                                return [...yarnOptions, { value: currentVal, label: currentVal }];
                              }
                              return yarnOptions;
                            })()}
                            value={row.warpCount || ''}
                            onValueChange={(value) => handleRowChange(idx, 'warpCount', value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? editingIndex !== idx : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                          />
                        </td>
                        <td className="dark-table-cell">
                          <CommonSearchableSelect
                            className="w-full"
                            placeholder="Select Mill"
                            options={(() => {
                              const currentVal = String(row.warpYarnMillName || '').trim();
                              if (currentVal && !millSelectOptions.some((o: any) => o.value === currentVal)) {
                                return [...millSelectOptions, { value: currentVal, label: currentVal }];
                              }
                              return millSelectOptions;
                            })()}
                            value={row.warpYarnMillName || ''}
                            onValueChange={(value) => handleRowChange(idx, 'warpYarnMillName', value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? editingIndex !== idx : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                          />
                        </td>
                        <td className="dark-table-cell">
                          <input
                            value={row.warpYarnLotNo || ''}
                            onChange={(e) => handleRowChange(idx, 'warpYarnLotNo', e.target.value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? editingIndex !== idx : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                            className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full"
                          />
                        </td>
                        <td className="dark-table-cell">
                          <CommonSearchableSelect
                            className="w-full"
                            placeholder="Select Weft Count"
                            options={(() => {
                              const currentVal = String(row.weftCount || '').trim();
                              if (currentVal && !yarnOptions.some((o: any) => o.value === currentVal)) {
                                return [...yarnOptions, { value: currentVal, label: currentVal }];
                              }
                              return yarnOptions;
                            })()}
                            value={row.weftCount || ''}
                            onValueChange={(value) => handleRowChange(idx, 'weftCount', value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? editingIndex !== idx : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                          />
                        </td>
                        <td className="dark-table-cell">
                          <CommonSearchableSelect
                            className="w-full"
                            placeholder="Select Mill"
                            options={(() => {
                              const currentVal = String(row.weftYarnMillName || '').trim();
                              if (currentVal && !millSelectOptions.some((o: any) => o.value === currentVal)) {
                                return [...millSelectOptions, { value: currentVal, label: currentVal }];
                              }
                              return millSelectOptions;
                            })()}
                            value={row.weftYarnMillName || ''}
                            onValueChange={(value) => handleRowChange(idx, 'weftYarnMillName', value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? editingIndex !== idx : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                          />
                        </td>
                        <td className="dark-table-cell">
                          <input
                            value={row.weftYarnLotNo || ''}
                            onChange={(e) => handleRowChange(idx, 'weftYarnLotNo', e.target.value)}
                            disabled={
                              !formEditing || 
                              (hasBeamsCountChanged ? false : 
                                (isEditMode ? editingIndex !== idx : 
                                  (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                                )
                              )
                            }
                            className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full"
                          />
                        </td>
                        <td className="dark-table-cell">
                          <input value={row.beamMeter || ''} onChange={(e) => handleRowChange(idx, 'beamMeter' as any, e.target.value)} readOnly={
                            !formEditing || 
                            (hasBeamsCountChanged ? false : 
                              (isEditMode ? editingIndex !== idx : 
                                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                              )
                            )
                          } className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-50" />
                        </td>
                        <td className="dark-table-cell">
                          <input
                            value={row.onLoomMtr || ''}
                            readOnly
                            placeholder="0"
                            className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-100 cursor-not-allowed text-right"
                          />
                        </td>
                        <td className="dark-table-cell">
                          <input value={row.shrinkage || ''} onChange={(e) => handleRowChange(idx, 'shrinkage', e.target.value)} className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full" disabled={
                            !formEditing || 
                            (hasBeamsCountChanged ? false : 
                              (isEditMode ? editingIndex !== idx : 
                                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                              )
                            )
                          } />
                        </td>
                        <td className="dark-table-cell">
                          <input value={row.expectedFabricMeter || ''} onChange={(e) => handleRowChange(idx, 'expectedFabricMeter' as any, e.target.value)} readOnly={
                            !formEditing || 
                            (hasBeamsCountChanged ? false : 
                              (isEditMode ? editingIndex !== idx : 
                                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                              )
                            )
                          } className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full bg-gray-50" />
                        </td>
                        <td className="dark-table-cell">
                          <input value={row.gatingPicks || ''} onChange={(e) => handleRowChange(idx, 'gatingPicks', e.target.value)} className="border-2 border-gray-600 text-gray-900 font-medium rounded-md min-h-9 px-3 py-2 w-full" disabled={
                            !formEditing || 
                            (hasBeamsCountChanged ? false : 
                              (isEditMode ? editingIndex !== idx : 
                                (parseInt(noOfBeamsInput || '0') > 1 ? false : editingIndex !== idx)
                              )
                            )
                          } />
                        </td>
                        {isEditMode && (
                        <td className="dark-table-cell">
                          {row.isDoffedBeam === 1 ? (
                            <div className="text-center text-green-600 text-sm font-medium border border-green-500 rounded-md px-3 py-2 shadow-sm inline-block bg-green-50 min-h-9 flex items-center">
                              Doffed
                            </div>) : (
                            <div className="flex items-center justify-center gap-2">
                              <Button type="button" size="sm" onClick={(e) => { e.preventDefault(); const next = editingIndex === idx ? null : idx; setEditingIndex(next); setFormEditing(next !== null); }}>
                                <Pencil size={14} />
                              </Button>
                              <Button type="button" size="sm" onClick={(e) => { e.preventDefault(); removeRow(idx); }} variant="destructive">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-end">
          <button type="button" className="px-4 py-2 border rounded" onClick={cancel}>Cancel</button>
          <button 
            type="submit" 
            className={`px-4 py-2 rounded flex items-center gap-2 ${
              isSubmitting || (isEditMode && hasBeamsCountChanged && !isAllRowsFilled)
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
            disabled={isSubmitting || (isEditMode && hasBeamsCountChanged && !isAllRowsFilled)}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              isEditMode ? 'Update' : 'Save'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
