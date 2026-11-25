export interface BuyerInfo {
  id: number;
  name: string;
}

export interface RollDetail {
  rollNo: string;
  meters: number;
  netWeight: number;
  grossWeight: number;
  isDispatched?: boolean;
}

export interface PackingListDetail {
  id: number;
  invoiceId: number;
  packingListNo: string;
  fabricCode: string;
  quality: string;
  totalMeters: number;
  netWeight: number;
  grossWeight: number;
  rolls: RollDetail[];
}

export interface InvoiceInfo {
  id: number;
  invoiceNo: string;
  salesOrderNo: string;
  buyerId: number;
  packingListIds: number[];
  isLoaded: boolean;
}

export interface DispatchRegisterRecord {
  id: number;
  buyerId: number;
  buyerName: string;
  salesOrderNo: string;
  invoiceNo: string;
  packingListNos: string[];
  fabricDetails: string;
  invoiceId: number;
}

export const buyers: BuyerInfo[] = [
  { id: 1, name: 'North Star Textiles' },
  { id: 2, name: 'Harmony Mills' },
  { id: 3, name: 'Summit Fabric Works' },
];

export const packingLists: PackingListDetail[] = [
  {
    id: 1,
    invoiceId: 101,
    packingListNo: 'PL-101-A',
    fabricCode: 'TX-R1001',
    quality: 'Premium Satin',
    totalMeters: 5600,
    netWeight: 210,
    grossWeight: 230,
    rolls: [
      { rollNo: 'TX-1001-001', meters: 800, netWeight: 32, grossWeight: 34 },
      { rollNo: 'TX-1001-002', meters: 900, netWeight: 34, grossWeight: 36 },
      { rollNo: 'TX-1001-003', meters: 700, netWeight: 28, grossWeight: 31 },
      { rollNo: 'TX-1001-004', meters: 1200, netWeight: 45, grossWeight: 48 },
    ],
  },
  {
    id: 2,
    invoiceId: 101,
    packingListNo: 'PL-101-B',
    fabricCode: 'TX-R1002',
    quality: 'Textured Twill',
    totalMeters: 4800,
    netWeight: 190,
    grossWeight: 206,
    rolls: [
      { rollNo: 'TX-1002-001', meters: 1100, netWeight: 39, grossWeight: 43 },
      { rollNo: 'TX-1002-002', meters: 900, netWeight: 32, grossWeight: 35 },
      { rollNo: 'TX-1002-003', meters: 700, netWeight: 26, grossWeight: 29 },
      { rollNo: 'TX-1002-004', meters: 2100, netWeight: 93, grossWeight: 99 },
    ],
  },
  {
    id: 3,
    invoiceId: 102,
    packingListNo: 'PL-102-A',
    fabricCode: 'TX-R2001',
    quality: 'Herringbone Satin',
    totalMeters: 5300,
    netWeight: 198,
    grossWeight: 215,
    rolls: [
      { rollNo: 'TX-2001-001', meters: 900, netWeight: 36, grossWeight: 38 },
      { rollNo: 'TX-2001-002', meters: 1100, netWeight: 43, grossWeight: 45 },
      { rollNo: 'TX-2001-003', meters: 800, netWeight: 31, grossWeight: 34, isDispatched: true },
      { rollNo: 'TX-2001-004', meters: 1500, netWeight: 65, grossWeight: 69 },
    ],
  },
  {
    id: 4,
    invoiceId: 102,
    packingListNo: 'PL-102-B',
    fabricCode: 'TX-R2002',
    quality: 'Double Face',
    totalMeters: 3600,
    netWeight: 132,
    grossWeight: 142,
    rolls: [
      { rollNo: 'TX-2002-001', meters: 900, netWeight: 32, grossWeight: 34 },
      { rollNo: 'TX-2002-002', meters: 800, netWeight: 29, grossWeight: 31 },
      { rollNo: 'TX-2002-003', meters: 1900, netWeight: 70, grossWeight: 77 },
    ],
  },
  {
    id: 5,
    invoiceId: 103,
    packingListNo: 'PL-103-A',
    fabricCode: 'TX-R3001',
    quality: 'Denim Wash',
    totalMeters: 4200,
    netWeight: 172,
    grossWeight: 185,
    rolls: [
      { rollNo: 'TX-3001-001', meters: 1000, netWeight: 42, grossWeight: 45 },
      { rollNo: 'TX-3001-002', meters: 1100, netWeight: 45, grossWeight: 48 },
      { rollNo: 'TX-3001-003', meters: 1000, netWeight: 40, grossWeight: 43 },
      { rollNo: 'TX-3001-004', meters: 1100, netWeight: 45, grossWeight: 49 },
    ],
  },
];

const initialInvoices: InvoiceInfo[] = [
  { id: 101, invoiceNo: 'INV-2026-101', salesOrderNo: 'SO-8001', buyerId: 1, packingListIds: [1, 2], isLoaded: false },
  { id: 102, invoiceNo: 'INV-2026-102', salesOrderNo: 'SO-8032', buyerId: 2, packingListIds: [3, 4], isLoaded: false },
  { id: 103, invoiceNo: 'INV-2026-103', salesOrderNo: 'SO-8105', buyerId: 3, packingListIds: [5], isLoaded: false },
];

export const scanDispatchInvoices = initialInvoices;

const buyerLookup = buyers.reduce<Record<number, string>>((acc, buyer) => {
  acc[buyer.id] = buyer.name;
  return acc;
}, {});

export const dispatchRegisterRecords: DispatchRegisterRecord[] = initialInvoices.map((invoice, index) => {
  const associatedLists = packingLists.filter((pl) => invoice.packingListIds.includes(pl.id));
  const fabricSet = Array.from(
    new Set(associatedLists.map((pl) => `${pl.fabricCode} / ${pl.quality}`)),
  );
  return {
    id: index + 1,
    buyerId: invoice.buyerId,
    buyerName: buyerLookup[invoice.buyerId] ?? 'Unknown',
    salesOrderNo: invoice.salesOrderNo,
    invoiceNo: invoice.invoiceNo,
    invoiceId: invoice.id,
    packingListNos: associatedLists.map((pl) => pl.packingListNo),
    fabricDetails: fabricSet.join(', '),
  };
});
