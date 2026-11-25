// import { useState, useEffect, useMemo, useCallback, act } from 'react';
// import { Calendar, ChevronsUpDown, FileText, DollarSign, Send, Trash2, Save, Printer, ArrowLeft, Plus } from 'lucide-react';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch, RootState } from '@/state/store';
// import { getAllSalesOrders } from '@/state/salesOrderSlice';
// import { getAllCustomers } from '@/state/customerSlice';
// import { getAllTermsConditions } from '@/state/termsConditions';
// import { getAllShipmentModes } from '@/state/shipmentModeSlice';
// import { getAllConsignee } from '@/state/consigneeSlice';
// import { getAllPaymentTerms } from '@/state/paymentTermsSlice';
// import { getAllShipmentTerms } from '@/state/shipmentTermsSlice';
// import { createInvoice, updatePaymentTerms as updateInvoice, getAllInvoices, updateInvoiceByCompanyId, getAllInvoicesByCompanyId } from '@/state/invoiceSlice';
// import { toast } from 'react-toastify';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import CommonSearchableSelect, { CommonSearchableSelectOption } from '@/components/ui/CommonSearchableSelect';
// import { getAllWarehouse } from '@/state/warehouseSlice';
// import { getAllGeneratePacking } from '@/state/generatePackingSlice';
// import { getAllUomMaster } from '@/state/uomMasterSlice';
// import { getAllCities } from '@/state/citySlice';
// import { getAllStates } from '@/state/stateSlice';
// import { getAllCountries } from '@/state/countrySlice';
// import { getCompanyById, getAllCompanies } from '@/state/company-master-slice';
// import { getAllEmployees } from '@/state/employeeSlice';
// import invoiceNumberService, { CompanyInvoiceSetting } from "@/services/InvoiceNumberService";
// import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId, getWeavingJobWorkOrderById } from "@/state/weavingJobWorkOrderSlice";
// import { getAllSizingJobWorkOrders } from "@/state/sizingJobWorkOrderSlice";
// import { getAllSizingBeamOutward } from "@/state/sizingBeamOutwardSlice";
// import { getAllSizingProductions } from "@/state/sizingProductionSlice";
// import { getAllFabricMasters } from "@/state/fabricMasterSlice";
// import { getAllYarnSalesOrders } from "@/state/yarnSalesSlice";
// import { getAllYarnChallan } from "@/state/yarnChallanSlice";
// import { getAllYarnMasters } from "@/state/yarnSlice";
// import { getAllGstMaster } from "@/state/gstMasterSlice";
// import { getAllTransports } from "@/state/transportSlice";
// import { CodesUtil } from "@/utils/codesUtil";
// import { CodesAPI } from "@/services/codes_api";
// import { CodeDetail, CodeHeader } from "@/types/codes";
// import { useAuth } from "@/contexts/AuthContext";

// interface AddDiscItem {
//   id: number;
//   description: string;
//   type: 'addition' | 'discount';
//   mode: 'percentage' | 'value';
//   percValue: number;
//   amount: number;
// }

// interface PackingLine {
//   id: string | number;
//   rollNo: string;
//   salesOrderNo: string;
//   salesOrderId?: number;
//   weavingOrderNo?: string;
//   weavingWorkOrderId?: number;
//   fabricCodeQuality: string;
//   quantity: number;
//   uom: string;
//   rate: number;
//   gstPercent: number;
//   quality?: string;
//   noOfRolls: number;
//   fabricMasterId?: number;
// }

// interface YarnChallanLine {
//   id: string;
//   challanId: number;
//   challanNo: string;
//   challanDate: string;
//   itemId: number;
//   yarnId?: number;
//   itemName: string;
//   quantity: number;
//   uom: string;
//   rate: number;
//   gstPercent: number;
//   gstPercentId?: number;
//   warehouseId?: number;
//   warehouseName?: string;
//   hsnCode?: string;
//   quantityDisplay?: string;
//   childItems?: YarnChallanLine[];
// }

// interface SizingBeamOutwardLine {
//   id: string | number;
//   sizingBeamOutwardNo: string;
//   sizingOrderId: number;
//   sizingOrderNo: string;
//   yarnName: string;
//   noOfBeams: number;
//   beamMeters: number;
//   totalEnds: number;
//   yarnId?: number;
//   rate?: number;
//   gstPercent?: number;
//   netWeight?: number;
// }

// interface InvoiceItem {
//   id: number;
//   productName: string;
//   quantity: number;
//   uom: string;
//   rate: number;
//   amount: number;
//   gstPercent: number;
//   taxableAmount: number;
//   gstAmount: number;
//   totalAmount: number;
//   isReadOnlyQuantity: boolean;
//   fabricMasterId?: number;
//   packingListNo?: string;
//   noOfRolls?: number;
//   hsnCode?: string;
//   yarnChallanId?: number;
//   yarnChallanNo?: string;
//   yarnId?: number;
//   beamMeters?: number;
//   netWeight?: number;
//   totalEnds?: number;
// }

// interface InvoiceData {
//   date: string;
//   invoiceNo: string;
//   isInvoice: number;
//   soNo: string;
//   woNo: string;
//   companyBank: string;
//   manufacturer: {
//     name: string;
//     address: string;
//   };
//   termsAndConditions: string;
//   paymentTerms: string;
//   shipTo: string;
//   shipVia: string;
//   transportName: string;
//   deliveryNote: string;
//   deliveryTerms: string;
//   vehicleNo: string;
//   lrNo: string;
//   lrDate: string;
//   buyer: {
//     name: string;
//     address: string;
//   };
//   consignee: {
//     name: string;
//     address: string;
//   };
//   items: InvoiceItem[];
//   additional: number;
//   less: number;
//   taxAmount: number;
//   comments: string;
//   roundOff: number;
//   addDiscItems: AddDiscItem[];
//   gstType: string;
// }

// interface InvoiceNumberParts {
//   segments: string[];
//   seqValue: number;
//   digits: number;
//   financialYear: string | null;
// }

// const normalizeCodeValue = (value?: string | number | null) => String(value ?? '').trim().toUpperCase();

// const getDetailKey = (detail: CodeDetail) => {
//   if (!detail) return '';
//   if (detail.id != null) {
//     return String(detail.id);
//   }
//   const code = detail.code || detail.value;
//   if (code) return normalizeCodeValue(code);
//   return '';
// };

// const getDetailLabel = (detail: CodeDetail) => detail.value || detail.code || `Code ${detail.id}`;

// const formatSequenceValue = (value: any): string => {
//   if (value === null || value === undefined) return '';
//   const str = String(value).trim();
//   if (!str) return '';
//   if (/^\d+$/.test(str)) {
//     return str.padStart(Math.max(3, str.length), '0');
//   }
//   const numeric = Number(str);
//   if (!Number.isNaN(numeric)) {
//     const normalized = Math.max(0, Math.floor(numeric));
//     const normalizedStr = String(normalized);
//     return normalizedStr.padStart(Math.max(3, normalizedStr.length), '0');
//   }
//   return str;
// };

// const buildInvoicePreview = (prefix: string, financialYear: string, sequenceNumber: string) =>
//   [prefix, financialYear, sequenceNumber]
//     .map((value) => (value || '').toString().trim())
//     .filter(Boolean)
//     .join('/');

// const normalizeCompanyInvoiceSettings = (raw: any): CompanyInvoiceSetting[] => {
//   const list = Array.isArray(raw) ? raw : [];
//   return list
//     .map((item: any) => {
//       const invoiceTypeId = Number(item?.invoiceTypeId ?? item?.invoiceType?.id ?? item?.invoice_type_id);
//       if (Number.isNaN(invoiceTypeId)) return null;
//       const prefix = String(item?.prefix ?? '').trim();
//       const financialYear = String(item?.financialYear ?? item?.financial_year ?? '').trim();
//       const sequenceNumber = formatSequenceValue(item?.sequenceNumber ?? item?.sequence_number);
//       const preview = String(item?.preview ?? '').trim();
//       return {
//         id: item?.id != null ? Number(item.id) : undefined,
//         invoiceTypeId,
//         prefix,
//         financialYear,
//         sequenceNumber,
//         preview
//       } as CompanyInvoiceSetting;
//     })
//     .filter((entry): entry is CompanyInvoiceSetting => Boolean(entry && entry.invoiceTypeId));
// };

// const isValidSelectOption = (opt: CommonSearchableSelectOption | null | undefined): opt is CommonSearchableSelectOption =>
//   Boolean(opt && opt.label);

// const TRADE_TYPE_GROUP_KEY = 'TRADE_TYPE';
// const TRADE_TYPE_HEADER_ID = 2;
// const ALLOWED_INVOICE_CODES = new Set(['DOMESTIC', 'EXPORT', 'WEAVING JOBWORK', 'SIZING SALES', 'YARN SALES']);
// const ALLOWED_INVOICE_IDS = new Set([201, 202, 203,204,205]);
// const CODES_STORAGE_KEY = 'codes_header';

// const normalizeHeadersResponse = (raw: any): CodeHeader[] => {
//   if (Array.isArray(raw)) return raw;
//   if (raw?.data && Array.isArray(raw.data)) return raw.data;
//   if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
//   return [];
// };

// const cacheHeadersToStorage = (headers: CodeHeader[]) => {
//   if (!Array.isArray(headers) || !headers.length) return;
//   try {
//     localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(headers));
//   } catch (error) {
//     console.warn('Failed to cache codes headers', error);
//   }
// };

// const readHeadersFromStorage = (): CodeHeader[] => {
//   try {
//     const stored = localStorage.getItem(CODES_STORAGE_KEY);
//     if (stored) {
//       const parsed = JSON.parse(stored);
//       return normalizeHeadersResponse(parsed);
//     }
//   } catch (error) {
//     console.error('Failed to parse codes header from storage:', error);
//   }
//   return [];
// };

// const extractInvoiceTypeDetails = (headers: CodeHeader[]): CodeDetail[] => {
//   if (!Array.isArray(headers)) return [];
//   const tradeHeader = headers.find((h: any) => normalizeCodeValue(h?.code_group ?? h?.codeGroup) === TRADE_TYPE_GROUP_KEY)
//     || headers.find((h: any) => Number(h?.id) === TRADE_TYPE_HEADER_ID);
//   if (!tradeHeader || !Array.isArray(tradeHeader.details)) return [];
//   return tradeHeader.details.filter((detail: CodeDetail) => {
//     const codeValue = normalizeCodeValue(detail.code || detail.value);
//     const id = Number(detail.id);
//     return ALLOWED_INVOICE_CODES.has(codeValue) || ALLOWED_INVOICE_IDS.has(id);
//   });
// };

// const normalizeKeyValues = (values: any[]): string[] => values
//   .map((value) => {
//     if (value === null || value === undefined || value === '') return null;
//     return String(value);
//   })
//   .filter((value): value is string => Boolean(value));

// const INVOICE_TYPE_PREFIX_MAP: Record<string, string> = {
//   DOMESTIC: 'DOM',
//   EXPORT: 'EXP',
//   'WEAVING JOBWORK': 'WJO',
//   'SIZING SALES': 'SS',
//   'YARN SALES': 'YS',
//   '201': 'DOM',
//   '202': 'EXP',
//   '203': 'WJO',
//   '204': 'SS',
//   '205': 'YS'
// };

// const KNOWN_INVOICE_PREFIXES = Array.from(new Set(Object.values(INVOICE_TYPE_PREFIX_MAP)));

// const getInvoicePrefixFromDetail = (detail?: CodeDetail | null): string => {
//   if (!detail) return '';
//   const codeKey = normalizeCodeValue(detail.code || detail.value);
//   if (codeKey && INVOICE_TYPE_PREFIX_MAP[codeKey]) {
//     return INVOICE_TYPE_PREFIX_MAP[codeKey];
//   }
//   if (detail.id != null) {
//     const idKey = String(detail.id);
//     if (INVOICE_TYPE_PREFIX_MAP[idKey]) {
//       return INVOICE_TYPE_PREFIX_MAP[idKey];
//     }
//   }
//   return '';
// };

// const stripExistingInvoicePrefix = (value: string): string => {
//   if (!value) return value;
//   for (const prefix of KNOWN_INVOICE_PREFIXES) {
//     const token = `${prefix}/`;
//     if (value.startsWith(token)) {
//       return value.slice(token.length);
//     }
//   }
//   return value;
// };

// const normalizeComparableText = (value: any) => {
//   if (value === undefined || value === null) return '';
//   return String(value).trim().toLowerCase();
// };

// const getInvoiceItemKey = (item?: InvoiceItem) => {
//   if (!item) return '';
//   const yarnKey = item.yarnChallanId && Number(item.yarnChallanId) > 0 ? `yarn-${item.yarnChallanId}` : '';
//   if (yarnKey) return yarnKey;
//   if (item.packingListNo) {
//     const normalized = normalizeComparableText(item.packingListNo);
//     if (normalized) {
//       return `packing-${normalized}`;
//     }
//   }
//   if (item.productName) {
//     const normalized = normalizeComparableText(item.productName);
//     if (normalized) {
//       return `product-${normalized}`;
//     }
//   }
//   if (item.hsnCode) {
//     return `hsn-${item.hsnCode}`;
//   }
//   return `item-${item.id}`;
// };

// const mergeInvoiceItems = (existing: InvoiceItem[], additions: InvoiceItem[]) => {
//   const merged = [...existing];
//   const keyIndex = (candidate: InvoiceItem) => getInvoiceItemKey(candidate);
//   additions.forEach((addition) => {
//     const key = getInvoiceItemKey(addition);
//     if (!key) {
//       merged.push(addition);
//       return;
//     }
//     const duplicateIndex = merged.findIndex((current) => keyIndex(current) === key);
//     if (duplicateIndex >= 0) {
//       const preservedId = merged[duplicateIndex].id;
//       merged[duplicateIndex] = { ...addition, id: preservedId };
//     } else {
//       merged.push(addition);
//     }
//   });
//   return merged;
// };

// const roundToTwoDecimals = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

// const computeItemAmounts = (quantity: number, rate: number, gstPercent: number) => {
//   const normalizedQuantity = Number(quantity) || 0;
//   const normalizedRate = Number(rate) || 0;
//   const normalizedGstPercent = Number(gstPercent) || 0;
//   const taxableAmount = roundToTwoDecimals(normalizedQuantity * normalizedRate);
//   const gstAmount = roundToTwoDecimals(taxableAmount * (normalizedGstPercent / 100));
//   const totalAmount = roundToTwoDecimals(taxableAmount + gstAmount);
//   return {
//     taxableAmount,
//     gstAmount,
//     totalAmount,
//     amount: totalAmount,
//   };
// };

// const formatToTwoDecimalLocale = (value: number) =>
//   (Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const normalizePackingSelectionId = (id: string | number | null | undefined) => {
//   if (id === undefined || id === null) return '';
//   return String(id);
// };

// const resolvePackingLineId = (packing: any, index: number): string => {
//   const candidates = [
//     packing?.id,
//     packing?.packingSlipId,
//     packing?.packingSlipNo,
//     packing?.rollNo,
//     packing?.lineId,
//     packing?.packingLineId,
//     packing?.packingId,
//     packing?.salesOrderLineId,
//     packing?.weavingWorkOrderLineId,
//     packing?.yarnSalesOrderLineId,
//     packing?.yarnChallanId,
//     packing?.yarnChallanNo,
//     packing?.salesOrderId && packing?.fabricCode ? `${packing.salesOrderId}-${packing.fabricCode}` : null,
//     packing?.weavingWorkOrderId && packing?.fabricCode ? `${packing.weavingWorkOrderId}-${packing.fabricCode}` : null,
//     packing?.yarnSalesOrderId && packing?.itemName ? `${packing.yarnSalesOrderId}-${packing.itemName}` : null,
//   ];
//   for (const candidate of candidates) {
//     const normalized = normalizePackingSelectionId(candidate as any);
//     if (normalized) {
//       return normalized;
//     }
//   }
//   return `packing-${index}`;
// };

// const parseFabricCodeQualityParts = (value: string) => {
//   if (!value) {
//     return { fabricCode: '', quality: '' };
//   }
//   const segments = value.split(' - ');
//   const fabricCode = segments[0]?.trim() || '';
//   const quality = segments.slice(1).join(' - ').trim() || '';
//   return { fabricCode, quality };
// };

// const extractPackingPieces = (packing: any) => {
//   if (!packing) return [];
//   const candidates = [
//     packing.items,
//     packing.packingItems,
//     packing.packingDetails,
//     packing.rollPieces,
//     packing.pieces,
//     packing.rolls,
//     packing.rollDetails
//   ];
//   for (const candidate of candidates) {
//     if (Array.isArray(candidate) && candidate.length) {
//       return candidate;
//     }
//   }
//   return [];
// };

// const derivePackingRollCount = (packing: any, fabricCodeQuality: string) => {
//   const { fabricCode, quality } = parseFabricCodeQualityParts(fabricCodeQuality);
//   const normalizedFabricCode = normalizeComparableText(packing?.fabricCode || fabricCode);
//   const normalizedQuality = normalizeComparableText(packing?.quality || packing?.fabricQuality || quality);
//   const normalizedRollNo = normalizeComparableText(packing?.packingSlipNo || packing?.rollNo);
//   const pieces = extractPackingPieces(packing);
//   if (pieces.length) {
//     const matchedPieces = pieces.filter((piece: any) => {
//       const pieceFabricCode = normalizeComparableText(piece?.fabricCode || piece?.fabric_code || piece?.fabricCodeQuality?.split(' - ')[0]);
//       const pieceQuality = normalizeComparableText(
//         piece?.quality ||
//         piece?.fabricQuality ||
//         piece?.fabricQualityName ||
//         (piece?.fabricCodeQuality ? piece?.fabricCodeQuality.split(' - ').slice(1).join(' - ') : '')
//       );
//       const pieceRollNo = normalizeComparableText(piece?.rollNo || piece?.roll_no || piece?.rollNumber);
//       const fabricMatches = normalizedFabricCode ? pieceFabricCode === normalizedFabricCode : true;
//       const qualityMatches = normalizedQuality ? pieceQuality === normalizedQuality : true;
//       const rollMatches = normalizedRollNo ? pieceRollNo === normalizedRollNo : true;
//       return fabricMatches && qualityMatches && rollMatches;
//     });
//     const count = matchedPieces.length || pieces.length;
//     if (count > 0) {
//       return count;
//     }
//   }
//   const fallbackSources = [
//     packing?.noOfRolls,
//     packing?.numberOfRolls,
//     packing?.noOfPieces,
//     packing?.totalPieces
//   ];
//   for (const source of fallbackSources) {
//     if (source === undefined || source === null || source === '') continue;
//     const numeric = Number(source);
//     if (!Number.isNaN(numeric) && numeric > 0) {
//       return numeric;
//     }
//   }
//   return 0;
// };

// const resolveSalesOrderTypeId = (packing: any, order?: any) => {
//   const candidates = [
//     order?.orderTypeId,
//     order?.orderType,
//     packing?.orderTypeId,
//     packing?.orderType,
//     packing?.orderType?.id,
//     packing?.salesOrder?.orderTypeId,
//     packing?.salesOrder?.orderType
//   ];
//   for (const candidate of candidates) {
//     if (candidate === undefined || candidate === null || candidate === '') continue;
//     const numeric = Number(candidate);
//     if (!Number.isNaN(numeric)) {
//       return numeric;
//     }
//   }
//   return null;
// };

// const ENTITY_UOM_STRING_GETTERS: Array<(entry: any) => any> = [
//   (entry) => entry?.uom,
//   (entry) => entry?.uomName,
//   (entry) => entry?.uom?.uomName,
//   (entry) => entry?.uom?.name,
//   (entry) => entry?.uomMaster?.uomName,
//   (entry) => entry?.uomMaster?.name,
//   (entry) => entry?.orderUom?.uomName,
//   (entry) => entry?.orderUom?.name,
//   (entry) => entry?.unitOfMeasurement?.uomName,
//   (entry) => entry?.unitOfMeasurement?.name,
//   (entry) => entry?.fabric?.uom?.uomName,
//   (entry) => entry?.fabric?.uom?.name
// ];

// const ENTITY_UOM_ID_GETTERS: Array<(entry: any) => any> = [
//   (entry) => entry?.uomId,
//   (entry) => entry?.uom_id,
//   (entry) => entry?.uomMasterId,
//   (entry) => entry?.uom_master_id,
//   (entry) => entry?.uomMaster?.id,
//   (entry) => entry?.orderUomId,
//   (entry) => entry?.orderUom?.id,
//   (entry) => entry?.unitOfMeasurementId,
//   (entry) => entry?.unitOfMeasurement?.id,
//   (entry) => entry?.fabric?.uomId,
//   (entry) => entry?.fabric?.uom?.id,
//   (entry) => entry?.fabricMaster?.uomId,
//   (entry) => entry?.fabricMasterId
// ];

// const gatherUomCandidates = (entry: any) => {
//   if (!entry) return [];
//   const sources = [entry];
//   const lists = [
//     entry?.items,
//     entry?.orderItems,
//     entry?.soItems,
//     entry?.packingItems,
//     entry?.packingDetails,
//     entry?.jobWorkOrderDetails,
//     entry?.packings,
//     entry?.pieces
//   ];
//   for (const list of lists) {
//     if (Array.isArray(list)) {
//       sources.push(...list);
//     }
//   }
//   return sources;
// };

// const resolveEntityUomName = (entry: any, uoms: any[]): string | null => {
//   const normalizedList = Array.isArray(uoms) ? uoms : [];
//   const candidates = gatherUomCandidates(entry);
//   for (const candidate of candidates) {
//     if (!candidate) continue;
//     for (const getter of ENTITY_UOM_STRING_GETTERS) {
//       const value = getter(candidate);
//       if (value != null && value !== '') {
//         const normalized = String(value).trim();
//         if (normalized) {
//           return normalized;
//         }
//       }
//     }
//     for (const getter of ENTITY_UOM_ID_GETTERS) {
//       const idValue = getter(candidate);
//       if (idValue == null || idValue === '') continue;
//       const match = normalizedList.find((u: any) => String(u.id) === String(idValue));
//       if (match) {
//         const resolvedName = match.uomName || match.name;
//         if (resolvedName) {
//           return String(resolvedName).trim();
//         }
//       }
//     }
//   }
//   return null;
// };

// const resolvePositiveNumber = (value: any) => {
//   const numeric = Number(value);
//   return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
// };

// const resolveWarehouseIdFromEntry = (entry: any): string | null => {
//   if (!entry) return null;
//   const candidate = entry?.warehouseId ?? entry?.warehouse_id ?? entry?.warehouse?.id ?? entry?.warehouse?.warehouseId;
//   const resolved = resolvePositiveNumber(candidate);
//   return resolved ? String(resolved) : null;
// };

// const deriveWarehouseIdFromPackings = (packings: any[] = []): string | null => {
//   for (const packing of packings) {
//     const warehouseId = resolveWarehouseIdFromEntry(packing);
//     if (warehouseId) {
//       return warehouseId;
//     }
//   }
//   return null;
// };

// export default function GenerateInvoice() {
//   const dispatch = useDispatch<AppDispatch>();
//   const location = useLocation();
//   const invoiceDetail = location.state?.invoice;
//   const tabNameFromState = location.state?.tabName;
//   const invoiceDetailTabName = invoiceDetail?.tabName;
//   const invoiceDetailInvoiceNo = invoiceDetail?.invoiceNo || '';
//   const isEditMode = Boolean(invoiceDetail?.id);

//   const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
//   const { customerList } = useSelector((state: RootState) => state.customer);
//   const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
//   const { shipmentModesList } = useSelector((state: RootState) => state.shipmentMode);
//   const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
//   const { shipmentTermsList } = useSelector((state: RootState) => state.shipmentTerms);
//   const { consigneeList } = useSelector((state: RootState) => state.consignee);
//   const { warehouseList } = useSelector((state: RootState) => state.warehouse);
//   const { generatePackingList } = useSelector((state: RootState) => state.generatePacking);
//   const { uomList } = useSelector((state: RootState) => state.uom);
//   const { cityList } = useSelector((state: RootState) => state.city);
//   const { stateList } = useSelector((state: RootState) => state.state);
//   const { countryList } = useSelector((state: RootState) => state.country);
//   const { loading, error, invoiceList } = useSelector((state: RootState) => state.invoice);
//   const { employeeList } = useSelector((state: RootState) => state.employee);
//   const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
//   const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
//   const { sizingBeamOutwardList } = useSelector((state: RootState) => state.sizingBeamOutward as any);
//   const { sizingProductionList } = useSelector((state: RootState) => state.sizingProduction as any);
//   const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
//   const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
//   const { yarnSalesOrderList } = useSelector((state: RootState) => state.yarnSales as any);
//   const { yarnChallanList } = useSelector((state: RootState) => state.yarnChallan as any);
//   const { yarnList: yarnMasterList } = useSelector((state: RootState) => state.yarn as any);
//   const { gstList } = useSelector((state: RootState) => state.gst as any);
//   const { transportList } :any = useSelector((state: RootState) => state.transport);

//   const normalizedWarehouseList = useMemo(() => {
//     const raw = (warehouseList?.data ?? warehouseList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [warehouseList]);

//   const normalizedUoms = useMemo(() => {
//     return Array.isArray(uomList) ? uomList : [];
//   }, [uomList]);

//   const uomMap = useMemo(() => {
//     const map = new Map<string, string>();
//     normalizedUoms.forEach((u: any) => {
//       const keyCandidates = normalizeKeyValues([u?.id, u?.uomId]);
//       const key = keyCandidates[0];
//       if (!key) return;
//       const name = String(u?.uomName || u?.name || u?.label || u?.code || '').trim();
//       if (name) {
//         map.set(key, name);
//       }
//     });
//     return map;
//   }, [normalizedUoms]);

//   const { user, selectedCompany: authSelectedCompany } = useAuth();

//   const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('');
//   const [isFormValid, setIsFormValid] = useState<boolean>(false);
//   const [showPackingModal, setShowPackingModal] = useState(false);
//   const [packingLines, setPackingLines] = useState<PackingLine[]>([]);
//   const [selectedPackingIds, setSelectedPackingIds] = useState<string[]>([]);
//   const [addDiscItems, setAddDiscItems] = useState<AddDiscItem[]>([]);
//   const [addDiscDrafts, setAddDiscDrafts] = useState<AddDiscItem[]>([]);
//   const [roundOff, setRoundOff] = useState(0);
//   const [isRoundOffLocked, setIsRoundOffLocked] = useState(() => Boolean(invoiceDetail));
//   const [buyerStateCode, setBuyerStateCode] = useState<string>('');
//   const [companyStateCode, setCompanyStateCode] = useState<string>('');
//   const [descSuggestForId, setDescSuggestForId] = useState<number | null>(null);
//   const [descActiveSuggestionIndex, setDescActiveSuggestionIndex] = useState<number>(-1);
//   const [invoiceTypeOptions, setInvoiceTypeOptions] = useState<CodeDetail[]>([]);
//   const [selectedInvoiceTypeId, setSelectedInvoiceTypeId] = useState<string>('');
//   const [hasUserAdjustedInvoiceType, setHasUserAdjustedInvoiceType] = useState(false);
//   const [selectedWeavingWorkOrderId, setSelectedWeavingWorkOrderId] = useState<string>('');
//   const [selectedWeavingOrder, setSelectedWeavingOrder] = useState<any>(null);
//   const [selectedYarnSalesOrderId, setSelectedYarnSalesOrderId] = useState<string>('');
//   const [selectedSizingWorkOrderId, setSelectedSizingWorkOrderId] = useState<string>('');
//   const [selectedSizingWorkOrder, setSelectedSizingWorkOrder] = useState<any>(null);
//   const [activeGstPercentId, setActiveGstPercentId] = useState<string>('');
//   console.log('Invoice Detail from location state:', invoiceDetail);
//   const navigate = useNavigate();

//   const [companyInfo, setCompanyInfo] = useState<any>(null);
//   const [companyBanks, setCompanyBanks] = useState<any[]>([]);
//   const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(() => {
//     try {
//       const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//       if (!stored) return null;
//       const parsed = Number(stored);
//       return Number.isNaN(parsed) ? null : parsed;
//     } catch {
//       return null;
//     }
//   });
//   const [companyInvoiceSettings, setCompanyInvoiceSettings] = useState<CompanyInvoiceSetting[]>([]);
//   const [cgstPerc, setCgstPerc] = useState<number>(0);
//   const [sgstPerc, setSgstPerc] = useState<number>(0);
//   const [igstPerc, setIgstPerc] = useState<number>(0);
//   const [gstPerc, setGstPerc] = useState<number>(0);

//   const loggedInCompanyId = useMemo(() => {
//     if (authSelectedCompany != null) {
//       const numeric = Number(authSelectedCompany);
//       if (!Number.isNaN(numeric)) {
//         return numeric;
//       }
//     }
//     if (user?.selectedCompany?.id != null) {
//       const numeric = Number(user.selectedCompany.id);
//       if (!Number.isNaN(numeric)) {
//         return numeric;
//       }
//     }
//     if (user?.companyId != null) {
//       const numeric = Number(user.companyId);
//       if (!Number.isNaN(numeric)) {
//         return numeric;
//       }
//     }
//     return null;
//   }, [authSelectedCompany, user]);

//   useEffect(() => {
//     if (loggedInCompanyId == null) {
//       return;
//     }
//     if (selectedCompanyId === loggedInCompanyId) {
//       return;
//     }
//     setSelectedCompanyId(loggedInCompanyId);
//   }, [loggedInCompanyId, selectedCompanyId]);

//   useEffect(() => {
//     if (selectedCompanyId == null) {
//       return;
//     }
//     try {
//       localStorage.setItem('selectedCompanyId', String(selectedCompanyId));
//       localStorage.setItem('selectedCompany', String(selectedCompanyId));
//     } catch {
//     }
//   }, [selectedCompanyId]);

//   const [invoiceData, setInvoiceData] = useState<InvoiceData>({
//     date: new Date().toISOString().split('T')[0],
//     invoiceNo: '',
//     isInvoice: 0,
//     soNo: '',
//     woNo:'',
//     companyBank: '',
//     manufacturer: {
//       name: '',
//       address: ''
//     },
//     termsAndConditions: '',
//     paymentTerms: 'Net 60 Days',
//     shipTo: '',
//     shipVia: '',
//     transportName: '',
//     deliveryNote: '',
//     deliveryTerms: '',
//     vehicleNo: '',
//     lrNo: '',
//     lrDate: '',
//     buyer: {
//       name: '',
//       address: ''
//     },
//     consignee: {
//       name: '',
//       address: ''
//     },
//     items: [],
//     additional: 0,
//     less: 0,
//     taxAmount: 0,
//     comments: '',
//     roundOff: 0,
//     addDiscItems: [],
//     gstType: '',
//   });

//   const resetFormForOrderChange = useCallback(() => {
//     setInvoiceData(prev => ({
//       ...prev,
//       items: [],
//       additional: 0,
//       less: 0,
//       taxAmount: 0,
//       comments: '',
//       roundOff: 0,
//       transportName: '',
//       deliveryNote: '',
//       deliveryTerms: '',
//       vehicleNo: '',
//       lrNo: '',
//       lrDate: '',
//     }));
//     setAddDiscItems([]);
//     setAddDiscDrafts([]);
//     setSelectedPackingIds([]);
//     setPackingLines([]);
//     setSelectedValues(prev => ({
//       ...prev,
//       customerId: '',
//       consgineeId: '',
//       shipmentTermsId: '',
//       transportId: '',
//     }));
//     setHasManualWarehouseSelection(false);
//     setRoundOff(0);
//   }, [setInvoiceData, setAddDiscItems, setAddDiscDrafts, setSelectedPackingIds, setPackingLines, setRoundOff]);

//   const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);

//   const existingDescNames = useMemo(() => {
//     const fromInvoices = Array.isArray(invoiceList)
//       ? (invoiceList as any[]).flatMap((inv: any) => [
//           ...((inv?.addDiscItems || []) as any[]),
//           ...((inv?.addDiscDrafts || []) as any[]),
//         ]).map((i: any) => i?.description).filter((s: any) => !!s)
//       : [];
//     const local = [...addDiscItems, ...addDiscDrafts].map(i => i.description).filter(Boolean);
//     return Array.from(new Set([...fromInvoices, ...local].map((s: any) => String(s))));
//   }, [invoiceList, addDiscItems, addDiscDrafts]);

//   const getFilteredDescSuggestions = (q: string) => {
//     const lower = (q || '').toLowerCase();
//     if (!lower) return [] as string[];
//     return existingDescNames.filter((n: string) => (n || '').toLowerCase().includes(lower)).slice(0, 8);
//   };

//   const handleDescKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: number) => {
//     if (descSuggestForId !== itemId) return;
//     const cur = (addDiscDrafts.find(d => d.id === itemId)?.description || '') as string;
//     const list = getFilteredDescSuggestions(cur);
//     if (!list.length) return;
//     switch (e.key) {
//       case 'ArrowDown':
//         e.preventDefault();
//         setDescActiveSuggestionIndex(prev => (prev < list.length - 1 ? prev + 1 : 0));
//         break;
//       case 'ArrowUp':
//         e.preventDefault();
//         setDescActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : list.length - 1));
//         break;
//       case 'Enter':
//         if (descActiveSuggestionIndex >= 0) {
//           e.preventDefault();
//           const val = list[descActiveSuggestionIndex];
//           handleAddDiscDraftChange(itemId, 'description', val);
//           setDescSuggestForId(null);
//           setDescActiveSuggestionIndex(-1);
//         }
//         break;
//       case 'Escape':
//         setDescSuggestForId(null);
//         setDescActiveSuggestionIndex(-1);
//         break;
//     }
//   };
//   const totalAmount = subtotal + invoiceData.additional - invoiceData.less + invoiceData.taxAmount;
//   const actionButtonLabel = loading
//     ? (isEditMode ? 'Updating...' : 'Sending...')
//     : (isEditMode ? 'Update Invoice' : 'Save Invoice');

//   const [selectedValues, setSelectedValues] = useState({
//     manufactureId: 1,
//     companyBankId: '',
//     termsConditionsId: '',
//     paymentTermsId: '',
//     shipToId: '',
//     shipmentMode: '',
//     customerId: '',
//     consgineeId: '',
//     warehouseId: '',
//     shipmentTermsId: '',
//     agentId: '',
//     gstType: '',
//     transportId: ''
//   });
//   const [hasManualWarehouseSelection, setHasManualWarehouseSelection] = useState(false);
//   const selectedCompanyBankId = selectedValues.companyBankId;

//   useEffect(() => {
//     let isMounted = true;

//     const loadInvoiceTypes = async () => {
//       let headers: CodeHeader[] = readHeadersFromStorage();

//       if (!headers.length) {
//         const cachedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
//         if (cachedHeaders.length) {
//           headers = cachedHeaders;
//         }
//       }

//       if (!headers.length) {
//         try {
//           await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
//           const loadedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
//           if (loadedHeaders.length) {
//             headers = loadedHeaders;
//           }
//         } catch (error) {
//           console.error("codes header preload failed", error);
//         }
//       }

//       if (!headers.length) {
//         try {
//           const apiHeaders = await CodesAPI.getCodesHeader();
//           headers = normalizeHeadersResponse(apiHeaders);
//         } catch (error) {
//           console.error("Failed to load invoice types", error);
//         }
//       }

//       if (headers.length) {
//         cacheHeadersToStorage(headers);
//       }

//       if (!isMounted) return;
//       setInvoiceTypeOptions(extractInvoiceTypeDetails(headers));
//     };

//     loadInvoiceTypes();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   useEffect(() => {
//      const companyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
//     dispatch(getAllSalesOrders({fetchAll: true}));
//     dispatch(getAllCustomers({fetchAll: true}));
//     dispatch(getAllTermsConditions({fetchAll: true}));
//     dispatch(getAllShipmentModes({fetchAll: true}));
//     dispatch(getAllShipmentTerms({fetchAll: true}));
//     dispatch(getAllConsignee({fetchAll: true}));
//     dispatch(getAllPaymentTerms({fetchAll: true}));
//     dispatch(getAllInvoices({fetchAll: true}));
//     // dispatch(getAllInvoicesByCompanyId({companyId} as any));
//     dispatch(getAllWarehouse({ fetchAll: true }));
//     dispatch(getAllGeneratePacking({fetchAll: true}));
//     dispatch(getAllUomMaster({fetchAll: true}));
//     dispatch(getAllCities({fetchAll: true}));
//     dispatch(getAllStates({fetchAll: true}));
//     dispatch(getAllCountries({fetchAll: true}));

//     dispatch(getAllEmployees({fetchAll: true}) as any);
//     dispatch(getAllFabricMasters({fetchAll: true}) as any);
//     dispatch(getAllCompanies({fetchAll: true}) as any);
//     dispatch(getAllYarnSalesOrders({fetchAll: true}) as any);
//     dispatch(getAllYarnChallan({fetchAll: true}) as any);
//     dispatch(getAllYarnMasters({ fetchAll: true }) as any);
//     dispatch(getAllGstMaster({ fetchAll: true }) as any);
//     dispatch(getAllSizingJobWorkOrders({fetchAll: true}) as any);
//     dispatch(getAllSizingBeamOutward({fetchAll: true}) as any);
//     dispatch(getAllSizingProductions({ fetchAll: true }) as any);
//     dispatch(getAllTransports({ fetchAll: true }));
//   }, [dispatch]);

//   useEffect(() => {
//     setCompanyInvoiceSettings([]);
//     if (!selectedCompanyId) {
//       setCompanyInfo(null);
//       setCompanyBanks([]);
//       setCompanyStateCode('');
//       // dispatch(getAllWeavingJobWorkOrders({}) as any);
//       dispatch(getAllYarnSalesOrders({fetchAll: true}) as any);
//       dispatch(getAllYarnChallan({fetchAll: true}) as any);
//       return;
//     }
//   dispatch(getAllWeavingJobWorkOrders({fetchAll: true}) as any);
//   dispatch(getAllSizingJobWorkOrders({ companyId: selectedCompanyId, fetchAll: true }) as any);
//   dispatch(getAllSizingBeamOutward({ companyId: selectedCompanyId, fetchAll: true }) as any);
//   dispatch(getAllSizingProductions({ companyId: selectedCompanyId, fetchAll: true }) as any);
//     // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(selectedCompanyId) as any);
//     dispatch(getAllYarnSalesOrders({ companyId: selectedCompanyId, fetchAll: true }) as any);
//     dispatch(getAllYarnChallan({ companyId: selectedCompanyId, fetchAll: true }) as any);

//     dispatch(getCompanyById({ id: selectedCompanyId }))
//       .unwrap?.()
//       .then((res: any) => {
//         const companyData = res?.data || res;
//         setCompanyInfo(companyData);
//         const addressArr = companyData?.address || companyData?.data?.address || [];
//         const defaultAddr = Array.isArray(addressArr)
//           ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
//           : null;
//         const code = defaultAddr?.stateCode || '';
//         setCompanyStateCode(code);
//         const banks = companyData?.bank || companyData?.data?.bank || [];
//         const normalizedBanks = Array.isArray(banks) ? banks : [];
//         setCompanyBanks(normalizedBanks);
//         if (!selectedCompanyBankId && normalizedBanks.length > 0) {
//           setSelectedValues(prev => ({ ...prev, companyBankId: String(normalizedBanks[0].id) }));
//         }
//       })
//       .catch(() => {});
//   }, [dispatch, selectedCompanyId, selectedCompanyBankId]);

//   useEffect(() => {
//     if (!companyInfo) return;
//     const companyData = companyInfo;
//     const addressArr = companyData?.address || companyData?.data?.address || [];
//     const defaultAddr = Array.isArray(addressArr)
//       ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
//       : null;
//     const stateName = defaultAddr?.stateId ? getStateName(String(defaultAddr.stateId), stateList) : '';
//     const parts: string[] = [];
//     if (defaultAddr?.line1) parts.push(String(defaultAddr.line1));
//     if (stateName) parts.push(stateName);
//     if (defaultAddr?.pinCode) parts.push(`\n PIN: ${defaultAddr.pinCode}`);
//     const gstNo = companyData?.gstNo || companyData?.data?.gstNo || '';
//     if (gstNo) parts.push(`\n GST: ${gstNo}`);
//     const name = companyData?.companyName || companyData?.data?.companyName || '';
//     setInvoiceData(prev => ({
//       ...prev,
//       manufacturer: {
//         name: name,
//         address: parts.join(', ')
//       }
//     }));
//   }, [companyInfo, stateList]);

//   const normalizeArray = (source: any): any[] => {
//     if (Array.isArray(source)) return source;
//     if (Array.isArray(source?.data)) return source.data;
//     if (Array.isArray(source?.data?.data)) return source.data.data;
//     return [];
//   };

//   const normalizedPackingList = useMemo(() => {
//     if (Array.isArray(generatePackingList)) return generatePackingList;
//     if (Array.isArray(generatePackingList?.data)) return generatePackingList.data;
//     if (Array.isArray(generatePackingList?.data?.data)) return generatePackingList.data.data;
//     if (generatePackingList?.data && typeof generatePackingList.data === 'object') {
//       const data = generatePackingList.data;
//       if (Array.isArray(data.items)) return data.items;
//       if (Array.isArray(data.packingList)) return data.packingList;
//       if (Array.isArray(data.result)) return data.result;
//     }
//     return [];
//   }, [generatePackingList]);

//   const resolveSalesOrderNo = useCallback((salesOrderId: number): string => {
//     if (!salesOrderId) return '';
//     const list = normalizeArray(salesOrderList);
//     const so = list.find((s: any) => String(s?.id) === String(salesOrderId) || String(s?.data?.id) === String(salesOrderId));
//     if (so) {
//       return so?.salesOrderNo || so?.orderNo || so?.data?.salesOrderNo || '';
//     }
//     // Fallback to invoiceDetail if it matches
//     if (invoiceDetail?.salesOrderId === salesOrderId && invoiceDetail.soNo) {
//       return invoiceDetail.soNo;
//     }
//     return '';
//   }, [salesOrderList, invoiceDetail]);

//   const resolveWeavingOrderNo = useCallback((weavingOrderId: number): string => {
//     if (!weavingOrderId) return '';
//     const packingMatch = (normalizedPackingList || []).find((entry: any) => {
//       if (!entry) return false;
//       const entryWoId = Number(entry?.weavingWorkOrderId);
//       if (Number.isNaN(entryWoId) || entryWoId !== weavingOrderId) return false;
//       return Boolean(entry?.weavingWorkOrderNo || entry?.weavingOrderNo || entry?.orderNo);
//     });
//     if (packingMatch) {
//       return packingMatch.weavingWorkOrderNo || packingMatch.weavingOrderNo || packingMatch.orderNo || '';
//     }
//     const list = normalizeArray(weavingJobWorkOrderList);
//     const wo = list.find((w: any) => String(w?.id) === String(weavingOrderId));
//     if (wo) {
//       return wo?.weavingWorkOrderNo || wo?.weavingOrderNo || wo?.orderNo || '';
//     }
//     if (invoiceDetail?.weavingWorkOrderId === weavingOrderId && invoiceDetail.woNo) {
//       return invoiceDetail.woNo;
//     }
//     return '';
//   }, [weavingJobWorkOrderList, invoiceDetail, normalizedPackingList]);

//   const resolveYarnSalesOrderNo = useCallback((yarnSalesOrderId: number): string => {
//     if (!yarnSalesOrderId) return '';
//     const list = normalizeArray(yarnSalesOrderList);
//     const order = list.find((entry: any) => String(entry?.id) === String(yarnSalesOrderId));
//     return order?.yarnSalesNo || order?.orderNo || order?.salesOrderNo || '';
//   }, [yarnSalesOrderList]);

//   const getCityName = (cityId: string, list: any[]) => {
//     if (!cityId || !list || list.length === 0) return '';
//     const city = list.find((c: any) => c.id?.toString() === cityId?.toString() || c.id === parseInt(cityId));
//     return city ? city.cityName : '';
//   };

//   const getStateName = (stateId: string, list: any[]) => {
//     if (!stateId || !list || list.length === 0) return '';
//     const state = list.find((s: any) => s.id?.toString() === stateId?.toString() || s.id === parseInt(stateId));
//     return state ? state.stateName : '';
//   };

//   const getCountryName = (countryId: string, list: any[]) => {
//     if (!countryId || !list || list.length === 0) return '';
//     const country = list.find((c: any) => c.id?.toString() === countryId?.toString() || c.id === parseInt(countryId));
//     return country ? country.countryName : '';
//   };

//   const formatCompleteAddress = (address: any, cities: any[], states: any[], countries: any[]) => {
//     if (!address) return '';
//     const parts: string[] = [];
//     if (address.line1 && String(address.line1).trim()) parts.push(String(address.line1).trim());
//     if (address.line2 && String(address.line2).trim()) parts.push(String(address.line2).trim());
//     const cityName = getCityName(address.cityId, cities);
//     const stateName = getStateName(address.stateId, states);
//     const countryName = getCountryName(address.countryId, countries);
//     const loc: string[] = [];
//     if (cityName) loc.push(cityName);
//     if (stateName) loc.push(stateName);
//     if (countryName) loc.push(countryName);
//     if (loc.length > 0) parts.push(loc.join(', '));
//     if (address.pinCode) {
//       const pin = String(address.pinCode).trim();
//       if (pin) parts.push(`PIN: ${pin}`);
//     }
//     return parts.join(', ');
//   };

//   const formatAddressMultiline = (address: any, cities: any[], states: any[], countries: any[]) => {
//     if (!address) return '';
//     const lineParts: string[] = [];
//     if (address.line1 && String(address.line1).trim()) lineParts.push(String(address.line1).trim());
//     if (address.line2 && String(address.line2).trim()) lineParts.push(String(address.line2).trim());
//     const cityName = getCityName(address.cityId, cities);
//     const stateName = getStateName(address.stateId, states);
//     const countryName = getCountryName(address.countryId, countries);
//     const loc: string[] = [];
//     if (cityName) loc.push(cityName);
//     if (stateName) loc.push(stateName);
//     if (countryName) loc.push(countryName);
//     if (loc.length > 0) lineParts.push(loc.join(', '));
//     const first = lineParts.join(', ');
//     const pin = address.pinCode ? `PIN: ${String(address.pinCode).trim()}` : '';
//     const stateCode = address.stateCode ? `State Code: ${String(address.stateCode).trim()}` : '';
//     return [first, pin, stateCode].filter(v => !!v).join('\n');
//   };

//   // Normalize company master list
//   const companyMasterArr = useMemo(() => {
//     const raw = (companyMasterList?.data ?? companyMasterList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [companyMasterList]);

//   useEffect(() => {
//     let source: any = companyInfo;
//     if (!source && selectedCompanyId && companyMasterArr.length) {
//       source = companyMasterArr.find((company: any) => Number(company?.id) === Number(selectedCompanyId));
//     }
//     if (!source) {
//       setCompanyInvoiceSettings([]);
//       return;
//     }
//     const invoiceItems = source?.invoiceItems
//       || source?.invoiceData
//       || source?.invoiceItemsList
//       || source?.invoice_details
//       || source?.data?.invoiceItems
//       || source?.data?.invoiceData
//       || [];
//     setCompanyInvoiceSettings(normalizeCompanyInvoiceSettings(invoiceItems));
//   }, [companyInfo, companyMasterArr, selectedCompanyId]);

//   const companyInvoiceSettingsMap = useMemo(() => {
//     const map = new Map<number, CompanyInvoiceSetting>();
//     companyInvoiceSettings.forEach((setting) => {
//       map.set(setting.invoiceTypeId, setting);
//     });
//     return map;
//   }, [companyInvoiceSettings]);

//   const selectableInvoiceTypeOptions = useMemo(() => {
//     if (!companyInvoiceSettings.length) return invoiceTypeOptions;
//     const allowedKeys = new Set(companyInvoiceSettings.map((setting) => String(setting.invoiceTypeId)));
//     const filtered = invoiceTypeOptions.filter((detail) => allowedKeys.has(getDetailKey(detail)));
//     return filtered.length ? filtered : invoiceTypeOptions;
//   }, [invoiceTypeOptions, companyInvoiceSettings]);

//   const customersArr = useMemo(() => {
//     const raw = (customerList?.data ?? customerList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [customerList]);

//   const consigneesArr = useMemo(() => {
//     const raw = (consigneeList?.data ?? consigneeList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [consigneeList]);

//   const domesticKey = useMemo(() => {
//     const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'DOMESTIC' || Number(d.id) === 201);
//     return detail ? getDetailKey(detail) : 'DOMESTIC';
//   }, [selectableInvoiceTypeOptions]);

//   const internationalKey = useMemo(() => {
//     const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'EXPORT' || Number(d.id) === 202);
//     return detail ? getDetailKey(detail) : 'EXPORT';
//   }, [selectableInvoiceTypeOptions]);

//   const jobworkKey = useMemo(() => {
//     const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'WEAVING JOBWORK' || Number(d.id) === 203);
//     return detail ? getDetailKey(detail) : 'WEAVING JOBWORK';
//   }, [selectableInvoiceTypeOptions]);

//   const yarnSalesKey = useMemo(() => {
//     const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'YARN SALES' || Number(d.id) === 205);
//     return detail ? getDetailKey(detail) : 'YARN SALES';
//   }, [selectableInvoiceTypeOptions]);

//   const sizingSalesKey = useMemo(() => {
//     const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'SIZING SALES' || Number(d.id) === 204);
//     return detail ? getDetailKey(detail) : 'SIZING SALES';
//   }, [selectableInvoiceTypeOptions]);

//   const matchesInvoiceTypeValue = (candidateValue: string, detailKey: string, fallbackId: number) => {
//     if (!candidateValue) return false;
//     if (detailKey && candidateValue === detailKey) return true;
//     const numericCandidate = Number(candidateValue);
//     return !Number.isNaN(numericCandidate) && numericCandidate === fallbackId;
//   };

//   const matchesSelectedInvoiceType = (detailKey: string, fallbackId: number) =>
//     matchesInvoiceTypeValue(selectedInvoiceTypeId, detailKey, fallbackId);

//   const isJobwork = matchesSelectedInvoiceType(jobworkKey, 203);
//   const isDomesticInvoiceType = matchesSelectedInvoiceType(domesticKey, 201);
//   const isInternationalInvoiceType = matchesSelectedInvoiceType(internationalKey, 202);
//   const isYarnSalesInvoiceType = matchesSelectedInvoiceType(yarnSalesKey, 205);
//   const isSizingSalesInvoiceType = matchesSelectedInvoiceType(sizingSalesKey, 204);

//   const shouldShowSizingOrders = isSizingSalesInvoiceType;
//   const shouldShowSalesOrders = !isJobwork && !isYarnSalesInvoiceType && !isSizingSalesInvoiceType;
//   const shouldShowWeavingOrders = isJobwork;
//   const shouldShowYarnSalesOrders = isYarnSalesInvoiceType;

//   const targetSalesOrderTypeId = useMemo(() => {
//     if (isDomesticInvoiceType) return 1;
//     if (isInternationalInvoiceType) return 2;
//     return null;
//   }, [isDomesticInvoiceType, isInternationalInvoiceType]);

//   const invoiceTypeTabName = useMemo(() => {
//     if (matchesSelectedInvoiceType(jobworkKey, 203)) return "invoiceJobwork";
//     if (matchesSelectedInvoiceType(yarnSalesKey, 205)) return "invoiceYarnSales";
//     if (matchesSelectedInvoiceType(sizingSalesKey, 204)) return "invoiceSizingSales";
//     if (matchesSelectedInvoiceType(internationalKey, 202)) return "invoiceExport";
//     if (matchesSelectedInvoiceType(domesticKey, 201)) return "invoiceDomestic";
//     return null;
//   }, [selectedInvoiceTypeId, jobworkKey, yarnSalesKey, sizingSalesKey, internationalKey, domesticKey]);

//   // Normalize sales orders list
//   const salesOrdersArr = useMemo(() => {
//     const raw = (salesOrderList?.data ?? salesOrderList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [salesOrderList]);

//   const sizingJobWorkOrdersArr = useMemo(() => {
//     const raw = (sizingJobWorkOrderList?.data ?? sizingJobWorkOrderList) || [];
//     const fullList = Array.isArray(raw) ? raw : [];

//     let list = fullList;
//     if (isSizingSalesInvoiceType) {
//       list = list.filter((order: any) => Number(order.orderTypeId) === 2);
//     }

//     // In edit mode, ensure the referenced order is in the list
//     if (isEditMode) {
//       const referencedId = invoiceDetail?.sizingWorkOrderId || invoiceDetail?.sizingJobWorkOrderId;
//       const referencedNo = invoiceDetail?.soNo;

//       if (referencedId || referencedNo) {
//         const alreadyPresent = list.some((order: any) => {
//           if (referencedId && String(order.id) === String(referencedId)) return true;
//           if (referencedNo && normalizeComparableText(order.sizingWorkOrderNo || order.sizingJobWorkOrderNo || order.jobWorkOrderNo || order.orderNo) === normalizeComparableText(referencedNo)) return true;
//           return false;
//         });

//         if (!alreadyPresent) {
//           const foundInFull = fullList.find((order: any) => {
//             if (referencedId && String(order.id) === String(referencedId)) return true;
//             if (referencedNo && normalizeComparableText(order.sizingWorkOrderNo || order.sizingJobWorkOrderNo || order.jobWorkOrderNo || order.orderNo) === normalizeComparableText(referencedNo)) return true;
//             return false;
//           });

//           if (foundInFull) {
//             list = [foundInFull, ...list];
//           } else if (referencedNo) {
//             // Fallback - create a skeleton with a dummy ID if no ID is available
//             const dummyId = referencedId || -999; 
//             list = [{ 
//               id: dummyId, 
//               sizingWorkOrderNo: referencedNo,
//               sizingJobWorkOrderNo: referencedNo,
//               jobWorkOrderNo: referencedNo,
//               orderNo: referencedNo,
//               orderTypeId: 2
//             }, ...list];
//           }
//         }
//       }
//     }
//     return list;
//   }, [sizingJobWorkOrderList, isSizingSalesInvoiceType, isEditMode, invoiceDetail]);

//   const resolveSizingOrderNo = useCallback((sizingOrderId: number): string => {
//     if (!sizingOrderId) return '';
//     const list = sizingJobWorkOrdersArr;
//     const order = list.find((s: any) => String(s?.id) === String(sizingOrderId));
//     if (order) {
//       return order.sizingWorkOrderNo || order.sizingJobWorkOrderNo || order.jobWorkOrderNo || order.orderNo || '';
//     }
//     if ((invoiceDetail?.sizingWorkOrderId === sizingOrderId || invoiceDetail?.sizingJobWorkOrderId === sizingOrderId) && invoiceDetail.soNo) {
//       return invoiceDetail.soNo;
//     }
//     return '';
//   }, [sizingJobWorkOrdersArr, invoiceDetail]);

//   const deriveSalesOrderItemDetails = useCallback((productName?: string) => {
//     if (!productName) return null;
//     if (!selectedSalesOrder) return null;
//     const normalizedTarget = normalizeComparableText(productName);
//     if (!normalizedTarget) return null;
//     const selectedOrder = salesOrdersArr.find((order: any) => String(order?.id) === String(selectedSalesOrder));
//     if (!selectedOrder) return null;
//     const orderItems = Array.isArray(selectedOrder.items)
//       ? selectedOrder.items
//       : Array.isArray(selectedOrder.SalesOrderItem)
//         ? selectedOrder.SalesOrderItem
//         : Array.isArray(selectedOrder.salesOrderItems)
//           ? selectedOrder.salesOrderItems
//           : [];
//     if (!orderItems.length) return null;

//     const buildDetails = (candidate: any) => {
//       const priceKeys = isInternationalInvoiceType
//         ? ['exportPricePerUnit', 'exportRate', 'exportPrice', 'pricePerUnit', 'rate', 'price']
//         : ['pricePerUnit', 'rate', 'price'];
//       let rateValue: number | null = null;
//       for (const key of priceKeys) {
//         const rawValue = candidate?.[key];
//         if (rawValue === undefined || rawValue === null || rawValue === '') continue;
//         const numericValue = Number(rawValue);
//         if (!Number.isNaN(numericValue)) {
//           rateValue = numericValue;
//           break;
//         }
//       }
//       if (rateValue === null) return null;
//       const resolvedUom = resolveEntityUomName(candidate, normalizedUoms) || candidate?.uom || candidate?.uomName || null;
//       return {
//         rate: roundToTwoDecimals(rateValue),
//         uom: resolvedUom ? String(resolvedUom).trim() : null,
//       };
//     };

//     const targetFabricCode = normalizeComparableText(parseFabricCodeQualityParts(productName).fabricCode);
//     if (targetFabricCode) {
//       const fabricCandidate = orderItems.find((candidate: any) => {
//         const candidateFabric = normalizeComparableText(
//           candidate?.fabricCode || parseFabricCodeQualityParts(candidate?.fabricCodeQuality || '').fabricCode
//         );
//         return candidateFabric && candidateFabric === targetFabricCode;
//       });
//       if (fabricCandidate) {
//         const details = buildDetails(fabricCandidate);
//         if (details) return details;
//       }
//     }

//     for (const candidate of orderItems) {
//       const candidatesList = [
//         candidate.productName,
//         candidate.fabricCode,
//         candidate.buyerProduct,
//         candidate.quality,
//         candidate.fabricCodeQuality,
//       ];
//       const matches = candidatesList.some((source) => {
//         const normalizedSource = normalizeComparableText(source);
//         if (!normalizedSource) return false;
//         return (
//           normalizedSource === normalizedTarget ||
//           normalizedTarget.includes(normalizedSource) ||
//           normalizedSource.includes(normalizedTarget)
//         );
//       });
//       if (!matches) continue;
//       const details = buildDetails(candidate);
//       if (details) {
//         return details;
//       }
//     }

//     return null;
//   }, [normalizedUoms, salesOrdersArr, selectedSalesOrder, isInternationalInvoiceType]);

//   const deriveRateFromSalesOrder = useCallback((productName?: string) => {
//     return deriveSalesOrderItemDetails(productName)?.rate ?? null;
//   }, [deriveSalesOrderItemDetails]);

//   const deriveUomFromSalesOrder = useCallback((productName?: string) => {
//     return deriveSalesOrderItemDetails(productName)?.uom ?? null;
//   }, [deriveSalesOrderItemDetails]);

//   // Normalize weaving orders list
//   const weavingOrdersArr = useMemo(() => {
//     const raw = (weavingJobWorkOrderList?.data ?? weavingJobWorkOrderList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [weavingJobWorkOrderList]);

//   const yarnSalesOrdersArr = useMemo(() => {
//     const raw = (yarnSalesOrderList?.data ?? yarnSalesOrderList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [yarnSalesOrderList]);

//   const yarnChallanArr = useMemo(() => {
//     const raw = (yarnChallanList?.data ?? yarnChallanList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [yarnChallanList]);

//   const yarnMasterArr = useMemo(() => {
//     const raw = (yarnMasterList?.data ?? yarnMasterList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [yarnMasterList]);

//   const yarnMasterMap = useMemo(() => {
//     const map = new Map<number, string>();
//     (Array.isArray(yarnMasterArr) ? yarnMasterArr : []).forEach((entry: any) => {
//       const id = Number(entry?.id ?? entry?.data?.id);
//       const name = entry?.yarnName || entry?.data?.yarnName || entry?.name || entry?.yarn;
//       if (!Number.isNaN(id) && name) {
//         map.set(id, name);
//       }
//     });
//     return map
//   }, [yarnMasterArr]);

//   const transportsArr :any= useMemo(() => {
//     // Handle different response structures
//     if (Array.isArray(transportList)) {
//       return transportList;
//     }
//     if (Array.isArray(transportList?.data)) {
//       return transportList.data;
//     }
//     // If transportList is the full API response with nested data
//     if (transportList?.data?.data && Array.isArray(transportList.data.data)) {
//       return transportList.data.data;
//     }
//     return [];
//   }, [transportList]);

//   const gstMasterArr = useMemo(() => {
//     const raw = (gstList?.data ?? gstList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [gstList]);

//   const gstMap = useMemo(() => {
//     const map = new Map<number, any>();
//     (Array.isArray(gstMasterArr) ? gstMasterArr : []).forEach((entry: any) => {
//       const id = Number(entry?.id);
//       if (!Number.isNaN(id)) {
//         map.set(id, entry);
//       }
//     });
//     return map;
//   }, [gstMasterArr]);

//   // const invoiceArray = useMemo(() => {
//   //   const raw = (invoiceList?.data ?? invoiceList) || [];
//   //   return Array.isArray(raw) ? raw : [];
//   // }, [invoiceList]);
//   // src/pages/transaction/invoice.tsx (around line 1323)
// const invoiceArray = useMemo(() => {
//   const raw = (invoiceList?.data ?? invoiceList) || [];
//   const list = Array.isArray(raw) ? raw : [];

//   // Filter by selected company so document number generation 
//   // only considers records for the current company
//   if (selectedCompanyId) {
//     return list.filter((inv: any) => 
//       Number(inv.companyId) === Number(selectedCompanyId) ||
//       Number(inv.company_id) === Number(selectedCompanyId)
//     );
//   }
//   return list;
// }, [invoiceList, selectedCompanyId]);


//   const selectedInvoiceTypeDetail = useMemo(() => {
//     if (!selectedInvoiceTypeId) return null;
//     return selectableInvoiceTypeOptions.find((detail) => getDetailKey(detail) === selectedInvoiceTypeId) || null;
//   }, [selectableInvoiceTypeOptions, selectedInvoiceTypeId]);

//   const resolvedInvoiceTypeId = useMemo(() => {
//     if (selectedInvoiceTypeDetail?.id != null) {
//       const numeric = Number(selectedInvoiceTypeDetail.id);
//       if (!Number.isNaN(numeric)) return numeric;
//     }
//     const numeric = Number(selectedInvoiceTypeId);
//     return Number.isNaN(numeric) ? null : numeric;
//   }, [selectedInvoiceTypeDetail, selectedInvoiceTypeId]);

//   const selectedCompanyInvoiceSetting = useMemo(() => {
//     if (resolvedInvoiceTypeId) {
//       const config = companyInvoiceSettingsMap.get(resolvedInvoiceTypeId);
//       if (config) return config;
//     }
//     const numeric = Number(selectedInvoiceTypeId);
//     if (!Number.isNaN(numeric)) {
//       const config = companyInvoiceSettingsMap.get(numeric);
//       if (config) return config;
//     }
//     return null;
//   }, [companyInvoiceSettingsMap, resolvedInvoiceTypeId, selectedInvoiceTypeId]);

//   const invoiceTypePrefix = useMemo(() => {
//     if (selectedCompanyInvoiceSetting?.prefix) {
//       return selectedCompanyInvoiceSetting.prefix;
//     }
//     return getInvoicePrefixFromDetail(selectedInvoiceTypeDetail);
//   }, [selectedCompanyInvoiceSetting, selectedInvoiceTypeDetail]);

//   const applyInvoicePrefix = useCallback((value: string) => {
//     if (!value) return value;
//     let baseNumber = stripExistingInvoicePrefix(value);
//     if (selectedCompanyInvoiceSetting?.prefix) {
//       const token = `${selectedCompanyInvoiceSetting.prefix}/`;
//       if (baseNumber.startsWith(token)) {
//         baseNumber = baseNumber.slice(token.length);
//       }
//     }
//     if (!invoiceTypePrefix) {
//       return baseNumber;
//     }
//     return `${invoiceTypePrefix}/${baseNumber}`;
//   }, [invoiceTypePrefix, selectedCompanyInvoiceSetting]);

//   const resolvedYarnSalesOrderId = useMemo(() => {
//     const numeric = Number(selectedYarnSalesOrderId);
//     return Number.isNaN(numeric) ? null : numeric;
//   }, [selectedYarnSalesOrderId]);

//   const resolvedSizingWorkOrderId = useMemo(() => {
//     const numeric = Number(selectedSizingWorkOrderId);
//     return Number.isNaN(numeric) ? null : numeric;
//   }, [selectedSizingWorkOrderId]);

//   const fabricMasterArr = useMemo(() => {
//     const raw = (fabricMasterList?.data ?? fabricMasterList) || [];
//     return Array.isArray(raw) ? raw : [];
//   }, [fabricMasterList]);

//   const fabricMasterMap = useMemo(() => {
//     const map = new Map<string, { fabricCode: string; quality: string; uom?: string }>();
//     fabricMasterArr.forEach((fm: any) => {
//       const keyCandidates = normalizeKeyValues([fm?.id, fm?.fabricMasterId, fm?.fabricCodeId]);
//       const key = keyCandidates[0];
//       if (!key) return;
//       const fabricCode = String(fm?.fabricCode || fm?.code || fm?.fabricCodeName || '').trim();
//       const quality = String(fm?.fabricQuality || fm?.quality || fm?.fabricQualityName || '').trim();
//       const rawUom = String(fm?.uom?.uomName || fm?.uomName || fm?.uom || '').trim();
//       map.set(key, {
//         fabricCode,
//         quality,
//         uom: rawUom || undefined
//       });
//     });
//     return map;
//   }, [fabricMasterArr]);

//   const extractFabricMasterIdFromEntry = (entry: any): number | null => {
//     if (!entry) return null;
//     const keys = [entry?.fabricMasterId, entry?.fabricMasterID, entry?.fabricCodeId, entry?.fabricId, entry?.id];
//     for (const key of keys) {
//       if (key === undefined || key === null || key === '') continue;
//       const numeric = Number(key);
//       if (!Number.isNaN(numeric) && numeric > 0) {
//         return numeric;
//       }
//     }
//     return null;
//   };

//   const resolveFabricMasterIdFromProductName = useCallback((value?: string | null): number | null => {
//     if (!value) return null;
//     const normalizedTargetFull = normalizeComparableText(value);
//     if (!normalizedTargetFull) return null;
//     const { fabricCode, quality } = parseFabricCodeQualityParts(value);
//     const normalizedTargetCode = normalizeComparableText(fabricCode);
//     const normalizedTargetQuality = normalizeComparableText(quality);

//     const normalizedCandidates = fabricMasterArr.map((entry: any) => {
//       const { fabricCode: parsedFabricCode, quality: parsedQuality } = parseFabricCodeQualityParts(entry?.fabricCodeQuality || '');
//       const rawCode = entry?.fabricCode || entry?.code || entry?.fabricCodeName || parsedFabricCode || '';
//       const rawQuality = entry?.fabricQuality || entry?.quality || entry?.fabricQualityName || parsedQuality || '';
//       return {
//         entry,
//         normalizedCode: normalizeComparableText(rawCode),
//         normalizedQuality: normalizeComparableText(rawQuality),
//         normalizedFull: normalizeComparableText([rawCode, rawQuality].filter(Boolean).join(' - '))
//       };
//     });

//     const directMatch = normalizedCandidates.find((candidate) =>
//       candidate.normalizedFull && normalizedTargetFull && candidate.normalizedFull === normalizedTargetFull
//     );
//     if (directMatch) {
//       return extractFabricMasterIdFromEntry(directMatch.entry);
//     }

//     const codeQualityMatch = normalizedCandidates.find((candidate) =>
//       normalizedTargetCode && candidate.normalizedCode && candidate.normalizedCode === normalizedTargetCode &&
//       normalizedTargetQuality && candidate.normalizedQuality && candidate.normalizedQuality === normalizedTargetQuality
//     );
//     if (codeQualityMatch) {
//       return extractFabricMasterIdFromEntry(codeQualityMatch.entry);
//     }

//     const codeMatch = normalizedCandidates.find((candidate) =>
//       normalizedTargetCode && candidate.normalizedCode && candidate.normalizedCode === normalizedTargetCode
//     );
//     if (codeMatch) {
//       return extractFabricMasterIdFromEntry(codeMatch.entry);
//     }

//     const containsMatch = normalizedCandidates.find((candidate) =>
//       normalizedTargetFull && candidate.normalizedCode && normalizedTargetFull.includes(candidate.normalizedCode)
//     );
//     if (containsMatch) {
//       return extractFabricMasterIdFromEntry(containsMatch.entry);
//     }

//     const qualityMatch = normalizedCandidates.find((candidate) =>
//       normalizedTargetFull && candidate.normalizedQuality && normalizedTargetFull.includes(candidate.normalizedQuality)
//     );
//     if (qualityMatch) {
//       return extractFabricMasterIdFromEntry(qualityMatch.entry);
//     }

//     return null;
//   }, [fabricMasterArr]);

//   const deriveInvoiceItemFabricMasterId = useCallback((item: Partial<InvoiceItem>) => {
//     const existingId = Number(item?.fabricMasterId ?? 0);
//     if (!Number.isNaN(existingId) && existingId > 0) {
//       return existingId;
//     }
//     const derived = resolveFabricMasterIdFromProductName(item?.productName);
//     return derived ?? 0;
//   }, [resolveFabricMasterIdFromProductName]);

//   const updateInvoiceItemsGst = useCallback((gstPercent: number) => {
//     if (gstPercent == null || Number.isNaN(gstPercent)) return;
//     setInvoiceData(prev => ({
//       ...prev,
//       items: prev.items.map(item => {
//         const quantity = Number(item.quantity) || 0;
//         const rate = Number(item.rate) || 0;
//         const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);
//         return {
//           ...item,
//           gstPercent,
//           taxableAmount,
//           gstAmount,
//           totalAmount,
//           amount: totalAmount,
//         };
//       }),
//     }));
//   }, [setInvoiceData]);

//   const applyGstFromMaster = useCallback((gstPercentId?: string | number | null, gstTypeOverride?: string | null, fallbackPercent?: number | null) => {
//     const type = gstTypeOverride ?? selectedValues.gstType;
//     const numericId = gstPercentId !== undefined && gstPercentId !== null && gstPercentId !== '' ? Number(gstPercentId) : NaN;
//     const entry = !Number.isNaN(numericId) ? gstMap.get(numericId) : null;
//     const fallback = fallbackPercent !== undefined && fallbackPercent !== null ? Number(fallbackPercent) : null;
//     let cgst = 0;
//     let sgst = 0;
//     let igst = 0;
//     let total = 0;

//     if (entry) {
//       const entryCgst = Number(entry.cgstRate || 0);
//       const entrySgst = Number(entry.sgstRate || 0);
//       const entryIgst = Number(entry.igstRate || 0);
//       if (type === '1') {
//         cgst = entryCgst;
//         sgst = entrySgst;
//         total = cgst + sgst;
//       } else if (type === '2') {
//         igst = entryIgst;
//         total = igst;
//       } else if (entryIgst) {
//         igst = entryIgst;
//         total = entryIgst;
//       } else {
//         cgst = entryCgst;
//         sgst = entrySgst;
//         total = cgst + sgst;
//       }
//     } else if (fallback !== null && !Number.isNaN(fallback)) {
//       if (type === '1') {
//         total = fallback;
//         cgst = fallback / 2;
//         sgst = fallback / 2;
//       } else if (type === '2') {
//         total = fallback;
//         igst = fallback;
//       } else {
//         total = fallback;
//       }
//     } else {
//       setGstPerc(0);
//       setCgstPerc(0);
//       setSgstPerc(0);
//       setIgstPerc(0);
//       updateInvoiceItemsGst(0);
//       return 0;
//     }

//     setGstPerc(total);
//     setCgstPerc(cgst);
//     setSgstPerc(sgst);
//     setIgstPerc(igst);
//     updateInvoiceItemsGst(total);
//     return total;
//   }, [gstMap, selectedValues.gstType, updateInvoiceItemsGst]);

//   const parseInvoiceNumberParts = useCallback((value?: string | null): InvoiceNumberParts | null => {
//     if (!value || typeof value !== 'string') return null;
//     const segments = value.split('/');
//     if (segments.length === 0) return null;
//     const seqToken = segments[segments.length - 1];
//     const seqValue = Number(seqToken);
//     if (Number.isNaN(seqValue)) return null;
//     const financialYear = segments.length >= 2 ? segments[segments.length - 2] : null;
//     return {
//       segments,
//       seqValue,
//       digits: seqToken.length,
//       financialYear
//     };
//   }, []);

//   const rebuildInvoiceNumber = useCallback((parts: InvoiceNumberParts, nextSequence: number) => {
//     const updated = parts.segments.slice();
//     const targetIndex = updated.length - 1;
//     updated[targetIndex] = String(nextSequence).padStart(parts.digits, '0');
//     return updated.join('/');
//   }, []);

//   // Get selected SO object
//   const selectedSOObject = useMemo(() => {
//     if (!selectedSalesOrder) return null;
//     return salesOrdersArr.find((so: any) => String(so.id) === String(selectedSalesOrder)) || null;
//   }, [salesOrdersArr, selectedSalesOrder]);

//   useEffect(() => {
//     if (hasUserAdjustedInvoiceType) return;
//     if (!selectableInvoiceTypeOptions.length) return;

//     let derivedId = invoiceDetail?.invoiceTypeId ? String(invoiceDetail.invoiceTypeId) : '';

//     if (!derivedId && Number(invoiceDetail?.isJobwork) === 1) {
//       derivedId = jobworkKey;
//     } else if (!derivedId && invoiceDetail?.yarnSalesOrderId) {
//       derivedId = yarnSalesKey;
//     } else if (!derivedId && selectedSOObject) {
//       const orderType = Number(selectedSOObject.orderTypeId ?? selectedSOObject.orderType);
//       if (orderType === 2) {
//         derivedId = internationalKey;
//       } else if (orderType === 1) {
//         derivedId = domesticKey;
//       }
//     } else if (!derivedId && invoiceDetailTabName) {
//       const tab = String(invoiceDetailTabName).toLowerCase();
//       if (tab.includes('export')) {
//         derivedId = internationalKey;
//       } else if (tab.includes('domestic')) {
//         derivedId = domesticKey;
//       }
//     }

//     if (!derivedId) {
//       derivedId = domesticKey || getDetailKey(selectableInvoiceTypeOptions[0]);
//     }

//     if (derivedId && derivedId !== selectedInvoiceTypeId) {
//       setSelectedInvoiceTypeId(derivedId);
//     }
//   }, [
//     hasUserAdjustedInvoiceType,
//     invoiceDetail,
//     invoiceDetailTabName,
//     selectedSOObject,
//     domesticKey,
//     internationalKey,
//     jobworkKey,
//     selectableInvoiceTypeOptions,
//     selectedInvoiceTypeId
//   ]);

//   const getMappedInvoiceTabName = useCallback(() => {
//     const baseTab = (() => {
//       if (invoiceTypeTabName) return invoiceTypeTabName;
//       if (tabNameFromState) return tabNameFromState;
//       if (invoiceDetailTabName) return invoiceDetailTabName;
//       if (selectedSOObject) {
//         const orderType = Number(selectedSOObject.orderTypeId ?? selectedSOObject.orderType);
//         if (orderType === 2) return "export";
//         if (orderType === 1) return "domestic";
//       }
//       return "domestic";
//     })();

//     if (baseTab === "domestic") return "invoiceDomestic";
//     if (baseTab === "export") return "invoiceExport";
//     return baseTab;
//   }, [invoiceTypeTabName, tabNameFromState, invoiceDetailTabName, selectedSOObject]);

//   const ensureUniqueInvoiceNumber = useCallback((candidate: string) => {
//     const typeId = resolvedInvoiceTypeId;
//     if (!candidate || !typeId) return candidate;
//     const candidateParts = parseInvoiceNumberParts(candidate);
//     if (!candidateParts) return candidate;
//     let highestSequence = candidateParts.seqValue;
//     invoiceArray.forEach((invoice: any) => {
//       const rawTypeId = invoice?.invoiceTypeId ?? invoice?.invoiceType?.id;
//       const numericTypeId = Number(rawTypeId);
//       if (Number.isNaN(numericTypeId) || numericTypeId !== typeId) {
//         return;
//       }
//       const existingParts = parseInvoiceNumberParts(invoice?.invoiceNo);
//       if (!existingParts) {
//         return;
//       }
//       if (candidateParts.financialYear && existingParts.financialYear && existingParts.financialYear !== candidateParts.financialYear) {
//         return;
//       }
//       if (existingParts.seqValue > highestSequence) {
//         highestSequence = existingParts.seqValue;
//       }
//     });
//     if (highestSequence === candidateParts.seqValue) {
//       return candidate;
//     }
//     const nextSequence = highestSequence + 1;
//     return rebuildInvoiceNumber(candidateParts, nextSequence);
//   }, [resolvedInvoiceTypeId, parseInvoiceNumberParts, invoiceArray, rebuildInvoiceNumber]);


//   useEffect(() => {
//     if (!invoiceDetailInvoiceNo) return;
//     setInvoiceData(prev => {
//       const formatted = applyInvoicePrefix(invoiceDetailInvoiceNo);
//       if (prev.invoiceNo === formatted) {
//         return prev;
//       }
//       return { ...prev, invoiceNo: formatted };
//     });
//   }, [invoiceDetailInvoiceNo, applyInvoicePrefix]);

//   useEffect(() => {
//     if (invoiceDetailInvoiceNo) return;
//     if (!selectedCompanyInvoiceSetting) return;
//     if (!companyInvoiceSettings.length) return;
//     if (!resolvedInvoiceTypeId) return;
//     if (invoiceData.invoiceNo) return;
//     const companyForSequence = selectedCompanyId ?? loggedInCompanyId ?? undefined;

//     const generated = invoiceNumberService.generateInvoiceNumber({
//       invoiceTypeId: resolvedInvoiceTypeId,
//       invoiceSettings: companyInvoiceSettings,
//       invoices: invoiceArray,
//       companyId: companyForSequence
//     });

//     if (!generated?.invoiceNo) return;
//     const formatted = applyInvoicePrefix(generated.invoiceNo);
//     const uniqueValue = ensureUniqueInvoiceNumber(formatted);

//     setInvoiceData(prev => {
//       if (prev.invoiceNo === uniqueValue) {
//         return prev;
//       }
//       return { ...prev, invoiceNo: uniqueValue };
//     });
//   }, [
//     invoiceDetailInvoiceNo,
//     selectedCompanyInvoiceSetting,
//     companyInvoiceSettings,
//     resolvedInvoiceTypeId,
//     invoiceData.invoiceNo,
//     invoiceArray,
//     applyInvoicePrefix,
//     ensureUniqueInvoiceNumber,
//     selectedCompanyId,
//     loggedInCompanyId
//   ]);

//   useEffect(() => {
//     setInvoiceData(prev => {
//       if (!prev.invoiceNo) return prev;
//       const formatted = applyInvoicePrefix(prev.invoiceNo);
//       if (formatted === prev.invoiceNo) {
//         return prev;
//       }
//       return { ...prev, invoiceNo: formatted };
//     });
//   }, [applyInvoicePrefix]);

//   useEffect(() => {
//     setInvoiceData(prev => {
//       if (!prev.invoiceNo) return prev;
//       const uniqueValue = ensureUniqueInvoiceNumber(prev.invoiceNo);
//       if (uniqueValue === prev.invoiceNo) {
//         return prev;
//       }
//       return { ...prev, invoiceNo: uniqueValue };
//     });
//   }, [ensureUniqueInvoiceNumber]);

//   useEffect(() => {
//     if (!activeGstPercentId) return;
//     applyGstFromMaster(activeGstPercentId);
//   }, [activeGstPercentId, applyGstFromMaster]);

//   // Get selected WO object  
//   const selectedWOObject = useMemo(() => {
//     if (!selectedWeavingWorkOrderId) return null;
//     return weavingOrdersArr.find((wo: any) => String(wo.id) === String(selectedWeavingWorkOrderId)) || selectedWeavingOrder;
//   }, [weavingOrdersArr, selectedWeavingWorkOrderId, selectedWeavingOrder]);

//   const selectedSizingWorkOrderObject = useMemo(() => {
//     if (!selectedSizingWorkOrderId) return null;
//     return sizingJobWorkOrdersArr.find((order: any) => String(order.id) === String(selectedSizingWorkOrderId)) || selectedSizingWorkOrder;
//   }, [sizingJobWorkOrdersArr, selectedSizingWorkOrderId, selectedSizingWorkOrder]);

//   const deriveWeavingOrderItemDetails = useCallback((line: PackingLine) => {
//     if (!selectedWOObject) return null;
//     const items = Array.isArray(selectedWOObject.items) ? selectedWOObject.items : [];
//     if (!items.length) return null;
//     const normalizedLineFabricId = normalizeKeyValues([line.fabricMasterId])[0];
//     const { fabricCode, quality } = parseFabricCodeQualityParts(line.fabricCodeQuality || '');
//     const normalizedLineFabricCode = normalizeComparableText(fabricCode);
//     const normalizedLineQuality = normalizeComparableText(quality);
//     const matchesCandidate = (candidate: any) => {
//       const candidateFabricIds = normalizeKeyValues([
//         candidate?.fabricMasterId,
//         candidate?.fabricCodeId,
//         candidate?.fabricId,
//         candidate?.fabricCode
//       ]);
//       if (normalizedLineFabricId && candidateFabricIds.some(id => id === normalizedLineFabricId)) return true;
//       const candidateCode = normalizeComparableText(candidate?.fabricCode || candidate?.fabricCodeName);
//       if (normalizedLineFabricCode && candidateCode && candidateCode === normalizedLineFabricCode) return true;
//       const candidateQuality = normalizeComparableText(candidate?.fabricQuality || candidate?.quality);
//       if (normalizedLineQuality && candidateQuality && candidateQuality === normalizedLineQuality) return true;
//       return false;
//     };
//     let matchedItem = items.find(matchesCandidate);
//     if (!matchedItem) {
//       matchedItem = items[0];
//     }
//     if (!matchedItem) return null;
//     const rawRate = Number(matchedItem?.ratePerUnit ?? matchedItem?.rate ?? matchedItem?.pricePerUnit ?? 0);
//     if (Number.isNaN(rawRate)) return null;
//     const candidateUomKeys = normalizeKeyValues([matchedItem?.uomId, matchedItem?.uom?.id]);
//     let resolvedUom = candidateUomKeys.length ? uomMap.get(candidateUomKeys[0]) : undefined;
//     if (!resolvedUom) {
//       resolvedUom = matchedItem?.uomName || matchedItem?.uom?.uomName || matchedItem?.uom?.name || undefined;
//     }
//     if (!resolvedUom && normalizedLineFabricId) {
//       const fabricMeta = fabricMasterMap.get(normalizedLineFabricId);
//       if (fabricMeta?.uom) {
//         resolvedUom = fabricMeta.uom;
//       }
//     }
//     return {
//       rate: roundToTwoDecimals(rawRate),
//       uom: resolvedUom
//     };
//   }, [selectedWOObject, fabricMasterMap, uomMap]);

//   const selectedYarnSalesOrder = useMemo(() => {
//     if (!selectedYarnSalesOrderId) return null;
//     return yarnSalesOrdersArr.find((order: any) => String(order.id) === String(selectedYarnSalesOrderId)) || null;
//   }, [yarnSalesOrdersArr, selectedYarnSalesOrderId]);

//   const yarnChallanLines = useMemo(() => {
//     if (!shouldShowYarnSalesOrders || !resolvedYarnSalesOrderId) return [];

//     const warehouses = normalizedWarehouseList;
//     const uoms = Array.isArray(uomList) ? uomList : [];

//     const getWarehouseName = (warehouseId?: number | string | null) => {
//       if (warehouseId == null || warehouseId === '') return '';
//       const match = warehouses.find((w: any) => String(w.id) === String(warehouseId));
//       return match?.warehouseName || match?.name || '';
//     };

//     const getUomName = (uomId?: number | string | null) => {
//       if (uomId == null || uomId === '') return 'Kg';
//       const match = uoms.find((u: any) => String(u.id) === String(uomId));
//       return match?.uomName || match?.name || 'Kg';
//     };

//     const challans = (Array.isArray(yarnChallanArr) ? yarnChallanArr : []).filter((challan: any) =>
//       Number(challan?.yarnSalesOrderId) === resolvedYarnSalesOrderId
//     );

//     const rawLines: YarnChallanLine[] = challans.flatMap((challan: any) => {
//       const challanItems = Array.isArray(challan?.items) ? challan.items : [];
//       const issueDetails = Array.isArray(challan?.yarnIssueDetails) ? challan.yarnIssueDetails : [];
//       const invoiceEligibleItems = challanItems.filter((item: any) => Number(item?.isInvoice ?? 0) === 0);

//       return invoiceEligibleItems.map((item: any, idx: number) => {
//         const yarnId = Number(item?.yarnId ?? item?.yarn?.id);
//         const itemIdentifierKeys = new Set(
//           normalizeKeyValues([
//             item?.id,
//             item?.yarnSalesItemId,
//             item?.yarnSalesItem?.id,
//             item?.salesOrderItemId,
//             item?.orderItemId,
//           ])
//         );
//         const yarnIdentifierKeys = new Set(
//           normalizeKeyValues([
//             yarnId,
//             item?.yarn?.id,
//             item?.yarn?.yarnId,
//           ])
//         );
//         const matchingIssues = issueDetails.filter((detail: any) => {
//           const detailItemKeys = normalizeKeyValues([
//             detail?.yarnSalesItemId,
//             detail?.yarnSalesItem?.id,
//             detail?.itemId,
//             detail?.salesOrderItemId,
//           ]);
//           if (detailItemKeys.some((key) => itemIdentifierKeys.has(key))) {
//             return true;
//           }
//           const detailYarnKeys = normalizeKeyValues([
//             detail?.yarnId,
//             detail?.yarn?.id,
//           ]);
//           return detailYarnKeys.some((key) => yarnIdentifierKeys.has(key));
//         });
//         const primaryIssue = matchingIssues[0];
//         const issueWarehouseIds = matchingIssues
//           .map((detail: any) => detail?.warehouseId ?? detail?.warehouse?.id)
//           .filter((id: any) => id !== null && id !== undefined && id !== '');
//         const resolvedWarehouseId = issueWarehouseIds.length
//           ? Number(issueWarehouseIds[0])
//           : Number(item?.warehouseId ?? challan?.warehouseId ?? 0) || undefined;
//         const warehouseNameCandidates = matchingIssues
//           .map((detail: any) => detail?.warehouse?.warehouseName || detail?.warehouseName || getWarehouseName(detail?.warehouseId))
//           .filter((name: any) => !!name);
//         const warehouseName = warehouseNameCandidates.length
//           ? Array.from(new Set(warehouseNameCandidates)).join(', ')
//           : getWarehouseName(resolvedWarehouseId);
//         const quantity = Number(item?.issueQty ?? primaryIssue?.issueQty ?? item?.orderQuantity ?? 0);
//         const rate = Number(item?.ratePerUnit) || 0;
//         const rawGstPercentId = item?.gstPercentId ?? item?.gstPercent?.id;
//         const normalizedGstPercentId = rawGstPercentId !== undefined && rawGstPercentId !== null && rawGstPercentId !== '' ? Number(rawGstPercentId) : undefined;
//         let gstPercent = Number(item?.gstPercent ?? 0);
//         if (Number.isNaN(gstPercent)) {
//           gstPercent = 0;
//         }
//         if ((!gstPercent || gstPercent === 0) && normalizedGstPercentId !== undefined) {
//           const gstEntry = gstMap.get(normalizedGstPercentId);
//           if (gstEntry) {
//             if (selectedValues.gstType === '2') {
//               gstPercent = Number(gstEntry.igstRate || 0);
//             } else {
//               const cgstRate = Number(gstEntry.cgstRate || 0);
//               const sgstRate = Number(gstEntry.sgstRate || 0);
//               gstPercent = cgstRate + sgstRate;
//             }
//           }
//         }
//         if ((!gstPercent || gstPercent === 0) && normalizedGstPercentId !== undefined) {
//           gstPercent = Number(normalizedGstPercentId) || 0;
//         }
//         const yarnNameSource = item?.yarn?.yarnName || yarnMasterMap.get(yarnId) || '';
//         const fallbackName = yarnId ? `Yarn ${yarnId}` : 'Yarn Item';
//         const uniqueId = `${challan?.id || 0}-${item?.id || idx}`;

//         return {
//           id: uniqueId,
//           challanId: Number(challan?.id) || 0,
//           challanNo: challan?.challanNo || '',
//           challanDate: challan?.challanDate || '',
//           itemId: Number(item?.id) || 0,
//           yarnId,
//           itemName: yarnNameSource || fallbackName,
//           quantity,
//           uom: getUomName(item?.uomId),
//           rate,
//           gstPercent,
//           gstPercentId: normalizedGstPercentId,
//           warehouseId: resolvedWarehouseId,
//           warehouseName,
//           hsnCode: item?.hsnCode ? String(item.hsnCode) : '',
//         } as YarnChallanLine;
//       });
//     });

//     const groupedByChallan = new Map<string, YarnChallanLine[]>();
//     rawLines.forEach((line) => {
//       const key = line.challanNo || String(line.challanId) || line.id;
//       const existing = groupedByChallan.get(key);
//       if (existing) {
//         existing.push(line);
//       } else {
//         groupedByChallan.set(key, [line]);
//       }
//     });

//     const aggregatedLines: YarnChallanLine[] = [];
//     groupedByChallan.forEach((lines, key) => {
//       if (lines.length <= 1) {
//         aggregatedLines.push(lines[0]);
//         return;
//       }
//       const base = lines[0];
//       const uniqueNames = Array.from(new Set(lines.map((entry) => entry.itemName).filter(Boolean))).join(', ');
//       const quantityDisplay = lines
//         .map((entry) => {
//           const qty = Number(entry.quantity ?? 0);
//           return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
//         })
//         .join(', ');
//       const warehouseNames = Array.from(new Set(lines.map((entry) => entry.warehouseName).filter(Boolean))).join(', ');

//       aggregatedLines.push({
//         ...base,
//         id: `group-${base.challanId || base.id || key}`,
//         itemName: uniqueNames || base.itemName,
//         quantity: lines.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0),
//         quantityDisplay,
//         warehouseName: warehouseNames || base.warehouseName,
//         childItems: lines,
//       });
//     });

//     return aggregatedLines;
//   }, [shouldShowYarnSalesOrders, resolvedYarnSalesOrderId, yarnChallanArr, yarnMasterMap, normalizedWarehouseList, uomList, gstMap, selectedValues.gstType]);

//   const sizingBeamOutwardLines = useMemo(() => {
//     if (!isSizingSalesInvoiceType || !resolvedSizingWorkOrderId) return [];

//     const list = Array.isArray(sizingBeamOutwardList) ? sizingBeamOutwardList : [];

//     return list
//       .filter((entry: any) => Number(entry?.sizingOrderId) === resolvedSizingWorkOrderId)
//       .map((entry: any) => {
//         // Find matching production details to fetch net weight and meters
//         const matchingProduction = Array.isArray(sizingProductionList) 
//           ? sizingProductionList.find((p: any) => Number(p.sizingOrderId) === Number(entry.sizingOrderId))
//           : null;

//         const productionDetails = Array.isArray(matchingProduction?.productionDetails) 
//           ? matchingProduction.productionDetails 
//           : Array.isArray(entry.productionDetails) 
//             ? entry.productionDetails 
//             : [];

//         const sumNetWt = productionDetails.reduce((sum: number, p: any) => sum + (Number(p.netWt) || 0), 0);
//         const sumMeters = productionDetails.reduce((sum: number, p: any) => sum + (Number(p.beamMeters) || 0), 0);
//         const firstEnds = productionDetails[0]?.totalEnds || 0;

//         return {
//           id: entry.id,
//           sizingBeamOutwardNo: entry.sizingBeamOutwardNo || entry.sizingProductionNo || matchingProduction?.sizingProductionNo || '',
//           sizingOrderId: entry.sizingOrderId,
//           sizingOrderNo: entry.sizingOrderNo || matchingProduction?.sizingOrderNo || '',
//           yarnName: entry.yarnName || matchingProduction?.yarnName || '',
//           noOfBeams: entry.summary?.noOfBeams || entry.noOfBeams || matchingProduction?.noOfBeams || productionDetails.length || 0,
//           beamMeters: sumMeters || entry.totalMeters || entry.summary?.totalMeters || entry.summary?.totalBeamMeters || entry.beamMeters || matchingProduction?.totalMeters || 0,
//           totalEnds: firstEnds || entry.summary?.totalEnds || entry.totalEnds || matchingProduction?.summary?.sizingCount || 0,
//           yarnId: entry.yarnId || matchingProduction?.yarnId,
//           rate: entry.sizingRatePerKg || matchingProduction?.sizingRatePerKg || 0,
//           gstPercent: 0,
//           netWeight: sumNetWt || entry.totalNetWeight || entry.summary?.totalNetWeight || entry.summary?.totalNetWt || entry.netWt || matchingProduction?.totalNetWeight || 0,
//         } as SizingBeamOutwardLine;
//       });
//   }, [isSizingSalesInvoiceType, resolvedSizingWorkOrderId, sizingBeamOutwardList, sizingProductionList]);

//   const itemTableColumnCount = isYarnSalesInvoiceType ? 12 : isSizingSalesInvoiceType ? 14 : 13;
//   const modalSelectableLines = isYarnSalesInvoiceType 
//     ? yarnChallanLines 
//     : isSizingSalesInvoiceType 
//       ? sizingBeamOutwardLines 
//       : packingLines;

//   // Buyer list - prioritize order-specific parties, fall back to master lists
//   const filteredBuyerList = useMemo(() => {
//     if (shouldShowYarnSalesOrders) {
//       if (selectedYarnSalesOrder) {
//         const candidateIds = [
//           selectedYarnSalesOrder.buyerId,
//           selectedYarnSalesOrder?.buyer?.id,
//         ].filter((id) => id != null);
//         let matches = customersArr.filter((entry: any) =>
//           candidateIds.some((id) => String(entry.id) === String(id))
//         );
//         if (!matches.length) {
//           const buyerName = selectedYarnSalesOrder?.buyer?.customerName;
//           if (buyerName) {
//             const lc = String(buyerName).toLowerCase();
//             matches = customersArr.filter((entry: any) =>
//               String(entry.customerName ?? entry.name ?? '')?.toLowerCase() === lc
//             );
//           }
//         }
//         if (matches.length) {
//           return matches;
//         }
//       }
//       return customersArr;
//     }

//     if (isJobwork) {
//       if (selectedWOObject) {
//         const candidateIds = [
//           selectedWOObject.buyerCompanyId,
//           selectedWOObject.buyerId,
//           selectedWOObject?.buyer?.id,
//         ].filter((id) => id != null);
//         let matches = customersArr.filter((entry: any) =>
//           candidateIds.some((id) => String(entry.id) === String(id))
//         );
//         if (!matches.length) {
//           const buyerName = selectedWOObject.buyerName || selectedWOObject?.buyer?.customerName;
//           if (buyerName) {
//             const lc = String(buyerName).toLowerCase();
//             matches = customersArr.filter((entry: any) =>
//               String(entry.customerName ?? entry.name ?? '')?.toLowerCase() === lc
//             );
//           }
//         }
//         if (matches.length) {
//           return matches;
//         }
//       }
//       return customersArr;
//     }

//     if (selectedSOObject) {
//       const candidateIds = [
//         selectedSOObject.customerId,
//         selectedSOObject.buyerCustomerId,
//         selectedSOObject?.buyerCustomer?.id,
//       ].filter((id) => id != null);
//       let matches = customersArr.filter((entry: any) =>
//         candidateIds.some((id) => String(entry.id) === String(id))
//       );
//       if (!matches.length) {
//         const buyerName = selectedSOObject.buyerCustomerName || selectedSOObject?.buyerCustomer?.customerName;
//         if (buyerName) {
//           const lc = String(buyerName).toLowerCase();
//           matches = customersArr.filter((entry: any) =>
//             String(entry.customerName ?? entry.name ?? '')?.toLowerCase() === lc
//           );
//         }
//       }
//       if (matches.length) {
//         return matches;
//       }
//     }

//     return customersArr;
//   }, [isJobwork, selectedWOObject, selectedSOObject, companyMasterArr, customersArr]);

//   // Consignee list - prioritize order-specific parties, fall back to master lists
//   const filteredConsigneeList = useMemo(() => {
//     if (shouldShowYarnSalesOrders) {
//       if (selectedYarnSalesOrder) {
//         const candidateIds = [
//           selectedYarnSalesOrder.deliveryAtId,
//           selectedYarnSalesOrder?.deliveryAt?.id,
//         ].filter((id) => id != null);
//         let matches = consigneesArr.filter((entry: any) =>
//           candidateIds.some((id) => String(entry.id) === String(id))
//         );
//         if (!matches.length) {
//           const consigneeName = selectedYarnSalesOrder?.deliveryAt?.consigneeName;
//           if (consigneeName) {
//             const lc = String(consigneeName).toLowerCase();
//             matches = consigneesArr.filter((entry: any) =>
//               String(entry.consigneeName ?? entry.name ?? '')?.toLowerCase() === lc
//             );
//           }
//         }
//         if (matches.length) {
//           return matches;
//         }
//       }
//       return consigneesArr;
//     }

//     if (isJobwork) {
//       if (selectedWOObject) {
//         const candidateIds = [
//           selectedWOObject.consigneeCompanyId,
//           selectedWOObject.consigneeId,
//           selectedWOObject?.consignee?.id,
//         ].filter((id) => id != null);
//         let matches = consigneesArr.filter((entry: any) =>
//           candidateIds.some((id) => String(entry.id) === String(id))
//         );
//         if (!matches.length) {
//           const consigneeName = selectedWOObject.consigneeCompanyName || selectedWOObject.consigneeName || selectedWOObject?.consignee?.consigneeName;
//           if (consigneeName) {
//             const lc = String(consigneeName).toLowerCase();
//             matches = consigneesArr.filter((entry: any) =>
//               String(entry.consigneeName ?? entry.name ?? '')?.toLowerCase() === lc
//             );
//           }
//         }
//         if (matches.length) {
//           return matches;
//         }
//       }
//       return consigneesArr;
//     }

//     if (selectedSOObject) {
//       const candidateIds = [
//         selectedSOObject.deliverToCompanyId,
//         selectedSOObject.deliverToId,
//         selectedSOObject?.deliverTo?.id,
//       ].filter((id) => id != null);
//       let matches = consigneesArr.filter((entry: any) =>
//         candidateIds.some((id) => String(entry.id) === String(id))
//       );
//       if (!matches.length) {
//         const consigneeName = selectedSOObject?.deliverTo?.consigneeName;
//         if (consigneeName) {
//           const lc = String(consigneeName).toLowerCase();
//           matches = consigneesArr.filter((entry: any) =>
//             String(entry.consigneeName ?? entry.name ?? '')?.toLowerCase() === lc
//           );
//         }
//       }
//       if (matches.length) {
//         return matches;
//       }
//     }

//     return consigneesArr;
//   }, [isJobwork, selectedWOObject, selectedSOObject, companyMasterArr, consigneesArr]);

//   const invoiceTypeSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     selectableInvoiceTypeOptions
//       .map((detail) => {
//         const value = getDetailKey(detail);
//         const label = getDetailLabel(detail);
//         if (!value || !label) return null;
//         return {
//           id: detail.id ?? value,
//           value,
//           label
//         };
//       })
//       .filter(Boolean) as CommonSearchableSelectOption[],
//     [selectableInvoiceTypeOptions]
//   );

//   const shipmentTermOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (shipmentTermsList ?? [])
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.termName || entry?.name || ''
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [shipmentTermsList]
//   );

//   const paymentTermOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (paymentTermsList ?? [])
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.termName || entry?.name || '',
//         activeFlag: entry?.activeFlag ?? true
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [paymentTermsList]
//   );

//   const shipmentModeOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (shipmentModesList ?? [])
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.modeName || entry?.name || '',
//         activeFlag: entry?.activeFlag ?? true
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [shipmentModesList]
//   );

//   const bankOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (companyBanks ?? [])
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.bankName || entry?.name || ''
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [companyBanks]
//   );

//   const termsConditionsOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (termsContitionsList ?? [])
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.termsConditionsName || entry?.name || '',
//         activeFlag: entry?.activeFlag ?? true
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [termsContitionsList]
//   );

//   const transportOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (Array.isArray(transportsArr) ? transportsArr : [])
//       .slice()
//       .sort((a: any, b: any) => (String(a?.transportName || '').localeCompare(String(b?.transportName || ''))))
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.transportName || entry?.name || '',
//         activeFlag: entry?.activeFlag ?? true
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [transportsArr]
//   );

//   const warehouseOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (normalizedWarehouseList ?? [])
//       .slice()
//       .sort((a: any, b: any) => (String(a?.warehouseName || a?.name || '').localeCompare(String(b?.warehouseName || b?.name || ''))))
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.warehouseName || entry?.name || '',
//         activeFlag: entry?.activeFlag ?? true
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [normalizedWarehouseList]
//   );

//   const agentOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (Array.isArray(employeeList) ? employeeList : [])
//       .slice()
//       .sort((a: any, b: any) => (String(a?.employeeName || '').localeCompare(String(b?.employeeName || ''))))
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.employeeName || entry?.name || '',
//         activeFlag: entry?.activeFlag ?? true
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [employeeList]
//   );

//   const buyerOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (filteredBuyerList ?? [])
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.customerName || entry?.companyName || entry?.name || '',
//         activeFlag: entry?.activeFlag ?? true
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [filteredBuyerList]
//   );

//   const consigneeOptions = useMemo<CommonSearchableSelectOption[]>(() =>
//     (filteredConsigneeList ?? [])
//       .map((entry: any) => ({
//         id: entry?.id,
//         value: String(entry?.id),
//         label: entry?.consigneeName || entry?.name || '',
//         activeFlag: entry?.activeFlag ?? true
//       }))
//       .filter(isValidSelectOption) as CommonSearchableSelectOption[],
//     [filteredConsigneeList]
//   );

//   const hydrateBuyerDetails = useCallback((customerIdValue: string | number | null | undefined) => {
//     if (!customerIdValue) {
//       setInvoiceData(prev => ({
//         ...prev,
//         buyer: { name: '', address: '' }
//       }));
//       setBuyerStateCode('');
//       return;
//     }

//     const matchId = String(customerIdValue);

//     const customer = customersArr.find((c: any) => String(c.id) === matchId);
//     if (customer) {
//       const addrText = formatAddressMultiline(customer.address, cityList, stateList, countryList);
//       const gst = customer.gstNo ? String(customer.gstNo).trim() : 'Not Provided';
//       const addrWithGst = [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
//       setInvoiceData(prev => ({
//         ...prev,
//         buyer: {
//           name: customer.customerName || customer.name || '',
//           address: addrWithGst || ''
//         }
//       }));
//       setBuyerStateCode(customer.address?.stateCode || '');
//       return;
//     }

//     if (!isJobwork) {
//       const company = companyMasterArr.find((c: any) => String(c.id) === matchId);
//       if (company) {
//         const addressArr = Array.isArray(company?.address) ? company.address : [];
//         const defaultAddr = addressArr.find((a: any) => a.isDefault) || addressArr[0];
//         const parts: string[] = [];
//         if (defaultAddr?.line1) parts.push(String(defaultAddr.line1));
//         const stateName = defaultAddr?.stateId ? getStateName(String(defaultAddr.stateId), stateList) : '';
//         if (stateName) parts.push(stateName);
//         if (defaultAddr?.pinCode) parts.push(`PIN: ${defaultAddr.pinCode}`);
//         const gst = company.gstNo ? String(company.gstNo).trim() : 'Not Provided';
//         if (gst) parts.push(`GST No: ${gst}`);
//         const addressText = parts.join('\n');
//         setInvoiceData(prev => ({
//           ...prev,
//           buyer: {
//             name: company.companyName || company.name || '',
//             address: addressText || ''
//           }
//         }));
//         setBuyerStateCode(defaultAddr?.stateCode || '');
//         return;
//       }
//     }

//     setInvoiceData(prev => ({
//       ...prev,
//       buyer: { name: '', address: '' }
//     }));
//     setBuyerStateCode('');
//   }, [companyMasterArr, customersArr, isJobwork, cityList, stateList, countryList, setInvoiceData]);

//   const hydrateConsigneeDetails = useCallback((consigneeIdValue: string | number | null | undefined) => {
//     if (!consigneeIdValue) {
//       setInvoiceData(prev => ({
//         ...prev,
//         consignee: { name: '', address: '' }
//       }));
//       return;
//     }

//     const matchId = String(consigneeIdValue);

//     if (isJobwork) {
//       const jobworkConsignee = consigneesArr.find((c: any) => String(c.id) === matchId);
//       if (jobworkConsignee) {
//         const addrText = formatAddressMultiline(jobworkConsignee.address, cityList, stateList, countryList);
//         const gst = jobworkConsignee.gstNo ? String(jobworkConsignee.gstNo).trim() : 'Not Provided';
//         const addrWithGst = [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
//         setInvoiceData(prev => ({
//           ...prev,
//           consignee: {
//             name: jobworkConsignee.consigneeName || jobworkConsignee.name || '',
//             address: addrWithGst || ''
//           }
//         }));
//         return;
//       }
//     } else {
//       const consignee = consigneesArr.find((c: any) => String(c.id) === matchId);
//       if (consignee) {
//         const addrText = formatAddressMultiline(consignee.address, cityList, stateList, countryList);
//         const gst = consignee.gstNo ? String(consignee.gstNo).trim() : 'Not Provided';
//         const addrWithGst = [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
//         setInvoiceData(prev => ({
//           ...prev,
//           consignee: {
//             name: consignee.consigneeName || '',
//             address: addrWithGst || ''
//           }
//         }));
//         return;
//       }
//     }

//     setInvoiceData(prev => ({
//       ...prev,
//       consignee: { name: '', address: '' }
//     }));
//   }, [consigneesArr, isJobwork, cityList, stateList, countryList, setInvoiceData]);

//   // Update buyer details when customer/company selected
//   useEffect(() => {
//     hydrateBuyerDetails(selectedValues.customerId);
//   }, [selectedValues.customerId, hydrateBuyerDetails]);

//   // Update consignee details when consignee/company selected
//   useEffect(() => {
//     hydrateConsigneeDetails(selectedValues.consgineeId);
//   }, [selectedValues.consgineeId, hydrateConsigneeDetails]);

//   // Update transportName when transportId changes
//   useEffect(() => {
//     if (selectedValues.transportId && Array.isArray(transportsArr)) {
//       const selectedTransport = transportsArr.find((t: any) => String(t.id) === String(selectedValues.transportId));
//       if (selectedTransport) {
//         setInvoiceData(prev => ({ ...prev, transportName: selectedTransport.transportName || '' }));
//       }
//     } else if (!selectedValues.transportId && !invoiceDetail) {
//       setInvoiceData(prev => ({ ...prev, transportName: '' }));
//     }
//   }, [selectedValues.transportId, transportsArr, invoiceDetail]);

//   // Update deliveryTerms when shipmentTermsId changes
//   useEffect(() => {
//     if (selectedValues.shipmentTermsId && Array.isArray(shipmentTermsList)) {
//       const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(selectedValues.shipmentTermsId));
//       if (shipmentTerm) {
//         setInvoiceData(prev => ({ ...prev, deliveryTerms: shipmentTerm.termName || '' }));
//       }
//     } else if (!selectedValues.shipmentTermsId && !invoiceDetail) {
//       setInvoiceData(prev => ({ ...prev, deliveryTerms: '' }));
//     }
//   }, [selectedValues.shipmentTermsId, shipmentTermsList, invoiceDetail]);

//   // Fetch/massage packing lines when SO/WO/Warehouse changes
//   // useEffect(() => {
//   //   if (!Array.isArray(generatePackingList)) {
//   //     setPackingLines([]);
//   //     setSelectedPackingIds([]);
//   //     return;
//   //   }

//   //   const normalized = Array.isArray((generatePackingList as any)?.data)
//   //     ? (generatePackingList as any).data
//   //     : (generatePackingList as any);

//   //   const currentInvoiceId = invoiceDetail?.id ? Number(invoiceDetail.id) : null;
//   //   const invoicedPackingSlipNos = new Set<string>();
//   //   if (Array.isArray(invoiceList)) {
//   //     (invoiceList as any[]).forEach((invoice: any) => {
//   //       if (invoice.id !== invoiceDetail?.id && Array.isArray(invoice.items)) {
//   //         invoice.items.forEach((item: any) => {
//   //           if (item.isInvoice === 1 && item.packingListNo) {
//   //             invoicedPackingSlipNos.add(String(item.packingListNo));
//   //           }
//   //         });
//   //       }
//   //     });
//   //   }

//   //   const relevantEntries = (normalized || []).reduce((acc: Array<{ entry: any; eligibleItems: any[] }>, entry: any) => {
//   //     if (invoicedPackingSlipNos.has(String(entry?.packingSlipNo || ''))) {
//   //       return acc;
//   //     }

//   //     const eligibleItems = Array.isArray(entry?.items)
//   //       ? entry.items.filter((item: any) => {
//   //           const invoiceFlag = Number(item?.isInvoice ?? item?.is_invoice ?? 0);
//   //           if (invoiceFlag === 0) {
//   //             return true;
//   //           }
//   //           const itemInvoiceId = item?.invoiceId ?? item?.invoice_id;
//   //           if (currentInvoiceId != null && itemInvoiceId != null && Number(itemInvoiceId) === currentInvoiceId) {
//   //             return true;
//   //           }
//   //           return false;
//   //         })
//   //       : [];
//   //     if (!eligibleItems.length) {
//   //       return acc;
//   //     }

//   //     acc.push({ entry, eligibleItems });
//   //     return acc;
//   //   }, []);

//   //   const soList = Array.isArray((salesOrderList as any)?.data)
//   //     ? (salesOrderList as any).data
//   //     : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);

//   //   const resolveFabricMasterIdFromSources = (entry: any, soItem: any, fabricCodeValue: string) => {
//   //     const candidates = [
//   //       entry?.fabricMasterId,
//   //       entry?.fabricMasterID,
//   //       entry?.fabricId,
//   //       entry?.fabricCodeId,
//   //       soItem?.fabricMasterId,
//   //       soItem?.fabricId,
//   //       soItem?.fabricCodeId,
//   //     ];
//   //     for (const candidate of candidates) {
//   //       if (candidate != null && candidate !== '') {
//   //         const num = Number(candidate);
//   //         if (!Number.isNaN(num)) {
//   //           return num;
//   //         }
//   //       }
//   //     }
//   //     if (fabricCodeValue) {
//   //       const match = fabricMasterArr.find((fm: any) => {
//   //         const code = fm?.fabricCode || fm?.code || '';
//   //         return code && String(code).toLowerCase() === String(fabricCodeValue).toLowerCase();
//   //       });
//   //       if (match?.id) {
//   //         const num = Number(match.id);
//   //         if (!Number.isNaN(num)) {
//   //           return num;
//   //         }
//   //       }
//   //     }
//   //     return 0;
//   //   };

//   //   const derivedLines = relevantEntries.map(({ entry, eligibleItems }: any) => {
//   //     const soNo = resolveSalesOrderNo(Number(entry?.salesOrderId));
//   //     const woNo = resolveWeavingOrderNo(Number(entry?.weavingWorkOrderId));
//   //     const so = soList.find((s: any) => s?.id === Number(entry?.salesOrderId));
//   //     const firstItem = Array.isArray(so?.items) && so.items.length > 0 ? so.items[0] : null;
//   //     const quantity = eligibleItems.reduce((sum: number, it: any) => sum + (Number(it?.length) || 0), 0);
//   //     const baseRolls = eligibleItems.length || Number(entry?.noOfRolls ?? entry?.numberOfRolls ?? 0) || 0;
//   //     const fabricCode = firstItem?.fabricCode || entry?.fabricCode || '';
//   //     const buyerProduct = firstItem?.buyerProduct || firstItem?.quality || entry?.quality || entry?.fabricQuality || '';
//   //     const computedName = [fabricCode, buyerProduct].filter(Boolean).join(' - ').trim();
//   //     const fabricCodeQuality = computedName || fabricCode || buyerProduct || 'No description';
//   //     const uomId = firstItem?.uomId;
//   //     const uomName = Array.isArray(uomList)
//   //       ? (uomList.find((u: any) => String(u.id) === String(uomId))?.uomName || '')
//   //       : '';
//   //     const rate = Number(firstItem?.pricePerUnit) || 0;
//   //     const fabricMasterId = resolveFabricMasterIdFromSources(entry, firstItem, fabricCode);
//   //     const orderKey = isJobwork ? String(entry?.weavingWorkOrderId || '') : String(entry?.salesOrderId || '');
//   //     return {
//   //       entry,
//   //       salesOrderNo: soNo || '',
//   //       weavingOrderNo: woNo || '',
//   //       quantity,
//   //       uomName,
//   //       rate,
//   //       gstPercent: 0,
//   //       baseRolls,
//   //       fabricCodeQuality,
//   //       fabricMasterId,
//   //       orderKey,
//   //     };
//   //   });

//   //   const rollCountMap = new Map<string, number>();
//   //   derivedLines.forEach((line: any) => {
//   //     const key = `${line.orderKey || '0'}::${line.fabricMasterId || 0}::${line.fabricCodeQuality}`;
//   //     const base = Number(line.baseRolls) || 0;
//   //     rollCountMap.set(key, (rollCountMap.get(key) || 0) + base);
//   //   });

//   //   const mapped: PackingLine[] = derivedLines.map((line: any) => {
//   //     const key = `${line.orderKey || '0'}::${line.fabricMasterId || 0}::${line.fabricCodeQuality}`;
//   //     const aggregatedRolls = rollCountMap.get(key) ?? line.baseRolls ?? 0;
//   //     return {
//   //       id: line.entry?.id,
//   //       rollNo: line.entry?.packingSlipNo || '',
//   //       salesOrderNo: line.salesOrderNo,
//   //       salesOrderId: line.entry?.salesOrderId,
//   //       weavingOrderNo: line.weavingOrderNo,
//   //       weavingWorkOrderId: line.entry?.weavingWorkOrderId,
//   //       fabricCodeQuality: line.fabricCodeQuality,
//   //       quantity: line.quantity,
//   //       uom: line.uomName || 'Mtrs',
//   //       rate: line.rate,
//   //       gstPercent: line.gstPercent,
//   //       noOfRolls: aggregatedRolls,
//   //       fabricMasterId: line.fabricMasterId || undefined,
//   //     } as PackingLine;
//   //   });

//   //   setPackingLines(mapped);
//   //   setSelectedPackingIds([]);
//   // }, [selectedSalesOrder, selectedWeavingWorkOrderId, selectedValues.warehouseId, isJobwork, generatePackingList, salesOrderList, uomList, invoiceList, invoiceDetail, fabricMasterArr]);

//   const packingWarehouseCandidate = useMemo(() => {
//     if (!Array.isArray(normalizedPackingList) || normalizedPackingList.length === 0) return null;

//     if (isJobwork && selectedWeavingWorkOrderId) {
//       const matches = normalizedPackingList.filter((entry: any) => String(entry?.weavingWorkOrderId) === selectedWeavingWorkOrderId);
//       const candidate = deriveWarehouseIdFromPackings(matches);
//       if (candidate) return candidate;
//     }

//     if (isYarnSalesInvoiceType && selectedYarnSalesOrderId) {
//       const matches = normalizedPackingList.filter((entry: any) => String(entry?.yarnSalesOrderId) === selectedYarnSalesOrderId);
//       const candidate = deriveWarehouseIdFromPackings(matches);
//       if (candidate) return candidate;
//     }

//     if (!isJobwork && !isYarnSalesInvoiceType && selectedSalesOrder) {
//       const matches = normalizedPackingList.filter((entry: any) => String(entry?.salesOrderId) === selectedSalesOrder);
//       const candidate = deriveWarehouseIdFromPackings(matches);
//       if (candidate) return candidate;
//     }

//     return null;
//   }, [
//     normalizedPackingList,
//     isJobwork,
//     selectedWeavingWorkOrderId,
//     isYarnSalesInvoiceType,
//     selectedYarnSalesOrderId,
//     selectedSalesOrder
//   ]);

//   useEffect(() => {
//     if (!packingWarehouseCandidate) return;
//     if (hasManualWarehouseSelection) return;
//     if (String(selectedValues.warehouseId) === packingWarehouseCandidate) return;
//     setSelectedValues(prev => ({ ...prev, warehouseId: packingWarehouseCandidate }));
//   }, [packingWarehouseCandidate, hasManualWarehouseSelection, selectedValues.warehouseId]);

//   // Fetch/massage packing lines when SO/WO/Warehouse changes
// useEffect(() => {
//   console.log('=== PACKING LINES DEBUG ===');
//   console.log('Selected Order Info:', {
//     isJobwork,
//     isYarnSalesInvoiceType,
//     selectedSalesOrder,
//     selectedWeavingWorkOrderId,
//     selectedYarnSalesOrderId,
//     selectedWarehouseId: selectedValues.warehouseId
//   });

//   console.log('Raw generatePackingList:', generatePackingList);

//   if (!selectedValues.warehouseId) {
//     console.log('No warehouse selected - clearing packing lines');
//     setPackingLines([]);
//     setSelectedPackingIds([]);
//     return;
//   }

//   const normalizedList = normalizedPackingList;

//   console.log('Normalized packing list count:', normalizedList.length);

//   if (normalizedList.length === 0) {
//     console.log('No packing lists available after normalization');
//     setPackingLines([]);
//     setSelectedPackingIds([]);
//     return;
//   }

//   // Filter based on current order type and warehouse
//   const filteredPackingLists = normalizedList.filter((packing: any) => {
//     // Check warehouse match
//     const warehouseMatch = String(packing?.warehouseId) === String(selectedValues.warehouseId);
//     if (!warehouseMatch) return false;

//     let orderMatch = false;
//     if (isJobwork) {
//       // For jobwork, match weaving work order
//       orderMatch = String(packing?.weavingWorkOrderId) === String(selectedWeavingWorkOrderId);
//     } else if (isYarnSalesInvoiceType) {
//       // For yarn sales, match yarn sales order
//       orderMatch = String(packing?.yarnSalesOrderId) === String(selectedYarnSalesOrderId);
//     } else {
//       // For regular sales, match sales order
//       orderMatch = String(packing?.salesOrderId) === String(selectedSalesOrder);
//     }

//     if (!orderMatch) return false;

//     // Additionally check if there are items with isInvoice 0
//     if (Array.isArray(packing.items) && packing.items.length > 0) {
//       return packing.items.some((item: any) => Number(item?.isInvoice ?? 0) === 0);
//     }

//     return true;
//   });

//   console.log('Filtered packing lists count (isInvoice 0 check):', filteredPackingLists.length);

//   // Map to PackingLine format
//   const mappedLines: PackingLine[] = filteredPackingLists.map((packing: any, index: number) => {
//     const resolvedId = resolvePackingLineId(packing, index);
//     let orderNo = '';
//     let orderId: number | undefined;
//     let fabricCodeQuality = '';
//     let noOfRolls = 0;

//     if (isJobwork) {
//       orderNo = resolveWeavingOrderNo(Number(packing.weavingWorkOrderId)) || packing.weavingOrderNo || packing.orderNo || '';
//       orderId = packing.weavingWorkOrderId;
//        const fabricCode = packing.fabricCode || '';
//       const quality = packing.quality || packing.fabricQuality || '';
//       fabricCodeQuality = [fabricCode, quality].filter(Boolean).join(' - ') || 'No Description';
//       noOfRolls = derivePackingRollCount(packing, fabricCodeQuality);
//     } else if (isYarnSalesInvoiceType) {
//       orderNo = packing.yarnSalesOrderNo || packing.orderNo || '';
//       orderId = packing.yarnSalesOrderId;
//       fabricCodeQuality = packing.itemName || 'Yarn Item';
//       noOfRolls = 0;
//     } else {
//       orderNo = resolveSalesOrderNo(Number(packing.salesOrderId)) || packing.salesOrderNo || packing.orderNo || '';
//       orderId = packing.salesOrderId;
//       const fabricCode = packing.fabricCode || '';
//       const quality = packing.quality || packing.fabricQuality || '';
//       fabricCodeQuality = [fabricCode, quality].filter(Boolean).join(' - ') || 'No Description';
//       noOfRolls = derivePackingRollCount(packing, fabricCodeQuality);
//     }

//     // Only count items with isInvoice 0
//     let quantity = 0;
//     if (Array.isArray(packing.items) && packing.items.length > 0) {
//       quantity = packing.items.reduce((sum: number, item: any) => {
//         if (Number(item?.isInvoice ?? 0) === 0) {
//           return sum + (Number(item.length) || Number(item.quantity) || 0);
//         }
//         return sum;
//       }, 0);
//     } else {
//       quantity = Number(packing.quantity || 0);
//     }

//     const resolvedUomName = resolveEntityUomName(packing, normalizedUoms);
//     const uom = resolvedUomName || packing.uom || packing.uomName || 'Mtrs';
//     const rate = Number(packing.rate || packing.pricePerUnit || 0);

//     return {
//       id: resolvedId,
//       rollNo: packing.packingSlipNo || packing.rollNo || `PACK-${index + 1}`,
//       salesOrderNo: isJobwork ? '' : orderNo,
//       salesOrderId: isJobwork ? undefined : orderId,
//       weavingOrderNo: isJobwork ? orderNo : '',
//       weavingWorkOrderId: isJobwork ? orderId : undefined,
//       fabricCodeQuality,
//       quantity,
//       uom,
//       rate,
//       gstPercent: Number(packing.gstPercent || 0),
//       quality: packing.quality,
//       noOfRolls,
//       fabricMasterId: packing.fabricMasterId
//     };
//   });

//   console.log('Mapped packing lines:', mappedLines);

//   setPackingLines(mappedLines);
//   setSelectedPackingIds([]);
// }, [
//   selectedSalesOrder, 
//   selectedWeavingWorkOrderId, 
//   selectedYarnSalesOrderId, 
//   selectedValues.warehouseId, 
//   isJobwork, 
//   isYarnSalesInvoiceType,
//   normalizedPackingList,
//   normalizedUoms,
//   resolveSalesOrderNo,
//   resolveWeavingOrderNo
// ]);

//   useEffect(() => {
//     if (isYarnSalesInvoiceType) {
//       setSelectedPackingIds([]);
//     }
//   }, [isYarnSalesInvoiceType, selectedYarnSalesOrderId, yarnChallanLines.length]);

//   // Auto-set GST Type and percentages from Sales Order
//   useEffect(() => {
//     if (!selectedSalesOrder) return;
//     const list = Array.isArray((salesOrderList as any)?.data)
//       ? (salesOrderList as any).data
//       : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);
//     const so: any = list.find((s: any) => s?.id === Number(selectedSalesOrder));
//     if (!so) return;
//     const taxId = so?.taxId ?? so?.data?.taxId;
//     if (taxId === 1 || taxId === '1' || taxId === 2 || taxId === '2') {
//       const gstType = taxId === 1 || taxId === '1' ? '1' : '2';
//       setSelectedValues(prev => ({ ...prev, gstType }));
//       const fi = Array.isArray(so?.items) && so.items.length > 0 ? so.items[0] : null;
//       const gstPercentId = fi?.gstPercentId ?? fi?.gstPercent?.id;
//       if (gstPercentId !== undefined && gstPercentId !== null && gstPercentId !== '') {
//         setActiveGstPercentId(String(gstPercentId));
//       }
//       applyGstFromMaster(gstPercentId, gstType, Number(fi?.gstPercent || 0));
//     }
//   }, [selectedSalesOrder, salesOrderList, applyGstFromMaster]);

//   // Auto-set GST Type and percentages from Weaving Work Order
//   useEffect(() => {
//     if (!selectedWeavingWorkOrderId || !isJobwork) return;
//     const list = Array.isArray((weavingJobWorkOrderList as any)?.data)
//       ? (weavingJobWorkOrderList as any).data
//       : (Array.isArray(weavingJobWorkOrderList) ? (weavingJobWorkOrderList as any[]) : []);
//     const wo: any = list.find((w: any) => String(w?.id) === String(selectedWeavingWorkOrderId));
//     if (!wo) return;
//     const taxId = wo?.taxId ?? wo?.gstTypeId ?? wo?.data?.taxId ?? wo?.data?.gstTypeId;
//     if (taxId === 1 || taxId === '1' || taxId === 2 || taxId === '2') {
//       const gstType = taxId === 1 || taxId === '1' ? '1' : '2';
//       setSelectedValues(prev => ({ ...prev, gstType }));
//       const fi = Array.isArray(wo?.items) && wo.items.length > 0 ? wo.items[0] : null;
//       const gstPercentId = fi?.gstPercentId ?? fi?.gstPercent?.id;
//       if (gstPercentId !== undefined && gstPercentId !== null && gstPercentId !== '') {
//         setActiveGstPercentId(String(gstPercentId));
//       }
//       applyGstFromMaster(gstPercentId, gstType, Number(fi?.gstPercent || 0));
//     }
//   }, [selectedWeavingWorkOrderId, isJobwork, weavingJobWorkOrderList, applyGstFromMaster]);

//   useEffect(() => {
//     if (!invoiceDetail) return;

//     const needsCustomer = invoiceDetail.customerId != null && invoiceDetail.customerId !== '';
//     const needsConsignee = invoiceDetail.consgineeId != null && invoiceDetail.consgineeId !== '';
//     const needsSalesOrder = invoiceDetail.salesOrderId != null && Number(invoiceDetail.salesOrderId) > 0;
//     const needsWeavingOrder = invoiceDetail.weavingWorkOrderId != null && Number(invoiceDetail.weavingWorkOrderId) > 0;
//     const needsYarnOrder = invoiceDetail.yarnSalesOrderId != null && Number(invoiceDetail.yarnSalesOrderId) > 0;
//     const needsSizingOrder = (invoiceDetail.sizingWorkOrderId != null && Number(invoiceDetail.sizingWorkOrderId) > 0) || (invoiceDetail.sizingJobWorkOrderId != null && Number(invoiceDetail.sizingJobWorkOrderId) > 0);

//     if ((needsCustomer && !customersArr.length && !companyMasterArr.length)
//       || (needsConsignee && !consigneesArr.length && !companyMasterArr.length)
//       || (needsSalesOrder && !salesOrdersArr.length)
//       || (needsWeavingOrder && !weavingOrdersArr.length)
//       || (needsYarnOrder && !yarnSalesOrdersArr.length)) {
//       return;
//     }

//     const relatedSalesOrder = salesOrdersArr.find((so: any) => Number(so?.id) === Number(invoiceDetail.salesOrderId));
//     const customer = customersArr.find((c: any) => Number(c?.id) === Number(invoiceDetail.customerId));
//     const consignee = consigneesArr.find((c: any) => Number(c?.id) === Number(invoiceDetail.consgineeId));

//     setSelectedSalesOrder(invoiceDetail.salesOrderId ? String(invoiceDetail.salesOrderId) : '');

//     if (invoiceDetail.weavingWorkOrderId) {
//       setSelectedWeavingWorkOrderId(String(invoiceDetail.weavingWorkOrderId));
//     }

//     if (invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId || (isSizingSalesInvoiceType && invoiceDetail.soNo)) {
//       const sId = invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId;
//       let finalSId = sId ? String(sId) : '';

//       if (!finalSId && invoiceDetail.soNo) {
//         const matched = sizingJobWorkOrdersArr.find((o: any) => 
//           normalizeComparableText(o.sizingWorkOrderNo || o.sizingJobWorkOrderNo || o.jobWorkOrderNo || o.orderNo) === normalizeComparableText(invoiceDetail.soNo)
//         );
//         if (matched) {
//           finalSId = String(matched.id);
//         }
//       }

//       if (finalSId) {
//         setSelectedSizingWorkOrderId(finalSId);
//         const foundOrder = sizingJobWorkOrdersArr.find((o: any) => String(o.id) === finalSId);
//         if (foundOrder) {
//           setSelectedSizingWorkOrder(foundOrder);
//         }
//       }
//     }

//     setSelectedValues({
//       manufactureId: invoiceDetail.manufactureId || 1,
//       companyBankId: String(invoiceDetail.companyBankId || ''),
//       termsConditionsId: String(invoiceDetail.termsConditionsId || ''),
//       paymentTermsId: String(invoiceDetail.paymentTermsId || ''),
//       shipToId: String(invoiceDetail.shipToId || ''),
//       shipmentMode: String(invoiceDetail.shipmentMode || ''),
//       shipmentTermsId: String(invoiceDetail.deliveryTermsId ?? invoiceDetail.shipmentTermsId ?? ''),
//       customerId: String(invoiceDetail.customerId || ''),
//       consgineeId: String(invoiceDetail.consgineeId || ''),
//       warehouseId: String(invoiceDetail.warehouseId || ''),
//       agentId: String(invoiceDetail.agentId || ''),
//       gstType: invoiceDetail.gstType || '',
//       transportId: String(invoiceDetail.transportNameId ?? invoiceDetail.transportId ?? '')
//     });

//     if (invoiceDetail.gstPercentId !== undefined && invoiceDetail.gstPercentId !== null && invoiceDetail.gstPercentId !== '') {
//       setActiveGstPercentId(String(invoiceDetail.gstPercentId));
//     } else if (invoiceDetail.gstPercent) {
//       applyGstFromMaster(null, invoiceDetail.gstType || '', Number(invoiceDetail.gstPercent));
//     }

//     setAddDiscItems(invoiceDetail.addDiscItems || []);
//     setAddDiscDrafts(invoiceDetail.addDiscDrafts || []);
//     setRoundOff(invoiceDetail.roundOff || 0);

//     const buyerAddrText = customer ? formatAddressMultiline(customer.address, cityList, stateList, countryList) : '';
//     const buyerGst = customer?.gstNo ? String(customer.gstNo).trim() : 'Not Provided';
//     const buyerAddrWithGst = [buyerAddrText, `GST No: ${buyerGst}`].filter(Boolean).join('\n');
//     const consigneeAddrText = consignee ? formatAddressMultiline(consignee.address, cityList, stateList, countryList) : '';
//     const consigneeGst = consignee?.gstNo ? String(consignee.gstNo).trim() : 'Not Provided';
//     const consigneeAddrWithGst = [consigneeAddrText, `GST No: ${consigneeGst}`].filter(Boolean).join('\n');

//     const resolvedOrderNo = (() => {
//       if (invoiceDetail.salesOrderId) {
//         return resolveSalesOrderNo(Number(invoiceDetail.salesOrderId)) || invoiceDetail.soNo || '';
//       }
//       if (invoiceDetail.yarnSalesOrderId) {
//         return resolveYarnSalesOrderNo(Number(invoiceDetail.yarnSalesOrderId)) || invoiceDetail.yarnSalesNo || '';
//       }
//       if (invoiceDetail.weavingWorkOrderId) {
//         return resolveWeavingOrderNo(Number(invoiceDetail.weavingWorkOrderId)) || invoiceDetail.woNo || '';
//       }
//       if (invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId) {
//         const sId = invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId;
//         return resolveSizingOrderNo(Number(sId)) || invoiceDetail.soNo || '';
//       }
//       return invoiceDetail.soNo || invoiceDetail.woNo || '';
//     })();

//     setInvoiceData({
//       date: invoiceDetail.invoiceDate ? invoiceDetail.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
//       invoiceNo: applyInvoicePrefix(invoiceDetail.invoiceNo || ''),
//       isInvoice: 0,
//       soNo: resolvedOrderNo,
//       woNo: invoiceDetail.weavingWorkOrderId 
//         ? resolveWeavingOrderNo(Number(invoiceDetail.weavingWorkOrderId)) 
//         : (invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId
//             ? resolveSizingOrderNo(Number(invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId))
//             : ''),
//       companyBank: '',
//       manufacturer: {
//         name: 'ABC Company',
//         address: 'XXX Street'
//       },
//       termsAndConditions: relatedSalesOrder?.termsConditions?.termName || '',
//       paymentTerms: relatedSalesOrder?.paymentTerms?.paymentTermName || 'Net 60 Days',
//       shipTo: '',
//       shipVia: relatedSalesOrder?.modeOfShipment?.modeName || '',
//       buyer: {
//         name: customer?.customerName || '',
//         address: buyerAddrWithGst || ''
//       },
//       consignee: {
//         name: consignee?.consigneeName || '',
//         address: consigneeAddrWithGst || ''
//       },
//       items: (invoiceDetail.items || []).map((item: any) => {
//         const fabricCode = item.fabricCode || '';
//         const buyerProduct = item.buyerProduct || item.quality || '';
//         const computedName = [fabricCode, buyerProduct].filter(Boolean).join(' - ');
//         const resolvedUom = resolveEntityUomName(item, normalizedUoms) || item.uom;
//         const uomName = resolvedUom || 'Mtrs';
//         const resolvedProductName = item.productName || computedName || '';
//         const resolvedFabricMasterId = deriveInvoiceItemFabricMasterId({
//           productName: resolvedProductName,
//           fabricMasterId: item.fabricMasterId
//         });
//         const sizingItem = (invoiceDetail.sizingSalesItems || []).find((si: any) => 
//           si.beamOutwardNo === item.packingListNo || si.yarnName === item.productName
//         );
//         return {
//           id: item.id,
//           productName: resolvedProductName,
//           quantity: item.quantity || item.orderQty || 0,
//           uom: uomName,
//           rate: item.rate || item.pricePerUnit || 0,
//           amount: item.amount || ((item.quantity || 0) * (item.rate || 0)) || 0,
//           gstPercent: item.gstPercent ?? 18,
//           taxableAmount: item.taxableAmount || ((item.quantity || 0) * (item.rate || 0)) || 0,
//           gstAmount: item.gstAmount || 0,
//           totalAmount: item.totalAmount || 0,
//           isReadOnlyQuantity: !!item.isReadOnlyQuantity,
//           fabricMasterId: resolvedFabricMasterId,
//           packingListNo: item.packingListNo || '',
//           noOfRolls: item.noOfRolls,
//           hsnCode: item.hsnCode || '',
//           yarnChallanId: item.yarnChallanId || 0,
//           yarnChallanNo: item.yarnChallanNo || '',
//           yarnId: item.yarnId || 0,
//           beamMeters: item.beamMeters || sizingItem?.beamMeters || 0,
//           netWeight: item.netWeight || sizingItem?.netWeight || 0,
//           totalEnds: item.totalEnds || sizingItem?.totalEnds || 0
//         };
//       }),
//       additional: (invoiceDetail.additional ?? invoiceDetail.additionTotal ?? 0),
//       less: (invoiceDetail.less ?? invoiceDetail.discountTotal ?? 0),
//       taxAmount: invoiceDetail.taxAmount ?? 0,
//       comments: invoiceDetail.comments || '',
//       roundOff: invoiceDetail.roundOff || 0,
//       addDiscItems: invoiceDetail.addDiscItems || [],
//       gstType: invoiceDetail.gstType || '',
//       transportName: invoiceDetail.transportName || ((invoiceDetail.transportNameId ?? invoiceDetail.transportId)
//         ? (transportsArr?.find((t: any) => String(t.id) === String(invoiceDetail.transportNameId ?? invoiceDetail.transportId))?.transportName || '')
//         : ''),
//       deliveryNote: invoiceDetail.deliveryNote || '',
//       deliveryTerms: invoiceDetail.deliveryTerms || ((invoiceDetail.deliveryTermsId ?? invoiceDetail.shipmentTermsId)
//         ? (shipmentTermsList?.find((st: any) => String(st.id) === String(invoiceDetail.deliveryTermsId ?? invoiceDetail.shipmentTermsId))?.termName || '')
//         : ''),

//       vehicleNo: invoiceDetail.vehicleNo || '',
//       lrNo: invoiceDetail.lrNo || '',
//       lrDate: invoiceDetail.lrDate ? invoiceDetail.lrDate.split('T')[0] : '',
//     });
//   }, [
//     invoiceDetail,
//     customersArr,
//     consigneesArr,
//     companyMasterArr,
//     salesOrdersArr,
//     weavingOrdersArr,
//     yarnSalesOrdersArr,
//     cityList,
//     stateList,
//     countryList,
//     applyGstFromMaster,
//     transportsArr,
//     shipmentTermsList,
//     normalizedUoms,
//     sizingJobWorkOrdersArr,
//     resolveSizingOrderNo
//   ]);

//   useEffect(() => {
//     setIsRoundOffLocked(Boolean(invoiceDetail));
//   }, [invoiceDetail]);

//   const sendInvoice = async () => {
//     if (!isFormValid) {
//       toast.error('Please fill all required fields before sending');
//       return;
//     }

//     try {
//       // First save the invoice if not already saved
//       if (!invoiceData.invoiceNo || invoiceData.invoiceNo === '') {
//         await saveInvoice();
//       }

//       toast.success('Invoice sent successfully!');

//     } catch (error) {
//       toast.error('Failed to send invoice');
//       console.error('Error sending invoice:', error);
//     }
//   };

//   const validateForm = useCallback(() => {
//     const orderFieldValid = shouldShowWeavingOrders
//       ? !!selectedWeavingWorkOrderId
//       : (shouldShowYarnSalesOrders
//           ? !!selectedYarnSalesOrderId
//           : (shouldShowSizingOrders
//               ? !!selectedSizingWorkOrderId
//               : (shouldShowSalesOrders ? !!selectedSalesOrder : true)));

//     // Helper function to check if a value is valid (not null, undefined, or empty string)
//     const isValidValue = (value: any): boolean => {
//       if (value === null || value === undefined) return false;
//       if (typeof value === 'string' && value.trim() === '') return false;
//       return true;
//     };

//     // Check all required fields
//     const requiredFieldsValid = 
//       isValidValue(selectedInvoiceTypeId) &&
//       isValidValue(selectedValues.customerId) &&
//       isValidValue(selectedValues.consgineeId) &&
//       isValidValue(selectedValues.shipmentMode) &&
//       isValidValue(selectedValues.paymentTermsId) &&
//       isValidValue(selectedValues.termsConditionsId) &&
//       // isValidValue(selectedValues.shipmentTermsId) && // Optional field - not marked with * in UI
//       isValidValue(selectedValues.warehouseId) &&
//       // isValidValue(selectedValues.gstType) && // Auto-filled/Disabled field - not marked with * in UI
//       orderFieldValid; // Boolean - true means valid

//     const hasItems = invoiceData.items.length > 0;
//     const itemsValid = hasItems && invoiceData.items.every(item =>
//       isValidValue(item.productName) &&
//       item.quantity > 0 && 
//       item.rate > 0 && 
//       item.gstPercent >= 0
//     );

//     const buyerNameValid = isValidValue(invoiceData.buyer.name);
//     const consigneeNameValid = isValidValue(invoiceData.consignee.name);

//     const isValid = requiredFieldsValid &&
//       hasItems &&
//       itemsValid &&
//       buyerNameValid &&
//       consigneeNameValid;

//     setIsFormValid(isValid);
//   }, [invoiceData, selectedValues, addDiscItems, roundOff, isJobwork, isYarnSalesInvoiceType, selectedWeavingWorkOrderId, selectedYarnSalesOrderId, selectedSizingWorkOrderId, selectedSalesOrder, selectedInvoiceTypeId, shouldShowSizingOrders, shouldShowSalesOrders, shouldShowWeavingOrders, shouldShowYarnSalesOrders]);

//   // Validate form whenever data changes
//   useEffect(() => {
//     validateForm();
//   }, [validateForm]);

//   // Get unique sales orders from generatePackingList (where isJobwork = 0)
//   const getAvailableSalesOrdersFromPacking = () => {
//     if (!shouldShowSalesOrders) return [];
//     if (isSizingSalesInvoiceType) return [];

//     const normalized = normalizedPackingList;

//     const soList = Array.isArray((salesOrderList as any)?.data)
//       ? (salesOrderList as any).data
//       : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);

//     const ensureIds = [
//       selectedSalesOrder ? Number(selectedSalesOrder) : null,
//       invoiceDetail?.salesOrderId != null ? Number(invoiceDetail.salesOrderId) : null
//     ].filter((id): id is number => id !== null && !Number.isNaN(id));
//     const forceIncludeIdSet = new Set(ensureIds);

//     const matchesOrderTypeFilter = (orderTypeId: number | null, id: number) => {
//       const target = targetSalesOrderTypeId;
//       if (forceIncludeIdSet.has(id)) {
//         if (target === null) return true;
//         if (orderTypeId === null) return false;
//         return orderTypeId === target;
//       }
//       if (target === null) return true;
//       if (orderTypeId === null) return false;
//       return orderTypeId === target;
//     };

//     const uniqueSalesOrders = new Map<number, any>();

//     (normalized || []).forEach((packing: any) => {
//       if (Number(packing?.isJobwork ?? 0) === 0 && packing?.salesOrderId) {
//         const soId = Number(packing.salesOrderId);
//         if (!soId || Number.isNaN(soId)) {
//           return;
//         }
//         if (uniqueSalesOrders.has(soId)) {
//           return;
//         }
//         const so = soList.find((s: any) => s?.id === soId);
//         const orderTypeId = resolveSalesOrderTypeId(packing, so);
//         if (!matchesOrderTypeFilter(orderTypeId, soId)) {
//           return;
//         }
//         if (so) {
//           uniqueSalesOrders.set(soId, so);
//         } else {
//           uniqueSalesOrders.set(soId, {
//             id: soId,
//             salesOrderNo: resolveSalesOrderNo(soId) || `SO-${soId}`
//           });
//         }
//       }
//     });

//     if (targetSalesOrderTypeId !== null && uniqueSalesOrders.size === 0) {
//       return [];
//     }

//     ensureIds.forEach((id) => {
//       if (uniqueSalesOrders.has(id)) {
//         return;
//       }
//       const fallback = soList.find((s: any) => Number(s?.id) === id);
//       const fallbackOrderTypeId = resolveSalesOrderTypeId(null, fallback);
//       if (!matchesOrderTypeFilter(fallbackOrderTypeId, id)) {
//         return;
//       }
//       if (fallback) {
//         uniqueSalesOrders.set(id, fallback);
//         return;
//       }
//       uniqueSalesOrders.set(id, {
//         id,
//         salesOrderNo: resolveSalesOrderNo(id) || `SO-${id}`
//       });
//     });

//     return Array.from(uniqueSalesOrders.values());
//   };

//   // Get unique weaving orders referenced by the generatePackingList entries
//   const getAvailableWeavingOrdersFromPacking = () => {
//     if (!shouldShowWeavingOrders) return [];

//     const normalized = normalizedPackingList || [];
//     const woList = weavingOrdersArr;
//     const uniqueWeavingOrders = new Map<number, any>();

//     normalized.forEach((packing: any) => {
//       if (Number(packing?.isJobwork ?? 0) !== 1 || !packing?.weavingWorkOrderId) {
//         return;
//       }
//       const woId = Number(packing.weavingWorkOrderId);
//       if (!woId || Number.isNaN(woId)) {
//         return;
//       }
//       if (uniqueWeavingOrders.has(woId)) {
//         return;
//       }
//       const wo = woList.find((w: any) => String(w?.id) === String(woId));
//       if (wo) {
//         uniqueWeavingOrders.set(woId, wo);
//       } else {
//         const fallbackOrderNo = packing.weavingWorkOrderNo || packing.weavingOrderNo || packing.orderNo || resolveWeavingOrderNo(woId) || `WO-${woId}`;
//         uniqueWeavingOrders.set(woId, {
//           id: woId,
//           weavingOrderNo: fallbackOrderNo,
//           orderNo: fallbackOrderNo
//         });
//       }
//     });

//     return Array.from(uniqueWeavingOrders.values());
//   };

//   const salesOrderSelectOptions: CommonSearchableSelectOption[] = getAvailableSalesOrdersFromPacking()
//     .map((so: any) => {
//       const value = so?.id;
//       const label = so?.salesOrderNo || `Order ${value}`;
//       if (value == null || !label) return null;
//       return { id: value, value: String(value), label };
//     })
//     .filter(Boolean) as CommonSearchableSelectOption[];

//   const yarnSalesOrderSelectOptions = (yarnSalesOrdersArr ?? [])
//     .map((order: any) => {
//       const value = order?.id;
//       const label = order?.yarnSalesNo || `YS-${order?.id}`;
//       if (value == null || !label) return null;
//       return { id: value, value: String(value), label };
//     })
//     .filter(Boolean) as CommonSearchableSelectOption[];

//   const sizingWorkOrderSelectOptions = (sizingJobWorkOrdersArr ?? [])
//     .map((order: any) => {
//       const value = order?.id;
//       const label = order?.sizingWorkOrderNo || order?.sizingJobWorkOrderNo || order?.jobWorkOrderNo || order?.orderNo || `SJO-${order?.id}`;
//       if (value == null || !label) return null;
//       return { id: value, value: String(value), label };
//     })
//     .filter(Boolean) as CommonSearchableSelectOption[];

//   const weavingOrderSelectOptions: CommonSearchableSelectOption[] = getAvailableWeavingOrdersFromPacking()
//     .map((wo: any) => {
//       const value = wo?.id;
//       const label = wo?.weavingWorkOrderNo || wo?.orderNo || `Order ${wo?.id}`;
//       if (value == null || !label) return null;
//       return { id: value, value: String(value), label };
//     })
//     .filter(Boolean) as CommonSearchableSelectOption[];

//   const handleInvoiceTypeChange = (value: string) => {
//     setHasUserAdjustedInvoiceType(true);
//     setSelectedInvoiceTypeId(value);

//     if (!invoiceDetail) {
//       setInvoiceData(prev => ({ ...prev, invoiceNo: '' }));
//     }

//     const nextIsJobwork = matchesInvoiceTypeValue(value, jobworkKey, 203);
//     const nextIsYarnSales = matchesInvoiceTypeValue(value, yarnSalesKey, 205);
//     const nextIsSizingSales = matchesInvoiceTypeValue(value, sizingSalesKey, 204);
//     const nextTargetOrderTypeId = matchesInvoiceTypeValue(value, internationalKey, 202)
//       ? 2
//       : (matchesInvoiceTypeValue(value, domesticKey, 201) ? 1 : null);

//     if (nextIsJobwork) {
//       setSelectedSalesOrder('');
//       setSelectedYarnSalesOrderId('');
//       setSelectedSizingWorkOrderId('');
//       setSelectedSizingWorkOrder(null);
//       setInvoiceData(prev => ({ ...prev, soNo: '' }));
//     } else if (nextIsYarnSales) {
//       setSelectedSalesOrder('');
//       setSelectedSizingWorkOrderId('');
//       setSelectedSizingWorkOrder(null);
//       setInvoiceData(prev => ({ ...prev, soNo: '' }));
//     } else if (nextIsSizingSales) {
//       setSelectedSalesOrder('');
//       setSelectedYarnSalesOrderId('');
//       setInvoiceData(prev => ({ ...prev, soNo: '' }));
//     } else {
//       setSelectedYarnSalesOrderId('');
//       setSelectedSizingWorkOrderId('');
//       setSelectedSizingWorkOrder(null);
//       setInvoiceData(prev => ({ ...prev, soNo: '' }));
//     }

//     if (!nextIsJobwork) {
//       setSelectedWeavingWorkOrderId('');
//       setSelectedWeavingOrder(null);
//       setInvoiceData(prev => ({ ...prev, woNo: '' }));
//     }

//     if (nextIsYarnSales || nextIsSizingSales) {
//       return;
//     }

//     if (!nextIsJobwork) {
//       if (selectedSalesOrder && nextTargetOrderTypeId !== null) {
//         const soList = Array.isArray((salesOrderList as any)?.data)
//           ? (salesOrderList as any).data
//           : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);
//         const currentSO = soList.find((so: any) => so?.id === Number(selectedSalesOrder));
//         const orderTypeId = Number(currentSO?.orderTypeId ?? currentSO?.orderType ?? 0);
//         if (!currentSO || orderTypeId !== nextTargetOrderTypeId) {
//           setSelectedSalesOrder('');
//           setInvoiceData(prev => ({ ...prev, soNo: '' }));
//         }
//       } else if (nextTargetOrderTypeId === null) {
//         setSelectedSalesOrder('');
//         setInvoiceData(prev => ({ ...prev, soNo: '' }));
//       }
//     }
//   };

//   const handleSalesOrderChange = (soId: string) => {
//     if (soId && soId === selectedSalesOrder) {
//       return;
//     }

//     if (!soId) {
//       setSelectedSalesOrder('');
//       resetFormForOrderChange();
//       setInvoiceData(prev => ({
//         ...prev,
//         soNo: ''
//       }));
//       setSelectedValues(prev => ({
//         ...prev,
//         customerId: '',
//         consgineeId: ''
//       }));
//       hydrateBuyerDetails('');
//       hydrateConsigneeDetails('');
//       return;
//     }

//     const numericSoId = Number(soId);
//     if (Number.isNaN(numericSoId)) {
//       toast.error('Invalid sales order selection');
//       return;
//     }

//     const soList = Array.isArray((salesOrderList as any)?.data)
//       ? (salesOrderList as any).data
//       : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);

//     const selectedSO: any = soList.find((so: any) => so?.id === numericSoId);

//     if (!selectedSO) {
//       toast.error('Sales order not found');
//       return;
//     }

//     resetFormForOrderChange();
//     setSelectedSalesOrder(soId);

//     const buyerId = selectedSO.buyerCustomerId || selectedSO?.buyerCustomer?.id || '';
//     const consigneeId = selectedSO.deliverToId || selectedSO?.deliverTo?.id || '';
//     const taxId = selectedSO.taxId ?? selectedSO?.data?.taxId;

//     const shipmentTermsId = selectedSO.shipmentTermsId || selectedSO?.shipmentTerms?.id;
//     const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId));

//     setInvoiceData(prev => ({
//       ...prev,
//       soNo: selectedSO.salesOrderNo,
//       termsAndConditions: selectedSO?.termsConditions?.termName || '',
//       shipVia: selectedSO?.modeOfShipment?.modeName || '',
//       deliveryTerms: shipmentTerm?.termName || selectedSO?.shipmentTerms?.termName || '',
//     }));

//     setSelectedValues(prev => ({
//       ...prev,
//       customerId: String(buyerId || ''),
//       consgineeId: String(consigneeId || ''),
//       shipmentMode: String(selectedSO.modeOfShipmentId || selectedSO?.modeOfShipment?.id || ''),
//       paymentTermsId: String(selectedSO.paymentTermsId || selectedSO?.paymentTerms?.id || ''),
//       termsConditionsId: String(selectedSO.termsConditionsId || selectedSO?.termsConditions?.id || ''),
//       shipmentTermsId: String(shipmentTermsId || ''),
//       gstType: taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '')
//     }));

//     hydrateBuyerDetails(buyerId ? String(buyerId) : '');
//     hydrateConsigneeDetails(consigneeId ? String(consigneeId) : '');
//   };


//   const handleSizingWorkOrderChange = useCallback((orderId: string) => {
//     if (!orderId) {
//       setSelectedSizingWorkOrderId('');
//       setSelectedSizingWorkOrder(null);
//       resetFormForOrderChange();
//       setInvoiceData(prev => ({ ...prev, soNo: '' }));
//       setSelectedValues(prev => ({ ...prev, customerId: '', consgineeId: '' }));
//       hydrateBuyerDetails('');
//       hydrateConsigneeDetails('');
//       return;
//     }

//     const selectedOrder = sizingJobWorkOrdersArr.find((order: any) => String(order.id) === String(orderId));
//     setSelectedSizingWorkOrderId(orderId);
//     setSelectedSizingWorkOrder(selectedOrder || null);

//     if (!selectedOrder) {
//       resetFormForOrderChange();
//       setInvoiceData(prev => ({ ...prev, soNo: '' }));
//       setSelectedValues(prev => ({ ...prev, customerId: '', consgineeId: '' }));
//       hydrateBuyerDetails('');
//       hydrateConsigneeDetails('');
//       return;
//     }

//     resetFormForOrderChange();

//     const buyerId = selectedOrder.buyerId ?? selectedOrder?.buyer?.id ?? selectedOrder?.buyerCustomerId ?? selectedOrder?.customerId ?? '';
//     const consigneeId = selectedOrder.consigneeId ?? selectedOrder?.consignee?.id ?? '';
//     const taxId = selectedOrder.taxId ?? selectedOrder?.gstTypeId ?? selectedOrder?.gstType ?? 0;
//     const gstType = taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '');
//     const orderNo = selectedOrder.sizingWorkOrderNo || selectedOrder.sizingJobWorkOrderNo || selectedOrder.jobWorkOrderNo || selectedOrder.orderNo || '';
//     const shipmentTermsId = selectedOrder.shipmentTermsId || selectedOrder?.shipmentTerms?.id;
//     const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId));

//     setInvoiceData(prev => ({
//       ...prev,
//       soNo: orderNo,
//       termsAndConditions: selectedOrder?.termsConditions?.termName || selectedOrder?.termsConditionsName || '',
//       shipVia: selectedOrder?.modeOfShipment?.modeName || selectedOrder?.modeOfShipmentName || selectedOrder?.modeOfShipment || '',
//       deliveryTerms: shipmentTerm?.termName || selectedOrder?.shipmentTerms?.termName || '',
//     }));

//     setSelectedValues(prev => ({
//       ...prev,
//       customerId: String(buyerId || ''),
//       consgineeId: String(consigneeId || ''),
//       shipmentMode: String(selectedOrder.modeOfShipmentId || selectedOrder?.modeOfShipment?.id || selectedOrder?.modeOfShipment || ''),
//       paymentTermsId: String(selectedOrder.paymentTermsId || selectedOrder?.paymentTerms?.id || ''),
//       termsConditionsId: String(selectedOrder.termsConditionsId || selectedOrder?.termsConditions?.id || ''),
//       shipmentTermsId: String(shipmentTermsId || ''),
//       gstType,
//     }));

//     hydrateBuyerDetails(buyerId ? String(buyerId) : '');
//     hydrateConsigneeDetails(consigneeId ? String(consigneeId) : '');
//   }, [hydrateBuyerDetails, hydrateConsigneeDetails, resetFormForOrderChange, shipmentTermsList, sizingJobWorkOrdersArr, setSelectedValues]);


//   const handleYarnSalesOrderChange = (orderId: string) => {
//     const order = yarnSalesOrdersArr.find((o: any) => o?.id === Number(orderId));
//     if (!order) {
//       setSelectedYarnSalesOrderId('');
//       resetFormForOrderChange();
//       setInvoiceData(prev => ({ ...prev, soNo: '' }));
//       setSelectedValues(prev => ({
//         ...prev,
//         customerId: '',
//         consgineeId: ''
//       }));
//       hydrateBuyerDetails('');
//       hydrateConsigneeDetails('');
//       return;
//     }

//     resetFormForOrderChange();
//     setSelectedYarnSalesOrderId(orderId);

//     const buyerId = order.buyerId || order?.buyer?.id || '';
//     const consigneeId = order.deliveryAtId || order?.deliveryAt?.id || '';
//     const taxId = order.gstTypeId;
//     const gstType = taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '');
//     const firstItem = Array.isArray(order?.items) && order.items.length > 0 ? order.items[0] : null;
//     const gstPercentId = firstItem?.gstPercentId ?? firstItem?.gstPercent?.id;
//     if (gstPercentId !== undefined && gstPercentId !== null && gstPercentId !== '') {
//       setActiveGstPercentId(String(gstPercentId));
//     }
//     applyGstFromMaster(gstPercentId, gstType, Number(firstItem?.gstPercent || 0));

//     const shipmentTermsId = order.shipmentTermsId || order?.shipmentTerms?.id;
//     const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId));

//     setInvoiceData(prev => ({
//       ...prev,
//       soNo: order.yarnSalesNo || '',
//       termsAndConditions: order?.termsConditions?.termName || '',
//       shipVia: order?.modeOfShipment?.modeName || '',
//       paymentTerms: order?.paymentTerms?.termName || '',
//       deliveryTerms: shipmentTerm?.termName || order?.shipmentTerms?.termName || '',
//     }));

//     setSelectedValues(prev => ({
//       ...prev,
//       customerId: String(buyerId || ''),
//       consgineeId: String(consigneeId || ''),
//       shipmentMode: String(order.modeOfShipmentId || order?.modeOfShipment?.id || ''),
//       paymentTermsId: String(order.paymentTermsId || order?.paymentTerms?.id || ''),
//       termsConditionsId: String(order.termsConditionsId || order?.termsConditions?.id || ''),
//       shipmentTermsId: String(shipmentTermsId || ''),
//       gstType,
//     }));

//     hydrateBuyerDetails(buyerId ? String(buyerId) : '');
//     hydrateConsigneeDetails(consigneeId ? String(consigneeId) : '');
//   };

//   useEffect(() => {
//     if (!shouldShowYarnSalesOrders) return;
//     if (!invoiceDetail?.yarnSalesOrderId) return;
//     if (!yarnSalesOrdersArr.length) return;
//     const id = String(invoiceDetail.yarnSalesOrderId);
//     if (selectedYarnSalesOrderId === id) return;
//     handleYarnSalesOrderChange(id);
//   }, [shouldShowYarnSalesOrders, invoiceDetail, yarnSalesOrdersArr, selectedYarnSalesOrderId]);

//   useEffect(() => {
//     if (!shouldShowSizingOrders) return;
//     const invoiceSizingId = invoiceDetail?.sizingJobWorkOrderId ?? invoiceDetail?.sizingWorkOrderId;
//     if (!invoiceSizingId) return;
//     const sizingId = String(invoiceSizingId);
//     if (selectedSizingWorkOrderId === sizingId) return;
//     if (!sizingJobWorkOrdersArr.length) return;
//     handleSizingWorkOrderChange(sizingId);
//   }, [shouldShowSizingOrders, invoiceDetail, sizingJobWorkOrdersArr, selectedSizingWorkOrderId, handleSizingWorkOrderChange]);

//   const sumTaxable = roundToTwoDecimals(invoiceData.items.reduce((sum, item) => sum + (Number(item.taxableAmount) || 0), 0));
//   const sumGst = roundToTwoDecimals(invoiceData.items.reduce((sum, item) => sum + (Number(item.gstAmount) || 0), 0));
//   const addSumAbs = roundToTwoDecimals(addDiscItems.filter(i => i.type === 'addition').reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0));
//   const discSumAbs = roundToTwoDecimals(addDiscItems.filter(i => i.type === 'discount').reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0));
//   const netAddDisc = roundToTwoDecimals(addDiscItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
//   const normalizedRoundOff = roundToTwoDecimals(roundOff);
//   const finalAmount = roundToTwoDecimals(sumTaxable + sumGst + netAddDisc + normalizedRoundOff);

//   const handleSelectChange = (field: string, value: string) => {
//     setSelectedValues(prev => ({
//       ...prev,
//       [field]: value
//     }));

//     if (field === 'warehouseId') {
//       setHasManualWarehouseSelection(true);
//     }

//     if (field === 'termsConditionsId' && value) {
//       const selectedTC = termsContitionsList?.find((tc: any) => String(tc.id) === String(value));
//       if (selectedTC) {
//         setInvoiceData(prev => ({
//           ...prev,
//           termsAndConditions: selectedTC.description || selectedTC.termsConditionsName || ''
//         }));
//       }
//     }
//   };

//   const handleWeavingOrderChange = (woId: string) => {
//     setSelectedWeavingWorkOrderId(woId);

//     const weavingOrdersArr = Array.isArray((weavingJobWorkOrderList as any)?.data) 
//       ? (weavingJobWorkOrderList as any).data 
//       : (Array.isArray(weavingJobWorkOrderList) ? weavingJobWorkOrderList : []);

//     const selectedWO = weavingOrdersArr.find((wo: any) => String(wo.id) === String(woId));
//     setSelectedWeavingOrder(selectedWO || null);

//     if (selectedWO) {
//       resetFormForOrderChange();
//       const buyerId = selectedWO.buyerId || selectedWO?.buyer?.id || '';
//       const consigneeId = selectedWO.consigneeId || selectedWO?.consignee?.id || '';
//       const taxId = selectedWO.taxId ?? selectedWO.gstTypeId ?? selectedWO?.data?.taxId ?? selectedWO?.data?.gstTypeId;

//       const orderNo = selectedWO.weavingWorkOrderNo || selectedWO.weavingOrderNo || selectedWO.orderNo || '';

//       const shipmentTermsId = selectedWO.shipmentTermsId || selectedWO?.shipmentTerms?.id;
//       const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId));

//       setInvoiceData(prev => ({
//         ...prev,
//         woNo: orderNo,
//         termsAndConditions: selectedWO?.termsConditions?.termName || '',
//         shipVia: selectedWO?.modeOfShipment?.modeName || '',
//         deliveryTerms: shipmentTerm?.termName || selectedWO?.shipmentTerms?.termName || '',
//       }));

//       setSelectedValues(prev => ({
//         ...prev,
//         customerId: String(buyerId || ''),
//         consgineeId: String(consigneeId || ''),
//         shipmentMode: String(selectedWO.modeOfShipmentId || selectedWO?.modeOfShipment?.id || ''),
//         paymentTermsId: String(selectedWO.paymentTermsId || selectedWO?.paymentTerms?.id || ''),
//         termsConditionsId: String(selectedWO.termsConditionsId || selectedWO?.termsConditions?.id || ''),
//         shipmentTermsId: String(shipmentTermsId || ''),
//         gstType: taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '')
//       }));

//       hydrateBuyerDetails(buyerId ? String(buyerId) : '');
//       hydrateConsigneeDetails(consigneeId ? String(consigneeId) : '');
//     } else {
//       resetFormForOrderChange();
//       setInvoiceData(prev => ({
//         ...prev,
//         woNo: ''
//       }));
//       setSelectedValues(prev => ({
//         ...prev,
//         customerId: '',
//         consgineeId: ''
//       }));
//       hydrateBuyerDetails('');
//       hydrateConsigneeDetails('');
//     }
//   };

//   const saveInvoice = async () => {
//     if (!isFormValid) {
//       toast.error('Please fill all required fields');
//       return;
//     }

//     try {
//       const readActiveCompanyId = () => {
//         try {
//           const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
//           if (!stored) {
//             return null;
//           }
//           const parsed = Number(stored);
//           return Number.isNaN(parsed) ? null : parsed;
//         } catch {
//           return null;
//         }
//       };
//       const activeCompanyId = selectedCompanyId ?? readActiveCompanyId();
//       if (!activeCompanyId) {
//         toast.error("Please select a company before submitting");
//         return;
//       }

//       let documentNumber = invoiceData.invoiceNo || "";

//       if (!invoiceDetail?.id && !documentNumber) {
//         if (!resolvedInvoiceTypeId) {
//           toast.error("Please select an invoice type before submitting");
//           return;
//         }

//         const generated = invoiceNumberService.generateInvoiceNumber({
//           invoiceTypeId: resolvedInvoiceTypeId,
//           invoiceSettings: companyInvoiceSettings,
//           invoices: invoiceArray,
//           companyId: activeCompanyId
//         });

//         if (generated?.invoiceNo) {
//           documentNumber = generated.invoiceNo;
//         }
//       }

//       if (!invoiceDetail?.id && documentNumber) {
//         documentNumber = ensureUniqueInvoiceNumber(applyInvoicePrefix(documentNumber));
//       }

//       if (!documentNumber) {
//         toast.error("Unable to generate invoice number");
//         return;
//       }

//       const firstYarnReference = invoiceData.items.find(item => item.yarnChallanId);
//       const invoiceTypeCodeValue = selectedInvoiceTypeDetail?.value || selectedInvoiceTypeDetail?.code || '';

//       const uniquePackingListNos = Array.from(new Set(invoiceData.items.map(item => item.packingListNo).filter(Boolean)));
//       const topLevelPackingListNo = uniquePackingListNos.join(', ');

//       const payload = {
//         id: invoiceDetail?.id || 0,
//         manufactureId: selectedValues.manufactureId,
//         invoiceDate: invoiceData.date,
//         invoiceNo: documentNumber,
//         invoiceTypeId: resolvedInvoiceTypeId || 0,
//         invoiceType: invoiceTypeCodeValue,
//         salesOrderId: Number(selectedSalesOrder) || 0,
//         yarnSalesOrderId: resolvedYarnSalesOrderId || 0,
//         yarnChallanId: firstYarnReference?.yarnChallanId || 0,
//         sizingWorkOrderId: resolvedSizingWorkOrderId || 0,
//         sizingJobWorkOrderId: resolvedSizingWorkOrderId || 0,
//         ...(
//           isSizingSalesInvoiceType
//             ? {
//                 sizingOrderId: resolvedSizingWorkOrderId || 0,
//                 sjoNo: invoiceData.soNo || '',
//               }
//             : {}
//         ),
//         yarnChallanNo: firstYarnReference?.yarnChallanNo || '',
//         soNo: invoiceData.soNo,
//         woNo: invoiceData.woNo,
//         companyBankId: Number(selectedValues.companyBankId || 0),
//         termsConditionsId: Number(selectedValues.termsConditionsId || 0),
//         paymentTermsId: Number(selectedValues.paymentTermsId || 0),
//         shipToId: Number(selectedValues.shipToId || 0),
//         shipmentMode: Number(selectedValues.shipmentMode || 0),
//         deliveryTermsId: Number(selectedValues.shipmentTermsId || 0),
//         customerId: Number(selectedValues.customerId),
//         consgineeId: Number(selectedValues.consgineeId),
//         warehouseId: Number(selectedValues.warehouseId || 0),
//         agentId: Number(selectedValues.agentId || 0),
//         transportNameId: Number(selectedValues.transportId || 0),
//         gstType: selectedValues.gstType,
//         weavingWorkOrderId: isJobwork ? (Number(selectedWeavingWorkOrderId) || null) : null,

//         // Totals and amounts
//         taxableAmountTotal: sumTaxable,
//         taxAmount: sumGst,
//         additionTotal: addSumAbs,
//         discountTotal: discSumAbs,
//         netAdditionDiscount: netAddDisc,
//         roundOff: normalizedRoundOff,
//         totalAmount: finalAmount,
//         comments: invoiceData.comments,
//         activeFlag: true,

//         // Addition / Discount
//         additional: invoiceData.additional,
//         less: invoiceData.less,
//         addDiscItems: (addDiscItems || []).map(({ id, description, type, mode, percValue, amount }) => ({ id, description, type, mode, percValue, amount })),
//         addDiscDrafts: (addDiscDrafts || []).map(({ id, description, type, mode, percValue, amount }) => ({ id, description, type, mode, percValue, amount })),

//         // Parties and display fields
//         manufacturer: { ...invoiceData.manufacturer },
//         buyer: { ...invoiceData.buyer },
//         consignee: { ...invoiceData.consignee },
//         termsAndConditions: invoiceData.termsAndConditions,
//         paymentTerms: invoiceData.paymentTerms,
//         shipVia: invoiceData.shipVia,
//         // transportName: invoiceData.transportName,
//         deliveryNote: invoiceData.deliveryNote,
//         deliveryTerms: shipmentTermsList?.find((st: any) => String(st.id) === String(selectedValues.shipmentTermsId))?.termName || invoiceData.deliveryTerms,
//         vehicleNo: invoiceData.vehicleNo,
//         lrNo: invoiceData.lrNo,
//         lrDate: invoiceData.lrDate,
//         companyBankName: companyBanks.find((b: any) => String(b.id) === String(selectedValues.companyBankId))?.bankName || '',
//         shipmentModeName: shipmentModesList?.find((sm: any) => String(sm.id) === String(selectedValues.shipmentMode))?.modeName || '',
//         termsConditionsName: termsContitionsList?.find((tc: any) => String(tc.id) === String(selectedValues.termsConditionsId))?.termsConditionsName || '',
//         paymentTermsName: paymentTermsList?.find((pt: any) => String(pt.id) === String(selectedValues.paymentTermsId))?.termName || '',
//         agentName: Array.isArray(employeeList) ? (employeeList.find((a: any) => String(a.id) === String(selectedValues.agentId))?.employeeName || '') : '',
//         warehouseName: normalizedWarehouseList.find((w: any) => String(w.id) === String(selectedValues.warehouseId))?.warehouseName || '',
//         transportName: transportsArr?.find((t: any) => String(t.id) === String(selectedValues.transportId))?.transportName || invoiceData.transportName || '',

//         // GST breakdown and state codes
//         gstPercent: gstPerc,
//         cgstPercent: cgstPerc,
//         sgstPercent: sgstPerc,
//         igstPercent: igstPerc,
//         buyerStateCode: buyerStateCode,
//         companyStateCode: companyStateCode,

//         // Line items
//         items: invoiceData.items.map(item => {
//           const resolvedFabricMasterId = deriveInvoiceItemFabricMasterId(item);
//           return {
//             id: item.id || 0,
//             invoiceId: invoiceDetail?.id || 0,
//             fabricMasterId: resolvedFabricMasterId,
//             productName: item.productName,
//             productDescription: item.productName || '',
//             quantity: item.quantity,
//             noOfRolls: item.noOfRolls || 0,
//             uom: item.uom,
//             rate: item.rate,
//             amount: item.amount,
//             gstPercent: item.gstPercent,
//             hsnCode: Number(item.hsnCode) || 0,
//             taxableAmount: item.taxableAmount,
//             gstAmount: item.gstAmount,
//             totalAmount: item.totalAmount,
//             isReadOnlyQuantity: item.isReadOnlyQuantity,
//             packingListNo: item.packingListNo || '',
//             yarnChallanId: item.yarnChallanId || 0,
//             yarnChallanNo: item.yarnChallanNo || '',
//             yarnId: item.yarnId || 0,
//             isInvoice: 1,
//           };
//         }),
//         sizingSalesItems: isSizingSalesInvoiceType 
//           ? invoiceData.items.map(item => ({
//               id: item.id || 0,
//               invoiceId: invoiceDetail?.id || 0,
//               beamOutwardNo: item.packingListNo || '',
//               yarnName: item.productName || '',
//               noOfBeams: item.noOfRolls || 0,
//               beamMeters: item.beamMeters || 0,
//               netWeight: item.netWeight || item.quantity || 0,
//               totalEnds: item.totalEnds || 0,
//               activeFlag: true
//             }))
//           : [],

//         // Summary snapshot
//         invoiceSummary: {
//           taxableAmount: sumTaxable,
//           gstAmount: sumGst,
//           addition: addSumAbs,
//           discount: discSumAbs,
//           roundOff: normalizedRoundOff,
//           finalAmount: finalAmount
//         },
//         companyId: activeCompanyId,
//         isInvoice: 1,
//         isJobwork: isJobwork ? 1 : 0,
//         packingListNo: topLevelPackingListNo,
//       };
//       console.log('Payload for saving invoice:', payload);
//       if (invoiceDetail?.id) {
//         // alert(JSON.stringify(payload));
//         const result = await dispatch(updateInvoiceByCompanyId({ 
//           id: invoiceDetail.id, 
//           companyId: activeCompanyId, 
//           data: payload 
//         }));
//         if (updateInvoiceByCompanyId.fulfilled.match(result)) {
//           navigate("/transaction/invoice-management");
//         }
//       } else {
//         const result = await dispatch(createInvoice(payload));
//         if (createInvoice.fulfilled.match(result)) {
//           navigate("/transaction/invoice-management");
//         }
//       }
//     } catch (error) {
//       toast.error(invoiceDetail?.id ? 'Failed to update invoice' : 'Failed to save invoice');
//       console.error('Error saving invoice:', error);
//     }
//   };


//   const downloadInvoice = async () => {
//     // const element = document.getElementById('invoice-content');
//     // if (!element) return;

//     // try {
//     //   // @ts-ignore - Temporarily ignore type issues
//     //   const html2canvas = (await import('html2canvas')).default;
//     //   // @ts-ignore - Temporarily ignore type issues
//     //   const { jsPDF } = await import('jspdf');

//     //   const canvas = await html2canvas(element);
//     //   const pdf = new jsPDF('p', 'mm', 'a4');
//     //   pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297); // A4 dimensions
//     //   pdf.save(`invoice_${invoiceData.invoiceNo}.pdf`);
//     // } catch (error) {
//     //   toast.error('Failed to generate PDF');
//     //   console.error('Error generating PDF:', error);
//     // }
//   };


//   const togglePackingSelect = (rawId: string | number) => {
//     const id = normalizePackingSelectionId(rawId);
//     if (!id) {
//       return;
//     }
//     setSelectedPackingIds(prev =>
//       prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
//     );
//   };

//   const importSelected = () => {
//     const modalLines = isYarnSalesInvoiceType 
//       ? yarnChallanLines 
//       : isSizingSalesInvoiceType 
//         ? sizingBeamOutwardLines 
//         : packingLines;
//     const selectedIdSet = new Set(selectedPackingIds);
//     const selected = modalLines.filter(l => {
//       const normalizedId = normalizePackingSelectionId(l.id);
//       return normalizedId ? selectedIdSet.has(normalizedId) : false;
//     });
//     if (selected.length === 0) {
//       toast.error('Select at least one packing list line');
//       return;
//     }

//     if (isYarnSalesInvoiceType) {
//       const yarnLines = selected as YarnChallanLine[];
//       const expandedLines = yarnLines.flatMap((line) =>
//         Array.isArray(line.childItems) && line.childItems.length > 0 ? line.childItems : [line]
//       );
//       const lineWithGst = expandedLines.find(line => line.gstPercentId !== undefined && line.gstPercentId !== null);
//       if (lineWithGst?.gstPercentId !== undefined && lineWithGst?.gstPercentId !== null) {
//         setActiveGstPercentId(String(lineWithGst.gstPercentId));
//         applyGstFromMaster(lineWithGst.gstPercentId, selectedValues.gstType, lineWithGst.gstPercent);
//       }

//       const newItems: InvoiceItem[] = expandedLines.map((line, index) => {
//   // Find the parent challan and the specific item for accurate itemName
//   const parentChallan = yarnChallanArr.find((c: any) => c.challanNo === line.challanNo);
//   const challanItem = parentChallan?.items?.find((i: any) => i.id === line.itemId);

//   const productName = challanItem?.itemName || 
//                       challanItem?.yarn?.yarnName || 
//                       line.itemName || 
//                       'Yarn Item';
//   const derivedYarnFabricMasterId = resolveFabricMasterIdFromProductName(productName);

//   const quantity = Number(line.quantity) || 0;
//  const rate = roundToTwoDecimals(Number(line.rate) || 0);
//         const gstPercent = Number(line.gstPercent || gstPerc || 0);
//         const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);

//   return {
//     id: Date.now() + index,
//     productName: productName,
//     quantity,
//     uom: line.uom || 'Kg',
//    rate,
//           amount: totalAmount,
//           gstPercent,
//           taxableAmount,
//           gstAmount,
//           totalAmount,
//           isReadOnlyQuantity: true,
//           fabricMasterId: derivedYarnFabricMasterId || 0,
//           packingListNo: '',
//           noOfRolls: undefined,
//           hsnCode: line.hsnCode || '',
//     yarnChallanId: line.challanId,
//     yarnChallanNo: line.challanNo,
//       yarnId: line.yarnId,
//   };
// });

//       // const newItems: InvoiceItem[] = expandedLines.map((line, index) => {
//       //   const quantity = Number(line.quantity) || 0;
//       //   const rate = roundToTwoDecimals(Number(line.rate) || 0);
//       //   const gstPercent = Number(line.gstPercent || gstPerc || 0);
//       //   const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);

//       //   return {
//       //     id: Date.now() + index,
//       //     productName: line.itemName || 'Yarn Item',
//       //     quantity,
//       //     uom: line.uom || 'Kg',
//       //     rate,
//       //     amount: totalAmount,
//       //     gstPercent,
//       //     taxableAmount,
//       //     gstAmount,
//       //     totalAmount,
//       //     isReadOnlyQuantity: true,
//       //     fabricMasterId: 0,
//       //     packingListNo: '',
//       //     noOfRolls: undefined,
//       //     hsnCode: line.hsnCode || '',
//       //     yarnChallanId: line.challanId,
//       //     yarnChallanNo: line.challanNo,
//       //     yarnId: line.yarnId,
//       //   };
//       // });

//       setInvoiceData(prev => ({ ...prev, items: mergeInvoiceItems(prev.items, newItems) }));
//       setSelectedPackingIds([]);
//       setShowPackingModal(false);
//       return;
//     }

//     if (isSizingSalesInvoiceType) {
//       const sizingSelected = selected as SizingBeamOutwardLine[];
//       const sizingOrderNos = new Set(sizingSelected.map(l => l.sizingOrderNo).filter(Boolean));
//       if (sizingOrderNos.size > 1) {
//         toast.error('All selected lines must be from the same sizing order');
//         return;
//       }

//       const sizingOrderNo = Array.from(sizingOrderNos)[0] || '';
//       const sizingOrderId = sizingSelected[0]?.sizingOrderId;

//       if (sizingOrderId) {
//         if (invoiceData.soNo && invoiceData.soNo !== sizingOrderNo) {
//           toast.error('Selected packing from different Sizing Order');
//           return;
//         }
//         setSelectedSizingWorkOrderId(String(sizingOrderId));
//       }
//       setInvoiceData(prev => ({ ...prev, soNo: sizingOrderNo }));

//       const newItems: InvoiceItem[] = sizingSelected.map((line, index) => {
//         const quantity = Number(line.netWeight) || 0;
//         const beamMeters = Number(line.beamMeters) || 0;
//         const rate = Number(line.rate || selectedSizingWorkOrder?.sizingRatePerKg || 0);

//         // Fetch GST from Yarn Master
//         const yarnFromMaster = line.yarnId ? yarnMasterArr.find((y: any) => Number(y.id) === line.yarnId) : null;
//         const yarnGstPercent = yarnFromMaster ? Number(yarnFromMaster.gstPercent) : 0;
//         const yarnHsnCode = yarnFromMaster ? String(yarnFromMaster.hsnCode || '') : '';

//         const gstPercent = Number(gstPerc || line.gstPercent || yarnGstPercent || 0);
//         const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);

//         return {
//           id: Date.now() + index,
//           productName: line.yarnName || 'Sizing Yarn',
//           quantity,
//           uom: 'Kg',
//           rate,
//           amount: totalAmount,
//           gstPercent,
//           taxableAmount,
//           gstAmount,
//           totalAmount,
//           isReadOnlyQuantity: true,
//           noOfRolls: line.noOfBeams,
//           hsnCode: yarnHsnCode,
//           yarnChallanId: 0,
//           yarnChallanNo: '',
//           packingListNo: line.sizingBeamOutwardNo || '',
//           fabricMasterId: 0,
//           yarnId: line.yarnId,
//           beamMeters: beamMeters,
//           netWeight: quantity, // Using the quantity which was set to line.netWeight
//           totalEnds: line.totalEnds,
//         } as InvoiceItem;
//       });

//       setInvoiceData(prev => ({ ...prev, items: mergeInvoiceItems(prev.items, newItems) }));
//       setSelectedPackingIds([]);
//       setShowPackingModal(false);
//       return;
//     }

//     const packingSelected = selected as PackingLine[];

//     if (isJobwork) {
//       const woNos = new Set(packingSelected.map(l => l.weavingOrderNo).filter(Boolean));
//       if (woNos.size > 1) {
//         toast.error('All selected lines must be from the same weaving order');
//         return;
//       }

//       const woNo = Array.from(woNos)[0] || '';
//       const woId = packingSelected[0]?.weavingWorkOrderId;

//       if (woId) {
//         if (invoiceData.woNo && invoiceData.woNo !== woNo) {
//           toast.error('Selected packing from different Weaving Order');
//           return;
//         }

//         setSelectedWeavingWorkOrderId(String(woId));
//       }

//       setInvoiceData(prev => ({ ...prev, woNo }));
//     } else {
//       const soNos = new Set(packingSelected.map(l => l.salesOrderNo).filter(Boolean));
//       if (soNos.size > 1) {
//         toast.error('All selected lines must be from the same sales order');
//         return;
//       }

//       const soNo = Array.from(soNos)[0] || '';
//       const soId = packingSelected[0]?.salesOrderId;

//       if (soId) {
//         if (invoiceData.soNo && invoiceData.soNo !== soNo) {
//           toast.error('Selected packing from different Sales Order');
//           return;
//         }

//         setSelectedSalesOrder(String(soId));
//       }

//       setInvoiceData(prev => ({ ...prev, soNo }));
//     }

//     const newItems: InvoiceItem[] = packingSelected.map((line: PackingLine, index: number) => {
//   // Find the original packing record to get accurate fabricCode and quality
//   const packingRecord = normalizedPackingList.find(
//     (p: any) => p.packingSlipNo === line.rollNo || p.rollNo === line.rollNo
//   );

//   const fabricCode = packingRecord?.fabricCode || '';
//   const quality = packingRecord?.fabricQuality || packingRecord?.quality || '';

//   // Construct product name from the fetched data, or fallback to the line property
//   const productName = fabricCode || quality 
//     ? `${fabricCode}${fabricCode && quality ? ' - ' : ''}${quality}`.trim()
//     : line.fabricCodeQuality;

//   const quantity = Number(line.quantity) || 0;
//     const derivedRate = deriveRateFromSalesOrder(productName);
//     const derivedUom = deriveUomFromSalesOrder(productName);
//     const jobworkDetails = isJobwork ? deriveWeavingOrderItemDetails(line) : null;
//     const rate = jobworkDetails?.rate ?? derivedRate ?? roundToTwoDecimals(Number(line.rate) || 0);
//     const uom = jobworkDetails?.uom ?? derivedUom ?? (line.uom || 'Mtrs');
//     const gstPercent = Number(gstPerc || line.gstPercent || 0);
//     const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);

//     const fabricMaster = fabricMasterArr.find((fm: any) => 
//       fm?.fabricCode === fabricCode || fm?.fabricCode === fabricCode?.trim()
//     );
//     const resolvedDirectFabricMasterId = Number(line.fabricMasterId || fabricMaster?.id || fabricMaster?.fabricMasterId || 0);
//     const resolvedProductFabricMasterId = resolveFabricMasterIdFromProductName(productName);
//     const fabricMasterId = !Number.isNaN(resolvedDirectFabricMasterId) && resolvedDirectFabricMasterId > 0
//       ? resolvedDirectFabricMasterId
//       : resolvedProductFabricMasterId ?? 0;

//   return {
//     id: Date.now() + index,
//     productName: productName || 'No Description',
//     quantity,
//       uom,
//       rate,
//       amount: totalAmount,
//       gstPercent,
//       taxableAmount,
//       gstAmount,
//       totalAmount,
//       isReadOnlyQuantity: true,
//       noOfRolls: line.noOfRolls,
//       hsnCode: '',
//       yarnChallanId: 0,
//       yarnChallanNo: '',
//     packingListNo: line.rollNo || '',
//     fabricMasterId: fabricMasterId,
//   };
// });

//   // const newItems: InvoiceItem[] = packingSelected.map((line: PackingLine, index: number) => {
//   //   const [fabricCode, quality] = line.fabricCodeQuality.split(' - ');
//   //   const productName = `${fabricCode || ''} - ${quality || ''}`.trim();
//   //   const quantity = Number(line.quantity) || 0;
//   //   const derivedRate = deriveRateFromSalesOrder(productName);
//   //   const derivedUom = deriveUomFromSalesOrder(productName);
//   //   const jobworkDetails = isJobwork ? deriveWeavingOrderItemDetails(line) : null;
//   //   const rate = jobworkDetails?.rate ?? derivedRate ?? roundToTwoDecimals(Number(line.rate) || 0);
//   //   const uom = jobworkDetails?.uom ?? derivedUom ?? (line.uom || 'Mtrs');
//   //   const gstPercent = Number(gstPerc || line.gstPercent || 0);
//   //   const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);

//   //   const fabricMaster = fabricMasterArr.find((fm: any) => 
//   //     fm?.fabricCode === fabricCode || fm?.fabricCode === fabricCode?.trim()
//   //   );
//   //   const fabricMasterId = line.fabricMasterId || fabricMaster?.id || 0;

//   //   return {
//   //     id: Date.now() + index,
//   //     productName: productName || line.fabricCodeQuality,
//   //     quantity,
//   //     uom,
//   //     rate,
//   //     amount: totalAmount,
//   //     gstPercent,
//   //     taxableAmount,
//   //     gstAmount,
//   //     totalAmount,
//   //     isReadOnlyQuantity: true,
//   //     fabricMasterId: fabricMasterId,
//   //     packingListNo: line.rollNo || '',
//   //     noOfRolls: line.noOfRolls,
//   //     hsnCode: '',
//   //     yarnChallanId: 0,
//   //     yarnChallanNo: ''
//   //   };
//   // });
//     setInvoiceData(prev => ({ ...prev, items: mergeInvoiceItems(prev.items, newItems) }));
//     setSelectedPackingIds([]);
//     setShowPackingModal(false);
//   };

//   const handleItemChange = (id: number, field: keyof InvoiceItem, value: any) => {
//     setInvoiceData(prev => ({
//       ...prev,
//       items: prev.items.map(item => {
//         if (item.id !== id) return item;
//         let updatedItem = { ...item, [field]: value };

//         const quantity = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
//         let rate = field === 'rate' ? roundToTwoDecimals(Number(value) || 0) : roundToTwoDecimals(Number(item.rate) || 0);
//         const gstPercent = field === 'gstPercent' ? value : Number(item.gstPercent);

//         if (field === 'productName') {
//           const derivedDetails = deriveSalesOrderItemDetails(String(value || ''));
//           if (derivedDetails?.rate != null) {
//             rate = derivedDetails.rate;
//             updatedItem = { ...updatedItem, rate: derivedDetails.rate };
//           }
//           if (derivedDetails?.uom) {
//             updatedItem = { ...updatedItem, uom: derivedDetails.uom };
//           }
//         }

//         const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);
//         updatedItem = {
//           ...updatedItem,
//           quantity,
//           rate,
//           gstPercent,
//           taxableAmount,
//           gstAmount,
//           totalAmount,
//           amount: totalAmount,
//         };
//         return updatedItem;
//       }),
//     }));
//   };

//   const removeItem = (id: number) => {
//     setInvoiceData(prev => ({
//       ...prev,
//       items: prev.items.filter(item => item.id !== id)
//     }));
//   };

//   // Recompute saved Add/Disc amounts when taxable changes
//   useEffect(() => {
//     setAddDiscItems(prev => prev.map(item => {
//       const sign = item.type === 'discount' ? -1 : 1;
//       if (item.mode === 'percentage') {
//         const basis = Number(item.percValue) || 0;
//         const amt = sumTaxable * (basis / 100) * sign;
//         return { ...item, amount: Math.round(amt * 100) / 100 };
//       } else {
//         const val = Number(item.percValue) || 0;
//         const amt = Math.abs(val) * sign;
//         return { ...item, amount: Math.round(amt * 100) / 100 };
//       }
//     }));
//   }, [sumTaxable]);

//   // Keep Additional/Discount sections in sync only when there are saved items
//   useEffect(() => {
//     if (addDiscItems.length > 0) {
//       setInvoiceData(prev => ({
//         ...prev,
//         additional: Math.round(addSumAbs * 100) / 100,
//         less: Math.round(discSumAbs * 100) / 100,
//       }));
//     }
//   }, [addSumAbs, discSumAbs, addDiscItems.length]);

//   // Auto-calculate Round Off to nearest integer of pre-round total
//   useEffect(() => {
//     if (invoiceDetail) return;
//     if (isRoundOffLocked) return;
//     const raw = sumTaxable + sumGst + netAddDisc;
//     const ro = Math.round(raw) - raw;
//     setRoundOff(Math.round(ro * 100) / 100);
//   }, [sumTaxable, sumGst, netAddDisc, isRoundOffLocked, invoiceDetail]);

//   const addAddDiscItem = () => {
//     const all = [...addDiscItems, ...addDiscDrafts];
//     const newId = all.length > 0 ? Math.max(...all.map(item => item.id)) + 1 : 1;

//     const newItem: AddDiscItem = {
//       id: newId,
//       description: '',
//       type: 'addition',
//       mode: 'value',
//       percValue: 0,
//       amount: 0
//     };

//     setAddDiscDrafts(prev => [...prev, newItem]);
//   };

//   const handleAddDiscDraftChange = (id: number, field: keyof AddDiscItem, value: any) => {
//     setAddDiscDrafts(prev => prev.map(item => {
//       if (item.id === id) {
//         const updated = { ...item, [field]: value } as AddDiscItem;
//         const sign = updated.type === 'discount' ? -1 : 1;

//         if (updated.mode === 'percentage') {
//           const basisValue = Number(updated.percValue) || 0;
//           const amt = sumTaxable * (basisValue / 100) * sign;
//           updated.amount = Math.round(amt * 100) / 100;
//         } else {
//           if (field === 'percValue') {
//             const amt = Number(value) || 0;
//             updated.amount = Math.round((Math.abs(amt) * sign) * 100) / 100;
//           } else if (field === 'type' || field === 'mode') {
//             const val = Number(updated.percValue) || 0;
//             updated.amount = Math.round((Math.abs(val) * sign) * 100) / 100;
//           }
//         }

//         return updated;
//       }
//       return item;
//     }));
//   };

//   const removeDraftAddDiscItem = (id: number) => {
//     setAddDiscDrafts(prev => prev.filter(item => item.id !== id));
//   };

//   const saveAddDiscDrafts = () => {
//     const cleaned = addDiscDrafts.filter(d => (d.description || '').trim() !== '');
//     setAddDiscItems(prev => [...prev, ...cleaned]);
//     setAddDiscDrafts([]);
//   };

//   const updateSavedAddDiscItem = (id: number) => {
//     const item = addDiscItems.find(i => i.id === id);
//     if (!item) return;
//     setAddDiscDrafts(prev => [...prev, { ...item }]);
//     setAddDiscItems(prev => prev.filter(i => i.id !== id));
//   };

//   const removeAddDiscItem = (id: number) => {
//     setAddDiscItems(prev => prev.filter(item => item.id !== id));
//   };

//   // const openPackingModal = () => {
//   //   if (isYarnSalesInvoiceType) {
//   //     if (!selectedYarnSalesOrderId) {
//   //       toast.error('Please select Yarn Sales Order first');
//   //       return;
//   //     }
//   //   } else if (isJobwork) {
//   //     if (!selectedWeavingWorkOrderId) {
//   //       toast.error('Please select Weaving Order first');
//   //       return;
//   //     }
//   //   } else {
//   //     if (!selectedSalesOrder) {
//   //       toast.error('Please select Sales Order first');
//   //       return;
//   //     }
//   //   }

//   //   if (!selectedValues.warehouseId) {
//   //     toast.error('Please select Warehouse first');
//   //     return;
//   //   }

//   //   dispatch(getAllGeneratePacking({
//   //     companyId: selectedCompanyId ?? loggedInCompanyId ?? undefined,
//   //     salesOrderId: !isJobwork && !isYarnSalesInvoiceType ? selectedSalesOrder : undefined,
//   //     weavingWorkOrderId: isJobwork ? selectedWeavingWorkOrderId : undefined,
//   //     yarnSalesOrderId: isYarnSalesInvoiceType ? selectedYarnSalesOrderId : undefined,
//   //     warehouseId: selectedValues.warehouseId
//   //   }));

//   //   setShowPackingModal(true);
//   // };
// const openPackingModal = () => {
//   if (isYarnSalesInvoiceType) {
//     if (!selectedYarnSalesOrderId) {
//       toast.error('Please select Yarn Sales Order first');
//       return;
//     }
//   } else if (isJobwork) {
//     if (!selectedWeavingWorkOrderId) {
//       toast.error('Please select Weaving Order first');
//       return;
//     }
//   } else if (isSizingSalesInvoiceType) {
//     if (!selectedSizingWorkOrderId) {
//       toast.error('Please select Sizing Work Order first');
//       return;
//     }
//   } else {
//     if (!selectedSalesOrder) {
//       toast.error('Please select Sales Order first');
//       return;
//     }
//   }

//   if (!selectedValues.warehouseId) {
//     toast.error('Please select Warehouse first');
//     return;
//   }

//   // Build filter parameters
//   const filterParams: any = {
//     companyId: selectedCompanyId ?? loggedInCompanyId ?? undefined,
//     warehouseId: selectedValues.warehouseId
//   };

//   // Add order-specific filters
//   if (isJobwork) {
//     filterParams.weavingWorkOrderId = selectedWeavingWorkOrderId;
//     filterParams.isJobwork = 1;
//   } else if (isYarnSalesInvoiceType) {
//     filterParams.yarnSalesOrderId = selectedYarnSalesOrderId;
//   } else if (isSizingSalesInvoiceType) {
//     filterParams.sizingOrderId = selectedSizingWorkOrderId;
//   } else {
//     filterParams.salesOrderId = selectedSalesOrder;
//     filterParams.isJobwork = 0;
//   }

//   console.log('Fetching packing with filters:', filterParams);

//   // Fetch with proper filters
//   if (isSizingSalesInvoiceType) {
//     dispatch(getAllSizingBeamOutward({ companyId: selectedCompanyId ?? loggedInCompanyId ?? undefined }));
//   } else {
//     dispatch(getAllGeneratePacking(filterParams));
//   }

//   setShowPackingModal(true);
// };

//   return (
//     <div className="p-6 pt-16">
//       <div className="p-6 bg-white shadow-md rounded-lg" id="invoice-content">
//         {/* Header */}
//         <header className="bg-white shadow-sm border-b">
//           <div className=" px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
//             <div className="flex items-center space-x-3">
//               <div className="flex items-center space-x-4 mb-3">                                         <Button
//                 variant="outline"
//                 onClick={() => navigate("/transaction/invoice-management")}
//                 className="mr-auto"
//               >
//                 <ArrowLeft size={18} className="mr-2" />
//                 Back
//               </Button>
//               </div>
//               <FileText className="h-6 w-6 text-blue-600" />

//               <h1 className="text-xl font-semibold text-gray-900">Invoice</h1>
//             </div>
//             <div className="flex space-x-4">
//               {/* <button
//                 onClick={saveInvoice}
//                 disabled={loading || !isFormValid}
//                 className={`px-3 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-1 text-sm hover:bg-blue-700 ${loading || !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
//                   }`}
//               >
//                 <Save className="h-4 w-4" />
//                 <span>{loading ? 'Saving...' : 'Save'}</span>
//               </button> */}
//               <button
//                 onClick={downloadInvoice}
//                 className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center space-x-1 text-sm hover:bg-gray-200"
//               >
//                 <Printer className="h-4 w-4" />
//                 <span>Download PDF</span>
//               </button>
//               <button className="px-3 py-2 bg-red-600 text-white rounded-md flex items-center space-x-1 text-sm hover:bg-red-700" onClick={() => navigate("/transaction/invoice-management")}>
//                 <Trash2 className="h-4 w-4" />
//                 <span>Cancel Invoice</span>
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* Main content */}
//         <div className="mt-10">
//           <div className="bg-white shadow rounded-lg overflow-hidden">
//             {/* Invoice header section */}
//             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   By <span className="text-red-500">*</span>
//                 </label>
//                 <div className="flex mb-4">
//                   <select
//                     className="rounded-l-md border border-r-0 border-gray-300 py-2 px-3 text-sm w-full focus:ring-blue-500 focus:border-blue-500"
//                     value="Manufacturer"
//                   >
//                     <option value="Manufacturer">Manufacturer</option>
//                     <option value="Other">Other</option>
//                   </select>
//                   <button className="bg-gray-100 border border-gray-300 rounded-r-md p-2">
//                     <ChevronsUpDown className="h-4 w-4 text-gray-500" />
//                   </button>
//                 </div>
//                 <textarea
//                   className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//                   rows={4}
//                   value={`${invoiceData.manufacturer.name}\n${invoiceData.manufacturer.address}`}
//                   readOnly
//                 />

//                 <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
//                 <textarea
//                   className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//                   rows={2}
//                   value={invoiceData.comments}
//                   onChange={(e) => setInvoiceData(prev => ({ ...prev, comments: e.target.value }))}
//                 />



//                 <div className="grid grid-cols-2 gap-4 mt-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle no</label>
//                     <input
//                       type="text"
//                       className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
//                       value={invoiceData.vehicleNo}
//                       onChange={(e) => setInvoiceData(prev => ({ ...prev, vehicleNo: e.target.value }))}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Terms</label>
//                     <CommonSearchableSelect
//                       name="delivery-terms"
//                       className="w-full"
//                       options={shipmentTermOptions}
//                       placeholder="Select Delivery Terms"
//                       value={selectedValues.shipmentTermsId || ''}
//                       onValueChange={(value) => handleSelectChange('shipmentTermsId', value)}
//                       filterActive
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 mt-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">LR NO</label>
//                     <input
//                       type="text"
//                       className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
//                       value={invoiceData.lrNo}
//                       onChange={(e) => setInvoiceData(prev => ({ ...prev, lrNo: e.target.value }))}
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">LR DATE</label>
//                     <input
//                       type="date"
//                       className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
//                       value={invoiceData.lrDate}
//                       onChange={(e) => setInvoiceData(prev => ({ ...prev, lrDate: e.target.value }))}
//                     />
//                   </div>
//                 </div>
//                   <div className="grid grid-cols-2 gap-4 mt-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note</label>
//                     <input
//                       type="text"
//                       className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
//                       value={invoiceData.deliveryNote}
//                       onChange={(e) => setInvoiceData(prev => ({ ...prev, deliveryNote: e.target.value }))}
//                     />
//                   </div>

//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
//                   <div className="flex">
//                     <input
//                       type="date"
//                       className="rounded-l-md border border-r-0 border-gray-300 py-2 px-3 text-sm w-full focus:ring-blue-500 focus:border-blue-500"
//                       value={invoiceData.date}
//                       onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
//                     />
//                     <button className="bg-gray-100 border border-gray-300 rounded-r-md p-2">
//                       <Calendar className="h-4 w-4 text-gray-500" />
//                     </button>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
//                   <input
//                     type="text"
//                     className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
//                     value={invoiceData.invoiceNo}
//                     readOnly
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type <span className="text-red-500">*</span></label>
//                   <CommonSearchableSelect
//                     name="invoice-type"
//                     className="w-full"
//                     options={invoiceTypeSelectOptions}
//                     placeholder="Select Invoice Type"
//                     value={selectedInvoiceTypeId || ''}
//                     onValueChange={handleInvoiceTypeChange}
//                     filterActive
//                   />
//                 </div>

//                 {shouldShowSalesOrders && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
//                     <CommonSearchableSelect
//                       name="sales-order"
//                       className="w-full"
//                       options={salesOrderSelectOptions}
//                       placeholder="Select Sales Order"
//                       value={selectedSalesOrder || ''}
//                       onValueChange={handleSalesOrderChange}
//                       filterActive
//                     />
//                   </div>
//                 )}

//                 {shouldShowYarnSalesOrders && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
//                     <CommonSearchableSelect
//                       name="yarn-sales-order"
//                       className="w-full"
//                       options={yarnSalesOrderSelectOptions}
//                       placeholder="Select Yarn Sales Order"
//                       value={selectedYarnSalesOrderId || ''}
//                       onValueChange={handleYarnSalesOrderChange}
//                       filterActive
//                     />
//                   </div>
//                 )}

//                 {shouldShowSizingOrders && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
//                     <CommonSearchableSelect
//                       name="sizing-work-order"
//                       className="w-full"
//                       options={sizingWorkOrderSelectOptions}
//                       placeholder="Select Sizing Work Order"
//                       value={selectedSizingWorkOrderId || ''}
//                       onValueChange={handleSizingWorkOrderChange}
//                       filterActive
//                     />
//                   </div>
//                 )}

//                 {shouldShowWeavingOrders && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
//                     <CommonSearchableSelect
//                       name="weaving-order"
//                       className="w-full"
//                       options={weavingOrderSelectOptions}
//                       placeholder="Select Weaving Order"
//                       value={selectedWeavingWorkOrderId || ''}
//                       onValueChange={handleWeavingOrderChange}
//                       filterActive
//                     />
//                   </div>
//                 )}

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Company's Bank</label>
//                   <CommonSearchableSelect
//                     name="company-bank"
//                     className="w-full"
//                     options={bankOptions}
//                     placeholder="Select Bank"
//                     value={selectedValues.companyBankId || ''}
//                     onValueChange={(value) => handleSelectChange('companyBankId', value)}
//                     filterActive
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Terms And Conditions <span className="text-red-500">*</span></label>
//                   <CommonSearchableSelect
//                     name="terms-conditions"
//                     className="w-full"
//                     options={termsConditionsOptions}
//                     filterActive
//                     placeholder="Select Terms and Conditions"
//                     value={selectedValues.termsConditionsId || ''}
//                     onValueChange={(value) => handleSelectChange('termsConditionsId', value)}
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms <span className="text-red-500">*</span></label>
//                   <CommonSearchableSelect
//                     name="payment-terms"
//                     className="w-full"
//                     options={paymentTermOptions}
//                     placeholder="Select Payment Terms"
//                     value={selectedValues.paymentTermsId || ''}
//                     onValueChange={(value) => handleSelectChange('paymentTermsId', value)}
//                     filterActive
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Ship Via <span className="text-red-500">*</span>
//                   </label>
//                   <CommonSearchableSelect
//                     name="ship-via"
//                     className="w-full"
//                     options={shipmentModeOptions}
//                     placeholder="Select Shipment Mode"
//                     value={selectedValues.shipmentMode || ''}
//                     onValueChange={(value) => handleSelectChange('shipmentMode', value)}
//                     filterActive
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Transport Name</label>
//                   <CommonSearchableSelect
//                     name="transport-name"
//                     className="w-full"
//                     options={transportOptions}
//                     placeholder="Select Transport"
//                     value={selectedValues.transportId || ''}
//                     onValueChange={(value) => {
//                       handleSelectChange('transportId', value);
//                       const selectedTransport = transportsArr?.find((t: any) => String(t.id) === String(value));
//                       if (selectedTransport) {
//                         setInvoiceData(prev => ({ ...prev, transportName: selectedTransport.transportName || '' }));
//                       } else {
//                         setInvoiceData(prev => ({ ...prev, transportName: '' }));
//                       }
//                     }}
//                     filterActive
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse <span className="text-red-500">*</span></label>
//                   <CommonSearchableSelect
//                     name="warehouse"
//                     className="w-full"
//                     options={warehouseOptions}
//                     placeholder="Select Warehouse"
//                     value={selectedValues.warehouseId || ''}
//                     onValueChange={(value) => handleSelectChange('warehouseId', value)}
//                     filterActive
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
//                   <CommonSearchableSelect
//                     name="agent"
//                     className="w-full"
//                     options={agentOptions}
//                     placeholder="Select Agent"
//                     value={selectedValues.agentId || ''}
//                     onValueChange={(value) => handleSelectChange('agentId', value)}
//                     filterActive
//                   />
//                 </div>

//                 {!isInternationalInvoiceType && (
//                   <>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
//                       <select
//                         className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
//                         value={selectedValues.gstType}
//                         onChange={(e) => handleSelectChange('gstType', e.target.value)}
//                         disabled
//                       >
//                         <option value="">Auto (from SO)</option>
//                         <option value="1">CGST/SGST</option>
//                         <option value="2">IGST</option>
//                       </select>
//                     </div>
//                     {selectedValues.gstType === '1' && (
//                       <div className="col-span-2 grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">CGST %</label>
//                           <input type="number" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-gray-100" value={cgstPerc} readOnly />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-1">SGST %</label>
//                           <input type="number" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-gray-100" value={sgstPerc} readOnly />
//                         </div>
//                       </div>
//                     )}
//                     {selectedValues.gstType === '2' && (
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">IGST %</label>
//                         <input type="number" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-gray-100" value={igstPerc} readOnly />
//                       </div>
//                     )}
//                   </>
//                 )}

//               </div>
//             </div>

//             {/* Buyer and Consignee section */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Buyer <span className="text-red-500">*</span>
//                 </label>
//                 <div className="mb-2">
//                   <CommonSearchableSelect
//                     name="buyer"
//                     className="w-full"
//                     options={buyerOptions}
//                     placeholder="Select a Buyer"
//                     value={selectedValues.customerId || ''}
//                     onValueChange={(value) => handleSelectChange('customerId', value)}
//                     filterActive
//                   />
//                 </div>
//                 <textarea
//                   className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//                   rows={3}
//                   value={invoiceData.buyer.address}
//                   readOnly
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Consignee <span className="text-red-500">*</span>
//                 </label>
//                 <div className="mb-2">
//                   <CommonSearchableSelect
//                     name="consignee"
//                     className="w-full"
//                     options={consigneeOptions}
//                     placeholder="Select a Consignee"
//                     value={selectedValues.consgineeId || ''}
//                     onValueChange={(value) => handleSelectChange('consgineeId', value)}
//                     filterActive
//                   />
//                 </div>
//                 {/* <input
//                   type="text"
//                   className="w-full mb-2 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Consignee Name"
//                   value={invoiceData.consignee.name}
//                   onChange={(e) => setInvoiceData(prev => ({
//                     ...prev,
//                     consignee: { ...prev.consignee, name: e.target.value }
//                   }))}
//                 /> */}
//                 <textarea
//                   className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
//                   rows={3}
//                   value={invoiceData.consignee.address}
//                   onChange={(e) => setInvoiceData(prev => ({
//                     ...prev,
//                     consignee: { ...prev.consignee, address: e.target.value }
//                   }))}
//                 />
//               </div>
//             </div>

//             {/* Invoice items table */}
//             <Card className="mt-6">
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="flex items-center gap-2"><FileText size={20} />Invoice Item Details</CardTitle>
//                   <Button onClick={openPackingModal} className="bg-primary hover:bg-primary text-white px-4 flex items-center">
//                     <Plus size={18} className="mr-2" />
//                     Add from Packing
//                   </Button>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="overflow-x-auto border-b">
//                   <table className="min-w-full table-fixed divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
//                           Sl. No.
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
//                           {isYarnSalesInvoiceType ? 'Yarn Challan No' : isSizingSalesInvoiceType ? 'Sizing Outward No' : 'Packing Slip No'}
//                         </th>
//                         {isSizingSalesInvoiceType && (
//                           <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
//                             Beam Meters
//                           </th>
//                         )}
//                         {!isYarnSalesInvoiceType && (
//                           <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
//                             {isSizingSalesInvoiceType ? 'No of Beams' : 'No of Rolls'}
//                           </th>
//                         )}
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]">
//                           Product Description <span className="text-red-500">*</span>
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
//                           HSN Code
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
//                           UOM
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
//                           Quantity <span className="text-red-500">*</span>
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
//                           Rate/Unit <span className="text-red-500">*</span>
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
//                           GST %
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
//                           Taxable Amount
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
//                           GST Amount
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
//                           Total Amount
//                         </th>
//                         <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
//                           Actions
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {invoiceData.items.length === 0 ? (
//                         <tr>
//                           <td colSpan={itemTableColumnCount} className="px-4 py-4 text-center text-sm text-gray-500">
//                             No items added. Please add at least one item.
//                           </td>
//                         </tr>
//                       ) : (
//                         invoiceData.items.map((item, index) => (
//                           <tr key={item.id}>
//                             <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
//                               {index + 1}
//                             </td>
//                             <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
//                               {isYarnSalesInvoiceType ? (item.yarnChallanNo || '-') : (item.packingListNo || '-')}
//                             </td>
//                             {isSizingSalesInvoiceType && (
//                               <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
//                                 {item.beamMeters || '-'}
//                               </td>
//                             )}
//                             {!isYarnSalesInvoiceType && (
//                               <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
//                                 {item.noOfRolls || '-'}
//                               </td>
//                             )}
//                             <td className="px-4 py-2 whitespace-nowrap">
//                               <input
//                                 type="text"
//                                 className={`w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${!item.productName ? 'border-red-500' : ''}`}
//                                 value={item.productName}
//                                 onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
//                                 required
//                               />
//                             </td>
//                             <td className="px-4 py-2 whitespace-nowrap">
//                               <input
//                                 type="number"
//                                 className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
//                                 value={item.hsnCode ?? ''}
//                                 onChange={(e) => handleItemChange(item.id, 'hsnCode', e.target.value)}
//                                 min="0"
//                               />
//                             </td>
//                             <td className="px-4 py-2 whitespace-nowrap">
//                               <select
//                                 className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
//                                 value={item.uom}
//                                 onChange={(e) => handleItemChange(item.id, 'uom', e.target.value)}
//                               >
//                                 {Array.isArray(uomList) && uomList.map((u: any) => (
//                                   <option key={u.id} value={u.uomName}>{u.uomName}</option>
//                                 ))}
//                               </select>
//                             </td>
//                             <td className="px-4 py-2 whitespace-nowrap">
//                               <input
//                                 type="number"
//                                 className={`w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${item.quantity <= 0 ? 'border-red-500' : ''} ${item.isReadOnlyQuantity ? 'bg-gray-100' : ''}`}
//                                 value={item.quantity}
//                                 onChange={(e) => !item.isReadOnlyQuantity && handleItemChange(item.id, 'quantity', Number(e.target.value))}
//                                 min="0"
//                                 step="0.01"
//                                 required
//                                 readOnly={item.isReadOnlyQuantity}
//                               />
//                             </td>
//                             <td className="px-4 py-2 whitespace-nowrap">
//                               <input
//                                 type="number"
//                                 className={`w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${item.rate <= 0 ? 'border-red-500' : ''}`}
//                                 value={item.rate}
//                                 onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
//                                 min="0"
//                                 step="0.01"
//                                 required
//                               />
//                             </td>
//                              <td className="px-4 py-2 whitespace-nowrap">
//                               <input
//                                 type="number"
//                                 className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
//                                 value={item.gstPercent ?? ''}
//                                 onChange={(e) => handleItemChange(item.id, 'gstPercent', e.target.value)}
//                                 min="0"
//                               />
//                             </td>
//                             {/* <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
//                               <input
//                                 type="number"
//                                 className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
//                                 value={item.gstPercent}
//                                 onChange={(e) => handleItemChange(item.id, 'gstPercent', Number(e.target.value))}
//                                 min="0"
//                                 step="0.01"
//                               />
//                             </td> */}

//                             <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
//                               Rs. {item.taxableAmount.toLocaleString()}
//                             </td>
//                             <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
//                               Rs. {item.gstAmount.toLocaleString()}
//                             </td>
//                             <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
//                               Rs. {item.totalAmount.toLocaleString()}
//                             </td>
//                             <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
//                               <button
//                                 onClick={() => removeItem(item.id)}
//                                 className="text-red-600 hover:text-red-900"
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                               </button>
//                             </td>
//                           </tr>
//                         ))
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Addition / Discount table */}
//             <Card className="mt-6">
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="flex items-center gap-2"><FileText size={20} />Addition / Discount</CardTitle>
//                   <div className="flex items-center gap-2">
//                     <Button onClick={addAddDiscItem} className="bg-primary hover:bg-primary text-white px-3 py-1 text-xs flex items-center">
//                       <Plus size={14} className="mr-1" />
//                       Add Row
//                     </Button>
//                     <Button onClick={saveAddDiscDrafts} className="bg-primary hover:bg-primary text-white px-3 py-1 text-xs">Save</Button>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full text-sm">
//                     <thead className="bg-blue-50">
//                       <tr>
//                         <th className="px-3 py-2 text-left font-semibold">S.No</th>
//                         <th className="px-3 py-2 text-left font-semibold">Name</th>
//                         <th className="px-3 py-2 text-left font-semibold">Type</th>
//                         <th className="px-3 py-2 text-left font-semibold">Basis</th>
//                         <th className="px-3 py-2 text-left font-semibold">Value/Percentage</th>
//                         <th className="px-3 py-2 text-left font-semibold">Amount</th>
//                         <th className="px-3 py-2 text-left font-semibold">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {addDiscDrafts.map((item, index) => (
//                         <tr key={item.id}>
//                           <td className="px-3 py-2 text-sm text-gray-900">{index + 1}</td>
//                           <td className="px-3 py-2">
//                             <div className="relative">
//                               <input
//                                 type="text"
//                                 className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
//                                 value={item.description}
//                                 autoComplete="off"
//                                 onFocus={() => { setDescSuggestForId(item.id); setDescActiveSuggestionIndex(-1); }}
//                                 onBlur={() => { setTimeout(() => { setDescSuggestForId((prev) => (prev === item.id ? null : prev)); setDescActiveSuggestionIndex(-1); }, 200); }}
//                                 onKeyDown={(e) => handleDescKeyDown(e, item.id)}
//                                 onChange={(e) => handleAddDiscDraftChange(item.id, 'description', e.target.value)}
//                               />
//                               {descSuggestForId === item.id && getFilteredDescSuggestions(item.description || '').length > 0 && (
//                                 <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
//                                   {getFilteredDescSuggestions(item.description || '').map((s, sIdx) => (
//                                     <li
//                                       key={s}
//                                       className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${sIdx === descActiveSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''}`}
//                                       onMouseEnter={() => setDescActiveSuggestionIndex(sIdx)}
//                                       onMouseDown={(e) => e.preventDefault()}
//                                       onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddDiscDraftChange(item.id, 'description', s); setDescSuggestForId(null); setDescActiveSuggestionIndex(-1); }}
//                                     >
//                                       {s}
//                                     </li>
//                                   ))}
//                                 </ul>
//                               )}
//                             </div>
//                           </td>
//                           <td className="px-3 py-2">
//                             <select
//                               value={item.type}
//                               onChange={(e) => handleAddDiscDraftChange(item.id, 'type', e.target.value)}
//                               className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
//                             >
//                               <option value="addition">Addition</option>
//                               <option value="discount">Discount</option>
//                             </select>
//                           </td>
//                           <td className="px-3 py-2">
//                             <select
//                               value={item.mode}
//                               onChange={(e) => handleAddDiscDraftChange(item.id, 'mode', e.target.value)}
//                               className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
//                             >
//                               <option value="percentage">Percentage</option>
//                               <option value="value">Value</option>
//                             </select>
//                           </td>
//                           <td className="px-3 py-2">
//                             <input
//                               type="number"
//                               className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
//                               value={item.percValue}
//                               onChange={(e) => handleAddDiscDraftChange(item.id, 'percValue', Number(e.target.value))}
//                               step="0.01"
//                             />
//                           </td>
//                           <td className={`px-3 py-2 text-sm text-gray-900 text-center ${item.amount < 0 ? 'text-red-500' : ''}`}>
//                             Rs. {Math.abs(item.amount).toLocaleString()}
//                           </td>
//                           <td className="px-3 py-2 text-center">
//                             <button
//                               onClick={() => removeDraftAddDiscItem(item.id)}
//                               className="text-red-600 hover:text-red-900"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Saved Addition / Discount list */}
//             {addDiscItems.length > 0 && (
//               <Card className="mt-4">
//                 <CardHeader>
//                   <CardTitle className="flex items-center gap-2"><FileText size={20} />Saved Addition / Discount</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                       <thead className="bg-gray-50">
//                         <tr>
//                           <th className="px-3 py-2 text-left font-semibold">S.No</th>
//                           <th className="px-3 py-2 text-left font-semibold">Name</th>
//                           <th className="px-3 py-2 text-left font-semibold">Type</th>
//                           <th className="px-3 py-2 text-left font-semibold">Basis</th>
//                           <th className="px-3 py-2 text-right font-semibold">Value/Percentage</th>
//                           <th className="px-3 py-2 text-right font-semibold">Amount</th>
//                           <th className="px-3 py-2 text-right font-semibold">Actions</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-200">
//                         {addDiscItems.map((item, index) => (
//                           <tr key={item.id}>
//                             <td className="px-3 py-2">{index + 1}</td>
//                             <td className="px-3 py-2">{item.description}</td>
//                             <td className="px-3 py-2 capitalize">{item.type}</td>
//                             <td className="px-3 py-2">{item.mode === 'percentage' ? 'Percentage' : 'Value'}</td>
//                             <td className="px-3 py-2 text-right">{item.mode === 'percentage' ? `${item.percValue}%` : `Rs. ${Math.abs(Number(item.percValue)||0).toLocaleString()}`}</td>
//                             <td className={`px-3 py-2 text-right ${item.type === 'discount' ? 'text-red-600' : ''}`}>Rs. {Math.abs(Number(item.amount)||0).toLocaleString()}</td>
//                             <td className="px-3 py-2 text-right space-x-2">
//                               <Button variant="outline" onClick={() => updateSavedAddDiscItem(item.id)}>Update</Button>
//                               <Button variant="destructive" onClick={() => removeAddDiscItem(item.id)}>Delete</Button>
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </CardContent>
//               </Card>
//             )}

//            {/* Additional charges section */}
// <div className="p-6">
//   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//     {/* Additional Charges */}
//     <div>
//       <h3 className="py-2 px-4 bg-blue-800 text-white text-sm font-medium rounded-t-md">
//         ADDITIONAL CHARGES
//       </h3>
//       <div className="p-4 border border-gray-200 rounded-b-md space-y-3">
//         <div className="flex items-center space-x-3">
//           <input
//             type="checkbox"
//             id="additional-1"
//             className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
//           />
//           <label htmlFor="additional-1" className="text-sm text-gray-700">
//             Additional Charge 1
//           </label>
//           <input
//             type="number"
//             className="ml-auto w-32 border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
//             placeholder="0.00"
//             value={invoiceData.additional}
//             readOnly
//           />
//         </div>
//       </div>
//     </div>

//     {/* Less Charges */}
//     <div>
//       <h3 className="py-2 px-4 bg-blue-800 text-white text-sm font-medium rounded-t-md">
//         LESS CHARGES
//       </h3>
//       <div className="p-4 border border-gray-200 rounded-b-md space-y-3">
//         <div className="flex items-center space-x-3">
//           <input
//             type="checkbox"
//             id="less-1"
//             className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
//           />
//           <label htmlFor="less-1" className="text-sm text-gray-700">
//             Discount
//           </label>
//           <input
//             type="number"
//             className="ml-auto w-32 border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
//             placeholder="0.00"
//             value={invoiceData.less}
//             readOnly
//           />
//         </div>
//       </div>
//     </div>
//   </div>
//   {/* <div className="flex flex-col justify-end">
//   <div className="border-t border-gray-200 pt-4">
//     <table className="w-full border-collapse text-sm text-gray-700">
//       <thead>
//         <tr className="bg-blue-50 text-gray-800">
//           <th className="text-left py-2 px-3 font-medium border border-gray-200">Description</th>
//           <th className="text-right py-2 px-3 font-medium border border-gray-200">Amount (Rs.)</th>
//         </tr>
//       </thead>

//       <tbody className="divide-y divide-gray-200">
//         <tr>
//           <td className="py-2 px-3">Subtotal</td>
//           <td className="py-2 px-3 text-right">
//             <input
//               type="text"
//               className="w-40 bg-gray-50 border border-gray-300 rounded-md py-1 px-2 text-right font-medium text-gray-900 focus:ring-blue-500 focus:border-blue-500"
//               value={`Rs. ${subtotal.toLocaleString()}`}
//               readOnly
//             />
//           </td>
//         </tr>

//         <tr>
//           <td className="py-2 px-3">ADD</td>
//           <td className="py-2 px-3 text-right">
//             <input
//               type="number"
//               className="w-40 border border-gray-300 rounded-md py-1 px-2 text-right bg-gray-100 focus:ring-blue-500 focus:border-blue-500"
//               value={invoiceData.additional}
//               readOnly
//             />
//           </td>
//         </tr>

//         <tr>
//           <td className="py-2 px-3">LESS</td>
//           <td className="py-2 px-3 text-right">
//             <input
//               type="number"
//               className="w-40 border border-gray-300 rounded-md py-1 px-2 text-right bg-gray-100 focus:ring-blue-500 focus:border-blue-500"
//               value={invoiceData.less}
//               readOnly
//             />
//           </td>
//         </tr>

//         <tr>
//           <td className="py-2 px-3">TAX Amount</td>
//           <td className="py-2 px-3 text-right">
//             <input
//               type="number"
//               className="w-40 border border-gray-300 rounded-md py-1 px-2 text-right focus:ring-blue-500 focus:border-blue-500"
//               value={invoiceData.taxAmount}
//               onChange={(e) =>
//                 setInvoiceData((prev) => ({
//                   ...prev,
//                   taxAmount: Number(e.target.value),
//                 }))
//               }
//             />
//           </td>
//         </tr>

//         <tr className="bg-gray-50 font-semibold">
//           <td className="py-2 px-3 text-gray-900 border-t border-gray-300">Total Amount</td>
//           <td className="py-2 px-3 text-right border-t border-gray-300">
//             <input
//               type="text"
//               className="w-40 bg-gray-50 border border-gray-300 rounded-md py-2 px-3 text-right text-base font-bold text-gray-900 focus:ring-blue-500 focus:border-blue-500"
//               value={`Rs. ${totalAmount.toLocaleString()}`}
//               readOnly
//             />
//           </td>
//         </tr>
//       </tbody>
//     </table>
//   </div>
// </div> */}
// </div>

// {/* Invoice Summary */}
//             <Card className="mt-6">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2"><FileText size={20} />Invoice Summary</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full border">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-3 py-2 text-left font-semibold">Taxable Amount</th>
//                         <th className="px-3 py-2 text-left font-semibold">GST Amount</th>
//                         <th className="px-3 py-2 text-left font-semibold">Addition</th>
//                         <th className="px-3 py-2 text-left font-semibold">Discount</th>
//                         <th className="px-3 py-2 text-left font-semibold">Round Off</th>
//                         <th className="px-3 py-2 text-left font-semibold">Final Amount</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       <tr>
//                         <td className="px-3 py-2 font-medium">Rs. {formatToTwoDecimalLocale(sumTaxable)}</td>
//                         <td className="px-3 py-2">Rs. {formatToTwoDecimalLocale(sumGst)}</td>
//                         <td className="px-3 py-2">Rs. {formatToTwoDecimalLocale(addSumAbs)}</td>
//                         <td className="px-3 py-2">Rs. {formatToTwoDecimalLocale(discSumAbs)}</td>
//                         <td className="px-3 py-2">
//                           <input
//                             type="number"
//                             className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm text-right focus:ring-blue-500 focus:border-blue-500"
//                             value={roundOff}
//                             onChange={(e) => {
//                               setIsRoundOffLocked(true);
//                               setRoundOff(roundToTwoDecimals(Number(e.target.value) || 0));
//                             }}
//                             step="0.01"
//                           />
//                         </td>
//                         <td className="px-3 py-2 font-semibold">Rs. {formatToTwoDecimalLocale(finalAmount)}</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                   <p className="text-xs text-gray-500 mt-2">All totals update live when rows change.</p>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>

//         {/* Footer */}
//         <footer className="bg-white border-t">
//           <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
//             <p className="text-sm text-gray-500">
//               &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
//             </p>
//             <button
//                onClick={saveInvoice}
//                 disabled={loading || !isFormValid}
//               // onClick={sendInvoice}
//               // disabled={loading || !isFormValid}
//               className={`px-4 py-2 bg-green-600 text-white rounded-md flex items-center space-x-1 text-sm hover:bg-green-700 ${loading || !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
//                 }`}
//             >
//               <Send className="h-4 w-4" />
//               <span>{actionButtonLabel}</span>
//             </button>
//           </div>
//         </footer>

//         {/* Packing List Modal */}
//         {showPackingModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-lg max-w-6xl max-h-[80vh] overflow-auto">
//               <div className="p-6 border-b">
//                 <h2 className="text-lg font-semibold">Select Packing List - Pop up</h2>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full table-fixed divide-y divide-gray-200">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
//                       {isYarnSalesInvoiceType ? (
//                         <>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challan Date</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yarn Challan No</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
//                         </>
//                       ) : isSizingSalesInvoiceType ? (
//                         <>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sizing Outward No</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yarn Name</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No of Beams</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beam Meters</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Weight</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ends</th>
//                         </>
//                       ) : (
//                         <>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing list No</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                             {isJobwork ? 'Weaving Order No' : 'Sales Order No'}
//                           </th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fabric Code - Quality</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
//                           <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No of Rolls</th>
//                         </>
//                       )}
//                       <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
//                     </tr>
//                   </thead>

//                  <tbody className="bg-white divide-y divide-gray-200">
//   {modalSelectableLines.length === 0 ? (
//     <tr>
//       <td 
//         colSpan={isYarnSalesInvoiceType ? 7 : 7} 
//         className="px-4 py-4 text-center text-sm text-gray-500"
//       >
//         {!selectedValues.warehouseId 
//           ? 'Please select a warehouse first' 
//           : (isJobwork && !selectedWeavingWorkOrderId)
//             ? 'Please select a weaving order first'
//             : (isYarnSalesInvoiceType && !selectedYarnSalesOrderId)
//               ? 'Please select a yarn sales order first'
//               : (!isJobwork && !isYarnSalesInvoiceType && !selectedSalesOrder)
//                 ? 'Please select a sales order first'
//                 : 'No packing lists found for the selected criteria'}
//       </td>
//     </tr>
//   ) : (
//     modalSelectableLines.map((line, index) => {
//       const normalizedLineId = normalizePackingSelectionId(line.id);
//       const isSelected = normalizedLineId ? selectedPackingIds.includes(normalizedLineId) : false;

//       return (
//         <tr
//           key={line.id}
//           className={`cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
//           onClick={(event) => {
//             // Only toggle if the click is NOT on the checkbox itself
//             if (!(event.target as HTMLElement).closest('input[type="checkbox"]')) {
//               if (normalizedLineId) {
//                 togglePackingSelect(line.id);
//               }
//             }
//           }}
//         >
//           <td className="px-4 py-2 text-sm text-gray-900">{index + 1}</td>
//           {isYarnSalesInvoiceType ? (
//             <>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as YarnChallanLine).challanDate || '-'}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as YarnChallanLine).challanNo || '-'}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as YarnChallanLine).itemName}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as YarnChallanLine).quantityDisplay || (line as YarnChallanLine).quantity}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as YarnChallanLine).warehouseName || '-'}</td>
//             </>
//           ) : isSizingSalesInvoiceType ? (
//             <>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as SizingBeamOutwardLine).sizingBeamOutwardNo}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as SizingBeamOutwardLine).yarnName}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as SizingBeamOutwardLine).noOfBeams}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as SizingBeamOutwardLine).beamMeters}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as SizingBeamOutwardLine).netWeight}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as SizingBeamOutwardLine).totalEnds}</td>
//             </>
//           ) : (
//             <>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as PackingLine).rollNo}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">
//                 {isJobwork ? (line as PackingLine).weavingOrderNo : (line as PackingLine).salesOrderNo}
//               </td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as PackingLine).fabricCodeQuality}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as PackingLine).quantity}</td>
//               <td className="px-4 py-2 text-sm text-gray-900">{(line as PackingLine).noOfRolls}</td>
//             </>
//           )}
//           <td className="px-4 py-2 text-sm text-gray-900" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-center">
//               <input
//                 type="checkbox"
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
//                 checked={isSelected}
//                 onChange={() => {
//                   if (normalizedLineId) {
//                     togglePackingSelect(line.id);
//                   }
//                 }}
//               />
//             </div>
//           </td>
//         </tr>
//       );
//     })
//   )}
// </tbody>
//                 </table>
//               </div>
//               <div className="p-6 border-t flex justify-end space-x-3">
//                 <Button variant="outline" onClick={() => setShowPackingModal(false)}>
//                   Cancel
//                 </Button>
//                 <Button onClick={importSelected}>
//                   Submit
//                 </Button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useMemo, useCallback, useRef, act } from 'react';
import { Calendar, ChevronsUpDown, FileText, DollarSign, Send, Trash2, Save, Printer, ArrowLeft, Plus, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllSalesOrders, getSalesOrderConsigneeAddress } from '@/state/salesOrderSlice';
import { getAllCustomers } from '@/state/customerSlice';
import { getAllTermsConditions } from '@/state/termsConditions';
import { getAllShipmentModes } from '@/state/shipmentModeSlice';
import { getAllConsignee } from '@/state/consigneeSlice';
import { getAllPaymentTerms } from '@/state/paymentTermsSlice';
import { getAllShipmentTerms } from '@/state/shipmentTermsSlice';
import { createInvoice, updatePaymentTerms as updateInvoice, getAllInvoices, updateInvoiceByCompanyId, getAllInvoicesByCompanyId } from '@/state/invoiceSlice';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CommonSearchableSelect, { CommonSearchableSelectOption } from '@/components/ui/CommonSearchableSelect';
import { getAllWarehouse } from '@/state/warehouseSlice';
import { getAllGeneratePacking } from '@/state/generatePackingSlice';
import { getAllUomMaster } from '@/state/uomMasterSlice';
import { getAllCities } from '@/state/citySlice';
import { getAllStates } from '@/state/stateSlice';
import { getAllCountries } from '@/state/countrySlice';
import { getCompanyById, getAllCompanies } from '@/state/company-master-slice';
import { getAllEmployees } from '@/state/employeeSlice';
import invoiceNumberService, { CompanyInvoiceSetting } from "@/services/InvoiceNumberService";
import { getAllWeavingJobWorkOrders, getAllWeavingJobWorkOrdersByFactoryCompanyId, getWeavingJobWorkOrderById } from "@/state/weavingJobWorkOrderSlice";
import { getAllSizingJobWorkOrders } from "@/state/sizingJobWorkOrderSlice";
import { getAllSizingBeamOutward } from "@/state/sizingBeamOutwardSlice";
import { getAllSizingProductions } from "@/state/sizingProductionSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllYarnSalesOrders } from "@/state/yarnSalesSlice";
import { getAllYarnChallan } from "@/state/yarnChallanSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllGstMaster } from "@/state/gstMasterSlice";
import { getAllTransports } from "@/state/transportSlice";
import { getAllAgentMasters } from "@/state/agentMasterSlice";
import { CodesUtil } from "@/utils/codesUtil";
import { CodesAPI } from "@/services/codes_api";
import { CodeDetail, CodeHeader } from "@/types/codes";
import { useAuth } from "@/contexts/AuthContext";
import { PopupDataTable, PopupColumn } from '@/components/data/PopupDataTable';

interface AddDiscItem {
  id: number;
  description: string;
  type: 'addition' | 'discount';
  mode: 'percentage' | 'value';
  percValue: number;
  amount: number;
}

interface PackingLine {
  id: string | number;
  rollNo: string;
  salesOrderNo: string;
  salesOrderId?: number;
  weavingOrderNo?: string;
  weavingWorkOrderId?: number;
  fabricCodeQuality: string;
  quantity: number;
  uom: string;
  rate: number;
  gstPercent: number;
  quality?: string;
  noOfRolls: number;
  fabricMasterId?: number;
}

interface YarnChallanLine {
  id: string;
  challanId: number;
  challanNo: string;
  challanDate: string;
  itemId: number;
  yarnId?: number;
  itemName: string;
  quantity: number;
  uom: string;
  rate: number;
  gstPercent: number;
  gstPercentId?: number;
  warehouseId?: number;
  warehouseName?: string;
  hsnCode?: string;
  quantityDisplay?: string;
  childItems?: YarnChallanLine[];
}

interface SizingBeamOutwardLine {
  id: string | number;
  sizingBeamOutwardNo: string;
  sizingOrderId: number;
  sizingOrderNo: string;
  yarnName: string;
  noOfBeams: number;
  beamMeters: number;
  totalEnds: number;
  yarnId?: number;
  rate?: number;
  gstPercent?: number;
  netWeight?: number;
}

interface InvoiceItem {
  id: number;
  productName: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  gstPercent: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  isReadOnlyQuantity: boolean;
  fabricMasterId?: number;
  packingListNo?: string;
  noOfRolls?: number;
  hsnCode?: string;
  yarnChallanId?: number;
  yarnChallanNo?: string;
  yarnId?: number;
  beamMeters?: number;
  netWeight?: number;
  totalEnds?: number;
}

interface InvoiceData {
  date: string;
  invoiceNo: string;
  isInvoice: number;
  soNo: string;
  woNo: string;
  companyBank: string;
  byType?: string;
  manufacturer: {
    name: string;
    address: string;
  };
  termsAndConditions: string;
  paymentTerms: string;
  shipTo: string;
  shipVia: string;
  transportName: string;
  deliveryNote: string;
  deliveryTerms: string;
  vehicleNo: string;
  lrNo: string;
  lrDate: string;
  deliveryNoteDate?: string;
  destination?: string;
  buyer: {
    name: string;
    address: string;
  };
  consignee: {
    name: string;
    address: string;
  };
  items: InvoiceItem[];
  additional: number;
  less: number;
  taxAmount: number;
  comments: string;
  roundOff: number;
  addDiscItems: AddDiscItem[];
  gstType: string;
}

interface InvoiceNumberParts {
  segments: string[];
  seqValue: number;
  digits: number;
  financialYear: string | null;
}

const normalizeCodeValue = (value?: string | number | null) => String(value ?? '').trim().toUpperCase();

const getDetailKey = (detail: CodeDetail) => {
  if (!detail) return '';
  if (detail.id != null) {
    return String(detail.id);
  }
  const code = detail.code || detail.value;
  if (code) return normalizeCodeValue(code);
  return '';
};

const getDetailLabel = (detail: CodeDetail) => detail.value || detail.code || `Code ${detail.id}`;

const formatSequenceValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (!str) return '';
  if (/^\d+$/.test(str)) {
    return str.padStart(Math.max(3, str.length), '0');
  }
  const numeric = Number(str);
  if (!Number.isNaN(numeric)) {
    const normalized = Math.max(0, Math.floor(numeric));
    const normalizedStr = String(normalized);
    return normalizedStr.padStart(Math.max(3, normalizedStr.length), '0');
  }
  return str;
};

const buildInvoicePreview = (prefix: string, financialYear: string, sequenceNumber: string) =>
  [prefix, financialYear, sequenceNumber]
    .map((value) => (value || '').toString().trim())
    .filter(Boolean)
    .join('/');

const normalizeCompanyInvoiceSettings = (raw: any): CompanyInvoiceSetting[] => {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((item: any) => {
      const invoiceTypeId = Number(item?.invoiceTypeId ?? item?.invoiceType?.id ?? item?.invoice_type_id);
      if (Number.isNaN(invoiceTypeId)) return null;
      const prefix = String(item?.prefix ?? '').trim();
      const financialYear = String(item?.financialYear ?? item?.financial_year ?? '').trim();
      const sequenceNumber = formatSequenceValue(item?.sequenceNumber ?? item?.sequence_number);
      const preview = String(item?.preview ?? '').trim();
      return {
        id: item?.id != null ? Number(item.id) : undefined,
        invoiceTypeId,
        prefix,
        financialYear,
        sequenceNumber,
        preview
      } as CompanyInvoiceSetting;
    })
    .filter((entry): entry is CompanyInvoiceSetting => Boolean(entry && entry.invoiceTypeId));
};

const isValidSelectOption = (opt: CommonSearchableSelectOption | null | undefined): opt is CommonSearchableSelectOption =>
  Boolean(opt && opt.label);

const TRADE_TYPE_GROUP_KEY = 'TRADE_TYPE';
const TRADE_TYPE_HEADER_ID = 2;
const ALLOWED_INVOICE_CODES = new Set(['DOMESTIC', 'EXPORT', 'WEAVING JOBWORK', 'SIZING SALES', 'YARN SALES']);
const ALLOWED_INVOICE_IDS = new Set([201, 202, 203, 204, 205]);
const CODES_STORAGE_KEY = 'codes_header';

const normalizeHeadersResponse = (raw: any): CodeHeader[] => {
  if (Array.isArray(raw)) return raw;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
  return [];
};

const cacheHeadersToStorage = (headers: CodeHeader[]) => {
  if (!Array.isArray(headers) || !headers.length) return;
  try {
    localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(headers));
  } catch (error) {
    console.warn('Failed to cache codes headers', error);
  }
};

const readHeadersFromStorage = (): CodeHeader[] => {
  try {
    const stored = localStorage.getItem(CODES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeHeadersResponse(parsed);
    }
  } catch (error) {
    console.error('Failed to parse codes header from storage:', error);
  }
  return [];
};

const extractInvoiceTypeDetails = (headers: CodeHeader[]): CodeDetail[] => {
  if (!Array.isArray(headers)) return [];
  const tradeHeader = headers.find((h: any) => normalizeCodeValue(h?.code_group ?? h?.codeGroup) === TRADE_TYPE_GROUP_KEY)
    || headers.find((h: any) => Number(h?.id) === TRADE_TYPE_HEADER_ID);
  if (!tradeHeader || !Array.isArray(tradeHeader.details)) return [];
  return tradeHeader.details.filter((detail: CodeDetail) => {
    const codeValue = normalizeCodeValue(detail.code || detail.value);
    const id = Number(detail.id);
    return ALLOWED_INVOICE_CODES.has(codeValue) || ALLOWED_INVOICE_IDS.has(id);
  });
};

const normalizeKeyValues = (values: any[]): string[] => values
  .map((value) => {
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  })
  .filter((value): value is string => Boolean(value));

const INVOICE_TYPE_PREFIX_MAP: Record<string, string> = {
  DOMESTIC: 'DOM',
  EXPORT: 'EXP',
  'WEAVING JOBWORK': 'WJO',
  'SIZING SALES': 'SS',
  'YARN SALES': 'YS',
  '201': 'DOM',
  '202': 'EXP',
  '203': 'WJO',
  '204': 'SS',
  '205': 'YS'
};

const KNOWN_INVOICE_PREFIXES = Array.from(new Set(Object.values(INVOICE_TYPE_PREFIX_MAP)));

const getInvoicePrefixFromDetail = (detail?: CodeDetail | null): string => {
  if (!detail) return '';
  const codeKey = normalizeCodeValue(detail.code || detail.value);
  if (codeKey && INVOICE_TYPE_PREFIX_MAP[codeKey]) {
    return INVOICE_TYPE_PREFIX_MAP[codeKey];
  }
  if (detail.id != null) {
    const idKey = String(detail.id);
    if (INVOICE_TYPE_PREFIX_MAP[idKey]) {
      return INVOICE_TYPE_PREFIX_MAP[idKey];
    }
  }
  return '';
};

const stripExistingInvoicePrefix = (value: string): string => {
  if (!value) return value;
  for (const prefix of KNOWN_INVOICE_PREFIXES) {
    const token = `${prefix}/`;
    if (value.startsWith(token)) {
      return value.slice(token.length);
    }
  }
  return value;
};

const normalizeComparableText = (value: any) => {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase();
};

const getInvoiceItemKey = (item?: InvoiceItem) => {
  if (!item) return '';
  const yarnKey = item.yarnChallanId && Number(item.yarnChallanId) > 0 ? `yarn-${item.yarnChallanId}` : '';
  if (yarnKey) return yarnKey;
  if (item.packingListNo) {
    const normalized = normalizeComparableText(item.packingListNo);
    if (normalized) {
      return `packing-${normalized}`;
    }
  }
  if (item.productName) {
    const normalized = normalizeComparableText(item.productName);
    if (normalized) {
      return `product-${normalized}`;
    }
  }
  if (item.hsnCode) {
    return `hsn-${item.hsnCode}`;
  }
  return `item-${item.id}`;
};

const mergeInvoiceItems = (existing: InvoiceItem[], additions: InvoiceItem[]) => {
  const merged = [...existing];
  const keyIndex = (candidate: InvoiceItem) => getInvoiceItemKey(candidate);
  additions.forEach((addition) => {
    const key = getInvoiceItemKey(addition);
    if (!key) {
      merged.push(addition);
      return;
    }
    const duplicateIndex = merged.findIndex((current) => keyIndex(current) === key);
    if (duplicateIndex >= 0) {
      const preservedId = merged[duplicateIndex].id;
      merged[duplicateIndex] = { ...addition, id: preservedId };
    } else {
      merged.push(addition);
    }
  });
  return merged;
};

const roundToTwoDecimals = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const computeItemAmounts = (quantity: number, rate: number, gstPercent: number) => {
  const normalizedQuantity = Number(quantity) || 0;
  const normalizedRate = Number(rate) || 0;
  const normalizedGstPercent = Number(gstPercent) || 0;
  const taxableAmount = roundToTwoDecimals(normalizedQuantity * normalizedRate);
  const gstAmount = roundToTwoDecimals(taxableAmount * (normalizedGstPercent / 100));
  const totalAmount = roundToTwoDecimals(taxableAmount + gstAmount);
  return {
    taxableAmount,
    gstAmount,
    totalAmount,
    amount: totalAmount,
  };
};

const formatToTwoDecimalLocale = (value: number) =>
  (Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const normalizePackingSelectionId = (id: string | number | null | undefined) => {
  if (id === undefined || id === null) return '';
  return String(id);
};

const resolvePackingLineId = (packing: any, index: number): string => {
  const candidates = [
    packing?.id,
    packing?.packingSlipId,
    packing?.packingSlipNo,
    packing?.rollNo,
    packing?.lineId,
    packing?.packingLineId,
    packing?.packingId,
    packing?.salesOrderLineId,
    packing?.weavingWorkOrderLineId,
    packing?.yarnSalesOrderLineId,
    packing?.yarnChallanId,
    packing?.yarnChallanNo,
    packing?.salesOrderId && packing?.fabricCode ? `${packing.salesOrderId}-${packing.fabricCode}` : null,
    packing?.weavingWorkOrderId && packing?.fabricCode ? `${packing.weavingWorkOrderId}-${packing.fabricCode}` : null,
    packing?.yarnSalesOrderId && packing?.itemName ? `${packing.yarnSalesOrderId}-${packing.itemName}` : null,
  ];
  for (const candidate of candidates) {
    const normalized = normalizePackingSelectionId(candidate as any);
    if (normalized) {
      return normalized;
    }
  }
  return `packing-${index}`;
};

const parseFabricCodeQualityParts = (value: string) => {
  if (!value) {
    return { fabricCode: '', quality: '' };
  }
  const segments = value.split(' - ');
  const fabricCode = segments[0]?.trim() || '';
  const quality = segments.slice(1).join(' - ').trim() || '';
  return { fabricCode, quality };
};

const extractPackingPieces = (packing: any) => {
  if (!packing) return [];
  const candidates = [
    packing.items,
    packing.packingItems,
    packing.packingDetails,
    packing.rollPieces,
    packing.pieces,
    packing.rolls,
    packing.rollDetails
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length) {
      return candidate;
    }
  }
  return [];
};

const derivePackingRollCount = (packing: any, fabricCodeQuality: string) => {
  const { fabricCode, quality } = parseFabricCodeQualityParts(fabricCodeQuality);
  const normalizedFabricCode = normalizeComparableText(packing?.fabricCode || fabricCode);
  const normalizedQuality = normalizeComparableText(packing?.quality || packing?.fabricQuality || quality);
  const normalizedRollNo = normalizeComparableText(packing?.packingSlipNo || packing?.rollNo);
  const pieces = extractPackingPieces(packing);
  if (pieces.length) {
    const matchedPieces = pieces.filter((piece: any) => {
      const pieceFabricCode = normalizeComparableText(piece?.fabricCode || piece?.fabric_code || piece?.fabricCodeQuality?.split(' - ')[0]);
      const pieceQuality = normalizeComparableText(
        piece?.quality ||
        piece?.fabricQuality ||
        piece?.fabricQualityName ||
        (piece?.fabricCodeQuality ? piece?.fabricCodeQuality.split(' - ').slice(1).join(' - ') : '')
      );
      const pieceRollNo = normalizeComparableText(piece?.rollNo || piece?.roll_no || piece?.rollNumber);
      const fabricMatches = normalizedFabricCode ? pieceFabricCode === normalizedFabricCode : true;
      const qualityMatches = normalizedQuality ? pieceQuality === normalizedQuality : true;
      const rollMatches = normalizedRollNo ? pieceRollNo === normalizedRollNo : true;
      return fabricMatches && qualityMatches && rollMatches;
    });
    const count = matchedPieces.length || pieces.length;
    if (count > 0) {
      return count;
    }
  }
  const fallbackSources = [
    packing?.noOfRolls,
    packing?.numberOfRolls,
    packing?.noOfPieces,
    packing?.totalPieces
  ];
  for (const source of fallbackSources) {
    if (source === undefined || source === null || source === '') continue;
    const numeric = Number(source);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return 0;
};

const resolveSalesOrderTypeId = (packing: any, order?: any) => {
  const candidates = [
    order?.orderTypeId,
    order?.orderType,
    packing?.orderTypeId,
    packing?.orderType,
    packing?.orderType?.id,
    packing?.salesOrder?.orderTypeId,
    packing?.salesOrder?.orderType
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === '') continue;
    const numeric = Number(candidate);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }
  return null;
};

const ENTITY_UOM_STRING_GETTERS: Array<(entry: any) => any> = [
  (entry) => entry?.uom,
  (entry) => entry?.uomName,
  (entry) => entry?.uom?.uomName,
  (entry) => entry?.uom?.name,
  (entry) => entry?.uomMaster?.uomName,
  (entry) => entry?.uomMaster?.name,
  (entry) => entry?.orderUom?.uomName,
  (entry) => entry?.orderUom?.name,
  (entry) => entry?.unitOfMeasurement?.uomName,
  (entry) => entry?.unitOfMeasurement?.name,
  (entry) => entry?.fabric?.uom?.uomName,
  (entry) => entry?.fabric?.uom?.name
];

const ENTITY_UOM_ID_GETTERS: Array<(entry: any) => any> = [
  (entry) => entry?.uomId,
  (entry) => entry?.uom_id,
  (entry) => entry?.uomMasterId,
  (entry) => entry?.uom_master_id,
  (entry) => entry?.uomMaster?.id,
  (entry) => entry?.orderUomId,
  (entry) => entry?.orderUom?.id,
  (entry) => entry?.unitOfMeasurementId,
  (entry) => entry?.unitOfMeasurement?.id,
  (entry) => entry?.fabric?.uomId,
  (entry) => entry?.fabric?.uom?.id,
  (entry) => entry?.fabricMaster?.uomId,
  (entry) => entry?.fabricMasterId
];

const gatherUomCandidates = (entry: any) => {
  if (!entry) return [];
  const sources = [entry];
  const lists = [
    entry?.items,
    entry?.orderItems,
    entry?.soItems,
    entry?.packingItems,
    entry?.packingDetails,
    entry?.jobWorkOrderDetails,
    entry?.packings,
    entry?.pieces
  ];
  for (const list of lists) {
    if (Array.isArray(list)) {
      sources.push(...list);
    }
  }
  return sources;
};

const resolveEntityUomName = (entry: any, uoms: any[]): string | null => {
  const normalizedList = Array.isArray(uoms) ? uoms : [];
  const candidates = gatherUomCandidates(entry);
  for (const candidate of candidates) {
    if (!candidate) continue;
    for (const getter of ENTITY_UOM_STRING_GETTERS) {
      const value = getter(candidate);
      if (value != null && value !== '') {
        const normalized = String(value).trim();
        if (normalized) {
          return normalized;
        }
      }
    }
    for (const getter of ENTITY_UOM_ID_GETTERS) {
      const idValue = getter(candidate);
      if (idValue == null || idValue === '') continue;
      const match = normalizedList.find((u: any) => String(u.id) === String(idValue));
      if (match) {
        const resolvedName = match.uomName || match.name;
        if (resolvedName) {
          return String(resolvedName).trim();
        }
      }
    }
  }
  return null;
};

const resolvePositiveNumber = (value: any) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const resolveWarehouseIdFromEntry = (entry: any): string | null => {
  if (!entry) return null;
  const candidate = entry?.warehouseId ?? entry?.warehouse_id ?? entry?.warehouse?.id ?? entry?.warehouse?.warehouseId;
  const resolved = resolvePositiveNumber(candidate);
  return resolved ? String(resolved) : null;
};

const deriveWarehouseIdFromPackings = (packings: any[] = []): string | null => {
  for (const packing of packings) {
    const warehouseId = resolveWarehouseIdFromEntry(packing);
    if (warehouseId) {
      return warehouseId;
    }
  }
  return null;
};

export default function GenerateInvoice() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const invoiceDetail = location.state?.invoice;
  const tabNameFromState = location.state?.tabName;
  const invoiceDetailTabName = invoiceDetail?.tabName;
  const invoiceDetailInvoiceNo = invoiceDetail?.invoiceNo || '';
  const isEditMode = Boolean(invoiceDetail?.id);

  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
  const { shipmentModesList } = useSelector((state: RootState) => state.shipmentMode);
  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
  const { shipmentTermsList } = useSelector((state: RootState) => state.shipmentTerms);
  const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const { warehouseList } = useSelector((state: RootState) => state.warehouse);
  const { generatePackingList } = useSelector((state: RootState) => state.generatePacking);
  const { uomList } = useSelector((state: RootState) => state.uom);
  const { cityList } = useSelector((state: RootState) => state.city);
  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);
  const { loading, error, invoiceList } = useSelector((state: RootState) => state.invoice);
  const { employeeList } = useSelector((state: RootState) => state.employee);
  const { weavingJobWorkOrderList } = useSelector((state: RootState) => state.weavingJobWorkOrder as any);
  const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
  const { sizingBeamOutwardList } = useSelector((state: RootState) => state.sizingBeamOutward as any);
  const { sizingProductionList } = useSelector((state: RootState) => state.sizingProduction as any);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { yarnSalesOrderList } = useSelector((state: RootState) => state.yarnSales as any);
  const { yarnChallanList } = useSelector((state: RootState) => state.yarnChallan as any);
  const { yarnList: yarnMasterList } = useSelector((state: RootState) => state.yarn as any);
  const { gstList } = useSelector((state: RootState) => state.gst as any);
  const { transportList }: any = useSelector((state: RootState) => state.transport);
  const { agentMasterList } = useSelector((state: RootState) => state.agentMaster as any);

  const normalizedWarehouseList = useMemo(() => {
    const raw = (warehouseList?.data ?? warehouseList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [warehouseList]);

  const normalizedUoms = useMemo(() => {
    return Array.isArray(uomList) ? uomList : [];
  }, [uomList]);

  const uomMap = useMemo(() => {
    const map = new Map<string, string>();
    normalizedUoms.forEach((u: any) => {
      const keyCandidates = normalizeKeyValues([u?.id, u?.uomId]);
      const key = keyCandidates[0];
      if (!key) return;
      const name = String(u?.uomName || u?.name || u?.label || u?.code || '').trim();
      if (name) {
        map.set(key, name);
      }
    });
    return map;
  }, [normalizedUoms]);

  const { user, selectedCompany: authSelectedCompany } = useAuth();

  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('');
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [viewingPackingSlipNo, setViewingPackingSlipNo] = useState<string | null>(null);
  const [packingLines, setPackingLines] = useState<PackingLine[]>([]);
  const [selectedPackingIds, setSelectedPackingIds] = useState<string[]>([]);
  const [addDiscItems, setAddDiscItems] = useState<AddDiscItem[]>([]);
  const [addDiscDrafts, setAddDiscDrafts] = useState<AddDiscItem[]>([]);
  const [roundOff, setRoundOff] = useState(0);
  const [isRoundOffLocked, setIsRoundOffLocked] = useState(() => Boolean(invoiceDetail));
  const [buyerStateCode, setBuyerStateCode] = useState<string>('');
  const [companyStateCode, setCompanyStateCode] = useState<string>('');
  const [descSuggestForId, setDescSuggestForId] = useState<number | null>(null);
  const [descActiveSuggestionIndex, setDescActiveSuggestionIndex] = useState<number>(-1);
  const [invoiceTypeOptions, setInvoiceTypeOptions] = useState<CodeDetail[]>([]);
  const [selectedInvoiceTypeId, setSelectedInvoiceTypeId] = useState<string>('');
  const [hasUserAdjustedInvoiceType, setHasUserAdjustedInvoiceType] = useState(false);
  const [selectedWeavingWorkOrderId, setSelectedWeavingWorkOrderId] = useState<string>('');
  const [selectedWeavingOrder, setSelectedWeavingOrder] = useState<any>(null);
  const [selectedYarnSalesOrderId, setSelectedYarnSalesOrderId] = useState<string>('');
  const [selectedSizingWorkOrderId, setSelectedSizingWorkOrderId] = useState<string>('');
  const [selectedSizingWorkOrder, setSelectedSizingWorkOrder] = useState<any>(null);
  const [activeGstPercentId, setActiveGstPercentId] = useState<string>('');
  const [isBrushedPiece, setIsBrushedPiece] = useState<boolean>(false);
  const [selectedPackingListNo, setSelectedPackingListNo] = useState<string>( '');

  // Automatically set brushing based on user role "Brushing" during creation
  useEffect(() => {
    if (!isEditMode && user?.role === 'Brushing') {
      setIsBrushedPiece(true);
      setSelectedValues(prev => ({ ...prev, warehouseId: '' }));
    }
  }, [user, isEditMode]);

  console.log('Invoice Detail from location state:', invoiceDetail);
  const navigate = useNavigate();

  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [companyBanks, setCompanyBanks] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
      if (!stored) return null;
      const parsed = Number(stored);
      return Number.isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  });
  const [companyInvoiceSettings, setCompanyInvoiceSettings] = useState<CompanyInvoiceSetting[]>([]);
  const [cgstPerc, setCgstPerc] = useState<number>(0);
  const [sgstPerc, setSgstPerc] = useState<number>(0);
  const [igstPerc, setIgstPerc] = useState<number>(0);
  const [gstPerc, setGstPerc] = useState<number>(0);

  const loggedInCompanyId = useMemo(() => {
    if (authSelectedCompany != null) {
      const numeric = Number(authSelectedCompany);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }
    if (user?.selectedCompany?.id != null) {
      const numeric = Number(user.selectedCompany.id);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }
    if (user?.companyId != null) {
      const numeric = Number(user.companyId);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }
    return null;
  }, [authSelectedCompany, user]);

  useEffect(() => {
    if (loggedInCompanyId == null) {
      return;
    }
    if (selectedCompanyId === loggedInCompanyId) {
      return;
    }
    setSelectedCompanyId(loggedInCompanyId);
  }, [loggedInCompanyId, selectedCompanyId]);

  useEffect(() => {
    if (selectedCompanyId == null) {
      return;
    }
    try {
      localStorage.setItem('selectedCompanyId', String(selectedCompanyId));
      localStorage.setItem('selectedCompany', String(selectedCompanyId));
    } catch {
    }
  }, [selectedCompanyId]);

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    date: new Date().toISOString().split('T')[0],
    invoiceNo: '',
    isInvoice: 0,
    soNo: '',
    woNo: '',
    companyBank: '',
    byType: 'Manufacturer',
    manufacturer: {
      name: '',
      address: ''
    },
    termsAndConditions: '',
    paymentTerms: 'Net 60 Days',
    shipTo: '',
    shipVia: '',
    transportName: '',
    deliveryNote: '',
    deliveryTerms: '',
    vehicleNo: '',
    lrNo: '',
    lrDate: '',
    deliveryNoteDate: '',
    destination: '',
    buyer: {
      name: '',
      address: ''
    },
    consignee: {
      name: '',
      address: ''
    },
    items: [],
    additional: 0,
    less: 0,
    taxAmount: 0,
    comments: '',
    roundOff: 0,
    addDiscItems: [],
    gstType: '',
  });

  const resetFormForOrderChange = useCallback(() => {
    if (isBrushedPiece) return;

    setSelectedPackingListNo('');
    setInvoiceData(prev => ({
      ...prev,
      items: [],
      additional: 0,
      less: 0,
      taxAmount: 0,
      comments: '',
      roundOff: 0,
      transportName: '',
      deliveryNote: '',
      deliveryTerms: '',
      vehicleNo: '',
      lrNo: '',
      lrDate: '',
    }));
    setAddDiscItems([]);
    setAddDiscDrafts([]);
    setSelectedPackingIds([]);
    setPackingLines([]);
    setSelectedValues(prev => ({
      ...prev,
      customerId: '',
      consgineeId: '',
      shipmentTermsId: '',
      transportId: '',
    }));
    setHasManualWarehouseSelection(false);
    setRoundOff(0);
  }, [isBrushedPiece, setSelectedPackingListNo, setInvoiceData, setAddDiscItems, setAddDiscDrafts, setSelectedPackingIds, setPackingLines, setRoundOff]);

  const subtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);

  const existingDescNames = useMemo(() => {
    const fromInvoices = Array.isArray(invoiceList)
      ? (invoiceList as any[]).flatMap((inv: any) => [
        ...((inv?.addDiscItems || []) as any[]),
        ...((inv?.addDiscDrafts || []) as any[]),
      ]).map((i: any) => i?.description).filter((s: any) => !!s)
      : [];
    const local = [...addDiscItems, ...addDiscDrafts].map(i => i.description).filter(Boolean);
    return Array.from(new Set([...fromInvoices, ...local].map((s: any) => String(s))));
  }, [invoiceList, addDiscItems, addDiscDrafts]);

  const getFilteredDescSuggestions = (q: string) => {
    const lower = (q || '').toLowerCase();
    if (!lower) return [] as string[];
    return existingDescNames.filter((n: string) => (n || '').toLowerCase().includes(lower)).slice(0, 8);
  };

  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: number) => {
    if (descSuggestForId !== itemId) return;
    const cur = (addDiscDrafts.find(d => d.id === itemId)?.description || '') as string;
    const list = getFilteredDescSuggestions(cur);
    if (!list.length) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setDescActiveSuggestionIndex(prev => (prev < list.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setDescActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : list.length - 1));
        break;
      case 'Enter':
        if (descActiveSuggestionIndex >= 0) {
          e.preventDefault();
          const val = list[descActiveSuggestionIndex];
          handleAddDiscDraftChange(itemId, 'description', val);
          setDescSuggestForId(null);
          setDescActiveSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setDescSuggestForId(null);
        setDescActiveSuggestionIndex(-1);
        break;
    }
  };
  const totalAmount = subtotal + invoiceData.additional - invoiceData.less + invoiceData.taxAmount;
  const actionButtonLabel = loading
    ? (isEditMode ? 'Updating...' : 'Sending...')
    : (isEditMode ? 'Update Invoice' : 'Save Invoice');

  const showManufacturerLoading =
    invoiceData.byType === 'Manufacturer' &&
    isEditMode &&
    // Show spinner until manufacturer text is populated in edit mode.
    // This prevents the textarea from looking "empty" while async data resolves.
    (loading || (!invoiceData.manufacturer?.name && !invoiceData.manufacturer?.address));

  const [selectedValues, setSelectedValues] = useState({
    manufactureId: 1,
    companyBankId: '',
    termsConditionsId: '',
    paymentTermsId: '',
    shipToId: '',
    shipmentMode: '',
    customerId: '',
    consgineeId: '',
    warehouseId: '',
    shipmentTermsId: '',
    agentId: '',
    gstType: '',
    transportId: ''
  });
  const [hasManualWarehouseSelection, setHasManualWarehouseSelection] = useState(false);
  const [isConsigneeAddressLoading, setIsConsigneeAddressLoading] = useState(false);
  const [isBuyerAddressLoading, setIsBuyerAddressLoading] = useState(false);
  const preferredConsigneeAddressIdRef = useRef<string | null>(null);
  const skipConsigneeHydrationRef = useRef<boolean>(false);
  const hydrateConsigneeDetailsRef = useRef<typeof hydrateConsigneeDetails>(() => { });
  const selectedCompanyBankId = selectedValues.companyBankId;

  useEffect(() => {
    let isMounted = true;

    const loadInvoiceTypes = async () => {
      let headers: CodeHeader[] = readHeadersFromStorage();

      if (!headers.length) {
        const cachedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
        if (cachedHeaders.length) {
          headers = cachedHeaders;
        }
      }

      if (!headers.length) {
        try {
          await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
          const loadedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
          if (loadedHeaders.length) {
            headers = loadedHeaders;
          }
        } catch (error) {
          console.error("codes header preload failed", error);
        }
      }

      if (!headers.length) {
        try {
          const apiHeaders = await CodesAPI.getCodesHeader();
          headers = normalizeHeadersResponse(apiHeaders);
        } catch (error) {
          console.error("Failed to load invoice types", error);
        }
      }

      if (headers.length) {
        cacheHeadersToStorage(headers);
      }

      if (!isMounted) return;
      setInvoiceTypeOptions(extractInvoiceTypeDetails(headers));
    };

    loadInvoiceTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    dispatch(getAllSalesOrders({ fetchAll: true }));
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllTermsConditions({ fetchAll: true }));
    dispatch(getAllShipmentModes({ fetchAll: true }));
    dispatch(getAllShipmentTerms({ fetchAll: true }));
    dispatch(getAllConsignee({ fetchAll: true }));
    dispatch(getAllPaymentTerms({ fetchAll: true }));
    dispatch(getAllInvoices({ fetchAll: true }));
    // dispatch(getAllInvoicesByCompanyId({companyId} as any));
    dispatch(getAllWarehouse({ fetchAll: true }));
    dispatch(getAllGeneratePacking({ fetchAll: true }));
    dispatch(getAllUomMaster({ fetchAll: true }));
    dispatch(getAllCities({ fetchAll: true }));
    dispatch(getAllStates({ fetchAll: true }));
    dispatch(getAllCountries({ fetchAll: true }));

    dispatch(getAllEmployees({ fetchAll: true }) as any);
    dispatch(getAllFabricMasters({ fetchAll: true }) as any);
    dispatch(getAllCompanies({ fetchAll: true }) as any);
    dispatch(getAllYarnSalesOrders({ fetchAll: true }) as any);
    dispatch(getAllYarnChallan({ fetchAll: true }) as any);
    dispatch(getAllYarnMasters({ fetchAll: true }) as any);
    dispatch(getAllGstMaster({ fetchAll: true }) as any);
    dispatch(getAllSizingJobWorkOrders({ fetchAll: true }) as any);
    dispatch(getAllSizingBeamOutward({ fetchAll: true }) as any);
    dispatch(getAllSizingProductions({ fetchAll: true }) as any);
    dispatch(getAllTransports({ fetchAll: true }));
    dispatch(getAllAgentMasters({ fetchAll: true }) as any);
  }, [dispatch]);

  useEffect(() => {
    setCompanyInvoiceSettings([]);
    if (!selectedCompanyId) {
      setCompanyInfo(null);
      setCompanyBanks([]);
      setCompanyStateCode('');
      // dispatch(getAllWeavingJobWorkOrders({}) as any);
      dispatch(getAllYarnSalesOrders({ fetchAll: true }) as any);
      dispatch(getAllYarnChallan({ fetchAll: true }) as any);
      return;
    }
    dispatch(getAllWeavingJobWorkOrders({ fetchAll: true }) as any);
    dispatch(getAllSizingJobWorkOrders({ companyId: selectedCompanyId, fetchAll: true }) as any);
    dispatch(getAllSizingBeamOutward({ companyId: selectedCompanyId, fetchAll: true }) as any);
    dispatch(getAllSizingProductions({ companyId: selectedCompanyId, fetchAll: true }) as any);
    // dispatch(getAllWeavingJobWorkOrdersByFactoryCompanyId(selectedCompanyId) as any);
    dispatch(getAllYarnSalesOrders({ companyId: selectedCompanyId, fetchAll: true }) as any);
    dispatch(getAllYarnChallan({ companyId: selectedCompanyId, fetchAll: true }) as any);

    dispatch(getCompanyById({ id: selectedCompanyId }))
      .unwrap?.()
      .then((res: any) => {
        const companyData = res?.data || res;
        setCompanyInfo(companyData);
        const addressArr = companyData?.address || companyData?.data?.address || [];
        const defaultAddr = Array.isArray(addressArr)
          ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
          : null;
        const code = defaultAddr?.stateCode || '';
        setCompanyStateCode(code);
        const banks = companyData?.bank || companyData?.data?.bank || [];
        const normalizedBanks = Array.isArray(banks) ? banks : [];
        setCompanyBanks(normalizedBanks);
        if (!selectedCompanyBankId && normalizedBanks.length > 0) {
          setSelectedValues(prev => ({ ...prev, companyBankId: String(normalizedBanks[0].id) }));
        }
      })
      .catch(() => { });
  }, [dispatch, selectedCompanyId, selectedCompanyBankId]);

  useEffect(() => {
    if (!companyInfo) return;
    const companyData = companyInfo;
    const addressArr = companyData?.address || companyData?.data?.address || [];
    const defaultAddr = Array.isArray(addressArr)
      ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
      : null;
    const stateName = defaultAddr?.stateId ? getStateName(String(defaultAddr.stateId), stateList) : '';
    const parts: string[] = [];
    if (defaultAddr?.line1) parts.push(String(defaultAddr.line1));
    if (stateName) parts.push(stateName);
    if (defaultAddr?.pinCode) parts.push(`\n PIN: ${defaultAddr.pinCode}`);
    const gstNo = companyData?.gstNo || companyData?.data?.gstNo || '';
    if (gstNo) parts.push(`\n GST: ${gstNo}`);
    const name = companyData?.companyName || companyData?.data?.companyName || '';
    setInvoiceData(prev => {
      if (prev.byType !== 'Manufacturer') return prev;

      // In edit mode, `invoiceDetail.manufacturer` may be missing/empty.
      // Only fill from `companyInfo` when saved fields are not present,
      // so we don't clobber user-provided/loaded manufacturer text.
      const savedManufacturer = invoiceDetail?.manufacturer;
      const savedName = savedManufacturer?.name;
      const savedAddress = savedManufacturer?.address;

      const hasSavedName = Boolean(String(savedName ?? '').trim());
      const hasSavedAddress = Boolean(String(savedAddress ?? '').trim());

      return {
        ...prev,
        manufacturer: {
          name: hasSavedName ? String(savedName) : name,
          address: hasSavedAddress ? String(savedAddress) : parts.join(', ')
        }
      };
    });
  }, [companyInfo, stateList, invoiceDetail]);

  const normalizeArray = (source: any): any[] => {
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.data)) return source.data;
    if (Array.isArray(source?.data?.data)) return source.data.data;
    return [];
  };

  const normalizedPackingList = useMemo(() => {
    if (Array.isArray(generatePackingList)) return generatePackingList;
    if (Array.isArray(generatePackingList?.data)) return generatePackingList.data;
    if (Array.isArray(generatePackingList?.data?.data)) return generatePackingList.data.data;
    if (generatePackingList?.data && typeof generatePackingList.data === 'object') {
      const data = generatePackingList.data;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.packingList)) return data.packingList;
      if (Array.isArray(data.result)) return data.result;
    }
    return [];
  }, [generatePackingList]);

  const viewingPackingRecord = useMemo(() => {
    if (!viewingPackingSlipNo) return null;
    return normalizedPackingList.find((p: any) => p.packingSlipNo === viewingPackingSlipNo);
  }, [viewingPackingSlipNo, normalizedPackingList]);

  const resolveSalesOrderNo = useCallback((salesOrderId: number): string => {
    if (!salesOrderId) return '';
    const list = normalizeArray(salesOrderList);
    const so = list.find((s: any) => String(s?.id) === String(salesOrderId) || String(s?.data?.id) === String(salesOrderId));
    if (so) {
      return so?.salesOrderNo || so?.orderNo || so?.data?.salesOrderNo || '';
    }
    // Fallback to invoiceDetail if it matches
    if (invoiceDetail?.salesOrderId === salesOrderId && invoiceDetail.soNo) {
      return invoiceDetail.soNo;
    }
    return '';
  }, [salesOrderList, invoiceDetail]);

  const resolveBuyerName = useCallback((buyerId: any): string => {
    if (!buyerId) return '';
    const list = normalizeArray(customerList);
    const buyer = list.find((c: any) => String(c?.id) === String(buyerId) || String(c?.customerId) === String(buyerId));
    return buyer ? (buyer.customerName || buyer.name || '') : '';
  }, [customerList]);

  const resolveConsigneeName = useCallback((consigneeId: any): string => {
    if (!consigneeId) return '';
    const list = normalizeArray(consigneeList);
    const con = list.find((c: any) => String(c?.id) === String(consigneeId) || String(c?.consigneeId) === String(consigneeId));
    return con ? (con.consigneeName || con.name || '') : '';
  }, [consigneeList]);

  const resolveFabricCode = useCallback((fabricMasterId: any): string => {
    if (!fabricMasterId) return '';
    const list = normalizeArray(fabricMasterList);
    const fab = list.find((f: any) => String(f?.id) === String(fabricMasterId));
    return fab ? (fab.fabricCode || '') : '';
  }, [fabricMasterList]);

  const resolveFabricQuality = useCallback((fabricMasterId: any): string => {
    if (!fabricMasterId) return '';
    const list = normalizeArray(fabricMasterList);
    const fab = list.find((f: any) => String(f?.id) === String(fabricMasterId));
    return fab ? (fab.fabricQuality || fab.quality || '') : '';
  }, [fabricMasterList]);

  const resolveTransportName = useCallback((transportId: any): string => {
    if (!transportId) return '';
    const list = normalizeArray(transportList);
    const tr = list.find((t: any) => String(t?.id) === String(transportId));
    return tr ? (tr.transportName || tr.name || '') : '';
  }, [transportList]);

  const resolveWeavingOrderNo = useCallback((weavingOrderId: number): string => {
    if (!weavingOrderId) return '';
    const packingMatch = (normalizedPackingList || []).find((entry: any) => {
      if (!entry) return false;
      const entryWoId = Number(entry?.weavingWorkOrderId);
      if (Number.isNaN(entryWoId) || entryWoId !== weavingOrderId) return false;
      return Boolean(entry?.weavingWorkOrderNo || entry?.weavingOrderNo || entry?.orderNo);
    });
    if (packingMatch) {
      return packingMatch.weavingWorkOrderNo || packingMatch.weavingOrderNo || packingMatch.orderNo || '';
    }
    const list = normalizeArray(weavingJobWorkOrderList);
    const wo = list.find((w: any) => String(w?.id) === String(weavingOrderId));
    if (wo) {
      return wo?.weavingWorkOrderNo || wo?.weavingOrderNo || wo?.orderNo || '';
    }
    if (invoiceDetail?.weavingWorkOrderId === weavingOrderId && invoiceDetail.woNo) {
      return invoiceDetail.woNo;
    }
    return '';
  }, [weavingJobWorkOrderList, invoiceDetail, normalizedPackingList]);

  const resolveYarnSalesOrderNo = useCallback((yarnSalesOrderId: number): string => {
    if (!yarnSalesOrderId) return '';
    const list = normalizeArray(yarnSalesOrderList);
    const order = list.find((entry: any) => String(entry?.id) === String(yarnSalesOrderId));
    return order?.yarnSalesNo || order?.orderNo || order?.salesOrderNo || '';
  }, [yarnSalesOrderList]);

  const getCityName = (cityId: string, list: any[]) => {
    if (!cityId || !list || list.length === 0) return '';
    const city = list.find((c: any) => c.id?.toString() === cityId?.toString() || c.id === parseInt(cityId));
    return city ? city.cityName : '';
  };

  const getStateName = (stateId: string, list: any[]) => {
    if (!stateId || !list || list.length === 0) return '';
    const state = list.find((s: any) => s.id?.toString() === stateId?.toString() || s.id === parseInt(stateId));
    return state ? state.stateName : '';
  };

  const getCountryName = (countryId: string, list: any[]) => {
    if (!countryId || !list || list.length === 0) return '';
    const country = list.find((c: any) => c.id?.toString() === countryId?.toString() || c.id === parseInt(countryId));
    return country ? country.countryName : '';
  };

  const formatCompleteAddress = (address: any, cities: any[], states: any[], countries: any[]) => {
    if (!address) return '';
    const parts: string[] = [];
    if (address.line1 && String(address.line1).trim()) parts.push(String(address.line1).trim());
    if (address.line2 && String(address.line2).trim()) parts.push(String(address.line2).trim());
    const cityName = getCityName(address.cityId, cities);
    const stateName = getStateName(address.stateId, states);
    const countryName = getCountryName(address.countryId, countries);
    const loc: string[] = [];
    if (cityName) loc.push(cityName);
    if (stateName) loc.push(stateName);
    if (countryName) loc.push(countryName);
    if (loc.length > 0) parts.push(loc.join(', '));
    if (address.pinCode) {
      const pin = String(address.pinCode).trim();
      if (pin) parts.push(`PIN: ${pin}`);
    }
    return parts.join(', ');
  };

  const formatAddressMultiline = (address: any, cities: any[], states: any[], countries: any[]) => {
    if (!address) return '';
    const lineParts: string[] = [];
    if (address.line1 && String(address.line1).trim()) lineParts.push(String(address.line1).trim());
    if (address.line2 && String(address.line2).trim()) lineParts.push(String(address.line2).trim());
    const cityName = getCityName(address.cityId, cities);
    const stateName = getStateName(address.stateId, states);
    const countryName = getCountryName(address.countryId, countries);
    const loc: string[] = [];
    if (cityName) loc.push(cityName);
    if (stateName) loc.push(stateName);
    if (countryName) loc.push(countryName);
    if (loc.length > 0) lineParts.push(loc.join(', '));
    const first = lineParts.join(', ');
    const pin = address.pinCode ? `PIN: ${String(address.pinCode).trim()}` : '';
    const stateCode = address.stateCode ? `State Code: ${String(address.stateCode).trim()}` : '';
    return [first, pin, stateCode].filter(v => !!v).join('\n');
  };

  // Normalize company master list
  const companyMasterArr = useMemo(() => {
    const raw = (companyMasterList?.data ?? companyMasterList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [companyMasterList]);

  useEffect(() => {
    let source: any = companyInfo;
    if (!source && selectedCompanyId && companyMasterArr.length) {
      source = companyMasterArr.find((company: any) => Number(company?.id) === Number(selectedCompanyId));
    }
    if (!source) {
      setCompanyInvoiceSettings([]);
      return;
    }
    const invoiceItems = source?.invoiceItems
      || source?.invoiceData
      || source?.invoiceItemsList
      || source?.invoice_details
      || source?.data?.invoiceItems
      || source?.data?.invoiceData
      || [];
    setCompanyInvoiceSettings(normalizeCompanyInvoiceSettings(invoiceItems));
  }, [companyInfo, companyMasterArr, selectedCompanyId]);

  const companyInvoiceSettingsMap = useMemo(() => {
    const map = new Map<number, CompanyInvoiceSetting>();
    companyInvoiceSettings.forEach((setting) => {
      map.set(setting.invoiceTypeId, setting);
    });
    return map;
  }, [companyInvoiceSettings]);

  const selectableInvoiceTypeOptions = useMemo(() => {
    if (!companyInvoiceSettings.length) return invoiceTypeOptions;
    const allowedKeys = new Set(companyInvoiceSettings.map((setting) => String(setting.invoiceTypeId)));
    const filtered = invoiceTypeOptions.filter((detail) => allowedKeys.has(getDetailKey(detail)));
    return filtered.length ? filtered : invoiceTypeOptions;
  }, [invoiceTypeOptions, companyInvoiceSettings]);

  const customersArr = useMemo(() => {
    const raw = (customerList?.data ?? customerList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [customerList]);

  const consigneesArr = useMemo(() => {
    const raw = (consigneeList?.data ?? consigneeList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [consigneeList]);

  const domesticKey = useMemo(() => {
    const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'DOMESTIC' || Number(d.id) === 201);
    return detail ? getDetailKey(detail) : 'DOMESTIC';
  }, [selectableInvoiceTypeOptions]);

  const internationalKey = useMemo(() => {
    const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'EXPORT' || Number(d.id) === 202);
    return detail ? getDetailKey(detail) : 'EXPORT';
  }, [selectableInvoiceTypeOptions]);

  const jobworkKey = useMemo(() => {
    const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'WEAVING JOBWORK' || Number(d.id) === 203);
    return detail ? getDetailKey(detail) : 'WEAVING JOBWORK';
  }, [selectableInvoiceTypeOptions]);

  const yarnSalesKey = useMemo(() => {
    const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'YARN SALES' || Number(d.id) === 205);
    return detail ? getDetailKey(detail) : 'YARN SALES';
  }, [selectableInvoiceTypeOptions]);

  const sizingSalesKey = useMemo(() => {
    const detail = selectableInvoiceTypeOptions.find((d) => normalizeCodeValue(d.code || d.value) === 'SIZING SALES' || Number(d.id) === 204);
    return detail ? getDetailKey(detail) : 'SIZING SALES';
  }, [selectableInvoiceTypeOptions]);

  const matchesInvoiceTypeValue = (candidateValue: string, detailKey: string, fallbackId: number) => {
    if (!candidateValue) return false;
    if (detailKey && candidateValue === detailKey) return true;
    const numericCandidate = Number(candidateValue);
    return !Number.isNaN(numericCandidate) && numericCandidate === fallbackId;
  };

  const matchesSelectedInvoiceType = (detailKey: string, fallbackId: number) =>
    matchesInvoiceTypeValue(selectedInvoiceTypeId, detailKey, fallbackId);

  const isJobwork = matchesSelectedInvoiceType(jobworkKey, 203);
  const isDomesticInvoiceType = matchesSelectedInvoiceType(domesticKey, 201);
  const isInternationalInvoiceType = matchesSelectedInvoiceType(internationalKey, 202);
  const isYarnSalesInvoiceType = matchesSelectedInvoiceType(yarnSalesKey, 205);
  const isSizingSalesInvoiceType = matchesSelectedInvoiceType(sizingSalesKey, 204);

  const shouldShowSizingOrders = isSizingSalesInvoiceType;
  const shouldShowSalesOrders = !isJobwork && !isYarnSalesInvoiceType && !isSizingSalesInvoiceType;
  const shouldShowWeavingOrders = isJobwork;
  const shouldShowYarnSalesOrders = isYarnSalesInvoiceType;

  const targetSalesOrderTypeId = useMemo(() => {
    if (isDomesticInvoiceType) return 1;
    if (isInternationalInvoiceType) return 2;
    return null;
  }, [isDomesticInvoiceType, isInternationalInvoiceType]);

  const invoiceTypeTabName = useMemo(() => {
    if (matchesSelectedInvoiceType(jobworkKey, 203)) return "invoiceJobwork";
    if (matchesSelectedInvoiceType(yarnSalesKey, 205)) return "invoiceYarnSales";
    if (matchesSelectedInvoiceType(sizingSalesKey, 204)) return "invoiceSizingSales";
    if (matchesSelectedInvoiceType(internationalKey, 202)) return "invoiceExport";
    if (matchesSelectedInvoiceType(domesticKey, 201)) return "invoiceDomestic";
    return null;
  }, [selectedInvoiceTypeId, jobworkKey, yarnSalesKey, sizingSalesKey, internationalKey, domesticKey]);

  // Normalize sales orders list
  const salesOrdersArr = useMemo(() => {
    const raw = (salesOrderList?.data ?? salesOrderList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [salesOrderList]);

  const sizingJobWorkOrdersArr = useMemo(() => {
    const raw = (sizingJobWorkOrderList?.data ?? sizingJobWorkOrderList) || [];
    const fullList = Array.isArray(raw) ? raw : [];

    let list = fullList;
    if (isSizingSalesInvoiceType) {
      list = list.filter((order: any) => Number(order.orderTypeId) === 2);
    }

    // In edit mode, ensure the referenced order is in the list
    if (isEditMode) {
      const referencedId = invoiceDetail?.sizingWorkOrderId || invoiceDetail?.sizingJobWorkOrderId;
      const referencedNo = invoiceDetail?.soNo;

      if (referencedId || referencedNo) {
        const alreadyPresent = list.some((order: any) => {
          if (referencedId && String(order.id) === String(referencedId)) return true;
          if (referencedNo && normalizeComparableText(order.sizingWorkOrderNo || order.sizingJobWorkOrderNo || order.jobWorkOrderNo || order.orderNo) === normalizeComparableText(referencedNo)) return true;
          return false;
        });

        if (!alreadyPresent) {
          const foundInFull = fullList.find((order: any) => {
            if (referencedId && String(order.id) === String(referencedId)) return true;
            if (referencedNo && normalizeComparableText(order.sizingWorkOrderNo || order.sizingJobWorkOrderNo || order.jobWorkOrderNo || order.orderNo) === normalizeComparableText(referencedNo)) return true;
            return false;
          });

          if (foundInFull) {
            list = [foundInFull, ...list];
          } else if (referencedNo) {
            // Fallback - create a skeleton with a dummy ID if no ID is available
            const dummyId = referencedId || -999;
            list = [{
              id: dummyId,
              sizingWorkOrderNo: referencedNo,
              sizingJobWorkOrderNo: referencedNo,
              jobWorkOrderNo: referencedNo,
              orderNo: referencedNo,
              orderTypeId: 2
            }, ...list];
          }
        }
      }
    }
    return list;
  }, [sizingJobWorkOrderList, isSizingSalesInvoiceType, isEditMode, invoiceDetail]);

  const resolveSizingOrderNo = useCallback((sizingOrderId: number): string => {
    if (!sizingOrderId) return '';
    const list = sizingJobWorkOrdersArr;
    const order = list.find((s: any) => String(s?.id) === String(sizingOrderId));
    if (order) {
      return order.sizingWorkOrderNo || order.sizingJobWorkOrderNo || order.jobWorkOrderNo || order.orderNo || '';
    }
    if ((invoiceDetail?.sizingWorkOrderId === sizingOrderId || invoiceDetail?.sizingJobWorkOrderId === sizingOrderId) && invoiceDetail.soNo) {
      return invoiceDetail.soNo;
    }
    return '';
  }, [sizingJobWorkOrdersArr, invoiceDetail]);

  const deriveSalesOrderItemDetails = useCallback((productName?: string) => {
    if (!productName) return null;
    if (!selectedSalesOrder) return null;
    const normalizedTarget = normalizeComparableText(productName);
    if (!normalizedTarget) return null;
    const selectedOrder = salesOrdersArr.find((order: any) => String(order?.id) === String(selectedSalesOrder));
    if (!selectedOrder) return null;
    const orderItems = Array.isArray(selectedOrder.items)
      ? selectedOrder.items
      : Array.isArray(selectedOrder.SalesOrderItem)
        ? selectedOrder.SalesOrderItem
        : Array.isArray(selectedOrder.salesOrderItems)
          ? selectedOrder.salesOrderItems
          : [];
    if (!orderItems.length) return null;

    const buildDetails = (candidate: any) => {
      const priceKeys = isInternationalInvoiceType
        ? ['exportPricePerUnit', 'exportRate', 'exportPrice', 'pricePerUnit', 'rate', 'price']
        : ['pricePerUnit', 'rate', 'price'];
      let rateValue: number | null = null;
      for (const key of priceKeys) {
        const rawValue = candidate?.[key];
        if (rawValue === undefined || rawValue === null || rawValue === '') continue;
        const numericValue = Number(rawValue);
        if (!Number.isNaN(numericValue)) {
          rateValue = numericValue;
          break;
        }
      }
      if (rateValue === null) return null;
      const resolvedUom = resolveEntityUomName(candidate, normalizedUoms) || candidate?.uom || candidate?.uomName || null;
      return {
        rate: roundToTwoDecimals(rateValue),
        uom: resolvedUom ? String(resolvedUom).trim() : null,
      };
    };

    const targetFabricCode = normalizeComparableText(parseFabricCodeQualityParts(productName).fabricCode);
    if (targetFabricCode) {
      const fabricCandidate = orderItems.find((candidate: any) => {
        const candidateFabric = normalizeComparableText(
          candidate?.fabricCode || parseFabricCodeQualityParts(candidate?.fabricCodeQuality || '').fabricCode
        );
        return candidateFabric && candidateFabric === targetFabricCode;
      });
      if (fabricCandidate) {
        const details = buildDetails(fabricCandidate);
        if (details) return details;
      }
    }

    for (const candidate of orderItems) {
      const candidatesList = [
        candidate.productName,
        candidate.fabricCode,
        candidate.buyerProduct,
        candidate.quality,
        candidate.fabricCodeQuality,
      ];
      const matches = candidatesList.some((source) => {
        const normalizedSource = normalizeComparableText(source);
        if (!normalizedSource) return false;
        return (
          normalizedSource === normalizedTarget ||
          normalizedTarget.includes(normalizedSource) ||
          normalizedSource.includes(normalizedTarget)
        );
      });
      if (!matches) continue;
      const details = buildDetails(candidate);
      if (details) {
        return details;
      }
    }

    return null;
  }, [normalizedUoms, salesOrdersArr, selectedSalesOrder, isInternationalInvoiceType]);

  const deriveRateFromSalesOrder = useCallback((productName?: string) => {
    return deriveSalesOrderItemDetails(productName)?.rate ?? null;
  }, [deriveSalesOrderItemDetails]);

  const deriveUomFromSalesOrder = useCallback((productName?: string) => {
    return deriveSalesOrderItemDetails(productName)?.uom ?? null;
  }, [deriveSalesOrderItemDetails]);

  // Normalize weaving orders list
  const weavingOrdersArr = useMemo(() => {
    const raw = (weavingJobWorkOrderList?.data ?? weavingJobWorkOrderList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [weavingJobWorkOrderList]);

  const yarnSalesOrdersArr = useMemo(() => {
    const raw = (yarnSalesOrderList?.data ?? yarnSalesOrderList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [yarnSalesOrderList]);

  const yarnChallanArr = useMemo(() => {
    const raw = (yarnChallanList?.data ?? yarnChallanList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [yarnChallanList]);

  const yarnMasterArr = useMemo(() => {
    const raw = (yarnMasterList?.data ?? yarnMasterList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [yarnMasterList]);

  const yarnMasterMap = useMemo(() => {
    const map = new Map<number, string>();
    (Array.isArray(yarnMasterArr) ? yarnMasterArr : []).forEach((entry: any) => {
      const id = Number(entry?.id ?? entry?.data?.id);
      const name = entry?.yarnName || entry?.data?.yarnName || entry?.name || entry?.yarn;
      if (!Number.isNaN(id) && name) {
        map.set(id, name);
      }
    });
    return map
  }, [yarnMasterArr]);

  const transportsArr: any = useMemo(() => {
    // Handle different response structures
    if (Array.isArray(transportList)) {
      return transportList;
    }
    if (Array.isArray(transportList?.data)) {
      return transportList.data;
    }
    // If transportList is the full API response with nested data
    if (transportList?.data?.data && Array.isArray(transportList.data.data)) {
      return transportList.data.data;
    }
    return [];
  }, [transportList]);

  const gstMasterArr = useMemo(() => {
    const raw = (gstList?.data ?? gstList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [gstList]);

  const gstMap = useMemo(() => {
    const map = new Map<number, any>();
    (Array.isArray(gstMasterArr) ? gstMasterArr : []).forEach((entry: any) => {
      const id = Number(entry?.id);
      if (!Number.isNaN(id)) {
        map.set(id, entry);
      }
    });
    return map;
  }, [gstMasterArr]);

  // const invoiceArray = useMemo(() => {
  //   const raw = (invoiceList?.data ?? invoiceList) || [];
  //   return Array.isArray(raw) ? raw : [];
  // }, [invoiceList]);
  // src/pages/transaction/invoice.tsx (around line 1323)
  const invoiceArray = useMemo(() => {
    const raw = (invoiceList?.data ?? invoiceList) || [];
    const list = Array.isArray(raw) ? raw : [];

    // Filter by selected company so document number generation 
    // only considers records for the current company
    if (selectedCompanyId) {
      return list.filter((inv: any) =>
        Number(inv.companyId) === Number(selectedCompanyId) ||
        Number(inv.company_id) === Number(selectedCompanyId)
      );
    }
    return list;
  }, [invoiceList, selectedCompanyId]);


  const selectedInvoiceTypeDetail = useMemo(() => {
    if (!selectedInvoiceTypeId) return null;
    return selectableInvoiceTypeOptions.find((detail) => getDetailKey(detail) === selectedInvoiceTypeId) || null;
  }, [selectableInvoiceTypeOptions, selectedInvoiceTypeId]);

  const resolvedInvoiceTypeId = useMemo(() => {
    if (selectedInvoiceTypeDetail?.id != null) {
      const numeric = Number(selectedInvoiceTypeDetail.id);
      if (!Number.isNaN(numeric)) return numeric;
    }
    const numeric = Number(selectedInvoiceTypeId);
    return Number.isNaN(numeric) ? null : numeric;
  }, [selectedInvoiceTypeDetail, selectedInvoiceTypeId]);

  const selectedCompanyInvoiceSetting = useMemo(() => {
    if (resolvedInvoiceTypeId) {
      const config = companyInvoiceSettingsMap.get(resolvedInvoiceTypeId);
      if (config) return config;
    }
    const numeric = Number(selectedInvoiceTypeId);
    if (!Number.isNaN(numeric)) {
      const config = companyInvoiceSettingsMap.get(numeric);
      if (config) return config;
    }
    return null;
  }, [companyInvoiceSettingsMap, resolvedInvoiceTypeId, selectedInvoiceTypeId]);

  const invoiceTypePrefix = useMemo(() => {
    let prefix = '';
    if (selectedCompanyInvoiceSetting?.prefix) {
      prefix = selectedCompanyInvoiceSetting.prefix;
    } else {
      prefix = getInvoicePrefixFromDetail(selectedInvoiceTypeDetail);
    }
    if (companyInfo?.companyCode && prefix) {
      const cmpToken = `${companyInfo.companyCode}/`;
      if (prefix.startsWith(cmpToken)) {
        prefix = prefix.slice(cmpToken.length);
      } else if (prefix === companyInfo.companyCode) {
        prefix = '';
      }
    }
    return prefix;
  }, [selectedCompanyInvoiceSetting, selectedInvoiceTypeDetail, companyInfo]);

  const applyInvoicePrefix = useCallback((value: string) => {
    if (!value) return value;
    let baseNumber = stripExistingInvoicePrefix(value);

    // Strip company code from baseNumber if present
    if (companyInfo?.companyCode) {
      const cmpToken = `${companyInfo.companyCode}/`;
      if (baseNumber.startsWith(cmpToken)) {
        baseNumber = baseNumber.slice(cmpToken.length);
      }
    }

    let settingPrefix = selectedCompanyInvoiceSetting?.prefix || '';
    if (companyInfo?.companyCode && settingPrefix) {
      const cmpToken = `${companyInfo.companyCode}/`;
      if (settingPrefix.startsWith(cmpToken)) {
        settingPrefix = settingPrefix.slice(cmpToken.length);
      } else if (settingPrefix === companyInfo.companyCode) {
        settingPrefix = '';
      }
    }

    if (settingPrefix) {
      const token = `${settingPrefix}/`;
      if (baseNumber.startsWith(token)) {
        baseNumber = baseNumber.slice(token.length);
      }
    }

    if (!invoiceTypePrefix) {
      return baseNumber;
    }
    return `${invoiceTypePrefix}/${baseNumber}`;
  }, [invoiceTypePrefix, selectedCompanyInvoiceSetting, companyInfo]);

  const resolvedYarnSalesOrderId = useMemo(() => {
    const numeric = Number(selectedYarnSalesOrderId);
    return Number.isNaN(numeric) ? null : numeric;
  }, [selectedYarnSalesOrderId]);

  const resolvedSizingWorkOrderId = useMemo(() => {
    const numeric = Number(selectedSizingWorkOrderId);
    return Number.isNaN(numeric) ? null : numeric;
  }, [selectedSizingWorkOrderId]);

  const fabricMasterArr = useMemo(() => {
    const raw = (fabricMasterList?.data ?? fabricMasterList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [fabricMasterList]);

  const fabricMasterMap = useMemo(() => {
    const map = new Map<string, { fabricCode: string; quality: string; uom?: string }>();
    fabricMasterArr.forEach((fm: any) => {
      const keyCandidates = normalizeKeyValues([fm?.id, fm?.fabricMasterId, fm?.fabricCodeId]);
      const key = keyCandidates[0];
      if (!key) return;
      const fabricCode = String(fm?.fabricCode || fm?.code || fm?.fabricCodeName || '').trim();
      const quality = String(fm?.fabricQuality || fm?.quality || fm?.fabricQualityName || '').trim();
      const rawUom = String(fm?.uom?.uomName || fm?.uomName || fm?.uom || '').trim();
      map.set(key, {
        fabricCode,
        quality,
        uom: rawUom || undefined
      });
    });
    return map;
  }, [fabricMasterArr]);

  const extractFabricMasterIdFromEntry = (entry: any): number | null => {
    if (!entry) return null;
    const keys = [entry?.fabricMasterId, entry?.fabricMasterID, entry?.fabricCodeId, entry?.fabricId, entry?.id];
    for (const key of keys) {
      if (key === undefined || key === null || key === '') continue;
      const numeric = Number(key);
      if (!Number.isNaN(numeric) && numeric > 0) {
        return numeric;
      }
    }
    return null;
  };

  const resolveFabricMasterIdFromProductName = useCallback((value?: string | null): number | null => {
    if (!value) return null;
    const normalizedTargetFull = normalizeComparableText(value);
    if (!normalizedTargetFull) return null;
    const { fabricCode, quality } = parseFabricCodeQualityParts(value);
    const normalizedTargetCode = normalizeComparableText(fabricCode);
    const normalizedTargetQuality = normalizeComparableText(quality);

    const normalizedCandidates = fabricMasterArr.map((entry: any) => {
      const { fabricCode: parsedFabricCode, quality: parsedQuality } = parseFabricCodeQualityParts(entry?.fabricCodeQuality || '');
      const rawCode = entry?.fabricCode || entry?.code || entry?.fabricCodeName || parsedFabricCode || '';
      const rawQuality = entry?.fabricQuality || entry?.quality || entry?.fabricQualityName || parsedQuality || '';
      return {
        entry,
        normalizedCode: normalizeComparableText(rawCode),
        normalizedQuality: normalizeComparableText(rawQuality),
        normalizedFull: normalizeComparableText([rawCode, rawQuality].filter(Boolean).join(' - '))
      };
    });

    const directMatch = normalizedCandidates.find((candidate) =>
      candidate.normalizedFull && normalizedTargetFull && candidate.normalizedFull === normalizedTargetFull
    );
    if (directMatch) {
      return extractFabricMasterIdFromEntry(directMatch.entry);
    }

    const codeQualityMatch = normalizedCandidates.find((candidate) =>
      normalizedTargetCode && candidate.normalizedCode && candidate.normalizedCode === normalizedTargetCode &&
      normalizedTargetQuality && candidate.normalizedQuality && candidate.normalizedQuality === normalizedTargetQuality
    );
    if (codeQualityMatch) {
      return extractFabricMasterIdFromEntry(codeQualityMatch.entry);
    }

    const codeMatch = normalizedCandidates.find((candidate) =>
      normalizedTargetCode && candidate.normalizedCode && candidate.normalizedCode === normalizedTargetCode
    );
    if (codeMatch) {
      return extractFabricMasterIdFromEntry(codeMatch.entry);
    }

    const containsMatch = normalizedCandidates.find((candidate) =>
      normalizedTargetFull && candidate.normalizedCode && normalizedTargetFull.includes(candidate.normalizedCode)
    );
    if (containsMatch) {
      return extractFabricMasterIdFromEntry(containsMatch.entry);
    }

    const qualityMatch = normalizedCandidates.find((candidate) =>
      normalizedTargetFull && candidate.normalizedQuality && normalizedTargetFull.includes(candidate.normalizedQuality)
    );
    if (qualityMatch) {
      return extractFabricMasterIdFromEntry(qualityMatch.entry);
    }

    return null;
  }, [fabricMasterArr]);

  const deriveInvoiceItemFabricMasterId = useCallback((item: Partial<InvoiceItem>) => {
    const existingId = Number(item?.fabricMasterId ?? 0);
    if (!Number.isNaN(existingId) && existingId > 0) {
      return existingId;
    }
    const derived = resolveFabricMasterIdFromProductName(item?.productName);
    return derived ?? 0;
  }, [resolveFabricMasterIdFromProductName]);

  const updateInvoiceItemsGst = useCallback((gstPercent: number) => {
    if (gstPercent == null || Number.isNaN(gstPercent)) return;
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const quantity = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);
        return {
          ...item,
          gstPercent,
          taxableAmount,
          gstAmount,
          totalAmount,
          amount: totalAmount,
        };
      }),
    }));
  }, [setInvoiceData]);

  const applyGstFromMaster = useCallback((gstPercentId?: string | number | null, gstTypeOverride?: string | null, fallbackPercent?: number | null) => {
    const type = gstTypeOverride ?? selectedValues.gstType;
    const numericId = gstPercentId !== undefined && gstPercentId !== null && gstPercentId !== '' ? Number(gstPercentId) : NaN;
    const entry = !Number.isNaN(numericId) ? gstMap.get(numericId) : null;
    const fallback = fallbackPercent !== undefined && fallbackPercent !== null ? Number(fallbackPercent) : null;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let total = 0;

    if (entry) {
      const entryCgst = Number(entry.cgstRate || 0);
      const entrySgst = Number(entry.sgstRate || 0);
      const entryIgst = Number(entry.igstRate || 0);
      if (type === '1') {
        cgst = entryCgst;
        sgst = entrySgst;
        total = cgst + sgst;
      } else if (type === '2') {
        igst = entryIgst;
        total = igst;
      } else if (entryIgst) {
        igst = entryIgst;
        total = entryIgst;
      } else {
        cgst = entryCgst;
        sgst = entrySgst;
        total = cgst + sgst;
      }
    } else if (fallback !== null && !Number.isNaN(fallback)) {
      if (type === '1') {
        total = fallback;
        cgst = fallback / 2;
        sgst = fallback / 2;
      } else if (type === '2') {
        total = fallback;
        igst = fallback;
      } else {
        total = fallback;
      }
    } else {
      setGstPerc(0);
      setCgstPerc(0);
      setSgstPerc(0);
      setIgstPerc(0);
      updateInvoiceItemsGst(0);
      return 0;
    }

    setGstPerc(total);
    setCgstPerc(cgst);
    setSgstPerc(sgst);
    setIgstPerc(igst);
    updateInvoiceItemsGst(total);
    return total;
  }, [gstMap, selectedValues.gstType, updateInvoiceItemsGst]);

  const parseInvoiceNumberParts = useCallback((value?: string | null): InvoiceNumberParts | null => {
    if (!value || typeof value !== 'string') return null;
    const segments = value.split('/');
    if (segments.length === 0) return null;
    const seqToken = segments[segments.length - 1];
    const seqValue = Number(seqToken);
    if (Number.isNaN(seqValue)) return null;
    const financialYear = segments.length >= 2 ? segments[segments.length - 2] : null;
    return {
      segments,
      seqValue,
      digits: seqToken.length,
      financialYear
    };
  }, []);

  const rebuildInvoiceNumber = useCallback((parts: InvoiceNumberParts, nextSequence: number) => {
    const updated = parts.segments.slice();
    const targetIndex = updated.length - 1;
    updated[targetIndex] = String(nextSequence).padStart(parts.digits, '0');
    return updated.join('/');
  }, []);

  // Get selected SO object
  const selectedSOObject = useMemo(() => {
    if (!selectedSalesOrder) return null;
    return salesOrdersArr.find((so: any) => String(so.id) === String(selectedSalesOrder)) || null;
  }, [salesOrdersArr, selectedSalesOrder]);

  useEffect(() => {
    if (hasUserAdjustedInvoiceType) return;
    if (!selectableInvoiceTypeOptions.length) return;

    let derivedId = invoiceDetail?.invoiceTypeId ? String(invoiceDetail.invoiceTypeId) : '';

    if (!derivedId && Number(invoiceDetail?.isJobwork) === 1) {
      derivedId = jobworkKey;
    } else if (!derivedId && invoiceDetail?.yarnSalesOrderId) {
      derivedId = yarnSalesKey;
    } else if (!derivedId && selectedSOObject) {
      const orderType = Number(selectedSOObject.orderTypeId ?? selectedSOObject.orderType);
      if (orderType === 2) {
        derivedId = internationalKey;
      } else if (orderType === 1) {
        derivedId = domesticKey;
      }
    } else if (!derivedId && invoiceDetailTabName) {
      const tab = String(invoiceDetailTabName).toLowerCase();
      if (tab.includes('export')) {
        derivedId = internationalKey;
      } else if (tab.includes('domestic')) {
        derivedId = domesticKey;
      }
    }

    if (!derivedId) {
      derivedId = domesticKey || getDetailKey(selectableInvoiceTypeOptions[0]);
    }

    if (derivedId && derivedId !== selectedInvoiceTypeId) {
      setSelectedInvoiceTypeId(derivedId);
    }
  }, [
    hasUserAdjustedInvoiceType,
    invoiceDetail,
    invoiceDetailTabName,
    selectedSOObject,
    domesticKey,
    internationalKey,
    jobworkKey,
    selectableInvoiceTypeOptions,
    selectedInvoiceTypeId
  ]);

  const getMappedInvoiceTabName = useCallback(() => {
    const baseTab = (() => {
      if (invoiceTypeTabName) return invoiceTypeTabName;
      if (tabNameFromState) return tabNameFromState;
      if (invoiceDetailTabName) return invoiceDetailTabName;
      if (selectedSOObject) {
        const orderType = Number(selectedSOObject.orderTypeId ?? selectedSOObject.orderType);
        if (orderType === 2) return "export";
        if (orderType === 1) return "domestic";
      }
      return "domestic";
    })();

    if (baseTab === "domestic") return "invoiceDomestic";
    if (baseTab === "export") return "invoiceExport";
    return baseTab;
  }, [invoiceTypeTabName, tabNameFromState, invoiceDetailTabName, selectedSOObject]);

  const ensureUniqueInvoiceNumber = useCallback((candidate: string) => {
    const typeId = resolvedInvoiceTypeId;
    if (!candidate || !typeId) return candidate;
    const candidateParts = parseInvoiceNumberParts(candidate);
    if (!candidateParts) return candidate;
    let highestSequence = candidateParts.seqValue;
    invoiceArray.forEach((invoice: any) => {
      const rawTypeId = invoice?.invoiceTypeId ?? invoice?.invoiceType?.id;
      const numericTypeId = Number(rawTypeId);
      if (Number.isNaN(numericTypeId) || numericTypeId !== typeId) {
        return;
      }
      const existingParts = parseInvoiceNumberParts(invoice?.invoiceNo);
      if (!existingParts) {
        return;
      }
      if (candidateParts.financialYear && existingParts.financialYear && existingParts.financialYear !== candidateParts.financialYear) {
        return;
      }
      if (existingParts.seqValue > highestSequence) {
        highestSequence = existingParts.seqValue;
      }
    });
    if (highestSequence === candidateParts.seqValue) {
      return candidate;
    }
    const nextSequence = highestSequence + 1;
    return rebuildInvoiceNumber(candidateParts, nextSequence);
  }, [resolvedInvoiceTypeId, parseInvoiceNumberParts, invoiceArray, rebuildInvoiceNumber]);


  useEffect(() => {
    if (!invoiceDetailInvoiceNo) return;
    setInvoiceData(prev => {
      const formatted = applyInvoicePrefix(invoiceDetailInvoiceNo);
      if (prev.invoiceNo === formatted) {
        return prev;
      }
      return { ...prev, invoiceNo: formatted };
    });
  }, [invoiceDetailInvoiceNo, applyInvoicePrefix]);

  useEffect(() => {
    if (invoiceDetailInvoiceNo) return;
    if (!selectedCompanyInvoiceSetting) return;
    if (!companyInvoiceSettings.length) return;
    if (!resolvedInvoiceTypeId) return;
    if (invoiceData.invoiceNo) return;
    const companyForSequence = selectedCompanyId ?? loggedInCompanyId ?? undefined;

    const generated = invoiceNumberService.generateInvoiceNumber({
      invoiceTypeId: resolvedInvoiceTypeId,
      invoiceSettings: companyInvoiceSettings,
      invoices: invoiceArray,
      companyId: companyForSequence,
      companyCode: companyInfo?.companyCode
    });

    if (!generated?.invoiceNo) return;
    const formatted = applyInvoicePrefix(generated.invoiceNo);
    const uniqueValue = ensureUniqueInvoiceNumber(formatted);

    setInvoiceData(prev => {
      if (prev.invoiceNo === uniqueValue) {
        return prev;
      }
      return { ...prev, invoiceNo: uniqueValue };
    });
  }, [
    invoiceDetailInvoiceNo,
    selectedCompanyInvoiceSetting,
    companyInvoiceSettings,
    resolvedInvoiceTypeId,
    invoiceData.invoiceNo,
    invoiceArray,
    applyInvoicePrefix,
    ensureUniqueInvoiceNumber,
    selectedCompanyId,
    loggedInCompanyId
  ]);

  useEffect(() => {
    setInvoiceData(prev => {
      if (!prev.invoiceNo) return prev;
      const formatted = applyInvoicePrefix(prev.invoiceNo);
      if (formatted === prev.invoiceNo) {
        return prev;
      }
      return { ...prev, invoiceNo: formatted };
    });
  }, [applyInvoicePrefix]);

  useEffect(() => {
    setInvoiceData(prev => {
      if (!prev.invoiceNo) return prev;
      const uniqueValue = ensureUniqueInvoiceNumber(prev.invoiceNo);
      if (uniqueValue === prev.invoiceNo) {
        return prev;
      }
      return { ...prev, invoiceNo: uniqueValue };
    });
  }, [ensureUniqueInvoiceNumber]);

  useEffect(() => {
    if (!activeGstPercentId) return;
    applyGstFromMaster(activeGstPercentId);
  }, [activeGstPercentId, applyGstFromMaster]);

  // Get selected WO object  
  const selectedWOObject = useMemo(() => {
    if (!selectedWeavingWorkOrderId) return null;
    return weavingOrdersArr.find((wo: any) => String(wo.id) === String(selectedWeavingWorkOrderId)) || selectedWeavingOrder;
  }, [weavingOrdersArr, selectedWeavingWorkOrderId, selectedWeavingOrder]);

  const selectedSizingWorkOrderObject = useMemo(() => {
    if (!selectedSizingWorkOrderId) return null;
    return sizingJobWorkOrdersArr.find((order: any) => String(order.id) === String(selectedSizingWorkOrderId)) || selectedSizingWorkOrder;
  }, [sizingJobWorkOrdersArr, selectedSizingWorkOrderId, selectedSizingWorkOrder]);

  const deriveWeavingOrderItemDetails = useCallback((line: PackingLine) => {
    if (!selectedWOObject) return null;
    const items = Array.isArray(selectedWOObject.items) ? selectedWOObject.items : [];
    if (!items.length) return null;
    const normalizedLineFabricId = normalizeKeyValues([line.fabricMasterId])[0];
    const { fabricCode, quality } = parseFabricCodeQualityParts(line.fabricCodeQuality || '');
    const normalizedLineFabricCode = normalizeComparableText(fabricCode);
    const normalizedLineQuality = normalizeComparableText(quality);
    const matchesCandidate = (candidate: any) => {
      const candidateFabricIds = normalizeKeyValues([
        candidate?.fabricMasterId,
        candidate?.fabricCodeId,
        candidate?.fabricId,
        candidate?.fabricCode
      ]);
      if (normalizedLineFabricId && candidateFabricIds.some(id => id === normalizedLineFabricId)) return true;
      const candidateCode = normalizeComparableText(candidate?.fabricCode || candidate?.fabricCodeName);
      if (normalizedLineFabricCode && candidateCode && candidateCode === normalizedLineFabricCode) return true;
      const candidateQuality = normalizeComparableText(candidate?.fabricQuality || candidate?.quality);
      if (normalizedLineQuality && candidateQuality && candidateQuality === normalizedLineQuality) return true;
      return false;
    };
    let matchedItem = items.find(matchesCandidate);
    if (!matchedItem) {
      matchedItem = items[0];
    }
    if (!matchedItem) return null;
    const rawRate = Number(matchedItem?.ratePerUnit ?? matchedItem?.rate ?? matchedItem?.pricePerUnit ?? 0);
    if (Number.isNaN(rawRate)) return null;
    const candidateUomKeys = normalizeKeyValues([matchedItem?.uomId, matchedItem?.uom?.id]);
    let resolvedUom = candidateUomKeys.length ? uomMap.get(candidateUomKeys[0]) : undefined;
    if (!resolvedUom) {
      resolvedUom = matchedItem?.uomName || matchedItem?.uom?.uomName || matchedItem?.uom?.name || undefined;
    }
    if (!resolvedUom && normalizedLineFabricId) {
      const fabricMeta = fabricMasterMap.get(normalizedLineFabricId);
      if (fabricMeta?.uom) {
        resolvedUom = fabricMeta.uom;
      }
    }
    return {
      rate: roundToTwoDecimals(rawRate),
      uom: resolvedUom
    };
  }, [selectedWOObject, fabricMasterMap, uomMap]);

  const selectedYarnSalesOrder = useMemo(() => {
    if (!selectedYarnSalesOrderId) return null;
    return yarnSalesOrdersArr.find((order: any) => String(order.id) === String(selectedYarnSalesOrderId)) || null;
  }, [yarnSalesOrdersArr, selectedYarnSalesOrderId]);

  const yarnChallanLines = useMemo(() => {
    if (!shouldShowYarnSalesOrders || !resolvedYarnSalesOrderId) return [];

    const warehouses = normalizedWarehouseList;
    const uoms = Array.isArray(uomList) ? uomList : [];

    const getWarehouseName = (warehouseId?: number | string | null) => {
      if (warehouseId == null || warehouseId === '') return '';
      const match = warehouses.find((w: any) => String(w.id) === String(warehouseId));
      return match?.warehouseName || match?.name || '';
    };

    const getUomName = (uomId?: number | string | null) => {
      if (uomId == null || uomId === '') return 'Kg';
      const match = uoms.find((u: any) => String(u.id) === String(uomId));
      return match?.uomName || match?.name || 'Kg';
    };

    const challans = (Array.isArray(yarnChallanArr) ? yarnChallanArr : []).filter((challan: any) =>
      Number(challan?.yarnSalesOrderId) === resolvedYarnSalesOrderId
    );

    const rawLines: YarnChallanLine[] = challans.flatMap((challan: any) => {
      const challanItems = Array.isArray(challan?.items) ? challan.items : [];
      const issueDetails = Array.isArray(challan?.yarnIssueDetails) ? challan.yarnIssueDetails : [];
      const invoiceEligibleItems = challanItems.filter((item: any) => Number(item?.isInvoice ?? 0) === 0);

      return invoiceEligibleItems.map((item: any, idx: number) => {
        const yarnId = Number(item?.yarnId ?? item?.yarn?.id);
        const itemIdentifierKeys = new Set(
          normalizeKeyValues([
            item?.id,
            item?.yarnSalesItemId,
            item?.yarnSalesItem?.id,
            item?.salesOrderItemId,
            item?.orderItemId,
          ])
        );
        const yarnIdentifierKeys = new Set(
          normalizeKeyValues([
            yarnId,
            item?.yarn?.id,
            item?.yarn?.yarnId,
          ])
        );
        const matchingIssues = issueDetails.filter((detail: any) => {
          const detailItemKeys = normalizeKeyValues([
            detail?.yarnSalesItemId,
            detail?.yarnSalesItem?.id,
            detail?.itemId,
            detail?.salesOrderItemId,
          ]);
          if (detailItemKeys.some((key) => itemIdentifierKeys.has(key))) {
            return true;
          }
          const detailYarnKeys = normalizeKeyValues([
            detail?.yarnId,
            detail?.yarn?.id,
          ]);
          return detailYarnKeys.some((key) => yarnIdentifierKeys.has(key));
        });
        const primaryIssue = matchingIssues[0];
        const issueWarehouseIds = matchingIssues
          .map((detail: any) => detail?.warehouseId ?? detail?.warehouse?.id)
          .filter((id: any) => id !== null && id !== undefined && id !== '');
        const resolvedWarehouseId = issueWarehouseIds.length
          ? Number(issueWarehouseIds[0])
          : Number(item?.warehouseId ?? challan?.warehouseId ?? 0) || undefined;
        const warehouseNameCandidates = matchingIssues
          .map((detail: any) => detail?.warehouse?.warehouseName || detail?.warehouseName || getWarehouseName(detail?.warehouseId))
          .filter((name: any) => !!name);
        const warehouseName = warehouseNameCandidates.length
          ? Array.from(new Set(warehouseNameCandidates)).join(', ')
          : getWarehouseName(resolvedWarehouseId);
        const quantity = Number(item?.issueQty ?? primaryIssue?.issueQty ?? item?.orderQuantity ?? 0);
        const rate = Number(item?.ratePerUnit) || 0;
        const rawGstPercentId = item?.gstPercentId ?? item?.gstPercent?.id;
        const normalizedGstPercentId = rawGstPercentId !== undefined && rawGstPercentId !== null && rawGstPercentId !== '' ? Number(rawGstPercentId) : undefined;
        let gstPercent = Number(item?.gstPercent ?? 0);
        if (Number.isNaN(gstPercent)) {
          gstPercent = 0;
        }
        if ((!gstPercent || gstPercent === 0) && normalizedGstPercentId !== undefined) {
          const gstEntry = gstMap.get(normalizedGstPercentId);
          if (gstEntry) {
            if (selectedValues.gstType === '2') {
              gstPercent = Number(gstEntry.igstRate || 0);
            } else {
              const cgstRate = Number(gstEntry.cgstRate || 0);
              const sgstRate = Number(gstEntry.sgstRate || 0);
              gstPercent = cgstRate + sgstRate;
            }
          }
        }
        if ((!gstPercent || gstPercent === 0) && normalizedGstPercentId !== undefined) {
          gstPercent = Number(normalizedGstPercentId) || 0;
        }
        const yarnNameSource = item?.yarn?.yarnName || yarnMasterMap.get(yarnId) || '';
        const fallbackName = yarnId ? `Yarn ${yarnId}` : 'Yarn Item';
        const uniqueId = `${challan?.id || 0}-${item?.id || idx}`;

        return {
          id: uniqueId,
          challanId: Number(challan?.id) || 0,
          challanNo: challan?.challanNo || '',
          challanDate: challan?.challanDate || '',
          itemId: Number(item?.id) || 0,
          yarnId,
          itemName: yarnNameSource || fallbackName,
          quantity,
          uom: getUomName(item?.uomId),
          rate,
          gstPercent,
          gstPercentId: normalizedGstPercentId,
          warehouseId: resolvedWarehouseId,
          warehouseName,
          hsnCode: item?.hsnCode ? String(item.hsnCode) : '',
        } as YarnChallanLine;
      });
    });

    const groupedByChallan = new Map<string, YarnChallanLine[]>();
    rawLines.forEach((line) => {
      const key = line.challanNo || String(line.challanId) || line.id;
      const existing = groupedByChallan.get(key);
      if (existing) {
        existing.push(line);
      } else {
        groupedByChallan.set(key, [line]);
      }
    });

    const aggregatedLines: YarnChallanLine[] = [];
    groupedByChallan.forEach((lines, key) => {
      if (lines.length <= 1) {
        aggregatedLines.push(lines[0]);
        return;
      }
      const base = lines[0];
      const uniqueNames = Array.from(new Set(lines.map((entry) => entry.itemName).filter(Boolean))).join(', ');
      const quantityDisplay = lines
        .map((entry) => {
          const qty = Number(entry.quantity ?? 0);
          return Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
        })
        .join(', ');
      const warehouseNames = Array.from(new Set(lines.map((entry) => entry.warehouseName).filter(Boolean))).join(', ');

      aggregatedLines.push({
        ...base,
        id: `group-${base.challanId || base.id || key}`,
        itemName: uniqueNames || base.itemName,
        quantity: lines.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0),
        quantityDisplay,
        warehouseName: warehouseNames || base.warehouseName,
        childItems: lines,
      });
    });

    return aggregatedLines;
  }, [shouldShowYarnSalesOrders, resolvedYarnSalesOrderId, yarnChallanArr, yarnMasterMap, normalizedWarehouseList, uomList, gstMap, selectedValues.gstType]);

  const sizingBeamOutwardLines = useMemo(() => {
    if (!isSizingSalesInvoiceType || !resolvedSizingWorkOrderId) return [];

    const list = Array.isArray(sizingBeamOutwardList) ? sizingBeamOutwardList : [];

    return list
      .filter((entry: any) => Number(entry?.sizingOrderId) === resolvedSizingWorkOrderId && entry.isReturn !== 1)
      .map((entry: any) => {
        // Find matching production details to fetch net weight and meters
        const matchingProduction = Array.isArray(sizingProductionList)
          ? sizingProductionList.find((p: any) => Number(p.sizingOrderId) === Number(entry.sizingOrderId))
          : null;

        const productionDetails = Array.isArray(matchingProduction?.productionDetails)
          ? matchingProduction.productionDetails
          : Array.isArray(entry.productionDetails)
            ? entry.productionDetails
            : [];

        const sumNetWt = productionDetails.reduce((sum: number, p: any) => sum + (Number(p.netWt) || 0), 0);
        const sumMeters = productionDetails.reduce((sum: number, p: any) => sum + (Number(p.beamMeters) || 0), 0);
        const firstEnds = productionDetails[0]?.totalEnds || 0;

        return {
          id: entry.id,
          sizingBeamOutwardNo: entry.sizingBeamOutwardNo || entry.sizingProductionNo || matchingProduction?.sizingProductionNo || '',
          sizingOrderId: entry.sizingOrderId,
          sizingOrderNo: entry.sizingOrderNo || matchingProduction?.sizingOrderNo || '',
          yarnName: entry.yarnName || matchingProduction?.yarnName || '',
          noOfBeams: entry.summary?.noOfBeams || entry.noOfBeams || matchingProduction?.noOfBeams || productionDetails.length || 0,
          beamMeters: entry.summary?.totalBeamMeters || entry.beamMeters || sumMeters || entry.totalMeters || entry.summary?.totalMeters || matchingProduction?.totalMeters || 0,
          totalEnds: entry.summary?.totalEnds || firstEnds || entry.totalEnds || matchingProduction?.summary?.sizingCount || 0,
          yarnId: entry.yarnId || matchingProduction?.yarnId,
          rate: entry.sizingRatePerKg || matchingProduction?.sizingRatePerKg || 0,
          gstPercent: 0,
          netWeight: sumNetWt || entry.totalNetWeight || entry.summary?.totalNetWeight || entry.summary?.totalNetWt || entry.netWt || matchingProduction?.totalNetWeight || 0,
        } as SizingBeamOutwardLine;
      });
  }, [isSizingSalesInvoiceType, resolvedSizingWorkOrderId, sizingBeamOutwardList, sizingProductionList]);

  const itemTableColumnCount = isYarnSalesInvoiceType ? 12 : isSizingSalesInvoiceType ? 14 : 13;
  const modalSelectableLines = isYarnSalesInvoiceType
    ? yarnChallanLines
    : isSizingSalesInvoiceType
      ? sizingBeamOutwardLines
      : packingLines;

  // Buyer list - prioritize order-specific parties, fall back to master lists
  const filteredBuyerList = useMemo(() => {
    if (shouldShowYarnSalesOrders) {
      if (selectedYarnSalesOrder) {
        const candidateIds = [
          selectedYarnSalesOrder.buyerId,
          selectedYarnSalesOrder?.buyer?.id,
        ].filter((id) => id != null);
        let matches = customersArr.filter((entry: any) =>
          candidateIds.some((id) => String(entry.id) === String(id))
        );
        if (!matches.length) {
          const buyerName = selectedYarnSalesOrder?.buyer?.customerName;
          if (buyerName) {
            const lc = String(buyerName).toLowerCase();
            matches = customersArr.filter((entry: any) =>
              String(entry.customerName ?? entry.name ?? '')?.toLowerCase() === lc
            );
          }
        }
        if (matches.length) {
          return matches;
        }
      }
      return customersArr;
    }

    if (isJobwork) {
      if (selectedWOObject) {
        const candidateIds = [
          selectedWOObject.buyerCompanyId,
          selectedWOObject.buyerId,
          selectedWOObject?.buyer?.id,
        ].filter((id) => id != null);
        let matches = customersArr.filter((entry: any) =>
          candidateIds.some((id) => String(entry.id) === String(id))
        );
        if (!matches.length) {
          const buyerName = selectedWOObject.buyerName || selectedWOObject?.buyer?.customerName;
          if (buyerName) {
            const lc = String(buyerName).toLowerCase();
            matches = customersArr.filter((entry: any) =>
              String(entry.customerName ?? entry.name ?? '')?.toLowerCase() === lc
            );
          }
        }
        if (matches.length) {
          return matches;
        }
      }
      return customersArr;
    }

    if (selectedSOObject) {
      const candidateIds = [
        selectedSOObject.customerId,
        selectedSOObject.buyerCustomerId,
        selectedSOObject?.buyerCustomer?.id,
      ].filter((id) => id != null);
      let matches = customersArr.filter((entry: any) =>
        candidateIds.some((id) => String(entry.id) === String(id))
      );
      if (!matches.length) {
        const buyerName = selectedSOObject.buyerCustomerName || selectedSOObject?.buyerCustomer?.customerName;
        if (buyerName) {
          const lc = String(buyerName).toLowerCase();
          matches = customersArr.filter((entry: any) =>
            String(entry.customerName ?? entry.name ?? '')?.toLowerCase() === lc
          );
        }
      }
      if (matches.length) {
        return matches;
      }
    }

    return customersArr;
  }, [isJobwork, selectedWOObject, selectedSOObject, companyMasterArr, customersArr]);

  // Consignee list - display all data in dropdown
  const filteredConsigneeList = useMemo(() => {
    return consigneesArr;
  }, [consigneesArr]);

  const invoiceTypeSelectOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    selectableInvoiceTypeOptions
      .map((detail) => {
        const value = getDetailKey(detail);
        const label = getDetailLabel(detail);
        if (!value || !label) return null;
        return {
          id: detail.id ?? value,
          value,
          label
        };
      })
      .filter(Boolean) as CommonSearchableSelectOption[],
    [selectableInvoiceTypeOptions]
  );

  const shipmentTermOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (shipmentTermsList ?? [])
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.termName || entry?.name || ''
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [shipmentTermsList]
  );

  const paymentTermOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (paymentTermsList ?? [])
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.termName || entry?.name || '',
        activeFlag: entry?.activeFlag ?? true
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [paymentTermsList]
  );

  const shipmentModeOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (shipmentModesList ?? [])
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.modeName || entry?.name || '',
        activeFlag: entry?.activeFlag ?? true
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [shipmentModesList]
  );

  const bankOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (companyBanks ?? [])
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.bankName || entry?.name || ''
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [companyBanks]
  );

  const termsConditionsOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (termsContitionsList ?? [])
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.termsConditionsName || entry?.name || '',
        activeFlag: entry?.activeFlag ?? true
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [termsContitionsList]
  );

  const transportOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (Array.isArray(transportsArr) ? transportsArr : [])
      .slice()
      .sort((a: any, b: any) => (String(a?.transportName || '').localeCompare(String(b?.transportName || ''))))
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.transportName || entry?.name || '',
        activeFlag: entry?.activeFlag ?? true
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [transportsArr]
  );

  const warehouseOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (normalizedWarehouseList ?? [])
      .slice()
      .sort((a: any, b: any) => (String(a?.warehouseName || a?.name || '').localeCompare(String(b?.warehouseName || b?.name || ''))))
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.warehouseName || entry?.name || '',
        activeFlag: entry?.activeFlag ?? true
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [normalizedWarehouseList]
  );

  const agentOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (Array.isArray(agentMasterList) ? agentMasterList : [])
      .slice()
      .sort((a: any, b: any) => (String(a?.agentName || '').localeCompare(String(b?.agentName || ''))))
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.agentName || '',
        activeFlag: entry?.activeFlag ?? true
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [agentMasterList]
  );

  const buyerOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (filteredBuyerList ?? [])
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.customerName || entry?.companyName || entry?.name || '',
        activeFlag: entry?.activeFlag ?? true
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [filteredBuyerList]
  );

  const consigneeOptions = useMemo<CommonSearchableSelectOption[]>(() =>
    (filteredConsigneeList ?? [])
      .map((entry: any) => ({
        id: entry?.id,
        value: String(entry?.id),
        label: entry?.consigneeName || entry?.name || '',
        activeFlag: entry?.activeFlag ?? true
      }))
      .filter(isValidSelectOption) as CommonSearchableSelectOption[],
    [filteredConsigneeList]
  );

  const hydrateBuyerDetails = useCallback((customerIdValue: string | number | null | undefined) => {
    if (!customerIdValue) {
      setInvoiceData(prev => ({
        ...prev,
        buyer: { name: '', address: '' }
      }));
      setBuyerStateCode('');
      return;
    }

    const matchId = String(customerIdValue);

    const customer = customersArr.find((c: any) => String(c.id) === matchId);
    if (customer) {
      const addrText = formatAddressMultiline(customer.address, cityList, stateList, countryList);
      const gst = customer.gstNo ? String(customer.gstNo).trim() : 'Not Provided';
      const addrWithGst = [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
      setInvoiceData(prev => ({
        ...prev,
        buyer: {
          name: customer.customerName || customer.name || '',
          address: addrWithGst || ''
        }
      }));
      setBuyerStateCode(customer.address?.stateCode || '');
      return;
    }

    if (!isJobwork) {
      const company = companyMasterArr.find((c: any) => String(c.id) === matchId);
      if (company) {
        const addressArr = Array.isArray(company?.address) ? company.address : [];
        const defaultAddr = addressArr.find((a: any) => a.isDefault) || addressArr[0];
        const parts: string[] = [];
        if (defaultAddr?.line1) parts.push(String(defaultAddr.line1));
        const stateName = defaultAddr?.stateId ? getStateName(String(defaultAddr.stateId), stateList) : '';
        if (stateName) parts.push(stateName);
        if (defaultAddr?.pinCode) parts.push(`PIN: ${defaultAddr.pinCode}`);
        const gst = company.gstNo ? String(company.gstNo).trim() : 'Not Provided';
        if (gst) parts.push(`GST No: ${gst}`);
        const addressText = parts.join('\n');
        setInvoiceData(prev => ({
          ...prev,
          buyer: {
            name: company.companyName || company.name || '',
            address: addressText || ''
          }
        }));
        setBuyerStateCode(defaultAddr?.stateCode || '');
        return;
      }
    }

    setInvoiceData(prev => ({
      ...prev,
      buyer: { name: '', address: '' }
    }));
    setBuyerStateCode('');
  }, [companyMasterArr, customersArr, isJobwork, cityList, stateList, countryList, setInvoiceData]);

  const latestSalesOrderIdRef = useRef<number | null>(null);

  const resolveConsigneeForOrder = useCallback((orderId: string, isJobworkOrder: boolean) => {
    const getAddressTextForConsignee = (consignee: any) => {
      const resolveAddr = (rawAddr: any) => {
        if (!Array.isArray(rawAddr)) return rawAddr;
        return rawAddr.find((a: any) => a.activeFlag !== false) || rawAddr[0];
      };
      const addrObj = resolveAddr(consignee.address);
      const addrText = formatAddressMultiline(addrObj, cityList, stateList, countryList);
      const gst = consignee.gstNo ? String(consignee.gstNo).trim() : 'Not Provided';
      return [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
    };

    // 1. Session Storage Override
    const storageKey = `consignee_override_${isJobworkOrder ? 'jobwork' : 'sales'}_${orderId}`;
    const savedSession = sessionStorage.getItem(storageKey);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && (parsed.name || parsed.address || parsed.consgineeId)) {
          return {
            consgineeId: parsed.consgineeId || '',
            name: parsed.name || '',
            address: parsed.address || ''
          };
        }
      } catch (e) { }
    }

    // 2. Local Storage Last Saved Sync (contains timestamp of last save from this browser)
    const syncKey = `consignee_last_saved_${isJobworkOrder ? 'jobwork' : 'sales'}_${orderId}`;
    const savedSync = localStorage.getItem(syncKey);
    if (savedSync) {
      try {
        const parsed = JSON.parse(savedSync);
        if (parsed && (parsed.name || parsed.consgineeId)) {
          return {
            consgineeId: parsed.consgineeId || parsed.consigneeId || '',
            name: parsed.name || '',
            address: parsed.address || ''
          };
        }
      } catch (e) { }
    }

    // 3. Database Records: Get all matching Invoices and Packing Lists for this order
    // Check Invoices first
    const invoices = Array.isArray(invoiceList) ? invoiceList : (Array.isArray(invoiceList?.data) ? invoiceList.data : []);
    const matchInvoice = invoices.find((inv: any) =>
      isJobworkOrder
        ? String(inv.weavingWorkOrderId) === String(orderId)
        : String(inv.salesOrderId) === String(orderId)
    );

    // Check Packing Lists
    const packings = Array.isArray(generatePackingList) ? generatePackingList : [];
    const matchPacking = packings.find((p: any) =>
      isJobworkOrder
        ? String(p.weavingWorkOrderId) === String(orderId)
        : String(p.salesOrderId) === String(orderId)
    );

    let invConsigneeVal: any = null;
    if (matchInvoice && (matchInvoice.consgineeId || matchInvoice.consignee?.name)) {
      invConsigneeVal = {
        consgineeId: matchInvoice.consgineeId ? String(matchInvoice.consgineeId) : '',
        name: matchInvoice.consignee?.name || '',
        address: matchInvoice.consignee?.address || ''
      };
    }

    let packConsigneeVal: any = null;
    if (matchPacking && (matchPacking.consigneeId || matchPacking.deliveryAt)) {
      let resolvedAddress = '';
      if (matchPacking.consigneeId) {
        const consigneeObj = consigneesArr.find((c: any) => String(c.id) === String(matchPacking.consigneeId));
        if (consigneeObj) {
          resolvedAddress = getAddressTextForConsignee(consigneeObj);
        }
      }
      packConsigneeVal = {
        consgineeId: matchPacking.consigneeId ? String(matchPacking.consigneeId) : '',
        name: matchPacking.deliveryAt || '',
        address: resolvedAddress
      };
    }

    // If both exist, prefer the invoice if both have manual overrides
    if (invConsigneeVal && packConsigneeVal) {
      return invConsigneeVal;
    }
    if (invConsigneeVal) return invConsigneeVal;
    if (packConsigneeVal) return packConsigneeVal;

    return null;
  }, [invoiceDetail, invoiceList, generatePackingList, consigneesArr, cityList, stateList, countryList]);

  const hydrateConsigneeDetails = useCallback((
    consigneeIdValue: string | number | null | undefined,
    preferredAddressId?: string | number | null
  ) => {
    const activeOrderId = isJobwork
      ? selectedWeavingWorkOrderId
      : (isYarnSalesInvoiceType
        ? selectedYarnSalesOrderId
        : (isSizingSalesInvoiceType
          ? selectedSizingWorkOrderId
          : selectedSalesOrder));
    if (activeOrderId) {
      const storageKey = `consignee_override_${isJobwork ? 'jobwork' : 'sales'}_${activeOrderId}`;
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.name || parsed.address)) {
            setInvoiceData(prev => ({
              ...prev,
              consignee: {
                name: parsed.name || '',
                address: parsed.address || ''
              }
            }));
            return;
          }
        } catch (e) { }
      }
    }

    if (!consigneeIdValue) {
      setInvoiceData(prev => ({
        ...prev,
        consignee: { name: '', address: '' }
      }));
      return;
    }

    const matchId = String(consigneeIdValue);
    const preferredAddrId = preferredAddressId ? String(preferredAddressId) : null;

    const resolveAddr = (rawAddr: any) => {
      if (!Array.isArray(rawAddr)) return rawAddr;
      if (preferredAddrId) {
        const preferred = rawAddr.find((a: any) => String(a.id) === preferredAddrId);
        if (preferred) return preferred;
      }
      return rawAddr.find((a: any) => a.activeFlag !== false) || rawAddr[0];
    };

    if (isJobwork) {
      const jobworkConsignee = consigneesArr.find((c: any) => String(c.id) === matchId);
      if (jobworkConsignee) {
        const addrObj = resolveAddr(jobworkConsignee.address);
        const addrText = formatAddressMultiline(addrObj, cityList, stateList, countryList);
        const gst = jobworkConsignee.gstNo ? String(jobworkConsignee.gstNo).trim() : 'Not Provided';
        const addrWithGst = [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
        setInvoiceData(prev => ({
          ...prev,
          consignee: {
            name: jobworkConsignee.consigneeName || jobworkConsignee.name || '',
            address: addrWithGst || ''
          }
        }));
        return;
      }
    } else {
      const consignee = consigneesArr.find((c: any) => String(c.id) === matchId);
      if (consignee) {
        const addrObj = resolveAddr(consignee.address);
        const addrText = formatAddressMultiline(addrObj, cityList, stateList, countryList);
        const gst = consignee.gstNo ? String(consignee.gstNo).trim() : 'Not Provided';
        const addrWithGst = [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
        setInvoiceData(prev => ({
          ...prev,
          consignee: {
            name: consignee.consigneeName || '',
            address: addrWithGst || ''
          }
        }));
        return;
      }
    }

    setInvoiceData(prev => ({
      ...prev,
      consignee: { name: '', address: '' }
    }));
  }, [
    consigneesArr,
    isJobwork,
    cityList,
    stateList,
    countryList,
    setInvoiceData,
    selectedSalesOrder,
    selectedWeavingWorkOrderId,
    selectedYarnSalesOrderId,
    selectedSizingWorkOrderId,
    isYarnSalesInvoiceType,
    isSizingSalesInvoiceType
  ]);

  const updateConsigneeOverride = useCallback((newConsignee: { name: string; address: string }, customId?: string | null) => {
    const activeOrderId = isJobwork
      ? selectedWeavingWorkOrderId
      : (isYarnSalesInvoiceType
        ? selectedYarnSalesOrderId
        : (isSizingSalesInvoiceType
          ? selectedSizingWorkOrderId
          : selectedSalesOrder));
    if (activeOrderId) {
      const storageKey = `consignee_override_${isJobwork ? 'jobwork' : 'sales'}_${activeOrderId}`;
      const savedOverride = {
        ...newConsignee,
        consgineeId: customId || '',
        isManual: true,
        lastUpdatedSource: 'invoice',
        lastUpdatedAt: Date.now()
      };
      sessionStorage.setItem(storageKey, JSON.stringify(savedOverride));
      window.dispatchEvent(new CustomEvent('consigneeUpdated', {
        detail: {
          orderId: activeOrderId,
          isJobwork,
          consignee: savedOverride,
          consigneeId: customId || ''
        }
      }));
    }
  }, [selectedSalesOrder, selectedWeavingWorkOrderId, selectedYarnSalesOrderId, selectedSizingWorkOrderId, isJobwork, isYarnSalesInvoiceType, isSizingSalesInvoiceType]);

  // Update buyer details when customer/company selected
  useEffect(() => {
    hydrateBuyerDetails(selectedValues.customerId);
  }, [selectedValues.customerId, hydrateBuyerDetails]);

  hydrateConsigneeDetailsRef.current = hydrateConsigneeDetails;

  // Update consignee details when consignee/company selected
  useEffect(() => {
    if (skipConsigneeHydrationRef.current) {
      skipConsigneeHydrationRef.current = false;
      preferredConsigneeAddressIdRef.current = null;
      return;
    }
    const preferredAddr = preferredConsigneeAddressIdRef.current;
    preferredConsigneeAddressIdRef.current = null;
    hydrateConsigneeDetailsRef.current(selectedValues.consgineeId, preferredAddr);
  }, [selectedValues.consgineeId]);

  // Listen to consignee changes from generate-packing-list.tsx in real-time
  useEffect(() => {
    const handleConsigneeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { orderId, isJobwork: isJobworkEvent, consignee, consigneeId } = customEvent.detail || {};

      const activeOrderId = isJobwork
        ? selectedWeavingWorkOrderId
        : (isYarnSalesInvoiceType
          ? selectedYarnSalesOrderId
          : (isSizingSalesInvoiceType
            ? selectedSizingWorkOrderId
            : selectedSalesOrder));

      if (String(orderId) === String(activeOrderId) && Boolean(isJobworkEvent) === Boolean(isJobwork)) {
        if (consigneeId) {
          setSelectedValues(prev => ({
            ...prev,
            consgineeId: String(consigneeId)
          }));
          hydrateConsigneeDetails(consigneeId);
        } else {
          setSelectedValues(prev => ({
            ...prev,
            consgineeId: ''
          }));
          setInvoiceData(prev => ({
            ...prev,
            consignee: { name: '', address: '' }
          }));
        }
      }
    };

    window.addEventListener('consigneeUpdated', handleConsigneeUpdate);
    return () => {
      window.removeEventListener('consigneeUpdated', handleConsigneeUpdate);
    };
  }, [selectedSalesOrder, selectedWeavingWorkOrderId, selectedYarnSalesOrderId, selectedSizingWorkOrderId, isJobwork, isYarnSalesInvoiceType, isSizingSalesInvoiceType, hydrateConsigneeDetails]);

  // Re-run order and consignee selection when lists load in edit mode
  useEffect(() => {
    if (invoiceDetail && isEditMode) {
      const activeOrderId = invoiceDetail.weavingWorkOrderId
        ? String(invoiceDetail.weavingWorkOrderId)
        : (invoiceDetail.yarnSalesOrderId
          ? String(invoiceDetail.yarnSalesOrderId)
          : (invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId
            ? String(invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId)
            : String(invoiceDetail.salesOrderId || '')));

      if (activeOrderId) {
        const isJobworkOrder = !!invoiceDetail.weavingWorkOrderId;
        const resolved = resolveConsigneeForOrder(activeOrderId, isJobworkOrder);
        if (resolved) {
          setInvoiceData(prev => ({
            ...prev,
            consignee: {
              name: resolved.name,
              address: resolved.address
            }
          }));
          setSelectedValues(prev => ({
            ...prev,
            consgineeId: resolved.consgineeId
          }));
          skipConsigneeHydrationRef.current = true;
        }
      }
    }
  }, [consigneesArr, salesOrdersArr, normalizedPackingList, invoiceDetail, isEditMode, resolveConsigneeForOrder]);

  // Update transportName when transportId changes
  useEffect(() => {
    if (selectedValues.transportId && Array.isArray(transportsArr)) {
      const selectedTransport = transportsArr.find((t: any) => String(t.id) === String(selectedValues.transportId));
      if (selectedTransport) {
        setInvoiceData(prev => ({ ...prev, transportName: selectedTransport.transportName || '' }));
      }
    } else if (!selectedValues.transportId && !invoiceDetail) {
      setInvoiceData(prev => ({ ...prev, transportName: '' }));
    }
  }, [selectedValues.transportId, transportsArr, invoiceDetail]);

  // Update deliveryTerms when shipmentTermsId changes
  useEffect(() => {
    if (selectedValues.shipmentTermsId && Array.isArray(shipmentTermsList)) {
      const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(selectedValues.shipmentTermsId));
      if (shipmentTerm) {
        setInvoiceData(prev => ({ ...prev, deliveryTerms: shipmentTerm.termName || '' }));
      }
    } else if (!selectedValues.shipmentTermsId && !invoiceDetail) {
      setInvoiceData(prev => ({ ...prev, deliveryTerms: '' }));
    }
  }, [selectedValues.shipmentTermsId, shipmentTermsList, invoiceDetail]);

  // Fetch/massage packing lines when SO/WO/Warehouse changes
  // useEffect(() => {
  //   if (!Array.isArray(generatePackingList)) {
  //     setPackingLines([]);
  //     setSelectedPackingIds([]);
  //     return;
  //   }

  //   const normalized = Array.isArray((generatePackingList as any)?.data)
  //     ? (generatePackingList as any).data
  //     : (generatePackingList as any);

  //   const currentInvoiceId = invoiceDetail?.id ? Number(invoiceDetail.id) : null;
  //   const invoicedPackingSlipNos = new Set<string>();
  //   if (Array.isArray(invoiceList)) {
  //     (invoiceList as any[]).forEach((invoice: any) => {
  //       if (invoice.id !== invoiceDetail?.id && Array.isArray(invoice.items)) {
  //         invoice.items.forEach((item: any) => {
  //           if (item.isInvoice === 1 && item.packingListNo) {
  //             invoicedPackingSlipNos.add(String(item.packingListNo));
  //           }
  //         });
  //       }
  //     });
  //   }

  //   const relevantEntries = (normalized || []).reduce((acc: Array<{ entry: any; eligibleItems: any[] }>, entry: any) => {
  //     if (invoicedPackingSlipNos.has(String(entry?.packingSlipNo || ''))) {
  //       return acc;
  //     }

  //     const eligibleItems = Array.isArray(entry?.items)
  //       ? entry.items.filter((item: any) => {
  //           const invoiceFlag = Number(item?.isInvoice ?? item?.is_invoice ?? 0);
  //           if (invoiceFlag === 0) {
  //             return true;
  //           }
  //           const itemInvoiceId = item?.invoiceId ?? item?.invoice_id;
  //           if (currentInvoiceId != null && itemInvoiceId != null && Number(itemInvoiceId) === currentInvoiceId) {
  //             return true;
  //           }
  //           return false;
  //         })
  //       : [];
  //     if (!eligibleItems.length) {
  //       return acc;
  //     }

  //     acc.push({ entry, eligibleItems });
  //     return acc;
  //   }, []);

  //   const soList = Array.isArray((salesOrderList as any)?.data)
  //     ? (salesOrderList as any).data
  //     : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);

  //   const resolveFabricMasterIdFromSources = (entry: any, soItem: any, fabricCodeValue: string) => {
  //     const candidates = [
  //       entry?.fabricMasterId,
  //       entry?.fabricMasterID,
  //       entry?.fabricId,
  //       entry?.fabricCodeId,
  //       soItem?.fabricMasterId,
  //       soItem?.fabricId,
  //       soItem?.fabricCodeId,
  //     ];
  //     for (const candidate of candidates) {
  //       if (candidate != null && candidate !== '') {
  //         const num = Number(candidate);
  //         if (!Number.isNaN(num)) {
  //           return num;
  //         }
  //       }
  //     }
  //     if (fabricCodeValue) {
  //       const match = fabricMasterArr.find((fm: any) => {
  //         const code = fm?.fabricCode || fm?.code || '';
  //         return code && String(code).toLowerCase() === String(fabricCodeValue).toLowerCase();
  //       });
  //       if (match?.id) {
  //         const num = Number(match.id);
  //         if (!Number.isNaN(num)) {
  //           return num;
  //         }
  //       }
  //     }
  //     return 0;
  //   };

  //   const derivedLines = relevantEntries.map(({ entry, eligibleItems }: any) => {
  //     const soNo = resolveSalesOrderNo(Number(entry?.salesOrderId));
  //     const woNo = resolveWeavingOrderNo(Number(entry?.weavingWorkOrderId));
  //     const so = soList.find((s: any) => s?.id === Number(entry?.salesOrderId));
  //     const firstItem = Array.isArray(so?.items) && so.items.length > 0 ? so.items[0] : null;
  //     const quantity = eligibleItems.reduce((sum: number, it: any) => sum + (Number(it?.length) || 0), 0);
  //     const baseRolls = eligibleItems.length || Number(entry?.noOfRolls ?? entry?.numberOfRolls ?? 0) || 0;
  //     const fabricCode = firstItem?.fabricCode || entry?.fabricCode || '';
  //     const buyerProduct = firstItem?.buyerProduct || firstItem?.quality || entry?.quality || entry?.fabricQuality || '';
  //     const computedName = [fabricCode, buyerProduct].filter(Boolean).join(' - ').trim();
  //     const fabricCodeQuality = computedName || fabricCode || buyerProduct || 'No description';
  //     const uomId = firstItem?.uomId;
  //     const uomName = Array.isArray(uomList)
  //       ? (uomList.find((u: any) => String(u.id) === String(uomId))?.uomName || '')
  //       : '';
  //     const rate = Number(firstItem?.pricePerUnit) || 0;
  //     const fabricMasterId = resolveFabricMasterIdFromSources(entry, firstItem, fabricCode);
  //     const orderKey = isJobwork ? String(entry?.weavingWorkOrderId || '') : String(entry?.salesOrderId || '');
  //     return {
  //       entry,
  //       salesOrderNo: soNo || '',
  //       weavingOrderNo: woNo || '',
  //       quantity,
  //       uomName,
  //       rate,
  //       gstPercent: 0,
  //       baseRolls,
  //       fabricCodeQuality,
  //       fabricMasterId,
  //       orderKey,
  //     };
  //   });

  //   const rollCountMap = new Map<string, number>();
  //   derivedLines.forEach((line: any) => {
  //     const key = `${line.orderKey || '0'}::${line.fabricMasterId || 0}::${line.fabricCodeQuality}`;
  //     const base = Number(line.baseRolls) || 0;
  //     rollCountMap.set(key, (rollCountMap.get(key) || 0) + base);
  //   });

  //   const mapped: PackingLine[] = derivedLines.map((line: any) => {
  //     const key = `${line.orderKey || '0'}::${line.fabricMasterId || 0}::${line.fabricCodeQuality}`;
  //     const aggregatedRolls = rollCountMap.get(key) ?? line.baseRolls ?? 0;
  //     return {
  //       id: line.entry?.id,
  //       rollNo: line.entry?.packingSlipNo || '',
  //       salesOrderNo: line.salesOrderNo,
  //       salesOrderId: line.entry?.salesOrderId,
  //       weavingOrderNo: line.weavingOrderNo,
  //       weavingWorkOrderId: line.entry?.weavingWorkOrderId,
  //       fabricCodeQuality: line.fabricCodeQuality,
  //       quantity: line.quantity,
  //       uom: line.uomName || 'Mtrs',
  //       rate: line.rate,
  //       gstPercent: line.gstPercent,
  //       noOfRolls: aggregatedRolls,
  //       fabricMasterId: line.fabricMasterId || undefined,
  //     } as PackingLine;
  //   });

  //   setPackingLines(mapped);
  //   setSelectedPackingIds([]);
  // }, [selectedSalesOrder, selectedWeavingWorkOrderId, selectedValues.warehouseId, isJobwork, generatePackingList, salesOrderList, uomList, invoiceList, invoiceDetail, fabricMasterArr]);

  const packingWarehouseCandidate = useMemo(() => {
    if (!Array.isArray(normalizedPackingList) || normalizedPackingList.length === 0) return null;

    if (isJobwork && selectedWeavingWorkOrderId) {
      const matches = normalizedPackingList.filter((entry: any) => String(entry?.weavingWorkOrderId) === selectedWeavingWorkOrderId);
      const candidate = deriveWarehouseIdFromPackings(matches);
      if (candidate) return candidate;
    }

    if (isYarnSalesInvoiceType && selectedYarnSalesOrderId) {
      const matches = normalizedPackingList.filter((entry: any) => String(entry?.yarnSalesOrderId) === selectedYarnSalesOrderId);
      const candidate = deriveWarehouseIdFromPackings(matches);
      if (candidate) return candidate;
    }

    if (!isJobwork && !isYarnSalesInvoiceType && selectedSalesOrder) {
      const matches = normalizedPackingList.filter((entry: any) => String(entry?.salesOrderId) === selectedSalesOrder);
      const candidate = deriveWarehouseIdFromPackings(matches);
      if (candidate) return candidate;
    }

    return null;
  }, [
    normalizedPackingList,
    isJobwork,
    selectedWeavingWorkOrderId,
    isYarnSalesInvoiceType,
    selectedYarnSalesOrderId,
    selectedSalesOrder
  ]);

  useEffect(() => {
    if (!packingWarehouseCandidate) return;
    if (hasManualWarehouseSelection) return;
    if (String(selectedValues.warehouseId) === packingWarehouseCandidate) return;
    setSelectedValues(prev => ({ ...prev, warehouseId: packingWarehouseCandidate }));
  }, [packingWarehouseCandidate, hasManualWarehouseSelection, selectedValues.warehouseId]);

  // Fetch/massage packing lines when SO/WO/Warehouse changes
  useEffect(() => {
    console.log('=== PACKING LINES DEBUG ===');
    console.log('Selected Order Info:', {
      isJobwork,
      isYarnSalesInvoiceType,
      selectedSalesOrder,
      selectedWeavingWorkOrderId,
      selectedYarnSalesOrderId,
      selectedWarehouseId: selectedValues.warehouseId,
      isBrushedPiece
    });

    console.log('Raw generatePackingList:', generatePackingList);

    if (!isBrushedPiece && !selectedValues.warehouseId) {
      console.log('No warehouse selected - clearing packing lines');
      setPackingLines([]);
      setSelectedPackingIds([]);
      return;
    }

    const normalizedList = normalizedPackingList;

    console.log('Normalized packing list count:', normalizedList.length);

    if (normalizedList.length === 0) {
      console.log('No packing lists available after normalization');
      setPackingLines([]);
      setSelectedPackingIds([]);
      return;
    }

    // Filter based on current order type and warehouse
    const filteredPackingLists = normalizedList.filter((packing: any) => {
      // Check warehouse match
      const warehouseMatch = isBrushedPiece || String(packing?.warehouseId) === String(selectedValues.warehouseId);
      if (!warehouseMatch) return false;

      let orderMatch = false;
      if (isJobwork) {
        // For jobwork, match weaving work order
        orderMatch = String(packing?.weavingWorkOrderId) === String(selectedWeavingWorkOrderId);
      } else if (isYarnSalesInvoiceType) {
        // For yarn sales, match yarn sales order
        orderMatch = String(packing?.yarnSalesOrderId) === String(selectedYarnSalesOrderId);
      } else {
        // For regular sales, match sales order
        orderMatch = String(packing?.salesOrderId) === String(selectedSalesOrder);
      }

      if (!orderMatch) return false;

      // Additionally check if there are items with isInvoice 0
      if (Array.isArray(packing.items) && packing.items.length > 0) {
        return packing.items.some((item: any) => Number(item?.isInvoice ?? 0) === 0);
      }

      return true;
    });

    console.log('Filtered packing lists count (isInvoice 0 check):', filteredPackingLists.length);

    // Map to PackingLine format
    const mappedLines: PackingLine[] = filteredPackingLists.map((packing: any, index: number) => {
      const resolvedId = resolvePackingLineId(packing, index);
      let orderNo = '';
      let orderId: number | undefined;
      let fabricCodeQuality = '';
      let noOfRolls = 0;

      if (isJobwork) {
        orderNo = resolveWeavingOrderNo(Number(packing.weavingWorkOrderId)) || packing.weavingOrderNo || packing.orderNo || '';
        orderId = packing.weavingWorkOrderId;
        const fabricCode = packing.fabricCode || '';
        const quality = packing.quality || packing.fabricQuality || '';
        fabricCodeQuality = [fabricCode, quality].filter(Boolean).join(' - ') || 'No Description';
        noOfRolls = derivePackingRollCount(packing, fabricCodeQuality);
      } else if (isYarnSalesInvoiceType) {
        orderNo = packing.yarnSalesOrderNo || packing.orderNo || '';
        orderId = packing.yarnSalesOrderId;
        fabricCodeQuality = packing.itemName || 'Yarn Item';
        noOfRolls = 0;
      } else {
        orderNo = resolveSalesOrderNo(Number(packing.salesOrderId)) || packing.salesOrderNo || packing.orderNo || '';
        orderId = packing.salesOrderId;
        const fabricCode = packing.fabricCode || '';
        const quality = packing.quality || packing.fabricQuality || '';
        fabricCodeQuality = [fabricCode, quality].filter(Boolean).join(' - ') || 'No Description';
        noOfRolls = derivePackingRollCount(packing, fabricCodeQuality);
      }

      // Only count items with isInvoice 0
      let quantity = 0;
      if (Array.isArray(packing.items) && packing.items.length > 0) {
        quantity = packing.items.reduce((sum: number, item: any) => {
          if (Number(item?.isInvoice ?? 0) === 0) {
            return sum + (Number(item.length) || Number(item.quantity) || 0);
          }
          return sum;
        }, 0);
      } else {
        quantity = Number(packing.quantity || 0);
      }

      const resolvedUomName = resolveEntityUomName(packing, normalizedUoms);
      const uom = resolvedUomName || packing.uom || packing.uomName || 'Mtrs';
      const rate = Number(packing.rate || packing.pricePerUnit || 0);

      return {
        id: resolvedId,
        rollNo: packing.packingSlipNo || packing.rollNo || `PACK-${index + 1}`,
        salesOrderNo: isJobwork ? '' : orderNo,
        salesOrderId: isJobwork ? undefined : orderId,
        weavingOrderNo: isJobwork ? orderNo : '',
        weavingWorkOrderId: isJobwork ? orderId : undefined,
        fabricCodeQuality,
        quantity,
        uom,
        rate,
        gstPercent: Number(packing.gstPercent || 0),
        quality: packing.quality,
        noOfRolls,
        fabricMasterId: packing.fabricMasterId
      };
    });

    console.log('Mapped packing lines:', mappedLines);

    setPackingLines(mappedLines);
    setSelectedPackingIds([]);
  }, [
    selectedSalesOrder,
    selectedWeavingWorkOrderId,
    selectedYarnSalesOrderId,
    selectedValues.warehouseId,
    isJobwork,
    isYarnSalesInvoiceType,
    isBrushedPiece,
    normalizedPackingList,
    normalizedUoms,
    resolveSalesOrderNo,
    resolveWeavingOrderNo
  ]);

  const packingListNoOptions = useMemo<CommonSearchableSelectOption[]>(() => {
    return (packingLines || []).map((line) => ({
      id: String(line.id),
      value: String(line.rollNo),
      label: String(line.rollNo)
    }));
  }, [packingLines]);

  const handlePackingListNoChange = (packingSlipNo: string) => {
    setSelectedPackingListNo(packingSlipNo);
    if (!packingSlipNo) return;

    const packingRecord = normalizedPackingList.find(
      (p: any) => p.packingSlipNo === packingSlipNo || p.rollNo === packingSlipNo
    );

    if (packingRecord) {
      if (packingRecord.transportId) {
        setSelectedValues(prev => ({
          ...prev,
          transportId: String(packingRecord.transportId)
        }));
      }

      setInvoiceData(prev => ({
        ...prev,
        vehicleNo: packingRecord.truckNo || '',
        lrNo: packingRecord.lrNo || '',
        lrDate: packingRecord.lrDate ? packingRecord.lrDate.split('T')[0] : ''
      }));

      const line = packingLines.find(l => l.rollNo === packingSlipNo);
      if (line) {
        const fabricCode = packingRecord.fabricCode || '';
        const quality = packingRecord.fabricQuality || packingRecord.quality || '';
        const productName = fabricCode || quality
          ? `${fabricCode}${fabricCode && quality ? ' - ' : ''}${quality}`.trim()
          : line.fabricCodeQuality;

        const quantity = Number(line.quantity) || 0;
        const derivedRate = deriveRateFromSalesOrder(productName);
        const derivedUom = deriveUomFromSalesOrder(productName);
        const jobworkDetails = isJobwork ? deriveWeavingOrderItemDetails(line) : null;
        const rate = jobworkDetails?.rate ?? derivedRate ?? roundToTwoDecimals(Number(line.rate) || 0);
        const uom = jobworkDetails?.uom ?? derivedUom ?? (line.uom || 'Mtrs');
        const gstPercent = Number(gstPerc || line.gstPercent || 0);
        const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);
        if (totalAmount > 4900000) {
          toast.error('Total Amount should not exceed 49,00,000 (49 Lakhs)');
        }

        const fabricMaster = fabricMasterArr.find((fm: any) =>
          fm?.fabricCode === fabricCode || fm?.fabricCode === fabricCode?.trim()
        );
        const resolvedDirectFabricMasterId = Number(line.fabricMasterId || fabricMaster?.id || fabricMaster?.fabricMasterId || 0);
        const resolvedProductFabricMasterId = resolveFabricMasterIdFromProductName(productName);
        const fabricMasterId = !Number.isNaN(resolvedDirectFabricMasterId) && resolvedDirectFabricMasterId > 0
          ? resolvedDirectFabricMasterId
          : resolvedProductFabricMasterId ?? 0;

        const newItem: InvoiceItem = {
          id: Date.now(),
          productName: productName || 'No Description',
          quantity,
          uom,
          rate,
          amount: totalAmount,
          gstPercent,
          taxableAmount,
          gstAmount,
          totalAmount,
          isReadOnlyQuantity: true,
          noOfRolls: line.noOfRolls,
          hsnCode: '',
          yarnChallanId: 0,
          yarnChallanNo: '',
          packingListNo: line.rollNo || '',
          fabricMasterId: fabricMasterId,
        };

        setInvoiceData(prev => ({
          ...prev,
          items: mergeInvoiceItems(prev.items, [newItem])
        }));
      }
    }
  };

  useEffect(() => {
    if (isYarnSalesInvoiceType) {
      setSelectedPackingIds([]);
    }
  }, [isYarnSalesInvoiceType, selectedYarnSalesOrderId, yarnChallanLines.length]);

  // Auto-set GST Type and percentages from Sales Order
  useEffect(() => {
    if (!selectedSalesOrder) return;
    const list = Array.isArray((salesOrderList as any)?.data)
      ? (salesOrderList as any).data
      : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);
    const so: any = list.find((s: any) => s?.id === Number(selectedSalesOrder));
    if (!so) return;
    const taxId = so?.taxId ?? so?.data?.taxId;
    if (taxId === 1 || taxId === '1' || taxId === 2 || taxId === '2') {
      const gstType = taxId === 1 || taxId === '1' ? '1' : '2';
      setSelectedValues(prev => ({ ...prev, gstType }));
      const fi = Array.isArray(so?.items) && so.items.length > 0 ? so.items[0] : null;
      const gstPercentId = fi?.gstPercentId ?? fi?.gstPercent?.id;
      if (gstPercentId !== undefined && gstPercentId !== null && gstPercentId !== '') {
        setActiveGstPercentId(String(gstPercentId));
      }
      applyGstFromMaster(gstPercentId, gstType, Number(fi?.gstPercent || 0));
    }
  }, [selectedSalesOrder, salesOrderList, applyGstFromMaster]);

  // Auto-set GST Type and percentages from Weaving Work Order
  useEffect(() => {
    if (!selectedWeavingWorkOrderId || !isJobwork) return;
    const list = Array.isArray((weavingJobWorkOrderList as any)?.data)
      ? (weavingJobWorkOrderList as any).data
      : (Array.isArray(weavingJobWorkOrderList) ? (weavingJobWorkOrderList as any[]) : []);
    const wo: any = list.find((w: any) => String(w?.id) === String(selectedWeavingWorkOrderId));
    if (!wo) return;
    const taxId = wo?.taxId ?? wo?.gstTypeId ?? wo?.data?.taxId ?? wo?.data?.gstTypeId;
    if (taxId === 1 || taxId === '1' || taxId === 2 || taxId === '2') {
      const gstType = taxId === 1 || taxId === '1' ? '1' : '2';
      setSelectedValues(prev => ({ ...prev, gstType }));
      const fi = Array.isArray(wo?.items) && wo.items.length > 0 ? wo.items[0] : null;
      const gstPercentId = fi?.gstPercentId ?? fi?.gstPercent?.id;
      if (gstPercentId !== undefined && gstPercentId !== null && gstPercentId !== '') {
        setActiveGstPercentId(String(gstPercentId));
      }
      applyGstFromMaster(gstPercentId, gstType, Number(fi?.gstPercent || 0));
    }
  }, [selectedWeavingWorkOrderId, isJobwork, weavingJobWorkOrderList, applyGstFromMaster]);

  useEffect(() => {
    if (!invoiceDetail) {
      return;
    }

    if (invoiceDetail.consignee && (invoiceDetail.consignee.name || invoiceDetail.consignee.address)) {
      const activeOrderId = invoiceDetail.weavingWorkOrderId
        ? String(invoiceDetail.weavingWorkOrderId)
        : (invoiceDetail.yarnSalesOrderId
          ? String(invoiceDetail.yarnSalesOrderId)
          : (invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId
            ? String(invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId)
            : String(invoiceDetail.salesOrderId || '')));
      if (activeOrderId) {
        const isJobworkEvent = Number(invoiceDetail.isJobwork) === 1;
        const storageKey = `consignee_override_${isJobworkEvent ? 'jobwork' : 'sales'}_${activeOrderId}`;
        if (!sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, JSON.stringify({
            name: invoiceDetail.consignee.name || '',
            address: invoiceDetail.consignee.address || ''
          }));
        }
      }
    }

    const needsCustomer = invoiceDetail.customerId != null && invoiceDetail.customerId !== '';
    const needsSalesOrder = invoiceDetail.salesOrderId != null && Number(invoiceDetail.salesOrderId) > 0;
    const needsWeavingOrder = invoiceDetail.weavingWorkOrderId != null && Number(invoiceDetail.weavingWorkOrderId) > 0;
    const needsYarnOrder = invoiceDetail.yarnSalesOrderId != null && Number(invoiceDetail.yarnSalesOrderId) > 0;
    const needsSizingOrder = (invoiceDetail.sizingWorkOrderId != null && Number(invoiceDetail.sizingWorkOrderId) > 0) || (invoiceDetail.sizingJobWorkOrderId != null && Number(invoiceDetail.sizingJobWorkOrderId) > 0);
    const needsConsignee = invoiceDetail.consgineeId != null && invoiceDetail.consgineeId !== '';

    if ((needsCustomer && !customersArr.length && !companyMasterArr.length)
      || (needsSalesOrder && !salesOrdersArr.length)
      || (needsWeavingOrder && !weavingOrdersArr.length)
      || (needsYarnOrder && !yarnSalesOrdersArr.length)
      || (needsConsignee && !consigneesArr.length)) {
      return;
    }

    const relatedSalesOrder = salesOrdersArr.find((so: any) => Number(so?.id) === Number(invoiceDetail.salesOrderId));
    const customer = customersArr.find((c: any) => Number(c?.id) === Number(invoiceDetail.customerId));

    setSelectedSalesOrder(invoiceDetail.salesOrderId ? String(invoiceDetail.salesOrderId) : '');

    if (invoiceDetail.weavingWorkOrderId) {
      setSelectedWeavingWorkOrderId(String(invoiceDetail.weavingWorkOrderId));
    }

    if (invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId || (isSizingSalesInvoiceType && invoiceDetail.soNo)) {
      const sId = invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId;
      let finalSId = sId ? String(sId) : '';

      if (!finalSId && invoiceDetail.soNo) {
        const matched = sizingJobWorkOrdersArr.find((o: any) =>
          normalizeComparableText(o.sizingWorkOrderNo || o.sizingJobWorkOrderNo || o.jobWorkOrderNo || o.orderNo) === normalizeComparableText(invoiceDetail.soNo)
        );
        if (matched) {
          finalSId = String(matched.id);
        }
      }

      if (finalSId) {
        setSelectedSizingWorkOrderId(finalSId);
        const foundOrder = sizingJobWorkOrdersArr.find((o: any) => String(o.id) === finalSId);
        if (foundOrder) {
          setSelectedSizingWorkOrder(foundOrder);
        }
      }
    }

    skipConsigneeHydrationRef.current = true;
    const isBrushed = invoiceDetail.isBrushedPiece !== undefined
      ? Number(invoiceDetail.isBrushedPiece) === 1
      : !invoiceDetail.warehouseId;
    setIsBrushedPiece(isBrushed);
    if (invoiceDetail.packingListNo) {
      setSelectedPackingListNo(invoiceDetail.packingListNo);
    }

    setSelectedValues({
      manufactureId: invoiceDetail.manufactureId || 1,
      companyBankId: String(invoiceDetail.companyBankId || ''),
      termsConditionsId: String(invoiceDetail.termsConditionsId || ''),
      paymentTermsId: String(invoiceDetail.paymentTermsId || ''),
      shipToId: String(invoiceDetail.shipToId || ''),
      shipmentMode: String(invoiceDetail.shipmentMode || ''),
      shipmentTermsId: String(invoiceDetail.deliveryTermsId ?? invoiceDetail.shipmentTermsId ?? ''),
      customerId: String(invoiceDetail.customerId || ''),
      consgineeId: String(invoiceDetail.consgineeId || ''),
      warehouseId: String(invoiceDetail.warehouseId || ''),
      agentId: String(invoiceDetail.agentId || ''),
      gstType: invoiceDetail.gstType || '',
      transportId: String(invoiceDetail.transportNameId ?? invoiceDetail.transportId ?? '')
    });

    if (invoiceDetail.gstPercentId !== undefined && invoiceDetail.gstPercentId !== null && invoiceDetail.gstPercentId !== '') {
      setActiveGstPercentId(String(invoiceDetail.gstPercentId));
    } else if (invoiceDetail.gstPercent) {
      applyGstFromMaster(null, invoiceDetail.gstType || '', Number(invoiceDetail.gstPercent));
    }

    setAddDiscItems(invoiceDetail.addDiscItems || []);
    setAddDiscDrafts(invoiceDetail.addDiscDrafts || []);
    setRoundOff(invoiceDetail.roundOff || 0);

    const buyerAddrText = customer ? formatAddressMultiline(customer.address, cityList, stateList, countryList) : '';
    const buyerGst = customer?.gstNo ? String(customer.gstNo).trim() : 'Not Provided';
    const buyerAddrWithGst = [buyerAddrText, `GST No: ${buyerGst}`].filter(Boolean).join('\n');

    const resolvedOrderNo = (() => {
      if (invoiceDetail.salesOrderId) {
        return resolveSalesOrderNo(Number(invoiceDetail.salesOrderId)) || invoiceDetail.soNo || '';
      }
      if (invoiceDetail.yarnSalesOrderId) {
        return resolveYarnSalesOrderNo(Number(invoiceDetail.yarnSalesOrderId)) || invoiceDetail.yarnSalesNo || '';
      }
      if (invoiceDetail.weavingWorkOrderId) {
        return resolveWeavingOrderNo(Number(invoiceDetail.weavingWorkOrderId)) || invoiceDetail.woNo || '';
      }
      if (invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId) {
        const sId = invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId;
        return resolveSizingOrderNo(Number(sId)) || invoiceDetail.soNo || '';
      }
      return invoiceDetail.soNo || invoiceDetail.woNo || '';
    })();

    setInvoiceData({
      date: invoiceDetail.invoiceDate ? invoiceDetail.invoiceDate.split('T')[0] : new Date().toISOString().split('T')[0],
      invoiceNo: applyInvoicePrefix(invoiceDetail.invoiceNo || ''),
      isInvoice: 0,
      soNo: resolvedOrderNo,
      woNo: invoiceDetail.weavingWorkOrderId
        ? resolveWeavingOrderNo(Number(invoiceDetail.weavingWorkOrderId))
        : (invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId
          ? resolveSizingOrderNo(Number(invoiceDetail.sizingWorkOrderId || invoiceDetail.sizingJobWorkOrderId))
          : ''),
      companyBank: '',
      byType: invoiceDetail.byType || 'Manufacturer',
      manufacturer: {
        name: invoiceDetail.manufacturer?.name || '',
        address: invoiceDetail.manufacturer?.address || ''
      },
      termsAndConditions: relatedSalesOrder?.termsConditions?.termName || '',
      paymentTerms: relatedSalesOrder?.paymentTerms?.paymentTermName || 'Net 60 Days',
      shipTo: '',
      shipVia: relatedSalesOrder?.modeOfShipment?.modeName || '',
      buyer: {
        name: customer?.customerName || '',
        address: buyerAddrWithGst || ''
      },
      consignee: {
        name: invoiceDetail.consignee?.name || '',
        address: invoiceDetail.consignee?.address || ''
      },
      items: (invoiceDetail.items || []).map((item: any) => {
        const fabricCode = item.fabricCode || '';
        const buyerProduct = item.buyerProduct || item.quality || '';
        const computedName = [fabricCode, buyerProduct].filter(Boolean).join(' - ');
        const resolvedUom = resolveEntityUomName(item, normalizedUoms) || item.uom;
        const uomName = resolvedUom || 'Mtrs';
        const resolvedProductName = item.productName || computedName || '';
        const resolvedFabricMasterId = deriveInvoiceItemFabricMasterId({
          productName: resolvedProductName,
          fabricMasterId: item.fabricMasterId
        });
        const sizingItem = (invoiceDetail.sizingSalesItems || []).find((si: any) =>
          si.beamOutwardNo === item.packingListNo || si.yarnName === item.productName
        );
        return {
          id: item.id,
          productName: resolvedProductName,
          quantity: item.quantity || item.orderQty || 0,
          uom: uomName,
          rate: item.rate || item.pricePerUnit || 0,
          amount: item.amount || ((item.quantity || 0) * (item.rate || 0)) || 0,
          gstPercent: item.gstPercent ?? 18,
          taxableAmount: item.taxableAmount || ((item.quantity || 0) * (item.rate || 0)) || 0,
          gstAmount: item.gstAmount || 0,
          totalAmount: item.totalAmount || 0,
          isReadOnlyQuantity: !!item.isReadOnlyQuantity,
          fabricMasterId: resolvedFabricMasterId,
          packingListNo: item.packingListNo || '',
          noOfRolls: item.noOfRolls,
          hsnCode: item.hsnCode || '',
          yarnChallanId: item.yarnChallanId || 0,
          yarnChallanNo: item.yarnChallanNo || '',
          yarnId: item.yarnId || 0,
          beamMeters: item.beamMeters || sizingItem?.beamMeters || 0,
          netWeight: item.netWeight || sizingItem?.netWeight || 0,
          totalEnds: item.totalEnds || sizingItem?.totalEnds || 0
        };
      }),
      additional: (invoiceDetail.additional ?? invoiceDetail.additionTotal ?? 0),
      less: (invoiceDetail.less ?? invoiceDetail.discountTotal ?? 0),
      taxAmount: invoiceDetail.taxAmount ?? 0,
      comments: invoiceDetail.comments || '',
      roundOff: invoiceDetail.roundOff || 0,
      addDiscItems: invoiceDetail.addDiscItems || [],
      gstType: invoiceDetail.gstType || '',
      transportName: invoiceDetail.transportName || ((invoiceDetail.transportNameId ?? invoiceDetail.transportId)
        ? (transportsArr?.find((t: any) => String(t.id) === String(invoiceDetail.transportNameId ?? invoiceDetail.transportId))?.transportName || '')
        : ''),
      deliveryNote: invoiceDetail.deliveryNote || '',
      deliveryTerms: invoiceDetail.deliveryTerms || ((invoiceDetail.deliveryTermsId ?? invoiceDetail.shipmentTermsId)
        ? (shipmentTermsList?.find((st: any) => String(st.id) === String(invoiceDetail.deliveryTermsId ?? invoiceDetail.shipmentTermsId))?.termName || '')
        : ''),

      vehicleNo: invoiceDetail.vehicleNo || '',
      lrNo: invoiceDetail.lrNo || '',
      lrDate: invoiceDetail.lrDate ? invoiceDetail.lrDate.split('T')[0] : '',
      deliveryNoteDate: invoiceDetail.deliveryNoteDate ? invoiceDetail.deliveryNoteDate.split('T')[0] : '',
      destination: invoiceDetail.destination || '',
    });

    if (invoiceDetail.salesOrderId && Number(invoiceDetail.salesOrderId) > 0) {
      const numericSoId = Number(invoiceDetail.salesOrderId);
      latestSalesOrderIdRef.current = numericSoId;

      const resolved = resolveConsigneeForOrder(String(numericSoId), false);
      if (resolved) {
        setInvoiceData(prev => ({
          ...prev,
          consignee: {
            name: resolved.name,
            address: resolved.address
          }
        }));
        setSelectedValues(prev => ({
          ...prev,
          consgineeId: resolved.consgineeId
        }));
        skipConsigneeHydrationRef.current = true;
      } else {
        setIsConsigneeAddressLoading(true);
        dispatch(getSalesOrderConsigneeAddress(numericSoId)).then((result: any) => {
          if (latestSalesOrderIdRef.current !== numericSoId) return;
          setIsConsigneeAddressLoading(false);
          if (result?.type?.endsWith('/rejected')) return;
          const addr = result?.payload;
          if (!addr || typeof addr !== 'object') return;
          const lineParts: string[] = [];
          if (addr.addressLine1) lineParts.push(addr.addressLine1);
          if (addr.addressLine2) lineParts.push(addr.addressLine2);
          const loc: string[] = [];
          if (addr.cityName) loc.push(addr.cityName);
          if (addr.stateName) loc.push(addr.stateName);
          if (addr.countryName) loc.push(addr.countryName);
          if (loc.length) lineParts.push(loc.join(', '));
          const addressText = lineParts.join(', ');
          const pin = addr.pinCode ? `PIN: ${addr.pinCode}` : '';
          const stateCode = addr.stateCode ? `State Code: ${addr.stateCode}` : '';
          const gst = addr.gstNo ? `GST No: ${addr.gstNo}` : 'GST No: Not Provided';
          const fullAddress = [addressText, pin, stateCode, gst].filter(Boolean).join('\n');
          setInvoiceData(prev => {
            const activeOrderId = String(numericSoId);
            const storageKey = `consignee_override_sales_${activeOrderId}`;
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (parsed && (parsed.name || parsed.address)) {
                  return {
                    ...prev,
                    consignee: {
                      name: parsed.name || '',
                      address: parsed.address || ''
                    }
                  };
                }
              } catch (e) { }
            }
            return {
              ...prev,
              consignee: {
                name: addr.consigneeName || prev.consignee.name || '',
                address: fullAddress
              }
            };
          });
          if (addr.consigneeId) {
            setSelectedValues(prev => ({
              ...prev,
              consgineeId: String(addr.consigneeId)
            }));
          }
        });
      }
    }
  }, [
    invoiceDetail,
    customersArr,
    companyMasterArr,
    salesOrdersArr,
    weavingOrdersArr,
    yarnSalesOrdersArr,
    consigneesArr,
    cityList,
    stateList,
    countryList,
    applyGstFromMaster,
    transportsArr,
    shipmentTermsList,
    normalizedUoms,
    sizingJobWorkOrdersArr,
    resolveSizingOrderNo,
    dispatch
  ]);

  useEffect(() => {
    setIsRoundOffLocked(Boolean(invoiceDetail));
  }, [invoiceDetail]);

  const sendInvoice = async () => {
    const hasExceededTotalAmount =
      invoiceData.items.some((item) => (Number(item.totalAmount) || 0) > 4900000) ||
      invoiceData.items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0) > 4900000;
    if (hasExceededTotalAmount) {
      toast.error('Total Amount should not exceed 49,00,000 (49 Lakhs)');
      return;
    }

    if (!isFormValid) {
      toast.error('Please fill all required fields before sending');
      return;
    }

    try {
      // First save the invoice if not already saved
      if (!invoiceData.invoiceNo || invoiceData.invoiceNo === '') {
        await saveInvoice();
      }

      toast.success('Invoice sent successfully!');

    } catch (error) {
      toast.error('Failed to send invoice');
      console.error('Error sending invoice:', error);
    }
  };

  const validateForm = useCallback(() => {
    const orderFieldValid = shouldShowWeavingOrders
      ? !!selectedWeavingWorkOrderId
      : (shouldShowYarnSalesOrders
        ? !!selectedYarnSalesOrderId
        : (shouldShowSizingOrders
          ? !!selectedSizingWorkOrderId
          : (shouldShowSalesOrders ? !!selectedSalesOrder : true)));

    // Helper function to check if a value is valid (not null, undefined, or empty string)
    const isValidValue = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    };

    // Check all required fields
    const requiredFieldsValid =
      isValidValue(selectedInvoiceTypeId) &&
      isValidValue(selectedValues.customerId) &&
      isValidValue(selectedValues.consgineeId) &&
      isValidValue(selectedValues.shipmentMode) &&
      isValidValue(selectedValues.paymentTermsId) &&
      isValidValue(selectedValues.termsConditionsId) &&
      // isValidValue(selectedValues.shipmentTermsId) && // Optional field - not marked with * in UI
      (isBrushedPiece || isValidValue(selectedValues.warehouseId)) &&
      // isValidValue(selectedValues.gstType) && // Auto-filled/Disabled field - not marked with * in UI
      orderFieldValid; // Boolean - true means valid

    const hasItems = invoiceData.items.length > 0;
    const hasExceededTotalAmount =
      invoiceData.items.some((item) => (Number(item.totalAmount) || 0) > 4900000) ||
      invoiceData.items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0) > 4900000;

    const itemsValid = hasItems && !hasExceededTotalAmount && invoiceData.items.every(item =>
      isValidValue(item.productName) &&
      item.quantity > 0 &&
      item.rate > 0 &&
      item.gstPercent >= 0
    );

    const buyerNameValid = isValidValue(invoiceData.buyer.name);
    const consigneeNameValid = isValidValue(invoiceData.consignee.name);

    const isValid = requiredFieldsValid &&
      hasItems &&
      itemsValid &&
      buyerNameValid &&
      consigneeNameValid;

    setIsFormValid(isValid);
  }, [invoiceData, selectedValues, addDiscItems, roundOff, isJobwork, isYarnSalesInvoiceType, selectedWeavingWorkOrderId, selectedYarnSalesOrderId, selectedSizingWorkOrderId, selectedSalesOrder, selectedInvoiceTypeId, shouldShowSizingOrders, shouldShowSalesOrders, shouldShowWeavingOrders, shouldShowYarnSalesOrders]);

  // Validate form whenever data changes
  useEffect(() => {
    validateForm();
  }, [validateForm]);

  // Get unique sales orders from generatePackingList (where isJobwork = 0)
  const getAvailableSalesOrdersFromPacking = () => {
    if (!shouldShowSalesOrders) return [];
    if (isSizingSalesInvoiceType) return [];

    const normalized = normalizedPackingList;

    const soList = Array.isArray((salesOrderList as any)?.data)
      ? (salesOrderList as any).data
      : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);

    const ensureIds = [
      selectedSalesOrder ? Number(selectedSalesOrder) : null,
      invoiceDetail?.salesOrderId != null ? Number(invoiceDetail.salesOrderId) : null
    ].filter((id): id is number => id !== null && !Number.isNaN(id));
    const forceIncludeIdSet = new Set(ensureIds);

    const matchesOrderTypeFilter = (orderTypeId: number | null, id: number) => {
      const target = targetSalesOrderTypeId;
      if (forceIncludeIdSet.has(id)) {
        if (target === null) return true;
        if (orderTypeId === null) return false;
        return orderTypeId === target;
      }
      if (target === null) return true;
      if (orderTypeId === null) return false;
      return orderTypeId === target;
    };

    const uniqueSalesOrders = new Map<number, any>();

    (normalized || []).forEach((packing: any) => {
      if (Number(packing?.isJobwork ?? 0) === 0 && packing?.salesOrderId) {
        const soId = Number(packing.salesOrderId);
        if (!soId || Number.isNaN(soId)) {
          return;
        }
        if (uniqueSalesOrders.has(soId)) {
          return;
        }
        const so = soList.find((s: any) => s?.id === soId);
        const orderTypeId = resolveSalesOrderTypeId(packing, so);
        if (!matchesOrderTypeFilter(orderTypeId, soId)) {
          return;
        }
        if (so) {
          uniqueSalesOrders.set(soId, so);
        } else {
          uniqueSalesOrders.set(soId, {
            id: soId,
            salesOrderNo: resolveSalesOrderNo(soId) || `SO-${soId}`
          });
        }
      }
    });

    if (targetSalesOrderTypeId !== null && uniqueSalesOrders.size === 0) {
      return [];
    }

    ensureIds.forEach((id) => {
      if (uniqueSalesOrders.has(id)) {
        return;
      }
      const fallback = soList.find((s: any) => Number(s?.id) === id);
      const fallbackOrderTypeId = resolveSalesOrderTypeId(null, fallback);
      if (!matchesOrderTypeFilter(fallbackOrderTypeId, id)) {
        return;
      }
      if (fallback) {
        uniqueSalesOrders.set(id, fallback);
        return;
      }
      uniqueSalesOrders.set(id, {
        id,
        salesOrderNo: resolveSalesOrderNo(id) || `SO-${id}`
      });
    });

    return Array.from(uniqueSalesOrders.values());
  };

  // Get unique weaving orders referenced by the generatePackingList entries
  const getAvailableWeavingOrdersFromPacking = () => {
    if (!shouldShowWeavingOrders) return [];

    const normalized = normalizedPackingList || [];
    const woList = weavingOrdersArr;
    const uniqueWeavingOrders = new Map<number, any>();

    normalized.forEach((packing: any) => {
      if (Number(packing?.isJobwork ?? 0) !== 1 || !packing?.weavingWorkOrderId) {
        return;
      }
      const woId = Number(packing.weavingWorkOrderId);
      if (!woId || Number.isNaN(woId)) {
        return;
      }
      if (uniqueWeavingOrders.has(woId)) {
        return;
      }
      const wo = woList.find((w: any) => String(w?.id) === String(woId));
      if (wo) {
        uniqueWeavingOrders.set(woId, wo);
      } else {
        const fallbackOrderNo = packing.weavingWorkOrderNo || packing.weavingOrderNo || packing.orderNo || resolveWeavingOrderNo(woId) || `WO-${woId}`;
        uniqueWeavingOrders.set(woId, {
          id: woId,
          weavingOrderNo: fallbackOrderNo,
          orderNo: fallbackOrderNo
        });
      }
    });

    return Array.from(uniqueWeavingOrders.values());
  };

  const salesOrderSelectOptions: CommonSearchableSelectOption[] = getAvailableSalesOrdersFromPacking()
    .map((so: any) => {
      const value = so?.id;
      const label = so?.salesOrderNo || `Order ${value}`;
      if (value == null || !label) return null;
      return { id: value, value: String(value), label };
    })
    .filter(Boolean) as CommonSearchableSelectOption[];

  const yarnSalesOrderSelectOptions = (yarnSalesOrdersArr ?? [])
    .map((order: any) => {
      const value = order?.id;
      const label = order?.yarnSalesNo || `YS-${order?.id}`;
      if (value == null || !label) return null;
      return { id: value, value: String(value), label };
    })
    .filter(Boolean) as CommonSearchableSelectOption[];

  const sizingWorkOrderSelectOptions = (sizingJobWorkOrdersArr ?? [])
    .map((order: any) => {
      const value = order?.id;
      const label = order?.sizingWorkOrderNo || order?.sizingJobWorkOrderNo || order?.jobWorkOrderNo || order?.orderNo || `SJO-${order?.id}`;
      if (value == null || !label) return null;
      return { id: value, value: String(value), label };
    })
    .filter(Boolean) as CommonSearchableSelectOption[];

  const weavingOrderSelectOptions: CommonSearchableSelectOption[] = getAvailableWeavingOrdersFromPacking()
    .map((wo: any) => {
      const value = wo?.id;
      const label = wo?.weavingWorkOrderNo || wo?.orderNo || `Order ${wo?.id}`;
      if (value == null || !label) return null;
      return { id: value, value: String(value), label };
    })
    .filter(Boolean) as CommonSearchableSelectOption[];

  const handleInvoiceTypeChange = (value: string) => {
    setHasUserAdjustedInvoiceType(true);
    setSelectedInvoiceTypeId(value);

    if (!invoiceDetail) {
      setInvoiceData(prev => ({ ...prev, invoiceNo: '' }));
    }

    const nextIsJobwork = matchesInvoiceTypeValue(value, jobworkKey, 203);
    const nextIsYarnSales = matchesInvoiceTypeValue(value, yarnSalesKey, 205);
    const nextIsSizingSales = matchesInvoiceTypeValue(value, sizingSalesKey, 204);
    const nextTargetOrderTypeId = matchesInvoiceTypeValue(value, internationalKey, 202)
      ? 2
      : (matchesInvoiceTypeValue(value, domesticKey, 201) ? 1 : null);

    if (nextIsJobwork) {
      setSelectedSalesOrder('');
      setSelectedYarnSalesOrderId('');
      setSelectedSizingWorkOrderId('');
      setSelectedSizingWorkOrder(null);
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
    } else if (nextIsYarnSales) {
      setSelectedSalesOrder('');
      setSelectedSizingWorkOrderId('');
      setSelectedSizingWorkOrder(null);
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
    } else if (nextIsSizingSales) {
      setSelectedSalesOrder('');
      setSelectedYarnSalesOrderId('');
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
    } else {
      setSelectedYarnSalesOrderId('');
      setSelectedSizingWorkOrderId('');
      setSelectedSizingWorkOrder(null);
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
    }

    if (!nextIsJobwork) {
      setSelectedWeavingWorkOrderId('');
      setSelectedWeavingOrder(null);
      setInvoiceData(prev => ({ ...prev, woNo: '' }));
    }

    if (nextIsYarnSales || nextIsSizingSales) {
      return;
    }

    if (!nextIsJobwork) {
      if (selectedSalesOrder && nextTargetOrderTypeId !== null) {
        const soList = Array.isArray((salesOrderList as any)?.data)
          ? (salesOrderList as any).data
          : (Array.isArray(salesOrderList) ? (salesOrderList as any[]) : []);
        const currentSO = soList.find((so: any) => so?.id === Number(selectedSalesOrder));
        const orderTypeId = Number(currentSO?.orderTypeId ?? currentSO?.orderType ?? 0);
        if (!currentSO || orderTypeId !== nextTargetOrderTypeId) {
          setSelectedSalesOrder('');
          setInvoiceData(prev => ({ ...prev, soNo: '' }));
        }
      } else if (nextTargetOrderTypeId === null) {
        setSelectedSalesOrder('');
        setInvoiceData(prev => ({ ...prev, soNo: '' }));
      }
    }
  };

  const handleSalesOrderChange = (soId: string) => {
    if (soId && soId === selectedSalesOrder) {
      return;
    }

    if (!soId) {
      setSelectedSalesOrder('');
      resetFormForOrderChange();
      setInvoiceData(prev => ({
        ...prev,
        soNo: ''
      }));
      setSelectedValues(prev => ({
        ...prev,
        customerId: '',
        consgineeId: ''
      }));
      hydrateBuyerDetails('');
      hydrateConsigneeDetails('');
      return;
    }

    const numericSoId = Number(soId);
    if (Number.isNaN(numericSoId)) {
      toast.error('Invalid sales order selection');
      return;
    }

    const soList = Array.isArray((salesOrderList as any)?.data)
      ? (salesOrderList as any).data
      : [];
    if (Number.isNaN(numericSoId) || numericSoId <= 0) {
      setSelectedSalesOrder('');
      resetFormForOrderChange();
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
      setSelectedValues(prev => ({
        ...prev,
        customerId: '',
        consgineeId: ''
      }));
      hydrateBuyerDetails('');
      hydrateConsigneeDetails('');
      return;
    }

    const selectedSO = salesOrdersArr.find((so: any) => so?.id === numericSoId);
    if (!selectedSO) {
      resetFormForOrderChange();
      setSelectedSalesOrder(soId);
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
      setSelectedValues(prev => ({
        ...prev,
        customerId: '',
        consgineeId: ''
      }));
      hydrateBuyerDetails('');
      hydrateConsigneeDetails('');
      return;
    }

    resetFormForOrderChange();
    setSelectedSalesOrder(soId);
    latestSalesOrderIdRef.current = numericSoId;

    const buyerId = selectedSO.buyerCustomerId || selectedSO?.buyerCustomer?.id || '';
    const consigneeId = selectedSO.deliverToId || selectedSO?.deliverTo?.id || '';
    const taxId = selectedSO.taxId ?? selectedSO?.data?.taxId;

    skipConsigneeHydrationRef.current = true;

    const shipmentTermsId = selectedSO.shipmentTermsId || selectedSO?.shipmentTerms?.id;
    const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId));

    const resolved = resolveConsigneeForOrder(soId, false);
    if (resolved) {
      setInvoiceData(prev => ({
        ...prev,
        soNo: selectedSO.salesOrderNo,
        termsAndConditions: selectedSO?.termsConditions?.termName || '',
        shipVia: selectedSO?.modeOfShipment?.modeName || '',
        deliveryTerms: shipmentTerm?.termName || selectedSO?.shipmentTerms?.termName || '',
        consignee: {
          name: resolved.name,
          address: resolved.address
        }
      }));

      setSelectedValues(prev => ({
        ...prev,
        customerId: String(buyerId || ''),
        consgineeId: resolved.consgineeId,
        shipmentMode: String(selectedSO.modeOfShipmentId || selectedSO?.modeOfShipment?.id || ''),
        paymentTermsId: String(selectedSO.paymentTermsId || selectedSO?.paymentTerms?.id || ''),
        termsConditionsId: String(selectedSO.termsConditionsId || selectedSO?.termsConditions?.id || ''),
        shipmentTermsId: String(shipmentTermsId || ''),
        gstType: taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '')
      }));

      setIsBuyerAddressLoading(true);
      hydrateBuyerDetails(buyerId ? String(buyerId) : '');
      setIsBuyerAddressLoading(false);
    } else {
      setInvoiceData(prev => {
        const activeOrderId = String(soId);
        const storageKey = `consignee_override_sales_${activeOrderId}`;
        let overriddenConsignee = { name: '', address: '' };
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.name || parsed.address)) {
              overriddenConsignee = {
                name: parsed.name || '',
                address: parsed.address || ''
              };
            }
          } catch (e) { }
        }
        return {
          ...prev,
          soNo: selectedSO.salesOrderNo,
          termsAndConditions: selectedSO?.termsConditions?.termName || '',
          shipVia: selectedSO?.modeOfShipment?.modeName || '',
          deliveryTerms: shipmentTerm?.termName || selectedSO?.shipmentTerms?.termName || '',
          consignee: overriddenConsignee,
        };
      });

      setSelectedValues(prev => ({
        ...prev,
        customerId: String(buyerId || ''),
        consgineeId: String(consigneeId || ''),
        shipmentMode: String(selectedSO.modeOfShipmentId || selectedSO?.modeOfShipment?.id || ''),
        paymentTermsId: String(selectedSO.paymentTermsId || selectedSO?.paymentTerms?.id || ''),
        termsConditionsId: String(selectedSO.termsConditionsId || selectedSO?.termsConditions?.id || ''),
        shipmentTermsId: String(shipmentTermsId || ''),
        gstType: taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '')
      }));

      setIsBuyerAddressLoading(true);
      hydrateBuyerDetails(buyerId ? String(buyerId) : '');
      setIsBuyerAddressLoading(false);

      setIsConsigneeAddressLoading(true);
      dispatch(getSalesOrderConsigneeAddress(numericSoId)).then((result: any) => {
        if (latestSalesOrderIdRef.current !== numericSoId) return;
        setIsConsigneeAddressLoading(false);
        if (result?.type?.endsWith('/rejected')) return;
        const addr = result?.payload;
        if (!addr || typeof addr !== 'object') return;
        const lineParts: string[] = [];
        if (addr.addressLine1) lineParts.push(addr.addressLine1);
        if (addr.addressLine2) lineParts.push(addr.addressLine2);
        const loc: string[] = [];
        if (addr.cityName) loc.push(addr.cityName);
        if (addr.stateName) loc.push(addr.stateName);
        if (addr.countryName) loc.push(addr.countryName);
        if (loc.length) lineParts.push(loc.join(', '));
        const addressText = lineParts.join(', ');
        const pin = addr.pinCode ? `PIN: ${addr.pinCode}` : '';
        const stateCode = addr.stateCode ? `State Code: ${addr.stateCode}` : '';
        const gst = addr.gstNo ? `GST No: ${addr.gstNo}` : 'GST No: Not Provided';
        const fullAddress = [addressText, pin, stateCode, gst].filter(Boolean).join('\n');
        setInvoiceData(prev => {
          const activeOrderId = String(numericSoId);
          const storageKey = `consignee_override_sales_${activeOrderId}`;
          const saved = sessionStorage.getItem(storageKey);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && (parsed.name || parsed.address)) {
                return {
                  ...prev,
                  consignee: {
                    name: parsed.name || '',
                    address: parsed.address || ''
                  }
                };
              }
            } catch (e) { }
          }
          return {
            ...prev,
            consignee: {
              name: addr.consigneeName || '',
              address: fullAddress
            }
          };
        });
      });
    }
  };


  const handleSizingWorkOrderChange = useCallback((orderId: string) => {
    if (!orderId) {
      setSelectedSizingWorkOrderId('');
      setSelectedSizingWorkOrder(null);
      resetFormForOrderChange();
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
      setSelectedValues(prev => ({ ...prev, customerId: '', consgineeId: '' }));
      hydrateBuyerDetails('');
      hydrateConsigneeDetails('');
      return;
    }

    const selectedOrder = sizingJobWorkOrdersArr.find((order: any) => String(order.id) === String(orderId));
    setSelectedSizingWorkOrderId(orderId);
    setSelectedSizingWorkOrder(selectedOrder || null);

    if (!selectedOrder) {
      resetFormForOrderChange();
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
      setSelectedValues(prev => ({ ...prev, customerId: '', consgineeId: '' }));
      hydrateBuyerDetails('');
      hydrateConsigneeDetails('');
      return;
    }

    resetFormForOrderChange();

    const buyerId = selectedOrder.buyerId ?? selectedOrder?.buyer?.id ?? selectedOrder?.buyerCustomerId ?? selectedOrder?.customerId ?? '';
    const consigneeId = selectedOrder.consigneeId ?? selectedOrder?.consignee?.id ?? '';
    const taxId = selectedOrder.taxId ?? selectedOrder?.gstTypeId ?? selectedOrder?.gstType ?? 0;
    const gstType = taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '');
    const orderNo = selectedOrder.sizingWorkOrderNo || selectedOrder.sizingJobWorkOrderNo || selectedOrder.jobWorkOrderNo || selectedOrder.orderNo || '';
    const shipmentTermsId = selectedOrder.shipmentTermsId || selectedOrder?.shipmentTerms?.id;
    const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId));

    const resolved = resolveConsigneeForOrder(orderId, false);
    const finalConsigneeId = resolved ? resolved.consgineeId : String(consigneeId || '');

    setInvoiceData(prev => ({
      ...prev,
      soNo: orderNo,
      termsAndConditions: selectedOrder?.termsConditions?.termName || selectedOrder?.termsConditionsName || '',
      shipVia: selectedOrder?.modeOfShipment?.modeName || selectedOrder?.modeOfShipmentName || selectedOrder?.modeOfShipment || '',
      deliveryTerms: shipmentTerm?.termName || selectedOrder?.shipmentTerms?.termName || '',
      consignee: resolved ? { name: resolved.name, address: resolved.address } : prev.consignee
    }));

    setSelectedValues(prev => ({
      ...prev,
      customerId: String(buyerId || ''),
      consgineeId: finalConsigneeId,
      shipmentMode: String(selectedOrder.modeOfShipmentId || selectedOrder?.modeOfShipment?.id || selectedOrder?.modeOfShipment || ''),
      paymentTermsId: String(selectedOrder.paymentTermsId || selectedOrder?.paymentTerms?.id || ''),
      termsConditionsId: String(selectedOrder.termsConditionsId || selectedOrder?.termsConditions?.id || ''),
      shipmentTermsId: String(shipmentTermsId || ''),
      gstType,
    }));

    hydrateBuyerDetails(buyerId ? String(buyerId) : '');
    if (resolved) {
      skipConsigneeHydrationRef.current = true;
    } else {
      hydrateConsigneeDetails(consigneeId ? String(consigneeId) : '');
    }
  }, [hydrateBuyerDetails, hydrateConsigneeDetails, resetFormForOrderChange, shipmentTermsList, sizingJobWorkOrdersArr, setSelectedValues, resolveConsigneeForOrder]);


  const handleYarnSalesOrderChange = (orderId: string) => {
    const order = yarnSalesOrdersArr.find((o: any) => o?.id === Number(orderId));
    if (!order) {
      setSelectedYarnSalesOrderId('');
      resetFormForOrderChange();
      setInvoiceData(prev => ({ ...prev, soNo: '' }));
      setSelectedValues(prev => ({
        ...prev,
        customerId: '',
        consgineeId: ''
      }));
      hydrateBuyerDetails('');
      hydrateConsigneeDetails('');
      return;
    }

    resetFormForOrderChange();
    setSelectedYarnSalesOrderId(orderId);

    const buyerId = order.buyerId || order?.buyer?.id || '';
    const consigneeId = order.deliveryAtId || order?.deliveryAt?.id || '';
    const taxId = order.gstTypeId;
    const gstType = taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '');
    const firstItem = Array.isArray(order?.items) && order.items.length > 0 ? order.items[0] : null;
    const gstPercentId = firstItem?.gstPercentId ?? firstItem?.gstPercent?.id;
    if (gstPercentId !== undefined && gstPercentId !== null && gstPercentId !== '') {
      setActiveGstPercentId(String(gstPercentId));
    }
    applyGstFromMaster(gstPercentId, gstType, Number(firstItem?.gstPercent || 0));

    const shipmentTermsId = order.shipmentTermsId || order?.shipmentTerms?.id;
    const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId));

    const resolved = resolveConsigneeForOrder(orderId, false);
    const finalConsigneeId = resolved ? resolved.consgineeId : String(consigneeId || '');

    setInvoiceData(prev => ({
      ...prev,
      soNo: order.yarnSalesNo || '',
      termsAndConditions: order?.termsConditions?.termName || '',
      shipVia: order?.modeOfShipment?.modeName || '',
      paymentTerms: order?.paymentTerms?.termName || '',
      deliveryTerms: shipmentTerm?.termName || order?.shipmentTerms?.termName || '',
      consignee: resolved ? { name: resolved.name, address: resolved.address } : prev.consignee
    }));

    setSelectedValues(prev => ({
      ...prev,
      customerId: String(buyerId || ''),
      consgineeId: finalConsigneeId,
      shipmentMode: String(order.modeOfShipmentId || order?.modeOfShipment?.id || ''),
      paymentTermsId: String(order.paymentTermsId || order?.paymentTerms?.id || ''),
      termsConditionsId: String(order.termsConditionsId || order?.termsConditions?.id || ''),
      shipmentTermsId: String(shipmentTermsId || ''),
      gstType,
    }));

    hydrateBuyerDetails(buyerId ? String(buyerId) : '');
    if (resolved) {
      skipConsigneeHydrationRef.current = true;
    } else {
      hydrateConsigneeDetails(consigneeId ? String(consigneeId) : '');
    }
  };

  useEffect(() => {
    if (!shouldShowYarnSalesOrders) return;
    if (!invoiceDetail?.yarnSalesOrderId) return;
    if (!yarnSalesOrdersArr.length) return;
    const id = String(invoiceDetail.yarnSalesOrderId);
    if (selectedYarnSalesOrderId === id) return;
    handleYarnSalesOrderChange(id);
  }, [shouldShowYarnSalesOrders, invoiceDetail, yarnSalesOrdersArr, selectedYarnSalesOrderId]);

  useEffect(() => {
    if (!shouldShowSizingOrders) return;
    const invoiceSizingId = invoiceDetail?.sizingJobWorkOrderId ?? invoiceDetail?.sizingWorkOrderId;
    if (!invoiceSizingId) return;
    const sizingId = String(invoiceSizingId);
    if (selectedSizingWorkOrderId === sizingId) return;
    if (!sizingJobWorkOrdersArr.length) return;
    handleSizingWorkOrderChange(sizingId);
  }, [shouldShowSizingOrders, invoiceDetail, sizingJobWorkOrdersArr, selectedSizingWorkOrderId, handleSizingWorkOrderChange]);

  const sumTaxable = roundToTwoDecimals(invoiceData.items.reduce((sum, item) => sum + (Number(item.taxableAmount) || 0), 0));
  const sumGst = roundToTwoDecimals(invoiceData.items.reduce((sum, item) => sum + (Number(item.gstAmount) || 0), 0));
  const addSumAbs = roundToTwoDecimals(addDiscItems.filter(i => i.type === 'addition').reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0));
  const discSumAbs = roundToTwoDecimals(addDiscItems.filter(i => i.type === 'discount').reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0));
  const netAddDisc = roundToTwoDecimals(addDiscItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
  const normalizedRoundOff = roundToTwoDecimals(roundOff);
  const finalAmount = roundToTwoDecimals(sumTaxable + sumGst + netAddDisc + normalizedRoundOff);

  const handleSelectChange = (field: string, value: string) => {
    if (field === 'consgineeId') {
      preferredConsigneeAddressIdRef.current = null;

      const matchId = String(value);
      const resolveAddr = (rawAddr: any) => {
        if (!Array.isArray(rawAddr)) return rawAddr;
        return rawAddr.find((a: any) => a.activeFlag !== false) || rawAddr[0];
      };

      let selectedName = '';
      let selectedAddress = '';

      if (isJobwork) {
        const jobworkConsignee = consigneesArr.find((c: any) => String(c.id) === matchId);
        if (jobworkConsignee) {
          const addrObj = resolveAddr(jobworkConsignee.address);
          const addrText = formatAddressMultiline(addrObj, cityList, stateList, countryList);
          const gst = jobworkConsignee.gstNo ? String(jobworkConsignee.gstNo).trim() : 'Not Provided';
          selectedName = jobworkConsignee.consigneeName || jobworkConsignee.name || '';
          selectedAddress = [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
        }
      } else {
        const consignee = consigneesArr.find((c: any) => String(c.id) === matchId);
        if (consignee) {
          const addrObj = resolveAddr(consignee.address);
          const addrText = formatAddressMultiline(addrObj, cityList, stateList, countryList);
          const gst = consignee.gstNo ? String(consignee.gstNo).trim() : 'Not Provided';
          selectedName = consignee.consigneeName || '';
          selectedAddress = [addrText, `GST No: ${gst}`].filter(Boolean).join('\n');
        }
      }

      if (selectedName || selectedAddress) {
        const newConsignee = { name: selectedName, address: selectedAddress };
        updateConsigneeOverride(newConsignee, matchId);
        setInvoiceData(prev => ({
          ...prev,
          consignee: newConsignee
        }));
      } else {
        updateConsigneeOverride({ name: '', address: '' }, '');
        setInvoiceData(prev => ({
          ...prev,
          consignee: { name: '', address: '' }
        }));
      }
    }

    setSelectedValues(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'warehouseId') {
      setHasManualWarehouseSelection(true);
    }

    if (field === 'termsConditionsId' && value) {
      const selectedTC = termsContitionsList?.find((tc: any) => String(tc.id) === String(value));
      if (selectedTC) {
        setInvoiceData(prev => ({
          ...prev,
          termsAndConditions: selectedTC.description || selectedTC.termsConditionsName || ''
        }));
      }
    }
  };

  const handleWeavingOrderChange = (woId: string) => {
    setSelectedWeavingWorkOrderId(woId);

    const weavingOrdersArr = Array.isArray((weavingJobWorkOrderList as any)?.data)
      ? (weavingJobWorkOrderList as any).data
      : (Array.isArray(weavingJobWorkOrderList) ? weavingJobWorkOrderList : []);

    const selectedWO = weavingOrdersArr.find((wo: any) => String(wo.id) === String(woId));
    setSelectedWeavingOrder(selectedWO || null);

    if (selectedWO) {
      resetFormForOrderChange();
      const buyerId = selectedWO.buyerId || selectedWO?.buyer?.id || '';
      const consigneeId = selectedWO.consigneeId || selectedWO?.consignee?.id || '';
      const taxId = selectedWO.taxId ?? selectedWO.gstTypeId ?? selectedWO?.data?.taxId ?? selectedWO?.data?.gstTypeId;

      const orderNo = selectedWO.weavingWorkOrderNo || selectedWO.weavingOrderNo || selectedWO.orderNo || '';

      const shipmentTermsId = selectedWO.shipmentTermsId || selectedWO?.shipmentTerms?.id;
      const shipmentTerm = shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId));

      const resolved = resolveConsigneeForOrder(woId, true);
      const finalConsigneeId = resolved ? resolved.consgineeId : String(consigneeId || '');

      setInvoiceData(prev => ({
        ...prev,
        woNo: orderNo,
        termsAndConditions: selectedWO?.termsConditions?.termName || '',
        shipVia: selectedWO?.modeOfShipment?.modeName || '',
        deliveryTerms: shipmentTerm?.termName || selectedWO?.shipmentTerms?.termName || '',
        consignee: resolved ? { name: resolved.name, address: resolved.address } : prev.consignee
      }));

      setSelectedValues(prev => ({
        ...prev,
        customerId: String(buyerId || ''),
        consgineeId: finalConsigneeId,
        shipmentMode: String(selectedWO.modeOfShipmentId || selectedWO?.modeOfShipment?.id || ''),
        paymentTermsId: String(selectedWO.paymentTermsId || selectedWO?.paymentTerms?.id || ''),
        termsConditionsId: String(selectedWO.termsConditionsId || selectedWO?.termsConditions?.id || ''),
        shipmentTermsId: String(shipmentTermsId || ''),
        gstType: taxId === 1 || taxId === '1' ? '1' : (taxId === 2 || taxId === '2' ? '2' : '')
      }));

      hydrateBuyerDetails(buyerId ? String(buyerId) : '');
      if (resolved) {
        skipConsigneeHydrationRef.current = true;
      } else {
        hydrateConsigneeDetails(consigneeId ? String(consigneeId) : '');
      }
    } else {
      resetFormForOrderChange();
      setInvoiceData(prev => ({
        ...prev,
        woNo: ''
      }));
      setSelectedValues(prev => ({
        ...prev,
        customerId: '',
        consgineeId: ''
      }));
      hydrateBuyerDetails('');
      hydrateConsigneeDetails('');
    }
  };

  const saveInvoice = async () => {
    const hasExceededTotalAmount =
      invoiceData.items.some((item) => (Number(item.totalAmount) || 0) > 4900000) ||
      invoiceData.items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0) > 4900000;
    if (hasExceededTotalAmount) {
      toast.error('Total Amount should not exceed 49,00,000 (49 Lakhs)');
      return;
    }

    if (!isFormValid) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const readActiveCompanyId = () => {
        try {
          const stored = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
          if (!stored) {
            return null;
          }
          const parsed = Number(stored);
          return Number.isNaN(parsed) ? null : parsed;
        } catch {
          return null;
        }
      };
      const activeCompanyId = selectedCompanyId ?? readActiveCompanyId();
      if (!activeCompanyId) {
        toast.error("Please select a company before submitting");
        return;
      }

      let documentNumber = invoiceData.invoiceNo || "";

      if (!invoiceDetail?.id && !documentNumber) {
        if (!resolvedInvoiceTypeId) {
          toast.error("Please select an invoice type before submitting");
          return;
        }

        const generated = invoiceNumberService.generateInvoiceNumber({
          invoiceTypeId: resolvedInvoiceTypeId,
          invoiceSettings: companyInvoiceSettings,
          invoices: invoiceArray,
          companyId: activeCompanyId,
          companyCode: companyInfo?.companyCode
        });

        if (generated?.invoiceNo) {
          documentNumber = generated.invoiceNo;
        }
      }

      if (!invoiceDetail?.id && documentNumber) {
        documentNumber = ensureUniqueInvoiceNumber(applyInvoicePrefix(documentNumber));
      }

      if (!documentNumber) {
        toast.error("Unable to generate invoice number");
        return;
      }

      const firstYarnReference = invoiceData.items.find(item => item.yarnChallanId);
      const invoiceTypeCodeValue = selectedInvoiceTypeDetail?.value || selectedInvoiceTypeDetail?.code || '';

      const uniquePackingListNos = Array.from(new Set(invoiceData.items.map(item => item.packingListNo).filter(Boolean)));
      const topLevelPackingListNo = uniquePackingListNos.join(', ');

      const payload = {
        id: invoiceDetail?.id || 0,
        manufactureId: selectedValues.manufactureId,
        invoiceDate: invoiceData.date,
        invoiceNo: documentNumber,
        invoiceTypeId: resolvedInvoiceTypeId || 0,
        invoiceType: invoiceTypeCodeValue,
        salesOrderId: Number(selectedSalesOrder) || 0,
        yarnSalesOrderId: resolvedYarnSalesOrderId || 0,
        yarnChallanId: firstYarnReference?.yarnChallanId || 0,
        sizingWorkOrderId: resolvedSizingWorkOrderId || 0,
        sizingJobWorkOrderId: resolvedSizingWorkOrderId || 0,
        ...(
          isSizingSalesInvoiceType
            ? {
              sizingOrderId: resolvedSizingWorkOrderId || 0,
              sjoNo: invoiceData.soNo || '',
            }
            : {}
        ),
        yarnChallanNo: firstYarnReference?.yarnChallanNo || '',
        soNo: invoiceData.soNo,
        woNo: invoiceData.woNo,
        companyBankId: Number(selectedValues.companyBankId || 0),
        termsConditionsId: Number(selectedValues.termsConditionsId || 0),
        paymentTermsId: Number(selectedValues.paymentTermsId || 0),
        shipToId: Number(selectedValues.shipToId || 0),
        shipmentMode: Number(selectedValues.shipmentMode || 0),
        deliveryTermsId: Number(selectedValues.shipmentTermsId || 0),
        customerId: Number(selectedValues.customerId),
        consgineeId: Number(selectedValues.consgineeId),
        warehouseId: isBrushedPiece ? null : Number(selectedValues.warehouseId || 0),
        agentId: Number(selectedValues.agentId || 0),
        transportNameId: Number(selectedValues.transportId || 0),
        gstType: selectedValues.gstType,
        byType: invoiceData.byType || 'Manufacturer',
        weavingWorkOrderId: isJobwork ? (Number(selectedWeavingWorkOrderId) || null) : null,

        // Totals and amounts
        taxableAmountTotal: sumTaxable,
        taxAmount: sumGst,
        additionTotal: addSumAbs,
        discountTotal: discSumAbs,
        netAdditionDiscount: netAddDisc,
        roundOff: normalizedRoundOff,
        totalAmount: finalAmount,
        comments: invoiceData.comments,
        activeFlag: true,

        // Addition / Discount
        additional: invoiceData.additional,
        less: invoiceData.less,
        addDiscItems: (addDiscItems || []).map(({ id, description, type, mode, percValue, amount }) => ({ id, description, type, mode, percValue, amount })),
        addDiscDrafts: (addDiscDrafts || []).map(({ id, description, type, mode, percValue, amount }) => ({ id, description, type, mode, percValue, amount })),

        // Parties and display fields
        manufacturer: { ...invoiceData.manufacturer },
        buyer: { ...invoiceData.buyer },
        consignee: { ...invoiceData.consignee },
        termsAndConditions: invoiceData.termsAndConditions,
        paymentTerms: invoiceData.paymentTerms,
        shipVia: invoiceData.shipVia,
        // transportName: invoiceData.transportName,
        deliveryNote: invoiceData.deliveryNote,
        deliveryTerms: shipmentTermsList?.find((st: any) => String(st.id) === String(selectedValues.shipmentTermsId))?.termName || invoiceData.deliveryTerms,
        vehicleNo: invoiceData.vehicleNo,
        lrNo: invoiceData.lrNo,
        lrDate: invoiceData.lrDate,
        deliveryNoteDate: invoiceData.deliveryNoteDate || null,
        destination: invoiceData.destination || '',
        companyBankName: companyBanks.find((b: any) => String(b.id) === String(selectedValues.companyBankId))?.bankName || '',
        shipmentModeName: shipmentModesList?.find((sm: any) => String(sm.id) === String(selectedValues.shipmentMode))?.modeName || '',
        termsConditionsName: termsContitionsList?.find((tc: any) => String(tc.id) === String(selectedValues.termsConditionsId))?.termsConditionsName || '',
        paymentTermsName: paymentTermsList?.find((pt: any) => String(pt.id) === String(selectedValues.paymentTermsId))?.termName || '',
        agentName: Array.isArray(agentMasterList) ? (agentMasterList.find((a: any) => String(a.id) === String(selectedValues.agentId))?.agentName || '') : '',
        warehouseName: isBrushedPiece ? '' : (normalizedWarehouseList.find((w: any) => String(w.id) === String(selectedValues.warehouseId))?.warehouseName || ''),
        transportName: transportsArr?.find((t: any) => String(t.id) === String(selectedValues.transportId))?.transportName || invoiceData.transportName || '',

        // GST breakdown and state codes
        gstPercent: gstPerc,
        cgstPercent: cgstPerc,
        sgstPercent: sgstPerc,
        igstPercent: igstPerc,
        buyerStateCode: buyerStateCode,
        companyStateCode: companyStateCode,

        // Line items
        items: invoiceData.items.map(item => {
          const resolvedFabricMasterId = deriveInvoiceItemFabricMasterId(item);
          return {
            id: item.id || 0,
            invoiceId: invoiceDetail?.id || 0,
            fabricMasterId: resolvedFabricMasterId,
            productName: item.productName,
            productDescription: item.productName || '',
            quantity: item.quantity,
            noOfRolls: item.noOfRolls || 0,
            uom: item.uom,
            rate: item.rate,
            amount: item.amount,
            gstPercent: item.gstPercent,
            hsnCode: Number(item.hsnCode) || 0,
            taxableAmount: item.taxableAmount,
            gstAmount: item.gstAmount,
            totalAmount: item.totalAmount,
            isReadOnlyQuantity: item.isReadOnlyQuantity,
            packingListNo: item.packingListNo || '',
            yarnChallanId: item.yarnChallanId || 0,
            yarnChallanNo: item.yarnChallanNo || '',
            yarnId: item.yarnId || 0,
            isInvoice: 1,
          };
        }),
        sizingSalesItems: isSizingSalesInvoiceType
          ? invoiceData.items.map(item => ({
            id: item.id || 0,
            invoiceId: invoiceDetail?.id || 0,
            beamOutwardNo: item.packingListNo || '',
            yarnName: item.productName || '',
            noOfBeams: item.noOfRolls || 0,
            beamMeters: item.beamMeters || 0,
            netWeight: item.netWeight || item.quantity || 0,
            totalEnds: item.totalEnds || 0,
            activeFlag: true
          }))
          : [],

        // Summary snapshot
        invoiceSummary: {
          taxableAmount: sumTaxable,
          gstAmount: sumGst,
          addition: addSumAbs,
          discount: discSumAbs,
          roundOff: normalizedRoundOff,
          finalAmount: finalAmount
        },
        companyId: activeCompanyId,
        isInvoice: 1,
        isJobwork: isJobwork ? 1 : 0,
        packingListNo: topLevelPackingListNo,
        isBrushedPiece: isBrushedPiece ? 1 : 0,
      };
      console.log('Payload for saving invoice:', payload);
      if (invoiceDetail?.id) {
        // alert(JSON.stringify(payload));
        const result = await dispatch(updateInvoiceByCompanyId({
          id: invoiceDetail.id,
          companyId: activeCompanyId,
          data: payload
        }));
        if (updateInvoiceByCompanyId.fulfilled.match(result)) {
          const activeOrderId = isJobwork
            ? selectedWeavingWorkOrderId
            : (isYarnSalesInvoiceType
              ? selectedYarnSalesOrderId
              : (isSizingSalesInvoiceType
                ? selectedSizingWorkOrderId
                : selectedSalesOrder));
          if (activeOrderId) {
            const syncKey = `consignee_last_saved_${isJobwork ? 'jobwork' : 'sales'}_${activeOrderId}`;
            localStorage.setItem(syncKey, JSON.stringify({
              consgineeId: selectedValues.consgineeId || '',
              name: invoiceData.consignee?.name || '',
              address: invoiceData.consignee?.address || '',
              source: 'invoice',
              timestamp: Date.now()
            }));
          }
          navigate("/transaction/invoice-management");
        }
      } else {
        const result = await dispatch(createInvoice(payload));
        if (createInvoice.fulfilled.match(result)) {
          const activeOrderId = isJobwork
            ? selectedWeavingWorkOrderId
            : (isYarnSalesInvoiceType
              ? selectedYarnSalesOrderId
              : (isSizingSalesInvoiceType
                ? selectedSizingWorkOrderId
                : selectedSalesOrder));
          if (activeOrderId) {
            const syncKey = `consignee_last_saved_${isJobwork ? 'jobwork' : 'sales'}_${activeOrderId}`;
            localStorage.setItem(syncKey, JSON.stringify({
              consgineeId: selectedValues.consgineeId || '',
              name: invoiceData.consignee?.name || '',
              address: invoiceData.consignee?.address || '',
              source: 'invoice',
              timestamp: Date.now()
            }));
          }
          navigate("/transaction/invoice-management");
        }
      }
    } catch (error) {
      toast.error(invoiceDetail?.id ? 'Failed to update invoice' : 'Failed to save invoice');
      console.error('Error saving invoice:', error);
    }
  };


  const downloadInvoice = async () => {
    // const element = document.getElementById('invoice-content');
    // if (!element) return;

    // try {
    //   // @ts-ignore - Temporarily ignore type issues
    //   const html2canvas = (await import('html2canvas')).default;
    //   // @ts-ignore - Temporarily ignore type issues
    //   const { jsPDF } = await import('jspdf');

    //   const canvas = await html2canvas(element);
    //   const pdf = new jsPDF('p', 'mm', 'a4');
    //   pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297); // A4 dimensions
    //   pdf.save(`invoice_${invoiceData.invoiceNo}.pdf`);
    // } catch (error) {
    //   toast.error('Failed to generate PDF');
    //   console.error('Error generating PDF:', error);
    // }
  };


  const togglePackingSelect = useCallback((rawId: string | number) => {
    const id = normalizePackingSelectionId(rawId);
    if (!id) {
      return;
    }
    setSelectedPackingIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }, []);

  const yarnColumns: PopupColumn[] = useMemo(() => [
    {
      Header: 'S.No',
      id: 'sno',
      disableFilters: true,
      Cell: ({ index }: { index: number }) => index + 1
    },
    {
      Header: 'Challan Date',
      id: 'challanDate',
      accessor: 'challanDate',
      Cell: ({ value }: { value: any }) => value || '-'
    },
    {
      Header: 'Yarn Challan No',
      id: 'challanNo',
      accessor: 'challanNo',
      Cell: ({ value }: { value: any }) => value || '-'
    },
    {
      Header: 'Item Name',
      id: 'itemName',
      accessor: 'itemName'
    },
    {
      Header: 'Quantity',
      id: 'quantity',
      accessor: (row: any) => row.quantityDisplay || row.quantity
    },
    {
      Header: 'Warehouse',
      id: 'warehouseName',
      accessor: 'warehouseName',
      Cell: ({ value }: { value: any }) => value || '-'
    },
    {
      Header: 'Select',
      id: 'select',
      disableFilters: true,
      Cell: ({ row }: { row: any }) => {
        const normalizedLineId = normalizePackingSelectionId(row.id);
        const isSelected = normalizedLineId ? selectedPackingIds.includes(normalizedLineId) : false;
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
              checked={isSelected}
              onChange={() => {
                if (normalizedLineId) {
                  togglePackingSelect(row.id);
                }
              }}
            />
          </div>
        );
      }
    }
  ], [selectedPackingIds, togglePackingSelect]);

  const sizingColumns: PopupColumn[] = useMemo(() => [
    {
      Header: 'S.No',
      id: 'sno',
      disableFilters: true,
      Cell: ({ index }: { index: number }) => index + 1
    },
    {
      Header: 'Sizing Outward No',
      id: 'sizingBeamOutwardNo',
      accessor: 'sizingBeamOutwardNo'
    },
    {
      Header: 'Yarn Name',
      id: 'yarnName',
      accessor: 'yarnName'
    },
    {
      Header: 'No of Beams',
      id: 'noOfBeams',
      accessor: 'noOfBeams'
    },
    {
      Header: 'Beam Meters',
      id: 'beamMeters',
      accessor: 'beamMeters'
    },
    {
      Header: 'Net Weight',
      id: 'netWeight',
      accessor: 'netWeight'
    },
    {
      Header: 'Total Ends',
      id: 'totalEnds',
      accessor: 'totalEnds'
    },
    {
      Header: 'Select',
      id: 'select',
      disableFilters: true,
      Cell: ({ row }: { row: any }) => {
        const normalizedLineId = normalizePackingSelectionId(row.id);
        const isSelected = normalizedLineId ? selectedPackingIds.includes(normalizedLineId) : false;
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
              checked={isSelected}
              onChange={() => {
                if (normalizedLineId) {
                  togglePackingSelect(row.id);
                }
              }}
            />
          </div>
        );
      }
    }
  ], [selectedPackingIds, togglePackingSelect]);

  const generalColumns: PopupColumn[] = useMemo(() => [
    {
      Header: 'S.No',
      id: 'sno',
      disableFilters: true,
      Cell: ({ index }: { index: number }) => index + 1
    },
    {
      Header: 'Packing list No',
      id: 'rollNo',
      accessor: 'rollNo'
    },
    {
      Header: isJobwork ? 'Weaving Order No' : 'Sales Order No',
      id: 'orderNo',
      accessor: (row: any) => isJobwork ? row.weavingOrderNo : row.salesOrderNo
    },
    {
      Header: 'Sort No - Construction',
      id: 'fabricCodeQuality',
      accessor: 'fabricCodeQuality'
    },
    {
      Header: 'Quantity',
      id: 'quantity',
      accessor: 'quantity'
    },
    {
      Header: 'No of Rolls',
      id: 'noOfRolls',
      accessor: 'noOfRolls'
    },
    {
      Header: 'Select',
      id: 'select',
      disableFilters: true,
      Cell: ({ row }: { row: any }) => {
        const normalizedLineId = normalizePackingSelectionId(row.id);
        const isSelected = normalizedLineId ? selectedPackingIds.includes(normalizedLineId) : false;
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
              checked={isSelected}
              onChange={() => {
                if (normalizedLineId) {
                  togglePackingSelect(row.id);
                }
              }}
            />
          </div>
        );
      }
    }
  ], [isJobwork, selectedPackingIds, togglePackingSelect]);

  const importSelected = () => {
    const modalLines = isYarnSalesInvoiceType
      ? yarnChallanLines
      : isSizingSalesInvoiceType
        ? sizingBeamOutwardLines
        : packingLines;
    const selectedIdSet = new Set(selectedPackingIds);
    const selected = modalLines.filter(l => {
      const normalizedId = normalizePackingSelectionId(l.id);
      return normalizedId ? selectedIdSet.has(normalizedId) : false;
    });
    if (selected.length === 0) {
      toast.error('Select at least one packing list line');
      return;
    }

    if (isYarnSalesInvoiceType) {
      const yarnLines = selected as YarnChallanLine[];
      const expandedLines = yarnLines.flatMap((line) =>
        Array.isArray(line.childItems) && line.childItems.length > 0 ? line.childItems : [line]
      );
      const lineWithGst = expandedLines.find(line => line.gstPercentId !== undefined && line.gstPercentId !== null);
      if (lineWithGst?.gstPercentId !== undefined && lineWithGst?.gstPercentId !== null) {
        setActiveGstPercentId(String(lineWithGst.gstPercentId));
        applyGstFromMaster(lineWithGst.gstPercentId, selectedValues.gstType, lineWithGst.gstPercent);
      }

      const newItems: InvoiceItem[] = expandedLines.map((line, index) => {
        // Find the parent challan and the specific item for accurate itemName
        const parentChallan = yarnChallanArr.find((c: any) => c.challanNo === line.challanNo);
        const challanItem = parentChallan?.items?.find((i: any) => i.id === line.itemId);

        const productName = challanItem?.itemName ||
          challanItem?.yarn?.yarnName ||
          line.itemName ||
          'Yarn Item';
        const derivedYarnFabricMasterId = resolveFabricMasterIdFromProductName(productName);

        const quantity = Number(line.quantity) || 0;
        const rate = roundToTwoDecimals(Number(line.rate) || 0);
        const gstPercent = Number(line.gstPercent || gstPerc || 0);
        const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);
        if (totalAmount > 4900000) {
          toast.error('Total Amount should not exceed 49,00,000 (49 Lakhs)');
        }

        return {
          id: Date.now() + index,
          productName: productName,
          quantity,
          uom: line.uom || 'Kg',
          rate,
          amount: totalAmount,
          gstPercent,
          taxableAmount,
          gstAmount,
          totalAmount,
          isReadOnlyQuantity: true,
          fabricMasterId: derivedYarnFabricMasterId || 0,
          packingListNo: '',
          noOfRolls: undefined,
          hsnCode: line.hsnCode || '',
          yarnChallanId: line.challanId,
          yarnChallanNo: line.challanNo,
          yarnId: line.yarnId,
        };
      });

      // const newItems: InvoiceItem[] = expandedLines.map((line, index) => {
      //   const quantity = Number(line.quantity) || 0;
      //   const rate = roundToTwoDecimals(Number(line.rate) || 0);
      //   const gstPercent = Number(line.gstPercent || gstPerc || 0);
      //   const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);

      //   return {
      //     id: Date.now() + index,
      //     productName: line.itemName || 'Yarn Item',
      //     quantity,
      //     uom: line.uom || 'Kg',
      //     rate,
      //     amount: totalAmount,
      //     gstPercent,
      //     taxableAmount,
      //     gstAmount,
      //     totalAmount,
      //     isReadOnlyQuantity: true,
      //     fabricMasterId: 0,
      //     packingListNo: '',
      //     noOfRolls: undefined,
      //     hsnCode: line.hsnCode || '',
      //     yarnChallanId: line.challanId,
      //     yarnChallanNo: line.challanNo,
      //     yarnId: line.yarnId,
      //   };
      // });

      setInvoiceData(prev => ({ ...prev, items: mergeInvoiceItems(prev.items, newItems) }));
      setSelectedPackingIds([]);
      setShowPackingModal(false);
      return;
    }

    if (isSizingSalesInvoiceType) {
      const sizingSelected = selected as SizingBeamOutwardLine[];
      const sizingOrderNos = new Set(sizingSelected.map(l => l.sizingOrderNo).filter(Boolean));
      if (sizingOrderNos.size > 1) {
        toast.error('All selected lines must be from the same sizing order');
        return;
      }

      const sizingOrderNo = Array.from(sizingOrderNos)[0] || '';
      const sizingOrderId = sizingSelected[0]?.sizingOrderId;

      if (sizingOrderId) {
        if (invoiceData.soNo && invoiceData.soNo !== sizingOrderNo) {
          toast.error('Selected packing from different Sizing Order');
          return;
        }
        setSelectedSizingWorkOrderId(String(sizingOrderId));
      }
      setInvoiceData(prev => ({ ...prev, soNo: sizingOrderNo }));

      const newItems: InvoiceItem[] = sizingSelected.map((line, index) => {
        const quantity = Number(line.netWeight) || 0;
        const beamMeters = Number(line.beamMeters) || 0;
        const rate = Number(line.rate || selectedSizingWorkOrder?.sizingRatePerKg || 0);

        // Fetch GST from Yarn Master
        const yarnFromMaster = line.yarnId ? yarnMasterArr.find((y: any) => Number(y.id) === line.yarnId) : null;
        const yarnGstPercent = yarnFromMaster ? Number(yarnFromMaster.gstPercent) : 0;
        const yarnHsnCode = yarnFromMaster ? String(yarnFromMaster.hsnCode || '') : '';

        const gstPercent = Number(gstPerc || line.gstPercent || yarnGstPercent || 0);
        const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);
        if (totalAmount > 4900000) {
          toast.error('Total Amount should not exceed 49,00,000 (49 Lakhs)');
        }

        return {
          id: Date.now() + index,
          productName: line.yarnName || 'Sizing Yarn',
          quantity,
          uom: 'Kg',
          rate,
          amount: totalAmount,
          gstPercent,
          taxableAmount,
          gstAmount,
          totalAmount,
          isReadOnlyQuantity: true,
          noOfRolls: line.noOfBeams,
          hsnCode: yarnHsnCode,
          yarnChallanId: 0,
          yarnChallanNo: '',
          packingListNo: line.sizingBeamOutwardNo || '',
          fabricMasterId: 0,
          yarnId: line.yarnId,
          beamMeters: beamMeters,
          netWeight: quantity, // Using the quantity which was set to line.netWeight
          totalEnds: line.totalEnds,
        } as InvoiceItem;
      });

      setInvoiceData(prev => ({ ...prev, items: mergeInvoiceItems(prev.items, newItems) }));
      setSelectedPackingIds([]);
      setShowPackingModal(false);
      return;
    }

    const packingSelected = selected as PackingLine[];

    if (isJobwork) {
      const woNos = new Set(packingSelected.map(l => l.weavingOrderNo).filter(Boolean));
      if (woNos.size > 1) {
        toast.error('All selected lines must be from the same weaving order');
        return;
      }

      const woNo = Array.from(woNos)[0] || '';
      const woId = packingSelected[0]?.weavingWorkOrderId;

      if (woId) {
        if (invoiceData.woNo && invoiceData.woNo !== woNo) {
          toast.error('Selected packing from different Weaving Order');
          return;
        }

        setSelectedWeavingWorkOrderId(String(woId));
      }

      setInvoiceData(prev => ({ ...prev, woNo }));
    } else {
      const soNos = new Set(packingSelected.map(l => l.salesOrderNo).filter(Boolean));
      if (soNos.size > 1) {
        toast.error('All selected lines must be from the same sales order');
        return;
      }

      const soNo = Array.from(soNos)[0] || '';
      const soId = packingSelected[0]?.salesOrderId;

      if (soId) {
        if (invoiceData.soNo && invoiceData.soNo !== soNo) {
          toast.error('Selected packing from different Sales Order');
          return;
        }

        setSelectedSalesOrder(String(soId));
      }

      setInvoiceData(prev => ({ ...prev, soNo }));
    }

    const newItems: InvoiceItem[] = packingSelected.map((line: PackingLine, index: number) => {
      // Find the original packing record to get accurate fabricCode and quality
      const packingRecord = normalizedPackingList.find(
        (p: any) => p.packingSlipNo === line.rollNo || p.rollNo === line.rollNo
      );

      const fabricCode = packingRecord?.fabricCode || '';
      const quality = packingRecord?.fabricQuality || packingRecord?.quality || '';

      // Construct product name from the fetched data, or fallback to the line property
      const productName = fabricCode || quality
        ? `${fabricCode}${fabricCode && quality ? ' - ' : ''}${quality}`.trim()
        : line.fabricCodeQuality;

      const quantity = Number(line.quantity) || 0;
      const derivedRate = deriveRateFromSalesOrder(productName);
      const derivedUom = deriveUomFromSalesOrder(productName);
      const jobworkDetails = isJobwork ? deriveWeavingOrderItemDetails(line) : null;
      const rate = jobworkDetails?.rate ?? derivedRate ?? roundToTwoDecimals(Number(line.rate) || 0);
      const uom = jobworkDetails?.uom ?? derivedUom ?? (line.uom || 'Mtrs');
      const gstPercent = Number(gstPerc || line.gstPercent || 0);
      const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);
      if (totalAmount > 4900000) {
        toast.error('Total Amount should not exceed 49,00,000 (49 Lakhs)');
      }

      const fabricMaster = fabricMasterArr.find((fm: any) =>
        fm?.fabricCode === fabricCode || fm?.fabricCode === fabricCode?.trim()
      );
      const resolvedDirectFabricMasterId = Number(line.fabricMasterId || fabricMaster?.id || fabricMaster?.fabricMasterId || 0);
      const resolvedProductFabricMasterId = resolveFabricMasterIdFromProductName(productName);
      const fabricMasterId = !Number.isNaN(resolvedDirectFabricMasterId) && resolvedDirectFabricMasterId > 0
        ? resolvedDirectFabricMasterId
        : resolvedProductFabricMasterId ?? 0;

      return {
        id: Date.now() + index,
        productName: productName || 'No Description',
        quantity,
        uom,
        rate,
        amount: totalAmount,
        gstPercent,
        taxableAmount,
        gstAmount,
        totalAmount,
        isReadOnlyQuantity: true,
        noOfRolls: line.noOfRolls,
        hsnCode: '',
        yarnChallanId: 0,
        yarnChallanNo: '',
        packingListNo: line.rollNo || '',
        fabricMasterId: fabricMasterId,
      };
    });

    // const newItems: InvoiceItem[] = packingSelected.map((line: PackingLine, index: number) => {
    //   const [fabricCode, quality] = line.fabricCodeQuality.split(' - ');
    //   const productName = `${fabricCode || ''} - ${quality || ''}`.trim();
    //   const quantity = Number(line.quantity) || 0;
    //   const derivedRate = deriveRateFromSalesOrder(productName);
    //   const derivedUom = deriveUomFromSalesOrder(productName);
    //   const jobworkDetails = isJobwork ? deriveWeavingOrderItemDetails(line) : null;
    //   const rate = jobworkDetails?.rate ?? derivedRate ?? roundToTwoDecimals(Number(line.rate) || 0);
    //   const uom = jobworkDetails?.uom ?? derivedUom ?? (line.uom || 'Mtrs');
    //   const gstPercent = Number(gstPerc || line.gstPercent || 0);
    //   const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);

    //   const fabricMaster = fabricMasterArr.find((fm: any) => 
    //     fm?.fabricCode === fabricCode || fm?.fabricCode === fabricCode?.trim()
    //   );
    //   const fabricMasterId = line.fabricMasterId || fabricMaster?.id || 0;

    //   return {
    //     id: Date.now() + index,
    //     productName: productName || line.fabricCodeQuality,
    //     quantity,
    //     uom,
    //     rate,
    //     amount: totalAmount,
    //     gstPercent,
    //     taxableAmount,
    //     gstAmount,
    //     totalAmount,
    //     isReadOnlyQuantity: true,
    //     fabricMasterId: fabricMasterId,
    //     packingListNo: line.rollNo || '',
    //     noOfRolls: line.noOfRolls,
    //     hsnCode: '',
    //     yarnChallanId: 0,
    //     yarnChallanNo: ''
    //   };
    // });
    setInvoiceData(prev => ({ ...prev, items: mergeInvoiceItems(prev.items, newItems) }));
    setSelectedPackingIds([]);
    setShowPackingModal(false);
  };

  const handleItemChange = (id: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item;
        let updatedItem = { ...item, [field]: value };

        const quantity = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
        let rate = field === 'rate' ? roundToTwoDecimals(Number(value) || 0) : roundToTwoDecimals(Number(item.rate) || 0);
        const gstPercent = field === 'gstPercent' ? value : Number(item.gstPercent);

        if (field === 'productName') {
          const derivedDetails = deriveSalesOrderItemDetails(String(value || ''));
          if (derivedDetails?.rate != null) {
            rate = derivedDetails.rate;
            updatedItem = { ...updatedItem, rate: derivedDetails.rate };
          }
          if (derivedDetails?.uom) {
            updatedItem = { ...updatedItem, uom: derivedDetails.uom };
          }
        }

        const { taxableAmount, gstAmount, totalAmount } = computeItemAmounts(quantity, rate, gstPercent);
        if (totalAmount > 4900000) {
          toast.error('Total Amount should not exceed 49,00,000 (49 Lakhs)');
        }
        updatedItem = {
          ...updatedItem,
          quantity,
          rate,
          gstPercent,
          taxableAmount,
          gstAmount,
          totalAmount,
          amount: totalAmount,
        };
        return updatedItem;
      }),
    }));
  };

  const removeItem = (id: number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Recompute saved Add/Disc amounts when taxable changes
  useEffect(() => {
    setAddDiscItems(prev => prev.map(item => {
      const sign = item.type === 'discount' ? -1 : 1;
      if (item.mode === 'percentage') {
        const basis = Number(item.percValue) || 0;
        const amt = sumTaxable * (basis / 100) * sign;
        return { ...item, amount: Math.round(amt * 100) / 100 };
      } else {
        const val = Number(item.percValue) || 0;
        const amt = Math.abs(val) * sign;
        return { ...item, amount: Math.round(amt * 100) / 100 };
      }
    }));
  }, [sumTaxable]);

  // Keep Additional/Discount sections in sync only when there are saved items
  useEffect(() => {
    if (addDiscItems.length > 0) {
      setInvoiceData(prev => ({
        ...prev,
        additional: Math.round(addSumAbs * 100) / 100,
        less: Math.round(discSumAbs * 100) / 100,
      }));
    }
  }, [addSumAbs, discSumAbs, addDiscItems.length]);

  // Auto-calculate Round Off to nearest integer of pre-round total
  useEffect(() => {
    if (invoiceDetail) return;
    if (isRoundOffLocked) return;
    const raw = sumTaxable + sumGst + netAddDisc;
    const ro = Math.round(raw) - raw;
    setRoundOff(Math.round(ro * 100) / 100);
  }, [sumTaxable, sumGst, netAddDisc, isRoundOffLocked, invoiceDetail]);

  const addAddDiscItem = () => {
    const all = [...addDiscItems, ...addDiscDrafts];
    const newId = all.length > 0 ? Math.max(...all.map(item => item.id)) + 1 : 1;

    const newItem: AddDiscItem = {
      id: newId,
      description: '',
      type: 'addition',
      mode: 'value',
      percValue: 0,
      amount: 0
    };

    setAddDiscDrafts(prev => [...prev, newItem]);
  };

  const handleAddDiscDraftChange = (id: number, field: keyof AddDiscItem, value: any) => {
    setAddDiscDrafts(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value } as AddDiscItem;
        const sign = updated.type === 'discount' ? -1 : 1;

        if (updated.mode === 'percentage') {
          const basisValue = Number(updated.percValue) || 0;
          const amt = sumTaxable * (basisValue / 100) * sign;
          updated.amount = Math.round(amt * 100) / 100;
        } else {
          if (field === 'percValue') {
            const amt = Number(value) || 0;
            updated.amount = Math.round((Math.abs(amt) * sign) * 100) / 100;
          } else if (field === 'type' || field === 'mode') {
            const val = Number(updated.percValue) || 0;
            updated.amount = Math.round((Math.abs(val) * sign) * 100) / 100;
          }
        }

        return updated;
      }
      return item;
    }));
  };

  const removeDraftAddDiscItem = (id: number) => {
    setAddDiscDrafts(prev => prev.filter(item => item.id !== id));
  };

  const saveAddDiscDrafts = () => {
    const cleaned = addDiscDrafts.filter(d => (d.description || '').trim() !== '');
    setAddDiscItems(prev => [...prev, ...cleaned]);
    setAddDiscDrafts([]);
  };

  const updateSavedAddDiscItem = (id: number) => {
    const item = addDiscItems.find(i => i.id === id);
    if (!item) return;
    setAddDiscDrafts(prev => [...prev, { ...item }]);
    setAddDiscItems(prev => prev.filter(i => i.id !== id));
  };

  const removeAddDiscItem = (id: number) => {
    setAddDiscItems(prev => prev.filter(item => item.id !== id));
  };

  // const openPackingModal = () => {
  //   if (isYarnSalesInvoiceType) {
  //     if (!selectedYarnSalesOrderId) {
  //       toast.error('Please select Yarn Sales Order first');
  //       return;
  //     }
  //   } else if (isJobwork) {
  //     if (!selectedWeavingWorkOrderId) {
  //       toast.error('Please select Weaving Order first');
  //       return;
  //     }
  //   } else {
  //     if (!selectedSalesOrder) {
  //       toast.error('Please select Sales Order first');
  //       return;
  //     }
  //   }

  //   if (!selectedValues.warehouseId) {
  //     toast.error('Please select Warehouse first');
  //     return;
  //   }

  //   dispatch(getAllGeneratePacking({
  //     companyId: selectedCompanyId ?? loggedInCompanyId ?? undefined,
  //     salesOrderId: !isJobwork && !isYarnSalesInvoiceType ? selectedSalesOrder : undefined,
  //     weavingWorkOrderId: isJobwork ? selectedWeavingWorkOrderId : undefined,
  //     yarnSalesOrderId: isYarnSalesInvoiceType ? selectedYarnSalesOrderId : undefined,
  //     warehouseId: selectedValues.warehouseId
  //   }));

  //   setShowPackingModal(true);
  // };
  const openPackingModal = () => {
    if (isYarnSalesInvoiceType) {
      if (!selectedYarnSalesOrderId) {
        toast.error('Please select Yarn Sales Order first');
        return;
      }
    } else if (isJobwork) {
      if (!selectedWeavingWorkOrderId) {
        toast.error('Please select Weaving Order first');
        return;
      }
    } else if (isSizingSalesInvoiceType) {
      if (!selectedSizingWorkOrderId) {
        toast.error('Please select Sizing Work Order first');
        return;
      }
    } else {
      if (!selectedSalesOrder) {
        toast.error('Please select Sales Order first');
        return;
      }
    }

    if (!isBrushedPiece && !selectedValues.warehouseId) {
      toast.error('Please select Warehouse first');
      return;
    }

    // Build filter parameters
    const filterParams: any = {
      companyId: selectedCompanyId ?? loggedInCompanyId ?? undefined,
      ...(isBrushedPiece ? {} : { warehouseId: selectedValues.warehouseId })
    };

    // Add order-specific filters
    if (isJobwork) {
      filterParams.weavingWorkOrderId = selectedWeavingWorkOrderId;
      filterParams.isJobwork = 1;
    } else if (isYarnSalesInvoiceType) {
      filterParams.yarnSalesOrderId = selectedYarnSalesOrderId;
    } else if (isSizingSalesInvoiceType) {
      filterParams.sizingOrderId = selectedSizingWorkOrderId;
    } else {
      filterParams.salesOrderId = selectedSalesOrder;
      filterParams.isJobwork = 0;
    }

    console.log('Fetching packing with filters:', filterParams);

    // Fetch with proper filters
    if (isSizingSalesInvoiceType) {
      dispatch(getAllSizingBeamOutward({ companyId: selectedCompanyId ?? loggedInCompanyId ?? undefined }));
    } else {
      dispatch(getAllGeneratePacking(filterParams));
    }

    setShowPackingModal(true);
  };

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg" id="invoice-content">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className=" px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-4 mb-3">                                         <Button
                variant="outline"
                onClick={() => navigate("/transaction/invoice-management")}
                className="mr-auto"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
              </div>
              <FileText className="h-6 w-6 text-blue-600" />

              <h1 className="text-xl font-semibold text-gray-900">Invoice</h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={downloadInvoice}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center space-x-1 text-sm hover:bg-gray-200"
              >
                <Printer className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              <button className="px-3 py-2 bg-red-600 text-white rounded-md flex items-center space-x-1 text-sm hover:bg-red-700" onClick={() => navigate("/transaction/invoice-management")}>
                <Trash2 className="h-4 w-4" />
                <span>Cancel Invoice</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="mt-10">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Invoice header section */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  By <span className="text-red-500">*</span>
                </label>
                <div className="flex mb-4">
                  <select
                    className="rounded-l-md border border-r-0 border-gray-300 py-2 px-3 text-sm w-full focus:ring-blue-500 focus:border-blue-500"
                    value={invoiceData.byType || 'Manufacturer'}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setInvoiceData(prev => {
                        const next = { ...prev, byType: newType };
                        if (newType === 'Manufacturer' && companyInfo) {
                          const companyData = companyInfo;
                          const addressArr = companyData?.address || companyData?.data?.address || [];
                          const defaultAddr = Array.isArray(addressArr)
                            ? addressArr.find((a: any) => a.isDefault) || addressArr[0]
                            : null;
                          const stateName = defaultAddr?.stateId ? getStateName(String(defaultAddr.stateId), stateList) : '';
                          const parts: string[] = [];
                          if (defaultAddr?.line1) parts.push(String(defaultAddr.line1));
                          if (stateName) parts.push(stateName);
                          if (defaultAddr?.pinCode) parts.push(`\n PIN: ${defaultAddr.pinCode}`);
                          const gstNo = companyData?.gstNo || companyData?.data?.gstNo || '';
                          if (gstNo) parts.push(`\n GST: ${gstNo}`);
                          const name = companyData?.companyName || companyData?.data?.companyName || '';
                          next.manufacturer = {
                            name: name,
                            address: parts.join(', ')
                          };
                        }
                        return next;
                      });
                    }}
                  >
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Other">Other</option>
                  </select>
                  <button className="bg-gray-100 border border-gray-300 rounded-r-md p-2">
                    <ChevronsUpDown className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    value={invoiceData.byType === 'Manufacturer'
                      ? `${invoiceData.manufacturer.name}\n${invoiceData.manufacturer.address}`
                      : invoiceData.manufacturer.address
                    }
                    onChange={(e) => {
                      if (invoiceData.byType === 'Other') {
                        setInvoiceData(prev => ({
                          ...prev,
                          manufacturer: {
                            ...prev.manufacturer,
                            address: e.target.value
                          }
                        }));
                      }
                    }}
                    readOnly={invoiceData.byType === 'Manufacturer'}
                    placeholder={invoiceData.byType === 'Other' ? "Enter address details..." : ""}
                  />
                  {showManufacturerLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                    </div>
                  )}
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  value={invoiceData.comments}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, comments: e.target.value }))}
                />



                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle no</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={invoiceData.vehicleNo}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, vehicleNo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Terms</label>
                    <CommonSearchableSelect
                      name="delivery-terms"
                      className="w-full"
                      options={shipmentTermOptions}
                      placeholder="Select Delivery Terms"
                      value={selectedValues.shipmentTermsId || ''}
                      onValueChange={(value) => handleSelectChange('shipmentTermsId', value)}
                      filterActive
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LR NO</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={invoiceData.lrNo}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, lrNo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LR DATE</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={invoiceData.lrDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, lrDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={invoiceData.deliveryNote}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, deliveryNote: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Note Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={invoiceData.deliveryNoteDate || ''}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, deliveryNoteDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={invoiceData.destination || ''}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, destination: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Brushed Piece checkbox visible for Admin, hidden for other roles */}
                {user?.role === 'Admin' && (
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="brushed-piece"
                      checked={isBrushedPiece}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsBrushedPiece(checked);
                        if (checked) {
                          setSelectedValues(prev => ({ ...prev, warehouseId: '' }));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="brushed-piece" className="text-sm font-medium text-gray-700">
                      Invoice For Brushed Piece
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="flex">
                    <input
                      type="date"
                      className="rounded-l-md border border-r-0 border-gray-300 py-2 px-3 text-sm w-full focus:ring-blue-500 focus:border-blue-500"
                      value={invoiceData.date}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
                    />
                    <button className="bg-gray-100 border border-gray-300 rounded-r-md p-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={invoiceData.invoiceNo}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNo: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    name="invoice-type"
                    className="w-full"
                    options={invoiceTypeSelectOptions}
                    placeholder="Select Invoice Type"
                    value={selectedInvoiceTypeId || ''}
                    onValueChange={handleInvoiceTypeChange}
                    filterActive
                  />
                </div>

                {shouldShowSalesOrders && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
                    <CommonSearchableSelect
                      name="sales-order"
                      className="w-full"
                      options={salesOrderSelectOptions}
                      placeholder="Select Sales Order"
                      value={selectedSalesOrder || ''}
                      onValueChange={handleSalesOrderChange}
                      filterActive
                    />
                  </div>
                )}

                {shouldShowYarnSalesOrders && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
                    <CommonSearchableSelect
                      name="yarn-sales-order"
                      className="w-full"
                      options={yarnSalesOrderSelectOptions}
                      placeholder="Select Yarn Sales Order"
                      value={selectedYarnSalesOrderId || ''}
                      onValueChange={handleYarnSalesOrderChange}
                      filterActive
                    />
                  </div>
                )}

                {shouldShowSizingOrders && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
                    <CommonSearchableSelect
                      name="sizing-work-order"
                      className="w-full"
                      options={sizingWorkOrderSelectOptions}
                      placeholder="Select Sizing Work Order"
                      value={selectedSizingWorkOrderId || ''}
                      onValueChange={handleSizingWorkOrderChange}
                      filterActive
                    />
                  </div>
                )}

                {shouldShowWeavingOrders && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order No <span className="text-red-500">*</span></label>
                    <CommonSearchableSelect
                      name="weaving-order"
                      className="w-full"
                      options={weavingOrderSelectOptions}
                      placeholder="Select Weaving Order"
                      value={selectedWeavingWorkOrderId || ''}
                      onValueChange={handleWeavingOrderChange}
                      filterActive
                    />
                  </div>
                )}

                {isBrushedPiece && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packing List No</label>
                    <CommonSearchableSelect
                      name="packing-list-no"
                      className="w-full"
                      options={packingListNoOptions}
                      placeholder="Select Packing List"
                      value={selectedPackingListNo || ''}
                      onValueChange={handlePackingListNoChange}
                      filterActive
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company's Bank</label>
                  <CommonSearchableSelect
                    name="company-bank"
                    className="w-full"
                    options={bankOptions}
                    placeholder="Select Bank"
                    value={selectedValues.companyBankId || ''}
                    onValueChange={(value) => handleSelectChange('companyBankId', value)}
                    filterActive
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms And Conditions <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    name="terms-conditions"
                    className="w-full"
                    options={termsConditionsOptions}
                    filterActive
                    placeholder="Select Terms and Conditions"
                    value={selectedValues.termsConditionsId || ''}
                    onValueChange={(value) => handleSelectChange('termsConditionsId', value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms <span className="text-red-500">*</span></label>
                  <CommonSearchableSelect
                    name="payment-terms"
                    className="w-full"
                    options={paymentTermOptions}
                    placeholder="Select Payment Terms"
                    value={selectedValues.paymentTermsId || ''}
                    onValueChange={(value) => handleSelectChange('paymentTermsId', value)}
                    filterActive
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ship Via <span className="text-red-500">*</span>
                  </label>
                  <CommonSearchableSelect
                    name="ship-via"
                    className="w-full"
                    options={shipmentModeOptions}
                    placeholder="Select Shipment Mode"
                    value={selectedValues.shipmentMode || ''}
                    onValueChange={(value) => handleSelectChange('shipmentMode', value)}
                    filterActive
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transport Name</label>
                  <CommonSearchableSelect
                    name="transport-name"
                    className="w-full"
                    options={transportOptions}
                    placeholder="Select Transport"
                    value={selectedValues.transportId || ''}
                    onValueChange={(value) => {
                      handleSelectChange('transportId', value);
                      const selectedTransport = transportsArr?.find((t: any) => String(t.id) === String(value));
                      if (selectedTransport) {
                        setInvoiceData(prev => ({ ...prev, transportName: selectedTransport.transportName || '' }));
                      } else {
                        setInvoiceData(prev => ({ ...prev, transportName: '' }));
                      }
                    }}
                    filterActive
                  />
                </div>

                {!isBrushedPiece && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse <span className="text-red-500">*</span></label>
                    <CommonSearchableSelect
                      name="warehouse"
                      className="w-full"
                      options={warehouseOptions}
                      placeholder="Select Warehouse"
                      value={selectedValues.warehouseId || ''}
                      onValueChange={(value) => handleSelectChange('warehouseId', value)}
                      filterActive
                    />
                  </div>
                )}

                {!isBrushedPiece && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                    <CommonSearchableSelect
                      name="agent"
                      className="w-full"
                      options={agentOptions}
                      placeholder="Select Agent"
                      value={selectedValues.agentId || ''}
                      onValueChange={(value) => handleSelectChange('agentId', value)}
                      filterActive
                    />
                  </div>
                )}

                {!isInternationalInvoiceType && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
                      <select
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                        value={selectedValues.gstType}
                        onChange={(e) => handleSelectChange('gstType', e.target.value)}
                        disabled
                      >
                        <option value="">Auto (from SO)</option>
                        <option value="1">CGST/SGST</option>
                        <option value="2">IGST</option>
                      </select>
                    </div>
                    {selectedValues.gstType === '1' && (
                      <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CGST %</label>
                          <input type="number" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-gray-100" value={cgstPerc} readOnly />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SGST %</label>
                          <input type="number" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-gray-100" value={sgstPerc} readOnly />
                        </div>
                      </div>
                    )}
                    {selectedValues.gstType === '2' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IGST %</label>
                        <input type="number" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm bg-gray-100" value={igstPerc} readOnly />
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>

            {/* Buyer and Consignee section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buyer <span className="text-red-500">*</span>
                </label>
                <div className="mb-2">
                  <CommonSearchableSelect
                    name="buyer"
                    className="w-full"
                    options={buyerOptions}
                    placeholder="Select a Buyer"
                    value={selectedValues.customerId || ''}
                    onValueChange={(value) => handleSelectChange('customerId', value)}
                    filterActive
                  />
                </div>
                <div className="relative">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={invoiceData.buyer.address}
                    readOnly
                  />
                  {isBuyerAddressLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consignee <span className="text-red-500">*</span>
                </label>
                <div className="mb-2">
                  <CommonSearchableSelect
                    name="consignee"
                    className="w-full"
                    options={consigneeOptions}
                    placeholder="Select a Consignee"
                    value={selectedValues.consgineeId || ''}
                    onValueChange={(value) => handleSelectChange('consgineeId', value)}
                    filterActive
                  />
                </div>
                <div className="relative">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={invoiceData.consignee.address}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInvoiceData(prev => {
                        const updated = { ...prev.consignee, address: val };
                        updateConsigneeOverride(updated, selectedValues.consgineeId);
                        return { ...prev, consignee: updated };
                      });
                    }}
                  />
                  {isConsigneeAddressLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice items table */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><FileText size={20} />Invoice Item Details</CardTitle>
                  <Button onClick={openPackingModal} className="bg-primary hover:bg-primary text-white px-4 flex items-center">
                    <Plus size={18} className="mr-2" />
                    Add from Packing
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto border-b">
                  <table className="min-w-full table-fixed divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                          Sl. No.
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
                          {isYarnSalesInvoiceType ? 'Yarn Challan No' : isSizingSalesInvoiceType ? 'Sizing Outward No' : 'Packing Slip No'}
                        </th>
                        {isSizingSalesInvoiceType && (
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                            Beam Meters
                          </th>
                        )}
                        {!isYarnSalesInvoiceType && (
                          <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                            {isSizingSalesInvoiceType ? 'No of Beams' : 'No of Rolls'}
                          </th>
                        )}
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[14%]">
                          Product Description <span className="text-red-500">*</span>
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                          HSN Code
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                          UOM
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                          Quantity <span className="text-red-500">*</span>
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                          Rate/Unit <span className="text-red-500">*</span>
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                          GST %
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                          Taxable Amount
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                          GST Amount
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">
                          Total Amount
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoiceData.items.length === 0 ? (
                        <tr>
                          <td colSpan={itemTableColumnCount} className="px-4 py-4 text-center text-sm text-gray-500">
                            No items added. Please add at least one item.
                          </td>
                        </tr>
                      ) : (
                        invoiceData.items.map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {isYarnSalesInvoiceType ? (item.yarnChallanNo || '-') : (item.packingListNo || '-')}
                            </td>
                            {isSizingSalesInvoiceType && (
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                                {item.beamMeters || '-'}
                              </td>
                            )}
                            {!isYarnSalesInvoiceType && (
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                                {item.noOfRolls || '-'}
                              </td>
                            )}
                            <td className="px-4 py-2 whitespace-nowrap">
                              <input
                                type="text"
                                className={`w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${!item.productName ? 'border-red-500' : ''}`}
                                value={item.productName}
                                onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                                required
                              />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={item.hsnCode ?? ''}
                                onChange={(e) => handleItemChange(item.id, 'hsnCode', e.target.value)}
                                min="0"
                              />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <select
                                className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={item.uom}
                                onChange={(e) => handleItemChange(item.id, 'uom', e.target.value)}
                              >
                                {Array.isArray(uomList) && uomList.map((u: any) => (
                                  <option key={u.id} value={u.uomName}>{u.uomName}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <input
                                type="number"
                                className={`w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${item.quantity <= 0 ? 'border-red-500' : ''} ${item.isReadOnlyQuantity ? 'bg-gray-100' : ''}`}
                                value={item.quantity}
                                onChange={(e) => !item.isReadOnlyQuantity && handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                min="0"
                                step="0.01"
                                required
                                readOnly={item.isReadOnlyQuantity}
                              />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <input
                                type="number"
                                className={`w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${item.rate <= 0 ? 'border-red-500' : ''}`}
                                value={item.rate}
                                onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                min="0"
                                step="0.01"
                                required
                              />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={item.gstPercent ?? ''}
                                onChange={(e) => handleItemChange(item.id, 'gstPercent', e.target.value)}
                                min="0"
                              />
                            </td>
                            {/* <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={item.gstPercent}
                                onChange={(e) => handleItemChange(item.id, 'gstPercent', Number(e.target.value))}
                                min="0"
                                step="0.01"
                              />
                            </td> */}

                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                              Rs. {item.taxableAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-center">
                              Rs. {item.gstAmount.toLocaleString()}
                            </td>
                            <td className={`px-4 py-2 whitespace-nowrap text-sm text-center ${item.totalAmount > 4900000 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                              Rs. {item.totalAmount.toLocaleString()}
                              {item.totalAmount > 4900000 && (
                                <p className="text-[11px] text-red-500 font-normal">Exceeds 49 Lakhs</p>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                              {!isYarnSalesInvoiceType && !isSizingSalesInvoiceType && item.packingListNo && (
                                <button
                                  type="button"
                                  onClick={() => setViewingPackingSlipNo(item.packingListNo || null)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                  title="View Packing Info"
                                >
                                  <Eye className="h-4 w-4 inline-block" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Remove Item"
                              >
                                <Trash2 className="h-4 w-4 inline-block" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Addition / Discount table */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><FileText size={20} />Addition / Discount</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button onClick={addAddDiscItem} className="bg-primary hover:bg-primary text-white px-3 py-1 text-xs flex items-center">
                      <Plus size={14} className="mr-1" />
                      Add Row
                    </Button>
                    <Button onClick={saveAddDiscDrafts} className="bg-primary hover:bg-primary text-white px-3 py-1 text-xs">Save</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">S.No</th>
                        <th className="px-3 py-2 text-left font-semibold">Name</th>
                        <th className="px-3 py-2 text-left font-semibold">Type</th>
                        <th className="px-3 py-2 text-left font-semibold">Basis</th>
                        <th className="px-3 py-2 text-left font-semibold">Value/Percentage</th>
                        <th className="px-3 py-2 text-left font-semibold">Amount</th>
                        <th className="px-3 py-2 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {addDiscDrafts.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-3 py-2">
                            <div className="relative">
                              <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={item.description}
                                autoComplete="off"
                                onFocus={() => { setDescSuggestForId(item.id); setDescActiveSuggestionIndex(-1); }}
                                onBlur={() => { setTimeout(() => { setDescSuggestForId((prev) => (prev === item.id ? null : prev)); setDescActiveSuggestionIndex(-1); }, 200); }}
                                onKeyDown={(e) => handleDescKeyDown(e, item.id)}
                                onChange={(e) => handleAddDiscDraftChange(item.id, 'description', e.target.value)}
                              />
                              {descSuggestForId === item.id && getFilteredDescSuggestions(item.description || '').length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                                  {getFilteredDescSuggestions(item.description || '').map((s, sIdx) => (
                                    <li
                                      key={s}
                                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${sIdx === descActiveSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''}`}
                                      onMouseEnter={() => setDescActiveSuggestionIndex(sIdx)}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddDiscDraftChange(item.id, 'description', s); setDescSuggestForId(null); setDescActiveSuggestionIndex(-1); }}
                                    >
                                      {s}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.type}
                              onChange={(e) => handleAddDiscDraftChange(item.id, 'type', e.target.value)}
                              className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="addition">Addition</option>
                              <option value="discount">Discount</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.mode}
                              onChange={(e) => handleAddDiscDraftChange(item.id, 'mode', e.target.value)}
                              className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="value">Value</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                              value={item.percValue}
                              onChange={(e) => handleAddDiscDraftChange(item.id, 'percValue', Number(e.target.value))}
                              step="0.01"
                            />
                          </td>
                          <td className={`px-3 py-2 text-sm text-gray-900 text-center ${item.amount < 0 ? 'text-red-500' : ''}`}>
                            Rs. {Math.abs(item.amount).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeDraftAddDiscItem(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Saved Addition / Discount list */}
            {addDiscItems.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText size={20} />Saved Addition / Discount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">S.No</th>
                          <th className="px-3 py-2 text-left font-semibold">Name</th>
                          <th className="px-3 py-2 text-left font-semibold">Type</th>
                          <th className="px-3 py-2 text-left font-semibold">Basis</th>
                          <th className="px-3 py-2 text-right font-semibold">Value/Percentage</th>
                          <th className="px-3 py-2 text-right font-semibold">Amount</th>
                          <th className="px-3 py-2 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {addDiscItems.map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{index + 1}</td>
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2 capitalize">{item.type}</td>
                            <td className="px-3 py-2">{item.mode === 'percentage' ? 'Percentage' : 'Value'}</td>
                            <td className="px-3 py-2 text-right">{item.mode === 'percentage' ? `${item.percValue}%` : `Rs. ${Math.abs(Number(item.percValue) || 0).toLocaleString()}`}</td>
                            <td className={`px-3 py-2 text-right ${item.type === 'discount' ? 'text-red-600' : ''}`}>Rs. {Math.abs(Number(item.amount) || 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right space-x-2">
                              <Button variant="outline" onClick={() => updateSavedAddDiscItem(item.id)}>Update</Button>
                              <Button variant="destructive" onClick={() => removeAddDiscItem(item.id)}>Delete</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional charges section */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Additional Charges */}
                <div>
                  <h3 className="py-2 px-4 bg-blue-800 text-white text-sm font-medium rounded-t-md">
                    ADDITIONAL CHARGES
                  </h3>
                  <div className="p-4 border border-gray-200 rounded-b-md space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="additional-1"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <label htmlFor="additional-1" className="text-sm text-gray-700">
                        Additional Charge 1
                      </label>
                      <input
                        type="number"
                        className="ml-auto w-32 border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                        placeholder="0.00"
                        value={invoiceData.additional}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Less Charges */}
                <div>
                  <h3 className="py-2 px-4 bg-blue-800 text-white text-sm font-medium rounded-t-md">
                    LESS CHARGES
                  </h3>
                  <div className="p-4 border border-gray-200 rounded-b-md space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="less-1"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <label htmlFor="less-1" className="text-sm text-gray-700">
                        Discount
                      </label>
                      <input
                        type="number"
                        className="ml-auto w-32 border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                        placeholder="0.00"
                        value={invoiceData.less}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
             
            </div>

            {/* Invoice Summary */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText size={20} />Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Taxable Amount</th>
                        <th className="px-3 py-2 text-left font-semibold">GST Amount</th>
                        <th className="px-3 py-2 text-left font-semibold">Addition</th>
                        <th className="px-3 py-2 text-left font-semibold">Discount</th>
                        <th className="px-3 py-2 text-left font-semibold">Round Off</th>
                        <th className="px-3 py-2 text-left font-semibold">Final Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 font-medium">Rs. {formatToTwoDecimalLocale(sumTaxable)}</td>
                        <td className="px-3 py-2">Rs. {formatToTwoDecimalLocale(sumGst)}</td>
                        <td className="px-3 py-2">Rs. {formatToTwoDecimalLocale(addSumAbs)}</td>
                        <td className="px-3 py-2">Rs. {formatToTwoDecimalLocale(discSumAbs)}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            className="w-full border border-gray-300 rounded-md py-1 px-2 text-sm text-right focus:ring-blue-500 focus:border-blue-500"
                            value={roundOff}
                            onChange={(e) => {
                              setIsRoundOffLocked(true);
                              setRoundOff(roundToTwoDecimals(Number(e.target.value) || 0));
                            }}
                            step="0.01"
                          />
                        </td>
                        <td className="px-3 py-2 font-semibold">Rs. {formatToTwoDecimalLocale(finalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-500 mt-2">All totals update live when rows change.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
            </p>
            <button
              onClick={saveInvoice}
              disabled={loading}
              // onClick={sendInvoice}
              // disabled={loading || !isFormValid}
              className={`px-4 py-2 bg-green-600 text-white rounded-md flex items-center space-x-1 text-sm hover:bg-green-700 ${loading ? 'opacity-50 cursor-not-allowed' : (!isFormValid ? 'opacity-75' : '')
                }`}
            >
              <Send className="h-4 w-4" />
              <span>{actionButtonLabel}</span>
            </button>
          </div>
        </footer>

        {/* Packing List Modal */}
        {showPackingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl max-h-[80vh] overflow-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Select Packing List - Pop up</h2>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <PopupDataTable
                  columns={
                    isYarnSalesInvoiceType
                      ? yarnColumns
                      : isSizingSalesInvoiceType
                        ? sizingColumns
                        : generalColumns
                  }
                  data={modalSelectableLines}
                  emptyMessage={
                    !selectedValues.warehouseId
                      ? 'Please select a warehouse first'
                      : (isJobwork && !selectedWeavingWorkOrderId)
                        ? 'Please select a weaving order first'
                        : (isYarnSalesInvoiceType && !selectedYarnSalesOrderId)
                          ? 'Please select a yarn sales order first'
                          : (!isJobwork && !isYarnSalesInvoiceType && !selectedSalesOrder)
                            ? 'Please select a sales order first'
                            : 'No packing lists found for the selected criteria'
                  }
                />
              </div>
              <div className="p-6 border-t flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowPackingModal(false)}>
                  Cancel
                </Button>
                <Button onClick={importSelected}>
                  Submit
                </Button>
              </div>
            </div>
          </div>
        )}

            {/* View Packing List details popup */}
            {viewingPackingSlipNo && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                  {/* Modal Header */}
                  <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FileText size={22} className="text-blue-600" />
                      Packing Slip Details: <span className="text-blue-600 font-extrabold">{viewingPackingSlipNo}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setViewingPackingSlipNo(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {!viewingPackingRecord ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        Packing list data for <span className="font-semibold">{viewingPackingSlipNo}</span> not found.
                      </div>
                    ) : (
                      <>
                        {/* Grid of basic packing list information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-6 rounded-xl border border-slate-200">
                          {/* Packing No */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Packing No</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.packingSlipNo || '-'}
                            </span>
                          </div>

                          {/* Cloth Date */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Cloth Date</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.packingDate ? new Date(viewingPackingRecord.packingDate).toLocaleDateString() : '-'}
                            </span>
                          </div>

                          {/* Order Type & Brushed Pieces Only Checkbox */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">Order Type</span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                <input
                                  type="checkbox"
                                  checked={Boolean(viewingPackingRecord.isBrushChecked)}
                                  disabled
                                  className="h-3.5 w-3.5 text-blue-600 border-blue-300 rounded cursor-not-allowed"
                                />
                                Brushed Pieces Only
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.orderType || (viewingPackingRecord.orderTypeId === 1 ? 'Weaving Order' : viewingPackingRecord.orderTypeId === 2 ? 'Sales Order' : viewingPackingRecord.orderTypeId === 3 ? 'Yarn Sales' : viewingPackingRecord.orderTypeId === 4 ? 'Sizing Order' : '-')}
                            </span>
                          </div>

                          {/* Sales Order No */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Sales Order No</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {resolveSalesOrderNo(viewingPackingRecord.salesOrderId) || viewingPackingRecord.salesOrderNo || '-'}
                            </span>
                          </div>

                          {/* Buyer Name */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Buyer Name</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {resolveBuyerName(viewingPackingRecord.buyerId) || viewingPackingRecord.buyerName || '-'}
                            </span>
                          </div>

                          {/* Delivery At (Select from Consignee Master) */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Delivery At (Consignee)</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {resolveConsigneeName(viewingPackingRecord.deliveryAtId || viewingPackingRecord.consigneeId) || viewingPackingRecord.deliveryAt || '-'}
                            </span>
                          </div>

                          {/* Sort No */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Sort No</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {resolveFabricCode(viewingPackingRecord.fabricMasterId) || viewingPackingRecord.fabricCode || '-'}
                            </span>
                          </div>

                          {/* Fabric Quality */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Construction</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {resolveFabricQuality(viewingPackingRecord.fabricMasterId) || viewingPackingRecord.fabricQuality || '-'}
                            </span>
                          </div>

                          {/* PO No */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">PO No</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.poNo || '-'}
                            </span>
                          </div>

                          {/* PO Date */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">PO Date</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.poDate ? new Date(viewingPackingRecord.poDate).toLocaleDateString() : '-'}
                            </span>
                          </div>

                          {/* DC No */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">DC No</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.dcNo || '-'}
                            </span>
                          </div>

                          {/* Transport Name */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Transport Name</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {resolveTransportName(viewingPackingRecord.transportId) || viewingPackingRecord.transportName || '-'}
                            </span>
                          </div>

                          {/* Truck No */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Truck No</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.truckNo || '-'}
                            </span>
                          </div>

                          {/* LR No */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">LR No</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.lrNo || '-'}
                            </span>
                          </div>

                          {/* LR Date */}
                          <div>
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">LR Date</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.lrDate ? new Date(viewingPackingRecord.lrDate).toLocaleDateString() : '-'}
                            </span>
                          </div>

                          {/* Product Description */}
                          <div className="md:col-span-3">
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Product Description</span>
                            <span className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-md block shadow-sm min-h-[38px] leading-tight">
                              {viewingPackingRecord.productDescription || viewingPackingRecord.remarks || '-'}
                            </span>
                          </div>
                        </div>


                        {/* Piece Details Table */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                            Piece Details List
                          </h4>
                          <div className="overflow-x-auto border rounded-lg max-h-[35vh]">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Piece No</th>
                                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Length (Mtrs)</th>
                                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Weight (Kgs)</th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {!viewingPackingRecord.items || viewingPackingRecord.items.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-4 text-center text-gray-500 text-xs">
                                      No piece records found.
                                    </td>
                                  </tr>
                                ) : (
                                  viewingPackingRecord.items.map((item: any, idx: number) => (
                                    <tr key={item.id || idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 whitespace-nowrap text-gray-900">{idx + 1}</td>
                                      <td className="px-4 py-2 whitespace-nowrap text-gray-900">{item.rollNo || '-'}</td>
                                      <td className="px-4 py-2 whitespace-nowrap text-gray-900">{item.pieceNo || '-'}</td>
                                      <td className="px-4 py-2 whitespace-nowrap text-right text-gray-900">
                                        {(item.length || item.meters || 0).toFixed(2)}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-right text-gray-900">
                                        {(item.pounds || item.netWeight || item.weight || 0).toFixed(2)}
                                      </td>
                                      <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate" title={item.remarks}>
                                        {item.remarks || '-'}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t flex justify-end bg-gray-50">
                    <Button onClick={() => setViewingPackingSlipNo(null)} className="px-5 bg-gray-800 hover:bg-gray-900 text-white">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
   </div>
      );
}