import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getGeneratePackingById } from '@/state/generatePackingSlice';
import { getAllCompanies } from '@/state/company-master-slice';
import { getAllCustomers } from '@/state/customerSlice';
import { getAllConsignee } from '@/state/consigneeSlice';
import { getAllCities } from '@/state/citySlice';
import { getAllStates } from '@/state/stateSlice';
import { getAllCountries } from '@/state/countrySlice';
import { getAllWeavingJobWorkOrders } from '@/state/weavingJobWorkOrderSlice';
import { getAllSalesOrders } from '@/state/salesOrderSlice';
import { getAllInvoices } from '@/state/invoiceSlice';
import { getAllTransports } from '@/state/transportSlice';
import { getAllFactoryPieceEntries, getFactoryPieceEntriesByCompany } from '@/state/factoryPieceEntrySlice';
import { getAllLooms } from '@/state/loomMasterSlice';
import { getAllFabricInspection } from '@/state/fabricInspectionsSlice';
import { getAllDefectMaster } from '@/state/defectMasterSlice';
import { PackingListTemplate } from '@/components/templates';
import { PackingListData, PackingListItem } from '@/components/templates/PackingListTemplate.types';

export default function PackingListPrint() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const dispatch = useDispatch<AppDispatch>();

  const { currentPacking, loading: packingLoading } = useSelector((state: RootState) => state.generatePacking);
  const { companyMasterList, loading: companyLoading } = useSelector((state: RootState) => state.companyMaster);
  const { customerList, loading: customerLoading } = useSelector((state: RootState) => state.customer);
  const { consigneeList, loading: consigneeLoading } = useSelector((state: RootState) => state.consignee);
  const { cityList } = useSelector((state: RootState) => state.city);
  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  const { transportList } = useSelector((state: RootState) => state.transport);
  const { list: pieceEntryList } = useSelector((state: RootState) => (state as any).factoryPieceEntry as any);
  const { loomList } = useSelector((state: RootState) => (state as any).loomMaster || {});
  const { fabricInspectionList } = useSelector((state: RootState) => (state as any).fabricInspections || (state as any).fabricInspection || {});
  const { defectMasterList } = useSelector((state: RootState) => (state as any).defect || (state as any).defectMaster || {});

  useEffect(() => {
    if (id && !isNaN(Number(id))) {
      dispatch(getGeneratePackingById(Number(id)));
    } else if (id) {
      console.warn("Invalid packing list ID provided:", id);
    }
    dispatch(getAllCities({ fetchAll: true }));
    dispatch(getAllStates({ fetchAll: true }));
    dispatch(getAllCountries({ fetchAll: true }));
    dispatch(getAllWeavingJobWorkOrders({}));
    dispatch(getAllSalesOrders({ fetchAll: true }));
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllConsignee({ fetchAll: true }));
    dispatch(getAllInvoices({}));
    dispatch(getAllTransports({ fetchAll: true }));
    dispatch(getAllFactoryPieceEntries({}) as any);
    dispatch(getAllLooms({ fetchAll: true }) as any);
    dispatch(getAllDefectMaster({ fetchAll: true }) as any);
    dispatch(getAllFabricInspection() as any);

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    if (storedCompanyId && !isNaN(Number(storedCompanyId))) {
      dispatch(getFactoryPieceEntriesByCompany(Number(storedCompanyId)) as any);
      dispatch(getAllFabricInspection({ companyId: Number(storedCompanyId) }) as any);
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (currentPacking?.companyId && !isNaN(Number(currentPacking.companyId))) {
      dispatch(getFactoryPieceEntriesByCompany(Number(currentPacking.companyId)) as any);
      dispatch(getAllFabricInspection({ companyId: Number(currentPacking.companyId) }) as any);
    }
  }, [currentPacking?.companyId, dispatch]);

  const resolveLocation = (item: any) => {
    const city = cityList.find((c: any) => String(c.id) === String(item.cityId));
    const state = stateList.find((s: any) => String(s.id) === String(item.stateId));
    const country = countryList.find((cn: any) => String(cn.id) === String(item.countryId));
    
    const cityName = city?.cityName || item.cityName || item.city || '';
    const stateName = state?.stateName || item.stateName || item.state || '';
    
    // Improved country resolution logic
    let countryName = '';
    if (country?.countryName) {
      countryName = country.countryName;
    } else if (item.countryName) {
      countryName = item.countryName;
    } else if (item.country) {
      countryName = item.country;
    } else if (item.countryId && String(item.countryId) !== '0') {
      countryName = String(item.countryId) === '1' ? 'India' : String(item.countryId) === '2' ? 'United Kingdom' : `Country ID: ${item.countryId}`;
    } else {
      countryName = item.country || 'India';
    }

    const pinCode = item.pinCode || item.pincode || item.pin_code || '';
    const cityPincode = [cityName, pinCode].filter(val => val !== undefined && val !== null && val !== '' && val !== 0 && val !== '0').join(' - ');
    const stateCode = state?.stateCode || item.stateCode || state?.stateName || item.stateName || '';
    const displayState = [stateName, stateCode].filter(val => val !== undefined && val !== null && val !== '' && val !== '0' && val !== 0).join(' - ');
    
    return { 
      cityPincode, 
      stateCode,
      displayState,
      city: cityName,
      state: stateName,
      country: countryName,
      pincode: pinCode
    };
  };

  const templateData: PackingListData | null = useMemo(() => {
    const company = Array.isArray(companyMasterList) 
      ? companyMasterList.find((c: any) => String(c.id) === String(currentPacking?.companyId))
      : null;

    if (!currentPacking || !company) return null;

    const companyAddress = company.address?.[0] || {};
    const companyLoc = resolveLocation(companyAddress);

    let buyerData = { 
      name: '', 
      address: '', 
      city: '',
      state: '',
      country: '',
      pincode: '',
      cityPincode: '', 
      stateCode: '', 
      displayState: '',
      gst: '' 
    };
    let consigneeData = { 
      name: '', 
      address: '', 
      city: '',
      state: '',
      country: '',
      pincode: '',
      cityPincode: '', 
      stateCode: '', 
      displayState: '',
      gst: '' 
    };

    // Buyer logic
    let buyerObj = (Array.isArray(customerList) ? customerList : []).find((c: any) => String(c.id) === String(currentPacking.buyerId));
    if (!buyerObj) {
      buyerObj = (Array.isArray(companyMasterList) ? companyMasterList : []).find((c: any) => String(c.id) === String(currentPacking.buyerId));
    }

    if (buyerObj) {
      const addr = buyerObj.address 
        ? (Array.isArray(buyerObj.address) ? buyerObj.address[0] : buyerObj.address)
        : (Array.isArray(buyerObj.customerAddresses) ? buyerObj.customerAddresses[0] : (buyerObj.customerAddresses || {}));
      const loc = resolveLocation(addr);
      buyerData = {
        name: buyerObj.customerName || buyerObj.companyName || buyerObj.name || '',
        address: [addr.line1, addr.line2].filter(Boolean).join(', ') || addr.address || '',
        city: loc.city,
        state: loc.state,
        country: loc.country,
        pincode: loc.pincode,
        cityPincode: loc.cityPincode,
        stateCode: loc.stateCode,
        displayState: loc.displayState,
        gst: buyerObj.gstNo || buyerObj.gst || ''
      };
    } else {
      buyerData.name = currentPacking.buyerName || '';
    }

    // Consignee logic
    // First, try to see if consignee details are already embedded in the packing object
    let consigneeObj = currentPacking.consignee || currentPacking.consigneeDetails || currentPacking.consignee_details;
    
    const rawConsigneeList = Array.isArray(consigneeList) ? consigneeList : 
                           (consigneeList && Array.isArray((consigneeList as any).data) ? (consigneeList as any).data : []);
    
    const rawCustomerList = Array.isArray(customerList) ? customerList : 
                          (customerList && Array.isArray((customerList as any).data) ? (customerList as any).data : []);

    // If not embedded, look in the consignee master list by ID
    if (!consigneeObj) {
      const targetId = currentPacking.consigneeId || currentPacking.consignee_id;
      if (targetId) {
        consigneeObj = rawConsigneeList.find((c: any) => String(c.id) === String(targetId));
      }
    }

    // NEW: Search by Name in Consignee Master if still not found
    if (!consigneeObj && currentPacking.deliveryAt) {
      consigneeObj = rawConsigneeList.find((c: any) => 
        (c.consigneeName || c.name || "").toLowerCase().trim() === currentPacking.deliveryAt.toLowerCase().trim()
      );
    }

    // Fallback: If still not found, check customer list by ID
    if (!consigneeObj) {
      const targetId = currentPacking.consigneeId || currentPacking.consignee_id;
      if (targetId) {
        consigneeObj = rawCustomerList.find((c: any) => String(c.id) === String(targetId));
      }
    }

    // NEW: Search by Name in Customer Master if still not found
    if (!consigneeObj && currentPacking.deliveryAt) {
      consigneeObj = rawCustomerList.find((c: any) => 
        (c.customerName || c.name || "").toLowerCase().trim() === currentPacking.deliveryAt.toLowerCase().trim()
      );
    }

    if (consigneeObj) {
      // Use the found consignee object to populate all fields
      const addr = consigneeObj.address 
        ? (Array.isArray(consigneeObj.address) ? consigneeObj.address[0] : consigneeObj.address)
        : (Array.isArray(consigneeObj.consigneeAddresses) ? consigneeObj.consigneeAddresses[0] : 
          (Array.isArray(consigneeObj.customerAddresses) ? consigneeObj.customerAddresses[0] : 
          (consigneeObj.consigneeAddresses || consigneeObj.customerAddresses || {})));
      
      const loc = resolveLocation(addr);
      consigneeData = {
        name: consigneeObj.consigneeName || consigneeObj.customerName || consigneeObj.companyName || consigneeObj.name || '',
        address: [addr.line1, addr.line2].filter(Boolean).join(', ') || addr.address || '',
        city: loc.city || addr.cityName || addr.city || '',
        state: loc.state || addr.stateName || addr.state || '',
        country: loc.country || addr.countryName || addr.country || '',
        pincode: loc.pincode || addr.pinCode || addr.pincode || '',
        cityPincode: loc.cityPincode || '',
        stateCode: loc.stateCode || '',
        displayState: loc.displayState || '',
        gst: consigneeObj.gstNo || consigneeObj.gst || ''
      };
    } else {
      // Fallback only if no consignee object was found anywhere
      consigneeData = {
        ...buyerData,
        name: currentPacking.deliveryAt || currentPacking.consigneeName || buyerData.name || '',
        gst: '', 
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        cityPincode: '',
        stateCode: '',
        displayState: ''
      };
    }

    let pieceEntriesArr: any[] = [];
    if (Array.isArray(pieceEntryList)) {
      pieceEntriesArr = pieceEntryList;
    } else if (Array.isArray((pieceEntryList as any)?.data)) {
      pieceEntriesArr = (pieceEntryList as any).data;
    } else if (Array.isArray((pieceEntryList as any)?.data?.data)) {
      pieceEntriesArr = (pieceEntryList as any).data.data;
    }

    let fabricInspectionsArr: any[] = [];
    if (Array.isArray(fabricInspectionList)) {
      fabricInspectionsArr = fabricInspectionList;
    } else if (Array.isArray((fabricInspectionList as any)?.data)) {
      fabricInspectionsArr = (fabricInspectionList as any).data;
    } else if (Array.isArray((fabricInspectionList as any)?.data?.data)) {
      fabricInspectionsArr = (fabricInspectionList as any).data.data;
    }

    let defectsArr: any[] = [];
    if (Array.isArray(defectMasterList)) {
      defectsArr = defectMasterList;
    } else if (Array.isArray((defectMasterList as any)?.data)) {
      defectsArr = (defectMasterList as any).data;
    } else if (Array.isArray((defectMasterList as any)?.data?.data)) {
      defectsArr = (defectMasterList as any).data.data;
    }

    const defectMap = new Map<string, string>();
    const defectPointsMap = new Map<string, number>();

    defectsArr.forEach((d: any) => {
      const idKey = String(d.id ?? d.defectId ?? '').trim();
      const code = String(d.defectCode || d.defect_code || d.code || '').trim();
      const name = String(d.defectName || d.defect_name || d.name || '').trim();
      const displayVal = code || name;

      if (idKey && displayVal) {
        defectMap.set(idKey, displayVal);
      }
      if (name && code) {
        defectMap.set(name.toLowerCase(), code);
      }

      const pts = Number(d.defectPoint ?? d.defect_point ?? d.defectPoints ?? d.defect_points ?? d.points ?? d.point);
      if (!isNaN(pts) && pts > 0) {
        if (idKey) defectPointsMap.set(idKey, pts);
        if (code) defectPointsMap.set(code.toLowerCase(), pts);
        if (name) defectPointsMap.set(name.toLowerCase(), pts);
      }
    });

    const resolveDefectTypeName = (typeVal: any): string => {
      if (typeVal == null) return '';
      const s = String(typeVal).trim();
      if (!s || s === 'null' || s === 'undefined') return '';
      if (defectMap.has(s)) {
        return defectMap.get(s)!;
      }
      if (defectMap.has(s.toLowerCase())) {
        return defectMap.get(s.toLowerCase())!;
      }
      return s;
    };

    const loomsRaw = (loomList as any)?.data ?? loomList ?? [];
    const loomsArr: any[] = Array.isArray(loomsRaw) ? loomsRaw : [];
    const loomMap = new Map<string, string>();
    loomsArr.forEach((l: any) => {
      const idKey = String(l.id ?? l.loomId ?? '').trim();
      const val = String(l.loomNo || l.loom_no || l.loomName || l.loom_name || l.name || '').trim();
      if (idKey && val) loomMap.set(idKey, val);
    });

    const resolveLoomNo = (...candidates: any[]) => {
      for (const cand of candidates) {
        if (cand == null || cand === '') continue;
        const str = String(cand).trim();
        if (!str || str === '-') continue;
        if (loomMap.has(str)) {
          return loomMap.get(str)!;
        }
        if (!isNaN(Number(str))) {
          const numStr = String(Number(str));
          if (loomMap.has(numStr)) {
            return loomMap.get(numStr)!;
          }
        }
        return str;
      }
      return '';
    };

    const normalizePieceStr = (val: any): string => {
      if (val == null) return '';
      return String(val).trim().toLowerCase();
    };

    const extractPieceSuffix = (val: any): string => {
      const s = normalizePieceStr(val);
      if (!s) return '';
      if (s.includes('/')) {
        const parts = s.split('/');
        return parts[parts.length - 1].trim();
      }
      return s;
    };

    const isPieceMatch = (pe: any, targetPieceNo?: string, targetPieceId?: any): boolean => {
      if (!pe) return false;

      // 1. Match by ID if provided
      if (targetPieceId != null && targetPieceId !== 0 && targetPieceId !== '') {
        if (String(pe.id).trim() === String(targetPieceId).trim()) {
          return true;
        }
      }

      // 2. Match by piece number / suffix
      const cleanTarget = normalizePieceStr(targetPieceNo);
      if (!cleanTarget || cleanTarget === '-') return false;
      const targetSuffix = extractPieceSuffix(cleanTarget);

      const peCandidates = [
        pe.pieceNumber,
        pe.piece_number,
        pe.pieceNumberComputed,
        pe.pieceNo,
        pe.piece_no,
        pe.barcode,
        pe.barcodeNo
      ];

      for (const cand of peCandidates) {
        if (cand == null || cand === '') continue;
        const candNorm = normalizePieceStr(cand);
        if (!candNorm || candNorm === '-') continue;

        if (candNorm === cleanTarget) return true;

        const candSuffix = extractPieceSuffix(candNorm);
        if (candSuffix && targetSuffix && candSuffix === targetSuffix) {
          return true;
        }

        if (cleanTarget.endsWith('/' + candNorm) || candNorm.endsWith('/' + cleanTarget)) {
          return true;
        }

        if (!isNaN(Number(candNorm)) && !isNaN(Number(cleanTarget))) {
          if (Number(candNorm) === Number(cleanTarget)) return true;
        }
        if (targetSuffix && !isNaN(Number(candNorm)) && !isNaN(Number(targetSuffix))) {
          if (Number(candNorm) === Number(targetSuffix)) return true;
        }
      }

      return false;
    };

    const findPieceEntry = (pieceIdentifier?: string, pieceId?: any) => {
      if (!pieceEntriesArr.length) return null;
      return pieceEntriesArr.find((pe: any) => isPieceMatch(pe, pieceIdentifier, pieceId)) || null;
    };

    const getPointForDefect = (rawType: any, candidatePt: any, totalPts?: any, totalTypesCount: number = 1): string => {
      // 1. If explicit candidate point is valid and within standard 4-point system (1 to 4), use it!
      if (candidatePt != null && candidatePt !== '' && candidatePt !== 'null' && candidatePt !== 'undefined') {
        const num = Number(candidatePt);
        if (!isNaN(num) && num > 0 && num <= 4) {
          return String(num);
        }
      }

      // 2. Check defectPointsMap using rawType (id, code, or name)
      if (rawType != null) {
        const key = String(rawType).trim().toLowerCase();
        if (defectPointsMap.has(key)) {
          return String(defectPointsMap.get(key));
        }
      }

      // 3. Also check resolved defect code in defectPointsMap
      const resolvedCode = resolveDefectTypeName(rawType);
      if (resolvedCode) {
        const codeKey = resolvedCode.trim().toLowerCase();
        if (defectPointsMap.has(codeKey)) {
          return String(defectPointsMap.get(codeKey));
        }
      }

      // 4. If candidate point or total points is provided (e.g. 12) and totalTypesCount > 1
      const sumCandidate = candidatePt != null && candidatePt !== '' && candidatePt !== 'null'
        ? Number(candidatePt)
        : (totalPts != null && totalPts !== '' && totalPts !== 'null' ? Number(totalPts) : NaN);

      if (!isNaN(sumCandidate) && sumCandidate > 0 && totalTypesCount > 1) {
        const divided = sumCandidate / totalTypesCount;
        if (!isNaN(divided) && divided > 0 && divided <= 4) {
          return String(divided);
        }
      }

      // 5. If candidatePt is valid number > 0 but > 4 (like 12), default to 4 (standard individual defect rating)
      if (candidatePt != null && candidatePt !== '' && candidatePt !== 'null') {
        const num = Number(candidatePt);
        if (!isNaN(num) && num > 0) {
          if (num > 4) {
            return '4';
          }
          return String(num);
        }
      }

      // 6. Default fallback point
      return '4';
    };

    const formatDefectPair = (defectType: any, defectPoints: any): string => {
      const typeStr = String(defectType || '').trim();
      if (!typeStr || typeStr === '-' || typeStr === 'null' || typeStr === 'undefined') return '';

      if (typeStr.includes('*')) {
        const [t, p] = typeStr.split('*').map(s => s.trim());
        const pNum = Number(p);
        if (!isNaN(pNum) && pNum > 4) {
          const fixedP = getPointForDefect(t, undefined, undefined, 1);
          return `${t} * ${fixedP}`;
        }
        return typeStr;
      }

      if (defectPoints != null && defectPoints !== '' && defectPoints !== 'null' && defectPoints !== 'undefined') {
        const num = Number(defectPoints);
        const ptsStr = !isNaN(num) ? String(num) : String(defectPoints).trim();
        if (ptsStr) {
          return `${typeStr} * ${ptsStr}`;
        }
      }

      return `${typeStr} * 4`;
    };

    const extractDefectsFromEntry = (pe: any): string[] => {
      if (!pe) return [];
      const results: string[] = [];

      // Check nested defect arrays first
      const nestedCandidates = [
        pe.defectDetails,
        pe.defect_details,
        pe.defectEntries,
        pe.defect_entries,
        pe.defects,
        pe.inspectionEntries,
        pe.pieceDefects
      ];

      for (const cand of nestedCandidates) {
        if (Array.isArray(cand) && cand.length > 0) {
          cand.forEach((d: any) => {
            if (!d) return;
            const rawDType = d.defectType || d.defect_type || d.defectCode || d.defect_code || d.defectName || d.defect_name || d.name || d.code || d.defectTypeId;
            const dType = resolveDefectTypeName(rawDType);
            const dPts = d.defectPoints ?? d.defect_points ?? d.points ?? d.penaltyPoints ?? d.penalty_points ?? d.point ?? d.pts;
            const pts = getPointForDefect(rawDType, dPts, undefined, cand.length);
            const formatted = formatDefectPair(dType, pts);
            if (formatted) results.push(formatted);
          });
        }
      }

      // Check direct defectType and defectPoints
      const rawType = pe.defectType ?? pe.defect_type ?? pe.defectName ?? pe.defect_name ?? pe.defectTypeId;
      const rawPoints = pe.defectPoints ?? pe.defect_points;

      if (rawType != null && String(rawType).trim()) {
        const rawTypeStr = String(rawType).trim();
        const rawPointsStr = rawPoints != null ? String(rawPoints).trim() : '';

        if (rawTypeStr.includes(',')) {
          const types = rawTypeStr.split(',').map(s => s.trim()).filter(Boolean);
          const pointsList = rawPointsStr.includes(',')
            ? rawPointsStr.split(',').map(s => s.trim()).filter(Boolean)
            : [];

          types.forEach((t, idx) => {
            const resolvedType = resolveDefectTypeName(t);
            const explicitPt = pointsList[idx];
            const pts = getPointForDefect(t, explicitPt, rawPointsStr, types.length);
            const formatted = formatDefectPair(resolvedType, pts);
            if (formatted) results.push(formatted);
          });
        } else {
          const resolvedType = resolveDefectTypeName(rawTypeStr);
          const pts = getPointForDefect(rawTypeStr, rawPointsStr, rawPointsStr, 1);
          const formatted = formatDefectPair(resolvedType, pts);
          if (formatted) results.push(formatted);
        }
      }

      return results;
    };

    const resolveDefectsFromFabricInspections = (pieceIdentifier?: string, pieceId?: any, inspectionId?: any): string[] => {
      if (!fabricInspectionsArr.length) return [];
      const results: string[] = [];

      const matchingInspections = fabricInspectionsArr.filter((fi: any) => {
        if (!fi) return false;
        if (inspectionId && String(fi.id).trim() === String(inspectionId).trim()) {
          return true;
        }
        if (pieceId && fi.pieceEntryId && String(fi.pieceEntryId).trim() === String(pieceId).trim()) {
          return true;
        }
        if (isPieceMatch({ pieceNumber: fi.pieceNo, id: fi.pieceEntryId }, pieceIdentifier, pieceId)) {
          return true;
        }
        if (Array.isArray(fi.inspectionDetails)) {
          const detailMatch = fi.inspectionDetails.some((d: any) =>
            isPieceMatch({ pieceNumber: d.pieceNo }, pieceIdentifier, pieceId)
          );
          if (detailMatch) return true;
        }
        if (Array.isArray(fi.pieceEntries)) {
          const peMatch = fi.pieceEntries.some((p: any) =>
            isPieceMatch(p, pieceIdentifier, pieceId)
          );
          if (peMatch) return true;
        }
        return false;
      });

      // Deduplicate matching inspections by ID
      const uniqueInspections = Array.from(new Map(matchingInspections.map((fi: any) => [fi.id, fi])).values());

      uniqueInspections.forEach((fi: any) => {
        const entries = Array.isArray(fi.inspectionEntries) ? fi.inspectionEntries : [];
        if (entries.length > 0) {
          entries.forEach((entry: any) => {
            if (!entry) return;
            if (entry.activeFlag === false) return;
            const dTypeId = entry.defectTypeId ?? entry.defect_type_id ?? entry.defectId;
            if (dTypeId == null || dTypeId === '') return;
            const defectTypeStr = resolveDefectTypeName(dTypeId);
            const rawPts = entry.defectPoints ?? entry.defect_points ?? entry.penaltyPoints ?? entry.points;
            const pts = getPointForDefect(dTypeId, rawPts, fi.totalPoints, entries.length);
            const formatted = formatDefectPair(defectTypeStr, pts);
            if (formatted) {
              const count = Math.max(1, Math.floor(Number(entry.defectedMeters ?? entry.defected_meters) || 1));
              for (let occurrence = 0; occurrence < count; occurrence += 1) {
                results.push(formatted);
              }
            }
          });
        } else if (Array.isArray(fi.pieceEntries) && fi.pieceEntries.length > 0) {
          fi.pieceEntries.forEach((pe: any) => {
            if (isPieceMatch(pe, pieceIdentifier, pieceId)) {
              const entryDefects = extractDefectsFromEntry(pe);
              entryDefects.forEach(d => {
                if (d) results.push(d);
              });
            }
          });
        }
      });

      return results;
    };

    const sanitizeDefectString = (str: string): string => {
      if (!str) return '';
      return str.split(',').map(part => {
        const trimmed = part.trim();
        if (!trimmed) return '';
        if (trimmed.includes('*')) {
          const [typePart, ptPart] = trimmed.split('*').map(s => s.trim());
          const ptNum = Number(ptPart);
          if (!isNaN(ptNum) && ptNum > 4) {
            const fixedPt = getPointForDefect(typePart, undefined, undefined, 1);
            return `${typePart} * ${fixedPt}`;
          }
        }
        return trimmed;
      }).filter(Boolean).join(', ');
    };

    const resolvePieceDefectsDetail = (pieceIdentifier?: string, pieceId?: any, fallback?: string): string => {
      const matchedPE = findPieceEntry(pieceIdentifier, pieceId);
      const inspectionId = matchedPE?.inspectionId ?? matchedPE?.fabricInspectionId;
      const effectivePieceId = pieceId ?? matchedPE?.id;

      // 1. Primary priority: Fetch defectTypeId and defectPoints from fabricInspectionList inspectionEntries
      const inspectionDefects = resolveDefectsFromFabricInspections(pieceIdentifier, effectivePieceId, inspectionId);
      if (inspectionDefects.length > 0) {
        return inspectionDefects.join(', ');
      }

      // 2. Secondary fallback: pieceEntriesArr
      const matchingEntries = pieceEntriesArr.filter((pe: any) => isPieceMatch(pe, pieceIdentifier, effectivePieceId));
      const defects: string[] = [];
      matchingEntries.forEach((pe: any) => {
        const entryDefects = extractDefectsFromEntry(pe);
        entryDefects.forEach(d => {
          if (d) {
            defects.push(d);
          }
        });
      });

      if (defects.length > 0) {
        return defects.join(', ');
      }

      if (fallback) {
        return sanitizeDefectString(fallback);
      }

      return '';
    };

    const summarizeDefects = (details: string) => {
      const grouped = new Map<string, { name: string; points: number; count: number }>();

      details.split(',').forEach((part) => {
        const separator = part.lastIndexOf('*');
        if (separator < 0) return;

        const defectLabel = part.slice(0, separator).trim();
        const points = Number(part.slice(separator + 1).trim());
        if (!defectLabel || !Number.isFinite(points) || points <= 0) return;

        const countMatch = defectLabel.match(/^(.*)\s+(\d+)$/);
        const name = (countMatch?.[1] || defectLabel).trim();
        const count = countMatch ? Math.max(1, Number(countMatch[2])) : 1;
        const key = `${name.toLowerCase()}|${points}`;
        const current = grouped.get(key);
        if (current) {
          current.count += count;
        } else {
          grouped.set(key, { name, points, count });
        }
      });

      const defects = Array.from(grouped.values());
      return {
        hasDefects: defects.length > 0,
        details: defects.map(({ name, points, count }) => `${name} ${count} * ${points}`).join(', '),
        pts4: defects.filter((defect) => defect.points === 4).reduce((sum, defect) => sum + defect.count, 0),
        pts3: defects.filter((defect) => defect.points === 3).reduce((sum, defect) => sum + defect.count, 0),
        pts2: defects.filter((defect) => defect.points === 2).reduce((sum, defect) => sum + defect.count, 0),
        pts1: defects.filter((defect) => defect.points === 1).reduce((sum, defect) => sum + defect.count, 0),
        totalPoints: defects.reduce((sum, defect) => sum + defect.points * defect.count, 0)
      };
    };

    const rawItems = currentPacking.items || [];
    const expandedItems: any[] = [];

    rawItems.forEach((item: any) => {
      const embeddedPieces = item.pieceDetails || item.piece_details || item.selectedPieces || item.items || item.pieces;
      const pieceNoStr = String(item.pieceNo || item.piece_no || item.pieceNumber || item.piece_number || '');
      const pieceList = pieceNoStr.split(',').map(p => p.trim()).filter(Boolean);

      if (Array.isArray(embeddedPieces) && embeddedPieces.length > 0) {
        embeddedPieces.forEach((pObj: any) => {
          const pNo = pObj.pieceNo || pObj.piece_no || pObj.pieceNumber || pObj.piece_number || '-';
          const pId = pObj.pieceId || pObj.pieceEntryId || pObj.id;
          const matchedPE = findPieceEntry(pNo, pId);
          const defectsDetail = resolvePieceDefectsDetail(
            pNo,
            pId,
            matchedPE?.defectsDetail || matchedPE?.defectDetails || matchedPE?.defects || pObj.defectsDetail || item.defectsDetail || ''
          );

          const rawMtr = matchedPE
            ? (matchedPE.meters ?? matchedPE.inspectedMtr ?? matchedPE.inspected_mtr ?? matchedPE.pieceMeter ?? matchedPE.piece_meter ?? matchedPE.pieceMeters ?? matchedPE.inspectedMeters ?? matchedPE.length ?? matchedPE.meter ?? matchedPE.quantity)
            : (pObj.meters ?? pObj.inspectedMtr ?? pObj.inspected_mtr ?? pObj.pieceMeter ?? pObj.piece_meter ?? pObj.pieceMeters ?? pObj.inspectedMeters ?? pObj.length ?? pObj.meter ?? pObj.quantity);

          const mtr = rawMtr != null ? Number(rawMtr) : (Number(item.length || item.meters || item.pieceMeter || item.quantity || 0) / embeddedPieces.length);

          const yards = matchedPE
            ? Number(matchedPE.yards || matchedPE.yard || 0)
            : Number(pObj.yards || pObj.yard || (item.yards ? Number(item.yards) / embeddedPieces.length : 0));

          const rawNet = matchedPE
            ? (matchedPE.netWeight ?? matchedPE.net_weight ?? matchedPE.pounds ?? matchedPE.netWt ?? matchedPE.net_wt ?? matchedPE.inspectedNetWt ?? matchedPE.inspected_net_wt ?? matchedPE.inspectedNetWeight ?? matchedPE.weight ?? matchedPE.actualNetWeight)
            : (pObj.pounds ?? pObj.netWeight ?? pObj.net_weight ?? pObj.netWt ?? pObj.net_wt ?? (item.pounds ?? item.netWeight ?? item.net_weight ?? item.netWt ?? item.net_wt ? Number(item.pounds || item.netWeight || item.net_weight || item.netWt || 0) / embeddedPieces.length : null));

          const netWt = rawNet != null && rawNet !== '' ? Number(rawNet) : 0;

          const rawGross = matchedPE
            ? (matchedPE.grossWeight ?? matchedPE.gross_weight ?? matchedPE.grossWt ?? matchedPE.gross_wt ?? matchedPE.inspectedGrossWt ?? matchedPE.inspected_gross_wt ?? matchedPE.inspectedGrossWeight)
            : (pObj.grossWt ?? pObj.grossWeight ?? pObj.gross_weight ?? pObj.gross_wt ?? (item.grossWt ?? item.grossWeight ?? item.gross_weight ?? item.gross_wt ? Number(item.grossWt || item.grossWeight || item.gross_weight || item.gross_wt || 0) / embeddedPieces.length : null));

          const grossWt = rawGross != null && rawGross !== '' ? Number(rawGross) : 0;

          const loomNo = resolveLoomNo(
            matchedPE?.loomNo,
            matchedPE?.loom_no,
            matchedPE?.loomName,
            matchedPE?.loom_name,
            matchedPE?.loom?.loomNo,
            matchedPE?.loom?.loomName,
            matchedPE?.loom?.name,
            matchedPE?.loomId,
            matchedPE?.loom_id,
            pObj?.loomNo,
            pObj?.loom_no,
            pObj?.loomId,
            pObj?.loom_id,
            item?.loomNo,
            item?.loom_no,
            item?.loomId,
            item?.loom_id,
            currentPacking?.loomNo,
            currentPacking?.loom_no,
            currentPacking?.loomId,
            currentPacking?.loom_id
          );
          const warpLotNo = matchedPE?.warpLotNo || matchedPE?.warp_lot_no || matchedPE?.warpLot || matchedPE?.warp_lot || matchedPE?.warpYarnLotNo || matchedPE?.warp_yarn_lot_no || matchedPE?.warpYarnLot || pObj?.warpLotNo || pObj?.warp_lot_no || item?.warpLotNo || item?.warp_lot_no || currentPacking?.warpLotNo || currentPacking?.warp_lot_no || '';
          const weftLotNo = matchedPE?.weftLotNo || matchedPE?.weft_lot_no || matchedPE?.weftLot || matchedPE?.weft_lot || matchedPE?.weftYarnLotNo || matchedPE?.weft_yarn_lot_no || matchedPE?.weftYarnLot || pObj?.weftLotNo || pObj?.weft_lot_no || item?.weftLotNo || item?.weft_lot_no || currentPacking?.weftLotNo || currentPacking?.weft_lot_no || '';

          expandedItems.push({
            ...item,
            ...(matchedPE || {}),
            ...pObj,
            rollNo: item.rollNo || item.roll_no || pObj.rollNo || matchedPE?.rollNo || '-',
            pieceNo: pNo,
            length: mtr,
            meters: mtr,
            yards: yards,
            pounds: netWt,
            netWeight: netWt,
            grossWt: grossWt,
            grossWeight: grossWt,
            avgWt: mtr > 0 ? (netWt / mtr) : Number(pObj.avgWt || pObj.avg_weight || 0),
            loomNo,
            warpLotNo,
            weftLotNo,
            pts4: matchedPE?.pts4 ?? matchedPE?.points4 ?? pObj.pts4 ?? item.pts4 ?? 0,
            pts3: matchedPE?.pts3 ?? matchedPE?.points3 ?? pObj.pts3 ?? item.pts3 ?? 0,
            pts2: matchedPE?.pts2 ?? matchedPE?.points2 ?? pObj.pts2 ?? item.pts2 ?? 0,
            pts1: matchedPE?.pts1 ?? matchedPE?.points1 ?? pObj.pts1 ?? item.pts1 ?? 0,
            totalPoints: matchedPE?.totalPoints ?? matchedPE?.total_points ?? matchedPE?.totalDefectPoints ?? pObj.totalPoints ?? item.totalPoints ?? 0,
            pointsPer100Mtr: matchedPE?.pointsPer100Mtr ?? matchedPE?.points_per_100mtr ?? pObj.pointsPer100Mtr ?? item.pointsPer100Mtr ?? 0,
            grade: matchedPE?.grade || matchedPE?.fabricGrade || matchedPE?.gradeName || pObj.grade || item.grade || 'A',
            defectsDetail
          });
        });
      } else if (pieceList.length > 1) {
        pieceList.forEach((pNo: string) => {
          const matchedPE = findPieceEntry(pNo);
          const defectsDetail = resolvePieceDefectsDetail(
            pNo,
            undefined,
            matchedPE?.defectsDetail || matchedPE?.defectDetails || matchedPE?.defects || item.defectsDetail || ''
          );

          const rawMtr = matchedPE 
            ? (matchedPE.meters ?? matchedPE.inspectedMtr ?? matchedPE.inspected_mtr ?? matchedPE.pieceMeter ?? matchedPE.piece_meter ?? matchedPE.pieceMeters ?? matchedPE.inspectedMeters ?? matchedPE.length ?? matchedPE.meter ?? matchedPE.quantity)
            : null;

          const mtr = rawMtr != null ? Number(rawMtr) : (Number(item.length || item.meters || item.pieceMeter || item.meter || item.quantity || 0) / pieceList.length);

          const yards = matchedPE
            ? Number(matchedPE.yards || matchedPE.yard || 0)
            : (Number(item.yards || 0) / pieceList.length);

          const rawNet = matchedPE
            ? (matchedPE.netWeight ?? matchedPE.net_weight ?? matchedPE.pounds ?? matchedPE.netWt ?? matchedPE.net_wt ?? matchedPE.inspectedNetWt ?? matchedPE.inspected_net_wt ?? matchedPE.inspectedNetWeight ?? matchedPE.weight ?? matchedPE.actualNetWeight)
            : (item.pounds ?? item.netWeight ?? item.net_weight ?? item.netWt ?? item.net_wt ? Number(item.pounds || item.netWeight || item.net_weight || item.netWt || 0) / pieceList.length : null);

          const netWt = rawNet != null && rawNet !== '' ? Number(rawNet) : 0;

          const rawGross = matchedPE
            ? (matchedPE.grossWeight ?? matchedPE.gross_weight ?? matchedPE.grossWt ?? matchedPE.gross_wt ?? matchedPE.inspectedGrossWt ?? matchedPE.inspected_gross_wt ?? matchedPE.inspectedGrossWeight)
            : (item.grossWt ?? item.grossWeight ?? item.gross_weight ?? item.gross_wt ? Number(item.grossWt || item.grossWeight || item.gross_weight || item.gross_wt || 0) / pieceList.length : null);

          const grossWt = rawGross != null && rawGross !== '' ? Number(rawGross) : 0;

          const loomNo = resolveLoomNo(
            matchedPE?.loomNo,
            matchedPE?.loom_no,
            matchedPE?.loomName,
            matchedPE?.loom_name,
            matchedPE?.loom?.loomNo,
            matchedPE?.loom?.loomName,
            matchedPE?.loom?.name,
            matchedPE?.loomId,
            matchedPE?.loom_id,
            item?.loomNo,
            item?.loom_no,
            item?.loomId,
            item?.loom_id,
            currentPacking?.loomNo,
            currentPacking?.loom_no,
            currentPacking?.loomId,
            currentPacking?.loom_id
          );
          const warpLotNo = matchedPE?.warpLotNo || matchedPE?.warp_lot_no || matchedPE?.warpLot || matchedPE?.warp_lot || matchedPE?.warpYarnLotNo || matchedPE?.warp_yarn_lot_no || matchedPE?.warpYarnLot || item?.warpLotNo || item?.warp_lot_no || currentPacking?.warpLotNo || currentPacking?.warp_lot_no || '';
          const weftLotNo = matchedPE?.weftLotNo || matchedPE?.weft_lot_no || matchedPE?.weftLot || matchedPE?.weft_lot || matchedPE?.weftYarnLotNo || matchedPE?.weft_yarn_lot_no || matchedPE?.weftYarnLot || item?.weftLotNo || item?.weft_lot_no || currentPacking?.weftLotNo || currentPacking?.weft_lot_no || '';

          expandedItems.push({
            ...item,
            ...(matchedPE || {}),
            rollNo: item.rollNo || item.roll_no || matchedPE?.rollNo || '-',
            pieceNo: pNo,
            length: mtr,
            meters: mtr,
            yards: yards,
            pounds: netWt,
            netWeight: netWt,
            grossWt: grossWt,
            grossWeight: grossWt,
            avgWt: mtr > 0 ? (netWt / mtr) : 0,
            loomNo,
            warpLotNo,
            weftLotNo,
            pts4: matchedPE?.pts4 ?? matchedPE?.points4 ?? item.pts4 ?? 0,
            pts3: matchedPE?.pts3 ?? matchedPE?.points3 ?? item.pts3 ?? 0,
            pts2: matchedPE?.pts2 ?? matchedPE?.points2 ?? item.pts2 ?? 0,
            pts1: matchedPE?.pts1 ?? matchedPE?.points1 ?? item.pts1 ?? 0,
            totalPoints: matchedPE?.totalPoints ?? matchedPE?.total_points ?? matchedPE?.totalDefectPoints ?? item.totalPoints ?? 0,
            pointsPer100Mtr: matchedPE?.pointsPer100Mtr ?? matchedPE?.points_per_100mtr ?? item.pointsPer100Mtr ?? 0,
            grade: matchedPE?.grade || matchedPE?.fabricGrade || matchedPE?.gradeName || item.grade || 'A',
            defectsDetail
          });
        });
      } else {
        const pNo = pieceList[0] || item.pieceNo || item.piece_no || item.pieceNumber || item.piece_number || '';
        const pId = item.pieceId || item.pieceEntryId;
        const matchedPE = findPieceEntry(pNo, pId);
        const defectsDetail = resolvePieceDefectsDetail(
          pNo,
          pId,
          matchedPE?.defectsDetail || matchedPE?.defectDetails || matchedPE?.defects || item.defectsDetail || ''
        );

        const rawMtr = matchedPE 
          ? (matchedPE.meters ?? matchedPE.inspectedMtr ?? matchedPE.inspected_mtr ?? matchedPE.pieceMeter ?? matchedPE.piece_meter ?? matchedPE.pieceMeters ?? matchedPE.inspectedMeters ?? matchedPE.length ?? matchedPE.meter ?? matchedPE.quantity)
          : (item.length ?? item.meters ?? item.inspectedMtr ?? item.inspected_mtr ?? item.pieceMeter ?? item.piece_meter ?? item.pieceMeters ?? item.meter ?? item.quantity);

        const mtr = Number(rawMtr || 0);

        const yards = matchedPE
          ? Number(matchedPE.yards || matchedPE.yard || 0)
          : Number(item.yards || 0);

        const rawNet = matchedPE
          ? (matchedPE.netWeight ?? matchedPE.net_weight ?? matchedPE.pounds ?? matchedPE.netWt ?? matchedPE.net_wt ?? matchedPE.inspectedNetWt ?? matchedPE.inspected_net_wt ?? matchedPE.inspectedNetWeight ?? matchedPE.weight ?? matchedPE.actualNetWeight)
          : (item.pounds ?? item.netWeight ?? item.net_weight ?? item.netWt ?? item.net_wt ?? 0);

        const netWt = rawNet != null && rawNet !== '' ? Number(rawNet) : 0;

        const rawGross = matchedPE
          ? (matchedPE.grossWeight ?? matchedPE.gross_weight ?? matchedPE.grossWt ?? matchedPE.gross_wt ?? matchedPE.inspectedGrossWt ?? matchedPE.inspected_gross_wt ?? matchedPE.inspectedGrossWeight)
          : (item.grossWt ?? item.grossWeight ?? item.gross_weight ?? item.gross_wt ?? 0);

        const grossWt = rawGross != null && rawGross !== '' ? Number(rawGross) : 0;

        const loomNo = resolveLoomNo(
          matchedPE?.loomNo,
          matchedPE?.loom_no,
          matchedPE?.loomName,
          matchedPE?.loom_name,
          matchedPE?.loom?.loomNo,
          matchedPE?.loom?.loomName,
          matchedPE?.loom?.name,
          matchedPE?.loomId,
          matchedPE?.loom_id,
          item?.loomNo,
          item?.loom_no,
          item?.loomId,
          item?.loom_id,
          currentPacking?.loomNo,
          currentPacking?.loom_no,
          currentPacking?.loomId,
          currentPacking?.loom_id
        );
        const warpLotNo = matchedPE?.warpLotNo || matchedPE?.warp_lot_no || matchedPE?.warpLot || matchedPE?.warp_lot || matchedPE?.warpYarnLotNo || matchedPE?.warp_yarn_lot_no || matchedPE?.warpYarnLot || item?.warpLotNo || item?.warp_lot_no || currentPacking?.warpLotNo || currentPacking?.warp_lot_no || '';
        const weftLotNo = matchedPE?.weftLotNo || matchedPE?.weft_lot_no || matchedPE?.weftLot || matchedPE?.weft_lot || matchedPE?.weftYarnLotNo || matchedPE?.weft_yarn_lot_no || matchedPE?.weftYarnLot || item?.weftLotNo || item?.weft_lot_no || currentPacking?.weftLotNo || currentPacking?.weft_lot_no || '';

        expandedItems.push({
          ...item,
          ...(matchedPE || {}),
          rollNo: item.rollNo || item.roll_no || matchedPE?.rollNo || '-',
          pieceNo: pNo || item.pieceNo || item.piece_no || '-',
          length: mtr,
          meters: mtr,
          yards: yards,
          pounds: netWt,
          netWeight: netWt,
          grossWt: grossWt,
          grossWeight: grossWt,
          avgWt: mtr > 0 ? (netWt / mtr) : Number(item.avgWt || item.avg_weight || 0),
          loomNo,
          warpLotNo,
          weftLotNo,
          pts4: matchedPE?.pts4 ?? matchedPE?.points4 ?? item.pts4 ?? 0,
          pts3: matchedPE?.pts3 ?? matchedPE?.points3 ?? item.pts3 ?? 0,
          pts2: matchedPE?.pts2 ?? matchedPE?.points2 ?? item.pts2 ?? 0,
          pts1: matchedPE?.pts1 ?? matchedPE?.points1 ?? item.pts1 ?? 0,
          totalPoints: matchedPE?.totalPoints ?? matchedPE?.total_points ?? matchedPE?.totalDefectPoints ?? item.totalPoints ?? 0,
          pointsPer100Mtr: matchedPE?.pointsPer100Mtr ?? matchedPE?.points_per_100mtr ?? item.pointsPer100Mtr ?? 0,
          grade: matchedPE?.grade || matchedPE?.fabricGrade || matchedPE?.gradeName || item.grade || 'A',
          defectsDetail
        });
      }
    });

    const items: PackingListItem[] = expandedItems.map((item: any, index: number) => {
      const itemInv = (Array.isArray(invoiceList) ? invoiceList : []).find((inv: any) => String(inv.id) === String(item.invoiceId));
      const itemInvoiceNo = item.invoiceNo || itemInv?.invoiceNo || '';
      const mtr = Number(item.meters ?? item.length ?? item.inspectedMtr ?? item.pieceMeter ?? item.meter ?? 0);
      const grossWt = Number(item.grossWeight ?? item.grossWt ?? item.gross_weight ?? item.gross_wt ?? 0);
      const netWt = Number(item.netWeight ?? item.pounds ?? item.net_weight ?? item.netWt ?? item.net_wt ?? 0);
      const yards = Number(item.yards ?? 0);
      const avgWt = mtr > 0 ? netWt / mtr : Number(item.avgWt || item.avg_weight || 0);
      const rawDefectsDetail = item.defectsDetail || resolvePieceDefectsDetail(item.pieceNo, item.pieceId, item.remarks || '');
      const defectSummary = summarizeDefects(rawDefectsDetail);
      const existingTotalPoints = Number(item.totalPoints || item.total_points || item.totalDefectPoints || 0);
      const totalPoints = defectSummary.hasDefects ? defectSummary.totalPoints : existingTotalPoints;

      return {
        sNo: index + 1,
        rollNo: item.rollNo || item.roll_no || '-',
        pieceNo: item.pieceNo || item.piece_no || '-',
        meters: mtr,
        yards: yards,
        netWeight: netWt,
        grossWeight: grossWt,
        avgWeight: avgWt,
        noOfPieces: 1,
        pieceMeter: `${item.pieceNo || '-'} (${mtr.toFixed(2)})`,
        remarks: item.remarks || '',
        invoiceNo: itemInvoiceNo,
        loomNo: item.loomNo || item.loom_no || currentPacking.loomNo || '',
        pts4: defectSummary.hasDefects ? defectSummary.pts4 : Number(item.pts4 || item.points4 || 0),
        pts3: defectSummary.hasDefects ? defectSummary.pts3 : Number(item.pts3 || item.points3 || 0),
        pts2: defectSummary.hasDefects ? defectSummary.pts2 : Number(item.pts2 || item.points2 || 0),
        pts1: defectSummary.hasDefects ? defectSummary.pts1 : Number(item.pts1 || item.points1 || 0),
        totalPoints,
        pointsPer100Mtr: defectSummary.hasDefects
          ? (mtr > 0 ? (totalPoints * 100) / mtr : 0)
          : Number(item.pointsPer100Mtr || item.points_per_100mtr || 0),
        grade: item.grade || item.fabricGrade || 'A',
        warpLotNo: item.warpLotNo || item.warp_lot_no || currentPacking.warpLotNo || '',
        weftLotNo: item.weftLotNo || item.weft_lot_no || currentPacking.weftLotNo || '',
        defectsDetail: defectSummary.hasDefects
          ? defectSummary.details
          : sanitizeDefectString(rawDefectsDetail)
      };
    });

    let resolvedOrderNo = '-';
    let salesOrderPo = '';
    if (currentPacking.isJobwork === 1 || currentPacking.isJobwork === true) {
      const weavingOrder = Array.isArray(weavingJobWorkOrderList) 
        ? weavingJobWorkOrderList.find((wo: any) => wo.id === currentPacking.weavingWorkOrderId)
        : null;
      resolvedOrderNo = weavingOrder?.weavingWorkOrderNo || weavingOrder?.jobWorkOrderNo || weavingOrder?.id?.toString() || '-';
    } else {
      const salesOrder = Array.isArray(salesOrderList) 
        ? salesOrderList.find((so: any) => so.id === currentPacking.salesOrderId)
        : null;
      resolvedOrderNo = salesOrder?.salesOrderNo || salesOrder?.orderNo || salesOrder?.soNo || '-';
      salesOrderPo = salesOrder?.buyerPoNo || salesOrder?.poNo || salesOrder?.poNumber || '';
    }

    const matchingInvoice = (Array.isArray(invoiceList) ? invoiceList : []).find((inv: any) => {
      if (currentPacking.salesOrderId && Number(inv.salesOrderId) === Number(currentPacking.salesOrderId) && Number(inv.salesOrderId) !== 0) return true;
      if (currentPacking.weavingWorkOrderId && Number(inv.weavingWorkOrderId) === Number(currentPacking.weavingWorkOrderId) && Number(inv.weavingWorkOrderId) !== 0) return true;
      if (currentPacking.yarnSalesOrderId && Number(inv.yarnSalesOrderId) === Number(currentPacking.yarnSalesOrderId) && Number(inv.yarnSalesOrderId) !== 0) return true;
      return false;
    });

    const rawTransports = (transportList as any)?.data ?? transportList ?? [];
    const rawTransportsArr: any[] = Array.isArray(rawTransports) ? rawTransports : [];
    const transport = rawTransportsArr.find((t: any) => String(t.id) === String(currentPacking.transportId));
    const resolvedTransportName = transport?.transportName || transport?.name || '';

    return {
      company: {
        name: company.companyName || company.name || '',
        address: [companyAddress.line1, companyAddress.line2].filter(Boolean).join(', ') || companyAddress.address || '',
        city: companyLoc.city,
        state: companyLoc.state,
        country: companyLoc.country,
        pincode: companyLoc.pincode,
        cityPincode: companyLoc.cityPincode,
        stateCode: companyLoc.stateCode,
        displayState: companyLoc.displayState,
        gst: company.gst || company.gstNo || ''
      },
      buyer: buyerData,
      consignee: consigneeData,
      invoiceNo: matchingInvoice?.invoiceNo || currentPacking.invoiceNo || '',
      invoiceDate: matchingInvoice?.invoiceDate 
        ? new Date(matchingInvoice.invoiceDate).toLocaleDateString() 
        : (currentPacking.invoiceDate ? new Date(currentPacking.invoiceDate).toLocaleDateString() : ''),
      poNumber: salesOrderPo || currentPacking.poNumber || '',
      fabricCode: currentPacking.fabricCode || '',
      fabricQuality: currentPacking.fabricQuality || '',
      packingListNo: currentPacking.packingSlipNo || '',
      orderNo: resolvedOrderNo,
      orderDate: currentPacking.packingDate ? new Date(currentPacking.packingDate).toLocaleDateString() : '',
      items,
      isBrushChecked: currentPacking.isBrushChecked,
      poNo: currentPacking.poNo || '',
      poDate: currentPacking.poDate ? new Date(currentPacking.poDate).toLocaleDateString() : '',
      lrNo: currentPacking.lrNo || '',
      lrDate: currentPacking.lrDate ? new Date(currentPacking.lrDate).toLocaleDateString() : '',
      truckNo: currentPacking.truckNo || '',
      transportName: resolvedTransportName,
      remarks: currentPacking.remarks || '',
      loomTypeSelvedge: currentPacking.loomTypeSelvedge || currentPacking.loomType || 'AIRJET LENO',
      glm: currentPacking.glm || currentPacking.fabricWeightGlm || '',
      weave: currentPacking.weave || '',
      fabricLotNo: currentPacking.fabricLotNo || currentPacking.lotNo || currentPacking.beamNo || ''
    };
  }, [
    currentPacking,
    companyMasterList,
    customerList,
    consigneeList,
    cityList,
    stateList,
    countryList,
    weavingJobWorkOrderList,
    salesOrderList,
    invoiceList,
    transportList,
    pieceEntryList,
    loomList,
    fabricInspectionList,
    defectMasterList
  ]);

  if (packingLoading || companyLoading || customerLoading || consigneeLoading) {
    return <div className="p-10 text-center font-bold">Loading Packing List...</div>;
  }

  if (!templateData) {
    return <div className="p-10 text-center text-red-600 font-bold">Data not found</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-10 print:bg-white print:py-0 print-page-scroll-container">
      <style>{`
        /* Ultra compact spacing for table cells in screen and print view */
        .items-table td, .items-table th,
        .meta-table td, .meta-table th {
          padding-top: 0.5px !important;
          padding-bottom: 0.5px !important;
          padding-left: 1px !important;
          padding-right: 1px !important;
          line-height: 1.05 !important;
        }
        /* Allow scroll in screen view */
        @media screen {
          html, body, #root, div.flex.h-screen, div.flex-1.flex.flex-col.overflow-hidden {
            height: auto !important;
            overflow: auto !important;
          }
          .print-page-scroll-container {
            overflow-y: auto !important;
            height: auto !important;
          }
        }
        /* Enable clean pagination print formatting */
        @media print {
          @page {
            margin: 0.25cm !important; /* Maximizes vertical printable height on A4 */
          }
          body {
            padding: 0 !important;
            background-color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body, #root, div.flex.h-screen, div.flex-1.flex.flex-col.overflow-hidden, .print-page-scroll-container {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
          }
          /* Clear all overflow/scrolling in print to prevent cutoffs and scrollbars */
          .overflow-x-auto, .overflow-y-auto, * {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }
          /* Crisp thin borders for tables in print */
          table, th, td {
            border: 0.5px solid #000000 !important;
          }
          /* Allow items table to flow across pages while preventing mid-row splitting */
          .items-table tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .items-table thead {
            display: table-header-group;
          }
          /* Compact spacing for metadata details grid in print */
          .meta-table td, .meta-table th {
            padding-top: 0.5px !important;
            padding-bottom: 0.5px !important;
            padding-left: 1.5px !important;
            padding-right: 1.5px !important;
            font-size: 10.5px !important;
            line-height: 1.05 !important;
          }
          .meta-table td.font-bold {
            background-color: #f2f2f2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Item rows compact spacing to ensure maximum rows fit cleanly */
          .items-table td, .items-table th {
            padding-top: 0.5px !important;
            padding-bottom: 0.5px !important;
            padding-left: 1px !important;
            padding-right: 1px !important;
            font-size: 10.5px !important;
            line-height: 1.05 !important;
          }
          .items-table thead tr, .items-table thead th {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="max-w-[1200px] mx-auto bg-white shadow-lg print:shadow-none">
        <div className="flex justify-end p-4 print:hidden">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-bold"
          >
            Print Packing List
          </button>
        </div>
        <PackingListTemplate data={templateData} />
      </div>
    </div>
  );
}
