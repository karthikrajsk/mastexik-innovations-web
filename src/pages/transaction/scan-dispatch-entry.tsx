import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllCustomers } from '@/state/customerSlice';
import { getAllGeneratePacking } from '@/state/generatePackingSlice';
import { getAllInvoices, getAllInvoicesByCompanyId } from '@/state/invoiceSlice';
import { getAllBaleRollPackings } from '@/state/baleRollPackingSlice';
import { getAllFabricMastersForDropdown } from '@/state/fabricMasterSlice';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { toast } from 'react-toastify';
import {
  markInvoiceLoaded,
  setBuyerSelection,
  setInvoiceSelection,
  setFabricSelection,
  setScannedRolls,
  setSummary,
  setFormData,
  createScanDispatch,
  updateScanDispatch,
  ScannedRollsItems,
  SummaryRollItems,
} from '@/state/scanDispatchSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';
import { ArrowLeft, ClipboardList, Scan, Plus, Trash2, Save } from 'lucide-react';

interface LocationState {
  invoiceId?: number;
  buyerId?: number;
  editMode?: boolean;
  scanDispatchData?: {
    id: number;
    fabricMasterId?: number;
    rolls: ScannedRollsItems[];
    summary: SummaryRollItems[];
    orderId?: number;
    orderNo?: string;
  };
}

type PersistedRollEntry = {
  rollNo: string;
  isLoadedPacking: 0 | 1;
};

const storageKeyForInvoice = (invoiceId?: number) =>
  invoiceId ? `scan-dispatch-status-${invoiceId}` : 'scan-dispatch-status-temp';

// const FORM_STATE_KEY = 'scan-dispatch-form-selection';

const buildPersistedRecord = (entries: PersistedRollEntry[]) =>
  entries.reduce<Record<string, PersistedRollEntry>>((acc, entry) => {
    const normalized = String(entry.rollNo ?? '').trim().toLowerCase();
    if (!normalized) {
      return acc;
    }
    acc[normalized] = { rollNo: entry.rollNo, isLoadedPacking: entry.isLoadedPacking };
    return acc;
  }, {});

const FORM_STATE_KEY = 'scan-dispatch-form';

const normalizeApiArray = (input: any): any[] => {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  }
  if (typeof input !== 'object') {
    return [];
  }
  const candidates = ['data', 'items', 'rows', 'results'];
  for (const key of candidates) {
    const value = input[key];
    if (value === input) {
      continue;
    }
    if (Array.isArray(value)) {
      return value;
    }
    const nested = normalizeApiArray(value);
    if (nested.length) {
      return nested;
    }
  }
  return [];
};

const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

const buildSummaryRows = (rolls: ScannedRollsItems[]): SummaryRollItems[] => {
  const map: Record<string, SummaryRollItems> = {};
  rolls.forEach((roll) => {
    const key = roll.packingListNo;
    const snapshot = map[key] ?? {
      packingListNo: key,
      noOfRolls: 0,
      totalMeters: 0,
      netWeight: 0,
      grossWeight: 0,
    };
    snapshot.noOfRolls += 1;
    snapshot.totalMeters += roll.meters ?? 0;
    snapshot.netWeight += roll.netWeight ?? 0;
    snapshot.grossWeight += roll.grossWeight ?? 0;
    map[key] = snapshot;
  });
  return Object.values(map);
};

const ADD_MODE_FORM_RESET = {
  buyerId: null,
  buyerName: '',
  orderId: undefined,
  orderNo: '',
  invoiceId: undefined,
  invoiceNo: '',
  fabricMasterId: undefined,
  fabricCodeQuality: '',
  rolls: [],
  summary: [],
};

export default function ScanDispatchEntry() {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const dispatch = useDispatch<AppDispatch>();
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { invoiceList } = useSelector((state: RootState) => state.invoice);
  const { generatePackingList } = useSelector((state: RootState) => state.generatePacking);
  const { list: baleRollPackings } = useSelector((state: RootState) => state.baleRollPacking);
  const { formData, completedInvoices } = useSelector((state: RootState) => state.scanDispatch);
  const { fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster);
  const { companyId } = useCompanyContext();
  const [validationMessage, setValidationMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [editModeId, setEditModeId] = useState<number | null>(null);
  const scannedRollsRef = useRef<ScannedRollsItems[]>([]);
  const navigate = useNavigate();
  const initialFetchRef = useRef(false);
  const [persistedRolls, setPersistedRolls] = useState<Record<string, PersistedRollEntry>>({});
  const formHydratedRef = useRef(false);
  const routeStateProcessed = useRef(false);
  const isEditMode = Boolean(state?.editMode);

  useEffect(() => {
    routeStateProcessed.current = false;
  }, [location.key]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }
    dispatch(setFormData(ADD_MODE_FORM_RESET));
  }, [dispatch, isEditMode, location.key]);

  useEffect(() => {
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;

    dispatch(getAllCustomers({ fetchAll: true }) as any);
    dispatch(getAllGeneratePacking({}) as any);
    dispatch(getAllBaleRollPackings({}) as any);
    dispatch(getAllFabricMastersForDropdown());
  }, [dispatch]);

  useEffect(() => {
    if (!formData.invoiceId) {
      setPersistedRolls({});
      return;
    }
    if (typeof window === 'undefined') {
      setPersistedRolls({});
      return;
    }
    const storageKey = storageKeyForInvoice(formData.invoiceId);
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) {
      setPersistedRolls({});
      return;
    }
    try {
      const parsed = JSON.parse(storedValue) as PersistedRollEntry[];
      setPersistedRolls(buildPersistedRecord(parsed));
    } catch {
      setPersistedRolls({});
    }
  }, [formData.invoiceId]);

  const persistRollStatuses = useCallback(
    (invoiceId: number | undefined, rolls: ScannedRollsItems[]) => {
      const entries = rolls.map((roll) => ({
        rollNo: roll.rollNo,
        isLoadedPacking: roll.isLoadedPacking,
      }));
      if (invoiceId && typeof window !== 'undefined') {
        window.localStorage.setItem(storageKeyForInvoice(invoiceId), JSON.stringify(entries));
      }
      setPersistedRolls(buildPersistedRecord(entries));
    },
    []
  );

  const fetchPackingListForInvoice = useCallback(
    (invoiceId?: number) => {
      if (!invoiceId) {
        return;
      }
      const params = { invoiceId, companyId: companyId ?? undefined };
      dispatch(getAllGeneratePacking(params) as any);
    },
    [dispatch, companyId]
  );

  useEffect(() => {
    fetchPackingListForInvoice(formData.invoiceId);
  }, [fetchPackingListForInvoice, formData.invoiceId]);

  useEffect(() => {
    if (companyId) {
      dispatch(getAllInvoicesByCompanyId(companyId) as any);
    }
    //  else {
    //   dispatch(getAllInvoices({}) as any);
    // }
  }, [dispatch, companyId]);

  const buyers = useMemo(() => (Array.isArray(customerList) ? customerList : []), [customerList]);
  const invoices = useMemo(() => (Array.isArray(invoiceList) ? invoiceList : []), [invoiceList]);
  const packingLists = useMemo(() => normalizeApiArray(generatePackingList), [generatePackingList]);
  const balePackings = useMemo(() => normalizeApiArray(baleRollPackings), [baleRollPackings]);
  const fabricMasters = useMemo(() => normalizeApiArray(fabricMasterFullList), [fabricMasterFullList]);

const pendingInvoices = useMemo(() => {
  const completedSet = new Set(completedInvoices || []);
  
  // Map packing lists to check if they have available (unscanned) items
  const packHasUnscanned = new Map<string, boolean>();
  packingLists.forEach((p: any) => {
    const pNo = String(p.packingSlipNo ?? p.packingListNo ?? '').trim().toLowerCase();
    if (pNo) {
      // Check if any item in this packing list is available (0 or null)
      const hasUnscanned = Array.isArray(p.items) && p.items.some((it: any) => {
        const status = it.isScannedPacking;
        return status === 0 || status === null || status === undefined;
      });
      packHasUnscanned.set(pNo, hasUnscanned);
    }
  });

  return invoices.filter((invoice: any) => {
    // 1. Always keep the current invoice if we are in Edit Mode
    if (state?.editMode && Number(invoice.id) === Number(state?.invoiceId)) {
      return true;
    }

    // 2. Standard filters
    const isInvoice = Number(invoice.isInvoice ?? 0) === 1;
    const isCompleted = completedSet.has(invoice.id);
    if (!isInvoice || isCompleted) return false;

    // 3. Dropdown logic: Only show invoice if it has at least one unscanned item in its items list
    const invoiceItems = Array.isArray(invoice.items) ? invoice.items : [];
    const hasAnyUnscanned = invoiceItems.some((item: any) => {
      const pNo = String(item.packingListNo ?? item.packingSlipNo ?? '').trim().toLowerCase();
      // If the packing list for this item has unscanned rolls, return true
      return packHasUnscanned.get(pNo) === true;
    });

    return hasAnyUnscanned;
  });
}, [invoices, completedInvoices, packingLists, state?.editMode, state?.invoiceId]);


  const invoicesById = useMemo(() => {
    const map = new Map<number, any>();
    invoices.forEach((invoice: any) => {
      if (invoice?.id != null) {
        map.set(invoice.id, invoice);
      }
    });
    return map;
  }, [invoices]);

  const buyerLookup = useMemo(() => {
    return buyers.reduce<Record<number, string>>((acc, buyer: any) => {
      const name = buyer.customerName || buyer.buyerName || buyer.name;
      if (name) {
        acc[buyer.id] = name;
      }
      return acc;
    }, {});
  }, [buyers]);

  useEffect(() => {
    if (!state || routeStateProcessed.current) {
      return;
    }

    if (!buyers.length || !invoices.length) {
      return;
    }

    if (state.editMode && state.scanDispatchData?.fabricMasterId && !fabricMasters.length) {
      return;
    }

    if (state.buyerId && !formData.buyerId) {
      dispatch(setBuyerSelection({ buyerId: state.buyerId, buyerName: buyerLookup[state.buyerId] ?? '' }));
    }
    if (state.invoiceId && !formData.invoiceId) {
      const invoice = invoices.find((item: any) => item.id === state.invoiceId);
      if (invoice) {
        const orderId = state.scanDispatchData?.orderId || invoice.salesOrderId || invoice.weavingWorkOrderId || invoice.yarnSalesOrderId || undefined;
        const orderNo = state.scanDispatchData?.orderNo || invoice.soNo || invoice.woNo || '';
        dispatch(
          setInvoiceSelection({
            invoiceId: invoice.id,
            invoiceNo: invoice.invoiceNo || '',
            orderId,
            orderNo,
          })
        );
      }
    }

    if (state.editMode && state.scanDispatchData) {
      const scanData = state.scanDispatchData;
      setEditModeId(scanData.id);

      if (scanData.fabricMasterId) {
        const fabric = fabricMasters.find((f: any) => f.id === scanData.fabricMasterId);
        const fabricLabel = fabric
          ? `${fabric.fabricCode || ''}${fabric.fabricQuality ? ` / ${fabric.fabricQuality}` : ''}`.trim()
          : '';
        dispatch(
          setFabricSelection({
            fabricMasterId: scanData.fabricMasterId,
            fabricCodeQuality: fabricLabel,
          })
        );
      }

      if (scanData.rolls?.length > 0) {
        dispatch(setScannedRolls(scanData.rolls));
      }

      if (scanData.summary?.length > 0) {
        dispatch(setSummary(scanData.summary));
      }
    }

    routeStateProcessed.current = true;
  }, [state, formData.buyerId, formData.invoiceId, buyerLookup, dispatch, invoices, buyers, fabricMasters]);

  useEffect(() => {
    if (formHydratedRef.current) {
      return;
    }
    if (!isEditMode) {
      formHydratedRef.current = true;
      return;
    }
    if (!buyers.length) {
      return;
    }

    if (state?.buyerId && !formData.buyerId) {
      return;
    }
    if (state?.invoiceId && !formData.invoiceId) {
      return;
    }

    formHydratedRef.current = true;
  }, [buyers.length, formData.buyerId, formData.invoiceId, isEditMode, state?.buyerId, state?.invoiceId]);

  const currentInvoice = useMemo(() => (formData.invoiceId ? invoicesById.get(formData.invoiceId) : null), [
    formData.invoiceId,
    invoicesById,
  ]);

  const invoicePackingLists = useMemo(() => {
    if (!currentInvoice) {
      return [];
    }
    const currentInvoiceNo = String(currentInvoice.invoiceNo || currentInvoice.invoiceNumber || '').trim().toLowerCase();
    return packingLists.filter((pack: any) => {
      const packInvoiceNo = String(pack.invoiceNo || pack.invoiceNumber || '').trim().toLowerCase();
      return packInvoiceNo && packInvoiceNo === currentInvoiceNo;
    });
  }, [currentInvoice, packingLists]);

  const invoicePackItemTotals = useMemo(() => {
    const map: Record<string, number> = {};
    invoicePackingLists.forEach((pack: any) => {
      const key = String(pack.packingSlipNo || pack.packingListNo || '').trim().toLowerCase();
      if (key) {
        map[key] = Array.isArray(pack.items) ? pack.items.length : 0;
      }
    });
    return map;
  }, [invoicePackingLists]);

  const scannedRollLookup = useMemo(() => {
    const map = new Map<string, ScannedRollsItems>();
    formData.rolls.forEach((roll) => {
      const key = String(roll.rollNo || '').trim().toLowerCase();
      if (key) {
        map.set(key, roll);
      }
    });
    return map;
  }, [formData.rolls]);

  const fabricOptions = useMemo(() => {
    if (!currentInvoice) {
      return [];
    }
    const invoiceItems = Array.isArray(currentInvoice.items) ? currentInvoice.items : [];
    const fabricIds = new Set<number>();
    invoiceItems.forEach((item: any) => {
      const id = Number(item.fabricMasterId ?? item.fabricCodeId ?? 0);
      if (id > 0) fabricIds.add(id);
    });

    return fabricMasters
      .filter((f: any) => fabricIds.has(Number(f.id)))
      .map((f: any) => ({
        id: Number(f.id),
        label: `${f.fabricCode || ''}${f.fabricQuality ? ` / ${f.fabricQuality}` : ''}`.trim(),
      }));
  }, [currentInvoice, fabricMasters]);

  const baleFabricLookup = useMemo(() => {
    const map: Record<string, number> = {};
    balePackings.forEach((entry: any) => {
      const fabricId = Number(entry.fabricMasterId ?? entry.fabricCodeId ?? 0);
      if (fabricId <= 0) return;

      const rollKey = String(entry.rollOrBaleNo ?? '').trim().toLowerCase();
      if (rollKey) map[rollKey] = fabricId;

      const items = Array.isArray(entry.items) ? entry.items : [];
      items.forEach((item: any) => {
        const itemRollKey = String(item.rollNo ?? item.pieceNo ?? '').trim().toLowerCase();
        if (itemRollKey) map[itemRollKey] = fabricId;
      });
    });
    return map;
  }, [balePackings]);

  const invoiceRollRows = useMemo(() => {
  if (!currentInvoice) return [];

  return invoicePackingLists.flatMap((pack: any) => {
    const packItems = Array.isArray(pack.items) ? pack.items : [];
    const packKey = String(pack.packingSlipNo || pack.packingListNo || '').trim().toLowerCase();

    return packItems
      .map((item: any) => {
        const rollNo = String(item.rollNo || item.rollOrBaleNo || item.pieceNo || '').trim();
        const normalized = rollNo.toLowerCase();
        const scannedInfo = scannedRollLookup.get(normalized);
        const isLoadedPacking = scannedInfo?.isLoadedPacking ?? 0;
        const isScanned = isLoadedPacking === 1;

        // "isScannedPacking" represents if the roll is ALREADY scanned in the master database (beyond this session)
        const isScannedPacking = item.isScannedPacking;

        return {
          packingListNo: pack.packingSlipNo || pack.packingListNo || '',
          rollNo,
          meters: Number(item.meters ?? item.length ?? 0),
          netWeight: Number(item.netWeight ?? item.netWt ?? 0),
          grossWeight: Number(item.grossWeight ?? item.grossWt ?? 0),
          isScanned,
          isLoadedPacking,
          isScannedPacking,
          noOfRolls: invoicePackItemTotals[packKey] ?? 0,
        };
      })
      .filter((entry: any): entry is any => {
        if (!entry) return false;
        
        // Logic for Add Mode:
        // Show item if it is NOT scanned in master data (0, null, undefined)
        const isAvailableMaster = entry.isScannedPacking === 0 || entry.isScannedPacking === null || entry.isScannedPacking === undefined;
        
        // OR Show item if it is scanned in the current session (even if master says 1)
        const isCurrentlyScanned = entry.isLoadedPacking === 1;

        return isAvailableMaster || isCurrentlyScanned;
      });
  });
}, [currentInvoice, invoicePackingLists, scannedRollLookup, invoicePackItemTotals]);


  const baleSummaryMap = useMemo(() => {
    const map = new Map<string, { meters: number; netWeight: number; grossWeight: number }>();
    balePackings.forEach((entry: any) => {
      const rollKeyRaw = String(entry.rollOrBaleNo ?? '').trim();
      if (!rollKeyRaw) {
        return;
      }
      const key = rollKeyRaw.toLowerCase();
      const existing = map.get(key) || { meters: 0, netWeight: 0, grossWeight: 0 };
      const items = Array.isArray(entry.items) ? entry.items : [];
      if (items.length) {
        items.forEach((item: any) => {
          existing.meters += Number(item.meters ?? 0);
          existing.netWeight += Number(item.netWeight ?? 0);
          existing.grossWeight += Number(item.grossWeight ?? 0);
        });
      } else {
        existing.meters += Number(entry.totalMeters ?? entry.meters ?? 0);
        existing.netWeight += Number(entry.totalNet ?? entry.totalNetWeight ?? entry.netWeight ?? 0);
        existing.grossWeight += Number(entry.totalGross ?? entry.grossWeight ?? 0);
      }
      map.set(key, existing);
    });
    return map;
  }, [balePackings]);

  const summaryRowsFromBale = useMemo(() => {
    if (!currentInvoice) {
      return [];
    }
    return invoiceRollRows.map((row) => {
      const bale = baleSummaryMap.get(row.rollNo.toLowerCase());
      const meters = bale?.meters ?? row.meters ?? 0;
      const netWeight = bale?.netWeight ?? row.netWeight ?? 0;
      const grossWeight = bale?.grossWeight ?? row.grossWeight ?? 0;
      return {
        rollNo: row.rollNo,
        packingListNo: row.packingListNo,
        meters,
        netWeight,
        grossWeight,
        noOfRolls: row.noOfRolls,
      };
    });
  }, [invoiceRollRows, baleSummaryMap, currentInvoice]);

  const expectedRollCount = useMemo(() => {
    return invoicePackingLists.reduce((total, pack) => {
      const items = Array.isArray(pack.items) ? pack.items : [];
      return total + items.length;
    }, 0);
  }, [invoicePackingLists]);

  useEffect(() => {
    scannedRollsRef.current = formData.rolls;
  }, [formData.rolls]);

  useEffect(() => {
    if (!formData.invoiceId) {
      return;
    }
    if (!invoiceRollRows.length) {
      return;
    }
    if (!Object.keys(persistedRolls).length) {
      return;
    }
    if (formData.rolls.some((roll) => roll.isLoadedPacking === 1)) {
      return;
    }

    const normalizedPersisted = new Map<string, PersistedRollEntry>();
    Object.values(persistedRolls).forEach((entry) => {
      const normalized = String(entry.rollNo ?? '').trim().toLowerCase();
      if (!normalized) {
        return;
      }
      normalizedPersisted.set(normalized, entry);
    });

    const hydratedRolls = invoiceRollRows.reduce<ScannedRollsItems[]>((acc, row) => {
      const normalizedRow = String(row.rollNo ?? '').trim().toLowerCase();
      const persisted = normalizedPersisted.get(normalizedRow);
      if (persisted && persisted.isLoadedPacking === 1) {
        acc.push({ ...row, rollNo: row.rollNo, isLoadedPacking: 1 });
      }
      return acc;
    }, []);

    if (!hydratedRolls.length) {
      return;
    }

    dispatch(setScannedRolls(hydratedRolls));
    const summary = buildSummaryRows(hydratedRolls);
    dispatch(setSummary(summary));
    persistRollStatuses(formData.invoiceId, hydratedRolls);
  }, [
    dispatch,
    formData.invoiceId,
    formData.rolls,
    invoiceRollRows,
    persistedRolls,
    persistRollStatuses,
  ]);

  const processScanValue = useCallback(
    (rawInput: string) => {
      const value = rawInput.trim();
      setValidationMessage('');

      if (!formData.invoiceId) {
        setValidationMessage('Select an invoice before scanning.');
        toast.error('Select an invoice before scanning.');
        return;
      }

      if (!value) {
        setValidationMessage('Scan a valid roll number.');
        toast.error('Scan a valid roll number.');
        return;
      }

      const normalized = value.toLowerCase();

      let matchedBaleRoll: any = null;
      let matchedInvoiceItem: any = null;
      let matchedPackingList: any = null;

      for (const bale of balePackings) {
        const baleRollNo = String(bale.rollOrBaleNo ?? '').trim().toLowerCase();

        if (baleRollNo === normalized) {
          matchedBaleRoll = bale;
          break;
        }

        const items = Array.isArray(bale.items) ? bale.items : [];
        for (const item of items) {
          const itemRollNo = String(item.rollNo ?? item.pieceNo ?? '').trim().toLowerCase();
          if (itemRollNo === normalized) {
            matchedBaleRoll = { ...bale, matchedItem: item };
            break;
          }
        }

        if (matchedBaleRoll) break;
      }

      if (!matchedBaleRoll) {
        const errorMsg = `Barcode "${value}" not found in bale packing records.`;
        setValidationMessage(errorMsg);
        toast.error(errorMsg);
        return;
      }

      for (const pack of invoicePackingLists) {
        const items = Array.isArray(pack.items) ? pack.items : [];

        for (const item of items) {
          const itemRollNo = String(item.rollNo || item.rollOrBaleNo || item.pieceNo || '').trim().toLowerCase();
          if (itemRollNo === normalized) {
            matchedInvoiceItem = item;
            matchedPackingList = pack;
            break;
          }
        }

        if (matchedInvoiceItem) break;
      }

      if (!matchedInvoiceItem) {
        const errorMsg = `Roll "${value}" not part of selected invoice.`;
        setValidationMessage(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const packFabricId = Number(matchedPackingList?.fabricMasterId ?? matchedPackingList?.fabricCodeId ?? 0);
      const itemFabricId = Number(matchedInvoiceItem.fabricMasterId ?? packFabricId ?? 0);
      const baleItemFabricId = matchedBaleRoll.matchedItem
        ? Number(matchedBaleRoll.matchedItem.fabricMasterId ?? matchedBaleRoll.fabricMasterId ?? matchedBaleRoll.fabricCodeId ?? 0)
        : Number(matchedBaleRoll.fabricMasterId ?? matchedBaleRoll.fabricCodeId ?? 0);

      const resolvedFabricId = itemFabricId || baleItemFabricId || (baleFabricLookup[normalized] ?? 0);

      if (formData.fabricMasterId) {
        const selectedFabricId = Number(formData.fabricMasterId ?? 0);
        if (selectedFabricId > 0 && resolvedFabricId > 0 && resolvedFabricId !== selectedFabricId) {
          const fabric = fabricMasters.find((f: any) => Number(f.id) === resolvedFabricId);
          const fabricName = fabric ? (fabric.fabricCode || fabric.fabricName || `Fabric ${resolvedFabricId}`) : 'Unknown Fabric';

          const errorMsg = `This roll belongs to: ${fabricName}. Please select the correct fabric.`;
          setValidationMessage(errorMsg);
          toast.error(errorMsg);
          return;
        }
      }

      const isAlreadyScanned = scannedRollsRef.current.some(
        (roll) => String(roll.rollNo ?? '').trim().toLowerCase() === normalized && roll.isLoadedPacking === 1
      );
      if (isAlreadyScanned) {
        const errorMsg = `Roll "${value}" already scanned.`;
        setValidationMessage(errorMsg);
        toast.error(errorMsg);
        return;
      }

      let meters = Number(matchedInvoiceItem.meters ?? matchedInvoiceItem.length ?? 0);
      let netWeight = Number(matchedInvoiceItem.netWeight ?? matchedInvoiceItem.netWt ?? 0);
      let grossWeight = Number(matchedInvoiceItem.grossWeight ?? matchedInvoiceItem.grossWt ?? 0);

      const baleData = baleSummaryMap.get(normalized);
      if (baleData) {
        meters = baleData.meters || meters;
        netWeight = baleData.netWeight || netWeight;
        grossWeight = baleData.grossWeight || grossWeight;
      }

      const canonicalRollNo = String(
        matchedInvoiceItem.rollNo ?? matchedInvoiceItem.rollOrBaleNo ?? matchedInvoiceItem.pieceNo ?? value
      ).trim();
      const normalizedCanonical = canonicalRollNo.toLowerCase();

      const nextRoll: ScannedRollsItems = {
        packingListNo: matchedPackingList?.packingSlipNo || matchedPackingList?.packingListNo || '',
        rollNo: canonicalRollNo,
        isLoadedPacking: 1,
        meters,
        netWeight,
        grossWeight,
      };

      const updatedScannedRolls = (() => {
        const index = formData.rolls.findIndex(
          (row) => String(row.rollNo ?? '').trim().toLowerCase() === normalizedCanonical
        );
        if (index >= 0) {
          const copy = [...formData.rolls];
          copy[index] = { ...copy[index], rollNo: canonicalRollNo, isLoadedPacking: 1 };
          return copy;
        }
        return [...formData.rolls, nextRoll];
      })();

      dispatch(setScannedRolls(updatedScannedRolls));
      persistRollStatuses(formData.invoiceId, updatedScannedRolls);
      const summary = buildSummaryRows(updatedScannedRolls);
      dispatch(setSummary(summary));

      toast.success(`Roll "${value}" scanned successfully!`);
      setValidationMessage('');

      if (expectedRollCount > 0 && updatedScannedRolls.length >= expectedRollCount && formData.invoiceId) {
        const completeMsg = 'All rolls scanned. Dispatch marked complete.';
        setValidationMessage(completeMsg);
        toast.success(completeMsg);
      }
    },
    [
      invoicePackingLists,
      balePackings,
      dispatch,
      fabricMasters,
      baleFabricLookup,
      baleSummaryMap,
      formData.invoiceId,
      formData.fabricMasterId,
      formData.rolls,
      expectedRollCount,
      persistRollStatuses,
    ],
  );

  const handleBuyerChange = (value: number) => {
    const name = buyerLookup[value] ?? '';
    dispatch(setBuyerSelection({ buyerId: value, buyerName: name }));
    dispatch(setInvoiceSelection({}));
    setValidationMessage('');
  };

  const handleInvoiceChange = (value: number) => {
    const invoice = pendingInvoices.find((item: any) => item.id === value);
    if (!invoice) {
      return;
    }
    const orderId = invoice.salesOrderId || invoice.weavingWorkOrderId || invoice.yarnSalesOrderId || undefined;
    const orderNo = invoice.soNo || invoice.woNo || '';
    dispatch(
      setInvoiceSelection({
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo || '',
        orderId,
        orderNo,
      })
    );
    fetchPackingListForInvoice(invoice.id);
    setValidationMessage('');
  };

  const handleFabricChange = (value: number) => {
    const option = fabricOptions.find((entry) => entry.id === value);
    dispatch(setFabricSelection({ fabricMasterId: value, fabricCodeQuality: option?.label ?? '' }));
    setValidationMessage('');
  };

  const handleManualBarcodeAdd = () => {
    const barcodeValue = manualBarcodeInput.trim();

    if (!barcodeValue) {
      const errorMsg = 'Please enter a barcode value.';
      setValidationMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    processScanValue(barcodeValue);
    setManualBarcodeInput('');
  };

  const handleManualBarcodeKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleManualBarcodeAdd();
    }
  };

  const handleSaveDispatch = async () => {
    setValidationMessage('');
    if (!formData.invoiceId) {
      setValidationMessage('Select an invoice before saving.');
      toast.error('Select an invoice before saving.');
      return;
    }
    if (scannedCount === 0) {
      setValidationMessage('Scan at least one roll before saving.');
      toast.error('Scan at least one roll before saving.');
      return;
    }
    setIsSaving(true);
    try {
      if (editModeId) {
        await dispatch(
          updateScanDispatch({ id: editModeId, formData, companyId: companyId ?? undefined })
        ).unwrap();
      } else {
        await dispatch(
          createScanDispatch({ formData, companyId: companyId ?? undefined })
        ).unwrap();
        dispatch(markInvoiceLoaded(formData.invoiceId));
      }

      // if (formData.invoiceId && typeof window !== 'undefined') {
      //   const storageKey = storageKeyForInvoice(formData.invoiceId);
      //   window.localStorage.removeItem(storageKey);
      // }

      navigate('/transaction/scan-dispatch');
    } catch (error: any) {
      const message =
        typeof error === 'string'
          ? error
          : error?.message || 'Failed to save dispatch.';
      toast.error(message);
      setValidationMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const scannedCount = formData.rolls.filter((roll) => roll.isLoadedPacking === 1).length;
  const dispatchStatus = expectedRollCount > 0 ? (scannedCount >= expectedRollCount ? 'Complete' : 'Partial') : 'Pending';
  const statusClasses = dispatchStatus === 'Complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  const availableInvoices = useMemo(() => {
    if (formData.buyerId) {
      return pendingInvoices.filter((invoice: any) => Number(invoice.customerId ?? invoice.buyerId ?? 0) === Number(formData.buyerId));
    }
    if (state?.invoiceId) {
      const matchedInvoice = pendingInvoices.find((invoice: any) => invoice.id === state.invoiceId);
      return matchedInvoice ? [matchedInvoice] : [];
    }
    return [];
  }, [formData.buyerId, pendingInvoices, state?.invoiceId]);

  const invoiceDropdownOptions = useMemo(() => {
    const allowedTypes = new Set(['domestic', 'international']);
    return availableInvoices.filter((invoice: any) => {
      const invoiceType = String(invoice.invoiceType ?? '').trim().toLowerCase();
      return invoice.salesOrderId != null && allowedTypes.has(invoiceType);
    });
  }, [availableInvoices]);

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      // 1. Remove the scanning status for the current invoice
      if (formData.invoiceId) {
        window.localStorage.removeItem(storageKeyForInvoice(formData.invoiceId));
      }
      window.localStorage.removeItem(storageKeyForInvoice(undefined));
      // 3. Clear the general form selection state (Buyer, Invoice, Fabric)
      window.localStorage.removeItem(FORM_STATE_KEY);
    }

    // 4. Navigate back to the register list
    navigate('/transaction/scan-dispatch');
  };

  return (
    <div className="p-6 pt-16">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-none">Scan & Dispatch Entry</h1>
            <p className="text-sm text-gray-500 mt-1 italic">Digital gate pass for loading verified rolls</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveDispatch}
            disabled={isSaving || !formData.invoiceId || scannedCount === 0}
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 shadow-sm"
          >
            <Save size={18} /> {isSaving ? 'Saving...' : (editModeId ? 'Update Dispatch' : 'Save Dispatch')}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Scan size={20} className="text-primary" /> Dispatch Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Buyer</label>
                <CommonSearchableSelect
                  value={formData.buyerId?.toString() ?? ''}
                  onValueChange={(value) => handleBuyerChange(Number(value))}
                  options={buyers.map(buyer => ({
                    value: String(buyer.id),
                    label: buyer.customerName || buyer.buyerName || buyer.name
                  }))}
                  placeholder="Select Buyer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Invoice No</label>
                <CommonSearchableSelect
                  value={formData.invoiceId?.toString() ?? ''}
                  onValueChange={(value) => handleInvoiceChange(Number(value))}
                  options={invoiceDropdownOptions.map((invoice: any) => ({
                    value: String(invoice.id),
                    label: invoice.invoiceNo || invoice.invoiceNumber
                  }))}
                  placeholder="Select Invoice"
                  disabled={!formData.buyerId}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Sort No – Construction</label>
                <CommonSearchableSelect
                  value={formData.fabricMasterId?.toString() ?? ''}
                  onValueChange={(value) => handleFabricChange(Number(value))}
                  options={fabricOptions.map((option) => ({
                    value: String(option.id),
                    label: option.label
                  }))}
                  placeholder={fabricOptions.length ? 'Select Sort No' : 'No fabric master found'}
                  disabled={!formData.invoiceId || !fabricOptions.length}
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Manual Barcode Entry</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualBarcodeInput}
                      onChange={(e) => setManualBarcodeInput(e.target.value)}
                      onKeyPress={handleManualBarcodeKeyPress}
                      placeholder="Enter barcode value"
                      disabled={!formData.invoiceId}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <Button
                      type="button"
                      onClick={handleManualBarcodeAdd}
                      disabled={!formData.invoiceId || !manualBarcodeInput.trim()}
                      className="shrink-0"
                    >
                      <Plus size={18} className="mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  {validationMessage && (
                    <div className={`p-3 rounded-md border text-sm animate-in fade-in slide-in-from-top-1 ${validationMessage.includes('success') || validationMessage.includes('complete')
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${validationMessage.includes('success') || validationMessage.includes('complete') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {validationMessage}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <ClipboardList size={20} className="text-primary" /> Scanned Rolls
              </CardTitle>
              <div className="text-sm font-semibold px-3 py-1 bg-white border rounded-full text-slate-600 shadow-sm">
                {formData.invoiceNo
                  ? `Tracking ${scannedCount} of ${expectedRollCount || 'N/A'} rolls`
                  : 'Select an invoice to begin scanning'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-600 border-b">
                    <th className="px-6 py-3 text-left font-semibold">S.No</th>
                    <th className="px-6 py-3 text-left font-semibold">Packing List No</th>
                    <th className="px-6 py-3 text-left font-semibold">Roll No</th>
                    <th className="px-6 py-3 text-left font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!currentInvoice ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                        Select an invoice to view rolls.
                      </td>
                    </tr>
                  ) : invoiceRollRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                        No rolls configured for this invoice yet.
                      </td>
                    </tr>
                  ) : (
                    invoiceRollRows.map((row, index) => (
                      <tr key={`${row.rollNo}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{index + 1}</td>
                        <td className="px-6 py-4 text-slate-700">{row.packingListNo}</td>
                        <td className="px-6 py-4 text-slate-700 font-mono">{row.rollNo}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${row.isScanned ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {row.isScanned ? (
                              <><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Scanned</>
                            ) : (
                              <><div className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Pending</>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <ClipboardList size={20} className="text-primary" /> Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-600 border-b">
                    <th className="px-6 py-3 text-left font-semibold">S.No</th>
                    <th className="px-6 py-3 text-left font-semibold">Packing List No</th>
                    <th className="px-6 py-3 text-center font-semibold">Rolls</th>
                    <th className="px-6 py-3 text-right font-semibold">Meters</th>
                    <th className="px-6 py-3 text-right font-semibold">Net Weight</th>
                    <th className="px-6 py-3 text-right font-semibold">Gross Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!currentInvoice ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        Select an invoice to view summary details.
                      </td>
                    </tr>
                  ) : summaryRowsFromBale.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        Summary will appear once rolls are scanned.
                      </td>
                    </tr>
                  ) : (
                    summaryRowsFromBale.map((summary, index) => (
                      <tr key={`${summary.packingListNo}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{index + 1}</td>
                        <td className="px-6 py-4 text-slate-700 font-semibold">{summary.packingListNo}</td>
                        <td className="px-6 py-4 text-center text-slate-700 font-medium">{summary.noOfRolls || '—'}</td>
                        <td className="px-6 py-4 text-right text-slate-900 font-bold">{formatNumber(summary.meters)}</td>
                        <td className="px-6 py-4 text-right text-slate-900 font-bold">{formatNumber(summary.netWeight)}</td>
                        <td className="px-6 py-4 text-right text-slate-900 font-bold">{formatNumber(summary.grossWeight)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {currentInvoice && summaryRowsFromBale.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                      <td colSpan={2} className="px-6 py-4 text-right text-slate-700">Total:</td>
                      <td className="px-6 py-4 text-center text-slate-900">
                        {summaryRowsFromBale.reduce((sum, row) => sum + (row.noOfRolls || 0), 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-primary text-lg">
                        {formatNumber(summaryRowsFromBale.reduce((sum, row) => sum + (row.meters || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-right text-primary text-lg">
                        {formatNumber(summaryRowsFromBale.reduce((sum, row) => sum + (row.netWeight || 0), 0))}
                      </td>
                      <td className="px-6 py-4 text-right text-primary text-lg">
                        {formatNumber(summaryRowsFromBale.reduce((sum, row) => sum + (row.grossWeight || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}