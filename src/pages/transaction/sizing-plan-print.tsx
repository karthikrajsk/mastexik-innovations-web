import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllVendors } from '@/state/vendorSlice';
import { getAllConsignee } from '@/state/consigneeSlice';
import { getAllFabricMasters } from '@/state/fabricMasterSlice';
import { getAllYarnMasters } from '@/state/yarnSlice';
import { getAllCompanies } from '@/state/company-master-slice';
import { getAllWeavingContract } from '@/state/weavingContractSlice';
import { getAllSubCategories } from '@/state/subCategorySlice';
import apiService from '@/services/ApiService';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SizingPlanPrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [sizingPlan, setSizingPlan] = useState<any>(null);
  const [yarnIssueData, setYarnIssueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redux store selectors
  const { vendorList = [] } = useSelector((state: RootState) => state.vendor);
  const { consigneeList = [] } = useSelector((state: RootState) => state.consignee);
  const { fabricMasterList = [] } = useSelector((state: RootState) => state.fabricMaster);
  const { yarnList = [] } = useSelector((state: RootState) => state.yarn);
  const { companyMasterList = [] } = useSelector((state: RootState) => (state.companyMaster as any) || { companyMasterList: [] });
  const { weavingContractList = [] } = useSelector((state: RootState) => state.weavingContracts);
  const { subCategoryList = [] } = useSelector((state: RootState) => state.subCategory);

  // Fetch all necessary dependency data and the specific plan by ID
  useEffect(() => {
    const companyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const params = companyId ? { companyId: Number(companyId) } : {};

    dispatch(getAllVendors({ fetchAll: true, ...params }));
    dispatch(getAllConsignee({ fetchAll: true }));
    dispatch(getAllFabricMasters({ fetchAll: true }));
    dispatch(getAllYarnMasters({ fetchAll: true }));
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllWeavingContract({ fetchAll: true, ...params }));
    dispatch(getAllSubCategories({ fetchAll: true }));

    const fetchSizingPlan = async () => {
      try {
        setLoading(true);
        const endpoint = companyId ? `/sizing-plan/company/${companyId}/${id}` : `/sizing-plan/${id}`;
        const response = await apiService.get(endpoint);
        const plan = response.data || response;
        setSizingPlan(plan);

        // Fetch associated sizing yarn issue data for Mill & Lot
        try {
          const issueEndpoint = companyId
            ? `/sizing-yarn-issues/company/${companyId}?offset=0&limit=500`
            : `/sizing-yarn-issues?offset=0&limit=500`;
          const issueRes = await apiService.get(issueEndpoint);
          const rawIssues = issueRes?.data || issueRes || [];
          const issuesList = Array.isArray(rawIssues)
            ? rawIssues
            : (Array.isArray(rawIssues.data) ? rawIssues.data : (Array.isArray(rawIssues.items) ? rawIssues.items : []));

          const matched = issuesList.find((issue: any) => Number(issue.sizingPlanId) === Number(id));
          if (matched) {
            const issueItems = matched.sizingYarnIssue || matched.sizingYarnIssueDetails || matched.yarnIssueDetails || [];
            const itemIds = issueItems.map((item: any) => item.yarnId || item.actualItemId || item.itemId).filter(Boolean);

            if (itemIds.length > 0) {
              try {
                const uniqueItemIds = [...new Set(itemIds)].join(',');
                const stockEndpoint = companyId
                  ? `/sizing-yarn-issues/yarn-inward-stock?itemId=${encodeURIComponent(uniqueItemIds)}&companyId=${companyId}`
                  : `/sizing-yarn-issues/yarn-inward-stock?itemId=${encodeURIComponent(uniqueItemIds)}`;
                const stockRes = await apiService.get(stockEndpoint);
                const stockList = Array.isArray(stockRes) ? stockRes : (Array.isArray(stockRes?.data) ? stockRes.data : []);

                const stockMap = new Map();
                stockList.forEach((s: any) => {
                  if (s.yarnInwardStockDetailsId) {
                    stockMap.set(String(s.yarnInwardStockDetailsId), s);
                  }
                });

                const enrichedIssueItems = issueItems.map((item: any) => {
                  const stockMatch = stockMap.get(String(item.yarnInwardStockDetailsId));
                  return {
                    ...item,
                    millId: item.millId || stockMatch?.millId || null,
                    millName: item.millName || stockMatch?.millName || stockMatch?.subCategoryName || null,
                    millInvNo: item.millInvNo || stockMatch?.millInvNo || null,
                    millDate: item.millDate || stockMatch?.millDate || null,
                  };
                });

                setYarnIssueData({
                  ...matched,
                  sizingYarnIssue: enrichedIssueItems
                });
              } catch (stockErr) {
                console.warn("Could not fetch yarn inward stock details:", stockErr);
                setYarnIssueData(matched);
              }
            } else {
              setYarnIssueData(matched);
            }
          }
        } catch (issueErr) {
          console.warn("Could not fetch yarn issue for sizing plan print:", issueErr);
        }
      } catch (err: any) {
        console.error('Error fetching Sizing Plan:', err);
        setError(err.message || 'Failed to load Sizing Plan');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSizingPlan();
    }
  }, [id, dispatch]);

  // Derived properties for template
  const planData = useMemo(() => {
    if (!sizingPlan) return null;

    // 1. Company Information
    const companyId = sizingPlan.companyId || localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const company = companyMasterList.find((c: any) => String(c.id) === String(companyId)) || {};

    // 2. Sizing Vendor (Unit Name)
    const vendor = vendorList.find((v: any) => String(v.id) === String(sizingPlan.vendorId)) || {};

    // 3. Weaver (Consignee)
    const weaver = consigneeList.find((c: any) => String(c.id) === String(sizingPlan.consigneeId)) || {};

    // 4. Quality Details & Associated Fabric Master
    const qualityDtl = sizingPlan.qualityDetails?.[0] || sizingPlan.sizingQualityDetails?.[0] || {};
    const targetFabricId = qualityDtl.fabricId || qualityDtl.fabricCodeId || qualityDtl.fabricMasterId;
    const targetFabricCode = qualityDtl.fabricCode || qualityDtl.sortNo;
    const targetQuality = qualityDtl.quality || qualityDtl.construction;

    const fabric = fabricMasterList.find((f: any) => 
      (targetFabricId && String(f.id) === String(targetFabricId)) ||
      (targetFabricCode && (String(f.fabricCode).trim().toUpperCase() === String(targetFabricCode).trim().toUpperCase() || String(f.code).trim().toUpperCase() === String(targetFabricCode).trim().toUpperCase())) ||
      (targetQuality && String(f.fabricQuality).trim().toUpperCase() === String(targetQuality).trim().toUpperCase())
    ) || {};

    // 5. Yarn details
    const yarnId = qualityDtl.yarnId || fabric.warpCount;
    const yarn = yarnList.find((y: any) => String(y.id) === String(yarnId)) || {};

    // 6. Weaving Contract to lookup loom type
    const beamDetails = sizingPlan.beamDetails || sizingPlan.sizingBeamDetails || [];
    const firstBeam = beamDetails[0] || {};
    const contract = weavingContractList.find((c: any) => String(c.id) === String(firstBeam.weavingContractId)) || {};

    // Find loomType from the contract items
    const contractItem = contract?.items?.find((item: any) => String(item.fabricCodeId) === String(qualityDtl.fabricId || qualityDtl.fabricCodeId)) || {};
    const loomType = contractItem.loomType || 'AIRJET';

    // 7. Calculate calculations and details
    const totalSetLength = beamDetails.reduce((sum: number, b: any) => sum + (Number(b.warpMeters) || 0), 0);
    const noOfBeams = beamDetails.length;

    // Weave & Weave details
    let weaveName = 'N/A';
    if (fabric.weave) {
      const weaveSubCat = subCategoryList.find((sc: any) => String(sc.id) === String(fabric.weave));
      weaveName = weaveSubCat?.subCategoryName || String(fabric.weave);
    }

    // EPI resolution from fabric master (prioritize onTableEpi / onLoomEpi against construction / sortNo / fabricMasterId)
    const resolvedEpi = (() => {
      if (fabric.onTableEpi != null && fabric.onTableEpi !== "") {
        return String(fabric.onTableEpi);
      }
      if (fabric.onLoomEpi != null && fabric.onLoomEpi !== "") {
        return String(fabric.onLoomEpi);
      }
      if (fabric.epi != null && fabric.epi !== "") {
        return String(fabric.epi);
      }
      if (fabric.fabricEpi != null && fabric.fabricEpi !== "") {
        return String(fabric.fabricEpi);
      }
      const warpDetailsList = fabric.warpDetails || [];
      if (Array.isArray(warpDetailsList) && warpDetailsList.length > 0) {
        const firstWarpEpi = warpDetailsList.find((w: any) => w.epi != null && Number(w.epi) > 0 && Number(w.epi) < 2000)?.epi;
        if (firstWarpEpi) return String(Math.round(firstWarpEpi));
      }
      if (qualityDtl.onTableEpi != null && qualityDtl.onTableEpi !== "") {
        return String(qualityDtl.onTableEpi);
      }
      if (qualityDtl.epi != null && qualityDtl.epi !== "") {
        return String(qualityDtl.epi);
      }
      if (qualityDtl.warpEnds != null && qualityDtl.warpEnds !== "") {
        return String(qualityDtl.warpEnds);
      }
      return 'N/A';
    })();

    // PPI resolution: format as ppi 'x' noOfInsertion (e.g. 76 x 5)
    const rawPpi = Number(fabric.ppi || qualityDtl.ppi) || 0;
    const insertion = Number(fabric.noOfInsertion ?? fabric.insertion ?? qualityDtl.noOfInsertion) || 1;
    const resolvedPpi = rawPpi > 0
      ? (insertion > 1 ? `${rawPpi} x ${insertion}` : `${rawPpi}`)
      : (fabric.ppi || qualityDtl.ppi || 'N/A');

    // Total Ends resolution from actualWarpEnds
    const qualityItems = sizingPlan.qualityDetails || sizingPlan.sizingQualityDetails || [];
    const sumActualWarpEnds = Array.isArray(qualityItems) && qualityItems.length > 0
      ? qualityItems.reduce((sum: number, q: any) => sum + (Number(q.actualWarpEnds) || Number(q.actualEnds) || 0), 0)
      : 0;
    const resolvedTotalEnds = sumActualWarpEnds > 0
      ? sumActualWarpEnds
      : (qualityDtl.actualWarpEnds || qualityDtl.actualEnds || fabric.totalEnds || 'N/A');

    // Resolve Mill Name & Lot from Yarn Issue
    const millNameAndLot = (() => {
      if (yarnIssueData) {
        const issueItems = yarnIssueData.sizingYarnIssue || yarnIssueData.sizingYarnIssueDetails || yarnIssueData.yarnIssueDetails || [];
        if (Array.isArray(issueItems) && issueItems.length > 0) {
          const pairs = issueItems.map((item: any) => {
            let mill = item.millName || item.subCategoryName || item.mill || '';
            if (!mill && item.millId) {
              const sc = subCategoryList.find((s: any) => String(s.id) === String(item.millId));
              if (sc) mill = sc.subCategoryName;
              else {
                const v = vendorList.find((v: any) => String(v.id) === String(item.millId));
                if (v) mill = v.vendorName;
              }
            }
            const lot = item.lotNo || item.lotNumber || item.lot || '';
            if (mill && lot) return `${mill} & ${lot}`;
            if (mill) return mill;
            if (lot) return `Lot: ${lot}`;
            return '';
          }).filter(Boolean);

          if (pairs.length > 0) {
            return [...new Set(pairs)].join(' / ');
          }
        }
      }
      return sizingPlan.remarks?.match(/Mill:\s*([^-\n]+)/)?.[1]?.trim() || 'N/A';
    })();

    // Resolve Cone Weight from Yarn Issue
    const coneWeightStr = (() => {
      if (yarnIssueData) {
        const issueItems = yarnIssueData.sizingYarnIssue || yarnIssueData.sizingYarnIssueDetails || yarnIssueData.yarnIssueDetails || [];
        if (Array.isArray(issueItems) && issueItems.length > 0) {
          const found = issueItems.find((item: any) => {
            const cw = Number(item.conesWeight ?? item.coneWeight ?? item.cone_weight ?? item.cones_weight ?? 0);
            return cw > 0;
          });
          if (found) {
            const val = Number(found.conesWeight ?? found.coneWeight ?? found.cone_weight ?? found.cones_weight);
            return `${val.toFixed(3)} KGS.`;
          }
        }
      }
      return '1.250 KGS.';
    })();

    // Format Invoice Remark 1
    const invoiceRemarkText = (() => {
      if (yarnIssueData) {
        const issueItems = yarnIssueData.sizingYarnIssue || yarnIssueData.sizingYarnIssueDetails || yarnIssueData.yarnIssueDetails || [];
        if (Array.isArray(issueItems) && issueItems.length > 0) {
          const formatShortDate = (dateStr: string) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            return `${day}-${month}-${year}`;
          };

          const invEntries = issueItems.map((item: any) => {
            const invNo = item.millInvNo || item.inwardNo || '';
            const invDt = item.millDate ? formatShortDate(item.millDate) : '';

            // Resolve Mill Name dynamically from item, subCategoryList, or vendorList
            let millName = item.millName || item.subCategoryName || item.mill || '';
            if (!millName && item.millId) {
              const sc = subCategoryList.find((s: any) => String(s.id) === String(item.millId));
              if (sc) millName = sc.subCategoryName || sc.name || '';
              else {
                const v = vendorList.find((v: any) => String(v.id) === String(item.millId));
                if (v) millName = v.vendorName || v.name || '';
              }
            }

            let entryStr = '';
            if (invNo && invDt) {
              entryStr = `${invNo} / Dt:${invDt}`;
            } else if (invNo) {
              entryStr = invNo;
            }

            if (entryStr && millName) {
              return `${entryStr} - Mill: ${millName}`;
            } else if (entryStr) {
              return `${entryStr} Spinners`;
            } else if (millName) {
              return millName;
            }
            return '';
          }).filter(Boolean);

          const uniqueInvoices = [...new Set(invEntries)];
          if (uniqueInvoices.length > 0) {
            return `Please use Invoice No : ${uniqueInvoices.join(' & ')}`;
          }
        }
      }
      if (sizingPlan.remarks && sizingPlan.remarks.trim()) {
        return sizingPlan.remarks;
      }
      return 'Please process sizing work order as per standard specifications.';
    })();

    // Resolve Beam Type & Format No. OF SIZED BEAMS
    const noOfSizedBeamsStr = (() => {
      if (!Array.isArray(beamDetails) || beamDetails.length === 0) {
        return '0 (Picanol Beam)';
      }

      const resolveBeamTypeName = (beamTypeId: any) => {
        if (!beamTypeId) return 'Picanol';
        const sc = subCategoryList.find((item: any) => String(item.id) === String(beamTypeId));
        return sc?.subCategoryName || sc?.name || String(beamTypeId);
      };

      const formatBeamTypeName = (rawName: string) => {
        if (!rawName) return 'Picanol Beam';
        const trimmed = rawName.trim();
        if (/\bbeam\b/i.test(trimmed)) {
          return trimmed;
        }
        return `${trimmed} Beam`;
      };

      const countsMap = new Map<string, number>();
      beamDetails.forEach((b: any) => {
        const rawName = resolveBeamTypeName(b.beamTypeId);
        const formattedName = formatBeamTypeName(rawName);
        countsMap.set(formattedName, (countsMap.get(formattedName) || 0) + 1);
      });

      const parts = Array.from(countsMap.entries()).map(
        ([typeName, count]) => `${count} (${typeName})`
      );

      return parts.join(', ');
    })();

    // Details for sizing program card
    return {
      companyName: company.companyName || 'HAYAGREEVAS FABRICS PVT.LTD, PALLADAM',
      sizingUnitName: vendor.vendorName || 'M/s. RITHIK SIZING MILLS INDIA (P) LTD',
      programmeNo: sizingPlan.sizingPlanNo || 'N/A',
      programmeDate: sizingPlan.sizingPlanDate ? formatDate(sizingPlan.sizingPlanDate) : 'N/A',
      construction: fabric.fabricQuality || qualityDtl.quality || 'N/A',
      sortNo: fabric.fabricCode || qualityDtl.fabricCode || 'N/A',
      millNameAndLot: millNameAndLot,
      coneWeight: coneWeightStr,
      count: yarn.yarnName || 'N/A',
      epi: resolvedEpi,
      ppi: resolvedPpi,
      greyWidth: fabric.fabricWidth ? `${fabric.fabricWidth}"` : (qualityDtl.fabricPanelWidth ? `${qualityDtl.fabricPanelWidth}"` : 'N/A'),
      loomType: loomType,
      weave: weaveName,
      totalEnds: resolvedTotalEnds,
      selvedgeEnds: fabric.selvedgeEnds || 'N/A',
      beamWidth: fabric.reedspace ? `${fabric.reedspace}"` : '128"',
      noOfCreels: sizingPlan.noOfCreels ? String(sizingPlan.noOfCreels) : 'N/A',
      sections: qualityDtl.parts ? `${qualityDtl.parts} Sections` : 'N/A',
      calculatedSetLength: totalSetLength ? `${totalSetLength.toLocaleString()}` : 'N/A',
      noOfSizedBeams: noOfSizedBeamsStr,
      rateKg: sizingPlan.sizingRate ? `Rs.${sizingPlan.sizingRate.toFixed(2)} + GST ( Including Transport )` : 'N/A',
      sizedBeamMtrsDeliveryTo: beamDetails.map((b: any) => `${Number(b.warpMeters).toLocaleString()} Mtrs X 1 Beam`).join(' + ') + ` - All Old Beams--340CM Single beam , TO- ${weaver.consigneeName || 'HAYAGREEVAS FABRICS'}`,
      remarks: sizingPlan.remarks || '',
      invoiceRemarkText: invoiceRemarkText,
      qualityDetails: sizingPlan.qualityDetails || sizingPlan.sizingQualityDetails || [],
    };
  }, [sizingPlan, yarnIssueData, companyMasterList, vendorList, consigneeList, fabricMasterList, yarnList, weavingContractList, subCategoryList]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading print details...</p>
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <p className="text-red-500 font-semibold text-lg mb-2">Error Loading Sizing Plan</p>
          <p className="text-gray-600 mb-6">{error || 'Sizing Plan record not found'}</p>
          <Button onClick={() => navigate('/transaction/sizing-plan-details')}>
            Back to Sizing Plan List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:p-0 print:m-0 print:min-h-0 print:h-auto print:bg-white print:overflow-visible font-sans text-black text-[13px] leading-relaxed sizing-print-page">
      {/* Scoped Print Styles to completely remove scrollbars and prevent overflow in print */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          html, body, #root {
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            box-sizing: border-box !important;
          }
          .sizing-print-page {
            min-height: 0 !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .sizing-print-card {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .sizing-print-outer-box {
            margin-top: 4px !important;
          }
        }
      `}</style>

      {/* Controls Header - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-6 px-4 flex justify-between items-center print:hidden">
        <Button
          variant="outline"
          onClick={() => navigate('/transaction/sizing-plan-details')}
          className="flex items-center gap-2 bg-white"
        >
          <ArrowLeft size={16} /> Back to Sizing Plan Details
        </Button>
        <Button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primary text-white"
        >
          <Printer size={16} /> Print Sizing Job Work
        </Button>
      </div>

      {/* Main Printable Card */}
      <div className="max-w-4xl mx-auto bg-white p-8 border border-gray-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:overflow-visible relative sizing-print-card">

        {/* Outer Grid Wrapper */}
        <div className="border-[2px] border-black mt-10 print:mt-1 sizing-print-outer-box">
          {/* Header Title Box */}
          <div className="text-center border-b-[2px] border-black py-2 bg-white">
            <h1 className="text-base font-bold uppercase tracking-wide">
              {planData.companyName}
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-wider mt-0.5">
              SIZING JOB WORK PROGRAMME
            </h2>
          </div>

          {/* Sizing Unit Name Row */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1.5 font-bold uppercase text-[11px] flex items-center">
              SIZING UNIT NAME:
            </div>
            <div className="col-span-9 px-3 py-1.5 font-bold text-sm text-gray-900 flex items-center">
              {planData.sizingUnitName}
            </div>
          </div>

          {/* Form Table Grid */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">PROGRAMME NO</div>
            <div className="col-span-4 border-r border-black px-3 py-1 font-bold flex items-center text-black">
              : {planData.programmeNo}
            </div>
            <div className="col-span-2 border-r border-black px-2 py-1 font-bold flex items-center justify-end">DATE :</div>
            <div className="col-span-3 px-3 py-1 font-bold flex items-center">
              {planData.programmeDate}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold flex items-center">CONSTRUCTION</div>
            <div className="col-span-9 px-3 py-1 font-bold text-gray-800 text-[12px] flex items-center">
              : {planData.construction}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold flex items-center">MILL NAME & LOT</div>
            <div className="col-span-5 border-r border-black px-3 py-1 font-bold flex items-center">
              : {planData.millNameAndLot}
            </div>
            <div className="col-span-4 px-3 py-1 text-right text-[11px] font-bold text-gray-800 flex items-center justify-end">
              HFPL Sort No : {planData.sortNo}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">COUNT</div>
            <div className="col-span-9 px-3 py-1 font-bold text-gray-800">
              : {planData.count}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">E P I</div>
            <div className="col-span-4 border-r border-black px-3 py-1 font-semibold">
              : {planData.epi}
            </div>
            <div className="col-span-2 border-r border-black px-2 py-1 font-bold">CONE ID :</div>
            <div className="col-span-3 px-3 py-1 font-semibold">:</div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">P P I</div>
            <div className="col-span-9 px-3 py-1 font-semibold">
              : {planData.ppi}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">GREY WIDTH</div>
            <div className="col-span-9 px-3 py-1 font-semibold">
              : {planData.greyWidth}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">LOOM TYPE</div>
            <div className="col-span-9 px-3 py-1 font-bold uppercase text-gray-800">
              : {planData.loomType}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">WEAVE</div>
            <div className="col-span-9 px-3 py-1 font-semibold">
              : {planData.weave}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">TOTAL ENDS</div>
            <div className="col-span-4 border-r border-black px-2 py-1 font-bold flex items-center">
              : FOR SINGLE BEAM
            </div>
            <div className="col-span-5 px-3 py-1 font-bold text-gray-900 text-sm flex items-center justify-end">
              {Number(planData.totalEnds).toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">SELVEDGE ENDS</div>
            <div className="col-span-9 px-3 py-1 font-semibold">
              : {planData.selvedgeEnds}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">BEAM WIDTH</div>
            <div className="col-span-9 px-3 py-1 font-semibold">
              : {planData.beamWidth}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold flex items-center">No.OF CREELS</div>
            <div className="col-span-4 border-r border-black px-3 py-1 font-semibold flex items-center">
              : {planData.noOfCreels}
            </div>
            <div className="col-span-5 px-3 py-1 font-bold flex items-center justify-end">
              {planData.sections}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">CALCULATED SET LENGTH</div>
            <div className="col-span-9 px-3 py-1 font-bold text-gray-900">
              : {planData.calculatedSetLength}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">No.OF SIZED BEAMS</div>
            <div className="col-span-9 px-3 py-1 font-bold text-gray-800">
              : {planData.noOfSizedBeams}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1 font-bold">Rate / Kg</div>
            <div className="col-span-9 px-3 py-1 font-bold text-gray-800">
              : {planData.rateKg}
            </div>
          </div>

          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-3 border-r border-black px-2 py-1.5 font-bold flex items-center">SIZED BEAM MTRS DELIVERY TO</div>
            <div className="col-span-9 px-3 py-1.5 font-semibold text-gray-800 text-[11px] flex items-center">
              : {planData.sizedBeamMtrsDeliveryTo}
            </div>
          </div>

          {/* Remarks Section */}
          <div className="p-3 border-b border-black text-[11px] leading-snug">
            <div className="font-bold mb-1">REMARKS:</div>

            {/* Display list of remarks dynamically */}
            <div className="pl-4 space-y-1 text-[11px]">
              <div>1) {planData.invoiceRemarkText}</div>
              <div>2) In Empty Beam - Picking Side is Fixed <span className="font-bold ">"DO NOT ADJUST"</span>-- for Identification Purpose Alphabet <span className="font-bold">"P" is Marked on Fixed Flange.</span></div>
              <div>3) Need to Clean - Beam Flange</div>
              <div>4) Kindly Put " Yellow Cone " - <span className="font-bold">Yellow Yarn Four End in Selvedge Corner</span></div>
            </div>

            {/* Cone Calculations Summary Table */}
            <div className="mt-3 max-w-md mx-auto border border-black bg-white text-[11px]">
              <div className="text-center font-bold border-b border-black py-0.5 tracking-wider bg-gray-50 uppercase text-[10px]">
                CONE WEIGHT {planData.coneWeight} ACTUAL COUNT- {planData.count.toUpperCase()}
              </div>

              {planData.qualityDetails.map((q: any, i: number) => {
                const cones = q.endsPerPart || 0;
                const sections = q.parts || 0;
                const totalCones = cones * sections;
                return (
                  <div key={i} className="grid grid-cols-12 border-b border-black px-2 py-0.5 font-mono">
                    <div className="col-span-4 text-right">{cones} Cones</div>
                    <div className="col-span-1 text-center">X</div>
                    <div className="col-span-2 text-center">{sections}</div>
                    <div className="col-span-1 text-center">=</div>
                    <div className="col-span-4 text-right font-bold">{totalCones.toLocaleString()}</div>
                  </div>
                );
              })}

              {/* Fallback empty row if no items */}
              {planData.qualityDetails.length === 0 && (
                <div className="grid grid-cols-12 border-b border-black px-2 py-0.5 font-mono">
                  <div className="col-span-4 text-right">0 Cones</div>
                  <div className="col-span-1 text-center">X</div>
                  <div className="col-span-2 text-center">0</div>
                  <div className="col-span-1 text-center">=</div>
                  <div className="col-span-4 text-right font-bold">0</div>
                </div>
              )}

              {/* Total Row */}
              <div className="grid grid-cols-12 px-2 py-0.5 font-mono font-bold bg-gray-50">
                <div className="col-span-7 text-right uppercase">TOTAL</div>
                <div className="col-span-1 text-center">=</div>
                <div className="col-span-4 text-right">
                  {planData.qualityDetails.reduce((sum: number, q: any) => sum + ((Number(q.endsPerPart) || 0) * (Number(q.parts) || 0)), 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Signatures block */}
          <div className="grid grid-cols-2 h-16 text-center items-end pb-2 font-bold uppercase text-[11px] tracking-wide">
            <div className="border-r border-black h-full flex flex-col justify-end">
              <span>PROGRAMMED BY</span>
            </div>
            <div className="h-full flex flex-col justify-end">
              <span>APPROVED BY</span>
            </div>
          </div>
        </div>

        {/* Green Box Bottom Right Stamp */}
        <div className="mt-4 print:mt-2 flex justify-end">
          <div className="border-[2px] border-emerald-600/40 text-emerald-700/60 font-bold uppercase text-base px-4 py-1 tracking-widest rounded select-none pointer-events-none transform rotate-[-2deg]">
            100% Egyptian Cotton
          </div>
        </div>

        {/* Footer Company Logo/Name Block */}
        <div className="border-t-[2px] border-black mt-6 print:mt-3 pt-3">
          <h3 className="text-center text-[14px] font-extrabold uppercase tracking-wider text-[#1B6D45]">
            HAYAGREEVAS FABRICS PRIVATE LIMITED
          </h3>

          <div className="grid grid-cols-2 gap-4 mt-2 text-[9.5px] text-gray-800 leading-tight">
            <div>
              <span className="font-bold uppercase block mb-0.5">Factory :</span>
              S.F. No. 193, P.Vadugapalayam, Pollachi Road, Palladam - 641 664,<br />
              Tirupur District. Phone : 04255 - 255336 E-mail : factory1@hayagreevas.com<br />
              GSTIN : 33AACCH7673P1Z0 PAN : AACCH7673P CIN : U51310TZ2011PTC017510
            </div>
            <div className="text-right">
              <span className="font-bold uppercase block mb-0.5">Head Office :</span>
              Amarjothi Apartments, No. 106 – A1 (Old No.93),<br />
              Bhashyakarlu Road West, R.S.Puram, Coimbatore 641002. INDIA<br />
              Tel : 04255-255336, E-mail : info@hayagreevas.com
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
