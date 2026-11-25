import apiService from "@/services/ApiService";
import { fetchBeamCardData, fetchBeamsList } from "@/services/beamCardService";
import { BeamCardData, BeamSummary } from "@/types/beamCard";

export interface SizingInvoiceReportDetail {
  id?: number;
  invNo: string;
  invDate: string;
  sizingCost: number;
  gstAmount: number;
  netTotal: number;
  mediaDetailSno?: number;
  mediaSno?: number;
  invoiceUpload?: string;
}

export interface BeamInwardReportBeamDetail {
  id?: number;
  sizedBeamNo: string;
  flangeNo?: string;
  flangeId?: number;
  wrapMeters?: number;
  shrinkage?: number;
  expectedFabricMeter?: number;
  totalEnds?: number;
  warpCount?: string;
  warpYarnMillName?: string;
  warpYarnLotNo?: string;
  sizingPickupPercent?: number;
  weavingVendorId?: number;
  weavingContractId?: number;
  salesOrderId?: number;
  fabricId?: number;
}

export interface BeamInwardReportQualityDetail {
  id?: number;
  quality?: string;
  yarnId?: number;
  sordEnds?: number;
  actualEnds?: number;
  parts?: number;
  endsPerPart?: number;
  wrapMeters?: number;
  fabricCode?: string;
  fabricId?: number;
  actualYarn?: string;
  warpEnds?: string;
  actualWarpEnds?: string;
  fabricPanelWidth?: number;
  totalEnds?: number;
}

export interface BeamCardReportData {
  beamNo: string;
  inwardFound: boolean;
  beamInwardId?: number;
  beamInwardNo?: string;
  beamInwardDate?: string;
  dcNumber?: string;
  dcDate?: string;
  sizingVendorId?: number;
  sizingVendorName?: string;
  sizingRate?: number;
  sizingSetNo?: string;
  totalBeams?: number;
  avgBeamCount?: number;
  sizingPickup?: number;
  elongation?: number;
  breaksMillion?: number;
  babyConeWt?: number;
  actualWeight?: number;
  warpingWeight?: number;
  excessShortage?: number;
  freshCone?: number;
  rewindingCone?: number;
  remarks?: string;

  // Stored Sizing Invoice Details (from sizing invoice upload in beam inward entry)
  invoiceDetails: SizingInvoiceReportDetail[];

  // Matched Beam inward specific details
  matchedBeamDetail?: BeamInwardReportBeamDetail;

  // Quality details from beam inward entry
  qualityDetails: BeamInwardReportQualityDetail[];

  // Linked Beam Card production metrics (from beam-card)
  beamCardData?: BeamCardData | null;
}

/**
 * Normalizes beam number for loose/flexible matching
 * (e.g. "37180/158", "37180", "37180 / 158", "BEAM-37180")
 */
export function normalizeBeamNumber(val?: string): string {
  if (!val) return '';
  return String(val).toLowerCase().replace(/\s+/g, '').trim();
}

/**
 * Checks if a candidate beam detail matches the target beam number
 */
export function isBeamMatching(targetBeam: string, bSizedBeamNo?: string, bFlangeNo?: string): boolean {
  if (!targetBeam || (!bSizedBeamNo && !bFlangeNo)) return false;

  const cleanTarget = normalizeBeamNumber(targetBeam);
  const cleanTargetBase = cleanTarget.split('/')[0].split('-')[0].trim();

  const cleanSized = normalizeBeamNumber(bSizedBeamNo);
  const cleanFlange = normalizeBeamNumber(bFlangeNo);
  const fullCombined = cleanFlange ? `${cleanSized}/${cleanFlange}` : cleanSized;
  const cleanSizedBase = cleanSized.split('/')[0].split('-')[0].trim();

  if (cleanTarget === fullCombined || cleanTarget === cleanSized) return true;
  if (cleanTargetBase && cleanSizedBase && cleanTargetBase === cleanSizedBase) return true;
  if (cleanTarget.includes(cleanSized) && cleanSized.length > 2) return true;
  if (cleanSized.includes(cleanTargetBase) && cleanTargetBase.length > 2) return true;

  return false;
}

/**
 * Fetch Beam Inward & Sizing Invoice Report against the specified beam number
 */
export async function fetchBeamInwardReport(beamNo: string, companyId?: number): Promise<BeamCardReportData> {
  if (!beamNo || !beamNo.trim()) {
    throw new Error("Beam Number is required to fetch report.");
  }

  const trimmedBeamNo = beamNo.trim();
  let matchedInward: any = null;
  let matchedBeam: any = null;

  // 1. First attempt dedicated backend endpoint: /beam-inward/by-beam/{beamNo}
  try {
    const encodedBeam = encodeURIComponent(trimmedBeamNo);
    const directRes = await apiService.get(`/beam-inward/by-beam/${encodedBeam}`);
    const directList = Array.isArray(directRes?.data?.data)
      ? directRes.data.data
      : Array.isArray(directRes?.data)
      ? directRes.data
      : Array.isArray(directRes)
      ? directRes
      : [];

    if (directList.length > 0) {
      matchedInward = directList[0];
      const beamsList: any[] = matchedInward.beamInwardBeamDetails || [];
      matchedBeam = beamsList.find((b: any) =>
        isBeamMatching(trimmedBeamNo, b.sizedBeamNo, b.flangeNo)
      ) || beamsList[0];
    }
  } catch (err) {
    // Fallback gracefully to listing query
    console.warn("Direct /beam-inward/by-beam check failed, falling back to full list:", err);
  }

  // 2. If not found, fetch Beam Inwards list and search across inward beam details
  if (!matchedInward) {
    try {
      const endpoint = companyId
        ? `/beam-inward/company/${companyId}?offset=0&limit=10000`
        : `/beam-inward?offset=0&limit=10000`;
      const res = await apiService.get(endpoint);
      const rawList: any[] = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      for (const item of rawList) {
        const beams: any[] = item.beamInwardBeamDetails || [];
        const found = beams.find((b: any) =>
          isBeamMatching(trimmedBeamNo, b.sizedBeamNo, b.flangeNo)
        );
        if (found) {
          matchedInward = item;
          matchedBeam = found;
          break;
        }
      }

      // If matched from shallow list, fetch full details by ID to ensure invoiceDetails are loaded
      if (matchedInward && (!matchedInward.invoiceDetails || matchedInward.invoiceDetails.length === 0)) {
        try {
          const detailEndpoint = companyId
            ? `/beam-inward/company/${companyId}/${matchedInward.id}`
            : `/beam-inward/${matchedInward.id}`;
          const detailRes = await apiService.get(detailEndpoint);
          const fullData = detailRes?.data?.data || detailRes?.data || detailRes;
          if (fullData && fullData.id) {
            matchedInward = fullData;
            const fullBeams: any[] = fullData.beamInwardBeamDetails || [];
            matchedBeam = fullBeams.find((b: any) =>
              isBeamMatching(trimmedBeamNo, b.sizedBeamNo, b.flangeNo)
            ) || matchedBeam || fullBeams[0];
          }
        } catch (fetchDetailErr) {
          console.warn("Could not fetch full inward detail by id:", fetchDetailErr);
        }
      }
    } catch (err) {
      console.warn("Error searching beam inward list:", err);
    }
  }

  // 3. Check localStorage for offline/cached beam inward data
  if (!matchedInward) {
    try {
      const localInwardStr = localStorage.getItem(`beam_inward_${trimmedBeamNo}`) || localStorage.getItem(`beam_inward_last_created`);
      if (localInwardStr) {
        const parsed = JSON.parse(localInwardStr);
        const beams: any[] = parsed.beamInwardBeamDetails || [];
        const found = beams.find((b: any) => isBeamMatching(trimmedBeamNo, b.sizedBeamNo, b.flangeNo));
        if (found || parsed) {
          matchedInward = parsed;
          matchedBeam = found || beams[0];
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 4. Fetch linked Beam Card data for production cross-reference
  let linkedCardData: BeamCardData | null = null;
  try {
    linkedCardData = await fetchBeamCardData(trimmedBeamNo);
  } catch (cardErr) {
    console.warn("Could not fetch linked Beam Card data:", cardErr);
  }

  // Extract Invoice Details (the sizing invoice details uploaded in beam inward entry)
  const rawInvoices: any[] = matchedInward?.invoiceDetails || [];
  const normalizedInvoices: SizingInvoiceReportDetail[] = rawInvoices.map((inv: any, idx: number) => ({
    id: inv.id || idx + 1,
    invNo: String(inv.invNo || inv.invoiceNo || inv.inv_no || '-'),
    invDate: String(inv.invDate || inv.invoiceDate || inv.inv_date || '-'),
    sizingCost: Number(inv.sizingCost ?? inv.sizing_cost ?? 0) || 0,
    gstAmount: Number(inv.gstAmount ?? inv.gst_amount ?? 0) || 0,
    netTotal: Number(inv.netTotal ?? inv.net_total ?? 0) || 0,
    mediaDetailSno: inv.mediaDetailSno ?? inv.media_detail_sno,
    mediaSno: inv.mediaSno ?? inv.media_sno,
    invoiceUpload: inv.invoiceUpload || inv.invoice_upload || inv.mediaUrl || inv.fileUrl || undefined
  }));

  // If no invoice found in inward, check if beam card or fallback has invoice info
  if (normalizedInvoices.length === 0 && matchedInward?.dcNumber) {
    // Generate empty structure with default values
  }

  // Extract Quality Details
  const rawQualities: any[] = matchedInward?.beamInwardQualityDetails || [];
  const normalizedQualities: BeamInwardReportQualityDetail[] = rawQualities.map((q: any, idx: number) => ({
    id: q.id || idx + 1,
    quality: q.quality || '-',
    yarnId: q.yarnId,
    sordEnds: q.sordEnds != null ? Number(q.sordEnds) : undefined,
    actualEnds: q.actualEnds != null ? Number(q.actualEnds) : undefined,
    parts: q.parts != null ? Number(q.parts) : undefined,
    endsPerPart: q.endsPerPart != null ? Number(q.endsPerPart) : undefined,
    wrapMeters: q.wrapMeters != null ? Number(q.wrapMeters) : undefined,
    fabricCode: q.fabricCode || '-',
    actualYarn: q.actualYarn || '-',
    warpEnds: q.warpEnds ? String(q.warpEnds) : undefined,
    actualWarpEnds: q.actualWarpEnds ? String(q.actualWarpEnds) : undefined,
    fabricPanelWidth: q.fabricPanelWidth != null ? Number(q.fabricPanelWidth) : undefined,
    totalEnds: q.totalEnds != null ? Number(q.totalEnds) : undefined
  }));

  // Extract Matched Beam Details
  let normalizedBeamDetail: BeamInwardReportBeamDetail | undefined = undefined;
  if (matchedBeam) {
    normalizedBeamDetail = {
      id: matchedBeam.id,
      sizedBeamNo: matchedBeam.sizedBeamNo || trimmedBeamNo,
      flangeNo: matchedBeam.flangeNo || matchedBeam.flange_no,
      flangeId: matchedBeam.flangeId || matchedBeam.flange_id,
      wrapMeters: matchedBeam.wrapMeters != null ? Number(matchedBeam.wrapMeters) : (linkedCardData?.beamDetails.warpLength),
      shrinkage: matchedBeam.shrinkage != null ? Number(matchedBeam.shrinkage) : undefined,
      expectedFabricMeter: matchedBeam.expectedFabricMeter != null ? Number(matchedBeam.expectedFabricMeter) : undefined,
      totalEnds: matchedBeam.totalEnds != null ? Number(matchedBeam.totalEnds) : (Number(linkedCardData?.beamDetails.endsPerBeam) || undefined),
      warpCount: matchedBeam.warpCount || linkedCardData?.beamDetails.warpCount,
      warpYarnMillName: matchedBeam.warpYarnMillName || linkedCardData?.beamDetails.warpMillName,
      warpYarnLotNo: matchedBeam.warpYarnLotNo || linkedCardData?.beamDetails.warpLotNo,
      sizingPickupPercent: matchedBeam.sizingPickupPercent != null ? Number(matchedBeam.sizingPickupPercent) : undefined,
      weavingVendorId: matchedBeam.weavingVendorId,
      weavingContractId: matchedBeam.weavingContractId,
      salesOrderId: matchedBeam.salesOrderId,
      fabricId: matchedBeam.fabricId
    };
  } else if (linkedCardData) {
    // Fallback beam details from Beam Card
    normalizedBeamDetail = {
      sizedBeamNo: trimmedBeamNo,
      flangeNo: trimmedBeamNo.includes('/') ? trimmedBeamNo.split('/')[1] : undefined,
      wrapMeters: linkedCardData.beamDetails.warpLength,
      totalEnds: Number(linkedCardData.beamDetails.endsPerBeam) || undefined,
      warpCount: linkedCardData.beamDetails.warpCount,
      warpYarnMillName: linkedCardData.beamDetails.warpMillName,
      warpYarnLotNo: linkedCardData.beamDetails.warpLotNo
    };
  }

  return {
    beamNo: trimmedBeamNo,
    inwardFound: Boolean(matchedInward),
    beamInwardId: matchedInward?.id,
    beamInwardNo: matchedInward?.beamInwardNo || '-',
    beamInwardDate: matchedInward?.beamInwardDate || '-',
    dcNumber: matchedInward?.dcNumber || '-',
    dcDate: matchedInward?.dcDate || '-',
    sizingVendorId: matchedInward?.sizingVendorId,
    sizingVendorName: matchedInward?.sizingVendorName || (linkedCardData?.beamDetails.sizer),
    sizingRate: matchedInward?.sizingRate != null ? Number(matchedInward.sizingRate) : undefined,
    sizingSetNo: matchedInward?.sizingSetNo || linkedCardData?.beamDetails.setNo || '-',
    totalBeams: matchedInward?.totalBeams != null ? Number(matchedInward.totalBeams) : undefined,
    avgBeamCount: matchedInward?.avgBeamCount != null ? Number(matchedInward.avgBeamCount) : undefined,
    sizingPickup: matchedInward?.sizingPickup != null ? Number(matchedInward.sizingPickup) : undefined,
    elongation: matchedInward?.elongation != null ? Number(matchedInward.elongation) : undefined,
    breaksMillion: matchedInward?.breaksMillion != null ? Number(matchedInward.breaksMillion) : undefined,
    babyConeWt: matchedInward?.babyConeWt != null ? Number(matchedInward.babyConeWt) : undefined,
    actualWeight: matchedInward?.actualWeight != null ? Number(matchedInward.actualWeight) : undefined,
    warpingWeight: matchedInward?.warpingWeight != null ? Number(matchedInward.warpingWeight) : undefined,
    excessShortage: matchedInward?.excessShortage != null ? Number(matchedInward.excessShortage) : undefined,
    freshCone: matchedInward?.freshCone != null ? Number(matchedInward.freshCone) : undefined,
    rewindingCone: matchedInward?.rewindingCone != null ? Number(matchedInward.rewindingCone) : undefined,
    remarks: matchedInward?.remarks,
    invoiceDetails: normalizedInvoices,
    matchedBeamDetail: normalizedBeamDetail,
    qualityDetails: normalizedQualities,
    beamCardData: linkedCardData
  };
}
