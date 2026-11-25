
// sizing-yarn-issue.tsx - COMPLETE UPDATED VERSION
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { FileText, Trash2, Save, Edit, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { set, useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { PopupDataTable, PopupColumn } from "@/components/data/PopupDataTable";
import { AppDispatch, RootState } from "@/state/store";
import { useDispatch, useSelector } from "react-redux";
import { getAllVendors } from "@/state/vendorSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createSizingYarnIssue, updateSizingYarnIssue } from "@/state/sizingYarnIssueSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllSizingPlan, getSizingPlanById } from "@/state/sizingPlanSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllSubCategories } from "@/state/subCategorySlice";
import { getAllWarehouse } from "@/state/warehouseSlice";
import { getAllPurchaseInwards } from "@/state/purchaseInwardSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import apiService from "@/services/ApiService";
import { toast } from "react-toastify";
import documentNumberService from "@/services/DocumentNumberService";
import { useCompanyContext, resolveCompanyId, useResolvedCompanyId } from "@/hooks/useCompanyContext";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { useMappingStatus } from "@/hooks/useMappingStatus";
import { useAutoDocumentNumber } from "@/components/common/useAutoDocumentNumber";
import { CodesAPI } from "@/services/codes_api";
import { CodesUtil } from "@/utils/codesUtil";
import { CodeDetail, CodeHeader } from "@/types/codes";

interface YarnRequirementDetail {
  id?: number;
  fabricDetails: string;
  quality: string;
  yarnName: string;
  actualYarn: string;
  actualYarnId: number; // Added to track the yarn ID
  yarnId: number;
  warpMeters: number;
  warpGramsPerMeter: number;
  warpRequirement: number;
  totalIssuedQty: number;
  balanceToIssue: number;
  historicalIssuedQty?: number;
}

import { getAllTransports } from "@/state/transportSlice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";

interface SizingYarnIssueFormData {
  id?: number;
  issueNo: string;
  vendorId: string;
  sizingPlanId: string;
  transportationDetails?: string;
  transportId?: string;
  termsConditionsId?: string;
  fabricDetails: string;
  yarnIssueDate: string;
  yarnIssueChallanNo?: string;
  activeFlag: boolean;
  grossWt?: string | number;
  remark?: string;
  vehicleNo?: string;
}

interface LotDetail {
  id: number | string;
  uniqueId?: number | string;
  yarnId?: number;
  yarnName: string;
  yarnType?: 'original' | 'actual';
  originalYarnName?: string;
  lotNumber: string;
  availableQty: number;
  actualQty?: number;
  issueQty?: number;
  alternateYarn?: string;
  millId?: number | string | null;
  warehouseId?: number | string | null;
  warehouseName?: string;
  baseLotId?: number | string;
  lotYarnId?: number | string;
  availableBags?: number;
  lotAvailableBags?: number;
  lotAvailableQty?: number;
  inwardBags?: number;
  noOfBags?: number;
  kgsPerBag?: number;
  conesPerBag?: number;
  conesWeight?: number;
  activeFlag?: boolean;
  acceptedQty?: number;
  issuedQty?: number;
  inwardId?: number | null;
  orderItemId?: number | null;
  yarnInwardStockDetailsId?: number | null;
  inwardTypeId?: number | null;
  inwardType?: string;
  inwardNo?: string;
  uomId?: number | null;
  issuedBags?: number | null;
  outwardTypeId?: number | null;
  poCategoryId?: number | null;
  issuingCones?: number | string;
  availableCones?: number;
  perBabyConeWeight?: number | string;
}

const resolveAlternateYarnValue = (lot: LotDetail): string => {
  const alternate = typeof lot.alternateYarn === 'string' ? lot.alternateYarn.trim() : '';
  if (alternate) {
    return alternate;
  }
  return typeof lot.yarnName === 'string' ? lot.yarnName.trim() : '';
};

interface FabricMaster {
  id: number;
  fabricCode: string;
  fabricName: string;
  fabricQuality: string;
  warpDetails?: Array<{
    gramsPerMeter: number;
  }>;
}

interface SizingQualityDetail {
  id: number;
  quality: string;
  fabricCode: string;
  yarnId: number;
  actualYarn?: number;
  warpMeters: number;
}

interface YarnMaster {
  id: number;
  yarnName: string;
}

const buildYarnInwardStockUrl = (itemIds: string, companyId?: number | null) => {
  const params: string[] = [];
  if (itemIds) {
    params.push(`itemId=${itemIds}`);
  }
  const resolved = companyId ?? resolveCompanyId();
  if (resolved !== null && resolved !== undefined) {
    params.push(`companyId=${resolved}`);
  }
  return params.length
    ? `/sizing-yarn-issues/yarn-inward-stock?${params.join("&")}`
    : `/sizing-yarn-issues/yarn-inward-stock`;
};

const resolveSelectedCompanyId = (): number | null => {
  const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
  if (!stored) return null;
  const numeric = Number(stored);
  if (!Number.isNaN(numeric)) return numeric;
  try {
    const parsed = JSON.parse(stored);
    const parsedId = parsed?.id ?? parsed?.companyId;
    if (parsedId == null) return null;
    const parsedNumber = Number(parsedId);
    return Number.isNaN(parsedNumber) ? null : parsedNumber;
  } catch {
    return null;
  }
};

export function SizingYarnIssue() {
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { sizingPlanList } = useSelector((state: RootState) => state.sizingPlan);
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { subCategoryList: subCategories } = useSelector((state: RootState) => state.subCategory);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { purchaseInwardList } = useSelector((state: RootState) => state.purchaseInward as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { transportList } = useSelector((state: RootState) => state.transport);

  const [activeTab, setActiveTab] = useState("orderDetails");
  const [selectedSizingPlan, setSelectedSizingPlan] = useState<any>(null);
  const [yarnRequirementDetails, setYarnRequirementDetails] = useState<YarnRequirementDetail[]>([]);
  const [showLotDialog, setShowLotDialog] = useState(false);
  const [lotSearchTerm, setLotSearchTerm] = useState("");
  const [selectedLots, setSelectedLots] = useState<LotDetail[]>([]);
  const [availableLots, setAvailableLots] = useState<LotDetail[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [lotMeta, setLotMeta] = useState<Record<string, { millId?: string | number; warehouseId?: string | number; noOfBags?: number; kgsPerBag?: number }>>({});
  const [inwardTypes, setInwardTypes] = useState<CodeDetail[]>([]);
  const dispatch = useDispatch<AppDispatch>();

  const normalizeDetailsResponse = (raw: any): CodeDetail[] => {
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
        // First try to get headers from storage or load them once
        let headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());

        if (!headers.length) {
          try {
            await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
            headers = normalizeHeadersResponse(CodesUtil.getHeaders?.());
          } catch (error) {
            console.error("Failed to preload inward type headers", error);
          }
        }

        // If headers are still empty, fetch them directly
        if (!headers.length) {
          try {
            const apiHeaders = await CodesAPI.getCodesHeader();
            headers = normalizeHeadersResponse(apiHeaders);
          } catch (error) {
            console.error("Failed to fetch inward type headers", error);
          }
        }

        // Find the header for inward types (hdr_id: 1)
        const inwardHeader = headers.find((h: CodeHeader) =>
          String(h.id) === "1" || String(h.hdr_id) === "1" || String(h.hdrId) === "1"
        );

        if (inwardHeader && Array.isArray(inwardHeader.details)) {
          setInwardTypes(inwardHeader.details);
        } else if (inwardHeader?.id) {
          // Fallback if details are not included in headers
          const response = await CodesAPI.getCodeDetailsByHeader(inwardHeader.code_group || inwardHeader.codeGroup);
          setInwardTypes(normalizeDetailsResponse(response));
        } else {
          // Final fallback - try by numeric ID as string if group name is unknown
          const response = await CodesAPI.getCodeDetailsByHeader("1");
          setInwardTypes(normalizeDetailsResponse(response));
        }
      } catch (error) {
        console.error("Failed to fetch inward types:", error);
      }
    };
    fetchInwardTypes();
  }, []);

  const [poCategories, setPoCategories] = useState<CodeDetail[]>([]);

  useEffect(() => {
    const fetchPoCategories = async () => {
      try {
        const details = await CodesAPI.getCodeDetailsByHeader("7");
        setPoCategories(details || []);
      } catch (err) {
        console.error("Failed to fetch PO Categories in sizing yarn issue:", err);
      }
    };
    fetchPoCategories();
  }, []);

  const poCategoryMap = useMemo(() => {
    return poCategories.reduce((acc: Record<number, string>, category: any) => {
      acc[category.id] = category.value;
      return acc;
    }, {}) || {};
  }, [poCategories]);

  const getDetailOptionValue = (detail: CodeDetail) => {
    if (detail.id != null) return String(detail.id);
    if (detail.code) return detail.code;
    if (detail.value) return detail.value;
    return "";
  };

  const getDetailOptionLabel = (detail: CodeDetail) => detail.code || detail.value || `Code ${detail.id ?? ""}`;

  const inwardTypeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    inwardTypes.forEach((detail) => {
      const key = getDetailOptionValue(detail);
      if (!key) return;
      map.set(key, getDetailOptionLabel(detail));
    });
    return map;
  }, [inwardTypes]);

  const calculateIssueQty = useCallback((bags?: number | string, kgs?: number | string) => {
    const bagValue = Number(bags || 0);
    const kgValue = Number(kgs || 0);
    return Number((bagValue * kgValue).toFixed(3));
  }, []);
  const location = useLocation();
  const sizingYarnIssueDtl = location.state?.sizingYarnIssueDtl;
  const newlyCreatedSizingPlan = location.state?.newlyCreatedSizingPlan;
  const autoSelectPlan = location.state?.autoSelectPlan;
  const navigate = useNavigate();
  const { companyId } = useCompanyContext();
  const resolvedCompanyId = useResolvedCompanyId();
  const { isMapped: isIssueMapped } = useMappingStatus({
    endpoint: "/sizing-yarn-issues/",
    id: sizingYarnIssueDtl?.id,
    enabled: !!sizingYarnIssueDtl?.id,
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<SizingYarnIssueFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange'
  });


  const watchSizingPlanId = watch("sizingPlanId");
  const watchVendorId = watch("vendorId");


  const isFormValid = isValid && selectedLots.length > 0 && selectedLots.every(lot => resolveAlternateYarnValue(lot) !== '');

  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);

  // Auto generate document number with loading state and cleanup
  useAutoDocumentNumber({
    screenName: "Sizing Yarn Issue",
    detail: sizingYarnIssueDtl,
    existingValue: sizingYarnIssueDtl?.issueNo,
    fieldName: "issueNo",
    setValue,
    isSavingRef,
  });

  const normalizedVendors = useMemo(() => {
    let list = [];
    if (Array.isArray(vendorList)) list = vendorList;
    else if (Array.isArray((vendorList as any)?.data)) list = (vendorList as any).data;
    return list.filter((v: any) => v.isActive !== false && v.activeFlag !== false);
  }, [vendorList]);

  const normalizedSizingPlans = useMemo(() => {
    let list = [];
    if (Array.isArray(sizingPlanList)) list = sizingPlanList;
    else if (Array.isArray((sizingPlanList as any)?.data)) list = (sizingPlanList as any).data;
    return list.filter((p: any) => {
      if (p.isActive === false || p.activeFlag === false) return false;
      if (resolvedCompanyId != null) {
        const planCompanyId = p.companyId ?? p.company?.id ?? p.company?.companyId;
        if (planCompanyId != null) {
          return String(planCompanyId) === String(resolvedCompanyId);
        }
      }
      return true;
    });
  }, [sizingPlanList, resolvedCompanyId]);

  const matchesPlanId = useCallback((plan: any, idValue: string | number | undefined | null) => {
    if (!plan || idValue == null) return false;
    const candidates = [plan?.id, plan?.sizingPlanId, plan?.planId];
    return candidates.some((candidate) => candidate != null && String(candidate) === String(idValue));
  }, []);

  const sizingVendorOptions = useMemo(() => {
    const currentVendorId = watchVendorId || sizingYarnIssueDtl?.vendorId;
    const currentVendor = normalizedVendors.find((vendor: any) => String(vendor?.id) === String(currentVendorId));
    const selectedPlanId = watchSizingPlanId || sizingYarnIssueDtl?.sizingPlanId;
    if (!selectedPlanId) {
      return currentVendor ? [currentVendor] : [];
    }
    const matchedPlan =
      selectedSizingPlan && matchesPlanId(selectedSizingPlan, selectedPlanId)
        ? selectedSizingPlan
        : normalizedSizingPlans.find((plan: any) => matchesPlanId(plan, selectedPlanId));
    if (!matchedPlan) {
      return currentVendor ? [currentVendor] : [];
    }
    const vendorIdCandidates = [
      matchedPlan.vendorId,
      matchedPlan.vendor?.id,
      matchedPlan.vendor?.vendorId
    ];
    const planVendorId = vendorIdCandidates.find(
      (value) => value !== undefined && value !== null && value !== ""
    );
    if (!planVendorId) {
      return currentVendor ? [currentVendor] : [];
    }
    const planVendors = normalizedVendors.filter((vendor: any) => String(vendor?.id) === String(planVendorId));
    const options = [...planVendors];
    if (currentVendor && !options.some((vendor: any) => String(vendor?.id) === String(currentVendor.id))) {
      options.push(currentVendor);
    }
    return options;
  }, [
    normalizedVendors,
    normalizedSizingPlans,
    selectedSizingPlan,
    watchSizingPlanId,
    watchVendorId,
    sizingYarnIssueDtl,
    matchesPlanId
  ]);

  const companyOptions = useMemo(() => {
    let list = [];
    if (Array.isArray(companyMasterList)) list = companyMasterList;
    else if (Array.isArray(companyMasterList?.data)) list = companyMasterList.data;
    return list;
  }, [companyMasterList]);

  const activeCompanyOptions = useMemo(() => companyOptions.filter((c: any) => c.isActive !== false && c.activeFlag !== false), [companyOptions]);

  const normalizeName = useCallback((value?: string | number | null) => {
    if (value === undefined || value === null) return "";
    return String(value).toLowerCase().replace(/[\s\W]+/g, "");
  }, []);

  const companyNameLookup = useMemo(() => {
    const map = new Map<string, number>();
    companyOptions.forEach((company: any) => {
      const id = company?.id ?? company?.companyId;
      if (!id) return;
      const candidates = [company?.companyName, company?.name, company?.legalName, company?.displayName];
      candidates.forEach((candidate) => {
        const key = normalizeName(candidate);
        if (key && !map.has(key)) map.set(key, Number(id));
      });
    });
    return map;
  }, [companyOptions, normalizeName]);

  const resolveFactoryCompanyIdByVendor = useCallback(
    (vendorId?: string | number | null) => {
      if (!vendorId) return null;
      const vendor = normalizedVendors.find((entry: any) => String(entry?.id) === String(vendorId));
      if (!vendor) return null;

      const directIds = [vendor?.companyId, vendor?.company?.id, vendor?.company?.companyId].filter(
        (value) => value !== undefined && value !== null && value !== ""
      );
      for (const directId of directIds) {
        const match = companyOptions.find(
          (company: any) => String(company?.id ?? company?.companyId) === String(directId)
        );
        if (match) return Number(match.id ?? match.companyId);
      }

      const nameCandidates = [vendor?.vendorName, vendor?.customerName, vendor?.companyName, vendor?.name];
      for (const candidate of nameCandidates) {
        const key = normalizeName(candidate);
        if (key && companyNameLookup.has(key)) {
          const resolved = companyNameLookup.get(key);
          if (resolved != null) return resolved;
        }
      }
      return null;
    },
    [normalizedVendors, companyOptions, companyNameLookup, normalizeName]
  );

  const derivedFactoryCompanyId = useMemo(() => {
    const vendorId = watchVendorId || sizingYarnIssueDtl?.vendorId || null;
    return resolveFactoryCompanyIdByVendor(vendorId);
  }, [watchVendorId, sizingYarnIssueDtl, resolveFactoryCompanyIdByVendor]);

  const resolvedSizingPlanMeta = useMemo(() => {
    const selectedId = watchSizingPlanId || sizingYarnIssueDtl?.sizingPlanId;
    if (!selectedId) return selectedSizingPlan || null;
    if (selectedSizingPlan && matchesPlanId(selectedSizingPlan, selectedId)) return selectedSizingPlan;
    return normalizedSizingPlans.find((plan: any) => matchesPlanId(plan, selectedId)) || selectedSizingPlan || null;
  }, [watchSizingPlanId, sizingYarnIssueDtl, selectedSizingPlan, normalizedSizingPlans, matchesPlanId]);

  const resolvedOrderTypeId = useMemo(() => {
    if (resolvedSizingPlanMeta?.orderTypeId != null) return Number(resolvedSizingPlanMeta.orderTypeId);
    if (sizingYarnIssueDtl?.orderTypeId != null) return Number(sizingYarnIssueDtl.orderTypeId);
    return null;
  }, [resolvedSizingPlanMeta, sizingYarnIssueDtl]);

  useEffect(() => {
    const effectiveCompanyId = resolvedCompanyId ?? companyId ?? resolveCompanyId();
    if (!effectiveCompanyId) return;

    const scopedParams = { companyId: effectiveCompanyId, fetchAll: true };
    dispatch(getAllVendors(scopedParams));
    dispatch(getAllSizingPlan(scopedParams));
    dispatch(getAllYarnMasters({ fetchAll: true }));
    dispatch(getAllFabricMasters({ fetchAll: true }));
    dispatch(getAllSubCategories({ fetchAll: true } as any));
    dispatch(getAllWarehouse({ fetchAll: true } as any));
    dispatch(getAllPurchaseInwards({ fetchAll: true } as any));
    dispatch(getAllCompanies({ fetchAll: true } as any));
    dispatch(getAllTransports({ fetchAll: true }));
  }, [dispatch, resolvedCompanyId]);

  useEffect(() => {
    if (sizingYarnIssueDtl) {
      reset({
        id: sizingYarnIssueDtl.id,
        vendorId: String(sizingYarnIssueDtl.vendorId),
        sizingPlanId: String(sizingYarnIssueDtl.sizingPlanId),
        transportationDetails: sizingYarnIssueDtl.transportationDetails,
        transportId: sizingYarnIssueDtl.transportId ? String(sizingYarnIssueDtl.transportId) : '',
        termsConditionsId: String(sizingYarnIssueDtl.termsConditionsId),
        fabricDetails: sizingYarnIssueDtl.fabricDetails || '',
        yarnIssueDate: sizingYarnIssueDtl.sizingYarnIssueDate?.slice(0, 10) || new Date().toISOString().split('T')[0],
        yarnIssueChallanNo: sizingYarnIssueDtl.yarnIssueChallanNo || '',
        activeFlag: sizingYarnIssueDtl.activeFlag !== false,
        grossWt: sizingYarnIssueDtl.grossWt || '',
        remark: sizingYarnIssueDtl.remark || sizingYarnIssueDtl.remark || '',
        vehicleNo: sizingYarnIssueDtl.vehicleNo || ''
      });

      // Set yarn requirement details
      if (sizingYarnIssueDtl.requirements) {
        const thisEntryByYarnId: Record<string, number> = {};
        if (sizingYarnIssueDtl.sizingYarnIssue) {
          sizingYarnIssueDtl.sizingYarnIssue.forEach((issue: any) => {
            const key = issue.yarnId != null ? `id-${issue.yarnId}` : `name-${issue.yarnName || ''}`;
            thisEntryByYarnId[key] = (thisEntryByYarnId[key] || 0) + Number(issue.issueQty || 0);
          });
        }

        setYarnRequirementDetails(sizingYarnIssueDtl.requirements.map((req: any) => {
          let actualYarnId = req.yarnId;
          if (req.actualYarn && typeof req.actualYarn === 'string') {
            const matchedYarn = yarnList.find((y: YarnMaster) => y.yarnName === req.actualYarn);
            if (matchedYarn) {
              actualYarnId = matchedYarn.id;
            }
          }

          const reqKey = req.yarnId != null ? `id-${req.yarnId}` : `name-${req.yarnName || ''}`;
          const thisEntryContrib = thisEntryByYarnId[reqKey] || 0;
          const historicalIssuedQty = Math.max(0, (req.totalIssuedQty || 0) - thisEntryContrib);

          return {
            id: req.id,
            fabricDetails: req.fabricDetails || '',
            yarnName: req.yarnName,
            actualYarn: req.actualYarn,
            actualYarnId: actualYarnId,
            yarnId: req.yarnId || 0,
            warpMeters: req.warpMeters || 0,
            warpGramsPerMeter: req.warpGramsPerMeter || 0,
            warpRequirement: req.warpRequirement || 0,
            totalIssuedQty: req.totalIssuedQty || 0,
            balanceToIssue: req.balanceToIssue || 0,
            historicalIssuedQty
          };
        }));
      }

      // Set selected lots
      if (sizingYarnIssueDtl.sizingYarnIssue) {
        setSelectedLots(sizingYarnIssueDtl.sizingYarnIssue.map((issue: any, idx: number) => {
          let originalYarnName = issue.yarnName;
          let alternateYarnName = typeof issue.alternateYarn === 'string' ? issue.alternateYarn.trim() : '';

          if (sizingYarnIssueDtl.requirements && sizingYarnIssueDtl.requirements.length > 0) {
            // Find requirement matching this issue's yarn ID
            const matchedReq = sizingYarnIssueDtl.requirements.find((req: any) =>
              req.yarnId === issue.yarnId || req.yarnName === issue.yarnName
            );
            if (matchedReq) {
              originalYarnName = matchedReq.yarnName;
              // If alternateYarn is not set in issue, use the actualYarn from requirement
              if (!alternateYarnName && matchedReq.actualYarn) {
                alternateYarnName = matchedReq.actualYarn;
              }
            }
          }

          if (!alternateYarnName && typeof issue.yarnName === 'string') {
            alternateYarnName = issue.yarnName;
          }

          let issuedQty = 0;
          let lotNo = issue.lotNo || '';
          let warehouseInfo = {
            millId: issue.millId,
            warehouseId: issue.warehouseId,
            inwardId: issue.inwardId,
            orderItemId: issue.orderItemId,
            yarnInwardStockDetailsId: issue.yarnInwardStockDetailsId ?? null
          };

          if (sizingYarnIssueDtl.yarnOutwardStockDetails && sizingYarnIssueDtl.yarnOutwardStockDetails.length > idx) {
            const outwardDetail = sizingYarnIssueDtl.yarnOutwardStockDetails[idx];
            issuedQty = outwardDetail.issuedQty || 0;
            lotNo = outwardDetail.lotNo || lotNo;
            warehouseInfo = {
              millId: outwardDetail.millId || issue.millId,
              warehouseId: outwardDetail.warehouseId || issue.warehouseId,
              inwardId: outwardDetail.inwardId || issue.inwardId,
              orderItemId: outwardDetail.orderItemId || issue.orderItemId,
              yarnInwardStockDetailsId: outwardDetail.yarnInwardStockDetailsId ?? issue.yarnInwardStockDetailsId ?? null
            };
          }

          const conesPerBag = Number(issue.conesPerBag ?? issue.noOfConesPerBag ?? 0);
          const kgsPerBag = Number(issue.kgsPerBag ?? 0);
          const conesWeight = issue.conesWeight != null
            ? Number(issue.conesWeight)
            : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);

          const inwardTypeId = issue.inwardTypeId ?? (sizingYarnIssueDtl.yarnOutwardStockDetails && sizingYarnIssueDtl.yarnOutwardStockDetails[idx]?.inwardTypeId);
          const inwardType = inwardTypes.find((t: any) => String(t.id) === String(inwardTypeId))?.code || issue.inwardType || 'N/A';
          const inwardNo = issue.inwardNo || (sizingYarnIssueDtl.yarnOutwardStockDetails && sizingYarnIssueDtl.yarnOutwardStockDetails[idx]?.inwardNo) || 'N/A';


          const availableBagsVal = Number(issue.availableBags ?? issue.lotAvailableBags ?? 0);
          const availableCones = availableBagsVal * conesPerBag;
          let issuingCones = Number(issue.issuingCones ?? issue.noOfCones ?? 0);
          if (!issuingCones) {
            if (issue.issueQty && conesWeight > 0) {
              issuingCones = Math.round(Number(issue.issueQty) / conesWeight);
            } else if (issue.noOfBags && conesPerBag > 0) {
              issuingCones = Number(issue.noOfBags) * conesPerBag;
            }
          }

          return {
            id: issue.id,
            yarnName: issue.yarnName,
            originalYarnName: originalYarnName,
            yarnId: issue.yarnId || undefined,
            alternateYarn: alternateYarnName,
            lotNumber: issue.lotNo || '',
            availableQty: Number(issue.availableReqQty ?? issue.lotAvailableQty ?? 0),
            lotAvailableQty: Number(issue.lotAvailableQty ?? issue.availableReqQty ?? 0),
            actualQty: issue.actualQty || 0,
            issueQty: issue.issueQty || 0,
            millId: issue.millId ?? null,
            warehouseId: issue.warehouseId ?? null,
            noOfBags: Number(issue.noOfBags ?? 0),
            kgsPerBag,
            conesPerBag,
            conesWeight,
            issuingCones: issuingCones || '',
            availableCones: availableCones,
            perBabyConeWeight: (issue.perBabyConeWeight !== null && issue.perBabyConeWeight !== undefined && Number(issue.perBabyConeWeight) > 0) ? Number(issue.perBabyConeWeight) : 0.01,
            availableBags: availableBagsVal,
            lotAvailableBags: availableBagsVal,
            activeFlag: issue.activeFlag !== false,
            acceptedQty: issue.actualQty || 0,
            issuedQty: issue.issueQty || 0,
            inwardId: warehouseInfo.inwardId ?? null,
            orderItemId: warehouseInfo.orderItemId ?? null,
            yarnInwardStockDetailsId: warehouseInfo.yarnInwardStockDetailsId ?? null,
            inwardTypeId,
            inwardType,
            inwardNo,
            uniqueId: `${warehouseInfo.orderItemId ?? issue.orderItemId}_${warehouseInfo.inwardId ?? issue.inwardId}`,
          };
        }));
      }

      setSelectedSizingPlan(null);
    } else {
      // Set default date for new entries
      const initialState: any = {
        yarnIssueDate: new Date().toISOString().split('T')[0],
        activeFlag: true
      };

      // Prefill from location state if available (from Order Entry Management)
      if (location.state?.sizingPlanId) {
        initialState.sizingPlanId = String(location.state.sizingPlanId);
      }
      if (location.state?.vendorId) {
        initialState.vendorId = String(location.state.vendorId);
      }

      reset(initialState);
    }
  }, [sizingYarnIssueDtl, reset, yarnList, location.state]);

  // Ensure the transport select reflects existing data when editing
  useEffect(() => {
    if (!sizingYarnIssueDtl) return;
    setValue('issueNo', sizingYarnIssueDtl.issueNo || '');
    // Prefer explicit transportId from payload
    if (sizingYarnIssueDtl.transportId) {
      setValue('transportId', String(sizingYarnIssueDtl.transportId));
      return;
    }

    // Fallback: try to match transportationDetails text with transportList
    if (sizingYarnIssueDtl.transportationDetails && Array.isArray(transportList)) {
      const match = transportList.find((t: any) => (t.transportName || t.name) === sizingYarnIssueDtl.transportationDetails);
      if (match) {
        setValue('transportId', String(match.id));
        return;
      }
    }

    // If no match, keep transportationDetails value in form for payload
    setValue('transportationDetails', sizingYarnIssueDtl.transportationDetails || '');
  }, [sizingYarnIssueDtl, transportList, setValue]);

  useEffect(() => {
    // Only fetch sizing plan data when creating new (not editing)
    if (!sizingYarnIssueDtl) {
      if (watchSizingPlanId) {
        handleSizingPlanChange(parseInt(watchSizingPlanId));
      } else {
        setSelectedSizingPlan(null);
        setYarnRequirementDetails([]);
      }
    }
  }, [watchSizingPlanId, sizingYarnIssueDtl]);

  // Handle auto-selection of newly created sizing plan
  useEffect(() => {
    if (autoSelectPlan && newlyCreatedSizingPlan && !sizingYarnIssueDtl) {
      // Auto-select the newly created sizing plan
      const planId = newlyCreatedSizingPlan.id || newlyCreatedSizingPlan.sizingPlanId;
      if (planId) {
        setValue('sizingPlanId', String(planId), { shouldValidate: true });

        // Ensure the newly created plan is available in the normalized list
        if (!normalizedSizingPlans.find((sp: any) => String(sp.id) === String(planId))) {
          // Add the newly created plan to the selected state directly
          setSelectedSizingPlan(newlyCreatedSizingPlan);
          // Auto-populate vendor and other fields from the newly created plan
          if (newlyCreatedSizingPlan.vendorId) {
            setValue('vendorId', String(newlyCreatedSizingPlan.vendorId));
          }
          if (newlyCreatedSizingPlan.termsConditionsId) {
            setValue('termsConditionsId', String(newlyCreatedSizingPlan.termsConditionsId));
          }
        }

        // The existing useEffect for watchSizingPlanId will handle the auto-population
      }
    }
  }, [autoSelectPlan, newlyCreatedSizingPlan, sizingYarnIssueDtl, setValue, normalizedSizingPlans]);


  useEffect(() => {
    const currentSessionByActual: Record<string, number> = {};
    selectedLots.forEach((lot) => {
      const qty = Number(lot.issueQty ?? lot.issuedQty ?? 0);
      if (!qty || qty <= 0) return;
      if (lot.yarnId != null) {
        const idKey = `id-${lot.yarnId}`;
        currentSessionByActual[idKey] = (currentSessionByActual[idKey] || 0) + qty;
        return;
      }
      const nameKeyBase = normalizeName(resolveAlternateYarnValue(lot) || lot.originalYarnName || lot.yarnName);
      if (!nameKeyBase) return;
      const nameKey = `name-${nameKeyBase}`;
      currentSessionByActual[nameKey] = (currentSessionByActual[nameKey] || 0) + qty;
    });

    setYarnRequirementDetails((prev) =>
      prev.map((req) => {
        const idKey = req.actualYarnId != null ? `id-${req.actualYarnId}` : null;
        const nameKeyBase = normalizeName(req.actualYarn || req.yarnName);
        const currentSessionQty =
          (idKey && currentSessionByActual[idKey] !== undefined ? currentSessionByActual[idKey] : undefined) ??
          (nameKeyBase ? currentSessionByActual[`name-${nameKeyBase}`] : undefined) ??
          0;
        const historicalQty = req.historicalIssuedQty ?? 0;
        const totalIssued = Number((historicalQty + currentSessionQty).toFixed(3));
        const balance = Number((req.warpRequirement - totalIssued).toFixed(3));
        return {
          ...req,
          totalIssuedQty: totalIssued,
          balanceToIssue: balance
        };
      })
    );
  }, [selectedLots, normalizeName]);

  const handleSizingPlanChange = async (sizingPlanId: number) => {
    if (!sizingPlanId) {
      setSelectedSizingPlan(null);
      setYarnRequirementDetails([]);
      setValue('fabricDetails', '', { shouldDirty: false, shouldValidate: false });
      setValue('vendorId', '', { shouldDirty: true, shouldValidate: true });
      return;
    }

    try {
      const result = await dispatch(getSizingPlanById(sizingPlanId));
      const sizingPlanData = result?.payload;
      const normalizedPlan = sizingPlanData?.data ?? sizingPlanData;

      if (normalizedPlan) {
        setSelectedSizingPlan(normalizedPlan);

        // Set vendor and terms from sizing plan
        setValue('vendorId', String(normalizedPlan.vendorId || ''));
        setValue('termsConditionsId', String(normalizedPlan.termsConditionsId || ''));

        // Create requirements from sizingQualityDetails
        if (normalizedPlan.sizingQualityDetails && normalizedPlan.sizingQualityDetails.length > 0) {
          const requirements: YarnRequirementDetail[] = normalizedPlan.sizingQualityDetails.map((qualityDetail: SizingQualityDetail) => {
            const fabric = fabricMasterList.find((f: FabricMaster) =>
              f.fabricCode === qualityDetail.fabricCode
            );

            const yarn = yarnList.find((y: YarnMaster) => y.id === qualityDetail.yarnId);
            const actualYarnObj = yarnList.find((y: YarnMaster) => y.id === qualityDetail.actualYarn) || yarn;

            const warpGramsPerMeter = fabric?.warpDetails?.[0]?.gramsPerMeter || 0;
            const warpRequirement = warpGramsPerMeter * (qualityDetail.warpMeters || 0);

            const fabricDetails = fabric
              ? `${fabric.fabricCode} - ${fabric.fabricQuality || fabric.fabricName}`
              : `${qualityDetail.fabricCode} - ${qualityDetail.quality}`;

            return {
              id: qualityDetail.id,
              fabricDetails,
              yarnName: yarn?.yarnName || 'N/A',
              actualYarn: actualYarnObj?.yarnName || yarn?.yarnName || 'N/A',
              actualYarnId: actualYarnObj?.id || qualityDetail.actualYarn || qualityDetail.yarnId,
              yarnId: qualityDetail.yarnId,
              warpMeters: qualityDetail.warpMeters || 0,
              warpGramsPerMeter: warpGramsPerMeter,
              warpRequirement: warpRequirement,
              totalIssuedQty: 0,
              balanceToIssue: warpRequirement
            };
          });

          const fabricDetailsSummary = Array.from(new Set(requirements.map((req) => req.fabricDetails).filter(Boolean))).join(', ');
          setValue('fabricDetails', fabricDetailsSummary, { shouldDirty: false, shouldValidate: false });

          try {
            const issuesResponse = await apiService.get('/sizing-yarn-issues?offset=0&limit=100');
            const allIssues = issuesResponse?.data || issuesResponse || [];

            const issuesByYarnName: { [key: string]: number } = {};

            allIssues
              .filter((issue: any) => Number(issue.sizingPlanId) === sizingPlanId)
              .forEach((issue: any) => {
                if (issue.sizingYarnIssue && Array.isArray(issue.sizingYarnIssue)) {
                  issue.sizingYarnIssue.forEach((lot: any) => {
                    const yarnName = lot.yarnName || '';
                    const issuedQty = Number(lot.issuedQty || lot.issueQty || 0);
                    issuesByYarnName[yarnName] = (issuesByYarnName[yarnName] || 0) + issuedQty;
                  });
                } else if (issue.requirements && Array.isArray(issue.requirements)) {
                  issue.requirements.forEach((req: any) => {
                    const yarnName = req.yarnName || '';
                    const issueQty = Number(req.totalIssuedQty) || 0;
                    if (issueQty > (issuesByYarnName[yarnName] || 0)) {
                      issuesByYarnName[yarnName] = issueQty;
                    }
                  });
                }
              });

            const updatedRequirements = requirements.map((req: YarnRequirementDetail) => {
              const historicalIssuedQty = issuesByYarnName[req.yarnName] || 0;
              return {
                ...req,
                historicalIssuedQty,
                totalIssuedQty: historicalIssuedQty,
                balanceToIssue: Math.max(0, req.warpRequirement - historicalIssuedQty)
              };
            });

            setYarnRequirementDetails(updatedRequirements);
            console.log("Calculated totals by yarn name:", issuesByYarnName);
          } catch (error) {
            console.error("Failed to fetch sizing yarn issues:", error);
            setYarnRequirementDetails(requirements);
          }

          // setYarnRequirementDetails(requirements);
          // setValue('fabricDetails', requirements.map((req: YarnRequirementDetail) => req.fabricDetails).join(', '));
          const uniqueQualities = [...new Set(requirements.map((req: YarnRequirementDetail) => req.quality))];
          setValue('fabricDetails', uniqueQualities.join(','), { shouldDirty: true, shouldValidate: true });
        }
      }
    } catch (error) {
      console.error("Error fetching sizing plan by ID:", error);
    }
  };

  // Handle actualYarn change in requirements
  const handleActualYarnChange = (index: number, newYarnId: string) => {
    const yarnId = parseInt(newYarnId);
    const selectedYarn = yarnList.find((y: YarnMaster) => y.id === yarnId);

    const updatedRequirements = yarnRequirementDetails.map((req, idx) =>
      idx === index
        ? {
          ...req,
          actualYarn: selectedYarn?.yarnName || '',
          actualYarnId: yarnId
        }
        : req
    );

    setYarnRequirementDetails(updatedRequirements);

    // Update only the alternateYarn in selected lots to match the new actual yarn
    // Do NOT change yarnId to preserve Total Issued Qty calculation
    const changedRequirement = updatedRequirements[index];
    if (changedRequirement) {
      setSelectedLots((prevLots) =>
        prevLots.map((lot) => {
          // Match by original yarn name to identify related lots
          if (lot.originalYarnName === yarnRequirementDetails[index].yarnName) {
            return {
              ...lot,
              alternateYarn: changedRequirement.actualYarn // Only update alternate yarn
            };
          }
          return lot;
        })
      );
    }
  };

  const handleYarnIssue = async () => {

    const sizingPlanId = watch("sizingPlanId");

    if (!sizingPlanId) {
      alert('Please select a sizing plan first to load requirements.');
      return;
    }

    try {
      const selectedPlan = sizingPlanList?.find((sp: any) => String(sp.id) === String(sizingPlanId));

      if (!selectedPlan || !selectedPlan.sizingPlanNo) {
        alert('Sizing plan order number not found.');
        return;
      }
      // const itemIds = yarnRequirementDetails.map(req => req.actualYarnId).join(',');

      const itemIds = [...new Set(yarnRequirementDetails.map((req: YarnRequirementDetail) => req.actualYarnId).filter(Boolean))].join(',');
      const response = await apiService.get(
        buildYarnInwardStockUrl(itemIds, resolvedCompanyId ?? companyId)
      );

      // alert(JSON.stringify(response));
      if (response && response.length > 0) {
        const seenUniqueIds = new Set<string>();
        const transformedLots: LotDetail[] = response.reduce((acc: LotDetail[], stock: any) => {
          const yarn = yarnList.find((y: YarnMaster) => y.id === stock.itemId);
          const yarnName = yarn?.yarnName || `Yarn-${stock.itemId}`;
          const requirement = yarnRequirementDetails.find(req => req.yarnId === stock.itemId);


          const acceptedQty = Number(stock.acceptedQty) || 0;
          const issuedQty = Number(stock.issuedQty) || 0;
          const warehouseId = stock.warehouseId;
          const availableQty = Number(stock.availableQty) || 0;
          const conesPerBag = Number(stock.conesPerBag ?? stock.noOfConesPerBag ?? 0);
          const kgsPerBag = Number(stock.kgsPerBag || 0);
          const conesWeight = stock.conesWeight != null
            ? Number(stock.conesWeight)
            : (conesPerBag > 0 && kgsPerBag > 0 ? Number((kgsPerBag / conesPerBag).toFixed(3)) : 0);
          const lotNumber = stock.lotNo || 'N/A';
          const inwardTypeId = stock.inwardTypeId;
          const inwardType = inwardTypes.find((t: any) => String(t.id) === String(inwardTypeId))?.code || 'N/A';

          const uniqueId = `${stock.orderItemId}_${stock.inwardId}_${lotNumber}`;
          if (seenUniqueIds.has(uniqueId)) return acc;
          seenUniqueIds.add(uniqueId);
          acc.push({
            id: stock.orderItemId,
            uniqueId,
            yarnId: stock.itemId,
            yarnName: yarnName,
            originalYarnName: requirement?.yarnName || yarnName,
            lotNumber,
            availableQty: availableQty,
            lotAvailableQty: availableQty,
            actualQty: acceptedQty,
            issueQty: 0,
            alternateYarn: requirement?.actualYarn || yarnName,
            millId: stock.millId || null,
            warehouseId: warehouseId ?? null,
            inwardId: stock.inwardId,
            orderItemId: stock.orderItemId,
            yarnInwardStockDetailsId: stock.id ?? stock.yarnInwardStockDetailsId ?? null,
            inwardTypeId,
            inwardType,
            inwardNo: stock.inwardNo || 'N/A',  
            poCategoryId: stock.poCategoryId,
            uomId: stock.uomId,
            issuedBags: 0,
            availableBags: Number(stock.availableBags || 0),
            lotAvailableBags: Number(stock.availableBags || 0),
            inwardBags: Number(stock.inwardBags || 0),
            noOfBags: 0,
            kgsPerBag: kgsPerBag,
            conesPerBag,
            conesWeight,
          });
          return acc;
        }, []);


        const excludedIds = [2, 3];
        const purchaseInwardLots = transformedLots.filter((lot) =>
          !excludedIds.includes(Number(lot.inwardTypeId))
        );

        setAvailableLots(purchaseInwardLots);
        // const purchaseInwardLots = transformedLots.filter((lot) =>
        //   Number(lot.inwardTypeId) === 1 ||
        //   String(lot.inwardType || '').toUpperCase() === 'PURCHASE_INWARD'
        // );
        // setAvailableLots(purchaseInwardLots);
        setShowLotDialog(true);
      } else {
        alert('No available lots found for the selected sizing plan.');
        setAvailableLots([]);
      }
    } catch (error) {

      console.error('Error fetching yarn inward stock:', error);
      setAvailableLots([]);
    }
  };


  const handleMetaChange = (uniqueId: string, field: 'millId' | 'warehouseId' | 'noOfBags' | 'kgsPerBag', value: string) => {
    setLotMeta((prev) => {
      const parsed = (field === 'noOfBags' || field === 'kgsPerBag') ? Number(value) || 0 : value;
      const next = { ...prev, [uniqueId]: { ...(prev[uniqueId] || {}), [field]: parsed } } as any;
      return next;
    });
    setSelectedLots((prev) => prev.map((l) => {
      if (l.uniqueId !== uniqueId) return l;
      const parsedValue = (field === 'noOfBags' || field === 'kgsPerBag') ? Number(value) || 0 : value;
      const updated: any = { ...l, [field]: parsedValue };
      if (field === 'noOfBags') {
        updated.issuedBags = parsedValue;
        const recalculatedQty = calculateIssueQty(parsedValue, updated.kgsPerBag);
        updated.issueQty = recalculatedQty;
        updated.issuedQty = recalculatedQty;
      }
      if (field === 'kgsPerBag' && (updated.conesPerBag ?? 0) > 0) {
        const conesPerBag = Number(updated.conesPerBag) || 0;
        const kgsPerBagValue = Number(parsedValue) || 0;
        updated.conesWeight = conesPerBag > 0 ? Number((kgsPerBagValue / conesPerBag).toFixed(3)) : updated.conesWeight;
      }
      return updated;
    }));
  };

  const handleAlternateYarnChange = (index: number, value: string) => {
    const updatedLots = [...selectedLots];
    updatedLots[index].alternateYarn = value;
    setSelectedLots(updatedLots);
    if (editingRowIndex === null) {
      setIsDraftSaved(false);
    }
  };

  const handleDeleteLot = (index: number) => {
    setSelectedLots(selectedLots.filter((_, i) => i !== index));
    setIsDraftSaved(false);
  };
  const handleEditRow = (index: number) => {
    setEditingRowIndex(index);
  };

  const handleSaveRow = (index: number) => {
    const lot = selectedLots[index];
    if (resolveAlternateYarnValue(lot) === '') {
      alert('Please enter alternate yarn');
      return;
    }
    setEditingRowIndex(null);
    setIsDraftSaved(false);
  };

  const handleSaveDraft = () => {
    if (selectedLots.length === 0) {
      alert('Please select at least one lot');
      return;
    }

    for (const lot of selectedLots) {
      if (resolveAlternateYarnValue(lot) === '') {
        alert('Please fill alternate yarn for all lots');
        return;
      }
      const cones = Number(lot.issuingCones ?? 0);
      const availBags = Number(lot.lotAvailableBags ?? lot.availableBags ?? 0);
      const conesPerBag = Number(lot.conesPerBag ?? 0);
      const maxCones = availBags > 0 && conesPerBag > 0 ? availBags * conesPerBag : (conesPerBag > 0 ? conesPerBag : 0);

      if (cones <= 0) {
        alert(`Issuing No. of Cones must be greater than 0 for lot ${lot.lotNumber || lot.yarnName || ''}`);
        return;
      }
      if (conesPerBag > 0 && cones > conesPerBag) {
        alert(`Issuing No. of Cones (${cones}) cannot exceed Cones per Bag (${conesPerBag}) for lot ${lot.lotNumber || lot.yarnName || ''}`);
        return;
      }
      if (maxCones > 0 && cones > maxCones) {
        alert(`Issuing No. of Cones (${cones}) cannot exceed stock available cones (${maxCones}) for lot ${lot.lotNumber || lot.yarnName || ''}`);
        return;
      }
    }

    setIsDraftSaved(true);
    setEditingRowIndex(null);
  };

  // Calculate totals for yarn requirement details
  const requirementTotals = useMemo(() => {
    return yarnRequirementDetails.reduce((acc, req) => ({
      warpRequirement: acc.warpRequirement + (req.warpRequirement || 0),
      totalIssuedQty: acc.totalIssuedQty + (req.totalIssuedQty || 0),
      balanceToIssue: acc.balanceToIssue + (req.balanceToIssue || 0)
    }), { warpRequirement: 0, totalIssuedQty: 0, balanceToIssue: 0 });
  }, [yarnRequirementDetails]);

  const activeYarnOptions = useMemo(() => {
    let list = [];
    if (Array.isArray(yarnList)) list = yarnList;
    else if (Array.isArray((yarnList as any)?.data)) list = (yarnList as any).data;
    return list.filter((y: any) => y.isActive !== false && y.activeFlag !== false);
  }, [yarnList]);

  const activeTransportOptions = useMemo(() => {
    let list = [];
    if (Array.isArray(transportList)) list = transportList;
    else if (Array.isArray((transportList as any)?.data)) list = (transportList as any).data;
    return list.filter((t: any) => t.isActive !== false && t.activeFlag !== false);
  }, [transportList]);

  const millOptions = useMemo(() => (subCategories || []).filter((sc: any) =>
    sc.categoryName === "Mill" && sc.isActive !== false && sc.activeFlag !== false
  ), [subCategories]);

  const warehouseOptions = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(warehouseList)) list = warehouseList;
    else if (Array.isArray((warehouseList as any)?.data)) list = (warehouseList as any).data;
    else if (Array.isArray((warehouseList as any)?.items)) list = (warehouseList as any).items;

    return list.filter((w: any) => w.isActive !== false && w.activeFlag !== false);
  }, [warehouseList]);

  const resolveWarehouseName = useCallback((warehouseId?: string | number | null) => {
    if (warehouseId === undefined || warehouseId === null || warehouseId === '') {
      return '';
    }
    const match = warehouseOptions.find((warehouse: any) => {
      const id = warehouse?.id ?? warehouse?.warehouseId;
      return id != null && String(id) === String(warehouseId);
    });
    return match?.warehouseName || match?.name || match?.label || '';
  }, [warehouseOptions]);

  const handleWarehouseChange = useCallback((index: number, value: string) => {
    setSelectedLots((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      const normalized = value ? Number(value) : null;
      updated[index] = {
        ...updated[index],
        warehouseId: normalized,
        warehouseName: normalized != null ? resolveWarehouseName(normalized) : undefined,
      };
      return updated;
    });
    if (editingRowIndex === null) {
      setIsDraftSaved(false);
    }
  }, [resolveWarehouseName, editingRowIndex]);

  // Mill and warehouse data now comes directly from API response, no additional setup needed

  const inwardIndex = useMemo(() => {
    const map = new Map<string, { millId?: number | string; warehouseId?: number | string; inwardId?: number | string; orderItemId?: number | string }>();
    availableLots.forEach((lot: LotDetail) => {
      if (lot.baseLotId && lot.lotYarnId) {
        const key = `${lot.baseLotId || lot.id}|${lot.lotYarnId || lot.yarnId || ''}`;
        map.set(key, {
          millId: lot.millId ?? undefined,
          warehouseId: lot.warehouseId ?? undefined,
          inwardId: lot.inwardId ?? undefined,
          orderItemId: lot.orderItemId ?? undefined
        });
      }
    });
    return map;
  }, [availableLots]);

  useEffect(() => {
    if (showLotDialog && availableLots.length > 0) {
      setLotMeta((prev) => {
        const next = { ...prev } as any;
        availableLots.forEach((lot) => {
          const originalUniqueId = `original_${lot.baseLotId || lot.id}_${lot.lotYarnId || lot.yarnId || ''}`;
          const actualUniqueId = `actual_${lot.baseLotId || lot.id}_${lot.lotYarnId || lot.yarnId || ''}`;
          const key = `${lot.baseLotId || lot.id}|${lot.lotYarnId || lot.yarnId || ''}`;
          const pref = inwardIndex.get(key);
          if (pref) {
            if (!next[originalUniqueId]) next[originalUniqueId] = { millId: pref.millId ?? '', warehouseId: pref.warehouseId ?? '' };
            if (!next[actualUniqueId]) next[actualUniqueId] = { millId: pref.millId ?? '', warehouseId: pref.warehouseId ?? '' };
          }
        });
        return next;
      });
      // assign uniqueId to preloaded selected lots for proper checkbox toggling
      setSelectedLots((prev) => prev.map((s) => {
        const lot = availableLots.find(al => al.lotNumber === s.lotNumber);
        if (!lot) return s;
        const origId = `original_${lot.baseLotId || lot.id}_${lot.lotYarnId || lot.yarnId || ''}`;
        const actId = `actual_${lot.baseLotId || lot.id}_${lot.lotYarnId || lot.yarnId || ''}`;
        if (!s.uniqueId) {
          if (s.alternateYarn === (lot.originalYarnName || lot.yarnName)) return { ...s, uniqueId: origId };
          if (s.alternateYarn === lot.yarnName) return { ...s, uniqueId: actId };
        }
        return s;
      }));
    }
  }, [showLotDialog, availableLots, inwardIndex]);

  const totalNetWt = useMemo(() => {
    return selectedLots.reduce((sum, lot) => sum + (lot.issueQty || 0), 0);
  }, [selectedLots]);

  const lotColumns = useMemo<PopupColumn[]>(() => [
    {
      Header: 'Select',
      id: 'selected',
      disableFilters: true,
      Cell: ({ row }) => {
        const isSelected = selectedLots.some(selected => (selected.uniqueId || selected.id) === (row.uniqueId || row.id));
        const handleSelect = () => {
          if (isSelected) {
            setSelectedLots(prev => prev.filter(item => (item.uniqueId || item.id) !== (row.uniqueId || row.id)));
          } else {
            const lotConesPerBag = Number(row.conesPerBag ?? 0);
            const lotAvailableBags = Number(row.availableBags ?? row.lotAvailableBags ?? 0);
            const availableCones = lotAvailableBags * lotConesPerBag;
            const lotConesWeight = row.conesWeight != null
              ? Number(row.conesWeight)
              : (lotConesPerBag > 0 && Number(row.kgsPerBag ?? 0) > 0
                ? Number((Number(row.kgsPerBag ?? 0) / lotConesPerBag).toFixed(3))
                : 0);
            const newLot: LotDetail = {
              ...row,
              alternateYarn: row.yarnName,
              availableCones: availableCones,
              issuingCones: '',
              noOfBags: 0,
              issuedBags: 0,
              issueQty: 0,
              millId: row.millId ?? null,
              warehouseId: row.warehouseId ?? null,
              warehouseName: resolveWarehouseName(row.warehouseId) || row.warehouseName,
              issuedQty: 0,
              conesPerBag: lotConesPerBag,
              conesWeight: lotConesWeight,
              perBabyConeWeight: row.perBabyConeWeight || 0.01
            };
            setSelectedLots(prev => [...prev, newLot]);
          }
        };

        return (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="w-4 h-4 cursor-pointer"
          />
        );
      },
    },
    {
      Header: 'Yarn Name',
      accessor: 'yarnName',
      id: 'yarnName',
    },
    {
      Header: 'Inward No',
      accessor: 'inwardNo',
      id: 'inwardNo',
    },
    {
      Header: 'Inward Type',
      accessor: (row: any) => row.inwardTypeId ? inwardTypeLabelById.get(String(row.inwardTypeId)) || row.inwardType || 'N/A' : 'N/A',
      id: 'inwardType',
    },
    {
      Header: 'PO Category',
      accessor: (row: any) => row.poCategoryId ? poCategoryMap[row.poCategoryId] || `Category ${row.poCategoryId}` : 'N/A',
      id: 'poCategory',
    },
    {
      Header: 'Lot No',
      accessor: 'lotNumber',
      id: 'lotNumber',
    },
    {
      Header: 'Available Bags',
      accessor: 'availableBags',
      id: 'availableBags',
    },
    {
      Header: 'No of Cones',
      accessor: (row: any) => row.availableCones != null ? Number(row.availableCones) : (Number(row.availableBags ?? row.lotAvailableBags ?? 0) * Number(row.conesPerBag ?? 0)),
      id: 'noOfCones',
    },
    {
      Header: 'Inward Bags',
      accessor: 'inwardBags',
      id: 'inwardBags',
      Cell: ({ row }) => (
        <Input
          type="number"
          value={Number(row.inwardBags ?? 0)}
          readOnly
          className="w-full p-1 border rounded bg-gray-100 cursor-not-allowed text-right text-black font-semibold"
        />
      ),
    },
    {
      Header: 'Kgs/Bag',
      accessor: 'kgsPerBag',
      id: 'kgsPerBag',
      Cell: ({ row }) => (
        <Input
          type="number"
          value={Number(row.kgsPerBag ?? 0)}
          readOnly
          className="w-full p-1 border rounded bg-gray-100 cursor-not-allowed text-right text-black font-semibold"
        />
      ),
    },
    {
      Header: 'Cones/Bag',
      accessor: 'conesPerBag',
      id: 'conesPerBag',
    },
    {
      Header: 'Cones Weight',
      accessor: (row: any) => Number(row.conesWeight ?? 0).toFixed(3),
      id: 'conesWeight',
    },
    {
      Header: 'Available Qty',
      accessor: (row: any) => Number(row.availableQty ?? 0).toFixed(3),
      id: 'availableQty',
    },
    {
      Header: 'Mill',
      accessor: (row: any) => millOptions.find((m: any) => String(m.id) === String(row.millId))?.subCategoryName || 'N/A',
      id: 'mill',
    },
    {
      Header: 'Warehouse',
      accessor: (row: any) => resolveWarehouseName(row.warehouseId) || 'N/A',
      id: 'warehouse',
    },
  ], [selectedLots, millOptions, resolveWarehouseName, inwardTypeLabelById, poCategoryMap]);

  useEffect(() => {
    // Auto-populate gross weight with total net weight if not manually changed
    if (totalNetWt > 0) {
      const currentGrossWt = watch("grossWt");
      if (!currentGrossWt || Number(currentGrossWt) === 0) {
        setValue('grossWt', totalNetWt.toFixed(3));
      }
    }
  }, [totalNetWt, setValue, watch]);

  const onSubmit = async (data: SizingYarnIssueFormData) => {
    const isEditMode = Boolean(sizingYarnIssueDtl?.id);
    let issueNo = data.issueNo || sizingYarnIssueDtl?.issueNo || "";
    if (!sizingYarnIssueDtl?.id && (!issueNo || issueNo.startsWith("Loading"))) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Sizing Yarn Issue",
        });
        issueNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    // Validate selected lots
    for (const lot of selectedLots) {
      if (resolveAlternateYarnValue(lot) === '') {
        alert('Please fill alternate yarn for all lots');
        return;
      }
      const cones = Number(lot.issuingCones ?? 0);
      const availBags = Number(lot.lotAvailableBags ?? lot.availableBags ?? 0);
      const conesPerBag = Number(lot.conesPerBag ?? 0);
      const availCones = lot.availableCones != null ? Number(lot.availableCones) : (availBags > 0 && conesPerBag > 0 ? availBags * conesPerBag : 0);

      if (cones <= 0) {
        alert(`Issuing No. of Cones must be greater than 0 for lot ${lot.lotNumber || lot.yarnName || ''}`);
        return;
      }
      if (availCones > 0 && cones > availCones) {
        alert(`Issuing No. of Cones (${cones}) cannot exceed Available Cones (${availCones}) for lot ${lot.lotNumber || lot.yarnName || ''}`);
        return;
      }
    }

    const selectedCompanyId = resolveSelectedCompanyId();
    if (!selectedCompanyId) {
      alert("Please select a company before submitting");
      return;
    }


    const fabricDetailsSummary = yarnRequirementDetails
      .map((req) => req.fabricDetails?.trim())
      .filter((detail): detail is string => Boolean(detail))
      .filter((detail, index, array) => array.indexOf(detail) === index)
      .join(", ");

    isSavingRef.current = true;
    const sizingPlanNoValue = selectedSizingPlan?.sizingPlanNo || resolvedSizingPlanMeta?.sizingPlanNo || "";
    const payload = {
      vendorId: parseInt(data.vendorId),
      sizingPlanId: parseInt(data.sizingPlanId),
      sizingPlanNo: sizingPlanNoValue,
      outwardTypeId: 53,
      transportationDetails: data.transportationDetails,
      transportId: data.transportId ? parseInt(data.transportId) : null,
      transportName: data.transportationDetails, // Added for compatibility
      termsConditionsId: data.termsConditionsId ? parseInt(data.termsConditionsId) : 0,
      fabricDetails: fabricDetailsSummary || data.fabricDetails,
      sizingYarnIssueDate: data.yarnIssueDate,
      yarnIssueChallanNo: data.yarnIssueChallanNo,
      activeFlag: true,
      issueNo: issueNo,
      companyId: selectedCompanyId,
      orderTypeId: resolvedOrderTypeId ?? undefined,
      tradingCompanyId: selectedCompanyId,
      factoryCompanyId: derivedFactoryCompanyId ?? undefined,
      grossWt: Number(data.grossWt) || Number(totalNetWt.toFixed(3)),
      totalNetWt: Number(totalNetWt.toFixed(3)),
      remark: data.remark || '',
      vehicleNo: data.vehicleNo || '',
      requirements: yarnRequirementDetails.map((req: YarnRequirementDetail) => ({
        id: req.id || 0,
        fabricDetails: req.fabricDetails,
        yarnName: req.yarnName,
        actualYarn: req.actualYarn,
        yarnId: req.yarnId,
        actualYarnId: req.actualYarnId,
        warpMeters: req.warpMeters,
        warpGramsPerMeter: req.warpGramsPerMeter,
        warpRequirement: req.warpRequirement,
        totalIssuedQty: req.totalIssuedQty,
        balanceToIssue: req.balanceToIssue,
        inwardId: 0,
        orderItemId: 0,
        activeFlag: true
      })),
      sizingYarnIssue: selectedLots.map((lot: LotDetail) => {

        return {
          id: lot.id || 0,
          sizingYarnIssueEntryId: 0,
          yarnName: lot.yarnName,
          yarnId: Number(lot.yarnId),
          millId: lot.millId ? Number(lot.millId) : 0,
          warehouseId: lot.warehouseId ? Number(lot.warehouseId) : 0,
          inwardId: lot.inwardId ?? 0,
          orderItemId: lot.orderItemId ?? 0,
          yarnInwardStockDetailsId: lot.yarnInwardStockDetailsId ?? null,
          actualItemId: lot.yarnId,
          uomId: lot.uomId ?? 0,
          issuedQty: lot.issuedQty || 0,
          availableQty: Number(lot.availableQty ?? lot.lotAvailableQty ?? 0),
          lotAvailableQty: Number(lot.lotAvailableQty ?? lot.availableQty ?? 0),
          noOfBags: Number(lot.noOfBags ?? 0),
          availableBags: Number(lot.availableBags ?? lot.lotAvailableBags ?? 0),
          lotAvailableBags: Number(lot.lotAvailableBags ?? lot.availableBags ?? 0),
          kgsPerBag: lot.kgsPerBag ?? 0,
          conesPerBag: lot.conesPerBag ?? 0,
          conesWeight: lot.conesWeight ?? 0,
          issuedBags: lot.issuedBags ?? 0,
          perBabyConeWeight: Number(lot.perBabyConeWeight ?? 0.01),
          noOfCones: Number(lot.issuingCones ?? 0),
          availableCones: Number(lot.availableCones ?? (Number(lot.availableBags ?? lot.lotAvailableBags ?? 0) * Number(lot.conesPerBag ?? 0))),
          inwardTypeId: lot.inwardTypeId ?? 0,
          lotNo: lot.lotNumber,
          activeFlag: true
        };
      })
    };

    try {
      // alert("Submitted payload:\n" + JSON.stringify(payload));
      console.log("Submitting Sizing Yarn Issue with payload:", payload);
      if (isEditMode) {
        await dispatch(updateSizingYarnIssue({
          id: sizingYarnIssueDtl.id,
          data: payload
        })).unwrap();
      } else {
        await dispatch(createSizingYarnIssue(payload)).unwrap();

        documentNumberService.clearMemoryCache('Sizing Yarn Issue');
      }

      const allBalanceZero = payload.requirements.length > 0 &&
        payload.requirements.every((req: any) => Number(req.balanceToIssue ?? 0) <= 0);
      if (allBalanceZero) {
        const planNo = payload.sizingPlanNo || '';
        toast.info(`You have issued all remaining quantities for sizing plan${planNo ? ' ' + planNo : ''}.`);
      }

      const stateSalesOrderId =
        location.state?.salesOrderId ||
        resolvedSizingPlanMeta?.salesOrderId ||
        selectedSizingPlan?.salesOrderId ||
        selectedSizingPlan?.sizingBeamDetails?.find((beam: any) => beam?.salesOrderId)?.salesOrderId ||
        resolvedSizingPlanMeta?.sizingBeamDetails?.find((beam: any) => beam?.salesOrderId)?.salesOrderId;

      navigate("/transaction/order-entry-management", {
        state: {
          source: "order-entry-management",
          salesOrderId: stateSalesOrderId ? Number(stateSalesOrderId) : undefined,
          expandedRowId: stateSalesOrderId ? Number(stateSalesOrderId) : undefined,
          activeTab: location.state?.activeTab,
          flowType: "sizing",
          selectedHyperlink: location.state?.selectedHyperlink || "sizingPlan",
          fromOrderEntry: true,
          expandView: "true",
          refreshData: true
        }
      });
    } catch (error: any) {
      console.error("Error creating/updating Sizing Yarn Issue:", error);
      // alert(error.message || "Failed to save Sizing Yarn Issue");
    }
  };

  return (
    <div className="p-6 pt-16 bg-white shadow-md rounded-lg">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/transaction/sizing-yarn-issue-details")}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">
            {sizingYarnIssueDtl ? "Edit Sizing Yarn Issue" : "Sizing Yarn Issue"}
          </h2>
        </div>

      </div>

      <div className="space-y-6 mt-6">
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
                Order Details
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "orderDetails" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} /> Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">

                  <div>
                    <label className="block text-sm font-medium mb-1 text-secondary-700">Issue No</label>
                    <input
                      type="text"
                      placeholder="Loading sequence..."
                      readOnly
                      className={`w-full border px-3 py-2 rounded transition-all duration-200 ${
                        !watch('issueNo') || watch('issueNo')?.startsWith('Loading')
                          ? 'text-blue-600 bg-blue-50 font-medium animate-pulse border-blue-300 placeholder:text-blue-400'
                          : 'bg-gray-100 text-gray-800 font-medium border-gray-300'
                      }`}
                      {...register('issueNo')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Sizing Yarn Issue Date <span className="text-red-600">*</span></label>
                    <input
                      type="date"
                      {...register("yarnIssueDate", { required: "Sizing Yarn Issue Date is required" })}
                      className="input mt-1"
                    />
                    {errors.yarnIssueDate && <p className="mt-1 text-sm text-red-600">{errors.yarnIssueDate.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Sizing Plan Number <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      {...register("sizingPlanId", { required: "Sizing Plan Number is required" })}
                      value={watch("sizingPlanId") || ""}
                      onValueChange={(val) => {
                        setValue("sizingPlanId", val, { shouldValidate: true, shouldDirty: true });
                      }}
                      options={normalizedSizingPlans?.map((sp: any) => ({
                        value: String(sp.id),
                        label: sp.sizingPlanNo,
                        isActive: sp.isActive,
                      }))}
                      placeholder="Select a Sizing Plan No"
                      className="mt-1 "
                      error={errors.sizingPlanId?.message as string}
                      disabled={isIssueMapped}
                    />
                    {errors.sizingPlanId && <p className="mt-1 text-sm text-red-600">{errors.sizingPlanId.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Sizing Vendor <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      {...register("vendorId", { required: "Sizing Vendor is required" })}
                      value={watch("vendorId") || ""}
                      onValueChange={(val) => {
                        setValue("vendorId", val, { shouldValidate: true, shouldDirty: true });
                      }}
                      options={sizingVendorOptions.map((vendor: any) => ({
                        value: String(vendor.id),
                        label: vendor.vendorName,
                        isActive: vendor.isActive,
                      }))}
                      placeholder="Select a Sizing Vendor"
                      className="mt-1"
                      error={errors.vendorId?.message as string}
                      disabled={isIssueMapped}
                    />
                    {errors.vendorId && (
                      <p className="mt-1 text-sm text-red-600">{errors.vendorId.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Transportation Details</label>
                    <CommonSearchableSelect
                      {...register("transportId")}
                      value={watch("transportId") || ""}
                      onValueChange={(val) => {
                        setValue("transportId", val, { shouldValidate: true, shouldDirty: true });
                        const transport = activeTransportOptions?.find((t: any) => String(t.id) === val);
                        if (transport) {
                          setValue("transportationDetails", transport.transportName || transport.name);
                        }
                      }}
                      options={activeTransportOptions?.map((t: any) => ({
                        value: String(t.id),
                        label: t.transportName || t.name,
                      }))}
                      placeholder="Select Transportation"
                      className="mt-1"
                    />
                    {/* transportationDetails will be set from sizingYarnIssueDtl or transport selection */}
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium">Fabric Details</label>
                    <input
                      {...register("fabricDetails")}
                      className="input mt-1"
                      placeholder="Fabric details will auto-populate"
                      readOnly
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Yarn Issue Challan No</label>
                    <input
                      {...register("yarnIssueChallanNo")}
                      className="input mt-1"
                      placeholder="Enter challan number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Gross Wt</label>
                    <input
                      type="number"
                      step="0.001"
                      {...register("grossWt")}
                      className="input mt-1"
                      placeholder="Enter gross weight"
                    />
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium">Total Net Wt</label>
                    <input
                      value={totalNetWt.toFixed(3)}
                      readOnly
                      className="input mt-1 bg-gray-100"
                    />
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Vehicle No</label>
                    <input
                      {...register("vehicleNo")}
                      className="input mt-1"
                      placeholder="Enter vehicle number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">remark</label>
                    <textarea
                      {...register("remark")}
                      className="input mt-1"
                      placeholder="Enter remark"
                      rows={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Yarn Requirement Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Yarn Requirement Details</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-center">Fabric Details</th>
                      <th className="border p-2 text-center">Yarn Name</th>
                      <th className="border p-2 text-center">Actual Yarn</th>
                      <th className="border p-2 text-center">Warp Meters</th>
                      <th className="border p-2 text-center">Warp Grams/Mtr</th>
                      <th className="border p-2 text-center">Warp Requirement</th>
                      <th className="border p-2 text-center">Total Issued Qty</th>
                      <th className="border p-2 text-center">Balance to Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yarnRequirementDetails.length > 0 ? (
                      <>
                        {yarnRequirementDetails.map((detail: YarnRequirementDetail, index: number) => (
                          <tr key={index}>
                            <td className="border p-2">{detail.fabricDetails}</td>
                            <td className="border p-2">{detail.yarnName}</td>
                            <td className="border p-2">
                              <CommonSearchableSelect
                                value={detail.actualYarnId}
                                options={activeYarnOptions?.map((yarn: any) => ({
                                  value: String(yarn.id),
                                  label: yarn.yarnName,
                                }))}
                                onValueChange={(value) => handleActualYarnChange(index, value)}
                                placeholder="Select Actual Yarn"
                                className="w-full"
                              // disabled={isIssueMapped}
                              />
                            </td>
                            <td className="border p-2">{detail.warpMeters}</td>
                            <td className="border p-2">{detail.warpGramsPerMeter.toFixed(3)}</td>
                            <td className="border p-2">{detail.warpRequirement.toFixed(3)}</td>
                            <td className="border p-2">{detail.totalIssuedQty.toFixed(3)}</td>
                            <td className="border p-2">{detail.balanceToIssue.toFixed(3)}</td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="border p-2" colSpan={5}>Total</td>
                          <td className="border p-2">{requirementTotals.warpRequirement.toFixed(3)}</td>
                          <td className="border p-2">{requirementTotals.totalIssuedQty.toFixed(3)}</td>
                          <td className="border p-2">{requirementTotals.balanceToIssue.toFixed(3)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={6} className="border p-2 text-center text-gray-500">
                          Select a Sizing Plan Number to view yarn requirements
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Yarn Issue Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Yarn Issue Details</span>
                  <Button
                    onClick={handleYarnIssue}
                    className="bg-primary hover:bg-primary"
                    disabled={yarnRequirementDetails.length === 0}
                  >
                    YARN ISSUE
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Sl No</th>
                      <th className="border p-2">Actual Yarn</th>
                      <th className="border p-2">Alternate Yarn</th>
                      <th className="border p-2">Mill</th>
                      <th className="border p-2">Warehouse</th>
                      <th className="border p-2">Available Bags</th>
                      <th className="border p-2">Kgs/Bag</th>
                      <th className="border p-2">Cones/Bag</th>
                      <th className="border p-2">Cones Weight</th>
                      <th className="border p-2">Per Baby Cone Wt (Kg)</th>
                      <th className="border p-2">Available Qty</th>
                      <th className="border p-2">Available Cones</th>
                      <th className="border p-2">Issuing No. of Cones *</th>
                      <th className="border p-2">Required Bags</th>
                      <th className="border p-2">Issue Qty (Kgs)</th>
                      <th className="border p-2">Lot No</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLots.length > 0 ? (
                      selectedLots.map((lot: LotDetail, index: number) => {
                        const isEditing = !isDraftSaved || editingRowIndex === index;
                        const alternateDisplay = resolveAlternateYarnValue(lot);
                        const availBags = Number(lot.lotAvailableBags ?? lot.availableBags ?? 0);
                        const conesPerBag = Number(lot.conesPerBag ?? 0);
                        const conesWeight = Number(lot.conesWeight ?? 0);
                        const issuingConesVal = lot.issuingCones === 0 ? '' : (lot.issuingCones ?? '');
                        const noOfBagsVal = lot.noOfBags === 0 ? '' : (lot.noOfBags ?? '');
                        const issueQtyVal = lot.issueQty === 0 ? '' : (lot.issueQty ?? '');
                        const perBabyConeWtVal = (lot.perBabyConeWeight !== undefined && lot.perBabyConeWeight !== null && lot.perBabyConeWeight !== '') ? lot.perBabyConeWeight : 0.01;

                        return (
                          <tr key={lot.uniqueId || index}>
                            <td className="border p-2 text-center">{index + 1}</td>
                            <td className="border p-2">{lot.originalYarnName || '-'}</td>
                            <td className="border p-2">{alternateDisplay || '-'}</td>
                            <td className="border p-2">
                              <span>{(millOptions.find((m: any) => String(m.id) === String(lot.millId))?.subCategoryName) || '-'}</span>
                            </td>
                            <td className="border p-2">
                              <span>{lot.warehouseName || resolveWarehouseName(lot.warehouseId) || '-'}</span>
                            </td>

                            <td className="border p-2">{availBags}</td>
                            <td className="border p-2">{Number(lot.kgsPerBag ?? 0)}</td>
                            <td className="border p-2">{conesPerBag}</td>
                            <td className="border p-2">{conesWeight.toFixed(3)}</td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                step="0.001"
                                placeholder="0.010"
                                value={perBabyConeWtVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const babyConeWt = val === '' ? 0.01 : Number(val);
                                  setSelectedLots((prev) => {
                                    const updated = [...prev];
                                    if (!updated[index]) return prev;
                                    const targetLot = updated[index];
                                    const cWeight = Number(targetLot.conesWeight ?? 0);
                                    const conesNum = Number(targetLot.issuingCones ?? 0);
                                    const computedQty = conesNum > 0 ? Number((conesNum * cWeight).toFixed(3)) : (targetLot.issueQty ?? 0);
                                    updated[index] = {
                                      ...targetLot,
                                      perBabyConeWeight: val === '' ? '' : babyConeWt,
                                      issueQty: computedQty,
                                      issuedQty: computedQty
                                    };
                                    return updated;
                                  });
                                  setIsDraftSaved(false);
                                }}
                                disabled={!isEditing}
                                className={`w-full ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              />
                            </td>
                            <td className="border p-2">{Number(lot.lotAvailableQty ?? 0)}</td>
                            <td className="border p-2">
                              {lot.availableCones != null ? Number(lot.availableCones) : (availBags > 0 && conesPerBag > 0 ? availBags * conesPerBag : 0)}
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                placeholder="Enter cones"
                                value={issuingConesVal}
                                onChange={(e) => {
                                  const rawVal = e.target.value;
                                  const cones = rawVal === '' ? '' : Number(rawVal);
                                  const availBags = Number(lot.lotAvailableBags ?? lot.availableBags ?? 0);
                                  const cPerBag = Number(lot.conesPerBag ?? 0);
                                  const availCones = lot.availableCones != null ? Number(lot.availableCones) : (availBags > 0 && cPerBag > 0 ? availBags * cPerBag : 0);
                                  if (typeof cones === 'number' && availCones > 0 && cones > availCones) {
                                    alert(`Issuing No. of Cones (${cones}) cannot exceed Available Cones (${availCones}) for lot ${lot.lotNumber || lot.yarnName || ''}`);
                                  }
                                  setSelectedLots((prev) => {
                                    const updated = [...prev];
                                    if (!updated[index]) {
                                      return prev;
                                    }
                                    const targetLot = updated[index];
                                    const cPerBag = Number(targetLot.conesPerBag ?? 0);
                                    const cWeight = Number(targetLot.conesWeight ?? 0);
                                    const conesNum = typeof cones === 'number' ? cones : 0;
                                    const reqBags = cPerBag > 0 && conesNum > 0 ? Number((conesNum / cPerBag).toFixed(3)) : 0;
                                    const computedQty = Number((conesNum * cWeight).toFixed(3));
                                    updated[index] = {
                                      ...targetLot,
                                      issuingCones: cones,
                                      noOfBags: reqBags,
                                      issuedBags: reqBags,
                                      issueQty: computedQty,
                                      issuedQty: computedQty
                                    };
                                    return updated;
                                  });
                                  setIsDraftSaved(false);
                                }}
                                disabled={!isEditing}
                                className={`w-full ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                placeholder="Bags"
                                value={noOfBagsVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const bagsNum = val === '' ? 0 : Number(val);
                                  setSelectedLots((prev) => {
                                    const updated = [...prev];
                                    if (!updated[index]) return prev;
                                    updated[index] = {
                                      ...updated[index],
                                      noOfBags: bagsNum,
                                      issuedBags: bagsNum
                                    };
                                    return updated;
                                  });
                                  setIsDraftSaved(false);
                                }}
                                disabled={!isEditing}
                                className={`w-full ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              />
                            </td>
                            <td className="border p-2">
                              <Input
                                type="number"
                                step="0.001"
                                placeholder="0.000"
                                value={issueQtyVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const qtyNum = val === '' ? 0 : Number(val);
                                  setSelectedLots((prev) => {
                                    const updated = [...prev];
                                    if (!updated[index]) return prev;
                                    updated[index] = {
                                      ...updated[index],
                                      issueQty: qtyNum,
                                      issuedQty: qtyNum
                                    };
                                    return updated;
                                  });
                                  setIsDraftSaved(false);
                                }}
                                disabled={!isEditing}
                                className={`w-full ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              />
                            </td>
                            <td className="border p-2">{lot.lotNumber}</td>
                            <td className="border p-2 text-center">
                              <div className="flex gap-2 justify-center">
                                {isDraftSaved && editingRowIndex !== index && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditRow(index)}
                                    className="bg-primary hover:bg-primary"
                                  >
                                    <Edit size={14} />
                                  </Button>
                                )}
                                {isDraftSaved && editingRowIndex === index && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveRow(index)}
                                    className="bg-primary hover:bg-primary"
                                  >
                                    <Check size={14} />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => handleDeleteLot(index)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={17} className="border p-2 text-center text-gray-500">
                          No lots selected. Click "YARN ISSUE" to select yarn lots.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {selectedLots.length > 0 && (
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
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Lot Selection Dialog - Simplified */}
        <Dialog open={showLotDialog} onOpenChange={setShowLotDialog}>
          <DialogContent className="max-w-[95vw] w-fit min-w-[70vw] max-h-[90vh] overflow-hidden p-4">
            <DialogHeader>
              <DialogTitle>Select Lots for Yarn Issue</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <PopupDataTable
                columns={lotColumns}
                data={availableLots}
                emptyMessage={
                  availableLots.length === 0
                    ? 'No lots available for issue.'
                    : 'No lots match your search.'
                }
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowLotDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowLotDialog(false)}>
                Confirm Selection ({selectedLots.length} selected)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div>

        {isIssueMapped && (
          <div className="mt-4 flex gap-3.5 items-center bg-orange-50 border border-orange-300 rounded-xl px-4 py-3.5">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C05621" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-medium text-orange-900 m-0 mb-0.5">Record is linked to other modules</p>
              <p className="text-xs text-orange-700 m-0 mb-1.5">The fields below are locked and cannot be modified.</p>
              <div className="flex flex-wrap gap-1.5">
                {["Sizing Plan Number", "Sizing Vendor", "Actual Yarn", "Warehouse", "Issue Qty", "Issuing No of Bags"].map(f => (
                  <span key={f} className="text-[11px] font-medium bg-orange-200 text-orange-900 rounded-full px-2.5 py-0.5">{f}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* <p>{isWeavingContractMapped ? "This weaving contract is mapped and cannot be modified." : ""}</p> */}
      </div>
      <div className="flex justify-end gap-2 mt-8">
        <Button
          onClick={handleSubmit(onSubmit)}
          className="bg-primary hover:bg-primary text-white px-6 flex items-center"
          disabled={!isFormValid}
        >
          <Save size={18} className="mr-2" />
          {sizingYarnIssueDtl ? "Update Sizing Yarn Issue" : "Save Sizing Yarn Issue"}
        </Button>
      </div>
    </div>

  );
}